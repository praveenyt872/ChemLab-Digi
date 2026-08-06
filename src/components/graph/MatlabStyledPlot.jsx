import React, { useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { matlabPlotTheme, MATLAB_COLORS } from '../../theme/matlabPlotTheme';

const Plot = createPlotlyComponent(Plotly);

/**
 * MatlabStyledPlot
 * Generic Plotly.js rendering wrapper that applies MATLAB default plot aesthetics:
 * - Full boxed axes (mirror: true)
 * - Inward-pointing tick marks
 * - Light grey solid grid lines (#e0e0e0)
 * - MATLAB default color cycle (Series 0: Blue #0072BD, Series 1: Orange #D95319)
 * - Top-right inside boxed legend
 */
export function MatlabStyledPlot({
  data = [],
  layout = {},
  title = '',
  xAxisLabel = '',
  yAxisLabel = '',
  height = 360
}) {
  const mergedLayout = useMemo(() => {
    return {
      ...matlabPlotTheme,
      height: height,
      title: title
        ? {
            ...matlabPlotTheme.title,
            text: `<b>${title}</b>`
          }
        : undefined,
      xaxis: {
        ...matlabPlotTheme.xaxis,
        title: xAxisLabel ? { text: `<i>${xAxisLabel}</i>`, ...matlabPlotTheme.xaxis.title } : undefined,
        ...(layout.xaxis || {})
      },
      yaxis: {
        ...matlabPlotTheme.yaxis,
        title: yAxisLabel ? { text: `<i>${yAxisLabel}</i>`, ...matlabPlotTheme.yaxis.title } : undefined,
        ...(layout.yaxis || {})
      },
      margin: {
        ...matlabPlotTheme.margin,
        ...(layout.margin || {})
      },
      legend: {
        ...matlabPlotTheme.legend,
        ...(layout.legend || {})
      },
      ...layout
    };
  }, [layout, title, xAxisLabel, yAxisLabel, height]);

  const configOptions = useMemo(() => {
    return {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'matlab_lab_plot',
        height: 500,
        width: 700,
        scale: 2
      }
    };
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white border border-[#EDEEF1] p-1">
      <Plot
        data={data}
        layout={mergedLayout}
        config={configOptions}
        style={{ width: '100%', height: `${height}px` }}
        useResizeHandler={true}
      />
    </div>
  );
}
