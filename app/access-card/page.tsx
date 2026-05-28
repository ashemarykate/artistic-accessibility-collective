'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { SavedResource } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BrowserChrome from '@/components/BrowserChrome';

// ── Fake barcode decoration ───────────────────────────────────────────────────
function Barcode() {
  const stripes = [2,1,3,1,2,2,1,2,1,3,2,1,1,3,1,2,1,2,3,1,2,1,1,2,3,1,2,1,2,1];
  return (
    <div aria-hidden="true" style={{ display: 'flex', height: 28, gap: 0, overflow: 'hidden', marginTop: 2 }}>
      {stripes.map((w, i) => (
        <div key={i} style={{
          width: w * 3, height: '100%',
          background: i % 2 === 0 ? '#1a1a2e' : '#f7f3e8',
          flexShrink: 0,
        }} />
      ))}
    </div>
  );
}

// ── Catalog number from profile id ───────────────────────────────────────────
function catalogNumber(id: string) {
  return `AC-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

// ── Inline editable field ─────────────────────────────────────────────────────
function EditableField({
  value, onSave, multiline = false, placeholder, label, maxLength,
}: {
  value: string; onSave: (val: string) => Promise<void>;
  multiline?: boolean; placeholder: string; label: string; maxLength?: number;
}) {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(value);
  const [saving, setSaving]     = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const inputRef      = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const buttonRef     = useRef<HTMLButtonElement>(null);
  const wasEditing    = useRef(false);   // tracks whether we need to return focus
  const isCommitting  = useRef(false);   // prevents double-commit from Enter + onBlur

  // Keep draft in sync when parent saves update the value prop
  useEffect(() => { setDraft(value); }, [value]);

  // Focus input when editing starts
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  // Return focus to button when editing ends (keyboard accessibility)
  useEffect(() => {
    if (!editing && wasEditing.current) {
      wasEditing.current = false;
      // Defer so React has finished rendering the button
      requestAnimationFrame(() => buttonRef.current?.focus());
    }
  }, [editing]);

  const commit = async () => {
    if (isCommitting.current) return;
    isCommitting.current = true;

    if (draft === value) {
      wasEditing.current = true;
      setEditing(false);
      isCommitting.current = false;
      return;
    }

    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setSavedMsg('Saved');
    wasEditing.current = true;
    setEditing(false);
    isCommitting.current = false;

    // Clear the saved announcement after it's been read
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const sharedInputStyle: React.CSSProperties = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '0.9rem',
    background: 'rgba(38, 53, 144, 0.06)',
    border: '1px dashed #263590',
    borderRadius: 3,
    padding: '6px 8px',
    width: '100%',
    color: '#1a1a2e',
    boxSizing: 'border-box',
    // Keep the browser's default focus ring — don't override with outline:none
  };

  return (
    <>
      {/* Screen reader save confirmation */}
      <span role="status" aria-live="polite" className="sr-only">{savedMsg}</span>

      {editing ? (
        multiline ? (
          <textarea
            ref={inputRef as any}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setDraft(value); wasEditing.current = true; setEditing(false); isCommitting.current = false; }
            }}
            rows={3}
            maxLength={maxLength}
            aria-label={label}
            style={{ ...sharedInputStyle, resize: 'vertical' }}
          />
        ) : (
          <input
            ref={inputRef as any}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { setDraft(value); wasEditing.current = true; setEditing(false); isCommitting.current = false; }
            }}
            maxLength={maxLength}
            aria-label={label}
            style={sharedInputStyle}
          />
        )
      ) : (
        <button
          ref={buttonRef}
          onClick={() => { isCommitting.current = false; setEditing(true); }}
          aria-label={`${label}: ${value || placeholder}. Activate to edit.`}
          aria-busy={saving}
          style={{
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '0.9rem',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px dashed #a09070',
            borderRadius: 0,
            padding: '4px 0',
            width: '100%',
            textAlign: 'left',
            cursor: 'text',
            color: value ? '#1a1a2e' : '#888',
            display: 'block',
            lineHeight: 1.5,
            opacity: saving ? 0.5 : 1,
            // Let the global :focus-visible rule apply the yellow focus ring
          }}
        >
          {saving ? 'Saving…' : (value || placeholder)}
          {!saving && (
            <span aria-hidden="true" style={{ marginLeft: 6, fontSize: '0.7rem', color: '#263590', opacity: 0.6 }}>✎</span>
          )}
        </button>
      )}
    </>
  );
}

// ── The library card ──────────────────────────────────────────────────────────
// Field labels are aria-hidden because the EditableField buttons carry
// the complete label in their aria-label. Sighted users get visual labels;
// screen reader users get the button's full description.
function LibraryCard({ profile, onSave }: {
  profile: { id: string; full_name: string; bio?: string; created_at: string };
  onSave: (field: 'full_name' | 'bio', value: string) => Promise<void>;
}) {
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      role="region"
      aria-label="Your Access Card"
      style={{
        width: 'min(280px, 100%)',
        background: '#f7f3e8',
        border: '1px solid #c8b99a',
        borderRadius: 6,
        boxShadow: '2px 3px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: '"Courier New", Courier, monospace',
      }}
    >
      {/* Punch hole (decorative) */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 12, right: 12,
        width: 10, height: 10,
        borderRadius: '50%',
        background: '#e8e0d0',
        border: '1px solid #c0b090',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
      }} />

      {/* Header — blue AAC band */}
      <div style={{
        background: 'var(--aac-blue)',
        padding: '10px 28px 10px 14px',
        display: 'flex', alignItems: 'center',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/wordmark-2.svg"
          alt="Artistic Accessibility Collective"
          style={{ height: 22, width: 'auto', opacity: 0.95 }}
        />
      </div>

      {/* Card type + catalog number row */}
      <div aria-hidden="true" style={{ padding: '8px 14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.7rem', letterSpacing: '0.1em', color: '#4a3a28',
          textTransform: 'uppercase', fontWeight: 'bold',
        }}>
          Access Card
        </span>
        <span style={{ fontSize: '0.7rem', color: '#6a5a44', letterSpacing: '0.05em' }}>
          {catalogNumber(profile.id)}
        </span>
      </div>

      {/* Ruled divider */}
      <div aria-hidden="true" style={{ margin: '6px 14px', borderTop: '1px solid #d4c8a8' }} />

      {/* Name / Username field */}
      <div style={{ padding: '0 14px 10px' }}>
        <div aria-hidden="true" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: '#4a3a28', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 }}>
          Name / Username
        </div>
        <EditableField
          value={profile.full_name}
          onSave={(v) => onSave('full_name', v)}
          placeholder="Your name or username"
          label="Name / Username"
          maxLength={80}
        />
      </div>

      {/* Ruled divider */}
      <div aria-hidden="true" style={{ margin: '0 14px 6px', borderTop: '1px solid #d4c8a8' }} />

      {/* Bio field */}
      <div style={{ padding: '0 14px 12px' }}>
        <div aria-hidden="true" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: '#4a3a28', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 }}>
          Bio
        </div>
        <EditableField
          value={profile.bio || ''}
          onSave={(v) => onSave('bio', v)}
          multiline
          placeholder="A sentence or two about you…"
          label="Bio"
          maxLength={300}
        />
      </div>

      {/* Ruled divider */}
      <div aria-hidden="true" style={{ margin: '0 14px 6px', borderTop: '1px solid #d4c8a8' }} />

      {/* Member since */}
      <div style={{ padding: '0 14px 12px' }}>
        <div aria-hidden="true" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: '#4a3a28', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 }}>
          Member Since
        </div>
        <div style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '0.875rem', color: '#1a1a2e' }}>
          {joinDate}
        </div>
      </div>

      {/* Barcode footer */}
      <div style={{ background: '#ede8d8', borderTop: '1px solid #d4c8a8', padding: '8px 14px 10px' }}>
        <Barcode />
        <div aria-hidden="true" style={{ fontSize: '0.6rem', letterSpacing: '0.08em', color: '#6a5a44', textAlign: 'center', marginTop: 4 }}>
          ARTISTIC ACCESSIBILITY COLLECTIVE
        </div>
      </div>

      {/* Edit hint — visible instruction for sighted users */}
      <p style={{
        fontSize: '0.75rem', color: '#6a5a44', textAlign: 'center',
        padding: '7px 14px', background: '#f2ede0', borderTop: '1px solid #e8e0d0',
        margin: 0, lineHeight: 1.4,
      }}>
        Click name or bio to edit
      </p>
    </div>
  );
}

// ── Saved resources list ──────────────────────────────────────────────────────
function SavedResourcesList({ userId }: { userId: string }) {
  const [resources, setResources] = useState<SavedResource[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase
      .from('saved_resources')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .then(({ data }) => {
        setResources(data ?? []);
        setLoading(false);
      });
  }, [userId]);

  const unsave = async (id: string, title: string) => {
    await supabase.from('saved_resources').delete().eq('id', id);
    setResources((r) => r.filter((x) => x.id !== id));
    // Announce removal to screen readers
    const msg = document.createElement('div');
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    msg.className = 'sr-only';
    msg.textContent = `"${title}" removed from saved resources.`;
    document.body.appendChild(msg);
    setTimeout(() => document.body.removeChild(msg), 2000);
  };

  if (loading) return (
    <div role="status" aria-live="polite" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
      Loading your saved resources…
    </div>
  );

  if (resources.length === 0) return (
    <div style={{
      border: '2px dashed #c8d0e8', borderRadius: 8,
      padding: '2rem', textAlign: 'center',
      color: 'var(--color-text-muted)',
    }}>
      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--aac-blue)' }}>
        Your library is empty right now.
      </p>
      <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
        When resources and articles get a save button, they&apos;ll show up here.
      </p>
      <Link href="/resources" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
        Browse Resources
      </Link>
    </div>
  );

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {resources.map((r) => (
        <li key={r.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
          background: 'white', border: '1px solid var(--aac-blue-light)',
          borderRadius: 6, padding: '0.6rem 0.9rem',
        }}>
          <div style={{ minWidth: 0 }}>
            <a
              href={r.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--aac-blue)', fontWeight: 600, textDecoration: 'underline', fontSize: '0.9rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {r.resource_title}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            {r.resource_type && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {r.resource_type}
              </span>
            )}
          </div>
          {/* 44×44px minimum touch target via padding */}
          <button
            onClick={() => unsave(r.id, r.resource_title)}
            aria-label={`Remove "${r.resource_title}" from saved resources`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#888', fontSize: '0.9rem', flexShrink: 0,
              padding: '12px 10px',   /* touch target ≥ 44px */
              borderRadius: 4, lineHeight: 1,
              minWidth: 44, minHeight: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AccessCardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      setUserId(session.user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, bio, created_at, member_type')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!prof) { router.replace('/login?error=profile_not_linked'); return; }
      if (prof.member_type !== 'access_card') { router.replace('/dashboard'); return; }

      setProfile(prof);
      setLoading(false);
    };

    load();
  }, [router]);

  const handleSave = async (field: 'full_name' | 'bio', value: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value || null })
      .eq('id', profile.id);
    if (!error) setProfile((p: any) => ({ ...p, [field]: value }));
  };

  if (loading) {
    return (
      <BrowserChrome variant="ie3" title="Access Card — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/access-card">
        <main className="loading-screen" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <p>Loading your card…</p>
        </main>
      </BrowserChrome>
    );
  }

  return (
    <BrowserChrome variant="ie3" title="Access Card — Artistic Accessibility Collective" url="http://www.artisticaccessibility.com/access-card">
      <main style={{
        background: 'var(--aac-blue)',
        minHeight: '100%',
        padding: '2.5rem 1rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <Link href="/" aria-label="Artistic Accessibility Collective — Home" style={{ marginBottom: '2rem', display: 'inline-block' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/wordmark-2.svg" alt="Artistic Accessibility Collective" style={{ height: '56px', width: 'auto' }} />
        </Link>

        <h1 className="sr-only">Your Access Card</h1>

        <div style={{
          width: '100%', maxWidth: 700,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '2.5rem',
        }}>

          {/* The library card */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <LibraryCard profile={profile} onSave={handleSave} />
          </div>

          {/* Saved resources */}
          <section
            aria-labelledby="saved-heading"
            style={{
              background: 'white', borderRadius: 10,
              padding: '1.5rem', width: '100%',
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
            }}
          >
            <h2 id="saved-heading" style={{
              color: 'var(--aac-blue)', fontSize: '1.1rem', fontWeight: 'bold',
              marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span aria-hidden="true">📚</span> Your Saved Resources
            </h2>
            {userId && <SavedResourcesList userId={userId} />}
          </section>

          {/* Footer nav */}
          <nav aria-label="Account navigation" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/resources" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', textDecoration: 'underline' }}>
              Browse Resources
            </Link>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', textDecoration: 'underline' }}>
              Home
            </Link>
            <button
              onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem',
                textDecoration: 'underline', cursor: 'pointer', padding: 0,
              }}
            >
              Sign out
            </button>
          </nav>

        </div>
      </main>
    </BrowserChrome>
  );
}
