import Link from 'next/link';

export default function Home() {
  return (
    <main
      aria-label="Artistic Accessibility Collective — Home"
      style={{ background: 'var(--aac-blue)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}
    >
      {/* Landing image — the full Canva design, scales to fit any screen */}
      <h1 style={{ margin: '0 0 2.5rem' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/landing.png"
          alt="Artistic Accessibility Collective — training &amp; staffing, art, resources, education, join us, consulting — together, together"
          style={{ width: '100%', maxWidth: '860px', height: 'auto', display: 'block', margin: '0 auto' }}
        />
      </h1>

      {/* Nav buttons */}
      <nav aria-label="Main actions">
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', listStyle: 'none', padding: 0, margin: 0 }}>
          <li>
            <Link href="/submit" className="btn btn-on-blue btn-lg">
              Test the Registry
            </Link>
          </li>
          <li>
            <Link href="/login" className="btn btn-outline-white btn-lg">
              Member Login
            </Link>
          </li>
          <li>
            <Link href="/contact" className="btn btn-outline-white btn-lg">
              Contact Us
            </Link>
          </li>
        </ul>
      </nav>

      {/* Contact email — real link for accessibility and search engines (also shown in the image) */}
      <p style={{ marginTop: '1.5rem' }}>
        <a
          href="mailto:contact@artisticaccessibility.com"
          style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8125rem', textDecoration: 'underline', letterSpacing: '0.08em' }}
        >
          contact@artisticaccessibility.com
        </a>
      </p>

      {/* Admin — hidden in plain sight */}
      <p style={{ marginTop: '0.5rem' }}>
        <Link href="/admin" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textDecoration: 'underline' }}>
          Admin
        </Link>
      </p>
    </main>
  );
}
