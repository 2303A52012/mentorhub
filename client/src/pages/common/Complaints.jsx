import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import {
  MessageSquareWarning,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserCheck,
  ArrowUpRight,
  Filter,
  Search,
  Plus,
  RefreshCw,
  ChevronRight,
  User,
  Building,
  Lock,
  EyeOff,
  AlertTriangle,
  MessageCircle,
  X,
  FileText
} from 'lucide-react';

const CATEGORIES = [
  { value: 'MENTORSHIP', label: 'Mentorship Issue' },
  { value: 'ACADEMIC', label: 'Academic Grievance' },
  { value: 'TECHNICAL', label: 'Platform & Technical' },
  { value: 'INFRASTRUCTURE', label: 'Lab & Campus Infrastructure' },
  { value: 'DISCIPLINARY', label: 'Disciplinary & Conduct' },
  { value: 'GENERAL', label: 'General / Other' }
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'text-slate-400 bg-slate-800/60 border-slate-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'HIGH', label: 'High', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'URGENT', label: 'Urgent', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
];

export const Complaints = () => {
  const { user } = useAuth();
  const { showToast, showConfirm } = useModal();
  const role = user?.role;

  // Data state
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Assigned mentor info for mentee
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [hasMentor, setHasMentor] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTarget, setSelectedTarget] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    targetType: role === 'MENTEE' ? 'MENTOR' : 'ADMIN'
  });

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Forward Modal State
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardReason, setForwardReason] = useState('');
  const [forwarding, setForwarding] = useState(false);

  // Status update modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: 'RESOLVED',
    resolutionNotes: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch Complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      if (res.data?.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      showToast(err.response?.data?.message || 'Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned mentor info for mentee
  const fetchAssignedMentor = async () => {
    if (role !== 'MENTEE') return;
    try {
      const res = await api.get('/complaints/info/my-mentor');
      if (res.data?.success) {
        setHasMentor(res.data.hasMentor);
        setAssignedMentor(res.data.mentor);
        // If mentee has no mentor, default target to ADMIN
        if (!res.data.hasMentor) {
          setFormData((prev) => ({ ...prev, targetType: 'ADMIN' }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch assigned mentor:', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchAssignedMentor();
  }, []);

  // Fetch Single Complaint for Drawer/Modal
  const openComplaintDetails = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await api.get(`/complaints/${id}`);
      if (res.data?.success) {
        setActiveComplaint(res.data.complaint);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch details', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Create Complaint
  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast('Title and description are required.', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/complaints', formData);
      if (res.data?.success) {
        showToast('Complaint submitted successfully.', 'success');
        setCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          category: 'GENERAL',
          priority: 'MEDIUM',
          targetType: role === 'MENTEE' && hasMentor ? 'MENTOR' : 'ADMIN'
        });
        await fetchComplaints();
        if (res.data.complaint?.id) {
          openComplaintDetails(res.data.complaint.id);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Send Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeComplaint) return;

    try {
      setSendingReply(true);
      const res = await api.post(`/complaints/${activeComplaint.id}/messages`, {
        message: replyText.trim()
      });
      if (res.data?.success) {
        setReplyText('');
        // Refresh active complaint details & list
        await openComplaintDetails(activeComplaint.id);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Escalate to Admin
  const handleForwardToAdmin = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    try {
      setForwarding(true);
      const res = await api.post(`/complaints/${activeComplaint.id}/forward`, {
        forwardReason: forwardReason.trim() || 'Escalated for administrative intervention'
      });
      if (res.data?.success) {
        showToast('Complaint successfully escalated to Administration.', 'success');
        setForwardModalOpen(false);
        setForwardReason('');
        await openComplaintDetails(activeComplaint.id);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to escalate complaint', 'error');
    } finally {
      setForwarding(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeComplaint) return;

    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/complaints/${activeComplaint.id}/status`, statusForm);
      if (res.data?.success) {
        showToast(`Complaint status updated to ${statusForm.status}`, 'success');
        setStatusModalOpen(false);
        await openComplaintDetails(activeComplaint.id);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Quick close for mentee
  const handleMenteeResolve = async () => {
    const confirmed = await showConfirm({
      title: 'Resolve & Close Complaint',
      message: 'Are you satisfied with the resolution and ready to close this grievance?',
      confirmText: 'Yes, Mark Resolved',
      variant: 'primary'
    });

    if (!confirmed) return;

    try {
      const res = await api.patch(`/complaints/${activeComplaint.id}/status`, {
        status: 'RESOLVED',
        resolutionNotes: 'Resolved satisfactorily by student.'
      });
      if (res.data?.success) {
        showToast('Complaint marked as Resolved.', 'success');
        await openComplaintDetails(activeComplaint.id);
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to close complaint', 'error');
    }
  };

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = c.title?.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);
        const matchAuthor = c.creator?.name?.toLowerCase().includes(q);
        const matchRoll = c.creator?.menteeProfile?.rollNumber?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAuthor && !matchRoll) return false;
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'ESCALATED') {
          if (!c.isForwardedToAdmin) return false;
        } else if (c.status !== selectedStatus) {
          return false;
        }
      }

      // Target
      if (selectedTarget !== 'ALL') {
        if (selectedTarget === 'ESCALATED') {
          if (!c.isForwardedToAdmin) return false;
        } else if (selectedTarget === 'MENTOR') {
          if (c.targetType !== 'MENTOR') return false;
        } else if (selectedTarget === 'ADMIN') {
          if (c.targetType !== 'ADMIN') return false;
        }
      }

      // Category
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [complaints, searchTerm, selectedStatus, selectedTarget, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'PENDING').length;
    const inReview = complaints.filter((c) => c.status === 'IN_REVIEW').length;
    const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;
    const escalated = complaints.filter((c) => c.isForwardedToAdmin).length;
    return { total, pending, inReview, resolved, escalated };
  }, [complaints]);

  // Helper badge renderers
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Action
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Under Review
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Closed / Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const renderTargetBadge = (complaint) => {
    if (complaint.isForwardedToAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
          <ArrowUpRight className="w-3.5 h-3.5" />
          Escalated to Admins
        </span>
      );
    }

    if (complaint.targetType === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          Direct to Admin (Confidential)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
        <UserCheck className="w-3.5 h-3.5 text-blue-400" />
        Addressed to Mentor
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <MessageSquareWarning className="w-3.5 h-3.5" />
            SRU Grievance & Complaint Desk
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {role === 'ADMIN'
              ? 'Administration Grievance Management'
              : role === 'MENTOR'
              ? 'Mentor Grievance Desk'
              : 'Student Grievance & Support Box'}
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            {role === 'MENTEE'
              ? 'Raise concerns with strict privacy. Complain to your mentor privately, or report directly to administration where mentors cannot view your reports.'
              : role === 'MENTOR'
              ? 'Address mentee grievances assigned to you, escalate unresolved issues to college admins, or submit direct grievances to administration.'
              : 'Review grievances addressed directly to college administration or escalated by mentors and mentees for formal intervention.'}
          </p>
        </div>

        {/* Action Button */}
        {role !== 'ADMIN' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="z-10 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Raise New Grievance
          </button>
        )}
      </div>

      {/* Privacy Policy Callout Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Strict Privacy Guarantee: </span>
            {role === 'MENTEE' ? (
              <span>
                Complaints marked <strong className="text-purple-300">Direct to Admin</strong> are 100% hidden from mentors. Complaints to your <strong className="text-blue-300">Mentor</strong> remain strictly between you two until you choose to forward to admins.
              </span>
            ) : role === 'MENTOR' ? (
              <span>
                You only see complaints assigned to you by your mentees or your own reports. Student complaints to Admins remain completely confidential and invisible to mentors.
              </span>
            ) : (
              <span>
                Admins only see complaints targeted directly to administration or escalated by mentors/students. Mentor-confidential complaints remain private until escalated.
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchComplaints}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Grievances</span>
            <MessageCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats.total}</p>
          <span className="text-[11px] text-slate-500">In your access scope</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Pending Action</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{stats.pending}</p>
          <span className="text-[11px] text-slate-500">Awaiting initial response</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-400">Under Review</span>
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-sky-400">{stats.inReview}</p>
          <span className="text-[11px] text-slate-500">Active dialogue</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.resolved}</p>
          <span className="text-[11px] text-slate-500">Satisfactorily closed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by title, description, or student roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Closed / Rejected</option>
              <option value="ESCALATED">Escalated Only</option>
            </select>

            {/* Target Filter (for Admin/Mentor) */}
            {role !== 'MENTEE' && (
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Destinations</option>
                <option value="MENTOR">Mentor Directed</option>
                <option value="ADMIN">Admin Directed</option>
                <option value="ESCALATED">Escalated to Admins</option>
              </select>
            )}

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3" />
          <p className="text-sm text-slate-400">Loading complaints from secure vault...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquareWarning className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">No Grievances Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            {complaints.length === 0
              ? 'No grievances or complaints have been submitted in your current view.'
              : 'No complaints matched your search filter criteria.'}
          </p>
          {role !== 'ADMIN' && complaints.length === 0 && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Raise First Complaint
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredComplaints.map((c) => {
            const priorityObj = PRIORITIES.find((p) => p.value === c.priority) || PRIORITIES[1];
            const isStudentAuthor = c.creator?.role === 'MENTEE';

            return (
              <div
                key={c.id}
                onClick={() => openComplaintDetails(c.id)}
                className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-md hover:shadow-indigo-950/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(c.status)}
                      {renderTargetBadge(c)}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${priorityObj.color}`}>
                        {priorityObj.label} Priority
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition">
                      {c.title}
                    </h3>

                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          From:{' '}
                          <strong className="text-slate-300 font-medium">
                            {c.creator?.id === user?.id
                              ? 'You'
                              : `${c.creator?.name}${
                                  c.creator?.menteeProfile?.rollNumber
                                    ? ` (${c.creator.menteeProfile.rollNumber})`
                                    : ''
                                }`}
                          </strong>
                        </span>
                      </div>

                      {c.mentor && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Mentor: <strong className="text-slate-300 font-medium">{c.mentor.name}</strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c._count?.messages || 0} messages</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:self-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 text-slate-400 flex items-center justify-center transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. RAISE COMPLAINT MODAL                                  */}
      {/* ========================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold">
                <MessageSquareWarning className="w-3.5 h-3.5" />
                Submit Grievance
              </div>
              <h2 className="text-xl font-bold text-white">Raise a New Grievance</h2>
              <p className="text-xs text-slate-400">
                Your report will be processed through our protected and confidential workflow.
              </p>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              {/* TARGET SELECTION (Mentee only) */}
              {role === 'MENTEE' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Where would you like to direct this complaint?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Mentor */}
                    <div
                      onClick={() => hasMentor && setFormData({ ...formData, targetType: 'MENTOR' })}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        !hasMentor
                          ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-950/40'
                          : formData.targetType === 'MENTOR'
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-white">To My Mentor</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {hasMentor ? (
                          <>
                            Direct to{' '}
                            <strong className="text-slate-300">{assignedMentor?.name}</strong>. Admins
                            cannot see this unless escalated later.
                          </>
                        ) : (
                          'No active mentor assigned currently.'
                        )}
                      </p>
                    </div>

                    {/* Option 2: Direct to Admin */}
                    <div
                      onClick={() => setFormData({ ...formData, targetType: 'ADMIN' })}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        formData.targetType === 'ADMIN'
                          ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-white">To Administration</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Strictly confidential. <strong className="text-purple-300">Your mentor cannot see</strong>{' '}
                        this complaint at all.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mentor target notification */}
              {role === 'MENTOR' && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2.5">
                  <Shield className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>
                    This grievance will be routed directly to College Administration for confidential review.
                  </span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Complaint Title / Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mentor session scheduling issue or Lab machine unavailable"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide complete facts, dates, context, and what resolution you are requesting..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Grievance
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. COMPLAINT DETAILS & CONVERSATION THREAD MODAL          */}
      {/* ========================================================= */}
      {activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {renderStatusBadge(activeComplaint.status)}
                  {renderTargetBadge(activeComplaint)}
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                    {activeComplaint.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {activeComplaint.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-400">
                  <span>
                    Reported by:{' '}
                    <strong className="text-slate-200">
                      {activeComplaint.creator?.name} (
                      {activeComplaint.creator?.menteeProfile?.rollNumber || activeComplaint.creator?.role})
                    </strong>
                  </span>
                  <span>•</span>
                  <span>{new Date(activeComplaint.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveComplaint(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Scrollable Conversation */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Privacy Alert In Drawer */}
              {activeComplaint.targetType === 'ADMIN' && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    Confidential Report: This thread is strictly confidential between the student and Administration. Mentors have no access.
                  </span>
                </div>
              )}

              {/* Escalation Notice */}
              {activeComplaint.isForwardedToAdmin && (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
                    <ArrowUpRight className="w-4 h-4" />
                    Escalated to College Administration
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Reason:</strong> "{activeComplaint.forwardReason || 'No reason specified'}"
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Forwarded by {activeComplaint.forwardedBy?.name} on{' '}
                    {new Date(activeComplaint.forwardedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Resolution Notice */}
              {(activeComplaint.status === 'RESOLVED' || activeComplaint.status === 'REJECTED') && (
                <div
                  className={`p-3.5 rounded-xl border ${
                    activeComplaint.status === 'RESOLVED'
                      ? 'bg-emerald-500/10 border-emerald-500/25'
                      : 'bg-rose-500/10 border-rose-500/25'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    {activeComplaint.status === 'RESOLVED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    {activeComplaint.status === 'RESOLVED' ? 'Resolution Notice' : 'Closure / Rejection Notice'}
                  </div>
                  {activeComplaint.resolutionNotes && (
                    <p className="text-xs text-slate-300 mt-1">
                      <strong>Notes:</strong> {activeComplaint.resolutionNotes}
                    </p>
                  )}
                  {activeComplaint.resolvedBy && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Marked by {activeComplaint.resolvedBy.name} ({activeComplaint.resolvedBy.role}) on{' '}
                      {new Date(activeComplaint.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Original Complaint Statement Card */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/60">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Original Statement
                  </span>
                  <span>{new Date(activeComplaint.createdAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeComplaint.description}
                </p>
              </div>

              {/* Conversation Messages */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
                  Discussion & Follow-ups ({activeComplaint.messages?.length || 0})
                </div>

                {activeComplaint.messages?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-1">
                    No follow-up messages yet. Use the response box below to provide updates or ask questions.
                  </p>
                ) : (
                  activeComplaint.messages?.map((msg) => {
                    const isCurrentUser = msg.senderId === user?.id;
                    const isSystemAlert = msg.message?.startsWith('📢');

                    if (isSystemAlert) {
                      return (
                        <div
                          key={msg.id}
                          className="my-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-center text-xs text-amber-300 font-mono"
                        >
                          {msg.message}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                          <span className="font-semibold text-slate-300">
                            {isCurrentUser ? 'You' : msg.sender?.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                            {msg.sender?.role}
                          </span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        </div>

                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                            isCurrentUser
                              ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                              : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Actions & Reply Box */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
              {/* Context Actions Row (Escalate / Resolve) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Escalate button: shown if addressed to mentor and not yet escalated */}
                {activeComplaint.targetType === 'MENTOR' && !activeComplaint.isForwardedToAdmin && (
                  <button
                    onClick={() => {
                      setForwardReason('');
                      setForwardModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-medium transition"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Escalate to Administration
                  </button>
                )}

                {/* Status action buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {/* Mentee can close their own complaint if resolved */}
                  {role === 'MENTEE' &&
                    activeComplaint.creatorId === user?.id &&
                    activeComplaint.status !== 'RESOLVED' && (
                      <button
                        onClick={handleMenteeResolve}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-medium transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as Satisfied & Close
                      </button>
                    )}

                  {/* Mentor or Admin status control */}
                  {(role === 'ADMIN' || (role === 'MENTOR' && activeComplaint.mentorId === user?.id)) && (
                    <button
                      onClick={() => {
                        setStatusForm({
                          status: activeComplaint.status === 'RESOLVED' ? 'IN_REVIEW' : 'RESOLVED',
                          resolutionNotes: activeComplaint.resolutionNotes || ''
                        });
                        setStatusModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Change Status / Resolution
                    </button>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a response or update..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Reply
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ESCALATE / FORWARD TO ADMIN MODAL                      */}
      {/* ========================================================= */}
      {forwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-orange-400">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Escalate to Administration</h3>
                <p className="text-xs text-slate-400">SRU College Grievance Board</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Once escalated, the entire complaint history and discussion thread will become visible to College Admins for formal arbitration and review.
            </p>

            <form onSubmit={handleForwardToAdmin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Reason for Escalation *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Mentor did not respond within expected timeline, or issue requires departmental Dean intervention..."
                  value={forwardReason}
                  onChange={(e) => setForwardReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForwardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forwarding}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {forwarding ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. STATUS & RESOLUTION MODAL                              */}
      {/* ========================================================= */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Update Grievance Status</h3>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED / CLOSED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Resolution / Outcome Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the action taken, outcome, or justification..."
                  value={statusForm.resolutionNotes}
                  onChange={(e) => setStatusForm({ ...statusForm, resolutionNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
