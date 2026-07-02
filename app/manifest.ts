import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Artistic Accessibility Collective',
    short_name: 'AAC',
    description: 'A directory, community, and resource hub for accessibility in the arts.',
    start_url: '/',
    display: 'standalone',
    background_color: '#263590',
    theme_color: '#263590',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
