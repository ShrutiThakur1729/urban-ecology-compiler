import { SiteAnalysisData } from '@/types/analysis';
import { OptimizationResult } from '@/types/scenarios';
import { SitePolygon } from '@/types/geo';

export const THANE_DEMO_SITE_POLYGON: SitePolygon = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [72.9720, 19.2130],
      [72.9840, 19.2130],
      [72.9840, 19.2230],
      [72.9720, 19.2230],
      [72.9720, 19.2130]
    ]]
  },
  properties: {
    name: 'Thane Central Urban Zone (Naupada & Wagle Estate Edge)',
    areaSquareMeters: 1320000, // ~132 hectares
    areaHectares: 132,
    perimeterMeters: 4600,
    createdAt: new Date().toISOString()
  }
};

export const THANE_DEMO_ANALYSIS: SiteAnalysisData = {
  siteAreaSquareMeters: 1320000,
  siteAreaHectares: 132,
  centerCoordinates: [72.9781, 19.2183],
  metrics: {
    existingGreenCoveragePercent: {
      name: 'Existing Green Coverage',
      value: 14.2,
      formattedValue: '14.2%',
      unit: '%',
      classification: 'VULNERABLE',
      description: 'Calculated from Sentinel-2 NDVI > 0.35 and OpenStreetMap mapped parks & gardens.',
      provenance: {
        category: 'DERIVED',
        source: 'Sentinel-2 L2A & OpenStreetMap',
        date: '2026-09-18',
        method: 'NDVI pixel thresholding combined with polygon rasterization',
        confidence: 'HIGH'
      }
    },
    builtUpImperviousPercent: {
      name: 'Built-up / Impervious Surface',
      value: 71.8,
      formattedValue: '71.8%',
      unit: '%',
      classification: 'CRITICAL',
      description: 'Paved surfaces, concrete roofs, and asphalt roads preventing natural water infiltration.',
      provenance: {
        category: 'DERIVED',
        source: 'OpenStreetMap Building Footprints & Road Network',
        date: '2026-09-15',
        method: 'Vector polygon aggregation and buffer coverage',
        confidence: 'HIGH'
      }
    },
    vegetationHealthNDVI: {
      name: 'Vegetation Health (Mean NDVI)',
      value: 0.28,
      formattedValue: '0.28',
      unit: 'NDVI index',
      classification: 'MODERATE',
      description: 'Normalized Difference Vegetation Index indicating low-to-moderate vitality in fragmented street trees.',
      provenance: {
        category: 'DERIVED',
        source: 'Sentinel-2 Multispectral Instrument (B8 NIR, B4 Red)',
        date: '2026-09-18',
        method: '(NIR - Red) / (NIR + Red) 10m spatial resolution',
        confidence: 'HIGH'
      }
    },
    waterPresenceSqMeters: {
      name: 'Surface Water Bodies & Nallahs',
      value: 18400,
      formattedValue: '18,400 m²',
      unit: 'm²',
      classification: 'VULNERABLE',
      description: 'Open drainage channels and minor retention ponds connected to the Thane Creek catchment.',
      provenance: {
        category: 'OBSERVED',
        source: 'OpenStreetMap Hydrography Layer',
        date: '2026-09-10',
        method: 'Direct vector observation',
        confidence: 'HIGH'
      }
    },
    averageSlopePercent: {
      name: 'Mean Terrain Slope',
      value: 3.4,
      formattedValue: '3.4%',
      unit: '%',
      classification: 'MODERATE',
      description: 'Gentle slope draining eastwards toward low-lying retention zones.',
      provenance: {
        category: 'DERIVED',
        source: 'OpenElevation / SRTM DEM 30m',
        date: '2026-01-01',
        method: 'Neighborhood gradient vector analysis',
        confidence: 'MEDIUM'
      }
    },
    runoffVulnerabilityScore: {
      name: 'Monsoon Runoff Vulnerability',
      value: 84,
      formattedValue: '84 / 100',
      unit: 'Index',
      classification: 'CRITICAL',
      description: 'Extreme flash-flood vulnerability during high-intensity 60mm/hr monsoon downpours.',
      provenance: {
        category: 'DERIVED',
        source: 'Hydrological Proxy (Open-Meteo + DEM + Impervious Surface)',
        date: '2026-09-20',
        method: 'Rational method surface runoff coefficient weighted by slope and imperviousness',
        confidence: 'HIGH'
      }
    },
    heatVulnerabilityIndex: {
      name: 'Urban Heat Island Proxy',
      value: 78,
      formattedValue: '+4.2°C UHI delta',
      unit: '°C delta',
      classification: 'CRITICAL',
      description: 'Microclimatic temperature excess compared to surrounding Yeoor Hills baseline.',
      provenance: {
        category: 'DERIVED',
        source: 'Open-Meteo & Impervious Surface Matrix',
        date: '2026-09-20',
        method: 'Thermal mass retention and lack of evapotranspiration modeling',
        confidence: 'HIGH'
      }
    },
    greenFragmentationIndex: {
      name: 'Green Space Fragmentation',
      value: 0.82,
      formattedValue: '0.82 (High)',
      unit: '0-1 scale',
      classification: 'VULNERABLE',
      description: 'Small isolated green patches unable to sustain urban biodiversity corridors.',
      provenance: {
        category: 'DERIVED',
        source: 'Landscape Metrics / Spatial Graph Analysis',
        date: '2026-09-20',
        method: 'Nearest-neighbor distance and patch perimeter-to-area ratio',
        confidence: 'HIGH'
      }
    },
    ecologicalConnectivityScore: {
      name: 'Ecological Connectivity Potential',
      value: 32,
      formattedValue: '32 / 100',
      unit: 'Index',
      classification: 'VULNERABLE',
      description: 'Significant potential to reconnect roadside verges to nearby Sanjay Gandhi National Park buffer.',
      provenance: {
        category: 'DERIVED',
        source: 'Graph Theoretic Least-Cost Path Analysis',
        date: '2026-09-20',
        method: 'Multi-criteria corridor resistance surface modeling',
        confidence: 'MEDIUM'
      }
    },
    availableInterventionZoneSqMeters: {
      name: 'Available Intervention Area',
      value: 184500,
      formattedValue: '184,500 m²',
      unit: 'm²',
      classification: 'OPTIMAL',
      description: 'Unutilized municipal roadside verges, low-lying drainage easements, and flat commercial roofs.',
      provenance: {
        category: 'DERIVED',
        source: 'Spatial Gap Analysis (OSM + Site Bounds)',
        date: '2026-09-20',
        method: 'Negative spatial buffer masking of active roads and existing building footprints',
        confidence: 'HIGH'
      }
    }
  },
  providers: {
    osm: {
      buildings: { type: 'FeatureCollection', features: [] },
      roads: { type: 'FeatureCollection', features: [] },
      waterways: { type: 'FeatureCollection', features: [] },
      greenSpaces: { type: 'FeatureCollection', features: [] },
      rawFeatureCount: 482,
      provenance: {
        category: 'OBSERVED',
        source: 'OpenStreetMap Overpass API',
        date: '2026-09-20',
        method: 'Bounding box query (buildings, highways, leisure, waterways)'
      }
    },
    sentinel: {
      sceneId: 'S2B_MSIL2A_20260918T054639_N0511_R062_T43QDA',
      acquisitionDate: '2026-09-18T06:12:00Z',
      cloudCoveragePercent: 4.8,
      meanNDVI: 0.28,
      ndviMin: 0.05,
      ndviMax: 0.68,
      vegetatedFraction: 0.142,
      isCachedDemo: false,
      provenance: {
        category: 'OBSERVED',
        source: 'Copernicus Data Space Sentinel-2 L2A',
        date: '2026-09-18',
        method: 'Bottom-Of-Atmosphere reflectance 10m bands 4, 8'
      }
    },
    weather: {
      currentTemperatureC: 31.4,
      maxSummerTemperatureC: 39.8,
      annualPrecipitationMm: 2450,
      monsoonPrecipitationMm: 2180,
      peakHourlyRainfallMm: 62.5,
      solarRadiationKWhM2: 5.4,
      windSpeedKmH: 14.2,
      relativeHumidityPercent: 78,
      urbanHeatIslandProxyDeltaC: 4.2,
      provenance: {
        category: 'OBSERVED',
        source: 'Open-Meteo Historical & Climate Reanalysis',
        date: '2026-09-20',
        method: 'ERA5-Land reanalysis dataset aggregation'
      }
    },
    elevation: {
      minElevationMeters: 8.5,
      maxElevationMeters: 26.2,
      meanElevationMeters: 14.8,
      slopePercent: 3.4,
      steepestDirectionDeg: 105,
      runoffVulnerabilityProxy: 'EXTREME',
      lowPoints: [
        { coordinate: [72.9790, 19.2150], elevation: 8.5 },
        { coordinate: [72.9825, 19.2195], elevation: 9.1 }
      ],
      elevationGridSampleCount: 144,
      provenance: {
        category: 'OBSERVED',
        source: 'SRTM / OpenElevation DEM',
        date: '2026-01-01',
        method: 'Bilinear interpolation from 30m grid'
      }
    }
  },
  analyzedAt: new Date().toISOString()
};

