import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AttendanceHistoryTable from '../../components/AttendanceHistoryTable.jsx'

function getErrorMessage(error) { return error.response?.data?.message || 'Unable to load your attendance history.' }

export default function AttendanceHistory() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { Promise.resolve().then(async () => { try { const { data } = await api.get('/attendance/history'); setRecords(data.records || []) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setLoading(false) } }) }, [])

  const subjects = useMemo(() => records.reduce((result, item) => result.some((value) => value._id === item.subject?._id) ? result : [...result, item.subject], []), [records])
  const filteredRecords = useMemo(() => records.filter((record) => (!subject || record.subject?._id === subject) && (!date || record.date?.slice(0, 10) === date)), [records, subject, date])

  return <main className="student-dashboard-page history-page"><header className="student-dashboard-header"><div><button className="back-button" type="button" onClick={() => navigate('/student/dashboard')}><ArrowLeft size={17} /> Student dashboard</button><p className="panel-kicker">Student portal</p><h1>Attendance history</h1><p>Review only your own attendance records.</p></div></header><section className="history-toolbar"><select className="filter-select" value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Filter by subject"><option value="">All subjects</option>{subjects.map((item) => <option key={item._id} value={item._id}>{item.code} - {item.name}</option>)}</select><input className="history-date-filter" type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filter by date" /></section><section className="students-table-card"><AttendanceHistoryTable records={filteredRecords} loading={loading} error={error} emptyMessage="No personal attendance records match the selected filters." /></section></main>
}
