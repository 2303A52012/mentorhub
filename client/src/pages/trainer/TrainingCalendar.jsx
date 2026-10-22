import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Tag,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderGit2,
  User,
  Sparkles,
  Layers,
  FileText,
  Clock,
  Info,
  Code2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TrainingCalendar = () => {
  const { user } = useAuth();
  const role = user?.role || 'MENTEE';
  const canManage = role === 'ADMIN' || role === 'TRAINER';

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);

  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Date Modal State
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalBatchId, setModalBatchId] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Form State for editing / logging session
  const [form, setForm] = useState({
    topicInput: '',
    topicsTaught: [],
    problemInput: '',
    problemsSolved: [],
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch Batches based on User Role
  useEffect(() => {
    const fetchBatches = async () => {
      setBatchesLoading(true);
      try {
        if (role === 'TRAINER') {
          try {
            const res = await api.get('/trainer/profile');
            const tb = res.data.trainer?.trainerBatches || [];
            const bList = tb.map((t) => t.batch).filter(Boolean);
            setBatches(bList);
            if (bList.length > 0 && selectedBatch === 'ALL') {
              // Keep 'ALL' or set default
              setSelectedBatch('ALL');
            }
          } catch {
            const res = await api.get('/batches');
            const bList = res.data.batches || res.data || [];
            setBatches(bList);
          }
        } else {
          const res = await api.get('/batches');
          const bList = res.data.batches || res.data || [];
          setBatches(bList);
        }
      } catch (err) {
        console.error('Failed to fetch batches for calendar:', err);
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchBatches();
  }, [role]);

  // 2. Fetch Sessions for selected month & batch
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const month = viewDate.getMonth() + 1;
      const year = viewDate.getFullYear();
      let url = `/trainer/sessions?month=${month}&year=${year}`;
      if (selectedBatch && selectedBatch !== 'ALL') {
        url += `&batchId=${selectedBatch}`;
      }
      const res = await api.get(url);
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to load training sessions:', err);
      showToast('Failed to load training sessions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, viewDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Group sessions by date string key: 'YYYY-MM-DD' or date.toDateString()
  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = new Date(s.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  // Active session for modal based on selectedDate and modalBatchId
  const activeSessionForModal = useMemo(() => {
    if (!selectedDate || !modalBatchId) return null;
    const key = selectedDate.toDateString();
    const daySessions = sessionsByDate[key] || [];
    return (
      daySessions.find(
        (s) => s.batchId === modalBatchId || s.batch?.id === modalBatchId
      ) || null
    );
  }, [selectedDate, modalBatchId, sessionsByDate]);

  // Sync form when activeSessionForModal changes or editing begins
  useEffect(() => {
    if (activeSessionForModal) {
      setForm({
        topicInput: '',
        topicsTaught: activeSessionForModal.topicsTaught || [],
        problemInput: '',
        problemsSolved: activeSessionForModal.problemsSolved || [],
        notes: activeSessionForModal.notes || ''
      });
    } else {
      setForm({
        topicInput: '',
        topicsTaught: [],
        problemInput: '',
        problemsSolved: [],
        notes: ''
      });
    }
  }, [activeSessionForModal, isEditing]);

  // Calendar Math
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  // Summary Metrics
  const totalTopicsTaught = useMemo(() => {
    const set = new Set();
    sessions.forEach((s) => {
      if (Array.isArray(s.topicsTaught)) {
        s.topicsTaught.forEach((t) => set.add(t.toLowerCase().trim()));
      }
    });
    return set.size;
  }, [sessions]);

  const totalProblemsSolved = useMemo(() => {
    let count = 0;
    sessions.forEach((s) => {
      if (Array.isArray(s.problemsSolved)) {
        count += s.problemsSolved.length;
      }
    });
    return count;
  }, [sessions]);

  // Handle Day Click: Opens Date Modal with batch selector
  const handleDayClick = (day) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const key = date.toDateString();
    const daySessions = sessionsByDate[key] || [];

    setSelectedDate(date);

    // Pick sensible default batch for the modal
    let initialBatchId = '';
    if (selectedBatch && selectedBatch !== 'ALL') {
      initialBatchId = selectedBatch;
    } else if (daySessions.length > 0) {
      initialBatchId = daySessions[0].batchId || daySessions[0].batch?.id;
    } else if (batches.length > 0) {
      initialBatchId = batches[0].id || batches[0]._id;
    }

    setModalBatchId(initialBatchId);
    setIsEditing(false);
    setShowDateModal(true);
  };

  // Add / Remove Topic from form
  const addTopic = () => {
    const t = form.topicInput.trim();
    if (t && !form.topicsTaught.includes(t)) {
      setForm((f) => ({ ...f, topicsTaught: [...f.topicsTaught, t], topicInput: '' }));
    }
  };

  const removeTopic = (topicToRemove) => {
    setForm((f) => ({
      ...f,
      topicsTaught: f.topicsTaught.filter((x) => x !== topicToRemove)
    }));
  };

  // Add / Remove Problem from form
  const addProblem = () => {
    const p = form.problemInput.trim();
    if (p && !form.problemsSolved.includes(p)) {
      setForm((f) => ({ ...f, problemsSolved: [...f.problemsSolved, p], problemInput: '' }));
    }
  };

  const removeProblem = (probToRemove) => {
    setForm((f) => ({
      ...f,
      problemsSolved: f.problemsSolved.filter((x) => x !== probToRemove)
    }));
  };

  // Submit Session (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modalBatchId) {
      showToast('Please select a target batch for this session.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (activeSessionForModal) {
        await api.patch(`/trainer/sessions/${activeSessionForModal.id}`, {
          topicsTaught: form.topicsTaught,
          problemsSolved: form.problemsSolved,
          notes: form.notes
        });
        showToast('Training session updated successfully!');
      } else {
        await api.post('/trainer/sessions', {
          batchId: modalBatchId,
          date: selectedDate.toISOString(),
          topicsTaught: form.topicsTaught,
          problemsSolved: form.problemsSolved,
          notes: form.notes
        });
        showToast('Training session recorded successfully!');
      }
      await fetchSessions();
      setIsEditing(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save training session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Session
  const handleDelete = async () => {
    if (!activeSessionForModal) return;
    if (!window.confirm('Are you sure you want to delete this recorded session?')) return;

    try {
      await api.delete(`/trainer/sessions/${activeSessionForModal.id}`);
      await fetchSessions();
      setIsEditing(false);
      showToast('Session removed from calendar.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete session.', 'error');
    }
  };

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const jumpToday = () => setViewDate(new Date());

  const activeBatchObj = batches.find((b) => (b.id || b._id) === selectedBatch);
  const activeModalBatchObj = batches.find((b) => (b.id || b._id) === modalBatchId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6 transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Training Calendar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Technical training schedule &middot; Tap any training day to inspect covered topics and problems solved per batch.
              </p>
            </div>
          </div>
        </div>

        {/* Global Batch Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Cohort Filter:
            </span>
            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={batchesLoading}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="ALL">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.name} {b.academicYear ? `(${b.academicYear})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            title="Refresh Training Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recorded Sessions</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{sessions.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Distinct Topics</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{totalTopicsTaught}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Problems Solved</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{totalProblemsSolved}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mode</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {canManage ? 'Read & Record' : 'View Only'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={jumpToday}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 transition"
            >
              Today
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-center">
          {DAYS.map((d, index) => (
            <div
              key={d}
              className={`py-2.5 text-xs font-bold uppercase tracking-wider ${
                index === 0 || index === 6
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading training calendar…</p>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="border-b border-r border-slate-100 dark:border-slate-800/60 min-h-[90px] md:min-h-[105px] bg-slate-50/40 dark:bg-slate-950/30"
              />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const key = date.toDateString();
              const sessionsOnDate = sessionsByDate[key] || [];
              const isToday = key === today.toDateString();
              const hasTraining = sessionsOnDate.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`border-b border-r border-slate-100 dark:border-slate-800/60 min-h-[90px] md:min-h-[105px] p-2 transition group flex flex-col justify-between cursor-pointer hover:bg-purple-50/40 dark:hover:bg-purple-950/20 ${
                    hasTraining
                      ? 'bg-purple-50/20 dark:bg-purple-950/10'
                      : ''
                  } ${
                    isToday
                      ? 'ring-2 ring-inset ring-purple-500/60 bg-purple-50/40 dark:bg-purple-950/30'
                      : ''
                  }`}
                >
                  <div>
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {day}
                      </span>

                      {/* Small badge if today */}
                      {isToday && (
                        <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Masked Training Day Indicator (NO TOPIC PILLS IN CELL) */}
                    {hasTraining ? (
                      <div className="mt-1 space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-500/15 to-indigo-500/15 dark:from-purple-500/25 dark:to-indigo-500/25 border border-purple-200 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 text-[10px] font-bold shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 shrink-0" />
                          <span>Training Day</span>
                        </div>
                        {selectedBatch === 'ALL' && sessionsOnDate.length > 1 && (
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium px-1">
                            {sessionsOnDate.length} batches
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Subtle click cue */}
                  <div className="opacity-0 group-hover:opacity-100 transition text-[9px] text-purple-600 dark:text-purple-400 font-semibold text-right">
                    View &rarr;
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-600" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-500/20 border border-purple-500/40" /> Masked Training Day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-slate-800" /> Non-training Day
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5" /> Tap any date to view topics covered and problems solved per batch.
          </div>
        </div>
      </div>

      {/* ==================== TRAINING DAY DETAILS MODAL ==================== */}
      {showDateModal && selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-indigo-500/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Training Session Log
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedDate.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Batch Dropdown Picker (User requirement) */}
              <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/30 p-4 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center justify-between">
                  <span>Select Cohort Batch</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                    Switch batch to view or log specific topics &amp; problems
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={modalBatchId}
                    onChange={(e) => {
                      setModalBatchId(e.target.value);
                      setIsEditing(false);
                    }}
                    className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-8 py-2.5 text-xs font-bold text-slate-900 dark:text-white shadow-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {batches.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.name} {b.academicYear ? `· Class of ${b.academicYear}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* View Mode vs Edit Mode */}
              {!isEditing ? (
                <div className="space-y-5">
                  {/* Cohort & Trainer Info Strip */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Cohort Batch
                      </span>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5 truncate">
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{activeModalBatchObj?.name || 'Batch'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Trainer
                      </span>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5 truncate">
                        <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">
                          {activeSessionForModal?.trainer?.name || 'Assigned Trainer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1. Topics Covered on that Day */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-500" /> Topics Covered on this Day
                    </label>
                    {activeSessionForModal?.topicsTaught && activeSessionForModal.topicsTaught.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {activeSessionForModal.topicsTaught.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 italic">
                        No topics recorded for this batch on this date.
                      </div>
                    )}
                  </div>

                  {/* 2. Problems Solved on that Day (User requirement) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-500" /> Problems Solved on this Day
                    </label>
                    {activeSessionForModal?.problemsSolved && activeSessionForModal.problemsSolved.length > 0 ? (
                      <div className="space-y-2">
                        {activeSessionForModal.problemsSolved.map((prob, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                #{i + 1}
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {prob}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                              Solved in Class
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 italic">
                        No problems recorded for this batch on this date.
                      </div>
                    )}
                  </div>

                  {/* 3. Session Notes & Key Remarks */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-500" /> Session Notes &amp; Key Insights
                    </label>
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {activeSessionForModal?.notes ? (
                        activeSessionForModal.notes
                      ) : (
                        <span className="text-slate-400 italic">No additional session notes for this batch.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ==================== EDIT / RECORD SESSION FORM ==================== */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Topics Taught Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Add Topics Covered (Press Enter or click Add)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={form.topicInput}
                        onChange={(e) => setForm((f) => ({ ...f, topicInput: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTopic();
                          }
                        }}
                        placeholder="e.g. Dynamic Programming, Two Pointers, Trie, Sliding Window…"
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={addTopic}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>

                    {form.topicsTaught.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {form.topicsTaught.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-medium"
                          >
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() => removeTopic(t)}
                              className="text-purple-500 hover:text-purple-800 dark:hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Problems Solved Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Add Problems Solved (e.g. LeetCode 1: Two Sum)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={form.problemInput}
                        onChange={(e) => setForm((f) => ({ ...f, problemInput: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addProblem();
                          }
                        }}
                        placeholder="e.g. LeetCode 33: Search in Rotated Sorted Array"
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={addProblem}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>

                    {form.problemsSolved.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {form.problemsSolved.map((prob, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-medium"
                          >
                            <Code2 className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>{prob}</span>
                            <button
                              type="button"
                              onClick={() => removeProblem(prob)}
                              className="text-indigo-500 hover:text-indigo-800 dark:hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes / Remarks */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Session Notes &amp; Key Insights
                    </label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Add key insights, homework recommendations, or lecture links…"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    {activeSessionForModal && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition flex items-center gap-1 border border-rose-200 dark:border-rose-900/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Session
                      </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 disabled:opacity-50"
                      >
                        {submitting ? 'Saving…' : 'Save Session'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer Controls */}
            {!isEditing && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 shadow-sm shadow-purple-600/20"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {activeSessionForModal ? 'Edit Topics & Problems' : 'Log Session for this Batch'}
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowDateModal(false);
                    setIsEditing(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
