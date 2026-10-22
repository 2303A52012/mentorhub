import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit3,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Calendar,
  Users,
  User,
  Layers,
  ExternalLink,
  Clock,
  ChevronRight
} from 'lucide-react';

const statusColor = {
  DRAFT: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  ACTIVE: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  COMPLETED: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  CLOSED: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
};

const PLATFORMS = ['LEETCODE', 'HACKERRANK', 'CODEFORCES', 'CODECHEF', 'GFG', 'OTHER'];

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
    title: '',
    weekNo: 1,
    assignmentDate: new Date().toISOString().split('T')[0],
    lastDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })(),
    instructions: '',
    targetType: 'BATCH',
    selectedBatchId: '',
    selectedMenteeIds: [],
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
        const bList = tb.map((t) => t.batch).filter(Boolean);
        setBatches(bList);
        if (bList.length > 0) {
          const bId = bList[0].id;
          setForm((f) => ({ ...f, selectedBatchId: bId }));
        }
      } catch (err) {
        console.error('Failed to fetch trainer batches:', err);
      }
    };
    fetchBatches();
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks?role=TRAINER');
      setTasks(res.data.tasks || []);
    } catch {
      showToast('Failed to load tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchBatchStudents = async (batchId) => {
    if (!batchId) return;
    try {
      const res = await api.get(`/trainer/batches/${batchId}/students`);
      setBatchStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to load batch students:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Title is required.', 'error');
    if (form.problems.some((p) => !p.name.trim())) return showToast('All problems need a name.', 'error');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        weekNo: form.weekNo,
        assignmentDate: new Date(form.assignmentDate).toISOString(),
        lastDate: new Date(form.lastDate).toISOString(),
        instructions: form.instructions,
        problems: form.problems,
        targetType: form.targetType,
        batchId: form.selectedBatchId,
        menteeIds: form.targetType === 'CUSTOM' ? form.selectedMenteeIds : undefined,
      };
      await api.post('/tasks', payload);
      await fetchTasks();
      setShowForm(false);
      setForm(defaultForm);
      showToast('Task assigned successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create task.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addProblem = () =>
    setForm((f) => ({
      ...f,
      problems: [...f.problems, { name: '', problemUrl: '', platform: 'LEETCODE' }]
    }));

  const removeProblem = (i) =>
    setForm((f) => ({
      ...f,
      problems: f.problems.filter((_, idx) => idx !== i)
    }));

  const updateProblem = (i, field, val) =>
    setForm((f) => ({
      ...f,
      problems: f.problems.map((p, idx) => (idx === i ? { ...p, [field]: val } : p))
    }));

  const toggleMentee = (id) =>
    setForm((f) => ({
      ...f,
      selectedMenteeIds: f.selectedMenteeIds.includes(id)
        ? f.selectedMenteeIds.filter((x) => x !== id)
        : [...f.selectedMenteeIds, id]
    }));

  const filtered = tasks.filter(
    (t) => !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6 transition-colors duration-200 font-sans">
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Weekly Tasks
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assign problem sets, track student completion, and review code submissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTasks}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assigned tasks by title…"
          className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xs transition"
        />
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading tasks…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <CheckSquare className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">No tasks found. Create your first task above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate(`/trainer/tasks/${t.id}`)}
              className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 cursor-pointer transition group shadow-xs hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[11px] font-bold border px-2.5 py-0.5 rounded-full ${statusColor[t.status] || 'bg-slate-100 text-slate-600'}`}>
                      {t.status}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      Week {t.weekNo}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-300 transition">
                    {t.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Due: {new Date(t.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span>&bull;</span>
                    <span>{t._count?.problems || t.problems?.length || 0} problem{(t._count?.problems || t.problems?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">Create New Task</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Assign a problem set to your cohort batch.</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Task Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Arrays & Strings &mdash; Week 3"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Week Number</label>
                  <input
                    type="number"
                    min="1"
                    value={form.weekNo}
                    onChange={(e) => setForm((f) => ({ ...f, weekNo: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    value={form.lastDate}
                    onChange={(e) => setForm((f) => ({ ...f, lastDate: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Target Assignment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Assign To</label>
                <div className="flex gap-2 mb-3">
                  {[
                    { v: 'BATCH', label: 'Entire Batch', icon: Layers },
                    { v: 'CUSTOM', label: 'Custom (Select Students)', icon: Users }
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, targetType: opt.v, selectedMenteeIds: [] }));
                        if (opt.v === 'CUSTOM') fetchBatchStudents(form.selectedBatchId);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition ${
                        form.targetType === opt.v
                          ? 'bg-blue-100 dark:bg-blue-600/20 border-blue-300 dark:border-blue-500 text-blue-800 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>

                {batches.length > 0 && (
                  <select
                    value={form.selectedBatchId}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, selectedBatchId: e.target.value }));
                      if (form.targetType === 'CUSTOM') fetchBatchStudents(e.target.value);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id} className="dark:bg-slate-900">
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}

                {form.targetType === 'CUSTOM' && batchStudents.length > 0 && (
                  <div className="mt-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-800/40">
                    {batchStudents.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                      >
                        <input
                          type="checkbox"
                          checked={form.selectedMenteeIds.includes(s.id)}
                          onChange={() => toggleMentee(s.id)}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.name}</span>
                        <span className="text-[11px] text-slate-500 ml-auto font-mono">{s.email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Instructions &amp; Requirements</label>
                <textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="Submission instructions, expected time complexities, constraints…"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Problems list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Problem List ({form.problems.length})</label>
                  <button
                    type="button"
                    onClick={addProblem}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Problem
                  </button>
                </div>
                <div className="space-y-2.5">
                  {form.problems.map((p, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Problem #{i + 1}</span>
                        {form.problems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProblem(i)}
                            className="p-1 text-rose-500 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={p.name}
                          onChange={(e) => updateProblem(i, 'name', e.target.value)}
                          placeholder="Problem name *"
                          className="sm:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          value={p.problemUrl}
                          onChange={(e) => updateProblem(i, 'problemUrl', e.target.value)}
                          placeholder="Problem URL (e.g. https://leetcode.com/...)"
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <select
                          value={p.platform}
                          onChange={(e) => updateProblem(i, 'platform', e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          {PLATFORMS.map((pl) => (
                            <option key={pl} value={pl} className="dark:bg-slate-900">
                              {pl}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
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
