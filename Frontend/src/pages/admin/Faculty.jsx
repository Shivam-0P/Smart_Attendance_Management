import { useEffect, useState } from 'react'
import { ArrowLeft, Edit3, Plus, Search, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const emptyForm = { userId: '', employeeId: '', department: '' }

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function FacultyForm({ faculty, departments, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(faculty || emptyForm)
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return <div className="student-modal-backdrop" role="presentation">
    <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="faculty-form-title">
      <div className="modal-heading"><div><p className="panel-kicker">Faculty directory</p><h2 id="faculty-form-title">{faculty ? 'Edit faculty' : 'Add faculty'}</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <div className="student-form-grid">
          <div className="student-field student-field-wide"><label htmlFor="facultyUserId">Faculty user ID</label><input id="facultyUserId" value={form.userId?._id || form.userId || ''} onChange={(event) => updateField('userId', event.target.value)} placeholder="MongoDB user ID" required /><small className="form-help">Use the ID of a registered User with the faculty role.</small></div>
          <div className="student-field"><label htmlFor="employeeId">Employee ID</label><input id="employeeId" value={form.employeeId || ''} onChange={(event) => updateField('employeeId', event.target.value)} placeholder="FAC-2026-001" required /></div>
          <div className="student-field"><label htmlFor="facultyDepartment">Department</label><select id="facultyDepartment" value={form.department?._id || form.department || ''} onChange={(event) => updateField('department', event.target.value)} required><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name} ({department.code})</option>)}</select></div>
        </div>
        {error && <p className="student-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving...' : faculty ? 'Save changes' : 'Add faculty'}</button></div>
      </form>
    </section>
  </div>
}

export default function Faculty() {
  const navigate = useNavigate()
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalFaculty, setModalFaculty] = useState(null)

  const loadFaculty = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/faculty')
      setFaculty(data.faculties || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load faculty. Please try again.'))
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

  useEffect(() => { Promise.resolve().then(loadFaculty) }, [])
  useEffect(() => { Promise.resolve().then(loadDepartments) }, [])

  const saveFaculty = async (form) => {
    setSaving(true)
    setFormError('')
    const payload = { ...form, userId: form.userId?._id || form.userId, department: form.department?._id || form.department }
    try {
      if (modalFaculty?._id) await api.put(`/faculty/${modalFaculty._id}`, payload)
      else await api.post('/faculty', payload)
      setModalFaculty(null)
      await loadFaculty()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Unable to save faculty. Please check the details.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteFaculty = async (member) => {
    const name = typeof member.userId === 'object' ? member.userId.name : member.employeeId
    if (!window.confirm(`Remove ${name || 'this faculty member'} from the directory?`)) return
    setError('')
    try {
      await api.delete(`/faculty/${member._id}`)
      setFaculty((current) => current.filter((item) => item._id !== member._id))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to remove faculty. Please try again.'))
    }
  }

  const filteredFaculty = faculty.filter((member) => {
    const user = typeof member.userId === 'object' ? member.userId : {}
    const department = typeof member.department === 'object' ? member.department : {}
    return `${user.name || ''} ${user.email || ''} ${member.employeeId} ${department.name || ''} ${department.code || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  })

  const openCreate = () => { setFormError(''); setModalFaculty(emptyForm) }

  return <main className="students-page">
    <header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Faculty</h1><p>Manage faculty profiles and department assignments.</p></div><button className="primary-action add-student-button" type="button" onClick={openCreate}><Plus size={17} /> Add faculty</button></header>
    <section className="students-toolbar"><div className="students-count"><strong>{faculty.length}</strong><span>faculty members</span></div><label className="search-box"><Search size={17} /><input type="search" placeholder="Search faculty..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filteredFaculty.length} shown</span></label></section>
    {error && <div className="students-alert" role="alert">{error}<button type="button" onClick={loadFaculty}>Retry</button></div>}
    <section className="students-table-card">
      {loading ? <div className="students-state"><div className="loading-spinner" /><p>Loading faculty...</p></div> : filteredFaculty.length === 0 ? <div className="students-state"><div className="empty-state-icon"><FacultyIcon /></div><h2>{search ? 'No matching faculty' : 'No faculty yet'}</h2><p>{search ? 'Try a different name, employee ID, or department.' : 'Add the first faculty profile to begin managing your directory.'}</p>{!search && <button className="primary-action" type="button" onClick={openCreate}><Plus size={16} /> Add faculty</button>}</div> : <div className="students-table-wrap"><table><thead><tr><th>Faculty member</th><th>Employee ID</th><th>Department</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredFaculty.map((member) => { const user = typeof member.userId === 'object' ? member.userId : {}; const department = typeof member.department === 'object' ? member.department : {}; const name = user.name || 'Unlinked user'; return <tr key={member._id}><td><div className="student-identity"><span className="student-avatar faculty-avatar">{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{user.email || 'No email available'}</small></div></div></td><td><span className="roll-number">{member.employeeId}</span></td><td>{department.code || department.name || 'Unassigned'}</td><td><div className="row-actions"><button type="button" onClick={() => { setFormError(''); setModalFaculty(member) }} aria-label={`Edit ${name}`}><Edit3 size={15} /></button><button type="button" className="delete-action" onClick={() => deleteFaculty(member)} aria-label={`Remove ${name}`}><Trash2 size={15} /></button></div></td></tr> })}</tbody></table></div>}
    </section>
    {modalFaculty && <FacultyForm faculty={modalFaculty._id ? modalFaculty : null} departments={departments} saving={saving} error={formError} onSubmit={saveFaculty} onClose={() => { if (!saving) setModalFaculty(null) }} />}
  </main>
}

function FacultyIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
