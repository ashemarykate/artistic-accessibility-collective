'use client';
import Logo from '@/components/Logo';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

export default function AccessCardSignup() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [bio, setBio]         = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [errors, setErrors]   = useState<{ name?: string; email?: string; bio?: string; form?: string }>({});

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
      // Check if a profile already exists for this email
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

      // Create the Access Card profile row (approved immediately — no review needed)
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          full_name:    name.trim(),
          email:        normalizedEmail,
          bio:          bio.trim() || null,
          member_type:  'access_card',
          status:       'approved',
          public_visible: false,   // Access Card members aren't in the public directory
          willing_to_travel: false,
        });

      if (insertError) throw insertError;

      // Send the magic link — callback will link auth user → profile row
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (otpError) throw otpError;

      setDone(true);
    } catch (err: any) {
      setErrors({ form: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <BrowserChrome variant="ie3" title="Access Card — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/access-card/signup">
      <main style={{ background: 'var(--aac-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
        <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '0', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Logo height={72} />
        </Link>

        <div className="content-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          {/* Library card stamp */}
          <div aria-hidden="true" style={{
            display: 'inline-block',
            border: '3px solid var(--aac-blue)',
            borderRadius: 4,
            padding: '6px 14px',
            marginBottom: '1.25rem',
            transform: 'rotate(-2deg)',
            color: 'var(--aac-blue)',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            opacity: 0.85,
          }}>
            CARD ISSUED
          </div>
          <h1 style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Your card is on the way!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            We sent a sign-in link to <strong>{email}</strong>. Click it to activate your Access Card and set up your profile.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Check your spam folder if you don&apos;t see it within a minute.
          </p>
          <hr className="divider" />
          <Link href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'underline' }}>
            ← Back to Home
          </Link>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="ie3" title="Get an Access Card — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/access-card/signup">
    <main style={{ background: 'var(--aac-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
      <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '0', display: 'inline-block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Logo height={72} />
      </Link>

      <div className="content-card" style={{ maxWidth: '440px', width: '100%' }}>
        <h1 style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>
          Get an Access Card
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', marginBottom: '1.75rem' }}>
          free and open to everyone
        </p>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          An Access Card lets you save resources and build your personal library. No application, no review. Just sign up and go.
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
    </main>
    </BrowserChrome>
  );
}
