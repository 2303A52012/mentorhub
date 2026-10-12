import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Users,
  ShieldCheck,
  FolderGit2,
  CheckSquare,
  FileCheck,
  FileSpreadsheet,
  PlusCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDash = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminDash();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading admin dashboard...</div>;
  }

  const { stats, batchPerformance, recentSubmissions } = data || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Institution Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Section 12.1 · Platform-wide monitoring, batch analytics, and mentor workload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/reports"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV Reports
          </Link>
          <Link
            to="/admin/tasks/create"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Publish Task
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Mentors</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalMentors || 0}</p>
          <span className="text-[11px] text-slate-400">Faculty & Leads</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalMentees || 0}</p>
          <span className="text-[11px] text-slate-400">Active mentees</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Batches</span>
            <FolderGit2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.totalBatches || 0}</p>
          <span className="text-[11px] text-slate-400">Training cohorts</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Overall Completion</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats?.overallCompletionRate || 0}%</p>
          <span className="text-[11px] text-emerald-400">Verified approved tasks</span>
        </div>
      </div>

      {/* Batch Performance Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> Batch-Wise Completion Rates (%)
        </h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={batchPerformance || []}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="completionRate" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-400" /> Recent Submissions Across Institution
          </h2>
          <Link to="/admin/reviews" className="text-xs text-indigo-400 hover:underline">
            View all &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recentSubmissions && recentSubmissions.length > 0 ? (
            recentSubmissions.map((s) => (
              <div key={s._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">{s.menteeId?.name}</span>
                  <span className="text-slate-400 ml-2">
                    submitted Week {s.taskId?.weekNo}: {s.taskId?.title}
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">
                  {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : ''}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-4">No recent submissions.</p>
          )}
        </div>
      </div>
    </div>
  );
};
