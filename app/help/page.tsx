'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

// ── Site map for search ───────────────────────────────────────────────────────

const PAGES = [
  {
    title: 'Accessibility Resources',
    url: '/resources',
    category: 'Resources',
    description: 'A curated directory of tools, guides, organizations, and standards for accessibility in the arts — captioning, audio description, ASL interpretation, WCAG, and more.',
    keywords: ['resource', 'tool', 'guide', 'accessibility', 'caption', 'captioning', 'audio description', 'asl', 'interpreter', 'interpreting', 'wcag', 'standard', 'organization', 'technology', 'software', 'deaf', 'blind', 'disability', 'access', 'arts', 'describe'],
  },
  {
    title: 'The Library',
    url: '/library',
    category: 'Resources',
    description: 'A community-curated reading list of books, essays, articles, zines, and toolkits on disability arts and justice — many free to access.',
    keywords: ['library', 'book', 'read', 'essay', 'article', 'research', 'disability', 'justice', 'zine', 'toolkit', 'free', 'catalog', 'literature', 'reading', 'learn'],
  },
  {
    title: 'The Cinema',
    url: '/cinema',
    category: 'Resources',
    description: 'A curated TV-guide-style listing of films, documentaries, podcasts, and video essays about disability arts and accessibility.',
    keywords: ['cinema', 'film', 'movie', 'documentary', 'watch', 'video', 'podcast', 'performance', 'recording', 'series', 'show', 'tv', 'television', 'stream'],
  },
  {
    title: 'Join the Collective',
    url: '/submit',
    category: 'Membership',
    description: 'Apply to create your member profile or register your accessible business or event.',
    keywords: ['join', 'register', 'sign up', 'member', 'apply', 'application', 'profile', 'business', 'event', 'collective', 'community', 'become', 'create'],
  },
  {
    title: 'Member Login',
    url: '/login',
    category: 'Membership',
    description: 'Log in to your member account with a one-click magic link or password.',
    keywords: ['login', 'sign in', 'log in', 'password', 'magic link', 'account', 'member', 'access', 'existing'],
  },
  {
    title: 'Member Directory',
    url: '/members',
    category: 'Membership',
    description: 'Browse and search the directory of Collective members — ASL interpreters, captioners, audio describers, educators, and more.',
    keywords: ['directory', 'member', 'find', 'browse', 'professional', 'interpreter', 'captioner', 'describer', 'educator', 'hire', 'people', 'who', 'list'],
  },
  {
    title: 'Contact Us',
    url: '/contact',
    category: 'Connect',
    description: 'Send us a message with questions, suggestions, or just to say hello.',
    keywords: ['contact', 'email', 'question', 'message', 'reach out', 'support', 'hello', 'talk', 'speak'],
  },
  {
    title: 'Share Feedback',
    url: '/share-feedback',
    category: 'Connect',
    description: 'Share your thoughts on the platform and help shape what gets built next. No account needed.',
    keywords: ['feedback', 'suggestion', 'idea', 'improve', 'opinion', 'thought', 'suggest', 'input'],
  },
  {
    title: 'Make Art',
    url: '/make-art',
    category: 'Community',
    description: 'Coming soon: a space for collaborative, accessible art-making by and for the disability arts community.',
    keywords: ['art', 'make', 'create', 'collaborate', 'creative', 'design', 'draw', 'paint', 'artistic', 'craft'],
  },
];

const STOP_WORDS = new Set([
  'a','an','the','is','it','in','on','at','to','for','of','and','or','but',
  'i','me','my','do','can','how','where','what','who','find','get','want',
  'need','about','some','are','be','was','were','have','has','had','will',
  'would','could','should','with','this','that','from','by','as','up','out',
  'more','help','please','show','tell','looking',
]);

type Result = typeof PAGES[number] & { score: number };

