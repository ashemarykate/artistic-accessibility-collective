'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import TakesList from './TakesList';

// "What do you think?" The take form, then the takes already approved.
//
// Anyone can send a take, signed in or not. Nothing shows until a person
// approves it (that is enforced by the database and the server route, not here).
// The form talks to POST /api/hot-topics/takes and nothing else.

// The limits come in as props from the server page (they live in
// lib/hot-topics-data.ts, shared with the API route). That file holds every
// topic's text, so no client component imports it.
export interface TakeRules {
  bodyMax: number;
  nameMax: number;
  /** DEVICE_TAG_PATTERN.source, as a string so it can cross from server to browser. */
  devicePattern: string;
}

const DEVICE_KEY = 'aac-ht-device';
const MIN_BODY = 10;
const WARN_AT = 550;

const IDS = { name: 'ht-take-name', body: 'ht-take-text', agree: 'ht-take-ok' } as const;
type FieldKey = keyof typeof IDS;

interface Problem {
  field?: FieldKey;
  message: string;
}

interface FormError {
  intro: string;
  items: Problem[];
}

/** A random value. crypto.randomUUID needs a secure page, so fall back step by step. */
function randomTag(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // fall through
  }
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // fall through
  }
  let out = '';
  while (out.length < 32) out += Math.random().toString(36).slice(2);
  return out.slice(0, 32);
}

// Used only when storage is blocked: one value per page load.
let pageLoadTag: string | null = null;

/**
 * A random code for this browser, kept in localStorage. The server stores it
 * privately (never shown) so it can slow down floods of takes from one device.
 * It is not an identity. If storage is blocked, a fresh code lasts for this page load.
 */
function getDeviceTag(valid: RegExp): string {
  try {
    const saved = window.localStorage.getItem(DEVICE_KEY);
    if (saved && valid.test(saved)) return saved;
    const fresh = randomTag();
    window.localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    if (!pageLoadTag) pageLoadTag = randomTag();
    return pageLoadTag;
  }
}

function fallbackMessage(status: number): string {
  if (status === 429) return 'That is a lot of takes in a short time. Please wait a little and try again.';
  if (status === 503) return 'Takes are paused right now. Please try again later.';
  if (status === 404) return 'This topic is not taking new takes right now.';
  if (status >= 500) return 'Something went wrong on our side. Please try again in a bit.';
  return 'We could not send your take. Please check it and try again.';
}

type SendResult = { ok: true } | { ok: false; status: number; error: string; field?: string };

