'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  ArrowRight,
  Play,
  Satellite,
  Cpu,
  Layers,
  Sliders,
  CheckCircle2,
  TreePine,
  ShieldAlert,
  Droplets,
  X,
  Compass,
  ChevronRight,
  ExternalLink,
  MapPin,
  TrendingUp,
  FolderArchive,
  Eye,
  Wind
} from 'lucide-react';

interface LandingPageProps {
  onStartPlanning: () => void;
  onOpenAuth: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPlanning,
  onOpenAuth,
  onExploreDemo
}) => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Geospatial Ingestion',
      subtitle: 'Multi-Spectral Telemetry',
      badge: 'OBSERVED',
      desc: 'Ingests Copernicus Sentinel-2 NDVI canopy imagery, OpenStreetMap street networks, and 30m OpenElevation hydrological contours.',
      icon: Satellite,
      highlight: 'High-resolution geospatial data synthesis'
    },
    {
      num: '02',
      title: 'Spatial Diagnosis',
      subtitle: 'Catchment Telemetry',
      badge: 'DERIVED',
      desc: 'Calculates overland runoff trajectories, impervious pavement ratios, microclimate heat islands, and ecological corridor fragmentation.',
      icon: Cpu,
      highlight: 'Turf.js certified spherical geometry'
    },
    {
      num: '03',
      title: 'Heuristic Synthesis',
      subtitle: 'Multi-Objective AI',
      badge: 'SYNTHESIS',
      desc: 'Translates natural-language municipal priorities and capital budgets into spatially constrained nature-based intervention candidates.',
      icon: Sparkles,
      highlight: 'Contextual spatial reasoning'
    },
    {
      num: '04',
      title: 'Ground-Truthed Plan',
      subtitle: 'CAD & GIS Ready',
      badge: 'MODELED',
      desc: 'Generates exact GeoJSON coordinates for Miyawaki forests, bioswales, and rain gardens with verified runoff and carbon sequestration projections.',
      icon: Layers,
      highlight: 'Exportable to QGIS, ArcGIS & CAD'
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900 font-sans overflow-x-hidden">
      {/* ── Top Floating Navigation ── */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/85 backdrop-blur-md border-b border-emerald-900/5 px-3 sm:px-8 py-3 flex items-center justify-between transition-all">
        {/* Brand Logo matching Image 2 */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#0a1c14] border border-emerald-600/40 p-0.5 shadow-md shadow-emerald-900/15 flex items-center justify-center shrink-0">
            <TreePine className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
            Urban Ecology <span className="hidden xs:inline">Compiler</span>
          </span>
        </div>

        {/* Center Nav Links with Smooth Scrolling */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
          <a href="#hero" className="hover:text-emerald-800 transition">
            Home
          </a>
          <a href="#how-it-works" className="hover:text-emerald-800 transition">
            How It Works
          </a>
          <a href="#features" className="hover:text-emerald-800 transition">
            Features
          </a>
          <a href="#about" className="hover:text-emerald-800 transition">
            About
          </a>
        </nav>

        {/* Right Action Buttons matching Image 2 with Sign In */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 transition border border-slate-300 sm:border-transparent whitespace-nowrap bg-white/80 sm:bg-transparent shadow-xs sm:shadow-none"
          >
            Sign In
          </button>
          <button
            onClick={onStartPlanning}
            className="w-8 h-8 rounded-full bg-white/90 border border-slate-200 shadow-sm hidden sm:flex items-center justify-center text-slate-700 hover:text-emerald-800 hover:border-emerald-300 transition"
            title="Explore locations"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
          </button>
          <button
            onClick={onStartPlanning}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/20 hover:shadow-lg transition group whitespace-nowrap"
          >
            <span>Start Planning</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform hidden sm:inline" />
          </button>
        </div>
      </header>

      {/* ── HERO SECTION: Full-Bleed Scenic Visual matching Image 2 ── */}
      <section
        id="hero"
        className="relative min-h-[620px] lg:min-h-[680px] w-full flex flex-col justify-between overflow-hidden"
      >
        {/* Full-bleed background image with smooth ivory fade on left */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero_green_city.jpg"
            alt="Futuristic biophilic green city with river and eco-towers"
            fill
            priority
            className="object-cover object-right-top"
          />

          {/* Smooth multi-stop ivory gradient overlay blending left to right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf8f5] via-[#faf8f5]/85 via-50% to-transparent to-90%" />

          {/* Subtle bottom fade to seamlessly blend into the cards dock */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#faf8f5] via-[#faf8f5]/80 to-transparent" />
        </div>

        {/* Floating handwritten cursive quote in upper right of city visual */}
        <div className="absolute top-10 right-6 sm:right-16 z-10 pointer-events-none hidden md:block animate-fade-in">
          <div className="text-right">
            <span
              className="text-white text-xl sm:text-2xl font-serif italic tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Greener Cities,
              <br />
              Happier Futures ✨
            </span>
          </div>
        </div>

        {/* Hero Left-Weighted Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 pt-12 sm:pt-16 pb-12 flex-1 flex flex-col justify-center">
          <div className="max-w-xl space-y-5 animate-slide-up">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-emerald-600/30 text-emerald-900 text-xs font-semibold shadow-sm">
              <span>🌱 AI for Greener Cities</span>
            </div>

            {/* Main Headline with emerald accent */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-900 tracking-tight leading-[1.12]">
              Turn urban <br />
              challenges into <br />
              <span className="text-[#064e3b] inline-block font-extrabold">
                ecological plans
              </span>
            </h1>

            {/* Supporting description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-lg">
              Search a location, set your goals, and let AI compile spatial
              ecological interventions for a greener, more resilient city.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onStartPlanning}
                className="px-6 py-3 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/20 hover:shadow-xl transition transform hover:-translate-y-0.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowDemoModal(true)}
                className="px-5 py-3 rounded-xl bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 font-bold text-xs sm:text-sm border border-slate-200/90 shadow-sm hover:shadow transition flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 text-emerald-800 fill-emerald-800 ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Floating 4-Card Feature Dock matching Image 2 ── */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1 */}
            <div className="glass-card-light rounded-2xl p-4 flex items-center gap-3.5 transition transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800 shadow-sm">
                <Satellite className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  Real-world Data
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Satellite, weather, terrain
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-card-light rounded-2xl p-4 flex items-center gap-3.5 transition transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800 shadow-sm">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  AI-Powered Compiler
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  From goals to interventions
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-card-light rounded-2xl p-4 flex items-center gap-3.5 transition transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800 shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  Spatial Visualization
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  See interventions on map
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="glass-card-light rounded-2xl p-4 flex items-center gap-3.5 transition transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800 shadow-sm">
                <TreePine className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">
                  Multiple Scenarios
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Flood, biodiversity, balance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: HOW IT WORKS with 3D Rotating & Gallery Cards ── */}
      <section
        id="how-it-works"
        className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full relative z-10"
      >
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300/60 px-3 py-1 rounded-full">
            Autonomous Geospatial Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How the Compiler Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Translating high-dimensional environmental telemetry and municipal goals into
            spatially placed, ground-truthed ecological plans.
          </p>
        </div>

        {/* 3D Rotating Interactive Cards Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 perspective-1000">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isHovered = activeStepTab === idx;

            return (
              <div
                key={step.num}
                onMouseEnter={() => setActiveStepTab(idx)}
                className="group transform-style-3d transition-all duration-500 hover:-translate-y-2 hover:rotate-y-6"
              >
                <div className="glass-card-light rounded-3xl p-6 h-full flex flex-col justify-between border border-white/80 shadow-xl relative overflow-hidden bg-gradient-to-b from-white/90 to-white/60">
                  {/* Subtle corner numbering */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-emerald-900/30 group-hover:text-emerald-700 transition">
                      {step.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-600 p-0.5 mb-4 shadow-md group-hover:scale-110 transition-transform">
                    <div className="w-full h-full bg-[#0a1c14] rounded-[14px] flex items-center justify-center text-emerald-400">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold">
                      {step.subtitle}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {step.desc}
                    </p>
                  </div>

                  {/* Feature highlight footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{step.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 2: FEATURES with Glassmorphic Depth Matrix ── */}
      <section
        id="features"
        className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full relative z-10 border-t border-emerald-900/5"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300/60 px-3 py-1 rounded-full">
              Enterprise Geospatial Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Designed for Urban Planners, Researchers & Municipalities
            </h2>
          </div>
          <button
            onClick={onStartPlanning}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-800 text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <span>Launch Compiler</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass-card-light rounded-3xl p-6 space-y-4 hover:shadow-2xl transition duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Hydrological Runoff Modeling
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Models continuous surface water runoff volume based on landcover permeability,
              slope gradients, and 100-year monsoon precipitation events to position bioswales
              where they intercept the most water.
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-[11px] font-mono text-emerald-800">
              ✓ 1,004,000 L modeled capture per 100mm storm
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-card-light rounded-3xl p-6 space-y-4 hover:shadow-2xl transition duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              True Geospatial Split-View
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Draggable before-and-after spatial divider comparing the baseline municipal site
              directly with the compiled ecological interventions across synchronized MapLibre canvases.
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-[11px] font-mono text-emerald-800">
              ✓ Instant visual inspection of canopy change
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-card-light rounded-3xl p-6 space-y-4 hover:shadow-2xl transition duration-300">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <FolderArchive className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Project Library & GeoJSON Import/Export
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Persistent project workspace backed by Supabase and offline local storage. Export full
              compiled intervention plans as standard GeoJSON or `.uec.json` files for CAD and GIS.
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-[11px] font-mono text-emerald-800">
              ✓ Interoperable with QGIS, ArcGIS, and AutoCAD
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: ABOUT with Metrics & Biophilic Visual ── */}
      <section
        id="about"
        className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full relative z-10 border-t border-emerald-900/5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300/60 px-3 py-1 rounded-full">
              Our Vision
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              AI-Powered Geospatial Planning for Biophilic, Climate-Resilient Cities
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Traditional urban planning cycles require months of manual GIS overlays, hydrologic modeling,
              and stakeholder reconciliation. The Urban Ecology Compiler turns this into an instantaneous,
              AI-orchestrated spatial decision support system.
            </p>

            {/* Impact Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                  1,004,000 L
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Stormwater Interception
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                  +38%
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Corridor Connectivity
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                  48.2 T/yr
                </span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  Carbon Sequestration
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onExploreDemo}
                className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
              >
                <span>Launch Interactive Demo Catchment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Visual Image */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl h-[380px] sm:h-[440px]">
            <Image
              src="/images/biophilic_building.jpg"
              alt="Vertical biophilic forest skyscraper"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
              <div className="text-white space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Autonomous Urban Forestry
                </span>
                <h4 className="text-base font-bold">
                  High-Density Green Corridors & Micro-Catchments
                </h4>
                <p className="text-xs text-slate-300">
                  Physical nature-based interventions designed to respect actual elevation and runoff vectors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/90 bg-white py-10 px-6 sm:px-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <TreePine className="w-4 h-4 text-emerald-800" />
            <span className="font-bold text-slate-900">Urban Ecology Compiler</span>
            <span>•</span>
            <span>Geospatial AI Decision Support</span>
          </div>

          <div className="flex items-center space-x-6">
            <a href="#hero" className="hover:text-emerald-800 transition">
              Home
            </a>
            <a href="#how-it-works" className="hover:text-emerald-800 transition">
              How It Works
            </a>
            <a href="#features" className="hover:text-emerald-800 transition">
              Features
            </a>
            <a href="#about" className="hover:text-emerald-800 transition">
              About
            </a>
          </div>

          <div>
            <span>© {new Date().getFullYear()} Urban Ecology Compiler</span>
          </div>
        </div>
      </footer>

      {/* ── Watch Demo Video Modal ── */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-emerald-800" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Urban Ecology Compiler Walkthrough
                </h4>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white text-center p-6 space-y-3 overflow-hidden">
              <Image
                src="/images/hero_green_city.jpg"
                alt="Demo preview"
                fill
                className="object-cover opacity-40"
              />
              <div className="relative z-10 space-y-3 max-w-md">
                <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 shadow-xl flex items-center justify-center mx-auto cursor-pointer transition transform hover:scale-105">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
                <h5 className="text-sm font-bold">Interactive Product Demo</h5>
                <p className="text-xs text-slate-300">
                  Discover how satellite telemetry, Turf.js spatial modeling, and multi-objective heuristics
                  compile complete urban resilience plans in seconds.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowDemoModal(false);
                  onStartPlanning();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-md hover:bg-emerald-900 transition"
              >
                Start Live Planning →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
