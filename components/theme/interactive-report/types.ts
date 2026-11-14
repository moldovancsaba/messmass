export interface MatchItem {
  id: string;
  matchName: string;
  cleanName: string;
  date: string;
  partnerName: string;
  venue: string;
  sport: 'Football' | 'Ice Hockey' | 'Basketball' | 'Handball' | 'Other';
  submitted: number;
  approved: number;
  rejected: number;
  hostess: number;
  selfies: number;
  approvalRate: number;
  demographics?: {
    male?: number;
    female?: number;
    genAlpha?: number;
    genYZ?: number;
    genX?: number;
    boomer?: number;
  };
}

export interface TimelinePeriod {
  id: string;
  name: string;
  shortName: string;
  type: 'monthly' | 'weekly' | 'sport';
  date: string;
  slug: string;
  allPhotos: number;
  hostessPhotos: number;
  selfies: number;
  registered: number;
  optIns: number;
  optInRate: number | null;
  qr: number;
  url: number;
  social: number;
  cta1: number;
  cta2: number;
  ctaTotal: number;
}

export interface SportBreakdown {
  sport: string;
  matchesCount: number;
  photos: number;
  approved: number;
  hostess: number;
  hostessRatio: number;
}

export interface FunnelStep {
  step: string;
  value: number;
  detail: string;
}

export interface DemographicsData {
  male: number;
  female: number;
  totalAudience: number;
  maleRatio: number;
  femaleRatio: number;
  /** Age groups as measured by the vision analysis (children/teens/adults/seniors). Empty when nothing was measured. */
  generations: Array<{ label: string; percent: number; count: number }>;
}

export interface VisionProgressData {
  totalImages: number;
  processedCount: number;
  percent: number;
  status: 'running' | 'idle' | 'completed';
  currentSport: string;
  currentFile: string;
  lastUpdated: string;
  /** Photos with a recorded opt-in, as Fanmass counted them; absent until Fanmass sends it. */
  optInImages?: number;
  aggregates: {
    totalPeople: number;
    genders: {
      male: number;
      female: number;
      malePct: number;
      femalePct: number;
    };
    ageGroups: {
      children: number;
      teens: number;
      adults: number;
      seniors: number;
    };
    topBrands: Array<{
      brand: string;
      count: number;
      logoUrl?: string;
      darkLogoUrl?: string;
      category?: string;
      accentColor?: string;
    }>;
    topClubs: Array<{
      club: string;
      count: number;
      logoUrl?: string;
      partnerId?: string;
      partnerSlug?: string;
      partnerName?: string;
      sport?: string;
      homeVenue?: string;
      venueCapacity?: number;
      website?: string;
    }>;
    topVenues?: Array<{ venue: string; count: number }>;
    topEmotions: Array<{ emotion: string; count: number }>;
    merchandise?: Array<{ item: string; count: number; percentage: number }>;
    sportsBreakdown: Record<
      string,
      {
        images: number;
        people: number;
        genders?: {
          male: number;
          female: number;
          malePct?: number;
          femalePct?: number;
        };
        ageGroups?: {
          children: number;
          teens: number;
          adults: number;
          seniors: number;
        };
        topBrands?: Array<{ brand: string; count: number; logoUrl?: string }>;
        distinctBrandsCount?: number;
        topEmotions?: Array<{ emotion: string; count: number }>;
        valence?: number;
      }
    >;
  };
  recentImages: Array<{
    fileName: string;
    sport: string;
    peopleCount: number;
    emotions: string[];
    brands: string[];
    clubs: string[];
    scene: string;
  }>;
}

export interface ScopeHeader {
  type: 'hashtag' | 'partner' | 'event' | 'global' | 'filter';
  id: string;
  name: string;
  viewSlug?: string;
  emoji?: string;
  subtitle?: string;
  organizationId?: string;
  hashtags?: string[];
}

export interface InteractiveReportData {
  success: boolean;
  scope?: ScopeHeader;
  partner: {
    id: string;
    name: string;
    viewSlug: string;
    emoji: string;
  };
  style: {
    name: string;
    heroBackground: string;
    pieColor1: string;
    pieColor2: string;
  };
  summary: {
    totalPhotos: number;
    hostessPhotos: number;
    selfies: number;
    hostessShare: number;
    selfieShare: number;
    totalRegistered: number;
    totalOptIns: number;
    /** Opt-ins / registered, null when there are no registrations to divide by. */
    optInRate: number | null;
    /** Approved / submitted in photo vetting, null when nothing was submitted. Not a brand-safety measure. */
    vettingApprovalRate: number | null;
    totalCtaClicks: number;
    totalMatches: number;
    touchpoints: {
      qr: number;
      url: number;
      social: number;
    };
  };
  timeline: TimelinePeriod[];
  matches: MatchItem[];
  sports: SportBreakdown[];
  funnel: FunnelStep[];
  demographics: DemographicsData | null;
  vision?: VisionProgressData | null;
}
