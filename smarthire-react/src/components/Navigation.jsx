import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import QuickSearchModal from './QuickSearchModal'
import ActivityNotificationBell from './ActivityNotificationBell'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Dropdown states
  const [appLauncherOpen, setAppLauncherOpen] = useState(false)
  const [atsMenuOpen, setAtsMenuOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [apiOnline, setApiOnline] = useState(true)

  // Refs for click outside handling
  const appLauncherRef = useRef(null)
  const atsMenuRef = useRef(null)
  const quickAddRef = useRef(null)
  const profileMenuRef = useRef(null)

  // User state
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let user = null
  try {
    if (userStr) user = JSON.parse(userStr)
  } catch (e) {}
  const currentUser = user

  const isAuthenticated =
    localStorage.getItem('smarthire_authenticated') === 'true' ||
    localStorage.getItem('verifyhire_authenticated') === 'true' ||
    Boolean(user && (user.email || user.name))

  // Dynamic team users roster lookup for accurate hierarchy
  const teamUsersList = (() => {
    try {
      const raw = localStorage.getItem('smarthire_recruiters')
      if (raw) return JSON.parse(raw) || []
    } catch(e) {}
    return []
  })()

  const matchedUserInTeam = teamUsersList.find(u =>
    (u.email && user?.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
    (u.name && user?.name && u.name.toLowerCase() === user.name.toLowerCase())
  )

  const effectiveParentRecruiterName = 
    user?.parentRecruiterName || 
    matchedUserInTeam?.parentRecruiterName || 
    (user?.name?.toLowerCase().includes('gourav') || user?.email?.toLowerCase().includes('gourav') ? 'Omkesh' : (user?.role === 'employee' ? 'Sukamal Chatterjee' : ''))

  const realUserRole = user?.role || 'recruiter'
  const isEmployee = realUserRole === 'employee'
  const isManager = realUserRole === 'manager'
  const isRecruiter = realUserRole === 'recruiter'
  const isSuperAdmin = (realUserRole === 'superadmin' || realUserRole === 'admin') && !isEmployee && !isManager
  const canSwitchRoles = isSuperAdmin
  const defaultRole = user && user.role ? user.role : 'recruiter'
  const [activeRole, setActiveRole] = useState(() => {
    return isSuperAdmin ? (localStorage.getItem('smarthire_active_role') || 'superadmin') : defaultRole
  })

  const isReportee = Boolean(effectiveParentRecruiterName && !isSuperAdmin && !isManager && effectiveParentRecruiterName.toLowerCase() !== (user?.name || '').toLowerCase())

  // Load permissions
  const [permissions, setPermissions] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_role_permissions')
      return saved ? JSON.parse(saved) : null
    } catch(e) { return null }
  })

  useEffect(() => {
    const handlePermUpdate = () => {
      try {
        const saved = localStorage.getItem('smarthire_role_permissions')
        if (saved) setPermissions(JSON.parse(saved))
      } catch(e) {}
    }
    window.addEventListener('smarthire_permissions_updated', handlePermUpdate)
    return () => window.removeEventListener('smarthire_permissions_updated', handlePermUpdate)
  }, [])

  const currentRoleKey = isSuperAdmin ? 'superadmin' : isManager ? 'manager' : isEmployee ? 'employee' : 'recruiter'

  const isPageAllowed = (pageId) => {
    if (isSuperAdmin) return true
    if (isEmployee) {
      return pageId === 'dashboard'
    }
    if (permissions && permissions[currentRoleKey]) {
      return permissions[currentRoleKey][pageId] !== false
    }
    // Safe defaults
    if (isManager) {
      return ['dashboard', 'reports', 'ats', 'inbox'].includes(pageId)
    }
    if (isRecruiter) {
      return ['dashboard', 'ats', 'inbox', 'jobs'].includes(pageId)
    }
    return false
  }

  // Live health check
  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? setApiOnline(true) : setApiOnline(false)))
      .catch(() => setApiOnline(false))
  }, [])

  // Keyboard shortcut for Spotlight (Ctrl+K or Cmd+K) - Strictly Super Admin only
  useEffect(() => {
    if (!isSuperAdmin) return
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchModalOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSuperAdmin])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (appLauncherRef.current && !appLauncherRef.current.contains(e.target)) {
        setAppLauncherOpen(false)
      }
      if (atsMenuRef.current && !atsMenuRef.current.contains(e.target)) {
        setAtsMenuOpen(false)
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) {
        setQuickAddOpen(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setAppLauncherOpen(false)
    setAtsMenuOpen(false)
    setQuickAddOpen(false)
    setProfileMenuOpen(false)
  }, [location.pathname, location.search])

  const toggleRoleMode = () => {
    const nextRole = isSuperAdmin ? 'recruiter' : 'superadmin'
    localStorage.setItem('smarthire_active_role', nextRole)
    setActiveRole(nextRole)
    window.location.reload()
  }

  const handleSignOut = () => {
    localStorage.removeItem('smarthire_authenticated')
    localStorage.removeItem('verifyhire_authenticated')
    localStorage.removeItem('smarthire_user')
    localStorage.removeItem('verifyhire_user')
    localStorage.removeItem('smarthire_token')
    localStorage.removeItem('smarthire_active_role')
    window.location.href = '/'
  }

  const navigateToAtsTab = (tab) => {
    setAtsMenuOpen(false)
    setMobileMenuOpen(false)
    navigate(`/ats?tab=${tab}`)
    window.dispatchEvent(new CustomEvent('smarthire_switch_tab', { detail: { tab } }))
  }

  const getUserInitials = () => {
    if (user && user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    return isSuperAdmin ? 'SA' : isManager ? 'MG' : isEmployee ? 'EM' : 'RC'
  }

  const atsSubModules = [
    { id: 'jobs', label: 'Jobs Hub', desc: 'Manage vacancies & scrape JDs', icon: '💼' },
    { id: 'candidates', label: 'Candidates Directory', desc: 'Profiles, resumes & filters', icon: '👤' },
    { id: 'pipeline', label: 'Visual Pipeline', desc: 'Kanban board & hiring stages', icon: '📈' },
    { id: 'screening', label: 'AI Screening Bot', desc: 'Real-time anti-proxy & chats', icon: '🔍' },
    { id: 'submissions', label: 'Submissions & RTR', desc: 'Client submissions & tracking', icon: '📤' },
  ]

  const appLauncherItems = [
    { title: 'AI Recruiter ATS', desc: 'Core talent pipeline & screening suite', icon: '💼', path: '/ats', color: '#4f46e5' },
    { title: 'Executive Console', desc: 'Command center & high-level stats', icon: '📊', path: '/dashboard', color: '#2563eb', adminOnly: true },
    { title: 'Intelligence Reports', desc: 'Conversion charts & hiring velocity', icon: '📑', path: '/reports', color: '#059669', adminOnly: true },
    { title: 'LinkedIn Automation', desc: 'Auto-post openings & talent outreach', icon: '🌐', path: '/linkedin-posts', color: '#0284c7', adminOnly: true },
    { title: 'AI Branding Studio', desc: 'Social flyers, banners & marketing', icon: '🎨', path: '/branding', color: '#7c3aed', adminOnly: true },
    { title: 'Recruiter Inbox', desc: 'Direct 1-on-1 candidate messaging', icon: '💬', path: '/inbox', color: '#ea580c' },
    { title: 'Public Job Board', desc: 'Candidate-facing career portal', icon: '🚀', path: '/jobs', color: '#16a34a' },
    { title: 'Pricing & Plans', desc: 'Enterprise billing & upgrades', icon: '💳', path: '/pricing', color: '#475569', adminOnly: true },
  ]

  return (
    <>
      <header className="site-header enterprise-nav-root">
        <div className="nav-container-pro">
          {/* ─── LEFT: BRAND & APP LAUNCHER ─── */}
          <div className="nav-left-cluster">
            {/* 9-Dot App Launcher (Zoho Style) - Strictly Hidden for Employee */}
            {isAuthenticated && !isEmployee && (
              <div className="nav-dropdown-wrapper" ref={appLauncherRef}>
                <button
                  className={`app-launcher-btn ${appLauncherOpen ? 'active' : ''}`}
                  onClick={() => setAppLauncherOpen(!appLauncherOpen)}
                  title="SmartHire Apps & Modules Launcher"
                  aria-label="App Launcher"
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="4" cy="4" r="2" />
                    <circle cx="10" cy="4" r="2" />
                    <circle cx="16" cy="4" r="2" />
                    <circle cx="4" cy="10" r="2" />
                    <circle cx="10" cy="10" r="2" />
                    <circle cx="16" cy="10" r="2" />
                    <circle cx="4" cy="16" r="2" />
                    <circle cx="10" cy="16" r="2" />
                    <circle cx="16" cy="16" r="2" />
                  </svg>
                </button>

                {/* App Launcher Popover */}
                {appLauncherOpen && (
                  <div className="app-launcher-popover shadow-enterprise">
                    <div className="app-launcher-header">
                      <div>
                        <div className="launcher-title">SmartHire Ecosystem</div>
                        <div className="launcher-subtitle">Unified AI Talent & Automation Hub</div>
                      </div>
                      <span className="launcher-badge">{isSuperAdmin ? 'ENTERPRISE' : isManager ? 'MANAGER' : 'RECRUITER'}</span>
                    </div>

                    <div className="app-launcher-grid">
                      {appLauncherItems
                        .filter((item) => {
                          if (item.adminOnly && !isSuperAdmin) return false
                          if (item.path === '/ats' && !isPageAllowed('ats')) return false
                          if (item.path === '/reports' && !isPageAllowed('reports')) return false
                          if (item.path === '/dashboard' && !isPageAllowed('dashboard')) return false
                          return true
                        })
                        .map((app) => (
                          <div
                            key={app.title}
                            className="launcher-grid-item"
                            onClick={() => {
                              setAppLauncherOpen(false)
                              navigate(app.path)
                            }}
                          >
                            <div className="launcher-icon-box" style={{ background: `${app.color}15`, color: app.color }}>
                              {app.icon}
                            </div>
                            <div className="launcher-item-text">
                              <span className="launcher-item-name">{app.title}</span>
                              <span className="launcher-item-desc">{app.desc}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Brand Logo & Name */}
            <Link to={isEmployee ? "/dashboard" : "/"} className="brand-logo-link" onClick={() => setMobileMenuOpen(false)}>
              <span className="brand-shield-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
              </span>
              <div className="brand-title-wrap">
                <span className="brand-name">SmartHire</span>
                <span className="brand-edition-tag" style={{ background: isEmployee ? '#16a34a' : undefined }}>
                  {isEmployee ? 'EMPLOYEE' : isManager ? 'MANAGER' : isSuperAdmin ? 'ENTERPRISE' : 'PRO'}
                </span>
              </div>
            </Link>

            <div className="nav-vertical-divider" />
          </div>

          {/* ─── CENTER: PRIMARY ENTERPRISE TABS ─── */}
          <nav className="nav-center-menu">
            {isAuthenticated ? (
              <>
                {isPageAllowed('dashboard') && (
                  <Link
                    to="/dashboard"
                    className={`nav-tab-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  >
                    <span className="nav-tab-icon">📊</span>
                    <span>{isEmployee ? 'My Workspace' : 'Dashboard'}</span>
                  </Link>
                )}

                {/* ATS Workspace with Direct Navigation & Dropdown - Controlled by isPageAllowed('ats') */}
                {!isEmployee && isPageAllowed('ats') && (
                  <div
                    className="nav-dropdown-wrapper"
                    ref={atsMenuRef}
                    onMouseEnter={() => setAtsMenuOpen(true)}
                    onMouseLeave={() => setAtsMenuOpen(false)}
                    style={{ display: 'inline-flex', position: 'relative' }}
                  >
                    <Link
                      to="/ats"
                      className={`nav-tab-item dropdown-toggle ${
                        location.pathname.startsWith('/ats') ? 'active' : ''
                      } ${atsMenuOpen ? 'menu-open' : ''}`}
                      onClick={() => setAtsMenuOpen(false)}
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span className="nav-tab-icon">💼</span>
                      <span>ATS Workspace</span>
                      <span
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setAtsMenuOpen(!atsMenuOpen)
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', padding: '2px', cursor: 'pointer' }}
                        title="View ATS Modules"
                      >
                        <svg className="chevron-down-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </Link>

                    {atsMenuOpen && (
                      <div className="nav-sub-dropdown shadow-enterprise" style={{ zIndex: 1000 }}>
                        <div className="dropdown-section-title">Core ATS Modules</div>
                        {atsSubModules.map((sub) => (
                          <button
                            key={sub.id}
                            className="dropdown-item-btn"
                            onClick={() => navigateToAtsTab(sub.id)}
                          >
                            <span className="dropdown-item-icon">{sub.icon}</span>
                            <div className="dropdown-item-content">
                              <span className="dropdown-item-label">{sub.label}</span>
                              <span className="dropdown-item-sub">{sub.desc}</span>
                            </div>
                          </button>
                        ))}

                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-item-btn open-all-btn"
                          onClick={() => {
                            setAtsMenuOpen(false)
                            navigate('/ats')
                          }}
                        >
                          <span>Open Full ATS Console</span>
                          <span>→</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isPageAllowed('reports') && (
                  <Link
                    to="/reports"
                    className={`nav-tab-item ${location.pathname === '/reports' ? 'active' : ''}`}
                  >
                    <span className="nav-tab-icon">📑</span>
                    <span>Reports</span>
                  </Link>
                )}

                {isSuperAdmin && isPageAllowed('linkedin') && (
                  <Link
                    to="/linkedin-posts"
                    className={`nav-tab-item ${location.pathname === '/linkedin-posts' ? 'active' : ''}`}
                  >
                    <span className="nav-tab-icon">🌐</span>
                    <span>LinkedIn Auto</span>
                  </Link>
                )}

                {isSuperAdmin && isPageAllowed('branding') && (
                  <Link
                    to="/branding"
                    className={`nav-tab-item ${location.pathname === '/branding' ? 'active' : ''}`}
                  >
                    <span className="nav-tab-icon">🎨</span>
                    <span>Branding</span>
                  </Link>
                )}

                {!isEmployee && isPageAllowed('jobs') && (
                  <Link
                    to="/jobs"
                    className={`nav-tab-item ${location.pathname === '/jobs' ? 'active' : ''}`}
                  >
                    <span className="nav-tab-icon">🚀</span>
                    <span>Careers</span>
                  </Link>
                )}

                {isSuperAdmin && (
                  <Link
                    to="/pricing"
                    className={`nav-tab-item ${location.pathname === '/pricing' ? 'active' : ''}`}
                  >
                    <span className="nav-tab-icon">💳</span>
                    <span>Pricing</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <a href="/#features" className="nav-tab-item">
                  Core Features
                </a>
                <Link to="/jobs" className="nav-tab-item">
                  Careers Portal
                </Link>
                <a href="/#pricing" className="nav-tab-item">
                  Enterprise Pricing
                </a>
                <Link to="/about" className="nav-tab-item">
                  About Platform
                </Link>
                <Link to="/contact" className="nav-tab-item">
                  Support
                </Link>
              </>
            )}
          </nav>

          {/* ─── RIGHT: UTILITIES, SEARCH, ACTIONS & PROFILE ─── */}
          <div className="nav-right-cluster">
            {isAuthenticated ? (
              <>
                {/* Global Search Trigger (Ctrl+K) - Strictly Super Admin only */}
                {isSuperAdmin && (
                  <button
                    className="nav-search-trigger"
                    onClick={() => setSearchModalOpen(true)}
                    title="Spotlight Search (Ctrl+K)"
                    aria-label="Quick Search"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="search-placeholder-text">Search candidates, jobs...</span>
                    <kbd className="search-kbd-badge">⌘K</kbd>
                  </button>
                )}

                {/* Quick Add Button (+) - Strictly Super Admin */}
                {isSuperAdmin && (
                  <div className="nav-dropdown-wrapper" ref={quickAddRef}>
                    <button
                      className={`nav-quick-add-btn ${quickAddOpen ? 'active' : ''}`}
                      onClick={() => setQuickAddOpen(!quickAddOpen)}
                      title="Quick Action / Create New"
                      aria-label="Quick Add"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>

                    {quickAddOpen && (
                      <div className="quick-add-popover shadow-enterprise">
                        <div className="quick-add-header">Quick Creation Actions</div>
                        {(isSuperAdmin || isManager) && (
                          <button
                            className="quick-add-item"
                            onClick={() => {
                              setQuickAddOpen(false)
                              navigateToAtsTab('jobs')
                            }}
                          >
                            <span className="quick-add-icon">💼</span>
                            <div>
                              <div className="quick-add-label">Post New Vacancy</div>
                              <div className="quick-add-desc">Add requisition or scrape JD</div>
                            </div>
                          </button>
                        )}

                        <button
                          className="quick-add-item"
                          onClick={() => {
                            setQuickAddOpen(false)
                            navigateToAtsTab('candidates')
                          }}
                        >
                          <span className="quick-add-icon">👤</span>
                          <div>
                            <div className="quick-add-label">Add / Parse Candidate</div>
                            <div className="quick-add-desc">Upload resume docx/pdf</div>
                          </div>
                        </button>

                        <button
                          className="quick-add-item"
                          onClick={() => {
                            setQuickAddOpen(false)
                            navigateToAtsTab('screening')
                          }}
                        >
                          <span className="quick-add-icon">🔍</span>
                          <div>
                            <div className="quick-add-label">Launch AI Screening</div>
                            <div className="quick-add-desc">Anti-proxy interview chat</div>
                          </div>
                        </button>

                        {isSuperAdmin && (
                          <button
                            className="quick-add-item"
                            onClick={() => {
                              setQuickAddOpen(false)
                              navigate('/linkedin-posts')
                            }}
                          >
                            <span className="quick-add-icon">🌐</span>
                            <div>
                              <div className="quick-add-label">Create LinkedIn Post</div>
                              <div className="quick-add-desc">Automated social job outreach</div>
                            </div>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* API Status Pill - Hidden for Employee */}
                {!isEmployee && (
                  <div
                    className={`nav-status-pill ${apiOnline ? 'online' : 'offline'}`}
                    title={apiOnline ? 'All SmartHire microservices operational' : 'Backend connection interrupted'}
                  >
                    <span className="status-pulse-dot" />
                    <span className="status-text">{apiOnline ? 'Live' : 'Offline'}</span>
                  </div>
                )}

                {/* Inbox / Messages Icon */}
                <Link
                  to="/inbox"
                  className="nav-icon-action-btn"
                  title={isReportee ? `Message Lead Recruiter (${effectiveParentRecruiterName})` : 'Recruiter Messages & Inbox'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="nav-notification-badge">●</span>
                </Link>

                {/* Role Switcher Pill */}
                {canSwitchRoles && !isEmployee && (
                  <button
                    className={`nav-role-switcher-pill ${isSuperAdmin ? 'admin-theme' : 'recruiter-theme'}`}
                    onClick={toggleRoleMode}
                    title="Click to toggle workspace view mode"
                  >
                    <span className="role-icon">{isSuperAdmin ? '👑' : '💼'}</span>
                    <span className="role-label">{isSuperAdmin ? 'Admin' : 'Recruiter'}</span>
                    <span className="role-switch-badge">⇄</span>
                  </button>
                )}

                {/* Single Live Activity Notification Bell (Right next to User Profile) */}
                <div style={{ display: 'inline-flex', alignItems: 'center', margin: '0 2px' }}>
                  <ActivityNotificationBell theme="default" onSelectNotification={(n) => {
                    navigate('/dashboard')
                  }} />
                </div>

                {/* User Profile Avatar & Dropdown */}
                <div className="nav-dropdown-wrapper" ref={profileMenuRef}>
                  <button
                    className={`nav-profile-avatar-btn ${profileMenuOpen ? 'active' : ''}`}
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    aria-label="User profile menu"
                  >
                    <div className="avatar-circle" style={{ background: isEmployee ? '#16a34a' : undefined }}>{getUserInitials()}</div>
                    <svg className="avatar-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {profileMenuOpen && (
                    <div className="nav-profile-dropdown shadow-enterprise">
                      <div className="profile-dropdown-header">
                        <div className="profile-header-avatar">{getUserInitials()}</div>
                        <div className="profile-header-info">
                          <div className="profile-user-name">
                            {user?.name || (isSuperAdmin ? 'Administrator' : 'Recruiter')}
                          </div>
                          <div className="profile-user-email">
                            {user?.email || 'omkesh@coolsofttech.com'}
                          </div>
                          <div className="profile-role-tag" style={{ background: isEmployee ? '#dcfce7' : undefined, color: isEmployee ? '#166534' : undefined }}>
                            {isEmployee ? `🔒 Employee (${user?.parentRecruiterName ? 'reports to ' + user.parentRecruiterName : 'Team Member'})` : isManager ? '👔 Manager Console' : isSuperAdmin ? '👑 Super Admin Console' : '💼 Lead Recruiter Portal'}
                          </div>
                        </div>
                      </div>

                      <div className="profile-menu-body">
                        {canSwitchRoles && (
                          <button
                            className="profile-menu-link"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              toggleRoleMode()
                            }}
                          >
                            <span className="menu-link-icon">⇄</span>
                            <span>Switch to {isSuperAdmin ? 'Recruiter Mode' : 'Super Admin Mode'}</span>
                          </button>
                        )}

                        {!isEmployee && (
                          <button
                            className="profile-menu-link"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              navigateToAtsTab('settings')
                            }}
                          >
                            <span className="menu-link-icon">⚙️</span>
                            <span>Workspace Settings</span>
                          </button>
                        )}

                        {(isSuperAdmin || isManager) && (
                          <button
                            className="profile-menu-link"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              navigate('/dashboard')
                            }}
                          >
                            <span className="menu-link-icon">👥</span>
                            <span>Manage Team & Employees</span>
                          </button>
                        )}

                        {isReportee ? (
                          <button
                            className="profile-menu-link"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              navigate('/inbox')
                            }}
                          >
                            <span className="menu-link-icon">💬</span>
                            <span>Message Lead Recruiter ({effectiveParentRecruiterName})</span>
                          </button>
                        ) : (
                          <button
                            className="profile-menu-link"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              navigate('/inbox')
                            }}
                          >
                            <span className="menu-link-icon">💬</span>
                            <span>Candidate Inbox</span>
                          </button>
                        )}
                      </div>

                      <div className="profile-dropdown-footer">
                        <button className="profile-signout-btn" onClick={handleSignOut}>
                          <span>Sign Out</span>
                          <span style={{ fontSize: '14px' }}>⎋</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="public-auth-cluster">
                <a href="/#login" className="btn btn-login-portal">
                  <span>Recruiter Portal</span>
                  <span>→</span>
                </a>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              className={`mobile-hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* ─── MOBILE RESPONSIVE DRAWER ─── */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            {isAuthenticated ? (
              <div className="mobile-menu-content">
                <div className="mobile-user-card">
                  <div className="mobile-user-avatar">{getUserInitials()}</div>
                  <div>
                    <div className="mobile-user-name">{user?.name || 'Recruiter'}</div>
                    <div className="mobile-user-email">{user?.email || 'Logged In'}</div>
                  </div>
                </div>

                <div className="mobile-section-label">Navigation</div>
                {isPageAllowed('dashboard') && (
                  <Link to="/dashboard" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>📊 {isEmployee ? 'My Workspace' : 'Executive Dashboard'}</span>
                  </Link>
                )}
                {!isEmployee && isPageAllowed('ats') && (
                  <Link to="/ats" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>💼 ATS Workspace</span>
                  </Link>
                )}
                {isPageAllowed('reports') && (
                  <Link to="/reports" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>📑 Intelligence & Reports</span>
                  </Link>
                )}
                {isSuperAdmin && isPageAllowed('linkedin') && (
                  <Link to="/linkedin-posts" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>🌐 LinkedIn Automation</span>
                  </Link>
                )}
                {isSuperAdmin && isPageAllowed('branding') && (
                  <Link to="/branding" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>🎨 AI Branding Center</span>
                  </Link>
                )}
                {!isEmployee && (
                  <Link to="/inbox" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>💬 Recruiter Inbox</span>
                  </Link>
                )}
                {!isEmployee && isPageAllowed('jobs') && (
                  <Link to="/jobs" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>🚀 Public Careers</span>
                  </Link>
                )}
                {isSuperAdmin && (
                  <Link to="/pricing" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span>💳 Pricing Plans</span>
                  </Link>
                )}

                {canSwitchRoles && (
                  <>
                    <div className="mobile-section-label">Role Switcher</div>
                    <button className="mobile-role-btn" onClick={toggleRoleMode}>
                      <span>Current: {isSuperAdmin ? '👑 Super Admin' : '💼 Recruiter'}</span>
                      <span>(Switch Mode ⇄)</span>
                    </button>
                  </>
                )}

                <div className="mobile-drawer-footer">
                  <button className="btn btn-danger-mobile" onClick={handleSignOut}>
                    Sign Out ⎋
                  </button>
                </div>
              </div>
            ) : (
              <div className="mobile-menu-content">
                <a href="/#features" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  Core Features
                </a>
                <Link to="/jobs" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  Public Careers
                </Link>
                <a href="/#pricing" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  Enterprise Pricing
                </a>
                <Link to="/about" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  About Us
                </Link>
                <Link to="/contact" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                  Support
                </Link>
                <div style={{ marginTop: '16px' }}>
                  <a href="/#login" className="btn btn-login-portal w-100" onClick={() => setMobileMenuOpen(false)}>
                    Sign In to Recruiter Portal →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Global Spotlight Search Palette Modal */}
      {isSuperAdmin && (
        <QuickSearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
        />
      )}
    </>
  )
}

export default Navigation
