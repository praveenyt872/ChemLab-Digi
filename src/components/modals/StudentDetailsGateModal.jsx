import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ShieldCheck, Lock, AlertCircle, CheckCircle2, X, ChevronDown, BookOpen } from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { SUBJECTS_CONFIG, GLOBAL_APP_CONFIG } from '../../data/subjects';

export function StudentDetailsGateModal({ onProceed }) {
  const {
    studentDetails,
    isStudentGateOpen,
    setStudentGateOpen,
    saveStudentDetails,
    currentSubject,
    setSubject
  } = useExperimentStore();

  const [selectedSubjectKey, setSelectedSubjectKey] = useState(currentSubject || 'fluid_mechanics');
  const [name, setName] = useState(studentDetails?.studentName || '');
  const [regNo, setRegNo] = useState(studentDetails?.registerNumber || '');
  const [acadYear, setAcadYear] = useState(studentDetails?.academicYear || GLOBAL_APP_CONFIG.defaultAcademicYear);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setName(studentDetails?.studentName || '');
    setRegNo(studentDetails?.registerNumber || '');
    setAcadYear(studentDetails?.academicYear || GLOBAL_APP_CONFIG.defaultAcademicYear);
    setSelectedSubjectKey(currentSubject || 'fluid_mechanics');
  }, [studentDetails, isStudentGateOpen, currentSubject]);

  if (!isStudentGateOpen) return null;

  const activeSubjectInfo = SUBJECTS_CONFIG[selectedSubjectKey] || SUBJECTS_CONFIG.fluid_mechanics;

  const handleSubjectChange = (e) => {
    const newSubKey = e.target.value;
    setSelectedSubjectKey(newSubKey);
    setSubject(newSubKey);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your Student Name.');
      return;
    }
    if (!regNo.trim()) {
      setErrorMsg('Please enter your Register Number.');
      return;
    }
    if (!acadYear.trim()) {
      setErrorMsg('Please enter the Academic Year.');
      return;
    }

    setErrorMsg('');
    saveStudentDetails({
      studentName: name.trim(),
      registerNumber: regNo.trim(),
      academicYear: acadYear.trim()
    });

    if (onProceed) {
      onProceed();
    }
  };

  const isComplete = studentDetails?.studentName && studentDetails?.registerNumber;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl rounded-2xl glass-panel border border-cyan-500/40 p-6 sm:p-8 shadow-2xl bg-slate-950/95 text-slate-100 space-y-6 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Student Details Identification Gate</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Select course title and enter student details for official lab verification
                </p>
              </div>
            </div>

            {isComplete && (
              <button
                onClick={() => setStudentGateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Form Fields Grid */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Course Title Selection & Academic Metadata */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Inbuilt Course Title & Institutional Config</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                
                {/* Course Title Dropdown (Inbuilt Select Option) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>Select Course Title <span className="text-cyan-400">*</span></span>
                    <span className="text-[10px] text-cyan-400 font-semibold">Inbuilt Subjects List</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubjectKey}
                      onChange={handleSubjectChange}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono text-cyan-300 font-bold bg-slate-900 border border-cyan-500/40 focus:border-cyan-400 appearance-none cursor-pointer pr-10 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                    >
                      {Object.entries(SUBJECTS_CONFIG).map(([key, subj]) => (
                        <option key={key} value={key} className="bg-slate-950 text-slate-100 font-mono">
                          {subj.courseTitle} ({subj.courseCode}) — {subj.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Auto-Derived Course Code */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Course Code (Auto-Derived)</span>
                    <span className="text-cyan-300 font-bold text-sm">{activeSubjectInfo.courseCode}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>

                {/* Field */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Field</span>
                    <span className="text-slate-200 font-bold">{GLOBAL_APP_CONFIG.field}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>

                {/* Semester & Section */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between sm:col-span-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Semester & Section</span>
                    <span className="text-slate-200 font-bold">Semester {GLOBAL_APP_CONFIG.semester} — Section {GLOBAL_APP_CONFIG.section}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>

              </div>
            </div>

            {/* Editable Student Inputs (3 Required Fields) */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                Required Student Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>Student Full Name <span className="text-cyan-400">*</span></span>
                    <span className="text-[10px] text-slate-500">e.g. Ranjana</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter student name..."
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Register Number */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>Register Number <span className="text-cyan-400">*</span></span>
                    <span className="text-[10px] text-slate-500">e.g. 2305010041</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="Enter register number..."
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Academic Year */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>Academic Year <span className="text-cyan-400">*</span></span>
                    <span className="text-[10px] text-slate-500">e.g. 2027-2028</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={acadYear}
                    onChange={(e) => setAcadYear(e.target.value)}
                    placeholder="e.g. 2027-2028"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 font-heading font-bold text-sm hover:brightness-110 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Save Details & Launch Selected Course</span>
              </button>
            </div>

          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
