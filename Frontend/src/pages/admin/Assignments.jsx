import { useEffect, useState } from 'react'
import { ArrowLeft, Edit3, Plus, Search, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const emptyForm = { faculty: '', subject: '', section: '', academicYear: '', semester: '' }

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function AssignmentForm({ assignment, faculty, subjects, sections, saving, error, onSubmit, onClose }) {
  const [form, setForm] = useState(assignment || emptyForm)
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return <div className="student-modal-backdrop" role="presentation">
    <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-form-title">
      <div className="modal-heading"><div><p className="panel-kicker">Teaching workload</p><h2 id="assignment-form-title">{assignment ? 'Edit assignment' : 'Assign faculty'}</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close form"><X size={19} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); onSubmit(form) }}>
        <div className="student-form-grid">
          <div className="student-field student-field-wide"><label htmlFor="assignmentFaculty">Faculty</label><select id="assignmentFaculty" value={form.faculty?._id || form.faculty || ''} onChange={(event) => updateField('faculty', event.target.value)} required><option value="">Select faculty</option>{faculty.map((member) => { const user = typeof member.userId === 'object' ? member.userId : {}; return <option key={member._id} value={member._id}>{user.name || member.employeeId} ({member.employeeId})</option> })}</select></div>
          <div className="student-field"><label htmlFor="assignmentSubject">Subject</label><select id="assignmentSubject" value={form.subject?._id || form.subject || ''} onChange={(event) => updateField('subject', event.target.value)} required><option value="">Select subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.code} - {subject.name}</option>)}</select></div>
          <div className="student-field"><label htmlFor="assignmentSection">Section</label><select id="assignmentSection" value={form.section?._id || form.section || ''} onChange={(event) => updateField('section', event.target.value)} required><option value="">Select section</option>{sections.map((section) => { const department = typeof section.department === 'object' ? section.department : {}; return <option key={section._id} value={section._id}>{section.name} - {department.code || 'Department'} / Sem {section.semester}</option> })}</select></div>
          <div className="student-field"><label htmlFor="assignmentSemester">Semester</label><select id="assignmentSemester" value={form.semester || ''} onChange={(event) => updateField('semester', event.target.value)} required><option value="">Select semester</option>{Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}</select></div>
          <div className="student-field"><label htmlFor="assignmentAcademicYear">Academic year</label><input id="assignmentAcademicYear" value={form.academicYear || ''} onChange={(event) => updateField('academicYear', event.target.value)} placeholder="2026 - 2027" required /></div>
        </div>
        {error && <p className="student-error" role="alert">{error}</p>}
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving...' : assignment ? 'Save changes' : 'Create assignment'}</button></div>
      </form>
    </section>
  </div>
}

