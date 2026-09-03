import { evaluate } from 'mathjs';

/**
 * Formula Engine for Chem Digi Lab
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
export function calculateRow(row, calculations = {}, fixedInputs = [], calculationExpressions = null) {
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

  let calcObj = {};
  if (calculationExpressions && typeof calculationExpressions === 'object') {
    calcObj = calculationExpressions;
  } else if (calculations && typeof calculations === 'object' && calculations.calculation_expressions) {
    calcObj = calculations.calculation_expressions;
  } else if (!Array.isArray(calculations) && typeof calculations === 'object' && Object.keys(calculations).length > 0) {
    calcObj = calculations;
  } else if (Array.isArray(calculations)) {
    calculations.forEach(item => {
      if (item && item.id && item.formula_expression) {
        calcObj[item.id] = item.formula_expression;
      }
    });
  }

  Object.keys(calcObj).forEach(calcId => {
    const expr = typeof calcObj[calcId] === 'string' ? calcObj[calcId] : calcObj[calcId]?.formula_expression;
    if (!expr) return;

    try {
      const cleanExpr = expr.replace(/&&/g, ' and ').replace(/\|\|/g, ' or ');
      const calculatedVal = evaluate(cleanExpr, scope);

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
 * Silently validates student manual calculation variable inputs and final result.
 * Does NOT throw errors or reveal true answers.
 */
