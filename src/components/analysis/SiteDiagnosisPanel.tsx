'use client';

import React from 'react';
import { SiteAnalysisData } from '@/types/analysis';
import { MetricWithProvenance } from '@/types/provenance';
import { Activity, Droplets, Thermometer, Trees, ShieldAlert, CheckCircle, Info, Layers } from 'lucide-react';

interface SiteDiagnosisPanelProps {
  analysis: SiteAnalysisData | null;
  isAnalyzing: boolean;
  onInspectProvenance: (metric: MetricWithProvenance<any>) => void;
}

export const SiteDiagnosisPanel: React.FC<SiteDiagnosisPanelProps> = ({
  analysis,
  isAnalyzing,
  onInspectProvenance
}) => {
  if (isAnalyzing) {
    return (
      <div className="p-6 rounded-2xl glass-panel flex flex-col items-center justify-center space-y-3 text-center h-64">
        <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
        <div className="text-xs font-semibold text-slate-200">Analyzing Real Urban Site Telemetry...</div>
        <p className="text-[11px] text-slate-400 max-w-xs">
          Querying Sentinel-2 reflectance, OpenStreetMap vector layers, Open-Meteo climate, and SRTM DEM slope.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 rounded-2xl glass-panel text-center text-xs text-slate-400 space-y-2">
        <Layers className="w-6 h-6 text-slate-500 mx-auto" />
        <p>No site analyzed yet. Draw an area on the map or select a demo site.</p>
      </div>
    );
  }

  const { metrics } = analysis;

  const getBadgeClass = (category: string) => {
    switch (category) {
      case 'OBSERVED':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
      case 'DERIVED':
        return 'bg-sky-950/60 text-sky-300 border-sky-700/50';
      case 'MODELED':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getClassificationClass = (classification?: string) => {
    switch (classification) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/40';
      case 'VULNERABLE':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
      case 'OPTIMAL':
      case 'GOOD':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
      default:
        return 'text-slate-300 bg-slate-800/40 border-slate-700/40';
    }
  };

  const metricList: MetricWithProvenance<any>[] = [
    metrics.existingGreenCoveragePercent,
    metrics.builtUpImperviousPercent,
    metrics.vegetationHealthNDVI,
    metrics.runoffVulnerabilityScore,
    metrics.heatVulnerabilityIndex,
    metrics.averageSlopePercent,
    metrics.waterPresenceSqMeters,
    metrics.greenFragmentationIndex,
    metrics.ecologicalConnectivityScore,
    metrics.availableInterventionZoneSqMeters
  ].filter(Boolean);

  return (
    <div className="flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Site Ecological Diagnosis</h3>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">OBSERVED</span>
          <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">DERIVED</span>
        </div>
      </div>

      {/* Grid of 10 Diagnosis Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {metricList.map((m, idx) => (
          <div
            key={idx}
            onClick={() => onInspectProvenance(m)}
            className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer group flex flex-col justify-between space-y-1.5"
          >
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-slate-100 leading-tight">
                {m.name}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ml-1 ${getBadgeClass(
                  m.provenance.category
                )}`}
              >
                {m.provenance.category}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-sm font-bold font-mono text-slate-100">
                {m.formattedValue}
              </span>
              {m.classification && (
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${getClassificationClass(
                    m.classification
                  )}`}
                >
                  {m.classification}
                </span>
              )}
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1">
              <span className="truncate max-w-[140px]">{m.provenance.source}</span>
              <Info className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
