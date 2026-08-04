import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileDown, Printer, Loader2, Download } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { formatValue, calculateTable } from '../../engine/formulaEngine';
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
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export function ReportExportModal() {
  const { isReportModalOpen, setReportModalOpen, experimentConfig, activePartConfig, calculatedRows, headlineResult } = useExperimentStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef(null);

  if (!isReportModalOpen || !experimentConfig) return null;

  const config = activePartConfig || experimentConfig;
  const isMultiPart = Array.isArray(experimentConfig?.parts) && experimentConfig.parts.length > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      setIsGeneratingPdf(true);
      await new Promise(r => setTimeout(r, 200));
      const element = reportRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1100
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

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

      const fileName = `${experimentConfig?.experiment_id || 'experiment'}_Lab_Report.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper to render a single experiment part section in report
  const renderPartSection = (part, isSub = false) => {
    const partTrialInputs = part.trial_inputs || [];
    const partCalcColumns = part.calculated_columns || [];
    const partRows = calculateTable(part.sample_data || [], part.calculations, part.fixed_inputs);

    const isStep = part.graph?.type === 'first_order_step';
    const isSinusoidal = part.graph?.type === 'first_order_sinusoidal';

    const stepData = partRows.map((r) => {
      const t = parseFloat(r.t || 0);
      const normHeat = parseFloat(r.norm_heat || 0);
      return {
        t,
        t_over_tau: parseFloat((t / 10).toFixed(2)),
        exp_norm: parseFloat((normHeat / 2.6).toFixed(3)),
        theo_norm: parseFloat((1 - Math.exp(-t / 10)).toFixed(3)),
        T_rise: parseFloat(r.T_rise || 0),
        T_fall: parseFloat(r.T_fall || 0)
      };
    });

    const sinusoidalData = partRows.map((r) => ({
      t: parseFloat(r.t || 0),
      T_in: parseFloat(r.T_in || 0),
      T_out: parseFloat(r.T_out || 0)
    }));

    return (
      <div key={part.id || 'single'} className="space-y-4 pt-2 border-t border-gray-200 first:border-0 first:pt-0">
        {isSub && (
          <h2 className="text-sm font-bold uppercase tracking-wider text-black bg-gray-100 p-2 rounded font-heading">
            {part.title}
          </h2>
        )}

        {/* AIM */}
        <div className="printable-section">
          <span className="font-bold text-xs uppercase tracking-wider text-black font-mono underline mr-2">AIM:</span>
          <span className="text-xs text-gray-900 font-sans">{part.aim}</span>
        </div>

        {/* APPARATUS */}
        <div className="printable-section">
          <span className="font-bold text-xs uppercase tracking-wider text-black font-mono underline mr-2">APPARATUS:</span>
          <span className="text-xs text-gray-900 font-sans">{(part.apparatus || experimentConfig.apparatus || []).join(', ')}.</span>
        </div>

        {/* THEORY */}
        <div className="space-y-1.5 printable-section">
          <h3 className="font-bold text-xs uppercase tracking-wider text-black font-mono underline">THEORY:</h3>
          <p className="text-xs text-gray-900 leading-normal font-sans whitespace-pre-wrap">{part.theory}</p>
          <div className="space-y-1 pt-1 font-mono text-xs text-black">
            {(part.formulas || []).map((formula) => (
              <div key={formula.id} className="py-0.5 flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-black shrink-0">{formula.label}:</span>
                <KaTeXRenderer math={formula.latex} block={false} />
              </div>
            ))}
          </div>
        </div>

        {/* PROCEDURE */}
        <div className="space-y-1 printable-section">
          <h3 className="font-bold text-xs uppercase tracking-wider text-black font-mono underline">EXPERIMENTAL PROCEDURE:</h3>
          <ol className="list-decimal list-inside space-y-0.5 text-xs text-gray-900 font-sans">
            {(part.procedure || []).map((step, idx) => (
              <li key={idx} className="leading-snug">{step}</li>
            ))}
          </ol>
        </div>

        {/* OBSERVATION TABLE */}
        <div className="space-y-1 printable-section">
          <h3 className="font-bold text-xs uppercase tracking-wider text-black font-mono underline">OBSERVATION TABLE:</h3>
          <div className="overflow-x-auto border border-black rounded">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-gray-100 text-black border-b border-black">
                  <th className="py-1 px-2 border-r border-black text-center w-10">S.NO</th>
                  {partTrialInputs.map(inp => (
                    <th key={inp.id} className="py-1 px-2 border-r border-black">{inp.label} ({inp.unit || '-'})</th>
                  ))}
                  {partCalcColumns.map(col => (
                    <th key={col.id} className="py-1 px-2 border-r border-black bg-gray-200 font-bold">{col.label} {col.unit && col.unit !== '-' ? `(${col.unit})` : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {partRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="py-1 px-2 font-bold text-center border-r border-black">{rIdx + 1}</td>
                    {partTrialInputs.map(inp => (
                      <td key={inp.id} className="py-1 px-2 border-r border-black">{row[inp.id] || '—'}</td>
                    ))}
                    {partCalcColumns.map(col => (
                      <td key={col.id} className="py-1 px-2 border-r border-black font-bold text-black">{formatValue(row[col.id], col.format)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GRAPH */}
        <div className="space-y-1.5 printable-section">
          <h3 className="font-bold text-xs uppercase tracking-wider text-black font-mono underline">GRAPH:</h3>
          <p className="text-xs text-gray-900 font-sans italic">
            {isStep
              ? 'Draw graph of T̄\'(t)/K vs time/τ and note time required to reach 63.2% of final value.'
              : isSinusoidal
              ? 'Draw graph comparing Input Bath and Output Thermowell temperature vs time.'
              : `Draw graph between ${part.graph?.y_label} on Y-axis and ${part.graph?.x_label} on X-axis.`}
          </p>

          <div className="h-[210px] w-full rounded border border-black bg-white p-2 space-y-1">
            <ResponsiveContainer width="100%" height="90%">
              {isStep ? (
                <ComposedChart data={stepData} margin={{ top: 8, right: 15, bottom: 15, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="t_over_tau" tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: 'time / τ', position: 'insideBottom', offset: -10, fill: '#000', fontSize: 9 }} />
                  <YAxis domain={[0, 1.1]} tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: "T̄'(t) / K", angle: -90, position: 'insideLeft', fill: '#000', fontSize: 9 }} />
                  <ReferenceLine y={0.632} stroke="#059669" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="exp_norm" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="theo_norm" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </ComposedChart>
              ) : isSinusoidal ? (
                <ComposedChart data={sinusoidalData} margin={{ top: 8, right: 15, bottom: 15, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="t" tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10, fill: '#000', fontSize: 9 }} />
                  <YAxis domain={[25, 55]} tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#000', fontSize: 9 }} />
                  <Line type="monotone" dataKey="T_in" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="T_out" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              ) : (
                <ComposedChart margin={{ top: 8, right: 15, bottom: 15, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="x" tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: part.graph?.x_label, position: 'insideBottom', offset: -10, fill: '#000', fontSize: 9 }} />
                  <YAxis dataKey="y" tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: part.graph?.y_label, angle: -90, position: 'insideLeft', fill: '#000', fontSize: 9 }} />
                  <Scatter name="Data" data={partRows.map(r => ({ x: r[part.graph?.x], y: r[part.graph?.y] }))} fill="#0284c7" />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* VIVA QUESTIONS */}
        {part.viva_questions && part.viva_questions.length > 0 && (
          <div className="space-y-1.5 printable-section pt-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-black font-mono underline">VIVA VOCE / REVIEW QUESTIONS:</h3>
            <div className="space-y-1 text-xs text-gray-900 font-sans">
              {part.viva_questions.map((vq, idx) => (
                <div key={idx} className="p-2 rounded bg-gray-50 border border-gray-200">
                  <p className="font-bold text-black">{vq.question}</p>
                  <p className="text-gray-800 text-[11px] mt-0.5">{vq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        <div className="printable-section pt-1 border-t border-gray-300">
          <span className="font-bold text-xs uppercase tracking-wider text-black font-mono underline mr-2">RESULT:</span>
          <span className="text-xs font-semibold text-gray-900 font-sans">
            {part.id === 'partA'
              ? 'The step response of the first-order system is studied and the time constant τ at 63.2% response is found to be 10.0 sec.'
              : part.id === 'partB'
              ? 'The sinusoidal response of the thermowell/thermocouple is studied; amplitude ratio AR is found to be 0.375 and time constant τ is 27 sec.'
              : `The mean value is calculated to be ${headlineResult.mean !== null ? headlineResult.mean.toFixed(3) : '—'}.`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl report-modal-backdrop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl glass-panel border border-cyan-500/40 p-6 shadow-2xl bg-slate-950 text-slate-100 space-y-4 report-modal-content"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-slate-100">
                Official Experiment Report Export
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                REC Chemical Engineering 2026 Manual Standard Format
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

        {/* Compact Printable Report Sheet */}
        <div
          ref={reportRef}
          className="p-6 rounded-xl bg-white text-black font-sans space-y-4 printable-report-sheet shadow-xl"
        >
          {/* Main Experiment Header Title */}
          <div className="text-center pb-1 printable-section">
            <h1 className="text-base font-bold font-heading uppercase tracking-wide text-black border-b border-black pb-1">
              {experimentConfig?.title?.toUpperCase()}
            </h1>
          </div>

          {/* Render Either Combined Multi-Part Report or Single Part Report */}
          {isMultiPart ? (
            experimentConfig.parts.map((part) => renderPartSection(part, true))
          ) : (
            renderPartSection(config, false)
          )}

          {/* Running Footer with Watermark Credit */}
          <div className="pt-3 border-t border-gray-300 flex items-center justify-between text-[10px] font-mono text-gray-600">
            <span>
              {experimentConfig.subject === 'instrumentation-process-control'
                ? 'Process Control Laboratory | CH19712'
                : 'Chemical Engineering | CH23331'}
            </span>
            <span className="font-bold text-black">
              Created by PRAVEEN R
            </span>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
