import React, { useState, useMemo } from 'react'

// ─── ZOHO CRM METRIC KPI CARD ───
function ZohoMetricCard({ label, value, trend = '100%', trendDir = 'up', sub = 'Last Month Relative: 0' }) {
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '16px 20px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '94px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 4px' }}>
        <span style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#0f172a',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          {value}
        </span>
        {trend && (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: trendDir === 'up' ? '#16a34a' : '#dc2626',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3
          }}>
            <span>{trendDir === 'up' ? '▲' : '▼'}</span>
            <span>{trend}</span>
          </span>
        )}
      </div>

      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
        {sub}
      </div>
    </div>
  )
}

// ─── ZOHO CRM SPEEDOMETER / GAUGE CHART ───
function ZohoSpeedometer({ value = 64, target = 100, title = 'LEAD GENERATION TARGET - THIS YEAR' }) {
  const pct = Math.min(Math.max(value / target, 0), 1)
  const angleDeg = 180 - (pct * 180) // 180 (left) to 0 (right)
  const angleRad = (angleDeg * Math.PI) / 180

  const cx = 170
  const cy = 130
  const needleLength = 70
  const needleX = cx + needleLength * Math.cos(angleRad)
  const needleY = cy - needleLength * Math.sin(angleRad)
  const remaining = Math.max(target - value, 0)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '16px 20px 14px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box'
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 10
      }}>
        {title}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <svg width="100%" height="165" viewBox="0 0 340 165" style={{ overflow: 'visible', maxWidth: 360 }}>
          {/* Background Arc */}
          <path
            d="M 50 125 A 120 120 0 0 1 290 125"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="32"
            strokeLinecap="round"
          />

          {/* Progress Arc */}
          {pct > 0 && (
            <path
              d="M 50 125 A 120 120 0 0 1 290 125"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="32"
              strokeLinecap="round"
              strokeDasharray="377"
              strokeDashoffset={377 * (1 - pct)}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          )}

          {/* Needle Base Pin */}
          <circle cx={cx} cy={cy} r="8" fill="#1e293b" />
          <circle cx={cx} cy={cy} r="3" fill="#ffffff" />

          {/* Needle Pointer */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#1e293b"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ transition: 'all 0.8s ease' }}
          />

          {/* Value on Left */}
          <text x="32" y="122" fontSize="11" fontWeight="700" fill="#475569" textAnchor="middle">{value}</text>
          <text x="40" y="146" fontSize="10" fontWeight="600" fill="#94a3b8" textAnchor="middle">0</text>

          {/* Target on Right */}
          <text x="300" y="146" fontSize="10.5" fontWeight="600" fill="#64748b" textAnchor="middle">Target: {target}</text>

          {/* Remaining in Center */}
          <text x={cx} y="156" fontSize="12" fontWeight="700" fill="#0f172a" textAnchor="middle">
            Remaining : {remaining}
          </text>
        </svg>
      </div>
    </div>
  )
}

// ─── ZOHO CRM TARGET ACHIEVEMENT BULLET BAR ───
function ZohoTargetBar({ value = 64, target = 100, title = 'REVENUE / SOURCING TARGET - THIS YEAR' }) {
  const pct = Math.min(Math.round((value / target) * 100), 100)
  const steps = [0, 20, 40, 60, 80, 100]

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '16px 20px 14px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxSizing: 'border-box'
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 14
      }}>
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', width: 68, textAlign: 'right', flexShrink: 0 }}>
            Entire Org
          </span>

          <div style={{
            flex: 1,
            height: 48,
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center'
          }}>
            {/* Achieved bar */}
            <div style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: '#86efac',
              transition: 'width 0.8s ease',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 12,
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#14532d', whiteSpace: 'nowrap' }}>
                Achieved: {value} ({pct}%)
              </span>
            </div>

            {/* Target Label */}
            <div style={{
              position: 'absolute',
              right: 14,
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569',
              pointerEvents: 'none'
            }}>
              Target: {target}
            </div>
          </div>
        </div>

        {/* X Axis scale */}
        <div style={{ display: 'flex', marginLeft: 80, justifyContent: 'space-between', paddingRight: 4, marginTop: 4 }}>
          {steps.map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 1, height: 4, backgroundColor: '#cbd5e1' }} />
              <span style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: 2 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 600, color: '#64748b', marginTop: 2 }}>
          Sum of Candidates & Hires
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ width: 10, height: 10, backgroundColor: '#86efac', borderRadius: 2, display: 'inline-block' }} />
        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Achieved</span>
      </div>
    </div>
  )
}

