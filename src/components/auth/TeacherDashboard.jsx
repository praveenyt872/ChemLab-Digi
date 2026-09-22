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
  Trash2
} from 'lucide-react';
import {
  fetchSubmissions,
  fetchExperimentDeadline,
  fetchAllDeadlines,
  setExperimentDeadline,
  deleteSubmission
} from '../../utils/submissionService';

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

  // Deadline editing state
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [isSavingDeadline, setIsSavingDeadline] = useState(false);
  const [deadlineSuccessMsg, setDeadlineSuccessMsg] = useState('');

  // Delete state
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // Load Submissions & Deadlines from Supabase
  const loadData = async () => {
    setIsLoadingSubmissions(true);
    try {
      const [subs, dls] = await Promise.all([
        fetchSubmissions({ subjectId: 'fluid_mechanics' }),
        fetchAllDeadlines()
      ]);
      setSubmissions(subs || []);
      setDeadlines(dls || {});
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter submissions by selected experiment and search term
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

  // Handle deleting submission
  const handleDeleteSubmission = async (id, studentName, regNo, pdfUrl) => {
    if (!window.confirm(`Are you sure you want to delete the submission for ${studentName || 'this student'} (Reg: ${regNo})? This cannot be undone.`)) {
      return;
    }

    setIsDeletingId(id);
    const res = await deleteSubmission(id, pdfUrl);
    if (res.success) {
      setSubmissions(prev => prev.filter(s => s.id !== id));
      setDeleteSuccessMsg(`Submission record for ${regNo} deleted successfully.`);
      setTimeout(() => setDeleteSuccessMsg(''), 3500);
    } else {
      alert('Failed to delete submission: ' + (res.error || 'Unknown error'));
    }
    setIsDeletingId(null);
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

      {/* 5. Submissions Table (Sorted by Register Number Ascending) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Table Header & Search */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              <span>Student Submitted Lab Reports</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                {filteredSubmissions.length} records
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Arranged in ascending order by student register number. Click "View PDF" to open the generated lab report.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Name or Reg No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 shadow-xs"
            />
          </div>
        </div>

        {deleteSuccessMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deleteSuccessMsg}</span>
          </div>
        )}

        {/* Table Content */}
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
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-right">Report & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredSubmissions.map((sub, idx) => (
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
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {sub.pdf_url ? (
                          <a
                            href={sub.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-xs transition-colors"
                            title="View student submitted lab report PDF"
                          >
                            <span>View PDF</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">No PDF</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteSubmission(sub.id, sub.student_name, sub.register_number, sub.pdf_url)}
                          disabled={isDeletingId === sub.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer border border-rose-200 disabled:opacity-50"
                          title="Delete this submission record from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isDeletingId === sub.id ? 'Deleting...' : 'Delete'}</span>
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

    </div>
  );
}
