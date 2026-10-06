import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Trash2,
  RotateCcw,
  Layers,
  CheckCheck,
  Mail,
  Send,
  MessageSquare,
  X
} from 'lucide-react';
import {
  fetchSubmissions,
  fetchExperimentDeadline,
  fetchAllDeadlines,
  setExperimentDeadline,
  deleteSubmission,
  getRecycleBinSubmissions,
  moveToRecycleBin,
  restoreFromRecycleBin,
  deletePermanently,
  emptyRecycleBin,
  updateSubmissionStatus,
  sendNotApprovedEmail
} from '../../utils/submissionService';
import {
  combineStudentExperimentPdfs,
  sortStudentSubmissionsByExpNumber
} from '../../utils/pdfMergeService';

const TOTAL_CLASS_STRENGTH = 65;

const EXPERIMENTS_LIST = [
  { id: 'all', name: 'All Experiments (Overview)', shortName: 'All' },
  { id: 'rotameter_calibration', name: '1. Calibration of Rotameter', shortName: 'Rotameter' },
  { id: 'venturi_meter', name: '2. Flow Through Venturi Meter', shortName: 'Venturi Meter' },
  { id: 'orifice_meter', name: '3. Flow Through Orifice Meter', shortName: 'Orifice Meter' },
  { id: 'pipe_friction', name: '4. Flow Through Pipes (Friction Factor)', shortName: 'Pipe Friction' },
  { id: 'minor_losses', name: '5. Minor Losses in Pipe Fittings', shortName: 'Minor Losses' },
  { id: 'centrifugal_pump', name: '6. Characteristics of Centrifugal Pump', shortName: 'Centrifugal Pump' },
  { id: 'reciprocating_pump', name: '7. Characteristics of Reciprocating Pump', shortName: 'Reciprocating Pump' },
  { id: 'gear_oil_pump', name: '8. Characteristics of Gear Oil Pump', shortName: 'Gear Oil Pump' },
  { id: 'drag_coefficient_solid_particle', name: '9. Drag Coefficient of Solid Particles', shortName: 'Drag Coeff' },
  { id: 'helical_spiral_coil', name: '10. Flow Through Helical & Spiral Coils', shortName: 'Helical & Spiral' }
];

