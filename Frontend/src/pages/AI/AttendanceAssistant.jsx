import { useState } from 'react'
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const examples = [
  'Which students are below 75% attendance?',
  'What is the average attendance for MCA?',
  'Which subjects have the lowest attendance?',
  "Show Rahul's attendance summary.",
  "Give me a summary of today's attendance.",
]

function getErrorMessage(error) {
  return error.response?.data?.message || 'Unable to get an AI response. Please try again.'
}

export default function AttendanceAssistant() {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [askedQuestion, setAskedQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const askQuestion = async (event) => {
    event?.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || loading) return

    setLoading(true)
    setError('')
    setResponse('')
    setAskedQuestion(trimmedQuestion)
    try {
      const { data } = await api.post('/ai/attendance-query', { question: trimmedQuestion })
      setResponse(data.answer || 'The assistant did not return a response.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  return <main className="ai-assistant-page">
    <header className="ai-assistant-header"><button className="back-button" type="button" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Back</button><div className="ai-brand-mark"><Sparkles size={19} /></div><p className="panel-kicker">Smart Attendance</p><h1>AI Attendance Assistant</h1><p>Ask concise questions about the attendance data you are authorized to access.</p></header>
    <section className="ai-assistant-card">
      <div className="ai-input-heading"><div className="ai-icon"><Bot size={21} /></div><div><strong>Ask a question</strong><span>The assistant uses verified attendance data only.</span></div></div>
      <form className="ai-question-form" onSubmit={askQuestion}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about attendance..." rows="3" maxLength="500" aria-label="Attendance question" /><div className="ai-form-footer"><span>{question.length}/500</span><button className="primary-action" type="submit" disabled={loading || !question.trim()}>{loading ? 'Thinking...' : <><Send size={16} /> Ask AI</>}</button></div></form>
      <div className="ai-examples"><p>Example questions</p><div>{examples.map((example) => <button key={example} type="button" onClick={() => setQuestion(example)}>{example}</button>)}</div></div>
    </section>
    {error && <section className="ai-message ai-error" role="alert"><strong>Unable to answer</strong><p>{error}</p></section>}
    {loading && <section className="ai-message ai-loading"><div className="loading-spinner" /><div><strong>Reviewing your attendance data...</strong><p>This can take a moment.</p></div></section>}
    {response && !loading && <section className="ai-response-card"><div className="ai-response-heading"><div className="ai-icon"><Bot size={19} /></div><div><span>Your question</span><strong>{askedQuestion}</strong></div></div><div className="ai-response-body"><p>{response}</p></div></section>}
  </main>
}
