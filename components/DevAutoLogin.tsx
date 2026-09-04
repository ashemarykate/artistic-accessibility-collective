'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Dev-only helper: automatically signs in as the test member account
 * when NEXT_PUBLIC_DEV_AUTO_LOGIN=true is set in .env.local, alongside
 * DEV_AUTO_LOGIN_EMAIL and DEV_AUTO_LOGIN_PASSWORD. The root layout never
 * mounts it in production, and the credentials never appear in code.
 *
 * IT MUST NOT RUN ON THE PAGES WHERE WHO YOU ARE IS THE POINT.
 *
 * It used to run everywhere, which quietly broke every attempt to sign in as
 * somebody else: pressing "Sign in as someone else" signs you out, lands you
 * on /login, and this fired before you could type, putting you straight back
 * in as the test member. From the outside that looks like the login flow
 * ignoring you. It cost a long debugging session, so the exclusion list below
 * is the actual fix, not a nicety.
 *
 * Excluded:
 *   /login      you are choosing an account
 *   /auth/*     a real sign in is completing
 *   /backstage  which account you are on decides what you can see
 */
const NEVER_AUTO_LOGIN = ['/login', '/auth', '/backstage'];

/**
 * The email and password arrive as props from the root layout, which reads
 * them from server-only env vars (DEV_AUTO_LOGIN_EMAIL / DEV_AUTO_LOGIN_PASSWORD
 * in .env.local) and only mounts this component outside production. Nothing
 * secret lives in this file, so nothing secret ends up in the client bundle.
 */
export function DevAutoLogin({ email, password }: { email?: string; password?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN !== 'true') return;
    if (!email || !password) return;
    if (NEVER_AUTO_LOGIN.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) return;

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return; // already logged in, nothing to do

      await supabase.auth.signInWithPassword({ email, password });
    };

    run();
  }, [pathname, email, password]);

  return null;
}
