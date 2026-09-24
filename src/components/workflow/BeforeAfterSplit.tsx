'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, Columns2, X, ArrowLeftRight, Check } from 'lucide-react';

export type ComparisonMode = 'before' | 'after' | 'split';

interface BeforeAfterSplitProps {
  mode: ComparisonMode;
  onChangeMode: (mode: ComparisonMode) => void;
  splitPercent: number; // 0 to 100
  onChangeSplitPercent: (percent: number) => void;
  onClose?: () => void;
  className?: string;
}

export const BeforeAfterSplit: React.FC<BeforeAfterSplitProps> = ({
  mode,
  onChangeMode,
  splitPercent,
  onChangeSplitPercent,
  onClose,
  className = ''
}) => {
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      if (!isDraggingRef.current) return;
      const windowWidth = window.innerWidth;
      const x = Math.max(0, Math.min(e.clientX, windowWidth));
      const newPercent = Math.round((x / windowWidth) * 100);
      onChangeSplitPercent(Math.max(5, Math.min(95, newPercent)));
    },
    [onChangeSplitPercent]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* ── Top Comparison Mode Tabs ── */}
      <div className={`absolute top-14 sm:top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto scale-90 sm:scale-100 origin-top transition-all ${className}`}>
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl p-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              onChangeMode('before');
              onChangeSplitPercent(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              mode === 'before'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Existing Site
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeMode('after');
              onChangeSplitPercent(100);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              mode === 'after'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Compiled Plan
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeMode('split');
              onChangeSplitPercent(50);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'split'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ml-1"
              title="Close Comparison"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Interactive Draggable Split Handle (When in Split View) ── */}
      {mode === 'split' && (
        <div
          ref={containerRef}
          className="absolute inset-y-0 z-20 pointer-events-none w-full"
        >
          {/* Vertical divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-auto"
            style={{ left: `${splitPercent}%` }}
          >
            {/* Draggable Circle Handle */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border-2 border-emerald-700 shadow-2xl flex items-center justify-center cursor-ew-resize hover:scale-110 active:scale-95 transition-transform select-none"
              title="Drag horizontally to compare Before & After"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
            </div>

            {/* Left / Right Badge tags */}
            <div className="absolute top-16 -translate-x-full pr-3 select-none pointer-events-none">
              <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono uppercase font-bold border border-white/20 shadow">
                Baseline Site
              </span>
            </div>
            <div className="absolute top-16 left-0 pl-3 select-none pointer-events-none">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-800/90 backdrop-blur-md text-white text-[10px] font-mono uppercase font-bold border border-emerald-400/40 shadow">
                Compiled Plan
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
