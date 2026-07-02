'use client';
import Logo from '@/components/Logo';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

export default function AccessCardSignup() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [bio, setBio]         = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [errors, setErrors]   = useState<{ name?: string; email?: string; form?: string }>({});
  const successRef            = useRef<HTMLHeadingElement>(null);
  const formRef               = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Get an Access Card · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    if (done) successRef.current?.focus();
  }, [done]);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim())  e.name  = 'Please enter your name or username.';
    if (!email.trim()) e.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Please enter a valid email address.';
    return e;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, member_type, status')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existing) {
        setErrors({ form: 'An account already exists for that email. Try logging in instead.' });
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          full_name:      name.trim(),
          email:          normalizedEmail,
          bio:            bio.trim() || null,
          member_type:    'access_card',
          status:         'approved',
          public_visible: false,
          willing_to_travel: false,
        });

      if (insertError) throw insertError;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (otpError) throw otpError;

      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrors({ form: message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <BrowserChrome variant="ie3" title="Access Card · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/access-card/signup">
        <main style={{ background: 'var(--aac-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
          <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ transform: 'rotate(-1.2deg)', marginBottom: '1.5rem', display: 'inline-block' }}>
            <Logo height={72} />
          </Link>
          <div className="content-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div aria-hidden="true" style={{ display: 'inline-block', border: '3px solid var(--aac-blue)', borderRadius: 4, padding: '6px 14px', marginBottom: '1.25rem', transform: 'rotate(-2deg)', color: 'var(--aac-blue)', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.85 }}>
              CARD ISSUED
            </div>
            <h1 ref={successRef} tabIndex={-1} style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', outline: 'none' }}>
              Your card is on the way!
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              We sent a sign-in link to <strong>{email}</strong>. Click it to activate your Access Card and get started.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Check your spam folder if you do not see it within a minute.
            </p>
            <hr className="divider" />
            <Link href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'underline' }}>
              Back to Home
            </Link>
          </div>
        </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="ie3" title="Get an Access Card · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/access-card/signup">
      <main style={{ background: 'var(--aac-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem 1rem 3rem', minHeight: '100%' }}>

        <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ transform: 'rotate(-1.2deg)', marginBottom: '1rem', display: 'inline-block' }}>
          <Logo height={72} />
        </Link>

        <div style={{ maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── What is an Access Card? ── */}
          <div className="content-card">
            <h1 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.75rem', marginBottom: '0.25rem', textAlign: 'center' }}>
              Get an Access Card
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', marginBottom: '1.5rem' }}>
              together, together
            </p>

            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-body)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              An Access Card is a free account for anyone who wants to engage with the Artistic Accessibility Collective website. You do not need to be an accessibility professional. If you care about arts accessibility, this is your home base.
            </p>

            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--aac-blue)', marginBottom: '0.875rem' }}>
              What you can do with an Access Card
            </h2>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                ['💾', 'Save resources, events, and art pieces to your personal library when you like them'],
                ['🎨', 'Add descriptions and contribute to community art projects like Image Description as Art'],
                ['💬', 'Comment on posts and discussions across the site'],
                ['📅', 'Bookmark events and get notified about what is happening in arts accessibility'],
                ['✨', 'More features are on the way as the community grows'],
              ].map(([icon, text]) => (
                <li key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-body)', lineHeight: 1.55 }}>
                  <span aria-hidden="true" style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Access Card vs. Collective Member ── */}
          <div className="content-card">
            <h2 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '1.25rem', marginBottom: '0.25rem', textAlign: 'center' }}>
              Access Card vs. Collective Member
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Not sure which one is for you? Here is how they are different.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

              {/* Access Card column */}
              <div style={{ background: '#f0f3ff', border: '2px solid var(--aac-blue-light)', borderRadius: 8, padding: '1.125rem 1.125rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🪪</span>
                  <h3 style={{ color: 'var(--aac-blue)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Access Card</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', lineHeight: 1.6, marginBottom: '0.875rem' }}>
                  For anyone who wants to explore, save, and interact with arts accessibility content. No professional background required.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    'Free, no application or review',
                    'Save and organize resources',
                    'Participate in community art projects',
                    'Comment and engage across the site',
                    'Not listed in the member directory',
                  ].map((item) => (
                    <li key={item} style={{ fontSize: '0.8125rem', color: 'var(--color-text-body)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.5 }}>
                      <span aria-hidden="true" style={{ color: 'var(--aac-blue)', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Collective Member column */}
              <div style={{ background: 'var(--aac-blue-light)', border: '2px solid var(--aac-blue)', borderRadius: 8, padding: '1.125rem 1.125rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>🌐</span>
                  <h3 style={{ color: 'var(--aac-blue)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Collective Member</h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', lineHeight: 1.6, marginBottom: '0.875rem' }}>
                  For accessibility service providers, accessibility-focused artists, and event and festival workers. We draw on Collective Members when matching for jobs and consulting projects.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    'Invite-only application during beta',
                    'Listed in the searchable member directory',
                    'Eligible for job and consulting connections',
                    'Public professional profile',
                    'All Access Card features included',
                  ].map((item) => (
                    <li key={item} style={{ fontSize: '0.8125rem', color: 'var(--color-text-body)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.5 }}>
                      <span aria-hidden="true" style={{ color: 'var(--aac-blue)', flexShrink: 0, marginTop: '0.1rem' }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/submit"
                  style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--aac-blue)', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Apply for a Collective Membership
                </Link>
              </div>

            </div>
          </div>

          {/* ── Sign-up form ── */}
          <div className="content-card">
            <h2
              ref={formRef}
              className="font-display"
              style={{ color: 'var(--aac-blue)', fontSize: '1.25rem', marginBottom: '0.25rem', textAlign: 'center' }}
            >
              Create Your Access Card
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Takes about two minutes. No password needed.
            </p>

            <form onSubmit={handleSignup} noValidate>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="ac-name" className="form-label form-label-required">
                  Name / Username
                </label>
                <input
                  id="ac-name"
                  type="text"
                  className="form-input"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'ac-name-error' : undefined}
                />
                {errors.name && (
                  <p id="ac-name-error" className="form-error" role="alert">{errors.name}</p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="ac-email" className="form-label form-label-required">
                  Email Address
                </label>
                <input
                  id="ac-email"
                  type="email"
                  className="form-input"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'ac-email-error' : undefined}
                />
                {errors.email && (
                  <p id="ac-email-error" className="form-error" role="alert">{errors.email}</p>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="ac-bio" className="form-label">
                  Short Bio <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(optional)</span>
                </label>
                <textarea
                  id="ac-bio"
                  className="form-input"
                  rows={3}
                  placeholder="A sentence or two about who you are and what you care about."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  You can always edit this on your card later.
                </p>
              </div>

              {errors.form && (
                <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                  {errors.form}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? (
                  <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating your card…</>
                ) : (
                  'Get My Access Card'
                )}
              </button>
            </form>

            <hr className="divider" />

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                Log in
              </Link>
            </p>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              Arts accessibility professional?{' '}
              <Link href="/submit" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
                Join the Collective instead
              </Link>
            </p>
          </div>

        </div>
      </main>
    </BrowserChrome>
  );
}
