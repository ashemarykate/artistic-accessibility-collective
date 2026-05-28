'use client';
import Logo from '@/components/Logo';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

const QUESTIONS = [
  {
    id: 'useful_feature',
    label: "What's one thing that would make this platform most useful to you?",
    placeholder: 'Tell us what would actually move the needle…',
    rows: 3,
  },
  {
    id: 'missing_info',
    label: "Is there anything missing from the site that you'd expect to find here?",
    placeholder: "What would you look for that isn't there yet?",
    rows: 3,
  },
  {
    id: 'confusing',
    label: 'Was anything confusing or hard to use?',
    placeholder: "Nothing is too small. If it gave you pause, we want to know.",
    rows: 3,
  },
  {
    id: 'general',
    label: 'Anything else you want us to know?',
    placeholder: 'The floor is yours.',
    rows: 4,
  },
] as const;

type Field = typeof QUESTIONS[number]['id'];

export default function ShareFeedback() {
  const [answers, setAnswers] = useState<Record<Field, string>>({
    useful_feature: '',
    missing_info: '',
    confusing: '',
    general: '',
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    document.title = 'Share Feedback - Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  const hasAnyAnswer = Object.values(answers).some((v) => v.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyAnswer) return;
    setStatus('loading');

    const lines: string[] = [];
    QUESTIONS.forEach((q) => {
      const a = answers[q.id].trim();
      if (a) lines.push(`<p><strong>${q.label}</strong><br />${a.replace(/\n/g, '<br />')}</p>`);
    });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous visitor',
          email: email.trim() || 'no-reply@artisticaccessibility.com',
          subject: 'Public Site Feedback',
          message: lines.join('\n\n').replace(/<[^>]+>/g, '').trim(),
        }),
      });
      if (!res.ok) throw new Error('send failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <BrowserChrome variant="aol" desktopBg="#00007a" title="Share Feedback — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/share-feedback">
    <main
      style={{
        background: 'var(--aac-blue)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
      }}
    >
      <Link
        href="/"
        aria-label="Artistic Accessibility Collective - Home"
        style={{ marginBottom: '1.5rem', display: 'inline-block' }}
      >
        <Logo alt="" height={72} />
      </Link>

      <div className="content-card" style={{ maxWidth: '560px', width: '100%' }}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
            <h1 style={{ color: 'var(--aac-blue)', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              Thank you!
            </h1>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your feedback goes directly to Mary Kate and genuinely shapes what gets built next.
            </p>
            <Link href="/" className="btn btn-primary">Back to Home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h1
              style={{
                color: 'var(--aac-blue)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.25rem',
                textAlign: 'center',
              }}
            >
              Share Your Feedback
            </h1>
            <p
              style={{
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginBottom: '1.75rem',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
              }}
            >
              No account needed. All questions are optional. Share as much or as little as you like.
            </p>

            {QUESTIONS.map((q) => (
              <div key={q.id} className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor={`q-${q.id}`} className="form-label">
                  {q.label}
                </label>
                <textarea
                  id={`q-${q.id}`}
                  className="form-input form-textarea"
                  rows={q.rows}
                  placeholder={q.placeholder}
                  value={answers[q.id]}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  disabled={status === 'loading'}
                />
              </div>
            ))}

            <fieldset
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <legend
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-muted)',
                  padding: '0 0.5rem',
                  fontStyle: 'italic',
                }}
              >
                Optional: who are you? (so we can follow up if helpful)
              </legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }} className="share-feedback-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="sf-name" className="form-label">Name</label>
                  <input
                    id="sf-name"
                    type="text"
                    className="form-input"
                    placeholder="Optional"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={status === 'loading'}
                    autoComplete="name"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="sf-email" className="form-label">Email</label>
                  <input
                    id="sf-email"
                    type="email"
                    className="form-input"
                    placeholder="Optional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    autoComplete="email"
                  />
                </div>
              </div>
            </fieldset>

            {status === 'error' && (
              <p role="alert" style={{ color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Something went wrong. Please try again or email us at{' '}
                <a href="mailto:contact@artisticaccessibility.com" style={{ color: 'inherit' }}>
                  contact@artisticaccessibility.com
                </a>.
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={status === 'loading' || !hasAnyAnswer}
            >
              {status === 'loading' ? (
                <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending…</>
              ) : (
                'Send Feedback'
              )}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Your feedback goes directly to the founder.
            </p>
          </form>
        )}
      </div>

      <nav aria-label="Secondary" style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Home</Link>
        <Link href="/contact" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', textDecoration: 'underline' }}>Contact Us</Link>
      </nav>

      <style>{`
        @media (max-width: 480px) {
          .share-feedback-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  </BrowserChrome>
  );
}
