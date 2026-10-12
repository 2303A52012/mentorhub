import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MockStatusBadge, MockTypeBadge, RecommendationBadge } from '../../components/mocks/MockBadges';
import {
  Calendar,
  Clock,
  MapPin,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  Sparkles,
  ChevronRight,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export const MenteeWeeklyMocks = () => {
  const [upcomingMocks, setUpcomingMocks] = useState([]);
  const [historyMocks, setHistoryMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvaluationSlot, setSelectedEvaluationSlot] = useState(null);

  const fetchMocks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentee/mocks');
      if (res.data.success) {
        setUpcomingMocks(res.data.upcoming || []);
        setHistoryMocks(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to load candidate mocks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMocks();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Weekly Mocks</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
            Interview Preparation
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Review your confirmed mock interview slots, preparation instructions, performance scores, and mentor recommendations.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your mock interview schedule...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ======================================================== */}
          {/* SECTION 1: UPCOMING SCHEDULED MOCKS                     */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Upcoming Mock Appointments ({upcomingMocks.length})
              </h2>
            </div>

            {upcomingMocks.length === 0 ? (
              <div className="glass-panel rounded-2xl border border-slate-800 p-8 text-center space-y-2">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-white font-semibold text-xs">No Upcoming Mocks Scheduled</h3>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Your mentor will schedule and publish your upcoming interview slots based on your weekly roadmap. You will be notified when your slot is confirmed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMocks.map((slot) => {
                  const dateStr = new Date(slot.sessionDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <div
                      key={slot.id}
                      className="glass-panel p-5 rounded-2xl border border-indigo-500/40 bg-indigo-500/5 space-y-4 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                              WEEK {slot.section?.weekNumber}
                            </span>
                            <MockTypeBadge type={slot.section?.mockType} />
                            <MockStatusBadge status={slot.status} />
                          </div>
                          <h3 className="font-bold text-white text-base">
                            {slot.section?.title}
                          </h3>
                        </div>
                      </div>

                      {/* Appointment Metadata Box */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Date:
                          </span>
                          <span className="font-semibold text-white">{dateStr}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" /> Time Window:
                          </span>
                          <span className="font-mono font-bold text-indigo-300 text-sm">
                            {slot.startTime} &ndash; {slot.endTime}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> Venue / Room:
                          </span>
                          <span className="font-semibold text-slate-200">
                            {slot.roomNumber || slot.section?.defaultVenue || 'Room 101'}
                          </span>
                        </div>

                        {slot.evaluator && (
                          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" /> Evaluator:
                            </span>
                            <span className="font-semibold text-indigo-300">
                              {slot.evaluator.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Instructions for candidate */}
                      {slot.section?.description && (
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                          <div className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
                            Preparation Instructions
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {slot.section.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: PREVIOUS MOCKS & PERFORMANCE EVALUATIONS     */}
          {/* ======================================================== */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Mock History & Performance Evaluations ({historyMocks.length})
            </h2>

            {historyMocks.length === 0 ? (
              <div className="glass-panel rounded-2xl border border-slate-800 p-8 text-center text-slate-500 text-xs">
                No past mock evaluations recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {historyMocks.map((slot) => {
                  const dateStr = new Date(slot.sessionDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const ev = slot.evaluation;

                  return (
                    <div
                      key={slot.id}
                      className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                              WEEK {slot.section?.weekNumber}
                            </span>
                            <MockTypeBadge type={slot.section?.mockType} />
                            <MockStatusBadge status={slot.status} />
                          </div>
                          <h3 className="font-bold text-white text-base">
                            {slot.section?.title}
                          </h3>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{dateStr}</span>
                            <span>&bull;</span>
                            <span>Evaluated by {slot.evaluator?.name || 'Mentor'}</span>
                          </div>
                        </div>

                        {ev ? (
                          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
                            <div className="text-right">
                              <div className="text-[10px] text-slate-400 uppercase font-semibold">Overall Score</div>
                              <div className="font-black text-xl text-emerald-400 font-mono">
                                {ev.overallScore} <span className="text-xs text-slate-500 font-normal">/ 10</span>
                              </div>
                            </div>
                            <RecommendationBadge recommendation={ev.recommendation} />
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            {slot.status === 'MISSED' ? 'Marked Absent' : 'Evaluation Pending'}
                          </div>
                        )}
                      </div>

                      {/* Score Breakdown if evaluated */}
                      {ev && (
                        <div className="space-y-3 border-t border-slate-800/80 pt-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                              <div className="text-[10px] text-cyan-400 font-bold uppercase">Technical</div>
                              <div className="text-sm font-bold text-white font-mono mt-0.5">
                                {ev.technicalScore} / 5
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                              <div className="text-[10px] text-violet-400 font-bold uppercase">Problem Solving</div>
                              <div className="text-sm font-bold text-white font-mono mt-0.5">
                                {ev.problemSolvingScore} / 5
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                              <div className="text-[10px] text-amber-400 font-bold uppercase">Communication</div>
                              <div className="text-sm font-bold text-white font-mono mt-0.5">
                                {ev.communicationScore} / 5
                              </div>
                            </div>
                          </div>

                          {ev.notes && (
                            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-xs">
                              <span className="font-semibold text-indigo-300 text-[11px] flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Mentor Feedback & Guidance:
                              </span>
                              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {ev.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
