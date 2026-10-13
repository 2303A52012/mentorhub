import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trophy, Award, Flame, Clock, Medal, Sparkles } from 'lucide-react';

export const MenteeAchievements = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, achRes] = await Promise.all([
          api.get('/leaderboard'),
          api.get('/achievements')
        ]);
        if (lbRes.data.success) setLeaderboard(lbRes.data.leaderboard || []);
        if (achRes.data.success) setAchievements(achRes.data.achievements || []);
      } catch (err) {
        console.error('Failed to load achievements', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIcon = (code) => {
    if (code?.includes('CONSISTENT')) return Flame;
    if (code?.includes('TIME')) return Clock;
    return Award;
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading achievements...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Achievements & Leaderboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Points awarded for verified approved tasks, on-time submissions, and learning milestones.
        </p>
      </div>

      {/* Badges Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Milestone Badges
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = getIcon(ach.code);
            return (
              <div
                key={ach._id}
                className={`p-5 rounded-2xl border transition flex items-start gap-4 ${
                  ach.isUnlocked
                    ? 'glass-panel border-amber-300 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/10 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    ach.isUnlocked
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">{ach.name}</h3>
                    {ach.isUnlocked && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-500/20">
                        +{ach.points} pts
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ach.description}
                  </p>
                  <span className="text-[10px] font-medium block pt-1">
                    {ach.isUnlocked ? (
                      <span className="text-emerald-600 dark:text-emerald-400">✓ Unlocked</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Locked</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cohort Leaderboard */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Cohort Leaderboard
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Ranked by verified points</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Approved Tasks</th>
                <th className="py-3 px-4">On-Time Submissions</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {leaderboard.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition text-slate-700 dark:text-slate-300"
                >
                  <td className="py-3.5 px-4 font-bold">
                    {item.rank === 1 ? (
                      <span className="text-amber-500 dark:text-amber-400 flex items-center gap-1 font-bold">
                        <Medal className="w-4 h-4" /> #1
                      </span>
                    ) : item.rank === 2 ? (
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-bold">
                        <Medal className="w-4 h-4" /> #2
                      </span>
                    ) : item.rank === 3 ? (
                      <span className="text-amber-700 dark:text-amber-600 flex items-center gap-1 font-bold">
                        <Medal className="w-4 h-4" /> #3
                      </span>
                    ) : (
                      `#${item.rank}`
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {item.rollNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                    {item.approvedCount} approved
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {item.onTimeCount} on-time
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    {item.points} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
