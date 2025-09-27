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

  // Visits
  totalVisit: 'TOTALVISIT',
  socialVisit: 'SOCIALVISIT',
  visitShortUrl: 'SHORTURLVISIT',
  visitQrCode: 'QRCODEVISIT',
  visitWeb: 'WEBVISIT',

  // eDM / Value Proposition
  eventValuePropositionVisited: 'PROPOSITIONVISIT',
  eventValuePropositionPurchases: 'PROPOSITIONPURCHASE',
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
