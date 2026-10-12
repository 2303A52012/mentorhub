import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/Badge';
import { FileCheck, Search, Filter, Clock, Star, ArrowRight } from 'lucide-react';

export const MentorTaskReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/mentor/task-reviews', { params });
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Submission Verification & Reviews
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review student solutions, problem-solving notes, assign scores, approve or request resubmissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Review Statuses</option>
            <option value="AWAITING_REVIEW">⚡ Awaiting Review</option>
            <option value="RESUBMISSION_REQUIRED">Changes Requested</option>
            <option value="APPROVED">Approved Submissions</option>
            <option value="IN_PROGRESS">In Progress (Not Submitted)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading submissions...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No task assignments found for this filter.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Task & Week</th>
                  <th className="py-3 px-4">Submission Status</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Review Decision</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviews.map((r) => {
                  const sub = r.latestSubmission;
                  const rev = r.latestReview;

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-800/30 transition text-slate-300"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{r.menteeId?.name}</div>
                        <div className="text-[10px] text-slate-500">{r.menteeId?.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {r.taskId?.title}
                        </div>
                        <div className="text-[10px] text-indigo-400 font-semibold uppercase">
                          Week {r.taskId?.weekNo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {r.submittedAt ? (
                          <>
                            {new Date(r.submittedAt).toLocaleDateString()}
                            {sub?.submittedLate && (
                              <span className="block text-[10px] text-rose-400 font-semibold">
                                Late Submission
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-500">Not yet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {sub ? `v${sub.version}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {rev ? (
                          <div>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                rev.decision === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {rev.decision} {rev.score !== null ? `(${rev.score}/10)` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Pending review</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/mentor/reviews/${r._id}`}
                          className={`px-3 py-1.5 rounded-lg font-medium text-[11px] transition inline-flex items-center gap-1 ${
                            r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {r.status === 'SUBMITTED' ? 'Review Now' : 'Inspect Work'}{' '}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
