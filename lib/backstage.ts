import type { User } from '@supabase/supabase-js';
import { supabase, getSessionUser } from './supabase';
import type { PortalRole } from './production-admin-copy';

/**
 * Data layer for Backstage, the Production Admin.
 *
 * The rule this file exists to keep: a person's rights come from their
 * production_team row for ONE production, never from admin_users. Nothing here
 * ever reads or writes admin_users. If a query in here starts needing it, the
 * feature is in the wrong place.
 *
 * RLS is the real boundary, not these functions. The filters here exist so the
 * UI shows the right thing, not to keep anyone out.
 */

/**
 * getSessionUser() reads the session that is already in memory. On the very
 * first page load in a tab the client may not have finished restoring it from
 * storage yet, so a genuinely logged-in person can get null and be bounced to
 * the login screen. Observed in dev: a cold hit on /backstage redirected to
 * /login, and the identical warm hit did not.
 *
 * This waits for the client to settle before believing a null. It resolves as
 * soon as the answer is known, so a signed-out visitor is not made to wait.
 */
export function getSettledUser(timeoutMs = 2000): Promise<User | null> {
  return new Promise(async (resolve) => {
    const user = await getSessionUser();
    if (user) { resolve(user); return; }

    let settled = false;
    const finish = (u: User | null) => {
      if (settled) return;
      settled = true;
      sub.subscription.unsubscribe();
      clearTimeout(timer);
      resolve(u);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      finish(session?.user ?? null);
    });
    const timer = setTimeout(() => finish(null), timeoutMs);
  });
}

export interface TeamRow {
  id: string;
  production_id: string;
  user_id: string | null;
  team_role: PortalRole;
  display_name: string;
  credit: string;
  sort_order: number;
  is_visible: boolean;
  persona: Persona;
  invited_email: string | null;
}

/** The shape agreed with the microsite. See 2006/PERSONA-CONTRACT.md. */
export interface Persona {
  screen_name?: string;
  status?: 'online' | 'away' | 'idle' | 'offline' | 'mobile';
  idle_min?: number;
  away_msg?: string;
  profile?: string;
  about?: string;
  bg?: string;
  fg?: string;
  font?: 'comic' | 'sys' | 'square';
  size?: number;
  is_bot?: boolean;
}

export interface ProductionSummary {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  status: 'draft' | 'published' | 'archived';
  myRole: PortalRole;
  myRowId: string;
}

export interface Playlist {
  id: string;
  production_id: string;
  created_by: string | null;
  title: string;
  byline: string;
  description: string;
  tracks: { t: string; a: string; note?: string }[];
  is_visible: boolean;
  sort_order: number;
}

export interface Post {
  id: string;
  production_id: string;
  created_by: string | null;
  title: string;
  byline: string;
  body: string;
  is_published: boolean;
  pinned: boolean;
  posted_at: string;
}

export interface MicrositeState {
  production_id: string;
  show_mode: boolean;
  voting_open: boolean;
  submissions_open: boolean;
  marquee: string;
  background_url: string | null;
  background_color: string | null;
  /** Where the company keeps things. Empty means the button stays hidden. */
  public_url: string | null;
  drive_url: string | null;
  submissions_url: string | null;
}

export const PERSONA_DEFAULTS: Persona = {
  screen_name: '',
  status: 'away',
  idle_min: 0,
  away_msg: '',
  profile: '',
  about: '',
  bg: '#000000',
  fg: '#ffffff',
  font: 'comic',
  size: 13,
};

/** True if this person is a Collective admin. Read only, never written here. */
export async function isCollectiveAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return !!data;
}

/**
 * Every production this person can work on.
 *
 * Usually that means the ones they are on the team for. Collective admins see
 * all of them, because can_manage_production() in v40 already grants them
 * producer rights on every production. Hiding a show from someone the database
 * would let straight in is a confusing half door, not extra safety.
 *
 * This does not widen the invariant. A creator still never gets a row in
 * admin_users; this only reflects rights admins already had.
 */
