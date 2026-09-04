'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, type ProductionWithDates } from '@/lib/supabase';
import { fetchPublishedProductions, formatDateShort, isExternalHref, isPast, micrositeHref, nextDate, sortByNextDate } from '@/lib/productions';
import { PROJECTS_FOLDER_ICON, resolveProjectIcon } from '@/lib/project-icons';
import Logo from '@/components/Logo';

// ── constants ─────────────────────────────────────────────────────────────────

const RAISED = 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf';
const SUNKEN = 'inset 1px 1px 0 #0a0a0a, inset -1px -1px 0 #fff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf';
const FIELD  = 'inset 1px 1px 0 #808080, inset -1px -1px 0 #fff';
const PRIMARY_RING = ', 0 0 0 1px #0a0a0a';
const SILVER = '#c3c3c3';
const UIFONT = '"Tahoma","MS Sans Serif",Arial,sans-serif';

const IMG = (n: string | number) => `/images/desktop-icons/icon-${n}.png`;

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 137.508) % 100,
  y: (i * 71.234) % 100,
  r: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.4,
  o: 0.25 + (i % 6) * 0.1,
}));

const BETA_MSG = `✶  This site is currently in BETA. We’d love your feedback while it’s still developing. Thanks for helping us build it!`;

// ── types ─────────────────────────────────────────────────────────────────────

// 'projects' is the pink Current Projects & Events folder. Unlike the others it
// has no fixed contents: it reads the published productions at open time, so a
// project published in Admin appears here with no code change.
type WinKind = 'app' | 'aim' | 'explorer' | 'folder' | 'projects';

interface ItemDef {
  label: string;
  icon: string | number;
  kind: WinKind | 'ext';
  cat?: string;
  href?: string;
  blurb?: string;
  soon?: boolean;
  /** Adds a tinted aura on the desktop, on top of the white halo every icon
   *  already gets. For the one or two items worth drawing the eye to. */
  glow?: boolean;
  links?: Array<{ key: string; label: string; icon: string | number; ext?: boolean }>;
}

interface WinState {
  id: string;
  key: string;
  kind: WinKind;
  pos: { x: number; y: number };
  z: number;
}

// Phone-sized windows on mobile stay as designed; desktop gets real window widths.
// The Buddy List stays narrow on both: real AIM buddy lists were skinny.
const winWidth = (kind: WinKind, mobile: boolean) => mobile
  ? (kind === 'aim' ? 268 : kind === 'explorer' || kind === 'projects' ? 286 : kind === 'folder' ? 300 : 308)
  : (kind === 'aim' ? 280 : kind === 'explorer' ? 430 : kind === 'projects' ? 460 : kind === 'folder' ? 400 : 440);

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type FxRect = { x: number; y: number; w: number; h: number };
const toFxRect = (r: DOMRect): FxRect => ({ x: r.left, y: r.top, w: r.width, h: r.height });

// ── content model ─────────────────────────────────────────────────────────────

const ITEMS: Record<string, ItemDef> = {
  'about':            { label: 'About Us',               icon: 'about-blue', kind: 'app',      cat: 'Artistic Accessibility', href: '/about',           blurb: 'Meet the people behind Artistic Accessibility, artists and advocates making creativity open to everyone.' },
  'all-folders':      { label: 'All Folders',            icon: 'folders', kind: 'folder' },
  'make-art':         { label: 'Make Art',               icon: 70,        kind: 'app',      cat: 'Play',          href: '/make-art',        blurb: 'Step into the studio. Paint, draw and experiment with our accessible online art tools.' },
  'calendar':         { label: 'Calendar',               icon: 'cal',     kind: 'app',      cat: 'Resources',     href: '/calendar',        blurb: 'Every accessible arts event we know about, pulled in from partners around the world.' },
  // No href on purpose: this one opens a folder, it does not navigate. The
  // overview page is the first row inside ProjectsBody. Adding an href back
  // here, or adding 'projects' to DIRECT_NAV, would skip the folder entirely.
  // Short label on purpose: it is a folder, and a folder gets a folder-sized
  // name. The section keeps its full "Current Projects & Events" title on the
  // /projects page banner, where there is room for it.
  'projects':         { label: 'Projects',               icon: 'projects', kind: 'projects', cat: 'Productions', glow: true, blurb: 'Shows, workshops and projects we are making ourselves, with access built in from the start.' },
  'connect':          { label: 'Log In',                 icon: 'aim',     kind: 'aim' },
  'resources':        { label: 'Resources',              icon: 48,        kind: 'explorer', href: '/resources' },
  'learning':         { label: 'Learning Hub',           icon: 80,        kind: 'app',      cat: 'More to Come',  href: '/learning-hub',    blurb: 'Guided lessons and tutorials at your own pace.' },
  'faq':              { label: 'FAQs',                   icon: 'faq',     kind: 'app',      cat: 'Resources',     href: '/help',            blurb: 'Frequently asked questions and answers, plus how to reach our support team.' },
  'hire':             { label: 'Work With Us',            icon: 62,        kind: 'app',      cat: 'Connect',       href: '/work-with-us',         blurb: 'Book us for workshops, talks and commissioned work.' },
  'join':             { label: 'Join the Collective',    icon: 50,        kind: 'app',      cat: 'Connect',       href: '/submit',          blurb: 'Become a member and join a welcoming creative community.' },
  'instagram':        { label: 'Instagram',              icon: 51,        kind: 'ext',      href: 'https://instagram.com/artisticaccessibility' },
  'collective':       { label: 'The Collective',         icon: 63,        kind: 'app',      cat: 'Members',       href: '/collective',      blurb: 'Member homepages, shared studios and the collective gallery.' },
  'contact':          { label: 'Contact Us',             icon: 64,        kind: 'app',      cat: 'Connect',       href: '/contact',         blurb: 'Drop us a line, we would love to hear from you.', links: [{ key: 'instagram', label: 'Instagram', icon: 51, ext: true }] },
  'access-resources': { label: 'Accessibility Resources', icon: 71,       kind: 'app',      cat: 'Resources',     href: '/resources',       blurb: 'Tools, guides and links to help make art accessible for every body and mind.' },
  'library':          { label: 'The Library',            icon: 82,        kind: 'app',      cat: 'Resources',     href: '/library',         blurb: 'Browse our growing collection of accessible reading and reference material.' },
  'cinema':           { label: 'The Cinema',             icon: 56,        kind: 'app',      cat: 'Resources',     href: '/cinema',          blurb: 'Watch films, recorded talks and described screenings on demand.' },
  'printer':          { label: 'The Printer',            icon: 'printer', kind: 'app',      cat: 'Resources',     href: '/printer',         blurb: 'A shared print room: checklists, posters, worksheets and guides, ready to print and pass around.' },
  'access-card':      { label: 'Get an Access Card',     icon: 52,        kind: 'app',      cat: 'Connect',       href: '/access-card',     blurb: 'A free account to save, like and comment on resources and listings.' },
  'my-access-card':   { label: 'My Access Card',         icon: 52,        kind: 'app',      cat: 'Members',       href: '/access-card',     blurb: 'Your Access Card: saved resources, likes and comments.' },
};

