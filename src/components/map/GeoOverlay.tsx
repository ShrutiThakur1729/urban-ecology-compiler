'use client';
/**
 * GeoOverlay — SVG drawn on top of ONE MapLibre map, anchored to real [lng, lat].
 *
 * Matches the reference UI:
 *   - Before  = clean satellite, no outline, nothing drawn
 *   - After   = vivid zones (double outline), texture inside them, round white icon badges at each
 *               feature, and a dotted white network linking the badges
 *   - Split   = ONE map; the After layer is clipped at a white divider with a round handle
 *
 * Because it is plain SVG it can't be wiped by setStyle or hidden under raster tiles, and it
 * re-renders from props. Numbers come from impact.ts, never from how many dots/badges are drawn.
 * The dotted network is ILLUSTRATIVE (nearest-neighbour link between badges), not a connectivity analysis.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Map as MLMap } from 'maplibre-gl';
import * as turf from '@turf/turf';
import { resolveType, toFeatures, normalizeSite, SPECS, type InterventionType } from '@/lib/geo/impact';

export type LngLat = [number, number];
type Feat = GeoJSON.Feature<GeoJSON.Geometry, Record<string, any>>;

export const TYPE_COLOR: Record<InterventionType, string> = {
  tree_corridor: '#22c55e', miyawaki: '#4ade80', rain_garden: '#2f80ed', bioswale: '#0ea5e9',
  permeable_pavement: '#94a3b8', pollinator_garden: '#f59e0b', green_roof: '#a855f7', green_buffer: '#84cc16',
};
const DASHED: Partial<Record<InterventionType, string>> = { pollinator_garden: '7 5', permeable_pavement: '7 5', green_roof: '3 3' };
const FLOWERS = ['#f472b6', '#fbbf24', '#fb7185', '#c084fc', '#fde047'];

/* ---------------- camera tick ---------------- */
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

/* ---------------- scene generation (once per plan) ---------------- */
type DotKind = 'canopy' | 'shrub' | 'flower' | 'ripple';
type Dot = { c: [number, number]; rM: number; kind: DotKind; v: number };
type SceneItem = { f: Feat; type: InterventionType | null; color: string; dots: Dot[]; badge: [number, number] | null };

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
  miyawaki:          { perDotM2: 9,  rMin: 1.8, rMax: 3.0, kind: 'canopy', cap: 350 },
  green_buffer:      { perDotM2: 26, rMin: 2.0, rMax: 3.2, kind: 'canopy', cap: 240 },
  pollinator_garden: { perDotM2: 4,  rMin: 0.5, rMax: 0.9, kind: 'flower', cap: 260 },
  rain_garden:       { perDotM2: 40, rMin: 1.0, rMax: 1.8, kind: 'ripple', cap: 60 },
  green_roof:        { perDotM2: 18, rMin: 0.8, rMax: 1.4, kind: 'shrub',  cap: 160 },
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

function badgeFor(f: Feat): [number, number] | null {
  try {
    const g = f.geometry;
    if (g.type === 'Point') return g.coordinates as [number, number];
    if (g.type === 'LineString' || g.type === 'MultiLineString') {
      const line: any = turf.flatten(f as any).features.find((x: any) => x.geometry.type === 'LineString');
      if (!line) return null;
      const half = turf.length(line, { units: 'kilometers' }) / 2;
      return turf.along(line, half, { units: 'kilometers' }).geometry.coordinates as [number, number];
    }
    return turf.pointOnFeature(f as any).geometry.coordinates as [number, number]; // guaranteed inside the polygon
  } catch { return null; }
}

