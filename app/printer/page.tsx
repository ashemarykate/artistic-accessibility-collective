'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';
import { supabase } from '@/lib/supabase';
import { PRINTER_PALETTE as C, TRAYS, dbRowToPrintable, type Tray, type Printable } from '@/lib/printer-data';

// ── The Printer ────────────────────────────────────────────────────────────────
// A shared print room: printable checklists, posters, worksheets, and guides.
// Everything here links to a legal, free, print-friendly source.
//
// Trays are folders (native <details>/<summary> — free keyboard support and
// screen reader open/closed state). Open one and its documents show as a grid
// of paper icons; hover or focus a paper for a description, click through for
// the full document page (app/printer/[slug]/page.tsx).

const FOLDER_ICON = '/images/desktop-icons/icon-folders.png';
const PAPER_ICON  = '/images/desktop-icons/icon-57.png';
const PRINTER_ICON = '/images/desktop-icons/icon-printer.png';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
const BLANK_SUGGESTION = { title: '', url: '', tray: '', why: '', name: '', email: '' };

export default function PrinterPage() {
  const [queue, setQueue] = useState('');
  const [dbItems, setDbItems] = useState<(Printable & { tray: string })[]>([]);
  const [tipFor, setTipFor] = useState<string | null>(null);
  const [suggest, setSuggest] = useState({ ...BLANK_SUGGESTION });
  const [suggestStatus, setSuggestStatus] = useState<FormStatus>('idle');

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!suggest.title.trim()) return;
    setSuggestStatus('loading');
    const { error } = await supabase.from('resource_submissions').insert({
      resource_name:   suggest.title.trim(),
      resource_url:    suggest.url.trim() || null,
      description:     suggest.why.trim() || null,
      category:        suggest.tray || null,
      submitter_name:  suggest.name.trim()  || null,
      submitter_email: suggest.email.trim() || null,
      section:         'printer',
      special_tags:    [],
    });
    if (error) {
      setSuggestStatus('error');
    } else {
      setSuggestStatus('success');
      setSuggest({ ...BLANK_SUGGESTION });
    }
  }

  // Fetch admin-managed printer items and merge with the static trays.
  // A DB item with the same slug as a static one replaces it.
  useEffect(() => {
    supabase
      .from('resources')
      .select('*')
      .eq('section', 'printer')
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data?.length) setDbItems(data.map(dbRowToPrintable));
      });
  }, []);

  const trays = useMemo<Tray[]>(() => TRAYS.map((tray) => {
    const fromDb = dbItems.filter((i) => i.tray === tray.id);
    const dbSlugs = new Set(fromDb.map((i) => i.slug));
    return { ...tray, items: [...tray.items.filter((i) => !dbSlugs.has(i.slug)), ...fromDb] };
  }), [dbItems]);

  const total = trays.reduce((n, t) => n + t.items.length, 0);

  useEffect(() => {
    document.title = 'The Printer · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    const tick = () => setQueue(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const formLabel: React.CSSProperties = {
    display: 'block',
    color: C.ink,
    fontFamily: C.mono,
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.05em',
    marginBottom: 4,
  };
  const formInput: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${C.rule}`,
    color: C.ink,
    fontFamily: C.mono,
    fontSize: 14,
    padding: '9px 10px',
    minHeight: 44,
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <BrowserChrome
      variant="mosaic"
      title="The Printer · Artistic Accessibility Collective · NCSA Mosaic"
      url="http://printer.artisticaccessibility.com/"
      contentBg={C.paper}
    >
      <main style={{ minHeight: '100%', background: `repeating-linear-gradient(0deg, rgba(43,43,43,0.02) 0 2px, transparent 2px 26px), ${C.paper}`, fontFamily: C.mono, color: C.ink }}>
        <h1 className="sr-only">The Printer - Artistic Accessibility Collective</h1>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 60px' }}>

          {/* Status header, styled like a printer test page */}
          <div style={{ border: `2px solid ${C.ink}`, background: '#fff', padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, color: C.faint, letterSpacing: '0.08em' }}>
              <span>AAC PRINT ROOM · LPT1</span>
              <span className="prn-clock">LAST JOB: {queue}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0 2px' }}>
              <img src={PRINTER_ICON} alt="" aria-hidden="true" width={56} height={56} style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '0.06em' }} className="prn-title">
                THE PRINTER
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.accent, letterSpacing: '0.05em' }}>
              READY · {total} DOCUMENTS LOADED · TONER OK
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.7 }}>
              A shared print room of checklists, posters, worksheets, and guides worth putting on real paper. Everything links to a legal, free source. Open a tray, hover a document for a preview, click through to read, print, or find the source.
            </p>
          </div>

          {/* Trays, as folders you open */}
          {trays.map((tray) => (
            <details key={tray.id} className="prn-tray">
              <summary className="prn-tray-summary">
                <img src={FOLDER_ICON} alt="" aria-hidden="true" width={48} height={48} style={{ imageRendering: 'pixelated', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em' }}>{tray.label}</span>
                  <span style={{ display: 'block', fontSize: 12, opacity: 0.85, fontWeight: 400, marginTop: 2 }}>{tray.blurb}</span>
                </span>
                <span style={{ fontSize: 12, opacity: 0.8, flexShrink: 0 }}>{tray.items.length} DOC{tray.items.length !== 1 ? 'S' : ''}</span>
                <span className="chevron" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>▸</span>
              </summary>

              <div className="prn-paper-grid">
                {tray.items.map((item) => (
                  <div key={item.slug} style={{ position: 'relative' }}>
                    <Link
                      href={`/printer/${item.slug}`}
                      className="prn-paper-tile"
                      onMouseEnter={() => setTipFor(item.slug)}
                      onMouseLeave={() => setTipFor((cur) => (cur === item.slug ? null : cur))}
                      onFocus={() => setTipFor(item.slug)}
                      onBlur={() => setTipFor((cur) => (cur === item.slug ? null : cur))}
                      onKeyDown={(e) => { if (e.key === 'Escape') setTipFor(null); }}
                      aria-describedby={tipFor === item.slug ? `tip-${item.slug}` : undefined}
                    >
                      <img src={PAPER_ICON} alt="" aria-hidden="true" width={44} height={44} style={{ imageRendering: 'pixelated' }} />
                      <span className="prn-paper-title">{item.title}</span>
                      <span className="prn-paper-free">FREE</span>
                    </Link>
                    {tipFor === item.slug && (
                      <div id={`tip-${item.slug}`} role="tooltip" className="prn-tooltip">
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}

          {/* Add paper to the tray: submission form */}
          <div id="prn-suggest-form" style={{ border: `2px dashed ${C.ink}`, background: '#fff', padding: '18px 20px', marginBottom: 18, marginTop: 18 }}>
            <h2 style={{ margin: '0 0 8px', fontFamily: C.mono, fontSize: 14, letterSpacing: '0.1em' }}>ADD PAPER TO THE TRAY</h2>
            <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.7 }}>
              Made a worksheet, visual story, or checklist others could use, or found something free and print-friendly that belongs here? Send it in. Suggestions are reviewed by the AAC team before they&apos;re added to a tray. Member PDF uploads are coming in a future round.
            </p>

            {suggestStatus === 'success' ? (
              <div role="status" aria-live="polite" style={{ color: C.green, fontSize: 14, padding: '4px 0', fontWeight: 700 }}>
                ▶ SUBMISSION RECEIVED. Thank you, we&apos;ll take a look and add it to a tray.
              </div>
            ) : (
              <form onSubmit={handleSuggest} noValidate style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="prn-form-grid-2">
                  <div>
                    <label htmlFor="ps-title" style={formLabel}>DOCUMENT TITLE <span aria-hidden="true">*</span><span className="sr-only">(required)</span></label>
                    <input id="ps-title" type="text" value={suggest.title} onChange={(e) => setSuggest((s) => ({ ...s, title: e.target.value }))} placeholder="What's it called?" required disabled={suggestStatus === 'loading'} style={formInput} className="prn-form-input" />
                  </div>
                  <div>
                    <label htmlFor="ps-url" style={formLabel}>LINK TO IT <span style={{ opacity: 0.65, fontWeight: 400 }}>(optional)</span></label>
                    <input id="ps-url" type="url" value={suggest.url} onChange={(e) => setSuggest((s) => ({ ...s, url: e.target.value }))} placeholder="https://" disabled={suggestStatus === 'loading'} style={formInput} className="prn-form-input" />
                  </div>
                </div>

                <div>
                  <label htmlFor="ps-tray" style={formLabel}>WHICH TRAY? <span style={{ opacity: 0.65, fontWeight: 400 }}>(optional, we&apos;ll double check)</span></label>
                  <select id="ps-tray" value={suggest.tray} onChange={(e) => setSuggest((s) => ({ ...s, tray: e.target.value }))} disabled={suggestStatus === 'loading'} style={{ ...formInput, background: '#fff' }} className="prn-form-input">
                    <option value="">Not sure</option>
                    {TRAYS.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ps-why" style={formLabel}>WHY DOES THIS BELONG HERE? <span style={{ opacity: 0.65, fontWeight: 400 }}>(optional)</span></label>
                  <textarea id="ps-why" value={suggest.why} onChange={(e) => setSuggest((s) => ({ ...s, why: e.target.value }))} placeholder="Who would print this, and what would they use it for?" rows={3} disabled={suggestStatus === 'loading'} style={{ ...formInput, resize: 'vertical', lineHeight: 1.6 }} className="prn-form-input" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="prn-form-grid-2">
                  <div>
                    <label htmlFor="ps-name" style={formLabel}>YOUR NAME <span style={{ opacity: 0.65, fontWeight: 400 }}>(optional)</span></label>
                    <input id="ps-name" type="text" value={suggest.name} onChange={(e) => setSuggest((s) => ({ ...s, name: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={formInput} className="prn-form-input" />
                  </div>
                  <div>
                    <label htmlFor="ps-email" style={formLabel}>YOUR EMAIL <span style={{ opacity: 0.65, fontWeight: 400 }}>(optional)</span></label>
                    <input id="ps-email" type="email" value={suggest.email} onChange={(e) => setSuggest((s) => ({ ...s, email: e.target.value }))} placeholder="Optional" disabled={suggestStatus === 'loading'} style={formInput} className="prn-form-input" />
                  </div>
                </div>

                <div style={{ paddingTop: 2 }}>
                  <button type="submit" disabled={suggestStatus === 'loading' || !suggest.title.trim()} className="prn-submit-btn">
                    {suggestStatus === 'loading' ? 'SENDING…' : '🖨️ Send to the Print Room'}
                  </button>
                </div>
                {suggestStatus === 'error' && <p role="alert" style={{ color: '#c0392b', fontSize: 13, margin: 0 }}>▶ ERROR: Something went wrong. Please try again.</p>}
              </form>
            )}
          </div>

          {/* Nav bar */}
          <nav aria-label="Navigation" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: `2px solid ${C.ink}`, background: '#fff' }} className="prn-nav">
            {[['Resources', '/resources'], ['Library', '/library'], ['Cinema', '/cinema'], ['Home', '/']].map(([label, href]) => (
              <Link key={href} href={href} className="prn-fkey" style={{ padding: '10px 12px', textDecoration: 'none', color: C.ink, fontSize: 13, letterSpacing: '0.06em', borderRight: `1px solid ${C.rule}`, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                ▶ {label}
              </Link>
            ))}
          </nav>
        </div>

        <style>{`
          .prn-tray {
            border: 2px solid ${C.ink};
            background: #fff;
            margin-bottom: 14px;
          }
          .prn-tray-summary {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            background: ${C.ink};
            color: ${C.paper};
            cursor: pointer;
            list-style: none;
            min-height: 44px;
          }
          .prn-tray-summary::-webkit-details-marker { display: none; }
          .prn-tray-summary:hover { background: #3a3a3a; }
          .prn-tray-summary:focus-visible { outline: 3px solid var(--aac-yellow); outline-offset: -3px; }
          .prn-tray-summary .chevron { transition: transform 0.15s; }
          .prn-tray[open] > .prn-tray-summary .chevron { transform: rotate(90deg); }
          @media (prefers-reduced-motion: reduce) {
            .prn-tray-summary .chevron { transition: none; }
          }
          .prn-paper-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
            padding: 16px;
            border-top: 1px dashed ${C.rule};
          }
          .prn-paper-tile {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 6px;
            padding: 10px 8px;
            text-decoration: none;
            color: ${C.ink};
            border: 1px solid transparent;
            border-radius: 2px;
            min-height: 44px;
          }
          .prn-paper-tile:hover, .prn-paper-tile:focus-visible {
            background: #fff8dc;
            border-color: ${C.rule};
          }
          .prn-paper-tile:focus-visible { outline: 3px solid var(--aac-yellow); outline-offset: 1px; }
          .prn-paper-title {
            font-size: 12px;
            line-height: 1.4;
            font-weight: 700;
          }
          .prn-paper-free {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.1em;
            color: ${C.green};
            border: 1px solid ${C.green};
            padding: 1px 6px;
          }
          .prn-tooltip {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 4px;
            z-index: 20;
            width: 220px;
            background: #ffffe1;
            border: 1px solid ${C.ink};
            box-shadow: 2px 2px 0 rgba(0,0,0,0.25);
            padding: 8px 10px;
            font-size: 12px;
            line-height: 1.55;
            color: ${C.ink};
            pointer-events: none;
          }
          .prn-fkey:hover, .prn-fkey:focus-visible { background: ${C.ink}; color: ${C.paper}; outline: 3px solid var(--aac-yellow); outline-offset: -3px; }
          .prn-fkey:last-child { border-right: none; }
          .prn-form-input:focus-visible { outline: 3px solid var(--aac-yellow); outline-offset: 1px; }
          .prn-submit-btn {
            font-family: ${C.mono};
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.03em;
            color: ${C.paper};
            background: ${C.accent};
            border: 2px solid ${C.ink};
            padding: 10px 18px;
            min-height: 44px;
            cursor: pointer;
          }
          .prn-submit-btn:hover:not(:disabled) { background: #1a2568; }
          .prn-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .prn-submit-btn:focus-visible { outline: 3px solid var(--aac-yellow); outline-offset: 2px; }
          @media (max-width: 600px) {
            .prn-title { font-size: 26px !important; }
            .prn-clock { display: none; }
            .prn-nav { grid-template-columns: repeat(2, 1fr) !important; }
            .prn-tooltip { width: 180px; }
            .prn-form-grid-2 { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </main>
    </BrowserChrome>
  );
}
