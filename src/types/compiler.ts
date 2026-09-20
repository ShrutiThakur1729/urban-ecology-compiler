export type GoalType = 
  | 'flood_resilience' 
  | 'heat_reduction' 
  | 'biodiversity' 
  | 'groundwater_recharge' 
  | 'air_quality' 
  | 'recreational_green';

export interface GoalRequirement {
  name: GoalType;
  priority: number; // 1 (highest), 2, 3, etc.
  description?: string;
  targetWeight?: number; // 0 to 1
}

export interface PlanningConstraints {
  budget_inr: number;
  demolition_allowed: boolean;
  max_roof_retrofit_percent?: number;
  preserve_roads?: boolean;
  min_tree_canopy_target_percent?: number;
  prioritize_native_species?: boolean;
}

export interface StructuredCompilerPlanRequest {
  naturalLanguagePrompt: string;
  goals: GoalRequirement[];
  constraints: PlanningConstraints;
  parsedSummary: string;
  tradeoffAnalysis: string;
}
