import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

function getErrorMessage(error) { return error.response?.data?.message || 'Unable to load the low attendance report.' }

export default function Reports() {
  const navigate = useNavigate()
  const [report, setReport] = useState([])
  const [departments, setDepartments] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({ department: '', section: '', semester: '', subject: '' })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aiReport, setAiReport] = useState('')
  const [aiStatistics, setAiStatistics] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState(false)

  const loadReport = async () => {
    setLoading(true); setError('')
    try { const { data } = await api.get('/reports/low-attendance', { params: filters }); setReport(data.report || []) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setLoading(false) }
  }

  useEffect(() => { Promise.resolve().then(async () => { try { const [departmentResponse, sectionResponse, subjectResponse] = await Promise.all([api.get('/departments'), api.get('/sections'), api.get('/subjects')]); setDepartments(departmentResponse.data.departments || []); setSections(sectionResponse.data.sections || []); setSubjects(subjectResponse.data.subjects || []) } catch (requestError) { setError(getErrorMessage(requestError)); setLoading(false) } }) }, [])
  useEffect(() => { Promise.resolve().then(async () => { setLoading(true); setError(''); try { const { data } = await api.get('/reports/low-attendance', { params: { department: filters.department, section: filters.section, semester: filters.semester, subject: filters.subject } }); setReport(data.report || []) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setLoading(false) } }) }, [filters.department, filters.section, filters.semester, filters.subject])

  const filteredReport = useMemo(() => report.filter((item) => `${item.studentName} ${item.rollNumber} ${item.department} ${item.section} ${item.subject}`.toLowerCase().includes(search.trim().toLowerCase())), [report, search])
  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }))
  const generateAIReport = async () => {
    setAiLoading(true); setAiError(''); setAiSuccess(false)
    try { const { data } = await api.post('/ai/generate-report'); setAiReport(data.report || ''); setAiStatistics(data.statistics || null); setAiSuccess(true) } catch (requestError) { setAiError(requestError.response?.data?.message || 'Unable to generate AI report.') } finally { setAiLoading(false) }
  }

  return <main className="students-page history-page reports-page"><header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Analytics</p><h1>Low attendance report</h1><p>Students below the default attendance threshold of 75%.</p></div><button className="primary-action" type="button" onClick={generateAIReport} disabled={aiLoading}><Sparkles size={16} />{aiLoading ? 'Generating...' : 'Generate AI Report'}</button></header><section className="report-summary"><div><AlertTriangle size={18} /><span><strong>{filteredReport.length}</strong> records below threshold</span></div><span>Threshold: <strong>75%</strong></span></section><section className="report-toolbar"><label className="search-box"><Search size={17} /><input type="search" placeholder="Search students or subjects..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="filter-select" value={filters.department} onChange={(event) => updateFilter('department', event.target.value)} aria-label="Filter by department"><option value="">All departments</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.code}</option>)}</select><select className="filter-select" value={filters.section} onChange={(event) => updateFilter('section', event.target.value)} aria-label="Filter by section"><option value="">All sections</option>{sections.map((section) => <option key={section._id} value={section._id}>{section.name}</option>)}</select><select className="filter-select" value={filters.semester} onChange={(event) => updateFilter('semester', event.target.value)} aria-label="Filter by semester"><option value="">All semesters</option>{Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}</select><select className="filter-select" value={filters.subject} onChange={(event) => updateFilter('subject', event.target.value)} aria-label="Filter by subject"><option value="">All subjects</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.code}</option>)}</select></section>{error && <div className="students-alert" role="alert">{error}<button type="button" onClick={loadReport}>Retry</button></div>}{aiError && <div className="students-alert ai-report-error" role="alert">{aiError}</div>}{aiSuccess && <div className="ai-report-success" role="status"><Sparkles size={16} /> AI report generated from current backend statistics.</div>}{aiReport && <section className="ai-report-result"><div className="ai-report-facts"><div className="panel-heading"><div><p className="panel-kicker">Database facts</p><h2>Authoritative statistics</h2></div></div><div className="ai-facts-grid"><span><strong>{aiStatistics?.totalStudents ?? '-'}</strong>Total students</span><span><strong>{aiStatistics?.averageAttendance ?? '-'}%</strong>Average attendance</span><span><strong>{aiStatistics?.studentsBelow75 ?? '-'}</strong>Below 75%</span><span><strong>{aiStatistics?.present ?? '-'}</strong>Present records</span><span><strong>{aiStatistics?.absent ?? '-'}</strong>Absent records</span></div></div><div className="ai-report-explanation"><div className="panel-heading"><div><p className="panel-kicker">AI-generated explanation</p><h2>Administrative report</h2></div><Sparkles size={18} /></div><p>{aiReport}</p></div></section>}<section className="students-table-card">{loading ? <div className="students-state"><div className="loading-spinner" /><p>Calculating attendance report...</p></div> : filteredReport.length === 0 ? <div className="students-state"><AlertTriangle size={24} /><h2>No low attendance records</h2><p>No students match the selected filters or fall below 75%.</p></div> : <div className="students-table-wrap"><table><thead><tr><th>Student</th><th>Department</th><th>Section</th><th>Subject</th><th>Present</th><th>Total</th><th>Percentage</th></tr></thead><tbody>{filteredReport.map((item, index) => <tr key={`${item.rollNumber}-${item.subject}-${index}`}><td><div className="student-identity"><span className="student-avatar report-avatar">{item.studentName.slice(0, 2).toUpperCase()}</span><div><strong>{item.studentName}</strong><small>{item.rollNumber}</small></div></div></td><td>{item.department}</td><td>{item.section}</td><td><span className="roll-number">{item.subject}</span></td><td>{item.present}</td><td>{item.total}</td><td><span className="report-percentage"><AlertTriangle size={13} />{Number(item.percentage).toFixed(2)}%</span></td></tr>)}</tbody></table></div>}</section></main>
}
