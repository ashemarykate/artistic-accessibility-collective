'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type CalEvent } from '@/lib/supabase';
import Modal from '@/components/Modal';

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
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const ROW_H = 46; // px per hour in the day/week time grid

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
type FilterMode = 'all' | 'online';
type CalView   = 'day' | '3day' | 'week' | 'month' | 'list';
type Phase     = 'boot' | 'app';

// The five calendar views, in the order the switcher lists them.
const VIEW_TABS: CalView[] = ['list', 'day', '3day', 'week', 'month'];

// ── Event type classification + colors ────────────────────────────────────────
// Derived on the fly from title + organisation, so it works for synced, member,
// and admin events with no schema change. Colors are dark enough for white text
// (each clears WCAG AA against #fff at small sizes).
type EventType = 'theatre' | 'dance' | 'music' | 'film' | 'education' | 'community' | 'visual' | 'other';

const TYPE_META: Record<EventType, { label: string; color: string }> = {
  theatre:   { label: 'Theatre & Performance', color: '#9c2a63' },
  dance:     { label: 'Dance',                 color: '#b0511d' },
  music:     { label: 'Music',                 color: '#5a3aa8' },
  film:      { label: 'Film & Screening',      color: '#196a78' },
  education: { label: 'Education & Workshops',  color: '#2e7d3e' },
  community: { label: 'Community & Social',     color: '#8a5a10' },
  visual:    { label: 'Visual Art',            color: '#a5324e' },
  other:     { label: 'Other',                 color: '#4a5478' },
};
// The order the legend lists them (roughly most to least common).
const TYPE_ORDER: EventType[] = ['theatre', 'community', 'dance', 'film', 'education', 'visual', 'music', 'other'];

// Organisation → default type, used when a title is just a proper noun (a show
// or film name carries no keyword). Substring match on the organisation name.
const ORG_TYPE: [string, EventType][] = [
  ['AXIS Dance', 'dance'], ['Young Dance', 'dance'], ['Propeller Dance', 'dance'],
  ['DanceAbility', 'dance'], ['Portland Art Museum', 'film'],
  ['Auslan Stage Left', 'theatre'], ['Starcatchers', 'theatre'],
  ['Detour Company Theatre', 'theatre'], ['School for the Deaf', 'theatre'],
  ['Interact Center', 'visual'], ['Arts Project Australia', 'visual'],
  ['Arts of Life', 'visual'], ['accessArts', 'visual'],
  ['Access Living', 'community'], ['Tierra del Sol', 'community'],
];

function classifyEvent(ev: CalEvent): EventType {
  const s = `${ev.title ?? ''} ${(ev.description ?? '').slice(0, 80)}`.toLowerCase();
  if (/\b(musical|theatre|theater|\bplay\b|opera|panto|cabaret|circus|stage show)\b/.test(s)) return 'theatre';
  if (/\b(film|screening|cinema|movie|documentary|\bshorts?\b)\b|x qdoc|video store/.test(s)) return 'film';
  if (/\b(dance|movement|ballet|choreo|storytime)\b/.test(s)) return 'dance';
  if (/\b(workshop|class(?:es)?|camp|course|lesson|seminar|training|lecture|panel|game jam|composition|masterclass|intensive)\b/.test(s)) return 'education';
  if (/\b(concert|\bband\b|karaoke|choir|orchestra|open mic|poetry|singer|song)\b/.test(s)) return 'music';
  if (/exhibit|\b(gallery|open studio|art open|artwork|painting|craft|first thursday|art beat|art walk)\b/.test(s)) return 'visual';
  if (/\b(social|meetup|mixer|gathering|celebration|\bparty\b|pride|festival|market|\bfair\b|reception|potluck|dinner|breakfast|pancake|walk n|5k|10k|fundraiser|gala|showcase|meeting)\b/.test(s)) return 'community';
  // Accessibility suffixes (- OC / ASL / AD / SF / CC) almost always mark a live
  // performance made accessible, so default those to theatre.
  if (/[-–]\s*(oc|asl|ad|sf|cc|ad\/asl|asl\/ad|ad\/cc|cc\/ad)\b|\b(open captioned|audio described|sign(ed| language) performance|relaxed performance)\b/.test(s)) return 'theatre';
  for (const [name, type] of ORG_TYPE) if ((ev.organization ?? '').includes(name)) return type;
  return 'other';
}

