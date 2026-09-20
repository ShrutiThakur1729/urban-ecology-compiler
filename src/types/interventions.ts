export type InterventionId = 
  | 'tree_corridor' 
  | 'pocket_forest' 
  | 'rain_garden' 
  | 'bioswale' 
  | 'green_roof' 
  | 'permeable_pavement' 
  | 'pollinator_garden' 
  | 'green_buffer';

export interface InterventionSpec {
  id: InterventionId;
  name: string;
  category: 'HYDROLOGY' | 'VEGETATION' | 'COOLING' | 'PERMEABILITY';
  description: string;
  environmentalBenefits: string[];
  unitCostInr: number; // Cost per sq meter or linear meter
  costUnit: 'per_sq_meter' | 'per_linear_meter' | 'per_unit';
  spaceRequirement: {
    minAreaSqMeters?: number;
    preferredPlacement: 'road_verge' | 'open_ground' | 'roof' | 'paved_surface' | 'riparian_edge';
    slopeSuitability: { minPercent: number; maxPercent: number };
  };
  benefitsMultiplier: {
    runoffReductionPerSqM: number; // liters per storm event
    heatMitigationDeltaC: number;  // microclimate cooling effect
    biodiversityGainScore: number; // 1 - 10
    co2SequestrationKgYearPerUnit: number;
  };
  suitableConditions: string[];
  unsuitableConditions: string[];
  maintenanceNote: string;
  colorHex: string;
}

export interface CandidateInterventionFeature {
  id: string;
  interventionId: InterventionId;
  name: string;
  geometry: {
    type: 'Polygon' | 'LineString' | 'Point';
    coordinates: any;
  };
  properties: {
    areaSqMeters: number;
    lengthMeters?: number;
    estimatedCostInr: number;
    runoffInterceptionLiters: number;
    coolingImpactCelsius: number;
    biodiversityScore: number;
    feasibilityScore: number; // 0 to 1
    suitabilityReason: string;
    colorHex: string;
  };
}
