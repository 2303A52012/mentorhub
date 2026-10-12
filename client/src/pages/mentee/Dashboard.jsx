import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/Badge';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Trophy,
  ArrowRight,
  AlertCircle,
  FileText,
  Star
} from 'lucide-react';

export const MenteeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/mentee/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading dashboard...</div>;
  }

  const { stats, presentTasks, completedTasks, recentReviews, earnedAchievements } = data || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Mentee Training Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Weekly coding tasks, problem notes, progress tracking and mentor reviews.
          </p>
        </div>
        <Link
          to="/mentee/tasks"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30"
        >
          View My Tasks <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Present Tasks</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.presentCount || 0}</p>
          <span className="text-[11px] text-amber-400 font-medium">In progress or review</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.completedCount || 0}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Mentor approved</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completion Rate</span>
            <Star className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.completionRate || 0}%</p>
          <span className="text-[11px] text-indigo-400 font-medium">
            {stats?.completedCount} of {stats?.totalAssigned} tasks
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Notes Saved</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalNotesSaved || 0}</p>
          <span className="text-[11px] text-blue-400 font-medium">Problem solutions recorded</span>
        </div>
      </div>

      {/* Main Grid: Present Tasks vs Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Present Tasks column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Active Tasks Awaiting Completion
            </h2>
            <Link to="/mentee/tasks" className="text-xs text-indigo-400 hover:text-indigo-300">
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {presentTasks && presentTasks.length > 0 ? (
              presentTasks.map((t) => (
                <div
                  key={t._id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Week {t.taskId?.weekNo < 10 ? `0${t.taskId?.weekNo}` : t.taskId?.weekNo}
                      </span>
                      <StatusBadge status={t.status} />
                    </div>
                    <h3 className="font-semibold text-white text-sm">{t.taskId?.title}</h3>
                    <p className="text-xs text-slate-400">
                      {t.taskId?.problems?.length || 0} problems · Due{' '}
                      {t.taskId?.lastDate ? new Date(t.taskId.lastDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  <Link
                    to={`/mentee/tasks/${t._id}`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition border border-slate-700 text-center"
                  >
                    Open Task
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-8 text-center glass-panel rounded-2xl text-slate-400 text-sm">
                No active tasks pending. Great work!
              </div>
            )}
          </div>
        </div>

        {/* Right column: Recent Review Feedback */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" /> Latest Mentor Feedback
          </h2>

          <div className="space-y-3">
            {recentReviews && recentReviews.length > 0 ? (
              recentReviews.map((r) => (
                <div
                  key={r._id}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      {r.reviewerId?.name || 'Mentor'}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${r.decision === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                        }`}
                    >
                      {r.decision === 'APPROVED' ? `Score: ${r.score}/10` : 'Changes Needed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic">"{r.overallFeedback}"</p>
                  <span className="text-[10px] text-slate-500 block">
                    {new Date(r.reviewedAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center glass-panel rounded-2xl text-slate-400 text-xs">
                No review feedback received yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
