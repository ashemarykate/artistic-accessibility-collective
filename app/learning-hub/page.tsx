'use client';

import Link from 'next/link';

// ── Planned training levels ───────────────────────────────────────────────────
const LEVELS = [
  {
    id: 'L1',
    label: 'Level 1',
    title: 'Access Basics',
    desc: 'What is accessibility in the arts? Core concepts, language, and frameworks for everyone.',
    color: '#4dbb6a',
    locked: false,
  },
  {
    id: 'L2',
    label: 'Level 2',
    title: 'Tools of the Trade',
    desc: 'Captions, audio description, ASL, CART — how they work and when to use them.',
    color: '#f5d84a',
    locked: true,
  },
  {
    id: 'L3',
    label: 'Level 3',
    title: 'Planning Access',
    desc: 'Budgeting, hiring providers, writing access riders, and front-of-house training.',
    color: '#f5a020',
    locked: true,
  },
  {
    id: 'L4',
    label: 'Level 4',
    title: 'Leading with Access',
    desc: 'Disability Justice frameworks, community co-creation, and systemic change in arts orgs.',
    color: '#c060f0',
    locked: true,
  },
];

// ── Pixel-art star (SVG inline, pure CSS) ─────────────────────────────────────
function PixelStar({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="5" y="0" width="2" height="2" fill={color} />
      <rect x="5" y="10" width="2" height="2" fill={color} />
      <rect x="0" y="5" width="2" height="2" fill={color} />
      <rect x="10" y="5" width="2" height="2" fill={color} />
      <rect x="2" y="2" width="2" height="2" fill={color} />
      <rect x="8" y="2" width="2" height="2" fill={color} />
      <rect x="2" y="8" width="2" height="2" fill={color} />
      <rect x="8" y="8" width="2" height="2" fill={color} />
      <rect x="4" y="4" width="4" height="4" fill={color} />
    </svg>
  );
}

