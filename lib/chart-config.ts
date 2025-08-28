// Chart Configuration System for MessMass
// Allows dynamic modification of chart calculation algorithms

export interface ChartAlgorithm {
  id: string;
  name: string;
  description: string;
  formula: string;
  parameters: ChartParameter[];
  enabled: boolean;
}

export interface ChartParameter {
  key: string;
  name: string;
  type: 'number' | 'percentage' | 'currency';
  value: number;
  description: string;
  min?: number;
  max?: number;
}

export interface ChartConfiguration {
  _id?: string;
  version: string;
  lastUpdated: string;
  updatedBy: string;
  algorithms: {
    merchandise: ChartAlgorithm[];
    engagement: ChartAlgorithm[];
    value: ChartAlgorithm[];
    sources: ChartAlgorithm[];
  };
}

// Default chart configuration with current algorithms
export const defaultChartConfig: ChartConfiguration = {
  version: "1.0.3",
  lastUpdated: new Date().toISOString(),
  updatedBy: "system",
  algorithms: {
    merchandise: [
      {
        id: "potential_sales",
        name: "Potential Merchandise Sales",
        description: "Calculate potential sales from non-merched fans",
        formula: "(totalFans - merchedFans) × potentialSaleValue",
        enabled: true,
        parameters: [
          {
            key: "potentialSaleValue",
            name: "Potential Sale Value",
            type: "currency",
            value: 10,
            description: "Average merchandise sale value per fan (EUR)",
            min: 1,
            max: 100
          }
        ]
      }
    ],
    engagement: [
      {
        id: "core_fan_team",
        name: "Core Fan Team",
        description: "Highly engaged merchandise-wearing fans projected to stadium",
        formula: "(merchedFans / totalFans) × eventAttendees",
        enabled: true,
        parameters: [
          {
            key: "eventAttendees",
            name: "Event Attendees",
            type: "number",
            value: 0,
            description: "Total number of people who attended the event",
            min: 0
          }
        ]
      },
      {
        id: "fan_engagement",
        name: "Fan Engagement",
        description: "Percentage of attendees who became fans",
        formula: "(totalFans / eventAttendees) × 100",
        enabled: true,
        parameters: []
      },
      {
        id: "fan_interaction",
        name: "Fan Interaction", 
        description: "Social media and value prop interaction rate",
        formula: "((socialMediaVisits + valueProp) / totalImages) × 100",
        enabled: true,
        parameters: []
      },
      {
        id: "front_runners",
        name: "Front-runners",
        description: "Percentage of fans with merchandise",
        formula: "(merchedFans / totalFans) × 100",
        enabled: true,
        parameters: []
      },
      {
        id: "fanaticals",
        name: "Fanaticals",
        description: "Percentage of merched fans with flags/scarfs",
        formula: "((flags + scarfs) / merchedFans) × 100",
        enabled: true,
        parameters: []
      },
      {
        id: "casuals",
        name: "Casuals",
        description: "Percentage of fans without merchandise",
        formula: "((totalFans - merchedFans) / totalFans) × 100",
        enabled: true,
        parameters: []
      }
    ],
    value: [
      {
        id: "cpm_value",
        name: "CPM (Cost Per Mille)",
        description: "Value proposition click value",
        formula: "valuePropVisited × cpmRate",
        enabled: true,
        parameters: [
          {
            key: "cpmRate",
            name: "CPM Rate",
            type: "currency",
            value: 15,
            description: "Cost per thousand impressions (EUR)",
            min: 1,
            max: 100
          }
        ]
      },
      {
        id: "edm_value",
        name: "eDM (Electronic Direct Mail)",
        description: "Email marketing value from images",
        formula: "totalImages × edmRate",
        enabled: true,
        parameters: [
          {
            key: "edmRate",
            name: "eDM Rate",
            type: "currency",
            value: 5,
            description: "Email marketing value per image (EUR)",
            min: 1,
            max: 50
          }
        ]
      },
      {
        id: "ads_value",
        name: "Advertisement Value",
        description: "Advertisement value from fan engagement",
        formula: "totalFans × adsRate",
        enabled: true,
        parameters: [
          {
            key: "adsRate",
            name: "Ads Rate",
            type: "currency",
            value: 3,
            description: "Advertisement value per fan (EUR)",
            min: 1,
            max: 20
          }
        ]
      },
      {
        id: "u40_engagement",
        name: "Under 40 Engagement",
        description: "Young demographic engagement value",
        formula: "under40Fans × u40Rate",
        enabled: true,
        parameters: [
          {
            key: "u40Rate",
            name: "U40 Rate",
            type: "currency",
            value: 4,
            description: "Under 40 engagement value (EUR)",
            min: 1,
            max: 25
          }
        ]
      },
      {
        id: "branding_value",
        name: "Branding Value",
        description: "Brand awareness from visitor traffic",
        formula: "totalVisitors × brandingRate",
        enabled: true,
        parameters: [
          {
            key: "brandingRate",
            name: "Branding Rate",
            type: "currency",
            value: 1,
            description: "Brand awareness value per visitor (EUR)",
            min: 0.1,
            max: 10
          }
        ]
      }
    ],
    sources: [
      {
        id: "qr_short_url_weight",
        name: "QR + Short URL Weight",
        description: "Combined weight for QR codes and short URLs",
        formula: "(visitQrCode + visitShortUrl) × qrWeight",
        enabled: true,
        parameters: [
          {
            key: "qrWeight",
            name: "QR Weight",
            type: "number",
            value: 1,
            description: "Weight multiplier for QR and short URL visits",
            min: 0.1,
            max: 5
          }
        ]
      },
      {
        id: "other_sources_weight",
        name: "Other Sources Weight",
        description: "Weight for web and other traffic sources",
        formula: "visitWeb × otherWeight",
        enabled: true,
        parameters: [
          {
            key: "otherWeight",
            name: "Other Weight",
            type: "number",
            value: 1,
            description: "Weight multiplier for other visit sources",
            min: 0.1,
            max: 5
          }
        ]
      }
    ]
  }
};

