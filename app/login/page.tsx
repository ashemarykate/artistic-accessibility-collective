'use client';
import Logo from '@/components/Logo';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');
  const [mode, setMode] = useState<'login' | 'magic'>('magic');

  // Show an error message if redirected here with ?error=profile_not_linked
  useEffect(() => {
    if (searchParams.get('error') === 'profile_not_linked') {
      setMessage(
        "We signed you in but couldn't find your member profile. Please try your login link again, or email contact@artisticaccessibility.com for help."
      );
      setMessageType('error');
    }
  }, [searchParams]);

  const showMsg = (text: string, type: 'info' | 'error' = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  // Routes a logged-in user based on role and member type.
  const routeAfterLogin = async (userId: string) => {
    const [{ data: adminData }, { data: profileData }] = await Promise.all([
      supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('member_type').eq('user_id', userId).maybeSingle(),
    ]);

    if (adminData) {
      router.push('/admin');
    } else if (profileData?.member_type === 'access_card') {
      router.push('/');
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    showMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Link profile to user if not yet linked
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: unlinked } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.email)
          .is('user_id', null)
          .eq('status', 'approved')
          .single();

        if (unlinked) {
          await supabase
            .from('profiles')
            .update({ user_id: user.id })
            .eq('id', unlinked.id);
        }

        await routeAfterLogin(user.id);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      showMsg(err.message || 'Could not log in. Please check your email and password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showMsg('Please enter your email address.', 'error');
      return;
    }
    setLoading(true);
    showMsg('');

    try {
      // Before sending a link, verify this email belongs to an approved member.
      // Uses a SECURITY DEFINER function to bypass RLS — the anon client
      // can't query profiles directly when public_visible = false.
      const normalizedEmail = email.trim().toLowerCase();

      const { data: approved } = await supabase
        .rpc('is_approved_email', { lookup_email: normalizedEmail });

      if (!approved) {
        showMsg(
          "We don't have an approved account for that email address. If you applied recently, your profile may still be under review. Questions? Email contact@artisticaccessibility.com.",
          'error',
        );
        setLoading(false);
        return;
      }

      // Send the user back to /auth/callback after they click the link;
      // the callback page reads the session and routes them to /admin or /dashboard.
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      showMsg("We've sent a login link to your email. Check your inbox (and spam just in case).");
    } catch (err: any) {
      showMsg(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrowserChrome variant="ie3" title="Log In — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/login">
    <main style={{ background: 'var(--aac-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
      <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '0', display: 'inline-block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Logo height={72} />
      </Link>

      <div className="content-card" style={{ maxWidth: '440px', width: '100%' }}>
        <h1 style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>
          Log In
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', marginBottom: '1.75rem' }}>
          welcome back
        </p>

        {/* Mode toggle */}
        <div
          role="group"
          aria-label="Login method"
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--aac-blue-light)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}
        >
          <button
            type="button"
            onClick={() => setMode('magic')}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: mode === 'magic' ? 'var(--aac-blue)' : 'transparent',
              color: mode === 'magic' ? 'var(--aac-white)' : 'var(--aac-blue)',
              border: 'none',
            }}
            aria-pressed={mode === 'magic'}
          >
            Email Link
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: mode === 'login' ? 'var(--aac-blue)' : 'transparent',
              color: mode === 'login' ? 'var(--aac-white)' : 'var(--aac-blue)',
              border: 'none',
            }}
            aria-pressed={mode === 'login'}
          >
            Password
          </button>
        </div>

        {mode === 'magic' ? (
          <form onSubmit={handleMagicLink} noValidate>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="email-magic" className="form-label form-label-required">
                Email Address
              </label>
              <input
                id="email-magic"
                type="email"
                className="form-input"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending…</>
              ) : (
                'Send Login Link'
              )}
            </button>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
              We&apos;ll email you a one-click login link. No password needed.
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin} noValidate>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="email-pw" className="form-label form-label-required">
                Email Address
              </label>
              <input
                id="email-pw"
                type="email"
                className="form-input"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="password" className="form-label form-label-required">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Logging in…</>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        )}

        {message && (
          <div
            className={`alert ${messageType === 'error' ? 'alert-error' : 'alert-info'}`}
            role="alert"
            aria-live="polite"
            style={{ marginTop: '1rem' }}
          >
            {message}
          </div>
        )}

        <hr className="divider" />

        <div style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/access-card/signup" style={{ color: 'var(--aac-blue)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'underline' }}>
            Get a free Access Card
          </Link>
          <Link href="/submit" style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', textDecoration: 'underline' }}>
            Have an invite code? Join the Collective
          </Link>
        </div>

        <p style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'underline' }}>
            ← Back to Home
          </Link>
        </p>
      </div>
    </main>
  </BrowserChrome>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
