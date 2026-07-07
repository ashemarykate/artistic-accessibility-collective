import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStaffingSheet } from '@/lib/staffing/data';
import type { StaffingSheetData } from '@/lib/staffing/types';
import PrintButton from '@/components/PrintButton';
import EditableDocument from '@/components/EditableDocument';

// ─── Shared type + palette ────────────────────────────────────────────────────
// The purple companion to the assessment report: same design language (wallpaper
// cover, solid panel, monospace display, gold accent), different base hue so the
// two document types read as siblings, not copies.

// PLACEHOLDER display font, mirrored from the report, until MK picks the real face.
const DISPLAY_FONT = "ui-monospace, 'SF Mono', 'Cascadia Mono', 'Segoe UI Mono', Menlo, Consolas, 'Courier New', monospace";
const MONO = "'Courier New', Courier, monospace";

const P = {
  deskBg:   '#d3cde3',  // lavender-biased desk, sibling of the report's #c8cedf
  coverHi:  '#3b1a6e',
  coverMid: '#241048',
  coverLo:  '#180a33',
  panel:    '#150929',
  darkSec:  '#241048',  // dark purple body sections
  paper:    '#f7f5fb',  // lavender-tinted paper
  heading:  '#4b2593',  // deep purple headings on paper (passes AA)
  ink:      '#1c1428',
  inkSoft:  '#55496e',
  lightTx:  '#d9d0f0',  // body text on dark purple
  lightTx2: '#c3b4ea',  // secondary text on dark purple
  gold:     '#f5d84a',
  line:     '#e4def2',
};

// Same wallpaper as the report cover: every dark-bg wordmark, tiled as texture.
const WALLPAPER_LOGO_SRCS = [
  '/images/wordmark-medium-v1.png',
  '/images/wordmark-medium-v4.png',
  '/images/wordmark-dark-v1.svg',
  '/images/wordmark-dark-v2.svg',
  '/images/wordmark-dark-v3.svg',
  '/images/wordmark-dark-v4.svg',
  '/images/wordmark-dark-v5.svg',
  '/images/wordmark-dark-v6.svg',
  '/images/wordmark-dark-v7.svg',
  '/images/wordmark-dark-v8.svg',
  '/images/wordmark-dark-v9.svg',
  '/images/wordmark-dark-v10.svg',
  '/images/wordmark-dark-v11.svg',
  '/images/wordmark-dark-v12.svg',
  '/images/wordmark-dark-v13.svg',
];
const WALLPAPER_LOGOS = Array.from({ length: 40 }, (_, i) => WALLPAPER_LOGO_SRCS[i % WALLPAPER_LOGO_SRCS.length]);

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: gold ? P.gold : P.heading, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function SectionHeading({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 style={{
      fontFamily: DISPLAY_FONT,
      fontSize: 26, fontWeight: 700, margin: '0 0 24px',
      textTransform: 'uppercase', letterSpacing: '-0.01em',
      color: light ? 'white' : P.heading,
      lineHeight: 1.12,
    }}>
      {children}
    </h2>
  );
}

function PrintStyles() {
  return (
    <style>{`
      @media print {
        .no-print { display: none !important; }
        .page-break { break-before: page; }
        @page { margin: 0.65in; size: letter; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        a[href]::after { content: none !important; }
      }
      @media screen {
        .sheet-bg {
          background: ${P.deskBg};
          min-height: 100vh;
          padding: 48px 24px;
        }
        .sheet-doc {
          max-width: 900px;
          margin: 0 auto;
          box-shadow: 0 8px 48px rgba(24,10,51,0.28);
          --sec-pad: 56px 80px;
          --cover-pad: 72px 80px 56px;
          --cols-2: 1fr 1fr;
          --cover-panel-mx: 64px;
        }
        .print-fab {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 200;
        }
      }
      @media screen and (max-width: 720px) {
        .sheet-bg { padding: 0; }
        .sheet-doc {
          --sec-pad: 30px 22px;
          --cover-pad: 46px 24px 34px;
          --cols-2: 1fr;
          --cover-panel-mx: 0px;
        }
      }
    `}</style>
  );
}

// ─── Cover ────────────────────────────────────────────────────────────────────

