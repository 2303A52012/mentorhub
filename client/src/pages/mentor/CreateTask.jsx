import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Send,
  ArrowLeft,
  CheckCircle2,
  ListPlus,
  Sparkles
} from 'lucide-react';

export const CreateTask = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useModal();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [weekNo, setWeekNo] = useState(3);
  const [assignmentDate, setAssignmentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [lastDate, setLastDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [instructions, setInstructions] = useState(
    'Please solve all questions, write down your approach, and note the time/space complexities.'
  );

  const [targetType, setTargetType] = useState('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batches, setBatches] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [selectedMenteeIds, setSelectedMenteeIds] = useState([]);

  const [problems, setProblems] = useState([
    {
      name: 'Valid Parentheses',
      problemUrl: 'https://leetcode.com/problems/valid-parentheses/',
      platform: 'LEETCODE'
    },
    {
      name: 'Min Stack',
      problemUrl: 'https://leetcode.com/problems/min-stack/',
      platform: 'LEETCODE'
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTargetData = async () => {
      try {
        const [bRes, mRes] = await Promise.all([
          api.get('/batches'),
          api.get('/mentees')
        ]);
        if (bRes.data.success) setBatches(bRes.data.batches || []);
        if (mRes.data.success) setMentees(mRes.data.mentees || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadTargetData();
  }, []);

  const addProblem = () => {
    setProblems((prev) => [
      ...prev,
      {
        name: '',
        problemUrl: '',
        platform: 'LEETCODE'
      }
    ]);
  };

  const removeProblem = (index) => {
    if (problems.length <= 1) {
      showWarning(
        'Minimum Problem Requirement',
        'A weekly task must contain at least one coding problem question.'
      );
      return;
    }
    setProblems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProblem = (index, field, value) => {
    setProblems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    if (new Date(lastDate) <= new Date(assignmentDate)) {
      setError('Deadline cannot precede or equal the assignment start date.');
      return;
    }

    for (let i = 0; i < problems.length; i++) {
      if (!problems[i].name.trim() || !problems[i].problemUrl.trim()) {
        setError(`Problem #${i + 1} requires both a name and a valid URL.`);
        return;
      }
    }

    let targetIds = [];
    if (targetType === 'BATCH') {
      if (!selectedBatchId) {
        setError('Please select a target batch.');
        return;
      }
      targetIds = [selectedBatchId];
    } else if (targetType === 'SELECTED') {
      if (selectedMenteeIds.length === 0) {
        setError('Please select at least one mentee.');
        return;
      }
      targetIds = selectedMenteeIds;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        weekNo: Number(weekNo),
        assignmentDate: new Date(assignmentDate),
        lastDate: new Date(lastDate),
        instructions,
        problems,
        targetType,
        targetIds,
        reviewerId: user._id
      };

      const res = await api.post('/tasks', payload);
      if (res.data.success) {
        await showSuccess(
          'Task Published Successfully',
          `"${title}" (Week ${weekNo}) has been published and distributed to target mentees.`
        );
        navigate(user.role === 'ADMIN' ? '/admin/tasks' : '/mentor/tasks');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to publish task.';
      setError(errMsg);
      showError('Publish Failed', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Create Weekly Task
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Section 7 UI Specification · Publish coding problems and distribute assignments.
          </p>
        </div>
        <Link
          to={user?.role === 'ADMIN' ? '/admin/tasks' : '/mentor/tasks'}
          className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Task Metadata */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Task Overview & Scheduling
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Week 03 — Stack & Queue Patterns"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Week Number</label>
              <input
                type="number"
                min="1"
                required
                value={weekNo}
                onChange={(e) => setWeekNo(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Assignment Date (Start)</label>
              <input
                type="date"
                required
                value={assignmentDate}
                onChange={(e) => setAssignmentDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Last Date (Deadline)</label>
              <input
                type="date"
                required
                value={lastDate}
                onChange={(e) => setLastDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Total Problems</label>
              <input
                type="text"
                disabled
                value={`${problems.length} problems declared`}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 text-xs cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
              Instructions & Guidelines (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Provide instructions regarding approaches, complexities, or edge case testing..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Problems List Section */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Problems in this Weekly Task
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Each problem requires a name, valid URL, and allowed platform tag.
              </span>
            </div>

            <button
              type="button"
              onClick={addProblem}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-xs transition border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Problem
            </button>
          </div>

          <div className="space-y-3">
            {problems.map((prob, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
              >
                <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center font-bold shrink-0">
                  {idx + 1}
                </span>

                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="text"
                    required
                    value={prob.name}
                    onChange={(e) => updateProblem(idx, 'name', e.target.value)}
                    placeholder="Problem Name (e.g. Binary Search)"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="url"
                    required
                    value={prob.problemUrl}
                    onChange={(e) => updateProblem(idx, 'problemUrl', e.target.value)}
                    placeholder="https://leetcode.com/problems/..."
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <select
                    value={prob.platform}
                    onChange={(e) => updateProblem(idx, 'platform', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LEETCODE">LeetCode</option>
                    <option value="CODECHEF">CodeChef</option>
                    <option value="CODEFORCES">Codeforces</option>
                    <option value="HACKERRANK">HackerRank</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeProblem(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
                  title="Remove problem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Audience / Assignment Targeting */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Target Mentees & Distribution
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                <input
                  type="radio"
                  name="targetType"
                  value="ALL"
                  checked={targetType === 'ALL'}
                  onChange={() => setTargetType('ALL')}
                  className="text-indigo-600 focus:ring-0"
                />
                All Mentees ({user?.role === 'ADMIN' ? 'All Platform' : 'My Authorized Mentees'})
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                <input
                  type="radio"
                  name="targetType"
                  value="BATCH"
                  checked={targetType === 'BATCH'}
                  onChange={() => setTargetType('BATCH')}
                  className="text-indigo-600 focus:ring-0"
                />
                Specific Batch
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                <input
                  type="radio"
                  name="targetType"
                  value="SELECTED"
                  checked={targetType === 'SELECTED'}
                  onChange={() => setTargetType('SELECTED')}
                  className="text-indigo-600 focus:ring-0"
                />
                Selected Mentees
              </label>
            </div>

            {targetType === 'BATCH' && (
              <div className="pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Choose Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full sm:w-72 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select a batch --</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} ({b.menteeIds?.length || 0} students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === 'SELECTED' && (
              <div className="pt-2 space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Students:
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {mentees.map((m) => (
                    <label
                      key={m._id}
                      className="flex items-center gap-2 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMenteeIds.includes(m._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMenteeIds([...selectedMenteeIds, m._id]);
                          } else {
                            setSelectedMenteeIds(
                              selectedMenteeIds.filter((id) => id !== m._id)
                            );
                          }
                        }}
                        className="rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>
                        {m.name} ({m.profile?.rollNumber || m.email})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-xl shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Publishing Task...' : 'POST TASK'}
          </button>
        </div>
      </form>
    </div>
  );
};
