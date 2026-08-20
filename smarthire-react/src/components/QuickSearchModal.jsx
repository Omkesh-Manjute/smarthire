import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SEARCH_ITEMS = [
  { id: 'ats-dash', title: 'ATS Dashboard', category: 'ATS Suite', icon: '📊', path: '/ats?tab=dashboard', keywords: 'stats metrics overview candidates jobs' },
  { id: 'ats-jobs', title: 'Jobs Hub & Management', category: 'ATS Suite', icon: '💼', path: '/ats?tab=jobs', keywords: 'jobs vacancies openings post jd parse' },
  { id: 'ats-cand', title: 'Candidates Directory', category: 'ATS Suite', icon: '👤', path: '/ats?tab=candidates', keywords: 'candidates talent resumes applicants profiles' },
  { id: 'ats-pipe', title: 'Visual Hiring Pipeline', category: 'ATS Suite', icon: '📈', path: '/ats?tab=pipeline', keywords: 'pipeline kanban stages status workflow' },
  { id: 'ats-screen', title: 'AI Screening & Anti-Proxy', category: 'ATS Suite', icon: '🔍', path: '/ats?tab=screening', keywords: 'screening ai bot interview liveness verification' },
  { id: 'ats-sub', title: 'Client Submissions', category: 'ATS Suite', icon: '📤', path: '/ats?tab=submissions', keywords: 'submissions clients rtr client submission' },
  { id: 'ats-rep', title: 'Intelligence & Reports', category: 'Analytics', icon: '📑', path: '/reports', keywords: 'reports analytics conversion charts metrics export' },
  { id: 'ats-auto', title: 'ATS Automation & Rules', category: 'ATS Suite', icon: '⚙️', path: '/ats?tab=automation', keywords: 'automation webhooks integrations n8n rules' },
  { id: 'ats-inbox', title: 'Recruiter Inbox & Chat', category: 'Communication', icon: '💬', path: '/inbox', keywords: 'inbox messages candidate chat direct real-time' },
  { id: 'ats-set', title: 'ATS Workspace Settings', category: 'Administration', icon: '🛠️', path: '/ats?tab=settings', keywords: 'settings config email templates stages' },
  { id: 'ats-users', title: 'Manage Team Users & Roles', category: 'Administration', icon: '👥', path: '/ats?tab=users', keywords: 'users team recruiters permissions access roles' },
  
  { id: 'pg-exec', title: 'Executive Command Console', category: 'Navigation', icon: '⚡', path: '/dashboard', keywords: 'dashboard executive summary verify command' },
  { id: 'pg-li', title: 'LinkedIn Automation Studio', category: 'Socials & Automation', icon: '🌐', path: '/linkedin-posts', keywords: 'linkedin social auto post scheduled campaigns' },
  { id: 'pg-brand', title: 'AI Branding & Socials Center', category: 'Creative Tools', icon: '🎨', path: '/branding', keywords: 'branding social flyer banner canvas ai generator' },
  { id: 'pg-careers', title: 'Public Careers Portal', category: 'Public', icon: '🚀', path: '/jobs', keywords: 'careers public job board applicants apply' },
  { id: 'pg-pricing', title: 'Pricing & Enterprise Plans', category: 'Billing', icon: '💳', path: '/pricing', keywords: 'pricing billing subscription plans upgrade' },
]

export default function QuickSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const filtered = SEARCH_ITEMS.filter((item) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (item) => {
    onClose()
    if (item.path.startsWith('/ats?tab=')) {
      const tab = item.path.split('tab=')[1]
      navigate(`/ats?tab=${tab}`)
      // Trigger instant window navigation event in case we are already on /ats
      window.dispatchEvent(new CustomEvent('smarthire_switch_tab', { detail: { tab } }))
    } else {
      navigate(item.path)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="spotlight-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        paddingLeft: '16px',
        paddingRight: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        className="spotlight-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Search Input Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#fafbfc'
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, module, or search candidates & jobs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '15px',
              fontWeight: '500',
              color: '#0f172a',
              fontFamily: 'inherit',
              padding: 0
            }}
          />
          <kbd
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '3px 7px',
              borderRadius: '6px',
              background: '#e2e8f0',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              fontFamily: 'inherit'
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: '360px',
            overflowY: 'auto',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>🔍</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>No matching commands found</div>
              <div style={{ fontSize: '12px' }}>Try searching for "jobs", "candidates", "pipeline", or "reports"</div>
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'linear-gradient(135deg, #eef2ff, #f5f3ff)' : 'transparent',
                    border: isSelected ? '1px solid #c7d2fe' : '1px solid transparent',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', width: '26px', textAlign: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: isSelected ? '700' : '600',
                          color: isSelected ? '#4338ca' : '#1e293b',
                          lineHeight: 1.3
                        }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                        {item.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSelected && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1' }}>
                        Jump →
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid #f1f5f9',
            background: '#f8fafc',
            fontSize: '11.5px',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span><kbd style={{ background: '#e2e8f0', padding: '2px 5px', borderRadius: '4px', fontWeight: '700', color: '#475569' }}>↑</kbd> <kbd style={{ background: '#e2e8f0', padding: '2px 5px', borderRadius: '4px', fontWeight: '700', color: '#475569' }}>↓</kbd> Navigate</span>
            <span><kbd style={{ background: '#e2e8f0', padding: '2px 5px', borderRadius: '4px', fontWeight: '700', color: '#475569' }}>↵</kbd> Select</span>
          </div>
          <span style={{ fontWeight: '600', color: '#6366f1' }}>SmartHire Spotlight Search</span>
        </div>
      </div>
    </div>
  )
}
