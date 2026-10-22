import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Zap,
  Plus,
  Trash2,
  Edit3,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  FolderGit2,
  Tag,
  Users,
  Clock,
  Code2,
  Copy,
  Check
} from 'lucide-react';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const TYPES = ['DSA', 'SYSTEM_DESIGN', 'APTITUDE', 'CODING', 'SQL', 'OTHER'];

const diffColor = {
  EASY: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  MEDIUM: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  HARD: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
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

  // Submissions drawer/modal
  const [submissionsModalProblem, setSubmissionsModalProblem] = useState(null);
  const [submissionsData, setSubmissionsData] = useState(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionTab, setSubmissionTab] = useState('ALL'); // 'ALL' | 'SOLVED' | 'PENDING'
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const defaultForm = {
    title: '',
    description: '',
    link: '',
    company: '',
    difficulty: 'MEDIUM',
    type: 'DSA',
    tags: [],
    tagInput: ''
  };
  const [form, setForm] = useState(defaultForm);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/batches');
        const bList = res.data.batches || [];
        setBatches(bList);
        if (bList.length > 0) setSelectedBatch(bList[0]._id || bList[0].id);
      } catch (err) {
        console.error('Failed to load trainer batches:', err);
      }
    };
    fetchBatches();
  }, []);

  const fetchProblems = useCallback(async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await api.get(
        `/trainer/daily-problems?batchId=${selectedBatch}&page=${page}&limit=20`
      );
      setProblems(res.data.problems || []);
      setTotal(res.data.total || 0);
    } catch {
      showToast('Failed to load problems.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, page]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...defaultForm });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditTarget(p);
    setForm({
      title: p.title,
      description: p.description || '',
      link: p.link || '',
      company: p.company || '',
      difficulty: p.difficulty,
      type: p.type || 'DSA',
      tags: p.tags || [],
      tagInput: ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Title is required.', 'error');
    setSubmitting(true);
    try {
      const payload = {
        batchId: selectedBatch,
        title: form.title,
        description: form.description,
        link: form.link,
        company: form.company,
        difficulty: form.difficulty,
        type: form.type,
        tags: form.tags
      };
      if (editTarget) {
        const res = await api.patch(`/trainer/daily-problems/${editTarget.id}`, payload);
        setProblems((prev) =>
          prev.map((p) => (p.id === editTarget.id ? { ...p, ...res.data.problem } : p))
        );
        showToast('Problem updated!');
      } else {
        await api.post('/trainer/daily-problems', payload);
        await fetchProblems();
        showToast('Problem posted successfully!');
      }
      setShowForm(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save problem.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    try {
      await api.delete(`/trainer/daily-problems/${id}`);
      setProblems((prev) => prev.filter((p) => p.id !== id));
      showToast('Problem deleted.');
    } catch {
      showToast('Failed to delete problem.', 'error');
    }
  };

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t], tagInput: '' }));
    }
  };

  // Open Submissions Modal
  const openSubmissions = async (problem) => {
    setSubmissionsModalProblem(problem);
    setSubmissionsLoading(true);
    setSubmissionTab('ALL');
    setSubmissionSearch('');
    try {
      const res = await api.get(`/trainer/daily-problems/${problem.id}/submissions`);
      if (res.data.success) {
        setSubmissionsData(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load submissions.', 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    showToast('Code copied to clipboard', 'success');
  };

  const filtered = problems.filter((p) => {
    if (filterDiff && p.difficulty !== filterDiff) return false;
    if (
      search &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !(p.company || '').toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Daily Problems (POTD)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Post company-tagged interview challenges and track student completion in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {batches.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <FolderGit2 className="w-4 h-4 text-amber-500" />
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b._id || b.id} value={b._id || b.id} className="dark:bg-slate-900">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={fetchProblems}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Refresh problems"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" /> Add Problem
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems by title, company name, or topic…"
            className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-xs transition"
          />
        </div>
        <select
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value)}
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer font-medium"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d} className="dark:bg-slate-900">
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Problems List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading daily problems…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <Zap className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">No daily problems posted yet for this batch. Click "Add Problem" to post one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const totalStudents = p.totalStudents || 0;
            const solvedCount = p.solvedCount || 0;
            const pendingCount = p.pendingCount || 0;
            const percentSolved = totalStudents > 0 ? Math.round((solvedCount / totalStudents) * 100) : 0;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-400/50 rounded-3xl p-5 sm:p-6 transition shadow-xs hover:shadow-md space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                        diffColor[p.difficulty] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.difficulty}
                    </span>

                    {p.company && (
                      <span className="text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-0.5 rounded-full">
                        {p.company}
                      </span>
                    )}

                    {p.platform && (
                      <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                        {p.platform}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                      Posted {new Date(p.date || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                      title="Edit problem"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                      title="Delete problem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-snug">
                      {p.title}
                    </h3>
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition p-1"
                        title="Open Problem on Platform"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Live Progress & Submissions Banner */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 max-w-md">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{solvedCount} / {totalStudents} Solved</span>
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pendingCount} Pending</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentSolved}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => openSubmissions(p)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View Submissions ({solvedCount})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>
          <span className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* View Submissions Modal */}
      {submissionsModalProblem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                    Student Submissions &amp; Activity
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xl">
                    {submissionsModalProblem.title} &bull; Batch: {submissionsData?.problem?.batchName || 'Cohort'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubmissionsModalProblem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Stats & Filter Bar */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4 shrink-0">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {submissionsData?.stats?.totalStudents || 0}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Students</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {submissionsData?.stats?.solvedCount || 0}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Solved (Completed)</div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {submissionsData?.stats?.pendingCount || 0}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase">Pending Solution</div>
                </div>
              </div>

              {/* Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setSubmissionTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      submissionTab === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All ({submissionsData?.submissions?.length || 0})
                  </button>
                  <button
                    onClick={() => setSubmissionTab('SOLVED')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      submissionTab === 'SOLVED'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Solved ({submissionsData?.stats?.solvedCount || 0})
                  </button>
                  <button
                    onClick={() => setSubmissionTab('PENDING')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      submissionTab === 'PENDING'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Pending ({submissionsData?.stats?.pendingCount || 0})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    placeholder="Search by student or roll no..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {submissionsLoading ? (
                <div className="text-center py-16 space-y-2">
                  <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Loading student submissions…</p>
                </div>
              ) : !submissionsData || submissionsData.submissions?.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No students found in this cohort batch.
                </div>
              ) : (
                submissionsData.submissions
                  .filter((s) => {
                    if (submissionTab === 'SOLVED' && s.status !== 'COMPLETED') return false;
                    if (submissionTab === 'PENDING' && s.status === 'COMPLETED') return false;
                    if (submissionSearch) {
                      const q = submissionSearch.toLowerCase();
                      const matchName = s.name?.toLowerCase().includes(q);
                      const matchRoll = s.rollNumber?.toLowerCase().includes(q);
                      if (!matchName && !matchRoll) return false;
                    }
                    return true;
                  })
                  .map((s) => {
                    const isSolved = s.status === 'COMPLETED';
                    const sub = s.submission;

                    return (
                      <div
                        key={s.studentId}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSolved
                            ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {s.name}
                              </span>
                              {s.rollNumber && (
                                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                  ({s.rollNumber})
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                Sec {s.section}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{s.email}</p>
                          </div>

                          <div>
                            {isSolved ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Submission Details If Solved */}
                        {isSolved && sub && (
                          <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/40 space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {sub.submissionUrl && (
                                <a
                                  href={sub.submissionUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                                >
                                  <ExternalLink className="w-3 h-3" /> {sub.submissionUrl}
                                </a>
                              )}
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                {sub.language && (
                                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300 uppercase">
                                    {sub.language}
                                  </span>
                                )}
                                {sub.timeComplexity && (
                                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300">
                                    Time: {sub.timeComplexity}
                                  </span>
                                )}
                                {sub.spaceComplexity && (
                                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border text-slate-700 dark:text-slate-300">
                                    Space: {sub.spaceComplexity}
                                  </span>
                                )}
                              </div>
                            </div>

                            {sub.approach && (
                              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/30 text-slate-700 dark:text-slate-300 text-xs">
                                <span className="font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase block mb-0.5">Approach:</span>
                                {sub.approach}
                              </div>
                            )}

                            {sub.sourceCode && (
                              <div className="relative">
                                <div className="flex items-center justify-between text-[10px] font-mono bg-slate-900 text-slate-300 px-3 py-1 rounded-t-lg">
                                  <span>Source Code</span>
                                  <button
                                    onClick={() => handleCopyCode(s.studentId, sub.sourceCode)}
                                    className="hover:text-white transition flex items-center gap-1"
                                  >
                                    {copiedCodeId === s.studentId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    {copiedCodeId === s.studentId ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <pre className="p-2.5 rounded-b-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-36">
                                  <code>{sub.sourceCode}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Problem Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    {editTarget ? 'Edit Daily Problem' : 'Post Daily Problem'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add coding challenge for students in this batch.
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
                  Problem Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Trapping Rain Water, LRU Cache…"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d} className="dark:bg-slate-900">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Problem Category
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t} className="dark:bg-slate-900">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Company Tag (Optional)
                  </label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="e.g. Amazon, Google, Microsoft…"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Problem Link
                  </label>
                  <input
                    value={form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    placeholder="https://leetcode.com/problems/…"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Brief Description &amp; Hints
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Problem summary, approach hints, expected complexity…"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Topic Tags
                </label>
                <div className="flex gap-2 mb-2.5">
                  <input
                    value={form.tagInput}
                    onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="e.g. Dynamic Programming, Two Pointers (Press Enter)"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                  >
                    Add
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 px-2.5 py-0.5 rounded-md"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}
                          className="hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-md shadow-amber-600/20"
                >
                  {submitting ? 'Saving…' : editTarget ? 'Update Problem' : 'Post Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
