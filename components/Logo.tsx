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
 * Logos are 12:1 aspect ratio wordmarks (full-width text). Sizing rules:
 *
 * - height only → max-height + width: auto + max-width: 100%
 *   Image scales proportionally to fill its container up to that height.
 *   Never squishes, never clips — full wordmark always visible.
 * - height + width → respect both exactly
 * - neither → no inline dimensions; parent CSS controls sizing
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
      src={src.current}
      alt={alt}
      style={computedStyle}
      className={className}
    />
  );
}
