import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Search, Filter, AlertTriangle, CheckCircle2, User, ArrowRight, Key } from 'lucide-react';
import { ResetUserPasswordModal } from '../../components/common/ResetUserPasswordModal';

export const MentorMentees = () => {
  const [mentees, setMentees] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [completionFilter, setCompletionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetMentee, setResetTargetMentee] = useState(null);

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedBatch) params.batchId = selectedBatch;
      if (completionFilter) params.completionFilter = completionFilter;

      const res = await api.get('/mentees', { params });
      if (res.data.success) {
        setMentees(res.data.mentees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      if (res.data.success) {
        setBatches(res.data.batches || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    fetchMentees();
  }, [selectedBatch, completionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMentees();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Mentee Directory</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Manage your assigned cohort, monitor submission completion, and review profiles.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 shadow-xs"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={completionFilter}
            onChange={(e) => setCompletionFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 shadow-xs"
          >
            <option value="">All Completion Rates</option>
            <option value="at-risk">⚠️ At-Risk Only</option>
            <option value="low">Under 50%</option>
            <option value="high">75% & Above</option>
          </select>

          <button
            onClick={fetchMentees}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-white transition border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading mentees...</div>
      ) : mentees.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm text-slate-500 dark:text-slate-400 text-sm">
          No mentees match your search or filter.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll No & ID</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Completion</th>
                  <th className="py-3 px-4">Pending / Overdue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {mentees.map((mentee) => {
                  const stats = mentee.stats || {};
                  return (
                    <tr
                      key={mentee._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition text-slate-700 dark:text-slate-300"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{mentee.name}</div>
                        <div className="text-[11px] text-slate-500">{mentee.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-900 dark:text-white">{mentee.profile?.rollNumber || 'N/A'}</div>
                        <div className="text-[10px] text-slate-500">
                          {mentee.profile?.studentId || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {mentee.batches && mentee.batches.length > 0 ? (
                          mentee.batches.map((b) => (
                            <span
                              key={b._id}
                              className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] mr-1 border border-slate-200 dark:border-slate-700/60"
                            >
                              {b.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {stats.completionRate || 0}%
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({stats.approvedCount}/{stats.totalAssigned})
                          </span>
                        </div>
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${stats.completionRate || 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {stats.pendingCount || 0} pending
                        </span>
                        {stats.overdueCount > 0 && (
                          <span className="ml-1.5 text-rose-600 dark:text-rose-400 font-bold text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            {stats.overdueCount} overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {stats.isAtRisk ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> At Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> On Track
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setResetTargetMentee({ ...mentee, isMentorActor: true });
                              setShowResetModal(true);
                            }}
                            title="Reset Mentee Password"
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 transition text-xs flex items-center gap-1 font-medium"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/mentor/mentees/${mentee._id}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium text-[11px] transition border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1 shadow-xs"
                          >
                            Profile <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset User Password Modal */}
      <ResetUserPasswordModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetTargetMentee(null);
        }}
        targetUser={resetTargetMentee}
        onSuccess={fetchMentees}
      />
    </div>
  );
};
