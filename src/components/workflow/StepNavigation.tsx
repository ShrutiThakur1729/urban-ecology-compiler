'use client';

import React from 'react';
import { MapPin, PenTool, Sliders, Sparkles, Check, ChevronRight } from 'lucide-react';

export type WorkflowStep = 1 | 2 | 3 | 4;

interface StepNavigationProps {
  currentStep: WorkflowStep;
  onSelectStep: (step: WorkflowStep) => void;
  canNavigateToStep?: (step: WorkflowStep) => boolean;
  className?: string;
  isCompact?: boolean;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onSelectStep,
  canNavigateToStep = () => true,
  className = '',
  isCompact = false
}) => {
  const steps = [
    {
      number: 1,
      id: '01',
      title: 'Location',
      desc: 'Search and explore any area',
      icon: MapPin
    },
    {
      number: 2,
      id: '02',
      title: 'Define Site',
      desc: 'Select or draw your area',
      icon: PenTool
    },
    {
      number: 3,
      id: '03',
      title: 'Set Priorities',
      desc: 'Choose what matters',
      icon: Sliders
    },
    {
      number: 4,
      id: '04',
      title: 'Compile Plan',
      desc: 'Get AI-powered interventions',
      icon: Sparkles
    }
  ];

  if (isCompact) {
    // Horizontal compact stepper (mobile / top-bar)
    return (
      <div className={`flex items-center justify-between w-full px-2 py-2 bg-white/95 border-b border-slate-200/90 text-xs ${className}`}>
        {steps.map((s, idx) => {
          const isActive = currentStep === s.number;
          const isDone = currentStep > s.number;
          const isAllowed = canNavigateToStep(s.number as WorkflowStep);

          return (
            <React.Fragment key={s.number}>
              <button
                type="button"
                disabled={!isAllowed}
                onClick={() => onSelectStep(s.number as WorkflowStep)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                  isActive
                    ? 'bg-emerald-800 text-white font-bold'
                    : isDone
                    ? 'text-emerald-800 hover:bg-emerald-50'
                    : 'text-slate-400 hover:text-slate-600'
                } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-emerald-800'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                </div>
                <span className={`${isActive ? 'inline' : 'hidden sm:inline'} font-semibold text-[11px] truncate max-w-[85px]`}>
                  {s.title}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div className="w-4 h-px bg-slate-200 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Vertical desktop sidebar stepper
  return (
    <aside className={`w-[240px] xl:w-[260px] bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 select-none z-10 ${className}`}>
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-emerald-800">
            Guided Workflow
          </span>
          <h3 className="text-xs font-semibold text-slate-500 mt-0.5">
            4-step ecological synthesis
          </h3>
        </div>

        <div className="space-y-3">
          {steps.map((s) => {
            const isActive = currentStep === s.number;
            const isDone = currentStep > s.number;
            const isAllowed = canNavigateToStep(s.number as WorkflowStep);

            return (
              <button
                key={s.number}
                type="button"
                disabled={!isAllowed}
                onClick={() => onSelectStep(s.number as WorkflowStep)}
                className={`w-full text-left p-3 rounded-2xl transition border flex items-start gap-3 group ${
                  isActive
                    ? 'bg-emerald-50/80 border-emerald-500/60 shadow-sm'
                    : isDone
                    ? 'bg-white border-slate-200/70 hover:border-emerald-300'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                } ${!isAllowed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isActive
                        ? 'text-emerald-950 font-extrabold'
                        : isDone
                        ? 'text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {s.desc}
                  </div>
                </div>

                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 self-center shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workflow tips footer */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-emerald-950">
        <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-800 mb-1">
          Compiler Engine
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Spatial interventions respect real elevation, runoff trajectories, and building footprints.
        </p>
      </div>
    </aside>
  );
};
