'use client';

import { useState, useEffect, useRef } from 'react';
import WindowControls from '@/components/WindowControls';

interface YTPlayerEvent {
  target: {
    setShuffle: (shuffle: boolean) => void;
    playVideoAt: (index: number) => void;
    cuePlaylist: (playlist: string, index: number) => void;
  };
}

interface YTPlayer {
  destroy?: () => void;
  setShuffle: (shuffle: boolean) => void;
  playVideoAt: (index: number) => void;
  cuePlaylist: (playlist: string, index: number) => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLDivElement,
    options: {
      playerVars: Record<string, unknown>;
      events: { onReady: (event: YTPlayerEvent) => void };
    }
  ) => YTPlayer;
}

declare global {
  interface Window { YT: YTNamespace; onYouTubeIframeAPIReady?: () => void; }
}

const PLAYLIST_ID  = 'PLhDUBYZHjb_gGDRDJeH1FDv_oON64K7tk';
const PLAYLIST_URL = 'https://youtube.com/playlist?list=PLhDUBYZHjb_gGDRDJeH1FDv_oON64K7tk';

const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x:  (i * 137.508) % 100,
  y:  (i * 97.234)  % 100,
  r:  i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1,
  o:  0.5 + (i % 5) * 0.1,
}));

const TOOLBAR_ITEMS = [
  { href: '/',                           emoji: '🏠', label: 'Back to Home',    bg: '#263590', activeBg: '#1a2568', id: 'home'         },
  { href: '/learning-hub',               emoji: '📚', label: 'Learning Hub',    bg: '#006633', activeBg: '#004422', id: 'learning-hub' },
  { href: '/learning-hub/the-channel',   emoji: '📺', label: 'The Channel',     bg: '#7a4500', activeBg: '#4a2a00', id: 'the-channel'  },
];

