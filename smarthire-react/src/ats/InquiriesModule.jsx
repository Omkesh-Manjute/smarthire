import React, { useState, useEffect, useMemo } from 'react'
import { getInquiriesFirestore } from '../lib/atsFirestore'

export default function InquiriesModule() {
  const [inquiries, setInquiries] = useState(() => {
    try {
      const raw = localStorage.getItem('smarthire_inquiries')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {}
    return []
  })

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'New', 'Contacted', 'Resolved'
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [copiedEmail, setCopiedEmail] = useState(false)

  // Load from Firestore on mount
  useEffect(() => {
    let isMounted = true
    const loadFirestoreInquiries = async () => {
      try {
        setLoading(true)
        const cloudInquiries = await getInquiriesFirestore()
        if (isMounted && Array.isArray(cloudInquiries) && cloudInquiries.length > 0) {
          setInquiries(prev => {
            const combined = [...cloudInquiries]
            prev.forEach(localItem => {
              if (!combined.some(c => c.id === localItem.id)) {
                combined.push(localItem)
              }
            })
            combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            try {
              localStorage.setItem('smarthire_inquiries', JSON.stringify(combined))
            } catch (e) {}
            return combined
          })
        }
      } catch (err) {
        console.warn('Failed to fetch Firestore inquiries:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadFirestoreInquiries()
    return () => { isMounted = false }
  }, [])

  // Listen for real-time inquiry events
  useEffect(() => {
    const handleNewActivity = (e) => {
      const notif = e.detail
      if (notif && (notif.type === 'inquiry' || notif.inquiryData)) {
        try {
          const raw = localStorage.getItem('smarthire_inquiries')
          if (raw) {
            const list = JSON.parse(raw)
            if (Array.isArray(list)) setInquiries(list)
          }
        } catch (err) {}
      }
    }

    window.addEventListener('smarthire_new_activity_notification', handleNewActivity)
    return () => window.removeEventListener('smarthire_new_activity_notification', handleNewActivity)
  }, [])

  // Update Status
  const handleUpdateStatus = (inquiryId, newStatus) => {
    const updated = inquiries.map(item => item.id === inquiryId ? { ...item, status: newStatus } : item)
    setInquiries(updated)
    try {
      localStorage.setItem('smarthire_inquiries', JSON.stringify(updated))
    } catch (e) {}
    if (selectedInquiry && selectedInquiry.id === inquiryId) {
      setSelectedInquiry(prev => ({ ...prev, status: newStatus }))
    }
  }

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(item => {
      const matchSearch =
        !searchQuery ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchStatus =
        statusFilter === 'all' ||
        (item.status && item.status.toLowerCase() === statusFilter.toLowerCase())

      return matchSearch && matchStatus
    })
  }, [inquiries, searchQuery, statusFilter])

  // KPI Metrics
  const stats = useMemo(() => {
    const total = inquiries.length
    const newCount = inquiries.filter(i => !i.status || i.status.toLowerCase() === 'new').length
    const contactedCount = inquiries.filter(i => i.status && i.status.toLowerCase() === 'contacted').length
    const resolvedCount = inquiries.filter(i => i.status && i.status.toLowerCase() === 'resolved').length
    return { total, newCount, contactedCount, resolvedCount }
  }, [inquiries])

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>

      {/* ─── MODULE HEADER ─── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '800'
          }}>
            📩
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              Client & Enterprise Inquiries
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
              Real-time inbound inquiries from the SmartHire portal and corporate staffing prospects
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              const raw = localStorage.getItem('smarthire_inquiries')
              if (raw) {
                try {
                  const list = JSON.parse(raw)
                  setInquiries(list)
                } catch (e) {}
              }
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ─── KPI METRIC SUMMARY CARDS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px',
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        background: '#ffffff'
      }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Received</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>{stats.total}</div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' }}>New / Unread</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '2px' }}>{stats.newCount}</div>
        </div>

        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>Contacted</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#92400e', marginTop: '2px' }}>{stats.contactedCount}</div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Resolved / Closed</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#166534', marginTop: '2px' }}>{stats.resolvedCount}</div>
        </div>
      </div>

      {/* ─── TOOLBAR: SEARCH & STATUS FILTER ─── */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search name, company, email, topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 30px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '9px', top: '7px', fontSize: '12px', color: '#94a3b8' }}>🔍</span>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'new', label: 'New' },
            { id: 'contacted', label: 'Contacted' },
            { id: 'resolved', label: 'Resolved' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                background: statusFilter === tab.id ? '#0f172a' : '#f1f5f9',
                color: statusFilter === tab.id ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '5px',
                padding: '6px 12px',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── INQUIRIES DATA TABLE ─── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '10px 16px' }}>Ticket ID</th>
              <th style={{ padding: '10px 16px' }}>Prospect & Company</th>
              <th style={{ padding: '10px 16px' }}>Category & Topic</th>
              <th style={{ padding: '10px 16px' }}>Priority</th>
              <th style={{ padding: '10px 16px' }}>Status</th>
              <th style={{ padding: '10px 16px' }}>Received</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>📭</div>
                  <div style={{ fontWeight: '600' }}>No inquiries found</div>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>
                    Inquiries submitted via the About or Support portal will appear here in real time.
                  </div>
                </td>
              </tr>
            ) : (
              filteredInquiries.map(inq => {
                const isNew = !inq.status || inq.status.toLowerCase() === 'new'
                const isUrgent = inq.priority?.toLowerCase() === 'urgent'
                const isHigh = inq.priority?.toLowerCase() === 'high'

                return (
                  <tr
                    key={inq.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isNew ? '#f8fafc' : '#ffffff',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = isNew ? '#f8fafc' : '#ffffff'}
                  >
                    {/* Ticket ID */}
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#2563eb' }}>
                      {inq.id}
                    </td>

                    {/* Prospect & Company */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{inq.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🏢 {inq.company || 'Enterprise Partner'}</div>
                      <div style={{ fontSize: '11px', color: '#0284c7' }}>✉️ {inq.email}</div>
                    </td>

                    {/* Category & Topic */}
                    <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                      <div style={{
                        display: 'inline-block',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        marginBottom: '3px'
                      }}>
                        {inq.category || 'General'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#334155',
                        fontWeight: '500',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {inq.subject || inq.message}
                      </div>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: isUrgent ? '#fee2e2' : isHigh ? '#fef3c7' : '#f1f5f9',
                        color: isUrgent ? '#b91c1c' : isHigh ? '#b45309' : '#475569',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        {inq.priority || 'Normal'}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={inq.status || 'New'}
                        onChange={e => handleUpdateStatus(inq.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11.5px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: (inq.status?.toLowerCase() === 'contacted') ? '#fef3c7' : (inq.status?.toLowerCase() === 'resolved') ? '#dcfce7' : '#ffffff',
                          color: (inq.status?.toLowerCase() === 'contacted') ? '#92400e' : (inq.status?.toLowerCase() === 'resolved') ? '#166534' : '#0f172a',
                          fontWeight: '600',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="New">● New</option>
                        <option value="In Review">● In Review</option>
                        <option value="Contacted">● Contacted</option>
                        <option value="Resolved">● Resolved</option>
                      </select>
                    </td>

                    {/* Received */}
                    <td style={{ padding: '12px 16px', fontSize: '11px', color: '#64748b' }}>
                      {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedInquiry(inq)}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                          title="View Full Inquiry"
                        >
                          👁️ View
                        </button>

                        <a
                          href={'mailto:' + inq.email + '?subject=' + encodeURIComponent('Re: [SmartHire ATS] ' + (inq.subject || inq.category || 'Enterprise Inquiry'))}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>✉️</span>
                          <span>Reply</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── INQUIRY DETAIL MODAL ─── */}
      {selectedInquiry && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setSelectedInquiry(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              animation: 'slideIn 0.2s ease-out'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800' }}>Inquiry #{selectedInquiry.id}</div>
                <div style={{ fontSize: '11px', color: '#93c5fd' }}>
                  Received {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : 'Recently'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700' }}>Prospect</div>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>{selectedInquiry.name}</div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700' }}>Company</div>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>🏢 {selectedInquiry.company || 'Enterprise Partner'}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700' }}>Email Address</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a href={'mailto:' + selectedInquiry.email} style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                      ✉️ {selectedInquiry.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInquiry.email)
                        setCopiedEmail(true)
                        setTimeout(() => setCopiedEmail(false), 2000)
                      }}
                      style={{
                        background: copiedEmail ? '#dcfce7' : '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '10.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedEmail ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {selectedInquiry.subject && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Topic / Subject</div>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>{selectedInquiry.subject}</div>
                </div>
              )}

              <div>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Message Details</div>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(selectedInquiry.id, 'Contacted')
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ✓ Mark as Contacted
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <a
                  href={'mailto:' + selectedInquiry.email + '?subject=' + encodeURIComponent('Re: [SmartHire ATS] ' + (selectedInquiry.subject || 'Enterprise Inquiry'))}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✉️</span>
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
