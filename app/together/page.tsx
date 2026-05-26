'use client';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

// ── Planned features for the outline ─────────────────────────────────────────
const PLANNED = [
  {
    icon: '📅',
    heading: 'Community Calendar',
    desc: 'Pull in calendars from partner orgs, venues, and accessibility providers — all in one place.',
    color: '#b83878',
  },
  {
    icon: '🎉',
    heading: 'Submit Your Event',
    desc: 'Accessible arts events, social hangs, workshops, and open captioned nights — community-submitted.',
    color: '#1a5fbf',
  },
  {
    icon: '🤝',
    heading: 'Social Board',
    desc: 'Looking for an ASL interpreter for your show? Need a CART provider last minute? Post it here.',
    color: '#1e7a4a',
  },
  {
    icon: '📍',
    heading: 'Find Events Near You',
    desc: 'Filter by city, accessibility feature, event type, or date. No more hunting across twelve websites.',
    color: '#9a5a00',
  },
];

export default function Together() {
  return (
    <BrowserChrome
      variant="aol"
      title="Together — Artistic Accessibility Collective"
      url="keyword: AAC Together"
    >
      <main
        style={{
          minHeight: '100%',
          background: 'linear-gradient(160deg, #0d1e4a 0%, #1a3070 60%, #0d1e4a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 1rem 3rem',
        }}
      >
        {/* ── Header band ───────────────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(90deg, #b83878 0%, #7a1a5a 50%, #b83878 100%)',
          padding: '10px 20px',
          textAlign: 'center',
          borderBottom: '3px solid #f5a0cc',
          marginBottom: '2rem',
        }}>
          <p style={{
            margin: 0,
            fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
            fontSize: '0.75rem',
            color: '#ffd6ee',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            ★ Welcome to the AAC Community Hub ★ Events · Calendar · Connection ★
          </p>
        </div>

        {/* ── Main card ─────────────────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          maxWidth: 680,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}>
          {/* Animated "under construction" tape */}
          <div
            aria-hidden="true"
            style={{
              background: 'repeating-linear-gradient(45deg, #f5d84a, #f5d84a 12px, #1a1a1a 12px, #1a1a1a 24px)',
              height: 18,
              borderRadius: 3,
              marginBottom: '1.75rem',
              opacity: 0.9,
            }}
          />

          <div style={{
            fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
            fontSize: '0.7rem',
            color: '#f5d84a',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}>
            Under Construction
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display, "TAY Big Bird", serif)',
            fontSize: 'clamp(2.2rem, 7vw, 3.5rem)',
            color: '#ffffff',
            margin: '0 0 0.5rem',
            lineHeight: 1.1,
            textShadow: '0 2px 16px rgba(184,56,120,0.6)',
          }}>
            Together
          </h1>

          <p style={{
            fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
            fontSize: '1rem',
            color: '#f5a0cc',
            margin: '0 0 2rem',
          }}>
            a community events space — coming soon!
          </p>

          <p style={{
            fontSize: '0.9375rem',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.7,
            maxWidth: 480,
            margin: '0 auto 2.5rem',
          }}>
            Together is your one-stop shop for accessible arts events, community
            calendar listings, and connection requests. Find what&apos;s happening.
            Share what you&apos;re making. Ask for what you need.
          </p>

          {/* ── Planned features grid ────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
            textAlign: 'left',
          }}>
            {PLANNED.map((f) => (
              <div
                key={f.heading}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${f.color}55`,
                  borderTop: `3px solid ${f.color}`,
                  borderRadius: 4,
                  padding: '1rem',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }} aria-hidden="true">
                  {f.icon}
                </div>
                <h2 style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#fff',
                  margin: '0 0 0.4rem',
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {f.heading}
                </h2>
                <p style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(255,255,255,0.65)',
                  margin: 0,
                  lineHeight: 1.55,
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Tape footer */}
          <div
            aria-hidden="true"
            style={{
              background: 'repeating-linear-gradient(45deg, #f5d84a, #f5d84a 12px, #1a1a1a 12px, #1a1a1a 24px)',
              height: 18,
              borderRadius: 3,
              marginBottom: '2rem',
              opacity: 0.9,
            }}
          />

          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              color: '#fff',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            ← Back Home
          </Link>
        </div>

        {/* ── Footer guestbook invite ────────────────────────────────────────── */}
        <p style={{
          marginTop: '2rem',
          fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.35)',
          textAlign: 'center',
        }}>
          You are visitor #000042 · Sign our guestbook! · Best viewed in 800×600
        </p>
      </main>
    </BrowserChrome>
  );
}
