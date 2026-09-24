'use client';
/**
 * GeoOverlay — SVG drawn on top of ONE MapLibre map, anchored to real [lng, lat].
 *
 * Why SVG and not MapLibre layers: it can't be wiped by setStyle, hidden under a raster layer,
 * or lose a source. It re-renders from props, so state and what you see can't drift apart.
 *
 * Two visual modes for the compiled plan:
 *   textured (default)  "After" reads as a reconstructed scene: canopy discs with soft shadows
 *                       scattered INSIDE each polygon / along each line, water for rain gardens
 *                       and swales, flower dots, paving grid. Every element is placed with Turf
 *                       from the real geometry, and stays glued to the ground on pan/zoom.
 *   flat                plain translucent shapes (fallback / debugging).
 *
 * The scattered dots are DECORATION derived from geometry (seeded, so they don't reshuffle).
 * Numbers come from impact.ts, never from how many dots are drawn.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Map as MLMap } from 'maplibre-gl';
import * as turf from '@turf/turf';
import { resolveType, toFeatures, normalizeSite, SPECS, type InterventionType } from '@/lib/geo/impact';

export type LngLat = [number, number];
type Feat = GeoJSON.Feature<GeoJSON.Geometry, Record<string, any>>;

const TYPE_COLOR: Record<InterventionType, string> = {
  tree_corridor: '#22c55e', miyawaki: '#15803d', rain_garden: '#3b82f6', bioswale: '#06b6d4',
  permeable_pavement: '#94a3b8', pollinator_garden: '#f59e0b', green_roof: '#a855f7', green_buffer: '#16a34a',
};
const FLOWERS = ['#f472b6', '#fbbf24', '#fb7185', '#c084fc', '#fde047'];

/* ------------------------------------------------------------------ */
/* Camera tick: re-render on every camera change                       */
/* ------------------------------------------------------------------ */
function useMapTick(map: MLMap | null) {
  const [tick, setTick] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!map) return;
    const bump = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(() => setTick((t) => t + 1)); };
    const evts = ['move', 'zoom', 'rotate', 'pitch', 'resize', 'load', 'style.load'];
    evts.forEach((e) => map.on(e as any, bump));
    bump();
    return () => { evts.forEach((e) => map.off(e as any, bump)); cancelAnimationFrame(raf.current); };
  }, [map]);
  return tick;
}

/* ------------------------------------------------------------------ */
/* Scene generation (runs once per plan, NOT per frame)                */
/* ------------------------------------------------------------------ */
type DotKind = 'canopy' | 'shrub' | 'flower' | 'ripple';
type Dot = { c: [number, number]; rM: number; kind: DotKind; v: number };
type SceneItem = { f: Feat; type: InterventionType | null; color: string; dots: Dot[] };

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AREA_RULES: Partial<Record<InterventionType, { perDotM2: number; rMin: number; rMax: number; kind: DotKind; cap: number }>> = {
  miyawaki:          { perDotM2: 7,  rMin: 2.0, rMax: 3.4, kind: 'canopy', cap: 450 },
  green_buffer:      { perDotM2: 22, rMin: 2.2, rMax: 3.6, kind: 'canopy', cap: 300 },
  pollinator_garden: { perDotM2: 3,  rMin: 0.5, rMax: 0.9, kind: 'flower', cap: 350 },
  rain_garden:       { perDotM2: 40, rMin: 1.0, rMax: 1.8, kind: 'ripple', cap: 60 },
  green_roof:        { perDotM2: 18, rMin: 0.8, rMax: 1.4, kind: 'shrub',  cap: 200 },
};

function scatterInPolygon(f: Feat, site: Feat | null, n: number, rand: () => number): [number, number][] {
  const out: [number, number][] = [];
  const bb = turf.bbox(f as any);
  let tries = 0;
  while (out.length < n && tries < n * 8) {
    tries++;
    const x = bb[0] + rand() * (bb[2] - bb[0]);
    const y = bb[1] + rand() * (bb[3] - bb[1]);
    const p = turf.point([x, y]);
    if (!turf.booleanPointInPolygon(p, f as any)) continue;
    if (site && !turf.booleanPointInPolygon(p, site as any)) continue;
    out.push([x, y]);
  }
  return out;
}

