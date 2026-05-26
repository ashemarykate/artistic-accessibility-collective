'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { supabase, type Profile, type Conversation, type Message, getOrCreateConversation, profileHref } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

// ── Types for the inbox view ──────────────────────────────────────────────────

type ConvRow = Conversation & {
  other: Pick<Profile, 'id' | 'full_name' | 'display_name' | 'pronouns' | 'avatar_url' | 'username'>;
  lastMessage: Message | null;
  unreadCount: number;
};

// ── Time formatter ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d    = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)     return 'just now';
  if (mins < 60)    return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)    return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)     return d.toLocaleDateString(undefined, { weekday: 'short' });
  if (days < 365)   return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function MessagesInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [myProfile,    setMyProfile]    = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [redirecting,  setRedirecting]  = useState(false);

  // Compose form state
  const [showCompose,    setShowCompose]    = useState(false);
  const [composeSearch,  setComposeSearch]  = useState('');
  const [memberResults,  setMemberResults]  = useState<Pick<Profile, 'id' | 'full_name' | 'display_name' | 'pronouns' | 'avatar_url' | 'username'>[]>([]);
  const [searching,      setSearching]      = useState(false);
  const composeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Messages — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => { loadInbox(); }, []);

  // ── Handle ?to= param — navigate directly to a new/existing conversation ──
  useEffect(() => {
    const toId = searchParams.get('to');
    if (!toId || !myProfile) return;

    setRedirecting(true);
    getOrCreateConversation(myProfile.id, toId).then((convId) => {
      if (convId) router.replace(`/messages/${convId}`);
      else setRedirecting(false);
    });
  }, [searchParams, myProfile, router]);

  // ── Load inbox ─────────────────────────────────────────────────────────────
  const loadInbox = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    if (!profileData) { router.push('/login'); return; }
    setMyProfile(profileData);

    // Fetch conversations where I'm a participant
    const { data: convData } = await supabase
      .from('conversations')
      .select('*')
      .or(`profile_a_id.eq.${profileData.id},profile_b_id.eq.${profileData.id}`)
      .order('last_message_at', { ascending: false });

    if (!convData || convData.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Collect all other-person profile IDs
    const otherIds = convData.map((c) =>
      c.profile_a_id === profileData.id ? c.profile_b_id : c.profile_a_id
    );

    // Fetch all those profiles + all messages in one go
    const [{ data: otherProfiles }, { data: allMessages }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, display_name, pronouns, avatar_url, username')
        .in('id', otherIds),
      supabase
        .from('messages')
        .select('*')
        .in('conversation_id', convData.map((c) => c.id))
        .order('sent_at', { ascending: false }),
    ]);

    const profileMap = new Map((otherProfiles ?? []).map((p) => [p.id, p]));
    const msgsByConv = new Map<string, Message[]>();
    for (const msg of allMessages ?? []) {
      const list = msgsByConv.get(msg.conversation_id) ?? [];
      list.push(msg);
      msgsByConv.set(msg.conversation_id, list);
    }

    const rows: ConvRow[] = convData.map((c) => {
      const otherId     = c.profile_a_id === profileData.id ? c.profile_b_id : c.profile_a_id;
      const other       = profileMap.get(otherId);
      const msgs        = msgsByConv.get(c.id) ?? [];
      const lastMessage = msgs[0] ?? null;          // already sorted desc
      const unreadCount = msgs.filter(
        (m) => m.sender_profile_id !== profileData.id && !m.read_at
      ).length;

      return { ...c, other: other as ConvRow['other'], lastMessage, unreadCount };
    }).filter((r) => r.other); // skip rows where other profile was deleted

    setConversations(rows);
    setLoading(false);
  }, [router]);

  // ── Member search for compose ──────────────────────────────────────────────
  useEffect(() => {
    if (!composeSearch.trim()) { setMemberResults([]); return; }
    const q = composeSearch.trim();
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, display_name, pronouns, avatar_url, username')
        .eq('status', 'approved')
        .neq('id', myProfile?.id ?? '')
        .or(`full_name.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(8);
      setMemberResults(data ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [composeSearch, myProfile]);

  const openCompose = () => {
    setShowCompose(true);
    setComposeSearch('');
    setMemberResults([]);
    setTimeout(() => composeInputRef.current?.focus(), 50);
  };

  const startConversation = async (otherProfileId: string) => {
    if (!myProfile) return;
    const convId = await getOrCreateConversation(myProfile.id, otherProfileId);
    if (convId) router.push(`/messages/${convId}`);
  };

  // ── Loading / redirect states ──────────────────────────────────────────────
  if (loading || redirecting) {
    return (
      <BrowserChrome variant="aol" title="Messages — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/messages">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label={redirecting ? 'Opening conversation…' : 'Loading messages'}>
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>{redirecting ? 'Opening conversation…' : 'Loading messages…'}</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <BrowserChrome variant="aol" title="Messages — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/messages">
    <main className="page-wrapper">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="site-header">
        <Link href="/dashboard" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-across-blue-bg.svg" alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/dashboard"    className="nav-link">Backstage</Link>
          <Link href="/members" className="nav-link">Directory</Link>
          <Link href="/resources"  className="nav-link">Resources</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="btn btn-outline-white btn-sm"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <div className="page-container" style={{ maxWidth: '680px', paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ color: 'var(--aac-blue-dark)', fontWeight: 'bold', fontSize: 'clamp(1.25rem, 3vw, 1.625rem)', marginBottom: '0.125rem' }}>
              📬 Messages
            </h1>
            {totalUnread > 0 && (
              <p role="status" style={{ color: '#be123c', fontWeight: 600, fontSize: '0.875rem' }}>
                {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={openCompose}
            className="btn btn-primary"
            aria-expanded={showCompose}
            aria-controls="compose-form"
          >
            ✉️ New Message
          </button>
        </div>

        {/* ── Compose form ────────────────────────────────────────────── */}
        {showCompose && (
          <div
            id="compose-form"
            className="ms-box"
            style={{ marginBottom: '1.5rem' }}
            role="region"
            aria-label="Compose a new message"
          >
            <div className="ms-box-header">
              <span>New Message</span>
              <button
                onClick={() => setShowCompose(false)}
                aria-label="Close compose form"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8ccff', fontSize: '0.75rem', padding: 0 }}
              >
                [close]
              </button>
            </div>
            <div style={{ padding: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="compose-search" className="form-label" style={{ fontSize: '0.8125rem' }}>
                  Send a message to…
                </label>
                <input
                  id="compose-search"
                  ref={composeInputRef}
                  type="search"
                  className="form-input"
                  placeholder="Search members by name…"
                  value={composeSearch}
                  onChange={(e) => setComposeSearch(e.target.value)}
                  aria-autocomplete="list"
                  aria-controls="compose-results"
                  aria-describedby="compose-hint"
                />
                <p id="compose-hint" className="sr-only">
                  Type a member&apos;s name to search. Select a result to open a conversation.
                </p>
              </div>

              {/* Results */}
              {searching && (
                <p role="status" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  Searching…
                </p>
              )}
              {!searching && memberResults.length > 0 && (
                <ul
                  id="compose-results"
                  role="listbox"
                  aria-label="Member search results"
                  style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', border: '1px solid var(--ms-border)' }}
                >
                  {memberResults.map((m) => {
                    const mName = m.display_name || m.full_name;
                    return (
                      <li key={m.id} role="option" aria-selected="false">
                        <button
                          onClick={() => startConversation(m.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '8px 10px',
                            background: 'none',
                            border: 'none',
                            borderBottom: '1px solid var(--ms-border)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            font: 'inherit',
                            fontSize: '0.875rem',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--ms-row-alt)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                          aria-label={`Start a conversation with ${mName}`}
                        >
                          <div className="member-avatar" aria-hidden="true" style={{ width: 36, height: 36, minWidth: 36, fontSize: '0.875rem' }}>
                            {m.avatar_url
                              ? /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : mName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 'bold', color: 'var(--aac-navy)', margin: 0 }}>{mName}</p>
                            {m.pronouns && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>{m.pronouns}</p>}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!searching && composeSearch.trim() && memberResults.length === 0 && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                  No members found for &ldquo;{composeSearch}&rdquo;.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Conversation list ────────────────────────────────────────── */}
        {conversations.length === 0 ? (
          <div className="ms-box">
            <div className="ms-box-body" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                No messages yet. Start a conversation!
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Visit a member&apos;s profile and click &ldquo;Send Message,&rdquo; or use the{' '}
                <button
                  onClick={openCompose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--aac-blue)', textDecoration: 'underline', font: 'inherit', padding: 0 }}
                >
                  New Message
                </button>{' '}
                button above.
              </p>
            </div>
          </div>
        ) : (
          <section aria-label="Your conversations">
            <div className="ms-box">
              <div className="ms-box-header">
                <span>Conversations</span>
                <span style={{ fontWeight: 400, color: '#b8ccff', fontSize: '0.6875rem' }}>
                  {conversations.length} thread{conversations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {conversations.map((conv, i) => {
                  const other       = conv.other;
                  const otherName   = other.display_name || other.full_name;
                  const hasUnread   = conv.unreadCount > 0;
                  const preview     = conv.lastMessage?.body ?? 'No messages yet.';
                  const isSentByMe  = conv.lastMessage?.sender_profile_id === myProfile?.id;
                  const previewText = isSentByMe ? `You: ${preview}` : preview;

                  return (
                    <li key={conv.id} style={{ borderBottom: i < conversations.length - 1 ? '1px solid var(--ms-border)' : 'none' }}>
                      <Link
                        href={`/messages/${conv.id}`}
                        className={`msg-conv-item${hasUnread ? ' unread' : ''}`}
                        aria-label={`Conversation with ${otherName}${hasUnread ? ` — ${conv.unreadCount} unread` : ''}`}
                      >
                        {/* Unread indicator */}
                        <div
                          className={hasUnread ? 'msg-unread-dot' : ''}
                          style={!hasUnread ? { width: 9, height: 9, minWidth: 9 } : {}}
                          aria-hidden="true"
                        />

                        {/* Avatar */}
                        <div className="member-avatar" aria-hidden="true" style={{ width: 44, height: 44, minWidth: 44, fontSize: '1rem', flexShrink: 0 }}>
                          {other.avatar_url
                            ? /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={other.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : otherName.charAt(0).toUpperCase()}
                        </div>

                        {/* Text content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                            <p className="msg-conv-name" style={hasUnread ? { color: 'var(--aac-navy)' } : {}}>
                              {otherName}
                            </p>
                            {conv.lastMessage && (
                              <time
                                className="msg-conv-time"
                                dateTime={conv.lastMessage.sent_at}
                                aria-label={new Date(conv.lastMessage.sent_at).toLocaleString()}
                              >
                                {formatTime(conv.lastMessage.sent_at)}
                              </time>
                            )}
                          </div>
                          <p className="msg-conv-preview" style={hasUnread ? { fontWeight: 600, color: 'var(--color-text)' } : {}}>
                            {previewText}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="sr-only">{conv.unreadCount} unread</span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="ms-footer" aria-label="Site footer">
        <nav aria-label="Footer navigation" style={{ display: 'inline' }}>
          <Link href="/dashboard"    style={{ color: 'inherit', textDecoration: 'none' }}>Backstage</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/members" style={{ color: 'inherit', textDecoration: 'none' }}>Directory</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/resources"  style={{ color: 'inherit', textDecoration: 'none' }}>Resources</Link>
        </nav>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>
          ©{new Date().getFullYear()} Artistic Accessibility Collective
        </span>
      </footer>

    </main>
  </BrowserChrome>
  );
}

// ── Exported page — wraps inner with Suspense for useSearchParams ─────────────

export default function MessagesPage() {
  return (
    <BrowserChrome variant="aol" title="Messages — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/messages">
    <Suspense fallback={
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading messages">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading…</span>
        </div>
      </main>
    }>
      <MessagesInner />
    </Suspense>
    </BrowserChrome>
  );
}
