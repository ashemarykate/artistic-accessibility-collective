'use client';
import Logo from '@/components/Logo';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

const LIST_IDEAS = [
  { id: 'specialty',   label: 'Members by specialty or profession' },
  { id: 'location',    label: 'Members by city or region' },
  { id: 'language',    label: 'Members by language' },
  { id: 'worked-with', label: "People I've worked with before" },
  { id: 'hire',        label: 'Members available for hire' },
  { id: 'follow-up',   label: 'People I want to follow up with' },
  { id: 'mentors',     label: "Mentors or people I'm learning from" },
  { id: 'events',      label: 'Who I met at a specific event' },
];

export default function MyListsPage() {
  const router = useRouter();
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<string[]>([]);
  const [other,     setOther]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    document.title = 'My Lists · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setLoading(false);
    });
  }, [router]);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = [
      selected.map(id => LIST_IDEAS.find(l => l.id === id)?.label).filter(Boolean).join(', '),
      other.trim() ? `Other: ${other.trim()}` : '',
    ].filter(Boolean).join(' | ');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    'My Lists Feedback',
          email:   'feedback@internal',
          message: body || '(no selections made)',
          subject: 'My Lists: member feedback',
        }),
      });

      if (!response.ok) throw new Error('Failed to send feedback');

      setSubmitted(true);
    } catch (err) {
      console.error('Error sending My Lists feedback:', err);
      setError('Something went wrong sending your feedback. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BrowserChrome variant="netscape" title="My Lists · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/my-lists">
      <main className="page-wrapper">
        <div className="loading-screen" role="status" aria-label="Loading">
          <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
          <span>Loading…</span>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="netscape" title="My Lists · Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/my-lists">
    <main className="page-wrapper">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="site-header">
        <Link href="/dashboard" className="site-header-logo" aria-label="Artistic Accessibility Collective, home">
          <Logo alt="" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/dashboard"    className="nav-link">My Collective</Link>
          <Link href="/members" className="nav-link">Directory</Link>
          <Link href="/resources"  className="nav-link">Resources</Link>
        </nav>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 620, margin: '32px auto', padding: '0 16px 48px' }}>

        <div className="ms-box">
          <div className="ms-box-header">
            <h1 style={{ margin: 0, padding: 0, fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', fontFamily: 'inherit' }}>
              My Lists: Coming Soon
            </h1>
            <span style={{ fontSize: '0.6875rem', background: 'var(--aac-yellow)', color: 'var(--aac-navy)', padding: '1px 7px', borderRadius: '999px', fontWeight: 700, transform: 'rotate(-2deg)', display: 'inline-block' }}>
              Coming Soon
            </span>
          </div>

          <div style={{ padding: '20px' }}>

            {/* Concept explanation */}
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text)', lineHeight: 1.6, marginBottom: '12px' }}>
              <strong>My Lists</strong> will let you build your own custom collections of Collective members,
              so the people you work with, want to hire, or just want to keep tabs on are always one click away.
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
              Think of it like your own personal Rolodex inside the directory. Filter by specialty, location,
              language, availability, or just make a list called {'"people I want to collaborate with someday"'}
              and add whoever speaks to you.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid var(--ms-border)', marginBottom: '24px' }} />

            {submitted ? (
              <div role="status" style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--aac-blue)', marginBottom: '8px' }}>
                  Thank you! 🎉
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                  Your feedback goes directly into building this feature.
                </p>
                <Link href="/dashboard" className="btn btn-primary btn-sm">
                  Back to My Collective
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {error && (
                  <div className="alert alert-error" role="alert" style={{ marginBottom: '20px' }}>
                    {error}
                  </div>
                )}

                <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                  <legend style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '14px' }}>
                    What kinds of lists would be most useful to you?
                  </legend>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                    {"Check everything that applies, or just the ones you'd actually use."}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {LIST_IDEAS.map(({ id, label }) => (
                      <label
                        key={id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          fontSize: '0.875rem', color: 'var(--color-text)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          onChange={() => toggle(id)}
                          style={{ width: 18, height: 18, accentColor: 'var(--aac-blue)', flexShrink: 0 }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  <label style={{ display: 'block', marginBottom: '20px' }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                      Something else on your mind?
                    </span>
                    <textarea
                      value={other}
                      onChange={e => setOther(e.target.value)}
                      placeholder="Describe a list you'd actually use…"
                      rows={3}
                      style={{
                        width: '100%', padding: '8px 10px',
                        border: '1px solid var(--ms-border)', borderRadius: '4px',
                        fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                        resize: 'vertical', boxSizing: 'border-box',
                      }}
                    />
                  </label>
                </fieldset>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ width: '100%' }}
                >
                  {saving ? 'Sending…' : 'Send My Feedback'}
                </button>
              </form>
            )}

          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
            ← Back to My Collective
          </Link>
        </p>
      </div>

    </main>
  </BrowserChrome>
  );
}
