// Child sign-in by first name + one-time code.
//
// Parent side: issue a code (RLS + issue_child_login_code enforce that you may
// only do this for your own child).
// Child side:  redeem it through the child-login Edge Function, which is the
// only place holding the service role needed to mint a session.

import { supabase, isSupabaseConfigured } from './supabase';

/** Codes are valid for this long. Mirrors the interval in migration 015. */
export const CHILD_CODE_TTL_SECONDS = 120;

export interface IssuedChildCode {
  code: string;
  expiresAt: string;
  childName: string;
}

/**
 * Parent app: issue a fresh sign-in code for one of your children.
 * Any previous unused code for that child is invalidated.
 */
export async function issueChildLoginCode(childId: string): Promise<IssuedChildCode | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  }).rpc('issue_child_login_code', { p_child_id: childId });

  if (error) {
    console.warn('[childLogin] could not issue code:', error.message);
    return null;
  }

  const row = (data as Array<{ code: string; expires_at: string; child_name: string }> | null)?.[0];
  if (!row) return null;

  return { code: row.code, expiresAt: row.expires_at, childName: row.child_name };
}

/** Seconds remaining before a code expires, floored at 0. */
export function secondsUntil(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export interface ChildLoginResult {
  success: boolean;
  error?: string;
  childName?: string;
  childId?: string;
  /** Kept so the device can switch back to this child without another code. */
  refreshToken?: string;
}

/**
 * Swap the active Supabase session to an already-linked child.
 *
 * Uses the stored refresh token, so no new code is needed — this is what makes
 * "switch child" work on a shared family device. Refresh tokens rotate, so the
 * caller must persist the returned one.
 */
export async function activateLinkedChild(
  refreshToken: string
): Promise<{ success: boolean; refreshToken?: string }> {
  if (!isSupabaseConfigured()) return { success: false };
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      console.warn('[childLogin] could not restore child session:', error?.message);
      return { success: false };
    }
    return { success: true, refreshToken: data.session.refresh_token };
  } catch (err) {
    console.warn('[childLogin] switch failed:', err);
    return { success: false };
  }
}

/**
 * Child app: exchange first name + code for a real session.
 *
 * The Edge Function returns a one-shot token hash rather than a session, which
 * this then verifies — that keeps session minting inside Supabase's own auth
 * rather than having the function hand out tokens it forged itself.
 */
export async function redeemChildLoginCode(firstName: string, code: string): Promise<ChildLoginResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Not connected. Please try again later.' };
  }

  const generic = "That code didn't work. Ask your parent for a new one.";

  try {
    const { data, error } = await supabase.functions.invoke('child-login', {
      body: { firstName: firstName.trim(), code: code.trim() },
    });

    if (error || !data?.tokenHash) {
      return { success: false, error: generic };
    }

    const { data: verified, error: verifyErr } = await supabase.auth.verifyOtp({
      token_hash: data.tokenHash as string,
      type: 'email',
    });

    if (verifyErr || !verified?.session) {
      console.warn('[childLogin] verifyOtp failed:', verifyErr?.message);
      return { success: false, error: generic };
    }

    return {
      success: true,
      childName: data.childName as string | undefined,
      childId: data.childId as string | undefined,
      // Stored by the caller so this child can be switched back to later
      // without needing a fresh code.
      refreshToken: verified.session.refresh_token,
    };
  } catch (err) {
    console.warn('[childLogin] redeem failed:', err);
    return { success: false, error: generic };
  }
}