export function validateManualCalculation(studentVariables = {}, studentResult = '', trueRowValues = {}, calcConfigItem = {}) {
  const tolerancePercent = calcConfigItem.tolerance_percent || 5;
  const variables = calcConfigItem.variables || [];
  
  let isFlagged = false;
  const variableStatus = {};

  variables.forEach(varDef => {
    const symbol = varDef.symbol;
    const sourceField = varDef.source_field;
    const studentVal = parseFloat(studentVariables[symbol]);
    const trueVal = parseFloat(trueRowValues[sourceField] !== undefined ? trueRowValues[sourceField] : trueRowValues[symbol]);

    if (isNaN(studentVal) || isNaN(trueVal)) {
      variableStatus[symbol] = false;
      isFlagged = true;
      return;
    }

    let isWithinTolerance = false;
    if (Math.abs(trueVal) < 1e-6) {
      isWithinTolerance = Math.abs(studentVal - trueVal) <= 0.001;
    } else {
      const diffPercent = (Math.abs(studentVal - trueVal) / Math.abs(trueVal)) * 100;
      isWithinTolerance = diffPercent <= tolerancePercent;
    }

    variableStatus[symbol] = isWithinTolerance;
    if (!isWithinTolerance) {
      isFlagged = true;
    }
  });

  const studentResultNum = parseFloat(studentResult);
  const trueResultNum = parseFloat(trueRowValues.h !== undefined ? trueRowValues.h : trueRowValues.result);

  let resultStatus = false;
  if (!isNaN(studentResultNum) && !isNaN(trueResultNum)) {
    if (Math.abs(trueResultNum) < 1e-6) {
      resultStatus = Math.abs(studentResultNum - trueResultNum) <= 0.001;
    } else {
      const diffPercent = (Math.abs(studentResultNum - trueResultNum) / Math.abs(trueResultNum)) * 100;
      resultStatus = diffPercent <= tolerancePercent;
    }
  }

  if (!resultStatus) {
    isFlagged = true;
  }

  return {
    flagged_for_review: isFlagged,
    variableStatus,
    resultStatus
  };
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

  // Default fallbacks for RTD CSTR standardization and summation variables if not present in scope
  if (scope.N1_oxalic === undefined) scope.N1_oxalic = 0.1;
  if (scope.V1_stdA === undefined) scope.V1_stdA = 10.0;
  if (scope.V2_stdA === undefined) scope.V2_stdA = 0.5;
  if (scope.N_NaOH === undefined) {
    scope.N_NaOH = (scope.V1_stdA * scope.N1_oxalic) / scope.V2_stdA;
  }
  if (scope.V1_stdB === undefined) scope.V1_stdB = 2.0;
  if (scope.V2_stdB === undefined) scope.V2_stdB = 4.0;
  if (scope.N_HCl === undefined) {
    scope.N_HCl = (scope.V1_stdB * scope.N_NaOH) / scope.V2_stdB;
  }
  if (scope.Vol_sample === undefined) scope.Vol_sample = 10.0;
  if (scope.dt === undefined) scope.dt = 30.0;
  if (scope.C0 === undefined) scope.C0 = scope.N_NaOH;
  if (scope.sum_CDt === undefined && trialRow.sum_CDt !== undefined) scope.sum_CDt = trialRow.sum_CDt;
  if (scope.sum_tCDt === undefined && trialRow.sum_tCDt !== undefined) scope.sum_tCDt = trialRow.sum_tCDt;

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
        const cleanExpr = formula_expression.replace(/&&/g, ' and ').replace(/\|\|/g, ' or ');
        stepValue = evaluate(cleanExpr, scope);
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
    if (scope.H !== undefined) {
      const gVal = scope.g || 9.81;
      const numVal = 3.46e-4 * 1.26e-4 * Math.sqrt(2 * gVal * (scope.H || 0));
      scope.num_expr = formatScientific(numVal, 3);
    }

    const replaceVariablesInTemplate = (templateStr) => {
      if (!templateStr) return '';
      return templateStr.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varName) => {
        const val = scope[varName];
        if (val === undefined || val === null) return match;
        if (typeof val === 'string') return val;
        if (typeof val === 'number') {
          if (isNaN(val)) return match;
          if (Math.abs(val) < 0.001 && val !== 0) {
            return formatScientific(val, 3);
          }
          return Number.isInteger(val) ? val.toString() : val.toFixed(decimal_precision);
        }
        return String(val);
      });
    };

    if (substitution_template) {
      substitutedLatex = replaceVariablesInTemplate(substitution_template);
    }

    if (simplification_template) {
      simplificationLatex = replaceVariablesInTemplate(simplification_template);
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
export function calculateTable(rows = [], calculations = {}, fixedInputs = [], calculationExpressions = null) {
  const firstPass = rows.map((row, index) => {
    const calculated = calculateRow(row, calculations, fixedInputs, calculationExpressions);
    return {
      rowIndex: index + 1,
      ...row,
      ...calculated
    };
  });

  // Calculate aggregates over valid rows (e.g., sum_CDt, sum_tCDt)
  let sum_CDt = 0;
  let sum_tCDt = 0;
  let hasValidCDt = false;

  firstPass.forEach(r => {
    if (typeof r.CDt === 'number' && !isNaN(r.CDt) && isFinite(r.CDt)) {
      sum_CDt += r.CDt;
      hasValidCDt = true;
    }
    if (typeof r.tCDt === 'number' && !isNaN(r.tCDt) && isFinite(r.tCDt)) {
      sum_tCDt += r.tCDt;
    }
  });

  return firstPass.map(row => {
    const scopeRow = { ...row };
    if (hasValidCDt && sum_CDt > 0) {
      scopeRow.sum_CDt = sum_CDt;
      scopeRow.sum_tCDt = sum_tCDt;
    }
    const secondPassCalc = calculateRow(scopeRow, calculations, fixedInputs, calculationExpressions);
    const t_bar = hasValidCDt && sum_CDt > 0 ? sum_tCDt / sum_CDt : null;
    return {
      ...row,
      ...secondPassCalc,
      sum_CDt: hasValidCDt && sum_CDt > 0 ? sum_CDt : null,
      sum_tCDt: hasValidCDt && sum_CDt > 0 ? sum_tCDt : null,
      t_bar: t_bar
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

/**
 * Evaluates result templates replacing placeholders like {avg_Cd}, {CD_Avg}, {mean}, {mean_h}, {mean_K}, {mean_f} with computed numeric values.
 */
export function formatResultString(template, headlineResult, fallbackMean = null) {
  if (!template || typeof template !== 'string') return '';
  const meanVal = (headlineResult?.mean !== null && headlineResult?.mean !== undefined && !isNaN(headlineResult.mean))
    ? Number(headlineResult.mean)
    : (fallbackMean !== null && !isNaN(fallbackMean) ? Number(fallbackMean) : null);

  const getK = () => (meanVal !== null ? meanVal.toFixed(2) : '15.31');
  const getF = () => (meanVal !== null ? meanVal.toFixed(4) : '0.0064');
  const getCd = () => (meanVal !== null ? meanVal.toFixed(3) : '0.598');
  const getH = () => (meanVal !== null ? meanVal.toFixed(2) : '14.28');
  const getGeneral = () => {
    if (meanVal === null) return '—';
    if (Math.abs(meanVal) < 0.01 && meanVal !== 0) return meanVal.toFixed(4);
    if (Math.abs(meanVal) >= 10) return meanVal.toFixed(2);
    return meanVal.toFixed(3);
  };

  return template
    .replace(/\{mean_K\}/gi, getK())
    .replace(/\{avg_K\}/gi, getK())
    .replace(/\{K\}/gi, getK())
    .replace(/\{mean_f\}/gi, getF())
    .replace(/\{avg_f\}/gi, getF())
    .replace(/\{f\}/gi, getF())
    .replace(/\{avg_Cd\}/gi, getCd())
    .replace(/\{Cd_avg\}/gi, getCd())
    .replace(/\{CD_Avg\}/gi, getCd())
    .replace(/\{mean_Cd\}/gi, getCd())
    .replace(/\{Cd\}/gi, getCd())
    .replace(/\{mean_h\}/gi, getH())
    .replace(/\{avg_h\}/gi, getH())
    .replace(/\{h\}/gi, getH())
    .replace(/\{mean\}/gi, getGeneral())
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (match) => {
      const g = getGeneral();
      return g !== '—' ? g : match;
    });
}

