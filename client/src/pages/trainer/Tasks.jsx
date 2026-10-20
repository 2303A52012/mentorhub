import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Plus, Trash2, Edit3, X, AlertCircle, CheckCircle2,
  RefreshCw, Search, Calendar, Users, User, Layers, ExternalLink,
  Clock, ChevronRight
} from 'lucide-react';

const statusColor = {
  DRAFT: 'text-slate-400 bg-slate-800 border-slate-700',
  ACTIVE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  COMPLETED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CLOSED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const PLATFORMS = ['LEETCODE','HACKERRANK','CODEFORCES','CODECHEF','GFG','OTHER'];

export const TrainerTasks = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [batchStudents, setBatchStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultForm = {
    title: '', weekNo: 1, assignmentDate: new Date().toISOString().split('T')[0],
    lastDate: (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })(),
    instructions: '', targetType: 'BATCH', selectedBatchId: '', selectedMenteeIds: [],
    problems: [{ name: '', problemUrl: '', platform: 'LEETCODE' }]
  };
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
        if (tb.length > 0) {
          const bId = tb[0].batch.id;
          setForm(f => ({ ...f, selectedBatchId: bId }));
        }
      } catch {}
    };
    fetchBatches();
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks?role=TRAINER');
      setTasks(res.data.tasks || []);
    } catch { showToast('Failed to load tasks.', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const fetchBatchStudents = async (batchId) => {
    if (!batchId) return;
    try {
      const res = await api.get(`/trainer/batches/${batchId}/students`);
      setBatchStudents(res.data.students || []);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Title is required.', 'error');
    if (form.problems.some(p => !p.name.trim())) return showToast('All problems need a name.', 'error');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title, weekNo: form.weekNo,
        assignmentDate: new Date(form.assignmentDate).toISOString(),
        lastDate: new Date(form.lastDate).toISOString(),
        instructions: form.instructions, problems: form.problems,
        targetType: form.targetType,
        batchId: form.selectedBatchId,
        menteeIds: form.targetType === 'CUSTOM' ? form.selectedMenteeIds : undefined,
      };
      await api.post('/tasks', payload);
      await fetchTasks();
      setShowForm(false);
      setForm(defaultForm);
      showToast('Task assigned successfully!');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create task.', 'error'); }
    finally { setSubmitting(false); }
  };

  const addProblem = () => setForm(f => ({ ...f, problems: [...f.problems, { name: '', problemUrl: '', platform: 'LEETCODE' }] }));
  const removeProblem = (i) => setForm(f => ({ ...f, problems: f.problems.filter((_, idx) => idx !== i) }));
  const updateProblem = (i, field, val) => setForm(f => ({ ...f, problems: f.problems.map((p, idx) => idx === i ? { ...p, [field]: val } : p) }));

  const toggleMentee = (id) => setForm(f => ({ ...f, selectedMenteeIds: f.selectedMenteeIds.includes(id) ? f.selectedMenteeIds.filter(x => x !== id) : [...f.selectedMenteeIds, id] }));

  const filtered = tasks.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

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
          <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/30"><CheckSquare className="w-6 h-6 text-blue-400" /></div>
          <div><h1 className="text-2xl font-bold text-white">Weekly Tasks</h1><p className="text-sm text-slate-400">Assign tasks to your batch or custom group</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTasks} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition"><Plus className="w-4 h-4" /> Create Task</button>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <CheckSquare className="w-12 h-12 opacity-20" /><p>No tasks yet. Create your first task!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-2xl p-4 cursor-pointer transition group" onClick={() => navigate(`/trainer/tasks/${t.id}`)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-xs border px-2 py-0.5 rounded-full ${statusColor[t.status]}`}>{t.status}</span>
                    <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">Week {t.weekNo}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm group-hover:text-blue-300 transition">{t.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(t.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>{t._count?.problems || t.problems?.length || 0} problems</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="font-bold text-white text-lg">Create New Task</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Task Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Arrays & Strings — Week 3" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Week No.</label>
                  <input type="number" min="1" value={form.weekNo} onChange={e => setForm(f => ({ ...f, weekNo: parseInt(e.target.value) }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Due Date *</label>
                  <input type="date" value={form.lastDate} onChange={e => setForm(f => ({ ...f, lastDate: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" required />
                </div>
              </div>

              {/* Target */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Assign To</label>
                <div className="flex gap-2 mb-3">
                  {[{ v: 'BATCH', label: 'Entire Batch', icon: Layers }, { v: 'CUSTOM', label: 'Custom (select students)', icon: Users }].map(opt => (
                    <button key={opt.v} type="button" onClick={() => { setForm(f => ({ ...f, targetType: opt.v, selectedMenteeIds: [] })); if (opt.v === 'CUSTOM') fetchBatchStudents(form.selectedBatchId); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition ${form.targetType === opt.v ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                      <opt.icon className="w-4 h-4" />{opt.label}
                    </button>
                  ))}
                </div>
                {batches.length > 0 && (
                  <select value={form.selectedBatchId} onChange={e => { setForm(f => ({ ...f, selectedBatchId: e.target.value })); if (form.targetType === 'CUSTOM') fetchBatchStudents(e.target.value); }} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
                {form.targetType === 'CUSTOM' && batchStudents.length > 0 && (
                  <div className="mt-2 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1">
                    {batchStudents.map(s => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-800 transition">
                        <input type="checkbox" checked={form.selectedMenteeIds.includes(s.id)} onChange={() => toggleMentee(s.id)} className="accent-blue-500" />
                        <span className="text-sm text-slate-300">{s.name}</span>
                        <span className="text-xs text-slate-500 ml-auto">{s.email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Instructions</label>
                <textarea rows={3} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Instructions for students…" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none" />
              </div>

              {/* Problems */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Problems</label>
                  <button type="button" onClick={addProblem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"><Plus className="w-3 h-3" /> Add Problem</button>
                </div>
                <div className="space-y-3">
                  {form.problems.map((p, i) => (
                    <div key={i} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Problem {i + 1}</span>
                        {form.problems.length > 1 && <button type="button" onClick={() => removeProblem(i)} className="text-rose-400 hover:text-rose-300 transition"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={p.name} onChange={e => updateProblem(i, 'name', e.target.value)} placeholder="Problem name *" className="col-span-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                        <input value={p.problemUrl} onChange={e => updateProblem(i, 'problemUrl', e.target.value)} placeholder="URL (optional)" className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                        <select value={p.platform} onChange={e => updateProblem(i, 'platform', e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500">
                          {PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-slate-700 text-slate-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-60">
                  {submitting ? 'Creating…' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
