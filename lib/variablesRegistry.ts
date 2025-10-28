// lib/variablesRegistry.ts
// What: Centralized variable metadata registry for Admin → Variables UI.
// Why: Provide a single source of truth for base (stats) variables, derived variables,
// and dynamic text variables (hashtags + hashtag categories). This enables automatic
// exposure of new editable stats fields and newly added hashtag categories as variables
// without manual updates.

export type VariableType = 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date'

export interface VariableDefinition {
  name: string
  label: string
  type: VariableType
  category: string
  description?: string
  derived?: boolean
  formula?: string
  aliases?: string[]
}

// Base (stats) variables — keys match full database paths (stats.fieldName)
// WHAT: Single Reference System - all variable names use complete database field paths
// WHY: Eliminates ambiguity, prevents aliasing chaos, ensures database schema is the canonical source
export const BASE_STATS_VARIABLES: VariableDefinition[] = [
  // Images
  { name: 'stats.remoteImages', label: 'Remote Images', type: 'count', category: 'Images', description: 'Images taken remotely' },
  { name: 'stats.hostessImages', label: 'Hostess Images', type: 'count', category: 'Images', description: 'Images taken by hostesses' },
  { name: 'stats.selfies', label: 'Selfies', type: 'count', category: 'Images', description: 'Self-shot images' },

  // Fans (Location)
  // WHAT: Single source of truth for fan location metrics
  // WHY: Eliminated indoor/outdoor chaos - remoteFans is the aggregated remote count
  { name: 'stats.remoteFans', label: 'Remote Fans', type: 'count', category: 'Fans', description: 'Fans engaging remotely (not at venue)' },
  { name: 'stats.stadium', label: 'Stadium Fans', type: 'count', category: 'Fans', description: 'On-site fans at venue/stadium' },

  // Demographics
  { name: 'stats.female', label: 'Female', type: 'count', category: 'Demographics' },
  { name: 'stats.male', label: 'Male', type: 'count', category: 'Demographics' },
  { name: 'stats.genAlpha', label: 'Gen Alpha', type: 'count', category: 'Demographics' },
  { name: 'stats.genYZ', label: 'Gen Y+Z', type: 'count', category: 'Demographics' },
  { name: 'stats.genX', label: 'Gen X', type: 'count', category: 'Demographics' },
  { name: 'stats.boomer', label: 'Boomer', type: 'count', category: 'Demographics' },

  // Merchandise
  { name: 'stats.merched', label: 'People with Merch', type: 'count', category: 'Merchandise' },
  { name: 'stats.jersey', label: 'Jersey', type: 'count', category: 'Merchandise' },
  { name: 'stats.scarf', label: 'Scarf', type: 'count', category: 'Merchandise' },
  { name: 'stats.flags', label: 'Flags', type: 'count', category: 'Merchandise' },
  { name: 'stats.baseballCap', label: 'Baseball Cap', type: 'count', category: 'Merchandise' },
  { name: 'stats.other', label: 'Other', type: 'count', category: 'Merchandise' },

  // Moderation
  { name: 'stats.approvedImages', label: 'Approved Images', type: 'count', category: 'Moderation' },
  { name: 'stats.rejectedImages', label: 'Rejected Images', type: 'count', category: 'Moderation' },

  // Event
  { name: 'stats.eventAttendees', label: 'Event Attendees', type: 'count', category: 'Event' },
  { name: 'stats.eventResultHome', label: 'Event Result Home', type: 'count', category: 'Event' },
  { name: 'stats.eventResultVisitor', label: 'Event Result Visitor', type: 'count', category: 'Event' },

  // Bitly - Core Metrics
  { name: 'stats.bitlyTotalClicks', label: 'Total Bitly Clicks', type: 'count', category: 'Bitly', description: 'Sum of all Bitly link clicks for event' },
  { name: 'stats.bitlyUniqueClicks', label: 'Unique Bitly Clicks', type: 'count', category: 'Bitly', description: 'Unique visitors from Bitly links' },
  
  // Bitly - Geographic
  { name: 'stats.bitlyClicksByCountry', label: 'Clicks by Top Country', type: 'count', category: 'Bitly', description: 'Click count from top country' },
  { name: 'stats.bitlyTopCountry', label: 'Top Country', type: 'text', category: 'Bitly', description: 'Country with most clicks' },
  { name: 'stats.bitlyCountryCount', label: 'Countries Reached', type: 'count', category: 'Bitly', description: 'Number of unique countries' },
  
  // Bitly - Top 5 Countries (for chart display)
  { name: 'stats.bitlyCountry1', label: 'Country #1 Name', type: 'text', category: 'Bitly / Top Countries', description: 'Name of #1 country by clicks' },
  { name: 'stats.bitlyCountry1Clicks', label: 'Country #1 Clicks', type: 'count', category: 'Bitly / Top Countries', description: 'Click count for #1 country' },
  { name: 'stats.bitlyCountry2', label: 'Country #2 Name', type: 'text', category: 'Bitly / Top Countries', description: 'Name of #2 country by clicks' },
  { name: 'stats.bitlyCountry2Clicks', label: 'Country #2 Clicks', type: 'count', category: 'Bitly / Top Countries', description: 'Click count for #2 country' },
  { name: 'stats.bitlyCountry3', label: 'Country #3 Name', type: 'text', category: 'Bitly / Top Countries', description: 'Name of #3 country by clicks' },
  { name: 'stats.bitlyCountry3Clicks', label: 'Country #3 Clicks', type: 'count', category: 'Bitly / Top Countries', description: 'Click count for #3 country' },
  { name: 'stats.bitlyCountry4', label: 'Country #4 Name', type: 'text', category: 'Bitly / Top Countries', description: 'Name of #4 country by clicks' },
  { name: 'stats.bitlyCountry4Clicks', label: 'Country #4 Clicks', type: 'count', category: 'Bitly / Top Countries', description: 'Click count for #4 country' },
  { name: 'stats.bitlyCountry5', label: 'Country #5 Name', type: 'text', category: 'Bitly / Top Countries', description: 'Name of #5 country by clicks' },
  { name: 'stats.bitlyCountry5Clicks', label: 'Country #5 Clicks', type: 'count', category: 'Bitly / Top Countries', description: 'Click count for #5 country' },
  
  // Bitly - Traffic Sources (Platform-level)
  { name: 'stats.bitlyDirectClicks', label: 'Direct Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks with no referrer' },
  { name: 'stats.bitlySocialClicks', label: 'Social Media Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from social platforms' },
  { name: 'stats.bitlyTopReferrer', label: 'Top Referrer Platform', type: 'text', category: 'Bitly / Traffic Sources', description: 'Platform with most clicks (e.g., Instagram, Facebook)' },
  { name: 'stats.bitlyReferrerCount', label: 'Referrer Platforms Count', type: 'count', category: 'Bitly / Traffic Sources', description: 'Number of unique referrer platforms' },
  
  // Bitly - Referring Domains (Domain-level, more granular)
  { name: 'stats.bitlyTopDomain', label: 'Top Referring Domain', type: 'text', category: 'Bitly / Traffic Sources', description: 'Specific domain with most clicks (e.g., l.instagram.com)' },
  { name: 'stats.bitlyDomainCount', label: 'Referring Domains Count', type: 'count', category: 'Bitly / Traffic Sources', description: 'Number of unique referring domains' },
  { name: 'stats.bitlyQrCodeClicks', label: 'QR Code Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from qr.partners.bit.ly' },
  { name: 'stats.bitlyInstagramMobileClicks', label: 'Instagram Mobile Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from l.instagram.com' },
  { name: 'stats.bitlyInstagramWebClicks', label: 'Instagram Web Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from www.instagram.com' },
  { name: 'stats.bitlyFacebookMobileClicks', label: 'Facebook Mobile Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from m.facebook.com' },
  { name: 'stats.bitlyFacebookMessengerClicks', label: 'Facebook Messenger Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from lm.facebook.com' },
  
  // Bitly - Device & Platform (Future)
  { name: 'stats.bitlyMobileClicks', label: 'Mobile Clicks', type: 'count', category: 'Bitly', description: 'Clicks from mobile devices' },
  { name: 'stats.bitlyDesktopClicks', label: 'Desktop Clicks', type: 'count', category: 'Bitly', description: 'Clicks from desktop computers' },
  { name: 'stats.bitlyTabletClicks', label: 'Tablet Clicks', type: 'count', category: 'Bitly', description: 'Clicks from tablets' },
  { name: 'stats.bitlyiOSClicks', label: 'iOS Clicks', type: 'count', category: 'Bitly', description: 'Clicks from iOS devices' },
  { name: 'stats.bitlyAndroidClicks', label: 'Android Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Android devices' },
  
  // Bitly - Browsers (Future)
  { name: 'stats.bitlyChromeClicks', label: 'Chrome Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Chrome browser' },
  { name: 'stats.bitlySafariClicks', label: 'Safari Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Safari browser' },
  { name: 'stats.bitlyFirefoxClicks', label: 'Firefox Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Firefox browser' },

  // SportsDB - Core Identifiers
  { name: 'stats.sportsDbTeamId', label: 'SportsDB Team ID', type: 'text', category: 'SportsDB / Core', description: 'TheSportsDB unique team identifier' },
  { name: 'stats.sportsDbStrTeam', label: 'Full Team Name', type: 'text', category: 'SportsDB / Core', description: 'Official full team name from SportsDB' },
  { name: 'stats.sportsDbStrTeamShort', label: 'Short Team Name', type: 'text', category: 'SportsDB / Core', description: 'Abbreviated team name' },
  { name: 'stats.sportsDbStrAlternate', label: 'Alternative Team Names', type: 'text', category: 'SportsDB / Core', description: 'Alternative team name variations' },

  // SportsDB - Sport & League
  { name: 'stats.sportsDbStrSport', label: 'Sport Type', type: 'text', category: 'SportsDB / League', description: 'Sport type (e.g., Soccer, Handball)' },
  { name: 'stats.sportsDbStrLeague', label: 'League Name', type: 'text', category: 'SportsDB / League', description: 'League name (e.g., La Liga)' },
  { name: 'stats.sportsDbLeagueId', label: 'SportsDB League ID', type: 'text', category: 'SportsDB / League', description: 'TheSportsDB league identifier' },

  // SportsDB - Venue/Stadium
  { name: 'stats.sportsDbStrStadium', label: 'Stadium Name', type: 'text', category: 'SportsDB / Venue', description: 'Stadium or venue name' },
  { name: 'stats.sportsDbVenueId', label: 'SportsDB Venue ID', type: 'text', category: 'SportsDB / Venue', description: 'TheSportsDB venue identifier' },
  { name: 'stats.sportsDbIntStadiumCapacity', label: 'Stadium Capacity', type: 'count', category: 'SportsDB / Venue', description: 'Maximum stadium capacity (number of seats)' },
  { name: 'stats.sportsDbStrStadiumThumb', label: 'Stadium Image URL', type: 'text', category: 'SportsDB / Venue', description: 'Stadium image thumbnail URL' },
  { name: 'stats.sportsDbStrStadiumDescription', label: 'Stadium Description', type: 'text', category: 'SportsDB / Venue', description: 'Stadium description text' },
  { name: 'stats.sportsDbStrStadiumLocation', label: 'Stadium Location', type: 'text', category: 'SportsDB / Venue', description: 'Stadium city or location' },

  // SportsDB - Team Details
  { name: 'stats.sportsDbIntFormedYear', label: 'Year Founded', type: 'text', category: 'SportsDB / Team', description: 'Year the team was founded' },
  { name: 'stats.sportsDbStrCountry', label: 'Country', type: 'text', category: 'SportsDB / Team', description: 'Team country' },
  { name: 'stats.sportsDbStrDescriptionEN', label: 'Team Description', type: 'text', category: 'SportsDB / Team', description: 'English description of the team' },

  // SportsDB - Visual Assets
  { name: 'stats.sportsDbStrTeamBadge', label: 'Team Badge URL', type: 'text', category: 'SportsDB / Assets', description: 'Team badge/logo URL' },
  { name: 'stats.sportsDbStrTeamLogo', label: 'Team Logo URL', type: 'text', category: 'SportsDB / Assets', description: 'Alternative team logo URL' },
  { name: 'stats.sportsDbStrTeamJersey', label: 'Team Jersey URL', type: 'text', category: 'SportsDB / Assets', description: 'Team jersey/kit image URL' },
  { name: 'stats.sportsDbStrTeamBanner', label: 'Team Banner URL', type: 'text', category: 'SportsDB / Assets', description: 'Team banner image URL' },
  { name: 'stats.sportsDbStrTeamFanart1', label: 'Fan Art 1 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 1 URL' },
  { name: 'stats.sportsDbStrTeamFanart2', label: 'Fan Art 2 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 2 URL' },
  { name: 'stats.sportsDbStrTeamFanart3', label: 'Fan Art 3 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 3 URL' },
  { name: 'stats.sportsDbStrTeamFanart4', label: 'Fan Art 4 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 4 URL' },

  // SportsDB - Social Media & Web
  { name: 'stats.sportsDbStrWebsite', label: 'Team Website', type: 'text', category: 'SportsDB / Social', description: 'Official team website URL' },
  { name: 'stats.sportsDbStrFacebook', label: 'Facebook Page', type: 'text', category: 'SportsDB / Social', description: 'Facebook page URL' },
  { name: 'stats.sportsDbStrTwitter', label: 'Twitter Handle', type: 'text', category: 'SportsDB / Social', description: 'Twitter/X handle' },
  { name: 'stats.sportsDbStrInstagram', label: 'Instagram Handle', type: 'text', category: 'SportsDB / Social', description: 'Instagram handle' },

  // SportsDB - Sync Metadata
  { name: 'stats.sportsDbLastSynced', label: 'Last Synced', type: 'date', category: 'SportsDB / Meta', description: 'ISO 8601 timestamp of last SportsDB sync' },
]

