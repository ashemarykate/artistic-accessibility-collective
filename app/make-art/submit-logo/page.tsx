'use client';

import { useEffect, useRef } from 'react';
import KidArtToolbar from '@/components/KidArtToolbar';

const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i, x: (i * 137.508) % 100, y: (i * 97.234) % 100,
  r: i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1, o: 0.5 + (i % 5) * 0.1,
}));

const PALETTE: { hex: string; name: string }[] = [
  { hex: '#000000', name: 'Black' }, { hex: '#ffffff', name: 'White' },
  { hex: '#cc0000', name: 'Red' },   { hex: '#ff4444', name: 'Light Red' },
  { hex: '#ff8800', name: 'Orange' },{ hex: '#ffcc00', name: 'Yellow' },
  { hex: '#00aa00', name: 'Green' }, { hex: '#00cc88', name: 'Teal' },
  { hex: '#0044cc', name: 'Blue' },  { hex: '#6644cc', name: 'Purple' },
  { hex: '#cc44aa', name: 'Pink' },  { hex: '#884400', name: 'Brown' },
];

const UIFONT = '"MS Sans Serif", Arial, sans-serif';
const KIDFONT = '"Comic Sans MS", "Chalkboard SE", cursive';

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #e0ddd4' }}>
      <strong style={{ flexShrink: 0, width: 92, fontFamily: KIDFONT, fontSize: 12, color: '#5a2a7a' }}>{label}</strong>
      <div style={{ fontFamily: UIFONT, fontSize: 11.5, color: '#222', lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

export default function SubmitLogoPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Submissions · Artistic Accessibility Collective';
    headingRef.current?.focus();
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  const mailto = 'mailto:hello@artisticaccessibility.com'
    + '?subject=' + encodeURIComponent('Logo submission for the rotating banner')
    + '&body=' + encodeURIComponent(
      "Hi! I'd like to submit a logo for the site's rotating banner.\n\n" +
      'Attached: [attach your SVG or PNG file here before sending]\n\n' +
      'Alt text (one sentence describing how this version looks different from the others):\n'
    );

  return (
    <div
      className="make-art-outer"
      style={{ position: 'fixed', inset: 0, background: '#0a0a1a', overflow: 'hidden', fontFamily: KIDFONT }}
      role="main"
    >
      <style>{`
        @media (max-width: 580px) {
          .make-art-outer  { position: static !important; min-height: 100dvh !important; overflow: auto !important; }
          .make-art-window { position: static !important; transform: none !important; inset: unset !important; width: 100% !important; max-height: none !important; border-radius: 0 !important; box-shadow: none !important; overflow: visible !important; }
          .make-art-body   { flex-direction: column !important; overflow: visible !important; }
          .make-art-canvas { overflow: visible !important; }
        }
        @keyframes kp-window-in { from{opacity:0;transform:translate(-50%,-50%) scale(0.85)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @media (prefers-reduced-motion: reduce) { .make-art-window { animation: none !important; } }
      `}</style>

      <h1 className="sr-only">Submissions: design our banner · Artistic Accessibility Collective</h1>

      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {STARS.map((s) => <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />)}
      </svg>

      <div
        className="make-art-window"
        style={{ position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', width: 'min(720px, calc(100vw - 16px))', maxHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 0 3px #888, 0 12px 50px rgba(0,0,0,0.8)', animation: 'kp-window-in 0.2s ease forwards' }}
      >
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(to right, #c00, #e03030, #c00)', padding: '3px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: UIFONT }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>🪧</span>
            AAC Pix Deluxe · Submissions
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {['_','□','✕'].map((c) => (
              <div key={c} aria-hidden="true" style={{ width: 16, height: 14, background: '#d44', border: '1px solid #faa', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 9, fontWeight: 'bold', cursor: 'default' }}>{c}</div>
            ))}
          </div>
        </div>

        {/* Menu bar */}
        <div style={{ background: '#c8c8c8', borderBottom: '2px solid #666', padding: '1px 4px', display: 'flex', fontFamily: UIFONT, fontSize: 11 }}>
          {['File','Edit','Goodies','Wacky','Help'].map((m) => (
            <span key={m} aria-hidden="true" style={{ padding: '2px 8px', cursor: 'default', color: '#000' }}>{m}</span>
          ))}
        </div>

        {/* Body */}
        <div className="make-art-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <KidArtToolbar active="submit-logo" />

          {/* Canvas */}
          <div className="make-art-canvas" style={{ flex: 1, background: '#f8f6f0', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Page heading */}
              <div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  style={{ fontFamily: KIDFONT, fontSize: 'clamp(17px, 3.5vw, 24px)', color: '#5a2a7a', margin: '0 0 2px', lineHeight: 1.2 }}
                >
                  🪧 Submissions
                </h2>
                <p style={{ fontFamily: UIFONT, fontSize: 11, color: '#555', margin: 0, fontStyle: 'italic' }}>
                  Every refresh, a new face. Yours could be one of them.
                </p>
              </div>

              {/* About this project */}
              <div style={{ border: '3px solid #aaa', borderStyle: 'inset', background: '#fff', padding: '9px 13px', fontSize: 11, fontFamily: UIFONT, color: '#222', lineHeight: 1.65 }}>
                Every time someone loads a page on this site, the logo at the top gets picked at random from a small set of styles, so regulars see something a little different each visit. There are six right now. Design one in your own style, send it our way, and if it fits the spec below, we&rsquo;ll add it to the rotation.
              </div>

              {/* Spec */}
              <section aria-labelledby="spec-heading">
                <h3 id="spec-heading" style={{ fontFamily: KIDFONT, fontSize: 13, color: '#333', margin: '0 0 4px', borderBottom: '2px solid #ccc', paddingBottom: 4 }}>
                  What it needs
                </h3>
                <div style={{ background: '#fff', border: '2px solid #ddd', padding: '2px 10px' }}>
                  <SpecRow label="Text">
                    Just the words <strong>Artistic Accessibility Collective</strong>. No tagline, no icon, nothing extra.
                  </SpecRow>
                  <SpecRow label="Shape">
                    Wide and short, like a bumper sticker, not a business card. The site fixes the height and scales the width to match, so it never gets cropped or stretched, but a tall or square layout will look tiny once it&rsquo;s squeezed down to that shape.
                  </SpecRow>
                  <SpecRow label="Format">
                    SVG works best since it stays crisp at every size. A PNG is fine too if it&rsquo;s at least 1200px wide.
                  </SpecRow>
                  <SpecRow label="Background">
                    Fully transparent. No background box, no background color, not even white.
                  </SpecRow>
                  <SpecRow label="Colors">
                    <p style={{ margin: '0 0 8px' }}>
                      This one needs to hold up on a dark blue background, so light, bright, or high-contrast colors work well. Steer away from navy, black, or anything dark that would blend right in. It needs at least a 3:1 contrast ratio (the WCAG minimum for large logo-style text) against both <strong>#0d1e4a</strong> and <strong>#263590</strong>, the two blues it actually sits on. Check yours with a free tool like the WebAIM Contrast Checker: enter your color as the foreground and try each of those two as the background.
                    </p>
                    <div aria-hidden="true" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ background: '#0d1e4a', padding: '10px 14px', flex: '1 1 140px' }}>
                        <span style={{ color: '#fff', fontFamily: KIDFONT, fontWeight: 'bold', fontSize: 12 }}>Artistic Accessibility</span>
                        <div style={{ color: '#8fa0c9', fontFamily: 'monospace', fontSize: 9, marginTop: 4 }}>#0d1e4a</div>
                      </div>
                      <div style={{ background: '#263590', padding: '10px 14px', flex: '1 1 140px' }}>
                        <span style={{ color: '#fff', fontFamily: KIDFONT, fontWeight: 'bold', fontSize: 12 }}>Artistic Accessibility</span>
                        <div style={{ color: '#aab4e6', fontFamily: 'monospace', fontSize: 9, marginTop: 4 }}>#263590</div>
                      </div>
                    </div>
                  </SpecRow>
                  <SpecRow label="Alt text">
                    <p style={{ margin: '0 0 8px' }}>
                      One sentence describing what makes this version look different from the others, written the way you&rsquo;d describe it to a friend who can&rsquo;t see it. This is how screen reader users get to experience the same variety everyone else does. Two real examples already in use:
                    </p>
                    <p style={{ margin: '0 0 4px', fontStyle: 'italic', color: '#444' }}>
                      &ldquo;Artistic Accessibility Collective: bold rounded white letters with a thick outline, carnival-sign style&rdquo;
                    </p>
                    <p style={{ margin: 0, fontStyle: 'italic', color: '#444' }}>
                      &ldquo;Artistic Accessibility Collective: thin spaced letters with a subtle lean and fine detail&rdquo;
                    </p>
                  </SpecRow>
                </div>
              </section>

              {/* How to send it */}
              <div style={{ border: '2px solid #5a2a7a', background: '#f4eefa', padding: '10px 14px', fontFamily: UIFONT, fontSize: 11, color: '#333', lineHeight: 1.65 }}>
                <strong style={{ color: '#5a2a7a' }}>Ready to send one over?</strong>
                <br />
                Email it to us with your file attached and your alt text written out. We&rsquo;ll take it from there.
                <div style={{ marginTop: 8 }}>
                  <a
                    href={mailto}
                    style={{ fontFamily: KIDFONT, fontWeight: 'bold', fontSize: 12, color: '#fff', background: '#5a2a7a', padding: '8px 16px', textDecoration: 'none', border: '3px solid #111', borderRadius: 6, boxShadow: '4px 4px 0 #111', display: 'inline-flex', alignItems: 'center', minHeight: 44, boxSizing: 'border-box' }}
                  >
                    🪧 Email hello@artisticaccessibility.com
                  </a>
                </div>
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
          <span style={{ fontSize: 10, color: '#555', alignSelf: 'center', fontFamily: UIFONT }}>ArtisticAccessibility.com</span>
        </div>
      </div>

      {/* Taskbar */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to bottom, #2a2a3a, #1a1a28)', borderTop: '1px solid #444', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6, fontFamily: UIFONT, fontSize: 11, userSelect: 'none', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 10px 2px 8px', color: 'white', fontWeight: 'bold', minWidth: 180 }}>
          <span style={{ fontSize: 14 }}>🪧</span>
          Submissions
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
