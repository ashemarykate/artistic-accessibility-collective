import Link from 'next/link';

/** The links back out, at the bottom of both Hot Topics screens. */
export default function HotTopicsFooter({ showAllTopics = false }: { showAllTopics?: boolean }) {
  return (
    <>
      <div className="ht-strip-check ht-strip-check--gap ht-deco" aria-hidden="true" />
      <footer className="ht-foot">
        <div className="ht-wrap">
          <ul className="ht-foot-links" role="list">
            <li>
              <Link href="/resources">Back to Resources</Link>
            </li>
            {showAllTopics && (
              <li>
                <Link href="/resources/hot-topics">All hot topics</Link>
              </li>
            )}
            <li>
              <Link href="/library">Library</Link>
            </li>
            <li>
              <Link href="/cinema">Cinema</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </footer>
    </>
  );
}
