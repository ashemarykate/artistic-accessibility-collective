'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import KidArtToolbar from '@/components/KidArtToolbar';

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

export default function MakeArtPage() {
  const [booting, setBooting] = useState(true);
  const [bootText, setBootText] = useState('Loading AAC Pix Deluxe');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Make Art · Artistic Accessibility Collective';
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
          .make-art-outer { position: static !important; min-height: 100dvh !important; overflow: auto !important; }
          .make-art-window { position: static !important; transform: none !important; inset: unset !important; width: 100% !important; max-height: none !important; border-radius: 0 !important; box-shadow: none !important; overflow: visible !important; }
          .make-art-body  { flex-direction: column !important; overflow: visible !important; }
          .make-art-canvas { overflow: visible !important; }
        }
        @keyframes kp-boot-fade   { 0%,80%{opacity:1}100%{opacity:0} }
        @keyframes kp-window-in   { from{opacity:0;transform:translate(-50%,-50%) scale(0.85)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @media (prefers-reduced-motion: reduce) {
          .make-art-window { animation: none !important; }
          .make-art-boot   { animation: none !important; display: none !important; }
        }
      `}</style>

      <h1 className="sr-only">Make Art Together · Artistic Accessibility Collective</h1>

      {booting && (
        <div className="make-art-boot" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, animation: 'kp-boot-fade 1.8s ease forwards', pointerEvents: 'none' }}>
          <span style={{ fontSize: 52 }}>🎨</span>
          <div style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 13, color: '#ccc', letterSpacing: '0.05em', minWidth: 240, textAlign: 'center' }}>{bootText}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ width: 12, height: 12, background: ['#cc0000','#ff8800','#ffcc00','#44aa44','#4488cc'][i], border: '1px solid rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      )}

      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {STARS.map((s) => <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />)}
      </svg>

      <div
        className="make-art-window"
        style={{ position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', width: 'min(720px, calc(100vw - 16px))', maxHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 0 3px #888, 0 12px 50px rgba(0,0,0,0.8)', animation: booting ? 'none' : 'kp-window-in 0.2s ease forwards', opacity: booting ? 0 : undefined }}
      >
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(to right, #c00, #e03030, #c00)', padding: '3px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>🎨</span>
            AAC Pix Deluxe · Make Art Together
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['_','□','✕'].map((c) => (
              <div key={c} aria-hidden="true" style={{ width: 16, height: 14, background: '#d44', border: '1px solid #faa', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 9, fontWeight: 'bold', cursor: 'default' }}>{c}</div>
            ))}
          </div>
        </div>

        {/* Menu bar */}
        <div style={{ background: '#c8c8c8', borderBottom: '2px solid #666', padding: '1px 4px', display: 'flex', gap: 0, fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11 }}>
          {['File','Edit','Goodies','Wacky','Help'].map((m) => (
            <span key={m} aria-hidden="true" style={{ padding: '2px 8px', cursor: 'default', color: '#000' }}>{m}</span>
          ))}
        </div>

        {/* Body: toolbar + canvas */}
        <div className="make-art-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <KidArtToolbar active="make-art" />

          {/* Canvas */}
          <div className="make-art-canvas" style={{ flex: 1, background: '#f8f6f0', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Heading */}
              <div style={{ textAlign: 'center' }}>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive', fontSize: 'clamp(20px, 4vw, 28px)', margin: '0 0 4px', color: '#cc0000', lineHeight: 1.2 }}
                >
                  Make Art Together
                </h2>
                <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#555', margin: 0 }}>
                  Community art projects, accessible prompts, and creative play.
                </p>
              </div>

              {/* Description box */}
              <div style={{ border: '3px solid #aaa', borderStyle: 'inset', background: '#fff', padding: '10px 14px', fontSize: 12, fontFamily: '"MS Sans Serif", Arial, sans-serif', color: '#222', lineHeight: 1.65 }}>
                <p style={{ margin: '0 0 6px' }}>
                  This is a space for making things together. Community art projects. Accessible prompts. A growing gallery of art described in many different voices.
                </p>
                <p style={{ margin: 0, color: '#555' }}>
                  Use the buttons in the toolbar on the left to explore what is here and what is coming.
                </p>
              </div>

              {/* Project: Image Description as Art */}
              <div style={{ border: '2px solid #0b5e48', background: '#f0faf6', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span aria-hidden="true" style={{ fontSize: 20 }}>👁️</span>
                  <strong style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 13, color: '#0b5e48' }}>
                    Image Description as Art
                  </strong>
                  <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 10, background: '#0b5e48', color: '#fff', padding: '1px 6px', letterSpacing: '0.06em' }}>
                    OPEN
                  </span>
                </div>
                <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#333', lineHeight: 1.6, margin: '0 0 10px' }}>
                  Pick a piece of art and write what you see in your own words. Every description gets added to a growing, community-built portrait of that piece. Many voices, one work.
                </p>
                <Link
                  href="/make-art/image-description"
                  style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 12, fontWeight: 'bold', color: '#fff', background: '#0b5e48', padding: '4px 14px', textDecoration: 'none', border: '2px outset #3a9e78', display: 'inline-block' }}
                >
                  👁️ Open Project
                </Link>
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
                  A curated playlist of art and accessibility videos, on demand. Shuffles every visit so there is always something new.
                </p>
                <Link
                  href="/make-art/the-channel"
                  style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 12, fontWeight: 'bold', color: '#fff', background: '#7a4500', padding: '4px 14px', textDecoration: 'none', border: '2px outset #cc8844', display: 'inline-block' }}
                >
                  📺 Watch Now
                </Link>
              </div>

              {/* Coming soon */}
              <div style={{ border: '2px dashed #ccc', background: '#fafafa', padding: '10px 14px', textAlign: 'center' }}>
                <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#888', margin: 0 }}>
                  ✨ More projects are on their way. Check back soon!
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Palette bar */}
        <div role="toolbar" aria-label="Color palette" style={{ display: 'flex', background: '#c8c8c8', borderTop: '2px solid #999', padding: '3px 4px', gap: 2, flexShrink: 0, flexWrap: 'wrap' }}>
          {PALETTE.map((color) => (
            <div key={color.hex} aria-label={color.name} style={{ width: 18, height: 18, background: color.hex, border: '2px outset #fff', borderRadius: 1, cursor: 'crosshair', flexShrink: 0 }} />
          ))}
          <div style={{ flex: 1 }} aria-hidden="true" />
          <span style={{ fontSize: 10, color: '#555', alignSelf: 'center', fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>ArtisticAccessibility.com</span>
        </div>
      </div>

      {/* Taskbar */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to bottom, #2a2a3a, #1a1a28)', borderTop: '1px solid #444', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6, fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, userSelect: 'none', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 10px 2px 8px', color: 'white', fontWeight: 'bold', minWidth: 160 }}>
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
