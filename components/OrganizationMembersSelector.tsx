'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './OrganizationMembersSelector.module.css';

interface OrganizationMember {
  _id: string;
  name: string;
  currentOrganizationId: string | null;
  currentOrganizationName: string;
  isMember: boolean;
}

interface OrganizationMembersSelectorProps {
  members: OrganizationMember[];
  onChange: (memberIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function OrganizationMembersSelector({
  members,
  onChange,
  disabled = false,
  placeholder = 'Search members...',
}: OrganizationMembersSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMembers = useMemo(
    () => members.filter((member) => member.isMember),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      if (!query) return true;
      return (
        member.name.toLowerCase().includes(query) ||
        member.currentOrganizationName.toLowerCase().includes(query)
      );
    });
  }, [members, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const emitSelected = (updater: (previous: string[]) => string[]) => {
    const next = updater(selectedMembers.map((member) => member._id));
    onChange(next);
  };

  const selectMember = (memberId: string) => {
    emitSelected((previous) => {
      if (previous.includes(memberId)) return previous;
      return [...previous, memberId];
    });
    setSearchQuery('');
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const removeMember = (memberId: string) => {
    emitSelected((previous) => previous.filter((id) => id !== memberId));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (event.key.length === 1 || event.key === 'ArrowDown') {
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev < filteredMembers.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && filteredMembers[focusedIndex]) {
          selectMember(filteredMembers[focusedIndex]._id);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsDropdownOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {selectedMembers.length > 0 && (
        <div className={styles.chipsContainer}>
          {selectedMembers.map((member) => (
            <div key={member._id} className={`${styles.memberChip} ${disabled ? styles.disabled : ''}`}>
              <span className={styles.chipLabel} title={member.name}>
                {member.name}
              </span>
              {!disabled && (
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={() => removeMember(member._id)}
                  title={`Remove ${member.name}`}
                  aria-label={`Remove ${member.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setIsDropdownOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => !disabled && setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedMembers.length > 0 ? 'Add more members...' : placeholder}
          disabled={disabled}
          autoComplete="off"
        />

        {isDropdownOpen && filteredMembers.length > 0 && (
          <div className={styles.dropdown}>
            {filteredMembers.map((member, index) => {
              const isSelected = selectedMembers.some((selected) => selected._id === member._id);

              return (
                <div
                  key={member._id}
                  className={`${styles.dropdownItem} ${index === focusedIndex ? styles.focused : ''}`}
                  onClick={() => (isSelected ? removeMember(member._id) : selectMember(member._id))}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className={styles.memberNameRow}>
                    <span className={styles.memberName}>{member.name}</span>
                    {isSelected && <span className={styles.memberState}>Selected</span>}
                  </div>
                  <div className={styles.memberMeta}>
                    {member.currentOrganizationId ? `Current org: ${member.currentOrganizationName}` : 'Unassigned'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isDropdownOpen && filteredMembers.length === 0 && (
          <div className={styles.dropdown}>
            <div className={styles.noResults}>
              No members found matching &quot;{searchQuery}&quot;
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
