'use client';

/**
 * ProductionPhotoUploader — photo picker for Admin -> Productions
 *
 * Storage bucket:  production-photos  (public; created by hand in the Supabase
 *                  dashboard, policies in supabase-migration-v38.sql section 9)
 * File path:       {productionId}/{uuid}.{ext}
 *
 * Different from GalleryUploader in two ways that matter:
 *
 *  1. Alt text is captured here rather than generated. A member's gallery can
 *     fall back to "Gallery photo 2 for Jane"; a production photo is editorial
 *     content on our own site, so it gets described properly. The uploader
 *     nags about a missing description and lets you mark one decorative on
 *     purpose, which is a real answer for a background texture.
 *
 *  2. Nothing is written to the database here. The parent form holds the photo
 *     list in state and saves it with the rest of the production, so adding a
 *     photo and then hitting Cancel doesn't half-save a change.
 */

import { useRef, useState } from 'react';
import { supabase, type ProductionPhoto } from '@/lib/supabase';

const BUCKET = 'production-photos';
const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  /** Folder name in the bucket. Pass 'new' before the row has an id. */
  productionId: string;
  photos: ProductionPhoto[];
  onChange: (photos: ProductionPhoto[]) => void;
  max?: number;
  /** Single-photo mode for the hero image: hides captions and the counter. */
  single?: boolean;
  label?: string;
}

