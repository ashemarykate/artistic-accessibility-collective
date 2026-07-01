'use client';

/**
 * PhotoUploader — circle crop + Supabase Storage upload
 *
 * Usage:
 *   <PhotoUploader
 *     userId={profile.user_id}
 *     currentPath={profile.avatar_url ?? null}
 *     displayName={displayName}
 *     onSaved={(newPath) => { /* update profile.avatar_url in DB *\/ }}
 *   />
 *
 * Storage bucket:  profile-photos  (private)
 * File path:       {userId}/avatar.jpg
 * Signed URLs:     1 hour TTL, generated fresh each render
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { supabase } from '@/lib/supabase';

// ── Canvas crop utility ────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = src;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const OUTPUT_SIZE = 400; // always output 400×400 px
  canvas.width  = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0,           0,           OUTPUT_SIZE,      OUTPUT_SIZE,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/jpeg',
      0.9,
    );
  });
}

// ── Initials fallback avatar ───────────────────────────────────────────────────

function InitialsAvatar({ name, size = 96 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--aac-blue)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 'bold',
        flexShrink: 0, userSelect: 'none',
      }}
    >
      {initials || '?'}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PhotoUploaderProps {
  /** Supabase auth user ID — used as the storage folder */
  userId: string;
  /** Current avatar_url stored in the profiles row (storage path, not signed URL) */
  currentPath: string | null;
  /** Name for initials fallback + alt text */
  displayName: string;
  /** Called with the new storage path after a successful upload */
  onSaved: (newPath: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PhotoUploader({ userId, currentPath, displayName, onSaved }: PhotoUploaderProps) {
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const dialogRef     = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [displayUrl,   setDisplayUrl]   = useState<string | null>(null);
  const [imageSrc,     setImageSrc]     = useState<string | null>(null); // data URL of picked file
  const [crop,         setCrop]         = useState({ x: 0, y: 0 });
  const [zoom,         setZoom]         = useState(1);
  const [croppedArea, setCroppedArea]   = useState<Area | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState('');
  const [showCropper,  setShowCropper]  = useState(false);

  // ── Resolve display URL for existing avatar ─────────────────────────────────
  // avatar_url may be a full https:// URL (stored by either upload path) or an
  // old-format bare storage path. Handle both gracefully.
  useEffect(() => {
    if (!currentPath) { setDisplayUrl(null); return; }
    if (currentPath.startsWith('http')) {
      setDisplayUrl(currentPath);
    } else {
      const { data } = supabase.storage.from('profile-photos').getPublicUrl(currentPath);
      setDisplayUrl(data?.publicUrl ?? null);
    }
  }, [currentPath]);

  // ── Focus trap inside crop modal ───────────────────────────────────────────
  useEffect(() => {
    if (!showCropper) return;
    closeButtonRef.current?.focus();

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeCropper(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
   
  }, [showCropper]);

  const closeCropper = () => {
    setShowCropper(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── File picker ────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
      setUploadError('');
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  // ── Crop + upload ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!imageSrc || !croppedArea) return;
    setUploading(true);
    setUploadError('');

    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      const storagePath = `${userId}/avatar.jpg`;

      const { error } = await supabase.storage
        .from('profile-photos')
        .upload(storagePath, blob, {
          contentType: 'image/jpeg',
          upsert: true, // overwrite existing avatar
        });

      if (error) throw error;

      // Get the permanent public URL and store that — consistent with the
      // inline photo uploader on the profile view page.
      const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
      const publicUrl = pub?.publicUrl ?? storagePath;

      // Update avatar_url in the profiles table with the full public URL
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      setDisplayUrl(publicUrl);
      onSaved(publicUrl);
      closeCropper();
    } catch (err) {
      console.error('Photo upload error:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Avatar display + upload button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Avatar circle */}
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={`Profile photo for ${displayName}`}
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid var(--aac-blue-light)' }}
          />
        ) : (
          <InitialsAvatar name={displayName} size={96} />
        )}

        {/* Upload / change button */}
        <div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => { setUploadError(''); fileInputRef.current?.click(); }}
            aria-label={displayUrl ? 'Change profile photo' : 'Upload profile photo'}
          >
            {displayUrl ? '📷 Change Photo' : '📷 Upload Photo'}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
            JPG or PNG · Max 10 MB · You&apos;ll crop it before it saves
          </p>
          {uploadError && !showCropper && (
            <p role="alert" style={{ fontSize: '0.8rem', color: 'var(--color-error, #cc0000)', marginTop: '0.25rem' }}>
              {uploadError}
            </p>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ── Crop modal ── */}
      {showCropper && imageSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Crop your profile photo"
          ref={dialogRef}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', flexDirection: 'column',
            background: 'rgba(0, 0, 0, 0.85)',
          }}
        >
          {/* Dialog header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--aac-blue)',
            color: '#fff',
            flexShrink: 0,
          }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
              Crop Your Photo
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeCropper}
              aria-label="Cancel and close crop tool"
              style={{
                background: 'none', border: '2px solid rgba(255,255,255,0.4)',
                color: '#fff', cursor: 'pointer',
                padding: '4px 10px', borderRadius: '4px', fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
          </div>

          {/* Hint text */}
          <p style={{
            margin: 0, padding: '0.625rem 1.25rem',
            background: 'var(--aac-navy, #0d1e4a)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '0.8rem', flexShrink: 0,
          }}>
            Drag to reposition · Pinch or scroll to zoom · Your photo will be cropped to a circle
          </p>

          {/* Cropper area */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          {/* Zoom slider */}
          <div style={{
            padding: '0.75rem 1.25rem',
            background: 'var(--aac-navy, #0d1e4a)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <label htmlFor="photo-zoom" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              Zoom
            </label>
            <input
              id="photo-zoom"
              type="range"
              min={1} max={3} step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--aac-yellow, #f5d84a)' }}
              aria-label="Zoom level"
            />
          </div>

          {/* Footer actions */}
          <div style={{
            padding: '1rem 1.25rem',
            background: '#fff',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={uploading}
              aria-busy={uploading}
            >
              {uploading
                ? <><span className="spinner" aria-hidden="true" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
                : '✓ Save Photo'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={closeCropper}
              disabled={uploading}
            >
              Cancel
            </button>
            {uploadError && (
              <p role="alert" style={{ color: 'var(--color-error, #cc0000)', fontSize: '0.875rem', margin: 0, flex: 1 }}>
                {uploadError}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
