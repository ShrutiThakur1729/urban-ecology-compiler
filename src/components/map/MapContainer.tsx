'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { SitePolygon, LngLat, AppPhase } from '@/types/geo';
import { CandidateInterventionFeature } from '@/types/interventions';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as turf from '@turf/turf';
import { computePolygonStats, sanitizeLngLat } from '@/lib/geo/geometryUtils';

// ─────────────────────────────────────────────────────────────────────────────
// FREE TILE SOURCES — No API key required
// ─────────────────────────────────────────────────────────────────────────────
const TILE_SOURCES = {
  dark: {
    // ESRI Dark Gray Canvas — free, no API key required, reliable public service
    tiles: ['https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
    attribution: '© Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community',
    tileSize: 256,
    maxzoom: 16,
    label: 'Dark GIS'
  },
  light: {
    // OpenStreetMap standard tiles — completely free
    tiles: [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ],
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    tileSize: 256,
    maxzoom: 19,
    label: 'Light Map'
  },
  satellite: {
    // ESRI World Imagery — free, no API key
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: '© Esri, Maxar, Earthstar Geographics',
    tileSize: 256,
    maxzoom: 19,
    label: 'Satellite'
  }
} as const;

type MapStyleType = 'dark' | 'satellite' | 'light';

// ─────────────────────────────────────────────────────────────────────────────
// BUILD MAP STYLE — all sources and layers are baked in with strict z-ordering
// All 3 basemaps live in ONE style. No setStyle() is ever called.
// ─────────────────────────────────────────────────────────────────────────────
export function setBasemapVisibility(map: maplibregl.Map, type: MapStyleType) {
  const layerMap: Record<MapStyleType, string> = {
    light: 'base-osm',
    satellite: 'base-sat',
    dark: 'base-dark'
  };
  (['light', 'satellite', 'dark'] as MapStyleType[]).forEach((t) => {
    const layerId = layerMap[t];
    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', t === type ? 'visible' : 'none');
      }
    } catch (e) {
      console.warn(`[MAP] Error toggling basemap layer ${layerId}:`, e);
    }
  });
}

