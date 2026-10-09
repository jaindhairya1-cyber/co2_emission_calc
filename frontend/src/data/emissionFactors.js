// Official Emission Factors for Indian MSMEs & International Standards
// Source: CEA (Central Electricity Authority, India - FY 2024-25, v21.0), DEFRA & GHG Protocol

export const ELECTRICITY_FACTORS = {
  indiaGrid: {
    name: 'Grid electricity (India)',
    factor: 0.710, // kg CO2e per kWh
    unit: 'kg CO₂e/kWh',
    source: 'CEA (FY 2024-25, v21.0)',
    scope: 2,
    avgCostPerUnit: 8.5 // Average industrial tariff ₹/kWh
  },
  renewable: {
    name: 'Solar / Green Tariff',
    factor: 0.045,
    unit: 'kg CO₂e/kWh',
    source: 'NREL LCA standard',
    scope: 2,
    avgCostPerUnit: 4.2
  }
};

export const FUEL_FACTORS = {
  Diesel: {
    name: 'Diesel',
    factor: 2.687, // kg CO2e per litre
    unit: 'kg CO₂e/L',
    scope: 1,
    costPerUnit: 92.5 // ₹ per litre
  },
  Petrol: {
    name: 'Petrol / Gasoline',
    factor: 2.314, // kg CO2e per litre
    unit: 'kg CO₂e/L',
    scope: 1,
    costPerUnit: 104.0
  },
  LPG: {
    name: 'LPG (Commercial)',
    factor: 1.512, // kg CO2e per kg
    unit: 'kg CO₂e/kg',
    scope: 1,
    costPerUnit: 85.0
  },
  'Natural Gas': {
    name: 'Natural Gas / PNG',
    factor: 1.932, // kg CO2e per m3
    unit: 'kg CO₂e/m³',
    scope: 1,
    costPerUnit: 48.0
  },
  Coal: {
    name: 'Industrial Coal / Briquettes',
    factor: 2.420, // kg CO2e per kg
    scope: 1,
    costPerUnit: 9.5
  }
};

export const TRANSPORT_FACTORS = {
  'Light Commercial Vehicle': {
    name: 'Light Commercial Vehicle (LCV / Tempo)',
    factor: 0.245, // kg CO2e per km
    unit: 'kg CO₂e/km',
    scope: 3
  },
  'Diesel Truck (Heavy)': {
    name: 'Diesel Heavy Commercial Vehicle (HCV)',
    factor: 0.760, // kg CO2e per km
    unit: 'kg CO₂e/km',
    scope: 3
  },
  'Electric Fleet Van': {
    name: 'Electric Fleet Van',
    factor: 0.085, // kg CO2e per km
    unit: 'kg CO₂e/km',
    scope: 3
  },
  'Commercial Fleet': {
    name: 'Commercial Freight Logistics Average',
    factor: 0.220, // kg CO2e per km
    unit: 'kg CO₂e/km',
    scope: 3
  }
};

export const MATERIAL_FACTORS = {
  Steel: {
    name: 'Steel (Virgin / Semi-finished)',
    factor: 1.82, // kg CO2e per kg
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  'Cotton yarn': {
    name: 'Cotton yarn & fabric',
    factor: 3.54, // kg CO2e per kg
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  'Plastic polymers': {
    name: 'Plastic polymers / granules',
    factor: 2.15, // kg CO2e per kg
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  Aluminum: {
    name: 'Aluminum extrusion',
    factor: 8.24, // kg CO2e per kg
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  Chemicals: {
    name: 'Industrial Process Chemicals',
    factor: 2.80,
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  'Corrugated boxes': {
    name: 'Packaging cardboard & boxes',
    factor: 0.85,
    unit: 'kg CO₂e/kg',
    scope: 3
  }
};

export const WASTE_FACTORS = {
  'General waste': {
    name: 'General Municipal / Factory Waste',
    factor: 0.58, // kg CO2e per kg
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  'Hazardous waste': {
    name: 'Chemical & Industrial Hazardous Waste',
    factor: 1.85,
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  'Recyclable plastic': {
    name: 'Segregated Recyclable Plastic',
    factor: 0.22,
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  'Metal scrap': {
    name: 'Metal Scrap & Swarf',
    factor: 0.15,
    unit: 'kg CO₂e/kg',
    scope: 3
  },
  'Organic waste': {
    name: 'Organic & Food Waste',
    factor: 0.45,
    unit: 'kg CO₂e/kg',
    scope: 3
  }
};

export const INITIAL_ACTIONS = [
  {
    id: 'act-1',
    title: 'LED lighting upgrade',
    category: 'Electricity',
    priority: 'High priority',
    priorityType: 'high',
    co2Reduction: 4.2, // tCO2e/yr
    annualSaving: 38000, // INR/yr
    investment: 65000, // INR
    paybackYears: 1.7,
    isApplied: false,
    description: 'Replace standard fluorescent tubes and CFLs across shopfloor and offices with high-efficacy LED luminaires with motion sensors.',
    reductionPct: 5.5
  },
  {
    id: 'act-2',
    title: 'Rooftop solar',
    category: 'Electricity',
    priority: 'High priority',
    priorityType: 'high',
    co2Reduction: 18.4,
    annualSaving: 120000,
    investment: 450000,
    paybackYears: 3.7,
    isApplied: false,
    description: 'Install 25 kWp captive rooftop solar PV system to offset daytime peak grid electricity consumption under net metering.',
    reductionPct: 24.0
  },
  {
    id: 'act-3',
    title: 'Transport route optimization',
    category: 'Transport',
    priority: 'Medium priority',
    priorityType: 'medium',
    co2Reduction: 7.1,
    annualSaving: 70000,
    investment: 24000,
    paybackYears: 2.2,
    isApplied: false,
    description: 'Implement consolidated dispatch routing and telematics to curb idle running and reduce diesel fleet kilometres by 18%.',
    reductionPct: 9.0
  },
  {
    id: 'act-4',
    title: 'VFD on Air Compressors',
    category: 'Electricity',
    priority: 'Medium priority',
    priorityType: 'medium',
    co2Reduction: 5.8,
    annualSaving: 54000,
    investment: 85000,
    paybackYears: 1.6,
    isApplied: false,
    description: 'Retrofit Variable Frequency Drive on industrial rotary screw air compressor to match pneumatic pressure demand.',
    reductionPct: 7.5
  },
  {
    id: 'act-5',
    title: 'Waste Heat Recovery (Boiler)',
    category: 'Fuel',
    priority: 'High priority',
    priorityType: 'high',
    co2Reduction: 9.2,
    annualSaving: 88000,
    investment: 195000,
    paybackYears: 2.2,
    isApplied: false,
    description: 'Install boiler flue gas economizer to preheat boiler feed water, reducing diesel/fuel consumption by ~12%.',
    reductionPct: 12.0
  }
];
