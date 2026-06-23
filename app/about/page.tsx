'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

const TEAL = '#0d5c4a';
const TEXT = '#1e2444';
const MUTED = '#4a5280';

export default function AboutPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'About Us · Artistic Accessibility Collective';
    h1Ref.current?.focus();
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  return (
    <BrowserChrome variant="aol" desktopBg="#0d1e4a" title="Who Are We — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/about">
      <>
        <header style={{ background: TEAL, padding: '0.875rem 1.5rem', flexShrink: 0 }}>
          <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ display: 'inline-block' }}>
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
              Who Are We
            </h1>

            <p className="about-lede" style={{ color: TEXT, lineHeight: 1.65, marginBottom: '2.5rem' }}>
              Accessibility professionals in the arts have been doing essential, skilled, invisible work for decades. The Artistic Accessibility Collective exists to change the invisible part.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0 0 2.5rem' }} />

            <section aria-labelledby="section-what" style={{ marginBottom: '2.25rem' }}>
              <h2 id="section-what" style={{ color: MUTED, fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
                What We Are
              </h2>
              <p className="about-body" style={{ color: TEXT, lineHeight: 1.75 }}>
                A home base for ASL interpreters, CART captioners, audio describers, accessibility educators, content creators, and the businesses and organizations making arts experiences genuinely accessible to everyone. A directory and a community, built by and for the people who know this field.
              </p>
            </section>

            <section aria-labelledby="section-why" style={{ marginBottom: '2.25rem' }}>
              <h2 id="section-why" style={{ color: MUTED, fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
                Why We Exist
              </h2>
              <p className="about-body" style={{ color: TEXT, lineHeight: 1.75 }}>
                Because arts accessibility is not a compliance checkbox. It is skilled craft, lived expertise, and ongoing community practice. The people doing this work deserve a place that treats it that way: where the work is celebrated and the community is centered.
              </p>
            </section>

            <p style={{
              color: '#fff',
              fontStyle: 'italic',
              lineHeight: 1.55,
              margin: '0 0 2.5rem',
              padding: '1.25rem 1.5rem',
              background: TEAL,
            }} className="about-pull">
              Playfulness and rigor are not opposites here. The community does hard, skilled, important work, and this place should feel like it.
            </p>

            <section aria-labelledby="section-where" style={{ marginBottom: '3rem' }}>
              <h2 id="section-where" style={{ color: MUTED, fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
                Where We Are
              </h2>
              <p className="about-body" style={{ color: TEXT, lineHeight: 1.75 }}>
                We are currently in beta, growing carefully and intentionally with a community of invited members. If you work in arts accessibility, we would love to have you.
              </p>
            </section>

            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <Link href="/contact" className="btn btn-primary">Get in Touch</Link>
              <Link href="/hire-us" style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.625rem 1.25rem',
                border: `1px solid ${TEAL}`,
                color: TEAL,
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}>
                Hire Us
              </Link>
            </div>

            <nav aria-label="Secondary" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
              <Link href="/hire-us" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Hire Us</Link>
              <Link href="/contact" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
            </nav>

          </div>

          <style>{`
            .about-h1 { font-size: clamp(2rem, 6vw, 3.25rem); }
            .about-lede { font-size: clamp(1rem, 2.5vw, 1.1875rem); max-width: 58ch; }
            .about-body { font-size: 0.9375rem; max-width: 62ch; }
            .about-pull { font-size: clamp(0.9375rem, 2vw, 1.125rem); max-width: 56ch; }
            @media (max-width: 580px) {
              .about-h1 { font-size: 2rem !important; }
              .about-pull { padding: 1rem !important; }
            }
          `}</style>
        </main>
      </>
    </BrowserChrome>
  );
}
