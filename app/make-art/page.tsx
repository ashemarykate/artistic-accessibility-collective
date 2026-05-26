'use client';

import { useState, useEffect, useRef } from 'react';

// ── Kid Pix tool definitions ──────────────────────────────────────────────────
const TOOLS = [
  { emoji: '✏️', label: 'Draw' },
  { emoji: '🪣', label: 'Fill' },
  { emoji: '✂️', label: 'Cut' },
  { emoji: '🔤', label: 'Text' },
  { emoji: '🔊', label: 'Sound' },
  { emoji: '🌟', label: 'Stamp' },
  { emoji: '🎨', label: 'Color' },
  { emoji: '🗑️', label: 'Erase' },
  { emoji: '↩️', label: 'Undo' },
];

const PALETTE: { hex: string; name: string }[] = [
  { hex: '#000000', name: 'Black' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#cc0000', name: 'Red' },
  { hex: '#ff4444', name: 'Light Red' },
  { hex: '#ff8800', name: 'Orange' },
  { hex: '#ffcc00', name: 'Yellow' },
  { hex: '#00aa00', name: 'Green' },
  { hex: '#00cc88', name: 'Teal' },
  { hex: '#0044cc', name: 'Blue' },
  { hex: '#6644cc', name: 'Purple' },
  { hex: '#cc44aa', name: 'Pink' },
  { hex: '#884400', name: 'Brown' },
];

// ── Star field ────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 97.234) % 100,
  r: i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1,
  o: 0.5 + (i % 5) * 0.1,
}));

