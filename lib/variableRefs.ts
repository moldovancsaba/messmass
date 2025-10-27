// lib/variableRefs.ts
// What: Compute organization-prefixed reference tokens for variables displayed in Admin → Variables.
// Why: Prepare for multi-organization support and enforce consistent naming conventions across all references.
//      This centralizes the logic so other UI or templating systems can reuse it.

export interface ReferenceSourceLike {
  name: string
  label?: string
  category?: string
  derived?: boolean
  type?: 'count' | 'percentage' | 'currency' | 'numeric' | 'text'
}

// Organization namespace prefix — future-proof for multi-tenant rollout
const ORG_PREFIX = 'SEYU'

// Known explicit mappings from variable name → suffix (without org prefix)
// These follow the examples you provided and the normalization rules (TOTAL, VISIT order, FANS additions, MERCH prefixing where requested).
const EXPLICIT_SUFFIX_MAP: Record<string, string> = {
  // Demographics
  boomer: 'BOOMER',

  // Event
  eventAttendees: 'ATTENDEES',
  eventResultHome: 'RESULTHOME',
  eventResultVisitor: 'RESULTVISITOR',

  // Fans
  stadium: 'STADIUMFANS',
  remoteFans: 'REMOTEFANS',
  totalFans: 'TOTALFANS',

  // Images (derived)
  allImages: 'TOTALIMAGES',

  // Merchandise
  merched: 'MERCHEDFANS',
  scarf: 'MERCHSCARF',
  jersey: 'MERCHJERSEY',
  flags: 'MERCHFLAGS',
  baseballCap: 'MERCHBASEBALLCAP',
  other: 'MERCHOTHER',

  // Bitly - Core Metrics
  bitlyTotalClicks: 'BITLYTOTALCLICKS',
  bitlyUniqueClicks: 'BITLYUNIQUECLICKS',
  
  // Bitly - Geographic
  bitlyClicksByCountry: 'BITLYCLICKSBYCOUNTRY',
  bitlyTopCountry: 'BITLYTOPCOUNTRY',
  bitlyCountryCount: 'BITLYCOUNTRYCOUNT',
  
  // Bitly - Top 5 Countries
  bitlyCountry1: 'BITLYCOUNTRY1',
  bitlyCountry1Clicks: 'BITLYCOUNTRY1CLICKS',
  bitlyCountry2: 'BITLYCOUNTRY2',
  bitlyCountry2Clicks: 'BITLYCOUNTRY2CLICKS',
  bitlyCountry3: 'BITLYCOUNTRY3',
  bitlyCountry3Clicks: 'BITLYCOUNTRY3CLICKS',
  bitlyCountry4: 'BITLYCOUNTRY4',
  bitlyCountry4Clicks: 'BITLYCOUNTRY4CLICKS',
  bitlyCountry5: 'BITLYCOUNTRY5',
  bitlyCountry5Clicks: 'BITLYCOUNTRY5CLICKS',
  
  // Bitly - Traffic Sources
  bitlyDirectClicks: 'BITLYDIRECTCLICKS',
  bitlySocialClicks: 'BITLYSOCIALCLICKS',
  bitlyTopReferrer: 'BITLYTOPREFERRER',
  bitlyReferrerCount: 'BITLYREFERRERCOUNT',
  bitlyTopDomain: 'BITLYTOPDOMAIN',
  bitlyDomainCount: 'BITLYDOMAINCOUNT',
  bitlyQrCodeClicks: 'BITLYQRCODECLICKS',
  bitlyInstagramMobileClicks: 'BITLYINSTAGRAMMOBILECLICKS',
  bitlyInstagramWebClicks: 'BITLYINSTAGRAMWEBCLICKS',
  bitlyFacebookMobileClicks: 'BITLYFACEBOOKMOBILECLICKS',
  bitlyFacebookMessengerClicks: 'BITLYFACEBOOKMESSENGERCLICKS',
  
  // Bitly - Device & Platform
  bitlyMobileClicks: 'BITLYMOBILECLICKS',
  bitlyDesktopClicks: 'BITLYDESKTOPCLICKS',
  bitlyTabletClicks: 'BITLYTABLETCLICKS',
  bitlyiOSClicks: 'BITLYIOSCLICKS',
  bitlyAndroidClicks: 'BITLYANDROIDCLICKS',
  
  // Bitly - Browsers
  bitlyChromeClicks: 'BITLYCHROMECLICKS',
  bitlySafariClicks: 'BITLYSAFARICLICKS',
  bitlyFirefoxClicks: 'BITLYFIREFOXCLICKS',

  // SportsDB / Venue
  sportsDbIntStadiumCapacity: 'STADIUMCAPACITY',
  sportsDbStrStadium: 'STADIUMNAME',
  sportsDbStrCountry: 'TEAMCOUNTRY',
  sportsDbStrLeague: 'LEAGUENAME',
  sportsDbStrSport: 'SPORTTYPE',
}

// Helper: convert camelCase → UPPERCASE with no separators (e.g., visitShortUrl → VISITSHORTURL)
function camelToUpperNoSep(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_:-]+/)
    .join('')
    .toUpperCase()
}

// Helper: normalize general patterns beyond explicit map
function normalizeSuffixGuess(nameUpper: string, source?: ReferenceSourceLike): string {
  let suffix = nameUpper

  // 1) ALL → TOTAL
  suffix = suffix.replace(/\bALL\b/g, 'TOTAL')

  // 2) VISITED → VISIT (singular)
  suffix = suffix.replace(/VISITED\b/g, 'VISIT')

  // 3) Reorder VISIT* → *VISIT when it starts with VISIT
  //    e.g., VISITSHORTURL → SHORTURLVISIT; VISITQRCODE → QRCODEVISIT; VISITWEB → WEBVISIT
  suffix = suffix.replace(/^VISIT(.+)$/, '$1VISIT')

  // 4) Add FANS when clearly about fans (stadium handled explicitly). If name contains FANS already, keep it.
  if (/STADIUM$/.test(suffix)) {
    suffix = 'STADIUMFANS'
  }

  // 5) Merchandise prefixing: if category suggests merch, prefix MERCH for known items
  if (source?.category === 'Merchandise') {
    if (suffix === 'SCARF') suffix = 'MERCHSCARF'
    if (suffix === 'JERSEY') suffix = 'MERCHJERSEY'
    if (suffix === 'FLAGS') suffix = 'MERCHFLAGS'
    if (suffix === 'BASEBALLCAP') suffix = 'MERCHBASEBALLCAP'
    if (suffix === 'OTHER') suffix = 'MERCHOTHER'
  }

  return suffix
}

export function buildReferenceToken(source: ReferenceSourceLike): string {
  // Known mapping first
  const explicit = EXPLICIT_SUFFIX_MAP[source.name]
  if (explicit) {
    return `[${ORG_PREFIX}${explicit}]`
  }

  // Otherwise, derive from name
  const baseUpper = camelToUpperNoSep(source.name)
  const normalized = normalizeSuffixGuess(baseUpper, source)
  return `[${ORG_PREFIX}${normalized}]`
}
