'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { rememberAfterLogin, readLoginTrace, clearLoginTrace, type LoginTrace } from '@/lib/after-login';

import { fetchMyProductions, claimInvites, getSettledUser, type ProductionSummary } from '@/lib/backstage';
import { ROLE_LABELS, ROLE_HELP } from '@/lib/production-admin-copy';

export default function BackstageIndex() {
  const router = useRouter();
  const [shows, setShows] = useState<ProductionSummary[] | null>(null);
  const [email, setEmail] = useState<string>('');
  const [trace, setTrace] = useState<LoginTrace | null>(null);
  const [claimError, setClaimError] = useState<string>('');

  useEffect(() => {
    document.title = 'Backstage · Artistic Accessibility Collective';
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    (async () => {
      const user = await getSettledUser();
      if (!user) {
        const here = window.location.pathname;
        rememberAfterLogin(here);                       // same browser
        router.push(`/login?next=${encodeURIComponent(here)}`);  // any browser
        return;
      }

      // Picks up anything a producer set aside for this email before the
      // person had an account. Cheap, and it means nobody has to be told to
      // wait while somebody runs SQL.
      setEmail(user.email ?? '');
      setTrace(readLoginTrace());
      const claim = await claimInvites();
      setClaimError(claim.error ?? '');

      const mine = await fetchMyProductions();

      // One show is the common case. Do not make them click through a list
      // of one thing.
      if (mine.length === 1) { router.replace(`/backstage/${mine[0].slug}`); return; }
      setShows(mine);
    })();
  }, [router]);

  if (shows === null) {
    return (
      <main style={SHELL}>
        <p role="status" aria-live="polite" style={{ color: '#fff', padding: '2rem' }}>
          Loading your shows…
        </p>
      </main>
    );
  }

  return (
    <main style={SHELL}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <Logo />
        <h1 className="font-display" style={{ color: '#fff', fontSize: '2rem', marginTop: '1.5rem' }}>
          Backstage
        </h1>

        {trace && (
          <div style={{ ...panel, marginTop: '1rem', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--aac-blue)' }}>Sign in diagnostic</strong>
            <p style={{ margin: '0.5rem 0' }}>
              Temporary, while we work out why sign in was landing on the
              Collective admin. Read this back to Claude.
            </p>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.2rem 0.75rem', margin: 0 }}>
              <dt><strong>Callback ran</strong></dt><dd>yes, at {trace.at}</dd>
              <dt><strong>Origin</strong></dt><dd>{trace.origin}</dd>
              <dt><strong>Saved destination</strong></dt><dd>{trace.rawStored ?? 'nothing was saved'}</dd>
              <dt><strong>Used</strong></dt><dd>{trace.intended ?? 'none'}</dd>
              <dt><strong>Sent you to</strong></dt><dd>{trace.routedTo}</dd>
            </dl>
            <p style={{ margin: '0.75rem 0 0' }}>
              <button className="btn" onClick={() => { clearLoginTrace(); setTrace(null); }}>
                Clear this
              </button>
            </p>
          </div>
        )}

        {shows.length === 0 ? (
          <div style={panel}>
            <h2 style={{ marginTop: 0 }}>You are not on a show yet</h2>
            <p>
              Backstage is where the company of a production looks after their own
              part of it. When somebody adds you to a show, it will show up here.
            </p>
            <p>
              You are signed in as <strong>{email || 'an unknown account'}</strong>.
              {claimError
                ? ' There may well be a show waiting for you. We could not check,'
                  + ' so do not take this page at its word.'
                : ' If you were expecting a show here, it is probably attached to a'
                  + ' different address. Ask whoever added you which one they used,'
                  + ' then sign in with that.'}
            </p>

            {/* A refused claim used to be invisible, which is how somebody sat
                outside her own show for a week believing the page. */}
            {claimError && (
              <p role="alert" style={{
                background: '#fdeaea', borderLeft: '5px solid #b42318',
                padding: '0.75rem 1rem', borderRadius: '4px',
              }}>
                Something went wrong looking up your invitation. Send this line to
                Mary Kate and she can sort it out:{' '}
                <code style={{ wordBreak: 'break-word' }}>{claimError}</code>
              </p>
            )}
            <p style={{ marginBottom: 0 }}>
              <button className="btn" onClick={async () => {
                // Remember AFTER signing out: signOut clears storage it owns,
                // and we want this to survive into the new tab the magic link
                // will open.
                await supabase.auth.signOut();
                rememberAfterLogin('/backstage');
                router.push('/login?next=%2Fbackstage');
              }}>Sign in as someone else</button>
            </p>
            <p style={{ marginTop: '1.5rem', marginBottom: 0 }}>
              <Link href="/collective">Back to the Collective</Link>
            </p>
          </div>
        ) : (
          <>
            <p style={{ color: '#d8dcf5', marginTop: '0.25rem' }}>
              The shows you are working on.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0 0', display: 'grid', gap: '1rem' }}>
              {shows.map((s) => (
                <li key={s.id}>
                  <Link href={`/backstage/${s.slug}`} style={{ ...panel, display: 'block', textDecoration: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--aac-blue)' }}>{s.title}</strong>
                      {s.status !== 'published' && (
                        <span className="tag tag-gray" style={{ fontSize: '0.7rem' }}>{s.status}</span>
                      )}
                    </span>
                    {s.tagline && <span style={{ display: 'block', color: '#555', marginTop: '0.25rem' }}>{s.tagline}</span>}
                    <span style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.85rem', color: '#333' }}>
                      <strong>{ROLE_LABELS[s.myRole]}.</strong> {ROLE_HELP[s.myRole]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

/* Navy, not .page-wrapper. The wordmark is white on transparent and
   disappears against the pale lavender that .page-wrapper uses. */
const SHELL: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: 'var(--aac-navy)',
};

const panel: React.CSSProperties = {
  background: 'var(--aac-cream)',
  borderRadius: '4px',
  padding: '1.25rem',
  boxShadow: '0 12px 30px rgba(0,0,0,.45)',
  color: '#222',
};
