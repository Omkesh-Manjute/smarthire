import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navigation() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let user = null
  try {
    if (userStr) user = JSON.parse(userStr)
  } catch (e) {}

  const isAuthenticated = localStorage.getItem('smarthire_authenticated') === 'true' || localStorage.getItem('verifyhire_authenticated') === 'true'

  // Dynamic Role State (Allows switching between Super Admin and External Recruiter Tester mode)
  const defaultRole = (user && user.role) ? user.role : 'superadmin'
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('smarthire_active_role') || defaultRole
  })

  const isSuperAdmin = activeRole === 'superadmin' || activeRole === 'admin'

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

  let items = []
  if (isAuthenticated) {
    items = [
      { to: '/ats', label: 'AI Recruiter ATS', badge: 'PRO' },
    ]

    // Admin-only items
    if (isSuperAdmin) {
      items.push({ to: '/dashboard', label: 'Dashboard & Links' })
      items.push({ to: '/reports', label: 'Intelligence & Reports' })
      items.push({ to: '/linkedin-posts', label: 'LinkedIn Automation', badge: 'SUPER ADMIN' })
      items.push({ to: '/branding', label: 'AI Branding & Socials' })
    }

    items.push({ to: '/pricing', label: 'Pricing Plans' })
  } else {
    items = [
      { to: '/#features', label: 'Core Features' },
      { to: '/#pricing', label: 'Pricing Plans' },
      { to: '/contact', label: 'Support Contact' },
    ]
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link to="/" className="brand" onClick={() => setIsOpen(false)}>
          <span className="brand-mark-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 11 2 2 4-4" />
            </svg>
          </span>
          <div className="brand-text-wrap">
            <span className="brand-text">SmartHire</span>
            <span className="brand-badge-pro">{isSuperAdmin ? 'ENTERPRISE' : 'RECRUITER PRO'}</span>
          </div>
        </Link>

        {/* ROLE SWITCHER TOGGLE IN NAVIGATION */}
        {isAuthenticated && (
          <button
            onClick={toggleRoleMode}
            title="Toggle view between Admin Console and Recruiter Workspace"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              border: isSuperAdmin ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(99,102,241,0.4)',
              background: isSuperAdmin ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
              color: isSuperAdmin ? '#f59e0b' : '#6366f1',
              marginRight: '8px'
            }}
          >
            <span>{isSuperAdmin ? '👑 Admin View' : '💼 Recruiter View'}</span>
            <span style={{ opacity: 0.7, fontSize: '10px' }}>(Switch ⇄)</span>
          </button>
        )}

        <button className="menu-btn" onClick={() => setIsOpen((value) => !value)} aria-label="Toggle menu">
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${isOpen ? 'open' : ''}`}>
          {items.map((item) => {
            const isHash = item.to.startsWith('/#')
            const isActive = isHash 
              ? location.pathname === '/' && location.hash === item.to.substring(1)
              : location.pathname === item.to;
              
            return (
              <a
                key={item.to}
                href={item.to}
                className={`nav-link-item ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  setIsOpen(false)
                  if (isHash) {
                    e.preventDefault()
                    window.location.hash = item.to.substring(2)
                  } else {
                    window.location.href = item.to
                  }
                }}
              >
                {item.label}
                {item.badge && <span className="nav-badge-pill">{item.badge}</span>}
              </a>
            )
          })}
          <div className="nav-actions-group">
            {isAuthenticated ? (
              <button 
                onClick={handleSignOut} 
                className="nav-signin-btn" 
                style={{ 
                  background: 'rgba(181, 71, 79, 0.08)', 
                  color: 'var(--danger)', 
                  border: '1px solid rgba(181, 71, 79, 0.2)',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '600'
                }}
              >
                Sign Out ⎋
              </button>
            ) : (
              <a href="/#login" className="nav-signin-btn">
                Recruiter Portal →
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Navigation

