'use client';

import { useSyncExternalStore } from 'react';

// The Look switch (Punk or Plain) and where it is remembered.
//
// The choice lives in localStorage so it follows a visitor from the topic list
// to a topic and back. Storage can be blocked or throw (private windows, cleared
// site data), so every read and write is in try/catch, and a blocked browser
// still remembers the choice for as long as the page is open.
//
// useSyncExternalStore lets the server render Punk, and the browser switch to
// the saved choice right after hydration, without a mismatch warning. People
// who chose Plain may see Punk for a moment on a slow load before it switches.

export type Look = 'punk' | 'plain';

const STORAGE_KEY = 'aac-ht-look';
const listeners = new Set<() => void>();
let remembered: Look = 'punk';

function readLook(): Look {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'plain' || saved === 'punk') return saved;
  } catch {
    // Storage is blocked. Fall through to the in-memory choice.
  }
  return remembered;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // The storage event fires when another tab changes the choice.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function writeLook(next: Look): void {
  remembered = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Blocked. The in-memory choice still applies.
  }
  listeners.forEach((l) => l());
}

export function useLook(): [Look, (next: Look) => void] {
  const look = useSyncExternalStore(subscribe, readLook, () => 'punk' as Look);
  return [look, writeLook];
}
