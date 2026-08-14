import React, { useState, useEffect, useRef } from 'react'
import SiteLayout from '../components/SiteLayout'

const CATEGORIES = [
  'AI Automation',
  'Software Development',
  'Mobile Apps',
  'SaaS',
  'ERP',
  'CRM',
  'Recruitment Solutions',
  'Digital Transformation'
]

const TONES = [
  'Professional',
  'Innovative',
  'Modern',
  'Helpful',
  'Trustworthy',
  'Solution Oriented'
]

const SUGGESTIONS = [
  {
    label: 'AI Automation',
    topic: 'Connecting automated webhook pipelines to eliminate Excel reports',
    category: 'AI Automation',
    tone: 'Innovative',
    goal: 'Educational'
  },
  {
    label: 'Software Decoupling',
    topic: 'Decoupling legacy systems into clean custom services',
    category: 'Software Development',
    tone: 'Professional',
    goal: 'Educational'
  },
  {
    label: 'ERP Integration',
    topic: 'Avoiding data duplication during complex B2B ERP rollouts',
    category: 'ERP',
    tone: 'Trustworthy',
    goal: 'Educational'
  },
  {
    label: 'CRM Follow-ups',
    topic: 'Setting up automated follow-ups to stop B2B leads slipping away',
    category: 'CRM',
    tone: 'Solution Oriented',
    goal: 'Educational'
  },
  {
    label: 'Mobile Portals',
    topic: 'Designing native mobile applications to boost direct brand engagement',
    category: 'Mobile Apps',
    tone: 'Modern',
    goal: 'Educational'
  },
  {
    label: 'Cloud Migration',
    topic: 'Migrating legacy on-prem databases to secure cloud-first infrastructure',
    category: 'Digital Transformation',
    tone: 'Innovative',
    goal: 'Educational'
  }
]

