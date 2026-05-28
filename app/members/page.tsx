'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile, profileHref } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrowserChrome from '@/components/BrowserChrome';

type ProfileWithEndorsements = Profile & { endorsement_count: number };

// ── Specialty category → tag color ───────────────────────────────────────────
// interpreter (yellow) · artistic (rose) · event (green) · educator (blue) · other (gray)
function specialtyTagClass(specialty: string): string {
  const s = specialty.toLowerCase();

  // Educators first (Sign Language Instructor overlaps with interpreter keywords)
  if (
    s.includes('instructor') || s.includes('teacher') || s.includes('trainer') ||
    s.includes('educator') || s.includes('professor') || s.includes('coach') ||
    s.includes('speaker')
  ) return 'tag-blue';

  // ASL / Communication Access Interpreters & Captioners
  if (
    s.includes('asl') || s.includes('interpreter') || s.includes('transliterator') ||
    s.includes('captioner') || s.includes('cart') || s.includes('cdi') ||
    s.includes('audio describ') || s.includes('tactile') || s.includes('deafblind') ||
    s.includes('communication access') || s.includes('cued speech') ||
    s.includes('oral translit')
  ) return 'tag-yellow';

  // Event / Production Staff (including film)
  if (
    s.includes('event') || s.includes('production') || s.includes('front of house') ||
    s.includes('back of house') || s.includes('foh') || s.includes('boh') ||
    s.includes('stage') || s.includes('film') || s.includes('camera') ||
    s.includes('lighting') || s.includes('sound') || s.includes('crew') ||
    s.includes('coordinator')
  ) return 'tag-green';

  // Artistic / Performance
  if (
    s.includes('actor') || s.includes('comedian') || s.includes('comic') ||
    s.includes('artist') || s.includes('performer') || s.includes('musician') ||
    s.includes('dancer') || s.includes('choreograph') || s.includes('content creator') ||
    s.includes('director') || s.includes('playwright') || s.includes('writer')
  ) return 'tag-rose';

  // Everything else
  return 'tag-gray';
}

