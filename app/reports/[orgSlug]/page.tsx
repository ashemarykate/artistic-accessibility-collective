import Logo from '@/components/Logo';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getReportData } from '@/lib/reports/data';
import type {
  AssessmentArea,
  AssessmentPriority,
  AssessmentStatus,
  ReportData,
  Resource,
} from '@/lib/reports/types';
import PrintButton from '@/components/PrintButton';

// PLACEHOLDER display font for report titles while a real display face is chosen.
// A bold monospace: distinct from the system-ui body, cohesive with the retro
// "terminal" labels/address bar, and it prints crisply. (Was 'AAC Display'.)
const DISPLAY_FONT = "ui-monospace, 'SF Mono', 'Cascadia Mono', 'Segoe UI Mono', Menlo, Consolas, 'Courier New', monospace";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AssessmentStatus,
  { bg: string; text: string; border: string; icon: string }
> = {
  good:         { bg: '#e6f4ec', text: '#1a7a4a', border: '#1a7a4a40', icon: '✓' },
  gaps:         { bg: '#fff8e6', text: '#7a4a00', border: '#7a4a0040', icon: '⚠' },
  'not-found':  { bg: '#fdf0ee', text: '#c0392b', border: '#c0392b40', icon: '✗' },
  'needs-info': { bg: '#eef0fb', text: '#263590', border: '#26359040', icon: '?' },
};

const PRIORITY_CONFIG: Record<
  AssessmentPriority,
  { bg: string; text: string; border: string }
> = {
  HIGH:   { bg: '#fdf0ee', text: '#c0392b', border: '#c0392b40' },
  MEDIUM: { bg: '#fff8e6', text: '#7a4a00', border: '#7a4a0040' },
  LOW:    { bg: '#e6f4ec', text: '#1a7a4a', border: '#1a7a4a40' },
};

function StatusBadge({ status, label }: { status: AssessmentStatus; label: string }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      padding: '3px 10px', fontSize: 12, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span aria-hidden="true">{c.icon}</span> {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: AssessmentPriority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span style={{
      display: 'inline-block',
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      padding: '3px 10px', fontSize: 11, fontWeight: 800,
      letterSpacing: '0.08em',
    }}>
      {priority}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: '#263590', marginBottom: 10,
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
      color: light ? 'white' : '#263590',
      lineHeight: 1.12,
    }}>
      {children}
    </h2>
  );
}

function BlockHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: '#263590',
      paddingBottom: 8, marginBottom: 12,
      borderBottom: '2px solid #d8dcf5',
    }}>
      {children}
    </div>
  );
}

function BulletList({
  items,
  color = '#4a5478',
  dot = '•',
}: {
  items: string[];
  color?: string;
  dot?: string;
}) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: 10, marginBottom: 9,
          fontSize: 13.5, lineHeight: 1.65, color: '#1a1a2e',
        }}>
          <span aria-hidden="true" style={{ color, flexShrink: 0, marginTop: 1, fontWeight: 600 }}>{dot}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const domain = resource.url.replace(/^https?:\/\//, '').split('/')[0];
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block', padding: '12px 14px',
        border: '1px solid #dce2f0', background: '#f6f8fe',
        textDecoration: 'none', color: 'inherit',
      }}
    >
      <div style={{ color: '#263590', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
        {resource.name}
      </div>
      {resource.description && (
        <div style={{ color: '#4a5478', fontSize: 12, marginBottom: 4 }}>
          {resource.description}
        </div>
      )}
      <div style={{ color: '#4a5a8a', fontSize: 11 }}>{domain}</div>
    </a>
  );
}

