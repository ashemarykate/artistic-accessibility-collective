'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MONO = '"Lucida Console","Courier New",monospace';

export default function NotFound() {
  const router = useRouter();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Page Not Found · Artistic Accessibility Collective';
    mainRef.current?.focus();

    // "Press any key" honors the joke without hijacking keyboard navigation:
    // only plain printable keys and Enter count. Tab, arrows, and modifier
    // combos keep their normal jobs.
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 || e.key === 'Enter') router.push('/');
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.title = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [router]);

  return (
    <div
      ref={mainRef}
      tabIndex={-1}
      style={{ minHeight: '100dvh', background: '#0000aa', color: '#fff', fontFamily: MONO, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', outline: 'none' }}
    >
      <div style={{ maxWidth: 620, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ background: '#aaaaaa', color: '#0000aa', padding: '2px 14px', fontWeight: 700, fontSize: 15, letterSpacing: 1, display: 'inline-block', transform: 'rotate(-2deg)' }}>
            Artistic Accessibility
          </span>
        </div>

        <h1 style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.6, margin: '0 0 22px', fontFamily: MONO }}>
          A problem has been detected: the page you were looking for could not be found.
        </h1>

        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 22px' }}>
          PAGE_NOT_FOUND_EXCEPTION (Error 404)
        </p>

        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 22px' }}>
          If this is the first time you have seen this screen, check the web address for typos. If you followed a link to get here, that link may be broken, and we would genuinely love to know about it.
        </p>

        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 28px' }}>
          Technical information:<br />
          *** STOP: 0x00000404 (page missing, not your fault)
        </p>

        <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
          Press any key to return to the desktop, or use the links below.
          <span aria-hidden="true" className="bsod-cursor" style={{ display: 'inline-block', width: 9, height: 16, background: '#fff', marginLeft: 6, verticalAlign: 'text-bottom' }} />
        </p>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#fff', fontFamily: MONO, fontSize: 14, textDecorationThickness: 1, textUnderlineOffset: 3, padding: '10px 0', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
            Return to the desktop
          </Link>
          <Link href="/contact" style={{ color: '#fff', fontFamily: MONO, fontSize: 14, textDecorationThickness: 1, textUnderlineOffset: 3, padding: '10px 0', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
            Report a broken link
          </Link>
        </div>
      </div>

      <style>{`
        .bsod-cursor{animation:bsod-blink 1.06s steps(1) infinite}
        @keyframes bsod-blink{50%{opacity:0}}
        @media (prefers-reduced-motion: reduce){.bsod-cursor{animation:none}}
      `}</style>
    </div>
  );
}
