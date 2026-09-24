/**
 * impact.ts — real, geometry-derived numbers for the Results panel.
 *
 * WHAT IS REAL: areas, lengths, counts, perimeter — computed with Turf from the
 * actual [lng, lat] geometry the user drew and the plan the compiler returned.
 * WHAT IS MODELED: runoff, cooling, cost. These use the coefficients in SPECS /
 * DEFAULT_ASSUMPTIONS below. They are ASSUMPTIONS, not measurements. Replace them
 * with cited values (and your local Schedule of Rates for cost) before you present
 * them as anything but "modeled estimates". The UI must keep the "Modeled" label.
 *
 * FIX INCLUDED: "Unknown Geometry Type" crash. Turf reads the wrapper object's own
 * `type`. If the compiler returns { type: "bioswale", geometry: {...} } instead of
 * { type: "Feature", ... }, Turf throws. Every feature now goes through
 * normalizeFeature() before any Turf call, and invalid ones are skipped, not fatal.
 */
import * as turf from '@turf/turf';

export type InterventionType =
  | 'tree_corridor' | 'miyawaki' | 'rain_garden' | 'bioswale'
  | 'permeable_pavement' | 'pollinator_garden' | 'green_roof' | 'green_buffer';

type Spec = {
  label: string;
  keywords: string[];          // matched against properties.type/kind/category/name
  geom: 'area' | 'line' | 'point';
  widthM?: number;             // effective width for line features
  pointM2?: number;            // footprint for point features
  runoffC: number;             // runoff coefficient AFTER intervention (0..1)
  coolingWeight: number;       // 0..1, share of area that behaves like tree canopy
  habitat: boolean;            // counts toward habitat area
  storageDepthM: number;       // extra ponding/storage depth (m) -> m3 = area * depth
  costPerM2?: number;          // PLACEHOLDER INR/m2
  costPerKm?: number;          // PLACEHOLDER INR/km
  treesPerKm?: number;
  treesPerHa?: number;
};

export const SPECS: Record<InterventionType, Spec> = {
  tree_corridor:      { label: 'Tree Corridor', keywords: ['tree corridor', 'corridor', 'street tree', 'tree line', 'avenue'], geom: 'line', widthM: 6,
                        runoffC: 0.30, coolingWeight: 1.0, habitat: true, storageDepthM: 0, costPerKm: 2_500_000, treesPerKm: 267 },
  miyawaki:           { label: 'Miyawaki Pocket Forest', keywords: ['miyawaki', 'pocket forest', 'urban forest'], geom: 'area',
                        runoffC: 0.15, coolingWeight: 1.0, habitat: true, storageDepthM: 0, costPerM2: 800, treesPerHa: 30_000 },
  rain_garden:        { label: 'Rain Garden', keywords: ['rain garden'], geom: 'area',
                        runoffC: 0.10, coolingWeight: 0.4, habitat: true, storageDepthM: 0.30, costPerM2: 2_500 },
  bioswale:           { label: 'Bioswale', keywords: ['bioswale', 'swale'], geom: 'line', widthM: 2.5,
                        runoffC: 0.25, coolingWeight: 0.3, habitat: true, storageDepthM: 0.40, costPerKm: 3_000_000 },
  permeable_pavement: { label: 'Permeable Pavement', keywords: ['permeable', 'porous'], geom: 'area',
                        runoffC: 0.40, coolingWeight: 0.1, habitat: false, storageDepthM: 0.10, costPerM2: 2_000 },
  pollinator_garden:  { label: 'Pollinator Garden', keywords: ['pollinator'], geom: 'area',
                        runoffC: 0.20, coolingWeight: 0.4, habitat: true, storageDepthM: 0, costPerM2: 600 },
  green_roof:         { label: 'Green Roof', keywords: ['green roof', 'roof'], geom: 'area',
                        runoffC: 0.40, coolingWeight: 0.5, habitat: false, storageDepthM: 0.05, costPerM2: 3_500 },
  green_buffer:       { label: 'Green Buffer', keywords: ['green buffer', 'buffer'], geom: 'area',
                        runoffC: 0.20, coolingWeight: 0.8, habitat: true, storageDepthM: 0, costPerM2: 700 },
};

export const DEFAULT_ASSUMPTIONS = {
  baselineRunoffC: 0.80,      // dense urban, mostly impervious
  designStormMm: 75,          // design storm depth (mm); set to your city's design storm
  coolingCPerFraction: 5.0,   // deg C cooling per 1.0 canopy-equivalent fraction (=0.5 C per 10%); ASSUMPTION
  coolingCapC: 3.0,
};
export type Assumptions = typeof DEFAULT_ASSUMPTIONS;

export type F = GeoJSON.Feature<GeoJSON.Geometry, Record<string, any>>;
type SiteF = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, Record<string, any>>;

/* ------------------------------------------------------------------ */
/* Normalisation: the fix for "Unknown Geometry Type"                  */
/* ------------------------------------------------------------------ */

const GEOM_OK = new Set(['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']);

