'use client';

/**
 * NotifyMeBox — "tell me the moment this opens"
 *
 * For the gap between announcing a production and opening registration. All
 * Access went up with its date, price and venue three weeks before you could
 * book, and everyone who read that in between was someone who wanted a seat
 * with nowhere to say so.
 *
 * Open to anyone, no account needed, which is the whole point: most of these
 * people arrive from Instagram. That makes it a public form collecting an email
 * address, so the copy states plainly what the address is for and the table
 * behind it (migration v54) never lets anyone but an admin read it back.
 *
 * Not the same thing as AttendingButton. That one is signed in only and means
 * "put this on my card". This one means "I am not in yet, come and get me".
 */

import { useId, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type State = 'idle' | 'saving' | 'done' | 'already';

interface Props {
  productionId: string;
  productionTitle: string;
  /** When registration opens, if it is known. Shown so the wait has an end. */
  opensOn?: string | null;
  accent?: string;
}

export default function NotifyMeBox({
  productionId, productionTitle, opensOn, accent = '#5b2d82',
}: Props) {
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const uid = useId();
  const emailId = `${uid}-email`;
  const nameId  = `${uid}-name`;
  const errId   = `${uid}-err`;
  const emailRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();

    // Deliberately forgiving. A strict pattern rejects real addresses, and the
    // only real test of an address is whether mail to it arrives.
    if (!address || !address.includes('@') || address.length < 6) {
      setError('That does not look like an email address yet. Check it over?');
      emailRef.current?.focus();
      return;
    }

    setState('saving');
    setError('');

    const { error: err } = await supabase
      .from('production_notify_requests')
      .insert({ production_id: productionId, email: address, name: name.trim() || null });

    if (!err) { setState('done'); return; }

    // Already on the list. Not a failure from the visitor's point of view, so it
    // reads as reassurance rather than as something they did wrong.
    if (err.code === '23505' || /duplicate|unique/i.test(err.message)) {
      setState('already');
      return;
    }

    setState('idle');
    setError('Something went wrong saving that. Please try again, or email us and we will add you by hand.');
  };

  const box: React.CSSProperties = {
    border: `2px solid ${accent}`, borderRadius: 6, background: '#fff', padding: '0.875rem',
  };
  const input: React.CSSProperties = {
    width: '100%', minHeight: 44, padding: '8px 10px', fontSize: '0.9375rem',
    border: '1px solid #8a8a8a', borderRadius: 4, fontFamily: 'inherit',
    boxSizing: 'border-box', background: '#fff', color: '#1a1a1a',
  };
  const label: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: 3, color: '#333',
  };

  if (state === 'done' || state === 'already') {
    return (
      <div style={box}>
        {/* role=status so the confirmation is announced, not just shown. */}
        <p role="status" style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: accent }}>
          {state === 'done' ? 'You are on the list.' : 'You are already on the list.'}
        </p>
        <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: '#444', lineHeight: 1.55 }}>
          {state === 'done'
            ? `We will email you the moment registration opens for ${productionTitle}. That is the only thing this address gets used for.`
            : `We already have that address down for ${productionTitle}, so you will get the email when registration opens. No need to do anything else.`}
        </p>
      </div>
    );
  }

  return (
    <div style={box}>
      <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.9375rem' }}>
        Not open yet
      </p>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: '#444', lineHeight: 1.55 }}>
        {opensOn
          ? `Registration opens ${opensOn}. Leave your email and we will tell you the moment it does.`
          : 'Registration is not open yet. Leave your email and we will tell you the moment it is.'}
      </p>

      <form onSubmit={submit} noValidate>
        <div style={{ marginBottom: '0.625rem' }}>
          <label htmlFor={nameId} style={label}>Your name (optional)</label>
          <input
            id={nameId} type="text" value={name} autoComplete="name"
            onChange={(ev) => setName(ev.target.value)} style={input}
          />
        </div>

        <div style={{ marginBottom: '0.625rem' }}>
          <label htmlFor={emailId} style={label}>Email address</label>
          <input
            ref={emailRef}
            id={emailId} type="email" value={email} autoComplete="email"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errId : undefined}
            onChange={(ev) => { setEmail(ev.target.value); if (error) setError(''); }}
            style={input}
          />
        </div>

        {error && (
          <p id={errId} role="alert" style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: '#8e1a11' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={state === 'saving'}
          aria-busy={state === 'saving'}
          style={{
            minHeight: 44, padding: '0 18px', width: '100%', borderRadius: 4,
            border: `2px solid ${accent}`, background: accent, color: '#fff',
            fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'inherit',
            cursor: state === 'saving' ? 'default' : 'pointer',
          }}
        >
          {state === 'saving' ? 'Adding you…' : 'Email me when it opens'}
        </button>

        {/* Said before they type, not after. */}
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.6875rem', color: '#555', lineHeight: 1.5 }}>
          One email about this one thing. We will not add you to a mailing list and we
          will not pass your address on.
        </p>
      </form>
    </div>
  );
}
