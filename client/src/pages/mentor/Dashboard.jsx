import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/Badge';
import {
  Users,
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const MentorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/mentor/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load mentor dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading mentor dashboard...</div>;
  }

  const { stats, atRiskMentees, recentSubmissions, mentees } = data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mentor Dashboard</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Track your assigned cohort, review student problem notes, and address at-risk progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/mentor/tasks/create"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" /> Create Weekly Task
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned Mentees</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.totalMentees || 0}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Under your mentorship</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Awaiting Review</span>
            <FileCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.awaitingReview || 0}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Submissions to verify</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.overdueCount || 0}</p>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Missed deadlines</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.avgCompletionRate || 0}%</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified approved</span>
        </div>
      </div>

      {/* Main Grid: Submissions to Review & At Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions Awaiting Verification */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Submissions Awaiting Your Review
            </h2>
            <Link to="/mentor/reviews" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium">
              Review Queue &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentSubmissions && recentSubmissions.length > 0 ? (
              recentSubmissions.map((mt) => (
                <div
                  key={mt._id}
                  className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{mt.menteeId?.name}</span>
                      <StatusBadge status={mt.status} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Week {mt.taskId?.weekNo}: {mt.taskId?.title}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      Submitted on{' '}
                      {mt.submittedAt ? new Date(mt.submittedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <Link
                    to={`/mentor/reviews/${mt._id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition text-center shadow-lg shadow-indigo-600/20"
                  >
                    Verify & Review
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-slate-500 dark:text-slate-400 text-sm">
                No submissions waiting for review right now.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: At-Risk Mentees Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Students Needing Attention
            </h2>
            <Link to="/mentor/mentees" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium">
              Directory &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {atRiskMentees && atRiskMentees.length > 0 ? (
              atRiskMentees.map((m) => (
                <div
                  key={m._id}
                  className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded">
                      {m.reason}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                    <span>Completion rate: {m.completionRate}%</span>
                    <Link
                      to={`/mentor/mentees/${m._id}`}
                      className="text-amber-700 dark:text-amber-300 hover:underline font-medium"
                    >
                      View Student &rarr;
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-slate-500 dark:text-slate-400 text-xs">
                All mentees are making steady progress!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Mentees Cohort Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>My Assigned Mentees</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                {mentees?.length || stats?.totalMentees || 0}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Direct access to all students under your mentorship in this cohort.
            </p>
          </div>

          <Link
            to="/mentor/mentees"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 self-start sm:self-center"
          >
            <span>Open Mentee Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {mentees && mentees.length > 0 ? (
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Batch &amp; Section</th>
                    <th className="py-3 px-4">Task Completion</th>
                    <th className="py-3 px-4">Submissions</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {mentees.map((m) => (
                    <tr
                      key={m._id || m.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition text-slate-700 dark:text-slate-300"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{m.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-[11px]">
                          {m.rollNumber || m.studentId || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{m.batchName}</div>
                        <div className="text-[11px] text-slate-500">
                          {m.branch} &middot; Sec {m.section}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{m.completionRate}%</span>
                          <span className="text-[10px] text-slate-500">
                            ({m.approvedCount}/{m.totalTasks} approved)
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.completionRate >= 75
                                ? 'bg-emerald-500'
                                : m.completionRate >= 50
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${m.completionRate}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {m.submittedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                            {m.submittedCount} to review
                          </span>
                        ) : m.overdueCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20">
                            {m.overdueCount} overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Up to date
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/mentor/mentees/${m._id || m.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition inline-flex items-center gap-1"
                        >
                          <span>View Profile</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-slate-500 dark:text-slate-400 text-sm">
            No mentees currently assigned to your mentorship group.
          </div>
        )}
      </div>
    </div>
  );
};
