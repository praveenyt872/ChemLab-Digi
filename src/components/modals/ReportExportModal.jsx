import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileDown, Printer, CheckCircle, FlaskConical, Loader2, Download, Sparkles } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { formatValue } from '../../engine/formulaEngine';
import { KaTeXRenderer } from '../common/KaTeXRenderer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

export function ReportExportModal() {
  const { isReportModalOpen, setReportModalOpen, experimentConfig, observationRows, calculatedRows, headlineResult } = useExperimentStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef(null);

  if (!isReportModalOpen || !experimentConfig) return null;

  const trialInputs = experimentConfig?.trial_inputs || [];
  const calcColumns = experimentConfig?.calculated_columns || [];
  const graphConfig = experimentConfig?.graph || { x: 'Qth', y: 'Cd', x_label: 'X', y_label: 'Y', title: 'Calibration Plot' };

  // Prepare chart data for export
  const chartData = calculatedRows
    .map((r, idx) => {
      const xVal = r[graphConfig.x];
      const yVal = r[graphConfig.y];
      if (xVal !== null && yVal !== null && !isNaN(xVal) && !isNaN(yVal) && isFinite(xVal) && isFinite(yVal)) {
        return { trial: idx + 1, x: xVal, y: yVal };
      }
      return null;
    })
    .filter(Boolean);

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

  // Option 1: Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // Option 2: Direct PDF File Download using jsPDF + html2canvas
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const element = reportRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${experimentConfig.experiment_id}_Lab_Report.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl report-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl glass-panel border border-cyan-500/40 p-6 shadow-2xl bg-slate-950 text-slate-100 space-y-6 report-modal-content"
      >
        {/* Top Control Bar (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-100">
                Official Experiment Report Export
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Exact Manual Format: AIM → APPARATUS → THEORY → EXPERIMENTAL PROCEDURE → OBSERVATION TABLE → GRAPH → RESULT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 disabled:opacity-50 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download PDF File</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 text-xs font-mono transition-all cursor-pointer"
              title="Open System Print Dialog"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print</span>
            </button>

            <button
              onClick={() => setReportModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet matching Lab Manual Screenshot Layout */}
        <div
          ref={reportRef}
          className="p-10 rounded-xl bg-white text-black font-sans space-y-6 printable-report-sheet shadow-xl"
        >
          {/* Main Experiment Header Title */}
          <div className="text-center pb-2 printable-section">
            <h1 className="text-xl font-bold font-heading uppercase tracking-wide text-black border-b-2 border-black pb-2">
              {experimentConfig?.title?.toUpperCase()}
            </h1>
          </div>

          {/* AIM: */}
          <div className="space-y-1 printable-section">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black font-mono underline">
              AIM:
            </h3>
            <p className="text-xs text-gray-900 leading-relaxed font-sans mt-1">
              {experimentConfig.aim}
            </p>
          </div>

          {/* APPARATUS: */}
          <div className="space-y-1 printable-section">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black font-mono underline">
              APPARATUS:
            </h3>
            <p className="text-xs text-gray-900 leading-relaxed font-sans mt-1">
              {(experimentConfig.apparatus || []).join(', ')}.
            </p>
          </div>

          {/* THEORY: */}
          <div className="space-y-3 printable-section">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black font-mono underline">
              THEORY:
            </h3>
            <p className="text-xs text-gray-900 leading-relaxed font-sans whitespace-pre-wrap">
              {experimentConfig.theory}
            </p>

            {/* Formula Cards */}
            <div className="space-y-2 pt-1">
              {(experimentConfig.formulas || []).map((formula) => (
                <div key={formula.id} className="p-3 rounded bg-gray-50 border border-gray-300 text-xs font-mono text-center">
                  <span className="font-bold text-black block mb-1">{formula.label}</span>
                  <KaTeXRenderer math={formula.latex} block={true} />
                </div>
              ))}
            </div>
          </div>

          {/* EXPERIMENTAL PROCEDURE: */}
          <div className="space-y-1 printable-section">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black font-mono underline">
              EXPERIMENTAL PROCEDURE:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-gray-900 font-sans mt-1">
              {(experimentConfig.procedure || []).map((step, idx) => (
                <li key={idx} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>

          {/* OBSERVATION TABLE: */}
          <div className="space-y-2 printable-section">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black font-mono underline">
              OBSERVATION TABLE:
            </h3>

            <div className="overflow-x-auto border border-black rounded">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-black border-b border-black">
                    <th className="p-2 border-r border-black text-center w-12">S.NO</th>
                    {trialInputs.map(inp => (
                      <th key={inp.id} className="p-2 border-r border-black">
                        {inp.label} ({inp.unit || '-'})
                      </th>
                    ))}
                    {calcColumns.map(col => (
                      <th key={col.id} className="p-2 border-r border-black bg-gray-200 font-bold">
                        {col.label} {col.unit && col.unit !== '-' ? `(${col.unit})` : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {calculatedRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="p-2 font-bold text-center border-r border-black">{rIdx + 1}</td>
                      {trialInputs.map(inp => (
                        <td key={inp.id} className="p-2 border-r border-black">{row[inp.id] || '—'}</td>
                      ))}
                      {calcColumns.map(col => (
                        <td key={col.id} className="p-2 border-r border-black font-bold text-black">
                          {formatValue(row[col.id], col.format)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRAPH: */}
          <div className="space-y-2 printable-section">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black font-mono underline">
              GRAPH:
            </h3>
            <p className="text-xs text-gray-900 font-sans italic">
              Draw a graph between {graphConfig.y_label} on Y-axis and {graphConfig.x_label} on X-axis.
            </p>

            {/* Plotted Visual Graph Container */}
            <div className="h-[280px] w-full rounded border border-black bg-white p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-gray-700 font-bold border-b border-gray-300 pb-1">
                <span>Y-Axis: {graphConfig.y_label}</span>
                <span>X-Axis: {graphConfig.x_label}</span>
              </div>
              <ResponsiveContainer width="100%" height="88%">
                <ComposedChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    tick={{ fill: '#0f172a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    stroke="#000000"
                    label={{
                      value: graphConfig.x_label,
                      position: 'insideBottom',
                      offset: -12,
                      fill: '#000000',
                      fontSize: 10,
                      fontFamily: 'Space Grotesk'
                    }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    tick={{ fill: '#0f172a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    stroke="#000000"
                    label={{
                      value: graphConfig.y_label,
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#000000',
                      fontSize: 10,
                      fontFamily: 'Space Grotesk'
                    }}
                  />
                  <Scatter name="Data Points" data={chartData} fill="#0284c7" stroke="#0284c7" />
                  {lineData.length >= 2 && (
                    <Line data={lineData} type="monotone" dataKey="trend" stroke="#7c3aed" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RESULT: */}
          <div className="space-y-1 printable-section pt-2 border-t border-gray-300">
            <h3 className="font-bold text-sm uppercase tracking-wider text-black font-mono underline">
              RESULT:
            </h3>
            <p className="text-xs font-semibold text-gray-900 font-sans mt-1">
              {experimentConfig.experiment_id === 'rotameter_calibration' ? (
                'The given rotameter is calibrated.'
              ) : experimentConfig.experiment_id === 'venturi_meter' ? (
                `The coefficient of discharge for venturi meter or venturi coefficient is ${headlineResult.mean !== null ? headlineResult.mean.toFixed(3) : '----------'}.`
              ) : (
                `Coefficient of Discharge for orifice meter is found to be , Cd = ${headlineResult.mean !== null ? headlineResult.mean.toFixed(3) : '----------'}.`
              )}
            </p>
          </div>

          {/* Running Footer with Watermark Credit */}
          <div className="pt-6 border-t border-gray-300 flex items-center justify-between text-[11px] font-mono text-gray-600 print:flex">
            <span>Chemical Engineering | CH23331</span>
            <span className="font-bold text-black flex items-center gap-1">
              <span>Created by PRAVEEN R</span>
            </span>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
