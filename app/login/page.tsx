'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');
  const [mode, setMode] = useState<'login' | 'magic'>('magic');

  const showMsg = (text: string, type: 'info' | 'error' = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  // Routes a logged-in user to /admin if they're an admin, otherwise /collective.
  const routeAfterLogin = async (userId: string) => {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    router.push(adminData ? '/admin' : '/collective');
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
        router.push('/collective');
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
      // Send the user back to /auth/callback after they click the link;
      // the callback page reads the session and routes them to /admin or /collective.
      const { error } = await supabase.auth.signInWithOtp({
        email,
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
    <main style={{ background: 'var(--aac-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100vh' }}>
      <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '0', display: 'inline-block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-across-blue-bg.svg" alt="Artistic Accessibility Collective" style={{ height: '72px', width: 'auto' }} />
      </Link>

      <div className="content-card" style={{ maxWidth: '440px', width: '100%' }}>
        <h1 style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>
          Member Login
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

        <p style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'underline' }}>
            ← Back to Home
          </Link>
        </p>
      </div>
    </main>
  );
}
