'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  TreePine,
  Layers,
  Database,
  Satellite
} from 'lucide-react';

interface Step4CompilingProps {
  onComplete?: () => void;
}

const STAGES = [
  {
    title: 'Analyzing site and surroundings',
    desc: 'Reading elevation contours, OSM road networks, and parcel boundaries',
    duration: 900
  },
  {
    title: 'Processing environmental data',
    desc: 'Calculating Sentinel-2 NDVI canopy deficit & Open-Meteo rainfall telemetry',
    duration: 1100
  },
  {
    title: 'Applying your priorities',
    desc: 'Translating goals into mathematical spatial constraints via Gemini',
    duration: 1000
  },
  {
    title: 'Generating spatial interventions',
    desc: 'Synthesizing bioswales, rain gardens, and Miyawaki pocket forests',
    duration: 1200
  },
  {
    title: 'Compiling final plan',
    desc: 'Computing multi-objective Pareto trade-offs & budgetary allocation',
    duration: 800
  }
];

export const Step4Compiling: React.FC<Step4CompilingProps> = ({ onComplete }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    let accumulatedTime = 0;
    const timers: NodeJS.Timeout[] = [];

    STAGES.forEach((stage, idx) => {
      accumulatedTime += stage.duration;
      const t = setTimeout(() => {
        setCurrentStageIndex(idx + 1);
        if (idx === STAGES.length - 1 && onComplete) {
          onComplete();
        }
      }, accumulatedTime);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-30 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 pointer-events-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full p-6 sm:p-10 animate-fade-in flex flex-col md:flex-row items-center gap-8">
        {/* Left: Stages Checklist */}
        <div className="flex-1 w-full space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span>Ecological Compiler Active</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Compiling your ecological plan...
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              AI is analyzing your site, processing real environmental data, and generating interventions.
            </p>
          </div>

          {/* Staged Checklist */}
          <div className="space-y-3.5">
            {STAGES.map((stage, idx) => {
              const isDone = currentStageIndex > idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3.5 p-3 rounded-2xl transition border ${
                    isCurrent
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-sm'
                      : isDone
                      ? 'bg-slate-50/70 border-slate-200/80 text-slate-700'
                      : 'border-transparent text-slate-400 opacity-60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 border-2 border-emerald-700 flex items-center justify-center">
                        <Loader2 className="w-3 h-3 text-emerald-800 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-emerald-950 font-extrabold'
                          : isDone
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {stage.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {stage.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            <span>
              Using satellite data, real-world information, and AI to design a greener, more resilient plan for your site.
            </span>
          </div>
        </div>

        {/* Right: Isometric Layered Graphic */}
        <div className="w-full md:w-[320px] aspect-square rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-50 relative shrink-0">
          <img
            src="/images/isometric_eco_layers.jpg"
            alt="Layered ecological city data"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Multi-Layer Spatial Stack
            </span>
            <span className="text-xs font-bold">
              Canopy · Hydrology · Solar · Soil
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
