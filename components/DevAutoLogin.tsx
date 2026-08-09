'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Dev-only helper: automatically signs in as the test member account
 * when NEXT_PUBLIC_DEV_AUTO_LOGIN=true is set in .env.local.
 * Has no effect in production (the env var won't be set there).
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

export function DevAutoLogin() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN !== 'true') return;
    if (NEVER_AUTO_LOGIN.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) return;

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return; // already logged in, nothing to do

      await supabase.auth.signInWithPassword({
        email: 'mk-member@artisticaccessibility.com',
        password: 'justtestit',
      });
    };

    run();
  }, [pathname]);

  return null;
}