export default function TheChannelLearningPage() {
  const [booting, setBooting]   = useState(true);
  const [bootText, setBootText] = useState('Tuning in to AAC The Channel');
  const [ready, setReady]       = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const headingRef    = useRef<HTMLHeadingElement>(null);
  const playerRef     = useRef<YTPlayer | null>(null);
  const playerDivRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {

    let dots = 0;
    const dotInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      setBootText('Tuning in to AAC The Channel' + '.'.repeat(dots));
    }, 350);
    const bootTimer = setTimeout(() => {
      clearInterval(dotInterval);
      setBooting(false);
      setTimeout(() => headingRef.current?.focus(), 250);
    }, 1800);
    return () => {
      clearInterval(dotInterval);
      clearTimeout(bootTimer);
    };
  }, []);

  useEffect(() => {
    let dead = false;

    const init = () => {
      if (dead || !playerDivRef.current) return;
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        playerVars: { list: PLAYLIST_ID, listType: 'playlist', modestbranding: 1, rel: 0 },
        events: {
          onReady: (e: YTPlayerEvent) => {
            if (dead) return;
            e.target.setShuffle(true);
            // Cue rather than play: audio should never start without the
            // visitor choosing to (WCAG 1.4.2). Pressing play or Shuffle starts it.
            e.target.cuePlaylist(PLAYLIST_ID, Math.floor(Math.random() * 15));
            setReady(true);
          },
        },
      });
    };

    const loadTimer = setTimeout(() => {
      if (!dead && !playerRef.current) setLoadFailed(true);
    }, 7000);

    if (window.YT?.Player) {
      init();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script');
        s.id  = 'yt-iframe-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
      window.onYouTubeIframeAPIReady = init;
    }

    return () => {
      dead = true;
      clearTimeout(loadTimer);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  const shuffle = () => {
    if (!playerRef.current || !ready) return;
    playerRef.current.setShuffle(true);
    playerRef.current.playVideoAt(Math.floor(Math.random() * 15));
  };

  return (
    <div
      className="ch-outer"
      style={{ position: 'fixed', inset: 0, background: '#0a0a1a', overflow: 'hidden', fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive' }}
      role="main"
    >
      <style>{`
        @media (max-width: 580px) {
          .ch-outer   { position: static !important; min-height: 100dvh !important; overflow: auto !important; }
          .ch-window  { position: static !important; transform: none !important; inset: unset !important; width: 100% !important; max-height: none !important; border-radius: 0 !important; box-shadow: none !important; overflow: visible !important; }
          .ch-body    { flex-direction: column !important; overflow: visible !important; }
          .ch-toolbar { flex-direction: row !important; flex-wrap: wrap !important; border-right: none !important; border-bottom: 3px solid #888 !important; padding: 3px 4px !important; gap: 3px !important; }
          .ch-canvas  { overflow: visible !important; }
        }
        @keyframes ch-boot-fade  { 0%,80%{opacity:1}100%{opacity:0} }
        @keyframes ch-window-in  { from{opacity:0;transform:translate(-50%,-50%) scale(0.85)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @media (prefers-reduced-motion: reduce) {
          .ch-window { animation: none !important; }
          .ch-boot   { animation: none !important; display: none !important; }
        }
      `}</style>

      <h1 className="sr-only">The Channel · Learning Hub · Artistic Accessibility Collective</h1>

      {/* Boot splash */}
      {booting && (
        <div className="ch-boot" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, animation: 'ch-boot-fade 1.8s ease forwards', pointerEvents: 'none' }}>
          <span style={{ fontSize: 52 }}>📺</span>
          <div style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 13, color: '#ccc', letterSpacing: '0.05em', minWidth: 260, textAlign: 'center' }}>{bootText}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {['#441100','#7a3300','#b35500','#cc7700','#ee9900'].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, background: c, border: '1px solid rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      )}

      {/* Starfield */}
      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {STARS.map((s) => <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />)}
      </svg>

      {/* App window */}
      <div
        className="ch-window"
        style={{ position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', width: 'min(900px, calc(100vw - 16px))', maxHeight: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 0 3px #886644, 0 12px 50px rgba(0,0,0,0.85)', animation: booting ? 'none' : 'ch-window-in 0.2s ease forwards', opacity: booting ? 0 : undefined }}
      >
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(to right, #7a4500, #b36000, #7a4500)', padding: '3px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 'bold', fontSize: 12, fontFamily: '"MS Sans Serif", Arial, sans-serif' }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>📺</span>
            AAC The Channel · Learning Hub
          </div>
          <WindowControls bg="#7a4500" border="#cc8844" />
        </div>

        {/* Menu bar */}
        <div style={{ background: '#c8c8c8', borderBottom: '2px solid #666', padding: '1px 4px', display: 'flex', gap: 0, fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11 }}>
          {['Signal','Channel','Tune','Schedule','Help'].map((m) => (
            <span key={m} aria-hidden="true" style={{ padding: '2px 8px', cursor: 'default', color: '#000' }}>{m}</span>
          ))}
        </div>

        {/* Body: toolbar + canvas */}
        <div className="ch-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Toolbar */}
          <div role="toolbar" aria-label="Navigation" className="ch-toolbar" style={{ background: '#d8d8d0', borderRight: '3px solid #888', display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 3px', flexShrink: 0 }}>
            {TOOLBAR_ITEMS.map((item) => {
              const isActive = item.id === 'the-channel';
              return (
                <a
                  key={item.id}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  style={{ width: 34, height: 34, background: isActive ? item.activeBg : item.bg, border: isActive ? '2px inset #444' : '2px outset #eee', borderRadius: 3, fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}
                >
                  {item.emoji}
                </a>
              );
            })}
          </div>

          {/* Canvas */}
          <div className="ch-canvas" style={{ flex: 1, background: '#111010', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Heading */}
              <div style={{ textAlign: 'center' }}>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive', fontSize: 'clamp(18px, 3.5vw, 26px)', margin: '0 0 3px', color: '#cc7700', lineHeight: 1.2 }}
                >
                  The Channel
                </h2>
                <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#888', margin: 0 }}>
                  Arts accessibility, on demand. Videos shuffle so every visit starts somewhere new.
                </p>
              </div>

              {/* Video player */}
              <div
                style={{ border: '5px solid #333', borderStyle: 'outset', boxShadow: '0 0 20px rgba(180,100,0,0.25), inset 0 0 8px rgba(0,0,0,0.6)', background: '#000', flexShrink: 0 }}
                aria-label="Video player"
              >
                <div
                  ref={playerDivRef}
                  style={{ width: '100%', aspectRatio: '16/9', display: 'block', background: '#000' }}
                />
              </div>

              {loadFailed && !ready && (
                <p role="alert" style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#ffcc66', margin: 0 }}>
                  Having trouble loading the video? Try refreshing the page.
                </p>
              )}

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={shuffle}
                  style={{ fontFamily: '"Comic Sans MS", cursive', fontWeight: 'bold', fontSize: 13, color: '#fff', background: '#7a4500', padding: '5px 18px', border: '3px outset #cc8844', cursor: 'pointer', flexShrink: 0 }}
                >
                  📺 Shuffle
                </button>
                <a
                  href={PLAYLIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#cc9944', textDecoration: 'underline' }}
                >
                  Browse the full playlist on YouTube
                </a>
              </div>

            </div>
          </div>
        </div>

        {/* Status bar */}
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a1610', borderTop: '2px solid #444', padding: '3px 8px', flexShrink: 0 }}>
          <span style={{ background: '#cc4400', color: '#fff', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 9, fontWeight: 'bold', padding: '1px 6px', letterSpacing: '0.1em' }}>
            ON AIR
          </span>
          <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 10, color: '#887755' }}>
            Arts Accessibility · The Channel · Learning Hub
          </span>
        </div>
      </div>

      {/* Taskbar */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to bottom, #2a2a3a, #1a1a28)', borderTop: '1px solid #444', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6, fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, userSelect: 'none', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 10px 2px 8px', color: 'white', fontWeight: 'bold', minWidth: 140 }}>
          <span style={{ fontSize: 14 }}>📺</span>
          The Channel
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace' }}>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
