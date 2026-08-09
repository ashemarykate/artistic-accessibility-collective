/**
 * Where to send someone after they sign in.
 *
 * The magic link callback routes by role: admins to /admin, members to
 * /dashboard. That is right for a plain "log in" but wrong when the person was
 * already going somewhere. A producer following a link to Backstage was
 * landing on the Collective admin instead, because being an admin outranked
 * what they asked for.
 *
 * localStorage, NOT sessionStorage. A magic link is clicked from an email
 * client, which almost always opens a NEW TAB, and sessionStorage does not
 * cross tabs. The first version of this used sessionStorage and the
 * destination was empty every time by the moment it was needed.
 *
 * Not on the magic link URL either: putting it in emailRedirectTo means every
 * destination has to be in Supabase's allowed redirect list, and a mismatch
 * there does not warn you, it just refuses to sign people in.
 */

import { supabase } from './supabase';

const KEY = 'aac_after_login';

/** Long enough to read an email, short enough that a forgotten one expires. */
const MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Only same origin paths. A value like `//evil.example.com` is a protocol
 * relative URL that browsers treat as another site, so it is rejected along
 * with anything that is not a plain path.
 */
function isSafePath(path: unknown): path is string {
  return typeof path === 'string'
    && path.startsWith('/')
    && !path.startsWith('//')
    && !path.includes('\\');
}

export function rememberAfterLogin(path: string): void {
  if (typeof window === 'undefined' || !isSafePath(path)) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));
  } catch { /* private mode, no harm */ }
}

/** Reads and clears it, so a stale destination cannot hijack a later sign in. */
export function takeAfterLogin(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    window.localStorage.removeItem(KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (!isSafePath(saved.path)) return null;
    if (typeof saved.at !== 'number' || Date.now() - saved.at > MAX_AGE_MS) return null;

    return saved.path;
  } catch {
    return null;
  }
}


/* ────────────────────────────────────────────────────────────────────────────
   Temporary diagnostics.

   Backstage kept landing on /admin after a magic link and three fixes did not
   move it, so rather than guess a fourth time the callback now leaves a
   breadcrumb and /backstage shows it. Delete this block and its two call sites
   once the redirect is behaving.

   The single most useful thing it tells us: whether /auth/callback ran at all.
   If there is no trace after a sign in, the magic link is not coming through
   that page, which would mean the problem is Supabase's Site URL and none of
   the code changes could ever have worked.
   ──────────────────────────────────────────────────────────────────────────── */

const TRACE = 'aac_login_trace';

export interface LoginTrace {
  at: string;
  rawStored: string | null;
  intended: string | null;
  routedTo: string;
  origin: string;
}

export function writeLoginTrace(t: Omit<LoginTrace, 'at' | 'origin'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TRACE, JSON.stringify({
      ...t,
      at: new Date().toISOString(),
      origin: window.location.origin,
    }));
  } catch { /* ignore */ }
}

export function readLoginTrace(): LoginTrace | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TRACE);
    return raw ? (JSON.parse(raw) as LoginTrace) : null;
  } catch { return null; }
}

export function clearLoginTrace(): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(TRACE); } catch { /* ignore */ }
}


/* ────────────────────────────────────────────────────────────────────────────
   The one place that decides where you land after signing in.

   There used to be three copies of this logic, in /auth/callback,
   /auth/confirm and /login. They agreed with each other, which is exactly why
   the bug survived three fixes: the intended-destination check was added to
   /auth/callback, but login emails link to /auth/confirm, so the patched copy
   never ran.

   Every sign in path must call this. Do not hand-roll the role check again.
   ──────────────────────────────────────────────────────────────────────────── */

interface RouterLike {
  replace: (path: string) => void;
}

/**
 * An explicitly requested destination always wins over the role default.
 * Somebody following a link to Backstage wants Backstage, whether or not they
 * also happen to administer the Collective.
 */
export async function routeAfterAuth(
  router: RouterLike,
  userId: string,
  /** From ?next= on the sign in link. Beats storage: it survives a different
   *  browser, a different device, and a link forwarded to somebody else. */
  explicit?: string | null,
): Promise<string> {
  const fromUrl = explicit && explicit.startsWith('/') && !explicit.startsWith('//')
    && !explicit.includes('\\') ? explicit : null;
  const intended = fromUrl ?? takeAfterLogin();
  if (intended) {
    writeLoginTrace({ rawStored: intended, intended, routedTo: intended });
    router.replace(intended);
    return intended;
  }

  const [{ data: adminData }, { data: profileData }] = await Promise.all([
    supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('member_type').eq('user_id', userId).maybeSingle(),
  ]);

  const dest = adminData
    ? '/admin'
    : profileData?.member_type === 'access_card'
      ? '/'
      : '/dashboard';

  writeLoginTrace({ rawStored: null, intended: null, routedTo: `${dest} (role default)` });
  router.replace(dest);
  return dest;
}
