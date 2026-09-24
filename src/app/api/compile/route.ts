import { NextRequest, NextResponse } from 'next/server';
import { GeminiCompiler } from '@/lib/compiler/geminiCompiler';
import { InterventionEngine } from '@/lib/interventions/interventionEngine';
import { ScenarioOptimizer } from '@/lib/optimizer/scenarioOptimizer';
import { SitePolygon } from '@/types/geo';
import { SiteAnalysisData } from '@/types/analysis';
import { THANE_DEMO_SITE_POLYGON, THANE_DEMO_ANALYSIS, THANE_DEMO_OPTIMIZED_SCENARIOS } from '@/lib/demo/demoData';
import { toFeatures } from '@/lib/geo/impact';
import * as turf from '@turf/turf';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body.prompt || 'Reduce monsoon flooding first, then heat, increase biodiversity, don\'t demolish buildings and keep budget under ₹50 lakh';
    const polygon: SitePolygon = body.polygon || THANE_DEMO_SITE_POLYGON;
    const analysis: SiteAnalysisData = body.analysis || THANE_DEMO_ANALYSIS;
    const budgetOverrideInr: number | undefined = body.budgetInr;

    // 1. Natural language compilation via Gemini with fallback
    const compiledPlan = await GeminiCompiler.compileRequirements(prompt, budgetOverrideInr || 5000000);

    if (budgetOverrideInr) {
      compiledPlan.constraints.budget_inr = budgetOverrideInr;
    }

    // 2. Spatial candidate feature generation
    const candidates = InterventionEngine.generateSpatialCandidates(polygon, analysis);

    // 3. Multi-objective scenario optimization
    const optimizationResult = ScenarioOptimizer.optimize(analysis, candidates, compiledPlan);

    // 4. Ensure real GeoJSON Features with properties.type and [lng, lat]
    const validatedCandidates = toFeatures(candidates);
    for (const f of validatedCandidates) {
      try {
        const centroid = turf.centroid(f as any);
        if (!turf.booleanPointInPolygon(centroid, polygon as any)) {
          console.warn('[compile] intervention feature centroid outside site boundary:', f.properties?.name || f.id);
        }
      } catch {
        // silent
      }
    }

    for (const key of ['balanced', 'floodFirst', 'biodiversityFirst'] as const) {
      if (optimizationResult.scenarios[key]?.interventions) {
        optimizationResult.scenarios[key].interventions = toFeatures(
          optimizationResult.scenarios[key].interventions
        );
      }
    }

    return NextResponse.json({
      success: true,
      compiledPlan,
      candidates: validatedCandidates,
      optimizationResult
    });
  } catch (err: any) {
    console.error('Compiler API route error:', err);
    const validatedDemo = JSON.parse(JSON.stringify(THANE_DEMO_OPTIMIZED_SCENARIOS));
    for (const key of ['balanced', 'floodFirst', 'biodiversityFirst'] as const) {
      if (validatedDemo.scenarios[key]?.interventions) {
        validatedDemo.scenarios[key].interventions = toFeatures(
          validatedDemo.scenarios[key].interventions
        );
      }
    }

    return NextResponse.json({
      success: true,
      compiledPlan: {
        naturalLanguagePrompt: 'Fallback compiled scenario',
        goals: [
          { name: 'flood_resilience', priority: 1 },
          { name: 'heat_reduction', priority: 2 },
          { name: 'biodiversity', priority: 3 }
        ],
        constraints: { budget_inr: 5000000, demolition_allowed: false },
        parsedSummary: 'Prioritizing flood reduction followed by heat island cooling and biodiversity.',
        tradeoffAnalysis: 'Optimal budget allocation across bioswales and pocket forests.'
      },
      optimizationResult: validatedDemo
    });
  }
}
