import React from 'react';

export const MockStatusBadge = ({ status }) => {
  const configs = {
    SCHEDULED: {
      label: 'Scheduled',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30'
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30'
    },
    MISSED: {
      label: 'Missed',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30'
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-500/15',
      text: 'text-slate-400',
      border: 'border-slate-500/30'
    },
    DRAFT: {
      label: 'Draft',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30'
    },
    PUBLISHED: {
      label: 'Published',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
      border: 'border-emerald-500/40'
    },
    ARCHIVED: {
      label: 'Archived',
      bg: 'bg-slate-700/20',
      text: 'text-slate-400',
      border: 'border-slate-700/40'
    }
  };

  const config = configs[status] || {
    label: status,
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  );
};

export const MockTypeBadge = ({ type }) => {
  const configs = {
    TECHNICAL: {
      label: 'Technical',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30'
    },
    DSA: {
      label: 'Data Structures & Algo',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/30'
    },
    COMMUNICATION_HR: {
      label: 'HR & Communication',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30'
    },
    MIXED: {
      label: 'Comprehensive (Mixed)',
      bg: 'bg-fuchsia-500/10',
      text: 'text-fuchsia-400',
      border: 'border-fuchsia-500/30'
    },
    CUSTOM: {
      label: 'Custom Focus',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30'
    }
  };

  const config = configs[type] || {
    label: type || 'Mock',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wide uppercase ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
};

export const RecommendationBadge = ({ recommendation }) => {
  const configs = {
    STRONGLY_RECOMMENDED: {
      label: 'Strongly Recommended',
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    RECOMMENDED: {
      label: 'Recommended',
      bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    },
    RECOMMENDED_WITH_IMPROVEMENT: {
      label: 'Recommended w/ Improvement',
      bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    NOT_RECOMMENDED_YET: {
      label: 'Not Recommended Yet',
      bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    }
  };

  const config = configs[recommendation] || {
    label: recommendation || 'Pending Decision',
    bg: 'bg-slate-700/20 text-slate-400 border-slate-700/40'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${config.bg}`}
    >
      {config.label}
    </span>
  );
};
