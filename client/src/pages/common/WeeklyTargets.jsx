import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import {
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Calendar,
  Zap,
  TrendingUp,
  Settings,
  Search,
  Filter,
  Check,
  RefreshCw,
  Plus,
  Minus,
  Edit3,
  Award,
  ChevronRight,
  Info,
  Users,
  ExternalLink,
  Save,
  X
} from 'lucide-react';

const DEFAULT_SCHEDULE = [
  { weekNo: 1, startDate: '05 Oct 2026', targetCount: 98, requirement: 'Senior Live Review Required' },
  { weekNo: 2, startDate: '12 Oct 2026', targetCount: 111, requirement: 'Senior Live Review Required' },
  { weekNo: 3, startDate: '19 Oct 2026', targetCount: 141, requirement: 'Senior Live Review Required' },
  { weekNo: 4, startDate: '26 Oct 2026', targetCount: 156, requirement: 'Senior Live Review Required' },
  { weekNo: 5, startDate: '02 Nov 2026', targetCount: 170, requirement: 'Senior Live Review Required' },
  { weekNo: 6, startDate: '09 Nov 2026', targetCount: 184, requirement: 'Senior Live Review Required' },
  { weekNo: 7, startDate: '16 Nov 2026', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 8, startDate: '23 Nov 2026', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 9, startDate: '30 Nov 2026', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 10, startDate: '07 Dec 2026', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 11, startDate: '14 Dec 2026', targetCount: 207, requirement: 'Senior Live Review Required' },
  { weekNo: 12, startDate: '21 Dec 2026', targetCount: 207, requirement: 'Senior Live Review Required' }
];

