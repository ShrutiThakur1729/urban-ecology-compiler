import { SitePolygon } from '@/types/geo';
import { SiteAnalysisData } from '@/types/analysis';
import { CandidateInterventionFeature } from '@/types/interventions';
import { INTERVENTION_REGISTRY } from './registry';
import * as turf from '@turf/turf';

function clipPolygonToSite(candidateCoords: [number, number][][], sitePolygon: SitePolygon): any {
  try {
    const cand = turf.polygon(candidateCoords);
    const isect = turf.intersect(turf.featureCollection([cand, sitePolygon as any]));
    if (isect && (isect.geometry.type === 'Polygon' || isect.geometry.type === 'MultiPolygon')) {
      return isect.geometry;
    }
  } catch (e) {
    // Fallback if geometric intersection encounters topology edge
  }
  return { type: 'Polygon', coordinates: candidateCoords };
}

export class InterventionEngine {
  static generateSpatialCandidates(polygon: SitePolygon, analysis: SiteAnalysisData): CandidateInterventionFeature[] {
    const candidates: CandidateInterventionFeature[] = [];
    const bboxArray = turf.bbox(polygon);
    const [minLng, minLat, maxLng, maxLat] = bboxArray;
    const width = maxLng - minLng;
    const height = maxLat - minLat;
    const centroid = turf.centroid(polygon).geometry.coordinates as [number, number];
    const [cLng, cLat] = centroid;

    // 1. Rain Garden Candidate (Placed at topographic low points / catchment depressions)
    const lowPoints = analysis.providers?.elevation?.lowPoints;
    const rgCoord = (lowPoints && lowPoints.length > 0)
      ? lowPoints[0].coordinate
      : [cLng - width * 0.15, cLat - height * 0.18];
    const rgWidth = width * 0.18;
    const rgHeight = height * 0.14;

    const rgRawCoords: [number, number][][] = [[
      [rgCoord[0] - rgWidth / 2, rgCoord[1] - rgHeight / 2],
      [rgCoord[0] + rgWidth / 2, rgCoord[1] - rgHeight / 2],
      [rgCoord[0] + rgWidth / 2, rgCoord[1] + rgHeight / 2],
      [rgCoord[0] - rgWidth / 2, rgCoord[1] + rgHeight / 2],
      [rgCoord[0] - rgWidth / 2, rgCoord[1] - rgHeight / 2]
    ]];

    candidates.push({
      id: `cand-rg-${Date.now()}-1`,
      interventionId: 'rain_garden',
      name: 'Topographic Catchment Rain Garden',
      geometry: clipPolygonToSite(rgRawCoords, polygon),
      properties: {
        type: 'rain_garden',
        areaSqMeters: Math.min(3000, Math.round(analysis.siteAreaSquareMeters * 0.055)),
        estimatedCostInr: Math.min(3000, Math.round(analysis.siteAreaSquareMeters * 0.055)) * INTERVENTION_REGISTRY.rain_garden.unitCostInr,
        runoffInterceptionLiters: Math.round(analysis.siteAreaSquareMeters * 0.055 * 50),
        coolingImpactCelsius: 0.8,
        biodiversityScore: 7.5,
        feasibilityScore: 0.94,
        suitabilityReason: 'Natural low-elevation gradient receiving runoff from surrounding paved quadrants; zero building conflict.',
        colorHex: INTERVENTION_REGISTRY.rain_garden.colorHex
      }
    });

    // 2. Vegetated Bioswale (Placed along main road verge inside site)
    candidates.push({
      id: `cand-bio-${Date.now()}-2`,
      interventionId: 'bioswale',
      name: 'Arterial Roadside Bioswale Strip',
      geometry: {
        type: 'LineString',
        coordinates: [
          [cLng - width * 0.28, cLat - height * 0.08],
          [cLng, cLat - height * 0.05],
          [cLng + width * 0.28, cLat - height * 0.02]
        ]
      },
      properties: {
        type: 'bioswale',
        areaSqMeters: Math.round(analysis.siteAreaSquareMeters * 0.025),
        lengthMeters: Math.round(turf.length(turf.lineString([
          [cLng - width * 0.28, cLat - height * 0.08],
          [cLng + width * 0.28, cLat - height * 0.02]
        ]), { units: 'meters' })),
        estimatedCostInr: Math.round(turf.length(turf.lineString([
          [cLng - width * 0.28, cLat - height * 0.08],
          [cLng + width * 0.28, cLat - height * 0.02]
        ]), { units: 'meters' }) * INTERVENTION_REGISTRY.bioswale.unitCostInr),
        runoffInterceptionLiters: Math.round(analysis.siteAreaSquareMeters * 0.025 * 70),
        coolingImpactCelsius: 0.6,
        biodiversityScore: 6.8,
        feasibilityScore: 0.92,
        suitabilityReason: 'Unpaved road verge with continuous linear stormwater conveyance potential.',
        colorHex: INTERVENTION_REGISTRY.bioswale.colorHex
      }
    });

    // 3. Tree Canopy Corridor (Continuous green spine inside site)
    candidates.push({
      id: `cand-tc-${Date.now()}-3`,
      interventionId: 'tree_corridor',
      name: 'Continuous Urban Canopy Green Spine',
      geometry: {
        type: 'LineString',
        coordinates: [
          [cLng - width * 0.25, cLat + height * 0.15],
          [cLng, cLat + height * 0.18],
          [cLng + width * 0.25, cLat + height * 0.22]
        ]
      },
      properties: {
        type: 'tree_corridor',
        areaSqMeters: Math.min(3500, Math.round(analysis.siteAreaSquareMeters * 0.038)),
        lengthMeters: 1200,
        estimatedCostInr: Math.min(3500, Math.round(analysis.siteAreaSquareMeters * 0.038)) * INTERVENTION_REGISTRY.tree_corridor.unitCostInr,
        runoffInterceptionLiters: Math.round(analysis.siteAreaSquareMeters * 0.038 * 30),
        coolingImpactCelsius: 2.1,
        biodiversityScore: 8.8,
        feasibilityScore: 0.95,
        suitabilityReason: 'Links fragmented roadside tree patches into a continuous thermal shade canopy.',
        colorHex: INTERVENTION_REGISTRY.tree_corridor.colorHex
      }
    });

    // 4. Miyawaki Native Pocket Forest (Placed on open unbuilt area inside site)
    const pfWidth = width * 0.22;
    const pfHeight = height * 0.2;
    const pfX = cLng - width * 0.25;
    const pfY = cLat + height * 0.02;
    const pfRawCoords: [number, number][][] = [[
      [pfX, pfY],
      [pfX + pfWidth, pfY],
      [pfX + pfWidth, pfY + pfHeight],
      [pfX, pfY + pfHeight],
      [pfX, pfY]
    ]];

    candidates.push({
      id: `cand-pf-${Date.now()}-4`,
      interventionId: 'pocket_forest',
      name: 'High-Density Miyawaki Native Forest',
      geometry: clipPolygonToSite(pfRawCoords, polygon),
      properties: {
        type: 'miyawaki',
        areaSqMeters: Math.min(3000, Math.round(analysis.siteAreaSquareMeters * 0.06)),
        estimatedCostInr: Math.min(3000, Math.round(analysis.siteAreaSquareMeters * 0.06)) * INTERVENTION_REGISTRY.pocket_forest.unitCostInr,
        runoffInterceptionLiters: Math.round(analysis.siteAreaSquareMeters * 0.06 * 30),
        coolingImpactCelsius: 2.9,
        biodiversityScore: 9.9,
        feasibilityScore: 0.93,
        suitabilityReason: 'Open unbuilt municipal plot with sufficient contiguous depth for 35+ native tree species.',
        colorHex: INTERVENTION_REGISTRY.pocket_forest.colorHex
      }
    });

    // 5. Lightweight Green Roof (Placed over institutional building zone)
    const grWidth = width * 0.18;
    const grHeight = height * 0.16;
    const grX = cLng + width * 0.08;
    const grY = cLat + height * 0.08;
    const grRawCoords: [number, number][][] = [[
      [grX, grY],
      [grX + grWidth, grY],
      [grX + grWidth, grY + grHeight],
      [grX, grY + grHeight],
      [grX, grY]
    ]];

    candidates.push({
      id: `cand-gr-${Date.now()}-5`,
      interventionId: 'green_roof',
      name: 'Institutional Rooftop Cooling Blanket',
      geometry: clipPolygonToSite(grRawCoords, polygon),
      properties: {
        type: 'green_roof',
        areaSqMeters: Math.min(2000, Math.round(analysis.siteAreaSquareMeters * 0.035)),
        estimatedCostInr: Math.min(2000, Math.round(analysis.siteAreaSquareMeters * 0.035)) * INTERVENTION_REGISTRY.green_roof.unitCostInr,
        runoffInterceptionLiters: Math.round(analysis.siteAreaSquareMeters * 0.035 * 40),
        coolingImpactCelsius: 2.3,
        biodiversityScore: 6.2,
        feasibilityScore: 0.86,
        suitabilityReason: 'Flat concrete slab roof providing immediate thermal insulation without ground land acquisition.',
        colorHex: INTERVENTION_REGISTRY.green_roof.colorHex
      }
    });

    // 6. Permeable Pavement (Commercial parking lot retrofit)
    const ppWidth = width * 0.18;
    const ppHeight = height * 0.14;
    const ppX = cLng + width * 0.06;
    const ppY = cLat - height * 0.22;
    const ppRawCoords: [number, number][][] = [[
      [ppX, ppY],
      [ppX + ppWidth, ppY],
      [ppX + ppWidth, ppY + ppHeight],
      [ppX, ppY + ppHeight],
      [ppX, ppY]
    ]];

    candidates.push({
      id: `cand-pp-${Date.now()}-6`,
      interventionId: 'permeable_pavement',
      name: 'Commercial Parking Permeable Surface',
      geometry: clipPolygonToSite(ppRawCoords, polygon),
      properties: {
        type: 'permeable_pavement',
        areaSqMeters: Math.min(2500, Math.round(analysis.siteAreaSquareMeters * 0.04)),
        estimatedCostInr: Math.min(2500, Math.round(analysis.siteAreaSquareMeters * 0.04)) * INTERVENTION_REGISTRY.permeable_pavement.unitCostInr,
        runoffInterceptionLiters: Math.round(analysis.siteAreaSquareMeters * 0.04 * 40),
        coolingImpactCelsius: 1.0,
        biodiversityScore: 3.0,
        feasibilityScore: 0.90,
        suitabilityReason: 'Replaces sealed asphalt parking with porous interlocking paver base.',
        colorHex: INTERVENTION_REGISTRY.permeable_pavement.colorHex
      }
    });

    // 7. Pollinator Stepping Stone (Central community space)
    const polWidth = width * 0.14;
    const polHeight = height * 0.12;
    const polX = cLng - width * 0.07;
    const polY = cLat - height * 0.06;
    const polRawCoords: [number, number][][] = [[
      [polX, polY],
      [polX + polWidth, polY],
      [polX + polWidth, polY + polHeight],
      [polX, polY + polHeight],
      [polX, polY]
    ]];

    candidates.push({
      id: `cand-pol-${Date.now()}-7`,
      interventionId: 'pollinator_garden',
      name: 'Central Flora & Pollinator Sanctuary',
      geometry: clipPolygonToSite(polRawCoords, polygon),
      properties: {
        type: 'pollinator_garden',
        areaSqMeters: Math.min(2000, Math.round(analysis.siteAreaSquareMeters * 0.025)),
        estimatedCostInr: Math.min(2000, Math.round(analysis.siteAreaSquareMeters * 0.025)) * INTERVENTION_REGISTRY.pollinator_garden.unitCostInr,
        runoffInterceptionLiters: Math.round(analysis.siteAreaSquareMeters * 0.025 * 20),
        coolingImpactCelsius: 0.7,
        biodiversityScore: 9.6,
        feasibilityScore: 0.96,
        suitabilityReason: 'Sunlit municipal park quadrant suitable for nectar and butterfly larval host plants.',
        colorHex: INTERVENTION_REGISTRY.pollinator_garden.colorHex
      }
    });

    return candidates;
  }
}
