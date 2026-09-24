'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  TreePine,
  ThermometerSnowflake,
  Flower2,
  Droplets,
  Wind,
  Check,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

export interface PriorityOption {
  id: string;
  name: string;
  desc: string;
  icon: any;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    id: 'flood_resilience',
    name: 'Flood resilience',
    desc: 'Reduce flood risk and improve stormwater drainage',
    icon: ShieldAlert
  },
  {
    id: 'urban_canopy',
    name: 'Urban canopy',
    desc: 'Increase tree coverage and native shading',
    icon: TreePine
  },
  {
    id: 'heat_reduction',
    name: 'Heat reduction',
    desc: 'Cool urban heat islands with microclimate buffers',
    icon: ThermometerSnowflake
  },
  {
    id: 'biodiversity',
    name: 'Biodiversity',
    desc: 'Support native species and pollinator stepping stones',
    icon: Flower2
  },
  {
    id: 'stormwater_management',
    name: 'Stormwater management',
    desc: 'Infiltrate rainwater naturally via bioswales and basins',
    icon: Droplets
  }
];

interface Step3SetPrioritiesProps {
  onCompile: (
    priorities: string[],
    budgetInr: number,
    constraints: { avoidDemolition: boolean; focusPublicSpaces: boolean },
    promptText: string
  ) => void;
  isCompiling: boolean;
}

export const Step3SetPriorities: React.FC<Step3SetPrioritiesProps> = ({
  onCompile,
  isCompiling
}) => {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([
    'flood_resilience',
    'urban_canopy',
    'biodiversity'
  ]);
  const [prompt, setPrompt] = useState<string>(
    'Reduce monsoon flooding first, then heat, increase biodiversity, and keep the budget below ₹50 lakh.'
  );
  const [budgetLakhs, setBudgetLakhs] = useState<number>(50);
  const [avoidDemolition, setAvoidDemolition] = useState<boolean>(true);
  const [focusPublicSpaces, setFocusPublicSpaces] = useState<boolean>(true);

  const togglePriority = (id: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCompileClick = () => {
    onCompile(selectedPriorities, budgetLakhs * 100000, {
      avoidDemolition,
      focusPublicSpaces
    }, prompt);
  };

  const formattedBudget =
    budgetLakhs >= 100
      ? `₹${(budgetLakhs / 100).toFixed(1)} crore`
      : `₹${budgetLakhs} lakh`;

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-slate-900/35 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center pointer-events-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-3xl w-full p-6 sm:p-8 animate-slide-up space-y-6">
        {/* Title */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-800">
            Step 03 · Objectives
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            SET PRIORITIES
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose what matters for your urban area and let the compiler generate a compliant spatial plan.
          </p>
        </div>

        {/* ── Visual Priority Cards / Chips (Section 8) ── */}
        <div>
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 font-mono">
            Select Core Objectives
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PRIORITY_OPTIONS.map((item) => {
              const isSelected = selectedPriorities.includes(item.id);
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => togglePriority(item.id)}
                  className={`text-left p-3.5 rounded-2xl border transition flex items-start gap-3 group ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-600 shadow-sm'
                      : 'bg-slate-50/80 hover:bg-white border-slate-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isSelected
                        ? 'bg-emerald-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.name}
                      </h4>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Natural Language Input (Section 8) ── */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between font-mono">
            <span>Natural-Language Objective</span>
            <span className="text-[10px] text-emerald-800 font-semibold normal-case">AI Fine-Tuning</span>
          </label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Reduce monsoon flooding first, then heat, increase biodiversity, and keep the budget below ₹50 lakh."
            className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 leading-relaxed resize-none bg-slate-50/60 focus:bg-white transition"
          />
        </div>

        {/* ── Additional Constraints ── */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Budget Range */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Budget Constraint</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg text-xs">
                {formattedBudget}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={budgetLakhs}
              onChange={(e) => setBudgetLakhs(Number(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>₹10 lakh</span>
              <span>₹50 lakh</span>
              <span>₹5 crore</span>
            </div>
          </div>

          {/* Demolition & Public Space Toggles */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-center">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Avoid Demolition</div>
                <div className="text-[10px] text-slate-500">Zero destruction of existing buildings</div>
              </div>
              <input
                type="checkbox"
                checked={avoidDemolition}
                onChange={(e) => setAvoidDemolition(e.target.checked)}
                className="rounded accent-emerald-700 w-4 h-4 cursor-pointer"
              />
            </label>

            <div className="h-px bg-slate-200" />

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-800">Focus on Public Spaces</div>
                <div className="text-[10px] text-slate-500">Prioritize municipal verges and corridors</div>
              </div>
              <input
                type="checkbox"
                checked={focusPublicSpaces}
                onChange={(e) => setFocusPublicSpaces(e.target.checked)}
                className="rounded accent-emerald-700 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* ── Primary Action Button ── */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>{selectedPriorities.length} priorities selected</span>
          </div>

          <button
            type="button"
            disabled={isCompiling || selectedPriorities.length === 0}
            onClick={handleCompileClick}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/25 transition disabled:opacity-50 transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>COMPILE ECOLOGICAL PLAN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
