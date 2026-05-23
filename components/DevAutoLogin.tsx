'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Dev-only helper: automatically signs in as the test member account
 * when NEXT_PUBLIC_DEV_AUTO_LOGIN=true is set in .env.local.
 * Has no effect in production (the env var won't be set there).
 */
export function DevAutoLogin() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN !== 'true') return;

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return; // already logged in, nothing to do

      await supabase.auth.signInWithPassword({
        email: 'mk-member@artisticaccessibility.com',
        password: 'justtestit',
      });
    };

    run();
  }, []);

  return null;
}
