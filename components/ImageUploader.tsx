// components/ImageUploader.tsx
// WHAT: Reusable image upload component with ImgBB integration
// WHY: Standardized image upload UI for manual edit fields, content library, etc.
// HOW: File picker → ImgBB upload → display with replace/delete options

'use client';

import { useState, useRef } from 'react';
import MaterialIcon from '@/components/MaterialIcon';

interface ImageUploaderProps {
  value?: string;              // Current image URL (if any)
  onChange: (url: string | null) => void; // Callback when image changes
  label?: string;              // Optional label text
  disabled?: boolean;          // Disable upload controls
  maxSizeMB?: number;         // Max file size in MB (default: 5)
  aspectRatio?: string;       // Optional aspect ratio hint (e.g., "16:9", "1:1")
}

export default function ImageUploader({
  value,
  onChange,
  label,
  disabled = false,
  maxSizeMB = 5,
  aspectRatio
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WHAT: Handle file selection and upload
  // WHY: Validate file, upload to ImgBB, return URL
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // WHAT: Validate file type
    // WHY: Only accept image files
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // WHAT: Validate file size
    // WHY: Prevent large uploads that slow down page
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    try {
      setUploading(true);

      // WHAT: Upload to ImgBB via API
      // WHY: Centralized upload endpoint with error handling
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // WHAT: Call onChange with new URL
      // WHY: Parent component updates state
      onChange(data.url);
      console.log('✅ Image uploaded:', data.url);

    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // WHAT: Handle image deletion
  // WHY: Remove image from field
  const handleDelete = () => {
    if (confirm('Delete this image?')) {
      onChange(null);
    }
  };

  // WHAT: Trigger file picker
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-uploader">
      {label && <label className="form-label-block">{label}</label>}
      
      <div className="image-uploader-container" style={{ 
        border: '2px dashed var(--mm-gray-300)', 
        borderRadius: 'var(--mm-radius-lg)',
        padding: 'var(--mm-space-4)',
        backgroundColor: 'var(--mm-gray-50)',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--mm-space-3)'
      }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          style={{ display: 'none' }}
        />

        {/* Current Image Display */}
        {value && !uploading && (
          <div style={{ 
            width: '100%', 
            maxWidth: '400px',
            position: 'relative'
          }}>
            <img 
              src={value} 
              alt="Uploaded" 
              style={{ 
                width: '100%', 
                height: 'auto',
                borderRadius: 'var(--mm-radius-md)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }} 
            />
            {aspectRatio && (
              <div className="badge badge-secondary" style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white'
              }}>
                {aspectRatio}
              </div>
            )}
          </div>
        )}

        {/* Upload/Loading State */}
        {uploading && (
          <div style={{ textAlign: 'center' }}>
            <div className="text-4xl mb-2">📤</div>
            <div className="text-gray-600">Uploading...</div>
          </div>
        )}

        {/* No Image State */}
        {!value && !uploading && (
          <div style={{ textAlign: 'center' }}>
            <div className="text-4xl mb-2">🖼️</div>
            <div className="text-gray-600 mb-2">No image uploaded</div>
            {aspectRatio && (
              <div className="text-sm text-gray-500">Recommended: {aspectRatio}</div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-error text-sm" style={{ 
            padding: 'var(--mm-space-2)',
            backgroundColor: 'var(--mm-red-50)',
            borderRadius: 'var(--mm-radius-md)',
            width: '100%'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--mm-space-2)',
          marginTop: 'var(--mm-space-2)'
        }}>
          <button
            className="btn btn-small btn-primary"
            onClick={handleUploadClick}
            disabled={disabled || uploading}
          >
            <MaterialIcon name={value ? "sync" : "upload"} variant="outlined" style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
            {value ? 'Replace' : 'Upload'}
          </button>
          
          {value && !disabled && (
            <button
              className="btn btn-small btn-danger"
              onClick={handleDelete}
              disabled={uploading}
            >
              <MaterialIcon name="delete" variant="outlined" style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
              Delete
            </button>
          )}
        </div>

        {/* Helper Text */}
        <div className="text-xs text-gray-500" style={{ textAlign: 'center' }}>
          Max size: {maxSizeMB}MB • Formats: JPG, PNG, GIF, WebP
        </div>
      </div>
    </div>
  );
}
