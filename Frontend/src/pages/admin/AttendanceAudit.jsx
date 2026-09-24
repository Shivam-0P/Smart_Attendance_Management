import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import AttendanceAuditTable from '../../components/AttendanceAuditTable.jsx'

export default function AttendanceAudit() {
  const navigate = useNavigate()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { Promise.resolve().then(async () => { try { const { data } = await api.get('/attendance/audit'); setAudits(data.audits || []) } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load audit trail.') } finally { setLoading(false) } }) }, [])
  return <main className="students-page history-page"><header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/attendance')}><ArrowLeft size={17} /> Attendance records</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Attendance audit trail</h1><p>Review every attendance correction and its reason.</p></div></header><section className="students-table-card"><AttendanceAuditTable audits={audits} loading={loading} error={error} /></section></main>
}
