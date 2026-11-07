import type { ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { AppShell } from './components/AppShell'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Demo } from './pages/Demo'
import { Dashboard } from './pages/Dashboard'
import { Schedule } from './pages/Schedule'
import { Grades } from './pages/Grades'
import { Requests } from './pages/Requests'
import { RequestNew } from './pages/RequestNew'
import { RequestDetail } from './pages/RequestDetail'
import { Notifications } from './pages/Notifications'
import { Profile } from './pages/Profile'
import { StaffDashboard } from './pages/Staff'
import { AssistantPage } from './pages/AssistantPage'
import { NotFound } from './pages/NotFound'

function RequireAuth() {
  const { account } = useAuth()
  if (!account) return <Navigate to="/login" replace />
  return <Outlet />
}

function StudentOnly({ children }: { children: ReactNode }) {
  const { account, student } = useAuth()
  if (!account) return <Navigate to="/login" replace />
  if (account.role !== 'student' || !student) return <Navigate to="/staff" replace />
  return <>{children}</>
}

function StaffOnly({ children }: { children: ReactNode }) {
  const { account } = useAuth()
  if (!account) return <Navigate to="/login" replace />
  if (account.role !== 'staff') return <Navigate to="/home" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
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
  )
}
