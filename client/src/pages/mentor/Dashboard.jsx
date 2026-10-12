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

  const { stats, atRiskMentees, recentSubmissions } = data || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mentor Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
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
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Assigned Mentees</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalMentees || 0}</p>
          <span className="text-[11px] text-slate-400">Under your mentorship</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Awaiting Review</span>
            <FileCheck className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.awaitingReview || 0}</p>
          <span className="text-[11px] text-amber-400 font-medium">Submissions to verify</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.overdueCount || 0}</p>
          <span className="text-[11px] text-rose-400 font-medium">Missed deadlines</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.avgCompletionRate || 0}%</p>
          <span className="text-[11px] text-emerald-400 font-medium">Verified approved</span>
        </div>
      </div>

      {/* Main Grid: Submissions to Review & At Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Submissions Awaiting Verification */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" /> Submissions Awaiting Your Review
            </h2>
            <Link to="/mentor/reviews" className="text-xs text-indigo-400 hover:text-indigo-300">
              Review Queue &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentSubmissions && recentSubmissions.length > 0 ? (
              recentSubmissions.map((mt) => (
                <div
                  key={mt._id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{mt.menteeId?.name}</span>
                      <StatusBadge status={mt.status} />
                    </div>
                    <p className="text-xs text-slate-400">
                      Week {mt.taskId?.weekNo}: {mt.taskId?.title}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
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
              <div className="p-8 text-center glass-panel rounded-2xl text-slate-400 text-sm">
                No submissions waiting for review right now.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: At-Risk Mentees Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Students Needing Attention
            </h2>
            <Link to="/mentor/mentees" className="text-xs text-indigo-400 hover:text-indigo-300">
              Directory &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {atRiskMentees && atRiskMentees.length > 0 ? (
              atRiskMentees.map((m) => (
                <div
                  key={m._id}
                  className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{m.name}</span>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                      {m.reason}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Completion rate: {m.completionRate}%</span>
                    <Link
                      to={`/mentor/mentees/${m._id}`}
                      className="text-amber-300 hover:underline font-medium"
                    >
                      View Student &rarr;
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center glass-panel rounded-2xl text-slate-400 text-xs">
                All mentees are making steady progress!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
