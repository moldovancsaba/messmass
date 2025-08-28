// components/SuccessManagerSection.tsx - Create this file
'use client'

import { useState, useEffect } from 'react'

interface SuccessManagerData {
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

interface SuccessManagerSectionProps {
  projectId: string | null
  data: SuccessManagerData
  onUpdate: (field: keyof SuccessManagerData, value: number) => void
}

const defaultData: SuccessManagerData = {
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
}

export default function SuccessManagerSection({ projectId, data, onUpdate }: SuccessManagerSectionProps) {
  const [localData, setLocalData] = useState<SuccessManagerData>(data || defaultData)

  useEffect(() => {
    setLocalData(data || defaultData)
  }, [data])

  const handleInputChange = (field: keyof SuccessManagerData, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0)
    setLocalData(prev => ({ ...prev, [field]: numValue }))
    onUpdate(field, numValue)
  }

  const fieldGroups = [
    {
      title: "Image Management",
      fields: [
        { key: 'approvedImages' as keyof SuccessManagerData, label: 'Approved Images', bold: true },
        { key: 'rejectedImages' as keyof SuccessManagerData, label: 'Rejected Images', bold: true }
      ]
    },
    {
      title: "Visit Tracking", 
      fields: [
        { key: 'visitQrCode' as keyof SuccessManagerData, label: 'Visit via QR Code', bold: true },
        { key: 'visitShortUrl' as keyof SuccessManagerData, label: 'Visit via Short URL', bold: false },
        { key: 'visitQrSearched' as keyof SuccessManagerData, label: 'Visit via QR Searched', bold: true },
        { key: 'visitWeb' as keyof SuccessManagerData, label: 'Visit via Web', bold: true }
      ]
    },
    {
      title: "Social Media Visits",
      fields: [
        { key: 'visitFacebook' as keyof SuccessManagerData, label: 'Visit via Facebook', bold: true },
        { key: 'visitInstagram' as keyof SuccessManagerData, label: 'Visit via Instagram', bold: true },
        { key: 'visitYoutube' as keyof SuccessManagerData, label: 'Visit via YouTube', bold: true },
        { key: 'visitTiktok' as keyof SuccessManagerData, label: 'Visit via TikTok', bold: true },
        { key: 'visitX' as keyof SuccessManagerData, label: 'Visit via X', bold: true },
        { key: 'visitTrustpilot' as keyof SuccessManagerData, label: 'Visit via Trust pilot', bold: true }
      ]
    },
    {
      title: "Event Performance",
      fields: [
        { key: 'eventAttendees' as keyof SuccessManagerData, label: 'Event Attendees', bold: true },
        { key: 'eventTicketPurchases' as keyof SuccessManagerData, label: 'Event Ticket Purchases', bold: true },
        { key: 'eventResultHome' as keyof SuccessManagerData, label: 'Event Result Home', bold: true },
        { key: 'eventResultVisitor' as keyof SuccessManagerData, label: 'Event Result Visitor', bold: true }
      ]
    },
    {
      title: "Value Proposition",
      fields: [
        { key: 'eventValuePropositionVisited' as keyof SuccessManagerData, label: 'Event Value Proposition Visited', bold: false },
        { key: 'eventValuePropositionPurchases' as keyof SuccessManagerData, label: 'Event Value Proposition Purchases', bold: true }
      ]
    }
  ]

  if (!projectId) {
    return (
      <div className="success-manager-section">
        <h2 className="success-manager-title">Success Manager</h2>
        <p className="success-manager-subtitle">Select or create a project to manage success metrics</p>
      </div>
    )
  }

  return (
    <div className="success-manager-section">
      <h2 className="success-manager-title">Success Manager</h2>
      
      {fieldGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="success-manager-group">
          <h3 className="success-manager-group-title">{group.title}</h3>
          <div className="success-manager-fields">
            {group.fields.map((field) => (
              <div key={field.key} className="success-manager-field">
                <label 
                  className={`success-manager-label ${field.bold ? 'bold' : ''}`}
                  htmlFor={field.key}
                >
                  {field.label}
                </label>
                <input
                  id={field.key}
                  type="number"
                  min="0"
                  value={localData[field.key]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="success-manager-input"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}