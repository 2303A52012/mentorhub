import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';
import { MockStatusBadge, MockTypeBadge, RecommendationBadge } from '../../components/mocks/MockBadges';
import { AssignSlotModal } from '../../components/mocks/AssignSlotModal';
import { SlotEvaluationModal } from '../../components/mocks/SlotEvaluationModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Send,
  Edit3,
  Search,
  Filter,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export const MockSectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useModal();

  const [section, setSection] = useState(null);
  const [cohortMentees, setCohortMentees] = useState([]);
  const [unassignedMentees, setUnassignedMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Tabs: 'SCHEDULE' | 'OVERVIEW' | 'MENTEES' | 'EVALUATIONS'
  const [activeTab, setActiveTab] = useState('SCHEDULE');

  // Filter & Search in Schedule
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL');

  // Filter in Mentees tab
  const [menteeSearch, setMenteeSearch] = useState('');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetMenteeForAssign, setTargetMenteeForAssign] = useState(null);

  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const fetchSectionDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/mentor/mocks/${id}`);
      if (res.data.success) {
        setSection(res.data.section);
        setCohortMentees(res.data.cohortMentees || []);
        setUnassignedMentees(res.data.unassignedMentees || []);
      }
    } catch (err) {
      showError('Error', err.response?.data?.message || 'Failed to load mock section details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSectionDetails();
  }, [id]);

  const handlePublish = async () => {
    const unassignedCount = unassignedMentees.length;
    const warningMsg = unassignedCount > 0
      ? `\n\nNote: ${unassignedCount} mentees in your cohort currently have no slot assigned.`
      : '';

    const confirmed = await showConfirm({
      title: 'Publish Mock Interview Schedule',
      message: `Once published, confirmed appointments will be visible to candidates on their Weekly Mocks dashboard.${warningMsg}`,
      confirmText: 'Publish Schedule',
      cancelText: 'Cancel',
      variant: unassignedCount > 0 ? 'warning' : 'info'
    });

    if (!confirmed) return;

    setPublishing(true);
    try {
      const res = await api.post(`/mentor/mocks/${id}/publish`);
      if (res.data.success) {
        showSuccess(
          'Schedule Published Successfully',
          `Schedule is now live! ${res.data.publishedSlotsCount} candidate appointments confirmed and in-app notifications dispatched.`
        );
        fetchSectionDetails();
      }
    } catch (err) {
      showError('Publish Failed', err.response?.data?.message || 'Failed to publish mock schedule.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading mock section details & schedule...</p>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-slate-400 text-sm">Mock section not found.</p>
        <Link to="/mentor/mocks" className="text-xs text-indigo-400 hover:underline">
          &larr; Back to Weekly Mocks
        </Link>
      </div>
    );
  }

  const slots = section.slots || [];

  // Filtered Slots
  const filteredSlots = slots.filter((slot) => {
    if (scheduleStatusFilter !== 'ALL' && slot.status !== scheduleStatusFilter) return false;
    if (selectedDateFilter !== 'ALL') {
      const slotDateStr = new Date(slot.sessionDate).toISOString().split('T')[0];
      if (slotDateStr !== selectedDateFilter) return false;
    }
    if (scheduleSearch.trim()) {
      const q = scheduleSearch.toLowerCase().trim();
      const name = (slot.mentee?.name || '').toLowerCase();
      const email = (slot.mentee?.email || '').toLowerCase();
      const roll = (slot.mentee?.menteeProfile?.rollNumber || '').toLowerCase();
      const room = (slot.roomNumber || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !roll.includes(q) && !room.includes(q)) return false;
    }
    return true;
  });

  // Unique session dates present in slots
  const uniqueDates = Array.from(
    new Set(slots.map((s) => new Date(s.sessionDate).toISOString().split('T')[0]))
  ).sort();

  // Filtered Mentees
  const filteredMentees = cohortMentees.filter((m) => {
    if (showUnassignedOnly && m.isAssigned) return false;
    if (menteeSearch.trim()) {
      const q = menteeSearch.toLowerCase().trim();
      const name = (m.name || '').toLowerCase();
      const roll = (m.menteeProfile?.rollNumber || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      if (!name.includes(q) && !roll.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const evaluatedSlots = slots.filter((s) => s.evaluation);

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/mentor/mocks"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Weekly Mocks
        </Link>

        {/* Section Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {section.status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              disabled={publishing || slots.length === 0}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {publishing ? 'Publishing...' : 'Publish Schedule'}
            </button>
          )}

          <button
            onClick={() => {
              setTargetMenteeForAssign(null);
              setShowAssignModal(true);
            }}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Time Slot</span>
          </button>
        </div>
      </div>

      {/* Hero Section Header Card */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
                WEEK {section.weekNumber}
              </span>
              <MockTypeBadge type={section.mockType} />
              <MockStatusBadge status={section.status} />
              {section.targetBatch && (
                <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 rounded-md font-mono">
                  Batch: {section.targetBatch.name}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {section.title}
            </h1>
            {section.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {section.description}
              </p>
            )}
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center min-w-[70px]">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{section.stats?.scheduledCount || 0}</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400">Scheduled</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center min-w-[70px]">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{section.stats?.completedCount || 0}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Completed</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center min-w-[70px]">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{section.stats?.missedCount || 0}</div>
              <div className="text-[10px] text-rose-600 dark:text-rose-400">Missed</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center min-w-[70px]">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{section.stats?.notPlannedCount || 0}</div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400">Not Planned</div>
            </div>
          </div>
        </div>

        {/* Warning Banner if unassigned mentees exist in published section */}
        {unassignedMentees.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                <strong>{unassignedMentees.length} mentees</strong> in your cohort have not been assigned an interview slot yet.
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('MENTEES');
                setShowUnassignedOnly(true);
              }}
              className="text-amber-700 dark:text-amber-200 underline font-semibold hover:text-amber-900 dark:hover:text-white transition flex-shrink-0"
            >
              Review Unassigned &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('SCHEDULE')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'SCHEDULE'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
          }`}
        >
          <Clock className="w-4 h-4" /> Time Slots & Schedule ({slots.length})
        </button>

        <button
          onClick={() => setActiveTab('MENTEES')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'MENTEES'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
          }`}
        >
          <Users className="w-4 h-4" /> Mentees & Progress ({cohortMentees.length})
        </button>

        <button
          onClick={() => setActiveTab('EVALUATIONS')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'EVALUATIONS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
          }`}
        >
          <Award className="w-4 h-4" /> Evaluations & Results ({evaluatedSlots.length})
        </button>

        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
          }`}
        >
          <Info className="w-4 h-4" /> Section Details
        </button>
      </div>

      {/* ======================================================= */}
      {/* TAB 1: SCHEDULE / TIME SLOTS TABLE                      */}
      {/* ======================================================= */}
      {activeTab === 'SCHEDULE' && (
        <div className="space-y-4">
          {/* Schedule Filter Bar */}
          <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Filters:
              </span>

              {/* Status filter */}
              <select
                value={scheduleStatusFilter}
                onChange={(e) => setScheduleStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Slot States</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Date Filter */}
              {uniqueDates.length > 1 && (
                <select
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Session Dates</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Candidate Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                placeholder="Search candidate or room..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          {/* Chronological Time Slots Table */}
          {filteredSlots.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
              <Clock className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="text-slate-900 dark:text-white font-bold text-sm">No Time Slots Match Filters</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign time slots manually for each mentee based on your availability.
              </p>
              <button
                onClick={() => {
                  setTargetMenteeForAssign(null);
                  setShowAssignModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Assign First Slot
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Mentee / Candidate</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Start Time</th>
                      <th className="py-3 px-3">End Time</th>
                      <th className="py-3 px-3">Room / Venue</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {filteredSlots.map((slot) => {
                      const dateStr = new Date(slot.sessionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });

                      return (
                        <tr
                          key={slot.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">
                              {slot.mentee?.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {slot.mentee?.menteeProfile?.rollNumber || slot.mentee?.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-slate-200">
                            {dateStr}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-indigo-600 dark:text-indigo-300 font-semibold">
                            {slot.startTime}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-indigo-600 dark:text-indigo-300 font-semibold">
                            {slot.endTime}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                              {slot.roomNumber}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <MockStatusBadge status={slot.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedSlot(slot);
                                setShowSlotModal(true);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                slot.status === 'COMPLETED'
                                  ? 'bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                  : 'bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                              }`}
                            >
                              {slot.status === 'COMPLETED' ? 'View Evaluation' : 'Conduct / Evaluate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 2: MENTEES COHORT & SCHEDULING PROGRESS             */}
      {/* ======================================================= */}
      {activeTab === 'MENTEES' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnassignedOnly}
                  onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-0"
                />
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Show Unassigned ("Not Planned") Only ({unassignedMentees.length})
                </span>
              </label>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={menteeSearch}
                onChange={(e) => setMenteeSearch(e.target.value)}
                placeholder="Search mentee name or roll..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-3">Roll Number</th>
                    <th className="py-3 px-3">Branch & Section</th>
                    <th className="py-3 px-3">Assigned Interview Slot</th>
                    <th className="py-3 px-3 text-center">Slot State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredMentees.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.email}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {m.menteeProfile?.rollNumber || m.menteeProfile?.studentId || 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 dark:text-slate-300">
                        {m.menteeProfile?.branch || 'CSE'} - Sec {m.menteeProfile?.section || 'A'}
                      </td>
                      <td className="py-3.5 px-3">
                        {m.assignedSlot ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-indigo-600 dark:text-indigo-300 font-bold">
                              {m.assignedSlot.startTime} - {m.assignedSlot.endTime}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {new Date(m.assignedSlot.sessionDate).toLocaleDateString()} &middot; {m.assignedSlot.roomNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            Not Planned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {m.assignedSlot ? (
                          <MockStatusBadge status={m.assignedSlot.status} />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {m.assignedSlot ? (
                          <button
                            onClick={() => {
                              setSelectedSlot(m.assignedSlot);
                              setShowSlotModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                          >
                            Manage Slot
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setTargetMenteeForAssign(m);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1 shadow-sm inline-flex ml-auto"
                          >
                            <Plus className="w-3.5 h-3.5" /> Assign Slot
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 3: EVALUATIONS & RESULTS SCORECARD                  */}
      {/* ======================================================= */}
      {activeTab === 'EVALUATIONS' && (
        <div className="space-y-4">
          {evaluatedSlots.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
              <Award className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="text-slate-900 dark:text-white font-bold text-sm">No Evaluations Recorded Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Once interviews are conducted, click on a candidate's slot in the Schedule tab to score them and release results.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Candidate Name</th>
                      <th className="py-3 px-3 text-center">Overall (0-10)</th>
                      <th className="py-3 px-3 text-center">Technical (/5)</th>
                      <th className="py-3 px-3 text-center">Problem Solving (/5)</th>
                      <th className="py-3 px-3 text-center">Communication (/5)</th>
                      <th className="py-3 px-3">Recommendation</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {evaluatedSlots.map((slot) => {
                      const ev = slot.evaluation;
                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{slot.mentee?.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {slot.mentee?.menteeProfile?.rollNumber || slot.mentee?.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-black text-sm text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30">
                              {ev.overallScore} / 10
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-cyan-600 dark:text-cyan-300 font-mono">
                            {ev.technicalScore}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-violet-600 dark:text-violet-300 font-mono">
                            {ev.problemSolvingScore}
                          </td>
                          <td className="py-3.5 px-3 text-center font-bold text-amber-600 dark:text-amber-300 font-mono">
                            {ev.communicationScore}
                          </td>
                          <td className="py-3.5 px-3">
                            <RecommendationBadge recommendation={ev.recommendation} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedSlot(slot);
                                setShowSlotModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                            >
                              Edit Score &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* TAB 4: SECTION OVERVIEW & DETAILS                       */}
      {/* ======================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs text-slate-700 dark:text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1">Section Specifications</h4>
                <p className="text-slate-500 dark:text-slate-400">General settings configured during mock section creation</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Week Cycle:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">Week {section.weekNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Interview Focus:</span>
                  <MockTypeBadge type={section.mockType} />
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Default Slot Duration:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{section.defaultSlotDurationMinutes} minutes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Default Venue / Link:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{section.defaultVenue || 'Room 101'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Publication Status:</span>
                  <MockStatusBadge status={section.status} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1">Instructions for Candidates</h4>
                <p className="text-slate-500 dark:text-slate-400">Visible to students once this schedule is published</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {section.description || 'No specific instructions provided for this mock session.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Slot Assignment Modal */}
      <AssignSlotModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setTargetMenteeForAssign(null);
        }}
        sectionId={id}
        defaultVenue={section.defaultVenue}
        defaultDuration={section.defaultSlotDurationMinutes}
        unassignedMentees={unassignedMentees}
        allCohortMentees={cohortMentees}
        targetMentee={targetMenteeForAssign}
        onSuccess={fetchSectionDetails}
      />

      {/* Slot Details & Evaluation Modal */}
      <SlotEvaluationModal
        isOpen={showSlotModal}
        onClose={() => {
          setShowSlotModal(false);
          setSelectedSlot(null);
        }}
        slot={selectedSlot}
        onSuccess={fetchSectionDetails}
      />
    </div>
  );
};
