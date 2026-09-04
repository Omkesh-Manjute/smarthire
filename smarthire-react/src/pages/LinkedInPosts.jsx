import React, { useState, useEffect, useCallback } from 'react'
import SiteLayout from '../components/SiteLayout'

const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
const API_BASE = `${BACKEND_BASE}/api/linkedin-posts`

const STATUS_CONFIG = {
  pending: { label: 'Awaiting Approval', color: '#db7f35', bg: 'rgba(219, 127, 53, 0.12)', icon: '⏳' },
  approved: { label: 'Approved — Scheduling', color: '#126a5a', bg: 'rgba(18, 106, 90, 0.12)', icon: '✅' },
  cancelled: { label: 'Cancelled', color: '#b5474f', bg: 'rgba(181, 71, 79, 0.12)', icon: '❌' },
  posted: { label: 'Posted on LinkedIn', color: '#2a68b5', bg: 'rgba(42, 104, 181, 0.12)', icon: '🚀' },
}

function CarouselViewer({ slides }) {
  const [active, setActive] = useState(0)
  if (!slides || slides.length === 0) return null
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        width: '100%', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden',
        background: '#1d2b2a', border: '1px solid var(--line)',
        boxShadow: '0 8px 30px rgba(18, 39, 35, 0.15)',
      }}>
        <img
          src={slides[active]}
          alt={`Slide ${active + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%231d2b2a"/><text x="50%" y="50%" fill="%2353625f" font-size="14" text-anchor="middle" dy=".3em">Slide ' + (active + 1) + '</text></svg>' }}
        />
      </div>
      {/* Slide counter */}
      <div style={{
        position: 'absolute', top: 12, right: 12, background: 'rgba(29, 43, 42, 0.85)',
        color: '#fffdf8', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
        fontFamily: 'Outfit, sans-serif'
      }}>
        {active + 1} / {slides.length}
      </div>
      {/* Navigation arrows */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
        <button
          onClick={() => setActive(a => Math.max(0, a - 1))}
          disabled={active === 0}
          style={{
            background: active === 0 ? 'var(--surface-2)' : 'var(--brand)',
            border: '1px solid var(--line)',
            color: active === 0 ? 'var(--ink-soft)' : '#fffdf8',
            borderRadius: 8, padding: '8px 18px',
            cursor: active === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14,
            transition: 'all 0.2s',
          }}
        >← Prev</button>
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 20 : 8, height: 8, borderRadius: 4, border: 'none',
                background: i === active ? 'var(--brand)' : 'var(--line)',
                cursor: 'pointer', padding: 0, transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setActive(a => Math.min(slides.length - 1, a + 1))}
          disabled={active === slides.length - 1}
          style={{
            background: active === slides.length - 1 ? 'var(--surface-2)' : 'var(--brand)',
            border: '1px solid var(--line)',
            color: active === slides.length - 1 ? 'var(--ink-soft)' : '#fffdf8',
            borderRadius: 8, padding: '8px 18px',
            cursor: active === slides.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14,
            transition: 'all 0.2s',
          }}
        >Next →</button>
      </div>
    </div>
  )
}

function PostCard({ title, icon, content, type, assets }) {
  const [expanded, setExpanded] = useState(false)
  const preview = content ? content.slice(0, 240) : ''
  const needsTruncate = content && content.length > 240

  return (
    <div className="card" style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius)', padding: 28, marginBottom: 20,
      boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
        <span style={{
          fontSize: 24, background: 'rgba(18, 106, 90, 0.08)', width: 48, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12,
          color: 'var(--brand)',
        }}>{icon}</span>
        <div>
          <div style={{ color: 'var(--brand-2)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
            {type}
          </div>
          <h3 style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 18, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{title}</h3>
        </div>
      </div>

      {/* Carousel slides viewer */}
      {type === 'CAROUSEL' && assets?.carouselSlides?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <CarouselViewer slides={assets.carouselSlides} />
          {assets.carouselPdfUrl && (
            <a
              href={`${BACKEND_BASE}${assets.carouselPdfUrl}`}
              download
              className="btn btn-ghost"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16,
                padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                textDecoration: 'none', transition: 'all 0.2s', width: '100%', justifyContent: 'center',
              }}
            >
              📄 Download PDF Document
            </a>
          )}
        </div>
      )}

      {/* Infographic image */}
      {type === 'INFOGRAPHIC' && assets?.infographicUrl && (
        <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
          <img
            src={`${BACKEND_BASE}${assets.infographicUrl}`}
            alt="Infographic"
            style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain', background: '#f8f5f0' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
      )}

      {/* Post text content */}
      {content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            color: 'var(--ink)', lineHeight: 1.75, fontSize: 14.5, whiteSpace: 'pre-wrap',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}>
            {expanded || !needsTruncate ? content : preview + '...'}
          </div>
          {needsTruncate && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, padding: 0, textAlign: 'left',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {expanded ? '▲ Show Less' : '▼ Read Full Post'}
            </button>
          )}
        </div>
      )}

      {!content && (
        <div style={{
          color: 'var(--ink-soft)', fontSize: 14, fontStyle: 'italic',
          padding: '20px 0', textAlign: 'center',
        }}>
          Post content not available. Run pipeline.
        </div>
      )}
    </div>
  )
}

function LinkedInPosts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/today`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to load posts')
      }
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/approve`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        showToast('✅ Approved! Telegram notified. Queueing LinkedIn schedule...', 'success')
        setData(d => d ? { ...d, approvalStatus: 'approved' } : d)
      } else {
        showToast('Something went wrong. Try again.', 'error')
      }
    } catch (e) {
      showToast('Network error. Check backend is running.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel today\'s LinkedIn posts?')) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE}/cancel`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        showToast('❌ Cancelled! Telegram notified.', 'error')
        setData(d => d ? { ...d, approvalStatus: 'cancelled' } : d)
      }
    } catch (e) {
      showToast('Network error. Check backend is running.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const statusCfg = data ? (STATUS_CONFIG[data.approvalStatus] || STATUS_CONFIG.pending) : STATUS_CONFIG.pending

  return (
    <SiteLayout>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 9999,
          background: toast.type === 'success' ? 'var(--brand)' : 'var(--danger)',
          color: '#fffdf8', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14,
          boxShadow: '0 8px 32px rgba(18, 39, 35, 0.25)', animation: 'slideIn 0.3s ease',
          maxWidth: 400, border: '1px solid var(--line)', fontFamily: 'Outfit, sans-serif'
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <section className="section" style={{ minHeight: '80vh' }}>
        <div className="container-wide">

          {/* Page Header */}
          <div style={{ marginBottom: 40 }}>
            <p className="eyebrow" style={{ fontSize: 13, letterSpacing: 2.5, fontWeight: 800 }}>
              LinkedIn Automation
            </p>
            <h1 className="page-title" style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, color: 'var(--ink)', marginBottom: 12 }}>
              Daily LinkedIn Posts
            </h1>
            <p className="lead" style={{ fontSize: 16.5, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 640 }}>
              Review today's AI-generated marketing content and interactive visuals for <strong style={{ color: 'var(--brand)', fontWeight: 700 }}>SmartHire</strong> before scheduling.
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--ink-soft)' }}>
              <div style={{
                width: 40, height: 40, border: '3px solid var(--line)',
                borderTop: '3px solid var(--brand)', borderRadius: '50%', margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>Reading content files...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="card" style={{
              borderRadius: 'var(--radius)', padding: 48, textAlign: 'center',
              border: '1px solid var(--line)', boxShadow: 'var(--shadow)',
              background: 'var(--surface)', maxWidth: 600, margin: '0 auto'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <h3 style={{ color: 'var(--ink)', marginBottom: 12, fontSize: 20 }}>No Posts Found</h3>
              <p style={{ color: 'var(--ink-soft)', marginBottom: 24, fontSize: 15 }}>{error}</p>
              <button
                onClick={fetchPosts}
                className="btn"
                style={{
                  background: 'var(--brand)', color: 'white', padding: '12px 30px',
                  fontWeight: 700, borderRadius: 10, cursor: 'pointer', fontSize: 14,
                }}
              >
                🔄 Retry Fetching
              </button>
            </div>
          )}

          {/* Main content */}
          {!loading && !error && data && (
            <div>
              {/* Status bar + actions row */}
              <div className="card" style={{
                display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 36,
                background: 'var(--surface)', borderRadius: 14,
                padding: '24px 30px', border: '1px solid var(--line)',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: statusCfg.bg, color: statusCfg.color,
                    border: `1px solid ${statusCfg.color}40`,
                    borderRadius: 20, padding: '8px 18px', fontSize: 13.5, fontWeight: 700,
                  }}>
                    <span style={{ animation: data.approvalStatus === 'pending' ? 'pulse 2s infinite' : 'none' }}>
                      {statusCfg.icon}
                    </span>
                    {statusCfg.label}
                  </span>
                  <span style={{ color: 'var(--ink-soft)', fontSize: 14, fontWeight: 600 }}>
                    {new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={fetchPosts}
                    disabled={loading || actionLoading}
                    className="btn btn-ghost"
                    style={{
                      borderRadius: 10, padding: '11px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    }}
                  >
                    🔄 Refresh
                  </button>

                  {data.approvalStatus === 'pending' && (
                    <>
                      <button
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className="btn btn-ghost"
                        style={{
                          color: 'var(--danger)', borderColor: 'var(--danger)',
                          borderRadius: 10, padding: '11px 20px', cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: 14, fontWeight: 700,
                        }}
                      >
                        ❌ Cancel
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="btn"
                        style={{
                          background: 'linear-gradient(135deg, var(--brand), #1f8a75)',
                          color: '#fff', border: 'none', borderRadius: 10,
                          padding: '11px 24px', cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: 14, fontWeight: 700, boxShadow: '0 4px 12px rgba(18, 106, 90, 0.18)',
                        }}
                      >
                        {actionLoading ? '⏳ Processing...' : '✅ Approve & Schedule'}
                      </button>
                    </>
                  )}

                  {data.approvalStatus === 'approved' && (
                    <div style={{
                      background: 'rgba(18, 106, 90, 0.08)', color: 'var(--brand)',
                      border: '1px solid rgba(18, 106, 90, 0.25)', borderRadius: 10,
                      padding: '11px 20px', fontSize: 14, fontWeight: 700,
                    }}>
                      ✅ Approved — Posts Scheduling on LinkedIn
                    </div>
                  )}

                  {data.approvalStatus === 'cancelled' && (
                    <div style={{
                      background: 'rgba(181, 71, 79, 0.08)', color: 'var(--danger)',
                      border: '1px solid rgba(181, 71, 79, 0.25)', borderRadius: 10,
                      padding: '11px 20px', fontSize: 14, fontWeight: 700,
                    }}>
                      ❌ Cancelled — No posts scheduled today
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 36 }}>
                {[
                  { label: 'Generated Posts', value: '3 Posts', icon: '📝', color: 'var(--brand)' },
                  { label: 'Carousel slides', value: `${data.assets?.carouselSlides?.length || 0} Slides`, icon: '🖼️', color: 'var(--brand-2)' },
                  { label: 'Infographic ready', value: data.assets?.infographicUrl ? 'Ready' : 'Not generated', icon: '📊', color: '#2a68b5' },
                ].map((stat) => (
                  <div key={stat.label} className="card" style={{
                    background: 'var(--surface)', border: '1px solid var(--line)',
                    borderRadius: 14, padding: '22px 24px', boxShadow: 'var(--shadow)',
                    display: 'flex', alignItems: 'center', gap: 18
                  }}>
                    <div style={{ fontSize: 28 }}>{stat.icon}</div>
                    <div>
                      <div style={{ color: stat.color, fontSize: 22, fontWeight: 800, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stat.value}</div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: 13, fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Posts Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,480px),1fr))', gap: 24 }}>
                <PostCard
                  title="Collaborative Article"
                  icon="📝"
                  type="COLLABORATIVE ARTICLE"
                  content={data.posts.collaborativeArticle}
                  assets={data.assets}
                />
                <PostCard
                  title="Carousel Post"
                  icon="🖼️"
                  type="CAROUSEL"
                  content={data.posts.carousel}
                  assets={data.assets}
                />
                <PostCard
                  title="Infographic Post"
                  icon="📊"
                  type="INFOGRAPHIC"
                  content={data.posts.infographic}
                  assets={data.assets}
                />
              </div>

              {/* Pipeline info footer */}
              <div className="card" style={{
                marginTop: 40, padding: 26, background: 'var(--surface-2)',
                border: '1px solid var(--line)', borderRadius: 14,
                display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{ fontSize: 24 }}>⚡</div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ color: 'var(--brand)', fontWeight: 800, fontSize: 14, marginBottom: 4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Automated Ingestion Source
                  </div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: 13.5, lineHeight: 1.5 }}>
                    Posts generated automatically at <code style={{ color: 'var(--brand)', background: 'rgba(18, 106, 90, 0.06)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>E:\daily-linkedin-posts-pipeline</code>. Managed by Windows Task Scheduler and Antigravity.
                  </div>
                </div>
                <a
                  href="https://www.linkedin.com/company/smarthire"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: 'var(--brand)', color: 'white', borderRadius: 10, padding: '11px 20px',
                    textDecoration: 'none', fontWeight: 700, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                  </svg>
                  LinkedIn Page
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  )
}

export default LinkedInPosts
