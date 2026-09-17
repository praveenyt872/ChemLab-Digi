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
  KeyRound,
  GraduationCap,
  Sparkles,
  LogOut,
  Loader2
} from 'lucide-react';
import { useExperimentStore } from '../../store/experimentStore';
import { useAuthStore } from '../../store/authStore';
import { SUBJECTS_CONFIG, GLOBAL_APP_CONFIG } from '../../data/subjects';
import { isValidRajalakshmiEmail, ALL_FACULTY_LIST, UNIVERSAL_TEACHER_PASSWORD } from '../../data/faculty';
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
    role,
    teacherLogin,
    studentGoogleLogin,
    authLoading,
    authError,
    clearAuthError,
    logout
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'teacher'

  // Student Form State
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(currentSubject || 'fluid_mechanics');
  const [name, setName] = useState(studentDetails?.studentName || '');
  const [regNo, setRegNo] = useState(studentDetails?.registerNumber || '');
  const [acadYear, setAcadYear] = useState(studentDetails?.academicYear || GLOBAL_APP_CONFIG.defaultAcademicYear);
  const activeSubjectInfo = SUBJECTS_CONFIG[selectedSubjectKey] || SUBJECTS_CONFIG.fluid_mechanics;
  const [semester, setSemester] = useState(studentDetails?.semester || activeSubjectInfo?.semester || 'VII');
  const [section, setSection] = useState(studentDetails?.section || activeSubjectInfo?.section || 'B');
  const [localStudentError, setLocalStudentError] = useState('');

  // Teacher Form State
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [localTeacherError, setLocalTeacherError] = useState('');
  const [teacherSuccessMsg, setTeacherSuccessMsg] = useState('');

  useEffect(() => {
    setName(studentDetails?.studentName || '');
    setRegNo(studentDetails?.registerNumber || '');
    setAcadYear(studentDetails?.academicYear || GLOBAL_APP_CONFIG.defaultAcademicYear);
    setSemester(studentDetails?.semester || activeSubjectInfo?.semester || 'VII');
    setSection(studentDetails?.section || activeSubjectInfo?.section || 'B');
    setSelectedSubjectKey(currentSubject || 'fluid_mechanics');
  }, [studentDetails, isStudentGateOpen, currentSubject]);

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

  const isGoogleVerified = Boolean(
    studentDetails?.isGoogleVerified &&
    studentDetails?.email &&
    isValidRajalakshmiEmail(studentDetails?.email)
  );

  // Student Confirm Details
  const handleStudentSubmit = (e) => {
    e.preventDefault();
    setLocalStudentError('');

    if (!isGoogleVerified) {
      setLocalStudentError('You must sign in with your official Google account ending with @rajalakshmi.edu.in first.');
      return;
    }

    if (!name.trim()) {
      setLocalStudentError('Please enter your Student Full Name.');
      return;
    }
    if (!regNo.trim()) {
      setLocalStudentError('Please enter your Register Number.');
      return;
    }
    if (!acadYear.trim()) {
      setLocalStudentError('Please enter the Academic Year.');
      return;
    }

    const details = {
      ...studentDetails,
      studentName: name.trim(),
      registerNumber: regNo.trim(),
      email: studentDetails.email,
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

  // Student Google OAuth Trigger
  const handleGoogleSignIn = async () => {
    setLocalStudentError('');
    clearAuthError();
    const res = await studentGoogleLogin();
    if (!res.success && res.error) {
      setLocalStudentError(res.error);
    }
  };

  // Switch Student Google Account
  const handleSwitchGoogleAccount = async () => {
    await logout();
    setName('');
    setRegNo('');
    setLocalStudentError('');
  };

  // Teacher Login Submit
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setLocalTeacherError('');
    setTeacherSuccessMsg('');
    clearAuthError();

    const cleanEmail = (teacherEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      setLocalTeacherError('Please enter or select your registered faculty email.');
      return;
    }
    if (!teacherPassword) {
      setLocalTeacherError('Please enter the 6-digit department access password.');
      return;
    }

    const res = await teacherLogin({ email: cleanEmail, password: teacherPassword });
    if (res.success) {
      setTeacherSuccessMsg('Faculty authentication successful! Launching portal...');
      setTimeout(() => {
        setStudentGateOpen(false);
        if (onProceed) onProceed();
      }, 700);
    } else {
      setLocalTeacherError(res.error || 'Invalid faculty email or password. Please verify credentials.');
    }
  };

  const isStudentReady = Boolean(
    studentDetails?.studentName &&
    studentDetails?.registerNumber &&
    isGoogleVerified
  );

  const canClose = role === 'teacher' || isStudentReady;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl rounded-2xl bg-white border border-[#EDEEF1] p-6 sm:p-8 shadow-2xl text-slate-900 space-y-6 relative overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EDEEF1] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                <img src={recLogo} alt="REC Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Rajalakshmi Engineering College</span>
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Department of Chemical Engineering — Virtual Laboratory Portal
                </p>
              </div>
            </div>

            {canClose && (
              <button
                onClick={() => setStudentGateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Role Navigation Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                clearAuthError();
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-violet-600" />
              <span>Student Google Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                clearAuthError();
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-violet-600" />
              <span>Teacher / Faculty Login</span>
            </button>
          </div>

          {/* TAB 1: STUDENT ACCESS VIA GOOGLE OAUTH */}
          {activeTab === 'student' && (
            <div className="space-y-6">
              
              {/* Institutional Domain Banner */}
              <div className="p-3.5 rounded-xl bg-violet-50/80 border border-violet-200/80 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-violet-900">
                  <p className="font-bold">Authentic Google Institutional Sign-In Required</p>
                  <p className="text-violet-700 leading-relaxed font-sans text-[11px]">
                    To prevent unauthorized entries and eliminate spoofing, students must sign in with their verified Google account ending strictly in <strong className="font-mono text-violet-950">@rajalakshmi.edu.in</strong>. Personal Gmail accounts (@gmail.com) are rejected.
                  </p>
                </div>
              </div>

              {!isGoogleVerified ? (
                /* Unauthenticated Google Sign-In View */
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto text-violet-600">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-heading text-base font-bold text-slate-900">
                      Sign In with Your College Google Account
                    </h4>
                    <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                      Click below to authenticate securely using your official Rajalakshmi Engineering College email.
                    </p>
                  </div>

                  <div className="pt-2 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-heading font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {authLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                      ) : (
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
                      )}
                      <span>Sign in with Google (@rajalakshmi.edu.in)</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono">
                    Strict Domain Filter: <span className="text-violet-600 font-semibold">*@rajalakshmi.edu.in</span>
                  </p>
                </div>
              ) : (
                /* Authenticated Google Account — Complete Profile Form */
                <form onSubmit={handleStudentSubmit} className="space-y-5">
                  
                  {/* Verified Email Banner with Switch Account */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 block uppercase font-bold">Authenticated Google Account</span>
                        <span className="text-slate-900 font-bold text-xs break-all">{studentDetails.email}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSwitchGoogleAccount}
                      className="text-[11px] text-slate-500 hover:text-rose-600 font-sans flex items-center gap-1 shrink-0 p-1 cursor-pointer"
                      title="Sign out of this account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Switch</span>
                    </button>
                  </div>

                  {/* Course Title Selection & Academic Metadata */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-violet-700 font-bold block flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Course Title & Institutional Metadata</span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      
                      {/* Course Title Dropdown */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                          <span>Select Course Title <span className="text-violet-600">*</span></span>
                          <span className="text-[10px] text-violet-600 font-semibold">Inbuilt Subjects</span>
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

                      {/* Course Code */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Course Code</span>
                          <span className="text-violet-700 font-bold text-sm">{activeSubjectInfo.courseCode}</span>
                        </div>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      {/* Department */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Department</span>
                          <span className="text-slate-800 font-bold">{GLOBAL_APP_CONFIG.field}</span>
                        </div>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>

                      {/* Semester */}
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                          <span>Semester <span className="text-violet-600">*</span></span>
                        </label>
                        <div className="relative">
                          <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 font-bold focus:border-violet-500 appearance-none cursor-pointer pr-10 shadow-sm"
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

                      {/* Section */}
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                          <span>Section <span className="text-violet-600">*</span></span>
                        </label>
                        <div className="relative">
                          <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 font-bold focus:border-violet-500 appearance-none cursor-pointer pr-10 shadow-sm"
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

                  {/* Student Name & Register Number */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-violet-700 font-bold block">
                      Student Lab Record Identification
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                          <span>Student Full Name <span className="text-violet-600">*</span></span>
                          <span className="text-[10px] text-slate-400">Pre-filled from Google</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Praveen R"
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500 shadow-sm font-semibold"
                        />
                      </div>

                      {/* Register Number */}
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                          <span>Register Number <span className="text-violet-600">*</span></span>
                          <span className="text-[10px] text-slate-400">e.g. 2116240801001</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={regNo}
                          onChange={(e) => setRegNo(e.target.value)}
                          placeholder="Enter your REC Register Number..."
                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500 shadow-sm font-semibold"
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
                    </div>
                  </div>

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

              {/* Errors */}
              {(localStudentError || authError) && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{localStudentError || authError}</span>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: TEACHER / FACULTY ACCESS (NON-GOOGLE LOCAL PASSWORD) */}
          {activeTab === 'teacher' && (
            <div className="space-y-6">
              
              {/* Teacher Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300/80 flex items-start gap-3 text-xs">
                <KeyRound className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-slate-800">
                  <p className="font-bold text-slate-900">Faculty Local Password Login</p>
                  <p className="text-slate-600 leading-relaxed font-sans text-[11px]">
                    Department faculty members do not use Google login. Simply enter your registered faculty email and the 6-digit department access password to access the portal and experiments.
                  </p>
                </div>
              </div>

              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                
                {/* Faculty Email Selector / Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-violet-600" />
                      <span>Registered Faculty Email ID <span className="text-violet-600">*</span></span>
                    </span>
                    <span className="text-[10px] text-violet-600 font-semibold">17 Registered Faculty</span>
                  </label>
                  
                  {/* Select from faculty list or type */}
                  <div className="relative">
                    <input
                      type="email"
                      required
                      list="faculty-emails-list"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="e.g. mangaleswari.s@rajalakshmi.edu.in"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 focus:border-violet-500 shadow-sm font-semibold pr-10"
                    />
                    <datalist id="faculty-emails-list">
                      {ALL_FACULTY_LIST.map((fac) => (
                        <option key={fac.email} value={fac.email}>
                          {fac.name} ({fac.designation})
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Quick select from dropdown or enter your institutional faculty address.
                  </p>
                </div>

                {/* 6-Digit Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-violet-600" />
                      <span>6-Digit Department Access Password <span className="text-violet-600">*</span></span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">6-Digit PIN</span>
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Enter 6-digit password..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono text-slate-900 focus:border-violet-500 shadow-sm tracking-widest font-bold"
                  />
                  <p className="text-[11px] text-slate-500 font-sans">
                    Universal 6-digit access code for all department faculty members.
                  </p>
                </div>

                {/* Feedback Alerts */}
                {teacherSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{teacherSuccessMsg}</span>
                  </div>
                )}

                {(localTeacherError || authError) && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{localTeacherError || authError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-heading font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {authLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <KeyRound className="w-4 h-4 text-white" />
                    )}
                    <span>Log In as Department Faculty</span>
                  </button>
                </div>

              </form>

            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