export async function fetchMyProductions(): Promise<ProductionSummary[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('production_team')
    .select('id, team_role, production_id, productions ( id, slug, title, tagline, status )')
    .eq('user_id', user.id);

  if (error || !data) return [];

  const mine = data
    .map((row) => {
      // Supabase types the embedded relation loosely; it is one row here.
      const p = (Array.isArray(row.productions) ? row.productions[0] : row.productions) as
        | { id: string; slug: string; title: string; tagline: string | null; status: ProductionSummary['status'] }
        | null;
      if (!p) return null;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        tagline: p.tagline,
        status: p.status,
        myRole: row.team_role as PortalRole,
        myRowId: row.id as string,
      };
    })
    .filter((x): x is ProductionSummary => x !== null);

  if (!(await isCollectiveAdmin())) {
    return mine.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Admin: add every other production, as producer. Their own team row wins
  // where they have one, so their real credit and persona are preserved.
  const { data: all } = await supabase
    .from('productions')
    .select('id, slug, title, tagline, status');

  const seen = new Set(mine.map((m) => m.id));
  const rest = ((all ?? []) as ProductionSummary[])
    .filter((p) => !seen.has(p.id))
    .map((p) => ({ ...p, myRole: 'producer' as PortalRole, myRowId: '' }));

  return [...mine, ...rest].sort((a, b) => a.title.localeCompare(b.title));
}

/** The one production, plus this person's place on it. Null if not on it. */
export async function fetchProductionForMe(slug: string): Promise<ProductionSummary | null> {
  const mine = await fetchMyProductions();
  return mine.find((p) => p.slug === slug) ?? null;
}

/** Wallpaper and switches. Readable signed out, so this never needs a user. */
export async function fetchMicrosite(productionId: string): Promise<MicrositeState | null> {
  const { data } = await supabase
    .from('production_microsite')
    .select('*')
    .eq('production_id', productionId)
    .maybeSingle();
  return (data as MicrositeState) ?? null;
}

/** This person's own team row, with persona defaults filled in. */
export async function fetchMyRow(productionId: string): Promise<TeamRow | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const { data } = await supabase
    .from('production_team')
    .select('id, production_id, user_id, team_role, display_name, credit, sort_order, is_visible, persona')
    .eq('production_id', productionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return null;
  const row = data as TeamRow;
  return { ...row, persona: { ...PERSONA_DEFAULTS, ...(row.persona ?? {}) } };
}

/**
 * Save a persona.
 *
 * Only persona is written. team_role, user_id, and production_id are never
 * sent, partly because a creator has no business changing them and partly
 * because the database would refuse anyway: guard_production_team_fields()
 * in v40 raises if a non producer tries. The UI simply never asks.
 */

/**
 * Row level security does not error when it refuses you. An UPDATE whose
 * policy matches no rows reports success and changes nothing, so a save can
 * come back "ok" having done absolutely nothing. That is how Alec's edits
 * vanished: he pressed Save, the app said Saved, and his row was never his.
 *
 * Every write below asks for the affected ids back and treats an empty result
 * as a failure, because from the person's point of view it is one.
 */
function wrote(data: unknown[] | null, error: { message: string } | null): { ok: boolean; error?: string } {
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: 'The database would not let that through. Usually it means your '
           + 'account is not linked to this show yet, or the row belongs to '
           + 'somebody else. Try signing out and back in, and tell a producer '
           + 'if it keeps happening.',
    };
  }
  return { ok: true };
}

export async function saveMyPersona(rowId: string, persona: Persona): Promise<{ ok: boolean; error?: string }> {
  const clean: Persona = { ...persona };

  // Trim the strings people actually type, so a stray space does not become
  // an away message that looks blank but is not.
  (['screen_name', 'away_msg', 'profile', 'about'] as const).forEach((k) => {
    if (typeof clean[k] === 'string') clean[k] = clean[k]!.trim() as never;
  });

  const { data, error } = await supabase
    .from('production_team')
    .update({ persona: clean })
    .eq('id', rowId)
    .select('id');

  return wrote(data, error);
}

