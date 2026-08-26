import React, { useState, useEffect, useRef } from 'react'

// Helper function to push real-time notifications anywhere in the app
export const pushActivityNotification = (notif) => {
  const newEntry = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: notif.title || 'New Activity Update',
    message: notif.message || '',
    type: notif.type || 'info', // 'approval', 'assignment', 'status', 'ai', 'requisition', 'info'
    category: notif.category || 'status', // 'status', 'team', 'ai', 'system'
    timestamp: notif.timestamp || new Date().toISOString(),
    timeAgo: 'Just now',
    isRead: false,
    actor: notif.actor || 'System',
    actorRole: notif.actorRole || 'Recruiter',
    reqId: notif.reqId || null,
    candidateName: notif.candidateName || null,
    candidateId: notif.candidateId || null,
    statusText: notif.statusText || null
  }

  try {
    const raw = localStorage.getItem('smarthire_activity_notifications')
    let currentList = []
    if (raw) {
      currentList = JSON.parse(raw)
      if (!Array.isArray(currentList)) currentList = []
    }
    const updated = [newEntry, ...currentList].slice(0, 50) // Keep latest 50
    localStorage.setItem('smarthire_activity_notifications', JSON.stringify(updated))
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('smarthire_new_activity_notification', { detail: newEntry }))
}

// Initial realistic default notifications for immediate rich experience
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Manager Candidate Approval',
    message: 'Manager Alok approved Candidate Rahul Sharma for Requisition #158938',
    type: 'approval',
    category: 'status',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    timeAgo: '2m ago',
    isRead: false,
    actor: 'Alok Manager',
    actorRole: 'Manager',
    reqId: '158938',
    candidateName: 'Rahul Sharma',
    candidateId: 'emp-1',
    statusText: 'Int-ApprovedByManager'
  },
  {
    id: 'notif-2',
    title: 'New Candidate Assigned to Requisition',
    message: 'New candidate Ashok Juttu Kannan assigned to Requisition #158938 by Sukamal Chatterjee',
    type: 'assignment',
    category: 'team',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    timeAgo: '12m ago',
    isRead: false,
    actor: 'Sukamal Chatterjee',
    actorRole: 'Recruiter',
    reqId: '158938',
    candidateName: 'Ashok Juttu Kannan',
    candidateId: '87510'
  },
  {
    id: 'notif-3',
    title: 'Client Interview Scheduled',
    message: 'Cx Avinash Ashokrao Mahajan status updated to "Client-InterviewScheduled" for State Of SC',
    type: 'interview',
    category: 'status',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    timeAgo: '45m ago',
    isRead: false,
    actor: 'Vaibhav Bisen',
    actorRole: 'Recruiter',
    reqId: '158938',
    candidateName: 'Cx Avinash Ashokrao Mahajan',
    candidateId: '87512',
    statusText: 'Client-InterviewScheduled'
  },
  {
    id: 'notif-4',
    title: 'AI Fit Match Evaluation',
    message: 'AI Fit Engine evaluated Candidate Ashok Juttu Kannan with 94% Strong Match for Req #158938',
    type: 'ai',
    category: 'ai',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    timeAgo: '1h ago',
    isRead: true,
    actor: 'SmartHire AI Intelligence',
    actorRole: 'AI Agent',
    reqId: '158938',
    candidateName: 'Ashok Juttu Kannan',
    candidateId: '87510'
  },
  {
    id: 'notif-5',
    title: 'New Requisition Created',
    message: 'Admin Omkesh created new Requisition #158942 "Senior Cloud DevOps Engineer" for DFA',
    type: 'requisition',
    category: 'team',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    timeAgo: '4h ago',
    isRead: true,
    actor: 'Omkesh',
    actorRole: 'SuperAdmin',
    reqId: '158942'
  }
]

