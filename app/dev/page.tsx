'use client';
import Logo from '@/components/Logo';

/**
 * DEV PREVIEW — visit localhost:3000/dev
 * No auth required. Shows full Myspace-style profile with sample data.
 */

import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseVideoUrl(url: string): { embedUrl: string; label: string } | null {
  const ytId = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  )?.[1];
  if (ytId) return { embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0`, label: 'YouTube video' };
  const vmId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  if (vmId) return { embedUrl: `https://player.vimeo.com/video/${vmId}`, label: 'Vimeo video' };
  return null;
}

function availClass(status: string): string {
  if (status === 'Available Now') return 'ms-avail-badge ms-avail-available';
  if (status.startsWith('Booking')) return 'ms-avail-badge ms-avail-soon';
  if (status === 'Not Available') return 'ms-avail-badge ms-avail-unavailable';
  return 'ms-avail-badge ms-avail-inquiry';
}

function availDot(status: string): string {
  if (status === 'Available Now') return '🟢';
  if (status.startsWith('Booking')) return '🟡';
  if (status === 'Not Available') return '🔴';
  return '🔵';
}

function levelLabel(level: string): string {
  return { student: 'Student', entry: 'Entry Level', mid: 'Mid Level', seasoned: 'Seasoned Professional' }[level] ?? level;
}

// ── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE = {
  name:               'Jordan Rivera',
  username:           'jordan-rivera',
  pronouns:           'they/them',
  location:           'Austin, TX',
  memberSince:        'Summer 2026',
  mood:               'caffeinated',
  lovedByCount:       9,
  favoriteCount:      12,
  experience:         8,
  bgColor:            '#263590',
  isStudent:          false,
  experienceLevel:    'seasoned',
  availabilityStatus: 'Available Now',
  timezone:           'Central (CT)',
  workCategory:       'Front of House',
  eventSizes:         ['Intimate (<100)', 'Small (100–500)', 'Medium (500–2k)', 'Large (2k–10k)', 'Stadium / Festival (10k+)'],
  communicationStyle: ['Quick to respond', 'Email is best', 'Open to calls'],
  preferredContact:   'Email',
  workSamplesUrl:     'jordsworks.com/reel',

  highlights:  'SXSW 2026 accessibility lead. Large-scale live event interpretation and real-time CART captioning. Available for touring productions, festivals, and corporate events nationwide.',
  bio:         "I've spent the last 8 years making live experiences accessible to everyone in the room, from intimate theatre to 80,000-person music festivals. I believe accessibility isn't a checklist, it's a craft.\n\nCurrently based in Austin but I go where the work is.",
  specialties: ['ASL Interpreter', 'CART Captioner', 'Event Accessibility Coordinator'],
  rateInfo:    'Rates vary by role and event size. ASL interpretation from $X/hr; CART from $Y/hr. Full-day and multi-day rates available. Contact for a quote.',
  careerHighlights: [
    'SXSW 2026: Lead ASL Interpreter, 40+ sessions across 5 days',
    'ACL Fest 2025: Full accessibility team coordination, main and side stages',
    'Austin City Limits TV (PBS): Regular captioner since 2022',
    'Texas Governor\'s Conference on Disability (2023, 2024): Lead interpreter',
    'Broadway national tour, 6-week run, Austin stop: CART and ASL team lead',
  ],
  funFact:       'I once interpreted a death metal concert in ASL and it was the most fun I\'ve ever had at work.',
  favoriteEvent: 'ACL Fest 2024: coordinating the entire accessibility village while simultaneously interpreting the main stage was chaotic, loud, and absolutely perfect.',

  education: [
    'BA in Theatre Arts, University of Texas at Austin, 2016',
    'AASLI Interpreter Training Program, 2017',
    'BEI Advanced Certification, 2019',
  ],
  softwareSkills: ['Rev', 'CaptionSync', 'StreamText', 'ZoomText', 'CART Studio', 'Zoom', 'Microsoft Teams', 'Slack'],
  newToRoles:     ['Audio Description', 'Sign Language Instructor', 'Accessibility Consultant'],

  certifications: [
    'RID (Registry of Interpreters for the Deaf)',
    'NIC (National Interpreter Certification)',
    'NCRA (National Court Reporters Association)',
    'AAC Level 1 Training',
  ],
  languages:          ['ASL', 'English', 'Spanish', 'PSE'],
  activities:         ['Live music', 'Rock climbing', 'Ceramics', 'Disability advocacy'],
  favBooks:           ['The Body Is Not an Apology', 'Crip Theory', 'Deaf Gain'],
  favMovies:          ['CODA', 'Sound of Metal', 'Children of a Lesser God'],
  favMusic:           ['Radiohead', 'Big Thief', 'Lizzo'],
  favTv:              ['Deaf U', 'Reservation Dogs', 'The Bear'],
  communityInterests: ['Workshops', 'Book Club', 'Discussion Boards', 'Job Board', 'Local Meet Ups'],

  goTos: [
    { name: 'Maya Chen',   initial: 'M', color: '#d8dcf5' },
    { name: 'Sam Okafor',  initial: 'S', color: '#d4f0e0' },
    { name: 'Alex Torres', initial: 'A', color: '#fce7f3' },
    { name: 'Riley Park',  initial: 'R', color: '#fef3c7' },
    { name: 'Devon Walsh', initial: 'D', color: '#e0e7ff' },
    { name: 'Casey Kim',   initial: 'C', color: '#cffafe' },
  ],
  lovedBy: [
    { name: 'Priya Nair',  initial: 'P', color: '#fce7f3' },
    { name: 'Leo Vasquez', initial: 'L', color: '#d4f0e0' },
    { name: 'Imani Scott', initial: 'I', color: '#fef3c7' },
  ],
  videos: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://vimeo.com/148751763',
  ],
};

