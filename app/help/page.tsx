'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

type FAQItem = { q: string; a: React.ReactNode };
type FAQSection = { title: string; emoji: string; items: FAQItem[] };

function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http');
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{ color: 'var(--aac-yellow)', textDecoration: 'underline', fontWeight: 500 }}
    >
      {children}
    </Link>
  );
}

const SECTIONS: FAQSection[] = [
  {
    title: 'Finding Accessibility Information',
    emoji: '🔎',
    items: [
      {
        q: 'What kinds of professionals and organizations are listed in the directory?',
        a: <>The directory includes ASL interpreters, CART captioners, audio describers, accessibility educators, content creators, and businesses and venues working to make the arts more accessible. <A href="/directory">Browse the directory</A></>,
      },
      {
        q: 'How do I search for someone by location or specialty?',
        a: <>Visit the <A href="/directory">directory</A> and browse by location and specialty. We are growing — check back as new members join.</>,
      },
      {
        q: 'Where can I learn more about arts accessibility?',
        a: <>We are building a library of resources including guides, films, and more. Explore <A href="/resources">Accessibility Resources</A>, <A href="/library">The Library</A>, and <A href="/cinema">The Cinema</A> as we add content.</>,
      },
    ],
  },
  {
    title: 'Getting Listed',
    emoji: '📋',
    items: [
      {
        q: 'How do I get listed in the directory?',
        a: <>We are in beta and growing carefully. You will need an invite code to join. <A href="/contact">Reach out to request one</A></>,
      },
      {
        q: 'What is the difference between an individual profile and a business listing?',
        a: <>Individual profiles are for accessibility professionals including interpreters, captioners, educators, and others. Business listings are for venues, companies, and organizations. Both appear in the directory.</>,
      },
      {
        q: 'Is it free to join?',
        a: <>Yes. Joining the directory is completely free.</>,
      },
    ],
  },
  {
    title: 'Finding and Hiring',
    emoji: '🤝',
    items: [
      {
        q: 'How do I find an accessibility professional or service?',
        a: <>Browse the <A href="/directory">directory</A> to see who is listed. As the Collective grows, you will find more professionals across more specialties and locations.</>,
      },
      {
        q: 'How do I hire someone?',
        a: <><A href="/hire-us">Visit the Hire Us page</A> or <A href="/contact">contact us directly</A>. Tell us what you are looking for and we will connect you with the right person from our network.</>,
      },
    ],
  },
  {
    title: 'About The Collective',
    emoji: '🌍',
    items: [
      {
        q: 'What is the Artistic Accessibility Collective?',
        a: <>The full story is on our <A href="/about">Who Are We</A> page.</>,
      },
    ],
  },
  {
    title: 'Your Account',
    emoji: '🪪',
    items: [
      {
        q: 'What is an Access Card?',
        a: <>An Access Card is a free account that lets you save, like, and comment on listings and resources. It is a lighter way to engage with the Collective without being listed in the directory yourself. <A href="/login">Sign in or create an account</A></>,
      },
      {
        q: 'How do I log in?',
        a: <>Head to the <A href="/login">login page</A>. We use a magic link — enter your email and we will send you a sign-in link. No password required, though you can set one if you prefer.</>,
      },
    ],
  },
];

