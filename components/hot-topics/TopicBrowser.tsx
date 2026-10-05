'use client';

import { useMemo, useState } from 'react';
import LookSwitch from './LookSwitch';
import TopicTile, { type TileData } from './TopicTile';
import { HEAT_EXPLAINER } from './format';

type SortKey = 'heat' | 'newest' | 'title';

const SORTS: { key: SortKey; label: string; announce: string }[] = [
  { key: 'heat', label: 'Hottest', announce: 'Sorted hottest first.' },
  { key: 'newest', label: 'Newest', announce: 'Sorted newest first.' },
  { key: 'title', label: 'A to Z', announce: 'Sorted A to Z.' },
];

/** Alphabetical key: lower case, with a leading A, An or The ignored. */
function titleKey(t: TileData): string {
  return t.title.toLowerCase().replace(/^(a|an|the)\s+/, '');
}

// Plain comparisons, not localeCompare, so the server and the browser can never
// order two titles differently. Ties fall back to the order in the data file.
// Newest means updated most recently, then added most recently (later in the
// data file), so a topic appended to the end of the file counts as newest.
function sortTiles(tiles: TileData[], key: SortKey): TileData[] {
  const out = [...tiles];
  out.sort((a, b) => {
    if (key === 'title') {
      const ka = titleKey(a);
      const kb = titleKey(b);
      if (ka !== kb) return ka < kb ? -1 : 1;
      return a.order - b.order;
    }
    if (key === 'newest') {
      if (a.updated !== b.updated) return a.updated < b.updated ? 1 : -1;
      return b.order - a.order;
    }
    if (a.heat !== b.heat) return b.heat - a.heat;
    return a.order - b.order;
  });
  return out;
}

/**
 * The controls bar (Sort and Look) and the grid of topic tiles. Sorting happens
 * in the browser on the few tiles the server already sent. The first render is
 * Hottest, the same on the server and in the browser.
 */
export default function TopicBrowser({ tiles }: { tiles: TileData[] }) {
  const [sort, setSort] = useState<SortKey>('heat');
  const [announcement, setAnnouncement] = useState('');
  const sorted = useMemo(() => sortTiles(tiles, sort), [tiles, sort]);

  return (
    <>
      <div className="ht-bar">
        <div className="ht-wrap">
          <div className="ht-seg" role="group" aria-label="Sort topics">
            <span className="ht-seg-label" aria-hidden="true">
              Sort
            </span>
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                className="ht-pill"
                aria-pressed={sort === s.key}
                onClick={() => {
                  setSort(s.key);
                  setAnnouncement(s.announce);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <LookSwitch />
        </div>
      </div>
      <p className="ht-sr" role="status">
        {announcement}
      </p>

      <section className="ht-section" aria-labelledby="ht-list-h">
        <div className="ht-wrap">
          <h2 id="ht-list-h" className="ht-sr">
            All hot topics
          </h2>
          <p className="ht-meta ht-list-note">{HEAT_EXPLAINER}</p>
          <ul className="ht-tiles" role="list">
            {sorted.map((tile) => (
              <TopicTile key={tile.slug} tile={tile} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
