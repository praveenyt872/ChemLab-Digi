/**
 * Comprehensive Unit Conversion and Measurement System for LabFlow-AI
 * Supports SI, CGS, Imperial, and Laboratory/Engineering units across all experiments.
 */

// Normalization dictionary for unit strings found in configs or user selections
const UNIT_ALIASES = {
  // Length
  'cm': 'cm',
  'm': 'm',
  'mm': 'mm',
  'in': 'in',
  'inch': 'in',
  'inches': 'in',
  'ft': 'ft',
  'foot': 'ft',
  'feet': 'ft',

  // Time
  'sec': 'sec',
  's': 'sec',
  'second': 'sec',
  'seconds': 'sec',
  'min': 'min',
  'minute': 'min',
  'minutes': 'min',
  'hr': 'hr',
  'hour': 'hr',
  'hours': 'hr',
  'ms': 'ms',

  // Pressure
  'mmhg': 'mmHg',
  'mm hg': 'mmHg',
  'mm of hg': 'mmHg',
  'cmhg': 'cmHg',
  'cm hg': 'cmHg',
  'cm of hg': 'cmHg',
  'kg/cm²': 'kg/cm²',
  'kg/cm2': 'kg/cm²',
  'bar': 'bar',
  'kpa': 'kPa',
  'pa': 'Pa',
  'psi': 'psi',
  'm h2o': 'm H₂O',
  'm h₂o': 'm H₂O',

  // Flow Rate
  'lph': 'LPH',
  'l/h': 'LPH',
  'lpm': 'LPM',
  'l/min': 'LPM',
  'l/s': 'L/s',
  'm³/s': 'm³/s',
  'm3/s': 'm³/s',
  'cm³/s': 'cm³/s',
  'cm3/s': 'cm³/s',
  'gpm': 'GPM',

  // Volume
  'litres': 'L',
  'liter': 'L',
  'liters': 'L',
  'l': 'L',
  'ml': 'mL',
  'cm³': 'cm³',
  'cm3': 'cm³',
  'm³': 'm³',
  'm3': 'm³',
  'gal': 'gal',

  // Temperature
  '°c': '°C',
  'deg c': '°C',
  'degc': '°C',
  'c': '°C',
  'k': 'K',
  'kelvin': 'K',
  '°f': '°F',
  'deg f': '°F',
  'degf': '°F',
  'f': '°F',

  // Electrical
  'v': 'V',
  'mv': 'mV',
  'kv': 'kV',
  'a': 'A',
  'ma': 'mA'
};

export function normalizeUnit(unitStr) {
  if (!unitStr || typeof unitStr !== 'string') return '';
  const trimmed = unitStr.trim().toLowerCase();
  return UNIT_ALIASES[trimmed] || unitStr.trim();
}

/**
 * Definition of Quantities, their standard units, and conversion factors to standard base reference.
 */
