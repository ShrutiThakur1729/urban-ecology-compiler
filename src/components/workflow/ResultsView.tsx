'use client';

import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Sparkles,
  TreePine,
  Droplets,
  Database,
  Columns2
} from 'lucide-react';
import { OptimizationResult, ScenarioType } from '@/types/scenarios';
import { CandidateInterventionFeature } from '@/types/interventions';
import { SitePolygon } from '@/types/geo';
import { computeImpact, fmtHa, fmtINR } from '@/lib/geo/impact';

interface ResultsViewProps {
  optimizationResult: OptimizationResult | null;
  activeScenarioType: ScenarioType;
  onSelectScenario: (type: ScenarioType) => void;
  interventions: CandidateInterventionFeature[];
  onHighlightIntervention: (id: string) => void;
  selectedInterventionId: string | null;
  onOpenProvenance: () => void;
  onToggleCompare: () => void;
  isCompareActive: boolean;
  sitePolygon?: SitePolygon | null;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  optimizationResult,
  activeScenarioType,
  onSelectScenario,
  interventions,
  onHighlightIntervention,
  selectedInterventionId,
  onOpenProvenance,
  onToggleCompare,
  isCompareActive,
  sitePolygon
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [showAllInterventions, setShowAllInterventions] = useState(true);

  // Scenarios list with labels and icons
  const scenarios = [
    {
      type: 'BALANCED' as ScenarioType,
      label: 'Balanced',
      badge: 'Recommended',
      icon: TreePine,
      color: 'text-emerald-700'
    },
    {
      type: 'FLOOD_FIRST' as ScenarioType,
      label: 'Flood-First',
      badge: 'Monsoon Sponge',
      icon: Droplets,
      color: 'text-sky-700'
    },
    {
      type: 'BIODIVERSITY_FIRST' as ScenarioType,
      label: 'Biodiversity-First',
      badge: 'Habitat Corridor',
      icon: Sparkles,
      color: 'text-teal-700'
    }
  ];

  // Active scenario details from optimization result
  const activeScenarioObj = optimizationResult
    ? activeScenarioType === 'FLOOD_FIRST'
      ? optimizationResult.scenarios.floodFirst
      : activeScenarioType === 'BIODIVERSITY_FIRST'
      ? optimizationResult.scenarios.biodiversityFirst
      : optimizationResult.scenarios.balanced
    : null;

  // Real geometry-derived impact
  const impact = sitePolygon ? computeImpact(sitePolygon as any, interventions as any) : null;

  // Impact metrics cards
  const impactMetrics = [
    {
      label: 'Green Cover',
      value: impact ? fmtHa(impact.greenCoverHa) : '+3.8 ha',
      sub: 'Canopy & forest expansion',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Surface Temp',
      value: impact ? `${impact.surfaceCoolingC.toFixed(1)}°C` : '-2.1°C',
      sub: 'Urban heat island reduction',
      color: 'text-amber-700',
      bg: 'bg-amber-50'
    },
    {
      label: 'Stormwater',
      value: impact ? `${impact.runoffReductionPct.toFixed(0)}% (${Math.round(impact.storageM3)} m³)` : '+45% (120 m³)',
      sub: 'Runoff reduction & detention',
      color: 'text-sky-700',
      bg: 'bg-sky-50'
    },
    {
      label: 'Habitat Share',
      value: impact ? `${impact.habitatSharePct.toFixed(1)}%` : '18.4%',
      sub: 'Of site area as ecological habitat',
      color: 'text-teal-700',
      bg: 'bg-teal-50'
    },
    {
      label: 'Est. Cost',
      value: impact ? fmtINR(impact.costINR) : (activeScenarioObj ? `₹${(activeScenarioObj.totalCostInr / 100000).toFixed(1)} lakh` : '₹44.8 lakh'),
      sub: 'Modeled public works allocation',
      color: 'text-slate-900',
      bg: 'bg-slate-50'
    }
  ];

