'use client';
import Logo from '@/components/Logo';

import { useEffect, useState, useCallback } from 'react';
import { supabase, getSessionUser, type Profile, type Conversation, type Message, profileHref } from '@/lib/supabase';
import { RESOURCE_BY_SLUG } from '@/lib/resources-data';
import { fetchUpcomingEvents, isLiveOnline, isInPerson } from '@/lib/events';
import type { CalEvent } from '@/lib/supabase';
import { EnvelopeIcon, PeopleIcon, FavoritesStarIcon, PersonPlusIcon, WrenchIcon, PencilIcon, LiveCameraIcon, LocationPinIcon } from '@/app/components/PixelIcons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';
import AttendingReminders from '@/components/AttendingReminders';

// ── Time helper ───────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Upcoming events panel body ────────────────────────────────────────────────
// Both event panels on the hub read the same community calendar, so an event
// entered once on the calendar shows up here without being typed again.

function EventPanelBody({
  events, failed, onRetry, emptyText,
}: {
  events: CalEvent[] | null;
  failed: boolean;
  onRetry: () => void;
  emptyText: string;
}) {
  if (failed) {
    return (
      <div style={{ padding: '10px' }} role="alert">
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          We could not load the calendar just now.
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  if (events === null) {
    return (
      <p role="status" style={{ padding: '10px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        Loading upcoming events…
      </p>
    );
  }
  if (events.length === 0) {
    return (
      <div style={{ padding: '10px' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>{emptyText}</p>
        <Link href="/submit-event" className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }}>
          Submit an event
        </Link>
      </div>
    );
  }
  return (
    <div style={{ padding: '4px 0' }}>
      {events.map((ev) => {
        const d = new Date(ev.start_at);
        const dateStr = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = ev.is_all_day ? '' : `, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
        const where = ev.location_name ? ` at ${ev.location_name}` : '';
        return (
          <Link
            key={ev.id}
            href="/calendar"
            aria-label={`${ev.title}, ${dateStr}${timeStr}${where}. Opens the community calendar.`}
            className="ms-hub-row"
            style={{ display: 'block', padding: '6px 10px', borderBottom: '1px solid var(--ms-border)', textDecoration: 'none' }}
          >
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aac-blue)', lineHeight: 1.3, marginBottom: '1px' }}>
              {ev.title}
            </p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              {dateStr}{timeStr}{ev.organization ? ` · ${ev.organization}` : ''}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

// ── Conversation preview row ──────────────────────────────────────────────────

type ConvPreview = {
  id: string;
  other: Pick<Profile, 'id' | 'full_name' | 'display_name' | 'avatar_url' | 'username'>;
  lastMessage: Message | null;
  unread: boolean;
};

// ── Browse destinations (the Resources hub + Library + Cinema) ─────────────────
// Surfaced as a dropdown under "Save what you love" and the Control Panel.
const BROWSE_LINKS = [
  { href: '/resources', label: 'Resources',   emoji: '📚' },
  { href: '/library',   label: 'The Library', emoji: '📖' },
  { href: '/cinema',    label: 'The Cinema',  emoji: '🎬' },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MemberHub() {
  const router = useRouter();

  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [memberCount,   setMemberCount]   = useState(0);
  const [recentMembers, setRecentMembers] = useState<Profile[]>([]);
  const [allMembers,    setAllMembers]    = useState<Profile[]>([]);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [convPreviews,  setConvPreviews]  = useState<ConvPreview[]>([]);
  const [savedResources, setSavedResources] = useState<{ slug: string; name: string; categoryTitle: string; categoryEmoji: string }[]>([]);
  const [adminUserIds,  setAdminUserIds]  = useState<Set<string>>(new Set());
  const [introDismissed, setIntroDismissed] = useState(false);
  const [linkFailed,     setLinkFailed]     = useState(false); // logged in, but no profile could be linked
  const [browseOpen,     setBrowseOpen]     = useState(false);  // "Save what you love" dropdown
  const [cpResourcesOpen, setCpResourcesOpen] = useState(false); // Control Panel "Resources" submenu

  // Refer a Colleague (Collective members only)
  const [recsAvailable, setRecsAvailable] = useState<number | null>(null);
  // Which parts of the hub failed to load. Without this a failed fetch looked
  // exactly like "you have nothing here", which told members something untrue.
  const [loadErrors, setLoadErrors] = useState<{ messages?: boolean; saved?: boolean; referrals?: boolean; events?: boolean }>({});
  const [upcomingEvents, setUpcomingEvents] = useState<CalEvent[] | null>(null);
  const [recName,    setRecName]    = useState('');
  const [recEmail,   setRecEmail]   = useState('');
  const [recMessage, setRecMessage] = useState('');
  const [recSending, setRecSending] = useState(false);
  const [recError,   setRecError]   = useState('');
  const [lastRecCode, setLastRecCode] = useState<string | null>(null);
  const [lastRecEmail, setLastRecEmail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('mc-intro-dismissed') === '1') {
      setIntroDismissed(true);
    }
  }, []);

  const dismissIntro = () => {
    setIntroDismissed(true);
    if (typeof window !== 'undefined') localStorage.setItem('mc-intro-dismissed', '1');
  };

  const loadHub = useCallback(async function loadHub() {
    const user = await getSessionUser();
    if (!user) { router.push('/login'); return; }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!profileData) {
      // No profile found by user_id — try to link by email via SECURITY DEFINER RPC.
      // Direct SELECT on unlinked profiles fails due to RLS (no policy covers
      // unlinked rows), so we delegate to a server-side function that bypasses it.
      const { data: linked, error: linkError } = await supabase.rpc('link_profile_to_auth_user');
      if (linked && !linkError) {
        // Link succeeded — re-run loadHub now that user_id is set in the DB
        loadHub();
        return;
      }
      // Stay signed in and explain, rather than force-signing the member out.
      setLinkFailed(true);
      setLoading(false);
      return;
    }
    setLinkFailed(false);
    setLoadErrors({});
    setProfile(profileData);
    const resolvedProfile = profileData;

    // Referral quota. A failure here is reported, not hidden: showing "0 left"
    // when the count simply did not load would be a lie.
    if (resolvedProfile.member_type === 'collective') {
      try {
        const { data: avail, error: availError } = await supabase.rpc('get_available_recommendations', { user_profile_id: resolvedProfile.id });
        if (availError) throw availError;
        setRecsAvailable(typeof avail === 'number' ? avail : 0);
      } catch (err) {
        console.error('Could not load referral quota:', err);
        setRecsAvailable(null);
        setLoadErrors((e) => ({ ...e, referrals: true }));
      }
    }

    // Admin check
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    setIsAdmin(!!adminData);

    // All admin user IDs (for staff badge in directory widget)
    const { data: admins } = await supabase.from('admin_users').select('user_id');
    setAdminUserIds(new Set((admins ?? []).map((a) => a.user_id)));

    // Members: count + recently joined (right sidebar) + directory grid
    const { data: members, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })
      .limit(20);

    setMemberCount(count ?? 0);
    const memberList = (members ?? []).filter((m) => m.id !== resolvedProfile.id);
    setRecentMembers(memberList.slice(0, 3));
    setAllMembers(memberList.slice(0, 12));

    // Messaging. Supabase returns errors rather than throwing them, so each
    // query's error is checked explicitly; otherwise a failed load rendered as
    // the cheerful "No messages yet" empty state.
    try {
      const { data: myConvs, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`profile_a_id.eq.${resolvedProfile.id},profile_b_id.eq.${resolvedProfile.id}`)
        .order('last_message_at', { ascending: false })
        .limit(4);
      if (convError) throw convError;

      if (myConvs && myConvs.length > 0) {
        const convIds = myConvs.map((c: Conversation) => c.id);

        // Fetch unread count
        const { count: unread, error: unreadError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .is('read_at', null)
          .neq('sender_profile_id', resolvedProfile.id);
        if (unreadError) throw unreadError;
        setUnreadCount(unread ?? 0);

        // Fetch latest message per conversation + other profile
        const otherIds = myConvs.map((c: Conversation) =>
          c.profile_a_id === resolvedProfile.id ? c.profile_b_id : c.profile_a_id
        );

        const [{ data: otherProfiles, error: profErr }, { data: lastMsgs, error: msgErr }] = await Promise.all([
          supabase.from('profiles')
            .select('id, full_name, display_name, avatar_url, username')
            .in('id', otherIds),
          supabase.from('messages')
            .select('*')
            .in('conversation_id', convIds)
            .order('sent_at', { ascending: false }),
        ]);
        if (profErr) throw profErr;
        if (msgErr) throw msgErr;

        const otherMap = Object.fromEntries(
          (otherProfiles ?? []).map((p: Pick<Profile, 'id' | 'full_name' | 'display_name' | 'avatar_url' | 'username'>) => [p.id, p])
        );

        // Group last messages by conversation
        const lastMsgByConv: Record<string, Message> = {};
        for (const m of (lastMsgs ?? []) as Message[]) {
          if (!lastMsgByConv[m.conversation_id]) {
            lastMsgByConv[m.conversation_id] = m;
          }
        }

        const previews: ConvPreview[] = myConvs
          .slice(0, 3)
          .map((c: Conversation) => {
            const otherId = c.profile_a_id === resolvedProfile.id ? c.profile_b_id : c.profile_a_id;
            const lastMsg = lastMsgByConv[c.id] ?? null;
            const unreadMsg = lastMsg && lastMsg.sender_profile_id !== resolvedProfile.id && !lastMsg.read_at;
            return {
              id: c.id,
              other: otherMap[otherId] ?? { id: otherId, full_name: 'Member', display_name: null, avatar_url: null, username: null },
              lastMessage: lastMsg,
              unread: !!unreadMsg,
            };
          });
        setConvPreviews(previews);
      }
    } catch (err) {
      console.error('Could not load messages:', err);
      setConvPreviews([]);
      setLoadErrors((e) => ({ ...e, messages: true }));
    }

    // Saved resources — fetch slugs and look up names from shared resource data
    try {
      const { data: favRows, error: favError } = await supabase
        .from('resource_favorites')
        .select('resource_slug')
        .eq('user_id', user.id);
      if (favError) throw favError;

      if (favRows) {
        const resolved = favRows
          .map((row) => {
            const info = RESOURCE_BY_SLUG[row.resource_slug];
            return info
              ? { slug: row.resource_slug, name: info.name, categoryTitle: info.categoryTitle, categoryEmoji: info.categoryEmoji }
              : null;
          })
          .filter(Boolean) as { slug: string; name: string; categoryTitle: string; categoryEmoji: string }[];
        setSavedResources(resolved);
      }
    } catch (err) {
      console.error('Could not load saved resources:', err);
      setSavedResources([]);
      setLoadErrors((e) => ({ ...e, saved: true }));
    }

    // Upcoming events, shared by both event panels below.
    try {
      setUpcomingEvents(await fetchUpcomingEvents());
    } catch (err) {
      console.error('Could not load upcoming events:', err);
      setUpcomingEvents(null);
      setLoadErrors((e) => ({ ...e, events: true }));
    }

    setLoading(false);
  }, [router]);

  useEffect(() => { loadHub(); }, [loadHub]);

  const handleSendRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setRecError('');
    if (!recName.trim() || !recEmail.trim()) {
      setRecError('Name and email are required.');
      document.getElementById(!recName.trim() ? 'rec-name' : 'rec-email')?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recEmail.trim())) {
      setRecError('That email address does not look right. Check it and try again.');
      document.getElementById('rec-email')?.focus();
      return;
    }
    setRecSending(true);
    try {
      const { data, error } = await supabase.rpc('send_recommendation', {
        user_profile_id: profile.id,
        p_recommended_name: recName.trim(),
        p_recommended_email: recEmail.trim(),
        p_personal_message: recMessage.trim() || null,
      });
      if (error) throw error;
      setLastRecCode(data as string);
      setLastRecEmail(recEmail.trim());
      setRecName('');
      setRecEmail('');
      setRecMessage('');
      setRecsAvailable((n) => (n != null ? Math.max(0, n - 1) : n));
    } catch {
      setRecError('Something went wrong sending that referral. Please try again.');
    } finally {
      setRecSending(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <BrowserChrome variant="aol" title="My Collective · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/dashboard">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading your hub">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading…</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  // Logged in, but this login isn't connected to an approved profile yet.
  // Stay signed in and explain, instead of force-signing the member out.
  if (linkFailed) {
    return (
      <BrowserChrome variant="aol" title="My Collective · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/dashboard">
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div className="content-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            We couldn&apos;t find your member profile
          </h1>
          <p role="alert" style={{ marginBottom: '1.5rem' }}>
            You&apos;re logged in, but we couldn&apos;t match this email to an approved member profile.
            If you just applied, your profile may still be under review. If you think something&apos;s
            wrong, email <a href="mailto:contact@artisticaccessibility.com" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>contact@artisticaccessibility.com</a> and
            we&apos;ll get you sorted.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" className="btn btn-primary btn-full" onClick={() => { setLoading(true); loadHub(); }}>
              Try Again
            </button>
            <button
              type="button"
              className="btn btn-full"
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  if (!profile) return null;

  const displayName = profile.display_name || profile.full_name;
  const firstName   = displayName.split(' ')[0];
  const initial     = displayName.charAt(0).toUpperCase();

  return (
    <BrowserChrome variant="aol" title="My Collective · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/dashboard">
    <main className="page-wrapper">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="site-header">
        <Link href="/dashboard" className="site-header-logo" aria-label="Artistic Accessibility Collective, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Logo alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/messages" className="nav-link" aria-label={unreadCount > 0 ? `Messages: ${unreadCount} unread` : 'Messages'}>
            Messages
            {unreadCount > 0 && (
              <span className="ms-unread-badge" aria-hidden="true">{unreadCount}</span>
            )}
          </Link>
          <Link href="/members" className="nav-link">Directory</Link>
          <Link href="/resources"  className="nav-link">Resources</Link>
          {/* Backstage is not admin: it is for anyone on a production, which
              includes people who are not Collective admins at all. Shown to
              everyone because the page itself explains it when you are not on
              a show, rather than us hiding a door people are looking for. */}
          <Link href="/backstage" className="nav-link">Backstage</Link>
          {isAdmin && <Link href="/admin" className="nav-link">Admin</Link>}
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="btn btn-outline-white btn-sm"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </nav>
      </header>

      {/* ── Three-column layout ────────────────────────────────────────── */}
      <div className="ms-hub-grid">

        {/* ════════════════ LEFT SIDEBAR ════════════════ */}
        <aside aria-label="Profile sidebar">
        <div className="ms-sticky-inner">

          {/* Profile card — doubles as the page's "Hello" greeting so it
              isn't duplicated in a separate strip above the grid. */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header" style={{ fontSize: '0.8rem' }}>
              <h1 style={{ margin: 0, fontSize: 'inherit', fontWeight: 'inherit' }}>
                Hello, {firstName}!
                {isAdmin ? (
                  <span className="ms-admin-badge" style={{ marginLeft: '4px' }} aria-label="Admin">✦ Admin</span>
                ) : (
                  <span className="ms-member-badge" style={{ marginLeft: '4px' }} aria-label="Member">✦ Member</span>
                )}
              </h1>
            </div>
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                {displayName} · {profile.username ?? profile.id.slice(0, 8)}
              </p>
              <Link href={profileHref(profile)} aria-label="View my profile">
                <div
                  className="member-avatar"
                  aria-hidden="true"
                  style={{ width: 80, height: 80, fontSize: '2rem', margin: '0 auto 6px' }}
                >
                  {profile.avatar_url
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initial}
                </div>
              </Link>
              {profile.pronouns && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>{profile.pronouns}</p>
              )}
              {(profile.location_city || profile.location_state) && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                  <span aria-hidden="true">📍 </span>{[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
                </p>
              )}
              {profile.approved_at && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  Member since{' '}
                  <time dateTime={profile.approved_at}>
                    {new Date(profile.approved_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </time>
                </p>
              )}
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Link href={profileHref(profile)} className="btn btn-primary btn-sm" style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem' }}>
                  View Profile
                </Link>
                <Link href="/profile/edit" className="btn btn-ghost btn-sm" style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem' }}>
                  <PencilIcon />Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Control panel */}
          <div className="ms-box">
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little lavender wrench emoticon"><WrenchIcon /></span> Control Panel</h2>
            </div>
            <nav aria-label="Member navigation" style={{ padding: '4px 0' }}>
              {([
                { href: '/messages', label: '📬 Messages', badge: unreadCount > 0 ? unreadCount : null },
                { href: '/members', label: '👥 Directory', badge: null },
                { label: '📚 Resources', badge: null, expandable: true },
                { href: '/feedback', label: '💬 Feedback', badge: null },
                ...(isAdmin ? [{ href: '/admin', label: '⚙️ Admin', badge: null }] : []),
              ] as { href?: string; label: string; badge: number | null; expandable?: boolean }[]).map((item) => {
                const rowStyle = {
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px', fontSize: '0.8125rem', color: 'var(--aac-navy)',
                  textDecoration: 'none', borderBottom: '1px solid var(--ms-border)',
                } as const;

                if (item.expandable) {
                  return (
                    <div key="resources">
                      <button
                        type="button"
                        onClick={() => setCpResourcesOpen((o) => !o)}
                        aria-expanded={cpResourcesOpen}
                        aria-controls="cp-resources-submenu"
                        className="ms-hub-row"
                        style={{ ...rowStyle, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <span>{item.label}</span>
                        <span aria-hidden="true" style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>{cpResourcesOpen ? '▾' : '▸'}</span>
                      </button>
                      {cpResourcesOpen && (
                        <ul id="cp-resources-submenu" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {BROWSE_LINKS.map((b) => (
                            <li key={b.href}>
                              <Link
                                href={b.href}
                                className="ms-hub-row"
                                style={{ ...rowStyle, paddingLeft: '28px', fontSize: '0.78125rem' }}
                              >
                                <span>{b.emoji} {b.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className="ms-hub-row"
                    style={rowStyle}
                  >
                    <span>{item.label}</span>
                    {item.badge !== null && (
                      <span
                        style={{ background: '#be123c', color: '#fff', borderRadius: '999px', padding: '0 6px', fontSize: '0.6875rem', fontWeight: 700 }}
                        aria-label={`${item.badge} unread`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
              className="ms-hub-row"
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '5px 10px', fontSize: '0.8125rem', color: 'var(--color-text-muted)',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              🔒 Sign Out
            </button>
          </div>

        </div>
        </aside>

        {/* ════════════════ CENTER COLUMN ════════════════ */}
        {/* minWidth: 0 stops the classic CSS grid blowout: without it, a long
            unbroken line anywhere inside (e.g. a nowrap message preview) forces
            this 1fr track, and the whole page, to grow to fit it instead of
            letting the descendant's own overflow/ellipsis rules do their job. */}
        <div role="region" aria-label="Your hub" style={{ minWidth: 0 }}>

          {/* Productions this member said they're attending. Sits above the
              welcome intro because it's time sensitive, and renders nothing at
              all when there's nothing coming up. */}
          <AttendingReminders userId={profile?.user_id} variant="msbox" />

          {/* Welcome / how-to intro */}
          {!introDismissed && (
            <div className="ms-box" style={{ marginBottom: '8px' }}>
              <div className="ms-box-header">
                <h2><span aria-hidden="true">🌼 </span>Welcome to My Collective</h2>
                <button
                  onClick={dismissIntro}
                  aria-label="Hide this welcome message"
                  style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline' }}
                >
                  got it ✕
                </button>
              </div>
              <div style={{ padding: '10px 12px', fontSize: '0.8125rem', color: 'var(--aac-navy)', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 8px' }}>
                  This little corner is yours. Think of it as your own workspace inside The Collective, a place to keep the things and people you need close while you do your thing.
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <li>
                    <strong>Make it yours.</strong>{' '}
                    <Link href="/profile/edit" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>Edit your profile</Link>{' '}
                    any time to add your work, your links, and the way you like to be reached. It saves as soon as you hit save.
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setBrowseOpen((o) => !o)}
                      aria-expanded={browseOpen}
                      aria-controls="sw-browse-menu"
                      style={{ background: 'transparent', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <strong style={{ color: 'var(--aac-blue)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Save what you love</strong>
                      <span aria-hidden="true" style={{ fontSize: '0.6875rem', marginLeft: '4px', color: 'var(--aac-blue)' }}>{browseOpen ? '▾' : '▸'}</span>
                    </button>{' '}
                    Heart any resource to keep it in your My Resources box. On the Library and Cinema you can rate and comment too, so you can tell everyone which picks are great and which to take with a grain of salt.
                    {browseOpen && (
                      <ul
                        id="sw-browse-menu"
                        aria-label="Browse the collection"
                        style={{ listStyle: 'none', margin: '6px 0 2px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', background: 'var(--aac-cream)', border: '1px solid var(--ms-border)', borderRadius: '4px' }}
                      >
                        {BROWSE_LINKS.map((b) => (
                          <li key={b.href}>
                            <Link
                              href={b.href}
                              className="ms-hub-row"
                              style={{ display: 'block', padding: '5px 8px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--aac-blue)', textDecoration: 'none' }}
                            >
                              {b.emoji} {b.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                  <li>
                    <strong>Make things together.</strong> Hop into{' '}
                    <Link href="/make-art" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>Make Art</Link>{' '}
                    for community art projects and accessible prompts, then add your piece to the gallery.
                  </li>
                  <li>
                    <strong>Keep your people close.</strong> Find collaborators in the{' '}
                    <Link href="/members" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>Directory</Link>{' '}
                    and tell us how you want to save your favorites over in{' '}
                    <Link href="/my-lists" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>My Lists</Link>.
                  </li>
                </ul>
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Use My Collective like a work tool: everything you save lives here, just for you.
                </p>
              </div>
            </div>
          )}

          {/* Messages preview */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2>
                <span role="img" aria-label="little pink envelope emoticon"><EnvelopeIcon /></span>{' '}
                Messages
                {unreadCount > 0 && (
                  <span
                    style={{ background: '#be123c', color: '#fff', borderRadius: '999px', padding: '0 6px', fontSize: '0.6875rem', fontWeight: 700, marginLeft: '6px' }}
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <Link href="/messages" style={{ fontSize: '0.75rem', color: 'inherit', textDecoration: 'underline' }}>view all</Link>
            </div>
            <div style={{ padding: '4px 0' }}>
              {loadErrors.messages ? (
                <div style={{ padding: '12px 10px', textAlign: 'center' }} role="alert">
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    We could not load your messages just now.
                  </p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => loadHub()}>Try again</button>
                </div>
              ) : convPreviews.length === 0 ? (
                <div style={{ padding: '12px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    No messages yet. Find a member and say hello!
                  </p>
                  <Link href="/members" className="btn btn-primary btn-sm">Browse Members</Link>
                </div>
              ) : (
                convPreviews.map((conv) => {
                  const otherName = conv.other.display_name || conv.other.full_name;
                  return (
                    <Link
                      key={conv.id}
                      href={`/messages/${conv.id}`}
                      aria-label={`Conversation with ${otherName}${conv.unread ? ' (unread)' : ''}`}
                      className={`ms-hub-row${conv.unread ? ' ms-conv-row-unread' : ''}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 10px', textDecoration: 'none',
                        borderBottom: '1px solid var(--ms-border)',
                      }}
                    >
                      <div className="member-avatar" aria-hidden="true" style={{ width: 30, height: 30, minWidth: 30, fontSize: '0.8rem', flexShrink: 0 }}>
                        {conv.other.avatar_url
                          ? /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={conv.other.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : otherName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: conv.unread ? 700 : 400, fontSize: '0.8125rem', color: 'var(--aac-navy)', marginBottom: '1px' }}>
                          {conv.unread && <span className="msg-unread-dot" aria-hidden="true" style={{ marginRight: '4px' }} />}
                          {otherName}
                        </p>
                        {conv.lastMessage && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.lastMessage.sender_profile_id === profile.id ? 'You: ' : ''}
                            {conv.lastMessage.body}
                          </p>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <time style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {relativeDate(conv.lastMessage.sent_at)}
                        </time>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Refer a Colleague — Collective members only */}
          {profile.member_type === 'collective' && (
            <div className="ms-box" style={{ marginBottom: '8px' }}>
              <div className="ms-box-header">
                <h2><span role="img" aria-label="handshake emoji">🤝</span> Refer a Colleague</h2>
                {loadErrors.referrals ? (
                  <span style={{ fontSize: '0.6875rem', color: 'inherit' }}>count unavailable</span>
                ) : recsAvailable != null && (
                  <span style={{ fontSize: '0.6875rem', color: 'inherit' }}>{recsAvailable} of 3 left this month</span>
                )}
              </div>
              <div style={{ padding: '10px' }}>
                {recsAvailable === 0 ? (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    You&apos;ve used all 3 referrals for this month. They&apos;ll refresh next month.
                  </p>
                ) : (
                  <form onSubmit={handleSendRecommendation} noValidate>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      Know someone who&apos;d be a great fit? Send them a personal invite to join the Collective.
                    </p>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label htmlFor="rec-name" className="form-label" style={{ fontSize: '0.75rem' }}>Their name</label>
                      <input id="rec-name" type="text" className="form-input" value={recName} onChange={(e) => setRecName(e.target.value)} autoComplete="off" aria-invalid={recError && !recName.trim() ? true : undefined} aria-describedby={recError ? 'rec-error' : undefined} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label htmlFor="rec-email" className="form-label" style={{ fontSize: '0.75rem' }}>Their email</label>
                      <input id="rec-email" type="email" className="form-input" value={recEmail} onChange={(e) => setRecEmail(e.target.value)} autoComplete="off" aria-invalid={recError && (!recEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recEmail.trim())) ? true : undefined} aria-describedby={recError ? 'rec-error' : undefined} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label htmlFor="rec-message" className="form-label" style={{ fontSize: '0.75rem' }}>Personal message (optional)</label>
                      <textarea id="rec-message" className="form-input" rows={2} value={recMessage} onChange={(e) => setRecMessage(e.target.value)} />
                    </div>
                    {recError && <p id="rec-error" className="form-error" role="alert" style={{ marginBottom: '8px' }}>{recError}</p>}
                    <button type="submit" className="btn btn-primary btn-sm" disabled={recSending} aria-busy={recSending}>
                      {recSending ? 'Sending…' : 'Send Invite'}
                    </button>
                  </form>
                )}
                {lastRecCode && (
                  <div className="alert alert-info" role="status" style={{ marginTop: '10px', fontSize: '0.8125rem' }}>
                    Invite sent! Their code is <code style={{ fontWeight: 700, letterSpacing: '0.05em' }}>{lastRecCode}</code>.{' '}
                    <a href={`mailto:${lastRecEmail}?subject=${encodeURIComponent('Join me on the Artistic Accessibility Collective')}&body=${encodeURIComponent(`Use invite code ${lastRecCode} at artisticaccessibility.com/submit to join.`)}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                      Email it to them
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discussion Board and Job Board are not built yet. Rather than show
              two "Coming Soon" boxes on the page members land on after logging
              in, they stay out of the hub until they do something. */}

          {/* Mini directory */}
          <div className="ms-box">
            <div className="ms-box-header">
              <h2>
                <span role="img" aria-label="little green group of people emoticon"><PeopleIcon /></span>{' '}
                Member Directory
                {memberCount > 0 && (
                  <span style={{ fontWeight: 400, color: '#b8ccff', fontSize: '0.6875rem', marginLeft: '6px' }}>{memberCount} members</span>
                )}
              </h2>
              <Link href="/members" style={{ fontSize: '0.75rem', color: 'inherit', textDecoration: 'underline' }}>view all</Link>
            </div>
            <div style={{ padding: '8px' }}>
              {allMembers.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No other members yet.
                </p>
              ) : (
                <ul
                  aria-label="Member directory preview"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                    gap: '6px',
                    listStyle: 'none', padding: 0, margin: 0,
                  }}
                >
                  {allMembers.map((m) => {
                    const mName = m.display_name || m.full_name;
                    const isStaff = m.user_id ? adminUserIds.has(m.user_id) : false;
                    return (
                      <li key={m.id}>
                        <Link
                          href={profileHref(m)}
                          aria-label={`View ${mName}'s profile`}
                          className="ms-dir-card"
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            padding: '6px 4px', textDecoration: 'none',
                            background: 'var(--aac-cream)',
                          }}
                        >
                          <div className="member-avatar" aria-hidden="true" style={{ width: 44, height: 44, fontSize: '1rem' }}>
                            {m.avatar_url
                              ? /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : mName.charAt(0).toUpperCase()}
                          </div>
                          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--aac-navy)', textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {mName}
                          </p>
                          {isStaff ? (
                            <span className="ms-admin-badge" style={{ fontSize: '0.5625rem', padding: '1px 5px' }} aria-label="Admin">✦ Admin</span>
                          ) : (
                            <span className="ms-member-badge" style={{ fontSize: '0.5625rem', padding: '1px 5px' }} aria-label="Member">✦ Member</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Upcoming Live Events, straight from the community calendar */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little magenta camera with live dot emoticon"><LiveCameraIcon /></span> Upcoming Live Events</h2>
              <Link href="/calendar" style={{ fontSize: '0.75rem', color: 'inherit', textDecoration: 'underline' }}>calendar</Link>
            </div>
            <EventPanelBody
              events={upcomingEvents === null ? null : upcomingEvents.filter(isLiveOnline).slice(0, 4)}
              failed={!!loadErrors.events}
              onRetry={() => loadHub()}
              emptyText="No online events on the calendar yet. Know of a webinar or streamed session? Add it."
            />
          </div>

          {/* Upcoming In-Person Events, straight from the community calendar */}
          <div className="ms-box">
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little amber location pin emoticon"><LocationPinIcon /></span> Upcoming In-Person Events</h2>
              <Link href="/calendar" style={{ fontSize: '0.75rem', color: 'inherit', textDecoration: 'underline' }}>calendar</Link>
            </div>
            <EventPanelBody
              events={upcomingEvents === null ? null : upcomingEvents.filter(isInPerson).slice(0, 4)}
              failed={!!loadErrors.events}
              onRetry={() => loadHub()}
              emptyText="No in-person events on the calendar yet. Know of a workshop or meetup? Add it."
            />
          </div>

        </div>

        {/* ════════════════ RIGHT SIDEBAR ════════════════ */}
        <aside aria-label="Right sidebar">
        <div className="ms-sticky-inner">

          {/* Saved resources */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little gold star emoticon"><FavoritesStarIcon /></span> My Resources</h2>
              <Link href="/resources" style={{ fontSize: '0.75rem', color: 'inherit', textDecoration: 'underline' }}>all</Link>
            </div>
            {loadErrors.saved ? (
              <div style={{ padding: '10px' }} role="alert">
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  We could not load your saved resources just now.
                </p>
                <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => loadHub()}>
                  Try again
                </button>
              </div>
            ) : savedResources.length === 0 ? (
              <div style={{ padding: '10px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  You haven&apos;t saved any resources yet. Heart the ones you love!
                </p>
                <Link href="/resources" className="btn btn-primary btn-sm" style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem' }}>
                  Browse Resources
                </Link>
              </div>
            ) : (
              <div style={{ padding: '4px 0' }}>
                {savedResources.map((res) => (
                  <a
                    key={res.slug}
                    href={res.slug}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${res.name}, opens in new tab`}
                    className="ms-hub-row"
                    style={{
                      display: 'block',
                      padding: '6px 10px',
                      borderBottom: '1px solid var(--ms-border)',
                      textDecoration: 'none',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aac-blue)', lineHeight: 1.3, marginBottom: '1px' }}>
                      {res.name}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                      {res.categoryEmoji} {res.categoryTitle}
                    </p>
                  </a>
                ))}
                <div style={{ padding: '8px 10px' }}>
                  <Link href="/resources" style={{ fontSize: '0.75rem', color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                    Browse all resources →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recently joined */}
          {recentMembers.length > 0 && (
            <div className="ms-box">
              <div className="ms-box-header">
                <h2><span role="img" aria-label="little green person with plus sign emoticon"><PersonPlusIcon /></span> New Members</h2>
                <Link href="/members" style={{ fontSize: '0.75rem', color: 'inherit', textDecoration: 'underline' }}>all</Link>
              </div>
              <div style={{ padding: '4px 0' }}>
                {recentMembers.map((m) => {
                  const mName = m.display_name || m.full_name;
                  return (
                    <Link
                      key={m.id}
                      href={profileHref(m)}
                      aria-label={`View ${mName}'s profile`}
                      className="ms-hub-row"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '6px 8px', textDecoration: 'none',
                        borderBottom: '1px solid var(--ms-border)',
                      }}
                    >
                      <div className="member-avatar" aria-hidden="true" style={{ width: 32, height: 32, minWidth: 32, fontSize: '0.875rem', flexShrink: 0 }}>
                        {m.avatar_url
                          ? /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : mName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--aac-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mName}
                        </p>
                        {m.approved_at && (
                          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                            <time dateTime={m.approved_at}>{relativeDate(m.approved_at)}</time>
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
        </aside>

      </div>{/* end ms-hub-grid */}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="ms-footer" aria-label="Site footer">
        <nav aria-label="Footer navigation" style={{ display: 'inline' }}>
          <Link href="/dashboard"    style={{ color: 'inherit', textDecoration: 'none' }}>My Collective</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/messages"   style={{ color: 'inherit', textDecoration: 'none' }}>Messages</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/members" style={{ color: 'inherit', textDecoration: 'none' }}>Directory</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/resources"  style={{ color: 'inherit', textDecoration: 'none' }}>Resources</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/contact"    style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
        </nav>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>
          ©{new Date().getFullYear()} Artistic Accessibility Collective · <em>together, together</em>
        </span>
      </footer>

    </main>
  </BrowserChrome>
  );
}
