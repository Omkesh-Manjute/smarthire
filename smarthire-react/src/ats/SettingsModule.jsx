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

  const [guideProvider, setGuideProvider] = useState('gmail')

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
        <div style={{ maxWidth: 860 }}>
          {/* Step-by-Step App Password Tutorial Guide */}
          <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '18px 20px', marginBottom: 20, boxShadow: '0 2px 10px rgba(37,99,235,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📖 Step-by-Step Setup Guide: How to Generate App Password
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Select your email provider to see exact instructions for generating an App Password for SMTP sending.
                </p>
              </div>
              {/* Guide Tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'gmail', label: '🔴 Gmail', color: '#ea4335' },
                  { id: 'yahoo', label: '🟣 Yahoo Mail', color: '#6001d2' },
                  { id: 'outlook', label: '🔵 Outlook / Office 365', color: '#0078d4' }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setGuideProvider(g.id)
                      setEmailCfg(prev => ({ ...prev, provider: g.id === 'outlook' ? 'outlook' : g.id, ...PROVIDER_DEFAULTS[g.id === 'outlook' ? 'outlook' : g.id] }))
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: '1px solid',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: guideProvider === g.id ? g.color : '#f8fafc',
                      color: guideProvider === g.id ? '#fff' : '#475569',
                      borderColor: guideProvider === g.id ? g.color : '#cbd5e1'
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GMAIL INSTRUCTIONS */}
            {guideProvider === 'gmail' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#991b1b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🔴</span> Gmail App Password Instructions (5 Steps)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12, color: '#334155' }}>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #fca5a5' }}>
                    <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 4 }}>1. Open Google Security</div>
                    Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>myaccount.google.com/security</a> in your browser.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #fca5a5' }}>
                    <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 4 }}>2. Enable 2-Step Verification</div>
                    Ensure <strong>2-Step Verification</strong> is turned <strong>ON</strong> on your Google Account (mandatory).
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #fca5a5' }}>
                    <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 4 }}>3. Go to App Passwords</div>
                    Visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>Google App Passwords</a> or search "App Passwords".
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #fca5a5' }}>
                    <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 4 }}>4. Create App Password</div>
                    Type App Name <strong>SmartHire ATS</strong> and click <strong>Create</strong>. Copy the yellow 16-character code.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #fca5a5' }}>
                    <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 4 }}>5. Paste & Test Email</div>
                    Paste the 16-letter code into <strong>App Password</strong> below and click <strong>Save & Send Test Email</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* YAHOO INSTRUCTIONS */}
            {guideProvider === 'yahoo' && (
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#6b21a8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🟣</span> Yahoo Mail App Password Instructions (5 Steps)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12, color: '#334155' }}>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #d8b4fe' }}>
                    <div style={{ fontWeight: 800, color: '#7e22ce', marginBottom: 4 }}>1. Open Yahoo Security</div>
                    Log in to <a href="https://login.yahoo.com/account/security" target="_blank" rel="noreferrer" style={{ color: '#7e22ce', fontWeight: 700 }}>login.yahoo.com/account/security</a>.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #d8b4fe' }}>
                    <div style={{ fontWeight: 800, color: '#7e22ce', marginBottom: 4 }}>2. Generate App Password</div>
                    Scroll down and click on <strong>Generate and manage app passwords</strong>.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #d8b4fe' }}>
                    <div style={{ fontWeight: 800, color: '#7e22ce', marginBottom: 4 }}>3. Enter App Name</div>
                    Enter <strong>SmartHire</strong> in the text box and click the <strong>Generate password</strong> button.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #d8b4fe' }}>
                    <div style={{ fontWeight: 800, color: '#7e22ce', marginBottom: 4 }}>4. Copy 16-Letter Code</div>
                    Copy the generated one-time code provided by Yahoo (e.g. <code>xxxx xxxx xxxx xxxx</code>).
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #d8b4fe' }}>
                    <div style={{ fontWeight: 800, color: '#7e22ce', marginBottom: 4 }}>5. Paste & Test</div>
                    Paste into <strong>App Password</strong> below. SMTP Host: <code>smtp.mail.yahoo.com</code>, Port: <code>587</code> (TLS).
                  </div>
                </div>
              </div>
            )}

            {/* OUTLOOK / OFFICE 365 INSTRUCTIONS */}
            {guideProvider === 'outlook' && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#1e40af', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🔵</span> Microsoft Outlook / Office 365 App Password Instructions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12, color: '#334155' }}>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #93c5fd' }}>
                    <div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: 4 }}>1. Microsoft Security</div>
                    Sign in to <a href="https://account.live.com/proofs/manage/additional" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', fontWeight: 700 }}>Microsoft Security Options</a>.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #93c5fd' }}>
                    <div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: 4 }}>2. Enable 2-Step Verification</div>
                    Ensure Two-step verification is turned on under Additional security.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #93c5fd' }}>
                    <div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: 4 }}>3. Create App Password</div>
                    Under the <strong>App passwords</strong> section, click <strong>Create a new app password</strong>.
                  </div>
                  <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #93c5fd' }}>
                    <div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: 4 }}>4. Paste & Save</div>
                    Paste into <strong>App Password</strong> below. Host: <code>smtp-mail.outlook.com</code> (or <code>smtp.office365.com</code>), Port: <code>587</code>.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 16 }}>
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
                  <button key={p} onClick={() => {
                    setEmailCfg(prev => ({ ...prev, provider: p, ...PROVIDER_DEFAULTS[p] }))
                    if (p === 'gmail' || p === 'yahoo') setGuideProvider(p)
                    else if (p === 'outlook' || p === 'office365') setGuideProvider('outlook')
                  }}
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


