'use client';

/**
 * AttendingButton — the "I'm attending" control on a production page
 *
 * Signed in only, and that's the design rather than a limitation: the whole
 * point is that saying you're coming puts the production somewhere you'll see
 * it again (your Access Card, your Collective dashboard). An anonymous click
 * has nowhere to land. Signed-out visitors get the two ways in instead.
 *
 * Both account tiers work identically here, because RSVPs key off the auth user
 * rather than the profile: a free Access Card holder and a full Collective
 * member get the same button.
 *
 * When a production has several dates, each one toggles separately, so someone
 * can come in November without claiming a seat in September. With no dates
 * entered yet, there's a single undated RSVP, which is the row with a NULL
 * production_date_id in the schema.
 *
 * This is not ticketing. Ticket links point at whatever external checkout the
 * production uses, and someone can perfectly well buy a ticket without ever
 * pressing this, which is why the admin attendee list says so out loud.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase, getSessionUser, type ProductionDate, type ProductionRsvp } from '@/lib/supabase';
import { formatDate, upcomingDates } from '@/lib/productions';

interface Props {
  productionId: string;
  productionTitle: string;
  dates: ProductionDate[];
  rsvpCapacity: number | null;
  /** Xanga-flavored surface colors, passed in so the button matches its page. */
  accent?: string;
}

type State = 'loading' | 'anon' | 'ready';

