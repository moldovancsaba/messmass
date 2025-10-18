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

// Base (stats) variables — keys match stats fields as stored.
// Note: Labels mirror the editor UI phrasing you provided.
export const BASE_STATS_VARIABLES: VariableDefinition[] = [
  // Images
  { name: 'remoteImages', label: 'Remote Images', type: 'count', category: 'Images', description: 'Images taken remotely' },
  { name: 'hostessImages', label: 'Hostess Images', type: 'count', category: 'Images', description: 'Images taken by hostesses' },
  { name: 'selfies', label: 'Selfies', type: 'count', category: 'Images', description: 'Self-shot images' },

  // Fans (Location)
  { name: 'remoteFans', label: 'Remote', type: 'count', category: 'Fans', description: 'Indoor + Outdoor (aggregated)' },
  { name: 'stadium', label: 'Location Fans', type: 'count', category: 'Fans', description: 'On-site (stadium) fans' },

  // Demographics
  { name: 'female', label: 'Female', type: 'count', category: 'Demographics' },
  { name: 'male', label: 'Male', type: 'count', category: 'Demographics' },
  { name: 'genAlpha', label: 'Gen Alpha', type: 'count', category: 'Demographics' },
  { name: 'genYZ', label: 'Gen Y+Z', type: 'count', category: 'Demographics' },
  { name: 'genX', label: 'Gen X', type: 'count', category: 'Demographics' },
  { name: 'boomer', label: 'Boomer', type: 'count', category: 'Demographics' },

  // Merchandise
  { name: 'merched', label: 'People with Merch', type: 'count', category: 'Merchandise' },
  { name: 'jersey', label: 'Jersey', type: 'count', category: 'Merchandise' },
  { name: 'scarf', label: 'Scarf', type: 'count', category: 'Merchandise' },
  { name: 'flags', label: 'Flags', type: 'count', category: 'Merchandise' },
  { name: 'baseballCap', label: 'Baseball Cap', type: 'count', category: 'Merchandise' },
  { name: 'other', label: 'Other', type: 'count', category: 'Merchandise' },

  // Moderation
  { name: 'approvedImages', label: 'Approved Images', type: 'count', category: 'Moderation' },
  { name: 'rejectedImages', label: 'Rejected Images', type: 'count', category: 'Moderation' },

  // Event
  { name: 'eventAttendees', label: 'Event Attendees', type: 'count', category: 'Event' },
  { name: 'eventResultHome', label: 'Event Result Home', type: 'count', category: 'Event' },
  { name: 'eventResultVisitor', label: 'Event Result Visitor', type: 'count', category: 'Event' },

  // Bitly - Core Metrics
  { name: 'bitlyTotalClicks', label: 'Total Bitly Clicks', type: 'count', category: 'Bitly', description: 'Sum of all Bitly link clicks for event' },
  { name: 'bitlyUniqueClicks', label: 'Unique Bitly Clicks', type: 'count', category: 'Bitly', description: 'Unique visitors from Bitly links' },
  
  // Bitly - Geographic
  { name: 'bitlyClicksByCountry', label: 'Clicks by Top Country', type: 'count', category: 'Bitly', description: 'Click count from top country' },
  { name: 'bitlyTopCountry', label: 'Top Country', type: 'text', category: 'Bitly', description: 'Country with most clicks' },
  { name: 'bitlyCountryCount', label: 'Countries Reached', type: 'count', category: 'Bitly', description: 'Number of unique countries' },
  
  // Bitly - Traffic Sources (Platform-level)
  { name: 'bitlyDirectClicks', label: 'Direct Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks with no referrer' },
  { name: 'bitlySocialClicks', label: 'Social Media Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from social platforms' },
  { name: 'bitlyTopReferrer', label: 'Top Referrer Platform', type: 'text', category: 'Bitly / Traffic Sources', description: 'Platform with most clicks (e.g., Instagram, Facebook)' },
  { name: 'bitlyReferrerCount', label: 'Referrer Platforms Count', type: 'count', category: 'Bitly / Traffic Sources', description: 'Number of unique referrer platforms' },
  
  // Bitly - Referring Domains (Domain-level, more granular)
  { name: 'bitlyTopDomain', label: 'Top Referring Domain', type: 'text', category: 'Bitly / Traffic Sources', description: 'Specific domain with most clicks (e.g., l.instagram.com)' },
  { name: 'bitlyDomainCount', label: 'Referring Domains Count', type: 'count', category: 'Bitly / Traffic Sources', description: 'Number of unique referring domains' },
  { name: 'bitlyQrCodeClicks', label: 'QR Code Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from qr.partners.bit.ly' },
  { name: 'bitlyInstagramMobileClicks', label: 'Instagram Mobile Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from l.instagram.com' },
  { name: 'bitlyInstagramWebClicks', label: 'Instagram Web Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from www.instagram.com' },
  { name: 'bitlyFacebookMobileClicks', label: 'Facebook Mobile Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from m.facebook.com' },
  { name: 'bitlyFacebookMessengerClicks', label: 'Facebook Messenger Clicks', type: 'count', category: 'Bitly / Traffic Sources', description: 'Clicks from lm.facebook.com' },
  
  // Bitly - Device & Platform (Future)
  { name: 'bitlyMobileClicks', label: 'Mobile Clicks', type: 'count', category: 'Bitly', description: 'Clicks from mobile devices' },
  { name: 'bitlyDesktopClicks', label: 'Desktop Clicks', type: 'count', category: 'Bitly', description: 'Clicks from desktop computers' },
  { name: 'bitlyTabletClicks', label: 'Tablet Clicks', type: 'count', category: 'Bitly', description: 'Clicks from tablets' },
  { name: 'bitlyiOSClicks', label: 'iOS Clicks', type: 'count', category: 'Bitly', description: 'Clicks from iOS devices' },
  { name: 'bitlyAndroidClicks', label: 'Android Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Android devices' },
  
  // Bitly - Browsers (Future)
  { name: 'bitlyChromeClicks', label: 'Chrome Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Chrome browser' },
  { name: 'bitlySafariClicks', label: 'Safari Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Safari browser' },
  { name: 'bitlyFirefoxClicks', label: 'Firefox Clicks', type: 'count', category: 'Bitly', description: 'Clicks from Firefox browser' },

  // SportsDB - Core Identifiers
  { name: 'sportsDbTeamId', label: 'SportsDB Team ID', type: 'text', category: 'SportsDB / Core', description: 'TheSportsDB unique team identifier' },
  { name: 'sportsDbStrTeam', label: 'Full Team Name', type: 'text', category: 'SportsDB / Core', description: 'Official full team name from SportsDB' },
  { name: 'sportsDbStrTeamShort', label: 'Short Team Name', type: 'text', category: 'SportsDB / Core', description: 'Abbreviated team name' },
  { name: 'sportsDbStrAlternate', label: 'Alternative Team Names', type: 'text', category: 'SportsDB / Core', description: 'Alternative team name variations' },

  // SportsDB - Sport & League
  { name: 'sportsDbStrSport', label: 'Sport Type', type: 'text', category: 'SportsDB / League', description: 'Sport type (e.g., Soccer, Handball)' },
  { name: 'sportsDbStrLeague', label: 'League Name', type: 'text', category: 'SportsDB / League', description: 'League name (e.g., La Liga)' },
  { name: 'sportsDbLeagueId', label: 'SportsDB League ID', type: 'text', category: 'SportsDB / League', description: 'TheSportsDB league identifier' },

  // SportsDB - Venue/Stadium
  { name: 'sportsDbStrStadium', label: 'Stadium Name', type: 'text', category: 'SportsDB / Venue', description: 'Stadium or venue name' },
  { name: 'sportsDbVenueId', label: 'SportsDB Venue ID', type: 'text', category: 'SportsDB / Venue', description: 'TheSportsDB venue identifier' },
  { name: 'sportsDbIntStadiumCapacity', label: 'Stadium Capacity', type: 'count', category: 'SportsDB / Venue', description: 'Maximum stadium capacity (number of seats)' },
  { name: 'sportsDbStrStadiumThumb', label: 'Stadium Image URL', type: 'text', category: 'SportsDB / Venue', description: 'Stadium image thumbnail URL' },
  { name: 'sportsDbStrStadiumDescription', label: 'Stadium Description', type: 'text', category: 'SportsDB / Venue', description: 'Stadium description text' },
  { name: 'sportsDbStrStadiumLocation', label: 'Stadium Location', type: 'text', category: 'SportsDB / Venue', description: 'Stadium city or location' },

  // SportsDB - Team Details
  { name: 'sportsDbIntFormedYear', label: 'Year Founded', type: 'text', category: 'SportsDB / Team', description: 'Year the team was founded' },
  { name: 'sportsDbStrCountry', label: 'Country', type: 'text', category: 'SportsDB / Team', description: 'Team country' },
  { name: 'sportsDbStrDescriptionEN', label: 'Team Description', type: 'text', category: 'SportsDB / Team', description: 'English description of the team' },

  // SportsDB - Visual Assets
  { name: 'sportsDbStrTeamBadge', label: 'Team Badge URL', type: 'text', category: 'SportsDB / Assets', description: 'Team badge/logo URL' },
  { name: 'sportsDbStrTeamLogo', label: 'Team Logo URL', type: 'text', category: 'SportsDB / Assets', description: 'Alternative team logo URL' },
  { name: 'sportsDbStrTeamJersey', label: 'Team Jersey URL', type: 'text', category: 'SportsDB / Assets', description: 'Team jersey/kit image URL' },
  { name: 'sportsDbStrTeamBanner', label: 'Team Banner URL', type: 'text', category: 'SportsDB / Assets', description: 'Team banner image URL' },
  { name: 'sportsDbStrTeamFanart1', label: 'Fan Art 1 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 1 URL' },
  { name: 'sportsDbStrTeamFanart2', label: 'Fan Art 2 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 2 URL' },
  { name: 'sportsDbStrTeamFanart3', label: 'Fan Art 3 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 3 URL' },
  { name: 'sportsDbStrTeamFanart4', label: 'Fan Art 4 URL', type: 'text', category: 'SportsDB / Assets', description: 'Fan art image 4 URL' },

  // SportsDB - Social Media & Web
  { name: 'sportsDbStrWebsite', label: 'Team Website', type: 'text', category: 'SportsDB / Social', description: 'Official team website URL' },
  { name: 'sportsDbStrFacebook', label: 'Facebook Page', type: 'text', category: 'SportsDB / Social', description: 'Facebook page URL' },
  { name: 'sportsDbStrTwitter', label: 'Twitter Handle', type: 'text', category: 'SportsDB / Social', description: 'Twitter/X handle' },
  { name: 'sportsDbStrInstagram', label: 'Instagram Handle', type: 'text', category: 'SportsDB / Social', description: 'Instagram handle' },

  // SportsDB - Sync Metadata
  { name: 'sportsDbLastSynced', label: 'Last Synced', type: 'date', category: 'SportsDB / Meta', description: 'ISO 8601 timestamp of last SportsDB sync' },
]