export const THANE_DEMO_OPTIMIZED_SCENARIOS: OptimizationResult = {
  activeScenarioType: 'FLOOD_FIRST',
  generatedAt: new Date().toISOString(),
  scenarios: {
    floodFirst: {
      id: 'sc-flood-01',
      type: 'FLOOD_FIRST',
      title: 'Monsoon Sponge & Infiltration Priority',
      tagline: 'Maximizes stormwater absorption, bioswales, and rain gardens along drainage pathways.',
      description: 'Prioritizes bioswales along roadside easements, deep-infiltration rain gardens in low-lying quadrants, and permeable pavement replacements at public parking hubs.',
      totalCostInr: 4480000,
      budgetUtilizationPercent: 89.6,
      interventions: [
        {
          id: 'int-rg-1',
          interventionId: 'rain_garden',
          name: 'Naupada Depression Rain Garden Basin',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9760, 19.2145],
              [72.9795, 19.2145],
              [72.9795, 19.2165],
              [72.9760, 19.2165],
              [72.9760, 19.2145]
            ]]
          },
          properties: {
            areaSqMeters: 7400,
            estimatedCostInr: 1110000,
            runoffInterceptionLiters: 370000,
            coolingImpactCelsius: 0.8,
            biodiversityScore: 7.5,
            feasibilityScore: 0.94,
            suitabilityReason: 'Natural topographic low-point draining 3 surrounding sectors; zero building conflict.',
            colorHex: '#0284c7'
          }
        },
        {
          id: 'int-bio-1',
          interventionId: 'bioswale',
          name: 'LBS Marg Vegetated Bioswale Strip',
          geometry: {
            type: 'LineString',
            coordinates: [
              [72.9730, 19.2180],
              [72.9775, 19.2182],
              [72.9820, 19.2185]
            ]
          },
          properties: {
            areaSqMeters: 2800,
            lengthMeters: 980,
            estimatedCostInr: 882000,
            runoffInterceptionLiters: 196000,
            coolingImpactCelsius: 0.6,
            biodiversityScore: 6.8,
            feasibilityScore: 0.91,
            suitabilityReason: 'Roadside municipal verge with high stormwater velocity heading into blocked culverts.',
            colorHex: '#0d9488'
          }
        },
        {
          id: 'int-perm-1',
          interventionId: 'permeable_pavement',
          name: 'Commercial Zone Permeable Retrofit',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9800, 19.2190],
              [72.9830, 19.2190],
              [72.9830, 19.2210],
              [72.9800, 19.2210],
              [72.9800, 19.2190]
            ]]
          },
          properties: {
            areaSqMeters: 5500,
            estimatedCostInr: 1210000,
            runoffInterceptionLiters: 220000,
            coolingImpactCelsius: 1.1,
            biodiversityScore: 3.0,
            feasibilityScore: 0.88,
            suitabilityReason: 'Converts impervious asphalt parking into high-capacity interlocking porous paver matrix.',
            colorHex: '#f59e0b'
          }
        },
        {
          id: 'int-tc-1',
          interventionId: 'tree_corridor',
          name: 'East-West Shaded Tree Canopy Link',
          geometry: {
            type: 'LineString',
            coordinates: [
              [72.9735, 19.2140],
              [72.9785, 19.2155],
              [72.9835, 19.2160]
            ]
          },
          properties: {
            areaSqMeters: 3800,
            lengthMeters: 1100,
            estimatedCostInr: 760000,
            runoffInterceptionLiters: 114000,
            coolingImpactCelsius: 1.8,
            biodiversityScore: 8.2,
            feasibilityScore: 0.95,
            suitabilityReason: 'Multi-tiered native trees (Neem, Gulmohar, Karanj) providing rainfall interception and shade.',
            colorHex: '#10b981'
          }
        },
        {
          id: 'int-gr-1',
          interventionId: 'green_roof',
          name: 'Municipal & Institutional Green Roofs',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9740, 19.2200],
              [72.9765, 19.2200],
              [72.9765, 19.2220],
              [72.9740, 19.2220],
              [72.9740, 19.2200]
            ]]
          },
          properties: {
            areaSqMeters: 2600,
            estimatedCostInr: 518000,
            runoffInterceptionLiters: 104000,
            coolingImpactCelsius: 2.2,
            biodiversityScore: 6.0,
            feasibilityScore: 0.85,
            suitabilityReason: 'Extensive lightweight sedum/grass matting on verified flat public concrete slab buildings.',
            colorHex: '#84cc16'
          }
        }
      ],
      impact: {
        totalEstimatedCostInr: {
          name: 'Total Scenario Cost',
          value: 4480000,
          formattedValue: '₹44.8 Lakh',
          unit: 'INR',
          provenance: {
            category: 'MODELED',
            source: 'CPWD Standard Schedule of Rates (Green Infrastructure Proxy)',
            date: '2026-09-20',
            method: 'Unit area itemized costing model'
          }
        },
        totalAreaIntervenedSqMeters: {
          name: 'Active Intervention Footprint',
          value: 22100,
          formattedValue: '22,100 m²',
          unit: 'm²',
          provenance: {
            category: 'MODELED',
            source: 'Spatial Intervention Engine',
            date: '2026-09-20',
            method: 'Sum of candidate polygon and buffered line areas'
          }
        },
        canopyIncreasePercent: {
          name: 'Tree Canopy Increase',
          value: 4.8,
          formattedValue: '+4.8%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Urban Forest Growth Projection (3-5 Year Maturity)',
            date: '2026-09-20',
            method: 'Crown radius projection at maturity'
          }
        },
        permeableSurfaceIncreasePercent: {
          name: 'Permeable Infiltration Surface Added',
          value: 11.6,
          formattedValue: '+11.6%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Hydrological Surface Model',
            date: '2026-09-20',
            method: 'Porous area replacement ratio against total site area'
          }
        },
        stormwaterRunoffMitigationLiters: {
          name: 'Modeled Stormwater Interception',
          value: 1004000,
          formattedValue: '1,004,000 L',
          unit: 'Liters / 50mm storm event',
          provenance: {
            category: 'MODELED',
            source: 'SCS-CN Hydrological Runoff Estimation',
            date: '2026-09-20',
            method: 'Curve number reduction applied to intervened catchment basins'
          }
        },
        peakMicroclimateTempReductionC: {
          name: 'Modeled Microclimate Cooling',
          value: 1.4,
          formattedValue: '-1.4°C',
          unit: '°C',
          provenance: {
            category: 'MODELED',
            source: 'Evapotranspirative Cooling Microclimate Model',
            date: '2026-09-20',
            method: 'Urban canopy energy balance simulation'
          }
        },
        biodiversityConnectivityIndexGain: {
          name: 'Ecological Connectivity Gain',
          value: 38,
          formattedValue: '+38%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Circuitscape Resistance Surface Model',
            date: '2026-09-20',
            method: 'Current density increase through newly connected ecological nodes'
          }
        },
        annualCo2SequestrationKg: {
          name: 'Annual Carbon Sequestration',
          value: 48200,
          formattedValue: '48.2 Tons/yr',
          unit: 'kg CO₂/yr',
          provenance: {
            category: 'MODELED',
            source: 'i-Tree Biomass Accumulation Lookup',
            date: '2026-09-20',
            method: 'Species-specific biomass growth equation'
          }
        }
      },
      tradeoffs: {
        pros: [
          'Directly prevents waterlogging across 3 critical road junctions during monsoon downpours',
          'High water infiltration recharges local unconfined aquifer table',
          'Utilizes existing unbuilt low easements without requiring land acquisition or building demolition'
        ],
        cons: [
          'Bioswales require pre-monsoon desilting and maintenance checks',
          'Slightly lower immediate canopy shade compared to dense pocket forests'
        ],
        riskFactors: [
          'High silt loads in early monsoon require sediment traps at bioswale inlets'
        ]
      },
      assumptions: [
        '50mm rainfall event in a 2-hour window based on Open-Meteo monsoon averages',
        'Subsoil infiltration rate average of 15 mm/hr for Thane coastal alluvium',
        'No structural modifications needed for selected extensive lightweight green roofs (< 100 kg/m² wet weight)'
      ],
      limitations: 'Cost figures are scenario approximations based on CPWD schedule of rates and should not be used as final civil contracting estimates.'
    },
    balanced: {
      id: 'sc-balanced-01',
      type: 'BALANCED',
      title: 'Integrated Climate-Adaptive Resilient Plan',
      tagline: 'Equal balance of monsoon flood detention, heat island cooling, and wildlife corridor continuity.',
      description: 'Coordinates street-canopy corridors with pocket forests, bioswales, and pollinator hubs to create a multi-benefit urban ecosystem within budget.',
      totalCostInr: 4950000,
      budgetUtilizationPercent: 99.0,
      interventions: [
        {
          id: 'int-bal-pf-1',
          interventionId: 'pocket_forest',
          name: 'Miyawaki Native Pocket Forest',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9730, 19.2135],
              [72.9760, 19.2135],
              [72.9760, 19.2160],
              [72.9730, 19.2160],
              [72.9730, 19.2135]
            ]]
          },
          properties: {
            areaSqMeters: 6200,
            estimatedCostInr: 1550000,
            runoffInterceptionLiters: 186000,
            coolingImpactCelsius: 2.6,
            biodiversityScore: 9.8,
            feasibilityScore: 0.92,
            suitabilityReason: 'High density 3-tiered native planting on vacant municipal buffer land.',
            colorHex: '#059669'
          }
        },
        {
          id: 'int-bal-tc-1',
          interventionId: 'tree_corridor',
          name: 'Thane Arterial Green Spine',
          geometry: {
            type: 'LineString',
            coordinates: [
              [72.9730, 19.2175],
              [72.9785, 19.2185],
              [72.9835, 19.2195]
            ]
          },
          properties: {
            areaSqMeters: 4500,
            lengthMeters: 1350,
            estimatedCostInr: 900000,
            runoffInterceptionLiters: 135000,
            coolingImpactCelsius: 2.1,
            biodiversityScore: 8.5,
            feasibilityScore: 0.94,
            suitabilityReason: 'Continuous continuous canopy connection linking western edge to eastern creek buffer.',
            colorHex: '#10b981'
          }
        },
        {
          id: 'int-bal-rg-1',
          interventionId: 'rain_garden',
          name: 'South Sector Water Catchment Basin',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9770, 19.2140],
              [72.9800, 19.2140],
              [72.9800, 19.2160],
              [72.9770, 19.2160],
              [72.9770, 19.2140]
            ]]
          },
          properties: {
            areaSqMeters: 5200,
            estimatedCostInr: 780000,
            runoffInterceptionLiters: 260000,
            coolingImpactCelsius: 0.9,
            biodiversityScore: 7.2,
            feasibilityScore: 0.95,
            suitabilityReason: 'Retains localized surface runoff while providing wetland flora sanctuary.',
            colorHex: '#0284c7'
          }
        },
        {
          id: 'int-bal-pol-1',
          interventionId: 'pollinator_garden',
          name: 'Community Pollinator Stepping Stone',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9810, 19.2205],
              [72.9835, 19.2205],
              [72.9835, 19.2225],
              [72.9810, 19.2225],
              [72.9810, 19.2205]
            ]]
          },
          properties: {
            areaSqMeters: 3100,
            estimatedCostInr: 465000,
            runoffInterceptionLiters: 62000,
            coolingImpactCelsius: 0.7,
            biodiversityScore: 9.4,
            feasibilityScore: 0.96,
            suitabilityReason: 'Flowering perennial native shrubs supporting bees, butterflies, and urban avifauna.',
            colorHex: '#ec4899'
          }
        },
        {
          id: 'int-bal-gr-1',
          interventionId: 'green_roof',
          name: 'Institutional Rooftop Cooling Network',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9750, 19.2195],
              [72.9780, 19.2195],
              [72.9780, 19.2215],
              [72.9750, 19.2215],
              [72.9750, 19.2195]
            ]]
          },
          properties: {
            areaSqMeters: 4200,
            estimatedCostInr: 840000,
            runoffInterceptionLiters: 168000,
            coolingImpactCelsius: 2.4,
            biodiversityScore: 6.4,
            feasibilityScore: 0.86,
            suitabilityReason: 'Cooling rooftop vegetation over large government and educational buildings.',
            colorHex: '#84cc16'
          }
        },
        {
          id: 'int-bal-gb-1',
          interventionId: 'green_buffer',
          name: 'Railway Line Noise & Particulate Green Buffer',
          geometry: {
            type: 'LineString',
            coordinates: [
              [72.9725, 19.2200],
              [72.9725, 19.2230]
            ]
          },
          properties: {
            areaSqMeters: 2100,
            lengthMeters: 450,
            estimatedCostInr: 415000,
            runoffInterceptionLiters: 42000,
            coolingImpactCelsius: 1.2,
            biodiversityScore: 7.0,
            feasibilityScore: 0.90,
            suitabilityReason: 'Dense evergreen shrub barrier trapping PM2.5 and dampening railway noise.',
            colorHex: '#14b8a6'
          }
        }
      ],
      impact: {
        totalEstimatedCostInr: {
          name: 'Total Scenario Cost',
          value: 4950000,
          formattedValue: '₹49.5 Lakh',
          unit: 'INR',
          provenance: {
            category: 'MODELED',
            source: 'Cost Engine Optimization Model',
            date: '2026-09-20',
            method: 'Multi-objective knapsack optimization'
          }
        },
        totalAreaIntervenedSqMeters: {
          name: 'Active Intervention Footprint',
          value: 25300,
          formattedValue: '25,300 m²',
          unit: 'm²',
          provenance: {
            category: 'MODELED',
            source: 'Spatial Intervention Engine',
            date: '2026-09-20',
            method: 'Total aggregated intervention footprint'
          }
        },
        canopyIncreasePercent: {
          name: 'Tree Canopy Increase',
          value: 6.2,
          formattedValue: '+6.2%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Canopy Model',
            date: '2026-09-20',
            method: 'Projected 5-year mature canopy projection'
          }
        },
        permeableSurfaceIncreasePercent: {
          name: 'Permeable Infiltration Surface Added',
          value: 9.4,
          formattedValue: '+9.4%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Hydrological Surface Model',
            date: '2026-09-20',
            method: 'Ground surface permeability conversion'
          }
        },
        stormwaterRunoffMitigationLiters: {
          name: 'Modeled Stormwater Interception',
          value: 853000,
          formattedValue: '853,000 L',
          unit: 'Liters / 50mm storm event',
          provenance: {
            category: 'MODELED',
            source: 'SCS-CN Hydrological Model',
            date: '2026-09-20',
            method: 'Retention calculation'
          }
        },
        peakMicroclimateTempReductionC: {
          name: 'Modeled Microclimate Cooling',
          value: 1.9,
          formattedValue: '-1.9°C',
          unit: '°C',
          provenance: {
            category: 'MODELED',
            source: 'Microclimate Energy Model',
            date: '2026-09-20',
            method: 'Urban canopy temperature reduction calculation'
          }
        },
        biodiversityConnectivityIndexGain: {
          name: 'Ecological Connectivity Gain',
          value: 54,
          formattedValue: '+54%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Landscape Connectivity Graph Model',
            date: '2026-09-20',
            method: 'Stepping stone matrix analysis'
          }
        },
        annualCo2SequestrationKg: {
          name: 'Annual Carbon Sequestration',
          value: 68400,
          formattedValue: '68.4 Tons/yr',
          unit: 'kg CO₂/yr',
          provenance: {
            category: 'MODELED',
            source: 'Biomass Sequestration Model',
            date: '2026-09-20',
            method: 'Species-specific tree & soil carbon accumulation'
          }
        }
      },
      tradeoffs: {
        pros: [
          'Achieves highest combined composite score across flood mitigation, cooling, and biodiversity',
          'Creates a contiguous ecological corridor from west to east',
          'Delivers maximum visible public greening per rupee spent'
        ],
        cons: [
          'Budget utilization is close to the ₹50 Lakh cap',
          'Requires coordinated community maintenance across varied intervention types'
        ],
        riskFactors: [
          'Pocket forest requires regular sapling watering during first 2 non-monsoon dry seasons'
        ]
      },
      assumptions: [
        'Native species survival rate of 88% under basic municipal maintenance',
        'Balanced multi-benefit weighting (35% flood, 35% heat, 30% biodiversity)'
      ],
      limitations: 'All benefits are computational scenario estimates and depend on local soil percolation and sapling maturity.'
    },
    biodiversityFirst: {
      id: 'sc-bio-01',
      type: 'BIODIVERSITY_FIRST',
      title: 'Urban Rewilding & Habitat Corridors',
      tagline: 'Focuses on high-density native pocket forests, pollinator waystations, and contiguous canopy links.',
      description: 'Maximizes ecological habitat complexity, endemic plant species diversity, and bird/pollinator corridors connecting urban Thane to the Western Ghats periphery.',
      totalCostInr: 4720000,
      budgetUtilizationPercent: 94.4,
      interventions: [
        {
          id: 'int-bio-pf-1',
          interventionId: 'pocket_forest',
          name: 'West Boundary Rewilding Sanctuary',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9720, 19.2130],
              [72.9765, 19.2130],
              [72.9765, 19.2165],
              [72.9720, 19.2165],
              [72.9720, 19.2130]
            ]]
          },
          properties: {
            areaSqMeters: 9200,
            estimatedCostInr: 2300000,
            runoffInterceptionLiters: 276000,
            coolingImpactCelsius: 3.1,
            biodiversityScore: 10.0,
            feasibilityScore: 0.94,
            suitabilityReason: 'Ultra-dense Miyawaki forest with 35+ native Western Ghats species (Jamun, Mahua, Kadamba, Banyan).',
            colorHex: '#059669'
          }
        },
        {
          id: 'int-bio-pol-1',
          interventionId: 'pollinator_garden',
          name: 'Central Flora & Pollinator Hub',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9780, 19.2170],
              [72.9815, 19.2170],
              [72.9815, 19.2195],
              [72.9780, 19.2195],
              [72.9780, 19.2170]
            ]]
          },
          properties: {
            areaSqMeters: 4800,
            estimatedCostInr: 720000,
            runoffInterceptionLiters: 96000,
            coolingImpactCelsius: 1.1,
            biodiversityScore: 9.6,
            feasibilityScore: 0.96,
            suitabilityReason: 'Native flowering perennials and host plants for 40+ local butterfly species.',
            colorHex: '#ec4899'
          }
        },
        {
          id: 'int-bio-tc-1',
          interventionId: 'tree_corridor',
          name: 'Canopy Corridor & Wildlife Overpass Link',
          geometry: {
            type: 'LineString',
            coordinates: [
              [72.9725, 19.2170],
              [72.9780, 19.2190],
              [72.9838, 19.2210]
            ]
          },
          properties: {
            areaSqMeters: 5100,
            lengthMeters: 1420,
            estimatedCostInr: 1020000,
            runoffInterceptionLiters: 153000,
            coolingImpactCelsius: 2.3,
            biodiversityScore: 9.1,
            feasibilityScore: 0.93,
            suitabilityReason: 'Continuous fruit and nectar-bearing tree canopy facilitating bird movement across road barriers.',
            colorHex: '#10b981'
          }
        },
        {
          id: 'int-bio-gb-1',
          interventionId: 'green_buffer',
          name: 'Thane Creek Buffer Sanctuary',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [72.9815, 19.2130],
              [72.9840, 19.2130],
              [72.9840, 19.2160],
              [72.9815, 19.2160],
              [72.9815, 19.2130]
            ]]
          },
          properties: {
            areaSqMeters: 4500,
            estimatedCostInr: 680000,
            runoffInterceptionLiters: 90000,
            coolingImpactCelsius: 1.5,
            biodiversityScore: 8.8,
            feasibilityScore: 0.91,
            suitabilityReason: 'Dense mangrove associate and riparian buffer shielding wetland biodiversity.',
            colorHex: '#14b8a6'
          }
        }
      ],
      impact: {
        totalEstimatedCostInr: {
          name: 'Total Scenario Cost',
          value: 4720000,
          formattedValue: '₹47.2 Lakh',
          unit: 'INR',
          provenance: {
            category: 'MODELED',
            source: 'Biodiversity Optimization Model',
            date: '2026-09-20',
            method: 'Ecological habitat area valuation'
          }
        },
        totalAreaIntervenedSqMeters: {
          name: 'Active Intervention Footprint',
          value: 23600,
          formattedValue: '23,600 m²',
          unit: 'm²',
          provenance: {
            category: 'MODELED',
            source: 'Spatial Intervention Engine',
            date: '2026-09-20',
            method: 'Spatial rewilding footprint aggregation'
          }
        },
        canopyIncreasePercent: {
          name: 'Tree Canopy Increase',
          value: 8.4,
          formattedValue: '+8.4%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Forest Density Growth Model',
            date: '2026-09-20',
            method: 'Multi-tiered canopy volume estimation'
          }
        },
        permeableSurfaceIncreasePercent: {
          name: 'Permeable Infiltration Surface Added',
          value: 8.2,
          formattedValue: '+8.2%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Hydrological Surface Model',
            date: '2026-09-20',
            method: 'Rewilded topsoil surface addition'
          }
        },
        stormwaterRunoffMitigationLiters: {
          name: 'Modeled Stormwater Interception',
          value: 615000,
          formattedValue: '615,000 L',
          unit: 'Liters / 50mm storm event',
          provenance: {
            category: 'MODELED',
            source: 'Vegetative Canopy & Leaf Litter Absorption Model',
            date: '2026-09-20',
            method: 'Interception calculation'
          }
        },
        peakMicroclimateTempReductionC: {
          name: 'Modeled Microclimate Cooling',
          value: 2.3,
          formattedValue: '-2.3°C',
          unit: '°C',
          provenance: {
            category: 'MODELED',
            source: 'Dense Canopy Microclimate Model',
            date: '2026-09-20',
            method: 'Shading and transpiration cooling simulation'
          }
        },
        biodiversityConnectivityIndexGain: {
          name: 'Ecological Connectivity Gain',
          value: 82,
          formattedValue: '+82%',
          unit: '%',
          provenance: {
            category: 'MODELED',
            source: 'Circuitscape Connectivity Index',
            date: '2026-09-20',
            method: 'Corridor permeability and focal species dispersal modeling'
          }
        },
        annualCo2SequestrationKg: {
          name: 'Annual Carbon Sequestration',
          value: 94600,
          formattedValue: '94.6 Tons/yr',
          unit: 'kg CO₂/yr',
          provenance: {
            category: 'MODELED',
            source: 'Miyawaki High-Density Biomass Model',
            date: '2026-09-20',
            method: 'High-density multi-strata biomass calculations'
          }
        }
      },
      tradeoffs: {
        pros: [
          'Highest possible biodiversity gain (+82%) and carbon capture (94.6 T/yr)',
          'Maximum urban heat island mitigation (-2.3°C peak cooling in dense shade)',
          'Creates a genuine stepping-stone habitat for Western Ghats avifauna'
        ],
        cons: [
          'Lower direct engineered stormwater interception compared to dedicated bioswales & rain gardens',
          'Miyawaki forests require dedicated fencing and protection during initial 24 months'
        ],
        riskFactors: [
          'Invasive plant species encroachment if initial weeding is neglected'
        ]
      },
      assumptions: [
        'Density of 3-4 native saplings per m² in pocket forest zones',
        '100% indigenous Western Ghats tree and shrub taxa'
      ],
      limitations: 'Biomass and connectivity numbers assume 5-year growth trajectory with adequate protection.'
    }
  }
};