/** Everyone on the show, for the company page and the buddy list preview. */
export async function fetchCompany(productionId: string): Promise<TeamRow[]> {
  const { data } = await supabase
    .from('production_team')
    .select('id, production_id, user_id, team_role, display_name, credit, sort_order, is_visible, persona')
    .eq('production_id', productionId)
    .order('sort_order');
  return ((data ?? []) as TeamRow[]).map((r) => ({
    ...r,
    persona: { ...PERSONA_DEFAULTS, ...(r.persona ?? {}) },
  }));
}

/** Called once after sign in. Attaches any invite waiting on this email. */
export async function claimInvites(): Promise<number> {
  const { data, error } = await supabase.rpc('claim_production_invites');
  if (error) return 0;
  return (data as number) ?? 0;
}

/** The three fonts the microsite knows how to render. */
export const FONT_CHOICES: { value: NonNullable<Persona['font']>; label: string; css: string }[] = [
  { value: 'comic',  label: 'Comic Sans',  css: '"Comic Sans MS", "Comic Sans", cursive' },
  { value: 'sys',    label: 'Plain',       css: 'Tahoma, Verdana, sans-serif' },
  { value: 'square', label: 'Squarish',    css: '"Eurostile", "Michroma", "Trebuchet MS", sans-serif' },
];

export const STATUS_CHOICES: { value: NonNullable<Persona['status']>; label: string; help: string }[] = [
  { value: 'online',  label: 'Online',  help: 'Green running man. No away message shown.' },
  { value: 'away',    label: 'Away',    help: 'Yellow note. Your away message is what people see.' },
  { value: 'idle',    label: 'Idle',    help: 'Blue Zzz, with your minutes next to it.' },
  { value: 'offline', label: 'Offline', help: 'Greyed out at the bottom of the list.' },
];


/* ══════════════════ Playlists ══════════════════
   Everyone on the show sees everyone's. RLS decides what you may change, so
   these calls do not second-guess it: an edit you are not allowed to make
   comes back as an error rather than being hidden from you here. */

export async function fetchPlaylists(productionId: string): Promise<Playlist[]> {
  const { data } = await supabase
    .from('production_playlists')
    .select('*')
    .eq('production_id', productionId)
    .order('sort_order')
    .order('created_at');
  return (data ?? []).map((p) => ({
    ...p,
    tracks: Array.isArray(p.tracks) ? p.tracks : [],
  })) as Playlist[];
}

export async function createPlaylist(
  productionId: string,
  userId: string,
  title: string,
  byline: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('production_playlists')
    .insert({ production_id: productionId, created_by: userId, title, byline, tracks: [] })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function savePlaylist(p: Playlist): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('production_playlists')
    .update({
      title: p.title, byline: p.byline, description: p.description,
      tracks: p.tracks, is_visible: p.is_visible, sort_order: p.sort_order,
    })
    .eq('id', p.id)
    .select('id');
  return wrote(data, error);
}

export async function deletePlaylist(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.from('production_playlists').delete().eq('id', id).select('id');
  return wrote(data, error);
}


/* ══════════════════ Blog posts ══════════════════ */

export async function fetchPosts(productionId: string): Promise<Post[]> {
  const { data } = await supabase
    .from('production_posts')
    .select('*')
    .eq('production_id', productionId)
    .order('pinned', { ascending: false })
    .order('posted_at', { ascending: false });
  return (data ?? []) as Post[];
}

export async function createPost(
  productionId: string,
  userId: string,
  byline: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('production_posts')
    .insert({ production_id: productionId, created_by: userId, byline, title: '', body: '' })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function savePost(p: Post): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('production_posts')
    .update({
      title: p.title, byline: p.byline, body: p.body,
      is_published: p.is_published, pinned: p.pinned,
    })
    .eq('id', p.id)
    .select('id');
  return wrote(data, error);
}

