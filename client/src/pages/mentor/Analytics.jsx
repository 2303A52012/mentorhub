import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Star } from 'lucide-react';

export const MentorAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/mentor/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading analytics...</div>;
  }

  const { stats, atRiskMentees } = data || {};

  const barData = [
    { name: 'Approved', count: stats?.approvedCount || 0, fill: '#10b981' },
    { name: 'In Progress', count: stats?.inProgressCount || 0, fill: '#6366f1' },
    { name: 'Under Review', count: stats?.awaitingReview || 0, fill: '#f59e0b' },
    { name: 'Overdue', count: stats?.overdueCount || 0, fill: '#ef4444' }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Cohort Analytics & At-Risk Indicators
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Section 12.4 & 12.5 · Transparent completion metrics and early intervention flags.
        </p>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Assignment Status Distribution
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* At-Risk Detail Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Early Intervention Flags
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Mentees flagged automatically based on missed deadlines or completion rates below 50%.
          </p>

          <div className="space-y-3">
            {atRiskMentees && atRiskMentees.length > 0 ? (
              atRiskMentees.map((m) => (
                <div
                  key={m._id}
                  className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</span>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded">
                      {m.reason}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                    <span>Completion Rate: {m.completionRate}%</span>
                    <span>Overdue Tasks: {m.overdueCount}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No students currently flagged as at-risk!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