function BrandingCenter() {
  const [posts, setPosts] = useState([])
  const [cronLogs, setCronLogs] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [activeStep, setActiveStep] = useState(1) // 1: Inputs, 2: AI Generating, 3: Preview/Approve
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'scheduled', 'published'
  const [triggeringCron, setTriggeringCron] = useState(false)

  // Form Inputs
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('AI Automation')
  const [tone, setTone] = useState('Professional')
  const [length, setLength] = useState('Medium')
  const [goal, setGoal] = useState('Company Branding')
  const [scheduleTime, setScheduleTime] = useState('')

  // AI Engine Settings State
  const [aiProvider, setAiProvider] = useState(() => {
    return localStorage.getItem('verifyhire_ai_provider') || 'groq'
  })
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('verifyhire_api_key') || ''
  })
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    localStorage.setItem('verifyhire_ai_provider', aiProvider)
  }, [aiProvider])

  useEffect(() => {
    localStorage.setItem('verifyhire_api_key', apiKey)
  }, [apiKey])

  // Draft Post State
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftHashtags, setDraftHashtags] = useState([])

  // Visual Asset Banner Generator State
  const [generatedBannerUrl, setGeneratedBannerUrl] = useState('')
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false)
  const [bannerTheme, setBannerTheme] = useState('neon')

  // Comments Auto-Responder State
  const [comments, setComments] = useState([])
  const [replyingCommentId, setReplyingCommentId] = useState(null)

  // Modal / Editing Queue State
  const [editingPost, setEditingPost] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Copy to Clipboard state
  const [copied, setCopied] = useState(false)
  const handleCopyToClipboard = () => {
    const text = `${draftTitle}\n\n${draftContent}\n\n${draftHashtags.join(' ')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // LinkedIn Authorization State
  const [linkedinStatus, setLinkedinStatus] = useState({
    personal: { connected: false, name: '' },
    company: { connected: false, name: '', organization_id: '' }
  })
  const [postTarget, setPostTarget] = useState('personal')
  const [organizationId, setOrganizationId] = useState('')
  const [savingOrgId, setSavingOrgId] = useState(false)

  const fetchLinkedinStatus = async () => {
    try {
      const res = await fetch('/api/auth/linkedin/status')
      const data = await res.json()
      if (data.success) {
        setLinkedinStatus({
          personal: data.personal || { connected: false },
          company: data.company || { connected: false }
        })
        if (data.company && data.company.organization_id) {
          setOrganizationId(data.company.organization_id)
        }
      }
    } catch (err) {
      console.error('Error fetching LinkedIn status:', err)
    }
  }

  const handleLinkedinDisconnect = async (type = 'personal') => {
    if (!window.confirm(`Are you sure you want to disconnect your LinkedIn ${type === 'company' ? 'Company Page' : 'Personal Profile'}? Scheduled posts targeting this feed will fail to publish if disconnected.`)) {
      return
    }
    try {
      const res = await fetch('/api/auth/linkedin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Disconnected from LinkedIn (${type === 'company' ? 'Company Page' : 'Personal Profile'}) successfully.`)
        await fetchLinkedinStatus()
      } else {
        alert(data.message || 'Failed to disconnect.')
      }
    } catch (err) {
      console.error(err)
      alert('Error disconnecting from LinkedIn.')
    }
  }

  const handleSaveCompanySettings = async (e) => {
    e.preventDefault()
    if (!organizationId.trim()) {
      alert('Please enter a valid Company Page ID.')
      return
    }
    setSavingOrgId(true)
    try {
      const res = await fetch('/api/auth/linkedin/company-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })
      const data = await res.json()
      if (data.success) {
        alert('🎉 LinkedIn Company Page ID saved successfully!')
        await fetchLinkedinStatus()
      } else {
        alert(data.message || 'Failed to save settings.')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving company settings.')
    } finally {
      setSavingOrgId(false)
    }
  }

  // AI Generation Loading Phase Messages
  const [loadingMessage, setLoadingMessage] = useState('Consulting marketing strategist...')
  const logsConsoleRef = useRef(null)
  const codeProcessedRef = useRef(false)

  // Fetch comments list
  const fetchComments = async () => {
    try {
      const res = await fetch('/api/social-posts/comments')
      const data = await res.json()
      if (data.success) {
        setComments(data.comments)
      }
    } catch (e) {
      console.error('Failed to fetch comments:', e)
    }
  }

  // Fetch initial posts and logs
  const fetchData = async () => {
    try {
      const postsRes = await fetch('/api/social-posts')
      const postsData = await postsRes.json()
      if (postsData.success) {
        setPosts(postsData.posts)
      }

      const logsRes = await fetch('/api/social-posts/cron-logs')
      const logsData = await logsRes.json()
      if (logsData.success) {
        setCronLogs(logsData.logs)
      }

      await fetchLinkedinStatus()
      await fetchComments()
    } catch (err) {
      console.error('Failed to fetch social posts or logs:', err)
    } finally {
      setLoadingPosts(false)
    }
  }

  // AI auto-reply to LinkedIn comments
  const handleCommentReply = async (commentId) => {
    setReplyingCommentId(commentId)
    try {
      const res = await fetch('/api/social-posts/comments/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, provider: aiProvider, apiKey })
      })
      const data = await res.json()
      if (data.success) {
        setComments(prev => prev.map(c => c.id === commentId ? data.comment : c))
      } else {
        alert(data.message || 'Failed to generate reply.')
      }
    } catch (err) {
      console.error(err)
      alert('Error connecting to reply service.')
    } finally {
      setReplyingCommentId(null)
    }
  }

  useEffect(() => {
    fetchData()

    // Process LinkedIn connection redirect results (frontend-driven OAuth exchange)
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const errorDescription = params.get('error_description')
    const state = params.get('state')

    if (error || errorDescription) {
      alert(`❌ LinkedIn Connection Failed: ${errorDescription || error}`)
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (code && !codeProcessedRef.current) {
      codeProcessedRef.current = true
      const exchangeCode = async () => {
        try {
          const stateQuery = state ? `&state=${state}` : ''
          const res = await fetch(`/api/auth/linkedin/callback?code=${code}${stateQuery}`)
          const data = await res.json()
          if (data.success) {
            const friendlyType = data.type === 'company' ? 'Company Page' : 'Personal Profile'
            alert(`🎉 Successfully connected to LinkedIn (${friendlyType}) as: ${data.name || 'Member'}!`)
            fetchLinkedinStatus()
          } else {
            alert(`❌ LinkedIn Connection Failed: ${data.message || 'Unknown Error'}`)
          }
        } catch (err) {
          console.error(err)
          alert('❌ LinkedIn Connection Failed: Error communicating with server.')
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
      exchangeCode()
    }

    // Default schedule date: Tomorrow at 10:00 AM local time
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    // Convert to YYYY-MM-DDThh:mm
    const pad = (num) => String(num).padStart(2, '0')
    const localDateTime = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`
    setScheduleTime(localDateTime)

    // Set up polling for logs to see updates live
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/social-posts/cron-logs')
        const data = await res.json()
        if (data.success) {
          setCronLogs(data.logs)
        }
      } catch (e) {
        // Silent catch
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Auto Scroll the cron terminal logs to the bottom on update
  useEffect(() => {
    if (logsConsoleRef.current) {
      logsConsoleRef.current.scrollTop = logsConsoleRef.current.scrollHeight
    }
  }, [cronLogs])

  const handleSuggestionClick = (sug) => {
    setTopic(sug.topic)
    setCategory(sug.category)
    setTone(sug.tone)
    setGoal(sug.goal)
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return

    // Reset visual banner state
    setGeneratedBannerUrl('')

    // Proceed with generation. If API key is empty here, server falls back to env-configured keys.


    setActiveStep(2)
    
    // Simulate thinking process steps
    const loadingSteps = [
      'Establishing Praximind Pvt Ltd brand context...',
      'Applying B2B content strategy frameworks...',
      'Injecting tone variable constraints...',
      'Formatting bullet points and engaging hooks...',
      'Generating relevant hashtags...',
      'Wrapping outputs to JSON specifications...'
    ]

    let stepIndex = 0
    setLoadingMessage(loadingSteps[0])
    const interval = setInterval(() => {
      stepIndex++
      if (stepIndex < loadingSteps.length) {
        setLoadingMessage(loadingSteps[stepIndex])
      }
    }, 800)

    try {
      const response = await fetch('/api/social-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category, tone, length, goal, provider: aiProvider, apiKey })
      })
      const data = await response.json()
      clearInterval(interval)

      if (data.success) {
        setDraftTitle(data.title)
        setDraftContent(data.content)
        setDraftHashtags(data.hashtags)
        // Automatically trigger AI social card banner generation
        setGeneratedBannerUrl(`/api/social-posts/generate-banner?title=${encodeURIComponent(data.title)}&category=${encodeURIComponent(category)}&theme=${bannerTheme}&t=${Date.now()}`)
        setActiveStep(3)
      } else {
        alert(data.message || 'Generation failed.')
        setActiveStep(1)
      }
    } catch (err) {
      clearInterval(interval)
      console.error(err)
      alert('Network error during generation.')
      setActiveStep(1)
    }
  }

  const handleApproveAndSave = async (publishImmediately = false) => {
    if (publishImmediately && !linkedinStatus[postTarget].connected) {
      const friendlyName = postTarget === 'company' ? 'Company Page' : 'Personal Profile'
      alert(`❌ LinkedIn ${friendlyName} not connected! Please connect it first in the "LinkedIn Integration Console" before publishing instantly.`)
      return
    }
    if (publishImmediately && postTarget === 'company' && !organizationId) {
      alert('❌ LinkedIn Company Page ID is not configured. Please enter and save your Company Page ID in settings.')
      return
    }
    try {
      const scheduledIso = new Date(scheduleTime).toISOString()
      const payload = {
        topic,
        category,
        tone,
        length,
        goal,
        title: draftTitle,
        content: draftContent,
        hashtags: draftHashtags,
        status: publishImmediately ? 'published' : 'scheduled',
        scheduled_at: scheduledIso,
        target: postTarget
      }

      const res = await fetch('/api/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        fetchData()
        setActiveStep(1)
        // Reset topic
        setTopic('')
        alert(publishImmediately ? 'Post published instantly!' : 'Post scheduled successfully!')
      } else {
        alert(data.message || 'Failed to save post.')
      }
    } catch (e) {
      console.error(e)
      alert('Error saving post.')
    }
  }

  const handlePublishNow = async (postId) => {
    const post = posts.find(p => p.id === postId)
    const target = (post && post.target) || 'personal'
    const friendlyName = target === 'company' ? 'Company Page' : 'Personal Profile'
    if (!linkedinStatus[target].connected) {
      alert(`❌ LinkedIn ${friendlyName} is not connected! Please connect it first in the "LinkedIn Integration Console" before publishing.`)
      return
    }
    if (target === 'company' && !organizationId) {
      alert('❌ LinkedIn Company Page ID is not configured. Please enter and save your Company Page ID in settings.')
      return
    }
    try {
      const res = await fetch(`/api/social-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', published_at: new Date().toISOString() })
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
        alert('Post published immediately!')
      } else {
        alert(data.message || 'Failed to publish post.')
      }
    } catch (err) {
      console.error(err)
      alert('Error publishing post.')
    }
  }

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const res = await fetch(`/api/social-posts/${postId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenEdit = (post) => {
    setEditingPost(post)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/social-posts/${editingPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingPost.title,
          content: editingPost.content,
          scheduled_at: new Date(editingPost.scheduled_at).toISOString(),
          status: editingPost.status,
          target: editingPost.target || 'personal'
        })
      })
      const data = await res.json()
      if (data.success) {
        setIsEditModalOpen(false)
        setEditingPost(null)
        fetchData()
      }
    } catch (err) {
      console.error(err)
      alert('Error updating post.')
    }
  }

  const handleTriggerCron = async () => {
    setTriggeringCron(true)
    try {
      const res = await fetch('/api/social-posts/trigger-cron', {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        setCronLogs(data.logs)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTriggeringCron(false)
    }
  }

  const filteredPosts = posts.filter((p) => {
    if (filterStatus === 'all') return true
    return p.status === filterStatus
  })

  // Calculate stats
  const totalCount = posts.length
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length
  const publishedCount = posts.filter(p => p.status === 'published').length

  const getStatusBadge = (status) => {
    if (status === 'published') return <span className="pill trusted">Published</span>
    if (status === 'failed') return <span className="pill rejected" style={{ background: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.25)' }}>Failed</span>
    return <span className="pill review">Scheduled</span>
  }

  const formatDateTime = (isoString) => {
    if (!isoString) return '-'
    try {
      return new Date(isoString).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    } catch (e) {
      return isoString
    }
  }

  return (
    <SiteLayout>
      <section className="section">
        <div className="container">
          {/* Headline & Intro */}
          <div className="section-head-branding">
            <div>
              <div className="strategist-status-badge">
                <span className="status-dot"></span>
                <span>Active Strategy: Praximind Content Strategist Engine</span>
              </div>
              <span className="eyebrow">Praximind B2B Social Console</span>
              <h1 className="page-title">AI Branding Center</h1>
              <p className="lead">
                Generate, edit, and schedule authority-building LinkedIn posts for Praximind Pvt Ltd.
                Automate B2B marketing pipelines and inspect the database publishing agent in real-time.
              </p>
            </div>
            {/* KPI Cards */}
            <div className="stats-banner">
              <div className="stat-card">
                <span className="stat-label">Total Posts</span>
                <span className="stat-val">{totalCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Scheduled Queue</span>
                <span className="stat-val orange">{scheduledCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Published Posts</span>
                <span className="stat-val teal">{publishedCount}</span>
              </div>
            </div>
          </div>

          <div className="main-grid">
            {/* Left Column: Creator and Preview */}
            <div className="left-pane">
              {/* Stepper Indicator */}
              <div className="wizard-stepper">
                <div className={`wizard-step ${activeStep >= 1 ? 'active' : ''}`}>
                  <span className="step-num">1</span>
                  <span className="step-txt">Inputs</span>
                </div>
                <div className="wizard-line" />
                <div className={`wizard-step ${activeStep >= 2 ? 'active' : ''}`}>
                  <span className="step-num">2</span>
                  <span className="step-txt">AI Generate</span>
                </div>
                <div className="wizard-line" />
                <div className={`wizard-step ${activeStep >= 3 ? 'active' : ''}`}>
                  <span className="step-num">3</span>
                  <span className="step-txt">Preview & Edit</span>
                </div>
              </div>

              {/* Step 1: Input Form */}
              {activeStep === 1 && (
                <>
                  {/* LinkedIn Account Connection Panel */}
                  <div className="card shadow-premium fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid #0077b5' }}>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '20px', color: '#0077b5' }}>🔗</span>
                      <span>LinkedIn Integration Console</span>
                    </h3>
                    <p className="section-subtitle" style={{ marginBottom: '20px' }}>
                      Connect VerifyHire's publishing agent to your LinkedIn profile and company pages to automate live postings.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                      {/* Personal Feed Column */}
                      <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                          <span>👤</span> Personal Profile Feed
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                          Publish scheduled content directly to your personal LinkedIn timeline.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            {linkedinStatus.personal?.connected ? (
                              <div>
                                <span style={{ fontSize: '10px', color: '#27ae60', fontWeight: 'bold', display: 'block' }}>● CONNECTED</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{linkedinStatus.personal.name}</span>
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: '10px', color: '#e74c3c', fontWeight: 'bold', display: 'block' }}>● DISCONNECTED</span>
                                <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>No profile linked</span>
                              </div>
                            )}
                          </div>
                          <div>
                            {linkedinStatus.personal?.connected ? (
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleLinkedinDisconnect('personal')}
                                style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#e74c3c', color: '#e74c3c', cursor: 'pointer' }}
                              >
                                Disconnect
                              </button>
                            ) : (
                              <a
                                href="/api/auth/linkedin?type=personal"
                                className="btn btn-primary"
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  textDecoration: 'none',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  background: '#0077b5',
                                  border: 'none',
                                  color: '#fff',
                                  borderRadius: '6px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                Connect
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Page Column */}
                      <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                          <span>🏢</span> Company Page Feed
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                          Publish scheduled updates to your business's LinkedIn Organization page.
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            {linkedinStatus.company?.connected ? (
                              <div>
                                <span style={{ fontSize: '10px', color: '#27ae60', fontWeight: 'bold', display: 'block' }}>● CONNECTED</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{linkedinStatus.company.name}</span>
                              </div>
                            ) : (
                              <div>
                                <span style={{ fontSize: '10px', color: '#e74c3c', fontWeight: 'bold', display: 'block' }}>● DISCONNECTED</span>
                                <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>No organization linked</span>
                              </div>
                            )}
                          </div>
                          <div>
                            {linkedinStatus.company?.connected ? (
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleLinkedinDisconnect('company')}
                                style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#e74c3c', color: '#e74c3c', cursor: 'pointer' }}
                              >
                                Disconnect
                              </button>
                            ) : (
                              <a
                                href="/api/auth/linkedin?type=company"
                                className="btn btn-primary"
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  textDecoration: 'none',
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  background: '#0077b5',
                                  border: 'none',
                                  color: '#fff',
                                  borderRadius: '6px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                Connect
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Company settings ID config */}
                        {linkedinStatus.company?.connected && (
                          <form onSubmit={handleSaveCompanySettings} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '12px' }}>
                            <label style={{ fontSize: '11px', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }}>
                              LinkedIn Company Page ID (numeric):
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 89172450"
                                value={organizationId}
                                onChange={(e) => setOrganizationId(e.target.value)}
                                style={{ flex: 1, padding: '6px 10px', fontSize: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                              />
                              <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={savingOrgId}
                                style={{ padding: '6px 12px', fontSize: '12px', background: '#27ae60', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                {savingOrgId ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Engine Settings */}
                  <div className="card shadow-premium fade-in" style={{ marginBottom: '24px' }}>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🤖</span> AI Content Engine Settings
                    </h3>
                    <p className="section-subtitle">
                      Select your preferred AI model provider and input your API key. If no key is provided, the engine will use the server's env keys before falling back to the Mock Generator.
                    </p>

                    <div className="form-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label htmlFor="aiProvider">AI Provider</label>
                        <select
                          id="aiProvider"
                          value={aiProvider}
                          onChange={(e) => setAiProvider(e.target.value)}
                        >
                          <option value="mock">Mock Generator (Local Template)</option>
                          <option value="gemini">Google Gemini (gemini-1.5-flash)</option>
                          <option value="groq">Groq (llama-3.3-70b-versatile)</option>
                          <option value="sarvam">Sarvam AI (sarvam-2b)</option>
                        </select>
                      </div>

                      {aiProvider !== 'mock' && (
                        <div className="form-group" style={{ flex: '2 1 300px', position: 'relative', marginBottom: 0 }}>
                          <label htmlFor="apiKey">
                            {aiProvider === 'gemini' && 'Gemini API Key'}
                            {aiProvider === 'groq' && 'Groq API Key'}
                            {aiProvider === 'sarvam' && 'Sarvam AI API Key'}
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              id="apiKey"
                              type={showApiKey ? "text" : "password"}
                              placeholder={`Enter your ${aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'groq' ? 'Groq' : 'Sarvam'} API key`}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              style={{ paddingRight: '45px', width: '100%' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#7f8c8d',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                padding: '0 8px'
                              }}
                            >
                              {showApiKey ? '👁️' : '👁️‍🗨️'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card shadow-premium fade-in">
                    <h3 className="section-title">Configure Social Campaign</h3>
                  <p className="section-subtitle">
                    Enter the topic and tone preferences. The model will design a LinkedIn post tailored to Praximind's services.
                  </p>

                  {/* Suggestion Chips */}
                  <div className="suggestions-box">
                    <span className="suggestions-title font-medium">Quick Ideas:</span>
                    <div className="chips-wrapper">
                      {SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="chip-btn"
                          onClick={() => handleSuggestionClick(sug)}
                        >
                          💡 {sug.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleGenerate} className="form">
                    <div className="form-group">
                      <label htmlFor="topic">Topic / Subject Matter</label>
                      <input
                        id="topic"
                        type="text"
                        placeholder="e.g. AI-driven screening filters to speed up candidate response times"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="category">Category</label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="tone">Tone</label>
                        <select
                          id="tone"
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                        >
                          {TONES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="length">Post Length</label>
                        <select
                          id="length"
                          value={length}
                          onChange={(e) => setLength(e.target.value)}
                        >
                          <option value="Short">Short (Hooks + Summary)</option>
                          <option value="Medium">Medium (Balanced details)</option>
                          <option value="Long">Long (Full B2B thought piece)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="goal">Post Goal</label>
                        <input
                          id="goal"
                          type="text"
                          placeholder="e.g. Educational, Brand Authority, Lead Generation"
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="postTarget">Publishing Target</label>
                        <select
                          id="postTarget"
                          value={postTarget}
                          onChange={(e) => setPostTarget(e.target.value)}
                        >
                          <option value="personal">👤 Personal Profile Feed</option>
                          <option value="company">🏢 Company Page Feed</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="schedule">Schedule Publish Time</label>
                        <input
                          id="schedule"
                          type="datetime-local"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary-full-width">
                      🤖 Generate LinkedIn Post Draft
                    </button>
                  </form>
                </div>
                </>
              )}

              {/* Step 2: AI Loading */}
              {activeStep === 2 && (
                <div className="card loading-card shadow-premium fade-in">
                  <div className="spinner-large" />
                  <h3>AI Content Engine Processing</h3>
                  <p className="loading-status-text">{loadingMessage}</p>
                  <p className="loading-sub">
                    Writing professional B2B content for <strong>Praximind Pvt Ltd</strong> using B2B copy frameworks.
                  </p>
                </div>
              )}

              {/* Step 3: Preview and Approve */}
              {activeStep === 3 && (
                <div className="card shadow-premium fade-in">
                  <div className="preview-header-bar">
                    <div>
                      <h3 className="section-title">LinkedIn Post Preview</h3>
                      <p className="section-subtitle" style={{ marginBottom: 0 }}>
                        Review, edit, and optimize your generated B2B draft before scheduling.
                      </p>
                    </div>
                    <div className="badge-preview-mode">B2B Sandbox</div>
                  </div>

                  <div className="inputs-edit-panel">
                    <label className="input-label-small">Title / Subject Line</label>
                    <input
                      type="text"
                      className="title-edit-input"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                    />
                  </div>

                  {/* LinkedIn Mock Feed Card */}
                  <div className="linkedin-card-container">
                    <div className="linkedin-card-header">
                      <div className="linkedin-avatar-circle">
                        <span>PM</span>
                      </div>
                      <div className="linkedin-header-meta">
                        <div className="company-name-row">
                          <span className="linkedin-company-name">Praximind Pvt Ltd</span>
                          <span className="linkedin-verified-badge" title="Verified Brand Profile">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </span>
                        </div>
                        <span className="linkedin-company-details">Information Technology Services • 1,240 followers</span>
                        <span className="linkedin-time-details">1m • Edited • 🌐</span>
                      </div>
                      
                      {/* Copy to Clipboard Trigger */}
                      <button 
                        type="button" 
                        onClick={handleCopyToClipboard} 
                        className={`copy-draft-btn ${copied ? 'copied' : ''}`}
                        title="Copy entire post to clipboard"
                      >
                        {copied ? (
                          <>
                            <span className="copy-icon">✓</span>
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <span className="copy-icon">📋</span>
                            <span>Copy Post</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Post Content Area */}
                    <div className="linkedin-card-body">
                      <textarea
                        className="linkedin-textarea"
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        rows={11}
                      />
                    </div>

                    {/* Styled Hashtags area */}
                    <div className="linkedin-card-hashtags">
                      <div className="hashtags-label">Hashtags:</div>
                      <input
                        type="text"
                        className="hashtags-edit-input"
                        placeholder="Hashtags (comma separated)"
                        value={draftHashtags.join(', ')}
                        onChange={(e) => setDraftHashtags(e.target.value.split(',').map(h => h.trim()))}
                      />
                    </div>

                    {/* High-Fidelity Engagement Row */}
                    <div className="linkedin-card-engagement">
                      <div className="engagement-icons">
                        <span className="like-icon-circle">👍</span>
                        <span className="insightful-icon-circle">💡</span>
                        <span className="celebrate-icon-circle">👏</span>
                        <span className="engagement-count">Praximind and 42 others</span>
                      </div>
                      <div className="engagement-comments">
                        <span>7 comments • 2 reposts</span>
                      </div>
                    </div>

                    {/* Mock LinkedIn Interaction Panel */}
                    <div className="linkedin-interaction-panel">
                      <div className="linkedin-interaction-item">
                        <span className="act-icon">👍</span> Like
                      </div>
                      <div className="linkedin-interaction-item">
                        <span className="act-icon">💬</span> Comment
                      </div>
                      <div className="linkedin-interaction-item">
                        <span className="act-icon">🔁</span> Repost
                      </div>
                      <div className="linkedin-interaction-item">
                        <span className="act-icon">📤</span> Send
                      </div>
                    </div>
                  </div>

                  {/* Visual Banner Card Generator */}
                  <div className="card shadow-premium" style={{ marginTop: '24px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>🎨 AI Visual Post Banner</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d' }}>Generate a branded B2B social card matching this post's topic.</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setIsGeneratingBanner(true)
                          setTimeout(() => {
                            setGeneratedBannerUrl(`/api/social-posts/generate-banner?title=${encodeURIComponent(draftTitle)}&category=${encodeURIComponent(category)}&theme=${bannerTheme}&t=${Date.now()}`)
                            setIsGeneratingBanner(false)
                          }, 800)
                        }}
                        disabled={isGeneratingBanner}
                      >
                        {isGeneratingBanner ? 'Generating...' : '🎨 Generate Social Card'}
                      </button>
                    </div>

                    {/* Customization Controls */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      marginBottom: '20px', 
                      padding: '14px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap' 
                    }}>
                      <div style={{ flex: '1', minWidth: '180px' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Theme Preset
                        </span>
                        <select 
                          value={bannerTheme} 
                          onChange={(e) => setBannerTheme(e.target.value)}
                          style={{ 
                            width: '100%', 
                            padding: '8px 12px', 
                            borderRadius: '6px', 
                            border: '1px solid #cbd5e1', 
                            backgroundColor: '#ffffff',
                            fontSize: '13px',
                            color: '#1e293b',
                            fontWeight: '500',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="neon">💎 Cyan Neon (VerifyHire)</option>
                          <option value="purple">🔮 Royal Premium (Purple)</option>
                          <option value="gold">🌟 Sunset Gold (Corporate)</option>
                          <option value="navy">🔵 Classic Navy (Enterprise)</option>
                        </select>
                      </div>
                    </div>

                    {generatedBannerUrl ? (
                      <div className="banner-preview-box" style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fcfcfc', position: 'relative' }}>
                        <img 
                          src={generatedBannerUrl} 
                          alt="AI Social Card Banner" 
                          style={{ width: '100%', height: 'auto', display: 'block' }} 
                        />
                        <div style={{ padding: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #eee' }}>
                          <a 
                            href={generatedBannerUrl} 
                            download="praximind_social_card.jpg" 
                            className="btn btn-sm btn-ghost"
                            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                            target="_blank"
                            rel="noreferrer"
                          >
                            📥 Download Image
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#95a5a6' }}>
                        Click "Generate Social Card" to design a branded image for this post.
                      </div>
                    )}
                  </div>

                  {/* Metrics & Flags */}
                  <div className="post-metadata-info">
                    <div className="meta-pill">
                      <span className="meta-label">Length:</span>
                      <span className="meta-value font-medium">{draftContent.length} chars</span>
                    </div>
                    <div className={`meta-pill ${draftHashtags.filter(Boolean).length >= 5 && draftHashtags.filter(Boolean).length <= 8 ? 'optimal' : 'warn'}`}>
                      <span className="meta-label">Hashtags:</span>
                      <span className="meta-value font-medium">
                        {draftHashtags.filter(Boolean).length} ({draftHashtags.filter(Boolean).length >= 5 && draftHashtags.filter(Boolean).length <= 8 ? 'Optimal: 5-8' : 'Warning: Keep 5-8'})
                      </span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-label">Tone:</span>
                      <span className="meta-value font-medium">{tone}</span>
                    </div>
                  </div>

                  {/* Approve/Schedule Actions */}
                  <div className="approve-action-buttons">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setActiveStep(1)}
                    >
                      ← Back to Inputs
                    </button>
                    <div className="right-approve-actions">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleApproveAndSave(true)}
                        style={{ borderStyle: 'dashed' }}
                      >
                        Publish Instantly
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleApproveAndSave(false)}
                      >
                        Approve & Schedule Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Database Scheduler & Live Cron Console */}
            <div className="right-pane">
              {/* Cron Job Console */}
              <div className="card cron-card shadow-premium">
                <div className="cron-header-row">
                  <div className="cron-title-block">
                    <span className="cron-live-indicator glow" />
                    <h3>Automated Cron Worker</h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-cron"
                    disabled={triggeringCron}
                    onClick={handleTriggerCron}
                  >
                    {triggeringCron ? 'Checking...' : 'Trigger Cron Check'}
                  </button>
                </div>

                <div className="cron-query-block">
                  <div className="query-title">CRON DATABASE QUERY (SELECT * FROM social_posts)</div>
                  <pre className="query-code">
                    <code>{`SELECT * FROM social_posts
WHERE status = 'scheduled'
  AND scheduled_at <= NOW();`}</code>
                  </pre>
                </div>

                <div className="cron-logs-container">
                  <div className="logs-header-bar">
                    <span>Terminal Stream Logs</span>
                    <span>polling every 5s</span>
                  </div>
                  <div className="logs-console" ref={logsConsoleRef}>
                    {cronLogs.map((log, idx) => (
                      <div key={idx} className="log-entry">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comments Auto-Responder Monitor */}
              <div className="card shadow-premium" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <span>💬</span> AI LinkedIn Auto-Responder
                    </h3>
                    <p className="section-subtitle" style={{ margin: 0 }}>
                      Inspect comments on published posts and auto-generate B2B replies.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-ghost"
                    onClick={fetchComments}
                    title="Refresh comments feed"
                  >
                    🔄 Refresh
                  </button>
                </div>

                <div className="comments-feed-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {comments.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#95a5a6' }}>
                      No comments found. Publish campaigns to receive user feedback.
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="linkedin-comment-item" style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #eef0f2',
                        borderRadius: '8px',
                        padding: '12px 16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="comment-avatar" style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#114b43',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}>
                              {c.avatar}
                            </div>
                            <div>
                              <div className="comment-author" style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50' }}>{c.author}</div>
                              <div className="comment-post" style={{ fontSize: '11px', color: '#7f8c8d', maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={c.postTitle}>on: {c.postTitle}</div>
                            </div>
                          </div>
                          
                          {c.status === 'pending' ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleCommentReply(c.id)}
                              disabled={replyingCommentId !== null}
                              style={{ padding: '4px 10px', fontSize: '12px', height: 'fit-content' }}
                            >
                              {replyingCommentId === c.id ? '🤖 Replying...' : '🤖 AI Reply'}
                            </button>
                          ) : (
                            <span className="pill trusted" style={{ fontSize: '11px', padding: '3px 8px' }}>✓ Replied</span>
                          )}
                        </div>

                        <div className="comment-text" style={{ fontSize: '13px', color: '#2c3e50', paddingLeft: '40px', marginBottom: c.reply ? '10px' : '0' }}>
                          "{c.text}"
                        </div>

                        {c.reply && (
                          <div className="comment-reply-box" style={{
                            backgroundColor: '#eefcf9',
                            borderLeft: '3px solid #114b43',
                            borderRadius: '4px',
                            padding: '10px 14px',
                            marginLeft: '40px',
                            fontSize: '13px',
                            color: '#114b43'
                          }}>
                            <strong>🤖 Praximind (AI):</strong> "{c.reply}"
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Posts Queue */}
          <div className="queue-section card shadow-premium">
            <div className="queue-header-row">
              <div>
                <h3 className="section-title">Social Content Queue</h3>
                <p className="section-subtitle">
                  Verify, edit, or delete scheduled campaigns. When scheduled time passes, the cron job automatically publishes them.
                </p>
              </div>
              <div className="queue-filters">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All ({totalCount})
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'scheduled' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('scheduled')}
                >
                  Scheduled ({scheduledCount})
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'published' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('published')}
                >
                  Published ({publishedCount})
                </button>
              </div>
            </div>

            {loadingPosts ? (
              <div className="skeleton-loading-queue">
                <div className="skeleton-line-small" />
                <div className="skeleton-line-small" />
                <div className="skeleton-line-small" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="empty-queue-box">
                <span className="empty-icon">📭</span>
                <h4>No posts in this queue</h4>
                <p>Use the campaign creator above to draft and schedule posts.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Topic & Content</th>
                      <th>Category</th>
                      <th>Tone</th>
                      <th>Target</th>
                      <th>Status</th>
                      <th>Schedule / Published Time</th>
                      <th style={{ textAlign: 'right', width: '230px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((post) => (
                      <tr key={post.id}>
                        <td className="post-content-cell">
                          <div className="post-q-title font-medium">{post.title}</div>
                          <div className="post-q-snippet">{post.content}</div>
                          <div className="post-q-tags">{post.hashtags?.join(' ')}</div>
                        </td>
                        <td>
                          <span className="category-badge">{post.category}</span>
                        </td>
                        <td>{post.tone}</td>
                        <td>
                          {post.target === 'company' ? (
                            <span className="category-badge" style={{ background: 'rgba(0, 119, 181, 0.2)', color: '#0077b5', border: '1px solid rgba(0, 119, 181, 0.3)' }}>🏢 Company</span>
                          ) : (
                            <span className="category-badge" style={{ background: 'rgba(235, 104, 76, 0.15)', color: '#eb684c', border: '1px solid rgba(235, 104, 76, 0.25)' }}>👤 Profile</span>
                          )}
                        </td>
                        <td>
                          {getStatusBadge(post.status)}
                          {post.status === 'failed' && post.error_message && (
                            <div style={{ fontSize: '11px', color: '#e74c3c', marginTop: '4px', maxWidth: '180px', wordBreak: 'break-word', lineHeight: '1.2' }} title={post.error_message}>
                              ⚠️ {post.error_message.length > 55 ? post.error_message.slice(0, 55) + '...' : post.error_message}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="time-display-block">
                            <span className="time-val">
                              {post.status === 'published'
                                ? formatDateTime(post.published_at)
                                : formatDateTime(post.scheduled_at)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell-group">
                            {(post.status === 'scheduled' || post.status === 'failed') && (
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => handlePublishNow(post.id)}
                              >
                                {post.status === 'failed' ? 'Retry' : 'Publish Now'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => handleOpenEdit(post)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger-icon"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Edit Post Modal Dialog */}
      {isEditModalOpen && editingPost && (
        <div className="modal-overlay">
          <div className="modal-container fade-in">
            <div className="modal-header">
              <h4 className="modal-title">Edit Social Campaign</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsEditModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Post Title</label>
                <input
                  type="text"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Post Content</label>
                <textarea
                  rows={8}
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={
                      editingPost.scheduled_at
                        ? new Date(editingPost.scheduled_at).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        scheduled_at: new Date(e.target.value).toISOString()
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Publishing Target</label>
                  <select
                    value={editingPost.target || 'personal'}
                    onChange={(e) => setEditingPost({ ...editingPost, target: e.target.value })}
                  >
                    <option value="personal">👤 Personal Profile</option>
                    <option value="company">🏢 Company Page</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Campaign Status</label>
                  <select
                    value={editingPost.status}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value })}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Premium CSS Styling Scoped for AI Branding Center */}
      <style>{`
        .container {
          width: min(1380px, 96%) !important;
          max-width: 100%;
        }
        /* Strategist Badge Status */
        .strategist-status-badge {
          background: rgba(18, 106, 90, 0.08);
          border: 1px solid rgba(18, 106, 90, 0.18);
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--brand);
          font-weight: 700;
          margin-bottom: 18px;
          box-shadow: 0 4px 12px rgba(18, 106, 90, 0.04);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #27ae60;
          display: inline-block;
          animation: statusPulse 1.8s infinite ease-in-out;
        }
        @keyframes statusPulse {
          0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.5); }
          70% { box-shadow: 0 0 0 6px rgba(39, 174, 96, 0); }
          100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
        }

        .section-head-branding {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 36px;
        }
        @media (max-width: 900px) {
          .section-head-branding {
            flex-direction: column;
          }
        }
        .stats-banner {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 14px 20px;
          display: flex;
          flex-direction: column;
          min-width: 145px;
          box-shadow: 0 4px 12px rgba(18, 39, 35, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(18, 39, 35, 0.06);
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-soft);
          font-weight: 700;
        }
        .stat-val {
          font-size: 28px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          margin-top: 4px;
        }
        .stat-val.orange {
          color: var(--brand-2);
        }
        .stat-val.teal {
          color: var(--brand);
        }
 
        .main-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 28px;
          margin-bottom: 28px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }
 
        /* Wizard Stepper Styling */
        .wizard-stepper {
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 24px;
          margin-bottom: 20px;
          gap: 12px;
          box-shadow: 0 4px 12px rgba(18, 39, 35, 0.03);
        }
        .wizard-step {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink-soft);
          opacity: 0.6;
          transition: all 0.2s ease;
        }
        .wizard-step.active {
          color: var(--brand);
          opacity: 1;
          font-weight: 700;
        }
        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--surface-2);
          display: grid;
          place-items: center;
          font-size: 12px;
          border: 1px solid var(--line);
        }
        .wizard-step.active .step-num {
          background: var(--brand);
          color: white;
          border-color: var(--brand);
          box-shadow: 0 0 8px rgba(18, 106, 90, 0.3);
        }
        .step-txt {
          font-size: 13px;
        }
        .wizard-line {
          flex-grow: 1;
          height: 1px;
          background: var(--line);
        }
 
        /* Suggestions box */
        .suggestions-box {
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 20px;
        }
        .suggestions-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-soft);
          margin-bottom: 8px;
          display: block;
        }
        .chips-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip-btn {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 12px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chip-btn:hover {
          border-color: var(--brand);
          background: rgba(18, 106, 90, 0.06);
          color: var(--brand);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(18, 106, 90, 0.06);
        }
 
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
          width: 100%;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
        }
        .form-group select, .form-group input {
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--surface);
          color: var(--ink);
          padding: 12px;
          font: inherit;
          transition: all 0.2s ease;
        }
        .form-group select:focus, .form-group input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(18, 106, 90, 0.15);
          border-color: var(--brand);
        }
        .form-group select {
          cursor: pointer;
        }
        .btn-primary-full-width {
          width: 100%;
          border: 0;
          border-radius: 12px;
          padding: 14px;
          background: linear-gradient(130deg, var(--brand), #1f8a75);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: 0 4px 14px rgba(18, 106, 90, 0.2);
          transition: all 0.2s ease;
        }
        .btn-primary-full-width:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 8px 20px rgba(18, 106, 90, 0.3);
        }
 
        /* Loading Card */
        .loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
        }
        .spinner-large {
          width: 48px;
          height: 48px;
          border: 4px solid var(--surface-2);
          border-top: 4px solid var(--brand);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 24px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-status-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--brand);
          margin: 8px 0;
        }
        .loading-sub {
          font-size: 13px;
          color: var(--ink-soft);
          max-width: 380px;
        }
 
        /* LinkedIn Card Mockup */
        .preview-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 14px;
        }
        .badge-preview-mode {
          background: rgba(18, 106, 90, 0.1);
          color: var(--brand);
          border: 1px solid rgba(18, 106, 90, 0.2);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .inputs-edit-panel {
          margin-bottom: 20px;
        }
        .input-label-small {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink-soft);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
          letter-spacing: 0.03em;
        }
        .title-edit-input {
          width: 100%;
          font-size: 15px;
          font-weight: 600;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--surface-2);
          transition: all 0.2s ease;
        }
        .title-edit-input:focus {
          background: var(--surface);
          border-color: var(--brand);
          outline: none;
          box-shadow: 0 0 0 3px rgba(18, 106, 90, 0.12);
        }
        .linkedin-card-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 18px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
          margin-bottom: 20px;
          font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          position: relative;
        }
        .linkedin-card-header {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
          position: relative;
          align-items: center;
        }
        .linkedin-avatar-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand), #1b5347);
          color: #ffffff;
          font-weight: 800;
          font-size: 15px;
          display: grid;
          place-items: center;
          box-shadow: 0 4px 10px rgba(18, 106, 90, 0.15);
        }
        .linkedin-header-meta {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .company-name-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .linkedin-company-name {
          font-weight: 700;
          font-size: 14px;
          color: #1a1a1a;
        }
        .linkedin-verified-badge {
          color: #0a66c2;
          display: flex;
          align-items: center;
        }
        .linkedin-company-details {
          font-size: 12px;
          color: #5c6f84;
        }
        .linkedin-time-details {
          font-size: 11px;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 1px;
        }
        
        /* Copy Post Draft Button */
        .copy-draft-btn {
          position: absolute;
          right: 0;
          top: 0;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .copy-draft-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .copy-draft-btn.copied {
          background: #dcfce7;
          border-color: #bbf7d0;
          color: #15803d;
          box-shadow: 0 0 10px rgba(21, 128, 61, 0.12);
        }
        .copy-icon {
          font-size: 13px;
        }

        .linkedin-card-body {
          margin-bottom: 14px;
        }
        .linkedin-textarea {
          width: 100%;
          border: none;
          background: transparent;
          color: #1f2937;
          font-size: 14.5px;
          line-height: 1.5;
          resize: vertical;
          padding: 4px 0;
          outline: none;
          font-family: inherit;
        }
        .linkedin-textarea:focus {
          outline: none;
        }
        .linkedin-card-hashtags {
          border-top: 1px solid #f3f4f6;
          padding-top: 12px;
          margin-bottom: 14px;
        }
        .hashtags-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .hashtags-edit-input {
          width: 100%;
          border: none;
          background: transparent;
          color: #0a66c2;
          font-size: 14px;
          font-weight: 600;
          padding: 0;
          outline: none;
        }

        /* Engagement Stats */
        .linkedin-card-engagement {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f3f4f6;
          padding-top: 8px;
          padding-bottom: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .engagement-icons {
          display: flex;
          align-items: center;
        }
        .like-icon-circle, .insightful-icon-circle, .celebrate-icon-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0a66c2;
          color: white;
          font-size: 9px;
          margin-right: -4px;
          border: 1.5px solid white;
        }
        .insightful-icon-circle {
          background: #0077b5;
        }
        .celebrate-icon-circle {
          background: #78b843;
        }
        .engagement-count {
          margin-left: 8px;
          font-weight: 500;
        }

        .linkedin-interaction-panel {
          display: flex;
          border-top: 1px solid #f3f4f6;
          padding-top: 6px;
          justify-content: space-around;
        }
        .linkedin-interaction-item {
          color: #5e5e5e;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 6px;
          transition: background-color 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .linkedin-interaction-item:hover {
          background-color: #f3f4f6;
          color: #1d1d1d;
        }
        .act-icon {
          font-size: 15px;
        }
 
        .post-metadata-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 20px;
          background: var(--surface-2);
          padding: 10px 14px;
          border-radius: 8px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .meta-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid var(--line);
        }
        .meta-pill.optimal {
          background: #eafaf1;
          color: #27ae60;
          border-color: #d4f5e2;
        }
        .meta-pill.warn {
          background: #fdf5e6;
          color: #d35400;
          border-color: #faebd7;
        }
        .meta-label {
          color: var(--ink-soft);
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .meta-value {
          font-size: 12px;
        }

        .approve-action-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .right-approve-actions {
          display: flex;
          gap: 12px;
        }
 
        /* Cron Console Styling */
        .cron-card {
          background: #0d0f12;
          border: 1px solid #1e293b;
          color: #94a3b8;
          padding: 20px;
          border-radius: var(--radius);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
        .cron-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 12px;
        }
        .cron-title-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cron-title-block h3 {
          margin: 0;
          color: #f8fafc;
          font-size: 15px;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
        }
        .cron-live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }
        .cron-live-indicator.glow {
          box-shadow: 0 0 10px #10b981;
          animation: pulseGlow 2s infinite ease-in-out;
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .btn-cron {
          background: #1e293b;
          color: #f1f5f9;
          border: 1px solid #334155;
          transition: all 0.15s ease;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
          padding: 6px 12px;
        }
        .btn-cron:hover {
          background: #334155;
          color: #f8fafc;
        }
        .cron-query-block {
          margin-bottom: 16px;
        }
        .query-title {
          font-size: 9px;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 6px;
          letter-spacing: 0.07em;
        }
        .query-code {
          margin: 0;
          background: #020617;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #1e293b;
          font-family: 'Courier New', Courier, monospace;
          color: #fda4af;
          font-size: 11.5px;
          overflow-x: auto;
        }
        .cron-logs-container {
          display: flex;
          flex-direction: column;
          border: 1px solid #1e293b;
          border-radius: 8px;
          background: #020617;
        }
        .logs-header-bar {
          background: #0f172a;
          padding: 8px 12px;
          font-size: 10px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #1e293b;
          font-family: monospace;
        }
        .logs-console {
          height: 200px;
          overflow-y: auto;
          padding: 12px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          color: #38bdf8;
          display: flex;
          flex-direction: column;
          gap: 6px;
          scroll-behavior: smooth;
        }
        .log-entry {
          word-break: break-all;
          white-space: pre-wrap;
          line-height: 1.4;
        }
 
        /* Campaign Queue Section */
        .queue-section {
          margin-top: 24px;
        }
        .queue-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .queue-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        .queue-filters {
          display: flex;
          gap: 6px;
          background: var(--surface-2);
          padding: 4px;
          border-radius: 8px;
        }
        .filter-btn {
          border: none;
          background: transparent;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink-soft);
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .filter-btn.active {
          background: var(--surface);
          color: var(--brand);
          box-shadow: 0 2px 6px rgba(18, 39, 35, 0.05);
        }
 
        .post-content-cell {
          max-width: 400px;
        }
        .post-q-title {
          font-size: 14px;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .post-q-snippet {
          font-size: 12px;
          color: var(--ink-soft);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .post-q-tags {
          font-size: 11px;
          color: var(--brand);
          font-weight: 600;
        }
        .category-badge {
          background: var(--surface-2);
          border: 1px solid var(--line);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--ink);
        }
        .time-display-block {
          font-size: 12px;
          color: var(--ink);
        }
        .actions-cell-group {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
          flex-wrap: nowrap;
        }
        .actions-cell-group button {
          white-space: nowrap;
          flex-shrink: 0;
        }
        .btn-danger-icon {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--danger);
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.15s ease;
        }
        .btn-danger-icon:hover {
          background: rgba(181, 71, 79, 0.08);
          border-color: var(--danger);
        }
 
        /* Empty Queue Box */
        .empty-queue-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 48px;
          gap: 10px;
          border: 1px dashed var(--line);
          border-radius: 12px;
          margin: 12px 0;
        }
        .empty-queue-box .empty-icon {
          font-size: 32px;
        }
        .empty-queue-box h4 {
          margin: 0;
          font-size: 16px;
        }
        .empty-queue-box p {
          font-size: 13px;
          color: var(--ink-soft);
          margin: 0;
        }
 
        .skeleton-loading-queue {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .skeleton-line-small {
          height: 18px;
          width: 100%;
          background: var(--surface-2);
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
 
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(29, 43, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .modal-container {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          max-width: 650px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(18, 39, 35, 0.2);
          display: flex;
          flex-direction: column;
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-title {
          font-family: 'Sora', sans-serif;
          margin: 0;
          font-size: 18px;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--ink-soft);
        }
        .modal-close:hover {
          color: var(--danger);
        }
        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
 
        /* Utility classes */
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .font-medium {
          font-weight: 700;
        }
        .shadow-premium {
          box-shadow: 0 12px 30px rgba(18, 39, 35, 0.05);
        }
        .section-title {
          margin-top: 0;
          margin-bottom: 4px;
          font-family: 'Sora', sans-serif;
          font-size: 18px;
        }
        .section-subtitle {
          color: var(--ink-soft);
          font-size: 13px;
          margin-top: 0;
          margin-bottom: 20px;
          line-height: 1.4;
        }
      `}</style>
    </SiteLayout>
  )
}

export default BrandingCenter
