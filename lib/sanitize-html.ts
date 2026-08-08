/**
 * sanitize-html · allowlist HTML sanitizer for the Productions free-write body
 *
 * Why this exists: Admin -> Productions saves a rich text post as HTML, and
 * /projects/[slug] renders it with dangerouslySetInnerHTML. Anything reaching
 * that call has to be scrubbed first, and it has to be scrubbed on the way OUT
 * as well as the way in, because the database is the untrusted boundary here:
 * a row could have been written before a rule tightened, or edited straight in
 * the Supabase table editor.
 *
 * Why hand-rolled rather than DOMPurify: this runs during server rendering too,
 * where there is no DOM, and the tag vocabulary a post needs is small enough to
 * state exactly. The parser below is a string tokenizer, so it behaves the same
 * in both places and pulls in no dependency.
 *
 * The approach is allowlist-only and fails closed: a tag not named here is
 * unwrapped (its text survives, its markup does not), and a tag in
 * DROP_CONTENT is deleted along with everything inside it. Attributes work the
 * same way: only the ones named per-tag survive, so there is no way for an
 * event handler, inline style, or javascript: URL to reach the page.
 */

// Tags that render. Anything else is unwrapped, keeping its text.
const ALLOWED: Record<string, string[]> = {
  p: [], br: [], hr: [],
  strong: [], b: [], em: [], i: [], u: [], s: [], strike: [], del: [],
  h2: [], h3: [], h4: [],
  ul: [], ol: [], li: [],
  blockquote: [], figure: [], figcaption: [],
  a: ['href'],
  img: ['src', 'alt'],
};

// Void elements: they never get a closing tag and must not open a stack frame.
const VOID = new Set(['br', 'hr', 'img']);

// Tags whose contents are thrown away too, not unwrapped. Unwrapping a
// <script> would dump its source into the page as visible text; worse, a
// <style> or <title> could smuggle markup that re-parses.
const DROP_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'template',
  'noscript', 'title', 'head', 'svg', 'math', 'form', 'input',
  'button', 'select', 'textarea', 'option', 'link', 'meta', 'base',
]);

/** Only these URL shapes are allowed through, on both href and src. Anything
 *  else (javascript:, data:, vbscript:, a stray protocol-relative //host) is
 *  dropped, which drops the attribute and usually the whole tag with it. */
function safeUrl(raw: string, { allowMailto }: { allowMailto: boolean }): string | null {
  // Strip characters a browser ignores but a naive check does not: control
  // characters and whitespace inside a scheme, as in "java\nscript:alert(1)".
  const url = raw.replace(/[\u0000-\u0020\u007f-\u009f]+/g, '').trim();
  if (!url) return null;

  // Relative and same-origin links: /projects/x, ./x, #anchor. Never //host,
  // which is protocol-relative and therefore off-site.
  if (url.startsWith('//')) return null;
  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('./')) return raw.trim();

  const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (!scheme) return raw.trim();                       // bare path like images/a.png
  if (scheme === 'http' || scheme === 'https') return raw.trim();
  if (allowMailto && (scheme === 'mailto' || scheme === 'tel')) return raw.trim();
  return null;
}

/**
 * Escapes a bare ampersand but leaves an existing entity (&amp; &#39; &nbsp;)
 * alone. This is what makes the whole sanitizer idempotent, which matters more
 * than it sounds: every admin save runs sanitizeHtml over a body that was
 * already sanitized on the previous save, so an escape that stacked would turn
 * an apostrophe into &amp;#39; a little more with each edit.
 */
