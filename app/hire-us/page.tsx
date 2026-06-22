'use client';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { useEffect } from 'react';
import BrowserChrome from '@/components/BrowserChrome';

export default function HireUsPage() {
  useEffect(() => {
    document.title = 'Hire Us · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  return (
    <BrowserChrome variant="aol" desktopBg="#0d1e4a" title="Hire Us — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/hire-us">
      <main style={{
        background: 'var(--aac-navy)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
      }}>
        <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '2rem', display: 'inline-block' }}>
          <Logo alt="" height={72} />
        </Link>

        <div className="content-card" style={{ maxWidth: '560px', width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}>
          <h1 className="font-display" style={{ color: 'var(--aac-blue)', fontSize: '2.5rem', lineHeight: 1.1, marginBottom: '1rem' }}>
            Hire Us
          </h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '1rem', marginBottom: '1.75rem' }}>
            Coming soon. Good things take time.
          </p>
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>

        <nav aria-label="Secondary" style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
          <Link href="/contact" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
        </nav>
      </main>
    </BrowserChrome>
  );
}