export function TeacherDashboard({ onEnterLab }) {
  const { user, logout } = useAuthStore();

  const [selectedExpId, setSelectedExpId] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [deadlines, setDeadlines] = useState({});
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Tab, Merging, & Recycle Bin state
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'combine' | 'recycle_bin'
  const [recycleBin, setRecycleBin] = useState([]);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isRestoringId, setIsRestoringId] = useState(null);
  const [isPermanentDeletingId, setIsPermanentDeletingId] = useState(null);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');
  const [mergingRegNo, setMergingRegNo] = useState(null);
  const [mergeStatus, setMergeStatus] = useState('');

  // Approval & Email Notification state
  const [approvingId, setApprovingId] = useState(null);
  const [notApprovedModalSub, setNotApprovedModalSub] = useState(null);
  const [facultyRemarksInput, setFacultyRemarksInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDispatchStatus, setEmailDispatchStatus] = useState('');
  const [emailSentInfo, setEmailSentInfo] = useState(null);
  const [viewRemarksSub, setViewRemarksSub] = useState(null);

  // Deadline editing state
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);
  const [deadlineSuccessMsg, setDeadlineSuccessMsg] = useState('');

  // Load Submissions & Deadlines from Supabase & Local Cache
  const loadData = async () => {
    setIsLoadingSubmissions(true);
    try {
      const [subs, dls] = await Promise.all([
        fetchSubmissions({ subjectId: 'fluid_mechanics' }),
        fetchAllDeadlines()
      ]);
      setSubmissions(subs || []);
      setDeadlines(dls || {});
      setRecycleBin(getRecycleBinSubmissions());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter active submissions by selected experiment and search term
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchesExp = selectedExpId === 'all' || sub.experiment_id === selectedExpId;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (sub.student_name && sub.student_name.toLowerCase().includes(searchLower)) ||
        (sub.register_number && sub.register_number.toLowerCase().includes(searchLower)) ||
        (sub.experiment_name && sub.experiment_name.toLowerCase().includes(searchLower));
      return matchesExp && matchesSearch;
    });
  }, [submissions, selectedExpId, searchTerm]);

  // Filter recycle bin submissions by selected experiment and search term
  const filteredRecycleBin = useMemo(() => {
    return recycleBin.filter(sub => {
      const matchesExp = selectedExpId === 'all' || sub.experiment_id === selectedExpId;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (sub.student_name && sub.student_name.toLowerCase().includes(searchLower)) ||
        (sub.register_number && sub.register_number.toLowerCase().includes(searchLower)) ||
        (sub.experiment_name && sub.experiment_name.toLowerCase().includes(searchLower));
      return matchesExp && matchesSearch;
    });
  }, [recycleBin, selectedExpId, searchTerm]);

  // Group all active submissions by student (Register Number)
  const studentRecordsSummary = useMemo(() => {
    const studentMap = new Map();

    submissions.forEach(sub => {
      const reg = String(sub.register_number || '').trim();
      if (!reg) return;

      if (!studentMap.has(reg)) {
        studentMap.set(reg, {
          registerNumber: reg,
          studentName: sub.student_name || 'Student',
          studentEmail: sub.student_email || '',
          submissions: []
        });
      }

      studentMap.get(reg).submissions.push(sub);
    });

    const list = Array.from(studentMap.values()).map(st => {
      // Sort each student's submissions strictly by the experiment number entered/assigned by student
      const sortedSubs = sortStudentSubmissionsByExpNumber(st.submissions);
      return {
        ...st,
        submissions: sortedSubs,
        completedCount: sortedSubs.length,
        isFullyComplete: sortedSubs.length >= 10
      };
    });

    // Natural sort by register number
    return list.sort((a, b) => {
      const matchA = a.registerNumber.match(/\d+$/);
      const matchB = b.registerNumber.match(/\d+$/);
      if (matchA && matchB) {
        const numA = parseInt(matchA[0], 10);
        const numB = parseInt(matchB[0], 10);
        if (numA !== numB) return numA - numB;
      }
      return a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [submissions]);

  // Filter student records by search term
  const filteredStudentRecords = useMemo(() => {
    if (!searchTerm) return studentRecordsSummary;
    const s = searchTerm.toLowerCase();
    return studentRecordsSummary.filter(st =>
      st.studentName.toLowerCase().includes(s) ||
      st.registerNumber.toLowerCase().includes(s) ||
      (st.studentEmail && st.studentEmail.toLowerCase().includes(s))
    );
  }, [studentRecordsSummary, searchTerm]);

  const fullyCompletedStudentsCount = useMemo(() => {
    return studentRecordsSummary.filter(st => st.isFullyComplete).length;
  }, [studentRecordsSummary]);

  // Unique student submissions count for selected experiment
  const submittedCount = useMemo(() => {
    const relevant = selectedExpId === 'all'
      ? submissions
      : submissions.filter(s => s.experiment_id === selectedExpId);
    const uniqueRegs = new Set(relevant.map(s => String(s.register_number).trim().toLowerCase()));
    return uniqueRegs.size;
  }, [submissions, selectedExpId]);

  const remainingCount = Math.max(0, TOTAL_CLASS_STRENGTH - submittedCount);
  const completionPercentage = ((submittedCount / TOTAL_CLASS_STRENGTH) * 100).toFixed(1);

  // Active deadline for currently selected experiment
  const currentDeadline = selectedExpId !== 'all' ? deadlines[selectedExpId] : null;
  const isCurrentDeadlineExpired = currentDeadline?.deadline_at
    ? new Date() > new Date(currentDeadline.deadline_at)
    : false;

  // Handle saving new / extended deadline
  const handleSaveDeadline = async () => {
    if (selectedExpId === 'all') {
      alert('Please select a specific experiment to set or extend its deadline.');
      return;
    }
    if (!newDeadlineDate) {
      alert('Please select a date and time for the deadline.');
      return;
    }

    setIsSavingDeadline(true);
    setDeadlineSuccessMsg('');
    const expObj = EXPERIMENTS_LIST.find(e => e.id === selectedExpId);
    const expName = expObj ? expObj.name : selectedExpId;

    const res = await setExperimentDeadline({
      experimentId: selectedExpId,
      subjectId: 'fluid_mechanics',
      experimentName: expName,
      deadlineAt: newDeadlineDate,
      updatedBy: user?.email || 'Faculty'
    });

    if (res.success) {
      setDeadlines(prev => ({
        ...prev,
        [selectedExpId]: res.data
      }));
      setDeadlineSuccessMsg('Deadline updated successfully! Portal permissions updated.');
      setTimeout(() => setDeadlineSuccessMsg(''), 4000);
    } else {
      alert('Failed to update deadline: ' + res.error);
    }
    setIsSavingDeadline(false);
  };

  const handleClearDeadline = async () => {
    if (selectedExpId === 'all') return;
    if (!confirm('Are you sure you want to remove the deadline restriction? Submissions will remain open indefinitely.')) return;

    setIsSavingDeadline(true);
    const expObj = EXPERIMENTS_LIST.find(e => e.id === selectedExpId);
    const res = await setExperimentDeadline({
      experimentId: selectedExpId,
      subjectId: 'fluid_mechanics',
      experimentName: expObj?.name || selectedExpId,
      deadlineAt: null,
      updatedBy: user?.email || 'Faculty'
    });

    if (res.success) {
      setDeadlines(prev => {
        const next = { ...prev };
        delete next[selectedExpId];
        return next;
      });
      setNewDeadlineDate('');
      setDeadlineSuccessMsg('Deadline restriction removed. Submissions are open.');
      setTimeout(() => setDeadlineSuccessMsg(''), 4000);
    }
    setIsSavingDeadline(false);
  };

  // Quick deadline extension helpers
  const handleQuickExtend = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 0, 0);
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, '0');
    const val = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setNewDeadlineDate(val);
  };

  // 1. Move to Recycle Bin (Soft Delete)
  const handleMoveToTrash = async (sub) => {
    setIsDeletingId(sub.id);
    const res = await moveToRecycleBin(sub);
    if (res.success) {
      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
      setRecycleBin(getRecycleBinSubmissions());
      setDeleteSuccessMsg(`Report for ${sub.register_number} (${sub.student_name}) moved to Recycle Bin.`);
      setTimeout(() => setDeleteSuccessMsg(''), 4500);
    } else {
      alert('Failed to move submission to Recycle Bin: ' + (res.error || 'Unknown error'));
    }
    setIsDeletingId(null);
  };

  // 2. Restore from Recycle Bin
  const handleRestore = async (sub) => {
    setIsRestoringId(sub.id);
    const res = await restoreFromRecycleBin(sub.id);
    if (res.success) {
      setRecycleBin(prev => prev.filter(s => s.id !== sub.id));
      setSubmissions(prev => {
        const next = [...prev, sub];
        return next.sort((a, b) => {
          const regA = String(a.register_number || '').trim();
          const regB = String(b.register_number || '').trim();
          return regA.localeCompare(regB, undefined, { numeric: true, sensitivity: 'base' });
        });
      });
      setDeleteSuccessMsg(`Report for ${sub.register_number} (${sub.student_name}) restored back to active list.`);
      setTimeout(() => setDeleteSuccessMsg(''), 4500);
    } else {
      alert('Failed to restore submission: ' + (res.error || 'Unknown error'));
    }
    setIsRestoringId(null);
  };

  // 3. Delete Permanently (From Recycle Bin with Pop-up confirmation)
  const handlePermanentDelete = async (sub) => {
    const confirmed = window.confirm(
      `It will be deleted permanently.\n\nAre you sure you want to permanently delete the lab report for ${sub.student_name || 'this student'} (Reg No: ${sub.register_number})? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsPermanentDeletingId(sub.id);
    const res = await deletePermanently(sub.id, sub.pdf_url);
    if (res.success) {
      setRecycleBin(prev => prev.filter(s => s.id !== sub.id));
      setDeleteSuccessMsg(`Report for ${sub.register_number} has been permanently deleted.`);
      setTimeout(() => setDeleteSuccessMsg(''), 4500);
    } else {
      alert('Failed to delete permanently: ' + (res.error || 'Unknown error'));
    }
    setIsPermanentDeletingId(null);
  };

  // 4. Empty Recycle Bin Permanently
  const handleEmptyRecycleBin = async () => {
    if (recycleBin.length === 0) return;
    const confirmed = window.confirm(
      `It will be deleted permanently.\n\nAre you sure you want to permanently delete all ${recycleBin.length} reports in the Recycle Bin? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsEmptyingTrash(true);
    await emptyRecycleBin();
    setRecycleBin([]);
    setDeleteSuccessMsg('All reports in the Recycle Bin have been permanently deleted.');
    setTimeout(() => setDeleteSuccessMsg(''), 4500);
    setIsEmptyingTrash(false);
  };

  // 5. Combine & Download all experiment PDFs for a student
  const handleCombinePdfs = async (student) => {
    if (!student.submissions || student.submissions.length === 0) {
      alert('No submitted experiment reports available for this student.');
      return;
    }

    setMergingRegNo(student.registerNumber);
    setMergeStatus('Initializing merged document...');

    const res = await combineStudentExperimentPdfs({
      studentName: student.studentName,
      registerNumber: student.registerNumber,
      submissions: student.submissions,
      onProgress: ({ current, total, status }) => {
        setMergeStatus(status);
      }
    });

    if (res.success) {
      setDeleteSuccessMsg(`Combined Record for ${student.registerNumber} (${student.studentName}) downloaded successfully! (${res.count} experiments compiled)`);
      setTimeout(() => setDeleteSuccessMsg(''), 5500);
    } else {
      alert('Failed to combine PDFs: ' + (res.error || 'Unknown error'));
    }

    setMergingRegNo(null);
    setMergeStatus('');
  };

  // 6. Approve Submission (Turns Green)
  const handleApproveSubmission = async (sub) => {
    setApprovingId(sub.id);
    const res = await updateSubmissionStatus({
      submissionId: sub.id,
      status: 'approved',
      facultyRemarks: '',
      reviewedBy: user?.email || 'Faculty'
    });

    if (res.success) {
      setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'approved', faculty_remarks: '' } : s));
      setDeleteSuccessMsg(`Experiment submission for ${sub.register_number} (${sub.student_name}) has been Approved ✅`);
      setTimeout(() => setDeleteSuccessMsg(''), 4500);
    } else {
      alert('Failed to update approval status: ' + (res.error || 'Unknown error'));
    }
    setApprovingId(null);
  };

  // 7. Open Not Approved & Email Modal
  const handleOpenNotApprovedModal = (sub) => {
    setNotApprovedModalSub(sub);
    const expName = sub.experiment_name || sub.experiment_id || 'Laboratory Experiment';
    const defaultRemarks = sub.faculty_remarks || `Corrections are required in your submitted experiment calculations and observations for ${expName}. Please review your record and meet the faculty in the laboratory to obtain approval.`;
    setFacultyRemarksInput(defaultRemarks);
    setEmailDispatchStatus('');
    setEmailSentInfo(null);
  };

  // 8. Confirm Not Approved & Send Automated Email (Turns Yellow)
  const handleConfirmNotApproved = async () => {
    if (!notApprovedModalSub) return;
    setIsSendingEmail(true);
    setEmailDispatchStatus('Sending automated background email to student...');

    const sub = notApprovedModalSub;
    const expName = sub.experiment_name || sub.experiment_id || 'Laboratory Experiment';

    // 1. Update status to not_approved with faculty remarks
    const statusRes = await updateSubmissionStatus({
      submissionId: sub.id,
      status: 'not_approved',
      facultyRemarks: facultyRemarksInput,
      reviewedBy: user?.email || 'Faculty'
    });

    // 2. Dispatch automated email directly in background
    const emailRes = await sendNotApprovedEmail({
      studentName: sub.student_name,
      studentEmail: sub.student_email,
      registerNumber: sub.register_number,
      experimentName: expName,
      facultyRemarks: facultyRemarksInput,
      facultyEmail: user?.email || 'faculty@rajalakshmi.edu.in',
      facultyName: user?.email ? user.email.split('@')[0] : 'Faculty In-Charge'
    });

    if (statusRes.success) {
      setSubmissions(prev => prev.map(s => s.id === sub.id ? {
        ...s,
        status: 'not_approved',
        faculty_remarks: facultyRemarksInput
      } : s));
    }

    setEmailSentInfo({
      targetEmail: emailRes.targetEmail,
      gmailComposeUrl: emailRes.gmailComposeUrl
    });

    setEmailDispatchStatus(`Automated email successfully sent to ${emailRes.targetEmail}! Submission marked as Not Approved ⚠️`);
    setIsSendingEmail(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#F8FAFC] min-h-screen text-slate-900">
      
      {/* 1. Header Banner (Clean Light White with Purple Accent) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <span>Faculty Laboratory & Submission Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Teacher Management Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Welcome, <strong className="text-violet-700">{user?.email}</strong>. Track student PDF submissions, set experiment deadlines, and manage lab report records.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onEnterLab}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <span>Enter Lab Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              await logout();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer"
            title="Sign out of faculty session"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Experiment Selector & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Select Experiment Module:
            </h2>
          </div>

          <button
            onClick={loadData}
            disabled={isLoadingSubmissions}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Experiment Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {EXPERIMENTS_LIST.map((exp) => {
            const isSelected = selectedExpId === exp.id;
            return (
              <button
                key={exp.id}
                onClick={() => {
                  setSelectedExpId(exp.id);
                  setDeadlineSuccessMsg('');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
                }`}
              >
                {exp.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Class Strength & Submission Progress Metrics (Total: 65) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Strength */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Enrolled Students</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-heading">
            {TOTAL_CLASS_STRENGTH}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Department Batch Strength
          </p>
        </div>

        {/* Card 2: Submissions Received */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Submissions Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-heading">
            {submittedCount}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {selectedExpId === 'all' ? 'Across all modules' : 'For this experiment'}
          </p>
        </div>

        {/* Card 3: Pending Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Submissions</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-heading">
            {remainingCount}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Students remaining to submit
          </p>
        </div>

        {/* Card 4: Completion Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Completion Rate</span>
            <span className="font-bold text-violet-700 text-xs">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-violet-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {submittedCount} of {TOTAL_CLASS_STRENGTH} submitted
          </p>
        </div>

      </div>

      {/* 4. Experiment Deadline Management Controller */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600" />
              <span>Experiment Submission Deadline Controller</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set or extend the submission deadline. Students cannot submit after the deadline expires unless you extend it.
            </p>
          </div>

          {selectedExpId !== 'all' && (
            <div className="flex items-center gap-2">
              {currentDeadline?.deadline_at ? (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono ${
                  isCurrentDeadlineExpired
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isCurrentDeadlineExpired ? '🔴 Deadline Passed' : '🟢 Submissions Open'}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  No Deadline Set (Always Open)
                </span>
              )}
            </div>
          )}
        </div>

        {deadlineSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deadlineSuccessMsg}</span>
          </div>
        )}

        {selectedExpId === 'all' ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Please select a specific experiment module from the filter buttons above (e.g. <em>Rotameter</em> or <em>Venturi Meter</em>) to view and set its deadline.
            </span>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-slate-500 font-semibold block">Selected Module:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {EXPERIMENTS_LIST.find(e => e.id === selectedExpId)?.name}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-slate-500 font-semibold block">Current Enforced Deadline:</span>
                <span className="font-mono font-bold text-violet-800 text-sm">
                  {currentDeadline?.deadline_at
                    ? new Date(currentDeadline.deadline_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : 'None (Submissions Open)'}
                </span>
              </div>
            </div>

            {/* Set or Change Deadline Form */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 pt-2">
              <div className="flex-1 max-w-sm">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  New / Extended Deadline:
                </label>
                <input
                  type="datetime-local"
                  value={newDeadlineDate}
                  onChange={(e) => setNewDeadlineDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-violet-600 shadow-xs"
                />
              </div>

              {/* Quick Extend Buttons */}
              <div className="flex items-center gap-2 self-end pb-0.5">
                <button
                  type="button"
                  onClick={() => handleQuickExtend(2)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  +2 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickExtend(7)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  onClick={handleSaveDeadline}
                  disabled={isSavingDeadline || !newDeadlineDate}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingDeadline ? 'Saving...' : '💾 Save Deadline'}
                </button>
                {currentDeadline?.deadline_at && (
                  <button
                    type="button"
                    onClick={handleClearDeadline}
                    disabled={isSavingDeadline}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Clear Restriction
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Submissions & Recycle Bin Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Navigation Tabs (Active vs Combine 10-in-1 vs Recycle Bin) */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-6 pt-3 bg-slate-50/70 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'active'
                  ? 'border-violet-600 text-violet-700 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Active Submissions</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-100 text-violet-800 font-bold">
                {filteredSubmissions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('combine')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'combine'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Combine 10-in-1 Records</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                fullyCompletedStudentsCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {fullyCompletedStudentsCount} Complete
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recycle_bin')}
              className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'recycle_bin'
                  ? 'border-rose-600 text-rose-700 bg-white rounded-t-xl shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Recycle Bin (Deleted PDFs)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                recycleBin.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {recycleBin.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-xs w-full pb-2 sm:pb-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                activeTab === 'active'
                  ? 'Search Active Submissions...'
                  : activeTab === 'combine'
                  ? 'Search by Student Name or Reg No...'
                  : 'Search Recycle Bin...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 shadow-xs"
            />
          </div>
        </div>

        {/* Global Action Banner */}
        {deleteSuccessMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteSuccessMsg}</span>
          </div>
        )}

        {/* TAB 1: ACTIVE SUBMISSIONS */}
        {activeTab === 'active' && (
          <div>
            {isLoadingSubmissions ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-violet-600" />
                <p className="text-xs font-mono">Loading student submissions from cloud portal...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">No Submissions Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchTerm
                    ? 'No student matching your search term.'
                    : 'No student has submitted this experiment yet. Submissions will automatically appear here once students submit via their workspace.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Register Number</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Experiment</th>
                      <th className="py-3.5 px-4">Approval Status</th>
                      <th className="py-3.5 px-4">Submitted At</th>
                      <th className="py-3.5 px-4 text-right">Report & Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredSubmissions.map((sub, idx) => {
                      const isApproved = sub.status === 'approved';
                      const isNotApproved = sub.status === 'not_approved';

                      return (
                        <tr
                          key={sub.id || idx}
                          className={`transition-colors ${
                            isApproved
                              ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                              : isNotApproved
                              ? 'bg-amber-50/40 hover:bg-amber-50/70'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-violet-900">
                            {sub.register_number}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {sub.student_name}
                            {sub.student_email && (
                              <span className="block text-[10px] font-mono text-slate-400">
                                {sub.student_email}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium text-[11px]">
                              {sub.experiment_name || sub.experiment_id}
                            </span>
                          </td>

                          {/* Approval Status Badge Column */}
                          <td className="py-3.5 px-4">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            ) : isNotApproved ? (
                              <div className="inline-flex flex-col items-start gap-0.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Not Approved</span>
                                </span>
                                {sub.faculty_remarks && (
                                  <button
                                    type="button"
                                    onClick={() => setViewRemarksSub(sub)}
                                    className="text-[10px] text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer ml-1"
                                    title="View corrections required"
                                  >
                                    View Note
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Pending Review</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                            {sub.submitted_at
                              ? new Date(sub.submitted_at).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })
                              : '—'}
                          </td>

                          {/* Actions: View PDF + Approve (Green) + Not Approved (Yellow) + Delete */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                              {/* View PDF */}
                              {sub.pdf_url ? (
                                <a
                                  href={sub.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-xs transition-colors border border-violet-200"
                                  title="View student submitted lab report PDF"
                                >
                                  <span>View PDF</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">No PDF</span>
                              )}

                              {/* Approve Button (Turns Green) */}
                              <button
                                type="button"
                                onClick={() => handleApproveSubmission(sub)}
                                disabled={approvingId === sub.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isApproved
                                    ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-400'
                                }`}
                                title={isApproved ? 'Approved by faculty' : 'Click to approve this experiment'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>
                                  {approvingId === sub.id ? 'Saving...' : isApproved ? 'Approved ✓' : 'Approve'}
                                </span>
                              </button>

                              {/* Not Approved Button (Turns Yellow & Dispatches Email) */}
                              <button
                                type="button"
                                onClick={() => handleOpenNotApprovedModal(sub)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isNotApproved
                                    ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                                    : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 hover:border-amber-400'
                                }`}
                                title="Mark as Not Approved and send email notification to student"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>
                                  {isNotApproved ? 'Not Approved ⚠️' : 'Not Approved'}
                                </span>
                              </button>

                              {/* Move to Recycle Bin */}
                              <button
                                type="button"
                                onClick={() => handleMoveToTrash(sub)}
                                disabled={isDeletingId === sub.id}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer border border-rose-200 disabled:opacity-50"
                                title="Move this submission to Recycle Bin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{isDeletingId === sub.id ? 'Moving...' : 'Delete'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMBINE 10-IN-1 RECORDS */}
        {activeTab === 'combine' && (
          <div>
            {/* Guidance Toolbar */}
            <div className="p-4 bg-indigo-50/70 border-b border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <strong className="block text-slate-900">Student Consolidated Records (Combined Single PDF)</strong>
                  <span className="text-slate-600">
                    Merges all submitted experiment reports into one single semester record PDF, organized in the order of experiment numbers given by the student (Ex. 1, 2, 3...).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 font-mono font-bold text-indigo-700 shadow-xs">
                  {fullyCompletedStudentsCount} of {studentRecordsSummary.length} students completed all 10
                </span>
              </div>
            </div>

            {filteredStudentRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">No Student Records Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchTerm
                    ? 'No students matching your search criteria.'
                    : 'No student submissions found. Once students submit experiments, they will appear here grouped by student.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-indigo-50/50 border-b border-slate-200 text-slate-600 font-mono font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Register Number</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Completion Status</th>
                      <th className="py-3.5 px-4">Experiments Included (Student Order)</th>
                      <th className="py-3.5 px-4 text-right">Combined Record</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredStudentRecords.map((st, idx) => (
                      <tr key={st.registerNumber || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-950">
                          {st.registerNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {st.studentName}
                          {st.studentEmail && (
                            <span className="block text-[10px] font-mono text-slate-400">
                              {st.studentEmail}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 max-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className={`font-bold ${st.isFullyComplete ? 'text-emerald-700' : 'text-slate-600'}`}>
                                {st.completedCount} / 10
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {Math.round((st.completedCount / 10) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  st.isFullyComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${Math.min(100, (st.completedCount / 10) * 100)}%` }}
                              />
                            </div>
                            {st.isFullyComplete && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCheck className="w-3 h-3" /> All 10 Submitted
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {st.submissions.map((sub, sIdx) => {
                              const matchFile = (sub.file_name || '').match(/Exp_(\d+)/i);
                              const expNum = matchFile ? matchFile[1] : (sIdx + 1);
                              return (
                                <a
                                  key={sub.id || sIdx}
                                  href={sub.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                                    sub.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                      : sub.status === 'not_approved'
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                                      : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200'
                                  }`}
                                  title={`View Ex. ${expNum}: ${sub.experiment_name || sub.experiment_id} — Status: ${
                                    sub.status === 'approved'
                                      ? 'Approved ✅'
                                      : sub.status === 'not_approved'
                                      ? 'Not Approved ⚠️'
                                      : 'Pending Review'
                                  }`}
                                >
                                  <span>Ex.{expNum}</span>
                                  {sub.status === 'approved' && <span className="text-[9px] text-emerald-600">✓</span>}
                                  {sub.status === 'not_approved' && <span className="text-[9px] text-amber-600">⚠️</span>}
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleCombinePdfs(st)}
                            disabled={mergingRegNo !== null}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                              st.isFullyComplete
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                            title={
                              st.isFullyComplete
                                ? 'Combine and download complete 10-in-1 record PDF'
                                : `Combine and download all ${st.completedCount} submitted experiment PDFs`
                            }
                          >
                            {mergingRegNo === st.registerNumber ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span className="font-mono text-[11px]">{mergeStatus || 'Merging...'}</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>
                                  {st.isFullyComplete
                                    ? 'Combine 10-in-1 PDF'
                                    : `Combine (${st.completedCount} in 1)`}
                                </span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECYCLE BIN (DELETED REPORTS SPACE) */}
        {activeTab === 'recycle_bin' && (
          <div>
            {/* Informational Guidance & Empty Bin Toolbar */}
            <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Recycle Bin Storage:</strong> Deleted student PDFs are safely preserved here. You can open and view them, <strong>Restore</strong> them to the active table, or choose <strong>Delete Permanently</strong>.
                </span>
              </div>
              {filteredRecycleBin.length > 0 && (
                <button
                  type="button"
                  onClick={handleEmptyRecycleBin}
                  disabled={isEmptyingTrash}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Permanently remove all deleted reports in recycle bin"
                >
                  {isEmptyingTrash ? 'Emptying...' : 'Empty Recycle Bin'}
                </button>
              )}
            </div>

            {filteredRecycleBin.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Trash2 className="w-8 h-8 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">Recycle Bin is Empty</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchTerm
                    ? 'No deleted reports match your search query.'
                    : 'No deleted submissions in the Recycle Bin. When you delete a report from the active list, it is preserved here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-rose-50/50 border-b border-slate-200 text-slate-600 font-mono font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Register Number</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Experiment</th>
                      <th className="py-3.5 px-4">Deleted On</th>
                      <th className="py-3.5 px-4 text-right">Recycle Bin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredRecycleBin.map((sub, idx) => (
                      <tr key={sub.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-violet-900">
                          {sub.register_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {sub.student_name}
                          {sub.student_email && (
                            <span className="block text-[10px] font-mono text-slate-400">
                              {sub.student_email}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium text-[11px]">
                            {sub.experiment_name || sub.experiment_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {sub.deleted_at
                            ? new Date(sub.deleted_at).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })
                            : 'Recently'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {/* 1. View PDF */}
                            {sub.pdf_url ? (
                              <a
                                href={sub.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-xs transition-colors"
                                title="View student submitted lab report PDF"
                              >
                                <span>View PDF</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">No PDF</span>
                            )}

                            {/* 2. Restore Button */}
                            <button
                              type="button"
                              onClick={() => handleRestore(sub)}
                              disabled={isRestoringId === sub.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors cursor-pointer border border-emerald-200 disabled:opacity-50"
                              title="Restore this submission back to active table"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{isRestoringId === sub.id ? 'Restoring...' : 'Restore'}</span>
                            </button>

                            {/* 3. Delete Permanently Button (With Pop-up Confirmation) */}
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(sub)}
                              disabled={isPermanentDeletingId === sub.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer border border-rose-200 disabled:opacity-50"
                              title="Permanently delete this report from database and cloud storage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isPermanentDeletingId === sub.id ? 'Deleting...' : 'Delete Permanently'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 6. MODAL: Mark as Not Approved & Send Automated Email */}
      {notApprovedModalSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-300 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Mark Experiment as Not Approved
                  </h3>
                  <p className="text-xs text-amber-900 font-medium">
                    Automated background email will be dispatched to the student
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotApprovedModalSub(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Student Info Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-medium block">Student Name:</span>
                    <strong className="text-slate-900 font-bold">{notApprovedModalSub.student_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Register Number:</span>
                    <strong className="text-violet-900 font-mono font-bold">{notApprovedModalSub.register_number}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-500 font-medium block">Experiment Module:</span>
                    <strong className="text-slate-800">{notApprovedModalSub.experiment_name || notApprovedModalSub.experiment_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Recipient College Email:</span>
                    <span className="text-violet-700 font-mono font-bold break-all">
                      {notApprovedModalSub.student_email || `${String(notApprovedModalSub.register_number).toLowerCase().trim()}@rajalakshmi.edu.in`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Remarks Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Faculty Remarks / Corrections Required (Included in Email):
                </label>
                <textarea
                  rows={4}
                  value={facultyRemarksInput}
                  onChange={(e) => setFacultyRemarksInput(e.target.value)}
                  placeholder="Specify what corrections the student needs to make (e.g. Incomplete observations, recalculate friction factor, redo graph)..."
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs font-sans text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* Automated Background Dispatch Notice */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block font-bold">Automated Email Notification:</strong>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Clicking the button below will immediately update the submission status to <strong>Not Approved (Yellow)</strong> and deliver an automated notification email directly to the student requesting them to meet faculty.
                  </p>
                </div>
              </div>

              {/* Email Sent Confirmation */}
              {emailDispatchStatus && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-start gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <span>{emailDispatchStatus}</span>
                    {emailSentInfo?.gmailComposeUrl && (
                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={emailSentInfo.gmailComposeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Open in College Gmail ↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setNotApprovedModalSub(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {emailDispatchStatus ? 'Close' : 'Cancel'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmNotApproved}
                  disabled={isSendingEmail || !facultyRemarksInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Email & Mark Not Approved</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: View Faculty Remarks for Not Approved Report */}
      {viewRemarksSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Faculty Review Remarks (Not Approved)</span>
              </h4>
              <button onClick={() => setViewRemarksSub(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div className="text-slate-500">
                Student: <strong className="text-slate-800">{viewRemarksSub.student_name}</strong> ({viewRemarksSub.register_number})
              </div>
              <div className="text-slate-500">
                Experiment: <strong className="text-slate-800">{viewRemarksSub.experiment_name || viewRemarksSub.experiment_id}</strong>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 font-sans leading-relaxed">
                "{viewRemarksSub.faculty_remarks || 'Corrections required. Please meet faculty in the laboratory.'}"
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewRemarksSub(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

