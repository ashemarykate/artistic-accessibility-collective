'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

const BLUE = 'var(--aac-blue)';
const TEAL = '#0d5c4a';
const TEXT = '#1e2444';
const MUTED = '#4a5280';

const SERVICES = [
  {
    num: '1',
    tilt: -1.5,
    name: 'Talk it through',
    description: 'Not sure where to start? Almost nobody is. Tell us about your project and we will help you figure out what access can look like for it. No judgment, no jargon, no pop quiz.',
  },
  {
    num: '2',
    tilt: 1.2,
    name: 'Find your people',
    description: 'ASL interpreters, CART captioners, audio describers, access consultants: the Collective is full of people who love this work. We will connect you with the right ones for your project.',
  },
  {
    num: '3',
    tilt: -1,
    name: 'Learn it together',
    description: 'We train teams to think about access from day one, so it stops being the scramble at the end and starts being part of how you make things.',
  },
  {
    num: '4',
    tilt: 1.5,
    name: 'Get a second look',
    description: 'Already have something out in the world? An event, a platform, a program? We will tell you what is working, what is not, and what to try next. Kindly, but honestly.',
  },
];

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
          <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ transform: 'rotate(-1.2deg)', display: 'inline-block' }}>
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
              style={{ color: BLUE, lineHeight: 1.05, marginBottom: '1.25rem', outline: 'none' }}
            >
              Work With Us
            </h1>

            <p className="hire-lede" style={{ color: TEXT, lineHeight: 1.65, marginBottom: '0.875rem' }}>
              Making art accessible is a craft, and nobody should have to figure it out alone.
            </p>
            <p className="hire-lede" style={{ color: TEXT, lineHeight: 1.65, marginBottom: '2.75rem' }}>
              Whether you are putting on a play, opening a gallery show, running a festival, or making something we do not have a name for yet, we would love to help you make it{' '}
              <span style={{ background: 'var(--aac-yellow)', padding: '0 0.25em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}>for everyone</span>.
            </p>

            <section aria-labelledby="services-heading" style={{ marginBottom: '3rem' }}>
              <h2 id="services-heading" className="font-display hire-h2" style={{ color: TEAL, lineHeight: 1.1, marginBottom: '1.75rem' }}>
                How We Can Help
              </h2>

              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1.875rem' }}>
                {SERVICES.map((s) => (
                  <li
                    key={s.num}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr',
                      gap: '1.125rem',
                      alignItems: 'start',
                    }}
                  >
                    <span
                      className="font-display hire-service-num"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2.5rem',
                        height: '2.5rem',
                        background: 'var(--aac-yellow)',
                        border: '1px solid var(--aac-blue-dark)',
                        color: 'var(--aac-blue-dark)',
                        lineHeight: 1,
                        userSelect: 'none',
                        transform: `rotate(${s.tilt}deg)`,
                        marginTop: '0.2rem',
                      }}
                    >
                      {s.num}
                    </span>
                    <div>
                      <h3 className="font-display hire-service-name" style={{ color: BLUE, lineHeight: 1.1, marginBottom: '0.4rem' }}>
                        {s.name}
                      </h3>
                      <p className="hire-service-desc" style={{ color: TEXT, lineHeight: 1.7 }}>
                        {s.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="hire-body" style={{ color: TEXT, lineHeight: 1.75, marginTop: '1.875rem' }}>
                Sometimes we do the work ourselves, and sometimes we bring in exactly the right person from the Collective. Either way, you are in good hands. <Link href="/contact" style={{ color: BLUE, textDecoration: 'underline' }}>Reach out any time</Link> and we will take it from there.
              </p>
            </section>

            {/* The money part */}
            <section aria-labelledby="pricing-heading" style={{
              background: 'var(--aac-blue)',
              padding: '1.625rem 1.75rem 1.75rem',
              marginBottom: '3rem',
            }}>
              <h2 id="pricing-heading" className="font-display hire-h2" style={{ color: 'var(--aac-yellow)', lineHeight: 1.1, marginBottom: '0.875rem' }}>
                The Money Part
              </h2>
              <p className="hire-body" style={{ color: '#fff', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                Your first conversation with us is free, full stop. After that, we work on a sliding scale: what you pay depends on what you need and where you are starting from.
              </p>
              <p className="hire-body" style={{ color: '#fff', lineHeight: 1.7, marginBottom: '1.375rem' }}>
                If your budget is small, talk to us anyway. Access should be within everyone&apos;s reach, including yours.
              </p>
              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                <Link href="/contact" className="btn btn-on-blue">Set Up a Free Call</Link>
                <Link href="/contact" className="btn btn-outline-white">Ask a Question</Link>
              </div>
            </section>

            {/* Join the collective */}
            <section aria-labelledby="join-heading" style={{ marginBottom: '3rem' }}>
              <h2 id="join-heading" className="font-display hire-h2" style={{ color: TEAL, lineHeight: 1.1, marginBottom: '0.875rem' }}>
                Do You Do This Work?
              </h2>
              <p className="hire-body" style={{ color: TEXT, lineHeight: 1.75, marginBottom: '1.25rem' }}>
                The Collective is a growing community of ASL interpreters, captioners, audio describers, educators, artists, and access nerds of every kind. When someone needs the right person for a job, this is who we call. Come join us.
              </p>
              <Link href="/submit" className="btn btn-primary">
                Join the Collective
              </Link>
            </section>

            <nav aria-label="Page navigation" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
              <Link href="/about" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>About Us</Link>
              <Link href="/contact" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
            </nav>

          </div>

          <style>{`
            .hire-h1 { font-size: clamp(2rem, 6vw, 3.25rem); }
            .hire-h2 { font-size: clamp(1.375rem, 3.5vw, 1.875rem); }
            .hire-lede { font-size: clamp(1rem, 2.5vw, 1.1875rem); max-width: 58ch; }
            .hire-service-num { font-size: 1.25rem; }
            .hire-service-name { font-size: clamp(1.125rem, 2.5vw, 1.5rem); }
            .hire-service-desc { font-size: 0.9375rem; max-width: 55ch; }
            .hire-body { font-size: 0.9375rem; max-width: 60ch; }
            @media (max-width: 580px) {
              .hire-h1 { font-size: 2rem !important; }
              .hire-h2 { font-size: 1.375rem !important; }
              .hire-service-name { font-size: 1.125rem !important; }
            }
          `}</style>
        </main>
      </>
    </BrowserChrome>
  );
}
