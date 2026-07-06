'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

// ── The Printer ────────────────────────────────────────────────────────────────
// A shared print room: printable checklists, posters, worksheets, and guides.
// Everything here links to a legal, free, print-friendly source.
// Draft v1: static list. Member uploads can come later via resource_submissions.

const C = {
  paper:  '#f4f1e8',
  ink:    '#2b2b2b',
  faint:  '#5a5550',
  rule:   '#c9c3b2',
  accent: '#263590',
  green:  '#1d6b4f',
  mono:   '"Courier New", Courier, monospace',
};

type Printable = {
  slug: string;
  title: string;
  source: string;
  description: string;
  url: string;
  format: string;      // e.g. 'PDF', 'Web page (print friendly)'
  pagesNote?: string;  // e.g. 'One page', 'Poster set'
};

type Tray = { id: string; label: string; blurb: string; items: Printable[] };

const TRAYS: Tray[] = [
  {
    id: 'checklists',
    label: 'TRAY 1 · CHECKLISTS',
    blurb: 'Print, walk your venue or website with a pen, and see where you stand.',
    items: [
      {
        slug: 'ada-checklist',
        title: 'ADA Checklist for Existing Facilities',
        source: 'New England ADA Center',
        description: 'The classic printable walk-through checklist for physical access: parking, entrances, restrooms, seating, and signage. The standard first self-assessment for any venue in the United States.',
        url: 'https://adachecklist.org/doc/fullchecklist/ada-checklist.pdf',
        format: 'PDF',
        pagesNote: 'Full checklist',
      },
      {
        slug: 'sins-invalid-access-suggestions',
        title: 'Access Suggestions for Public Events',
        source: 'Sins Invalid',
        description: 'A disability justice checklist for event organizers, going well past compliance: fragrance-free practice, ASL and CART, image description, rest space, and mobility access. Copy-ready.',
        url: 'https://sinsinvalid.org/resources/',
        format: 'Web page (print friendly)',
      },
      {
        slug: 'wcag-quickref',
        title: 'How to Meet WCAG (Quick Reference)',
        source: 'W3C Web Accessibility Initiative',
        description: 'The working WCAG checklist most teams actually use. Filter to Level AA, print your filtered view, and use it for audits and sign-off on your website or digital program.',
        url: 'https://www.w3.org/WAI/WCAG22/quickref/',
        format: 'Web page (print friendly)',
      },
    ],
  },
  {
    id: 'posters',
    label: 'TRAY 2 · POSTERS & SIGNS',
    blurb: 'For the studio wall, the box office, and the volunteer break room.',
    items: [
      {
        slug: 'govuk-dos-donts',
        title: 'Designing for Accessibility: Dos and Don\'ts Posters',
        source: 'UK Home Office',
        description: 'The famous one-page posters covering design for people who are autistic, blind, low vision, D/deaf, dyslexic, or have motor impairments. Creative Commons licensed and made to be printed and hung where a whole team will see them.',
        url: 'https://accessibility.blog.gov.uk/2016/09/02/dos-and-donts-on-designing-for-accessibility/',
        format: 'Poster set (downloadable)',
        pagesNote: '6 posters',
      },
    ],
  },
  {
    id: 'worksheets',
    label: 'TRAY 3 · WORKSHEETS & WORKBOOKS',
    blurb: 'Hands-on materials for workshops, trainings, and your own practice.',
    items: [
      {
        slug: 'alt-text-as-poetry-workbook',
        title: 'Alt Text as Poetry Workbook',
        source: 'Bojana Coklyat & Shannon Finnegan',
        description: 'A free workbook of exercises that treat alt text as a creative practice, not a compliance chore. Perfect for a solo afternoon or a group workshop. Also available as audio and EPUB on the project site.',
        url: 'https://alt-text-as-poetry.net/assets/Alt-Text-as-Poetry-Workbook-PDF-2020-12-01.pdf',
        format: 'PDF',
        pagesNote: 'Full workbook',
      },
      {
        slug: 'dcmp-ad-tip-sheet',
        title: 'Audio Description Tip Sheet',
        source: 'Described and Captioned Media Program',
        description: 'A one-page primer on the core principles of audio description: objective language, present tense, and describing visual identity. The ideal handout for a first AD workshop.',
        url: 'https://dcmp.org/learn/227-audio-description-tip-sheet',
        format: 'Web page (print friendly)',
        pagesNote: 'One page',
      },
    ],
  },
  {
    id: 'guides',
    label: 'TRAY 4 · GUIDES & TOOLKITS',
    blurb: 'Longer reads worth printing, binding, and keeping on the shelf.',
    items: [
      {
        slug: 'fwd-doc-toolkit',
        title: 'FWD-Doc Toolkit for Inclusion & Accessibility',
        source: 'FWD-Doc & Doc Society',
        description: 'The 62-page toolkit on disability inclusion across development, production, post-production, and exhibition, written by disabled documentary makers. The single best print-and-keep guide for filmmakers.',
        url: 'https://fwd-doc.org/toolkit',
        format: 'PDF',
        pagesNote: '62 pages',
      },
      {
        slug: 'graeae-access-rider',
        title: 'How to Create an Access Rider',
        source: 'Graeae Theatre Company',
        description: 'Graeae\'s free guide for disabled artists on writing an access rider: the document that tells venues and producers what you need to do your best work. Pairs well with Access Docs for Artists in our Resources room.',
        url: 'https://graeae.org/resource/how-to-create-an-access-rider/',
        format: 'Web page with downloads',
      },
      {
        slug: 'crpd-full-text',
        title: 'UN Convention on the Rights of Persons with Disabilities',
        source: 'United Nations',
        description: 'The foundational international disability rights treaty. Article 30 guarantees access to cultural life: theater, film, museums, and the arts. Worth having on paper when you need to point at the source.',
        url: 'https://www.un.org/disabilities/documents/convention/convoptprot-e.pdf',
        format: 'PDF',
      },
    ],
  },
];

