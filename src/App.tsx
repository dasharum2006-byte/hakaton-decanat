import type { ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { AppShell } from './components/AppShell'
import { Backdrop } from './components/Backdrop'
import { Login } from './pages/Login'
import { Demo } from './pages/Demo'
import { Dashboard } from './pages/Dashboard'
import { Schedule } from './pages/Schedule'
import { Grades } from './pages/Grades'
import { GradeDetail } from './pages/GradeDetail'
import { Teacher } from './pages/Teacher'
import { Deadlines } from './pages/Deadlines'
import { Requests } from './pages/Requests'
import { RequestNew } from './pages/RequestNew'
import { RequestDetail } from './pages/RequestDetail'
import { Notifications } from './pages/Notifications'
import { Profile } from './pages/Profile'
import { StaffDashboard } from './pages/Staff'
import { AssistantPage } from './pages/AssistantPage'
import { Campus } from './pages/Campus'
import { TeacherCabinet } from './pages/TeacherCabinet'
import { TeacherSchedule } from './pages/TeacherSchedule'
import { TeacherMessages } from './pages/TeacherMessages'
import { StudentMessages } from './pages/StudentMessages'
import { NotFound } from './pages/NotFound'

function RequireAuth() {
  const { account } = useAuth()
  if (!account) return <Navigate to="/" replace />
  return <Outlet />
}

/** Домашняя страница кабинета по роли пользователя */
function homePath(role: 'student' | 'staff' | 'teacher') {
  return role === 'staff' ? '/staff' : role === 'teacher' ? '/teacher' : '/home'
}

function StudentOnly({ children }: { children: ReactNode }) {
  const { account, student } = useAuth()
  if (!account) return <Navigate to="/" replace />
  if (account.role !== 'student' || !student) return <Navigate to={homePath(account.role)} replace />
  return <>{children}</>
}

function StaffOnly({ children }: { children: ReactNode }) {
  const { account } = useAuth()
  if (!account) return <Navigate to="/" replace />
  if (account.role !== 'staff') return <Navigate to={homePath(account.role)} replace />
  return <>{children}</>
}

function TeacherOnly({ children }: { children: ReactNode }) {
  const { account } = useAuth()
  if (!account) return <Navigate to="/" replace />
  if (account.role !== 'teacher') return <Navigate to={homePath(account.role)} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Backdrop />
      <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/demo" element={<Demo />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route
            path="/home"
            element={
              <StudentOnly>
                <Dashboard />
              </StudentOnly>
            }
          />
          <Route
            path="/schedule"
            element={
              <StudentOnly>
                <Schedule />
              </StudentOnly>
            }
          />
          <Route
            path="/grades"
            element={
              <StudentOnly>
                <Grades />
              </StudentOnly>
            }
          />
          <Route
            path="/grades/:id"
            element={
              <StudentOnly>
                <GradeDetail />
              </StudentOnly>
            }
          />
          <Route
            path="/grades/:id/teacher"
            element={
              <StudentOnly>
                <Teacher />
              </StudentOnly>
            }
          />
          <Route path="/campus" element={<Campus />} />
          <Route
            path="/deadlines"
            element={
              <StudentOnly>
                <Deadlines />
              </StudentOnly>
            }
          />
          <Route
            path="/requests"
            element={
              <StudentOnly>
                <Requests />
              </StudentOnly>
            }
          />
          <Route
            path="/requests/new"
            element={
              <StudentOnly>
                <RequestNew />
              </StudentOnly>
            }
          />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route
            path="/messages"
            element={
              <StudentOnly>
                <StudentMessages />
              </StudentOnly>
            }
          />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/assistant"
            element={
              <StudentOnly>
                <AssistantPage />
              </StudentOnly>
            }
          />
          <Route
            path="/teacher"
            element={
              <TeacherOnly>
                <TeacherCabinet />
              </TeacherOnly>
            }
          />
          <Route
            path="/teacher/schedule"
            element={
              <TeacherOnly>
                <TeacherSchedule />
              </TeacherOnly>
            }
          />
          <Route
            path="/teacher/messages"
            element={
              <TeacherOnly>
                <TeacherMessages />
              </TeacherOnly>
            }
          />
          <Route
            path="/staff"
            element={
              <StaffOnly>
                <StaffDashboard />
              </StaffOnly>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
