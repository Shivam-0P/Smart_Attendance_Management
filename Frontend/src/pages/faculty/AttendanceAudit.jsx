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
  return <main className="faculty-page history-page"><header className="faculty-header"><div><button className="back-button" type="button" onClick={() => navigate('/faculty/attendance/history')}><ArrowLeft size={17} /> Attendance history</button><p className="panel-kicker">Faculty workspace</p><h1>Attendance audit trail</h1><p>Every correction includes the original status and reason.</p></div></header><section className="students-table-card"><AttendanceAuditTable audits={audits} loading={loading} error={error} /></section></main>
}