const escapeAmp = (s: string) =>
  s.replace(/&(?!#\d+;|#x[0-9a-f]+;|[a-z][a-z0-9]*;)/gi, '&amp;');

const escapeAttr = (s: string) =>
  escapeAmp(s)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Escapes bare < > & in text content, entities preserved as above. */
const escapeText = (s: string) =>
  escapeAmp(s)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Pulls name="value" pairs out of a raw tag body. Handles double quotes,
 *  single quotes, and unquoted values. */
function parseAttrs(src: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    out.push([m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '']);
  }
  return out;
}

/**
 * Returns HTML safe to hand to dangerouslySetInnerHTML.
 *
 * Unbalanced input is repaired rather than rejected: stray closing tags are
 * dropped and anything left open at the end is closed, so a half-finished post
 * can never break the page layout around it.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';

  let out = '';
  const stack: string[] = [];
  let i = 0;

  while (i < input.length) {
    const lt = input.indexOf('<', i);
    if (lt === -1) {
      out += escapeText(input.slice(i));
      break;
    }
    if (lt > i) out += escapeText(input.slice(i, lt));

    // Comments and doctypes: skipped entirely. Conditional comments are a
    // known injection vector in old engines, so nothing here survives.
    if (input.startsWith('<!--', lt)) {
      const end = input.indexOf('-->', lt);
      i = end === -1 ? input.length : end + 3;
      continue;
    }
    if (input.startsWith('<!', lt) || input.startsWith('<?', lt)) {
      const end = input.indexOf('>', lt);
      i = end === -1 ? input.length : end + 1;
      continue;
    }

    const gt = input.indexOf('>', lt);
    if (gt === -1) {
      // Truncated final tag: treat the remainder as text, never as markup.
      out += escapeText(input.slice(lt));
      break;
    }

    const rawTag = input.slice(lt + 1, gt);
    const isClose = rawTag.startsWith('/');
    const nameMatch = (isClose ? rawTag.slice(1) : rawTag).match(/^([a-zA-Z][a-zA-Z0-9]*)/);

    // Not a real tag ("a < b"): emit the '<' as text and move on.
    if (!nameMatch) {
      out += escapeText('<');
      i = lt + 1;
      continue;
    }

    const name = nameMatch[1].toLowerCase();
    i = gt + 1;

    if (DROP_CONTENT.has(name)) {
      if (!isClose) {
        // Skip to the matching close tag, or to the end if there isn't one.
        const closeRe = new RegExp(`</\\s*${name}\\s*>`, 'i');
        const rest = input.slice(i);
        const m = rest.match(closeRe);
        i = m?.index === undefined ? input.length : i + m.index + m[0].length;
      }
      continue;
    }

    if (isClose) {
      if (!ALLOWED[name] || VOID.has(name)) continue;   // unwrapped or void: nothing to close
      const at = stack.lastIndexOf(name);
      if (at === -1) continue;                          // stray close tag
      // Close anything opened inside it, so <b><i></b> can't leak an open <i>.
      for (let k = stack.length - 1; k >= at; k--) out += `</${stack[k]}>`;
      stack.length = at;
      continue;
    }

    if (!ALLOWED[name]) continue;                       // unwrap: keep children, drop the tag

    // Rebuild the tag from allowed attributes only.
    const allowedAttrs = ALLOWED[name];
    const attrs = parseAttrs(rawTag.slice(nameMatch[0].length));
    let rendered = '';
    let href: string | null = null;
    let src: string | null = null;
    let alt = '';

    for (const [key, value] of attrs) {
      if (!allowedAttrs.includes(key)) continue;
      if (key === 'href') href = safeUrl(value, { allowMailto: true });
      else if (key === 'src') src = safeUrl(value, { allowMailto: false });
      else if (key === 'alt') alt = value;
    }

    if (name === 'a') {
      // A link whose destination didn't survive becomes plain text rather than
      // a dead <a>, so nothing looks clickable that isn't.
      if (!href) continue;
      const external = /^https?:/i.test(href.trim());
      rendered = external
        ? `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer nofollow">`
        : `<a href="${escapeAttr(href)}">`;
    } else if (name === 'img') {
      if (!src) continue;
      // alt is always emitted. Empty means decorative, which is a real answer;
      // a missing alt attribute is not.
      rendered = `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy" />`;
    } else {
      rendered = VOID.has(name) ? `<${name} />` : `<${name}>`;
    }

    out += rendered;
    if (!VOID.has(name)) stack.push(name);

    // Self-closing form on a non-void tag (<p/>): balance it immediately.
    if (rawTag.endsWith('/') && !VOID.has(name)) {
      out += `</${name}>`;
      stack.pop();
    }
  }

  for (let k = stack.length - 1; k >= 0; k--) out += `</${stack[k]}>`;
  return out;
}

/** Plain text from HTML, for excerpts, card summaries and page descriptions. */
export function htmlToText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|figcaption)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when a post body has no real content, so the page can skip the whole
 *  section instead of rendering an empty box. */
export function isBlankHtml(input: string | null | undefined): boolean {
  if (!input) return true;
  if (/<img\b/i.test(input)) return false;   // an image alone is content
  return htmlToText(input).length === 0;
}
