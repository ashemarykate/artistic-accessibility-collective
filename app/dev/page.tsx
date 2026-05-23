'use client';

/**
 * DEV PREVIEW — visit localhost:3000/dev
 * No auth required. Shows full Myspace-style profile with sample data.
 */

import Link from 'next/link';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a YouTube or Vimeo URL into an embed config. Returns null if unrecognised. */
function parseVideoUrl(url: string): { embedUrl: string; label: string } | null {
  const ytId = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  )?.[1];
  if (ytId) return {
    embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0`,
    label: `YouTube video`,
  };

  const vmId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  if (vmId) return {
    embedUrl: `https://player.vimeo.com/video/${vmId}`,
    label: `Vimeo video`,
  };

  return null;
}

// ── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE = {
  name:            'Jordan Rivera',
  username:        'jordan-rivera',
  pronouns:        'they/them',
  location:        'Austin, TX',
  memberSince:     'Summer 2026',
  mood:            'caffeinated',
  favoriteCount:   12,  // people they've favorited
  lovedByCount:    9,   // people who favorited them
  experience:      8,
  bgColor:         '#263590',
  highlights:      'SXSW 2026 accessibility lead. Specializing in large-scale live event interpretation and real-time CART captioning. Available for touring productions, festivals, and corporate events nationwide.',
  bio:             "I've spent the last 8 years making live experiences accessible to everyone in the room — from intimate theatre to 80,000-person music festivals. I believe accessibility isn't a checklist, it's a craft.\n\nCurrently based in Austin but I go where the work is.",
  specialties:     ['ASL Interpreter', 'CART Captioner', 'Event Accessibility Coordinator'],

  // People Jordan has FAVORITED (Go-To's)
  goTos: [
    { name: 'Maya Chen',   initial: 'M', color: '#d8dcf5' },
    { name: 'Sam Okafor',  initial: 'S', color: '#d4f0e0' },
    { name: 'Alex Torres', initial: 'A', color: '#fce7f3' },
    { name: 'Riley Park',  initial: 'R', color: '#fef3c7' },
    { name: 'Devon Walsh', initial: 'D', color: '#e0e7ff' },
    { name: 'Casey Kim',   initial: 'C', color: '#cffafe' },
  ],

  // People who have FAVORITED Jordan (People Who Love To Work With Me)
  lovedBy: [
    { name: 'Priya Nair',  initial: 'P', color: '#fce7f3' },
    { name: 'Leo Vasquez', initial: 'L', color: '#d4f0e0' },
    { name: 'Imani Scott', initial: 'I', color: '#fef3c7' },
  ],

  videos: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://vimeo.com/148751763',
  ],
  certifications: [
    'RID (Registry of Interpreters for the Deaf)',
    'NIC (National Interpreter Certification)',
    'NCRA (National Court Reporters Association)',
    'AAC Level 1 Training',
  ],
  activities:          ['Live music', 'Rock climbing', 'Ceramics', 'Disability advocacy'],
  languages:           ['ASL', 'English', 'Spanish', 'PSE'],
  favBooks:            ['The Body Is Not an Apology', 'Crip Theory', 'Deaf Gain'],
  favMovies:           ['CODA', 'Sound of Metal', 'Children of a Lesser God'],
  favMusic:            ['Radiohead', 'Big Thief', 'Lizzo'],
  favTv:               ['Deaf U', 'Reservation Dogs', 'The Bear'],
  communityInterests:  ['Workshops', 'Book Club', 'Discussion Boards', 'Job Board', 'Local Meet Ups'],
};

// ── Sub-components ───────────────────────────────────────────────────────────

function MsBox({ header, action, children }: {
  header: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="ms-box">
      <div className="ms-box-header">
        <span>{header}</span>
        {action && (
          <a href={action.href}>[{action.label}]</a>
        )}
      </div>
      {children}
    </div>
  );
}