function runSearch(query: string): Result[] {
  const raw = query.toLowerCase().replace(/[?!.,]/g, ' ');
  const tokens = raw.split(/\s+/).filter(t => t.length > 1 && !STOP_WORDS.has(t));

  if (tokens.length === 0) return PAGES.map(p => ({ ...p, score: 1 }));

  const scored = PAGES.map(page => {
    let score = 0;
    for (const token of tokens) {
      for (const kw of page.keywords) {
        if (kw === token) score += 4;
        else if (kw.startsWith(token) || token.startsWith(kw)) score += 2;
        else if (kw.includes(token) || token.includes(kw)) score += 1;
      }
      if (page.title.toLowerCase().includes(token)) score += 6;
      if (page.description.toLowerCase().includes(token)) score += 1;
    }
    return { ...page, score };
  });

  return scored.filter(p => p.score > 0).sort((a, b) => b.score - a.score);
}

// ── Category badge colors ─────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  Resources:  { bg: '#007700', fg: '#ffffff' },
  Membership: { bg: '#000077', fg: '#ffffff' },
  Connect:    { bg: '#770000', fg: '#ffffff' },
  Community:  { bg: '#774400', fg: '#ffffff' },
};

// ── InfoGuy SVG — the classic "i" info icon, given a personality ─────────────

