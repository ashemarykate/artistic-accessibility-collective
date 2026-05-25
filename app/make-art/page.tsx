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

const PALETTE = [
  '#000000','#ffffff','#cc0000','#ff4444','#ff8800','#ffcc00',
  '#00aa00','#00cc88','#0044cc','#6644cc','#cc44aa','#884400',
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
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Make Art — Artistic Accessibility Collective';
    headingRef.current?.focus();
    return () => { document.title = 'Artistic Accessibility Collective'; };
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
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a1a',
        overflow: 'hidden',
        fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
      }}
      role="main"
    >
      <h1 className="sr-only">Make Art Together — Artistic Accessibility Collective</h1>

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
        style={{
          position: 'absolute',
          inset: '50% auto auto 50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(720px, calc(100vw - 16px))',
          maxHeight: 'calc(100vh - 16px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 0 0 3px #888, 0 12px 50px rgba(0,0,0,0.8)',
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
            Kid Pix Deluxe — Make Art Together
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* ── Left toolbar ─────────────────────────────────────────────── */}
          <div
            role="toolbar"
            aria-label="Art tools"
            style={{
              background: '#d0d0d0',
              borderRight: '3px solid #888',
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '4px 3px',
              flexShrink: 0,
            }}
          >
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
          <div style={{ flex: 1, background: '#f8f6f0', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

            {/* Coming soon banner */}
            <div style={{
              background: 'repeating-linear-gradient(45deg, #cc0000, #cc0000 8px, #ff3333 8px, #ff3333 16px)',
              color: 'white', fontWeight: 'bold', fontSize: 11,
              textAlign: 'center', padding: '3px 8px',
              fontFamily: '"MS Sans Serif", Arial, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              letterSpacing: '0.05em',
              userSelect: 'none',
              flexShrink: 0,
            }} aria-hidden="true">
              *** COMING SOON *** THIS CANVAS IS NOT YET OPEN *** COMING SOON ***
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

        {/* ── Rainbow palette ───────────────────────────────────────────────── */}
        <div
          role="toolbar"
          aria-label="Color palette"
          style={{ display: 'flex', background: '#c8c8c8', borderTop: '2px solid #999', padding: '3px 4px', gap: 2, flexShrink: 0, flexWrap: 'wrap' }}
        >
          {PALETTE.map((color) => (
            <div
              key={color}
              aria-label={color}
              style={{
                width: 18, height: 18,
                background: color,
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
    </div>
  );
}