// Define interface for calculation data
interface CalculationData {
  totalFans: number;
  merchedFans: number;
  eventAttendees: number;
  totalImages: number;
  socialMediaVisits: number;
  valueProp: number;
  flags: number;
  scarfs: number;
  valuePropVisited: number;
  under40Fans: number;
  totalVisitors: number;
  visitQrCode: number;
  visitShortUrl: number;
  visitWeb: number;
  [key: string]: number;
}

// Helper function to calculate values using the configuration
export const calculateValue = (
  algorithm: ChartAlgorithm,
  data: CalculationData
): number => {
  if (!algorithm.enabled) return 0;

  // Create parameter values object
  const params: { [key: string]: number } = {};
  algorithm.parameters.forEach(param => {
    params[param.key] = param.value;
  });

  // Calculate based on algorithm ID
  switch (algorithm.id) {
    case "potential_sales":
      return (data.totalFans - data.merchedFans) * params.potentialSaleValue;
    
    case "core_fan_team":
      return data.totalFans > 0 && data.eventAttendees > 0 
        ? Math.round((data.merchedFans / data.totalFans) * data.eventAttendees)
        : 0;
    
    case "fan_engagement":
      return data.eventAttendees > 0 
        ? (data.totalFans / data.eventAttendees) * 100
        : 0;
    
    case "fan_interaction":
      return data.totalImages > 0 
        ? ((data.socialMediaVisits + data.valueProp) / data.totalImages) * 100
        : 0;
    
    case "front_runners":
      return data.totalFans > 0 
        ? (data.merchedFans / data.totalFans) * 100
        : 0;
    
    case "fanaticals":
      return data.merchedFans > 0 
        ? ((data.flags + data.scarfs) / data.merchedFans) * 100
        : 0;
    
    case "casuals":
      return data.totalFans > 0 
        ? ((data.totalFans - data.merchedFans) / data.totalFans) * 100
        : 0;
    
    case "cpm_value":
      return data.valuePropVisited * params.cpmRate;
    
    case "edm_value":
      return data.totalImages * params.edmRate;
    
    case "ads_value":
      return data.totalFans * params.adsRate;
    
    case "u40_engagement":
      return data.under40Fans * params.u40Rate;
    
    case "branding_value":
      return data.totalVisitors * params.brandingRate;
    
    case "qr_short_url_weight":
      return (data.visitQrCode + data.visitShortUrl) * params.qrWeight;
    
    case "other_sources_weight":
      return data.visitWeb * params.otherWeight;
    
    default:
      return 0;
  }
};
