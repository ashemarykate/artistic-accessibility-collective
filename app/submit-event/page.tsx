'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getSessionUser } from '@/lib/supabase';

// ── Tags available for event submissions ──────────────────────────────────────
const TAG_OPTIONS = [
  'Captioned',
  'ASL-Interpreted',
  'Audio Described',
  'Relaxed Performance',
  'Disability Arts',
  'Deaf Arts',
  'Film Screening',
  'Workshop',
  'Exhibition',
  'Performance',
  'Lecture / Talk',
  'Community Event',
  'Online Accessible',
  'Free / Pay What You Can',
];

// ── Shared input styles (CD-ROM Win2000 aesthetic) ────────────────────────────
const WIN_INP: React.CSSProperties = {
  width: '100%',
  padding: '3px 5px',
  fontSize: 12,
  border: '2px inset #fff',
  background: '#fff',
  fontFamily: '"MS Sans Serif", Arial, sans-serif',
  boxSizing: 'border-box' as const,
  outline: 'none',
};
const WIN_LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#000',
  marginBottom: 3,
  fontFamily: '"MS Sans Serif", Arial, sans-serif',
};
const WIN_ROW: React.CSSProperties = { marginBottom: '0.75rem' };
const WIN_ROW2: React.CSSProperties = {
  display: 'flex', gap: 8, marginBottom: '0.75rem', flexWrap: 'wrap' as const,
};
const REQUIRED_MARK = (
  <span style={{ color: '#900', fontWeight: 400 }} aria-hidden="true"> *</span>
);
const ERR: React.CSSProperties = {
  fontSize: 11, color: '#900',
  fontFamily: '"MS Sans Serif", Arial, sans-serif',
  marginTop: 3,
};

