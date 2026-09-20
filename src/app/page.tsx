'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { CompilerPanel } from '@/components/compiler/CompilerPanel';
import { SiteDiagnosisPanel } from '@/components/analysis/SiteDiagnosisPanel';
import { ScenarioDeck } from '@/components/scenarios/ScenarioDeck';
import { LocationSearchModal } from '@/components/search/LocationSearchModal';
import { DataProvenanceModal } from '@/components/analysis/DataProvenanceModal';
import { FloatingSearchBar } from '@/components/search/FloatingSearchBar';
import { LocationCard } from '@/components/search/LocationCard';
import { AreaSelectionCard } from '@/components/search/AreaSelectionCard';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Initializing MapLibre WebGL Engine...</span>
      </div>
    )
  }
);

import {
  SitePolygon,
  LngLat,
  GeoLocation,
  SelectedSite,
  AppPhase,
  SelectedLocation,
  SelectedAnalysisArea
} from '@/types/geo';
import { SiteAnalysisData } from '@/types/analysis';
import { StructuredCompilerPlanRequest } from '@/types/compiler';
import { OptimizationResult, ScenarioType } from '@/types/scenarios';
import { MetricWithProvenance } from '@/types/provenance';
import {
  THANE_DEMO_SITE_POLYGON,
  THANE_DEMO_ANALYSIS,
  THANE_DEMO_OPTIMIZED_SCENARIOS
} from '@/lib/demo/demoData';
import confetti from 'canvas-confetti';
import * as turf from '@turf/turf';
import { Zap, Activity, Layers, Compass, Sparkles, ArrowLeft } from 'lucide-react';

