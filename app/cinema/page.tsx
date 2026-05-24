'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// ─── Design Tokens ───────────────────────────────────────────────
const C = {
  bg:       '#0a3bb8',
  bgDeep:   '#062586',
  bgRow:    '#1c1f8c',
  bgRow2:   '#2d1664',
  bgCh:     '#08032e',
  yellow:   '#fcdd2c',
  yellowD:  '#fbcc1c',
  white:    '#ffffff',
  soft:     '#c8d5ff',
  cyan:     '#22e5d6',
  magenta:  '#ff3b8d',
  red:      '#ff4040',
  green:    '#4dff7c',
  sans:     '"Arial Narrow", Arial, "Helvetica Neue", Helvetica, sans-serif',
  mono:     '"Courier New", Courier, monospace',
};

// ─── Grid data ───────────────────────────────────────────────────
type ShowCell = {
  title: string;
  kind: string;
  isNew?: boolean;
  isLive?: boolean;
  isFree?: boolean;
  span?: number;
};
type Channel = {
  num: string;
  call: string;
  shows: ShowCell[];
};

const CHANNELS: Channel[] = [
  {
    num: '01', call: 'DOCS',
    shows: [
      { title: 'Crip Camp', kind: 'Documentary', isFree: true },
      { title: 'Sound and Fury', kind: 'Documentary' },
      { title: 'Sins Invalid: Unashamed Claim', kind: 'Documentary', isNew: true },
      { title: 'Tell Me Everything', kind: 'Doc', isFree: true },
      { title: 'The Waiting Room', kind: 'Documentary' },
    ],
  },
  {
    num: '02', call: 'PERF',
    shows: [
      { title: 'Deaf West: Spring Awakening', kind: 'Performance', span: 2, isLive: true },
      { title: 'Kinetic Light: Wired', kind: 'Dance Film' },
      { title: 'Axis Dance Co.', kind: 'Performance', isFree: true },
      { title: 'TBA — Member Pick', kind: 'TBD' },
    ],
  },
  {
    num: '03', call: 'DRAM',
    shows: [
      { title: 'Children of a Lesser God', kind: 'Drama' },
      { title: 'The Sessions', kind: 'Drama' },
      { title: 'My Left Foot', kind: 'Drama' },
      { title: 'Far from Heaven', kind: 'Drama' },
      { title: 'Speechless S1', kind: 'Comedy' },
    ],
  },
  {
    num: '04', call: 'POD',
    shows: [
      { title: 'Disability Visibility Project', kind: 'Podcast', isFree: true, span: 2, isNew: true },
      { title: 'Reid My Mind Radio', kind: 'Podcast', isFree: true },
      { title: 'Disability After Dark', kind: 'Talk' },
      { title: 'The Accessible Stall', kind: 'Podcast', isFree: true },
    ],
  },
  {
    num: '05', call: 'SHRT',
    shows: [
      { title: 'Blind Ambition (Short)', kind: 'Short Film', isFree: true },
      { title: 'Access Is Love', kind: 'Short', isFree: true, isNew: true },
      { title: 'Sign Off (AAC)', kind: 'Short', isFree: true },
      { title: 'Open Channel', kind: 'Coming Soon', span: 2 },
    ],
  },
  {
    num: '06', call: 'INTL',
    shows: [
      { title: 'Graeae Theatre Collection', kind: 'Performance', span: 2 },
      { title: 'DADAA Intl', kind: 'Various', isFree: true },
      { title: 'Disability Arts Online', kind: 'Archive', isFree: true },
      { title: 'MORE COMING', kind: 'TBD' },
    ],
  },
];

const MEDIA_TYPES = ['Film', 'TV Show', 'Documentary', 'Short Film', 'Performance Recording', 'Other'];

const TICKER_ITEMS = [
  'COMING SOON: THE CINEMA',
  'CAPTIONS ON ALL CONTENT',
  'AUDIO DESCRIPTION WHERE AVAILABLE',
  'MEMBER CURATED PICKS',
  'CRIP CAMP NOW STREAMING',
  'SUGGEST A FILM BELOW',
  'DEAF WEST: SPRING AWAKENING',
  'DISABILITY VISIBILITY PROJECT',
];

