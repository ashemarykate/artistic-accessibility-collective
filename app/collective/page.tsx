'use client';
import Logo from '@/components/Logo';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import BrowserChrome from '@/components/BrowserChrome';

export default function Collective() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIsLoggedIn(true);
    });
  }, []);

  useEffect(() => {
    return () => {
    };
  }, []);

  return (
    <BrowserChrome variant="netscape" title="Artistic Accessibility Collective · Welcome" url="http://www.artisticaccessibility.com/collective">
    <main aria-label="Artistic Accessibility Collective, Welcome">
      <section
        aria-label="Welcome"
        style={{ background: 'var(--aac-blue)', minHeight: '100%', padding: '4rem 1.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
          {/* Logo is the h1 — alt text is read as the page title by screen readers */}
          <h1 style={{ margin: '0 0 2.5rem' }}>
            <Logo
              alt="Artistic Accessibility Collective: the name is set in bold, chunky hand-lettered block letters with a warm, playful energy, paired with the tagline 'together, together' in a loose, flowing handwritten script"
              style={{ width: '100%', maxWidth: '900px', height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </h1>

          {/* Nav buttons */}
          <nav aria-label="Main actions">
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <Link href="/submit" className="btn btn-on-blue btn-lg">
                  Have an Invite Code? Join Here
                </Link>
              </li>
              <li>
                <Link href="/access-card/signup" className="btn btn-outline-white btn-lg">
                  Get an Access Card
                </Link>
              </li>
              <li>
                <Link href="/login" className="btn btn-outline-white btn-lg">
                  Log In
                </Link>
              </li>
              <li>
                <Link href="/contact" className="btn btn-outline-white btn-lg">
                  Contact Us
                </Link>
              </li>
            </ul>
          </nav>

          {/* Logged-in shortcut to your own hub */}
          {isLoggedIn && (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/dashboard" className="btn btn-on-blue btn-lg">
                Go to My Collective →
              </Link>
              <Link
                href="/my-resources"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '0.875rem',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                ♥ Open my saved resources
              </Link>
            </div>
          )}

          {/* Secondary links — low visual priority but fully accessible */}
          <ul
            aria-label="Additional links"
            style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', listStyle: 'none', padding: 0 }}
          >
            <li>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>
                Home
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
    </BrowserChrome>
  );
}
