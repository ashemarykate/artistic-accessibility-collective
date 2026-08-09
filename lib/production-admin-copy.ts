/**
 * Copy for the Production Admin Portal.
 *
 * Every section of the portal opens with a short plain-language note telling
 * the person what they can do there. They live here rather than inline in JSX
 * so there is one place to read them all and check the voice.
 *
 * COPY RULES (from CLAUDE.md, and they matter here more than anywhere):
 *   - Zero em dashes. No em dash, no en dash, no double hyphen. Not in the
 *     text, not in aria-labels, not in page titles. Use a comma, a colon, or
 *     just start a new sentence.
 *   - Write like a person talking to a friend who is about to use the thing.
 *     Say what they can do and what happens when they do it.
 *   - Say "you" and "your". Not "users may".
 *   - No jargon. Nobody in the company knows what a row or a record is, and
 *     they should not have to.
 *
 * There is a test at the bottom of this file's story: `npm run lint` will not
 * catch a stray em dash, so if you add copy here, reread it.
 */

import type React from 'react';

export type PortalRole = 'producer' | 'creator' | 'crew';

/** Shown once at the top of the portal, under the show title. */
export const PORTAL_INTRO: Record<PortalRole, string> = {
  producer:
    'You are a producer on this show, so everything here is yours. You can edit the show itself, add and remove people, approve videos, build playlists, and flip the live switches during a performance. If something looks breakable, it probably is, so take a beat before a show.',

  creator:
    'This is where you look after your own corner of the show. You can write your profile, set your away message, approve video submissions as they come in, and make playlists. You cannot change anyone else’s profile or the live show settings, so click around freely. Nothing here can break the show.',

  crew:
    'This is your corner of the show. Write your profile, set your away message, make playlists, and post whatever you want to post. Approving other people\u2019s video submissions and the live show settings are handled by the producers, but everything that is yours is yours.',
};

/** Section headers plus the note that sits under each one. */
export const SECTIONS = {
  profile: {
    title: 'Your profile',
    blurb:
      'This is you, as the audience sees you. Your screen name, your bio, your away message, and the colors your window uses. Save it and the site updates right away, so feel free to change your away message the morning of a show if the mood strikes.',
    forRoles: ['producer', 'creator', 'crew'] as PortalRole[],
  },

  about: {
    title: 'What the show is about',
    blurb:
      'Everyone on the buddy list answers this one, in your own words. Yours shows up on the show page in your colors and your font, stacked with everyone else\u2019s like a chat room we are all sitting in. Nobody outside the company can post there, so say what you actually think it is about. You can rewrite it any time.',
    forRoles: ['producer', 'creator', 'crew'] as PortalRole[],
  },

  videos: {
    title: 'Video submissions',
    blurb:
      'Everything the public sends in lands here first, and nothing reaches the site until one of us says yes. Watch it, then approve it or leave it. Approving puts it straight onto the countdown where the audience can vote for it. If you approve something by accident you can take it back down, and no one will have seen it unless a show was running.',
    forRoles: ['producer', 'creator'] as PortalRole[],
  },

  playlists: {
    title: 'Playlists',
    blurb:
      'Make a mix. Name it, add songs, say why each one is on there if you want to. Your playlists show up on the site under your name, and you can hide one while you are still fiddling with it. These are yours: other people can see them but only you can edit yours.',
    forRoles: ['producer', 'creator'] as PortalRole[],
  },

  showMode: {
    title: 'Show mode',
    blurb:
      'The live switches. Turning on show mode opens the message windows so the audience can write to the cast during a performance. Voting opens the countdown. Both take effect on every phone in the room within a second or two, so save these for when you actually mean it.',
    forRoles: ['producer'] as PortalRole[],
  },

  messages: {
    title: 'Messages',
    blurb:
      'What the audience is sending in, newest first. You can reply as any of the cast screen names, and your reply appears in that person’s window on the audience side. Hide anything that should not be on a screen in front of a room. There is a panic button that hides everything at once if a night goes sideways.',
    forRoles: ['producer', 'creator'] as PortalRole[],
  },

  team: {
    title: 'The company',
    blurb:
      'Everyone working on this show and what each person is allowed to do. Anybody on this list can write their own profile, their own playlists, and their own posts. Creators can also approve video submissions. Producers can do all of it, including this page. Adding someone here gives them access to this show only, never to anything else on the Collective.',
    forRoles: ['producer'] as PortalRole[],
  },

  show: {
    title: 'Show details',
    blurb:
      'The title, the dates, the venue, the ticket links, and the access information. This is what fills the public page for the show. While the show is a draft only the company can see it, so you can write it messy and tidy it later.',
    forRoles: ['producer'] as PortalRole[],
  },
} as const;

/** Plain-language role names, for anywhere a role is shown to a person. */
export const ROLE_LABELS: Record<PortalRole, string> = {
  producer: 'Producer',
  creator: 'Creator',
  crew: 'Crew',
};

export const ROLE_HELP: Record<PortalRole, string> = {
  producer: 'Runs the show. Can change anything here, including who is on this list.',
  creator: 'Everything crew can do, plus approving video submissions.',
  crew: 'Their own profile, their own playlists, their own posts.',
};

/**
 * The portal wears the production's own wallpaper.
 *
 * This is orientation, not decoration. Somebody who works on both the
 * Collective admin and a Production Admin should be able to tell which one
 * they are looking at before they read a single word, and which show they are
 * editing when there is more than one.
 *
 * Falls back to the flat colour while the image loads or if none is set, so
 * the portal is never a white flash.
 */
export interface ProductionTheme {
  backgroundUrl: string | null;
  backgroundColor: string | null;
}

export function portalBackgroundStyle(theme: ProductionTheme): React.CSSProperties {
  const color = theme.backgroundColor ?? 'var(--aac-blue)';
  return theme.backgroundUrl
    ? {
        backgroundColor: color,
        backgroundImage: `url(${theme.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }
    : { backgroundColor: color };
}

/**
 * Panels sit on top of that wallpaper, so they need to stay readable over a
 * busy image. Solid card, real shadow, no transparency.
 */
export const PORTAL_PANEL_STYLE: React.CSSProperties = {
  background: 'var(--aac-cream)',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
  borderRadius: '4px',
};

/** Sections this person should actually see. */
export function sectionsForRole(role: PortalRole) {
  return Object.entries(SECTIONS)
    .filter(([, s]) => (s.forRoles as readonly PortalRole[]).includes(role))
    .map(([key, s]) => ({ key, ...s }));
}
