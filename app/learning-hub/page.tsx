'use client';

import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'asl',       label: 'ASL & Interpreting', icon: '🤟', navBg: '#d4a000', navText: '#fff', headerBg: '#fde68a', headerText: '#7a5800' },
  { id: 'caption',   label: 'Captioning',          icon: '💬', navBg: '#1a5fbf', navText: '#fff', headerBg: '#dbeafe', headerText: '#1a3a7a' },
  { id: 'ad',        label: 'Audio Description',   icon: '🎙️', navBg: '#1e7a4a', navText: '#fff', headerBg: '#d1fae5', headerText: '#0f4a2a' },
  { id: 'live',      label: 'Live Events',          icon: '🎭', navBg: '#b82870', navText: '#fff', headerBg: '#fce7f3', headerText: '#7a1a4a' },
  { id: 'film',      label: 'Film & Video',         icon: '🎬', navBg: '#6a2abf', navText: '#fff', headerBg: '#ede9fe', headerText: '#3a1a7a' },
  { id: 'rights',    label: 'Rights & Law',         icon: '⚖️', navBg: '#b84a10', navText: '#fff', headerBg: '#ffedd5', headerText: '#7a2a00' },
  { id: 'dj',        label: 'Disability Justice',   icon: '✊', navBg: '#1a3a8a', navText: '#fff', headerBg: '#e0e7ff', headerText: '#1a2a5a' },
  { id: 'reading',   label: 'Reading List',         icon: '📚', navBg: '#3a6a3a', navText: '#fff', headerBg: '#dcfce7', headerText: '#1a3a1a' },
];

