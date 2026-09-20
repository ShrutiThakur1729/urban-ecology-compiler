'use client';

import React from 'react';
import { MapPin, PenTool, Square, ArrowLeft, Sparkles, Compass } from 'lucide-react';
import { SelectedLocation } from '@/types/geo';

interface LocationCardProps {
  location: SelectedLocation;
  onStartDrawing: () => void;
  onUseSuggestedArea: () => void;
  onChangeLocation: () => void;
  className?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onStartDrawing,
  onUseSuggestedArea,
  onChangeLocation,
  className = ''
}) => {
  return (
    <div className={`floating-glass-card p-5 max-w-md w-full animate-slide-up mobile-bottom-sheet ${className}`}>
      {/* Header with location status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mt-0.5">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-400">
                Site Selected
              </span>
              {location.placeType && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {location.placeType}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100 leading-tight mt-0.5">
              {location.name}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
              {location.formattedAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Action Options */}
      <div className="space-y-2.5 mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
          Select Analysis Area
        </div>

        {/* Option 1: Draw Custom Site Area */}
        <button
          type="button"
          onClick={onStartDrawing}
          className="w-full text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                Draw Custom Area
              </div>
              <div className="text-[11px] text-slate-400">
                Click points on map to delineate site polygon
              </div>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-medium">Draw →</span>
        </button>

        {/* Option 2: Use Suggested Area */}
        <button
          type="button"
          onClick={onUseSuggestedArea}
          className="w-full text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/50 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 group-hover:scale-105 transition">
              <Square className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">
                Use Suggested Catchment (~115 Ha)
              </div>
              <div className="text-[11px] text-slate-400">
                Auto-generate standard urban ecological bounds
              </div>
            </div>
          </div>
          <span className="text-xs text-sky-400 font-medium">Use →</span>
        </button>
      </div>

      {/* Change Location Button */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={onChangeLocation}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Location</span>
        </button>

        <span className="text-[10px] font-mono text-slate-500">
          [{location.center[0].toFixed(4)}, {location.center[1].toFixed(4)}]
        </span>
      </div>
    </div>
  );
};
