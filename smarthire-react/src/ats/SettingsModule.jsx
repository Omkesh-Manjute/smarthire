import React, { useState, useEffect } from 'react'

function SettingsModule() {
  const [companyName, setCompanyName] = useState('SmartHire Inc.')
  const [companyEmail, setCompanyEmail] = useState('hr@smarthire.ai')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [autoMatch, setAutoMatch] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [matchThreshold, setMatchThreshold] = useState(60)
  const [savedToast, setSavedToast] = useState(false)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [chatToggling, setChatToggling] = useState(false)

  // Staffing policies & Persona
  const [minMargin, setMinMargin] = useState(12)
  const [targetMargin, setTargetMargin] = useState(15)
  const [minPayRate, setMinPayRate] = useState(50)
  const [preferredEmploymentTypes, setPreferredEmploymentTypes] = useState(['W2', 'C2C'])
  const [recruiterName, setRecruiterName] = useState('Copilot')
  const [recruiterTone, setRecruiterTone] = useState('Friendly & Personal')
  const [evaluationStrictness, setEvaluationStrictness] = useState('Balanced')

  const [stages, setStages] = useState([
    'New', 'Matched', 'Submitted', 'Interview', 'Offer', 'Placed', 'Rejected'
  ])
  const [newStage, setNewStage] = useState('')

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
    fetchSiteSettings()
  }, [])

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.success && data.settings) {
        setChatEnabled(data.settings.chatEnabled !== false)
      }
    } catch (e) { /* offline */ }
  }

  const handleChatToggle = async () => {
    setChatToggling(true)
    const newVal = !chatEnabled
    setChatEnabled(newVal)
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatEnabled: newVal })
      })
    } catch (e) { console.error('Failed to save chat setting:', e) }
    setChatToggling(false)
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/recruiter/settings')
      const data = await res.json()
      if (data.success && data.settings) {
        setMinMargin(data.settings.minMargin || 12)
        setTargetMargin(data.settings.targetMargin || 15)
        setMinPayRate(data.settings.minPayRate || 50)
        setPreferredEmploymentTypes(data.settings.preferredEmploymentTypes || ['W2', 'C2C'])
        setRecruiterName(data.settings.recruiterName || 'Copilot')
        setRecruiterTone(data.settings.recruiterTone || 'Friendly & Personal')
        setEvaluationStrictness(data.settings.evaluationStrictness || 'Balanced')
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/recruiter/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            minMargin,
            targetMargin,
            minPayRate,
            preferredEmploymentTypes,
            recruiterName,
            recruiterTone,
            evaluationStrictness
          }
        })
      })
      const data = await res.json()
      if (data.success) {
        setSavedToast(true)
        setTimeout(() => setSavedToast(false), 2000)
      } else {
        alert('Failed to save settings')
      }
    } catch (e) {
      console.error(e)
      alert('Error saving settings')
    }
  }

  const toggleEmploymentType = (type) => {
    setPreferredEmploymentTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const addStage = () => {
    if (newStage.trim() && !stages.includes(newStage.trim())) {
      setStages(prev => [...prev.slice(0, -1), newStage.trim(), prev[prev.length - 1]])
      setNewStage('')
    }
  }

  const removeStage = (stageToRemove) => {
    if (['New', 'Rejected'].includes(stageToRemove)) {
      alert('Cannot remove required stages (New, Rejected).')
      return
    }
    setStages(prev => prev.filter(s => s !== stageToRemove))
  }

  return (
    <div className="settings-module-layout">
      <div className="settings-header">
        <div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans' }}>⚙️ ATS Settings</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
            Configure your ATS workspace preferences, pipeline stages, and staffing margin rules.
          </p>
        </div>
        {savedToast && (
          <div className="settings-toast">✅ Settings saved successfully!</div>
        )}
      </div>

      <div className="settings-grid">
        {/* Company Profile */}
        <article className="card settings-card">
          <h4 className="settings-card-title">🏢 Company Profile</h4>
          <div className="settings-form">
            <div className="select-wrapper">
              <label>Company Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <div className="select-wrapper">
              <label>Contact Email</label>
              <input
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="hr@company.com"
                type="email"
              />
            </div>
            <div className="select-wrapper">
              <label>Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Europe/London">UK (GMT)</option>
              </select>
            </div>
          </div>
        </article>

        {/* Staffing Policy & Margin Configuration */}
        <article className="card settings-card">
          <h4 className="settings-card-title">💵 US Staffing & Negotiation Rules</h4>
          <div className="settings-form">
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="select-wrapper" style={{ flex: 1 }}>
                <label>Min Margin ($/hr)</label>
                <input
                  type="number"
                  value={minMargin}
                  onChange={(e) => setMinMargin(Number(e.target.value) || 0)}
                  placeholder="e.g. 12"
                />
              </div>
              <div className="select-wrapper" style={{ flex: 1 }}>
                <label>Target Margin ($/hr)</label>
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value) || 0)}
                  placeholder="e.g. 15"
                />
              </div>
            </div>

            <div className="select-wrapper">
              <label>Min Candidate Pay Floor ($/hr)</label>
              <input
                type="number"
                value={minPayRate}
                onChange={(e) => setMinPayRate(Number(e.target.value) || 0)}
                placeholder="e.g. 50"
              />
            </div>

            <div className="select-wrapper" style={{ marginTop: 10 }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6 }}>Preferred Contract Types</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {['W2', 'C2C', '1099'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={preferredEmploymentTypes.includes(type)}
                      onChange={() => toggleEmploymentType(type)}
                      style={{ accentColor: 'var(--brand)' }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Automation Settings */}
        <article className="card settings-card">
          <h4 className="settings-card-title">🤖 Automation Settings</h4>
          <div className="settings-form">
            <div className="settings-toggle-row">
              <div>
                <strong>Auto-Match Candidates</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-soft)' }}>
                  Automatically match incoming candidates to active jobs using AI
                </p>
              </div>
              <button
                className={`settings-toggle ${autoMatch ? 'active' : ''}`}
                onClick={() => setAutoMatch(!autoMatch)}
              >
                <span className="settings-toggle-dot" />
              </button>
            </div>
            <div className="settings-toggle-row">
              <div>
                <strong>Email Notifications</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-soft)' }}>
                  Send notifications when new candidates arrive or statuses change
                </p>
              </div>
              <button
                className={`settings-toggle ${emailNotifications ? 'active' : ''}`}
                onClick={() => setEmailNotifications(!emailNotifications)}
              >
                <span className="settings-toggle-dot" />
              </button>
            </div>
            <div className="select-wrapper">
              <label>Minimum Match Score Threshold: {matchThreshold}%</label>
              <input
                type="range"
                min="30"
                max="95"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)' }}>
                <span>30%</span>
                <span>95%</span>
              </div>
            </div>
          </div>
        </article>

        {/* AI Recruiter Persona & Strategy (From Video Demo) */}
        <article className="card settings-card" style={{ gridColumn: 'span 2' }}>
          <h4 className="settings-card-title">🤖 AI Recruiter Persona & Sourcing Strategy</h4>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
            Customize how your AI Recruiter introduces itself, communicates with candidates, and evaluates technical skills.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Recruiter Name */}
            <div className="select-wrapper">
              <label>AI Recruiter Display Name</label>
              <input
                type="text"
                value={recruiterName}
                onChange={(e) => setRecruiterName(e.target.value)}
                placeholder="e.g. Copilot, Lucy, David"
              />
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
                Name used by the AI when greeting candidates (e.g. "Hi, I am {recruiterName}")
              </span>
            </div>

            {/* Conversation Tone */}
            <div className="select-wrapper">
              <label>Conversational Tone</label>
              <select value={recruiterTone} onChange={(e) => setRecruiterTone(e.target.value)}>
                <option value="Friendly & Personal">😊 Friendly & Personal (Warm, conversational, engaging)</option>
                <option value="Professional & Formal">💼 Professional & Formal (Structured, corporate, direct)</option>
                <option value="Concise & Efficient">⚡ Concise & Efficient (Fast, focused on qualifications)</option>
              </select>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
                Determines how conversational or concise the AI recruiter sounds
              </span>
            </div>

            {/* Evaluation Strictness */}
            <div className="select-wrapper">
              <label>Evaluation Strictness</label>
              <select value={evaluationStrictness} onChange={(e) => setEvaluationStrictness(e.target.value)}>
                <option value="Lenient">🌱 Lenient (Focus on transferable skills and growth potential)</option>
                <option value="Balanced">⚖️ Balanced (Evaluate required skills with reasonable flexibility)</option>
                <option value="Strict">🎯 Strict (Require exact skill match and extensive experience)</option>
              </select>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
                Controls how strictly the AI scores candidate suitability against job requirements
              </span>
            </div>
          </div>
        </article>

        {/* Pipeline Stages */}
        <article className="card settings-card" style={{ gridColumn: 'span 2' }}>
          <h4 className="settings-card-title">🔄 Pipeline Stage Configuration</h4>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
            Customize the stages in your candidate pipeline. Drag to reorder (coming soon).
          </p>
          <div className="pipeline-stages-config">
            {stages.map((stage, i) => (
              <div key={stage} className="stage-config-item">
                <span className="stage-config-number">{i + 1}</span>
                <span className="stage-config-name">{stage}</span>
                {!['New', 'Rejected'].includes(stage) && (
                  <button
                    className="stage-config-remove"
                    onClick={() => removeStage(stage)}
                    title="Remove stage"
                  >
                    ×
                  </button>
                )}
                {i < stages.length - 1 && <span className="stage-config-arrow">→</span>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input
              placeholder="Add custom stage..."
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStage()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-sm" onClick={addStage} disabled={!newStage.trim()}>
              + Add Stage
            </button>
          </div>
        </article>

        {/* Feature Flags */}
        <article className="card settings-card">
          <h4 className="settings-card-title">⚡ Feature Flags</h4>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Toggle platform features on or off. Changes take effect immediately across the public portal.
          </p>
          {/* Chat Feature Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2, rgba(0,0,0,0.04))', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-primary)' }}>💬 Candidate Messaging / Chat</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.5 }}>Allow candidates to message recruiters through the careers portal. When off, chat buttons are hidden.</div>
            </div>
            <button
              onClick={handleChatToggle}
              disabled={chatToggling}
              title={chatEnabled ? 'Click to disable candidate chat' : 'Click to enable candidate chat'}
              style={{
                width: 52, height: 28, borderRadius: 14, border: 'none', cursor: chatToggling ? 'not-allowed' : 'pointer',
                background: chatEnabled ? 'linear-gradient(135deg,#16A34A,#22C55E)' : '#94A3B8',
                position: 'relative', transition: 'background 0.25s', flexShrink: 0, marginLeft: 16,
                boxShadow: chatEnabled ? '0 2px 8px rgba(22,163,74,0.3)' : 'none'
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: chatEnabled ? 26 : 3,
                width: 22, height: 22, borderRadius: '50%', background: '#FFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.22s ease'
              }} />
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: chatEnabled ? '#16A34A' : '#94A3B8', fontWeight: 600, textAlign: 'right' }}>
            {chatEnabled ? '✅ Chat is ENABLED — candidates can message recruiters' : '🔴 Chat is DISABLED — hidden from public portal'}
          </div>
        </article>

        {/* Company Profile */}
        <article className="card settings-card">
          <h4 className="settings-card-title">✉️ Email Templates</h4>
          <div className="settings-form">
            <div className="email-template-item">
              <div className="email-template-header">
                <strong>Candidate Submission</strong>
                <span className="pill trusted" style={{ fontSize: 10 }}>Active</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 0' }}>
                Sent when a candidate is submitted to a client
              </p>
            </div>
            <div className="email-template-item">
              <div className="email-template-header">
                <strong>Interview Invitation</strong>
                <span className="pill trusted" style={{ fontSize: 10 }}>Active</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 0' }}>
                Sent when a candidate is scheduled for interview
              </p>
            </div>
            <div className="email-template-item">
              <div className="email-template-header">
                <strong>Rejection Notice</strong>
                <span className="pill review" style={{ fontSize: 10 }}>Draft</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 0' }}>
                Sent when a candidate is rejected from the pipeline
              </p>
            </div>
          </div>
        </article>

        {/* Data Export */}
        <article className="card settings-card">
          <h4 className="settings-card-title">📥 Data Export</h4>
          <div className="settings-form">
            <div className="export-option">
              <div>
                <strong>Export All Candidates</strong>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>Download complete candidate database as CSV</p>
              </div>
              <button className="btn btn-sm btn-ghost">📥 Export</button>
            </div>
            <div className="export-option">
              <div>
                <strong>Export Submissions</strong>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>Download all submission records as CSV</p>
              </div>
              <button className="btn btn-sm btn-ghost">📥 Export</button>
            </div>
            <div className="export-option">
              <div>
                <strong>Export Job Listings</strong>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>Download active and closed job postings</p>
              </div>
              <button className="btn btn-sm btn-ghost">📥 Export</button>
            </div>
          </div>
        </article>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn" onClick={handleSave} style={{ padding: '12px 32px', fontSize: 15 }}>
          💾 Save All Settings
        </button>
      </div>
    </div>
  )
}

export default SettingsModule