async function sendTake(payload: Record<string, unknown>, token: string | null): Promise<SendResult> {
  let res: Response;
  try {
    res = await fetch('/api/hot-topics/takes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: 0, error: 'We could not reach the site. Check your connection and try again.' };
  }
  let json: { ok?: boolean; error?: unknown; field?: unknown } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (res.ok && json?.ok === true) return { ok: true };
  const error = typeof json?.error === 'string' && json.error.trim() ? json.error : fallbackMessage(res.status);
  return { ok: false, status: res.status, error, field: typeof json?.field === 'string' ? json.field : undefined };
}

function focusField(field: FieldKey) {
  document.getElementById(IDS[field])?.focus();
}

export default function TakesBox({ topic, prompt, rules }: { topic: string; prompt: string; rules: TakeRules }) {
  const { bodyMax: TAKE_MAX_LENGTH, nameMax: TAKE_NAME_MAX } = rules;
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [agree, setAgree] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot: hidden from people, filled by bots
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [limitMsg, setLimitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  // Counters, not booleans: bumping one moves focus in an effect after the page has updated.
  const [summaryFocus, setSummaryFocus] = useState(0);
  const [restart, setRestart] = useState(0);

  useEffect(() => {
    if (summaryFocus > 0) summaryRef.current?.focus();
  }, [summaryFocus]);

  useEffect(() => {
    if (done) statusRef.current?.focus();
  }, [done]);

  useEffect(() => {
    if (restart > 0) document.getElementById(IDS.body)?.focus();
  }, [restart]);

  function showProblems(problems: Problem[], intro?: string) {
    const errors: Partial<Record<FieldKey, string>> = {};
    for (const p of problems) if (p.field && !errors[p.field]) errors[p.field] = p.message;
    setFieldErrors(errors);
    setFormError({
      intro: intro ?? (problems.length === 1 ? '1 thing needs fixing.' : `${problems.length} things need fixing.`),
      items: problems,
    });
    setSummaryFocus((n) => n + 1);
  }

  function onBodyChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    const before = body.length;
    const n = next.length;
    setBody(next);
    setFieldErrors((prev) => (prev.body ? { ...prev, body: undefined } : prev));
    // Quiet counter: announce when 550 is crossed and at the limit, not on every key.
    const limitText = `Limit reached. ${TAKE_MAX_LENGTH} characters.`;
    setLimitMsg((prev) => {
      if (n >= TAKE_MAX_LENGTH) return limitText;
      if (n >= WARN_AT) {
        const left = TAKE_MAX_LENGTH - n;
        return before < WARN_AT || prev === limitText ? `${left} ${left === 1 ? 'character' : 'characters'} left.` : prev;
      }
      return '';
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sendingRef.current) return;

    const text = body.trim();
    const shown = name.trim();
    const found: Problem[] = [];
    if (text.length === 0) {
      found.push({ field: 'body', message: 'Write your take before you send it.' });
    } else if (text.length < MIN_BODY) {
      found.push({ field: 'body', message: `Write a little more. A take needs at least ${MIN_BODY} characters.` });
    } else if (text.length > TAKE_MAX_LENGTH) {
      found.push({ field: 'body', message: `Please keep your take to ${TAKE_MAX_LENGTH} characters or fewer.` });
    }
    if (shown.length > TAKE_NAME_MAX) {
      found.push({ field: 'name', message: `Please keep the name to ${TAKE_NAME_MAX} characters or fewer.` });
    }
    if (!agree) {
      found.push({
        field: 'agree',
        message: 'Tick the box so we know you understand your take is public once a person approves it.',
      });
    }
    if (found.length > 0) {
      showProblems(found);
      return;
    }

    sendingRef.current = true;
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    // A signed-in visitor sends their token so the take is marked as from a member.
    // Signed out, or any trouble reading the session, just sends it as a reader.
    let token: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? null;
    } catch {
      token = null;
    }

    const result = await sendTake(
      {
        topic,
        body: text,
        ...(shown ? { name: shown } : {}),
        website,
        device: getDeviceTag(new RegExp(rules.devicePattern)),
        agree: true,
      },
      token,
    );

    sendingRef.current = false;
    setSubmitting(false);

    if (result.ok) {
      setName('');
      setBody('');
      setAgree(false);
      setWebsite('');
      setLimitMsg('');
      setDone(true);
      return;
    }

    const field: FieldKey | undefined =
      result.field === 'body' || result.field === 'name' || result.field === 'agree' ? result.field : undefined;
    if (field) {
      showProblems([{ field, message: result.error }], 'We could not send your take.');
    } else {
      // No field to point at (rate limit, paused, server trouble): show the message on its own.
      setFieldErrors({});
      setFormError({ intro: result.error, items: [] });
      setSummaryFocus((n) => n + 1);
    }
  }

  function writeAnother() {
    setDone(false);
    setFormError(null);
    setFieldErrors({});
    setRestart((n) => n + 1);
  }

  const bodyDescribed = ['ht-take-prompt', 'ht-take-text-h', 'ht-take-count', fieldErrors.body ? 'ht-take-text-err' : null]
    .filter(Boolean)
    .join(' ');
  const nameDescribed = ['ht-take-name-h', fieldErrors.name ? 'ht-take-name-err' : null].filter(Boolean).join(' ');

  return (
    <div className="ht-wrap ht-think-body">
      <div className="ht-form-panel ht-on-paper ht-tape">
        <p className="ht-lead" id="ht-take-prompt">
          {prompt}
        </p>
        <p className="ht-hint">
          Short and honest is great. A person at AAC reads every take before it goes up. Be sharp about ideas and kind
          about people.
        </p>

        <div className="ht-status" role="status" tabIndex={-1} ref={statusRef}>
          {done && (
            <>
              <p>Thanks. A person reads every take before it goes up. If yours is approved it will show up here.</p>
              <button type="button" className="ht-btn ht-btn--paper" onClick={writeAnother}>
                Write another take
              </button>
            </>
          )}
        </div>

        {/* The form says method post: if it is ever submitted before the page has loaded its
            scripts (or with scripts off), the browser must not put the typed take into the address bar. */}
        {!done && (
          <form method="post" noValidate onSubmit={onSubmit} aria-labelledby="think-h">
            {/* Honeypot. Hidden from sighted users and assistive tech alike; only bots fill it. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="ht-take-website">Website</label>
              <input
                id="ht-take-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div id="ht-take-errors" className="ht-err-summary" role="alert" tabIndex={-1} ref={summaryRef}>
              {formError && (
                <>
                  <strong>Error:</strong> {formError.intro}
                  {formError.items.length > 0 && (
                    <ul>
                      {formError.items.map((p) => (
                        <li key={p.message}>
                          {p.field ? (
                            <a
                              href={`#${IDS[p.field]}`}
                              onClick={(e) => {
                                e.preventDefault();
                                focusField(p.field as FieldKey);
                              }}
                            >
                              {p.message}
                            </a>
                          ) : (
                            p.message
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="ht-field">
              <label htmlFor={IDS.name}>
                Name to show <span className="ht-opt">(optional)</span>
              </label>
              <p className="ht-hint" id="ht-take-name-h">
                Leave it blank and it shows as A reader, or A member if you are signed in to your member account.
                Being signed in as a member is noted with your take even when you give a name.
              </p>
              <input
                id={IDS.name}
                name="name"
                type="text"
                autoComplete="nickname"
                maxLength={TAKE_NAME_MAX}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors((prev) => (prev.name ? { ...prev, name: undefined } : prev));
                }}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={nameDescribed}
              />
              {fieldErrors.name && (
                <p className="ht-field-error" id="ht-take-name-err">
                  Error: {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="ht-field">
              <label htmlFor={IDS.body}>
                Your take <span className="ht-req">(required)</span>
              </label>
              <p className="ht-hint" id="ht-take-text-h">
                Up to {TAKE_MAX_LENGTH} characters.
              </p>
              <textarea
                id={IDS.body}
                name="take"
                maxLength={TAKE_MAX_LENGTH}
                value={body}
                onChange={onBodyChange}
                aria-required="true"
                aria-invalid={fieldErrors.body ? true : undefined}
                aria-describedby={bodyDescribed}
              />
              <p className="ht-hint" id="ht-take-count">
                {body.length} of {TAKE_MAX_LENGTH} characters
              </p>
              <p className="ht-sr" role="status">
                {limitMsg}
              </p>
              {fieldErrors.body && (
                <p className="ht-field-error" id="ht-take-text-err">
                  Error: {fieldErrors.body}
                </p>
              )}
            </div>

            <div className="ht-field">
              <label className="ht-check" htmlFor={IDS.agree}>
                <input
                  id={IDS.agree}
                  name="agree"
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => {
                    setAgree(e.target.checked);
                    setFieldErrors((prev) => (prev.agree ? { ...prev, agree: undefined } : prev));
                  }}
                  aria-required="true"
                  aria-invalid={fieldErrors.agree ? true : undefined}
                  aria-describedby={fieldErrors.agree ? 'ht-take-ok-err' : undefined}
                />
                <span>
                  I understand my take is public once a person approves it <span className="ht-req">(required)</span>
                </span>
              </label>
              {fieldErrors.agree && (
                <p className="ht-field-error" id="ht-take-ok-err">
                  Error: {fieldErrors.agree}
                </p>
              )}
            </div>

            <p className="ht-sr" role="status">
              {submitting ? 'Sending your take.' : ''}
            </p>
            <button type="submit" className="ht-btn ht-btn--red" aria-disabled={submitting}>
              {submitting ? 'Sending' : 'Send my take'}
            </button>
          </form>
        )}

        <p className="ht-privacy-note">
          We keep a random code from your browser to slow down spam, and your account if you are signed in. Neither is
          shown with your take. Only your words, the name you type, and the date are shown, and only after a person
          approves it. To have a take removed, <Link href="/contact">write to us</Link>.
        </p>
      </div>

      <TakesList topic={topic} />
    </div>
  );
}
