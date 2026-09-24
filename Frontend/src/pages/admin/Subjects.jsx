import { useEffect, useState } from 'react'
import { ArrowLeft, Edit3, Plus, Search, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const emptyForm = { name: '', code: '', department: '', semester: '' }

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function SubjectForm({ subject, departments, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(subject || emptyForm)
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return <div className="student-modal-backdrop" role="presentation">
    <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="subject-form-title">
      <div className="modal-heading"><div><p className="panel-kicker">Academic structure</p><h2 id="subject-form-title">{subject ? 'Edit subject' : 'Add subject'}</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <div className="student-form-grid">
          <div className="student-field"><label htmlFor="subjectName">Subject name</label><input id="subjectName" value={form.name || ''} onChange={(event) => updateField('name', event.target.value)} placeholder="Data Structures" required /></div>
          <div className="student-field"><label htmlFor="subjectCode">Subject code</label><input id="subjectCode" value={form.code || ''} onChange={(event) => updateField('code', event.target.value.toUpperCase())} placeholder="CSE201" maxLength="15" required /></div>
          <div className="student-field"><label htmlFor="subjectDepartment">Department</label><select id="subjectDepartment" value={form.department?._id || form.department || ''} onChange={(event) => updateField('department', event.target.value)} required><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name} ({department.code})</option>)}</select></div>
          <div className="student-field"><label htmlFor="subjectSemester">Semester</label><select id="subjectSemester" value={form.semester || ''} onChange={(event) => updateField('semester', event.target.value)} required><option value="">Select semester</option>{Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}</select></div>
        </div>
        {error && <p className="student-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving...' : subject ? 'Save changes' : 'Add subject'}</button></div>
      </form>
    </section>
  </div>
}

export default function Subjects() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalSubject, setModalSubject] = useState(null)

  const loadSubjects = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/subjects')
      setSubjects(data.subjects || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load subjects. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const { data } = await api.get('/departments')
      setDepartments(data.departments || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load departments. Please try again.'))
    }
  }

  useEffect(() => { Promise.resolve().then(loadSubjects) }, [])
  useEffect(() => { Promise.resolve().then(loadDepartments) }, [])

  const saveSubject = async (form) => {
    setSaving(true)
    setFormError('')
    const payload = { ...form, department: form.department?._id || form.department, semester: Number(form.semester) }
    try {
      if (modalSubject?._id) await api.put(`/subjects/${modalSubject._id}`, payload)
      else await api.post('/subjects', payload)
      setModalSubject(null)
      await loadSubjects()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Unable to save subject. Please check the details.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteSubject = async (subject) => {
    if (!window.confirm(`Delete ${subject.name}?`)) return
    setError('')
    try {
      await api.delete(`/subjects/${subject._id}`)
      setSubjects((current) => current.filter((item) => item._id !== subject._id))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete subject. Please try again.'))
    }
  }

  const filteredSubjects = subjects.filter((subject) => {
    const department = typeof subject.department === 'object' ? subject.department : {}
    const searchValue = `${subject.name} ${subject.code} ${subject.semester} ${department.name || ''} ${department.code || ''}`.toLowerCase()
    const matchesDepartment = departmentFilter === 'all' || department._id === departmentFilter
    const matchesSemester = semesterFilter === 'all' || String(subject.semester) === semesterFilter
    return matchesDepartment && matchesSemester && searchValue.includes(search.trim().toLowerCase())
  })

  const openCreate = () => { setFormError(''); setModalSubject(emptyForm) }

  return <main className="students-page">
    <header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Subjects</h1><p>Manage subjects offered across departments and semesters.</p></div><button className="primary-action add-student-button" type="button" onClick={openCreate}><Plus size={17} /> Add subject</button></header>
    <section className="students-toolbar"><div className="students-count"><strong>{subjects.length}</strong><span>total subjects</span></div><div className="section-filters"><label className="search-box"><Search size={17} /><input type="search" placeholder="Search subjects..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filteredSubjects.length} shown</span></label><select className="filter-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} aria-label="Filter by department"><option value="all">All departments</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.code}</option>)}</select><select className="filter-select" value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)} aria-label="Filter by semester"><option value="all">All semesters</option>{Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => <option key={semester} value={semester}>Sem {semester}</option>)}</select></div></section>
    {error && <div className="students-alert" role="alert">{error}<button type="button" onClick={loadSubjects}>Retry</button></div>}
    <section className="students-table-card">
      {loading ? <div className="students-state"><div className="loading-spinner" /><p>Loading subjects...</p></div> : filteredSubjects.length === 0 ? <div className="students-state"><div className="empty-state-icon"><SubjectIcon /></div><h2>{search || departmentFilter !== 'all' || semesterFilter !== 'all' ? 'No matching subjects' : 'No subjects yet'}</h2><p>{search || departmentFilter !== 'all' || semesterFilter !== 'all' ? 'Try changing your search or filters.' : 'Add the first subject to begin organizing the curriculum.'}</p>{!search && departmentFilter === 'all' && semesterFilter === 'all' && <button className="primary-action" type="button" onClick={openCreate}><Plus size={16} /> Add subject</button>}</div> : <div className="students-table-wrap"><table><thead><tr><th>Subject</th><th>Code</th><th>Department</th><th>Semester</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredSubjects.map((subject) => { const department = typeof subject.department === 'object' ? subject.department : {}; return <tr key={subject._id}><td><div className="student-identity"><span className="student-avatar subject-avatar">{subject.code.slice(0, 2)}</span><div><strong>{subject.name}</strong><small>Academic subject</small></div></div></td><td><span className="roll-number">{subject.code}</span></td><td>{department.code || department.name || subject.department}</td><td><span className="semester-pill">Sem {subject.semester}</span></td><td><div className="row-actions"><button type="button" onClick={() => { setFormError(''); setModalSubject(subject) }} aria-label={`Edit ${subject.name}`}><Edit3 size={15} /></button><button type="button" className="delete-action" onClick={() => deleteSubject(subject)} aria-label={`Delete ${subject.name}`}><Trash2 size={15} /></button></div></td></tr> })}</tbody></table></div>}
    </section>
    {modalSubject && <SubjectForm subject={modalSubject._id ? modalSubject : null} departments={departments} saving={saving} error={formError} onSubmit={saveSubject} onClose={() => { if (!saving) setModalSubject(null) }} />}
  </main>
}

function SubjectIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" /></svg>
}