export const WeeklyTargets = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showToast } = useModal();
  const role = user?.role;
  const isStudent = role === 'MENTEE';
  const isMentorOrSenior = role === 'MENTOR';
  const isTrainerOrAdmin = role === 'TRAINER' || role === 'ADMIN';

  // State
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(3);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [studentProgress, setStudentProgress] = useState(null);
  const [leetcodeSolved, setLeetcodeSolved] = useState(0);

  // Reviewer / Audit state
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(3);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'MET' | 'BELOW' | 'PENDING'

  // Verification in-progress edits: { [studentId]: { count: number, notes: string } }
  const [verificationEdits, setVerificationEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

  // Batch Pacing Customization Modal (Trainer / Admin)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState([]);
  const [savingCustom, setSavingCustom] = useState(false);

  // Load Batches if Mentor/Trainer/Admin
  useEffect(() => {
    if (!isStudent) {
      const loadBatches = async () => {
        try {
          const res = await api.get('/batches');
          const bList = res.data.batches || [];
          setBatches(bList);
          if (bList.length > 0) {
            setSelectedBatch(bList[0]._id || bList[0].id);
          }
        } catch (err) {
          console.error('Failed to load batches:', err);
        }
      };
      loadBatches();
    }
  }, [isStudent]);

  // Load Target Schedule
  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const batchParam = selectedBatch ? `?batchId=${selectedBatch}` : '';
      const res = await api.get(`/weekly-targets/schedule${batchParam}`);
      if (res.data.success) {
        setSchedule(res.data.schedule || DEFAULT_SCHEDULE);
        if (res.data.activeWeek) {
          setActiveWeek(res.data.activeWeek);
          if (isStudent) setSelectedWeek(res.data.activeWeek);
        }
        if (res.data.studentData) {
          setStudentProgress(res.data.studentData.schedule);
          setLeetcodeSolved(res.data.studentData.codingProfile?.leetcodeSolved ?? 0);
        }
      }
    } catch (err) {
      console.error('Failed to load target schedule:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, isStudent]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Load Batch Audit Sheet when batch or week changes (for Mentor / Trainer / Admin)
  const loadBatchAudit = useCallback(async () => {
    if (isStudent || !selectedBatch) return;
    try {
      setAuditLoading(true);
      const res = await api.get(
        `/weekly-targets/batch/${selectedBatch}/audit?weekNo=${selectedWeek}`
      );
      if (res.data.success) {
        setAuditData(res.data);
        // Initialize verification edits with existing values or self-reported counts
        const initialEdits = {};
        (res.data.students || []).forEach((s) => {
          initialEdits[s.id] = {
            count: s.verified ? s.verifiedCount : s.selfReportedLeetCode,
            notes: s.notes || ''
          };
        });
        setVerificationEdits(initialEdits);
      }
    } catch (err) {
      console.error('Failed to load batch audit sheet:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [isStudent, selectedBatch, selectedWeek]);

  useEffect(() => {
    loadBatchAudit();
  }, [loadBatchAudit]);

  // Handle Quick LeetCode Counter update on student side
  const handleStudentCounterAdjust = async (delta) => {
    const newVal = Math.max(0, leetcodeSolved + delta);
    setLeetcodeSolved(newVal);
    try {
      const res = await api.patch('/weekly-targets/counters', {
        platform: 'leetcode',
        action: delta > 0 ? 'increment' : 'decrement',
        amount: Math.abs(delta)
      });
      if (res.data.success) {
        showToast(`LeetCode solved updated to ${newVal}! Synced to Weekly Cumulative Targets.`, 'success');
      }
    } catch (err) {
      setLeetcodeSolved(leetcodeSolved);
      showToast('Failed to update counter.', 'error');
    }
  };

  // Handle Senior Live Verification Submission
  const handleSaveVerification = async (student) => {
    const edit = verificationEdits[student.id];
    if (!edit) return;

    setSavingId(student.id);
    try {
      const res = await api.post('/weekly-targets/verify', {
        menteeId: student.id,
        weekNo: selectedWeek,
        verifiedCount: Number(edit.count) || 0,
        notes: edit.notes || ''
      });

      if (res.data.success) {
        const v = res.data.verification;
        showSuccess(
          'Verification Confirmed',
          v.targetMet
            ? `Target MET confirmed for ${student.name} (${v.verifiedCount} >= ${v.targetCount} problems)!`
            : `Verified count recorded for ${student.name} (${v.verifiedCount} / ${v.targetCount} problems).`
        );
        // Refresh audit table
        await loadBatchAudit();
      }
    } catch (err) {
      console.error('Verification save failed:', err);
      showError('Verification Failed', err.response?.data?.message || 'Could not save verification.');
    } finally {
      setSavingId(null);
    }
  };

  // Open Batch Pacing Customization Drawer
  const openCustomModal = () => {
    setCustomForm(
      schedule.map((s) => ({
        weekNo: s.weekNo,
        targetCount: s.targetCount,
        requirement: s.requirement || 'Senior Live Review Required'
      }))
    );
    setShowCustomModal(true);
  };

  const handleSaveCustomTargets = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setSavingCustom(true);
    try {
      const res = await api.patch(`/weekly-targets/batch/${selectedBatch}/custom`, {
        targets: customForm
      });
      if (res.data.success) {
        showSuccess('Targets Updated', 'Batch weekly targets updated successfully.');
        setShowCustomModal(false);
        loadSchedule();
        loadBatchAudit();
      }
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Failed to update custom targets.');
    } finally {
      setSavingCustom(false);
    }
  };

  // Filtered students for audit sheet
  const filteredStudents = useMemo(() => {
    if (!auditData?.students) return [];
    return auditData.students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === 'MET') return s.targetMet;
      if (filterTab === 'BELOW') return s.verified && !s.targetMet;
      if (filterTab === 'PENDING') return !s.verified;
      return true;
    });
  }, [auditData, searchQuery, filterTab]);

  const activeWeekDef = schedule.find((s) => s.weekNo === activeWeek) || schedule[0];
  const selectedWeekDef = schedule.find((s) => s.weekNo === selectedWeek) || schedule[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                Pillar 4: Weekly Cumulative Targets (W1–W12)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Live Senior Verification Engine
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              LeetCode Weekly Cumulative Target Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Ensures that student LeetCode metrics reflect authentic, mentor-verified work rather than unverified profile claims. Verified live during weekly 1-on-1 review syncs.
            </p>
          </div>

          {/* Quick Active Week KPI Card */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 min-w-[200px]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Current Active Week
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  Week {activeWeek}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Target: {activeWeekDef?.targetCount} solves
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                Starting {activeWeekDef?.startDate}
              </span>
            </div>

            {isTrainerOrAdmin && (
              <button
                onClick={openCustomModal}
                className="px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90 flex items-center gap-2 shadow-lg"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                Customize Batch Targets
              </button>
            )}
          </div>
        </div>

        {/* Strict Target Rule Callout Banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-slate-700 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white font-bold">Strict Target Rule: </strong>
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-900 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Target Met ⇔ Mentor Verified Count ≥ Week Cumulative Target
              </code>
              <span className="ml-2 text-slate-500 dark:text-slate-400">
                • Unverified LeetCode solves or self-reported submissions never satisfy the target.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STUDENT / MENTEE VIEW */}
      {/* ========================================================================= */}
      {isStudent && (
        <div className="space-y-6">
          {/* Student Status & Live Sync Widget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live LeetCode Counter Widget */}
            <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Self-Reported LeetCode Solves
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 font-bold text-amber-700 dark:text-amber-300">
                  Live Synced
                </span>
              </div>

              <div className="flex items-baseline gap-2 my-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {leetcodeSolved}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  problems solved
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Increment your solved count whenever you complete a problem. Changes automatically sync to your profile and review sheets.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStudentCounterAdjust(-1)}
                  disabled={leetcodeSolved <= 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-xs transition flex items-center gap-1 disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" /> -1
                </button>
                <button
                  onClick={() => handleStudentCounterAdjust(1)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1 shadow-md shadow-amber-500/30"
                >
                  <Plus className="w-3.5 h-3.5" /> +1 Solved
                </button>
                <button
                  onClick={() => handleStudentCounterAdjust(5)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Active Week Verification Status */}
            {(() => {
              const activeProg = studentProgress?.find((p) => p.weekNo === activeWeek);
              const isMet = activeProg?.targetMet;
              const isVerified = activeProg?.verified;
              const targetCount = activeProg?.targetCount || activeWeekDef?.targetCount;
              const verifiedCount = activeProg?.verifiedCount || 0;

              return (
                <div
                  className={`glass-panel p-5 rounded-2xl border ${
                    isMet
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isVerified
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : 'border-amber-500/40 bg-amber-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Week {activeWeek} Status
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isMet
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : isVerified
                          ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isMet ? 'TARGET MET' : isVerified ? 'BELOW TARGET' : 'PENDING REVIEW'}
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {isVerified ? verifiedCount : '—'}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        / {targetCount} verified problems
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isMet ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Verified by {activeProg?.verifier?.name || 'Senior Mentor'}. Target achieved!
                      </span>
                    ) : isVerified ? (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        Deficit of {targetCount - verifiedCount} problems. Review scheduled.
                      </span>
                    ) : (
                      <span>
                        Awaiting Senior live review during weekly 1-on-1 sync.
                      </span>
                    )}
                  </p>
                </div>
              );
            })()}

            {/* Verification Schedule Guidelines */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Senior Review Checklist
                </span>
                <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Open LeetCode profile during 1-on-1 sync
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Explain approach and time/space complexity
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Senior confirms and stamps verified count
                  </li>
                </ul>
              </div>
              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                12 Weeks Cumulative Target: 207 Problems
              </div>
            </div>
          </div>

          {/* 12-Week Interactive Schedule Cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              12-Week Cumulative Schedule &amp; Verification History
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {(studentProgress || schedule).map((weekItem) => {
                const isActive = weekItem.weekNo === activeWeek;
                const isMet = weekItem.targetMet;
                const isVerified = weekItem.verified;

                return (
                  <div
                    key={weekItem.weekNo}
                    className={`rounded-2xl p-4 border transition-all ${
                      isActive
                        ? 'border-amber-400 dark:border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
                        : isMet
                        ? 'border-emerald-300 dark:border-emerald-500/40 bg-white dark:bg-slate-900/60'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Week {weekItem.weekNo}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isMet
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : isVerified
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isMet ? 'TARGET MET' : isVerified ? 'BELOW TARGET' : 'PENDING'}
                      </span>
                    </div>

                    <div className="space-y-1 my-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Cumulative Target:</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {weekItem.targetCount} Problems
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Verified Count:</span>
                        <span
                          className={`font-semibold ${
                            isMet
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isVerified ? `${weekItem.verifiedCount} solved` : 'Not yet reviewed'}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-[11px] text-slate-400">
                        <span>Start Date:</span>
                        <span>{weekItem.startDate}</span>
                      </div>
                    </div>

                    {weekItem.notes && (
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-700/60">
                        "{weekItem.notes}"
                      </div>
                    )}

                    {weekItem.verifier && (
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Verified by: {weekItem.verifier.name}</span>
                        {weekItem.verifiedAt && (
                          <span>{new Date(weekItem.verifiedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEWER VIEW: SENIOR LIVE VERIFICATION AUDIT SHEET */}
      {/* (Mentors, Trainers, Admins) */}
      {/* ========================================================================= */}
      {!isStudent && (
        <div className="space-y-6">
          {/* Controls Bar: Batch Selector & Week Selector */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Batch Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Target Batch:
                </span>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {batches.map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      {b.name} ({b.code || `Cohort ${b.academicYear || 2027}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target info badge for selected week */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Week {selectedWeek} Target:</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold text-sm">
                  {auditData?.targetCount ?? selectedWeekDef?.targetCount} Problems
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (Starts {selectedWeekDef?.startDate})
                </span>
              </div>
            </div>

            {/* Week Selector Tabs (W1 to W12) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {schedule.map((w) => {
                const isCurrent = w.weekNo === activeWeek;
                const isSelected = w.weekNo === selectedWeek;
                return (
                  <button
                    key={w.weekNo}
                    onClick={() => setSelectedWeek(w.weekNo)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : isCurrent
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>W{w.weekNo}</span>
                    <span className="text-[10px] font-normal opacity-80">({w.targetCount}p)</span>
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batch Summary Metrics */}
          {auditData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Cohort Students</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {auditData.summary.totalStudents}
                </div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Target Met</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {auditData.summary.targetMetCount}
                  <span className="text-xs font-semibold text-slate-400 ml-1.5">
                    ({auditData.summary.totalStudents > 0 ? Math.round((auditData.summary.targetMetCount / auditData.summary.totalStudents) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5">
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Reviewed / Verified</span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {auditData.summary.verifiedCount}
                </div>
              </div>
              <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Pending Review</span>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {auditData.summary.pendingCount}
                </div>
              </div>
            </div>
          )}

          {/* Audit Sheet Table & Search */}
          <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
            {/* Filter and Search Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {['ALL', 'MET', 'BELOW', 'PENDING'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      filterTab === tab
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {tab === 'ALL'
                      ? 'All Students'
                      : tab === 'MET'
                      ? 'Target Met'
                      : tab === 'BELOW'
                      ? 'Below Target'
                      : 'Pending Review'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student, roll no..."
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 w-full sm:w-60"
                />
              </div>
            </div>

            {/* Table */}
            {auditLoading ? (
              <div className="py-20 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading student audit sheet for Week {selectedWeek}...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-xs text-slate-400">No students found matching this criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Self-Reported</th>
                      <th className="py-3 px-3">Target</th>
                      <th className="py-3 px-3 min-w-[130px]">Senior Verified Count</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 min-w-[180px]">Verification Notes</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredStudents.map((student) => {
                      const edit = verificationEdits[student.id] || { count: 0, notes: '' };
                      const targetCount = auditData?.targetCount ?? selectedWeekDef?.targetCount ?? 98;
                      const liveCount = Number(edit.count) || 0;
                      const liveTargetMet = liveCount >= targetCount;
                      const isSaving = savingId === student.id;

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
                        >
                          {/* Student Info */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {student.rollNumber || 'No Roll'} • Sec {student.section}
                            </div>
                          </td>

                          {/* Self-reported LeetCode */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {student.selfReportedLeetCode}
                            </span>
                          </td>

                          {/* Week Target */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-semibold text-slate-500">
                              {targetCount}
                            </span>
                          </td>

                          {/* Senior Verified Count Input */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={edit.count}
                                onChange={(e) =>
                                  setVerificationEdits((prev) => ({
                                    ...prev,
                                    [student.id]: {
                                      ...prev[student.id],
                                      count: e.target.value
                                    }
                                  }))
                                }
                                className={`w-20 bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none ${
                                  liveTargetMet
                                    ? 'border-emerald-400 focus:border-emerald-500'
                                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
                                }`}
                              />
                              <span className="text-[10px] text-slate-400">solves</span>
                            </div>
                          </td>

                          {/* Live Status Badge */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                liveTargetMet
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {liveTargetMet ? 'TARGET MET' : 'BELOW TARGET'}
                            </span>
                          </td>

                          {/* Verification Notes */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={edit.notes}
                              onChange={(e) =>
                                setVerificationEdits((prev) => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    notes: e.target.value
                                  }
                                }))
                              }
                              placeholder="Code authenticity check notes..."
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            />
                            {student.verifier && (
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                Confirmed by {student.verifier.name}
                              </div>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleSaveVerification(student)}
                              disabled={isSaving}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ml-auto shadow-xs ${
                                student.verified
                                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                              }`}
                            >
                              {isSaving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              <span>{student.verified ? 'Update' : 'Confirm & Save'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH TARGET CUSTOMIZATION MODAL (TRAINER / ADMIN) */}
      {/* ========================================================================= */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Customize Batch Targets Pacing
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adjust weekly target problems for fast-track or foundational cohorts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCustomTargets} className="p-5 overflow-y-auto space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customForm.map((item, idx) => (
                  <div
                    key={item.weekNo}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        Week {item.weekNo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Default: {DEFAULT_SCHEDULE[idx]?.targetCount} problems
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400">Target:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.targetCount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCustomForm((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, targetCount: val } : c))
                          );
                        }}
                        className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustom}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  {savingCustom ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Batch Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
