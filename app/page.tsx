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
  remoteImages: 0,
  hostessImages: 0,
  remoteFans: 0,
  onLocationFan: 0,
  female: 0,
  male: 0,
  genAlpha: 0,
  genYZ: 0,
  genX: 0,
  boomer: 0,
  merched: 0,
  jersey: 0,
  scarfFlags: 0,
  baseballCap: 0
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
        ? 'wss://your-websocket-server.com' 
        : 'ws://localhost:8080';
      
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
        if (message.projectState) {
          // Sync with server state
          setEventName(message.projectState.eventName || '');
          setEventDate(message.projectState.eventDate || new Date().toISOString().split('T')[0]);
          setStats(message.projectState.stats || initialStats);
        }
        break;

      case 'user_joined':
      case 'user_left':
        setActiveUsers(message.activeUsers);
        setLastUpdate(`User ${message.type.split('_')[1]} at ${new Date(message.timestamp).toLocaleTimeString()}`);
        break;

      case 'stat_updated':
        if (message.updatedBy !== connectionIdRef.current) {
          // Update from another user
          setStats(prev => ({
            ...prev,
            [message.statKey]: message.newValue
          }));
          setLastUpdate(`${message.statKey} updated by another user`);
        }
        break;

      case 'project_updated':
        if (message.updatedBy !== connectionIdRef.current) {
          // Update from another user
          setEventName(message.eventName);
          setEventDate(message.eventDate);
          setStats(message.stats);
          setLastUpdate(`Project updated by another user at ${new Date(message.timestamp).toLocaleTimeString()}`);
        }
        break;

      case 'stats_reset':
        if (message.resetBy !== connectionIdRef.current) {
          // Reset from another user
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
  const joinProjectRoom = useCallback((projectId: string, projectData?: any) => {
    if (!sendWebSocketMessage({
      type: 'join_project',
      projectId,
      projectData
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
      joinProjectRoom(currentProjectId, {
        eventName,
        eventDate,
        stats
      });
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
          joinProjectRoom(data.projectId, projectData);
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

  const loadProject = (project: Project) => {
    // Leave current project room
    if (currentProjectId && isConnected) {
      leaveProjectRoom();
    }
    
    setCurrentProjectId(project._id);
    setEventName(project.eventName);
    setEventDate(project.eventDate);
    setStats(project.stats);
    setShowProjects(false);
    
    // Join new project room will be handled by useEffect
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
  const totalSelfies = stats.remoteImages + stats.hostessImages;
  const totalFans = stats.remoteFans + stats.onLocationFan;
  const totalDemographic = stats.female + stats.male;
  const totalUnder40 = stats.genAlpha + stats.genYZ;
  const totalOver40 = stats.genX + stats.boomer;
  const totalAge = stats.genAlpha + stats.genYZ + stats.genX + stats.boomer;

  const downloadCSV = () => {
    const csvData = [
      ['Event Name', eventName || 'Untitled Event'],
      ['Event Date', eventDate],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Category', 'Metric', 'Count'],
      ['Images', 'Remote Images', stats.remoteImages],
      ['Images', 'Hostess Images', stats.hostessImages],
      ['Images', 'All Selfies', totalSelfies],
      ['Fans', 'Remote Fans', stats.remoteFans],
      ['Fans', 'On Location Fan', stats.onLocationFan],
      ['Fans', 'Total Fans', totalFans],
      ['Demographics', 'Female', stats.female],
      ['Demographics', 'Male', stats.male],
      ['Demographics', 'Total Demographic', totalDemographic],
      ['Age Groups', 'Gen Alpha', stats.genAlpha],
      ['Age Groups', 'Gen Y+Z', stats.genYZ],
      ['Age Groups', 'Total Under 40', totalUnder40],
      ['Age Groups', 'Gen X', stats.genX],
      ['Age Groups', 'Boomer', stats.boomer],
      ['Age Groups', 'Total Over 40', totalOver40],
      ['Age Groups', 'Total Age Groups', totalAge],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf + Flags', stats.scarfFlags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap]
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
      ['Images', 'All Selfies', totalSelfies],
      ['Fans', 'Remote Fans', stats.remoteFans],
      ['Fans', 'On Location Fan', stats.onLocationFan],
      ['Fans', 'Total Fans', totalFans],
      ['Demographics', 'Female', stats.female],
      ['Demographics', 'Male', stats.male],
      ['Demographics', 'Total Demographic', totalDemographic],
      ['Age Groups', 'Gen Alpha', stats.genAlpha],
      ['Age Groups', 'Gen Y+Z', stats.genYZ],
      ['Age Groups', 'Total Under 40', totalUnder40],
      ['Age Groups', 'Gen X', stats.genX],
      ['Age Groups', 'Boomer', stats.boomer],
      ['Age Groups', 'Total Over 40', totalOver40],
      ['Age Groups', 'Total Age Groups', totalAge],
      ['Merchandise', 'Merched', stats.merched],
      ['Merchandise', 'Jersey', stats.jersey],
      ['Merchandise', 'Scarf + Flags', stats.scarfFlags],
      ['Merchandise', 'Baseball Cap', stats.baseballCap]
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const encodedData = encodeURIComponent(csvContent);
    const googleSheetsUrl = `https://docs.google.com/spreadsheets/create?usp=drive_web#paste=${encodedData}`;
    
    window.open(googleSheetsUrl, '_blank');
  };

  const StatCard = ({ label, value, statKey, isCalculated = false }: { 
    label: string; 
    value: number; 
    statKey?: keyof typeof stats;
    isCalculated?: boolean;
  }) => (
    <div 
      className={`${styles.statCard} ${isCalculated ? styles.calculatedCard : ''}`} 
      onClick={statKey ? () => incrementStat(statKey) : undefined}
      style={{ cursor: isCalculated ? 'default' : 'pointer' }}
    >
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );

  const WarningCard = ({ label, value, isWarning }: { 
    label: string; 
    value: number; 
    isWarning: boolean;
  }) => (
    <div className={`${styles.statCard} ${styles.calculatedCard} ${isWarning ? styles.warningCard : ''}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );

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
          <h1 className={styles.title}>MessMass</h1>
          <p className={styles.subtitle}>Event Statistics Dashboard</p>
          
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
            {saveStatus === 'saving' && <span className={styles.saveStatus}>💾 Saving...</span>}
            {saveStatus === 'saved' && <span className={styles.saveStatus}>✅ Saved</span>}
            {saveStatus === 'error' && <span className={styles.saveStatus}>❌ Error</span>}
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
              {currentProjectId ? '💾 Save as New Project' : '💾 Save Project'}
            </button>
            {currentProjectId && (
              <span className={styles.projectStatus}>
                📂 Editing: {eventName || 'Untitled'}
                {saveStatus === 'saving' && ' - Auto-saving...'}
                {saveStatus === 'saved' && ' - ✅ Auto-saved'}
              </span>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Images & Fans</h3>
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Images</h4>
              <div className={styles.statsRow}>
                <StatCard label="Remote Images" value={stats.remoteImages} statKey="remoteImages" />
                <StatCard label="Hostess Images" value={stats.hostessImages} statKey="hostessImages" />
                <StatCard label="All Selfies" value={totalSelfies} isCalculated={true} />
              </div>
            </div>
            <div className={styles.subsection}>
              <h4 className={styles.subsectionTitle}>Fans</h4>
              <div className={styles.statsRow}>
                <StatCard label="Remote Fans" value={stats.remoteFans} statKey="remoteFans" />
                <StatCard label="On Location Fan" value={stats.onLocationFan} statKey="onLocationFan" />
                <StatCard label="Total Fans" value={totalFans} isCalculated={true} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Demographics</h3>
            <div className={styles.statsRow}>
              <StatCard label="Female" value={stats.female} statKey="female" />
              <StatCard label="Male" value={stats.male} statKey="male" />
              <WarningCard 
                label="Total Demographic" 
                value={totalDemographic} 
                isWarning={totalDemographic !== totalFans} 
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Age Groups</h3>
            <div className={styles.ageGrid}>
              <StatCard label="Gen Alpha" value={stats.genAlpha} statKey="genAlpha" />
              <StatCard label="Gen Y+Z" value={stats.genYZ} statKey="genYZ" />
              <StatCard label="Total Under 40" value={totalUnder40} isCalculated={true} />
              <StatCard label="Gen X" value={stats.genX} statKey="genX" />
              <StatCard label="Boomer" value={stats.boomer} statKey="boomer" />
              <StatCard label="Total Over 40" value={totalOver40} isCalculated={true} />
            </div>
            <div className={styles.ageTotal}>
              <WarningCard 
                label="Total Age Groups" 
                value={totalAge} 
                isWarning={totalAge !== totalFans} 
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Merchandise</h3>
            <div className={styles.statsRow}>
              <StatCard label="Merched" value={stats.merched} statKey="merched" />
              <StatCard label="Jersey" value={stats.jersey} statKey="jersey" />
              <StatCard label="Scarf + Flags" value={stats.scarfFlags} statKey="scarfFlags" />
              <StatCard label="Baseball Cap" value={stats.baseballCap} statKey="baseballCap" />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.resetButton} onClick={resetStats}>
            Reset Stats
          </button>
          <button className={styles.exportButton} onClick={downloadCSV}>
            📄 Download CSV
          </button>
          <button className={styles.googleButton} onClick={exportToGoogleSheets}>
            📊 Export to Google Sheets
          </button>
        </div>
      </div>
    </main>
  );
}