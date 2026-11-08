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
  optInRate: number;
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
  generations: Array<{ label: string; percent: number; count: number }>;
  merchAdoption: number;
  stadiumAtmosphere: number;
}

export interface VisionProgressData {
  totalImages: number;
  processedCount: number;
  percent: number;
  status: 'running' | 'idle' | 'completed';
  currentSport: string;
  currentFile: string;
  lastUpdated: string;
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
    topBrands: Array<{ brand: string; count: number }>;
    topClubs: Array<{ club: string; count: number }>;
    topEmotions: Array<{ emotion: string; count: number }>;
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

export interface InteractiveReportData {
  success: boolean;
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
    optInRate: number;
    brandProtectionRate: number;
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
  demographics: DemographicsData;
  vision?: VisionProgressData | null;
}
