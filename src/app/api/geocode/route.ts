import { NextRequest, NextResponse } from 'next/server';
import { GeoLocation } from '@/types/geo';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
  }

  const cleanQ = query.toLowerCase().trim();

  // 1. Check if query is coordinates "lat, lng" or "lng, lat"
  const coordMatch = cleanQ.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const num1 = parseFloat(coordMatch[1]);
    const num2 = parseFloat(coordMatch[2]);

    let lat = num1;
    let lng = num2;

    // Detect format: If num1 is outside [-90, 90] but in [-180, 180], it's lng, lat
    if (Math.abs(num1) > 90 && Math.abs(num1) <= 180 && Math.abs(num2) <= 90) {
      lng = num1;
      lat = num2;
    }

    // Validate coordinate ranges
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const span = 0.008;
      const result: GeoLocation = {
        name: `Coordinates: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
        formattedAddress: `Precise Geographic Coordinates (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`,
        center: [lng, lat],
        zoom: 16,
        placeType: 'coordinate',
        bbox: { minLng: lng - span, minLat: lat - span, maxLng: lng + span, maxLat: lat + span }
      };
      return NextResponse.json({ results: [result] });
    }
  }

  // 2. Global Curated City Hubs for instant sub-millisecond response
  const predefinedGlobalLocations: Record<string, GeoLocation> = {
    'chicago': {
      name: 'Chicago, Illinois, United States',
      formattedAddress: 'Chicago, Cook County, Illinois, United States',
      center: [-87.6298, 41.8781],
      zoom: 12,
      placeType: 'city',
      bbox: { minLng: -87.75, minLat: 41.80, maxLng: -87.55, maxLat: 41.95 }
    },
    'new york': {
      name: 'New York City, New York, United States',
      formattedAddress: 'New York, United States',
      center: [-74.0060, 40.7128],
      zoom: 12,
      placeType: 'city',
      bbox: { minLng: -74.05, minLat: 40.65, maxLng: -73.90, maxLat: 40.85 }
    },
    'london': {
      name: 'London, Greater London, United Kingdom',
      formattedAddress: 'London, Greater London, England, United Kingdom',
      center: [-0.1276, 51.5074],
      zoom: 12,
      placeType: 'city',
      bbox: { minLng: -0.25, minLat: 51.45, maxLng: 0.05, maxLat: 51.60 }
    },
    'singapore': {
      name: 'Singapore',
      formattedAddress: 'Singapore Central Region, Singapore',
      center: [103.8198, 1.3521],
      zoom: 12,
      placeType: 'city',
      bbox: { minLng: 103.75, minLat: 1.25, maxLng: 103.95, maxLat: 1.45 }
    },
    'thane': {
      name: 'Thane, Maharashtra, India',
      formattedAddress: 'Naupada - Wagle Estate Zone, Thane, Maharashtra, India',
      center: [72.9781, 19.2183],
      zoom: 14,
      placeType: 'city',
      bbox: { minLng: 72.965, minLat: 19.205, maxLng: 72.990, maxLat: 19.230 }
    },
    'mumbai': {
      name: 'Mumbai, Maharashtra, India',
      formattedAddress: 'Bandra-Kurla Complex (BKC), Mumbai, Maharashtra, India',
      center: [72.8687, 19.0657],
      zoom: 13,
      placeType: 'city',
      bbox: { minLng: 72.855, minLat: 19.055, maxLng: 72.880, maxLat: 19.075 }
    },
    'bengaluru': {
      name: 'Bengaluru, Karnataka, India',
      formattedAddress: 'Bellandur & Outer Ring Road, Bengaluru, Karnataka, India',
      center: [77.6744, 12.9260],
      zoom: 13,
      placeType: 'city',
      bbox: { minLng: 77.660, minLat: 12.915, maxLng: 77.690, maxLat: 12.940 }
    },
    'delhi': {
      name: 'New Delhi, Delhi NCR, India',
      formattedAddress: 'Yamuna Floodplain Zone & Central Delhi, India',
      center: [77.2167, 28.6139],
      zoom: 12,
      placeType: 'city',
      bbox: { minLng: 77.200, minLat: 28.600, maxLng: 77.235, maxLat: 28.630 }
    },
    'hyderabad': {
      name: 'Hyderabad, Telangana, India',
      formattedAddress: 'HITEC City & Durgam Cheruvu, Hyderabad, Telangana, India',
      center: [78.3814, 17.4399],
      zoom: 13,
      placeType: 'city',
      bbox: { minLng: 78.365, minLat: 17.425, maxLng: 78.395, maxLat: 17.455 }
    },
    'pune': {
      name: 'Pune, Maharashtra, India',
      formattedAddress: 'Kalyani Nagar / Mula-Mutha Riverfront, Pune, Maharashtra, India',
      center: [73.8967, 18.5362],
      zoom: 13,
      placeType: 'city',
      bbox: { minLng: 73.85, minLat: 18.50, maxLng: 73.95, maxLat: 18.58 }
    }
  };

  // Check exact instant match
  for (const [key, loc] of Object.entries(predefinedGlobalLocations)) {
    if (cleanQ === key || cleanQ === `${key}, india` || cleanQ === `${key}, us` || cleanQ === `${key}, usa`) {
      return NextResponse.json({ results: [loc] });
    }
  }

  // 3. Live Global Nominatim Geocoding (Prioritizing cities, towns, administrative boundaries)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=8`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'UrbanEcologyCompiler/1.0 (urban-decision-support)'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Sort results: place/administrative boundaries (cities, towns, counties) rank ahead of individual shops/POIs
        const placeTypeRank: Record<string, number> = {
          city: 1,
          administrative: 2,
          town: 3,
          suburb: 4,
          neighbourhood: 5,
          village: 6,
          county: 7,
          state: 8,
          country: 9
        };

        const sortedData = [...data].sort((a, b) => {
          const typeA = a.type || a.addresstype || a.class || 'other';
          const typeB = b.type || b.addresstype || b.class || 'other';
          const rankA = placeTypeRank[typeA] || 99;
          const rankB = placeTypeRank[typeB] || 99;
          return rankA - rankB;
        });

        const results: GeoLocation[] = sortedData.map((item: any) => {
          const itemType = item.type || item.addresstype || item.class || 'site';
          const name = item.name || item.display_name.split(',')[0];
          const addressParts = item.display_name.split(',').map((s: string) => s.trim());
          const cleanName = addressParts.slice(0, 3).join(', ');

          // Determine sensible zoom level dynamically based on place type
          let zoom = 13;
          if (itemType === 'city' || itemType === 'administrative' || itemType === 'county') {
            zoom = 12;
          } else if (itemType === 'town' || itemType === 'suburb') {
            zoom = 13.5;
          } else if (itemType === 'neighbourhood' || itemType === 'village') {
            zoom = 15;
          } else if (itemType === 'building' || itemType === 'poi') {
            zoom = 16;
          }

          const lng = parseFloat(item.lon);
          const lat = parseFloat(item.lat);

          return {
            name: cleanName,
            formattedAddress: item.display_name,
            center: [lng, lat],
            zoom,
            placeType: itemType,
            bbox: item.boundingbox
              ? {
                  minLat: parseFloat(item.boundingbox[0]),
                  maxLat: parseFloat(item.boundingbox[1]),
                  minLng: parseFloat(item.boundingbox[2]),
                  maxLng: parseFloat(item.boundingbox[3])
                }
              : undefined
          };
        });

        return NextResponse.json({ results });
      }
    }
  } catch (err) {
    console.warn('Live global geocode query error:', err);
  }

  // 4. If query matched a substring in predefined, return it
  for (const [key, loc] of Object.entries(predefinedGlobalLocations)) {
    if (cleanQ.includes(key)) {
      return NextResponse.json({ results: [loc] });
    }
  }

  return NextResponse.json({
    results: [],
    error: "Couldn't find that location. Try a city, neighbourhood, or coordinates."
  });
}
