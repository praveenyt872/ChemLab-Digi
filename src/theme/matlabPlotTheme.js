/**
 * Shared MATLAB Plot Theme for Plotly.js
 * Replicates MATLAB's signature plot aesthetic:
 * - White plot background with full boxed axes (mirror: true)
 * - MATLAB default 7-color palette cycle
 * - Inward-pointing tick marks
 * - Light grey solid grid lines (#e0e0e0)
 * - Sans-serif Helvetica/Arial typography
 * - Top-right boxed legend inside the plot area
 */

export const MATLAB_COLORS = [
  '#0072BD', // 0: MATLAB Blue (Actual Data / Primary)
  '#D95319', // 1: MATLAB Orange (Theoretical Line / Secondary)
  '#EDB120', // 2: MATLAB Yellow
  '#7E2F8E', // 3: MATLAB Purple
  '#77AC30', // 4: MATLAB Green
  '#4DBEEE', // 5: MATLAB Cyan
  '#A2142F'  // 6: MATLAB Red
];

export const matlabPlotTheme = {
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  font: {
    family: "'Helvetica Neue', Arial, sans-serif",
    size: 11,
    color: '#0f172a'
  },
  title: {
    font: {
      family: "'Helvetica Neue', Arial, sans-serif",
      size: 14,
      color: '#0f172a'
    },
    x: 0.5, // Centered title
    xanchor: 'center'
  },
  margin: {
    l: 60,
    r: 30,
    t: 45,
    b: 50
  },
  xaxis: {
    showline: true,
    mirror: true,
    linecolor: '#000000',
    linewidth: 1.5,
    gridcolor: '#e0e0e0',
    gridwidth: 1,
    ticks: 'inside',
    tickcolor: '#000000',
    tickfont: {
      family: "'Helvetica Neue', Arial, sans-serif",
      size: 10,
      color: '#0f172a'
    },
    title: {
      font: {
        family: "'Helvetica Neue', Arial, sans-serif",
        size: 11,
        color: '#0f172a'
      }
    },
    zeroline: false
  },
  yaxis: {
    showline: true,
    mirror: true,
    linecolor: '#000000',
    linewidth: 1.5,
    gridcolor: '#e0e0e0',
    gridwidth: 1,
    ticks: 'inside',
    tickcolor: '#000000',
    tickfont: {
      family: "'Helvetica Neue', Arial, sans-serif",
      size: 10,
      color: '#0f172a'
    },
    title: {
      font: {
        family: "'Helvetica Neue', Arial, sans-serif",
        size: 11,
        color: '#0f172a'
      }
    },
    zeroline: false
  },
  legend: {
    x: 0.98,
    y: 0.98,
    xanchor: 'right',
    yanchor: 'top',
    bgcolor: 'rgba(255, 255, 255, 0.9)',
    bordercolor: '#000000',
    borderwidth: 1,
    font: {
      family: "'Helvetica Neue', Arial, sans-serif",
      size: 9.5,
      color: '#0f172a'
    }
  },
  autosize: true,
  hoverlabel: {
    bgcolor: '#ffffff',
    bordercolor: '#cbd5e1',
    font: {
      family: "'Helvetica Neue', Arial, sans-serif",
      size: 11,
      color: '#0f172a'
    }
  }
};
