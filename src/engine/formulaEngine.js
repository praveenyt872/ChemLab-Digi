import { evaluate } from 'mathjs';

/**
 * Formula Engine for ChemLab AI
 * Dynamically evaluates mathematical expressions defined in experiment JSON configs.
 * Uses mathjs parse & evaluate for safety (NO raw eval).
 */

/**
 * Evaluates calculated values for a single observation row using the experiment's formulas.
 * @param {Object} row - Object containing key-value pairs of user input (e.g. { h1: 0.22, h2: 0.12, t: 35 })
 * @param {Object} calculations - Object mapping derived field IDs to formula strings
 * @param {Array} fixedInputs - Optional array of fixed constants [{ id: "g", value: 9.81 }]
 * @returns {Object} Object containing calculated values
 */
export function calculateRow(row, calculations = {}, fixedInputs = []) {
  if (!row || typeof row !== 'object') return {};

  const scope = {};

  if (Array.isArray(fixedInputs)) {
    fixedInputs.forEach(fixed => {
      if (fixed.id && fixed.value !== undefined) {
        scope[fixed.id] = Number(fixed.value);
      }
    });
  }

  Object.keys(row).forEach(key => {
    const val = row[key];
    if (val !== '' && val !== null && val !== undefined && !isNaN(val)) {
      scope[key] = parseFloat(val);
    }
  });

  const results = {};

  Object.keys(calculations).forEach(calcId => {
    const expr = calculations[calcId];
    if (!expr) return;

    try {
      const calculatedVal = evaluate(expr, scope);

      if (typeof calculatedVal === 'number' && !isNaN(calculatedVal) && isFinite(calculatedVal)) {
        results[calcId] = calculatedVal;
        scope[calcId] = calculatedVal;
      } else {
        results[calcId] = null;
      }
    } catch (err) {
      results[calcId] = null;
    }
  });

  return results;
}

/**
 * Evaluates step-by-step calculations for a single trial row.
 * Produces symbolic LaTeX, substituted numeric LaTeX, optional simplification, and final answer.
 * @param {Object} trialRow - Row containing user inputs and calculated variables
 * @param {Array} calculationSteps - Array of step definitions from experiment config
 * @param {Array} fixedInputs - Array of fixed constants
 * @returns {Array} Array of step evaluation results
 */
export function evaluateStepCalculations(trialRow = {}, calculationSteps = [], fixedInputs = []) {
  if (!calculationSteps || calculationSteps.length === 0) return [];

  const scope = {};

  if (Array.isArray(fixedInputs)) {
    fixedInputs.forEach(fixed => {
      if (fixed.id && fixed.value !== undefined) {
        scope[fixed.id] = Number(fixed.value);
      }
    });
  }

  Object.keys(trialRow).forEach(key => {
    const val = trialRow[key];
    if (val !== '' && val !== null && val !== undefined && !isNaN(val)) {
      scope[key] = parseFloat(val);
    }
  });

  const evaluatedSteps = [];

  calculationSteps.forEach((step) => {
    const {
      step_id,
      step_number,
      label,
      formula_latex,
      formula_expression,
      substitution_template,
      simplification_template,
      unit,
      format,
      decimal_precision = 3,
      feeds_into
    } = step;

    let stepValue = null;
    let substitutedLatex = '';
    let simplificationLatex = '';

    try {
      if (formula_expression) {
        stepValue = evaluate(formula_expression, scope);
        if (typeof stepValue === 'number' && !isNaN(stepValue) && isFinite(stepValue)) {
          scope[step_id] = stepValue;
        } else {
          stepValue = null;
        }
      }
    } catch (e) {
      stepValue = null;
    }

    // Also populate intermediate variables if any helper values are needed
    if (trialRow.h !== undefined) scope.h_diff = trialRow.h;
    if (scope.h1 !== undefined && scope.h2 !== undefined) {
      scope.h_diff = Math.abs(scope.h1 - scope.h2).toFixed(3);
    }
    if (scope.H !== undefined && scope.g !== undefined) {
      scope.num_expr = formatScientific(3.46e-4 * 1.26e-4 * Math.sqrt(2 * scope.g * scope.H), 3);
    }

    if (substitution_template) {
      let subStr = substitution_template;
      subStr = subStr.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
        const val = scope[varName];
        if (val === undefined || val === null || isNaN(val)) return `\\text{${varName}}`;
        if (Math.abs(val) < 0.001 && val !== 0) {
          return formatScientific(val, 3);
        }
        return typeof val === 'number' ? (Number.isInteger(val) ? val.toString() : val.toFixed(decimal_precision)) : val;
      });
      substitutedLatex = subStr;
    }

    if (simplification_template) {
      let simpStr = simplification_template;
      simpStr = simpStr.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
        const val = scope[varName];
        if (val === undefined || val === null || isNaN(val)) return `\\text{${varName}}`;
        if (Math.abs(val) < 0.001 && val !== 0) {
          return formatScientific(val, 3);
        }
        return typeof val === 'number' ? (Number.isInteger(val) ? val.toString() : val.toFixed(decimal_precision)) : val;
      });
      simplificationLatex = simpStr;
    }

    const formattedVal = formatValue(stepValue, format || 'decimal');

    evaluatedSteps.push({
      step_id,
      step_number: step_number || evaluatedSteps.length + 1,
      label,
      unit: unit || '',
      formula_latex,
      substituted_latex: substitutedLatex,
      simplification_latex: simplificationLatex,
      value: stepValue,
      formatted_value: formattedVal,
      feeds_into
    });
  });

  return evaluatedSteps;
}

/**
 * Calculates results for an entire table of observation rows.
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
 * Calculates headline summary statistics (e.g. Mean Cd, Mean Q)
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
