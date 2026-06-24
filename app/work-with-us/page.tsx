'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

const BLUE = 'var(--aac-blue)';
const TEXT = '#1e2444';
const MUTED = '#4a5280';

export default function WorkWithUsPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Work With Us · Artistic Accessibility Collective';
    h1Ref.current?.focus();
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  return (
    <BrowserChrome variant="aol" desktopBg="#0d1e4a" title="Work With Us · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/work-with-us">
      <>
        <header style={{ background: 'var(--aac-blue)', padding: '0.875rem 1.5rem', flexShrink: 0 }}>
          <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
              Work With Us
            </h1>

            <p className="hire-lede" style={{ color: TEXT, lineHeight: 1.65, marginBottom: '0.875rem' }}>
              Every arts project is different. A community reading has different accessibility needs than a three-day festival. A podcast is not a live performance. A gallery opening is not a film premiere.
            </p>
            <p className="hire-lede" style={{ color: TEXT, lineHeight: 1.65, marginBottom: '2.5rem' }}>
              That is where we start: your specific project, your timeline, your goals. Then we figure out together what you actually need.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0 0 2rem' }} />

            <section aria-labelledby="services-heading" style={{ marginBottom: '2.5rem' }}>
              <h2 id="services-heading" style={{
                color: BLUE,
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                What We Do
              </h2>

              <p className="hire-body" style={{ color: TEXT, lineHeight: 1.75, marginBottom: '0.875rem' }}>
                We offer advising, staffing, accessibility designing, captioning, and producing. Not sure where to start? We sit with you and figure it out. Need ASL interpreters, CART captioners, audio describers, or other accessibility professionals for your project? We find them. Something already built that needs a look? We can evaluate it and tell you what to do next.
              </p>
              <p className="hire-body" style={{ color: TEXT, lineHeight: 1.75 }}>
                We work directly with you, or connect you with the right person from our network, depending on what the job calls for. <Link href="/contact" style={{ color: BLUE, textDecoration: 'underline' }}>Reach out any time</Link> and we will take it from there.
              </p>
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0 0 2rem' }} />

            {/* Pricing callout */}
            <section aria-labelledby="pricing-heading" style={{
              background: 'var(--aac-blue)',
              padding: '1.5rem',
              marginBottom: '2.5rem',
            }}>
              <h2 id="pricing-heading" style={{
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
                After that, we work on a sliding scale based on what you need and what we can offer. Accessibility support should be within reach no matter the size of your budget.
              </p>
            </section>

            {/* CTA */}
            <section aria-label="Get started" style={{
              border: '1px solid rgba(0,0,0,0.1)',
              padding: '1.5rem',
              marginBottom: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '1rem',
            }}>
              <p className="hire-body" style={{ color: TEXT, lineHeight: 1.6, margin: 0 }}>
                Ready to get started? Set up a free call or send us your questions.
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
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '0 0 2rem' }} />

            {/* Join the network */}
            <section aria-labelledby="join-heading" style={{ marginBottom: '3rem' }}>
              <h2 id="join-heading" style={{
                color: BLUE,
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                Are You an Accessibility Professional?
              </h2>
              <p className="hire-body" style={{ color: TEXT, lineHeight: 1.75, marginBottom: '1.25rem' }}>
                We are building a collective of ASL interpreters, captioners, audio describers, accessibility designers, and others working at the intersection of the arts and accessibility. When our clients need the right person for a job, this is who we call.
              </p>
              <Link href="/submit" className="btn btn-primary">
                Join the Collective
              </Link>
            </section>

            <nav aria-label="Page navigation" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
              <Link href="/contact" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
            </nav>

          </div>

          <style>{`
            .hire-h1 { font-size: clamp(2rem, 6vw, 3.25rem); }
            .hire-lede { font-size: clamp(0.9375rem, 2vw, 1.0625rem); max-width: 60ch; }
            .hire-body { font-size: 0.9375rem; max-width: 60ch; }
            @media (max-width: 580px) {
              .hire-h1 { font-size: 2rem !important; }
            }
          `}</style>
        </main>
      </>
    </BrowserChrome>
  );
}
