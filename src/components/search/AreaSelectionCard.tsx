'use client';

import React from 'react';
import { Sparkles, RefreshCw, ArrowLeft, CheckCircle2, Loader2, BarChart2, ShieldCheck } from 'lucide-react';
import { SelectedLocation, SelectedAnalysisArea } from '@/types/geo';
import { siteStats } from '@/lib/geo/impact';

interface AreaSelectionCardProps {
  location: SelectedLocation;
  area: SelectedAnalysisArea;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onRedraw: () => void;
  onChangeLocation: () => void;
  className?: string;
}

export const AreaSelectionCard: React.FC<AreaSelectionCardProps> = ({
  location,
  area,
  isAnalyzing,
  onAnalyze,
  onRedraw,
  onChangeLocation,
  className = ''
}) => {
  const props = area.polygon.properties;
  const stats = area?.polygon ? siteStats(area.polygon as any) : null;
  const hectares = stats ? stats.areaHa.toFixed(1) : (props?.areaHectares ? props.areaHectares.toFixed(1) : '—');
  const perimeter = stats ? Math.round(stats.perimKm * 1000).toLocaleString() : (props?.perimeterMeters ? Math.round(props.perimeterMeters).toLocaleString() : '—');
  const sqMeters = stats ? Math.round(stats.areaM2).toLocaleString() : (props?.areaSquareMeters ? Math.round(props.areaSquareMeters).toLocaleString() : '—');

  return (
    <div className={`floating-glass-card p-5 max-w-md w-full animate-slide-up mobile-bottom-sheet ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Site Area Delineated</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 leading-tight mt-0.5">
            {location.name}
          </h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {location.formattedAddress}
          </p>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 uppercase shrink-0">
          {area.source}
        </span>
      </div>

      {/* Area Statistics Grid */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
        <div>
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Area</div>
          <div className="text-base font-bold text-emerald-400 font-mono">{hectares} <span className="text-[10px] text-slate-400">Ha</span></div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Perimeter</div>
          <div className="text-base font-bold text-sky-400 font-mono">{perimeter} <span className="text-[10px] text-slate-400">m</span></div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Surface</div>
          <div className="text-xs font-semibold text-slate-300 font-mono mt-1">{sqMeters} <span className="text-[9px] text-slate-500">m²</span></div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-2 mb-3">
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onAnalyze}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Real Environmental Data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>Analyze Site & Generate Decision Support</span>
            </>
          )}
        </button>
      </div>

      {/* Telemetry data source badges */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 mb-4">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400/70" />
          OSM Overpass · Open-Meteo · SRTM Elevation
        </span>
      </div>

      {/* Secondary Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onChangeLocation}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Location</span>
        </button>

        <button
          type="button"
          disabled={isAnalyzing}
          onClick={onRedraw}
          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition py-1 font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Redraw Polygon</span>
        </button>
      </div>
    </div>
  );
};
