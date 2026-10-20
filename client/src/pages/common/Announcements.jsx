import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Bell, BellRing, Pin, PinOff, Plus, Trash2, Edit3, X, Check,
  Search, RefreshCw, ChevronDown, ChevronUp, Filter, Users,
  User, Layers, Globe, Eye, Clock, AlertCircle, CheckCircle2,
  Megaphone, Calendar, Tag
} from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone', icon: Globe, color: 'text-blue-400' },
  { value: 'BATCH', label: 'Specific Batch', icon: Layers, color: 'text-purple-400' },
  { value: 'MENTOR_GROUP', label: "A Mentor's Group", icon: Users, color: 'text-amber-400' },
  { value: 'INDIVIDUAL', label: 'Specific Students', icon: User, color: 'text-emerald-400' },
];

const audienceColor = {
  ALL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  BATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  MENTOR_GROUP: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  INDIVIDUAL: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const audienceLabel = { ALL: 'Everyone', BATCH: 'Batch', MENTOR_GROUP: "Mentor's Group", INDIVIDUAL: 'Individual' };

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
  const [mentees, setMentees] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [form, setForm] = useState({ title: '', content: '', audience: 'ALL', targetIds: [], isPinned: false, expiresAt: '' });

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
    } catch { showToast('Failed to load announcements.', 'error'); }
    finally { setLoading(false); }
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

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);
  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const markRead = async (id) => {
    try { await api.post(`/announcements/${id}/read`); }
    catch {}
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const handleExpand = (id) => {
    setExpanded(prev => prev === id ? null : id);
    const ann = announcements.find(a => a.id === id);
    if (ann && !ann.isRead) markRead(id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showToast('Announcement deleted.');
    } catch { showToast('Failed to delete.', 'error'); }
  };

  const openEdit = (ann) => {
    setEditTarget(ann);
    setForm({ title: ann.title, content: ann.content, audience: ann.audience, targetIds: ann.targetIds || [], isPinned: ann.isPinned, expiresAt: ann.expiresAt ? ann.expiresAt.slice(0, 10) : '' });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: '', content: '', audience: 'ALL', targetIds: [], isPinned: false, expiresAt: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return showToast('Title and content required.', 'error');
    setSubmitting(true);
    try {
      const payload = { ...form, expiresAt: form.expiresAt || null };
      if (editTarget) {
        const res = await api.patch(`/announcements/${editTarget.id}`, payload);
        setAnnouncements(prev => prev.map(a => a.id === editTarget.id ? { ...res.data.announcement, isRead: a.isRead } : a));
        showToast('Announcement updated!');
      } else {
        const res = await api.post('/announcements', payload);
        setAnnouncements(prev => [{ ...res.data.announcement, isRead: true }, ...prev]);
        showToast('Announcement posted!');
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally { setSubmitting(false); }
  };

  const filtered = announcements.filter(a => {
    if (filterAudience && a.audience !== filterAudience) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unread = announcements.filter(a => !a.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border flex items-center gap-2 transition-all ${toast.type === 'error' ? 'bg-rose-900/90 border-rose-700 text-rose-200' : 'bg-emerald-900/90 border-emerald-700 text-emerald-200'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30">
            <Megaphone className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Announcements</h1>
            <p className="text-sm text-slate-400">
              {unread > 0 ? <span className="text-amber-400 font-medium">{unread} unread</span> : 'All caught up'} · {total} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnnouncements} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {canPost && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition">
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search announcements..." className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={filterAudience} onChange={e => setFilterAudience(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
          <option value="">All Audiences</option>
          {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading announcements…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Bell className="w-12 h-12 opacity-30" />
          <p className="text-base">No announcements found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ann => {
            const isExpanded = expanded === ann.id;
            const myAnn = ann.createdById === user?.id;
            const canEdit = myAnn || role === 'ADMIN';
            return (
              <div key={ann.id} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${ann.isPinned ? 'border-amber-500/30 bg-amber-500/5' : ann.isRead ? 'border-slate-800 bg-slate-900/60' : 'border-indigo-500/30 bg-indigo-500/5'}`}>
                {/* Card Header */}
                <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => handleExpand(ann.id)}>
                  <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full mt-2 ${ann.isRead ? 'bg-slate-600' : 'bg-indigo-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {ann.isPinned && <span className="flex items-center gap-1 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full"><Pin className="w-3 h-3" /> Pinned</span>}
                      <span className={`text-xs border px-2 py-0.5 rounded-full ${audienceColor[ann.audience] || 'bg-slate-700 text-slate-400'}`}>{audienceLabel[ann.audience]}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(ann.createdAt)}</span>
                    </div>
                    <h3 className={`font-semibold text-base leading-snug ${ann.isRead ? 'text-slate-300' : 'text-white'}`}>{ann.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">By {ann.createdBy?.name} ({ann.createdBy?.role})</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {canEdit && (
                      <>
                        <button onClick={e => { e.stopPropagation(); openEdit(ann); }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(ann.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {/* Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-800/60 pt-3">
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    {ann.expiresAt && <p className="mt-2 text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires {new Date(ann.expiresAt).toLocaleDateString('en-IN')}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition">← Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-400">{page} / {Math.ceil(total / 15)}</span>
          <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition">Next →</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="font-bold text-white text-lg">{editTarget ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title…" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Content</label>
                <textarea rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement…" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Audience</label>
                  <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value, targetIds: [] }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
                    {AUDIENCE_OPTIONS.filter(o => {
                      if (role === 'MENTOR') return ['ALL', 'MENTOR_GROUP', 'INDIVIDUAL'].includes(o.value);
                      if (role === 'TRAINER') return ['ALL', 'BATCH', 'INDIVIDUAL'].includes(o.value);
                      return true;
                    }).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Expires On</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {form.audience === 'BATCH' && batches.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Select Batch(es)</label>
                  <div className="flex flex-wrap gap-2">
                    {batches.map(b => (
                      <button type="button" key={b.id} onClick={() => setForm(f => ({ ...f, targetIds: f.targetIds.includes(b.id) ? f.targetIds.filter(id => id !== b.id) : [...f.targetIds, b.id] }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${form.targetIds.includes(b.id) ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>{b.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {form.audience === 'MENTOR_GROUP' && mentors.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Select Mentor(s)</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {mentors.map(m => (
                      <button type="button" key={m.id} onClick={() => setForm(f => ({ ...f, targetIds: f.targetIds.includes(m.id) ? f.targetIds.filter(id => id !== m.id) : [...f.targetIds, m.id] }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${form.targetIds.includes(m.id) ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>{m.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {role === 'ADMIN' && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div onClick={() => setForm(f => ({ ...f, isPinned: !f.isPinned }))} className={`w-10 h-5 rounded-full transition-colors ${form.isPinned ? 'bg-amber-500' : 'bg-slate-700'} relative`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPinned ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-slate-300">Pin this announcement</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-60">
                  {submitting ? 'Saving…' : editTarget ? 'Save Changes' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