// Derived variables — formulas use full database paths (stats.fieldName)
// WHAT: Computed variables based on base stats fields
// WHY: Formulas reference full paths for consistency with Single Reference System
export const DERIVED_VARIABLES: VariableDefinition[] = [
  {
    name: 'stats.allImages',
    label: 'Total Images',
    type: 'count',
    category: 'Images',
    derived: true,
    formula: 'stats.remoteImages + stats.hostessImages + stats.selfies',
    description: 'Sum of Remote, Hostess, and Selfies'
  },
  {
    name: 'stats.totalFans',
    label: 'Total Fans',
    type: 'count',
    category: 'Fans',
    derived: true,
    formula: 'stats.remoteFans + stats.stadium',
    description: 'Total fans counted across remote and on-site (Remote + Stadium)'
  },
  {
    name: 'stats.totalUnder40',
    label: 'Total Under 40',
    type: 'count',
    category: 'Demographics',
    derived: true,
    formula: 'stats.genAlpha + stats.genYZ',
    description: 'Gen Alpha + Gen YZ'
  },
  {
    name: 'stats.totalOver40',
    label: 'Total Over 40',
    type: 'count',
    category: 'Demographics',
    derived: true,
    formula: 'stats.genX + stats.boomer',
    description: 'Gen X + Boomer'
  },
  {
    name: 'stats.bitlyClickRate',
    label: 'Bitly Click-Through Rate',
    type: 'percentage',
    category: 'Bitly',
    derived: true,
    formula: '(stats.bitlyTotalClicks / stats.eventAttendees) * 100',
    description: 'Percentage of attendees who clicked Bitly links'
  },
  {
    name: 'stats.bitlyMobileRate',
    label: 'Bitly Mobile Usage Rate',
    type: 'percentage',
    category: 'Bitly',
    derived: true,
    formula: '(stats.bitlyMobileClicks / stats.bitlyTotalClicks) * 100',
    description: 'Percentage of Bitly clicks from mobile devices'
  },
]

// Text variables that are always available
export const TEXT_VARIABLES_STATIC: VariableDefinition[] = [
  { name: 'hashtags', label: 'General Hashtags', type: 'text', category: 'Hashtags', description: 'All general hashtags (plain list)' },
]

// Given a set of hashtag categories from DB, generate text variables per category
export function buildCategoryTextVariables(categories: { name: string }[]): VariableDefinition[] {
  return categories.map((c) => {
    const key = (c.name || '').trim()
    const upperSnake = key.replace(/[^a-zA-Z0-9]+/g, '_').replace(/__+/g, '_').toUpperCase()
    return {
      name: `hashtagsCategory:${key}`,
      label: `Hashtags — ${key}`,
      type: 'text',
      category: 'Hashtags by Category',
      description: `All hashtags in the "${key}" category`,
    } as VariableDefinition
  })
}

export function getAllVariableDefinitions(categories: { name: string }[]): VariableDefinition[] {
  const catVars = buildCategoryTextVariables(categories)
  return [
    ...BASE_STATS_VARIABLES,
    ...DERIVED_VARIABLES,
    ...TEXT_VARIABLES_STATIC,
    ...catVars,
  ]
}
