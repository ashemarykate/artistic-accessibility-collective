'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import KidArtToolbar from '@/components/KidArtToolbar';
import WindowControls from '@/components/WindowControls';

const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 97.234) % 100,
  r: i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1,
  o: 0.5 + (i % 5) * 0.1,
}));

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

// Dark enough to stay readable on the cream canvas, bright enough to feel like crayons.
const LETTER_COLORS = ['#cc0000', '#b34700', '#00722b', '#0044cc', '#6644cc', '#a1247e', '#007a52', '#884400'];

const STAMPS: Array<{ e: string; style: React.CSSProperties }> = [
  { e: '⭐', style: { top: 4, left: 8 } },
  { e: '🌈', style: { top: 4, right: 10 } },
  { e: '🦖', style: { bottom: 8, left: 12 } },
  { e: '❤️', style: { bottom: 10, right: 10 } },
  { e: '🖍️', style: { top: '46%', right: 4 } },
];

const SPLASH_COLORS = ['#ff4444', '#ff8800', '#ffcc00', '#44cc44', '#44aaff', '#bb66ff'];
const UIFONT = '"MS Sans Serif", Arial, sans-serif';
const KIDFONT = '"Comic Sans MS", "Chalkboard SE", cursive';

type BootPhase = 'insert' | 'read' | 'splash' | 'done';

function WobbleWord({ text, seed, size }: { text: string; seed: number; size: string }) {
  return (
    <span aria-hidden="true">
      {text.split('').map((ch, i) => ch === ' '
        ? <span key={i} style={{ display: 'inline-block', width: '0.35em' }} />
        : (
          <span key={i} style={{
            display: 'inline-block', fontFamily: KIDFONT, fontWeight: 'bold', fontSize: size,
            color: LETTER_COLORS[i % LETTER_COLORS.length],
            textShadow: '2px 2px 0 #111',
            transform: `rotate(${((i * 47 + seed * 31) % 9) - 4}deg)`,
          }}>{ch}</span>
        ))}
    </span>
  );
}