function buildScene(interventions: Feat[], site: Feat | null) {
  const items: SceneItem[] = interventions.map((f, idx) => {
    const type = resolveType(f);
    const color = type ? TYPE_COLOR[type] : '#22c55e';
    const dots: Dot[] = [];
    const badge = badgeFor(f);
    if (!type) return { f, type, color, dots, badge };
    try {
      const rand = mulberry32((idx + 1) * 2654435761 ^ Math.round(Math.abs(turf.bbox(f as any)[0] * 1e5)));
      const g = f.geometry.type;
      if (g === 'Polygon' || g === 'MultiPolygon') {
        const rule = AREA_RULES[type];
        if (rule) {
          const n = Math.min(rule.cap, Math.max(3, Math.round(turf.area(f as any) / rule.perDotM2)));
          for (const c of scatterInPolygon(f, site, n, rand)) dots.push({ c, rM: rule.rMin + rand() * (rule.rMax - rule.rMin), kind: rule.kind, v: Math.floor(rand() * 3) });
        }
      } else if (g === 'LineString' || g === 'MultiLineString') {
        if (type === 'tree_corridor') for (const c of alongLines(f, 7, 2.2, 300, rand)) dots.push({ c, rM: 3.2 + rand() * 1.3, kind: 'canopy', v: Math.floor(rand() * 3) });
        else if (type === 'bioswale') for (const c of alongLines(f, 4, (SPECS.bioswale.widthM ?? 2.5) * 0.7, 250, rand)) dots.push({ c, rM: 0.7 + rand() * 0.5, kind: 'shrub', v: Math.floor(rand() * 3) });
      }
    } catch (e) { console.warn('[GeoOverlay] scatter failed', f, e); }
    return { f, type, color, dots, badge };
  });

  // illustrative network: nearest-neighbour chain through the badges
  const pts = items.map((i) => i.badge).filter(Boolean) as [number, number][];
  const network: [number, number][] = [];
  if (pts.length) {
    const left = [...pts];
    let cur = left.shift()!;
    network.push(cur);
    while (left.length) {
      let bi = 0, bd = Infinity;
      left.forEach((p, i) => { const d = (p[0] - cur[0]) ** 2 + (p[1] - cur[1]) ** 2; if (d < bd) { bd = d; bi = i; } });
      cur = left.splice(bi, 1)[0];
      network.push(cur);
    }
  }
  return { items, network };
}

/* ---------------- icons ---------------- */
function TypeGlyph({ type }: { type: InterventionType | null }) {
  switch (type) {
    case 'tree_corridor': case 'miyawaki': return <><circle cx="12" cy="9" r="6" /><path d="M12 15v6" /></>;
    case 'rain_garden': return <path d="M12 3C12 3 5 11 5 15a7 7 0 0 0 14 0C19 11 12 3 12 3Z" />;
    case 'bioswale': return <path d="M3 9c3-4 6 4 9 0s6 4 9 0M3 16c3-4 6 4 9 0s6 4 9 0" />;
    case 'permeable_pavement': return <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 12h16M12 4v16" /></>;
    case 'pollinator_garden': return <><circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /></>;
    case 'green_roof': return <path d="M4 11l8-7 8 7v9H4z" />;
    default: return <path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l8-8" />;
  }
}

/* ---------------- overlay ---------------- */
type Props = {
  map: MLMap | null;
  draft?: LngLat[];
  site?: any;
  interventions?: any;
  showSite?: boolean;
  showInterventions?: boolean;
  textured?: boolean;        // default true
  showBadges?: boolean;      // default true
  showNetwork?: boolean;     // default true
  interactive?: boolean;
  onSelect?: (f: Feat) => void;
};

const metersPerPx = (map: MLMap) => (40075016.686 * Math.cos((map.getCenter().lat * Math.PI) / 180)) / (512 * Math.pow(2, map.getZoom()));

