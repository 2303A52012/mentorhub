import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { StatusBadge } from '../../components/common/Badge';
import {
  ArrowLeft,
  ExternalLink,
  GraduationCap,
  Code2,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  UserCheck,
  FolderGit2,
  Sparkles,
  ShieldCheck,
  User,
  Link as LinkIcon,
  Key
} from 'lucide-react';
import { ResetUserPasswordModal } from '../../components/common/ResetUserPasswordModal';
import { PlatformCountersBlock } from '../../components/profile/PlatformCountersBlock';

export const MentorMenteeProfile = () => {
  const { id: paramId } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError, showToast } = useModal();
  const navigate = useNavigate();

  // If on /mentee/profile without paramId, use user._id
  const targetId = paramId || user?._id;

  const [mentee, setMentee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    rollNumber: '',
    studentId: '',
    mobile: '',
    branch: '',
    academicYear: 2027,
    section: 'A',
    skills: '',
    interests: '',
    leetcodeUrl: '',
    codeforcesUrl: '',
    codechefUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    resumeUrl: ''
  });

  const fetchMentee = async () => {
    try {
      if (!targetId) return;
      const res = await api.get(`/mentees/${targetId}`);
      if (res.data.success) {
        const m = res.data.mentee;
        setMentee(m);

        // Populate edit form
        const prof = m.profile || {};
        const cod = m.codingProfile || {};
        setEditForm({
          name: m.name || '',
          rollNumber: prof.rollNumber || '',
          studentId: prof.studentId || '',
          mobile: prof.mobile || '',
          branch: prof.branch || 'CSE',
          academicYear: prof.academicYear || 2027,
          section: prof.section || 'A',
          skills: Array.isArray(prof.skills) ? prof.skills.join(', ') : prof.skills || '',
          interests: Array.isArray(prof.interests) ? prof.interests.join(', ') : prof.interests || '',
          leetcodeUrl: cod.leetcodeUrl || '',
          codeforcesUrl: cod.codeforcesUrl || '',
          codechefUrl: cod.codechefUrl || '',
          githubUrl: cod.githubUrl || '',
          linkedinUrl: cod.linkedinUrl || '',
          resumeUrl: cod.resumeUrl || ''
        });
      }
    } catch (err) {
      console.error(err);
      showError('Fetch Error', err.response?.data?.message || 'Failed to load mentee profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentee();
  }, [targetId]);

  // Permission check: Mentee themselves, or any Mentor, or Admin
  const canEdit =
    user?.role === 'ADMIN' ||
    user?.role === 'MENTOR' ||
    (user?.role === 'MENTEE' && (user._id === targetId || user.id === targetId));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      showError('Permission Denied', 'You do not have permission to edit this profile.');
      return;
    }

    setSaving(true);
    try {
      const skillsArray = editForm.skills
        ? editForm.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const interestsArray = editForm.interests
        ? editForm.interests.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: editForm.name,
        profile: {
          rollNumber: editForm.rollNumber,
          studentId: editForm.studentId,
          mobile: editForm.mobile,
          branch: editForm.branch,
          academicYear: Number(editForm.academicYear) || 2027,
          section: editForm.section,
          skills: skillsArray,
          interests: interestsArray
        },
        codingProfile: {
          leetcodeUrl: editForm.leetcodeUrl,
          codeforcesUrl: editForm.codeforcesUrl,
          codechefUrl: editForm.codechefUrl,
          githubUrl: editForm.githubUrl,
          linkedinUrl: editForm.linkedinUrl,
          resumeUrl: editForm.resumeUrl
        }
      };

      const res = await api.patch(`/mentees/${targetId}`, payload);
      if (res.data.success) {
        showSuccess('Profile Updated', 'Mentee profile details have been saved successfully.');
        setIsEditing(false);
        fetchMentee();
      }
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading student profile data...</p>
      </div>
    );
  }

  if (!mentee) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-slate-400 text-sm">Mentee record not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-indigo-400 hover:underline"
        >
          &larr; Go Back
        </button>
      </div>
    );
  }

  const profile = mentee.profile || {};
  const coding = mentee.codingProfile || {};
  const tasks = mentee.tasks || [];
  const batches = mentee.batches || [];
  const mentors = mentee.mentors || [];
  const stats = mentee.stats || {};

  const backLink =
    user?.role === 'ADMIN'
      ? '/admin/users'
      : user?.role === 'MENTOR'
      ? '/mentor/mentees'
      : user?.role === 'TRAINER'
      ? '/trainer/students'
      : '/mentee/dashboard';

  const backLabel =
    user?.role === 'ADMIN'
      ? 'Back to User Directory'
      : user?.role === 'MENTOR'
      ? 'Back to Mentee Directory'
      : user?.role === 'TRAINER'
      ? 'Back to Batch Students'
      : 'Back to Dashboard';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to={backLink}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 border border-amber-500/30 shadow-xs"
            >
              <Key className="w-3.5 h-3.5" /> Reset Password
            </button>
          )}

          {canEdit && (
            <div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs"
                >
                  <X className="w-3.5 h-3.5" /> Cancel Editing
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================== VIEW MODE (FIRST THING USER SEES) ==================== */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Hero Profile Overview Card */}
          <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start sm:items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-black text-2xl shadow-inner shadow-indigo-500/10 flex-shrink-0">
                {mentee.name ? mentee.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {mentee.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                    Student / Mentee
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {mentee.email}
                  </span>
                  {profile.mobile && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {profile.mobile}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-indigo-600 dark:text-indigo-300">
                    {profile.rollNumber || 'No Roll No'}
                  </span>
                  {profile.studentId && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      ID: {profile.studentId}
                    </span>
                  )}
                  <span className="text-slate-400 dark:text-slate-500">•</span>
                  <span className="text-slate-700 dark:text-slate-300 font-sans">
                    {profile.branch || 'CSE'} (Class of {profile.academicYear || 2027}, Sec {profile.section || 'A'})
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800/80 relative z-10">
              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">
                  Completion Rate
                </span>
                <div className="flex items-baseline sm:justify-end gap-1.5">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {stats.completionRate ?? 0}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  {stats.approvedCount ?? 0} / {stats.totalAssigned ?? 0} tasks approved
                </span>
              </div>
            </div>
          </div>

          {/* Academic & Assignment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cohort & Mentorship Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Academic Cohort & Mentors
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Batches / Cohorts</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {batches.length > 0 ? (
                      batches.map((b) => (
                        <span
                          key={b._id || b.id}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium"
                        >
                          {b.name} (Year {b.academicYear || 2027})
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">No batch assigned</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Lead Mentor</span>
                  <div className="mt-1 space-y-1">
                    {mentors.length > 0 ? (
                      mentors.map((m) => (
                        <div key={m._id || m.id} className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                          <span className="text-slate-500 text-[11px]">({m.email})</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">No mentor assigned yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills & Interests Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Technical Skills & Domains
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Technical Skills</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                      profile.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-[11px]"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">No skills listed yet</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Areas of Interest</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Array.isArray(profile.interests) && profile.interests.length > 0 ? (
                      profile.interests.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-[11px]"
                        >
                          {it}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">No interests listed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional & Coding Platform Links Box */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Professional & Coding Platform Links
            </h2>

            <div className="flex flex-wrap gap-3 text-xs">
              {coding.leetcodeUrl && (
                <a
                  href={coding.leetcodeUrl.startsWith('http') ? coding.leetcodeUrl : `https://${coding.leetcodeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 flex items-center gap-1.5 font-medium transition"
                >
                  LeetCode ↗
                </a>
              )}
              {coding.codeforcesUrl && (
                <a
                  href={coding.codeforcesUrl.startsWith('http') ? coding.codeforcesUrl : `https://${coding.codeforcesUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/20 flex items-center gap-1.5 font-medium transition"
                >
                  Codeforces ↗
                </a>
              )}
              {coding.codechefUrl && (
                <a
                  href={coding.codechefUrl.startsWith('http') ? coding.codechefUrl : `https://${coding.codechefUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-300 hover:bg-yellow-500/20 flex items-center gap-1.5 font-medium transition"
                >
                  CodeChef ↗
                </a>
              )}
              {coding.githubUrl && (
                <a
                  href={coding.githubUrl.startsWith('http') ? coding.githubUrl : `https://${coding.githubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 flex items-center gap-1.5 font-medium transition"
                >
                  GitHub ↗
                </a>
              )}
              {coding.linkedinUrl && (
                <a
                  href={coding.linkedinUrl.startsWith('http') ? coding.linkedinUrl : `https://${coding.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 flex items-center gap-1.5 font-medium transition"
                >
                  LinkedIn ↗
                </a>
              )}
              {coding.resumeUrl && (
                <a
                  href={coding.resumeUrl.startsWith('http') ? coding.resumeUrl : `https://${coding.resumeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 flex items-center gap-1.5 font-bold shadow-xs transition"
                >
                  <FileText className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Resume / CV ↗
                </a>
              )}
              {!coding.leetcodeUrl &&
                !coding.codeforcesUrl &&
                !coding.codechefUrl &&
                !coding.githubUrl &&
                !coding.linkedinUrl &&
                !coding.resumeUrl && (
                  <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                    No coding platform profiles or resume links have been provided yet.
                  </span>
                )}
            </div>
          </div>

          {/* Platform Solved Problem Counters Block (Live Synced with Weekly Cumulative Targets) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <PlatformCountersBlock
              codingProfile={coding}
              studentId={targetId}
              canEdit={canEdit}
              onUpdate={(updatedCoding) => {
                setMentee((prev) => (prev ? { ...prev, codingProfile: { ...prev.codingProfile, ...updatedCoding } } : prev));
              }}
            />
          </div>

          {/* Assigned Tasks History */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Assigned Tasks History
            </h2>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500">No tasks assigned to this student yet.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div
                    key={t._id || t.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{t.taskId?.title}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-1">
                        Week {t.taskId?.weekNo} · Due{' '}
                        {t.taskId?.lastDate
                          ? new Date(t.taskId.lastDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {user?.role === 'MENTOR' || user?.role === 'ADMIN' ? (
                        <Link
                          to={`/mentor/reviews/${t._id || t.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium border border-slate-200 dark:border-slate-700 transition inline-flex items-center gap-1 shadow-xs"
                        >
                          View Work
                        </Link>
                      ) : (
                        <Link
                          to={`/mentee/tasks/${t._id || t.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-500/30 transition inline-flex items-center gap-1 shadow-xs"
                        >
                          Open Task
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== EDIT MODE FORM ==================== */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Edit Mentee Information
              </h2>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-300 font-mono">
                Authorized Editor ({user?.role})
              </span>
            </div>

            {/* Basic & Academic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Roll Number</label>
                <input
                  type="text"
                  required
                  value={editForm.rollNumber}
                  onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                  placeholder="e.g. 2403A51402"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 font-mono shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Student ID</label>
                <input
                  type="text"
                  value={editForm.studentId}
                  onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                  placeholder="e.g. STU-2024-001"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 font-mono shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Branch / Department</label>
                <input
                  type="text"
                  value={editForm.branch}
                  onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                  placeholder="e.g. Computer Science and Engineering"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Academic Year & Section</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={editForm.academicYear}
                    onChange={(e) =>
                      setEditForm({ ...editForm, academicYear: e.target.value })
                    }
                    placeholder="2027"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                  <input
                    type="text"
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    placeholder="Section (e.g. A)"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                  placeholder="Java, Python, Data Structures, React, Node.js"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Areas of Interest (comma separated)
                </label>
                <input
                  type="text"
                  value={editForm.interests}
                  onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                  placeholder="Competitive Programming, Machine Learning, Web Development"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Coding & Professional Links Card */}
          <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Platform & Professional Links
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> LeetCode Profile URL
                </label>
                <input
                  type="url"
                  value={editForm.leetcodeUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, leetcodeUrl: e.target.value })
                  }
                  placeholder="https://leetcode.com/u/your_handle/"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Codeforces Profile URL
                </label>
                <input
                  type="url"
                  value={editForm.codeforcesUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, codeforcesUrl: e.target.value })
                  }
                  placeholder="https://codeforces.com/profile/your_handle"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" /> CodeChef Profile URL
                </label>
                <input
                  type="url"
                  value={editForm.codechefUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, codechefUrl: e.target.value })
                  }
                  placeholder="https://www.codechef.com/users/your_handle"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> GitHub Profile URL
                </label>
                <input
                  type="url"
                  value={editForm.githubUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, githubUrl: e.target.value })
                  }
                  placeholder="https://github.com/your_handle"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={editForm.linkedinUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, linkedinUrl: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/your_profile"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> Resume / CV Link (Google Drive / Cloud Link)
                  </label>
                  {editForm.resumeUrl && (
                    <a
                      href={
                        editForm.resumeUrl.startsWith('http')
                          ? editForm.resumeUrl
                          : `https://${editForm.resumeUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1"
                    >
                      Preview Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  value={editForm.resumeUrl}
                  onChange={(e) =>
                    setEditForm({ ...editForm, resumeUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/file/d/.../view or https://myresume.pdf"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition border border-slate-200 dark:border-slate-700 shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Reset User Password Modal */}
      <ResetUserPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        targetUser={mentee ? { ...mentee, isMentorActor: user?.role === 'MENTOR' } : null}
        onSuccess={fetchMentee}
      />
    </div>
  );
};