export default function MemberDirectory() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileWithEndorsements[]>([]);
  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [volunteerOnly, setVolunteerOnly] = useState(false);

  useEffect(() => {
    document.title = 'Member Directory · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await fetchProfiles();
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'approved')
        .order('full_name');

      if (error) throw error;

      const withCounts = await Promise.all(
        (data || []).map(async (p) => {
          const { count } = await supabase
            .from('endorsements')
            .select('*', { count: 'exact', head: true })
            .eq('endorsed_id', p.id);
          return { ...p, endorsement_count: count ?? 0 };
        })
      );

      setProfiles(withCounts);

      // Fetch admin user_ids so we can badge them in the directory
      const { data: admins } = await supabase
        .from('admin_users')
        .select('user_id');
      setAdminUserIds(new Set((admins ?? []).map((a) => a.user_id)));
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const allSpecialties = Array.from(
    new Set(profiles.flatMap((p) => p.specialties ?? []))
  ).sort();

  const filtered = profiles.filter((p) => {
    const name = (p.display_name || p.full_name).toLowerCase();
    const location = [p.location_city, p.location_state].filter(Boolean).join(', ').toLowerCase();
    const matchSearch =
      !searchTerm ||
      name.includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase()) ||
      (p.specialties ?? []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSpecialty =
      !selectedSpecialty || (p.specialties ?? []).includes(selectedSpecialty);
    const matchVolunteer =
      !volunteerOnly || (p as any).volunteer_status === 'yes';
    return matchSearch && matchSpecialty && matchVolunteer;
  });

  if (loading) {
    return (
      <BrowserChrome variant="netscape" title="The Collective — Member Directory" url="http://members.artisticaccessibility.com/members">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading member directory">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading members…</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="netscape" title="The Collective — Member Directory" url="http://members.artisticaccessibility.com/members">
    <main className="page-wrapper" style={{ background: 'var(--aac-blue)' }}>
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home"><img src="/images/wordmark-2.svg" alt="" /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/dashboard"   className="nav-link">Backstage</Link>
          <Link href="/messages"  className="nav-link">Messages</Link>
          <Link href="/resources" className="nav-link">Resources</Link>
          <Link href="/feedback"  className="nav-link">Feedback</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="btn btn-outline-white btn-sm"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <div className="page-container-wide" style={{ paddingTop: '1.25rem', paddingBottom: '1.5rem' }}>
        <h1 className="sr-only">Member Directory</h1>

        {/* ── Search box ──────────────────────────────────────────────────────── */}
        <div className="ms-box" style={{ marginBottom: 10 }}>
          <div className="ms-box-header">
            <h2>🔍 Search Members</h2>
          </div>
          <div className="ms-box-body" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label htmlFor="search" className="sr-only">Search by name, location, or specialty</label>
              <input
                id="search"
                type="search"
                placeholder="Search name, location, specialty…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  height: 24, fontSize: '0.8125rem', fontFamily: 'var(--font-body)',
                  border: '2px inset #b4b0a8', padding: '1px 6px',
                  width: 240, background: '#fff',
                }}
              />
            </div>
            <div>
              <label htmlFor="specialty-filter" className="sr-only">Filter by specialty</label>
              <select
                id="specialty-filter"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                style={{
                  height: 24, fontSize: '0.8125rem', fontFamily: 'var(--font-body)',
                  border: '2px inset #b4b0a8', padding: '1px 4px', background: '#fff',
                }}
              >
                <option value="">All specialties</option>
                {allSpecialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <input
                type="checkbox"
                checked={volunteerOnly}
                onChange={(e) => setVolunteerOnly(e.target.checked)}
                style={{ width: 14, height: 14 }}
              />
              🌱 Open to volunteering
            </label>
            {(searchTerm || selectedSpecialty || volunteerOnly) && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedSpecialty(''); setVolunteerOnly(false); }}
                style={{
                  height: 24, fontSize: '0.8125rem', fontFamily: 'var(--font-body)',
                  border: '1px outset #b4b0a8', background: '#ece9d8',
                  padding: '0 10px', cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Results box ─────────────────────────────────────────────────────── */}
        <div className="ms-box">
          <div className="ms-box-header">
            <h2>👥 Browse Members</h2>
            <span
              aria-live="polite"
              aria-atomic="true"
              style={{ fontWeight: 'normal', fontSize: '0.6875rem' }}
            >
              {filtered.length} of {profiles.length} shown · members only
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="ms-box-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {profiles.length === 0 ? 'No approved members yet.' : 'No members match your search.'}
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} role="list">
              <p className="sr-only">
                Member profiles listed as rows. Each row shows name, location, and specialties. Click the View Profile link to see a full profile.
              </p>
              {filtered.map((p, idx) => {
                const name = p.display_name || p.full_name;
                const isBusiness = p.profile_type === 'business';
                const location = [p.location_city, p.location_state].filter(Boolean).join(', ');
                return (
                  <li
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 10px',
                      background: idx % 2 === 0 ? '#fff' : 'var(--ms-row-alt)',
                      borderBottom: '1px solid var(--ms-border)',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      aria-hidden="true"
                      style={{
                        width: 44, height: 44, minWidth: 44,
                        background: isBusiness ? 'var(--aac-blue-light)' : '#e8e0f8',
                        border: '1px solid var(--ms-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--aac-blue)',
                        flexShrink: 0, overflow: 'hidden',
                      }}
                    >
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '0.875rem' }}>
                          {name}
                        </span>
                        {p.user_id && adminUserIds.has(p.user_id) ? (
                          <span className="ms-admin-badge" aria-label="Admin">✦ Admin</span>
                        ) : (
                          <span className="ms-member-badge" aria-label="Member">✨ Member</span>
                        )}
                        {isBusiness && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Business</span>
                        )}
                        {(p as any).volunteer_status === 'yes' && (
                          <span style={{ fontSize: '0.6875rem', color: '#2d6a2d', background: '#e8f5e8', border: '1px solid #a8d5a8', borderRadius: 3, padding: '1px 5px' }} aria-label="Open to volunteering">
                            🌱 Volunteers
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {p.pronouns && <span>{p.pronouns}</span>}
                        {location && <span><span aria-hidden="true">📍 </span>{location}</span>}
                      </div>
                    </div>

                    {/* Specialty tags */}
                    {p.specialties && p.specialties.length > 0 && (
                      <ul
                        aria-label="Specialties"
                        style={{ display: 'flex', flexWrap: 'nowrap', gap: 3, listStyle: 'none', padding: 0, margin: 0 }}
                        className="dir-tags"
                      >
                        <li><span className={`tag ${specialtyTagClass(p.specialties[0])}`}>{p.specialties[0]}</span></li>
                        {p.specialties.length > 1 && (
                          <li><span className="tag tag-gray">+{p.specialties.length - 1}</span></li>
                        )}
                      </ul>
                    )}

                    {/* View profile link */}
                    <Link
                      href={profileHref(p)}
                      style={{ fontSize: '0.75rem', color: 'var(--aac-blue)', whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none' }}
                      aria-label={`View ${name}'s profile`}
                    >
                      [View Profile]
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <style>{`
          @media (max-width: 560px) {
            .dir-tags { display: none !important; }
          }
        `}</style>
      </div>
    </main>
  </BrowserChrome>
  );
}
