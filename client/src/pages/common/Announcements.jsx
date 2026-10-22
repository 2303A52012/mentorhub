import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  BellRing,
  Pin,
  PinOff,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Users,
  User,
  Layers,
  Globe,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  Calendar,
  Tag
} from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone', icon: Globe, color: 'text-blue-500 dark:text-blue-400' },
  { value: 'BATCH', label: 'Specific Batch', icon: Layers, color: 'text-purple-500 dark:text-purple-400' },
  { value: 'MENTOR_GROUP', label: "A Mentor's Group", icon: Users, color: 'text-amber-500 dark:text-amber-400' },
  { value: 'INDIVIDUAL', label: 'Specific Students', icon: User, color: 'text-emerald-500 dark:text-emerald-400' },
];

const audienceColor = {
  ALL: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
  BATCH: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
  MENTOR_GROUP: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
  INDIVIDUAL: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
};

const audienceLabel = {
  ALL: 'Everyone',
  BATCH: 'Batch',
  MENTOR_GROUP: "Mentor's Group",
  INDIVIDUAL: 'Individual'
};

function timeAgo(dt) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const Announcements = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canPost = ['ADMIN', 'TRAINER', 'MENTOR'].includes(role);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [batches, setBatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    targetIds: [],
    isPinned: false,
    expiresAt: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/announcements?page=${page}&limit=15`);
      setAnnouncements(res.data.announcements || []);
      setTotal(res.data.total || 0);
    } catch {
      showToast('Failed to load announcements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchMeta = useCallback(async () => {
    try {
      if (canPost) {
        const [br, mr] = await Promise.all([
          api.get('/batches?limit=100'),
          role === 'ADMIN' ? api.get('/mentors?limit=100') : Promise.resolve({ data: { mentors: [] } })
        ]);
        setBatches(br.data.batches || br.data || []);
        setMentors(mr.data.mentors || []);
      }
    } catch {}
  }, [canPost, role]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const markRead = async (id) => {
    try {
      await api.post(`/announcements/${id}/read`);
    } catch {}
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const handleExpand = (id) => {
    setExpanded((prev) => (prev === id ? null : id));
    const ann = announcements.find((a) => a.id === id);
    if (ann && !ann.isRead) markRead(id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      showToast('Announcement deleted.');
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  const openEdit = (ann) => {
    setEditTarget(ann);
    setForm({
      title: ann.title,
      content: ann.content,
      audience: ann.audience,
      targetIds: ann.targetIds || [],
      isPinned: ann.isPinned,
      expiresAt: ann.expiresAt ? ann.expiresAt.slice(0, 10) : ''
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      title: '',
      content: '',
      audience: 'ALL',
      targetIds: [],
      isPinned: false,
      expiresAt: ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      return showToast('Title and content are required.', 'error');
    }
    setSubmitting(true);
    try {
      const payload = { ...form, expiresAt: form.expiresAt || null };
      if (editTarget) {
        const res = await api.patch(`/announcements/${editTarget.id}`, payload);
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === editTarget.id ? { ...res.data.announcement, isRead: a.isRead } : a
          )
        );
        showToast('Announcement updated!');
      } else {
        const res = await api.post('/announcements', payload);
        setAnnouncements((prev) => [{ ...res.data.announcement, isRead: true }, ...prev]);
        showToast('Announcement posted!');
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save announcement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = announcements.filter((a) => {
    if (filterAudience && a.audience !== filterAudience) return false;
    if (
      search &&
      !a.title.toLowerCase().includes(search.toLowerCase()) &&
      !a.content.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const unread = announcements.filter((a) => !a.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6 transition-colors duration-200 font-sans">
      {/* Toast */}
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Announcements
              </h1>
              {unread > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                  {unread} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official university circulars, batch notifications, and training alerts · {total} total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAnnouncements}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canPost && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements by title or content…"
            className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs transition"
          />
        </div>
        <select
          value={filterAudience}
          onChange={(e) => setFilterAudience(e.target.value)}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer font-medium"
        >
          <option value="">All Audiences</option>
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="dark:bg-slate-900">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading announcements…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <Bell className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">No announcements found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ann) => {
            const isExpanded = expanded === ann.id;
            const myAnn = ann.createdById === user?.id;
            const canEdit = myAnn || role === 'ADMIN';

            return (
              <div
                key={ann.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  ann.isPinned
                    ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5'
                    : ann.isRead
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    : 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-500/5 hover:border-indigo-300'
                }`}
              >
                {/* Card Header */}
                <div
                  className="flex items-start gap-3.5 p-4 md:p-5 cursor-pointer select-none"
                  onClick={() => handleExpand(ann.id)}
                >
                  <div
                    className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${
                      ann.isRead ? 'bg-slate-300 dark:bg-slate-600' : 'bg-indigo-600 dark:bg-indigo-400 animate-pulse'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {ann.isPinned && (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2.5 py-0.5 rounded-full">
                          <Pin className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Pinned
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold border px-2.5 py-0.5 rounded-full ${
                          audienceColor[ann.audience] ||
                          'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {audienceLabel[ann.audience] || ann.audience}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(ann.createdAt)}
                      </span>
                    </div>

                    <h3
                      className={`font-bold text-sm md:text-base leading-snug tracking-tight ${
                        ann.isRead
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {ann.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Posted by <strong className="text-slate-700 dark:text-slate-300">{ann.createdBy?.name || 'Administrator'}</strong>
                      {ann.createdBy?.role ? ` (${ann.createdBy.role})` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canEdit && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(ann);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                          title="Edit Announcement"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ann.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <div className="p-1 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800/80 pt-4 bg-slate-50/50 dark:bg-slate-950/20">
                    <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {ann.content}
                    </p>
                    {ann.expiresAt && (
                      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" /> Expires on{' '}
                        {new Date(ann.expiresAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>
          <span className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Page {page} of {Math.ceil(total / 15)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 15)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* ==================== CREATE / EDIT ANNOUNCEMENT MODAL ==================== */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    {editTarget ? 'Edit Announcement' : 'Publish Announcement'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Broadcast updates to specific batches, groups, or the entire university.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Announcement Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Mandatory DSA Contest, Mock Interview Slot Allocations…"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Announcement Body
                </label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Provide complete details, timelines, meeting links, or submission guidelines…"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value, targetIds: [] }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {AUDIENCE_OPTIONS.filter((o) => {
                      if (role === 'MENTOR') return ['ALL', 'MENTOR_GROUP', 'INDIVIDUAL'].includes(o.value);
                      if (role === 'TRAINER') return ['ALL', 'BATCH', 'INDIVIDUAL'].includes(o.value);
                      return true;
                    }).map((o) => (
                      <option key={o.value} value={o.value} className="dark:bg-slate-900">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {form.audience === 'BATCH' && batches.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Select Target Batch(es)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {batches.map((b) => {
                      const id = b.id || b._id;
                      const isSelected = form.targetIds.includes(id);
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              targetIds: isSelected
                                ? f.targetIds.filter((x) => x !== id)
                                : [...f.targetIds, id]
                            }))
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-purple-100 dark:bg-purple-600/20 border-purple-300 dark:border-purple-500 text-purple-800 dark:text-purple-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {form.audience === 'MENTOR_GROUP' && mentors.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Select Mentor Group(s)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {mentors.map((m) => {
                      const id = m.id || m._id;
                      const isSelected = form.targetIds.includes(id);
                      return (
                        <button
                          type="button"
                          key={id}
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              targetIds: isSelected
                                ? f.targetIds.filter((x) => x !== id)
                                : [...f.targetIds, id]
                            }))
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-amber-100 dark:bg-amber-600/20 border-amber-300 dark:border-amber-500 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pin Switch Slider (Supporting Light and Dark Modes!) */}
              {role === 'ADMIN' && (
                <div className="pt-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setForm((f) => ({ ...f, isPinned: !f.isPinned }))}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        form.isPinned
                          ? 'bg-amber-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          form.isPinned ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Pin this announcement
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Keeps this announcement pinned at the top of students' feeds.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  {submitting
                    ? 'Publishing…'
                    : editTarget
                    ? 'Save Changes'
                    : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
