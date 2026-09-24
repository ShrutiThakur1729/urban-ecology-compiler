'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header, MapStyleType } from '@/components/layout/Header';
import { LandingPage } from '@/components/landing/LandingPage';
import { AuthModal, AuthUser } from '@/components/auth/AuthModal';
import { StepNavigation, WorkflowStep } from '@/components/workflow/StepNavigation';
import { Step1Location } from '@/components/workflow/Step1Location';
import { Step2DefineSite } from '@/components/workflow/Step2DefineSite';
import { Step3SetPriorities } from '@/components/workflow/Step3SetPriorities';
import { Step4Compiling } from '@/components/workflow/Step4Compiling';
import { ResultsSidebar } from '@/components/workflow/ResultsSidebar';
import { BeforeAfterSplit, ComparisonMode } from '@/components/workflow/BeforeAfterSplit';
import { LocationSearchModal } from '@/components/search/LocationSearchModal';
import { DataProvenanceModal } from '@/components/analysis/DataProvenanceModal';
import { ProjectLibraryModal } from '@/components/project/ProjectLibraryModal';

const MapContainer = dynamic(
  () => import('@/components/map/MapContainer').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0a1410] flex flex-col items-center justify-center text-emerald-400 text-xs space-y-2">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-slate-300">Initializing MapLibre WebGL Engine...</span>
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
import { CandidateInterventionFeature } from '@/types/interventions';
import { MetricWithProvenance } from '@/types/provenance';
import { ProjectState } from '@/types/project';
import { saveProject } from '@/lib/project/projectStorage';
import { computePolygonStats, buildSitePolygon } from '@/lib/geo/geometryUtils';
import {
  THANE_DEMO_SITE_POLYGON,
  THANE_DEMO_ANALYSIS,
  THANE_DEMO_OPTIMIZED_SCENARIOS
} from '@/lib/demo/demoData';
import confetti from 'canvas-confetti';
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  MapPin,
  Check,
  X
} from 'lucide-react';

