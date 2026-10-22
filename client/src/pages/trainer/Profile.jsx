import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { StatusBadge } from '../../components/common/Badge';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Users,
  FolderGit2,
  Calendar,
  CheckSquare,
  Award,
  Edit3,
  Save,
  X,
  Key,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Zap,
  BookOpen,
  Megaphone
} from 'lucide-react';

export const TrainerProfilePage = () => {
  const { id: paramId } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError, showToast } = useModal();
  const navigate = useNavigate();

  const trainerId = paramId || user?._id || user?.id;
  const isSelf = (!paramId || paramId === (user?._id || user?.id));
  const canEdit = isSelf || user?.role === 'ADMIN';

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'overview' | 'security'

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    designation: '',
    bio: ''
  });

  const fetchTrainer = async () => {
    try {
      if (!trainerId) return;
      setLoading(true);
      const url = paramId ? `/trainer/profile/${paramId}` : '/trainer/profile';
      const res = await api.get(url);
      if (res.data.success) {
        const t = res.data.trainer;
        setTrainer(t);
        const prof = t.trainerProfile || {};
        setEditForm({
          name: t.name || '',
          designation: prof.designation || 'Corporate Trainer',
          bio: prof.bio || ''
        });
      }
    } catch (err) {
      console.error('Failed to load trainer profile', err);
      showError('Error', err.response?.data?.message || 'Failed to load trainer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainer();
  }, [trainerId, paramId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        designation: editForm.designation.trim(),
        bio: editForm.bio.trim()
      };

      const res = await api.patch('/trainer/profile', payload);
      if (res.data.success) {
        showSuccess('Profile Updated', 'Trainer profile details have been saved successfully.');
        setIsEditing(false);
        fetchTrainer();
      }
    } catch (err) {
      console.error('Failed to save trainer profile', err);
      showError('Save Failed', err.response?.data?.message || 'Failed to update trainer profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading trainer profile...</p>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Trainer profile not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>
    );
  }

  const prof = trainer.trainerProfile || {};
  const trainerBatches = trainer.trainerBatches || [];
  const counts = trainer._count || {};

  // Calculate total students under trainer
  const totalStudents = trainerBatches.reduce((acc, tb) => acc + (tb.batch?._count?.mentees || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Back button if opened with param */}
      {paramId && (
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      {/* Hero Overview Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 border-2 border-indigo-500/30 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-600/20 shrink-0">
              {trainer.name ? trainer.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{trainer.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
                  TRAINER
                </span>
                <StatusBadge status={trainer.accountStatus} />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{prof.designation || 'Corporate Trainer'}</span>
                <span>&bull;</span>
                <span className="text-slate-500 dark:text-slate-400">SR University Technical Training Cell</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {trainer.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Class of 2027
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            {isSelf && (
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <Key className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Change Password</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {prof.bio && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl whitespace-pre-line">
              {prof.bio}
            </p>
          </div>
        )}
      </div>

      {/* Editing Form Panel */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="glass-panel p-6 rounded-3xl border border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-500/5 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Edit Trainer Details
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Full Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Designation / Role Title</label>
              <input
                type="text"
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-xs"
                placeholder="e.g. Lead DSA & System Design Trainer"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Professional Bio & Specialties</label>
              <textarea
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-xs"
                placeholder="Brief summary of industry background, specialties, and training goals..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {trainerBatches.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assigned Batches</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStudents}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enrolled Students</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {counts.trainingSessionsCreated ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Calendar Sessions</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {counts.dailyProblemsCreated ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Problems (POTD)</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'batches'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Assigned Batches ({trainerBatches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Quick Actions & Shortcuts</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Account & Security</span>
        </button>
      </div>

      {/* Tab 1: Assigned Batches */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Assigned Cohort Batches</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {trainerBatches.length} {trainerBatches.length === 1 ? 'Batch' : 'Batches'} Allocated
            </span>
          </div>

          {trainerBatches.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
              <FolderGit2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No Batches Assigned Yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                An administrator can assign you to cohorts from the Batches management screen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainerBatches.map((tb) => {
                const b = tb.batch || {};
                const studentCount = b._count?.mentees ?? 0;
                return (
                  <div
                    key={tb.id || b.id}
                    className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-indigo-400/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">{b.name}</h4>
                            {tb.isPrimary && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Academic Year: Class of {b.academicYear || 2027}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{studentCount} Students</span>
                        </span>
                      </div>

                      {b.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {b.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <Link
                        to={`/trainer/students?batchId=${b.id}`}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1.5 transition"
                      >
                        <Users className="w-3.5 h-3.5" /> View Students
                      </Link>
                      <Link
                        to={`/trainer/calendar?batchId=${b.id}`}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1.5 transition"
                      >
                        <Calendar className="w-3.5 h-3.5" /> View Calendar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Quick Actions & Shortcuts */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/trainer/calendar"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                Training Calendar
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Log topics covered and problems solved for official university training dates.
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 pt-2">
              Open Calendar <ExternalLink className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/trainer/students"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                Batch Students Directory
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Track enrolled students across assigned cohorts, view coding profiles, and inspect progress.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 pt-2">
              View Students <ExternalLink className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/trainer/problems"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-amber-500/40 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                Daily Problems (POTD)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Post company-tagged interview questions (Amazon, Google, Microsoft, Atlassian) to cohorts.
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 pt-2">
              Manage POTDs <ExternalLink className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/trainer/tasks"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-violet-500/40 hover:bg-violet-50/20 dark:hover:bg-violet-950/20 transition group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                Weekly Tasks
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Create structured coding problem sets with deadlines and platform verification.
              </p>
            </div>
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1 pt-2">
              Open Tasks <ExternalLink className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/trainer/reviews"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-cyan-500/40 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 transition group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                Review Submissions
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Evaluate student weekly task submissions, award scores, and provide feedback.
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 inline-flex items-center gap-1 pt-2">
              Review Now <ExternalLink className="w-3 h-3" />
            </span>
          </Link>

          <Link
            to="/announcements"
            className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-pink-500/40 hover:bg-pink-50/20 dark:hover:bg-pink-950/20 transition group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                Broadcast Announcements
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Post important updates, session timings, and placement notices to cohort students.
              </p>
            </div>
            <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 inline-flex items-center gap-1 pt-2">
              View Announcements <ExternalLink className="w-3 h-3" />
            </span>
          </Link>
        </div>
      )}

      {/* Tab 3: Security & Account Info */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Account Information
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Account Role</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{trainer.role}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <StatusBadge status={trainer.accountStatus} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">SRU Official Email</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">{trainer.email}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Designation</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">{prof.designation || 'Corporate Trainer'}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" /> Password & Credentials
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Keep your SRU MentorConnect account secure. Password should be at least 8 characters long with uppercase, lowercase, numbers, and special symbols.
            </p>
            {isSelf && (
              <div className="pt-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update Account Password</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};
