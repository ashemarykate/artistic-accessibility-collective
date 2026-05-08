'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ProfileWithEndorsements = Profile & { endorsement_count: number };

export default function MemberDirectory() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileWithEndorsements[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

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
      <div className="loading-screen" aria-live="polite" aria-label="Loading member directory">
        <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
        <span>Loading members…</span>
      </div>
    );
  }

  return (
    <main>
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home"><img src="/images/logo-across-blue-bg.svg" alt="Artistic Accessibility Collective" /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/directory" className="nav-link">Public Directory</Link>
          <Link href="/feedback" className="nav-link">Share Feedback</Link>
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
          <h1 className="font-display" style={{ color: 'var(--aac-white)', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', marginBottom: '0.25rem' }}>
            Member Directory
          </h1>
          <p className="font-accent-italic" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem' }}>
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
              style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem', marginBottom: '1rem' }}
            >
              Showing {filtered.length} of {profiles.length} member{profiles.length !== 1 ? 's' : ''}
            </p>

            <ul
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {filtered.map((p) => {
                const name = p.display_name || p.full_name;
                return (
                  <li key={p.id}>
                    <Link href={`/profile/${p.id}`} className="member-card" aria-label={`View ${name}'s profile`}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div className="member-avatar" aria-hidden="true">
                          {p.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="font-display" style={{ fontSize: '1.1rem', color: 'var(--aac-navy)', marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                          </p>
                          {p.pronouns && (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{p.pronouns}</p>
                          )}
                          {(p.location_city || p.location_state) && (
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                              <span aria-hidden="true">📍 </span>
                              {[p.location_city, p.location_state].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {p.specialties && p.specialties.length > 0 && (
                            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', listStyle: 'none', padding: 0, margin: '0 0 0.5rem' }}>
                              {p.specialties.slice(0, 3).map((s, i) => (
                                <li key={i}><span className="tag tag-blue">{s}</span></li>
                              ))}
                              {p.specialties.length > 3 && (
                                <li><span className="tag tag-gray">+{p.specialties.length - 3} more</span></li>
                              )}
                            </ul>
                          )}
                          {p.endorsement_count > 0 && (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                              {p.endorsement_count} endorsement{p.endorsement_count !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
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
  );
}