export default function ProductionPhotoUploader({
  productionId, photos, onChange, max = 12, single = false, label = 'Photos',
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]   = useState('');
  const [status, setStatus] = useState('');

  const cap = single ? 1 : max;
  const remaining = cap - photos.length;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileRef.current) fileRef.current.value = '';
    if (files.length === 0) return;

    setError(''); setStatus(''); setUploading(true);
    const added: ProductionPhoto[] = [];

    try {
      for (const file of files.slice(0, remaining)) {
        if (!file.type.startsWith('image/')) {
          setError('Please choose image files (JPG, PNG, GIF or WebP).');
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`"${file.name}" is larger than 10 MB. Please shrink it and try again.`);
          continue;
        }
        const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${productionId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (pub?.publicUrl) added.push({ url: pub.publicUrl, alt: '', caption: '' });
      }

      if (added.length > 0) {
        onChange(single ? added.slice(0, 1) : [...photos, ...added]);
        setStatus(
          added.length === 1
            ? 'Photo added. Please describe it below.'
            : `${added.length} photos added. Please describe each one below.`,
        );
      }
    } catch (err) {
      // The most likely cause by far, so it leads.
      console.error('Production photo upload failed:', err);
      setError(
        'Upload failed. If this is the first time, check that a public bucket named "production-photos" exists in Supabase under Storage.',
      );
    } finally {
      setUploading(false);
    }
  };

  const update = (i: number, patch: Partial<ProductionPhoto>) => {
    onChange(photos.map((p, n) => (n === i ? { ...p, ...patch } : p)));
  };

  /** Removes the photo from the production but leaves the file in the bucket.
   *  Deliberate: an accidental removal is one Cancel away from being restored,
   *  and an orphaned image costs nothing. */
  const remove = (i: number) => {
    const removed = photos[i];
    onChange(photos.filter((_, n) => n !== i));
    setStatus(`Photo removed${removed.alt ? `: ${removed.alt}` : ''}.`);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setStatus(`Photo moved to position ${j + 1} of ${next.length}.`);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px', fontSize: '0.8125rem', minHeight: 40,
    border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4,
    fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
  };
  const smallLabel: React.CSSProperties = {
    display: 'block', fontSize: '0.6875rem', fontWeight: 600,
    color: 'var(--color-text-muted, #5a5a5a)', marginBottom: 2,
  };

  return (
    <div>
      {photos.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 0.75rem', padding: 0, display: 'grid', gap: '0.75rem' }}>
          {photos.map((photo, i) => {
            const missingAlt = !photo.alt.trim();
            return (
              <li
                key={photo.url}
                style={{
                  display: 'flex', gap: '0.75rem', padding: '0.625rem',
                  border: `1px solid ${missingAlt ? '#d9a300' : 'var(--color-border, #c8c4bc)'}`,
                  borderRadius: 4, background: missingAlt ? '#fffaf0' : '#fbfaf7',
                  alignItems: 'flex-start', flexWrap: 'wrap',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt || 'Uploaded photo, not yet described'}
                  style={{
                    width: 88, height: 88, objectFit: 'cover', borderRadius: 4,
                    border: '1px solid var(--color-border, #c8c4bc)', flexShrink: 0,
                  }}
                />
                <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={smallLabel} htmlFor={`alt-${productionId}-${i}`}>
                      Photo description {missingAlt && <span style={{ color: '#8a6100' }}>(needed)</span>}
                    </label>
                    <input
                      id={`alt-${productionId}-${i}`}
                      type="text"
                      value={photo.alt}
                      onChange={(e) => update(i, { alt: e.target.value })}
                      placeholder="Three dancers mid-lift on a bare stage"
                      style={inputStyle}
                    />
                  </div>
                  {!single && (
                    <div>
                      <label style={smallLabel} htmlFor={`cap-${productionId}-${i}`}>
                        Caption shown on the page (optional)
                      </label>
                      <input
                        id={`cap-${productionId}-${i}`}
                        type="text"
                        value={photo.caption ?? ''}
                        onChange={(e) => update(i, { caption: e.target.value })}
                        placeholder="Rehearsal, June 2026"
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {!single && photos.length > 1 && (
                    <>
                      <button
                        type="button" onClick={() => move(i, -1)} disabled={i === 0}
                        aria-label={`Move photo ${i + 1} earlier`}
                        style={{ minWidth: 44, minHeight: 44, border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4, background: '#fff', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}
                      ><span aria-hidden="true">↑</span></button>
                      <button
                        type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1}
                        aria-label={`Move photo ${i + 1} later`}
                        style={{ minWidth: 44, minHeight: 44, border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4, background: '#fff', cursor: i === photos.length - 1 ? 'default' : 'pointer', opacity: i === photos.length - 1 ? 0.4 : 1 }}
                      ><span aria-hidden="true">↓</span></button>
                    </>
                  )}
                  <button
                    type="button" onClick={() => remove(i)}
                    aria-label={`Remove photo ${i + 1}${photo.alt ? `, ${photo.alt}` : ''}`}
                    style={{ minWidth: 44, minHeight: 44, border: '1px solid #c88', borderRadius: 4, background: '#fff', color: '#a33', cursor: 'pointer', fontWeight: 700 }}
                  ><span aria-hidden="true">✕</span></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {remaining > 0 ? (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-busy={uploading}
            style={{
              minHeight: 44, padding: '0 16px', borderRadius: 4, cursor: 'pointer',
              border: '1px solid var(--aac-blue)', background: '#fff',
              color: 'var(--aac-blue)', fontWeight: 600, fontFamily: 'inherit', fontSize: '0.875rem',
            }}
          >
            {uploading ? 'Uploading…' : single ? '📷 Choose photo' : '📷 Add photos'}
          </button>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0.375rem 0 0' }}>
            JPG, PNG, GIF or WebP · up to 10 MB each
            {!single && ` · ${photos.length} of ${cap} added`}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple={!single}
            onChange={handleFiles}
            style={{ display: 'none' }}
            aria-label={`Upload ${label.toLowerCase()}`}
            tabIndex={-1}
          />
        </>
      ) : (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #5a5a5a)', margin: 0 }}>
          {single ? 'Remove the current photo to choose a different one.' : `All ${cap} photo slots are full.`}
        </p>
      )}

      {error && (
        <p role="alert" style={{ fontSize: '0.8125rem', color: '#a33', marginTop: '0.5rem' }}>{error}</p>
      )}
      <p role="status" aria-live="polite" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #5a5a5a)', margin: '0.25rem 0 0', minHeight: 14 }}>
        {status}
      </p>
    </div>
  );
}