export default function CinemaPage() {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<FormStatus>('idle');

  const [suggest, setSuggest] = useState({ title: '', type: '', why: '', name: '', email: '' });
  const [suggestStatus, setSuggestStatus] = useState<FormStatus>('idle');

  const [clock, setClock] = useState('');
  const [scrollPx, setScrollPx] = useState(0);

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Vertical grid scroll
  const ROW_H = 68;
  const totalRows = CHANNELS.length;
  const totalScrollH = totalRows * ROW_H;

  useEffect(() => {
    const id = setInterval(() => setScrollPx((p) => (p + 1) % totalScrollH), 50);
    return () => clearInterval(id);
  }, [totalScrollH]);

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cinema Notify Request',
          email: notifyEmail.trim(),
          subject: 'Cinema — Notify Me signup',
          message: `Someone wants to be notified when The Cinema launches: ${notifyEmail.trim()}`,
        }),
      });
      setNotifyStatus(res.ok ? 'success' : 'error');
    } catch {
      setNotifyStatus('error');
    }
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!suggest.title.trim()) return;
    setSuggestStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggest.name.trim() || 'Anonymous',
          email: suggest.email.trim() || 'no-reply@artisticaccessibility.com',
          subject: `Cinema Suggestion: ${suggest.title.trim()}`,
          message: [
            `Title: ${suggest.title.trim()}`,
            suggest.type ? `Type: ${suggest.type}` : '',
            suggest.why.trim() ? `Why: ${suggest.why.trim()}` : '',
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

  const inputBase: React.CSSProperties = {
    background: C.bgDeep,
    border: `1px solid rgba(252,221,44,0.3)`,
    color: C.white,
    fontFamily: C.sans,
    fontSize: 14,
    padding: '9px 12px',
    width: '100%',
    boxSizing: 'border-box',
  };

  // Double channels for seamless loop
  const loopedChannels = [...CHANNELS, ...CHANNELS];

  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.bgDeep,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 0 40px',
        fontFamily: C.sans,
        color: C.white,
      }}
    >
      <h1 className="sr-only">The Cinema — Artistic Accessibility Collective</h1>

      {/* ── Main TV panel ──────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 860,
          margin: '24px 16px 0',
          border: `3px solid ${C.yellow}`,
          boxShadow: `0 0 60px rgba(10,59,184,0.6), 0 4px 40px rgba(0,0,0,0.7)`,
          position: 'relative',
          /* CRT scanline texture */
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)`,
        }}
      >

        {/* ── Status bar ───────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: 16,
            padding: '5px 14px',
            background: C.bgDeep,
            borderBottom: `2px solid ${C.yellow}`,
            fontFamily: C.mono,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.yellow,
          }}
        >
          {/* Logo mark */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 13, letterSpacing: '0.04em' }}>
            <span style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '6px 0 6px 10px', borderColor: `transparent transparent transparent ${C.yellow}`, display: 'inline-block' }} />
            AAC CINEMA
          </div>

          {/* Scrolling ticker */}
          <div style={{ overflow: 'hidden', position: 'relative', height: 15 }}>
            <div className="cinema-ticker" style={{ display: 'inline-block', whiteSpace: 'nowrap', color: C.white }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} style={{ padding: '0 24px', color: i % 3 === 1 ? C.magenta : C.white }}>◆ {item}</span>
              ))}
            </div>
          </div>

          {/* Clock */}
          <div style={{ color: C.yellow, fontSize: 12, letterSpacing: '0.1em' }}>{clock}</div>
        </div>

        {/* ── Grid header / time bar ───────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            display: 'grid',
            gridTemplateColumns: '100px repeat(5, 1fr)',
            background: C.yellow,
            color: C.bgDeep,
            borderBottom: `3px solid ${C.bgDeep}`,
            fontFamily: C.sans,
            fontWeight: 900,
            fontSize: 16,
          }}
        >
          <div style={{ background: C.bgCh, color: C.yellow, padding: '8px 10px', textAlign: 'center', borderRight: `3px solid ${C.yellow}`, fontFamily: C.mono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            CH
          </div>
          {['NOW ON', 'UP NEXT', 'LATER', 'TONIGHT', 'COMING SOON'].map((slot, i) => (
            <div key={i} style={{ padding: '8px 12px', borderRight: i < 4 ? `2px solid ${C.bgDeep}` : 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              {slot}
            </div>
          ))}
        </div>

        {/* ── Scrolling grid ───────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{ height: 204, overflow: 'hidden', background: C.bgRow, position: 'relative' }}
        >
          {/* fade top/bottom */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 32, background: `linear-gradient(to bottom, ${C.bgDeep}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, background: `linear-gradient(to top, ${C.bgDeep}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />

          <div style={{ transform: `translateY(-${scrollPx}px)`, willChange: 'transform' }}>
            {loopedChannels.map((ch, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px repeat(5, 1fr)',
                  borderBottom: `2px solid ${C.bgCh}`,
                  minHeight: ROW_H,
                  background: rowIdx % 2 === 0 ? C.bgRow : C.bgRow2,
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 4px)',
                }}
              >
                {/* Channel column */}
                <div
                  style={{
                    background: C.bgCh,
                    color: C.yellow,
                    padding: '8px 10px',
                    display: 'grid',
                    gridTemplateRows: 'auto auto',
                    alignContent: 'center',
                    rowGap: 2,
                    borderRight: `3px solid ${C.yellow}`,
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)',
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 24, lineHeight: 1, letterSpacing: '-0.02em', color: C.yellowD, textShadow: `0 0 8px rgba(252,204,28,0.45)` }}>
                    {ch.num}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.cyan, textTransform: 'uppercase', textShadow: `0 0 6px rgba(34,229,214,0.35)` }}>
                    {ch.call}
                  </div>
                </div>

                {/* Show cells */}
                {ch.shows.slice(0, 5).map((show, si) => (
                  <div
                    key={si}
                    style={{
                      gridColumn: show.span ? `span ${show.span}` : undefined,
                      padding: '8px 12px',
                      borderRight: `1.5px solid rgba(252,221,44,0.2)`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 2,
                      position: 'relative',
                      color: C.white,
                    }}
                  >
                    {show.isNew && (
                      <span style={{ position: 'absolute', top: 5, right: 5, background: C.magenta, color: C.white, fontFamily: C.mono, fontWeight: 700, fontSize: 8, padding: '1px 4px', letterSpacing: '0.14em' }}>NEW</span>
                    )}
                    {show.isLive && (
                      <span style={{ position: 'absolute', top: 5, right: 5, background: C.red, color: C.white, fontFamily: C.mono, fontWeight: 700, fontSize: 8, padding: '1px 4px', letterSpacing: '0.14em' }}>● LIVE</span>
                    )}
                    <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15, letterSpacing: '-0.005em' }}>
                      {show.title}{show.isFree && <span style={{ color: C.yellow }}> ★</span>}
                    </div>
                    <div style={{ fontFamily: C.mono, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', color: C.cyan, textTransform: 'uppercase', textShadow: `0 0 4px rgba(34,229,214,0.25)` }}>
                      {show.kind}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── ON AIR badge + main content ──────────────────────── */}
        <div style={{ background: C.bg, padding: '24px 28px 28px', backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px)' }}>

          <div aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.magenta, color: C.white, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', padding: '4px 10px', marginBottom: 18, fontFamily: C.mono, textTransform: 'uppercase' }}>
            <span className="cinema-blink-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: C.white, display: 'inline-block' }} />
            ON AIR SOON
          </div>

          {/* About */}
          <section aria-label="About The Cinema" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 32, lineHeight: 0.95, letterSpacing: '-0.02em', color: C.white, margin: '0 0 4px', textShadow: `0 2px 0 ${C.bgDeep}, 0 0 24px rgba(252,221,44,0.18)` }}>
              THE <span style={{ color: C.yellow }}>CINEMA</span>
            </h2>
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.cyan, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>
              Ch. 42 — Disability Arts Film & Video
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: C.soft, margin: '0 0 10px' }}>
              A curated film and video library for the disability arts community. Documentaries, short films, dance
              films, performance recordings — with a focus on work that is actually accessible: captioned, audio
              described, or both.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: C.soft, margin: 0 }}>
              Think: <em>Crip Camp</em>, Deaf West on Broadway, Kinetic Light, Sins Invalid — and everything your
              professor never put on the syllabus. Member picks welcome. ★ = free to stream.
            </p>
          </section>

          {/* ── Notify me form ────────────────────────────────── */}
          <section
            aria-label="Get notified when The Cinema launches"
            style={{ background: C.bgDeep, border: `2px solid ${C.yellow}`, padding: '20px', marginBottom: 20 }}
          >
            <h2 style={{ fontFamily: C.mono, fontSize: 11, color: C.yellow, margin: '0 0 14px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              ▶ Notify me when The Cinema opens
            </h2>
            {notifyStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ background: 'rgba(77,255,124,0.12)', border: `1px solid ${C.green}`, padding: '12px 16px', color: C.green, fontSize: 14, fontFamily: C.mono, letterSpacing: '0.05em' }}>
                ✓ You&apos;re on the list! We&apos;ll let you know when The Cinema is ready to stream.
              </div>
            ) : (
              <form onSubmit={handleNotify} noValidate style={{ display: 'flex', flexWrap: 'wrap' }}>
                <label htmlFor="cinema-notify-email" className="sr-only">Your email address</label>
                <input
                  id="cinema-notify-email"
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={notifyStatus === 'loading'}
                  className="cinema-input"
                  style={{ ...inputBase, flex: 1, minWidth: 200, borderRight: 'none' }}
                />
                <button
                  type="submit"
                  disabled={notifyStatus === 'loading' || !notifyEmail.trim()}
                  className="cinema-btn"
                  style={{
                    background: (notifyStatus === 'loading' || !notifyEmail.trim()) ? 'rgba(252,221,44,0.2)' : C.yellow,
                    color: (notifyStatus === 'loading' || !notifyEmail.trim()) ? 'rgba(252,221,44,0.5)' : C.bgDeep,
                    border: `1px solid ${C.yellow}`,
                    borderLeft: 'none',
                    fontWeight: 900,
                    fontSize: 13,
                    padding: '9px 18px',
                    cursor: (notifyStatus === 'loading' || !notifyEmail.trim()) ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                    fontFamily: C.sans,
                    textTransform: 'uppercase',
                  }}
                >
                  {notifyStatus === 'loading' ? 'Sending…' : 'Subscribe'}
                </button>
                {notifyStatus === 'error' && (
                  <p role="alert" style={{ color: C.red, fontFamily: C.mono, fontSize: 11, margin: '8px 0 0', width: '100%', letterSpacing: '0.05em' }}>
                    ✗ Something went wrong — please try again or email us directly.
                  </p>
                )}
              </form>
            )}
          </section>

          {/* ── Suggest a film ────────────────────────────────── */}
          <section
            aria-label="Suggest a film or TV show"
            style={{ background: C.bgDeep, border: `1px solid rgba(252,221,44,0.35)`, padding: '20px', marginBottom: 24 }}
          >
            <h2 style={{ fontFamily: C.mono, fontSize: 11, color: C.yellow, margin: '0 0 4px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              ▶ Suggest a Film or TV Show
            </h2>
            <p style={{ fontFamily: C.mono, fontSize: 10, color: C.soft, margin: '0 0 16px', letterSpacing: '0.06em' }}>
              What should every disability arts person watch?
            </p>

            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ background: 'rgba(77,255,124,0.12)', border: `1px solid ${C.green}`, padding: '12px 16px', color: C.green, fontSize: 14, fontFamily: C.mono, letterSpacing: '0.05em' }}>
                ✓ Suggestion received — thank you! We&apos;ll add it to the screening queue.
              </div>
            ) : (
              <form onSubmit={handleSuggest} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="cinema-grid-2">
                  <div>
                    <label htmlFor="cinema-suggest-title" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Title <span aria-hidden="true">*</span><span className="sr-only">(required)</span>
                    </label>
                    <input
                      id="cinema-suggest-title"
                      type="text"
                      value={suggest.title}
                      onChange={(e) => setSuggest((s) => ({ ...s, title: e.target.value }))}
                      placeholder="Film or show title"
                      required
                      disabled={suggestStatus === 'loading'}
                      className="cinema-input"
                      style={inputBase}
                    />
                  </div>
                  <div>
                    <label htmlFor="cinema-suggest-type" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Type <span style={{ opacity: 0.6 }}>(optional)</span>
                    </label>
                    <select
                      id="cinema-suggest-type"
                      value={suggest.type}
                      onChange={(e) => setSuggest((s) => ({ ...s, type: e.target.value }))}
                      disabled={suggestStatus === 'loading'}
                      className="cinema-input"
                      style={{ ...inputBase, appearance: 'none' }}
                    >
                      <option value="">Select type…</option>
                      {MEDIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="cinema-suggest-why" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Why this one? <span style={{ opacity: 0.6 }}>(optional)</span>
                  </label>
                  <textarea
                    id="cinema-suggest-why"
                    value={suggest.why}
                    onChange={(e) => setSuggest((s) => ({ ...s, why: e.target.value }))}
                    placeholder="Why should this be in The Cinema?"
                    rows={3}
                    disabled={suggestStatus === 'loading'}
                    className="cinema-input"
                    style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="cinema-grid-2">
                  <div>
                    <label htmlFor="cinema-suggest-name" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Your Name <span style={{ opacity: 0.6 }}>(optional)</span>
                    </label>
                    <input
                      id="cinema-suggest-name"
                      type="text"
                      value={suggest.name}
                      onChange={(e) => setSuggest((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Name"
                      disabled={suggestStatus === 'loading'}
                      className="cinema-input"
                      style={inputBase}
                    />
                  </div>
                  <div>
                    <label htmlFor="cinema-suggest-email" style={{ display: 'block', fontFamily: C.mono, fontSize: 10, color: C.cyan, marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Your Email <span style={{ opacity: 0.6 }}>(optional)</span>
                    </label>
                    <input
                      id="cinema-suggest-email"
                      type="email"
                      value={suggest.email}
                      onChange={(e) => setSuggest((s) => ({ ...s, email: e.target.value }))}
                      placeholder="your@email.com"
                      disabled={suggestStatus === 'loading'}
                      className="cinema-input"
                      style={inputBase}
                    />
                  </div>
                </div>

                <div style={{ paddingTop: 4 }}>
                  <button
                    type="submit"
                    disabled={suggestStatus === 'loading' || !suggest.title.trim()}
                    className="cinema-btn"
                    style={{
                      background: (suggestStatus === 'loading' || !suggest.title.trim()) ? 'rgba(252,221,44,0.2)' : C.yellow,
                      color: (suggestStatus === 'loading' || !suggest.title.trim()) ? 'rgba(252,221,44,0.5)' : C.bgDeep,
                      border: `2px solid ${C.yellow}`,
                      fontWeight: 900,
                      fontSize: 13,
                      padding: '10px 22px',
                      cursor: (suggestStatus === 'loading' || !suggest.title.trim()) ? 'default' : 'pointer',
                      letterSpacing: '0.04em',
                      fontFamily: C.sans,
                      textTransform: 'uppercase',
                    }}
                  >
                    {suggestStatus === 'loading' ? 'Sending…' : 'Submit Suggestion'}
                  </button>
                </div>

                {suggestStatus === 'error' && (
                  <p role="alert" style={{ color: C.red, fontFamily: C.mono, fontSize: 11, margin: 0, letterSpacing: '0.05em' }}>
                    ✗ Something went wrong — please try again or email us directly.
                  </p>
                )}
              </form>
            )}
          </section>

          {/* Nav links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 14 }}>
            <Link href="/resources" className="cinema-link" style={{ color: C.yellow, textDecoration: 'none', fontWeight: 700, letterSpacing: '0.03em' }}>
              Browse Resources →
            </Link>
            <Link href="/" className="cinema-link" style={{ color: C.soft, textDecoration: 'none' }}>
              ← Back Home
            </Link>
          </div>
        </div>

        {/* ── Bottom ticker bar ────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            background: C.bgCh,
            borderTop: `2px solid ${C.yellow}`,
            padding: '5px 14px',
            overflow: 'hidden',
            display: 'flex',
            gap: 0,
          }}
        >
          <div className="cinema-ticker-bottom" style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: C.mono, fontSize: 11, letterSpacing: '0.1em', color: C.yellow }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={{ padding: '0 20px', color: i % 4 === 2 ? C.cyan : C.yellow }}>◆ {item}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CSS ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes cinema-scroll-x {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .cinema-ticker {
          animation: cinema-scroll-x 34s linear infinite;
        }
        .cinema-ticker-bottom {
          animation: cinema-scroll-x 42s linear infinite;
        }
        @keyframes cinema-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }
        .cinema-blink-dot {
          animation: cinema-blink 1s steps(2, end) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cinema-ticker,
          .cinema-ticker-bottom { animation: none; }
          .cinema-blink-dot { animation: none; }
        }
        .cinema-input:focus-visible,
        .cinema-input:focus {
          outline: 3px solid ${C.magenta};
          outline-offset: 0;
          border-color: ${C.yellow};
        }
        .cinema-btn:focus-visible {
          outline: 3px solid ${C.magenta};
          outline-offset: 2px;
        }
        .cinema-link:hover,
        .cinema-link:focus-visible {
          text-decoration: underline;
          outline: 3px solid ${C.magenta};
          outline-offset: 3px;
          border-radius: 1px;
        }
        .cinema-input::placeholder {
          color: rgba(200,213,255,0.35);
        }
        .cinema-input option {
          background: #062586;
          color: #ffffff;
        }
        @media (max-width: 560px) {
          .cinema-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