// ── Raised button (Win2000 style) ─────────────────────────────────────────────
function WinBtn({
  children, onClick, primary, disabled, type = 'button', style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 16px',
        fontSize: 11,
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontWeight: 700,
        background: primary ? '#263590' : '#d4d0c8',
        color: primary ? '#fff' : '#000',
        border: primary
          ? '2px outset #263590'
          : '2px outset #fff',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        minWidth: 80,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SubmitEventPage() {
  const router = useRouter();
  const [checking,  setChecking]  = useState(true);
  const [authed,    setAuthed]    = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  // Form state
  const [title,       setTitle]       = useState('');
  const [org,         setOrg]         = useState('');
  const [description, setDescription] = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [startTime,   setStartTime]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [endTime,     setEndTime]     = useState('');
  const [isAllDay,    setIsAllDay]    = useState(false);
  const [locType,     setLocType]     = useState<'in-person' | 'online' | 'hybrid'>('online');
  const [locName,     setLocName]     = useState('');
  const [locUrl,      setLocUrl]      = useState('');
  const [eventUrl,    setEventUrl]    = useState('');
  const [tags,        setTags]        = useState<string[]>([]);
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = 'Submit an Event · Artistic Accessibility Collective';
    checkAuth();
    return () => { document.title = 'Artistic Accessibility Collective'; };
  }, []);

  useEffect(() => {
    if (!checking && authed) setTimeout(() => headingRef.current?.focus(), 100);
  }, [checking, authed]);

  useEffect(() => {
    if (submitted) setTimeout(() => successRef.current?.focus(), 100);
  }, [submitted]);

  const checkAuth = async () => {
    const user = await getSessionUser();
    if (!user) {
      router.push('/login');
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();
    if (!profile) {
      router.push('/members');
      return;
    }
    setAuthed(true);
    setChecking(false);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim())    errs.title    = 'Event title is required.';
    if (!startDate.trim()) errs.startDate = 'Start date is required.';
    if (!isAllDay && !startTime.trim()) errs.startTime = 'Start time is required (or check All-day).';
    if (!eventUrl.trim()) errs.eventUrl = 'Link to event page or tickets is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError('');

    let startTs: string;
    let endTs: string | null;

    try {
      const startDateObj = isAllDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime}`);
      if (isNaN(startDateObj.getTime())) throw new Error('invalid start date');
      startTs = startDateObj.toISOString();

      if (endDate) {
        const endDateObj = isAllDay
          ? new Date(`${endDate}T23:59:59`)
          : endTime
            ? new Date(`${endDate}T${endTime}`)
            : null;
        if (endDateObj) {
          if (isNaN(endDateObj.getTime())) throw new Error('invalid end date');
          endTs = endDateObj.toISOString();
        } else {
          endTs = null;
        }
      } else {
        endTs = null;
      }
    } catch {
      setSaveError('that date or time doesn\'t look right. Please double-check the date and time fields.');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('events').insert({
      title:         title.trim(),
      organization:  org.trim() || null,
      description:   description.trim() || null,
      start_at:      startTs,
      end_at:        endTs,
      is_all_day:    isAllDay,
      location_type: locType,
      location_name: locName.trim() || null,
      location_url:  locUrl.trim() || null,
      event_url:     eventUrl.trim(),
      tags,
      source:        'member',
      is_visible:    true,
    });

    if (error) {
      setSaveError(error.message);
      setSaving(false);
    } else {
      setSubmitted(true);
    }
  };

  // ── Loading / auth check ──────────────────────────────────────────────────
  if (checking) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed', inset: 0,
          background: '#008080',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{
          background: '#d4d0c8', border: '2px outset #fff',
          padding: '24px 32px', textAlign: 'center',
          fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 12,
        }}>
          <div style={{ marginBottom: 12, fontSize: 20 }}>💿</div>
          Checking your membership…
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#008080',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <div style={{
          background: '#d4d0c8',
          border: '2px outset #fff',
          maxWidth: 460, width: '100%',
        }}>
          {/* Title bar */}
          <div style={{
            background: 'linear-gradient(to right, #263590, #5a87d8)',
            padding: '4px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#fff', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontWeight: 700, fontSize: 11 }}>
              💿 Community Events Calendar
            </span>
          </div>
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h1
              ref={successRef}
              tabIndex={-1}
              style={{
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                fontWeight: 700, fontSize: 16,
                color: '#263590', marginBottom: 8,
              }}
            >
              Event submitted!
            </h1>
            <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 12, color: '#333', marginBottom: 24 }}>
              Your event is live on the calendar. Thanks for keeping the community informed.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <WinBtn primary onClick={() => router.push('/calendar')}>
                View Calendar
              </WinBtn>
              <WinBtn onClick={() => {
                setSubmitted(false);
                setTitle(''); setOrg(''); setDescription('');
                setStartDate(''); setStartTime(''); setEndDate(''); setEndTime('');
                setLocName(''); setLocUrl(''); setEventUrl(''); setTags([]);
                setSaveError('');
              }}>
                Submit Another
              </WinBtn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#008080',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }}>
      <div style={{
        background: '#d4d0c8',
        border: '2px outset #fff',
        width: '100%', maxWidth: 560,
        flexShrink: 0, marginBottom: 24,
      }}>
        {/* Title bar */}
        <div style={{
          background: 'linear-gradient(to right, #263590, #5a87d8)',
          padding: '4px 8px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>💿</span>
          <span style={{ color: '#fff', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontWeight: 700, fontSize: 11, flex: 1 }}>
            Community Events Calendar: Submit Event
          </span>
        </div>

        {/* Toolbar */}
        <div style={{
          borderBottom: '1px solid #b4b0a8',
          padding: '4px 6px',
          display: 'flex', gap: 4, alignItems: 'center',
        }}>
          <button
            onClick={() => router.push('/calendar')}
            style={{
              background: '#d4d0c8', border: '2px outset #fff',
              padding: '2px 8px', fontSize: 11,
              fontFamily: '"MS Sans Serif", Arial, sans-serif',
              cursor: 'pointer',
            }}
          >
            ◄ Calendar
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding: '16px 20px' }}>
          <h1
            ref={headingRef}
            tabIndex={-1}
            style={{
              fontFamily: '"MS Sans Serif", Arial, sans-serif',
              fontSize: 13, fontWeight: 700, color: '#263590',
              marginBottom: 16, outline: 'none',
            }}
          >
            Add a Community Event
          </h1>

          <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#555', marginBottom: 16, lineHeight: 1.5 }}>
            Events go live immediately and appear on the public calendar.
            Fields marked <span style={{ color: '#900' }}>*</span> are required.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Event name */}
            <div style={WIN_ROW}>
              <label style={WIN_LABEL} htmlFor="ev-title">
                Event name {REQUIRED_MARK}
              </label>
              <input
                id="ev-title"
                style={{ ...WIN_INP, border: errors.title ? '2px inset #900' : WIN_INP.border }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'ev-title-err' : undefined}
              />
              {errors.title && <p id="ev-title-err" role="alert" style={ERR}>{errors.title}</p>}
            </div>

            {/* Organization */}
            <div style={WIN_ROW}>
              <label style={WIN_LABEL} htmlFor="ev-org">
                Organization / presenter <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="ev-org"
                style={WIN_INP}
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. AXIS Dance"
              />
            </div>

            {/* Dates */}
            <div style={{ ...WIN_ROW, background: '#ece9d8', border: '1px solid #b4b0a8', padding: 10, borderRadius: 2 }}>
              <p style={{ ...WIN_LABEL, marginBottom: 8 }}>Date and time {REQUIRED_MARK}</p>

              {/* All-day toggle */}
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  id="ev-allday"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                />
                <label htmlFor="ev-allday" style={{ ...WIN_LABEL, marginBottom: 0 }}>All-day event</label>
              </div>

              <div style={WIN_ROW2}>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={WIN_LABEL} htmlFor="ev-start-date">Start date {REQUIRED_MARK}</label>
                  <input
                    id="ev-start-date"
                    type="date"
                    style={{ ...WIN_INP, border: errors.startDate ? '2px inset #900' : WIN_INP.border }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-invalid={!!errors.startDate}
                    aria-describedby={errors.startDate ? 'ev-start-date-err' : undefined}
                  />
                  {errors.startDate && <p id="ev-start-date-err" role="alert" style={ERR}>{errors.startDate}</p>}
                </div>
                {!isAllDay && (
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={WIN_LABEL} htmlFor="ev-start-time">Start time {REQUIRED_MARK}</label>
                    <input
                      id="ev-start-time"
                      type="time"
                      style={{ ...WIN_INP, border: errors.startTime ? '2px inset #900' : WIN_INP.border }}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      aria-invalid={!!errors.startTime}
                      aria-describedby={errors.startTime ? 'ev-start-time-err' : undefined}
                    />
                    {errors.startTime && <p id="ev-start-time-err" role="alert" style={ERR}>{errors.startTime}</p>}
                  </div>
                )}
              </div>

              <div style={WIN_ROW2}>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={WIN_LABEL} htmlFor="ev-end-date">End date <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input
                    id="ev-end-date"
                    type="date"
                    style={WIN_INP}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
                {!isAllDay && (
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={WIN_LABEL} htmlFor="ev-end-time">End time <span style={{ fontWeight: 400 }}>(optional)</span></label>
                    <input
                      id="ev-end-time"
                      type="time"
                      style={WIN_INP}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div style={{ ...WIN_ROW, background: '#ece9d8', border: '1px solid #b4b0a8', padding: 10, borderRadius: 2 }}>
              <p style={{ ...WIN_LABEL, marginBottom: 8 }}>Location</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                {(['online', 'in-person', 'hybrid'] as const).map((t) => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: '"MS Sans Serif", Arial, sans-serif', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="loc-type"
                      value={t}
                      checked={locType === t}
                      onChange={() => setLocType(t)}
                    />
                    {t === 'online' ? 'Online' : t === 'in-person' ? 'In-person' : 'In-person + Online'}
                  </label>
                ))}
              </div>

              {(locType === 'in-person' || locType === 'hybrid') && (
                <div style={{ marginBottom: 8 }}>
                  <label style={WIN_LABEL} htmlFor="ev-loc-name">Venue / location name</label>
                  <input
                    id="ev-loc-name"
                    style={WIN_INP}
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="e.g. Yerba Buena Center for the Arts, San Francisco"
                  />
                </div>
              )}

              {(locType === 'online' || locType === 'hybrid') && (
                <div>
                  <label style={WIN_LABEL} htmlFor="ev-loc-url">Online link</label>
                  <input
                    id="ev-loc-url"
                    type="url"
                    style={WIN_INP}
                    value={locUrl}
                    onChange={(e) => setLocUrl(e.target.value)}
                    placeholder="https://zoom.us/…"
                  />
                </div>
              )}
            </div>

            {/* Event URL */}
            <div style={WIN_ROW}>
              <label style={WIN_LABEL} htmlFor="ev-url">
                Event page or tickets link {REQUIRED_MARK}
              </label>
              <input
                id="ev-url"
                type="url"
                style={{ ...WIN_INP, border: errors.eventUrl ? '2px inset #900' : WIN_INP.border }}
                value={eventUrl}
                onChange={(e) => setEventUrl(e.target.value)}
                placeholder="https://"
                aria-invalid={!!errors.eventUrl}
                aria-describedby={errors.eventUrl ? 'ev-url-err' : undefined}
              />
              {errors.eventUrl && <p id="ev-url-err" role="alert" style={ERR}>{errors.eventUrl}</p>}
            </div>

            {/* Description */}
            <div style={WIN_ROW}>
              <label style={WIN_LABEL} htmlFor="ev-desc">
                Description <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="ev-desc"
                rows={4}
                style={{ ...WIN_INP, resize: 'vertical', minHeight: 80 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div style={{ ...WIN_ROW, background: '#ece9d8', border: '1px solid #b4b0a8', padding: 10, borderRadius: 2 }}>
              <p style={{ ...WIN_LABEL, marginBottom: 8 }}>
                Tags <span style={{ fontWeight: 400 }}>(select all that apply)</span>
              </p>
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                role="group"
                aria-label="Event tags"
              >
                {TAG_OPTIONS.map((tag) => (
                  <label
                    key={tag}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11,
                      fontFamily: '"MS Sans Serif", Arial, sans-serif',
                      cursor: 'pointer',
                      background: tags.includes(tag) ? '#263590' : '#fff',
                      color: tags.includes(tag) ? '#fff' : '#000',
                      border: '1px solid #b4b0a8',
                      padding: '3px 7px',
                      borderRadius: 2,
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                      className="chip-checkbox"
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit error */}
            {saveError && (
              <p role="alert" style={{ ...ERR, marginBottom: 12 }}>
                Something went wrong: {saveError}
              </p>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
              <WinBtn onClick={() => router.push('/calendar')}>Cancel</WinBtn>
              <WinBtn type="submit" primary disabled={saving}>
                {saving ? 'Submitting…' : 'Submit Event'}
              </WinBtn>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
