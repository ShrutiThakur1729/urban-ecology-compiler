'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { SitePolygon, LngLat, AppPhase } from '@/types/geo';
import { CandidateInterventionFeature } from '@/types/interventions';
import { Eye, EyeOff, AlertCircle, RefreshCw, X, Check, Pencil, Layers, Info, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import * as turf from '@turf/turf';

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
// ─────────────────────────────────────────────────────────────────────────────
function buildMapStyle(type: MapStyleType): maplibregl.StyleSpecification {
  const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
  const src = TILE_SOURCES[type];

  const sources: Record<string, any> = {
    'base-tiles': {
      type: 'raster',
      tiles: [...src.tiles],
      tileSize: src.tileSize,
      attribution: src.attribution,
      maxzoom: src.maxzoom
    },
    'selected-site': { type: 'geojson', data: emptyFC },
    'selected-site-points': { type: 'geojson', data: emptyFC },
    'site-drawing-polygon': { type: 'geojson', data: emptyFC },
    'site-drawing-line': { type: 'geojson', data: emptyFC },
    'site-drawing-points': { type: 'geojson', data: emptyFC },
    'compiled-interventions': { type: 'geojson', data: emptyFC }
  };

  const layers: maplibregl.LayerSpecification[] = [
    // 1. Base raster map
    { id: 'base-tiles-layer', type: 'raster', source: 'base-tiles', minzoom: 0, maxzoom: 22 },

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
// ─────────────────────────────────────────────────────────────────────────────
function safeSetSource(map: maplibregl.Map | null, id: string, data: any) {
  if (!map) return;
  try {
    const src = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
    } else {
      if (!map.isStyleLoaded()) {
        map.once('load', () => {
          const retrySrc = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
          if (retrySrc) retrySrc.setData(data);
        });
      }
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
  onCancelDrawing
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const mapReadyRef = useRef(false);

  // Synchronization refs to avoid stale closures and race conditions on reload
  const sitePolygonRef = useRef<SitePolygon | null>(sitePolygon);
  sitePolygonRef.current = sitePolygon;

  const interventionsRef = useRef<CandidateInterventionFeature[]>(interventions);
  interventionsRef.current = interventions;

  const drawingPointsRef = useRef<LngLat[]>([]);
  const drawingActiveRef = useRef(false);

  const [mapStyleType, setMapStyleType] = useState<MapStyleType>('dark');
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
    const isVisible = showInterventionsRef.current && beforeAfterSplitRef.current > 0;
    const opacityFactor = isVisible ? beforeAfterSplitRef.current / 100 : 0;
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

    const coords: [number, number][] = pts.map(toLngLatCoord);
    const closedCoords: [number, number][] = [...coords, coords[0]];
    const turfPoly = turf.polygon([closedCoords]);
    const areaSqM = Math.round(turf.area(turfPoly));
    const perimM = Math.round(turf.length(turf.lineString(closedCoords), { units: 'meters' }));

    const newPolygon: SitePolygon = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [closedCoords] },
      properties: {
        name: locationName ? `${locationName} Custom Area` : 'Custom Urban Area',
        areaSquareMeters: areaSqM,
        areaHectares: Number((areaSqM / 10000).toFixed(2)),
        perimeterMeters: perimM,
        createdAt: new Date().toISOString()
      }
    };

    console.log('[DRAW] Finish Area completed:', {
      areaSqM,
      areaHa: newPolygon.properties.areaHectares,
      perimeterMeters: perimM,
      vertexCount: closedCoords.length,
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
        const bbox = turf.bbox(turfPoly);
        map.fitBounds(
          [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
          { padding: 70, duration: 1000 }
        );
      } catch (e) {}
    }

    if (onPolygonDrawn) onPolygonDrawn(newPolygon);
  }, [locationName, onPolygonDrawn]);

  // ─── Map Click Handler (Drawing clicks) ─────────────────────────────────────
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!drawingActiveRef.current) return;
    const pt: LngLat = [Number(e.lngLat.lng.toFixed(6)), Number(e.lngLat.lat.toFixed(6))];
    drawingPointsRef.current.push(pt);
    const count = drawingPointsRef.current.length;
    setDrawingPointCount(count);

    console.log('[DRAW] coordinate received:', { lng: pt[0], lat: pt[1] });
    console.log('[DRAW] vertex count:', count);
    console.log('[DRAW] GeoJSON coordinates:', JSON.stringify(drawingPointsRef.current));

    const map = mapRef.current;
    if (map) {
      renderDrawingPreview(map, [...drawingPointsRef.current]);
      console.log('[DRAW] map source updated: site-drawing preview updated with vertex count', count);
    }
  }, [renderDrawingPreview]);

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

    // Click handler for intervention inspection
    const onIntClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (drawingActiveRef.current) return;
      if (e.features?.length) setSelectedFeatureInfo(e.features[0].properties);
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
      if (locationMarkerRef.current) locationMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Basemap style switcher without destroying map instance ───────────────
  const handleStyleChange = useCallback((newType: MapStyleType) => {
    setMapStyleType(newType);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildMapStyle(newType));
  }, []);

  // ─── Center / Zoom changes ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center, zoom, duration: 1600, essential: true });
    updateLocationMarker(map, center);
  }, [center, zoom, updateLocationMarker]);

  // ─── Reactive Site Polygon Sync ────────────────────────────────────────────
  useEffect(() => {
    sitePolygonRef.current = sitePolygon;
    const map = mapRef.current;
    if (!map) return;

    const emptyFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

    if (sitePolygon) {
      safeSetSource(map, 'selected-site', sitePolygon as any);

      if (sitePolygon.geometry?.coordinates?.[0]) {
        const ring = sitePolygon.geometry.coordinates[0];
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

      // Delay fitBounds by 1800ms so it fires AFTER the center flyTo (1600ms) completes.
      // Without this delay, flyTo overrides fitBounds and the polygon goes off-screen.
      try {
        const bbox = turf.bbox(sitePolygon);
        setTimeout(() => {
          const m = mapRef.current;
          if (!m) return;
          m.fitBounds(
            [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
            { padding: 100, duration: 800, maxZoom: 17 }
          );
        }, 1800);
      } catch (e) {}
    } else {
      safeSetSource(map, 'selected-site', emptyFC);
      safeSetSource(map, 'selected-site-points', emptyFC);
    }
  }, [sitePolygon]);


  // ─── Reactive Interventions & Before/After Slider Sync ─────────────────────
  useEffect(() => {
    interventionsRef.current = interventions;
    beforeAfterSplitRef.current = beforeAfterSplit;
    showInterventionsRef.current = showInterventions;
    hiddenTypesRef.current = hiddenTypes;

    const map = mapRef.current;
    if (!map) return;

    restoreApplicationLayers(map);
  }, [interventions, showInterventions, beforeAfterSplit, hiddenTypes, restoreApplicationLayers]);

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

  const stats = isDrawing ? liveDrawingStats() : null;

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 overflow-hidden">
      {/* Map WebGL Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

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

      {/* ── DRAWING MODE UI OVERLAY (Matching Lovable reference) ──────────── */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-fade-in">
          <div className="flex flex-col items-center gap-2">
            {/* Instruction bar */}
            <div className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-700/60 text-white shadow-2xl">
              <div className="p-2 rounded-xl bg-teal-950/70 border border-teal-500/40 text-teal-400">
                <Pencil className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono tracking-widest uppercase text-teal-400 font-bold">
                  DRAW SITE BOUNDARY
                </span>
                <span className="text-xs font-semibold text-slate-100">
                  Click points on the map to define your urban site.
                </span>
                <span className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {drawingPointCount} {drawingPointCount === 1 ? 'point' : 'points'} placed
                </span>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={cancelDrawing}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
                >
                  Cancel
                </button>
                {drawingPointCount >= 3 ? (
                  <button
                    onClick={finishDrawing}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" /> Complete boundary
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-slate-800/70 text-slate-500 font-medium text-xs flex items-center gap-1.5 cursor-not-allowed opacity-60"
                  >
                    <Check className="w-4 h-4" /> Complete boundary
                  </button>
                )}
              </div>
            </div>

            {/* Live stats */}
            {stats && (
              <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-300 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">AREA</span>
                  <span className="font-mono text-white">{stats.areaHa} Ha</span>
                  <span className="text-slate-500">({stats.areaSqM.toLocaleString()} m²)</span>
                </div>
                <div className="w-px h-4 bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-semibold">PERIMETER</span>
                  <span className="font-mono text-white">
                    {stats.perimM >= 1000 ? `${(stats.perimM / 1000).toFixed(2)} km` : `${stats.perimM} m`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAP STYLE SWITCHER & CONTROLS (Top Left) ──────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="glass-panel rounded-xl p-1 flex items-center gap-0.5 shadow-lg">
          {(['dark', 'satellite', 'light'] as MapStyleType[]).map(type => (
            <button
              key={type}
              onClick={() => handleStyleChange(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                mapStyleType === type
                  ? 'bg-slate-800 text-emerald-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {TILE_SOURCES[type].label}
            </button>
          ))}
        </div>

        {/* Redraw Site Area button in DASHBOARD phase */}
        {appPhase === 'DASHBOARD' && !isDrawing && (
          <button
            onClick={startDrawing}
            className="glass-panel px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 text-slate-200 hover:bg-slate-800/90 transition shadow"
          >
            <Pencil className="w-3.5 h-3.5 text-emerald-400" />
            Redraw Site Area
          </button>
        )}
      </div>

      {/* ── COMPILED PLAN SLIDER + INTERVENTIONS LEGEND (Bottom Right) ────── */}
      {interventions.length > 0 && (
        <div className="absolute bottom-8 right-4 z-20 flex flex-col gap-2 items-end pointer-events-auto">
          {/* Spatial Interventions Legend */}
          <div className="glass-panel p-2.5 rounded-xl shadow-xl max-w-xs text-xs space-y-1.5 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800 pb-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              <span>Proposed Interventions</span>
              {activeScenarioTitle && (
                <span className="ml-auto text-emerald-400 font-bold text-[9px] truncate max-w-[110px]">
                  {activeScenarioTitle}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-28 overflow-y-auto pr-1">
              {interventionTypes.map(([id, info]) => {
                const hidden = hiddenTypes.has(id);
                return (
                  <div
                    key={id}
                    onClick={() => toggleType(id)}
                    className={`flex items-center gap-2 px-1.5 py-0.5 rounded cursor-pointer transition text-[11px] ${
                      !hidden ? 'text-slate-200 hover:bg-slate-800/60' : 'text-slate-500 line-through opacity-60'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="truncate">{info.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Before/After slider */}
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 text-xs text-slate-300 shadow-xl">
            <span className={`font-mono text-[10px] uppercase ${beforeAfterSplit === 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
              Current Site
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={beforeAfterSplit}
              onChange={e => setBeforeAfterSplit(Number(e.target.value))}
              className="w-28 accent-emerald-500 cursor-pointer"
            />
            <span className={`font-mono text-[10px] uppercase ${beforeAfterSplit === 100 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
              Compiled ({beforeAfterSplit}%)
            </span>
          </div>

          {/* Intervention layers dropdown */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
            <button
              onClick={() => setShowInterventionList(prev => !prev)}
              className={`w-full px-3 py-1.5 flex items-center gap-2 text-xs font-medium transition ${
                showInterventions ? 'text-emerald-300' : 'text-slate-400'
              }`}
            >
              {showInterventions ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Interventions ({interventions.length})</span>
              <span className="ml-auto text-slate-500 text-[10px]">▾</span>
            </button>

            {showInterventionList && (
              <div className="border-t border-slate-800 p-2 space-y-1 min-w-[190px]">
                {/* Master toggle */}
                <button
                  onClick={() => setShowInterventions(p => !p)}
                  className={`w-full text-left text-[11px] px-2 py-1 rounded-lg flex items-center gap-2 transition ${
                    showInterventions ? 'bg-emerald-950/50 text-emerald-300' : 'text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`w-3 h-3 rounded border flex items-center justify-center ${showInterventions ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                    {showInterventions && <Check className="w-2 h-2 text-white" />}
                  </span>
                  All Interventions
                </button>

                {/* Per-type toggles */}
                {interventionTypes.map(([id, info]) => {
                  const hidden = hiddenTypes.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleType(id)}
                      className={`w-full text-left text-[11px] px-2 py-1 rounded-lg flex items-center gap-2 transition ${
                        !hidden ? 'text-slate-200 hover:bg-slate-800/60' : 'text-slate-500 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded border flex items-center justify-center ${!hidden ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                        {!hidden && <Check className="w-2 h-2 text-white" />}
                      </span>
                      {info.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 12: DEVELOPER MAP DEBUG HUD (Bottom Left) ────────────────── */}
      <div className="absolute bottom-6 left-4 z-20 pointer-events-auto">
        <div className="glass-panel p-2.5 rounded-xl border border-slate-800/90 shadow-2xl text-[10px] font-mono text-slate-300 max-w-[260px] space-y-1">
          <div
            onClick={() => setShowDebugHud(!showDebugHud)}
            className="flex items-center justify-between cursor-pointer text-slate-400 hover:text-slate-200"
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Terminal className="w-3 h-3" />
              <span>MAP ENGINE HUD</span>
            </div>
            {showDebugHud ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>

          {showDebugHud && (
            <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[9.5px]">
              <div className="flex justify-between">
                <span className="text-slate-400">MAP:</span>
                <span className="text-emerald-400 font-semibold">Ready (WebGL Active)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SITE POLYGON:</span>
                <span className={sitePolygon ? 'text-emerald-400' : 'text-amber-400'}>
                  {sitePolygon ? `Polygon (${sitePolygon.properties.areaHectares || 0} ha)` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DRAWING:</span>
                <span className={isDrawing ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {isDrawing ? `Active (${drawingPointCount} pts)` : 'Idle'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PHASE:</span>
                <span className="text-sky-400">{appPhase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">INTERVENTIONS:</span>
                <span className={interventions.length > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {interventions.length} features
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SOURCES:</span>
                <span className="text-emerald-400">selected-site, compiled-interventions</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FEATURE CLICK INSPECTOR MODAL ─────────────────────────────────── */}
      {selectedFeatureInfo && (
        <div className="absolute top-16 right-14 z-30 max-w-xs glass-panel p-4 rounded-2xl shadow-2xl border border-slate-700/90 space-y-2 animate-fade-in pointer-events-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedFeatureInfo.colorHex || '#10b981' }}
              />
              <h4 className="text-xs font-bold text-slate-100 leading-tight">{selectedFeatureInfo.name}</h4>
            </div>
            <button
              onClick={() => setSelectedFeatureInfo(null)}
              className="text-slate-400 hover:text-slate-200 px-1 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {selectedFeatureInfo.suitabilityReason}
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono border-t border-slate-800">
            <div className="p-1.5 rounded bg-slate-900/80">
              <span className="text-slate-400 block">Footprint</span>
              <span className="text-slate-200 font-semibold">
                {Number(selectedFeatureInfo.areaSqMeters || 0).toLocaleString()} m²
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80">
              <span className="text-slate-400 block">Est. Cost</span>
              <span className="text-emerald-400 font-semibold">
                ₹{(Number(selectedFeatureInfo.estimatedCostInr || 0) / 100000).toFixed(1)} Lakh
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80">
              <span className="text-slate-400 block">Runoff Captured</span>
              <span className="text-cyan-400 font-semibold">
                {Number(selectedFeatureInfo.runoffInterceptionLiters || 0).toLocaleString()} L
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/80">
              <span className="text-slate-400 block">Cooling Effect</span>
              <span className="text-amber-400 font-semibold">
                -{selectedFeatureInfo.coolingImpactCelsius}°C
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYZING SPINNER OVERLAY ─────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-cyan-400/40 text-white text-xs font-semibold shadow-2xl animate-pulse">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Analyzing site data — OSM, Elevation, Weather, Sentinel…</span>
          </div>
        </div>
      )}
    </div>
  );
};
