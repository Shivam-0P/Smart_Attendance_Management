import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ClipboardCheck, RotateCcw, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

export default function TakeAttendance() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [date, setDate] = useState(today)
  const [students, setStudents] = useState([])
  const [statuses, setStatuses] = useState({})
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const assignment = assignments.find((item) => item._id === selectedAssignment)
  const presentCount = useMemo(() => Object.values(statuses).filter((status) => status === 'present').length, [statuses])

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const { data } = await api.get('/assignments')
        setAssignments(data.assignments || [])
      } catch (requestError) {
        setError(getErrorMessage(requestError, 'Unable to load assigned classes. Please try again.'))
      } finally {
        setLoadingAssignments(false)
      }
    })
  }, [])

  useEffect(() => {
    Promise.resolve().then(async () => {
      if (!assignment) {
        setStudents([])
        setStatuses({})
        return
      }

      setLoadingStudents(true)
      setError('')
      setSuccess('')
      try {
        const { data } = await api.get('/attendance/students', { params: { subject: assignment.subject._id, section: assignment.section._id } })
        setStudents(data.students || [])
        setStatuses(Object.fromEntries((data.students || []).map((student) => [student._id, 'present'])))
      } catch (requestError) {
        setStudents([])
        setStatuses({})
        setError(getErrorMessage(requestError, 'Unable to load students for this class.'))
      } finally {
        setLoadingStudents(false)
      }
    })
  }, [assignment])

  const markAll = (status) => setStatuses(Object.fromEntries(students.map((student) => [student._id, status])))
  const updateStatus = (studentId, status) => setStatuses((current) => ({ ...current, [studentId]: status }))

  const submitAttendance = async (event) => {
    event.preventDefault()
    if (!assignment || students.length === 0) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/attendance', {
        subject: assignment.subject._id,
        section: assignment.section._id,
        date,
        attendance: students.map((student) => ({ student: student._id, status: statuses[student._id] || 'absent' })),
      })
      setSuccess(`Attendance submitted for ${students.length} students.`)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to submit attendance. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return <main className="faculty-page attendance-page">
    <header className="faculty-header"><div><button className="back-button" type="button" onClick={() => navigate('/faculty/dashboard')}><ArrowLeft size={17} /> Faculty workspace</button><p className="panel-kicker">Daily attendance</p><h1>Take attendance</h1><p>Select one of your assigned classes and record today&apos;s attendance.</p></div></header>
    <form className="attendance-controls" onSubmit={submitAttendance}>
      <div className="attendance-select-field"><label htmlFor="attendanceClass">Assigned class</label><select id="attendanceClass" value={selectedAssignment} onChange={(event) => { setSelectedAssignment(event.target.value); setError(''); setSuccess('') }} disabled={loadingAssignments} required><option value="">{loadingAssignments ? 'Loading classes...' : 'Select a subject and section'}</option>{assignments.map((item) => <option key={item._id} value={item._id}>{item.subject?.code} - {item.subject?.name} / {item.section?.name}</option>)}</select></div>
      <div className="attendance-select-field"><label htmlFor="attendanceDate">Date</label><input id="attendanceDate" type="date" value={date} max={today()} onChange={(event) => { setDate(event.target.value); setSuccess('') }} required /></div>
    </form>
    {assignment && <div className="attendance-class-meta"><div><strong>{assignment.subject?.name}</strong><span>{assignment.subject?.code} · {assignment.section?.name}</span></div><span>{assignment.academicYear} · Semester {assignment.semester}</span></div>}
    {error && <div className="students-alert attendance-alert" role="alert">{error}<button type="button" onClick={() => setError('')}>Dismiss</button></div>}
    {success && <div className="attendance-success" role="status"><Check size={17} />{success}</div>}
    <section className="attendance-table-card">
      {!assignment ? <div className="students-state"><div className="empty-state-icon"><ClipboardCheck size={22} /></div><h2>Select an assigned class</h2><p>Only subjects and sections assigned to you are available.</p></div> : loadingStudents ? <div className="students-state"><div className="loading-spinner" /><p>Loading students...</p></div> : students.length === 0 ? <div className="students-state"><h2>No students in this section</h2><p>There are no students linked to the selected section.</p></div> : <div className="attendance-table-wrap"><div className="attendance-table-heading"><div><strong>{students.length} students</strong><span>{presentCount} marked present</span></div><div className="attendance-bulk-actions"><button type="button" onClick={() => markAll('present')}><Check size={14} /> Mark all present</button><button type="button" onClick={() => markAll('absent')}><RotateCcw size={14} /> Mark all absent</button></div></div><table><thead><tr><th>Roll number</th><th>Student name</th><th>Status</th></tr></thead><tbody>{students.map((student) => { const user = student.userId || {}; const status = statuses[student._id] || 'absent'; return <tr key={student._id}><td><span className="roll-number">{student.rollNumber}</span></td><td><div className="student-identity"><span className="student-avatar">{(user.name || 'ST').slice(0, 2).toUpperCase()}</span><div><strong>{user.name || 'Student'}</strong><small>{user.email || 'No email available'}</small></div></div></td><td><div className="status-control"><button className={status === 'present' ? 'selected-present' : ''} type="button" onClick={() => updateStatus(student._id, 'present')}><Check size={14} /> Present</button><button className={status === 'absent' ? 'selected-absent' : ''} type="button" onClick={() => updateStatus(student._id, 'absent')}>Absent</button></div></td></tr> })}</tbody></table><div className="attendance-submit-row"><span>Attendance is saved once for each student, subject, and date.</span><button className="primary-action" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : <><Save size={16} /> Submit attendance</>}</button></div></div>}
    </section>
  </main>
}
