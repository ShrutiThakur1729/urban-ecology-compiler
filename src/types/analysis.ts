import { MetricWithProvenance } from './provenance';
import { OSMProviderResult, SentinelProviderResult, WeatherProviderResult, ElevationProviderResult, BhuvanProviderResult } from './providers';

export interface SiteAnalysisData {
  siteAreaSquareMeters: number;
  siteAreaHectares: number;
  centerCoordinates: [number, number];

  // 10 Core Site Analysis Metrics (Real vs Derived)
  metrics: {
    existingGreenCoveragePercent: MetricWithProvenance<number>; // Derived (Sentinel NDVI + OSM Greenery)
    builtUpImperviousPercent: MetricWithProvenance<number>;       // Derived (OSM Buildings/Roads)
    vegetationHealthNDVI: MetricWithProvenance<number>;           // Derived (Sentinel-2 NDVI)
    waterPresenceSqMeters: MetricWithProvenance<number>;          // Observed (OSM Waterways)
    averageSlopePercent: MetricWithProvenance<number>;            // Derived (DEM Elevation grid)
    runoffVulnerabilityScore: MetricWithProvenance<number>;       // Derived (Precipitation * Impervious / Slope)
    heatVulnerabilityIndex: MetricWithProvenance<number>;         // Derived (Built density + Land surface temp proxy)
    greenFragmentationIndex: MetricWithProvenance<number>;        // Derived (Patch density of green spaces)
    ecologicalConnectivityScore: MetricWithProvenance<number>;    // Derived (Proximity to corridors)
    availableInterventionZoneSqMeters: MetricWithProvenance<number>; // Derived (Open unbuilt, road verges, roof potentials)
  };

  // Provider Raw Details
  providers: {
    osm: OSMProviderResult;
    sentinel: SentinelProviderResult;
    weather: WeatherProviderResult;
    elevation: ElevationProviderResult;
    bhuvan?: BhuvanProviderResult;
  };

  analyzedAt: string;
}
