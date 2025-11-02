// Page styling configuration types

export interface PageStyle {
  _id?: string;
  name: string;
  backgroundGradient: string; // CSS gradient format
  headerBackgroundGradient: string;
  // NEW: Color for the main content surface (the block behind page content)
  // Accepts any valid CSS color (hex/rgb/rgba) — kept as color per product request
  contentBackgroundColor?: string;
  titleBubble: {
    backgroundColor: string;
    textColor: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DataVisualizationBlock {
  _id?: string;
  name: string;
  charts: BlockChart[];
  order: number;
  isActive: boolean;
  showTitle?: boolean; // NEW: Controls title visibility on stat pages (default: true)
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockChart {
  chartId: string; // Reference to chart configuration
  width: number; // How many grid columns this chart spans
  order: number; // Order within the block
}

export interface PageConfiguration {
  _id?: string;
  pageStyleId: string; // Reference to PageStyle
  dataVisualizationBlocks: string[]; // Array of DataVisualizationBlock IDs
  showProjectsSection: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Default configurations
export const DEFAULT_PAGE_STYLE: Omit<PageStyle, '_id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default Style',
  backgroundGradient: '0deg, #ffffffff 0%, #ffffffff 100%',
  headerBackgroundGradient: '0deg, #f8fafc 0%, #f1f5f9 100%',
  contentBackgroundColor: 'rgba(255, 255, 255, 0.95)',
  titleBubble: {
    backgroundColor: '#6366f1',
    textColor: '#ffffff'
  }
};

export const DEFAULT_DATA_BLOCK: Omit<DataVisualizationBlock, '_id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default Block',
  charts: [],
  order: 0,
  isActive: true,
  showTitle: true // NEW: Default to showing title
};