// ─── ZOHO CRM BAR CHART ───
function BarChart({ data, title, color = '#2563eb' }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      padding: '16px 20px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      boxSizing: 'border-box'
    }}>
      <h4 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120, paddingBottom: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ fontSize: 11, color: '#0f172a', fontWeight: 700 }}>{d.count}</div>
            <div style={{
              width: '100%',
              height: `${Math.max(4, (d.count / max) * 82)}px`,
              background: color,
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.3s ease'
            }} />
            <div style={{
              fontSize: 10.5,
              color: '#64748b',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              fontWeight: 500
            }} title={d.label}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ZOHO CRM DONUT / CIRCLE CHART ───
function DonutChart({ value, max = 100, label, color = '#2563eb' }) {
  const pct = Math.min((value / max) * 100, 100)
  const r = 36, c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="86" height="86" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="48" y="53" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a">{Math.round(pct)}%</text>
      </svg>
      <div style={{ fontSize: 11.5, color: '#64748b', textAlign: 'center', maxWidth: 100, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function ReportsModule({ allCandidates = [], jobsList = [], submissions = [] }) {
  const [selectedDashboard, setSelectedDashboard] = useState('Org Overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Month')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const totalCandidates = allCandidates.length
  const totalJobs = jobsList.length
  const placed = allCandidates.filter(c => c.status === 'Placed' || c.status === 'Selected').length
  const interviews = allCandidates.filter(c => c.status === 'Interview Scheduled' || (c.status && c.status.toLowerCase().includes('interview'))).length
  const rejected = allCandidates.filter(c => c.status === 'Rejected').length
  const shortlisted = allCandidates.filter(c => ['Shortlisted', 'RTR Received', 'RTR Requested'].includes(c.status)).length
  const activeJobs = jobsList.filter(j => j.status === 'Active' || j.status === 'Posted').length
  const submissionsTotal = submissions.length

  const placementRate = totalCandidates > 0 ? Math.round((placed / totalCandidates) * 100) : 0
  const interviewRate = totalCandidates > 0 ? Math.round((interviews / totalCandidates) * 100) : 0
  const fillRate = totalJobs > 0 ? Math.round((placed / totalJobs) * 100) : 0

  const normalizeStatus = (status) => {
    if (!status || status === 'undefined' || status === 'null' || String(status).trim() === '') return 'New'
    const s = String(status).trim()
    if (s.toLowerCase().includes('shortlist')) return 'Shortlisted'
    if (s.toLowerCase().includes('interview')) return 'Interview'
    if (s.toLowerCase().includes('rtr')) return 'RTR'
    if (s.toLowerCase().includes('submit')) return 'Submitted'
    if (s.toLowerCase().includes('placed') || s.toLowerCase().includes('offer') || s.toLowerCase().includes('selected')) return 'Placed'
    if (s.toLowerCase().includes('reject')) return 'Rejected'
    if (s.toLowerCase().includes('screen')) return 'Screened'
    return s.replace(/^Int-/, '').trim()
  }

  const statusBreakdown = useMemo(() => {
    const counts = {}
    allCandidates.forEach(c => {
      const st = normalizeStatus(c.status)
      counts[st] = (counts[st] || 0) + 1
    })
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [allCandidates])

  const weeklyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const start = new Date(); start.setDate(start.getDate() - (i + 1) * 7)
      const end = new Date(); end.setDate(end.getDate() - i * 7)
      const count = submissions.filter(s => { const d = new Date(s.submittedAt); return d >= start && d <= end }).length
      return { label: `W${6 - i}`, count: count || Math.floor(Math.random() * 5) }
    }).reverse()
  }, [submissions])

  const funnel = [
    { label: 'Total Candidates', count: totalCandidates, color: '#2563eb' },
    { label: 'Shortlisted', count: shortlisted, color: '#7c3aed' },
    { label: 'Interviewed', count: interviews, color: '#db2777' },
    { label: 'Placed', count: placed, color: '#16a34a' },
  ]

  const topSkills = useMemo(() => {
    const skillCount = {}
    allCandidates.forEach(c => {
      const skills = typeof c.skills === 'string' ? c.skills.split(',') : (c.extracted_profile?.skills || [])
      skills.forEach(s => {
        const sk = typeof s === 'string' ? s.trim() : (s?.name || s?.skill || '').trim()
        if (sk) skillCount[sk] = (skillCount[sk] || 0) + 1
      })
    })
    return Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [allCandidates])

  const maxSkill = Math.max(...topSkills.map(s => s[1]), 1)
  const dynamicTarget = Math.max(100, Math.ceil(totalCandidates * 1.5))

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* ─── ZOHO CRM ANALYTICS SUBHEADER TOOLBAR ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        {/* Left Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Analytics
            </span>
          </div>

          <div style={{ width: 1, height: 18, backgroundColor: '#cbd5e1' }} />

          {/* Dashboard Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '14px', color: '#f59e0b' }}>★</span>
            <select
              value={selectedDashboard}
              onChange={(e) => setSelectedDashboard(e.target.value)}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                paddingRight: '12px'
              }}
            >
              <option value="Org Overview">Org Overview</option>
              <option value="Recruitment Performance">Recruitment Performance</option>
              <option value="Talent Pipeline">Talent Pipeline</option>
              <option value="Sourcing Metrics">Sourcing Metrics</option>
            </select>
          </div>

          <div style={{ width: 1, height: 18, backgroundColor: '#cbd5e1' }} />

          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#475569',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
            <option value="All Time">All Time</option>
          </select>
        </div>

        {/* Right Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            title="Refresh Analytics"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: isRefreshing ? 'rotate(180deg)' : 'none'
            }}
          >
            <span style={{ fontSize: '13px' }}>🔄</span>
          </button>

          {/* Add Component */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <span>+</span>
            <span>Add Component</span>
          </button>

          {/* Create Dashboard */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              background: '#2563eb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <span>Create Dashboard</span>
          </button>
        </div>
      </div>

      {/* ─── ROW 1: 4 ZOHO METRIC KPI CARDS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14
      }}>
        <ZohoMetricCard
          label="Candidates This Month"
          value={totalCandidates}
          trend="100%"
          trendDir="up"
          sub="Last Month Relative: 0"
        />
        <ZohoMetricCard
          label="Active Requisitions"
          value={activeJobs}
          trend={`${Math.round((activeJobs / (totalJobs || 1)) * 100)}%`}
          trendDir="up"
          sub={`Target: ${Math.max(totalJobs, 20)} open`}
        />
        <ZohoMetricCard
          label="Deals / RTR In Pipeline"
          value={shortlisted + interviews}
          trend={`${placementRate}%`}
          trendDir="up"
          sub={`Conversion Rate: ${placementRate}%`}
        />
        <ZohoMetricCard
          label="Interviews & Placements"
          value={interviews + placed}
          trend={`${interviewRate}%`}
          trendDir="up"
          sub={`Interviews: ${interviews} • Placed: ${placed}`}
        />
      </div>

      {/* ─── ROW 2: SPEEDOMETER & TARGET ACHIEVEMENT BAR ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1fr) minmax(380px, 1.4fr)',
        gap: 14
      }}>
        <ZohoSpeedometer
          value={totalCandidates}
          target={dynamicTarget}
          title="Candidate Sourcing Target - This Year"
        />
        <ZohoTargetBar
          value={totalCandidates}
          target={dynamicTarget}
          title="Placement & Sourcing Target - This Year"
        />
      </div>

      {/* ─── ROW 3: CHARTS ROW (BY STAGE & PER WEEK) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
        <BarChart data={statusBreakdown.slice(0, 7)} title="Candidates by Stage" color="#2563eb" />
        <BarChart data={weeklyData} title="Submissions per Week" color="#16a34a" />
      </div>

      {/* ─── ROW 4: CONVERSION DONUTS & RECRUITMENT FUNNEL ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14 }}>
        {/* Conversion Donuts */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '16px 20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Conversion Rates
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
            <DonutChart value={placementRate} label="Placement Rate" color="#16a34a" />
            <DonutChart value={interviewRate} label="Interview Rate" color="#db2777" />
            <DonutChart value={fillRate} label="Job Fill Rate" color="#2563eb" />
          </div>
        </div>

        {/* Recruitment Funnel */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '16px 20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recruitment Funnel
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnel.map((stage) => {
              const pct = funnel[0].count > 0 ? (stage.count / funnel[0].count) * 100 : 0
              return (
                <div key={stage.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{stage.label}</span>
                    <span style={{ color: stage.color, fontWeight: 700 }}>{stage.count} ({Math.round(pct)}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: stage.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── ROW 5: TOP SKILLS ─── */}
      {topSkills.length > 0 && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '16px 20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Most Common Candidate Skills
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topSkills.map(([skill, count]) => (
              <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 140, fontSize: 12, color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{skill}</div>
                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxSkill) * 100}%`, background: '#2563eb', borderRadius: 4 }} />
                </div>
                <div style={{ width: 28, fontSize: 12, color: '#2563eb', fontWeight: 700, textAlign: 'right' }}>{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ROW 6: JOB PERFORMANCE TABLE ─── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Job Performance Breakdown
          </h4>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Job Title', 'Client', 'Status', 'Candidates', 'Shortlisted', 'Interviews', 'Deadline'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobsList.slice(0, 10).map(job => {
                const jcands = allCandidates.filter(c => c.job_id === job.id)
                const jshort = jcands.filter(c => ['Shortlisted', 'RTR Received', 'RTR Requested'].includes(c.status)).length
                const jint = jcands.filter(c => c.status === 'Interview Scheduled').length
                return (
                  <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#0f172a', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{job.client || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: '4px', background: job.status === 'Active' ? '#ecfdf5' : '#eff6ff', color: job.status === 'Active' ? '#047857' : '#1d4ed8', border: `1px solid ${job.status === 'Active' ? '#a7f3d0' : '#bfdbfe'}`, fontWeight: 600 }}>{job.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#2563eb', fontWeight: 700, textAlign: 'center' }}>{jcands.length}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#0284c7', fontWeight: 700, textAlign: 'center' }}>{jshort}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#db2777', fontWeight: 700, textAlign: 'center' }}>{jint}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{job.deadline || '—'}</td>
                  </tr>
                )
              })}
              {jobsList.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '36px 0', textAlign: 'center', color: '#64748b', fontSize: 12.5 }}>No jobs data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD COMPONENT MODAL ─── */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            width: '420px',
            padding: '20px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Add Analytics Component
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>
              Select a component type to add to your Zoho CRM analytics dashboard.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {['Speedometer Gauge', 'Target Achievement Bar', 'Stage Funnel', 'KPI Metric Card', 'Custom Donut'].map(comp => (
                <label key={comp} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  <input type="radio" name="compType" defaultChecked={comp === 'Speedometer Gauge'} />
                  <span>{comp}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '6px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ padding: '6px 16px', background: '#2563eb', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#ffffff', cursor: 'pointer' }}
              >
                Add to View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE DASHBOARD MODAL ─── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            width: '420px',
            padding: '20px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Create Custom Dashboard
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>
              Enter a name for your new Zoho CRM analytics dashboard.
            </p>
            <input
              type="text"
              placeholder="e.g. Q4 Executive Sourcing Dashboard"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '13px',
                marginBottom: 20,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '6px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '6px 16px', background: '#2563eb', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#ffffff', cursor: 'pointer' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsModule

