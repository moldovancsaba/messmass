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
    <div className="admin-container">
      {/* Header */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="title">⚡ Quick Add from Sheet</h1>
          <a href="/admin/projects" className="btn btn-secondary">← Back to Projects</a>
        </div>
        <p className="subtitle">
          Paste event data from Google Sheets to quickly create projects
        </p>
      </div>

      {/* Instructions */}
      <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
          📋 Expected Format:
        </h3>
        <div style={{ 
          background: '#1f2937', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          overflow: 'auto'
        }}>
          <code style={{ fontFamily: 'Monaco, monospace', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            ⚽	péntek, 17 október 2025   kezdés:  18:00 	Mezőkövesd Zsóry FC	|	Budafoki MTE	|	Mezőkövesd Városi Stadionja	|	Labdarúgó NB2 - Merkantil Bank Liga
          </code>
        </div>
        <ul style={{ paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Sport emoji:</strong> ⚽ 🏒 🤾 🏐 🤽🏻‍♂️ 🏀 🎮</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Date:</strong> Hungarian format (e.g., "péntek, 17 október 2025")</li>
          <li><strong>Home Team | Visitor Team | Location | League</strong></li>
        </ul>
      </div>

      {/* Input Section */}
      <div className="glass-card">
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
            style={{ fontFamily: 'Monaco, monospace', fontSize: '0.875rem' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
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
        <div className="glass-card" style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
          <p style={{ color: '#991b1b', margin: 0, fontWeight: '500' }}>❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="glass-card" style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
          <p style={{ color: '#065f46', margin: 0, fontWeight: '500' }}>✅ {success}</p>
        </div>
      )}

      {/* Preview Section */}
      {preview && (
        <div className="glass-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>
            👀 Preview:
          </h3>
          
          <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <strong style={{ display: 'inline-block', minWidth: '120px', color: '#6b7280' }}>Event Name:</strong>
              <span style={{ color: '#1f2937' }}>{preview.eventName}</span>
            </div>
            
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <strong style={{ display: 'inline-block', minWidth: '120px', color: '#6b7280' }}>Event Date:</strong>
              <span style={{ color: '#1f2937' }}>{preview.eventDate}</span>
            </div>
            
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#6b7280' }}>Hashtags:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {preview.hashtags.map((tag: string) => (
                  <span 
                    key={tag} 
                    style={{
                      display: 'inline-block',
                      background: '#e0e7ff',
                      color: '#4338ca',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '2px solid #e5e7eb' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                Parsed Data:
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Sport:</strong> {preview.rawData.sport} ({preview.rawData.sportHashtag})
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Home Team:</strong> {preview.rawData.homeTeam}
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Visitor Team:</strong> {preview.rawData.visitorTeam}
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Location:</strong> {preview.rawData.location}
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>League:</strong> {preview.rawData.league}
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Original Date:</strong> {preview.rawData.dateStr}
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Year:</strong> {preview.rawData.year}
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  <strong>Month:</strong> {preview.rawData.month}
                </li>
                <li style={{ fontSize: '0.875rem', color: '#6b7280' }}>
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
