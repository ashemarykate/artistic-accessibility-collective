/**
 * Pixel-art style icons for the member hub, inspired by MySpace's
 * "Contacting" section icon set. Each renders at 16×16px on the dark
 * blue box headers. Colors chosen to pass WCAG AA contrast on #2d44b8.
 *
 * Mapping:
 *   EnvelopeIcon    → Messages        (Send Message envelope)      hot pink  #ff77aa
 *   PersonBubble    → Discussion      (Instant Message)            yellow    #ffdd44
 *   PersonStar      → Job Board       (Rank User)                  orange    #ff9944
 *   PeopleIcon      → Directory       (Add to Group)               cyan      #44ddff
 *   FavoritesStar   → My Resources    (Add to Favorites)           gold      #ffcc00
 *   PersonPlus      → New Members     (Add to Friends)             green     #88ee44
 *   WrenchIcon      → Control Panel   (no MySpace match — wrench)  lavender  #cc99ff
 *   PencilIcon        → Edit Profile      (uses currentColor)
 *   MonitorPlayIcon   → Learning Portal   purple   #bb66ff
 *   ListIcon          → My Lists          blue     #6699ff
 *   LiveCameraIcon    → Live Events       magenta  #ff55bb
 *   LocationPinIcon   → In-Person Events  amber    #ffbb33
 */

import React from 'react';

// ── Shared base SVG props ────────────────────────────────────────────────────

const base: React.SVGProps<SVGSVGElement> = {
  width:   16,
  height:  16,
  viewBox: '0 0 20 20',
  fill:    'none',
  'aria-hidden': true,
  style:   { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 },
};

// ── Shared person silhouette geometry ────────────────────────────────────────

// Single person (centered)
const HEAD  = { cx: 9,  cy: 7.5, r: 4.5 };
const BODY  = 'M2.5,19.5 Q2.5,14 9,14 Q15.5,14 15.5,19.5';

// Two people (left = front/full, right = back/faded)
const HEAD_L = { cx: 7,  cy: 7, r: 3.5 };
const HEAD_R = { cx: 13, cy: 7, r: 3.5 };
const BODY_L = 'M1,19.5 Q1,13 7,13 Q13,13 13,19.5';
const BODY_R = 'M7,19.5 Q7,13 13,13 Q19,13 19,19.5';

// ── Messages: hot-pink envelope with send arrow ──────────────────────────────
// Inspired by MySpace "Send Message" — envelope + outgoing indicator

