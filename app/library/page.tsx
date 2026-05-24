'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LibraryPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [clock, setClock] = useState('');
  const [dots, setDots] = useState('');

  // Blinking cursor / loading dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Clock
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Library Notify Request',
          email: email.trim(),
          subject: 'Library Notify Me signup',
          message: `Someone wants to be notified when The Library launches: ${email.trim()}`,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

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
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Screen glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(30,80,30,0.18) 0%, transparent 80%)',
        }}
      />

      {/* Terminal window */}
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          border: '2px solid #39c444',
          boxShadow: '0 0 30px rgba(57,196,68,0.25), inset 0 0 20px rgba(57,196,68,0.05)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: '#39c444',
            color: '#0a0f0a',
            padding: '3px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 'bold',
          }}
          aria-hidden="true"
        >
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

          {/* Main content */}
          <div
            role="region"
            aria-label="Library coming soon information"
            style={{ borderLeft: '3px solid #39c444', paddingLeft: 20, marginBottom: 32 }}
          >
            <p style={{ fontSize: 22, fontWeight: 'bold', color: '#39c444', margin: '0 0 16px', lineHeight: 1.3, letterSpacing: '0.04em' }}>
              &gt; THE LIBRARY
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5de064', margin: '0 0 14px' }}>
              A curated collection of books, articles, films, and syllabi — all centering
              disabled voices and disability justice in the arts.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5de064', margin: '0 0 14px' }}>
              Readings from Alice Wong, Harriet McBryde Johnson, Mia Mingus. Syllabi you can
              steal. First-person essays. Academic texts that won&apos;t bore you to death.
              A place to actually find the books people keep recommending.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.9, color: '#5de064', margin: 0 }}>
              STATUS: <span style={{ color: '#f5d84a', fontWeight: 'bold' }}>UNDER CONSTRUCTION</span>
            </p>
          </div>

          {/* Notify me form */}
          <div aria-label="Get notified when The Library launches" style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: '#39c444', margin: '0 0 12px', letterSpacing: '0.06em' }}>
              &gt; NOTIFY ME WHEN IT OPENS_
            </p>

            {status === 'success' ? (
              <div
                role="status"
                aria-live="polite"
                style={{
                  background: 'rgba(57,196,68,0.12)',
                  border: '1px solid #39c444',
                  padding: '12px 16px',
                  color: '#39c444',
                  fontSize: 14,
                }}
              >
                <span aria-hidden="true">&gt; </span>
                ACCESS REQUEST LOGGED. We&apos;ll ping you when The Library is live.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                  <label htmlFor="lib-email" className="sr-only">
                    Your email address
                  </label>
                  <input
                    id="lib-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={status === 'loading'}
                    style={{
                      flex: 1,
                      minWidth: 200,
                      background: '#0d130d',
                      border: '1px solid #39c444',
                      borderRight: 'none',
                      color: '#39c444',
                      fontFamily: '"Courier New", Courier, monospace',
                      fontSize: 14,
                      padding: '10px 14px',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.boxShadow = '0 0 8px rgba(57,196,68,0.5)')}
                    onBlur={(e) => (e.target.style.boxShadow = 'none')}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || !email.trim()}
                    style={{
                      background: status === 'loading' ? 'rgba(57,196,68,0.3)' : '#39c444',
                      color: '#0a0f0a',
                      border: '1px solid #39c444',
                      fontFamily: '"Courier New", Courier, monospace',
                      fontWeight: 'bold',
                      fontSize: 13,
                      padding: '10px 18px',
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {status === 'loading' ? 'SENDING...' : '[ SUBMIT ]'}
                  </button>
                </div>
                {status === 'error' && (
                  <p
                    role="alert"
                    style={{ color: '#ff6b6b', fontSize: 12, margin: '8px 0 0', fontFamily: '"Courier New", Courier, monospace' }}
                  >
                    &gt; ERROR: Something went wrong. Try emailing us directly.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Links */}
          <div style={{ borderTop: '1px solid rgba(57,196,68,0.3)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13 }}>
            <Link
              href="/resources"
              style={{ color: '#39c444', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              className="dos-link"
            >
              <span aria-hidden="true">&gt;</span> Browse Resources Now
            </Link>
            <Link
              href="/"
              style={{ color: '#39c444', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              className="dos-link"
            >
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
        input::placeholder {
          color: rgba(57,196,68,0.45);
        }
      `}</style>
    </main>
  );
}
