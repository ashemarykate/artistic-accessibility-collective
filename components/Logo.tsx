'use client';

import { useRef } from 'react';

const LOGO_VERSIONS = [
  '/images/wordmark-v1.png',
  '/images/wordmark-v2.png',
  '/images/wordmark-v3.png',
  '/images/wordmark-v4.png',
];

/**
 * AAC logo — picks one of the 4 versions at random on each page load.
 *
 * When a fixed height is given (no explicit width), the image uses
 * object-fit: cover so it clips at the sides on narrow screens rather
 * than squishing. Pass a width to override this behaviour.
 *
 * When neither height nor width is given, no inline dimension styles
 * are set — the parent CSS (.site-header-logo img etc.) controls sizing.
 */
export default function Logo({
  alt = 'Artistic Accessibility Collective',
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
  const src = useRef(LOGO_VERSIONS[Math.floor(Math.random() * LOGO_VERSIONS.length)]);

  const computedStyle: React.CSSProperties = {
    // Fixed height, no width: clip sides rather than squish on narrow screens
    ...(height != null && width == null
      ? { height, maxWidth: '100%', objectFit: 'cover', objectPosition: 'center' }
      : {}),
    // Both provided: respect them exactly
    ...(height != null && width != null ? { height, width } : {}),
    // Neither provided: no inline dimensions — let CSS rule control sizing
    ...style,
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src.current}
      alt={alt}
      style={computedStyle}
      className={className}
    />
  );
}
