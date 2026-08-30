'use client';
import Logo from '@/components/Logo';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getSessionUser, type Profile, type Message, profileHref } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

// ── Time formatter ────────────────────────────────────────────────────────────

function formatMessageTime(iso: string): string {
  const d    = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  // For older messages use a human-readable date + time
  return d.toLocaleString(undefined, {
    weekday:  'short',
    month:    'short',
    day:      'numeric',
    hour:     'numeric',
    minute:   '2-digit',
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();

  const [myProfile,   setMyProfile]   = useState<Profile | null>(null);
  const [otherProfile, setOtherProfile] = useState<Pick<Profile, 'id' | 'full_name' | 'display_name' | 'pronouns' | 'avatar_url' | 'username'> | null>(null);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [accessError, setAccessError] = useState(false);

  const [body,        setBody]        = useState('');
  const [sending,     setSending]     = useState(false);
  const [sendError,   setSendError]   = useState('');

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // ── Auto-scroll to bottom when messages change ────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load conversation ─────────────────────────────────────────────────────
  const loadConversation = useCallback(async () => {
    const user = await getSessionUser();
    if (!user) { router.push('/login'); return; }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    // Logged in but no linked profile: let My Collective run the linking
    // flow (and show its help message if that fails) instead of bouncing a
    // signed-in member to the login screen.
    if (!profileData) { router.replace('/dashboard'); return; }
    setMyProfile(profileData);

    // Fetch the conversation — RLS ensures we only get it if we're a participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conv) {
      setAccessError(true);
      setLoading(false);
      return;
    }

    // Determine the other participant
    const otherId = conv.profile_a_id === profileData.id
      ? conv.profile_b_id
      : conv.profile_a_id;

    // Fetch the other person's profile
    const { data: otherData } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, pronouns, avatar_url, username')
      .eq('id', otherId)
      .maybeSingle();

    setOtherProfile(otherData);

    // Fetch all messages in this conversation
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    setMessages(msgs ?? []);
    setLoading(false);

    // Mark unread messages (sent by the other person) as read
    const unreadIds = (msgs ?? [])
      .filter((m) => m.sender_profile_id !== profileData.id && !m.read_at)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }
  }, [conversationId, router]);

  useEffect(() => { queueMicrotask(() => { loadConversation(); }); }, [loadConversation]);

  // ── Send a message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = body.trim();
    if (!text || !myProfile || sending) return;

    setSending(true);
    setSendError('');

    const { data: newMsg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id:   conversationId,
        sender_profile_id: myProfile.id,
        body:              text,
      })
      .select()
      .single();

    if (error || !newMsg) {
      setSendError('Message could not be sent. Please try again.');
      setSending(false);
      return;
    }

    // Optimistically append
    setMessages((prev) => [...prev, newMsg]);
    setBody('');
    setSending(false);

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: newMsg.sent_at })
      .eq('id', conversationId);

    // Return focus to textarea
    textareaRef.current?.focus();
  }, [body, myProfile, conversationId, sending]);

  // ── Keyboard shortcut: Enter to send, Shift+Enter for newline ────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <BrowserChrome variant="aol" title="Messages · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/messages">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading conversation">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading conversation…</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  if (accessError) {
    return (
      <BrowserChrome variant="aol" title="Messages · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/messages">
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }}>
        <div className="content-card" style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.25rem', marginBottom: '1rem' }}>
            Conversation not found
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            This conversation doesn&apos;t exist or you&apos;re not a participant.
          </p>
          <Link href="/messages" className="btn btn-primary">Back to Inbox</Link>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  const otherName    = otherProfile
    ? (otherProfile.display_name || otherProfile.full_name)
    : 'Unknown Member';
  const otherInitial = otherName.charAt(0).toUpperCase();

  // Group messages: add a date separator when the date changes
  type MsgOrSep = { type: 'message'; msg: Message } | { type: 'separator'; label: string };
  const grouped: MsgOrSep[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const date = new Date(msg.sent_at).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    if (date !== lastDate) {
      grouped.push({ type: 'separator', label: date });
      lastDate = date;
    }
    grouped.push({ type: 'message', msg });
  }

  const convTitle = otherProfile
    ? `${otherProfile.display_name || otherProfile.full_name} · Messages`
    : 'Messages';

  return (
    <BrowserChrome variant="aol" title={`${convTitle} · Artistic Accessibility Collective`} url="http://members.artisticaccessibility.com/messages">
    <main className="page-wrapper">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="site-header">
        <Link href="/dashboard" className="site-header-logo" aria-label="Artistic Accessibility Collective, home">
          <Logo alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/messages"   className="nav-link">← Inbox</Link>
          <Link href="/members" className="nav-link">Directory</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="btn btn-outline-white btn-sm"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <div className="page-container" style={{ maxWidth: '680px', paddingTop: '1.5rem', paddingBottom: '2rem' }}>

        {/* ── Conversation header ──────────────────────────────────────── */}
        <div className="ms-box" style={{ marginBottom: '1rem' }}>
          <div className="ms-box-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="member-avatar" aria-hidden="true" style={{ width: 32, height: 32, minWidth: 32, fontSize: '0.875rem' }}>
                {otherProfile?.avatar_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={otherProfile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : otherInitial}
              </div>
              <span>
                {otherProfile
                  ? <Link href={profileHref(otherProfile)} style={{ color: 'inherit', textDecoration: 'none' }} aria-label={`View ${otherName}'s profile`}>{otherName}</Link>
                  : otherName}
              </span>
            </div>
            <Link href="/messages" className="btn btn-ghost btn-sm" aria-label="Back to inbox">
              ← Inbox
            </Link>
          </div>
        </div>

        {/* ── Message thread ───────────────────────────────────────────── */}
        <div
          className="ms-box"
          style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}
        >
          {/* Role="log" announces additions to screen readers automatically */}
          <div
            role="log"
            aria-label={`Conversation with ${otherName}`}
            aria-live="polite"
            aria-relevant="additions"
            className="msg-thread-log"
            style={{ flex: 1 }}
          >
            {messages.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '0.875rem', padding: '1.5rem 0' }}>
                No messages yet. Say hello!
              </p>
            ) : (
              grouped.map((item, idx) => {
                if (item.type === 'separator') {
                  return (
                    <div
                      key={`sep-${idx}`}
                      role="separator"
                      aria-label={item.label}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}
                    >
                      <div style={{ flex: 1, height: 1, background: 'var(--ms-border)' }} aria-hidden="true" />
                      <time style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </time>
                      <div style={{ flex: 1, height: 1, background: 'var(--ms-border)' }} aria-hidden="true" />
                    </div>
                  );
                }

                const { msg } = item;
                const isMine  = msg.sender_profile_id === myProfile?.id;
                const senderName = isMine ? 'You' : otherName;

                return (
                  <div
                    key={msg.id}
                    className={`msg-row ${isMine ? 'msg-row-mine' : 'msg-row-theirs'}`}
                  >
                    {/* Screen reader: sender name before message content */}
                    <span className="sr-only">{senderName} said:</span>

                    <div className={`msg-bubble ${isMine ? 'msg-bubble-mine' : 'msg-bubble-theirs'}`}>
                      {msg.body}
                    </div>

                    <div className="msg-meta">
                      <time dateTime={msg.sent_at} aria-label={`Sent ${formatMessageTime(msg.sent_at)}`}>
                        {formatMessageTime(msg.sent_at)}
                      </time>
                      {isMine && msg.read_at && (
                        <span aria-label="Read by recipient"> · ✓ Read</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Scroll anchor — brings latest message into view */}
            <div ref={bottomRef} aria-hidden="true" />
          </div>

          {/* ── Reply form ────────────────────────────────────────────── */}
          <form
            onSubmit={handleSend}
            className="msg-reply-form"
            aria-label={`Reply to ${otherName}`}
            noValidate
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="msg-reply" className="form-label" style={{ fontSize: '0.8125rem' }}>
                Reply
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.75rem' }}>
                  (Enter to send · Shift+Enter for new line)
                </span>
              </label>
              <textarea
                id="msg-reply"
                ref={textareaRef}
                className="form-input form-textarea"
                rows={3}
                style={{ resize: 'none', overflow: 'hidden', minHeight: '72px', fontSize: '0.9rem' }}
                placeholder={`Message ${otherName}…`}
                value={body}
                onChange={handleBodyChange}
                onKeyDown={handleKeyDown}
                aria-required="true"
                aria-describedby={sendError ? 'send-error' : undefined}
                disabled={sending}
              />
            </div>

            {sendError && (
              <p id="send-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', margin: 0 }}>
                {sendError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
              {sending && (
                <span role="status" className="sr-only">Sending…</span>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={sending || !body.trim()}
                aria-disabled={sending || !body.trim()}
              >
                {sending ? (
                  <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Sending…</>
                ) : (
                  'Send ↵'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="ms-footer" aria-label="Site footer">
        <nav aria-label="Footer navigation" style={{ display: 'inline' }}>
          <Link href="/dashboard"    style={{ color: 'inherit', textDecoration: 'none' }}>My Collective</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/messages"   style={{ color: 'inherit', textDecoration: 'none' }}>Messages</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/members" style={{ color: 'inherit', textDecoration: 'none' }}>Directory</Link>
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
