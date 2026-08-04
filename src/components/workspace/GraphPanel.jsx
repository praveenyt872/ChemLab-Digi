import React, { useRef } from 'react';
import {
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { Download, LineChart, RefreshCw, Activity } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useExperimentStore } from '../../store/experimentStore';
import { formatScientific } from '../../engine/formulaEngine';

export function GraphPanel() {
  const { activePartConfig, experimentConfig, calculatedRows, observationRows } = useExperimentStore();
  const chartRef = useRef(null);

  const config = activePartConfig || experimentConfig;
  const graphConfig = config?.graph || {
    type: 'scatter_with_trend',
    x: 'Qth',
    y: 'Cd',
    x_label: 'Theoretical Flow Qth (m³/s)',
    y_label: 'Cd',
    title: 'Calibration Curve'
  };

  const isStepGraph = graphConfig.type === 'first_order_step';
  const isSinusoidalGraph = graphConfig.type === 'first_order_sinusoidal';

  // Transform calculated rows into plot points for standard scatter graph
  const chartData = calculatedRows
    .map((r, idx) => {
      const rawX = r[graphConfig.x];
      const rawY = r[graphConfig.y];
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
        return {
          trial: idx + 1,
          x: xVal,
          y: yVal,
          formattedX: Math.abs(xVal) < 0.01 && xVal !== 0 ? formatScientific(xVal, 4) : xVal.toFixed(3),
          formattedY: Math.abs(yVal) < 0.01 && yVal !== 0 ? formatScientific(yVal, 4) : yVal.toFixed(3)
        };
      }
      return null;
    })
    .filter(Boolean);

  // Special data transform for Part A Step Input: Normalized T'/K vs t/τ + Theoretical Overlay
  const stepData = calculatedRows.map((r) => {
    const rawT = parseFloat(r.t);
    const rawNorm = parseFloat(r.norm_heat);
    const rawRise = parseFloat(r.T_rise);
    const rawFall = parseFloat(r.T_fall);
    const tau = 10; // τ = 10s
    const t = !isNaN(rawT) ? rawT : 0;
    const normHeat = !isNaN(rawNorm) ? rawNorm : 0;
    return {
      t: t,
      t_over_tau: parseFloat((t / tau).toFixed(2)),
      exp_norm: parseFloat((normHeat / 2.6).toFixed(3)),
      theo_norm: parseFloat((1 - Math.exp(-t / tau)).toFixed(3)),
      T_rise: !isNaN(rawRise) ? rawRise : 0,
      T_fall: !isNaN(rawFall) ? rawFall : 0
    };
  });

  // Special data transform for Part B Sinusoidal Input: T_in vs T_out over time
  const sinusoidalData = calculatedRows.map((r) => {
    const rawT = parseFloat(r.t);
    const rawIn = parseFloat(r.T_in);
    const rawOut = parseFloat(r.T_out);
    return {
      t: !isNaN(rawT) ? rawT : 0,
      T_in: !isNaN(rawIn) ? rawIn : 0,
      T_out: !isNaN(rawOut) ? rawOut : 0
    };
  });

  // Compute simple linear regression (trend line for standard scatter plot)
  let lineData = [];
  if (!isStepGraph && !isSinusoidalGraph && chartData.length >= 2) {
    const xs = chartData.map(d => d.x);
    const ys = chartData.map(d => d.y);
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
    const sumXX = xs.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    lineData = [
      { x: minX, trend: slope * minX + intercept },
      { x: maxX, trend: slope * maxX + intercept }
    ];
  }

  const exportChartPng = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#05070d',
        scale: 2
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${config.experiment_id}_graph.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export graph PNG:', err);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 backdrop-blur-md shadow-xl text-xs font-mono space-y-1">
          {data.trial && <p className="text-cyan-300 font-bold">Trial #{data.trial}</p>}
          {data.t !== undefined && <p className="text-cyan-300 font-bold">Time: {data.t} s</p>}
          {data.formattedX && <p className="text-slate-300">{graphConfig.x_label}: <span className="text-cyan-400 font-bold">{data.formattedX}</span></p>}
          {data.formattedY && <p className="text-slate-300">{graphConfig.y_label}: <span className="text-cyan-400 font-bold">{data.formattedY}</span></p>}
          {data.T_rise !== undefined && <p className="text-emerald-400">Heating T_rise: <span className="font-bold">{data.T_rise} °C</span></p>}
          {data.T_fall !== undefined && <p className="text-amber-400">Cooling T_fall: <span className="font-bold">{data.T_fall} °C</span></p>}
          {data.T_in !== undefined && <p className="text-cyan-400">Input Bath T_in: <span className="font-bold">{data.T_in} °C</span></p>}
          {data.T_out !== undefined && <p className="text-violet-400">Output Sensor T_out: <span className="font-bold">{data.T_out} °C</span></p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4" ref={chartRef}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            <span>{graphConfig.title}</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {isStepGraph
              ? 'First-Order Step Response (63.2% time constant determination)'
              : isSinusoidalGraph
              ? 'Sinusoidal Response Overlay (Input Bath vs Output Thermowell Sensor)'
              : 'Auto-generated scatter plot with linear regression overlay'}
          </p>
        </div>

        <button
          onClick={exportChartPng}
          disabled={calculatedRows.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Graph PNG</span>
        </button>
      </div>

      {calculatedRows.length === 0 ? (
        <div className="h-[320px] rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
          <RefreshCw className="w-8 h-8 text-cyan-400/40 animate-spin" />
          <p>Enter observation readings to generate the live plot.</p>
        </div>
      ) : isStepGraph ? (
        /* PART A: STEP RESPONSE GRAPHS */
        <div className="space-y-4">
          {/* Graph 1: Normalized Response T'/K vs t/τ with 0.632 Reference Line */}
          <div className="h-[300px] w-full rounded-xl border border-cyan-500/20 bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="text-xs font-mono text-cyan-300 mb-2 flex items-center justify-between">
              <span>Graph 1: Normalized Step Response T̄'(t)/K vs t/τ</span>
              <span className="text-emerald-400 font-bold">τ = 10 s @ 63.2% Response</span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <ComposedChart data={stepData} margin={{ top: 15, right: 30, bottom: 25, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="t_over_tau"
                  type="number"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  stroke="rgba(0,229,255,0.2)"
                  label={{ value: 'time / τ', position: 'insideBottom', offset: -15, fill: '#00e5ff', fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 1.1]}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  stroke="rgba(0,229,255,0.2)"
                  label={{ value: "T̄'(t) / K", angle: -90, position: 'insideLeft', fill: '#00e5ff', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0.632} stroke="#3dffb0" strokeDasharray="4 4" label={{ value: '63.2% (t = τ)', fill: '#3dffb0', fontSize: 11, position: 'right' }} />
                <Line type="monotone" dataKey="exp_norm" name="Experimental Response" stroke="#00e5ff" strokeWidth={2.5} dot={{ r: 4, fill: '#00e5ff' }} />
                <Line type="monotone" dataKey="theo_norm" name="Theoretical 1 - e^(-t/τ)" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Graph 2: Heating vs Cooling Curves Comparison */}
          <div className="h-[280px] w-full rounded-xl border border-violet-500/20 bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="text-xs font-mono text-violet-300 mb-2 flex items-center justify-between">
              <span>Graph 2: Heating vs Cooling Temperature Curves (°C vs time s)</span>
              <span className="text-slate-400">Heating: 25°C → 51°C | Cooling: 51°C → 25°C</span>
            </div>
            <ResponsiveContainer width="100%" height="88%">
              <ComposedChart data={stepData} margin={{ top: 15, right: 30, bottom: 25, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="t"
                  type="number"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  stroke="rgba(139,92,246,0.2)"
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -15, fill: '#8b5cf6', fontSize: 11 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  stroke="rgba(139,92,246,0.2)"
                  label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#8b5cf6', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="T_rise" name="Heating Response (Oil Bath)" stroke="#00e5ff" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="T_fall" name="Cooling Response (Air/Water)" stroke="#ffb020" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : isSinusoidalGraph ? (
        /* PART B: SINUSOIDAL RESPONSE OVERLAY GRAPH */
        <div className="h-[340px] w-full rounded-xl border border-violet-500/30 bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="text-xs font-mono text-violet-300 mb-2 flex items-center justify-between">
            <span>Sinusoidal Response: Input Bath (32–48°C) vs Output Thermowell (37–43°C)</span>
            <span className="text-cyan-400 font-bold">AR = 3/8 = 0.375 | Period = 60s</span>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <ComposedChart data={sinusoidalData} margin={{ top: 15, right: 30, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="t"
                type="number"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(139,92,246,0.3)"
                label={{ value: 'Time (sec)', position: 'insideBottom', offset: -15, fill: '#8b5cf6', fontSize: 11 }}
              />
              <YAxis
                domain={[25, 55]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(139,92,246,0.3)"
                label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#8b5cf6', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="T_in" name="Input Bath Temp (T_in)" stroke="#00e5ff" strokeWidth={2.5} dot={{ r: 4, fill: '#00e5ff' }} />
              <Line type="monotone" dataKey="T_out" name="Output Sensor Temp (T_out)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* STANDARD FLUID MECHANICS SCATTER PLOT */
        <div className="h-[340px] w-full rounded-xl border border-cyan-500/20 bg-slate-950/80 p-4 backdrop-blur-md">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 30, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="x"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(0,229,255,0.2)"
                label={{
                  value: graphConfig.x_label,
                  position: 'insideBottom',
                  offset: -15,
                  fill: '#00e5ff',
                  fontSize: 11,
                  fontFamily: 'Space Grotesk'
                }}
              />
              <YAxis
                dataKey="y"
                type="number"
                domain={['auto', 'auto']}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                stroke="rgba(0,229,255,0.2)"
                label={{
                  value: graphConfig.y_label,
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#00e5ff',
                  fontSize: 11,
                  fontFamily: 'Space Grotesk'
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                name="Lab Data Points"
                data={chartData}
                fill="#00e5ff"
                stroke="#00e5ff"
                strokeWidth={2}
              />
              {lineData.length >= 2 && (
                <Line
                  data={lineData}
                  type="monotone"
                  dataKey="trend"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
