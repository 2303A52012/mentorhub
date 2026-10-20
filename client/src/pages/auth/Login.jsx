import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  Key,
  X,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export const Login = () => {
  const [emailOrIdentifier, setEmailOrIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(emailOrIdentifier, password);
      if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (data.user.role === 'MENTOR') navigate('/mentor/dashboard');
      else if (data.user.role === 'TRAINER') navigate('/trainer/dashboard');
      else navigate('/mentee/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;

    setForgotLoading(true);
    setForgotResult(null);
    try {
      const res = await api.post('/auth/forgot-password', {
        emailOrIdentifier: forgotInput.trim()
      });

      if (res.data.success) {
        setForgotResult({
          success: true,
          role: res.data.role,
          message: res.data.message
        });
      }
    } catch (err) {
      setForgotResult({
        success: false,
        message: err.response?.data?.message || 'Failed to submit password reset request.'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col lg:flex-row text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* ========================================================= */}
      {/* LEFT PARTITION: SRU Branding & Quote                      */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden bg-gradient-to-br from-indigo-50/90 via-slate-50 to-indigo-100/60 dark:from-[#0e1426] dark:via-[#0b0f19] dark:to-[#131b33] border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: SRU Logo & MentorHub Text */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="h-12 px-3 rounded-2xl bg-white border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <img src="/sru-mark.png" alt="SRU Logo" className="h-7 w-auto object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white block">
              SRU <span className="text-indigo-600 dark:text-indigo-400">MentorHub</span>
            </span>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold block">
              SR University &middot; Warangal
            </span>
          </div>
        </div>

        {/* Center: Quote & Platform Highlights */}
        <div className="relative z-10 my-auto py-10 lg:py-16 space-y-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Excellence in Engineering &amp; Mentorship</span>
          </div>

          <blockquote className="space-y-4">
            <p className="text-2xl sm:text-3xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              &ldquo;Mentorship is the compass that turns ambition into achievement and potential into engineering excellence.&rdquo;
            </p>
            <footer className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2.5 font-medium">
              <div className="w-8 h-px bg-indigo-500/80" />
              <span>SR University Training &amp; Placement Division</span>
            </footer>
          </blockquote>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur shadow-sm">
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">1-on-1 Mentorship</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Continuous faculty guidance &amp; code reviews
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur shadow-sm">
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">Weekly Tasks &amp; Mocks</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                DSA problem sets &amp; interview evaluations
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} SR UNIVERSITY. All rights reserved.
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PARTITION: Dual Clean Glassmorphism Login Form       */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        {/* Sleek Theme Toggle in Top Right */}
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm flex items-center gap-2 text-xs font-medium"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Enter your university credentials to access the platform.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4 shadow-xl dark:shadow-2xl"
          >
            {/* Email / Roll Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email or Student Roll No / ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={emailOrIdentifier}
                  onChange={(e) => setEmailOrIdentifier(e.target.value)}
                  placeholder="e.g. 2303A52012 or 2303a52012@sru.edu.in"
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotInput(emailOrIdentifier);
                    setForgotResult(null);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                Default password for university accounts:{' '}
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold select-all">Password@123</span>
              </p>
            </div>

            {/* Remember Me */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Help link */}
          <div className="text-center text-xs text-slate-500">
            Need account access help?{' '}
            <button
              type="button"
              onClick={() => {
                setForgotInput(emailOrIdentifier);
                setForgotResult(null);
                setShowForgotModal(true);
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold hover:underline"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ACCOUNT RECOVERY / PASSWORD RESET MODAL                   */}
      {/* ========================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Account Assistance &amp; Recovery</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    SR University Student / Mentor Access Help
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!forgotResult ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">Account access policy:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                    <li><strong className="text-indigo-600 dark:text-indigo-300">Students:</strong> Accounts are provisioned with your Roll Number. Enter your Roll No or Email to request password reset.</li>
                    <li><strong className="text-indigo-600 dark:text-indigo-300">New Enrollments:</strong> For registration onto batches, contact the SRU CSE/ECE Department Platform Coordinator.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Your Registered Email or Student Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. 2303A52012 or 2303a52012@sru.edu.in"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition border border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {forgotLoading ? 'Submitting...' : 'Request Assistance'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    forgotResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {forgotResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">
                      {forgotResult.success ? 'Request Sent Successfully' : 'Request Failed'}
                    </p>
                    <p className="leading-relaxed opacity-90">{forgotResult.message}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotResult(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
