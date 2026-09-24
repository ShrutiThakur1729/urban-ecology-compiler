import { ProjectState, SavedProjectSummary } from '@/types/project';
import { SitePolygon } from '@/types/geo';
import { computePolygonStats, buildSitePolygon } from '@/lib/geo/geometryUtils';
import { supabase } from '@/lib/supabase/client';

const LOCAL_STORAGE_KEY = 'urban_compiler_projects_v1';

/**
 * Reads all stored projects from local storage
 */
export function getLocalProjects(): ProjectState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[STORAGE] Failed to parse local projects:', e);
    return [];
  }
}

/**
 * Saves project to local storage and attempts Supabase sync
 */
export async function saveProject(project: ProjectState): Promise<ProjectState> {
  const updatedProject: ProjectState = {
    ...project,
    updatedAt: new Date().toISOString()
  };

  // 1. Save to local storage for immediate zero-latency persistence
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalProjects();
      const index = existing.findIndex((p) => p.id === updatedProject.id);
      if (index >= 0) {
        existing[index] = updatedProject;
      } else {
        existing.unshift(updatedProject);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('[STORAGE] Local storage save error:', e);
    }
  }

  // 2. Best-effort Supabase cloud persistence
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userId) {
      // Upsert into Supabase projects table
      await supabase.from('projects').upsert({
        id: updatedProject.id,
        user_id: userId,
        name: updatedProject.name,
        city: updatedProject.location.name,
        state: updatedProject.location.formattedAddress,
        center_lng: updatedProject.location.center[0],
        center_lat: updatedProject.location.center[1],
        updated_at: updatedProject.updatedAt
      });

      // Upsert into sites table if polygon exists
      if (updatedProject.sitePolygon) {
        await supabase.from('sites').upsert({
          project_id: updatedProject.id,
          name: updatedProject.name,
          polygon_geojson: updatedProject.sitePolygon,
          area_sq_meters: updatedProject.siteAreaHa * 10000,
          area_hectares: updatedProject.siteAreaHa
        });
      }
    }
  } catch (supaErr) {
    console.info('[STORAGE] Supabase sync skipped or failed (local persistence intact):', supaErr);
  }

  return updatedProject;
}

/**
 * Fetches project summaries for the Project Library
 */
export async function getProjectSummaries(): Promise<SavedProjectSummary[]> {
  const localList = getLocalProjects();
  return localList.map((p) => ({
    id: p.id,
    name: p.name,
    locationName: p.location.name,
    siteAreaHa: p.siteAreaHa,
    selectedPriorities: p.priorities,
    scenarioTitle:
      p.optimizationResult?.scenarios[
        p.selectedScenario === 'FLOOD_FIRST'
          ? 'floodFirst'
          : p.selectedScenario === 'BIODIVERSITY_FIRST'
          ? 'biodiversityFirst'
          : 'balanced'
      ]?.title || 'Compiled Plan',
    interventionCount:
      p.optimizationResult?.scenarios[
        p.selectedScenario === 'FLOOD_FIRST'
          ? 'floodFirst'
          : p.selectedScenario === 'BIODIVERSITY_FIRST'
          ? 'biodiversityFirst'
          : 'balanced'
      ]?.interventions?.length || 0,
    updatedAt: p.updatedAt,
    isDemo: p.isDemo
  }));
}

/**
 * Loads a project by ID
 */
export async function loadProject(id: string): Promise<ProjectState | null> {
  const localList = getLocalProjects();
  const match = localList.find((p) => p.id === id);
  if (match) return match;

  // Attempt Supabase fetch
  try {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single();
    if (data) {
      // Reconstruct ProjectState if found in Supabase
      console.log('[STORAGE] Project retrieved from Supabase:', data.name);
    }
  } catch {}

  return null;
}

/**
 * Deletes a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const existing = getLocalProjects();
    const filtered = existing.filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  try {
    await supabase.from('projects').delete().eq('id', id);
  } catch {}

  return true;
}

/**
 * Exports project as a downloadable JSON file
 */
export function exportProjectAsJson(project: ProjectState) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_plan.uec.json`;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Imports project from JSON string with geometry recalculation
 */
export function importProjectFromJson(rawJson: string): ProjectState {
  const parsed = JSON.parse(rawJson);

  if (!parsed.name || !parsed.location) {
    throw new Error('Invalid project file: missing required project metadata');
  }

  let recalculatedPolygon = parsed.sitePolygon;
  let areaHa = parsed.siteAreaHa || 0;
  let perimeterKm = parsed.sitePerimeterKm || 0;
  let vertexCount = parsed.siteVertexCount || 0;

  if (recalculatedPolygon?.geometry?.coordinates?.[0]) {
    const stats = computePolygonStats(recalculatedPolygon);
    if (stats) {
      areaHa = stats.areaHectares;
      perimeterKm = stats.perimeterKilometers;
      vertexCount = stats.vertexCount;
      recalculatedPolygon.properties = {
        ...recalculatedPolygon.properties,
        areaHectares: areaHa,
        areaSquareMeters: stats.areaSqMeters,
        perimeterMeters: stats.perimeterMeters
      };
    }
  }

  const project: ProjectState = {
    ...parsed,
    id: parsed.id || `proj_${Date.now()}`,
    sitePolygon: recalculatedPolygon,
    siteAreaHa: areaHa,
    sitePerimeterKm: perimeterKm,
    siteVertexCount: vertexCount,
    updatedAt: new Date().toISOString()
  };

  return project;
}

/**
 * Imports a raw GeoJSON site boundary and creates a SitePolygon with verified Turf calculations
 */
export function importGeoJsonBoundary(rawGeoJson: string, locationName: string): SitePolygon {
  const parsed = JSON.parse(rawGeoJson);
  let coords: [number, number][] = [];

  if (parsed.type === 'Feature' && parsed.geometry?.type === 'Polygon') {
    coords = parsed.geometry.coordinates[0];
  } else if (parsed.type === 'Polygon') {
    coords = parsed.coordinates[0];
  } else if (parsed.type === 'FeatureCollection' && parsed.features?.[0]?.geometry?.type === 'Polygon') {
    coords = parsed.features[0].geometry.coordinates[0];
  } else {
    throw new Error('Unsupported GeoJSON: Must contain a Polygon geometry');
  }

  const polygon = buildSitePolygon(coords, `${locationName} Imported Boundary`);
  if (!polygon) {
    throw new Error('Could not calculate geographic geometry from provided coordinates');
  }

  return polygon;
}
