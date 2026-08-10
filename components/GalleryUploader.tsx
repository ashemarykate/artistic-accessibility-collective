'use client';

/**
 * GalleryUploader — multi-photo upload to Supabase Storage
 *
 * Usage:
 *   <GalleryUploader
 *     userId={profile.user_id}
 *     galleryPaths={profile.gallery_photos ?? []}
 *     displayName={displayName}
 *     onSaved={(newPaths) => { /* update profile.gallery_photos in DB *\/ }}
 *   />
 *
 * Storage bucket:  profile-photos  (same bucket PhotoUploader uses for the avatar)
 * File path:       {userId}/gallery/{uuid}.{ext}
 * Unlike PhotoUploader, there's no circular crop — the original image
 * uploads as-is, and up to MAX_PHOTOS can be added.
 */

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_PHOTOS = 8;

interface GalleryUploaderProps {
  /** Supabase auth user ID — used as the storage folder */
  userId: string;
  /** Current gallery_photos stored in the profiles row (public URLs) */
  galleryPaths: string[];
  /** Name for alt text */
  displayName: string;
  /** Called with the new full list of public URLs after a successful add/remove */
  onSaved: (newPaths: string[]) => void;
}

export default function GalleryUploader({ userId, galleryPaths, displayName, onSaved }: GalleryUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);

  const remainingSlots = MAX_PHOTOS - galleryPaths.length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    const toUpload = files.slice(0, remainingSlots);
    setUploadError('');
    setUploading(true);

    try {
      const newUrls: string[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith('image/')) {
          setUploadError('Please select image files (JPG, PNG, etc.).');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setUploadError('Each image must be under 10 MB.');
          continue;
        }
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${userId}/gallery/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('profile-photos').upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path);
        if (pub?.publicUrl) newUrls.push(pub.publicUrl);
      }

      if (newUrls.length > 0) {
        const updated = [...galleryPaths, ...newUrls];
        await supabase.from('profiles').update({ gallery_photos: updated }).eq('user_id', userId);
        onSaved(updated);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string) => {
    setRemovingUrl(url);
    try {
      const updated = galleryPaths.filter((u) => u !== url);
      const { error } = await supabase.from('profiles').update({ gallery_photos: updated }).eq('user_id', userId);
      if (error) throw error;
      onSaved(updated);
    } catch (err) {
      console.error('Gallery remove error:', err);
      setUploadError('Could not remove that photo. Please try again.');
    } finally {
      setRemovingUrl(null);
    }
  };

  return (
    <div>
      {galleryPaths.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '0.625rem', marginBottom: '0.875rem' }}>
          {galleryPaths.map((url, i) => (
            <div key={url} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gallery photo ${i + 1} for ${displayName}`}
                style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '4px', border: '2px solid var(--aac-blue-light)' }}
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={removingUrl === url}
                aria-label={`Remove gallery photo ${i + 1}`}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1,
                }}
              >
                {removingUrl === url ? '…' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}

      {remainingSlots > 0 ? (
        <>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-busy={uploading}
          >
            {uploading ? 'Uploading…' : '📷 Add Photos'}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
            JPG or PNG · Max 10 MB each · Up to {MAX_PHOTOS} photos ({galleryPaths.length} of {MAX_PHOTOS} added)
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

      {uploadError && (
        <p role="alert" style={{ fontSize: '0.8rem', color: 'var(--color-error, #cc0000)', marginTop: '0.375rem' }}>
          {uploadError}
        </p>
      )}
    </div>
  );
}
