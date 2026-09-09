'use client';

import Link from 'next/link';
import PolicyPage, { PolicySection, POLICY_TEXT } from '@/components/PolicyPage';

const p: React.CSSProperties = { color: POLICY_TEXT, lineHeight: 1.7, marginBottom: '0.875rem' };
const ul: React.CSSProperties = { color: POLICY_TEXT, lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '0.875rem' };

export default function AccessPage() {
  return (
    <PolicyPage
      title="Access Statement"
      path="access"
      updated="September 2026"
      lede="What this site does for access, and what it does not do yet. A site about accessibility does not get to be vague about its own."
    >
      <PolicySection id="standard" heading="What we are aiming at">
        <p style={p}>We build to WCAG 2.1 AA, the same standard we would hold a client to. We test with a keyboard and with a screen reader as we go, rather than checking at the end and hoping.</p>
      </PolicySection>

      <PolicySection id="in-place" heading="What is in place today">
        <ul style={ul}>
          <li>Everything works from a keyboard, and the thing you are focused on is always visibly marked with a yellow ring.</li>
          <li>A skip link at the top of every page jumps you past the navigation.</li>
          <li>Real headings, landmarks, and lists underneath the retro decoration, so a screen reader can move around by structure.</li>
          <li>Form errors are read out when they happen, and they say what to do rather than just going red.</li>
          <li>Things that change on their own, like a save finishing, are announced too.</li>
          <li>Buttons and links are at least 44 by 44 pixels, so they can be hit without precision aim.</li>
          <li>Colour combinations are checked for contrast, and colour is never the only way something is signalled.</li>
          <li>Animations, including the retro boot sequences, are skipped for anyone whose device asks for reduced motion.</li>
          <li>Every photo needs a description before it can be added. No exceptions.</li>
        </ul>
      </PolicySection>

      <PolicySection id="retro" heading="About the retro look">
        <p style={p}>The site looks like a desktop from about 1998, with windows, a Start menu, and pixel type. That is decoration sitting on top of ordinary web pages. Underneath, the buttons are buttons, the links are links, and the headings are headings, so assistive technology reads it as a normal site rather than a picture of one.</p>
        <p style={p}>If the theme ever gets in your way, tell us. The joke is not more important than you being able to use the site.</p>
      </PolicySection>

      <PolicySection id="video" heading="Video and links to other places">
        <p style={p}>The Cinema, the Library, and the channels point at work hosted elsewhere. We note captions and audio description where we know about them, and we favour work that has both. We cannot control the quality of somebody else&apos;s captions, and an automatic caption track is not a caption track. If we have flagged something wrongly, please tell us and we will fix the entry.</p>
      </PolicySection>

      <PolicySection id="gaps" heading="What is not finished">
        <p style={p}>Listing this is part of the point. These are the things we know about.</p>
        <ul style={ul}>
          <li>Some gallery photos added before descriptions were required still have none. They are being written.</li>
          <li>Some of the retro type is small, and a few pixel-styled areas are harder to read than the rest of the site.</li>
          <li>There is no plain, non-retro view of the desktop yet. It is on the list.</li>
          <li>We have tested with some screen readers and browsers, not all of them.</li>
          <li>The site has not had an independent audit by disabled testers. That is the next real step, and it matters more than anything above.</li>
        </ul>
      </PolicySection>

      <PolicySection id="tell-us" heading="Tell us about a barrier">
        <p style={p}>
          If something here stopped you, we want to know, even if you are not sure it is our fault. Use{' '}
          <Link href="/contact?reason=barrier" style={{ color: '#0d5c4a' }}>the contact form</Link>, which asks what page you were on, what you were trying to do, and what you browse with. All three are optional, so send it even if you can only answer one. You can email contact@artisticaccessibility.com instead if that is easier.
        </p>
        <p style={p}>Every message gets a reply from a person, and a barrier goes to the front of the queue ahead of new features.</p>
      </PolicySection>
    </PolicyPage>
  );
}
