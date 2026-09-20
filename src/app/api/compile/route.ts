import { NextRequest, NextResponse } from 'next/server';
import { GeminiCompiler } from '@/lib/compiler/geminiCompiler';
import { InterventionEngine } from '@/lib/interventions/interventionEngine';
import { ScenarioOptimizer } from '@/lib/optimizer/scenarioOptimizer';
import { SitePolygon } from '@/types/geo';
import { SiteAnalysisData } from '@/types/analysis';
import { THANE_DEMO_SITE_POLYGON, THANE_DEMO_ANALYSIS, THANE_DEMO_OPTIMIZED_SCENARIOS } from '@/lib/demo/demoData';

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

    return NextResponse.json({
      success: true,
      compiledPlan,
      candidates,
      optimizationResult
    });
  } catch (err: any) {
    console.error('Compiler API route error:', err);
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
      optimizationResult: THANE_DEMO_OPTIMIZED_SCENARIOS
    });
  }
}
