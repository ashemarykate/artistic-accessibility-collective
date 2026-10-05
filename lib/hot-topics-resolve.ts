// Hot Topics: turns a topic's catalog slugs and resource urls into display rows.
//
// SERVER ONLY. This file imports the three big catalogs (library, cinema,
// resources), so never import it from a client component or the catalogs will
// ride along in the browser bundle. Call it from a server component and pass the
// resulting rows down as props. lib/hot-topics-data.ts is the client-safe file.
//
// It reads the static catalog files only. Items added through the database
// (admin screens) are not resolved here.
//
// An unknown slug or url is skipped with a console.warn and never thrown, so a
// typo in a topic cannot take the page down. The warning shows in the build log.

import { LIBRARY_ITEM_BY_SLUG, type LibraryItem } from './library-data';
import { CINEMA_ITEM_BY_SLUG, type CinemaItem } from './cinema-data';
import { ALL_RESOURCES, type Resource } from './resources-data';
import type { HotTopic } from './hot-topics-data';

export interface ShelfRow {
  /** Unique within a topic, safe for a React key. */
  key: string;
  title: string;
  /** /library/<slug>, /cinema/<slug>, or the resource's own url. */
  href: string;
  /** True for resources: the link leaves our site. */
  external: boolean;
  creator?: string;
  year?: number | string;
  /** Plain label such as Book, Documentary, Talk, Organization. */
  kind: string;
  free: boolean;
  /** Cinema only: a captioned version is known to exist. Left unset when the catalog does not say. */
  captioned?: boolean;
  /** Cinema only: an audio described version is known to exist. Left unset when the catalog does not say. */
  described?: boolean;
  /** One short line on why it belongs. At most 180 characters. */
  blurb: string;
}

export const BLURB_MAX = 180;

const LIBRARY_KIND: Record<LibraryItem['type'], string> = {
  book: 'Book',
  essay: 'Essay',
  article: 'Article',
  journal: 'Journal',
  zine: 'Zine',
  workbook: 'Workbook',
  anthology: 'Anthology',
  standard: 'Standard',
  blog: 'Blog',
  toolkit: 'Toolkit',
};

const CINEMA_KIND: Record<CinemaItem['type'], string> = {
  documentary: 'Documentary',
  'performance-recording': 'Performance',
  'short-film': 'Short film',
  podcast: 'Podcast',
  series: 'Series',
  film: 'Film',
  talk: 'Talk',
  'video-essay': 'Video essay',
};

const RESOURCE_KIND: Record<Resource['type'], string> = {
  standard: 'Standard',
  tool: 'Tool',
  guide: 'Guide',
  org: 'Organization',
  media: 'Media',
  course: 'Course',
};

// Resources are looked up by url. If the same url were ever listed twice in the
// catalog, the first one wins.
const RESOURCE_BY_URL = new Map<string, Resource>();
for (const r of ALL_RESOURCES) {
  if (!RESOURCE_BY_URL.has(r.url)) RESOURCE_BY_URL.set(r.url, r);
}

/** Own-property check, so a slug like constructor cannot match something inherited. */
function has(table: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(table, key);
}

// Special characters are built from character codes so this file never contains a
// literal em dash or en dash (house rule: none anywhere, comments included).
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);
const ELLIPSIS = String.fromCharCode(0x2026);
const CLOSERS = '"\')' + String.fromCharCode(0x201d, 0x2019);
const OPENERS = '"\'(' + String.fromCharCode(0x201c, 0x2018);
const SENTENCE_END = '[.!?][' + CLOSERS + ']*\\s+(?=[' + OPENERS + ']?[A-Z0-9])';

// A period after these does not end a sentence.
const ABBREVIATIONS = new Set([
  'e.g', 'i.e', 'etc', 'vs', 'st', 'dr', 'mr', 'mrs', 'ms', 'jr', 'sr', 'inc', 'no', 'u.s', 'u.k', 'approx',
]);

/** The first sentence of a catalog description. */
function firstSentence(text: string): string {
  const s = text.replace(/\s+/g, ' ').trim();
  const boundary = new RegExp(SENTENCE_END, 'g');
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(s)) !== null) {
    if (m[0].charAt(0) === '.') {
      const word = (s.slice(0, m.index).match(/([A-Za-z][A-Za-z.]*)$/) || [])[1] || '';
      // An abbreviation, or a single capital letter (an initial), is not the end.
      if (ABBREVIATIONS.has(word.toLowerCase()) || /^[A-Z]$/.test(word)) continue;
    }
    return s.slice(0, m.index + m[0].trimEnd().length).trim();
  }
  return s;
}

