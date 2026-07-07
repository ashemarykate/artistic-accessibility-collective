'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';
import { supabase } from '@/lib/supabase';
import { PRINTER_PALETTE as C, PRINTER_ITEM_BY_SLUG, dbRowToPrintable, type Printable } from '@/lib/printer-data';

type ResolvedDoc = Printable & { trayId: string; trayLabel: string };

export default function PrinterDocPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const staticDoc = PRINTER_ITEM_BY_SLUG[slug];
  const [dbDoc, setDbDoc] = useState<ResolvedDoc | null | undefined>(staticDoc ? null : undefined);

  // Static seed items resolve instantly; admin-added items live in the
  // resources table and need a lookup by slug.
  useEffect(() => {
    if (staticDoc) return;
    supabase
      .from('resources')
      .select('*')
      .eq('section', 'printer')
      .eq('status', 'approved')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const mapped = dbRowToPrintable(data);
          setDbDoc({ ...mapped, trayId: mapped.tray, trayLabel: `TRAY · ${mapped.tray.toUpperCase()}` });
        } else {
          setDbDoc(null);
        }
      });
  }, [slug, staticDoc]);

  const doc: ResolvedDoc | null = staticDoc ?? dbDoc ?? null;
  const stillLoading = !staticDoc && dbDoc === undefined;

  useEffect(() => {
    if (doc) document.title = `${doc.title} · The Printer · Artistic Accessibility Collective`;
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, [doc]);

  const handlePrint = () => { if (typeof window !== 'undefined') window.print(); };

  if (stillLoading) {
    return (
      <BrowserChrome variant="mosaic" title="Loading · The Printer" url="http://printer.artisticaccessibility.com/" contentBg={C.paper}>
        <main style={{ minHeight: '100%', background: C.paper, fontFamily: C.mono, color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p role="status">LOADING DOCUMENT…</p>
        </main>
      </BrowserChrome>
    );
  }

  if (!doc) {
    return (
      <BrowserChrome variant="mosaic" title="Document Not Found · The Printer" url="http://printer.artisticaccessibility.com/" contentBg={C.paper}>
        <main style={{ minHeight: '100%', background: C.paper, fontFamily: C.mono, color: C.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <p style={{ fontSize: 15, fontWeight: 700 }}>DOCUMENT NOT FOUND: <code>{slug}</code></p>
          <Link href="/printer" style={{ color: C.accent, fontWeight: 700, textDecoration: 'underline' }}>← Back to The Printer</Link>
        </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome
      variant="mosaic"
      title={`${doc.title} · The Printer · Artistic Accessibility Collective`}
      url={`http://printer.artisticaccessibility.com/${doc.slug}`}
      contentBg={C.paper}
    >
      <main style={{ minHeight: '100%', background: C.paper, fontFamily: C.mono, color: C.ink, paddingBottom: 48 }}>
        <h1 className="sr-only">{doc.title} · The Printer · Artistic Accessibility Collective</h1>

        <div className="prn-doc-wrap" style={{ maxWidth: 720, margin: '0 auto', padding: '20px 24px' }}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="prn-doc-noprint" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.08em', marginBottom: 16, color: C.faint }}>
            <Link href="/printer" style={{ color: C.accent, textDecoration: 'none', fontWeight: 700 }} className="prn-doc-link">
              THE PRINTER
            </Link>
            <span aria-hidden="true">›</span>
            <span>{doc.trayLabel}</span>
            <span aria-hidden="true">›</span>
            <span style={{ color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
              {doc.title.toUpperCase()}
            </span>
          </nav>

          {/* Document card */}
          <article aria-label={`Document details for ${doc.title}`} style={{ border: `2px solid ${C.ink}`, background: '#fff' }}>
            <div className="prn-doc-header" style={{ background: C.ink, color: C.paper, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, letterSpacing: '0.1em', fontWeight: 700, opacity: 0.85 }}>PRINT JOB READY</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, border: `1px solid ${C.paper}`, padding: '1px 8px', letterSpacing: '0.1em' }}>FREE</span>
            </div>

            <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.rule}` }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 26, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {doc.title}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: C.faint, letterSpacing: '0.03em' }}>
                {doc.source} · {doc.format}{doc.pagesNote ? ` · ${doc.pagesNote}` : ''}
              </p>
            </div>

            <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.rule}` }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85 }}>{doc.description}</p>
            </div>

            <div className="prn-doc-noprint" style={{ padding: '18px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={handlePrint} className="prn-print-btn">
                🖨️ Print Document
              </button>
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="prn-doc-link" style={{ color: C.accent, fontWeight: 700, textDecoration: 'underline', fontSize: 14 }}>
                Go to the source page ↗
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            {/* Print-only footer: shown only when the page itself is printed */}
            <div className="prn-doc-printonly" style={{ display: 'none', padding: '14px 24px', fontSize: 12 }}>
              Source: {doc.url}
            </div>
          </article>

          {/* Footer nav */}
          <div className="prn-doc-noprint" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18, fontSize: 12 }}>
            <Link href="/printer" style={{ color: C.ink, fontWeight: 700, textDecoration: 'underline' }} className="prn-doc-link">
              ← Back to The Printer
            </Link>
            <Link href="/resources" style={{ color: C.ink, textDecoration: 'underline' }} className="prn-doc-link">
              Resources →
            </Link>
            <Link href="/" style={{ color: C.ink, textDecoration: 'underline' }} className="prn-doc-link">
              Home
            </Link>
          </div>
        </div>

        <style>{`
          .prn-doc-link:hover, .prn-doc-link:focus-visible {
            outline: 3px solid var(--aac-yellow);
            outline-offset: 2px;
          }
          .prn-print-btn {
            font-family: ${C.mono};
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: ${C.paper};
            background: ${C.accent};
            border: 2px solid ${C.ink};
            padding: 10px 18px;
            min-height: 44px;
            cursor: pointer;
          }
          .prn-print-btn:hover { background: #1a2568; }
          .prn-print-btn:focus-visible { outline: 3px solid var(--aac-yellow); outline-offset: 2px; }

          @media print {
            .prn-doc-noprint { display: none !important; }
            .prn-doc-printonly { display: block !important; }
            .prn-doc-wrap { max-width: 100% !important; padding: 0 !important; }
          }
          @media (max-width: 600px) {
            .prn-doc-header span:first-child { font-size: 10px; }
          }
        `}</style>
      </main>
    </BrowserChrome>
  );
}
