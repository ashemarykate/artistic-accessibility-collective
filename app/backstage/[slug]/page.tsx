'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import BackstageLinks from '@/components/BackstageLinks';
import BackstagePlaylists from '@/components/BackstagePlaylists';
import BackstagePosts from '@/components/BackstagePosts';
import BackstageGraveyard from '@/components/BackstageGraveyard';
import BackstageVideoLinks from '@/components/BackstageVideoLinks';
import { rememberAfterLogin } from '@/lib/after-login';

import {
  fetchProductionForMe, fetchMicrosite, fetchMyRow, saveMyPersona, claimInvites, getSettledUser,
  hasMemberProfile,
  FONT_CHOICES, STATUS_CHOICES,
  type ProductionSummary, type MicrositeState, type TeamRow, type Persona,
} from '@/lib/backstage';
import {
  PORTAL_INTRO, SECTIONS, ROLE_LABELS, portalBackgroundStyle, PORTAL_PANEL_STYLE,
} from '@/lib/production-admin-copy';

export default function BackstagePortal() {
  const router = useRouter();
  const slug = String(useParams()?.slug ?? '');

  /* ?preview=1 renders the portal with sample content and no sign in, so the
     design can be looked at and argued with before the login flow is settled.
     It never reads or writes the database: everything below is local state,
     and Save is disabled. Nothing here is private, it is our own show. */
  const preview = useSearchParams()?.get('preview') === '1';

  const [show, setShow] = useState<ProductionSummary | null>(null);
  const [site, setSite] = useState<MicrositeState | null>(null);
  const [row, setRow] = useState<TeamRow | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'notmine'>('loading');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [claimError, setClaimError] = useState<string>('');
  const [saved, setSaved] = useState<string>('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (preview) {
      // Seed the sample state on the next tick, not synchronously in the effect.
      const t = setTimeout(() => {
        setShow({ id: 'preview', slug, title: '2006', tagline: 'a play in the form of TRL',
          status: 'draft', myRole: 'producer' } as ProductionSummary);
        setSite({ background_url: '/2006/bg.jpg', background_color: '#3a6ea5',
          public_url: '/2006', drive_url: null, submissions_url: null } as MicrositeState);
        setRow({ id: 'preview', team_role: 'producer', display_name: 'Mary Kate', credit: 'Writer/Performer/Editor/Tech' } as TeamRow);
        setHasProfile(true);
        setPersona({
          screen_name: 'mkashe9', status: 'away', idle_min: 23,
          away_msg: 'not here, prolly back later',
          profile: 'friends. music. swim.\n\norlando bloom <3',
          about: '',
          bg: '#3e7391', fg: '#c3adaf', font: 'sys', size: 13,
        } as Persona);
        setState('ready');
      }, 0);
      return () => clearTimeout(t);
    }
    (async () => {
      const user = await getSettledUser();
      if (!user) {
        const here = window.location.pathname;
        rememberAfterLogin(here);
        router.push(`/login?next=${encodeURIComponent(here)}`);
        return;
      }
      setUserId(user.id);
      hasMemberProfile(user.id).then(setHasProfile);
      const claim = await claimInvites();
      setClaimError(claim.error ?? '');

      const mine = await fetchProductionForMe(slug);
      if (!mine) { setState('notmine'); return; }

      const [ms, mineRow] = await Promise.all([fetchMicrosite(mine.id), fetchMyRow(mine.id)]);
      setShow(mine); setSite(ms); setRow(mineRow);
      setPersona(mineRow?.persona ?? null);
      setState('ready');
    })();
  }, [slug, router, preview]);

  useEffect(() => { if (state === 'ready') headingRef.current?.focus(); }, [state]);

  const bgStyle = useMemo(
    () => portalBackgroundStyle({
      backgroundUrl: site?.background_url ?? null,
      backgroundColor: site?.background_color ?? null,
    }),
    [site],
  );

  if (state === 'loading') {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--aac-navy)" }}>
        <p role="status" aria-live="polite" style={{ color: '#fff', padding: '2rem' }}>Loading…</p>
      </main>
    );
  }

  if (state === 'notmine') {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--aac-navy)" }}>
        <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '2rem 1rem' }}>
          <Logo />
          <div style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginTop: '1.5rem', color: '#222' }}>
            <h1 style={{ marginTop: 0, fontSize: '1.4rem' }}>You are not on this show</h1>
            <p>
              Backstage only opens for people who are on a production.
              {claimError
                ? ' You may well be on this one. We could not check, so do not'
                  + ' take this page at its word.'
                : ' If you were expecting to be on this one, it may be attached to'
                  + ' a different email than the one you signed in with.'}
            </p>

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
            <p style={{ marginBottom: 0 }}><Link href="/backstage">See the shows you are on</Link></p>
          </div>
        </div>
      </main>
    );
  }

  const role = show!.myRole;
  const p = persona!;
  const set = (patch: Partial<Persona>) => { setPersona({ ...p, ...patch }); setSaved(''); };

  const onSave = async () => {
    if (!row) return;
    setSaving(true); setSaved('');
    const res = await saveMyPersona(row.id, p);
    setSaving(false);
    setSaved(res.ok ? 'Saved. The site has it now.' : `Could not save. ${res.error ?? ''}`);
  };

  const cardStyle: React.CSSProperties = {
    background: p.bg, color: p.fg,
    fontFamily: FONT_CHOICES.find((f) => f.value === p.font)?.css,
  };

  return (
    <main style={{ ...bgStyle, minHeight: '100vh' }}>
      <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        <Logo />

        <div style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginTop: '1.25rem', color: '#222' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5a6a8e' }}>
            Backstage
          </p>
          {preview && (
            <div style={{
              ...PORTAL_PANEL_STYLE, padding: '0.85rem 1rem', marginBottom: '1rem',
              color: '#222', borderLeft: '5px solid #c2410c',
            }}>
              <strong>Preview</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                This is what Backstage looks like, filled with sample content. You are not
                signed in and nothing here saves. It is here so the design can be looked at
                while the sign in flow is still being sorted out.
              </p>
            </div>
          )}
          <h1 ref={headingRef} tabIndex={-1} className="font-display"
              style={{ margin: '0.2rem 0 0.1rem', fontSize: '2rem', color: 'var(--aac-blue)' }}>
            {show!.title}
          </h1>
          <p style={{ margin: '0 0 0.75rem', color: '#555' }}>
            You are here as <strong>{ROLE_LABELS[role]}</strong>.
            {show!.status !== 'published' && ' This show is still a draft, so only the company can see it.'}
          </p>
          <p style={{ margin: 0 }}>{PORTAL_INTRO[role]}</p>
        </div>

        {/* ── Your profile ── */}
        <section aria-labelledby="sec-profile" style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginTop: '1.25rem', color: '#222' }}>
          <h2 id="sec-profile" style={{ marginTop: 0, color: 'var(--aac-blue)' }}>{SECTIONS.profile.title}</h2>
          <p style={{ color: '#444' }}>{SECTIONS.profile.blurb}</p>

          {!row ? (
            <p role="alert">
              Your account is not attached to a person on this show yet. A producer
              needs to connect them. Nothing you type here would save.
            </p>
          ) : (
            <>
              <Field label="Screen name" hint="The name on the buddy list. Everybody sees this one.">
                <input className="form-input" value={p.screen_name ?? ''} maxLength={30}
                       onChange={(e) => set({ screen_name: e.target.value })} />
              </Field>

              <Field label="Status" hint="What the little icon next to your name says.">
                <select className="form-input" value={p.status}
                        onChange={(e) => set({ status: e.target.value as Persona['status'] })}>
                  {STATUS_CHOICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <span style={hintStyle}>{STATUS_CHOICES.find((s) => s.value === p.status)?.help}</span>
              </Field>

              {(p.status === 'away' || p.status === 'idle') && (
                <Field label="Minutes idle" hint="Shown next to your name. Zero hides it. This is a joke you can tell with a number.">
                  <input className="form-input" type="number" min={0} max={9999} value={p.idle_min ?? 0}
                         onChange={(e) => set({ idle_min: Number(e.target.value) })} style={{ maxWidth: '8rem' }} />
                </Field>
              )}

              <Field label="Away message" hint="What people get when they message you while you are away.">
                <textarea className="form-input" rows={3} value={p.away_msg ?? ''}
                          onChange={(e) => set({ away_msg: e.target.value })} />
              </Field>

              <Field label="Profile" hint="Your bio. Lyrics, quotes, ASCII, whatever you would actually have put there.">
                <textarea className="form-input" rows={6} value={p.profile ?? ''}
                          onChange={(e) => set({ profile: e.target.value })} />
              </Field>

              <Field label="What the show is about" hint={SECTIONS.about.blurb}>
                <textarea className="form-input" rows={3} value={p.about ?? ''}
                          onChange={(e) => set({ about: e.target.value })} />
              </Field>

              <fieldset style={{ border: '1px solid #d8dcf5', borderRadius: 4, padding: '0.75rem 1rem 1rem', margin: '1.25rem 0 0' }}>
                <legend style={{ fontWeight: 700, color: 'var(--aac-blue)', padding: '0 0.35rem' }}>How it looks</legend>
                <p style={{ ...hintStyle, marginTop: 0 }}>
                  These are yours. Nobody is going to tell you the colours clash.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span>Background</span>
                    <input type="color" value={p.bg} onChange={(e) => set({ bg: e.target.value })}
                           style={{ width: '4rem', height: '2.5rem' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span>Text</span>
                    <input type="color" value={p.fg} onChange={(e) => set({ fg: e.target.value })}
                           style={{ width: '4rem', height: '2.5rem' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span>Font</span>
                    <select className="form-input" value={p.font}
                            onChange={(e) => set({ font: e.target.value as Persona['font'] })}>
                      {FONT_CHOICES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span>Text size</span>
                    <input className="form-input" type="number" min={10} max={20} value={p.size ?? 13}
                           onChange={(e) => set({ size: Number(e.target.value) })} style={{ width: '5.5rem' }} />
                  </label>
                </div>

                <p style={{ ...hintStyle, marginBottom: '0.35rem' }}>Preview</p>
                <div style={{ ...cardStyle, padding: '0.75rem', border: '1px solid rgba(0,0,0,.35)', whiteSpace: 'pre-line' }}>
                  {p.profile || 'Your profile shows up here.'}
                </div>
                <div style={{ ...cardStyle, padding: '0.35rem 0.5rem', marginTop: '0.5rem',
                              border: '1px solid rgba(0,0,0,.35)', fontSize: `${p.size ?? 13}px`, lineHeight: 1.3 }}>
                  <strong>{p.screen_name || 'yourname'}:</strong> {p.about || 'what you think the show is about'}
                </div>
              </fieldset>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save my profile'}
                </button>
                <span role="status" aria-live="polite" style={{ color: saved.startsWith('Could not') ? '#a00' : '#0a5a1e' }}>
                  {saved}
                </span>
              </div>
            </>
          )}
        </section>

        {/* ── Not built yet, but say so plainly rather than hiding it ── */}
        {site && (
          <BackstageLinks
            site={site}
            productionId={show!.id}
            canEdit={role === 'producer'}
            preview={preview}
            hasProfile={hasProfile}
            onChange={(patch) => setSite((prev) => (prev ? { ...prev, ...patch } : prev))}
          />
        )}

        <BackstagePlaylists
          productionId={show!.id}
          userId={userId}
          myScreenName={persona?.screen_name || row?.display_name || 'me'}
          preview={preview}
        />

        <BackstagePosts
          productionId={show!.id}
          userId={userId}
          myScreenName={persona?.screen_name || row?.display_name || 'me'}
          canPin={role === 'producer'}
          preview={preview}
        />

        <BackstageVideoLinks
          productionId={show!.id}
          canCurate={role === 'producer' || role === 'creator'}
          preview={preview}
        />

        <BackstageGraveyard
          productionId={show!.id}
          canCurate={role === 'producer' || role === 'creator'}
          preview={preview}
        />


        {role === 'producer' && (
        <section style={{ ...PORTAL_PANEL_STYLE, padding: '1.25rem', marginTop: '1.25rem', color: '#222' }}>
          <h2 style={{ marginTop: 0, color: 'var(--aac-blue)' }}>Still to come</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#444' }}>
            <li><strong>Show mode.</strong> {SECTIONS.showMode.blurb}</li>
          </ul>
        </section>

        )}

        <p style={{ marginTop: '1.25rem' }}>
          <Link href="/backstage" style={{ color: '#fff' }}>All my shows</Link>
        </p>
      </div>

      <footer style={{ textAlign: 'center', padding: '1.5rem 1rem 2.5rem' }}>
        <a href="https://artisticaccessibility.com" target="_blank" rel="noopener noreferrer"
           aria-label="Artistic Accessibility Collective, home">
          <img src="/images/wordmark-dark-v11.svg" alt="" style={{
            height: '15px', width: 'auto',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.9))',
          }} />
        </a>
      </footer>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '0.25rem', marginTop: '1rem' }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      {hint && <span style={hintStyle}>{hint}</span>}
      {children}
    </label>
  );
}

const hintStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#5a6a8e' };
