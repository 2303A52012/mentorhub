import React from 'react';

export const StatusBadge = ({ status }) => {
  const configs = {
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-500/20'
    },
    SUBMITTED: {
      label: 'Submitted',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-500/20'
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-500/20'
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-500/20'
    },
    RESUBMISSION_REQUIRED: {
      label: 'Changes Requested',
      bg: 'bg-rose-50 dark:bg-rose-500/10',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-500/20'
    },
    OVERDUE: {
      label: 'Overdue',
      bg: 'bg-red-50 dark:bg-red-500/15',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-500/30'
    },
    UPCOMING: {
      label: 'Upcoming',
      bg: 'bg-slate-100 dark:bg-slate-500/10',
      text: 'text-slate-700 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-500/20'
    },
    CLOSED: {
      label: 'Closed',
      bg: 'bg-zinc-100 dark:bg-zinc-500/10',
      text: 'text-zinc-700 dark:text-zinc-400',
      border: 'border-zinc-200 dark:border-zinc-500/20'
    }
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-500/20'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {config.label}
    </span>
  );
};

export const PlatformBadge = ({ platform }) => {
  const p = (platform || 'CUSTOM').toUpperCase();
  const styles = {
    LEETCODE: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    CODECHEF: 'bg-yellow-50 dark:bg-yellow-800/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/30',
    CODEFORCES: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/20',
    HACKERRANK: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
    CUSTOM: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20'
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded border ${styles[p] || styles.CUSTOM}`}
    >
      {p}
    </span>
  );
};
