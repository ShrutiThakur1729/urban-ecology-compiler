import { InterventionSpec, InterventionId } from '@/types/interventions';

export const INTERVENTION_REGISTRY: Record<InterventionId, InterventionSpec> = {
  tree_corridor: {
    id: 'tree_corridor',
    name: 'Tree Canopy Corridor',
    category: 'VEGETATION',
    description: 'Continuous linear canopy plantings of native shade trees along roadways and public paths to reduce heat and link isolated green zones.',
    environmentalBenefits: [
      'Microclimate cooling through leaf evapotranspiration and solar shading',
      'Continuous linear corridor for avian and arboreal species dispersal',
      'Rainfall canopy interception and particulate air filtration'
    ],
    unitCostInr: 200, // per sq meter canopy proxy
    costUnit: 'per_sq_meter',
    spaceRequirement: {
      minAreaSqMeters: 500,
      preferredPlacement: 'road_verge',
      slopeSuitability: { minPercent: 0, maxPercent: 15 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 30, // liters/storm
      heatMitigationDeltaC: 1.8,
      biodiversityGainScore: 8.5,
      co2SequestrationKgYearPerUnit: 22.5
    },
    suitableConditions: [
      'Road verges with minimum 2m planting width',
      'Pedestrian footpaths needing thermal protection',
      'Areas bridging separated parks or natural fragments'
    ],
    unsuitableConditions: [
      'Overhead high-voltage transmission lines with low clearance',
      'Dense underground utilities without root protection barriers'
    ],
    maintenanceNote: 'Sapling support staking and weekly watering during first 2 non-monsoon seasons; structural crown pruning every 3 years.',
    colorHex: '#10b981'
  },
  pocket_forest: {
    id: 'pocket_forest',
    name: 'Miyawaki Native Pocket Forest',
    category: 'VEGETATION',
    description: 'Ultra-dense multi-tiered native forest patches planted 30x denser than conventional afforestation for rapid biodiversity restoration.',
    environmentalBenefits: [
      'Maximum biodiversity density and micro-habitat creation',
      'Rapid vertical growth and high carbon sequestration per unit area',
      'Intense localized ground cooling and noise dampening'
    ],
    unitCostInr: 250,
    costUnit: 'per_sq_meter',
    spaceRequirement: {
      minAreaSqMeters: 1000,
      preferredPlacement: 'open_ground',
      slopeSuitability: { minPercent: 0, maxPercent: 20 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 30,
      heatMitigationDeltaC: 2.8,
      biodiversityGainScore: 9.8,
      co2SequestrationKgYearPerUnit: 45.0
    },
    suitableConditions: [
      'Vacant municipal land, institutional campuses, park corners',
      'Sites requiring rapid acoustic and visual screening'
    ],
    unsuitableConditions: [
      'Over underground basements or septic tanks',
      'Sites with less than 200 m² contiguous unpaved area'
    ],
    maintenanceNote: 'Intensive weeding and organic mulching for 24 months until canopy closes and forest becomes self-sustaining.',
    colorHex: '#059669'
  },
  rain_garden: {
    id: 'rain_garden',
    name: 'Infiltration Rain Garden',
    category: 'HYDROLOGY',
    description: 'Depressed landscaped bioretention basin designed to capture, filter, and slowly infiltrate stormwater runoff into the unconfined aquifer.',
    environmentalBenefits: [
      'Immediate mitigation of street ponding and monsoon flash flooding',
      'Natural biological filtration of road grease, heavy metals, and silt',
      'Groundwater aquifer recharge in urbanized watersheds'
    ],
    unitCostInr: 150,
    costUnit: 'per_sq_meter',
    spaceRequirement: {
      minAreaSqMeters: 300,
      preferredPlacement: 'open_ground',
      slopeSuitability: { minPercent: 1, maxPercent: 6 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 50,
      heatMitigationDeltaC: 0.8,
      biodiversityGainScore: 7.2,
      co2SequestrationKgYearPerUnit: 12.0
    },
    suitableConditions: [
      'Topographic depressions receiving surface runoff from paved areas',
      'Parks, roundabouts, and parking lot drainage catchment nodes'
    ],
    unsuitableConditions: [
      'Steep slopes (>8%) where water velocity causes soil scour',
      'Within 3m of building foundations without waterproof membrane'
    ],
    maintenanceNote: 'Sediment and trash removal after heavy storms; seasonal cutting of hydrophilic native reed and sedge biomass.',
    colorHex: '#0284c7'
  },
  bioswale: {
    id: 'bioswale',
    name: 'Vegetated Bioswale Channel',
    category: 'HYDROLOGY',
    description: 'Linear gently-sloped vegetated swale designed to convey, slow down, and cleanse stormwater runoff along roadway easements.',
    environmentalBenefits: [
      'Reduces peak velocity of stormwater runoff entering municipal drains',
      'Settles out suspended particulate matter and pollutants before river discharge',
      'Provides linear green street aesthetics and pedestrian separation'
    ],
    unitCostInr: 900,
    costUnit: 'per_linear_meter',
    spaceRequirement: {
      minAreaSqMeters: 200,
      preferredPlacement: 'road_verge',
      slopeSuitability: { minPercent: 0.5, maxPercent: 4 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 70,
      heatMitigationDeltaC: 0.6,
      biodiversityGainScore: 6.5,
      co2SequestrationKgYearPerUnit: 10.0
    },
    suitableConditions: [
      'Roadway margins, median strips, parking lot perimeters',
      'Linear alignments along natural water flow gradients'
    ],
    unsuitableConditions: [
      'Flat terrain without gradient (<0.3%) causing stagnant pooling',
      'Areas subject to heavy uncontrolled vehicular parking'
    ],
    maintenanceNote: 'Pre-monsoon desilting and clear-channel check; replace damaged turf or rock check-dams.',
    colorHex: '#0d9488'
  },
  green_roof: {
    id: 'green_roof',
    name: 'Extensive Lightweight Green Roof',
    category: 'COOLING',
    description: 'Engineered shallow-substrate rooftop vegetation system providing building insulation, stormwater retention, and urban heat mitigation.',
    environmentalBenefits: [
      'Reduces internal building top-floor temperatures by 3-5°C, cutting air conditioning energy',
      'Absorbs 60-80% of rooftop rainfall before it reaches street storm drains',
      'Protects waterproofing roof membranes from UV degradation, doubling lifespan'
    ],
    unitCostInr: 200,
    costUnit: 'per_sq_meter',
    spaceRequirement: {
      minAreaSqMeters: 200,
      preferredPlacement: 'roof',
      slopeSuitability: { minPercent: 0, maxPercent: 5 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 40,
      heatMitigationDeltaC: 2.2,
      biodiversityGainScore: 6.0,
      co2SequestrationKgYearPerUnit: 15.0
    },
    suitableConditions: [
      'Flat reinforced concrete slab roofs (standard Indian RCC construction)',
      'Institutional, municipal, and commercial office buildings'
    ],
    unsuitableConditions: [
      'Sloped tin/corrugated sheet roofs without structural reinforcement',
      'Buildings with unverified load-bearing structural integrity'
    ],
    maintenanceNote: 'Biannual root-barrier inspection and drain clearance; drip irrigation top-up in peak summer.',
    colorHex: '#84cc16'
  },
  permeable_pavement: {
    id: 'permeable_pavement',
    name: 'Porous Pavement & Interlocking Pavers',
    category: 'PERMEABILITY',
    description: 'Paving systems with open aggregate voids allowing direct infiltration of rainwater into the gravel base below.',
    environmentalBenefits: [
      'Eliminates standing surface puddles on plazas, walkways, and parking lots',
      'Recharges groundwater aquifers without requiring additional surface land take',
      'Reduces night-time urban heat radiation compared to dense black asphalt'
    ],
    unitCostInr: 220,
    costUnit: 'per_sq_meter',
    spaceRequirement: {
      minAreaSqMeters: 400,
      preferredPlacement: 'paved_surface',
      slopeSuitability: { minPercent: 0, maxPercent: 5 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 40,
      heatMitigationDeltaC: 1.1,
      biodiversityGainScore: 3.0,
      co2SequestrationKgYearPerUnit: 2.0
    },
    suitableConditions: [
      'Low-speed vehicular parking bays, public plazas, pedestrian walkways',
      'Surfaces undergoing municipal footpath or parking resurfacing'
    ],
    unsuitableConditions: [
      'Heavy container truck terminals or high-speed arterial highways',
      'Areas with fine silt washout that permanently clogs aggregate pores'
    ],
    maintenanceNote: 'Annual vacuum sweeping or high-pressure washing to dislodge sediment from void joints.',
    colorHex: '#f59e0b'
  },
  pollinator_garden: {
    id: 'pollinator_garden',
    name: 'Native Pollinator & Butterfly Stepping Stone',
    category: 'VEGETATION',
    description: 'Curated gardens of nectar-rich and larval host indigenous flowering perennials and shrubs providing food and shelter for pollinators.',
    environmentalBenefits: [
      'Supports crucial populations of native bees, butterflies, hoverflies, and birds',
      'Enhances civic aesthetic quality and community engagement in urban greening',
      'Low water demand once established compared to exotic lawn turf'
    ],
    unitCostInr: 150,
    costUnit: 'per_sq_meter',
    spaceRequirement: {
      minAreaSqMeters: 200,
      preferredPlacement: 'open_ground',
      slopeSuitability: { minPercent: 0, maxPercent: 12 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 20,
      heatMitigationDeltaC: 0.7,
      biodiversityGainScore: 9.5,
      co2SequestrationKgYearPerUnit: 14.0
    },
    suitableConditions: [
      'Sunny open areas in parks, community centers, school grounds, traffic islands',
      'Sites adjacent to residential areas for environmental awareness'
    ],
    unsuitableConditions: [
      'Deep shaded zones under dense continuous buildings',
      'Sites frequently sprayed with chemical insecticides or mosquito fogging'
    ],
    maintenanceNote: 'Organic compost enrichment and deadheading; avoid all chemical pesticides.',
    colorHex: '#ec4899'
  },
  green_buffer: {
    id: 'green_buffer',
    name: 'Riparian & Infrastructure Green Buffer',
    category: 'VEGETATION',
    description: 'Multi-layer dense vegetation barriers placed alongside railways, industrial edges, or watercourses to filter pollution and absorb storm surges.',
    environmentalBenefits: [
      'Stabilizes canal and nallah banks against monsoon erosive scouring',
      'Filters air particulate matter (PM2.5 / PM10) from transport corridors',
      'Acts as a continuous ecological buffer zone shielding sensitive habitats'
    ],
    unitCostInr: 180,
    costUnit: 'per_sq_meter',
    spaceRequirement: {
      minAreaSqMeters: 500,
      preferredPlacement: 'riparian_edge',
      slopeSuitability: { minPercent: 0, maxPercent: 25 }
    },
    benefitsMultiplier: {
      runoffReductionPerSqM: 35,
      heatMitigationDeltaC: 1.5,
      biodiversityGainScore: 8.0,
      co2SequestrationKgYearPerUnit: 26.0
    },
    suitableConditions: [
      'Edges of nallahs, creek margins, railway tracks, industrial compound perimeters'
    ],
    unsuitableConditions: [
      'Active floodway channels where tall trees might obstruct emergency hydraulic flow'
    ],
    maintenanceNote: 'Periodic removal of plastic and solid waste trapped during storm surges; bank reinforcement checks.',
    colorHex: '#14b8a6'
  }
};
