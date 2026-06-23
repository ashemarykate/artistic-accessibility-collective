'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

const BG = '#0d5c4a';

export default function AboutPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'About Us · Artistic Accessibility Collective';
    h1Ref.current?.focus();
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  return (
    <BrowserChrome variant="aol" desktopBg={BG} title="Who Are We — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/about">
      <main style={{ background: BG, minHeight: '100%', padding: '2.5rem 1rem 3.5rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ display: 'inline-block', marginBottom: '2.5rem' }}>
            <Logo alt="" height={72} />
          </Link>

          {/* Opening */}
          <h1
            ref={h1Ref}
            tabIndex={-1}
            className="font-display about-h1"
            style={{ color: '#fff', lineHeight: 1.05, marginBottom: '1.25rem', outline: 'none' }}
          >
            Who Are We
          </h1>

          <p className="about-lede" style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            Accessibility professionals in the arts have been doing essential, skilled, invisible work for decades. The Artistic Accessibility Collective exists to change the invisible part.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.18)', margin: '0 0 2.5rem' }} />

          {/* What we are */}
          <section aria-labelledby="section-what" style={{ marginBottom: '2.25rem' }}>
            <h2 id="section-what" style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.625rem',
            }}>
              What We Are
            </h2>
            <p className="about-body" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75 }}>
              A home base for ASL interpreters, CART captioners, audio describers, accessibility educators, content creators, and the businesses and organizations making arts experiences genuinely accessible to everyone. A directory and a community — built by and for the people who know this field.
            </p>
          </section>

          {/* Why we exist */}
          <section aria-labelledby="section-why" style={{ marginBottom: '2.25rem' }}>
            <h2 id="section-why" style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.625rem',
            }}>
              Why We Exist
            </h2>
            <p className="about-body" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75 }}>
              Because arts accessibility is not a compliance checkbox. It is skilled craft, lived expertise, and ongoing community practice. The people doing this work deserve a place that treats it that way — where the work is celebrated and the community is centered.
            </p>
          </section>

          {/* Emphasized statement — brand voice */}
          <p style={{
            color: '#fff',
            fontStyle: 'italic',
            lineHeight: 1.55,
            margin: '0 0 2.5rem',
            padding: '1.25rem 1.5rem',
            background: 'rgba(255,255,255,0.07)',
            borderTop: '2px solid rgba(255,255,255,0.25)',
            borderBottom: '2px solid rgba(255,255,255,0.25)',
          }} className="about-pull">
            Playfulness and rigor are not opposites here. The community does hard, skilled, important work — and this place should feel like it.
          </p>

          {/* Where we are */}
          <section aria-labelledby="section-where" style={{ marginBottom: '3rem' }}>
            <h2 id="section-where" style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.625rem',
            }}>
              Where We Are
            </h2>
            <p className="about-body" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, marginBottom: '0.875rem' }}>
              The Collective was founded by Mary Kate Ashe. We are currently in beta, growing carefully and intentionally with a community of invited members.
            </p>
            <p className="about-body" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75 }}>
              If you are an accessibility professional in the arts, or an organization that wants to be part of building something real — we would love to have you.
            </p>
          </section>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link href="/contact" className="btn btn-primary">Get in Touch</Link>
            <Link href="/hire-us" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.625rem 1.25rem',
              border: '1px solid rgba(255,255,255,0.35)',
              color: 'rgba(255,255,255,0.85)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}>
              Hire Us
            </Link>
          </div>

          <nav aria-label="Secondary" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
            <Link href="/hire-us" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Hire Us</Link>
            <Link href="/contact" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
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
    </BrowserChrome>
  );
}
