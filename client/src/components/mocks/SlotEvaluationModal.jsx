import React, { useState } from 'react';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';
import { MockStatusBadge, RecommendationBadge } from './MockBadges';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  History,
  Sparkles,
  Edit3
} from 'lucide-react';

export const SlotEvaluationModal = ({
  isOpen,
  onClose,
  slot,
  onSuccess
}) => {
  const { showSuccess, showError, showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState('EVALUATION'); // 'EVALUATION' or 'RESCHEDULE' or 'HISTORY'
  const [loading, setLoading] = useState(false);

  // Evaluation form state
  const [evalForm, setEvalForm] = useState({
    overallScore: slot?.evaluation?.overallScore ?? 7.5,
    technicalScore: slot?.evaluation?.technicalScore ?? 4.0,
    communicationScore: slot?.evaluation?.communicationScore ?? 3.5,
    problemSolvingScore: slot?.evaluation?.problemSolvingScore ?? 4.0,
    recommendation: slot?.evaluation?.recommendation || 'RECOMMENDED',
    notes: slot?.evaluation?.notes || ''
  });

  // Reschedule form state
  const [rescheduleForm, setRescheduleForm] = useState({
    sessionDate: slot?.sessionDate ? new Date(slot.sessionDate).toISOString().split('T')[0] : '',
    startTime: slot?.startTime || '10:00',
    endTime: slot?.endTime || '10:30',
    roomNumber: slot?.roomNumber || 'Room 101',
    reason: ''
  });

  if (!isOpen || !slot) return null;

  const handleRecordEvaluation = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/mentor/mocks/slots/${slot.id}/evaluate`, evalForm);
      if (res.data.success) {
        showSuccess(
          'Evaluation Recorded Successfully',
          `Overall Score: ${evalForm.overallScore}/10. Interview marked as COMPLETED and performance released to candidate.`
        );
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError('Evaluation Failed', err.response?.data?.message || 'Failed to submit evaluation.');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (rescheduleForm.startTime >= rescheduleForm.endTime) {
      showError('Validation Error', 'End time must be after start time.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put(`/mentor/mocks/slots/${slot.id}`, rescheduleForm);
      if (res.data.success) {
        showSuccess('Slot Rescheduled', 'Appointment updated and candidate notified.');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError('Reschedule Conflict', err.response?.data?.message || 'Failed to reschedule slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkMissed = async () => {
    const confirmed = await showConfirm({
      title: 'Confirm Missed Mock',
      message: `Are you sure you want to mark ${slot.mentee?.name}'s mock interview as MISSED? The candidate was absent during their scheduled appointment window.`,
      confirmText: 'Mark as Missed',
      cancelText: 'Cancel',
      variant: 'warning'
    });

    if (!confirmed) return;

    try {
      const res = await api.post(`/mentor/mocks/slots/${slot.id}/missed`, {
        reason: 'Candidate did not attend scheduled interview window'
      });
      if (res.data.success) {
        showSuccess('Slot Marked as Missed', 'Attendance updated. Missed state is recorded.');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError('Action Failed', err.response?.data?.message || 'Failed to mark as missed.');
    }
  };

  const handleCancelSlot = async () => {
    const confirmed = await showConfirm({
      title: 'Cancel Interview Appointment',
      message: `Are you sure you want to cancel this interview slot for ${slot.mentee?.name}? The slot will be removed from schedule and the candidate will become unassigned for this section.`,
      confirmText: 'Cancel Slot',
      cancelText: 'Keep Slot',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const res = await api.delete(`/mentor/mocks/slots/${slot.id}`);
      if (res.data.success) {
        showSuccess('Slot Cancelled', 'Appointment cancelled. Candidate is now unassigned.');
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError('Action Failed', err.response?.data?.message || 'Failed to cancel slot.');
    }
  };

  const dateFormatted = slot.sessionDate
    ? new Date(slot.sessionDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date not set';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111625] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {slot.mentee?.name ? slot.mentee.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-tight">{slot.mentee?.name}</h3>
                <MockStatusBadge status={slot.status} />
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-slate-300">
                  {slot.mentee?.menteeProfile?.rollNumber || slot.mentee?.email}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> {dateFormatted}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-mono text-indigo-300">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {slot.startTime} - {slot.endTime}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {slot.roomNumber}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('EVALUATION')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'EVALUATION'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            {slot.status === 'COMPLETED' ? 'Evaluation Scores' : 'Record Evaluation'}
          </button>

          {slot.status !== 'COMPLETED' && (
            <button
              onClick={() => setActiveTab('RESCHEDULE')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'RESCHEDULE'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Reschedule Slot
            </button>
          )}

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Schedule Audit History
          </button>
        </div>

        {/* ================= TAB 1: EVALUATION FORM ================= */}
        {activeTab === 'EVALUATION' && (
          <form onSubmit={handleRecordEvaluation} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-slate-300">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Individual Slot Evaluation Matrix
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Scores are saved directly against this candidate's slot. The 3 skill scores are scored out of 5 (sum max 15), while Overall Score is evaluated independently out of 10.
              </p>
            </div>

            {/* Overall Score Slider / Input */}
            <div className="glass-panel p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-white text-xs">Overall Interview Score (0 – 10)</label>
                  <p className="text-[10px] text-slate-400">Holistic rating for candidate's interview readiness</p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={evalForm.overallScore}
                    onChange={(e) => setEvalForm({ ...evalForm, overallScore: parseFloat(e.target.value) || 0 })}
                    className="w-16 bg-slate-900 border border-indigo-500 rounded-lg px-2 py-1 text-right font-black text-indigo-300 text-sm focus:outline-none"
                  />
                  <span className="font-bold text-slate-400 text-xs">/ 10</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={evalForm.overallScore}
                onChange={(e) => setEvalForm({ ...evalForm, overallScore: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* 3 Skill Scores (0 to 5 each) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Technical Score */}
              <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-cyan-300 text-[11px]">Technical (0–5)</label>
                  <span className="font-mono font-bold text-white text-xs">{evalForm.technicalScore}/5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={evalForm.technicalScore}
                  onChange={(e) => setEvalForm({ ...evalForm, technicalScore: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Code correctness & syntax</p>
              </div>

              {/* Problem-Solving Score */}
              <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-violet-300 text-[11px]">Problem Solving (0–5)</label>
                  <span className="font-mono font-bold text-white text-xs">{evalForm.problemSolvingScore}/5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={evalForm.problemSolvingScore}
                  onChange={(e) => setEvalForm({ ...evalForm, problemSolvingScore: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Logic & edge-case handling</p>
              </div>

              {/* Communication Score */}
              <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-300 text-[11px]">Communication (0–5)</label>
                  <span className="font-mono font-bold text-white text-xs">{evalForm.communicationScore}/5</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={evalForm.communicationScore}
                  onChange={(e) => setEvalForm({ ...evalForm, communicationScore: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">Articulation & thought-process</p>
              </div>
            </div>

            {/* Recommendation Decision */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Final Recommendation Decision *</label>
              <select
                required
                value={evalForm.recommendation}
                onChange={(e) => setEvalForm({ ...evalForm, recommendation: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="STRONGLY_RECOMMENDED">Strongly Recommended (Ready for Placement)</option>
                <option value="RECOMMENDED">Recommended (Cleared Mock Expectations)</option>
                <option value="RECOMMENDED_WITH_IMPROVEMENT">Recommended with Minor Improvements</option>
                <option value="NOT_RECOMMENDED_YET">Not Recommended Yet (Needs More Practice)</option>
              </select>
            </div>

            {/* Qualitative Notes / Feedback */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Evaluation Notes & Actionable Feedback</label>
              <textarea
                rows={3}
                value={evalForm.notes}
                onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })}
                placeholder="Key strengths, time complexity trade-offs explained, areas for improvement, recommended practice topics..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {slot.status !== 'COMPLETED' && (
                  <>
                    <button
                      type="button"
                      onClick={handleMarkMissed}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition text-[11px] font-medium"
                    >
                      Mark Missed (Absent)
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSlot}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition text-[11px] font-medium"
                    >
                      Cancel Slot
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading
                    ? 'Saving...'
                    : slot.status === 'COMPLETED'
                    ? 'Update Evaluation Scores'
                    : 'Save Evaluation & Complete Mock'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ================= TAB 2: RESCHEDULE FORM ================= */}
        {activeTab === 'RESCHEDULE' && (
          <form onSubmit={handleReschedule} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Rescheduling will verify real-time conflicts for you, candidate, and room. History of this change will be preserved in the audit log.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">New Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleForm.sessionDate}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, sessionDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Room / Venue *</label>
                <input
                  type="text"
                  required
                  value={rescheduleForm.roomNumber}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, roomNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">New Start Time *</label>
                <input
                  type="time"
                  required
                  value={rescheduleForm.startTime}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, startTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">New End Time *</label>
                <input
                  type="time"
                  required
                  value={rescheduleForm.endTime}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, endTime: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Reason for Rescheduling</label>
              <input
                type="text"
                value={rescheduleForm.reason}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                placeholder="e.g. Mentor schedule adjustment or student class conflict"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('EVALUATION')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5" />
                {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 3: AUDIT HISTORY ================= */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Appointment Timeline & Modification Log
            </h4>

            {(!slot.history || slot.history.length === 0) ? (
              <div className="py-8 text-center text-slate-500 glass-panel rounded-xl border border-slate-800">
                No past modifications recorded for this slot.
              </div>
            ) : (
              <div className="space-y-2">
                {slot.history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-300 font-mono text-[11px] uppercase">
                          {h.action}
                        </span>
                        <span className="text-[10px] text-slate-500">&bull;</span>
                        <span className="text-[11px] text-slate-300">
                          {h.previousStartTime} - {h.previousEndTime} ({h.previousRoom || 'Room'})
                        </span>
                      </div>
                      {h.reason && (
                        <p className="text-[11px] text-slate-400 italic">"{h.reason}"</p>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 text-right flex-shrink-0">
                      {new Date(h.createdAt).toLocaleDateString()} &middot;{' '}
                      {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
