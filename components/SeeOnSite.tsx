/**
 * The little link every Backstage panel carries to the public version of the
 * thing it edits. The 2006 site is one page with screens inside it, so the
 * link carries a hash the page reads on load and opens that screen directly.
 */
export default function SeeOnSite({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block', fontSize: '0.8rem', color: '#5a6b8c',
        textDecoration: 'none', marginLeft: 'auto', padding: '0.35rem 0',
      }}
    >
      see it on the site: <span style={{ textDecoration: 'underline' }}>{label}</span> ›
    </a>
  );
}