export async function deletePost(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.from('production_posts').delete().eq('id', id).select('id');
  return wrote(data, error);
}


/** Producers set the company's links. */
export async function saveMicrositeLinks(
  productionId: string,
  links: Pick<MicrositeState, 'public_url' | 'drive_url' | 'submissions_url'>,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('production_microsite')
    .update(links)
    .eq('production_id', productionId)
    .select('production_id');
  return wrote(data, error);
}


/**
 * Does this person have a Collective member profile?
 *
 * Backstage deliberately does not require one: a production team member can
 * exist in auth.users with no profiles row at all. This is only used to decide
 * whether the Collective button says "go to yours" or "make one".
 */
export async function hasMemberProfile(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}


/* ══════════════════ The Graveyard ══════════════════ */

export interface Grave {
  id: string;
  production_id: string;
  name: string;
  dates: string;
  epitaph: string;
  submitted_by: string | null;
  approved: boolean;
  pinned: boolean;
  sort_order: number;
}

export async function fetchGraves(productionId: string): Promise<Grave[]> {
  const { data } = await supabase
    .from('production_graves')
    .select('*')
    .eq('production_id', productionId)
    .order('pinned', { ascending: false })
    .order('sort_order')
    .order('created_at');
  return (data ?? []) as Grave[];
}

export async function createGrave(productionId: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('production_graves')
    .insert({ production_id: productionId, name: 'something we miss', approved: true })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function saveGrave(g: Grave): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('production_graves')
    .update({
      name: g.name, dates: g.dates, epitaph: g.epitaph,
      approved: g.approved, pinned: g.pinned, sort_order: g.sort_order,
    })
    .eq('id', g.id)
    .select('id');
  return wrote(data, error);
}

export async function deleteGrave(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.from('production_graves').delete().eq('id', id).select('id');
  return wrote(data, error);
}

/** Only one grave sits at the top. Clearing the others first keeps that true
 *  without a database constraint that a producer would have to fight. */
export async function pinGrave(productionId: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const clear = await supabase
    .from('production_graves')
    .update({ pinned: false })
    .eq('production_id', productionId)
    .eq('pinned', true);
  if (clear.error) return { ok: false, error: clear.error.message };
  const { data, error } = await supabase.from('production_graves').update({ pinned: true }).eq('id', id).select('id');
  return wrote(data, error);
}


/* ══════════════════ Video links ══════════════════ */

export interface VideoLink {
  id: string;
  production_id: string;
  category: string;
  title: string;
  youtube_id: string;
  sort_order: number;
  is_visible: boolean;
}

/** Accepts a full URL or a bare id and returns the id. The company will paste
 *  whatever their browser gave them, which is never the bare id. */
export function youtubeId(input: string): string {
  const raw = input.trim();
  if (!raw) return '';
  const m =
    raw.match(/[?&]v=([\w-]{6,})/) ??
    raw.match(/youtu\.be\/([\w-]{6,})/) ??
    raw.match(/\/(?:embed|shorts|live)\/([\w-]{6,})/);
  if (m) return m[1];
  return /^[\w-]{6,}$/.test(raw) ? raw : '';
}

export async function fetchVideoLinks(productionId: string): Promise<VideoLink[]> {
  const { data } = await supabase
    .from('production_video_links')
    .select('*')
    .eq('production_id', productionId)
    .order('category')
    .order('sort_order')
    .order('created_at');
  return (data ?? []) as VideoLink[];
}

export async function createVideoLink(
  productionId: string, category: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from('production_video_links')
    .insert({ production_id: productionId, category, title: '', youtube_id: '' })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function saveVideoLink(v: VideoLink): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase
    .from('production_video_links')
    .update({
      category: v.category, title: v.title, youtube_id: v.youtube_id,
      sort_order: v.sort_order, is_visible: v.is_visible,
    })
    .eq('id', v.id)
    .select('id');
  return wrote(data, error);
}

export async function deleteVideoLink(id: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.from('production_video_links').delete().eq('id', id).select('id');
  return wrote(data, error);
}
