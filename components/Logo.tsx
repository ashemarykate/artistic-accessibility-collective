'use client';

import { useRef } from 'react';

const LOGO_VERSIONS = [
  '/images/wordmark-v1.svg',
  '/images/wordmark-v2.svg',
  '/images/wordmark-v3.svg',
  '/images/wordmark-v4.svg',
];

/**
 * AAC logo — picks one of the 4 versions at random on each page load.
 * Pass height, width, style, and className as needed.
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
  // useRef so the version stays stable across re-renders on the same page
  const src = useRef(LOGO_VERSIONS[Math.floor(Math.random() * LOGO_VERSIONS.length)]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src.current}
      alt={alt}
      height={height}
      width={width}
      style={{ width: width ?? 'auto', height: height ?? 'auto', ...style }}
      className={className}
    />
  );
}
