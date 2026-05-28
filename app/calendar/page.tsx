'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type CalEvent } from '@/lib/supabase';

// ── Stars (same field as Make Art / Learning Hub) ─────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 97.234) % 100,
  r: i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1,
  o: 0.5 + (i % 5) * 0.1,
}));

// ── Calendar helpers ──────────────────────────────────────────────────────────
const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 am – 8 pm

function getWeekStart(d: Date): Date {
  const s = new Date(d);
  s.setDate(d.getDate() - d.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}
function getWeekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function getMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDow = new Date(year, month, 1).getDay();
  const total    = new Date(year, month + 1, 0).getDate();
  const rows: (number | null)[][] = [];
  let day = 1;
  for (let r = 0; r < 6; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < 7; c++) {
      row.push((r === 0 && c < firstDow) || day > total ? null : day++);
    }
    rows.push(row);
    if (day > total) break;
  }
  return rows;
}
function fmtHour(h: number) {
  return h < 12 ? `${h}:00 am` : h === 12 ? '12:00 pm' : `${h - 12}:00 pm`;
}
function isToday(d: Date) {
  const t = new Date();
  return d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear();
}

// ── Types ─────────────────────────────────────────────────────────────────────
type FilterMode = 'all' | 'local-online' | 'online';
type CalView   = 'day' | '3day' | 'week' | 'month';
type Phase     = 'boot' | 'filter' | 'app';

