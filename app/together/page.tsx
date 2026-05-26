'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// ── Decorative sparkle positions ─────────────────────────────────────────────
const SPARKLES = [
  { top: '8%',  left: '4%',  size: 18, rot: 0   },
  { top: '12%', left: '18%', size: 14, rot: 20  },
  { top: '6%',  left: '78%', size: 16, rot: -15 },
  { top: '10%', left: '92%', size: 20, rot: 10  },
  { top: '82%', left: '6%',  size: 16, rot: 5   },
  { top: '88%', left: '20%', size: 12, rot: -10 },
  { top: '80%', left: '80%', size: 18, rot: 15  },
  { top: '85%', left: '94%', size: 14, rot: -5  },
];

// ── Calendar month grid (decorative, current-ish month layout) ───────────────
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
// A generic 5-week grid that looks like a real month starting on Wednesday
const GRID = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, null, null],
];

// A handful of fake "events" to dot the calendar
const EVENT_DAYS = new Set([3, 8, 10, 15, 17, 22, 24, 29]);

function Sparkle({ top, left, size, rot }: { top: string; left: string; size: number; rot: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', top, left,
        fontSize: size,
        transform: `rotate(${rot}deg)`,
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      ✦
    </div>
  );
}

export default function TogetherPage() {
  useEffect(() => {
    document.title = 'Together — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fffbdb',
        backgroundImage: 'radial-gradient(circle, #f5e86a 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        fontFamily: 'Verdana, Arial, sans-serif',
        padding: '0 12px 40px',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <h1 className="sr-only">Together — Artistic Accessibility Collective</h1>

      {/* ── Decorative sparkles ─────────────────────────────────────────────── */}
      {SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

      {/* ── Top nav bar (classic Neopets site header) ───────────────────────── */}
      <div style={{
        background: 'linear-gradient(to right, #ffcc00, #ff9900, #ffcc00)',
        borderBottom: '3px solid #cc6600',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginLeft: -12,
        marginRight: -12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }} aria-hidden="true">🗓️</span>
          <span style={{
            fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
            fontWeight: 'bold', fontSize: 18, color: '#5a1a00',
            textShadow: '1px 1px 0 #ffee88',
          }}>
            Together
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Home', href: '/', bg: '#3399ff', shadow: '#0055cc' },
            { label: 'Contact', href: '/contact', bg: '#ff6699', shadow: '#cc0044' },
          ].map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: btn.bg,
                border: `2px outset ${btn.shadow}`,
                borderRadius: 4,
                color: '#fff',
                fontSize: 11,
                fontWeight: 'bold',
                textDecoration: 'none',
                fontFamily: 'Verdana, Arial, sans-serif',
              }}
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main content: 2-column (sidebar + center) ───────────────────────── */}
      <div style={{
        maxWidth: 760,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 12,
        alignItems: 'start',
      }}
      className="together-grid"
      >

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <aside>
          {/* Coming Soon box */}
          <div style={{
            background: '#fff',
            border: '2px solid #ffcc00',
            borderTop: '4px solid #ff9900',
            padding: '8px 10px',
            marginBottom: 10,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: 11, fontWeight: 'bold', color: '#cc6600',
              marginBottom: 4,
            }}>
              ✨ COMING SOON ✨
            </div>
            <p style={{ fontSize: 10, color: '#555', margin: 0, lineHeight: 1.5 }}>
              Community events, social hangs, and accessible arts happenings — all in one place.
            </p>
          </div>

          {/* Quick links box */}
          <div style={{
            background: '#e8f4ff',
            border: '2px solid #3399ff',
            borderTop: '4px solid #0066cc',
            padding: '8px 10px',
            marginBottom: 10,
          }}>
            <div style={{
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: 11, fontWeight: 'bold', color: '#0044aa',
              marginBottom: 6,
            }}>
              Quick Links
            </div>
            {[
              { label: '← Back to Home',  href: '/' },
              { label: 'Contact Us',       href: '/contact' },
              { label: 'Join Us',          href: '/submit' },
            ].map((lnk) => (
              <div key={lnk.href} style={{ marginBottom: 4 }}>
                <Link href={lnk.href} style={{ fontSize: 11, color: '#0055cc', textDecoration: 'underline' }}>
                  {lnk.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Mood counter widget */}
          <div style={{
            background: '#fff0f8',
            border: '2px solid #ff66aa',
            borderTop: '4px solid #cc0066',
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: 10, fontWeight: 'bold', color: '#990044',
              marginBottom: 6,
            }}>
              How excited are you?
            </div>
            {['😍 Very!!!','🙂 Kinda','🤷 Idk yet'].map((opt) => (
              <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <input type="radio" name="mood" aria-label={opt} style={{ cursor: 'pointer' }} />
                <span style={{ fontSize: 10, color: '#333' }}>{opt}</span>
              </div>
            ))}
            <button style={{
              marginTop: 4,
              padding: '2px 10px',
              background: '#ff66aa',
              border: '2px outset #cc0066',
              color: '#fff', fontSize: 10, fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Verdana, Arial, sans-serif',
            }}>
              Vote!
            </button>
          </div>
        </aside>

        {/* ── Center: Calendar ─────────────────────────────────────────────── */}
        <div>
          {/* Calendar header */}
          <div style={{
            background: 'linear-gradient(to bottom, #6633cc, #4400aa)',
            border: '3px solid #330099',
            borderBottom: 'none',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button
              aria-label="Previous month"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px outset rgba(255,255,255,0.4)',
                color: '#fff', fontWeight: 'bold', fontSize: 14,
                cursor: 'pointer', padding: '2px 10px', borderRadius: 3,
              }}
            >
              ◀
            </button>
            <h2 style={{
              fontFamily: '"Comic Sans MS", cursive',
              fontSize: 18, color: '#fff',
              margin: 0,
              textShadow: '1px 1px 0 rgba(0,0,0,0.4)',
            }}>
              📅 Community Calendar
            </h2>
            <button
              aria-label="Next month"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '2px outset rgba(255,255,255,0.4)',
                color: '#fff', fontWeight: 'bold', fontSize: 14,
                cursor: 'pointer', padding: '2px 10px', borderRadius: 3,
              }}
            >
              ▶
            </button>
          </div>

          {/* Calendar grid */}
          <div style={{
            background: '#fff',
            border: '3px solid #330099',
            overflow: 'hidden',
          }}>
            {/* Day headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#9966ff',
            }}>
              {DAYS.map((d) => (
                <div key={d} style={{
                  padding: '5px 0',
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: '#fff',
                  fontFamily: 'Verdana, Arial, sans-serif',
                  borderRight: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {GRID.map((week, wi) => (
              <div key={wi} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderTop: '1px solid #ddd',
              }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    style={{
                      padding: '6px 4px 4px',
                      minHeight: 44,
                      borderRight: '1px solid #eee',
                      background: day === 15 ? '#fffbe6' : 'transparent',
                      position: 'relative',
                    }}
                  >
                    {day && (
                      <>
                        <div style={{
                          fontSize: 11,
                          fontWeight: day === 15 ? 'bold' : 'normal',
                          color: day === 15 ? '#cc6600' : '#333',
                          fontFamily: 'Verdana, Arial, sans-serif',
                        }}>
                          {day}
                        </div>
                        {EVENT_DAYS.has(day) && (
                          <div style={{
                            marginTop: 2,
                            fontSize: 8,
                            background: '#ff66aa',
                            color: '#fff',
                            padding: '1px 3px',
                            borderRadius: 2,
                            fontFamily: 'Verdana, Arial, sans-serif',
                            lineHeight: 1.4,
                            cursor: 'default',
                          }}>
                            ● event
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Below calendar: coming soon notice */}
          <div style={{
            background: '#fff',
            border: '3px solid #ffcc00',
            borderTop: 'none',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }} aria-hidden="true">🌟</span>
            <p style={{ margin: 0, fontSize: 11, color: '#555', lineHeight: 1.6, fontFamily: 'Verdana, Arial, sans-serif' }}>
              <strong style={{ color: '#cc6600' }}>Events coming soon.</strong>{' '}
              This calendar will show accessible arts events, community meetups, and social hangs submitted by members.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 760, margin: '20px auto 0',
        textAlign: 'center',
        fontFamily: '"Comic Sans MS", cursive',
        fontSize: 10,
        color: '#aa6600',
      }}>
        ★ Artistic Accessibility Collective ★ Together ★ Coming Soon ★<br />
        <span style={{ fontSize: 9, color: '#bbb' }}>Best viewed at 800×600 · Please sign our guestbook!</span>
      </div>

      <style>{`
        @media (max-width: 580px) {
          .together-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