export const QUANTITY_DEFINITIONS = {
  length: {
    label: 'Length / Head',
    baseRef: 'm',
    units: {
      'm': { symbol: 'm', label: 'm (Meters)', factorToRef: 1.0, system: 'si' },
      'cm': { symbol: 'cm', label: 'cm (Centimeters)', factorToRef: 0.01, system: 'cgs' },
      'mm': { symbol: 'mm', label: 'mm (Millimeters)', factorToRef: 0.001, system: 'metric' },
      'in': { symbol: 'in', label: 'in (Inches)', factorToRef: 0.0254, system: 'imperial' },
      'ft': { symbol: 'ft', label: 'ft (Feet)', factorToRef: 0.3048, system: 'imperial' }
    },
    presets: {
      default: 'cm',
      si: 'm',
      cgs: 'cm',
      imperial: 'in'
    }
  },

  time: {
    label: 'Time',
    baseRef: 'sec',
    units: {
      'sec': { symbol: 'sec', label: 'sec (Seconds)', factorToRef: 1.0, system: 'si' },
      'min': { symbol: 'min', label: 'min (Minutes)', factorToRef: 60.0, system: 'common' },
      'hr': { symbol: 'hr', label: 'hr (Hours)', factorToRef: 3600.0, system: 'common' },
      'ms': { symbol: 'ms', label: 'ms (Milliseconds)', factorToRef: 0.001, system: 'metric' }
    },
    presets: {
      default: 'sec',
      si: 'sec',
      cgs: 'sec',
      imperial: 'sec'
    }
  },

  pressure: {
    label: 'Pressure / Head',
    baseRef: 'Pa',
    units: {
      'Pa': { symbol: 'Pa', label: 'Pa (Pascals)', factorToRef: 1.0, system: 'si' },
      'kPa': { symbol: 'kPa', label: 'kPa (Kilopascals)', factorToRef: 1000.0, system: 'si' },
      'bar': { symbol: 'bar', label: 'bar', factorToRef: 100000.0, system: 'metric' },
      'mmHg': { symbol: 'mmHg', label: 'mmHg (mm Hg)', factorToRef: 133.322387, system: 'lab' },
      'cmHg': { symbol: 'cmHg', label: 'cmHg (cm Hg)', factorToRef: 1333.22387, system: 'cgs' },
      'kg/cm²': { symbol: 'kg/cm²', label: 'kg/cm²', factorToRef: 98066.5, system: 'lab' },
      'psi': { symbol: 'psi', label: 'psi (lbf/in²)', factorToRef: 6894.757, system: 'imperial' },
      'm H₂O': { symbol: 'm H₂O', label: 'm H₂O (Head)', factorToRef: 9806.65, system: 'metric' }
    },
    presets: {
      default: 'mmHg',
      si: 'kPa',
      cgs: 'cmHg',
      imperial: 'psi'
    }
  },

  flow_rate: {
    label: 'Flow Rate',
    baseRef: 'm³/s',
    units: {
      'm³/s': { symbol: 'm³/s', label: 'm³/s', factorToRef: 1.0, system: 'si' },
      'L/s': { symbol: 'L/s', label: 'L/s (Liters/s)', factorToRef: 0.001, system: 'metric' },
      'LPM': { symbol: 'LPM', label: 'LPM (Liters/min)', factorToRef: 0.001 / 60, system: 'common' },
      'LPH': { symbol: 'LPH', label: 'LPH (Liters/hr)', factorToRef: 0.001 / 3600, system: 'lab' },
      'cm³/s': { symbol: 'cm³/s', label: 'cm³/s (cc/s)', factorToRef: 1e-6, system: 'cgs' },
      'GPM': { symbol: 'GPM', label: 'GPM (US gal/min)', factorToRef: 0.0000630902, system: 'imperial' }
    },
    presets: {
      default: 'LPH',
      si: 'm³/s',
      cgs: 'cm³/s',
      imperial: 'GPM'
    }
  },

  volume: {
    label: 'Volume',
    baseRef: 'm³',
    units: {
      'm³': { symbol: 'm³', label: 'm³ (Cubic meters)', factorToRef: 1.0, system: 'si' },
      'L': { symbol: 'L', label: 'L (Liters)', factorToRef: 0.001, system: 'common' },
      'mL': { symbol: 'mL', label: 'mL (Milliliters)', factorToRef: 1e-6, system: 'cgs' },
      'cm³': { symbol: 'cm³', label: 'cm³ (Cubic cm)', factorToRef: 1e-6, system: 'cgs' },
      'gal': { symbol: 'gal', label: 'gal (US Gallon)', factorToRef: 0.00378541, system: 'imperial' }
    },
    presets: {
      default: 'L',
      si: 'm³',
      cgs: 'mL',
      imperial: 'gal'
    }
  },

  temperature: {
    label: 'Temperature',
    baseRef: 'K',
    units: {
      '°C': {
        symbol: '°C',
        label: '°C (Celsius)',
        toRef: (c) => c + 273.15,
        fromRef: (k) => k - 273.15,
        system: 'cgs'
      },
      'K': {
        symbol: 'K',
        label: 'K (Kelvin)',
        toRef: (k) => k,
        fromRef: (k) => k,
        system: 'si'
      },
      '°F': {
        symbol: '°F',
        label: '°F (Fahrenheit)',
        toRef: (f) => (f - 32) * (5 / 9) + 273.15,
        fromRef: (k) => (k - 273.15) * 1.8 + 32,
        system: 'imperial'
      }
    },
    presets: {
      default: '°C',
      si: 'K',
      cgs: '°C',
      imperial: '°F'
    }
  },

  voltage: {
    label: 'Voltage',
    baseRef: 'V',
    units: {
      'V': { symbol: 'V', label: 'V (Volts)', factorToRef: 1.0, system: 'si' },
      'mV': { symbol: 'mV', label: 'mV (Millivolts)', factorToRef: 0.001, system: 'metric' },
      'kV': { symbol: 'kV', label: 'kV (Kilovolts)', factorToRef: 1000.0, system: 'metric' }
    },
    presets: {
      default: 'V',
      si: 'V',
      cgs: 'V',
      imperial: 'V'
    }
  },

  current: {
    label: 'Current',
    baseRef: 'A',
    units: {
      'A': { symbol: 'A', label: 'A (Amperes)', factorToRef: 1.0, system: 'si' },
      'mA': { symbol: 'mA', label: 'mA (Milliamperes)', factorToRef: 0.001, system: 'metric' }
    },
    presets: {
      default: 'A',
      si: 'A',
      cgs: 'A',
      imperial: 'A'
    }
  }
};

/**
 * Detects the physical quantity category of a unit string.
 * @param {string} unitStr - e.g. "cm", "sec", "mmHg", "LPH"
 * @returns {string|null} - 'length' | 'time' | 'pressure' | 'flow_rate' | 'volume' | 'temperature' | 'voltage' | 'current'
 */