  return (
    <>
      {/* ── Top Scenario Selector Bar ── */}
      <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-30 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl p-1.5 flex items-center gap-1.5 flex-wrap justify-center">
          {scenarios.map((sc) => {
            const isActive = activeScenarioType === sc.type;
            const Icon = sc.icon;

            return (
              <button
                key={sc.type}
                type="button"
                onClick={() => onSelectScenario(sc.type)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : sc.color}`} />
                <span>{sc.label}</span>
                {sc.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono font-semibold ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-100'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {sc.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={onToggleCompare}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              isCompareActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Before / After</span>
          </button>
        </div>
      </div>

      {/* ── Collapsible Interventions Panel on Right ── */}
      <div className="absolute top-20 right-4 sm:right-6 w-80 sm:w-96 max-h-[calc(100vh-210px)] z-30 pointer-events-auto flex flex-col animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Interventions ({interventions.length})
                </h4>
                <p className="text-[10px] text-slate-500">
                  Click to inspect & zoom on map
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAllInterventions(!showAllInterventions)}
                className="text-[10px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
              >
                {showAllInterventions ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{showAllInterventions ? 'Show All' : 'Dimmed'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                {isPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Breakdown by type */}
          {impact && impact.breakdown.length > 0 && (
            <div className="p-3 bg-slate-50/80 border-b border-slate-100 space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                Type Breakdown
              </div>
              <div className="grid grid-cols-1 gap-1">
                {impact.breakdown.map((b) => (
                  <div key={b.type} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-white border border-slate-200">
                    <span className="font-semibold text-slate-700">{b.label} <span className="text-[10px] text-slate-500 font-mono">×{b.count}</span></span>
                    <span className="font-mono font-bold text-emerald-800">{b.areaHa > 0 ? fmtHa(b.areaHa) : `${b.lengthKm.toFixed(2)} km`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intervention Cards List */}
          {isPanelOpen && (
            <div className="p-3 overflow-y-auto space-y-2 max-h-[360px]">
              {interventions.map((inv) => {
                const isSelected = selectedInterventionId === inv.id;
                const colorHex = inv.properties?.colorHex || '#10b981';
                const areaHa = inv.properties?.areaSqMeters
                  ? `${(inv.properties.areaSqMeters / 10000).toFixed(1)} ha`
                  : null;
                const lengthM = inv.properties?.lengthMeters
                  ? `${(inv.properties.lengthMeters / 1000).toFixed(1)} km`
                  : null;
                const costLakhs = inv.properties?.estimatedCostInr
                  ? `₹${(inv.properties.estimatedCostInr / 100000).toFixed(1)}L`
                  : null;

                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => onHighlightIntervention(inv.id)}
                    className={`w-full text-left p-3 rounded-xl border transition group flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-sm'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 shadow-sm"
                      style={{ backgroundColor: colorHex }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {inv.name}
                        </span>
                        {costLakhs && (
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {costLakhs}
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                        {areaHa && <span>Area: {areaHa}</span>}
                        {lengthM && <span>Length: {lengthM}</span>}
                        {inv.properties?.coolingImpactCelsius && (
                          <span className="text-amber-700">
                            -{inv.properties.coolingImpactCelsius}°C cooling
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Impact Summary (Modeled Estimates) Floating Bar ── */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-4xl z-20 pointer-events-auto animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Impact Summary
              </span>
              <span
                className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider cursor-help"
                title={
                  impact
                    ? `Baseline Runoff C: ${impact.assumptions.baselineRunoffC}\nDesign Storm: ${impact.assumptions.designStormMm} mm\nCooling: ${impact.assumptions.coolingCPerFraction}°C per 1.0 canopy fraction\nCooling Cap: ${impact.assumptions.coolingCapC}°C`
                    : 'Modeled estimates based on rational method and empirical canopy cooling'
                }
              >
                Modeled estimates
              </span>
              {impact && impact.unclassified > 0 && (
                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  ⚠️ {impact.unclassified} feature{impact.unclassified > 1 ? 's' : ''} had an unknown type
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenProvenance}
              className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
              title="Inspect raw telemetry, sensors, and observation methods"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data Provenance</span>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {impactMetrics.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border border-slate-200/80 ${m.bg} flex flex-col justify-between`}
              >
                <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  {m.label}
                </div>
                <div className={`text-base sm:text-lg font-black font-mono mt-1 ${m.color}`}>
                  {m.value}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