const TOTAL = TRAYS.reduce((n, t) => n + t.items.length, 0);

export default function PrinterPage() {
  const [queue, setQueue] = useState('');

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

  const rule = useMemo<React.CSSProperties>(() => ({ borderTop: `1px dashed ${C.rule}` }), []);

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
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '0.06em', margin: '8px 0 2px' }} className="prn-title">
              THE PRINTER
            </div>
            <div style={{ fontSize: 13, color: C.accent, letterSpacing: '0.05em' }}>
              READY · {TOTAL} DOCUMENTS LOADED · TONER OK
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.7 }}>
              A shared print room of checklists, posters, worksheets, and guides worth putting on real paper. Everything links to a legal, free source. Pick a tray, hit print, and pass copies around.
            </p>
          </div>

          {/* Trays */}
          {TRAYS.map((tray) => (
            <section key={tray.id} aria-labelledby={`tray-${tray.id}`} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, padding: '8px 14px', background: C.ink, color: C.paper }}>
                <h2 id={`tray-${tray.id}`} style={{ margin: 0, fontFamily: C.mono, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em' }}>
                  {tray.label}
                </h2>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{tray.items.length} DOC{tray.items.length !== 1 ? 'S' : ''}</span>
              </div>
              <div style={{ border: `2px solid ${C.ink}`, borderTop: 'none', background: '#fff' }}>
                <p style={{ margin: 0, padding: '10px 14px', fontSize: 13, color: C.faint, ...rule, borderTop: 'none' }}>
                  {tray.blurb}
                </p>
                {tray.items.map((item) => (
                  <article key={item.slug} style={{ padding: '14px 14px 16px', ...rule }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prn-doc-link"
                        style={{ color: C.accent, fontWeight: 700, fontSize: 15, textDecoration: 'underline', lineHeight: 1.4 }}
                      >
                        {item.title}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <span style={{ border: `1px solid ${C.green}`, color: C.green, fontSize: 11, fontWeight: 700, padding: '1px 7px', letterSpacing: '0.1em' }}>FREE</span>
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: C.faint, letterSpacing: '0.04em' }}>
                      {item.source} · {item.format}{item.pagesNote ? ` · ${item.pagesNote}` : ''}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.7 }}>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {/* Paper-out note: how to add to the print room */}
          <div style={{ border: `2px dashed ${C.ink}`, background: '#fff', padding: '16px 20px', marginBottom: 18 }}>
            <h2 style={{ margin: '0 0 8px', fontFamily: C.mono, fontSize: 14, letterSpacing: '0.1em' }}>ADD PAPER TO THE TRAY</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
              Made a worksheet, visual story, or checklist others could use? We want it in here. Send it through the suggestion form in <Link href="/library" style={{ color: C.accent }}>The Library</Link> or the <Link href="/contact" style={{ color: C.accent }}>contact page</Link> and note that it is for The Printer. Member PDF uploads are coming in a future round.
            </p>
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
          .prn-doc-link:focus-visible { outline: 3px solid var(--aac-yellow); outline-offset: 2px; }
          .prn-fkey:hover, .prn-fkey:focus-visible { background: ${C.ink}; color: ${C.paper}; outline: 3px solid var(--aac-yellow); outline-offset: -3px; }
          .prn-fkey:last-child { border-right: none; }
          @media (max-width: 600px) {
            .prn-title { font-size: 26px !important; }
            .prn-clock { display: none; }
            .prn-nav { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </main>
    </BrowserChrome>
  );
}
