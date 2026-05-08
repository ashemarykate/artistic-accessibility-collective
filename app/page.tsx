export default function Home() {
  return (
    <main
      style={{ background: 'var(--aac-blue)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}
    >
      {/* Visible heading for screen readers — the image carries the visual heading */}
      <h1 className="sr-only">Artistic Accessibility Collective — together, together</h1>

      <figure style={{ margin: 0, maxWidth: '900px', width: '100%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/landing.png"
          alt="Artistic Accessibility Collective"
          aria-describedby="landing-description"
          style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
        />
        <figcaption id="landing-description" className="sr-only">
          A hand-illustrated landing page on a deep blue background. The
          organization name, Artistic Accessibility Collective, is set across
          three lines in bold, chunky, hand-lettered white block letters with
          a soft drop shadow. Six rounded white speech bubbles with black
          outlines surround the name, each containing a word or phrase in
          cursive blue handwriting describing what the Collective does:
          training and staffing, art, resources, education, join us, and
          consulting. Beneath the name, a flowing white handwritten tagline
          reads, together, together. At the bottom, the contact email is
          displayed in spaced white capital letters: contact at
          artisticaccessibility dot com.
        </figcaption>
      </figure>

      {/* Real, focusable contact link — visually hidden because the email is shown in the image,
          but keyboard and screen reader users get an actual link they can activate. */}
      <a href="mailto:contact@artisticaccessibility.com" className="sr-only">
        Email us at contact@artisticaccessibility.com
      </a>
    </main>
  );
}
