'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { SitePolygon, LngLat, AppPhase } from '@/types/geo';
import { CandidateInterventionFeature } from '@/types/interventions';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as turf from '@turf/turf';
import { computePolygonStats, sanitizeLngLat } from '@/lib/geo/geometryUtils';
import { CompareOverlay } from './GeoOverlay';

// ─────────────────────────────────────────────────────────────────────────────
// FREE TILE SOURCES — No API key required
// ─────────────────────────────────────────────────────────────────────────────
const TILE_SOURCES = {
  dark: {
    tiles: ['https://server.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
    attribution: '© Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community',
    tileSize: 256,
    maxzoom: 16,
    label: 'Dark GIS'
  },
  light: {
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
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: '© Esri, Maxar, Earthstar Geographics',
    tileSize: 256,
    maxzoom: 19,
    label: 'Satellite'
  }
} as const;

export type MapStyleType = 'dark' | 'satellite' | 'light';

// ─────────────────────────────────────────────────────────────────────────────
// BASEMAP VISIBILITY SWITCHER (Single Style — No setStyle() wiping)
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
    }
  };

  const layers: maplibregl.LayerSpecification[] = [
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
    }
  ];

  return {
    version: 8,
    sources,
    layers
  };
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
  externalBeforeAfterSplit?: number;
  highlightedInterventionId?: string | null;
  externalMapStyle?: MapStyleType;
  onMapStyleChanged?: (style: MapStyleType) => void;
  onSelectFeature?: (props: any) => void;
  isDrawingMode?: boolean;
  onDrawingProgress?: (pointsCount: number, points: LngLat[]) => void;
  triggerFinishDrawing?: number;
  triggerCancelDrawing?: number;
  triggerUndoDrawingPoint?: number;
  comparisonMode?: 'before' | 'after' | 'split';
  showInterventions?: boolean;
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
  comparisonMode = 'split',
  showInterventions = true
}) => {
  const rootWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const mapReadyRef = useRef(false);

  // Synchronization refs
  const onDrawingProgressRef = useRef(onDrawingProgress);
  onDrawingProgressRef.current = onDrawingProgress;

  const onSelectFeatureRef = useRef(onSelectFeature);
  onSelectFeatureRef.current = onSelectFeature;

  const drawingPointsRef = useRef<LngLat[]>([]);
  const drawingActiveRef = useRef(false);

  const [mapStyleType, setMapStyleType] = useState<MapStyleType>(externalMapStyle || 'satellite');
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<LngLat[]>([]);
  const [isDrawing, setIsDrawing] = useState(isDrawingMode || appPhase === 'DRAWING');
  const [splitPercent, setSplitPercent] = useState<number>(externalBeforeAfterSplit ?? 50);

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

    drawingActiveRef.current = false;
    drawingPointsRef.current = [];
    setDrawingPoints([]);
    setIsDrawing(false);

    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = '';
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

  // ─── Drawing: Start ────────────────────────────────────────────────────────
  const startDrawing = useCallback(() => {
    drawingActiveRef.current = true;
    drawingPointsRef.current = [];
    setDrawingPoints([]);
    setIsDrawing(true);
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = 'crosshair';
    }
  }, []);

  // ─── Drawing: Cancel ───────────────────────────────────────────────────────
  const cancelDrawing = useCallback(() => {
    drawingActiveRef.current = false;
    drawingPointsRef.current = [];
    setDrawingPoints([]);
    setIsDrawing(false);
    const map = mapRef.current;
    if (map) {
      map.getCanvas().style.cursor = '';
    }
    if (onCancelDrawing) onCancelDrawing();
  }, [onCancelDrawing]);

  // ─── Map Click Handler (Drawing clicks & tap-to-close) ──────────────────────
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    if (!drawingActiveRef.current) return;
    const pts = drawingPointsRef.current;
    const map = mapRef.current;

    // Tap first vertex (< 18px screen distance) with >= 3 points to close polygon
    if (pts.length >= 3 && map) {
      const firstCoord = pts[0];
      const firstScreenPt = map.project([firstCoord[0], firstCoord[1]]);
      const clickScreenPt = e.point;
      const dist = Math.hypot(firstScreenPt.x - clickScreenPt.x, firstScreenPt.y - clickScreenPt.y);
      if (dist < 18) {
        finishDrawing();
        return;
      }
    }

    const pt: LngLat = [Number(e.lngLat.lng.toFixed(6)), Number(e.lngLat.lat.toFixed(6))];
    drawingPointsRef.current.push(pt);
    const updated = [...drawingPointsRef.current];
    setDrawingPoints(updated);

    onDrawingProgressRef.current?.(updated.length, updated);
  }, [finishDrawing]);

  // ─── Drawing triggers from external buttons ────────────────────────────────
  useEffect(() => {
    if (triggerFinishDrawing && triggerFinishDrawing > 0) {
      finishDrawing();
    }
  }, [triggerFinishDrawing, finishDrawing]);

  useEffect(() => {
    if (triggerUndoDrawingPoint && triggerUndoDrawingPoint > 0 && drawingPointsRef.current.length > 0) {
      drawingPointsRef.current.pop();
      const updated = [...drawingPointsRef.current];
      setDrawingPoints(updated);
      onDrawingProgressRef.current?.(updated.length, updated);
    }
  }, [triggerUndoDrawingPoint]);

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
    if (appPhase === 'DRAWING' || isDrawingMode) {
      if (!drawingActiveRef.current) startDrawing();
    } else {
      if (drawingActiveRef.current) {
        cancelDrawing();
      }
    }
  }, [appPhase, isDrawingMode, startDrawing, cancelDrawing]);

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

    map.on('click', handleMapClick);

    map.on('error', (e) => {
      console.warn('[MAP] error:', e.error?.message || e);
    });

    map.on('load', () => {
      mapReadyRef.current = true;
      setMapInstance(map);
      if (typeof window !== 'undefined') {
        (window as any).__map = map;
      }
      updateLocationMarker(map, center);
    });

    return () => {
      if (typeof window !== 'undefined' && (window as any).__map === map) {
        delete (window as any).__map;
      }
      if (locationMarkerRef.current) locationMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
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
    if (onMapStyleChanged) onMapStyleChanged(newType);
  }, [onMapStyleChanged]);

  // ─── Center / Zoom changes ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center, zoom, duration: 1600, essential: true });
    updateLocationMarker(map, center);
  }, [center, zoom, updateLocationMarker]);

  // ─── Fit bounds to site when sitePolygon changes ───────────────────────────
  useEffect(() => {
    if (!sitePolygon || !mapRef.current) return;
    try {
      const bbox = turf.bbox(sitePolygon);
      mapRef.current.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        { padding: 100, duration: 800, maxZoom: 17 }
      );
    } catch (e) {}
  }, [sitePolygon]);

  // ─── External Controls Synchronization ─────────────────────────────────────
  useEffect(() => {
    if (typeof externalBeforeAfterSplit === 'number') {
      setSplitPercent(externalBeforeAfterSplit);
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
      try {
        const centerCoord = turf.center(match as any).geometry.coordinates as [number, number];
        mapRef.current.flyTo({ center: centerCoord, zoom: 16, duration: 900 });
      } catch {}
    }
  }, [highlightedInterventionId, interventions]);

  // ─── ResizeObserver for single map instance ───────────────────────────────
  useEffect(() => {
    const el = rootWrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Format interventions as Feature[]
  const interventionFeatures = Array.isArray(interventions)
    ? interventions.map((i) => ({
        type: 'Feature' as const,
        id: i.id,
        geometry: i.geometry,
        properties: {
          ...i.properties,
          id: i.id,
          name: i.name,
          interventionId: i.interventionId,
          type: (i as any).properties?.type || i.interventionId || i.name,
          colorHex: i.properties?.colorHex
        }
      }))
    : (interventions as any)?.features ?? [];

  return (
    <div ref={rootWrapperRef} className="relative w-full h-full min-h-[450px] bg-slate-950 overflow-hidden">
      {/* Base Map WebGL Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* SVG Geo-anchored Compare Overlay */}
      <CompareOverlay
        map={mapInstance}
        mode={comparisonMode}
        splitPercent={splitPercent}
        onSplitChange={setSplitPercent}
        draft={drawingPoints}
        site={sitePolygon as any}
        interventions={interventionFeatures as any}
        showInterventions={showInterventions}
        drawing={isDrawing}
        onSelect={(f) => onSelectFeatureRef.current?.(f.properties ?? {})}
      />

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
