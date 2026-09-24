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
  ThermometerSnowflake,
  ShieldAlert,
  ArrowRight,
  Database,
  ExternalLink,
  Columns2,
  Info,
  DollarSign
} from 'lucide-react';
import { OptimizationResult, ScenarioType } from '@/types/scenarios';
import { CandidateInterventionFeature } from '@/types/interventions';

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
  isCompareActive
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

  // Impact metrics
  const impactMetrics = [
    {
      label: 'Green Cover',
      value: '+3.8 ha',
      sub: 'Canopy & forest expansion',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Surface Temp',
      value: '-2.1°C',
      sub: 'Urban heat island reduction',
      color: 'text-amber-700',
      bg: 'bg-amber-50'
    },
    {
      label: 'Stormwater Absorption',
      value: '+45%',
      sub: 'Runoff captured by bioswales',
      color: 'text-sky-700',
      bg: 'bg-sky-50'
    },
    {
      label: 'Biodiversity Potential',
      value: '+26%',
      sub: 'Pollinator stepping stones',
      color: 'text-teal-700',
      bg: 'bg-teal-50'
    },
    {
      label: 'Estimated Cost',
      value: activeScenarioObj ? `₹${(activeScenarioObj.totalCostInr / 100000).toFixed(1)} lakh` : '₹44.8 lakh',
      sub: 'Public works allocation',
      color: 'text-slate-900',
      bg: 'bg-slate-50'
    }
  ];

  return (
    <>
      {/* ── Top Scenario Selector Bar (Matching Panel 7 in Reference) ── */}
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

          {/* Quick Comparison Toggle Button */}
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

      {/* ── Collapsible Interventions Panel on Right (Matching Panel 7 in Reference) ── */}
      <div className="absolute top-20 right-4 sm:right-6 w-80 sm:w-96 max-h-[calc(100vh-210px)] z-30 pointer-events-auto flex flex-col animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col">
          {/* Panel Header */}
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

                      {inv.properties?.suitabilityReason && (
                        <p className="text-[10px] text-slate-600 mt-1 line-clamp-1 italic">
                          "{inv.properties.suitabilityReason}"
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Impact Summary (Modeled Estimates) Floating Bar (Matching Reference Panel 7) ── */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-4xl z-20 pointer-events-auto animate-slide-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Impact Summary
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Modeled Estimates
              </span>
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
