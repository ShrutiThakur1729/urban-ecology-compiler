'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  X,
  Loader2,
  Compass,
  ArrowRight,
  CheckCircle2,
  Globe,
  Sparkles
} from 'lucide-react';
import { GeoLocation, SelectedLocation } from '@/types/geo';

interface Step1LocationProps {
  selectedLocation: SelectedLocation | null;
  onSelectLocation: (loc: GeoLocation) => void;
  onConfirmLocation: () => void;
  onLoadDemo: () => void;
}

const SUGGESTED_LOCATIONS: (GeoLocation & { state: string; country: string; thumbnail?: string })[] = [
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    formattedAddress: 'Mumbai, Maharashtra, India',
    center: [72.8777, 19.0760],
    zoom: 13,
    placeType: 'city',
    thumbnail: '/images/city_mumbai.jpg'
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    formattedAddress: 'Bengaluru, Karnataka, India',
    center: [77.5946, 12.9716],
    zoom: 13,
    placeType: 'city',
    thumbnail: '/images/city_bengaluru.jpg'
  },
  {
    name: 'Delhi',
    state: 'NCT',
    country: 'India',
    formattedAddress: 'New Delhi, Delhi, India',
    center: [77.2090, 28.6139],
    zoom: 13,
    placeType: 'city',
    thumbnail: '/images/city_delhi.jpg'
  },
  {
    name: 'Chicago',
    state: 'Illinois',
    country: 'USA',
    formattedAddress: 'Chicago, IL, United States',
    center: [-87.6298, 41.8781],
    zoom: 13,
    placeType: 'city',
    thumbnail: '/images/city_chicago.jpg'
  }
];

export const Step1Location: React.FC<Step1LocationProps> = ({
  selectedLocation,
  onSelectLocation,
  onConfirmLocation,
  onLoadDemo
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (e) {
        console.error('Geocoding failed:', e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* ── Search & Suggested Locations Floating Panel ── */}
      <div
        ref={containerRef}
        className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-30 pointer-events-auto"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-3 transition">
          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search for a city, area or landmark..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : loading ? (
              <Loader2 className="absolute right-3 w-4 h-4 text-emerald-700 animate-spin" />
            ) : null}
          </div>

          {/* Autocomplete Results Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 max-h-60 overflow-y-auto space-y-1">
              {results.map((loc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectLocation(loc);
                    setShowDropdown(false);
                    setQuery('');
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50/80 flex items-center gap-3 transition group"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:scale-105 transition">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{loc.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{loc.formattedAddress}</div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Select →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Suggested Locations Grid (Matching Panel 3 in Reference) ── */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
              <span>Suggested Locations</span>
              <button
                onClick={onLoadDemo}
                className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold capitalize"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Preloaded Demo Hotspot</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUGGESTED_LOCATIONS.map((loc) => {
                const isSelected = selectedLocation?.name === loc.name;
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc);
                      setShowDropdown(false);
                    }}
                    className={`relative text-left p-2.5 rounded-xl border transition group overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-slate-50/80 hover:bg-white border-slate-200/80 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-full h-12 rounded-lg bg-gradient-to-tr from-emerald-900/10 to-teal-800/15 mb-2 overflow-hidden relative">
                      {loc.thumbnail ? (
                        <img
                          src={loc.thumbnail}
                          alt={loc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-800/40">
                          <Globe className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {loc.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {loc.state}, {loc.country}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Location Confirmation Card at Bottom (Matching Reference) ── */}
      {selectedLocation && (
        <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-30 pointer-events-auto animate-slide-up">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase font-bold text-emerald-800 tracking-wider">
                  Location Selected
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {selectedLocation.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedLocation.formattedAddress}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onConfirmLocation}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-900/20 shrink-0"
            >
              <span>Use This Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