// ─── Document Sections ───────────────────────────────────────────────────────

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
        .report-bg {
          background: #c8cedf;
          min-height: 100vh;
          padding: 48px 24px;
        }
        .report-doc {
          max-width: 900px;
          margin: 0 auto;
          box-shadow: 0 8px 48px rgba(13,30,74,0.22);
          /* Responsive tokens, referenced inline by every section, so one
             breakpoint reflows the whole document instead of overflowing. */
          --sec-pad: 56px 80px;
          --cover-pad: 72px 80px 56px;
          --cols-2: 1fr 1fr;
          --cols-3: repeat(3, 1fr);
          /* Extra inset for the cover's solid panel, independent of --cover-pad,
             so the wallpaper shows as a real margin on both sides, not a sliver. */
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
        .report-bg { padding: 0; }
        .report-doc {
          --sec-pad: 30px 22px;
          --cover-pad: 46px 24px 34px;
          --cols-2: 1fr;
          --cols-3: 1fr;
          --cover-panel-mx: 0px;
        }
      }
    `}</style>
  );
}

// Every dark-bg wordmark variant, tiled as decorative wallpaper behind the
// cover's solid content panel — a "sample sheet" of the whole family of logos
// instead of a single random pick. (Listed locally, not imported from the
// 'use client' Logo component, so this server-rendered page owns its own data.)
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

const MONO = "'Courier New', Courier, monospace";

function Cover({ org }: { org: ReportData['org'] }) {
  return (
    <div style={{
      position: 'relative',
      background: 'radial-gradient(120% 90% at 78% 12%, #16295f 0%, #0d1e4a 52%, #0a1738 100%)',
      minHeight: 640,
      overflow: 'hidden',
    }}>
      {/* Optional photo, a faint supporting layer behind the wallpaper */}
      {org.coverPhoto && (
        <img
          src={org.coverPhoto}
          alt=""
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 38%',
            opacity: 0.3,
          }}
        />
      )}

      {/* Wallpaper: every dark-bg wordmark variant, tiled and rotated as pure
          texture. Always present, so photo and photo-less covers share an
          identity, and it doubles as a sampler of the whole logo family. */}
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

      {/* Darkening layer so the solid panel below always has a consistent,
          legible field around it regardless of photo/wallpaper density */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(175deg, rgba(10,23,56,0.35) 0%, rgba(10,23,56,0.55) 100%)',
      }} />

      {/* Content: a single solid rectangle holds everything that needs to be
          read, so it stays legible over the busy wallpaper behind it. */}
      <div style={{
        position: 'relative',
        padding: 'var(--cover-pad)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 640,
      }}>
        <div style={{
          background: '#0a1738',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #f5d84a',
          boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          margin: '0 var(--cover-panel-mx)',
          padding: '40px 44px',
          color: 'white',
        }}>
          {/* Pixel-square accent + address-bar readout (a nod to the site's browser chrome) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
            <div aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
              {['#f5d84a', '#5468d4', '#7a8fe0', '#aab4f0'].map((c) => (
                <span key={c} style={{ width: 12, height: 12, background: c, display: 'inline-block' }} />
              ))}
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.04em',
              color: '#9fb0e0', textTransform: 'lowercase',
              border: '1px solid rgba(255,255,255,0.18)', borderRadius: 3,
              padding: '5px 11px', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              aac://assessments/{org.slug}
            </div>
          </div>

          <div style={{
            fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: '#f5d84a', marginBottom: 16,
          }}>
            Accessibility Assessment
          </div>

          <h1 style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 'clamp(31px, 6vw, 52px)', fontWeight: 700, lineHeight: 1.06,
            textTransform: 'uppercase', letterSpacing: '-0.02em',
            color: 'white', margin: '0 0 18px', maxWidth: 640,
          }}>
            {org.name}
          </h1>

          <div style={{ fontSize: 17, color: '#d8dcf5', marginBottom: 8 }}>
            {org.location} &middot; {org.type}
          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: 20, marginTop: 32,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 10,
            fontFamily: MONO, fontSize: 11, color: '#9fb0e0',
          }}>
            <span>
              Prepared by{' '}
              <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, color: '#d8dcf5', fontSize: 12, letterSpacing: '0.02em' }}>
                Artistic Accessibility
              </span>
              {' '}&middot; {org.preparedDate}
            </span>
            <span>Public review &middot; {org.assessmentDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: '#f6f7fa' }}>
      <SectionLabel>About This Document</SectionLabel>
      <SectionHeading>What This Is (And What It Isn&apos;t)</SectionHeading>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 32 }}>
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#1a1a2e', margin: '0 0 16px' }}>
            This is a map, not a grade. We reviewed everything a member of the public can see: your website, your event pages, your social posts. Then we wrote down what&apos;s working, where the gaps are, and what we couldn&apos;t tell from the outside. No organization does all of this at once, and nothing in here is a scolding. Everyone starts somewhere, and starting is the part that counts.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#1a1a2e', margin: 0 }}>
            This document was prepared by Artistic Accessibility. We also run the Artistic Accessibility Collective, a free community hub built with disabled artists and access workers: a library of verified free resources, printable checklists and posters in The Printer, and a community calendar of accessible arts events. Every resource linked in this report is free, and most were made by disabled people. That&apos;s on purpose.
          </p>
        </div>
        <div style={{
          background: '#d8dcf5',
          padding: '24px 26px',
          fontSize: 14,
          lineHeight: 1.75,
          color: '#1a1a2e',
        }}>
          <strong style={{ display: 'block', marginBottom: 12, color: '#263590' }}>How We Think About Access</strong>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Legal compliance is the floor.</strong> The ADA and WCAG set the minimum. We name it plainly wherever it applies, and we never confuse it with the goal.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Disabled community feedback is the measure.</strong> What actually works is defined by the people using it, and it often looks different from the minimum.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Community self-determination is the compass.</strong> &ldquo;Nothing about us without us&rdquo; shapes every recommendation here, including the ones about who to hire.
          </p>
        </div>
      </div>

      {/* Plain-language legend for the four status labels used throughout */}
      <div style={{ marginTop: 32 }}>
        <BlockHeading>How To Read The Labels</BlockHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: '12px 28px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <StatusBadge status="good" label="Working well" />
            <span style={{ fontSize: 12.5, color: '#4a5478', lineHeight: 1.5 }}>Keep doing this, and tell people about it.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <StatusBadge status="gaps" label="Gaps to close" />
            <span style={{ fontSize: 12.5, color: '#4a5478', lineHeight: 1.5 }}>A foundation exists. Specific fixes will make it real.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <StatusBadge status="not-found" label="Not found yet" />
            <span style={{ fontSize: 12.5, color: '#4a5478', lineHeight: 1.5 }}>We couldn&apos;t find this publicly. Usually the biggest opportunity.</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <StatusBadge status="needs-info" label="Tell us more" />
            <span style={{ fontSize: 12.5, color: '#4a5478', lineHeight: 1.5 }}>Only you can answer this. The questions are in each section.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgOverview({ data }: { data: ReportData }) {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: 'white' }}>
      <SectionLabel>Organization Overview</SectionLabel>
      <SectionHeading>{data.org.name}</SectionHeading>

      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#1a1a2e', margin: '0 0 40px', maxWidth: '68ch' }}>
        {data.org.overview}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 40 }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#263590',
            paddingBottom: 8, marginBottom: 16,
            borderBottom: '3px solid #f5d84a',
          }}>
            Signature Events
          </div>
          {data.events.map((ev, i) => (
            <div key={i} style={{ padding: '11px 0', borderBottom: '1px solid #edf0f9' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 3 }}>
                {ev.name}
              </div>
              <div style={{ fontSize: 12, color: '#4a5478', marginBottom: 2 }}>{ev.when}</div>
              <div style={{ fontSize: 12, color: '#4a5a8a' }}>{ev.format}</div>
            </div>
          ))}
        </div>

        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#263590',
            paddingBottom: 8, marginBottom: 16,
            borderBottom: '3px solid #f5d84a',
          }}>
            Key Funders & Partners
          </div>
          {data.funders.map((f, i) => (
            <div key={i} style={{ padding: '11px 0', borderBottom: '1px solid #edf0f9' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#263590', marginBottom: 4 }}>
                {f.name}
              </div>
              <div style={{ fontSize: 12, color: '#4a5478', lineHeight: 1.6 }}>{f.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssessmentSummary({ areas, assessmentDate }: { areas: ReportData['assessmentAreas']; assessmentDate: string }) {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: '#f6f7fa' }}>
      <SectionLabel>The Short Version</SectionLabel>
      <SectionHeading>Where Things Stand</SectionHeading>
      <p style={{ fontSize: 13, color: '#4a5478', margin: '0 0 28px', maxWidth: '68ch', lineHeight: 1.7 }}>
        The whole assessment in one table. Everything here comes from public review of your website and
        event pages ({assessmentDate}), and each area gets a full page later in this document.
      </p>

      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 460 }}>
        <thead>
          <tr style={{ background: '#263590' }}>
            <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: 700, width: '38%' }}>
              Access Area
            </th>
            <th scope="col" style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: 700, width: '34%' }}>
              Key Finding
            </th>
            <th scope="col" style={{ padding: '12px 16px', textAlign: 'center', color: 'white', fontWeight: 700, width: '15%' }}>
              Status
            </th>
            <th scope="col" style={{ padding: '12px 16px', textAlign: 'center', color: 'white', fontWeight: 700, width: '13%' }}>
              Priority
            </th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area, i) => (
            <tr key={area.id} style={{ background: i % 2 === 0 ? 'white' : '#f0f2fb' }}>
              <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 13 }}>{area.title}</span>
              </td>
              <td style={{ padding: '12px 16px', verticalAlign: 'top', color: '#4a5478', lineHeight: 1.55, fontSize: 12.5 }}>
                {area.whatWeFound[0]}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <StatusBadge status={area.status} label={area.statusLabel} />
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <PriorityBadge priority={area.priority} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function AreaSection({ area, bg }: { area: AssessmentArea; bg: string }) {
  return (
    <div className="page-break" style={{ padding: 'var(--sec-pad)', background: bg }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52,
          background: '#263590', color: 'white', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: DISPLAY_FONT,
          fontSize: 24, fontWeight: 700,
        }}>
          {area.id}
        </div>
        <div>
          <h2 style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 23, fontWeight: 700, color: '#263590',
            textTransform: 'uppercase', letterSpacing: '-0.01em',
            margin: '0 0 10px', lineHeight: 1.15,
          }}>
            {area.title}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={area.status} label={area.statusLabel} />
            <PriorityBadge priority={area.priority} />
          </div>
        </div>
      </div>

      {/* Context callout */}
      <div style={{
        padding: '14px 18px',
        background: '#eef0fb',
        borderLeft: '4px solid #263590',
        fontSize: 14, lineHeight: 1.7, color: '#1a1a2e',
        fontStyle: 'italic', marginBottom: 28,
      }}>
        {area.context}
      </div>

      {/* Two-column: what public review showed + what only the org can answer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 28, marginBottom: 28 }}>
        <div>
          <BlockHeading>What We Saw</BlockHeading>
          <BulletList items={area.whatWeFound} color="#4a5478" dot="•" />
        </div>
        {area.openQuestions.length > 0 && (
          <div>
            <BlockHeading>Questions For You</BlockHeading>
            <BulletList items={area.openQuestions} color="#263590" dot="?" />
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: 28 }}>
        <BlockHeading>What We Suggest</BlockHeading>
        <BulletList items={area.recommendations} color="#1a7a4a" dot="→" />
      </div>

      {/* Resources */}
      {area.resources.length > 0 && (
        <div>
          <BlockHeading>Free Tools For This</BlockHeading>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {area.resources.map((r, i) => (
              <ResourceCard key={i} resource={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriorityPlan({ phases }: { phases: ReportData['priorityPhases'] }) {
  const phaseColors = ['#c0392b', '#b06a00', '#1a7a4a'];

  return (
    <div className="page-break" style={{ padding: 'var(--sec-pad)', background: '#263590' }}>
      <SectionLabel>
        <span style={{ color: '#f5d84a' }}>Action Plan</span>
      </SectionLabel>
      <SectionHeading light>Where To Start</SectionHeading>
      <p style={{ fontSize: 14, color: '#c3cbe8', margin: '0 0 40px', maxWidth: '62ch', lineHeight: 1.7 }}>
        Nobody does all of this at once, and you shouldn&apos;t try. Here&apos;s the order we&apos;d
        take it in, weighed by legal exposure, community impact, and honest effort. Start small,
        say publicly what you&apos;re working on, and keep going. Access is a practice, not a project.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-3)', gap: 20 }}>
        {phases.map((phase, i) => (
          <div key={i} style={{ background: 'white', padding: '24px 22px' }}>
            <div style={{
              display: 'inline-block',
              background: phaseColors[i], color: 'white',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', padding: '4px 10px', marginBottom: 10,
            }}>
              {phase.phase}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#263590', marginBottom: 14, lineHeight: 1.4 }}>
              {phase.label}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
              {phase.actions.map((action, j) => (
                <li key={j} style={{
                  fontSize: 13, lineHeight: 1.65, color: '#1a1a2e', marginBottom: 8,
                  paddingLeft: 2,
                }}>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegalNotes({ notes }: { notes: ReportData['legalNotes'] }) {
  return (
    <div className="page-break" style={{ padding: 'var(--sec-pad)', background: 'white' }}>
      <SectionLabel>Funder & Legal Notes</SectionLabel>
      <SectionHeading>The Legal Floor</SectionHeading>
      <p style={{ fontSize: 13, color: '#4a5478', margin: '0 0 28px', maxWidth: '68ch', lineHeight: 1.7 }}>
        The law is the minimum, not the goal. But you deserve to know exactly where the minimum
        sits, in plain language, so here it is. None of this is legal advice; it&apos;s a map of
        which rules apply to you and what they ask for.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 20 }}>
        {notes.map((note, i) => (
          <div key={i} style={{
            padding: '22px 24px',
            background: '#f0f2fb',
            borderTop: '4px solid #263590',
          }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#263590', marginBottom: 10 }}>
              {note.framework}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: '#1a1a2e', margin: '0 0 14px' }}>
              {note.description}
            </p>
            <div style={{
              padding: '10px 14px',
              background: '#d8dcf5',
              fontSize: 13, color: '#263590', fontWeight: 600,
              lineHeight: 1.6,
            }}>
              <strong>Action:</strong> {note.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyResources({ categories }: { categories: ReportData['keyResources'] }) {
  return (
    <div className="page-break" style={{ padding: 'var(--sec-pad)', background: '#f6f7fa' }}>
      <SectionLabel>Key Resources</SectionLabel>
      <SectionHeading>Free Tools, All In One Place</SectionHeading>
      <p style={{ fontSize: 13, color: '#4a5478', margin: '0 0 36px', maxWidth: '68ch', lineHeight: 1.7 }}>
        Every link below is free, verified, and lives in the Collective&apos;s library at{' '}
        <a href="https://artisticaccessibility.com/resources" style={{ color: '#263590', fontWeight: 600 }}>
          artisticaccessibility.com/resources
        </a>
        . Wherever possible we point you to tools made by disabled people, because access work is
        better when the people it serves are the ones who built it.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 32 }}>
        {categories.map((cat, i) => (
          <div key={i}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#263590',
              paddingBottom: 8, marginBottom: 12,
              borderBottom: '3px solid #f5d84a',
            }}>
              {cat.category}
            </div>
            {cat.items.map((item, j) => (
              <a
                key={j}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  gap: 8, fontSize: 13, color: '#263590',
                  textDecoration: 'none', padding: '7px 0',
                  borderBottom: '1px solid #e6e9f5',
                }}
              >
                <span style={{ fontWeight: 600 }}>{item.name}</span>
                <span style={{ fontSize: 11, color: '#4a5a8a', flexShrink: 0 }}>
                  {item.url.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
              </a>
            ))}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 36,
        padding: '18px 22px',
        background: '#263590', color: 'white',
        textAlign: 'center', fontSize: 13, lineHeight: 1.8,
      }}>
        <strong>The full library, free:</strong>{' '}
        <a href="https://artisticaccessibility.com/resources" style={{ color: '#f5d84a', fontWeight: 700 }}>
          artisticaccessibility.com/resources
        </a>
        <br />
        <span style={{ fontSize: 12, color: '#d8dcf5' }}>
          Printable checklists and posters live in The Printer at{' '}
          <a href="https://artisticaccessibility.com/printer" style={{ color: '#f5d84a', fontWeight: 700 }}>/printer</a>
          , and our community calendar of accessible arts events is at{' '}
          <a href="https://artisticaccessibility.com/calendar" style={{ color: '#f5d84a', fontWeight: 700 }}>/calendar</a>
          . List your accessible events there any time, free.
        </span>
      </div>
    </div>
  );
}

function ServicesSection({ services }: { services: ReportData['services'] }) {
  const tiers = [
    { key: 'community' as const,   label: 'Community',      range: 'Under $75K'    },
    { key: 'small' as const,       label: 'Small Nonprofit', range: '$75K to $250K' },
    { key: 'established' as const, label: 'Established',    range: '$250K to $1M'   },
    { key: 'large' as const,       label: 'Large Org',      range: '$1M+'          },
  ];

  return (
    <div className="page-break" style={{ padding: 'var(--sec-pad)', background: '#0d1e4a' }}>
      <SectionLabel>
        <span style={{ color: '#f5d84a' }}>How We Can Help</span>
      </SectionLabel>
      <SectionHeading light>Services & Sliding-Scale Pricing</SectionHeading>

      <div style={{
        padding: '18px 22px',
        background: 'rgba(245,216,74,0.07)',
        border: '1px solid rgba(245,216,74,0.2)',
        fontSize: 14, color: '#d8dcf5', lineHeight: 1.75,
        marginBottom: 32,
      }}>
        <strong style={{ color: '#f5d84a' }}>This document is free, and it&apos;s yours.</strong> Genuine
        access shouldn&apos;t require an expensive consultant. If you want hands-on help with anything
        in it, here&apos;s what that costs, priced on a sliding scale by your annual budget. You pick
        your tier; we trust you. No org is too small.
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th scope="col" style={{
                padding: '12px 16px', textAlign: 'left',
                background: '#1a2568', color: 'white', fontWeight: 700, width: '30%',
              }}>
                Service
              </th>
              {tiers.map(t => (
                <th key={t.key} scope="col" style={{
                  padding: '12px 12px', textAlign: 'center',
                  background: '#1a2568', color: 'white', fontWeight: 700,
                }}>
                  <div>{t.label}</div>
                  <div style={{ fontSize: 10, color: '#aeb9e2', fontWeight: 400 }}>{t.range}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((s, i) => (
              <tr key={i} style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
              }}>
                <td style={{ padding: '10px 16px', color: '#d8dcf5', fontWeight: 500 }}>
                  {s.name}
                </td>
                {tiers.map(t => (
                  <td key={t.key} style={{
                    padding: '10px 12px', textAlign: 'center',
                    color: '#f5d84a', fontWeight: 700, fontSize: 13,
                  }}>
                    {s.prices[t.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Featured: event staffing. Deliberately no price column, because staffing
          is scoped per event rather than sold off a menu. */}
      <div style={{
        marginTop: 28,
        padding: '24px 26px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderLeft: '4px solid #f5d84a',
      }}>
        <div style={{ fontSize: 10, color: '#f5d84a', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
          Also On The Table
        </div>
        <div style={{
          fontFamily: DISPLAY_FONT, fontSize: 18, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '-0.01em',
          color: 'white', marginBottom: 10,
        }}>
          We can staff your event
        </div>
        <p style={{ fontSize: 14, color: '#d8dcf5', margin: '0 0 12px', lineHeight: 1.75, maxWidth: '72ch' }}>
          Sometimes what an event needs isn&apos;t advice. It&apos;s people. We provide event staffing
          at every level of access: general event workers with accessibility knowledge, dedicated
          accessibility staff, ASL interpreters, caption providers, audio describers, and more,
          depending on what your event is in need of.
        </p>
        <p style={{ fontSize: 13, color: '#c3cbe8', margin: 0, lineHeight: 1.7, maxWidth: '72ch' }}>
          You won&apos;t find a price on this one, because there isn&apos;t a menu. Staffing depends on
          your event&apos;s size, length, and needs, so we scope it together. Tell us what you&apos;re
          planning and we&apos;ll build the crew and the quote with you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 20, marginTop: 28 }}>
        <div style={{
          padding: '18px 20px',
          background: 'rgba(245,216,74,0.08)',
          border: '1px solid rgba(245,216,74,0.2)',
        }}>
          <div style={{ fontSize: 10, color: '#f5d84a', fontWeight: 800, letterSpacing: '0.12em', marginBottom: 8 }}>
            PRICING NOTE
          </div>
          <p style={{ fontSize: 13, color: '#d8dcf5', margin: 0, lineHeight: 1.7 }}>
            {"Pricing is based on your organization's total annual operating budget."} Please self-select your tier honestly. Bundled services are discounted 15 to 20%.
          </p>
        </div>
        <div style={{
          padding: '18px 20px',
          background: '#263590',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', textAlign: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: 14, color: 'white', fontWeight: 700 }}>
            Ready to take the next step?
          </div>
          <a
            href="https://artisticaccessibility.com/contact"
            style={{ color: '#f5d84a', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}
          >
            artisticaccessibility.com/contact
          </a>
          <div style={{ fontSize: 12, color: '#c3cbe8' }}>
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
        <Logo alt="" height={44} />
        <div style={{ fontSize: 12, color: '#7788bb' }}>
          artisticaccessibility.com &middot;{' '}
          <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 12, letterSpacing: '0.02em' }}>
            Artistic Accessibility
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  const data = getReportData(orgSlug);
  if (!data) return {};
  return {
    title: `${data.org.name}: Accessibility Assessment · Artistic Accessibility`,
  };
}

const AREA_BG = ['white', '#f6f7fa'];

export default async function ReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const data = getReportData(orgSlug);
  if (!data) notFound();

  return (
    <>
      <PrintStyles />

      <div className="print-fab no-print">
        <PrintButton />
      </div>

      <div className="report-bg">
        <div className="report-doc">
          <Cover org={data.org} />
          <AboutSection />
          <OrgOverview data={data} />
          <AssessmentSummary areas={data.assessmentAreas} assessmentDate={data.org.assessmentDate} />
          {data.assessmentAreas.map((area, i) => (
            <AreaSection key={area.id} area={area} bg={AREA_BG[i % 2]} />
          ))}
          <PriorityPlan phases={data.priorityPhases} />
          <LegalNotes notes={data.legalNotes} />
          <KeyResources categories={data.keyResources} />
          <ServicesSection services={data.services} />
        </div>
      </div>
    </>
  );
}
