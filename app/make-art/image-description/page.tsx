'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import KidArtToolbar from '@/components/KidArtToolbar';
import { supabase } from '@/lib/supabase';
import WindowControls from '@/components/WindowControls';

type Piece = { id: string; title: string; medium: string; src: string | null; alt: string };

// Add new pieces here. Drop image files into /public/images/make-art/.
const PIECES: Piece[] = [
  {
    id: 'art-01',
    title: 'Photograph I',
    medium: '35mm Film',
    src: '/images/make-art/art-01.jpg',
    alt: 'A dark interior room with sheer white curtains covering a bright window. The majority of the frame is in deep shadow.',
  },
  {
    id: 'art-02',
    title: 'Photograph II',
    medium: '35mm Film',
    src: '/images/make-art/art-02.jpg',
    alt: 'Urban street scene shot on film with a vertical lens flare cutting through a blue sky above city buildings and power lines.',
  },
  {
    id: 'art-03',
    title: 'Photograph III',
    medium: '35mm Film',
    src: '/images/make-art/art-03.jpg',
    alt: 'Close-up photograph of a small flame in a shallow bowl, shot at night with warm orange light and colorful bokeh in the background.',
  },
  {
    id: 'art-04',
    title: 'Photograph IV',
    medium: '35mm Film',
    src: '/images/make-art/art-04.jpg',
    alt: 'Black and white double-exposure film photograph taken through a car windshield, layering a curved road with a street intersection.',
  },
];

type Description = { id: string; text: string; author: string; isNew?: boolean; isAutoGen?: boolean };

// Always shown alongside real submissions as a reference point, not stored in the database.
const SEEDED: Description[] = [
  {
    id: 'auto-gen',
    isAutoGen: true,
    author: 'Auto-Generated Image Description',
    text: 'Color photograph. Image is predominantly dark. Approximately 65 to 70 percent of the frame is in deep shadow. A window occupies the center of the frame. The window is covered by sheer white curtains with a gathered, ruffled valance at the top. Bright white light filters through the curtains from outside, creating a luminous rectangle within the dark interior. The curtains part slightly in the center. To the left of the main window, a door with a small glass pane is partially visible. A round door knob is present. Walls and ceiling are not visible due to shadow. The color cast in shadow areas tends toward green. Shot on color negative film. No people, animals, or text are visible in the image.',
  },
];

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

