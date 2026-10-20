import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Zap, TrendingUp,
  Calendar, AlertCircle, CheckCircle2, Clock, ChevronRight, Layers
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]} bg-opacity-80`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${colors[color]}`}><Icon className="w-4 h-4" /></div>
        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
    </div>
  );
};

export const TrainerDashboard = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayProblems, setTodayProblems] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, problemsRes, sessionsRes] = await Promise.all([
          api.get('/trainer/profile'),
          api.get('/trainer/daily-problems?limit=5'),
          api.get('/trainer/sessions?limit=5'),
        ]);
        const trainerBatches = profileRes.data.trainer?.trainerBatches || [];
        setBatches(trainerBatches);
        setTotalStudents(trainerBatches.reduce((sum, tb) => sum + (tb.batch?.studentCount || 0), 0));
        setTodayProblems(problemsRes.data.problems || []);
        setRecentSessions(sessionsRes.data.sessions || []);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans">
      {/* Welcome */}
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
          <LayoutDashboard className="w-7 h-7 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-400 text-sm">Trainer Portal · {batches.length} batch{batches.length !== 1 ? 'es' : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Layers} label="Batches" value={batches.length} color="indigo" />
        <StatCard icon={Users} label="Students" value={totalStudents || '—'} color="purple" />
        <StatCard icon={BookOpen} label="Sessions Today" value={recentSessions.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length} color="amber" />
        <StatCard icon={Zap} label="Problems Posted" value={todayProblems.length} color="emerald" sub="Recent" />
      </div>

      {/* Batches */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-400" /> My Batches</h2>
        {batches.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">No batches assigned yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {batches.map(tb => (
              <div key={tb.id} className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition cursor-pointer group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-indigo-300 transition">{tb.batch?.name}</div>
                    <div className="text-xs text-slate-500">Year {tb.batch?.academicYear}</div>
                  </div>
                </div>
                {tb.isPrimary && <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Primary Trainer</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-400" /> Recent Training Sessions</h2>
        {recentSessions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-500 text-sm">No sessions recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {recentSessions.slice(0, 5).map(s => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                <div className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg px-2 py-1 whitespace-nowrap">
                  {new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">{s.batch?.name}</div>
                  {s.topicsTaught?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.topicsTaught.map((t, i) => <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Problems */}
      <div>
        <h2 className="text-base font-semibold text-slate-300 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Recently Posted Problems</h2>
        {todayProblems.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-slate-500 text-sm">No problems posted yet.</div>
        ) : (
          <div className="space-y-2">
            {todayProblems.slice(0, 5).map(p => {
              const diffColor = { EASY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20', HARD: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }[p.difficulty] || 'text-slate-400';
              return (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-3">
                  <span className={`text-xs border px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5 ${diffColor}`}>{p.difficulty}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200">{p.title}</div>
                    {p.company && <div className="text-xs text-slate-500 mt-0.5">{p.company} · {p.batch?.name}</div>}
                  </div>
                  {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline whitespace-nowrap">View →</a>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
