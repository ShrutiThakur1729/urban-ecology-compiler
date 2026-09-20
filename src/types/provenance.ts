export type ProvenanceCategory = 'OBSERVED' | 'DERIVED' | 'MODELED';

export interface DataProvenance {
  category: ProvenanceCategory;
  source: string; // e.g., 'Sentinel-2 L2A', 'OpenStreetMap Overpass API', 'Open-Meteo Historic & Forecast', 'SRTM / OpenElevation DEM', 'Urban Ecology Optimizer'
  date: string;
  method: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'ESTIMATED';
  limitations?: string;
}

export interface MetricWithProvenance<T = number | string | boolean> {
  name: string;
  value: T;
  formattedValue: string;
  unit?: string;
  provenance: DataProvenance;
  classification?: 'CRITICAL' | 'VULNERABLE' | 'MODERATE' | 'OPTIMAL' | 'GOOD';
  description?: string;
}
