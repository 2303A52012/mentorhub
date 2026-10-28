import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink,
  Code2,
  Search,
  Filter,
  AlertCircle,
  Copy,
  Check,
  Edit3,
  X,
  Send,
  Building2,
  Layers,
  Sparkles
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';

const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD'];
const COMPLEXITY_OPTIONS = ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)', 'O(N²)', 'O(2ⁿ)'];
const LANGUAGE_OPTIONS = [
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'C', value: 'c' }
];

const diffBadge = {
  EASY: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  MEDIUM: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  HARD: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
};

export const MenteeDailyProblems = () => {
  const { showSuccess, showError, showToast } = useModal();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SOLVED' | 'PENDING'

  // Submission modal state
  const [activeProblem, setActiveProblem] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    submissionUrl: '',
    language: 'cpp',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    approach: '',
    sourceCode: ''
  });

  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/trainer/daily-problems?limit=50');
      if (res.data.success) {
        setProblems(res.data.problems || []);
      }
    } catch (err) {
      console.error('Failed to load daily problems:', err);
      showError('Error', err.response?.data?.message || 'Failed to load daily problems.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleOpenSolve = (p) => {
    setActiveProblem(p);
    const existing = p.mySubmission;
    if (existing) {
      setSubmissionForm({
        submissionUrl: existing.submissionUrl || '',
        language: existing.language || 'cpp',
        timeComplexity: existing.timeComplexity || 'O(N)',
        spaceComplexity: existing.spaceComplexity || 'O(1)',
        approach: existing.approach || '',
        sourceCode: existing.sourceCode || ''
      });
    } else {
      setSubmissionForm({
        submissionUrl: '',
        language: 'cpp',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        approach: '',
        sourceCode: ''
      });
    }
    setShowSubmitModal(true);
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!submissionForm.submissionUrl.trim() && !submissionForm.sourceCode.trim() && !submissionForm.approach.trim()) {
      showToast('Please provide a submission URL, code, or approach.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/trainer/daily-problems/${activeProblem.id}/submit`, submissionForm);
      if (res.data.success) {
        showSuccess('Problem Submitted!', 'Great job! Your solution has been saved and marked as completed.');
        setShowSubmitModal(false);
        fetchProblems();
      }
    } catch (err) {
      showError('Submission Failed', err.response?.data?.message || 'Failed to submit problem solution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
    showToast('Code copied to clipboard', 'success');
  };

  // Filter problems
  const filteredProblems = problems.filter((p) => {
    if (diffFilter !== 'ALL' && p.difficulty !== diffFilter) return false;
    if (statusFilter === 'SOLVED' && !p.isSolved) return false;
    if (statusFilter === 'PENDING' && p.isSolved) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchCompany = (p.company || '').toLowerCase().includes(q);
      const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchCompany && !matchTags) return false;
    }
    return true;
  });

  const totalSolved = problems.filter(p => p.isSolved).length;
  const totalPending = problems.length - totalSolved;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Zap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Daily Problems (POTD)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Interview Prep
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
              Solve company-tagged technical interview questions posted by your corporate trainers. Fill in your approach, complexity, and submission link to mark each problem as completed.
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-center">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{totalSolved}</div>
            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Solved</div>
          </div>
          <div className="px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-center">
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">{totalPending}</div>
            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase">Pending</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems by title, company, or topics..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending Only</option>
            <option value="SOLVED">Solved Only</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Difficulties' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Problems Feed */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading daily problems...</p>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <Zap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Daily Problems Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {problems.length === 0
              ? 'Your corporate trainer has not posted any daily problems for your batch yet. Check back soon!'
              : 'No problems match your current search or status filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProblems.map((p) => {
            const isCompleted = p.isSolved;
            const sub = p.mySubmission;

            return (
              <div
                key={p.id}
                className={`glass-panel p-6 rounded-3xl border transition-all duration-200 shadow-xs space-y-4 ${
                  isCompleted
                    ? 'border-emerald-300/60 dark:border-emerald-500/20 bg-white dark:bg-slate-900/70'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-amber-400/50'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.company && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {p.company}
                      </span>
                    )}

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                        diffBadge[p.difficulty] || diffBadge.MEDIUM
                      }`}
                    >
                      {p.difficulty}
                    </span>

                    {/* Who posted it tag */}
                    {p.postedBy && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          p.postedBy.role === 'MENTOR'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : p.postedBy.role === 'TRAINER'
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <span>
                          👤 {p.postedBy.role === 'MENTOR' ? 'Mentor' : p.postedBy.role === 'TRAINER' ? 'Trainer' : 'Admin'}: {p.postedBy.name}
                        </span>
                      </span>
                    )}

                    {/* Cohort Scope Badge */}
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {p.isAllBatches ? '🌐 All Batches (496 Students)' : `👥 Batch: ${p.batch?.name || 'Cohort'}`}
                    </span>

                    {/* 24-Hour Freeze Badge */}
                    {p.isFrozen ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                        ❄️ Frozen (24h Window Closed)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                        ⏳ Active (24h Window)
                      </span>
                    )}

                    {p.platform && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {p.platform}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                      Posted {new Date(p.date || p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCompleted ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Solved &amp; Completed
                      </span>
                    ) : p.isFrozen ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
                        ❄️ Frozen
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                        <Clock className="w-3.5 h-3.5" /> Pending Solution
                      </span>
                    )}
                  </div>
                </div>

                {/* Problem Info */}
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {p.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* If Solved: Show Submission Snippet */}
                {isCompleted && sub && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-500/20 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Your Submitted Solution</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          &bull; {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.language && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 uppercase">
                            {sub.language}
                          </span>
                        )}
                        {sub.timeComplexity && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            Time: {sub.timeComplexity}
                          </span>
                        )}
                        {sub.spaceComplexity && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            Space: {sub.spaceComplexity}
                          </span>
                        )}
                      </div>
                    </div>

                    {sub.submissionUrl && (
                      <div className="text-xs">
                        <a
                          href={sub.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium font-mono text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" /> {sub.submissionUrl}
                        </a>
                      </div>
                    )}

                    {sub.approach && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                        <div className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Approach / Logic:
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{sub.approach}</p>
                      </div>
                    )}

                    {sub.sourceCode && (
                      <div className="relative">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-900 text-slate-300 px-3.5 py-1.5 rounded-t-xl">
                          <span>Code ({sub.language})</span>
                          <button
                            onClick={() => handleCopyCode(p.id, sub.sourceCode)}
                            className="hover:text-white transition flex items-center gap-1 text-[10px]"
                          >
                            {copiedCodeId === p.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedCodeId === p.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-3.5 rounded-b-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-48">
                          <code>{sub.sourceCode}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {p.link ? (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open on {p.platform || 'Platform'}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No external link provided</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isFrozen && !isCompleted ? (
                      <span className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-not-allowed">
                        <span>❄️ Submission Closed (24h Expired)</span>
                      </span>
                    ) : p.isFrozen && isCompleted ? (
                      <button
                        onClick={() => handleOpenSolve(p)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>View Solution &amp; Evaluation</span>
                      </button>
                    ) : isCompleted ? (
                      <button
                        onClick={() => handleOpenSolve(p)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Solution</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSolve(p)}
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-amber-600/30 font-bold"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Solve &amp; Mark as Done</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Solve / Submit Solution Modal */}
      {showSubmitModal && activeProblem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">
                    {activeProblem.isSolved ? 'Update Problem Solution' : 'Submit Problem of the Day'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                    {activeProblem.title} &bull; {activeProblem.company || 'Practice Problem'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitSolution} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Problem Frozen Alert */}
              {activeProblem.isFrozen && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Problem is frozen: The 24-hour window from posting has expired. Solutions can no longer be submitted or edited.</span>
                </div>
              )}

              {/* Problem Quick Link Ribbon */}
              {activeProblem.link && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    First solved on the platform? Keep your submission link handy.
                  </span>
                  <a
                    href={activeProblem.link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs inline-flex items-center gap-1 shrink-0 transition"
                  >
                    Open Problem <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Submission URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Submission Link (URL) *
                </label>
                <input
                  type="url"
                  value={submissionForm.submissionUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, submissionUrl: e.target.value })}
                  placeholder="e.g. https://leetcode.com/submissions/detail/123456789/ or GitHub link"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
                />
              </div>

              {/* Language, Time & Space Complexity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Language
                  </label>
                  <select
                    value={submissionForm.language}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, language: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value} className="dark:bg-slate-900">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Time Complexity
                  </label>
                  <input
                    type="text"
                    value={submissionForm.timeComplexity}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, timeComplexity: e.target.value })}
                    placeholder="e.g. O(N log N)"
                    list="tc-options"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <datalist id="tc-options">
                    {COMPLEXITY_OPTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Space Complexity
                  </label>
                  <input
                    type="text"
                    value={submissionForm.spaceComplexity}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, spaceComplexity: e.target.value })}
                    placeholder="e.g. O(1) or O(N)"
                    list="sc-options"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <datalist id="sc-options">
                    {COMPLEXITY_OPTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Approach & Logic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Approach &amp; Intuition
                </label>
                <textarea
                  rows={3}
                  value={submissionForm.approach}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, approach: e.target.value })}
                  placeholder="Explain your approach, edge cases handled, data structures utilized..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              {/* Source Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Clean Solution Code
                </label>
                <textarea
                  rows={6}
                  value={submissionForm.sourceCode}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, sourceCode: e.target.value })}
                  placeholder="// Paste your working solution code here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || activeProblem.isFrozen}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : activeProblem.isFrozen ? '❄️ Submissions Closed' : 'Mark as Done & Submit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
