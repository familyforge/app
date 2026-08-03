// Family sharing — the cloud half.
//
// `give-access` could always invite a partner, co-parent, guardian or nanny and
// print a code, but family-store never spoke to the database. The invite lived
// only in the inviter's own AsyncStorage, so `family_members` stayed empty and
// nobody could ever join. This is the missing half.
//
// Access itself is enforced by RLS (migration 023), not here: an accepted member
// reads the family's children and tasks because the policies allow it, and a
// stranger gets zero rows however they ask.

import { supabase, isSupabaseConfigured } from './supabase';
import type { AccessType, MemberPermissions } from '../state/family-store';

// The generated types now cover every table, so the typed client is used
// directly — the untyped alias that stale types forced is gone.
const db = supabase;

export interface CloudFamilyMember {
  id: string;
  name: string;
  email: string;
  accessType: AccessType;
  status: 'pending' | 'accepted' | 'declined';
  inviteCode: string | null;
  expiresAt: string | null;
  childIds: string[] | null;
  permissions: Partial<MemberPermissions>;
  acceptedAt: string | null;
}

/** Short, unambiguous code. No O/0/I/1 — these get read aloud and mistyped. */
function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function mapRow(r: Record<string, unknown>): CloudFamilyMember {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    email: String(r.email ?? ''),
    accessType: (r.role as AccessType) ?? 'guardian',
    status: (r.status as CloudFamilyMember['status']) ?? 'pending',
    inviteCode: (r.invite_code as string) ?? null,
    expiresAt: (r.invite_expires_at as string) ?? null,
    childIds: (r.child_ids as string[]) ?? null,
    permissions: (r.permissions as Partial<MemberPermissions>) ?? {},
    acceptedAt: (r.accepted_at as string) ?? null,
  };
}

/** Everyone in this parent's family, invited or accepted. */
export async function listFamilyMembers(): Promise<CloudFamilyMember[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return [];

    const { data, error } = await db
      .from('family_members')
      .select('*')
      .eq('family_id', auth.user.id)
      .order('created_at');

    if (error) {
      console.warn('[family] list failed:', error.message);
      return [];
    }
    return ((data as Record<string, unknown>[] | null) ?? []).map(mapRow);
  } catch (err) {
    console.warn('[family] list failed:', err);
    return [];
  }
}

export interface InviteInput {
  name: string;
  email: string;
  accessType: AccessType;
  permissions: Partial<MemberPermissions>;
  /** Empty or omitted means every child in the family. */
  childIds?: string[];
  /** Days the code stays valid. */
  validForDays?: number;
}

/**
 * Create an invitation and return the code to share.
 *
 * Longer-lived than a child's 120-second code on purpose: an adult is typically
 * sent this by message and may not act on it for a day or two.
 */
export async function inviteFamilyMember(input: InviteInput): Promise<CloudFamilyMember | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const parentId = auth?.user?.id;
    if (!parentId) return null;

    const expires = new Date();
    expires.setDate(expires.getDate() + (input.validForDays ?? 7));

    const { data, error } = await db
      .from('family_members')
      .insert({
        family_id: parentId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.accessType,
        status: 'pending',
        invite_code: generateCode(),
        invite_expires_at: expires.toISOString(),
        permissions: input.permissions,
        child_ids: input.childIds && input.childIds.length > 0 ? input.childIds : null,
      })
      .select()
      .single();

    if (error) {
      console.warn('[family] invite failed:', error.message);
      return null;
    }
    return mapRow(data as Record<string, unknown>);
  } catch (err) {
    console.warn('[family] invite failed:', err);
    return null;
  }
}

/** Withdraw an invitation, or remove someone who already joined. */
export async function removeFamilyMember(memberId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await db.from('family_members').delete().eq('id', memberId);
    if (error) {
      console.warn('[family] remove failed:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export interface RedeemResult {
  success: boolean;
  error?: string;
  familyId?: string;
  role?: AccessType;
  memberName?: string;
}

/**
 * Join a family with a code.
 *
 * Runs through a SECURITY DEFINER function because the person redeeming is by
 * definition not yet a member — RLS would refuse them the very row they are
 * claiming. The function burns the code, so it cannot be reused.
 */
export async function redeemFamilyInvite(code: string, name: string): Promise<RedeemResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Not connected. Please try again later.' };
  }

  // One message for every failure, so the endpoint cannot be probed for valid
  // codes.
  const generic = "That code didn't work. Ask whoever invited you for a new one.";

  try {
    const { data, error } = await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    }).rpc('redeem_family_invite', { p_code: code.trim(), p_name: name.trim() });

    if (error) return { success: false, error: generic };

    const row = (data as Array<{ family_id: string; role: string; member_name: string }> | null)?.[0];
    if (!row) return { success: false, error: generic };

    return {
      success: true,
      familyId: row.family_id,
      role: row.role as AccessType,
      memberName: row.member_name,
    };
  } catch (err) {
    console.warn('[family] redeem failed:', err);
    return { success: false, error: generic };
  }
}

/** Families this user has joined as a member (not their own). */
export async function listJoinedFamilies(): Promise<Array<{ familyId: string; role: AccessType; name: string }>> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user?.id) return [];

    const { data } = await db
      .from('family_members')
      .select('family_id, role, name')
      .eq('user_id', auth.user.id)
      .eq('status', 'accepted');

    return ((data as Array<{ family_id: string; role: string; name: string }> | null) ?? []).map((r) => ({
      familyId: r.family_id,
      role: r.role as AccessType,
      name: r.name,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// WHAT A CHILD SHARED ABOUT THEMSELVES
// ---------------------------------------------------------------------------

export interface AboutEntry {
  key: string;
  value: string;
  updatedAt: string | null;
}

/**
 * Read a child's "About me" answers.
 *
 * The child writes these in the Kids app; RLS (migration 019) lets the owning
 * parent read them. Without this the answers were write-only — a child could
 * tell their family something and nobody could ever see it.
 */
export async function loadChildAbout(childId: string): Promise<AboutEntry[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await db
      .from('child_about')
      .select('field_key, value, updated_at')
      .eq('child_id', childId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[family] about-me read failed:', error.message);
      return [];
    }

    return ((data as Array<{ field_key: string; value: string | null; updated_at: string | null }> | null) ?? [])
      .filter((r) => r.value && r.value.trim())
      .map((r) => ({ key: r.field_key, value: (r.value ?? '').trim(), updatedAt: r.updated_at }));
  } catch (err) {
    console.warn('[family] about-me read failed:', err);
    return [];
  }
}
