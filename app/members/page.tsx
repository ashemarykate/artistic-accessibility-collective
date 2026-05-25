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

  useEffect(() => {
    document.title = 'Member Directory — Artistic Accessibility Collective';
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
    return matchSearch && matchSpecialty;
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
    <main className="page-wrapper">
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home"><img src="/images/logo-across-blue-bg.svg" alt="" /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/dashboard"   className="nav-link">My Hub</Link>
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

      <div className="page-container-wide" style={{ paddingTop: '2.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--aac-blue-dark)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem', fontWeight: 'bold' }}>
            Member Directory
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {profiles.length} member{profiles.length !== 1 ? 's' : ''} · visible to logged-in members only
          </p>
        </div>

        {/* Search & filter */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div className="form-group" style={{ flex: '1 1 260px' }}>
            <label htmlFor="search" className="sr-only">Search members</label>
            <input
              id="search"
              type="search"
              className="form-input"
              placeholder="Search by name, location, or specialty…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search members"
            />
          </div>
          <div className="form-group" style={{ flex: '0 1 220px' }}>
            <label htmlFor="specialty-filter" className="sr-only">Filter by specialty</label>
            <select
              id="specialty-filter"
              className="form-input"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              aria-label="Filter by specialty"
            >
              <option value="">All specialties</option>
              {allSpecialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>
              {profiles.length === 0
                ? 'No approved members yet.'
                : 'No members match your search.'}
            </p>
            {(searchTerm || selectedSpecialty) && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedSpecialty(''); }}
                className="btn btn-ghost"
                style={{ marginTop: '1rem' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p
              aria-live="polite"
              aria-atomic="true"
              style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}
            >
              Showing {filtered.length} of {profiles.length} member{profiles.length !== 1 ? 's' : ''}
            </p>

            <p className="sr-only">
              Member profiles are displayed as contact cards. Ivory cards are individual members; blue cards are businesses. Each card shows name, location, and specialties. Click any card to view the full profile.
            </p>
            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {filtered.map((p) => {
                const name = p.display_name || p.full_name;
                const isBusiness = p.profile_type === 'business';
                return (
                  <li key={p.id}>
                    <Link
                      href={profileHref(p)}
                      className={`contact-card ${isBusiness ? 'contact-card-business' : 'contact-card-individual'}`}
                      aria-label={`View ${name}'s profile`}
                    >
                      <div className="contact-card-stripe" aria-hidden="true" />
                      <div className="contact-card-body">
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                          <div
                            className="member-avatar"
                            aria-hidden="true"
                            style={{ width: 52, height: 52, minWidth: 52, fontSize: '1.25rem', flexShrink: 0 }}
                          >
                            {p.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.9375rem', fontWeight: 'bold', color: 'var(--aac-navy)', marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {name}
                            </p>
                            <p style={{ marginBottom: '0.125rem' }}>
                              {p.user_id && adminUserIds.has(p.user_id) ? (
                                <span className="ms-admin-badge" aria-label="Admin">✦ Admin</span>
                              ) : (
                                <span className="ms-member-badge" aria-label="Member">✦ Member</span>
                              )}
                            </p>
                            {p.pronouns && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem' }}>{p.pronouns}</p>
                            )}
                            {(p.location_city || p.location_state) && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <span aria-hidden="true">📍 </span>
                                {[p.location_city, p.location_state].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        {p.specialties && p.specialties.length > 0 && (
                          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', listStyle: 'none', padding: 0, margin: 0 }}>
                            {p.specialties.slice(0, 3).map((s, i) => (
                              <li key={i}><span className={`tag ${specialtyTagClass(s)}`}>{s}</span></li>
                            ))}
                            {p.specialties.length > 3 && (
                              <li><span className="tag tag-gray">+{p.specialties.length - 3} more</span></li>
                            )}
                          </ul>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  </BrowserChrome>
  );
}
