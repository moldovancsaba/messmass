'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

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

/* What: Parse Hungarian date to ISO format
   Why: Convert "péntek, 17 október 2025   kezdés:  18:00" to YYYY-MM-DD */
function parseHungarianDate(dateStr: string): string {
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
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (error) {
    console.error('Date parsing error:', error);
    return new Date().toISOString().split('T')[0]; // fallback to today
  }
}

/* What: Parse spreadsheet row into project data
   Why: Transform sheet format into MessMass project structure */
function parseSheetRow(rawData: string) {
  const parts = rawData.split('\t').map(p => p.trim());
  
  // Extract sport emoji (first part)
  const sportEmoji = parts[0] || '';
  const sportHashtag = SPORT_MAP[sportEmoji] || 'other';
  
  // Extract date (second part)
  const dateStr = parts[1] || '';
  const eventDate = parseHungarianDate(dateStr);
  
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
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>⚡ Quick Add from Sheet</h1>
          <p className={styles.subtitle}>
            Paste event data from Google Sheets to quickly create projects
          </p>
        </header>

        <div className={styles.instructions}>
          <h3>📋 Expected Format:</h3>
          <div className={styles.exampleBox}>
            <code>
              ⚽	péntek, 17 október 2025   kezdés:  18:00 	Mezőkövesd Zsóry FC	|	Budafoki MTE	|	Mezőkövesd Városi Stadionja	|	Labdarúgó NB2 - Merkantil Bank Liga
            </code>
          </div>
          <ul className={styles.formatList}>
            <li><strong>Sport emoji:</strong> ⚽ 🏒 🤾 🏐 🤽🏻‍♂️ 🏀 🎮</li>
            <li><strong>Date:</strong> Hungarian format (e.g., "péntek, 17 október 2025")</li>
            <li><strong>Home Team | Visitor Team | Location | League</strong></li>
          </ul>
        </div>

        <div className={styles.inputSection}>
          <label htmlFor="rawInput" className={styles.label}>
            Paste Sheet Data:
          </label>
          <textarea
            id="rawInput"
            className={styles.textarea}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="⚽	péntek, 17 október 2025   kezdés:  18:00 	Mezőkövesd Zsóry FC	|	Budafoki MTE	|	Mezőkövesd Városi Stadionja	|	Labdarúgó NB2 - Merkantil Bank Liga"
            rows={5}
          />
          
          <div className={styles.buttonGroup}>
            <button 
              onClick={handlePreview}
              className={styles.btnPrimary}
              disabled={!rawInput.trim()}
            >
              Preview
            </button>
            {preview && (
              <button 
                onClick={handleReset}
                className={styles.btnSecondary}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div className={styles.successBox}>
            ✅ {success}
          </div>
        )}

        {preview && (
          <div className={styles.previewSection}>
            <h3>👀 Preview:</h3>
            
            <div className={styles.previewCard}>
              <div className={styles.previewRow}>
                <strong>Event Name:</strong>
                <span>{preview.eventName}</span>
              </div>
              
              <div className={styles.previewRow}>
                <strong>Event Date:</strong>
                <span>{preview.eventDate}</span>
              </div>
              
              <div className={styles.previewRow}>
                <strong>Hashtags:</strong>
                <div className={styles.hashtagList}>
                  {preview.hashtags.map((tag: string) => (
                    <span key={tag} className={styles.hashtag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.previewDetails}>
                <h4>Parsed Data:</h4>
                <ul>
                  <li><strong>Sport:</strong> {preview.rawData.sport} ({preview.rawData.sportHashtag})</li>
                  <li><strong>Home Team:</strong> {preview.rawData.homeTeam}</li>
                  <li><strong>Visitor Team:</strong> {preview.rawData.visitorTeam}</li>
                  <li><strong>Location:</strong> {preview.rawData.location}</li>
                  <li><strong>League:</strong> {preview.rawData.league}</li>
                  <li><strong>Original Date:</strong> {preview.rawData.dateStr}</li>
                </ul>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button 
                onClick={handleCreate}
                className={styles.btnSuccess}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : '✅ Create Project'}
              </button>
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <a href="/admin/projects" className={styles.backLink}>
            ← Back to Projects
          </a>
        </div>
      </div>
    </div>
  );
}
