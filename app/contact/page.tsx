'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

const navyBg = { background: 'var(--aac-navy)', minHeight: '100vh' };

export default function ContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState('');
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    document.title = 'Contact Us — Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    if (sent && successHeadingRef.current) {
      document.title = 'Message Sent — Artistic Accessibility Collective';
      successHeadingRef.current.focus();
    }
  }, [sent]);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.name.trim()) errors.name = 'Your name is required.';
    if (!formData.email.trim()) {
      errors.email = 'Your email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) errors.message = 'A message is required.';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorId = errors.name ? 'contact-name' : errors.email ? 'contact-email' : 'contact-message';
      document.getElementById(firstErrorId)?.focus();
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setStatus('Sending your message…');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setStatus('');
      setSent(true);
    } catch (err) {
      console.error('Error sending message:', err);
      setStatus('');
      setSubmitError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main style={{ ...navyBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '0', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-across-blue-bg.svg" alt="" style={{ height: '72px', width: 'auto' }} />
        </Link>
        <div className="content-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div aria-hidden="true" style={{ fontSize: '3rem', marginBottom: '0.75rem', color: 'var(--color-success)' }}>✓</div>
          <h1
            ref={successHeadingRef}
            tabIndex={-1}
            style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.75rem', marginBottom: '0.5rem', outline: 'none' }}
          >
            Message Sent!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Thank you for reaching out. We'll get back to you soon at {formData.email}.
          </p>
          <button onClick={() => router.push('/')} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ ...navyBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      {/* Status live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{status}</div>

      <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '0', display: 'inline-block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-across-blue-bg.svg" alt="" style={{ height: '72px', width: 'auto' }} />
      </Link>

      <div className="content-card" style={{ maxWidth: '560px', width: '100%' }}>
        <h1 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.25rem', textAlign: 'center' }}>
          Contact Us
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', textAlign: 'center', marginBottom: '1.75rem' }}>
          Have questions, suggestions, or want to learn more?<br />We'd love to connect with you!
        </p>

        {submitError && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate aria-describedby="required-note">
          <p id="required-note" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Fields marked with * are required.
          </p>

          <div className="form-group">
            <label htmlFor="contact-name" className="form-label">
              Your Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'error-name' : undefined}
              className="form-input"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
              }}
              placeholder="Jane Smith"
              autoComplete="name"
            />
            {fieldErrors.name && (
              <p id="error-name" className="form-error" role="alert">{fieldErrors.name}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contact-email" className="form-label">
              Your Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'error-email' : undefined}
              className="form-input"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              placeholder="jane@example.com"
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p id="error-email" className="form-error" role="alert">{fieldErrors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contact-subject" className="form-label">Subject</label>
            <input
              id="contact-subject"
              type="text"
              className="form-input"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="What can we help you with?"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-message" className="form-label">
              Message <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="contact-message"
              rows={6}
              required
              aria-required="true"
              aria-invalid={!!fieldErrors.message}
              aria-describedby={fieldErrors.message ? 'error-message' : undefined}
              className="form-input"
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: undefined });
              }}
              placeholder="Tell us what's on your mind…"
            />
            {fieldErrors.message && (
              <p id="error-message" className="form-error" role="alert">{fieldErrors.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%' }}
            aria-busy={loading}
          >
            {loading ? 'Sending…' : 'Send Message'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Or email us directly at{' '}
            <a href="mailto:contact@artisticaccessibility.com" style={{ color: 'var(--aac-blue)', textDecoration: 'underline' }}>
              contact@artisticaccessibility.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
