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
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedFaculty = FLUID_MECHANICS_FACULTY.find(f => f.id === selectedFacultyId) || FLUID_MECHANICS_FACULTY[0];

  const expNum = experimentNumber || '1';
  const expTitle = experimentConfig?.title || 'Fluid Mechanics Experiment';
  const emailSubject = `Fluid Mechanics Lab Report - Experiment ${expNum}: ${expTitle}`;

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

      // 1. Completely hide modal so html2canvas captures ONLY the pure report sheet
      const portalEl = document.getElementById('faculty-email-modal-portal');
      if (portalEl) portalEl.style.display = 'none';

      // 2. Trigger clean report PDF download with exact matching filename
      if (typeof onDownloadPdf === 'function') {
        await onDownloadPdf(pdfFileName);
        setDownloadSuccess(true);
      }

      // Restore display
      if (portalEl) portalEl.style.display = 'flex';

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
      if (portalEl) portalEl.style.display = 'flex';
      setIsProcessing(false);
    }
  };

  const handleDownloadOnly = async () => {
    try {
      setIsProcessing(true);
      const portalEl = document.getElementById('faculty-email-modal-portal');
      if (portalEl) portalEl.style.display = 'none';
      if (typeof onDownloadPdf === 'function') {
        await onDownloadPdf(pdfFileName);
        setDownloadSuccess(true);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      const portalEl = document.getElementById('faculty-email-modal-portal');
      if (portalEl) portalEl.style.display = 'flex';
      setIsProcessing(false);
    }
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return createPortal(
    <AnimatePresence>
      <div
        id="faculty-email-modal-portal"
        data-html2canvas-ignore="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl rounded-2xl bg-white border border-[#EDEEF1] p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6 relative max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-100 border border-violet-200 p-1.5 flex items-center justify-center text-violet-700 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Send Report to Respected Faculty</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                  <img src={recLogo} alt="REC Logo" className="w-3.5 h-3.5 object-contain shrink-0" />
                  <span>Fluid Mechanics Laboratory (CH23331) — Chemical Engineering</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!sendSuccess ? (
            <div className="space-y-6">
              
              {/* Faculty Selector Radio Cards */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-violet-700 font-bold block">
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
                            ? 'bg-violet-50/90 border-violet-500 shadow-sm ring-2 ring-violet-500/20'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center font-mono shrink-0 shadow-sm">
                              {fac.avatar}
                            </div>
                            <div>
                              <h4 className="font-heading font-bold text-sm text-slate-900">
                                {fac.name}
                              </h4>
                              <p className="text-[11px] text-slate-600 font-sans">
                                {fac.designation}
                              </p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 ${isSelected ? 'border-violet-600 bg-violet-600' : 'border-slate-400'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[11px] font-mono text-violet-700 block break-all font-semibold">
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
                <label className="text-xs font-mono uppercase tracking-wider text-violet-700 font-bold block">
                  2. Submission Details & Email Metadata:
                </label>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">To Faculty:</span>
                    <span className="font-bold text-violet-800">{selectedFaculty.name} ({selectedFaculty.email})</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Subject:</span>
                    <span className="font-semibold text-slate-800">{emailSubject}</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Student:</span>
                    <span className="font-semibold text-slate-800">{studentDetails?.studentName || '—'} (Reg: {studentDetails?.registerNumber || '—'})</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Student Email:</span>
                    <span className="font-semibold text-slate-800">{studentDetails?.email || '—'}</span>
                  </div>
                  <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Experiment No. & Date:</span>
                    <span className="font-semibold text-slate-800">Exp {expNum} | {experimentDate || '—'}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-slate-500">Report Document:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{pdfFileName}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational Guidance Box */}
              <div className="p-3.5 rounded-xl bg-violet-50/80 border border-violet-200 text-xs text-violet-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-violet-800">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>How Sending Report Works:</span>
                </div>
                <p className="text-[11px] text-slate-700 font-sans leading-relaxed">
                  When you click the button below, the official formatted <strong>Lab Report PDF</strong> will automatically download to your device, and a new Gmail tab will open with the faculty email, subject, and student details pre-filled. Simply click the paperclip icon in Gmail to attach the downloaded PDF, then click Send!
                </p>
              </div>

              {/* Download Success Notice */}
              {downloadSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>PDF downloaded to your device: <strong className="text-slate-900">{pdfFileName}</strong></span>
                  </div>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedFaculty.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span>Open Gmail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-mono transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDownloadOnly}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Download clean lab report PDF file to your device"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  ) : (
                    <Download className="w-4 h-4 text-violet-600" />
                  )}
                  <span>Download PDF Only</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendToGmail}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all cursor-pointer disabled:opacity-50"
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
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-heading text-xl font-bold text-slate-900">
                  Report PDF Downloaded & Gmail Window Opened!
                </h4>
                <p className="text-xs text-slate-600 font-sans max-w-md mx-auto leading-relaxed">
                  Your clean experimental report PDF has been downloaded to your device as <span className="font-mono text-violet-700 font-bold">{pdfFileName}</span>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs font-sans space-y-2.5 max-w-lg mx-auto shadow-sm">
                <div className="font-bold text-slate-800 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>How to attach in your opened Gmail tab:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-xs leading-relaxed">
                  <li>In the Gmail compose tab that just opened, click the <strong>Attach files</strong> (📎 paperclip) icon.</li>
                  <li>Select the downloaded report file: <span className="font-mono text-violet-700 font-semibold">{pdfFileName}</span> from your Downloads folder.</li>
                  <li>All student metadata and experiment metrics are already pre-filled. Click <strong>Send</strong> to submit to {selectedFaculty.name}!</li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadOnly}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-mono transition-all cursor-pointer shadow-sm"
                  title="Download clean PDF again"
                >
                  <Download className="w-3.5 h-3.5 text-violet-600" />
                  <span>Download PDF Again</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyBody}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-mono transition-all cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5 text-violet-600" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Body'}</span>
                </button>

                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedFaculty.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Re-open Gmail Compose</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs font-mono transition-all cursor-pointer"
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
