'use client';

/**
 * DEV PREVIEW ONLY — not linked from anywhere in the app.
 * Visit localhost:3000/dev to see the profile layout with sample data.
 * Safe to leave in the codebase; it's just a static design sandbox.
 */

import Link from 'next/link';

const S = {
  highlights: '#263590',
  about:      '#7c3aed',
  whatIDo:    '#059669',
  top8:       '#dc2626',
  videos:     '#d97706',
  certs:      '#1d4ed8',
  activities: '#db2777',
  languages:  '#0891b2',
  contact:    '#374151',
};

function SectionCard({ color, emoji, title, children }: {
  color: string; emoji?: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="content-card" style={{ padding: '1rem 1.25rem' }}>
      <h2
        className="font-display"
        style={{
          color,
          fontSize: '1.25rem',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: `3px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}
      >
        {emoji && <span aria-hidden="true">{emoji}</span>}
        <span dangerouslySetInnerHTML={{ __html: title }} />
      </h2>
      {children}
    </div>
  );
}

const SAMPLE = {
  name:        'Jordan Rivera',
  username:    'jordan-rivera',
  pronouns:    'they/them',
  location:    'Austin, TX',
  memberSince: 2024,
  endorsements: 12,
  experience:  8,
  bgColor:     '#263590',
  highlights:  'SXSW 2026 accessibility lead. Specializing in large-scale live event interpretation and real-time CART captioning. Available for touring productions, festivals, and corporate events nationwide.',
  bio:         "I've spent the last 8 years making live experiences accessible to everyone in the room — from intimate theatre to 80,000-person music festivals. I believe accessibility isn't a checklist, it's a craft.\n\nCurrently based in Austin but I go where the work is.",
  specialties: ['ASL Interpreter', 'CART Captioner', 'Event Accessibility Coordinator'],
  top8: [
    { name: 'Maya Chen',     initial: 'M' },
    { name: 'Sam Okafor',    initial: 'S' },
    { name: 'Alex Torres',   initial: 'A' },
    { name: 'Riley Park',    initial: 'R' },
    { name: 'Devon Walsh',   initial: 'D' },
    { name: 'Casey Kim',     initial: 'C' },
  ],
  videos: [
    'youtube.com/watch?v=dQw4w9WgXcQ',
    'vimeo.com/123456789',
  ],
  certifications: [
    'RID (Registry of Interpreters for the Deaf)',
    'NIC (National Interpreter Certification)',
    'NCRA (National Court Reporters Association)',
    'AAC Level 1 Training',
  ],
  activities: ['Live music', 'Rock climbing', 'Ceramics', 'Disability advocacy', 'Film'],
  languages:  ['ASL', 'English', 'Spanish', 'PSE'],
};

const COLORS = ['#d8dcf5', '#fce7f3', '#d1fae5', '#fef3c7', '#e0e7ff', '#cffafe'];

export default function DevPreview() {
  const bgColor = SAMPLE.bgColor;

  return (
    <main style={{ background: bgColor, minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* Dev banner */}
      <div style={{ background: '#fbbf24', color: '#1c1917', fontSize: '0.8125rem', fontWeight: 700, textAlign: 'center', padding: '0.375rem', letterSpacing: '0.05em' }}>
        ⚠️ DEV PREVIEW — sample data only — <a href="/" style={{ color: 'inherit', textDecoration: 'underline' }}>back to home</a>
      </div>

      {/* Header */}
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-across-blue-bg.svg" alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/collective" className="nav-link">The Collective</Link>
        </nav>
      </header>

      {/* Profile grid */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem',
        display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap',
      }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{ width: '268px', minWidth: '268px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          <div className="content-card" style={{ padding: '1rem' }}>
            {/* Square photo */}
            <div style={{
              width: '100%', aspectRatio: '1 / 1',
              border: `5px solid ${bgColor}`, borderRadius: '6px',
              overflow: 'hidden', marginBottom: '0.75rem',
              background: 'var(--aac-blue-light)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/placeholder-profile.jpg"
                alt="Four accessibility professionals posing together at SXSW 2026 in front of a yellow sponsor backdrop"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                onError={(e) => {
                  // Fallback if photo isn't saved yet
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.style.display = 'flex';
                  (e.target as HTMLImageElement).parentElement!.style.alignItems = 'center';
                  (e.target as HTMLImageElement).parentElement!.style.justifyContent = 'center';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:5rem;font-weight:700;color:var(--aac-blue)">J</span>';
                }}
              />
            </div>

            {/* URL chip */}
            <div style={{ background: 'var(--aac-blue-light)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              /profile/<strong style={{ color: 'var(--aac-blue)' }}>{SAMPLE.username}</strong>
            </div>

            <h1 className="font-display" style={{ color: 'var(--aac-navy)', fontSize: '1.375rem', lineHeight: 1.2, marginBottom: '0.25rem' }}>
              {SAMPLE.name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{SAMPLE.pronouns}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <span aria-hidden="true">📍 </span>{SAMPLE.location}
            </p>

            {/* Stats */}
            <div style={{ background: 'var(--aac-blue-light)', borderRadius: '6px', padding: '0.625rem 0.75rem', margin: '0.75rem 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div><strong style={{ color: 'var(--color-text)' }}>Member since</strong> {SAMPLE.memberSince}</div>
              <div><strong style={{ color: 'var(--color-text)' }}>{SAMPLE.endorsements}</strong> endorsements</div>
              <div><strong style={{ color: 'var(--color-text)' }}>{SAMPLE.experience}</strong> yrs experience</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>⭐ Endorse</button>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', opacity: 0.55 }} disabled>
                💬 Message <span style={{ fontSize: '0.75rem' }}>(coming soon)</span>
              </button>
            </div>
          </div>

          {/* Contact card */}
          <div className="content-card" style={{ padding: '1rem' }}>
            <h2 className="font-display" style={{ color: S.contact, fontSize: '1rem', marginBottom: '0.625rem', paddingBottom: '0.375rem', borderBottom: `2px solid ${S.contact}` }}>
              Contact
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
              <li><a href="#" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>✉️ jordan@example.com</a></li>
              <li><a href="#" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>🌐 Website</a></li>
              <li><a href="#" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>💼 LinkedIn</a></li>
              <li><a href="#" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>📸 Instagram</a></li>
            </ul>
          </div>

          <Link href="/" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', textDecoration: 'underline', paddingTop: '0.25rem' }}>
            ← The Collective
          </Link>
        </aside>

        {/* ── RIGHT MAIN ── */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          <SectionCard color={S.highlights} emoji="✨" title="Highlights">
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: 'var(--color-text)' }}>{SAMPLE.highlights}</p>
          </SectionCard>

          <SectionCard color={S.about} title="About Me">
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: 'var(--color-text)' }}>{SAMPLE.bio}</p>
          </SectionCard>

          <SectionCard color={S.whatIDo} title="What I Do">
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {SAMPLE.specialties.map((s, i) => <li key={i}><span className="tag tag-blue">{s}</span></li>)}
            </ul>
          </SectionCard>

          <SectionCard color={S.top8} title="Top 8">
            <p className="sr-only">Top endorsers: {SAMPLE.top8.map(e => e.name).join(', ')}</p>
            <ul aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {SAMPLE.top8.map((e, i) => (
                <li key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', border: '2px solid #e5e7eb', borderRadius: '4px', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--aac-blue)' }}>{e.initial}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--aac-blue)', fontWeight: 600, display: 'block', lineHeight: 1.3 }}>{e.name.split(' ')[0]}</span>
                </li>
              ))}
              {/* 2 empty slots */}
              {[0, 1].map((i) => (
                <li key={`empty-${i}`} aria-hidden="true" style={{ textAlign: 'center' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', border: '2px dashed #d1d5db', borderRadius: '4px', background: '#f9fafb', marginBottom: '0.375rem' }} />
                  <span style={{ fontSize: '0.75rem', color: '#d1d5db' }}>—</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard color={S.videos} emoji="🎬" title="Videos">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SAMPLE.videos.map((url, i) => (
                <li key={i}>
                  <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', background: '#fef3c7', borderRadius: '6px', color: S.videos, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span aria-hidden="true">▶</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard color={S.certs} emoji="📚" title="Trainings &amp; Certifications">
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {SAMPLE.certifications.map((c, i) => <li key={i}><span className="tag tag-yellow">{c}</span></li>)}
            </ul>
          </SectionCard>

          <SectionCard color={S.activities} emoji="🎵" title="Activities &amp; Interests">
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {SAMPLE.activities.map((a, i) => (
                <li key={i}><span className="tag" style={{ background: '#fce7f3', color: '#9d174d', border: '1px solid #f9a8d4' }}>{a}</span></li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard color={S.languages} title="Languages">
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {SAMPLE.languages.map((l, i) => <li key={i}><span className="tag tag-gray">{l}</span></li>)}
            </ul>
          </SectionCard>

        </div>
      </div>
    </main>
  );
}
