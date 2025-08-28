// Page styling configuration types

export interface PageStyle {
  _id?: string;
  name: string;
  backgroundGradient: string; // CSS gradient format
  headerBackgroundGradient: string;
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
  gridColumns: number; // Maximum columns in the grid (1-6)
  charts: BlockChart[];
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlockChart {
  chartId: string; // Reference to chart configuration
  width: number; // How many grid columns this chart spans (1-gridColumns)
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
  titleBubble: {
    backgroundColor: '#6366f1',
    textColor: '#ffffff'
  }
};

export const DEFAULT_DATA_BLOCK: Omit<DataVisualizationBlock, '_id' | 'createdAt' | 'updatedAt'> = {
  name: 'Default Block',
  gridColumns: 3,
  charts: [],
  order: 0,
  isActive: true
};
