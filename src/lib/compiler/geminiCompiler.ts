import { GoogleGenerativeAI } from '@google/generative-ai';
import { StructuredCompilerPlanRequest, GoalRequirement, PlanningConstraints, GoalType } from '@/types/compiler';

export class GeminiCompiler {
  static async compileRequirements(naturalLanguagePrompt: string, defaultBudgetInr: number = 5000000): Promise<StructuredCompilerPlanRequest> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const systemPrompt = `
You are the Urban Ecology Compiler Requirement Parser.
Convert the user's natural-language urban ecological planning requirements into a strict JSON object.

Allowed goal names:
- "flood_resilience" (monsoon, stormwater, waterlogging, drainage, sponge city)
- "heat_reduction" (urban heat island, cooling, shade, thermal comfort)
- "biodiversity" (wildlife, native trees, birds, pollinators, Miyawaki, rewilding)
- "groundwater_recharge" (aquifer, percolation, infiltration)
- "air_quality" (PM2.5, dust, pollution buffer)
- "recreational_green" (parks, community walkways, scenic)

Output format must match this TypeScript interface:
{
  "goals": [
    { "name": "flood_resilience", "priority": 1, "description": "Reduce monsoon flooding" },
    { "name": "heat_reduction", "priority": 2, "description": "Mitigate extreme summer heat" },
    { "name": "biodiversity", "priority": 3, "description": "Restore native Western Ghats habitat" }
  ],
  "constraints": {
    "budget_inr": 5000000,
    "demolition_allowed": false,
    "preserve_roads": true,
    "prioritize_native_species": true
  },
  "parsedSummary": "Priority ranking: Flooding (P1) > Heat (P2) > Biodiversity (P3) with strict ₹50 Lakh budget and zero building demolition.",
  "tradeoffAnalysis": "High investment in bioswales and rain gardens will absorb 80%+ monsoon runoff while delivering secondary cooling and pollinator corridors."
}

User input: "${naturalLanguagePrompt}"
`;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);

        if (parsed.goals && Array.isArray(parsed.goals) && parsed.constraints) {
          return {
            naturalLanguagePrompt,
            goals: parsed.goals,
            constraints: {
              budget_inr: parsed.constraints.budget_inr || defaultBudgetInr,
              demolition_allowed: parsed.constraints.demolition_allowed ?? false,
              preserve_roads: parsed.constraints.preserve_roads ?? true,
              prioritize_native_species: parsed.constraints.prioritize_native_species ?? true,
              ...parsed.constraints
            },
            parsedSummary: parsed.parsedSummary || 'Parsed goals and constraints successfully.',
            tradeoffAnalysis: parsed.tradeoffAnalysis || 'Balanced allocation across spatial intervention types.'
          };
        }
      } catch (err) {
        console.warn('Gemini LLM API call error, using deterministic fallback parser:', err);
      }
    }

    // Deterministic Rule-Based Fallback Parser
    return this.deterministicFallbackParser(naturalLanguagePrompt, defaultBudgetInr);
  }

  private static deterministicFallbackParser(prompt: string, defaultBudgetInr: number): StructuredCompilerPlanRequest {
    const text = prompt.toLowerCase();
    const goals: GoalRequirement[] = [];

    // Detect Budget in Lakhs / Crores / INR
    let budget = defaultBudgetInr;
    const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lacs|lac)/);
    const croreMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:crore|cr)/);
    const numberMatch = text.match(/(?:₹|rs\.?|inr)\s*(\d+[\d,]*)/);

    if (lakhMatch) {
      budget = parseFloat(lakhMatch[1]) * 100000;
    } else if (croreMatch) {
      budget = parseFloat(croreMatch[1]) * 10000000;
    } else if (numberMatch) {
      budget = parseInt(numberMatch[1].replace(/,/g, ''), 10);
    }

    // Demolition constraint
    const noDemolition = text.includes('no demolish') || text.includes("don't demolish") || text.includes('preserve building') || text.includes('without demolishing');

    // Priority ordering detection
    const hasFlood = text.includes('flood') || text.includes('waterlog') || text.includes('drain') || text.includes('monsoon') || text.includes('sponge');
    const hasHeat = text.includes('heat') || text.includes('cool') || text.includes('temperature') || text.includes('shade');
    const hasBio = text.includes('bio') || text.includes('tree') || text.includes('forest') || text.includes('pollinator') || text.includes('native') || text.includes('nature');

    let p = 1;
    if (text.indexOf('flood') !== -1 && (!hasHeat || text.indexOf('flood') < text.indexOf('heat'))) {
      if (hasFlood) goals.push({ name: 'flood_resilience', priority: p++, description: 'Primary mitigation of monsoon flooding and street ponding' });
      if (hasHeat) goals.push({ name: 'heat_reduction', priority: p++, description: 'Secondary microclimatic urban heat island reduction' });
      if (hasBio) goals.push({ name: 'biodiversity', priority: p++, description: 'Ecological habitat restoration and pollinator corridors' });
    } else if (hasBio && (!hasFlood || text.indexOf('bio') < text.indexOf('flood'))) {
      goals.push({ name: 'biodiversity', priority: p++, description: 'Primary biodiversity restoration and native pocket forests' });
      if (hasHeat) goals.push({ name: 'heat_reduction', priority: p++, description: 'Secondary canopy shade and heat mitigation' });
      if (hasFlood) goals.push({ name: 'flood_resilience', priority: p++, description: 'Stormwater infiltration and runoff reduction' });
    } else {
      if (hasFlood) goals.push({ name: 'flood_resilience', priority: p++, description: 'Monsoon flood mitigation' });
      if (hasHeat) goals.push({ name: 'heat_reduction', priority: p++, description: 'Urban heat island cooling' });
      if (hasBio) goals.push({ name: 'biodiversity', priority: p++, description: 'Native biodiversity corridors' });
    }

    if (goals.length === 0) {
      goals.push({ name: 'flood_resilience', priority: 1, description: 'Monsoon stormwater resilience' });
      goals.push({ name: 'heat_reduction', priority: 2, description: 'Urban canopy cooling' });
      goals.push({ name: 'biodiversity', priority: 3, description: 'Urban biodiversity stepping stones' });
    }

    const budgetFormatted = budget >= 10000000 ? `₹${(budget / 10000000).toFixed(1)} Cr` : `₹${(budget / 100000).toFixed(0)} Lakh`;

    return {
      naturalLanguagePrompt: prompt,
      goals,
      constraints: {
        budget_inr: budget,
        demolition_allowed: !noDemolition,
        preserve_roads: true,
        prioritize_native_species: true
      },
      parsedSummary: `Compiled ${goals.length} prioritized goals within ${budgetFormatted} budget cap (${noDemolition ? 'No demolition permitted' : 'Standard constraints'}).`,
      tradeoffAnalysis: `Allocated maximum budget toward highest priority (${goals[0]?.name.replace('_', ' ')}) while preserving minimum baseline coverage for secondary objectives.`
    };
  }
}
