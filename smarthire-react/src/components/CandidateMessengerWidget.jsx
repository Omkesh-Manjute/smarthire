import React, { useState, useEffect, useRef } from 'react'

export default function CandidateMessengerWidget({ candidate, role = 'candidate', onClose, onScheduleInterview }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const messagesEndRef = useRef(null)

  const candidateId = candidate?.id || candidate?.sessionId || 'CAND-DEFAULT'
  const candidateName = candidate?.extracted_profile?.name || candidate?.name || candidate?.candidateName || 'Candidate'
  const jobTitle = candidate?.job_title || candidate?.jobTitle || 'Vacancy'
  const currentSender = role === 'candidate' ? 'candidate' : 'recruiter'

  const quickTemplates = [
    `I've reviewed your resume for ${jobTitle} and have some questions. Do you have time for a quick call?`,
    `Thanks for your interest in the ${jobTitle} position! I'd like to set up a technical interview. What is your availability this week?`,
    `Could you please confirm your current work authorization status (US Citizen / GC / H1B) and notice period?`,
    `Great speaking with you! We are moving your profile forward for client submission.`
  ]

  useEffect(() => {
    if (candidateId) {
      fetchMessages()
      const interval = setInterval(() => {
        fetchMessages(true)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [candidateId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true)
    const localKey = `smarthire_chat_${candidateId}`
    const savedLocal = localStorage.getItem(localKey)
    let initialList = savedLocal ? JSON.parse(savedLocal) : []

    try {
      const res = await fetch(`/api/messages/${candidateId}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages)
        localStorage.setItem(localKey, JSON.stringify(data.messages))
        if (!silent) setLoading(false)
        return
      }
    } catch (e) {
      console.warn('Backend message fetch offline, using local store:', e)
    }

    if (initialList.length === 0) {
      initialList = [
        {
          id: 'init-1',
          sender: 'recruiter',
          text: `Hi ${candidateName}, thank you for applying to the ${jobTitle} position! Our recruiting team is reviewing your profile.`,
          timestamp: new Date().toISOString()
        }
      ]
      localStorage.setItem(localKey, JSON.stringify(initialList))
    }
    setMessages(initialList)
    if (!silent) setLoading(false)
  }

  const handleSendMessage = async (textToSend) => {
    const msgText = (textToSend || inputText).trim()
    if (!msgText) return

    setSending(true)
    const localKey = `smarthire_chat_${candidateId}`
    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: currentSender,
      text: msgText,
      timestamp: new Date().toISOString()
    }

    // Optimistically update UI
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    localStorage.setItem(localKey, JSON.stringify(updatedMessages))
    setInputText('')
    setShowTemplates(false)

    try {
      const res = await fetch(`/api/messages/${candidateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentSender,
          text: msgText,
          candidateName,
          jobTitle
        })
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.thread)) {
        setMessages(data.thread)
        localStorage.setItem(localKey, JSON.stringify(data.thread))
      }
    } catch (e) {
      console.warn('Backend sync failed, saved locally:', e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 24,
      width: 380,
      height: 520,
      backgroundColor: '#FFFFFF',
      border: '1px solid #CBD5E1',
      borderRadius: 16,
      boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>

      {/* Indeed Style Messenger Header */}
      <div style={{
        background: '#0F172A',
        color: '#FFFFFF',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1E293B'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 800,
            color: '#FFF'
          }}>
            {candidateName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>{candidateName}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
              Applied for {jobTitle}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer', padding: 4 }}
        >
          ✕
        </button>
      </div>

      {/* Action Header Bar (Set up Interview / Call) */}
      <div style={{
        background: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        padding: '8px 12px',
        display: 'flex',
        gap: 6
      }}>
        <button
          onClick={() => {
            if (onScheduleInterview) onScheduleInterview(candidate)
            else handleSendMessage(`🗓️ I would like to schedule an interview with you for ${jobTitle}. Please let me know your available time slots.`)
          }}
          style={{
            flex: 1,
            background: '#2563EB',
            color: '#FFF',
            border: 'none',
            borderRadius: 6,
            padding: '6px 0',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
          }}
        >
          🗓️ Schedule Interview
        </button>

        <button
          onClick={() => setShowTemplates(!showTemplates)}
          style={{
            background: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #BFDBFE',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          📑 Templates
        </button>
      </div>

      {/* Quick Templates Drawer */}
      {showTemplates && (
        <div style={{
          background: '#EFF6FF',
          borderBottom: '1px solid #BFDBFE',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxHeight: 160,
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>Quick Reply Templates:</div>
          {quickTemplates.map((t, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(t)}
              style={{
                textAlign: 'left',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 11,
                color: '#334155',
                cursor: 'pointer',
                lineHeight: 1.4
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Messages Thread Body */}
      <div style={{
        flex: 1,
        padding: 14,
        overflowY: 'auto',
        background: '#F1F5F9',
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: 12, marginTop: 40 }}>
            Loading message thread...
          </div>
        ) : (
          messages.map((m, idx) => {
            const isRecruiter = m.sender === 'recruiter'
            return (
              <div
                key={m.id || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isRecruiter ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  backgroundColor: isRecruiter ? '#2563EB' : '#FFFFFF',
                  color: isRecruiter ? '#FFFFFF' : '#0F172A',
                  padding: '9px 13px',
                  borderRadius: isRecruiter ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: isRecruiter ? 'none' : '1px solid #E2E8F0'
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: 9, color: '#94A3B8', marginTop: 3, padding: '0 4px' }}>
                  {isRecruiter ? 'You' : candidateName} · {new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage() }}
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: 10,
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${candidateName}...`}
          style={{
            flex: 1,
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 20,
            padding: '8px 14px',
            fontSize: 12.5,
            outline: 'none',
            color: '#0F172A'
          }}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          style={{
            backgroundColor: '#2563EB',
            color: '#FFF',
            border: 'none',
            borderRadius: 20,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            cursor: (sending || !inputText.trim()) ? 'not-allowed' : 'pointer',
            opacity: (sending || !inputText.trim()) ? 0.5 : 1
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
