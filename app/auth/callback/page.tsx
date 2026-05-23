'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

/**
 * Magic-link landing page.
 *
 * When a user clicks the link in their email, Supabase redirects them here
 * with the access token in the URL hash. The Supabase client auto-detects
 * the hash and establishes the session. We then look up whether the user
 * is an admin and forward them to the right place — or surface a clear
 * error message if anything went wrong.
 *
 * Hash-based tokens never appear in URLs the user sees for long: we
 * `router.replace()` to a clean URL as soon as we know where to go.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const finishSignIn = async () => {
      // Give Supabase a tick to consume the hash and establish the session.
      const { data: sessionData } = await supabase.auth.getSession();

      // If the session didn't establish (expired link, malformed URL, etc.)
      // the user is stuck — give them a clear path back instead of a blank page.
      if (!sessionData.session) {
        if (!cancelled) {
          setError(
            "We couldn't sign you in. The link may have expired or already been used. Try requesting a new one.",
          );
        }
        return;
      }

      const userId = sessionData.session.user.id;

      // Link any pending profile to this user account, same as password login.
      const userEmail = sessionData.session.user.email;
      if (userEmail) {
        const { data: unlinked } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .is('user_id', null)
          .eq('status', 'approved')
          .maybeSingle();

        if (unlinked) {
          await supabase.from('profiles').update({ user_id: userId }).eq('id', unlinked.id);
        }
      }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;
      router.replace(adminData ? '/admin' : '/members');
    };

    finishSignIn();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <main className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', minHeight: '100vh' }}>
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
    );
  }

  return (
    <main
      className="loading-screen"
      role="status"
      aria-live="polite"
    >
      <span className="spinner" aria-hidden="true" />
      <p>Signing you in…</p>
    </main>
  );
}
