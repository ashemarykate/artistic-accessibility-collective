'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, type Profile, type Endorsement, REQUIRED_PROFILE_VERSION, profileHref } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

type EndorsementWithEndorser = Endorsement & { endorser: Profile };

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  return (
    { student: 'Student', entry: 'Entry Level', mid: 'Mid Level', seasoned: 'Seasoned Professional' }[level] ?? level
  );
}

// ── MsBox ────────────────────────────────────────────────────────────────────

function MsBox({
  header,
  headerEl,
  action,
  children,
}: {
  header?: string;
  headerEl?: React.ReactNode;
  action?: { label: string; onClick?: () => void; href?: string; srLabel?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="ms-box">
      <div className="ms-box-header">
        <span>{headerEl ?? header}</span>
        {action && (
          action.href ? (
            <a href={action.href} target={action.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
              [{action.label}]
              {action.srLabel && <span className="sr-only">{action.srLabel}</span>}
            </a>
          ) : action.onClick ? (
            <button
              onClick={action.onClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0 }}
            >
              [{action.label}]
              {action.srLabel && <span className="sr-only">{action.srLabel}</span>}
            </button>
          ) : null
        )}
      </div>
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug   = params.username as string;

  const [profile,            setProfile]            = useState<Profile | null>(null);
  const [endorsements,       setEndorsements]        = useState<EndorsementWithEndorser[]>([]);
  const [goTos,              setGoTos]               = useState<Profile[]>([]);
  const [currentUser,        setCurrentUser]         = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile]  = useState<Profile | null>(null);
  const [isProfileAdmin,     setIsProfileAdmin]      = useState(false);
  const [loading,            setLoading]             = useState(true);
  const [endorsing,          setEndorsing]           = useState(false);
  const [hasEndorsed,        setHasEndorsed]         = useState(false);

  // Username setup state
  const [usernameFormOpen,  setUsernameFormOpen]  = useState(false);
  const [usernameInput,     setUsernameInput]     = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking,  setUsernameChecking]  = useState(false);
  const [usernameSaving,    setUsernameSaving]    = useState(false);
  const [usernameError,     setUsernameError]     = useState('');
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

  useEffect(() => { fetchData(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCurrentUser(user);

      const { data: up } = await supabase
        .from('profiles').select('*').eq('user_id', user.id).eq('status', 'approved').single();
      setCurrentUserProfile(up);

      // Try vanity username first, fall back to UUID.
      let { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', slug).maybeSingle();
      if (!profileData) {
        const { data: byId } = await supabase
          .from('profiles').select('*').eq('id', slug).maybeSingle();
        profileData = byId;
      }
      if (!profileData) throw new Error('Profile not found');
      setProfile(profileData);

      // Check whether this profile belongs to an admin
      if (profileData.user_id) {
        const { data: adminRow } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', profileData.user_id)
          .maybeSingle();
        setIsProfileAdmin(!!adminRow);
      }

      // Redirect to canonical username URL if loaded via UUID
      if (profileData.username && slug !== profileData.username) {
        router.replace(`/profile/${profileData.username}`);
        return;
      }

      // People who have endorsed this profile ("People Who Love To Work With Me")
      const { data: endorsementsData } = await supabase
        .from('endorsements')
        .select('*, endorser:profiles!endorser_id(*)')
        .eq('endorsed_id', profileData.id);
      setEndorsements((endorsementsData ?? []) as EndorsementWithEndorser[]);

      // Profiles this person has endorsed ("Go-To's")
      const { data: goToData } = await supabase
        .from('endorsements')
        .select('*, endorsed:profiles!endorsed_id(*)')
        .eq('endorser_id', profileData.id);
      setGoTos(((goToData ?? []) as any[]).map((e) => e.endorsed).filter(Boolean));

      // Has current user already endorsed this profile?
      if (user && endorsementsData) {
        const { data: up2 } = await supabase
          .from('profiles').select('id').eq('user_id', user.id).single();
        if (up2) {
          setHasEndorsed(endorsementsData.some((e: any) => e.endorser_id === up2.id));
        }
      }

      // Auto-open username form if own profile and no username set yet
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
      <BrowserChrome variant="aol" title="Member Profile — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/profile">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading profile">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading profile…</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  if (!profile) {
    return (
      <BrowserChrome variant="aol" title="Profile Not Found — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/profile">
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', minHeight: '100%' }}>
        <div className="content-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.5rem', marginBottom: '1rem' }}>
            Profile Not Found
          </h1>
          <Link href="/members" className="btn btn-primary">← Browse Members</Link>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  // ── Derived values ───────────────────────────────────────────────────────

  const isOwnProfile       = currentUserProfile?.id === profile.id;
  const canEndorse         = !!(currentUserProfile && !isOwnProfile);
  const needsVersionUpdate = isOwnProfile && (profile.profile_version ?? 1) < REQUIRED_PROFILE_VERSION;
  const displayName        = profile.display_name || profile.full_name;
  const firstName          = displayName.split(' ')[0];
  const initial            = displayName.charAt(0).toUpperCase();
  const bgColor            = profile.profile_bg_color || '#263590';
  const lovedByCount       = endorsements.length;
  const lovedByPreview     = endorsements.slice(0, 3);
  const goTosPreview       = goTos.slice(0, 6);
  const endorsementsWithNotes = endorsements.filter(e => e.note);
  const availStatus        = profile.availability_status || 'By Inquiry';
  const expLevel           = profile.experience_level || 'entry';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <BrowserChrome variant="aol" title={`${displayName} — Artistic Accessibility Collective`} url={`http://members.artisticaccessibility.com/profile/${profile.username || profile.id}`}>
    <main style={{ background: bgColor, minHeight: '100%', paddingBottom: '24px' }}>

      {/* ── Header ── */}
      <header>
        <div className="site-header">
          <Link href="/" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-across-blue-bg.svg" alt="" />
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            {currentUser  && <Link href="/members" className="nav-link">Members</Link>}
            {currentUser  && <Link href="/feedback"   className="nav-link">Share Feedback</Link>}
            {!currentUser && <Link href="/directory"  className="nav-link">Directory</Link>}
            {!currentUser && <Link href="/login"      className="nav-link">Log In</Link>}
          </nav>
        </div>
      </header>

      {/* ── Profile version update banner ── */}
      {needsVersionUpdate && (
        <div role="alert" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.8125rem', textAlign: 'center', padding: '6px 12px', borderBottom: '1px solid #fcd34d' }}>
          <strong>Your profile has new fields available.</strong>{' '}
          <Link href={`${profileHref(profile)}/edit`} style={{ color: 'inherit', textDecoration: 'underline', fontWeight: 600 }}>
            Update your profile →
          </Link>
        </div>
      )}

      {/* ── Profile grid ── */}
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '12px 10px', display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ════════════════════════════════════
            LEFT SIDEBAR
        ════════════════════════════════════ */}
        <aside aria-label="Profile sidebar" style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}>

          {/* ── Photo + basic info ── */}
          <MsBox
            headerEl={
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {displayName}
                {isProfileAdmin ? (
                  <span className="ms-admin-badge" aria-label="Admin">✦ Admin</span>
                ) : (
                  <span className="ms-member-badge" aria-label="Member">✨ Member</span>
                )}
                {profile.is_student && (
                  <span className="ms-student-badge" aria-label="Student member">🎓 Student</span>
                )}
              </span>
            }
            action={isOwnProfile ? { label: 'edit profile', href: `${profileHref(profile)}/edit` } : undefined}
          >
            <div style={{ padding: '8px' }}>

              {/* Square photo */}
              <div style={{ width: '100%', aspectRatio: '1/1', border: '2px solid #fff', outline: '1px solid var(--ms-border)', overflow: 'hidden', background: 'var(--aac-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                {pendingPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pendingPreview} alt="Preview of your chosen photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.avatar_alt || `Photo of ${displayName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span aria-hidden="true" style={{ fontSize: '5rem', fontWeight: 700, color: 'var(--aac-blue)', lineHeight: 1 }}>
                    {initial}
                  </span>
                )}
              </div>

              {/* Photo upload controls */}
              {isOwnProfile && !photoFormOpen && (
                <button
                  onClick={() => setPhotoFormOpen(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', marginBottom: '6px', fontSize: '0.75rem' }}
                >
                  {profile.avatar_url ? 'Change photo' : '+ Add photo'}
                </button>
              )}

              {isOwnProfile && photoFormOpen && (
                <div style={{ marginBottom: '8px', padding: '6px', background: 'var(--aac-blue-light)', border: '1px solid var(--ms-border)' }}>
                  {!pendingPreview ? (
                    <label style={{ display: 'block', cursor: 'pointer' }}>
                      <span className="btn btn-ghost btn-sm" style={{ display: 'block', textAlign: 'center', fontSize: '0.75rem' }}>
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
                    <div className="form-group" style={{ marginBottom: '6px' }}>
                      <label htmlFor="photo-alt" className="form-label" style={{ fontSize: '0.75rem' }}>
                        Describe this photo <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
                      </label>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px', lineHeight: 1.4 }}>
                        1–2 sentences describing what you look like in the photo.
                      </p>
                      <input
                        id="photo-alt"
                        ref={photoAltRef}
                        type="text"
                        className="form-input"
                        style={{ fontSize: '0.8125rem' }}
                        value={photoAlt}
                        onChange={(e) => setPhotoAlt(e.target.value)}
                        aria-required="true"
                        aria-invalid={!!photoAltError}
                        aria-describedby={photoAltError ? 'photo-alt-error' : undefined}
                        placeholder="e.g. smiling in a blue jacket outdoors"
                      />
                      {photoAltError && (
                        <p id="photo-alt-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '3px' }}>
                          {photoAltError}
                        </p>
                      )}
                    </div>
                  )}
                  {uploadError && (
                    <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginBottom: '4px' }}>
                      {uploadError}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {pendingPreview && (
                      <button onClick={handlePhotoSave} disabled={uploading} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', flex: 1 }}>
                        {uploading ? 'Saving…' : 'Save photo'}
                      </button>
                    )}
                    <button onClick={cancelPhotoUpload} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', flex: 1 }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Availability badge */}
              <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                <span className={availClass(availStatus)}>
                  <span aria-hidden="true">{availDot(availStatus)}</span>
                  {availStatus}
                </span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <span className="ms-level-badge" aria-label={`Experience level: ${levelLabel(expLevel)}`}>
                  {levelLabel(expLevel)}
                </span>
              </div>

              {profile.pronouns && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>{profile.pronouns}</p>
              )}
              {(profile.location_city || profile.location_state) && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                  <span aria-hidden="true">📍 </span>
                  {[profile.location_city, profile.location_state].filter(Boolean).join(', ')}
                  {profile.willing_to_travel && ' · Will travel'}
                </p>
              )}
              {profile.timezone && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0' }}>
                  <span aria-hidden="true">🕐 </span>{profile.timezone}
                </p>
              )}
              {profile.mood && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0' }}>
                  Mood: <em>{profile.mood}</em>
                </p>
              )}

              <div className="ms-stats-row" style={{ marginTop: '8px' }}>
                <div className="ms-stat">
                  <strong>{lovedByCount}</strong>
                  loved by
                </div>
                {profile.years_of_experience != null && (
                  <div className="ms-stat">
                    <strong>{profile.years_of_experience}</strong>
                    yrs exp
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '6px 0 0' }}>
                Member since: <strong>{profile.member_since_display || 'Summer 2026'}</strong>
              </p>
            </div>
          </MsBox>

          {/* ── Contacting ── */}
          <MsBox header={`Contacting ${firstName}`}>
            <div className="ms-action-grid">
              {currentUser && !isOwnProfile ? (
                <Link
                  href={`/messages?to=${profile.id}`}
                  className="ms-action-link"
                  aria-label={`Send ${firstName} a message`}
                >
                  <span className="ms-action-link-icon" aria-hidden="true">✉️</span>
                  Send Message
                </Link>
              ) : !currentUser ? (
                <Link href="/login" className="ms-action-link" aria-label={`Log in to message ${firstName}`}>
                  <span className="ms-action-link-icon" aria-hidden="true">✉️</span>
                  Send Message
                </Link>
              ) : null}

              {canEndorse && (
                <button
                  onClick={handleEndorse}
                  disabled={endorsing}
                  className="ms-action-link"
                  aria-label={hasEndorsed ? `Remove ${firstName} from your Favorites` : `Add ${firstName} to your Favorites`}
                  aria-pressed={hasEndorsed}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                >
                  <span className="ms-action-link-icon" aria-hidden="true">{hasEndorsed ? '★' : '☆'}</span>
                  {endorsing ? 'Updating…' : hasEndorsed ? 'Remove Favorite' : 'Add to Favorites'}
                </button>
              )}

              {profile.work_samples_url && (
                <a
                  href={profile.work_samples_url.startsWith('http') ? profile.work_samples_url : `https://${profile.work_samples_url}`}
                  className="ms-action-link"
                  aria-label={`View ${firstName}'s work samples`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ms-action-link-icon" aria-hidden="true">🎥</span>
                  Work Samples
                </a>
              )}
            </div>
            <div style={{ padding: '4px 8px 6px', borderTop: '1px solid var(--ms-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {profile.preferred_contact && (
                <>Preferred contact: <strong style={{ color: 'var(--aac-blue)' }}>{profile.preferred_contact}</strong></>
              )}
              {profile.communication_style && profile.communication_style.length > 0 && (
                <span> · {profile.communication_style[0]}</span>
              )}
            </div>
          </MsBox>

          {/* ── People Who Love To Work With Me ── */}
          {lovedByCount > 0 && (
            <MsBox
              header="People Who Love To Work With Me"
              action={{ label: `see all ${lovedByCount}`, href: '#', srLabel: ` people who love to work with ${firstName}` }}
            >
              <div style={{ padding: '6px 8px' }}>
                <p className="sr-only">
                  {lovedByPreview.map(e => e.endorser.display_name || e.endorser.full_name).join(', ')}
                  {lovedByCount > 3 && ` and ${lovedByCount - 3} others`} have added {firstName} as a Favorite.
                </p>
                <div aria-hidden="true" style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  {lovedByPreview.map((e) => {
                    const eName  = e.endorser.display_name || e.endorser.full_name;
                    const eInit  = eName.charAt(0).toUpperCase();
                    return (
                      <Link
                        key={e.id}
                        href={profileHref(e.endorser)}
                        tabIndex={-1}
                        aria-hidden="true"
                        style={{ display: 'block', textDecoration: 'none', flex: '1' }}
                      >
                        <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--aac-blue-light)', border: '1px solid var(--ms-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--aac-blue)', overflow: 'hidden' }}>
                          {e.endorser.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.endorser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : eInit}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--aac-blue)', display: 'block', textAlign: 'center', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {eName.split(' ')[0]}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                {/* Accessible nav list */}
                <nav aria-label={`People who love to work with ${firstName}`} style={{ marginBottom: '4px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                    {lovedByPreview.map((e) => {
                      const eName = e.endorser.display_name || e.endorser.full_name;
                      return (
                        <li key={e.id}>
                          <Link href={profileHref(e.endorser)} style={{ fontSize: '0.75rem' }}>⭐ {eName}</Link>
                        </li>
                      );
                    })}
                    {lovedByCount > 3 && (
                      <li><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>+ {lovedByCount - 3} more</span></li>
                    )}
                  </ul>
                </nav>
              </div>
            </MsBox>
          )}

          {/* ── Profile URL ── */}
          {isOwnProfile && (
            <MsBox header="Profile URL:">
              <div className="ms-box-body">
                {!usernameFormOpen ? (
                  <>
                    {profile.username ? (
                      <p className="ms-profile-url">/profile/<strong>{profile.username}</strong></p>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 4px' }}>
                        You don&apos;t have a custom URL yet.
                      </p>
                    )}
                    <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                      <button
                        onClick={() => { setUsernameInput(profile.username ?? ''); setUsernameFormOpen(true); setTimeout(() => usernameInputRef.current?.focus(), 0); }}
                        className="ms-edit-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
                      >
                        [ {profile.username ? 'change URL' : 'set your URL'} ]
                      </button>
                    </p>
                  </>
                ) : (
                  <div>
                    <label htmlFor="username-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '3px' }}>
                      Choose your profile URL
                    </label>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px', lineHeight: 1.4 }}>
                      3–30 chars. Letters, numbers, hyphens, underscores.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #d1d5db', padding: '3px 6px', marginBottom: '3px', gap: '2px' }}>
                      <span style={{ color: 'var(--color-text-muted)', userSelect: 'none', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}>/profile/</span>
                      <input
                        id="username-input"
                        ref={usernameInputRef}
                        type="text"
                        value={usernameInput}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="your-name"
                        maxLength={30}
                        style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.8125rem', minWidth: 0 }}
                        aria-describedby={usernameError ? 'username-error' : 'username-hint'}
                        aria-invalid={!!usernameError || usernameAvailable === false}
                      />
                    </div>
                    {usernameInput.length >= 3 && (
                      <p
                        id="username-hint"
                        aria-live="polite"
                        style={{ fontSize: '0.6875rem', marginBottom: '3px', color: usernameChecking ? 'var(--color-text-muted)' : usernameAvailable === true ? '#059669' : usernameAvailable === false ? 'var(--color-error)' : 'var(--color-text-muted)' }}
                      >
                        {usernameChecking ? 'Checking…' : usernameAvailable === true ? '✓ Available!' : usernameAvailable === false ? '✗ Already taken' : ''}
                      </p>
                    )}
                    {usernameError && (
                      <p id="username-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.6875rem', marginBottom: '3px' }}>
                        {usernameError}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={handleUsernameSave}
                        disabled={usernameSaving || usernameAvailable === false || !usernameInput || !USERNAME_RE.test(usernameInput)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', flex: 1 }}
                      >
                        {usernameSaving ? 'Saving…' : 'Save'}
                      </button>
                      {profile.username && (
                        <button onClick={() => setUsernameFormOpen(false)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </MsBox>
          )}

          {/* ── Interests table ── */}
          {(
            (profile.activities && profile.activities.length > 0) ||
            (profile.fav_books && profile.fav_books.length > 0) ||
            (profile.fav_movies && profile.fav_movies.length > 0) ||
            (profile.fav_music && profile.fav_music.length > 0) ||
            (profile.fav_tv && profile.fav_tv.length > 0) ||
            (profile.languages && profile.languages.length > 0)
          ) && (
            <MsBox
              header={`${firstName}'s Interests`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div style={{ padding: '4px' }}>
                <table className="ms-table">
                  <caption className="sr-only">{displayName}&apos;s interests</caption>
                  <tbody>
                    {profile.activities && profile.activities.length > 0 && (
                      <tr><td>Activities</td><td>{profile.activities.join(', ')}</td></tr>
                    )}
                    {profile.fav_books && profile.fav_books.length > 0 && (
                      <tr><td>Books</td><td>{profile.fav_books.join(', ')}</td></tr>
                    )}
                    {profile.fav_movies && profile.fav_movies.length > 0 && (
                      <tr><td>Movies</td><td>{profile.fav_movies.join(', ')}</td></tr>
                    )}
                    {profile.fav_music && profile.fav_music.length > 0 && (
                      <tr><td>Music</td><td>{profile.fav_music.join(', ')}</td></tr>
                    )}
                    {profile.fav_tv && profile.fav_tv.length > 0 && (
                      <tr><td>TV</td><td>{profile.fav_tv.join(', ')}</td></tr>
                    )}
                    {profile.languages && profile.languages.length > 0 && (
                      <tr><td>Languages</td><td>{profile.languages.join(', ')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </MsBox>
          )}

          {/* ── Links table (members only) ── */}
          {currentUser && (
            profile.email || profile.website || profile.linkedin_url || profile.instagram_url ||
            profile.twitter_url || profile.phone
          ) && (
            <MsBox header={`${firstName}'s Links`}>
              <div style={{ padding: '4px' }}>
                <table className="ms-table">
                  <caption className="sr-only">{displayName}&apos;s contact links</caption>
                  <tbody>
                    {profile.email_public !== false && profile.email && (
                      <tr>
                        <td>Email</td>
                        <td><a href={`mailto:${profile.email}`} style={{ wordBreak: 'break-all' }}>{profile.email}</a></td>
                      </tr>
                    )}
                    {profile.phone && (
                      <tr>
                        <td>Phone</td>
                        <td><a href={`tel:${profile.phone}`}>{profile.phone}</a></td>
                      </tr>
                    )}
                    {profile.website && (
                      <tr>
                        <td>Website</td>
                        <td>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" aria-label={`${displayName}'s website`}>
                            {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </td>
                      </tr>
                    )}
                    {profile.work_samples_url && (
                      <tr>
                        <td>Work Reel</td>
                        <td>
                          <a
                            href={profile.work_samples_url.startsWith('http') ? profile.work_samples_url : `https://${profile.work_samples_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${displayName}'s work samples`}
                          >
                            {profile.work_samples_url.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        </td>
                      </tr>
                    )}
                    {profile.linkedin_url && (
                      <tr>
                        <td>LinkedIn</td>
                        <td>
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label={`${displayName} on LinkedIn`}>
                            LinkedIn →
                          </a>
                        </td>
                      </tr>
                    )}
                    {profile.instagram_url && (
                      <tr>
                        <td>Instagram</td>
                        <td>
                          <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" aria-label={`${displayName} on Instagram`}>
                            Instagram →
                          </a>
                        </td>
                      </tr>
                    )}
                    {profile.twitter_url && (
                      <tr>
                        <td>X / Twitter</td>
                        <td>
                          <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" aria-label={`${displayName} on X / Twitter`}>
                            X →
                          </a>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </MsBox>
          )}

          {!currentUser && (
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>
              <Link href="/login" style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline' }}>
                Log in
              </Link>{' '}
              to see contact info and message {firstName}.
            </div>
          )}

          {/* ── Back link ── */}
          {currentUser && (
            <Link
              href="/members"
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', textDecoration: 'underline', display: 'inline-block', paddingTop: '4px' }}
            >
              ← Members
            </Link>
          )}

        </aside>

        {/* ════════════════════════════════════
            RIGHT MAIN CONTENT
        ════════════════════════════════════ */}
        <div id="main-content" style={{ flex: 1, minWidth: '300px' }}>

          {/* ── Highlights ── */}
          {profile.highlights && (
            <MsBox
              header={`✨ ${firstName}'s Highlights`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div className="ms-box-body">
                <p style={{ margin: 0, lineHeight: 1.6 }}>{profile.highlights}</p>
              </div>
            </MsBox>
          )}

          {/* ── Blurbs (bio + specialties) ── */}
          {(profile.bio || (profile.specialties && profile.specialties.length > 0)) && (
            <MsBox
              header={`${firstName}'s Blurbs`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div className="ms-box-body">
                {profile.bio && (
                  <>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>About me:</p>
                    <p style={{ color: 'var(--aac-blue)', lineHeight: 1.6, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
                  </>
                )}
                {profile.specialties && profile.specialties.length > 0 && (
                  <>
                    <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>What I do:</p>
                    <p style={{ color: 'var(--aac-blue)', margin: 0 }}>{profile.specialties.join(' · ')}</p>
                    {profile.has_captioning != null && profile.specialties.includes('Content Creator') && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '6px', margin: '6px 0 0' }}>
                        {profile.has_captioning ? '✓ Content includes captions' : 'Content does not currently include captions'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </MsBox>
          )}

          {/* ── Work Details ── */}
          {(profile.work_category || (profile.event_sizes && profile.event_sizes.length > 0) ||
            profile.timezone || (profile.communication_style && profile.communication_style.length > 0) ||
            profile.preferred_contact || profile.rate_info) && (
            <MsBox
              header={`${firstName}'s Work Details`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div style={{ padding: '4px' }}>
                <table className="ms-table">
                  <caption className="sr-only">{displayName}&apos;s professional details</caption>
                  <tbody>
                    {profile.work_category && (
                      <tr><td>Role Type</td><td>{profile.work_category}</td></tr>
                    )}
                    {profile.event_sizes && profile.event_sizes.length > 0 && (
                      <tr><td>Event Sizes</td><td>{profile.event_sizes.join(', ')}</td></tr>
                    )}
                    <tr>
                      <td>Availability</td>
                      <td>
                        <span className={availClass(availStatus)}>
                          <span aria-hidden="true">{availDot(availStatus)}</span>
                          {availStatus}
                        </span>
                      </td>
                    </tr>
                    {profile.timezone && (
                      <tr><td>Time Zone</td><td>{profile.timezone}</td></tr>
                    )}
                    {profile.communication_style && profile.communication_style.length > 0 && (
                      <tr><td>Comms Style</td><td>{profile.communication_style.join(' · ')}</td></tr>
                    )}
                    {profile.preferred_contact && (
                      <tr><td>Preferred Contact</td><td>{profile.preferred_contact}</td></tr>
                    )}
                    {profile.rate_info && (
                      <tr><td>Rates</td><td>{profile.rate_info}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </MsBox>
          )}

          {/* ── Career Highlights ── */}
          {profile.career_highlights && (
            <MsBox
              header={`🌟 ${firstName}'s Career Highlights`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div className="ms-box-body">
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, margin: 0 }}>{profile.career_highlights}</p>
              </div>
            </MsBox>
          )}

          {/* ── Personality Corner ── */}
          {(profile.fun_fact || profile.favorite_event) && (
            <MsBox
              header={`😄 ${firstName}'s Personality Corner`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div className="ms-box-body">
                {profile.fun_fact && (
                  <>
                    <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Fun fact:</p>
                    <p style={{ color: 'var(--aac-blue)', margin: '0 0 10px', lineHeight: 1.6 }}>{profile.fun_fact}</p>
                  </>
                )}
                {profile.favorite_event && (
                  <>
                    <p style={{ fontWeight: 'bold', margin: '0 0 3px' }}>Favorite event I&apos;ve ever worked:</p>
                    <p style={{ color: 'var(--aac-blue)', margin: 0, lineHeight: 1.6 }}>{profile.favorite_event}</p>
                  </>
                )}
              </div>
            </MsBox>
          )}

          {/* ── Skills & Software ── */}
          {((profile.software_skills && profile.software_skills.length > 0) ||
            (profile.new_to_roles && profile.new_to_roles.length > 0)) && (
            <MsBox
              header={`💻 ${firstName}'s Skills & Software`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div style={{ padding: '4px' }}>
                <table className="ms-table">
                  <caption className="sr-only">{displayName}&apos;s skills and software</caption>
                  <tbody>
                    {profile.software_skills && profile.software_skills.length > 0 && (
                      <tr><td>Software</td><td>{profile.software_skills.join(', ')}</td></tr>
                    )}
                    {profile.new_to_roles && profile.new_to_roles.length > 0 && (
                      <tr><td>New to / Want to try</td><td>{profile.new_to_roles.join(', ')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </MsBox>
          )}

          {/* ── Education ── */}
          {profile.education && (
            <MsBox
              header={`🎓 ${firstName}'s Education`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div className="ms-box-body">
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, margin: 0 }}>{profile.education}</p>
              </div>
            </MsBox>
          )}

          {/* ── Go-To's ── */}
          <MsBox
            header={`⭐ ${firstName}'s Go-To's`}
            action={goTos.length > 6 ? { label: `view all ${goTos.length}`, href: '#', srLabel: ` of ${firstName}'s Go-To colleagues` } : undefined}
          >
            <div className="ms-box-body">
              <p style={{ fontSize: '0.75rem', margin: '0 0 8px', color: 'var(--color-text-muted)' }}>
                Colleagues {firstName} has worked with and recommends.
              </p>
              {goTos.length > 0 ? (
                <>
                  <p className="sr-only">
                    {firstName}&apos;s Go-To colleagues: {goTos.map(p => p.display_name || p.full_name).join(', ')}.
                  </p>
                  <ul aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', listStyle: 'none', padding: 0, margin: '0 0 8px' }}>
                    {goTosPreview.map((p) => {
                      const pName = p.display_name || p.full_name;
                      const pInit = pName.charAt(0).toUpperCase();
                      return (
                        <li key={p.id} style={{ textAlign: 'center' }}>
                          <Link href={profileHref(p)} tabIndex={-1} aria-hidden="true" style={{ display: 'block', textDecoration: 'none' }}>
                            <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--aac-blue-light)', border: '1px solid var(--ms-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--aac-blue)', overflow: 'hidden' }}>
                              {p.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : pInit}
                            </div>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--aac-blue)', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {pName.split(' ')[0]}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                    {Array.from({ length: Math.max(0, 6 - goTosPreview.length) }).map((_, i) => (
                      <li key={`e${i}`} aria-hidden="true" style={{ textAlign: 'center' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', border: '1px dashed #c8d3f0', background: '#f0f2fc' }} />
                        <span style={{ fontSize: '0.6875rem', color: '#c8d3f0' }}>—</span>
                      </li>
                    ))}
                  </ul>
                  <nav aria-label={`${firstName}'s Go-To colleagues`}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
                      {goTosPreview.map((p) => {
                        const pName = p.display_name || p.full_name;
                        return (
                          <li key={p.id}>
                            <Link href={profileHref(p)} style={{ fontSize: '0.75rem' }}>⭐ {pName}</Link>
                          </li>
                        );
                      })}
                      {goTos.length > 6 && (
                        <li>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>+ {goTos.length - 6} more</span>
                        </li>
                      )}
                    </ul>
                  </nav>
                </>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                  No Go-To&apos;s added yet.
                </p>
              )}
            </div>
          </MsBox>

          {/* ── Videos ── */}
          {profile.video_links && profile.video_links.length > 0 && (
            <MsBox
              header={`🎬 ${firstName}'s Videos`}
              action={isOwnProfile ? { label: 'edit', href: `${profileHref(profile)}/edit` } : undefined}
            >
              <div className="ms-box-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.video_links.map((url, i) => {
                    const embed = parseVideoUrl(url);
                    return embed ? (
                      <div key={i}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', border: '1px solid var(--ms-border)' }}>
                          <iframe
                            src={embed.embedUrl}
                            title={`${embed.label} — ${displayName}`}
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
          )}

          {/* ── Trainings & Certifications ── */}
          {profile.certifications && profile.certifications.length > 0 && (
            <MsBox header={`📚 ${firstName}'s Trainings & Certifications`}>
              <div className="ms-box-body">
                <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9 }}>
                  {profile.certifications.map((c, i) => (
                    <li key={i} style={{ color: 'var(--aac-blue)' }}>{c}</li>
                  ))}
                </ul>
              </div>
            </MsBox>
          )}

          {/* ── Community Interests ── */}
          {profile.community_interests && profile.community_interests.length > 0 && (
            <MsBox header={`🌱 ${firstName}'s Community Interests`}>
              <div className="ms-box-body">
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 6px' }}>
                  Features {firstName} would love to see on the Collective:
                </p>
                <ul style={{ margin: 0, padding: '0 0 0 18px', lineHeight: 1.9 }}>
                  {profile.community_interests.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </MsBox>
          )}

          {/* ── What People Say (endorsements with notes) ── */}
          {endorsementsWithNotes.length > 0 && (
            <MsBox
              header={`💬 What People Say About ${firstName}`}
              action={canEndorse && !hasEndorsed ? { label: 'Add a Note', onClick: handleEndorse, srLabel: ` about ${firstName}` } : undefined}
            >
              <div className="ms-box-body">
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                  Displaying <strong>{endorsementsWithNotes.length}</strong> of{' '}
                  <strong>{lovedByCount}</strong> note{lovedByCount !== 1 ? 's' : ''}
                </p>
                {endorsementsWithNotes.map((e) => {
                  const eName = e.endorser.display_name || e.endorser.full_name;
                  const eInit = eName.charAt(0).toUpperCase();
                  return (
                    <div key={e.id} className="ms-comment-row">
                      <Link href={profileHref(e.endorser)} aria-label={`View ${eName}'s profile`} style={{ display: 'block', flexShrink: 0 }}>
                        <div className="ms-comment-avatar" style={{ background: 'var(--aac-blue-light)', overflow: 'hidden' }}>
                          {e.endorser.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={e.endorser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span aria-hidden="true">{eInit}</span>
                          )}
                        </div>
                      </Link>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: '0 0 2px' }}>
                          <Link href={profileHref(e.endorser)} style={{ fontWeight: 'bold', color: 'var(--aac-blue)', textDecoration: 'none' }}>
                            ⭐ {eName}
                          </Link>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                            {new Date(e.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                          </span>
                        </p>
                        <p style={{ margin: 0, lineHeight: 1.5 }}>{e.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </MsBox>
          )}

          {/* ── If no notes yet but there are endorsers, show encouragement ── */}
          {lovedByCount > 0 && endorsementsWithNotes.length === 0 && (
            <MsBox header={`💬 What People Say About ${firstName}`}>
              <div className="ms-box-body">
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>
                  {firstName} has {lovedByCount} Favorite{lovedByCount !== 1 ? 's' : ''} — no notes yet.{' '}
                  {canEndorse && !hasEndorsed && 'Be the first to leave one!'}
                </p>
              </div>
            </MsBox>
          )}

        </div>{/* end right main */}
      </div>{/* end profile grid */}

      {/* ── Footer ── */}
      <footer aria-label="Site footer" className="ms-footer" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <nav aria-label="Footer links" style={{ display: 'inline' }}>
          <Link href="/" style={{ color: 'inherit' }}>Home</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/contact" style={{ color: 'inherit' }}>Contact Us</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/members" style={{ color: 'inherit' }}>Members</Link>
        </nav>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>
          ©{new Date().getFullYear()} Artistic Accessibility Collective. All Rights Reserved.
        </span>
      </footer>

    </main>
  </BrowserChrome>
  );
}
