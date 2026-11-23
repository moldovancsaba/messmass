// lib/theme/reportTerminology.ts
// WHAT: Canonical, single-source-of-truth sports analytics terminology for all interactive reports.
// WHY: Aligns every UI surface with global industry standards (Nielsen Sports, Blinkfire, SponsorUnited, Two Circles, Deloitte).

export const REPORT_TERMS = {
  // Entities & Scope
  matchSingular: 'match',
  matchPlural: 'matches',
  matchTitle: 'Match',
  matchesTitle: 'Matches',
  homeMatches: 'Home Matches',
  allMatches: 'All Matches (Home + Away)',

  // Attendance & Venue
  attendance: 'Attendance',
  totalAttendance: 'Total Attendance',
  averageAttendance: 'Average Attendance',
  venueCapacity: 'Venue Capacity',
  seatOccupancy: 'Seat Occupancy',
  seatOccupancyPct: 'Seat Occupancy (%)',
  emptySeats: 'Empty Seats',
  indoorArenas: 'Indoor Arenas',

  // Photos & Participation
  fanPhotos: 'Fan Photos',
  analyzedPhotos: 'Analyzed Photos',
  peopleInPhotos: 'People in Photos',
  photoParticipationRate: 'Photo Participation Rate',
  photosPer1kFans: 'Photos per 1,000 Fans',

  // Consent & First-Party Data
  imageRightsConsent: 'Image Rights Consent',
  marketingOptIn: 'Marketing Opt-In',
  marketingOptInRate: 'Marketing Opt-In Rate',
  firstPartyLeads: 'First-Party Leads',

  // Sponsorship & Merchandise
  sponsorBrandVisibility: 'Sponsor Brand Visibility',
  brandExposures: 'Brand Exposures',
  teamMerchandise: 'Team Merchandise',
  merchWearersVsCasuals: 'Merchandise Wearers vs. Casual Fans',
  estimatedCoreFanbase: 'Estimated Core Fanbase',
  dieHardSupporters: 'Die-Hard Supporters',

  // Audience & Sentiment
  audienceDemographics: 'Audience Demographics',
  genderSplit: 'Gender Split',
  ageGroups: 'Age Groups',
  fanSentiment: 'Fan Sentiment',
  under60Share: 'Under-60 Audience Share',

  // Valuation & Digital
  estimatedMediaValue: 'Estimated Media Value (EMV)',
  digitalEngagement: 'Digital Engagement',
  linkClicks: 'Link Clicks',
  qrScans: 'QR Scans',
  engagementRate: 'Engagement Rate',
} as const;
