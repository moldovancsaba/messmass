// components/ImageUploadField.tsx
// WHAT: Image upload field for Clicker editor with ImgBB integration
// WHY: Partner report images need upload, preview, replace, delete functionality
// HOW: File picker → ImgBB upload → store URL → display preview

'use client';

import React, { useState, useRef } from 'react';
import { uploadImageToImgbb } from '@/lib/imgbbClientUpload';
import styles from './ImageUploadField.module.css';
import Image from 'next/image';

interface ImageUploadFieldProps {
  label: string;
  value: string; // Image URL from database
  onSave: (url: string) => void;
  disabled?: boolean;
}

export default function ImageUploadField({ label, value, onSave, disabled }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WHAT: Handle file selection and upload to ImgBB
  // WHY: User picks image, we upload it and get URL back
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 32MB for ImgBB)
    if (file.size > 32 * 1024 * 1024) {
      setError('Image must be less than 32MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // WHAT: Upload directly to ImgBB from the browser
      // WHY: Proxying through our own serverless function hit Vercel's
      //      4.5MB request body cap (413) for larger photos
      const data = await uploadImageToImgbb(file);

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // WHAT: Save the ImgBB URL to database
      // WHY: Store permanent URL for display in reports
      const imageUrl = data.url!;
      setPreview(imageUrl);
      onSave(imageUrl);

      console.log('✅ Image uploaded:', imageUrl);
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // WHAT: Delete image (set URL to empty string)
  // WHY: User can remove image from report
  const handleDelete = () => {
    if (confirm('Delete this image?')) {
      setPreview('');
      onSave('');
    }
  };

  // WHAT: Trigger file picker
  // WHY: User clicks button to upload/replace image
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      {preview ? (
        // WHAT: Show preview with replace/delete buttons
        // WHY: User can see current image and manage it
        <div className={styles.previewContainer}>
          <Image src={preview} alt={label} className={styles.preview} width={400} height={300} unoptimized />
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={disabled || uploading}
              className={styles.buttonReplace}
            >
              🔄 Replace
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={disabled || uploading}
              className={styles.buttonDelete}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ) : (
        // WHAT: Show upload button when no image
        // WHY: User can upload initial image
        <div className={styles.uploadArea}>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={disabled || uploading}
            className={styles.buttonUpload}
          >
            {uploading ? '⏳ Uploading...' : '📤 Upload Image'}
          </button>
          <p className={styles.hint}>Max 32MB • JPG, PNG, GIF, WebP</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>❌ {error}</div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        // WHAT: Hide native file input (triggered by custom Upload button)
        // WHY: Standard pattern for custom-styled file upload UIs
        // NOTE: Browser security requires file input to exist in DOM
        // eslint-disable-next-line react/forbid-dom-props
        style={{ display: 'none' }}
      />
    </div>
  );
}
