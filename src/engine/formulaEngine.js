import { evaluate } from 'mathjs';

/**
 * Formula Engine for ChemLab AI
 * Dynamically evaluates mathematical expressions defined in experiment JSON configs.
 * Uses mathjs parse & evaluate for safety (NO raw eval).
 */

/**
 * Evaluates calculated values for a single observation row using the experiment's formulas.
 * @param {Object} row - Object containing key-value pairs of user input (e.g. { h1: 0.22, h2: 0.12, t: 35 })
 * @param {Object} calculations - Object mapping derived field IDs to formula strings (e.g. { h: "abs(h1 - h2)", H: "abs(h1 - h2) * 12.6" })
 * @param {Array} fixedInputs - Optional array of fixed constants [{ id: "g", value: 9.81 }]
 * @returns {Object} Object containing calculated values (e.g. { h: 0.1, H: 1.26, Qa: 0.000285, ... })
 */
export function calculateRow(row, calculations = {}, fixedInputs = []) {
  if (!row || typeof row !== 'object') return {};

  // Build evaluation scope combining row inputs and fixed constants
  const scope = {};

  // Add fixed constants to scope
  if (Array.isArray(fixedInputs)) {
    fixedInputs.forEach(fixed => {
      if (fixed.id && fixed.value !== undefined) {
        scope[fixed.id] = Number(fixed.value);
      }
    });
  }

  // Add user row inputs to scope (convert numeric strings to floats)
  Object.keys(row).forEach(key => {
    const val = row[key];
    if (val !== '' && val !== null && val !== undefined && !isNaN(val)) {
      scope[key] = parseFloat(val);
    }
  });

  const results = {};

  // Evaluate derived variables in sequence
  Object.keys(calculations).forEach(calcId => {
    const expr = calculations[calcId];
    if (!expr) return;

    try {
      // Evaluate expression using mathjs evaluate with current scope
      const calculatedVal = evaluate(expr, scope);

      if (typeof calculatedVal === 'number' && !isNaN(calculatedVal) && isFinite(calculatedVal)) {
        results[calcId] = calculatedVal;
        // Update scope so subsequent dependent formulas can reference this result
        scope[calcId] = calculatedVal;
      } else {
        results[calcId] = null;
      }
    } catch (err) {
      // Expression missing variables or invalid math operation (e.g. div by zero)
      results[calcId] = null;
    }
  });

  return results;
}

/**
 * Calculates results for an entire table of observation rows.
 * @param {Array} rows - Array of user input row objects
 * @param {Object} calculations - Formulas object from experiment config
 * @param {Array} fixedInputs - Fixed constants array from experiment config
 * @returns {Array} Array of row objects containing both inputs and derived calculated columns
 */
export function calculateTable(rows = [], calculations = {}, fixedInputs = []) {
  return rows.map((row, index) => {
    const calculated = calculateRow(row, calculations, fixedInputs);
    return {
      rowIndex: index + 1,
      ...row,
      ...calculated
    };
  });
}

/**
 * Calculates headline summary statistics (e.g. Mean Cd, Mean Q, Line of best fit)
 * @param {Array} calculatedRows - Processed table rows
 * @param {String} primaryMetricKey - Key to average (e.g. "Cd" or "Q")
 * @returns {Object} Headline summary metrics
 */
export function calculateSummary(calculatedRows = [], primaryMetricKey = 'Cd') {
  if (!calculatedRows || calculatedRows.length === 0) {
    return { count: 0, mean: null, min: null, max: null };
  }

  const validValues = calculatedRows
    .map(r => r[primaryMetricKey])
    .filter(v => v !== null && v !== undefined && !isNaN(v) && isFinite(v));

  if (validValues.length === 0) {
    return { count: 0, mean: null, min: null, max: null };
  }

  const sum = validValues.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / validValues.length;
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  return {
    count: validValues.length,
    mean,
    min,
    max
  };
}

/**
 * Formats scientific numbers as "2.2222 × 10⁻⁵" instead of "2.2222e-5"
 * @param {Number} value
 * @param {Number} precision
 * @returns {String} Formatted string
 */
export function formatScientific(value, precision = 4) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '—';
  if (num === 0) return '0';

  const expStr = num.toExponential(precision);
  const [mantissa, exponent] = expStr.split('e');
  const expNum = parseInt(exponent, 10);

  if (expNum === 0) return parseFloat(mantissa).toFixed(precision);

  const superscripts = {
    '-': '⁻',
    '+': '⁺',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹'
  };

  const superscriptExp = expNum.toString().split('').map(char => superscripts[char] || char).join('');
  return `${mantissa} × 10${superscriptExp}`;
}

/**
 * Formats numeric values for UI display based on column configuration format.
 * @param {Number} value
 * @param {String} format - "decimal", "decimal_3", "scientific", "integer"
 * @returns {String} Formatted display string
 */
export function formatValue(value, format = 'decimal') {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '—';

  switch (format) {
    case 'scientific':
      return formatScientific(num, 4);
    case 'decimal_3':
      return num.toFixed(3);
    case 'integer':
      return Math.round(num).toString();
    case 'decimal':
    default:
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
}

