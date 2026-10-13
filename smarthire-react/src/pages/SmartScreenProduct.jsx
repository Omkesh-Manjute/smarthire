import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteLayout from '../components/SiteLayout'
import PricingSection from '../components/PricingSection'

export default function SmartScreenProduct() {
  const navigate = useNavigate()

  // Video playback state
  const demoVideoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Interactive Question Bank selector
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0)

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  // Studio Simulation Question state
  const studioSampleQuestions = [
    {
      num: 1,
      q: 'Give a 60–90 second overview of your technical background, core language strengths, and recent production projects.',
      sub: 'Focus on backend microservice architectures, API throughput, and distributed databases you managed directly.',
      transcript: 'Over the past four years, I led the core platform team handling over 250,000 concurrent API transactions using Node.js and distributed PostgreSQL...'
    },
    {
      num: 2,
      q: 'Describe an unexpected outage or severe latency spike you diagnosed in production. What was your root-cause methodology?',
      sub: 'Detail telemetry metrics, distributed tracing steps, rollback decisions, and automated prevention guards.',
      transcript: 'We experienced an incident where connection pooling saturated during a peak flash campaign. I isolated the un-indexed query via Datadog, executed a query kill, and rolled out a hotfix in 14 minutes...'
    },
    {
      num: 3,
      q: 'What is your current work authorization status, earliest start availability, and compensation target range?',
      sub: 'Please confirm remote readiness, travel flexibility, and notice period requirements.',
      transcript: 'I am immediately available to start on 2 weeks notice, holding full work authorization, and open to hybrid or remote arrangements...'
    }
  ]
  const [activeStudioQ, setActiveStudioQ] = useState(0)

  // Live 1-on-1 Demo Modal state
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoName, setDemoName] = useState('')
  const [demoEmail, setDemoEmail] = useState('')
  const [demoPhone, setDemoPhone] = useState('')
  const [demoCompany, setDemoCompany] = useState('')
  const [demoRole, setDemoRole] = useState('Senior Full Stack Engineer')
  const [demoSent, setDemoSent] = useState(false)
  const [demoSubmitting, setDemoSubmitting] = useState(false)

  const toggleVideoPlayback = () => {
    const v = demoVideoRef.current
    if (!v) return
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    document.title = 'SmartScreen AI — Asynchronous Video & Voice Candidate Screening | SmartHire'
    const video = demoVideoRef.current

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    let videoObserver = null
    if (video) {
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)

      videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              video.play().catch(() => {})
            } else {
              video.pause()
            }
          })
        },
        { threshold: 0.3 }
      )
      videoObserver.observe(video)
    }

    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    const revealElements = document.querySelectorAll('.reveal-on-scroll')
    revealElements.forEach((el) => scrollObserver.observe(el))

    return () => {
      if (videoObserver) videoObserver.disconnect()
      scrollObserver.disconnect()
      if (video) {
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
      }
    }
  }, [])

  const roleQuestionBanks = [
    {
      title: 'Full Stack & Cloud Engineer',
      tag: 'Software Engineering',
      questions: [
        {
          num: 1,
          text: 'Walk us through your core technology stack and the most complex microservice architecture you designed or scaled in production.',
          hint: 'Highlight concurrency, latency bottlenecks, and database scaling.'
        },
        {
          num: 2,
          text: 'Describe an unexpected outage or severe latency spike you diagnosed. What was your root-cause analysis methodology?',
          hint: 'Discuss metrics, distributed tracing, and remediation steps.'
        },
        {
          num: 3,
          text: 'What are your current visa authorization status, earliest availability, and compensation expectations?',
          hint: 'Confirm work location, remote vs on-site preference, and notice period.'
        }
      ]
    },
    {
      title: 'Enterprise Account Executive',
      tag: 'Sales & Revenue',
      questions: [
        {
          num: 1,
          text: 'Give a 90-second overview of your career quota attainment over the last three fiscal years and your average deal size.',
          hint: 'Include ARR/ACV figures, enterprise buyer personas, and sales cycle length.'
        },
        {
          num: 2,
          text: 'Walk through a complex deal where the prospect was stalled at legal or procurement. How did you navigate executive stakeholders to close?',
          hint: 'Focus on champion building, multi-threading, and ROI validation.'
        },
        {
          num: 3,
          text: 'What is your outbound pipeline generation strategy when entering a greenfield territory without inbound SDR support?',
          hint: 'Discuss account research, executive messaging, and conversion metrics.'
        }
      ]
    },
    {
      title: 'Healthcare Registered Nurse (RN)',
      tag: 'Clinical & Healthcare',
      questions: [
        {
          num: 1,
          text: 'Summarize your clinical background, specialized hospital certifications, and experience across acute or ICU units.',
          hint: 'State active compact licenses, BLS/ACLS credentials, and patient ratios.'
        },
        {
          num: 2,
          text: 'Describe a situation where a patient exhibited rapid clinical deterioration during your shift. How did you respond?',
          hint: 'Explain diagnostic triage, physician escalation, and family communication.'
        },
        {
          num: 3,
          text: 'Confirm your current state license verification, availability for rotating weekend shifts, and preferred facility setting.',
          hint: 'State immediate availability, travel readiness, and shift preferences.'
        }
      ]
    },
    {
      title: 'Customer Support Lead',
      tag: 'Client Operations',
      questions: [
        {
          num: 1,
          text: 'How do you prioritize high-volume escalations when multiple SLA breaches are impending across tier-1 channels?',
          hint: 'Discuss ticketing systems, triage criteria, and team delegation.'
        },
        {
          num: 2,
          text: 'Share an example of a dissatisfied enterprise client on the verge of churn. How did you de-escalate the relationship?',
          hint: 'Focus on empathy, rapid remediation, and post-incident reviews.'
        },
        {
          num: 3,
          text: 'Confirm your shift flexibility across weekends or international time zones, and target compensation.',
          hint: 'State remote home-office readiness and earliest start date.'
        }
      ]
    }
  ]

  const handleRequestLiveDemo = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!demoName.trim() || !demoEmail.trim()) {
      alert('Please enter your name and corporate email address.')
      return
    }
    setDemoSubmitting(true)
    const inqId = `INQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
    const payload = {
      id: inqId,
      name: demoName.trim(),
      email: demoEmail.trim(),
      phone: demoPhone.trim() || '—',
      company: demoCompany.trim() || 'Direct Client / Staffing Agency',
      category: 'SmartScreen Live Demo Request',
      subject: `Live 1-on-1 Demo Request from ${demoName.trim()} (${demoCompany.trim() || 'Staffing Firm'})`,
      message: `Prospective client requested a live 1-on-1 demonstration of SmartScreen AI.\n\nProspect: ${demoName.trim()}\nCorporate Email: ${demoEmail.trim()}\nPhone / WhatsApp: ${demoPhone.trim() || 'N/A'}\nCompany: ${demoCompany.trim() || 'N/A'}\nPrimary Roles to Screen: ${demoRole.trim()}\nRequested At: ${new Date().toLocaleString()}`,
      priority: 'Urgent',
      status: 'New',
      createdAt: new Date().toISOString()
    }

    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Inquiry endpoint warning:', err))

      try {
        const raw = localStorage.getItem('smarthire_inquiries')
        const existing = raw ? JSON.parse(raw) : []
        const merged = [payload, ...existing.filter(i => i.id !== payload.id)]
        localStorage.setItem('smarthire_inquiries', JSON.stringify(merged))
        window.dispatchEvent(new CustomEvent('smarthire_inquiry_added', { detail: payload }))
      } catch (err) {}

      setDemoSent(true)
    } catch (err) {
      console.error('Demo request error:', err)
      setDemoSent(true)
    } finally {
      setDemoSubmitting(false)
    }
  }

  return (
    <SiteLayout>
      <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
        <style>{`
          .reveal-on-scroll {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
            will-change: opacity, transform;
          }
          .reveal-on-scroll.is-visible {
            opacity: 1;
            transform: translateY(0);
          }
          .reveal-delay-1 { transition-delay: 100ms; }
          .reveal-delay-2 { transition-delay: 200ms; }
          .reveal-delay-3 { transition-delay: 300ms; }
          .smartscreen-card-hover {
            transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          }
          .smartscreen-card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 14px 30px -10px rgba(15, 23, 42, 0.12);
            border-color: #93c5fd !important;
          }
          .faq-card-interactive {
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .faq-card-interactive:hover {
            border-color: #93c5fd !important;
            background: #fafcff !important;
          }
        `}</style>

        {/* ── 1. HERO SECTION ── */}
        <section style={{
          position: 'relative',
          padding: '80px 20px 60px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderBottom: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '20px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
              Standalone Asynchronous Video & Voice Screening
            </div>

            <h1 style={{
              fontSize: '44px',
              fontWeight: '900',
              letterSpacing: '-0.03em',
              lineHeight: '1.18',
              color: '#0f172a',
              margin: '0 auto 20px',
              maxWidth: '860px'
            }}>
              Screen 10x More Candidates in 1/3rd the Time with Pre-Interview Video
            </h1>

            <p style={{
              fontSize: '17px',
              lineHeight: '1.6',
              color: '#475569',
              maxWidth: '720px',
              margin: '0 auto 32px'
            }}>
              Eliminate phone tag and scheduling bottlenecks. Send one zero-login shareable link — candidates record their answers with proctored webcam video, voice, or written synthesis. Get automatic transcripts, anti-cheat audit trails, and instant scoring in seconds.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { setDemoSent(false); setShowDemoModal(true); }}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Schedule Live 1-on-1 Demo</span>
                <span>➔</span>
              </button>

              <a
                href="#pricing"
                style={{
                  background: '#ffffff',
                  color: '#1e293b',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '700',
                  border: '1.5px solid #cbd5e1',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                View Screening Plans ($99+)
              </a>
            </div>

            {/* Micro Trust Points */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              marginTop: '36px',
              fontSize: '12.5px',
              color: '#64748b',
              fontWeight: '600'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Zero Candidate Login Required
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Single Continuous Take Anti-Cheat
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Custom Expiration Dates (3d/7d/14d)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Integrates with Any ATS (Webhooks + API)
              </span>
            </div>
          </div>
        </section>

        {/* ── 2. INTERACTIVE VIDEO STAGE & STUDIO PREVIEW ── */}
        <section style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Studio Demonstration
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', margin: '8px 0' }}>
              Built for Candidate Comfort & Enterprise Security
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
              Experience the candidate recording interface. Generous 430px vertical camera view, side-by-side questions, and real-time speech transcription.
            </p>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden'
          }}>
            {/* Top Bar of Studio Mockup */}
            <div style={{
              background: '#0f172a',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isPlaying ? '#ef4444' : '#64748b',
                  boxShadow: isPlaying ? '0 0 10px #ef4444' : 'none'
                }} />
                <span style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.02em' }}>
                  {isPlaying ? 'LIVE STREAM ACTIVE • 01:14' : 'STUDIO READY • CLICK PLAY'}
                </span>
                <span style={{ color: '#475569' }}>|</span>
                <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                  Lead Software Engineer Screening
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  Anti-Cheat Proctored
                </span>
                <button
                  type="button"
                  onClick={toggleVideoPlayback}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {isPlaying ? 'Pause Demo' : 'Play Demo'}
                </button>
              </div>
            </div>

            {/* Split Two-Column Stage */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '0' }}>
              {/* Left Column: Video Feed */}
              <div style={{ position: 'relative', background: '#020617', minHeight: '430px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={demoVideoRef}
                  src="/interview-demo-video.mp4"
                  muted
                  loop
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '440px',
                    objectFit: 'cover'
                  }}
                  onClick={toggleVideoPlayback}
                />

                <div style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: '#f8fafc',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap'
                }}>
                  Head & shoulders naturally framed (430px vertical height)
                </div>
              </div>

              {/* Right Column: Question & Controls */}
              <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#2563eb',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: '#eff6ff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe'
                      }}>
                        Question {studioSampleQuestions[activeStudioQ].num} of 3
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                        (Studio Simulation)
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>
                      Max ~120s proctored
                    </span>
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px', lineHeight: '1.38', minHeight: '50px' }}>
                    {studioSampleQuestions[activeStudioQ].q}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: '0 0 18px', minHeight: '38px' }}>
                    {studioSampleQuestions[activeStudioQ].sub}
                  </p>

                  <div style={{
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Live Candidate Speech Capture Transcript:
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', fontStyle: 'italic', lineHeight: '1.5' }}>
                      "{isPlaying ? studioSampleQuestions[activeStudioQ].transcript : 'Video is paused. Click Play on the preview to simulate live candidate speech capture...'}"
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveStudioQ((prev) => (prev + 1) % studioSampleQuestions.length)}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>Preview Next Question ({((activeStudioQ + 1) % 3) + 1}/3)</span>
                    <span>➔</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDemoSent(false); setShowDemoModal(true); }}
                    style={{
                      width: '100%',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                    }}
                  >
                    Schedule Live 1-on-1 Walkthrough with Our Team ➔
                  </button>

                  <div style={{ fontSize: '11.5px', color: '#64748b', textAlign: 'center' }}>
                    Single continuous take · prevents cheating & browser tab switching
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Impact Metrics */}
          <div className="reveal-on-scroll" style={{
            background: '#0f172a',
            borderRadius: '16px',
            padding: '36px 28px',
            color: '#ffffff',
            marginTop: '36px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '28px',
            textAlign: 'center',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.2)'
          }}>
            <div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#38bdf8', letterSpacing: '-0.03em' }}>84%</div>
              <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>Screening Hours Saved / Recruiter</div>
            </div>
            <div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#34d399', letterSpacing: '-0.03em' }}>4.2x</div>
              <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>Faster Candidate Shortlist-to-Offer</div>
            </div>
            <div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#f59e0b', letterSpacing: '-0.03em' }}>0 Apps</div>
              <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>Zero Candidate Downloads or Logins</div>
            </div>
            <div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#a78bfa', letterSpacing: '-0.03em' }}>99.8%</div>
              <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>Anti-Cheat Proctoring Integrity</div>
            </div>
          </div>
        </section>

        {/* ── 3. 3-STEP RECRUITER WORKFLOW ── */}
        <section style={{ padding: '60px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Simple 3-Step Flow
              </span>
              <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', margin: '8px 0' }}>
                How SmartScreen AI Works for Your Team
              </h2>
              <p style={{ fontSize: '15px', color: '#64748b' }}>
                From vacancy creation to client submission in under 15 minutes.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Step 1 */}
              <div className="reveal-on-scroll smartscreen-card-hover reveal-delay-1" style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                position: 'relative'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: '800',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  1
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  Pick or Generate Questions
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Select from proven question banks for over 40 job roles or click <strong>Generate with AI</strong> to tailor questions to your specific job description in seconds.
                </p>
              </div>

              {/* Step 2 */}
              <div className="reveal-on-scroll smartscreen-card-hover reveal-delay-2" style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                position: 'relative'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: '800',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  2
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  Set Expiry & Send Link
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Choose link validity (3 Days, 7 Days, or Custom Date). Paste into LinkedIn InMail, WhatsApp, or Bullhorn. Candidates click and complete on phone or desktop with zero app downloads.
                </p>
              </div>

              {/* Step 3 */}
              <div className="reveal-on-scroll smartscreen-card-hover reveal-delay-3" style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                position: 'relative'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontWeight: '800',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  3
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  Review Scorecards & Transcripts
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                  Watch responses at 1.5x speed, inspect AI match scores (0–100), view anti-cheat audit logs, download branded PDF submittal dossiers, or auto-sync with your ATS via webhooks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. ENTERPRISE PROCTORING & FEATURE GRID ── */}
        <section style={{ padding: '70px 20px', maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Anti-Cheat & Proctoring Engine
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', margin: '8px 0' }}>
              Why Clients & Prime Vendors Trust SmartScreen
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>
              Eliminating proxy interview fraud, multi-device assistance, and scripted answer reading.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div className="reveal-on-scroll smartscreen-card-hover" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Single Continuous Take</h4>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Recording runs uninterrupted across questions. Candidates cannot stop, re-record, or search answers on secondary tabs.
              </p>
            </div>

            <div className="reveal-on-scroll smartscreen-card-hover" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Multi-Tab Lock & Session Takeover</h4>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Prevents simultaneous test opens on multiple devices. Smart takeover handles mobile WhatsApp link taps gracefully without locking out real talent.
              </p>
            </div>

            <div className="reveal-on-scroll smartscreen-card-hover" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Automatic Link Expiration</h4>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Set hard deadlines (3 Days, 7 Days, or custom calendar dates). Once expired, HTTP 410 auto-locks the link to keep candidate pipelines fresh.
              </p>
            </div>

            <div className="reveal-on-scroll smartscreen-card-hover" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>GPS Location Audit vs Stated City</h4>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Audits candidate-entered address against verified browser GPS coordinates, instantly flagging off-shore location misrepresentations.
              </p>
            </div>

            <div className="reveal-on-scroll smartscreen-card-hover" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Universal ATS Webhook Delivery</h4>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Real-time JSON callbacks with HMAC SHA-256 signatures push scores, PDF dossiers, and video links straight into Bullhorn, Greenhouse, or Workday.
              </p>
            </div>

            <div className="reveal-on-scroll smartscreen-card-hover" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Branded Client PDF Dossiers</h4>
              </div>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                One-click export compiles candidate answers, verbatim transcripts, and recruiter ratings into an agency-branded submittal coversheet for direct clients.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. INTERACTIVE ROLE QUESTION BANKS ── */}
        <section style={{ padding: '60px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tested Question Templates
              </span>
              <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', margin: '8px 0' }}>
                Explore Sample Screening Questions by Industry
              </h2>
              <p style={{ fontSize: '15px', color: '#64748b' }}>
                Click below to preview pre-built questions or customize your own.
              </p>
            </div>

            {/* Role Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
              {roleQuestionBanks.map((rb, idx) => (
                <button
                  key={rb.title}
                  type="button"
                  onClick={() => setSelectedRoleIndex(idx)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    border: selectedRoleIndex === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: selectedRoleIndex === idx ? '#eff6ff' : '#ffffff',
                    color: selectedRoleIndex === idx ? '#1d4ed8' : '#334155'
                  }}
                >
                  {rb.title}
                </button>
              ))}
            </div>

            {/* Questions List */}
            <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>
                  {roleQuestionBanks[selectedRoleIndex].tag}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  3 Proctored Questions (~4 Minutes Total)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {roleQuestionBanks[selectedRoleIndex].questions.map((q) => (
                  <div key={q.num} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Question {q.num}
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                      {q.text}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Tip: {q.hint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. DEDICATED PRICING SECTION ── */}
        <section id="pricing" style={{ padding: '60px 20px', background: '#f8fafc' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <PricingSection initialProductTab="smartscreen" />
          </div>
        </section>

        {/* ── 7. FAQ SECTION ── */}
        <section style={{ padding: '60px 20px 80px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Clear Answers
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '8px 0' }}>
                Frequently Asked Questions
              </h2>
              <p style={{ fontSize: '14.5px', color: '#64748b' }}>
                Everything you need to know about adopting SmartScreen AI.
              </p>
            </div>

            {/* Interactive Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                {
                  q: 'Do candidates need to download an app or create an account?',
                  a: 'No. SmartScreen is 100% browser-based. Candidates open your secure link on any smartphone, tablet, or laptop running Chrome, Safari, Edge, or Firefox without downloading any third-party app or creating passwords.'
                },
                {
                  q: 'Can SmartScreen integrate with our existing ATS (Bullhorn, Greenhouse, Lever)?',
                  a: 'Yes. SmartScreen includes universal webhooks and a REST API. When a candidate finishes their screening, we automatically send an HMAC SHA-256 signed JSON webhook to your ATS with the match score, PDF scorecard link, and video playback URL.'
                },
                {
                  q: 'How does the Anti-Cheat Single Continuous Take work?',
                  a: 'Once a candidate begins, the video recording runs continuously from question 1 through the final question. Candidates cannot pause, re-take individual questions, or switch tabs to look up answers without the session logging a focus deviation flag.'
                },
                {
                  q: 'What happens when an interview link reaches its expiration date?',
                  a: 'When a link reaches its scheduled expiration timestamp (3 days, 7 days, or a custom deadline), the server automatically returns HTTP 410 Gone. Any candidate who visits the URL will see an amber lock screen instructing them to contact your recruiter for a renewal.'
                },
                {
                  q: 'Can we customize questions per requisition?',
                  a: 'Yes. You can customize questions, time limits (e.g. 60s, 90s, 120s), and allowed response modes (video, voice, or written text) for every single job opening, or let our AI generator draft them from your job description.'
                },
                {
                  q: 'Can I purchase SmartScreen AI as a standalone tool without switching my ATS?',
                  a: 'Absolutely. SmartScreen AI is designed from the ground up as an independent standalone product. You can keep your existing ATS and use SmartScreen exclusively for your candidate video & voice assessments.'
                }
              ].map((item, idx) => {
                const isOpen = openFaqIndex === idx
                return (
                  <div
                    key={idx}
                    className="faq-card-interactive"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    style={{
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '18px 22px',
                      background: isOpen ? '#f8fafc' : '#ffffff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {item.q}
                      </h4>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: isOpen ? '#2563eb' : '#94a3b8',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        +
                      </span>
                    </div>
                    {isOpen && (
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '12px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        {item.a}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 8. INTERACTIVE DEMO MODAL ── */}
        {showDemoModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>

              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                Schedule a Live 1-on-1 Demonstration
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px', lineHeight: '1.45' }}>
                See how SmartScreen AI transforms candidate pre-screening for your staffing firm. Our solution architects will conduct a tailored live walkthrough.
              </p>

              {demoSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#dcfce7',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '28px',
                    fontWeight: '800'
                  }}>
                    ✓
                  </div>
                  <h4 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                    Demo Request Received!
                  </h4>
                  <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.55', margin: '0 0 20px' }}>
                    Thank you, <strong>{demoName}</strong>. One of our talent solution architects will connect with you promptly at <strong>{demoEmail}</strong> to schedule your live walkthrough.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(false)}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Got it, Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestLiveDemo}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@youragency.com"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 (555) 019-2834"
                        value={demoPhone}
                        onChange={(e) => setDemoPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        Company / Agency
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Staffing"
                        value={demoCompany}
                        onChange={(e) => setDemoCompany(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Primary Roles to Screen
                    </label>
                    <select
                      value={demoRole}
                      onChange={(e) => setDemoRole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option>Software Engineering & Cloud</option>
                      <option>Healthcare & Clinical Roles</option>
                      <option>Sales & Enterprise Account Executives</option>
                      <option>Customer Support & Operations</option>
                      <option>General High-Volume Staffing</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={demoSubmitting}
                    style={{
                      width: '100%',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '13px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: demoSubmitting ? 'not-allowed' : 'pointer',
                      opacity: demoSubmitting ? 0.7 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{demoSubmitting ? 'Submitting Request...' : 'Schedule Live 1-on-1 Demo ➔'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </SiteLayout>
  )
}
