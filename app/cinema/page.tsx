'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Fake "currently airing" listings for the TV Guide scroll
const LISTINGS = [
  { time: '12:00 AM', channel: 'AAC-1', title: 'Crip Camp (2020)', desc: 'Documentary' },
  { time: '1:30 AM',  channel: 'AAC-2', title: 'Sound and Fury', desc: 'Documentary' },
  { time: '3:00 AM',  channel: 'AAC-1', title: 'Far from Heaven', desc: 'Drama' },
  { time: '4:45 AM',  channel: 'AAC-3', title: 'The Sessions (2012)', desc: 'Drama' },
  { time: '6:30 AM',  channel: 'AAC-2', title: 'Sins Invalid: An Unashamed Claim', desc: 'Documentary' },
  { time: '8:00 AM',  channel: 'AAC-1', title: 'Children of a Lesser God', desc: 'Drama' },
  { time: '9:45 AM',  channel: 'AAC-4', title: 'Disability After Dark Podcast', desc: 'Talk' },
  { time: '11:00 AM', channel: 'AAC-3', title: 'Speechless (Season 1)', desc: 'Comedy' },
  { time: '12:00 PM', channel: 'AAC-1', title: 'Reid My Mind Radio Marathon', desc: 'Radio/Podcast' },
  { time: '2:00 PM',  channel: 'AAC-2', title: 'My Left Foot', desc: 'Drama' },
  { time: '3:45 PM',  channel: 'AAC-1', title: 'Tell Me Everything: Blind & Visually Impaired', desc: 'Documentary' },
  { time: '5:30 PM',  channel: 'AAC-3', title: 'The L Word — Accessibility Edition', desc: 'TBD' },
  { time: '7:00 PM',  channel: 'AAC-1', title: 'Deaf West: Spring Awakening Live', desc: 'Performance' },
  { time: '9:00 PM',  channel: 'AAC-2', title: 'Kinetic Light: Wired', desc: 'Dance Film' },
  { time: '10:30 PM', channel: 'AAC-1', title: 'TBA — Member Curated Pick', desc: 'Film' },
  { time: '11:59 PM', channel: 'AAC-4', title: 'Sign Off', desc: 'Coming Soon' },
];

