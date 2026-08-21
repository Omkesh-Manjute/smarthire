const ALL_SMARTHIRE_RECRUITERS = [
  { name: 'Omkesh Manjute', email: 'omkesh.manjute@smarthire.com', refCode: 'omkesh' },
  { name: 'Vaibhav Bisen', email: 'vaibhav.bisen@smarthire.com', refCode: 'vaibhav-bisen' },
  { name: 'Sukamal Chatterjee', email: 'sukamal.c@smarthire.com', refCode: 'sukamal-chatterjee' },
  { name: 'Prudhvi Sevveti', email: 'prudhvi.s@smarthire.com', refCode: 'prudhvi-sevveti' },
  { name: 'Nitin Bhosale', email: 'nitin.b@smarthire.com', refCode: 'nitin-bhosale' },
  { name: 'Naveen Korimelli', email: 'naveen.k@smarthire.com', refCode: 'naveen-korimelli' },
  { name: 'Ajay Arya', email: 'ajay.a@smarthire.com', refCode: 'ajay-arya' },
  { name: 'Raj Barve', email: 'raj.b@smarthire.com', refCode: 'raj-barve' },
  { name: 'Pankaj Maharwade', email: 'pankaj.m@smarthire.com', refCode: 'pankaj-maharwade' },
  { name: 'Nishant Kathane', email: 'nishant.k@smarthire.com', refCode: 'nishant-kathane' }
]

function getInitialRecruiterEmail() {
  try {
    const raw = localStorage.getItem('smarthire_user')
    if (raw) {
      const u = JSON.parse(raw)
      const found = ALL_SMARTHIRE_RECRUITERS.find(r => 
        (u.email && r.email.toLowerCase() === u.email.toLowerCase()) ||
        (u.refCode && r.refCode.toLowerCase() === u.refCode.toLowerCase()) ||
        (u.name && r.name.toLowerCase().includes(u.name.toLowerCase())) ||
        (u.name && u.name.toLowerCase().includes(r.refCode.toLowerCase()))
      )
      if (found) return found.email
    }
  } catch (e) {}
  return localStorage.getItem('smarthire_current_user_email') || 'omkesh.manjute@smarthire.com'
}

