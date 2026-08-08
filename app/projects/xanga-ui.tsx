'use client';

/**
 * Shared furniture for the Current Projects & Events section.
 *
 * The era here is a 2002 blog: Xanga. Lavender tiled background, a banner with
 * a wordmark, a narrow right sidebar of bordered "modules", and posts that hang
 * off a dated header bar. /together used to hold the LiveJournal treatment and
 * now redirects to the calendar, so this is the section that carries the
 * blog-era look.
 *
 * Every color here was picked to clear WCAG AA against the surface it sits on,
 * which is the one place the nostalgia gets overruled: real Xanga was mostly
 * pale grey text on a tiled GIF.
 *
 * Contrast, measured against white unless noted:
 *   ink      #1f1a26  15.5:1
 *   plum     #5b2d82   9.7:1   (also 9.7:1 as a background behind white text)
 *   grape    #7b3f9d   6.9:1   (as a background behind white text)
 *   muted    #4a4453  8.9:1
 */

import Link from 'next/link';

export const X = {
  ink:      '#1f1a26',
  muted:    '#4a4453',
  plum:     '#5b2d82',
  grape:    '#7b3f9d',
  lilac:    '#d9c9ec',
  haze:     '#efe8f7',
  page:     '#e8e2f2',
  white:    '#ffffff',
  rule:     '#b9a6d4',
  gold:     '#f5d84a',
  sans:     '"Trebuchet MS", "Lucida Grande", Verdana, sans-serif',
  serif:    'Georgia, "Times New Roman", serif',
};

/** The tiled-background feeling, done with gradients so there's no image to
 *  load and no risk of a busy tile hurting readability. */
export const pageBackground =
  `repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 4px), ${X.page}`;

/**
 * A link that stands on its own (a sidebar list item, a "read more", a back
 * link) rather than sitting inside a sentence. Standalone links have to meet
 * the 44px target the rest of the site uses; WCAG's inline exception only
 * covers links in a run of text, and a bare 16px-tall row in a list is exactly
 * the fiddly tap target that rule exists to prevent.
 *
 * Links genuinely inside a sentence are left alone on purpose.
 */
export const navLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  color: X.plum,
  fontWeight: 700,
  textDecoration: 'underline',
};

// ── Banner ────────────────────────────────────────────────────────────────────

export function Banner({ subtitle }: { subtitle?: string }) {
  return (
    <header
      style={{
        background: `linear-gradient(135deg, ${X.plum} 0%, ${X.grape} 55%, #9a5ab8 100%)`,
        border: `2px solid ${X.plum}`,
        borderRadius: 4,
        padding: '1.25rem 1.25rem 1rem',
        marginBottom: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative sparkle row, the way every 2002 banner had something
          twinkling in the corner. */}
      <div aria-hidden="true" style={{ position: 'absolute', top: 8, right: 12, fontSize: 14, letterSpacing: 3, opacity: 0.65 }}>
        ✦ ✧ ✦
      </div>

      <p style={{
        margin: 0, fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase',
        color: X.lilac, fontFamily: X.sans, fontWeight: 700,
      }}>
        Artistic Accessibility Productions
      </p>
      <h1 className="font-display" style={{
        margin: '0.25rem 0 0', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', lineHeight: 1.1,
        color: X.white,
      }}>
        Current Projects &amp; Events
      </h1>
      <p style={{
        margin: '0.5rem 0 0', fontSize: '0.9375rem', color: X.white,
        fontFamily: X.sans, maxWidth: '46ch',
      }}>
        {subtitle ?? 'What we are making right now. Shows, workshops and projects produced by the Artistic Accessibility team, built with access from the start.'}
      </p>
    </header>
  );
}

// ── Sidebar module box ────────────────────────────────────────────────────────

export function Module({
  title, children, id,
}: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section
      aria-labelledby={id ? `${id}-heading` : undefined}
      style={{
        border: `2px solid ${X.grape}`,
        borderRadius: 4,
        background: X.white,
        marginBottom: '1rem',
        overflow: 'hidden',
      }}
    >
      <h2
        id={id ? `${id}-heading` : undefined}
        style={{
          margin: 0, padding: '0.5rem 0.75rem',
          background: X.grape, color: X.white,
          fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', fontFamily: X.sans,
        }}
      >
        {title}
      </h2>
      <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: X.ink, fontFamily: X.sans, lineHeight: 1.5 }}>
        {children}
      </div>
    </section>
  );
}

// ── Post frame ────────────────────────────────────────────────────────────────

