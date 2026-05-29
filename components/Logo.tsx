'use client';

import { useRef } from 'react';

/**
 * Each version has a visual description so screen reader users get
 * the same sense of aesthetic variety that sighted users experience.
 *
 * When alt="" is passed explicitly the image is treated as decorative
 * (the parent link's aria-label does the work). When no alt is passed,
 * the version description is used so the visual character is communicated.
 */
const LOGO_VERSIONS = [
  {
    src: '/images/wordmark-medium-v1.png',
    description: 'Artistic Accessibility Collective — bold, chunky letters with a heavy drop shadow',
  },
  {
    src: '/images/wordmark-medium-v2.png',
    description: 'Artistic Accessibility Collective — thin, widely-spaced letters, light and airy',
  },
  {
    src: '/images/wordmark-medium-v3.png',
    description: 'Artistic Accessibility Collective — rounded letters on a soft pink and blue pastel gradient',
  },
  {
    src: '/images/wordmark-medium-v4.png',
    description: 'Artistic Accessibility Collective — tall, condensed letters with a delicate embossed shadow',
  },
];

const TITLEBAR_VERSIONS = [
  {
    src: '/images/titlebar-v1.png',
    description: 'Artistic Accessibility Collective — bold, chunky letters with a heavy drop shadow',
  },
  {
    src: '/images/titlebar-v2.png',
    description: 'Artistic Accessibility Collective — thin, widely-spaced letters, light and airy',
  },
  {
    src: '/images/titlebar-v3.png',
    description: 'Artistic Accessibility Collective — rounded letters on a soft pink and blue pastel gradient',
  },
  {
    src: '/images/titlebar-v4.png',
    description: 'Artistic Accessibility Collective — tall, condensed letters with a delicate embossed shadow',
  },
];

export { TITLEBAR_VERSIONS };

export default function Logo({
  alt,
  height,
  width,
  style,
  className,
}: {
  alt?: string;
  height?: number | string;
  width?: number | string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const version = useRef(LOGO_VERSIONS[Math.floor(Math.random() * LOGO_VERSIONS.length)]);

  // alt="" means decorative (caller's parent link handles the label).
  // No alt prop means: use the version's visual description.
  const resolvedAlt = alt === '' ? '' : (alt ?? version.current.description);

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
      src={version.current.src}
      alt={resolvedAlt}
      style={computedStyle}
      className={className}
    />
  );
}
