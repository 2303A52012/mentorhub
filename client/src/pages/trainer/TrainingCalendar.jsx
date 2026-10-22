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
  Info
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
  const [selectedBatch, setSelectedBatch] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);

  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // Form State
  const [form, setForm] = useState({ topicInput: '', topicsTaught: [], notes: '', batchId: '' });
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
          // Fetch trainer's assigned batches
          try {
            const res = await api.get('/trainer/profile');
            const tb = res.data.trainer?.trainerBatches || [];
            const bList = tb.map((t) => t.batch).filter(Boolean);
            setBatches(bList);
            if (bList.length > 0 && !selectedBatch) {
              setSelectedBatch(bList[0].id || bList[0]._id);
            }
          } catch {
            // Fallback to /batches
            const res = await api.get('/batches');
            const bList = res.data.batches || res.data || [];
            setBatches(bList);
            if (bList.length > 0 && !selectedBatch) {
              setSelectedBatch(bList[0].id || bList[0]._id);
            }
          }
        } else {
          // Admin, Mentor, Mentee
          const res = await api.get('/batches');
          const bList = res.data.batches || res.data || [];
          setBatches(bList);
          if (bList.length > 0 && !selectedBatch) {
            // Admin defaults to 'ALL', Mentor/Mentee defaults to their first batch
            setSelectedBatch(role === 'ADMIN' ? 'ALL' : (bList[0].id || bList[0]._id));
          }
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

  // Map sessions by date string: 'YYYY-MM-DD' or date.toDateString()
  const sessionMap = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = new Date(s.date).toDateString();
      map[key] = s;
    });
    return map;
  }, [sessions]);

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

  // Handle Day Click
  const handleDayClick = (day) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const key = date.toDateString();
    const existing = sessionMap[key];

    setSelectedDate(date);
    setActiveSession(existing || null);

    if (canManage) {
      if (existing) {
        setForm({
          topicInput: '',
          topicsTaught: existing.topicsTaught || [],
          notes: existing.notes || '',
          batchId: existing.batchId || selectedBatch || (batches[0]?.id || '')
        });
      } else {
        setForm({
          topicInput: '',
          topicsTaught: [],
          notes: '',
          batchId: selectedBatch && selectedBatch !== 'ALL' ? selectedBatch : (batches[0]?.id || '')
        });
      }
      setShowEditModal(true);
    } else {
      // Read-only user (Mentee or Mentor)
      if (existing) {
        setShowViewModal(true);
      }
    }
  };

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

  // Submit Session
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.batchId && (!selectedBatch || selectedBatch === 'ALL')) {
      showToast('Please select a specific batch for this session.', 'error');
      return;
    }
    const targetBatch = form.batchId || selectedBatch;

    setSubmitting(true);
    try {
      if (activeSession) {
        await api.patch(`/trainer/sessions/${activeSession.id}`, {
          topicsTaught: form.topicsTaught,
          notes: form.notes
        });
        showToast('Training session updated successfully!');
      } else {
        await api.post('/trainer/sessions', {
          batchId: targetBatch,
          date: selectedDate.toISOString(),
          topicsTaught: form.topicsTaught,
          notes: form.notes
        });
        showToast('Training session recorded successfully!');
      }
      await fetchSessions();
      setShowEditModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save training session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Session
  const handleDelete = async () => {
    if (!activeSession) return;
    if (!window.confirm('Are you sure you want to delete this recorded session?')) return;

    try {
      await api.delete(`/trainer/sessions/${activeSession.id}`);
      await fetchSessions();
      setShowEditModal(false);
      showToast('Session removed from calendar.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete session.', 'error');
    }
  };

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const jumpToday = () => setViewDate(new Date());

  const activeBatchObj = batches.find((b) => (b.id || b._id) === selectedBatch);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6 transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold shadow-2xl border flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Training Calendar
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                {role === 'TRAINER'
                  ? 'Trainer Desk'
                  : role === 'ADMIN'
                  ? 'Admin Oversight'
                  : role === 'MENTOR'
                  ? 'Mentor View'
                  : 'Student Roster'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {canManage
                ? 'Record, track, and update topics taught across university cohort batches.'
                : 'View daily topics covered, syllabus progression, and trainer session notes.'}
            </p>
          </div>
        </div>

        {/* Batch Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {batches.length > 0 ? (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <FolderGit2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {role === 'ADMIN' && <option value="ALL">All Cohort Batches</option>}
                {batches.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id} className="dark:bg-slate-900">
                    {b.name} {b.academicYear ? `(${b.academicYear})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : !batchesLoading ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">No batches assigned</span>
          ) : null}

          <button
            onClick={fetchSessions}
            title="Refresh schedule"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sessions (Month)</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{sessions.length}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Topics Covered</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{totalTopicsTaught}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Batch</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {selectedBatch === 'ALL' ? 'All Batches' : activeBatchObj?.name || 'Assigned Batch'}
            </div>
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
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading training syllabus records…</p>
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
              const session = sessionMap[key];
              const isToday = key === today.toDateString();
              const isFuture = date > today;

              const isClickable = canManage ? !isFuture : Boolean(session);

              return (
                <div
                  key={day}
                  onClick={() => isClickable && handleDayClick(day)}
                  className={`border-b border-r border-slate-100 dark:border-slate-800/60 min-h-[90px] md:min-h-[105px] p-1.5 md:p-2 transition group flex flex-col justify-between ${
                    isFuture
                      ? 'bg-slate-50/20 dark:bg-slate-950/20 opacity-50 cursor-default'
                      : isClickable
                      ? 'cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
                      : 'cursor-default'
                  } ${
                    isToday
                      ? 'ring-2 ring-inset ring-purple-500/60 bg-purple-50/30 dark:bg-purple-950/20'
                      : ''
                  }`}
                >
                  <div>
                    {/* Date Number */}
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
                      {session && session.trainer?.name && (
                        <span className="hidden md:inline text-[9px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.2 rounded truncate max-w-[80px]">
                          {session.trainer.name.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    {/* Recorded Session Pill */}
                    {session ? (
                      <div className="space-y-1">
                        {session.topicsTaught?.slice(0, 2).map((topic, idx) => (
                          <div
                            key={idx}
                            title={topic}
                            className="text-[10px] font-medium bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded-md px-1.5 py-0.5 truncate flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span className="truncate">{topic}</span>
                          </div>
                        ))}
                        {session.topicsTaught?.length > 2 && (
                          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold px-1">
                            +{session.topicsTaught.length - 2} more topics
                          </div>
                        )}
                        {session.notes && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 italic truncate px-1">
                            <FileText className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{session.notes}</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Empty Slot prompt for trainers/admins */}
                  {!session && !isFuture && canManage && (
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center justify-center py-1">
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Add
                      </span>
                    </div>
                  )}

                  {!session && !isFuture && !canManage && (
                    <div className="text-[10px] text-slate-300 dark:text-slate-700 italic select-none">
                      -
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-600" /> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-500/20 border border-purple-500/40" /> Topics Recorded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-100 dark:bg-slate-800" /> No Session
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5" />
            {canManage
              ? 'Click on any past or present date to log or modify sessions'
              : 'Click on any session card to inspect complete syllabus details and trainer notes'}
          </div>
        </div>
      </div>

      {/* ==================== VIEW SESSION MODAL (READ-ONLY FOR MENTEES / MENTORS) ==================== */}
      {showViewModal && activeSession && selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Session Syllabus Details
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
                onClick={() => setShowViewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Batch & Trainer info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cohort Batch</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                    {activeSession.batch?.name || 'Cohort Batch'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trainer</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-purple-500" />
                    {activeSession.trainer?.name || 'Corporate Trainer'}
                  </div>
                </div>
              </div>

              {/* Topics Taught */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-500" /> Topics Covered in this Session
                </label>
                {activeSession.topicsTaught && activeSession.topicsTaught.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeSession.topicsTaught.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-semibold shadow-xs"
                      >
                        <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific topic tags recorded.</p>
                )}
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" /> Trainer Session Notes & Remarks
                </label>
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {activeSession.notes ? (
                    activeSession.notes
                  ) : (
                    <span className="text-slate-400 italic">No additional trainer notes for this session.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RECORD / UPDATE SESSION MODAL (FOR TRAINERS & ADMINS) ==================== */}
      {showEditModal && selectedDate && canManage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  {activeSession ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {activeSession ? 'Update Training Session' : 'Record Training Session'}
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
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Batch Selector if creating session */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Target Cohort Batch
                </label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-semibold"
                >
                  {batches.map((b) => (
                    <option key={b.id || b._id} value={b.id || b._id}>
                      {b.name} {b.academicYear ? `(${b.academicYear})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topics Taught Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Topics Taught (Press Enter or Click +)
                </label>
                <div className="flex gap-2 mb-2.5">
                  <input
                    value={form.topicInput}
                    onChange={(e) => setForm((f) => ({ ...f, topicInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTopic();
                      }
                    }}
                    placeholder="e.g. Dynamic Programming, SQL Joins, System Design…"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={addTopic}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center gap-1 shadow-md shadow-purple-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {form.topicsTaught.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {form.topicsTaught.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTopic(t)}
                          className="text-purple-400 hover:text-rose-500 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    Add at least one topic covered during this session.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Session Notes & Remarks (Optional)
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Highlights, problems discussed, practice problems assigned, etc…"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                {activeSession && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-50 shadow-md shadow-purple-600/20"
                  >
                    {submitting ? 'Saving…' : activeSession ? 'Update Session' : 'Save Session'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
