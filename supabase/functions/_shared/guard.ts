// Authorisation guards shared by the Edge Functions.
//
// Two of the cron functions were publicly invocable: posting to
// /functions/v1/weekly-report-cron with nothing but the anon key returned
// HTTP 200 and sent email to every user. weekly-report-cron even read the
// Authorization header into a variable and then never looked at it.
//
// The anon key is not a credential — it ships inside both app binaries and sits
// in a public repository. Anything that sends mail, costs money, or touches
// other people's data needs a real check.

const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

/** Constant-time compare, so a wrong secret cannot be found byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Gate for scheduled/bulk work — anything that emails many people at once.
 *
 * Requires `x-cron-secret`. Deliberately NOT satisfied by a user JWT: no
 * ordinary account should be able to trigger a mailout to the whole user base.
 */
export function assertCronCaller(req: Request): Response | null {
  if (!CRON_SECRET) {
    // Fail closed. An unset secret must not silently mean "allow everyone",
    // which is precisely how these ended up open in the first place.
    console.error('CRON_SECRET is not configured; refusing to run.');
    return new Response(JSON.stringify({ error: 'not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const provided = req.headers.get('x-cron-secret') ?? '';
  if (!safeEqual(provided, CRON_SECRET)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

export interface CallerIdentity {
  userId: string;
  email: string | null;
}

/**
 * Resolve the signed-in user behind a request, or null.
 *
 * The anon key alone yields null: it identifies the project, not a person.
 */
export async function resolveCaller(req: Request): Promise<CallerIdentity | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token || token === ANON_KEY) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id ? { userId: user.id, email: user.email ?? null } : null;
  } catch {
    return null;
  }
}

/**
 * Gate for work a signed-in user may do for themselves — sending a single
 * transactional email, for example. Also accepts the cron secret, since the
 * scheduled jobs call the same endpoints internally.
 */
export async function assertUserOrCron(req: Request): Promise<Response | null> {
  const provided = req.headers.get('x-cron-secret') ?? '';
  if (CRON_SECRET && safeEqual(provided, CRON_SECRET)) return null;

  const caller = await resolveCaller(req);
  if (caller) return null;

  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
