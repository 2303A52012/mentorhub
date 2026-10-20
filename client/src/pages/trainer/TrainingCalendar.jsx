import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Plus, Edit3, Trash2, X, Check, ChevronLeft, ChevronRight,
  BookOpen, Tag, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export const TrainingCalendar = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ topicInput: '', topicsTaught: [], notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/trainer/profile');
        const tb = res.data.trainer?.trainerBatches || [];
        setBatches(tb.map(t => t.batch));
        if (tb.length > 0 && !selectedBatch) setSelectedBatch(tb[0].batch.id);
      } catch {}
    };
    fetchBatches();
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await api.get(`/trainer/sessions?batchId=${selectedBatch}&month=${viewDate.getMonth() + 1}&year=${viewDate.getFullYear()}`);
      setSessions(res.data.sessions || []);
    } catch { showToast('Failed to load sessions.', 'error'); }
    finally { setLoading(false); }
  }, [selectedBatch, viewDate]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const sessionMap = {};
  sessions.forEach(s => {
    const key = new Date(s.date).toDateString();
    sessionMap[key] = s;
  });

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handleDayClick = (day) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(date);
    const existing = sessionMap[date.toDateString()];
    if (existing) {
      setEditTarget(existing);
      setForm({ topicInput: '', topicsTaught: existing.topicsTaught || [], notes: existing.notes || '' });
    } else {
      setEditTarget(null);
      setForm({ topicInput: '', topicsTaught: [], notes: '' });
    }
    setShowForm(true);
  };

  const addTopic = () => {
    const t = form.topicInput.trim();
    if (t && !form.topicsTaught.includes(t)) setForm(f => ({ ...f, topicsTaught: [...f.topicsTaught, t], topicInput: '' }));
  };

  const removeTopic = (t) => setForm(f => ({ ...f, topicsTaught: f.topicsTaught.filter(x => x !== t) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.patch(`/trainer/sessions/${editTarget.id}`, { topicsTaught: form.topicsTaught, notes: form.notes });
      } else {
        await api.post('/trainer/sessions', { batchId: selectedBatch, date: selectedDate.toISOString(), topicsTaught: form.topicsTaught, notes: form.notes });
      }
      await fetchSessions();
      setShowForm(false);
      showToast(editTarget ? 'Session updated!' : 'Session saved!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save session.', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!editTarget || !window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/trainer/sessions/${editTarget.id}`);
      await fetchSessions();
      setShowForm(false);
      showToast('Session deleted.');
    } catch { showToast('Failed to delete.', 'error'); }
  };

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 font-sans">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-900/90 border-rose-700 text-rose-200' : 'bg-emerald-900/90 border-emerald-700 text-emerald-200'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30"><Calendar className="w-6 h-6 text-purple-400" /></div>
          <div><h1 className="text-2xl font-bold text-white">Training Calendar</h1><p className="text-sm text-slate-400">Click a date to record topics taught</p></div>
        </div>
        <div className="flex items-center gap-2">
          {batches.length > 1 && (
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500">
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button onClick={fetchSessions} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <button onClick={prevMonth} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><ChevronLeft className="w-5 h-5" /></button>
          <span className="font-bold text-white text-lg">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} className="border-b border-r border-slate-800/60 min-h-[80px]" />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const key = date.toDateString();
              const session = sessionMap[key];
              const isToday = key === today.toDateString();
              const isFuture = date > today;

              return (
                <div
                  key={day}
                  onClick={() => !isFuture && handleDayClick(day)}
                  className={`border-b border-r border-slate-800/60 min-h-[80px] p-1.5 transition group ${isFuture ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800/50'} ${isToday ? 'ring-1 ring-inset ring-purple-500/40 bg-purple-500/5' : ''}`}
                >
                  <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-purple-600 text-white' : 'text-slate-400'}`}>{day}</div>
                  {session && (
                    <div className="space-y-1">
                      {session.topicsTaught?.slice(0, 2).map((t, idx) => (
                        <div key={idx} className="text-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/20 rounded px-1.5 py-0.5 truncate">{t}</div>
                      ))}
                      {session.topicsTaught?.length > 2 && <div className="text-[10px] text-slate-500">+{session.topicsTaught.length - 2} more</div>}
                    </div>
                  )}
                  {!session && !isFuture && (
                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center justify-center mt-2">
                      <Plus className="w-3 h-3 text-slate-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Form Modal */}
      {showForm && selectedDate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="font-bold text-white text-lg">{editTarget ? 'Update Session' : 'Record Session'}</h2>
                <p className="text-sm text-slate-400">{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Topics Taught</label>
                <div className="flex gap-2 mb-2">
                  <input value={form.topicInput} onChange={e => setForm(f => ({ ...f, topicInput: e.target.value }))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())} placeholder="Add topic and press Enter…" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500" />
                  <button type="button" onClick={addTopic} className="px-3 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-500 transition"><Plus className="w-4 h-4" /></button>
                </div>
                {form.topicsTaught.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.topicsTaught.map(t => (
                      <span key={t} className="flex items-center gap-1.5 bg-purple-500/15 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-lg text-sm">
                        {t}
                        <button type="button" onClick={() => removeTopic(t)} className="text-purple-400/70 hover:text-rose-400 transition"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Session Notes (Optional)</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this session…" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                {editTarget && (
                  <button type="button" onClick={handleDelete} className="px-4 py-2.5 rounded-xl text-sm border border-rose-700 text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                )}
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-slate-700 text-slate-400 hover:text-white transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm bg-purple-600 hover:bg-purple-500 text-white font-medium transition disabled:opacity-60">
                  {submitting ? 'Saving…' : editTarget ? 'Update' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
