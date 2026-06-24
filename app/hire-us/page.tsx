'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

const BLUE = 'var(--aac-blue)';
const TEXT = '#1e2444';
const MUTED = '#4a5280';

const SERVICES = [
  {
    num: '01',
    name: 'Advising',
    description: 'Not sure where to start? We sit with you, learn about your project, and help you figure out what genuine accessibility looks like for your specific situation. No judgment on where you are starting from.',
  },
  {
    num: '02',
    name: 'Staffing',
    description: 'Need ASL interpreters, CART captioners, audio describers, or other accessibility professionals? We will help you find the right people for your project, timeline, and budget.',
  },
  {
    num: '03',
    name: 'Training',
    description: 'Teach your team how to think about and build accessibility in from the start, so future projects do not have to play catch-up.',
  },
  {
    num: '04',
    name: 'Evaluation',
    description: 'Already have something built? We will review what is working, what is not, and what to do next: whether that is a live event, a digital platform, or a long-running program.',
  },
];

export default function HireUsPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Hire Us · Artistic Accessibility Collective';
    h1Ref.current?.focus();
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  return (
    <BrowserChrome variant="aol" desktopBg="#0d1e4a" title="Hire Us · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/hire-us">
      <>
        <header style={{ background: 'var(--aac-blue)', padding: '0.875rem 1.5rem', flexShrink: 0 }}>
          <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ display: 'inline-block' }}>
            <img src="/images/logo-across-blue-bg.svg" alt="" style={{ display: 'block', height: 44, width: 'auto' }} />
          </Link>
        </header>

        <main style={{ background: 'var(--aac-cream)', minHeight: '100%', padding: '2.5rem 1rem 3.5rem' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>

            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-display hire-h1"
              style={{ color: BLUE, lineHeight: 1.05, marginBottom: '1rem', outline: 'none' }}
            >
              Hire Us
            </h1>

            <p className="hire-lede" style={{ color: TEXT, lineHeight: 1.65, marginBottom: '0.875rem' }}>
              Every arts project is different. A community reading has different accessibility needs than a three-day festival. A podcast is not a live performance. A gallery opening is not a film premiere.
            </p>
            <p className="hire-lede" style={{ color: TEXT, lineHeight: 1.65, marginBottom: '2.5rem' }}>
              That is where we start, with your specific project, your timeline, and your goals. Then we figure out together what you actually need.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0 0 2rem' }} />

            <section aria-labelledby="services-heading" style={{ marginBottom: '2.5rem' }}>
              <h2 id="services-heading" style={{
                color: MUTED,
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
              }}>
                What We Offer
              </h2>

              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {SERVICES.map((s, i) => (
                  <li
                    key={s.num}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '1.25rem',
                      paddingBottom: '1.75rem',
                      marginBottom: i < SERVICES.length - 1 ? '1.75rem' : 0,
                      borderBottom: i < SERVICES.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none',
                      alignItems: 'start',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="font-display hire-service-num"
                      style={{ color: 'var(--aac-blue)', lineHeight: 1, userSelect: 'none' }}
                    >
                      {s.num}
                    </span>
                    <div>
                      <h3 className="font-display hire-service-name" style={{ color: TEXT, lineHeight: 1.1, marginBottom: '0.5rem' }}>
                        {s.name}
                      </h3>
                      <p className="hire-service-desc" style={{ color: MUTED, lineHeight: 1.7 }}>
                        {s.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Pricing callout */}
            <div style={{
              background: 'var(--aac-blue)',
              padding: '1.5rem',
              marginBottom: '2.5rem',
            }}>
              <h2 style={{
                color: 'var(--aac-yellow)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}>
                Pricing
              </h2>
              <p className="hire-body" style={{ color: '#fff', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                Your first conversation is free, up to one hour, no strings attached.
              </p>
              <p className="hire-body" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                After that, we work on a sliding scale based on what you need and what we can offer. Accessibility support should be within reach no matter the size of your budget. We can advise directly or connect you with the right people for the job.
              </p>
            </div>

            {/* CTA */}
            <div style={{
              border: '1px solid rgba(0,0,0,0.1)',
              padding: '1.5rem',
              marginBottom: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '1rem',
            }}>
              <p className="hire-body" style={{ color: TEXT, lineHeight: 1.6, margin: 0 }}>
                Ready to get started? Set up a free call or send us your questions. We will take it from there.
              </p>
              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-primary">Set Up a Free Call</Link>
                <Link href="/contact" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.625rem 1.25rem',
                  border: '1px solid var(--aac-blue)',
                  color: 'var(--aac-blue)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}>
                  Ask a Question
                </Link>
              </div>
            </div>

            <nav aria-label="Secondary" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
              <Link href="/about" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>About Us</Link>
              <Link href="/contact" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
            </nav>

          </div>

          <style>{`
            .hire-h1 { font-size: clamp(2rem, 6vw, 3.25rem); }
            .hire-lede { font-size: clamp(0.9375rem, 2vw, 1.0625rem); max-width: 60ch; }
            .hire-service-num { font-size: clamp(1.5rem, 4vw, 2.25rem); }
            .hire-service-name { font-size: clamp(1.25rem, 3vw, 1.75rem); }
            .hire-service-desc { font-size: 0.9375rem; max-width: 55ch; }
            .hire-body { font-size: 0.9375rem; max-width: 60ch; }
            @media (max-width: 580px) {
              .hire-h1 { font-size: 2rem !important; }
              .hire-service-num { font-size: 1.5rem !important; }
              .hire-service-name { font-size: 1.25rem !important; }
            }
          `}</style>
        </main>
      </>
    </BrowserChrome>
  );
}
