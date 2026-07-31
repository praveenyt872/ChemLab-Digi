import React, { useRef } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { Download, LineChart, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useExperimentStore } from '../../store/experimentStore';
import { formatScientific } from '../../engine/formulaEngine';

export function GraphPanel() {
  const { experimentConfig, calculatedRows } = useExperimentStore();
  const chartRef = useRef(null);

  const graphConfig = experimentConfig?.graph || {
    x: 'Qth',
    y: 'Cd',
    x_label: 'Theoretical Flow Qth (m³/s)',
    y_label: 'Cd',
    title: 'Calibration Curve'
  };

  // Transform calculated rows into plot points
  const chartData = calculatedRows
    .map((r, idx) => {
      const xVal = r[graphConfig.x];
      const yVal = r[graphConfig.y];
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
          formattedX: typeof xVal === 'number' && Math.abs(xVal) < 0.01 && xVal !== 0 ? formatScientific(xVal, 4) : xVal.toFixed(3),
          formattedY: typeof yVal === 'number' && Math.abs(yVal) < 0.01 && yVal !== 0 ? formatScientific(yVal, 4) : yVal.toFixed(3)
        };
      }
      return null;
    })
    .filter(Boolean);

  // Compute simple linear regression (trend line)
  let lineData = [];
  if (chartData.length >= 2) {
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

  // Export Chart as PNG
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
      link.download = `${experimentConfig.experiment_id}_graph.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export graph PNG:', err);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 backdrop-blur-md shadow-xl text-xs font-mono">
          <p className="text-cyan-300 font-bold mb-1">Trial #{data.trial}</p>
          <p className="text-slate-300">
            {graphConfig.x_label}: <span className="text-cyan-400 font-bold">{data.formattedX}</span>
          </p>
          <p className="text-slate-300">
            {graphConfig.y_label}: <span className="text-cyan-400 font-bold">{data.formattedY}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3" ref={chartRef}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            <span>{graphConfig.title}</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Auto-generated scatter plot with linear regression overlay
          </p>
        </div>

        <button
          onClick={exportChartPng}
          disabled={chartData.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Graph PNG</span>
        </button>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[320px] rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
          <RefreshCw className="w-8 h-8 text-cyan-400/40 animate-spin" />
          <p>Enter observation readings to generate the live calibration plot.</p>
        </div>
      ) : (
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
