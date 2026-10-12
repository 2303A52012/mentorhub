import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FolderGit2, Users, GraduationCap, Calendar, Plus } from 'lucide-react';

export const MentorBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get('/batches');
        if (res.data.success) {
          setBatches(res.data.batches || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Batches</h1>
          <p className="text-xs text-slate-400 mt-1">
            Training cohorts and student groupings for streamlined weekly task distribution.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading batches...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No batches found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Class of {batch.academicYear || 2027}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{batch.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {batch.description || 'Specialized training cohort.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {batch.menteeCount} Mentees
                </span>
                <span className="text-slate-500">
                  {batch.mentorCount} Mentors assigned
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
