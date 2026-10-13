import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Crown,
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
  AlertTriangle,
  Trash2,
  ArrowRightLeft,
  UserMinus,
  UserPlus,
  CheckSquare,
  Square
} from 'lucide-react';

import { useModal } from '../../context/ModalContext';
import { ResetUserPasswordModal } from '../../components/common/ResetUserPasswordModal';

export const AdminUsers = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin || user?.email?.toLowerCase() === 'admin@sru.edu.in';
  const { showSuccess, showError, showConfirm } = useModal();

  const [activeTab, setActiveTab] = useState('MENTEES'); // 'MENTEES' | 'MENTORS' | 'ADMINS'
  const [mentees, setMentees] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [admins, setAdmins] = useState([]);
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
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetRequests, setResetRequests] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // Reallocation Modal State (Admin & Super Admin)
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [reallocateSourceMentorId, setReallocateSourceMentorId] = useState('');
  const [reallocateTargetMentorId, setReallocateTargetMentorId] = useState('');
  const [selectedMenteeIds, setSelectedMenteeIds] = useState([]);
  const [deactivateSourceMentor, setDeactivateSourceMentor] = useState(false);
  const [reallocateReason, setReallocateReason] = useState('');
  const [reallocationLoading, setReallocationLoading] = useState(false);
  const [reallocateSearchQuery, setReallocateSearchQuery] = useState('');

  // Single Mentee Reassign Modal State
  const [showSingleReassignModal, setShowSingleReassignModal] = useState(false);
  const [singleReassignMentee, setSingleReassignMentee] = useState(null);
  const [singleTargetMentorId, setSingleTargetMentorId] = useState('');
  const [singleReassignLoading, setSingleReassignLoading] = useState(false);

  // New Admin Form State
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: 'Password@123'
  });

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
      const promises = [
        api.get('/mentees'),
        api.get('/mentors'),
        api.get('/batches'),
        api.get('/auth/reset-requests').catch(() => ({ data: { requests: [] } }))
      ];

      if (isSuperAdmin) {
        promises.push(api.get('/users/admins').catch(() => ({ data: { admins: [] } })));
      }

      const [mRes, menRes, bRes, rRes, aRes] = await Promise.all(promises);
      if (mRes.data.success) setMentees(mRes.data.mentees || []);
      if (menRes.data.success) setMentors(menRes.data.mentors || []);
      if (bRes.data.success) setBatches(bRes.data.batches || []);
      if (rRes?.data?.success) setResetRequests(rRes.data.requests || []);
      if (aRes?.data?.success) setAdmins(aRes.data.admins || []);
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

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const res = await api.post('/users/admins', adminForm);
      if (res.data.success) {
        showSuccess('Administrator Created', res.data.message || 'Administrator account created successfully!');
        setShowAdminModal(false);
        setAdminForm({ name: '', email: '', password: 'Password@123' });
        const aRes = await api.get('/users/admins');
        if (aRes.data.success) setAdmins(aRes.data.admins || []);
        setActiveTab('ADMINS');
      }
    } catch (err) {
      showError('Failed to Create Admin', err.response?.data?.message || 'Could not create administrator account.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleToggleAdminStatus = async (admin) => {
    if (admin.email?.toLowerCase() === 'admin@sru.edu.in') {
      showError('Action Prohibited', 'The primary Super Administrator cannot be deactivated.');
      return;
    }
    const newStatus = admin.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch(`/users/admins/${admin.id || admin._id}`, { accountStatus: newStatus });
      if (res.data.success) {
        showSuccess('Status Updated', `Administrator '${admin.name}' is now ${newStatus.toLowerCase()}.`);
        setAdmins((prev) =>
          prev.map((a) => (a.id === admin.id || a._id === admin._id ? { ...a, accountStatus: newStatus } : a))
        );
      }
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Failed to update administrator status.');
    }
  };

  const handleDeleteAdmin = (admin) => {
    if (admin.email?.toLowerCase() === 'admin@sru.edu.in') {
      showError('Action Prohibited', 'The primary Super Administrator account cannot be deleted.');
      return;
    }
    showConfirm({
      title: 'Delete Administrator',
      message: `Are you sure you want to permanently delete administrator '${admin.name}' (${admin.email})? They will lose all administrative privileges immediately.`,
      confirmText: 'Delete Administrator',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/users/admins/${admin.id || admin._id}`);
          if (res.data.success) {
            showSuccess('Administrator Deleted', res.data.message || 'Administrator deleted successfully.');
            setAdmins((prev) => prev.filter((a) => a.id !== admin.id && a._id !== admin._id));
          }
        } catch (err) {
          showError('Delete Failed', err.response?.data?.message || 'Failed to delete administrator account.');
        }
      }
    });
  };

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

  // Available mentees for the chosen source mentor in reallocation modal
  const availableSourceMentees = useMemo(() => {
    if (!reallocateSourceMentorId) return [];
    const fromMentees = mentees.filter((m) =>
      m.mentors && m.mentors.some((men) => (men.id || men._id) === reallocateSourceMentorId)
    );
    if (fromMentees.length > 0) return fromMentees;
    const sMentor = mentors.find((m) => (m.id || m._id) === reallocateSourceMentorId);
    return (sMentor?.assignedMentees || []).map((am) => ({
      id: am.id || am._id,
      _id: am.id || am._id,
      name: am.name,
      email: am.email,
      profile: { rollNumber: am.rollNumber }
    }));
  }, [mentees, mentors, reallocateSourceMentorId]);

  const filteredSourceMentees = useMemo(() => {
    if (!reallocateSearchQuery.trim()) return availableSourceMentees;
    const q = reallocateSearchQuery.toLowerCase().trim();
    return availableSourceMentees.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const roll = (m.profile?.rollNumber || m.profile?.studentId || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      return name.includes(q) || roll.includes(q) || email.includes(q);
    });
  }, [availableSourceMentees, reallocateSearchQuery]);

  const handleSourceMentorChange = (mId) => {
    setReallocateSourceMentorId(mId);
    if (!mId) {
      setSelectedMenteeIds([]);
      return;
    }
    const sMentees = mentees.filter((m) =>
      m.mentors && m.mentors.some((men) => (men.id || men._id) === mId)
    );
    if (sMentees.length > 0) {
      setSelectedMenteeIds(sMentees.map((m) => m.id || m._id));
    } else {
      const sMentor = mentors.find((m) => (m.id || m._id) === mId);
      setSelectedMenteeIds((sMentor?.assignedMentees || []).map((am) => am.id || am._id));
    }
  };

  const handleOpenReallocateModal = (sourceMentor = null) => {
    if (sourceMentor) {
      const mId = sourceMentor.id || sourceMentor._id;
      setReallocateSourceMentorId(mId);
      const sMentees = mentees.filter((m) =>
        m.mentors && m.mentors.some((men) => (men.id || men._id) === mId)
      );
      if (sMentees.length > 0) {
        setSelectedMenteeIds(sMentees.map((m) => m.id || m._id));
      } else {
        setSelectedMenteeIds((sourceMentor.assignedMentees || []).map((am) => am.id || am._id));
      }
    } else {
      setReallocateSourceMentorId('');
      setSelectedMenteeIds([]);
    }
    setReallocateTargetMentorId('');
    setDeactivateSourceMentor(false);
    setReallocateReason('');
    setReallocateSearchQuery('');
    setShowReallocateModal(true);
  };

  const handleToggleMenteeSelection = (id) => {
    setSelectedMenteeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllMentees = () => {
    if (selectedMenteeIds.length === availableSourceMentees.length) {
      setSelectedMenteeIds([]);
    } else {
      setSelectedMenteeIds(availableSourceMentees.map((m) => m.id || m._id));
    }
  };

  const handleReallocateSubmit = async (e) => {
    e.preventDefault();
    if (!reallocateSourceMentorId) {
      showError('Source Mentor Required', 'Please choose the mentor whose students are being transferred.');
      return;
    }
    if (!reallocateTargetMentorId) {
      showError('Target Mentor Required', 'Please choose the new mentor who will receive these students.');
      return;
    }
    if (reallocateSourceMentorId === reallocateTargetMentorId) {
      showError('Invalid Selection', 'Source and target mentors must be different.');
      return;
    }
    if (selectedMenteeIds.length === 0) {
      showError('No Students Selected', 'Please select at least one student to transfer.');
      return;
    }

    const tMentor = mentors.find((m) => (m.id || m._id) === reallocateTargetMentorId);

    setReallocationLoading(true);
    try {
      const res = await api.post('/reallocate-mentor', {
        sourceMentorId: reallocateSourceMentorId,
        targetMentorId: reallocateTargetMentorId,
        menteeIds: selectedMenteeIds,
        deactivateSourceMentor,
        reason: reallocateReason
      });

      if (res.data.success) {
        showSuccess(
          'Reallocation Completed',
          res.data.message || `Successfully transferred ${selectedMenteeIds.length} student(s) to ${tMentor?.name}.`
        );
        setShowReallocateModal(false);
        await fetchData();
      }
    } catch (err) {
      showError('Reallocation Failed', err.response?.data?.message || 'Failed to reallocate students.');
    } finally {
      setReallocationLoading(false);
    }
  };

  const handleOpenSingleReassignModal = (mentee) => {
    setSingleReassignMentee(mentee);
    const currentMentorId = mentee.mentors?.[0]?.id || mentee.mentors?.[0]?._id || '';
    setSingleTargetMentorId(currentMentorId);
    setShowSingleReassignModal(true);
  };

  const handleSingleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!singleReassignMentee) return;
    if (!singleTargetMentorId) {
      showError('Missing Information', 'Please select a mentor.');
      return;
    }

    setSingleReassignLoading(true);
    try {
      const menteeId = singleReassignMentee.id || singleReassignMentee._id;
      const res = await api.post(`/mentees/${menteeId}/mentors`, {
        mentorId: singleTargetMentorId
      });

      if (res.data.success) {
        showSuccess('Mentor Assigned', res.data.message || 'Mentor updated successfully.');
        setShowSingleReassignModal(false);
        setSingleReassignMentee(null);
        await fetchData();
      }
    } catch (err) {
      showError('Reassignment Failed', err.response?.data?.message || 'Failed to reassign mentor.');
    } finally {
      setSingleReassignLoading(false);
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

  // Filter Admins (Super Admin only)
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const query = searchQuery.toLowerCase().trim();
      const name = (a.name || '').toLowerCase();
      const email = (a.email || '').toLowerCase();
      const status = (a.accountStatus || '').toLowerCase();

      return !query || name.includes(query) || email.includes(query) || status.includes(query);
    });
  }, [admins, searchQuery]);

  // Paginated Slices
  const activeItems =
    activeTab === 'MENTEES'
      ? filteredMentees
      : activeTab === 'MENTORS'
      ? filteredMentors
      : filteredAdmins;
  const totalPages = Math.ceil(activeItems.length / pageSize) || 1;
  const paginatedItems = activeItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActiveFilters =
    searchQuery !== '' ||
    (activeTab !== 'ADMINS' && selectedBatch !== 'ALL') ||
    (activeTab === 'MENTEES' && selectedMentor !== 'ALL');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> User Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, and manage faculty mentors, enrolled mentees, coding profiles, and batch mappings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => handleOpenReallocateModal()}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            title="Reallocate students from one mentor to another in bulk or selective transfer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Reallocate Mentees
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Add Admin
            </button>
          )}
          <button
            onClick={() => setShowMentorModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-semibold transition border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Add Mentor
          </button>
          <button
            onClick={() => setShowMenteeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add Mentee
          </button>
        </div>
      </div>

      {/* Pending Reset Requests Banner (if any) */}
      {resetRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                Pending Password Reset Requests
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[10px] font-black">
                  {resetRequests.filter((r) => r.status === 'PENDING').length}
                </span>
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-200/80 mt-0.5">
                The following users requested password recovery. You can reset their password immediately.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {resetRequests
              .filter((r) => r.status === 'PENDING')
              .map((req) => (
                <div key={req.id || req.requesterId} className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/20 p-1 rounded-xl border border-amber-200 dark:border-amber-500/30">
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
                    className="p-1 text-amber-700 dark:text-amber-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-amber-200 dark:hover:bg-amber-500/30 transition"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              setActiveTab('MENTEES');
              resetFilters();
            }}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'MENTEES'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm'
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
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Mentors ({mentors.length})
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setActiveTab('ADMINS');
                resetFilters();
              }}
              className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                activeTab === 'ADMINS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 shadow-sm'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500" /> Admins ({admins.length})
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{activeItems.length}</strong> of{' '}
            {activeTab === 'MENTEES'
              ? `${mentees.length} students`
              : activeTab === 'MENTORS'
              ? `${mentors.length} mentors`
              : `${admins.length} administrators`}
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'MENTEES'
                ? 'Search student by Name, Roll No (e.g. 24A91A0501), Email, Branch...'
                : activeTab === 'MENTORS'
                ? 'Search mentor by Name, Faculty Roll No (e.g. FAC-CSE-001), Email, Department...'
                : 'Search administrator by Name, Email, Status...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== 'ADMINS' && (
            <>
              {/* Batch Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Batches</option>
                  {batches.map((b) => (
                    <option key={b._id || b.id} value={b.name || b._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mentees Tab: Filter by Assigned Mentor */}
              {activeTab === 'MENTEES' && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 dark:text-white focus:outline-none cursor-pointer max-w-[180px] truncate"
                  >
                    <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Assigned Mentors</option>
                    {mentors.map((men) => (
                      <option key={men._id || men.id} value={men.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {men.name} {men.profile?.rollNumber ? `(${men.profile.rollNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900/60 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <RefreshCw className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading user directory records...</p>
        </div>
      ) : activeTab === 'MENTEES' ? (
        /* ==================== MENTEES DIRECTORY TABLE ==================== */
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-500">
                      No mentee records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((m) => (
                    <tr key={m._id || m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <Link
                          to={`/admin/mentees/${m._id || m.id}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline transition"
                        >
                          {m.name}
                        </Link>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {m.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <Link
                          to={`/admin/mentees/${m._id || m.id}`}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white hover:border-indigo-500 transition inline-block"
                        >
                          {m.profile?.rollNumber || m.profile?.studentId || 'N/A'}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{m.profile?.branch || 'CSE'}</div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                          {m.batches && m.batches.length > 0
                            ? m.batches.map((b) => b.name).join(', ')
                            : m.profile?.section || 'Default Batch'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {m.mentors && m.mentors.length > 0 ? (
                          m.mentors.map((men) => (
                            <div key={men._id || men.id} className="text-xs">
                              <span className="font-semibold text-indigo-700 dark:text-indigo-300">{men.name}</span>
                              {men.email && (
                                <div className="text-[10px] text-slate-500">{men.email}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-[10px]">
                          {m.codingProfile?.leetcodeUrl && (
                            <a
                              href={m.codingProfile.leetcodeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:underline border border-amber-500/20"
                            >
                              LC
                            </a>
                          )}
                          {m.codingProfile?.codeforcesUrl && (
                            <a
                              href={m.codingProfile.codeforcesUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:underline border border-rose-500/20"
                            >
                              CF
                            </a>
                          )}
                          {m.codingProfile?.hackerrankUrl && (
                            <a
                              href={m.codingProfile.hackerrankUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:underline border border-emerald-500/20"
                            >
                              HR
                            </a>
                          )}
                          {m.codingProfile?.githubUrl && (
                            <a
                              href={m.codingProfile.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:underline border border-purple-500/20"
                            >
                              GH
                            </a>
                          )}
                          {m.codingProfile?.linkedinUrl && (
                            <a
                              href={m.codingProfile.linkedinUrl.startsWith('http') ? m.codingProfile.linkedinUrl : `https://${m.codingProfile.linkedinUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:underline border border-sky-500/20"
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
                              className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:underline border border-purple-500/20 font-bold"
                            >
                              CV
                            </a>
                          )}
                          {!m.codingProfile?.leetcodeUrl &&
                            !m.codingProfile?.githubUrl &&
                            !m.codingProfile?.codeforcesUrl &&
                            !m.codingProfile?.resumeUrl && (
                              <span className="text-slate-400 dark:text-slate-500">-</span>
                            )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                          {m.accountStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenSingleReassignModal(m)}
                            title="Reassign this student to another mentor"
                            className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-medium text-[11px] border border-sky-200 dark:border-sky-500/30 transition inline-flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3 h-3" /> Reassign
                          </button>
                          <button
                            onClick={() => {
                              setResetTargetUser(m);
                              setShowResetModal(true);
                            }}
                            title="Reset Password (Direct Admin Override)"
                            className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-500/30 transition inline-flex items-center gap-1"
                          >
                            <Key className="w-3 h-3" /> Reset
                          </button>
                          <Link
                            to={`/admin/mentees/${m._id || m.id}`}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-medium text-[11px] border border-indigo-200 dark:border-indigo-500/30 transition inline-flex items-center gap-1"
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
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'MENTORS' ? (
        /* ==================== MENTORS DIRECTORY TABLE ==================== */
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-500">
                      No mentor records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((m) => (
                    <tr key={m._id || m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {m.email}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-indigo-700 dark:text-indigo-300">
                          {m.profile?.rollNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {m.profile?.designation || 'Technical Mentor'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {m.profile?.department || 'Computer Science & Engineering'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {m.batches && m.batches.length > 0 ? (
                          m.batches.map((b) => (
                            <span
                              key={b._id || b.id}
                              className="inline-block bg-slate-100 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700/80 px-2 py-0.5 rounded text-[10px] mr-1 mb-1 font-mono"
                            >
                              {b.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">No batch linked</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-1 rounded-full text-xs">
                          {m.activeMenteesCount || 0} students
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                          {m.accountStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenReallocateModal(m)}
                          title="Reallocate students of this mentor to another mentor"
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-500/30 transition inline-flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> Reallocate
                        </button>
                        <Link
                          to={`/admin/mentors/${m._id || m.id}`}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium text-[11px] border border-indigo-200 dark:border-indigo-500/30 transition inline-flex items-center gap-1"
                        >
                          Profile ↗
                        </Link>
                        <button
                          onClick={() => {
                            setResetTargetUser(m);
                            setShowResetModal(true);
                          }}
                          title="Reset Password (Direct Admin Override)"
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200 dark:border-slate-700 transition inline-flex items-center gap-1"
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
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== ADMINISTRATORS DIRECTORY TABLE (SUPER ADMIN EXCLUSIVE) ==================== */
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" /> Platform Administrators Roster
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Solely visible to Super Administrator ({user?.email || 'admin@sru.edu.in'}). You can add, manage, reset credentials, or remove administrators.
              </p>
            </div>
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Add Administrator
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Administrator</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Role Authority</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Created At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">
                      No administrator records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((a) => {
                    const isSuper = a.email?.toLowerCase() === 'admin@sru.edu.in' || a.isSuperAdmin;
                    return (
                      <tr key={a._id || a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSuper
                                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {a.name ? a.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {a.name}
                                {isSuper && (
                                  <span title="Primary Super Administrator" className="text-amber-500 inline-flex items-center">
                                    <Crown className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {isSuper ? 'Primary University Super Admin' : 'Platform Administrator'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {a.email}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {isSuper ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-500" /> Super Admin
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                              <Shield className="w-3 h-3 text-indigo-500" /> Admin
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                              a.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {a.accountStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setResetTargetUser(a);
                                setShowResetModal(true);
                              }}
                              title="Reset Admin Password"
                              className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-200 dark:border-amber-500/30 transition inline-flex items-center gap-1"
                            >
                              <Key className="w-3 h-3" /> Reset
                            </button>
                            {!isSuper && (
                              <>
                                <button
                                  onClick={() => handleToggleAdminStatus(a)}
                                  title={a.accountStatus === 'ACTIVE' ? 'Deactivate Admin' : 'Activate Admin'}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200 dark:border-slate-700 transition"
                                >
                                  {a.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(a)}
                                  title="Delete Admin"
                                  className="p-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>
                Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Creation Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Mentor Account</h3>
              <button
                onClick={() => setShowMentorModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMentor} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={mentorForm.name}
                  onChange={(e) => setMentorForm({ ...mentorForm, name: e.target.value })}
                  placeholder="Prof. Jane Doe"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={mentorForm.email}
                  onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                  placeholder="mentor@university.edu"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Faculty Roll No</label>
                <input
                  type="text"
                  value={mentorForm.rollNumber}
                  onChange={(e) => setMentorForm({ ...mentorForm, rollNumber: e.target.value })}
                  placeholder="FAC-CSE-001"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Designation</label>
                <input
                  type="text"
                  value={mentorForm.designation}
                  onChange={(e) =>
                    setMentorForm({ ...mentorForm, designation: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Mentee Account</h3>
              <button
                onClick={() => setShowMenteeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMentee} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={menteeForm.name}
                  onChange={(e) => setMenteeForm({ ...menteeForm, name: e.target.value })}
                  placeholder="e.g. Jordan Smith"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={menteeForm.email}
                  onChange={(e) => setMenteeForm({ ...menteeForm, email: e.target.value })}
                  placeholder="student@university.edu"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-medium">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={menteeForm.rollNumber}
                    onChange={(e) =>
                      setMenteeForm({ ...menteeForm, rollNumber: e.target.value })
                    }
                    placeholder="24A91A0501"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-medium">Student ID</label>
                  <input
                    type="text"
                    required
                    value={menteeForm.studentId}
                    onChange={(e) =>
                      setMenteeForm({ ...menteeForm, studentId: e.target.value })
                    }
                    placeholder="STU2027200"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Assign to Batch</label>
                <select
                  value={menteeForm.batchId}
                  onChange={(e) => setMenteeForm({ ...menteeForm, batchId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                <label className="text-slate-700 dark:text-slate-300 font-medium">Assign Mentor</label>
                <select
                  value={menteeForm.mentorId}
                  onChange={(e) => setMenteeForm({ ...menteeForm, mentorId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                <label className="text-slate-700 dark:text-slate-300 font-medium">Resume / Portfolio Link (Optional)</label>
                <input
                  type="url"
                  value={menteeForm.resumeUrl}
                  onChange={(e) => setMenteeForm({ ...menteeForm, resumeUrl: e.target.value })}
                  placeholder="https://drive.google.com/... or https://resume.pdf"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMenteeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
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

      {/* Administrator Creation Modal (Super Admin only) */}
      {showAdminModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Platform Administrator</h3>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Super Administrator Privilege</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-[11px] text-purple-900 dark:text-purple-200/90 leading-relaxed">
              <strong>Super Admin Policy:</strong> Appointed administrators can manage students, mentors, batches, weekly tasks, reviews, and reports. Only the Super Administrator (<span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">admin@sru.edu.in</span>) can add, modify, or delete administrators.
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Administrator Full Name</label>
                <input
                  type="text"
                  required
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Kumar (Academic Admin)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Official University Email</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="e.g. ramesh.k@sru.edu.in"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Initial Temporary Password</label>
                <input
                  type="text"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="Password@123"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                  The admin will be prompted to change their password on first login.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {adminLoading ? 'Creating...' : 'Create Administrator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk / Selective Mentor Reallocation Modal */}
      {showReallocateModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/30">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Reallocate Mentees (Mentor Transfer)</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Transfer student assignments from one faculty mentor to another in bulk or selectively.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReallocateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReallocateSubmit} className="space-y-4 text-xs">
              {/* Step 1: Source Mentor Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                  <span>1. Source Mentor (Current Mentor / Departing)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {reallocateSourceMentorId ? `${availableSourceMentees.length} total students assigned` : ''}
                  </span>
                </label>
                <select
                  value={reallocateSourceMentorId}
                  onChange={(e) => handleSourceMentorChange(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Select Source Mentor to Transfer From --</option>
                  {mentors.map((m) => {
                    const mId = m.id || m._id;
                    const count = m.activeMenteesCount || m.assignedMentees?.length || 0;
                    return (
                      <option key={mId} value={mId}>
                        {m.name} ({m.email}) • {count} active students {m.accountStatus !== 'ACTIVE' ? `[${m.accountStatus}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Step 2: Mentees Checklist Selection */}
              {reallocateSourceMentorId && (
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        2. Select Students to Transfer
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20 text-[10px]">
                        {selectedMenteeIds.length} of {availableSourceMentees.length} selected
                      </span>
                    </div>
                    {availableSourceMentees.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllMentees}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] transition self-start sm:self-auto"
                      >
                        {selectedMenteeIds.length === availableSourceMentees.length ? 'Deselect All' : 'Select All Students'}
                      </button>
                    )}
                  </div>

                  {/* Filter search if many students */}
                  {availableSourceMentees.length > 5 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student by name, roll number, or email..."
                        value={reallocateSearchQuery}
                        onChange={(e) => setReallocateSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {availableSourceMentees.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
                      This mentor currently has 0 active mentees assigned.
                    </div>
                  ) : filteredSourceMentees.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-xs">
                      No students match "{reallocateSearchQuery}".
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                      {filteredSourceMentees.map((mentee) => {
                        const mId = mentee.id || mentee._id;
                        const isChecked = selectedMenteeIds.includes(mId);
                        return (
                          <label
                            key={mId}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30'
                                : 'hover:bg-white dark:hover:bg-slate-900 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleMenteeSelection(mId)}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              />
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {mentee.name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {mentee.email}
                                </div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono font-bold text-[10px]">
                              {mentee.profile?.rollNumber || mentee.profile?.studentId || 'N/A'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Target Mentor Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  3. Target Mentor (Transfer Students To)
                </label>
                <select
                  value={reallocateTargetMentorId}
                  onChange={(e) => setReallocateTargetMentorId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Select New Target Mentor --</option>
                  {mentors
                    .filter((m) => (m.id || m._id) !== reallocateSourceMentorId)
                    .map((m) => {
                      const mId = m.id || m._id;
                      const count = m.activeMenteesCount || m.assignedMentees?.length || 0;
                      return (
                        <option key={mId} value={mId}>
                          {m.name} ({m.email}) • Currently {count} students
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Step 4: Departed Mentor Handling */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deactivateSourceMentor}
                    onChange={(e) => setDeactivateSourceMentor(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900"
                  />
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      Deactivate departing mentor account
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                      Enable this if the mentor has left the institution or accepted another offer. Their account status will be set to <span className="font-mono font-semibold">INACTIVE</span> to revoke future access.
                    </p>
                  </div>
                </label>
              </div>

              {/* Step 5: Optional Reason */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Reallocation Reason / Notes (Optional)</label>
                <input
                  type="text"
                  value={reallocateReason}
                  onChange={(e) => setReallocateReason(e.target.value)}
                  placeholder="e.g. Mentor accepted another offer / Faculty departure"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReallocateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reallocationLoading || selectedMenteeIds.length === 0 || !reallocateTargetMentorId}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <ArrowRightLeft className={`w-3.5 h-3.5 ${reallocationLoading ? 'animate-spin' : ''}`} />
                  {reallocationLoading ? 'Reallocating...' : `Transfer ${selectedMenteeIds.length} Student(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Mentee Reassign Modal */}
      {showSingleReassignModal && singleReassignMentee && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-500/30">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Reassign Mentor</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {singleReassignMentee.name} ({singleReassignMentee.profile?.rollNumber || 'Student'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSingleReassignModal(false);
                  setSingleReassignMentee(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="text-slate-500 dark:text-slate-400">Current Assigned Mentor:</div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {singleReassignMentee.mentors && singleReassignMentee.mentors.length > 0
                  ? singleReassignMentee.mentors.map((m) => m.name).join(', ')
                  : 'Unassigned'}
              </div>
            </div>

            <form onSubmit={handleSingleReassignSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Choose New Faculty Mentor
                </label>
                <select
                  value={singleTargetMentorId}
                  onChange={(e) => setSingleTargetMentorId(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="">-- Select Faculty Mentor --</option>
                  {mentors.map((m) => {
                    const mId = m.id || m._id;
                    const count = m.activeMenteesCount || m.assignedMentees?.length || 0;
                    return (
                      <option key={mId} value={mId}>
                        {m.name} ({m.email}) • {count} active students
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowSingleReassignModal(false);
                    setSingleReassignMentee(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={singleReassignLoading || !singleTargetMentorId}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                >
                  {singleReassignLoading ? 'Reassigning...' : 'Assign Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
