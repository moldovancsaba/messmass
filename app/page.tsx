'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  stats: typeof initialStats;
  createdAt: string;
  updatedAt: string;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

const initialStats = {
  // Event Statistics
  remoteImages: 0,
  hostessImages: 0,
  selfies: 0, // Changed from remoteFans + onLocationFan calculation
  indoor: 0, // Changed from remoteFans
  outdoor: 0, // Changed from onLocationFan  
  stadium: 0, // New field
  female: 0,
  male: 0,
  genAlpha: 0,
  genYZ: 0,
  genX: 0,
  boomer: 0,
  merched: 0,
  jersey: 0,
  scarf: 0, // Changed from scarfFlags
  flags: 0, // New field
  baseballCap: 0,
  other: 0, // New field
  // Success Manager Fields
  approvedImages: 0,
  rejectedImages: 0,
  eventAttendees: 0,
  eventTicketPurchases: 0,
  visitQrCode: 0,
  visitShortUrl: 0,
  visitWeb: 0,
  visitFacebook: 0,
  visitInstagram: 0,
  visitYoutube: 0,
  visitTiktok: 0,
  visitX: 0,
  visitTrustpilot: 0,
  eventResultHome: 0,
  eventResultVisitor: 0,
  eventValuePropositionVisited: 0,
  eventValuePropositionPurchases: 0
};

