import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, PlatformBadge } from '../../components/common/Badge';
import {
  ExternalLink,
  Save,
  Send,
  ArrowLeft,
  Check,
  Clock,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Code2,
  Cpu,
  HardDrive,
  Link as LinkIcon,
  Sparkles,
  HelpCircle,
  Copy
} from 'lucide-react';

import { useModal } from '../../context/ModalContext';

const DEFAULT_COMPLEXITY_OPTIONS = ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)', 'O(N²)', 'O(2ⁿ)'];
const LANGUAGE_OPTIONS = [
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'C', value: 'c' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' }
];

const isDeadlinePassed = (lastDate) => {
  if (!lastDate) return false;
  const d = new Date(lastDate);
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    d.setUTCHours(23, 59, 59, 999);
  }
  return new Date() > d;
};

export const MenteeTaskDetails = () => {
  const { id } = useParams();
  const { showConfirm, showSuccess, showError, showToast } = useModal();
  const [menteeTask, setMenteeTask] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [solutions, setSolutions] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState('');

  const parseProblemData = (rawNotes) => {
    if (!rawNotes) {
      return {
        approach: '',
        timeComplexity: '',
        spaceComplexity: '',
        submissionUrl: '',
        sourceCode: '',
        language: 'cpp'
      };
    }
    try {
      const parsed = JSON.parse(rawNotes);
      return {
        approach: parsed.approach || parsed.notes || '',
        timeComplexity: parsed.timeComplexity || '',
        spaceComplexity: parsed.spaceComplexity || '',
        submissionUrl: parsed.submissionUrl || '',
        sourceCode: parsed.sourceCode || '',
        language: parsed.language || 'cpp'
      };
    } catch (e) {
      return {
        approach: rawNotes,
        timeComplexity: '',
        spaceComplexity: '',
        submissionUrl: '',
        sourceCode: '',
        language: 'cpp'
      };
    }
  };

  const fetchTask = async () => {
    try {
      const res = await api.get(`/mentee/tasks/${id}`);
      if (res.data.success) {
        const mt = res.data.menteeTask;
        setMenteeTask(mt);
        setReviews(res.data.reviews || []);

        // Populate local structured solutions map
        const initialSolutions = {};
        (mt.problemProgress || []).forEach((p) => {
          initialSolutions[p.problemId] = parseProblemData(p.notes);
        });
        setSolutions(initialSolutions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleFieldChange = (problemId, field, value) => {
    setSolutions((prev) => ({
      ...prev,
      [problemId]: {
        ...(prev[problemId] || {
          approach: '',
          timeComplexity: '',
          spaceComplexity: '',
          submissionUrl: '',
          sourceCode: '',
          language: 'cpp'
        }),
        [field]: value
      }
    }));
    setSaveStatus((prev) => ({
      ...prev,
      [problemId]: 'unsaved'
    }));
  };

  const task = menteeTask?.taskId;
  const problems = task?.problems || [];
  const isPastDeadline =
    (task?.lastDate && isDeadlinePassed(task.lastDate)) ||
    menteeTask?.isOverdue ||
    menteeTask?.isClosed;
  const isApproved = menteeTask?.status === 'APPROVED';
  const isSubmitted =
    menteeTask?.status === 'SUBMITTED' || menteeTask?.status === 'UNDER_REVIEW';
  const isClosed =
    (isPastDeadline && !isSubmitted && !isApproved) ||
    menteeTask?.status === 'OVERDUE' ||
    menteeTask?.status === 'CLOSED';
  const isLocked = isSubmitted || isApproved || isClosed;

  const handleSaveProblem = async (problemId) => {
    if (isClosed) {
      showError(
        'Task Closed',
        'The deadline for this task has passed. Submissions and changes are closed.'
      );
      return;
    }

    setSaveStatus((prev) => ({ ...prev, [problemId]: 'saving' }));
    try {
      const sol = solutions[problemId] || {};
      await api.patch(`/mentee/tasks/${id}/problems/${problemId}`, {
        approach: sol.approach || '',
        timeComplexity: sol.timeComplexity || '',
        spaceComplexity: sol.spaceComplexity || '',
        submissionUrl: sol.submissionUrl || '',
        sourceCode: sol.sourceCode || '',
        language: sol.language || 'cpp'
      });
      setSaveStatus((prev) => ({ ...prev, [problemId]: 'saved' }));
      showToast('Problem solution saved', 'success', 2000);
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [problemId]: '' }));
      }, 3000);
      fetchTask();
    } catch (err) {
      console.error('Failed to save problem solution', err);
      setSaveStatus((prev) => ({ ...prev, [problemId]: 'error' }));
      showError(
        'Save Error',
        err.response?.data?.message || 'Failed to save problem solution.'
      );
    }
  };

  const handleSubmitTask = async () => {
    if (isClosed) {
      showError(
        'Task Closed',
        'The submission deadline has passed. This task is closed and cannot be submitted. Contact your mentor or administrator if you need a deadline extension.'
      );
      return;
    }

    const confirmed = await showConfirm({
      title: 'Submit Task for Review?',
      message: 'Are you sure you want to submit all your problem solutions for mentor review?',
      details: 'Once submitted, your solutions will be locked until your mentor finishes grading.',
      confirmText: 'Yes, Submit Task',
      cancelText: 'Cancel',
      variant: 'primary'
    });

    if (!confirmed) return;

    setSubmitting(true);
    setSubmitMessage('');
    try {
      const res = await api.post(`/mentee/tasks/${id}/submit`);
      if (res.data.success) {
        setSubmitMessage(res.data.message || 'Task submitted successfully!');
        showSuccess('Task Submitted', res.data.message || 'Task submitted successfully for mentor review!');
        fetchTask();
      }
    } catch (err) {
      showError('Submission Error', err.response?.data?.message || 'Failed to submit task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading task assignment...</p>
      </div>
    );
  }

  if (!menteeTask) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-400">Task assignment not found.</p>
        <Link to="/mentee/tasks" className="text-indigo-400 hover:underline text-xs">
          &larr; Back to Tasks
        </Link>
      </div>
    );
  }

  // Count problems that have approach or submission link or source code
  const filledCount = problems.filter((p) => {
    const sol = solutions[p._id] || {};
    return (
      (sol.approach && sol.approach.trim().length > 0) ||
      (sol.submissionUrl && sol.submissionUrl.trim().length > 0) ||
      (sol.sourceCode && sol.sourceCode.trim().length > 0)
    );
  }).length;

  const latestReview = reviews[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/mentee/tasks"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Weekly Tasks
        </Link>
        <StatusBadge status={menteeTask.status} />
      </div>

      {/* Task Header Box */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Week {task?.weekNo < 10 ? `0${task?.weekNo}` : task?.weekNo} Assignment
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{task?.title}</h1>
        </div>

        {task?.instructions && (
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
            {task.instructions}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Opens: {task?.assignmentDate ? new Date(task.assignmentDate).toLocaleDateString() : 'N/A'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${isClosed ? 'text-rose-500' : 'text-amber-500'}`} />
            Deadline: {task?.lastDate ? new Date(task.lastDate).toLocaleDateString() : 'N/A'}
            {isClosed && (
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                EXPIRED
              </span>
            )}
          </span>
          <span>•</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {problems.length} questions to answer
          </span>
        </div>
      </div>

      {/* Overdue / Closed Deadline Banner */}
      {isClosed && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-100 space-y-2 shadow-sm">
          <div className="flex items-center gap-2.5 font-bold text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Task Incomplete · Submission Deadline Expired</span>
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-200/90 leading-relaxed">
            The due date for this task (
            <strong>
              {task?.lastDate ? new Date(task.lastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </strong>
            ) has ended. As per policy, this task is marked incomplete and can no longer be submitted.
          </p>
          <div className="pt-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
            <span>ℹ️ Need to submit? Ask your mentor or administrator to edit and extend the task due date.</span>
          </div>
        </div>
      )}

      {/* Review Feedback Banner (if returned for corrections) */}
      {menteeTask.status === 'RESUBMISSION_REQUIRED' && latestReview && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Changes Requested by Reviewer
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-200/90 leading-relaxed">
            "{latestReview.overallFeedback}"
          </p>
        </div>
      )}

      {/* Submit Success Message */}
      {submitMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {submitMessage}
        </div>
      )}

      {/* Questions & Problem Solutions List */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Problem Submissions ({problems.length})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Fill approach, complexities, submission link or source code for each question.
          </span>
        </div>

        {problems.map((problem, idx) => {
          const currentSol = solutions[problem._id] || {
            approach: '',
            timeComplexity: '',
            spaceComplexity: '',
            submissionUrl: '',
            sourceCode: '',
            language: 'cpp'
          };
          const status = saveStatus[problem._id];
          const problemReview = latestReview?.problemReviews?.find(
            (pr) => pr.problemId.toString() === problem._id.toString()
          );

          return (
            <div
              key={problem._id}
              className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 hover:border-slate-300 dark:hover:border-slate-700/80 transition shadow-sm hover:shadow-md"
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-500/30">
                    Q{idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{problem.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformBadge platform={problem.platform} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={problem.problemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-300 font-medium transition"
                  >
                    Open Problem Statement ↗ <ExternalLink className="w-3 h-3" />
                  </a>

                  {status === 'saved' && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  )}
                  {status === 'saving' && (
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                      Saving...
                    </span>
                  )}
                  {status === 'unsaved' && (
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20">
                      Unsaved
                    </span>
                  )}
                </div>
              </div>

              {/* Mentor revision feedback for this specific problem if any */}
              {problemReview && (
                <div
                  className={`p-3.5 rounded-xl text-xs space-y-1 ${problemReview.correctionRequired
                    ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}
                >
                  <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {problemReview.correctionRequired ? 'Reviewer Requested Revision' : 'Mentor Comment'}
                  </span>
                  <p className="leading-relaxed">{problemReview.feedback}</p>
                </div>
              )}

              {/* 1. Approach & Idea on Problem */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  Approach & Idea on Problem <span className="text-slate-400 dark:text-slate-500 font-normal">(Algorithm, data structures, intuition)</span>
                </label>
                <textarea
                  rows={4}
                  disabled={isLocked}
                  value={currentSol.approach}
                  onChange={(e) => handleFieldChange(problem._id, 'approach', e.target.value)}
                  placeholder="Explain how you solved this problem: intuition, key algorithm/data structure choices, step-by-step logic, and handling of edge cases..."
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed leading-relaxed font-sans"
                />
              </div>

              {/* 2. Complexities: Time & Space */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Complexity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Time Complexity
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">e.g. O(N log N)</span>
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={currentSol.timeComplexity}
                    onChange={(e) => handleFieldChange(problem._id, 'timeComplexity', e.target.value)}
                    placeholder="e.g. O(N) or O(N log N)"
                    className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                  />
                  {!isLocked && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {DEFAULT_COMPLEXITY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleFieldChange(problem._id, 'timeComplexity', opt)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 font-mono transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Space Complexity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" /> Space Complexity
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">e.g. O(1) or O(N)</span>
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={currentSol.spaceComplexity}
                    onChange={(e) => handleFieldChange(problem._id, 'spaceComplexity', e.target.value)}
                    placeholder="e.g. O(1) or O(N)"
                    className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                  />
                  {!isLocked && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {['O(1)', 'O(N)', 'O(N²)', 'O(log N)'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleFieldChange(problem._id, 'spaceComplexity', opt)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-300 dark:hover:border-cyan-500/40 font-mono transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Platform Submission Link */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Platform Submission URL
                  </label>
                  {currentSol.submissionUrl && (
                    <a
                      href={
                        currentSol.submissionUrl.startsWith('http')
                          ? currentSol.submissionUrl
                          : `https://${currentSol.submissionUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-1 transition"
                    >
                      Verify Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  disabled={isLocked}
                  value={currentSol.submissionUrl}
                  onChange={(e) => handleFieldChange(problem._id, 'submissionUrl', e.target.value)}
                  placeholder="https://leetcode.com/submissions/detail/... or platform submission link"
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                />
              </div>

              {/* 4. Source Code (if no submission link or for direct code review) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Source Code
                    <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional if submission link provided, or paste your solution code)</span>
                  </label>

                  {/* Language Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Language:</span>
                    <select
                      disabled={isLocked}
                      value={currentSol.language || 'cpp'}
                      onChange={(e) => handleFieldChange(problem._id, 'language', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-900 dark:bg-slate-950">
                  <textarea
                    rows={6}
                    disabled={isLocked}
                    value={currentSol.sourceCode}
                    onChange={(e) => handleFieldChange(problem._id, 'sourceCode', e.target.value)}
                    placeholder="// Paste your clean source code here..."
                    className="w-full bg-transparent p-3.5 text-xs text-emerald-400 dark:text-emerald-300 placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed resize-y disabled:opacity-60"
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Save Problem Button */}
              {!isLocked && (
                <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <button
                    onClick={() => handleSaveProblem(problem._id)}
                    disabled={status === 'saving'}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium text-xs transition border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    {status === 'saving' ? 'Saving Question Solution...' : 'Save Question Solution'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            {filledCount} of {problems.length} questions completed
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isClosed
              ? 'Deadline has passed · Task is marked incomplete and submissions are closed.'
              : isLocked
              ? `Task is ${menteeTask.status.toLowerCase().replace('_', ' ')} · Submissions locked.`
              : 'Save solutions for each question. When finished, submit the complete task for mentor evaluation.'}
          </span>
        </div>

        {isClosed ? (
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-500/30">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            Submission Closed · Due Date Expired
          </div>
        ) : !isLocked ? (
          <button
            onClick={handleSubmitTask}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting...' : 'SUBMIT TASK FOR REVIEW'}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Submitted & Locked for Evaluation
          </div>
        )}
      </div>
    </div>
  );
};

