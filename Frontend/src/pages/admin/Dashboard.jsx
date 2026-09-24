import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  School,
  Settings2,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import api from '../../services/api'

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Students', icon: GraduationCap },
  { label: 'Faculty', icon: Users },
  { label: 'Departments', icon: Building2 },
  { label: 'Sections', icon: School },
  { label: 'Subjects', icon: BookOpen },
  { label: 'Assignments', icon: Link2 },
  { label: 'Attendance', icon: ClipboardCheck },
  { label: 'Reports', icon: BarChart3 },
  { label: 'AI Assistant', icon: Sparkles, accent: true },
]

const stats = [
  { label: 'Total Students', value: '2,486', change: '+12.5%', detail: 'vs. last semester', icon: GraduationCap, tone: 'blue' },
  { label: 'Total Faculty', value: '142', change: '+4.2%', detail: 'vs. last semester', icon: Users, tone: 'mint' },
  { label: 'Departments', value: '18', change: '+2', detail: 'new this year', icon: Building2, tone: 'violet' },
  { label: 'Average Attendance', value: '87.4%', change: '+3.8%', detail: 'vs. last month', icon: Activity, tone: 'amber' },
]

function Sidebar({ activeItem, onSelect, onLogout, isOpen, onClose }) {
  return <aside className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}>
    <div className="sidebar-brand">
      <span className="sidebar-mark">SA</span>
      <div><strong>Smart</strong><span>Attendance</span></div>
      <button className="sidebar-close" type="button" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
    </div>
    <div className="sidebar-section-label">Workspace</div>
    <nav className="sidebar-nav" aria-label="Admin navigation">
      {navigation.map(({ label, icon: Icon, accent }) => <button key={label} className={`sidebar-link ${activeItem === label ? 'active' : ''} ${accent ? 'accent' : ''}`} type="button" onClick={() => onSelect(label)}>
        <Icon size={18} strokeWidth={activeItem === label ? 2.3 : 1.8} />
        <span>{label}</span>
        {accent && <span className="new-badge">New</span>}
      </button>)}
    </nav>
    <div className="sidebar-footer">
      <button className="sidebar-link" type="button" onClick={() => onSelect('Settings')}><Settings2 size={18} /><span>Settings</span></button>
      <button className="sidebar-link logout-link" type="button" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
    </div>
  </aside>
}

function StatCard({ label, value, change, detail, icon: Icon, tone }) {
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-foot"><span className="positive-change">{change}</span><span>{detail}</span></div>
  </article>
}

function AttendanceChart() {
  const points = '0,112 44,105 88,110 132,84 176,91 220,63 264,70 308,49 352,56 396,31 440,38'
  return <article className="dashboard-panel attendance-panel">
    <div className="panel-heading"><div><p className="panel-kicker">Attendance overview</p><h2>Weekly attendance</h2></div><button className="period-button" type="button">This week <ChevronRight size={15} /></button></div>
    <div className="chart-wrap">
      <div className="chart-y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
      <div className="chart-area">
        <div className="chart-grid"><i /><i /><i /><i /><i /></div>
        <svg className="attendance-chart" viewBox="0 0 440 128" role="img" aria-label="Attendance increased from 78 percent to 94 percent across the week" preserveAspectRatio="none">
          <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4c93e8" stopOpacity=".28" /><stop offset="100%" stopColor="#4c93e8" stopOpacity="0" /></linearGradient></defs>
          <polygon points={`${points} 440,128 0,128`} fill="url(#chart-fill)" />
          <polyline points={points} fill="none" stroke="#3987df" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="396" cy="31" r="5" fill="#fff" stroke="#3987df" strokeWidth="3" />
        </svg>
        <div className="chart-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      </div>
    </div>
  </article>
}

function ThresholdPanel() {
  return <article className="dashboard-panel threshold-panel">
    <div className="panel-heading"><div><p className="panel-kicker">Needs attention</p><h2>Below threshold</h2></div><button className="icon-button" type="button" aria-label="View all students"><ChevronRight size={18} /></button></div>
    <div className="threshold-summary"><strong>126</strong><span>students below<br />75% attendance</span></div>
    <div className="progress-track"><span /></div>
    <div className="threshold-meta"><span>5.1% of all students</span><span className="warning-text">+8 this week</span></div>
    <button className="panel-action" type="button">Review students <ChevronRight size={15} /></button>
  </article>
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(true)
  const [insightError, setInsightError] = useState('')

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const { data } = await api.post('/ai/attendance-insights')
        setInsight(data.insight || '')
      } catch (requestError) {
        setInsightError(requestError.response?.data?.message || 'Insights are currently unavailable.')
      } finally {
        setInsightLoading(false)
      }
    })
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleNavigation = (item) => {
    setActiveItem(item)
    setSidebarOpen(false)
    if (item === 'Students') navigate('/admin/students')
    if (item === 'Faculty') navigate('/admin/faculty')
    if (item === 'Departments') navigate('/admin/departments')
    if (item === 'Sections') navigate('/admin/sections')
    if (item === 'Subjects') navigate('/admin/subjects')
    if (item === 'Assignments') navigate('/admin/assignments')
    if (item === 'Attendance') navigate('/admin/attendance')
    if (item === 'Reports') navigate('/admin/reports')
    if (item === 'AI Assistant') navigate('/ai/attendance-assistant')
  }

  return <div className="admin-layout">
    <Sidebar activeItem={activeItem} onSelect={handleNavigation} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <main className="admin-main">
      <header className="admin-header">
        <button className="mobile-menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
        <div className="header-context"><span className="header-overline">Admin portal</span><span className="header-divider">/</span><span>{activeItem}</span></div>
        <div className="header-actions"><button className="help-button" type="button" aria-label="Help"><CircleHelp size={19} /></button><div className="admin-profile"><span className="profile-avatar">{(user?.name || 'AD').slice(0, 2).toUpperCase()}</span><span className="profile-copy"><strong>{user?.name || 'Administrator'}</strong><small>Administrator</small></span><ChevronRight size={15} /></div></div>
      </header>
      <div className="admin-content">
        <div className="welcome-row"><div><p className="panel-kicker">Monday, September 24, 2026</p><h1>Good morning{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1><p className="welcome-copy">Here is what is happening across your institution today.</p></div><button className="export-button" type="button"><BarChart3 size={17} /> Export report</button></div>
        <section className="stats-grid" aria-label="Institution statistics">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</section>
        <section className="dashboard-grid"><AttendanceChart /><ThresholdPanel /></section>
        <section className="insight-banner"><div className="insight-icon"><Sparkles size={20} /></div><div className="insight-copy"><p className="panel-kicker">Smart insight</p>{insightLoading ? <><strong>Preparing administrative insight...</strong><p>Reviewing backend-calculated attendance statistics.</p></> : insightError ? <><strong>Insight unavailable</strong><p>{insightError}</p></> : <><strong>Attendance overview</strong><p>{insight}</p></>}</div></section>
      </div>
    </main>
  </div>
}
