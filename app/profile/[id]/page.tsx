'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile, type Endorsement, REQUIRED_PROFILE_VERSION } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type EndorsementWithProfile = Endorsement & { endorser: Profile };

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [endorsements, setEndorsements] = useState<EndorsementWithProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [endorsing, setEndorsing] = useState(false);
  const [hasEndorsed, setHasEndorsed] = useState(false);

  useEffect(() => { fetchData(); }, [profileId]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: up } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();
        setCurrentUserProfile(up);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: endorsementsData, error: endorsementsError } = await supabase
        .from('endorsements')
        .select('*, endorser:profiles!endorser_id(*)')
        .eq('endorsed_id', profileId);

      if (endorsementsError) throw endorsementsError;
      setEndorsements(endorsementsData as EndorsementWithProfile[]);

      if (user && endorsementsData) {
        const { data: up2 } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (up2) {
          setHasEndorsed(endorsementsData.some((e: any) => e.endorser_id === up2.id));
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async () => {
    if (!currentUserProfile) { router.push('/login'); return; }
    setEndorsing(true);
    try {
      if (hasEndorsed) {
        await supabase
          .from('endorsements')
          .delete()
          .eq('endorser_id', currentUserProfile.id)
          .eq('endorsed_id', profileId);
      } else {
        await supabase
          .from('endorsements')
          .insert({ endorser_id: currentUserProfile.id, endorsed_id: profileId });
      }
      await fetchData();
    } catch (err) {
      console.error('Error toggling endorsement:', err);
    } finally {
      setEndorsing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" aria-live="polite" aria-label="Loading profile">
        <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
        <span>Loading profile…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', minHeight: '100vh' }}>
        <div className="content-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h1 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.75rem', marginBottom: '1rem' }}>
            Profile Not Found
          </h1>
          <Link href="/directory" className="btn btn-primary">
            ← Browse Directory
          </Link>
        </div>
      </main>
    );
  }

  const isOwnProfile = currentUserProfile?.id === profile.id;
  const canEndorse = currentUserProfile && !isOwnProfile;
  const needsVersionUpdate =
    isOwnProfile && (profile.profile_version ?? 1) < REQUIRED_PROFILE_VERSION;

  const displayName = profile.display_name || profile.full_name;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="page-wrapper" style={{ padding: '0 0 4rem' }}>
      {/* Header bar */}
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home"><img src="/images/logo-across-blue-bg.svg" alt="Artistic Accessibility Collective" /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/directory" className="nav-link">Directory</Link>
          {currentUser && <Link href="/members" className="nav-link">Members</Link>}
          {currentUser && <Link href="/feedback" className="nav-link">Share Feedback</Link>}
          {!currentUser && <Link href="/login" className="nav-link">Log In</Link>}
        </nav>
      </header>

      <div className="page-container">

        {/* Profile version update banner */}
        {needsVersionUpdate && (
          <div className="alert alert-warning" role="alert" style={{ marginBottom: '1.5rem' }}>
            <strong>Your profile has new fields available.</strong>{' '}
            <Link href={`/profile/${profile.id}/edit`} style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>
              Update your profile
            </Link>{' '}
            to make sure everything is current.
          </div>
        )}

        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
          {/* Profile header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div
              className="member-avatar member-avatar-lg"
              aria-hidden="true"
              role="img"
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initial
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h1 className="font-display" style={{ color: 'var(--aac-navy)', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', marginBottom: '0.25rem' }}>
                {displayName}
              </h1>

              {profile.pronouns && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '0.375rem' }}>
                  {profile.pronouns}
                </p>
              )}

              {(profile.location_city || profile.location_state) && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '0.375rem' }}>
                  <span aria-hidden="true">📍 </span>
                  <span>
                    {[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
                    {profile.willing_to_travel && ' · Will travel'}
                  </span>
                </p>
              )}

              {profile.years_of_experience && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                  {profile.years_of_experience} year{profile.years_of_experience === 1 ? '' : 's'} of experience
                </p>
              )}

              {canEndorse && (
                <button
                  onClick={handleEndorse}
                  disabled={endorsing}
                  className={`btn btn-sm ${hasEndorsed ? 'btn-ghost' : 'btn-primary'}`}
                  style={{ marginTop: '0.5rem' }}
                  aria-pressed={hasEndorsed}
                  aria-label={hasEndorsed ? `Remove endorsement for ${displayName}` : `Endorse ${displayName}`}
                >
                  {endorsing ? (
                    <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Updating…</>
                  ) : hasEndorsed ? (
                    '✓ Endorsed'
                  ) : (
                    'Endorse'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Specialties */}
          {profile.specialties && profile.specialties.length > 0 && (
            <section aria-label="Specialties" style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.1rem', marginBottom: '0.625rem' }}>
                Specialties
              </h2>
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {profile.specialties.map((s, i) => (
                  <li key={i}><span className="tag tag-blue">{s}</span></li>
                ))}
              </ul>
            </section>
          )}

          {/* Bio */}
          {profile.bio && (
            <section aria-label="About" style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                About
              </h2>
              <p style={{ color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{profile.bio}</p>
            </section>
          )}

          {/* Brag section */}
          {((profile.certifications && profile.certifications.length > 0) || profile.languages?.length) && (
            <section aria-label="Credentials and languages" style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.1rem', marginBottom: '0.625rem' }}>
                Brag About Yourself!
              </h2>
              {profile.certifications && profile.certifications.length > 0 && (
                <div style={{ marginBottom: '0.625rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                    Credentials &amp; Certifications
                  </p>
                  <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                    {profile.certifications.map((c, i) => (
                      <li key={i}><span className="tag tag-yellow">{c}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                    Languages
                  </p>
                  <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                    {profile.languages.map((l, i) => (
                      <li key={i}><span className="tag tag-gray">{l}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Content creator captioning */}
          {profile.has_captioning != null && profile.specialties?.includes('Content Creator') && (
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              {profile.has_captioning
                ? '✓ Content includes captions'
                : 'Content does not currently include captions'}
            </p>
          )}

          {/* Contact info — members only */}
          {currentUser && (
            <section aria-label="Contact information" style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.1rem', marginBottom: '0.625rem' }}>
                Contact
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <li>
                  <a href={`mailto:${profile.email}`} style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                    {profile.email}
                  </a>
                </li>
                {profile.phone && (
                  <li>
                    <a href={`tel:${profile.phone}`} style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      {profile.phone}
                    </a>
                  </li>
                )}
                {profile.website && (
                  <li>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      Website
                    </a>
                  </li>
                )}
                {profile.linkedin_url && (
                  <li>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      LinkedIn
                    </a>
                  </li>
                )}
                {profile.instagram_url && (
                  <li>
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {!currentUser && (
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <Link href="/login" style={{ color: 'var(--aac-blue)', fontWeight: 600, textDecoration: 'underline' }}>
                Log in
              </Link>{' '}
              to see full contact information.
            </div>
          )}
        </div>

        {/* Endorsements */}
        <div className="content-card">
          <h2 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.35rem', marginBottom: '1rem' }}>
            Endorsements
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
              ({endorsements.length})
            </span>
          </h2>

          {endorsements.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {endorsements.map((e) => {
                const eName = e.endorser.display_name || e.endorser.full_name;
                return (
                  <li key={e.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Link href={`/profile/${e.endorser.id}`} aria-label={`View ${eName}'s profile`}>
                      <div className="member-avatar" style={{ width: 44, height: 44, minWidth: 44, fontSize: '1.1rem', textDecoration: 'none' }} aria-hidden="true">
                        {e.endorser.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.endorser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          eName.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Link>
                    <div>
                      <Link href={`/profile/${e.endorser.id}`} style={{ fontWeight: 600, color: 'var(--aac-blue)', textDecoration: 'none' }}>
                        {eName}
                      </Link>
                      {e.note && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', margin: '0.25rem 0 0' }}>{e.note}</p>}
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.2rem 0 0' }}>
                        {new Date(e.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: 'var(--color-text-muted)' }}>No endorsements yet.</p>
          )}
        </div>

        {/* Back links */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/directory" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', textDecoration: 'underline' }}>
            ← Public Directory
          </Link>
          {currentUser && (
            <Link href="/members" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', textDecoration: 'underline' }}>
              Member Directory →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
