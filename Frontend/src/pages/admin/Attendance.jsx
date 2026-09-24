import { useEffect, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AttendanceHistoryTable from '../../components/AttendanceHistoryTable.jsx'

function getErrorMessage(error) { return error.response?.data?.message || 'Unable to load attendance history.' }

export default function Attendance() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [subjects, setSubjects] = useState([])
  const [sections, setSections] = useState([])
  const [filters, setFilters] = useState({ subject: '', section: '', date: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { Promise.resolve().then(async () => { try { const [subjectResponse, sectionResponse] = await Promise.all([api.get('/subjects'), api.get('/sections')]); setSubjects(subjectResponse.data.subjects || []); setSections(sectionResponse.data.sections || []) } catch (requestError) { setError(getErrorMessage(requestError)) } }) }, [])
  useEffect(() => { Promise.resolve().then(async () => { setLoading(true); setError(''); try { const { data } = await api.get('/attendance/history', { params: { subject: filters.subject, section: filters.section, date: filters.date } }); setRecords(data.records || []) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setLoading(false) } }) }, [filters.subject, filters.section, filters.date])

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }))
  return <main className="students-page history-page"><header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Attendance history</h1><p>Review attendance records across the institution.</p></div><button className="secondary-action" type="button" onClick={() => navigate('/admin/attendance/audit')}>View audit trail</button></header><section className="history-toolbar"><label className="search-box"><Search size={17} /><span className="history-search-label">Filters</span></label><select className="filter-select" value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)} aria-label="Filter by subject"><option value="">All subjects</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.code}</option>)}</select><select className="filter-select" value={filters.section} onChange={(event) => updateFilter('section', event.target.value)} aria-label="Filter by section"><option value="">All sections</option>{sections.map((section) => <option key={section._id} value={section._id}>{section.name}</option>)}</select><input className="history-date-filter" type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} aria-label="Filter by date" /></section><section className="students-table-card"><AttendanceHistoryTable records={records} loading={loading} error={error} emptyMessage="There are no records matching the selected filters." /></section></main>
}
