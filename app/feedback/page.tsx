'use client';

import { useEffect, useState } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrowserChrome from '@/components/BrowserChrome';

const QUESTIONS = [
  {
    id: 'most_useful_feature',
    label: "What's the one thing that would make this platform most useful to you in your daily work?",
    placeholder: 'Tell us what would actually move the needle for you…',
    rows: 4,
  },
  {
    id: 'missing_profile_info',
    label: "What information would you most want to see on other professionals' profiles?",
    placeholder: "What's missing that you'd look for when finding someone to work with?",
    rows: 3,
  },
  {
    id: 'work_use_case',
    label: 'How do you picture yourself using this platform in your work?',
    placeholder: 'Finding colleagues? Getting found? Staying connected? Something else?',
    rows: 3,
  },
  {
    id: 'recommend_reason',
    label: 'What would make you want to recommend this to a colleague?',
    placeholder: 'What would tip you from "maybe" to "you have to check this out"?',
    rows: 3,
  },
  {
    id: 'confusing_aspects',
    label: 'Was anything confusing or frustrating about signing up?',
    placeholder: 'Nothing is too small. If it gave you pause, we want to know.',
    rows: 3,
  },
  {
    id: 'resources_wanted',
    label: 'What kinds of resources or content would be most valuable to you here?',
    placeholder: 'Training materials, event listings, job postings, forums, something else?',
    rows: 3,
  },
  {
    id: 'community_feature_wish',
    label: "Is there a community feature you wish existed that we haven't thought of?",
    placeholder: "Dream big. We're listening.",
    rows: 3,
  },
  {
    id: 'additional_feedback',
    label: 'Anything else?',
    placeholder: 'The floor is yours.',
    rows: 4,
  },
] as const;

type FeedbackField = typeof QUESTIONS[number]['id'];

export default function FeedbackPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [existingId, setExistingId] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<FeedbackField, string>>({
    most_useful_feature: '',
    missing_profile_info: '',
    work_use_case: '',
    recommend_reason: '',
    confusing_aspects: '',
    resources_wanted: '',
    community_feature_wish: '',
    additional_feedback: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Load any existing round-1 feedback
    const { data: existing } = await supabase
      .from('tester_feedback')
      .select('*')
      .eq('profile_id', profileData.id)
      .eq('tester_round', 1)
      .single();

    if (existing) {
      setExistingId(existing.id);
      setAnswers({
        most_useful_feature: existing.most_useful_feature ?? '',
        missing_profile_info: existing.missing_profile_info ?? '',
        work_use_case: existing.work_use_case ?? '',
        recommend_reason: existing.recommend_reason ?? '',
        confusing_aspects: existing.confusing_aspects ?? '',
        resources_wanted: existing.resources_wanted ?? '',
        community_feature_wish: existing.community_feature_wish ?? '',
        additional_feedback: existing.additional_feedback ?? '',
      });
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = { ...answers, profile_id: profile!.id, tester_round: 1 };

      if (existingId) {
        const { error: upErr } = await supabase
          .from('tester_feedback')
          .update(answers)
          .eq('id', existingId);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase
          .from('tester_feedback')
          .insert(payload);
        if (insErr) throw insErr;
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Feedback submit error:', err);
      setError('Something went wrong saving your feedback. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" aria-hidden="true" style={{ width: 36, height: 36, borderWidth: 4 }} />
        <span>Loading…</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <BrowserChrome variant="ie3" title="Tester Feedback — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/feedback">
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '2rem' }}>
        <div className="content-card" style={{ maxWidth: '420px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.5rem', marginBottom: '1rem' }}>
            Members Only
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            This page is only available to approved members.
          </p>
          <Link href="/login" className="btn btn-primary">Log In</Link>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  if (submitted) {
    return (
      <BrowserChrome variant="ie3" title="Tester Feedback — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/feedback">
      <main className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '2rem' }}>
        <div className="content-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div aria-hidden="true" style={{ fontSize: '3rem', marginBottom: '0.75rem', color: 'var(--color-success)' }}>✓</div>
          <h1 style={{ fontWeight: 'bold', color: 'var(--aac-blue)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            Thank you!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Your feedback is incredibly valuable. It will directly shape what this platform becomes.
          </p>
          <p className="font-accent-italic" style={{ color: 'var(--aac-blue)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            together, together
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/members" className="btn btn-primary">Members</Link>
            <Link href={`/profile/${profile.id}`} className="btn btn-ghost">My Profile</Link>
          </div>
        </div>
      </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="ie3" title="Tester Feedback — Artistic Accessibility Collective" url="http://members.artisticaccessibility.com/feedback">
    <main className="page-wrapper">
      <header className="site-header">
        <Link href="/" className="site-header-logo"><img src="/images/logo-across-blue-bg.svg" alt="Artistic Accessibility Collective" /></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/members" className="nav-link">Members</Link>
          <Link href={`/profile/${profile.id}`} className="nav-link">My Profile</Link>
        </nav>
      </header>

      <div className="page-container" style={{ maxWidth: '680px', paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ color: 'var(--aac-blue-dark)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Help Us Build Something Better
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem', maxWidth: '520px', margin: '0 auto' }}>
            You&apos;re in the first wave. Your answers directly shape what this platform becomes.
            There&apos;s no wrong answer, only useful ones.
          </p>
        </div>

        <div className="content-card">
          {existingId && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }} role="status">
              You&apos;ve already submitted feedback. Your previous answers are shown below and you can update them anytime.
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate aria-label="Tester feedback form">
            {QUESTIONS.map((q, i) => (
              <div key={q.id} className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label htmlFor={q.id} className="form-label" style={{ fontSize: '1rem', lineHeight: 1.45 }}>
                  <span style={{ color: 'var(--aac-blue)', fontWeight: 'bold', marginRight: '0.4rem' }}>
                    {i + 1}.
                  </span>
                  {q.label}
                </label>
                <textarea
                  id={q.id}
                  className="form-input form-textarea"
                  rows={q.rows}
                  placeholder={q.placeholder}
                  value={answers[q.id]}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              </div>
            ))}

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              All questions are optional. Share as much or as little as you&apos;d like.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: '1 1 auto' }} disabled={saving}>
                {saving ? (
                  <><span className="spinner" aria-hidden="true" style={{ width: 18, height: 18, borderWidth: 2 }} /> Saving…</>
                ) : existingId ? (
                  'Update Feedback'
                ) : (
                  'Submit Feedback'
                )}
              </button>
              <Link href="/members" className="btn btn-ghost">Skip for now</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  </BrowserChrome>
  );
}
