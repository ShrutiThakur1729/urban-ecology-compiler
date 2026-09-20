import { CandidateInterventionFeature } from './interventions';
import { MetricWithProvenance } from './provenance';

export type ScenarioType = 'BALANCED' | 'FLOOD_FIRST' | 'BIODIVERSITY_FIRST';

export interface ModeledImpactSummary {
  totalEstimatedCostInr: MetricWithProvenance<number>;
  totalAreaIntervenedSqMeters: MetricWithProvenance<number>;
  canopyIncreasePercent: MetricWithProvenance<number>;
  permeableSurfaceIncreasePercent: MetricWithProvenance<number>;
  stormwaterRunoffMitigationLiters: MetricWithProvenance<number>; // per major 50mm storm event
  peakMicroclimateTempReductionC: MetricWithProvenance<number>;
  biodiversityConnectivityIndexGain: MetricWithProvenance<number>; // percentage improvement
  annualCo2SequestrationKg: MetricWithProvenance<number>;
}

export interface EcologicalScenario {
  id: string;
  type: ScenarioType;
  title: string;
  tagline: string;
  description: string;
  interventions: CandidateInterventionFeature[];
  impact: ModeledImpactSummary;
  budgetUtilizationPercent: number;
  totalCostInr: number;
  tradeoffs: {
    pros: string[];
    cons: string[];
    riskFactors: string[];
  };
  assumptions: string[];
  limitations: string;
}

export interface OptimizationResult {
  scenarios: {
    balanced: EcologicalScenario;
    floodFirst: EcologicalScenario;
    biodiversityFirst: EcologicalScenario;
  };
  activeScenarioType: ScenarioType;
  generatedAt: string;
}