/** Tiny square avatar for friend grids */
function MiniAvatar({ initial, color, name, size = 48 }: {
  initial: string; color: string; name: string; size?: number;
}) {
  return (
    <div
      style={{
        width: size, height: size,
        background: color,
        border: '1px solid var(--ms-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size > 40 ? '1.25rem' : '0.875rem',
        fontWeight: 700,
        color: 'var(--aac-blue)',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DevPreview() {
  const bgColor = SAMPLE.bgColor;

  return (
    <main style={{ background: bgColor, minHeight: '100vh', paddingBottom: '24px' }}>

      {/* ── Dev banner ── */}
      <div
        role="status"
        style={{ background: '#fbbf24', color: '#1c1917', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', padding: '4px', fontFamily: 'Verdana, sans-serif' }}
      >
        ⚠️ DEV PREVIEW — sample data only —{' '}
        <a href="/" style={{ color: 'inherit' }}>back to home</a>
      </div>

      {/* ── Header ── */}
      <header>
        <div className="site-header">
          <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-across-blue-bg.svg" alt="" />
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/collective" className="nav-link">Directory</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
            <Link href="/login" className="nav-link">Sign In</Link>
          </nav>
        </div>
      </header>

      {/* ── Profile grid ── */}
      <div style={{
        maxWidth: '980px', margin: '0 auto', padding: '12px 10px',
        display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap',
      }}>

        {/* ════════════════════════════════════
            LEFT SIDEBAR — 280px
        ════════════════════════════════════ */}
        <aside
          aria-label="Profile sidebar"
          style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}
        >

          {/* Photo + name + basic info */}
          <MsBox header={SAMPLE.name} action={{ label: 'edit profile', href: '#' }}>
            <div style={{ padding: '8px' }}>

              {/* Square photo */}
              <div style={{
                width: '100%', aspectRatio: '1 / 1',
                border: '2px solid #fff',
                outline: '1px solid var(--ms-border)',
                overflow: 'hidden',
                background: 'var(--aac-blue-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '6px',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/placeholder-profile.jpg"
                  alt="Four accessibility professionals posing together at SXSW 2026 in front of a yellow sponsor backdrop"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    if (el.parentElement) {
                      el.parentElement.innerHTML =
                        '<span aria-hidden="true" style="font-size:4rem;font-weight:700;color:var(--aac-blue)">J</span>';
                    }
                  }}
                />
              </div>

              {/* Online badge */}
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <span className="ms-online-badge">Online Now!</span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                {SAMPLE.pronouns}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                <span aria-hidden="true">📍 </span>{SAMPLE.location}
              </p>
              {SAMPLE.mood && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>
                  Mood: <em>{SAMPLE.mood}</em>
                </p>
              )}

              {/* Stats */}
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
          <MsBox header={`Contacting ${SAMPLE.name.split(' ')[0]}`}>
            <div className="ms-action-grid">
              <a href="#" className="ms-action-link" aria-label={`Send ${SAMPLE.name.split(' ')[0]} a message`}>
                <span className="ms-action-link-icon" aria-hidden="true">✉️</span>
                Send Message
              </a>
              <a href="#" className="ms-action-link" aria-label={`Add ${SAMPLE.name.split(' ')[0]} as a Favorite`}>
                <span className="ms-action-link-icon" aria-hidden="true">⭐</span>
                Add to Favorites
              </a>
              <a href="#" className="ms-action-link" aria-label={`Forward ${SAMPLE.name.split(' ')[0]}'s profile to a friend`}>
                <span className="ms-action-link-icon" aria-hidden="true">➡️</span>
                Forward to Friend
              </a>
              <a href="#" className="ms-action-link" aria-label={`View ${SAMPLE.name.split(' ')[0]}'s certifications`}>
                <span className="ms-action-link-icon" aria-hidden="true">📚</span>
                View Certs
              </a>
            </div>
          </MsBox>

          {/* People Who Love To Work With Me */}
          <MsBox
            header="People Who Love To Work With Me"
            action={{ label: `see all ${SAMPLE.lovedByCount}`, href: '#' }}
          >
            <div style={{ padding: '6px 8px' }}>
              <p className="sr-only">
                People who have added {SAMPLE.name.split(' ')[0]} as a Favorite:{' '}
                {SAMPLE.lovedBy.map(p => p.name).join(', ')} and {SAMPLE.lovedByCount - SAMPLE.lovedBy.length} more.
              </p>
              {/* 3 small photos in a row */}
              <div
                aria-hidden="true"
                style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}
              >
                {SAMPLE.lovedBy.map((p, i) => (
                  <a
                    key={i}
                    href="#"
                    tabIndex={-1}
                    style={{ display: 'block', textDecoration: 'none', flex: '1' }}
                  >
                    <div style={{
                      width: '100%', aspectRatio: '1/1',
                      background: p.color,
                      border: '1px solid var(--ms-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', fontWeight: 700, color: 'var(--aac-blue)',
                    }}>
                      {p.initial}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--aac-blue)', display: 'block', textAlign: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name.split(' ')[0]}
                    </span>
                  </a>
                ))}
              </div>
              {/* Accessible "see all" link */}
              <a href="#" style={{ fontSize: '0.75rem', display: 'block', textAlign: 'right' }}>
                See all {SAMPLE.lovedByCount} →<span className="sr-only"> people who love to work with {SAMPLE.name.split(' ')[0]}</span>
              </a>
            </div>
          </MsBox>

          {/* Profile URL */}
          <MsBox header="Profile URL:">
            <div className="ms-box-body">
              <p className="ms-profile-url">
                /profile/<strong>{SAMPLE.username}</strong>
              </p>
              <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                <a href="#" className="ms-edit-link">[ change URL ]</a>
              </p>
            </div>
          </MsBox>

          {/* Interests table */}
          <MsBox header={`${SAMPLE.name.split(' ')[0]}'s Interests`} action={{ label: 'edit', href: '#' }}>
            <div style={{ padding: '4px' }}>
              <table className="ms-table">
                <caption className="sr-only">{SAMPLE.name}&apos;s interests and activities</caption>
                <tbody>
                  <tr>
                    <td scope="row">Activities</td>
                    <td>{SAMPLE.activities.join(', ')}</td>
                  </tr>
                  <tr>
                    <td scope="row">Books</td>
                    <td>{SAMPLE.favBooks.join(', ')}</td>
                  </tr>
                  <tr>
                    <td scope="row">Movies</td>
                    <td>{SAMPLE.favMovies.join(', ')}</td>
                  </tr>
                  <tr>
                    <td scope="row">Music</td>
                    <td>{SAMPLE.favMusic.join(', ')}</td>
                  </tr>
                  <tr>
                    <td scope="row">TV</td>
                    <td>{SAMPLE.favTv.join(', ')}</td>
                  </tr>
                  <tr>
                    <td scope="row">Languages</td>
                    <td>{SAMPLE.languages.join(', ')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </MsBox>

          {/* Contact / Links */}
          <MsBox header={`${SAMPLE.name.split(' ')[0]}'s Links`}>
            <div style={{ padding: '4px' }}>
              <table className="ms-table">
                <caption className="sr-only">{SAMPLE.name}&apos;s contact links</caption>
                <tbody>
                  <tr><td scope="row">Email</td><td><a href="#">jordan@example.com</a></td></tr>
                  <tr><td scope="row">Website</td><td><a href="#" aria-label="Jordan's website">jordsworks.com</a></td></tr>
                  <tr><td scope="row">LinkedIn</td><td><a href="#" aria-label="Jordan on LinkedIn">@jordanrivera</a></td></tr>
                  <tr><td scope="row">Instagram</td><td><a href="#" aria-label="Jordan on Instagram">@jords.asl</a></td></tr>
                </tbody>
              </table>
            </div>
          </MsBox>

        </aside>

        {/* ════════════════════════════════════
            RIGHT MAIN CONTENT
        ════════════════════════════════════ */}
        <main
          id="main-content"
          aria-label="Profile content"
          style={{ flex: 1, minWidth: '300px' }}
        >

          {/* Highlights */}
          <MsBox header={`✨ ${SAMPLE.name.split(' ')[0]}'s Highlights`} action={{ label: 'edit', href: '#' }}>
            <div className="ms-box-body">
              <p style={{ margin: 0, lineHeight: 1.6 }}>{SAMPLE.highlights}</p>
            </div>
          </MsBox>

          {/* Blurbs */}
          <MsBox header={`${SAMPLE.name.split(' ')[0]}'s Blurbs`} action={{ label: 'edit', href: '#' }}>
            <div className="ms-box-body">
              <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>About me:</p>
              <p style={{ color: 'var(--aac-blue)', lineHeight: 1.6, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                {SAMPLE.bio}
              </p>
              <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>What I do:</p>
              <p style={{ color: 'var(--aac-blue)', margin: 0 }}>
                {SAMPLE.specialties.join(' · ')}
              </p>
            </div>
          </MsBox>

          {/* Go-To's — people Jordan has FAVORITED */}
          <MsBox
            header={`⭐ ${SAMPLE.name.split(' ')[0]}'s Go-To's`}
            action={{ label: `view all ${SAMPLE.favoriteCount}`, href: '#' }}
          >
            <div className="ms-box-body">
              <p style={{ fontSize: '0.75rem', margin: '0 0 8px', color: 'var(--color-text-muted)' }}>
                Colleagues {SAMPLE.name.split(' ')[0]} has worked with and recommends.
              </p>

              {/* Screen reader list */}
              <p className="sr-only">
                {SAMPLE.name.split(' ')[0]}&apos;s Go-To colleagues:{' '}
                {SAMPLE.goTos.map(g => g.name).join(', ')}{' '}
                and {SAMPLE.favoriteCount - SAMPLE.goTos.length} more.
              </p>

              {/* Visual grid — smaller photos, 6 across */}
              <ul
                aria-hidden="true"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '6px',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {SAMPLE.goTos.map((g, i) => (
                  <li key={i} style={{ textAlign: 'center' }}>
                    <a href="#" tabIndex={-1} style={{ display: 'block', textDecoration: 'none' }}>
                      <div style={{
                        width: '100%', aspectRatio: '1/1',
                        background: g.color,
                        border: '1px solid var(--ms-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 700, color: 'var(--aac-blue)',
                      }}>
                        {g.initial}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--aac-blue)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.name.split(' ')[0]}
                      </span>
                    </a>
                  </li>
                ))}
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 8 - SAMPLE.goTos.length) }).map((_, i) => (
                  <li key={`empty-${i}`} aria-hidden="true" style={{ textAlign: 'center' }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', border: '1px dashed #c8d3f0', background: '#f0f2fc' }} />
                    <span style={{ fontSize: '0.6875rem', color: '#c8d3f0' }}>—</span>
                  </li>
                ))}
              </ul>

              {/* Accessible links for Go-To's */}
              <nav aria-label={`${SAMPLE.name.split(' ')[0]}'s Go-To colleagues`} style={{ marginTop: '8px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                  {SAMPLE.goTos.map((g, i) => (
                    <li key={i}>
                      <a href="#" style={{ fontSize: '0.75rem', color: 'var(--aac-blue)' }}>
                        ⭐ {g.name}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      + {SAMPLE.favoriteCount - SAMPLE.goTos.length} more →
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </MsBox>

          {/* Videos */}
          <MsBox header={`🎬 ${SAMPLE.name.split(' ')[0]}'s Videos`} action={{ label: 'add video', href: '#' }}>
            <div className="ms-box-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {SAMPLE.videos.map((url, i) => {
                  const embed = parseVideoUrl(url);
                  if (embed) {
                    return (
                      <div key={i}>
                        {/* Accessible embedded player */}
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', border: '1px solid var(--ms-border)' }}>
                          <iframe
                            src={embed.embedUrl}
                            title={`${embed.label} — ${SAMPLE.name}`}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                        </p>
                      </div>
                    );
                  }
                  // Fallback for unrecognised URLs
                  return (
                    <div key={i} style={{ padding: '6px 8px', background: '#fff8d4', border: '1px solid #e0c840', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span aria-hidden="true" style={{ color: '#d97706', fontWeight: 'bold' }}>▶</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#d97706', fontSize: '0.8125rem' }}>
                        {url}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </MsBox>

          {/* Trainings & Certifications */}
          <MsBox header={`📚 ${SAMPLE.name.split(' ')[0]}'s Trainings & Certifications`}>
            <div className="ms-box-body">
              <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9 }}>
                {SAMPLE.certifications.map((c, i) => (
                  <li key={i} style={{ color: 'var(--aac-blue)' }}>{c}</li>
                ))}
              </ul>
            </div>
          </MsBox>

          {/* Community interests */}
          {SAMPLE.communityInterests.length > 0 && (
            <MsBox header={`🌱 ${SAMPLE.name.split(' ')[0]}'s Community Interests`}>
              <div className="ms-box-body">
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>
                  Features and community spaces {SAMPLE.name.split(' ')[0]} would love to see on the Collective:
                </p>
                <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9 }}>
                  {SAMPLE.communityInterests.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </MsBox>
          )}

          {/* What People Say — Favorite comments */}
          <MsBox
            header={`💬 What People Say About ${SAMPLE.name.split(' ')[0]}`}
            action={{ label: 'Add a Note', href: '#' }}
          >
            <div className="ms-box-body">
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                Displaying <strong>2</strong> of <strong>{SAMPLE.lovedByCount}</strong> notes —{' '}
                <a href="#">View all</a>
              </p>

              {[
                {
                  name: 'Priya Nair', initial: 'P', color: '#fce7f3',
                  date: '5/18/2026 2:14 PM',
                  relationship: 'We worked together at SXSW 2026',
                  text: "Jordan interpreted our entire panel and it was the most seamlessly accessible event I've ever been part of. Absolute professional — I recommend them for any large-scale event.",
                },
                {
                  name: 'Leo Vasquez', initial: 'L', color: '#d4f0e0',
                  date: '4/02/2026 10:30 AM',
                  relationship: 'Collaborators since 2022',
                  text: 'Best CART captioner I have worked with in 10 years. Fast, accurate, and genuinely invested in making the experience great for everyone in the room.',
                },
              ].map((c, i) => (
                <div key={i} className="ms-comment-row">
                  <a
                    href="#"
                    aria-label={`View ${c.name}'s profile`}
                    style={{ display: 'block', flexShrink: 0 }}
                  >
                    <div
                      className="ms-comment-avatar"
                      style={{ background: c.color }}
                      aria-hidden="true"
                    >
                      {c.initial}
                    </div>
                  </a>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px' }}>
                      <a href="#" style={{ fontWeight: 'bold', color: 'var(--aac-blue)', textDecoration: 'none' }}>
                        ⭐ {c.name}
                      </a>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                        {c.date}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 4px', fontStyle: 'italic' }}>
                      {c.relationship}
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </MsBox>

        </main>
      </div>

      {/* ── Footer ── */}
      <footer
        aria-label="Site footer"
        className="ms-footer"
        style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.2)' }}
      >
        <nav aria-label="Footer links" style={{ display: 'inline' }}>
          <a href="/" style={{ color: 'inherit' }}>Home</a>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <a href="/contact" style={{ color: 'inherit' }}>Contact Us</a>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <a href="#" style={{ color: 'inherit' }}>Safety Tips</a>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <a href="#" style={{ color: 'inherit' }}>Report Inappropriate Content</a>
        </nav>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>
          ©{new Date().getFullYear()} Artistic Accessibility Collective. All Rights Reserved.
        </span>
      </footer>

    </main>
  );
}