const finitePos = (p: any) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);
const closeRing = (r: any) => {
  if (!Array.isArray(r) || r.length < 3 || !finitePos(r[0])) return r;
  const a = r[0], b = r[r.length - 1];
  return a[0] === b[0] && a[1] === b[1] ? r : [...r, [a[0], a[1]]];
};
const ringOk = (r: any) => Array.isArray(r) && r.length >= 4 && r.every(finitePos);

function validGeometry(g: any): boolean {
  if (!g || !GEOM_OK.has(g.type) || !Array.isArray(g.coordinates)) return false;
  const c = g.coordinates;
  switch (g.type) {
    case 'Point': return finitePos(c);
    case 'MultiPoint': return c.length > 0 && c.every(finitePos);
    case 'LineString': return c.length >= 2 && c.every(finitePos);
    case 'MultiLineString': return c.length > 0 && c.every((l: any) => Array.isArray(l) && l.length >= 2 && l.every(finitePos));
    case 'Polygon': return c.length > 0 && c.every(ringOk);
    case 'MultiPolygon': return c.length > 0 && c.every((poly: any) => Array.isArray(poly) && poly.length > 0 && poly.every(ringOk));
  }
  return false;
}

/** Accepts a Feature, a bare geometry, or a loose { type: 'bioswale', geometry, ... } object.
 *  Returns a clean GeoJSON Feature, or null if it can't be made valid. Never throws. */
export function normalizeFeature(raw: any): F | null {
  try {
    if (!raw || typeof raw !== 'object') return null;
    let geometry = raw.geometry ?? (GEOM_OK.has(raw.type) ? raw : null);
    if (!geometry) return null;

    // auto-close polygon rings (LLM output often forgets the last point)
    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
      geometry = { ...geometry, coordinates: geometry.coordinates.map(closeRing) };
    } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
      geometry = { ...geometry, coordinates: geometry.coordinates.map((p: any) => (Array.isArray(p) ? p.map(closeRing) : p)) };
    }
    if (!validGeometry(geometry)) return null;

    const props: Record<string, any> = { ...(raw.properties ?? {}) };
    // a wrapper `type` like "bioswale" is really the intervention type — keep it for resolveType()
    if (raw.type && raw.type !== 'Feature' && !GEOM_OK.has(raw.type)) props.type ??= raw.type;
    if (raw.interventionId) props.interventionId ??= raw.interventionId;
    if (raw.name) props.name ??= raw.name;
    if (raw.id) props.id ??= raw.id;
    return { type: 'Feature', id: raw.id ?? props.id, properties: props, geometry } as F;
  } catch {
    return null;
  }
}

/** FeatureCollection | array | single feature | null  ->  clean Feature[] (invalid entries dropped). */
export function toFeatures(input: any): F[] {
  const arr = Array.isArray(input) ? input : Array.isArray(input?.features) ? input.features : input ? [input] : [];
  const out: F[] = [];
  for (const raw of arr) {
    const f = normalizeFeature(raw);
    if (f) out.push(f);
    else if (typeof console !== 'undefined') console.warn('[impact] dropped invalid feature', raw);
  }
  return out;
}

