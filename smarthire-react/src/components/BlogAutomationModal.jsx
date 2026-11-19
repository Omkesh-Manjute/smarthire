import React, { useState, useEffect } from 'react'

export default function BlogAutomationModal({ isOpen, onClose }) {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [category, setCategory] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [genStep, setGenStep] = useState('')
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/blogs')
      const data = await res.json()
      if (data && Array.isArray(data.blogs)) {
        setBlogs(data.blogs)
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      fetchBlogs()
      setSuccessMsg(null)
      setErrorMsg(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleGenerate = async () => {
    setGenerating(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    setGenStep('Selecting high-demand trending topic...')

    try {
      const timer1 = setTimeout(() => setGenStep('Writing 1,500+ word deep SEO article with Groq 120B...'), 2000)
      const timer2 = setTimeout(() => setGenStep('Generating 1200x630 AI hero banner image...'), 7000)
      const timer3 = setTimeout(() => setGenStep('Publishing to SmartHire and updating sitemap.xml...'), 14000)

      const res = await fetch('/api/blogs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category || undefined, customTopic: customTopic.trim() || undefined })
      })

      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)

      const data = await res.json()
      if (data.success && data.blog) {
        setSuccessMsg(data.blog)
        setCustomTopic('')
        fetchBlogs()
      } else {
        setErrorMsg(data.error || 'Failed to generate blog')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Request failed')
    } finally {
      setGenerating(false)
      setGenStep('')
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchBlogs()
      }
    } catch (_) {}
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '100%',
        maxWidth: 820,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
              Daily AI Blog Automation & Publishing
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
              Automated trending IT hiring, visa, and AI topic generator with custom 1200x630 hero image
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: '#64748B',
              lineHeight: 1,
              padding: '4px 8px'
            }}
          >
            &times;
          </button>
        </div>

        {/* Body Container */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Status Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Daily Cron Scheduler</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#15803D', marginTop: 2 }}>Active (Every 24 Hours)</div>
            </div>
            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>AI Content Engine</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2563EB', marginTop: 2 }}>Groq 120B (Score 95+)</div>
            </div>
            <div style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF', padding: '12px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B21A8', textTransform: 'uppercase' }}>Dynamic Posts Live</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#7E22CE', marginTop: 2 }}>{blogs.length} Published</div>
            </div>
          </div>

          {/* Generator Controls */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: 18,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', marginBottom: 12 }}>
              Generate & Publish Post Now
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Category Pillar
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B'
                  }}
                >
                  <option value="">Auto-Cycle All Pillars (Recommended)</option>
                  <option value="AI & Emerging Tech">AI & Emerging Tech</option>
                  <option value="Company & Enterprise Staffing">Company & Enterprise Staffing</option>
                  <option value="Visas & Compliance">Visas & Immigration</option>
                  <option value="Contracting & Rates">Contracting, Rates & Taxes</option>
                  <option value="Cloud & Data Infrastructure">Cloud & Data Infrastructure</option>
                  <option value="ATS & Technical Interviewing">ATS & Technical Interviewing</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Custom Topic (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Snowflake vs Databricks in 2026..."
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B'
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: generating ? '#94A3B8' : '#0D6B5F',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 13.5,
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                cursor: generating ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              {generating ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                  <span>{genStep || 'Generating...'}</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  <span>Generate & Publish Today's Post</span>
                </>
              )}
            </button>

            {successMsg && (
              <div style={{ marginTop: 14, padding: 12, backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                  Successfully Published Article!
                </div>
                <div style={{ fontSize: 13, color: '#15803D', marginTop: 2 }}>
                  "{successMsg.title}"
                </div>
                <a
                  href={`/blog/${successMsg.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 700, color: '#0D6B5F', textDecoration: 'underline', marginTop: 6 }}
                >
                  View Live Article on Website &rarr;
                </a>
              </div>
            )}

            {errorMsg && (
              <div style={{ marginTop: 14, padding: 12, backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 13, color: '#991B1B' }}>
                {errorMsg}
              </div>
            )}
          </div>

          {/* Published Articles List */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', marginBottom: 12 }}>
              Published Dynamic Articles ({blogs.length})
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#64748B', fontSize: 13 }}>Loading articles...</div>
            ) : blogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#64748B', fontSize: 13, backgroundColor: '#F8FAFC', borderRadius: 6 }}>
                No dynamic articles published yet. Click "Generate & Publish" above to create today's first post.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blogs.map(b => (
                  <div
                    key={b.id || b.slug}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      gap: 16
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {b.image && (
                        <img
                          src={b.image}
                          alt={b.title}
                          style={{ width: 64, height: 42, objectFit: 'cover', borderRadius: 4, border: '1px solid #E2E8F0', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', display: 'flex', gap: 8, marginTop: 2 }}>
                          <span style={{ fontWeight: 600, color: '#0D6B5F' }}>{b.category}</span>
                          <span>·</span>
                          <span>{b.date}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <a
                        href={`/blog/${b.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#0D6B5F',
                          padding: '5px 10px',
                          backgroundColor: '#E6F4F1',
                          borderRadius: 4,
                          textDecoration: 'none'
                        }}
                      >
                        View &rarr;
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id || b.slug, b.title)}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#DC2626',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 8px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#F8FAFC'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            Close
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
