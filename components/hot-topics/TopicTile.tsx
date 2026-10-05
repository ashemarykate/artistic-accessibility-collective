import Link from 'next/link';
// Type-only import: erased at build time, so no topic text reaches the browser through here.
import type { HotTopic } from '@/lib/hot-topics-data';
import HeatMeter from './HeatMeter';
import { plural } from './format';

/** Only what a tile needs. Built on the server, so the catalogs never reach the browser. */
export interface TileData {
  slug: string;
  title: string;
  summary: string;
  heat: HotTopic['heat'];
  /** The heat in words, for example "4 of 5, spicy". Built on the server (heat-label.ts). */
  heatLabel: string;
  accent: HotTopic['accent'];
  badge?: HotTopic['badge'];
  /** True for a topic that is still a draft (only ever visible in preview builds). */
  draft: boolean;
  reels: number;
  picks: number;
  updated: string;
  /** Position in the data file. Used for the number on the tile and to break ties when sorting. */
  order: number;
}

const BADGE_LABEL: Record<NonNullable<HotTopic['badge']>, string> = {
  new: 'New',
  'staff-pick': 'Staff pick',
};

/**
 * One topic, one link. The whole tile is the link, named by its title and
 * described by the sticker, summary, heat words and counts. The "Open this
 * topic" bar is decoration for sighted people (aria-hidden).
 */
export default function TopicTile({ tile }: { tile: TileData }) {
  const p = `ht-t-${tile.slug}`;
  const counts = [
    tile.reels > 0 ? plural(tile.reels, 'reel') : null,
    tile.picks > 0 ? plural(tile.picks, 'shelf pick') : null,
  ]
    .filter(Boolean)
    .join(', ');

  const described = [
    tile.badge ? `${p}-b` : null,
    tile.draft ? `${p}-d` : null,
    `${p}-s`,
    `${p}-h`,
    counts ? `${p}-c` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li>
      <Link
        className={`ht-tile ht-tile--${tile.accent}`}
        href={`/resources/hot-topics/${tile.slug}`}
        aria-labelledby={`${p}-t`}
        aria-describedby={described}
      >
        {tile.badge && (
          <span
            className={`ht-sticker ${tile.badge === 'new' ? 'ht-sticker--new' : 'ht-sticker--pick'}`}
            id={`${p}-b`}
          >
            {BADGE_LABEL[tile.badge]}
          </span>
        )}
        <div className="ht-tile-art">
          <span className="ht-tile-no" aria-hidden="true">
            Topic {String(tile.order + 1).padStart(2, '0')}
          </span>
          <h3 className="ht-display ht-tile-title" id={`${p}-t`}>
            {tile.title}
          </h3>
        </div>
        <div className="ht-tile-info">
          <span className="ht-tile-sum" id={`${p}-s`}>
            {tile.summary}
          </span>
          <HeatMeter heat={tile.heat} label={tile.heatLabel} id={`${p}-h`} />
          {counts && (
            <span className="ht-pricetag" id={`${p}-c`}>
              {counts}
            </span>
          )}
          {tile.draft && (
            <span className="ht-draft" id={`${p}-d`}>
              Draft, not public yet
            </span>
          )}
          <span className="ht-tile-cta" aria-hidden="true">
            Open this topic
            <svg className="ht-arrow" width="18" height="18" viewBox="0 0 18 18" focusable="false">
              <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
            </svg>
          </span>
        </div>
      </Link>
    </li>
  );
}
