'use client';
import Logo from '@/components/Logo';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Profile, type Conversation, type Message, profileHref } from '@/lib/supabase';
import { RESOURCE_BY_SLUG } from '@/lib/resources-data';
import { EnvelopeIcon, PersonBubbleIcon, PersonStarIcon, PeopleIcon, FavoritesStarIcon, PersonPlusIcon, WrenchIcon, PencilIcon, MonitorPlayIcon, ListIcon, LiveCameraIcon, LocationPinIcon } from '@/app/components/PixelIcons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

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

// ── Conversation preview row ──────────────────────────────────────────────────

type ConvPreview = {
  id: string;
  other: Pick<Profile, 'id' | 'full_name' | 'display_name' | 'avatar_url' | 'username'>;
  lastMessage: Message | null;
  unread: boolean;
};

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

  useEffect(() => {
    document.title = 'My Collective · Artistic Accessibility Collective';
    if (typeof window !== 'undefined' && localStorage.getItem('mc-intro-dismissed') === '1') {
      setIntroDismissed(true);
    }
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  const dismissIntro = () => {
    setIntroDismissed(true);
    if (typeof window !== 'undefined') localStorage.setItem('mc-intro-dismissed', '1');
  };

  useEffect(() => { loadHub(); }, []);

  const loadHub = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    if (!profileData) {
      // No profile found by user_id — try to link by email via SECURITY DEFINER RPC.
      // Direct SELECT on unlinked profiles fails due to RLS (no policy covers
      // unlinked rows), so we delegate to a server-side function that bypasses it.
      const { data: linked } = await supabase.rpc('link_profile_to_auth_user');
      if (linked) {
        // Link succeeded — re-run loadHub now that user_id is set in the DB
        loadHub();
        return;
      }
      await supabase.auth.signOut();
      router.replace('/login?error=profile_not_linked');
      return;
    }
    setProfile(profileData);
    const resolvedProfile = profileData;

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

    // Messaging (wrapped in try/catch — safe before migration runs)
    try {
      const { data: myConvs } = await supabase
        .from('conversations')
        .select('*')
        .or(`profile_a_id.eq.${resolvedProfile.id},profile_b_id.eq.${resolvedProfile.id}`)
        .order('last_message_at', { ascending: false })
        .limit(4);

      if (myConvs && myConvs.length > 0) {
        const convIds = myConvs.map((c: Conversation) => c.id);

        // Fetch unread count
        const { count: unread } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .is('read_at', null)
          .neq('sender_profile_id', resolvedProfile.id);
        setUnreadCount(unread ?? 0);

        // Fetch latest message per conversation + other profile
        const otherIds = myConvs.map((c: Conversation) =>
          c.profile_a_id === resolvedProfile.id ? c.profile_b_id : c.profile_a_id
        );

        const [{ data: otherProfiles }, { data: lastMsgs }] = await Promise.all([
          supabase.from('profiles')
            .select('id, full_name, display_name, avatar_url, username')
            .in('id', otherIds),
          supabase.from('messages')
            .select('*')
            .in('conversation_id', convIds)
            .order('sent_at', { ascending: false }),
        ]);

        const otherMap = Object.fromEntries(
          (otherProfiles ?? []).map((p: any) => [p.id, p])
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
    } catch {
      // Messages table not yet created
    }

    // Saved resources — fetch slugs and look up names from shared resource data
    try {
      const { data: favRows } = await supabase
        .from('resource_favorites')
        .select('resource_slug')
        .eq('user_id', user.id);

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
    } catch {
      // resource_favorites not yet created
    }

    setLoading(false);
  }, [router]);

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

      {/* ── Hello bar ──────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--aac-cream)', borderBottom: '1px solid var(--ms-border)', padding: '6px 12px' }}>
        <h1 style={{ fontWeight: 'bold', fontSize: '1.125rem', color: 'var(--aac-navy)', margin: 0 }}>
          Hello, {firstName}!
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          My URL:{' '}
          <Link href={profileHref(profile)} style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
            artisticaccessibility.com/profile/{profile.username ?? profile.id.slice(0, 8)}
          </Link>
          {' · '}
          <Link href="/profile/edit" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
            <PencilIcon />Edit Profile
          </Link>
        </p>
      </div>

      {/* ── Three-column layout ────────────────────────────────────────── */}
      <div className="ms-hub-grid">

        {/* ════════════════ LEFT SIDEBAR ════════════════ */}
        <aside aria-label="Profile sidebar">

          {/* Profile card */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header" style={{ fontSize: '0.8rem' }}>
              <h2>
                {displayName}
                {isAdmin ? (
                  <span className="ms-admin-badge" style={{ marginLeft: '4px' }} aria-label="Admin">✦ Admin</span>
                ) : (
                  <span className="ms-member-badge" style={{ marginLeft: '4px' }} aria-label="Member">✦ Member</span>
                )}
              </h2>
            </div>
            <div style={{ padding: '8px', textAlign: 'center' }}>
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
              {[
                { href: '/messages', label: '📬 Messages', badge: unreadCount > 0 ? unreadCount : null },
                { href: '/members', label: '👥 Directory', badge: null },
                { href: '/resources', label: '📚 Resources', badge: null },
                { href: '/feedback', label: '💬 Feedback', badge: null },
                ...(isAdmin ? [{ href: '/admin', label: '⚙️ Admin', badge: null }] : []),
              ].map(({ href, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className="ms-hub-row"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 10px', fontSize: '0.8125rem', color: 'var(--aac-navy)',
                    textDecoration: 'none', borderBottom: '1px solid var(--ms-border)',
                  }}
                >
                  <span>{label}</span>
                  {badge !== null && (
                    <span
                      style={{ background: '#be123c', color: '#fff', borderRadius: '999px', padding: '0 6px', fontSize: '0.6875rem', fontWeight: 700 }}
                      aria-label={`${badge} unread`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
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
            </nav>
          </div>

        </aside>

        {/* ════════════════ CENTER COLUMN ════════════════ */}
        <div role="region" aria-label="Your hub">

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
                    <strong>Save what you love.</strong> Tap the heart on any resource over in{' '}
                    <Link href="/resources" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>Resources</Link>{' '}
                    and it lands in your My Resources box, ready whenever you need it.
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
              {convPreviews.length === 0 ? (
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

          {/* Discussion board — coming soon */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little yellow person with speech bubble emoticon"><PersonBubbleIcon /></span> Discussion Board</h2>
              <span style={{ fontSize: '0.6875rem', background: 'var(--aac-yellow)', color: 'var(--aac-navy)', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>
                Coming Soon
              </span>
            </div>
            <div style={{ padding: '16px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
                A community space for questions, announcements, and conversations across the Collective. Coming in a future update.
              </p>
            </div>
          </div>

          {/* Job board — coming soon */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little orange person with star emoticon"><PersonStarIcon /></span> Job Board</h2>
              <span style={{ fontSize: '0.6875rem', background: 'var(--aac-yellow)', color: 'var(--aac-navy)', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>
                Coming Soon
              </span>
            </div>
            <div style={{ padding: '16px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
                Gig postings, contract opportunities, and full-time roles in arts accessibility, posted by and for Collective members.
              </p>
            </div>
          </div>

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

          {/* Learning Portal — coming soon */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little purple monitor with play button emoticon"><MonitorPlayIcon /></span> Learning Portal</h2>
              <span style={{ fontSize: '0.6875rem', background: 'var(--aac-yellow)', color: 'var(--aac-navy)', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>
                Coming Soon
              </span>
            </div>
            <div style={{ padding: '16px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
                Custom learning videos built for Collective members: skill-building, industry knowledge, and professional development, right here in your hub.
              </p>
            </div>
          </div>

          {/* Upcoming Live Events — coming soon */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little magenta camera with live dot emoticon"><LiveCameraIcon /></span> Upcoming Live Events</h2>
              <span style={{ fontSize: '0.6875rem', background: 'var(--aac-yellow)', color: 'var(--aac-navy)', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>
                Coming Soon
              </span>
            </div>
            <div style={{ padding: '16px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
                Virtual events, webinars, and live sessions hosted by and for the Collective, streamed directly to members.
              </p>
            </div>
          </div>

          {/* Upcoming In-Person Events — coming soon */}
          <div className="ms-box">
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little amber location pin emoticon"><LocationPinIcon /></span> Upcoming In-Person Events</h2>
              <span style={{ fontSize: '0.6875rem', background: 'var(--aac-yellow)', color: 'var(--aac-navy)', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>
                Coming Soon
              </span>
            </div>
            <div style={{ padding: '16px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: '340px', margin: '0 auto' }}>
                Workshops, meetups, and gatherings happening near you. Connect with Collective members in real life.
              </p>
            </div>
          </div>

        </div>

        {/* ════════════════ RIGHT SIDEBAR ════════════════ */}
        <aside aria-label="Right sidebar">

          {/* Saved resources */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little gold star emoticon"><FavoritesStarIcon /></span> My Resources</h2>
              <Link href="/resources" style={{ fontSize: '0.75rem', color: 'inherit', textDecoration: 'underline' }}>all</Link>
            </div>
            {savedResources.length === 0 ? (
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

          {/* My Lists — coming soon */}
          <div className="ms-box" style={{ marginBottom: '8px' }}>
            <div className="ms-box-header">
              <h2><span role="img" aria-label="little blue bulleted list emoticon"><ListIcon /></span> My Lists</h2>
            </div>
            <div style={{ padding: '10px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Save custom lists of members by specialty, location, language, or anyone you want to find again fast.
              </p>
              <Link href="/my-lists" className="btn btn-primary btn-sm" style={{ width: '100%', textAlign: 'center', fontSize: '0.75rem' }}>
                Tell us what you&apos;d want →
              </Link>
            </div>
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
