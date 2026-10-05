/**
 * The heat meter: five boxes plus the words, for example "4 of 5, spicy".
 * Heat says how split the field is, not who is right. The boxes are decoration
 * (filled or outlined, so they never rely on color) and the words carry the meaning.
 *
 * The words arrive as a prop (see heat-label.ts, which the server pages call).
 * That keeps lib/hot-topics-data.ts, which holds every topic's text, out of the
 * browser bundle: no client component here imports it.
 *
 * No hooks and no browser APIs, so it works in server and client components.
 */
export default function HeatMeter({ heat, label, id }: { heat: number; label: string; id?: string }) {
  return (
    <p className="ht-heat" id={id}>
      <span className="ht-heat-label">Heat</span>{' '}
      <span className="ht-heat-segs" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <i key={n} className={n <= heat ? 'ht-on' : undefined} />
        ))}
      </span>{' '}
      <span className="ht-heat-text">{label}</span>
    </p>
  );
}