const firstName = SAMPLE.name.split(' ')[0];

// ── Sub-components ───────────────────────────────────────────────────────────

function MsBox({ header, headerEl, action, children }: {
  header?: string;
  headerEl?: React.ReactNode;
  action?: { label: string; href: string; srLabel?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="ms-box">
      <div className="ms-box-header">
        <span>{headerEl ?? header}</span>
        {action && (
          <a href={action.href}>
            [{action.label}]
            {action.srLabel && <span className="sr-only">{action.srLabel}</span>}
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DevPreview() {
  return (
    <BrowserChrome variant="aol" title="Dev Preview · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/dev">
    <main style={{ background: SAMPLE.bgColor, minHeight: '100%', paddingBottom: '24px' }}>

      {/* Dev banner */}
      <div role="status" style={{ background: '#fbbf24', color: '#1c1917', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', padding: '4px' }}>
        ⚠️ DEV PREVIEW: sample data only,{' '}
        <Link href="/" style={{ color: 'inherit' }}>back to home</Link>
      </div>

      {/* Header */}
      <header>
        <div className="site-header">
          <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective, home">
            <Logo alt="" />
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/members" className="nav-link">Directory</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
            <Link href="/login" className="nav-link">Sign In</Link>
          </nav>
        </div>
      </header>

      {/* Profile grid */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '12px 10px', display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ════════════════════════════════════
            LEFT SIDEBAR — 280px
        ════════════════════════════════════ */}
        <aside aria-label="Profile sidebar" style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}>

          {/* Photo + basic info */}
          <MsBox
            headerEl={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {SAMPLE.name}
                {SAMPLE.isStudent && (
                  <span className="ms-student-badge" aria-label="Student member">🎓 Student</span>
                )}
              </span>
            }
            action={{ label: 'edit profile', href: '#' }}
          >
            <div style={{ padding: '8px' }}>
              {/* Square photo */}
              <div style={{ width: '100%', aspectRatio: '1/1', border: '2px solid #fff', outline: '1px solid var(--ms-border)', overflow: 'hidden', background: 'var(--aac-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/placeholder-profile.jpg"
                  alt="Four accessibility professionals posing at SXSW 2026 in front of a yellow sponsor backdrop"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    if (el.parentElement) el.parentElement.innerHTML = '<span aria-hidden="true" style="font-size:4rem;font-weight:700;color:var(--aac-blue)">J</span>';
                  }}
                />
              </div>

              {/* Availability badge — prominent for bookers */}
              <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                <span className={availClass(SAMPLE.availabilityStatus)}>
                  <span aria-hidden="true">{availDot(SAMPLE.availabilityStatus)}</span>
                  {SAMPLE.availabilityStatus}
                </span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <span className="ms-online-badge">Online Now!</span>
                {' '}
                <span className="ms-level-badge" aria-label={`Experience level: ${levelLabel(SAMPLE.experienceLevel)}`}>
                  {levelLabel(SAMPLE.experienceLevel)}
                </span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>{SAMPLE.pronouns}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                <span aria-hidden="true">📍 </span>{SAMPLE.location}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                <span aria-hidden="true">🕐 </span>{SAMPLE.timezone}
              </p>
              {SAMPLE.mood && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>
                  Mood: <em>{SAMPLE.mood}</em>
                </p>
              )}

              <div className="ms-stats-row" style={{ marginTop: '8px' }}>
                <div className="ms-stat">
                  <strong>{SAMPLE.lovedByCount}</strong>
                  loved by
                </div>
                <div className="ms-stat">
                  <strong>{SAMPLE.experience}</strong>
                  yrs exp
                </div>
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
                Member since: <strong>{SAMPLE.memberSince}</strong>
              </p>
            </div>
          </MsBox>

          {/* Contacting */}
          <MsBox header={`Contacting ${firstName}`}>
            <div className="ms-action-grid">
              <a href="#" className="ms-action-link" aria-label={`Send ${firstName} a message`}>
                <span className="ms-action-link-icon" aria-hidden="true">✉️</span>
                Send Message
              </a>
              <a href="#" className="ms-action-link" aria-label={`Add ${firstName} as a Favorite`}>
                <span className="ms-action-link-icon" aria-hidden="true">⭐</span>
                Add to Favorites
              </a>
              <a href="#" className="ms-action-link" aria-label={`Forward ${firstName}'s profile`}>
                <span className="ms-action-link-icon" aria-hidden="true">➡️</span>
                Forward Profile
              </a>
              <a href={SAMPLE.workSamplesUrl ? `https://${SAMPLE.workSamplesUrl}` : '#'} className="ms-action-link" aria-label={`View ${firstName}'s work samples`} target="_blank" rel="noopener noreferrer">
                <span className="ms-action-link-icon" aria-hidden="true">🎥</span>
                Work Samples
              </a>
            </div>
            <div style={{ padding: '4px 8px 6px', borderTop: '1px solid var(--ms-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Preferred contact: <strong style={{ color: 'var(--aac-blue)' }}>{SAMPLE.preferredContact}</strong>
              {SAMPLE.communicationStyle.length > 0 && (
                <span> · {SAMPLE.communicationStyle[0]}</span>
              )}
            </div>
          </MsBox>

          {/* People Who Love To Work With Me */}
          <MsBox
            header="People Who Love To Work With Me"
            action={{ label: `see all ${SAMPLE.lovedByCount}`, href: '#', srLabel: ` people who love to work with ${firstName}` }}
          >
            <div style={{ padding: '6px 8px' }}>
              <p className="sr-only">
                {SAMPLE.lovedBy.map(p => p.name).join(', ')} and {SAMPLE.lovedByCount - SAMPLE.lovedBy.length} others have added {firstName} as a Favorite.
              </p>
              <div aria-hidden="true" style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                {SAMPLE.lovedBy.map((p, i) => (
                  <a key={i} href="#" tabIndex={-1} style={{ display: 'block', textDecoration: 'none', flex: '1' }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', background: p.color, border: '1px solid var(--ms-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--aac-blue)' }}>
                      {p.initial}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--aac-blue)', display: 'block', textAlign: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name.split(' ')[0]}
                    </span>
                  </a>
                ))}
              </div>
              <a href="#" style={{ fontSize: '0.75rem', display: 'block', textAlign: 'right' }}>
                See all {SAMPLE.lovedByCount} →<span className="sr-only"> people who love to work with {firstName}</span>
              </a>
            </div>
          </MsBox>

          {/* Profile URL */}
          <MsBox header="Profile URL:">
            <div className="ms-box-body">
              <p className="ms-profile-url">/profile/<strong>{SAMPLE.username}</strong></p>
              <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                <a href="#" className="ms-edit-link">[ change URL ]</a>
              </p>
            </div>
          </MsBox>

          {/* Interests table */}
          <MsBox header={`${firstName}'s Interests`} action={{ label: 'edit', href: '#' }}>
            <div style={{ padding: '4px' }}>
              <table className="ms-table">
                <caption className="sr-only">{SAMPLE.name}&apos;s interests</caption>
                <tbody>
                  {SAMPLE.activities.length > 0 && <tr><td scope="row">Activities</td><td>{SAMPLE.activities.join(', ')}</td></tr>}
                  {SAMPLE.favBooks.length > 0    && <tr><td scope="row">Books</td><td>{SAMPLE.favBooks.join(', ')}</td></tr>}
                  {SAMPLE.favMovies.length > 0   && <tr><td scope="row">Movies</td><td>{SAMPLE.favMovies.join(', ')}</td></tr>}
                  {SAMPLE.favMusic.length > 0    && <tr><td scope="row">Music</td><td>{SAMPLE.favMusic.join(', ')}</td></tr>}
                  {SAMPLE.favTv.length > 0       && <tr><td scope="row">TV</td><td>{SAMPLE.favTv.join(', ')}</td></tr>}
                  {SAMPLE.languages.length > 0   && <tr><td scope="row">Languages</td><td>{SAMPLE.languages.join(', ')}</td></tr>}
                </tbody>
              </table>
            </div>
          </MsBox>

          {/* Links */}
          <MsBox header={`${firstName}'s Links`}>
            <div style={{ padding: '4px' }}>
              <table className="ms-table">
                <caption className="sr-only">{SAMPLE.name}&apos;s contact links</caption>
                <tbody>
                  <tr><td scope="row">Email</td><td><a href="#">jordan@example.com</a></td></tr>
                  <tr><td scope="row">Website</td><td><a href="#" aria-label={`${SAMPLE.name}'s website`}>jordsworks.com</a></td></tr>
                  <tr><td scope="row">Work Reel</td><td><a href={`https://${SAMPLE.workSamplesUrl}`} target="_blank" rel="noopener noreferrer" aria-label={`${SAMPLE.name}'s work samples`}>{SAMPLE.workSamplesUrl}</a></td></tr>
                  <tr><td scope="row">LinkedIn</td><td><a href="#" aria-label={`${SAMPLE.name} on LinkedIn`}>@jordanrivera</a></td></tr>
                  <tr><td scope="row">Instagram</td><td><a href="#" aria-label={`${SAMPLE.name} on Instagram`}>@jords.asl</a></td></tr>
                </tbody>
              </table>
            </div>
          </MsBox>

        </aside>

        {/* ════════════════════════════════════
            RIGHT MAIN CONTENT
        ════════════════════════════════════ */}
        <div id="main-content" style={{ flex: 1, minWidth: '300px' }}>

          {/* Highlights */}
          <MsBox header={`✨ ${firstName}'s Highlights`} action={{ label: 'edit', href: '#' }}>
            <div className="ms-box-body">
              <p style={{ margin: 0, lineHeight: 1.6 }}>{SAMPLE.highlights}</p>
            </div>
          </MsBox>

          {/* Blurbs */}
          <MsBox header={`${firstName}'s Blurbs`} action={{ label: 'edit', href: '#' }}>
            <div className="ms-box-body">
              <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>About me:</p>
              <p style={{ color: 'var(--aac-blue)', lineHeight: 1.6, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{SAMPLE.bio}</p>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>What I do:</p>
              <p style={{ color: 'var(--aac-blue)', margin: 0 }}>{SAMPLE.specialties.join(' · ')}</p>
            </div>
          </MsBox>

          {/* Work Details */}
          <MsBox header={`${firstName}'s Work Details`} action={{ label: 'edit', href: '#' }}>
            <div style={{ padding: '4px' }}>
              <table className="ms-table">
                <caption className="sr-only">{SAMPLE.name}&apos;s professional details</caption>
                <tbody>
                  {SAMPLE.workCategory && (
                    <tr><td scope="row">Role Type</td><td>{SAMPLE.workCategory}</td></tr>
                  )}
                  <tr>
                    <td scope="row">Event Sizes</td>
                    <td>{SAMPLE.eventSizes.join(', ')}</td>
                  </tr>
                  <tr>
                    <td scope="row">Availability</td>
                    <td>
                      <span className={availClass(SAMPLE.availabilityStatus)}>
                        <span aria-hidden="true">{availDot(SAMPLE.availabilityStatus)}</span>
                        {SAMPLE.availabilityStatus}
                      </span>
                    </td>
                  </tr>
                  <tr><td scope="row">Time Zone</td><td>{SAMPLE.timezone}</td></tr>
                  <tr>
                    <td scope="row">Comms Style</td>
                    <td>{SAMPLE.communicationStyle.join(' · ')}</td>
                  </tr>
                  <tr>
                    <td scope="row">Preferred Contact</td>
                    <td>{SAMPLE.preferredContact}</td>
                  </tr>
                  {SAMPLE.rateInfo && (
                    <tr><td scope="row">Rates</td><td>{SAMPLE.rateInfo}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </MsBox>

          {/* Career Highlights */}
          {SAMPLE.careerHighlights.length > 0 && (
            <MsBox header={`🌟 ${firstName}'s Career Highlights`} action={{ label: 'edit', href: '#' }}>
              <div className="ms-box-body">
                <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 2 }}>
                  {SAMPLE.careerHighlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            </MsBox>
          )}

          {/* Personality */}
          <MsBox header={`😄 ${firstName}'s Personality Corner`} action={{ label: 'edit', href: '#' }}>
            <div className="ms-box-body">
              {SAMPLE.funFact && (
                <>
                  <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Fun fact:</p>
                  <p style={{ color: 'var(--aac-blue)', margin: '0 0 10px', lineHeight: 1.6 }}>{SAMPLE.funFact}</p>
                </>
              )}
              {SAMPLE.favoriteEvent && (
                <>
                  <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Favorite event I&apos;ve ever worked:</p>
                  <p style={{ color: 'var(--aac-blue)', margin: 0, lineHeight: 1.6 }}>{SAMPLE.favoriteEvent}</p>
                </>
              )}
            </div>
          </MsBox>

          {/* Skills & Software */}
          <MsBox header={`💻 ${firstName}'s Skills & Software`} action={{ label: 'edit', href: '#' }}>
            <div style={{ padding: '4px' }}>
              <table className="ms-table">
                <caption className="sr-only">{SAMPLE.name}&apos;s skills and software</caption>
                <tbody>
                  {SAMPLE.softwareSkills.length > 0 && (
                    <tr>
                      <td scope="row">Software</td>
                      <td>{SAMPLE.softwareSkills.join(', ')}</td>
                    </tr>
                  )}
                  {SAMPLE.newToRoles.length > 0 && (
                    <tr>
                      <td scope="row">New to / Want to try</td>
                      <td>{SAMPLE.newToRoles.join(', ')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </MsBox>

          {/* Education */}
          {SAMPLE.education.length > 0 && (
            <MsBox header={`🎓 ${firstName}'s Education`} action={{ label: 'edit', href: '#' }}>
              <div className="ms-box-body">
                <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9 }}>
                  {SAMPLE.education.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </MsBox>
          )}

          {/* Go-To's */}
          <MsBox
            header={`⭐ ${firstName}'s Go-To's`}
            action={{ label: `view all ${SAMPLE.favoriteCount}`, href: '#', srLabel: ` of ${firstName}'s Go-To colleagues` }}
          >
            <div className="ms-box-body">
              <p style={{ fontSize: '0.75rem', margin: '0 0 8px', color: 'var(--color-text-muted)' }}>
                Colleagues {firstName} has worked with and recommends.
              </p>
              <p className="sr-only">
                {firstName}&apos;s Go-To colleagues: {SAMPLE.goTos.map(g => g.name).join(', ')} and {SAMPLE.favoriteCount - SAMPLE.goTos.length} more.
              </p>
              <ul aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}>
                {SAMPLE.goTos.map((g, i) => (
                  <li key={i} style={{ textAlign: 'center' }}>
                    <a href="#" tabIndex={-1} style={{ display: 'block', textDecoration: 'none' }}>
                      <div style={{ width: '100%', aspectRatio: '1/1', background: g.color, border: '1px solid var(--ms-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--aac-blue)' }}>
                        {g.initial}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--aac-blue)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.name.split(' ')[0]}
                      </span>
                    </a>
                  </li>
                ))}
                {Array.from({ length: Math.max(0, 8 - SAMPLE.goTos.length) }).map((_, i) => (
                  <li key={`e${i}`} aria-hidden="true" style={{ textAlign: 'center' }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', border: '1px dashed #c8d3f0', background: '#f0f2fc' }} />
                    <span style={{ fontSize: '0.6875rem', color: '#c8d3f0' }}>·</span>
                  </li>
                ))}
              </ul>
              <nav aria-label={`${firstName}'s Go-To colleagues`} style={{ marginTop: '8px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
                  {SAMPLE.goTos.map((g, i) => (
                    <li key={i}><a href="#" style={{ fontSize: '0.75rem' }}>⭐ {g.name}</a></li>
                  ))}
                  <li><a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>+ {SAMPLE.favoriteCount - SAMPLE.goTos.length} more →</a></li>
                </ul>
              </nav>
            </div>
          </MsBox>

          {/* Videos */}
          <MsBox header={`🎬 ${firstName}'s Videos`} action={{ label: 'add video', href: '#' }}>
            <div className="ms-box-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {SAMPLE.videos.map((url, i) => {
                  const embed = parseVideoUrl(url);
                  return embed ? (
                    <div key={i}>
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', border: '1px solid var(--ms-border)' }}>
                        <iframe
                          src={embed.embedUrl}
                          title={`${embed.label} · ${SAMPLE.name}`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '3px 0 0' }}>
                        <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                      </p>
                    </div>
                  ) : (
                    <div key={i} style={{ padding: '6px 8px', background: '#fff8d4', border: '1px solid #e0c840', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span aria-hidden="true" style={{ color: '#d97706', fontWeight: 'bold' }}>▶</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#d97706', fontSize: '0.8125rem' }}>{url}</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </MsBox>

          {/* Certifications */}
          <MsBox header={`📚 ${firstName}'s Trainings & Certifications`}>
            <div className="ms-box-body">
              <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9 }}>
                {SAMPLE.certifications.map((c, i) => <li key={i} style={{ color: 'var(--aac-blue)' }}>{c}</li>)}
              </ul>
            </div>
          </MsBox>

          {/* Community interests */}
          {SAMPLE.communityInterests.length > 0 && (
            <MsBox header={`🌱 ${firstName}'s Community Interests`}>
              <div className="ms-box-body">
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>
                  Features {firstName} would love to see on the Collective:
                </p>
                <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9 }}>
                  {SAMPLE.communityInterests.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </MsBox>
          )}

          {/* What People Say */}
          <MsBox header={`💬 What People Say About ${firstName}`} action={{ label: 'Add a Note', href: '#' }}>
            <div className="ms-box-body">
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                Displaying <strong>2</strong> of <strong>{SAMPLE.lovedByCount}</strong> notes; <a href="#">View all</a>
              </p>
              {[
                { name: 'Priya Nair', initial: 'P', color: '#fce7f3', date: '5/18/2026 2:14 PM', rel: 'We worked together at SXSW 2026', text: "Jordan interpreted our entire panel and it was the most seamlessly accessible event I've ever been part of. Absolute professional; I recommend them for any large-scale event." },
                { name: 'Leo Vasquez', initial: 'L', color: '#d4f0e0', date: '4/02/2026 10:30 AM', rel: 'Collaborators since 2022', text: 'Best CART captioner I have worked with in 10 years. Fast, accurate, and genuinely invested in making the experience great for everyone.' },
              ].map((c, i) => (
                <div key={i} className="ms-comment-row">
                  <a href="#" aria-label={`View ${c.name}'s profile`} style={{ display: 'block', flexShrink: 0 }}>
                    <div className="ms-comment-avatar" style={{ background: c.color }} aria-hidden="true">{c.initial}</div>
                  </a>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px' }}>
                      <a href="#" style={{ fontWeight: 'bold', color: 'var(--aac-blue)', textDecoration: 'none' }}>⭐ {c.name}</a>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{c.date}</span>
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 4px', fontStyle: 'italic' }}>{c.rel}</p>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </MsBox>

        </div>
      </div>

      {/* Footer */}
      <footer aria-label="Site footer" className="ms-footer" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <nav aria-label="Footer links" style={{ display: 'inline' }}>
          <Link href="/" style={{ color: 'inherit' }}>Home</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/contact" style={{ color: 'inherit' }}>Contact Us</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <a href="#" style={{ color: 'inherit' }}>Safety Tips</a>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <a href="#" style={{ color: 'inherit' }}>Report Inappropriate Content</a>
        </nav>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>©{new Date().getFullYear()} Artistic Accessibility Collective. All Rights Reserved.</span>
      </footer>

    </main>
  </BrowserChrome>
  );
}
