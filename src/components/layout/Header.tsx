'use client';

import React from 'react';
import { Sparkles, MapPin, Layers, RefreshCw, Compass, ShieldCheck, Database, Loader2 } from 'lucide-react';
import { AppPhase } from '@/types/geo';

interface HeaderProps {
  currentLocationName?: string;
  onOpenLocationSearch: () => void;
  onLoadDemoSite: () => void;
  isAnalyzing: boolean;
  isCompiling: boolean;
  isDemoData: boolean;
  analysisStatus: 'IDLE' | 'LOCATING' | 'ANALYZING' | 'READY';
  onOpenProvenanceModal: () => void;
  appPhase?: AppPhase;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocationName,
  onOpenLocationSearch,
  onLoadDemoSite,
  isAnalyzing,
  isCompiling,
  isDemoData,
  analysisStatus,
  onOpenProvenanceModal,
  appPhase = 'DASHBOARD'
}) => {
  const isMinimal = appPhase === 'SEARCH';

  return (
    <header className="h-16 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 relative shrink-0">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base md:text-lg tracking-tight text-slate-100 flex items-center gap-1.5">
              <span>URBAN ECOLOGY</span>
              <span className="text-emerald-400 font-mono text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                COMPILER
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Give a city its requirements. We compile a feasible ecological plan.
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Status Pill */}
        {analysisStatus !== 'IDLE' && analysisStatus !== 'READY' && (
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] font-mono animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
            <span>{analysisStatus === 'LOCATING' ? 'LOCATING SITE...' : 'ANALYZING TELEMETRY...'}</span>
          </div>
        )}

        {/* Location Button (When location is active) */}
        {currentLocationName && !isMinimal && (
          <button
            onClick={onOpenLocationSearch}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition shadow-sm group"
            title="Search or select a new urban site"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[140px] sm:max-w-[220px] font-semibold text-slate-100">
              {currentLocationName}
            </span>
            <span className="text-[10px] text-emerald-400 underline decoration-dotted hidden sm:inline">
              Change
            </span>
          </button>
        )}

        {/* Demo Preset Button */}
        <button
          onClick={onLoadDemoSite}
          disabled={isAnalyzing || isCompiling}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition"
          title="Load pre-compiled Thane urban demonstration"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Demo Plan</span>
        </button>

        {/* Provenance Badge (Always accessible or prominent in DASHBOARD) */}
        {(appPhase === 'DASHBOARD' || isDemoData) && (
          <button
            onClick={onOpenProvenanceModal}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition ${
              isDemoData
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/50'
            }`}
            title="View raw data sources, sensors, and observation methods"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">
              {isDemoData ? 'DEMO DATA' : 'LIVE TELEMETRY'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

