import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Plus, Search, Trash2, X } from 'lucide-react'
import api from '../../services/api'

const emptyForm = {
  userId: '',
  rollNumber: '',
  department: '',
  section: '',
  semester: '',
  admissionYear: '',
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function StudentForm({ student, departments, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(student || emptyForm)
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return <div className="student-modal-backdrop" role="presentation">
    <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="student-form-title">
      <div className="modal-heading"><div><p className="panel-kicker">Student record</p><h2 id="student-form-title">{student ? 'Edit student' : 'Add student'}</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>
      <form className="student-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <div className="student-form-grid">
          <div className="student-field student-field-wide"><label htmlFor="userId">Student user ID</label><input id="userId" value={form.userId?._id || form.userId || ''} onChange={(event) => updateField('userId', event.target.value)} placeholder="MongoDB user ID" required /></div>
          <div className="student-field"><label htmlFor="rollNumber">Roll number</label><input id="rollNumber" value={form.rollNumber || ''} onChange={(event) => updateField('rollNumber', event.target.value)} placeholder="e.g. CS-2026-014" required /></div>
          <div className="student-field"><label htmlFor="department">Department</label><select id="department" value={form.department?._id || form.department || ''} onChange={(event) => updateField('department', event.target.value)} required><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name} ({department.code})</option>)}</select></div>
          <div className="student-field"><label htmlFor="section">Section</label><input id="section" value={form.section || ''} onChange={(event) => updateField('section', event.target.value)} placeholder="A" required /></div>
          <div className="student-field"><label htmlFor="semester">Semester</label><input id="semester" type="number" min="1" max="8" value={form.semester || ''} onChange={(event) => updateField('semester', event.target.value)} placeholder="1 - 8" required /></div>
          <div className="student-field"><label htmlFor="admissionYear">Admission year</label><input id="admissionYear" type="number" min="1900" value={form.admissionYear || ''} onChange={(event) => updateField('admissionYear', event.target.value)} placeholder="2026" required /></div>
        </div>
        {error && <p className="student-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving...' : student ? 'Save changes' : 'Add student'}</button></div>
      </form>
    </section>
  </div>
}

function StudentRow({ student, onEdit, onDelete }) {
  const studentUser = student.userId && typeof student.userId === 'object' ? student.userId : null
  const studentDepartment = student.department && typeof student.department === 'object' ? student.department.name : student.department
  const name = studentUser?.name || 'Unlinked user'
  const email = studentUser?.email || 'No email available'

  return <tr>
    <td><div className="student-identity"><span className="student-avatar">{name.slice(0, 2).toUpperCase()}</span><div><strong>{name}</strong><small>{email}</small></div></div></td>
    <td><span className="roll-number">{student.rollNumber}</span></td>
    <td>{studentDepartment || 'Unassigned'}</td>
    <td>{student.section}</td>
    <td><span className="semester-pill">Sem {student.semester}</span></td>
    <td>{student.admissionYear}</td>
    <td><div className="row-actions"><button type="button" onClick={() => onEdit(student)} aria-label={`Edit ${name}`}><Edit3 size={15} /></button><button type="button" className="delete-action" onClick={() => onDelete(student)} aria-label={`Delete ${name}`}><Trash2 size={15} /></button></div></td>
  </tr>
}

export default function Students() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalStudent, setModalStudent] = useState(null)

  const loadStudents = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/students')
      setStudents(data.students || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load students. Please try again.'))
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

  useEffect(() => { Promise.resolve().then(loadStudents) }, [])
  useEffect(() => { Promise.resolve().then(loadDepartments) }, [])

  const openCreate = () => { setFormError(''); setModalStudent(emptyForm) }
  const openEdit = (student) => { setFormError(''); setModalStudent(student) }
  const closeModal = () => { if (!saving) setModalStudent(null) }

  const saveStudent = async (form) => {
    setSaving(true)
    setFormError('')
    const payload = { ...form, userId: form.userId?._id || form.userId, department: form.department?._id || form.department, semester: Number(form.semester), admissionYear: Number(form.admissionYear) }
    try {
      if (modalStudent?._id) await api.put(`/students/${modalStudent._id}`, payload)
      else await api.post('/students', payload)
      setModalStudent(null)
      await loadStudents()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Unable to save student. Please check the details.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteStudent = async (student) => {
    const studentName = typeof student.userId === 'object' ? student.userId.name : student.rollNumber
    if (!window.confirm(`Delete ${studentName || 'this student'}?`)) return
    setError('')
    try {
      await api.delete(`/students/${student._id}`)
      setStudents((current) => current.filter((item) => item._id !== student._id))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to delete student. Please try again.'))
    }
  }

  const normalizedSearch = search.trim().toLowerCase()
  const filteredStudents = students.filter((student) => {
    const studentUser = typeof student.userId === 'object' ? student.userId : {}
    const department = typeof student.department === 'object' ? `${student.department.name} ${student.department.code}` : student.department
    return [studentUser.name, studentUser.email, student.rollNumber, department, student.section].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
  })

  return <main className="students-page">
    <header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Students</h1><p>Manage student profiles and academic enrollment details.</p></div><button className="primary-action add-student-button" type="button" onClick={openCreate}><Plus size={17} /> Add student</button></header>
    <section className="students-toolbar"><div className="students-count"><strong>{students.length}</strong><span>total students</span></div><label className="search-box"><Search size={17} /><input type="search" placeholder="Search students..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filteredStudents.length} shown</span></label></section>
    {error && <div className="students-alert" role="alert">{error}<button type="button" onClick={loadStudents}>Retry</button></div>}
    <section className="students-table-card">
      {loading ? <div className="students-state"><div className="loading-spinner" /><p>Loading students...</p></div> : filteredStudents.length === 0 ? <div className="students-state"><div className="empty-state-icon"><UsersIcon /></div><h2>{search ? 'No matching students' : 'No students yet'}</h2><p>{search ? 'Try a different name, roll number, or department.' : 'Add the first student record to begin managing enrollment.'}</p>{!search && <button className="primary-action" type="button" onClick={openCreate}><Plus size={16} /> Add student</button>}</div> : <div className="students-table-wrap"><table><thead><tr><th>Student</th><th>Roll number</th><th>Department</th><th>Section</th><th>Semester</th><th>Admission year</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredStudents.map((student) => <StudentRow key={student._id} student={student} onEdit={openEdit} onDelete={deleteStudent} />)}</tbody></table></div>}
    </section>
    {modalStudent && <StudentForm student={modalStudent._id ? modalStudent : null} departments={departments} saving={saving} error={formError} onSubmit={saveStudent} onClose={closeModal} />}
  </main>
}

function UsersIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm11 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
}
