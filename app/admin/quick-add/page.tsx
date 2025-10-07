'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="admin-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="section-title m-0">⚡ Quick Add from Sheet</h1>
          <a href="/admin/projects" className="btn btn-secondary">← Back to Projects</a>
        </div>
        <p className="section-subtitle mb-0">
          Paste event data from Google Sheets to quickly create projects
        </p>
      </div>

      {/* Instructions */}
      <div className="admin-card mb-6" style={{ borderLeft: '4px solid var(--mm-color-primary-600)' }}>
        <h3 className="section-subtitle mb-4">
          📋 Expected Format:
        </h3>
        <div className="admin-card mb-4" style={{ 
          background: 'var(--mm-gray-900)', 
          color: 'var(--mm-white)',
          overflow: 'auto'
        }}>
          <code style={{ fontFamily: 'Monaco, monospace', fontSize: 'var(--mm-font-size-sm)', whiteSpace: 'nowrap' }}>
            ⚽	péntek, 17 október 2025   kezdés:  18:00 	Mezőkövesd Zsóry FC	|	Budafoki MTE	|	Mezőkövesd Városi Stadionja	|	Labdarúgó NB2 - Merkantil Bank Liga
          </code>
        </div>
        <ul style={{ paddingLeft: '1.5rem', color: 'var(--mm-gray-600)', fontSize: 'var(--mm-font-size-sm)', listStyle: 'disc' }}>
          <li className="mb-2"><strong>Sport emoji:</strong> ⚽ 🏒 🤾 🏐 🤽🏻‍♂️ 🏀 🎮</li>
          <li className="mb-2"><strong>Date:</strong> Hungarian format (e.g., "péntek, 17 október 2025")</li>
          <li><strong>Home Team | Visitor Team | Location | League</strong></li>
        </ul>
      </div>

      {/* Input Section */}
      <div className="admin-card mb-6">
        <div className="form-group">
          <label htmlFor="rawInput" className="form-label">
            Paste Sheet Data:
          </label>
          <textarea
            id="rawInput"
            className="form-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="⚽	péntek, 17 október 2025   kezdés:  18:00 	Mezőkövesd Zsóry FC	|	Budafoki MTE	|	Mezőkövesd Városi Stadionja	|	Labdarúgó NB2 - Merkantil Bank Liga"
            rows={5}
            style={{ fontFamily: 'Monaco, monospace', fontSize: 'var(--mm-font-size-sm)' }}
          />
        </div>
        
        <div className="flex" style={{ gap: 'var(--mm-space-3)' }}>
          <button 
            onClick={handlePreview}
            className="btn btn-primary"
            disabled={!rawInput.trim()}
          >
            Preview
          </button>
          {preview && (
            <button 
              onClick={handleReset}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="admin-card mb-6" style={{ background: 'var(--mm-error-bg)', border: '1px solid var(--mm-error)' }}>
          <p className="m-0" style={{ color: 'var(--mm-error)', fontWeight: 'var(--mm-font-weight-medium)' }}>❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="admin-card mb-6" style={{ background: 'var(--mm-success-bg)', border: '1px solid var(--mm-success)' }}>
          <p className="m-0" style={{ color: 'var(--mm-success)', fontWeight: 'var(--mm-font-weight-medium)' }}>✅ {success}</p>
        </div>
      )}

      {/* Preview Section */}
      {preview && (
        <div className="admin-card mb-6" style={{ borderLeft: '4px solid var(--mm-color-primary-600)' }}>
          <h3 className="section-subtitle mb-4">
            👀 Preview:
          </h3>
          
          <div className="admin-card mb-6">
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--mm-border-color-default)' }}>
              <strong className="inline-block" style={{ minWidth: '120px', color: 'var(--mm-gray-700)' }}>Event Name:</strong>
              <span style={{ color: 'var(--mm-gray-900)' }}>{preview.eventName}</span>
            </div>
            
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--mm-border-color-default)' }}>
              <strong className="inline-block" style={{ minWidth: '120px', color: 'var(--mm-gray-700)' }}>Event Date:</strong>
              <span style={{ color: 'var(--mm-gray-900)' }}>{preview.eventDate}</span>
            </div>
            
            <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--mm-border-color-default)' }}>
              <strong className="block mb-2" style={{ color: 'var(--mm-gray-700)' }}>Hashtags:</strong>
              <div className="flex flex-wrap" style={{ gap: 'var(--mm-space-2)' }}>
                {preview.hashtags.map((tag: string) => (
                  <span 
                    key={tag} 
                    style={{
                      display: 'inline-block',
                      background: 'var(--mm-color-primary-100)',
                      color: 'var(--mm-color-primary-700)',
                      padding: '4px 12px',
                      borderRadius: 'var(--mm-radius-md)',
                      fontSize: 'var(--mm-font-size-sm)',
                      fontWeight: 'var(--mm-font-weight-medium)'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4" style={{ borderTop: '2px solid var(--mm-border-color-default)' }}>
              <h4 className="mb-3" style={{ fontSize: 'var(--mm-font-size-base)', fontWeight: 'var(--mm-font-weight-semibold)', color: 'var(--mm-gray-900)' }}>
                Parsed Data:
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Sport:</strong> {preview.rawData.sport} ({preview.rawData.sportHashtag})
                </li>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Home Team:</strong> {preview.rawData.homeTeam}
                </li>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Visitor Team:</strong> {preview.rawData.visitorTeam}
                </li>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Location:</strong> {preview.rawData.location}
                </li>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>League:</strong> {preview.rawData.league}
                </li>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Original Date:</strong> {preview.rawData.dateStr}
                </li>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Year:</strong> {preview.rawData.year}
                </li>
                <li className="mb-2" style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Month:</strong> {preview.rawData.month}
                </li>
                <li style={{ fontSize: 'var(--mm-font-size-sm)', color: 'var(--mm-gray-600)' }}>
                  <strong>Season:</strong> {preview.rawData.season}
                </li>
              </ul>
            </div>
          </div>

          <button 
            onClick={handleCreate}
            className="btn btn-success"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : '✅ Create Project'}
          </button>
        </div>
      )}
    </div>
  );
}