/** A blog entry: a dated bar, then the body in a bordered white box. */
export function PostFrame({
  eyebrow, children,
}: { eyebrow: React.ReactNode; children: React.ReactNode }) {
  return (
    <article style={{
      border: `2px solid ${X.grape}`,
      borderRadius: 4,
      background: X.white,
      marginBottom: '1.25rem',
      overflow: 'hidden',
    }}>
      <div style={{
        background: X.lilac,
        borderBottom: `2px solid ${X.grape}`,
        padding: '0.4375rem 0.75rem',
        fontSize: '0.75rem', fontWeight: 700, color: X.plum,
        fontFamily: X.sans, letterSpacing: '0.04em',
      }}>
        {eyebrow}
      </div>
      <div style={{ padding: '1rem' }}>
        {children}
      </div>
    </article>
  );
}

// ── Access chips ──────────────────────────────────────────────────────────────

export function AccessChips({ features }: { features: string[] }) {
  if (features.length === 0) return null;
  return (
    <ul style={{
      listStyle: 'none', margin: '0.625rem 0 0', padding: 0,
      display: 'flex', flexWrap: 'wrap', gap: '0.375rem',
    }}>
      {features.map((f) => (
        <li key={f} style={{
          fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px',
          borderRadius: 12, background: X.haze, color: X.plum,
          border: `1px solid ${X.rule}`, fontFamily: X.sans,
        }}>
          {f}
        </li>
      ))}
    </ul>
  );
}

// ── Standard sidebar modules, shared by both pages ────────────────────────────

export function ElsewhereModule() {
  const links: Array<{ href: string; label: string }> = [
    { href: '/calendar',    label: 'The full community calendar' },
    { href: '/learning-hub', label: 'Learning Hub' },
    { href: '/directory',   label: 'Member directory' },
    { href: '/work-with-us', label: 'Book us for something' },
    { href: '/contact',     label: 'Get in touch' },
  ];
  return (
    <Module title="Elsewhere" id="elsewhere">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="xanga-link" style={navLink}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </Module>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

/** Two-column blog layout: content, then a sidebar that drops below it on
 *  narrow screens. The sidebar is a <div> rather than <aside> when it holds the
 *  attending controls, so it isn't announced as tangential. */
export function XangaLayout({
  main, sidebar,
}: { main: React.ReactNode; sidebar: React.ReactNode }) {
  return (
    <div className="xanga-cols">
      <div style={{ minWidth: 0 }}>{main}</div>
      <div style={{ minWidth: 0 }}>{sidebar}</div>
      <style>{`
        .xanga-cols {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 820px) {
          .xanga-cols { grid-template-columns: minmax(0, 1fr); }
        }
        /* Lives here rather than in PostBodyStyles so the focus ring is present
           on every page in this section, including the index, which has no
           free-write body to style. */
        .xanga-link:focus-visible { outline: 3px solid ${X.gold}; outline-offset: 2px; }
      `}</style>
    </div>
  );
}

/** Typography for the free-write post body. Scoped to .xanga-post so a stray
 *  heading in someone's post can't restyle the rest of the page. */
export function PostBodyStyles() {
  return (
    <style>{`
      .xanga-post { font-family: ${X.sans}; font-size: 1rem; line-height: 1.65; color: ${X.ink}; }
      .xanga-post > *:first-child { margin-top: 0; }
      .xanga-post > *:last-child { margin-bottom: 0; }
      .xanga-post p { margin: 0 0 0.875rem; }
      .xanga-post h2 { font-size: 1.375rem; line-height: 1.25; margin: 1.5rem 0 0.5rem; color: ${X.plum}; }
      .xanga-post h3 { font-size: 1.125rem; line-height: 1.3; margin: 1.25rem 0 0.375rem; color: ${X.plum}; }
      .xanga-post h4 { font-size: 1rem; margin: 1rem 0 0.25rem; color: ${X.plum}; }
      .xanga-post ul, .xanga-post ol { margin: 0 0 0.875rem; padding-left: 1.5rem; }
      .xanga-post li { margin-bottom: 0.3125rem; }
      .xanga-post blockquote {
        margin: 0 0 0.875rem; padding: 0.5rem 0 0.5rem 1rem;
        border-left: 4px solid ${X.lilac}; font-style: italic; color: ${X.muted};
      }
      .xanga-post a { color: ${X.plum}; text-decoration: underline; font-weight: 600; }
      .xanga-post a:hover { background: ${X.haze}; }
      .xanga-post img { max-width: 100%; height: auto; border: 2px solid ${X.rule}; border-radius: 3px; margin: 0.5rem 0; }
      .xanga-post hr { border: none; border-top: 2px dotted ${X.rule}; margin: 1.25rem 0; }
      .xanga-post figure { margin: 0.75rem 0; }
      .xanga-post figcaption { font-size: 0.8125rem; color: ${X.muted}; margin-top: 0.25rem; }
      .xanga-post a:focus-visible { outline: 3px solid ${X.gold}; outline-offset: 2px; }
    `}</style>
  );
}
