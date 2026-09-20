'use client';

import React, { useState } from 'react';
import { Sparkles, Play, RefreshCw, Sliders, CheckCircle2, ShieldAlert, Zap, HelpCircle } from 'lucide-react';
import { StructuredCompilerPlanRequest, GoalType } from '@/types/compiler';

interface CompilerPanelProps {
  compiledPlan: StructuredCompilerPlanRequest | null;
  onCompile: (prompt: string, budgetInr: number) => void;
  isCompiling: boolean;
}

export const CompilerPanel: React.FC<CompilerPanelProps> = ({
  compiledPlan,
  onCompile,
  isCompiling
}) => {
  const [prompt, setPrompt] = useState(
    "Reduce monsoon flooding first, then heat, increase biodiversity, don't demolish buildings, and keep the budget below ₹50 lakh."
  );
  const [budgetLakhs, setBudgetLakhs] = useState<number>(50);
  const [showJson, setShowJson] = useState(false);

  const samplePrompts = [
    {
      title: 'Monsoon Flood Resilience',
      text: 'Prioritize monsoon flooding and stormwater absorption first, reduce street ponding, add rain gardens and bioswales without demolishing buildings under ₹45 lakh.'
    },
    {
      title: 'Urban Rewilding & Habitat',
      text: 'Maximize biodiversity, plant native Western Ghats Miyawaki pocket forests and pollinator gardens, create shaded tree corridors under ₹35 lakh.'
    },
    {
      title: 'Heat Island & Rooftop Cooling',
      text: 'Cool down the microclimate, install extensive lightweight green roofs on municipal buildings, shaded pedestrian tree corridors, budget ₹25 lakh.'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isCompiling) return;
    onCompile(prompt, budgetLakhs * 100000);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Title / Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Natural-Language Compiler</h2>
            <p className="text-[11px] text-slate-400">Convert environmental intent into spatial constraints</p>
          </div>
        </div>

        {compiledPlan && (
          <button
            onClick={() => setShowJson(!showJson)}
            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            {showJson ? 'Hide JSON' : 'View AST JSON'}
          </button>
        )}
      </div>

      {/* Compiler Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Environmental Objective</span>
            <span className="text-[10px] text-slate-400 font-normal">Natural Language</span>
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Reduce monsoon flooding first, then heat, increase biodiversity, keep budget below ₹50 lakh..."
              className="w-full p-3 rounded-xl glass-input text-xs leading-relaxed resize-none font-sans"
            />
          </div>
        </div>

        {/* Quick Example Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Preset Compiler Scenarios
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sample.text);
                  const lakhMatch = sample.text.match(/₹(\d+)\s*lakh/i);
                  if (lakhMatch) setBudgetLakhs(parseInt(lakhMatch[1], 10));
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition text-left"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Budget & Constraint Sliders */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Budget Cap Constraint</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              ₹{budgetLakhs} Lakh
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={budgetLakhs}
            onChange={(e) => setBudgetLakhs(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>₹5 Lakh (Micro)</span>
            <span>₹50 Lakh (Standard)</span>
            <span>₹1 Crore (Macro)</span>
          </div>
        </div>

        {/* Recompile Primary CTA Button */}
        <button
          type="submit"
          disabled={isCompiling}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg ${
            isCompiling
              ? 'bg-emerald-700 text-emerald-200 cursor-not-allowed compiling-active'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/50 hover:shadow-emerald-900/60'
          }`}
        >
          {isCompiling ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Compiling Spatial Plan...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>COMPILE ECOLOGICAL PLAN</span>
            </>
          )}
        </button>
      </form>

      {/* JSON Schema AST Output (Optional collapsible) */}
      {showJson && compiledPlan && (
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-48">
          <pre>{JSON.stringify(compiledPlan, null, 2)}</pre>
        </div>
      )}

      {/* Parsed Goals & Constraint Breakdown */}
      {compiledPlan && (
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">Parsed Priorities</span>
            <span className="text-[10px] font-mono text-emerald-400">Gemini LLM AST</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {compiledPlan.goals.map((g, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px]">
                  {g.priority}
                </span>
                <span>{g.name.replace('_', ' ').toUpperCase()}</span>
              </span>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            {compiledPlan.parsedSummary}
          </p>
        </div>
      )}
    </div>
  );
};