const DESKTOP = ['about', 'all-folders', 'projects', 'make-art', 'calendar', 'resources', 'learning', 'contact', 'collective'];


const TREE: Array<{ type: 'leaf'; key: string } | { type: 'folder'; name: string; children: string[] }> = [
  { type: 'leaf',   key: 'about' },
  { type: 'folder', name: 'PRODUCTIONS',   children: ['projects'] },
  { type: 'folder', name: 'PLAY',          children: ['make-art'] },
  { type: 'folder', name: 'MORE TO COME',  children: ['learning'] },
  { type: 'folder', name: 'RESOURCES',     children: ['access-resources', 'library', 'cinema', 'printer', 'calendar'] },
  { type: 'folder', name: 'CONNECT',       children: ['access-card', 'hire', 'contact', 'instagram'] },
  { type: 'folder', name: 'MEMBERS',       children: ['collective', 'my-access-card'] },
];

// ── sub-components ────────────────────────────────────────────────────────────

function Ico({ n, size }: { n: string | number; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={IMG(n)} alt="" aria-hidden="true" width={size} height={size}
      style={{ display: 'block', objectFit: 'contain' }} draggable={false} />
  );
}

// Deterministic per-icon hash so the giant icons read as hand-slapped
// stickers of mismatched size, tilt and placement, not a uniformly
// scaled-up UI. Same key always gets the same values (stable across renders).
function hash(seed: string, salt: string): number {
  let h = 0;
  const s = seed + salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  return h;
}
function iconTilt(k: string): number { return (hash(k, 'tilt') % 23) - 11; }        // -11..11deg
function iconScale(k: string): number { return 130 + (hash(k, 'scale') % 61); }     // 130..190px
// Kept within +-8px so two neighbours can converge at most 16px, always less
// than the 20px container gap: adjacent hit areas can never overlap.
function iconJitterX(k: string): number { return (hash(k, 'jx') % 17) - 8; }        // -8..8px
function iconJitterY(k: string): number { return (hash(k, 'jy') % 17) - 8; }        // -8..8px

function DeskIcon({ k, onOpen, selected, onSelect, isMobile }: {
  k: string;
  onOpen: (key: string) => void;
  selected: boolean;
  onSelect: (key: string) => void;
  isMobile: boolean;
}) {
  const it = ITEMS[k];
  // Sticker treatment: oversized + mismatched on desktop; mobile keeps its
  // compact uniform grid but shares the tilt and sticker shadow, gentler.
  const size = isMobile ? 64 : iconScale(k);
  const tilt = isMobile ? Math.round(iconTilt(k) * 0.45) : iconTilt(k);
  const shadowOff = Math.round(size / 176 * 7);
  return (
    <button
      onClick={() => { onSelect(k); onOpen(k); }}
      onFocus={() => onSelect(k)}
      className="dsk-icon"
      aria-label={it.kind === 'ext' ? `${it.label} (opens in new tab)` : it.label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        width: isMobile ? 116 : Math.max(150, size + 22), padding: isMobile ? '10px 6px 8px' : '12px 8px 10px',
        background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, WebkitTapHighlightColor: 'transparent',
        // Jitter rides on custom props (not inline transform) so the global
        // button :active press-down rule still wins on click.
        ...(isMobile ? {} : { ['--jx' as string]: `${iconJitterX(k)}px`, ['--jy' as string]: `${iconJitterY(k)}px` }),
      }}
    >
      <span
        className="dsk-icon-img-wrap"
        style={{
          // --tilt drives the resting angle; hover/focus straightens it (see stylesheet).
          ['--tilt' as string]: `${tilt}deg`,
          // Layer order matters: the aura goes on first so the white halo and
          // the hard sticker shadow still sit crisply on top of it, rather than
          // the glow washing them out. Cyan to pick up the disc's sheen.
          filter: [
            it.glow
              ? (isMobile
                  ? 'drop-shadow(0 0 5px rgba(150,255,255,.9)) drop-shadow(0 0 11px rgba(60,210,255,.55))'
                  : 'drop-shadow(0 0 7px rgba(150,255,255,.95)) drop-shadow(0 0 17px rgba(60,210,255,.6))')
              : null,
            isMobile
              ? 'drop-shadow(0 0 3px rgba(255,255,255,.7)) drop-shadow(3px 4px 0 rgba(0,0,0,.5))'
              : `drop-shadow(0 0 4px rgba(255,255,255,.85)) drop-shadow(${shadowOff}px ${shadowOff + 2}px 0 rgba(0,0,0,.55))`,
          ].filter(Boolean).join(' '),
          display: 'inline-block',
        }}
      >
        <Ico n={it.icon} size={size} />
      </span>
      <span className={'dsk-label' + (selected ? ' sel' : '')}>{it.label}</span>
    </button>
  );
}

function WinClose({ onClose, label, red }: { onClose: () => void; label: string; red?: boolean }) {
  return (
    <button onClick={onClose} aria-label={label} className="win-close"
      style={red
        ? { background: '#c0392b', border: '1px solid #8e1a11', borderRadius: 3, width: 26, height: 22, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }
        : { width: 28, height: 24, background: SILVER, boxShadow: RAISED, border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 14, color: '#0a0a0a', fontFamily: UIFONT, paddingBottom: 2, flexShrink: 0 }}>
      ✕
    </button>
  );
}

function Placeholder({ label, wide }: { label: string; wide?: boolean }) {
  return (
    <div style={{ boxShadow: FIELD, background: '#fff', padding: 3 }} aria-hidden="true">
      <div style={{ height: wide ? 130 : 90, background: 'repeating-linear-gradient(45deg,#e9e9e9 0 8px,#f6f6f6 8px 16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#595959', letterSpacing: 1 }}>{label}</span>
      </div>
    </div>
  );
}

function Btn({ children, onClick, primary, pressed }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; pressed?: boolean }) {
  const [p, setP] = useState(false);
  const sunken = pressed || p;
  return (
    <button onClick={onClick}
      onPointerDown={() => setP(true)}
      onPointerUp={() => setP(false)}
      onPointerLeave={() => setP(false)}
      style={{ minWidth: 74, minHeight: 44, background: SILVER, boxShadow: (sunken ? SUNKEN : RAISED) + (primary ? PRIMARY_RING : ''), border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 12.5, color: '#0a0a0a', padding: sunken ? '2px 11px 0 13px' : '0 12px' }}>
      {children}
    </button>
  );
}

