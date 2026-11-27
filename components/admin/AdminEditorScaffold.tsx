'use client';

import React from 'react';
import styles from './AdminEditorScaffold.module.css';

export interface AdminEditorScaffoldProps {
  tabs?: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  disableSave?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

export default function AdminEditorScaffold({
  tabs,
  header,
  children,
  onSave,
  onCancel,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  isSaving = false,
  disableSave = false,
  error,
  successMessage,
}: AdminEditorScaffoldProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSaving && !disableSave) {
      onSave();
    }
  };

  return (
    <div className={styles.scaffold}>
      {tabs}
      {header}

      {error && (
        <div role="alert" className={styles.bannerError}>
          {error}
        </div>
      )}

      {successMessage && (
        <div role="status" className={styles.bannerSuccess}>
          {successMessage}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {children}

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="btn btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isSaving || disableSave}
            aria-busy={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