export default function HelpPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = 'Help · Artistic Accessibility Collective';
    h1Ref.current?.focus();
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  function toggle(key: string) {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <BrowserChrome variant="aol" desktopBg="#0d1e4a" title="Help — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/help">
      <main style={{ background: 'var(--aac-navy)', minHeight: '100%', padding: '2.5rem 1rem 3rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Logo */}
          <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ display: 'inline-block', marginBottom: '2rem' }}>
            <Logo alt="" height={72} />
          </Link>

          {/* Page header banner */}
          <div style={{
            background: 'var(--aac-blue)',
            padding: '1.25rem 1.5rem',
            marginBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <span aria-hidden="true" style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>❓</span>
            <div>
              <h1
                ref={h1Ref}
                tabIndex={-1}
                className="font-display"
                style={{ color: '#fff', fontSize: '2rem', lineHeight: 1, margin: 0, outline: 'none' }}
              >
                Help &amp; FAQ
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                Find answers below, or{' '}
                <Link href="/contact" style={{ color: 'var(--aac-yellow)', textDecoration: 'underline' }}>
                  contact us
                </Link>{' '}
                and we will get back to you.
              </p>
            </div>
          </div>

          {/* Keyword tip bar — period-accurate AOL detail */}
          <div style={{
            background: '#1a2e6e',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '0.4rem 1.5rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.02em',
            marginBottom: '2rem',
          }}>
            <span aria-hidden="true" style={{ marginRight: 6 }}>★</span>
            Keyword: <strong style={{ color: 'rgba(255,255,255,0.75)' }}>AAC Help</strong>
            <span style={{ margin: '0 0.75rem', opacity: 0.4 }}>|</span>
            <Link href="/directory" style={{ color: 'var(--aac-blue-light)', textDecoration: 'underline', fontSize: '0.75rem' }}>
              Go to Directory
            </Link>
            <span style={{ margin: '0 0.75rem', opacity: 0.4 }}>|</span>
            <Link href="/contact" style={{ color: 'var(--aac-blue-light)', textDecoration: 'underline', fontSize: '0.75rem' }}>
              Contact Us
            </Link>
          </div>

          {/* FAQ sections */}
          {SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: '1.5rem' }}>

              {/* Section header bar */}
              <div style={{
                background: 'var(--aac-blue)',
                padding: '0.45rem 0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span aria-hidden="true" style={{ fontSize: '0.875rem', lineHeight: 1 }}>{section.emoji}</span>
                <h2 style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  margin: 0,
                }}>
                  {section.title}
                </h2>
              </div>

              {/* Questions */}
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none' }}>
                {section.items.map((item, i) => {
                  const key = `${section.title}-${i}`;
                  const isOpen = open.has(key);
                  const isLast = i === section.items.length - 1;
                  return (
                    <div key={key} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
                      <button
                        aria-expanded={isOpen}
                        aria-controls={`answer-${key}`}
                        onClick={() => toggle(key)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.625rem',
                          padding: '0.75rem 0.875rem',
                          background: isOpen ? 'rgba(38,53,144,0.35)' : 'rgba(255,255,255,0.03)',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: '#fff',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          lineHeight: 1.45,
                          transition: 'background 0.1s',
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            flexShrink: 0,
                            fontSize: '0.625rem',
                            marginTop: '0.35rem',
                            color: 'var(--aac-yellow)',
                            opacity: isOpen ? 1 : 0.6,
                          }}
                        >
                          {isOpen ? '▼' : '▶'}
                        </span>
                        <span>{item.q}</span>
                      </button>
                      <div
                        id={`answer-${key}`}
                        hidden={!isOpen}
                        style={{
                          padding: '0 0.875rem 0.875rem 2rem',
                          color: 'rgba(255,255,255,0.72)',
                          fontSize: '0.875rem',
                          lineHeight: 1.7,
                          background: 'rgba(38,53,144,0.2)',
                        }}
                      >
                        {item.a}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Tip box */}
          <div style={{
            margin: '2rem 0',
            padding: '1rem 1.25rem',
            background: 'rgba(245,216,74,0.08)',
            border: '1px solid rgba(245,216,74,0.3)',
            display: 'flex',
            gap: '0.875rem',
            alignItems: 'flex-start',
          }}>
            <span aria-hidden="true" style={{ fontSize: '1.125rem', flexShrink: 0, marginTop: 1 }}>💡</span>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: 'var(--aac-yellow)' }}>TIP:</strong> Not sure where to start? Try{' '}
              <A href="/hire-us">Hire Us</A> if you are looking for accessibility support, or{' '}
              <A href="/submit">Join the Collective</A> if you are a professional who wants to be found.
            </p>
          </div>

          {/* Still need help CTA */}
          <div style={{
            background: 'var(--aac-blue)',
            padding: '1.5rem',
            textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem', marginBottom: '1rem', fontWeight: 500 }}>
              Still have questions?
            </p>
            <Link href="/contact" className="btn btn-primary">Contact Us</Link>
          </div>

          {/* Footer nav */}
          <nav
            aria-label="Secondary"
            style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
            <Link href="/directory" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Directory</Link>
            <Link href="/contact" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
          </nav>

        </div>
      </main>
    </BrowserChrome>
  );
}
