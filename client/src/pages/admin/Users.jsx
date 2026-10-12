import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Plus,
  Mail,
  GraduationCap,
  CheckCircle2,
  X,
  Search,
  Filter,
  RefreshCw,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Key,
  AlertTriangle
} from 'lucide-react';

import { useModal } from '../../context/ModalContext';
import { ResetUserPasswordModal } from '../../components/common/ResetUserPasswordModal';

export const AdminUsers = () => {
  const { showSuccess, showError } = useModal();
  const [activeTab, setActiveTab] = useState('MENTEES');
  const [mentees, setMentees] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedMentor, setSelectedMentor] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showMenteeModal, setShowMenteeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetRequests, setResetRequests] = useState([]);

  // New Mentor Form State
  const [mentorForm, setMentorForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: 'Computer Science & Engineering',
    designation: 'Technical Mentor',
    password: 'Mentor@2027'
  });

  // New Mentee Form State
  const [menteeForm, setMenteeForm] = useState({
    name: '',
    email: '',
    studentId: '',
    rollNumber: '',
    branch: 'Computer Science & Engineering',
    batchId: '',
    mentorId: '',
    resumeUrl: '',
    password: 'Student@2024'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, menRes, bRes, rRes] = await Promise.all([
        api.get('/mentees'),
        api.get('/mentors'),
        api.get('/batches'),
        api.get('/auth/reset-requests').catch(() => ({ data: { requests: [] } }))
      ]);
      if (mRes.data.success) setMentees(mRes.data.mentees || []);
      if (menRes.data.success) setMentors(menRes.data.mentors || []);
      if (bRes.data.success) setBatches(bRes.data.batches || []);
      if (rRes?.data?.success) setResetRequests(rRes.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination on tab or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedBatch, selectedMentor]);

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/mentors', mentorForm);
      if (res.data.success) {
        showSuccess('Mentor Created', 'Mentor account has been created successfully!');
        setShowMentorModal(false);
        fetchData();
      }
    } catch (err) {
      showError('Creation Failed', err.response?.data?.message || 'Failed to create mentor account.');
    }
  };

  const handleCreateMentee = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/mentees', menteeForm);
      if (res.data.success) {
        showSuccess('Mentee Created', 'Mentee account has been created successfully!');
        setShowMenteeModal(false);
        fetchData();
      }
    } catch (err) {
      showError('Creation Failed', err.response?.data?.message || 'Failed to create mentee account.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBatch('ALL');
    setSelectedMentor('ALL');
  };

  // Filter Mentees
  const filteredMentees = useMemo(() => {
    return mentees.filter((m) => {
      const query = searchQuery.toLowerCase().trim();
      const roll = (m.profile?.rollNumber || '').toLowerCase();
      const studentId = (m.profile?.studentId || '').toLowerCase();
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const branch = (m.profile?.branch || '').toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        roll.includes(query) ||
        studentId.includes(query) ||
        email.includes(query) ||
        branch.includes(query);

      const matchesBatch =
        selectedBatch === 'ALL' ||
        (m.batches && m.batches.some((b) => b._id === selectedBatch || b.id === selectedBatch || b.name === selectedBatch)) ||
        (m.profile?.section && m.profile.section.toLowerCase() === selectedBatch.toLowerCase());

      const matchesMentor =
        selectedMentor === 'ALL' ||
        (m.mentors && m.mentors.some((men) => men._id === selectedMentor || men.id === selectedMentor || men.name.toLowerCase().includes(selectedMentor.toLowerCase())));

      return matchesSearch && matchesBatch && matchesMentor;
    });
  }, [mentees, searchQuery, selectedBatch, selectedMentor]);

  // Filter Mentors
  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      const query = searchQuery.toLowerCase().trim();
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const roll = (m.profile?.rollNumber || '').toLowerCase();
      const designation = (m.profile?.designation || '').toLowerCase();
      const department = (m.profile?.department || '').toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        roll.includes(query) ||
        email.includes(query) ||
        designation.includes(query) ||
        department.includes(query);

      const matchesBatch =
        selectedBatch === 'ALL' ||
        (m.batches && m.batches.some((b) => b._id === selectedBatch || b.id === selectedBatch || b.name === selectedBatch));

      return matchesSearch && matchesBatch;
    });
  }, [mentors, searchQuery, selectedBatch]);

  // Paginated Slices
  const activeItems = activeTab === 'MENTEES' ? filteredMentees : filteredMentors;
  const totalPages = Math.ceil(activeItems.length / pageSize) || 1;
  const paginatedItems = activeItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters = searchQuery !== '' || selectedBatch !== 'ALL' || (activeTab === 'MENTEES' && selectedMentor !== 'ALL');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" /> User Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and manage faculty mentors, enrolled mentees, coding profiles, and batch mappings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMentorModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Mentor
          </button>
          <button
            onClick={() => setShowMenteeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5" /> Add Mentee
          </button>
        </div>
      </div>

      {/* Pending Reset Requests Banner (if any) */}
      {resetRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                Pending Password Reset Requests
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[10px] font-black">
                  {resetRequests.filter((r) => r.status === 'PENDING').length}
                </span>
              </h4>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                The following users requested password recovery. You can reset their password immediately.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {resetRequests
              .filter((r) => r.status === 'PENDING')
              .map((req) => (
                <div key={req.id || req.requesterId} className="flex items-center gap-1 bg-amber-500/20 p-1 rounded-xl border border-amber-500/30">
                  <button
                    onClick={() => {
                      setResetTargetUser({
                        id: req.requesterId || req.id,
                        _id: req.requesterId || req.id,
                        name: req.name || req.email,
                        email: req.email,
                        role: req.role || 'USER'
                      });
                      setShowResetModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition flex items-center gap-1 shadow-md shadow-amber-500/20"
                  >
                    <Key className="w-3 h-3" /> Reset {req.name || req.email} ({req.role})
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const targetUserId = req.requesterId || req.id;
                        await api.post('/auth/reset-requests/dismiss', { userId: targetUserId });
                        setResetRequests((prev) =>
                          prev.filter((r) => (r.requesterId !== targetUserId && r.id !== req.id))
                        );
                        showToast('Password reset request dismissed.', 'info');
                      } catch (err) {
                        console.error('Failed to dismiss reset request', err);
                      }
                    }}
                    className="p-1 text-amber-300 hover:text-white rounded-lg hover:bg-amber-500/30 transition"
                    title="Dismiss Request"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabs & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setActiveTab('MENTEES');
              resetFilters();
            }}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'MENTEES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Mentees ({mentees.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('MENTORS');
              resetFilters();
            }}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'MENTORS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Mentors ({mentors.length})
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>
            Showing <strong className="text-white">{activeItems.length}</strong> of{' '}
            {activeTab === 'MENTEES' ? mentees.length : mentors.length}{' '}
            {activeTab === 'MENTEES' ? 'students' : 'mentors'}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'MENTEES'
                ? 'Search student by Name, Roll No (e.g. 24A91A0501), Email, Branch...'
                : 'Search mentor by Name, Faculty Roll No (e.g. FAC-CSE-001), Email, Department...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Batch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Batches</option>
              {batches.map((b) => (
                <option key={b._id || b.id} value={b.name || b._id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mentees Tab: Filter by Assigned Mentor */}
          {activeTab === 'MENTEES' && (
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Assigned Mentors</option>
                {mentors.map((men) => (
                  <option key={men._id || men.id} value={men.name} className="bg-slate-900 text-white">
                    {men.name} {men.profile?.rollNumber ? `(${men.profile.rollNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading user directory records...</p>
        </div>
      ) : activeTab === 'MENTEES' ? (
        /* ==================== MENTEES DIRECTORY TABLE ==================== */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Roll Number</th>
                  <th className="py-3 px-3">Branch & Batch</th>
                  <th className="py-3 px-3">Assigned Mentor</th>
                  <th className="py-3 px-3">Coding Profiles</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-500">
                      No mentee records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((m) => (
                    <tr key={m._id || m.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <Link
                          to={`/admin/mentees/${m._id || m.id}`}
                          className="font-semibold text-white hover:text-indigo-300 hover:underline transition"
                        >
                          {m.name}
                        </Link>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-slate-500" /> {m.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <Link
                          to={`/admin/mentees/${m._id || m.id}`}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-white hover:border-indigo-500 transition inline-block"
                        >
                          {m.profile?.rollNumber || m.profile?.studentId || 'N/A'}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">{m.profile?.branch || 'CSE'}</div>
                        <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                          {m.batches && m.batches.length > 0
                            ? m.batches.map((b) => b.name).join(', ')
                            : m.profile?.section || 'Default Batch'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {m.mentors && m.mentors.length > 0 ? (
                          m.mentors.map((men) => (
                            <div key={men._id || men.id} className="text-xs">
                              <span className="font-semibold text-indigo-300">{men.name}</span>
                              {men.email && (
                                <div className="text-[10px] text-slate-500">{men.email}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[10px]">
                          {m.codingProfile?.leetcodeUrl && (
                            <a
                              href={m.codingProfile.leetcodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:underline border border-amber-500/20"
                            >
                              LC
                            </a>
                          )}
                          {m.codingProfile?.codeforcesUrl && (
                            <a
                              href={m.codingProfile.codeforcesUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:underline border border-rose-500/20"
                            >
                              CF
                            </a>
                          )}
                          {m.codingProfile?.hackerrankUrl && (
                            <a
                              href={m.codingProfile.hackerrankUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:underline border border-emerald-500/20"
                            >
                              HR
                            </a>
                          )}
                          {m.codingProfile?.githubUrl && (
                            <a
                              href={m.codingProfile.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 hover:underline border border-purple-500/20"
                            >
                              GH
                            </a>
                          )}
                          {m.codingProfile?.linkedinUrl && (
                            <a
                              href={m.codingProfile.linkedinUrl.startsWith('http') ? m.codingProfile.linkedinUrl : `https://${m.codingProfile.linkedinUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 hover:underline border border-sky-500/20"
                            >
                              IN
                            </a>
                          )}
                          {m.codingProfile?.resumeUrl && (
                            <a
                              href={m.codingProfile.resumeUrl.startsWith('http') ? m.codingProfile.resumeUrl : `https://${m.codingProfile.resumeUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View Resume / CV"
                              className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 hover:underline border border-purple-500/20 font-bold"
                            >
                              CV
                            </a>
                          )}
                          {!m.codingProfile?.leetcodeUrl &&
                            !m.codingProfile?.githubUrl &&
                            !m.codingProfile?.codeforcesUrl &&
                            !m.codingProfile?.resumeUrl && (
                              <span className="text-slate-500">-</span>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                          {m.accountStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setResetTargetUser(m);
                              setShowResetModal(true);
                            }}
                            title="Reset Password (Direct Admin Override)"
                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-[11px] border border-amber-500/30 transition inline-flex items-center gap-1"
                          >
                            <Key className="w-3 h-3" /> Reset
                          </button>
                          <Link
                            to={`/admin/mentees/${m._id || m.id}`}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium text-[11px] border border-indigo-500/30 transition inline-flex items-center gap-1"
                          >
                            Profile ↗
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <strong className="text-white">{currentPage}</strong> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== MENTORS DIRECTORY TABLE ==================== */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Mentor Name</th>
                  <th className="py-3 px-3">Faculty Roll No</th>
                  <th className="py-3 px-3">Department & Designation</th>
                  <th className="py-3 px-3">Assigned Batches</th>
                  <th className="py-3 px-3 text-center">Active Mentees</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-500">
                      No mentor records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((m) => (
                    <tr key={m._id || m.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" /> {m.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-indigo-300">
                          {m.profile?.rollNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">
                          {m.profile?.designation || 'Technical Mentor'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m.profile?.department || 'Computer Science & Engineering'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {m.batches && m.batches.length > 0 ? (
                          m.batches.map((b) => (
                            <span
                              key={b._id || b.id}
                              className="inline-block bg-slate-800/90 text-indigo-300 border border-slate-700/80 px-2 py-0.5 rounded text-[10px] mr-1 mb-1 font-mono"
                            >
                              {b.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[10px]">No batch linked</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs">
                          {m.activeMenteesCount || 0} students
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                          {m.accountStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <Link
                          to={`/admin/mentors/${m._id || m.id}`}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium text-[11px] border border-indigo-500/30 transition inline-flex items-center gap-1"
                        >
                          Profile ↗
                        </Link>
                        <button
                          onClick={() => {
                            setResetTargetUser(m);
                            setShowResetModal(true);
                          }}
                          title="Reset Password (Direct Admin Override)"
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-[11px] border border-amber-500/30 transition inline-flex items-center gap-1"
                        >
                          <Key className="w-3 h-3" /> Reset Password
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <strong className="text-white">{currentPage}</strong> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Creation Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Mentor Account</h3>
              <button
                onClick={() => setShowMentorModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMentor} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={mentorForm.name}
                  onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                  placeholder="Prof. Jane Doe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={mentorForm.email}
                  onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                  placeholder="2303a52012@sru.edu.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Faculty Roll No</label>
                <input
                  type="text"
                  value={mentorForm.rollNumber}
                  onChange={(e) => setMentorForm({ ...mentorForm, rollNumber: e.target.value })}
                  placeholder="FAC-CSE-001"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Designation</label>
                <input
                  type="text"
                  value={mentorForm.designation}
                  onChange={(e) =>
                    setMentorForm({ ...mentorForm, designation: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mentee Creation Modal */}
      {showMenteeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Mentee Account</h3>
              <button
                onClick={() => setShowMenteeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMentee} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={menteeForm.name}
                  onChange={(e) => setMenteeForm({ ...menteeForm, name: e.target.value })}
                  placeholder="e.g. Jordan Smith"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={menteeForm.email}
                  onChange={(e) => setMenteeForm({ ...menteeForm, email: e.target.value })}
                  placeholder="2403a58001@sru.edu.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={menteeForm.rollNumber}
                    onChange={(e) =>
                      setMenteeForm({ ...menteeForm, rollNumber: e.target.value })
                    }
                    placeholder="24A91A0501"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Student ID</label>
                  <input
                    type="text"
                    required
                    value={menteeForm.studentId}
                    onChange={(e) =>
                      setMenteeForm({ ...menteeForm, studentId: e.target.value })
                    }
                    placeholder="STU2027200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Assign to Batch</label>
                <select
                  value={menteeForm.batchId}
                  onChange={(e) => setMenteeForm({ ...menteeForm, batchId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- No initial batch --</option>
                  {batches.map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Assign Mentor</label>
                <select
                  value={menteeForm.mentorId}
                  onChange={(e) => setMenteeForm({ ...menteeForm, mentorId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- No mentor assigned yet --</option>
                  {mentors.map((m) => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.name} ({m.profile?.rollNumber || m.profile?.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Resume / Portfolio Link (Optional)</label>
                <input
                  type="url"
                  value={menteeForm.resumeUrl}
                  onChange={(e) => setMenteeForm({ ...menteeForm, resumeUrl: e.target.value })}
                  placeholder="https://drive.google.com/... or https://resume.pdf"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMenteeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Mentee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Password Reset Modal */}
      <ResetUserPasswordModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetTargetUser(null);
        }}
        targetUser={resetTargetUser}
        onSuccess={() => {
          if (resetTargetUser) {
            const targetId = resetTargetUser.id || resetTargetUser._id;
            setResetRequests((prev) =>
              prev.filter((r) => r.requesterId !== targetId && r.id !== targetId)
            );
          }
          fetchData();
        }}
      />
    </div>
  );
};
