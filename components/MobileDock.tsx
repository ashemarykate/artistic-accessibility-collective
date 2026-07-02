'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const RAISED = 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #fff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf';
const SUNKEN = 'inset 1px 1px 0 #0a0a0a, inset -1px -1px 0 #fff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf';

const ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'My Collective' },
  { href: '/messages',  icon: '📬', label: 'Messages' },
  { href: '/members',   icon: '👥', label: 'Directory' },
  { href: '/resources', icon: '🌐', label: 'Resources' },
];

/* Phone-only bottom taskbar for member pages: thumb-reach navigation
   dressed as a retro taskbar. Hidden at tablet width and up. */
export default function MobileDock() {
  const pathname = usePathname();
  return (
    <nav aria-label="Quick navigation" className="mobile-dock">
      {ITEMS.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/');
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? 'page' : undefined}
            className="mobile-dock-btn"
            style={{ boxShadow: active ? SUNKEN : RAISED, background: active ? '#bcbcbc' : '#c3c3c3' }}
          >
            <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{it.icon}</span>
            <span className="mobile-dock-label">{it.label}</span>
          </Link>
        );
      })}
      <style>{`
        .mobile-dock {
          display: none;
          position: fixed;
          left: 0; right: 0; bottom: 0;
          z-index: 9000;
          background: #c3c3c3;
          border-top: 1px solid #fff;
          box-shadow: inset 0 2px 0 #fff, 0 -4px 14px rgba(0,0,0,.3);
          padding: 5px 5px calc(5px + env(safe-area-inset-bottom));
          gap: 5px;
        }
        .mobile-dock-btn {
          flex: 1;
          min-height: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: #0a0a0a;
          font-family: "Tahoma","MS Sans Serif",Arial,sans-serif;
          border-radius: 0;
        }
        .mobile-dock-btn[aria-current="page"] .mobile-dock-label { font-weight: 700; }
        .mobile-dock-label { font-size: 10px; line-height: 1; }
        /* Sticker tilt: each button sits slightly off-square; the active one
           is pressed flat. Decorative only, hit areas unchanged. */
        .mobile-dock-btn:nth-child(1) { transform: rotate(-1.5deg); }
        .mobile-dock-btn:nth-child(2) { transform: rotate(1deg); }
        .mobile-dock-btn:nth-child(3) { transform: rotate(-1deg); }
        .mobile-dock-btn:nth-child(4) { transform: rotate(1.5deg); }
        .mobile-dock-btn[aria-current="page"] { transform: none; }
        .mobile-dock-btn:active { transform: translate(1px, 1px); }
        @media (max-width: 640px) {
          .mobile-dock { display: flex; }
        }
      `}</style>
    </nav>
  );
}