function alongLines(f: Feat, spacingM: number, jitterM: number, cap: number, rand: () => number): [number, number][] {
  const out: [number, number][] = [];
  const lines = turf.flatten(f as any).features.filter((x: any) => x.geometry.type === 'LineString');
  for (const line of lines) {
    const lenM = turf.length(line as any, { units: 'kilometers' }) * 1000;
    const n = Math.floor(lenM / spacingM);
    for (let i = 0; i < n && out.length < cap; i++) {
      const p = turf.along(line as any, ((i + 0.5) * spacingM) / 1000, { units: 'kilometers' });
      const j = turf.destination(p, (rand() * jitterM) / 1000, rand() * 360, { units: 'kilometers' });
      out.push(j.geometry.coordinates as [number, number]);
    }
  }
  return out;
}

function buildScene(interventions: Feat[], site: Feat | null): SceneItem[] {
  return interventions.map((f, idx) => {
    const type = resolveType(f);
    const color = type ? TYPE_COLOR[type] : '#22c55e';
    const dots: Dot[] = [];
    if (!type) return { f, type, color, dots };
    try {
      const seedBase = (idx + 1) * 2654435761;
      const rand = mulberry32(seedBase ^ Math.round(Math.abs((turf.bbox(f as any)[0] * 1e5) | 0)));
      const g = f.geometry.type;
      const spec = SPECS[type];

      if (g === 'Polygon' || g === 'MultiPolygon') {
        const rule = AREA_RULES[type];
        if (rule) {
          const n = Math.min(rule.cap, Math.max(3, Math.round(turf.area(f as any) / rule.perDotM2)));
          for (const c of scatterInPolygon(f, site, n, rand)) {
            dots.push({ c, rM: rule.rMin + rand() * (rule.rMax - rule.rMin), kind: rule.kind, v: Math.floor(rand() * 3) });
          }
        }
      } else if (g === 'LineString' || g === 'MultiLineString') {
        if (type === 'tree_corridor') {
          for (const c of alongLines(f, 7, 2.2, 400, rand)) dots.push({ c, rM: 3.4 + rand() * 1.4, kind: 'canopy', v: Math.floor(rand() * 3) });
        } else if (type === 'bioswale') {
          for (const c of alongLines(f, 4, (spec.widthM ?? 2.5) * 0.7, 300, rand)) dots.push({ c, rM: 0.7 + rand() * 0.5, kind: 'shrub', v: Math.floor(rand() * 3) });
        }
      } else if (g === 'Point') {
        dots.push({ c: (f.geometry as GeoJSON.Point).coordinates as [number, number], rM: 4, kind: 'canopy', v: 0 });
      }
    } catch (e) {
      console.warn('[GeoOverlay] scatter failed for feature', f, e);
    }
    return { f, type, color, dots };
  });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
type Props = {
  map: MLMap | null;
  draft?: LngLat[];                 // in-progress vertices [lng, lat]
  site?: any;                       // closed polygon Feature (loose input is normalised)
  interventions?: any;              // Feature[] | FeatureCollection | loose objects (normalised)
  showSite?: boolean;
  showInterventions?: boolean;
  textured?: boolean;               // default true
  interactive?: boolean;            // interventions clickable (turn OFF while drawing)
  onSelect?: (f: Feat) => void;
};

const metersPerPx = (map: MLMap) => (40075016.686 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / (512 * Math.pow(2, map.getZoom()));

export function GeoOverlay({
  map, draft = [], site: siteRaw = null, interventions: intRaw = [],
  showSite = false, showInterventions = false, textured = true, interactive = false, onSelect,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tick = useMapTick(map);
  void tick;

  // normalise ONCE per prop change (never throws, drops invalid features)
  const site = useMemo(() => normalizeSite(siteRaw) as Feat | null, [siteRaw]);
  const scene = useMemo(
    () => (showInterventions ? buildScene(toFeatures(intRaw), site) : []),
    [intRaw, site, showInterventions],
  );

  if (!map) return null;

  const pt = (c: number[]) => map.project([c[0], c[1]]);
  const seg = (coords: number[][], close: boolean) =>
    coords.map((c, i) => { const p = pt(c); return `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ') + (close ? ' Z' : '');

  const paths = (g: GeoJSON.Geometry) => {
    const fill: string[] = [], line: string[] = [], pts: [number, number][] = [];
    switch (g.type) {
      case 'Polygon': fill.push(g.coordinates.map((r) => seg(r, true)).join(' ')); break;
      case 'MultiPolygon': g.coordinates.forEach((poly) => fill.push(poly.map((r) => seg(r, true)).join(' '))); break;
      case 'LineString': line.push(seg(g.coordinates, false)); break;
      case 'MultiLineString': g.coordinates.forEach((l) => line.push(seg(l, false))); break;
      case 'Point': { const p = pt(g.coordinates); pts.push([p.x, p.y]); break; }
      case 'MultiPoint': g.coordinates.forEach((c) => { const p = pt(c); pts.push([p.x, p.y]); }); break;
    }
    return { fill, line, pts };
  };

  const siteVerts: number[][] =
    site?.geometry.type === 'Polygon' ? site.geometry.coordinates[0].slice(0, -1)
    : site?.geometry.type === 'MultiPolygon' ? site.geometry.coordinates[0][0].slice(0, -1) : [];

  const mpp = metersPerPx(map);
  const cv = map.getCanvas();
  const W = cv.clientWidth, H = cv.clientHeight;
  const anchor = siteVerts[0] ? pt(siteVerts[0]) : pt([0, 0]);
  const cell = Math.min(60, Math.max(5, 3 / mpp)); // paving cell = 3 m

  const renderItem = (it: SceneItem, idx: number) => {
    const { f, type, color, dots } = it;
    const g = paths(f.geometry);
    const isWater = type === 'rain_garden';
    const isPave = type === 'permeable_pavement';
    const widthPx = Math.max(3.5, ((type ? SPECS[type].widthM : 3) ?? 3) / mpp);

    // project + cull dots once
    const vis = dots
      .map((d) => { const p = pt(d.c); return { d, x: p.x, y: p.y, r: Math.max(1.6, d.rM / mpp) }; })
      .filter((o) => o.x > -30 && o.y > -30 && o.x < W + 30 && o.y < H + 30);
    const canopies = vis.filter((o) => o.d.kind === 'canopy');
    const shrubs = vis.filter((o) => o.d.kind === 'shrub');
    const flowers = vis.filter((o) => o.d.kind === 'flower');
    const ripples = vis.filter((o) => o.d.kind === 'ripple');

    return (
      <g key={f.id ?? idx}
         style={{ pointerEvents: interactive ? 'auto' : 'none', cursor: interactive ? 'pointer' : undefined }}
         onClick={interactive ? (e) => { e.stopPropagation(); onSelect?.(f); } : undefined}>

        {/* ground */}
        {g.fill.map((d, i) => (
          <g key={`a${i}`}>
            {textured && isWater ? (
              <path d={d} fill={`url(#${uid}-water)`} fillOpacity={0.85} stroke="#e0f2fe" strokeOpacity={0.9} strokeWidth={2} fillRule="evenodd" />
            ) : textured && isPave ? (
              <path d={d} fill={`url(#${uid}-pave)`} stroke="#f1f5f9" strokeOpacity={0.9} strokeWidth={1.5} fillRule="evenodd" />
            ) : (
              <path d={d} fill={color} fillOpacity={textured ? 0.3 : 0.55} stroke="#fff" strokeOpacity={0.85} strokeWidth={1.5} fillRule="evenodd" />
            )}
          </g>
        ))}

        {/* lines */}
        {g.line.map((d, i) => (
          <g key={`l${i}`} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {textured && type === 'bioswale' ? (
              <>
                <path d={d} stroke="#3f2d1b" strokeOpacity={0.55} strokeWidth={widthPx * 1.7} />
                <path d={d} stroke="#38bdf8" strokeOpacity={0.9} strokeWidth={widthPx} />
                <path d={d} stroke="#e0f2fe" strokeOpacity={0.7} strokeWidth={Math.max(1, widthPx * 0.2)} strokeDasharray="10 8" />
              </>
            ) : textured && type === 'tree_corridor' ? (
              <path d={d} stroke="#14532d" strokeOpacity={0.35} strokeWidth={Math.max(2, 1.5 / mpp)} />
            ) : (
              <>
                <path d={d} stroke="#000" strokeOpacity={0.4} strokeWidth={7} />
                <path d={d} stroke={color} strokeWidth={4} />
              </>
            )}
          </g>
        ))}

        {g.pts.map(([x, y], i) => (textured && type ? null : <circle key={`p${i}`} cx={x} cy={y} r={7} fill={color} stroke="#fff" strokeWidth={2} />))}

        {/* textured scene elements */}
        {textured && (
          <>
            {ripples.map((o, i) => (
              <ellipse key={`r${i}`} cx={o.x} cy={o.y} rx={o.r * 1.6} ry={o.r * 0.9} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1} />
            ))}
            {shrubs.map((o, i) => (
              <circle key={`s${i}`} cx={o.x} cy={o.y} r={o.r} fill={`url(#${uid}-cg${o.d.v})`} stroke="#052e16" strokeOpacity={0.35} strokeWidth={0.6} />
            ))}
            {flowers.map((o, i) => (
              <circle key={`fl${i}`} cx={o.x} cy={o.y} r={Math.max(1.6, o.r)} fill={FLOWERS[(i + o.d.v) % FLOWERS.length]} stroke="#166534" strokeOpacity={0.5} strokeWidth={0.5} />
            ))}
            {canopies.length > 0 && (
              <g filter={`url(#${uid}-soft)`}>
                {canopies.map((o, i) => (
                  <circle key={`sh${i}`} cx={o.x + o.r * 0.35} cy={o.y + o.r * 0.45} r={o.r} fill="#000" fillOpacity={0.35} />
                ))}
              </g>
            )}
            {canopies.map((o, i) => (
              <circle key={`c${i}`} cx={o.x} cy={o.y} r={o.r} fill={`url(#${uid}-cg${o.d.v})`} stroke="#052e16" strokeOpacity={0.45} strokeWidth={0.8} />
            ))}
          </>
        )}
      </g>
    );
  };

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 5 }} aria-hidden>
      <defs>
        {[['#86efac', '#15803d'], ['#4ade80', '#166534'], ['#a3e635', '#14532d']].map(([a, b], i) => (
          <radialGradient key={i} id={`${uid}-cg${i}`} cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor={a} /><stop offset="100%" stopColor={b} />
          </radialGradient>
        ))}
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" /><stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>
        {/* paving grid is anchored to a real ground point so it doesn't swim on pan */}
        <pattern id={`${uid}-pave`} patternUnits="userSpaceOnUse" x={anchor.x} y={anchor.y} width={cell} height={cell}>
          <rect width={cell} height={cell} fill="#cbd5e1" fillOpacity={0.75} />
          <path d={`M0,0 H${cell} M0,0 V${cell}`} stroke="#64748b" strokeOpacity={0.6} strokeWidth={1} />
        </pattern>
      </defs>

      {/* site */}
      {showSite && site && (() => {
        const g = paths(site.geometry);
        return (
          <g>
            {g.fill.map((d, i) => <path key={`f${i}`} d={d} fill="#22c55e" fillOpacity={0.2} fillRule="evenodd" />)}
            {g.fill.map((d, i) => <path key={`c${i}`} d={d} fill="none" stroke="#000" strokeOpacity={0.55} strokeWidth={6} strokeLinejoin="round" />)}
            {g.fill.map((d, i) => <path key={`o${i}`} d={d} fill="none" stroke="#39ff88" strokeWidth={3} strokeLinejoin="round" />)}
            {siteVerts.map((c, i) => { const p = pt(c); return <circle key={i} cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#16a34a" strokeWidth={2.5} />; })}
          </g>
        );
      })()}

      {/* "after" greening wash over the whole site so the reconstructed scene reads as one picture */}
      {showInterventions && textured && site && paths(site.geometry).fill.map((d, i) => (
        <path key={`w${i}`} d={d} fill="#14532d" fillOpacity={0.14} style={{ mixBlendMode: 'multiply' }} fillRule="evenodd" />
      ))}

      {showInterventions && scene.map(renderItem)}

      {/* in-progress drawing */}
      {draft.length > 0 && (
        <g>
          {draft.length >= 3 && <path d={seg(draft, true)} fill="#39ff88" fillOpacity={0.18} />}
          {draft.length >= 2 && (
            <>
              <path d={seg(draft, draft.length >= 3)} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={6} strokeLinejoin="round" />
              <path d={seg(draft, draft.length >= 3)} fill="none" stroke="#39ff88" strokeWidth={3} strokeDasharray="8 5" strokeLinejoin="round" />
            </>
          )}
          {draft.length >= 3 && (() => { const p = pt(draft[0]); return <circle cx={p.x} cy={p.y} r={16} fill="none" stroke="#39ff88" strokeWidth={2} strokeDasharray="3 3" />; })()}
          {draft.map((c, i) => { const p = pt(c); return <circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 9 : 6} fill="#fff" stroke="#16a34a" strokeWidth={3} />; })}
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Before / After / Split on ONE map                                   */
/* ------------------------------------------------------------------ */
export type CompareMode = 'before' | 'after' | 'split';

/** Left of the divider = BEFORE (satellite + site outline only).
 *  Right of the divider = AFTER (same map + reconstructed interventions, clipped by the divider).
 *  One map, so the two sides can never drift out of sync. */
export function CompareOverlay(p: {
  map: MLMap | null; mode: CompareMode; splitPercent: number; onSplitChange: (n: number) => void;
  draft?: LngLat[]; site?: any; interventions?: any; drawing?: boolean; textured?: boolean; onSelect?: (f: Feat) => void;
}) {
  const clip = p.mode === 'before' ? 100 : p.mode === 'after' ? 0 : p.splitPercent;
  const hasPlan = toFeatures(p.interventions).length > 0;

  return (
    <>
      {/* BEFORE layer: always drawn, sits underneath */}
      <GeoOverlay map={p.map} draft={p.draft} site={p.site} showSite />

      {/* AFTER layer: everything left of `clip`% is cut away */}
      {hasPlan && (
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 0 0 ${clip}%)`, zIndex: 6 }}>
          <GeoOverlay map={p.map} site={p.site} interventions={p.interventions} showInterventions
            textured={p.textured ?? true} interactive={!p.drawing && p.mode !== 'before'} onSelect={p.onSelect} />
        </div>
      )}

      {p.mode === 'split' && hasPlan && <Divider percent={p.splitPercent} onChange={p.onSplitChange} />}

      {hasPlan && p.mode !== 'after' && (
        <span className="pointer-events-none absolute left-3 top-16 z-20 rounded bg-black/65 px-2 py-1 text-xs font-medium text-white">Before</span>
      )}
      {hasPlan && p.mode !== 'before' && (
        <span className="pointer-events-none absolute right-16 top-16 z-20 rounded bg-black/65 px-2 py-1 text-xs font-medium text-white">After (modeled)</span>
      )}
    </>
  );
}

function Divider({ percent, onChange }: { percent: number; onChange: (n: number) => void }) {
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!(e.buttons & 1)) return;
    const r = e.currentTarget.parentElement!.getBoundingClientRect();
    onChange(Math.min(98, Math.max(2, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      role="slider" aria-label="Before and after divider" aria-valuemin={2} aria-valuemax={98} aria-valuenow={Math.round(percent)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onChange(Math.max(2, percent - 2));
        if (e.key === 'ArrowRight') onChange(Math.min(98, percent + 2));
      }}
      className="absolute inset-y-0 z-20 w-11 -translate-x-1/2 cursor-ew-resize"
      style={{ left: `${percent}%`, touchAction: 'none' }}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerMove={move}
    >
      <div className="mx-auto h-full w-0.5 bg-white shadow" />
      <div className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-sm shadow">⇆</div>
    </div>
  );
}
