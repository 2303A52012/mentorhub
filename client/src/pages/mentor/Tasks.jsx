import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import {
  PlusCircle,
  CheckSquare,
  Clock,
  Users,
  ArrowRight,
  Edit,
  Trash2,
  X,
  Plus,
  Calendar,
  Save,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ListPlus
} from 'lucide-react';

export const MentorTasks = () => {
  const { user } = useAuth();
  const { showConfirm, showSuccess, showError, showWarning, showToast } = useModal();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    weekNo: 1,
    assignmentDate: '',
    lastDate: '',
    instructions: '',
    problems: []
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Extend Deadline Modal State
  const [extendingTask, setExtendingTask] = useState(null);
  const [extendDate, setExtendDate] = useState('');
  const [savingExtend, setSavingExtend] = useState(false);
  const [extendError, setExtendError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditError('');
    setEditForm({
      title: task.title || '',
      weekNo: task.weekNo || 1,
      assignmentDate: task.assignmentDate
        ? new Date(task.assignmentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      lastDate: task.lastDate
        ? new Date(task.lastDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      instructions: task.instructions || '',
      problems: (task.problems || []).map((p) => ({
        name: p.name || '',
        problemUrl: p.problemUrl || '',
        platform: p.platform || 'LEETCODE'
      }))
    });
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditError('');
  };

  const handleAddProblem = () => {
    setEditForm((prev) => ({
      ...prev,
      problems: [
        ...prev.problems,
        { name: '', problemUrl: '', platform: 'LEETCODE' }
      ]
    }));
  };

  const handleRemoveProblem = (index) => {
    if (editForm.problems.length <= 1) {
      showWarning(
        'Minimum Problem Requirement',
        'A weekly task must contain at least one coding problem question.'
      );
      return;
    }
    setEditForm((prev) => ({
      ...prev,
      problems: prev.problems.filter((_, i) => i !== index)
    }));
  };

  const handleProblemChange = (index, field, value) => {
    setEditForm((prev) => {
      const updated = [...prev.problems];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, problems: updated };
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editForm.title.trim()) {
      setEditError('Task title is required.');
      return;
    }

    if (new Date(editForm.lastDate) <= new Date(editForm.assignmentDate)) {
      setEditError('Deadline (end date) cannot precede or equal the start date.');
      return;
    }

    for (let i = 0; i < editForm.problems.length; i++) {
      const p = editForm.problems[i];
      if (!p.name.trim() || !p.problemUrl.trim()) {
        setEditError(`Problem #${i + 1} requires both a name and a valid URL.`);
        return;
      }
    }

    try {
      setSavingEdit(true);
      const res = await api.patch(`/tasks/${editingTask._id || editingTask.id}`, {
        title: editForm.title.trim(),
        weekNo: Number(editForm.weekNo),
        assignmentDate: new Date(editForm.assignmentDate),
        lastDate: new Date(editForm.lastDate),
        instructions: editForm.instructions,
        problems: editForm.problems
      });

      if (res.data.success) {
        closeEditModal();
        showSuccess(
          'Task Updated Successfully',
          `"${editForm.title}" has been updated and problem progress is synchronized.`
        );
        fetchTasks();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update task.';
      setEditError(errorMsg);
      showError('Update Failed', errorMsg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTask = async (task) => {
    const confirmed = await showConfirm({
      title: `Delete Task: ${task.title}?`,
      message: `Are you sure you want to delete Week ${task.weekNo}: "${task.title}"?\n\nThis will permanently remove the assignment, all student solution notes, and associated review submissions.`,
      confirmText: 'Yes, Delete Task',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      setDeletingId(task._id || task.id);
      const res = await api.delete(`/tasks/${task._id || task.id}`);
      if (res.data.success) {
        setTasks((prev) => prev.filter((t) => (t._id || t.id) !== (task._id || task.id)));
        showSuccess(
          'Task Deleted',
          `Task "${task.title}" (Week ${task.weekNo}) has been deleted.`
        );
      }
    } catch (err) {
      showError(
        'Delete Failed',
        err.response?.data?.message || 'Failed to delete task. Please check server logs.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const isSelfCreator = (task) => {
    if (!user) return false;
    const currentId = user._id || user.id;
    return (
      task.createdById === currentId ||
      task.createdBy?._id === currentId ||
      task.createdBy?.id === currentId
    );
  };

  const canManage = (task) => {
    if (!user) return false;
    return (
      user.role === 'ADMIN' ||
      user.role === 'MENTOR' ||
      user.role === 'TRAINER' ||
      isSelfCreator(task)
    );
  };

  const isPastDue = (lastDate) => {
    if (!lastDate) return false;
    const d = new Date(lastDate);
    if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
      d.setUTCHours(23, 59, 59, 999);
    }
    return new Date() > d;
  };

  const openExtendModal = (task) => {
    setExtendingTask(task);
    setExtendError('');
    let base = task.lastDate ? new Date(task.lastDate) : new Date();
    if (base.getTime() < Date.now()) {
      base = new Date();
    }
    const nextDate = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
    setExtendDate(nextDate.toISOString().split('T')[0]);
  };

  const closeExtendModal = () => {
    setExtendingTask(null);
    setExtendError('');
    setExtendDate('');
  };

  const handleSaveExtend = async (e) => {
    e.preventDefault();
    if (!extendDate) {
      setExtendError('Please select a new deadline date.');
      return;
    }
    const newEnd = new Date(extendDate);
    const start = new Date(extendingTask.assignmentDate);
    if (newEnd <= start) {
      setExtendError('New deadline cannot precede or equal the task assignment date.');
      return;
    }

    try {
      setSavingExtend(true);
      setExtendError('');
      const res = await api.patch(`/tasks/${extendingTask._id || extendingTask.id}/extend-deadline`, {
        lastDate: extendDate
      });

      if (res.data.success) {
        closeExtendModal();
        showSuccess(
          'Deadline Extended',
          `Deadline for "${extendingTask.title}" extended to ${new Date(extendDate).toLocaleDateString()}. Overdue tasks have been reopened for students!`
        );
        fetchTasks();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to extend task deadline.';
      setExtendError(errorMsg);
      showError('Extension Failed', errorMsg);
    } finally {
      setSavingExtend(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-500 dark:text-indigo-400" /> Weekly Tasks Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse, edit, or delete published assignments, problem compositions, and cohort progress metrics.
          </p>
        </div>

        <Link
          to={
            user?.role === 'ADMIN'
              ? '/admin/tasks/create'
              : user?.role === 'TRAINER'
              ? '/trainer/tasks/create'
              : '/mentor/tasks/create'
          }
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <PlusCircle className="w-4 h-4" /> Create Weekly Task
        </Link>
      </div>

      {/* Task List Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm space-y-2 shadow-sm">
          <CheckSquare className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-slate-900 dark:text-white font-semibold">No tasks published yet.</p>
          <p className="text-xs">Click "Create Weekly Task" above to publish your first assignment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const stats = task.stats || {};
            const isSelf = isSelfCreator(task);
            const canEdit = canManage(task);
            const isDeleting = deletingId === (task._id || task.id);

            return (
              <div
                key={task._id || task.id}
                className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Top Meta & Action Icons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Week {task.weekNo}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {task.problems?.length || 0} Problems
                      </span>
                      {isPastDue(task.lastDate) ? (
                        <span className="text-[10px] bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                          Due Date Expired · Closed
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                          Active Submissions
                        </span>
                      )}
                      {isSelf ? (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                          Created by You
                        </span>
                      ) : task.createdBy?.name ? (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                          Created by {task.createdBy.name}
                          {task.createdBy.role && ` (${task.createdBy.role === 'MENTOR' ? 'Mentor' : task.createdBy.role === 'ADMIN' ? 'Admin' : task.createdBy.role})`}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                          Created by Admin
                        </span>
                      )}
                    </div>

                    {/* Creator / Admin Edit & Delete Action Buttons */}
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openExtendModal(task)}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 transition"
                          title="Extend Task Due Date"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(task)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-600/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 transition"
                          title="Edit Task (Dates, Title, Questions)"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-600/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition disabled:opacity-40"
                          title="Delete Task"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{task.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                      {task.instructions || 'Weekly coding practice set.'}
                    </p>
                  </div>

                  {/* Past Due Warning Alert */}
                  {isPastDue(task.lastDate) && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                        Deadline has ended. Students cannot submit until extended.
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => openExtendModal(task)}
                          className="font-bold underline hover:no-underline text-rose-800 dark:text-rose-200 shrink-0"
                        >
                          Extend Now
                        </button>
                      )}
                    </div>
                  )}

                  {/* Problem Snippets */}
                  {task.problems && task.problems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {task.problems.map((p, idx) => (
                        <a
                          key={p._id || idx}
                          href={p.problemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition flex items-center gap-1"
                        >
                          <span className="text-slate-400 dark:text-slate-500 font-mono">#{idx + 1}</span> {p.name}
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Timing & Target Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Start:{' '}
                      {new Date(task.assignmentDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className={`w-3.5 h-3.5 ${isPastDue(task.lastDate) ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`} /> Due:{' '}
                      <strong className={isPastDue(task.lastDate) ? 'text-rose-600 dark:text-rose-400' : ''}>
                        {new Date(task.lastDate).toLocaleDateString()}
                      </strong>
                      {isPastDue(task.lastDate) && ' (Expired)'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />{' '}
                      {stats.totalAssignments || 0} assigned
                    </span>
                  </div>

                  {/* Progress Stats */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-xs">
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                        {stats.approvedCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Approved</span>
                    </div>
                    <div>
                      <span className="text-amber-600 dark:text-amber-400 font-bold block">
                        {stats.submittedCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Submitted</span>
                    </div>
                    <div>
                      <span className="text-rose-600 dark:text-rose-400 font-bold block">
                        {stats.overdueCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Overdue</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <Link
                    to={
                      user?.role === 'ADMIN'
                        ? '/admin/reviews'
                        : user?.role === 'TRAINER'
                        ? '/trainer/reviews'
                        : '/mentor/reviews'
                    }
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium text-xs transition border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    Submissions &rarr;
                  </Link>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => openExtendModal(task)}
                        className="py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-600/30 text-amber-700 dark:text-amber-300 font-medium text-xs transition border border-amber-200 dark:border-amber-500/30 flex items-center gap-1.5"
                        title="Extend Due Date"
                      >
                        <Clock className="w-3.5 h-3.5" /> Extend Due Date
                      </button>
                      <button
                        onClick={() => openEditModal(task)}
                        className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-medium text-xs transition border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== EDIT TASK MODAL ==================== */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full my-8 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Edit Weekly Task
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Update task details, schedule start/due dates, or modify problem questions.
                </p>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Task Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Week Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.weekNo}
                    onChange={(e) => setEditForm({ ...editForm, weekNo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.assignmentDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, assignmentDate: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">End Date (Deadline)</label>
                  <input
                    type="date"
                    required
                    value={editForm.lastDate}
                    onChange={(e) => setEditForm({ ...editForm, lastDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Instructions / Guidelines</label>
                <textarea
                  rows={2}
                  value={editForm.instructions}
                  onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                  placeholder="Task instructions..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Problems / Questions Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Coding Problems ({editForm.problems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddProblem}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Question
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {editForm.problems.map((prob, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                        {idx + 1}
                      </span>

                      <input
                        type="text"
                        required
                        value={prob.name}
                        onChange={(e) => handleProblemChange(idx, 'name', e.target.value)}
                        placeholder="Problem title..."
                        className="flex-1 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />

                      <input
                        type="url"
                        required
                        value={prob.problemUrl}
                        onChange={(e) =>
                          handleProblemChange(idx, 'problemUrl', e.target.value)
                        }
                        placeholder="https://leetcode.com/problems/..."
                        className="flex-1 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />

                      <select
                        value={prob.platform}
                        onChange={(e) => handleProblemChange(idx, 'platform', e.target.value)}
                        className="w-full sm:w-28 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="LEETCODE">LeetCode</option>
                        <option value="CODECHEF">CodeChef</option>
                        <option value="CODEFORCES">Codeforces</option>
                        <option value="HACKERRANK">HackerRank</option>
                        <option value="CUSTOM">Custom</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveProblem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition shrink-0"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    closeEditModal();
                    handleDeleteTask(editingTask);
                  }}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Entire Task
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EXTEND DEADLINE MODAL ==================== */}
      {extendingTask && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Extend Task Due Date
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Week {extendingTask.weekNo}: {extendingTask.title}
                </p>
              </div>
              <button
                onClick={closeExtendModal}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {extendError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {extendError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 text-[11px] text-indigo-700 dark:text-indigo-300 space-y-1">
              <p className="font-semibold">Reopening Policy:</p>
              <p className="leading-relaxed">
                Extending the due date into the future automatically reopens this task for all students whose submissions were closed or marked overdue, allowing them to continue their work.
              </p>
            </div>

            <form onSubmit={handleSaveExtend} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Current Due Date
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={
                    extendingTask.lastDate
                      ? new Date(extendingTask.lastDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'
                  }
                  className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-600 dark:text-slate-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  New Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={extendDate}
                  onChange={(e) => setExtendDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeExtendModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExtend}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingExtend ? 'Extending Deadline...' : 'Save & Reopen Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

