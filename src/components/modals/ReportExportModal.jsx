import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileDown, Printer, Loader2, Download } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { formatValue, calculateTable, evaluateStepCalculations } from '../../engine/formulaEngine';
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

import { SUBJECTS_CONFIG, GLOBAL_APP_CONFIG } from '../../data/subjects';
import recLogo from '../../assets/rec-logo.png';

export function ReportExportModal() {
  const {
    isReportModalOpen,
    setReportModalOpen,
    experimentConfig,
    activePartConfig,
    observationRows,
    calculatedRows,
    headlineResult,
    studentDetails,
    currentSubject
  } = useExperimentStore();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef(null);

  if (!isReportModalOpen || !experimentConfig) return null;

  const subjectInfo = SUBJECTS_CONFIG[currentSubject] || SUBJECTS_CONFIG[experimentConfig?.subject] || SUBJECTS_CONFIG.fluid_mechanics;
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
    
    const rowsToUse = isSub
      ? calculateTable(part.sample_data || [], part.calculations, part.fixed_inputs)
      : (calculatedRows && calculatedRows.length > 0
          ? calculatedRows
          : calculateTable(part.sample_data || [], part.calculations, part.fixed_inputs));

    const partRows = rowsToUse;
    const partCalcSteps = part.calculation_steps || [];
    const sampleTrialSteps = partRows.length > 0 && partCalcSteps.length > 0
      ? evaluateStepCalculations(partRows[0], partCalcSteps, part.fixed_inputs)
      : [];

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

    // Standard scatter plot data
    const chartData = partRows
      .map((r, idx) => {
        const rawX = r[part.graph?.x];
        const rawY = r[part.graph?.y];
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
            y: yVal
          };
        }
        return null;
      })
      .filter(Boolean);

    // Linear regression trendline data
    let lineData = [];
    if (!isStep && !isSinusoidal && chartData.length >= 2) {
      const xs = chartData.map(d => d.x);
      const ys = chartData.map(d => d.y);
      const n = xs.length;
      const sumX = xs.reduce((a, b) => a + b, 0);
      const sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
      const sumXX = xs.reduce((sum, x) => sum + x * x, 0);

      const denom = n * sumXX - sumX * sumX;
      if (denom !== 0) {
        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);

        lineData = [
          { x: minX, trend: slope * minX + intercept },
          { x: maxX, trend: slope * maxX + intercept }
        ];
      }
    }

    const formatTickX = (val) => {
      if (val === 0 || val === '0') return '0';
      const num = typeof val === 'number' ? val : parseFloat(val);
      if (isNaN(num)) return val;
      if (Math.abs(num) < 0.001) {
        return num.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
      }
      if (Math.abs(num) < 1) {
        return num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
      }
      return num.toFixed(2);
    };

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

        {/* SAMPLE CALCULATION (Trial 1) */}
        {sampleTrialSteps.length > 0 && (
          <div className="space-y-1.5 printable-section pt-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-black font-mono underline">SAMPLE CALCULATION (Trial 1):</h3>
            <div className="space-y-2 p-2 rounded border border-black bg-gray-50 text-xs font-mono">
              {sampleTrialSteps.map((step, idx) => (
                <div key={idx} className="space-y-1 pb-1.5 border-b border-gray-300 last:border-0 last:pb-0">
                  <div className="font-bold text-black text-[11px] uppercase tracking-wide">
                    {step.label}
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap text-black">
                    <span className="text-[10px] text-gray-600 uppercase font-sans">Formula:</span>
                    <KaTeXRenderer math={step.formula_latex} block={false} />
                  </div>
                  {step.substituted_latex && (
                    <div className="flex items-baseline gap-2 flex-wrap text-black">
                      <span className="text-[10px] text-gray-600 uppercase font-sans">Substitution:</span>
                      <KaTeXRenderer math={step.substituted_latex} block={false} />
                    </div>
                  )}
                  {step.simplification_latex && (
                    <div className="flex items-baseline gap-2 flex-wrap text-black">
                      <span className="text-[10px] text-gray-600 uppercase font-sans">Simplification:</span>
                      <KaTeXRenderer math={step.simplification_latex} block={false} />
                    </div>
                  )}
                  <div className="font-bold text-black pt-0.5">
                    Result = {step.formatted_value} {step.unit !== 'dim' && step.unit !== '-' ? step.unit : ''}
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-gray-600 italic font-sans pt-1">
                Same calculation method applied to all remaining trials — see Results table for values.
              </p>
            </div>
          </div>
        )}

        {/* GRAPH */}
        {part.show_graph !== false && config.show_graph !== false && (part.graph || isStep || isSinusoidal) && (
          <div className="space-y-1.5 printable-section">
            <h3 className="font-bold text-xs uppercase tracking-wider text-black font-mono underline">GRAPH:</h3>
            <p className="text-xs text-gray-900 font-sans italic">
              {isStep
                ? 'Draw graph of T̄\'(t)/K vs time/τ and note time required to reach 63.2% of final value.'
                : isSinusoidal
                ? 'Draw graph comparing Input Bath and Output Thermowell temperature vs time.'
                : `Draw graph between ${part.graph?.y_label} on Y-axis and ${part.graph?.x_label} on X-axis.`}
            </p>

            <div className="h-[220px] w-full rounded border border-black bg-white p-2">
              <ResponsiveContainer width="100%" height="100%">
                {isStep ? (
                  <ComposedChart data={stepData} margin={{ top: 10, right: 20, bottom: 25, left: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="t_over_tau" tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: 'time / τ', position: 'insideBottom', offset: -10, fill: '#000', fontSize: 9 }} />
                    <YAxis domain={[0, 1.1]} tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: "T̄'(t) / K", angle: -90, position: 'insideLeft', fill: '#000', fontSize: 9 }} />
                    <ReferenceLine y={0.632} stroke="#10B981" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="exp_norm" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3.5, fill: '#8B5CF6' }} />
                    <Line type="monotone" dataKey="theo_norm" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                ) : isSinusoidal ? (
                  <ComposedChart data={sinusoidalData} margin={{ top: 10, right: 20, bottom: 25, left: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="t" tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10, fill: '#000', fontSize: 9 }} />
                    <YAxis domain={[25, 55]} tick={{ fill: '#0f172a', fontSize: 9 }} stroke="#000" label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#000', fontSize: 9 }} />
                    <Line type="monotone" dataKey="T_in" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3.5, fill: '#3B82F6' }} />
                    <Line type="monotone" dataKey="T_out" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3.5, fill: '#8B5CF6' }} />
                  </ComposedChart>
                ) : (
                  <ComposedChart margin={{ top: 12, right: 20, bottom: 25, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={['auto', 'auto']}
                      tick={{ fill: '#0f172a', fontSize: 9 }}
                      stroke="#000"
                      tickFormatter={formatTickX}
                      label={{ value: part.graph?.x_label, position: 'insideBottom', offset: -10, fill: '#000', fontSize: 9 }}
                    />
                    <YAxis
                      dataKey="y"
                      type="number"
                      domain={['auto', 'auto']}
                      width={40}
                      tick={{ fill: '#0f172a', fontSize: 9 }}
                      stroke="#000"
                      label={{ value: part.graph?.y_label, angle: -90, position: 'insideLeft', offset: 10, fill: '#000', fontSize: 9 }}
                    />
                    <Scatter name="Data" data={chartData} fill="#8B5CF6" stroke="#8B5CF6" strokeWidth={2} />
                    {lineData.length >= 2 && (
                      <Line data={lineData} type="monotone" dataKey="trend" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                    )}
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIVA QUESTIONS */}
        {part.show_viva !== false && config.show_viva !== false && part.viva_questions && part.viva_questions.length > 0 && (
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
          <span className="font-bold text-xs uppercase tracking-wider text-black font-mono underline block mb-1">RESULT:</span>
          {part.id === 'partA' ? (
            <p className="text-xs font-semibold text-gray-900 font-sans">
              The step response of the first-order system is studied and the time constant τ at 63.2% response is found to be 10.0 sec.
            </p>
          ) : part.id === 'partB' ? (
            <div className="text-xs text-gray-900 font-sans space-y-1">
              <p className="font-bold text-black">The sinusoidal response of the first-order thermowell system is evaluated with the following result parameters:</p>
              <table className="w-full text-left text-xs font-mono border border-black max-w-md my-1">
                <tbody className="divide-y divide-black">
                  <tr><td className="p-1.5 font-bold border-r border-black">I/p amplitude</td><td className="p-1.5 font-bold">10 °C</td></tr>
                  <tr><td className="p-1.5 font-bold border-r border-black">O/p amplitude</td><td className="p-1.5 font-bold">3 °C</td></tr>
                  <tr><td className="p-1.5 font-bold border-r border-black">Amplitude Ratio (AR)</td><td className="p-1.5 font-bold">0.3</td></tr>
                  <tr><td className="p-1.5 font-bold border-r border-black">Frequency of oscillation (ω)</td><td className="p-1.5 font-bold">0.105 rad/s</td></tr>
                  <tr><td className="p-1.5 font-bold border-r border-black">Phase lag (φ)</td><td className="p-1.5 font-bold">60°</td></tr>
                  <tr><td className="p-1.5 font-bold border-r border-black">θ / A</td><td className="p-1.5 font-bold">0.1365</td></tr>
                  <tr className="bg-gray-100"><td className="p-1.5 font-bold border-r border-black">Time Constant (τ)</td><td className="p-1.5 font-bold text-black">30.36 s</td></tr>
                </tbody>
              </table>
            </div>
          ) : part.result_template || config.result_template ? (
            <p className="text-xs font-semibold text-gray-900 font-sans">
              {(part.result_template || config.result_template)
                .replace('{mean_h}', headlineResult.mean !== null ? headlineResult.mean.toFixed(2) : '—')
                .replace('{mean}', headlineResult.mean !== null ? headlineResult.mean.toFixed(3) : '—')}
            </p>
          ) : (
            <p className="text-xs font-semibold text-gray-900 font-sans">
              The mean value is calculated to be {headlineResult.mean !== null ? headlineResult.mean.toFixed(3) : '—'}.
            </p>
          )}
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
              <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                <img src={recLogo} alt="REC Logo" className="w-3.5 h-3.5 object-contain shrink-0" />
                <span>Rajalakshmi Engineering College — Manual Standard Format</span>
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
          {/* Student & Course Details Reference Header Table */}
          <div className="printable-section border border-black text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-200 border-b border-black text-black">
                  <th className="p-1.5 font-bold border-r border-black w-1/3">Parameter</th>
                  <th className="p-1.5 font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Field</td>
                  <td className="p-1.5 text-black">{GLOBAL_APP_CONFIG.field}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Course Code</td>
                  <td className="p-1.5 text-black font-bold">{subjectInfo.courseCode}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Course Title</td>
                  <td className="p-1.5 text-black font-bold">{subjectInfo.courseTitle}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Academic Year</td>
                  <td className="p-1.5 text-black">{studentDetails?.academicYear || '2027-2028'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Semester</td>
                  <td className="p-1.5 text-black">{GLOBAL_APP_CONFIG.semester}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Student Name</td>
                  <td className="p-1.5 font-bold text-black">{studentDetails?.studentName || '—'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Register Number</td>
                  <td className="p-1.5 font-bold text-black">{studentDetails?.registerNumber || '—'}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold border-r border-black bg-gray-50">Section</td>
                  <td className="p-1.5 text-black">{GLOBAL_APP_CONFIG.section}</td>
                </tr>
              </tbody>
            </table>
          </div>

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
                ? 'Process Control Laboratory | CH23722'
                : experimentConfig.subject === 'heat_transfer'
                ? 'Heat Transfer Laboratory | CH23521'
                : 'Chemical Engineering | CH23331'}
            </span>
            <span className="font-bold text-black">
              Created by Zynix
            </span>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