export function GeoOverlay({
  map, draft = [], site: siteRaw = null, interventions: intRaw = [],
  showSite = false, showInterventions = false, textured = true, showBadges = true, showNetwork = true, interactive = false, onSelect,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tick = useMapTick(map);
  void tick;

  const site = useMemo(() => normalizeSite(siteRaw) as Feat | null, [siteRaw]);
  const scene = useMemo(() => (showInterventions ? buildScene(toFeatures(intRaw), site) : { items: [], network: [] as [number, number][] }), [intRaw, site, showInterventions]);

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
  const cell = Math.min(60, Math.max(5, 3 / mpp));

  const clickProps = (f: Feat) => ({
    style: { pointerEvents: interactive ? ('auto' as const) : ('none' as const), cursor: interactive ? 'pointer' : undefined },
    onClick: interactive ? (e: React.MouseEvent) => { e.stopPropagation(); onSelect?.(f); } : undefined,
  });

  const renderZone = (it: SceneItem, idx: number) => {
    const { f, type, color, dots } = it;
    const g = paths(f.geometry);
    const isWater = type === 'rain_garden';
    const isPave = type === 'permeable_pavement';
    const dash = type ? DASHED[type] : undefined;
    const widthPx = Math.max(3.5, ((type ? SPECS[type].widthM : 3) ?? 3) / mpp);

    const vis = dots
      .map((d) => { const p = pt(d.c); return { d, x: p.x, y: p.y, r: Math.max(1.6, d.rM / mpp) }; })
      .filter((o) => o.x > -30 && o.y > -30 && o.x < W + 30 && o.y < H + 30);
    const canopies = vis.filter((o) => o.d.kind === 'canopy');
    const shrubs = vis.filter((o) => o.d.kind === 'shrub');
    const flowers = vis.filter((o) => o.d.kind === 'flower');
    const ripples = vis.filter((o) => o.d.kind === 'ripple');

    return (
      <g key={f.id ?? idx} {...clickProps(f)}>
        {g.fill.map((d, i) => (
          <g key={`a${i}`}>
            {textured && isWater ? <path d={d} fill={`url(#${uid}-water)`} fillOpacity={0.9} fillRule="evenodd" />
              : textured && isPave ? <path d={d} fill={`url(#${uid}-pave)`} fillRule="evenodd" />
              : <path d={d} fill={color} fillOpacity={textured ? 0.5 : 0.55} fillRule="evenodd" />}
            {/* double outline: white halo + coloured edge, like the reference */}
            <path d={d} fill="none" stroke="#fff" strokeOpacity={0.9} strokeWidth={4.5} strokeLinejoin="round" />
            <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeDasharray={dash} />
          </g>
        ))}

        {g.line.map((d, i) => (
          <g key={`l${i}`} strokeLinecap="round" strokeLinejoin="round" fill="none">
            {textured && type === 'bioswale' ? (
              <>
                <path d={d} stroke="#fff" strokeOpacity={0.85} strokeWidth={widthPx * 1.5 + 3} />
                <path d={d} stroke="#38bdf8" strokeOpacity={0.95} strokeWidth={widthPx} />
                <path d={d} stroke="#e0f2fe" strokeOpacity={0.75} strokeWidth={Math.max(1, widthPx * 0.2)} strokeDasharray="10 8" />
              </>
            ) : textured && type === 'tree_corridor' ? (
              <>
                <path d={d} stroke={color} strokeOpacity={0.4} strokeWidth={widthPx} />
                <path d={d} stroke="#fff" strokeOpacity={0.9} strokeWidth={2} strokeDasharray="1 6" />
              </>
            ) : (
              <>
                <path d={d} stroke="#fff" strokeOpacity={0.9} strokeWidth={7} />
                <path d={d} stroke={color} strokeWidth={4} />
              </>
            )}
          </g>
        ))}

        {textured && (
          <>
            {ripples.map((o, i) => <ellipse key={`r${i}`} cx={o.x} cy={o.y} rx={o.r * 1.6} ry={o.r * 0.9} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1} />)}
            {shrubs.map((o, i) => <circle key={`s${i}`} cx={o.x} cy={o.y} r={o.r} fill={`url(#${uid}-cg${o.d.v})`} stroke="#052e16" strokeOpacity={0.35} strokeWidth={0.6} />)}
            {flowers.map((o, i) => <circle key={`fl${i}`} cx={o.x} cy={o.y} r={Math.max(1.6, o.r)} fill={FLOWERS[(i + o.d.v) % FLOWERS.length]} stroke="#166534" strokeOpacity={0.5} strokeWidth={0.5} />)}
            {canopies.length > 0 && (
              <g filter={`url(#${uid}-soft)`}>
                {canopies.map((o, i) => <circle key={`sh${i}`} cx={o.x + o.r * 0.35} cy={o.y + o.r * 0.45} r={o.r} fill="#000" fillOpacity={0.3} />)}
              </g>
            )}
            {canopies.map((o, i) => <circle key={`c${i}`} cx={o.x} cy={o.y} r={o.r} fill={`url(#${uid}-cg${o.d.v})`} stroke="#052e16" strokeOpacity={0.4} strokeWidth={0.8} />)}
          </>
        )}
      </g>
    );
  };

  const renderBadge = (it: SceneItem, idx: number) => {
    if (!it.badge || !it.type) return null;
    const p = pt(it.badge);
    if (p.x < -20 || p.y < -20 || p.x > W + 20 || p.y > H + 20) return null;
    return (
      <g key={`b${it.f.id ?? idx}`} {...clickProps(it.f)} transform={`translate(${p.x - 14},${p.y - 14})`} filter={`url(#${uid}-badge)`}>
        <circle cx={14} cy={14} r={14} fill="#fff" />
        <g transform="translate(6,6) scale(0.667)" fill="none" stroke={it.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <TypeGlyph type={it.type} />
        </g>
      </g>
    );
  };

  const netPts = scene.network.map((c) => pt(c));

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 5 }} aria-hidden>
      <defs>
        {[['#bef264', '#15803d'], ['#4ade80', '#166534'], ['#a3e635', '#14532d']].map(([a, b], i) => (
          <radialGradient key={i} id={`${uid}-cg${i}`} cx="38%" cy="35%" r="70%"><stop offset="0%" stopColor={a} /><stop offset="100%" stopColor={b} /></radialGradient>
        ))}
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#1d4ed8" /></linearGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={`${uid}-badge`} x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.4" /></filter>
        <pattern id={`${uid}-pave`} patternUnits="userSpaceOnUse" x={anchor.x} y={anchor.y} width={cell} height={cell}>
          <rect width={cell} height={cell} fill="#cbd5e1" fillOpacity={0.7} />
          <path d={`M0,0 H${cell} M0,0 V${cell}`} stroke="#64748b" strokeOpacity={0.6} strokeWidth={1} />
        </pattern>
      </defs>

      {/* site outline (drawing + "before while planning"); never shown in the clean Before-with-plan view */}
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

      {/* AFTER: site wash + thin dashed boundary, then zones, network, badges */}
      {showInterventions && textured && site && paths(site.geometry).fill.map((d, i) => (
        <g key={`w${i}`}>
          <path d={d} fill="#14532d" fillOpacity={0.14} style={{ mixBlendMode: 'multiply' }} fillRule="evenodd" />
          <path d={d} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.5} strokeDasharray="6 4" strokeLinejoin="round" />
        </g>
      ))}

      {showInterventions && scene.items.map(renderZone)}

      {showInterventions && showNetwork && netPts.length > 1 && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
          <path d={netPts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                stroke="#fff" strokeOpacity={0.9} strokeWidth={2.5} strokeDasharray="1 7" />
        </g>
      )}

      {showInterventions && showBadges && scene.items.map(renderBadge)}

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

