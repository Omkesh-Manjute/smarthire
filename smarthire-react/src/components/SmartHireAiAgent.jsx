import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Gemini Cloud Sparkle SVG Glyph ──────────────────────────────────────────
export const IconGeminiSparkle = ({ size = 20, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <defs>
      <linearGradient id="geminiAuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
    </defs>
    {/* Central 4-pointed Gemini Star */}
    <path d="M12 2L14.2 8.2L20.4 10.4L14.2 12.6L12 18.8L9.8 12.6L3.6 10.4L9.8 8.2L12 2Z" fill="url(#geminiAuraGrad)" />
    {/* Secondary Accent Star */}
    <path d="M18.5 16L19.5 18.5L22 19.5L19.5 20.5L18.5 23L17.5 20.5L15 19.5L17.5 18.5L18.5 16Z" fill="#38BDF8" />
    {/* Micro Accent Sparkle */}
    <path d="M6 16.5L6.6 18L8.1 18.6L6.6 19.2L6 20.7L5.4 19.2L3.9 18.6L5.4 18L6 16.5Z" fill="#C084FC" />
  </svg>
);

export default function SmartHireAiAgent({
  isOpen,
  onClose,
  pageContext = {},
  onExecuteAction = null
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: pageContext?.page?.includes('submittal')
        ? `Hi Omkesh! I'm your **SmartHire AI Copilot** (Gemini Agent).\n\nI understand you are working on the **Submittal Pack** for **${pageContext?.candidate?.name || 'Selected Candidate'}** (#${pageContext?.job?.vmsNumber || '159260'}).\n\nAsk me to:\n• *Rewrite summary to highlight Azure cloud architectures*\n• *Switch to Nebraska State template*\n• *Change proposed rate to $80/hr*\n• *Align technical skills with the job requisition*`
        : `Hi Omkesh! I'm your **SmartHire AI Copilot** (Gemini Agent).\n\nI am connected to your entire ATS candidate pool. You can:\n• Paste a Job Description (JD) and say *"Find best match for this requirement"*\n• Ask *"Find 10+ years Java developers in Texas"*\n• Say *"Find top DevOps engineers with Kubernetes"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const authToken = localStorage.getItem('smarthire_token') || localStorage.getItem('token') || '';
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          prompt: query,
          pageContext,
          history: messages.slice(-4).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Request processed successfully.',
          action: data.action || null,
          matchedCandidates: data.matchedCandidates || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, assistantMsg]);

        // Auto execute client-side action if provided
        if (data.action && onExecuteAction) {
          onExecuteAction(data.action);
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${data.message || 'Unable to complete AI request. Please try again.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('AI Agent Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Network connection error with AI Copilot engine.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectMatchedCandidate = (cand) => {
    if (pageContext?.page?.includes('submittal')) {
      if (onExecuteAction) {
        onExecuteAction({ type: 'SELECT_CANDIDATE', candidateId: cand.id, candidateName: cand.name });
      }
    } else {
      navigate(`/submittal-pack?candidateId=${cand.id}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  const quickPrompts = pageContext?.page?.includes('submittal')
    ? [
        '⚡ Rewrite summary for Cloud JD',
        '🏛️ Switch to Nebraska template',
        '💵 Change proposed rate to $80',
        '🎯 Align skills with req #159260'
      ]
    : [
        '🔍 Find best match for Azure Cloud',
        '📋 Match candidate with 10+ yrs exp',
        '🌟 Top Java Spring Boot developers',
        '📍 Candidates in North Carolina'
      ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '92vw',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        zIndex: 99999,
        boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        borderLeft: '1px solid rgba(148, 163, 184, 0.15)',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .ai-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .ai-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
          border-radius: 4px;
        }
      `}</style>

      {/* ─── Header ─── */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconGeminiSparkle size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                SmartHire AI Copilot
              </span>
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(168, 85, 247, 0.35)', color: '#E9D5FF', fontWeight: 800 }}>
                GEMINI
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
              {pageContext?.page?.includes('submittal')
                ? `Active: Submittal Pack (${pageContext?.candidate?.name || 'Candidate'})`
                : 'Active: Candidate Pool Intelligence'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: 18,
            width: 30,
            height: 30,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          title="Close AI Assistant"
        >
          ✕
        </button>
      </div>

      {/* ─── Messages Stream ─── */}
      <div
        className="ai-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '100%'
              }}
            >
              <div
                style={{
                  maxWidth: '92%',
                  padding: '10px 14px',
                  borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  backgroundColor: isUser ? '#2563EB' : 'rgba(30, 41, 59, 0.75)',
                  border: isUser ? 'none' : '1px solid rgba(148, 163, 184, 0.15)',
                  color: isUser ? '#FFFFFF' : '#E2E8F0',
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Render formatted Markdown-like bold and bullet points */}
                {m.content.split('\n').map((line, idx) => {
                  let formatted = line;
                  // Handle bold **text**
                  const parts = formatted.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <div key={idx} style={{ marginBottom: line.trim() ? 3 : 6 }}>
                      {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pIdx} style={{ color: isUser ? '#FFFFFF' : '#38BDF8' }}>{part.slice(2, -2)}</strong>;
                        }
                        if (part.startsWith('•') || part.startsWith('* ')) {
                          return <span key={pIdx} style={{ color: '#F1F5F9' }}>• {part.replace(/^[•*]\s*/, '')}</span>;
                        }
                        return part;
                      })}
                    </div>
                  );
                })}

                {/* If Action was executed, show notification badge */}
                {m.action && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#6EE7B7',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>✓</span>
                    <span>
                      Action Executed:{' '}
                      {m.action.type === 'SWITCH_TEMPLATE' ? `Switched template to ${m.action.value}` : 
                       m.action.type === 'UPDATE_RATE' ? `Proposed rate updated to ${m.action.value}` :
                       m.action.type === 'SELECT_CANDIDATE' ? `Selected candidate ${m.action.candidateName || ''}` :
                       'Page parameters updated successfully'}
                    </span>
                  </div>
                )}

                {/* If Matched Candidates were returned, show interactive cards */}
                {m.matchedCandidates && m.matchedCandidates.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Top Matching Candidates ({m.matchedCandidates.length}):
                    </div>
                    {m.matchedCandidates.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: 13 }}>
                            {c.name}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: c.matchScore >= 80 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.25)',
                              color: c.matchScore >= 80 ? '#6EE7B7' : '#7DD3FC',
                              border: `1px solid ${c.matchScore >= 80 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                            }}
                          >
                            {c.matchScore}% Match
                          </span>
                        </div>

                        <div style={{ fontSize: 11.5, color: '#94A3B8' }}>
                          {c.role} • {c.experience} • {c.location}
                        </div>

                        {c.matchedSkills && c.matchedSkills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                            {c.matchedSkills.map((sk, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  fontSize: 9.5,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: 'rgba(148, 163, 184, 0.15)',
                                  color: '#CBD5E1',
                                  fontWeight: 600
                                }}
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleSelectMatchedCandidate(c)}
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: '#2563EB',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6
                            }}
                          >
                            <span>🚀</span> Open in Submittal Pack
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 9.5, color: '#64748B', marginTop: 3, padding: '0 4px' }}>
                {m.timestamp}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: 10, alignSelf: 'flex-start' }}>
            <IconGeminiSparkle size={16} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
              Gemini Agent is thinking & analyzing context...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Quick Suggestion Chips ─── */}
      <div
        style={{
          padding: '6px 14px',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
        className="ai-scrollbar"
      >
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(p)}
            style={{
              padding: '4px 10px',
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#CBD5E1',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.25)'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)'; e.currentTarget.style.color = '#CBD5E1'; }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ─── Input & Send ─── */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          background: 'rgba(15, 23, 42, 0.95)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: 8,
            padding: '4px 8px'
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              pageContext?.page?.includes('submittal')
                ? "Ask to rewrite summary, change rate, switch template..."
                : "Paste JD or ask to find best matching candidate..."
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: 12.5,
              resize: 'none',
              padding: '6px 4px',
              fontFamily: 'inherit',
              maxHeight: '80px'
            }}
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              background: inputValue.trim() ? '#2563EB' : 'rgba(148, 163, 184, 0.2)',
              border: 'none',
              borderRadius: 6,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            title="Send query to SmartHire AI Agent"
          >
            ➤
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, padding: '0 4px' }}>
          <span style={{ fontSize: 10, color: '#64748B' }}>
            Press Enter ↵ to send • Shift+Enter for new line
          </span>
          <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 600 }}>
            Powered by Groq & Gemini
          </span>
        </div>
      </div>
    </div>
  );
}
