import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FolderGit2, Users, Plus, X, GraduationCap, CheckCircle2 } from 'lucide-react';

import { useModal } from '../../context/ModalContext';

export const AdminBatches = () => {
  const { showSuccess, showError } = useModal();
  const [batches, setBatches] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [academicYear, setAcademicYear] = useState(2027);
  const [description, setDescription] = useState('');
  const [selectedMentorIds, setSelectedMentorIds] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, menRes, mRes] = await Promise.all([
        api.get('/batches'),
        api.get('/mentors'),
        api.get('/mentees')
      ]);
      if (bRes.data.success) setBatches(bRes.data.batches || []);
      if (menRes.data.success) setMentors(menRes.data.mentors || []);
      if (mRes.data.success) setMentees(mRes.data.mentees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/batches', {
        name: batchName,
        academicYear: Number(academicYear),
        description,
        mentorIds: selectedMentorIds
      });
      if (res.data.success) {
        showSuccess('Batch Created', `Cohort "${batchName}" created successfully!`);
        setShowModal(false);
        setBatchName('');
        setDescription('');
        setSelectedMentorIds([]);
        fetchData();
      }
    } catch (err) {
      showError('Creation Failed', err.response?.data?.message || 'Failed to create batch.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Batch Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create academic training cohorts, assign lead mentors, and structure mentee groups.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Create New Batch
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading batches...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No batches created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {batches.map((b) => (
            <div
              key={b._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Cohort {b.academicYear || 2027}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {b.menteeCount} Students
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{b.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {b.description || 'Specialized training track.'}
                </p>

                <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                  <span className="font-semibold text-slate-400 text-[11px] block">
                    Assigned Mentors:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {b.mentorIds && b.mentorIds.length > 0 ? (
                      b.mentorIds.map((m) => (
                        <span
                          key={m._id}
                          className="bg-slate-900 border border-slate-700 text-indigo-300 px-2 py-0.5 rounded text-[10px]"
                        >
                          {m.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[10px]">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create New Batch</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Batch Name</label>
                <input
                  type="text"
                  required
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g. Cream Batch or Batch C"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Academic Year</label>
                <input
                  type="number"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cohort goals and description..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-slate-300 font-medium">Assign Mentors</label>
                <div className="max-h-28 overflow-y-auto space-y-1 p-2 bg-slate-900 rounded-xl border border-slate-800">
                  {mentors.map((m) => (
                    <label
                      key={m._id}
                      className="flex items-center gap-2 cursor-pointer text-slate-300 py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMentorIds.includes(m._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMentorIds([...selectedMentorIds, m._id]);
                          } else {
                            setSelectedMentorIds(
                              selectedMentorIds.filter((id) => id !== m._id)
                            );
                          }
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
