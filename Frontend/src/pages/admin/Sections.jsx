import { useEffect, useState } from 'react'
import { ArrowLeft, Edit3, Plus, Search, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const emptyForm = { name: '', department: '', semester: '', academicYear: '' }

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function SectionForm({ section, departments, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(section || emptyForm)
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return <div className="student-modal-backdrop" role="presentation">
    <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="section-form-title">
      <div className="modal-heading"><div><p className="panel-kicker">Academic structure</p><h2 id="section-form-title">{section ? 'Edit section' : 'Add section'}</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <div className="student-form-grid">
          <div className="student-field"><label htmlFor="sectionName">Section name</label><input id="sectionName" value={form.name || ''} onChange={(event) => updateField('name', event.target.value)} placeholder="Section A" required /></div>
          <div className="student-field"><label htmlFor="sectionDepartment">Department</label><select id="sectionDepartment" value={form.department?._id || form.department || ''} onChange={(event) => updateField('department', event.target.value)} required><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name} ({department.code})</option>)}</select></div>
          <div className="student-field"><label htmlFor="sectionSemester">Semester</label><select id="sectionSemester" value={form.semester || ''} onChange={(event) => updateField('semester', event.target.value)} required><option value="">Select semester</option>{Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}</select></div>
          <div className="student-field"><label htmlFor="academicYear">Academic year</label><input id="academicYear" value={form.academicYear || ''} onChange={(event) => updateField('academicYear', event.target.value)} placeholder="2026 - 2027" required /></div>
        </div>
        {error && <p className="student-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving...' : section ? 'Save changes' : 'Add section'}</button></div>
      </form>
    </section>
  </div>
}

export default function Sections() {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalSection, setModalSection] = useState(null)

  const loadSections = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/sections')
      setSections(data.sections || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load sections. Please try again.'))
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

  useEffect(() => { Promise.resolve().then(loadSections) }, [])
  useEffect(() => { Promise.resolve().then(loadDepartments) }, [])

  const saveSection = async (form) => {
    setSaving(true)
    setFormError('')
    const payload = { ...form, department: form.department?._id || form.department, semester: Number(form.semester) }
    try {
      if (modalSection?._id) await api.put(`/sections/${modalSection._id}`, payload)
      else await api.post('/sections', payload)
      setModalSection(null)
      await loadSections()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Unable to save section. Please check the details.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteSection = async (section) => {
    if (!window.confirm(`Delete ${section.name}?`)) return
    setError('')
    try {
      await api.delete(`/sections/${section._id}`)
      setSections((current) => current.filter((item) => item._id !== section._id))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete section. Please try again.'))
    }
  }

  const filteredSections = sections.filter((section) => {
    const department = typeof section.department === 'object' ? section.department : {}
    const matchesDepartment = departmentFilter === 'all' || department._id === departmentFilter
    const searchValue = `${section.name} ${section.semester} ${section.academicYear} ${department.name || ''} ${department.code || ''}`.toLowerCase()
    return matchesDepartment && searchValue.includes(search.trim().toLowerCase())
  })

  const openCreate = () => { setFormError(''); setModalSection(emptyForm) }

  return <main className="students-page">
    <header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Sections</h1><p>Manage class sections by department and academic year.</p></div><button className="primary-action add-student-button" type="button" onClick={openCreate}><Plus size={17} /> Add section</button></header>
    <section className="students-toolbar"><div className="students-count"><strong>{sections.length}</strong><span>total sections</span></div><div className="section-filters"><label className="search-box"><Search size={17} /><input type="search" placeholder="Search sections..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filteredSections.length} shown</span></label><select className="filter-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} aria-label="Filter by department"><option value="all">All departments</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.code}</option>)}</select></div></section>
    {error && <div className="students-alert" role="alert">{error}<button type="button" onClick={loadSections}>Retry</button></div>}
    <section className="students-table-card">
      {loading ? <div className="students-state"><div className="loading-spinner" /><p>Loading sections...</p></div> : filteredSections.length === 0 ? <div className="students-state"><div className="empty-state-icon"><SectionsIcon /></div><h2>{search || departmentFilter !== 'all' ? 'No matching sections' : 'No sections yet'}</h2><p>{search || departmentFilter !== 'all' ? 'Try a different search or department filter.' : 'Add the first section to begin organizing classes.'}</p>{!search && departmentFilter === 'all' && <button className="primary-action" type="button" onClick={openCreate}><Plus size={16} /> Add section</button>}</div> : <div className="students-table-wrap"><table><thead><tr><th>Section</th><th>Department</th><th>Semester</th><th>Academic year</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredSections.map((section) => { const department = typeof section.department === 'object' ? section.department : {}; return <tr key={section._id}><td><div className="student-identity"><span className="student-avatar section-avatar">{section.name.slice(0, 2).toUpperCase()}</span><div><strong>{section.name}</strong><small>Class section</small></div></div></td><td><span className="roll-number">{department.code || department.name || section.department}</span></td><td><span className="semester-pill">Sem {section.semester}</span></td><td>{section.academicYear}</td><td><div className="row-actions"><button type="button" onClick={() => { setFormError(''); setModalSection(section) }} aria-label={`Edit ${section.name}`}><Edit3 size={15} /></button><button type="button" className="delete-action" onClick={() => deleteSection(section)} aria-label={`Delete ${section.name}`}><Trash2 size={15} /></button></div></td></tr> })}</tbody></table></div>}
    </section>
    {modalSection && <SectionForm section={modalSection._id ? modalSection : null} departments={departments} saving={saving} error={formError} onSubmit={saveSection} onClose={() => { if (!saving) setModalSection(null) }} />}
  </main>
}

function SectionsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16M7 5v14M17 5v14" /></svg>
}