function Cover({ event }: { event: StaffingSheetData['event'] }) {
  return (
    <div style={{
      position: 'relative',
      background: `radial-gradient(120% 90% at 78% 12%, ${P.coverHi} 0%, ${P.coverMid} 52%, ${P.coverLo} 100%)`,
      minHeight: 620,
      overflow: 'hidden',
    }}>
      {/* Wallpaper of the whole wordmark family, as texture */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: '-60px',
        display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
        gap: 34,
        transform: 'rotate(-5deg) scale(1.2)',
        opacity: 0.1,
        pointerEvents: 'none',
      }}>
        {WALLPAPER_LOGOS.map((src, i) => (
          <img key={i} src={src} alt="" style={{ height: 44, width: 'auto' }} />
        ))}
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(175deg, rgba(24,10,51,0.35) 0%, rgba(24,10,51,0.55) 100%)`,
      }} />

      {/* Solid panel holds everything readable */}
      <div style={{
        position: 'relative',
        padding: 'var(--cover-pad)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 620,
      }}>
        <div style={{
          background: P.panel,
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: `3px solid ${P.gold}`,
          boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          margin: '0 var(--cover-panel-mx)',
          padding: '40px 44px',
          color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
            <div aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
              {[P.gold, '#7a52d4', '#9a7ae0', '#c0aaf0'].map((c) => (
                <span key={c} style={{ width: 12, height: 12, background: c, display: 'inline-block' }} />
              ))}
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.04em',
              color: P.lightTx2, textTransform: 'lowercase',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: 3,
              padding: '5px 11px', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              aac://staffing/{event.slug}
            </div>
          </div>

          <div style={{
            fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: P.gold, marginBottom: 16,
          }}>
            Event Staffing Price-Out
          </div>

          <h1 style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 'clamp(31px, 6vw, 52px)', fontWeight: 700, lineHeight: 1.06,
            textTransform: 'uppercase', letterSpacing: '-0.02em',
            color: 'white', margin: '0 0 18px', maxWidth: 640,
          }}>
            {event.name}
          </h1>

          <div style={{ fontSize: 17, color: P.lightTx, marginBottom: 6 }}>
            {event.location} &middot; {event.dates}
          </div>
          <div style={{ fontSize: 14, color: P.lightTx2 }}>
            Scope: {event.scope}
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: 20, marginTop: 32,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 10,
            fontFamily: MONO, fontSize: 11, color: P.lightTx2,
          }}>
            <span>
              Prepared by{' '}
              <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, color: P.lightTx, fontSize: 12, letterSpacing: '0.02em' }}>
                Artistic Accessibility
              </span>
              {' '}&middot; {event.preparedDate}
            </span>
            <span>artisticaccessibility.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function IntroSection({ event }: { event: StaffingSheetData['event'] }) {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: P.paper }}>
      <SectionLabel>About This Sheet</SectionLabel>
      <SectionHeading>The Deal, Plainly</SectionHeading>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: P.ink, margin: 0, maxWidth: '70ch' }}>
        {event.overview}
      </p>
    </div>
  );
}

function RatesSection({ roles, validityNote }: { roles: StaffingSheetData['roles']; validityNote: string }) {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: 'white' }}>
      <SectionLabel>Roles & Rates</SectionLabel>
      <SectionHeading>The Numbers</SectionHeading>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
          <thead>
            <tr style={{ background: P.heading }}>
              <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: 700, width: '22%' }}>
                Role
              </th>
              <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: 700, width: '42%' }}>
                What It Covers
              </th>
              <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: 700, width: '20%' }}>
                Rate
              </th>
              <th scope="col" style={{ padding: '12px 16px', textAlign: 'center', color: 'white', fontWeight: 700, width: '16%' }}>
                This Quote
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r, i) => (
              <tr key={i} style={{
                background: r.included
                  ? (i % 2 === 0 ? '#faf7ee' : '#f6f1e2')
                  : (i % 2 === 0 ? 'white' : P.paper),
                opacity: 1,
              }}>
                <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                  <span style={{ fontWeight: 700, color: r.included ? P.ink : P.inkSoft, fontSize: 13 }}>{r.role}</span>
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'top', color: r.included ? '#3a3050' : P.inkSoft, lineHeight: 1.6, fontSize: 12.5 }}>
                  {r.covers}
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'top', fontWeight: 700, color: r.included ? P.heading : P.inkSoft, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                  {r.rate.split(' · ').map((part, j) => (
                    <div key={j}>{part}</div>
                  ))}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                    padding: '4px 10px',
                    background: r.included ? '#f2e5b3' : '#ece9f4',
                    color: r.included ? '#5a4400' : P.inkSoft,
                    border: r.included ? '1px solid #d9c05a' : `1px solid ${P.line}`,
                  }}>
                    {r.engagement}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: P.inkSoft, margin: '16px 0 0', fontFamily: MONO }}>
        {validityNote}
      </p>
    </div>
  );
}

function WhyUsSection({ whyUs }: { whyUs: string[] }) {
  return (
    <div className="page-break" style={{ padding: 'var(--sec-pad)', background: P.darkSec }}>
      <SectionLabel gold>What You Get</SectionLabel>
      <SectionHeading light>Why Orgs Use Us</SectionHeading>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxWidth: '76ch' }}>
        {whyUs.map((item, i) => (
          <li key={i} style={{
            display: 'flex', gap: 12, marginBottom: 14,
            fontSize: 14, lineHeight: 1.75, color: P.lightTx,
          }}>
            <span aria-hidden="true" style={{ color: P.gold, flexShrink: 0, fontWeight: 700 }}>→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhyThisEventSection({ event, whyThisEvent }: { event: StaffingSheetData['event']; whyThisEvent: string[] }) {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: P.paper }}>
      <SectionLabel>The Local Angle</SectionLabel>
      <SectionHeading>Why This Works For {event.name}</SectionHeading>
      <div style={{
        borderLeft: `4px solid ${P.gold}`,
        paddingLeft: 22,
        maxWidth: '70ch',
      }}>
        {whyThisEvent.map((para, i) => (
          <p key={i} style={{ fontSize: 14.5, lineHeight: 1.8, color: P.ink, margin: i === 0 ? '0 0 14px' : 0 }}>
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

function StepsSection({ steps }: { steps: StaffingSheetData['steps'] }) {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: 'white' }}>
      <SectionLabel>How It Works</SectionLabel>
      <SectionHeading>Start To Finish</SectionHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 20 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 40, height: 40, flexShrink: 0,
              background: P.heading, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700,
            }}>
              {i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: P.ink, marginBottom: 4 }}>{s.step}</div>
              <div style={{ fontSize: 13, color: P.inkSoft, lineHeight: 1.65 }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaSection() {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: P.coverLo }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 20 }}>
        <div style={{
          padding: '18px 20px',
          background: 'rgba(245,216,74,0.08)',
          border: '1px solid rgba(245,216,74,0.2)',
        }}>
          <div style={{ fontSize: 10, color: P.gold, fontWeight: 800, letterSpacing: '0.12em', marginBottom: 8 }}>
            THE FREE STUFF
          </div>
          <p style={{ fontSize: 13, color: P.lightTx, margin: 0, lineHeight: 1.7 }}>
            Whatever you decide, the Collective&apos;s library, printable checklists, and community
            calendar are free at{' '}
            <a href="https://artisticaccessibility.com/resources" style={{ color: P.gold, fontWeight: 700 }}>
              artisticaccessibility.com
            </a>
            . Take them; that&apos;s what they&apos;re for.
          </p>
        </div>
        <div style={{
          padding: '18px 20px',
          background: '#3b1a6e',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', textAlign: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: 14, color: 'white', fontWeight: 700 }}>
            Ready to build the crew?
          </div>
          <a
            href="https://artisticaccessibility.com/contact"
            style={{ color: P.gold, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}
          >
            artisticaccessibility.com/contact
          </a>
          <div style={{ fontSize: 12, color: P.lightTx2 }}>
            No pressure. No hard sell. Just access.
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingTop: 20, marginTop: 36,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/wordmark-dark-v9.svg" alt="" style={{ height: 'auto', maxHeight: 44, width: 'auto', maxWidth: '100%' }} />
        <div style={{ fontSize: 12, color: P.lightTx2 }}>
          artisticaccessibility.com &middot;{' '}
          <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 12, letterSpacing: '0.02em' }}>
            Artistic Accessibility
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getStaffingSheet(slug);
  if (!data) return {};
  return {
    title: `${data.event.name}: Event Staffing Price-Out · Artistic Accessibility`,
  };
}

export default async function StaffingSheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getStaffingSheet(slug);
  if (!data) notFound();

  return (
    <>
      <PrintStyles />

      <div className="print-fab no-print">
        <PrintButton />
      </div>

      <div className="sheet-bg">
        <div className="sheet-doc">
          <EditableDocument>
            <Cover event={data.event} />
            <IntroSection event={data.event} />
            <RatesSection roles={data.roles} validityNote={data.validityNote} />
            <WhyUsSection whyUs={data.whyUs} />
            <WhyThisEventSection event={data.event} whyThisEvent={data.whyThisEvent} />
            <StepsSection steps={data.steps} />
            <CtaSection />
          </EditableDocument>
        </div>
      </div>
    </>
  );
}
