// app/page.tsx - Complete version with WebSocket and Success Manager
'use client'

import { useState, useEffect, useCallback } from 'react'

interface Stats {
  remoteImages: number
  hostessImages: number
  selfies: number
  indoor: number
  outdoor: number
  stadium: number
  female: number
  male: number
  genAlpha: number
  genYZ: number
  genX: number
  boomer: number
  merched: number
  jersey: number
  scarf: number
  flags: number
  baseballCap: number
  other: number
  // Success Manager fields
  approvedImages: number
  rejectedImages: number
  visitQrCode: number
  visitShortUrl: number
  visitQrSearched: number
  visitWeb: number
  visitFacebook: number
  visitInstagram: number
  visitYoutube: number
  visitTiktok: number
  visitX: number
  visitTrustpilot: number
  eventAttendees: number
  eventTicketPurchases: number
  eventResultHome: number
  eventResultVisitor: number
  eventValuePropositionVisited: number
  eventValuePropositionPurchases: number
}

interface Project {
  _id: string
  eventName: string
  eventDate: string
  stats: Stats
}

export default function MessMassApp() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [connectedUsers, setConnectedUsers] = useState(0)
  
  const [stats, setStats] = useState<Stats>({
    remoteImages: 0,
    hostessImages: 0,
    selfies: 0,
    indoor: 0,
    outdoor: 0,
    stadium: 0,
    female: 0,
    male: 0,
    genAlpha: 0,
    genYZ: 0,
    genX: 0,
    boomer: 0,
    merched: 0,
    jersey: 0,
    scarf: 0,
    flags: 0,
    baseballCap: 0,
    other: 0,
    // Success Manager defaults
    approvedImages: 0,
    rejectedImages: 0,
    visitQrCode: 0,
    visitShortUrl: 0,
    visitQrSearched: 0,
    visitWeb: 0,
    visitFacebook: 0,
    visitInstagram: 0,
    visitYoutube: 0,
    visitTiktok: 0,
    visitX: 0,
    visitTrustpilot: 0,
    eventAttendees: 0,
    eventTicketPurchases: 0,
    eventResultHome: 0,
    eventResultVisitor: 0,
    eventValuePropositionVisited: 0,
    eventValuePropositionPurchases: 0
  })

  // WebSocket connection
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:7654'
    console.log('🔌 Connecting to WebSocket:', wsUrl)
    
    const connectWebSocket = () => {
      setConnectionStatus('connecting')
      const websocket = new WebSocket(wsUrl)
      
      websocket.onopen = () => {
        console.log('✅ WebSocket connected')
        setConnectionStatus('connected')
        setWs(websocket)
        
        if (currentProject) {
          websocket.send(JSON.stringify({
            type: 'join-project',
            projectId: currentProject._id
          }))
        }
      }
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket message:', data)
          
          switch (data.type) {
            case 'connected':
              console.log('🎉 WebSocket connection confirmed:', data.clientId)
              break
            case 'project-joined':
            case 'user-joined':
            case 'user-left':
              setConnectedUsers(data.usersInRoom || 0)
              break
            case 'stat-updated':
              if (data.projectId === currentProject?._id) {
                setStats(prev => ({
                  ...prev,
                  [data.field]: data.value
                }))
              }
              break
          }
        } catch (error) {
          console.error('❌ WebSocket message error:', error)
        }
      }
      
      websocket.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        setConnectionStatus('disconnected')
        setWs(null)
        setConnectedUsers(0)
        
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setConnectionStatus('disconnected')
      }
    }
    
    connectWebSocket()
    
    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [currentProject])

  // Fetch projects on load
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (data.success) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const updateStat = useCallback(async (field: keyof Stats, increment: number = 1) => {
    if (!currentProject) return

    const newValue = Math.max(0, stats[field] + increment)
    
    // Optimistic update
    setStats(prev => ({
      ...prev,
      [field]: newValue
    }))

    try {
      // Update database
      const response = await fetch(`/api/projects/${currentProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stats: {
            ...stats,
            [field]: newValue
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      // Broadcast via WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'stat-update',
          field: field,
          value: newValue,
          projectId: currentProject._id
        }))
      }

    } catch (error) {
      console.error('Error updating stat:', error)
      // Revert optimistic update
      setStats(prev => ({
        ...prev,
        [field]: Math.max(0, newValue - increment)
      }))
    }
  }, [currentProject, stats, ws])

  const updateSuccessManagerField = async (field: keyof Stats, value: number) => {
    if (!currentProject) return

    // Update local state
    setStats(prev => ({ ...prev, [field]: value }))

    // Update database
    try {
      const response = await fetch(`/api/projects/${currentProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stats: {
            ...stats,
            [field]: value
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      // Broadcast WebSocket update for Success Manager fields
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'stat-update',
          field: field,
          value: value,
          projectId: currentProject._id
        }))
      }

    } catch (error) {
      console.error('Error updating success manager field:', error)
      // Revert local state on error
      setStats(prev => ({ ...prev, [field]: stats[field] }))
    }
  }

  const createProject = async () => {
    if (!eventName || !eventDate) return

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventName, eventDate }),
      })

      const data = await response.json()
      if (data.success) {
        setCurrentProject(data.project)
        setStats(data.project.stats)
        setShowForm(false)
        fetchProjects()
        
        // Join project room via WebSocket
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'join-project',
            projectId: data.project._id
          }))
        }
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const loadProject = async (project: Project) => {
    setCurrentProject(project)
    setStats(project.stats)
    setShowForm(false)
    
    // Join project room via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'join-project',
        projectId: project._id
      }))
    }
  }

  const resetStats = async () => {
    if (!currentProject || !confirm('Are you sure you want to reset all statistics?')) return

    const resetStatsData = Object.keys(stats).reduce((acc, key) => {
      acc[key as keyof Stats] = 0
      return acc
    }, {} as Stats)

    setStats(resetStatsData)

    try {
      await fetch(`/api/projects/${currentProject._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stats: resetStatsData }),
      })
    } catch (error) {
      console.error('Error resetting stats:', error)
    }
  }

  const exportData = () => {
    if (!currentProject) return

    const csvData = [
      ['Field', 'Value'],
      ['Event Name', currentProject.eventName],
      ['Event Date', currentProject.eventDate],
      ['', ''],
      ['Images', ''],
      ['Remote Images', stats.remoteImages],
      ['Hostess Images', stats.hostessImages],
      ['Selfies', stats.selfies],
      ['', ''],
      ['Fans', ''],
      ['Indoor', stats.indoor],
      ['Outdoor', stats.outdoor],
      ['Stadium', stats.stadium],
      ['', ''],
      ['Gender', ''],
      ['Female', stats.female],
      ['Male', stats.male],
      ['', ''],
      ['Age Groups', ''],
      ['Gen Alpha', stats.genAlpha],
      ['Gen Y+Z', stats.genYZ],
      ['Gen X', stats.genX],
      ['Boomer', stats.boomer],
      ['', ''],
      ['Merchandise', ''],
      ['Merched', stats.merched],
      ['Jersey', stats.jersey],
      ['Scarf', stats.scarf],
      ['Flags', stats.flags],
      ['Baseball Cap', stats.baseballCap],
      ['Other', stats.other]
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProject.eventName.replace(/[^a-z0-9]/gi, '_')}_stats.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const deleteCurrentProject = async () => {
    if (!currentProject || !confirm('Are you sure you want to delete this project?')) return

    try {
      await fetch(`/api/projects/${currentProject._id}`, {
        method: 'DELETE',
      })
      
      setCurrentProject(null)
      setStats({
        remoteImages: 0, hostessImages: 0, selfies: 0,
        indoor: 0, outdoor: 0, stadium: 0,
        female: 0, male: 0,
        genAlpha: 0, genYZ: 0, genX: 0, boomer: 0,
        merched: 0, jersey: 0, scarf: 0, flags: 0, baseballCap: 0, other: 0,
        approvedImages: 0, rejectedImages: 0,
        visitQrCode: 0, visitShortUrl: 0, visitQrSearched: 0, visitWeb: 0,
        visitFacebook: 0, visitInstagram: 0, visitYoutube: 0, visitTiktok: 0, visitX: 0, visitTrustpilot: 0,
        eventAttendees: 0, eventTicketPurchases: 0, eventResultHome: 0, eventResultVisitor: 0,
        eventValuePropositionVisited: 0, eventValuePropositionPurchases: 0
      })
      setShowForm(true)
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  return (
    <div className="app-container">
      <div className="glass-card" style={{width: '100%', maxWidth: '1200px', padding: '2rem'}}>
        {/* Dynamic Title */}
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 className="title">
            {currentProject ? currentProject.eventName : 'MessMass'}
          </h1>
          <p className="subtitle">
            {currentProject ? currentProject.eventDate : 'Event Statistics Dashboard'}
          </p>
        </div>

        {/* Connection Status */}
        <div className={`connection-status connection-${connectionStatus}`}>
          {connectionStatus === 'connected' && '🟢 Connected'}
          {connectionStatus === 'connecting' && '🟡 Connecting...'}
          {connectionStatus === 'disconnected' && '🔴 Disconnected'}
          {connectedUsers > 0 && ` • ${connectedUsers} users online`}
        </div>

        {/* Project Selection/Creation */}
        {showForm && (
          <div style={{marginBottom: '2rem'}}>
            <div className="form-group">
              <select 
                onChange={(e) => {
                  const selectedProject = projects.find(p => p._id === e.target.value)
                  if (selectedProject) {
                    loadProject(selectedProject)
                  }
                }}
                className="form-input"
                style={{marginBottom: '1rem'}}
              >
                <option value="">Select existing project...</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.eventName} - {project.eventDate}
                  </option>
                ))}
              </select>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="form-input"
                  placeholder="Enter event name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <button 
              onClick={createProject}
              disabled={!eventName || !eventDate}
              className="btn btn-primary btn-large"
              style={{width: '100%'}}
            >
              Create New Project
            </button>
          </div>
        )}

        {/* Main Statistics Grid */}
        {currentProject && (
          <>
            <div className="stats-grid">
              {/* Images Section */}
              <div className="stat-card">
                <div className="stat-value">{stats.remoteImages + stats.hostessImages + stats.selfies}</div>
                <div className="stat-label">Images</div>
              </div>

              {/* Fans Section */}
              <div className="stat-card">
                <div className="stat-value">{stats.indoor + stats.outdoor + stats.stadium}</div>
                <div className="stat-label">Fans</div>
              </div>

              {/* Gender Section */}
              <div className="stat-card">
                <div className="stat-value" style={{color: stats.female + stats.male !== stats.indoor + stats.outdoor + stats.stadium ? '#ef4444' : 'inherit'}}>
                  {stats.female + stats.male}
                </div>
                <div className="stat-label" style={{color: stats.female + stats.male !== stats.indoor + stats.outdoor + stats.stadium ? '#ef4444' : 'inherit'}}>
                  Gender
                </div>
              </div>

              {/* Age Section */}
              <div className="stat-card">
                <div className="stat-value" style={{color: stats.genAlpha + stats.genYZ + stats.genX + stats.boomer !== stats.indoor + stats.outdoor + stats.stadium ? '#ef4444' : 'inherit'}}>
                  {stats.genAlpha + stats.genYZ + stats.genX + stats.boomer}
                </div>
                <div className="stat-label" style={{color: stats.genAlpha + stats.genYZ + stats.genX + stats.boomer !== stats.indoor + stats.outdoor + stats.stadium ? '#ef4444' : 'inherit'}}>
                  Age
                </div>
              </div>

              {/* Merch Section */}
              <div className="stat-card">
                <div className="stat-value">{stats.merched + stats.jersey + stats.scarf + stats.flags + stats.baseballCap + stats.other}</div>
                <div className="stat-label">Merch</div>
              </div>
            </div>

            {/* Counter Buttons Grid */}
            <div className="counter-grid">
              {/* Images */}
              <div className="counter-item">
                <button onClick={() => updateStat('remoteImages')} className="counter-btn">
                  <div className="counter-value">{stats.remoteImages}</div>
                  Remote Images
                </button>
                <button onClick={() => updateStat('remoteImages', -1)} disabled={stats.remoteImages === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('hostessImages')} className="counter-btn">
                  <div className="counter-value">{stats.hostessImages}</div>
                  Hostess Images
                </button>
                <button onClick={() => updateStat('hostessImages', -1)} disabled={stats.hostessImages === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('selfies')} className="counter-btn">
                  <div className="counter-value">{stats.selfies}</div>
                  Selfies
                </button>
                <button onClick={() => updateStat('selfies', -1)} disabled={stats.selfies === 0} className="decrement-btn">-1</button>
              </div>

              {/* Fans */}
              <div className="counter-item">
                <button onClick={() => updateStat('indoor')} className="counter-btn">
                  <div className="counter-value">{stats.indoor}</div>
                  Indoor
                </button>
                <button onClick={() => updateStat('indoor', -1)} disabled={stats.indoor === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('outdoor')} className="counter-btn">
                  <div className="counter-value">{stats.outdoor}</div>
                  Outdoor
                </button>
                <button onClick={() => updateStat('outdoor', -1)} disabled={stats.outdoor === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('stadium')} className="counter-btn">
                  <div className="counter-value">{stats.stadium}</div>
                  Stadium
                </button>
                <button onClick={() => updateStat('stadium', -1)} disabled={stats.stadium === 0} className="decrement-btn">-1</button>
              </div>

              {/* Gender */}
              <div className="counter-item">
                <button onClick={() => updateStat('female')} className="counter-btn">
                  <div className="counter-value">{stats.female}</div>
                  Female
                </button>
                <button onClick={() => updateStat('female', -1)} disabled={stats.female === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('male')} className="counter-btn">
                  <div className="counter-value">{stats.male}</div>
                  Male
                </button>
                <button onClick={() => updateStat('male', -1)} disabled={stats.male === 0} className="decrement-btn">-1</button>
              </div>

              {/* Age Groups */}
              <div className="counter-item">
                <button onClick={() => updateStat('genAlpha')} className="counter-btn">
                  <div className="counter-value">{stats.genAlpha}</div>
                  Gen Alpha
                </button>
                <button onClick={() => updateStat('genAlpha', -1)} disabled={stats.genAlpha === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('genYZ')} className="counter-btn">
                  <div className="counter-value">{stats.genYZ}</div>
                  Gen Y+Z
                </button>
                <button onClick={() => updateStat('genYZ', -1)} disabled={stats.genYZ === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('genX')} className="counter-btn">
                  <div className="counter-value">{stats.genX}</div>
                  Gen X
                </button>
                <button onClick={() => updateStat('genX', -1)} disabled={stats.genX === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('boomer')} className="counter-btn">
                  <div className="counter-value">{stats.boomer}</div>
                  Boomer
                </button>
                <button onClick={() => updateStat('boomer', -1)} disabled={stats.boomer === 0} className="decrement-btn">-1</button>
              </div>

              {/* Merchandise */}
              <div className="counter-item">
                <button onClick={() => updateStat('merched')} className="counter-btn">
                  <div className="counter-value">{stats.merched}</div>
                  Merched
                </button>
                <button onClick={() => updateStat('merched', -1)} disabled={stats.merched === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('jersey')} className="counter-btn">
                  <div className="counter-value">{stats.jersey}</div>
                  Jersey
                </button>
                <button onClick={() => updateStat('jersey', -1)} disabled={stats.jersey === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('scarf')} className="counter-btn">
                  <div className="counter-value">{stats.scarf}</div>
                  Scarf
                </button>
                <button onClick={() => updateStat('scarf', -1)} disabled={stats.scarf === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('flags')} className="counter-btn">
                  <div className="counter-value">{stats.flags}</div>
                  Flags
                </button>
                <button onClick={() => updateStat('flags', -1)} disabled={stats.flags === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('baseballCap')} className="counter-btn">
                  <div className="counter-value">{stats.baseballCap}</div>
                  Baseball Cap
                </button>
                <button onClick={() => updateStat('baseballCap', -1)} disabled={stats.baseballCap === 0} className="decrement-btn">-1</button>
              </div>

              <div className="counter-item">
                <button onClick={() => updateStat('other')} className="counter-btn">
                  <div className="counter-value">{stats.other}</div>
                  Other
                </button>
                <button onClick={() => updateStat('other', -1)} disabled={stats.other === 0} className="decrement-btn">-1</button>
              </div>
            </div>

            {/* Project Actions */}
            <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
              <button className="btn btn-secondary" onClick={resetStats}>
                Reset Stats
              </button>
              <button className="btn btn-success" onClick={exportData}>
                Export Data
              </button>
              <button className="btn btn-danger" onClick={deleteCurrentProject}>
                Delete Project
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}