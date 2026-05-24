'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function LibraryPage() {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<FormStatus>('idle');

  const [suggest, setSuggest] = useState({ title: '', author: '', why: '', name: '', email: '' });
  const [suggestStatus, setSuggestStatus] = useState<FormStatus>('idle');

  const [clock, setClock] = useState('');
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Library Notify Request',
          email: notifyEmail.trim(),
          subject: 'Library — Notify Me signup',
          message: `Someone wants to be notified when The Library launches: ${notifyEmail.trim()}`,
        }),
      });
      setNotifyStatus(res.ok ? 'success' : 'error');
    } catch {
      setNotifyStatus('error');
    }
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!suggest.title.trim() || !suggest.author.trim()) return;
    setSuggestStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggest.name.trim() || 'Anonymous',
          email: suggest.email.trim() || 'no-reply@artisticaccessibility.com',
          subject: `Library Book Suggestion: ${suggest.title.trim()}`,
          message: [
            `Book: ${suggest.title.trim()}`,
            `Author: ${suggest.author.trim()}`,
            suggest.why.trim() ? `Why they love it: ${suggest.why.trim()}` : '',
            suggest.name.trim() ? `From: ${suggest.name.trim()}` : '',
            suggest.email.trim() ? `Email: ${suggest.email.trim()}` : '',
          ].filter(Boolean).join('\n'),
        }),
      });
      setSuggestStatus(res.ok ? 'success' : 'error');
    } catch {
      setSuggestStatus('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    background: '#0d130d',
    border: '1px solid #39c444',
    color: '#39c444',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: 13,
    padding: '8px 12px',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0f0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: '"Courier New", Courier, monospace',
        color: '#39c444',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <h1 className="sr-only">The Library — Artistic Accessibility Collective</h1>

      {/* Scanline overlay */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)' }} />
      {/* Screen glow */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(30,80,30,0.18) 0%, transparent 80%)' }} />

      {/* Terminal window */}
      <div style={{ width: '100%', maxWidth: 700, border: '2px solid #39c444', boxShadow: '0 0 30px rgba(57,196,68,0.25), inset 0 0 20px rgba(57,196,68,0.05)', position: 'relative', zIndex: 1 }}>

        {/* Title bar */}
        <div style={{ background: '#39c444', color: '#0a0f0a', padding: '3px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 'bold' }} aria-hidden="true">
          <span>THE LIBRARY — AAC.EXE</span>
          <span style={{ fontFamily: 'monospace' }}>{clock}</span>
        </div>

        {/* Terminal body */}
        <div style={{ padding: '28px 32px 32px', background: '#0a0f0a' }}>

          {/* Boot sequence */}
          <div aria-hidden="true" style={{ marginBottom: 28, fontSize: 12, opacity: 0.65, lineHeight: 1.8 }}>
            <div>C:\AAC\LIBRARY&gt; LOADING SYSTEM<span>{dots}</span></div>
            <div>CHECKING STACKS<span>{dots.length > 0 ? dots : '...'}</span> <span style={{ color: '#39c444' }}>OK</span></div>
            <div>INDEXING RESOURCES<span>{dots.length > 1 ? dots : '..'}</span> <span style={{ color: '#f5d84a' }}>COMING SOON</span></div>
          </div>

          {/* About section */}
          <section aria-label="About The Library" style={{ borderLeft: '3px solid #39c444', paddingLeft: 20, marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#39c444', margin: '0 0 14px', lineHeight: 1.3, letterSpacing: '0.04em' }}>
              &gt; THE LIBRARY
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5de064', margin: '0 0 12px' }}>
              A curated collection of books, articles, films, and syllabi — all centering
              disabled voices and disability justice in the arts.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5de064', margin: '0 0 12px' }}>
              Readings from Alice Wong, Harriet McBryde Johnson, Mia Mingus. Syllabi you can
              steal. First-person essays. Academic texts that won&apos;t bore you to death.
              A place to actually find the books people keep recommending.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5de064', margin: 0 }}>
              STATUS: <span style={{ color: '#f5d84a', fontWeight: 'bold' }}>UNDER CONSTRUCTION</span>
            </p>
          </section>

          {/* Notify me */}
          <section aria-label="Get notified when The Library launches" style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, color: '#39c444', margin: '0 0 12px', letterSpacing: '0.06em', fontWeight: 'bold' }}>
              &gt; NOTIFY ME WHEN IT OPENS
            </h2>
            {notifyStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ background: 'rgba(57,196,68,0.12)', border: '1px solid #39c444', padding: '12px 16px', color: '#39c444', fontSize: 14 }}>
                <span aria-hidden="true">&gt; </span>
                ACCESS REQUEST LOGGED. We&apos;ll ping you when The Library is live.
              </div>
            ) : (
              <form onSubmit={handleNotify} noValidate>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  <label htmlFor="lib-notify-email" className="sr-only">Your email address</label>
                  <input
                    id="lib-notify-email"
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={notifyStatus === 'loading'}
                    className="lib-input"
                    style={{ flex: 1, minWidth: 200, background: '#0d130d', border: '1px solid #39c444', borderRight: 'none', color: '#39c444', fontFamily: '"Courier New", Courier, monospace', fontSize: 14, padding: '10px 14px' }}
                  />
                  <button
                    type="submit"
                    disabled={notifyStatus === 'loading' || !notifyEmail.trim()}
                    className="lib-btn"
                    style={{ background: notifyStatus === 'loading' ? 'rgba(57,196,68,0.3)' : '#39c444', color: '#0a0f0a', border: '1px solid #39c444', fontFamily: '"Courier New", Courier, monospace', fontWeight: 'bold', fontSize: 13, padding: '10px 18px', cursor: 'pointer', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
                  >
                    {notifyStatus === 'loading' ? 'SENDING...' : '[ SUBMIT ]'}
                  </button>
                </div>
                {notifyStatus === 'error' && (
                  <p role="alert" style={{ color: '#ff6b6b', fontSize: 12, margin: '8px 0 0' }}>
                    &gt; ERROR: Something went wrong. Try emailing us directly.
                  </p>
                )}
              </form>
            )}
          </section>

          {/* Suggest a book */}
          <section aria-label="Suggest a book for The Library" style={{ marginBottom: 32, borderTop: '1px solid rgba(57,196,68,0.3)', paddingTop: 28 }}>
            <h2 style={{ fontSize: 13, color: '#39c444', margin: '0 0 4px', letterSpacing: '0.06em', fontWeight: 'bold' }}>
              &gt; SUGGEST A BOOK
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(57,196,68,0.65)', margin: '0 0 16px' }}>
              What should everyone in disability arts be reading?
            </p>

            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ background: 'rgba(57,196,68,0.12)', border: '1px solid #39c444', padding: '12px 16px', color: '#39c444', fontSize: 14 }}>
                <span aria-hidden="true">&gt; </span>
                SUBMISSION RECEIVED. Thank you — we&apos;ll add it to the queue.
              </div>
            ) : (
              <form onSubmit={handleSuggest} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label htmlFor="suggest-title" style={{ display: 'block', fontSize: 11, color: 'rgba(57,196,68,0.7)', marginBottom: 4, letterSpacing: '0.05em' }}>
                      BOOK TITLE <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                    </label>
                    <input
                      id="suggest-title"
                      type="text"
                      value={suggest.title}
                      onChange={(e) => setSuggest((s) => ({ ...s, title: e.target.value }))}
                      placeholder="Title"
                      required
                      disabled={suggestStatus === 'loading'}
                      className="lib-input"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="suggest-author" style={{ display: 'block', fontSize: 11, color: 'rgba(57,196,68,0.7)', marginBottom: 4, letterSpacing: '0.05em' }}>
                      AUTHOR <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                    </label>
                    <input
                      id="suggest-author"
                      type="text"
                      value={suggest.author}
                      onChange={(e) => setSuggest((s) => ({ ...s, author: e.target.value }))}
                      placeholder="Author"
                      required
                      disabled={suggestStatus === 'loading'}
                      className="lib-input"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="suggest-why" style={{ display: 'block', fontSize: 11, color: 'rgba(57,196,68,0.7)', marginBottom: 4, letterSpacing: '0.05em' }}>
                    WHY THIS BOOK? <span style={{ opacity: 0.6 }}>(optional)</span>
                  </label>
                  <textarea
                    id="suggest-why"
                    value={suggest.why}
                    onChange={(e) => setSuggest((s) => ({ ...s, why: e.target.value }))}
                    placeholder="Why should the community read this?"
                    rows={3}
                    disabled={suggestStatus === 'loading'}
                    className="lib-input"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label htmlFor="suggest-name" style={{ display: 'block', fontSize: 11, color: 'rgba(57,196,68,0.7)', marginBottom: 4, letterSpacing: '0.05em' }}>
                      YOUR NAME <span style={{ opacity: 0.6 }}>(optional)</span>
                    </label>
                    <input
                      id="suggest-name"
                      type="text"
                      value={suggest.name}
                      onChange={(e) => setSuggest((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Name"
                      disabled={suggestStatus === 'loading'}
                      className="lib-input"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label htmlFor="suggest-email" style={{ display: 'block', fontSize: 11, color: 'rgba(57,196,68,0.7)', marginBottom: 4, letterSpacing: '0.05em' }}>
                      YOUR EMAIL <span style={{ opacity: 0.6 }}>(optional)</span>
                    </label>
                    <input
                      id="suggest-email"
                      type="email"
                      value={suggest.email}
                      onChange={(e) => setSuggest((s) => ({ ...s, email: e.target.value }))}
                      placeholder="your@email.com"
                      disabled={suggestStatus === 'loading'}
                      className="lib-input"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={suggestStatus === 'loading' || !suggest.title.trim() || !suggest.author.trim()}
                    className="lib-btn"
                    style={{ background: (suggestStatus === 'loading' || !suggest.title.trim() || !suggest.author.trim()) ? 'rgba(57,196,68,0.3)' : '#39c444', color: '#0a0f0a', border: '1px solid #39c444', fontFamily: '"Courier New", Courier, monospace', fontWeight: 'bold', fontSize: 13, padding: '10px 20px', cursor: 'pointer', letterSpacing: '0.05em' }}
                  >
                    {suggestStatus === 'loading' ? 'SENDING...' : '[ SUBMIT SUGGESTION ]'}
                  </button>
                </div>

                {suggestStatus === 'error' && (
                  <p role="alert" style={{ color: '#ff6b6b', fontSize: 12, margin: 0 }}>
                    &gt; ERROR: Something went wrong. Try emailing us directly.
                  </p>
                )}
              </form>
            )}
          </section>

          {/* Links */}
          <div style={{ borderTop: '1px solid rgba(57,196,68,0.3)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13 }}>
            <Link href="/resources" style={{ color: '#39c444', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }} className="dos-link">
              <span aria-hidden="true">&gt;</span> Browse Resources Now
            </Link>
            <Link href="/" style={{ color: '#39c444', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }} className="dos-link">
              <span aria-hidden="true">&lt;</span> Back Home
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .dos-link:hover,
        .dos-link:focus-visible {
          text-decoration: underline;
          outline: 2px solid #f5d84a;
          outline-offset: 3px;
        }
        .lib-input:focus-visible,
        .lib-input:focus {
          outline: 2px solid #f5d84a;
          outline-offset: 0;
          box-shadow: 0 0 8px rgba(57,196,68,0.5);
        }
        .lib-btn:focus-visible {
          outline: 2px solid #f5d84a;
          outline-offset: 2px;
        }
        .lib-input::placeholder {
          color: rgba(57,196,68,0.4);
        }
        @media (max-width: 520px) {
          .lib-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
