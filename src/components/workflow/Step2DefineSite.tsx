'use client';

import React from 'react';
import {
  Sparkles,
  PenTool,
  Trash2,
  Undo2,
  CheckCircle2,
  ArrowRight,
  X,
  Check
} from 'lucide-react';
import { SelectedLocation, SelectedAnalysisArea } from '@/types/geo';
import { computePolygonStats } from '@/lib/geo/geometryUtils';

interface Step2DefineSiteProps {
  location: SelectedLocation;
  analysisArea: SelectedAnalysisArea | null;
  isDrawing: boolean;
  drawingPointCount: number;
  onUseSuggestedArea: () => void;
  onStartDrawing: () => void;
  onFinishDrawing: () => void;
  onCancelDrawing: () => void;
  onClearArea: () => void;
  onUndoPoint?: () => void;
  onConfirmSite: () => void;
}

export const Step2DefineSite: React.FC<Step2DefineSiteProps> = ({
  location,
  analysisArea,
  isDrawing,
  drawingPointCount,
  onUseSuggestedArea,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
  onClearArea,
  onUndoPoint,
  onConfirmSite
}) => {
  const polygon = analysisArea?.polygon;
  const stats = polygon ? computePolygonStats(polygon) : null;
  const areaHa = stats ? stats.areaHectares.toFixed(2) : (polygon?.properties?.areaHectares ? polygon.properties.areaHectares.toFixed(2) : '0.00');
  const perimeterKm = stats ? stats.perimeterKilometers.toFixed(2) : (polygon?.properties?.perimeterMeters ? (polygon.properties.perimeterMeters / 1000).toFixed(2) : '0.00');
  const vertexCount = stats ? stats.vertexCount : (polygon?.geometry?.coordinates?.[0]?.length ? polygon.geometry.coordinates[0].length - 1 : 0);

  return (
    <>
      {/* ── Top Single Toolbar ── */}
      <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto z-30 pointer-events-auto">
        <div className="flex flex-col items-center gap-2">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 flex items-center gap-1.5 flex-wrap justify-center">
            {/* Use Suggested Area */}
            <button
              type="button"
              onClick={onUseSuggestedArea}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                analysisArea?.source === 'SUGGESTED' && !isDrawing
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Use Suggested Area</span>
            </button>

            {/* Draw Custom Boundary / Cancel Drawing */}
            {isDrawing ? (
              <button
                type="button"
                onClick={onCancelDrawing}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900 transition shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Drawing</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartDrawing}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  analysisArea?.source === 'DRAWN'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-500" />
                <span>Draw Custom Boundary</span>
              </button>
            )}

            {/* Clear */}
            <button
              type="button"
              disabled={!analysisArea && !isDrawing}
              onClick={onClearArea}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 transition border border-transparent disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            {/* Undo point */}
            {isDrawing && onUndoPoint && (
              <button
                type="button"
                onClick={onUndoPoint}
                disabled={drawingPointCount === 0}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 disabled:opacity-40"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}

            {/* Complete boundary button if >= 3 points */}
            {isDrawing && drawingPointCount >= 3 && (
              <button
                type="button"
                onClick={onFinishDrawing}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Complete Boundary</span>
              </button>
            )}
          </div>

          {/* Simple Drawing Instructions & Status (Requirement 7) */}
          {isDrawing && (
            <div className="px-4 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs flex items-center gap-3 shadow-lg border border-slate-700/80 animate-fade-in">
              <span>Click points on the map to define your urban site.</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="font-mono text-emerald-300 font-bold">
                {drawingPointCount} {drawingPointCount === 1 ? 'point' : 'points'} placed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Single Contextual Selected Site Card (Requirement 6) ── */}
      {!isDrawing && analysisArea && (
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-auto sm:top-20 sm:left-auto sm:right-6 sm:w-80 z-30 pointer-events-auto animate-slide-up">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Selected Site</span>
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-tight">
                  {location.name}
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                {analysisArea.source}
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Area</span>
                <span className="font-bold text-emerald-900 font-mono text-sm">{areaHa} ha</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Perimeter</span>
                <span className="font-bold text-slate-800 font-mono">{perimeterKm} km</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Vertices</span>
                <span className="font-bold text-slate-800 font-mono">{vertexCount}</span>
              </div>
            </div>

            {/* ONLY ONE Confirm Site Button (No duplicate) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onConfirmSite}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 transition"
              >
                <span>Confirm Site</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
