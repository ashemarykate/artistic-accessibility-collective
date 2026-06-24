'use client';

/**
 * Each version has a visual description so screen reader users get
 * the same sense of aesthetic variety that sighted users experience.
 *
 * When alt="" is passed explicitly the image is treated as decorative
 * (the parent link's aria-label does the work). When no alt is passed,
 * the version description is used so the visual character is communicated.
 *
 * SESSION_LOGO_INDEX is picked once per page load so every Logo instance
 * on the same page shows the same style. It changes on refresh.
 */

// All dark-bg SVGs confirmed transparent — safe on blue/navy/teal backgrounds
const LOGO_VERSIONS = [
  {
    src: '/images/wordmark-medium-v1.png',
    description: 'Artistic Accessibility Collective: bold, chunky letters with a heavy drop shadow',
  },
  {
    src: '/images/wordmark-medium-v4.png',
    description: 'Artistic Accessibility Collective: tall, condensed letters with a delicate embossed shadow',
  },
  { src: '/images/wordmark-dark-v1.svg', description: 'Artistic Accessibility Collective: bold rounded white letters with a thick outline, carnival-sign style' },
  { src: '/images/wordmark-dark-v2.svg', description: 'Artistic Accessibility Collective: thin spaced letters with a subtle lean and fine detail' },
  { src: '/images/wordmark-dark-v3.svg', description: 'Artistic Accessibility Collective: compact bold letters with a clean blocky finish' },
  { src: '/images/wordmark-dark-v4.svg', description: 'Artistic Accessibility Collective: soft lavender-pink letters with a candy-stripe shadow' },
];

// Light-bg variants — for use on cream/white page backgrounds
const LOGO_VERSIONS_LIGHT = [
  { src: '/images/wordmark-light-v1.svg', description: 'Artistic Accessibility Collective: light style 1' },
  { src: '/images/wordmark-light-v2.svg', description: 'Artistic Accessibility Collective: light style 2' },
  { src: '/images/wordmark-light-v3.svg', description: 'Artistic Accessibility Collective: light style 3' },
  { src: '/images/wordmark-light-v4.svg', description: 'Artistic Accessibility Collective: light style 4' },
  { src: '/images/wordmark-light-v5.svg', description: 'Artistic Accessibility Collective: light style 5' },
  { src: '/images/wordmark-light-v6.svg', description: 'Artistic Accessibility Collective: light style 6' },
  { src: '/images/wordmark-light-v7.svg', description: 'Artistic Accessibility Collective: light style 7' },
];

// Picked once when the module first loads — consistent across all Logo instances on the page
const SESSION_LOGO_INDEX = typeof window !== 'undefined'
  ? Math.floor(Math.random() * 1000)
  : 0;

export { LOGO_VERSIONS, LOGO_VERSIONS_LIGHT };

export default function Logo({
  alt,
  height,
  width,
  style,
  className,
  variant = 'dark',
}: {
  alt?: string;
  height?: number | string;
  width?: number | string;
  style?: React.CSSProperties;
  className?: string;
  variant?: 'dark' | 'light';
}) {
  const arr = variant === 'light' ? LOGO_VERSIONS_LIGHT : LOGO_VERSIONS;
  const version = arr[SESSION_LOGO_INDEX % arr.length];

  // alt="" means decorative (caller's parent link handles the label).
  // No alt prop means: use the version's visual description.
  const resolvedAlt = alt === '' ? '' : (alt ?? version.description);

  const computedStyle: React.CSSProperties = {
    // Fixed height, no width: scale proportionally — full wordmark always visible
    ...(height != null && width == null
      ? { height: 'auto', maxHeight: height, width: 'auto', maxWidth: '100%' }
      : {}),
    // Both provided: respect them exactly
    ...(height != null && width != null ? { height, width } : {}),
    // Neither provided: no inline dimensions — let CSS rule control sizing
    ...style,
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={version.src}
      alt={resolvedAlt}
      style={computedStyle}
      className={className}
    />
  );
}