export default function MakeArtPage() {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [notify,  setNotify]  = useState(false);
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [activeTool, setActiveTool] = useState(0);
  const [booting, setBooting] = useState(true);
  const [bootText, setBootText] = useState('Loading AAC Pix Deluxe');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Make Art — Artistic Accessibility Collective';
    // Boot sequence: dots animate, then splash fades out
    let dots = 0;
    const dotInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      setBootText('Loading AAC Pix Deluxe' + '.'.repeat(dots));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    const body = [
      name    ? `Name: ${name}`    : null,
      email   ? `Email: ${email}`  : null,
      message ? `Message: ${message}` : null,
      `Notify when open: ${notify ? 'Yes' : 'No'}`,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name || 'Anonymous',
          email:   email || 'no-reply@artisticaccessibility.com',
          message: `[Make Art Interest Form]\n\n${body}`,
        }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div
      className="make-art-outer"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a1a',
        overflow: 'hidden',
        fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
      }}
      role="main"
    >
      <style>{`
        @media (max-width: 580px) {
          .make-art-outer {
            position: static !important;
            min-height: 100dvh !important;
            overflow: auto !important;
          }
        }
        @keyframes kp-boot-fade {
          0%   { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes kp-window-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .make-art-window { animation: none !important; }
          .make-art-boot   { animation: none !important; display: none !important; }
        }
      `}</style>
      <h1 className="sr-only">Make Art Together — Artistic Accessibility Collective</h1>

      {/* ── Boot splash ───────────────────────────────────────────────────────── */}
      {booting && (
        <div
          className="make-art-boot"
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16,
            animation: 'kp-boot-fade 1.8s ease forwards',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 52 }}>🎨</span>
          <div style={{
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            fontSize: 13, color: '#ccc', letterSpacing: '0.05em',
            minWidth: 240, textAlign: 'center',
          }}>
            {bootText}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: 12, height: 12, background: ['#cc0000','#ff8800','#ffcc00','#44aa44','#4488cc'][i], border: '1px solid rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Starfield ────────────────────────────────────────────────────────── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {STARS.map((s) => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />
        ))}
      </svg>

      {/* ── App Window ───────────────────────────────────────────────────────── */}
      <div
        className="make-art-window"
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
          animation: booting ? 'none' : 'kp-window-in 0.2s ease forwards',
          opacity: booting ? 0 : undefined,
        }}
      >
        {/* ── Title bar ────────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(to right, #c00, #e03030, #c00)',
          padding: '3px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>🎨</span>
            AAC Pix Deluxe — Make Art Together
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['_','□','✕'].map((c) => (
              <div key={c} aria-hidden="true" style={{
                width: 16, height: 14, background: '#d44', border: '1px solid #faa',
                borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 9, fontWeight: 'bold', cursor: 'default',
              }}>{c}</div>
            ))}
          </div>
        </div>

        {/* ── Menu bar ─────────────────────────────────────────────────────── */}
        <div style={{ background: '#c8c8c8', borderBottom: '2px solid #666', padding: '1px 4px', display: 'flex', gap: 0, fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11 }}>
          {['File','Edit','Goodies','Wacky','Help'].map((m) => (
            <span key={m} aria-hidden="true" style={{ padding: '2px 8px', cursor: 'default', color: '#000' }}>{m}</span>
          ))}
        </div>

        {/* ── Body: left toolbar + canvas ──────────────────────────────────── */}
        <div className="make-art-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* ── Left toolbar (vertical on desktop, horizontal strip on mobile) ── */}
          <div
            role="toolbar"
            aria-label="Art tools"
            className="make-art-toolbar"
            style={{
              background: '#d0d0d0',
              borderRight: '3px solid #888',
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '4px 3px',
              flexShrink: 0,
            }}
          >
            {/* Home button — above the art tools, separated by a divider */}
            <a
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
            </a>
            <div aria-hidden="true" style={{ height: 2, background: '#999', margin: '2px 2px' }} />

            {TOOLS.map((tool, i) => {
              const COLORS = ['#cc4444','#d47733','#ccaa00','#44aa44','#4488cc','#8844cc','#cc44aa','#666','#444'];
              return (
                <button
                  key={tool.label}
                  onClick={() => setActiveTool(i)}
                  aria-label={tool.label}
                  aria-pressed={activeTool === i}
                  style={{
                    width: 34, height: 34,
                    background: activeTool === i ? COLORS[i] : '#bbb',
                    border: activeTool === i ? '2px inset #666' : '2px outset #eee',
                    borderRadius: 3,
                    fontSize: 18, lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.1s',
                    padding: 0,
                  }}
                >
                  {tool.emoji}
                </button>
              );
            })}
          </div>

          {/* ── Canvas / main content ─────────────────────────────────────── */}
          <div className="make-art-canvas" style={{ flex: 1, background: '#f8f6f0', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

            {/* Coming soon badge */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              padding: '8px 8px 0',
              flexShrink: 0,
            }}>
              <span style={{
                background: '#cc0000', color: 'white',
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                fontSize: 10, fontWeight: 'bold',
                padding: '2px 10px', letterSpacing: '0.08em',
                border: '1px solid #ff6666',
                userSelect: 'none',
              }} aria-label="Coming soon — canvas not yet open">
                ★ COMING SOON ★
              </span>
            </div>

            {/* Main canvas content */}
            <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Heading */}
              <div style={{ textAlign: 'center' }}>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  style={{
                    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
                    fontSize: 'clamp(20px, 4vw, 30px)',
                    margin: '0 0 6px',
                    background: 'linear-gradient(to right, #cc0000, #d47733, #ccaa00, #44aa44, #4488cc, #8844cc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1.2,
                  }}
                >
                  Make Art Together
                </h2>
                <p style={{
                  fontFamily: '"MS Sans Serif", Arial, sans-serif',
                  fontSize: 12, color: '#333', margin: 0, lineHeight: 1.5,
                }}>
                  A collaborative, accessible space for creativity — coming soon.
                </p>
              </div>

              {/* Description */}
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
                  We&apos;re building a place where accessibility professionals, artists, and community
                  members can create together. Think collaborative drawing, accessible prompts,
                  shared galleries, and tools designed for every kind of maker.
                </p>
                <p style={{ margin: 0 }}>
                  Tell us what you&apos;d like to see here, and we&apos;ll let you know when the canvas opens.
                </p>
              </div>

              {/* Interest form */}
              {status === 'sent' ? (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    border: '3px solid #44aa44', background: '#e8ffe8',
                    padding: '14px 16px', textAlign: 'center',
                    fontFamily: '"MS Sans Serif", Arial, sans-serif',
                    fontSize: 13, color: '#004400',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
                  <strong>You&apos;re on the list!</strong>
                  <br />
                  We&apos;ll be in touch when Make Art opens.
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate aria-label="Make Art interest form">
                  <fieldset style={{ border: '2px groove #999', padding: '10px 12px', margin: 0 }}>
                    <legend style={{ fontFamily: '"Comic Sans MS", cursive', fontWeight: 'bold', fontSize: 13, color: '#cc0000', padding: '0 6px' }}>
                      Count Me In!
                    </legend>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <label htmlFor="make-art-name" style={{ display: 'block', fontSize: 11, fontFamily: '"MS Sans Serif", Arial, sans-serif', marginBottom: 2 }}>
                            Name <span style={{ color: '#888' }}>(optional)</span>
                          </label>
                          <input
                            id="make-art-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%', padding: '3px 5px', fontSize: 12, border: '2px inset #aaa', fontFamily: '"MS Sans Serif", Arial, sans-serif', boxSizing: 'border-box' }}
                            autoComplete="name"
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <label htmlFor="make-art-email" style={{ display: 'block', fontSize: 11, fontFamily: '"MS Sans Serif", Arial, sans-serif', marginBottom: 2 }}>
                            Email <span style={{ color: '#888' }}>(optional)</span>
                          </label>
                          <input
                            id="make-art-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '3px 5px', fontSize: 12, border: '2px inset #aaa', fontFamily: '"MS Sans Serif", Arial, sans-serif', boxSizing: 'border-box' }}
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="make-art-message" style={{ display: 'block', fontSize: 11, fontFamily: '"MS Sans Serif", Arial, sans-serif', marginBottom: 2 }}>
                          What would you like to see here? <span style={{ color: '#888' }}>(optional)</span>
                        </label>
                        <textarea
                          id="make-art-message"
                          rows={3}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Accessible drawing tools, collaborative prompts, a gallery..."
                          style={{ width: '100%', padding: '3px 5px', fontSize: 12, border: '2px inset #aaa', fontFamily: '"MS Sans Serif", Arial, sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
                        <input
                          type="checkbox"
                          checked={notify}
                          onChange={(e) => setNotify(e.target.checked)}
                          style={{ width: 14, height: 14, cursor: 'pointer' }}
                        />
                        Notify me when Make Art opens
                      </label>

                      {status === 'error' && (
                        <p role="alert" style={{ color: '#cc0000', fontSize: 11, margin: 0, fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
                          Something went wrong. Please try again.
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="submit"
                          disabled={status === 'sending'}
                          style={{
                            background: status === 'sending' ? '#999' : 'linear-gradient(to bottom, #4488ff, #2266dd)',
                            color: 'white',
                            border: '2px outset #aae',
                            borderRadius: 3,
                            padding: '5px 18px',
                            fontSize: 13,
                            fontFamily: '"Comic Sans MS", cursive',
                            fontWeight: 'bold',
                            cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                            letterSpacing: '0.02em',
                          }}
                          aria-disabled={status === 'sending'}
                        >
                          {status === 'sending' ? 'Sending...' : '🎨 Count Me In!'}
                        </button>
                        <a
                          href="/"
                          style={{ fontSize: 11, color: '#444', fontFamily: '"MS Sans Serif", Arial, sans-serif', textDecoration: 'none' }}
                        >
                          ← Back to Home
                        </a>
                      </div>

                    </div>
                  </fieldset>
                </form>
              )}
            </div>
          </div>
        </div>

        <style>{`
          /* ── Mobile: make window fill screen and scroll ── */
          @media (max-width: 580px) {
            .make-art-window {
              position: static !important;
              transform: none !important;
              inset: unset !important;
              width: 100% !important;
              max-height: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
            }
            .make-art-body {
              flex-direction: column !important;
              overflow: visible !important;
            }
            .make-art-toolbar {
              flex-direction: row !important;
              flex-wrap: wrap !important;
              border-right: none !important;
              border-bottom: 3px solid #888 !important;
              padding: 3px 4px !important;
              gap: 3px !important;
            }
            .make-art-canvas {
              overflow: visible !important;
            }
          }
        `}</style>

        {/* ── Rainbow palette ───────────────────────────────────────────────── */}
        <div
          role="toolbar"
          aria-label="Color palette"
          style={{ display: 'flex', background: '#c8c8c8', borderTop: '2px solid #999', padding: '3px 4px', gap: 2, flexShrink: 0, flexWrap: 'wrap' }}
        >
          {PALETTE.map((color) => (
            <div
              key={color.hex}
              aria-label={color.name}
              style={{
                width: 18, height: 18,
                background: color.hex,
                border: '2px outset #fff',
                borderRadius: 1,
                cursor: 'crosshair',
                flexShrink: 0,
              }}
            />
          ))}
          <div style={{ flex: 1 }} aria-hidden="true" />
          <span style={{ fontSize: 10, color: '#555', alignSelf: 'center', fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
            ArtisticAccessibility.com
          </span>
        </div>

      </div>

      {/* ── Taskbar — pinned to bottom of the desktop, outside the app window ── */}
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
          <span style={{ fontSize: 14 }}>🎨</span>
          AAC Pix Deluxe
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

    </div>
  );
}
