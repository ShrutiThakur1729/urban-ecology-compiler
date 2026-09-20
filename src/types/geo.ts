export type LngLat = [number, number]; // [longitude, latitude]

export interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface GeoLocation {
  name: string;
  formattedAddress: string;
  center: LngLat;
  zoom?: number;
  placeType?: 'city' | 'town' | 'village' | 'suburb' | 'neighbourhood' | 'administrative' | 'coordinate' | 'site';
  bbox?: BoundingBox;
}

export interface SitePolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    name?: string;
    areaSquareMeters: number;
    areaHectares: number;
    perimeterMeters: number;
    createdAt: string;
  };
}

export interface SelectedSite {
  name: string;
  displayName: string;
  center: LngLat;
  zoom: number;
  bbox?: BoundingBox;
  polygon: SitePolygon | null;
  isDemo: boolean;
  source: 'SEARCH' | 'COORDINATE' | 'DRAWN' | 'DEMO';
}

// App workflow phases for guided Lovable-style flow
export type AppPhase = 
  | 'SEARCH'            // Initial: map visible, floating search prominent
  | 'LOCATION_SELECTED' // Location chosen, card prompts user to draw/choose area
  | 'DRAWING'           // User is actively drawing custom polygon on the map
  | 'AREA_READY'        // Polygon defined, shows stats & "Analyze Site" CTA
  | 'ANALYZING'         // Real analysis in progress (Overpass, Meteo, Elevation)
  | 'DASHBOARD';        // Full dashboard with diagnosis, compiler, scenarios

// Decoupled location concept
export interface SelectedLocation {
  name: string;
  formattedAddress: string;
  center: LngLat;
  zoom: number;
  placeType?: string;
  bbox?: BoundingBox;
  source: 'SEARCH' | 'COORDINATE' | 'DEMO';
}

// Decoupled analysis area concept
export interface SelectedAnalysisArea {
  polygon: SitePolygon;
  source: 'SUGGESTED' | 'DRAWN' | 'COORDINATES' | 'DEMO';
}

