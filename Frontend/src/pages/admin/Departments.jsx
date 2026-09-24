import { useEffect, useState } from 'react'
import { ArrowLeft, Edit3, Plus, Search, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const emptyForm = { name: '', code: '' }

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function DepartmentForm({ department, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(department || emptyForm)
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return <div className="student-modal-backdrop" role="presentation">
    <section className="student-modal department-modal" role="dialog" aria-modal="true" aria-labelledby="department-form-title">
      <div className="modal-heading"><div><p className="panel-kicker">Academic structure</p><h2 id="department-form-title">{department ? 'Edit department' : 'Add department'}</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <div className="student-form-grid">
          <div className="student-field"><label htmlFor="departmentName">Department name</label><input id="departmentName" value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Computer Science" required /></div>
          <div className="student-field"><label htmlFor="departmentCode">Department code</label><input id="departmentCode" value={form.code} onChange={(event) => updateField('code', event.target.value.toUpperCase())} placeholder="CSE" maxLength="10" required /></div>
        </div>
        {error && <p className="student-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving...' : department ? 'Save changes' : 'Add department'}</button></div>
      </form>
    </section>
  </div>
}

export default function Departments() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalDepartment, setModalDepartment] = useState(null)

  const loadDepartments = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/departments')
      setDepartments(data.departments || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load departments. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { Promise.resolve().then(loadDepartments) }, [])

  const saveDepartment = async (form) => {
    setSaving(true)
    setFormError('')
    try {
      if (modalDepartment?._id) await api.put(`/departments/${modalDepartment._id}`, form)
      else await api.post('/departments', form)
      setModalDepartment(null)
      await loadDepartments()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Unable to save department. Please check the details.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteDepartment = async (department) => {
    if (!window.confirm(`Delete ${department.name}?`)) return
    setError('')
    try {
      await api.delete(`/departments/${department._id}`)
      setDepartments((current) => current.filter((item) => item._id !== department._id))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete department. It may still have students assigned.'))
    }
  }

  const filteredDepartments = departments.filter((department) => `${department.name} ${department.code}`.toLowerCase().includes(search.trim().toLowerCase()))

  return <main className="students-page">
    <header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Departments</h1><p>Organize academic departments and their identifiers.</p></div><button className="primary-action add-student-button" type="button" onClick={() => { setFormError(''); setModalDepartment(emptyForm) }}><Plus size={17} /> Add department</button></header>
    <section className="students-toolbar"><div className="students-count"><strong>{departments.length}</strong><span>total departments</span></div><label className="search-box"><Search size={17} /><input type="search" placeholder="Search departments..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filteredDepartments.length} shown</span></label></section>
    {error && <div className="students-alert" role="alert">{error}<button type="button" onClick={loadDepartments}>Retry</button></div>}
    <section className="students-table-card">
      {loading ? <div className="students-state"><div className="loading-spinner" /><p>Loading departments...</p></div> : filteredDepartments.length === 0 ? <div className="students-state"><div className="empty-state-icon"><BuildingIcon /></div><h2>{search ? 'No matching departments' : 'No departments yet'}</h2><p>{search ? 'Try a different department name or code.' : 'Add the first department to begin organizing your institution.'}</p>{!search && <button className="primary-action" type="button" onClick={() => { setFormError(''); setModalDepartment(emptyForm) }}><Plus size={16} /> Add department</button>}</div> : <div className="students-table-wrap"><table><thead><tr><th>Department</th><th>Code</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredDepartments.map((department) => <tr key={department._id}><td><div className="student-identity"><span className="student-avatar department-avatar">{department.code.slice(0, 2)}</span><div><strong>{department.name}</strong><small>Academic department</small></div></div></td><td><span className="roll-number">{department.code}</span></td><td>{new Date(department.createdAt).toLocaleDateString()}</td><td><div className="row-actions"><button type="button" onClick={() => { setFormError(''); setModalDepartment(department) }} aria-label={`Edit ${department.name}`}><Edit3 size={15} /></button><button type="button" className="delete-action" onClick={() => deleteDepartment(department)} aria-label={`Delete ${department.name}`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    {modalDepartment && <DepartmentForm department={modalDepartment._id ? modalDepartment : null} saving={saving} error={formError} onSubmit={saveDepartment} onClose={() => { if (!saving) setModalDepartment(null) }} />}
  </main>
}

function BuildingIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V5l7-3v19M19 21V9l-7-3M8 8h1M8 12h1M8 16h1M15 12h1M15 16h1" /></svg>
}