function Row({ icon, label, onClick, indent = 0, external, href, sub, hardLink }: {
  icon: string | number;
  label: string;
  onClick?: () => void;
  indent?: number;
  external?: boolean;
  href?: string;
  /** Quieter second line under the label, for a date or a note. Part of the
   *  same link, so it is read as one thing rather than a stray fragment. */
  sub?: string;
  /** Use a plain <a> instead of next/link. Needed for a production microsite:
   *  /2006 is static files served through a rewrite, not a React route, so
   *  next/link would try for an RSC payload and fall back to a hard navigation
   *  in front of the visitor. See isExternalHref in lib/productions.ts. */
  hardLink?: boolean;
}) {
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '6px 10px', paddingLeft: 10 + indent * 18, fontFamily: UIFONT, fontSize: 13, color: '#101010', borderBottom: '1px solid #f0ede8', boxSizing: 'border-box' };
  const inner = (
    <>
      <span aria-hidden="true" style={{ width: 22, height: 22, flexShrink: 0 }}><Ico n={icon} size={22} /></span>
      {sub ? (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span>{label}</span>
          <span className="win-row-sub" style={{ fontSize: 11, color: '#5a5a5a' }}>{sub}</span>
        </span>
      ) : (
        <span>{label}</span>
      )}
      {external && <span className="sr-only"> (opens in new tab)</span>}
    </>
  );
  if (href && hardLink) {
    return (
      <a
        href={href}
        className="win-row"
        style={{ ...rowStyle, textDecoration: 'none' }}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }
  if (href) return <Link href={href} className="win-row" style={{ ...rowStyle, textDecoration: 'none' }}>{inner}</Link>;
  return <button onClick={onClick} className="win-row" style={rowStyle}>{inner}</button>;
}

