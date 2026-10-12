import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

export const AssignSlotModal = ({
  isOpen,
  onClose,
  sectionId,
  defaultVenue = 'Room 101',
  defaultDuration = 30,
  unassignedMentees = [],
  allCohortMentees = [],
  targetMentee = null,
  onSuccess
}) => {
  const { showSuccess, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [busySlots, setBusySlots] = useState([]);

  // Auto-set tomorrow or today as default date
  const defaultDateStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    menteeId: '',
    sessionDate: defaultDateStr,
    startTime: '10:00',
    endTime: '10:30',
    roomNumber: defaultVenue || 'Room 101'
  });

  useEffect(() => {
    if (isOpen) {
      const initialMenteeId = targetMentee?.id || (unassignedMentees[0]?.id || allCohortMentees[0]?.id || '');
      setForm((prev) => ({
        ...prev,
        menteeId: initialMenteeId,
        roomNumber: defaultVenue || 'Room 101'
      }));
    }
  }, [isOpen, targetMentee, unassignedMentees, allCohortMentees, defaultVenue]);

  // Update endTime automatically when startTime changes
  const handleStartTimeChange = (newStartTime) => {
    const [hours, minutes] = newStartTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const totalMinutes = hours * 60 + minutes + defaultDuration;
      const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
      const endM = String(totalMinutes % 60).padStart(2, '0');
      setForm((prev) => ({
        ...prev,
        startTime: newStartTime,
        endTime: `${endH}:${endM}`
      }));
    } else {
      setForm((prev) => ({ ...prev, startTime: newStartTime }));
    }
  };

  // Fetch mentor availability / busy intervals when date or room changes
  useEffect(() => {
    if (isOpen && form.sessionDate) {
      setAvailabilityLoading(true);
      api.get(`/mentor/mocks/availability?date=${form.sessionDate}&roomNumber=${encodeURIComponent(form.roomNumber)}`)
        .then((res) => {
          if (res.data.success) {
            setBusySlots(res.data.busyIntervals || []);
          }
        })
        .catch(() => {})
        .finally(() => setAvailabilityLoading(false));
    }
  }, [isOpen, form.sessionDate, form.roomNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.menteeId) {
      showError('Validation Error', 'Please select a mentee to interview.');
      return;
    }
    if (form.startTime >= form.endTime) {
      showError('Validation Error', 'Interview slot end time must be after start time.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/mentor/mocks/${sectionId}/slots`, form);
      if (res.data.success) {
        showSuccess(
          'Slot Assigned Successfully',
          `Interview scheduled for candidate on ${form.sessionDate} from ${form.startTime} to ${form.endTime} (${form.roomNumber}).`
        );
        onClose();
        if (onSuccess) onSuccess(res.data.slot);
      }
    } catch (err) {
      showError(
        'Scheduling Conflict or Error',
        err.response?.data?.message || 'Failed to assign time-slot.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Find candidate name
  const candidateList = unassignedMentees.length > 0 ? unassignedMentees : allCohortMentees;
  const currentCandidate = candidateList.find((m) => m.id === form.menteeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111625] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Assign Individual Mentee Slot</h3>
              <p className="text-[11px] text-slate-400">
                Manual scheduling based on your calendar & room availability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Mentee Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Select Candidate / Mentee *</span>
              {currentCandidate?.menteeProfile?.rollNumber && (
                <span className="font-mono text-[10px] text-indigo-400">
                  Roll: {currentCandidate.menteeProfile.rollNumber}
                </span>
              )}
            </label>
            <select
              required
              value={form.menteeId}
              onChange={(e) => setForm({ ...form, menteeId: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Candidate --</option>
              {unassignedMentees.length > 0 && (
                <optgroup label="Unassigned Mentees (Needs Slot)">
                  {unassignedMentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.menteeProfile?.rollNumber || m.email})
                    </option>
                  ))}
                </optgroup>
              )}
              {allCohortMentees.length > 0 && unassignedMentees.length === 0 && (
                <optgroup label="Cohort Mentees">
                  {allCohortMentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.menteeProfile?.rollNumber || m.email})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Session Date & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Interview Date *</label>
              <input
                type="date"
                required
                value={form.sessionDate}
                onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Room / Venue *</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  placeholder="e.g. Lab 3, Desk 4 or Meet link"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Start Time (24h) *</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">End Time (24h) *</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Availability Inspector / Conflicts on Date */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" /> Booked Slots on {form.sessionDate}:
              </span>
              <span>{busySlots.length} appointment(s)</span>
            </div>

            {busySlots.length === 0 ? (
              <p className="text-emerald-400/90 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> No overlapping commitments on this day. Time window is open!
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                {busySlots.map((b, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]"
                  >
                    {b.startTime} - {b.endTime} ({b.roomNumber || 'Room'})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {loading ? 'Validating & Booking...' : 'Save Slot Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