export default function UrbanCompilerPage() {
  // ── 1. App View: Public Landing Page vs Guided Workspace ──
  const [appView, setAppView] = useState<'LANDING' | 'WORKSPACE'>('LANDING');

  // ── 2. Demo Authentication State ──
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>({
    name: 'Shruti Thakur',
    email: 'shruti.thakur@urban-compiler.ai',
    role: 'Chief Urban Resilience Director',
    isDemo: true
  });

  // ── 3. 4-Step Guided Workflow State ──
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);

  // ── 4. Spatial Location & Site Area State ──
  const [projectId, setProjectId] = useState<string>('proj_demo_resilience');
  const [projectName, setProjectName] = useState<string>('Metropolitan Resilience Catchment');

  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>({
    name: 'Metropolitan Urban Catchment',
    formattedAddress: 'Central Resilience Demonstration Zone',
    center: [72.9781, 19.2183],
    zoom: 14,
    placeType: 'city',
    source: 'DEMO'
  });

  const [selectedAnalysisArea, setSelectedAnalysisArea] = useState<SelectedAnalysisArea | null>({
    polygon: THANE_DEMO_SITE_POLYGON,
    source: 'SUGGESTED'
  });

  // ── 5. Map Drawing State & Bidirectional Triggers ──
  const [appPhase, setAppPhase] = useState<AppPhase>('LOCATION_SELECTED');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<LngLat[]>([]);
  const [drawingPointCount, setDrawingPointCount] = useState<number>(0);
  const [triggerFinishDrawing, setTriggerFinishDrawing] = useState<number>(0);
  const [triggerUndoDrawingPoint, setTriggerUndoDrawingPoint] = useState<number>(0);
  const [triggerCancelDrawing, setTriggerCancelDrawing] = useState<number>(0);

  // ── 6. Map Styles, Inspection & Layout Modes ──
  const [mapStyle, setMapStyle] = useState<MapStyleType>('satellite');
  const [selectedIntervention, setSelectedIntervention] = useState<CandidateInterventionFeature | null>(null);

  // Layout expansion & collapsing (Requirements 10 & 11)
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // ── 7. Analysis & Compilation State ──
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysisData | null>(THANE_DEMO_ANALYSIS);
  const [compiledPlan, setCompiledPlan] = useState<StructuredCompilerPlanRequest | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(
    THANE_DEMO_OPTIMIZED_SCENARIOS
  );
  const [activeScenarioType, setActiveScenarioType] = useState<ScenarioType>('BALANCED');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isCompilingScreenActive, setIsCompilingScreenActive] = useState(false);

  // ── 8. Before / After Comparison State ──
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('split');
  const [beforeAfterSplit, setBeforeAfterSplit] = useState<number>(50);

  // ── 9. Modals ──
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);
  const [isProjectLibraryOpen, setIsProjectLibraryOpen] = useState(false);
  const [isMobileResultsOpen, setIsMobileResultsOpen] = useState(false);
  const [inspectedMetric, setInspectedMetric] = useState<MetricWithProvenance<any> | null>(null);

  // Active interventions for current scenario
  const activeInterventions: CandidateInterventionFeature[] = optimizationResult
    ? activeScenarioType === 'FLOOD_FIRST'
      ? optimizationResult.scenarios.floodFirst.interventions
      : activeScenarioType === 'BIODIVERSITY_FIRST'
      ? optimizationResult.scenarios.biodiversityFirst.interventions
      : optimizationResult.scenarios.balanced.interventions
    : [];

  // Default selected intervention to first intervention if none selected
  useEffect(() => {
    if (activeInterventions.length > 0 && !selectedIntervention) {
      setSelectedIntervention(activeInterventions[0]);
    }
  }, [activeInterventions, selectedIntervention]);

  // ───────────────────────────────────────────────────────────────────────────
  // Unified Project State Object (Single Source of Truth)
  // ───────────────────────────────────────────────────────────────────────────
  const currentPolygon = selectedAnalysisArea?.polygon || null;
  const currentStats = currentPolygon ? computePolygonStats(currentPolygon) : null;

  const currentProjectState: ProjectState = {
    id: projectId,
    name: projectName,
    location: selectedLocation || {
      name: 'Metropolitan Urban Catchment',
      formattedAddress: 'Central Resilience Demonstration Zone',
      center: [72.9781, 19.2183],
      zoom: 14,
      placeType: 'city',
      source: 'DEMO'
    },
    sitePolygon: currentPolygon,
    siteAreaHa: currentStats?.areaHectares || 132.00,
    sitePerimeterKm: currentStats?.perimeterKilometers || 4.60,
    siteVertexCount: currentStats?.vertexCount || 4,
    priorities: ['Flood resilience', 'Urban canopy', 'Heat reduction'],
    budgetInr: 5000000,
    constraints: { avoidDemolition: true, focusPublicSpaces: true },
    environmentalData: siteAnalysis,
    optimizationResult,
    selectedScenario: activeScenarioType,
    comparisonMode,
    beforeAfterSplitPercent: beforeAfterSplit,
    mapStyle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataProvenance: {},
    isDemo: selectedLocation?.source === 'DEMO'
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Save Project Handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleSaveCurrentProject = async () => {
    let name = projectName;
    if (!name || name === 'Untitled Project') {
      const input = prompt(
        'Enter project name:',
        selectedLocation?.name ? `${selectedLocation.name} Resilience Plan` : 'Urban Resilience Plan'
      );
      if (!input) return;
      name = input;
      setProjectName(name);
    }

    const updated = {
      ...currentProjectState,
      name,
      updatedAt: new Date().toISOString()
    };
    await saveProject(updated);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Load Project Handler
  // ───────────────────────────────────────────────────────────────────────────
  const handleLoadProject = (proj: ProjectState) => {
    setProjectId(proj.id);
    setProjectName(proj.name);
    setSelectedLocation(proj.location);
    if (proj.sitePolygon) {
      setSelectedAnalysisArea({
        polygon: proj.sitePolygon,
        source: 'DRAWN'
      });
    }
    if (proj.environmentalData) setSiteAnalysis(proj.environmentalData);
    if (proj.optimizationResult) setOptimizationResult(proj.optimizationResult);
    if (proj.selectedScenario) setActiveScenarioType(proj.selectedScenario);
    if (proj.comparisonMode) setComparisonMode(proj.comparisonMode);
    if (typeof proj.beforeAfterSplitPercent === 'number') setBeforeAfterSplit(proj.beforeAfterSplitPercent);
    if (proj.mapStyle) setMapStyle(proj.mapStyle);
    setAppView('WORKSPACE');
    setCurrentStep(4);
    setAppPhase('DASHBOARD');
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Compilation Engine
  // ───────────────────────────────────────────────────────────────────────────
  const handleCompile = useCallback(
    async (
      prioritiesOrPrompt: string[] | string,
      budgetInr: number = 5000000,
      constraints?: { avoidDemolition: boolean; focusPublicSpaces: boolean }
    ) => {
      setIsCompiling(true);
      setIsCompilingScreenActive(true);

      const promptText = Array.isArray(prioritiesOrPrompt)
        ? `Prioritize ${prioritiesOrPrompt.join(', ')} with budget ₹${(budgetInr / 100000).toFixed(0)} lakh, ${
            constraints?.avoidDemolition ? 'no demolition of existing buildings' : ''
          }, ${constraints?.focusPublicSpaces ? 'focus on municipal public spaces' : ''}`
        : prioritiesOrPrompt;

      try {
        const activePoly = selectedAnalysisArea?.polygon || THANE_DEMO_SITE_POLYGON;
        const activeAnal = siteAnalysis || THANE_DEMO_ANALYSIS;

        const response = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            polygon: activePoly,
            analysis: activeAnal,
            budgetInr
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCompiledPlan(data.compiledPlan);
          setOptimizationResult(data.optimizationResult);
          setActiveScenarioType(data.optimizationResult.activeScenarioType || 'BALANCED');

          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.85 },
            colors: ['#059669', '#10b981', '#38bdf8', '#34d399']
          });
        }
      } catch (err) {
        console.error('[COMPILER] API call error, using optimized fallback:', err);
        setOptimizationResult(THANE_DEMO_OPTIMIZED_SCENARIOS);
        setActiveScenarioType('BALANCED');
      } finally {
        setIsCompiling(false);
      }
    },
    [selectedAnalysisArea?.polygon, siteAnalysis]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Site Analysis Execution
  // ───────────────────────────────────────────────────────────────────────────
  const executeSiteAnalysis = async (poly: SitePolygon) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon: poly })
      });

      if (response.ok) {
        const data = await response.json();
        setSiteAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Site analysis API failed, using cached telemetry:', err);
      setSiteAnalysis(THANE_DEMO_ANALYSIS);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Step 1: Select Location
  // ───────────────────────────────────────────────────────────────────────────
  const handleSelectLocation = (loc: GeoLocation) => {
    const newLocation: SelectedLocation = {
      name: loc.name,
      formattedAddress: loc.formattedAddress,
      center: loc.center,
      zoom: loc.zoom || 14,
      placeType: loc.placeType,
      source: loc.placeType === 'coordinate' ? 'COORDINATE' : 'SEARCH'
    };
    setSelectedLocation(newLocation);
    createSuggestedAreaForLocation(newLocation);
  };

  const handleConfirmLocation = () => {
    setCurrentStep(2);
    setAppPhase('AREA_READY');
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Step 2: Define Site Helpers
  // ───────────────────────────────────────────────────────────────────────────
  const createSuggestedAreaForLocation = (loc: SelectedLocation) => {
    const span = 0.0075;
    const [lng, lat] = loc.center;

    const coords: [number, number][] = [
      [lng - span, lat - span * 0.75],
      [lng + span, lat - span * 0.75],
      [lng + span * 1.1, lat + span * 0.75],
      [lng - span * 0.9, lat + span * 0.75],
      [lng - span, lat - span * 0.75]
    ];

    const suggestedPoly = buildSitePolygon(coords, `${loc.name} Urban Catchment`);
    if (suggestedPoly) {
      setSelectedAnalysisArea({
        polygon: suggestedPoly,
        source: 'SUGGESTED'
      });
    }
  };

  const handleUseSuggestedArea = () => {
    if (selectedLocation) {
      createSuggestedAreaForLocation(selectedLocation);
      setIsDrawing(false);
      setAppPhase('AREA_READY');
    }
  };

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setDrawingPoints([]);
    setDrawingPointCount(0);
    setAppPhase('DRAWING');
  };

  const handlePolygonDrawn = (poly: SitePolygon) => {
    setSelectedAnalysisArea({
      polygon: poly,
      source: 'DRAWN'
    });
    setIsDrawing(false);
    setDrawingPoints([]);
    setDrawingPointCount(0);
    setAppPhase('AREA_READY');
    executeSiteAnalysis(poly);
  };

  const handleClearArea = () => {
    setSelectedAnalysisArea(null);
    setIsDrawing(false);
    setDrawingPoints([]);
    setDrawingPointCount(0);
    setAppPhase('LOCATION_SELECTED');
  };

  const handleConfirmSite = () => {
    if (selectedAnalysisArea) {
      executeSiteAnalysis(selectedAnalysisArea.polygon);
    }
    setCurrentStep(3);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Step 3: Trigger Compilation
  // ───────────────────────────────────────────────────────────────────────────
  const handleStartCompilation = (
    priorities: string[],
    budgetInr: number,
    constraints: { avoidDemolition: boolean; focusPublicSpaces: boolean },
    promptText: string
  ) => {
    setCurrentStep(4);
    handleCompile(promptText || priorities, budgetInr, constraints);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Demo Mode Instant Launcher
  // ───────────────────────────────────────────────────────────────────────────
  const handleLoadDemoSite = () => {
    setSelectedLocation({
      name: 'Metropolitan Urban Catchment',
      formattedAddress: 'Central Metropolitan Resilience Zone',
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
    setOptimizationResult(THANE_DEMO_OPTIMIZED_SCENARIOS);
    setActiveScenarioType('BALANCED');
    setAppView('WORKSPACE');
    setCurrentStep(4);
    setAppPhase('DASHBOARD');
    if (THANE_DEMO_OPTIMIZED_SCENARIOS.scenarios.balanced.interventions[0]) {
      setSelectedIntervention(THANE_DEMO_OPTIMIZED_SCENARIOS.scenarios.balanced.interventions[0]);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER PUBLIC LANDING PAGE (Step 1 requirement)
  // ───────────────────────────────────────────────────────────────────────────
  if (appView === 'LANDING') {
    return (
      <>
        <LandingPage
          onStartPlanning={() => {
            if (!currentUser) {
              setIsAuthOpen(true);
            } else {
              setAppView('WORKSPACE');
            }
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onExploreDemo={handleLoadDemoSite}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthOpen(false);
            setAppView('WORKSPACE');
          }}
        />
      </>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER GUIDED WORKSPACE APPLICATION (Three-part Structure)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8faf7] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── Persistent Top Header ── */}
      <Header
        currentLocationName={selectedLocation?.name}
        onOpenLocationSearch={() => setIsSearchOpen(true)}
        onLoadDemoSite={handleLoadDemoSite}
        isAnalyzing={isAnalyzing}
        isCompiling={isCompiling}
        isDemoData={selectedLocation?.source === 'DEMO'}
        onOpenProvenanceModal={() => {
          setInspectedMetric(null);
          setIsProvenanceOpen(true);
        }}
        user={currentUser}
        onSignOut={() => {
          setCurrentUser(null);
          setAppView('LANDING');
        }}
        onReturnToLanding={() => setAppView('LANDING')}
        mapStyle={mapStyle}
        onChangeMapStyle={setMapStyle}
        onSaveProject={handleSaveCurrentProject}
        onOpenProjectLibrary={() => setIsProjectLibraryOpen(true)}
      />

      {/* ── Mobile Compact Stepper Bar ── */}
      <div className="lg:hidden">
        <StepNavigation
          currentStep={currentStep}
          onSelectStep={(step) => {
            if (isDrawing && step !== 2) setIsDrawing(false);
            setCurrentStep(step);
          }}
          isCompact
        />
      </div>

      {/* ── Main Three-Part Application Layout ── */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* ── 1. LEFT: Guided Workflow Sidebar (Desktop only) ── */}
        {!isMapExpanded && (
          <div
            className={`hidden lg:flex transition-all duration-300 relative shrink-0 ${
              isLeftCollapsed ? 'w-0' : 'w-[280px] xl:w-[320px]'
            }`}
          >
            <div
              className={`w-[280px] xl:w-[320px] h-full ${
                isLeftCollapsed ? 'hidden' : 'flex'
              }`}
            >
              <StepNavigation
                currentStep={currentStep}
                onSelectStep={(step) => {
                  if (isDrawing && step !== 2) setIsDrawing(false);
                  setCurrentStep(step);
                }}
                className="w-full"
              />
            </div>

            {/* Edge Collapse Toggle Button */}
            <button
              type="button"
              onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-emerald-800 hover:border-emerald-300 transition select-none"
              title={isLeftCollapsed ? 'Expand workflow panel' : 'Collapse workflow panel'}
            >
              {isLeftCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {/* ── 2. CENTER: Large Interactive Map Canvas ── */}
        <main className="flex-1 h-full relative z-0 overflow-hidden">
          {/* MapLibre Canvas - Pure Map without old HUDs */}
          <MapContainer
            center={selectedLocation?.center || [72.9781, 19.2183]}
            zoom={selectedLocation?.zoom || 14}
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
            onCancelDrawing={() => {
              setIsDrawing(false);
              setAppPhase('AREA_READY');
            }}
            externalMapStyle={mapStyle}
            onMapStyleChanged={setMapStyle}
            externalBeforeAfterSplit={
              comparisonMode === 'before'
                ? 0
                : comparisonMode === 'after'
                ? 100
                : beforeAfterSplit
            }
            highlightedInterventionId={selectedIntervention?.id || null}
            onSelectFeature={(props) => {
              const match = activeInterventions.find(
                (i) => i.id === props?.id || i.name === props?.name || (i.interventionId as string) === props?.id
              );
              if (match) setSelectedIntervention(match);
            }}
            onDrawingProgress={(count, pts) => {
              setDrawingPointCount(count);
              setDrawingPoints(pts);
            }}
            triggerFinishDrawing={triggerFinishDrawing}
            triggerCancelDrawing={triggerCancelDrawing}
            triggerUndoDrawingPoint={triggerUndoDrawingPoint}
            comparisonMode={comparisonMode}
          />

          {/* ── EXPAND MAP FLOATING TOOLBAR ── */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg text-[11px] sm:text-xs font-bold text-slate-800 hover:text-emerald-900 hover:border-emerald-400 transition flex items-center gap-1.5"
              title={isMapExpanded ? 'Exit Full Map Mode' : 'Expand Map across workspace'}
            >
              {isMapExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden xs:inline">Exit Full Map</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Expand Map</span>
                </>
              )}
            </button>
          </div>

          {/* ── STEP 1: LOCATION SEARCH ── */}
          {currentStep === 1 && (
            <Step1Location
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              onConfirmLocation={handleConfirmLocation}
              onLoadDemo={handleLoadDemoSite}
            />
          )}

          {/* ── STEP 2: DEFINE SITE ── */}
          {currentStep === 2 && selectedLocation && (
            <Step2DefineSite
              location={selectedLocation}
              analysisArea={selectedAnalysisArea}
              isDrawing={isDrawing}
              drawingPointCount={drawingPointCount}
              onUseSuggestedArea={handleUseSuggestedArea}
              onStartDrawing={handleStartDrawing}
              onFinishDrawing={() => {
                setTriggerFinishDrawing((c) => c + 1);
              }}
              onUndoPoint={() => {
                setTriggerUndoDrawingPoint((c) => c + 1);
              }}
              onCancelDrawing={() => {
                setTriggerCancelDrawing((c) => c + 1);
                setIsDrawing(false);
                setAppPhase('AREA_READY');
              }}
              onClearArea={handleClearArea}
              onConfirmSite={handleConfirmSite}
            />
          )}

          {/* ── STEP 3: SET PRIORITIES ── */}
          {currentStep === 3 && (
            <Step3SetPriorities
              onCompile={handleStartCompilation}
              isCompiling={isCompiling}
            />
          )}

          {/* ── STEP 4: COMPILING PROCESSING ANIMATION ── */}
          {currentStep === 4 && isCompilingScreenActive && (
            <Step4Compiling
              onComplete={() => {
                setIsCompilingScreenActive(false);
                if (activeInterventions.length > 0 && !selectedIntervention) {
                  setSelectedIntervention(activeInterventions[0]);
                }
              }}
            />
          )}

          {/* ── STEP 4: BEFORE / AFTER MAP SPLIT CONTROLS ── */}
          {currentStep === 4 && !isCompilingScreenActive && (
            <BeforeAfterSplit
              mode={comparisonMode}
              onChangeMode={(m) => {
                setComparisonMode(m);
                if (m === 'before') setBeforeAfterSplit(0);
                else if (m === 'after') setBeforeAfterSplit(100);
                else setBeforeAfterSplit(50);
              }}
              splitPercent={beforeAfterSplit}
              onChangeSplitPercent={setBeforeAfterSplit}
            />
          )}

          {/* ── Mobile Floating Results Toggle (Step 4) ── */}
          {currentStep === 4 && !isCompilingScreenActive && (
            <div className="lg:hidden absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsMobileResultsOpen(true)}
                className="px-4 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-2xl border border-emerald-600/50 transition active:scale-95"
              >
                <Layers className="w-4 h-4 text-emerald-300" />
                <span>View Plan & Scenarios</span>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-700 text-[10px] font-mono">3</span>
              </button>
            </div>
          )}
        </main>

        {/* ── 3. RIGHT: Contextual Information Panel (Desktop only) ── */}
        {currentStep === 4 && !isCompilingScreenActive && !isMapExpanded && (
          <div
            className={`hidden lg:flex transition-all duration-300 relative shrink-0 ${
              isRightCollapsed ? 'w-0' : 'w-[340px] xl:w-[380px]'
            }`}
          >
            {/* Edge Collapse Toggle Button */}
            <button
              type="button"
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-emerald-800 hover:border-emerald-300 transition select-none"
              title={isRightCollapsed ? 'Expand results panel' : 'Collapse results panel'}
            >
              {isRightCollapsed ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            <div
              className={`w-[340px] xl:w-[380px] h-full ${
                isRightCollapsed ? 'hidden' : 'flex'
              }`}
            >
              <ResultsSidebar
                optimizationResult={optimizationResult}
                activeScenarioType={activeScenarioType}
                onSelectScenario={(type) => {
                  setActiveScenarioType(type);
                  const newScenario = optimizationResult?.scenarios[
                    type === 'FLOOD_FIRST'
                      ? 'floodFirst'
                      : type === 'BIODIVERSITY_FIRST'
                      ? 'biodiversityFirst'
                      : 'balanced'
                  ];
                  if (newScenario?.interventions?.[0]) {
                    setSelectedIntervention(newScenario.interventions[0]);
                  }
                }}
                interventions={activeInterventions}
                selectedIntervention={selectedIntervention || activeInterventions[0] || null}
                onSelectIntervention={setSelectedIntervention}
                onOpenProvenance={() => {
                  setInspectedMetric(null);
                  setIsProvenanceOpen(true);
                }}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Results Bottom Sheet (Step 4) ── */}
      {currentStep === 4 && !isCompilingScreenActive && isMobileResultsOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in pointer-events-auto"
          onClick={() => setIsMobileResultsOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer drag handle & header bar */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-xs font-bold text-slate-800">Compiled Plan & Scenarios</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileResultsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ResultsSidebar
                optimizationResult={optimizationResult}
                activeScenarioType={activeScenarioType}
                onSelectScenario={(type) => {
                  setActiveScenarioType(type);
                  const newScenario = optimizationResult?.scenarios[
                    type === 'FLOOD_FIRST'
                      ? 'floodFirst'
                      : type === 'BIODIVERSITY_FIRST'
                      ? 'biodiversityFirst'
                      : 'balanced'
                  ];
                  if (newScenario?.interventions?.[0]) {
                    setSelectedIntervention(newScenario.interventions[0]);
                  }
                }}
                interventions={activeInterventions}
                selectedIntervention={selectedIntervention || activeInterventions[0] || null}
                onSelectIntervention={(inv) => {
                  setSelectedIntervention(inv);
                  setIsMobileResultsOpen(false); // Close drawer to view on map
                }}
                onOpenProvenance={() => {
                  setInspectedMetric(null);
                  setIsProvenanceOpen(true);
                }}
                className="w-full border-l-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Global Modals ── */}
      <LocationSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
      />

      <DataProvenanceModal
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
        metric={inspectedMetric}
      />

      <ProjectLibraryModal
        isOpen={isProjectLibraryOpen}
        onClose={() => setIsProjectLibraryOpen(false)}
        currentProject={currentProjectState}
        onLoadProject={handleLoadProject}
        onImportBoundary={(polygon) => {
          setSelectedAnalysisArea({
            polygon,
            source: 'DRAWN'
          });
          executeSiteAnalysis(polygon);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
          setAppView('WORKSPACE');
        }}
      />
    </div>
  );
}
