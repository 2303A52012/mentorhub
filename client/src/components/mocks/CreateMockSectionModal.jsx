import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';
import {
  X,
  Calendar,
  Clock,
  Layers,
  MapPin,
  FileText,
  Sparkles,
  Users,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const CreateMockSectionModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useModal();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    weekNumber: 1,
    mockType: 'TECHNICAL',
    description: '',
    targetBatchId: '',
    defaultSlotDurationMinutes: 30,
    defaultVenue: 'Room 204 / Lab 3',
    sessionStartDate: '',
    sessionEndDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/batches')
        .then((res) => {
          if (res.data.success) {
            setBatches(res.data.batches || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showError('Validation Error', 'Please enter a title for the mock section.');
      return;
    }
    if (!formData.weekNumber || formData.weekNumber < 1) {
      showError('Validation Error', 'Please enter a valid week number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/mentor/mocks', formData);
      if (res.data.success) {
        showSuccess(
          'Mock Section Created',
          'Mock section created in Draft mode. You can now manually assign individual time slots to your mentees.'
        );
        onClose();
        if (onSuccess) onSuccess(res.data.section);
        navigate(`/mentor/mocks/${res.data.section.id}`);
      }
    } catch (err) {
      showError(
        'Creation Failed',
        err.response?.data?.message || 'Failed to create mock section.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Configure New Mock Section</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Step 1: Set section parameters &middot; Individual slots will be manually scheduled in Step 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Section Title & Week Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Mock Section Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Week 4: Tree & Graph Data Structures Mock"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Week Number *</label>
              <input
                type="number"
                min="1"
                max="52"
                required
                value={formData.weekNumber}
                onChange={(e) => setFormData({ ...formData, weekNumber: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Mock Type & Default Slot Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Mock Interview Type *</label>
              <select
                value={formData.mockType}
                onChange={(e) => setFormData({ ...formData, mockType: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="TECHNICAL">Technical Deep-Dive</option>
                <option value="DSA">Data Structures & Algorithms (DSA)</option>
                <option value="COMMUNICATION_HR">HR & Behavioral / Communication</option>
                <option value="MIXED">Comprehensive (DSA + HR Mixed)</option>
                <option value="CUSTOM">Custom Project Review</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Default Slot Duration *</label>
              <div className="flex items-center gap-2">
                {[20, 30, 45, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultSlotDurationMinutes: dur })}
                    className={`flex-1 py-2 rounded-xl font-mono text-xs border transition ${
                      formData.defaultSlotDurationMinutes === dur
                        ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Target Batch & Default Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Cohort / Batch (Optional)</label>
              <select
                value={formData.targetBatchId}
                onChange={(e) => setFormData({ ...formData, targetBatchId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All My Assigned Mentees</option>
                {batches.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.name} ({b.academicYear || 2027})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Default Room / Venue</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.defaultVenue}
                  onChange={(e) => setFormData({ ...formData, defaultVenue: e.target.value })}
                  placeholder="e.g. Lab 3, Desk 12 or Google Meet Link"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Date Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Session Start Date (Optional)</label>
              <input
                type="date"
                value={formData.sessionStartDate}
                onChange={(e) => setFormData({ ...formData, sessionStartDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Session End Date (Optional)</label>
              <input
                type="date"
                value={formData.sessionEndDate}
                onChange={(e) => setFormData({ ...formData, sessionEndDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Description & Preparation Instructions */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Candidate Preparation Notes & Instructions</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Please bring your laptop with camera and compiler ready. We will test DFS/BFS traversal, LeetCode Medium problem solving, and time complexity trade-offs."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

          {/* Footer note */}
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-300/90 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Workflow guarantee:</strong> Creating this section saves it as a <strong>Draft</strong>. It does not automatically book any mentee. In the next screen, you can manually schedule each mentee into their dedicated interview time slot based on your real-time availability.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Creating Draft...' : 'Save Draft & Schedule Slots'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
