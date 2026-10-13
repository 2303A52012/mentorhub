import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  History,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export const BulkImport = () => {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'history'
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importMode, setImportMode] = useState('CREATE'); // 'CREATE' | 'UPDATE'
  
  // Preview / Validation state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  
  // Custom column mapping override (if needed)
  const [columnOverrides, setColumnOverrides] = useState({});
  const [showMappingConfig, setShowMappingConfig] = useState(false);

  // Filter & Pagination for preview table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // History state
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/bulk-import/history');
      if (res.data.success) {
        setHistoryList(res.data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch import history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setPreviewError('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }
    setFile(selectedFile);
    setPreviewData(null);
    setPreviewError(null);
    setExecutionResult(null);
    setExecutionError(null);
    setColumnOverrides({});
    uploadAndPreview(selectedFile, {});
  };

  const uploadAndPreview = async (fileToUpload, overrides = {}) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload || file);
      if (Object.keys(overrides).length > 0) {
        formData.append('columnMapping', JSON.stringify(overrides));
      }

      const res = await api.post('/bulk-import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setPreviewData(res.data.preview);
        setCurrentPage(1);
      } else {
        setPreviewError(res.data.message || 'Failed to parse file.');
      }
    } catch (err) {
      setPreviewError(err.response?.data?.message || err.message || 'Error parsing file.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData?.importSessionId) {
      setExecutionError('Missing active import session. Please re-upload your file.');
      return;
    }

    setExecuting(true);
    setExecutionError(null);
    setShowConfirmModal(false);

    try {
      const res = await api.post('/bulk-import/confirm', {
        importSessionId: previewData.importSessionId,
        importMode: importMode,
        columnMapping: columnOverrides
      });

      if (res.data.success) {
        setExecutionResult(res.data.result);
      } else {
        setExecutionError(res.data.message || 'Import failed.');
      }
    } catch (err) {
      setExecutionError(err.response?.data?.message || err.message || 'Import execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  const handleDownloadTemplate = (format = 'xlsx') => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/bulk-import/template?format=${format}`;
    window.open(url, '_blank');
  };

  const handleDownloadErrorReport = (historyId) => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/bulk-import/history/${historyId}/export-errors`;
    window.open(url, '_blank');
  };

  const resetAll = () => {
    setFile(null);
    setPreviewData(null);
    setPreviewError(null);
    setExecutionResult(null);
    setExecutionError(null);
    setColumnOverrides({});
    setSearchQuery('');
    setCurrentPage(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered preview rows
  const filteredRows = (previewData?.previewRows || []).filter((row) => {
    const roll = row.rollNumber || row.studentRollNo || '';
    const sName = row.name || row.studentName || '';
    const mName = row.mentorName || '';
    const mRoll = row.mentorRollNumber || row.mentorRollNo || '';
    const bName = row.batch || row.nbatch || '';

    const matchesSearch =
      !searchQuery ||
      roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mRoll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VALID' && row.status === 'VALID') ||
      (statusFilter === 'INVALID' && row.status === 'INVALID') ||
      (statusFilter === 'CONFLICT' && row.hasConflict) ||
      (statusFilter === 'NEW' && !row.isExistingStudent && row.status === 'VALID') ||
      (statusFilter === 'EXISTING' && row.isExistingStudent);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Admin Exclusive
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Section 22</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Bulk Data Import & Mentor Mapping
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Upload student cohorts and mentor assignments from Excel or CSV files (e.g.{' '}
            <code className="text-indigo-600 dark:text-indigo-300 font-mono">2024-28 Group-6 Mentor Mapping.xlsx</code>).
            Auto-detects columns, provisions credentials securely, maps relationships, and preserves database integrity.
          </p>
        </div>

        {/* Action Tabs & Template Downloader */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" /> Import Workspace
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Audit History
            </button>
          </div>

          <div className="relative group">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              title="Download Excel template matching the 13 required columns"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Template
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* ==================== AUDIT & HISTORY TAB ==================== */
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Historical Bulk Imports
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit trail of all previous file imports, execution results, and error logs.
                </p>
              </div>
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">Loading import history...</div>
            ) : historyList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No past bulk import sessions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Date / Time</th>
                      <th className="py-3 px-3">Filename</th>
                      <th className="py-3 px-3">Mode</th>
                      <th className="py-3 px-3">Initiated By</th>
                      <th className="py-3 px-3 text-center">Total</th>
                      <th className="py-3 px-3 text-center">Students Created</th>
                      <th className="py-3 px-3 text-center">Students Updated</th>
                      <th className="py-3 px-3 text-center">Mentors Created</th>
                      <th className="py-3 px-3 text-center">Mappings</th>
                      <th className="py-3 px-3 text-center">Failed</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="truncate max-w-[150px]" title={item.filename}>
                            {item.filename}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.importMode === 'UPDATE'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {item.importMode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{item.importedBy?.name || 'Admin'}</td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-900 dark:text-white">{item.totalRows}</td>
                        <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                          {item.studentsCreated}
                        </td>
                        <td className="py-3 px-3 text-center text-sky-600 dark:text-sky-400 font-semibold">
                          {item.studentsUpdated}
                        </td>
                        <td className="py-3 px-3 text-center text-purple-600 dark:purple-400 font-semibold">
                          {item.mentorsCreated}
                        </td>
                        <td className="py-3 px-3 text-center text-teal-600 dark:text-teal-400 font-semibold">
                          {item.mappingsCreated + item.mappingsUpdated}
                        </td>
                        <td className="py-3 px-3 text-center text-rose-600 dark:text-rose-400 font-semibold">
                          {item.failedCount}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : item.status === 'PARTIAL'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDownloadErrorReport(item.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition inline-flex items-center gap-1 shadow-sm"
                            title="Download detailed execution & error log CSV"
                          >
                            <Download className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Log CSV
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== IMPORT WORKSPACE TAB ==================== */
        <div className="space-y-6">
          {/* Post-Execution Success Banner */}
          {executionResult && (
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 space-y-4 animate-fadeIn shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 dark:bg-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Bulk Import Completed Successfully!
                    </h2>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300/80">
                      Import ID: <span className="font-mono">{executionResult.importId}</span> · Status: {executionResult.status}
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetAll}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-sm transition"
                >
                  Import Another File
                </button>
              </div>

              {/* Stat badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Students Added</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {executionResult.stats.studentsCreated}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Students Updated</div>
                  <div className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                    {executionResult.stats.studentsUpdated}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Students Skipped</div>
                  <div className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                    {executionResult.stats.studentsSkipped}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Mentors Added</div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                    {executionResult.stats.mentorsCreated}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Mentors Updated</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {executionResult.stats.mentorsUpdated}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Mappings Created</div>
                  <div className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                    {executionResult.stats.mappingsCreated}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Failed Records</div>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {executionResult.stats.failedCount}
                  </div>
                </div>
              </div>

              {/* Password notice */}
              <div className="p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    New student accounts initialized with password <code className="text-indigo-600 dark:text-indigo-300 font-mono font-bold">Student@2024</code> and mentors with <code className="text-purple-600 dark:text-purple-300 font-mono font-bold">Mentor@2027</code>. Existing accounts retained their existing passwords.
                  </span>
                </div>
                <button
                  onClick={() => handleDownloadErrorReport(executionResult.importId)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition shrink-0 ml-3 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Report CSV
                </button>
              </div>
            </div>
          )}

          {/* Upload & Configuration Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Drag-and-drop upload */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 1. Upload Spreadsheet File
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Supports Microsoft Excel (<code className="text-slate-700 dark:text-slate-300 font-mono">.xlsx</code>, <code className="text-slate-700 dark:text-slate-300 font-mono">.xls</code>) and CSV (<code className="text-slate-700 dark:text-slate-300 font-mono">.csv</code>) up to 15MB.
                  </p>
                </div>

                {file && (
                  <button
                    onClick={resetAll}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition"
                  >
                    Clear File
                  </button>
                )}
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px] ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 scale-[0.99]'
                    : file
                    ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/10'
                    : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 bg-slate-50/50 dark:bg-transparent'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.name.split('.').pop().toUpperCase()} File
                    </p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Click or drag new file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Drag and drop your mapping file here, or{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4">browse files</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Auto-detects <code className="text-slate-600 dark:text-slate-400 font-mono">2024-28 Group-6 Mentor Mapping.xlsx</code> column structure
                    </p>
                  </div>
                )}
              </div>

              {previewError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
                  <div>
                    <strong className="font-semibold">File Parse Error: </strong>
                    {previewError}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Import Mode & Rules */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 2. Import Strategy
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Choose how duplicates and existing users are handled.</p>
                </div>

                <div className="space-y-2">
                  <label
                    className={`block p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'CREATE'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="CREATE"
                          checked={importMode === 'CREATE'}
                          onChange={() => setImportMode('CREATE')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Create New Records</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Safe
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 pl-5">
                      Creates new students, mentors, and mappings. Skips existing accounts without overwriting their profile.
                    </p>
                  </label>

                  <label
                    className={`block p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'UPDATE'
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          value="UPDATE"
                          checked={importMode === 'UPDATE'}
                          onChange={() => setImportMode('UPDATE')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Update Existing Records</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Overwrite
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 pl-5">
                      Matches by Roll Number. Updates branch, batch, coding profile URLs, and mentor assignments. Passwords are preserved.
                    </p>
                  </label>
                </div>
              </div>

              {/* Password credentials note */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Default Initial Passwords:
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span>Students: <span className="text-indigo-600 dark:text-indigo-300 font-bold">Student@2024</span></span>
                  <span>Mentors: <span className="text-purple-600 dark:text-purple-300 font-bold">Mentor@2027</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Validation Results Section */}
          {previewData && !previewLoading && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-6 animate-fadeIn">
              {/* Summary Cards */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 3. Validation Summary & Preview
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspected <span className="text-slate-900 dark:text-white font-semibold">{previewData.totalRows}</span> rows in <code className="text-indigo-600 dark:text-indigo-300 font-mono">{previewData.filename}</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMappingConfig(!showMappingConfig)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    {showMappingConfig ? 'Hide Column Mapping' : 'Inspect Column Mapping'}
                  </button>

                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={executing || previewData.validRows === 0}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Database className="w-3.5 h-3.5" /> Import to Database ({previewData.validRows} Records)
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">Total Rows</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{previewData.totalRows}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-medium">Valid Records</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{previewData.validRows}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-medium">Invalid Rows</div>
                  <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{previewData.invalidRows}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                  <div className="text-[11px] text-purple-600 dark:purple-400 uppercase font-medium">Unique Mentors</div>
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{previewData.uniqueMentorsCount}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                  <div className="text-[11px] text-sky-600 dark:text-sky-400 uppercase font-medium">New Accounts</div>
                  <div className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">{previewData.newStudentsCount}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl">
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 uppercase font-medium">Existing Accounts</div>
                  <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{previewData.existingStudentsCount}</div>
                </div>
              </div>

              {/* Column Mapping Inspector (Collapsible) */}
              {showMappingConfig && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Detected Header Mapping
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Standardized against 13 core schema targets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(previewData.detectedMapping || {}).map(([rawCol, targetKey]) => (
                      <div
                        key={rawCol}
                        className="p-2 bg-white dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between shadow-xs"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-mono truncate max-w-[120px]" title={rawCol}>
                          {rawCol}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0 mx-1" />
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">{targetKey}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search roll number, name, mentor..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64 shadow-xs"
                    />
                  </div>

                  <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                    {['ALL', 'VALID', 'INVALID', 'NEW', 'EXISTING', 'CONFLICT'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setStatusFilter(filter);
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                          statusFilter === filter
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Showing <span className="text-slate-900 dark:text-white font-semibold">{filteredRows.length}</span> rows
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Student Roll No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Batch</th>
                      <th className="py-2.5 px-3">Assigned Mentor</th>
                      <th className="py-2.5 px-3">Profiles Detected</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Notes & Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-8 text-slate-500">
                          No records match your search or filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition ${
                            row.status === 'INVALID'
                              ? 'bg-rose-50/50 dark:bg-rose-950/10'
                              : row.hasConflict
                              ? 'bg-amber-50/50 dark:bg-amber-950/10'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                            {row.rowIndex}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {row.rollNumber || row.studentRollNo || <span className="text-rose-600 dark:text-rose-400 font-normal">Missing</span>}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200">
                            {row.name || row.studentName || <span className="text-rose-600 dark:text-rose-400 font-normal">Missing</span>}
                          </td>
                          <td className="py-2.5 px-3">{row.branch || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono border border-slate-200 dark:border-slate-700/60">
                              {row.batch || row.nbatch || '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div>
                              <div className="font-semibold text-indigo-600 dark:text-indigo-300">{row.mentorName || '-'}</div>
                              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{row.mentorRollNumber || row.mentorRollNo || '-'}</div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1 text-[10px]">
                              {row.codingProfiles?.leetcode && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">LC</span>
                              )}
                              {row.codingProfiles?.codeforces && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">CF</span>
                              )}
                              {row.codingProfiles?.hackerrank && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">HR</span>
                              )}
                              {row.codingProfiles?.github && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">GH</span>
                              )}
                              {row.codingProfiles?.linkedin && (
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">IN</span>
                              )}
                              {!row.codingProfiles?.leetcode && !row.codingProfiles?.github && !row.codingProfiles?.codeforces && (
                                <span className="text-slate-400 dark:text-slate-500">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {row.status === 'VALID' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {row.isExistingStudent ? 'EXISTING' : 'NEW'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                INVALID
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            {row.errors?.length > 0 && (
                              <div className="text-rose-600 dark:text-rose-400 font-medium">{row.errors.join(', ')}</div>
                            )}
                            {row.warnings?.length > 0 && (
                              <div className="text-amber-600 dark:text-amber-400">{row.warnings.join(', ')}</div>
                            )}
                            {row.errors?.length === 0 && row.warnings?.length === 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400/80">Ready for import</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-xs"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span>
                    Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Execution Error Banner */}
          {executionError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>
                  <strong>Import Failed:</strong> {executionError}
                </span>
              </div>
              <button
                onClick={() => setExecutionError(null)}
                className="text-xs text-rose-600 dark:text-rose-300 hover:text-rose-800 dark:hover:text-white underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4 shadow-2xl animate-scaleUp">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Database Import</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Review final parameters before committing changes</p>
                  </div>
                </div>

                <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Import Mode:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {importMode === 'CREATE' ? 'Create New Records Only' : 'Update Existing Records'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Valid Rows to Process:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{previewData?.validRows}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">New Students:</span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">{previewData?.newStudentsCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Unique Mentors to Map:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{previewData?.uniqueMentorsCount}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Clicking confirm will write student profiles, coding URLs, and mentor–student relationship records into PostgreSQL.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteImport}
                    disabled={executing}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    {executing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Import...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirm & Write Records
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
