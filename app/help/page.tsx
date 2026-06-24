'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

type FAQItem = { q: string; a: React.ReactNode };
type FAQSection = { title: string; emoji: string; headerColor: string; items: FAQItem[] };

const TEXT = '#1e2444';
const MUTED = '#4a5280';

function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http');
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{ color: 'var(--aac-blue)', textDecoration: 'underline', fontWeight: 500 }}
    >
      {children}
    </Link>
  );
}

const SECTIONS: FAQSection[] = [
  {
    title: 'Getting Accessibility Help',
    emoji: '🔎',
    headerColor: '#0b5e48',
    items: [
      {
        q: 'I need accessibility support for my event, festival, or project. Where do I start?',
        a: <><A href="/contact">Reach out to us</A>. Our first conversation is up to one hour and completely free. Tell us what you are working on and we will figure out together what kind of support makes sense.</>,
      },
      {
        q: 'Can you help me find someone local?',
        a: <>Yes. We are building a network of accessibility professionals across the country. Contact us and we will do our best to connect you with the right person for your location and needs. <A href="/contact">Get in touch</A></>,
      },
      {
        q: 'What if I just want to learn more on my own first?',
        a: <>We have you covered. Our resources section includes guides, reading lists, films, and more — all focused on accessibility in the arts. <A href="/resources">Start with Accessibility Resources</A>, or browse <A href="/library">The Library</A> and <A href="/cinema">The Cinema</A>.</>,
      },
    ],
  },
  {
    title: 'Working With Us',
    emoji: '🤝',
    headerColor: '#7a2c0c',
    items: [
      {
        q: 'What does the Collective offer?',
        a: <>We offer advising, staffing, training, and evaluation for events, festivals, and artistic projects of all sizes. Whether you need a full accessibility plan or just a second set of eyes, we can help — or connect you with someone who can.</>,
      },
      {
        q: 'How does pricing work?',
        a: <>Your first conversation, up to one hour, is completely free. After that, we work on a sliding scale based on what we are helping you with. We want accessibility support to be within reach no matter the size of your budget.</>,
      },
      {
        q: 'How do I get started?',
        a: <><A href="/hire-us">Visit the Hire Us page</A> or <A href="/contact">send us a message</A>. Tell us a little about your project and we will take it from there.</>,
      },
    ],
  },
  {
    title: 'Join the Collective',
    emoji: '📋',
    headerColor: '#4c1d8c',
    items: [
      {
        q: 'I am an accessibility professional. How do I get listed?',
        a: <>We are growing carefully and currently invite-only. <A href="/contact">Reach out to request an invite code</A> and tell us a bit about your work.</>,
      },
      {
        q: 'What is the difference between an individual profile and a business listing?',
        a: <>Individual profiles are for accessibility professionals including interpreters, captioners, educators, audio describers, and others. Business listings are for venues, companies, and organizations. Both will appear in the directory.</>,
      },
      {
        q: 'Is it free to join?',
        a: <>Yes. Joining the Collective is completely free.</>,
      },
    ],
  },
  {
    title: 'About The Collective',
    emoji: '🌍',
    headerColor: 'var(--aac-blue)',
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
    headerColor: '#1c3a50',
    items: [
      {
        q: 'What is an Access Card?',
        a: <>An Access Card is a free account that lets you save, like, and comment on listings and resources. It is a lighter way to engage with the Collective without being listed in the directory yourself. <A href="/access-card/signup">Get a free Access Card</A></>,
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
      <>
        <header style={{ background: 'var(--aac-blue)', padding: '0.875rem 1.5rem', flexShrink: 0 }}>
          <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ display: 'inline-block' }}>
            <img src="/images/logo-across-blue-bg.svg" alt="" style={{ display: 'block', height: 44, width: 'auto' }} />
          </Link>
        </header>

        <main className="help-main" style={{ background: 'var(--aac-cream)', minHeight: '100%', padding: '0 0 3rem' }}>

          {/* Page header banner */}
          <div className="help-header" style={{
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

          {/* Keyword tip bar */}
          <div className="help-keyword-bar" style={{
            background: '#dde2f4',
            borderBottom: '1px solid rgba(38,53,144,0.12)',
            padding: '0.4rem 1.5rem',
            fontSize: '0.75rem',
            color: MUTED,
            letterSpacing: '0.02em',
            marginBottom: '1.75rem',
          }}>
            <span aria-hidden="true" style={{ marginRight: 6 }}>★</span>
            Keyword: <strong style={{ color: TEXT }}>AAC Help</strong>
            <span style={{ margin: '0 0.75rem', opacity: 0.4 }}>|</span>
            <Link href="/hire-us" style={{ color: 'var(--aac-blue)', textDecoration: 'underline', fontSize: '0.75rem' }}>
              Hire Us
            </Link>
            <span style={{ margin: '0 0.75rem', opacity: 0.4 }}>|</span>
            <Link href="/contact" style={{ color: 'var(--aac-blue)', textDecoration: 'underline', fontSize: '0.75rem' }}>
              Contact Us
            </Link>
          </div>

          <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 1rem' }}>

            {/* FAQ sections */}
            {SECTIONS.map((section) => (
              <div key={section.title} style={{ marginBottom: '1.5rem' }}>

                {/* Section header bar */}
                <div style={{
                  background: section.headerColor,
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
                <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderTop: 'none' }}>
                  {section.items.map((item, i) => {
                    const key = `${section.title}-${i}`;
                    const isOpen = open.has(key);
                    const isLast = i === section.items.length - 1;
                    return (
                      <div key={key} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.06)' }}>
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
                            background: isOpen ? 'rgba(38,53,144,0.07)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: TEXT,
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
                              color: 'var(--aac-blue)',
                              opacity: isOpen ? 1 : 0.5,
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
                            color: MUTED,
                            fontSize: '0.875rem',
                            lineHeight: 1.7,
                            background: 'rgba(38,53,144,0.04)',
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
              background: '#f0f3ff',
              border: '1px solid rgba(38,53,144,0.2)',
              display: 'flex',
              gap: '0.875rem',
              alignItems: 'flex-start',
            }}>
              <span aria-hidden="true" style={{ fontSize: '1.125rem', flexShrink: 0, marginTop: 1 }}>💡</span>
              <p style={{ color: TEXT, fontSize: '0.8125rem', lineHeight: 1.65, margin: 0 }}>
                <strong style={{ color: 'var(--aac-blue)' }}>TIP:</strong> Not sure where to start? Your first conversation with us is free, up to one hour, no strings attached.{' '}
                <A href="/contact">Send us a message</A> and we will figure out the rest together.
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

            <nav
              aria-label="Secondary"
              style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <Link href="/" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
              <Link href="/hire-us" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Hire Us</Link>
              <Link href="/contact" style={{ color: MUTED, fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
            </nav>

          </div>

          <style>{`
            @media (max-width: 580px) {
              .help-keyword-bar { display: none !important; }
              .help-main { padding: 0 0 2.5rem !important; }
              .help-header { padding: 1rem !important; }
              .help-header h1 { font-size: 1.5rem !important; }
            }
          `}</style>
        </main>
      </>
    </BrowserChrome>
  );
}
