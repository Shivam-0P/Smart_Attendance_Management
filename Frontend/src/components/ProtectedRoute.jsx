import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const dashboardByRole = {
  admin: '/admin/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard',
}

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()
  const token = localStorage.getItem('attendance_token')
  const validRoles = ['admin', 'faculty', 'student']

  if (!token || !user || !validRoles.includes(user.role)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardByRole[user.role] || '/login'} replace />
  }

  return <Outlet />
}