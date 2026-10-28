import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
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
  ChevronDown,
  Users,
  UserCheck,
  UserX,
  MessageSquare,
  CheckSquare,
  XCircle
} from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Standardized YYYY-MM-DD date key extractor
const getDateKey = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = new Date(dateVal);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const TrainingCalendar = () => {
  const { user } = useAuth();
  const { showConfirm, showToast: modalToast } = useModal();
  const role = user?.role || 'MENTEE';
  const isAdmin = role === 'ADMIN';
  const isTrainer = role === 'TRAINER';
  const isMentor = role === 'MENTOR';
  const isMentee = role === 'MENTEE';
  const canManage = role === 'ADMIN' || role === 'TRAINER';

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState('');

  // Admin Schedule Training Day Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(null);
  const [scheduleDateKey, setScheduleDateKey] = useState('');
  const [scheduleAllBatches, setScheduleAllBatches] = useState(true);
  const [selectedScheduleBatchIds, setSelectedScheduleBatchIds] = useState([]);
  const [scheduling, setScheduling] = useState(false);

  // Date Modal State
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalBatchId, setModalBatchId] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Two Tab Views: 'TRAINER' (Content & Problems) | 'MENTOR' (Mentor Interaction & Attendance)
  const [activeReportTab, setActiveReportTab] = useState('TRAINER');
  const [mentorReports, setMentorReports] = useState([]);
  const [loadingMentorReports, setLoadingMentorReports] = useState(false);

  // Full Mentor Report & Attendance Submodal
  const [showFullReportModal, setShowFullReportModal] = useState(false);
  const [activeMentorForDetail, setActiveMentorForDetail] = useState(null);
  const [fullReportData, setFullReportData] = useState(null);
  const [loadingFullReport, setLoadingFullReport] = useState(false);
  const [isEditingFullReport, setIsEditingFullReport] = useState(false);
  const [fullReportForm, setFullReportForm] = useState({
    generalNotes: '',
    records: []
  });
  const [submittingFullReport, setSubmittingFullReport] = useState(false);

  // Form State for editing / logging session (Trainer)
  const [form, setForm] = useState({
    topicInput: '',
    topicsTaught: [],
    problemInput: '',
    problemsSolved: [],
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [localToast, setLocalToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (modalToast) {
      modalToast(msg, type);
    } else {
      setLocalToast({ msg, type });
      setTimeout(() => setLocalToast(null), 3500);
    }
  }, [modalToast]);

  const todayKey = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

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
  }, [selectedBatch, viewDate, showToast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Group sessions by date string key: 'YYYY-MM-DD'
  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = getDateKey(s.date);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    });
    return map;
  }, [sessions]);

  // Active session for modal based on selectedDateKey and modalBatchId
  const activeSessionForModal = useMemo(() => {
    if (!selectedDateKey || !modalBatchId) return null;
    const daySessions = sessionsByDate[selectedDateKey] || [];
    return (
      daySessions.find(
        (s) => s.batchId === modalBatchId || s.batch?.id === modalBatchId
      ) || null
    );
  }, [selectedDateKey, modalBatchId, sessionsByDate]);

  // Ensure modalBatchId is populated when modal opens or batches load
  useEffect(() => {
    if (showDateModal && !modalBatchId && batches.length > 0) {
      setModalBatchId(batches[0].id || batches[0]._id);
    }
  }, [showDateModal, modalBatchId, batches]);

  // Only assigned TRAINER can edit trainer session content (Admin CANNOT write/edit trainer reports)
  const canEditTrainerSession = useMemo(() => {
    if (role === 'TRAINER') {
      return batches.some((b) => (b.id || b._id) === modalBatchId);
    }
    return false;
  }, [role, batches, modalBatchId]);

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


  // Open Schedule Training Day Modal for Admin
  const openScheduleModal = (date, dateKey) => {
    setScheduleDate(date);
    setScheduleDateKey(dateKey);
    setScheduleAllBatches(true);
    setSelectedScheduleBatchIds(batches.map((b) => b.id || b._id));
    setShowScheduleModal(true);
  };

  // Admin: Submit Schedule Training Day
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleAllBatches && selectedScheduleBatchIds.length === 0) {
      showToast('Please select at least one batch or choose All Batches.', 'error');
      return;
    }

    setScheduling(true);
    try {
      const res = await api.post('/trainer/sessions/schedule-day', {
        date: scheduleDateKey,
        allBatches: scheduleAllBatches,
        batchIds: scheduleAllBatches ? [] : selectedScheduleBatchIds
      });
      showToast(res.data.message || 'Marked as Training Day successfully!');
      setShowScheduleModal(false);
      await fetchSessions();

      // Open the date modal to view the newly scheduled training day
      const targetBatchId =
        selectedScheduleBatchIds[0] ||
        (batches.length > 0 ? batches[0].id || batches[0]._id : '');
      setModalBatchId(targetBatchId);
      setSelectedDate(scheduleDate);
      setSelectedDateKey(scheduleDateKey);
      setActiveReportTab('TRAINER');
      setShowDateModal(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule training day.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  // Admin: Remove scheduled training day for this batch
  const handleAdminUnscheduleBatch = async () => {
    if (!activeModalBatchObj) return;
    let confirmed = false;
    if (showConfirm) {
      confirmed = await showConfirm(
        'Delete Training Day for this Batch',
        `Are you sure you want to remove the scheduled training day for ${activeModalBatchObj.name} on ${selectedDateKey}?`,
        { confirmText: 'Delete Schedule', variant: 'danger' }
      );
    } else {
      confirmed = window.confirm(`Remove training day schedule for ${activeModalBatchObj.name}?`);
    }
    if (!confirmed) return;

    try {
      await api.delete(`/trainer/sessions/schedule-day?date=${selectedDateKey}&batchId=${modalBatchId}`);
      showToast(`Removed training day for ${activeModalBatchObj.name}.`);
      await fetchSessions();
      setShowDateModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove schedule.', 'error');
    }
  };

  // Admin: Remove scheduled training day for ALL batches on this date
  const handleAdminUnscheduleAll = async () => {
    let confirmed = false;
    if (showConfirm) {
      confirmed = await showConfirm(
        'Delete Training Day (All Batches)',
        `Are you sure you want to delete the scheduled training day for ALL batches on ${selectedDateKey}? This will unschedule the day completely.`,
        { confirmText: 'Delete for All Batches', variant: 'danger' }
      );
    } else {
      confirmed = window.confirm(`Delete scheduled training day for ALL batches on ${selectedDateKey}?`);
    }
    if (!confirmed) return;

    try {
      await api.delete(`/trainer/sessions/schedule-day?date=${selectedDateKey}&batchId=ALL`);
      showToast('Removed training day for all batches on this date.');
      await fetchSessions();
      setShowDateModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove schedule.', 'error');
    }
  };

  // Handle Day Click: Opens Schedule Modal (for Admin on empty days) or Date Modal
  const handleDayClick = (day) => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const date = new Date(y, m, day);
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySessions = sessionsByDate[dateKey] || [];

    setSelectedDate(date);
    setSelectedDateKey(dateKey);

    // If day has no training sessions:
    if (daySessions.length === 0) {
      if (role === 'ADMIN') {
        openScheduleModal(date, dateKey);
        return;
      } else {
        showToast('No training session scheduled on this date.', 'info');
        return;
      }
    }

    // Pick sensible default batch for the modal
    let initialBatchId = '';
    if (selectedBatch && selectedBatch !== 'ALL') {
      initialBatchId = selectedBatch;
    } else if (role === 'MENTOR' && batches.length > 0) {
      // For mentors, prioritize their own assigned batch
      const mentorBatchIds = new Set(batches.map((b) => b.id || b._id));
      const matchingSession = daySessions.find((s) => mentorBatchIds.has(s.batchId || s.batch?.id));
      initialBatchId = matchingSession
        ? (matchingSession.batchId || matchingSession.batch?.id)
        : (batches[0].id || batches[0]._id);
    } else if (daySessions.length > 0) {
      initialBatchId = daySessions[0].batchId || daySessions[0].batch?.id;
    } else if (batches.length > 0) {
      initialBatchId = batches[0].id || batches[0]._id;
    }

    setModalBatchId(initialBatchId);
    setIsEditing(false);
    if (role === 'TRAINER') {
      setActiveReportTab('TRAINER');
    } else if (role === 'MENTOR') {
      setActiveReportTab('MENTOR');
    } else {
      setActiveReportTab('TRAINER');
    }
    setShowDateModal(true);
  };

  // Fetch Mentor Reports for active modal batch & date (Admin view)
  const fetchMentorReports = useCallback(async (bId, dKey) => {
    if (!bId || !dKey) return;
    setLoadingMentorReports(true);
    try {
      const res = await api.get(`/trainer/sessions/mentor-reports?batchId=${bId}&date=${dKey}`);
      setMentorReports(res.data.reports || []);
    } catch (err) {
      console.error('Failed to load mentor reports:', err);
      setMentorReports([]);
    } finally {
      setLoadingMentorReports(false);
    }
  }, []);

  // Fetch my assigned mentees directly (Mentor view)
  const fetchMyMentorDetail = useCallback(async (bId, dKey) => {
    if (!bId || !dKey || !user?.id) return;
    setLoadingFullReport(true);
    try {
      const res = await api.get(
        `/trainer/sessions/mentor-reports/${user.id}/details?batchId=${bId}&date=${dKey}`
      );
      const data = res.data;
      setFullReportData(data);
      const initialRecords = (data.students || []).map((s) => ({
        menteeId: s.menteeId,
        name: s.name,
        rollNumber: s.rollNumber,
        branch: s.branch,
        section: s.section,
        status: s.status || 'PRESENT',
        comments: s.comments || ''
      }));
      setFullReportForm({
        generalNotes: data.report?.generalNotes || '',
        records: initialRecords
      });
      // If no report submitted yet, start directly in edit/mark mode
      setIsEditingFullReport(!data.report);
    } catch (err) {
      console.error('Failed to load mentor mentees:', err);
      setFullReportData(null);
      setFullReportForm({ generalNotes: '', records: [] });
    } finally {
      setLoadingFullReport(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (showDateModal && modalBatchId && selectedDateKey) {
      if (role === 'MENTOR') {
        fetchMyMentorDetail(modalBatchId, selectedDateKey);
      } else if (role === 'ADMIN') {
        fetchMentorReports(modalBatchId, selectedDateKey);
      }
    }
  }, [showDateModal, modalBatchId, selectedDateKey, role, fetchMyMentorDetail, fetchMentorReports]);

  // Open Full Mentor Report Submodal (Admin view)
  const openFullReport = async (mentorSummary, startInEdit = false) => {
    setActiveMentorForDetail(mentorSummary);
    setShowFullReportModal(true);
    setLoadingFullReport(true);
    setIsEditingFullReport(startInEdit);
    try {
      const res = await api.get(
        `/trainer/sessions/mentor-reports/${mentorSummary.mentorId}/details?batchId=${modalBatchId}&date=${selectedDateKey}`
      );
      const data = res.data;
      setFullReportData(data);
      const initialRecords = (data.students || []).map((s) => ({
        menteeId: s.menteeId,
        name: s.name,
        rollNumber: s.rollNumber,
        branch: s.branch,
        section: s.section,
        status: s.status || 'PRESENT',
        comments: s.comments || ''
      }));
      setFullReportForm({
        generalNotes: data.report?.generalNotes || '',
        records: initialRecords
      });
      if (!data.report && data.canEdit && role === 'MENTOR') {
        setIsEditingFullReport(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load mentor report details.', 'error');
      setShowFullReportModal(false);
    } finally {
      setLoadingFullReport(false);
    }
  };

  const handleFullReportSubmit = async (e) => {
    e.preventDefault();
    if (!fullReportForm.records || fullReportForm.records.length === 0) {
      showToast('No mentees found in this group to report.', 'error');
      return;
    }

    // Validate mandatory comments
    for (let i = 0; i < fullReportForm.records.length; i++) {
      const r = fullReportForm.records[i];
      if (!r.comments || !r.comments.trim()) {
        showToast(
          `Review/comments for ${r.name} (${r.rollNumber || `#${i + 1}`}) is mandatory.`,
          'error'
        );
        return;
      }
    }

    setSubmittingFullReport(true);
    try {
      await api.post('/trainer/sessions/mentor-reports', {
        batchId: modalBatchId,
        date: selectedDateKey,
        mentorId: activeMentorForDetail?.mentorId || user?.id,
        generalNotes: fullReportForm.generalNotes,
        records: fullReportForm.records.map((r) => ({
          menteeId: r.menteeId,
          status: r.status,
          comments: r.comments.trim()
        }))
      });
      showToast('Mentor attendance and student reviews submitted successfully!');
      if (role === 'MENTOR') {
        await fetchMyMentorDetail(modalBatchId, selectedDateKey);
      } else {
        await fetchMentorReports(modalBatchId, selectedDateKey);
        if (activeMentorForDetail) {
          const res = await api.get(
            `/trainer/sessions/mentor-reports/${activeMentorForDetail.mentorId}/details?batchId=${modalBatchId}&date=${selectedDateKey}`
          );
          setFullReportData(res.data);
        }
      }
      setIsEditingFullReport(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit mentor report.', 'error');
    } finally {
      setSubmittingFullReport(false);
    }
  };

  const updateStudentAttendance = (menteeId, status) => {
    setFullReportForm((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        r.menteeId === menteeId ? { ...r, status } : r
      )
    }));
  };

  const updateStudentComment = (menteeId, comments) => {
    setFullReportForm((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        r.menteeId === menteeId ? { ...r, comments } : r
      )
    }));
  };

  const markAllStudents = (status) => {
    setFullReportForm((prev) => ({
      ...prev,
      records: prev.records.map((r) => ({ ...r, status }))
    }));
  };

  // Add / Remove Topic from form (supports comma separated list)
  const addTopic = () => {
    const raw = form.topicInput.trim();
    if (!raw) return;
    const parts = raw.split(',').map((x) => x.trim()).filter(Boolean);
    setForm((f) => {
      const nextTopics = [...f.topicsTaught];
      parts.forEach((p) => {
        if (!nextTopics.includes(p)) nextTopics.push(p);
      });
      return { ...f, topicsTaught: nextTopics, topicInput: '' };
    });
  };

  const removeTopic = (topicToRemove) => {
    setForm((f) => ({
      ...f,
      topicsTaught: f.topicsTaught.filter((x) => x !== topicToRemove)
    }));
  };

  // Add / Remove Problem from form (supports comma or newline separation)
  const addProblem = () => {
    const raw = form.problemInput.trim();
    if (!raw) return;
    const parts = raw.split(/\r?\n|,/).map((x) => x.trim()).filter(Boolean);
    setForm((f) => {
      const nextProbs = [...f.problemsSolved];
      parts.forEach((p) => {
        if (!nextProbs.includes(p)) nextProbs.push(p);
      });
      return { ...f, problemsSolved: nextProbs, problemInput: '' };
    });
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
        const [y, m, d] = selectedDateKey.split('-');
        const dateIso = `${y}-${m}-${d}T12:00:00.000Z`;
        await api.post('/trainer/sessions', {
          batchId: modalBatchId,
          date: dateIso,
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
    let confirmed = false;
    if (showConfirm) {
      confirmed = await showConfirm(
        'Delete Training Session',
        'Are you sure you want to delete this recorded session? This will remove all logged topics and problems for this batch on this date.',
        { confirmText: 'Delete Session', variant: 'danger' }
      );
    } else {
      confirmed = window.confirm('Are you sure you want to delete this recorded session?');
    }
    if (!confirmed) return;

    try {
      await api.delete(`/trainer/sessions/${activeSessionForModal.id}`);
      await fetchSessions();
      setIsEditing(false);
      setShowDateModal(false);
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
      {/* Toast Notification fallback if modal context toast not rendered */}
      {localToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-in slide-in-from-bottom duration-200 ${
            localToast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {localToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{localToast.msg}</span>
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

          {role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                openScheduleModal(today, todayKey);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Mark Training Day</span>
            </button>
          )}

          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            title="Refresh Training Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
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
              const y = viewDate.getFullYear();
              const m = viewDate.getMonth();
              const cellKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const sessionsOnDate = sessionsByDate[cellKey] || [];
              const isToday = cellKey === todayKey;
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-indigo-500/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Training Session &amp; Mentor Reports
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
              {/* Batch Dropdown Picker */}
              <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/30 p-4 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center justify-between">
                  <span>Select Cohort Batch</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                    Switch batch to view trainer content or mentor attendance reports
                  </span>
                </label>
                {batches.length === 0 ? (
                  <div className="py-2 text-xs font-medium text-slate-500 italic">
                    No batches assigned or available for your account.
                  </div>
                ) : (
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
                )}
              </div>

              {/* Two Options / Reports Tab Switcher: Only shown if NOT Trainer! */}
              {role !== 'TRAINER' && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReportTab('TRAINER');
                      setIsEditing(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      activeReportTab === 'TRAINER'
                        ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Trainer's Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveReportTab('MENTOR');
                      setIsEditing(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      activeReportTab === 'MENTOR'
                        ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{role === 'MENTOR' ? "My Mentees' Report" : "Mentors' Report"}</span>
                    {role === 'ADMIN' && mentorReports.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                        {mentorReports.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 1: TRAINER'S REPORT */}
              {activeReportTab === 'TRAINER' && (
                <div>
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

                      {/* Topics Covered */}
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

                      {/* Problems Solved */}
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

                      {/* Session Notes */}
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
                    /* Trainer Edit Form */
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
              )}

              {/* TAB 2: MENTORS' REPORT (Mentor Interaction Section) */}
              {activeReportTab === 'MENTOR' && (
                <div className="space-y-4">
                  {role === 'MENTOR' ? (
                    /* ================= DIRECT MENTEE ATTENDANCE & REVIEW (FOR MENTOR) ================= */
                    <div className="space-y-4">
                      {/* Informational Banner Header with Status & Edit toggle */}
                      <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                My Assigned Mentees
                              </h4>
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-600 text-white shrink-0">
                                Your Group
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              Mark training day attendance and provide mandatory reviews/comments for each student in your group.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Status Badge */}
                          {fullReportData?.report ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Submitted</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span>Attendance Pending</span>
                            </div>
                          )}

                          {/* Edit button when already submitted and currently in view mode */}
                          {fullReportData?.report && !isEditingFullReport && (
                            <button
                              type="button"
                              onClick={() => setIsEditingFullReport(true)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1 shadow-xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* Refresh */}
                          <button
                            type="button"
                            onClick={() => fetchMyMentorDetail(modalBatchId, selectedDateKey)}
                            title="Refresh My Mentees"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingFullReport ? 'animate-spin text-purple-600' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Content Area */}
                      {loadingFullReport ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-slate-400">Loading your assigned mentees…</span>
                        </div>
                      ) : fullReportForm.records.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            No Mentees Assigned
                          </p>
                          <p className="text-[11px] text-slate-400">
                            You do not have any mentees assigned to you in this cohort batch.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Summary Metric Ribbon */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Total Mentees
                              </div>
                              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                {fullReportForm.records.length}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                Present
                              </div>
                              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {fullReportForm.records.filter((r) => r.status === 'PRESENT').length}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                Absent
                              </div>
                              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                                {fullReportForm.records.filter((r) => r.status === 'ABSENT').length}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                Attendance Rate
                              </div>
                              <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                                {fullReportForm.records.length > 0
                                  ? Math.round(
                                      (fullReportForm.records.filter((r) => r.status === 'PRESENT').length /
                                        fullReportForm.records.length) *
                                        100
                                    )
                                  : 0}
                                %
                              </div>
                            </div>
                          </div>

                          {/* Mode: EDITING / MARKING vs VIEWING SUBMITTED */}
                          {isEditingFullReport ? (
                            <form onSubmit={handleFullReportSubmit} className="space-y-4">
                              {/* Batch marking helpers */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/30">
                                <div className="text-xs text-purple-900 dark:text-purple-300 font-medium">
                                  <span className="font-bold">Mark Attendance &amp; Reviews:</span> Select Present/Absent and write mandatory feedback for each student.
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => markAllStudents('PRESENT')}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition flex items-center gap-1"
                                  >
                                    <UserCheck className="w-3 h-3" /> Mark All Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => markAllStudents('ABSENT')}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition flex items-center gap-1"
                                  >
                                    <UserX className="w-3 h-3" /> Mark All Absent
                                  </button>
                                </div>
                              </div>

                              {/* Students List for Attendance + Mandatory Comments */}
                              <div className="space-y-3">
                                {fullReportForm.records.map((student, idx) => (
                                  <div
                                    key={student.menteeId}
                                    className={`p-3.5 rounded-2xl border transition space-y-3 ${
                                      student.status === 'PRESENT'
                                        ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                        : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                                    }`}
                                  >
                                    {/* Student Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                            student.status === 'PRESENT'
                                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                          }`}
                                        >
                                          #{idx + 1}
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>{student.name}</span>
                                            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/40">
                                              {student.rollNumber || 'No Roll'}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                            {student.branch} &middot; Sec {student.section}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Attendance Status Toggle */}
                                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                                        <button
                                          type="button"
                                          onClick={() => updateStudentAttendance(student.menteeId, 'PRESENT')}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                            student.status === 'PRESENT'
                                              ? 'bg-emerald-600 text-white shadow-xs'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                          }`}
                                        >
                                          <UserCheck className="w-3.5 h-3.5" /> Present
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => updateStudentAttendance(student.menteeId, 'ABSENT')}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                            student.status === 'ABSENT'
                                              ? 'bg-rose-600 text-white shadow-xs'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                          }`}
                                        >
                                          <UserX className="w-3.5 h-3.5" /> Absent
                                        </button>
                                      </div>
                                    </div>

                                    {/* Mandatory Student Report / Comments Field */}
                                    <div>
                                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                          <MessageSquare className="w-3 h-3 text-purple-500" />
                                          <span>Student Review &amp; Remarks</span>
                                          <span className="text-rose-500 font-bold">* (Mandatory)</span>
                                        </span>
                                        {!student.comments?.trim() && (
                                          <span className="text-[10px] font-semibold text-rose-500 animate-pulse">
                                            Required before submit
                                          </span>
                                        )}
                                      </label>
                                      <textarea
                                        rows={2}
                                        value={student.comments}
                                        onChange={(e) => updateStudentComment(student.menteeId, e.target.value)}
                                        placeholder={`Enter review for ${student.name} (e.g. Understood 0/1 Knapsack well, solved class problems; or reason for absence)…`}
                                        className={`w-full text-xs rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900 border transition resize-none focus:outline-none ${
                                          !student.comments?.trim()
                                            ? 'border-rose-300 dark:border-rose-800/80 focus:border-rose-500'
                                            : 'border-slate-200 dark:border-slate-700 focus:border-purple-500'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Session General Notes (Optional) */}
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                  Mentor Session Notes (Optional)
                                </label>
                                <textarea
                                  rows={2}
                                  value={fullReportForm.generalNotes}
                                  onChange={(e) =>
                                    setFullReportForm((prev) => ({ ...prev, generalNotes: e.target.value }))
                                  }
                                  placeholder="General overview of interaction with your mentee group today…"
                                  className="w-full text-xs rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-purple-500 resize-none focus:outline-none"
                                />
                              </div>

                              {/* Form Actions */}
                              <div className="pt-2 flex items-center justify-end gap-2">
                                {fullReportData?.report && (
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingFullReport(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  type="submit"
                                  disabled={submittingFullReport}
                                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 disabled:opacity-50"
                                >
                                  {submittingFullReport ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Submitting…</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Submit Attendance &amp; Reviews</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </form>
                          ) : (
                            /* Submitted View Mode */
                            <div className="space-y-4">
                              {fullReportData?.report?.generalNotes && (
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Session Notes
                                  </div>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {fullReportData.report.generalNotes}
                                  </p>
                                </div>
                              )}

                              <div className="space-y-3">
                                {fullReportForm.records.map((student, idx) => (
                                  <div
                                    key={student.menteeId}
                                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center">
                                          #{idx + 1}
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>{student.name}</span>
                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                              {student.rollNumber || 'No Roll'}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-slate-400">
                                            {student.branch} &middot; Sec {student.section}
                                          </div>
                                        </div>
                                      </div>

                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                          student.status === 'PRESENT'
                                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                            : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                        }`}
                                      >
                                        {student.status === 'PRESENT' ? (
                                          <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                          <XCircle className="w-3 h-3" />
                                        )}
                                        {student.status}
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
                                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                        Review / Remarks
                                      </div>
                                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                        "{student.comments || 'No comments filed.'}"
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ================= ADMIN VIEW: LIST OF ALL MENTORS IN BATCH ================= */
                    <div className="space-y-4">
                      {/* Informational Banner */}
                      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/30 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              Mentor Interaction &amp; Attendance Section
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              Mentors mark training day attendance and submit individual mandatory reviews/comments for each mentee in their group.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fetchMentorReports(modalBatchId, selectedDateKey)}
                          title="Refresh Mentor Reports"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingMentorReports ? 'animate-spin text-purple-600' : ''}`} />
                        </button>
                      </div>

                      {/* Mentors List */}
                      {loadingMentorReports ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-slate-400">Loading mentor interaction reports…</span>
                        </div>
                      ) : mentorReports.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
                          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            No Mentors Assigned
                          </p>
                          <p className="text-[11px] text-slate-400">
                            There are no mentors currently assigned to this cohort batch.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {mentorReports.map((m) => (
                            <div
                              key={m.mentorId}
                              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                                m.isMyReport
                                  ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/40 ring-1 ring-purple-500/20'
                                  : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              {/* Mentor Profile Details */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {m.name}
                                    </h5>
                                    {m.isMyReport && (
                                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-600 text-white shrink-0">
                                        Your Group
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {m.designation} &middot; {m.totalMentees} Assigned Mentees
                                  </p>
                                </div>
                              </div>

                              {/* Attendance % & Actions */}
                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                {/* Present % Badge beside Mentor Name */}
                                <div className="text-right">
                                  {m.hasReport ? (
                                    <div>
                                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span>{m.attendancePercentage}% Present</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                        {m.presentCount}/{m.totalMentees} present ({m.absentCount} absent)
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-bold">
                                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <span>Pending</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                        Attendance not filed
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Action Button: "See Full Report" */}
                                <button
                                  type="button"
                                  onClick={() => openFullReport(m, false)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>See Full Report</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            {!isEditing && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Trainer: Edit Topics & Problems button */}
                  {role === 'TRAINER' && canEditTrainerSession && modalBatchId && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1.5 shadow-sm shadow-purple-600/20"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {activeSessionForModal ? 'Edit Topics & Problems' : 'Log Session for this Batch'}
                    </button>
                  )}

                  {/* Admin: Schedule More Batches or Delete Training Day Schedule */}
                  {role === 'ADMIN' && (
                    <>
                      <button
                        type="button"
                        onClick={() => openScheduleModal(selectedDate, selectedDateKey)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Schedule More Batches
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminUnscheduleBatch}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete for this Batch
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminUnscheduleAll}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 border border-rose-200 dark:border-rose-800/40 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete for All Batches
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDateModal(false);
                    setIsEditing(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition ml-auto"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SEE FULL REPORT / ATTENDANCE SUBMODAL ==================== */}
      {showFullReportModal && activeMentorForDetail && (
        <div className="fixed inset-0 z-[60] bg-black/70 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 to-indigo-500/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                  {activeMentorForDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <span>{activeMentorForDetail.name}'s Mentees</span>
                    {activeMentorForDetail.isMyReport && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                        Your Group
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cohort {activeModalBatchObj?.name || 'Batch'} &middot;{' '}
                    {selectedDate?.toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {role === 'MENTOR' && fullReportData?.canEdit && !isEditingFullReport && (
                  <button
                    type="button"
                    onClick={() => setIsEditingFullReport(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Attendance &amp; Report</span>
                  </button>
                )}
                <button
                  onClick={() => setShowFullReportModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {loadingFullReport ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Loading student attendance &amp; comments…</span>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Summary Metric Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Students
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {fullReportForm.records.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Present
                      </div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {fullReportForm.records.filter((r) => r.status === 'PRESENT').length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Absent
                      </div>
                      <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                        {fullReportForm.records.filter((r) => r.status === 'ABSENT').length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        Attendance Rate
                      </div>
                      <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                        {fullReportForm.records.length > 0
                          ? Math.round(
                              (fullReportForm.records.filter((r) => r.status === 'PRESENT').length /
                                fullReportForm.records.length) *
                                100
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>

                  {/* Mode: EDITING vs VIEWING */}
                  {isEditingFullReport ? (
                    <form onSubmit={handleFullReportSubmit} className="space-y-5">
                      {/* Batch marking helpers */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/30">
                        <div className="text-xs text-purple-900 dark:text-purple-300 font-medium">
                          <span className="font-bold">Reporting Attendance:</span> Mark Present/Absent and provide mandatory comments for every student below.
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => markAllStudents('PRESENT')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" /> Mark All Present
                          </button>
                          <button
                            type="button"
                            onClick={() => markAllStudents('ABSENT')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 transition flex items-center gap-1"
                          >
                            <UserX className="w-3 h-3" /> Mark All Absent
                          </button>
                        </div>
                      </div>

                      {/* Students List for Attendance + Mandatory Comments */}
                      <div className="space-y-4">
                        {fullReportForm.records.map((student, idx) => (
                          <div
                            key={student.menteeId}
                            className={`p-4 rounded-2xl border transition space-y-3 ${
                              student.status === 'PRESENT'
                                ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                            }`}
                          >
                            {/* Student Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                    student.status === 'PRESENT'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  #{idx + 1}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{student.name}</span>
                                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/40">
                                      {student.rollNumber || 'No Roll'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {student.branch} &middot; Sec {student.section}
                                  </div>
                                </div>
                              </div>

                              {/* Attendance Status Toggle */}
                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => updateStudentAttendance(student.menteeId, 'PRESENT')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                    student.status === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  <UserCheck className="w-3.5 h-3.5" /> Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateStudentAttendance(student.menteeId, 'ABSENT')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                    student.status === 'ABSENT'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  <UserX className="w-3.5 h-3.5" /> Absent
                                </button>
                              </div>
                            </div>

                            {/* Mandatory Student Report / Comments Field */}
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3 text-purple-500" />
                                  <span>Student Report &amp; Remarks</span>
                                  <span className="text-rose-500 font-bold">* (Mandatory)</span>
                                </span>
                                {!student.comments?.trim() && (
                                  <span className="text-[10px] font-semibold text-rose-500 animate-pulse">
                                    Required before submit
                                  </span>
                                )}
                              </label>
                              <textarea
                                rows={2}
                                value={student.comments}
                                onChange={(e) => updateStudentComment(student.menteeId, e.target.value)}
                                placeholder={`Enter review for ${student.name} (e.g. Understood 0/1 Knapsack well, solved two class problems; or reason for absence)…`}
                                className={`w-full text-xs rounded-xl p-2.5 bg-slate-50 dark:bg-slate-900 border transition resize-none focus:outline-none ${
                                  !student.comments?.trim()
                                    ? 'border-rose-300 dark:border-rose-800/80 focus:border-rose-500'
                                    : 'border-slate-200 dark:border-slate-700 focus:border-purple-500'
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* General Notes */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                          General Mentor Session Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={fullReportForm.generalNotes}
                          onChange={(e) =>
                            setFullReportForm((prev) => ({ ...prev, generalNotes: e.target.value }))
                          }
                          placeholder="Overall group participation, doubts addressed, next steps…"
                          className="w-full text-xs rounded-xl p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {fullReportData?.report && (
                          <button
                            type="button"
                            onClick={() => setIsEditingFullReport(false)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={submittingFullReport}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{submittingFullReport ? 'Submitting Report…' : 'Submit Mentor Report & Attendance'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* VIEW MODE: Complete review & comments for each particular student */
                    <div className="space-y-4">
                      {fullReportForm.generalNotes && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Session Overview Notes
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {fullReportForm.generalNotes}
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Student Attendance &amp; Mentor Reviews</span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {fullReportForm.records.length} students reviewed
                          </span>
                        </div>

                        {fullReportForm.records.map((student, idx) => (
                          <div
                            key={student.menteeId}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                    student.status === 'PRESENT'
                                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  #{idx + 1}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{student.name}</span>
                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                      {student.rollNumber || 'No Roll'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {student.branch} &middot; Sec {student.section}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                                  student.status === 'PRESENT'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                }`}
                              >
                                {student.status === 'PRESENT' ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" /> Present
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5" /> Absent
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Complete Review & Comments Display */}
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                              <div className="flex-1 leading-relaxed">
                                {student.comments ? (
                                  student.comments
                                ) : (
                                  <span className="text-slate-400 italic">No comment recorded for this student.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Mentor Group: {activeMentorForDetail.name} &middot; {fullReportForm.records.length} mentees
              </span>
              <button
                type="button"
                onClick={() => setShowFullReportModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                Close Full Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADMIN SCHEDULE TRAINING DAY MODAL ==================== */}
      {showScheduleModal && scheduleDate && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-indigo-500/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Mark Training Day on Schedule
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {scheduleDate.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/30 text-xs text-purple-900 dark:text-purple-300">
                Mark this date as a Training Day to enable trainers to log taught topics &amp; problems and allow mentors to record mentee attendance.
              </div>

              {/* Option 1: All Batches toggle */}
              <div
                onClick={() => setScheduleAllBatches(true)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  scheduleAllBatches
                    ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-300 dark:border-purple-600 ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                    scheduleAllBatches
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-slate-400 dark:border-slate-600'
                  }`}>
                    {scheduleAllBatches && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      All Cohort Batches
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mark as training day for all {batches.length} active batches at once
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                  {batches.length} Batches
                </span>
              </div>

              {/* Option 2: Individual Batches selection */}
              <div
                onClick={() => setScheduleAllBatches(false)}
                className={`p-4 rounded-2xl border cursor-pointer transition space-y-3 ${
                  !scheduleAllBatches
                    ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-300 dark:border-purple-600 ring-2 ring-purple-500/20'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                      !scheduleAllBatches
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}>
                      {!scheduleAllBatches && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Select Specific Batches
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pick individual batches from the list below
                      </div>
                    </div>
                  </div>

                  {!scheduleAllBatches && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScheduleBatchIds(batches.map((b) => b.id || b._id));
                        }}
                        className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedScheduleBatchIds([]);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {!scheduleAllBatches && (
                  <div className="space-y-2 pt-2 border-t border-purple-200/50 dark:border-purple-500/20 max-h-52 overflow-y-auto pr-1">
                    {batches.map((b) => {
                      const bId = b.id || b._id;
                      const isChecked = selectedScheduleBatchIds.includes(bId);
                      return (
                        <label
                          key={bId}
                          onClick={(e) => e.stopPropagation()}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                            isChecked
                              ? 'bg-white dark:bg-slate-900 border-purple-400 dark:border-purple-500 font-bold text-slate-900 dark:text-white shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedScheduleBatchIds((prev) => [...prev, bId]);
                                } else {
                                  setSelectedScheduleBatchIds((prev) => prev.filter((x) => x !== bId));
                                }
                              }}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="truncate">{b.name}</span>
                          </div>
                          {b.academicYear && (
                            <span className="text-[10px] font-normal text-slate-400 shrink-0">
                              Class of {b.academicYear}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{scheduling ? 'Marking Schedule…' : 'Mark as Training Day'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
