// lib/gridSettings.ts
// WHAT: Centralized grid settings for Desktop/Tablet/Mobile unit counts
// WHY: Allows dynamic, admin-configurable unit-based layout across all stats pages and previews.

export type GridSettings = {
  desktopUnits: number; // e.g., 4
  tabletUnits: number;  // e.g., 2
  mobileUnits: number;  // e.g., 1
  unitPercentages?: {
    desktop: number; // e.g., 25 for 4 units
    tablet: number;  // e.g., 50 for 2 units
    mobile: number;  // e.g., 100 for 1 unit
  };
  updatedAt?: string;
};

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  desktopUnits: 4,
  tabletUnits: 2,
  mobileUnits: 1,
  unitPercentages: {
    desktop: 25,
    tablet: 50,
    mobile: 100,
  },
  updatedAt: new Date().toISOString(),
};

export function computePercentages(s: GridSettings): GridSettings {
  const safe = {
    desktopUnits: Math.max(1, Math.floor(s.desktopUnits || DEFAULT_GRID_SETTINGS.desktopUnits)),
    tabletUnits: Math.max(1, Math.floor(s.tabletUnits || DEFAULT_GRID_SETTINGS.tabletUnits)),
    mobileUnits: Math.max(1, Math.floor(s.mobileUnits || DEFAULT_GRID_SETTINGS.mobileUnits)),
  };
  const unitPercentages = {
    desktop: 100 / safe.desktopUnits,
    tablet: 100 / safe.tabletUnits,
    mobile: 100 / safe.mobileUnits,
  };
  return { ...s, ...safe, unitPercentages, updatedAt: new Date().toISOString() };
}

export async function getGridSettingsFromDb(): Promise<GridSettings> {
  try {
    const db = await (await import('./db')).getDb();
    const settings = db.collection('settings');
    const doc = await settings.findOne({ _id: 'gridSettings' } as any);
    if (doc) {
      return computePercentages({
        desktopUnits: doc.desktopUnits,
        tabletUnits: doc.tabletUnits,
        mobileUnits: doc.mobileUnits,
        unitPercentages: doc.unitPercentages,
        updatedAt: doc.updatedAt,
      } as GridSettings);
    }
  } catch (e) {
    console.log('Grid settings fetch failed, using defaults');
  }
  return DEFAULT_GRID_SETTINGS;
}

