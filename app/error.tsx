'use client';

import { useEffect, useRef, useState } from 'react';

const RAISED = 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf';
const SUNKEN = 'inset 1px 1px 0 #0a0a0a, inset -1px -1px 0 #fff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf';
const SILVER = '#c3c3c3';
const UIFONT = '"Tahoma","MS Sans Serif",Arial,sans-serif';

function DlgBtn({ children, onClick, href, primary }: { children: React.ReactNode; onClick?: () => void; href?: string; primary?: boolean }) {
  const [p, setP] = useState(false);
  const style: React.CSSProperties = {
    minWidth: 110, minHeight: 44, background: SILVER, boxShadow: p ? SUNKEN : RAISED,
    border: 'none', cursor: 'pointer', fontFamily: UIFONT, fontSize: 13, color: '#0a0a0a',
    padding: p ? '2px 11px 0 13px' : '0 12px', outline: primary ? '1px solid #0a0a0a' : 'none',
    outlineOffset: primary ? -3 : 0, display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', textDecoration: 'none',
  };
  const press = { onPointerDown: () => setP(true), onPointerUp: () => setP(false), onPointerLeave: () => setP(false) };
  // Plain <a> for navigation: after a crash, a full page load is the safest reset.
  if (href) return <a href={href} style={style} {...press}>{children}</a>;
  return <button onClick={onClick} style={style} {...press}>{children}</button>;
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Error · Artistic Accessibility Collective';
    headingRef.current?.focus();
    return () => { document.title = prev; };
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#263590', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: UIFONT }}>
      <div role="alertdialog" aria-labelledby="err-title" aria-describedby="err-desc"
        style={{ width: 'min(460px, 100%)', background: SILVER, boxShadow: `${RAISED}, 0 12px 36px rgba(0,0,0,.5)`, padding: 3 }}>
        <div style={{ background: 'linear-gradient(90deg,#000a7a,#1c84d8)', color: '#fff', height: 28, display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 700, fontSize: 13 }}>
          <span id="err-title">Artistic Accessibility</span>
        </div>

        <div style={{ padding: '18px 16px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0, transform: 'rotate(-3deg)' }}>
            <circle cx="20" cy="20" r="19" fill="#c0392b" stroke="#7a150b" />
            <path d="M13 13 L27 27 M27 13 L13 27" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
          <div id="err-desc">
            <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 8px', outline: 'none', fontFamily: UIFONT }}>
              This page has performed an illegal operation and will be shut down.
            </h1>
            <p style={{ fontSize: 13, lineHeight: '19px', margin: 0, color: '#101010' }}>
              Something went wrong on our end. It was not you, and nothing you did broke it. Trying again usually clears it right up.
            </p>
          </div>
        </div>

        {showDetails && (
          <div style={{ margin: '0 16px 14px', background: '#fff', boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #fff', padding: '8px 10px', fontFamily: '"Lucida Console","Courier New",monospace', fontSize: 11.5, color: '#101010', overflowWrap: 'break-word' }}>
            {error.message || 'Unknown error'}{error.digest ? ` (ref: ${error.digest})` : ''}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px', flexWrap: 'wrap' }}>
          <DlgBtn onClick={() => setShowDetails(d => !d)}>{showDetails ? 'Details <<' : 'Details >>'}</DlgBtn>
          <DlgBtn onClick={reset} primary>Try Again</DlgBtn>
          <DlgBtn href="/">Return to Desktop</DlgBtn>
        </div>
      </div>
    </div>
  );
}
