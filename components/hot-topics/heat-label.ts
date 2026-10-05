import { heatWord, type HotTopic } from '@/lib/hot-topics-data';

/**
 * "4 of 5, spicy". For SERVER components only (the two Hot Topics pages).
 * Never import this from a client component: it would pull lib/hot-topics-data.ts,
 * which holds every topic's unread editorial text, into the browser bundle.
 */
export function heatLabel(heat: HotTopic['heat']): string {
  return `${heat} of 5, ${heatWord(heat).toLowerCase()}`;
}
