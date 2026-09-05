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

  // Centrifugal Pump Dual Plots (Zero-Origin Scales)
  const pumpPlotData = useMemo(() => {
    if (!isCentrifugalPump || !calculatedRows) return null;

    const valid = calculatedRows
      .map(r => ({
        Q: parseFloat(r.Q),
        HT: parseFloat(r.HT),
        eta: parseFloat(r.eta),
        Ip: parseFloat(r.Ip),
        Op: parseFloat(r.Op)
      }))
      .filter(r => !isNaN(r.Q) && !isNaN(r.HT) && !isNaN(r.eta) && !isNaN(r.Ip) && !isNaN(r.Op) && r.Q > 0)
      .sort((a, b) => a.Q - b.Q);

    if (valid.length === 0) return null;

    const maxQ = Math.max(...valid.map(r => r.Q), 0.00065);
    const xMax = Math.ceil(maxQ * 1.15 * 10000) / 10000;

    // Graph 1: Total Head (HT) & Efficiency (eta) vs Q
    const headTrace = {
      x: valid.map(r => r.Q),
      y: valid.map(r => r.HT),
      mode: 'lines+markers',
      name: 'Total Head HT (m)',
      type: 'scatter',
      line: { color: '#0072BD', width: 2.5, shape: 'spline' },
      marker: { color: '#0072BD', size: 8, symbol: 'circle' },
      yaxis: 'y1'
    };

    // Overall Efficiency starts from origin (0, 0)
    const etaTrace = {
      x: [0, ...valid.map(r => r.Q)],
      y: [0, ...valid.map(r => r.eta)],
      mode: 'lines+markers',
      name: 'Overall Efficiency η (%)',
      type: 'scatter',
      line: { color: '#D95319', width: 2.5, shape: 'spline' },
      marker: { color: '#D95319', size: 8, symbol: 'square' },
      yaxis: 'y2'
    };

    const headEtaLayout = {
      xaxis: {
        title: { text: '<i>Actual Discharge Q (m³/s)</i>' },
        rangemode: 'tozero',
        range: [0, xMax],
        showgrid: true,
        zeroline: true,
        zerolinecolor: '#64748b',
        zerolinewidth: 2
      },
      yaxis: {
        title: { text: '<i>Total Head HT (m)</i>', font: { color: '#0072BD', size: 12 } },
        rangemode: 'tozero',
        range: [0, 25],
        tickfont: { color: '#0072BD' },
        showgrid: true,
        zeroline: true
      },
      yaxis2: {
        title: { text: '<i>Overall Efficiency η (%)</i>', font: { color: '#D95319', size: 12 } },
        rangemode: 'tozero',
        range: [0, 25],
        overlaying: 'y',
        side: 'right',
        tickfont: { color: '#D95319' },
        showgrid: false,
        zeroline: true
      }
    };

    // Graph 2: Power Characteristics (Ip & Op vs Q)
    const ipTrace = {
      x: valid.map(r => r.Q),
      y: valid.map(r => r.Ip),
      mode: 'lines+markers',
      name: 'Input Power Ip (W)',
      type: 'scatter',
      line: { color: '#7E2F8E', width: 2.5, shape: 'spline' },
      marker: { color: '#7E2F8E', size: 8, symbol: 'diamond' },
      yaxis: 'y1'
    };

    // Output Power starts from origin (0, 0)
    const opTrace = {
      x: [0, ...valid.map(r => r.Q)],
      y: [0, ...valid.map(r => r.Op)],
      mode: 'lines+markers',
      name: 'Output Power Op (W)',
      type: 'scatter',
      line: { color: '#77AC30', width: 2.5, shape: 'spline' },
      marker: { color: '#77AC30', size: 8, symbol: 'triangle-up' },
      yaxis: 'y2'
    };

    const powerLayout = {
      xaxis: {
        title: { text: '<i>Actual Discharge Q (m³/s)</i>' },
        rangemode: 'tozero',
        range: [0, xMax],
        showgrid: true,
        zeroline: true,
        zerolinecolor: '#64748b',
        zerolinewidth: 2
      },
      yaxis: {
        title: { text: '<i>Input Power Ip (Watts)</i>', font: { color: '#7E2F8E', size: 12 } },
        rangemode: 'tozero',
        range: [0, 800],
        tickfont: { color: '#7E2F8E' },
        showgrid: true,
        zeroline: true
      },
      yaxis2: {
        title: { text: '<i>Output Power Op (Watts)</i>', font: { color: '#77AC30', size: 12 } },
        rangemode: 'tozero',
        range: [0, 120],
        overlaying: 'y',
        side: 'right',
        tickfont: { color: '#77AC30' },
        showgrid: false,
        zeroline: true
      }
    };

    return {
      headEtaTraces: [headTrace, etaTrace],
      headEtaLayout,
      powerTraces: [ipTrace, opTrace],
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
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100">
                  <span className="text-xs font-mono font-bold text-blue-900">
                    FIGURE 1: Total Head (HT) & Overall Efficiency (η) vs Discharge (Q)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Dual-Axis • Origin at 0
                  </span>
                </div>
                <MatlabStyledPlot
                  data={pumpPlotData.headEtaTraces}
                  layout={pumpPlotData.headEtaLayout}
                  title="Graph 1: Total Head (HT) & Overall Efficiency (η) vs Discharge (Q)"
                  height={pumpTab === 'both' ? 320 : 400}
                />
              </div>
            )}

            {/* Render Graph 2: Power Characteristics */}
            {(pumpTab === 'both' || pumpTab === 'power') && (
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-100">
                  <span className="text-xs font-mono font-bold text-emerald-900">
                    FIGURE 2: Input Power (Ip) & Output Power (Op) vs Discharge (Q)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Dual-Axis • Origin at 0
                  </span>
                </div>
                <MatlabStyledPlot
                  data={pumpPlotData.powerTraces}
                  layout={pumpPlotData.powerLayout}
                  title="Graph 2: Input Power (Ip) & Output Power (Op) vs Discharge (Q)"
                  height={pumpTab === 'both' ? 320 : 400}
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
            height={360}
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