// Tag colors for event chips
const TAG_COLORS: Record<string, string> = {
  'Captioned':           '#1a5c2a',
  'ASL-Interpreted':     '#2952c8',
  'Audio Described':     '#5a1a6e',
  'Relaxed Performance': '#a06000',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const [phase,       setPhase]       = useState<Phase>('boot');
  const [bootText,    setBootText]    = useState('Loading AAC Events Calendar');
  const [booting,     setBooting]     = useState(true);
  const [filterMode,  setFilterMode]  = useState<FilterMode>('all');
  const [postalCode,  setPostalCode]  = useState('');
  const [postalError, setPostalError] = useState('');
  const [view,        setView]        = useState<CalView>('week');
  const [weekStart,   setWeekStart]   = useState(() => getWeekStart(new Date()));
  const [monthDate,   setMonthDate]   = useState(() => new Date());
  const [events,      setEvents]      = useState<CalEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);

  const filterRef = useRef<HTMLHeadingElement>(null);
  const appRef    = useRef<HTMLHeadingElement>(null);
  const today     = new Date();

  // Boot sequence
  useEffect(() => {
    document.title = 'AAC Events Calendar · Artistic Accessibility Collective';

    // Default to 3-day on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 580) {
      setView('3day');
    }

    let dots = 0;
    const dotInt = setInterval(() => {
      dots = (dots + 1) % 4;
      setBootText('Loading AAC Events Calendar' + '.'.repeat(dots));
    }, 350);
    const bootTimer = setTimeout(() => {
      clearInterval(dotInt);
      setBooting(false);
      setTimeout(() => {
        setPhase('filter');
        setTimeout(() => filterRef.current?.focus(), 150);
      }, 200);
    }, 1800);
    return () => {
      clearInterval(dotInt);
      clearTimeout(bootTimer);
      document.title = 'Artistic Accessibility Collective';
    };
  }, []);

  // Check login state (to show "Submit Event" button)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  // Fetch events when the calendar opens
  useEffect(() => {
    if (phase !== 'app') return;
    const now = new Date();
    // Show events from 1 week ago onward so recently-passed events still appear briefly
    const lookback = new Date(now.getTime() - 7 * 86_400_000);
    supabase
      .from('events')
      .select('*')
      .eq('is_visible', true)
      .gte('start_at', lookback.toISOString())
      .order('start_at')
      .then(({ data }) => {
        setEvents((data ?? []) as CalEvent[]);
        setEventsLoaded(true);
      });
  }, [phase]);

  const handleContinue = () => {
    if (filterMode === 'local-online' && !postalCode.trim()) {
      setPostalError('Please enter your postal / zip code to find local events.');
      return;
    }
    setPostalError('');
    setPhase('app');
    setTimeout(() => appRef.current?.focus(), 150);
  };

  // Derived state
  const weekDays   = getWeekDays(weekStart);
  const threeDays  = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const monthGrid  = getMonthGrid(monthDate.getFullYear(), monthDate.getMonth());
  const filterLabel = filterMode === 'all'          ? 'All Events'
                    : filterMode === 'online'        ? 'Online Events Only'
                    : `Local + Online${postalCode.trim() ? ` · ${postalCode.trim()}` : ''}`;

  // Navigation
  const navPrev = () => {
    if (view === 'week') {
      setWeekStart(s => { const d = new Date(s); d.setDate(d.getDate() - 7); return d; });
    } else if (view === '3day' || view === 'day') {
      setWeekStart(s => { const d = new Date(s); d.setDate(d.getDate() - (view === 'day' ? 1 : 3)); return d; });
    } else {
      setMonthDate(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    }
  };
  const navNext = () => {
    if (view === 'week') {
      setWeekStart(s => { const d = new Date(s); d.setDate(d.getDate() + 7); return d; });
    } else if (view === '3day' || view === 'day') {
      setWeekStart(s => { const d = new Date(s); d.setDate(d.getDate() + (view === 'day' ? 1 : 3)); return d; });
    } else {
      setMonthDate(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    }
  };
  const navToday = () => {
    setWeekStart(getWeekStart(new Date()));
    setMonthDate(new Date());
  };

  // Period label
  const periodLabel = view === 'month'
    ? `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
    : view === 'week'
      ? `${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
      : view === '3day'
        ? `${MONTH_NAMES[threeDays[0].getMonth()]} ${threeDays[0].getDate()} – ${threeDays[2].getDate()}`
        : `${DAY_NAMES[today.getDay()]}, ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;

  // ── Render helper: Week/3-day time grid ──────────────────────────────────────
  const colDays  = view === '3day' ? threeDays : view === 'day' ? [today] : weekDays;
  const numCols  = colDays.length;

  const showComingSoon = eventsLoaded && events.length === 0;

  /** Events that start on the given calendar date */
  function eventsForDate(d: Date): CalEvent[] {
    return events.filter(ev => {
      const s = new Date(ev.start_at);
      return s.getFullYear() === d.getFullYear() &&
             s.getMonth()    === d.getMonth()    &&
             s.getDate()     === d.getDate();
    });
  }

  /** A small colored event chip */
  function EventChip({ ev }: { ev: CalEvent }) {
    const start   = new Date(ev.start_at);
    const timeStr = ev.is_all_day
      ? '' : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return (
      <a
        href={ev.event_url ?? '#'}
        target="_blank" rel="noopener noreferrer"
        style={{
          display: 'block', background: '#263590', color: '#fff',
          fontSize: 9, fontFamily: '"Tahoma", Arial, sans-serif',
          padding: '1px 4px', marginBottom: 2, borderRadius: 1,
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          textDecoration: 'none', cursor: 'pointer',
        }}
        title={[ev.title, timeStr, ev.organization].filter(Boolean).join(' · ')}
      >
        {timeStr && <span style={{ opacity: 0.75 }}>{timeStr} </span>}
        {ev.title}
      </a>
    );
  }

  function TimeGrid() {
    return (
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {/* Day header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `52px repeat(${numCols}, 1fr)`,
          borderBottom: '2px solid #b4b0a8',
          background: '#ece9d8',
          position: 'sticky', top: 0, zIndex: 2,
        }}>
          <div style={{ borderRight: '1px solid #b4b0a8' }} />
          {colDays.map((d, i) => {
            const dayEvs = eventsForDate(d);
            return (
              <div
                key={i}
                style={{
                  padding: '4px 3px 2px',
                  textAlign: 'center',
                  borderRight: i < numCols - 1 ? '1px solid #b4b0a8' : undefined,
                  background: isToday(d) ? '#dce8ff' : undefined,
                  fontWeight: isToday(d) ? 'bold' : 'normal',
                  color: isToday(d) ? '#263590' : '#333',
                  fontSize: 11,
                }}
              >
                <div>{DAY_NAMES[d.getDay()]}</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: dayEvs.length ? 3 : 0 }}>{d.getDate()}</div>
                {dayEvs.map(ev => <EventChip key={ev.id} ev={ev} />)}
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        <div style={{ position: 'relative' }}>
          {HOURS.map((h, hi) => (
            <div
              key={h}
              style={{
                display: 'grid',
                gridTemplateColumns: `52px repeat(${numCols}, 1fr)`,
                borderBottom: '1px solid #e8e4dc',
                minHeight: 44,
              }}
            >
              <div style={{
                fontSize: 9, color: '#888',
                padding: '3px 4px 0',
                borderRight: '1px solid #b4b0a8',
                textAlign: 'right',
                userSelect: 'none',
                lineHeight: 1,
              }}>
                {hi === 0 ? fmtHour(h) : fmtHour(h).replace(':00 ', '')}
              </div>
              {colDays.map((d, ci) => (
                <div
                  key={ci}
                  style={{
                    borderRight: ci < numCols - 1 ? '1px solid #e8e4dc' : undefined,
                    background: isToday(d) ? 'rgba(38,53,144,0.04)' : hi % 2 === 0 ? '#fff' : '#fafaf8',
                    minHeight: 44,
                  }}
                />
              ))}
            </div>
          ))}

          {/* Coming soon overlay — only when no events exist yet */}
          {showComingSoon && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.82)',
              pointerEvents: 'none',
            }}>
              <span style={{
                background: '#263590', color: 'white',
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                fontSize: 10, fontWeight: 'bold',
                padding: '2px 12px', letterSpacing: '0.08em',
                border: '1px solid #1a2568',
              }}>
                ★ COMING SOON ★
              </span>
              <p style={{
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                fontSize: 11, color: '#555', margin: 0, textAlign: 'center',
                maxWidth: 240, lineHeight: 1.5,
              }}>
                Events are on their way. Once live, you&apos;ll see accessibility
                events, interpreted performances, and community happenings here.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render helper: Month grid ─────────────────────────────────────────────────
  function MonthGrid() {
    const todayNum = today.getDate();
    const isCurrentMonth = monthDate.getMonth() === today.getMonth() &&
      monthDate.getFullYear() === today.getFullYear();
    return (
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {/* Day names header */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '2px solid #b4b0a8',
          background: '#ece9d8',
        }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{
              textAlign: 'center', padding: '3px 0',
              fontSize: 10, fontWeight: 'bold', color: '#555',
              borderRight: '1px solid #b4b0a8',
            }}>{d}</div>
          ))}
        </div>
        {/* Weeks */}
        {monthGrid.map((week, wi) => (
          <div key={wi} style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #e0dcd4',
            minHeight: 72,
          }}>
            {week.map((day, di) => {
              const cellDate = day !== null ? new Date(monthDate.getFullYear(), monthDate.getMonth(), day) : null;
              const dayEvs   = cellDate ? eventsForDate(cellDate) : [];
              return (
                <div key={di} style={{
                  borderRight: di < 6 ? '1px solid #e0dcd4' : undefined,
                  padding: '3px 5px',
                  background: day && isCurrentMonth && day === todayNum ? '#dce8ff' : '#fff',
                }}>
                  {day !== null && (
                    <>
                      <span style={{
                        display: 'inline-block',
                        width: 20, height: 20,
                        lineHeight: '20px',
                        textAlign: 'center',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: isCurrentMonth && day === todayNum ? 'bold' : 'normal',
                        background: isCurrentMonth && day === todayNum ? '#263590' : 'transparent',
                        color: isCurrentMonth && day === todayNum ? '#fff' : '#333',
                        marginBottom: dayEvs.length ? 2 : 0,
                      }}>
                        {day}
                      </span>
                      {dayEvs.map(ev => <EventChip key={ev.id} ev={ev} />)}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Coming soon overlay — only when no events exist yet */}
        {showComingSoon && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10,
          background: 'rgba(255,255,255,0.82)',
          pointerEvents: 'none',
        }}>
          <span style={{
            background: '#263590', color: 'white',
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            fontSize: 10, fontWeight: 'bold',
            padding: '2px 12px', letterSpacing: '0.08em',
            border: '1px solid #1a2568',
          }}>★ COMING SOON ★</span>
          <p style={{
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            fontSize: 11, color: '#555', margin: 0, textAlign: 'center',
            maxWidth: 240, lineHeight: 1.5,
          }}>
            Events are on their way. Once live, you&apos;ll see accessibility
            events, interpreted performances, and community happenings here.
          </p>
        </div>
        )}
      </div>
    );
  }

  // ── Mini sidebar calendar ─────────────────────────────────────────────────────
  const sideGrid = getMonthGrid(today.getFullYear(), today.getMonth());

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="cal-outer"
      style={{
        position: 'fixed', inset: 0,
        background: '#0a0a1a',
        overflow: 'hidden',
        fontFamily: '"Tahoma", "MS Sans Serif", Arial, sans-serif',
      }}
      role="main"
    >
      <style>{`
        @keyframes cal-window-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.88); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes cal-boot-fade {
          0%  { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; }
        }
        @keyframes cal-filter-in {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cal-window, .cal-filter-box { animation: none !important; }
          .cal-boot { animation: none !important; display: none !important; }
        }
        .cal-view-btn:hover { background: #316ac5 !important; color: #fff !important; }
        .cal-view-btn:focus-visible { outline: 2px solid #f5d84a; outline-offset: 1px; }
        .cal-nav-btn:hover { background: #c8c4bc !important; }
        .cal-nav-btn:focus-visible { outline: 2px solid #f5d84a; outline-offset: 1px; }
        .cal-filter-opt:focus-within { outline: 2px solid #f5d84a; }

        /* Mobile */
        @media (max-width: 620px) {
          .cal-outer {
            position: static !important;
            min-height: 100dvh !important;
            overflow: auto !important;
          }
          .cal-window {
            position: static !important;
            transform: none !important;
            inset: unset !important;
            width: 100% !important;
            max-height: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .cal-sidebar { display: none !important; }
          .cal-filter-box {
            position: static !important;
            transform: none !important;
            margin: 20px auto !important;
            width: calc(100% - 32px) !important;
          }
        }
      `}</style>

      <h1 className="sr-only">AAC Events Calendar · Artistic Accessibility Collective</h1>

      {/* ── Boot splash ────────────────────────────────────────────────────────── */}
      {booting && (
        <div
          className="cal-boot"
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16,
            animation: 'cal-boot-fade 1.8s ease forwards',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 56 }}>💿</span>
          <div style={{
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            fontSize: 13, color: '#ccc', letterSpacing: '0.05em',
            minWidth: 260, textAlign: 'center',
          }}>
            {bootText}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {['#263590','#3a4fb8','#5468d4','#7a8fe0','#aab4f0'].map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, background: c, border: '1px solid rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Starfield ──────────────────────────────────────────────────────────── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {STARS.map(s => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.o} />
        ))}
      </svg>

      {/* ── Pre-filter dialog ──────────────────────────────────────────────────── */}
      {phase === 'filter' && (
        <div
          className="cal-filter-box"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(440px, calc(100vw - 32px))',
            border: '2px solid #888',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
            animation: 'cal-filter-in 0.2s ease forwards',
          }}
          role="dialog"
          aria-labelledby="filter-heading"
          aria-modal="true"
        >
          {/* Dialog title bar */}
          <div style={{
            background: 'linear-gradient(to right, #263590 0%, #4060d8 60%, #2a3aaa 100%)',
            padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>💿</span>
            <span style={{
              color: 'white', fontWeight: 'bold', fontSize: 12,
              fontFamily: '"Tahoma", Arial, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}>
              AAC Events Calendar 2026
            </span>
          </div>

          {/* Dialog body */}
          <div style={{ background: '#f0ede8', padding: '20px 20px 16px' }}>
            <h2
              ref={filterRef}
              tabIndex={-1}
              id="filter-heading"
              style={{
                fontFamily: '"Tahoma", Arial, sans-serif',
                fontSize: 14, fontWeight: 'bold',
                color: '#263590', margin: '0 0 6px',
                outline: 'none',
              }}
            >
              Welcome! Choose your event view:
            </h2>
            <p style={{
              fontFamily: '"MS Sans Serif", Arial, sans-serif',
              fontSize: 11, color: '#555', margin: '0 0 16px', lineHeight: 1.5,
            }}>
              You can change this any time using the Filter button inside the calendar.
            </p>

            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend className="sr-only">Event filter preference</legend>

              {([
                { value: 'all',           label: 'All Events',
                  desc: 'Show every event in the calendar, worldwide.' },
                { value: 'local-online',  label: 'Local + Online Events',
                  desc: 'Events near you plus all online / virtual events.' },
                { value: 'online',        label: 'Online Events Only',
                  desc: 'Virtual, livestreamed, and remote-access events only.' },
              ] as { value: FilterMode; label: string; desc: string }[]).map(opt => (
                <label
                  key={opt.value}
                  className="cal-filter-opt"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px',
                    marginBottom: 6,
                    background: filterMode === opt.value ? '#dce5ff' : '#fff',
                    border: filterMode === opt.value ? '2px solid #263590' : '2px solid #c8c4bc',
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'border-color 0.1s, background 0.1s',
                  }}
                >
                  <input
                    type="radio"
                    name="filter"
                    value={opt.value}
                    checked={filterMode === opt.value}
                    onChange={() => { setFilterMode(opt.value); setPostalError(''); }}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: '#263590' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 12, color: '#222', lineHeight: 1.3 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </fieldset>

            {/* Postal code input — shown when local-online is selected */}
            {filterMode === 'local-online' && (
              <div style={{ marginTop: 10 }}>
                <label htmlFor="postal-code" style={{
                  display: 'block', fontWeight: 'bold', fontSize: 11,
                  color: '#333', marginBottom: 4,
                }}>
                  Your postal / zip code:
                </label>
                <input
                  id="postal-code"
                  type="text"
                  value={postalCode}
                  onChange={e => { setPostalCode(e.target.value); setPostalError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleContinue(); }}
                  placeholder="e.g. 78701  ·  SW1A 1AA  ·  2000"
                  autoComplete="postal-code"
                  aria-invalid={!!postalError}
                  aria-describedby={postalError ? 'postal-error' : 'postal-hint'}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: postalError ? '2px solid #cc0000' : '2px inset #999',
                    padding: '4px 8px', fontSize: 12,
                    fontFamily: '"Tahoma", Arial, sans-serif',
                    background: '#fff',
                  }}
                />
                {postalError && (
                  <p id="postal-error" role="alert" style={{ color: '#cc0000', fontSize: 11, margin: '4px 0 0' }}>
                    {postalError}
                  </p>
                )}
                {!postalError && (
                  <p id="postal-hint" style={{ fontSize: 10, color: '#777', margin: '4px 0 0' }}>
                    Works with US zip codes, UK postcodes, Australian postcodes, and more.
                  </p>
                )}
              </div>
            )}

            {/* Continue button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18, gap: 8 }}>
              <button
                onClick={handleContinue}
                style={{
                  background: 'linear-gradient(to bottom, #4468d8 0%, #263590 100%)',
                  color: '#fff', border: '1px outset #1a2568',
                  padding: '5px 22px', fontSize: 12, fontWeight: 'bold',
                  fontFamily: '"Tahoma", Arial, sans-serif',
                  cursor: 'pointer', borderRadius: 3,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                  letterSpacing: '0.02em',
                }}
                className="cal-nav-btn"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar app window ────────────────────────────────────────────────── */}
      {phase === 'app' && (
        <div
          className="cal-window"
          style={{
            position: 'absolute',
            inset: '50% auto auto 50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(960px, calc(100vw - 16px))',
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex', flexDirection: 'column',
            border: '2px solid #888',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 0 0 1px #555, 0 12px 50px rgba(0,0,0,0.8)',
            animation: 'cal-window-in 0.2s ease forwards',
          }}
        >
          {/* ── Title bar ────────────────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(to right, #263590 0%, #4060d8 60%, #2a3aaa 100%)',
            padding: '4px 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            userSelect: 'none', flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'white', fontWeight: 'bold', fontSize: 12,
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}>
              <span aria-hidden="true" style={{ fontSize: 15 }}>💿</span>
              AAC Events Calendar
            </div>
            <div aria-hidden="true" style={{ display: 'flex', gap: 2 }}>
              {['_','□','✕'].map(c => (
                <div key={c} style={{
                  width: 16, height: 14, background: '#3a52c8',
                  border: '1px solid #6a82f0', borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 9, fontWeight: 'bold', cursor: 'default',
                }}>{c}</div>
              ))}
            </div>
          </div>

          {/* ── View toolbar ─────────────────────────────────────────────────── */}
          <div style={{
            background: '#d4d0c8',
            borderBottom: '2px solid #808080',
            padding: '3px 6px',
            display: 'flex', alignItems: 'center', gap: 6,
            flexShrink: 0, flexWrap: 'wrap',
          }}>
            {/* Period navigation */}
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <button
                onClick={navPrev}
                aria-label="Previous"
                className="cal-nav-btn"
                style={{
                  background: '#d4d0c8', border: '1px outset #fff',
                  padding: '1px 8px', fontSize: 11, cursor: 'pointer',
                  fontFamily: '"MS Sans Serif", Arial, sans-serif',
                  borderRadius: 2,
                }}
              >◄</button>
              <button
                onClick={navToday}
                className="cal-nav-btn"
                style={{
                  background: '#d4d0c8', border: '1px outset #fff',
                  padding: '1px 8px', fontSize: 11, cursor: 'pointer',
                  fontFamily: '"MS Sans Serif", Arial, sans-serif',
                  borderRadius: 2, fontWeight: 'bold',
                }}
              >Today</button>
              <button
                onClick={navNext}
                aria-label="Next"
                className="cal-nav-btn"
                style={{
                  background: '#d4d0c8', border: '1px outset #fff',
                  padding: '1px 8px', fontSize: 11, cursor: 'pointer',
                  fontFamily: '"MS Sans Serif", Arial, sans-serif',
                  borderRadius: 2,
                }}
              >►</button>
            </div>

            {/* Period label */}
            <span style={{
              fontWeight: 'bold', fontSize: 12, color: '#000',
              fontFamily: '"Tahoma", Arial, sans-serif',
              padding: '0 6px', minWidth: 160,
            }}>
              {periodLabel}
            </span>

            {/* Home + Resources nav buttons */}
            <a
              href="/"
              aria-label="Home"
              className="cal-nav-btn"
              style={{
                width: 28, height: 24,
                background: '#263590',
                border: '2px outset #fff',
                borderRadius: 2,
                fontSize: 15, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', flexShrink: 0,
              }}
              title="Home"
            >🏠</a>
            <a
              href="/resources"
              aria-label="Accessibility Resources"
              className="cal-nav-btn"
              style={{
                width: 28, height: 24,
                background: '#2272c8',
                border: '2px outset #fff',
                borderRadius: 2,
                fontSize: 15, lineHeight: 1,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none', flexShrink: 0,
              }}
              title="Accessibility Resources"
            >🔵</a>
            <div aria-hidden="true" style={{ width: 1, height: 16, background: '#999', margin: '0 2px' }} />

            {/* Submit Event button */}
            <button
              onClick={() => router.push('/submit-event')}
              className="cal-nav-btn"
              style={{
                background: '#263590', color: '#fff',
                border: '1px outset #1a2568',
                padding: '2px 10px', fontSize: 11, cursor: 'pointer',
                fontFamily: '"Tahoma", Arial, sans-serif',
                borderRadius: 2, fontWeight: 'bold',
              }}
              title={isLoggedIn ? 'Submit a community event' : 'Log in to submit an event'}
            >
              + Event
            </button>

            <div style={{ flex: 1 }} />

            {/* View tabs */}
            <div
              role="tablist"
              aria-label="Calendar view"
              style={{ display: 'flex', gap: 1 }}
            >
              {(['day','3day','week','month'] as CalView[]).map(v => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className="cal-view-btn"
                  style={{
                    background: view === v ? '#263590' : '#d4d0c8',
                    color: view === v ? '#fff' : '#000',
                    border: view === v ? '1px inset #1a2568' : '1px outset #fff',
                    padding: '2px 10px', fontSize: 11, cursor: 'pointer',
                    fontFamily: '"Tahoma", Arial, sans-serif',
                    borderRadius: 2, transition: 'background 0.1s',
                  }}
                >
                  {v === '3day' ? '3 Days' : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content area: sidebar + main ─────────────────────────────────── */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

            {/* ── Sidebar ────────────────────────────────────────────────────── */}
            <div
              className="cal-sidebar"
              style={{
                width: 160, flexShrink: 0,
                background: '#ece8df',
                borderRight: '2px solid #808080',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Mini calendar */}
              <div style={{
                background: '#263590', color: '#fff',
                fontSize: 10, fontWeight: 'bold',
                padding: '3px 8px',
                letterSpacing: '0.04em',
              }}>
                {MONTH_NAMES[today.getMonth()].toUpperCase()} {today.getFullYear()}
              </div>
              <div style={{ padding: '4px 6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
                  {DAY_NAMES.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 8, color: '#888', fontWeight: 'bold' }}>
                      {d[0]}
                    </div>
                  ))}
                </div>
                {getMonthGrid(today.getFullYear(), today.getMonth()).map((week, wi) => (
                  <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                    {week.map((day, di) => (
                      <div key={di} style={{
                        textAlign: 'center', fontSize: 9, lineHeight: '16px',
                        borderRadius: 8,
                        background: day === today.getDate() ? '#263590' : 'transparent',
                        color: day === today.getDate() ? '#fff' : day ? '#333' : 'transparent',
                        fontWeight: day === today.getDate() ? 'bold' : 'normal',
                      }}>
                        {day ?? ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Active filter */}
              <div style={{
                margin: '8px 8px 0',
                background: '#fff',
                border: '1px inset #aaa',
                padding: '6px 8px',
              }}>
                <div style={{ fontSize: 9, fontWeight: 'bold', color: '#555', marginBottom: 3, letterSpacing: '0.04em' }}>
                  ACTIVE FILTER
                </div>
                <div style={{ fontSize: 10, color: '#263590', fontWeight: 'bold', lineHeight: 1.4 }}>
                  {filterLabel}
                </div>
                <button
                  onClick={() => setPhase('filter')}
                  style={{
                    marginTop: 6, background: 'none', border: 'none',
                    padding: 0, fontSize: 9, color: '#263590',
                    textDecoration: 'underline', cursor: 'pointer',
                    fontFamily: '"MS Sans Serif", Arial, sans-serif',
                  }}
                >
                  Change filter
                </button>
              </div>

              {/* Expand to 1-day hint (shown in 3-day/week views on mobile — sidebar visible on desktop only) */}
              <div style={{ margin: '8px 8px 0', fontSize: 9, color: '#777', lineHeight: 1.5 }}>
                Tip: Switch to <strong>Day</strong> view for a focused single-day look.
              </div>
            </div>

            {/* ── Main grid ──────────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fafaf6' }}>

              {/* Screen reader heading */}
              <h2
                ref={appRef}
                tabIndex={-1}
                style={{
                  position: 'absolute', left: -9999, top: 'auto',
                  width: 1, height: 1, overflow: 'hidden',
                }}
              >
                AAC Events Calendar — {periodLabel}
              </h2>

              {view === 'month' ? <MonthGrid /> : <TimeGrid />}

            </div>
          </div>

          {/* ── Status bar ───────────────────────────────────────────────────── */}
          <div style={{
            background: '#d4d0c8',
            borderTop: '2px solid #808080',
            padding: '2px 10px',
            display: 'flex', alignItems: 'center', gap: 16,
            fontSize: 10, color: '#333',
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            flexShrink: 0, userSelect: 'none',
          }} aria-hidden="true">
            <span>{events.length} {events.length === 1 ? 'event' : 'events'}</span>
            <span>·</span>
            <span>Filter: {filterLabel}</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontStyle: 'italic' }}>AAC Events Calendar · artisticaccessibility.com</span>
          </div>
        </div>
      )}
    </div>
  );
}
