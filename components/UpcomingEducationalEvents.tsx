'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchUpcomingEducationalEvents } from '@/lib/events';
import type { CalEvent } from '@/lib/supabase';

/**
 * "Upcoming Classes & Workshops" card for the Learning Hub. Pulls educational
 * events straight from the community calendar, so an event entered once shows
 * up in both places. Renders nothing when there are none.
 */
export default function UpcomingEducationalEvents() {
  const [events, setEvents] = useState<CalEvent[] | null>(null);

  useEffect(() => {
    let dead = false;
    fetchUpcomingEducationalEvents(6).then(e => { if (!dead) setEvents(e); });
    return () => { dead = true; };
  }, []);

  // Nothing to show once loaded → don't render the card at all.
  if (events !== null && events.length === 0) return null;

  return (
    <section
      aria-labelledby="edu-events-h"
      style={{ border: '2px solid #2e7d3e', background: '#0f1a10', padding: '12px 14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span aria-hidden="true" style={{ fontSize: 20 }}>🎓</span>
        <strong id="edu-events-h" style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 13, color: '#7fd18f' }}>
          Upcoming Classes &amp; Workshops
        </strong>
      </div>
      <p style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#c4c4c4', lineHeight: 1.6, margin: '0 0 10px' }}>
        Educational events from the community calendar: workshops, webinars, panels, and talks you can join.
      </p>

      {events === null ? (
        <p role="status" style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, color: '#9a9a9a', margin: '0 0 10px' }}>
          Loading upcoming events…
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '0 0 10px', padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {events.map(ev => {
            const d = new Date(ev.start_at);
            const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = ev.is_all_day ? '' : ', ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const inner = (
              <>
                <span style={{ color: '#7fd18f', fontWeight: 'bold' }}>{dateStr}{timeStr}</span>
                <span style={{ color: '#eaeaea' }}> · {ev.title}</span>
                {ev.organization && <span style={{ color: '#a7a7a7' }}> · {ev.organization}</span>}
              </>
            );
            return (
              <li key={ev.id} style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: 11, lineHeight: 1.5 }}>
                {ev.event_url ? (
                  <a href={ev.event_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    {inner}
                  </a>
                ) : inner}
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/calendar"
        style={{ fontFamily: '"Comic Sans MS", cursive', fontSize: 12, fontWeight: 'bold', color: '#fff', background: '#2e7d3e', padding: '4px 14px', textDecoration: 'none', border: '2px outset #5fb06f', display: 'inline-block' }}
      >
        See all on the calendar
      </Link>
    </section>
  );
}
