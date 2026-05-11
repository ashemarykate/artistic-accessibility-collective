'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [photoFormOpen, setPhotoFormOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [photoAlt, setPhotoAlt] = useState('');
  const [photoAltError, setPhotoAltError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const photoAltRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Photo must be under 5MB.');
      return;
    }
    setUploadError('');
    setPendingFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingPreview(reader.result as string);
      setTimeout(() => photoAltRef.current?.focus(), 0);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoSave = async () => {
    if (!pendingFile || !profile) return;
    if (!photoAlt.trim()) {
      setPhotoAltError('Please describe yourself in this photo — this helps screen reader users.');
      photoAltRef.current?.focus();
      return;
    }
    setPhotoAltError('');
    setUploading(true);
    try {
      const ext = pendingFile.name.split('.').pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, pendingFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, avatar_alt: photoAlt.trim() })
        .eq('id', profile.id);
      if (updateErr) throw updateErr;
      setPhotoFormOpen(false);
      setPendingFile(null);
      setPendingPreview(null);
      setPhotoAlt('');
      await fetchData();
    } catch (err) {
      console.error('Photo upload error:', err);
      setUploadError('Something went wrong uploading your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const cancelPhotoUpload = () => {
    setPhotoFormOpen(false);
    setPendingFile(null);
    setPendingPreview(null);
    setPhotoAlt('');
    setPhotoAltError('');
    setUploadError('');
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
          <Link href="/collective" className="btn btn-primary">
            ← Browse Members
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
          {currentUser && <Link href="/collective" className="nav-link">The Collective</Link>}
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div className="member-avatar member-avatar-lg">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.avatar_alt || `Photo of ${displayName}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span aria-hidden="true">{initial}</span>
                )}
              </div>

              {isOwnProfile && !photoFormOpen && (
                <button
                  onClick={() => setPhotoFormOpen(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem' }}
                >
                  {profile.avatar_url ? 'Change photo' : '+ Add photo'}
                </button>
              )}

              {isOwnProfile && photoFormOpen && (
                <div style={{ width: 200, marginTop: '0.25rem' }}>
                  {!pendingPreview ? (
                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <span className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem', display: 'block', textAlign: 'center' }}>
                        Choose photo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="sr-only"
                        aria-label="Choose a photo to upload"
                      />
                    </label>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pendingPreview}
                        alt="Preview of your chosen photo"
                        style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: '50%', display: 'block', margin: '0 auto 0.75rem' }}
                      />
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label htmlFor="photo-alt" className="form-label" style={{ fontSize: '0.8125rem' }}>
                          Describe yourself in this photo <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                          This description is read aloud by screen readers.
                        </p>
                        <input
                          id="photo-alt"
                          ref={photoAltRef}
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.875rem' }}
                          value={photoAlt}
                          onChange={(e) => setPhotoAlt(e.target.value)}
                          aria-required="true"
                          aria-invalid={!!photoAltError}
                          aria-describedby={photoAltError ? 'photo-alt-error' : undefined}
                          placeholder="e.g. smiling in a blue jacket outdoors"
                        />
                        {photoAltError && (
                          <p id="photo-alt-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                            {photoAltError}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {uploadError && (
                    <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                      {uploadError}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                    {pendingPreview && (
                      <button
                        onClick={handlePhotoSave}
                        disabled={uploading}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        {uploading ? (
                          <><span className="spinner" aria-hidden="true" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving…</>
                        ) : 'Save photo'}
                      </button>
                    )}
                    <button
                      onClick={cancelPhotoUpload}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.8125rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
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
          {currentUser && (
            <Link href="/collective" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', textDecoration: 'underline' }}>
              ← The Collective
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
