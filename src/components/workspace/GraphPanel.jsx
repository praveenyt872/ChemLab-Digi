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
  const { activePartConfig, experimentConfig, calculatedRows } = useExperimentStore();
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
  const [pumpTab, setPumpTab] = useState('both');

  /**
   * Generates smooth, realistic centrifugal pump characteristic curves:
   * - Scaled discharge: Q * 10^5 (so values are e.g. 48.1, 52.4, 58.9, 61.9, 64.5)
   * - Origin blending: for efficiency (eta) and output power (Op), builds a smooth
   *   convex ease-out cubic curve from (0, 0) directly tangentially meeting the first data point.
   * - Shutoff blending: for total head (HT), starts at shutoff head (~18.4 m) at Q=0,
   *   and for input power (Ip), starts at shutoff/no-load power (~460 W) at Q=0.
   * - Right tail extension: smoothly extends past the last experimental point downwards.
   */
  const generateSmoothPumpCurve = (points, type) => {
    if (!points || points.length === 0) return { curveX: [], curveY: [] };

    const sorted = [...points].sort((a, b) => a.x - b.x);
    const n = sorted.length;
    const x1 = sorted[0].x;
    const y1 = sorted[0].y;
    const x2 = sorted[1]?.x ?? (x1 + 4.3);
    const y2 = sorted[1]?.y ?? y1;
    const m1 = (y2 - y1) / (x2 - x1);

    const curveX = [];
    const curveY = [];

    // 1. Left segment: from x = 0 up to x1
    const stepsLeft = 25;
    if (type === 'eta' || type === 'Op' || type === 'Ip') {
      // Cubic polynomial y(t) = a*t^3 + b*t^2 + c*t where t = x / x1 in [0, 1]
      // y(0) = 0, y(1) = y1, y'(1) = m1 * x1, initial slope c = 1.7 * y1 (convex arch)
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

    // 3. Right tail extension past x_n (extending by ~2.2 units downwards)
    const xLast = sorted[n - 1].x;
    const yLast = sorted[n - 1].y;
    const xPrev = sorted[n - 2]?.x ?? (xLast - 2.6);
    const yPrev = sorted[n - 2]?.y ?? yLast;
    const mLast = (yLast - yPrev) / (xLast - xPrev);

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

  // Centrifugal Pump Dual Plots (Zero-Origin Scales & Smooth Interpolation)
  const pumpPlotData = useMemo(() => {
    if (!isCentrifugalPump || !calculatedRows) return null;

    const valid = calculatedRows
      .map(r => ({
        Q_raw: parseFloat(r.Q),
        Q: parseFloat(r.Q) * 1e5, // Scaled by 10^5 (e.g. 48.1, 52.4, 58.9, 61.9, 64.5)
        HT: parseFloat(r.HT),
        eta: parseFloat(r.eta),
        Ip: parseFloat(r.Ip),
        Op: parseFloat(r.Op)
      }))
      .filter(r => !isNaN(r.Q) && !isNaN(r.HT) && !isNaN(r.eta) && !isNaN(r.Ip) && !isNaN(r.Op) && r.Q > 0)
      .sort((a, b) => a.Q - b.Q);

    if (valid.length === 0) return null;

    const htPts = valid.map(r => ({ x: r.Q, y: r.HT }));
    const etaPts = valid.map(r => ({ x: r.Q, y: r.eta }));
    const ipPts = valid.map(r => ({ x: r.Q, y: r.Ip }));
    const opPts = valid.map(r => ({ x: r.Q, y: r.Op }));

    const htCurve = generateSmoothPumpCurve(htPts, 'HT');
    const etaCurve = generateSmoothPumpCurve(etaPts, 'eta');
    const ipCurve = generateSmoothPumpCurve(ipPts, 'Ip');
    const opCurve = generateSmoothPumpCurve(opPts, 'Op');

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
          text: '<b>Actual Discharge Q (× 10⁻⁵ m³/s)</b>',
          font: { size: 13, color: '#0f172a', family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: [0, 70],
        dtick: 5,
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
        range: [0, 22],
        dtick: 2,
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
        range: [0, 22],
        dtick: 2,
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
          text: '<b>Actual Discharge Q (× 10⁻⁵ m³/s)</b>',
          font: { size: 13, color: '#0f172a', family: "'Helvetica Neue', Arial, sans-serif" }
        },
        rangemode: 'tozero',
        range: [0, 70],
        dtick: 5,
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
        range: [0, 800],
        dtick: 100,
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
        range: [0, 110],
        dtick: 10,
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
  }, [isCentrifugalPump, calculatedRows]);

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

  const hasData = isCentrifugalPump
    ? Boolean(pumpPlotData)
    : Boolean(plotlyTraces && plotlyTraces.length > 0);

  return (
    <div ref={containerRef} className="w-full">
      <FigureCard
        title={graphMeta.title || 'MATLAB Figure Window'}
        subtitle={
          isCentrifugalPump
            ? 'Centrifugal Pump Performance Curves: Dual-Part Zero-Origin Characteristics'
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
        ) : isCentrifugalPump && pumpPlotData ? (
          <div className="space-y-4">
            {/* Centrifugal Pump Graph Part Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-lg border border-slate-200">
              <span className="text-xs font-mono font-bold text-slate-700">GRAPH SELECTION:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setPumpTab('both')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpTab === 'both'
                      ? 'bg-violet-700 text-white shadow-sm ring-2 ring-violet-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Both Graphs (Split View)
                </button>
                <button
                  onClick={() => setPumpTab('head_eta')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpTab === 'head_eta'
                      ? 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Graph 1: Head & Efficiency
                </button>
                <button
                  onClick={() => setPumpTab('power')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    pumpTab === 'power'
                      ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  Graph 2: Input & Output Power
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
                    Dual-Axis • Origin at 0 • Q (× 10⁻⁵ m³/s)
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
                    Dual-Axis • Origin at 0 • Q (× 10⁻⁵ m³/s)
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
