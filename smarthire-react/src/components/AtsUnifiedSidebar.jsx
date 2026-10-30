import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const renderAtsIcon = (id, size = 16, color = 'currentColor') => {
  switch (id) {
    case 'home':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'candidates':
    case 'users':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'pipeline':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    case 'screening':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      )
    case 'submissions':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      )
    case 'audit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    case 'submittal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="7" x2="11" y2="7" />
        </svg>
      )
    case 'rtr':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      )
    case 'monster':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    case 'hotlist':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
          <line x1="10" y1="9" x2="10.01" y2="9" />
        </svg>
      )
    case 'smartscreen':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      )
    case 'inquiries':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    case 'automation':
    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'inbox':
    case 'chat':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'building':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="9" y1="22" x2="9" y2="12"></line>
          <line x1="15" y1="22" x2="15" y2="12"></line>
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="4" y1="10" x2="20" y2="10"></line>
        </svg>
      )
    case 'globe':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      )
    default:
      return null
  }
}

export default function AtsUnifiedSidebar({
  activeItem = 'home',
  sidebarCollapsed = false,
  setSidebarCollapsed,
  onSelectInternalTab, // function(tabId) for AtsPlatform
  onOpenChatModal,
  customCounts = {}
}) {
  const navigate = useNavigate()

  // Retrieve current user info
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let userObj = null
  try { userObj = JSON.parse(userStr) } catch (_) {}
  const isSuperAdmin = !userObj || userObj.role === 'superadmin' || userObj.role === 'admin' || userObj.email === 'omkeshmanjute@gmail.com' || userObj.email === 'omkesh@coolsofttech.com'
  const userName = userObj?.name || 'Omkesh Manjute'
  const userEmail = userObj?.email || 'omkesh@coolsofttech.com'
  const userRole = (userObj?.role || 'Super Admin').toUpperCase()

  // 5 Master Navigation Groups
  const NAV_GROUPS = [
    {
      id: 'talent',
      label: 'Talent Hub',
      icon: 'candidates',
      items: [
        { id: 'jobs', label: 'Requisitions & Jobs', path: '/dashboard' },
        { id: 'candidates', label: 'Candidate Database', path: '/inbox?tab=candidates', count: customCounts.candidates },
        { id: 'submittal', label: 'Submittal Pack', path: '/submittal-pack' },
        { id: 'rtr', label: 'SmartSign RTR', path: '/sign-rtr' },
      ]
    },
    {
      id: 'sourcing',
      label: 'Sourcing Console',
      icon: 'monster',
      items: [
        { id: 'hotlist', label: 'Vendor Hotlists', path: '/inbox?tab=hotlist' },
        { id: 'monster', label: 'Universal Search', path: '/inbox?tab=monster' },
        { id: 'sourcing_pipeline', label: 'Sourcing Pipeline', path: '/sourcing' },
      ]
    },
    {
      id: 'evaluation',
      label: 'Evaluation & Pipeline',
      icon: 'pipeline',
      items: [
        { id: 'submissions', label: 'Visual Pipeline', tabId: 'submissions', path: '/ats?tab=pipeline' },
      ]
    },
    {
      id: 'comms',
      label: 'Outreach & Comms',
      icon: 'inbox',
      items: [
        { id: 'chats', label: 'Chats', path: '/inbox?tab=chat' },
        { id: 'inquiries', label: 'Client Inquiries', tabId: 'inquiries', path: '/ats?tab=inquiries', count: customCounts.inquiries },
      ]
    },
    {
      id: 'admin',
      label: 'Administration',
      icon: 'users',
      adminOnly: true,
      items: [
        { id: 'users', label: 'Manage Users & Clients', tabId: 'users', path: '/ats?tab=users' },
        { id: 'settings', label: 'Workspace Settings', tabId: 'settings', path: '/ats?tab=settings' },
        { id: 'audit', label: 'Audit Logs', tabId: 'audit', path: '/ats?tab=audit' },
        { id: 'automation', label: 'Automation Rules', tabId: 'automation', path: '/ats?tab=automation' },
      ]
    },
  ]

  // Determine initial group expansion based on activeItem (Strict single-group accordion)
  const [navGroupsOpen, setNavGroupsOpen] = useState(() => {
    for (const grp of NAV_GROUPS) {
      if (grp.items.some(it => it.id === activeItem)) {
        return { [grp.id]: true }
      }
    }
    return { talent: true }
  })

  // Auto-expand group when activeItem changes, auto-collapsing all other groups
  useEffect(() => {
    let matchedGroup = null
    for (const grp of NAV_GROUPS) {
      if (grp.items.some(it => it.id === activeItem)) {
        matchedGroup = grp.id
        break
      }
    }
    if (matchedGroup) {
      setNavGroupsOpen({ [matchedGroup]: true })
    } else if (activeItem === 'home' || activeItem === 'screening') {
      setNavGroupsOpen({})
    }
  }, [activeItem])

  const toggleNavGroup = (grpId) => {
    setNavGroupsOpen(prev => {
      const isCurrentlyOpen = Boolean(prev[grpId])
      return isCurrentlyOpen ? {} : { [grpId]: true }
    })
  }

  const handleItemClick = (it) => {
    // If inside AtsPlatform and this item is handled internally:
    if (onSelectInternalTab && it.tabId) {
      onSelectInternalTab(it.tabId)
      return
    }

    // Cross-page navigation:
    if (it.path) {
      const currentFull = window.location.pathname + window.location.search

      // If clicking within the same base route and onSelectInternalTab is provided (e.g. inside RecruiterInbox)
      if (window.location.pathname === it.path.split('?')[0] && onSelectInternalTab) {
        onSelectInternalTab(it.id)
        if (currentFull !== it.path) {
          navigate(it.path)
        }
        return
      }

      if (currentFull === it.path) {
        return
      }
      navigate(it.path)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('smarthire_authenticated')
    localStorage.removeItem('verifyhire_authenticated')
    localStorage.removeItem('smarthire_token')
    localStorage.removeItem('smarthire_user')
    window.location.href = '/login'
  }

  return (
    <aside style={{
      width: sidebarCollapsed ? '64px' : '240px',
      minWidth: sidebarCollapsed ? '64px' : '240px',
      background: '#3F0E40',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 100,
      userSelect: 'none',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.08)',
      position: 'sticky',
      top: 0
    }} className="no-print">

      {/* Top Brand & Collapse Icon */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: sidebarCollapsed ? '0 16px' : '0 18px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#350d36'
      }}>
        {!sidebarCollapsed && (
          <div
            onClick={() => {
              if (onSelectInternalTab) onSelectInternalTab('home')
              else navigate('/ats?tab=home')
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: '#4A154B',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontWeight: '900', fontSize: '13px'
            }}>
              SH
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.01em' }}>
                SmartHire ATS
              </span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>▼</span>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div
            onClick={() => {
              if (onSelectInternalTab) onSelectInternalTab('home')
              else navigate('/ats?tab=home')
            }}
            style={{
              width: '32px', height: '32px', borderRadius: '6px',
              background: '#4A154B',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontWeight: '900', cursor: 'pointer'
            }}
          >
            SH
          </div>
        )}

        <button
          onClick={() => setSidebarCollapsed && setSidebarCollapsed(prev => !prev)}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.65)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, color 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      {/* Primary Upper Navigation (Home & AI Video Screening above Talent Hub) */}
      <div style={{ padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {[
          { id: 'home', label: 'Home', tabId: 'home', path: '/ats?tab=home' },
          { id: 'screening', label: 'AI Video Screening', tabId: 'screening', path: '/ats?tab=screening' }
        ].map(item => {
          const isActive = activeItem === item.id
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              title={sidebarCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: sidebarCollapsed ? '10px 0' : '8px 12px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                borderRadius: '6px',
                background: isActive ? '#1164A3' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)' } }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderAtsIcon(item.id, 15, isActive ? '#ffffff' : 'rgba(255,255,255,0.72)')}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
          )
        })}
      </div>

      {/* Clean Divider */}
      {!sidebarCollapsed && (
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 12px' }} />
      )}

      {/* Scrollable Sub-modules List (5 Normalized Dropdown Groups) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {NAV_GROUPS
          .filter(grp => !grp.adminOnly || isSuperAdmin)
          .map(grp => {
            const isOpen = Boolean(navGroupsOpen[grp.id])
            const isGroupActive = grp.items.some(it => activeItem === it.id)

            return (
              <div key={grp.id} style={{ marginBottom: '6px' }}>
                {/* Group Header Accordion Button */}
                <div
                  onClick={() => {
                    if (sidebarCollapsed) {
                      if (setSidebarCollapsed) setSidebarCollapsed(false)
                      setNavGroupsOpen({ [grp.id]: true })
                    } else {
                      toggleNavGroup(grp.id)
                    }
                  }}
                  title={sidebarCollapsed ? grp.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: sidebarCollapsed ? '10px 0' : '7px 10px',
                    borderRadius: '6px',
                    background: isGroupActive && !isOpen ? 'rgba(17, 100, 163, 0.25)' : 'transparent',
                    color: isGroupActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isGroupActive && !isOpen ? 'rgba(17, 100, 163, 0.25)' : 'transparent'; e.currentTarget.style.color = isGroupActive ? '#ffffff' : 'rgba(255,255,255,0.75)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', width: sidebarCollapsed ? '100%' : 'auto' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {renderAtsIcon(grp.icon, 14, isGroupActive ? '#38bdf8' : 'rgba(255,255,255,0.75)')}
                    </span>
                    {!sidebarCollapsed && <span>{grp.label}</span>}
                  </div>

                  {!sidebarCollapsed && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '9px',
                      color: 'rgba(255,255,255,0.45)'
                    }}>
                      ▼
                    </span>
                  )}
                </div>

                {/* Group Sub-Items */}
                {!sidebarCollapsed && isOpen && (
                  <div style={{
                    paddingLeft: '12px',
                    marginLeft: '12px',
                    borderLeft: '1.5px solid rgba(255,255,255,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    marginTop: '3px'
                  }}>
                    {grp.items.map(it => {
                      const isItemActive = activeItem === it.id
                      return (
                        <div
                          key={it.id}
                          onClick={() => handleItemClick(it)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '5px',
                            background: isItemActive ? '#1164A3' : 'transparent',
                            color: isItemActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                            fontSize: '12.5px',
                            fontWeight: isItemActive ? '700' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={e => {
                            if (!isItemActive) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                              e.currentTarget.style.color = '#ffffff'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isItemActive) {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                            }
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '4px', height: '4px', borderRadius: '50%',
                              background: isItemActive ? '#ffffff' : 'rgba(255,255,255,0.35)',
                              flexShrink: 0
                            }} />
                            <span>{it.label}</span>
                          </span>

                          {it.count !== undefined && it.count > 0 && (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: '700',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: isItemActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                              color: '#ffffff'
                            }}>
                              {it.count}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

        {/* Clean Divider */}
        {!sidebarCollapsed && (
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 12px' }} />
        )}

        {/* Quick Portals */}
        {!sidebarCollapsed && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '12px 10px 4px' }}>
            Quick Portals
          </div>
        )}

        <div
          onClick={() => navigate('/dashboard')}
          title="Switch to Requisitions Dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: sidebarCollapsed ? '10px 0' : '7px 12px',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '12.5px',
            fontWeight: '500',
            cursor: 'pointer',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderAtsIcon('building', 14, 'rgba(255,255,255,0.8)')}</span>
          {!sidebarCollapsed && <span>Requisitions Portal ↗</span>}
        </div>

        <div
          onClick={() => navigate('/jobs')}
          title="View Public Careers Portal"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: sidebarCollapsed ? '10px 0' : '7px 12px',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '12.5px',
            fontWeight: '500',
            cursor: 'pointer',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderAtsIcon('globe', 14, 'rgba(255,255,255,0.8)')}</span>
          {!sidebarCollapsed && <span>Public Careers (/jobs) ↗</span>}
        </div>
      </div>

      {/* Sidebar Pinned Quick Tools (Chats, Team, Settings) */}
      <div style={{
        padding: '7px 10px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'space-around',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '11.5px',
        background: '#350d36'
      }}>
        {!sidebarCollapsed ? (
          <>
            <div
              onClick={() => {
                if (onOpenChatModal) onOpenChatModal()
                else navigate('/inbox?tab=chat')
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 6px', borderRadius: '4px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              title="Open Team Chats"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderAtsIcon('chat', 13, 'currentColor')}</span>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>Chats</span>
            </div>
            <div
              onClick={() => {
                if (onSelectInternalTab) onSelectInternalTab('users')
                else navigate('/ats?tab=users')
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 6px', borderRadius: '4px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              title="Team Members"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderAtsIcon('users', 13, 'currentColor')}</span>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>Team</span>
            </div>
            <div
              onClick={() => {
                if (onSelectInternalTab) onSelectInternalTab('settings')
                else navigate('/ats?tab=settings')
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 6px', borderRadius: '4px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              title="Workspace Settings"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderAtsIcon('settings', 13, 'currentColor')}</span>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>Settings</span>
            </div>
          </>
        ) : (
          <div
            onClick={() => {
              if (onOpenChatModal) onOpenChatModal()
              else navigate('/inbox')
            }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.7)' }}
            title="Candidate Chat"
          >
            {renderAtsIcon('chat', 15, 'currentColor')}
          </div>
        )}
      </div>

      {/* Recruiter Profile / Logout Footer */}
      {!sidebarCollapsed ? (
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: '#350d36',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#0284c7', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '11px', flexShrink: 0
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                {userRole}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.7)',
              padding: '4px 6px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          >
            Exit
          </button>
        </div>
      ) : (
        <div style={{
          padding: '10px 0',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: '#350d36',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div
            onClick={handleLogout}
            title={`Logged in as ${userName} (${userEmail}) — Click to Log Out`}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#0284c7', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '11px', cursor: 'pointer'
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </aside>
  )
}