export default function UrbanCompilerPage() {
  // 1. GUIDED WORKFLOW PHASE
  const [appPhase, setAppPhase] = useState<AppPhase>('SEARCH');

  // 2. SEPARATE LOCATION AND AREA STATE
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [selectedAnalysisArea, setSelectedAnalysisArea] = useState<SelectedAnalysisArea | null>(null);

  // Analysis, Compilation & Scenario states
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysisData | null>(null);
  const [compiledPlan, setCompiledPlan] = useState<StructuredCompilerPlanRequest | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [activeScenarioType, setActiveScenarioType] = useState<ScenarioType>('FLOOD_FIRST');

  // Async Execution States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'IDLE' | 'LOCATING' | 'ANALYZING' | 'READY'>('IDLE');

  // Modals & Mobile View States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);
  const [inspectedMetric, setInspectedMetric] = useState<MetricWithProvenance<any> | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'compiler' | 'map' | 'diagnosis' | 'scenarios'>('map');

  // Backward-compatible SelectedSite derived object
  const selectedSite: SelectedSite = {
    name: selectedLocation?.name || 'Select Location',
    displayName: selectedLocation?.formattedAddress || selectedLocation?.name || 'No site selected',
    center: selectedLocation?.center || [72.9781, 19.2183],
    zoom: selectedLocation?.zoom || 13,
    polygon: selectedAnalysisArea?.polygon || null,
    isDemo: selectedLocation?.source === 'DEMO',
    source: selectedLocation?.source || 'SEARCH'
  };

  // Compile Plan API
  const handleCompile = useCallback(
    async (
      prompt: string,
      budgetInr: number,
      customPoly?: SitePolygon,
      customAnalysis?: SiteAnalysisData
    ) => {
      setIsCompiling(true);
      try {
        const activePoly = customPoly || selectedAnalysisArea?.polygon || THANE_DEMO_SITE_POLYGON;
        const activeAnal = customAnalysis || siteAnalysis || THANE_DEMO_ANALYSIS;

        console.log('[COMPILER] Starting compilation with:', {
          prompt,
          budgetInr,
          polygonProperties: activePoly?.properties,
          polygonCoordsCount: activePoly?.geometry?.coordinates?.[0]?.length || 0
        });

        const response = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            polygon: activePoly,
            analysis: activeAnal,
            budgetInr
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCompiledPlan(data.compiledPlan);
          setOptimizationResult(data.optimizationResult);
          const initialScenario = data.optimizationResult.activeScenarioType || 'FLOOD_FIRST';
          setActiveScenarioType(initialScenario);

          // Detailed logging required by Step 5
          const activeScenarioObj = data.optimizationResult.scenarios[
            initialScenario === 'FLOOD_FIRST' ? 'floodFirst' :
            initialScenario === 'BIODIVERSITY_FIRST' ? 'biodiversityFirst' : 'balanced'
          ];

          console.log('[COMPILER OUTPUT]', {
            scenario: activeScenarioObj?.title || initialScenario,
            interventionsCount: activeScenarioObj?.interventions?.length || 0
          });

          if (activeScenarioObj?.interventions) {
            activeScenarioObj.interventions.forEach((inv: any, idx: number) => {
              console.log(`[COMPILER OUTPUT] Intervention #${idx + 1}:`, {
                type: inv.name || inv.interventionId,
                geometry: inv.geometry?.type,
                coordinates: inv.geometry?.coordinates,
                cost: inv.properties?.estimatedCostInr,
                areaSqM: inv.properties?.areaSqMeters,
                suitability: inv.properties?.suitabilityReason
              });
            });
          }

          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.88 },
            colors: ['#10b981', '#38bdf8', '#fb923c']
          });
        }
      } catch (err) {
        console.error('[COMPILER] Compilation failed:', err);
      } finally {
        setIsCompiling(false);
      }
    },
    [selectedAnalysisArea?.polygon, siteAnalysis]
  );

  // Execute Site Analysis
  const executeSiteAnalysis = async (
    poly: SitePolygon,
    locationMeta: SelectedLocation
  ) => {
    setIsAnalyzing(true);
    setAnalysisStatus('ANALYZING');
    setAppPhase('ANALYZING');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon: poly })
      });

      if (response.ok) {
        const data = await response.json();
        const freshAnalysis = data.analysis;

        setSiteAnalysis(freshAnalysis);
        setAnalysisStatus('READY');
        setAppPhase('DASHBOARD');

        // Automatically compile initial optimal plan for newly analyzed site
        handleCompile(
          "Reduce monsoon flooding first, then heat, increase biodiversity, don't demolish buildings, and keep budget under ₹50 lakh",
          5000000,
          poly,
          freshAnalysis
        );
      } else {
        setAnalysisStatus('IDLE');
        setAppPhase('AREA_READY');
      }
    } catch (err) {
      console.error('Site analysis failed:', err);
      setAnalysisStatus('IDLE');
      setAppPhase('AREA_READY');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 1. Select Location (from Floating Search or Modal or Hotspot)
  const handleSelectLocation = (loc: GeoLocation) => {
    // Clear old state to avoid conflicting data
    setSiteAnalysis(null);
    setCompiledPlan(null);
    setOptimizationResult(null);
    setSelectedAnalysisArea(null);

    const newLocation: SelectedLocation = {
      name: loc.name,
      formattedAddress: loc.formattedAddress,
      center: loc.center,
      zoom: loc.zoom || 14,
      placeType: loc.placeType,
      source: loc.placeType === 'coordinate' ? 'COORDINATE' : 'SEARCH'
    };

    setSelectedLocation(newLocation);
    setAppPhase('LOCATION_SELECTED');
    setAnalysisStatus('IDLE');
  };

  // 2. Start Drawing Area
  const handleStartDrawing = () => {
    setAppPhase('DRAWING');
  };

  // 3. Use Suggested Catchment Area (auto-sized around selected location)
  const handleUseSuggestedArea = () => {
    if (!selectedLocation) return;
    const span = 0.007;
    const [lng, lat] = selectedLocation.center;

    const coords: [number, number][] = [
      [lng - span, lat - span],
      [lng + span, lat - span],
      [lng + span, lat + span],
      [lng - span, lat + span],
      [lng - span, lat - span]
    ];

    // Compute real area and perimeter from actual coordinates
    const turfPoly = turf.polygon([coords]);
    const areaSqM = Math.round(turf.area(turfPoly));
    const perimM = Math.round(turf.length(turf.lineString(coords), { units: 'meters' }));

    const suggestedPoly: SitePolygon = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: {
        name: `${selectedLocation.name} Urban Catchment`,
        areaSquareMeters: areaSqM,
        areaHectares: Number((areaSqM / 10000).toFixed(2)),
        perimeterMeters: perimM,
        createdAt: new Date().toISOString()
      }
    };

    setSelectedAnalysisArea({
      polygon: suggestedPoly,
      source: 'SUGGESTED'
    });
    setAppPhase('AREA_READY');
  };

  // 4. Custom Drawn Area on Map Complete
  const handlePolygonDrawn = (poly: SitePolygon) => {
    setSelectedAnalysisArea({
      polygon: poly,
      source: 'DRAWN'
    });
    setAppPhase('AREA_READY');
  };

  // 5. Trigger Analysis from Area Ready Card
  const handleTriggerAnalysis = () => {
    if (!selectedAnalysisArea || !selectedLocation) return;
    executeSiteAnalysis(selectedAnalysisArea.polygon, selectedLocation);
  };

  // 6. Reset to Search Phase
  const handleResetSearch = () => {
    setSelectedLocation(null);
    setSelectedAnalysisArea(null);
    setSiteAnalysis(null);
    setCompiledPlan(null);
    setOptimizationResult(null);
    setAppPhase('SEARCH');
    setAnalysisStatus('IDLE');
  };

  // 7. Load Pre-Compiled Thane Demo Plan
  const handleLoadDemoSite = () => {
    setSelectedLocation({
      name: 'Thane, Maharashtra, India',
      formattedAddress: 'Naupada - Wagle Estate Zone, Thane, Maharashtra, India',
      center: [72.9781, 19.2183],
      zoom: 14,
      placeType: 'city',
      source: 'DEMO'
    });
    setSelectedAnalysisArea({
      polygon: THANE_DEMO_SITE_POLYGON,
      source: 'DEMO'
    });
    setSiteAnalysis(THANE_DEMO_ANALYSIS);
    setCompiledPlan({
      naturalLanguagePrompt:
        "Reduce monsoon flooding first, then heat, increase biodiversity, don't demolish buildings, and keep the budget below ₹50 lakh.",
      goals: [
        { name: 'flood_resilience', priority: 1, description: 'Primary mitigation of monsoon stormwater ponding' },
        { name: 'heat_reduction', priority: 2, description: 'Microclimate canopy shade and cooling' },
        { name: 'biodiversity', priority: 3, description: 'Native pollinator and wildlife stepping stone corridors' }
      ],
      constraints: {
        budget_inr: 5000000,
        demolition_allowed: false,
        preserve_roads: true,
        prioritize_native_species: true
      },
      parsedSummary:
        'Prioritizing flood reduction (P1) > Heat mitigation (P2) > Biodiversity (P3) under ₹50 Lakh budget cap with zero building demolition.',
      tradeoffAnalysis:
        'Allocated maximum budget to bioswales and rain gardens while preserving municipal green roofs and native shade corridors.'
    });
    setOptimizationResult(THANE_DEMO_OPTIMIZED_SCENARIOS);
    setActiveScenarioType('FLOOD_FIRST');
    setAnalysisStatus('READY');
    setAppPhase('DASHBOARD');
  };

  // Active interventions for current scenario
  const activeInterventions = optimizationResult
    ? activeScenarioType === 'FLOOD_FIRST'
      ? optimizationResult.scenarios.floodFirst.interventions
      : activeScenarioType === 'BIODIVERSITY_FIRST'
      ? optimizationResult.scenarios.biodiversityFirst.interventions
      : optimizationResult.scenarios.balanced.interventions
    : [];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Header */}
      <Header
        currentLocationName={selectedLocation?.name}
        onOpenLocationSearch={() => setIsSearchOpen(true)}
        onLoadDemoSite={handleLoadDemoSite}
        isAnalyzing={isAnalyzing}
        isCompiling={isCompiling}
        isDemoData={selectedLocation?.source === 'DEMO'}
        analysisStatus={analysisStatus}
        appPhase={appPhase}
        onOpenProvenanceModal={() => {
          setInspectedMetric(null);
          setIsProvenanceOpen(true);
        }}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Goal Compiler & Controls (Only during DASHBOARD phase) */}
        {appPhase === 'DASHBOARD' && (
          <div className="hidden lg:flex w-[340px] xl:w-[380px] h-full flex-col border-r border-slate-800/90 bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto shrink-0 z-10 space-y-4 animate-fade-in">
            <CompilerPanel
              compiledPlan={compiledPlan}
              onCompile={(prompt, budget) => handleCompile(prompt, budget)}
              isCompiling={isCompiling}
            />
          </div>
        )}

        {/* Center: Full Map Canvas + Floating Overlays */}
        <div className="flex-1 h-full relative z-0">
          <MapContainer
            center={selectedLocation?.center || [72.9781, 19.2183]}
            zoom={selectedLocation?.zoom || 13}
            locationName={selectedLocation?.name}
            sitePolygon={selectedAnalysisArea?.polygon || null}
            interventions={activeInterventions}
            activeScenarioTitle={
              optimizationResult
                ? activeScenarioType === 'FLOOD_FIRST'
                  ? optimizationResult.scenarios.floodFirst.title
                  : activeScenarioType === 'BIODIVERSITY_FIRST'
                  ? optimizationResult.scenarios.biodiversityFirst.title
                  : optimizationResult.scenarios.balanced.title
                : undefined
            }
            isAnalyzing={isAnalyzing}
            appPhase={appPhase}
            onPolygonDrawn={handlePolygonDrawn}
            onCancelDrawing={() => setAppPhase('LOCATION_SELECTED')}
          />

          {/* Floating Search Bar (Top-Center of Map Canvas) */}
          {(appPhase === 'SEARCH' || appPhase === 'LOCATION_SELECTED') && (
            <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-30 pointer-events-auto">
              <FloatingSearchBar
                onSelectLocation={handleSelectLocation}
                onLoadDemo={handleLoadDemoSite}
                currentLocationName={selectedLocation?.name}
              />
            </div>
          )}

          {/* Floating Location Card (When Location is selected, prompting area delineation) */}
          {appPhase === 'LOCATION_SELECTED' && selectedLocation && (
            <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-30 pointer-events-auto">
              <LocationCard
                location={selectedLocation}
                onStartDrawing={handleStartDrawing}
                onUseSuggestedArea={handleUseSuggestedArea}
                onChangeLocation={handleResetSearch}
              />
            </div>
          )}

          {/* Floating Area Ready Card (When Polygon is defined, ready to analyze) */}
          {(appPhase === 'AREA_READY' || appPhase === 'ANALYZING') &&
            selectedLocation &&
            selectedAnalysisArea && (
              <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-30 pointer-events-auto">
                <AreaSelectionCard
                  location={selectedLocation}
                  area={selectedAnalysisArea}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleTriggerAnalysis}
                  onRedraw={handleStartDrawing}
                  onChangeLocation={handleResetSearch}
                />
              </div>
            )}
        </div>

        {/* Right Side: Site Diagnosis & Scenarios (Only during DASHBOARD phase) */}
        {appPhase === 'DASHBOARD' && (
          <div className="hidden xl:flex w-[420px] 2xl:w-[460px] h-full flex-col border-l border-slate-800/90 bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto shrink-0 z-10 space-y-6 animate-fade-in">
            <ScenarioDeck
              optimizationResult={optimizationResult}
              activeScenarioType={activeScenarioType}
              onSelectScenario={setActiveScenarioType}
              onInspectProvenance={(metric) => {
                setInspectedMetric(metric);
                setIsProvenanceOpen(true);
              }}
            />

            <SiteDiagnosisPanel
              analysis={siteAnalysis}
              isAnalyzing={isAnalyzing}
              onInspectProvenance={(metric) => {
                setInspectedMetric(metric);
                setIsProvenanceOpen(true);
              }}
            />
          </div>
        )}

        {/* Mobile Responsive Bottom Sheet (Only during DASHBOARD phase) */}
        {appPhase === 'DASHBOARD' && (
          <div className="xl:hidden flex flex-col border-t border-slate-800 bg-slate-950/95 max-h-[45vh] overflow-y-auto z-20">
            <div className="flex items-center justify-around border-b border-slate-800 p-2 text-xs font-semibold bg-slate-900/60">
              <button
                onClick={() => setMobileActiveTab('compiler')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  mobileActiveTab === 'compiler' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Compiler</span>
              </button>
              <button
                onClick={() => setMobileActiveTab('scenarios')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  mobileActiveTab === 'scenarios' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Scenarios</span>
              </button>
              <button
                onClick={() => setMobileActiveTab('diagnosis')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition ${
                  mobileActiveTab === 'diagnosis' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Diagnosis</span>
              </button>
            </div>

            <div className="p-4">
              {mobileActiveTab === 'compiler' && (
                <CompilerPanel
                  compiledPlan={compiledPlan}
                  onCompile={(prompt, budget) => handleCompile(prompt, budget)}
                  isCompiling={isCompiling}
                />
              )}
              {mobileActiveTab === 'scenarios' && (
                <ScenarioDeck
                  optimizationResult={optimizationResult}
                  activeScenarioType={activeScenarioType}
                  onSelectScenario={setActiveScenarioType}
                  onInspectProvenance={(metric) => {
                    setInspectedMetric(metric);
                    setIsProvenanceOpen(true);
                  }}
                />
              )}
              {mobileActiveTab === 'diagnosis' && (
                <SiteDiagnosisPanel
                  analysis={siteAnalysis}
                  isAnalyzing={isAnalyzing}
                  onInspectProvenance={(metric) => {
                    setInspectedMetric(metric);
                    setIsProvenanceOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fallback Location Search Modal (Also triggered from header "Change" button in Dashboard) */}
      <LocationSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* Data Provenance & Lineage Modal */}
      <DataProvenanceModal
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
        metric={inspectedMetric}
      />
    </div>
  );
}
