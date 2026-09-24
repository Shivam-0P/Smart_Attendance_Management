import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, CalendarCheck2, LogOut, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/useAuth'

const calculateSummary = (records) => {
  const totalClasses = records.length
  const present = records.filter((record) => record.status === 'present').length
  const absent = records.filter((record) => record.status === 'absent').length
  const percentage = totalClasses === 0 ? '0.00' : ((present / totalClasses) * 100).toFixed(2)
  return { totalClasses, present, absent, percentage }
}

function getErrorMessage(error) {
  const message = error.response?.data?.message || 'Unable to load your attendance. Please try again.'

  if (message.includes('Student profile not found')) {
    return 'Your student profile has not been created yet. Please contact the administrator to set up your academic record.'
  }

  return message
}

function SummaryCard({ label, value, detail, tone, icon: Icon }) {
  return <article className={`student-summary-card ${tone}`}><div className="student-summary-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const { data: profile } = await api.get('/students/me')
        setStudent(profile.student)
        const { data } = await api.get(`/attendance/student/${profile.student._id}`)
        setAttendance(data.attendance || [])
      } catch (requestError) {
        setError(getErrorMessage(requestError))
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const overall = useMemo(() => calculateSummary(attendance), [attendance])
  const subjectSummaries = useMemo(() => {
    const grouped = attendance.reduce((result, record) => {
      const subjectId = record.subject?._id || record.subject
      if (!result[subjectId]) result[subjectId] = { subject: record.subject, records: [] }
      result[subjectId].records.push(record)
      return result
    }, {})
    return Object.values(grouped).map(({ subject, records }) => ({ subject, ...calculateSummary(records) })).sort((first, second) => Number(first.percentage) - Number(second.percentage))
  }, [attendance])
  const lowAttendance = subjectSummaries.filter((summary) => Number(summary.percentage) < 75)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) return <main className="student-dashboard-page"><div className="student-dashboard-state"><div className="loading-spinner" /><p>Loading your attendance...</p></div></main>
  if (error) return <main className="student-dashboard-page"><div className="student-dashboard-state"><div className="student-dashboard-error"><AlertTriangle size={19} /></div><h2>Could not load attendance</h2><p>{error}</p></div></main>

  return <main className="student-dashboard-page">
    <header className="student-dashboard-header"><div><p className="panel-kicker">Student portal</p><h1>Good morning, {student?.userId?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'student'}.</h1><p>Here is your attendance overview across all subjects.</p></div><div className="student-header-actions"><button className="secondary-action" type="button" onClick={() => navigate('/ai/attendance-assistant')}>AI assistant</button><button className="secondary-action" type="button" onClick={() => navigate('/student/attendance/history')}>Attendance history</button><button className="logout-button" type="button" onClick={handleLogout}><LogOut size={15} /> Log out</button></div></header>
    <section className="student-profile-strip"><div className="profile-avatar student-profile-avatar">{(student?.userId?.name || user?.name || 'ST').slice(0, 2).toUpperCase()}</div><div><strong>{student?.userId?.name || user?.name || 'Student'}</strong><span>{student?.rollNumber || 'Student'} {student?.department?.code ? `· ${student.department.code}` : ''} {student?.section ? `· Section ${student.section}` : ''}</span></div></section>
    <section className="student-summary-grid" aria-label="Attendance summary"><SummaryCard label="Overall attendance" value={`${overall.percentage}%`} detail="Across all subjects" tone="teal" icon={TrendingUp} /><SummaryCard label="Present classes" value={overall.present} detail={`${overall.totalClasses} total classes`} tone="green" icon={CalendarCheck2} /><SummaryCard label="Absent classes" value={overall.absent} detail="Keep building consistency" tone="rose" icon={AlertTriangle} /><SummaryCard label="Total classes" value={overall.totalClasses} detail="Recorded so far" tone="blue" icon={BookOpen} /></section>
    {lowAttendance.length > 0 && <section className="low-attendance-warning" role="alert"><AlertTriangle size={20} /><div><strong>Attention needed</strong><p>You are below the 75% attendance requirement in {lowAttendance.length} subject{lowAttendance.length === 1 ? '' : 's'}.</p></div><span>{lowAttendance.map((item) => item.subject?.code || item.subject?.name).join(', ')}</span></section>}
    <section className="subject-attendance-panel"><div className="subject-panel-heading"><div><p className="panel-kicker">Subject performance</p><h2>Subject-wise attendance</h2></div><span>{subjectSummaries.length} subject{subjectSummaries.length === 1 ? '' : 's'}</span></div>{subjectSummaries.length === 0 ? <div className="student-dashboard-empty"><BookOpen size={22} /><p>No attendance has been recorded yet.</p></div> : <div className="subject-attendance-list">{subjectSummaries.map((summary) => { const isLow = Number(summary.percentage) < 75; return <article className="subject-attendance-row" key={summary.subject?._id || summary.subject}><div className="subject-name"><span className={`subject-dot ${isLow ? 'low' : ''}`} /><div><strong>{summary.subject?.name || 'Subject'}</strong><small>{summary.subject?.code || 'No code'} · {summary.totalClasses} classes</small></div></div><div className="subject-progress"><div className="subject-progress-track"><span className={isLow ? 'low' : ''} style={{ width: `${Math.min(Number(summary.percentage), 100)}%` }} /></div><small>{summary.present} present · {summary.absent} absent</small></div><strong className={`subject-percentage ${isLow ? 'low' : ''}`}>{summary.percentage}%</strong>{isLow && <span className="low-label">Below 75%</span>}</article> })}</div>}</section>
  </main>
}
