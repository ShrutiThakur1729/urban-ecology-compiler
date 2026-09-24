import { SelectedLocation, SitePolygon, LngLat } from '@/types/geo';
import { SiteAnalysisData } from '@/types/analysis';
import { OptimizationResult, ScenarioType } from '@/types/scenarios';
import { CandidateInterventionFeature } from '@/types/interventions';

export type ComparisonMode = 'before' | 'after' | 'split';
export type MapStyleType = 'dark' | 'satellite' | 'light';

export interface DataProvenanceRecord {
  source: string;
  sourceType: 'observed' | 'derived' | 'modeled';
  retrievedAt: string;
  processingMethod: string;
  status: 'live' | 'cached' | 'fallback' | 'insufficient_data';
  assumptions?: string[];
}

export interface ProjectState {
  id: string;
  name: string;
  location: SelectedLocation;
  sitePolygon: SitePolygon | null;
  siteAreaHa: number;
  sitePerimeterKm: number;
  siteVertexCount: number;
  priorities: string[];
  budgetInr: number;
  constraints: {
    avoidDemolition: boolean;
    focusPublicSpaces: boolean;
  };
  environmentalData: SiteAnalysisData | null;
  optimizationResult: OptimizationResult | null;
  selectedScenario: ScenarioType;
  comparisonMode: ComparisonMode;
  beforeAfterSplitPercent: number;
  mapStyle: MapStyleType;
  createdAt: string;
  updatedAt: string;
  dataProvenance: Record<string, DataProvenanceRecord>;
  isDemo: boolean;
}

export interface SavedProjectSummary {
  id: string;
  name: string;
  locationName: string;
  siteAreaHa: number;
  selectedPriorities: string[];
  scenarioTitle: string;
  interventionCount: number;
  updatedAt: string;
  isDemo: boolean;
}
