import Link from 'next/link';

export type KidArtPage = 'make-art' | 'image-description' | 'the-channel';

const TOOLS = [
  {
    id: 'make-art' as KidArtPage,
    emoji: '🖌️',
    label: 'Make Art home',
    href: '/make-art',
    bg: '#c85a20',
    activeBg: '#7a3010',
  },
  {
    id: 'image-description' as KidArtPage,
    emoji: '👁️',
    label: 'Image Description as Art',
    href: '/make-art/image-description',
    bg: '#0b5e48',
    activeBg: '#073d2e',
  },
  {
    id: 'the-channel' as KidArtPage,
    emoji: '📺',
    label: 'The Channel',
    href: '/make-art/the-channel',
    bg: '#7a4500',
    activeBg: '#4a2a00',
  },
];

export default function KidArtToolbar({ active }: { active: KidArtPage }) {
  return (
    <div
      role="toolbar"
      aria-label="Play tools"
      className="kid-art-toolbar"
      style={{
        background: '#d0d0d0',
        borderRight: '3px solid #888',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '4px 3px',
        flexShrink: 0,
      }}
    >
      {/* Home — always first */}
      <Link
        href="/"
        aria-label="Back to Home"
        style={{
          width: 34, height: 34,
          background: '#263590',
          border: '2px outset #eee',
          borderRadius: 3,
          fontSize: 18, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        🏠
      </Link>

      {/* Divider */}
      <div aria-hidden="true" style={{ height: 2, background: '#999', margin: '2px 2px' }} />

      {/* Project nav buttons */}
      {TOOLS.map((tool) => {
        const isActive = tool.id === active;
        return (
          <Link
            key={tool.id}
            href={tool.href}
            aria-label={tool.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              width: 34, height: 34,
              background: isActive ? tool.activeBg : tool.bg,
              border: isActive ? '2px inset #444' : '2px outset #eee',
              borderRadius: 3,
              fontSize: 18, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
              flexShrink: 0,
              outline: 'none',
            }}
          >
            {tool.emoji}
          </Link>
        );
      })}

      <style>{`
        @media (max-width: 580px) {
          .kid-art-toolbar {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            border-right: none !important;
            border-bottom: 3px solid #888 !important;
            padding: 3px 4px !important;
            gap: 3px !important;
          }
        }
      `}</style>
    </div>
  );
}
