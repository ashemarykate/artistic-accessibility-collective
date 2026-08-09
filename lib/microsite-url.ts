/**
 * Validation for a production's interactive microsite address (migration v45).
 *
 * Kept in its own module, with no imports, for two reasons. It is the one piece
 * of the productions layer that decides what goes in an href, which makes it
 * security relevant and worth testing on its own. And lib/productions.ts pulls
 * in the Supabase client, so anything living there cannot be exercised without
 * a database and an environment.
 *
 * Re-exported from lib/productions.ts, so callers keep importing from one place.
 */

/**
 * Where a production's microsite lives, or null if it has none or the stored
 * value is not something we are willing to link to.
 *
 * Validated on the way out rather than on the way in, because the database is
 * the untrusted boundary: a row can be edited straight in the Supabase table
 * editor, and a `javascript:` address in an href is exactly the thing that must
 * never reach a page. Same reasoning as sanitizeHtml for the post body.
 *
 * Allowed: a rooted site-relative path ('/2006'), or an http(s) address.
 * Refused: everything else, including protocol-relative '//evil.com', which
 * looks relative and is not, and a bare 'evil.com', which a browser resolves
 * against the current path rather than as a host.
 */
export function micrositeHref(p: { microsite_url?: string | null }): string | null {
  const raw = p.microsite_url?.trim();
  if (!raw) return null;

  // Strip characters a browser ignores inside a scheme but a naive check does
  // not, so "java\nscript:" cannot slip through as an unknown scheme.
  const probe = raw.replace(/[\u0000-\u0020\u007f-\u009f]+/g, '');
  if (!probe) return null;

  if (probe.startsWith('//')) return null;      // protocol relative, so off site
  if (probe.startsWith('/')) return raw;        // rooted path on this site
  return /^https?:\/\//i.test(probe) ? raw : null;
}

/**
 * True when a microsite lives on another site, so the link needs a new tab and
 * a noopener rel. A site-relative path is same-origin and stays put.
 *
 * Note for whoever links to a microsite: use a plain <a>, never next/link, even
 * for the relative case. A microsite is not a React route (/2006 is static
 * files in public/2006 served through a rewrite in next.config.ts), so
 * next/link would try for an RSC payload and fall back to a hard navigation,
 * which is a stumble the visitor can see.
 */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}
