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
  IdCard,
  GraduationCap
} from 'lucide-react';

export const MentorProfilePage = () => {
  const { id: paramId } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError, showToast } = useModal();
  const navigate = useNavigate();

  // If viewed by self or by admin via param
  const mentorId = paramId || user?._id || user?.id;
  const isSelf = (!paramId || paramId === (user?._id || user?.id));
  const canEdit = isSelf || user?.role === 'ADMIN';

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState('mentees'); // 'mentees' | 'batches' | 'mocks'

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    rollNumber: '',
    department: '',
    designation: '',
    maxMentees: 50,
    bio: ''
  });

  const fetchMentor = async () => {
    try {
      if (!mentorId) return;
      setLoading(true);
      const res = await api.get(`/mentors/${mentorId}`);
      if (res.data.success) {
        const m = res.data.mentor;
        setMentor(m);
        const prof = m.profile || {};
        setEditForm({
          name: m.name || '',
          rollNumber: prof.rollNumber || '',
          department: prof.department || 'Computer Science & Engineering',
          designation: prof.designation || 'Technical Mentor & Faculty Lead',
          maxMentees: prof.maxMentees || 50,
          bio: prof.bio || ''
        });
      }
    } catch (err) {
      console.error('Failed to load mentor profile', err);
      showError('Error', err.response?.data?.message || 'Failed to load mentor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentor();
  }, [mentorId]);

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
        profile: {
          rollNumber: editForm.rollNumber.trim(),
          department: editForm.department.trim(),
          designation: editForm.designation.trim(),
          maxMentees: Number(editForm.maxMentees) || 50,
          bio: editForm.bio.trim()
        }
      };

      const res = await api.patch(`/mentors/${mentorId}`, payload);
      if (res.data.success) {
        showSuccess('Profile Updated', 'Mentor profile details have been saved successfully.');
        setIsEditing(false);
        fetchMentor();
      }
    } catch (err) {
      console.error('Failed to save profile', err);
      showError('Save Failed', err.response?.data?.message || 'Failed to update mentor profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading mentor profile...</p>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-slate-400 text-sm">Mentor profile not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>
    );
  }

  const prof = mentor.profile || {};
  const stats = mentor.stats || {};
  const batches = mentor.batches || [];
  const assignedMentees = mentor.assignedMentees || [];
  const tasksCreated = mentor.tasksCreated || [];
  const mockSections = mentor.mockSectionsCreated || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Back button if opened with param */}
      {paramId && (
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      )}

      {/* Hero Overview Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 border-2 border-indigo-500/30 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-600/20 shrink-0">
              {mentor.name ? mentor.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">{mentor.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider">
                  MENTOR
                </span>
                <StatusBadge status={mentor.accountStatus} />
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>{prof.designation || 'Technical Mentor'}</span>
                <span>&bull;</span>
                <span className="text-slate-400">{prof.department || 'Computer Science & Engineering'}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {mentor.email}
                </span>
                {prof.rollNumber && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <IdCard className="w-3.5 h-3.5 text-slate-500" /> ID: {prof.rollNumber}
                  </span>
                )}
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Password</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {prof.bio && (
          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl whitespace-pre-line">
              {prof.bio}
            </p>
          </div>
        )}
      </div>

      {/* Editing Form Panel */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="glass-panel p-6 rounded-3xl border border-indigo-500/40 bg-indigo-500/5 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Mentor Details
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Full Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Faculty / Employee ID</label>
              <input
                type="text"
                value={editForm.rollNumber}
                onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. FAC-2024-01"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Department</label>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Designation / Role Title</label>
              <input
                type="text"
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Max Mentees Capacity</label>
              <input
                type="number"
                min="1"
                max="200"
                value={editForm.maxMentees}
                onChange={(e) => setEditForm({ ...editForm, maxMentees: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-semibold">Professional Bio & Specializations</label>
            <textarea
              rows={3}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
              placeholder="Describe your technical domains, guidance focus, mentoring philosophy..."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" /> Active Mentees
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats.activeMenteesCount || assignedMentees.length}
            <span className="text-xs text-slate-500 font-normal ml-1">/ {prof.maxMentees || 50}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-violet-400" /> Cohort Batches
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats.batchesCount || batches.length}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Mock Sections
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats.mockSectionsCount || mockSections.length}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" /> Evaluations Conducted
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats.evaluationsConducted || 0}
            {stats.avgEvaluationScore && (
              <span className="text-xs text-emerald-400 font-normal ml-2">
                (Avg: {stats.avgEvaluationScore}/10)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('mentees')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'mentees'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Assigned Mentees ({assignedMentees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Assigned Batches ({batches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mocks')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'mocks'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Mock Sections ({mockSections.length})</span>
        </button>
      </div>

      {/* Tab 1: Assigned Mentees */}
      {activeTab === 'mentees' && (
        <div className="space-y-3">
          {assignedMentees.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No active mentees assigned to this mentor yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedMentees.map((m) => (
                <div
                  key={m.id || m._id}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs group-hover:text-indigo-400 transition">
                        {m.name}
                      </span>
                      <StatusBadge status={m.accountStatus} />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {m.rollNumber || m.studentId || 'No Roll #'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {m.branch || 'CSE'} - Section {m.section || 'A'}
                    </div>
                  </div>

                  <Link
                    to={user?.role === 'ADMIN' ? `/admin/mentees/${m.id || m._id}` : `/mentor/mentees/${m.id || m._id}`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition"
                    title="View Mentee Profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Assigned Batches */}
      {activeTab === 'batches' && (
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-2">
              <FolderGit2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No batches linked yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {batches.map((b) => (
                <div
                  key={b.id || b._id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-sm">{b.name}</h3>
                      <div className="text-xs text-slate-400">Academic Year: {b.academicYear}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold">
                      {b.menteeCount || 0} students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Mock Sections */}
      {activeTab === 'mocks' && (
        <div className="space-y-3">
          {mockSections.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No mock interview sections created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockSections.map((sec) => (
                <Link
                  key={sec.id}
                  to={`/mentor/mocks/${sec.id}`}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold">
                        WEEK {sec.weekNumber}
                      </span>
                      <span className="font-bold text-white text-xs group-hover:text-indigo-400 transition">
                        {sec.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Type: {sec.mockType} &bull; Status: {sec.status}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                </Link>
              ))}
            </div>
          )}
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
