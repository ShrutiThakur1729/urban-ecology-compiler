'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CompareTabs, CompareMode } from '@/components/map/GeoOverlay';

export type ComparisonMode = CompareMode;

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
  splitPercent: _splitPercent,
  onChangeSplitPercent,
  onClose,
  className = ''
}) => {
  return (
    <div
      className={`absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[92%] max-w-[400px] ${className}`}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800 tracking-tight">Before / After Comparison</span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close comparison panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <CompareTabs
          mode={mode}
          onChange={(newMode) => {
            onChangeMode(newMode);
            if (newMode === 'split') {
              onChangeSplitPercent(50);
            }
          }}
        />
      </div>
    </div>
  );
};
