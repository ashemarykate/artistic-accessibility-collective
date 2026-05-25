import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

export default function Collective() {
  return (
    <BrowserChrome variant="netscape" title="Artistic Accessibility Collective — Welcome" url="http://www.artisticaccessibility.com/collective">
    <main aria-label="Artistic Accessibility Collective — Welcome">
      <section
        aria-label="Welcome"
        style={{ background: 'var(--aac-blue)', minHeight: '100%', padding: '4rem 1.5rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
          {/* Logo is the h1 — alt text is read as the page title by screen readers */}
          <h1 style={{ margin: '0 0 2.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/wordmark.svg"
              alt="Artistic Accessibility Collective — the name is set in bold, chunky hand-lettered block letters with a warm, playful energy, paired with the tagline 'together, together' in a loose, flowing handwritten script"
              style={{ width: '100%', maxWidth: '900px', height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </h1>

          {/* Nav buttons — each has clear, descriptive text */}
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

          {/* Secondary links — low visual priority but fully accessible */}
          <ul
            aria-label="Additional links"
            style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', listStyle: 'none', padding: 0 }}
          >
            <li>
              <Link href="/admin" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>
                Admin
              </Link>
            </li>
            <li>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', textDecoration: 'underline' }}>
                Landing Page
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </BrowserChrome>
  );
}
