'use client';
import Logo from '@/components/Logo';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, type Profile, profileHref, SPECIALTY_OPTIONS, CERTIFICATION_OPTIONS } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PhotoUploader from '@/components/PhotoUploader';
import BrowserChrome from '@/components/BrowserChrome';

// ── Tag input ─────────────────────────────────────────────────────────────────

interface TagInputProps {
  id: string;
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  hint?: string;
}

function TagInput({ id, label, tags, onChange, suggestions = [], placeholder = 'Type and press Enter…', hint }: TagInputProps) {
  const [input, setInput] = useState('');
  const liveRef = useRef<HTMLDivElement>(null);

  const announce = (msg: string) => {
    if (liveRef.current) liveRef.current.textContent = msg;
    setTimeout(() => { if (liveRef.current) liveRef.current.textContent = ''; }, 1000);
  };

  const add = (val: string) => {
    const clean = val.trim();
    if (!clean || tags.includes(clean)) { setInput(''); return; }
    onChange([...tags, clean]);
    announce(`Added: ${clean}`);
    setInput('');
  };

  const remove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
    announce(`Removed: ${tag}`);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && tags.length > 0) remove(tags[tags.length - 1]);
  };

  const unused = suggestions.filter((s) => !tags.includes(s));

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">{label}</label>
      {hint && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{hint}</p>}

      {/* Tag pills */}
      {tags.length > 0 && (
        <ul
          aria-label={`${label} — current selections`}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', listStyle: 'none', padding: 0, margin: '0 0 0.5rem' }}
        >
          {tags.map((t) => (
            <li key={t}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'var(--aac-blue)', color: '#fff',
                  borderRadius: '999px', padding: '2px 10px',
                  fontSize: '0.8125rem', fontWeight: 500,
                }}
              >
                {t}
                <button
                  type="button"
                  onClick={() => remove(t)}
                  aria-label={`Remove ${t}`}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0 0 0 2px', fontSize: '0.875rem', lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <input
        id={id}
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) add(input); }}
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="sr-only">Press Enter or comma to add. Backspace on empty field to remove the last item.</p>

      {/* Suggestion chips */}
      {unused.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Suggestions:</p>
          <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', listStyle: 'none', padding: 0, margin: 0 }}>
            {unused.slice(0, 12).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => { onChange([...tags, s]); announce(`Added: ${s}`); }}
                  style={{
                    fontSize: '0.75rem', padding: '2px 10px',
                    border: '1px solid var(--aac-blue)', borderRadius: '999px',
                    background: 'transparent', color: 'var(--aac-blue)',
                    cursor: 'pointer',
                  }}
                >
                  + {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Live region for screen reader announcements */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />
    </div>
  );
}

// ── Language suggestions ──────────────────────────────────────────────────────

const LANGUAGE_SUGGESTIONS = [
  'English', 'American Sign Language (ASL)', 'Spanish', 'French',
  'Mandarin', 'Cantonese', 'Arabic', 'Portuguese', 'Russian',
  'Japanese', 'Korean', 'German', 'Italian', 'Tactile ASL',
  'Protactile', 'Black ASL', 'Mexican Sign Language (LSM)',
];

// ── Page ─────────────────────────────────────────────────────────────────────

type EditableProfile = Pick<Profile,
  | 'display_name' | 'pronouns' | 'username' | 'bio'
  | 'location_city' | 'location_state' | 'location_country'
  | 'specialties' | 'certifications' | 'languages'
  | 'years_of_experience' | 'has_captioning' | 'is_student'
  | 'website' | 'linkedin_url' | 'instagram_url'
  | 'public_visible' | 'email_public'
>;

