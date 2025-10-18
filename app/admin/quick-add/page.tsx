'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import PartnerSelector from '@/components/PartnerSelector';
import type { PartnerResponse } from '@/lib/partner.types';
import styles from '@/app/admin/projects/PartnerLogos.module.css';

/* What: Quick Add from Sheet page for bulk event import
   Why: Streamline creating projects from Google Sheets data */

// Hungarian to English month mapping
const MONTH_MAP: Record<string, string> = {
  'január': 'January',
  'február': 'February',
  'március': 'March',
  'április': 'April',
  'május': 'May',
  'június': 'June',
  'július': 'July',
  'augusztus': 'August',
  'szeptember': 'September',
  'október': 'October',
  'november': 'November',
  'december': 'December',
};

// Sport emoji to hashtag mapping
const SPORT_MAP: Record<string, string> = {
  '⚽': 'soccer',
  '🏒': 'icehockey',
  '🤾': 'handball',
  '🏐': 'volleyball',
  '🤽🏻‍♂️': 'waterpolo',
  '🤽': 'waterpolo', // fallback without skin tone
  '🏀': 'basketball',
  '🎮': 'esport',
};

/* What: Convert Hungarian characters to ASCII with underscores
   Why: Create clean hashtag-friendly names */
function toHashtag(text: string): string {
  const charMap: Record<string, string> = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u',
    'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ö': 'o', 'Ő': 'o', 'Ú': 'u', 'Ü': 'u', 'Ű': 'u',
  };
  
  return text
    .split('')
    .map(char => charMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/* What: Get season from month number
   Why: Categorize events by season for filtering */
function getSeason(month: number): string {
  // Month is 0-indexed (0 = January, 11 = December)
  if (month === 11 || month === 0 || month === 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn'; // months 8, 9, 10 (September, October, November)
}

/* What: Parse Hungarian date to ISO format and extract time components
   Why: Convert "péntek, 17 október 2025   kezdés:  18:00" to YYYY-MM-DD and extract year, month, season */
function parseHungarianDate(dateStr: string): { isoDate: string; year: string; month: string; season: string } {
  try {
    // Extract day, month, year from format like "péntek, 17 október 2025"
    const parts = dateStr.split(',')[1]?.trim().split(/\s+/) || [];
    const day = parts[0];
    const monthHu = parts[1];
    const year = parts[2];
    
    const monthEn = MONTH_MAP[monthHu.toLowerCase()];
    if (!monthEn || !day || !year) {
      throw new Error('Invalid date format');
    }
    
    const date = new Date(`${monthEn} ${day}, ${year}`);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const monthName = monthEn.toLowerCase();
    const season = getSeason(date.getMonth());
    
    return { isoDate, year, month: monthName, season };
  } catch (error) {
    console.error('Date parsing error:', error);
    const today = new Date();
    return {
      isoDate: today.toISOString().split('T')[0],
      year: today.getFullYear().toString(),
      month: today.toLocaleString('en', { month: 'long' }).toLowerCase(),
      season: getSeason(today.getMonth()),
    };
  }
}

/* What: Parse spreadsheet row into project data
   Why: Transform sheet format into MessMass project structure */
function parseSheetRow(rawData: string) {
  const parts = rawData.split('\t').map(p => p.trim());
  
  // Extract sport emoji (first part)
  const sportEmoji = parts[0] || '';
  const sportHashtag = SPORT_MAP[sportEmoji] || 'other';
  
  // Extract date (second part) and time components
  const dateStr = parts[1] || '';
  const dateInfo = parseHungarianDate(dateStr);
  const eventDate = dateInfo.isoDate;
  
  // Extract teams and location (split by |)
  const remainder = parts.slice(2).join('\t');
  const pipeParts = remainder.split('|').map(p => p.trim());
  
  const homeTeam = pipeParts[0] || '';
  const visitorTeam = pipeParts[1] || '';
  const location = pipeParts[2] || '';
  const league = pipeParts[3] || '';
  
  // Create hashtags
  const homeHashtag = toHashtag(homeTeam);
  const visitorHashtag = toHashtag(visitorTeam);
  const locationHashtag = toHashtag(location);
  
  // Create event name
  const eventName = `${sportEmoji} ${homeTeam} - ${visitorTeam} @ ${league}`;
  
  // Combine all hashtags with category prefixes
  const hashtags = [
    `sport:${sportHashtag}`,
    `home:${homeHashtag}`,
    `visitor:${visitorHashtag}`,
    `location:${locationHashtag}`,
    `time:${dateInfo.year}`,
    `time:${dateInfo.month}`,
    `time:${dateInfo.season}`,
  ].filter(Boolean);
  
  return {
    eventName,
    eventDate,
    hashtags,
    rawData: {
      sport: sportEmoji,
      sportHashtag,
      homeTeam,
      visitorTeam,
      location,
      league,
      dateStr,
      year: dateInfo.year,
      month: dateInfo.month,
      season: dateInfo.season,
    },
  };
}

export default function QuickAddPage() {
  const router = useRouter();
  const [rawInput, setRawInput] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // WHAT: Sports Match Quick Add state
  // WHY: New feature for creating events from partner selection
  const [activeTab, setActiveTab] = useState<'sheet' | 'partners'>('sheet');
  const [partners, setPartners] = useState<PartnerResponse[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [partner1Id, setPartner1Id] = useState<string>('');
  const [partner2Id, setPartner2Id] = useState<string>('');
  const [matchDate, setMatchDate] = useState<string>('');
  const [matchPreview, setMatchPreview] = useState<any>(null);
  
  // WHAT: Load partners for sports match builder
  // WHY: Need partner data for dropdown selection
  useEffect(() => {
    if (activeTab === 'partners' && partners.length === 0) {
      loadPartners();
    }
  }, [activeTab]);
  
  async function loadPartners() {
    setLoadingPartners(true);
    try {
      const res = await fetch('/api/partners?limit=100&sortField=name&sortOrder=asc');
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners);
      }
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoadingPartners(false);
    }
  }

  /* What: Parse input and show preview
     Why: Let user verify before creating project */
  const handlePreview = () => {
    setError('');
    setSuccess('');
    
    if (!rawInput.trim()) {
      setError('Please paste sheet data');
      return;
    }
    
    try {
      const parsed = parseSheetRow(rawInput);
      setPreview(parsed);
    } catch (err) {
      setError('Failed to parse data. Please check format.');
      console.error(err);
    }
  };

  /* What: Create project from parsed data
     Why: Send to API and create new project */
  const handleCreate = async () => {
    if (!preview) return;
    
    setIsCreating(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: preview.eventName,
          eventDate: preview.eventDate,
          hashtags: preview.hashtags,
          stats: {
            // Initialize with zeros
            remoteImages: 0,
            hostessImages: 0,
            selfies: 0,
            female: 0,
            male: 0,
            genAlpha: 0,
            genYZ: 0,
            genX: 0,
            boomer: 0,
            indoor: 0,
            outdoor: 0,
            stadium: 0,
            merched: 0,
            jersey: 0,
            scarf: 0,
            flags: 0,
            baseballCap: 0,
            other: 0,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();
      setSuccess(`Project created successfully! ID: ${data.project._id}`);
      
      // Reset form after 2 seconds and redirect
      setTimeout(() => {
        router.push('/admin/projects');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  /* What: Clear form and start over
     Why: Allow multiple entries without page reload */
  const handleReset = () => {
    setRawInput('');
    setPreview(null);
    setError('');
    setSuccess('');
  };
  
  // WHAT: Preview sports match from partners
  // WHY: Show generated event before creating
  const handleMatchPreview = () => {
    setError('');
    setSuccess('');
    setMatchPreview(null);
    
    if (!partner1Id || !partner2Id || !matchDate) {
      setError('Please select both partners and a date');
      return;
    }
    
    const partner1 = partners.find(p => p._id === partner1Id);
    const partner2 = partners.find(p => p._id === partner2Id);
    
    if (!partner1 || !partner2) {
      setError('Selected partners not found');
      return;
    }
    
    // WHAT: Build event name without emoji
    // WHY: Emoji is now displayed separately in UI, no need in name string
    const eventName = `${partner1.name} x ${partner2.name}`;
    
    // WHAT: Collect hashtags - Partner 1 ALL, Partner 2 without location category
    // WHY: Location should come from home team (Partner 1) only
    const allHashtags: string[] = [];
    const categorizedHashtags: { [key: string]: string[] } = {};
    
    // Add Partner 1 hashtags (ALL)
    if (partner1.hashtags) {
      allHashtags.push(...partner1.hashtags);
    }
    if (partner1.categorizedHashtags) {
      Object.entries(partner1.categorizedHashtags).forEach(([category, tags]) => {
        if (!categorizedHashtags[category]) {
          categorizedHashtags[category] = [];
        }
        categorizedHashtags[category].push(...tags);
      });
    }
    
    // Add Partner 2 hashtags (EXCEPT location category)
    if (partner2.hashtags) {
      allHashtags.push(...partner2.hashtags);
    }
    if (partner2.categorizedHashtags) {
      Object.entries(partner2.categorizedHashtags).forEach(([category, tags]) => {
        if (category.toLowerCase() === 'location') {
          // WHAT: Skip location hashtags from Partner 2
          // WHY: Event location comes from home team (Partner 1)
          return;
        }
        if (!categorizedHashtags[category]) {
          categorizedHashtags[category] = [];
        }
        categorizedHashtags[category].push(...tags);
      });
    }
    
    // WHAT: Deduplicate hashtags
    // WHY: Both partners may have same hashtags (e.g., "football")
    const uniqueHashtags = Array.from(new Set(allHashtags));
    
    // Deduplicate categorized hashtags
    Object.keys(categorizedHashtags).forEach(category => {
      categorizedHashtags[category] = Array.from(new Set(categorizedHashtags[category]));
    });
    
    // WHAT: Collect Bitly links from Partner 1 only
    // WHY: Home team's tracking links are used for the event
    const bitlyLinks = partner1.bitlyLinks || [];
    
    setMatchPreview({
      eventName,
      eventDate: matchDate,
      hashtags: uniqueHashtags,
      categorizedHashtags,
      bitlyLinks,
      partner1,
      partner2,
    });
  };
  
  // WHAT: Create project from sports match
  // WHY: Save generated event to database
  const handleMatchCreate = async () => {
    if (!matchPreview) return;
    
    setIsCreating(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: matchPreview.eventName,
          eventDate: matchPreview.eventDate,
          hashtags: matchPreview.hashtags,
          categorizedHashtags: matchPreview.categorizedHashtags,
          partner1Id: matchPreview.partner1._id,  // WHAT: Home team reference
          partner2Id: matchPreview.partner2._id,  // WHAT: Away team reference
          stats: {
            // Initialize with zeros
            remoteImages: 0,
            hostessImages: 0,
            selfies: 0,
            female: 0,
            male: 0,
            genAlpha: 0,
            genYZ: 0,
            genX: 0,
            boomer: 0,
            indoor: 0,
            outdoor: 0,
            stadium: 0,
            merched: 0,
            jersey: 0,
            scarf: 0,
            flags: 0,
            baseballCap: 0,
            other: 0,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();
      setSuccess(`Match created successfully! ${matchPreview.eventName}`);
      
      // Reset form after 2 seconds and redirect
      setTimeout(() => {
        router.push('/admin/projects');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create match');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };
  
  // WHAT: Reset match builder form
  const handleMatchReset = () => {
    setPartner1Id('');
    setPartner2Id('');
    setMatchDate('');
    setMatchPreview(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="page-container">
      <AdminHero
        title="⚡ Quick Add"
        subtitle="Quickly create events from Google Sheets or by selecting partners"
        backLink="/admin/projects"
      />
      
      {/* WHAT: Tab navigation for different quick add methods
       * WHY: Support both sheet import and partner-based creation */}
      <div className={styles.tabNavigation}>
        <button
          onClick={() => setActiveTab('sheet')}
          className={`${styles.tabButton} ${activeTab === 'sheet' ? styles.active : ''}`}
        >
          📋 From Sheet
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`${styles.tabButton} ${activeTab === 'partners' ? styles.active : ''}`}
        >
          🤝 Sports Match
        </button>
      </div>

      {/* WHAT: Sheet Import Tab Content
       * WHY: Original Google Sheets import functionality */}
      {activeTab === 'sheet' && (
        <>
      {/* Instructions */}
      <ColoredCard accentColor="#3b82f6" hoverable={false} className="mb-6 border-left-accent">
        <h3 className="section-subtitle mb-4">
          📋 Expected Format:
        </h3>
        <div className="bg-gray-900 text-white overflow-auto p-4 rounded-lg mb-4">
          <code className="font-mono text-sm whitespace-nowrap">
            ⚽	péntek, 17 október 2025   kezdés:  18:00 	Mezőkövesd Zsóry FC	|	Budafoki MTE	|	Mezőkövesd Városi Stadionja	|	Labdarúgó NB2 - Merkantil Bank Liga
          </code>
        </div>
        <ul className="text-sm text-gray-600 list-disc-padded">
          <li className="mb-2"><strong>Sport emoji:</strong> ⚽ 🏒 🤾 🏐 🤽🏻‍♂️ 🏀 🎮</li>
          <li className="mb-2"><strong>Date:</strong> Hungarian format (e.g., &quot;péntek, 17 október 2025&quot;)</li>
          <li><strong>Home Team | Visitor Team | Location | League</strong></li>
        </ul>
      </ColoredCard>

      {/* Input Section */}
      <ColoredCard accentColor="#6366f1" hoverable={false} className="mb-6">
        <div className="form-group">
          <label htmlFor="rawInput" className="form-label">
            Paste Sheet Data:
          </label>
          <textarea
            id="rawInput"
            className="form-input font-mono text-sm"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="⚽	péntek, 17 október 2025   kezdés:  18:00 	Mezőkövesd Zsóry FC	|	Budafoki MTE	|	Mezőkövesd Városi Stadionja	|	Labdarúgó NB2 - Merkantil Bank Liga"
            rows={5}
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handlePreview}
            className="btn btn-small btn-primary"
            disabled={!rawInput.trim()}
          >
            Preview
          </button>
          {preview && (
            <button 
              onClick={handleReset}
              className="btn btn-small btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </ColoredCard>

      {/* Error Message */}
      {error && (
        <ColoredCard accentColor="var(--mm-color-error-500)" hoverable={false} className="mb-6 error-box">
          <p className="m-0 font-medium text-error">❌ {error}</p>
        </ColoredCard>
      )}

      {/* Success Message */}
      {success && (
        <ColoredCard accentColor="var(--mm-color-success-500)" hoverable={false} className="mb-6 success-box">
          <p className="m-0 font-medium text-success">✅ {success}</p>
        </ColoredCard>
      )}

      {/* Preview Section */}
      {preview && (
        <ColoredCard accentColor="#10b981" hoverable={false} className="mb-6 border-left-accent">
          <h3 className="section-subtitle mb-4">
            👀 Preview:
          </h3>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="mb-4 pb-4 border-bottom-default">
              <strong className="inline-block min-w-120 text-gray-700">Event Name:</strong>
              <span className="text-gray-900">{preview.eventName}</span>
            </div>
            
            <div className="mb-4 pb-4 border-bottom-default">
              <strong className="inline-block min-w-120 text-gray-700">Event Date:</strong>
              <span className="text-gray-900">{preview.eventDate}</span>
            </div>
            
            <div className="mb-4 pb-4 border-bottom-default">
              <strong className="block mb-2 text-gray-700">Hashtags:</strong>
              <div className="flex flex-wrap gap-2">
                {preview.hashtags.map((tag: string) => (
                  <span key={tag} className="hashtag-badge">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-top-default">
              <h4 className="mb-3 text-base font-semibold text-gray-900">
                Parsed Data:
              </h4>
              <ul className="list-none p-0 m-0">
                <li className="mb-2 text-sm text-gray-600">
                  <strong>Sport:</strong> {preview.rawData.sport} ({preview.rawData.sportHashtag})
                </li>
                <li className="mb-2 text-sm text-gray-600">
                  <strong>Home Team:</strong> {preview.rawData.homeTeam}
                </li>
                <li className="mb-2 text-sm text-gray-600">
                  <strong>Visitor Team:</strong> {preview.rawData.visitorTeam}
                </li>
                <li className="mb-2 text-sm text-gray-600">
                  <strong>Location:</strong> {preview.rawData.location}
                </li>
                <li className="mb-2 text-sm text-gray-600">
                  <strong>League:</strong> {preview.rawData.league}
                </li>
                <li className="mb-2 text-sm text-gray-600">
                  <strong>Original Date:</strong> {preview.rawData.dateStr}
                </li>
                <li className="mb-2 text-sm text-gray-600">
                  <strong>Year:</strong> {preview.rawData.year}
                </li>
                <li className="mb-2 text-sm text-gray-600">
                  <strong>Month:</strong> {preview.rawData.month}
                </li>
                <li className="text-sm text-gray-600">
                  <strong>Season:</strong> {preview.rawData.season}
                </li>
              </ul>
            </div>
          </div>

          <button 
            onClick={handleCreate}
            className="btn btn-small btn-success"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : '✅ Create Project'}
          </button>
        </ColoredCard>
      )}
        </>
      )}
      
      {/* WHAT: Sports Match Tab Content
       * WHY: Partner-based event creation for sports matches */}
      {activeTab === 'partners' && (
        <>
          {/* Instructions */}
          <ColoredCard accentColor="#10b981" hoverable={false} className="mb-6 border-left-accent">
            <h3 className="section-subtitle mb-4">
              🤝 Sports Match Builder
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Create a sports match event by selecting two partners and a date.
            </p>
            <ul className="text-sm text-gray-600 list-disc-padded">
              <li className="mb-2"><strong>Partner 1 (Home):</strong> Provides emoji, location hashtags, and Bitly links</li>
              <li className="mb-2"><strong>Partner 2 (Away):</strong> Provides hashtags (excluding location)</li>
              <li><strong>Result:</strong> Event name format: [Emoji] Partner1 x Partner2</li>
            </ul>
          </ColoredCard>
          
          {/* Partner Selection Form */}
          <ColoredCard accentColor="#6366f1" hoverable={false} className="mb-6">
            <div className="form-group mb-4">
              <label htmlFor="partner1" className="form-label">
                Partner 1 (Home Team): *
              </label>
              <PartnerSelector
                selectedPartnerId={partner1Id}
                partners={partners}
                onChange={(id) => setPartner1Id(id || '')}
                placeholder="Search home team..."
                disabled={loadingPartners}
              />
            </div>
            
            <div className="form-group mb-4">
              <label htmlFor="partner2" className="form-label">
                Partner 2 (Away Team): *
              </label>
              <PartnerSelector
                selectedPartnerId={partner2Id}
                partners={partners}
                onChange={(id) => setPartner2Id(id || '')}
                placeholder="Search away team..."
                disabled={loadingPartners}
              />
            </div>
            
            <div className="form-group mb-4">
              <label htmlFor="matchDate" className="form-label">
                Match Date: *
              </label>
              <input
                id="matchDate"
                type="date"
                className="form-input"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleMatchPreview}
                className="btn btn-small btn-primary"
                disabled={!partner1Id || !partner2Id || !matchDate || loadingPartners}
              >
                👀 Preview Match
              </button>
              {matchPreview && (
                <button 
                  onClick={handleMatchReset}
                  className="btn btn-small btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </ColoredCard>
          
          {/* Match Preview */}
          {matchPreview && (
            <ColoredCard accentColor="#10b981" hoverable={false} className="mb-6 border-left-accent">
              <h3 className="section-subtitle mb-4">
                👀 Match Preview:
              </h3>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="mb-4 pb-4 border-bottom-default">
                  <strong className="block mb-2 text-gray-700">Event Name:</strong>
                  {/* WHAT: Match projects list layout with emoji and logos
                   * WHY: Show visual preview exactly as it will appear in projects list */}
                  <div className={styles.previewRow}>
                    {/* Standalone emoji */}
                    <span className={styles.previewEmoji}>
                      {matchPreview.partner1.emoji}
                    </span>
                    
                    {/* Partner 1 (Home Team) logo */}
                    {matchPreview.partner1.logoUrl ? (
                      <img
                        src={matchPreview.partner1.logoUrl}
                        alt={`${matchPreview.partner1.name} logo`}
                        className={styles.previewLogo}
                        title={matchPreview.partner1.name}
                      />
                    ) : (
                      <div className={styles.previewLogoPlaceholder} />
                    )}
                    
                    {/* Event name */}
                    <span className={styles.previewEventName}>
                      {matchPreview.eventName}
                    </span>
                    
                    {/* Partner 2 (Away Team) logo */}
                    {matchPreview.partner2.logoUrl ? (
                      <img
                        src={matchPreview.partner2.logoUrl}
                        alt={`${matchPreview.partner2.name} logo`}
                        className={styles.previewLogo}
                        title={matchPreview.partner2.name}
                      />
                    ) : (
                      <div className={styles.previewLogoPlaceholder} />
                    )}
                  </div>
                </div>
                
                <div className="mb-4 pb-4 border-bottom-default">
                  <strong className="inline-block min-w-120 text-gray-700">Match Date:</strong>
                  <span className="text-gray-900">{matchPreview.eventDate}</span>
                </div>
                
                <div className="mb-4 pb-4 border-bottom-default">
                  <strong className="block mb-2 text-gray-700">Hashtags:</strong>
                  <div className="flex flex-wrap gap-2">
                    {matchPreview.hashtags.map((tag: string) => (
                      <span key={tag} className="hashtag-badge">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {Object.keys(matchPreview.categorizedHashtags).length > 0 && (
                  <div className="mb-4 pb-4 border-bottom-default">
                    <strong className="block mb-2 text-gray-700">Categorized Hashtags:</strong>
                    {Object.entries(matchPreview.categorizedHashtags).map(([category, tags]: [string, any]) => (
                      <div key={category} className="mb-2">
                        <span className="text-sm font-semibold text-gray-600">{category}:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {tags.map((tag: string) => (
                            <span key={`${category}-${tag}`} className="hashtag-badge">
                              {category}:{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {matchPreview.bitlyLinks && matchPreview.bitlyLinks.length > 0 && (
                  <div className="mb-4 pb-4 border-bottom-default">
                    <strong className="block mb-2 text-gray-700">Bitly Links (from {matchPreview.partner1.name}):</strong>
                    <div className="flex flex-col gap-1">
                      {matchPreview.bitlyLinks.map((link: any) => (
                        <a
                          key={link._id}
                          href={`https://${link.bitlink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {link.bitlink} - {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-top-default">
                  <h4 className="mb-3 text-base font-semibold text-gray-900">
                    Match Details:
                  </h4>
                  <ul className="list-none p-0 m-0">
                    <li className="mb-2 text-sm text-gray-600">
                      <strong>Home Team:</strong> {matchPreview.partner1.emoji} {matchPreview.partner1.name}
                    </li>
                    <li className="mb-2 text-sm text-gray-600">
                      <strong>Away Team:</strong> {matchPreview.partner2.emoji} {matchPreview.partner2.name}
                    </li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={handleMatchCreate}
                className="btn btn-small btn-success"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : '✅ Create Match Event'}
              </button>
            </ColoredCard>
          )}
        </>
      )}
      
      {/* Error and Success Messages (shared across tabs) */}
      {error && (
        <ColoredCard accentColor="var(--mm-color-error-500)" hoverable={false} className="mb-6 error-box">
          <p className="m-0 font-medium text-error">❌ {error}</p>
        </ColoredCard>
      )}

      {success && (
        <ColoredCard accentColor="var(--mm-color-success-500)" hoverable={false} className="mb-6 success-box">
          <p className="m-0 font-medium text-success">✅ {success}</p>
        </ColoredCard>
      )}
    </div>
  );
}
