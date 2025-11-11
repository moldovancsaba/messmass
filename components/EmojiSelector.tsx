import React, { useState } from 'react';
import styles from './EmojiSelector.module.css';

interface EmojiSelectorProps {
  value: string;
  onChange: (emoji: string) => void;
  customEmojis?: string[];
  onCustomEmojisChange?: (emojis: string[]) => void;
  showCustomEditor?: boolean;
}

// WHAT: Default sport emojis for quick selection
// WHY: Most common sport and event-related emojis
const DEFAULT_EMOJIS = ['⚽', '🏀', '🎾', '🏐', '🏓', '🏒', '🥋', '🥊', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♀️', '🎯', '🏆', '🏅'];

export default function EmojiSelector({
  value,
  onChange,
  customEmojis = [],
  onCustomEmojisChange,
  showCustomEditor = false
}: EmojiSelectorProps) {
  const [newEmoji, setNewEmoji] = useState('');
  const [showInput, setShowInput] = useState(false);
  
  // WHAT: Combine default and custom emojis for selection
  // WHY: Allow users to extend default list
  const allEmojis = [...DEFAULT_EMOJIS, ...customEmojis];
  
  // WHAT: Add custom emoji to list
  // WHY: Allow users to add frequently used emojis
  const handleAddCustomEmoji = () => {
    if (!newEmoji.trim()) return;
    
    // Extract first emoji character (supports multi-byte emojis)
    const emoji = Array.from(newEmoji.trim())[0];
    
    if (emoji && !allEmojis.includes(emoji)) {
      onCustomEmojisChange?.([...customEmojis, emoji]);
      setNewEmoji('');
      setShowInput(false);
    }
  };
  
  // WHAT: Remove custom emoji from list
  // WHY: Allow users to clean up unused emojis
  const handleRemoveCustomEmoji = (emoji: string) => {
    onCustomEmojisChange?.(customEmojis.filter(e => e !== emoji));
  };
  
  return (
    <div className={styles.container}>
      {/* WHAT: Text input for direct emoji entry */}
      <div className={styles.inputWrapper}>
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => {
            // Extract first emoji character
            const emoji = Array.from(e.target.value.trim())[0] || '';
            onChange(emoji);
          }}
          placeholder="⚽ 🏟️ 🏆 (single emoji)"
          maxLength={4}
        />
      </div>
      
      {/* WHAT: Quick selection grid */}
      <div className={styles.grid}>
        {allEmojis.map((emoji, index) => {
          const isCustom = customEmojis.includes(emoji);
          return (
            <div key={`${emoji}-${index}`} className={styles.emojiWrapper}>
              <button
                type="button"
                className={`${styles.emojiButton} ${value === emoji ? styles.selected : ''}`}
                onClick={() => onChange(emoji)}
                title={`Select ${emoji}`}
              >
                {emoji}
              </button>
              {isCustom && showCustomEditor && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveCustomEmoji(emoji)}
                  title="Remove from list"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* WHAT: Custom emoji editor (only shown when enabled) */}
      {showCustomEditor && onCustomEmojisChange && (
        <div className={styles.customEditor}>
          {!showInput ? (
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setShowInput(true)}
            >
              + Add Custom Emoji
            </button>
          ) : (
            <div className={styles.addForm}>
              <input
                type="text"
                className={styles.addInput}
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="Paste emoji here..."
                maxLength={4}
                autoFocus
              />
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleAddCustomEmoji}
              >
                ✓
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowInput(false);
                  setNewEmoji('');
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
