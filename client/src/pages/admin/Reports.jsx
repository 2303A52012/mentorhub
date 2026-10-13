import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileSpreadsheet,
  Download,
  CheckSquare,
  Users,
  Video,
  Search,
  Calendar,
  Star,
  Award,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useModal } from '../../context/ModalContext';

export const AdminReports = () => {
  const { showToast, showError } = useModal();
  const [taskReports, setTaskReports] = useState([]);
  const [menteeReports, setMenteeReports] = useState([]);
  const [mockReports, setMockReports] = useState([]);
  const [mockSummary, setMockSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock filters
  const [mockSearch, setMockSearch] = useState('');
  const [mockStatusFilter, setMockStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [tRes, mRes, mockRes] = await Promise.all([
          api.get('/reports/tasks'),
          api.get('/reports/mentees'),
          api.get('/reports/mocks')
        ]);
        if (tRes.data.success) setTaskReports(tRes.data.report || []);
        if (mRes.data.success) setMenteeReports(mRes.data.report || []);
        if (mockRes.data.success) {
          setMockReports(mockRes.data.report || []);
          setMockSummary(mockRes.data.summary || null);
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadCSV = async (type) => {
    try {
      let endpoint = '';
      let filename = '';

      if (type === 'tasks') {
        endpoint = '/reports/tasks?format=csv';
        filename = 'mentorhub-task-report.csv';
      } else if (type === 'mentees') {
        endpoint = '/reports/mentees?format=csv';
        filename = 'mentorhub-mentee-report.csv';
      } else if (type === 'mocks') {
        endpoint = '/reports/mocks?format=csv';
        filename = 'mentorhub-mock-interviews-report.csv';
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('CSV report downloaded successfully', 'success', 3000);
    } catch (err) {
      console.error(err);
      showError('Export Failed', 'Error downloading CSV report.');
    }
  };

  const filteredMockReports = mockReports.filter((item) => {
    const matchesSearch =
      !mockSearch ||
      item.studentName?.toLowerCase().includes(mockSearch.toLowerCase()) ||
      item.studentRollNumber?.toLowerCase().includes(mockSearch.toLowerCase()) ||
      item.evaluatorName?.toLowerCase().includes(mockSearch.toLowerCase()) ||
      item.sectionTitle?.toLowerCase().includes(mockSearch.toLowerCase());

    const matchesStatus =
      mockStatusFilter === 'ALL' || item.status === mockStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Data Exports</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Platform-wide training summaries, mock interview assessments, and CSV exports.
        </p>
      </div>

      {/* ======================================================== */}
      {/* 1. MOCK INTERVIEWS REPORT (NEW)                         */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Mock Interviews & Viva Assessment Report
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Evaluator scorecards, attendance status, student ratings, and mentor feedback
            </span>
          </div>

          <button
            onClick={() => downloadCSV('mocks')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" /> Export Mock Interviews CSV
          </button>
        </div>

        {/* Mock Summary Metrics */}
        {mockSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Total Interviews</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{mockSummary.totalSlots}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Completed</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{mockSummary.completedCount}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-semibold">Scheduled</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{mockSummary.scheduledCount}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold">Missed / No Show</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">{mockSummary.missedCount}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-semibold">Evaluated</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">{mockSummary.evaluatedCount}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Avg Overall Score</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {mockSummary.averageScore !== 'N/A' ? `${mockSummary.averageScore} / 10` : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, roll no, mentor..."
                value={mockSearch}
                onChange={(e) => setMockSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 sm:w-64"
              />
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
              {['ALL', 'COMPLETED', 'SCHEDULED', 'MISSED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setMockStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    mockStatusFilter === st
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="text-slate-900 dark:text-white font-semibold">{filteredMockReports.length}</span> records
          </div>
        </div>

        {/* Mock Report Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Week</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Roll Number</th>
                <th className="py-2.5 px-3">Evaluator Mentor</th>
                <th className="py-2.5 px-3">Date & Slot</th>
                <th className="py-2.5 px-3">Venue</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Scores (T / C / P)</th>
                <th className="py-2.5 px-3 text-center">Overall</th>
                <th className="py-2.5 px-3">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {filteredMockReports.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-slate-400 dark:text-slate-500">
                    No mock interview records match the filter.
                  </td>
                </tr>
              ) : (
                filteredMockReports.map((slot) => {
                  let statusBadgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                  if (slot.status === 'COMPLETED') {
                    statusBadgeClass = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
                  } else if (slot.status === 'SCHEDULED') {
                    statusBadgeClass = 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20';
                  } else if (slot.status === 'MISSED') {
                    statusBadgeClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
                  }

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        Week {slot.weekNumber}
                        <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">{slot.sectionTitle}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {slot.studentName}
                        <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">{slot.studentBranch}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold">
                          {slot.studentRollNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-indigo-700 dark:text-indigo-300">{slot.evaluatorName}</div>
                        {slot.evaluatorRollNumber && (
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ID: {slot.evaluatorRollNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono text-slate-700 dark:text-slate-300">{slot.sessionDate || 'N/A'}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{slot.timeSlot}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{slot.roomNumber}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass}`}>
                          {slot.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                        {slot.technicalScore !== 'N/A' ? (
                          <span className="text-slate-700 dark:text-slate-300">
                            {slot.technicalScore} / {slot.communicationScore} / {slot.problemSolvingScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono">
                        {slot.overallScore !== 'N/A' ? (
                          <span className="text-amber-600 dark:text-amber-400">{slot.overallScore}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {slot.recommendation}
                        </span>
                        {slot.feedback && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-0.5" title={slot.feedback}>
                            "{slot.feedback}"
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TASK PERFORMANCE REPORT TABLE                        */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Weekly Tasks Performance Summary
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Aggregated submissions, reviews, and completion rates by assignment
            </span>
          </div>

          <button
            onClick={() => downloadCSV('tasks')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" /> Export Tasks CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Week</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Problems</th>
                <th className="py-2.5 px-3">Deadline</th>
                <th className="py-2.5 px-3">Assigned</th>
                <th className="py-2.5 px-3">Approved</th>
                <th className="py-2.5 px-3">Overdue</th>
                <th className="py-2.5 px-3 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {taskReports.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">Week {t.weekNo}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{t.title}</td>
                  <td className="py-3 px-3">{t.problemCount}</td>
                  <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">{t.lastDate}</td>
                  <td className="py-3 px-3">{t.totalAssigned}</td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">{t.approvedCount}</td>
                  <td className="py-3 px-3 text-rose-600 dark:text-rose-400 font-semibold">{t.overdueCount}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {t.completionRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MENTEE TRAINING REPORT TABLE                         */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Student Cohort Completion Report
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Individual student progress, verification metrics, and completion rates
            </span>
          </div>

          <button
            onClick={() => downloadCSV('mentees')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" /> Export Students CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Roll Number</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Total Assigned</th>
                <th className="py-2.5 px-3">Approved</th>
                <th className="py-2.5 px-3">Overdue</th>
                <th className="py-2.5 px-3 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {menteeReports.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{m.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">{m.rollNumber}</td>
                  <td className="py-3 px-3">{m.branch}</td>
                  <td className="py-3 px-3">{m.totalAssigned}</td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">{m.approvedCount}</td>
                  <td className="py-3 px-3 text-rose-600 dark:text-rose-400 font-semibold">{m.overdueCount}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {m.completionRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