/** Short "City, ST" (or best-effort place) from a full venue string. */
function shortLocation(loc: string | null): string | null {
  if (!loc) return null;
  const usState = loc.match(/([A-Za-z.'\- ]{2,}),\s*([A-Z]{2})(?:[\s,]|$)/); // City, ST
  if (usState) return `${usState[1].trim()}, ${usState[2]}`;
  const segs = loc.split(/[·,]/).map(s => s.trim()).filter(Boolean).filter(s =>
    !/^\d/.test(s) &&                                  // street numbers / postal
    !/^[A-Z0-9]{3,4}\s?[A-Z0-9]{3}$/.test(s) &&        // postcodes
    !/^(united states|usa|canada|australia|uk|united kingdom)$/i.test(s));
  const city = [...segs].reverse().find(s => /^[A-Za-z .'\-]+$/.test(s) && s.length <= 22);
  return city ?? (segs[segs.length - 1] ?? loc).slice(0, 22);
}

// Minutes-of-day for a timed event's start, and its end (default 1h, clamped).
function evStartMin(ev: CalEvent): number {
  const s = new Date(ev.start_at);
  return s.getHours() * 60 + s.getMinutes();
}
function evEndMin(ev: CalEvent): number {
  const start = evStartMin(ev);
  if (!ev.end_at) return start + 60;
  const dur = (new Date(ev.end_at).getTime() - new Date(ev.start_at).getTime()) / 60000;
  return start + Math.max(20, Math.min(dur, 8 * 60));
}
// A "timed" event sits in an hour slot. All-day flags, midnight-with-no-time,
// and anything running 8h+ (multi-day festivals, exhibitions) go to the
// all-day header band instead of a giant block.
function isTimed(ev: CalEvent): boolean {
  if (ev.is_all_day) return false;
  const s = new Date(ev.start_at);
  if (ev.end_at) {
    const hrs = (new Date(ev.end_at).getTime() - s.getTime()) / 3600000;
    if (hrs >= 8) return false;
  }
  if (s.getHours() === 0 && s.getMinutes() === 0 && !ev.end_at) return false;
  return true;
}

// Lay overlapping events out into side-by-side columns (Google-Calendar style):
// each returned item gets its column index and the total columns in its cluster.
type Packed = { ev: CalEvent; start: number; end: number; col: number; cols: number };
function packDay(evs: CalEvent[]): Packed[] {
  const items = evs
    .map(ev => ({ ev, start: evStartMin(ev), end: evEndMin(ev), col: 0, cols: 0 }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Packed[] = [];
  let cluster: Packed[] = [];
  let colEnds: number[] = []; // running end-minute per column in the active cluster
  const flush = () => {
    const cols = colEnds.length || 1;
    cluster.forEach(it => { it.cols = cols; });
    out.push(...cluster);
    cluster = []; colEnds = [];
  };
  for (const it of items) {
    if (colEnds.length && it.start >= Math.max(...colEnds)) flush();
    let col = colEnds.findIndex(end => end <= it.start);
    if (col === -1) { col = colEnds.length; colEnds.push(it.end); }
    else colEnds[col] = it.end;
    it.col = col;
    cluster.push(it);
  }
  flush();
  return out;
}

/** Events that start on the given calendar date */
function eventsForDate(events: CalEvent[], d: Date): CalEvent[] {
  return events.filter(ev => {
    const s = new Date(ev.start_at);
    return s.getFullYear() === d.getFullYear() &&
           s.getMonth()    === d.getMonth()    &&
           s.getDate()     === d.getDate();
  });
}

/**
 * Renders an event as a real link when it has a URL, or a plain non-interactive
 * element when it doesn't (avoids dead "#" links that open a blank new tab).
 *
 * Accessibility:
 * - With a URL: the link's accessible name is `visibleText, srContext`. Leading
 *   with the visible text satisfies WCAG 2.5.3 Label in Name (voice control),
 *   and the trailing srContext adds the date/type context the visual grid
 *   position would otherwise carry. aria-label supersedes the child text for a
 *   link, so the children are left visible (not aria-hidden).
 * - Without a URL: a plain <span> (no role, no aria-label). The visible children
 *   are read normally and an sr-only span appends the same date/type context, so
 *   the event is never an empty/skipped node for a screen reader.
 */
function EventLeaf({ ev, visibleText, srContext, title, style, className, children }: {
  ev: CalEvent;
  visibleText: string;
  srContext: string;
  title: string;
  style: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}) {
  if (ev.event_url) {
    const name = srContext ? `${visibleText}, ${srContext}` : visibleText;
    // Our own productions mirror onto the calendar with a relative event_url
    // (/projects/<slug>). Those stay in the tab and route through Next, rather
    // than opening a new window the way an off-site listing does.
    if (ev.event_url.startsWith('/')) {
      return (
        <Link href={ev.event_url} aria-label={name} title={title} style={style} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a href={ev.event_url} target="_blank" rel="noopener noreferrer"
         aria-label={name} title={title} style={style} className={className}>
        {children}
      </a>
    );
  }
  return (
    <span title={title} style={style} className={className}>
      {children}
      {srContext && <span className="sr-only">, {srContext}</span>}
    </span>
  );
}

/** The date/type context a screen reader can't get from the visual grid
 *  position. Appended after the visible text so it never hides the visible
 *  label. */
function eventSrContext(ev: CalEvent, type: EventType): string {
  const start = new Date(ev.start_at);
  const dateStr = `${DAY_NAMES_LONG[start.getDay()]}, ${MONTH_NAMES[start.getMonth()]} ${start.getDate()}`;
  return [ev.is_all_day ? 'all day' : null, dateStr, TYPE_META[type].label, ev.location_name, ev.organization]
    .filter(Boolean).join(', ');
}

/** A small colored event chip, colored by event type.
 *  `dense` (month view) uses a compact 24px min target so packed days don't
 *  balloon; elsewhere chips get the full 44px target. */
function EventChip({ ev, showLocation, dense }: { ev: CalEvent; showLocation?: boolean; dense?: boolean }) {
  const start   = new Date(ev.start_at);
  const timeStr = ev.is_all_day
    ? '' : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const type    = classifyEvent(ev);
  const place   = showLocation ? shortLocation(ev.location_name) : null;
  const visibleText = `${timeStr ? timeStr + ' ' : ''}${ev.title}${place ? ' · ' + place : ''}`;
  return (
    <EventLeaf
      ev={ev}
      visibleText={visibleText}
      srContext={eventSrContext(ev, type)}
      title={[ev.title, timeStr, ev.location_name, `Type: ${TYPE_META[type].label}`, ev.organization].filter(Boolean).join(' · ')}
      style={{
        display: 'flex', alignItems: 'center', background: TYPE_META[type].color, color: '#fff',
        fontSize: 9, fontFamily: '"Tahoma", Arial, sans-serif',
        padding: '1px 4px', marginBottom: 2, borderRadius: 1,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        textDecoration: 'none', cursor: ev.event_url ? 'pointer' : 'default',
        minHeight: dense ? 24 : 44,
      }}
    >
      {/* Full white (no opacity dim) so the 9px time/place text clears AA on the
          lighter type colors; the chip colors were chosen for solid white. */}
      {timeStr && <span>{timeStr} </span>}
      <span>{ev.title}</span>
      {place && <span> · {place}</span>}
    </EventLeaf>
  );
}

/** An absolutely-positioned event block inside the day/week time grid */
function TimeBlock({ ev, style }: { ev: CalEvent; style: React.CSSProperties }) {
  const type    = classifyEvent(ev);
  const start   = new Date(ev.start_at);
  const timeStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <EventLeaf
      ev={ev}
      visibleText={`${timeStr} ${ev.title}`}
      srContext={eventSrContext(ev, type)}
      title={[ev.title, timeStr, ev.location_name, `Type: ${TYPE_META[type].label}`, ev.organization].filter(Boolean).join(' · ')}
      style={{
        position: 'absolute', zIndex: 1, display: 'flex', alignItems: 'center',
        ...style,
        background: TYPE_META[type].color, color: '#fff',
        fontSize: 9, fontFamily: '"Tahoma", Arial, sans-serif',
        padding: '1px 3px', borderRadius: 2, overflow: 'hidden',
        textDecoration: 'none', cursor: ev.event_url ? 'pointer' : 'default', lineHeight: 1.15,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.4)', minHeight: 44,
      }}
    >
      <span>{timeStr} {ev.title}</span>
    </EventLeaf>
  );
}

/** Centered overlay used for the empty / no-match / coming-soon states */
function GridOverlay({ badge, body }: { badge: string; body: string }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 10,
      background: 'rgba(255,255,255,0.82)', pointerEvents: 'none',
    }}>
      <span style={{
        background: '#263590', color: 'white',
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: 10, fontWeight: 'bold',
        padding: '2px 12px', letterSpacing: '0.08em',
        border: '1px solid #1a2568',
      }}>{badge}</span>
      <p style={{
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: 11, color: '#555', margin: 0, textAlign: 'center',
        maxWidth: 260, lineHeight: 1.5,
      }}>{body}</p>
    </div>
  );
}

function TimeGrid({ colDays, numCols, events, overlay, showLocation }: {
  colDays: Date[];
  numCols: number;
  events: CalEvent[];
  overlay: { badge: string; body: string } | null;
  showLocation?: boolean;
}) {
  // Fit the hour range to the timed events actually shown (default 8am–8pm).
  const allTimed = colDays.flatMap(d => eventsForDate(events, d).filter(isTimed));
  let startH = 8, endH = 20;
  if (allTimed.length) {
    startH = Math.max(0, Math.min(8, Math.floor(Math.min(...allTimed.map(evStartMin)) / 60)));
    endH   = Math.min(24, Math.max(20, Math.ceil(Math.max(...allTimed.map(evEndMin)) / 60)));
  }
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const gridH = (endH - startH) * ROW_H;
  const colLeft = (ci: number) => `calc(52px + ${ci} * (100% - 52px) / ${numCols})`;
  const colW = `calc((100% - 52px) / ${numCols})`;

  return (
    <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      {/* Day header row (day name + date + any all-day events) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `52px repeat(${numCols}, 1fr)`,
        borderBottom: '2px solid #b4b0a8',
        background: '#ece9d8',
        position: 'sticky', top: 0, zIndex: 3,
      }}>
        <div style={{ borderRight: '1px solid #b4b0a8', fontSize: 8, color: '#333', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0 4px 3px' }}>all day</div>
        {colDays.map((d, i) => {
          const allDay = eventsForDate(events, d).filter(e => !isTimed(e));
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
              <span className="sr-only">
                {DAY_NAMES_LONG[d.getDay()]}, {MONTH_NAMES[d.getMonth()]} {d.getDate()}{isToday(d) ? ', today' : ''}
              </span>
              <div aria-hidden="true">{DAY_NAMES[d.getDay()]}</div>
              <div aria-hidden="true" style={{ fontSize: 14, fontWeight: 'bold', marginBottom: allDay.length ? 3 : 0 }}>{d.getDate()}</div>
              {allDay.map(ev => <EventChip key={ev.id} ev={ev} showLocation={showLocation} />)}
            </div>
          );
        })}
      </div>

      {/* Time grid — hour lines behind, timed events positioned at their times */}
      <div style={{ position: 'relative', height: gridH }}>
        {/* Hour rows (background stripes + gutter labels) */}
        {hours.map((h, hi) => (
          <div key={h} aria-hidden="true" style={{
            position: 'absolute', top: hi * ROW_H, left: 0, right: 0, height: ROW_H,
            borderTop: '1px solid #e8e4dc',
            background: hi % 2 === 0 ? '#fff' : '#fafaf8',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, width: 52, height: '100%',
              boxSizing: 'border-box', borderRight: '1px solid #b4b0a8',
              fontSize: 9, color: '#888', textAlign: 'right', padding: '2px 4px 0',
              userSelect: 'none', background: '#fbfaf7',
            }}>
              {hi === 0 ? fmtHour(h) : fmtHour(h).replace(':00 ', '')}
            </div>
          </div>
        ))}

        {/* Column separators + today tint */}
        {colDays.map((d, ci) => (
          <div key={'c' + ci} aria-hidden="true" style={{
            position: 'absolute', top: 0, bottom: 0,
            left: colLeft(ci), width: colW,
            borderRight: ci < numCols - 1 ? '1px solid #e8e4dc' : undefined,
            background: isToday(d) ? 'rgba(38,53,144,0.05)' : undefined,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Timed events, positioned by start time and packed into columns */}
        {colDays.map((d, ci) =>
          packDay(eventsForDate(events, d).filter(isTimed)).map(({ ev, start, end, col, cols }) => (
            <TimeBlock
              key={ev.id}
              ev={ev}
              style={{
                top: Math.max(0, (start - startH * 60) / 60 * ROW_H),
                height: Math.max(15, (end - start) / 60 * ROW_H - 1),
                left: `calc(${colLeft(ci)} + ${col} * ${colW} / ${cols})`,
                width: `calc(${colW} / ${cols} - 2px)`,
              }}
            />
          ))
        )}

        {overlay && <GridOverlay badge={overlay.badge} body={overlay.body} />}
      </div>
    </div>
  );
}

// ── Render helper: Month grid ─────────────────────────────────────────────────
// Cap how many event chips a month cell shows, so a busy day doesn't stretch the
// whole grid; the rest are reachable via "+N more" (opens that day) and the list.
const MONTH_CELL_MAX = 4;
function MonthGrid({ monthDate, monthGrid, events, overlay, showLocation, onShowDay }: {
  monthDate: Date;
  monthGrid: (number | null)[][];
  events: CalEvent[];
  overlay: { badge: string; body: string } | null;
  showLocation?: boolean;
  onShowDay: (date: Date) => void;
}) {
  const today = new Date();
  const todayNum = today.getDate();
  const isCurrentMonth = monthDate.getMonth() === today.getMonth() &&
    monthDate.getFullYear() === today.getFullYear();
  return (
    <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      {/* A real <table> so a screen reader can tell which day a cell (and the
          events inside it) belongs to: day names are column headers, each cell
          announces its full date. */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <caption className="sr-only">
          Events for {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
        </caption>
        <thead>
          <tr style={{ background: '#ece9d8', borderBottom: '2px solid #b4b0a8' }}>
            {DAY_NAMES.map((d, i) => (
              <th key={d} scope="col" style={{
                textAlign: 'center', padding: '3px 0',
                fontSize: 10, fontWeight: 'bold', color: '#555',
                borderRight: i < 6 ? '1px solid #b4b0a8' : undefined,
              }}>
                <span aria-hidden="true">{d}</span>
                <span className="sr-only">{DAY_NAMES_LONG[i]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                const cellDate = day !== null ? new Date(monthDate.getFullYear(), monthDate.getMonth(), day) : null;
                const dayEvs   = cellDate ? eventsForDate(events, cellDate) : [];
                const isTodayCell = !!(day && isCurrentMonth && day === todayNum);
                return (
                  <td key={di} style={{
                    verticalAlign: 'top',
                    height: 72,
                    borderRight: di < 6 ? '1px solid #e0dcd4' : undefined,
                    borderBottom: '1px solid #e0dcd4',
                    padding: '3px 5px',
                    background: isTodayCell ? '#dce8ff' : '#fff',
                  }}>
                    {day !== null && cellDate && (
                      <>
                        <span className="sr-only">
                          {DAY_NAMES_LONG[cellDate.getDay()]}, {MONTH_NAMES[monthDate.getMonth()]} {day}{isTodayCell ? ', today' : ''}
                          {dayEvs.length === 0 ? ', no events' : `, ${dayEvs.length} ${dayEvs.length === 1 ? 'event' : 'events'}`}
                        </span>
                        <span aria-hidden="true" style={{
                          display: 'inline-block',
                          width: 20, height: 20,
                          lineHeight: '20px',
                          textAlign: 'center',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: isTodayCell ? 'bold' : 'normal',
                          background: isTodayCell ? '#263590' : 'transparent',
                          color: isTodayCell ? '#fff' : '#333',
                          marginBottom: dayEvs.length ? 2 : 0,
                        }}>
                          {day}
                        </span>
                        {dayEvs.slice(0, MONTH_CELL_MAX).map(ev => (
                          <EventChip key={ev.id} ev={ev} showLocation={showLocation} dense />
                        ))}
                        {dayEvs.length > MONTH_CELL_MAX && (
                          <button
                            type="button"
                            onClick={() => onShowDay(cellDate)}
                            className="cal-more-btn"
                            style={{
                              display: 'block', width: '100%', textAlign: 'left',
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 9, color: '#263590', fontWeight: 'bold',
                              fontFamily: '"Tahoma", Arial, sans-serif', padding: '2px 2px',
                            }}
                            aria-label={`Show all ${dayEvs.length} events on ${DAY_NAMES_LONG[cellDate.getDay()]}, ${MONTH_NAMES[monthDate.getMonth()]} ${day}`}
                          >
                            + {dayEvs.length - MONTH_CELL_MAX} more
                          </button>
                        )}
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {overlay && <GridOverlay badge={overlay.badge} body={overlay.body} />}
    </div>
  );
}

// ── Render helper: List / agenda view ─────────────────────────────────────────
function ListRow({ ev }: { ev: CalEvent }) {
  const type    = classifyEvent(ev);
  const start   = new Date(ev.start_at);
  const timeStr = ev.is_all_day ? 'All day' : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const place   = shortLocation(ev.location_name);
  const meta    = [TYPE_META[type].label, place, ev.organization].filter(Boolean).join(' · ');
  return (
    <EventLeaf
      ev={ev}
      className="cal-list-row"
      visibleText={`${timeStr}, ${ev.title}, ${meta}`}
      srContext={`${DAY_NAMES_LONG[start.getDay()]}, ${MONTH_NAMES[start.getMonth()]} ${start.getDate()}`}
      title={[ev.title, timeStr, ev.location_name, ev.organization].filter(Boolean).join(' · ')}
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        padding: '8px 12px', borderBottom: '1px solid #eae7df',
        textDecoration: 'none', color: '#1a1a2e',
        fontFamily: '"Tahoma", Arial, sans-serif',
      }}
    >
      <span style={{ width: 62, flexShrink: 0, fontSize: 11, color: '#555', textAlign: 'right', paddingTop: 1, fontVariantNumeric: 'tabular-nums' }}>
        {timeStr}
      </span>
      <span aria-hidden="true" style={{ width: 10, height: 10, marginTop: 3, flexShrink: 0, background: TYPE_META[type].color, borderRadius: 2 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{ev.title}</span>
        <span style={{ display: 'block', fontSize: 11, color: '#666', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>
      </span>
    </EventLeaf>
  );
}

function ListView({ events, overlay }: { events: CalEvent[]; overlay: { badge: string; body: string } | null }) {
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const upcoming = events
    .filter(e => new Date(e.start_at) >= startOfToday)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  // Group by calendar day, preserving chronological order.
  const groups: { key: string; date: Date; items: CalEvent[] }[] = [];
  for (const e of upcoming) {
    const d = new Date(e.start_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) { g = { key, date: d, items: [] }; groups.push(g); }
    g.items.push(e);
  }

  if (groups.length === 0) {
    const badge = overlay?.badge ?? 'NOTHING UPCOMING';
    const body = overlay?.body ?? 'There are no upcoming events to list right now.';
    return (
      <div style={{ flex: 1, position: 'relative', background: '#fafaf6' }}>
        <GridOverlay badge={badge} body={body} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#fafaf6' }}>
      {groups.map(g => (
        <div key={g.key}>
          <div style={{
            position: 'sticky', top: 0, zIndex: 1,
            background: isToday(g.date) ? '#dce8ff' : '#ece9d8',
            borderBottom: '1px solid #b4b0a8', borderTop: '1px solid #cdc9bf',
            padding: '4px 12px', fontSize: 12, fontWeight: 'bold',
            color: isToday(g.date) ? '#263590' : '#333',
            fontFamily: '"Tahoma", Arial, sans-serif',
          }}>
            {DAY_NAMES_LONG[g.date.getDay()]}, {MONTH_NAMES[g.date.getMonth()]} {g.date.getDate()}
            {isToday(g.date) && <span style={{ fontWeight: 'normal' }}> · Today</span>}
            <span style={{ fontWeight: 'normal', color: '#888', float: 'right', fontSize: 11 }}>
              {g.items.length} {g.items.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          {g.items.map(ev => <ListRow key={ev.id} ev={ev} />)}
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const [phase,       setPhase]       = useState<Phase>('boot');
  const [bootText,    setBootText]    = useState('Loading Community Events Calendar');
  const [booting,     setBooting]     = useState(true);
  const [filterMode,  setFilterMode]  = useState<FilterMode>('all');
  const [filterModeDraft, setFilterModeDraft] = useState<FilterMode>('all'); // dialog value before Apply
  const [locQuery,    setLocQuery]    = useState('');   // "near me" text filter
  const [locDraft,    setLocDraft]    = useState('');   // dialog input before Continue
  const [view,        setView]        = useState<CalView>('list');
  const [weekStart,   setWeekStart]   = useState(() => getWeekStart(new Date()));
  const [dayAnchor,   setDayAnchor]   = useState(() => new Date());
  const [monthDate,   setMonthDate]   = useState(() => new Date());
  const [events,      setEvents]      = useState<CalEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [syncedCals,  setSyncedCals]  = useState<{ name: string; website: string | null }[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [showFilter,  setShowFilter]  = useState(false);

  const appRef        = useRef<HTMLHeadingElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const sourcesCloseRef = useRef<HTMLButtonElement>(null);
  const tabRefs       = useRef<(HTMLButtonElement | null)[]>([]);
  const today     = new Date();

  // (Page title is set reliably via app/calendar/layout.tsx metadata; an
  // imperative document.title here is overridden by Next's metadata on load.)

  // Boot sequence
  useEffect(() => {
    // Respect prefers-reduced-motion: the retro "boot" is pure decoration, so
    // skip straight to the calendar instead of holding a blank screen for ~2s.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Only pull focus to the calendar heading if the user hasn't already moved
    // focus somewhere (e.g. opened a dialog) while the boot was finishing.
    const focusAppHeading = () => {
      const a = document.activeElement;
      if (!a || a === document.body) appRef.current?.focus();
    };

    if (prefersReduced) {
      setBooting(false);
      setPhase('app');
      const f = setTimeout(focusAppHeading, 50);
      return () => clearTimeout(f);
    }

    let dots = 0;
    const dotInt = setInterval(() => {
      dots = (dots + 1) % 4;
      setBootText('Loading Community Events Calendar' + '.'.repeat(dots));
    }, 350);
    const bootTimer = setTimeout(() => {
      clearInterval(dotInt);
      setBooting(false);
      setTimeout(() => {
        setPhase('app');
        setTimeout(focusAppHeading, 150);
      }, 200);
    }, 1800);
    return () => {
      clearInterval(dotInt);
      clearTimeout(bootTimer);
    };
  }, []);

  // Check login state (to show "Submit Event" button). For signed-in members
  // with a city on their profile, start the calendar filtered to their own
  // area; the Filter dialog clears it like any other location search.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (!user) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('location_city')
        .eq('user_id', user.id)
        .maybeSingle();
      const city = prof?.location_city?.trim();
      if (city) {
        // Functional update so we never clobber a filter the member already
        // typed while the profile lookup was in flight.
        setLocQuery(prev => prev || city);
        setLocDraft(prev => prev || city);
      }
    });
  }, []);

  // Load external calendars that have synced successfully (left rail).
  // Safe before the migration runs: a missing RPC just returns no data.
  useEffect(() => {
    supabase.rpc('list_synced_calendars').then(({ data }) => {
      if (data) setSyncedCals(data as { name: string; website: string | null }[]);
    });
  }, []);

  // Fetch events when the calendar opens
  useEffect(() => {
    // Load on mount (not gated on phase) so the welcome popup can show a real count.
    const now = new Date();
    // Show events from 1 week ago onward so recently-passed events still appear briefly
    const lookback = new Date(now.getTime() - 7 * 86_400_000);
    supabase
      .from('events')
      .select('*')
      .eq('is_visible', true)
      .gte('start_at', lookback.toISOString())
      .order('start_at')
      .then(({ data, error }) => {
        if (error) {
          setEventsError(true);
          setEventsLoaded(true);
          return;
        }
        setEventsError(false);
        setEvents((data ?? []) as CalEvent[]);
        setEventsLoaded(true);
      });
  }, []);

  const openFilter = () => {
    // Seed the dialog's draft values from what's currently applied, so Cancel
    // leaves everything untouched.
    setLocDraft(locQuery);
    setFilterModeDraft(filterMode);
    setShowFilter(true);
  };
  const handleContinue = () => {
    setLocQuery(locDraft.trim());
    setFilterMode(filterModeDraft);
    setShowFilter(false); // Modal restores focus to the Filter button
  };

  // View switcher: real tabs keyboard support (roving focus + arrow keys).
  const selectViewByIndex = (i: number) => {
    const idx = (i + VIEW_TABS.length) % VIEW_TABS.length;
    setView(VIEW_TABS[idx]);
    tabRefs.current[idx]?.focus();
  };
  const onTabKeyDown = (e: React.KeyboardEvent, current: CalView) => {
    const i = VIEW_TABS.indexOf(current);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectViewByIndex(i + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectViewByIndex(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); selectViewByIndex(0); }
    else if (e.key === 'End')  { e.preventDefault(); selectViewByIndex(VIEW_TABS.length - 1); }
  };

  // Derived state
  const weekDays   = getWeekDays(weekStart);
  const threeDays  = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(dayAnchor);
    d.setDate(dayAnchor.getDate() + i);
    return d;
  });
  const monthGrid  = getMonthGrid(monthDate.getFullYear(), monthDate.getMonth());

  // Filters: an online-only toggle and a free-text "near me" location search.
  // ICS feeds don't reliably set location_type, so also treat clearly-virtual
  // wording as online, otherwise the online filter would show almost nothing.
  const loc = locQuery.trim().toLowerCase();
  const isOnline = (e: CalEvent) =>
    e.location_type === 'online' || e.location_type === 'hybrid' ||
    /\b(online|virtual|zoom|livestream|live[- ]?stream|webinar|remote|streamed|telehealth)\b/i.test(`${e.title} ${e.location_name ?? ''} ${e.description ?? ''}`);
  const shownEvents = events.filter(e => {
    if (filterMode === 'online' && !isOnline(e)) return false;
    if (loc && !`${e.location_name ?? ''} ${e.organization ?? ''}`.toLowerCase().includes(loc)) return false;
    return true;
  });

  const filterLabel = [
    filterMode === 'online' ? 'Online only' : 'All events',
    loc ? `near “${locQuery.trim()}”` : null,
  ].filter(Boolean).join(' · ');

  // Location shows in the event line when nothing is narrowing the view. Skipped
  // only in week view, whose 7 columns are too narrow to fit it without clutter
  // (day / 3-day / month all have room; 3-day is the mobile default).
  const showLocation = filterMode === 'all' && !loc && view !== 'week';

  // Navigation
  const navPrev = () => {
    if (view === 'week') {
      setWeekStart(s => { const d = new Date(s); d.setDate(d.getDate() - 7); return d; });
    } else if (view === '3day' || view === 'day') {
      setDayAnchor(s => { const d = new Date(s); d.setDate(d.getDate() - (view === 'day' ? 1 : 3)); return d; });
    } else {
      setMonthDate(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    }
  };
  const navNext = () => {
    if (view === 'week') {
      setWeekStart(s => { const d = new Date(s); d.setDate(d.getDate() + 7); return d; });
    } else if (view === '3day' || view === 'day') {
      setDayAnchor(s => { const d = new Date(s); d.setDate(d.getDate() + (view === 'day' ? 1 : 3)); return d; });
    } else {
      setMonthDate(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    }
  };
  const navToday = () => {
    setWeekStart(getWeekStart(new Date()));
    setDayAnchor(new Date());
    setMonthDate(new Date());
  };

  // Period label
  const periodLabel = view === 'list'
    ? 'Upcoming events'
    : view === 'month'
    ? `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
    : view === 'week'
      ? `${MONTH_NAMES[weekDays[0].getMonth()]} ${weekDays[0].getDate()} to ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
      : view === '3day'
        ? `${MONTH_NAMES[threeDays[0].getMonth()]} ${threeDays[0].getDate()} to ${threeDays[2].getDate()}`
        : `${DAY_NAMES[dayAnchor.getDay()]}, ${MONTH_NAMES[dayAnchor.getMonth()]} ${dayAnchor.getDate()}`;

  // ── Render helper: Week/3-day time grid ──────────────────────────────────────
  const colDays  = view === '3day' ? threeDays : view === 'day' ? [dayAnchor] : weekDays;
  const numCols  = colDays.length;

  // What (if anything) to show over an empty grid.
  const overlay: { badge: string; body: string } | null =
    !eventsLoaded || eventsError ? null
    : events.length === 0
      ? { badge: '★ COMING SOON ★', body: "Events are on their way. Once live, you'll see accessible performances, screenings, and community happenings here." }
    : shownEvents.length === 0
      ? { badge: 'NO MATCHES', body: 'No events match this filter. Try a different city, switch off Online only, or clear the filter to see everything.' }
      : null;

  // ── Mini sidebar calendar ─────────────────────────────────────────────────────
  const sideGrid = getMonthGrid(today.getFullYear(), today.getMonth());

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="cal-outer"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 'var(--startbar-h, 0px)',
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
        @keyframes cal-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .cal-filter-box { animation: cal-fade-in 0.15s ease; }
        @media (prefers-reduced-motion: reduce) {
          .cal-window, .cal-filter-box { animation: none !important; }
          .cal-boot { animation: none !important; display: none !important; }
        }
        .cal-view-btn:hover { background: #316ac5 !important; color: #fff !important; }
        /* Focus ring is a two-tone ring so it stays visible on BOTH the light-gray
           toolbar and the navy selected buttons: a dark hairline hugs the control
           (contrasts on light gray) and a yellow ring sits outside it (contrasts
           on navy). At least one color always clears 3:1 against the surface. */
        .cal-view-btn:focus-visible,
        .cal-nav-btn:focus-visible {
          outline: 3px solid #f5d84a;
          outline-offset: 2px;
          box-shadow: 0 0 0 2px #1a2568;
        }
        .cal-list-row:hover { background: #eef1fb; }
        .cal-list-row:focus-visible { background: #eef1fb; outline: 3px solid #1a2568; outline-offset: -3px; }
        .cal-nav-btn { min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center; }
        .cal-nav-btn:hover { background: #c8c4bc !important; }
        .cal-more-btn:hover { text-decoration: underline; }
        .cal-more-btn:focus-visible { outline: 2px solid #1a2568; outline-offset: 1px; }
        .cal-filter-opt:focus-within { outline: 3px solid #1a2568; }
        #cal-tabpanel:focus-visible { outline: 3px solid #f5d84a; outline-offset: -3px; }

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
          /* The Modal already centers the filter dialog and constrains its width;
             it just needs to not butt against the screen edges on small phones. */
          .cal-filter-box { width: calc(100vw - 24px) !important; max-width: 440px; }
        }
      `}</style>

      <h1 className="sr-only">Community Events Calendar · Artistic Accessibility Collective</h1>

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

      {/* ── Filter dialog (overlay; keeps the calendar mounted underneath) ─────── */}
      {showFilter && (
        <Modal
          labelledBy="filter-heading"
          onClose={() => setShowFilter(false)}
          initialFocusRef={filterInputRef}
          dialogClassName="cal-filter-box"
          dialogStyle={{
            width: 'min(440px, calc(100vw - 32px))',
            border: '2px solid #888',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          }}
        >
          {/* Dialog title bar */}
          <div style={{
            background: 'linear-gradient(to right, #263590 0%, #4060d8 60%, #2a3aaa 100%)',
            padding: '6px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'white', fontWeight: 'bold', fontSize: 12,
              fontFamily: '"Tahoma", Arial, sans-serif',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}>
              <span aria-hidden="true" style={{ fontSize: 16 }}>💿</span>
              Filter events
            </span>
            <button
              type="button"
              onClick={() => setShowFilter(false)}
              aria-label="Close filter"
              className="tap-target-btn"
              style={{
                width: 20, height: 18, background: '#d4d0c8', border: '1px outset #fff',
                fontSize: 11, lineHeight: 1, cursor: 'pointer', borderRadius: 2, color: '#000',
              }}
            >✕</button>
          </div>

          {/* Dialog body */}
          <div style={{ background: '#f0ede8', padding: '18px 20px 16px' }}>
            <h2
              id="filter-heading"
              style={{
                fontFamily: '"Tahoma", Arial, sans-serif',
                fontSize: 14, fontWeight: 'bold',
                color: '#263590', margin: '0 0 6px',
              }}
            >
              Filter these events
            </h2>
            <p style={{
              fontFamily: '"MS Sans Serif", Arial, sans-serif',
              fontSize: 11.5, color: '#444', margin: '0 0 16px', lineHeight: 1.55,
            }}>
              <strong style={{ color: '#263590' }}>{events.length} accessible events</strong> are on the
              calendar right now, from partner organizations around the world. Narrow them down below,
              or clear the filter to see everything.
            </p>

            {/* Near me */}
            <label htmlFor="loc-input" style={{ display: 'block', fontWeight: 'bold', fontSize: 12, color: '#222', marginBottom: 4 }}>
              <span aria-hidden="true">📍 </span>See events near you
            </label>
            <input
              ref={filterInputRef}
              id="loc-input"
              type="text"
              value={locDraft}
              onChange={e => setLocDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleContinue(); }}
              placeholder="Type a city or region, e.g. Portland or Melbourne"
              autoComplete="off"
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '2px inset #999', padding: '5px 8px', fontSize: 12,
                fontFamily: '"Tahoma", Arial, sans-serif', background: '#fff', marginBottom: 4,
              }}
            />
            <p style={{ fontSize: 10, color: '#777', margin: '0 0 14px' }}>
              Matches the city or venue on each event. Leave blank to see everywhere.
            </p>

            {/* Online only — staged in a draft so Cancel/Escape leaves it unchanged */}
            <label
              className="cal-filter-opt"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 12px', marginBottom: 14,
                background: filterModeDraft === 'online' ? '#dce5ff' : '#fff',
                border: filterModeDraft === 'online' ? '2px solid #263590' : '2px solid #c8c4bc',
                borderRadius: 3, cursor: 'pointer',
                transition: 'border-color 0.1s, background 0.1s',
              }}
            >
              <input
                type="checkbox"
                checked={filterModeDraft === 'online'}
                onChange={e => setFilterModeDraft(e.target.checked ? 'online' : 'all')}
                style={{ marginTop: 2, flexShrink: 0, accentColor: '#263590' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 12, color: '#222', lineHeight: 1.3 }}>
                  <span aria-hidden="true">💻 </span>Show online events only
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  Virtual, livestreamed, and remote-access events you can join from anywhere.
                </div>
              </div>
            </label>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowFilter(false)}
                className="cal-nav-btn"
                style={{
                  background: '#d4d0c8', color: '#000', border: '1px outset #fff',
                  padding: '5px 16px', fontSize: 12,
                  fontFamily: '"Tahoma", Arial, sans-serif', cursor: 'pointer', borderRadius: 3,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
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
                {locDraft.trim() || filterModeDraft === 'online' ? 'Show these events →' : 'Browse all events →'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Calendar app window ────────────────────────────────────────────────── */}
      {phase === 'app' && (
        <div
          className="cal-window"
          // While a dialog is open, make the calendar behind it inert so neither
          // keyboard nor screen-reader virtual cursor can reach background content.
          inert={showFilter || showSources ? true : undefined}
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
              Community Events Calendar
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
            {/* Period navigation — an agenda list scrolls, so paging is hidden there */}
            {view !== 'list' && (
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
            )}

            {/* Period label */}
            <span style={{
              fontWeight: 'bold', fontSize: 12, color: '#000',
              fontFamily: '"Tahoma", Arial, sans-serif',
              padding: '0 6px', minWidth: 160,
            }}>
              {periodLabel}
            </span>

            {/* Home + Resources nav buttons */}
            <Link
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
            >🏠</Link>
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

            {/* Submit Event button — logged-out users go to login first, and the
                lock + accessible label make that requirement visible, not hover-only. */}
            <button
              onClick={() => router.push(isLoggedIn ? '/submit-event' : '/login?next=/submit-event')}
              className="cal-nav-btn"
              style={{
                background: '#263590', color: '#fff',
                border: '1px outset #1a2568',
                padding: '2px 10px', fontSize: 11, cursor: 'pointer',
                fontFamily: '"Tahoma", Arial, sans-serif',
                borderRadius: 2, fontWeight: 'bold',
              }}
              aria-label={isLoggedIn ? 'Add an event' : 'Log in to add an event'}
            >
              {isLoggedIn ? '+ Event' : <><span aria-hidden="true">🔒 </span>+ Event</>}
            </button>

            {/* Filter button — reachable on every viewport (the sidebar hides on mobile) */}
            <button
              onClick={openFilter}
              className="cal-nav-btn"
              style={{
                background: (filterMode === 'online' || locQuery) ? '#263590' : '#d4d0c8',
                color: (filterMode === 'online' || locQuery) ? '#fff' : '#000',
                border: '1px outset #fff',
                padding: '2px 10px', fontSize: 11, cursor: 'pointer',
                fontFamily: '"Tahoma", Arial, sans-serif',
                borderRadius: 2, fontWeight: (filterMode === 'online' || locQuery) ? 'bold' : 'normal',
              }}
              title="Filter events by location or online-only"
            >
              <span aria-hidden="true">⚲ </span>Filter
            </button>

            {/* Calendar sources link — always reachable, including on mobile where the sidebar is hidden */}
            <button
              onClick={() => setShowSources(true)}
              className="cal-nav-btn"
              style={{
                background: '#d4d0c8', color: '#000',
                border: '1px outset #fff',
                padding: '2px 10px', fontSize: 11, cursor: 'pointer',
                fontFamily: '"Tahoma", Arial, sans-serif',
                borderRadius: 2,
              }}
              title="See every calendar this page pulls events from"
            >
              <span aria-hidden="true">📋 </span>Sources
            </button>

            <div style={{ flex: 1 }} />

            {/* View tabs — real tabs pattern: roving tabindex + arrow keys, all
                controlling the single calendar panel below. */}
            <div
              role="tablist"
              aria-label="Calendar view"
              style={{ display: 'flex', gap: 1 }}
            >
              {VIEW_TABS.map((v, i) => (
                <button
                  key={v}
                  role="tab"
                  id={`cal-tab-${v}`}
                  ref={el => { tabRefs.current[i] = el; }}
                  aria-selected={view === v}
                  aria-controls="cal-tabpanel"
                  tabIndex={view === v ? 0 : -1}
                  onClick={() => setView(v)}
                  onKeyDown={(e) => onTabKeyDown(e, v)}
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
                  {v === '3day' ? '3 Days' : v === 'list' ? <><span aria-hidden="true">☰ </span>List</> : v.charAt(0).toUpperCase() + v.slice(1)}
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
                  onClick={openFilter}
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

              {/* Color legend — what the event colors mean */}
              <div style={{ margin: '8px 8px 0', background: '#fff', border: '1px inset #aaa', padding: '6px 8px' }}>
                <div style={{ fontSize: 9, fontWeight: 'bold', color: '#555', marginBottom: 4, letterSpacing: '0.04em' }}>
                  EVENT TYPES
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {TYPE_ORDER.map((t) => (
                    <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, lineHeight: 1.3 }}>
                      <span aria-hidden="true" style={{ width: 11, height: 11, flexShrink: 0, background: TYPE_META[t].color, borderRadius: 2, border: '1px solid rgba(0,0,0,0.25)' }} />
                      <span style={{ color: '#333' }}>{TYPE_META[t].label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Synced calendars (external feeds that pulled in successfully) */}
              {syncedCals.length > 0 && (
                <div style={{ margin: '8px 8px 0', background: '#fff', border: '1px inset #aaa', padding: '6px 8px' }}>
                  <div style={{ fontSize: 9, fontWeight: 'bold', color: '#555', marginBottom: 4, letterSpacing: '0.04em' }}>
                    SYNCED CALENDARS
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {syncedCals.map((c) => (
                      <li key={c.name} style={{ fontSize: 10, lineHeight: 1.3 }}>
                        {c.website ? (
                          <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: '#263590', textDecoration: 'underline' }}>
                            {c.name}
                          </a>
                        ) : (
                          <span style={{ color: '#263590' }}>{c.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontSize: 8, color: '#888', marginTop: 5, lineHeight: 1.4 }}>
                    Events from these partners pull in automatically.
                  </div>
                </div>
              )}

              {/* Expand to 1-day hint (shown in 3-day/week views on mobile — sidebar visible on desktop only) */}
              <div style={{ margin: '8px 8px 0', fontSize: 9, color: '#777', lineHeight: 1.5 }}>
                Tip: Switch to <strong>Day</strong> view for a focused single-day look.
              </div>
            </div>

            {/* ── Main grid (the tab panel the view switcher controls) ───────── */}
            {/* tabIndex=0 so keyboard/AT users can move into the panel after
                activating a tab, even in views whose content isn't focusable. */}
            <div
              id="cal-tabpanel"
              role="tabpanel"
              tabIndex={0}
              aria-labelledby={`cal-tab-${view}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fafaf6', outline: 'none' }}
            >

              {/* Screen reader heading */}
              <h2
                ref={appRef}
                tabIndex={-1}
                style={{
                  position: 'absolute', left: -9999, top: 'auto',
                  width: 1, height: 1, overflow: 'hidden',
                }}
              >
                Community Events Calendar: {periodLabel}
              </h2>

              {eventsError ? (
                <div
                  role="alert"
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 10, padding: '24px',
                  }}
                >
                  <span style={{
                    background: '#a12626', color: 'white',
                    fontFamily: '"MS Sans Serif", Arial, sans-serif',
                    fontSize: 10, fontWeight: 'bold',
                    padding: '2px 12px', letterSpacing: '0.08em',
                    border: '1px solid #7a1a1a',
                  }}>
                    ⚠ COULDN&apos;T LOAD EVENTS
                  </span>
                  <p style={{
                    fontFamily: '"MS Sans Serif", Arial, sans-serif',
                    fontSize: 11, color: '#555', margin: 0, textAlign: 'center',
                    maxWidth: 260, lineHeight: 1.5,
                  }}>
                    We couldn&apos;t load events right now. Try refreshing the page.
                  </p>
                </div>
              ) : view === 'list'
                ? <ListView events={shownEvents} overlay={overlay} />
                : view === 'month'
                ? <MonthGrid monthDate={monthDate} monthGrid={monthGrid} events={shownEvents} overlay={overlay} showLocation={showLocation} onShowDay={(d) => { setDayAnchor(d); setView('day'); }} />
                : <TimeGrid colDays={colDays} numCols={numCols} events={shownEvents} overlay={overlay} showLocation={showLocation} />}

            </div>
          </div>

          {/* Event count announcement for screen reader users (the visual status
              bar below is decorative and duplicates the sidebar's active filter,
              but the live event count isn't available anywhere else on the page). */}
          <p role="status" aria-live="polite" className="sr-only">
            {eventsLoaded && !eventsError
              ? `${shownEvents.length} ${shownEvents.length === 1 ? 'event' : 'events'} shown, filter: ${filterLabel}`
              : ''}
          </p>

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
            <span>{shownEvents.length} {shownEvents.length === 1 ? 'event' : 'events'}</span>
            <span>·</span>
            <span>Filter: {filterLabel}</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontStyle: 'italic' }}>Community Events Calendar · artisticaccessibility.com</span>
          </div>
        </div>
      )}

      {/* ── Calendar sources modal — reachable from the toolbar on every viewport ── */}
      {showSources && (
        <Modal
          labelledBy="cal-sources-heading"
          onClose={() => setShowSources(false)}
          initialFocusRef={sourcesCloseRef}
          dialogStyle={{
            background: '#ece8df', width: '100%', maxWidth: 440, maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
            border: '2px outset #fff', boxShadow: '2px 2px 8px rgba(0,0,0,0.5)',
            fontFamily: '"Tahoma", "MS Sans Serif", Arial, sans-serif',
          }}
        >
            <div style={{
              background: 'linear-gradient(to right,#263590,#4a5fc9)', color: '#fff',
              padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span id="cal-sources-heading" style={{ fontSize: 12, fontWeight: 'bold' }}>
                <span aria-hidden="true">📋 </span>Calendar Sources
              </span>
              <button
                ref={sourcesCloseRef}
                onClick={() => setShowSources(false)}
                aria-label="Close"
                className="tap-target-btn"
                style={{
                  width: 20, height: 18, background: '#d4d0c8', border: '1px outset #fff',
                  fontSize: 11, lineHeight: 1, cursor: 'pointer', borderRadius: 2, color: '#000',
                }}
              >✕</button>
            </div>
            <div style={{ padding: '12px 14px', overflowY: 'auto' }}>
              <p style={{ fontSize: 11, color: '#333', lineHeight: 1.5, margin: '0 0 10px' }}>
                {"This calendar pulls in events from accessible arts organizations around the world. Here's every calendar that's currently syncing in successfully:"}
              </p>
              {syncedCals.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {syncedCals.map((c) => (
                    <li key={c.name} style={{
                      fontSize: 12, lineHeight: 1.35,
                      padding: '6px 8px', background: '#fff', border: '1px inset #aaa',
                    }}>
                      {c.website ? (
                        <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: '#263590', textDecoration: 'underline', fontWeight: 'bold' }}>
                          {c.name}
                        </a>
                      ) : (
                        <span style={{ color: '#263590', fontWeight: 'bold' }}>{c.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 11, color: '#666', fontStyle: 'italic', margin: 0 }}>
                  New calendars were just added and are syncing in for the first time. Check back soon, this list fills in automatically as each one comes online.
                </p>
              )}
              <p style={{ fontSize: 10, color: '#888', marginTop: 10, marginBottom: 0, lineHeight: 1.4 }}>
                Know an accessible arts organization with a public calendar we should add? <Link href="/contact" style={{ color: '#263590', textDecoration: 'underline' }}>Let us know</Link>.
              </p>
            </div>
        </Modal>
      )}
    </div>
  );
}
