import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { StatusBadge } from '../../components/common/Badge';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import {
  ShieldAlert,
  ShieldCheck,
  User,
  Mail,
  Building2,
  Briefcase,
  Users,
  FolderGit2,
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  UploadCloud,
  Edit3,
  Save,
  X,
  Key,
  Activity,
  ExternalLink,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const AdminProfilePage = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showToast } = useModal();

  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/profile');
      if (res.data.success) {
        setAdminData(res.data.admin);
        setEditForm({
          name: res.data.admin.name || ''
        });
      }
    } catch (err) {
      console.error('Failed to load admin profile', err);
      showError('Error', err.response?.data?.message || 'Failed to load administrator profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/admin/profile', {
        name: editForm.name.trim()
      });
      if (res.data.success) {
        showSuccess('Profile Updated', 'Administrator profile updated successfully.');
        setIsEditing(false);
        fetchProfile();
      }
    } catch (err) {
      console.error('Failed to update admin profile', err);
      showError('Update Failed', err.response?.data?.message || 'Failed to update admin profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading administrator profile & system telemetry...</p>
      </div>
    );
  }

  const admin = adminData || user || {};
  const stats = adminData?.stats || {};
  const recentLogs = adminData?.recentAuditLogs || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Hero Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 border-2 border-violet-500/30 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-violet-600/20 shrink-0">
              {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{admin.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                  admin.email?.toLowerCase() === 'admin@sru.edu.in'
                    ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                    : 'bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  {admin.email?.toLowerCase() === 'admin@sru.edu.in' ? 'SUPER ADMINISTRATOR' : 'ADMINISTRATOR'}
                </span>
                <StatusBadge status={admin.accountStatus || 'ACTIVE'} />
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>
                  {admin.email?.toLowerCase() === 'admin@sru.edu.in'
                    ? 'Primary University Super Administrator'
                    : admin.designation || 'Platform Administrator'}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500 dark:text-slate-400">{admin.department || 'Academic Operations & Governance'}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {admin.email}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                  <Lock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                  {admin.email?.toLowerCase() === 'admin@sru.edu.in'
                    ? 'Super Administrator (Exclusive Admin Appointing & Platform Authority)'
                    : 'Administrator (Batches, Mentors, Mentees, Tasks & Reports)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-violet-600/30"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <Key className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="glass-panel p-6 rounded-3xl border border-violet-500/40 bg-violet-50/50 dark:bg-violet-500/5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Edit Admin Profile
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Administrator Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 shadow-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-500 dark:text-slate-400 font-semibold">System Email (Managed via Identity)</label>
              <input
                type="text"
                value={admin.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-violet-600/30 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Platform Telemetry Row */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" /> Platform Infrastructure & Telemetry
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Users
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{stats.totalUsers || 0}</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Mentees
            </div>
            <div className="text-xl font-black text-cyan-600 dark:text-cyan-300 font-mono">{stats.totalMentees || 0}</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Mentors
            </div>
            <div className="text-xl font-black text-violet-600 dark:text-violet-300 font-mono">{stats.totalMentors || 0}</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <FolderGit2 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Batches
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-300 font-mono">{stats.totalBatches || 0}</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Tasks
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-300 font-mono">{stats.totalTasks || 0}</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-pink-600 dark:text-pink-400" /> Mocks
            </div>
            <div className="text-xl font-black text-pink-600 dark:text-pink-300 font-mono">{stats.totalMockSections || 0}</div>
          </div>
        </div>
      </div>

      {/* Quick Access Portal Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Quick Administrative Management
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/admin/users"
            className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-violet-500/40 hover:shadow-md transition space-y-2 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition" />
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">User Directory</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage accounts, reset passwords, and edit profile details for all users.
            </p>
          </Link>

          <Link
            to="/admin/batches"
            className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-violet-500/40 hover:shadow-md transition space-y-2 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <FolderGit2 className="w-5 h-5 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition" />
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">Batch Cohorts</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Create student cohorts, assign faculty mentors, and allocate mentees.
            </p>
          </Link>

          <Link
            to="/admin/bulk-import"
            className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-violet-500/40 hover:shadow-md transition space-y-2 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <UploadCloud className="w-5 h-5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition" />
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">Bulk Data Import</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Upload CSV spreadsheets for students, mentors, and batch mappings.
            </p>
          </Link>

          <Link
            to="/admin/reports"
            className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-violet-500/40 hover:shadow-md transition space-y-2 group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition" />
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">Reports & Exports</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generate platform performance summaries and export tabular CSVs.
            </p>
          </Link>
        </div>
      </div>

      {/* Recent System Audit Logs */}
      {recentLogs.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Recent System Audit Events
          </h2>

          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/70">
            {recentLogs.map((log) => {
              const dateStr = new Date(log.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700/60">
                      {log.action}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      by <strong className="text-slate-900 dark:text-white">{log.actor?.name || 'System'}</strong> ({log.actor?.role || 'SYSTEM'})
                    </span>
                    {log.resourceType && (
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        on {log.resourceType}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{dateStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
