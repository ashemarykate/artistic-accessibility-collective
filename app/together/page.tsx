'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// ── Stub entries ──────────────────────────────────────────────────────────────
const ENTRIES = [
  {
    id: 1,
    weekday: 'Tuesday',
    date: 'May 26th, 2026',
    time: '11:47 pm',
    subject: 'welcome to together_aac 💙',
    preview:
      "hi everyone. this is the official community for Together, a space for accessible arts events, community meetups, and connection in and around the arts. we're still building it, but consider this your invitation to watch this space.",
    tags: ['welcome', 'admin', 'announcement'],
    mood: 'excited',
    moodIcon: '🌟',
    comments: 0,
  },
  {
    id: 2,
    weekday: 'Tuesday',
    date: 'May 26th, 2026',
    time: '11:45 pm',
    subject: 'community calendar: coming soon',
    preview:
      "we're working on a community events space: a place to find accessible arts events, post what's happening near you, and connect. more soon.",
    tags: ['calendar', 'events', 'announcement'],
    mood: 'hopeful',
    moodIcon: '✨',
    comments: 0,
  },
];

// ── May 2026 calendar grid ────────────────────────────────────────────────────
const CAL_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CAL_GRID = [
  [null, null, null, null, null,  1,  2],
  [3,    4,    5,    6,    7,    8,   9],
  [10,   11,   12,   13,   14,   15,  16],
  [17,   18,   19,   20,   21,   22,  23],
  [24,   25,   26,   27,   28,   29,  30],
  [31,   null, null, null, null, null, null],
];
// Days with stub "posts"
const ENTRY_DAYS = new Set([26]);

// ── Sidebar nav links ─────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Recent Entries',  href: '/together' },
  { label: 'Calendar',        href: '/together' },
  { label: 'Community Info',  href: '/together' },
  { label: 'Memories',        href: '/together' },
  { label: 'Tags',            href: '/together' },
];

const SITE_LINKS = [
  { label: 'Artistic Accessibility Collective', href: '/' },
  { label: 'Contact Us',                        href: '/contact' },
  { label: 'Join the Collective',               href: '/submit' },
];

// ── Userpic square ────────────────────────────────────────────────────────────
function Userpic({ initials = 'MK', size = 40 }: { initials?: string; size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: '#263590',
        border: '1px solid #1a2568',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.3,
        color: '#fff',
        fontFamily: 'Verdana, Arial, sans-serif',
        fontWeight: 'bold',
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── Community icon (100×100 in the sidebar) ───────────────────────────────────
function CommunityIcon() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 100,
        height: 100,
        background: 'linear-gradient(135deg, #263590 60%, #3a4fb8)',
        border: '2px solid #1a2568',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 28 }}>🗓️</span>
      <span style={{
        fontFamily: 'Verdana, Arial, sans-serif',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: '0.06em',
        textTransform: 'lowercase',
      }}>
        together
      </span>
    </div>
  );
}

