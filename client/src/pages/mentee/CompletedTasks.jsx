import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/common/Badge';
import { CheckCircle2, Clock, Star, ArrowRight, Award } from 'lucide-react';

export const CompletedTasks = () => {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        const res = await api.get('/mentee/tasks/completed');
        if (res.data.success) {
          setCompleted(res.data.tasks || []);
        }
      } catch (err) {
        console.error('Failed to load completed tasks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompleted();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Completed Tasks</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tasks verified and approved by your mentor with scores and final review comments.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <Link
            to="/mentee/tasks"
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white font-medium flex items-center gap-2 transition"
          >
            <Clock className="w-3.5 h-3.5" /> Present Tasks
          </Link>
          <Link
            to="/mentee/tasks/completed"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed Tasks
            <span className="bg-emerald-700/80 px-1.5 py-0.2 rounded text-[11px]">
              {completed.length}
            </span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading completed tasks...</div>
      ) : completed.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 space-y-3">
          <Award className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Approved Tasks Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once you submit your weekly tasks and your mentor approves them, they will appear here along with your feedback and score.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completed.map((item) => {
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
      )}
    </div>
  );
};