function SettingsModule() {
  const [savedToast, setSavedToast] = useState(false)
  const [activeSettingsTab, setActiveSettingsTab] = useState('email')

  const [stages, setStages] = useState(['New', 'Matched', 'Submitted', 'Interview', 'Offer', 'Placed', 'Rejected'])
  const [newStage, setNewStage] = useState('')

  // Email Config State
  const [recruiterEmailKey, setRecruiterEmailKey] = useState(getInitialRecruiterEmail)
  const [emailCfg, setEmailCfg] = useState(() => {
    const initialEmail = getInitialRecruiterEmail()
    const rec = ALL_SMARTHIRE_RECRUITERS.find(r => r.email === initialEmail)
    return {
      displayName: rec ? rec.name : '',
      fromEmail: '',
      provider: 'gmail',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      security: 'TLS',
      appPassword: '',
      signature: ''
    }
  })
  const [emailCfgSaving, setEmailCfgSaving] = useState(false)
  const [emailCfgMsg, setEmailCfgMsg] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Email Templates State
  const [emailTemplates, setEmailTemplates] = useState([])
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [tplName, setTplName] = useState('')
  const [tplCategory, setTplCategory] = useState('RTR')
  const [tplSubject, setTplSubject] = useState('')
  const [tplBody, setTplBody] = useState('')

  useEffect(() => {
    fetchEmailConfig(recruiterEmailKey)
    fetchEmailTemplates()
  }, [recruiterEmailKey])

  const fetchEmailConfig = async (emailToFetch = recruiterEmailKey) => {
    try {
      const res = await fetch(`/api/recruiter/email-config?email=${encodeURIComponent(emailToFetch)}`)
      const data = await res.json()
      if (data.success && data.config) {
        setEmailCfg(prev => ({ ...prev, ...data.config }))
      } else {
        const rec = ALL_SMARTHIRE_RECRUITERS.find(r => r.email === emailToFetch)
        setEmailCfg(prev => ({
          ...prev,
          displayName: rec ? rec.name : prev.displayName,
          fromEmail: '',
          provider: 'gmail',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          security: 'TLS',
          appPassword: '',
          signature: ''
        }))
      }
    } catch(e) {}
  }

  const fetchEmailTemplates = async () => {
    try {
      const res = await fetch('/api/email-templates')
      const data = await res.json()
      if (data.success) setEmailTemplates(data.templates || [])
    } catch(e) {}
  }

  const handleSaveEmailConfig = async () => {
    setEmailCfgSaving(true)
    setEmailCfgMsg('')
    try {
      const payload = { ...emailCfg, recruiterEmail: recruiterEmailKey }
      if (emailCfg.appPassword === '••••••••••••') delete payload.appPassword
      const res = await fetch('/api/recruiter/email-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      setEmailCfgMsg(data.success ? '✅ Email configuration saved!' : `❌ ${data.message}`)
    } catch(e) { setEmailCfgMsg('❌ Network error') }
    setEmailCfgSaving(false)
    setTimeout(() => setEmailCfgMsg(''), 4000)
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    setEmailCfgMsg('')
    try {
      const res = await fetch('/api/recruiter/test-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recruiterEmail: recruiterEmailKey }) })
      const data = await res.json()
      setEmailCfgMsg(data.success ? `✅ ${data.message}` : `❌ ${data.message}`)
    } catch(e) { setEmailCfgMsg('❌ Network error') }
    setTestingEmail(false)
    setTimeout(() => setEmailCfgMsg(''), 6000)
  }

  const handleSaveTemplate = async () => {
    if (!tplName || !tplSubject || !tplBody) return alert('Name, Subject, and Body are required')
    const payload = { id: editingTemplate?.id, name: tplName, category: tplCategory, subject: tplSubject, body: tplBody }
    const res = await fetch('/api/email-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (data.success) { fetchEmailTemplates(); setEditingTemplate(null); setTplName(''); setTplSubject(''); setTplBody('') }
  }

  const handleEditTemplate = (tpl) => {
    setEditingTemplate(tpl)
    setTplName(tpl.name)
    setTplCategory(tpl.category)
    setTplSubject(tpl.subject)
    setTplBody(tpl.body)
  }

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return
    await fetch(`/api/email-templates/${id}`, { method: 'DELETE' })
    fetchEmailTemplates()
  }

  const addStage = () => {
    if (newStage.trim() && !stages.includes(newStage.trim())) {
      setStages(prev => [...prev.slice(0, -1), newStage.trim(), prev[prev.length - 1]])
      setNewStage('')
    }
  }

  const removeStage = (stageToRemove) => {
    if (['New', 'Rejected'].includes(stageToRemove)) { alert('Cannot remove required stages (New, Rejected).'); return }
    setStages(prev => prev.filter(s => s !== stageToRemove))
  }

  const PROVIDER_DEFAULTS = {
    gmail: { smtpHost: 'smtp.gmail.com', smtpPort: 587, security: 'TLS' },
    outlook: { smtpHost: 'smtp-mail.outlook.com', smtpPort: 587, security: 'TLS' },
    office365: { smtpHost: 'smtp.office365.com', smtpPort: 587, security: 'TLS' },
    yahoo: { smtpHost: 'smtp.mail.yahoo.com', smtpPort: 587, security: 'TLS' },
    custom: { smtpHost: '', smtpPort: 587, security: 'TLS' }
  }

  const TAB_BTNS = [
    { id: 'email', label: '📧 Email Config' },
    { id: 'templates', label: '📝 Email Templates' },
    { id: 'pipeline', label: '🔄 Pipeline' },
    { id: 'export', label: '📥 Export' }
  ]

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0f172a', boxSizing: 'border-box', outline: 'none' }
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }

  return (
    <div className="settings-module-layout">
      <div className="settings-header">
        <div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans' }}>⚙️ ATS Settings</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
            Configure your email settings, email templates, pipeline stages, and data export.
          </p>
        </div>
        {savedToast && <div className="settings-toast">✅ Settings saved successfully!</div>}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e2e8f0', paddingBottom: 0, flexWrap: 'wrap' }}>
        {TAB_BTNS.map(t => (
          <button key={t.id} onClick={() => setActiveSettingsTab(t.id)}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer', borderBottom: `3px solid ${activeSettingsTab === t.id ? '#2563eb' : 'transparent'}`, color: activeSettingsTab === t.id ? '#2563eb' : '#64748b', marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── EMAIL CONFIG TAB ── */}
      {activeSettingsTab === 'email' && (
        <div style={{ maxWidth: 680 }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
            <strong>📧 Per-Recruiter Email Setup</strong> — Configure your personal SMTP settings using Gmail App Password, Outlook App Password, or custom SMTP. All emails sent from SmartHire will use your configured credentials.
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22, marginBottom: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Select Recruiter Account</label>
              <select
                value={recruiterEmailKey}
                onChange={e => {
                  const newEmail = e.target.value
                  setRecruiterEmailKey(newEmail)
                }}
                style={inputStyle}
              >
                {ALL_SMARTHIRE_RECRUITERS.map(r => (
                  <option key={r.email} value={r.email}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Display Name (From Name)</label>
                <input
                  value={emailCfg.displayName}
                  onChange={e => setEmailCfg(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="e.g. John Doe / Recruiter Name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>From Email Address</label>
                <input
                  value={emailCfg.fromEmail}
                  onChange={e => setEmailCfg(p => ({ ...p, fromEmail: e.target.value }))}
                  placeholder="e.g. your.email@gmail.com"
                  type="email"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email Provider</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['gmail', 'outlook', 'office365', 'yahoo', 'custom'].map(p => (
                  <button key={p} onClick={() => setEmailCfg(prev => ({ ...prev, provider: p, ...PROVIDER_DEFAULTS[p] }))}
                    style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: '1px solid', background: emailCfg.provider === p ? '#2563eb' : '#f8fafc', color: emailCfg.provider === p ? '#fff' : '#334155', borderColor: emailCfg.provider === p ? '#2563eb' : '#cbd5e1', textTransform: 'capitalize' }}>
                    {p === 'office365' ? 'Office 365' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>SMTP Host</label>
                <input value={emailCfg.smtpHost} onChange={e => setEmailCfg(p => ({ ...p, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Port</label>
                <input type="number" value={emailCfg.smtpPort} onChange={e => setEmailCfg(p => ({ ...p, smtpPort: parseInt(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Security</label>
                <select value={emailCfg.security} onChange={e => setEmailCfg(p => ({ ...p, security: e.target.value }))} style={inputStyle}>
                  <option>TLS</option><option>SSL</option><option>STARTTLS</option><option>None</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>App Password {emailCfg.provider === 'gmail' ? '(Gmail App Password — not your Gmail password!)' : '(App-specific password)'}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type={showPassword ? 'text' : 'password'} value={emailCfg.appPassword} onChange={e => setEmailCfg(p => ({ ...p, appPassword: e.target.value }))} placeholder="xxxx xxxx xxxx xxxx" style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} />
                <button onClick={() => setShowPassword(p => !p)} style={{ padding: '8px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>{showPassword ? '🙈 Hide' : '👁 Show'}</button>
              </div>
              {emailCfg.provider === 'gmail' && (
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  💡 <strong>How to generate Gmail App Password:</strong> Go to Google Account → Security → 2-Step Verification → App Passwords → Generate new password for "Mail".
                </p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email Signature (optional)</label>
              <textarea
                rows={5}
                value={emailCfg.signature}
                onChange={e => setEmailCfg(p => ({ ...p, signature: e.target.value }))}
                placeholder={`e.g. (Demo Signature)\nJohn Doe\nTechnical Recruiter | SmartHire LLC\nPhone: (555) 000-0000\nEmail: recruiter@smarthire.com`}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {emailCfgMsg && (
              <div style={{ background: emailCfgMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${emailCfgMsg.startsWith('✅') ? '#bbf7d0' : '#fca5a5'}`, color: emailCfgMsg.startsWith('✅') ? '#15803d' : '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                {emailCfgMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveEmailConfig} disabled={emailCfgSaving}
                style={{ flex: 2, padding: '11px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                {emailCfgSaving ? '⏳ Saving...' : '💾 Save Email Config'}
              </button>
              <button onClick={handleTestEmail} disabled={testingEmail}
                style={{ flex: 1, padding: '11px 0', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {testingEmail ? '⏳ Testing...' : '📨 Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL TEMPLATES TAB ── */}
      {activeSettingsTab === 'templates' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20, alignItems: 'flex-start' }}>
            {/* Template List */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 12px' }}>📋 Saved Templates ({emailTemplates.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {emailTemplates.map(tpl => (
                  <div key={tpl.id} style={{ background: '#fff', border: `1px solid ${editingTemplate?.id === tpl.id ? '#2563eb' : '#e2e8f0'}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{tpl.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          <span style={{ background: '#f1f5f9', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{tpl.category}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEditTemplate(tpl)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 700 }}>✏️ Edit</button>
                        <button onClick={() => handleDeleteTemplate(tpl.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>🗑️</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{tpl.subject.substring(0, 60)}...</div>
                  </div>
                ))}
                <button onClick={() => { setEditingTemplate(null); setTplName(''); setTplSubject(''); setTplBody(''); setTplCategory('RTR') }}
                  style={{ padding: '10px 0', border: '2px dashed #cbd5e1', borderRadius: 10, background: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  ＋ New Template
                </button>
              </div>
            </div>

            {/* Template Editor */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>
                {editingTemplate ? `✏️ Edit: ${editingTemplate.name}` : '➕ Create New Template'}
              </h4>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Template Name</label>
                <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. RTR Agreement" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Category</label>
                <select value={tplCategory} onChange={e => setTplCategory(e.target.value)} style={inputStyle}>
                  <option>RTR</option><option>Interview</option><option>Rejection</option><option>Submission</option><option>Follow-up</option><option>Custom</option>
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Subject Line</label>
                <input value={tplSubject} onChange={e => setTplSubject(e.target.value)} placeholder="Subject with {{candidate_name}} placeholders..." style={inputStyle} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Body (use {'{{placeholders}}'} like {'{{candidate_name}}'}, {'{{job_title}}'}, {'{{recruiter_name}}'})</label>
                <textarea rows={10} value={tplBody} onChange={e => setTplBody(e.target.value)} placeholder="Dear {{candidate_name}},..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveTemplate} style={{ flex: 1, padding: '10px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  💾 Save Template
                </button>
                {editingTemplate && (
                  <button onClick={() => { setEditingTemplate(null); setTplName(''); setTplSubject(''); setTplBody('') }}
                    style={{ padding: '10px 16px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PIPELINE TAB ── */}
      {activeSettingsTab === 'pipeline' && (
        <div className="settings-grid">
          <article className="card settings-card">
            <h4 className="settings-card-title">🔄 Pipeline Stages</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {stages.map(stage => (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700 }}>
                  <span>{stage}</span>
                  {!['New', 'Rejected'].includes(stage) && (
                    <button onClick={() => removeStage(stage)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newStage} onChange={e => setNewStage(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStage()} placeholder="New stage name..." style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addStage} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            </div>
          </article>
        </div>
      )}

      {/* ── EXPORT TAB ── */}
      {activeSettingsTab === 'export' && (
        <div className="settings-grid">
          <article className="card settings-card">
            <h4 className="settings-card-title">📥 Data Export</h4>
            <div className="settings-form">
              {[['Export All Candidates', 'Download complete candidate database as CSV'], ['Export Submissions', 'Download all submission records as CSV'], ['Export Job Listings', 'Download active and closed job postings']].map(([label, desc]) => (
                <div key={label} className="export-option">
                  <div><strong>{label}</strong><p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '2px 0 0' }}>{desc}</p></div>
                  <button className="btn btn-sm btn-ghost">📥 Export</button>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </div>
  )
}

export default SettingsModule