/** House rule: no em dashes or en dashes in copy. Catalog text should not have any, but make sure. */
function noDashes(text: string): string {
  return text
    .replace(new RegExp('\\s*[' + EM_DASH + EN_DASH + ']\\s*', 'g'), ', ')
    .replace(/,\s*,/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cut to the limit at a word boundary and add an ellipsis. Never longer than max. */
function limit(text: string, max: number = BLURB_MAX): string {
  if (text.length <= max) return text;
  let cut = text.slice(0, max - 1);
  // If the character right after the cut is a space, the cut already ends on a whole word.
  if (text.charAt(max - 1) !== ' ') {
    const space = cut.lastIndexOf(' ');
    if (space > 0) cut = cut.slice(0, space);
  }
  return cut.replace(/[\s,;:]+$/, '') + ELLIPSIS;
}

function makeBlurb(note: string | undefined, description: string): string {
  const base = note && note.trim() ? note : firstSentence(description);
  return limit(noDashes(base));
}

function libraryRow(item: LibraryItem, note?: string): ShelfRow {
  const row: ShelfRow = {
    key: `library:${item.slug}`,
    title: item.title,
    href: `/library/${item.slug}`,
    external: false,
    kind: LIBRARY_KIND[item.type] ?? 'Book',
    free: !!item.isFree,
    blurb: makeBlurb(note, item.description),
  };
  const author = item.author?.trim();
  if (author) row.creator = author;
  if (item.year !== undefined) row.year = item.year;
  return row;
}

function cinemaRow(item: CinemaItem, note?: string): ShelfRow {
  const row: ShelfRow = {
    key: `cinema:${item.slug}`,
    title: item.title,
    href: `/cinema/${item.slug}`,
    external: false,
    kind: CINEMA_KIND[item.type] ?? 'Film',
    free: !!item.isFree,
    blurb: makeBlurb(note, item.description),
  };
  const creator = (item.director ?? item.creator)?.trim();
  if (creator) row.creator = creator;
  if (item.year !== undefined) row.year = item.year;
  if (item.hasCaptions !== undefined) row.captioned = item.hasCaptions;
  if (item.hasAD !== undefined) row.described = item.hasAD;
  return row;
}

function resourceRow(item: Resource, note?: string): ShelfRow {
  return {
    key: `resource:${item.url}`,
    title: item.name,
    href: item.url,
    external: true,
    kind: RESOURCE_KIND[item.type] ?? 'Link',
    // Only the catalog's own FREE tag counts. Freemium and untagged entries are not marked free.
    // Organizations are never marked: on a theatre company or a nonprofit the tag
    // means the website is free to use, and a Free chip would read as free tickets.
    free: item.type !== 'org' && (item.tags ?? []).some((t) => t.toUpperCase() === 'FREE'),
    blurb: makeBlurb(note, item.description),
  };
}

export function resolveShelves(topic: HotTopic): {
  library: ShelfRow[];
  cinema: ShelfRow[];
  resources: ShelfRow[];
} {
  const notes = topic.shelfNotes ?? {};

  function collect(
    ids: string[],
    group: 'library' | 'cinema' | 'resources',
    build: (id: string, note: string | undefined) => ShelfRow | null,
  ): ShelfRow[] {
    const rows: ShelfRow[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      const row = build(id, has(notes, id) ? notes[id] : undefined);
      if (!row) {
        console.warn(`[hot-topics] topic "${topic.slug}": unknown ${group} entry "${id}", skipped`);
        continue;
      }
      if (seen.has(row.key)) continue;
      seen.add(row.key);
      rows.push(row);
    }
    return rows;
  }

  return {
    library: collect(topic.library, 'library', (slug, note) =>
      has(LIBRARY_ITEM_BY_SLUG, slug) ? libraryRow(LIBRARY_ITEM_BY_SLUG[slug], note) : null,
    ),
    cinema: collect(topic.cinema, 'cinema', (slug, note) =>
      has(CINEMA_ITEM_BY_SLUG, slug) ? cinemaRow(CINEMA_ITEM_BY_SLUG[slug], note) : null,
    ),
    resources: collect(topic.resources, 'resources', (url, note) => {
      const item = RESOURCE_BY_URL.get(url);
      return item ? resourceRow(item, note) : null;
    }),
  };
}