export default function LearningHub() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0c1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '"Courier New", Courier, monospace',
      padding: '0 1rem 4rem',
      overflowX: 'hidden',
    }}>

      {/* ── Scanline overlay ─────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── CD-ROM window chrome ─────────────────────────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: 720,
        marginTop: '2rem',
        border: '3px solid #4a4a8a',
        borderRadius: 4,
        boxShadow: '0 0 0 1px #2a2a5a, 0 0 40px rgba(96,96,255,0.25), inset 0 0 0 1px #7a7ac8',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
      }}>

        {/* Window title bar */}
        <div style={{
          background: 'linear-gradient(to right, #1a1a6a 0%, #3a3ab8 50%, #1a1a6a 100%)',
          padding: '5px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #4a4aaa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 16, height: 16,
              background: 'conic-gradient(from 0deg, #4dbb6a, #f5d84a, #f5a020, #c060f0, #4dbb6a)',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.3)',
            }} aria-hidden="true" />
            <span style={{ color: '#d8d8ff', fontSize: 12, fontWeight: 'bold', letterSpacing: '0.05em' }}>
              AAC Learning Hub v1.0
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
            {['_', '□', '×'].map((c) => (
              <div key={c} style={{
                width: 14, height: 12,
                background: '#2a2a7a',
                border: '1px solid #5a5aaa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: '#a0a0e0', cursor: 'default',
              }}>{c}</div>
            ))}
          </div>
        </div>

        {/* Menu bar */}
        <div style={{
          background: '#c8c8d8',
          borderBottom: '2px solid #7a7a9a',
          padding: '1px 4px',
          display: 'flex',
          gap: 0,
        }} aria-hidden="true">
          {['File', 'Options', 'Sound', 'Help'].map((item) => (
            <span key={item} style={{ padding: '2px 10px', fontSize: 11, cursor: 'default', color: '#000', fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
              {item}
            </span>
          ))}
        </div>

        {/* Main content area */}
        <div style={{
          background: '#12102a',
          padding: '2rem 1.5rem',
          minHeight: 460,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>

          {/* Logo / title */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: '0.75rem' }} aria-hidden="true">
              {['#4dbb6a', '#f5d84a', '#f5a020', '#c060f0', '#4090e8'].map((c, i) => (
                <PixelStar key={i} color={c} />
              ))}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display, "TAY Big Bird", serif)',
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              color: '#fff',
              margin: '0 0 0.25rem',
              textShadow: '0 0 20px rgba(96,96,255,0.8), 0 0 40px rgba(96,96,255,0.4)',
              lineHeight: 1.1,
            }}>
              Learning Hub
            </h1>
            <p style={{ color: '#8080c0', fontSize: '0.75rem', margin: 0, letterSpacing: '0.12em' }}>
              ARTISTIC ACCESSIBILITY COLLECTIVE — EDUCATIONAL SERIES
            </p>
          </div>

          {/* "Loading" / Coming Soon treatment */}
          <div style={{
            width: '100%',
            maxWidth: 540,
            background: '#0a0820',
            border: '2px inset #4a4a8a',
            borderRadius: 3,
            padding: '1.25rem',
            marginBottom: '1.75rem',
            textAlign: 'center',
          }}>
            <div style={{
              color: '#4dbb6a',
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
            }}>
              ▶ Loading training modules...
            </div>
            {/* Fake progress bar */}
            <div style={{
              width: '100%',
              height: 14,
              background: '#0a0820',
              border: '1px solid #4a4a8a',
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: '0.75rem',
            }} aria-hidden="true">
              <div style={{
                width: '38%',
                height: '100%',
                background: 'repeating-linear-gradient(90deg, #263590 0px, #4060cc 8px, #263590 8px, #4060cc 16px)',
              }} />
            </div>
            <div style={{ color: '#6060a0', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
              38% — COMING SOON
            </div>
          </div>

          {/* Level selection */}
          <div style={{
            width: '100%',
            maxWidth: 540,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.875rem',
            marginBottom: '1.75rem',
          }}>
            {LEVELS.map((lv) => (
              <div
                key={lv.id}
                style={{
                  background: lv.locked ? '#0a0820' : '#10103a',
                  border: `2px solid ${lv.locked ? '#2a2a5a' : lv.color}`,
                  borderRadius: 3,
                  padding: '1rem',
                  opacity: lv.locked ? 0.55 : 1,
                  position: 'relative',
                }}
                aria-label={`${lv.label}: ${lv.title}${lv.locked ? ' — locked, coming soon' : ' — coming soon'}`}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: '0.4rem',
                }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    color: lv.color,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}>
                    {lv.id}
                  </span>
                  {lv.locked && (
                    <span style={{ fontSize: '0.65rem', color: '#4a4a8a', letterSpacing: '0.08em' }} aria-hidden="true">
                      🔒 LOCKED
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: lv.locked ? '#4a4a8a' : '#fff',
                  marginBottom: '0.35rem',
                  fontFamily: '"Courier New", monospace',
                }}>
                  {lv.title}
                </div>
                <p style={{
                  fontSize: '0.75rem',
                  color: lv.locked ? '#3a3a6a' : '#8080b8',
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {lv.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Context blurb */}
          <p style={{
            maxWidth: 480,
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: '#6060a0',
            lineHeight: 1.7,
            marginBottom: '1.75rem',
            fontFamily: 'system-ui, sans-serif',
          }}>
            The Learning Hub is part of an ongoing masters action research project.
            Training modules at each level will be developed with and by the disability
            arts community. More soon.
          </p>

          {/* Back home */}
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: '#1a1a5a',
              border: '2px outset #4a4aaa',
              borderRadius: 2,
              color: '#c8c8ff',
              fontSize: '0.8125rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              letterSpacing: '0.05em',
              fontFamily: '"Courier New", monospace',
            }}
          >
            ◀ MAIN MENU
          </Link>
        </div>

        {/* Status bar */}
        <div style={{
          background: '#c8c8d8',
          borderTop: '2px solid #7a7a9a',
          padding: '2px 8px',
          display: 'flex',
          gap: 12,
          fontSize: 10,
          color: '#333',
          fontFamily: '"MS Sans Serif", Arial, sans-serif',
        }} aria-hidden="true">
          <span>Ready</span>
          <span>|</span>
          <span>Modules: 0 / 4 unlocked</span>
          <span>|</span>
          <span>AAC Educational Series</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          div[style*="maxWidth: 720"] {
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}
