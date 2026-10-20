import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Zap, Plus, Trash2, Edit3, X, ExternalLink, AlertCircle,
  CheckCircle2, RefreshCw, Search, Filter, ChevronDown
} from 'lucide-react';

const DIFFICULTIES = ['EASY','MEDIUM','HARD'];
const TYPES = ['DSA','SYSTEM_DESIGN','APTITUDE','CODING','SQL','OTHER'];

const diffColor = {
  EASY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  HARD: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

export const DailyProblems = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const defaultForm = { title: '', description: '', link: '', company: '', difficulty: 'MEDIUM', type: 'DSA', tags: [], tagInput: '' };
  const [form, setForm] = useState(defaultForm);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/trainer/profile');
        const tb = res.data.trainer?.trainerBatches || [];
        setBatches(tb.map(t => t.batch));
        if (tb.length > 0) setSelectedBatch(tb[0].batch.id);
      } catch {}
    };
    fetchBatches();
  }, []);

  const fetchProblems = useCallback(async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await api.get(`/trainer/daily-problems?batchId=${selectedBatch}&page=${page}&limit=10`);
      setProblems(res.data.problems || []);
      setTotal(res.data.total || 0);
    } catch { showToast('Failed to load problems.', 'error'); }
    finally { setLoading(false); }
  }, [selectedBatch, page]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  const openCreate = () => { setEditTarget(null); setForm({ ...defaultForm }); setShowForm(true); };
  const openEdit = (p) => {
    setEditTarget(p);
    setForm({ title: p.title, description: p.description || '', link: p.link || '', company: p.company || '', difficulty: p.difficulty, type: p.type, tags: p.tags || [], tagInput: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Title is required.', 'error');
    setSubmitting(true);
    try {
      const payload = { batchId: selectedBatch, title: form.title, description: form.description, link: form.link, company: form.company, difficulty: form.difficulty, type: form.type, tags: form.tags };
      if (editTarget) {
        const res = await api.patch(`/trainer/daily-problems/${editTarget.id}`, payload);
        setProblems(prev => prev.map(p => p.id === editTarget.id ? res.data.problem : p));
        showToast('Problem updated!');
      } else {
        await api.post('/trainer/daily-problems', payload);
        await fetchProblems();
        showToast('Problem posted!');
      }
      setShowForm(false);
    } catch (err) { showToast(err.response?.data?.message || 'Failed to save.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    try {
      await api.delete(`/trainer/daily-problems/${id}`);
      setProblems(prev => prev.filter(p => p.id !== id));
      showToast('Problem deleted.');
    } catch { showToast('Failed to delete.', 'error'); }
  };

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t], tagInput: '' }));
  };

  const filtered = problems.filter(p => {
    if (filterDiff && p.difficulty !== filterDiff) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !(p.company || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-900/90 border-rose-700 text-rose-200' : 'bg-emerald-900/90 border-emerald-700 text-emerald-200'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-600/20 border border-amber-500/30"><Zap className="w-6 h-6 text-amber-400" /></div>
          <div><h1 className="text-2xl font-bold text-white">Daily Problems</h1><p className="text-sm text-slate-400">Company-specific interview & OA problems</p></div>
        </div>
        <div className="flex items-center gap-2">
          {batches.length > 1 && (
            <select value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setPage(1); }} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500">
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button onClick={fetchProblems} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition"><Plus className="w-4 h-4" /> Add Problem</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or company…" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500" />
        </div>
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-amber-500">
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Zap className="w-12 h-12 opacity-20" />
          <p>No problems found. Post your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-start gap-4 transition group">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs border px-2 py-0.5 rounded-full ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-white text-sm leading-snug flex-1">{p.title}</h3>
                  {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-indigo-400 hover:text-indigo-300 transition"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {p.company && <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md">{p.company}</span>}
                  <span className="text-xs bg-slate-800/60 text-slate-500 px-2 py-0.5 rounded-md">{p.type}</span>
                  {p.tags?.map(t => <span key={t} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md">{t}</span>)}
                  <span className="text-xs text-slate-600 ml-auto">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
              </div>
              <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 10 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-700 text-slate-400 hover:text-white hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition">← Prev</button>
          <span className="px-3 py-1.5 text-sm text-slate-400">{page} / {Math.ceil(total / 10)}</span>
          <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-700 text-slate-400 hover:text-white hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition">Next →</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="font-bold text-white text-lg">{editTarget ? 'Edit Problem' : 'Add Problem'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Problem Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Two Sum" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-amber-500">
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-amber-500">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Company</label>
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="e.g. Google, Amazon" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Problem Link</label>
                  <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://leetcode.com/…" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Briefly describe the problem…" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag, press Enter…" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500" />
                  <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm hover:bg-amber-500 transition"><Plus className="w-4 h-4" /></button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map(t => (
                      <span key={t} className="flex items-center gap-1.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-xs">
                        {t} <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}><X className="w-3 h-3 text-indigo-400/70 hover:text-rose-400" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-slate-700 text-slate-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm bg-amber-600 hover:bg-amber-500 text-white font-medium transition disabled:opacity-60">
                  {submitting ? 'Saving…' : editTarget ? 'Update' : 'Post Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
