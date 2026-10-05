import type { ReactNode } from 'react';
import Link from 'next/link';
// A type-only import, erased at build time, so this file never pulls the
// catalogs (library, cinema, resources) into any bundle.
import type { ShelfRow } from '@/lib/hot-topics-resolve';
import { isHttpUrl } from './format';

const FIRST_ROWS = 3;

const NEW_TAB = <span className="ht-sr"> (opens in new tab)</span>;

function ShelfItem({ row }: { row: ShelfRow }) {
  const creatorYear = [row.creator, row.year !== undefined ? String(row.year) : null].filter(Boolean).join(', ');

  let title: ReactNode;
  if (!row.external) {
    title = (
      <Link className="ht-shelf-link" href={row.href}>
        {row.title}
      </Link>
    );
  } else if (isHttpUrl(row.href)) {
    title = (
      <a className="ht-shelf-link" href={row.href} target="_blank" rel="noopener noreferrer">
        {row.title}
        {NEW_TAB}
      </a>
    );
  } else {
    // A resource whose address is not a web address: show the name, no link.
    title = <span className="ht-shelf-title">{row.title}</span>;
  }

  return (
    <li className="ht-shelf-item">
      {title}
      <p className="ht-shelf-meta">
        <span className="ht-tagchip">{row.kind}</span>
        {creatorYear && <span>{creatorYear}</span>}
        {row.free && <span className="ht-tagchip ht-tagchip--free">Free</span>}
        {/* captioned and described are only shown when the catalog says yes. Unknown shows nothing. */}
        {row.captioned === true && <span className="ht-tagchip">Captioned</span>}
        {row.described === true && <span className="ht-tagchip">Audio described</span>}
      </p>
      <p className="ht-shelf-why">{row.blurb}</p>
    </li>
  );
}

/**
 * One of the three shelves on a topic page (Library, Cinema, Resources). The
 * first three rows show, the rest sit behind a native details element, so the
 * group is never hidden behind a tab.
 */
export default function ShelfGroup({
  id,
  label,
  sub,
  rows,
  moreFrom,
  seeAllHref,
  seeAllLabel,
}: {
  id: string;
  label: string;
  sub: string;
  rows: ShelfRow[];
  /** Finishes "Show 4 more from ...": the Library, the Cinema, Resources. */
  moreFrom: string;
  seeAllHref: string;
  seeAllLabel: string;
}) {
  const first = rows.slice(0, FIRST_ROWS);
  const rest = rows.slice(FIRST_ROWS);

  return (
    <div className="ht-shelf-group" id={id}>
      <h3 className="ht-shelf-tag">
        {label}
        <span className="ht-sr">, </span>
        <small>{sub}</small>
      </h3>
      {rows.length === 0 ? (
        <p className="ht-shelf-empty">Nothing from {moreFrom} on this topic yet.</p>
      ) : (
        <>
          <ul className="ht-shelf-list" role="list">
            {first.map((row) => (
              <ShelfItem key={row.key} row={row} />
            ))}
          </ul>
          {rest.length > 0 && (
            <details className="ht-more">
              <summary>
                Show {rest.length} more from {moreFrom}
              </summary>
              <ul className="ht-shelf-list" role="list">
                {rest.map((row) => (
                  <ShelfItem key={row.key} row={row} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
      <p className="ht-shelf-foot">
        <Link href={seeAllHref}>{seeAllLabel}</Link>
      </p>
    </div>
  );
}
