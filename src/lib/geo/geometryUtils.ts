import * as turf from '@turf/turf';
import { SitePolygon, LngLat } from '@/types/geo';

export interface PolygonStats {
  areaSqMeters: number;
  areaHectares: number;
  perimeterMeters: number;
  perimeterKilometers: number;
  vertexCount: number;
}

/**
 * Safely converts any point representation to a valid [longitude, latitude] pair
 */
export function sanitizeLngLat(pt: any): [number, number] {
  if (Array.isArray(pt)) {
    const lng = typeof pt[0] === 'number' ? pt[0] : parseFloat(pt[0]);
    const lat = typeof pt[1] === 'number' ? pt[1] : parseFloat(pt[1]);
    return [isNaN(lng) ? 0 : lng, isNaN(lat) ? 0 : lat];
  }
  if (pt && typeof pt === 'object') {
    const rawLng = pt.lng ?? pt.lon ?? 0;
    const rawLat = pt.lat ?? 0;
    const lng = typeof rawLng === 'number' ? rawLng : parseFloat(rawLng);
    const lat = typeof rawLat === 'number' ? rawLat : parseFloat(rawLat);
    return [isNaN(lng) ? 0 : lng, isNaN(lat) ? 0 : lat];
  }
  return [0, 0];
}

/**
 * Calculates certified geographic statistics (area, perimeter, vertices) using Turf.js
 */
export function computePolygonStats(coordsOrPolygon: [number, number][] | SitePolygon | any): PolygonStats | null {
  try {
    let closedCoords: [number, number][] = [];

    if (coordsOrPolygon?.geometry?.coordinates?.[0]) {
      closedCoords = coordsOrPolygon.geometry.coordinates[0].map(sanitizeLngLat);
    } else if (Array.isArray(coordsOrPolygon) && coordsOrPolygon.length >= 3) {
      const sanitized = coordsOrPolygon.map(sanitizeLngLat);
      const isClosed =
        sanitized[0][0] === sanitized[sanitized.length - 1][0] &&
        sanitized[0][1] === sanitized[sanitized.length - 1][1];
      closedCoords = isClosed ? sanitized : [...sanitized, sanitized[0]];
    } else {
      return null;
    }

    if (closedCoords.length < 4) return null;

    const turfPoly = turf.polygon([closedCoords]);
    const areaSqM = Math.round(turf.area(turfPoly));
    const areaHa = Number((areaSqM / 10000).toFixed(2));

    const line = turf.lineString(closedCoords);
    const perimM = Math.round(turf.length(line, { units: 'meters' }));
    const perimKm = Number((perimM / 1000).toFixed(2));
    const vertexCount = closedCoords.length - 1; // Exclude closing point duplicate

    return {
      areaSqMeters: areaSqM,
      areaHectares: areaHa,
      perimeterMeters: perimM,
      perimeterKilometers: perimKm,
      vertexCount
    };
  } catch (err) {
    console.error('[GEOMETRY] Failed to calculate polygon stats:', err);
    return null;
  }
}

/**
 * Builds a validated GeoJSON SitePolygon feature with calculated metrics
 */
export function buildSitePolygon(coords: [number, number][], name: string): SitePolygon | null {
  const stats = computePolygonStats(coords);
  if (!stats) return null;

  const sanitized = coords.map(sanitizeLngLat);
  const isClosed =
    sanitized[0][0] === sanitized[sanitized.length - 1][0] &&
    sanitized[0][1] === sanitized[sanitized.length - 1][1];
  const closedRing = isClosed ? sanitized : [...sanitized, sanitized[0]];

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [closedRing]
    },
    properties: {
      name,
      areaSquareMeters: stats.areaSqMeters,
      areaHectares: stats.areaHectares,
      perimeterMeters: stats.perimeterMeters,
      createdAt: new Date().toISOString()
    }
  };
}
