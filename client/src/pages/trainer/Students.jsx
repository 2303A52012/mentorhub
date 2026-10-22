import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  RefreshCw,
  ChevronRight,
  User,
  TrendingUp,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Layers,
  FolderGit2,
  GraduationCap
} from 'lucide-react';

const statusColor = {
  ACTIVE: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  INACTIVE: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  GRADUATED: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
};

export const TrainerStudents = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/trainer/profile');
        const tb = res.data.trainer?.trainerBatches || [];
        const bList = tb.map((t) => t.batch).filter(Boolean);
        setBatches(bList);
        if (bList.length > 0) setSelectedBatch(bList[0].id);
      } catch (err) {
        console.error('Failed to load trainer batches:', err);
      }
    };
    fetchBatches();
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await api.get(`/trainer/batches/${selectedBatch}/students`);
      setStudents(res.data.students || []);
    } catch {
      showToast('Failed to load students for this batch.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.rollNo?.toLowerCase().includes(q)
    );
  });

  const batchObj = batches.find((b) => b.id === selectedBatch);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-6 transition-colors duration-200 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold shadow-2xl border flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Batch Students
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {batchObj ? `${batchObj.name} &middot; ` : ''}
              {filtered.length} student{filtered.length !== 1 ? 's' : ''} enrolled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {batches.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <FolderGit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id} className="dark:bg-slate-900">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={fetchStudents}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Refresh student list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name, roll number, or email…"
          className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-xs transition"
        />
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading student roster…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          <Users className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">No students found matching your search in this batch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filtered.map((s) => {
            const tasksCompleted = s.menteeProfile?.completedTaskCount || 0;
            const tasksTotal = s.menteeProfile?.totalTaskCount || 0;
            const pct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
            const mentor = s.menteeProfile?.mentor;

            return (
              <div
                key={s.id}
                onClick={() => navigate(`/admin/mentees/${s.id}`)}
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 cursor-pointer transition group shadow-xs hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center flex-shrink-0 text-base font-bold shadow-sm">
                    {s.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                        {s.name}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition flex-shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">{s.email}</p>
                    {s.menteeProfile?.rollNo && (
                      <span className="inline-block mt-1 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                        {s.menteeProfile.rollNo}
                      </span>
                    )}
                  </div>
                </div>

                {mentor && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">
                      Faculty Mentor: <strong className="text-slate-700 dark:text-slate-300">{mentor.user?.name || mentor.name}</strong>
                    </span>
                  </div>
                )}

                {/* Task Progress Slider / Bar (Fixed for light and dark modes!) */}
                {tasksTotal > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-500 dark:text-slate-400">Task Completion</span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">
                        {tasksCompleted}/{tasksTotal}{' '}
                        <span className="text-emerald-600 dark:text-emerald-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full ${
                      statusColor[s.status] ||
                      'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {s.status || 'ACTIVE'}
                  </span>
                  {s.menteeProfile?.cgpa && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      CGPA: <strong className="text-slate-900 dark:text-white">{s.menteeProfile.cgpa}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
