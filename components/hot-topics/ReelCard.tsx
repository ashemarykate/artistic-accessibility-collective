import type { CaptionStatus, ReelPlatform, Tri, TopicVideo } from '@/lib/hot-topics-data';
import { formatDate, isHttpUrl } from './format';

// Link first. Nothing from Instagram, TikTok, YouTube or Vimeo loads on this
// page: no embed, no thumbnail, no script. The visitor presses a link and the
// platform opens in a new tab. The artwork on the card is our own CSS.

const PLATFORM_NAME: Record<ReelPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
};

/** How a flag is drawn. yes is filled, no is outlined, part is double, unk is dashed. Words always carry it. */
type Shape = 'yes' | 'no' | 'part' | 'unk';

interface Flag {
  label: string;
  value: string;
  shape: Shape;
}

function captionFlag(status: CaptionStatus, platformName: string): Flag {
  switch (status) {
    case 'burned-in':
      return { label: 'Captions', value: 'burned in', shape: 'yes' };
    case 'app-only':
      return { label: 'Captions', value: `${platformName} auto captions in the app only`, shape: 'part' };
    case 'none':
      return { label: 'Captions', value: 'none', shape: 'no' };
    default:
      return { label: 'Captions', value: 'not checked', shape: 'unk' };
  }
}

function triFlag(label: string, value: Tri | 'not-needed'): Flag {
  switch (value) {
    case 'yes':
      return { label, value: 'yes', shape: 'yes' };
    case 'no':
      return { label, value: 'no', shape: 'no' };
    case 'not-needed':
      return { label, value: 'not needed', shape: 'no' };
    default:
      return { label, value: 'not checked', shape: 'unk' };
  }
}

const NEW_TAB = <span className="ht-sr"> (opens in new tab)</span>;

const EXTERNAL_ICON = (
  <svg className="ht-arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
  </svg>
);

/**
 * One reel. Renders a list item, so put it inside a <ul className="ht-reels">.
 * The access flags are words with a visible status, and the status is also
 * drawn as a shape (filled, outlined, double, dashed), so nothing relies on color.
 */
export default function ReelCard({ video }: { video: TopicVideo }) {
  const platformName = PLATFORM_NAME[video.platform];
  const flags: Flag[] = [
    captionFlag(video.captions, platformName),
    triFlag('Audio description', video.audioDescription),
    triFlag('ASL', video.asl),
  ];
  const watchable = isHttpUrl(video.url);
  const creatorLinked = !!video.creatorUrl && isHttpUrl(video.creatorUrl);
  const transcript = video.transcriptUrl && isHttpUrl(video.transcriptUrl) ? video.transcriptUrl : null;

  return (
    <li className="ht-reel">
      <div className="ht-reel-poster ht-deco" aria-hidden="true">
        <span className="ht-play" />
      </div>
      <div className="ht-reel-body">
        <p className="ht-reel-platform">{platformName}</p>
        <h3 className="ht-reel-title">{video.title}</h3>
        <p className="ht-reel-by">
          By{' '}
          {creatorLinked ? (
            <a href={video.creatorUrl} target="_blank" rel="noopener noreferrer">
              {video.creator}
              {NEW_TAB}
            </a>
          ) : (
            video.creator
          )}
        </p>
        <p className="ht-reel-why">{video.why}</p>
        <ul className="ht-chips" role="list" aria-label={`Access features of ${video.title}`}>
          {flags.map((f) => (
            <li key={f.label} className={`ht-chip ht-chip--${f.shape}`}>
              {f.label}: {f.value}
            </li>
          ))}
        </ul>
        {transcript && (
          <p className="ht-reel-meta">
            <a href={transcript} target="_blank" rel="noopener noreferrer">
              Read the transcript
              <span className="ht-sr"> for {video.title} (opens in new tab)</span>
            </a>
          </p>
        )}
        {video.checkedOn && (
          <p className="ht-reel-meta">
            Checked on <time dateTime={video.checkedOn}>{formatDate(video.checkedOn)}</time>
          </p>
        )}
        {watchable && (
          <div className="ht-reel-actions">
            <a className="ht-btn ht-btn--pink" href={video.url} target="_blank" rel="noopener noreferrer">
              Watch on {platformName}
              <span className="ht-sr">, {video.title} (opens in new tab)</span> {EXTERNAL_ICON}
            </a>
          </div>
        )}
      </div>
    </li>
  );
}
