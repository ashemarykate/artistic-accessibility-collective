// Hot Topics: which topics are live, and nothing else.
//
// This file is deliberately tiny and holds NO topic text. The navigation
// (the Start menu, the home desktop, the Resources links bar) is client code
// that ships to every visitor, and it needs to know one thing: is the Hot
// Topics section public yet? If it imported lib/hot-topics-data.ts to find
// out, the full text of every unread draft topic would travel with it in the
// browser JavaScript, even while the pages themselves answer 404.
//
// HOW A TOPIC GOES LIVE (Mary Kate): add its slug to LIVE_TOPIC_SLUGS below
// and push. That is the only place to change. Any topic not listed is a draft,
// so a typo here can only keep something hidden, never publish it by accident.
// A draft is invisible on the live site (404, no links, not in the sitemap).
// It still shows on your computer while developing (npm run dev) and in any
// build made with NEXT_PUBLIC_HOT_TOPICS_SHOW_DRAFTS=1.
//
// Safe to import from client components. Never add topic text, titles or
// slugs of draft topics to this file.

/** Slugs of topics that are live. Empty means every topic is still a draft. */
export const LIVE_TOPIC_SLUGS: readonly string[] = [];

// Drafts are visible in local development and in any build made with
// NEXT_PUBLIC_HOT_TOPICS_SHOW_DRAFTS=1. The NEXT_PUBLIC_ prefix is required so
// Next inlines the value into BOTH the server and the client bundle. Without it
// the server would hide drafts while the browser showed them, and the page
// would break on load. Read it exactly as written below, never through a
// variable, or Next cannot inline it.
export const HOT_TOPICS_SHOW_DRAFTS: boolean =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_HOT_TOPICS_SHOW_DRAFTS === '1';

/**
 * False means the whole section is hidden: no nav links, no sitemap entries,
 * no pages. True when at least one topic is live, or drafts are switched on.
 */
export const HOT_TOPICS_PUBLIC: boolean = HOT_TOPICS_SHOW_DRAFTS || LIVE_TOPIC_SLUGS.length > 0;