export default function TogetherPage() {
  useEffect(() => {
    document.title = 'together_aac · Together · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#dce3ea',
      fontFamily: 'Verdana, Geneva, Arial, sans-serif',
      fontSize: 12,
      color: '#000',
    }}>

      {/* ── LJ site nav bar ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(to bottom, #263590 0%, #1a2568 100%)',
        borderBottom: '2px solid #1a2568',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        height: 26,
      }}>
        <span style={{
          fontFamily: '"Times New Roman", Times, serif',
          fontStyle: 'italic',
          fontSize: 14,
          color: '#fff',
          fontWeight: 'bold',
          marginRight: 16,
          letterSpacing: '-0.02em',
        }} aria-hidden="true">
          LiveJournal
        </span>
        {['Home', 'Post', 'Friends', 'Calendar', 'Profile'].map((item) => (
          <span
            key={item}
            aria-hidden="true"
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 11,
              padding: '0 10px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              cursor: 'default',
              borderRight: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {item}
          </span>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }} aria-hidden="true">
          logged in as: mk_ashe
        </span>
      </div>

      {/* ── Community banner ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(to bottom, #263590, #1e2e7a)',
        padding: '14px 20px 12px',
        borderBottom: '3px solid #1a2568',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <CommunityIcon />
          <div>
            <h1 style={{
              fontFamily: '"Times New Roman", Times, serif',
              fontSize: 22,
              fontStyle: 'italic',
              color: '#fff',
              margin: '0 0 2px',
              fontWeight: 'bold',
            }}>
              together_aac
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginBottom: 8 }}>
              Artistic Accessibility Collective · Community Events Space
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: '♥ Watch Community' },
                { label: '+ Join Community' },
              ].map((btn) => (
                <button
                  key={btn.label}
                  aria-label={btn.label}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: '#fff',
                    fontSize: 10,
                    padding: '3px 10px',
                    cursor: 'pointer',
                    fontFamily: 'Verdana, Arial, sans-serif',
                    borderRadius: 2,
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#f0f3f6',
        borderBottom: '1px solid #c8d0d8',
        padding: '4px 20px',
        fontSize: 11,
        color: '#555',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <nav aria-label="Breadcrumb">
            <span aria-hidden="true">livejournal.com › </span>
            <a href="/together" style={{ color: '#335577', textDecoration: 'none' }}>together_aac</a>
            <span aria-hidden="true"> › </span>
            <strong>Recent Entries</strong>
          </nav>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 860,
        margin: '14px auto 40px',
        padding: '0 12px',
        display: 'grid',
        gridTemplateColumns: '1fr 200px',
        gap: 14,
        alignItems: 'start',
      }}
      className="together-layout"
      >

        {/* ── Entries column ─────────────────────────────────────────────────── */}
        <main>
          {/* Coming soon notice (at the top of entries, styled like a mod post) */}
          <div style={{
            background: '#fffbe6',
            border: '1px solid #e0c840',
            padding: '8px 12px',
            marginBottom: 14,
            fontSize: 11,
            color: '#555',
            lineHeight: 1.5,
          }}>
            <strong style={{ color: '#886600' }}>☛ Mod note:</strong>{' '}
            This community is under construction. Events, calendar features, and member posting are coming soon. Watch this community to get notified when we launch.
          </div>

          {ENTRIES.map((entry, i) => (
            <article
              key={entry.id}
              style={{
                background: '#fff',
                border: '1px solid #c8d0d8',
                marginBottom: 14,
              }}
            >
              {/* Entry header */}
              <div style={{
                background: '#e8edf4',
                borderBottom: '1px solid #c8d0d8',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 11, color: '#334455' }}>
                  {entry.weekday}, {entry.date} at {entry.time}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#263590',
                }}>
                  {entry.subject}
                </span>
              </div>

              {/* Entry body */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Userpic initials="MK" size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
                      posted by{' '}
                      <a href="/together" style={{ color: '#263590', fontWeight: 'bold', textDecoration: 'none' }}>
                        mk_ashe
                      </a>
                      {' '}in{' '}
                      <a href="/together" style={{ color: '#263590', fontWeight: 'bold', textDecoration: 'none' }}>
                        together_aac
                      </a>
                    </div>
                    <p style={{ margin: '0 0 8px', lineHeight: 1.6, fontSize: 12, color: '#222' }}>
                      {entry.preview}
                    </p>
                    <div style={{ marginBottom: 8 }}>
                      <a
                        href="/together"
                        style={{ color: '#263590', fontSize: 11 }}
                        aria-label={`Read more of: ${entry.subject}`}
                      >
                        ( <em>Read more...</em> )
                      </a>
                    </div>
                  </div>
                </div>

                {/* Entry metadata */}
                <div style={{
                  borderTop: '1px solid #e8ecf0',
                  paddingTop: 6,
                  marginTop: 2,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px 16px',
                  fontSize: 10,
                  color: '#667',
                }}>
                  <span>
                    <strong>Tags:</strong>{' '}
                    {entry.tags.map((t, ti) => (
                      <span key={t}>
                        <a href="/together" style={{ color: '#335577' }}>{t}</a>
                        {ti < entry.tags.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </span>
                  <span>
                    <strong>Current mood:</strong> {entry.moodIcon} {entry.mood}
                  </span>
                  <span style={{ marginLeft: 'auto' }}>
                    <a href="/together" style={{ color: '#335577' }}>
                      {entry.comments} comment{entry.comments !== 1 ? 's' : ''}
                    </a>
                    {' · '}
                    <a href="/together" style={{ color: '#335577' }}>
                      post comment
                    </a>
                  </span>
                </div>
              </div>
            </article>
          ))}

          {/* Navigation between pages */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#667',
            padding: '4px 0',
          }}>
            <span style={{ color: '#aab' }}>← Previous 10</span>
            <span style={{ color: '#aab' }}>Next 10 →</span>
          </div>
        </main>

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside aria-label="Community sidebar">

          {/* Community info box */}
          <div style={{
            background: '#fff',
            border: '1px solid #c8d0d8',
            marginBottom: 10,
          }}>
            <div style={{
              background: '#263590',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              padding: '4px 8px',
              letterSpacing: '0.04em',
            }}>
              Community Info
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CommunityIcon />
              <div style={{ width: '100%', fontSize: 10, lineHeight: 1.9, color: '#334' }}>
                {[
                  ['Name',     'together_aac'],
                  ['Type',     'Community'],
                  ['Members',  '1'],
                  ['Founded',  'May 2026'],
                  ['Posting',  'Members only'],
                  ['Status',   '🚧 Coming Soon'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 4 }}>
                    <span style={{ color: '#889', minWidth: 52, flexShrink: 0 }}>{k}:</span>
                    <span style={{ color: '#223', fontWeight: k === 'Status' ? 'bold' : 'normal' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar widget */}
          <div style={{
            background: '#fff',
            border: '1px solid #c8d0d8',
            marginBottom: 10,
          }}>
            <div style={{
              background: '#263590',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              padding: '4px 8px',
              letterSpacing: '0.04em',
            }}>
              May 2026
            </div>
            <div style={{ padding: '6px 8px' }}>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}
                aria-label="May 2026 calendar"
              >
                <thead>
                  <tr>
                    {CAL_HEADERS.map((d) => (
                      <th
                        key={d}
                        scope="col"
                        style={{
                          textAlign: 'center',
                          color: '#889',
                          fontWeight: 'bold',
                          padding: '1px 0',
                          fontSize: 9,
                        }}
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAL_GRID.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((day, di) => (
                        <td
                          key={di}
                          style={{
                            textAlign: 'center',
                            padding: '2px 0',
                            color: day === null ? 'transparent' : ENTRY_DAYS.has(day) ? '#263590' : '#445',
                            fontWeight: ENTRY_DAYS.has(day ?? 0) ? 'bold' : 'normal',
                            textDecoration: 'none',
                            cursor: 'default',
                          }}
                        >
                          {day ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            background: '#fff',
            border: '1px solid #c8d0d8',
            marginBottom: 10,
          }}>
            <div style={{
              background: '#263590',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              padding: '4px 8px',
              letterSpacing: '0.04em',
            }}>
              Navigate
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {NAV_LINKS.map((lnk) => (
                <li key={lnk.label}>
                  <a
                    href={lnk.href}
                    style={{ color: '#335577', fontSize: 11, textDecoration: 'none' }}
                  >
                    {lnk.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* External links */}
          <div style={{
            background: '#fff',
            border: '1px solid #c8d0d8',
            marginBottom: 10,
          }}>
            <div style={{
              background: '#263590',
              color: '#fff',
              fontSize: 11,
              fontWeight: 'bold',
              padding: '4px 8px',
              letterSpacing: '0.04em',
            }}>
              Links
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {SITE_LINKS.map((lnk) => (
                <li key={lnk.label}>
                  <Link
                    href={lnk.href}
                    style={{ color: '#335577', fontSize: 11, textDecoration: 'none' }}
                  >
                    {lnk.label}
                  </Link>
                </li>
              ))}
              <li style={{ paddingTop: 4, borderTop: '1px solid #e8ecf0', marginTop: 2 }}>
                <Link
                  href="/"
                  style={{ color: '#263590', fontSize: 11, fontWeight: 'bold', textDecoration: 'none' }}
                >
                  ← Back to Home
                </Link>
              </li>
            </ul>
          </div>

        </aside>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#263590',
        borderTop: '2px solid #1a2568',
        padding: '8px 20px',
        textAlign: 'center',
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Verdana, Arial, sans-serif',
      }}>
        together_aac · Artistic Accessibility Collective ·{' '}
        <Link href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
          artisticaccessibility.com
        </Link>
      </div>

      <style>{`
        a:visited { color: #551a8b; }
        .together-layout a:visited { color: #551a8b; }
        @media (max-width: 580px) {
          .together-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
