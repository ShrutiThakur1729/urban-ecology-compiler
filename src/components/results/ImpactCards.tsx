'use client';
/**
 * ImpactCards — the "Impact Summary (Modeled Estimates)" row from the reference.
 * Usage: <ImpactCards impact={computeImpact(siteFeature, interventionFeatures)} />
 *
 * Difference from the mockup: the "Biodiversity Potential +28%" card is replaced by "Habitat share",
 * which IS derivable from geometry. Runoff, cooling and cost stay labelled "Modeled".
 */
import type { ReactNode } from 'react';
import { fmtHa, fmtINR, type Impact } from '@/lib/geo/impact';

const Ico = ({ children }: { children: ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

type CardProps = { tone: string; icon: ReactNode; value: string; label: string };
function Card({ tone, icon, value, label }: CardProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <div className="truncate text-base font-semibold leading-tight text-slate-900">{value}</div>
        <div className="truncate text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function ImpactCards({ impact }: { impact: Impact }) {
  const a = impact.assumptions;
  const tip = `Modeled with: baseline runoff C=${a.baselineRunoffC}, design storm ${a.designStormMm} mm, cooling ${a.coolingCPerFraction} °C per canopy fraction (cap ${a.coolingCapC} °C). Cost uses placeholder unit rates.`;
  const temp = impact.surfaceCoolingC;

  return (
    <section aria-label="Impact summary">
      <h3 className="mb-2 text-sm font-semibold text-slate-800" title={tip}>Impact Summary (Modeled Estimates)</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Card tone="bg-emerald-50 text-emerald-600" value={`+${fmtHa(impact.greenCoverHa)}`} label="Green cover"
          icon={<Ico><path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14zM5 19l8-8" /></Ico>} />
        <Card tone="bg-sky-50 text-sky-600" value={`${temp < 0 ? '\u2212' : '+'}${Math.abs(temp).toFixed(1)}°C`} label="Surface temperature"
          icon={<Ico><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></Ico>} />
        <Card tone="bg-blue-50 text-blue-600" value={`+${Math.round(impact.runoffReductionPct)}%`} label="Runoff reduction"
          icon={<Ico><path d="M12 3C12 3 5 11 5 15a7 7 0 0 0 14 0C19 11 12 3 12 3Z" /></Ico>} />
        <Card tone="bg-orange-50 text-orange-600" value={`${Math.round(impact.habitatSharePct)}%`} label="Habitat share of site"
          icon={<Ico><circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="6" r="2.5" /><circle cx="12" cy="18" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /></Ico>} />
        <Card tone="bg-rose-50 text-rose-600" value={fmtINR(impact.costINR)} label="Estimated cost"
          icon={<span className="text-base font-semibold leading-none">₹</span>} />
      </div>
      {impact.unclassified > 0 && (
        <p className="mt-2 text-xs text-amber-700">{impact.unclassified} feature(s) had an unknown type and were not counted.</p>
      )}
    </section>
  );
}
