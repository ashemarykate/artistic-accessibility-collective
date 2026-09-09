'use client';

/**
 * PolicyPage — shared chrome for the three small-print pages (privacy,
 * conduct, access). Same retro window and typography as About, so these do not
 * read as a legal annex bolted onto the side of the site.
 *
 * Content lives in the pages themselves. This only owns the frame.
 */

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

const TEAL = '#0d5c4a';
export const POLICY_TEXT = '#1e2444';
export const POLICY_MUTED = '#4a5280';

export default function PolicyPage({
  title, lede, path, updated, children,
}: {
  title: string;
  lede: string;
  /** Path without the leading slash, used in the fake address bar. */
  path: string;
  /** Plain-language date this page was last changed. */
  updated: string;
  children: React.ReactNode;
}) {
  const h1Ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  return (
    <BrowserChrome
      variant="aol"
      desktopBg="#0d1e4a"
      title={`${title} · Artistic Accessibility Collective`}
      url={`http://www.artisticaccessibility.com/${path}`}
    >
      <>
        <header style={{ background: TEAL, padding: '0.875rem 1.5rem', flexShrink: 0 }}>
          <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ transform: 'rotate(-1.2deg)', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-across-blue-bg.svg" alt="" style={{ display: 'block', height: 44, width: 'auto' }} />
          </Link>
        </header>

        <main style={{ background: 'var(--aac-cream)', minHeight: '100%', padding: '2.5rem 1rem 3.5rem' }}>
          <div style={{ maxWidth: 660, margin: '0 auto' }}>
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-display about-h1"
              style={{ color: TEAL, lineHeight: 1.05, marginBottom: '1.25rem', outline: 'none' }}
            >
              {title}
            </h1>

            <p className="about-lede" style={{ color: POLICY_TEXT, lineHeight: 1.65, marginBottom: '1rem' }}>
              {lede}
            </p>

            <p style={{ color: POLICY_MUTED, fontSize: '0.875rem', marginBottom: '2.5rem' }}>
              Last updated {updated}.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0 0 2.5rem' }} />

            {children}

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '2.5rem 0 1.5rem' }} />

            <nav aria-label="Other small print pages">
              <p style={{ color: POLICY_MUTED, fontSize: '0.9375rem', lineHeight: 1.8 }}>
                See also:{' '}
                <Link href="/privacy" style={{ color: TEAL }}>Your Privacy</Link>,{' '}
                <Link href="/conduct" style={{ color: TEAL }}>Code of Conduct</Link>,{' '}
                <Link href="/access" style={{ color: TEAL }}>Access Statement</Link>.
              </p>
              <p style={{ color: POLICY_MUTED, fontSize: '0.9375rem', lineHeight: 1.8 }}>
                Questions about any of this?{' '}
                <Link href="/contact" style={{ color: TEAL }}>Write to us</Link>.
              </p>
            </nav>
          </div>
        </main>
      </>
    </BrowserChrome>
  );
}

/** Shared section wrapper so the three pages stay visually identical. */
export function PolicySection({
  id, heading, children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} style={{ marginBottom: '2.25rem' }}>
      <h2
        id={id}
        className="font-display"
        style={{ color: TEAL, fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', lineHeight: 1.2, marginBottom: '0.75rem' }}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}
