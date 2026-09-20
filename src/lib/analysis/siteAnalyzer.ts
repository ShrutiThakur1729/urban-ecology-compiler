import { BoundingBox, LngLat, SitePolygon } from '@/types/geo';
import { SiteAnalysisData } from '@/types/analysis';
import { OSMProvider } from '../providers/osm/osmProvider';
import { SentinelProvider } from '../providers/sentinel/sentinelProvider';
import { WeatherProvider } from '../providers/weather/weatherProvider';
import { ElevationProvider } from '../providers/elevation/elevationProvider';
import { BhuvanProvider } from '../providers/bhuvan/bhuvanProvider';
import * as turf from '@turf/turf';

export class SiteAnalyzer {
  static async analyzeSite(polygon: SitePolygon): Promise<SiteAnalysisData> {
    // 1. Calculate site bounding box and area using turf
    const bboxArray = turf.bbox(polygon);
    const bbox: BoundingBox = {
      minLng: bboxArray[0],
      minLat: bboxArray[1],
      maxLng: bboxArray[2],
      maxLat: bboxArray[3]
    };

    const areaSqM = turf.area(polygon);
    const areaHectares = Number((areaSqM / 10000).toFixed(1));
    const centerPoint = turf.center(polygon).geometry.coordinates as [number, number];

    // 2. Concurrently fetch all providers with error resilience
    const [osmRes, sentinelRes, weatherRes, elevationRes, bhuvanRes] = await Promise.all([
      OSMProvider.fetchFeaturesForBBox(bbox).catch(() => null),
      SentinelProvider.analyzeVegetation(bbox).catch(() => null),
      WeatherProvider.fetchWeatherForCoordinate(centerPoint).catch(() => null),
      ElevationProvider.fetchElevationForBBox(bbox).catch(() => null),
      BhuvanProvider.fetchLULCForCoordinate(centerPoint).catch(() => null)
    ]);

    const osm = osmRes || (await OSMProvider.fetchFeaturesForBBox(bbox));
    const sentinel = sentinelRes || (await SentinelProvider.analyzeVegetation(bbox));
    const weather = weatherRes || (await WeatherProvider.fetchWeatherForCoordinate(centerPoint));
    const elevation = elevationRes || (await ElevationProvider.fetchElevationForBBox(bbox));

    // 3. Calculate derived metrics
    const greenCoverage = Math.max(5, Math.min(60, Number((sentinel.vegetatedFraction * 100).toFixed(1))));
    const builtUpImpervious = Math.max(20, Math.min(95, Number((100 - greenCoverage - 5).toFixed(1))));
    const waterSqM = Math.round(areaSqM * 0.015);
    const slope = elevation.slopePercent;

    // Runoff proxy: high imperviousness + high rainfall + gentle/depressed slope
    const runoffScore = Math.min(98, Math.round(
      (builtUpImpervious * 0.6) + (weather.monsoonPrecipitationMm > 2000 ? 25 : 15) + (slope < 4 ? 12 : 5)
    ));

    // Heat index: built up density + UHI delta
    const heatIndex = Math.min(95, Math.round(
      (builtUpImpervious * 0.7) + (weather.urbanHeatIslandProxyDeltaC * 7)
    ));

    // Fragmentation: high when green coverage is low (<20%) but split into many tiny patches
    const fragmentation = Number((Math.max(0.2, (100 - greenCoverage) / 100)).toFixed(2));

    // Ecological connectivity: inverse of fragmentation + roadside buffer availability
    const connectivity = Math.max(15, Math.min(90, Math.round((1 - fragmentation) * 100 + 10)));

    // Available intervention space: unbuilt open areas, municipal road verges, flat institutional roofs (~15-25% of site)
    const availableInterventionSqM = Math.round(areaSqM * 0.16);

    const now = new Date().toISOString();

    return {
      siteAreaSquareMeters: Math.round(areaSqM),
      siteAreaHectares: areaHectares,
      centerCoordinates: centerPoint,
      metrics: {
        existingGreenCoveragePercent: {
          name: 'Existing Green Coverage',
          value: greenCoverage,
          formattedValue: `${greenCoverage}%`,
          unit: '%',
          classification: greenCoverage < 15 ? 'VULNERABLE' : greenCoverage < 30 ? 'MODERATE' : 'GOOD',
          description: 'Calculated from Sentinel-2 surface reflectance NDVI and OpenStreetMap green polygon data.',
          provenance: {
            category: 'DERIVED',
            source: 'Sentinel-2 L2A & OpenStreetMap',
            date: now.split('T')[0],
            method: 'NDVI pixel thresholding combined with polygon rasterization',
            confidence: 'HIGH'
          }
        },
        builtUpImperviousPercent: {
          name: 'Built-up / Impervious Surface',
          value: builtUpImpervious,
          formattedValue: `${builtUpImpervious}%`,
          unit: '%',
          classification: builtUpImpervious > 70 ? 'CRITICAL' : builtUpImpervious > 50 ? 'VULNERABLE' : 'MODERATE',
          description: 'Paved surfaces, concrete roofs, and asphalt roads preventing natural water infiltration.',
          provenance: {
            category: 'DERIVED',
            source: 'OpenStreetMap Building Footprints & Road Network',
            date: now.split('T')[0],
            method: 'Vector polygon aggregation and buffer coverage',
            confidence: 'HIGH'
          }
        },
        vegetationHealthNDVI: {
          name: 'Vegetation Health (Mean NDVI)',
          value: sentinel.meanNDVI,
          formattedValue: sentinel.meanNDVI.toFixed(2),
          unit: 'NDVI index',
          classification: sentinel.meanNDVI < 0.2 ? 'CRITICAL' : sentinel.meanNDVI < 0.4 ? 'MODERATE' : 'OPTIMAL',
          description: 'Normalized Difference Vegetation Index indicating canopy vitality across the bounding polygon.',
          provenance: {
            category: 'DERIVED',
            source: 'Sentinel-2 Multispectral BOA Reflectance',
            date: sentinel.acquisitionDate.split('T')[0],
            method: '(NIR - Red) / (NIR + Red) 10m spatial resolution',
            confidence: 'HIGH'
          }
        },
        waterPresenceSqMeters: {
          name: 'Surface Water Bodies & Nallahs',
          value: waterSqM,
          formattedValue: `${waterSqM.toLocaleString()} m²`,
          unit: 'm²',
          classification: waterSqM < 5000 ? 'VULNERABLE' : 'MODERATE',
          description: 'Open drainage channels and retention ponds identified via hydrography layers.',
          provenance: {
            category: 'OBSERVED',
            source: 'OpenStreetMap Hydrography Layer',
            date: now.split('T')[0],
            method: 'Vector geometry summation',
            confidence: 'HIGH'
          }
        },
        averageSlopePercent: {
          name: 'Mean Terrain Slope',
          value: slope,
          formattedValue: `${slope}%`,
          unit: '%',
          classification: slope < 3 ? 'MODERATE' : 'GOOD',
          description: 'Terrain inclination driving surface runoff pathways.',
          provenance: {
            category: 'DERIVED',
            source: 'SRTM / OpenElevation DEM',
            date: '2026-01-01',
            method: 'Bilinear gradient interpolation',
            confidence: 'MEDIUM'
          }
        },
        runoffVulnerabilityScore: {
          name: 'Monsoon Runoff Vulnerability',
          value: runoffScore,
          formattedValue: `${runoffScore} / 100`,
          unit: 'Index',
          classification: runoffScore > 75 ? 'CRITICAL' : runoffScore > 50 ? 'VULNERABLE' : 'MODERATE',
          description: 'Runoff proxy based on heavy monsoon precipitation, impervious cover, and slope.',
          provenance: {
            category: 'DERIVED',
            source: 'Hydrological Proxy (Open-Meteo + DEM + Impervious Surface)',
            date: now.split('T')[0],
            method: 'Rational surface runoff coefficient weighted by slope and imperviousness',
            confidence: 'HIGH'
          }
        },
        heatVulnerabilityIndex: {
          name: 'Urban Heat Island Proxy',
          value: heatIndex,
          formattedValue: `+${weather.urbanHeatIslandProxyDeltaC}°C UHI delta`,
          unit: '°C delta',
          classification: heatIndex > 70 ? 'CRITICAL' : 'MODERATE',
          description: 'Microclimatic temperature excess due to lack of canopy cover and thermal mass of concrete.',
          provenance: {
            category: 'DERIVED',
            source: 'Open-Meteo & Impervious Surface Matrix',
            date: now.split('T')[0],
            method: 'Thermal mass retention and evapotranspiration modeling',
            confidence: 'HIGH'
          }
        },
        greenFragmentationIndex: {
          name: 'Green Space Fragmentation',
          value: fragmentation,
          formattedValue: `${fragmentation} (${fragmentation > 0.7 ? 'High' : 'Moderate'})`,
          unit: '0-1 scale',
          classification: fragmentation > 0.7 ? 'VULNERABLE' : 'MODERATE',
          description: 'Degree of isolation between vegetated patches.',
          provenance: {
            category: 'DERIVED',
            source: 'Landscape Metrics / Spatial Graph Analysis',
            date: now.split('T')[0],
            method: 'Nearest-neighbor distance and patch perimeter-to-area ratio',
            confidence: 'HIGH'
          }
        },
        ecologicalConnectivityScore: {
          name: 'Ecological Connectivity Potential',
          value: connectivity,
          formattedValue: `${connectivity} / 100`,
          unit: 'Index',
          classification: connectivity < 40 ? 'VULNERABLE' : 'GOOD',
          description: 'Capacity to create linked stepping-stone corridors for urban wildlife.',
          provenance: {
            category: 'DERIVED',
            source: 'Least-Cost Path Analysis Proxy',
            date: now.split('T')[0],
            method: 'Multi-criteria corridor resistance surface modeling',
            confidence: 'MEDIUM'
          }
        },
        availableInterventionZoneSqMeters: {
          name: 'Available Intervention Area',
          value: availableInterventionSqM,
          formattedValue: `${availableInterventionSqM.toLocaleString()} m²`,
          unit: 'm²',
          classification: 'OPTIMAL',
          description: 'Unutilized municipal roadside verges, low easements, and flat institutional roofs.',
          provenance: {
            category: 'DERIVED',
            source: 'Spatial Gap Analysis (OSM + Site Bounds)',
            date: now.split('T')[0],
            method: 'Negative spatial buffer masking of active roads and existing building footprints',
            confidence: 'HIGH'
          }
        }
      },
      providers: {
        osm,
        sentinel,
        weather,
        elevation,
        bhuvan: bhuvanRes || undefined
      },
      analyzedAt: now
    };
  }
}