export function normalizeSite(raw: any): SiteF | null {
  const f = normalizeFeature(raw);
  if (!f || (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon')) return null;
  return f as SiteF;
}

export function resolveType(f: any): InterventionType | null {
  const p = f?.properties ?? {};
  const raw = [p.type, p.kind, p.category, p.intervention_type, (f as any)?.interventionId, p.interventionId, p.name, p.label]
    .filter(Boolean).join(' ').toLowerCase().replace(/[_-]+/g, ' ');
  for (const [t, s] of Object.entries(SPECS)) if (s.keywords.some((k) => raw.includes(k))) return t as InterventionType;
  return null;
}

/* ------------------------------------------------------------------ */
/* Site stats                                                          */
/* ------------------------------------------------------------------ */

/** Real site numbers straight from the drawn polygon. Returns zeros if the site is invalid. */
export function siteStats(siteRaw: any) {
  const site = normalizeSite(siteRaw);
  if (!site) return { areaM2: 0, areaHa: 0, perimKm: 0, vertices: 0 };
  const areaM2 = turf.area(site);
  const outer = site.geometry.type === 'Polygon' ? site.geometry.coordinates[0] : site.geometry.coordinates[0][0];
  let perimKm = 0;
  try { perimKm = turf.length(turf.polygonToLine(site as any) as any, { units: 'kilometers' }); } catch { /* keep 0 */ }
  return { areaM2, areaHa: areaM2 / 10_000, perimKm, vertices: Math.max(0, outer.length - 1) };
}

// Turf v7 signature: intersect(FeatureCollection). If your installed Turf is v6 use intersect(a, b).
function clipToSite(f: F, site: SiteF): GeoJSON.Feature | null {
  try {
    return (turf.intersect as any)(turf.featureCollection([f as any, site as any])) as GeoJSON.Feature | null;
  } catch {
    return f as GeoJSON.Feature; // if clipping fails, keep unclipped rather than dropping
  }
}

/* ------------------------------------------------------------------ */
/* Impact                                                              */
/* ------------------------------------------------------------------ */

const EMPTY_IMPACT = (A: Assumptions) => ({
  site: { areaHa: 0 },
  breakdown: [] as { type: InterventionType; label: string; count: number; areaM2: number; lengthKm: number; areaHa: number }[],
  unclassified: 0,
  greenCoverHa: 0,
  habitatSharePct: 0,
  storageM3: 0,
  runoffReductionPct: 0,
  surfaceCoolingC: 0,
  trees: 0,
  costINR: 0,
  assumptions: A,
});

export type Impact = ReturnType<typeof EMPTY_IMPACT>;

export function computeImpact(siteRaw: any, interventionsRaw: any, overrides: Partial<Assumptions> = {}): Impact {
  const A = { ...DEFAULT_ASSUMPTIONS, ...overrides };
  const site = normalizeSite(siteRaw);
  if (!site) return EMPTY_IMPACT(A);

  const siteM2 = turf.area(site);
  if (!(siteM2 > 0)) return EMPTY_IMPACT(A);

  const byType: Record<string, { type: InterventionType; label: string; count: number; areaM2: number; lengthKm: number }> = {};
  let unclassified = 0, changedM2 = 0, weightedRunoffM2 = 0, coolingM2 = 0, habitatM2 = 0, storageM3 = 0, costINR = 0, trees = 0;

  const list = Array.isArray(interventionsRaw) ? interventionsRaw : Array.isArray(interventionsRaw?.features) ? interventionsRaw.features : [];

  for (const raw of list) {
    const f = normalizeFeature(raw);
    if (!f) { unclassified++; console.warn('[impact] dropped invalid intervention', raw); continue; }

    const t = resolveType(f);
    if (!t) { unclassified++; continue; }
    const s = SPECS[t];
    let areaM2 = 0, lenKm = 0;

    try {
      const g = f.geometry.type;
      if (s.geom === 'area' && (g === 'Polygon' || g === 'MultiPolygon')) {
        const c = clipToSite(f, site);
        areaM2 = c ? turf.area(c as any) : 0;
      } else if (s.geom === 'line' && (g === 'LineString' || g === 'MultiLineString')) {
        lenKm = turf.length(f as any, { units: 'kilometers' });
        areaM2 = lenKm * 1000 * (s.widthM ?? 3);
      } else if (g === 'Point') {
        areaM2 = s.pointM2 ?? 20;
      } else {
        unclassified++; // geometry doesn't match what this intervention type expects
        continue;
      }
    } catch (e) {
      console.warn('[impact] turf failed for feature', f, e);
      unclassified++;
      continue;
    }

    const e = (byType[t] ??= { type: t, label: s.label, count: 0, areaM2: 0, lengthKm: 0 });
    e.count += 1; e.areaM2 += areaM2; e.lengthKm += lenKm;

    changedM2 += areaM2;
    weightedRunoffM2 += areaM2 * s.runoffC;
    coolingM2 += areaM2 * s.coolingWeight;
    if (s.habitat) habitatM2 += areaM2;
    storageM3 += areaM2 * s.storageDepthM;
    costINR += (s.costPerM2 ?? 0) * (s.geom === 'line' ? 0 : areaM2) + (s.costPerKm ?? 0) * lenKm;
    if (s.treesPerKm) trees += s.treesPerKm * lenKm;
    if (s.treesPerHa) trees += (s.treesPerHa * areaM2) / 10_000;
  }

  changedM2 = Math.min(changedM2, siteM2); // overlapping features can't change more than the whole site
  const P = A.designStormMm / 1000;
  const v0 = A.baselineRunoffC * P * siteM2;
  const untouched = Math.max(0, siteM2 - changedM2);
  const v1 = Math.max(0, P * (A.baselineRunoffC * untouched + weightedRunoffM2) - storageM3);
  const canopyFraction = Math.min(1, coolingM2 / siteM2);

  return {
    site: { areaHa: siteM2 / 10_000 },
    breakdown: Object.values(byType).map((b) => ({ ...b, areaHa: b.areaM2 / 10_000 })),
    unclassified,                                             // show a warning in the UI if > 0
    greenCoverHa: habitatM2 / 10_000,                         // REAL (geometry)
    habitatSharePct: Math.min(100, (habitatM2 / siteM2) * 100), // REAL (geometry) — use instead of a made-up "biodiversity %"
    storageM3,                                                // MODELED (area x depth)
    runoffReductionPct: v0 > 0 ? ((v0 - v1) / v0) * 100 : 0,  // MODELED (rational-method style)
    surfaceCoolingC: -Math.min(A.coolingCapC, A.coolingCPerFraction * canopyFraction), // MODELED
    trees: Math.round(trees),                                 // derived from density assumptions
    costINR,                                                  // MODELED (placeholder unit rates)
    assumptions: A,
  };
}

export const fmtHa = (v: number) => `${v.toFixed(v < 10 ? 2 : 1)} ha`;
export function fmtINR(v: number) {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} crore`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)} lakh`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
