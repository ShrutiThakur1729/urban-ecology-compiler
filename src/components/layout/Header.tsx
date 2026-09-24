'use client';

import React, { useState } from 'react';
import {
  TreePine,
  MapPin,
  Save,
  Check,
  User,
  LogOut,
  ChevronDown,
  Database,
  Loader2,
  Compass,
  Home,
  Sparkles,
  Layers,
  FolderArchive
} from 'lucide-react';
import { AuthUser } from '@/components/auth/AuthModal';

export type MapStyleType = 'light' | 'satellite' | 'dark';

interface HeaderProps {
  currentLocationName?: string;
  onOpenLocationSearch: () => void;
  onLoadDemoSite: () => void;
  isAnalyzing: boolean;
  isCompiling: boolean;
  isDemoData: boolean;
  onOpenProvenanceModal: () => void;
  user: AuthUser | null;
  onSignOut: () => void;
  onReturnToLanding: () => void;
  mapStyle: MapStyleType;
  onChangeMapStyle: (style: MapStyleType) => void;
  onSaveProject?: () => void;
  onOpenProjectLibrary?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocationName,
  onOpenLocationSearch,
  onLoadDemoSite,
  isAnalyzing,
  isCompiling,
  isDemoData,
  onOpenProvenanceModal,
  user,
  onSignOut,
  onReturnToLanding,
  mapStyle,
  onChangeMapStyle,
  onSaveProject,
  onOpenProjectLibrary
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    if (onSaveProject) onSaveProject();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2200);
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* ── Brand Logo & Tagline ── */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onReturnToLanding}
          className="flex items-center space-x-2 text-left group shrink-0"
          title="Return to Public Landing Page"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-600 p-0.5 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0a1c14] rounded-[9px] sm:rounded-[10px] flex items-center justify-center">
              <TreePine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-xs sm:text-base tracking-tight text-slate-900 flex items-center gap-1 sm:gap-1.5">
              <span>Urban Ecology</span>
              <span className="text-emerald-800 font-mono text-[9px] sm:text-[10px] uppercase px-1 sm:px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 font-bold hidden xs:inline">
                Compiler
              </span>
            </div>
          </div>
        </button>

        {/* Home Link */}
        <button
          onClick={onReturnToLanding}
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition ml-2"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
      </div>

      {/* ── Middle: Current Location Pill ── */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
        {currentLocationName ? (
          <button
            onClick={onOpenLocationSearch}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 text-xs font-semibold text-slate-800 transition group shadow-sm min-w-0"
            title="Click to search another location"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate max-w-[85px] xs:max-w-[120px] sm:max-w-[200px]">
              {currentLocationName}
            </span>
            <span className="text-[10px] text-emerald-800 font-mono underline decoration-dotted hidden sm:inline">
              Change
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenLocationSearch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold transition hover:bg-emerald-100"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden xs:inline">Select Location</span>
            <span className="xs:hidden">Location</span>
          </button>
        )}

        {/* Processing Indicator */}
        {(isAnalyzing || isCompiling) && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-mono font-bold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-800" />
            <span>{isAnalyzing ? 'Analyzing Site...' : 'Compiling Plan...'}</span>
          </div>
        )}
      </div>

      {/* ── Right Actions: Map Style, Save Project, Account Menu ── */}
      <div className="flex items-center space-x-1 sm:space-x-2.5 shrink-0">
        {/* Map Style Switcher (Map / Satellite / Dark) */}
        <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => onChangeMapStyle('light')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              mapStyle === 'light'
                ? 'bg-white text-emerald-900 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => onChangeMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              mapStyle === 'satellite'
                ? 'bg-white text-emerald-900 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => onChangeMapStyle('dark')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              mapStyle === 'dark'
                ? 'bg-white text-emerald-900 font-bold shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dark
          </button>
        </div>

        {/* Project Library Button */}
        {onOpenProjectLibrary && (
          <button
            type="button"
            onClick={onOpenProjectLibrary}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-sm"
            title="Open saved projects and library"
          >
            <FolderArchive className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden md:inline">Projects</span>
          </button>
        )}

        {/* Save Project CTA */}
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
            saveSuccess
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
          title="Save project state"
        >
          {saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Save Project</span>
            </>
          )}
        </button>

        {/* Data Provenance Badge */}
        <button
          type="button"
          onClick={onOpenProvenanceModal}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium transition"
          title="View raw sensors and observation methods"
        >
          <Database className="w-3.5 h-3.5 text-emerald-700" />
          <span className="font-mono text-[10px]">{isDemoData ? 'DEMO DATA' : 'TELEMETRY'}</span>
        </button>

        {/* User Account / Demo Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
                {user?.name || 'Demo Planner'}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">
                {user?.isDemo ? 'Judge Demo' : 'Planner'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-2 z-50 animate-slide-up">
              <div className="p-3 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'Shruti Thakur'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {user?.email || 'judge.demo@urban-compiler.ai'}
                </div>
                <div className="mt-1 inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {user?.role || 'Hackathon Demo Mode'}
                </div>
              </div>

              <div className="pt-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLoadDemoSite();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Load Preloaded Demo Catchment</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onReturnToLanding();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>Public Landing Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onSignOut();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