export function getUnitQuantity(unitStr) {
  if (!unitStr) return null;
  const norm = normalizeUnit(unitStr);

  for (const [qKey, qDef] of Object.entries(QUANTITY_DEFINITIONS)) {
    if (qDef.units[norm]) {
      return qKey;
    }
  }
  return null;
}

/**
 * Returns the list of selectable unit options for a given unit string.
 * @param {string} unitStr
 * @returns {Array<{symbol: string, label: string, system: string}>}
 */
export function getAvailableUnits(unitStr) {
  const quantityKey = getUnitQuantity(unitStr);
  if (!quantityKey) return [];
  const qDef = QUANTITY_DEFINITIONS[quantityKey];
  return Object.values(qDef.units).map(u => ({
    symbol: u.symbol,
    label: u.label,
    system: u.system
  }));
}

/**
 * Returns the preset unit for a quantity in a specific unit system.
 * @param {string} quantityKey
 * @param {string} system - 'default' | 'si' | 'cgs' | 'imperial'
 * @param {string} defaultUnit - Original unit defined in experiment config
 */
export function getPresetUnit(quantityKey, system, defaultUnit) {
  if (system === 'default' || !system) return defaultUnit;
  const qDef = QUANTITY_DEFINITIONS[quantityKey];
  if (!qDef) return defaultUnit;

  // Custom adjustments for specific experiment contexts:
  if (system === 'si') {
    if (quantityKey === 'pressure' && defaultUnit === 'kg/cm²') return 'bar';
    if (quantityKey === 'flow_rate' && defaultUnit === 'LPH') return 'm³/s';
    return qDef.presets.si || defaultUnit;
  }
  if (system === 'cgs') {
    if (quantityKey === 'pressure' && (defaultUnit === 'mmHg' || defaultUnit === 'mm Hg')) return 'cmHg';
    return qDef.presets.cgs || defaultUnit;
  }
  if (system === 'imperial') {
    if (quantityKey === 'length' && defaultUnit === 'm') return 'ft';
    return qDef.presets.imperial || defaultUnit;
  }

  return defaultUnit;
}

/**
 * Clean floating point artifacts while keeping significant digits.
 */
export function cleanPrecision(num, maxDecimals = 4) {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return num;
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round((Number(num) + Number.EPSILON) * factor) / factor;
  return rounded;
}

/**
 * Converts a numerical value from one unit to another.
 * @param {number|string} val - Input value
 * @param {string} fromUnit - Origin unit
 * @param {string} toUnit - Target unit
 * @returns {number|string} - Converted value rounded cleanly
 */
export function convertValue(val, fromUnit, toUnit) {
  if (val === '' || val === null || val === undefined) return val;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num) || !isFinite(num)) return val;

  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  if (normFrom === normTo) return num;

  const qKeyFrom = getUnitQuantity(normFrom);
  const qKeyTo = getUnitQuantity(normTo);

  // If different quantities or unrecognized, cannot convert
  if (!qKeyFrom || qKeyFrom !== qKeyTo) return num;

  const qDef = QUANTITY_DEFINITIONS[qKeyFrom];

  // Temperature special affine conversion
  if (qKeyFrom === 'temperature') {
    const fromDef = qDef.units[normFrom];
    const toDef = qDef.units[normTo];
    if (!fromDef || !toDef) return num;
    const refVal = fromDef.toRef(num);
    const targetVal = toDef.fromRef(refVal);
    return cleanPrecision(targetVal, 2);
  }

  // Linear scaling conversion
  const fromDef = qDef.units[normFrom];
  const toDef = qDef.units[normTo];
  if (!fromDef || !toDef) return num;

  const refVal = num * fromDef.factorToRef;
  const targetVal = refVal / toDef.factorToRef;

  // Decide decimals based on scale
  const absTarget = Math.abs(targetVal);
  let decimals = 4;
  if (absTarget >= 1000) decimals = 1;
  else if (absTarget >= 100) decimals = 2;
  else if (absTarget >= 10) decimals = 3;
  else if (absTarget < 0.001 && absTarget > 0) decimals = 6;

  return cleanPrecision(targetVal, decimals);
}

/**
 * Available system preset options for global UI toggle.
 */
export const UNIT_SYSTEM_OPTIONS = [
  { id: 'default', label: 'Lab Default', icon: '🔬', description: 'Standard apparatus units as per REC Lab Manual' },
  { id: 'si', label: 'SI System', icon: '🌐', description: 'International System of Units (m, s, Pa, m³/s, K)' },
  { id: 'cgs', label: 'CGS System', icon: '⚖️', description: 'Centimetre-Gram-Second (cm, s, cmHg, cm³/s, °C)' },
  { id: 'imperial', label: 'Imperial', icon: '📐', description: 'US / British Engineering (in, ft, psi, GPM, °F)' }
];