export default function EditProfilePage() {
  const router = useRouter();

  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saveStatus,    setSaveStatus]    = useState<'idle' | 'saved' | 'error'>('idle');
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [usernameError, setUsernameError] = useState('');
  const [checkingSlug,  setCheckingSlug]  = useState(false);

  // Form state
  const [displayName,      setDisplayName]      = useState('');
  const [pronouns,         setPronouns]         = useState('');
  const [username,         setUsername]         = useState('');
  const [bio,              setBio]              = useState('');
  const [city,             setCity]             = useState('');
  const [stateProvince,    setStateProvince]    = useState('');
  const [country,          setCountry]          = useState('US');
  const [specialties,      setSpecialties]      = useState<string[]>([]);
  const [certifications,   setCertifications]   = useState<string[]>([]);
  const [languages,        setLanguages]        = useState<string[]>([]);
  const [yearsExp,         setYearsExp]         = useState('');
  const [hasCaptioning,    setHasCaptioning]    = useState(false);
  const [isStudent,        setIsStudent]        = useState(false);
  const [website,          setWebsite]          = useState('');
  const [linkedin,         setLinkedin]         = useState('');
  const [instagram,        setInstagram]        = useState('');
  const [publicVisible,    setPublicVisible]    = useState(false);
  const [emailPublic,      setEmailPublic]      = useState(false);
  const [avatarPath,       setAvatarPath]       = useState<string | null>(null);
  const [volunteerStatus,  setVolunteerStatus]  = useState<'yes' | 'no' | ''>('');
  const [volunteerNotes,   setVolunteerNotes]   = useState('');

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Edit Profile · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    if (!data) { router.push('/login'); return; }

    setProfile(data);

    // Hydrate form fields
    setDisplayName(data.display_name  ?? data.full_name ?? '');
    setPronouns(data.pronouns         ?? '');
    setUsername(data.username         ?? '');
    setBio(data.bio                   ?? '');
    setCity(data.location_city        ?? '');
    setStateProvince(data.location_state ?? '');
    setCountry(data.location_country  ?? 'US');
    setSpecialties(data.specialties   ?? []);
    setCertifications(data.certifications ?? []);
    setLanguages(data.languages       ?? []);
    setYearsExp(data.years_of_experience != null ? String(data.years_of_experience) : '');
    setHasCaptioning(data.has_captioning ?? false);
    setIsStudent(data.is_student      ?? false);
    setWebsite(data.website           ?? '');
    setLinkedin(data.linkedin_url     ?? '');
    setInstagram(data.instagram_url   ?? '');
    setPublicVisible(data.public_visible ?? false);
    setEmailPublic(data.email_public  ?? false);
    setAvatarPath(data.avatar_url     ?? null);
    setVolunteerStatus((data.volunteer_status as 'yes' | 'no') ?? '');
    setVolunteerNotes(data.volunteer_notes   ?? '');

    setLoading(false);
    headingRef.current?.focus();
  }, [router]);

  // ── Username uniqueness check ─────────────────────────────────────────────

  const checkUsername = useCallback(async (slug: string) => {
    if (!slug || !profile) return;
    // Same as current — no conflict
    if (slug === profile.username) { setUsernameError(''); return; }

    // Validate format
    if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(slug)) {
      setUsernameError('3–30 characters: lowercase letters, numbers, hyphens, underscores only.');
      return;
    }

    setCheckingSlug(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', slug)
      .maybeSingle();

    setCheckingSlug(false);
    setUsernameError(data ? 'That username is already taken.' : '');
  }, [profile]);

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!city.trim())         newErrors.city    = 'City is required.';
    if (!stateProvince.trim()) newErrors.state   = 'State or province is required.';
    if (!country.trim())      newErrors.country  = 'Country is required.';
    if (specialties.length === 0) newErrors.specialties = 'Add at least one specialty.';
    if (languages.length === 0)   newErrors.languages   = 'Add at least one language.';
    if (usernameError)        newErrors.username = usernameError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error field
      const firstKey = Object.keys(newErrors)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    setErrors({});
    setSaving(true);
    setSaveStatus('idle');

    const updates: Partial<EditableProfile> = {
      display_name:       displayName.trim() || undefined,
      pronouns:           pronouns.trim()    || undefined,
      username:           username.trim()    || undefined,
      bio:                bio.trim()         || undefined,
      location_city:      city.trim(),
      location_state:     stateProvince.trim(),
      location_country:   country.trim(),
      specialties,
      certifications,
      languages,
      years_of_experience: yearsExp ? parseInt(yearsExp, 10) : undefined,
      has_captioning:     hasCaptioning,
      is_student:         isStudent,
      website:            website.trim()     || undefined,
      linkedin_url:       linkedin.trim()    || undefined,
      instagram_url:      instagram.trim()   || undefined,
      public_visible:     publicVisible,
      email_public:       emailPublic,
      volunteer_status:   volunteerStatus || null,
      volunteer_notes:    volunteerStatus === 'yes' ? volunteerNotes.trim() || null : null,
    } as any;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile!.id);

    setSaving(false);

    if (error) {
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
      // Update local profile so profileHref works with new username
      setProfile((prev) => prev ? { ...prev, ...updates, username: username.trim() || undefined } : prev);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <BrowserChrome variant="aol" title="Edit Profile — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/profile/edit">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading your profile">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading your profile…</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  if (!profile) return null;

  const previewHref = profileHref({ id: profile.id, username: username.trim() || undefined });

  return (
    <BrowserChrome variant="aol" title="Edit Profile — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/profile/edit">
    <main className="page-wrapper">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="site-header">
        <Link href="/dashboard" className="site-header-logo" aria-label="Artistic Accessibility Collective — Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Logo alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/dashboard"    className="nav-link">Backstage</Link>
          <Link href="/messages"   className="nav-link">Messages</Link>
          <Link href="/members" className="nav-link">Directory</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="btn btn-outline-white btn-sm"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <div className="page-container" style={{ maxWidth: '680px', paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* ── Page heading ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              style={{ color: 'var(--aac-blue-dark)', fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)', fontWeight: 'bold', marginBottom: '0.25rem', outline: 'none' }}
            >
              Edit Your Profile
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Changes save immediately and appear on your public profile.
            </p>
          </div>
          <Link href={previewHref} className="btn btn-ghost btn-sm" aria-label="Preview your public profile (opens in same tab)">
            Preview Profile →
          </Link>
        </div>

        {/* ── Save status ──────────────────────────────────────────────── */}
        {saveStatus === 'saved' && (
          <div className="alert alert-info" role="status" aria-live="polite" style={{ marginBottom: '1.5rem' }}>
            ✓ Profile saved successfully!
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="alert alert-error" role="alert" aria-live="assertive" style={{ marginBottom: '1.5rem' }}>
            Something went wrong saving your profile. Please try again.
          </div>
        )}

        <form onSubmit={handleSave} noValidate>

          {/* ══ Section: About You ═══════════════════════════════════════ */}
          <div className="ms-box" style={{ marginBottom: '1.25rem' }}>
            <div className="ms-box-header">About You</div>
            <div className="ms-box-body" style={{ padding: '1.25rem' }}>

              {/* Profile photo */}
              {profile.user_id && (
                <div className="form-group">
                  <p className="form-label" style={{ marginBottom: '0.625rem' }}>Profile Photo</p>
                  <PhotoUploader
                    userId={profile.user_id}
                    currentPath={avatarPath}
                    displayName={displayName || profile.full_name || ''}
                    onSaved={(newPath) => setAvatarPath(newPath)}
                  />
                </div>
              )}

              {/* Display name */}
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">
                  Display Name
                  <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.8rem' }}>
                    (shown on your profile; defaults to your full name)
                  </span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={profile.full_name}
                />
              </div>

              {/* Pronouns */}
              <div className="form-group">
                <label htmlFor="pronouns" className="form-label">Pronouns</label>
                <input
                  id="pronouns"
                  type="text"
                  className="form-input"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  placeholder="e.g. she/her, they/them, he/him"
                />
              </div>

              {/* Username */}
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Profile Username
                  <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '0.8rem' }}>
                    (your custom URL: /profile/username)
                  </span>
                </label>
                <input
                  id="username"
                  type="text"
                  className={`form-input${usernameError ? ' input-error' : ''}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  onBlur={() => checkUsername(username)}
                  placeholder="e.g. marykate-ashe"
                  aria-describedby="username-hint username-error"
                  aria-invalid={!!usernameError}
                />
                <p id="username-hint" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  3–30 characters. Lowercase letters, numbers, hyphens, underscores.
                  {checkingSlug && <> · <em>Checking…</em></>}
                </p>
                {usernameError && (
                  <p id="username-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    {usernameError}
                  </p>
                )}
                {errors.username && (
                  <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="bio" className="form-label">Bio</label>
                <textarea
                  id="bio"
                  className="form-input form-textarea"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A few sentences about your work, background, and what you bring to the Collective…"
                />
              </div>

            </div>
          </div>

          {/* ══ Section: Location ════════════════════════════════════════ */}
          <div className="ms-box" style={{ marginBottom: '1.25rem' }}>
            <div className="ms-box-header">Where Are You</div>
            <div className="ms-box-body" style={{ padding: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="city" className="form-label form-label-required">City</label>
                  <input
                    id="city"
                    type="text"
                    className={`form-input${errors.city ? ' input-error' : ''}`}
                    value={city}
                    onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors((p) => ({ ...p, city: '' })); }}
                    placeholder="Chicago"
                    aria-required="true"
                    aria-invalid={!!errors.city}
                    aria-describedby={errors.city ? 'city-error' : undefined}
                  />
                  {errors.city && <p id="city-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.city}</p>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="state" className="form-label form-label-required">State / Province</label>
                  <input
                    id="state"
                    type="text"
                    className={`form-input${errors.state ? ' input-error' : ''}`}
                    value={stateProvince}
                    onChange={(e) => { setStateProvince(e.target.value); if (errors.state) setErrors((p) => ({ ...p, state: '' })); }}
                    placeholder="IL"
                    aria-required="true"
                    aria-invalid={!!errors.state}
                    aria-describedby={errors.state ? 'state-error' : undefined}
                  />
                  {errors.state && <p id="state-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{errors.state}</p>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0, marginTop: '1rem' }}>
                <label htmlFor="country" className="form-label form-label-required">Country</label>
                <select
                  id="country"
                  className="form-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  aria-required="true"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="MX">Mexico</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="Other">Other</option>
                </select>
              </div>

            </div>
          </div>

          {/* ══ Section: What You Do ═════════════════════════════════════ */}
          <div className="ms-box" style={{ marginBottom: '1.25rem' }}>
            <div className="ms-box-header">What You Do</div>
            <div className="ms-box-body" style={{ padding: '1.25rem' }}>

              <div aria-describedby={errors.specialties ? 'specialties-error' : undefined}>
                <TagInput
                  id="specialties"
                  label="Specialties / Roles *"
                  tags={specialties}
                  onChange={(t) => { setSpecialties(t); if (errors.specialties) setErrors((p) => ({ ...p, specialties: '' })); }}
                  suggestions={SPECIALTY_OPTIONS.filter((s) => s !== 'Other')}
                  placeholder="e.g. ASL Interpreter, Educator…"
                  hint="Your professional roles in accessibility and the arts."
                />
              </div>
              {errors.specialties && (
                <p id="specialties-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                  {errors.specialties}
                </p>
              )}

              <TagInput
                id="certifications"
                label="Certifications & Credentials"
                tags={certifications}
                onChange={setCertifications}
                suggestions={CERTIFICATION_OPTIONS.filter((s) => s !== 'Other')}
                placeholder="e.g. NIC, BEI, NCRA…"
                hint="Professional certifications. Leave blank if none."
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="yearsExp" className="form-label">Years of Experience</label>
                  <input
                    id="yearsExp"
                    type="number"
                    min="0"
                    max="60"
                    className="form-input"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingTop: '1.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={hasCaptioning}
                      onChange={(e) => setHasCaptioning(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    I provide captioning services
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={isStudent}
                      onChange={(e) => setIsStudent(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    I&apos;m currently a student
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* ══ Section: Languages ═══════════════════════════════════════ */}
          <div className="ms-box" style={{ marginBottom: '1.25rem' }}>
            <div className="ms-box-header">Languages</div>
            <div className="ms-box-body" style={{ padding: '1.25rem' }}>
              <div aria-describedby={errors.languages ? 'languages-error' : undefined}>
                <TagInput
                  id="languages"
                  label="Languages You Work In *"
                  tags={languages}
                  onChange={(t) => { setLanguages(t); if (errors.languages) setErrors((p) => ({ ...p, languages: '' })); }}
                  suggestions={LANGUAGE_SUGGESTIONS}
                  placeholder="e.g. ASL, English…"
                />
              </div>
              {errors.languages && (
                <p id="languages-error" role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '-0.5rem' }}>
                  {errors.languages}
                </p>
              )}
            </div>
          </div>

          {/* ══ Section: Volunteering ════════════════════════════════════ */}
          {profile?.profile_type === 'individual' && (
            <div className="ms-box" style={{ marginBottom: '1.25rem' }}>
              <div className="ms-box-header">Volunteering</div>
              <div className="ms-box-body" style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 0, marginBottom: '1rem' }}>
                  Are you open to volunteering your services for the right gig, like a low-income
                  community project, a grassroots arts org, or a cause you believe in?
                  If you answer yes, it will show on your profile. If you skip this, nothing is shown.
                </p>

                <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1rem' }}>
                  <legend className="form-label" style={{ marginBottom: '0.625rem' }}>
                    Are you open to volunteering your skills?
                  </legend>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="volunteer_status_edit"
                      value="yes"
                      checked={volunteerStatus === 'yes'}
                      onChange={() => setVolunteerStatus('yes')}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Yes, for the right gig! 🌱</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="volunteer_status_edit"
                      value="no"
                      checked={volunteerStatus === 'no'}
                      onChange={() => setVolunteerStatus('no')}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Not at this time</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="volunteer_status_edit"
                      value=""
                      checked={volunteerStatus === ''}
                      onChange={() => { setVolunteerStatus(''); setVolunteerNotes(''); }}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Prefer not to say (hidden)</span>
                  </label>
                </fieldset>

                {volunteerStatus === 'yes' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="volunteerNotes" className="form-label">
                      Examples of your volunteer work (optional)
                    </label>
                    <textarea
                      id="volunteerNotes"
                      className="form-input form-textarea"
                      rows={3}
                      placeholder="e.g., I've interpreted for community theater orgs and grassroots disability arts events…"
                      value={volunteerNotes}
                      onChange={(e) => setVolunteerNotes(e.target.value)}
                    />
                    <p className="form-hint">This will appear on your profile so others can see your community involvement.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ Section: Links ════════════════════════════════════════════ */}
          <div className="ms-box" style={{ marginBottom: '1.25rem' }}>
            <div className="ms-box-header">Find Me Online</div>
            <div className="ms-box-body" style={{ padding: '1.25rem' }}>

              <div className="form-group">
                <label htmlFor="website" className="form-label">Website</label>
                <input
                  id="website"
                  type="url"
                  className="form-input"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="linkedin" className="form-label">LinkedIn URL</label>
                <input
                  id="linkedin"
                  type="url"
                  className="form-input"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="instagram" className="form-label">Instagram URL</label>
                <input
                  id="instagram"
                  type="url"
                  className="form-input"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>

            </div>
          </div>

          {/* ══ Section: Privacy ══════════════════════════════════════════ */}
          <div className="ms-box" style={{ marginBottom: '1.75rem' }}>
            <div className="ms-box-header">Privacy Settings</div>
            <div className="ms-box-body" style={{ padding: '1.25rem' }}>

              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend className="form-label" style={{ marginBottom: '0.75rem' }}>Who can see your profile?</legend>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', marginBottom: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={publicVisible}
                    onChange={(e) => setPublicVisible(e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: '2px', flexShrink: 0 }}
                  />
                  <span>
                    <strong>Make profile public</strong>
                    <br />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Your profile will appear in the public-facing directory and may be found via search engines.
                      Currently {publicVisible ? 'public' : 'members-only'}.
                    </span>
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={emailPublic}
                    onChange={(e) => setEmailPublic(e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: '2px', flexShrink: 0 }}
                  />
                  <span>
                    <strong>Show email address on profile</strong>
                    <br />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Your email will be visible to anyone who can see your profile. Off by default.
                    </span>
                  </span>
                </label>
              </fieldset>

            </div>
          </div>

          {/* ── Save button ──────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !!usernameError}
              aria-disabled={saving || !!usernameError}
            >
              {saving ? (
                <><span className="spinner" aria-hidden="true" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
              ) : (
                'Save Changes'
              )}
            </button>
            <Link href={profileHref(profile)} className="btn btn-ghost">
              Cancel
            </Link>
            {saving && <span role="status" className="sr-only">Saving your profile…</span>}
          </div>

        </form>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="ms-footer" aria-label="Site footer">
        <nav aria-label="Footer navigation" style={{ display: 'inline' }}>
          <Link href="/dashboard"    style={{ color: 'inherit', textDecoration: 'none' }}>Backstage</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/messages"   style={{ color: 'inherit', textDecoration: 'none' }}>Messages</Link>
          <span className="ms-footer-pipe" aria-hidden="true">|</span>
          <Link href="/members" style={{ color: 'inherit', textDecoration: 'none' }}>Directory</Link>
        </nav>
        <br />
        <span style={{ marginTop: '4px', display: 'block' }}>
          ©{new Date().getFullYear()} Artistic Accessibility Collective
        </span>
      </footer>

    </main>
  </BrowserChrome>
  );
}
