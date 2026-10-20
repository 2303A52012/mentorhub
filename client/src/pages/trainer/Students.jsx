import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, RefreshCw, ChevronRight, User,
  TrendingUp, BookOpen, AlertCircle, CheckCircle2, Layers
} from 'lucide-react';

const statusColor = {
  ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  INACTIVE: 'text-slate-400 bg-slate-800 border-slate-700',
  GRADUATED: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
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
        setBatches(tb.map(t => t.batch));
        if (tb.length > 0) setSelectedBatch(tb[0].batch.id);
      } catch {}
    };
    fetchBatches();
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await api.get(`/trainer/batches/${selectedBatch}/students`);
      setStudents(res.data.students || []);
    } catch { showToast('Failed to load students.', 'error'); }
    finally { setLoading(false); }
  }, [selectedBatch]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.rollNo?.toLowerCase().includes(q);
  });

  const batchObj = batches.find(b => b.id === selectedBatch);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-900/90 border-rose-700 text-rose-200' : 'bg-emerald-900/90 border-emerald-700 text-emerald-200'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-600/20 border border-emerald-500/30"><Users className="w-6 h-6 text-emerald-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Batch Students</h1>
            <p className="text-sm text-slate-400">{batchObj ? `${batchObj.name} · ` : ''}{filtered.length} student{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {batches.length > 1 && (
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500">
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button onClick={fetchStudents} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or roll number…" className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
      </div>

      {/* Students grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Users className="w-12 h-12 opacity-20" />
          <p>No students found in this batch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(s => {
            const tasksCompleted = s.menteeProfile?.completedTaskCount || 0;
            const tasksTotal = s.menteeProfile?.totalTaskCount || 0;
            const pct = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
            const mentor = s.menteeProfile?.mentor;

            return (
              <div
                key={s.id}
                onClick={() => navigate(`/trainer/students/${s.id}`)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 cursor-pointer transition group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600/40 to-teal-600/40 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-base font-bold text-emerald-300">
                    {s.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-white text-sm truncate group-hover:text-emerald-300 transition">{s.name}</h3>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition flex-shrink-0" />
                    </div>
                    <p className="text-xs text-slate-500 truncate">{s.email}</p>
                    {s.menteeProfile?.rollNo && <p className="text-xs text-slate-600 mt-0.5">{s.menteeProfile.rollNo}</p>}
                  </div>
                </div>

                {mentor && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="w-3 h-3 text-slate-600" />
                    <span className="truncate">Mentor: <span className="text-slate-400">{mentor.user?.name}</span></span>
                  </div>
                )}

                {tasksTotal > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Task Progress</span>
                      <span className="text-slate-400">{tasksCompleted}/{tasksTotal} <span className="text-emerald-400">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between">
                  <span className={`text-xs border px-2 py-0.5 rounded-full ${statusColor[s.status] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>{s.status || 'ACTIVE'}</span>
                  {s.menteeProfile?.cgpa && <span className="text-xs text-slate-500">CGPA {s.menteeProfile.cgpa}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