function buildMapStyle(initialType: MapStyleType = 'satellite'): maplibregl.StyleSpecification {
  const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

  const sources: Record<string, any> = {
    'base-osm': {
      type: 'raster',
      tiles: [...TILE_SOURCES.light.tiles],
      tileSize: TILE_SOURCES.light.tileSize,
      attribution: TILE_SOURCES.light.attribution,
      maxzoom: TILE_SOURCES.light.maxzoom
    },
    'base-sat': {
      type: 'raster',
      tiles: [...TILE_SOURCES.satellite.tiles],
      tileSize: TILE_SOURCES.satellite.tileSize,
      attribution: TILE_SOURCES.satellite.attribution,
      maxzoom: TILE_SOURCES.satellite.maxzoom
    },
    'base-dark': {
      type: 'raster',
      tiles: [...TILE_SOURCES.dark.tiles],
      tileSize: TILE_SOURCES.dark.tileSize,
      attribution: TILE_SOURCES.dark.attribution,
      maxzoom: TILE_SOURCES.dark.maxzoom
    },
    'selected-site': { type: 'geojson', data: emptyFC },
    'selected-site-points': { type: 'geojson', data: emptyFC },
    'site-drawing-polygon': { type: 'geojson', data: emptyFC },
    'site-drawing-line': { type: 'geojson', data: emptyFC },
    'site-drawing-points': { type: 'geojson', data: emptyFC },
    'compiled-interventions': { type: 'geojson', data: emptyFC }
  };

  const layers: maplibregl.LayerSpecification[] = [
    // 1. All 3 Base raster maps in ONE style — switch by toggling visibility
    {
      id: 'base-osm',
      type: 'raster',
      source: 'base-osm',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: initialType === 'light' ? 'visible' : 'none' }
    },
    {
      id: 'base-sat',
      type: 'raster',
      source: 'base-sat',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: initialType === 'satellite' ? 'visible' : 'none' }
    },
    {
      id: 'base-dark',
      type: 'raster',
      source: 'base-dark',
      minzoom: 0,
      maxzoom: 22,
      layout: { visibility: initialType === 'dark' ? 'visible' : 'none' }
    },

    // 2. Selected Site Polygon — unmissable on ANY basemap (dark casing technique)
    // Darker green fill
    {
      id: 'selected-site-fill',
      type: 'fill',
      source: 'selected-site',
      paint: {
        'fill-color': '#059669',
        'fill-opacity': 0.55
      }
    },
    // DARK CASING — thick black stroke behind bright line (visible on light AND dark tiles)
    {
      id: 'selected-site-casing',
      type: 'line',
      source: 'selected-site',
      paint: {
        'line-color': '#000000',
        'line-width': 9,
        'line-opacity': 0.65
      }
    },
    // Bright cyan-green primary border on top of dark casing
    {
      id: 'selected-site-outline',
      type: 'line',
      source: 'selected-site',
      paint: {
        'line-color': '#00ffcc',
        'line-width': 4,
        'line-opacity': 1.0
      }
    },
    // Soft outer glow
    {
      id: 'selected-site-outline-glow',
      type: 'line',
      source: 'selected-site',
      paint: {
        'line-color': '#00ffcc',
        'line-width': 18,
        'line-opacity': 0.30,
        'line-blur': 8
      }
    },
    // Vertex glow aura
    {
      id: 'selected-site-vertex-glow',
      type: 'circle',
      source: 'selected-site-points',
      paint: {
        'circle-radius': 18,
        'circle-color': '#00ffcc',
        'circle-opacity': 0.50,
        'circle-blur': 0.9
      }
    },
    // White dot with BLACK ring — readable on any basemap
    {
      id: 'selected-site-vertices',
      type: 'circle',
      source: 'selected-site-points',
      paint: {
        'circle-radius': 8,
        'circle-color': '#ffffff',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#000000',
        'circle-opacity': 1.0
      }
    },


    // 3. Drawing Preview Layers (Direct source binding — zero filter failure risk)
    {
      id: 'drawing-fill',
      type: 'fill',
      source: 'site-drawing-polygon',
      paint: {
        'fill-color': '#10b981',
        'fill-opacity': 0.35
      }
    },
    {
      id: 'drawing-outline',
      type: 'line',
      source: 'site-drawing-polygon',
      paint: {
        'line-color': '#2dd4bf',
        'line-width': 2.5,
        'line-opacity': 0.95
      }
    },
    {
      id: 'drawing-line',
      type: 'line',
      source: 'site-drawing-line',
      paint: {
        'line-color': '#2dd4bf',
        'line-width': 2.5,
        'line-opacity': 0.95
      }
    },
    // Glowing vertex aura
    {
      id: 'drawing-vertex-glow',
      type: 'circle',
      source: 'site-drawing-points',
      paint: {
        'circle-radius': 14,
        'circle-color': '#2dd4bf',
        'circle-opacity': 0.45,
        'circle-blur': 0.8
      }
    },
    // Crisp white dot core with emerald border
    {
      id: 'drawing-vertices',
      type: 'circle',
      source: 'site-drawing-points',
      paint: {
        'circle-radius': 6.5,
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#0d9488',
        'circle-opacity': 1.0
      }
    },

    // 4. Compiled Ecological Plan Interventions (Polygons, Lines, Points)
    {
      id: 'intervention-poly-fill',
      type: 'fill',
      source: 'compiled-interventions',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': ['coalesce', ['get', 'colorHex'], '#10b981'],
        'fill-opacity': 0.70
      }
    },
    {
      id: 'intervention-poly-outline',
      type: 'line',
      source: 'compiled-interventions',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'line-color': '#ffffff',
        'line-width': 2.5,
        'line-opacity': 0.95
      }
    },
    {
      id: 'intervention-lines-casing',
      type: 'line',
      source: 'compiled-interventions',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': '#ffffff',
        'line-width': 8,
        'line-opacity': 0.8
      }
    },
    {
      id: 'intervention-lines',
      type: 'line',
      source: 'compiled-interventions',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': ['coalesce', ['get', 'colorHex'], '#38bdf8'],
        'line-width': 5,
        'line-opacity': 0.95
      }
    },
    {
      id: 'intervention-points',
      type: 'circle',
      source: 'compiled-interventions',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 9,
        'circle-color': ['coalesce', ['get', 'colorHex'], '#f59e0b'],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.95
      }
    }
  ];

  return {
    version: 8,
    sources,
    layers
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFE GEOJSON SOURCE UPDATER
// Never guards with isStyleLoaded() or once('load').
// If getSource(id) exists -> setData. Else retry once on 'style.load'.
// ─────────────────────────────────────────────────────────────────────────────
function safeSetSource(map: maplibregl.Map | null, id: string, data: any) {
  if (!map) return;
  try {
    const src = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
    } else {
      map.once('style.load', () => {
        try {
          const retrySrc = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
          if (retrySrc) retrySrc.setData(data);
        } catch (e) {
          console.warn(`[MAP] retry safeSetSource failed for "${id}":`, e);
        }
      });
    }
  } catch (err) {
    console.error(`[MAP] Error setting data for source "${id}":`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS INTERFACE
// ─────────────────────────────────────────────────────────────────────────────
interface MapContainerProps {
  center: LngLat;
  zoom?: number;
  locationName?: string;
  sitePolygon: SitePolygon | null;
  interventions: CandidateInterventionFeature[];
  activeScenarioTitle?: string;
  isAnalyzing: boolean;
  onPolygonDrawn?: (poly: SitePolygon) => void;
  appPhase?: AppPhase;
  onCancelDrawing?: () => void;
  // Redesign extensions
  externalBeforeAfterSplit?: number;
  highlightedInterventionId?: string | null;
  externalMapStyle?: MapStyleType;
  onMapStyleChanged?: (style: MapStyleType) => void;
  onSelectFeature?: (props: any) => void;
  // Live drawing synchronizations
  isDrawingMode?: boolean;
  onDrawingProgress?: (pointsCount: number, points: LngLat[]) => void;
  triggerFinishDrawing?: number;
  triggerCancelDrawing?: number;
  triggerUndoDrawingPoint?: number;
  comparisonMode?: 'before' | 'after' | 'split';
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP CONTAINER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom = 14,
  locationName,
  sitePolygon,
  interventions,
  activeScenarioTitle,
  isAnalyzing,
  onPolygonDrawn,
  appPhase = 'DASHBOARD',
  onCancelDrawing,
  externalBeforeAfterSplit = 50,
  highlightedInterventionId,
  externalMapStyle,
  onMapStyleChanged,
  onSelectFeature,
  isDrawingMode = false,
  onDrawingProgress,
  triggerFinishDrawing,
  triggerCancelDrawing,
  triggerUndoDrawingPoint,
  comparisonMode = 'after'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const splitMapContainerRef = useRef<HTMLDivElement>(null);
  const splitMapRef = useRef<maplibregl.Map | null>(null);
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const mapReadyRef = useRef(false);

  // Synchronization refs to avoid stale closures and race conditions on reload
  const sitePolygonRef = useRef<SitePolygon | null>(sitePolygon);
  sitePolygonRef.current = sitePolygon;

  const interventionsRef = useRef<CandidateInterventionFeature[]>(interventions);
  interventionsRef.current = interventions;

  // Stale-callback fix: store callbacks in refs and read inside handlers
  const onDrawingProgressRef = useRef(onDrawingProgress);
  onDrawingProgressRef.current = onDrawingProgress;

  const onSelectFeatureRef = useRef(onSelectFeature);
  onSelectFeatureRef.current = onSelectFeature;

  const drawingPointsRef = useRef<LngLat[]>([]);
  const drawingActiveRef = useRef(false);

  const [mapStyleType, setMapStyleType] = useState<MapStyleType>(externalMapStyle || 'satellite');
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [drawingPointCount, setDrawingPointCount] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  // Before/After slider: 0 = current site only, 100 = full compiled plan
  const [beforeAfterSplit, setBeforeAfterSplit] = useState(100);
  const beforeAfterSplitRef = useRef(100);
  beforeAfterSplitRef.current = beforeAfterSplit;

  const [showInterventions, setShowInterventions] = useState(true);
  const showInterventionsRef = useRef(true);
  showInterventionsRef.current = showInterventions;

  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const hiddenTypesRef = useRef<Set<string>>(hiddenTypes);
  hiddenTypesRef.current = hiddenTypes;

  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState<any | null>(null);
  const [showInterventionList, setShowInterventionList] = useState(false);
  const [showDebugHud, setShowDebugHud] = useState(true);

  // Helper: Safely converts any point representation (array or object) to [lng, lat] numbers
  const toLngLatCoord = (pt: any): [number, number] => {
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
  };

  // ─── Drawing: Render preview geometry ───────────────────────────────────────
  const renderDrawingPreview = useCallback((map: maplibregl.Map, pts: LngLat[]) => {
    const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

    if (!pts || pts.length === 0) {
      safeSetSource(map, 'site-drawing-polygon', emptyFC);
      safeSetSource(map, 'site-drawing-line', emptyFC);
      safeSetSource(map, 'site-drawing-points', emptyFC);
      return;
    }

    // Safely extract [lng, lat] coordinate pairs
    const coords: [number, number][] = pts.map(toLngLatCoord);

    // 1. Glowing vertex dots
    const vertexFeatures: GeoJSON.Feature[] = coords.map((coord, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coord },
      properties: { idx: i }
    }));
    safeSetSource(map, 'site-drawing-points', {
      type: 'FeatureCollection',
      features: vertexFeatures
    });

    // 2. Connecting line between vertices (2+ points)
    if (coords.length >= 2) {
      safeSetSource(map, 'site-drawing-line', {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {}
        }]
      });
    } else {
      safeSetSource(map, 'site-drawing-line', emptyFC);
    }

    // 3. Live preview polygon (3+ points)
    if (coords.length >= 3) {
      const closedRing: [number, number][] = [...coords, coords[0]];
      safeSetSource(map, 'site-drawing-polygon', {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [closedRing] },
          properties: {}
        }]
      });
    } else {
      safeSetSource(map, 'site-drawing-polygon', emptyFC);
    }

    console.log('[DRAW] preview updated:', coords.length, 'points, sample:', coords[0]);
  }, []);

  // ─── Drawing: Live stats calculation ───────────────────────────────────────
  const liveDrawingStats = useCallback(() => {
    const pts = drawingPointsRef.current;
    if (!pts || pts.length < 3) return null;
    try {
      const coords: [number, number][] = pts.map(toLngLatCoord);
      const closed: [number, number][] = [...coords, coords[0]];
      const poly = turf.polygon([closed]);
      const areaSqM = turf.area(poly);
      const perimM = turf.length(turf.lineString(closed), { units: 'meters' });
      return {
        areaSqM: Math.round(areaSqM),
        areaHa: Number((areaSqM / 10000).toFixed(2)),
        perimM: Math.round(perimM)
      };
    } catch { return null; }
  }, []);

  // ─── Restore all custom application sources & layers ───────────────────────
  const restoreApplicationLayers = useCallback((map: maplibregl.Map) => {
    if (!map || !map.isStyleLoaded()) return;

    const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

    // 1. Restore Site Polygon with glowing corner vertices
    const currentPoly = sitePolygonRef.current;
    if (currentPoly) {
      safeSetSource(map, 'selected-site', currentPoly as any);
      if (currentPoly.geometry?.coordinates?.[0]) {
        const ring = currentPoly.geometry.coordinates[0];
        const cornerFeatures: GeoJSON.Feature[] = ring.slice(0, -1).map((coord: any, idx: number) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: toLngLatCoord(coord) },
          properties: { idx }
        }));
        safeSetSource(map, 'selected-site-points', {
          type: 'FeatureCollection',
          features: cornerFeatures
        });
      }
    } else {
      safeSetSource(map, 'selected-site', emptyFC);
      safeSetSource(map, 'selected-site-points', emptyFC);
    }

    // 2. Restore Drawing Preview
    if (drawingPointsRef.current.length > 0) {
      renderDrawingPreview(map, [...drawingPointsRef.current]);
    } else {
      safeSetSource(map, 'site-drawing-polygon', emptyFC);
      safeSetSource(map, 'site-drawing-line', emptyFC);
      safeSetSource(map, 'site-drawing-points', emptyFC);
    }

    // 3. Restore Compiled Interventions
    const currentInterventions = interventionsRef.current;
    // When comparisonMode === 'before' or 'split', base map hides interventions.
    // In 'after' mode, base map renders interventions at 100%.
    // In 'split' mode, top synchronized map renders interventions with dynamic clipPath.
    const isVisible =
      comparisonMode === 'before'
        ? false
        : comparisonMode === 'split'
        ? false
        : showInterventionsRef.current;
    const opacityFactor = isVisible ? 1.0 : 0;
    const visibleItems = currentInterventions.filter(i => !hiddenTypesRef.current.has(i.interventionId));

    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: visibleItems.map(i => ({
        type: 'Feature' as const,
        geometry: i.geometry as any,
        properties: {
          ...i.properties,
          id: i.id,
          name: i.name,
          interventionId: i.interventionId,
          colorHex: i.properties?.colorHex || '#10b981'
        }
      }))
    };

    safeSetSource(map, 'compiled-interventions', fc);

    // 4. Update Opacities
    const setPaint = (layer: string, prop: string, val: any) => {
      try { if (map.getLayer(layer)) map.setPaintProperty(layer, prop as any, val); } catch {}
    };

    setPaint('intervention-poly-fill', 'fill-opacity', 0.70 * opacityFactor);
    setPaint('intervention-poly-outline', 'line-opacity', 0.95 * opacityFactor);
    setPaint('intervention-lines-casing', 'line-opacity', 0.80 * opacityFactor);
    setPaint('intervention-lines', 'line-opacity', 0.95 * opacityFactor);
    setPaint('intervention-points', 'circle-opacity', 0.95 * opacityFactor);
    setPaint('intervention-points', 'circle-stroke-opacity', 0.95 * opacityFactor);
    setPaint('intervention-labels', 'text-opacity', opacityFactor);

    // Site polygon — unmissable on any basemap
    setPaint('selected-site-fill', 'fill-opacity', 0.55);
    setPaint('selected-site-casing', 'line-opacity', 0.65);
    setPaint('selected-site-outline', 'line-opacity', 1.0);
    setPaint('selected-site-outline-glow', 'line-opacity', 0.30);


    console.log('[MAP] Application layers restored:', {
      hasSitePolygon: !!currentPoly,
      interventionsCount: visibleItems.length,
      opacityFactor
    });
  }, [renderDrawingPreview]);

  // ─── Drawing: Start ────────────────────────────────────────────────────────
  const startDrawing = useCallback(() => {
    drawingActiveRef.current = true;
    drawingPointsRef.current = [];
    setDrawingPointCount(0);
    setIsDrawing(true);
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = 'crosshair';
      const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
      safeSetSource(map, 'site-drawing-polygon', emptyFC);
      safeSetSource(map, 'site-drawing-line', emptyFC);
      safeSetSource(map, 'site-drawing-points', emptyFC);
    }
  }, []);

  // ─── Drawing: Cancel ───────────────────────────────────────────────────────
  const cancelDrawing = useCallback(() => {
    drawingActiveRef.current = false;
    drawingPointsRef.current = [];
    setDrawingPointCount(0);
    setIsDrawing(false);
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = '';
      const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
      safeSetSource(map, 'site-drawing-polygon', emptyFC);
      safeSetSource(map, 'site-drawing-line', emptyFC);
      safeSetSource(map, 'site-drawing-points', emptyFC);
    }
    if (onCancelDrawing) onCancelDrawing();
  }, [onCancelDrawing]);

  // ─── Drawing: Finish ───────────────────────────────────────────────────────
  const finishDrawing = useCallback(() => {
    const pts = drawingPointsRef.current;
    if (pts.length < 3) return;

    const coords: [number, number][] = pts.map(sanitizeLngLat);
    const closedCoords: [number, number][] = [...coords, coords[0]];
    const stats = computePolygonStats(closedCoords);
    if (!stats) return;

    const newPolygon: SitePolygon = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [closedCoords] },
      properties: {
        name: locationName ? `${locationName} Custom Boundary` : 'Custom Urban Boundary',
        areaSquareMeters: stats.areaSqMeters,
        areaHectares: stats.areaHectares,
        perimeterMeters: stats.perimeterMeters,
        createdAt: new Date().toISOString()
      }
    };

    console.log('[DRAW] Finish Boundary completed:', {
      areaSqM: stats.areaSqMeters,
      areaHa: stats.areaHectares,
      perimeterMeters: stats.perimeterMeters,
      vertexCount: stats.vertexCount,
      coordinates: closedCoords
    });

    // Stop drawing
    drawingActiveRef.current = false;
    drawingPointsRef.current = [];
    setDrawingPointCount(0);
    setIsDrawing(false);

    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = '';
      const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
      safeSetSource(map, 'site-drawing-polygon', emptyFC);
      safeSetSource(map, 'site-drawing-line', emptyFC);
      safeSetSource(map, 'site-drawing-points', emptyFC);

      safeSetSource(map, 'selected-site', newPolygon as any);

      // Add corner vertex features so the completed site retains the glowing vertices
      const cornerFeatures: GeoJSON.Feature[] = coords.map((coord, idx) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coord },
        properties: { idx }
      }));
      safeSetSource(map, 'selected-site-points', {
        type: 'FeatureCollection',
        features: cornerFeatures
      });

      try {
        const turfPoly = turf.polygon([closedCoords]);
        const bbox = turf.bbox(turfPoly);
        map.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: 70, duration: 1000 }
        );
      } catch (e) {}
    }

    if (onPolygonDrawn) onPolygonDrawn(newPolygon);
  }, [locationName, onPolygonDrawn]);

  // ─── Map Click Handler (Drawing clicks & tap-to-close) ──────────────────────
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!drawingActiveRef.current) return;
    const pts = drawingPointsRef.current;
    const map = mapRef.current;

    // Tap first vertex (< 14px screen distance) with >= 3 points to close polygon
    if (pts.length >= 3 && map) {
      const firstScreenPt = map.project(toLngLatCoord(pts[0]) as any);
      const clickScreenPt = e.point;
      const dist = Math.hypot(firstScreenPt.x - clickScreenPt.x, firstScreenPt.y - clickScreenPt.y);
      if (dist < 14) {
        finishDrawing();
        return;
      }
    }

    const pt: LngLat = [Number(e.lngLat.lng.toFixed(6)), Number(e.lngLat.lat.toFixed(6))];
    drawingPointsRef.current.push(pt);
    const count = drawingPointsRef.current.length;
    setDrawingPointCount(count);

    onDrawingProgressRef.current?.(count, [...drawingPointsRef.current]);

    console.log('[DRAW] coordinate received:', { lng: pt[0], lat: pt[1] });
    console.log('[DRAW] vertex count:', count);

    if (map) {
      renderDrawingPreview(map, [...drawingPointsRef.current]);
    }
  }, [finishDrawing, renderDrawingPreview]);

  // ─── Drawing triggers from external buttons ────────────────────────────────
  useEffect(() => {
    if (triggerFinishDrawing && triggerFinishDrawing > 0) {
      finishDrawing();
    }
  }, [triggerFinishDrawing, finishDrawing]);

  useEffect(() => {
    if (triggerUndoDrawingPoint && triggerUndoDrawingPoint > 0 && drawingPointsRef.current.length > 0) {
      drawingPointsRef.current.pop();
      const count = drawingPointsRef.current.length;
      setDrawingPointCount(count);
      const map = mapRef.current;
      if (map) {
        renderDrawingPreview(map, [...drawingPointsRef.current]);
      }
      if (onDrawingProgress) {
        onDrawingProgress(count, [...drawingPointsRef.current]);
      }
    }
  }, [triggerUndoDrawingPoint, renderDrawingPreview, onDrawingProgress]);

  useEffect(() => {
    if (triggerCancelDrawing && triggerCancelDrawing > 0) {
      cancelDrawing();
    }
  }, [triggerCancelDrawing, cancelDrawing]);

  // ─── Location Marker ───────────────────────────────────────────────────────
  const updateLocationMarker = useCallback((map: maplibregl.Map, coord: LngLat) => {
    if (locationMarkerRef.current) locationMarkerRef.current.remove();
    const el = document.createElement('div');
    el.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;';
    el.innerHTML = `
      <div style="position:absolute;width:32px;height:32px;background:rgba(16,185,129,0.3);border-radius:50%;animation:pulseGlow 2s ease-in-out infinite;"></div>
      <div style="width:14px;height:14px;background:#10b981;border:2.5px solid #ffffff;border-radius:50%;box-shadow:0 3px 10px rgba(0,0,0,0.5);z-index:1;"></div>
    `;
    locationMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(coord)
      .addTo(map);
  }, []);

  // ─── AppPhase -> Drawing Mode sync ─────────────────────────────────────────
  useEffect(() => {
    if (appPhase === 'DRAWING') {
      if (!drawingActiveRef.current) startDrawing();
    } else {
      if (drawingActiveRef.current) {
        drawingActiveRef.current = false;
        drawingPointsRef.current = [];
        setDrawingPointCount(0);
        setIsDrawing(false);
        const map = mapRef.current;
        if (map) {
          map.getCanvas().style.cursor = '';
          const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
          safeSetSource(map, 'site-drawing-polygon', emptyFC);
          safeSetSource(map, 'site-drawing-line', emptyFC);
          safeSetSource(map, 'site-drawing-points', emptyFC);
        }
      }
    }
  }, [appPhase, startDrawing]);

  // ─── Single Map Instance Lifecycle ─────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    setMapLoadError(null);
    mapReadyRef.current = false;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildMapStyle(mapStyleType),
        center,
        zoom,
        attributionControl: false
      });
    } catch (err: any) {
      setMapLoadError(err?.message || 'WebGL initialization failed');
      return;
    }

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    // Click handler for drawing
    map.on('click', handleMapClick);

    // Click handler for intervention inspection — calls parent onSelectFeature
    const onIntClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (drawingActiveRef.current) return;
      if (e.features?.length) {
        const props = e.features[0].properties;
        setSelectedFeatureInfo(props);
        onSelectFeatureRef.current?.(props);
      }
    };
    map.on('click', 'intervention-poly-fill', onIntClick);
    map.on('click', 'intervention-lines', onIntClick);
    map.on('click', 'intervention-points', onIntClick);

    // Cursor changes on hover
    const setPointer = () => { if (!drawingActiveRef.current) map.getCanvas().style.cursor = 'pointer'; };
    const resetCursor = () => { if (!drawingActiveRef.current) map.getCanvas().style.cursor = ''; };
    map.on('mouseenter', 'intervention-poly-fill', setPointer);
    map.on('mouseleave', 'intervention-poly-fill', resetCursor);
    map.on('mouseenter', 'intervention-lines', setPointer);
    map.on('mouseleave', 'intervention-lines', resetCursor);
    map.on('mouseenter', 'intervention-points', setPointer);
    map.on('mouseleave', 'intervention-points', resetCursor);

    map.on('error', (e) => {
      console.warn('[MAP] error:', e.error?.message || e);
    });

    map.on('load', () => {
      mapReadyRef.current = true;
      // Expose window.__map in development only
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        (window as any).__map = map;
      }
      updateLocationMarker(map, center);
      restoreApplicationLayers(map);
      console.log('[MAP] Map load event fired. Initial layers and sources restored.');
    });

    map.on('style.load', () => {
      if (mapReadyRef.current) {
        restoreApplicationLayers(map);
        console.log('[MAP] Basemap style.load event fired. Restored all application layers.');
      }
    });

    return () => {
      if (typeof window !== 'undefined' && (window as any).__map === map) {
        delete (window as any).__map;
      }
      if (locationMarkerRef.current) locationMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Basemap style switcher by toggling visibility (No setStyle()!) ───────
  const handleStyleChange = useCallback((newType: MapStyleType) => {
    setMapStyleType(newType);
    const map = mapRef.current;
    if (map) {
      setBasemapVisibility(map, newType);
    }
    if (splitMapRef.current) {
      setBasemapVisibility(splitMapRef.current, newType);
    }
    if (onMapStyleChanged) onMapStyleChanged(newType);
  }, [onMapStyleChanged]);

  // ─── Center / Zoom changes ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center, zoom, duration: 1600, essential: true });
    updateLocationMarker(map, center);
  }, [center, zoom, updateLocationMarker]);

  // ─── Unified Reactive Push: sitePolygon, drawing, active plan ─────────────
  useEffect(() => {
    sitePolygonRef.current = sitePolygon;
    interventionsRef.current = interventions;
    beforeAfterSplitRef.current = beforeAfterSplit;
    showInterventionsRef.current = showInterventions;
    hiddenTypesRef.current = hiddenTypes;

    const map = mapRef.current;
    if (!map) return;

    restoreApplicationLayers(map);

    if (sitePolygon) {
      try {
        const bbox = turf.bbox(sitePolygon);
        const timer = setTimeout(() => {
          const m = mapRef.current;
          if (!m) return;
          m.fitBounds(
            [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
            { padding: 100, duration: 800, maxZoom: 17 }
          );
        }, 1200);
        return () => clearTimeout(timer);
      } catch (e) {}
    }
  }, [sitePolygon, interventions, drawingPointCount, showInterventions, beforeAfterSplit, hiddenTypes, restoreApplicationLayers]);

  // ─── External Controls Synchronization ─────────────────────────────────────
  useEffect(() => {
    if (typeof externalBeforeAfterSplit === 'number') {
      setBeforeAfterSplit(externalBeforeAfterSplit);
    }
  }, [externalBeforeAfterSplit]);

  useEffect(() => {
    if (externalMapStyle && externalMapStyle !== mapStyleType) {
      handleStyleChange(externalMapStyle);
    }
  }, [externalMapStyle, mapStyleType, handleStyleChange]);

  useEffect(() => {
    if (!highlightedInterventionId) return;
    const match = interventions.find(i => i.id === highlightedInterventionId);
    if (match && mapRef.current) {
      setSelectedFeatureInfo(match.properties);
      try {
        const centerCoord = turf.center(match as any).geometry.coordinates as [number, number];
        mapRef.current.flyTo({ center: centerCoord, zoom: 16, duration: 900 });
      } catch {}
    }
  }, [highlightedInterventionId, interventions]);

  // ─── Toggle Intervention Types ─────────────────────────────────────────────
  const toggleType = (id: string) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const interventionTypes = Array.from(
    new Map(interventions.map(i => [i.interventionId, { name: i.name, color: i.properties?.colorHex || '#10b981' }])).entries()
  );

  // ─── Synchronized Split View Comparison Engine ─────────────────────────────
  useEffect(() => {
    if (comparisonMode !== 'split' || !splitMapContainerRef.current) {
      if (splitMapRef.current) {
        splitMapRef.current.remove();
        splitMapRef.current = null;
      }
      return;
    }

    const baseMap = mapRef.current;
    if (!baseMap) return;

    try {
      const splitMap = new maplibregl.Map({
        container: splitMapContainerRef.current,
        style: buildMapStyle(mapStyleType),
        center: baseMap.getCenter(),
        zoom: baseMap.getZoom(),
        bearing: baseMap.getBearing(),
        pitch: baseMap.getPitch(),
        interactive: false,
        attributionControl: false
      });

      splitMapRef.current = splitMap;

      splitMap.on('load', () => {
        // Render interventions with full visibility on split overlay
        const fc: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: interventionsRef.current.map(i => ({
            type: 'Feature' as const,
            geometry: i.geometry as any,
            properties: {
              ...i.properties,
              id: i.id,
              name: i.name,
              interventionId: i.interventionId,
              colorHex: i.properties?.colorHex || '#10b981'
            }
          }))
        };
        safeSetSource(splitMap, 'compiled-interventions', fc);

        if (sitePolygonRef.current) {
          safeSetSource(splitMap, 'selected-site', sitePolygonRef.current as any);
        }

        // Ensure interventions layer opacity is 1 on split map
        try {
          if (splitMap.getLayer('intervention-poly-fill')) splitMap.setPaintProperty('intervention-poly-fill', 'fill-opacity', 0.70);
          if (splitMap.getLayer('intervention-poly-outline')) splitMap.setPaintProperty('intervention-poly-outline', 'line-opacity', 0.95);
          if (splitMap.getLayer('intervention-lines')) splitMap.setPaintProperty('intervention-lines', 'line-opacity', 0.95);
          if (splitMap.getLayer('intervention-points')) splitMap.setPaintProperty('intervention-points', 'circle-opacity', 0.95);
        } catch {}
      });

      const syncMaps = () => {
        if (!splitMapRef.current || !mapRef.current) return;
        splitMapRef.current.jumpTo({
          center: mapRef.current.getCenter(),
          zoom: mapRef.current.getZoom(),
          bearing: mapRef.current.getBearing(),
          pitch: mapRef.current.getPitch()
        });
      };

      baseMap.on('move', syncMaps);

      return () => {
        baseMap.off('move', syncMaps);
        if (splitMapRef.current) {
          splitMapRef.current.remove();
          splitMapRef.current = null;
        }
      };
    } catch (e) {
      console.warn('[MAP] Split map init error:', e);
    }
  }, [comparisonMode, mapStyleType]);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 overflow-hidden">
      {/* Base Map WebGL Canvas (Baseline Existing Site) */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Split Comparison Overlay Map (Compiled Plan) - dynamically clipped along the divider */}
      {comparisonMode === 'split' && (
        <div
          ref={splitMapContainerRef}
          style={{ clipPath: `inset(0 0 0 ${externalBeforeAfterSplit}%)` }}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* Map Load Error Overlay */}
      {mapLoadError && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col items-center justify-center gap-4 text-center px-8">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-1">Map Load Issue</h4>
            <p className="text-xs text-slate-400 max-w-xs">{mapLoadError}</p>
          </div>
          <button
            onClick={() => handleStyleChange('light')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Switch to Light Map
          </button>
        </div>
      )}
    </div>
  );
};
