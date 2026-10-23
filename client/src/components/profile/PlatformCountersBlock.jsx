import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';
import {
  Code2,
  Plus,
  Minus,
  Sparkles,
  ExternalLink,
  Zap,
  Target,
  Edit2,
  Check,
  X
} from 'lucide-react';

const PLATFORM_CONFIG = [
  {
    key: 'leetcode',
    field: 'leetcodeSolved',
    urlField: 'leetcodeUrl',
    name: 'LeetCode',
    tagline: 'Weekly Targets Live Synced',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    btnColor: 'hover:bg-amber-500 hover:text-white',
    ringColor: 'focus:border-amber-500',
    accentBorder: 'border-amber-500/40',
    isSyncTarget: true,
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent'
  },
  {
    key: 'codeforces',
    field: 'codeforcesSolved',
    urlField: 'codeforcesUrl',
    name: 'Codeforces',
    tagline: 'Competitive Rating',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    btnColor: 'hover:bg-cyan-500 hover:text-white',
    ringColor: 'focus:border-cyan-500',
    accentBorder: 'border-cyan-500/40',
    isSyncTarget: false,
    bgGradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent'
  },
  {
    key: 'codechef',
    field: 'codechefSolved',
    urlField: 'codechefUrl',
    name: 'CodeChef',
    tagline: 'Star Contests & Practice',
    badgeColor: 'bg-amber-700/10 text-amber-700 dark:text-amber-300 border-amber-700/30',
    btnColor: 'hover:bg-amber-700 hover:text-white',
    ringColor: 'focus:border-amber-700',
    accentBorder: 'border-amber-700/40',
    isSyncTarget: false,
    bgGradient: 'from-amber-700/10 via-amber-700/5 to-transparent'
  },
  {
    key: 'hackerrank',
    field: 'hackerrankSolved',
    urlField: 'hackerrankUrl',
    name: 'HackerRank',
    tagline: 'Badges & Skill Stars',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    btnColor: 'hover:bg-emerald-500 hover:text-white',
    ringColor: 'focus:border-emerald-500',
    accentBorder: 'border-emerald-500/40',
    isSyncTarget: false,
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent'
  },
  {
    key: 'gfg',
    field: 'gfgSolved',
    urlField: 'gfgUrl',
    name: 'GeeksforGeeks',
    tagline: 'POTD & Practice Solves',
    badgeColor: 'bg-green-600/10 text-green-700 dark:text-green-300 border-green-600/30',
    btnColor: 'hover:bg-green-600 hover:text-white',
    ringColor: 'focus:border-green-600',
    accentBorder: 'border-green-600/40',
    isSyncTarget: false,
    bgGradient: 'from-green-600/10 via-green-600/5 to-transparent'
  }
];

