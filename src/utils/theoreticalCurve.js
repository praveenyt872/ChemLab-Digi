/**
 * Theoretical Curve Calculation Engine Utilities
 * Computes theoretical reference series for scientific dual-series plotting:
 * 1. computeLinearFit(dataPoints) - Least-squares linear regression line (ideal trendline)
 * 2. computeFormulaCurve(formulaRef, xRange, fixedInputs) - Theoretical physics formula reference line
 */

import { evaluate } from 'mathjs';

/**
 * Computes least-squares linear regression fit across points [{x, y}]
 * Returns line start & end coordinates for plotting
 */
export function computeLinearFit(dataPoints = []) {
  const validPoints = dataPoints.filter(
    p => p && typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y)
  );

  if (validPoints.length < 2) {
    return { slope: 0, intercept: 0, points: [] };
  }

  const xs = validPoints.map(p => p.x);
  const ys = validPoints.map(p => p.y);
  const n = xs.length;

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumXX = xs.reduce((sum, x) => sum + x * x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: ys[0], points: [] };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  // Generate 20 points for smooth rendering
  const step = (maxX - minX) / 19 || 1;
  const points = Array.from({ length: 20 }, (_, i) => {
    const x = minX + i * step;
    return {
      x,
      y: slope * x + intercept
    };
  });

  return {
    slope,
    intercept,
    points
  };
}

/**
 * Computes theoretical physics formula curve across an X range
 */
export function computeFormulaCurve(formulaExpr, xVarName, xRange = [], fixedInputs = []) {
  if (!formulaExpr || !xVarName || !xRange || xRange.length === 0) {
    return [];
  }

  const minX = Math.min(...xRange);
  const maxX = Math.max(...xRange);
  const step = (maxX - minX) / 25 || 1;

  const scopeBase = {};
  (fixedInputs || []).forEach(inp => {
    if (inp.id && inp.value !== undefined) {
      scopeBase[inp.id] = inp.value;
    }
  });

  const points = [];
  for (let i = 0; i <= 25; i++) {
    const xVal = minX + i * step;
    try {
      const yVal = evaluate(formulaExpr, scope);
      if (yVal !== null && !isNaN(yVal) && isFinite(yVal)) {
        points.push({ x: xVal, y: yVal });
      }
    } catch {
      // Ignore evaluation errors
    }
  }

  return points;
}
