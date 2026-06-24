'use client';
import Logo from '@/components/Logo';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

type Step = 'invite' | 'type_select' | 'form' | 'success';
type ProfileType = 'individual' | 'business';

const YEARS_OPTIONS = [
  'Less than 1 year', '1–2 years', '3–5 years',
  '6–10 years', '11–20 years', '20+ years',
];

const PROFESSION_SUGGESTIONS = [
  'ASL Interpreter', 'Event Staff', 'Film Production', 'Educator',
  'Speaker', 'Content Creator', 'Film Post-Production', 'Business Owner',
];

const CREDENTIAL_SUGGESTIONS = [
  'NIC (National Interpreter Certification)',
  'CDI (Certified Deaf Interpreter)',
  'NAD Certificate',
  'BEI (Board for Evaluation of Interpreters)',
  'EIPA (Educational Interpreter Performance Assessment)',
  'CI/CT (Certificate of Interpretation/Transliteration)',
  'Teaching License / Educators License',
  'Juris Doctor (JD)',
  'Masters Degree',
  'Doctoral Degree',
];

const BUSINESS_TYPE_SUGGESTIONS = [
  'Restaurant', 'Theater', 'Festival', 'Shop', 'Online Business',
  'Event', 'Accessibility Services', 'Education/Tutoring',
];

const ACCESSIBILITY_PRESET_OPTIONS = [
  'Ramp Access',
  'No-Step Throughout',
  'Accessible Restrooms',
  'ASL Interpreters',
  'Open Captioning',
  'Sensory Rooms',
];

const COMMUNITY_FEATURES = [
  'Workshops', 'Continued Education', 'Discussion Boards', 'Local Meet Ups',
  'Educational Films', 'Book Club', 'Monthly Newsletter', 'Job Board',
  'Event Boards', 'Art Projects', 'Film Projects', 'Theater Projects',
  'Virtual Projects', 'Virtual Film Screenings',
];

