import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  DEVICE_TAG_PATTERN,
  HOT_TOPIC_BY_SLUG,
  TAKE_MAX_LENGTH,
  TAKE_NAME_MAX,
  isTopicOpen,
  visibleTopics,
} from '@/lib/hot-topics-data';
// Server only: this pulls in the three big catalogs. It must never be imported
// by a client component.
import { resolveShelves } from '@/lib/hot-topics-resolve';
import HeatMeter from '@/components/hot-topics/HeatMeter';
import { heatLabel } from '@/components/hot-topics/heat-label';
import HotTopicsFooter from '@/components/hot-topics/HotTopicsFooter';
import LookSwitch from '@/components/hot-topics/LookSwitch';
import ReelCard from '@/components/hot-topics/ReelCard';
import ShelfGroup from '@/components/hot-topics/ShelfGroup';
import TakesBox from '@/components/hot-topics/TakesBox';
import { HEAT_EXPLAINER, formatDate } from '@/components/hot-topics/format';

// One page per open topic, built ahead of time. A slug that is not in the list
// is a real 404, and so is a draft in production (isTopicOpen is false there),
// so unread editorial text is never reachable on the live site.
export const dynamicParams = false;

export function generateStaticParams() {
  return visibleTopics().map((t) => ({ slug: t.slug }));
}

const SUGGEST_HREF = '/contact?reason=suggestion';

const ARROW = (
  <svg className="ht-arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path d="M2 9h12M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
  </svg>
);

