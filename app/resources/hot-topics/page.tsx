import Link from 'next/link';
import { notFound } from 'next/navigation';
import { visibleTopics } from '@/lib/hot-topics-data';
import TopicBrowser from '@/components/hot-topics/TopicBrowser';
import type { TileData } from '@/components/hot-topics/TopicTile';
import HotTopicsFooter from '@/components/hot-topics/HotTopicsFooter';
import { heatLabel } from '@/components/hot-topics/heat-label';
import { formatDate, plural } from '@/components/hot-topics/format';

// The topic list. A server component: it builds a small list of tiles from the
// topic data (no catalogs involved) and hands it to TopicBrowser for sorting.
//
// Only topics that are open are listed. In production a draft is not open, so if
// nothing is live yet this whole page is a 404 and nothing about it is public.

export default function HotTopicsPage() {
  const topics = visibleTopics();
  if (topics.length === 0) notFound();

  const tiles: TileData[] = topics.map((t, order) => ({
    slug: t.slug,
    title: t.title,
    summary: t.summary,
    heat: t.heat,
    heatLabel: heatLabel(t.heat),
    accent: t.accent,
    badge: t.badge,
    draft: t.status === 'draft',
    reels: t.videos.length,
    picks: t.library.length + t.cinema.length + t.resources.length,
    updated: t.updated,
    order,
  }));

  const latest = topics.map((t) => t.updated).sort()[topics.length - 1];
  const draftCount = topics.filter((t) => t.status === 'draft').length;

  return (
    <main>
      <div className="ht-hero">
        <div className="ht-strip-check ht-strip-check--top ht-deco" aria-hidden="true" />
        <div className="ht-wrap">
          <svg className="ht-pin ht-deco" width="84" height="30" viewBox="0 0 84 30" aria-hidden="true" focusable="false">
            <g fill="none" stroke="#b9bcc6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="15" r="6" />
              <path d="M16 11H66a6 6 0 0 1 0 8H16" />
              <path d="M16 15H62" />
              <path d="M70 8l10 7-10 7" />
            </g>
          </svg>
          <nav className="ht-crumbs" aria-label="Breadcrumb">
            <ol role="list">
              <li>
                <Link href="/resources">Resources</Link>
              </li>
              <li>
                <span aria-current="page">Hot Topics</span>
              </li>
            </ol>
          </nav>
          <p className="ht-kicker">Resources</p>
          <h1 className="ht-display ht-h1">Hot Topics</h1>
          <p className="ht-lede">
            What the field keeps arguing about, with videos, books and films to dig into and a place to say what you
            think.
          </p>
          <div className="ht-hero-meta">
            <p className="ht-meta">
              {plural(topics.length, 'topic')} &middot; updated <time dateTime={latest}>{formatDate(latest)}</time>
            </p>
            {draftCount > 0 && (
              <p className="ht-draftnote">
                Draft preview: topics marked Draft are not on the live site yet.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="ht-studs ht-deco" aria-hidden="true" />

      <TopicBrowser tiles={tiles} />

      <div className="ht-strip-caution ht-deco" aria-hidden="true" />
      <section className="ht-section ht-section--coal" aria-labelledby="ht-suggest-h">
        <div className="ht-wrap">
          <p className="ht-kicker">Got one we missed?</p>
          <h2 id="ht-suggest-h" className="ht-display ht-h2">
            Suggest a hot topic
          </h2>
          <p className="ht-lede">Tell us what people in your corner of the arts keep arguing about.</p>
          <Link className="ht-btn ht-btn--red" href="/contact?reason=suggestion">
            Suggest a topic
          </Link>
        </div>
      </section>

      <HotTopicsFooter />
    </main>
  );
}
