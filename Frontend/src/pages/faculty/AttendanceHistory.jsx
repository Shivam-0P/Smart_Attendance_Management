import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AttendanceHistoryTable from '../../components/AttendanceHistoryTable.jsx'

function getErrorMessage(error) { return error.response?.data?.message || 'Unable to load attendance history.' }

export default function AttendanceHistory() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [assignments, setAssignments] = useState([])
  const [filters, setFilters] = useState({ subject: '', section: '', date: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingRecord, setEditingRecord] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { Promise.resolve().then(async () => { try { const { data } = await api.get('/assignments'); setAssignments(data.assignments || []) } catch (requestError) { setError(getErrorMessage(requestError)); setLoading(false) } }) }, [])
  useEffect(() => { Promise.resolve().then(async () => { setLoading(true); setError(''); try { const { data } = await api.get('/attendance/history', { params: { subject: filters.subject, section: filters.section, date: filters.date } }); setRecords(data.records || []) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setLoading(false) } }) }, [filters.subject, filters.section, filters.date])

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }))
  const openCorrection = (record) => { setEditingRecord(record); setNewStatus(record.status === 'present' ? 'absent' : 'present'); setReason(''); setError('') }
  const submitCorrection = async (event) => {
    event.preventDefault()
    if (!reason.trim()) return setError('A reason is required to correct attendance.')
    setSaving(true); setError('')
    try { const { data } = await api.put(`/attendance/${editingRecord._id}`, { status: newStatus, reason }); setRecords((current) => current.map((record) => record._id === editingRecord._id ? data.attendance : record)); setEditingRecord(null) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setSaving(false) }
  }
  const subjects = assignments.reduce((result, item) => result.some((subject) => subject._id === item.subject?._id) ? result : [...result, item.subject], [])
  const sections = assignments.reduce((result, item) => result.some((section) => section._id === item.section?._id) ? result : [...result, item.section], [])

  return <main className="faculty-page history-page"><header className="faculty-header"><div><button className="back-button" type="button" onClick={() => navigate('/faculty/dashboard')}><ArrowLeft size={17} /> Faculty workspace</button><p className="panel-kicker">Faculty workspace</p><h1>Attendance history</h1><p>Review records for your assigned subjects and sections.</p></div><button className="secondary-action" type="button" onClick={() => navigate('/faculty/attendance/audit')}>View audit trail</button></header><section className="history-toolbar"><select className="filter-select" value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)} aria-label="Filter by subject"><option value="">All assigned subjects</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.code}</option>)}</select><select className="filter-select" value={filters.section} onChange={(event) => updateFilter('section', event.target.value)} aria-label="Filter by section"><option value="">All assigned sections</option>{sections.map((section) => <option key={section._id} value={section._id}>{section.name}</option>)}</select><input className="history-date-filter" type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} aria-label="Filter by date" /></section><section className="students-table-card"><AttendanceHistoryTable records={records} loading={loading} error={error} editable onEdit={openCorrection} emptyMessage="No records exist for your assigned classes and selected filters." /></section>{editingRecord && <div className="student-modal-backdrop"><section className="student-modal" role="dialog" aria-modal="true"><div className="modal-heading"><div><p className="panel-kicker">Audit required</p><h2>Correct attendance</h2></div><button className="modal-close" type="button" onClick={() => setEditingRecord(null)} aria-label="Close"><span>×</span></button></div><form onSubmit={submitCorrection}><p className="correction-current">Current status: <strong>{editingRecord.status}</strong></p><div className="student-field"><label htmlFor="correctionStatus">New status</label><select id="correctionStatus" value={newStatus} onChange={(event) => setNewStatus(event.target.value)}><option value="present">Present</option><option value="absent">Absent</option></select></div><div className="student-field correction-reason"><label htmlFor="correctionReason">Reason</label><textarea id="correctionReason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this attendance is being corrected" minLength="3" required /></div>{error && <p className="student-error" role="alert">{error}</p>}<div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setEditingRecord(null)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save correction'}</button></div></form></section></div>}</main>
}
