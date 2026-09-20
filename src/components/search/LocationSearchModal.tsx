'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, X, Navigation, Compass, Globe, Check, AlertCircle, Loader2 } from 'lucide-react';
import { GeoLocation } from '@/types/geo';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: GeoLocation) => void;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSearchError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickHotspots: GeoLocation[] = [
    {
      name: 'Chicago, Illinois, United States',
      formattedAddress: 'Chicago Central & Loop District, IL, USA',
      center: [-87.6298, 41.8781],
      zoom: 12,
      placeType: 'city'
    },
    {
      name: 'Thane Central (Naupada & Wagle)',
      formattedAddress: 'Thane West, Maharashtra, India',
      center: [72.9781, 19.2183],
      zoom: 14,
      placeType: 'city'
    },
    {
      name: 'Mumbai BKC & Mithi River Basin',
      formattedAddress: 'Bandra Kurla Complex, Mumbai, Maharashtra, India',
      center: [72.8687, 19.0657],
      zoom: 13,
      placeType: 'city'
    },
    {
      name: 'Bengaluru Bellandur Catchment',
      formattedAddress: 'Bellandur / Sarjapur Corridor, Bengaluru, Karnataka, India',
      center: [77.6744, 12.9260],
      zoom: 13,
      placeType: 'city'
    },
    {
      name: 'London Greater Urban Area',
      formattedAddress: 'London, England, United Kingdom',
      center: [-0.1276, 51.5074],
      zoom: 12,
      placeType: 'city'
    },
    {
      name: 'Singapore Central Region',
      formattedAddress: 'Singapore Urban Catchment & Marina Bay',
      center: [103.8198, 1.3521],
      zoom: 12,
      placeType: 'city'
    }
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setResults(data.results);
        } else {
          setResults([]);
          setSearchError("Couldn't find that location. Try a city, neighbourhood, or coordinates (e.g. 19.2183, 72.9781).");
        }
      } else {
        setSearchError("Failed to search location. Please verify your query or connection.");
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError("Network error while searching location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl border border-slate-700/80 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Select Geographic Site</h3>
              <p className="text-[11px] text-slate-400">Search global cities, districts, or precise coordinates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (searchError) setSearchError(null);
            }}
            placeholder="Search city, town, district or lat, lng (e.g. Chicago, London, 19.2183, 72.9781)..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl glass-input text-xs placeholder:text-slate-500"
            autoFocus
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center space-x-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{loading ? 'Locating...' : 'Search'}</span>
          </button>
        </form>

        {/* Error Notification */}
        {searchError && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Dynamic Search Results */}
        {results.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Search Results ({results.length})
            </span>
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {results.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/50 flex items-start space-x-3 transition group"
                >
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 truncate">
                        {loc.name}
                      </span>
                      {loc.placeType && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {loc.placeType}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm">
                      {loc.formattedAddress}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Global & Indian Urban Hotspots */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Selected Urban Sites</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {quickHotspots.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition flex items-start space-x-2"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400/80 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">{loc.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{loc.formattedAddress}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
