'use client';

/**
 * DEV PREVIEW — visit localhost:3000/dev
 * No auth required. Shows full Myspace-style profile with sample data.
 */

import Link from 'next/link';

const SAMPLE = {
  name:        'Jordan Rivera',
  username:    'jordan-rivera',
  pronouns:    'they/them',
  location:    'Austin, TX',
  memberSince: '01/15/2024',
  endorsements: 12,
  experience:  8,
  bgColor:     '#263590',
  highlights:  'SXSW 2026 accessibility lead. Specializing in large-scale live event interpretation and real-time CART captioning. Available for touring productions, festivals, and corporate events nationwide.',
  bio:         "I've spent the last 8 years making live experiences accessible to everyone in the room — from intimate theatre to 80,000-person music festivals. I believe accessibility isn't a checklist, it's a craft.\n\nCurrently based in Austin but I go where the work is.",
  specialties: ['ASL Interpreter', 'CART Captioner', 'Event Accessibility Coordinator'],
  top8: [
    { name: 'Maya Chen',   initial: 'M', color: '#d8dcf5' },
    { name: 'Sam Okafor',  initial: 'S', color: '#d4f0e0' },
    { name: 'Alex Torres', initial: 'A', color: '#fce7f3' },
    { name: 'Riley Park',  initial: 'R', color: '#fef3c7' },
    { name: 'Devon Walsh', initial: 'D', color: '#e0e7ff' },
    { name: 'Casey Kim',   initial: 'C', color: '#cffafe' },
  ],
  videos: [
    'youtube.com/watch?v=example1',
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

const bgColor = SAMPLE.bgColor;

export default function DevPreview() {
  return (
    <main style={{ background: bgColor, minHeight: '100vh', paddingBottom: '24px' }}>

      {/* ── Dev banner ── */}
      <div style={{ background: '#fbbf24', color: '#1c1917', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', padding: '4px', letterSpacing: '0.05em', fontFamily: 'Verdana, sans-serif' }}>
        ⚠️ DEV PREVIEW — sample data only —{' '}
        <a href="/" style={{ color: 'inherit' }}>back to home</a>
      </div>

      {/* ── Header: logo bar + pipe nav ── */}
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
        maxWidth: '960px', margin: '0 auto', padding: '12px 10px',
        display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap',
      }}>

        {/* ════════════════════════════════
            LEFT SIDEBAR — 240px
        ════════════════════════════════ */}
        <aside style={{ width: '240px', minWidth: '240px', flexShrink: 0 }}>

          {/* Profile photo + name box */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>{SAMPLE.name}</span>
              <span style={{ fontWeight: 'normal', fontSize: '0.6875rem', opacity: 0.8 }}>[ <a href="#">edit profile</a> ]</span>
            </div>
            <div style={{ padding: '8px' }}>

              {/* Square photo */}
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <div style={{
                  width: '100%', aspectRatio: '1 / 1',
                  border: '2px solid #fff',
                  outline: '1px solid var(--ms-border)',
                  overflow: 'hidden',
                  background: 'var(--aac-blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/placeholder-profile.jpg"
                    alt="Four accessibility professionals posing at SXSW 2026"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.innerHTML = '<span style="font-size:4rem;font-weight:700;color:var(--aac-blue)">J</span>';
                    }}
                  />
                </div>
                {/* Online badge */}
                <div style={{ marginTop: '4px', textAlign: 'center' }}>
                  <span className="ms-online-badge">Online Now!</span>
                </div>
              </div>

              {/* Pronouns + location */}
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>{SAMPLE.pronouns}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>📍 {SAMPLE.location}</p>

              {/* Stats row */}
              <div className="ms-stats-row" style={{ marginTop: '8px' }}>
                <div className="ms-stat">
                  <strong>{SAMPLE.endorsements}</strong>
                  endorsements
                </div>
                <div className="ms-stat">
                  <strong>{SAMPLE.experience} yrs</strong>
                  experience
                </div>
              </div>

              {/* Member since + last login */}
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                Member Since: {SAMPLE.memberSince}<br />
                Last Login: Today
              </p>
            </div>
          </div>

          {/* Contacting box */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>Contacting {SAMPLE.name.split(' ')[0]}</span>
            </div>
            <div className="ms-action-grid">
              <a href="#" className="ms-action-link">
                <span className="ms-action-link-icon" aria-hidden="true">✉️</span>
                Send Message
              </a>
              <a href="#" className="ms-action-link">
                <span className="ms-action-link-icon" aria-hidden="true">⭐</span>
                Endorse
              </a>
              <a href="#" className="ms-action-link">
                <span className="ms-action-link-icon" aria-hidden="true">➡️</span>
                Forward to Friend
              </a>
              <a href="#" className="ms-action-link">
                <span className="ms-action-link-icon" aria-hidden="true">❤️</span>
                Add to Favorites
              </a>
            </div>
          </div>

          {/* Profile URL box */}
          <div className="ms-box">
            <div className="ms-box-header"><span>Profile URL:</span></div>
            <div className="ms-box-body">
              <p className="ms-profile-url">
                /profile/<strong>{SAMPLE.username}</strong>
              </p>
              <p style={{ marginTop: '4px' }}>
                <a href="#" className="ms-edit-link">[ change URL ]</a>
              </p>
            </div>
          </div>

          {/* Interests (left sidebar table) */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>{SAMPLE.name.split(' ')[0]}&apos;s Interests</span>
              <a href="#">[edit]</a>
            </div>
            <div style={{ padding: '6px' }}>
              <table className="ms-table" role="presentation">
                <tbody>
                  <tr>
                    <td>General</td>
                    <td>Accessibility advocacy, live events, disability community</td>
                  </tr>
                  <tr>
                    <td>Activities</td>
                    <td>
                      {SAMPLE.activities.map((a, i) => (
                        <span key={i}>
                          <a href="#" style={{ color: 'var(--aac-blue)', textDecoration: 'none' }}>{a}</a>
                          {i < SAMPLE.activities.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </td>
                  </tr>
                  <tr>
                    <td>Languages</td>
                    <td>{SAMPLE.languages.join(', ')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Links / Contact */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>{SAMPLE.name.split(' ')[0]}&apos;s Links</span>
            </div>
            <div style={{ padding: '6px' }}>
              <table className="ms-table" role="presentation">
                <tbody>
                  <tr><td>Email</td><td><a href="#">jordan@example.com</a></td></tr>
                  <tr><td>Website</td><td><a href="#">jordsworks.com</a></td></tr>
                  <tr><td>LinkedIn</td><td><a href="#">@jordanrivera</a></td></tr>
                  <tr><td>Instagram</td><td><a href="#">@jords.asl</a></td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </aside>

        {/* ════════════════════════════════
            RIGHT MAIN CONTENT
        ════════════════════════════════ */}
        <div style={{ flex: 1, minWidth: '300px' }}>

          {/* Highlights */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>✨ {SAMPLE.name.split(' ')[0]}&apos;s Highlights</span>
              <a href="#">[edit]</a>
            </div>
            <div className="ms-box-body">
              <p style={{ margin: 0, lineHeight: 1.6 }}>{SAMPLE.highlights}</p>
            </div>
          </div>

          {/* Blurbs — About Me / What I Do */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>{SAMPLE.name.split(' ')[0]}&apos;s Blurbs</span>
              <a href="#">[edit]</a>
            </div>
            <div className="ms-box-body">
              <p style={{ fontWeight: 'bold', marginBottom: '4px', marginTop: 0 }}>About me:</p>
              <p style={{ margin: '0 0 12px', color: 'var(--aac-blue)', lineHeight: 1.6 }}>{SAMPLE.bio}</p>
              <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>What I do:</p>
              <p style={{ margin: 0, color: 'var(--aac-blue)' }}>
                {SAMPLE.specialties.join(' · ')}
              </p>
            </div>
          </div>

          {/* Friend Space — Top 8 */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>{SAMPLE.name.split(' ')[0]}&apos;s Friend Space</span>
              <a href="#">[view all {SAMPLE.endorsements}]</a>
            </div>
            <div className="ms-box-body">
              <p style={{ margin: '0 0 8px', fontSize: '0.75rem' }}>
                <strong>{SAMPLE.name.split(' ')[0]}</strong> has{' '}
                <strong>{SAMPLE.endorsements}</strong> endorsements.
              </p>

              {/* Screen reader version */}
              <p className="sr-only">
                Top endorsers: {SAMPLE.top8.map(e => e.name).join(', ')} and {SAMPLE.endorsements - SAMPLE.top8.length} more.
              </p>

              <div className="ms-friend-grid" aria-hidden="true">
                {SAMPLE.top8.map((f, i) => (
                  <div key={i} className="ms-friend-cell">
                    <a href="#" style={{ display: 'block', textDecoration: 'none' }}>
                      <div
                        className="ms-friend-photo"
                        style={{
                          background: f.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          color: 'var(--aac-blue)',
                          height: '100%',
                          minHeight: '60px',
                        }}
                      >
                        {f.initial}
                      </div>
                      <span className="ms-friend-name">{f.name.split(' ')[0]}</span>
                    </a>
                  </div>
                ))}
                {/* 2 empty slots */}
                {[0, 1].map(i => (
                  <div key={`empty-${i}`} className="ms-friend-cell" aria-hidden="true">
                    <div className="ms-friend-photo" style={{ minHeight: '60px', background: '#f0f2fc', border: '1px dashed var(--ms-border)' }} />
                    <span className="ms-friend-name" style={{ color: 'var(--ms-border)' }}>—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Videos */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>🎬 {SAMPLE.name.split(' ')[0]}&apos;s Videos</span>
              <a href="#">[add video]</a>
            </div>
            <div className="ms-box-body">
              {SAMPLE.videos.map((url, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', padding: '5px 8px', background: '#fff8d4', border: '1px solid #e0c840' }}>
                  <span aria-hidden="true" style={{ color: '#d97706', fontWeight: 'bold' }}>▶</span>
                  <a href="#" style={{ color: '#d97706', textDecoration: 'none', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Trainings & Certifications */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>📚 {SAMPLE.name.split(' ')[0]}&apos;s Trainings &amp; Certifications</span>
            </div>
            <div className="ms-box-body">
              <ul style={{ margin: 0, padding: '0 0 0 16px', lineHeight: 1.8 }}>
                {SAMPLE.certifications.map((c, i) => (
                  <li key={i} style={{ color: 'var(--aac-blue)' }}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Friends Comments */}
          <div className="ms-box">
            <div className="ms-box-header">
              <span>{SAMPLE.name.split(' ')[0]}&apos;s Endorsement Comments</span>
              <a href="#">[Add Comment]</a>
            </div>
            <div className="ms-box-body">
              <p style={{ fontSize: '0.75rem', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                Displaying <strong>2</strong> of <strong>{SAMPLE.endorsements}</strong> comments —{' '}
                <a href="#">View all</a>
              </p>

              {/* Sample comment rows */}
              {[
                { name: 'Maya Chen', initial: 'M', color: '#d8dcf5', date: '5/18/2026 2:14 PM', text: "Jordan interpreted our entire SXSW panel and it was the most seamlessly accessible event I've ever been part of. Absolute professional." },
                { name: 'Sam Okafor', initial: 'S', color: '#d4f0e0', date: '4/02/2026 10:30 AM', text: 'Best CART captioner I have worked with in 10 years. Fast, accurate, and genuinely invested in making the experience great for everyone.' },
              ].map((c, i) => (
                <div key={i} className="ms-comment-row">
                  <a href="#" aria-label={`View ${c.name}'s profile`}>
                    <div className="ms-comment-avatar" style={{ background: c.color }}>
                      {c.initial}
                    </div>
                  </a>
                  <div>
                    <p style={{ margin: '0 0 2px' }}>
                      <a href="#" style={{ fontWeight: 'bold', color: 'var(--aac-blue)', textDecoration: 'none' }}>{c.name}</a>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{c.date}</span>
                    </p>
                    <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>{/* end right main */}
      </div>{/* end grid */}

      {/* ── Myspace-style footer ── */}
      <footer className="ms-footer" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.65)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>About</a>
        <span className="ms-footer-pipe">|</span>
        <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>FAQ</a>
        <span className="ms-footer-pipe">|</span>
        <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>Safety Tips</a>
        <span className="ms-footer-pipe">|</span>
        <a href="/contact" style={{ color: 'rgba(255,255,255,0.65)' }}>Contact Us</a>
        <span className="ms-footer-pipe">|</span>
        <a href="#" style={{ color: 'rgba(255,255,255,0.65)' }}>Report Inappropriate Content</a>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>©2024 Artistic Accessibility Collective. All Rights Reserved.</span>
      </footer>

    </main>
  );
}