export default async function HotTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isTopicOpen(slug)) notFound();

  const topic = HOT_TOPIC_BY_SLUG[slug];
  const shelves = resolveShelves(topic);

  const all = visibleTopics();
  const at = all.findIndex((t) => t.slug === slug);
  const prev = at > 0 ? all[at - 1] : null;
  const next = at >= 0 && at < all.length - 1 ? all[at + 1] : null;

  return (
    <main>
      <div className="ht-hero">
        <div className="ht-strip-check ht-strip-check--top ht-deco" aria-hidden="true" />
        <div className="ht-wrap">
          <nav className="ht-crumbs" aria-label="Breadcrumb">
            <ol role="list">
              <li>
                <Link href="/resources">Resources</Link>
              </li>
              <li>
                <Link href="/resources/hot-topics">Hot Topics</Link>
              </li>
              <li>
                <span aria-current="page">{topic.title}</span>
              </li>
            </ol>
          </nav>
          <p className="ht-kicker">Hot topic</p>
          <h1 className="ht-display ht-h1 ht-h1--topic">{topic.title}</h1>
          <div className="ht-hero-meta">
            {topic.badge && (
              <span className={`ht-sticker ht-sticker--inline ${topic.badge === 'new' ? 'ht-sticker--new' : 'ht-sticker--pick'}`}>
                {topic.badge === 'new' ? 'New' : 'Staff pick'}
              </span>
            )}
            <HeatMeter heat={topic.heat} label={heatLabel(topic.heat)} />
            <p className="ht-meta">
              Updated <time dateTime={topic.updated}>{formatDate(topic.updated)}</time>
            </p>
            {topic.status === 'draft' && (
              <p className="ht-draftnote">Draft preview: this topic is not on the live site yet.</p>
            )}
          </div>
          <p className="ht-meta ht-heat-note">{HEAT_EXPLAINER}</p>
          <nav className="ht-jump" aria-label="On this page">
            <ul role="list">
              <li>
                <a href="#hot-take">The hot take</a>
              </li>
              <li>
                <a href="#watch">Watch</a>
              </li>
              <li>
                <a href="#shelves">From our shelves</a>
              </li>
              <li>
                <a href="#think">What do you think?</a>
              </li>
            </ul>
          </nav>
          <div className="ht-hero-tools">
            <LookSwitch />
          </div>
        </div>
      </div>
      <div className="ht-studs ht-deco" aria-hidden="true" />

      {/* 1. THE HOT TAKE */}
      <section className="ht-section" id="hot-take" aria-labelledby="hot-take-h">
        <div className="ht-wrap">
          <div className="ht-panel ht-tape ht-torn ht-on-paper">
            <p className="ht-kicker">The short version</p>
            <h2 id="hot-take-h" className="ht-display ht-h2">
              The hot take
            </h2>
            <p className="ht-lead">{topic.take.lead}</p>
            <div className="ht-camps">
              {topic.take.sides.map((side) => (
                <div className="ht-camp" key={side.label}>
                  <h3>{side.label}</h3>
                  <p>{side.text}</p>
                </div>
              ))}
            </div>
            {topic.take.note && <p className="ht-hint ht-editor-note">Editor note: {topic.take.note}</p>}
          </div>
        </div>
      </section>

      {/* 2. WATCH */}
      <section className="ht-section" id="watch" aria-labelledby="watch-h">
        <div className="ht-wrap">
          <p className="ht-kicker">Short videos</p>
          <h2 id="watch-h" className="ht-display ht-h2">
            Watch
          </h2>
          <p className="ht-note">Videos open on the platform in a new tab, and nothing loads from them until you click.</p>
          {topic.videos.length > 0 ? (
            <>
              <ul className="ht-reels" role="list">
                {topic.videos.map((video) => (
                  <ReelCard key={video.url} video={video} />
                ))}
              </ul>
              <p className="ht-hint" style={{ margin: '16px 0 0' }}>
                Access info is checked by our team. Not checked means we have not watched it for that yet.
              </p>
              <p style={{ margin: 0 }}>
                <Link className="ht-textlink" href={SUGGEST_HREF}>
                  Know a reel that fits? Send it to us
                </Link>
              </p>
            </>
          ) : (
            <div className="ht-watch-empty">
              <p>No videos here yet. Each one is picked by a person, so this fills in slowly.</p>
              <p>
                <Link className="ht-textlink" href={SUGGEST_HREF}>
                  Know a reel that fits? Send it to us
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. FROM OUR SHELVES */}
      <section className="ht-section" id="shelves" aria-labelledby="shelves-h">
        <div className="ht-wrap">
          <div className="ht-panel ht-torn ht-tape ht-on-paper">
            <p className="ht-kicker">Keep going</p>
            <h2 id="shelves-h" className="ht-display ht-h2">
              From our shelves
            </h2>
            <p className="ht-lead" style={{ fontSize: '1.0625rem' }}>
              Picks from the Library, the Cinema and the Resources directory that speak to this topic.
            </p>
            <ShelfGroup
              id="shelf-library"
              label="Library"
              sub="books and reading"
              rows={shelves.library}
              moreFrom="the Library"
              seeAllHref="/library"
              seeAllLabel="See the whole Library"
            />
            <ShelfGroup
              id="shelf-cinema"
              label="Cinema"
              sub="films, talks and podcasts"
              rows={shelves.cinema}
              moreFrom="the Cinema"
              seeAllHref="/cinema"
              seeAllLabel="See the whole Cinema"
            />
            <ShelfGroup
              id="shelf-resources"
              label="Resources"
              sub="links and tools"
              rows={shelves.resources}
              moreFrom="Resources"
              seeAllHref="/resources"
              seeAllLabel="See all Resources"
            />
          </div>
        </div>
      </section>

      {/* 4. WHAT DO YOU THINK */}
      <section className="ht-think" id="think" aria-labelledby="think-h">
        <div className="ht-think-head">
          <div className="ht-wrap">
            <h2 id="think-h" className="ht-display">
              What do you think?
            </h2>
            <span className="ht-bubble ht-deco" aria-hidden="true">
              Your turn
            </span>
          </div>
        </div>
        {/* key: moving between topics must not carry one topic's list or draft into the next. */}
        <TakesBox
          key={topic.slug}
          topic={topic.slug}
          prompt={topic.prompt}
          rules={{ bodyMax: TAKE_MAX_LENGTH, nameMax: TAKE_NAME_MAX, devicePattern: DEVICE_TAG_PATTERN.source }}
        />
      </section>

      {(prev || next) && (
        <div className="ht-wrap">
          <nav className="ht-pager" aria-label="More topics">
            {prev && (
              <Link className="ht-btn ht-btn--ghost ht-pager-link" href={`/resources/hot-topics/${prev.slug}`}>
                <span className="ht-pager-dir">Previous topic</span>
                <span className="ht-pager-title">{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link className="ht-btn ht-btn--red ht-pager-link ht-pager-next" href={`/resources/hot-topics/${next.slug}`}>
                <span className="ht-pager-dir">
                  Next topic {ARROW}
                </span>
                <span className="ht-pager-title">{next.title}</span>
              </Link>
            )}
          </nav>
        </div>
      )}

      <HotTopicsFooter showAllTopics />
    </main>
  );
}
