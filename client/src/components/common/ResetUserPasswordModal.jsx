import React, { useState } from 'react';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';
import { Key, X, ShieldAlert, Sparkles, Check, RefreshCw } from 'lucide-react';

export const ResetUserPasswordModal = ({ isOpen, onClose, targetUser, onSuccess }) => {
  const { showSuccess, showError } = useModal();
  const [newPassword, setNewPassword] = useState('Student@2025');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !targetUser) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showError('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (targetUser.isMentorActor) {
        // Mentor resetting mentee password
        res = await api.post('/auth/mentor-reset-mentee-password', {
          menteeId: targetUser.id || targetUser._id,
          newPassword
        });
      } else {
        // Admin resetting user password
        res = await api.post('/auth/admin-reset-password', {
          userId: targetUser.id || targetUser._id,
          newPassword
        });
      }

      if (res.data.success) {
        showSuccess(
          'Password Reset Successful',
          `New temporary password for ${targetUser.name}: ${newPassword}\n\nThe user has been notified to log in and change their password.`
        );
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showError('Reset Failed', err.response?.data?.message || 'Failed to reset user password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111625] border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Reset User Password</h3>
              <p className="text-[11px] text-slate-400">
                Target: <span className="text-indigo-300 font-semibold">{targetUser.name}</span> ({targetUser.role || 'User'})
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

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Setting a new password will immediately update the user's login credential in the database and require them to set their permanent password upon logging in.
          </span>
        </div>

        <form onSubmit={handleReset} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">New Temporary Password</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate
              </button>
            </div>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="e.g. Student@2025"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-600/30"
            >
              <Key className="w-3.5 h-3.5" />
              {loading ? 'Resetting...' : 'Confirm Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
