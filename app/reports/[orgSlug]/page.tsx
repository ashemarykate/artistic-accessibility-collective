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
import PrintButton from './PrintButton';

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
      fontFamily: "'AAC Display', Impact, 'Arial Black', sans-serif",
      fontSize: 30, fontWeight: 400, margin: '0 0 24px',
      color: light ? 'white' : '#263590',
      lineHeight: 1.1,
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
        }
      }
    `}</style>
  );
}

function Cover({ org }: { org: ReportData['org'] }) {
  return (
    <div style={{
      position: 'relative',
      background: '#0d1e4a',
      minHeight: 640,
      overflow: 'hidden',
    }}>
      {/* Cover photo */}
      {org.coverPhoto && (
        <img
          src={org.coverPhoto}
          alt=""
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 40%',
          }}
        />
      )}

      {/* Overlay: heavy at bottom so text is readable, lighter at top to let photo breathe */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(170deg, rgba(13,30,74,0.72) 0%, rgba(13,30,74,0.91) 60%, rgba(13,30,74,0.97) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        padding: 'var(--cover-pad)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 640,
      }}>
        <Logo alt="" height={60} style={{ marginBottom: 72 }} />

        <div style={{ flex: 1 }}>
          <div style={{ width: 56, height: 4, background: '#f5d84a', marginBottom: 28 }} />

          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#7788bb', marginBottom: 14,
          }}>
            Accessibility Assessment
          </div>

          <h1 style={{
            fontFamily: "'AAC Display', Impact, 'Arial Black', sans-serif",
            fontSize: 56, fontWeight: 400, lineHeight: 1.02,
            color: 'white', margin: '0 0 14px', maxWidth: 600,
          }}>
            {org.name}
          </h1>

          <div style={{ fontSize: 17, color: '#d8dcf5', marginBottom: 12 }}>
            {org.location} &middot; {org.type}
          </div>

          <div style={{ fontSize: 13, color: '#7788bb', marginBottom: 56 }}>
            Prepared by{' '}
            <span style={{
              fontFamily: "'AAC Display', Impact, 'Arial Black', sans-serif",
              color: '#d8dcf5', fontSize: 14,
            }}>
              Artistic Accessibility Collective
            </span>
            {' '}&middot; {org.preparedDate}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 20, marginTop: 48,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
          fontSize: 11, color: '#7788bb',
        }}>
          <span>Based on public review, {org.assessmentDate}</span>
          <span>artisticaccessibility.com</span>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: '#f6f7fa' }}>
      <SectionLabel>About This Document</SectionLabel>
      <SectionHeading>How This Assessment Works</SectionHeading>

      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 32 }}>
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#1a1a2e', margin: '0 0 16px' }}>
            The Artistic Accessibility Collective (AAC) operates as a free, community-driven resource hub for practitioners at the intersection of accessibility and arts. Our library contains 126 verified free resources across law/policy, captioning, audio description, live events, digital access, Deaf culture/ASL, and disability justice.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#1a1a2e', margin: 0 }}>
            When organizations request assistance, AAC prepares assessment documents grounded in publicly observable materials, flagged with specific questions requiring more information, and stocked with direct resource links relevant to organizational context.
          </p>
        </div>
        <div style={{
          background: '#d8dcf5',
          padding: '24px 26px',
          fontSize: 14,
          lineHeight: 1.75,
          color: '#1a1a2e',
        }}>
          <strong style={{ display: 'block', marginBottom: 12, color: '#263590' }}>Framework Explained</strong>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Legal compliance</strong> establishes baseline requirements.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            <strong>Disabled community feedback</strong> reveals what genuinely functions, which frequently exceeds or differs from minimum standards.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Community self-determination</strong> guides the compass.
          </p>
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

function AssessmentSummary({ areas }: { areas: ReportData['assessmentAreas'] }) {
  return (
    <div style={{ padding: 'var(--sec-pad)', background: '#f6f7fa' }}>
      <SectionLabel>Assessment Snapshot</SectionLabel>
      <SectionHeading>Current Accessibility Snapshot</SectionHeading>
      <p style={{ fontSize: 13, color: '#4a5478', margin: '0 0 28px' }}>
        Based on public review of website and event pages, May 2026
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
          fontFamily: "'AAC Display', Impact, 'Arial Black', sans-serif",
          fontSize: 26, fontWeight: 400,
        }}>
          {area.id}
        </div>
        <div>
          <h2 style={{
            fontFamily: "'AAC Display', Impact, 'Arial Black', sans-serif",
            fontSize: 26, fontWeight: 400, color: '#263590',
            margin: '0 0 10px', lineHeight: 1.1,
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

      {/* Two-column: Found + Questions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'var(--cols-2)', gap: 28, marginBottom: 28 }}>
        <div>
          <BlockHeading>What We Found</BlockHeading>
          <BulletList items={area.whatWeFound} color="#4a5478" dot="•" />
        </div>
        {area.openQuestions.length > 0 && (
          <div>
            <BlockHeading>Open Questions</BlockHeading>
            <BulletList items={area.openQuestions} color="#263590" dot="?" />
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div style={{ marginBottom: 28 }}>
        <BlockHeading>Recommendations</BlockHeading>
        <BulletList items={area.recommendations} color="#1a7a4a" dot="→" />
      </div>

      {/* Resources */}
      {area.resources.length > 0 && (
        <div>
          <BlockHeading>Resources</BlockHeading>
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
      <SectionHeading light>Priority Action Plan</SectionHeading>
      <p style={{ fontSize: 14, color: '#c3cbe8', margin: '0 0 40px', maxWidth: '62ch', lineHeight: 1.7 }}>
        Not everything needs to happen at once. Below is a phased approach prioritized by legal exposure, community impact, and implementation effort.
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
      <SectionHeading>Legal Framework & Compliance</SectionHeading>

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
      <SectionHeading>Key Resources at a Glance</SectionHeading>
      <p style={{ fontSize: 13, color: '#4a5478', margin: '0 0 36px', lineHeight: 1.7 }}>
        All links are free. All are from the AAC library at{' '}
        <a href="https://artisticaccessibility.com/resources" style={{ color: '#263590', fontWeight: 600 }}>
          artisticaccessibility.com/resources
        </a>
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
        textAlign: 'center', fontSize: 13,
      }}>
        <strong>Full AAC Resource Library: 126 Free Resources</strong>
        {' '}
        <a href="https://artisticaccessibility.com/resources" style={{ color: '#f5d84a', fontWeight: 700 }}>
          artisticaccessibility.com/resources
        </a>
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
        <strong style={{ color: '#f5d84a' }}>Included with this document:</strong> Overview of Current State of Org (COMPLIMENTARY)<br />
        {"Genuine access shouldn't require an expensive consultant."} For organizations ready to go further, we offer hands-on services priced on a sliding scale based on annual budget. No org is too small.
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
          <span style={{ fontFamily: "'AAC Display', Impact, 'Arial Black', sans-serif", fontSize: 13 }}>
            Artistic Accessibility Collective
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
    title: `${data.org.name}: Accessibility Assessment · Artistic Accessibility Collective`,
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
          <AssessmentSummary areas={data.assessmentAreas} />
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
