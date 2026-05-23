'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Profile, type Endorsement, REQUIRED_PROFILE_VERSION, profileHref } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type EndorsementWithProfile = Endorsement & { endorser: Profile };

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;

// Returns true if a hex color is dark enough to need white text on top of it.
function isDark(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

// Myspace-era section accent colors — each section gets its own personality.
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
  color: string;
  emoji?: string;
  title: string;
  children: React.ReactNode;
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
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const params  = useParams();
  const router  = useRouter();
  const slug    = params.username as string; // may be a vanity username OR a UUID (fallback)

  const [profile,            setProfile]            = useState<Profile | null>(null);
  const [endorsements,       setEndorsements]        = useState<EndorsementWithProfile[]>([]);
  const [currentUser,        setCurrentUser]         = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile]  = useState<Profile | null>(null);
  const [loading,            setLoading]             = useState(true);
  const [endorsing,          setEndorsing]           = useState(false);
  const [hasEndorsed,        setHasEndorsed]         = useState(false);

  // Username setup state
  const [usernameFormOpen,    setUsernameFormOpen]    = useState(false);
  const [usernameInput,       setUsernameInput]       = useState('');
  const [usernameAvailable,   setUsernameAvailable]   = useState<boolean | null>(null);
  const [usernameChecking,    setUsernameChecking]     = useState(false);
  const [usernameSaving,      setUsernameSaving]       = useState(false);
  const [usernameError,       setUsernameError]       = useState('');
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // Photo upload state
  const [photoFormOpen,  setPhotoFormOpen]  = useState(false);
  const [pendingFile,    setPendingFile]    = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [photoAlt,       setPhotoAlt]       = useState('');
  const [photoAltError,  setPhotoAltError]  = useState('');
  const [uploading,      setUploading]      = useState(false);
  const [uploadError,    setUploadError]    = useState('');
  const photoAltRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Profile — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => { fetchData(); }, [slug]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: up } = await supabase
          .from('profiles').select('*')
          .eq('user_id', user.id).eq('status', 'approved').single();
        setCurrentUserProfile(up);
      }

      // Try by vanity username first, fall back to UUID so old links keep working.
      let { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', slug).maybeSingle();
      if (!profileData) {
        const { data: byId } = await supabase
          .from('profiles').select('*').eq('id', slug).maybeSingle();
        profileData = byId;
      }
      if (!profileData) throw new Error('Profile not found');
      setProfile(profileData);

      // Redirect to canonical username URL if we loaded via UUID and username exists
      if (profileData.username && slug !== profileData.username) {
        router.replace(`/profile/${profileData.username}`);
        return;
      }

      const { data: endorsementsData, error: endorsementsError } = await supabase
        .from('endorsements')
        .select('*, endorser:profiles!endorser_id(*)')
        .eq('endorsed_id', profileData.id);
      if (endorsementsError) throw endorsementsError;
      setEndorsements(endorsementsData as EndorsementWithProfile[]);

      if (user && endorsementsData) {
        const { data: up2 } = await supabase
          .from('profiles').select('id').eq('user_id', user.id).single();
        if (up2) {
          setHasEndorsed(endorsementsData.some((e: any) => e.endorser_id === up2.id));
        }
      }
      // Auto-open username form if this is the member's own profile and they haven't set one
      if (profileData && !profileData.username) {
        setUsernameFormOpen(true);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async () => {
    if (!currentUserProfile || !profile) { router.push('/login'); return; }
    setEndorsing(true);
    try {
      if (hasEndorsed) {
        await supabase.from('endorsements').delete()
          .eq('endorser_id', currentUserProfile.id).eq('endorsed_id', profile.id);
      } else {
        await supabase.from('endorsements')
          .insert({ endorser_id: currentUserProfile.id, endorsed_id: profile.id });
      }
      await fetchData();
    } catch (err) {
      console.error('Error toggling endorsement:', err);
    } finally {
      setEndorsing(false);
    }
  };

  // Username availability check

  const checkUsername = async (value: string) => {
    if (!value || !USERNAME_RE.test(value)) { setUsernameAvailable(null); return; }
    setUsernameChecking(true);
    const { data } = await supabase
      .from('profiles').select('id').eq('username', value).maybeSingle();
    setUsernameAvailable(!data);
    setUsernameChecking(false);
  };

  const handleUsernameChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsernameInput(clean);
    setUsernameError('');
    setUsernameAvailable(null);
    // Debounce the availability check
    clearTimeout((handleUsernameChange as any)._t);
    (handleUsernameChange as any)._t = setTimeout(() => checkUsername(clean), 500);
  };

  const handleUsernameSave = async () => {
    if (!profile) return;
    if (!USERNAME_RE.test(usernameInput)) {
      setUsernameError('3–30 characters, lowercase letters, numbers, hyphens, underscores only.');
      return;
    }
    if (usernameAvailable === false) {
      setUsernameError('That username is already taken — try another.');
      return;
    }
    setUsernameSaving(true);
    const { error } = await supabase
      .from('profiles').update({ username: usernameInput }).eq('id', profile.id);
    if (error) {
      setUsernameError('Something went wrong. Please try again.');
      setUsernameSaving(false);
      return;
    }
    setUsernameFormOpen(false);
    router.replace(`/profile/${usernameInput}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setUploadError('Photo must be under 5MB.'); return; }
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
      const ext  = pendingFile.name.split('.').pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('profile-photos').upload(path, pendingFile, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from('profiles').update({ avatar_url: publicUrl, avatar_alt: photoAlt.trim() }).eq('id', profile.id);
      if (updateErr) throw updateErr;
      setPhotoFormOpen(false); setPendingFile(null); setPendingPreview(null); setPhotoAlt('');
      await fetchData();
    } catch (err) {
      console.error('Photo upload error:', err);
      setUploadError('Something went wrong uploading your photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const cancelPhotoUpload = () => {
    setPhotoFormOpen(false); setPendingFile(null); setPendingPreview(null);
    setPhotoAlt(''); setPhotoAltError(''); setUploadError('');
  };

  // ── Loading / not-found guards ───────────────────────────────────────────
  if (loading) {
    return (
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading profile">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading profile…</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', minHeight: '100vh' }}>
        <div className="content-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h1 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.75rem', marginBottom: '1rem' }}>
            Profile Not Found
          </h1>
          <Link href="/collective" className="btn btn-primary">← Browse Members</Link>
        </div>
      </main>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const isOwnProfile    = currentUserProfile?.id === profile.id;
  const canEndorse      = !!(currentUserProfile && !isOwnProfile);
  const needsVersionUpdate = isOwnProfile && (profile.profile_version ?? 1) < REQUIRED_PROFILE_VERSION;
  const displayName     = profile.display_name || profile.full_name;
  const initial         = displayName.charAt(0).toUpperCase();

  // Background & contrast
  const bgColor  = profile.profile_bg_color || '#263590';
  const darkBg   = isDark(bgColor);
  const onBgText = darkBg ? '#ffffff' : '#111111';

  // Top 8: first 8 endorsers (manual pinning comes in Phase 2)
  const top8 = endorsements.slice(0, 8);

  const locationParts = [profile.location_city, profile.location_state].filter(Boolean);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main style={{ background: bgColor, minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* ── Header bar ── */}
      <header className="site-header">
        <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-across-blue-bg.svg" alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {currentUser  && <Link href="/collective" className="nav-link">The Collective</Link>}
          {currentUser  && <Link href="/feedback"   className="nav-link">Share Feedback</Link>}
          {!currentUser && <Link href="/login"      className="nav-link">Log In</Link>}
        </nav>
      </header>

      {/* ── Profile grid ── */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '1.5rem 1rem',
        display: 'flex',
        gap: '1.25rem',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>

        {/* ══════════════════════════════════════════
            LEFT SIDEBAR
        ══════════════════════════════════════════ */}
        <aside
          aria-label="Profile info"
          style={{ width: '268px', minWidth: '268px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >

          {/* ── Profile photo card ── */}
          <div className="content-card" style={{ padding: '1rem' }}>

            {/* Square photo with coloured border */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                border: `5px solid ${bgColor}`,
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '0.75rem',
                background: 'var(--aac-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.avatar_alt || `Photo of ${displayName}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span
                  aria-hidden="true"
                  style={{ fontSize: '5rem', fontWeight: 700, color: 'var(--aac-blue)', lineHeight: 1 }}
                >
                  {initial}
                </span>
              )}
            </div>

            {/* ── Username / profile URL setup ── */}
            {isOwnProfile && (
              <div style={{ marginBottom: '0.75rem' }}>
                {!usernameFormOpen ? (
                  <div style={{ background: 'var(--aac-blue-light)', borderRadius: '6px', padding: '0.625rem 0.75rem', fontSize: '0.8125rem' }}>
                    {profile.username ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                          /profile/<strong style={{ color: 'var(--aac-blue)' }}>{profile.username}</strong>
                        </span>
                        <button
                          onClick={() => { setUsernameInput(profile.username ?? ''); setUsernameFormOpen(true); setTimeout(() => usernameInputRef.current?.focus(), 0); }}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setUsernameFormOpen(true); setTimeout(() => usernameInputRef.current?.focus(), 0); }}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', fontSize: '0.8125rem' }}
                      >
                        ✏️ Set your profile URL
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ background: 'var(--aac-blue-light)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.8125rem' }}>
                    <label htmlFor="username-input" className="form-label" style={{ fontSize: '0.8125rem', marginBottom: '0.375rem', display: 'block' }}>
                      Choose your profile URL
                    </label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      3–30 characters. Letters, numbers, hyphens, underscores.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d1d5db', borderRadius: '5px', padding: '0.375rem 0.5rem', marginBottom: '0.375rem', gap: '0.25rem' }}>
                      <span style={{ color: 'var(--color-text-muted)', userSelect: 'none', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>/profile/</span>
                      <input
                        id="username-input"
                        ref={usernameInputRef}
                        type="text"
                        value={usernameInput}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="your-name"
                        maxLength={30}
                        style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.875rem', minWidth: 0 }}
                        aria-describedby={usernameError ? 'username-error' : 'username-hint'}
                        aria-invalid={!!usernameError || usernameAvailable === false}
                      />
                    </div>

                    {/* Availability feedback */}
                    {usernameInput.length >= 3 && (
                      <p
                        id="username-hint"
                        aria-live="polite"
                        style={{
                          fontSize: '0.75rem',
                          marginBottom: '0.375rem',
                          color: usernameChecking
                            ? 'var(--color-text-muted)'
                            : usernameAvailable === true
                            ? '#059669'
                            : usernameAvailable === false
                            ? 'var(--color-error)'
                            : 'var(--color-text-muted)',
                        }}
                      >
                        {usernameChecking
                          ? 'Checking…'
                          : usernameAvailable === true
                          ? '✓ Available!'
                          : usernameAvailable === false
                          ? '✗ Already taken'
                          : ''}
                      </p>
                    )}

                    {usernameError && (
                      <p id="username-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginBottom: '0.375rem' }}>
                        {usernameError}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        onClick={handleUsernameSave}
                        disabled={usernameSaving || usernameAvailable === false || !usernameInput || !USERNAME_RE.test(usernameInput)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.8rem', flex: 1 }}
                      >
                        {usernameSaving ? 'Saving…' : 'Save'}
                      </button>
                      {profile.username && (
                        <button onClick={() => setUsernameFormOpen(false)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photo upload controls */}
            {isOwnProfile && !photoFormOpen && (
              <button
                onClick={() => setPhotoFormOpen(true)}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.8125rem' }}
              >
                {profile.avatar_url ? 'Change photo' : '+ Add photo'}
              </button>
            )}

            {isOwnProfile && photoFormOpen && (
              <div style={{ marginBottom: '0.75rem' }}>
                {!pendingPreview ? (
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <span className="btn btn-ghost btn-sm" style={{ display: 'block', textAlign: 'center', fontSize: '0.8125rem' }}>
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
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, display: 'block', margin: '0 auto 0.625rem' }}
                    />
                    <div className="form-group" style={{ marginBottom: '0.625rem' }}>
                      <label htmlFor="photo-alt" className="form-label" style={{ fontSize: '0.8125rem' }}>
                        Describe this photo <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
                      </label>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem', lineHeight: 1.5 }}>
                        1–2 sentences: what you look like, your expression, where you are.
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
                    <button onClick={handlePhotoSave} disabled={uploading} className="btn btn-primary btn-sm" style={{ fontSize: '0.8125rem' }}>
                      {uploading ? <><span className="spinner" aria-hidden="true" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving…</> : 'Save'}
                    </button>
                  )}
                  <button onClick={cancelPhotoUpload} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8125rem' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Name & pronouns */}
            <h1 className="font-display" style={{ color: 'var(--aac-navy)', fontSize: '1.375rem', lineHeight: 1.2, marginBottom: '0.25rem' }}>
              {displayName}
            </h1>
            {profile.pronouns && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {profile.pronouns}
              </p>
            )}
            {locationParts.length > 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span aria-hidden="true">📍 </span>
                {locationParts.join(', ')}
                {profile.willing_to_travel && ' · Will travel'}
              </p>
            )}

            {/* Stats box */}
            <div
              style={{
                background: 'var(--aac-blue-light)',
                borderRadius: '6px',
                padding: '0.625rem 0.75rem',
                margin: '0.75rem 0',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              <div>
                <strong style={{ color: 'var(--color-text)' }}>Member since</strong>{' '}
                {new Date(profile.created_at).getFullYear()}
              </div>
              <div>
                <strong style={{ color: 'var(--color-text)' }}>{endorsements.length}</strong>{' '}
                endorsement{endorsements.length !== 1 ? 's' : ''}
              </div>
              {profile.years_of_experience != null && (
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>{profile.years_of_experience}</strong>{' '}
                  yr{profile.years_of_experience !== 1 ? 's' : ''} experience
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {canEndorse && (
                <button
                  onClick={handleEndorse}
                  disabled={endorsing}
                  className={`btn btn-sm ${hasEndorsed ? 'btn-ghost' : 'btn-primary'}`}
                  style={{ width: '100%' }}
                  aria-pressed={hasEndorsed}
                  aria-label={hasEndorsed ? `Remove endorsement for ${displayName}` : `Endorse ${displayName}`}
                >
                  {endorsing
                    ? <><span className="spinner" aria-hidden="true" style={{ width: 14, height: 14, borderWidth: 2 }} /> Updating…</>
                    : hasEndorsed ? '✓ Endorsed' : '⭐ Endorse'
                  }
                </button>
              )}
              {currentUser && !isOwnProfile && (
                <button
                  disabled
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', opacity: 0.55 }}
                  aria-disabled="true"
                >
                  💬 Message <span style={{ fontSize: '0.75rem' }}>(coming soon)</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Contact card (members only) ── */}
          {currentUser && (profile.email || profile.website || profile.linkedin_url || profile.instagram_url) && (
            <div className="content-card" style={{ padding: '1rem' }}>
              <h2
                className="font-display"
                style={{
                  color: S.contact,
                  fontSize: '1rem',
                  marginBottom: '0.625rem',
                  paddingBottom: '0.375rem',
                  borderBottom: `2px solid ${S.contact}`,
                }}
              >
                Contact
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
                {profile.email_public !== false && (
                  <li>
                    <a href={`mailto:${profile.email}`} style={{ color: 'var(--aac-blue)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                      ✉️ {profile.email}
                    </a>
                  </li>
                )}
                {profile.phone && (
                  <li>
                    <a href={`tel:${profile.phone}`} style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      📞 {profile.phone}
                    </a>
                  </li>
                )}
                {profile.website && (
                  <li>
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      🌐 Website
                    </a>
                  </li>
                )}
                {profile.linkedin_url && (
                  <li>
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      💼 LinkedIn
                    </a>
                  </li>
                )}
                {profile.instagram_url && (
                  <li>
                    <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                      📸 Instagram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {!currentUser && (
            <div className="content-card" style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              <Link href="/login" style={{ color: 'var(--aac-blue)', fontWeight: 600, textDecoration: 'underline' }}>
                Log in
              </Link>{' '}
              to see contact info and message {displayName}.
            </div>
          )}

          {/* ── Back link ── */}
          {currentUser && (
            <Link
              href="/collective"
              style={{ color: onBgText, opacity: 0.75, fontSize: '0.9rem', textDecoration: 'underline', display: 'inline-block', paddingTop: '0.25rem' }}
            >
              ← The Collective
            </Link>
          )}
        </aside>

        {/* ══════════════════════════════════════════
            RIGHT MAIN CONTENT
        ══════════════════════════════════════════ */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Profile version update banner */}
          {needsVersionUpdate && (
            <div className="alert alert-warning" role="alert">
              <strong>Your profile has new fields available.</strong>{' '}
              <Link href={`${profileHref(profile)}/edit`} style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>
                Update your profile
              </Link>{' '}
              to make sure everything is current.
            </div>
          )}

          {/* ── Highlights ── */}
          {profile.highlights && (
            <SectionCard color={S.highlights} emoji="✨" title="Highlights">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: 'var(--color-text)' }}>
                {profile.highlights}
              </p>
            </SectionCard>
          )}

          {/* ── About Me ── */}
          {profile.bio && (
            <SectionCard color={S.about} title="About Me">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: 'var(--color-text)' }}>
                {profile.bio}
              </p>
            </SectionCard>
          )}

          {/* ── What I Do ── */}
          {profile.specialties && profile.specialties.length > 0 && (
            <SectionCard color={S.whatIDo} title="What I Do">
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {profile.specialties.map((s, i) => (
                  <li key={i}><span className="tag tag-blue">{s}</span></li>
                ))}
              </ul>
              {profile.has_captioning != null && profile.specialties.includes('Content Creator') && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  {profile.has_captioning ? '✓ Content includes captions' : 'Content does not currently include captions'}
                </p>
              )}
            </SectionCard>
          )}

          {/* ── Top 8 ── */}
          <SectionCard color={S.top8} title="Top 8">
            {top8.length > 0 ? (
              <>
                {/* Screen reader summary */}
                <p className="sr-only">
                  {displayName}&apos;s top endorsers: {top8.map(e => e.endorser.display_name || e.endorser.full_name).join(', ')}.
                </p>

                <ul
                  aria-hidden="true"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {top8.map((e) => {
                    const eName = e.endorser.display_name || e.endorser.full_name;
                    const eInit  = eName.charAt(0).toUpperCase();
                    return (
                      <li key={e.id} style={{ textAlign: 'center' }}>
                        <Link href={profileHref(e.endorser)} tabIndex={0} aria-label={`View ${eName}'s profile`} style={{ textDecoration: 'none', display: 'block' }}>
                          <div
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              border: '2px solid #e5e7eb',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              marginBottom: '0.375rem',
                              background: 'var(--aac-blue-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {e.endorser.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={e.endorser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--aac-blue)' }}>
                                {eInit}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--aac-blue)', fontWeight: 600, display: 'block', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {eName.split(' ')[0]}
                          </span>
                        </Link>
                      </li>
                    );
                  })}

                  {/* Empty placeholder slots */}
                  {Array.from({ length: Math.max(0, 8 - top8.length) }).map((_, i) => (
                    <li key={`empty-${i}`} aria-hidden="true" style={{ textAlign: 'center' }}>
                      <div style={{ width: '100%', aspectRatio: '1 / 1', border: '2px dashed #d1d5db', borderRadius: '4px', background: '#f9fafb', marginBottom: '0.375rem' }} />
                      <span style={{ fontSize: '0.75rem', color: '#d1d5db' }}>—</span>
                    </li>
                  ))}
                </ul>

                {endorsements.length > 8 && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{ color: S.top8, fontWeight: 600 }}>
                      + {endorsements.length - 8} more endorsement{endorsements.length - 8 !== 1 ? 's' : ''}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                No endorsements yet.{canEndorse && ' Be the first!'}
              </p>
            )}
          </SectionCard>

          {/* ── Videos ── */}
          {profile.video_links && profile.video_links.length > 0 && (
            <SectionCard color={S.videos} emoji="🎬" title="Videos">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {profile.video_links.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem 0.875rem',
                        background: '#fef3c7',
                        borderRadius: '6px',
                        color: S.videos,
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>▶</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {url.replace(/^https?:\/\/(www\.)?/, '')}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ── Trainings & Certifications ── */}
          {profile.certifications && profile.certifications.length > 0 && (
            <SectionCard color={S.certs} emoji="📚" title="Trainings &amp; Certifications">
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {profile.certifications.map((c, i) => (
                  <li key={i}><span className="tag tag-yellow">{c}</span></li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ── Activities & Interests ── */}
          {profile.activities && profile.activities.length > 0 && (
            <SectionCard color={S.activities} emoji="🎵" title="Activities &amp; Interests">
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {profile.activities.map((a, i) => (
                  <li key={i}>
                    <span
                      className="tag"
                      style={{ background: '#fce7f3', color: '#9d174d', border: '1px solid #f9a8d4' }}
                    >
                      {a}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ── Languages ── */}
          {profile.languages && profile.languages.length > 0 && (
            <SectionCard color={S.languages} title="Languages">
              <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {profile.languages.map((l, i) => (
                  <li key={i}><span className="tag tag-gray">{l}</span></li>
                ))}
              </ul>
            </SectionCard>
          )}

        </div>{/* end right main */}
      </div>{/* end profile grid */}
    </main>
  );
}
