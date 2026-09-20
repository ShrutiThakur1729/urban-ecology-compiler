'use client';

import React from 'react';
import { X, Database, ShieldCheck, Calendar, Cpu, AlertTriangle } from 'lucide-react';
import { MetricWithProvenance } from '@/types/provenance';

interface DataProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricWithProvenance<any> | null;
}

export const DataProvenanceModal: React.FC<DataProvenanceModalProps> = ({
  isOpen,
  onClose,
  metric
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700/80 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Data Provenance & Telemetry Lineage</h3>
              <p className="text-[11px] text-slate-400">Scientific observation transparency & metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {metric ? (
          <div className="space-y-3">
            {/* Metric Title & Category Badge */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">{metric.name}</span>
                <span className="text-sm font-mono font-bold text-emerald-400">{metric.formattedValue}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                  metric.provenance.category === 'OBSERVED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : metric.provenance.category === 'DERIVED'
                    ? 'bg-sky-950 text-sky-300 border-sky-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                {metric.provenance.category}
              </span>
            </div>

            {/* Lineage Details */}
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Primary Sensor / Source</span>
                </div>
                <div className="text-slate-200 font-sans text-xs">{metric.provenance.source}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span>Observation / Calculation Date</span>
                </div>
                <div className="text-slate-200">{metric.provenance.date}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Calculation Methodology</span>
                </div>
                <div className="text-slate-300 font-sans text-xs leading-relaxed">{metric.provenance.method}</div>
              </div>

              {metric.description && (
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] font-sans text-slate-400">
                  {metric.description}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              The Urban Ecology Compiler enforces rigorous scientific categorization across three tiers:
            </p>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
                <span className="font-bold font-mono">GREEN: REAL / OBSERVED</span>
                <p className="text-[11px] text-slate-300 pt-0.5">
                  Direct physical telemetry: Copernicus Sentinel-2 multispectral bands, OpenStreetMap vector coordinates, Open-Meteo climate records, and SRTM DEM elevation.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-800/40 text-sky-200">
                <span className="font-bold font-mono">BLUE: DERIVED METRICS</span>
                <p className="text-[11px] text-slate-300 pt-0.5">
                  Deterministic geospatial formulas: NDVI vegetation coverage, imperviousness percentage, terrain slope gradient, and runoff vulnerability index.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200">
                <span className="font-bold font-mono">ORANGE: MODELED SCENARIOS</span>
                <p className="text-[11px] text-slate-300 pt-0.5">
                  Future hypothetical scenario simulations: Rain garden placements, tree canopy corridors, CPWD cost models, and stormwater interception liters.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
        >
          Close Lineage Inspector
        </button>
      </div>
    </div>
  );
};
