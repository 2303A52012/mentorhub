import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { LogOut, Key, User, Menu, X, Sun, Moon } from 'lucide-react';

export const Navbar = ({ mobileMenuOpen, onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const profilePath =
    user?.role === 'ADMIN'
      ? '/admin/profile'
      : user?.role === 'MENTOR'
      ? '/mentor/profile'
      : '/mentee/profile';

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 px-2 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-md">
              <img src="/sru-mark.png" alt="SRU" className="h-5 w-auto object-contain" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                SRU <span className="text-indigo-600 dark:text-indigo-400">MentorHub</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/25">
                SR University
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition focus:outline-none"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle light or dark theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 transition transform hover:-rotate-12" />
            )}
          </button>

          <NotificationDropdown />

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to={profilePath}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-white group-hover:border-indigo-500 font-semibold text-xs transition">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-none transition">
                  {user?.name}
                </p>
                <span className={`text-[10px] font-semibold ${
                  user?.isSuperAdmin || user?.email?.toLowerCase() === 'admin@sru.edu.in'
                    ? 'text-purple-600 dark:text-purple-400 font-bold'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {user?.isSuperAdmin || user?.email?.toLowerCase() === 'admin@sru.edu.in' ? 'SUPER ADMIN' : user?.role}
                </span>
              </div>
            </Link>

            <Link
              to={profilePath}
              className="hidden sm:inline-flex p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="My Profile"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Change Password"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={logout}
              className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};

