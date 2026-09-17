import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  BookOpen,
  Mail,
  ShieldCheck,
  LogOut,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { useAuthStore } from '../../store/authStore';
import { SUBJECTS_CONFIG, GLOBAL_APP_CONFIG } from '../../data/subjects';
import { isValidRajalakshmiEmail } from '../../data/faculty';
import recLogo from '../../assets/rec-logo.png';

export function StudentDetailsGateModal({ onProceed }) {
  const {
    studentDetails,
    isStudentGateOpen,
    setStudentGateOpen,
    saveStudentDetails,
    currentSubject,
    setSubject
  } = useExperimentStore();

  const {
    user,
    studentGoogleLogin,
    authLoading,
    authError,
    logout: authLogout,
    clearAuthError,
    isOffline
  } = useAuthStore();

  const [selectedSubjectKey, setSelectedSubjectKey] = useState(currentSubject || 'fluid_mechanics');
  const activeSubjectInfo = SUBJECTS_CONFIG[selectedSubjectKey] || SUBJECTS_CONFIG.fluid_mechanics;

  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [acadYear, setAcadYear] = useState(GLOBAL_APP_CONFIG.defaultAcademicYear);
  const [semester, setSemester] = useState(activeSubjectInfo?.semester || 'VII');
  const [section, setSection] = useState(activeSubjectInfo?.section || 'B');
  const [validationError, setValidationError] = useState('');

  // Check if student is authenticated via Google with a valid @rajalakshmi.edu.in email
  const authenticatedEmail = user?.email || (isValidRajalakshmiEmail(studentDetails?.email) && studentDetails?.isGoogleVerified ? studentDetails?.email : '');
  const isGoogleAuthed = Boolean(authenticatedEmail && isValidRajalakshmiEmail(authenticatedEmail));

  useEffect(() => {
    setName(studentDetails?.studentName || user?.name || '');
    setRegNo(studentDetails?.registerNumber || '');
    setAcadYear(studentDetails?.academicYear || GLOBAL_APP_CONFIG.defaultAcademicYear);
    setSemester(studentDetails?.semester || activeSubjectInfo?.semester || 'VII');
    setSection(studentDetails?.section || activeSubjectInfo?.section || 'B');
    setSelectedSubjectKey(currentSubject || 'fluid_mechanics');
  }, [studentDetails, user, isStudentGateOpen, currentSubject]);

  if (!isStudentGateOpen) return null;

  const handleSubjectChange = (e) => {
    const newSubKey = e.target.value;
    setSelectedSubjectKey(newSubKey);
    setSubject(newSubKey);
    const subInfo = SUBJECTS_CONFIG[newSubKey];
    if (subInfo) {
      if (subInfo.semester) setSemester(subInfo.semester);
      if (subInfo.section) setSection(subInfo.section);
    }
  };

  const handleSwitchAccount = async () => {
    await authLogout();
    setName('');
    setRegNo('');
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!isGoogleAuthed) {
      setValidationError('Please sign in with your official Google @rajalakshmi.edu.in account first.');
      return;
    }

    if (!name.trim()) {
      setValidationError('Please enter your Student Full Name.');
      return;
    }

    if (!regNo.trim()) {
      setValidationError('Please enter your Register Number.');
      return;
    }

    if (!acadYear.trim()) {
      setValidationError('Please enter the Academic Year.');
      return;
    }

    const details = {
      studentName: name.trim(),
      registerNumber: regNo.trim(),
      email: authenticatedEmail.toLowerCase().trim(),
      academicYear: acadYear.trim(),
      semester,
      section,
      isGoogleVerified: true
    };

    if (typeof saveStudentDetails === 'function') {
      saveStudentDetails(details);
    }

    setStudentGateOpen(false);

    if (onProceed) {
      onProceed();
    }
  };

  const isComplete = Boolean(
    isGoogleAuthed &&
    studentDetails?.studentName &&
    studentDetails?.registerNumber
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl rounded-2xl bg-white border border-[#EDEEF1] p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EDEEF1] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-200 p-1.5 flex items-center justify-center shrink-0">
                <img src={recLogo} alt="Rajalakshmi Engineering College Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Student Login & Verification Gate</span>
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Official REC Google Authentication — <span className="font-mono font-bold text-violet-700">@rajalakshmi.edu.in</span> only
                </p>
              </div>
            </div>

            {isComplete && (
              <button
                onClick={() => setStudentGateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* If student is NOT signed in with Google, require Google Sign-In */}
          {!isGoogleAuthed ? (
            <div className="space-y-6 py-2">
              
              {/* Institutional Authorization Notice Banner */}
              <div className="p-4 rounded-xl bg-violet-50/80 border border-violet-200 flex items-start gap-3.5 text-xs">
                <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-violet-950">
                  <p className="font-bold text-sm">Official Google Account Required</p>
                  <p className="text-violet-800 leading-relaxed font-sans text-xs">
                    To maintain academic integrity and ensure official laboratory record authenticity, manual email entry is disabled. Students must sign in using their official Google institutional email (<span className="font-mono font-semibold">@rajalakshmi.edu.in</span>).
                  </p>
                </div>
              </div>

              {/* Error banner if previous login failed or personal account used */}
              {(authError || validationError) && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-900">Access Denied</p>
                    <p className="font-sans text-xs leading-relaxed">{authError || validationError}</p>
                  </div>
                </div>
              )}

              {/* Offline notice */}
              {isOffline && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Internet connection required to sign in with Google.</span>
                </div>
              )}

              {/* Google Sign-In Primary Action Card */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="font-heading font-bold text-base text-slate-800">
                    Sign in with your College Google ID
                  </h4>
                  <p className="text-xs text-slate-500 font-sans">
                    Use your Rajalakshmi Engineering College G-Suite email account
                  </p>
                </div>

                <button
                  type="button"
                  disabled={authLoading || isOffline}
                  onClick={studentGoogleLogin}
                  className="w-full max-w-md mx-auto py-3.5 px-6 rounded-xl bg-white border-2 border-slate-300 hover:border-violet-500 hover:bg-violet-50/50 text-slate-800 font-heading font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.99]"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                      <span>Opening Google Sign-In...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign In with Google (@rajalakshmi.edu.in)</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 font-sans">
                  Personal accounts (<span className="font-mono">@gmail.com</span>) are not permitted.
                </p>
              </div>

            </div>
          ) : (
            /* If student IS authenticated with Google, show verified profile and registration form */
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Verified Google Account Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Google Account Verified
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        REC Authorized
                      </span>
                    </div>
                    <p className="font-mono font-bold text-sm text-emerald-900 mt-0.5 break-all">
                      {authenticatedEmail}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Sign out and switch Google account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Switch Account</span>
                </button>
              </div>

              {/* Course Title Selection & Academic Metadata */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-violet-700 font-bold block flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Course Title & Institutional Configuration</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  
                  {/* Course Title Dropdown */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                      <span>Select Course Title <span className="text-violet-600">*</span></span>
                      <span className="text-[10px] text-violet-600 font-semibold">Inbuilt Subjects List</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSubjectKey}
                        onChange={handleSubjectChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-violet-900 font-bold focus:border-violet-500 appearance-none cursor-pointer pr-10 shadow-sm"
                      >
                        {Object.entries(SUBJECTS_CONFIG).map(([key, subj]) => (
                          <option key={key} value={key} className="bg-white text-slate-900 font-mono">
                            {subj.courseTitle} ({subj.courseCode}) — {subj.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-violet-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Auto-Derived Course Code */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Course Code (Auto-Derived)</span>
                      <span className="text-violet-700 font-bold text-sm">{activeSubjectInfo.courseCode}</span>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Field */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Field</span>
                      <span className="text-slate-800 font-bold">{GLOBAL_APP_CONFIG.field}</span>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Semester Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                      <span>Semester <span className="text-violet-600">*</span></span>
                      <span className="text-[10px] text-violet-600 font-semibold">Sem III – VIII</span>
                    </label>
                    <div className="relative">
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 font-bold focus:border-violet-500 appearance-none cursor-pointer pr-10 shadow-sm"
                      >
                        <option value="III">Semester III (3rd Sem)</option>
                        <option value="IV">Semester IV (4th Sem)</option>
                        <option value="V">Semester V (5th Sem)</option>
                        <option value="VI">Semester VI (6th Sem)</option>
                        <option value="VII">Semester VII (7th Sem)</option>
                        <option value="VIII">Semester VIII (8th Sem)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-violet-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Section Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                      <span>Section <span className="text-violet-600">*</span></span>
                      <span className="text-[10px] text-slate-400">Class Section</span>
                    </label>
                    <div className="relative">
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 font-bold focus:border-violet-500 appearance-none cursor-pointer pr-10 shadow-sm"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-violet-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Student Identification Form Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-mono uppercase tracking-wider text-violet-700 font-bold block">
                  Student Identification Parameters
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Student Full Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                      <span>Student Full Name <span className="text-violet-600">*</span></span>
                      <span className="text-[10px] text-slate-400">e.g. Ranjana</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter student full name..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500 shadow-sm"
                    />
                  </div>

                  {/* Register Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                      <span>Register Number <span className="text-violet-600">*</span></span>
                      <span className="text-[10px] text-slate-400">e.g. 2305010041</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      placeholder="Enter register number..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500 shadow-sm"
                    />
                  </div>

                  {/* Academic Year */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                      <span>Academic Year <span className="text-violet-600">*</span></span>
                      <span className="text-[10px] text-slate-400">e.g. 2027-2028</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={acadYear}
                      onChange={(e) => setAcadYear(e.target.value)}
                      placeholder="e.g. 2027-2028"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500 shadow-sm"
                    />
                  </div>

                  {/* Locked Official College Email Display */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-violet-600" />
                        <span>Official College Email (@rajalakshmi.edu.in)</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Locked to Google Session</span>
                      </span>
                    </label>

                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-800 break-all">{authenticatedEmail}</span>
                      <Lock className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans mt-1">
                      Email is authenticated directly via Google OAuth to prevent impersonation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-heading font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Confirm Details & Launch Virtual Lab</span>
                </button>
              </div>

            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
