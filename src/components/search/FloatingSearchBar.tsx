'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Sparkles, Navigation, Globe, CornerDownLeft } from 'lucide-react';
import { GeoLocation } from '@/types/geo';

interface FloatingSearchBarProps {
  onSelectLocation: (loc: GeoLocation) => void;
  onLoadDemo?: () => void;
  currentLocationName?: string;
  className?: string;
}

const QUICK_HOTSPOTS: (GeoLocation & { badge?: string })[] = [
  {
    name: 'Metropolitan Urban Catchment',
    formattedAddress: 'Central Resilience Demonstration Zone',
    center: [72.9781, 19.2183],
    zoom: 14,
    placeType: 'city',
    badge: 'HOTSPOT'
  },
  {
    name: 'Chicago Loop & Lakefront',
    formattedAddress: 'Chicago Central & Loop District, IL, USA',
    center: [-87.6298, 41.8781],
    zoom: 13,
    placeType: 'city'
  },
  {
    name: 'Mumbai BKC & Mithi River',
    formattedAddress: 'Bandra Kurla Complex, Mumbai, Maharashtra, India',
    center: [72.8687, 19.0657],
    zoom: 13,
    placeType: 'city'
  },
  {
    name: 'Bengaluru Bellandur Corridor',
    formattedAddress: 'Bellandur / Sarjapur Corridor, Bengaluru, Karnataka, India',
    center: [77.6744, 12.9260],
    zoom: 13,
    placeType: 'city'
  },
  {
    name: 'London Thames Riverfront',
    formattedAddress: 'London, England, United Kingdom',
    center: [-0.1276, 51.5074],
    zoom: 12,
    placeType: 'city'
  },
  {
    name: 'Singapore Marina Bay',
    formattedAddress: 'Singapore Central Catchment & Marina Bay',
    center: [103.8198, 1.3521],
    zoom: 13,
    placeType: 'city'
  }
];

export const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  onSelectLocation,
  onLoadDemo,
  currentLocationName,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchError, setSearchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setResults(data.results);
            setSelectedIndex(0);
          } else {
            setResults([]);
            setSearchError("No locations found. Try a city, address, or lat, lng coordinates.");
          }
        } else {
          setSearchError("Geocoding service unavailable.");
        }
      } catch (err) {
        setSearchError("Failed to search location.");
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation inside search results
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const currentList = results.length > 0 ? results : QUICK_HOTSPOTS;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % currentList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + currentList.length) % currentList.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < currentList.length) {
        handleSelect(currentList[selectedIndex]);
      }
    }
  };

  const handleSelect = (loc: GeoLocation) => {
    onSelectLocation(loc);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-30 w-full max-w-xl mx-auto transition-all duration-300 ${className}`}
    >
      {/* Search Bar Bar Container */}
      <div
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`floating-glass-card transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'ring-2 ring-emerald-500/50 shadow-2xl shadow-emerald-950/30'
            : 'hover:border-slate-600 hover:bg-slate-900/90'
        }`}
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <Search className={`w-4 h-4 shrink-0 transition-colors ${isOpen ? 'text-emerald-400' : 'text-slate-400'}`} />

          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search any global city, neighborhood, or lat, lng..."
              className="w-full bg-transparent border-none text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <div className="flex-1 flex items-center justify-between text-sm text-slate-300">
              <span className="truncate">
                {currentLocationName ? (
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLocationName}</span>
                    <span className="text-xs text-slate-500 ml-1">(Click to change)</span>
                  </span>
                ) : (
                  'Search an urban area or city...'
                )}
              </span>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {loading && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}

            {isOpen && query && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Keyboard shortcut indicator */}
            {!isOpen && (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-800/80 border border-slate-700/80 rounded shadow-inner">
                <span>⌘</span>K
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Results & Hotspots Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 floating-glass-card p-3 shadow-2xl border border-slate-700/90 overflow-hidden animate-slide-up">
          {/* Geocoding Results */}
          {results.length > 0 && (
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Matching Locations ({results.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">↑↓ navigate · ↵ select</span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {results.map((loc, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(loc)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-950/60 border border-emerald-500/50 text-slate-100'
                          : 'hover:bg-slate-800/60 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate text-slate-100">{loc.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{loc.formattedAddress}</div>
                        </div>
                      </div>
                      {loc.placeType && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0 font-mono">
                          {loc.placeType}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {searchError && (
            <div className="px-3 py-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-xl mb-2">
              {searchError}
            </div>
          )}

          {/* Quick Recommended Sites */}
          {results.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Quick Urban Sites
                </span>
                {onLoadDemo && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onLoadDemo();
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                  >
                    Load Preloaded Demo Plan
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {QUICK_HOTSPOTS.map((hotspot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(hotspot)}
                    className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-600/40 transition group flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 truncate">
                        {hotspot.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {hotspot.formattedAddress}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