export const PlatformCountersBlock = ({
  codingProfile = {},
  studentId,
  canEdit = true,
  onUpdate
}) => {
  const { showToast } = useModal();
  const [counters, setCounters] = useState({
    leetcodeSolved: codingProfile.leetcodeSolved ?? 0,
    codechefSolved: codingProfile.codechefSolved ?? 0,
    codeforcesSolved: codingProfile.codeforcesSolved ?? 0,
    hackerrankSolved: codingProfile.hackerrankSolved ?? 0,
    gfgSolved: codingProfile.gfgSolved ?? 0
  });

  const [updatingPlatform, setUpdatingPlatform] = useState(null);
  const [customModal, setCustomModal] = useState(null); // { platform, config, currentVal, customAmount: '' }

  // Keep local state in sync when prop changes
  React.useEffect(() => {
    setCounters({
      leetcodeSolved: codingProfile.leetcodeSolved ?? 0,
      codechefSolved: codingProfile.codechefSolved ?? 0,
      codeforcesSolved: codingProfile.codeforcesSolved ?? 0,
      hackerrankSolved: codingProfile.hackerrankSolved ?? 0,
      gfgSolved: codingProfile.gfgSolved ?? 0
    });
  }, [codingProfile]);

  const handleQuickAdjust = async (config, action) => {
    if (!canEdit) return;
    const currentVal = counters[config.field] ?? 0;
    if (action === 'decrement' && currentVal <= 0) return;

    const newVal = action === 'increment' ? currentVal + 1 : Math.max(0, currentVal - 1);
    
    // Optimistic UI update
    setCounters((prev) => ({ ...prev, [config.field]: newVal }));
    setUpdatingPlatform(config.key);

    try {
      const res = await api.patch('/weekly-targets/counters', {
        studentId,
        platform: config.key,
        action,
        amount: 1
      });

      if (res.data.success) {
        showToast(
          config.isSyncTarget
            ? `LeetCode count updated to ${newVal}! Synced to Weekly Cumulative Targets.`
            : `${config.name} count updated to ${newVal}.`,
          'success'
        );
        if (onUpdate) onUpdate(res.data.codingProfile);
      }
    } catch (err) {
      console.error('Failed to update counter:', err);
      // Revert optimistic update
      setCounters((prev) => ({ ...prev, [config.field]: currentVal }));
      showToast(err.response?.data?.message || 'Failed to update counter.', 'error');
    } finally {
      setUpdatingPlatform(null);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customModal) return;

    const { config, customMode, customValue } = customModal;
    const val = parseInt(customValue, 10);
    if (isNaN(val) || val < 0) {
      return showToast('Please enter a valid non-negative number.', 'error');
    }

    const currentVal = counters[config.field] ?? 0;
    const targetVal = customMode === 'add' ? currentVal + val : val;

    setCounters((prev) => ({ ...prev, [config.field]: targetVal }));
    setUpdatingPlatform(config.key);
    setCustomModal(null);

    try {
      const res = await api.patch('/weekly-targets/counters', {
        studentId,
        platform: config.key,
        action: 'set',
        amount: targetVal
      });

      if (res.data.success) {
        showToast(
          config.isSyncTarget
            ? `LeetCode updated to ${targetVal}! Synced with Weekly Cumulative Targets.`
            : `${config.name} solved count updated to ${targetVal}.`,
          'success'
        );
        if (onUpdate) onUpdate(res.data.codingProfile);
      }
    } catch (err) {
      console.error('Failed to update custom counter:', err);
      setCounters((prev) => ({ ...prev, [config.field]: currentVal }));
      showToast(err.response?.data?.message || 'Failed to update counter.', 'error');
    } finally {
      setUpdatingPlatform(null);
    }
  };

  const totalProblemsSolved =
    (counters.leetcodeSolved || 0) +
    (counters.codechefSolved || 0) +
    (counters.codeforcesSolved || 0) +
    (counters.hackerrankSolved || 0) +
    (counters.gfgSolved || 0);

  return (
    <div className="space-y-4">
      {/* Header with aggregate counter and target sync pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Platform Solved Problem Counters
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Total: {totalProblemsSolved} Solved
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Track problems solved across competitive coding platforms. Initialized with 0, adjustable with +, -, or custom increments.
            </p>
          </div>
        </div>

        <Link
          to="/mentee/targets"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/30 transition shadow-xs self-start sm:self-auto"
        >
          <Target className="w-3.5 h-3.5 text-amber-500" />
          <span>Weekly Targets (W1-W12)</span>
        </Link>
      </div>

      {/* Grid of Platform Counter Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {PLATFORM_CONFIG.map((config) => {
          const count = counters[config.field] ?? 0;
          const url = codingProfile[config.urlField];
          const isBusy = updatingPlatform === config.key;

          return (
            <div
              key={config.key}
              className={`relative overflow-hidden rounded-2xl border ${
                config.isSyncTarget
                  ? 'border-amber-400/50 dark:border-amber-500/30 ring-1 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              } bg-gradient-to-br ${config.bgGradient} p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm transition-all hover:shadow-md`}
            >
              {config.isSyncTarget && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[9px] font-bold text-amber-700 dark:text-amber-300 tracking-wider uppercase">
                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                  Target Sync
                </div>
              )}

              {/* Platform Title & Link */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {config.name}
                    {url && (
                      <a
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                        title={`View ${config.name} profile`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {config.tagline}
                  </span>
                </div>
              </div>

              {/* Counter Display and Controls */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {count}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    solved
                  </span>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    {/* Decrement Button */}
                    <button
                      onClick={() => handleQuickAdjust(config, 'decrement')}
                      disabled={count <= 0 || isBusy}
                      title="Decrement by 1"
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none transition flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    {/* Increment Button */}
                    <button
                      onClick={() => handleQuickAdjust(config, 'increment')}
                      disabled={isBusy}
                      title="Increment by 1"
                      className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-300 disabled:opacity-40 transition flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Custom Increment / Edit Button */}
                    <button
                      onClick={() =>
                        setCustomModal({
                          config,
                          customMode: 'add',
                          customValue: '5'
                        })
                      }
                      disabled={isBusy}
                      title="Custom increment or direct set"
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300 text-[10px] font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Custom</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Increment / Direct Set Modal */}
      {customModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${customModal.config.badgeColor}`}>
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Adjust {customModal.config.name} Solved Count
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Current solved: {counters[customModal.config.field] ?? 0}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCustomModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              {/* Mode Toggle: Quick Add vs Set Direct */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCustomModal((prev) => ({ ...prev, customMode: 'add', customValue: '5' }))}
                  className={`py-1.5 rounded-lg transition ${
                    customModal.customMode === 'add'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  + Add More (+N)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomModal((prev) => ({
                      ...prev,
                      customMode: 'set',
                      customValue: String(counters[customModal.config.field] ?? 0)
                    }))
                  }
                  className={`py-1.5 rounded-lg transition ${
                    customModal.customMode === 'set'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Set Direct Count
                </button>
              </div>

              {/* Number Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {customModal.customMode === 'add' ? 'Number of Problems to Add' : 'New Exact Problem Count'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={customModal.customValue}
                  onChange={(e) => setCustomModal((prev) => ({ ...prev, customValue: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              {customModal.customMode === 'add' && (
                <div className="flex gap-2">
                  {[1, 5, 10, 20].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomModal((prev) => ({ ...prev, customValue: String(preset) }))}
                      className="flex-1 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCustomModal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
