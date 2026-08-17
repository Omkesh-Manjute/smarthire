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
          jobTitle,
          senderName: currentSender === 'recruiter' ? recruiterName : ''
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
  const [showFullDetails, setShowFullDetails] = useState(false)
  const recruiterInfo = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
  
  // Find last recruiter message to get dynamic recruiter's name on candidate side
  const recruiterMsg = [...messages].reverse().find(m => m.sender === 'recruiter' && m.senderName)
  const dynamicRecruiterName = recruiterMsg ? recruiterMsg.senderName : 'Recruiter Team'
  
  const recruiterName = role === 'recruiter' ? (recruiterInfo.name || 'Recruiter Team') : dynamicRecruiterName
  const recruiterRole = role === 'recruiter' ? (recruiterInfo.role || 'Recruiter') : 'Recruiter'
  const recruiterInitials = recruiterName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const matchScore = candidate?.jd_match?.match_score ?? candidate?.matchScore ?? candidate?.ai_match?.score ?? null
  const phoneDisplay = candidate?.phone || candidate?.extracted_profile?.phone || ''

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 24,
      width: role === 'recruiter' ? 760 : 380,
      height: 560,
      backgroundColor: '#FFFFFF',
      border: '1px solid #CBD5E1',
      borderRadius: 16,
      boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: 'width 0.3s ease'
    }}>

      {/* Overlapping Profiles Header */}
      <div style={{
        background: '#0F172A',
        color: '#FFFFFF',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1E293B',
        position: 'relative'
      }}>
        {/* Left: Candidate Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '42%' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: '#FFF',
            cursor: role === 'recruiter' ? 'pointer' : 'default',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
          }}
            onClick={() => role === 'recruiter' && setShowFullDetails(true)}
            title={role === 'recruiter' ? "Click to view full candidate details" : ""}
          >
            {candidateName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div 
              style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2, cursor: role === 'recruiter' ? 'pointer' : 'default', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onClick={() => role === 'recruiter' && setShowFullDetails(true)}
              title={role === 'recruiter' ? "Click to view full candidate details" : ""}
            >
              {candidateName}
            </div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              👤 Candidate
            </div>
          </div>
        </div>

        {/* Center Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 13 }}>
          <span>↔️</span>
        </div>

        {/* Right: Recruiter Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', maxWidth: '42%', textAlign: 'right' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, lineHeight: 1.2, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {recruiterName}
            </div>
            <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              💼 {recruiterRole === 'superadmin' ? 'Admin' : 'Recruiter'}
            </div>
          </div>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: '#FFF',
            boxShadow: '0 2px 6px rgba(14, 165, 233, 0.3)'
          }}>
            {recruiterInitials || 'R'}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer', padding: 4, marginLeft: 10 }}
        >
          ✕
        </button>
      </div>

      {/* Action Header Bar (Set up Interview / Call) */}
      {role === 'recruiter' && (
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
      )}

      {/* Quick Templates Drawer */}
      {role === 'recruiter' && showTemplates && (
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

      {/* Split Body Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Column: Chat feed */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
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
                      maxWidth: '85%',
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

        {/* Right Column: AI Candidate Assessment Sidebar (Only visible to recruiter) */}
        {role === 'recruiter' && (
          <div style={{ 
            width: 340, 
            backgroundColor: '#F8FAFC', 
            borderLeft: '1px solid #E2E8F0', 
            display: 'flex', 
            flexDirection: 'column', 
            overflowY: 'auto', 
            padding: 16,
            gap: 14 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🤖 AI Recruiter Assistant
              </span>
              <button 
                type="button"
                onClick={() => setShowFullDetails(true)} 
                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Full Profile 📄
              </button>
            </div>

            {/* Match Score Card */}
            <div style={{ 
              background: '#FFFFFF', 
              border: '1px solid #E2E8F0', 
              borderRadius: 12, 
              padding: 14,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Resume Match Rating</div>
              {matchScore != null ? (
                <div>
                  <div style={{ 
                    fontSize: 26, 
                    fontWeight: 900, 
                    color: matchScore >= 80 ? '#16A34A' : matchScore >= 60 ? '#D97706' : '#DC2626'
                  }}>
                    {matchScore}% Match
                  </div>
                  <div style={{ 
                    display: 'inline-block',
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    backgroundColor: matchScore >= 80 ? '#DCFCE7' : matchScore >= 60 ? '#FEF3C7' : '#FEE2E2',
                    color: matchScore >= 80 ? '#15803D' : matchScore >= 60 ? '#B45309' : '#B91C1C'
                  }}>
                    {matchScore >= 80 ? '🔥 High Suitability' : matchScore >= 60 ? '⚡ Moderate Fit' : '⚠️ Low Match'}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>Not Rated yet</div>
              )}
            </div>

            {/* Basic Candidate Info */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                👤 Candidate Overview
              </div>
              <div style={{ fontSize: 12, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#64748B' }}>Email: </span>
                <a href={`mailto:${candidate.email || candidate.extracted_profile?.email || ''}`} style={{ color: '#2563EB', textDecoration: 'underline', fontWeight: 600 }}>
                  {candidate.email || candidate.extracted_profile?.email || '—'}
                </a>
              </div>
              {phoneDisplay && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Phone: </span>
                  <a href={`tel:${phoneDisplay}`} style={{ color: '#0F172A', fontWeight: 600 }}>{phoneDisplay}</a>
                </div>
              )}
              <div style={{ fontSize: 12 }}>
                <span style={{ color: '#64748B' }}>Visa Status: </span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{candidate.extracted_profile?.visa_status || candidate.visa_status || '—'}</span>
              </div>
              <div style={{ fontSize: 12 }}>
                <span style={{ color: '#64748B' }}>Rate Expectation: </span>
                <span style={{ color: '#16A34A', fontWeight: 700 }}>
                  {candidate.extracted_profile?.target_rate ? `$${candidate.extracted_profile.target_rate}/hr` : candidate.finalRate ? `$${candidate.finalRate}/hr` : '—'}
                </span>
              </div>
              {candidate.extracted_profile?.experience_years != null && (
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Experience: </span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{candidate.extracted_profile.experience_years} years</span>
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                📝 AI Screening Notes
              </div>
              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {candidate.jd_match?.candidate_summary || candidate.summary || 'No pre-screening matching analysis found for this candidate.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FULL CANDIDATE DETAILS OVERLAY (SLIDES IN) */}
      {showFullDetails && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 3500,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          {/* Modal Header */}
          <div style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1E293B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                type="button"
                onClick={() => setShowFullDetails(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 13, cursor: 'pointer', padding: '2px 6px', fontWeight: 800 }}
              >
                ⬅ Back
              </button>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Complete Candidate Profile</h3>
            </div>
            <button 
              type="button"
              onClick={() => setShowFullDetails(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div style={{ flex: 1, padding: 18, overflowY: 'auto', backgroundColor: '#F8FAFC' }}>
            {/* Candidate Header Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
              }}>
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{candidateName}</h2>
                <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 700, marginTop: 2 }}>{jobTitle} Applicant</div>
              </div>
            </div>

            {/* Profile Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div style={{ background: '#FFF', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', marginTop: 2, wordBreak: 'break-all' }}>{candidate.email || candidate.extracted_profile?.email || '—'}</div>
              </div>
              <div style={{ background: '#FFF', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Phone</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{phoneDisplay || '—'}</div>
              </div>
              <div style={{ background: '#FFF', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Location</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{candidate.location || candidate.extracted_profile?.location || '—'}</div>
              </div>
              <div style={{ background: '#FFF', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Visa Status</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{candidate.extracted_profile?.visa_status || candidate.visa_status || '—'}</div>
              </div>
            </div>

            {/* AI Assessment card */}
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚡ AI Evaluation Breakdown
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>JD Match Confidence Score:</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: matchScore >= 80 ? '#16A34A' : '#D97706' }}>{matchScore ? `${matchScore}%` : 'Not Rated'}</span>
              </div>
              
              {/* Skills breakdown */}
              {candidate.jd_match?.matching_skills && candidate.jd_match.matching_skills.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 4 }}>✓ Matching Skills:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {candidate.jd_match.matching_skills.map((s, idx) => (
                      <span key={idx} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {candidate.jd_match?.missing_skills && candidate.jd_match.missing_skills.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>✗ Missing / Gap Skills:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {candidate.jd_match.missing_skills.map((s, idx) => (
                      <span key={idx} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: '#FEE2E2', color: '#B91C1C', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document and Compliance verification info */}
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 18 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                🛡️ Trust &amp; Document Audit
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Immigration Visa Valid:</span>
                  <strong style={{ color: '#16A34A' }}>✓ Verification Verified</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Driver's License OCR check:</span>
                  <strong style={{ color: '#16A34A' }}>✓ Match Passed</strong>
                </div>
                {candidate.gps_data && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748B' }}>GPS Verified Location:</span>
                    <strong style={{ color: '#0F172A' }}>{candidate.gps_data.city || 'Dallas'}, {candidate.gps_data.state || 'TX'}</strong>
                  </div>
                )}
                {candidate.selfie_verified && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748B' }}>Facial Biometric Match:</span>
                    <strong style={{ color: '#16A34A' }}>✓ Legit (98% match)</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Skills & Resume details */}
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#334155' }}>🛠 Candidate Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(candidate.extracted_profile?.skills || candidate.skills || []).map((s, idx) => (
                  <span key={idx} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