// Derived variables — formulas are informational; evaluation happens elsewhere when needed.
export const DERIVED_VARIABLES: VariableDefinition[] = [
  {
    name: 'allImages',
    label: 'Total Images',
    type: 'count',
    category: 'Images',
    derived: true,
    formula: 'remoteImages + hostessImages + selfies',
    description: 'Sum of Remote, Hostess, and Selfies'
  },
  {
    name: 'totalFans',
    label: 'Total Fans',
    type: 'count',
    category: 'Fans',
    derived: true,
    formula: 'remoteFans + stadium',
    description: 'Total fans counted across remote and on-site (Remote + Stadium)'
  },
  {
    name: 'totalUnder40',
    label: 'Total Under 40',
    type: 'count',
    category: 'Demographics',
    derived: true,
    formula: 'genAlpha + genYZ',
    description: 'Gen Alpha + Gen YZ'
  },
  {
    name: 'totalOver40',
    label: 'Total Over 40',
    type: 'count',
    category: 'Demographics',
    derived: true,
    formula: 'genX + boomer',
    description: 'Gen X + Boomer'
  },
  {
    name: 'bitlyClickRate',
    label: 'Bitly Click-Through Rate',
    type: 'percentage',
    category: 'Bitly',
    derived: true,
    formula: '(bitlyTotalClicks / eventAttendees) * 100',
    description: 'Percentage of attendees who clicked Bitly links'
  },
  {
    name: 'bitlyMobileRate',
    label: 'Bitly Mobile Usage Rate',
    type: 'percentage',
    category: 'Bitly',
    derived: true,
    formula: '(bitlyMobileClicks / bitlyTotalClicks) * 100',
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