export default function ActivityNotificationBell({ theme = 'default', onSelectNotification }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('smarthire_activity_notifications')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {}
    return DEFAULT_NOTIFICATIONS
  })

  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'status', 'team', 'ai'
  const [liveToast, setLiveToast] = useState(null)
  const dropdownRef = useRef(null)

  // Sync to local storage
  const saveNotifications = (newList) => {
    setNotifications(newList)
    try {
      localStorage.setItem('smarthire_activity_notifications', JSON.stringify(newList))
    } catch (e) {}
  }

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Listen for live new notifications emitted across tabs or components
  useEffect(() => {
    const handleNewNotif = (e) => {
      const newNotif = e.detail
      if (!newNotif) return

      setNotifications(prev => {
        const exists = prev.some(n => n.id === newNotif.id)
        if (exists) return prev
        const updated = [newNotif, ...prev].slice(0, 50)
        try {
          localStorage.setItem('smarthire_activity_notifications', JSON.stringify(updated))
        } catch (err) {}
        return updated
      })

      // Trigger live popup banner for 4.5 seconds
      setLiveToast(newNotif)
      const t = setTimeout(() => {
        setLiveToast(null)
      }, 4500)
      return () => clearTimeout(t)
    }

    window.addEventListener('smarthire_new_activity_notification', handleNewNotif)
    return () => window.removeEventListener('smarthire_new_activity_notification', handleNewNotif)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Mark all as read
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }))
    saveNotifications(updated)
  }

  // Clear all
  const handleClearAll = () => {
    saveNotifications([])
  }

  // Click individual notification
  const handleNotificationClick = (notif) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
    saveNotifications(updated)
    setIsOpen(false)
    if (onSelectNotification) {
      onSelectNotification(notif)
    }
  }

  // Filtered notifications
  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'status') return n.category === 'status' || n.type === 'approval' || n.type === 'interview'
    if (activeFilter === 'team') return n.category === 'team' || n.type === 'assignment' || n.type === 'requisition'
    if (activeFilter === 'ai') return n.category === 'ai' || n.type === 'ai'
    return true
  })

  // Get icon and color badge for notification type
  const getTypeBadge = (type) => {
    switch (type) {
      case 'approval':
        return { icon: '✅', label: 'Approved', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' }
      case 'assignment':
        return { icon: '📋', label: 'Assigned', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' }
      case 'interview':
        return { icon: '📅', label: 'Interview', bg: '#fef3c7', color: '#92400e', border: '#fde68a' }
      case 'ai':
      case 'ai_match':
        return { icon: '🎯', label: 'AI Match', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' }
      case 'requisition':
        return { icon: '💼', label: 'Requisition', bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' }
      default:
        return { icon: '🔔', label: 'Update', bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' }
    }
  }

  const isOrangeTheme = theme === 'orange'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      
      {/* ─── NOTIFICATION BELL BUTTON ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Live Activity Alerts & Notifications"
        style={{
          position: 'relative',
          background: isOrangeTheme ? '#c2410c' : '#ffffff',
          border: isOrangeTheme ? '1px solid #9a3412' : '1px solid #cbd5e1',
          color: isOrangeTheme ? '#ffffff' : '#1e293b',
          borderRadius: '4px',
          width: '32px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ fontSize: '15px', lineHeight: 1 }}>🔔</span>

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-6px',
            background: '#dc2626',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '17px',
            height: '17px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            boxShadow: '0 2px 4px rgba(220,38,38,0.4)',
            border: '2px solid #ffffff'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ─── LIVE POPUP TOAST BANNER (AUTO-DISMISS) ─── */}
      {liveToast && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          zIndex: 99999,
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #38bdf8',
          borderRadius: '6px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          maxWidth: '360px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          animation: 'slideIn 0.3s ease-out',
          fontFamily: 'Arial, sans-serif'
        }}>
          <span style={{ fontSize: '18px' }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#38bdf8' }}>
              {liveToast.title}
            </div>
            <div style={{ fontSize: '11px', color: '#f1f5f9', marginTop: '2px', lineHeight: '1.3' }}>
              {liveToast.message}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
              Just now • {liveToast.actor}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── NOTIFICATION DROPDOWN POPOVER ─── */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '38px',
          right: 0,
          zIndex: 9999,
          width: '380px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Arial, sans-serif'
        }}>
          
          {/* Header */}
          <div style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🔔</span>
              <span style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#0f172a' }}>
                Activity & Alerts
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
              >
                Mark all read
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={handleClearAll}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            padding: '4px 10px 0',
            gap: '4px'
          }}>
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'status', label: 'Approvals' },
              { id: 'team', label: 'Team Activity' },
              { id: 'ai', label: 'AI Alerts' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  background: activeFilter === tab.id ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderBottom: activeFilter === tab.id ? '2px solid #ea580c' : '2px solid transparent',
                  color: activeFilter === tab.id ? '#ea580c' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: activeFilter === tab.id ? 'bold' : 'normal',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  borderRadius: '3px 3px 0 0'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications Scrollable List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', background: '#ffffff' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🔕</span>
                No notifications in this category
              </div>
            ) : (
              filteredNotifs.map((item) => {
                const badge = getTypeBadge(item.type)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      background: item.isRead ? '#ffffff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = item.isRead ? '#ffffff' : '#f8fafc'}
                  >
                    {/* Icon Box */}
                    <div style={{
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {badge.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: item.isRead ? 'normal' : 'bold',
                          color: '#0f172a'
                        }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', marginLeft: '6px' }}>
                          {item.timeAgo}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '11px',
                        color: '#475569',
                        marginTop: '2px',
                        lineHeight: '1.3'
                      }}>
                        {item.message}
                      </div>

                      {/* Metadata Chips */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '5px' }}>
                        {item.actor && (
                          <span style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            👤 {item.actor} ({item.actorRole || 'Recruiter'})
                          </span>
                        )}
                        {item.reqId && (
                          <span style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            Req #{item.reqId}
                          </span>
                        )}
                        {!item.isRead && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            marginLeft: 'auto'
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '8px 14px',
            textAlign: 'center',
            fontSize: '11px'
          }}>
            <span style={{ color: '#0284c7', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>
              ⚡ Live Team Activity Stream Active
            </span>
          </div>

        </div>
      )}
    </div>
  )
}
