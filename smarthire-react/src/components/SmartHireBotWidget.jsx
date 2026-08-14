import React, { useState, useEffect, useRef } from 'react'

export default function SmartHireBotWidget({ jobs = [], onClose }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Initial welcome message
    const activeCount = jobs.filter(j => !isJobExpired(j)).length
    setMessages([
      {
        id: 'bot-welcome',
        sender: 'bot',
        text: `Hello! 👋 I am your SmartHire AI Career Assistant. We currently have **${activeCount || jobs.length || 77} active job vacancies** available across C2C, W2, and 1099 contracts.`,
        timestamp: new Date().toISOString()
      },
      {
        id: 'bot-help',
        sender: 'bot',
        text: `Ask me anything! For example:\n• "What DevOps or Java jobs are open?"\n• "Are there any Remote or Hybrid roles?"\n• "Tell me about the Education Consultant vacancy"`,
        timestamp: new Date().toISOString()
      }
    ])
  }, [jobs])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function isJobExpired(job) {
    if (!job) return true
    const s = (job.status || '').toLowerCase()
    return s === 'closed' || s === 'expired' || s === 'inactive'
  }

  const handleSend = () => {
    const query = inputText.trim()
    if (!query) return

    const userMsg = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    setTimeout(() => {
      const botResponseText = generateBotAnswer(query, jobs)
      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 600)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const generateBotAnswer = (userQuery, jobList = []) => {
    const q = userQuery.toLowerCase()

    // STRICT RULE: Pay rates / salary secrecy
    if (q.includes('rate') || q.includes('pay') || q.includes('salary') || q.includes('money') || q.includes('dollar') || q.includes('bill rate') || q.includes('compensation') || q.includes('hourly') || q.includes('$')) {
      return `🔒 **Pay Rate Policy:** Compensation and hourly pay rates are evaluated individually based on your experience and discussed directly with our staffing recruiters during the initial screening call.\n\nTo get evaluated for a role, click **"Apply Direct"** on any job opening on this page!`
    }

    // Remote / Hybrid / Onsite query
    if (q.includes('remote') || q.includes('hybrid') || q.includes('onsite') || q.includes('location') || q.includes('work mode')) {
      const activeJobs = jobList.filter(j => !isJobExpired(j))
      let matched = []
      if (q.includes('remote')) matched = activeJobs.filter(j => (j.location || j.work_mode || j.workMode || '').toLowerCase().includes('remote'))
      else if (q.includes('hybrid')) matched = activeJobs.filter(j => (j.location || j.work_mode || j.workMode || '').toLowerCase().includes('hybrid'))
      else if (q.includes('onsite')) matched = activeJobs.filter(j => (j.location || j.work_mode || j.workMode || '').toLowerCase().includes('onsite') || (j.location || '').toLowerCase().includes('on site'))
      else matched = activeJobs.slice(0, 5)

      if (matched.length > 0) {
        let text = `💼 Here are matching active vacancies:\n\n`
        matched.slice(0, 4).forEach(j => {
          const mode = j.work_mode || j.workMode || 'Onsite'
          const exp = j.experience || '3+ yrs'
          text += `• **${j.title}** (${mode} · ${exp})\n  Skills: ${(j.skills || []).slice(0, 3).join(', ')}\n\n`
        })
        text += `Click **"Apply Direct"** on any card to submit your resume!`
        return text
      }
      return `We have several Onsite, Hybrid, and Remote vacancies open across US locations. You can filter them using the top dropdown on the portal!`
    }

    // Specific job title / skill search
    const activeJobs = jobList.filter(j => !isJobExpired(j))
    const matchedJobs = activeJobs.filter(j => {
      const title = (j.title || '').toLowerCase()
      const skills = (j.skills || []).map(s => s.toLowerCase()).join(' ')
      const desc = (j.rawDescription || j.fullDescription || '').toLowerCase()
      return q.split(' ').some(word => word.length > 2 && (title.includes(word) || skills.includes(word) || desc.includes(word)))
    })

    if (matchedJobs.length > 0) {
      let text = `📋 Found ${matchedJobs.length} active matching position(s):\n\n`
      matchedJobs.slice(0, 3).forEach(j => {
        const mode = j.work_mode || j.workMode || 'Onsite'
        const exp = j.experience && j.experience !== 'TBD' ? j.experience : 'Relevant Experience'
        text += `🔹 **${j.title}**\n  • Work Mode: ${mode}\n  • Experience: ${exp}\n  • Required Skills: ${(j.skills || []).slice(0, 4).join(', ')}\n\n`
      })
      text += `Submit your application by clicking **"Apply Direct"** on the job card!`
      return text
    }

    // How to apply / application query
    if (q.includes('apply') || q.includes('submit') || q.includes('resume') || q.includes('how')) {
      return `📝 **How to Apply:**\n1. Find your target job card on the portal\n2. Click the blue **"Apply Direct"** button\n3. Attach your resume (PDF/Docx) — your info will auto-populate!\n4. Click Submit — our recruiting team receives it immediately and you'll get a direct **"Message Recruiter"** button!`
    }

    // General fallback overview
    const sampleTitles = activeJobs.slice(0, 4).map(j => `"${j.title}"`).join(', ')
    return `🤖 We have ${activeJobs.length || 77} active vacancies including ${sampleTitles || 'Engineering, Consulting, and Tech roles'}.\n\nYou can search by job title or skill at the top, or click **"Apply Direct"** on any job card to submit your resume. Is there a specific role or technology stack you are looking for?`
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 28,
      width: 380,
      height: 520,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      border: '1px solid #CBD5E1',
      boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>

      {/* Bot Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A, #1E293B)',
        color: '#FFFFFF',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#FFFFFF', lineHeight: 1.2 }}>
              SmartHire AI Assistant
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              Active Candidate Support Bot
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#94A3B8',
            width: 28, height: 28, borderRadius: '50%',
            cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#FFF'}
          onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
        >
          ✕
        </button>
      </div>

      {/* Bot Message History */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.map(m => {
          const isBot = m.sender === 'bot'
          return (
            <div key={m.id} style={{
              display: 'flex',
              flexDirection: isBot ? 'row' : 'row-reverse',
              alignItems: 'flex-start',
              gap: 8
            }}>
              {isBot && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#2563EB', color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0, marginTop: 2
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: '80%',
                backgroundColor: isBot ? '#FFFFFF' : '#2563EB',
                color: isBot ? '#1E293B' : '#FFFFFF',
                border: isBot ? '1px solid #E2E8F0' : 'none',
                borderRadius: isBot ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                padding: '10px 14px',
                fontSize: 13,
                lineHeight: 1.55,
                boxShadow: isBot ? '0 2px 6px rgba(0,0,0,0.04)' : '0 4px 12px rgba(37,99,235,0.2)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {m.text}
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
            <div style={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '14px 14px 14px 2px', padding: '8px 14px', fontSize: 12, color: '#64748B' }}>
              Assistant is typing…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ padding: '8px 12px', background: '#FFF', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['Remote roles', 'DevOps openings', 'How to apply?'].map((btnText, i) => (
          <button
            key={i}
            onClick={() => {
              setInputText(btnText)
              setTimeout(() => handleSend(), 50)
            }}
            style={{
              background: '#EFF6FF',
              border: '1px solid rgba(37,99,235,0.2)',
              color: '#1D4ED8',
              borderRadius: 14,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {btnText}
          </button>
        ))}
      </div>

      {/* Bot Input Bar */}
      <div style={{
        padding: '12px 14px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <input
          type="text"
          placeholder="Ask AI Assistant about vacancies..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 13,
            color: '#0F172A',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          style={{
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            color: '#FFF',
            border: 'none',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
            opacity: !inputText.trim() ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