export function EnvelopeIcon() {
  return (
    <svg {...base}>
      {/* envelope body */}
      <rect x="1" y="6.5" width="15" height="11.5" rx="1.5" fill="#ff77aa" />
      {/* V-flap crease */}
      <polyline points="1,6.5 8.5,13.5 16,6.5"
        stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      {/* outgoing arrow — top right, suggests "sending" */}
      <polyline points="12,1.5 18.5,1.5 18.5,8"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="8" x2="18.5" y2="1.5"
        stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Discussion Board: yellow person + speech bubble ──────────────────────────
// Inspired by MySpace "Instant Message" icon

export function PersonBubbleIcon() {
  return (
    <svg {...base}>
      {/* person silhouette */}
      <circle {...HEAD} fill="#ffdd44" />
      <path d={BODY} fill="#ffdd44" />
      {/* speech bubble, white, top-right */}
      <rect x="12" y="0.5" width="8" height="6" rx="1.5" fill="white" />
      {/* bubble tail pointing to person */}
      <path d="M13 6.5 L12 10 L17 6.5 Z" fill="white" />
      {/* three yellow dots inside bubble */}
      <circle cx="14"  cy="3.5" r="0.85" fill="#ffdd44" />
      <circle cx="16"  cy="3.5" r="0.85" fill="#ffdd44" />
      <circle cx="18"  cy="3.5" r="0.85" fill="#ffdd44" />
    </svg>
  );
}

// ── Job Board: orange person + star ──────────────────────────────────────────
// Inspired by MySpace "Rank User" icon

export function PersonStarIcon() {
  return (
    <svg {...base}>
      {/* person silhouette */}
      <circle {...HEAD} fill="#ff9944" />
      <path d={BODY} fill="#ff9944" />
      {/* white 5-point star, top-right */}
      <polygon
        points="17,0.5 17.9,3.1 20.5,3.1 18.4,4.7 19.2,7.3 17,5.7 14.8,7.3 15.6,4.7 13.5,3.1 16.1,3.1"
        fill="white"
      />
    </svg>
  );
}

// ── Member Directory: two cyan people + plus ─────────────────────────────────
// Inspired by MySpace "Add to Group" icon

export function PeopleIcon() {
  return (
    <svg {...base}>
      {/* back person (right) — dimmed for depth */}
      <circle {...HEAD_R} fill="#44ddff" opacity="0.45" />
      <path d={BODY_R}   fill="#44ddff" opacity="0.45" />
      {/* front person (left) — full color */}
      <circle {...HEAD_L} fill="#44ddff" />
      <path d={BODY_L}   fill="#44ddff" />
      {/* white plus sign, top-right */}
      <line x1="15" y1="2.25" x2="20"   y2="2.25"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17.5" y1="-0.25" x2="17.5" y2="4.75"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── My Resources: gold star ───────────────────────────────────────────────────
// Inspired by MySpace "Add to Favorites" — star = saved/loved things

export function FavoritesStarIcon() {
  return (
    <svg {...base}>
      <polygon
        points="10,1 12.6,7.6 19.5,7.6 14,11.7 16.2,18.3 10,14.2 3.8,18.3 6,11.7 0.5,7.6 7.4,7.6"
        fill="#ffcc00"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── New Members: green person + plus ─────────────────────────────────────────
// Inspired by MySpace "Add to Friends" icon

export function PersonPlusIcon() {
  return (
    <svg {...base}>
      {/* person silhouette */}
      <circle {...HEAD} fill="#88ee44" />
      <path d={BODY}   fill="#88ee44" />
      {/* white plus sign, top-right */}
      <line x1="14.5" y1="2.25" x2="19.5" y2="2.25"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17"   y1="-0.25" x2="17"  y2="4.75"
        stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Control Panel: lavender wrench ───────────────────────────────────────────
// No direct MySpace equivalent — classic wrench for settings

export function WrenchIcon() {
  return (
    <svg {...base}>
      {/* head oval */}
      <ellipse cx="9.5" cy="7.5" rx="6.5" ry="5.5" fill="#cc99ff" />
      {/* handle extending down */}
      <rect x="8" y="7" width="3" height="12" rx="1.5" fill="#cc99ff" />
      {/* jaw opening at top — white slot (the wrench mouth) */}
      <rect x="7" y="1.5" width="5" height="4.5" rx="0.75" fill="white" />
      {/* center nut hole */}
      <circle cx="9.5" cy="9" r="2.5" fill="white" />
    </svg>
  );
}

// ── Edit Profile: pencil ──────────────────────────────────────────────────────
// Uses currentColor so it works on any background (white sidebar, cream hello bar, etc.)
// Size is slightly smaller since it appears inline with text

export function PencilIcon() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden={true}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, marginRight: 3 }}
    >
      {/* pencil shaft (tilted parallelogram) */}
      <path
        d="M3,16 L13,4 Q14.5,2 16.5,3.5 L17.5,5 Q19.5,7 17.5,9 L7.5,19 Z"
        fill="currentColor"
      />
      {/* tip */}
      <path d="M3,16 L1,20 L5,19 Z" fill="currentColor" opacity="0.75" />
      {/* pink eraser at top */}
      <path
        d="M14,2.5 Q15,1 16.5,2 Q18,3 17.5,4.5 L16.5,6 Q15,5 14.5,3.5 Z"
        fill="#ffaabb"
      />
      {/* highlight line on shaft */}
      <line x1="5.5" y1="16" x2="14.5" y2="5"
        stroke="white" strokeWidth="0.75" opacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Learning Portal: purple monitor with play button ─────────────────────────
export function MonitorPlayIcon() {
  return (
    <svg {...base}>
      {/* screen */}
      <rect x="1" y="2" width="18" height="13" rx="1.5" fill="#bb66ff" />
      {/* screen bezel / inner screen */}
      <rect x="3" y="4" width="14" height="9" rx="0.75" fill="white" opacity="0.25" />
      {/* play triangle */}
      <polygon points="8,6 8,12 14,9" fill="white" />
      {/* stand neck */}
      <rect x="8.5" y="15" width="3" height="2.5" rx="0.5" fill="#bb66ff" />
      {/* base */}
      <rect x="5.5" y="17" width="9" height="2" rx="1" fill="#bb66ff" />
    </svg>
  );
}

// ── My Lists: blue bulleted list ──────────────────────────────────────────────
export function ListIcon() {
  return (
    <svg {...base}>
      {/* list background card */}
      <rect x="2" y="1" width="16" height="18" rx="1.5" fill="#6699ff" />
      {/* three bullet dots */}
      <circle cx="5.5" cy="6"  r="1.5" fill="white" />
      <circle cx="5.5" cy="10" r="1.5" fill="white" />
      <circle cx="5.5" cy="14" r="1.5" fill="white" />
      {/* three lines */}
      <line x1="8.5" y1="6"  x2="16" y2="6"  stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="8.5" y1="10" x2="16" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="8.5" y1="14" x2="14" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Live Events: magenta camera with live dot ─────────────────────────────────
export function LiveCameraIcon() {
  return (
    <svg {...base}>
      {/* camera body */}
      <rect x="1" y="5" width="13" height="10" rx="1.5" fill="#ff55bb" />
      {/* lens */}
      <circle cx="7.5" cy="10" r="3.5" fill="white" opacity="0.3" />
      <circle cx="7.5" cy="10" r="2"   fill="white" opacity="0.5" />
      {/* viewfinder bump */}
      <rect x="5" y="2.5" width="5" height="3" rx="1" fill="#ff55bb" />
      {/* video triangle (right side — broadcast) */}
      <polygon points="15,7 15,13 20,10" fill="#ff55bb" />
      {/* live dot — top right */}
      <circle cx="18" cy="4" r="2.5" fill="#ff3333" />
      <circle cx="18" cy="4" r="1"   fill="white" />
    </svg>
  );
}

// ── In-Person Events: amber location pin ─────────────────────────────────────
export function LocationPinIcon() {
  return (
    <svg {...base}>
      {/* pin head */}
      <circle cx="10" cy="7.5" r="6.5" fill="#ffbb33" />
      {/* pin tail */}
      <path d="M7,12 Q10,20 10,20 Q10,20 13,12 Z" fill="#ffbb33" />
      {/* inner circle (hole) */}
      <circle cx="10" cy="7.5" r="3" fill="white" opacity="0.5" />
      <circle cx="10" cy="7.5" r="1.5" fill="white" />
    </svg>
  );
}
