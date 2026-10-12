import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge, PlatformBadge } from '../../components/common/Badge';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Star,
  Clock,
  History,
  MessageSquare,
  Code2,
  Cpu,
  HardDrive,
  Link as LinkIcon,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

import { useModal } from '../../context/ModalContext';

export const ReviewDetails = () => {
  const { id } = useParams();
  const { showSuccess, showError, showWarning, showToast } = useModal();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Review Form State
  const [decision, setDecision] = useState('APPROVED');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [score, setScore] = useState(9);
  const [problemReviews, setProblemReviews] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const parseProblemSnapshot = (snapshotEntry, currentProgress) => {
    // Check if snapshotEntry has structured fields
    if (snapshotEntry && typeof snapshotEntry === 'object') {
      if (snapshotEntry.approach !== undefined || snapshotEntry.timeComplexity !== undefined) {
        return snapshotEntry;
      }
    }
    const raw = snapshotEntry?.notes || currentProgress?.notes || '';
    if (!raw) return { approach: '', timeComplexity: '', spaceComplexity: '', submissionUrl: '', sourceCode: '', language: 'cpp', notes: '' };
    try {
      const parsed = JSON.parse(raw);
      return {
        approach: parsed.approach || parsed.notes || '',
        timeComplexity: parsed.timeComplexity || '',
        spaceComplexity: parsed.spaceComplexity || '',
        submissionUrl: parsed.submissionUrl || '',
        sourceCode: parsed.sourceCode || '',
        language: parsed.language || 'cpp',
        notes: parsed.notes || ''
      };
    } catch (e) {
      return {
        approach: raw,
        timeComplexity: '',
        spaceComplexity: '',
        submissionUrl: '',
        sourceCode: '',
        language: 'cpp',
        notes: raw
      };
    }
  };

  const copyToClipboard = (text, probId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCodeId(probId);
    showToast('Source code copied to clipboard', 'success', 2000);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const fetchReviewDetails = async () => {
    try {
      const res = await api.get(`/mentor/task-reviews/${id}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewDetails();
  }, [id]);

  const handleProblemFeedbackChange = (problemId, field, value) => {
    setProblemReviews((prev) => ({
      ...prev,
      [problemId]: {
        ...(prev[problemId] || { feedback: '', correctionRequired: false }),
        [field]: value
      }
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (decision === 'RESUBMISSION_REQUIRED' && !overallFeedback.trim()) {
      showWarning('Feedback Required', 'Please provide overall feedback explaining what improvements are required before requesting resubmission.');
      return;
    }

    setSubmittingReview(true);
    setSuccessMessage('');

    try {
      const payloadProblemReviews = Object.entries(problemReviews).map(
        ([problemId, val]) => ({
          problemId,
          feedback: val.feedback || '',
          correctionRequired: !!val.correctionRequired
        })
      );

      const res = await api.post(`/mentor/task-reviews/${id}/review`, {
        decision,
        overallFeedback,
        score: decision === 'APPROVED' ? Number(score) : null,
        problemReviews: payloadProblemReviews
      });

      if (res.data.success) {
        setSuccessMessage(res.data.message);
        showSuccess('Review Submitted', res.data.message || 'The review decision has been recorded and the mentee has been notified.');
        fetchReviewDetails();
      }
    } catch (err) {
      showError('Submission Failed', err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading submission data...</div>;
  }

  if (!data?.menteeTask) {
    return <div className="text-center py-12 text-slate-400">Submission not found.</div>;
  }

  const { menteeTask, menteeProfile, codingProfile, submissions, reviewHistory } = data;
  const task = menteeTask.taskId;
  const mentee = menteeTask.menteeId;
  const latestSub = submissions[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/mentor/reviews"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Review Queue
        </Link>
        <StatusBadge status={menteeTask.status} />
      </div>

      {/* Header Info */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Week {task?.weekNo} Submission Review
            </span>
            <h1 className="text-2xl font-bold text-white">{task?.title}</h1>
            <p className="text-xs text-slate-400">
              Submitted by <strong className="text-white">{mentee?.name}</strong> (Roll:{' '}
              {menteeProfile?.rollNumber || 'N/A'})
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1">
            <div>
              Version: <span className="text-white font-mono font-bold">v{latestSub?.version || 1}</span>
            </div>
            <div>
              Submitted:{' '}
              <span className="text-white">
                {menteeTask.submittedAt
                  ? new Date(menteeTask.submittedAt).toLocaleString()
                  : 'Not yet'}
              </span>
            </div>
            {latestSub?.submittedLate && (
              <span className="inline-block text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold">
                ⚠️ Late Submission
              </span>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {successMessage}
        </div>
      )}

      {/* Problems & Solutions Inspection */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" /> Student Problem Submissions ({task?.problems?.length || 0})
          </h2>
          <span className="text-xs text-slate-400">
            Inspect algorithmic approach, complexities, platform link, and code.
          </span>
        </div>

        {task?.problems?.map((prob, idx) => {
          // Find snapshot note or current progress note
          const snapshotEntry = latestSub?.problemSnapshot?.find(
            (ps) => (ps.problemId || ps._id)?.toString() === prob._id?.toString()
          );
          const currentProgress = menteeTask.problemProgress?.find(
            (p) => (p.problemId || p._id)?.toString() === prob._id?.toString()
          );

          const solutionData = parseProblemSnapshot(snapshotEntry, currentProgress);

          const currentFeedback = problemReviews[prob._id]?.feedback || '';
          const currentCorrection = problemReviews[prob._id]?.correctionRequired || false;

          return (
            <div
              key={prob._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5"
            >
              {/* Problem Title & Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-xs font-bold border border-indigo-500/30">
                    Q{idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{prob.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformBadge platform={prob.platform} />
                    </div>
                  </div>
                </div>

                <a
                  href={prob.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-medium transition"
                >
                  View Problem Statement ↗ <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 1. Approach & Idea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Algorithm Approach & Intuition
                </label>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {solutionData.approach && solutionData.approach.trim().length > 0 ? (
                    solutionData.approach
                  ) : (
                    <span className="text-slate-500 italic">
                      [No approach or explanation recorded for this problem]
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Complexities & Submission Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Time Complexity */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> Time Complexity
                  </span>
                  <p className="font-mono text-white text-xs font-bold">
                    {solutionData.timeComplexity || (
                      <span className="text-slate-500 font-normal italic">Not specified</span>
                    )}
                  </p>
                </div>

                {/* Space Complexity */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-semibold">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Space Complexity
                  </span>
                  <p className="font-mono text-white text-xs font-bold">
                    {solutionData.spaceComplexity || (
                      <span className="text-slate-500 font-normal italic">Not specified</span>
                    )}
                  </p>
                </div>

                {/* Platform Submission Link */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-semibold">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-400" /> Platform Link
                  </span>
                  <div>
                    {solutionData.submissionUrl ? (
                      <a
                        href={
                          solutionData.submissionUrl.startsWith('http')
                            ? solutionData.submissionUrl
                            : `https://${solutionData.submissionUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 hover:underline font-mono text-[11px] flex items-center gap-1 truncate"
                      >
                        Platform Submission ↗ <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-500 text-xs italic">No link provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Source Code */}
              {solutionData.sourceCode && solutionData.sourceCode.trim().length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-purple-400" /> Submitted Source Code
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {solutionData.language || 'cpp'}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => copyToClipboard(solutionData.sourceCode, prob._id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition"
                    >
                      {copiedCodeId === prob._id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed max-h-80 whitespace-pre">
                    {solutionData.sourceCode}
                  </div>
                </div>
              )}

              {/* Problem-Specific Mentor Feedback Inputs */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-300">
                    Evaluation Note on Problem {idx + 1}:
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-rose-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentCorrection}
                      onChange={(e) =>
                        handleProblemFeedbackChange(
                          prob._id,
                          'correctionRequired',
                          e.target.checked
                        )
                      }
                      className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                    />
                    Requires Revision
                  </label>
                </div>
                <input
                  type="text"
                  value={currentFeedback}
                  onChange={(e) =>
                    handleProblemFeedbackChange(prob._id, 'feedback', e.target.value)
                  }
                  placeholder="e.g. Good time complexity analysis, consider corner cases where n=1..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Submission Form */}
      <form
        onSubmit={handleReviewSubmit}
        className="glass-panel p-6 rounded-2xl border border-indigo-500/20 space-y-5"
      >
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-400" /> Review Verification & Decision
        </h2>

        {/* Decision Toggle */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDecision('APPROVED')}
            className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${decision === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Approve Task
          </button>

          <button
            type="button"
            onClick={() => setDecision('RESUBMISSION_REQUIRED')}
            className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${decision === 'RESUBMISSION_REQUIRED'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-400" /> Request Resubmission
          </button>
        </div>

        {/* Score Field (if approved) */}
        {decision === 'APPROVED' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" /> Task Score (out of 10)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400">/ 10 points</span>
            </div>
          </div>
        )}

        {/* Overall Feedback */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Overall Mentor Feedback{' '}
            {decision === 'RESUBMISSION_REQUIRED' && (
              <span className="text-rose-400">* (Required)</span>
            )}
          </label>
          <textarea
            rows={3}
            required={decision === 'RESUBMISSION_REQUIRED'}
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            placeholder={
              decision === 'APPROVED'
                ? 'Great problem solving notes and clean implementation...'
                : 'Explain what needs correction before approval...'
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
          />
        </div>

        <button
          type="submit"
          disabled={submittingReview}
          className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ${decision === 'APPROVED'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
            }`}
        >
          <Send className="w-3.5 h-3.5" />
          {submittingReview
            ? 'Submitting Review...'
            : decision === 'APPROVED'
              ? 'Finalize & Approve Task'
              : 'Send Resubmission Request'}
        </button>
      </form>

      {/* Review History Logs */}
      {reviewHistory && reviewHistory.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" /> Past Review History
          </h2>

          <div className="space-y-3">
            {reviewHistory.map((rev) => (
              <div
                key={rev._id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">
                    Review by {rev.reviewerId?.name}
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${rev.decision === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                      }`}
                  >
                    {rev.decision} {rev.score !== null ? `(${rev.score}/10)` : ''}
                  </span>
                </div>
                <p className="text-slate-400 italic">"{rev.overallFeedback}"</p>
                <span className="text-[10px] text-slate-500 block">
                  {new Date(rev.reviewedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
