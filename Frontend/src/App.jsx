import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminAttendance from './pages/admin/Attendance.jsx'
import AdminAttendanceAudit from './pages/admin/AttendanceAudit.jsx'
import Reports from './pages/admin/Reports.jsx'
import Departments from './pages/admin/Departments.jsx'
import Faculty from './pages/admin/Faculty.jsx'
import Assignments from './pages/admin/Assignments.jsx'
import Sections from './pages/admin/Sections.jsx'
import Students from './pages/admin/Students.jsx'
import Subjects from './pages/admin/Subjects.jsx'
import FacultyDashboard from './pages/faculty/Dashboard.jsx'
import FacultyAttendanceHistory from './pages/faculty/AttendanceHistory.jsx'
import FacultyAttendanceAudit from './pages/faculty/AttendanceAudit.jsx'
import TakeAttendance from './pages/faculty/TakeAttendance.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentAttendanceHistory from './pages/student/AttendanceHistory.jsx'
import AttendanceAssistant from './pages/AI/AttendanceAssistant.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'student']} />}>
        <Route path="/ai/attendance-assistant" element={<AttendanceAssistant />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<Students />} />
        <Route path="/admin/departments" element={<Departments />} />
        <Route path="/admin/faculty" element={<Faculty />} />
        <Route path="/admin/sections" element={<Sections />} />
        <Route path="/admin/subjects" element={<Subjects />} />
        <Route path="/admin/assignments" element={<Assignments />} />
        <Route path="/admin/attendance" element={<AdminAttendance />} />
        <Route path="/admin/attendance/audit" element={<AdminAttendanceAudit />} />
        <Route path="/admin/reports" element={<Reports />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty/attendance" element={<TakeAttendance />} />
        <Route path="/faculty/attendance/history" element={<FacultyAttendanceHistory />} />
        <Route path="/faculty/attendance/audit" element={<FacultyAttendanceAudit />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/attendance/history" element={<StudentAttendanceHistory />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