// ── Resource data ─────────────────────────────────────────────────────────────
const RESOURCES: Record<string, { title: string; desc: string; badge: string; badgeBg: string; link?: string }[]> = {
  asl: [
    {
      title: 'Concert Interpreting with Amber Galloway',
      desc: 'The standard for musical ASL performance — how Galloway\'s dynamic interpreting changed what concert access looks like.',
      badge: 'VIDEO', badgeBg: '#d4a000',
    },
    {
      title: 'When to Hire a CDI (Certified Deaf Interpreter)',
      desc: 'Guidance on Deaf-Blind interpreting, legal proceedings, and situations where a CDI is essential, not optional.',
      badge: 'ARTICLE', badgeBg: '#1a5fbf',
    },
    {
      title: 'NAD: Interpreting Resources',
      desc: 'The National Association of the Deaf\'s guide to interpreter qualifications, ethics, and hiring practices.',
      badge: 'GUIDE', badgeBg: '#1e7a4a',
      link: 'https://www.nad.org',
    },
    {
      title: 'What Is a DASL? Director of Artistic Sign Language',
      desc: 'How the DASL role differs from interpreting — used in film (CODA, Barbie) and stage to shape ASL as performance.',
      badge: 'EXPLAINER', badgeBg: '#6a2abf',
    },
  ],
  caption: [
    {
      title: 'Caption with Intention',
      desc: 'The open-source guide to expressive captioning — developed with the Deaf community, winner of an Academy Award of Merit.',
      badge: 'GUIDE', badgeBg: '#1e7a4a',
      link: 'https://captionwithintention.org',
    },
    {
      title: 'CART vs. AI Captions: What\'s the Difference?',
      desc: 'Communication Access Realtime Translation by a human vs. automated speech recognition — when each is appropriate and what quality gaps exist.',
      badge: 'ARTICLE', badgeBg: '#1a5fbf',
    },
    {
      title: 'Open Captions at Live Theater: A Production Guide',
      desc: 'Practical steps for adding open captions to live performance — equipment, placement, timing, and working with caption providers.',
      badge: 'HOW-TO', badgeBg: '#b82870',
    },
    {
      title: 'Cheryl Green: Captioning as Disability Justice',
      desc: 'Caption quality advocate Cheryl Green reframes captions not as a technical fix but as a justice practice.',
      badge: 'PODCAST', badgeBg: '#b84a10',
    },
  ],
  ad: [
    {
      title: 'Introduction to Audio Description — Joel Snyder',
      desc: 'The foundational text from one of the field\'s pioneers. Covers style, pacing, objectivity, and the art of the AD script.',
      badge: 'BOOK', badgeBg: '#3a6a3a',
    },
    {
      title: 'Reid My Mind Radio',
      desc: 'Thomas Reid\'s podcast on blindness and disability culture, including practical AD education and community interviews.',
      badge: 'PODCAST', badgeBg: '#b84a10',
      link: 'https://reidmymind.com',
    },
    {
      title: 'Kinetic Light: Audimance',
      desc: 'Disability-led dance company Kinetic Light\'s open-source accessible performance model — audio description as artistic collaboration.',
      badge: 'EXAMPLE', badgeBg: '#6a2abf',
    },
    {
      title: 'Enhanced Audio Description Research (York University)',
      desc: 'Academic research on emotionally engaging AD that goes beyond visual inventory — the case for creative description.',
      badge: 'RESEARCH', badgeBg: '#1a3a8a',
    },
  ],
  live: [
    {
      title: 'TDF Accessibility Programs Overview',
      desc: 'Theatre Development Fund\'s programs for Deaf, hard of hearing, blind, low vision, and neurodivergent audiences — ASL-interpreted, captioned, relaxed, and audio described shows.',
      badge: 'GUIDE', badgeBg: '#1e7a4a',
      link: 'https://www.tdf.org',
    },
    {
      title: 'What Is a Relaxed Performance?',
      desc: 'Sensory-adjusted shows for autistic audiences, people with dementia, and anyone who benefits from a more flexible environment. How to produce one.',
      badge: 'EXPLAINER', badgeBg: '#1a5fbf',
    },
    {
      title: 'Attitude is Everything: Live Music Access',
      desc: 'UK-based organization setting the standard for accessible live music venues and festival accessibility.',
      badge: 'RESOURCE', badgeBg: '#b82870',
      link: 'https://www.attitudeiseverything.org.uk',
    },
    {
      title: 'Touch Tours Before the Show',
      desc: 'How to run pre-show touch tours for blind and low vision audience members — what to include, who leads, and how to schedule them.',
      badge: 'HOW-TO', badgeBg: '#b84a10',
    },
  ],
  film: [
    {
      title: 'CVAA & Streaming: What Platforms Are Required to Provide',
      desc: 'The 21st Century Communications and Video Accessibility Act — what Netflix, Hulu, and Amazon must offer and where gaps still exist.',
      badge: 'LAW', badgeBg: '#b84a10',
    },
    {
      title: 'Making Your Film Accessible: Pre-Production Decisions',
      desc: 'Accessibility built in from the start — casting, accessible sets, on-set communication, disability consultants, and production design.',
      badge: 'GUIDE', badgeBg: '#1e7a4a',
    },
    {
      title: 'DCMP: Described and Captioned Media Program',
      desc: 'Free captioned and described educational media, plus producer guidelines for high-quality captions and descriptions.',
      badge: 'RESOURCE', badgeBg: '#1a5fbf',
      link: 'https://dcmp.org',
    },
    {
      title: 'AI Captions on YouTube: The Quality Problem',
      desc: 'Auto-generated captions are a starting point, not a solution — understanding error rates, speaker ID failures, and why human review matters.',
      badge: 'ARTICLE', badgeBg: '#6a2abf',
    },
  ],
  rights: [
    {
      title: 'ADA Title III & Places of Public Accommodation',
      desc: 'How the Americans with Disabilities Act applies to theaters, concert venues, galleries, and arts organizations — physical access, communication access, and more.',
      badge: 'LAW', badgeBg: '#b84a10',
    },
    {
      title: 'WCAG 2.2 AA: The Current Web Standard',
      desc: 'Web Content Accessibility Guidelines — what AA compliance requires for websites, streaming platforms, and digital ticketing.',
      badge: 'STANDARD', badgeBg: '#1a3a8a',
      link: 'https://www.w3.org/WAI/WCAG22/quickref/',
    },
    {
      title: 'Section 508 & Federally Funded Arts',
      desc: 'If your organization receives federal funding, Section 508 applies. What that means for digital content, websites, and procurement.',
      badge: 'GUIDE', badgeBg: '#1e7a4a',
    },
    {
      title: 'UN CRPD: Article 30 — Cultural Life',
      desc: 'The UN Convention on the Rights of Persons with Disabilities specifically addresses access to culture, recreation, and leisure.',
      badge: 'INTERNATIONAL', badgeBg: '#6a2abf',
    },
  ],
  dj: [
    {
      title: 'Sins Invalid: 10 Principles of Disability Justice',
      desc: 'The foundational framework from the disability justice movement — intersectionality, leadership of those most impacted, cross-movement solidarity.',
      badge: 'FOUNDATIONAL', badgeBg: '#1a3a8a',
      link: 'https://www.sinsinvalid.org',
    },
    {
      title: 'Alice Wong: Disability Visibility Project',
      desc: 'First-person disability narratives, community stories, and the Disability Visibility anthology — essential reading.',
      badge: 'COMMUNITY', badgeBg: '#b82870',
      link: 'https://disabilityvisibilityproject.com',
    },
    {
      title: 'Access Intimacy — Mia Mingus',
      desc: 'Mia Mingus\'s concept of access intimacy: the feeling of being truly understood in your access needs, not just accommodated.',
      badge: 'ESSAY', badgeBg: '#6a2abf',
    },
    {
      title: 'Crip Theory & Arts: Beyond Compliance',
      desc: 'How crip theory reframes disability in performance — non-normative bodies and minds as aesthetic, political, and creative forces.',
      badge: 'ACADEMIC', badgeBg: '#3a6a3a',
    },
  ],
  reading: [
    {
      title: 'The Oxford Handbook of Music and Disability Studies',
      desc: 'Comprehensive academic collection covering disability in music performance, composition, education, and music therapy.',
      badge: 'BOOK', badgeBg: '#3a6a3a',
    },
    {
      title: 'Beauty is a Verb: The New Poetry of Disability',
      desc: 'Anthology of poetry by disabled writers — crip joy, pain, humor, and beauty. Essential for understanding disability aesthetics.',
      badge: 'POETRY', badgeBg: '#b82870',
    },
    {
      title: 'Golem Girl — Riva Lehrer',
      desc: 'Memoir and visual art from the disability portraiture artist — disability, body, and art-making as inseparable.',
      badge: 'MEMOIR', badgeBg: '#6a2abf',
    },
    {
      title: 'True Biz — Sara Novic',
      desc: 'Novel set in a residential school for Deaf students — ASL, Deaf culture, identity, and the politics of cochlear implants.',
      badge: 'FICTION', badgeBg: '#1a5fbf',
    },
  ],
};

