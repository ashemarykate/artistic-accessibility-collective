'use client';

/**
 * GalleryUploader — multi-photo upload to Supabase Storage
 *
 * Storage bucket:  profile-photos  (same bucket PhotoUploader uses for the avatar)
 * File path:       {userId}/gallery/{uuid}.{ext}
 *
 * EVERY PHOTO NEEDS A DESCRIPTION. Mary Kate's call, September 2026: on a site
 * about accessibility in the arts, a photo that nobody can describe does not go
 * up. So choosing files does not upload them. The files are held here with a
 * local preview, each one gets a required description, and only then are they
 * uploaded and saved. Nothing reaches the bucket that is not already described,
 * so there are no orphaned files either.
 *
 * Descriptions live in `profiles.gallery_photo_alts`, index-aligned with
 * `profiles.gallery_photos` (migration v59). The two arrays are always written
 * together, right here, which is what keeps them lined up. Photos added before
 * v59 have no description yet; they can be described in place using the same
 * field, and until they are, the profile page falls back to the old generated
 * "Gallery photo 2 for Jane".
 */

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_PHOTOS = 8;
const MAX_BYTES = 10 * 1024 * 1024;

type Pending = { file: File; previewUrl: string; alt: string };

/**
 * Saves the two arrays together. If migration v59 has not been run yet the
 * `gallery_photo_alts` column does not exist, and Postgres rejects the whole
 * update; rather than break adding photos on a site that is mid-deploy, we
 * notice that specific failure and save the photos without their descriptions.
 * The descriptions are still required in the form either way, so nothing is
 * lost once the migration lands and the member saves again.
 */
async function saveGallery(userId: string, paths: string[], alts: string[]) {
  const { error } = await supabase
    .from('profiles')
    .update({ gallery_photos: paths, gallery_photo_alts: alts })
    .eq('user_id', userId);
  if (!error) return;
  const missingColumn = error.code === 'PGRST204' || error.code === '42703'
    || /gallery_photo_alts/.test(error.message ?? '');
  if (!missingColumn) throw error;
  console.warn('gallery_photo_alts column not found; run supabase-migration-v59.sql. Saving photos without descriptions for now.');
  const { error: retryError } = await supabase
    .from('profiles')
    .update({ gallery_photos: paths })
    .eq('user_id', userId);
  if (retryError) throw retryError;
}

interface GalleryUploaderProps {
  /** Supabase auth user ID, used as the storage folder */
  userId: string;
  /** Current gallery_photos stored in the profiles row (public URLs) */
  galleryPaths: string[];
  /** Current gallery_photo_alts, index-aligned with galleryPaths */
  galleryAlts: string[];
  /** Name used only as a fallback label for photos added before descriptions
   *  were required. */
  displayName: string;
  /** Called with the new full lists after a successful add, remove, or edit */
  onSaved: (newPaths: string[], newAlts: string[]) => void;
}

