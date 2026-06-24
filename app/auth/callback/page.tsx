'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

/**
 * Magic-link landing page.
 *
 * When a user clicks their login email, Supabase redirects here with a PKCE
 * code in the query string (?code=…). We exchange it explicitly for a session
 * rather than relying on the async auto-detection in the Supabase client, which
 * can race with getSession() and accidentally return the previously-cached
 * session instead of the freshly-minted one.
 *
 * After the session is established we:
 *   1. Link the user's auth ID to their profiles row if it isn't linked yet
 *      (first-time magic-link sign-in; the RLS policy allows this when
 *       user_id IS NULL and email matches auth.jwt()->>'email').
 *   2. Forward them to /admin or /dashboard depending on their role.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const finishSignIn = async () => {
      // ── 1. Get a valid session ──────────────────────────────────────────────
      // Prefer the PKCE code from the URL (set by Supabase when emailRedirectTo
      // is used). Fall back to getSession() in case the client already handled
      // the exchange (e.g. hash-based implicit flow fallback).
      let session = null;

      const code = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('code')
        : null;

      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !data.session) {
          if (!cancelled) {
            setError(
              "We couldn't sign you in. The link may have expired or already been used. Try requesting a new one.",
            );
          }
          return;
        }
        session = data.session;
      } else {
        // No code param — maybe already exchanged (hash flow) or something else
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData.session;
      }

      if (!session) {
        if (!cancelled) {
          setError(
            "We couldn't sign you in. The link may have expired or already been used. Try requesting a new one.",
          );
        }
        return;
      }

      // ── 2. Link profile to auth user (first magic-link sign-in) ───────────
      // The profiles row is created during registration with user_id = NULL.
      // We use a SECURITY DEFINER RPC that bypasses RLS — direct SELECT+UPDATE
      // from the client fails because no SELECT policy covers unlinked profiles.
      const userId = session.user.id;

      await supabase.rpc('link_profile_to_auth_user');

      // ── 3. Route to the right place ────────────────────────────────────────
      // Check admin first, then member_type to distinguish Collective vs Access Card.
      const [{ data: adminData }, { data: profileData }] = await Promise.all([
        supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('member_type').eq('user_id', userId).maybeSingle(),
      ]);

      if (cancelled) return;

      if (adminData) {
        router.replace('/admin');
      } else if (profileData?.member_type === 'access_card') {
        router.replace('/');   // Access Card members land on home; nav shows their card link
      } else {
        router.replace('/dashboard');
      }
    };

    finishSignIn();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <BrowserChrome variant="ie3" title="Sign-in · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/auth/callback">
      <main className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100%' }}>
        <div className="content-card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
            Sign-in didn&apos;t finish
          </h1>
          <p className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
            {error}
          </p>
          <Link href="/login" className="btn btn-primary btn-full">Back to login</Link>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="ie3" title="Signing in… · Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/auth/callback">
    <main
      className="loading-screen"
      role="status"
      aria-live="polite"
    >
      <span className="spinner" aria-hidden="true" />
      <p>Signing you in…</p>
    </main>
    </BrowserChrome>
  );
}
