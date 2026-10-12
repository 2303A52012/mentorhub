import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MockStatusBadge, MockTypeBadge } from '../../components/mocks/MockBadges';
import { CreateMockSectionModal } from '../../components/mocks/CreateMockSectionModal';
import {
  Plus,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export const WeeklyMocks = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Tabs: 'CURRENT' (drafts + active published) vs 'PREVIOUS' (archived or past)
  const [activeTab, setActiveTab] = useState('CURRENT');

  // Filters
  const [search, setSearch] = useState('');
  const [weekFilter, setWeekFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mockTypeFilter, setMockTypeFilter] = useState('ALL');

  const fetchSections = async () => {
    try {
      setLoading(true);
      const params = {};
      if (weekFilter !== 'ALL') params.weekNumber = weekFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (mockTypeFilter !== 'ALL') params.mockType = mockTypeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/mentor/mocks', { params });
      if (res.data.success) {
        setSections(res.data.sections || []);
        setGlobalSummary(res.data.globalSummary || null);
      }
    } catch (err) {
      console.error('Failed to load mock sections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [weekFilter, statusFilter, mockTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSections();
  };

  // Partition into Current vs Previous
  const currentSections = sections.filter((s) => s.status === 'DRAFT' || s.status === 'PUBLISHED');
  const previousSections = sections.filter((s) => s.status === 'ARCHIVED' || (s.scheduledCount === 0 && s.completedCount > 0));

  const displaySections = activeTab === 'CURRENT' ? currentSections : previousSections;

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/reports/mocks?format=csv', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to export report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mentorhub-mock-interviews-report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export report error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Weekly Mocks</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
              Section-Based Scheduler
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure mock sections &middot; Manually schedule personalized candidate interview slots &middot; Conduct & record evaluations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportReport}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center gap-2 shadow-sm"
            title="Download complete Mock Interviews CSV report"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Mock</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Not Planned */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">Cohort Total</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {globalSummary?.notPlannedCohort ?? 0}
          </div>
          <div className="text-[11px] text-slate-500">Mentees in your cohort</div>
        </div>

        {/* Scheduled */}
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 space-y-1">
          <div className="flex items-center justify-between text-indigo-400 text-xs">
            <span className="font-semibold text-indigo-300">Scheduled Slots</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {globalSummary?.scheduledTotal ?? 0}
          </div>
          <div className="text-[11px] text-indigo-300/80">Pending interviews</div>
        </div>

        {/* Completed */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span className="font-semibold text-emerald-300">Completed & Evaluated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {globalSummary?.completedTotal ?? 0}
          </div>
          <div className="text-[11px] text-emerald-300/80">Scores released</div>
        </div>

        {/* Missed */}
        <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-1">
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span className="font-semibold text-rose-300">Missed (Absent)</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {globalSummary?.missedTotal ?? 0}
          </div>
          <div className="text-[11px] text-rose-300/80">Candidate absent</div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Current vs Previous Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('CURRENT')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'CURRENT'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" /> Current ({currentSections.length})
          </button>
          <button
            onClick={() => setActiveTab('PREVIOUS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'PREVIOUS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Previous ({previousSections.length})
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-auto md:max-w-sm flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mock section by title..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>
      </div>

      {/* Filter Dropdowns Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-semibold">Filter:</span>
        </div>

        {/* Mock Type */}
        <select
          value={mockTypeFilter}
          onChange={(e) => setMockTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Mock Types</option>
          <option value="TECHNICAL">Technical Deep-Dive</option>
          <option value="DSA">Data Structures & Algo (DSA)</option>
          <option value="COMMUNICATION_HR">HR & Communication</option>
          <option value="MIXED">Mixed (DSA + HR)</option>
          <option value="CUSTOM">Custom Project Review</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        {(search || weekFilter !== 'ALL' || statusFilter !== 'ALL' || mockTypeFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setWeekFilter('ALL');
              setStatusFilter('ALL');
              setMockTypeFilter('ALL');
            }}
            className="text-[11px] text-indigo-400 hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Mock Section Cards List */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading weekly mock sections...</p>
        </div>
      ) : displaySections.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-white font-bold text-sm">
            {activeTab === 'CURRENT' ? 'No Current Mock Sections' : 'No Previous Mock Sections'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'CURRENT'
              ? 'Start by creating a new mock section for this week. You will then manually allocate time slots to your cohort.'
              : 'Past sections with completed interviews and evaluation histories will appear here.'}
          </p>
          {activeTab === 'CURRENT' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> + New Mock Section
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displaySections.map((sec) => (
            <div
              key={sec.id}
              onClick={() => navigate(`/mentor/mocks/${sec.id}`)}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/20 transition cursor-pointer space-y-4 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold">
                      WEEK {sec.weekNumber}
                    </span>
                    <MockTypeBadge type={sec.mockType} />
                    <MockStatusBadge status={sec.status} />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition line-clamp-1">
                    {sec.title}
                  </h3>
                  {sec.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {sec.description}
                    </p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-indigo-500/40 transition flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Date & Venue Info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sec.dateRange}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sec.defaultSlotDurationMinutes} min default</span>
                </div>
                {sec.defaultVenue && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">📍</span>
                    <span className="truncate max-w-[140px]">{sec.defaultVenue}</span>
                  </div>
                )}
              </div>

              {/* Counts metrics bar */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="font-bold text-white text-xs">{sec.scheduledCount}</div>
                  <div className="text-[10px] text-indigo-300">Scheduled</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="font-bold text-white text-xs">{sec.completedCount}</div>
                  <div className="text-[10px] text-emerald-400">Completed</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="font-bold text-white text-xs">{sec.missedCount}</div>
                  <div className="text-[10px] text-rose-400">Missed</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="font-bold text-white text-xs">{sec.notPlannedCount}</div>
                  <div className="text-[10px] text-amber-400">Not Planned</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Mock Modal */}
      <CreateMockSectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchSections}
      />
    </div>
  );
};
