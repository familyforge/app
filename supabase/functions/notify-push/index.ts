// Push notifications for the approval loop.
//
// Two moments were silent, which broke the loop at both ends:
//
//   task_claimed  — a child taps "I did it!" and the parent is never told, so
//                   the task sits unapproved until they happen to open the app
//   task_approved — the parent approves and awards the gold, but the child is
//                   never told, so their effort ends in nothing
//
// This runs server-side because addressing the other party means reading a push
// token the caller has no right to see: a child must never be able to read their
// parent's token, or any other family's.
//
// The caller's own JWT is used first to confirm they may see the task at all —
// RLS does that check — and only then does the service role look up the
// recipient. Without that, anyone could push any family by guessing a task id.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data: Record<string, unknown>;
}

async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  const res = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    console.error('expo push rejected', res.status, (await res.text()).slice(0, 300));
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ ok: false }, 401);

  let event = '';
  let taskId = '';
  try {
    const body = await req.json();
    event = String(body?.event ?? '');
    taskId = String(body?.taskId ?? '');
  } catch {
    return json({ ok: false }, 400);
  }

  if (!taskId || (event !== 'task_claimed' && event !== 'task_approved')) {
    return json({ ok: false }, 400);
  }

  // 1. As the CALLER. If RLS does not hand back the task, they have no business
  //    triggering a notification about it.
  const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: visible } = await asCaller
    .from('tasks')
    .select('id, title, points, child_id')
    .eq('id', taskId)
    .maybeSingle();

  if (!visible) return json({ ok: false }, 403);

  // 2. As the SERVICE ROLE, to reach the recipient's token.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: child } = await admin
    .from('children')
    .select('id, name, parent_id, push_token, caregiver_label')
    .eq('id', visible.child_id)
    .maybeSingle();

  if (!child) return json({ ok: false }, 404);

  const messages: PushMessage[] = [];

  if (event === 'task_claimed') {
    // Notify the parent, plus any family member allowed to approve.
    const { data: parent } = await admin
      .from('parents')
      .select('push_token')
      .eq('id', child.parent_id)
      .maybeSingle();

    const { data: members } = await admin
      .from('family_members')
      .select('push_token, permissions, child_ids')
      .eq('family_id', child.parent_id)
      .eq('status', 'accepted');

    const recipients: string[] = [];
    if (parent?.push_token) recipients.push(parent.push_token as string);

    for (const m of (members ?? []) as Array<{
      push_token: string | null;
      permissions: Record<string, boolean> | null;
      child_ids: string[] | null;
    }>) {
      if (!m.push_token) continue;
      if (!m.permissions?.canEditTasks) continue;
      // Respect a guardian's per-child scope.
      if (m.child_ids && m.child_ids.length > 0 && !m.child_ids.includes(child.id as string)) continue;
      recipients.push(m.push_token);
    }

    for (const to of recipients) {
      messages.push({
        to,
        title: `${child.name} finished a task`,
        body: `"${visible.title}" is waiting for you to check it.`,
        sound: 'default',
        data: { kind: 'task_claimed', taskId, childId: child.id },
      });
    }
  }

  if (event === 'task_approved' && child.push_token) {
    const who = (child.caregiver_label as string) || 'Your grown-up';
    messages.push({
      to: child.push_token as string,
      title: `${visible.points} gold earned!`,
      body: `${who} said yes to "${visible.title}". Well done!`,
      sound: 'default',
      data: { kind: 'task_approved', taskId, childId: child.id },
    });
  }

  await sendExpoPush(messages);
  return json({ ok: true, sent: messages.length });
});