export default function AttendingButton({
  productionId, productionTitle, dates, rsvpCapacity, accent = '#7b3f9d',
}: Props) {
  const [state, setState]   = useState<State>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [rsvps, setRsvps]   = useState<ProductionRsvp[]>([]);
  const [busy, setBusy]     = useState<string | null>(null);
  const [error, setError]   = useState('');
  const [status, setStatus] = useState('');
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const upcoming = upcomingDates(dates);

  /** Re-reads this person's RSVPs. Also used to resync after a conflict, when
   *  the same person said yes in another tab. */
  const load = useCallback(async () => {
    const user = await getSessionUser();
    if (!user) { setState('anon'); return; }
    setUserId(user.id);
    const { data, error: err } = await supabase
      .from('production_rsvps')
      .select('*')
      .eq('production_id', productionId)
      .eq('user_id', user.id);
    if (err) setError('Could not check whether you are already on the list.');
    setRsvps((data ?? []) as ProductionRsvp[]);
    setState('ready');
  }, [productionId]);

  useEffect(() => {
    let cancelled = false;
    // Nothing is set until the session lookup resolves, so this never renders
    // twice on mount.
    void (async () => {
      const user = await getSessionUser();
      if (cancelled) return;
      if (!user) { setState('anon'); return; }
      setUserId(user.id);
      const { data, error: err } = await supabase
        .from('production_rsvps')
        .select('*')
        .eq('production_id', productionId)
        .eq('user_id', user.id);
      if (cancelled) return;
      if (err) setError('Could not check whether you are already on the list.');
      setRsvps((data ?? []) as ProductionRsvp[]);
      setState('ready');
    })();
    return () => { cancelled = true; };
  }, [productionId]);

  useEffect(() => { if (noteFor) noteRef.current?.focus(); }, [noteFor]);

  /** dateId is null for the undated case, which needs its own key. */
  const keyOf = (dateId: string | null) => dateId ?? '__undated__';
  const rsvpFor = (dateId: string | null) =>
    rsvps.find((r) => (r.production_date_id ?? null) === dateId) ?? null;

  const join = async (dateId: string | null, note?: string) => {
    if (!userId) return;
    setBusy(keyOf(dateId)); setError('');
    const { data, error: err } = await supabase
      .from('production_rsvps')
      .insert({
        user_id: userId,
        production_id: productionId,
        production_date_id: dateId,
        note: note?.trim() || null,
      })
      .select('*')
      .single();
    setBusy(null);
    if (err) {
      // A duplicate means they already said yes, probably in another tab.
      setError(
        err.code === '23505' || /duplicate/i.test(err.message)
          ? 'You are already on the list for that one.'
          : 'Could not save that just now. Please try again.',
      );
      void load();
      return;
    }
    setRsvps((prev) => [...prev, data as ProductionRsvp]);
    setNoteFor(null); setNoteText('');
    setStatus(
      dateId
        ? `You are marked as attending. This is now saved to your account.`
        : `You are marked as attending ${productionTitle}. This is now saved to your account.`,
    );
  };

  const leave = async (rsvp: ProductionRsvp) => {
    setBusy(keyOf(rsvp.production_date_id)); setError('');
    const { error: err } = await supabase.from('production_rsvps').delete().eq('id', rsvp.id);
    setBusy(null);
    if (err) { setError('Could not remove that just now. Please try again.'); return; }
    setRsvps((prev) => prev.filter((r) => r.id !== rsvp.id));
    setStatus('Taken off your list.');
  };

  // ── Shared surface ─────────────────────────────────────────────────────────

  const box: React.CSSProperties = {
    border: `2px solid ${accent}`,
    borderRadius: 6,
    background: '#fff',
    padding: '0.875rem',
  };
  const primaryBtn: React.CSSProperties = {
    minHeight: 44, padding: '0 18px', borderRadius: 4, cursor: 'pointer',
    border: `2px solid ${accent}`, background: accent, color: '#fff',
    fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'inherit',
  };
  const offBtn: React.CSSProperties = {
    ...primaryBtn, background: '#fff', color: accent,
  };

  if (state === 'loading') {
    return (
      <div style={box}>
        <p role="status" aria-live="polite" style={{ margin: 0, fontSize: '0.875rem' }}>
          Checking your account…
        </p>
      </div>
    );
  }

  if (state === 'anon') {
    return (
      <div style={box}>
        <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.9375rem' }}>
          Planning to come?
        </p>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: '#444' }}>
          Sign in and we will keep this on your card as a reminder. An Access Card is free.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href={`/login?next=${encodeURIComponent(`/projects`)}`}
            style={{ ...primaryBtn, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            Sign in
          </Link>
          <Link
            href="/access-card/signup"
            style={{ ...offBtn, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            Get a free Access Card
          </Link>
        </div>
      </div>
    );
  }

  // No "N seats left" counter here on purpose. RSVPs are private per person by
  // design (see the policies in v38), so this component can only ever see the
  // viewer's own rows and would have to guess at the total. The cap is watched
  // in admin instead, and the page never implies a seat is held.
  const rows: Array<{ dateId: string | null; label: string }> =
    upcoming.length > 0
      ? upcoming.map((d) => ({
          dateId: d.id,
          label: d.label ? `${d.label}: ${formatDate(d)}` : formatDate(d),
        }))
      : [{ dateId: null, label: productionTitle }];

  const anyGoing = rsvps.length > 0;

  return (
    <div style={box}>
      <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.9375rem' }}>
        {anyGoing ? 'You are attending' : rows.length > 1 ? 'Which one are you coming to?' : 'Planning to come?'}
      </p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
        {rows.map((r) => {
          const going = rsvpFor(r.dateId);
          const isBusy = busy === keyOf(r.dateId);
          return (
            <li key={keyOf(r.dateId)}>
              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (going) { void leave(going); return; }
                    // One date: ask for the note inline before saving. Several
                    // dates: save immediately, since the note applies per date
                    // and an extra step per row gets tedious fast.
                    if (rows.length === 1) { setNoteFor(keyOf(r.dateId)); return; }
                    void join(r.dateId);
                  }}
                  disabled={isBusy}
                  aria-busy={isBusy}
                  aria-pressed={!!going}
                  style={going ? offBtn : primaryBtn}
                >
                  {isBusy ? 'Saving…' : going ? '✓ Attending' : "I'm attending"}
                </button>
                {rows.length > 1 && (
                  <span style={{ fontSize: '0.875rem', color: '#333' }}>{r.label}</span>
                )}
                {going && (
                  <button
                    type="button"
                    onClick={() => void leave(going)}
                    disabled={isBusy}
                    style={{
                      minHeight: 44, padding: '0 10px', background: 'none', border: 'none',
                      color: accent, textDecoration: 'underline', cursor: 'pointer',
                      fontSize: '0.8125rem', fontFamily: 'inherit',
                    }}
                  >
                    Never mind
                  </button>
                )}
              </div>

              {going?.note && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#555' }}>
                  You told us: {going.note}
                </p>
              )}

              {noteFor === keyOf(r.dateId) && !going && (
                <div style={{ marginTop: '0.625rem', padding: '0.625rem', background: '#faf7fd', borderRadius: 4 }}>
                  <label
                    htmlFor={`rsvp-note-${keyOf(r.dateId)}`}
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}
                  >
                    Anything we should know? Access needs, who you are bringing, questions. Optional.
                  </label>
                  <textarea
                    ref={noteRef}
                    id={`rsvp-note-${keyOf(r.dateId)}`}
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    style={{
                      width: '100%', padding: '8px', fontSize: '0.875rem', borderRadius: 4,
                      border: '1px solid #c8c4bc', fontFamily: 'inherit', boxSizing: 'border-box',
                      minHeight: 56,
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => void join(r.dateId, noteText)} style={primaryBtn}>
                      Count me in
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNoteFor(null); setNoteText(''); }}
                      style={offBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {anyGoing && (
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: '#444' }}>
          Saved to your account.{' '}
          <Link href="/access-card" style={{ color: accent, fontWeight: 600 }}>
            See it on your card
          </Link>
        </p>
      )}

      {rsvpCapacity != null && !anyGoing && (
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#555' }}>
          Space is limited to {rsvpCapacity}. Saying you are coming helps us plan, and is not a ticket.
        </p>
      )}

      {error && (
        <p role="alert" style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: '#8e1a11' }}>
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#555', minHeight: 14 }}>
        {status}
      </p>
    </div>
  );
}