export default function Home() {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState(initialStats);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Real-time collaboration state
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionIdRef = useRef<string | null>(null);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionStatus('connecting');
    
    try {
      // Connect to WebSocket server
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_WS_URL || 'wss://your-websocket-server.com'
        : process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:7654';
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 WebSocket connected');
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setConnectionStatus('disconnected');
        setIsConnected(false);
        setActiveUsers(0);
        connectionIdRef.current = null;
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log('📨 Received:', message.type);

    switch (message.type) {
      case 'connection_established':
        connectionIdRef.current = message.connectionId;
        console.log('✅ Connection ID:', message.connectionId);
        break;

      case 'project_joined':
        setActiveUsers(message.activeUsers);
        break;

      case 'user_joined':
      case 'user_left':
        setActiveUsers(message.activeUsers);
        setLastUpdate(`User ${message.type.split('_')[1]} at ${new Date(message.timestamp).toLocaleTimeString()}`);
        break;

      case 'stat_updated':
        if (message.updatedBy !== connectionIdRef.current) {
          // Update from another user - apply immediately
          setStats(prev => ({
            ...prev,
            [message.statKey]: message.newValue
          }));
          setLastUpdate(`${message.statKey} updated by another user`);
        }
        break;

      case 'project_updated':
        if (message.updatedBy !== connectionIdRef.current) {
          // Update from another user - apply immediately
          setEventName(message.eventName);
          setEventDate(message.eventDate);
          setStats(message.stats);
          setLastUpdate(`Project updated by another user at ${new Date(message.timestamp).toLocaleTimeString()}`);
        }
        break;

      case 'stats_reset':
        if (message.resetBy !== connectionIdRef.current) {
          // Reset from another user - apply immediately
          setStats(message.stats);
          setLastUpdate(`Stats reset by another user at ${new Date(message.timestamp).toLocaleTimeString()}`);
        }
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, []);

  // Send WebSocket message
  const sendWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Join project room for real-time collaboration
  const joinProjectRoom = useCallback((projectId: string) => {
    if (!sendWebSocketMessage({
      type: 'join_project',
      projectId
    })) {
      console.warn('Failed to join project room - WebSocket not connected');
    }
  }, [sendWebSocketMessage]);

  // Leave project room
  const leaveProjectRoom = useCallback(() => {
    sendWebSocketMessage({
      type: 'leave_project'
    });
  }, [sendWebSocketMessage]);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-save when stats, eventName, or eventDate change (debounced) - ONLY if project already exists
  useEffect(() => {
    if (currentProjectId && eventName.trim()) {
      const timeoutId = setTimeout(() => {
        updateProject();
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [stats, eventName, eventDate, currentProjectId]);

  // Join project room when currentProjectId changes
  useEffect(() => {
    if (currentProjectId && isConnected) {
      joinProjectRoom(currentProjectId);
    } else if (!currentProjectId && isConnected) {
      leaveProjectRoom();
    }
  }, [currentProjectId, isConnected, joinProjectRoom, leaveProjectRoom]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const saveProject = async () => {
    if (!eventName.trim()) {
      alert('Please enter an event name before saving.');
      return;
    }

    setSaveStatus('saving');
    try {
      const projectData = { eventName, eventDate, stats };

      // Always create a new project when "Save Project" is clicked
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();
      if (data.success) {
        setCurrentProjectId(data.projectId);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        loadProjects(); // Refresh project list
        
        // Join the new project room
        if (isConnected) {
          joinProjectRoom(data.projectId);
        }
      } else {
        setSaveStatus('error');
        alert('Failed to save project. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      setSaveStatus('error');
      alert('Failed to save project. Please check your connection.');
    }
  };

  const updateProject = async () => {
    if (!currentProjectId || !eventName.trim()) return;

    setSaveStatus('saving');
    try {
      const projectData = { eventName, eventDate, stats };

      // Update existing project
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProjectId, ...projectData })
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        
        // Broadcast update to other users
        sendWebSocketMessage({
          type: 'project_update',
          eventName,
          eventDate,
          stats
        });
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      setSaveStatus('error');
    }
  };

  const loadProject = async (project: Project) => {
    // Leave current project room
    if (currentProjectId && isConnected) {
      leaveProjectRoom();
    }
    
    // CRITICAL FIX: Always fetch fresh data from database
    try {
      const response = await fetch(`/api/projects/${project._id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.project) {
          // Use fresh database data
          setCurrentProjectId(data.project._id);
          setEventName(data.project.eventName);
          setEventDate(data.project.eventDate);
          setStats(data.project.stats);
          setShowProjects(false);
          
          // Join project room will be handled by useEffect
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch fresh project data:', error);
    }
    
    // Fallback to cached project data if API fails
    setCurrentProjectId(project._id);
    setEventName(project.eventName);
    setEventDate(project.eventDate);
    setStats(project.stats);
    setShowProjects(false);
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/projects?projectId=${projectId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadProjects();
        if (currentProjectId === projectId) {
          startNewProject();
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const startNewProject = () => {
    if (currentProjectId && isConnected) {
      leaveProjectRoom();
    }
    
    setCurrentProjectId(null);
    setEventName('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setStats(initialStats);
    setShowProjects(false);
    setActiveUsers(0);
  };

  const decrementStat = (key: keyof typeof stats) => {
    if (stats[key] > 0) {
      const newValue = stats[key] - 1;
      
      // Optimistic update
      setStats(prev => ({
        ...prev,
        [key]: newValue
      }));

      // Broadcast to other users
      if (currentProjectId && isConnected) {
        sendWebSocketMessage({
          type: 'stat_increment',
          statKey: key,
          newValue
        });
      }
    }
  };

  const incrementStat = (key: keyof typeof stats) => {
    const newValue = stats[key] + 1;
    
    // Optimistic update
    setStats(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Broadcast to other users
    if (currentProjectId && isConnected) {
      sendWebSocketMessage({
        type: 'stat_increment',
        statKey: key,
        newValue
      });
    }
  };

  const resetStats = async () => {
    const resetStatsData = { ...initialStats };
    
    if (currentProjectId) {
      // If we're working on a saved project, confirm and update database
      const confirmed = confirm('This will reset all statistics for this saved project. Are you sure?');
      if (!confirmed) return;
      
      setStats(resetStatsData);
      setSaveStatus('saving');
      
      try {
        const response = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            projectId: currentProjectId, 
            eventName, 
            eventDate, 
            stats: resetStatsData 
          })
        });

        if (response.ok) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          
          // Broadcast reset to other users
          sendWebSocketMessage({
            type: 'reset_stats',
            resetStats: resetStatsData
          });
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('Failed to reset project stats:', error);
        setSaveStatus('error');
      }
    } else {
      // If it's a new project, just reset locally
      setStats(resetStatsData);
    }
  };

  // Calculated totals
  const totalImages = stats.remoteImages + stats.hostessImages + stats.selfies;
  const totalFans = stats.indoor + stats.outdoor + stats.stadium;
  const totalGender = stats.female + stats.male;
  const totalUnder40 = stats.genAlpha + stats.genYZ;
  const totalOver40 = stats.genX + stats.boomer;
  const totalAge = totalUnder40 + totalOver40;
  const totalMerch = stats.merched + stats.jersey + stats.scarf + stats.flags + stats.baseballCap + stats.other;

  const downloadCSV = () => {
    const csvData = [
      ['Event Name', eventName || 'Untitled Event'],
      ['Event Date', eventDate],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'Selfies', stats.selfies],
      ['Images', 'Total Images', totalImages],
      ['Fans', 'Indoor', stats.indoor],
      ['Fans', 'Outdoor', stats.outdoor],
      ['Fans', 'Stadium', stats.stadium],
      ['Fans', 'Total Fans', totalFans],
      ['Gender', 'Female', stats.female],
      ['Gender', 'Male', stats.male],
      ['Gender', 'Total Gender', totalGender],
      ['Age', 'Gen Alpha', stats.genAlpha],
      ['Age', 'Gen Y+Z', stats.genYZ],
      ['Age', 'Total Under 40', totalUnder40],
      ['Age', 'Gen X', stats.genX],
      ['Age', 'Boomer', stats.boomer],
      ['Age', 'Total Over 40', totalOver40],
      ['Age', 'Total Age', totalAge],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf', stats.scarf],
      ['Merchandise', 'Flags', stats.flags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap],
      ['Merchandise', 'Other', stats.other],
      ['Merchandise', 'Total Merch', totalMerch]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${eventName || 'event'}_stats_${eventDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToGoogleSheets = () => {
    const data = [
      ['Event Name:', eventName || 'Untitled Event'],
      ['Event Date:', eventDate],
      ['Generated:', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'Selfies', stats.selfies],
      ['Images', 'Total Images', totalImages],
      ['Fans', 'Indoor', stats.indoor],
      ['Fans', 'Outdoor', stats.outdoor],
      ['Fans', 'Stadium', stats.stadium],
      ['Fans', 'Total Fans', totalFans],
      ['Gender', 'Female', stats.female],
      ['Gender', 'Male', stats.male],
      ['Gender', 'Total Gender', totalGender],
      ['Age', 'Gen Alpha', stats.genAlpha],
      ['Age', 'Gen Y+Z', stats.genYZ],
      ['Age', 'Total Under 40', totalUnder40],
      ['Age', 'Gen X', stats.genX],
      ['Age', 'Boomer', stats.boomer],
      ['Age', 'Total Over 40', totalOver40],
      ['Age', 'Total Age', totalAge],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf', stats.scarf],
      ['Merchandise', 'Flags', stats.flags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap],
      ['Merchandise', 'Other', stats.other],
      ['Merchandise', 'Total Merch', totalMerch]
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const encodedData = encodeURIComponent(csvContent);
    const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?usp=drive_web#paste=${encodedData}`;
    
    window.open(googleSheetsUrl, '_blank');
  };

  const StatCard = ({ label, value, statKey, isCalculated = false, isWarning = false }: { 
    label: string; 
    value: number; 
    statKey?: keyof typeof stats;
    isCalculated?: boolean;
    isWarning?: boolean;
  }) => (
    <div className={styles.statCardContainer}>
      <div 
        className={`${styles.statCard} ${isCalculated ? styles.calculatedCard : ''} ${isWarning ? styles.warningCard : ''}`} 
        onClick={statKey ? () => incrementStat(statKey) : undefined}
        style={{ cursor: isCalculated ? 'default' : 'pointer' }}
      >
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value}</div>
      </div>
      {/* Add decrement button for clickable stats */}
      {statKey && !isCalculated && (
        <button
          className={styles.decrementButton}
          onClick={(e) => {
            e.stopPropagation();
            decrementStat(statKey);
          }}
          disabled={value === 0}
        >
          -1
        </button>
      )}
    </div>
  );

  // Success Manager Input Card Component (no decrement button, input field instead of click-to-increment)
  const SuccessManagerCard = ({ label, value, statKey }: { 
    label: string; 
    value: number; 
    statKey: keyof typeof stats;
  }) => {
    const [tempValue, setTempValue] = useState(value);

    // Update temp value when prop value changes (from WebSocket or project load)
    useEffect(() => {
      setTempValue(value);
    }, [value]);

    const handleBlur = () => {
      const newValue = Math.max(0, parseInt(tempValue.toString()) || 0);
      if (newValue !== value) {
        // Update stats
        setStats(prev => ({
          ...prev,
          [statKey]: newValue
        }));
        // Broadcast to other users
        if (currentProjectId && isConnected) {
          sendWebSocketMessage({
            type: 'stat_increment',
            statKey: statKey,
            newValue
          });
        }
      }
    };

    return (
      <div className={styles.statCardContainer}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>{label}</div>
          <input
            type="number"
            value={tempValue}
            onChange={(e) => {
              const newValue = Math.max(0, parseInt(e.target.value) || 0);
              setTempValue(newValue);
            }}
            onBlur={handleBlur}
            className={styles.successManagerInput}
            min="0"
          />
        </div>
      </div>
    );
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={styles.connectionStatus}>
      <div className={`${styles.statusIndicator} ${styles[connectionStatus]}`}>
        {connectionStatus === 'connected' && '🟢'}
        {connectionStatus === 'connecting' && '🟡'}
        {connectionStatus === 'disconnected' && '🔴'}
        {connectionStatus === 'error' && '❌'}
      </div>
      <span className={styles.statusText}>
        {connectionStatus === 'connected' && `Connected (${activeUsers} user${activeUsers !== 1 ? 's' : ''})`}
        {connectionStatus === 'connecting' && 'Connecting...'}
        {connectionStatus === 'disconnected' && 'Offline'}
        {connectionStatus === 'error' && 'Connection Error'}
      </span>
    </div>
  );

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          {/* Dynamic Title based on project selection */}
          {currentProjectId && eventName ? (
            <>
              <h1 className={styles.title}>{eventName}</h1>
              <p className={styles.subtitle}>{new Date(eventDate).toLocaleDateString()}</p>
            </>
          ) : (
            <>
              <h1 className={styles.title}>MessMass</h1>
              <p className={styles.subtitle}>Event Statistics Dashboard</p>
            </>
          )}
          
          {/* Real-time collaboration status */}
          <ConnectionStatus />
          {lastUpdate && (
            <div className={styles.lastUpdate}>
              📡 {lastUpdate}
            </div>
          )}
          
          <div className={styles.projectControls}>
            <button 
              className={styles.projectButton} 
              onClick={() => setShowProjects(!showProjects)}
            >
              📁 {showProjects ? 'Hide' : 'Show'} Projects ({projects.length})
            </button>
            <button className={styles.newProjectButton} onClick={startNewProject}>
              ➕ New Project
            </button>
            {saveStatus === 'saving' && <span className={styles.saveStatus}>💾 Auto-saving...</span>}
            {saveStatus === 'saved' && <span className={styles.saveStatus}>✅ Auto-saved</span>}
            {saveStatus === 'error' && <span className={styles.saveStatus}>❌ Save Error</span>}
          </div>
        </div>

        {showProjects && (
          <div className={styles.projectsList}>
            <h3>Your Projects</h3>
            {projects.length === 0 ? (
              <p>No projects saved yet. Create your first project by adding an event name and date above.</p>
            ) : (
              <div className={styles.projectsGrid}>
                {projects.map((project) => (
                  <div 
                    key={project._id} 
                    className={`${styles.projectCard} ${currentProjectId === project._id ? styles.activeProject : ''}`}
                  >
                    <div className={styles.projectInfo}>
                      <h4>{project.eventName}</h4>
                      <p>{new Date(project.eventDate).toLocaleDateString()}</p>
                      <small>Updated: {new Date(project.updatedAt).toLocaleDateString()}</small>
                    </div>
                    <div className={styles.projectActions}>
                      <button onClick={() => loadProject(project)} className={styles.loadButton}>
                        📂 Load
                      </button>
                      <button onClick={() => deleteProject(project._id)} className={styles.deleteButton}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Only show input form when no project is selected */}
        {!currentProjectId && (
          <div className={styles.eventInfo}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Event Name:</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name..."
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Event Date:</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.saveProjectGroup}>
              <button 
                className={styles.saveProjectButton} 
                onClick={saveProject}
                disabled={!eventName.trim() || saveStatus === 'saving'}
              >
                💾 Save Project
              </button>
            </div>
          </div>
        )}

        {/* Reorganized Statistics */}
        <div className={styles.statsGrid}>
          {/* Images Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Images ({totalImages})</h3>
            <div className={styles.statsRow}>
              <StatCard label="Remote Images" value={stats.remoteImages} statKey="remoteImages" />
              <StatCard label="Hostess Images" value={stats.hostessImages} statKey="hostessImages" />
              <StatCard label="Selfies" value={stats.selfies} statKey="selfies" />
            </div>
          </div>

          {/* Fans Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Fans ({totalFans})</h3>
            <div className={styles.statsRow}>
              <StatCard label="Indoor" value={stats.indoor} statKey="indoor" />
              <StatCard label="Outdoor" value={stats.outdoor} statKey="outdoor" />
              <StatCard label="Stadium" value={stats.stadium} statKey="stadium" />
            </div>
          </div>

          {/* Gender Section */}
          <div className={styles.section}>
            <h3 className={`${styles.sectionTitle} ${totalGender !== totalFans ? styles.warningTitle : ''}`}>
              Gender ({totalGender})
            </h3>
            <div className={styles.statsRow}>
              <StatCard label="Female" value={stats.female} statKey="female" />
              <StatCard label="Male" value={stats.male} statKey="male" />
              <StatCard 
                label="Total Gender" 
                value={totalGender} 
                isCalculated={true} 
                isWarning={totalGender !== totalFans} 
              />
            </div>
          </div>

          {/* Age Section */}
          <div className={styles.section}>
            <h3 className={`${styles.sectionTitle} ${totalAge !== totalFans ? styles.warningTitle : ''}`}>
              Age ({totalAge})
            </h3>
            <div className={styles.ageGrid}>
              <StatCard label="Gen Alpha" value={stats.genAlpha} statKey="genAlpha" />
              <StatCard label="Gen Y+Z" value={stats.genYZ} statKey="genYZ" />
              <StatCard label="Total Under 40" value={totalUnder40} isCalculated={true} />
              <StatCard label="Gen X" value={stats.genX} statKey="genX" />
              <StatCard label="Boomer" value={stats.boomer} statKey="boomer" />
              <StatCard label="Total Over 40" value={totalOver40} isCalculated={true} />
            </div>
          </div>

          {/* Merchandise Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Merch ({totalMerch})</h3>
            <div className={styles.statsRow}>
              <StatCard label="Merched" value={stats.merched} statKey="merched" />
              <StatCard label="Jersey" value={stats.jersey} statKey="jersey" />
              <StatCard label="Scarf" value={stats.scarf} statKey="scarf" />
            </div>
            <div className={styles.statsRow}>
              <StatCard label="Flags" value={stats.flags} statKey="flags" />
              <StatCard label="Baseball Cap" value={stats.baseballCap} statKey="baseballCap" />
              <StatCard label="Other" value={stats.other} statKey="other" />
            </div>
          </div>

          {/* Success Manager Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Success Manager</h3>
            
            {/* Image Management */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Image Management</h4>
              <div className={styles.statsRow}>
                <SuccessManagerCard label="Approved Images" value={stats.approvedImages} statKey="approvedImages" />
                <SuccessManagerCard label="Rejected Images" value={stats.rejectedImages} statKey="rejectedImages" />
              </div>
            </div>

            {/* Visit Tracking */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Visit Tracking</h4>
              <div className={styles.statsRow}>
                <SuccessManagerCard label="QR Code Visits" value={stats.visitQrCode} statKey="visitQrCode" />
                <SuccessManagerCard label="Short URL Visits" value={stats.visitShortUrl} statKey="visitShortUrl" />
                <SuccessManagerCard label="Web Visits" value={stats.visitWeb} statKey="visitWeb" />
              </div>
            </div>

            {/* Social Media Visits */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Social Media Visits</h4>
              <div className={styles.statsRow}>
                <SuccessManagerCard label="Facebook Visits" value={stats.visitFacebook} statKey="visitFacebook" />
                <SuccessManagerCard label="Instagram Visits" value={stats.visitInstagram} statKey="visitInstagram" />
                <SuccessManagerCard label="YouTube Visits" value={stats.visitYoutube} statKey="visitYoutube" />
              </div>
              <div className={styles.statsRow}>
                <SuccessManagerCard label="TikTok Visits" value={stats.visitTiktok} statKey="visitTiktok" />
                <SuccessManagerCard label="X Visits" value={stats.visitX} statKey="visitX" />
                <SuccessManagerCard label="Trustpilot Visits" value={stats.visitTrustpilot} statKey="visitTrustpilot" />
              </div>
            </div>

            {/* Event Performance */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Event Performance</h4>
              <div className={styles.statsRow}>
                <SuccessManagerCard label="Event Attendees" value={stats.eventAttendees} statKey="eventAttendees" />
                <SuccessManagerCard label="Ticket Purchases" value={stats.eventTicketPurchases} statKey="eventTicketPurchases" />
                <SuccessManagerCard label="Event Result Home" value={stats.eventResultHome} statKey="eventResultHome" />
                <SuccessManagerCard label="Event Result Visitor" value={stats.eventResultVisitor} statKey="eventResultVisitor" />
              </div>
            </div>

            {/* Value Proposition */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Value Proposition</h4>
              <div className={styles.statsRow}>
                <SuccessManagerCard label="Value Prop Visited" value={stats.eventValuePropositionVisited} statKey="eventValuePropositionVisited" />
                <SuccessManagerCard label="Value Prop Purchases" value={stats.eventValuePropositionPurchases} statKey="eventValuePropositionPurchases" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}