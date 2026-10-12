import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { LogOut, Key, User, Menu, X } from 'lucide-react';

export const Navbar = ({ mobileMenuOpen, onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const profilePath =
    user?.role === 'ADMIN'
      ? '/admin/profile'
      : user?.role === 'MENTOR'
      ? '/mentor/profile'
      : '/mentee/profile';

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-indigo-400" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 px-2 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-md">
              <img src="/sru-mark.png" alt="SRU" className="h-5 w-auto object-contain" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SRU <span className="text-indigo-400">MentorHub</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/25">
                SR University
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <NotificationDropdown />

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to={profilePath}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/60 transition group"
              title="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:border-indigo-500 font-semibold text-xs transition">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-white group-hover:text-indigo-400 leading-none transition">
                  {user?.name}
                </p>
                <span className="text-[10px] text-indigo-400 font-medium">
                  {user?.role}
                </span>
              </div>
            </Link>

            <Link
              to={profilePath}
              className="hidden sm:inline-flex p-2 text-slate-400 hover:text-indigo-400 transition rounded-lg hover:bg-slate-800"
              title="My Profile"
            >
              <User className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 transition rounded-lg hover:bg-slate-800"
              title="Change Password"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={logout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800"
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