function AppBody({ k, onOpen, onClose, wide }: { k: string; onOpen: (key: string) => void; onClose?: () => void; wide?: boolean }) {
  const it = ITEMS[k];
  const pad = wide ? 16 : 12;
  const btnLink: React.CSSProperties = { minWidth: 74, minHeight: 44, background: SILVER, boxShadow: RAISED + PRIMARY_RING, border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 12.5, color: '#0a0a0a', padding: '0 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' };

  if (k === 'about') {
    return (
      <div style={{ padding: pad }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Welcome to ArtisticAccessibility.com! This is a community project filled with resources for those working and playing where the arts and accessibility overlap.
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          {"If you're here to play, search for something new to watch or read, or just explore, we suggest just clicking around!"}
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          {'If you\'re here looking for professional help with advising, staffing, accessibility designing, captioning, producing, or anything that it seems like we might know something about, click "Work With Us" below for more information.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={() => onOpen('all-folders')}>All Folders</Btn>
          <Link href="/work-with-us" style={btnLink}>Work With Us</Link>
        </div>
      </div>
    );
  }

  if (k === 'access-card') {
    return (
      <div style={{ padding: pad }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Your Access Card is a free account for the arts accessibility community. Use it to save, like, and comment on the resources and listings you find here.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          It is a lighter way to be part of the Collective. You do not have to be listed in the directory yourself.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Link href="/login" style={btnLink}>I Already Have One</Link>
          <Link href="/access-card/signup" style={btnLink}>Get Your Card</Link>
        </div>
      </div>
    );
  }

  if (k === 'my-access-card') {
    return (
      <div style={{ padding: pad }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Sign in to see your Access Card: your saved resources, likes and comments all live there.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          {"Don't have one yet? It's free, and no invite code is needed."}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/access-card/signup" style={btnLink}>Get an Access Card</Link>
          <Link href="/login" style={btnLink}>Sign In</Link>
        </div>
      </div>
    );
  }

  if (k === 'join') {
    return (
      <div style={{ padding: pad }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          Have an invite code for the Collective? Click below and we&apos;ll get you set up!
        </p>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#101010', lineHeight: '18px' }}>
          {"No code? An Access Card is a free account for saving, liking, and commenting, no invite needed."}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/access-card/signup" style={btnLink}>Get an Access Card</Link>
          <Link href="/submit" style={btnLink}>I Have a Code</Link>
        </div>
      </div>
    );
  }

  if (k === 'contact') {
    return (
      <div>
        <div style={{ background: '#fff' }}>
          <Row icon={51} label="Instagram" external onClick={() => window.open(ITEMS.instagram.href, '_blank', 'noopener')} />
          <Row icon={64} label="Send Message" href="/contact" />
          <Row icon={62} label="Work With Us" href="/work-with-us" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 12px', background: SILVER }}>
          <Btn onClick={onClose}>Close</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: pad }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
        <span aria-hidden="true" style={{ flexShrink: 0 }}><Ico n={it.icon} size={52} /></span>
        <div>
          {it.cat && <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 3 }}>{it.cat}</div>}
          <p style={{ margin: 0, fontSize: 13.5, color: '#101010', lineHeight: '19px' }}>{it.blurb}</p>
          {it.soon && <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#595959', fontStyle: 'italic' }}>This page is coming soon, not open yet.</p>}
        </div>
      </div>
      <Placeholder label={it.soon ? 'coming soon' : `${k} page`} wide={wide} />
      {it.links && (
        <div style={{ marginTop: 12, boxShadow: FIELD, background: '#fff' }}>
          {it.links.map(l => (
            <Row key={l.key} icon={l.icon} label={l.label} external={l.ext}
              onClick={() => l.ext ? window.open(ITEMS[l.key]?.href, '_blank', 'noopener') : onOpen(l.key)} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
        <Btn onClick={() => onOpen('all-folders')}>All Folders</Btn>
        {it.href && !it.soon ? (
          <Link href={it.href}
            style={{ minWidth: 74, minHeight: 44, background: SILVER, boxShadow: RAISED + PRIMARY_RING, border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 12.5, color: '#0a0a0a', padding: '0 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            OK
          </Link>
        ) : (
          <Btn primary onClick={onClose}>OK</Btn>
        )}
      </div>
    </div>
  );
}

function FolderBody({ onOpen, wide }: { onOpen: (key: string) => void; wide?: boolean }) {
  return (
    <div style={{ padding: 8 }}>
      <div style={{ boxShadow: FIELD, background: '#fff', maxHeight: wide ? 440 : 340, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px 6px' }}>
          <span aria-hidden="true" style={{ width: 24, height: 24 }}><Ico n={56} size={24} /></span>
          <span style={{ fontFamily: UIFONT, fontSize: 14, fontWeight: 700, color: '#101010' }}>Artistic Accessibility</span>
        </div>
        {TREE.map((node, i) => node.type === 'leaf'
          ? <Row key={i} icon={ITEMS[node.key].icon} label={ITEMS[node.key].label} indent={1} onClick={() => onOpen(node.key)} />
          : (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', paddingLeft: 28 }}>
                <span aria-hidden="true" style={{ width: 22, height: 22 }}><Ico n={48} size={22} /></span>
                <span style={{ fontFamily: UIFONT, fontSize: 12, color: '#333', textTransform: 'uppercase', letterSpacing: .5 }}>{node.name}</span>
              </div>
              {node.children.map(c => <Row key={c} icon={ITEMS[c].icon} label={ITEMS[c].label} indent={2} onClick={() => onOpen(c)} />)}
            </div>
          ))}
      </div>
    </div>
  );
}

function GroupHdr({ children }: { children: React.ReactNode }) {
  return (
    <div role="heading" aria-level={2} style={{ background: 'linear-gradient(to bottom,#eae7df,#d8d4cc)', borderTop: '1px solid #c8c4bc', borderBottom: '1px solid #c8c4bc', padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#1a4fbb', letterSpacing: '.04em' }}>
      <span aria-hidden="true">▶ </span>{children}
    </div>
  );
}

function AimBody({ onOpen, account, onSignOut, onNavigate, signOutError }: {
  onOpen: (key: string) => void;
  account: 'out' | 'collective' | 'access_card';
  onSignOut: () => void;
  onNavigate: (href: string) => void;
  signOutError?: string | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [justSignedOut, setJustSignedOut] = useState(false);
  // Notice the moment the account flips to signed out, during render.
  const [seenAccount, setSeenAccount] = useState(account);
  const signedOutNow = seenAccount !== 'out' && account === 'out';
  if (seenAccount !== account) {
    setSeenAccount(account);
    if (signedOutNow) setJustSignedOut(true);
  }

  useEffect(() => {
    if (justSignedOut) wrapRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [justSignedOut]);

  return (
    <div ref={wrapRef} style={{ background: '#fff' }}>
      <GroupHdr>CONNECT</GroupHdr>
      <Row icon={52} label="Get an Access Card"  onClick={() => onOpen('access-card')} />
      <Row icon={50} label="Join the Collective" onClick={() => onOpen('join')} />
      <GroupHdr>MY ACCOUNT</GroupHdr>
      {account === 'access_card' ? (<>
        <Row icon={52} label="My Access Card"     onClick={() => onNavigate('/access-card')} />
        <Row icon={50} label="Sign Out"           onClick={onSignOut} />
      </>) : account === 'collective' ? (<>
        <Row icon={63} label="The Collective"     onClick={() => onNavigate('/dashboard')} />
        <Row icon={50} label="Sign Out"           onClick={onSignOut} />
      </>) : (<>
        <Row icon={46} label="Log In to The Collective"   onClick={() => onNavigate('/login')} />
        <Row icon={52} label="Log In to Your Access Card" onClick={() => onNavigate('/login')} />
      </>)}
      {justSignedOut && <div role="status" className="sr-only">You&apos;re signed out.</div>}
      {signOutError && (
        <div role="alert" style={{ padding: '8px 10px', fontSize: 12, color: '#8e1a11', background: '#fdeceb', borderTop: '1px solid #c8c4bc' }}>
          {signOutError}
        </div>
      )}
      <div aria-hidden="true" style={{ background: '#ece9d8', borderTop: '1px solid #c8c4bc', padding: '4px 8px', fontSize: 10, color: '#666', textAlign: 'center', fontFamily: UIFONT }}>
        artisticaccessibility.com
      </div>
    </div>
  );
}

function ExplorerBody({ onOpen }: { onOpen: (key: string) => void }) {
  return (
    <div>
      <div aria-hidden="true" style={{ background: '#ece9d8', borderBottom: '1px solid #c8c4bc', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: UIFONT }}>
        <span style={{ color: '#555' }}>Address</span>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #7a7a7a', padding: '2px 5px', fontSize: 11, color: '#000' }}>
          C:\Artistic Accessibility\Resources\
        </div>
      </div>
      <div style={{ background: '#fff' }}>
        <Row icon={48} label="Resources"   href="/resources" />
        <Row icon={82} label="The Library" href="/library" />
        <Row icon={56} label="The Cinema"  href="/cinema" />
        <Row icon={'printer'} label="The Printer" href="/printer" />
      </div>
      <div aria-hidden="true" style={{ background: '#ece9d8', borderTop: '1px solid #c8c4bc', padding: '4px 8px', fontSize: 10, color: '#666', fontFamily: UIFONT }}>
        4 items
      </div>
    </div>
  );
}

/**
 * The inside of the pink Current Projects & Events folder.
 *
 * Two ways in, on purpose, and this is the whole reason the folder exists: the
 * first row is the overview page for browsing everything at once, and below it
 * one row per project for going straight to the one you came for without
 * scrolling past the others.
 *
 * The list is read from the published productions each time the folder opens,
 * so publishing in Admin is all it takes to appear here. Drafts never show,
 * because fetchPublishedProductions only asks for published rows and RLS would
 * refuse the rest anyway.
 *
 * A failed fetch is treated the same as an empty one: the overview row is still
 * there, so the folder is never a dead end.
 */
function ProjectsBody() {
  const [productions, setProductions] = useState<ProductionWithDates[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPublishedProductions().then((list) => {
      if (!cancelled) setProductions(list);
    });
    return () => { cancelled = true; };
  }, []);

  const loading = productions === null;
  const all     = productions ?? [];
  const current = sortByNextDate(all.filter((p) => !isPast(p)));
  const past    = all.filter(isPast);
  // The two rows that are always there whatever the database says: the overview
  // and Backstage. Counting them was missed when Backstage was added, so the
  // footer read "2 items" under a list of three.
  const FIXED_ROWS = 2;
  const count   = FIXED_ROWS + current.length + past.length;

  // Where a project's icon leads. The interactive microsite when it has one,
  // because that is the front door this folder exists to offer: the plain,
  // readable version is already one row up as "See everything at once". A
  // project with no microsite falls back to its plain page, so it still works.
  const projectRow = (p: ProductionWithDates) => {
    const next = nextDate(p);
    const micro = micrositeHref(p);
    return (
      <Row
        key={p.id}
        icon={resolveProjectIcon(p.desktop_icon, p.kind)}
        label={p.title}
        sub={next ? formatDateShort(next) : p.schedule_note ?? undefined}
        href={micro ?? `/projects/${p.slug}`}
        hardLink={!!micro}
        external={!!micro && isExternalHref(micro)}
      />
    );
  };

  const groupHeading = (id: string, text: string) => (
    <p id={id} style={{
      margin: 0, padding: '5px 10px', background: '#f4f2ec',
      borderBottom: '1px solid #e2ded6', borderTop: '1px solid #e2ded6',
      fontFamily: UIFONT, fontSize: 10.5, fontWeight: 700,
      letterSpacing: '.06em', textTransform: 'uppercase', color: '#5a5a5a',
    }}>
      {text}
    </p>
  );

  return (
    <div>
      <div aria-hidden="true" style={{ background: '#ece9d8', borderBottom: '1px solid #c8c4bc', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: UIFONT }}>
        <span style={{ color: '#555' }}>Address</span>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #7a7a7a', padding: '2px 5px', fontSize: 11, color: '#000' }}>
          {'C:\\Artistic Accessibility\\Projects & Events\\'}
        </div>
      </div>

      <div style={{ background: '#fff' }}>
        <Row
          icon={PROJECTS_FOLDER_ICON}
          label="See everything at once"
          sub="The overview of all our projects and events"
          href="/projects"
        />

        {/* The company's own door. Signed out it asks you to sign in, and if
            you are not on a show it says so plainly, so it is safe to show to
            everybody rather than hiding it behind a role check the homepage
            has no other reason to do. */}
        <Row
          // A key, not a path: Ico builds the filename itself via IMG(), so a
          // full path here becomes icon-/images/.../icon-51.png.png and 404s.
          icon={51}
          label="Backstage"
          sub="For the people making these. Sign in required."
          href="/backstage"
        />

        {loading && (
          <p role="status" aria-live="polite" style={{ margin: 0, padding: '10px', fontFamily: UIFONT, fontSize: 12, color: '#5a5a5a' }}>
            Looking up what we have on…
          </p>
        )}

        {!loading && current.length > 0 && (
          <section aria-labelledby="proj-current">
            {groupHeading('proj-current', 'Coming up')}
            {current.map(projectRow)}
          </section>
        )}

        {!loading && past.length > 0 && (
          <section aria-labelledby="proj-past">
            {groupHeading('proj-past', 'Already happened')}
            {past.map(projectRow)}
          </section>
        )}

        {!loading && all.length === 0 && (
          <p style={{ margin: 0, padding: '10px', fontFamily: UIFONT, fontSize: 12, color: '#5a5a5a', lineHeight: 1.5 }}>
            Nothing published yet. The overview above explains what is coming.
          </p>
        )}
      </div>

      <div aria-hidden="true" style={{ background: '#ece9d8', borderTop: '1px solid #c8c4bc', padding: '4px 8px', fontSize: 10, color: '#666', fontFamily: UIFONT }}>
        {loading ? 'Reading…' : `${count} item${count === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}

function Win({ win, z, onClose, onFocus, onOpen, account, onSignOut, onNavigate, signOutError, isMobile }: {
  win: WinState;
  z: number;
  onClose: (id: string, rect?: DOMRect) => void;
  onFocus: (id: string) => void;
  onOpen: (key: string) => void;
  account: 'out' | 'collective' | 'access_card';
  onSignOut: () => void;
  onNavigate: (href: string) => void;
  signOutError?: string | null;
  isMobile: boolean;
}) {
  const it = ITEMS[win.key];
  const { kind } = win;
  const title = kind === 'aim' ? 'Buddy List' : kind === 'explorer' ? 'Resources' : kind === 'folder' ? 'All Folders' : it?.label ?? '';
  const titleIcon = kind === 'aim' ? 'aim' : kind === 'explorer' ? 48 : kind === 'folder' ? 'folders' : (it?.icon ?? 56);
  const width = winWidth(kind, isMobile);
  const redClose = kind === 'aim' || kind === 'explorer';

  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(win.pos);
  const close = () => onClose(win.id, ref.current?.getBoundingClientRect());

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    onFocus(win.id);
    const ox = pos.x, oy = pos.y, sx = e.clientX, sy = e.clientY;
    // Keep a grabbable strip of the title bar on screen. The desktop does not
    // scroll and the taskbar button only raises z-index, so a window dragged
    // off the edge could not be recovered at all.
    const taskbarH = isMobile ? 44 : 114;
    const move = (ev: PointerEvent) => setPos({
      x: Math.min(window.innerWidth - 120, Math.max(120 - width, ox + ev.clientX - sx)),
      y: Math.min(window.innerHeight - taskbarH - 34, Math.max(0, oy + ev.clientY - sy)),
    });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Focus the window itself, not its first control. querySelector picked up the
  // title bar's close button, so opening anything landed you on "Close" and
  // the window's name was never announced.
  useEffect(() => { ref.current?.focus(); }, []);

  const titleBarStyle: React.CSSProperties = kind === 'aim'
    ? { background: 'linear-gradient(to bottom,#ffe566 0%,#e8a800 55%,#c88000 100%)', color: '#3a2000', borderBottom: '1px solid #a06800' }
    : kind === 'explorer'
    ? { background: 'linear-gradient(to right,#1a4fcc 0%,#3c8af5 60%,#1a60e0 100%)', color: '#fff' }
    : { background: 'linear-gradient(90deg,#000a7a,#1c84d8)', color: '#fff' };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label={title}
      tabIndex={-1}
      onPointerDown={() => onFocus(win.id)}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: `min(${width}px, calc(100vw - 16px))`,
        zIndex: z, outline: 'none',
        background: redClose ? 'transparent' : SILVER,
        boxShadow: redClose ? '0 0 0 1px rgba(0,0,0,.35), 0 8px 28px rgba(0,0,0,.5)' : `${RAISED}, 0 8px 28px rgba(0,0,0,.45)`,
        borderRadius: redClose ? 4 : 0, overflow: 'hidden',
        padding: redClose ? 0 : 3, fontFamily: UIFONT,
        animation: isMobile ? undefined : 'win-open .14s cubic-bezier(.16,1,.3,1) .16s backwards',
      }}
    >
      <div
        onPointerDown={startDrag}
        style={{ ...titleBarStyle, height: kind === 'app' || kind === 'folder' ? 28 : 26, display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 6px', cursor: 'grab', touchAction: 'none' }}
      >
        <span aria-hidden="true" style={{ width: 18, height: 18, flexShrink: 0 }}><Ico n={titleIcon} size={18} /></span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: kind === 'explorer' ? '0 1px 1px rgba(0,0,0,.4)' : 'none' }}>{title}</span>
        <WinClose onClose={close} label={`Close ${title}`} red={redClose} />
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 'calc(100dvh - 136px)' }}>
        {kind === 'app'      && <AppBody k={win.key} onOpen={onOpen} onClose={close} wide={!isMobile} />}
        {kind === 'folder'   && <FolderBody onOpen={onOpen} wide={!isMobile} />}
        {kind === 'aim'      && <AimBody onOpen={onOpen} account={account} onSignOut={onSignOut} onNavigate={onNavigate} signOutError={signOutError} />}
        {kind === 'explorer' && <ExplorerBody onOpen={onOpen} />}
        {kind === 'projects' && <ProjectsBody />}
      </div>
    </div>
  );
}

function StartMenuLeaf({ k, size = 26, onOpen }: { k: string; size?: number; onOpen: (key: string) => void }) {
  return (
    <button onClick={() => onOpen(k)} className="win-row"
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '5px 14px 5px 10px', fontFamily: UIFONT, fontSize: 13.5, color: '#101010' }}>
      <span aria-hidden="true" style={{ width: size, height: size, flexShrink: 0 }}><Ico n={ITEMS[k].icon} size={size} /></span>
      <span>{ITEMS[k].label}</span>
    </button>
  );
}

function StartMenuFolder({ name, kids, onOpen }: { name: string; kids: string[]; onOpen: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);
  return (
    <div className={'start-folder' + (open ? ' open' : '')} style={{ position: 'relative' }}>
      {/* A real <button>, not a clickable div: iOS Safari doesn't reliably fire
          click events on non-interactive elements, which left the submenu
          stuck in a focus-only state that vanished before item taps landed. */}
      <button type="button" className="win-row" aria-haspopup="true" aria-expanded={open}
        onClick={toggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 44, padding: '5px 12px 5px 10px', fontFamily: UIFONT, fontSize: 13.5, color: '#101010', background: 'none', border: 'none', textAlign: 'left', cursor: 'default' }}>
        <span aria-hidden="true" style={{ width: 26, height: 26, flexShrink: 0 }}><Ico n={48} size={26} /></span>
        <span style={{ flex: 1 }}>{name}</span>
        <span aria-hidden="true" style={{ fontSize: 10 }}>▶</span>
      </button>
      <div className="start-sub" aria-label={name}
        style={{ position: 'absolute', left: '100%', top: -3, minWidth: 214, background: SILVER, boxShadow: RAISED, padding: 3, zIndex: 9002 }}>
        {kids.map(c => <StartMenuLeaf key={c} k={c} size={24} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function StartMenu({ onOpen, onClose }: { onOpen: (key: string) => void; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      if (document.activeElement === document.body) {
        document.getElementById('start-btn')?.focus();
      }
    };
  }, []);

  return (
    <>
      <button aria-label="Close menu" onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'none', border: 'none', cursor: 'default' }} />
      <div ref={menuRef} aria-label="Start menu" className="start-menu"
        style={{ position: 'absolute', left: 4, bottom: 38, zIndex: 9001, width: 250, background: SILVER, boxShadow: RAISED, padding: 3, display: 'flex', fontFamily: UIFONT }}>
        <div aria-hidden="true" style={{ width: 30, background: 'linear-gradient(#1c84d8,#000a7a)', position: 'relative', flexShrink: 0 }}>
          <span style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%) rotate(180deg)', writingMode: 'vertical-rl', whiteSpace: 'nowrap', color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>
            Artistic <span style={{ fontWeight: 400 }}>Accessibility</span>
          </span>
        </div>
        <div className="start-list" style={{ flex: 1, padding: '4px 0' }}>
          {TREE.map((node, i) => node.type === 'leaf'
            ? <StartMenuLeaf key={i} k={node.key} onOpen={onOpen} />
            : <StartMenuFolder key={i} name={node.name} kids={node.children} onOpen={onOpen} />)}
          <div aria-hidden="true" style={{ height: 2, background: '#808080', boxShadow: '0 1px 0 #fff', margin: '4px 6px' }} />
          <StartMenuLeaf k="connect" onOpen={onOpen} />
          <StartMenuLeaf k="all-folders" onOpen={onOpen} />
        </div>
      </div>
    </>
  );
}

// Win95-style zoom: dotted outline rectangles trace from the clicked icon out to
// the window (or back, on close). Purely decorative, desktop only.
function ZoomFX({ from, to, onDone }: { from: FxRect; to: FxRect; onDone: () => void }) {
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);
  useEffect(() => {
    const t = setTimeout(() => done.current(), 420);
    return () => clearTimeout(t);
  }, []);
  const steps = [0.25, 0.5, 0.75, 1];
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9400, pointerEvents: 'none' }}>
      {steps.map((t, i) => (
        <div key={i} style={{
          position: 'absolute', boxSizing: 'border-box',
          left: from.x + (to.x - from.x) * t,
          top: from.y + (to.y - from.y) * t,
          width: from.w + (to.w - from.w) * t,
          height: from.h + (to.h - from.h) * t,
          border: '2px dotted rgba(255,255,255,.95)',
          boxShadow: '0 0 0 1px rgba(0,0,0,.35)',
          opacity: 0,
          animation: `zoom-step .11s linear ${i * 0.05}s both`,
        }} />
      ))}
    </div>
  );
}

// Full-screen "program starting" takeover: a window frame zooms out from the
// clicked icon to fill the screen, shows a loading bar, then the route changes.
function Launcher({ k, from }: { k: string; from: DOMRect }) {
  const it = ITEMS[k];
  const vars = {
    '--lx': `${from.left}px`,
    '--ly': `${from.top}px`,
    '--lsx': String(from.width / window.innerWidth),
    '--lsy': String(from.height / window.innerHeight),
  } as React.CSSProperties;
  return (
    <div role="status" style={{ position: 'fixed', inset: 0, zIndex: 9500, background: SILVER, boxShadow: RAISED, padding: 3, fontFamily: UIFONT, display: 'flex', flexDirection: 'column', transformOrigin: '0 0', animation: 'launch-zoom .38s cubic-bezier(.16,1,.3,1) both', ...vars }}>
      <div style={{ background: 'linear-gradient(90deg,#000a7a,#1c84d8)', color: '#fff', height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', flexShrink: 0 }}>
        <span aria-hidden="true" style={{ width: 20, height: 20 }}><Ico n={it.icon} size={20} /></span>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{it.label}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <span aria-hidden="true"><Ico n={it.icon} size={72} /></span>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>Starting {it.label}…</div>
        <div aria-hidden="true" style={{ boxShadow: FIELD, background: '#fff', padding: 3, display: 'flex', gap: 2 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} style={{ width: 14, height: 16, background: 'linear-gradient(#1c84d8,#000a7a)', opacity: 0, animation: `blockon .01s linear ${0.3 + i * 0.04}s forwards` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const [user, setUser]             = useState<{ id: string } | null>(null);
  const [memberType, setMemberType] = useState<'collective' | 'access_card' | null>(null);
  const [wins, setWins]             = useState<WinState[]>([]);
  const [zTop, setZTop]             = useState(10);
  const [startOpen, setStartOpen]   = useState(false);
  const [sel, setSel]               = useState<string | null>(null);
  const [beta, setBeta]             = useState(true);
  const [time, setTime]             = useState('');

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const cascade = useRef(0);
  const TOPBAR_H = isMobile ? 64 : 88;
  const headerH = TOPBAR_H + (beta ? 44 : 0);
  const openers = useRef<Map<string, HTMLElement>>(new Map());
  const deskRef = useRef<HTMLDivElement>(null);
  const aboutBtnRef = useRef<HTMLButtonElement>(null);

  // No document.title here. The root layout's metadata already supplies it, and
  // the old unmount cleanup reset the title AFTER the page you were navigating
  // to had set its own, so every trip out of the desktop landed on a page whose
  // browser tab, history entry and bookmark all read "Artistic Accessibility
  // Collective" instead of that page's real name.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      const { data: prof } = await supabase.from('profiles').select('member_type').eq('user_id', data.user.id).maybeSingle();
      setMemberType((prof?.member_type as 'collective' | 'access_card') ?? 'collective');
    });
  }, []);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && startOpen) setStartOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startOpen]);

  const focusWin = useCallback((id: string) => {
    setZTop(z => {
      const nz = z + 1;
      setWins(ws => ws.map(w => w.id === id ? { ...w, z: nz } : w));
      return nz;
    });
  }, []);

  const DIRECT_NAV = ['make-art', 'learning', 'collective', 'library', 'cinema', 'calendar', 'printer', 'faq', 'hire', 'access-resources'];

  const [fx, setFx] = useState<Array<{ id: number; from: FxRect; to: FxRect }>>([]);
  const fxId = useRef(0);
  const addFx = useCallback((from: FxRect, to: FxRect) => {
    const id = ++fxId.current;
    setFx(f => [...f, { id, from, to }]);
  }, []);

  const [launching, setLaunching] = useState<{ key: string; href: string; from: DOMRect } | null>(null);

  const launch = useCallback((k: string, href: string, opener: HTMLElement | null) => {
    if (isMobile || prefersReduced() || !opener) { router.push(href); return; }
    router.prefetch(href);
    setLaunching({ key: k, href, from: opener.getBoundingClientRect() });
  }, [isMobile, router]);

  useEffect(() => {
    if (!launching) return;
    const t = setTimeout(() => router.push(launching.href), 900);
    return () => clearTimeout(t);
  }, [launching, router]);

  const open = useCallback((k: string) => {
    if (launching) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStartOpen(false);
    const it = ITEMS[k];
    if (!it) return;
    if (it.kind === 'ext') { window.open(it.href, '_blank', 'noopener'); return; }
    if (k === 'collective' && user) { launch(k, '/dashboard', opener); return; }
    // My Access Card: straight to the card for signed-in Access Card holders;
    // everyone else gets a window prompting them to sign in or sign up.
    if (k === 'my-access-card' && user && memberType === 'access_card') { launch(k, '/access-card', opener); return; }
    if (DIRECT_NAV.includes(k) && it.href) { launch(k, it.href, opener); return; }
    if (opener) openers.current.set(k, opener);
    const existing = wins.find(w => w.id === k);
    const nz = zTop + 1;
    setZTop(nz);
    if (existing) { setWins(ws => ws.map(w => w.id === k ? { ...w, z: nz } : w)); return; }
    const c = cascade.current;
    cascade.current = (c + 1) % 6;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const width = winWidth(it.kind as WinKind, isMobile);
    const x = Math.max(8, Math.min(60 + c * 34, vw - (width + 16)));
    const pos = { x, y: headerH + 14 + c * 30 };
    setWins(ws => [...ws, { id: k, key: k, kind: it.kind as WinKind, pos, z: nz }]);
    if (!isMobile && opener && !prefersReduced()) {
      addFx(toFxRect(opener.getBoundingClientRect()), { x, y: pos.y, w: width, h: Math.min(340, width * 0.85) });
    }
  }, [wins, zTop, headerH, user, memberType, isMobile, launching, launch, addFx]);

  const closeWin = (id: string, rect?: DOMRect) => {
    setWins(ws => ws.filter(w => w.id !== id));
    const opener = openers.current.get(id);
    openers.current.delete(id);
    const openerLive = opener && document.contains(opener) ? opener : null;
    if (rect && !isMobile && !prefersReduced()) {
      // Shrink back to whatever opened the window, or down to the taskbar.
      const target = openerLive ? toFxRect(openerLive.getBoundingClientRect()) : { x: 8, y: window.innerHeight - 44, w: 120, h: 36 };
      addFx(toFxRect(rect), target);
    }
    if (openerLive) {
      openerLive.focus();
    } else {
      deskRef.current?.focus();
    }
  };

  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSignOutError("Sign out didn't go through. Please try again.");
      return;
    }
    setSignOutError(null);
    setUser(null);
    setMemberType(null);
  };

  const account: 'out' | 'collective' | 'access_card' = !user ? 'out' : memberType === 'access_card' ? 'access_card' : 'collective';

  return (
    <main
      onPointerDown={() => setSel(null)}
      style={{ position: 'fixed', inset: 0, background: '#263590', overflow: 'hidden', fontFamily: UIFONT, userSelect: 'none' }}
    >
      <h1 className="sr-only">Artistic Accessibility Collective</h1>

      {/* Starfield */}
      <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {STARS.map((s, i) => <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o} />)}
      </svg>

      {/* CRT scanlines */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 8000, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,.06) 0 1px,transparent 1px 3px)' }} />

      {/* Top bar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: TOPBAR_H, zIndex: 5, background: 'linear-gradient(to bottom,#2d3ba0,#1a2568)', borderBottom: '2px solid #10163d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <button
          ref={aboutBtnRef}
          onClick={() => open('about')}
          aria-label="About, Artistic Accessibility Collective"
          className="top-bar-btn"
          style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', minHeight: 44, padding: '4px 14px' }}
        >
          <Logo height={isMobile ? 40 : 56} />
        </button>
      </div>

      {/* Beta ticker */}
      {beta && (
        <div
          role="status"
          onPointerDown={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: TOPBAR_H, left: 0, right: 0, height: 44, zIndex: 5, background: '#000', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', overflow: 'hidden' }}
        >
          <div className="beta-ticker-wrap" tabIndex={0} style={{ flex: 1, overflow: 'hidden' }}>
            <div className="beta-scroll" style={{ display: 'inline-flex', whiteSpace: 'nowrap', willChange: 'transform' }}>
              <span style={{ padding: '0 50px', color: '#39ff14', fontFamily: UIFONT, fontSize: 12.5, fontWeight: 700 }}>{BETA_MSG}</span>
              <span aria-hidden="true" style={{ padding: '0 50px', color: '#39ff14', fontFamily: UIFONT, fontSize: 12.5, fontWeight: 700 }}>{BETA_MSG}</span>
            </div>
          </div>
          <button
            onClick={() => { aboutBtnRef.current?.focus(); setBeta(false); }}
            aria-label="Dismiss beta notice"
            style={{ flexShrink: 0, height: '100%', minWidth: 44, padding: '0 9px', background: '#000', border: 'none', borderLeft: '1px solid rgba(255,255,255,.2)', color: '#39ff14', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {/* Desktop icons — hand-placed on desktop, grid on mobile */}
      <p id="desktop-desc" className="sr-only">
        {isMobile
          ? 'The icons below are playfully tilted, like hand-placed stickers. They work exactly like normal buttons.'
          : 'The icons below are playfully oversized, tilted, and mismatched in size, like hand-placed stickers. They work exactly like normal buttons.'}
      </p>
      <div
        ref={deskRef}
        tabIndex={-1}
        onPointerDown={(e) => e.stopPropagation()}
        role="list"
        aria-label="Desktop"
        aria-describedby="desktop-desc"
        className="dsk-container"
        style={isMobile
          ? { position: 'absolute', top: headerH, left: 0, right: 0, bottom: 58, zIndex: 2, pointerEvents: 'none' }
          : { position: 'absolute', top: headerH, left: 0, right: 0, bottom: 122, zIndex: 2, pointerEvents: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', alignItems: 'flex-start', gap: 20, padding: '0 32px' }}
      >
        {DESKTOP.map(k => (
          <div role="listitem" key={k} className="dsk-item" style={isMobile ? undefined : { pointerEvents: 'all' }}>
            <DeskIcon k={k} onOpen={open} selected={sel === k} onSelect={setSel} isMobile={isMobile} />
          </div>
        ))}
      </div>

      {/* Windows */}
      {wins.map(w => (
        <Win key={w.id} win={w} z={w.z} onClose={closeWin} onFocus={focusWin} onOpen={open} account={account} onSignOut={handleSignOut} onNavigate={(href) => router.push(href)} signOutError={signOutError} isMobile={isMobile} />
      ))}

      {/* Zoom open/close rectangles */}
      {fx.map(f => (
        <ZoomFX key={f.id} from={f.from} to={f.to} onDone={() => setFx(l => l.filter(x => x.id !== f.id))} />
      ))}

      {/* Program launch takeover */}
      {launching && <Launcher k={launching.key} from={launching.from} />}

      {/* Start menu */}
      {startOpen && <StartMenu onOpen={open} onClose={() => setStartOpen(false)} />}

      {/* Taskbar — oversized sticker treatment on desktop; compact classic bar on mobile. */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        role="presentation"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: isMobile ? 44 : 114, background: SILVER, boxShadow: `inset 0 ${isMobile ? 2 : 3}px 0 #fff`, borderTop: `${isMobile ? 1 : 2}px solid #fff`, display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 10, padding: isMobile ? '0 5px' : '0 10px', zIndex: 8500, fontFamily: UIFONT }}
      >
        <button
          id="start-btn"
          onClick={() => setStartOpen(s => !s)}
          aria-expanded={startOpen}
          className={isMobile ? undefined : 'start-btn'}
          style={{ height: isMobile ? 44 : 90, background: SILVER, boxShadow: startOpen ? SUNKEN : RAISED, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, padding: isMobile ? '0 10px 0 7px' : '0 22px 0 10px', fontFamily: UIFONT, fontWeight: 700, fontSize: isMobile ? 14 : 24, color: '#0a0a0a' }}
        >
          <span aria-hidden="true" style={{ width: isMobile ? 20 : 66, height: isMobile ? 20 : 66, flexShrink: 0 }}><Ico n={56} size={isMobile ? 20 : 66} /></span>
          Start
        </button>
        <div aria-hidden="true" style={{ width: isMobile ? 1 : 2, height: isMobile ? 24 : 64, background: '#808080', boxShadow: `${isMobile ? 1 : 2}px 0 0 #fff`, margin: '0 3px' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, overflow: 'hidden' }}>
          {wins.map(w => {
            const wIt = ITEMS[w.key];
            const wTitle = w.kind === 'aim' ? 'Buddy List' : w.kind === 'explorer' ? 'Resources' : w.kind === 'folder' ? 'All Folders' : wIt?.label ?? '';
            const wIc = w.kind === 'aim' ? 'aim' : w.kind === 'explorer' ? 48 : w.kind === 'folder' ? 'folders' : (wIt?.icon ?? 56);
            const top = wins.length > 0 && Math.max(...wins.map(x => x.z)) === w.z;
            return (
              <button key={w.id} onClick={() => focusWin(w.id)}
                style={{ height: isMobile ? 44 : 76, maxWidth: isMobile ? 150 : 260, boxShadow: top ? SUNKEN : RAISED, background: top ? '#bcbcbc' : SILVER, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, padding: isMobile ? '0 9px' : '0 16px', fontSize: isMobile ? 12.5 : 20, color: '#0a0a0a', fontFamily: UIFONT }}>
                <span aria-hidden="true" style={{ width: isMobile ? 16 : 30, height: isMobile ? 16 : 30, flexShrink: 0 }}><Ico n={wIc} size={isMobile ? 16 : 30} /></span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wTitle}</span>
              </button>
            );
          })}
        </div>
        <div aria-hidden="true" style={{ boxShadow: FIELD, padding: isMobile ? '5px 10px' : '10px 20px', fontSize: isMobile ? 12.5 : 26, color: '#0a0a0a', flexShrink: 0, transform: isMobile ? undefined : 'rotate(1.5deg)' }}>
          {time}
        </div>
      </div>

      <style>{`
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        main p{user-select:text}
        .win-close{position:relative;overflow:visible}
        .win-close::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:44px;min-height:44px;display:block}
        .dsk-label{color:#fff;font-family:${UIFONT};font-size:17px;font-weight:600;text-align:center;line-height:1.25;text-shadow:0 1px 0 rgba(0,0,0,.7),0 0 3px rgba(0,0,0,.5);padding:2px 6px;max-width:160px;border:1px dotted transparent}
        .dsk-label.sel{background:#0a246a;border:1px dotted #fff;text-shadow:none}
        .dsk-icon:focus-visible .dsk-label{background:#0a246a;border:1px dotted #fff;text-shadow:none}
        .dsk-icon{transform:translate(var(--jx,0px),var(--jy,0px))}
        .start-btn{transform:rotate(-2deg)}
        .dsk-icon-img-wrap{transform:rotate(var(--tilt,0deg));transition:transform .12s ease-out}
        .dsk-icon:hover .dsk-icon-img-wrap,.dsk-icon:focus-visible .dsk-icon-img-wrap{transform:rotate(0deg) scale(1.05)}
        .win-row:hover,.win-row:focus-visible{background:#0a246a!important;color:#fff!important;outline:2px solid #ffd21a;outline-offset:-2px}
        .win-row:hover .win-row-sub,.win-row:focus-visible .win-row-sub{color:#d8dcf5!important}
        .top-bar-btn:hover,.top-bar-btn:focus-visible{background:linear-gradient(to bottom,#3a49b8,#22306e);outline:2px solid #ffd21a;outline-offset:-2px}
        .start-sub{display:none}
        .start-folder:hover>.start-sub,.start-folder.open>.start-sub{display:block}
        .start-folder:hover>.win-row,.start-folder:focus-within>.win-row,.start-folder.open>.win-row{background:#0a246a!important;color:#fff!important}
        .beta-scroll{animation:beta-marq 30s linear infinite}
        @keyframes beta-marq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes zoom-step{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
        @keyframes win-open{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
        @keyframes launch-zoom{from{transform:translate(var(--lx),var(--ly)) scale(var(--lsx),var(--lsy))}to{transform:none}}
        @keyframes blockon{to{opacity:1}}
        @media (prefers-reduced-motion: reduce){*{animation-duration:.001ms!important;animation-delay:0s!important}.beta-scroll{animation:none!important;transform:none!important}.beta-ticker-wrap{overflow-x:auto!important}}
        @media (max-width: 600px){
          .start-menu{width:calc(100vw - 10px)!important}
          .start-list{max-height:calc(100dvh - 96px)!important;overflow-y:auto!important}
          .start-sub{position:static!important;left:auto!important;top:auto!important;min-width:0!important;box-shadow:none!important;background:#d4d4d4!important;border-left:3px solid #9a9a9a!important;margin:0 8px 4px 30px!important;padding:2px 0!important}
          .start-folder:hover>.start-sub{display:none}
          .start-folder.open>.start-sub{display:block}
          .dsk-container{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:4px 8px!important;padding:12px!important;align-content:start!important;pointer-events:auto!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch}
          .dsk-item{position:static!important;pointer-events:all!important}
          .dsk-icon{width:100%!important;padding:8px 10px 6px!important;gap:4px!important;justify-content:center!important;--jx:0px!important;--jy:0px!important}
          .dsk-icon-img-wrap img{width:108px!important;height:108px!important}
          .dsk-label{font-size:14px!important;max-width:none!important}
        }
      `}</style>
    </main>
  );
}
