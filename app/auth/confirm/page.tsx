'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

/**
 * Scanner-proof sign-in landing page.
 *
 * Login emails link here with ?token_hash=…&type=… instead of linking to
 * Supabase's one-time /verify endpoint directly. Email security scanners
 * "pre-click" links in emails, and a direct /verify link is consumed by that
 * pre-click, so real people were landing on "expired link" errors seconds
 * after the email arrived.
 *
 * This page holds the token until a real person presses the button, then
 * exchanges it with verifyOtp(). Scanners fetch the page address but do not
 * press buttons, so the token survives until the actual member uses it.
 *
 * After sign-in it runs the same steps as /auth/callback: link the auth user
 * to their profile row if needed, then route by role and member type.
 */
function ConfirmSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'ready' | 'working' | 'error'>('ready');
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const tokenHash = searchParams.get('token_hash') || '';
  // 'magiclink' for links from the admin Send Login Email flow and the
  // Supabase magic-link template; 'email' is the newer template default.
  const type = (searchParams.get('type') || 'magiclink') as 'magiclink' | 'email';

  useEffect(() => {
    document.title = 'Finish signing in · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleConfirm = async () => {
    setStatus('working');
    setError('');

    const { data, error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (verifyError || !data.session) {
      setStatus('error');
      setError(
        "That sign-in link has expired or was already used. Head back to the login page and request a fresh one; they only last a short while."
      );
      return;
    }

    // First-time sign-in: connect this login to the member's profile row.
    await supabase.rpc('link_profile_to_auth_user');

    const userId = data.session.user.id;
    const [{ data: adminData }, { data: profileData }] = await Promise.all([
      supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('member_type').eq('user_id', userId).maybeSingle(),
    ]);

    if (adminData) {
      router.replace('/admin');
    } else if (profileData?.member_type === 'access_card') {
      router.replace('/');
    } else {
      router.replace('/dashboard');
    }
  };

  if (!tokenHash) {
    return (
      <BrowserChrome variant="ie3" title="Sign-in · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/auth/confirm">
      <main className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
        <div className="content-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <h1 ref={headingRef} tabIndex={-1} style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.5rem', marginBottom: '0.75rem', outline: 'none' }}>
            Something&apos;s missing
          </h1>
          <p className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
            This page needs a sign-in link from your email to work. Head to the login page to request one.
          </p>
          <Link href="/login" className="btn btn-primary btn-full">Go to login</Link>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="ie3" title="Finish signing in · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/auth/confirm">
    <main className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
      <div className="content-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <h1 ref={headingRef} tabIndex={-1} style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.5rem', marginBottom: '0.75rem', outline: 'none' }}>
          {status === 'error' ? "Sign-in didn't finish" : 'Almost there!'}
        </h1>

        {status === 'error' ? (
          <>
            <p className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
              {error}
            </p>
            <Link href="/login" className="btn btn-primary btn-full">Back to login</Link>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              One more click and you&apos;re in. This extra step keeps your sign-in link safe from email scanners.
            </p>
            <button
              onClick={handleConfirm}
              disabled={status === 'working'}
              aria-busy={status === 'working'}
              className="btn btn-primary btn-full btn-lg"
            >
              {status === 'working'
                ? <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing you in…</>
                : 'Finish Signing In'}
            </button>
          </>
        )}
      </div>
    </main>
    </BrowserChrome>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <main className="loading-screen" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <p>Loading…</p>
      </main>
    }>
      <ConfirmSignIn />
    </Suspense>
  );
}
