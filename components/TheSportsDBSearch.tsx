import React, { useState } from 'react';
import Image from 'next/image';
import { SportsDbTeam } from '@/lib/sportsDbTypes';
import styles from './TheSportsDBSearch.module.css';

// WHAT: Partner.sportsDb documents exist in three shapes: raw TheSportsDB
// fields (strTeam/strTeamBadge), manual-entry fields (teamName/badge/
// venueName), and a hybrid. The linked card falls back across all of them so
// a linked partner never renders as an empty box.
type LinkedTeamDisplay = Partial<SportsDbTeam> & {
  teamName?: string;
  badge?: string;
  leagueName?: string;
  venueName?: string;
  venueCapacity?: number | string;
  country?: string;
};

interface TheSportsDBSearchProps {
  onLink: (team: SportsDbTeam) => void;
  linkedTeam?: LinkedTeamDisplay | null;
  onUnlink?: () => void;
}

// WHAT: TheSportsDB search component for partner enrichment
// WHY: Allow admins to link partners to sports teams for auto-population of data
export default function TheSportsDBSearch({ onLink, linkedTeam, onUnlink }: TheSportsDBSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SportsDbTeam[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // WHAT: Debounced search handler
  // WHY: Prevent excessive API calls while user types
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      const response = await fetch(`/api/sports-db/search?type=team&query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
        if (data.results.length === 0) {
          setSearchError('No teams found. Try a different search term.');
        }
      } else {
        setSearchError(data.message || 'Search failed. Please try again.');
      }
    } catch (error) {
      console.error('TheSportsDB search error:', error);
      setSearchError('Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // WHAT: Handle link button click
  // WHY: Pass team data to parent for storage
  const handleLinkTeam = (team: SportsDbTeam) => {
    onLink(team);
    setSearchResults([]);
    setSearchQuery('');
  };
  
  return (
    <div className={styles.container}>
      {/* WHAT: Linked team display */}
      {linkedTeam ? (
        <div className={styles.linkedTeam}>
          <div className={styles.linkedTeamHeader}>
            <span className={styles.linkedBadge}>✓ Linked</span>
            {onUnlink && (
              <button
                type="button"
                className={styles.unlinkButton}
                onClick={onUnlink}
                title="Unlink team"
              >
                × Unlink
              </button>
            )}
          </div>
          
          <div className={styles.linkedTeamContent}>
            {(() => {
              const badge = linkedTeam.strTeamBadge ?? linkedTeam.badge;
              const name = linkedTeam.strTeam ?? linkedTeam.teamName ?? 'Linked team';
              const league = linkedTeam.strLeague ?? linkedTeam.leagueName;
              const country = linkedTeam.strCountry ?? linkedTeam.country;
              const stadium = linkedTeam.strStadium ?? linkedTeam.venueName;
              const capacity = linkedTeam.intStadiumCapacity ?? linkedTeam.venueCapacity;
              const capacityNumber = capacity !== undefined && capacity !== null ? Number(capacity) : NaN;
              return (
                <>
                  {badge && (
                    <Image
                      src={badge}
                      alt={name}
                      className={styles.linkedLogo}
                      width={80}
                      height={80}
                      unoptimized
                    />
                  )}
                  <div className={styles.linkedInfo}>
                    <h4 className={styles.linkedName}>{name}</h4>
                    <div className={styles.linkedMeta}>
                      {league && <span>🏆 {league}</span>}
                      {country && <span>🌍 {country}</span>}
                      {stadium && <span>🏟️ {stadium}</span>}
                      {Number.isFinite(capacityNumber) && (
                        <span>👥 {capacityNumber.toLocaleString()} capacity</span>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <>
          {/* WHAT: Search input and button */}
          <div className={styles.searchRow}>
            <input
              type="text"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a team (e.g., Barcelona, Lakers, Yankees)"
            />
            <button
              type="button"
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Searching...' : '🔍 Search'}
            </button>
          </div>
          
          {/* WHAT: Search results list */}
          {searchError && (
            <div className={styles.errorMessage}>
              ⚠️ {searchError}
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className={styles.results}>
              <p className={styles.resultsCount}>
                Found {searchResults.length} team{searchResults.length !== 1 ? 's' : ''}
              </p>
              <div className={styles.resultsList}>
                {searchResults.map((team) => (
                  <div key={team.idTeam} className={styles.resultCard}>
                    {team.strTeamBadge && (
                      <Image
                        src={team.strTeamBadge}
                        alt={team.strTeam}
                        className={styles.resultLogo}
                        width={60}
                        height={60}
                        unoptimized
                      />
                    )}
                    <div className={styles.resultInfo}>
                      <h4 className={styles.resultName}>{team.strTeam}</h4>
                      <div className={styles.resultMeta}>
                        {team.strLeague && <span>🏆 {team.strLeague}</span>}
                        {team.strCountry && <span>🌍 {team.strCountry}</span>}
                      </div>
                      {team.strStadium && (
                        <div className={styles.resultStadium}>
                          🏟️ {team.strStadium}
                          {team.intStadiumCapacity && ` (${parseInt(team.intStadiumCapacity).toLocaleString()} capacity)`}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => handleLinkTeam(team)}
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