function InfoGuy({ size = 120 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={Math.round(size * 1.2)}
      viewBox="0 0 80 96"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* ── Drop shadow ── */}
      <ellipse cx="40" cy="94" rx="22" ry="4" fill="rgba(0,0,0,0.12)" />

      {/* ── Main circle body ── */}
      <circle cx="40" cy="36" r="32" fill="#1864c8" />
      {/* Inner highlight — gives it the classic icon look */}
      <ellipse cx="30" cy="20" rx="10" ry="6" fill="white" opacity="0.15" />
      {/* Thin white ring */}
      <circle cx="40" cy="36" r="30" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25" />

      {/* ── Face (where the dot of the 'i' would be) ── */}
      {/* Left eye */}
      <circle cx="31" cy="24" r="4" fill="white" />
      <circle cx="32" cy="25" r="2" fill="#0d3a7a" />
      <circle cx="31" cy="24" r="0.8" fill="white" opacity="0.7" />
      {/* Right eye */}
      <circle cx="49" cy="24" r="4" fill="white" />
      <circle cx="50" cy="25" r="2" fill="#0d3a7a" />
      <circle cx="49" cy="24" r="0.8" fill="white" opacity="0.7" />
      {/* Friendly raised eyebrows */}
      <path d="M27,18 Q31,15 35,17" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M45,17 Q49,15 53,18" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Smile */}
      <path d="M30,35 Q40,44 50,35" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ── Bar of the 'i' (the body marking) ── */}
      <rect x="34" y="44" width="12" height="17" rx="3" fill="white" />

      {/* ── Left arm — pointing outward as if saying "this way!" ── */}
      <path d="M10,46 Q20,40 28,47" stroke="#1050a8" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="46" r="5.5" fill="#0d3a7a" />

      {/* ── Right arm — relaxed at side ── */}
      <path d="M70,50 Q60,46 52,52" stroke="#1050a8" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="71" cy="50" r="5.5" fill="#0d3a7a" />

      {/* ── Legs ── */}
      <path d="M36,67 L30,86" stroke="#1050a8" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M44,67 L50,86" stroke="#1050a8" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* Feet */}
      <ellipse cx="28" cy="88" rx="8" ry="4" fill="#0d3a7a" />
      <ellipse cx="52" cy="88" rx="8" ry="4" fill="#0d3a7a" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [query, setQuery]       = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults]   = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const resultsRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Help — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    if (searched && resultsRef.current) {
      resultsRef.current.focus();
    }
  }, [searched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setResults(runSearch(query));
    setSubmitted(query);
    setSearched(true);
  };

  const handleReset = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    setSubmitted('');
  };

  // ── Styles ──────────────────────────────────────────────────────────────────

  const cream  = '#fdf8f0';
  const red    = '#cc0000';
  const navy   = '#000066';
  const border = '#ccbbaa';
  const font   = '"Arial", "Helvetica Neue", Helvetica, sans-serif';

  return (
    <BrowserChrome variant="ie3" desktopBg="#263590" title="Help — Ask the Collective" url="http://help.artisticaccessibility.com/">
    <main
      style={{ background: cream, minHeight: '100%', fontFamily: font }}
      id="help-main"
    >

      {/* ── Header band ───────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(to bottom, #fff 0%, ${cream} 100%)`,
        borderBottom: `3px solid ${red}`,
        padding: '0',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '20px 20px 0', display: 'flex', alignItems: 'flex-end', gap: 24 }}>

          {/* Butler */}
          <div aria-hidden="true" style={{ flexShrink: 0, marginBottom: -4 }}>
            <InfoGuy size={90} />
          </div>

          {/* Brand + search ─────────────────────────────────────── */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontFamily: '"Georgia", serif',
                fontWeight: 900,
                fontSize: 36,
                color: red,
                letterSpacing: '-1px',
                lineHeight: 1,
              }}>
                Ask
              </span>
              <span style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                fontSize: 28,
                fontStyle: 'italic',
                color: '#222',
                marginLeft: 6,
                letterSpacing: '-0.5px',
              }}>
                the Collective
              </span>
              <span style={{
                display: 'inline-block',
                background: red,
                color: 'white',
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 5px',
                marginLeft: 8,
                letterSpacing: '0.05em',
                verticalAlign: 'middle',
              }}>
                BETA
              </span>
            </div>

            <p style={{ fontSize: 15, color: '#444', margin: '0 0 12px', fontStyle: 'italic' }}>
              What can I help you find today?
            </p>

            <form onSubmit={handleSearch} role="search" aria-label="Site search">
              <div style={{ display: 'flex', border: `2px solid ${border}`, background: 'white', maxWidth: 560 }}>
                {/* Tab strip */}
                <div style={{ display: 'flex', borderRight: `2px solid ${border}`, flexShrink: 0 }}>
                  {['All', 'Resources', 'Members', 'Connect'].map((t, i) => (
                    <div
                      key={t}
                      aria-hidden="true"
                      style={{
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: i === 0 ? 700 : 400,
                        background: i === 0 ? red : '#f0ebe0',
                        color: i === 0 ? 'white' : '#666',
                        borderRight: i < 3 ? `1px solid ${border}` : 'none',
                        cursor: 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
                {/* Input */}
                <input
                  type="search"
                  aria-label="Search the Collective"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Type a question, topic, or keyword…"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    padding: '8px 10px', fontSize: 13,
                    fontFamily: font, background: 'white',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: red, color: 'white', border: 'none',
                    padding: '0 18px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.05em',
                    fontFamily: font,
                  }}
                >
                  Ask!
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#777', marginTop: 5, fontStyle: 'italic' }}>
                Tip: Ask a full question like &ldquo;How do I find a captioner?&rdquo; or just type a keyword.
              </p>
            </form>
          </div>
        </div>

        {/* Bottom nav strip */}
        <div style={{
          background: '#f0ebe0',
          borderTop: `1px solid ${border}`,
          padding: '4px 20px',
          marginTop: 12,
          display: 'flex',
          gap: 16,
          maxWidth: 780,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {[
            ['Home', '/'],
            ['Resources', '/resources'],
            ['Members', '/members'],
            ['Contact', '/contact'],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              style={{ fontSize: 11, color: navy, textDecoration: 'underline', fontFamily: font }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Results / landing area ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 20px 48px' }}>

        {!searched ? (
          /* ── Landing state ──────────────────────────────────────────── */
          <>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 16 }}>
              Browse by category
            </h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {Object.entries(
                PAGES.reduce((acc, p) => {
                  (acc[p.category] = acc[p.category] || []).push(p);
                  return acc;
                }, {} as Record<string, typeof PAGES>)
              ).map(([cat, pages]) => (
                <div
                  key={cat}
                  style={{
                    border: `1px solid ${border}`,
                    background: 'white',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    background: CAT_COLORS[cat]?.bg ?? '#333',
                    color: CAT_COLORS[cat]?.fg ?? '#fff',
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    {cat}
                  </div>
                  <ul style={{ listStyle: 'none', padding: '8px 0', margin: 0 }}>
                    {pages.map(p => (
                      <li key={p.url}>
                        <Link
                          href={p.url}
                          style={{
                            display: 'block',
                            padding: '5px 12px',
                            color: navy,
                            textDecoration: 'underline',
                            fontSize: 13,
                          }}
                          className="help-link"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, padding: '14px 16px', background: 'white', border: `1px solid ${border}`, fontSize: 13, color: '#555' }}>
              <strong style={{ color: '#222' }}>Not sure where to start?</strong>{' '}
              Try asking: &ldquo;How do I find an ASL interpreter?&rdquo; or &ldquo;What free resources do you have on captioning?&rdquo;
            </div>
          </>
        ) : (
          /* ── Results state ──────────────────────────────────────────── */
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <h1
                ref={resultsRef}
                tabIndex={-1}
                style={{ fontSize: 15, fontWeight: 700, color: '#333', margin: 0, outline: 'none' }}
              >
                {results.length > 0
                  ? `${results.length} result${results.length !== 1 ? 's' : ''} for `
                  : 'No results for '}
                <em>&ldquo;{submitted}&rdquo;</em>
              </h1>
              <button
                onClick={handleReset}
                style={{
                  background: 'none', border: `1px solid ${border}`,
                  padding: '3px 10px', fontSize: 11, cursor: 'pointer',
                  color: navy, fontFamily: font, textDecoration: 'underline',
                }}
              >
                Clear search
              </button>
            </div>

            {results.length === 0 ? (
              <div style={{ background: 'white', border: `1px solid ${border}`, padding: '20px 16px' }}>
                <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
                  No matches found for that one. Try different words, or browse by category below.
                </p>
                <Link href="/contact" style={{ color: navy, fontSize: 13, textDecoration: 'underline' }}>
                  Still stuck? Send us a message directly.
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {results.map((page, i) => (
                  <div
                    key={page.url}
                    style={{
                      background: 'white',
                      border: `1px solid ${border}`,
                      borderTop: i === 0 ? `1px solid ${border}` : 'none',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <Link
                            href={page.url}
                            style={{ fontSize: 16, fontWeight: 700, color: navy, textDecoration: 'underline' }}
                            className="help-link"
                          >
                            {page.title}
                          </Link>
                          <span style={{
                            background: CAT_COLORS[page.category]?.bg ?? '#333',
                            color: CAT_COLORS[page.category]?.fg ?? '#fff',
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 6px',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            flexShrink: 0,
                          }}>
                            {page.category}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px', lineHeight: 1.6 }}>
                          {page.description}
                        </p>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          artisticaccessibility.com
                          <span style={{ color: border }}> › </span>
                          <span style={{ color: '#228b22' }}>{page.url.replace('/', '')}</span>
                        </div>
                      </div>
                      <Link
                        href={page.url}
                        style={{
                          display: 'inline-block',
                          background: red,
                          color: 'white',
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                          flexShrink: 0,
                          fontFamily: font,
                        }}
                        className="help-visit-btn"
                      >
                        Visit →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24, padding: '12px 16px', background: '#fff8f0', border: `1px solid ${border}`, fontSize: 12, color: '#777' }}>
              Still not finding what you need?{' '}
              <Link href="/contact" style={{ color: navy, textDecoration: 'underline' }}>
                Ask us directly
              </Link>{' '}
              and we&apos;ll point you in the right direction.
            </div>
          </>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${border}`,
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: 11,
        color: '#888',
        background: '#f0ebe0',
      }}>
        <Link href="/" style={{ color: navy, textDecoration: 'underline', marginRight: 16 }}>← Back to Home</Link>
        <Link href="/contact" style={{ color: navy, textDecoration: 'underline', marginRight: 16 }}>Contact Us</Link>
        <Link href="/share-feedback" style={{ color: navy, textDecoration: 'underline' }}>Share Feedback</Link>
      </div>

      <style>{`
        .help-link:hover, .help-link:focus-visible {
          color: ${red} !important;
          outline: 2px solid ${red};
          outline-offset: 2px;
        }
        .help-visit-btn:hover, .help-visit-btn:focus-visible {
          background: #990000 !important;
          outline: 2px solid #f5d84a;
          outline-offset: 2px;
        }
      `}</style>
    </main>
    </BrowserChrome>
  );
}
