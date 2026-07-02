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
        background: '#e8e4da',
        borderRight: '3px solid #111',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '6px 5px',
        flexShrink: 0,
      }}
    >
      {/* Home — always first */}
      <Link
        href="/"
        aria-label="Back to Home"
        className="kp-tool"
        style={{
          width: 44, height: 44,
          background: '#263590',
          border: '3px solid #111',
          borderRadius: 8,
          boxShadow: '2px 2px 0 #111',
          fontSize: 22, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        🏠
      </Link>

      {/* Divider */}
      <div aria-hidden="true" style={{ height: 3, background: '#111', margin: '1px 4px', borderRadius: 2 }} />

      {/* Project nav buttons */}
      {TOOLS.map((tool) => {
        const isActive = tool.id === active;
        return (
          <Link
            key={tool.id}
            href={tool.href}
            aria-label={tool.label}
            aria-current={isActive ? 'page' : undefined}
            className="kp-tool"
            style={{
              width: 44, height: 44,
              background: isActive ? tool.activeBg : tool.bg,
              border: '3px solid #111',
              borderRadius: 8,
              boxShadow: isActive ? 'inset 2px 2px 0 rgba(0,0,0,.5)' : '2px 2px 0 #111',
              outline: isActive ? '3px solid #f5d84a' : 'none',
              outlineOffset: isActive ? 1 : 0,
              fontSize: 22, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            {tool.emoji}
          </Link>
        );
      })}

      <style>{`
        .kp-tool{transition:transform .08s ease-out}
        .kp-tool:hover{transform:rotate(-4deg) scale(1.08)}
        .kp-tool:focus-visible{outline:3px solid #f5d84a;outline-offset:2px}
        @media (prefers-reduced-motion: reduce){.kp-tool:hover{transform:none}}
        @media (max-width: 580px) {
          .kid-art-toolbar {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            border-right: none !important;
            border-bottom: 3px solid #111 !important;
            padding: 5px 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