export default function GalleryUploader({
  userId, galleryPaths, galleryAlts, displayName, onSaved,
}: GalleryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [status, setStatus] = useState('');
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const firstPendingRef = useRef<HTMLTextAreaElement>(null);

  const altFor = (i: number) => galleryAlts[i] ?? '';
  const remainingSlots = MAX_PHOTOS - galleryPaths.length - pending.length;
  const allDescribed = pending.every((p) => p.alt.trim().length > 0);

  // Release the object URLs when the pending list is dropped.
  useEffect(() => {
    return () => { pending.forEach((p) => URL.revokeObjectURL(p.previewUrl)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;

    setUploadError('');
    const accepted: Pending[] = [];
    for (const file of files.slice(0, remainingSlots)) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please choose image files (JPG, PNG, GIF or WebP).');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setUploadError(`"${file.name}" is larger than 10 MB. Please shrink it and try again.`);
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file), alt: '' });
    }
    if (accepted.length === 0) return;
    setPending((prev) => [...prev, ...accepted]);
    setStatus(
      accepted.length === 1
        ? 'Photo ready. Describe it, then add it to your gallery.'
        : `${accepted.length} photos ready. Describe each one, then add them to your gallery.`,
    );
    // Send focus to the first description box so the next step is obvious.
    setTimeout(() => firstPendingRef.current?.focus(), 60);
  };

  const setPendingAlt = (i: number, alt: string) =>
    setPending((prev) => prev.map((p, n) => (n === i ? { ...p, alt } : p)));

  const dropPending = (i: number) => {
    setPending((prev) => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, n) => n !== i);
    });
    setStatus('Photo discarded.');
  };

  const handleAddAll = async () => {
    if (!allDescribed || pending.length === 0) return;
    setUploadError('');
    setUploading(true);
    try {
      const newUrls: string[] = [];
      const newAlts: string[] = [];
      for (const p of pending) {
        const ext = p.file.name.split('.').pop() || 'jpg';
        const path = `${userId}/gallery/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from('profile-photos')
          .upload(path, p.file, { contentType: p.file.type });
        if (error) throw error;
        const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path);
        if (pub?.publicUrl) {
          newUrls.push(pub.publicUrl);
          newAlts.push(p.alt.trim());
        }
      }

      if (newUrls.length > 0) {
        const updatedPaths = [...galleryPaths, ...newUrls];
        const updatedAlts = [...galleryPaths.map((_, i) => altFor(i)), ...newAlts];
        await saveGallery(userId, updatedPaths, updatedAlts);
        pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
        setPending([]);
        onSaved(updatedPaths, updatedAlts);
        setStatus(newUrls.length === 1 ? 'Photo added to your gallery.' : `${newUrls.length} photos added to your gallery.`);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /** Save an edited description for a photo already in the gallery. */
  const saveExistingAlt = async (i: number, alt: string) => {
    const updatedAlts = galleryPaths.map((_, n) => (n === i ? alt : altFor(n)));
    onSaved(galleryPaths, updatedAlts);
    try {
      await saveGallery(userId, galleryPaths, updatedAlts);
    } catch (err) {
      console.error('Could not save photo description:', err);
      setUploadError('Could not save that description. Please try again.');
    }
  };

  const handleRemove = async (url: string) => {
    setRemovingUrl(url);
    try {
      const i = galleryPaths.indexOf(url);
      const updatedPaths = galleryPaths.filter((u) => u !== url);
      const updatedAlts = galleryPaths.map((_, n) => altFor(n)).filter((_, n) => n !== i);
      await saveGallery(userId, updatedPaths, updatedAlts);
      onSaved(updatedPaths, updatedAlts);
      setStatus('Photo removed.');
    } catch (err) {
      console.error('Gallery remove error:', err);
      setUploadError('Could not remove that photo. Please try again.');
    } finally {
      setRemovingUrl(null);
    }
  };

  const descStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '8px', fontSize: '0.8125rem',
    border: '1px solid var(--color-border, #c8c4bc)', borderRadius: 4,
    fontFamily: 'inherit', background: '#fff', minHeight: 56,
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.6875rem', fontWeight: 600,
    color: 'var(--color-text-muted, #5a5a5a)', marginBottom: 2,
  };

  return (
    <div>
      {/* Photos already in the gallery, each with its description */}
      {galleryPaths.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 0.875rem', padding: 0, display: 'grid', gap: '0.625rem' }}>
          {galleryPaths.map((url, i) => {
            const missing = !altFor(i).trim();
            return (
              <li
                key={url}
                style={{
                  display: 'flex', gap: '0.625rem', padding: '0.5rem', alignItems: 'flex-start',
                  border: `1px solid ${missing ? '#d9a300' : 'var(--color-border, #c8c4bc)'}`,
                  background: missing ? '#fffaf0' : '#fbfaf7',
                  borderRadius: 4, flexWrap: 'wrap',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={altFor(i) || `Gallery photo ${i + 1} for ${displayName}, not yet described`}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--aac-blue-light)', flexShrink: 0 }}
                />
                <div style={{ flex: '1 1 200px', minWidth: 180 }}>
                  <label style={labelStyle} htmlFor={`gal-alt-${i}`}>
                    Photo description {missing && <span style={{ color: '#8a6100' }}>(needed)</span>}
                  </label>
                  <textarea
                    id={`gal-alt-${i}`}
                    rows={2}
                    defaultValue={altFor(i)}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next !== altFor(i)) saveExistingAlt(i, next);
                    }}
                    placeholder="Two people signing to each other in a bright rehearsal room"
                    style={descStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  disabled={removingUrl === url}
                  aria-label={`Remove gallery photo ${i + 1}`}
                  style={{
                    minWidth: 44, minHeight: 44, borderRadius: 4, flexShrink: 0,
                    background: '#fff', color: '#8a1c1c',
                    border: '1px solid var(--color-border, #c8c4bc)', cursor: 'pointer',
                  }}
                >
                  {removingUrl === url ? '…' : <span aria-hidden="true">✕</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Chosen but not yet added: description required before they go up */}
      {pending.length > 0 && (
        <div style={{ border: '2px solid var(--aac-blue)', borderRadius: 4, padding: '0.625rem', marginBottom: '0.875rem', background: '#f7f8ff' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Describe {pending.length === 1 ? 'this photo' : 'these photos'} before adding {pending.length === 1 ? 'it' : 'them'}
          </p>
          <ul style={{ listStyle: 'none', margin: '0 0 0.625rem', padding: 0, display: 'grid', gap: '0.625rem' }}>
            {pending.map((p, i) => (
              <li key={p.previewUrl} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt=""
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--aac-blue-light)', flexShrink: 0 }}
                />
                <div style={{ flex: '1 1 200px', minWidth: 180 }}>
                  <label style={labelStyle} htmlFor={`gal-new-${i}`}>
                    Describe this photo for someone who cannot see it
                  </label>
                  <textarea
                    id={`gal-new-${i}`}
                    ref={i === 0 ? firstPendingRef : undefined}
                    rows={2}
                    value={p.alt}
                    onChange={(e) => setPendingAlt(i, e.target.value)}
                    placeholder="Two people signing to each other in a bright rehearsal room"
                    style={descStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => dropPending(i)}
                  aria-label={`Discard chosen photo ${i + 1}`}
                  style={{
                    minWidth: 44, minHeight: 44, borderRadius: 4, flexShrink: 0,
                    background: '#fff', border: '1px solid var(--color-border, #c8c4bc)', cursor: 'pointer',
                  }}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAddAll}
            disabled={!allDescribed || uploading}
            aria-busy={uploading}
          >
            {uploading ? 'Adding…' : `Add ${pending.length === 1 ? 'photo' : 'photos'} to gallery`}
          </button>
          {!allDescribed && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
              Every photo needs a description before it can be added.
            </p>
          )}
        </div>
      )}

      {remainingSlots > 0 ? (
        <>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            📷 Choose Photos
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
            JPG or PNG · Max 10 MB each · Up to {MAX_PHOTOS} photos ({galleryPaths.length} of {MAX_PHOTOS} added) · Each one needs a description
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
        </>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {MAX_PHOTOS} of {MAX_PHOTOS} photos added.
        </p>
      )}

      <p role="status" aria-live="polite" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
        {status}
      </p>
      {uploadError && (
        <p role="alert" style={{ fontSize: '0.8rem', color: 'var(--color-error, #cc0000)', marginTop: '0.375rem' }}>
          {uploadError}
        </p>
      )}
    </div>
  );
}
