import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Zap,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  PlusCircle,
  CheckSquare,
  FileCheck
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo' }) => {
  const colorStyles = {
    indigo: {
      card: 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
      iconBox: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20'
    },
    purple: {
      card: 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
      iconBox: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20'
    },
    amber: {
      card: 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
      iconBox: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
    },
    emerald: {
      card: 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
      iconBox: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
    }
  }[color] || {
    card: 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
    iconBox: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${colorStyles.card} shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center gap-3 mb-2.5">
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBox}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {value}
      </div>
      {sub && <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
};

export const TrainerDashboard = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, sessionsRes] = await Promise.all([
          api.get('/trainer/profile'),
          api.get('/trainer/sessions?limit=5')
        ]);
        const trainerBatches = profileRes.data.trainer?.trainerBatches || [];
        setBatches(trainerBatches);
        setTotalStudents(
          trainerBatches.reduce((sum, tb) => sum + (tb.batch?.studentCount || 0), 0)
        );
        setRecentSessions(sessionsRes.data.sessions || []);
      } catch (e) {
        console.error('Failed to load trainer dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading your trainer dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 space-y-8 transition-colors duration-200 font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Trainer'}!
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                Active Trainer
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Corporate & Technical Training Desk &middot; Managing {batches.length} assigned cohort batch{batches.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/trainer/tasks/create"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Create Weekly Task
          </Link>
          <Link
            to="/trainer/calendar"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition"
          >
            <Calendar className="w-3.5 h-3.5" /> Training Calendar
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Assigned Batches" value={batches.length} color="indigo" />
        <StatCard icon={Users} label="Total Students" value={totalStudents || '—'} color="purple" />
        <StatCard
          icon={BookOpen}
          label="Sessions Today"
          value={
            recentSessions.filter(
              (s) => new Date(s.date).toDateString() === new Date().toDateString()
            ).length
          }
          color="amber"
        />
        <StatCard
          icon={Zap}
          label="Problems Posted"
          value={todayProblems.length}
          color="emerald"
          sub="Recent batch problems"
        />
      </div>

      {/* Batches Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> My Assigned Cohort Batches
          </h2>
          <Link
            to="/trainer/students"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all students <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {batches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            No cohort batches assigned yet. Contact University Admin for batch allocation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {batches.map((tb) => (
              <Link
                key={tb.id}
                to="/trainer/students"
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 rounded-2xl p-4 sm:p-5 transition group shadow-xs hover:shadow-md"
              >
                <div className="flex items-center gap-3.5 mb-2.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition text-sm truncate">
                      {tb.batch?.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Academic Year {tb.batch?.academicYear || 'Current'}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
                </div>
                {tb.isPrimary && (
                  <span className="inline-flex text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                    Lead Primary Trainer
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Training Sessions */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Recent Training Sessions
            </h2>
            <Link
              to="/trainer/calendar"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              Full Calendar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
              No sessions recorded yet. Click above to log your first syllabus class.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs"
                >
                  <div className="text-xs font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 rounded-xl px-2.5 py-1 whitespace-nowrap">
                    {new Date(s.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {s.batch?.name}
                    </div>
                    {s.topicsTaught?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {s.topicsTaught.map((t, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Review Actions */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Syllabus &amp; Review Actions
            </h2>
            <Link
              to="/trainer/reviews"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              All Reviews <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <Link
              to="/trainer/tasks"
              className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    Manage Weekly Tasks
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Create problem sets, assign platform URLs, and set deadlines.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
            </Link>

            <Link
              to="/trainer/calendar"
              className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-purple-400/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    Training Calendar Reports
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Log topics taught, problems solved, and review batch progress.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition" />
            </Link>

            <Link
              to="/trainer/students"
              className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-400/50 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    Batch Student Roster
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Browse all enrolled students and monitor target completion rates.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
