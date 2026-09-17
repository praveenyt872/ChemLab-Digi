import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  UserCheck,
  FileText,
  Sparkles,
  Loader2
} from 'lucide-react';
import { FLUID_MECHANICS_FACULTY } from '../../data/faculty';
import recLogo from '../../assets/rec-logo.png';

export function FacultyEmailModal({
  isOpen,
  onClose,
  experimentConfig,
  experimentNumber,
  experimentDate,
  studentDetails,
  onDownloadPdf,
  headlineResult
}) {
  const [selectedFacultyId, setSelectedFacultyId] = useState(FLUID_MECHANICS_FACULTY[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedFaculty = FLUID_MECHANICS_FACULTY.find(f => f.id === selectedFacultyId) || FLUID_MECHANICS_FACULTY[0];

  const expNum = experimentNumber || '1';
  const expTitle = experimentConfig?.title || 'Fluid Mechanics Experiment';
  const emailSubject = `Fluid Mechanics Lab Report - Experiment ${expNum}: ${expTitle}`;

  // Formulate high-precision academic result summary line
  let resultSummary = '';
  if (headlineResult && typeof headlineResult === 'object') {
    resultSummary = `• Primary Metric: ${headlineResult.label || 'Result'} = ${headlineResult.value || '—'} ${headlineResult.unit || ''}`;
  } else if (headlineResult) {
    resultSummary = `• Primary Metric: ${String(headlineResult)}`;
  } else {
    resultSummary = `• Primary Metric: Completed according to REC Fluid Mechanics laboratory manual standard.`;
  }

  const pdfFileName = `Fluid_Mechanics_Exp_${expNum}_${(studentDetails?.registerNumber || 'Report')}.pdf`;

  const emailBody = `Respected ${selectedFaculty.salutation} ${selectedFaculty.name},

Please find attached my official laboratory record report for the Fluid Mechanics Laboratory course.

==================================================
STUDENT & INSTITUTIONAL IDENTIFICATION
==================================================
• Student Name       : ${studentDetails?.studentName || '—'}
• Register Number    : ${studentDetails?.registerNumber || '—'}
• Official Email     : ${studentDetails?.email || '—'}
• Department         : Department of Chemical Engineering
• College            : Rajalakshmi Engineering College, Chennai
• Academic Year      : ${studentDetails?.academicYear || '2027-2028'}
• Semester & Section : Semester ${studentDetails?.semester || 'VII'}, Section ${studentDetails?.section || 'B'}

==================================================
EXPERIMENT DETAILS
==================================================
• Course Title       : Fluid Mechanics Lab
• Course Code        : CH23331
• Experiment Number  : ${expNum}
• Experiment Name    : ${expTitle}
• Date of Experiment : ${experimentDate || '—'}
• Submission Date    : ${new Date().toLocaleDateString('en-GB')}

==================================================
KEY EXPERIMENTAL RESULT SUMMARY
==================================================
${resultSummary}

==================================================
ATTACHMENT INSTRUCTIONS
==================================================
• Attached Document  : ${pdfFileName}
  (Official laboratory report PDF generated with complete observations, formulas, step-by-step calculations, and calibration curves).

Thank you for your valuable guidance and review.

Respectfully submitted,
${studentDetails?.studentName || 'Student'}
Register Number: ${studentDetails?.registerNumber || '—'}
Department of Chemical Engineering
Rajalakshmi Engineering College
`;

  const handleSendToGmail = async () => {
    try {
      setIsProcessing(true);

      // 1. Temporarily hide modal so html2canvas captures ONLY the pure report sheet
      const portalEl = document.getElementById('faculty-email-modal-portal');
      if (portalEl) portalEl.style.visibility = 'hidden';

      // 2. Trigger the clean report PDF download with exact matching filename
      if (typeof onDownloadPdf === 'function') {
        await onDownloadPdf(pdfFileName);
      }

      // Restore visibility
      if (portalEl) portalEl.style.visibility = 'visible';

      // Small pause to allow browser download to start
      await new Promise(r => setTimeout(r, 400));

      // 3. Construct Gmail Web compose URL with pre-filled parameters
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedFaculty.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      // 4. Open Gmail compose window in a new tab
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');

      setSendSuccess(true);
    } catch (err) {
      console.error('Error initiating email submission:', err);
    } finally {
      const portalEl = document.getElementById('faculty-email-modal-portal');
      if (portalEl) portalEl.style.visibility = 'visible';
      setIsProcessing(false);
    }
  };

  const handleDownloadOnly = async () => {
    try {
      setIsProcessing(true);
      const portalEl = document.getElementById('faculty-email-modal-portal');
      if (portalEl) portalEl.style.visibility = 'hidden';
      if (typeof onDownloadPdf === 'function') {
        await onDownloadPdf(pdfFileName);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      const portalEl = document.getElementById('faculty-email-modal-portal');
      if (portalEl) portalEl.style.visibility = 'visible';
      setIsProcessing(false);
    }
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoFallback = `mailto:${selectedFaculty.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return createPortal(
    <AnimatePresence>
      <div
        id="faculty-email-modal-portal"
        data-html2canvas-ignore="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-violet-500/30 p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6 relative max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/40 p-1.5 flex items-center justify-center text-violet-400 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                  <span>Send Report to Respected Faculty</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <img src={recLogo} alt="REC Logo" className="w-3.5 h-3.5 object-contain shrink-0" />
                  <span>Fluid Mechanics Laboratory (CH23331) — Chemical Engineering</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!sendSuccess ? (
            <div className="space-y-6">
              
              {/* Faculty Selector Radio Cards */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-violet-400 font-bold block">
                  1. Select Respected Faculty In-Charge:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FLUID_MECHANICS_FACULTY.map((fac) => {
                    const isSelected = fac.id === selectedFacultyId;
                    return (
                      <div
                        key={fac.id}
                        onClick={() => setSelectedFacultyId(fac.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-violet-950/40 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.25)] ring-1 ring-violet-400'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center font-mono shrink-0 shadow-sm">
                              {fac.avatar}
                            </div>
                            <div>
                              <h4 className="font-heading font-bold text-sm text-slate-100">
                                {fac.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 font-sans">
                                {fac.designation}
                              </p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 ${isSelected ? 'border-violet-400 bg-violet-500' : 'border-slate-600'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-mono text-violet-300 block break-all font-semibold">
                            {fac.email}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pre-submission Summary Preview */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-violet-400 font-bold block">
                  2. Submission Details & Email Metadata:
                </label>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">To Faculty:</span>
                    <span className="font-bold text-violet-300">{selectedFaculty.name} ({selectedFaculty.email})</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Subject:</span>
                    <span className="font-semibold text-slate-200">{emailSubject}</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Student:</span>
                    <span className="font-semibold text-slate-200">{studentDetails?.studentName || '—'} (Reg: {studentDetails?.registerNumber || '—'})</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Student Email:</span>
                    <span className="font-semibold text-slate-200">{studentDetails?.email || '—'}</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Experiment No. & Date:</span>
                    <span className="font-semibold text-slate-200">Exp {expNum} | {experimentDate || '—'}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-slate-400">Report Document:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{pdfFileName}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/30 text-xs text-violet-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-violet-300">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>How Sending Report Works:</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  When you click the button below, the official formatted <strong>Lab Report PDF</strong> will automatically download to your device, and a new Gmail tab will open with the faculty email, subject, and student details pre-filled. Simply click the paperclip icon in Gmail to attach the downloaded PDF, then click Send!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-mono transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDownloadOnly}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Download clean lab report PDF file to your device"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : (
                    <Download className="w-4 h-4 text-cyan-400" />
                  )}
                  <span>Download PDF Only</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendToGmail}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PDF & Opening Gmail...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Download PDF & Open in Gmail</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* Post-Send Success & Guidance View */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-heading text-xl font-bold text-white">
                  Report PDF Downloaded & Gmail Window Opened!
                </h4>
                <p className="text-xs text-slate-400 font-sans max-w-md mx-auto leading-relaxed">
                  Your clean experimental report PDF has been downloaded to your device as <span className="font-mono text-emerald-300 font-semibold">{pdfFileName}</span>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs font-sans space-y-2.5 max-w-lg mx-auto">
                <div className="font-bold text-slate-200 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>How to attach in your opened Gmail tab:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs leading-relaxed">
                  <li>In the Gmail compose tab that just opened, click the <strong>Attach files</strong> (📎 paperclip) icon.</li>
                  <li>Select the downloaded report file: <span className="font-mono text-violet-300">{pdfFileName}</span> from your Downloads folder.</li>
                  <li>All student metadata and experiment metrics are already pre-filled. Click <strong>Send</strong> to submit to {selectedFaculty.name}!</li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadOnly}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
                  title="Download clean PDF again"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download PDF Again</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBody}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Body'}</span>
                </button>

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedFaculty.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Re-open Gmail Compose</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs font-mono transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
