import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import {
  Video,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Search,
  ExternalLink,
  User,
  UserCheck,
  RefreshCw,
  X,
  Send,
  MessageSquare,
  Sparkles,
  BookOpen,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';

export const DoubtSessions = () => {
  const { user } = useAuth();
  const { showToast, showConfirm } = useModal();
  const role = user?.role;

  // Data state
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [hasMentor, setHasMentor] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Request Modal State (Mentee)
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    topic: '',
    description: '',
    preferredDate: '',
    preferredTime: 'Afternoon (2 PM - 5 PM)',
    mode: 'ONLINE'
  });

  // Schedule Modal State (Mentor)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    startTime: '15:00',
    endTime: '15:30',
    mode: 'ONLINE',
    meetLink: '',
    venue: '',
    mentorNotes: ''
  });

  // Complete Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState('');

  // Reject / Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch Sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doubt-sessions');
      if (res.data?.success) {
        setSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load doubt sessions:', err);
      showToast(err.response?.data?.message || 'Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Assigned Mentor for Mentee
  const fetchMentorInfo = async () => {
    if (role !== 'MENTEE') return;
    try {
      const res = await api.get('/complaints/info/my-mentor');
      if (res.data?.success) {
        setHasMentor(res.data.hasMentor);
        setAssignedMentor(res.data.mentor);
      }
    } catch (err) {
      console.error('Failed to load mentor info:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchMentorInfo();
  }, []);

  // Handle Mentee Request Submit
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.topic.trim() || !requestForm.description.trim()) {
      showToast('Topic and explanation details are required.', 'warning');
      return;
    }

    try {
      setSubmittingRequest(true);
      const res = await api.post('/doubt-sessions', requestForm);
      if (res.data?.success) {
        showToast('Session request sent to your mentor!', 'success');
        setRequestModalOpen(false);
        setRequestForm({
          topic: '',
          description: '',
          preferredDate: '',
          preferredTime: 'Afternoon (2 PM - 5 PM)',
          mode: 'ONLINE'
        });
        fetchSessions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send request', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Open Schedule Modal
  const openScheduleModal = (session) => {
    setSelectedSession(session);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = session.preferredDate
      ? new Date(session.preferredDate).toISOString().split('T')[0]
      : tomorrow.toISOString().split('T')[0];

    setScheduleForm({
      scheduledDate: defaultDate,
      startTime: '15:00',
      endTime: '15:30',
      mode: session.mode || 'ONLINE',
      meetLink: session.meetLink || '',
      venue: session.venue || (session.mode === 'OFFLINE' ? 'Mentor Cabin 304, CSE Block' : ''),
      mentorNotes: session.mentorNotes || ''
    });
    setScheduleModalOpen(true);
  };

  // Handle Mentor Schedule Submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    if (!scheduleForm.scheduledDate || !scheduleForm.startTime || !scheduleForm.endTime) {
      showToast('Please specify date, start time, and end time.', 'warning');
      return;
    }

    try {
      setScheduling(true);
      const res = await api.post(`/doubt-sessions/${selectedSession.id}/schedule`, scheduleForm);
      if (res.data?.success) {
        showToast('Timeslot and venue/meet details scheduled successfully!', 'success');
        setScheduleModalOpen(false);
        fetchSessions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule session', 'error');
    } finally {
      setScheduling(false);
    }
  };

  // Handle Complete Submit
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      setCompleting(true);
      const res = await api.post(`/doubt-sessions/${selectedSession.id}/complete`, {
        summaryNotes
      });
      if (res.data?.success) {
        showToast('Session marked as completed.', 'success');
        setCompleteModalOpen(false);
        setSummaryNotes('');
        fetchSessions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete session', 'error');
    } finally {
      setCompleting(false);
    }
  };

  // Handle Cancel / Reject Submit
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      setCancelling(true);
      const res = await api.post(`/doubt-sessions/${selectedSession.id}/cancel`, {
        reason: cancelReason
      });
      if (res.data?.success) {
        showToast('Session status updated.', 'success');
        setCancelModalOpen(false);
        setCancelReason('');
        fetchSessions();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update session', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTopic = s.topic?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        const matchMentee = s.mentee?.name?.toLowerCase().includes(q);
        const matchRoll = s.mentee?.menteeProfile?.rollNumber?.toLowerCase().includes(q);
        const matchMentor = s.mentor?.name?.toLowerCase().includes(q);
        if (!matchTopic && !matchDesc && !matchMentee && !matchRoll && !matchMentor) {
          return false;
        }
      }
      return true;
    });
  }, [sessions, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = sessions.length;
    const pending = sessions.filter((s) => s.status === 'PENDING').length;
    const scheduled = sessions.filter((s) => s.status === 'SCHEDULED').length;
    const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
    return { total, pending, scheduled, completed };
  }, [sessions]);

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Awaiting Timeslot
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Scheduled & Confirmed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 p-6 rounded-2xl border border-indigo-100 dark:border-slate-800 shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            1-on-1 Mentorship & Doubt Clearing
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {role === 'MENTEE'
              ? 'Request a Doubt / Explanation Session'
              : role === 'MENTOR'
              ? 'Mentee Doubt & Explanation Requests'
              : 'Doubt & Mentorship Sessions Overview'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            {role === 'MENTEE'
              ? 'Need a concept explained or code reviewed? Request a 1-on-1 session with your assigned mentor. Your mentor will allocate a timeslot, Google Meet link, or campus venue.'
              : role === 'MENTOR'
              ? 'Review pending doubt explanation requests from your assigned mentees, allocate meeting timeslots, and provide Google Meet links or campus cabin venue details.'
              : 'Monitor 1-on-1 doubt resolution sessions and mentorship meetings across faculties and students.'}
          </p>
        </div>

        {/* Mentee action */}
        {role === 'MENTEE' && (
          <button
            onClick={() => {
              if (!hasMentor) {
                showToast('You do not have an active assigned mentor yet.', 'warning');
                return;
              }
              setRequestModalOpen(true);
            }}
            className="z-10 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Request 1-on-1 Session
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Sessions</span>
            <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">In your purview</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Awaiting Schedule</span>
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Pending mentor timeslot</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Upcoming Scheduled</span>
            <CalendarCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.scheduled}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Meet link / venue assigned</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Conducted / Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Resolved & completed</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by topic, mentee name, roll number, or mentor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Awaiting Timeslot</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Declined / Cancelled</option>
          </select>

          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading doubt sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Sessions Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            {sessions.length === 0
              ? 'No doubt clearing or explanation sessions have been requested yet.'
              : 'No sessions matched your search criteria.'}
          </p>
          {role === 'MENTEE' && sessions.length === 0 && (
            <button
              onClick={() => setRequestModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Request Your First Session
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((session) => {
            const isMentor = role === 'MENTOR' || role === 'ADMIN';
            const isMentee = role === 'MENTEE';

            return (
              <div
                key={session.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 transition shadow-sm hover:shadow-md space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(session.status)}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {session.mode === 'ONLINE' ? (
                          <>
                            <Video className="w-3 h-3 text-sky-500 dark:text-sky-400" /> Online Meet
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> In-Person / Campus
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{session.topic}</h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {session.description}
                    </p>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                    {/* Mentor can assign timeslot if PENDING or reschedule */}
                    {isMentor && session.status === 'PENDING' && (
                      <button
                        onClick={() => openScheduleModal(session)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        Assign Timeslot & Details
                      </button>
                    )}

                    {/* Mentor can mark COMPLETED if SCHEDULED */}
                    {isMentor && session.status === 'SCHEDULED' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            setSummaryNotes(session.summaryNotes || '');
                            setCompleteModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Completed
                        </button>

                        <button
                          onClick={() => openScheduleModal(session)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                        >
                          Reschedule
                        </button>
                      </div>
                    )}

                    {/* Mentee or Mentor can cancel if PENDING or SCHEDULED */}
                    {(session.status === 'PENDING' || session.status === 'SCHEDULED') && (
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setCancelReason('');
                          setCancelModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {isMentor ? 'Decline Request' : 'Cancel Request'}
                      </button>
                    )}
                  </div>
                </div>

                {/* SCHEDULED DETAILS HIGHLIGHT CARD */}
                {session.status === 'SCHEDULED' && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-700 dark:text-indigo-300">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          <span>
                            {session.scheduledDate
                              ? new Date(session.scheduledDate).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Date TBD'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          <span>
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Venue or Meet link info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
                        {session.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              Venue: <strong className="text-slate-900 dark:text-white">{session.venue}</strong>
                            </span>
                          </div>
                        )}

                        {session.mentorNotes && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Mentor Note: "{session.mentorNotes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Join Google Meet Button */}
                    {session.meetLink && (
                      <a
                        href={
                          session.meetLink.startsWith('http')
                            ? session.meetLink
                            : `https://${session.meetLink}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-600/20 transition active:scale-95 shrink-0"
                      >
                        <Video className="w-4 h-4" />
                        Join Meeting Link
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* If PENDING: show preference info */}
                {session.status === 'PENDING' && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span>
                        Preferred Date:{' '}
                        <strong className="text-slate-800 dark:text-slate-300">
                          {session.preferredDate
                            ? new Date(session.preferredDate).toLocaleDateString()
                            : 'Flexible'}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Preferred Time:{' '}
                        <strong className="text-slate-800 dark:text-slate-300">{session.preferredTime || 'Anytime'}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic">
                      {isMentor
                        ? '⚡ Action Required: Click "Assign Timeslot & Details" above to schedule'
                        : 'Awaiting your mentor to assign date, time & meet link.'}
                    </span>
                  </div>
                )}

                {/* If COMPLETED: show summary notes */}
                {session.status === 'COMPLETED' && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Session Completed
                    </div>
                    {session.summaryNotes && (
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        <strong>Outcome Summary:</strong> {session.summaryNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* If REJECTED / CANCELLED */}
                {(session.status === 'REJECTED' || session.status === 'CANCELLED') &&
                  session.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                      <strong>Reason:</strong> {session.rejectionReason}
                    </div>
                  )}

                {/* Participants Footer */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Mentee:{' '}
                      <strong className="text-slate-800 dark:text-slate-300 font-medium">
                        {session.mentee?.name}
                        {session.mentee?.menteeProfile?.rollNumber
                          ? ` (${session.mentee.menteeProfile.rollNumber})`
                          : ''}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Mentor:{' '}
                      <strong className="text-slate-800 dark:text-slate-300 font-medium">{session.mentor?.name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Requested: {new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MENTEE REQUEST MODAL                                   */}
      {/* ========================================================= */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5" />
                1-on-1 Guidance Request
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Doubt Explanation Session</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct request to your mentor:{' '}
                <strong className="text-slate-800 dark:text-slate-200">{assignedMentor?.name}</strong>
              </p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {/* Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Topic or Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming memoization, React useEffect dependencies, etc."
                  value={requestForm.topic}
                  onChange={(e) => setRequestForm({ ...requestForm, topic: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Description / Doubts */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  What specific doubts or explanation do you need? *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe where you are stuck, code files or question links you want to discuss with your mentor..."
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Mode and Preferred Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mode Preference</label>
                  <select
                    value={requestForm.mode}
                    onChange={(e) => setRequestForm({ ...requestForm, mode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ONLINE">Online Meet (Google Meet)</option>
                    <option value="OFFLINE">In-Person (Faculty Cabin / Lab)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Preferred Date</label>
                  <input
                    type="date"
                    value={requestForm.preferredDate}
                    onChange={(e) => setRequestForm({ ...requestForm, preferredDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Preferred Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Preferred Time Window
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon (2 PM - 5 PM) or After 4:30 PM"
                  value={requestForm.preferredTime}
                  onChange={(e) => setRequestForm({ ...requestForm, preferredTime: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MENTOR ASSIGN TIMESLOT & DETAILS MODAL                 */}
      {/* ========================================================= */}
      {scheduleModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setScheduleModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                <CalendarCheck className="w-3.5 h-3.5" />
                Schedule Timeslot
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assign Timeslot & Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Session with <strong className="text-slate-800 dark:text-slate-200">{selectedSession.mentee?.name}</strong>{' '}
                on "{selectedSession.topic}"
              </p>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              {/* Scheduled Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Session Date *</label>
                <input
                  type="date"
                  required
                  value={scheduleForm.scheduledDate}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Start and End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mode</label>
                <select
                  value={scheduleForm.mode}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ONLINE">Online Meet (Google Meet / Zoom)</option>
                  <option value="OFFLINE">In-Person (Campus Venue / Cabin)</option>
                </select>
              </div>

              {/* Meet link (shown if ONLINE) */}
              {scheduleForm.mode === 'ONLINE' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Google Meet / Meeting URL *
                  </label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={scheduleForm.meetLink}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, meetLink: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Venue (shown if OFFLINE) */}
              {scheduleForm.mode === 'OFFLINE' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Campus Venue / Room Details *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faculty Cabin 304, CSE Block 2 or Lab 5"
                    value={scheduleForm.venue}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, venue: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Mentor Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Instructions / Preparation Notes for Mentee (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring your code snippet and review questions beforehand..."
                  value={scheduleForm.mentorNotes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, mentorNotes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {scheduling ? 'Saving...' : 'Confirm & Notify Mentee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MARK COMPLETED MODAL                                   */}
      {/* ========================================================= */}
      {completeModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Mark Session as Completed</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record outcome or summary notes for "{selectedSession.topic}".
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Summary / Outcome Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Doubts on tree recursion clarified, suggested 3 practice problems..."
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {completing ? 'Completing...' : 'Mark as Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CANCEL / DECLINE MODAL                                 */}
      {/* ========================================================= */}
      {cancelModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {role === 'MENTOR' ? 'Decline Doubt Request' : 'Cancel Session Request'}
            </h3>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide reason for declining or cancelling..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {cancelling ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
