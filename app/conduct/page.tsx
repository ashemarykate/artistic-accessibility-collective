'use client';

import Link from 'next/link';
import PolicyPage, { PolicySection, POLICY_TEXT } from '@/components/PolicyPage';

const p: React.CSSProperties = { color: POLICY_TEXT, lineHeight: 1.7, marginBottom: '0.875rem' };
const ul: React.CSSProperties = { color: POLICY_TEXT, lineHeight: 1.7, paddingLeft: '1.25rem', marginBottom: '0.875rem' };

export default function ConductPage() {
  return (
    <PolicyPage
      title="Code of Conduct"
      path="conduct"
      updated="September 2026"
      lede="This is a working directory for people who do accessibility in the arts. Underneath every rule below sits one idea: disabled people here are colleagues and experts, not subject matter."
    >
      <PolicySection id="who" heading="Who this covers">
        <p style={p}>Everyone with an account, everywhere on the site: your profile, the directory, private messages, endorsements, submitted events and resources, and anything you post in a production area. It covers members, businesses, admins, and Mary Kate.</p>
      </PolicySection>

      <PolicySection id="expected" heading="What we expect of each other">
        <ul style={ul}>
          <li><strong>Describe your photos.</strong> The site asks for a description before a photo goes up, and it means it. Write the one you would want to hear.</li>
          <li><strong>Take access needs at face value.</strong> If someone tells you how they need to be contacted or worked with, that is information, not a negotiation.</li>
          <li><strong>Credit people properly.</strong> Interpreters, captioners, describers, and consultants get named for their work.</li>
          <li><strong>Keep a first message short and professional.</strong> Say who you are and what you are asking about.</li>
          <li><strong>Be accurate about your own credentials.</strong> Say what you actually hold and what you are still working towards.</li>
          <li><strong>Ask before you pass someone on.</strong> A member gave their contact details to this directory, not to everyone you know.</li>
        </ul>
      </PolicySection>

      <PolicySection id="not-ok" heading="What is not okay here">
        <ul style={ul}>
          <li>Harassment, slurs, threats, or sexual attention nobody asked for.</li>
          <li>Ableism in all its shapes, including talking about disabled people as inspiration, speaking on their behalf, or treating access as a favour rather than the work.</li>
          <li>Guessing at, asking after, or telling other people about somebody&apos;s disability. That is theirs to share.</li>
          <li>Posting private messages in public, here or anywhere else.</li>
          <li>Copying the directory in bulk, or mailing members as a list. This directory is for finding a colleague, not for building a marketing database.</li>
          <li>Claiming qualifications, certifications, or experience you do not have.</li>
          <li>Using member profiles to sell things unrelated to this work.</li>
        </ul>
      </PolicySection>

      <PolicySection id="report" heading="If something goes wrong">
        <p style={p}>
          Write to contact@artisticaccessibility.com or use <Link href="/contact" style={{ color: '#0d5c4a' }}>the contact form</Link>. Tell us what happened and roughly when, and send screenshots if you have them. You can report something that happened to you or something you watched happen to somebody else.
        </p>
        <p style={p}>Mary Kate reads every report herself. She may come back with questions. If the report is about private messages, she may need to read that conversation to work out what happened, and she will tell you if she does.</p>
      </PolicySection>

      <PolicySection id="outcomes" heading="What can happen next">
        <ul style={ul}>
          <li>A private conversation, when something looks like a misunderstanding.</li>
          <li>A warning, written down, so there is a record if it happens again.</li>
          <li>Removal from the public directory while things are sorted out.</li>
          <li>An account removed from the Collective.</li>
        </ul>
        <p style={p}>Anything involving somebody&apos;s safety can skip straight to the last one. Nobody gets penalised for reporting something in good faith, even if we look into it and decide no rule was broken.</p>
      </PolicySection>
    </PolicyPage>
  );
}
