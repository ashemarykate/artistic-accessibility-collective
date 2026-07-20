'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import UpcomingEducationalEvents from '@/components/UpcomingEducationalEvents';

// ── Subject toolbar icons ─────────────────────────────────────────────────────
const SUBJECTS = [
  { emoji: '📖', label: 'Read'     },
  { emoji: '🔍', label: 'Search'   },
  { emoji: '🗂️', label: 'Index'    },
  { emoji: '🌐', label: 'Atlas'    },
  { emoji: '📼', label: 'Video'    },
  { emoji: '🔊', label: 'Audio'    },
  { emoji: '⭐', label: 'Favorites'},
  { emoji: '📋', label: 'Notes'    },
  { emoji: '💾', label: 'Save'     },
];

// ── Bottom contents strip — all greyed ───────────────────────────────────────
const CONTENTS = ['Arts', 'Access', 'Law', 'History', 'Language', 'Community', 'Tools', 'Resources'];

// ── Star field (same as Make Art) ────────────────────────────────────────────
const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 97.234) % 100,
  r: i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1,
  o: 0.5 + (i % 5) * 0.1,
}));

export default function LearningHubPage() {
  const [activeSubject, setActiveSubject] = useState(0);
  const [booting, setBooting]             = useState(true);
  const [bootText, setBootText]           = useState('Loading AAC Encyclopedia');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Learning Hub · Artistic Accessibility Collective';
    let dots = 0;
    const dotInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      setBootText('Loading AAC Encyclopedia' + '.'.repeat(dots));
    }, 350);
    const bootTimer = setTimeout(() => {
      clearInterval(dotInterval);
      setBooting(false);
      setTimeout(() => headingRef.current?.focus(), 250);
    }, 1800);
    return () => {
      clearInterval(dotInterval);
      clearTimeout(bootTimer);
      document.title = 'Artistic Accessibility Collective';
    };
  }, []);

  return (
    <div
      className="hub-outer"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 'var(--startbar-h, 0px)',
        background: '#0a0a1a',
        overflow: 'hidden',
        fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
      }}
      role="main"
    >
      <style>{`
        @media (max-width: 580px) {
          .hub-outer {
            position: static !important;
            min-height: 100dvh !important;
            overflow: auto !important;
            padding-bottom: var(--startbar-h, 0px) !important;
          }
        }
        @keyframes hub-boot-fade {
          0%   { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes hub-window-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hub-window { animation: none !important; }
          .hub-boot   { animation: none !important; display: none !important; }
        }
      `}</style>

      <h1 className="sr-only">Learning Hub · Artistic Accessibility Collective</h1>

      {/* ── Boot splash ───────────────────────────────────────────────────────── */}
      {booting && (
        <div
          className="hub-boot"
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16,
            animation: 'hub-boot-fade 1.8s ease forwards',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 52 }}>📚</span>
          <div style={{
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            fontSize: 13, color: '#ccc', letterSpacing: '0.05em',
            minWidth: 240, textAlign: 'center',
          }}>
            {bootText}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {['#006633','#009955','#00bb66','#44cc88','#88ddaa'].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, background: c, border: '1px solid rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Starfield ─────────────────────────────────────────────────────────── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {STARS.map((s) => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />
        ))}
      </svg>

      {/* ── App Window ────────────────────────────────────────────────────────── */}
      <div
        className="hub-window"
        style={{
          position: 'absolute',
          inset: '50% auto auto 50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(720px, calc(100vw - 16px))',
          maxHeight: 'calc(100vh - 56px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 0 0 3px #888, 0 12px 50px rgba(0,0,0,0.8)',
          animation: booting ? 'none' : 'hub-window-in 0.2s ease forwards',
          opacity: booting ? 0 : undefined,
        }}
      >
        {/* ── Title bar ─────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(to right, #006633, #009955, #006633)',
          padding: '3px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>📚</span>
            AAC Encyclopedia · Learning Hub
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['_','□','✕'].map((c) => (
              <div key={c} aria-hidden="true" style={{
                width: 16, height: 14, background: '#197744', border: '1px solid #66cc88',
                borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 9, fontWeight: 'bold', cursor: 'default',
              }}>{c}</div>
            ))}
          </div>
        </div>

        {/* ── Menu bar ──────────────────────────────────────────────────────── */}
        <div style={{ background: '#c8c8c8', borderBottom: '2px solid #666', padding: '1px 4px', display: 'flex', gap: 0, fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11 }}>
          {['File','Navigate','Search','Bookmark','Help'].map((m) => (
            <span key={m} aria-hidden="true" style={{ padding: '2px 8px', cursor: 'default', color: '#000' }}>{m}</span>
          ))}
        </div>

        {/* ── Body: left toolbar + canvas ───────────────────────────────────── */}
        <div className="hub-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* ── Left toolbar ──────────────────────────────────────────────── */}
          <div
            role="toolbar"
            aria-label="Encyclopedia subjects"
            className="hub-toolbar"
            style={{
              background: '#d8d8d0',
              borderRight: '3px solid #888',
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '4px 3px',
              flexShrink: 0,
            }}
          >
            {/* Home button */}
            <Link
              href="/"
              aria-label="Back to Home"
              style={{
                width: 34, height: 34,
                background: '#263590',
                border: '2px outset #eee',
                borderRadius: 3,
                fontSize: 18, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              🏠
            </Link>
            <a
              href="/resources"
              aria-label="Accessibility Resources"
              style={{
                width: 34, height: 34,
                background: '#2272c8',
                border: '2px outset #eee',
                borderRadius: 3,
                fontSize: 18, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              🔵
            </a>
            <div aria-hidden="true" style={{ height: 2, background: '#999', margin: '2px 2px' }} />

            {/* The Channel button */}
            <a
              href="/learning-hub/the-channel"
              aria-label="The Channel"
              style={{
                width: 34, height: 34,
                background: '#7a4500',
                border: '2px outset #eee',
                borderRadius: 3,
                fontSize: 18, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              📺
            </a>
            <div aria-hidden="true" style={{ height: 2, background: '#999', margin: '2px 2px' }} />

            {SUBJECTS.map((sub, i) => {
              const GREENS = ['#006633','#008844','#009955','#007733','#006633','#008844','#009955','#007733','#006633'];
              return (
                <button
                  key={sub.label}
                  onClick={() => setActiveSubject(i)}
                  aria-label={`${sub.label} (coming soon)`}
                  className="hub-subject-btn"
                  style={{
                    width: 34, height: 34,
                    background: activeSubject === i ? GREENS[i] : '#bbb',
                    border: activeSubject === i ? '2px inset #555' : '2px outset #eee',
                    borderRadius: 3,
                    fontSize: 18, lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.1s',
                    padding: 0,
                  }}
                >
                  {sub.emoji}
                </button>
              );
            })}
          </div>

          {/* ── Canvas ────────────────────────────────────────────────────── */}
          <div className="hub-canvas" style={{ flex: 1, background: '#fafaf6', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

            {/* Main canvas content */}
            <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ textAlign: 'center' }}>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  style={{
                    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
                    fontSize: 'clamp(20px, 4vw, 28px)',
                    margin: '0 0 6px',
                    color: '#006633',
                    lineHeight: 1.2,
                  }}
                >
                  Welcome to the Learning Hub!
                </h2>
                <p style={{
                  fontFamily: '"MS Sans Serif", Arial, sans-serif',
                  fontSize: 12, color: '#333', margin: '0 0 10px', lineHeight: 1.5,
                }}>
                  Right now the only thing we have up and running is The Channel. Click the TV button on the left to check it out.
                </p>
                <p style={{
                  fontFamily: '"MS Sans Serif", Arial, sans-serif',
                  fontSize: 12, color: '#555', margin: 0, lineHeight: 1.5,
                }}>
                  More fun things are on the way, keep an eye out!
                </p>
              </div>

              {/* Description box */}
              <div style={{
                border: '3px solid #aaa',
                borderStyle: 'inset',
                background: '#fff',
                padding: '12px 14px',
                fontSize: 12,
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                color: '#222',
                lineHeight: 1.6,
              }}>
                <p style={{ margin: '0 0 8px' }}>
                  We&apos;re building an interactive learning series for everyone working in,
                  around, and alongside the arts. Courses, modules, and community learning
                  at every level, designed with the disability arts community.
                </p>
                <p style={{ margin: 0 }}>
                  This is a long-term project. We&apos;re taking our time to do it right.
                </p>
              </div>

              {/* Project: The Channel */}
              <div style={{ border: '2px solid #7a4500', background: '#1a1000', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span aria-hidden="true" style={{ fontSize: 20 }}>📺</span>
                  <strong style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 13, color: '#cc7700' }}>
                    The Channel
                  </strong>
                  <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 10, background: '#cc4400', color: '#fff', padding: '1px 6px', letterSpacing: '0.06em' }}>
                    ON AIR
                  </span>
                </div>
                <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#bbb', lineHeight: 1.6, margin: '0 0 10px' }}>
                  A curated playlist of arts accessibility videos, on demand. Shuffles every visit so there is always something new to learn.
                </p>
                <a
                  href="/learning-hub/the-channel"
                  style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 12, fontWeight: 'bold', color: '#fff', background: '#7a4500', padding: '4px 14px', textDecoration: 'none', border: '2px outset #cc8844', display: 'inline-block' }}
                >
                  📺 Watch Now
                </a>
              </div>

              {/* Educational events pulled from the community calendar */}
              <UpcomingEducationalEvents />

            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 580px) {
            .hub-window {
              position: static !important;
              transform: none !important;
              inset: unset !important;
              width: 100% !important;
              max-height: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
            }
            .hub-body {
              flex-direction: column !important;
              overflow: visible !important;
            }
            .hub-toolbar {
              flex-direction: row !important;
              flex-wrap: wrap !important;
              border-right: none !important;
              border-bottom: 3px solid #888 !important;
              padding: 3px 4px !important;
              gap: 3px !important;
            }
            .hub-subject-btn {
              width: 44px !important;
              height: 44px !important;
            }
            .hub-canvas {
              overflow: visible !important;
            }
          }
        `}</style>

        {/* ── Contents strip ────────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{ display: 'flex', background: '#c8c8c8', borderTop: '2px solid #999', padding: '3px 4px', gap: 2, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <span style={{ fontSize: 10, color: '#555', fontFamily: '"MS Sans Serif", Arial, sans-serif', marginRight: 4, flexShrink: 0 }}>
            Contents:
          </span>
          {CONTENTS.map((c) => (
            <div
              key={c}
              style={{
                padding: '1px 8px',
                fontSize: 10,
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                background: '#d8d8d0',
                border: '1px outset #aaa',
                color: '#888',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* ── Taskbar ───────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 36,
          background: 'linear-gradient(to bottom, #2a2a3a, #1a1a28)',
          borderTop: '1px solid #444',
          display: 'flex', alignItems: 'center',
          padding: '0 8px', gap: 6,
          fontFamily: '"MS Sans Serif", Arial, sans-serif',
          fontSize: 11, userSelect: 'none', zIndex: 10,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '2px 10px 2px 8px',
          color: 'white', fontWeight: 'bold',
          minWidth: 160,
        }}>
          <span style={{ fontSize: 14 }}>📚</span>
          AAC Encyclopedia
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

    </div>
  );
}
