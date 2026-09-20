'use client';

import React from 'react';
import { OptimizationResult, ScenarioType, EcologicalScenario } from '@/types/scenarios';
import { Droplets, Thermometer, Trees, ShieldAlert, CheckCircle2, TrendingUp, Info, DollarSign, Layers } from 'lucide-react';
import { MetricWithProvenance } from '@/types/provenance';

interface ScenarioDeckProps {
  optimizationResult: OptimizationResult | null;
  activeScenarioType: ScenarioType;
  onSelectScenario: (type: ScenarioType) => void;
  onInspectProvenance: (metric: MetricWithProvenance<any>) => void;
}

export const ScenarioDeck: React.FC<ScenarioDeckProps> = ({
  optimizationResult,
  activeScenarioType,
  onSelectScenario,
  onInspectProvenance
}) => {
  if (!optimizationResult) return null;

  const scenarios = optimizationResult.scenarios;
  const currentScenario: EcologicalScenario =
    activeScenarioType === 'FLOOD_FIRST'
      ? scenarios.floodFirst
      : activeScenarioType === 'BIODIVERSITY_FIRST'
      ? scenarios.biodiversityFirst
      : scenarios.balanced;

  const impact = currentScenario.impact;

  const impactCards: { label: string; metric: MetricWithProvenance<any>; icon: any; color: string }[] = [
    {
      label: 'Estimated Cost',
      metric: impact.totalEstimatedCostInr,
      icon: DollarSign,
      color: 'text-emerald-400'
    },
    {
      label: 'Stormwater Interception',
      metric: impact.stormwaterRunoffMitigationLiters,
      icon: Droplets,
      color: 'text-sky-400'
    },
    {
      label: 'Microclimate Cooling',
      metric: impact.peakMicroclimateTempReductionC,
      icon: Thermometer,
      color: 'text-amber-400'
    },
    {
      label: 'Canopy Increase',
      metric: impact.canopyIncreasePercent,
      icon: Trees,
      color: 'text-emerald-400'
    },
    {
      label: 'Ecological Connectivity',
      metric: impact.biodiversityConnectivityIndexGain,
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      label: 'Carbon Sequestration',
      metric: impact.annualCo2SequestrationKg,
      icon: Trees,
      color: 'text-teal-400'
    }
  ];

  return (
    <div className="flex flex-col space-y-4">
      {/* Scenario Switcher Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Compiled Scenarios</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
          ORANGE: MODELED
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={() => onSelectScenario('BALANCED')}
          className={`py-2 px-2 rounded-lg text-xs font-medium transition flex flex-col items-center ${
            activeScenarioType === 'BALANCED'
              ? 'bg-slate-800 text-emerald-400 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Balanced</span>
          <span className="text-[9px] font-mono text-slate-400">Multi-benefit</span>
        </button>

        <button
          onClick={() => onSelectScenario('FLOOD_FIRST')}
          className={`py-2 px-2 rounded-lg text-xs font-medium transition flex flex-col items-center ${
            activeScenarioType === 'FLOOD_FIRST'
              ? 'bg-slate-800 text-sky-400 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Flood-First</span>
          <span className="text-[9px] font-mono text-slate-400">Infiltration</span>
        </button>

        <button
          onClick={() => onSelectScenario('BIODIVERSITY_FIRST')}
          className={`py-2 px-2 rounded-lg text-xs font-medium transition flex flex-col items-center ${
            activeScenarioType === 'BIODIVERSITY_FIRST'
              ? 'bg-slate-800 text-pink-400 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Biodiversity</span>
          <span className="text-[9px] font-mono text-slate-400">Rewilding</span>
        </button>
      </div>

      {/* Active Scenario Overview Card */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-100">{currentScenario.title}</h4>
          <span className="text-[10px] font-mono font-semibold text-emerald-400">
            ₹{(currentScenario.totalCostInr / 100000).toFixed(1)} Lakh ({currentScenario.budgetUtilizationPercent}% Budget)
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {currentScenario.description}
        </p>
      </div>

      {/* Modeled Impact Dashboard Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            Modeled Impact Projections (Assumptions Exposed)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {impactCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => onInspectProvenance(card.metric)}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 truncate">{card.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono text-slate-100">
                  {card.metric.formattedValue}
                </div>
                <div className="text-[9px] font-mono text-amber-400 flex items-center justify-between pt-0.5 border-t border-slate-800/60">
                  <span>MODELED</span>
                  <Info className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tradeoffs: Pros & Cons & Assumptions */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
          Tradeoff Analysis & Limitations
        </span>

        <div className="space-y-1">
          {currentScenario.tradeoffs.pros.map((pro, idx) => (
            <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
              <span>{pro}</span>
            </div>
          ))}

          {currentScenario.tradeoffs.cons.map((con, idx) => (
            <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
              <span>{con}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
          * {currentScenario.limitations}
        </p>
      </div>
    </div>
  );
};
