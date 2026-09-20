import { BoundingBox, LngLat } from './geo';
import { DataProvenance } from './provenance';

// OSM / Overpass Types
export interface OSMFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id?: string | number;
    geometry: {
      type: 'Polygon' | 'MultiPolygon' | 'LineString' | 'Point';
      coordinates: any;
    };
    properties: {
      id?: string | number;
      layerType: 'building' | 'highway' | 'water' | 'greenery' | 'leisure' | 'landuse' | 'other';
      name?: string;
      building?: string;
      highway?: string;
      amenity?: string;
      natural?: string;
      surface?: string;
      areaSquareMeters?: number;
      [key: string]: any;
    };
  }>;
}

export interface OSMProviderResult {
  buildings: OSMFeatureCollection;
  roads: OSMFeatureCollection;
  waterways: OSMFeatureCollection;
  greenSpaces: OSMFeatureCollection;
  rawFeatureCount: number;
  provenance: DataProvenance;
}

// Sentinel-2 Types
export interface SentinelProviderResult {
  sceneId: string;
  acquisitionDate: string;
  cloudCoveragePercent: number;
  meanNDVI: number;
  ndviMin: number;
  ndviMax: number;
  vegetatedFraction: number; // 0 to 1
  waterIndexMNDWI?: number;
  imageryUrl?: string;
  isCachedDemo: boolean;
  provenance: DataProvenance;
}

// Open-Meteo Types
export interface WeatherProviderResult {
  currentTemperatureC: number;
  maxSummerTemperatureC: number;
  annualPrecipitationMm: number;
  monsoonPrecipitationMm: number;
  peakHourlyRainfallMm: number;
  solarRadiationKWhM2: number;
  windSpeedKmH: number;
  relativeHumidityPercent: number;
  urbanHeatIslandProxyDeltaC: number;
  provenance: DataProvenance;
}

// Elevation / DEM Types
export interface ElevationProviderResult {
  minElevationMeters: number;
  maxElevationMeters: number;
  meanElevationMeters: number;
  slopePercent: number;
  steepestDirectionDeg: number;
  runoffVulnerabilityProxy: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  lowPoints: Array<{ coordinate: LngLat; elevation: number }>;
  elevationGridSampleCount: number;
  provenance: DataProvenance;
}

// Bhuvan Types (Optional Indian specific LULC)
export interface BhuvanProviderResult {
  isAvailable: boolean;
  lulcClass?: string;
  soilClass?: string;
  geomorphology?: string;
  sourceNote?: string;
  provenance: DataProvenance;
}
