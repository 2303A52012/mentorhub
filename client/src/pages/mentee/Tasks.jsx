import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/Badge';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Award,
  Star,
  RefreshCw
} from 'lucide-react';

export const MenteeTasks = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.pathname.includes('/completed') ? 'COMPLETED' : 'PRESENT'
  );
  const [presentTasks, setPresentTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasksData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.allSettled([
        api.get('/mentee/tasks'),
        api.get('/mentee/tasks/completed')
      ]);

      if (pRes.status === 'fulfilled' && pRes.value.data.success) {
        setPresentTasks(pRes.value.data.tasks || []);
      }
      if (cRes.status === 'fulfilled' && cRes.value.data.success) {
        setCompletedTasks(cRes.value.data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching weekly tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-400" /> Weekly Tasks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Weekly problem sets assigned for practice, solution note-taking, and mentor review.
          </p>
        </div>

        {/* Unified Tab Selector */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('PRESENT')}
            className={`px-3.5 py-1.5 rounded-xl font-medium flex items-center gap-2 transition ${
              activeTab === 'PRESENT'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Present Tasks
            <span
              className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                activeTab === 'PRESENT' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {presentTasks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl font-medium flex items-center gap-2 transition ${
              activeTab === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed Tasks
            <span
              className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                activeTab === 'COMPLETED' ? 'bg-emerald-700/80 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {completedTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Task Cards Content */}
      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading weekly tasks...</p>
        </div>
      ) : activeTab === 'PRESENT' ? (
        /* ==================== PRESENT TASKS ==================== */
        presentTasks.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Present Tasks</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any pending tasks right now. Any newly published assignments from your mentor will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presentTasks.map((item) => {
              const task = item.taskId;
              const weekStr = task?.weekNo < 10 ? `0${task?.weekNo}` : task?.weekNo;
              const totalProblems = task?.problems?.length || 0;
              const savedProblems = item.savedCount || 0;
              const percent = totalProblems > 0 ? Math.round((savedProblems / totalProblems) * 100) : 0;

              return (
                <div
                  key={item._id}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Week {weekStr}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white hover:text-indigo-300 transition">
                        {task?.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {task?.instructions || 'Review the problem statements and solve them step by step.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {totalProblems} coding problems · Due{' '}
                        {task?.lastDate ? new Date(task.lastDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    {/* Saved Problems Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-indigo-400" /> Saved problems:
                        </span>
                        <span className="font-semibold text-slate-200">
                          {savedProblems} of {totalProblems} saved
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/mentee/tasks/${item._id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                      Open Task <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ==================== COMPLETED TASKS ==================== */
        completedTasks.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Approved Tasks Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Once you submit your weekly tasks and your mentor approves them, they will appear here along with your feedback and score.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedTasks.map((item) => {
              const task = item.taskId;
              const weekStr = task?.weekNo < 10 ? `0${task?.weekNo}` : task?.weekNo;
              const review = item.latestReview;

              return (
                <div
                  key={item._id}
                  className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Week {weekStr}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">{task?.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {task?.problems?.length || 0} problems · Approved on{' '}
                        {item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>

                    {review && (
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-300">
                            Reviewer: {review.reviewerId?.name || 'Mentor'}
                          </span>
                          {review.score !== null && (
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-current" /> {review.score}/10
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 italic">"{review.overallFeedback}"</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link
                      to={`/mentee/tasks/${item._id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition flex items-center justify-center gap-2 border border-slate-700"
                    >
                      View Submitted Notes & Review <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
