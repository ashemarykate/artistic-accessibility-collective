'use client';
import Logo from '@/components/Logo';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { routeAfterAuth, takeAfterLogin, rememberAfterLogin } from '@/lib/after-login';
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

  // Arrived here from somewhere that wants us back. Hold onto it so the magic
  // link form and the password form both honour it.
  useEffect(() => {
    const next = searchParams.get('next');
    if (next) rememberAfterLogin(next);
  }, [searchParams]);

  useEffect(() => {
    document.title = 'Login · Artistic Accessibility Collective';
    return () => {
      document.title = 'Artistic Accessibility Collective';
    };
  }, []);

  /** Arrived from a Backstage link. Worth saying so: otherwise a cast member
   *  who has never used the Collective lands on a Collective login page with
   *  no idea whether they are in the right place. */
  const headedBackstage = (searchParams.get('next') ?? '').startsWith('/backstage');

  const showMsg = (text: string, type: 'info' | 'error' = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  // Shared with /auth/confirm and /auth/callback so all three sign in paths
  // agree, and so an intended destination cannot be honoured by only one.
  const routeAfterLogin = (userId: string) => routeAfterAuth(router, userId);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    showMsg('');

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = signInData.user;
      if (user) {
        // Link profile to user if not yet linked. Uses the same SECURITY
        // DEFINER function as the magic-link flow: a direct SELECT+UPDATE
        // from the client can't see unlinked rows under RLS.
        await supabase.rpc('link_profile_to_auth_user');

        await routeAfterLogin(user.id);
      } else {
        // Defensive: supabase-js returns a user whenever error is null, so this
        // should not fire. Honour a requested destination anyway rather than
        // reintroducing a fourth place that ignores it.
        router.push(takeAfterLogin() ?? '/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showMsg(message || 'Could not log in. Please check your email and password.', 'error');
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

      // Approved Collective members AND anyone on a production team. Being on
      // a show does not require Collective membership, so checking only
      // profiles turned half of a company away at their own door.
      const { data: allowed } = await supabase
        .rpc('can_request_login_link', { lookup_email: normalizedEmail });

      if (!allowed) {
        showMsg(
          "We don't have an account for that email address. If you applied to the Collective recently your profile may still be under review, and if somebody added you to a show, check with them which address they used. Questions? Email contact@artisticaccessibility.com.",
          'error',
        );
        setLoading(false);
        return;
      }

      // Send the user back to /auth/callback after they click the link;
      // the callback page reads the session and routes them to /admin or /dashboard.
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
            + (searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next')!)}` : ''),
        },
      });
      if (error) throw error;
      showMsg("We've sent a login link to your email. Check your inbox (and spam just in case).");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showMsg(message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrowserChrome variant="ie3" title="Log In · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/login">
    <main style={{ background: 'var(--aac-blue)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
      <Link href="/" aria-label="Artistic Accessibility Collective, home" style={{ marginBottom: '0', display: 'inline-block', transform: 'rotate(-1.2deg)' }}>
        <Logo height={72} />
      </Link>

      <div className="content-card" style={{ maxWidth: '440px', width: '100%' }}>
        <h1 style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>
          Log in to The Collective
        </h1>
        {headedBackstage && (
          <p style={{
            margin: '0.5rem 0 0', padding: '0.6rem 0.8rem', borderRadius: 4,
            background: 'var(--aac-blue-light)', color: 'var(--aac-blue-dark)',
            fontSize: '0.9rem',
          }}>
            Signing in to <strong>Backstage</strong>. Use the address whoever added
            you to the show used. You do not need a Collective profile.
          </p>
        )}
        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', marginBottom: '1.75rem' }}>
          together, together
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
