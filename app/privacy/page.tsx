'use client';

import Link from 'next/link';
import PolicyPage, { PolicySection, POLICY_TEXT, POLICY_MUTED } from '@/components/PolicyPage';

const p: React.CSSProperties = { color: POLICY_TEXT, lineHeight: 1.7, marginBottom: '0.875rem' };
const ul: React.CSSProperties = { color: POLICY_TEXT, lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '0.875rem' };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Your Privacy"
      path="privacy"
      updated="September 2026"
      lede="The short version: we keep what you type into your profile, we show it only to the people you choose, and we do not sell it or follow you around the internet."
    >
      <PolicySection id="collect" heading="What we keep">
        <p style={p}>Everything here is something you gave us on purpose. There is no hidden collection going on in the background.</p>
        <ul style={ul}>
          <li><strong>Your profile.</strong> Your name, pronouns, email address, where you are, what you do, credentials and training, languages, links, a bio, and any photos you add along with their descriptions.</li>
          <li><strong>What you do here.</strong> Endorsements you give, resources you save, events you submit, messages you send to other members, and any feedback you send us.</li>
          <li><strong>What it takes to log you in.</strong> Your email address, so we can send you a login link. If you set a password, our login provider stores it scrambled. We never see it and neither does anyone else.</li>
          <li><strong>Your invite code</strong>, so we know who invited whom.</li>
        </ul>
        <p style={p}>We do not ask for a date of birth, a home address, a phone number you have not offered, or anything about your health or disability. If you choose to write about your own experience in your bio, that is your call and yours to change.</p>
      </PolicySection>

      <PolicySection id="who-sees" heading="Who can see it">
        <ul style={ul}>
          <li><strong>Before your profile is approved:</strong> only Mary Kate and the other admins.</li>
          <li><strong>After it is approved:</strong> other logged-in members can see it in the directory.</li>
          <li><strong>The wider internet:</strong> only if your profile has been marked public. That is off when you join, and it is a deliberate choice, not a default.</li>
          <li><strong>Your email address</strong> stays hidden from other members unless you switch on showing it.</li>
          <li><strong>Private messages</strong> can be read by you and the person you are writing to. There is no way for an admin to read them through the site.</li>
        </ul>
        <p style={p}>One honest caveat, because a privacy page that pretends otherwise is not worth reading. Mary Kate runs the database this site sits on, so in principle she can see anything stored in it, exactly like the owner of any other website. In practice she opens a private message only if somebody reports a problem and reading it is the only way to sort the problem out.</p>
      </PolicySection>

      <PolicySection id="others" heading="Who else is involved">
        <p style={p}>Three companies help run this site. Each one only gets what it needs to do its job.</p>
        <ul style={ul}>
          <li><strong>Supabase</strong> stores the database, handles logins, and holds uploaded photos.</li>
          <li><strong>Vercel</strong> hosts the site itself.</li>
          <li><strong>Resend</strong> delivers the emails we send you, like your login link.</li>
        </ul>
        <p style={p}>That is the whole list. There is no advertising here, no analytics package, no tracking pixels, and no third-party cookies. Staying logged in works by keeping a session in your own browser storage, which never leaves your device except to prove to us that it is you.</p>
      </PolicySection>

      <PolicySection id="your-choices" heading="What you can ask for">
        <ul style={ul}>
          <li><strong>Change anything.</strong> Edit Profile is always open, and changes take effect as soon as you save.</li>
          <li><strong>Come off the public web.</strong> Ask us and we will take your profile out of the public view while keeping your member account.</li>
          <li><strong>Leave entirely.</strong> Ask us and we will delete your profile, your photos, and your messages. There is no self-serve delete button yet, so for now it goes through us and we do it by hand.</li>
          <li><strong>Get a copy.</strong> Ask and we will send you what we hold about you.</li>
        </ul>
        <p style={p}>
          All of these go to <Link href="/contact" style={{ color: '#0d5c4a' }}>the contact form</Link> or straight to contact@artisticaccessibility.com. A real person reads it.
        </p>
      </PolicySection>

      <PolicySection id="changes" heading="If this page changes">
        <p style={p}>This is a working directory and it is still growing, so this page will change as the site does. If something changes that affects who can see your information, we will tell members by email rather than quietly editing this page and hoping nobody notices.</p>
        <p style={{ ...p, color: POLICY_MUTED, fontSize: '0.9375rem' }}>This is a plain-language description of how the site actually works, written to be understood rather than to cover anybody legally.</p>
      </PolicySection>
    </PolicyPage>
  );
}
