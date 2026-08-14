import React, { useState } from 'react'

function StatusDot({ online }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: online ? '#16a34a' : '#dc2626',
      marginRight: 6,
    }} />
  )
}

function IntegrationCard({ icon, name, description, status, statusClass, detail, action, onAction }) {
  const isOk = statusClass === 'pill-ok'
  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${isOk ? '#bbf7d0' : '#fef3c7'}`,
      borderRadius: 14,
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: isOk ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{description}</div>
          </div>
        </div>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
          background: isOk ? '#dcfce7' : '#fef3c7',
          color: isOk ? '#15803d' : '#b45309',
          border: `1px solid ${isOk ? '#bbf7d0' : '#fde68a'}`,
          display: 'flex', alignItems: 'center',
        }}>
          <StatusDot online={isOk} />{status}
        </span>
      </div>
      {detail && <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>{detail}</div>}
      {action && (
        <button onClick={onAction}
          style={{ background: isOk ? '#dcfce7' : '#fef3c7', color: isOk ? '#15803d' : '#b45309', border: `1px solid ${isOk ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: 'fit-content' }}>
          {action}
        </button>
      )}
    </div>
  )
}

function AutomationModule({ apiOnline }) {
  const [webhookLog] = useState([
    { time: '08:00:09', type: 'gpt-4', msg: 'Extracting candidate metadata and matching to JDs...' },
    { time: '08:00:15', type: 'database', msg: 'Stored 2 new candidates in SmartHire DB.' },
    { time: '08:00:16', type: 'report', msg: 'Generating Daily Brief Summary...' },
    { time: '08:00:18', type: 'success', msg: 'Report broadcast complete (200 OK).' },
    { time: '07:15:32', type: 'api', msg: 'Keep-alive healthcheck: OK.' },
    { time: '20:45:09', type: 'api', msg: 'Idle. Listening for webhook events...' },
  ])

  const integrations = [
    { icon: '🔗', name: 'n8n Webhook', description: 'Email-to-ATS pipeline', status: apiOnline ? 'Connected' : 'Disconnected', statusClass: apiOnline ? 'pill-ok' : 'pill-warn', detail: apiOnline ? 'Receiving webhook events from email parser. Last ping: < 2 min ago.' : 'Webhook endpoint not reachable. Check n8n workflow status.', action: 'Test Connection', onAction: () => alert('Testing n8n webhook connection...') },
    { icon: '🤖', name: 'Groq AI Parser', description: 'Resume parsing & JD matching', status: 'Active', statusClass: 'pill-ok', detail: 'Groq LLM API connected. Processing resumes with llama-3.3-70b-versatile. Average parse time: 1.8s.' },
    { icon: '📡', name: 'LinkedIn Publisher', description: 'Auto-publish job posts', status: 'Active', statusClass: 'pill-ok', detail: 'LinkedIn OAuth authorized. Last post: 2 hours ago. Post limit: 100/day.' },
    { icon: '📧', name: 'Email Scanner', description: 'Yahoo/Gmail inbox monitoring', status: apiOnline ? 'Active' : 'Standby', statusClass: apiOnline ? 'pill-ok' : 'pill-warn', detail: 'IMAP polling every 5 minutes. Scanning for resumes in attachments.' },
    { icon: '🌐', name: 'JobsInHand Scraper', description: 'Auto-scrapes new job postings', status: 'Active', statusClass: 'pill-ok', detail: 'Cron job runs every 15 minutes. Last scrape: 8 minutes ago. Found: 12 new jobs.' },
    { icon: '💬', name: 'AI Screening Bot', description: 'Candidate chat screening', status: 'Active', statusClass: 'pill-ok', detail: 'Screening sessions active. Powered by Groq AI with custom recruiter persona.' },
  ]

  const cronJobs = [
    { name: 'JobsInHand Scraper', schedule: 'Every 15 min', lastRun: '8 min ago', status: '✅ Success', nextRun: '7 min' },
    { name: 'Email Scanner', schedule: 'Every 5 min', lastRun: '3 min ago', status: '✅ Success', nextRun: '2 min' },
    { name: 'Daily Brief Report', schedule: 'Daily 8:00 AM', lastRun: '4 hrs ago', status: '✅ Success', nextRun: '20 hrs' },
    { name: 'Candidate Sync', schedule: 'Every 30 min', lastRun: '12 min ago', status: '✅ Success', nextRun: '18 min' },
    { name: 'LinkedIn Auto-Post', schedule: 'On demand', lastRun: '2 hrs ago', status: '✅ Success', nextRun: 'On trigger' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0f172a', fontSize: 16 }}>⚙️ Automation & Integrations</h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Monitor background cron jobs, webhooks, and service health in real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, background: apiOnline ? '#dcfce7' : '#fee2e2', color: apiOnline ? '#15803d' : '#b91c1c', border: `1px solid ${apiOnline ? '#bbf7d0' : '#fca5a5'}`, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <StatusDot online={apiOnline} />
            {apiOnline ? 'All Systems Operational' : 'API Offline'}
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { icon: '✅', label: 'Services Online', value: apiOnline ? '6/6' : '4/6', color: '#16a34a', bg: '#f0fdf4' },
          { icon: '⚡', label: 'Cron Jobs Active', value: '5', color: '#2563eb', bg: '#eff6ff' },
          { icon: '📨', label: 'Webhooks Today', value: '28', color: '#d97706', bg: '#fffbeb' },
          { icon: '🤖', label: 'AI Calls Made', value: '142', color: '#7c3aed', bg: '#f5f3ff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Grid */}
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔌 Integration Health</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {integrations.map(int => (
            <IntegrationCard key={int.name} {...int} />
          ))}
        </div>
      </div>

      {/* Cron Job Schedule */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⏱️ Scheduled Jobs</h4>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Job Name', 'Schedule', 'Last Run', 'Status', 'Next Run'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cronJobs.map(job => (
              <tr key={job.name} style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
                <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{job.name}</td>
                <td style={{ padding: '11px 16px', fontSize: 12, color: '#2563eb', fontWeight: 600 }}>{job.schedule}</td>
                <td style={{ padding: '11px 16px', fontSize: 12, color: '#64748b' }}>{job.lastRun}</td>
                <td style={{ padding: '11px 16px', fontSize: 12 }}>{job.status}</td>
                <td style={{ padding: '11px 16px', fontSize: 12, color: '#64748b' }}>{job.nextRun}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live Webhook Log */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
          <h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Automation Log</h4>
        </div>
        <div style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {webhookLog.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, color: log.type === 'success' ? '#4ade80' : log.type === 'database' ? '#93c5fd' : '#cbd5e1' }}>
              <span style={{ color: '#64748b', flexShrink: 0 }}>[{log.time}]</span>
              <span style={{ color: '#94a3b8', flexShrink: 0 }}>[{log.type}]</span>
              <span>{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AutomationModule