export default function SubmitProfile() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('invite');
  const [profileType, setProfileType] = useState<ProfileType>('individual');
  const [loading, setLoading] = useState(false);

  // Invite code
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Shared form data (used by both individual and business)
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    email: '',
    email_public: false,
    bio: '',
    location_city: '',
    location_state: '',
    location_country: '',
    willing_to_travel: false,
    travel_distance: '',
    website: '',
    linkedin_url: '',
    instagram_url: '',
    submission_notes: '',
    // Individual only
    pronouns: '',
    years_of_experience: '',
    has_captioning: false,
  });

  // Individual tag inputs
  const [professions, setProfessions] = useState<string[]>([]);
  const [professionInput, setProfessionInput] = useState('');
  const [credentials, setCredentials] = useState<string[]>([]);
  const [credentialInput, setCredentialInput] = useState('');
  const [languages, setLanguages] = useState('');

  // Business-specific
  const [businessTypes, setBusinessTypes] = useState<string[]>([]);
  const [businessTypeInput, setBusinessTypeInput] = useState('');
  const [servicesProvided, setServicesProvided] = useState('');
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<string[]>([]);
  const [customAccessInput, setCustomAccessInput] = useState('');

  // Volunteering (individual only)
  const [volunteerStatus, setVolunteerStatus] = useState<'yes' | 'no' | ''>('');
  const [volunteerNotes, setVolunteerNotes] = useState('');

  // Tester feedback (shared)
  const [testerSelfDescription, setTesterSelfDescription] = useState('');
  const [testerCollaboratorInfo, setTesterCollaboratorInfo] = useState('');
  const [testerFeatureInterests, setTesterFeatureInterests] = useState<string[]>([]);
  const [testerOtherFeedback, setTesterOtherFeedback] = useState('');

  const [formError, setFormError] = useState('');
  const [tagAnnouncement, setTagAnnouncement] = useState('');
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const typeSelectHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Test the Collective · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    if (step === 'success' && successHeadingRef.current) {
      document.title = "You're in! · Artistic Accessibility Collective";
      successHeadingRef.current.focus();
    }
    if (step === 'type_select' && typeSelectHeadingRef.current) {
      typeSelectHeadingRef.current.focus();
    }
    if (step === 'form' && formHeadingRef.current) {
      formHeadingRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if (formError && formErrorRef.current) {
      formErrorRef.current.focus();
      formErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [formError]);

  const isContentCreator = professions.some((p) =>
    p.toLowerCase().includes('content creator')
  );

  // ── Tag helpers ────────────────────────────────────────────────────────

  const addTag = (value: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !list.map((x) => x.toLowerCase()).includes(trimmed.toLowerCase())) {
      setList([...list, trimmed]);
      setTagAnnouncement(`${trimmed} added.`);
    }
    setInput('');
  };

  const removeTag = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((x) => x !== value));
    setTagAnnouncement(`${value} removed.`);
  };

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>, input: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input, list, setList, setInput);
    } else if (e.key === 'Backspace' && !input && list.length > 0) {
      setList(list.slice(0, -1));
    }
  };

  const togglePresetAccessibility = (feature: string) => {
    setAccessibilityFeatures((prev) =>
      prev.includes(feature) ? prev.filter((x) => x !== feature) : [...prev, feature]
    );
    setTagAnnouncement(
      accessibilityFeatures.includes(feature) ? `${feature} removed.` : `${feature} added.`
    );
  };

  const toggleFeature = (f: string) => {
    setTesterFeatureInterests((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  // ── Invite code submit ─────────────────────────────────────────────────

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setLoading(true);

    const code = inviteCode.trim().toUpperCase();

    // TEST BYPASS — remove once database is set up
    if (code === 'AAAC-TEST') {
      setStep('type_select');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('id, used')
        .eq('code', code)
        .single();

      if (error || !data) {
        setInviteError("That code doesn't look right. Double-check it and try again.");
        return;
      }
      if (data.used) {
        setInviteError('That invite code has already been used.');
        return;
      }
      setStep('type_select');
    } catch {
      setInviteError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Profile submit ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.full_name.trim()) {
      setFormError(profileType === 'business' ? 'Business name is required.' : 'Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email is required.');
      return;
    }
    if (!formData.location_city.trim()) {
      setFormError('City is required.');
      return;
    }
    if (!formData.location_state.trim()) {
      setFormError('State / Province is required.');
      return;
    }
    if (!formData.location_country.trim()) {
      setFormError('Country is required.');
      return;
    }

    if (profileType === 'individual') {
      if (!formData.pronouns.trim()) {
        setFormError('Pronouns are required.');
        return;
      }
      if (professions.length === 0) {
        setFormError('Please add at least one profession.');
        return;
      }
      if (!languages.trim()) {
        setFormError('Please list at least one language.');
        return;
      }
    }

    if (profileType === 'business' && businessTypes.length === 0) {
      setFormError('Please add at least one business type.');
      return;
    }

    if (!testerSelfDescription.trim()) {
      setFormError('Please answer the first tester feedback question.');
      return;
    }
    if (!testerCollaboratorInfo.trim()) {
      setFormError('Please answer the second tester feedback question.');
      return;
    }

    setLoading(true);

    try {
      const code = inviteCode.trim().toUpperCase();

      const languagesArr = languages.split(',').map((l) => l.trim()).filter(Boolean);

      const insertData: Record<string, unknown> = {
        full_name: formData.full_name.trim(),
        display_name: formData.display_name.trim() || null,
        email: formData.email.trim(),
        email_public: formData.email_public,
        bio: formData.bio.trim() || null,
        location_city: formData.location_city.trim() || null,
        location_state: formData.location_state.trim() || null,
        location_country: formData.location_country.trim() || null,
        willing_to_travel: formData.willing_to_travel,
        travel_distance: formData.travel_distance.trim() || null,
        website: formData.website.trim() || null,
        linkedin_url: formData.linkedin_url.trim() || null,
        instagram_url: formData.instagram_url.trim() || null,
        submission_notes: formData.submission_notes.trim() || null,
        invite_code_used: code,
        status: 'pending',
        public_visible: false,
        profile_version: 1,
        profile_type: profileType,
      };

      if (profileType === 'individual') {
        Object.assign(insertData, {
          pronouns: formData.pronouns.trim() || null,
          specialties: professions,
          certifications: credentials,
          languages: languagesArr,
          years_of_experience: formData.years_of_experience
            ? YEARS_OPTIONS.indexOf(formData.years_of_experience) + 1
            : null,
          has_captioning: isContentCreator ? formData.has_captioning : null,
          volunteer_status: volunteerStatus || null,
          volunteer_notes: volunteerStatus === 'yes' ? volunteerNotes.trim() || null : null,
        });
      } else {
        Object.assign(insertData, {
          specialties: businessTypes,
          services_provided: servicesProvided.trim() || null,
          accessibility_features: accessibilityFeatures,
        });
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert(insertData)
        .select('id')
        .single();

      if (profileError) {
        console.error('Profile insert error:', profileError);
        throw new Error(profileError.message || 'Profile insert failed');
      }

      if (testerSelfDescription || testerCollaboratorInfo || testerFeatureInterests.length > 0 || testerOtherFeedback) {
        const { error: feedbackError } = await supabase.from('tester_feedback').insert({
          profile_id: profileData.id,
          tester_round: 1,
          missing_profile_info: testerSelfDescription.trim() || null,
          work_use_case: testerCollaboratorInfo.trim() || null,
          community_feature_wish: testerFeatureInterests.length > 0 ? testerFeatureInterests.join(', ') : null,
          additional_feedback: testerOtherFeedback.trim() || null,
        });
        if (feedbackError) console.error('Feedback insert error:', feedbackError);
      }

      if (code !== 'AAAC-TEST') {
        await supabase.from('invite_codes').update({
          used: true,
          used_at: new Date().toISOString(),
          used_by_profile_id: profileData.id,
        }).eq('code', code);
      }

      setStep('success');
    } catch (err) {
      console.error('Submission error:', err);
      setFormError('Something went wrong submitting your profile. Please try again or email us at contact@artisticaccessibility.com.');
    } finally {
      setLoading(false);
    }
  };

  // ── Invite code screen ─────────────────────────────────────────────────

  if (step === 'invite') {
    return (
      <BrowserChrome variant="ie3" title="Join the Collective · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/submit">
      <main className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '6rem', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem', minHeight: '100%', background: '#0d5c4a' }}>
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{loading ? 'Checking your invite code…' : ''}</div>

        <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ marginBottom: '0', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Logo alt="" height={100} />
        </Link>

        <div className="content-card" style={{ maxWidth: '460px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Test the Collective
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            You&apos;ll need an invite code to get started.
          </p>

          <form onSubmit={handleInviteSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="invite-code" className="form-label">Invite Code</label>
              <input
                id="invite-code" type="text" className="form-input"
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', fontSize: '1.25rem' }}
                value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                placeholder="XXXX-XXXX" maxLength={9} required aria-required="true"
                aria-describedby={inviteError ? 'invite-error' : undefined}
                aria-invalid={inviteError ? 'true' : undefined}
                autoComplete="off"
              />
              {inviteError && <p id="invite-error" className="form-error" role="alert">{inviteError}</p>}
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg"
              disabled={loading || !inviteCode.trim()} aria-busy={loading}>
              {loading ? <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Checking…</> : 'Continue'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Don&apos;t have a code?{' '}
            <Link href="/contact" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>Get in touch</Link>
          </p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
            <Link href="/access-card/signup" style={{ color: 'var(--aac-blue)', fontWeight: 600, textDecoration: 'underline' }}>
              No code? Sign up for your Free Access Card here!
            </Link>
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            <Link href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'underline' }}>
              <span aria-hidden="true">← </span>Back to Home
            </Link>
          </p>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  // ── Type select screen ─────────────────────────────────────────────────

  if (step === 'type_select') {
    return (
      <BrowserChrome variant="ie3" title="Join the Collective · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/submit">
      <main className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '6rem', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem', minHeight: '100%', background: '#0d5c4a' }}>
        <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ marginBottom: '0', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Logo alt="" height={100} />
        </Link>

        <div className="content-card" style={{ maxWidth: '520px', width: '100%' }}>
          <h1
            ref={typeSelectHeadingRef}
            tabIndex={-1}
            className="sr-only"
          >
            What would you like to set up?
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
              onClick={() => { setProfileType('individual'); setStep('form'); }}
            >
              Create Your Profile
            </button>
            <button
              type="button"
              className="btn btn-outline btn-lg"
              style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
              onClick={() => { setProfileType('business'); setStep('form'); }}
            >
              Register Your Business
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '1rem' }}>
              Are you a business owner? You&apos;re able to set up both an individual profile and a business page - we can link them together. Select one to start, and{' '}
              <Link href="/contact" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>get in touch</Link>
              {' '}to set up the other.
            </p>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setStep('invite')}
              >
                <span aria-hidden="true">←</span> Back
              </button>
            </div>
          </div>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <BrowserChrome variant="ie3" title="Application Submitted · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/submit">
      <main className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%', background: '#0d5c4a' }}>
        <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ marginBottom: '0', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Logo alt="" height={72} />
        </Link>
        <div className="content-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div aria-hidden="true" style={{ fontSize: '3.5rem', marginBottom: '0.75rem', color: 'var(--color-success)' }}>✓</div>
          <h1 ref={successHeadingRef} tabIndex={-1} style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.75rem', marginBottom: '0.75rem', outline: 'none' }}>
            You&apos;re in!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Your {profileType === 'business' ? 'listing' : 'application'} has been submitted. We&apos;ll review it and send you a login link so you can come back and see your profile.
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
            You won&apos;t need to fill all of this out again; your info will be waiting for you.
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.875rem', background: 'var(--aac-blue-light)', borderRadius: '6px', padding: '0.75rem', textAlign: 'left' }}>
            📷 <strong>Add a profile photo</strong> once you&apos;re approved: just log in and go to Edit Profile. You&apos;ll be able to upload and crop your photo there.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">Back to Home</button>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  // ── Reusable sub-components ────────────────────────────────────────────

  const TagChips = ({ tags, onRemove }: { tags: string[]; onRemove: (t: string) => void }) => (
    <ul role="list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0 0 0.5rem', padding: 0, listStyle: 'none' }}>
      {tags.map((t) => (
        <li key={t}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'var(--aac-blue-light)', color: 'var(--aac-navy)', borderRadius: 'var(--radius-pill)', padding: '0.2rem 0.625rem 0.2rem 0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {t}
            <button type="button" onClick={() => onRemove(t)} aria-label={`Remove ${t}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.125rem', lineHeight: 1, color: 'var(--aac-blue)', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              ×
            </button>
          </span>
        </li>
      ))}
    </ul>
  );

  const SuggestionButtons = ({ suggestions, current, onAdd }: { suggestions: string[]; current: string[]; onAdd: (s: string) => void }) => {
    const remaining = suggestions.filter((s) => !current.map((x) => x.toLowerCase()).includes(s.toLowerCase()));
    if (remaining.length === 0) return null;
    return (
      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Suggestions:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {remaining.map((s) => (
            <button key={s} type="button" onClick={() => onAdd(s)}
              style={{ background: 'var(--aac-cream)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', padding: '0.2rem 0.75rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text)' }}>
              + {s}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Main form ──────────────────────────────────────────────────────────

  return (
    <BrowserChrome variant="ie3" title="Join the Collective · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/submit">
    <main className="page-wrapper" style={{ padding: '2rem 1rem 4rem', background: '#0d5c4a' }}>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{tagAnnouncement}</div>

      <div className="page-container" style={{ maxWidth: '700px' }}>
        <div style={{ textAlign: 'center', marginBottom: '0' }}>
          <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Logo alt="" height={72} />
          </Link>
        </div>

        <div className="content-card">
          <h1
            ref={formHeadingRef}
            tabIndex={-1}
            style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.5rem', marginBottom: '0.25rem', textAlign: 'center', outline: 'none' }}
          >
            {profileType === 'business' ? 'Business Registration' : 'Join the Registry'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '1.75rem', fontSize: '0.9375rem' }}>
            {profileType === 'business'
              ? 'Tell us about your business or event.'
              : 'Tell us about yourself and your work.'}
          </p>

          {formError && (
            <div ref={formErrorRef} tabIndex={-1} className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem', outline: 'none' }}>{formError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate aria-label="Profile submission form" aria-describedby="required-note">
            <p id="required-note" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Fields marked with * are required.
            </p>

            {/* ════════════════════════════════════════
                INDIVIDUAL SECTIONS
            ════════════════════════════════════════ */}
            {profileType === 'individual' && (<>

              <h2 className="section-heading">About You</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="full-name" className="form-label form-label-required">Full Name</label>
                  <input id="full-name" type="text" className="form-input" required aria-required="true" autoComplete="name"
                    value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="display-name" className="form-label">Display Name</label>
                  <input id="display-name" type="text" className="form-input" placeholder="If different from full name"
                    value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="pronouns" className="form-label form-label-required">Pronouns</label>
                  <input id="pronouns" type="text" className="form-input" placeholder="e.g., she/her, they/them"
                    required aria-required="true" autoComplete="off" value={formData.pronouns}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label form-label-required">Email</label>
                  <input id="email" type="email" className="form-input" required aria-required="true" autoComplete="email"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <div className="check-item" style={{ marginTop: '0.5rem', minHeight: 'auto' }}>
                    <input id="email-public" type="checkbox" checked={formData.email_public}
                      onChange={(e) => setFormData({ ...formData, email_public: e.target.checked })} />
                    <label htmlFor="email-public" className="check-item-label" style={{ fontSize: '0.875rem' }}>
                      Share my email on my profile (visible to fellow members only)
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="bio" className="form-label">Bio: Tell us about yourself</label>
                <textarea id="bio" className="form-input form-textarea" rows={4}
                  placeholder="Your experience, background, what drives your work…"
                  value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
              </div>

              <h2 className="section-heading">Where Are You?</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="city" className="form-label form-label-required">City</label>
                  <input id="city" type="text" className="form-input" required aria-required="true" autoComplete="address-level2"
                    value={formData.location_city} onChange={(e) => setFormData({ ...formData, location_city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="state" className="form-label form-label-required">State / Province</label>
                  <input id="state" type="text" className="form-input" placeholder="e.g., CA, NY"
                    required aria-required="true" autoComplete="address-level1" value={formData.location_state}
                    onChange={(e) => setFormData({ ...formData, location_state: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="country" className="form-label form-label-required">Country</label>
                  <input id="country" type="text" className="form-input" placeholder="e.g., United States"
                    required aria-required="true" autoComplete="country-name" value={formData.location_country}
                    onChange={(e) => setFormData({ ...formData, location_country: e.target.value })} />
                </div>
              </div>

              <div className="check-item" style={{ marginBottom: '0.75rem' }}>
                <input id="travel" type="checkbox" checked={formData.willing_to_travel}
                  onChange={(e) => setFormData({ ...formData, willing_to_travel: e.target.checked, travel_distance: e.target.checked ? formData.travel_distance : '' })} />
                <label htmlFor="travel" className="check-item-label">I&apos;m willing to travel for work</label>
              </div>
              {formData.willing_to_travel && (
                <div className="form-group" style={{ marginBottom: '1rem', maxWidth: '340px' }}>
                  <label htmlFor="travel-distance" className="form-label">How far are you willing to travel?</label>
                  <input id="travel-distance" type="text" className="form-input"
                    placeholder="e.g., Within 50 miles, Nationally, Internationally"
                    value={formData.travel_distance} onChange={(e) => setFormData({ ...formData, travel_distance: e.target.value })} />
                </div>
              )}

              <h2 className="section-heading">What You Do</h2>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="professions-input" className="form-label form-label-required">Profession(s)</label>
                {professions.length > 0 && <TagChips tags={professions} onRemove={(t) => removeTag(t, professions, setProfessions)} />}
                <input id="professions-input" type="text" className="form-input" value={professionInput}
                  onChange={(e) => setProfessionInput(e.target.value)}
                  onKeyDown={(e) => handleTagKey(e, professionInput, professions, setProfessions, setProfessionInput)}
                  onBlur={() => { if (professionInput.trim()) addTag(professionInput, professions, setProfessions, setProfessionInput); }}
                  placeholder="Type a profession and press Enter…" aria-describedby="professions-hint"
                  aria-required="true" />
                <p id="professions-hint" className="form-hint">Press Enter to add. Add as many as you like.</p>
                <SuggestionButtons suggestions={PROFESSION_SUGGESTIONS} current={professions}
                  onAdd={(s) => addTag(s, professions, setProfessions, setProfessionInput)} />
              </div>

              {isContentCreator && (
                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                  <div className="check-item" style={{ minHeight: 'auto' }}>
                    <input id="has-captioning" type="checkbox" checked={formData.has_captioning}
                      onChange={(e) => setFormData({ ...formData, has_captioning: e.target.checked })} />
                    <label htmlFor="has-captioning" className="check-item-label">My content includes captions</label>
                  </div>
                </div>
              )}

              <h2 className="section-heading">Brag About Yourself!</h2>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="credentials-input" className="form-label">Credentials &amp; Certifications</label>
                {credentials.length > 0 && <TagChips tags={credentials} onRemove={(t) => removeTag(t, credentials, setCredentials)} />}
                <input id="credentials-input" type="text" className="form-input" value={credentialInput}
                  onChange={(e) => setCredentialInput(e.target.value)}
                  onKeyDown={(e) => handleTagKey(e, credentialInput, credentials, setCredentials, setCredentialInput)}
                  onBlur={() => { if (credentialInput.trim()) addTag(credentialInput, credentials, setCredentials, setCredentialInput); }}
                  placeholder="Type a credential and press Enter…" aria-describedby="credentials-hint" />
                <p id="credentials-hint" className="form-hint">Press Enter to add. Add as many as you like.</p>
                <SuggestionButtons suggestions={CREDENTIAL_SUGGESTIONS} current={credentials}
                  onAdd={(s) => addTag(s, credentials, setCredentials, setCredentialInput)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="years-exp" className="form-label">Years of Experience</label>
                  <select id="years-exp" className="form-input" value={formData.years_of_experience}
                    onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}>
                    <option value="">Select…</option>
                    {YEARS_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="languages" className="form-label form-label-required">Languages</label>
                  <input id="languages" type="text" className="form-input" placeholder="e.g., ASL, English, Spanish"
                    required aria-required="true" aria-describedby="languages-hint"
                    value={languages} onChange={(e) => setLanguages(e.target.value)} />
                  <p id="languages-hint" className="form-hint">Separate with commas</p>
                </div>
              </div>

            </>)}

            {/* ════════════════════════════════════════
                BUSINESS SECTIONS
            ════════════════════════════════════════ */}
            {profileType === 'business' && (<>

              <h2 className="section-heading">About Your Business</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="full-name" className="form-label form-label-required">Business Name</label>
                  <input id="full-name" type="text" className="form-input" required aria-required="true"
                    autoComplete="organization" value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="display-name" className="form-label">Short Name / DBA</label>
                  <input id="display-name" type="text" className="form-input" placeholder="If different from business name"
                    value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="email" className="form-label form-label-required">Contact Email</label>
                <input id="email" type="email" className="form-input" required aria-required="true" autoComplete="email"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                <div className="check-item" style={{ marginTop: '0.5rem', minHeight: 'auto' }}>
                  <input id="email-public" type="checkbox" checked={formData.email_public}
                    onChange={(e) => setFormData({ ...formData, email_public: e.target.checked })} />
                  <label htmlFor="email-public" className="check-item-label" style={{ fontSize: '0.875rem' }}>
                    Show this email on our listing (visible to fellow members only)
                  </label>
                </div>
              </div>

              <h2 className="section-heading">Where Are You?</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="city" className="form-label form-label-required">City</label>
                  <input id="city" type="text" className="form-input" required aria-required="true" autoComplete="address-level2"
                    value={formData.location_city} onChange={(e) => setFormData({ ...formData, location_city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="state" className="form-label form-label-required">State / Province</label>
                  <input id="state" type="text" className="form-input" placeholder="e.g., CA, NY"
                    required aria-required="true" autoComplete="address-level1" value={formData.location_state}
                    onChange={(e) => setFormData({ ...formData, location_state: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="country" className="form-label form-label-required">Country</label>
                  <input id="country" type="text" className="form-input" placeholder="e.g., United States"
                    required aria-required="true" autoComplete="country-name" value={formData.location_country}
                    onChange={(e) => setFormData({ ...formData, location_country: e.target.value })} />
                </div>
              </div>

              <h2 className="section-heading">What You Do</h2>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="business-type-input" className="form-label form-label-required">Type of Business</label>
                {businessTypes.length > 0 && <TagChips tags={businessTypes} onRemove={(t) => removeTag(t, businessTypes, setBusinessTypes)} />}
                <input id="business-type-input" type="text" className="form-input" value={businessTypeInput}
                  onChange={(e) => setBusinessTypeInput(e.target.value)}
                  onKeyDown={(e) => handleTagKey(e, businessTypeInput, businessTypes, setBusinessTypes, setBusinessTypeInput)}
                  onBlur={() => { if (businessTypeInput.trim()) addTag(businessTypeInput, businessTypes, setBusinessTypes, setBusinessTypeInput); }}
                  placeholder="Type and press Enter…" aria-describedby="biz-type-hint"
                  aria-required="true" />
                <p id="biz-type-hint" className="form-hint">Press Enter to add. Add as many as apply.</p>
                <SuggestionButtons suggestions={BUSINESS_TYPE_SUGGESTIONS} current={businessTypes}
                  onAdd={(s) => addTag(s, businessTypes, setBusinessTypes, setBusinessTypeInput)} />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="services" className="form-label">Services Provided</label>
                <textarea id="services" className="form-input form-textarea" rows={4}
                  placeholder="Describe what your business offers…"
                  value={servicesProvided} onChange={(e) => setServicesProvided(e.target.value)} />
              </div>

              <h2 className="section-heading">Accessibility</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                What accessibility features does your business offer?
              </p>

              <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1rem' }}>
                <legend className="sr-only">Preset accessibility features</legend>
                <div className="check-grid">
                  {ACCESSIBILITY_PRESET_OPTIONS.map((f) => (
                    <label key={f} className="check-item">
                      <input type="checkbox" checked={accessibilityFeatures.includes(f)}
                        onChange={() => togglePresetAccessibility(f)} />
                      <span className="check-item-label">{f}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="custom-access-input" className="form-label">Add others</label>
                {accessibilityFeatures.filter((f) => !ACCESSIBILITY_PRESET_OPTIONS.includes(f)).length > 0 && (
                  <TagChips
                    tags={accessibilityFeatures.filter((f) => !ACCESSIBILITY_PRESET_OPTIONS.includes(f))}
                    onRemove={(t) => removeTag(t, accessibilityFeatures, setAccessibilityFeatures)}
                  />
                )}
                <input id="custom-access-input" type="text" className="form-input" value={customAccessInput}
                  onChange={(e) => setCustomAccessInput(e.target.value)}
                  onKeyDown={(e) => handleTagKey(e, customAccessInput, accessibilityFeatures, setAccessibilityFeatures, setCustomAccessInput)}
                  onBlur={() => { if (customAccessInput.trim()) addTag(customAccessInput, accessibilityFeatures, setAccessibilityFeatures, setCustomAccessInput); }}
                  placeholder="e.g., Quiet Hours, Large Print Menus…" aria-describedby="custom-access-hint" />
                <p id="custom-access-hint" className="form-hint">Press Enter to add.</p>
              </div>

            </>)}

            {/* ════════════════════════════════════════
                VOLUNTEERING (individual only)
            ════════════════════════════════════════ */}
            {profileType === 'individual' && (
              <>
                <h2 className="section-heading">Volunteering</h2>
                <p className="form-hint" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                  Are you open to volunteering your services for the right gig, like a low-income
                  community project, a grassroots arts org, or a cause you believe in? This is
                  totally optional and you can change your answer anytime.
                </p>

                <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.25rem' }}>
                  <legend className="form-label" style={{ marginBottom: '0.625rem' }}>
                    Are you open to volunteering your skills?
                  </legend>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="volunteer_status"
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
                      name="volunteer_status"
                      value="no"
                      checked={volunteerStatus === 'no'}
                      onChange={() => setVolunteerStatus('no')}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Not at this time</span>
                  </label>
                </fieldset>

                {volunteerStatus === 'yes' && (
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="volunteer-notes" className="form-label">
                      Examples of your volunteer work (optional)
                    </label>
                    <textarea
                      id="volunteer-notes"
                      className="form-input form-textarea"
                      rows={3}
                      placeholder="e.g., I've interpreted for community theater orgs and grassroots disability arts events…"
                      value={volunteerNotes}
                      onChange={(e) => setVolunteerNotes(e.target.value)}
                    />
                    <p className="form-hint">This will appear on your profile so others can see your community involvement.</p>
                  </div>
                )}
              </>
            )}

            {/* ════════════════════════════════════════
                SHARED SECTIONS
            ════════════════════════════════════════ */}

            <h2 className="section-heading">Find Me Online</h2>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="website" className="form-label">Website</label>
              <input id="website" type="url" className="form-input" placeholder="https://"
                autoComplete="url" value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label htmlFor="linkedin" className="form-label">LinkedIn</label>
                <input id="linkedin" type="url" className="form-input" placeholder="https://linkedin.com/in/…"
                  value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="instagram" className="form-label">Instagram</label>
                <input id="instagram" type="url" className="form-input" placeholder="https://instagram.com/…"
                  value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} />
              </div>
            </div>

            <h2 className="section-heading">Anything Else?</h2>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label htmlFor="notes" className="form-label">Notes for us</label>
              <textarea id="notes" className="form-input form-textarea" rows={3}
                placeholder="Anything you'd like us to know…"
                value={formData.submission_notes} onChange={(e) => setFormData({ ...formData, submission_notes: e.target.value })} />
            </div>

            <h2 className="section-heading">Tester Feedback</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
              Your answers here will directly shape what this platform becomes. Thank you for helping us build it!
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="tester-self" className="form-label form-label-required">
                Is there anything else you&apos;d like to share about yourself that would make this a better showcase of your talents?
              </label>
              <textarea id="tester-self" className="form-input form-textarea" rows={3}
                required aria-required="true"
                placeholder="Skills, achievements, context - anything that's missing from the form above…"
                value={testerSelfDescription} onChange={(e) => setTesterSelfDescription(e.target.value)} />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="tester-collab" className="form-label form-label-required">
                When looking for collaborators, what would be most helpful to know about others that isn&apos;t already captured here?
              </label>
              <textarea id="tester-collab" className="form-input form-textarea" rows={3}
                required aria-required="true"
                placeholder="e.g., availability, project types, preferred communication style…"
                value={testerCollaboratorInfo} onChange={(e) => setTesterCollaboratorInfo(e.target.value)} />
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1.5rem' }}>
              <legend className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                If the infrastructure were in place, which of the following would you be interested in participating in? Select all that apply.
              </legend>
              <div className="check-grid">
                {COMMUNITY_FEATURES.map((f) => (
                  <label key={f} className="check-item">
                    <input type="checkbox" checked={testerFeatureInterests.includes(f)} onChange={() => toggleFeature(f)} />
                    <span className="check-item-label">{f}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label htmlFor="tester-other" className="form-label">Any other suggestions, questions, or great ideas?</label>
              <textarea id="tester-other" className="form-input form-textarea" rows={3}
                placeholder="We're all ears…"
                value={testerOtherFeedback} onChange={(e) => setTesterOtherFeedback(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: '1 1 auto' }}
                disabled={loading} aria-busy={loading}>
                {loading ? <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Submitting…</> : 'Submit Test'}
              </button>
              <Link href="/" className="btn btn-ghost">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  </BrowserChrome>
  );
}
