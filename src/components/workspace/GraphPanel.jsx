import React, { useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useExperimentStore } from '../../store/experimentStore';
import { FigureCard } from '../graph/FigureCard';
import { MatlabStyledPlot } from '../graph/MatlabStyledPlot';
import { MATLAB_COLORS } from '../../theme/matlabPlotTheme';
import { computeLinearFit } from '../../utils/theoreticalCurve';

class GraphPanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GraphPanel rendering error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/60 text-slate-800 space-y-2 font-mono text-xs shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 font-bold">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>Unable to Render Graph Figure</span>
          </div>
          <p className="text-slate-600 font-sans">
            A graph rendering issue occurred. Please check your trial readings or input parameters.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1.5 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors text-xs cursor-pointer"
          >
            Retry Figure Render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function GraphPanelContent() {
  const { activePartConfig, experimentConfig, calculatedRows, pumpCurveMode, setPumpCurveMode } = useExperimentStore();
  const containerRef = useRef(null);

  const config = activePartConfig || experimentConfig;
  const graphConfig = config?.graph_config || {
    x_axis: { label: config?.graph?.x_label || 'X Axis', variable_ref: config?.graph?.x || 'x' },
    y_axis: { label: config?.graph?.y_label || 'Y Axis', variable_ref: config?.graph?.y || 'y' },
    series: [
      { id: 'actual', label: 'Observed Data', type: 'scatter+line', style: 'solid', color_index: 0 },
      { id: 'theoretical', label: 'Theoretical Line', type: 'line', style: 'dashed', color_index: 1 }
    ]
  };

  const referenceCode = config?.reference_code;
  const graphMeta = config?.graph || {};

  const isStepGraph = graphMeta.type === 'first_order_step';
  const isSinusoidalGraph = graphMeta.type === 'first_order_sinusoidal';
  const isCentrifugalPump = config?.experiment_id === 'centrifugal_pump' || graphMeta.type === 'centrifugal_dual_plots';
  const isReciprocatingPump = config?.experiment_id === 'reciprocating_pump' || graphMeta.type === 'reciprocating_dual_plots';
  const isPump = isCentrifugalPump || isReciprocatingPump;
  const [pumpTab, setPumpTab] = useState('both');

  /**
   * Generates smooth, realistic pump characteristic curves:
   * - In 'points_only' mode: strictly marks the observed points connected by lines (no zero-origin extension).
   * - In 'origin' mode:
   *   - Reciprocating pump:
   *     - Total Head (HT): does not come from zero; connects points directly.
   *     - Efficiency (eta), Ip, Op: curve starts from (0, 0), rises to the peak at the end point (Trial 5),
   *       and then decreases down through the points to the starting point (Trial 1) as requested.
   *   - Centrifugal pump:
   *     - Total Head (HT): starts directly at the first experimental point without zero extension.
   *     - Efficiency (eta), Ip, Op: origin-blended convex curve from (0, 0) into first point with right tail extension.
   */
  const generateSmoothPumpCurve = (points, type, isReciprocating = false, curveMode = 'origin') => {
    if (!points || points.length === 0) return { curveX: [], curveY: [] };

    // In 'points_only' mode, connect the observation points in trial order without origin curve or tail
    if (curveMode === 'points_only') {
      return {
        curveX: points.map(p => parseFloat(p.x.toFixed(3))),
        curveY: points.map(p => parseFloat(p.y.toFixed(3)))
      };
    }

    // In 'origin' mode:
    if (isReciprocating) {
      // Total Head (HT): starts directly at experimental points, does not come from zero
      if (type === 'HT') {
        return {
          curveX: points.map(p => parseFloat(p.x.toFixed(3))),
          curveY: points.map(p => parseFloat(p.y.toFixed(3)))
        };
      }

      // For eta, Op, Ip:
      // Curve starts from (0, 0), rises to the peak at the end point (Trial 5),
      // and then decreases from the end point down through the points to the start (Trial 1).
      const n = points.length;
      let peakIdx = n - 1;
      let maxY = -Infinity;
      points.forEach((p, idx) => {
        if (p.y > maxY) {
          maxY = p.y;
          peakIdx = idx;
        }
      });

      const peakPoint = points[peakIdx];
      const curveX = [];
      const curveY = [];

      // 1. Rising branch from (0, 0) up to the peak point
      const stepsRise = 25;
      for (let i = 0; i < stepsRise; i++) {
        const t = i / stepsRise;
        const x = t * peakPoint.x;
        // Smooth sine ease-out: reaches peak with a rounded horizontal tangent at the summit
        const y = Math.max(0, peakPoint.y * Math.sin((Math.PI / 2) * t));
        curveX.push(parseFloat(x.toFixed(3)));
        curveY.push(parseFloat(y.toFixed(3)));
      }

      // 2. The peak point
      curveX.push(parseFloat(peakPoint.x.toFixed(3)));
      curveY.push(parseFloat(peakPoint.y.toFixed(3)));

      // 3. Decreasing branch: from peak point down through the points to Trial 1
      const descPoints = points
        .map((p, origIdx) => ({ ...p, origIdx }))
        .filter((_, idx) => idx !== peakIdx)
        .sort((a, b) => b.y - a.y); // from near-peak down to lowest (e.g. Trial 4 -> 3 -> 2 -> 1)

      descPoints.forEach(p => {
        curveX.push(parseFloat(p.x.toFixed(3)));
        curveY.push(parseFloat(p.y.toFixed(3)));
      });

      return { curveX, curveY };
    }

    // For Centrifugal Pump in 'origin' mode:
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const n = sorted.length;
    const x1 = sorted[0].x;
    const y1 = sorted[0].y;
    const x2 = sorted[1]?.x ?? (x1 + 4.3);
    const y2 = sorted[1]?.y ?? y1;

    const curveX = [];
    const curveY = [];

    // 1. Left segment: from x = 0 up to x1
    const stepsLeft = 25;
    if (type === 'eta' || type === 'Op' || type === 'Ip') {
      const m1 = (y2 - y1) / (x2 - x1);
      const c = 1.7 * y1;
      const a = m1 * x1 - 0.3 * y1;
      const b = -0.7 * y1 - a;

      for (let i = 0; i < stepsLeft; i++) {
        const t = i / stepsLeft;
        const x = t * x1;
        const y = Math.max(0, a * t * t * t + b * t * t + c * t);
        curveX.push(parseFloat(x.toFixed(3)));
        curveY.push(parseFloat(y.toFixed(3)));
      }
    } else if (type === 'HT') {
      // Total Head starts directly at the first experimental point (x1, y1), no extension to zero
    }

    // 2. Experimental points segment (pass through all sorted data points)
    sorted.forEach(p => {
      curveX.push(parseFloat(p.x.toFixed(3)));
      curveY.push(parseFloat(p.y.toFixed(3)));
    });

    // 3. Right tail extension (for centrifugal pump)
    const xLast = sorted[n - 1].x;
    const yLast = sorted[n - 1].y;
    const xPrev = sorted[n - 2]?.x ?? (xLast - 2.6);
    const mLast = (yLast - (sorted[n - 2]?.y ?? yLast)) / (xLast - xPrev);

    const stepsRight = 10;
    const dxMax = 2.2;
    for (let j = 1; j <= stepsRight; j++) {
      const frac = j / stepsRight;
      const dx = frac * dxMax;
      const x = xLast + dx;
      let y;
      if (type === 'eta') {
        y = Math.max(0, yLast + mLast * dx - 0.05 * dx * dx);
      } else if (type === 'Op') {
        y = Math.max(0, yLast + mLast * dx - 0.25 * dx * dx);
      } else if (type === 'HT') {
        y = Math.max(0, yLast + mLast * dx - 0.04 * dx * dx);
      } else {
        y = Math.max(0, yLast + mLast * dx);
      }
      curveX.push(parseFloat(x.toFixed(3)));
      curveY.push(parseFloat(y.toFixed(3)));
    }

    return { curveX, curveY };
  };

  // Pump Dual Plots (Zero-Origin Scales & Smooth Interpolation)
  const pumpPlotData = useMemo(() => {
    if (!isPump || !calculatedRows) return null;

    const qMultiplier = isReciprocatingPump ? 1e4 : 1e5;

    const valid = calculatedRows
      .map(r => ({
        Q_raw: parseFloat(r.Q),
        Q: parseFloat(r.Q) * qMultiplier,
        HT: parseFloat(r.HT),
        eta: parseFloat(r.eta),
        Ip: parseFloat(r.Ip),
        Op: parseFloat(r.Op)
      }))
      .filter(r => !isNaN(r.Q) && !isNaN(r.HT) && !isNaN(r.eta) && !isNaN(r.Ip) && !isNaN(r.Op) && r.Q > 0);

    if (!isReciprocatingPump) {
      valid.sort((a, b) => a.Q - b.Q);
    }

    if (valid.length === 0) return null;

    const htPts = valid.map(r => ({ x: r.Q, y: r.HT }));
    const etaPts = valid.map(r => ({ x: r.Q, y: r.eta }));
    const ipPts = valid.map(r => ({ x: r.Q, y: r.Ip }));
    const opPts = valid.map(r => ({ x: r.Q, y: r.Op }));

    const htCurve = generateSmoothPumpCurve(htPts, 'HT', isReciprocatingPump, pumpCurveMode);
    const etaCurve = generateSmoothPumpCurve(etaPts, 'eta', isReciprocatingPump, pumpCurveMode);
    const ipCurve = generateSmoothPumpCurve(ipPts, 'Ip', isReciprocatingPump, pumpCurveMode);
    const opCurve = generateSmoothPumpCurve(opPts, 'Op', isReciprocatingPump, pumpCurveMode);

    const qAxisTitle = isReciprocatingPump
      ? '<b>Actual Discharge Q (× 10⁻⁴ m³/s)</b>'
      : '<b>Actual Discharge Q (× 10⁻⁵ m³/s)</b>';
    const qRange = isReciprocatingPump ? [0, 5.0] : [0, 70];
    const qDtick = isReciprocatingPump ? 0.5 : 5;

    const headRange = isReciprocatingPump ? [0, 32] : [0, 22];
    const headDtick = isReciprocatingPump ? 4 : 2;

    const etaRange = isReciprocatingPump ? [0, 25] : [0, 22];
    const etaDtick = isReciprocatingPump ? 5 : 2;

    const ipRange = isReciprocatingPump ? [0, 700] : [0, 800];
    const ipDtick = 100;

    const opRange = isReciprocatingPump ? [0, 130] : [0, 110];
    const opDtick = isReciprocatingPump ? 20 : 10;

    // Graph 1: Total Head (HT) & Efficiency (eta) vs Q
    const headLineTrace = {
      x: htCurve.curveX,
      y: htCurve.curveY,
      mode: 'lines',
      name: 'Total Head HT (m)',
      type: 'scatter',
      line: { color: '#0072BD', width: 3.0, shape: 'spline' },
      yaxis: 'y1'
    };

    const headMarkerTrace = {
      x: valid.map(r => r.Q),
      y: valid.map(r => r.HT),
      mode: 'markers',
      name: 'Head Observed',
      type: 'scatter',
      marker: {
        color: '#0072BD',
        size: 11,
        symbol: 'circle',
        line: { color: '#0f172a', width: 2 }
      },
      showlegend: false,
      yaxis: 'y1'
    };

    const etaLineTrace = {
      x: etaCurve.curveX,
      y: etaCurve.curveY,
      mode: 'lines',
      name: 'Overall Efficiency η (%)',
      type: 'scatter',
      line: { color: '#D95319', width: 3.0, shape: 'spline' },
      yaxis: 'y2'
    };

    const etaMarkerTrace = {
      x: valid.map(r => r.Q),
      y: valid.map(r => r.eta),
      mode: 'markers',
      name: 'Efficiency Observed',
      type: 'scatter',
      marker: {
        color: '#D95319',
        size: 11,
        symbol: 'square',
        line: { color: '#0f172a', width: 2 }
      },
      showlegend: false,
      yaxis: 'y2'
    };

    const headEtaLayout = {
      xaxis: {
        title: {
          text: qAxisTitle,
          font: { size: 13, color: '#0f172a', family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: qRange,
        dtick: qDtick,
        tickfont: { size: 11, color: '#0f172a', family: 'monospace' },
        showgrid: true,
        gridcolor: '#e2e8f0',
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: '#334155',
        zerolinewidth: 2,
        ticks: 'inside'
      },
      yaxis: {
        title: {
          text: '<b>Total Head HT (m)</b>',
          font: { color: '#0072BD', size: 13, family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: headRange,
        dtick: headDtick,
        tickfont: { color: '#0072BD', size: 11, family: 'monospace' },
        showgrid: true,
        gridcolor: '#e2e8f0',
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: '#334155',
        zerolinewidth: 2,
        ticks: 'inside'
      },
      yaxis2: {
        title: {
          text: '<b>Overall Efficiency η (%)</b>',
          font: { color: '#D95319', size: 13, family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: etaRange,
        dtick: etaDtick,
        overlaying: 'y',
        side: 'right',
        tickfont: { color: '#D95319', size: 11, family: 'monospace' },
        showgrid: false,
        zeroline: true,
        ticks: 'inside'
      },
      legend: {
        x: 0.88,
        y: 0.98,
        xanchor: 'right',
        yanchor: 'top',
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        bordercolor: '#cbd5e1',
        borderwidth: 1,
        font: { size: 11, color: '#0f172a' }
      },
      margin: { l: 65, r: 65, t: 45, b: 55 }
    };

    // Graph 2: Power Characteristics (Ip & Op vs Q)
    const ipLineTrace = {
      x: ipCurve.curveX,
      y: ipCurve.curveY,
      mode: 'lines',
      name: 'Input Power Ip (Watts)',
      type: 'scatter',
      line: { color: '#7E2F8E', width: 3.0, shape: 'spline' },
      yaxis: 'y1'
    };

    const ipMarkerTrace = {
      x: valid.map(r => r.Q),
      y: valid.map(r => r.Ip),
      mode: 'markers',
      name: 'Input Power Observed',
      type: 'scatter',
      marker: {
        color: '#7E2F8E',
        size: 11,
        symbol: 'diamond',
        line: { color: '#0f172a', width: 2 }
      },
      showlegend: false,
      yaxis: 'y1'
    };

    const opLineTrace = {
      x: opCurve.curveX,
      y: opCurve.curveY,
      mode: 'lines',
      name: 'Output Power Op (Watts)',
      type: 'scatter',
      line: { color: '#2E7D32', width: 3.0, shape: 'spline' },
      yaxis: 'y2'
    };

    const opMarkerTrace = {
      x: valid.map(r => r.Q),
      y: valid.map(r => r.Op),
      mode: 'markers',
      name: 'Output Power Observed',
      type: 'scatter',
      marker: {
        color: '#2E7D32',
        size: 11,
        symbol: 'triangle-up',
        line: { color: '#0f172a', width: 2 }
      },
      showlegend: false,
      yaxis: 'y2'
    };

    const powerLayout = {
      xaxis: {
        title: {
          text: qAxisTitle,
          font: { size: 13, color: '#0f172a', family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: qRange,
        dtick: qDtick,
        tickfont: { size: 11, color: '#0f172a', family: 'monospace' },
        showgrid: true,
        gridcolor: '#e2e8f0',
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: '#334155',
        zerolinewidth: 2,
        ticks: 'inside'
      },
      yaxis: {
        title: {
          text: '<b>Input Power Ip (Watts)</b>',
          font: { color: '#7E2F8E', size: 13, family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: ipRange,
        dtick: ipDtick,
        tickfont: { color: '#7E2F8E', size: 11, family: 'monospace' },
        showgrid: true,
        gridcolor: '#e2e8f0',
        gridwidth: 1,
        zeroline: true,
        zerolinecolor: '#334155',
        zerolinewidth: 2,
        ticks: 'inside'
      },
      yaxis2: {
        title: {
          text: '<b>Output Power Op (Watts)</b>',
          font: { color: '#2E7D32', size: 13, family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: opRange,
        dtick: opDtick,
        overlaying: 'y',
        side: 'right',
        tickfont: { color: '#2E7D32', size: 11, family: 'monospace' },
        showgrid: false,
        zeroline: true,
        ticks: 'inside'
      },
      legend: {
        x: 0.88,
        y: 0.98,
        xanchor: 'right',
        yanchor: 'top',
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        bordercolor: '#cbd5e1',
        borderwidth: 1,
        font: { size: 11, color: '#0f172a' }
      },
      margin: { l: 65, r: 65, t: 45, b: 55 }
    };

    return {
      headEtaTraces: [headLineTrace, headMarkerTrace, etaLineTrace, etaMarkerTrace],
      headEtaLayout,
      powerTraces: [ipLineTrace, ipMarkerTrace, opLineTrace, opMarkerTrace],
      powerLayout
    };
  }, [isPump, isReciprocatingPump, pumpCurveMode, calculatedRows]);

  // Transform calculated rows into plot points for standard scatter graph
  const chartData = useMemo(() => {
    const xKey = graphMeta.x || 'Qth';
    const yKey = graphMeta.y || 'Cd';

    return (calculatedRows || [])
      .map((r, idx) => {
        const rawX = r[xKey];
        const rawY = r[yKey];
        const xVal = typeof rawX === 'number' ? rawX : parseFloat(rawX);
        const yVal = typeof rawY === 'number' ? rawY : parseFloat(rawY);

        if (
          xVal !== null &&
          yVal !== null &&
          !isNaN(xVal) &&
          !isNaN(yVal) &&
          isFinite(xVal) &&
          isFinite(yVal)
        ) {
          return { trial: idx + 1, x: xVal, y: yVal };
        }
        return null;
      })
      .filter(Boolean);
  }, [calculatedRows, graphMeta.x, graphMeta.y]);

  // Compute linear fit theoretical curve for dual series plotting
  const { points: theoPoints } = useMemo(() => {
    if (!chartData || chartData.length < 2) return { points: [] };
    return computeLinearFit(chartData);
  }, [chartData]);

  // Special data transform for Part A Step Input
  const stepData = useMemo(() => {
    if (!isStepGraph) return [];
    return (calculatedRows || []).map((r) => {
      const rawT = parseFloat(r.t);
      const rawNorm = parseFloat(r.norm_heat);
      const tau = 10; // τ = 10s
      const t = !isNaN(rawT) ? rawT : 0;
      const normHeat = !isNaN(rawNorm) ? rawNorm : 0;
      return {
        t: t,
        t_over_tau: parseFloat((t / tau).toFixed(2)),
        exp_norm: parseFloat((normHeat / 2.6).toFixed(3)),
        theo_norm: parseFloat((1 - Math.exp(-t / tau)).toFixed(3))
      };
    });
  }, [calculatedRows, isStepGraph]);

  // Special data transform for Part B Sinusoidal Input
  const sinusoidalData = useMemo(() => {
    if (!isSinusoidalGraph) return [];
    return (calculatedRows || []).map((r) => {
      const rawT = parseFloat(r.t);
      const rawIn = parseFloat(r.T_in);
      const rawOut = parseFloat(r.T_out);
      return {
        t: !isNaN(rawT) ? rawT : 0,
        T_in: !isNaN(rawIn) ? rawIn : 0,
        T_out: !isNaN(rawOut) ? rawOut : 0
      };
    });
  }, [calculatedRows, isSinusoidalGraph]);

  // Construct Plotly Traces for MATLAB-style plot
  const plotlyTraces = useMemo(() => {
    if (!calculatedRows || calculatedRows.length === 0) return [];

    if (isStepGraph) {
      if (!stepData || stepData.length === 0) return [];
      const actualTrace = {
        x: stepData.map(d => d.t),
        y: stepData.map(d => d.exp_norm),
        mode: 'lines+markers',
        name: 'Observed Step Response',
        type: 'scatter',
        line: { color: MATLAB_COLORS[0], width: 2.5, shape: 'spline' },
        marker: { color: MATLAB_COLORS[0], size: 7, symbol: 'circle' }
      };

      const theoTrace = {
        x: stepData.map(d => d.t),
        y: stepData.map(d => d.theo_norm),
        mode: 'lines',
        name: 'Theoretical 1st Order (τ = 10s)',
        type: 'scatter',
        line: { color: MATLAB_COLORS[1], width: 2, dash: 'dash' }
      };

      return [actualTrace, theoTrace];
    }

    if (isSinusoidalGraph) {
      if (!sinusoidalData || sinusoidalData.length === 0) return [];
      const actualTrace = {
        x: sinusoidalData.map(d => d.t),
        y: sinusoidalData.map(d => d.T_out),
        mode: 'lines+markers',
        name: 'Output Sensor Temp (T_out)',
        type: 'scatter',
        line: { color: MATLAB_COLORS[0], width: 2.5, shape: 'spline' },
        marker: { color: MATLAB_COLORS[0], size: 7, symbol: 'circle' }
      };

      const theoTrace = {
        x: sinusoidalData.map(d => d.t),
        y: sinusoidalData.map(d => d.T_in),
        mode: 'lines',
        name: 'Input Bath Temp (T_in)',
        type: 'scatter',
        line: { color: MATLAB_COLORS[1], width: 2, dash: 'dash' }
      };

      return [actualTrace, theoTrace];
    }

    if (!chartData || chartData.length === 0) return [];

    // RTD CSTR E(t) vs t with E_theo = (1/t_bar) * exp(-t/t_bar) overlay
    if (config?.experiment_id === 'rtd_cstr') {
      const actualTrace = {
        x: chartData.map(d => d.x),
        y: chartData.map(d => d.y),
        mode: 'lines+markers',
        name: 'Observed Data',
        type: 'scatter',
        line: { color: MATLAB_COLORS[0], width: 2, shape: 'spline' },
        marker: { color: MATLAB_COLORS[0], size: 7, symbol: 'circle' }
      };

      const traces = [actualTrace];
      const t_bar = calculatedRows?.[0]?.t_bar;

      if (t_bar && !isNaN(t_bar) && t_bar > 0) {
        const maxT = Math.max(...chartData.map(d => d.x), 240);
        const theoX = [];
        const theoY = [];
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const tVal = (maxT / steps) * i;
          const eTheo = (1 / t_bar) * Math.exp(-tVal / t_bar);
          theoX.push(tVal);
          theoY.push(eTheo);
        }

        traces.push({
          x: theoX,
          y: theoY,
          mode: 'lines',
          name: 'Theoretical Line (Ideal CSTR)',
          type: 'scatter',
          line: { color: MATLAB_COLORS[1], width: 2, dash: 'dash' }
        });
      }

      return traces;
    }

    // Standard Experiment Scatter + Theoretical Linear Fit Overlay
    const actualTrace = {
      x: chartData.map(d => d.x),
      y: chartData.map(d => d.y),
      mode: 'lines+markers',
      name: 'Observed Data',
      type: 'scatter',
      line: { color: MATLAB_COLORS[0], width: 2, shape: 'spline' },
      marker: { color: MATLAB_COLORS[0], size: 7, symbol: 'circle' }
    };

    const traces = [actualTrace];

    if (graphConfig.show_theoretical !== false && theoPoints && theoPoints.length >= 2) {
      const theoTrace = {
        x: theoPoints.map(d => d.x),
        y: theoPoints.map(d => d.y),
        mode: 'lines',
        name: 'Theoretical Line',
        type: 'scatter',
        line: { color: MATLAB_COLORS[1], width: 2, dash: 'dash' }
      };
      traces.push(theoTrace);
    }

    return traces;
  }, [calculatedRows, isStepGraph, isSinusoidalGraph, config?.experiment_id, stepData, sinusoidalData, chartData, theoPoints, graphConfig.show_theoretical]);

  const exportChartPng = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#FFFFFF',
        scale: 2
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${config?.experiment_id || 'experiment'}_matlab_figure.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export graph PNG:', err);
    }
  };

  const hasData = isPump
    ? Boolean(pumpPlotData)
    : Boolean(plotlyTraces && plotlyTraces.length > 0);

  return (
    <div ref={containerRef} className="w-full">
      <FigureCard
        title={graphMeta.title || 'MATLAB Figure Window'}
        subtitle={
          isReciprocatingPump
            ? pumpCurveMode === 'origin'
              ? 'Reciprocating Pump Performance Curves: Peak & Decreasing Zero-Origin Characteristics'
              : 'Reciprocating Pump Performance Curves: Direct Observation Points Line'
            : isCentrifugalPump
            ? pumpCurveMode === 'origin'
              ? 'Centrifugal Pump Performance Curves: Dual-Part Zero-Origin Characteristics'
              : 'Centrifugal Pump Performance Curves: Direct Observation Points Line'
            : isStepGraph
            ? 'First-Order Step Response (Observed vs Theoretical 63.2% Curve)'
            : isSinusoidalGraph
            ? 'Sinusoidal Response Overlay (Input Bath vs Output Thermowell Sensor)'
            : 'Scientific Dual-Series Plot: Observed Data vs Theoretical Line'
        }
        referenceCode={referenceCode}
        onExportPng={exportChartPng}
        isExportDisabled={!hasData}
      >
        {!hasData ? (
          <div className="h-[340px] rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
            <p>Enter observation readings to generate the MATLAB-styled figure.</p>
          </div>
        ) : isPump && pumpPlotData ? (
          <div className="space-y-4">
            {/* Pump Graph Controls: Part Switcher & Curve Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-slate-100 rounded-lg border border-slate-200">
              {/* Part Switcher */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-slate-700 mr-1">GRAPH:</span>
                <button
                  onClick={() => setPumpTab('both')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpTab === 'both'
                      ? 'bg-violet-700 text-white shadow-sm ring-2 ring-violet-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Both Graphs
                </button>
                <button
                  onClick={() => setPumpTab('head_eta')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpTab === 'head_eta'
                      ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Graph 1: Head & η
                </button>
                <button
                  onClick={() => setPumpTab('power')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpTab === 'power'
                      ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Graph 2: Ip & Op
                </button>
              </div>

              {/* Curve Origin Mode Selector */}
              <div className="flex flex-wrap items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-1.5 sm:pt-0 sm:pl-2.5">
                <span className="text-xs font-mono font-bold text-slate-700 mr-1">CURVE MODE:</span>
                <button
                  onClick={() => setPumpCurveMode('origin')}
                  title="Curve comes from origin (0,0) like a smooth curve"
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpCurveMode === 'origin'
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Curve from Origin (0,0)
                </button>
                <button
                  onClick={() => setPumpCurveMode('points_only')}
                  title="Line connects observation points only without zero origin"
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpCurveMode === 'points_only'
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Points Only (No Origin)
                </button>
              </div>
            </div>

            {/* Render Graph 1: Head & Efficiency */}
            {(pumpTab === 'both' || pumpTab === 'head_eta') && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold text-blue-950">
                    FIGURE 1: Total Head (HT) & Overall Efficiency (η) vs Discharge (Q)
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Dual-Axis • {pumpCurveMode === 'origin' ? 'Origin (0,0)' : 'Points Only'} • Q ({isReciprocatingPump ? '× 10⁻⁴ m³/s' : '× 10⁻⁵ m³/s'})
                  </span>
                </div>
                <MatlabStyledPlot
                  data={pumpPlotData.headEtaTraces}
                  layout={pumpPlotData.headEtaLayout}
                  title="Graph 1: Total Head (HT) & Overall Efficiency (η) vs Discharge (Q)"
                  height={pumpTab === 'both' ? 380 : 480}
                />
              </div>
            )}

            {/* Render Graph 2: Power Characteristics */}
            {(pumpTab === 'both' || pumpTab === 'power') && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-950">
                    FIGURE 2: Input Power (Ip) & Output Power (Op) vs Discharge (Q)
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Dual-Axis • {pumpCurveMode === 'origin' ? 'Origin (0,0)' : 'Points Only'} • Q ({isReciprocatingPump ? '× 10⁻⁴ m³/s' : '× 10⁻⁵ m³/s'})
                  </span>
                </div>
                <MatlabStyledPlot
                  data={pumpPlotData.powerTraces}
                  layout={pumpPlotData.powerLayout}
                  title="Graph 2: Input Power (Ip) & Output Power (Op) vs Discharge (Q)"
                  height={pumpTab === 'both' ? 380 : 480}
                />
              </div>
            )}
          </div>
        ) : (
          <MatlabStyledPlot
            data={plotlyTraces}
            title={graphMeta.title}
            xAxisLabel={graphConfig.x_axis?.label || graphMeta.x_label}
            yAxisLabel={graphConfig.y_axis?.label || graphMeta.y_label}
            height={400}
          />
        )}
      </FigureCard>
    </div>
  );
}

export function GraphPanel() {
  return (
    <GraphPanelErrorBoundary>
      <GraphPanelContent />
    </GraphPanelErrorBoundary>
  );
}
