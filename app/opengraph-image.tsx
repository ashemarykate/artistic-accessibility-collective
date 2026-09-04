import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// The picture that shows when a link to the site is shared. Navy ground,
// wordmark in the display face, one line of what the site is.
export const alt = 'Artistic Accessibility Collective';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const font = await readFile(path.join(process.cwd(), 'public/fonts/TAYBigBirdRegular.woff'));
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#0d1e4a', color: '#ffffff',
          padding: 80, textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: 'AAC Display', fontSize: 92, lineHeight: 1.05, display: 'flex', flexDirection: 'column' }}>
          <span>Artistic Accessibility</span>
          <span style={{ color: '#f5d84a' }}>Collective</span>
        </div>
        <div style={{ fontFamily: 'sans-serif', fontSize: 34, marginTop: 36, color: '#d8dcf5', maxWidth: 960 }}>
          A directory, community, and resource hub for accessibility in the arts.
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'AAC Display', data: font, style: 'normal', weight: 400 }] },
  );
}
