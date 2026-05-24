'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

// OPAC amber palette
const C = {
  bg:      '#0a0e0a',
  bg2:     '#0f140e',
  amber:   '#ffb000',
  hi:      '#ffd166',
  dim:     '#b87800',
  green:   '#4dff7c',
  red:     '#ff5a4a',
  cyan:    '#5ce1ff',
  mono:    '"Courier New", Courier, monospace',
};

export default function LibraryPage() {
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<FormStatus>('idle');
  const [suggest, setSuggest] = useState({ title: '', author: '', why: '', name: '', email: '' });
  const [suggestStatus, setSuggestStatus] = useState<FormStatus>('idle');
  const [clock, setClock] = useState('');
  const [dots, setDots] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  async function post(body: object) {
    return fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyStatus('loading');
    try {
      const res = await post({ name: 'Library Notify', email: notifyEmail.trim(), subject: 'Library — Notify Me signup', message: `Notify when Library launches: ${notifyEmail.trim()}` });
      setNotifyStatus(res.ok ? 'success' : 'error');
    } catch { setNotifyStatus('error'); }
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!suggest.title.trim() || !suggest.author.trim()) return;
    setSuggestStatus('loading');
    try {
      const res = await post({
        name: suggest.name.trim() || 'Anonymous', email: suggest.email.trim() || 'no-reply@artisticaccessibility.com',
        subject: `Library Book Suggestion: ${suggest.title.trim()}`,
        message: [`Book: ${suggest.title.trim()}`, `Author: ${suggest.author.trim()}`, suggest.why.trim() ? `Notes: ${suggest.why.trim()}` : '', suggest.name.trim() ? `From: ${suggest.name.trim()}` : ''].filter(Boolean).join('\n'),
      });
      setSuggestStatus(res.ok ? 'success' : 'error');
    } catch { setSuggestStatus('error'); }
  }

  const inputSty: React.CSSProperties = { background: C.bg, border: `1px solid ${C.amber}`, color: C.hi, fontFamily: C.mono, fontSize: 14, padding: '7px 10px', width: '100%', boxSizing: 'border-box', textShadow: `0 0 4px rgba(255,176,0,0.4)` };
  const labelSty: React.CSSProperties = { display: 'block', color: C.amber, fontFamily: C.mono, fontSize: 12, letterSpacing: '0.06em', marginBottom: 4 };
  const labelDots = (s: string) => `${s}...........:`;

  // Subject index entries
  const subjects = [
    { code: '01', label: 'Disability Justice & Arts', count: 12 },
    { code: '02', label: 'Audio Description', count: 9 },
    { code: '03', label: 'Captioning & CART', count: 8 },
    { code: '04', label: 'Deaf Culture & ASL', count: 7 },
    { code: '05', label: 'Theater & Live Performance', count: 11 },
    { code: '06', label: 'Film & Video Accessibility', count: 10 },
    { code: '07', label: 'Digital / Web Accessibility', count: 13 },
    { code: '08', label: 'Crip Theory & Mad Pride', count: 6 },
    { code: '09', label: 'Syllabi & Curricula', count: 5 },
    { code: '10', label: 'First-Person Accounts', count: 14 },
  ];

  return (
    <main style={{ minHeight: '100vh', background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%), repeating-linear-gradient(0deg, rgba(255,176,0,0.035) 0 1px, transparent 1px 3px), ${C.bg}`, fontFamily: C.mono, color: C.amber, position: 'relative', overflow: 'hidden' }}>
      <h1 className="sr-only">The Library — Artistic Accessibility Collective</h1>

      {/* CRT scanline overlay */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)', mixBlendMode: 'multiply' }} />
      {/* CRT vignette */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 61, boxShadow: 'inset 0 0 120px 20px rgba(0,0,0,0.7)' }} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '18px 24px 40px', position: 'relative', zIndex: 1 }}>

        {/* Status bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '7px 14px', marginBottom: 10, border: `1px solid ${C.amber}`, background: C.bg2, fontSize: 13, letterSpacing: '0.04em' }} aria-label="System status">
          <span>
            <span aria-hidden="true" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, marginRight: 8, verticalAlign: 'middle', animation: 'blink 1.4s steps(2,end) infinite' }} />
            SYSTEM ONLINE · OPAC v3.04
          </span>
          <span style={{ textAlign: 'center', color: C.dim }}>THE LIBRARY · COMING SOON</span>
          <span style={{ textAlign: 'right', color: C.dim }}>{clock}</span>
        </div>

        {/* Masthead / ASCII logo */}
        <div style={{ padding: '16px 20px', border: `1px solid ${C.amber}`, background: `repeating-linear-gradient(135deg, rgba(255,176,0,0.04) 0 6px, transparent 6px 12px), ${C.bg2}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center', marginBottom: 14 }}>
          <div>
            <a href="/" style={{ display: 'block', textDecoration: 'none' }} aria-label="Artistic Accessibility Collective — Home">
              <pre aria-hidden="true" style={{ fontFamily: C.mono, fontSize: 18, lineHeight: 1.0, whiteSpace: 'pre', color: C.amber, margin: 0, textShadow: `0 0 2px rgba(255,176,0,0.5), 0 0 10px rgba(255,176,0,0.25)` }}>{`╔═══════════════════════════════════════╗
║  A R T I S T I C  A C C E S S I B L  ║
║  I T Y  C O L L E C T I V E          ║
╚═══════════════════════════════════════╝`}</pre>
            </a>
            <div style={{ fontSize: 36, fontWeight: 400, letterSpacing: '0.04em', margin: '8px 0 0', color: C.hi, textShadow: `0 0 4px rgba(255,209,102,0.4), 0 0 16px rgba(255,176,0,0.3)` }}>
              THE LIBRARY
            </div>
            <div style={{ fontSize: 13, letterSpacing: '0.06em', color: C.amber }}>ONLINE PUBLIC ACCESS CATALOG · DISABILITY ARTS EDITION</div>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.8, textAlign: 'right', color: C.dim }}>
            <div><span style={{ color: C.amber }}>HOLDINGS.......:</span> COMING SOON</div>
            <div><span style={{ color: C.amber }}>SUBJECTS.......:  </span>10 AREAS</div>
            <div><span style={{ color: C.amber }}>STATUS.........:  </span><span style={{ color: C.green }}>OPEN</span></div>
          </div>
        </div>

        {/* Amber highlight strip */}
        <div style={{ padding: '12px 20px', background: C.amber, color: C.bg, textShadow: 'none', fontFamily: C.mono, fontSize: 18, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <span>★ A curated reading list for disability arts practitioners</span>
          <span style={{ fontFamily: C.mono, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Under Construction</span>
        </div>

        {/* About + subject index — two column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* About */}
          <div style={{ padding: '16px 18px', border: `1px solid ${C.amber}`, background: C.bg2, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── ABOUT THIS CATALOG ──</div>
            <div style={{ marginTop: 6 }}>
              <p style={{ margin: '0 0 12px', lineHeight: 1.7, color: C.hi, fontSize: 14 }}>
                A curated collection of books, articles, films, and syllabi — centering disabled voices and disability justice in the arts.
              </p>
              <p style={{ margin: '0 0 12px', lineHeight: 1.7, fontSize: 14 }}>
                Readings from Alice Wong, Harriet McBryde Johnson, Mia Mingus. Syllabi you can steal. First-person essays. Academic texts that won&apos;t bore you to death.
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                <span style={{ color: C.amber }}>STATUS.........:</span>{' '}
                <span style={{ color: '#f5d84a', fontWeight: 700 }}>UNDER CONSTRUCTION</span>
                <span style={{ display: 'inline-block', width: '0.55em', height: '1em', background: C.hi, verticalAlign: '-0.15em', marginLeft: 4, animation: 'blink 1.1s steps(2,end) infinite' }} aria-hidden="true" />
              </p>
            </div>
          </div>

          {/* Subject index */}
          <div style={{ padding: '16px 18px', border: `1px solid ${C.amber}`, background: C.bg2, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── SUBJECT INDEX ──</div>
            <nav aria-label="Subject index" style={{ marginTop: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 28, rowGap: 1 }}>
                {subjects.map((s) => (
                  <button key={s.code}
                    onClick={() => setActiveSection(activeSection === s.code ? null : s.code)}
                    aria-pressed={activeSection === s.code}
                    style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '3px 0', background: activeSection === s.code ? C.amber : 'none', color: activeSection === s.code ? C.bg : C.amber, border: 'none', cursor: 'pointer', textAlign: 'left', textShadow: activeSection === s.code ? 'none' : `0 0 4px rgba(255,176,0,0.4)`, width: '100%', fontFamily: C.mono, fontSize: 13 }}>
                    <span style={{ color: activeSection === s.code ? C.bg : C.dim, flex: '0 0 24px' }}>{s.code}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                    <span style={{ flex: '0 0 auto', color: activeSection === s.code ? C.bg : C.hi }}>{s.count}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>

        {/* Notify me */}
        <div style={{ padding: '16px 18px', border: `1px solid ${C.amber}`, background: C.bg2, position: 'relative', marginBottom: 14 }}>
          <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── NOTIFY WHEN OPEN ──</div>
          <section aria-label="Get notified when The Library launches" style={{ marginTop: 6 }}>
            <h2 className="sr-only">Get notified when The Library launches</h2>
            {notifyStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ color: C.green, fontSize: 14, padding: '4px 0' }}>
                <span aria-hidden="true">▶ </span>ACCESS REQUEST LOGGED. We&apos;ll ping you when The Library goes live.
              </div>
            ) : (
              <form onSubmit={handleNotify} noValidate style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                <label htmlFor="lib-notify-email" style={{ ...labelSty, marginBottom: 0, alignSelf: 'center', minWidth: 200, padding: '7px 0', fontSize: 13 }}>
                  {labelDots('ENTER EMAIL')}
                </label>
                <input id="lib-notify-email" type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="_" required disabled={notifyStatus === 'loading'}
                  style={{ ...inputSty, flex: 1, minWidth: 180, borderRight: 'none', padding: '7px 10px' }} className="opac-input" />
                <button type="submit" disabled={notifyStatus === 'loading' || !notifyEmail.trim()}
                  style={{ background: notifyStatus === 'loading' ? 'rgba(255,176,0,0.3)' : C.amber, color: C.bg, border: `1px solid ${C.amber}`, fontFamily: C.mono, fontWeight: 700, fontSize: 13, padding: '7px 18px', cursor: 'pointer', letterSpacing: '0.08em', textShadow: 'none', whiteSpace: 'nowrap' }}
                  className="opac-btn">
                  {'< '}{notifyStatus === 'loading' ? 'SENDING...' : 'SUBMIT'}{' >'}
                </button>
                {notifyStatus === 'error' && <p role="alert" style={{ color: C.red, fontSize: 12, width: '100%', margin: '6px 0 0' }}>▶ ERROR: Something went wrong.</p>}
              </form>
            )}
          </section>
        </div>

        {/* Suggest a book */}
        <div style={{ padding: '16px 18px', border: `1px solid ${C.amber}`, background: C.bg2, position: 'relative', marginBottom: 14 }}>
          <div style={{ position: 'absolute', top: -10, left: 16, padding: '0 8px', background: C.bg2, color: C.hi, fontFamily: C.mono, fontSize: 16, letterSpacing: '0.1em' }} aria-hidden="true">── SUGGEST A BOOK ──</div>
          <section aria-label="Suggest a book for The Library" style={{ marginTop: 6 }}>
            <h2 style={{ fontFamily: C.mono, fontSize: 14, color: C.dim, margin: '0 0 14px', fontWeight: 400, letterSpacing: '0.06em' }}>
              What should every disability arts practitioner be reading?
            </h2>
            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ color: C.green, fontSize: 14, padding: '4px 0' }}>
                <span aria-hidden="true">▶ </span>SUBMISSION RECEIVED. Thank you — we&apos;ll add it to the catalog queue.
              </div>
            ) : (
              <form onSubmit={handleSuggest} noValidate style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: 12 }}>
                  <label htmlFor="sug-title" style={labelSty}>{labelDots('TITLE')}</label>
                  <input id="sug-title" type="text" value={suggest.title} onChange={(e) => setSuggest((s) => ({ ...s, title: e.target.value }))} placeholder="Book title" required disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'center', gap: 12 }}>
                  <label htmlFor="sug-author" style={labelSty}>{labelDots('AUTHOR')}</label>
                  <input id="sug-author" type="text" value={suggest.author} onChange={(e) => setSuggest((s) => ({ ...s, author: e.target.value }))} placeholder="Author name" required disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', alignItems: 'flex-start', gap: 12 }}>
                  <label htmlFor="sug-why" style={{ ...labelSty, paddingTop: 8 }}>{labelDots('NOTES')}</label>
                  <textarea id="sug-why" value={suggest.why} onChange={(e) => setSuggest((s) => ({ ...s, why: e.target.value }))} placeholder="Why should the community read this?" rows={3} disabled={suggestStatus === 'loading'} style={{ ...inputSty, resize: 'vertical', lineHeight: 1.6 }} className="opac-input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px 1fr', alignItems: 'center', gap: 12 }}>
                  <label htmlFor="sug-name" style={labelSty}>{labelDots('YOUR NAME')}</label>
                  <input id="sug-name" type="text" value={suggest.name} onChange={(e) => setSuggest((s) => ({ ...s, name: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                  <label htmlFor="sug-email" style={labelSty}>{labelDots('YOUR EMAIL')}</label>
                  <input id="sug-email" type="email" value={suggest.email} onChange={(e) => setSuggest((s) => ({ ...s, email: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={inputSty} className="opac-input" />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <button type="submit" disabled={suggestStatus === 'loading' || !suggest.title.trim() || !suggest.author.trim()}
                    style={{ background: (suggestStatus === 'loading' || !suggest.title.trim() || !suggest.author.trim()) ? 'rgba(255,176,0,0.3)' : C.amber, color: C.bg, border: `1px solid ${C.amber}`, fontFamily: C.mono, fontWeight: 700, fontSize: 13, padding: '8px 20px', cursor: 'pointer', letterSpacing: '0.08em', textShadow: 'none' }}
                    className="opac-btn">
                    {'< '}{suggestStatus === 'loading' ? 'SENDING...' : 'SUBMIT CATALOG REQUEST'}{' >'}
                  </button>
                </div>
                {suggestStatus === 'error' && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>▶ ERROR: Something went wrong.</p>}
              </form>
            )}
          </section>
        </div>

        {/* Function key bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `1px solid ${C.amber}`, marginBottom: 14 }} aria-label="Navigation">
          {[['F1', 'Resources', '/resources'], ['F2', 'Home', '/'], ['F3', 'Contact', '/contact'], ['F4', 'Directory', '/directory']].map(([key, label, href]) => (
            <Link key={key} href={href} style={{ padding: '8px 12px', textDecoration: 'none', color: C.amber, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, letterSpacing: '0.04em', borderRight: `1px solid ${C.dim}` }} className="opac-fkey">
              <span style={{ background: C.amber, color: C.bg, padding: '1px 6px', fontWeight: 700, textShadow: 'none', fontSize: 12 }}>{key}</span>
              {label}
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', paddingTop: 12, borderTop: `1px dashed ${C.dim}`, fontSize: 12, color: C.dim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          © {new Date().getFullYear()} Artistic Accessibility Collective · All Rights Reserved
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0.15} }
        .opac-input:focus-visible, .opac-input:focus { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        .opac-btn:focus-visible { outline: 2px solid ${C.cyan}; outline-offset: 2px; }
        .opac-fkey:hover, .opac-fkey:focus-visible { background: ${C.amber}; color: ${C.bg}; text-decoration: none; outline: 2px solid ${C.cyan}; }
        .opac-fkey:last-child { border-right: none; }
        @media (max-width: 640px) {
          [style*="grid-template-columns: 200px 1fr 200px 1fr"] { grid-template-columns: 1fr !important; }
          [style*="grid-template-columns: 200px 1fr"] { grid-template-columns: 1fr !important; }
          [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          [style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