export default function CinemaPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [clock, setClock] = useState('');
  const [scrollPos, setScrollPos] = useState(0);

  // Clock
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Slowly scroll the listings
  useEffect(() => {
    const id = setInterval(() => {
      setScrollPos((p) => p + 1);
    }, 40);
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
          name: 'Cinema Notify Request',
          email: email.trim(),
          subject: 'Cinema Notify Me signup',
          message: `Someone wants to be notified when The Cinema launches: ${email.trim()}`,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  // Total height of one full listings set (px) — we duplicate them for infinite scroll
  const ROW_H = 38;
  const totalH = LISTINGS.length * ROW_H;
  const offset = scrollPos % totalH;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b1a2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: '"Arial Narrow", Arial, sans-serif',
        color: '#e8f4ff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <h1 className="sr-only">The Cinema — Artistic Accessibility Collective</h1>

      {/* Static noise overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />

      {/* Main TV Guide panel */}
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          border: '3px solid #1a4a8f',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(30,80,200,0.35), 0 4px 30px rgba(0,0,0,0.6)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── Channel header bar ─── */}
        <div
          aria-hidden="true"
          style={{
            background: 'linear-gradient(to right, #0b3a8f 0%, #1a5cbf 50%, #0b3a8f 100%)',
            borderBottom: '2px solid #2a7fff',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* TV icon */}
            <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
              <rect x="1" y="4" width="20" height="13" rx="1" fill="none" stroke="#7ab8ff" strokeWidth="1.5" />
              <line x1="4" y1="4" x2="7" y2="1" stroke="#7ab8ff" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="4" x2="15" y2="1" stroke="#7ab8ff" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="8" y="14.5" width="6" height="2" rx="1" fill="#7ab8ff" />
            </svg>
            <span style={{ color: '#7ab8ff', fontWeight: 'bold', fontSize: 14, letterSpacing: '0.08em' }}>
              THE CINEMA
            </span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Channel 42</span>
          </div>
          <div style={{ color: '#7ab8ff', fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            {clock}
          </div>
        </div>

        {/* ── Scrolling TV guide listings ─── */}
        <div
          aria-hidden="true"
          style={{
            height: 152,
            overflow: 'hidden',
            background: '#060f1e',
            borderBottom: '2px solid #1a4a8f',
            position: 'relative',
          }}
        >
          {/* Fade top/bottom */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to bottom, #060f1e, transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to top, #060f1e, transparent)', zIndex: 2, pointerEvents: 'none' }} />

          {/* Scrolling rows — duplicated for infinite loop */}
          <div style={{ transform: `translateY(-${offset}px)`, willChange: 'transform' }}>
            {[...LISTINGS, ...LISTINGS].map((item, i) => (
              <div
                key={i}
                style={{
                  height: ROW_H,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(30,80,180,0.35)',
                  padding: '0 12px',
                  gap: 12,
                  background: i % 2 === 0 ? 'rgba(15,40,100,0.4)' : 'transparent',
                }}
              >
                <span style={{ color: '#7ab8ff', fontFamily: 'monospace', fontSize: 12, minWidth: 60, flexShrink: 0 }}>
                  {item.time}
                </span>
                <span style={{ color: '#4a8adf', fontSize: 11, minWidth: 52, flexShrink: 0, fontWeight: 'bold', letterSpacing: '0.04em' }}>
                  {item.channel}
                </span>
                <span style={{ color: '#d0e8ff', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </span>
                <span style={{ color: 'rgba(160,200,255,0.5)', fontSize: 11, flexShrink: 0 }}>
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main content ─── */}
        <div style={{ background: '#0b1a2e', padding: '28px 28px 32px' }}>

          {/* Coming soon badge */}
          <div
            aria-hidden="true"
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #b83232, #e04444)',
              color: 'white',
              fontSize: 10,
              fontWeight: 'bold',
              letterSpacing: '0.15em',
              padding: '3px 10px',
              marginBottom: 16,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(180,50,50,0.4)',
            }}
          >
            ● ON THE AIR SOON
          </div>

          <div role="region" aria-label="Cinema coming soon information">
            <p style={{ fontSize: 24, fontWeight: 'bold', color: '#d0e8ff', margin: '0 0 14px', lineHeight: 1.2, letterSpacing: '0.02em' }}>
              THE CINEMA
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#a0c8f0', margin: '0 0 14px' }}>
              A film and video library curated by and for the disability arts community.
              Documentaries, short films, dance films, performance recordings — with a focus on
              work that is actually accessible (captioned, audio described, or both).
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#a0c8f0', margin: '0 0 24px' }}>
              Think: Crip Camp, Deaf West on Broadway, Kinetic Light, Sins Invalid, and everything
              your professor never put on the syllabus. Member picks welcome.
            </p>
          </div>

          {/* Notify form */}
          <div
            style={{
              background: 'rgba(10,30,80,0.6)',
              border: '1px solid #1a4a8f',
              borderRadius: 4,
              padding: '20px',
              marginBottom: 24,
            }}
            aria-label="Get notified when The Cinema launches"
          >
            <p style={{ fontSize: 13, color: '#7ab8ff', margin: '0 0 12px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              📺 Notify me when The Cinema opens
            </p>

            {status === 'success' ? (
              <div
                role="status"
                aria-live="polite"
                style={{
                  background: 'rgba(30,100,50,0.3)',
                  border: '1px solid #2a8f4a',
                  padding: '12px 16px',
                  color: '#7ae8a0',
                  fontSize: 14,
                  borderRadius: 3,
                }}
              >
                You&apos;re on the list! We&apos;ll let you know when The Cinema is ready to stream.
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                <label htmlFor="cinema-email" className="sr-only">
                  Your email address
                </label>
                <input
                  id="cinema-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={status === 'loading'}
                  style={{
                    flex: 1,
                    minWidth: 200,
                    background: '#060f1e',
                    border: '1px solid #2a5a9f',
                    borderRight: 'none',
                    color: '#d0e8ff',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 14,
                    padding: '10px 14px',
                    outline: 'none',
                    borderRadius: '3px 0 0 3px',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#7ab8ff')}
                  onBlur={(e) => (e.target.style.borderColor = '#2a5a9f')}
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || !email.trim()}
                  style={{
                    background:
                      status === 'loading' || !email.trim()
                        ? 'rgba(30,80,180,0.4)'
                        : 'linear-gradient(to bottom, #2a6ad4, #1a4abf)',
                    color: status === 'loading' || !email.trim() ? 'rgba(160,200,255,0.5)' : '#fff',
                    border: '1px solid #2a5a9f',
                    fontWeight: 'bold',
                    fontSize: 13,
                    padding: '10px 18px',
                    cursor: status === 'loading' || !email.trim() ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                    borderRadius: '0 3px 3px 0',
                    letterSpacing: '0.03em',
                  }}
                >
                  {status === 'loading' ? 'Sending...' : 'Subscribe'}
                </button>
                {status === 'error' && (
                  <p
                    role="alert"
                    style={{ color: '#ff8888', fontSize: 12, margin: '8px 0 0', width: '100%' }}
                  >
                    Something went wrong — please try again or email us directly.
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 14 }}>
            <Link href="/resources" style={{ color: '#7ab8ff', textDecoration: 'none' }} className="cinema-link">
              Browse Resources in the meantime →
            </Link>
            <Link href="/" style={{ color: 'rgba(160,200,255,0.6)', textDecoration: 'none' }} className="cinema-link">
              ← Back Home
            </Link>
          </div>
        </div>

        {/* ── Bottom ticker bar ─── */}
        <div
          aria-hidden="true"
          style={{
            background: '#071020',
            borderTop: '2px solid #1a4a8f',
            padding: '5px 14px',
            fontSize: 11,
            color: '#4a8adf',
            letterSpacing: '0.08em',
            display: 'flex',
            gap: 20,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          <span>◆ COMING SOON ON AAC CINEMA</span>
          <span>◆ CAPTIONS ON ALL CONTENT</span>
          <span>◆ AUDIO DESCRIPTION WHERE AVAILABLE</span>
          <span>◆ MEMBER CURATED</span>
        </div>
      </div>

      <style>{`
        .cinema-link:hover,
        .cinema-link:focus-visible {
          text-decoration: underline;
          outline: 2px solid #f5d84a;
          outline-offset: 3px;
          border-radius: 2px;
        }
        #cinema-email::placeholder {
          color: rgba(100,160,220,0.4);
        }
        #lib-email::placeholder {
          color: rgba(57,196,68,0.4);
        }
      `}</style>
    </main>
  );
}