// ── Resource card ─────────────────────────────────────────────────────────────
function ResourceCard({
  title, desc, badge, badgeBg, link,
}: { title: string; desc: string; badge: string; badgeBg: string; link?: string }) {
  const inner = (
    <div style={{
      background: '#fff',
      border: '1px solid #ccc',
      borderRadius: 4,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      height: '100%',
      boxSizing: 'border-box',
      transition: 'box-shadow 0.15s',
    }}
    className="resource-card"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span style={{
          display: 'inline-block',
          background: badgeBg,
          color: '#fff',
          fontSize: 9,
          fontWeight: 'bold',
          padding: '1px 5px',
          borderRadius: 2,
          letterSpacing: '0.06em',
          flexShrink: 0,
          marginTop: 1,
        }}>{badge}</span>
        <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#263590', lineHeight: 1.3 }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.73rem', color: '#444', margin: 0, lineHeight: 1.45 }}>{desc}</p>
      {link && (
        <span style={{ fontSize: '0.7rem', color: '#1a5fbf', marginTop: 'auto', paddingTop: 4 }}>
          Visit site →
        </span>
      )}
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {inner}
      </a>
    );
  }
  return <div style={{ height: '100%' }}>{inner}</div>;
}

// ── Category section ──────────────────────────────────────────────────────────
function CategorySection({ cat }: { cat: typeof CATEGORIES[0] }) {
  const items = RESOURCES[cat.id] ?? [];
  return (
    <section id={cat.id} style={{ marginBottom: 18 }}>
      <div style={{
        background: cat.headerBg,
        border: `2px solid ${cat.navBg}`,
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
      }}>
        <span aria-hidden="true" style={{ fontSize: 16 }}>{cat.icon}</span>
        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: cat.headerText, letterSpacing: '0.02em' }}>
          {cat.label}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: '0.68rem',
          color: cat.navBg, fontWeight: 'bold',
          border: `1px solid ${cat.navBg}`,
          padding: '1px 7px', borderRadius: 2, cursor: 'pointer',
        }}>MORE »</span>
      </div>
      <div style={{
        border: `2px solid ${cat.navBg}`,
        borderTop: `1px solid ${cat.navBg}`,
        borderRadius: '0 0 6px 6px',
        background: '#fafaf8',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
      }}>
        {items.map((r) => (
          <ResourceCard key={r.title} {...r} />
        ))}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LearningHub() {
  return (
    <BrowserChrome variant="netscape" title="AAC Learning Hub" url="http://learn.artisticaccessibility.com">
      <main style={{ background: 'var(--aac-blue)', minHeight: '100%' }}>

        {/* ── Top banner ──────────────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a2a7a 0%, #263590 50%, #3a4aaa 100%)',
          borderBottom: '4px solid #f5d84a',
          padding: '12px 16px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{
            background: '#f5d84a',
            borderRadius: '50%',
            width: 52, height: 52, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }} aria-hidden="true">🎓</div>
          <div>
            <h1 className="font-display" style={{
              color: '#f5d84a',
              fontSize: '1.5rem',
              margin: 0,
              lineHeight: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}>
              AAC Learning Hub
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.8rem',
              margin: '3px 0 0',
            }}>
              Resources for arts accessibility professionals
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link href="/resources" style={{
              background: '#f5d84a', color: '#263590',
              fontWeight: 'bold', fontSize: '0.75rem',
              padding: '4px 12px', borderRadius: 12,
              textDecoration: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>← Resources</Link>
          </div>
        </div>

        {/* ── Layout: sidebar + main ───────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}>

          {/* ── Sidebar nav ─────────────────────────────────────────────────── */}
          <nav
            aria-label="Learning Hub categories"
            style={{
              width: 168,
              flexShrink: 0,
              background: '#1a2568',
              borderRight: '3px solid #f5d84a',
              minHeight: 600,
            }}
          >
            <div style={{
              background: '#f5d84a',
              color: '#263590',
              fontWeight: 'bold',
              fontSize: '0.7rem',
              padding: '5px 10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }} aria-hidden="true">
              TOPICS
            </div>
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 10px',
                  background: cat.navBg,
                  color: cat.navText,
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  borderBottom: '2px solid rgba(0,0,0,0.15)',
                  transition: 'filter 0.1s',
                }}
                className="hub-nav-link"
              >
                <span aria-hidden="true" style={{ fontSize: 15, flexShrink: 0 }}>{cat.icon}</span>
                <span style={{ lineHeight: 1.2 }}>{cat.label}</span>
                <span aria-hidden="true" style={{ marginLeft: 'auto', opacity: 0.7, fontSize: 10 }}>▶</span>
              </a>
            ))}

            {/* Spotlight box */}
            <div style={{
              background: '#263590',
              border: '2px solid #f5d84a',
              margin: 10,
              padding: 10,
              borderRadius: 4,
            }}>
              <div style={{
                background: '#f5d84a', color: '#263590',
                fontWeight: 'bold', fontSize: '0.65rem',
                padding: '2px 6px', marginBottom: 6,
                letterSpacing: '0.06em',
                display: 'inline-block',
              }}>★ SPOTLIGHT</div>
              <p style={{ color: '#fff', fontSize: '0.72rem', margin: 0, lineHeight: 1.4 }}>
                <strong style={{ color: '#f5d84a' }}>Caption with Intention</strong> — the open-source expressive captioning guide, co-developed with the Deaf community.
              </p>
              <a
                href="https://captionwithintention.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: 7,
                  background: '#f5d84a',
                  color: '#263590',
                  fontWeight: 'bold',
                  fontSize: '0.68rem',
                  padding: '3px 10px',
                  borderRadius: 2,
                  textDecoration: 'none',
                }}
              >
                Visit Site →
              </a>
            </div>

            {/* New badge */}
            <div style={{
              background: '#b84a10',
              border: '2px solid #f5d84a',
              margin: '0 10px 10px',
              padding: 8,
              borderRadius: 4,
              textAlign: 'center',
            }}>
              <div style={{ color: '#f5d84a', fontWeight: 'bold', fontSize: '0.68rem', letterSpacing: '0.1em' }}>🆕 NEW THIS WEEK</div>
              <p style={{ color: '#fff', fontSize: '0.7rem', margin: '5px 0 0', lineHeight: 1.35 }}>
                Relaxed Performance Production Guide added to Live Events
              </p>
            </div>
          </nav>

          {/* ── Main content ─────────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, padding: '14px 14px 20px' }}>

            {/* Featured / hero card */}
            <div style={{
              background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
              border: '3px solid #d4a000',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
            }}>
              <div style={{
                background: '#d4a000',
                borderRadius: 6,
                width: 56, height: 56, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }} aria-hidden="true">✨</div>
              <div>
                <div style={{
                  background: '#263590',
                  color: '#f5d84a',
                  fontWeight: 'bold',
                  fontSize: '0.65rem',
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 2,
                  letterSpacing: '0.08em',
                  marginBottom: 5,
                }}>FEATURED RESOURCE</div>
                <h2 style={{
                  margin: '0 0 4px',
                  color: '#1a2568',
                  fontSize: '1rem',
                  lineHeight: 1.2,
                }}>
                  The Disability Visibility Project — Alice Wong
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#4a3a00', lineHeight: 1.5 }}>
                  First-person disability stories, essays, and community media. The Disability Visibility anthology and podcast are essential starting points for anyone working at the intersection of disability and the arts.
                </p>
                <a
                  href="https://disabilityvisibilityproject.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    background: '#263590',
                    color: '#f5d84a',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    padding: '4px 14px',
                    borderRadius: 3,
                    textDecoration: 'none',
                  }}
                >
                  Visit Site →
                </a>
              </div>
            </div>

            {/* All category sections */}
            {CATEGORIES.map((cat) => (
              <CategorySection key={cat.id} cat={cat} />
            ))}
          </div>
        </div>

        <style>{`
          .hub-nav-link:hover {
            filter: brightness(1.15);
          }
          .resource-card:hover {
            box-shadow: 0 2px 8px rgba(38,53,144,0.18);
          }
          @media (max-width: 600px) {
            nav[aria-label="Learning Hub categories"] {
              display: none;
            }
          }
        `}</style>
      </main>
    </BrowserChrome>
  );
}
