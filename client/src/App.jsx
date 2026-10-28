import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

// Auth
import { Login } from './pages/auth/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminBatches } from './pages/admin/Batches';
import { AdminReports } from './pages/admin/Reports';
import { BulkImport } from './pages/admin/BulkImport';
import { AdminProfilePage } from './pages/admin/Profile';

// Mentor Pages
import { MentorDashboard } from './pages/mentor/Dashboard';
import { MentorMentees } from './pages/mentor/Mentees';
import { MentorMenteeProfile } from './pages/mentor/MenteeProfile';
import { MentorTasks } from './pages/mentor/Tasks';
import { CreateTask } from './pages/mentor/CreateTask';
import { MentorTaskReviews } from './pages/mentor/TaskReviews';
import { ReviewDetails } from './pages/mentor/ReviewDetails';
import { MentorBatches } from './pages/mentor/Batches';
import { MentorAnalytics } from './pages/mentor/Analytics';
import { WeeklyMocks } from './pages/mentor/WeeklyMocks';
import { MockSectionDetails } from './pages/mentor/MockSectionDetails';
import { MentorProfilePage } from './pages/mentor/Profile';

// Mentee Pages
import { MenteeDashboard } from './pages/mentee/Dashboard';
import { MenteeTasks } from './pages/mentee/Tasks';
import { MenteeTaskDetails } from './pages/mentee/TaskDetails';
import { CompletedTasks } from './pages/mentee/CompletedTasks';
import { MenteeProfilePage } from './pages/mentee/Profile';
import { MenteeAchievements } from './pages/mentee/Achievements';
import { MenteeWeeklyMocks } from './pages/mentee/WeeklyMocks';
import { MenteeDailyProblems } from './pages/mentee/DailyProblems';

// Trainer Pages
import { TrainerDashboard } from './pages/trainer/Dashboard';
import { TrainingCalendar } from './pages/trainer/TrainingCalendar';
import { DailyProblems } from './pages/trainer/DailyProblems';
import { TrainerStudents } from './pages/trainer/Students';
import { TrainerTasks } from './pages/trainer/Tasks';
import { TrainerProfilePage } from './pages/trainer/Profile';

// Common Pages
import { Complaints } from './pages/common/Complaints';
import { DoubtSessions } from './pages/common/DoubtSessions';
import { Announcements } from './pages/common/Announcements';
import { WeeklyTargets } from './pages/common/WeeklyTargets';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'MENTOR') return <Navigate to="/mentor/dashboard" replace />;
    if (user.role === 'TRAINER') return <Navigate to="/trainer/dashboard" replace />;
    return <Navigate to="/mentee/dashboard" replace />;
  }

  return children;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            user?.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === 'MENTOR' ? (
              <Navigate to="/mentor/dashboard" replace />
            ) : user?.role === 'TRAINER' ? (
              <Navigate to="/trainer/dashboard" replace />
            ) : (
              <Navigate to="/mentee/dashboard" replace />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/mentees/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MentorMenteeProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/batches"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminBatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/training-calendar"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TrainingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/tasks"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MentorTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/tasks/create"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CreateTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reviews"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MentorTaskReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reviews/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']}>
              <ReviewDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/bulk-import"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <BulkImport />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/profile"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/mentors/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MentorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/complaints"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Complaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/targets"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <WeeklyTargets />
            </ProtectedRoute>
          }
        />

        {/* Mentor Routes */}
        <Route
          path="mentor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/mentees"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorMentees />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/mentees/:id"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorMenteeProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/tasks"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/tasks/create"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <CreateTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/reviews"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorTaskReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/reviews/:id"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <ReviewDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/batches"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorBatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/analytics"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/mocks"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <WeeklyMocks />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/training-calendar"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <TrainingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/problems"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <DailyProblems />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/mocks/:id"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MockSectionDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/profile"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <MentorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/complaints"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <Complaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/doubt-sessions"
          element={
            <ProtectedRoute allowedRoles={['MENTOR']}>
              <DoubtSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentor/targets"
          element={
            <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
              <WeeklyTargets />
            </ProtectedRoute>
          }
        />

        {/* Trainer Routes — Reusing finalized components */}
        <Route
          path="trainer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/calendar"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <TrainingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/training-calendar"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <TrainingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/problems"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <DailyProblems />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/students"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <MentorMentees />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/students/:id"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <MentorMenteeProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/tasks"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <MentorTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/tasks/create"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <CreateTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/reviews"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <MentorTaskReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/reviews/:id"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <ReviewDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/batches"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <MentorBatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/profile"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <TrainerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer/targets"
          element={
            <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
              <WeeklyTargets />
            </ProtectedRoute>
          }
        />

        {/* Announcements — accessible by admin, mentor, mentee */}
        <Route
          path="announcements"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR', 'MENTEE']}>
              <Announcements />
            </ProtectedRoute>
          }
        />

        {/* Mentee Routes */}
        <Route
          path="mentee/dashboard"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <MenteeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/daily-problems"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <MenteeDailyProblems />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/tasks"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <MenteeTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/tasks/:id"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <MenteeTaskDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/tasks/completed"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <CompletedTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/profile"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <MenteeProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/achievements"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <MenteeAchievements />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/mocks"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <MenteeWeeklyMocks />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/training-calendar"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <TrainingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="training-calendar"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TRAINER', 'MENTOR', 'MENTEE']}>
              <TrainingCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/complaints"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <Complaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/doubt-sessions"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <DoubtSessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="mentee/targets"
          element={
            <ProtectedRoute allowedRoles={['MENTEE']}>
              <WeeklyTargets />
            </ProtectedRoute>
          }
        />
        <Route
          path="weekly-targets"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TRAINER', 'MENTOR', 'MENTEE']}>
              <WeeklyTargets />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
