'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, type Profile, profileHref } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MemberHub() {
  const router = useRouter();

  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [memberCount,  setMemberCount]  = useState(0);
  const [newMembers,   setNewMembers]   = useState<Profile[]>([]);

  useEffect(() => {
    document.title = 'My Collective — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

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

    if (!profileData) { router.push('/login'); return; }
    setProfile(profileData);

    // Fetch member count + recently joined (one call, limit 6)
    const { data: recentMembers, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .eq('public_visible', true)
      .order('approved_at', { ascending: false })
      .limit(6);

    setMemberCount(count ?? 0);
    setNewMembers(recentMembers ?? []);

    // Fetch unread message count.
    // Unread = messages in my conversations that I didn't send + haven't been read.
    // Guard with try/catch in case the messages table doesn't exist yet
    // (migration not yet run).
    try {
      const { data: myConvs } = await supabase
        .from('conversations')
        .select('id')
        .or(`profile_a_id.eq.${profileData.id},profile_b_id.eq.${profileData.id}`);

      if (myConvs && myConvs.length > 0) {
        const convIds = myConvs.map((c) => c.id);
        const { count: unread } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .is('read_at', null)
          .neq('sender_profile_id', profileData.id);

        setUnreadCount(unread ?? 0);
      }
    } catch {
      // Messages table not yet created — show 0 unread
    }

    setLoading(false);
  }, [router]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading your hub">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading…</span>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const name      = profile.display_name || profile.full_name;
  const firstName = name.split(' ')[0];
  const initial   = name.charAt(0).toUpperCase();

  return (
    <main className="page-wrapper">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="site-header">
        <Link href="/members" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-across-blue-bg.svg" alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/messages" className="nav-link" aria-label={unreadCount > 0 ? `Messages — ${unreadCount} unread` : 'Messages'}>
            Messages
            {unreadCount > 0 && (
              <span className="ms-unread-badge" aria-hidden="true">{unreadCount}</span>
            )}
          </Link>
          <Link href="/collective" className="nav-link">Directory</Link>
          <Link href="/resources"  className="nav-link">Resources</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="btn btn-outline-white btn-sm"
            aria-label="Sign out of your account"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <div className="page-container-wide" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* ── Welcome banner ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div
            className="member-avatar member-avatar-lg"
            aria-hidden="true"
          >
            {profile.avatar_url
              ? /* eslint-disable-next-line @next/next/no-img-element */
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initial}
          </div>
          <div>
            <h1 style={{ color: 'var(--aac-blue-dark)', fontWeight: 'bold', fontSize: 'clamp(1.25rem, 3.5vw, 1.875rem)', marginBottom: '0.25rem' }}>
              Welcome back, {firstName}!
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {profile.pronouns && <>{profile.pronouns} · </>}
              {[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        {/* ── Quick-nav cards ─────────────────────────────────────────── */}
        <section aria-label="Quick navigation">
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1rem',
              listStyle: 'none',
              padding: 0,
              margin: '0 0 2.5rem',
            }}
          >
            {/* Messages */}
            <li>
              <Link
                href="/messages"
                className="ms-nav-card"
                aria-label={unreadCount > 0 ? `Messages — ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'Messages — no unread messages'}
              >
                <div className="ms-box" style={{ height: '100%' }}>
                  <div className="ms-box-header">
                    <span>📬 Messages</span>
                    {unreadCount > 0 && (
                      <span
                        style={{ background: '#be123c', color: '#fff', borderRadius: '999px', padding: '0 7px', fontSize: '0.75rem', fontWeight: 700 }}
                        aria-hidden="true"
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="ms-box-body" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '8px 10px' }}>
                    {unreadCount > 0
                      ? `You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}.`
                      : 'Your inbox is all caught up.'}
                  </div>
                </div>
              </Link>
            </li>

            {/* My Profile */}
            <li>
              <Link
                href={profileHref(profile)}
                className="ms-nav-card"
                aria-label="View my public profile"
              >
                <div className="ms-box" style={{ height: '100%' }}>
                  <div className="ms-box-header">👤 My Profile</div>
                  <div className="ms-box-body" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '8px 10px' }}>
                    View and update your public profile — specialties, bio, links, and more.
                  </div>
                </div>
              </Link>
            </li>

            {/* Directory */}
            <li>
              <Link
                href="/collective"
                className="ms-nav-card"
                aria-label={`Member directory — ${memberCount} member${memberCount !== 1 ? 's' : ''}`}
              >
                <div className="ms-box" style={{ height: '100%' }}>
                  <div className="ms-box-header">
                    <span>👥 Member Directory</span>
                    {memberCount > 0 && (
                      <span style={{ fontWeight: 400, color: '#b8ccff', fontSize: '0.6875rem' }}>
                        {memberCount}
                      </span>
                    )}
                  </div>
                  <div className="ms-box-body" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '8px 10px' }}>
                    Browse and connect with accessibility professionals across the Collective.
                  </div>
                </div>
              </Link>
            </li>

            {/* Resources */}
            <li>
              <Link
                href="/resources"
                className="ms-nav-card"
                aria-label="Free accessibility resource directory"
              >
                <div className="ms-box" style={{ height: '100%' }}>
                  <div className="ms-box-header">📚 Resources</div>
                  <div className="ms-box-body" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '8px 10px' }}>
                    Free tools, guides, and organizations — save your favorites and suggest new ones.
                  </div>
                </div>
              </Link>
            </li>

            {/* Feedback */}
            <li>
              <Link
                href="/feedback"
                className="ms-nav-card"
                aria-label="Share tester feedback"
              >
                <div className="ms-box" style={{ height: '100%' }}>
                  <div className="ms-box-header">💬 Share Feedback</div>
                  <div className="ms-box-body" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', padding: '8px 10px' }}>
                    You&apos;re a founding member. Your feedback directly shapes what this becomes.
                  </div>
                </div>
              </Link>
            </li>
          </ul>
        </section>

        {/* ── Recently joined ─────────────────────────────────────────── */}
        {newMembers.length > 0 && (
          <section aria-labelledby="new-members-heading">
            <div className="ms-box">
              <div className="ms-box-header" id="new-members-heading">
                🌟 Recently Joined
              </div>
              <div style={{ padding: '10px' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  The newest members of the Collective — say hello!
                </p>
                <ul
                  aria-label="Recently joined members"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '10px',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {newMembers.map((m) => {
                    const mName = m.display_name || m.full_name;
                    // Skip own card
                    if (m.id === profile.id) return null;
                    return (
                      <li key={m.id}>
                        <Link
                          href={profileHref(m)}
                          aria-label={`View ${mName}'s profile`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 8px',
                            border: '1px solid var(--ms-border)',
                            background: 'var(--aac-cream)',
                            textDecoration: 'none',
                            transition: 'border-color 0.12s, box-shadow 0.12s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--aac-blue)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '2px 2px 6px rgba(38,53,144,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--ms-border)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          }}
                        >
                          <div
                            className="member-avatar"
                            aria-hidden="true"
                            style={{ width: 48, height: 48, fontSize: '1.1rem' }}
                          >
                            {m.avatar_url
                              ? /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : mName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '0.8125rem', color: 'var(--aac-navy)', marginBottom: '2px', lineHeight: 1.3 }}>
                              {mName}
                            </p>
                            {m.pronouns && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.pronouns}</p>
                            )}
                            {m.approved_at && (
                              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                                Joined <time dateTime={m.approved_at}>{relativeDate(m.approved_at)}</time>
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="ms-footer" aria-label="Site footer">
        <nav aria-label="Footer navigation" style={{ display: 'inline' }}>
          <Link href="/members"    style={{ color: 'inherit', textDecoration: 'none' }}>My Hub</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/messages"   style={{ color: 'inherit', textDecoration: 'none' }}>Messages</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/collective" style={{ color: 'inherit', textDecoration: 'none' }}>Directory</Link>
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
  );
}
