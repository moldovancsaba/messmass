// app/page.tsx - Add Success Manager section to main page
'use client'

import { useState, useEffect } from 'react'
import SuccessManagerSection from '@/components/SuccessManagerSection'

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

export default function MessMassApp() {
  const [currentProject, setCurrentProject] = useState<any>(null)
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

  // ... (keep all existing state and useEffect hooks for WebSocket, projects, etc.)

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
        {!currentProject && (
          <div style={{marginBottom: '2rem'}}>
            {/* Project selection dropdown and creation form */}
            {/* ... (keep existing project selection code) */}
          </div>
        )}

        {/* Main Statistics Grid */}
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
        {currentProject && (
          <div className="counter-grid">
            {/* ... (keep all existing counter buttons) */}
          </div>
        )}

        {/* Success Manager Section */}
        <SuccessManagerSection
          projectId={currentProject?._id || null}
          data={{
            approvedImages: stats.approvedImages,
            rejectedImages: stats.rejectedImages,
            visitQrCode: stats.visitQrCode,
            visitShortUrl: stats.visitShortUrl,
            visitQrSearched: stats.visitQrSearched,
            visitWeb: stats.visitWeb,
            visitFacebook: stats.visitFacebook,
            visitInstagram: stats.visitInstagram,
            visitYoutube: stats.visitYoutube,
            visitTiktok: stats.visitTiktok,
            visitX: stats.visitX,
            visitTrustpilot: stats.visitTrustpilot,
            eventAttendees: stats.eventAttendees,
            eventTicketPurchases: stats.eventTicketPurchases,
            eventResultHome: stats.eventResultHome,
            eventResultVisitor: stats.eventResultVisitor,
            eventValuePropositionVisited: stats.eventValuePropositionVisited,
            eventValuePropositionPurchases: stats.eventValuePropositionPurchases
          }}
          onUpdate={updateSuccessManagerField}
        />

        {/* Project Actions */}
        {currentProject && (
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
        )}
      </div>
    </div>
  )
}