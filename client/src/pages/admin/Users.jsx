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
  Square,
  Briefcase,
  Edit2,
  MoreVertical
} from 'lucide-react';

import { useModal } from '../../context/ModalContext';
import { ResetUserPasswordModal } from '../../components/common/ResetUserPasswordModal';

export const AdminUsers = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin || user?.email?.toLowerCase() === 'admin@sru.edu.in';
  const { showSuccess, showError, showConfirm, showToast } = useModal();

  // Secure temporary password generator (avoids static/forbidden defaults like Password@123)
  const generateSecureTempPassword = (prefix = 'Temp') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}@${rand}`;
  };

  const [activeTab, setActiveTab] = useState('MENTEES'); // 'MENTEES' | 'MENTORS' | 'TRAINERS' | 'ADMINS'
  const [mentees, setMentees] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedMentor, setSelectedMentor] = useState('ALL');

  // Pagination & Action Menu State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals state
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showMenteeModal, setShowMenteeModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showEditTrainerModal, setShowEditTrainerModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetRequests, setResetRequests] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // New Trainer Form State
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    email: '',
    designation: 'Corporate Trainer',
    bio: '',
    password: generateSecureTempPassword('Trainer'),
    batchIds: []
  });

  // Edit Trainer Form State
  const [editTrainerForm, setEditTrainerForm] = useState({
    name: '',
    email: '',
    designation: 'Corporate Trainer',
    bio: '',
    batchIds: []
  });

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
    password: generateSecureTempPassword('Admin')
  });

  // New Mentor Form State
  const [mentorForm, setMentorForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: 'Computer Science & Engineering',
    designation: 'Technical Mentor',
    password: generateSecureTempPassword('Mentor')
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
    password: generateSecureTempPassword('Student')
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [
        api.get('/mentees'),
        api.get('/mentors'),
        api.get('/trainers').catch(() => ({ data: { trainers: [] } })),
        api.get('/batches'),
        api.get('/auth/reset-requests').catch(() => ({ data: { requests: [] } }))
      ];

      if (isSuperAdmin) {
        promises.push(api.get('/users/admins').catch(() => ({ data: { admins: [] } })));
      }

      const [mRes, menRes, tRes, bRes, rRes, aRes] = await Promise.all(promises);
      if (mRes.data.success) setMentees(mRes.data.mentees || []);
      if (menRes.data.success) setMentors(menRes.data.mentors || []);
      if (tRes?.data?.success) setTrainers(tRes.data.trainers || []);
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

  // Close action menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.user-action-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Reset pagination & close menu on tab or filter change
  useEffect(() => {
    setCurrentPage(1);
    setActiveMenuId(null);
  }, [activeTab, searchQuery, selectedBatch, selectedMentor, pageSize]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    try {
      const res = await api.post('/users/admins', adminForm);
      if (res.data.success) {
        showSuccess('Administrator Created', res.data.message || 'Administrator account created successfully!');
        setShowAdminModal(false);
        setAdminForm({ name: '', email: '', password: generateSecureTempPassword('Admin') });
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
    const targetId = admin.id || admin._id;
    const newStatus = admin.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch(`/users/admins/${targetId}`, { accountStatus: newStatus });
      if (res.data.success) {
        showSuccess('Status Updated', `Administrator '${admin.name}' is now ${newStatus.toLowerCase()}.`);
        setAdmins((prev) =>
          prev.map((a) => ((a.id || a._id) === targetId ? { ...a, accountStatus: newStatus } : a))
        );
      }
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Failed to update administrator status.');
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.email?.toLowerCase() === 'admin@sru.edu.in') {
      showError('Action Prohibited', 'The primary Super Administrator account cannot be deleted.');
      return;
    }
    const targetId = admin.id || admin._id;
    const confirmed = await showConfirm({
      title: 'Delete Administrator',
      message: `Are you sure you want to permanently delete administrator '${admin.name}' (${admin.email})? They will lose all administrative privileges immediately.`,
      confirmText: 'Delete Administrator',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/users/admins/${targetId}`);
      if (res.data?.success) {
        showSuccess('Administrator Deleted', res.data.message || 'Administrator deleted successfully.');
        setAdmins((prev) => prev.filter((a) => (a.id || a._id) !== targetId));
      }
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Failed to delete administrator account.');
    }
  };

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    setTrainerLoading(true);
    try {
      const res = await api.post('/trainers', trainerForm);
      if (res.data.success) {
        showSuccess('Trainer Created', res.data.message || 'Trainer account has been created successfully!');
        setShowTrainerModal(false);
        setTrainerForm({
          name: '',
          email: '',
          designation: 'Corporate Trainer',
          bio: '',
          password: generateSecureTempPassword('Trainer'),
          batchIds: []
        });
        fetchData();
        setActiveTab('TRAINERS');
      }
    } catch (err) {
      showError('Failed to Create Trainer', err.response?.data?.message || 'Could not create trainer account.');
    } finally {
      setTrainerLoading(false);
    }
  };

  const handleToggleTrainerStatus = async (trainer) => {
    const newStatus = trainer.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch(`/trainers/${trainer.id || trainer._id}`, { accountStatus: newStatus });
      if (res.data.success) {
        showSuccess('Status Updated', `Trainer '${trainer.name}' is now ${newStatus.toLowerCase()}.`);
        setTrainers((prev) =>
          prev.map((t) => (t.id === trainer.id || t._id === trainer._id ? { ...t, accountStatus: newStatus } : t))
        );
      }
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Failed to update trainer status.');
    }
  };

  const handleOpenEditTrainer = (trainer) => {
    setEditingTrainer(trainer);
    setEditTrainerForm({
      name: trainer.name || '',
      email: trainer.email || '',
      designation: trainer.profile?.designation || 'Corporate Trainer',
      bio: trainer.profile?.bio || '',
      batchIds: (trainer.batches || []).map((b) => b._id || b.id)
    });
    setShowEditTrainerModal(true);
  };

  const handleUpdateTrainer = async (e) => {
    e.preventDefault();
    if (!editingTrainer) return;
    setTrainerLoading(true);
    try {
      const res = await api.patch(`/trainers/${editingTrainer.id || editingTrainer._id}`, editTrainerForm);
      if (res.data.success) {
        showSuccess('Trainer Updated', res.data.message || 'Trainer details updated successfully.');
        setShowEditTrainerModal(false);
        setEditingTrainer(null);
        fetchData();
      }
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Failed to update trainer.');
    } finally {
      setTrainerLoading(false);
    }
  };

  const handleDeleteTrainer = async (trainer) => {
    const targetId = trainer.id || trainer._id;
    const confirmed = await showConfirm({
      title: 'Delete Trainer',
      message: `Are you sure you want to permanently delete trainer '${trainer.name}' (${trainer.email})? They will lose access to all assigned batches and training sessions immediately.`,
      confirmText: 'Delete Trainer',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/trainers/${targetId}`);
      if (res.data?.success) {
        showSuccess('Trainer Deleted', res.data.message || 'Trainer account deleted successfully.');
        setTrainers((prev) => prev.filter((t) => (t.id || t._id) !== targetId));
      }
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Failed to delete trainer.');
    }
  };

  const handleCreateMentor = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/mentors', mentorForm);
      if (res.data.success) {
        showSuccess('Mentor Created', 'Mentor account has been created successfully!');
        setShowMentorModal(false);
        setMentorForm({
          name: '',
          email: '',
          rollNumber: '',
          department: 'Computer Science & Engineering',
          designation: 'Technical Mentor',
          password: generateSecureTempPassword('Mentor')
        });
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
        setMenteeForm({
          name: '',
          email: '',
          studentId: '',
          rollNumber: '',
          branch: 'Computer Science & Engineering',
          batchId: '',
          mentorId: '',
          resumeUrl: '',
          password: generateSecureTempPassword('Student')
        });
        fetchData();
      }
    } catch (err) {
      showError('Creation Failed', err.response?.data?.message || 'Failed to create mentee account.');
    }
  };

  const handleToggleMenteeStatus = async (mentee) => {
    const targetId = mentee.id || mentee._id;
    const newStatus = mentee.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch(`/mentees/${targetId}`, { accountStatus: newStatus });
      if (res.data.success) {
        showSuccess('Status Updated', `Student '${mentee.name}' is now ${newStatus.toLowerCase()}.`);
        setMentees((prev) =>
          prev.map((m) => ((m.id || m._id) === targetId ? { ...m, accountStatus: newStatus } : m))
        );
      }
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Failed to update student status.');
    }
  };

  const handleDeleteMentee = async (mentee) => {
    const targetId = mentee.id || mentee._id;
    const confirmed = await showConfirm({
      title: 'Delete Student',
      message: `Are you sure you want to permanently delete student '${mentee.name}' (${mentee.email})? All associated tasks, submissions, and mentor assignments will be removed.`,
      confirmText: 'Delete Student',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/mentees/${targetId}`);
      if (res.data?.success) {
        showSuccess('Student Deleted', res.data.message || 'Student removed successfully.');
        setMentees((prev) => prev.filter((m) => (m.id || m._id) !== targetId));
      }
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Failed to delete student.');
    }
  };

  const handleToggleMentorStatus = async (mentor) => {
    const targetId = mentor.id || mentor._id;
    const newStatus = mentor.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch(`/mentors/${targetId}`, { accountStatus: newStatus });
      if (res.data.success) {
        showSuccess('Status Updated', `Faculty mentor '${mentor.name}' is now ${newStatus.toLowerCase()}.`);
        setMentors((prev) =>
          prev.map((m) => ((m.id || m._id) === targetId ? { ...m, accountStatus: newStatus } : m))
        );
      }
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Failed to update mentor status.');
    }
  };

  const handleDeleteMentor = async (mentor) => {
    const targetId = mentor.id || mentor._id;
    const confirmed = await showConfirm({
      title: 'Delete Faculty Mentor',
      message: `Are you sure you want to permanently delete mentor '${mentor.name}' (${mentor.email})? If they have active assigned mentees, please reallocate them first.`,
      confirmText: 'Delete Mentor',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/mentors/${targetId}`);
      if (res.data?.success) {
        showSuccess('Mentor Deleted', res.data.message || 'Faculty mentor removed successfully.');
        setMentors((prev) => prev.filter((m) => (m.id || m._id) !== targetId));
      }
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Failed to delete mentor.');
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

  // Filter Trainers
  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      const query = searchQuery.toLowerCase().trim();
      const name = (t.name || '').toLowerCase();
      const email = (t.email || '').toLowerCase();
      const designation = (t.profile?.designation || '').toLowerCase();
      const bio = (t.profile?.bio || '').toLowerCase();
      const status = (t.accountStatus || '').toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        designation.includes(query) ||
        bio.includes(query) ||
        status.includes(query);

      const matchesBatch =
        selectedBatch === 'ALL' ||
        (t.batches && t.batches.some((b) => b._id === selectedBatch || b.id === selectedBatch || b.name === selectedBatch));

      return matchesSearch && matchesBatch;
    });
  }, [trainers, searchQuery, selectedBatch]);

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
      : activeTab === 'TRAINERS'
      ? filteredTrainers
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
              onClick={() => {
                setAdminForm((prev) => ({ ...prev, password: generateSecureTempPassword('Admin') }));
                setShowAdminModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Add Admin
            </button>
          )}
          <button
            onClick={() => {
              setTrainerForm((prev) => ({ ...prev, password: generateSecureTempPassword('Trainer') }));
              setShowTrainerModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add Trainer
          </button>
          <button
            onClick={() => {
              setMentorForm((prev) => ({ ...prev, password: generateSecureTempPassword('Mentor') }));
              setShowMentorModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-semibold transition border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Add Mentor
          </button>
          <button
            onClick={() => {
              setMenteeForm((prev) => ({ ...prev, password: generateSecureTempPassword('Student') }));
              setShowMenteeModal(true);
            }}
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
        <div className="flex items-center gap-2 text-xs flex-wrap">
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
          <button
            onClick={() => {
              setActiveTab('TRAINERS');
              resetFilters();
            }}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'TRAINERS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Trainers ({trainers.length})
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
              : activeTab === 'TRAINERS'
              ? `${trainers.length} trainers`
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
                : activeTab === 'TRAINERS'
                ? 'Search trainer by Name, Email, Designation, Bio, Status...'
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
          <div className="overflow-x-auto min-h-[300px]">
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
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            m.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {m.accountStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right relative user-action-menu">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const id = m._id || m.id;
                              setActiveMenuId(activeMenuId === `mentee-${id}` ? null : `mentee-${id}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === `mentee-${m._id || m.id}` && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                            >
                              <Link
                                to={`/admin/mentees/${m._id || m.id}`}
                                onClick={() => setActiveMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" /> View Profile
                              </Link>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenSingleReassignModal(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" /> Reassign Mentor
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setResetTargetUser(m);
                                  setShowResetModal(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-500" /> Reset Password
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleToggleMenteeStatus(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                {m.accountStatus === 'ACTIVE' ? (
                                  <>
                                    <UserMinus className="w-3.5 h-3.5 text-amber-500" /> Deactivate Student
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Activate Student
                                  </>
                                )}
                              </button>
                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDeleteMentee(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium transition"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Student
                              </button>
                            </div>
                          )}
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
          <div className="overflow-x-auto min-h-[300px]">
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
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            m.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {m.accountStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right relative user-action-menu">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const id = m._id || m.id;
                              setActiveMenuId(activeMenuId === `mentor-${id}` ? null : `mentor-${id}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === `mentor-${m._id || m.id}` && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                            >
                              <Link
                                to={`/admin/mentors/${m._id || m.id}`}
                                onClick={() => setActiveMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" /> View Profile
                              </Link>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenReallocateModal(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" /> Reallocate Mentees
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setResetTargetUser(m);
                                  setShowResetModal(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <Key className="w-3.5 h-3.5 text-indigo-500" /> Reset Password
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleToggleMentorStatus(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                {m.accountStatus === 'ACTIVE' ? (
                                  <>
                                    <UserMinus className="w-3.5 h-3.5 text-amber-500" /> Deactivate Mentor
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Activate Mentor
                                  </>
                                )}
                              </button>
                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDeleteMentor(m);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium transition"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Faculty Mentor
                              </button>
                            </div>
                          )}
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
      ) : activeTab === 'TRAINERS' ? (
        /* ==================== TRAINERS DIRECTORY TABLE ==================== */
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Corporate & Technical Trainers Roster
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage batch-scoped trainers, assign cohort batches, track specialization, and configure account access.
              </p>
            </div>
            <button
              onClick={() => setShowTrainerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" /> Add Trainer
            </button>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Trainer</th>
                  <th className="py-3 px-3">Designation & Specialization</th>
                  <th className="py-3 px-3">Assigned Cohort Batches</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Created At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">
                      No trainer records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((t) => (
                    <tr key={t._id || t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                            {t.name ? t.name.charAt(0).toUpperCase() : 'T'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {t.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {t.profile?.designation || 'Corporate Trainer'}
                        </div>
                        {t.profile?.bio && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate max-w-xs">
                            "{t.profile.bio}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {t.batches && t.batches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.batches.map((b) => (
                              <span
                                key={b._id || b.id}
                                className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                              >
                                <FolderGit2 className="w-2.5 h-2.5" />
                                {b.name}
                                {b.isPrimary && (
                                  <span className="text-[9px] bg-emerald-500/20 px-1 rounded text-emerald-800 dark:text-emerald-300 font-bold">
                                    Primary
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">No batch assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                            t.accountStatus === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                          }`}
                        >
                          {t.accountStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right relative user-action-menu">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const id = t._id || t.id;
                              setActiveMenuId(activeMenuId === `trainer-${id}` ? null : `trainer-${id}`);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === `trainer-${t._id || t.id}` && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenEditTrainer(t);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-emerald-500" /> Edit & Cohorts
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setResetTargetUser(t);
                                  setShowResetModal(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-500" /> Reset Password
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleToggleTrainerStatus(t);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                              >
                                {t.accountStatus === 'ACTIVE' ? (
                                  <>
                                    <UserMinus className="w-3.5 h-3.5 text-amber-500" /> Deactivate Trainer
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Activate Trainer
                                  </>
                                )}
                              </button>
                              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleDeleteTrainer(t);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium transition"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Trainer
                              </button>
                            </div>
                          )}
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

          <div className="overflow-x-auto min-h-[300px]">
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
                        <td className="py-3 px-3 text-right relative user-action-menu">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const id = a._id || a.id;
                                setActiveMenuId(activeMenuId === `admin-${id}` ? null : `admin-${id}`);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === `admin-${a._id || a.id}` && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setResetTargetUser(a);
                                    setShowResetModal(true);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                                >
                                  <Key className="w-3.5 h-3.5 text-amber-500" /> Reset Password
                                </button>
                                {!isSuper && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleToggleAdminStatus(a);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition"
                                    >
                                      {a.accountStatus === 'ACTIVE' ? (
                                        <>
                                          <UserMinus className="w-3.5 h-3.5 text-amber-500" /> Deactivate Admin
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Activate Admin
                                        </>
                                      )}
                                    </button>
                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleDeleteAdmin(a);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Administrator
                                    </button>
                                  </>
                                )}
                              </div>
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

      {/* Trainer Creation Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Trainer Account</h3>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Corporate & Technical Faculty</p>
                </div>
              </div>
              <button
                onClick={() => setShowTrainerModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrainer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Trainer Full Name *</label>
                <input
                  type="text"
                  required
                  value={trainerForm.name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Email Address *</label>
                <input
                  type="email"
                  required
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  placeholder="trainer@sru.edu.in"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Designation / Role</label>
                <input
                  type="text"
                  value={trainerForm.designation}
                  onChange={(e) => setTrainerForm({ ...trainerForm, designation: e.target.value })}
                  placeholder="e.g. Corporate Trainer, Lead DSA Instructor"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Bio / Specialization</label>
                <textarea
                  rows={2}
                  value={trainerForm.bio}
                  onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
                  placeholder="e.g. Competitive Programming, Dynamic Programming, System Design..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-medium">Initial Password</label>
                  <button
                    type="button"
                    onClick={() => setTrainerForm((prev) => ({ ...prev, password: generateSecureTempPassword('Trainer') }))}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                  placeholder="e.g. Trainer@k9#d2"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">User will be prompted to change password upon initial login.</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between">
                  <span>Assign Cohort Batches</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {trainerForm.batchIds.length} batch(es) selected
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {batches.map((b) => {
                    const bId = b._id || b.id;
                    const isSelected = trainerForm.batchIds.includes(bId);
                    return (
                      <button
                        type="button"
                        key={bId}
                        onClick={() => {
                          setTrainerForm((prev) => ({
                            ...prev,
                            batchIds: isSelected
                              ? prev.batchIds.filter((id) => id !== bId)
                              : [...prev.batchIds, bId]
                          }));
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition border flex items-center gap-1.5 truncate ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <FolderGit2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTrainerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trainerLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {trainerLoading ? 'Creating...' : 'Create Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trainer Edit Modal */}
      {showEditTrainerModal && editingTrainer && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Trainer Profile</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{editingTrainer.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditTrainerModal(false);
                  setEditingTrainer(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTrainer} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Trainer Name *</label>
                <input
                  type="text"
                  required
                  value={editTrainerForm.name}
                  onChange={(e) => setEditTrainerForm({ ...editTrainerForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  value={editTrainerForm.email}
                  onChange={(e) => setEditTrainerForm({ ...editTrainerForm, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Designation</label>
                <input
                  type="text"
                  value={editTrainerForm.designation}
                  onChange={(e) => setEditTrainerForm({ ...editTrainerForm, designation: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium">Bio / Specialization</label>
                <textarea
                  rows={2}
                  value={editTrainerForm.bio}
                  onChange={(e) => setEditTrainerForm({ ...editTrainerForm, bio: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between">
                  <span>Assigned Cohort Batches</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {editTrainerForm.batchIds.length} batch(es) selected
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {batches.map((b) => {
                    const bId = b._id || b.id;
                    const isSelected = editTrainerForm.batchIds.includes(bId);
                    return (
                      <button
                        type="button"
                        key={bId}
                        onClick={() => {
                          setEditTrainerForm((prev) => ({
                            ...prev,
                            batchIds: isSelected
                              ? prev.batchIds.filter((id) => id !== bId)
                              : [...prev.batchIds, bId]
                          }));
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition border flex items-center gap-1.5 truncate ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <FolderGit2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTrainerModal(false);
                    setEditingTrainer(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={trainerLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {trainerLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-medium">Initial Temporary Password</label>
                  <button
                    type="button"
                    onClick={() => setMentorForm((prev) => ({ ...prev, password: generateSecureTempPassword('Mentor') }))}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={mentorForm.password}
                  onChange={(e) => setMentorForm({ ...mentorForm, password: e.target.value })}
                  placeholder="e.g. Mentor@a1#x9"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-medium">Initial Temporary Password</label>
                  <button
                    type="button"
                    onClick={() => setMenteeForm((prev) => ({ ...prev, password: generateSecureTempPassword('Student') }))}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={menteeForm.password}
                  onChange={(e) => setMenteeForm({ ...menteeForm, password: e.target.value })}
                  placeholder="e.g. Student@k4#m2"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-medium">Initial Temporary Password</label>
                  <button
                    type="button"
                    onClick={() => setAdminForm((prev) => ({ ...prev, password: generateSecureTempPassword('Admin') }))}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="e.g. Admin@x7!m9"
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