export default function ImageDescriptionPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('You');
  const [descText, setDescText] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [descriptions, setDescriptions] = useState<Description[]>([]);

  const piece = PIECES[0];

  useEffect(() => {
    document.title = 'Image Description as Art · Artistic Accessibility Collective';
    headingRef.current?.focus();

    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      setIsLoggedIn(!!uid);

      if (uid) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, full_name')
          .eq('user_id', uid)
          .maybeSingle();
        setDisplayName(profile?.display_name || profile?.full_name || 'You');
      }
    });

    supabase
      .from('item_comments')
      .select('id, body, display_name, created_at')
      .eq('item_slug', piece.id)
      .eq('item_type', 'image-description')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDescriptions((data ?? []).map((row) => ({ id: row.id, text: row.body, author: row.display_name || 'Community Member' })));
      });

    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, [piece.id]);

  useEffect(() => {
    if (submitState === 'done') {
      setTimeout(() => successRef.current?.focus(), 50);
    }
  }, [submitState]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descText.trim() || !userId) return;
    setSubmitState('submitting');

    const { data, error } = await supabase
      .from('item_comments')
      .insert({
        user_id: userId,
        display_name: displayName,
        item_slug: piece.id,
        item_type: 'image-description',
        body: descText.trim(),
      })
      .select('id, body')
      .single();

    if (error || !data) {
      setSubmitState('error');
      return;
    }

    setDescriptions(prev => [{
      id: data.id,
      text: data.body,
      author: displayName,
      isNew: true,
    }, ...prev]);
    setDescText('');
    setSubmitState('done');
  }

  return (
    <div
      className="make-art-outer"
      style={{ position: 'fixed', inset: 0, background: '#0a0a1a', overflow: 'hidden', fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive' }}
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
        .desc-block:focus-visible { outline: 3px solid #ffcc00; }
      `}</style>

      <h1 className="sr-only">Image Description as Art · Artistic Accessibility Collective</h1>

      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {STARS.map((s) => <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />)}
      </svg>

      <div
        className="make-art-window"
        style={{ position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', width: 'min(720px, calc(100vw - 16px))', maxHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 0 3px #888, 0 12px 50px rgba(0,0,0,0.8)', animation: 'kp-window-in 0.2s ease forwards' }}
      >
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(to right, #c00, #e03030, #c00)', padding: '3px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>👁️</span>
            AAC Pix Deluxe · Image Description as Art
          </div>
          <WindowControls bg="#d44" border="#faa" />
        </div>

        {/* Menu bar */}
        <div style={{ background: '#c8c8c8', borderBottom: '2px solid #666', padding: '1px 4px', display: 'flex', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11 }}>
          {['File','Edit','Goodies','Wacky','Help'].map((m) => (
            <span key={m} aria-hidden="true" style={{ padding: '2px 8px', cursor: 'default', color: '#000' }}>{m}</span>
          ))}
        </div>

        {/* Body */}
        <div className="make-art-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <KidArtToolbar active="image-description" />

          {/* Canvas */}
          <div className="make-art-canvas" style={{ flex: 1, background: '#f8f6f0', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Page heading */}
              <div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive', fontSize: 'clamp(17px, 3.5vw, 24px)', color: '#0b5e48', margin: '0 0 2px', lineHeight: 1.2 }}
                >
                  👁️ Image Description as Art
                </h2>
                <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#555', margin: 0, fontStyle: 'italic' }}>
                  Many eyes, one picture. Every perspective belongs here.
                </p>
              </div>

              {/* About this project */}
              <div style={{ border: '3px solid #aaa', borderStyle: 'inset', background: '#fff', padding: '9px 13px', fontSize: 11, fontFamily: '"MS Sans Serif", Arial, sans-serif', color: '#222', lineHeight: 1.65 }}>
                Look at the piece below. Write what you see in your own words: your perspective, your language, your way of experiencing it. There is no wrong answer. Each description gets added to a growing community portrait of the work.
              </div>

              {/* Artwork */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {piece.src ? (
                  <img
                    src={piece.src}
                    alt={piece.alt}
                    style={{ maxWidth: '100%', maxHeight: 220, border: '3px solid #888', borderStyle: 'outset', display: 'block' }}
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={piece.alt}
                    style={{ width: '100%', maxWidth: 360, height: 180, background: 'linear-gradient(135deg, #e8e4dc 25%, #d8d4cc 100%)', border: '3px outset #999', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 36, opacity: 0.4 }}>🖼️</span>
                    <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 10, color: '#888', letterSpacing: '0.06em' }}>
                      IMAGE COMING SOON
                    </span>
                  </div>
                )}
                <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 10, color: '#666', margin: 0, textAlign: 'center' }}>
                  <strong>{piece.title}</strong>
                  {piece.medium !== 'Image coming soon' && <> &nbsp;·&nbsp; {piece.medium}</>}
                </p>
              </div>

              {/* Description form or login prompt */}
              {isLoggedIn === null ? null : isLoggedIn ? (
                submitState === 'done' ? (
                  <div
                    ref={successRef}
                    role="status"
                    aria-live="polite"
                    tabIndex={-1}
                    style={{ border: '3px solid #44aa44', background: '#e8ffe8', padding: '10px 14px', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 12, color: '#004400', textAlign: 'center' }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
                    <strong>Your description has been added!</strong>
                    <br />
                    <span style={{ fontSize: 11 }}>It appears at the top of the list below.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate aria-label="Add your image description">
                    <fieldset style={{ border: '2px groove #999', padding: '9px 12px', margin: 0 }}>
                      <legend style={{ fontFamily: '"Comic Sans MS", cursive', fontWeight: 'bold', fontSize: 12, color: '#0b5e48', padding: '0 6px' }}>
                        Add Your Description
                      </legend>
                      <label htmlFor="desc-input" className="sr-only">
                        Describe this artwork in your own words
                      </label>
                      <textarea
                        id="desc-input"
                        rows={4}
                        value={descText}
                        onChange={(e) => setDescText(e.target.value)}
                        required
                        placeholder="What do you see? Write in your own words: your perspective, your language, your experience of it."
                        style={{ width: '100%', padding: '4px 6px', fontSize: 11, border: '2px inset #aaa', fontFamily: '"MS Sans Serif", Arial, sans-serif', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8, lineHeight: 1.6 }}
                        aria-required="true"
                      />
                      {submitState === 'error' && (
                        <p role="alert" style={{ color: '#cc0000', fontSize: 11, margin: '0 0 6px', fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
                          Something went wrong. Please try again.
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={submitState === 'submitting' || !descText.trim()}
                        style={{ fontFamily: '"Comic Sans MS", cursive', fontWeight: 'bold', fontSize: 12, color: '#fff', background: submitState === 'submitting' ? '#999' : '#0b5e48', padding: '4px 16px', border: '2px outset #3a9e78', cursor: submitState === 'submitting' ? 'not-allowed' : 'pointer' }}
                        aria-disabled={submitState === 'submitting' || !descText.trim()}
                      >
                        {submitState === 'submitting' ? 'Adding...' : '👁️ Add My Description'}
                      </button>
                    </fieldset>
                  </form>
                )
              ) : (
                <div style={{ border: '2px solid #c85a20', background: '#fff8f0', padding: '10px 14px', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#333', lineHeight: 1.65 }}>
                  <strong style={{ color: '#c85a20' }}>Want to add your description?</strong>
                  <br />
                  You need a free Access Card to participate. It takes about two minutes to set up.
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <Link href="/access-card/signup" style={{ fontFamily: '"Comic Sans MS", cursive', fontWeight: 'bold', fontSize: 11, color: '#fff', background: '#c85a20', padding: '3px 12px', textDecoration: 'none', border: '2px outset #e88050', display: 'inline-block' }}>
                      Create an Access Card
                    </Link>
                    <Link href="/login" style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#333', padding: '3px 10px', textDecoration: 'none', border: '2px outset #bbb', background: '#ddd', display: 'inline-block' }}>
                      Log In
                    </Link>
                  </div>
                </div>
              )}

              {/* Community descriptions wall */}
              {(() => {
                const allDescriptions = [...descriptions, ...SEEDED];
                return (
                <section aria-labelledby="descriptions-heading">
                  <h3
                    id="descriptions-heading"
                    style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 13, color: '#333', margin: '0 0 8px', borderBottom: '2px solid #ccc', paddingBottom: 4 }}
                  >
                    What the community sees
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allDescriptions.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          border: d.isNew ? '2px solid #0b5e48' : d.isAutoGen ? '2px dashed #7a8a9a' : '2px solid #ddd',
                          borderStyle: d.isNew ? 'solid' : d.isAutoGen ? 'dashed' : 'inset',
                          background: d.isNew ? '#f0faf6' : d.isAutoGen ? '#f0f4f8' : '#fafafa',
                          padding: '8px 11px',
                          fontFamily: d.isAutoGen ? '"Courier New", Courier, monospace' : '"MS Sans Serif", Arial, sans-serif',
                          fontSize: 11,
                          color: d.isAutoGen ? '#334' : '#222',
                          lineHeight: 1.75,
                        }}
                      >
                        <p style={{ margin: '0 0 4px' }}>{d.text}</p>
                        <span style={{ fontSize: 10, color: '#888' }}>
                          {d.isAutoGen ? '🤖 ' : ''}{d.author}
                        </span>
                        {d.isNew && <span style={{ fontSize: 9, color: '#0b5e48', fontWeight: 'bold', marginLeft: 6 }}>NEW</span>}
                      </div>
                    ))}
                  </div>
                </section>
                );
              })()}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 10px 2px 8px', color: 'white', fontWeight: 'bold', minWidth: 180 }}>
          <span style={{ fontSize: 14 }}>👁️</span>
          Image Description as Art
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