export default function MakeArtPage() {
  const [phase, setPhase] = useState<BootPhase>('insert');
  const [ink, setInk] = useState(PALETTE[2]); // Red, the classic first crayon
  const [seed, setSeed] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bootRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<number[]>([]);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('done');
    setTimeout(() => headingRef.current?.focus(), 120);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      setTimeout(() => headingRef.current?.focus(), 100);
    } else {
      bootRef.current?.focus();
      timers.current = [
        window.setTimeout(() => setPhase('read'), 850),
        window.setTimeout(() => setPhase('splash'), 2000),
        window.setTimeout(finish, 2850),
      ];
    }
    const t = timers.current;
    return () => {
      t.forEach(clearTimeout);
    };
  }, [finish]);

  return (
    <div
      className="make-art-outer"
      style={{ position: 'fixed', inset: 0, background: '#0a0a1a', overflow: 'hidden', fontFamily: KIDFONT }}
      role="main"
    >
      <style>{`
        @media (max-width: 580px) {
          .make-art-outer { position: static !important; min-height: 100dvh !important; overflow: auto !important; }
          .make-art-window { position: static !important; transform: none !important; inset: unset !important; width: 100% !important; max-height: none !important; border-radius: 0 !important; box-shadow: none !important; overflow: visible !important; }
          .make-art-body  { flex-direction: column !important; overflow: visible !important; }
          .make-art-canvas { overflow: visible !important; }
          .kp-stamp { display: none !important; }
          .make-art-taskbar { display: none !important; }
        }
        @keyframes kp-window-in { from{opacity:0;transform:translate(-50%,-50%) scale(0.85)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes kp-cd-slide { from{transform:translateX(0)} to{transform:translateX(128px) scale(.55)} }
        .kp-cd { animation: kp-cd-slide .8s ease-in forwards }
        @keyframes kp-spin { to{transform:rotate(360deg)} }
        .kp-cd-spin { animation: kp-spin 1s linear infinite }
        @keyframes kp-blockon { 0%,100%{opacity:.25} 50%{opacity:1} }
        .kp-block { animation: kp-blockon .9s ease-in-out infinite }
        @keyframes kp-splash-in { from{transform:scale(.3);opacity:0} to{transform:scale(1);opacity:1} }
        .kp-splash { animation: kp-splash-in .45s cubic-bezier(.16,1,.3,1) both }
        .kp-btn { transition: transform .06s }
        .kp-btn:active { transform: translate(3px,3px) !important; box-shadow: 1px 1px 0 #111 !important }
        .kp-btn:focus-visible, .kp-swatch:focus-visible, .kp-menu-btn:focus-visible { outline: 3px solid #f5d84a; outline-offset: 2px }
        .kp-swatch { position: relative }
        .kp-swatch::after { content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); min-width:44px; min-height:44px }
        .kp-menu-btn { position: relative }
        .kp-menu-btn::after { content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); min-width:44px; min-height:44px }
        @media (prefers-reduced-motion: reduce) {
          .make-art-window { animation: none !important; }
          .kp-cd, .kp-cd-spin, .kp-block, .kp-splash { animation: none !important; }
        }
      `}</style>

      <h1 className="sr-only">Make Art Together · Artistic Accessibility Collective</h1>

      {/* CD-ROM boot sequence: insert, read, splash. Click or press any button to skip. */}
      {phase !== 'done' && (
        <button
          ref={bootRef}
          onClick={finish}
          aria-label="Skip intro"
          style={{ position: 'fixed', inset: 0, zIndex: 30, background: '#0a0a1a', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: UIFONT, color: '#ccc' }}
        >
          {phase === 'insert' && (<>
            <div style={{ position: 'relative', width: 220, height: 80 }} aria-hidden="true">
              <span className="kp-cd" style={{ position: 'absolute', left: 0, top: 8, fontSize: 44, display: 'inline-block' }}>💿</span>
              <div style={{ position: 'absolute', right: 0, top: 22, width: 90, height: 26, background: '#333', borderRadius: 4, boxShadow: 'inset 0 2px 6px #000' }}>
                <div style={{ position: 'absolute', left: 10, right: 10, top: 11, height: 3, background: '#000', borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontSize: 13, letterSpacing: '.05em' }}>Inserting disc: AAC_PIX_DELUXE.CD</span>
          </>)}
          {phase === 'read' && (<>
            <span className="kp-cd-spin" aria-hidden="true" style={{ fontSize: 48, display: 'inline-block' }}>💿</span>
            <span style={{ fontSize: 13, letterSpacing: '.05em' }}>Reading disc, hold onto your crayons</span>
            <span style={{ display: 'flex', gap: 4 }} aria-hidden="true">
              {[0, 1, 2, 3, 4].map(i => (
                <span key={i} className="kp-block" style={{ width: 12, height: 12, display: 'inline-block', background: ['#cc0000', '#ff8800', '#ffcc00', '#44aa44', '#4488cc'][i], animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </>)}
          {phase === 'splash' && (
            <span className="kp-splash" aria-hidden="true" style={{ display: 'inline-block', textAlign: 'center' }}>
              <span style={{ fontFamily: KIDFONT, fontWeight: 'bold', fontSize: 'clamp(30px, 7vw, 56px)', lineHeight: 1.2 }}>
                {'AAC PIX DELUXE!'.split('').map((ch, i) => ch === ' '
                  ? <span key={i} style={{ display: 'inline-block', width: '.4em' }} />
                  : <span key={i} style={{ display: 'inline-block', color: SPLASH_COLORS[i % 6], textShadow: '3px 3px 0 #000', transform: `rotate(${(i % 2 ? 1 : -1) * (3 + (i % 4))}deg)` }}>{ch}</span>)}
              </span>
              <span style={{ display: 'block', color: '#999', fontSize: 12, marginTop: 14 }}>the art room is open</span>
            </span>
          )}
          <span className="sr-only" role="status">Loading Make Art. Press Enter to skip the intro.</span>
          <span aria-hidden="true" style={{ position: 'absolute', bottom: 18, fontSize: 11, color: '#777' }}>click anywhere to skip</span>
        </button>
      )}

      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {STARS.map((s) => <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />)}
      </svg>

      <div
        className="make-art-window"
        style={{ position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', width: 'min(760px, calc(100vw - 16px))', maxHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden', boxShadow: '0 0 0 4px #111, 0 16px 60px rgba(0,0,0,0.8)', animation: phase !== 'done' ? 'none' : 'kp-window-in 0.2s ease forwards', opacity: phase !== 'done' ? 0 : undefined }}
      >
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(to right, #c00, #e03030, #c00)', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 'bold', fontSize: 13, fontFamily: KIDFONT }}>
            <span aria-hidden="true" style={{ fontSize: 17 }}>🎨</span>
            AAC Pix Deluxe! · Make Art Together
          </div>
          <WindowControls bg="#d44" border="#faa" />
        </div>

        {/* Rainbow strip, because every good art program has one */}
        <div aria-hidden="true" style={{ height: 5, flexShrink: 0, background: 'linear-gradient(90deg,#cc0000,#ff8800,#ffcc00,#00aa00,#0044cc,#6644cc)' }} />

        {/* Menu bar: mostly set dressing, but Wacky! really works */}
        <div style={{ background: '#e8e4da', borderBottom: '2px solid #111', padding: '1px 4px', display: 'flex', alignItems: 'center', fontFamily: UIFONT, fontSize: 11 }}>
          {['File', 'Edit', 'Goodies'].map((m) => (
            <span key={m} aria-hidden="true" style={{ padding: '3px 8px', cursor: 'default', color: '#000' }}>{m}</span>
          ))}
          <button
            onClick={() => setSeed(s => s + 1)}
            className="kp-menu-btn"
            aria-label="Wacky! Shuffle the decorations"
            style={{ padding: '3px 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 11, fontWeight: 700, color: '#7a2a8a' }}
          >
            Wacky!
          </button>
          <span aria-hidden="true" style={{ padding: '3px 8px', cursor: 'default', color: '#000' }}>Help</span>
        </div>

        {/* Body: toolbar + canvas */}
        <div className="make-art-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <KidArtToolbar active="make-art" />

          {/* Canvas */}
          <div className="make-art-canvas" style={{ flex: 1, background: '#fdfcf8', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ flex: 1, margin: 8, border: `6px solid ${ink.hex}`, borderRadius: 10, padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', transition: 'border-color .15s' }}>

              {/* Stamps scattered around the frame. Wacky! reshuffles their tilt. */}
              {STAMPS.map((s, i) => (
                <span key={i} className="kp-stamp" aria-hidden="true" style={{ position: 'absolute', fontSize: 21, opacity: .9, pointerEvents: 'none', transform: `rotate(${((seed * 7 + i * 53) % 40) - 20}deg)`, ...s.style }}>{s.e}</span>
              ))}

              {/* Heading */}
              <div style={{ textAlign: 'center' }}>
                <h2 ref={headingRef} tabIndex={-1} aria-label="Make Art Together" style={{ margin: '0 0 6px', lineHeight: 1.15, outline: 'none' }}>
                  <WobbleWord text="Make Art Together" seed={seed} size="clamp(24px, 4.5vw, 34px)" />
                </h2>
                <p style={{ fontFamily: UIFONT, fontSize: 11, color: '#555', margin: 0 }}>
                  Community art projects, accessible prompts, and creative play.
                </p>
              </div>

              {/* Description box */}
              <div style={{ border: '3px solid #111', borderRadius: 6, background: '#fff', padding: '10px 14px', fontSize: 12, fontFamily: UIFONT, color: '#222', lineHeight: 1.65, boxShadow: '4px 4px 0 rgba(17,17,17,.15)' }}>
                <p style={{ margin: '0 0 6px' }}>
                  This is a space for making things together. Community art projects. Accessible prompts. A growing gallery of art described in many different voices.
                </p>
                <p style={{ margin: 0, color: '#555' }}>
                  Use the buttons in the toolbar to explore what is here and what is coming.
                </p>
              </div>

              {/* Project: Image Description as Art */}
              <div style={{ border: '3px solid #111', borderRadius: 6, background: '#f0faf6', padding: '12px 14px', boxShadow: '5px 5px 0 rgba(17,17,17,.85)', transform: 'rotate(-0.7deg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span aria-hidden="true" style={{ fontSize: 20 }}>👁️</span>
                  <strong style={{ fontFamily: KIDFONT, fontSize: 14, color: '#0b5e48' }}>
                    Image Description as Art
                  </strong>
                  <span style={{ fontFamily: UIFONT, fontSize: 10, background: '#0b5e48', color: '#fff', padding: '1px 6px', letterSpacing: '0.06em' }}>
                    OPEN
                  </span>
                </div>
                <p style={{ fontFamily: UIFONT, fontSize: 11, color: '#333', lineHeight: 1.6, margin: '0 0 12px' }}>
                  Pick a piece of art and write what you see in your own words. Every description gets added to a growing, community-built portrait of that piece. Many voices, one work.
                </p>
                <Link
                  href="/make-art/image-description"
                  className="kp-btn"
                  style={{ fontFamily: KIDFONT, fontSize: 13, fontWeight: 'bold', color: '#fff', background: '#0b5e48', padding: '8px 16px', textDecoration: 'none', border: '3px solid #111', borderRadius: 6, boxShadow: '4px 4px 0 #111', display: 'inline-block', minHeight: 44, boxSizing: 'border-box' }}
                >
                  👁️ Open Project
                </Link>
              </div>

              {/* Project: The Channel */}
              <div style={{ border: '3px solid #111', borderRadius: 6, background: '#1a1000', padding: '12px 14px', boxShadow: '5px 5px 0 rgba(17,17,17,.85)', transform: 'rotate(0.6deg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span aria-hidden="true" style={{ fontSize: 20 }}>📺</span>
                  <strong style={{ fontFamily: KIDFONT, fontSize: 14, color: '#ffaa44' }}>
                    The Channel
                  </strong>
                  <span style={{ fontFamily: UIFONT, fontSize: 10, background: '#cc4400', color: '#fff', padding: '1px 6px', letterSpacing: '0.06em' }}>
                    ON AIR
                  </span>
                </div>
                <p style={{ fontFamily: UIFONT, fontSize: 11, color: '#ccc', lineHeight: 1.6, margin: '0 0 12px' }}>
                  A curated playlist of art and accessibility videos, on demand. Shuffles every visit so there is always something new.
                </p>
                <Link
                  href="/make-art/the-channel"
                  className="kp-btn"
                  style={{ fontFamily: KIDFONT, fontSize: 13, fontWeight: 'bold', color: '#fff', background: '#7a4500', padding: '8px 16px', textDecoration: 'none', border: '3px solid #111', borderRadius: 6, boxShadow: '4px 4px 0 #111', display: 'inline-block', minHeight: 44, boxSizing: 'border-box' }}
                >
                  📺 Watch Now
                </Link>
              </div>

              {/* Project: Submissions (design our banner) */}
              <div style={{ border: '3px solid #111', borderRadius: 6, background: '#f4eefa', padding: '12px 14px', boxShadow: '5px 5px 0 rgba(17,17,17,.85)', transform: 'rotate(0.5deg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span aria-hidden="true" style={{ fontSize: 20 }}>🪧</span>
                  <strong style={{ fontFamily: KIDFONT, fontSize: 14, color: '#5a2a7a' }}>
                    Submissions
                  </strong>
                  <span style={{ fontFamily: UIFONT, fontSize: 10, background: '#5a2a7a', color: '#fff', padding: '1px 6px', letterSpacing: '0.06em' }}>
                    OPEN
                  </span>
                </div>
                <p style={{ fontFamily: UIFONT, fontSize: 11, color: '#333', lineHeight: 1.6, margin: '0 0 12px' }}>
                  Every time this site loads, the logo up top is picked at random from a small set of styles. Design one in your own style and it could join the rotation.
                </p>
                <Link
                  href="/make-art/submit-logo"
                  className="kp-btn"
                  style={{ fontFamily: KIDFONT, fontSize: 13, fontWeight: 'bold', color: '#fff', background: '#5a2a7a', padding: '8px 16px', textDecoration: 'none', border: '3px solid #111', borderRadius: 6, boxShadow: '4px 4px 0 #111', display: 'inline-block', minHeight: 44, boxSizing: 'border-box' }}
                >
                  🪧 See What's Needed
                </Link>
              </div>

              {/* Coming soon */}
              <div style={{ border: '3px dashed #aaa', borderRadius: 6, background: '#fafafa', padding: '10px 14px', textAlign: 'center', transform: 'rotate(-0.4deg)' }}>
                <p style={{ fontFamily: UIFONT, fontSize: 11, color: '#777', margin: 0 }}>
                  ✨ More projects are on their way. Check back soon!
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Palette bar: pick a crayon, the canvas frame follows */}
        <div role="toolbar" aria-label="Color palette" style={{ display: 'flex', alignItems: 'center', background: '#e8e4da', borderTop: '3px solid #111', padding: '6px 8px', gap: 5, flexShrink: 0, flexWrap: 'wrap' }}>
          {PALETTE.map((color) => {
            const selected = ink.hex === color.hex;
            return (
              <button
                key={color.hex}
                className="kp-swatch"
                onClick={() => setInk(color)}
                aria-label={`Color the frame ${color.name}`}
                aria-pressed={selected}
                style={{ width: 26, height: 26, background: color.hex, border: selected ? '3px solid #111' : '2px solid #666', borderRadius: 4, cursor: 'pointer', flexShrink: 0, padding: 0, transform: selected ? 'scale(1.18)' : 'none', transition: 'transform .1s', boxShadow: selected ? '0 0 0 2px #f5d84a' : 'none' }}
              />
            );
          })}
          <span className="sr-only" role="status">Frame color: {ink.name}</span>
          <span aria-hidden="true" style={{ fontSize: 11, color: '#333', fontFamily: UIFONT, marginLeft: 4 }}>
            🖍️ {ink.name}
          </span>
          <div style={{ flex: 1 }} aria-hidden="true" />
          <span aria-hidden="true" style={{ fontSize: 10, color: '#555', alignSelf: 'center', fontFamily: UIFONT }}>ArtisticAccessibility.com</span>
        </div>
      </div>

      {/* Taskbar */}
      <div aria-hidden="true" className="make-art-taskbar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to bottom, #2a2a3a, #1a1a28)', borderTop: '1px solid #444', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6, fontFamily: UIFONT, fontSize: 11, userSelect: 'none', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 10px 2px 8px', color: 'white', fontWeight: 'bold', minWidth: 160 }}>
          <span style={{ fontSize: 14 }}>💿</span>
          AAC_PIX_DELUXE.CD
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
