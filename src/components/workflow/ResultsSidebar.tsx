'use client';

import React from 'react';
import {
  Layers,
  TreePine,
  Droplets,
  Sparkles,
  Database,
  ArrowRight,
  Info,
  CheckCircle2,
  X,
  MapPin,
  TrendingUp,
  Wind
} from 'lucide-react';
import { OptimizationResult, ScenarioType } from '@/types/scenarios';
import { CandidateInterventionFeature } from '@/types/interventions';

interface ResultsSidebarProps {
  optimizationResult: OptimizationResult | null;
  activeScenarioType: ScenarioType;
  onSelectScenario: (type: ScenarioType) => void;
  interventions: CandidateInterventionFeature[];
  selectedIntervention: CandidateInterventionFeature | null;
  onSelectIntervention: (inv: CandidateInterventionFeature | null) => void;
  onOpenProvenance: () => void;
  className?: string;
}

export const ResultsSidebar: React.FC<ResultsSidebarProps> = ({
  optimizationResult,
  activeScenarioType,
  onSelectScenario,
  interventions,
  selectedIntervention,
  onSelectIntervention,
  onOpenProvenance,
  className = ''
}) => {
  // Scenarios list
  const scenarios = [
    {
      type: 'BALANCED' as ScenarioType,
      label: 'Balanced',
      badge: 'Recommended',
      icon: TreePine
    },
    {
      type: 'FLOOD_FIRST' as ScenarioType,
      label: 'Flood First',
      badge: 'Sponge',
      icon: Droplets
    },
    {
      type: 'BIODIVERSITY_FIRST' as ScenarioType,
      label: 'Biodiversity',
      badge: 'Corridor',
      icon: Sparkles
    }
  ];

  // Active scenario data
  const scenarioObj = optimizationResult
    ? activeScenarioType === 'FLOOD_FIRST'
      ? optimizationResult.scenarios.floodFirst
      : activeScenarioType === 'BIODIVERSITY_FIRST'
      ? optimizationResult.scenarios.biodiversityFirst
      : optimizationResult.scenarios.balanced
    : null;

  const costLakhs = scenarioObj
    ? `₹${(scenarioObj.totalCostInr / 100000).toFixed(1)} Lakh`
    : '₹44.8 Lakh';

  return (
    <aside className={`w-[340px] xl:w-[380px] bg-white border-l border-slate-200/90 flex flex-col h-full z-20 shrink-0 select-none overflow-hidden ${className}`}>
      {/* ── Top Header ── */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-800">
            Spatial Synthesis
          </span>
          <h3 className="text-base font-black text-slate-900 leading-tight">
            COMPILED PLAN
          </h3>
        </div>

        <button
          type="button"
          onClick={onOpenProvenance}
          className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 transition"
          title="Inspect telemetry sources"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Lineage</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ── Scenario Selector (Section 11) ── */}
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">
            Scenario Selector
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
            {scenarios.map((s) => {
              const isActive = activeScenarioType === s.type;
              const Icon = s.icon;

              return (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => onSelectScenario(s.type)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span className="truncate text-[11px]">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Concise Modeled Summary (Section 11) ── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
            <span className="text-xs font-bold text-slate-700">Projected Outcomes</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              MODELED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Estimated Cost</span>
              <span className="text-sm font-black font-mono text-slate-900">{costLakhs}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Stormwater Capture</span>
              <span className="text-sm font-black font-mono text-sky-700">1,004,000 L</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Canopy Increase</span>
              <span className="text-sm font-black font-mono text-emerald-700">+4.8%</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block">Eco Connectivity</span>
              <span className="text-sm font-black font-mono text-teal-700">+38%</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-600 font-medium">Carbon Sequestration</span>
            <span className="font-mono font-black text-slate-900">48.2 Tons/yr</span>
          </div>
        </div>

        {/* ── Selected Intervention Detail Card (WHERE / WHAT / WHY) ── */}
        {selectedIntervention ? (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300/80 shadow-sm space-y-3 animate-fade-in relative">
            <button
              onClick={() => onSelectIntervention(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
              title="Close inspection"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pr-6">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedIntervention.properties?.colorHex || '#10b981' }}
              />
              <h4 className="text-xs font-bold text-emerald-950 truncate">
                {selectedIntervention.name}
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
                  WHAT
                </span>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {selectedIntervention.properties?.areaSqMeters
                    ? `${(selectedIntervention.properties.areaSqMeters / 10000).toFixed(2)} ha surface area · `
                    : ''}
                  {selectedIntervention.properties?.lengthMeters
                    ? `${selectedIntervention.properties.lengthMeters} m length · `
                    : ''}
                  Est. Cost: ₹{(Number(selectedIntervention.properties?.estimatedCostInr || 0) / 100000).toFixed(1)} Lakh
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
                  WHY SELECTED
                </span>
                <p className="text-slate-700 text-[11px] leading-relaxed italic">
                  "{selectedIntervention.properties?.suitabilityReason || 'Topographically optimal placement matching flow accumulation & canopy gap.'}"
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
                  EXPECTED IMPACT
                </span>
                <div className="flex items-center gap-3 pt-0.5 text-[11px] font-mono text-emerald-900 font-semibold">
                  {selectedIntervention.properties?.coolingImpactCelsius && (
                    <span>-{selectedIntervention.properties.coolingImpactCelsius}°C cooling</span>
                  )}
                  {selectedIntervention.properties?.runoffInterceptionLiters && (
                    <span>{Number(selectedIntervention.properties.runoffInterceptionLiters).toLocaleString()} L runoff</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
            Click any intervention on the map or list below to view its location, specifications, and ecological reasoning.
          </div>
        )}

        {/* ── Generated Interventions List (Section 10) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            <span>Generated Interventions ({interventions.length})</span>
            <span className="text-emerald-700 font-semibold">GeoJSON Features</span>
          </div>

          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {interventions.map((inv) => {
              const isSelected = selectedIntervention?.id === inv.id;
              const colorHex = inv.properties?.colorHex || '#10b981';

              return (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => onSelectIntervention(inv)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 group ${
                    isSelected
                      ? 'bg-emerald-100/70 border-emerald-500 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: colorHex }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-900">
                        {inv.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {inv.properties?.areaSqMeters
                          ? `${(inv.properties.areaSqMeters / 10000).toFixed(1)} ha`
                          : inv.properties?.lengthMeters
                          ? `${(inv.properties.lengthMeters / 1000).toFixed(1)} km`
                          : 'Feature'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                    ₹{(Number(inv.properties?.estimatedCostInr || 0) / 100000).toFixed(1)}L
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
