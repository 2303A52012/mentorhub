import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  FolderGit2,
  CheckSquare,
  FileCheck,
  FileSpreadsheet,
  Trophy,
  UserCheck,
  TrendingUp,
  BookmarkCheck,
  Calendar,
  CalendarCheck,
  UploadCloud,
  User,
  MessageSquareWarning,
  BookOpen,
  Sun,
  Moon,
  X,
  Megaphone,
  Zap,
  Layers,
  Target
} from 'lucide-react';

export const Sidebar = ({ mobileMenuOpen, onCloseMobileMenu }) => {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const role = user?.role;

  let links = [];

  if (role === 'ADMIN') {
    links = [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'User Directory', icon: Users },
      { to: '/admin/batches', label: 'Batches', icon: FolderGit2 },
      { to: '/admin/targets', label: 'Weekly Targets (W1-W12)', icon: Target },
      { to: '/admin/training-calendar', label: 'Training Calendar', icon: Calendar },
      { to: '/admin/bulk-import', label: 'Bulk Data Import', icon: UploadCloud },
      { to: '/admin/tasks', label: 'Weekly Tasks', icon: CheckSquare },
      { to: '/mentor/mocks', label: 'Weekly Mocks', icon: CalendarCheck },
      { to: '/admin/reviews', label: 'Task Reviews', icon: FileCheck },
      { to: '/admin/complaints', label: 'Grievance Desk', icon: MessageSquareWarning },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/admin/reports', label: 'Reports & CSV', icon: FileSpreadsheet },
      { to: '/admin/profile', label: 'Admin Profile', icon: User }
    ];
  } else if (role === 'TRAINER') {
    links = [
      { to: '/trainer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/trainer/students', label: 'Batch Students', icon: Users },
      { to: '/trainer/targets', label: 'Weekly Targets (W1-W12)', icon: Target },
      { to: '/trainer/calendar', label: 'Training Calendar', icon: Calendar },
      { to: '/trainer/problems', label: 'Daily Problems (POTD)', icon: Zap },
      { to: '/trainer/tasks', label: 'Weekly Tasks', icon: CheckSquare },
      { to: '/trainer/reviews', label: 'Review Submissions', icon: FileCheck },
      { to: '/trainer/batches', label: 'Batches', icon: FolderGit2 },
      { to: '/trainer/profile', label: 'Trainer Profile', icon: User }
    ];
  } else if (role === 'MENTOR') {
    links = [
      { to: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/mentor/mentees', label: 'My Mentees', icon: Users },
      { to: '/mentor/targets', label: 'Weekly Targets (W1-W12)', icon: Target },
      { to: '/mentor/training-calendar', label: 'Training Calendar', icon: Calendar },
      { to: '/mentor/problems', label: 'Daily Problems (POTD)', icon: Zap },
      { to: '/mentor/mocks', label: 'Weekly Mocks', icon: CalendarCheck },
      { to: '/mentor/doubt-sessions', label: 'Doubt Sessions', icon: BookOpen },
      { to: '/mentor/reviews', label: 'Review Submissions', icon: FileCheck },
      { to: '/mentor/tasks', label: 'Weekly Tasks', icon: CheckSquare },
      { to: '/mentor/complaints', label: 'Grievance Desk', icon: MessageSquareWarning },
      { to: '/mentor/batches', label: 'Batches', icon: FolderGit2 },
      { to: '/mentor/analytics', label: 'Analytics & At-Risk', icon: TrendingUp },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/mentor/profile', label: 'Mentor Profile', icon: User }
    ];
  } else if (role === 'MENTEE') {
    links = [
      { to: '/mentee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/mentee/targets', label: 'Weekly Targets (W1-W12)', icon: Target },
      { to: '/mentee/daily-problems', label: 'Daily Problems (POTD)', icon: Zap },
      { to: '/mentee/training-calendar', label: 'Training Calendar', icon: Calendar },
      { to: '/mentee/mocks', label: 'Weekly Mocks', icon: CalendarCheck },
      { to: '/mentee/tasks', label: 'Weekly Tasks', icon: CheckSquare },
      { to: '/mentee/doubt-sessions', label: 'Ask Doubts / 1-on-1', icon: BookOpen },
      { to: '/mentee/complaints', label: 'Grievance Box', icon: MessageSquareWarning },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/mentee/achievements', label: 'Achievements & Rank', icon: Trophy },
      { to: '/mentee/profile', label: 'Profile & Coding Links', icon: User }
    ];
  }

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0 transition-colors duration-200">
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Navigation
          </div>
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer & Backdrop */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onCloseMobileMenu}
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-950/95 border-r border-slate-200 dark:border-slate-800 backdrop-blur-xl p-4 flex flex-col justify-between transform transition-transform duration-300 ease-in-out shadow-2xl ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="h-8 px-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <img src="/sru-mark.png" alt="SRU" className="h-4 w-auto object-contain" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">SRU MentorHub</span>
                  <span className="ml-1.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-500/20">
                    {role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobileMenu}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                Navigation
              </div>
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* User Card & Theme Switcher at Drawer Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 transition"
            >
              <span className="flex items-center gap-2">
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {theme}
              </span>
            </button>

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
