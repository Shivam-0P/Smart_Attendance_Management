import { CalendarDays } from 'lucide-react'

export default function AttendanceAuditTable({ audits, loading, error }) {
  if (loading) return <div className="students-state"><div className="loading-spinner" /><p>Loading audit trail...</p></div>
  if (error) return <div className="students-state"><h2>Could not load audit trail</h2><p>{error}</p></div>
  if (!audits.length) return <div className="students-state"><CalendarDays size={24} /><h2>No corrections recorded</h2><p>Attendance changes will appear here with their reasons.</p></div>
  return <div className="students-table-wrap"><table><thead><tr><th>Student</th><th>Status change</th><th>Changed by</th><th>Reason</th><th>Date/time</th></tr></thead><tbody>{audits.map((audit) => { const student = audit.attendanceId?.student; const user = student?.userId || {}; return <tr key={audit._id}><td><div className="student-identity"><span className="student-avatar">{(user.name || student?.rollNumber || 'ST').slice(0, 2).toUpperCase()}</span><div><strong>{user.name || 'Student'}</strong><small>{student?.rollNumber || 'No roll number'}</small></div></div></td><td><span className="audit-change"><b className={audit.oldStatus}>{audit.oldStatus}</b><span>→</span><b className={audit.newStatus}>{audit.newStatus}</b></span></td><td>{audit.changedBy?.name || audit.changedBy?.email || 'User'}</td><td className="audit-reason">{audit.reason}</td><td>{new Date(audit.changedAt).toLocaleString()}</td></tr> })}</tbody></table></div>
}