/* ---------------- Before / After / Split (one map) ---------------- */
export type CompareMode = 'before' | 'after' | 'split';

export function CompareOverlay(p: {
  map: MLMap | null; mode: CompareMode; splitPercent: number; onSplitChange: (n: number) => void;
  draft?: LngLat[]; site?: any; interventions?: any; drawing?: boolean; textured?: boolean;
  beforeOutline?: boolean;          // show the site outline on the Before side (reference: false)
  showInterventions?: boolean;
  onSelect?: (f: Feat) => void;
}) {
  const clip = p.mode === 'before' ? 100 : p.mode === 'after' ? 0 : p.splitPercent;
  const hasPlan = toFeatures(p.interventions).length > 0;
  const showInt = p.showInterventions ?? true;

  return (
    <>
      {/* BEFORE: clean satellite once a plan exists; outline only while drawing / no plan yet */}
      <GeoOverlay map={p.map} draft={p.draft} site={p.site} showSite={!hasPlan || !!p.beforeOutline} />

      {hasPlan && showInt && (
        <div className="pointer-events-none absolute inset-0" style={{ clipPath: `inset(0 0 0 ${clip}%)`, zIndex: 6 }}>
          <GeoOverlay map={p.map} site={p.site} interventions={p.interventions} showInterventions
            textured={p.textured ?? true} interactive={!p.drawing && p.mode !== 'before'} onSelect={p.onSelect} />
        </div>
      )}

      {p.mode === 'split' && hasPlan && <Divider percent={p.splitPercent} onChange={p.onSplitChange} />}

      {hasPlan && p.mode !== 'after' && (
        <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-800 shadow">Before</span>
      )}
      {hasPlan && p.mode !== 'before' && (
        <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-800 shadow">After · modeled</span>
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
      role="slider" aria-label="Before and after divider" aria-valuemin={2} aria-valuemax={98} aria-valuenow={Math.round(percent)} tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onChange(Math.max(2, percent - 2));
        if (e.key === 'ArrowRight') onChange(Math.min(98, percent + 2));
      }}
      className="absolute inset-y-0 z-20 w-12 -translate-x-1/2 cursor-ew-resize outline-none"
      style={{ left: `${percent}%`, touchAction: 'none' }}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerMove={move}
    >
      <div className="mx-auto h-full w-0.5 bg-white" style={{ boxShadow: '0 0 6px rgba(0,0,0,.45)' }} />
      <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-700"
           style={{ boxShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
        </svg>
      </div>
    </div>
  );
}

/* ---------------- Before / After / Split View tabs (segmented control) ---------------- */
export function CompareTabs({ mode, onChange }: { mode: CompareMode; onChange: (m: CompareMode) => void }) {
  const items: [CompareMode, string][] = [['before', 'Before'], ['after', 'After'], ['split', 'Split View']];
  return (
    <div role="tablist" aria-label="Comparison mode" className="grid grid-cols-3 gap-2">
      {items.map(([m, label]) => {
        const active = mode === m;
        return (
          <button key={m} role="tab" aria-selected={active} onClick={() => onChange(m)}
            className={`min-h-[40px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'border-[#0b5d3b] bg-[#0b5d3b] text-white' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
