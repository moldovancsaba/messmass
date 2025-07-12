import React, { useState } from 'react';
import styles from './AdminPanel.module.css';

interface CounterTitle {
  id: string;
  title: string;
}

interface AdminPanelProps {
  titles: CounterTitle[];
  onAddTitle: (title: string) => void;
  onDeleteTitle: (id: string) => void;
}

/**
 * AdminPanel component that manages counter titles with add/delete functionality
 * and form validation.
 */
export const AdminPanel: React.FC<AdminPanelProps> = ({
  titles,
  onAddTitle,
  onDeleteTitle,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }
    
    if (titles.some(t => t.title.toLowerCase() === newTitle.trim().toLowerCase())) {
      setError('This title already exists');
      return;
    }

    try {
      onAddTitle(newTitle.trim());
      setNewTitle('');
      setError(null);
    } catch {
      setError('Failed to add title. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    try {
      onDeleteTitle(id);
    } catch {
      setError('Failed to delete title. Please try again.');
    }
  };

  return (
    <div className={styles.adminPanel}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Add New Counter</h2>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              setError(null);
            }}
            placeholder="Enter counter title"
            className={styles.input}
            aria-label="Counter title"
          />
          <button 
            type="submit" 
            className={styles.addButton}
            aria-label="Add counter"
          >
            Add
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <div className={styles.titlesList}>
        <h2>Existing Counters</h2>
        {titles.length === 0 ? (
          <p className={styles.emptyMessage}>No counters added yet</p>
        ) : (
          <ul className={styles.list}>
            {titles.map((title) => (
              <li key={title.id} className={styles.listItem}>
                <span>{title.title}</span>
                <button
                  onClick={() => handleDelete(title.id)}
                  className={styles.deleteButton}
                  aria-label={`Delete ${title.title} counter`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