export default function Assignments() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [faculty, setFaculty] = useState([])
  const [subjects, setSubjects] = useState([])
  const [sections, setSections] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalAssignment, setModalAssignment] = useState(null)

  const loadAssignments = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/assignments')
      setAssignments(data.assignments || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load assignments. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      const [facultyResponse, subjectResponse, sectionResponse] = await Promise.all([api.get('/faculty'), api.get('/subjects'), api.get('/sections')])
      setFaculty(facultyResponse.data.faculties || [])
      setSubjects(subjectResponse.data.subjects || [])
      setSections(sectionResponse.data.sections || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load assignment options. Please try again.'))
    }
  }

  useEffect(() => { Promise.resolve().then(loadAssignments) }, [])
  useEffect(() => { Promise.resolve().then(loadOptions) }, [])

  const saveAssignment = async (form) => {
    setSaving(true)
    setFormError('')
    const payload = { ...form, faculty: form.faculty?._id || form.faculty, subject: form.subject?._id || form.subject, section: form.section?._id || form.section, semester: Number(form.semester) }
    try {
      if (modalAssignment?._id) await api.put(`/assignments/${modalAssignment._id}`, payload)
      else await api.post('/assignments', payload)
      setModalAssignment(null)
      await loadAssignments()
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Unable to save assignment. Check the department and semester selections.'))
    } finally {
      setSaving(false)
    }
  }

  const deleteAssignment = async (assignment) => {
    if (!window.confirm('Remove this faculty assignment?')) return
    setError('')
    try {
      await api.delete(`/assignments/${assignment._id}`)
      setAssignments((current) => current.filter((item) => item._id !== assignment._id))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to remove assignment. Please try again.'))
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const member = assignment.faculty?.userId || {}
    const subject = assignment.subject || {}
    const section = assignment.section || {}
    return `${member.name || ''} ${member.email || ''} ${assignment.faculty?.employeeId || ''} ${subject.name || ''} ${subject.code || ''} ${section.name || ''} ${assignment.academicYear} ${assignment.semester}`.toLowerCase().includes(search.trim().toLowerCase())
  })

  const openCreate = () => { setFormError(''); setModalAssignment(emptyForm) }

  return <main className="students-page">
    <header className="students-header"><button className="back-button" type="button" onClick={() => navigate('/admin/dashboard')}><ArrowLeft size={17} /> Dashboard</button><div className="students-heading"><p className="panel-kicker">Administration</p><h1>Assignments</h1><p>Connect faculty members with subjects and sections.</p></div><button className="primary-action add-student-button" type="button" onClick={openCreate}><Plus size={17} /> Assign faculty</button></header>
    <section className="students-toolbar"><div className="students-count"><strong>{assignments.length}</strong><span>total assignments</span></div><label className="search-box"><Search size={17} /><input type="search" placeholder="Search assignments..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>{filteredAssignments.length} shown</span></label></section>
    {error && <div className="students-alert" role="alert">{error}<button type="button" onClick={loadAssignments}>Retry</button></div>}
    <section className="students-table-card">
      {loading ? <div className="students-state"><div className="loading-spinner" /><p>Loading assignments...</p></div> : filteredAssignments.length === 0 ? <div className="students-state"><div className="empty-state-icon"><AssignmentIcon /></div><h2>{search ? 'No matching assignments' : 'No assignments yet'}</h2><p>{search ? 'Try another faculty member, subject, or section.' : 'Create the first teaching assignment to begin.'}</p>{!search && <button className="primary-action" type="button" onClick={openCreate}><Plus size={16} /> Assign faculty</button>}</div> : <div className="students-table-wrap"><table><thead><tr><th>Faculty</th><th>Subject</th><th>Section</th><th>Semester</th><th>Academic year</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredAssignments.map((assignment) => { const member = assignment.faculty?.userId || {}; const subject = assignment.subject || {}; const section = assignment.section || {}; return <tr key={assignment._id}><td><div className="student-identity"><span className="student-avatar faculty-avatar">{(member.name || 'FA').slice(0, 2).toUpperCase()}</span><div><strong>{member.name || 'Unlinked faculty'}</strong><small>{assignment.faculty?.employeeId || member.email || 'No ID'}</small></div></div></td><td><span className="roll-number">{subject.code}</span><small className="table-subtext">{subject.name}</small></td><td>{section.name}</td><td><span className="semester-pill">Sem {assignment.semester}</span></td><td>{assignment.academicYear}</td><td><div className="row-actions"><button type="button" onClick={() => { setFormError(''); setModalAssignment(assignment) }} aria-label="Edit assignment"><Edit3 size={15} /></button><button type="button" className="delete-action" onClick={() => deleteAssignment(assignment)} aria-label="Remove assignment"><Trash2 size={15} /></button></div></td></tr> })}</tbody></table></div>}
    </section>
    {modalAssignment && <AssignmentForm assignment={modalAssignment._id ? modalAssignment : null} faculty={faculty} subjects={subjects} sections={sections} saving={saving} error={formError} onSubmit={saveAssignment} onClose={() => { if (!saving) setModalAssignment(null) }} />}
  </main>
}

function AssignmentIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6zM10 8h4M10 17h4" /></svg>
}
