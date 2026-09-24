import { useEffect, useState } from 'react'
import { BookOpen, ClipboardCheck, LogOut, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/useAuth'

function getErrorMessage(error) {
  return error.response?.data?.message || 'Unable to load your assignments. Please try again.'
}

export default function FacultyDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const { data } = await api.get('/assignments')
        setAssignments(data.assignments || [])
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return <main className="faculty-page">
    <header className="faculty-header"><div><p className="panel-kicker">Faculty workspace</p><h1>Welcome, {user?.name?.split(' ')[0] || 'Faculty'}.</h1><p>Subjects and sections assigned to you.</p></div><div className="faculty-header-actions"><button className="secondary-action" type="button" onClick={() => navigate('/ai/attendance-assistant')}>AI assistant</button><button className="secondary-action" type="button" onClick={() => navigate('/faculty/attendance/history')}>Attendance history</button><button className="primary-action" type="button" onClick={() => navigate('/faculty/attendance')}><ClipboardCheck size={16} /> Take attendance</button><button className="logout-button" type="button" onClick={handleLogout}><LogOut size={15} /> Log out</button></div></header>
    <section className="faculty-summary"><div><BookOpen size={18} /><span><strong>{assignments.length}</strong> assigned subjects</span></div><div><Users size={18} /><span><strong>{new Set(assignments.map((assignment) => assignment.section?._id)).size}</strong> sections</span></div></section>
    <section className="faculty-assignment-card">
      {loading ? <div className="students-state"><div className="loading-spinner" /><p>Loading assignments...</p></div> : error ? <div className="students-state"><h2>Could not load assignments</h2><p>{error}</p></div> : assignments.length === 0 ? <div className="students-state"><h2>No assignments yet</h2><p>Your assigned subjects and sections will appear here.</p></div> : <div className="students-table-wrap"><table><thead><tr><th>Subject</th><th>Section</th><th>Department</th><th>Semester</th><th>Academic year</th></tr></thead><tbody>{assignments.map((assignment) => { const department = assignment.subject?.department || assignment.section?.department; return <tr key={assignment._id}><td><div className="student-identity"><span className="student-avatar subject-avatar">{(assignment.subject?.code || 'SU').slice(0, 2)}</span><div><strong>{assignment.subject?.name || 'Subject'}</strong><small>{assignment.subject?.code || 'No code'}</small></div></div></td><td>{assignment.section?.name || 'Section'}</td><td>{department?.code || department?.name || 'Department'}</td><td><span className="semester-pill">Sem {assignment.semester}</span></td><td>{assignment.academicYear}</td></tr> })}</tbody></table></div>}
    </section>
  </main>
}
