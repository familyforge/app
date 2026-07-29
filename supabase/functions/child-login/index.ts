// Redeem a child's one-time sign-in code for a real session.
//
// Runs with the service role, which is why this must be an Edge Function and
// cannot live in the app: minting a session requires admin privileges, and the
// service role key must never ship inside a binary.
//
// Flow:
//   child app  --{ firstName, code }-->  here
//   here       --validate, mark used, generateLink-->  { tokenHash, email }
//   child app  --verifyOtp(tokenHash)-->  Supabase session
//
// The code is the secret; the first name is a confirmation that the right child
// is holding the device. Errors are deliberately identical for every failure so
// the endpoint cannot be used to discover whether a name or a code was valid.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_ATTEMPTS = 5;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** One message for every failure — never reveal which half was wrong. */
const FAILED = { error: "That code didn't work. Ask your parent for a new one." };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(FAILED, 405);

  let firstName = '';
  let code = '';
  try {
    const body = await req.json();
    firstName = String(body?.firstName ?? '').trim();
    code = String(body?.code ?? '').trim();
  } catch {
    return json(FAILED, 400);
  }

  if (!firstName || !/^\d{6}$/.test(code)) return json(FAILED, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Find a live code.
  const { data: rows } = await admin
    .from('child_login_codes')
    .select('id, child_id, expires_at, used_at, attempts')
    .eq('code', code)
    .is('used_at', null)
    .limit(1);

  const row = rows?.[0];
  if (!row) return json(FAILED, 401);

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from('child_login_codes').update({ used_at: new Date().toISOString() }).eq('id', row.id);
    return json(FAILED, 401);
  }

  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
    await admin.from('child_login_codes').update({ used_at: new Date().toISOString() }).eq('id', row.id);
    return json(FAILED, 401);
  }

  // 2. The name must match the child this code was issued for. Case and
  //    surrounding whitespace are ignored; spelling is not.
  const { data: child } = await admin
    .from('children')
    .select('id, name, parent_id, auth_user_id')
    .eq('id', row.child_id)
    .single();

  if (!child) return json(FAILED, 401);

  const matches = child.name?.trim().toLowerCase() === firstName.toLowerCase();
  if (!matches) {
    await admin
      .from('child_login_codes')
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq('id', row.id);
    return json(FAILED, 401);
  }

  // 3. Make sure the child has an auth identity. Created lazily on first use so
  //    a child who never signs in never gets an account.
  let authUserId: string | null = child.auth_user_id;
  const email = `child-${child.id}@kids.familyforge.app`;

  if (!authUserId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: child.name, is_child: true, child_id: child.id },
    });
    if (createErr || !created?.user) {
      console.error('createUser failed', createErr);
      return json(FAILED, 500);
    }
    authUserId = created.user.id;
    await admin.from('children').update({ auth_user_id: authUserId }).eq('id', child.id);
  }

  // 4. Burn the code BEFORE handing back a token, so a replay cannot reuse it
  //    even if the response is intercepted.
  await admin.from('child_login_codes').update({ used_at: new Date().toISOString() }).eq('id', row.id);

  // 5. Mint a one-shot token the client exchanges for a session.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: (await admin.auth.admin.getUserById(authUserId)).data.user?.email ?? email,
  });

  if (linkErr || !link?.properties?.hashed_token) {
    console.error('generateLink failed', linkErr);
    return json(FAILED, 500);
  }

  return json({
    tokenHash: link.properties.hashed_token,
    childId: child.id,
    childName: child.name,
  });
});
