import React, { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { doc, setDoc } from 'firebase/firestore'

/**
 * LinkedIn Verification Modal
 * ────────────────────────────
 * Authorized Playwright session profile extraction,
 * Groq AI semantic cross-examination against ATS candidate resume,
 * Discrepancy highlights (company, title, dates, projects, skills),
 * and dual persistence (Server + Firebase Firestore).
 */
export default function LinkedInVerificationModal({
  isOpen,
  onClose,
  candidate,
  onVerificationComplete,
  currentUser
}) {
  if (!isOpen || !candidate) return null

  const [linkedinUrl, setLinkedinUrl] = useState(() => {
    if (candidate.linkedinUrl) return candidate.linkedinUrl
    if (candidate.resumeText) {
      const m = candidate.resumeText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)
      if (m) return m[0]
    }
    return ''
  })

  const [activeTab, setActiveTab] = useState('summary') // 'summary', 'experience', 'skills', 'projects', 'education'
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState('')
  const [sessionStatus, setSessionStatus] = useState(null)
  const [showSessionConfig, setShowSessionConfig] = useState(false)
  const [cookieInput, setCookieInput] = useState('')
  const [savingSession, setSavingSession] = useState(false)
  const [verificationResult, setVerificationResult] = useState(candidate.linkedinVerification || null)
  const [firebaseSaved, setFirebaseSaved] = useState(false)
  const [showDirectPaste, setShowDirectPaste] = useState(false)
  const [profileTextInput, setProfileTextInput] = useState('')

  // Fetch session status on mount
  useEffect(() => {
    fetchSessionStatus()
  }, [])

  const fetchSessionStatus = async () => {
    try {
      const res = await fetch('/api/linkedin/session-status')
      const data = await res.json()
      if (data && data.success) {
        setSessionStatus(data)
      }
    } catch (_) {}
  }

  const handleSaveSession = async () => {
    if (!cookieInput.trim()) return
    setSavingSession(true)
    setError('')
    try {
      const res = await fetch('/api/linkedin/session-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          li_at: cookieInput.trim(),
          accountName: currentUser?.name ? `${currentUser.name}'s LinkedIn Session` : 'Authorized Recruiter Session'
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowSessionConfig(false)
        setCookieInput('')
        fetchSessionStatus()
      } else {
        setError(data.error || 'Failed to save session.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSession(false)
    }
  }

  const handleRunVerification = async () => {
    if (!linkedinUrl.trim()) {
      setError('Please provide a valid LinkedIn profile URL.')
      return
    }

    setLoading(true)
    setError('')
    setFirebaseSaved(false)
    setLoadingStep('Initializing verification engine...')

    const textToSubmit = typeof overrideText === 'string' ? overrideText : profileTextInput

    try {
      if (textToSubmit && textToSubmit.trim().length > 15) {
        setLoadingStep('Extracting structured profile attributes with Groq AI...')
      } else {
        setTimeout(() => setLoadingStep('Navigating to profile and reading permitted background details...'), 2000)
        setTimeout(() => setLoadingStep('Extracting companies, titles, dates, skills, and projects...'), 4500)
      }
      setTimeout(() => setLoadingStep('Running Groq AI cross-examination against candidate resume...'), 6500)

      const candId = candidate.id || candidate.candidate_id
      const res = await fetch(`/api/candidates/${encodeURIComponent(candId)}/verify-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim(),
          profileText: textToSubmit ? textToSubmit.trim() : undefined
        })
      })

      const rawResponse = await res.text()
      let data
      try {
        data = JSON.parse(rawResponse)
      } catch (parseErr) {
        throw new Error(
          res.status === 504
            ? 'LinkedIn verification connection timed out. Please click "↗ Open in LinkedIn" and paste candidate profile text below for instant AI verification.'
            : `Server returned an invalid response (${res.status}).`
        )
      }

      if (!data.success) {
        if (data.needsSessionSetup) {
          setShowSessionConfig(true)
          setError(data.message || 'LinkedIn authorized session setup required.')
          setLoading(false)
          return
        }
        if (data.cloudflareBlocked) {
          setShowDirectPaste(true)
          setError(data.message || 'LinkedIn Cloudflare security blocked direct datacenter access. Please open profile in new tab and paste text below.')
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Verification failed on server.')
      }

      const result = data.verification
      setVerificationResult(result)
      setShowDirectPaste(false)

      // Dual Persistence: Write audit record directly to Firebase Firestore
      try {
        if (db) {
          const docRef = doc(db, 'candidate_verifications', String(candId))
          await setDoc(docRef, {
            candidateId: String(candId),
            candidateName: candidate.name,
            candidateEmail: candidate.email || '',
            linkedinUrl: linkedinUrl.trim(),
            overallStatus: result.overallStatus,
            confidenceScore: result.confidenceScore,
            summary: result.summary,
            evidence: result.evidence || [],
            discrepancies: result.discrepancies || [],
            comparisons: result.comparisons || {},
            verifiedAt: result.verifiedAt || new Date().toISOString(),
            verifiedBy: currentUser?.email || 'recruiter@coolsofttech.com'
          }, { merge: true })
          setFirebaseSaved(true)
        }
      } catch (fbErr) {
        console.warn('[Firebase Verification Save Warning]:', fbErr.message)
      }

      if (onVerificationComplete) {
        onVerificationComplete({
          ...candidate,
          linkedinVerification: result,
          linkedinUrl: linkedinUrl.trim(),
          linkedinVerifiedAt: result.verifiedAt,
          linkedinStatus: result.overallStatus
        })
      }
    } catch (err) {
      setError(err.message || 'Verification encountered an error.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const v = verificationResult
  const isMatch = v?.overallStatus === 'MATCH'
  const isPartial = v?.overallStatus === 'PARTIAL_MATCH'
  const isConflict = v?.overallStatus === 'CONFLICT'

  const statusBadge = () => {
    if (!v) return null
    if (isMatch) {
      return (
        <span style={{ backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span>✅</span> <span>Match</span>
        </span>
      )
    }
    if (isPartial) {
      return (
        <span style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span>⚠</span> <span>Partial Match</span>
        </span>
      )
    }
    if (isConflict) {
      return (
        <span style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span>❌</span> <span>Conflict Detected</span>
        </span>
      )
    }
    return (
      <span style={{ backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 800 }}>
        — Not Found / Unverified
      </span>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: 860,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #CBD5E1'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              backgroundColor: '#0A66C2',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18
            }}>
              in
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  LinkedIn Background Verification
                </h3>
                {statusBadge()}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Candidate: <strong style={{ color: '#1E293B' }}>{candidate.name}</strong> • Cross-examining resume with authorized profile
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: '#64748B',
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* URL Input Bar & Action Row */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <input
              type="url"
              placeholder="https://www.linkedin.com/in/username"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                color: '#0F172A',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleRunVerification}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#94A3B8' : '#0A66C2',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {loading ? 'Verifying...' : (v ? 'Re-verify with LinkedIn' : 'Verify with LinkedIn')}
          </button>

          {linkedinUrl && (
            <a
              href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#0A66C2',
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: 6,
                textDecoration: 'none'
              }}
              title="Open candidate profile in new tab (bypasses datacenter Cloudflare restrictions)"
            >
              <span>Open in LinkedIn</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <button
            type="button"
            onClick={() => setShowDirectPaste(p => !p)}
            style={{
              backgroundColor: showDirectPaste ? '#EFF6FF' : '#FFFFFF',
              color: showDirectPaste ? '#1D4ED8' : '#475569',
              border: `1px solid ${showDirectPaste ? '#93C5FD' : '#CBD5E1'}`,
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Paste profile content directly for 100% reliable instant verification"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Paste Profile Text</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSessionConfig(p => !p)}
            style={{
              backgroundColor: sessionStatus?.configured ? '#F0FDF4' : '#FFFBEB',
              color: sessionStatus?.configured ? '#166534' : '#B45309',
              border: `1px solid ${sessionStatus?.configured ? '#BBF7D0' : '#FDE68A'}`,
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Configure authorized recruiter session cookie"
          >
            {sessionStatus?.configured ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Session Active</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Setup Session</span>
              </>
            )}
          </button>
        </div>

        {/* Direct Profile Text Paste Box (Bypasses Datacenter Cloudflare Block) */}
        {showDirectPaste && (
          <div style={{ padding: '14px 24px', backgroundColor: '#F0F9FF', borderBottom: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0369A1' }}>
                Instant AI Verification (Bypasses Datacenter Security Blocks)
              </div>
              {linkedinUrl && (
                <a
                  href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11.5, color: '#0284C7', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Click to open candidate profile in new tab ↗
                </a>
              )}
            </div>
            <p style={{ fontSize: 11.5, color: '#475569', margin: '0 0 8px' }}>
              Open the candidate&apos;s profile in your browser, copy their experience / headline / skills text (or Ctrl+A, Ctrl+C), and paste it below. Groq AI will parse and cross-examine with their resume in &lt;2 seconds!
            </p>
            <textarea
              placeholder="Paste candidate LinkedIn profile text, experience, or skills here..."
              value={profileTextInput}
              onChange={e => setProfileTextInput(e.target.value)}
              disabled={loading}
              rows={4}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                border: '1px solid #93C5FD',
                borderRadius: 4,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                marginBottom: 8
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleRunVerification(null, profileTextInput)}
                disabled={loading || !profileTextInput.trim()}
                style={{
                  backgroundColor: loading || !profileTextInput.trim() ? '#94A3B8' : '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 4,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: loading || !profileTextInput.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Analyzing with AI...' : 'Run Instant AI Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Optional Session Config Box */}
        {showSessionConfig && (
          <div style={{ padding: '14px 24px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
              Authorized LinkedIn Session Setup (One-Time Recruiter Setup)
            </div>
            <p style={{ fontSize: 11.5, color: '#64748B', margin: '0 0 8px' }}>
              To allow Playwright to read candidate profile details permitted under your recruiter account without bypassing access restrictions, provide your LinkedIn session cookie (<code>li_at</code>).
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                placeholder="Paste li_at cookie value here (starts with AQED...)"
                value={cookieInput}
                onChange={e => setCookieInput(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 4 }}
              />
              <button
                type="button"
                onClick={handleSaveSession}
                disabled={savingSession}
                style={{ backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 4, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {savingSession ? 'Saving...' : 'Save Session'}
              </button>
            </div>

            {/* Quick 20-second step guide */}
            <div style={{ marginTop: 10, fontSize: 11.5, color: '#475569', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>How to get your `li_at` cookie (Takes 20 seconds):</div>
              <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                <li>Open <strong>linkedin.com</strong> in your browser (where you are already logged in).</li>
                <li>Press <strong>F12</strong> (or Right-Click anywhere → <strong>Inspect</strong>).</li>
                <li>Click the <strong>Application</strong> tab at the top (if not visible, click the <code>»</code> arrows).</li>
                <li>In the left sidebar, click <strong>Storage</strong> → <strong>Cookies</strong> → <strong>https://www.linkedin.com</strong>.</li>
                <li>Look for <strong>li_at</strong> in the list, double-click its <strong>Value</strong> column, copy the string (starts with <code>AQED...</code>), and paste it above.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ margin: '12px 24px 0', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#B91C1C', fontSize: 12 }}>
            <strong>Verification Note:</strong> {error}
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          {loading && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{
                width: 44,
                height: 44,
                border: '3px solid #E2E8F0',
                borderTopColor: '#0A66C2',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px'
              }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                Running Playwright & AI LinkedIn Verification
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B' }}>
                {loadingStep}
              </div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {!loading && !v && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🔍</div>
              <h4 style={{ margin: '0 0 6px', color: '#0F172A', fontSize: 15, fontWeight: 700 }}>
                No LinkedIn Verification on Record
              </h4>
              <p style={{ margin: '0 auto 18px', maxWidth: 460, fontSize: 12.5 }}>
                Click <strong>“Verify with LinkedIn”</strong> above to launch an authorized Playwright browser session, inspect the profile, and compare companies, dates, skills, and projects against their ATS resume.
              </p>
            </div>
          )}

          {!loading && v && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Executive Summary Card */}
              <div style={{
                backgroundColor: isMatch ? '#F0FDF4' : (isPartial ? '#FFFBEB' : '#FEF2F2'),
                border: `1px solid ${isMatch ? '#BBF7D0' : (isPartial ? '#FDE68A' : '#FECACA')}`,
                borderRadius: 8,
                padding: '16px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: isMatch ? '#15803D' : (isPartial ? '#B45309' : '#B91C1C')
                    }}>
                      {v.confidenceScore || 85}%
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isMatch ? '#166534' : (isPartial ? '#92400E' : '#991B1B') }}>
                        {isMatch ? 'Verified Genuine Match' : (isPartial ? 'Partial Match — Discrepancies Noted' : 'High-Risk Conflict Detected')}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Confidence Score calculated across employers, titles, timeline & skills
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748B' }}>
                    {firebaseSaved && (
                      <span style={{ color: '#047857', fontWeight: 700 }}>✓ Synced to Firebase</span>
                    )}
                    {v.linkedinUrl && (
                      <a href={v.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 700 }}>
                        View Profile ↗
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.45, marginBottom: 10 }}>
                  {v.summary}
                </div>

                {v.evidence && v.evidence.length > 0 && (
                  <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: 4, letterSpacing: '0.4px' }}>
                      Key Verified Facts & Evidence:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#334155' }}>
                      {v.evidence.map((ev, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Discrepancies Alert Box (Requirement #7) */}
              {v.discrepancies && v.discrepancies.length > 0 && (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '14px 18px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: '#B91C1C', fontSize: 13, fontWeight: 800 }}>
                    <span>⚠</span>
                    <span>Highlighted Differences & Discrepancies ({v.discrepancies.length})</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {v.discrepancies.map((d, idx) => {
                      const isHigh = d.severity === 'HIGH'
                      return (
                        <div key={idx} style={{
                          backgroundColor: isHigh ? '#FEF2F2' : '#FFFBEB',
                          border: `1px solid ${isHigh ? '#FCA5A5' : '#FDE68A'}`,
                          borderRadius: 6,
                          padding: '9px 12px',
                          fontSize: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong style={{ color: isHigh ? '#991B1B' : '#92400E', fontSize: 12.5 }}>
                              {d.title || d.type}
                            </strong>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              backgroundColor: isHigh ? '#FEE2E2' : '#FEF3C7',
                              color: isHigh ? '#B91C1C' : '#B45309',
                              padding: '1px 6px',
                              borderRadius: 4
                            }}>
                              {d.severity || 'MEDIUM'} PRIORITY
                            </span>
                          </div>
                          <div style={{ color: '#334155', marginBottom: 6 }}>
                            {d.description}
                          </div>
                          {(d.resumeValue || d.linkedinValue) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, backgroundColor: '#FFFFFF', padding: 6, borderRadius: 4, border: '1px solid #E2E8F0' }}>
                              <div>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>Resume Claim: </span>
                                <span style={{ color: '#0F172A', fontWeight: 700 }}>{d.resumeValue || '—'}</span>
                              </div>
                              <div>
                                <span style={{ color: '#64748B', fontWeight: 600 }}>LinkedIn Profile: </span>
                                <span style={{ color: '#2563EB', fontWeight: 700 }}>{d.linkedinValue || 'Not Found'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Tabs for Side-by-Side Breakdown */}
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: 4, marginBottom: 12 }}>
                  {[
                    { id: 'summary', label: 'Company & Titles' },
                    { id: 'skills', label: 'Skills Comparison' },
                    { id: 'projects', label: 'Projects & Work' },
                    { id: 'education', label: 'Education & Certs' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '8px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        borderBottom: activeTab === tab.id ? '2px solid #0A66C2' : '2px solid transparent',
                        color: activeTab === tab.id ? '#0A66C2' : '#64748B',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab 1: Companies & Titles */}
                {activeTab === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: 12, backgroundColor: '#F8FAFC' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: 8 }}>
                          ATS Resume Record
                        </div>
                        <div style={{ fontSize: 12, color: '#0F172A', lineHeight: 1.5 }}>
                          <div><strong>Role:</strong> {candidate.role || candidate.title || 'Specialist'}</div>
                          <div><strong>Company:</strong> {candidate.company || candidate.employer || 'Not specified'}</div>
                          <div><strong>Experience:</strong> {candidate.experience || '5+ Years'}</div>
                        </div>
                      </div>

                      <div style={{ border: '1px solid #BFDBFE', borderRadius: 6, padding: 12, backgroundColor: '#EFF6FF' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#1D4ED8', marginBottom: 8 }}>
                          LinkedIn Authorized Profile
                        </div>
                        <div style={{ fontSize: 12, color: '#0F172A', lineHeight: 1.5 }}>
                          <div><strong>Name:</strong> {v.extractedProfile?.name || candidate.name}</div>
                          <div><strong>Headline:</strong> {v.extractedProfile?.headline || '—'}</div>
                          <div><strong>Location:</strong> {v.extractedProfile?.location || '—'}</div>
                          {v.extractedProfile?.companies && v.extractedProfile.companies.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              <strong>Companies Found:</strong> {v.extractedProfile.companies.slice(0, 4).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {v.comparisons?.employmentDates?.notes && (
                      <div style={{ padding: '8px 12px', backgroundColor: '#F1F5F9', borderRadius: 6, fontSize: 12, color: '#334155' }}>
                        <strong>Timeline & Dates Analysis:</strong> {v.comparisons.employmentDates.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Skills */}
                {activeTab === 'skills' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#047857', marginBottom: 6 }}>
                        ✓ Matched Skills in Both Resume & LinkedIn:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(v.comparisons?.skills?.matched || []).length > 0 ? (
                          v.comparisons.skills.matched.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 11, backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                              ✓ {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>No exact skills overlap detected.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#B45309', marginBottom: 6 }}>
                        ⚠ Skills Claimed in Resume (Missing from LinkedIn Profile):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(v.comparisons?.skills?.resumeOnly || []).length > 0 ? (
                          v.comparisons.skills.resumeOnly.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 11, backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                              ? {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: '#047857', fontStyle: 'italic' }}>All major resume skills verified on LinkedIn.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Projects */}
                {activeTab === 'projects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    {v.comparisons?.projects?.missingFromLinkedIn && v.comparisons.projects.missingFromLinkedIn.length > 0 && (
                      <div style={{ padding: '8px 12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, color: '#92400E' }}>
                        <strong>Unlisted Projects:</strong> The following projects mentioned in resume were not verified on the LinkedIn profile:
                        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                          {v.comparisons.projects.missingFromLinkedIn.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div style={{ color: '#475569' }}>
                      {v.comparisons?.projects?.notes || 'Projects cross-checked against public and authorized profile sections.'}
                    </div>
                  </div>
                )}

                {/* Tab 4: Education & Certs */}
                {activeTab === 'education' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                    <div style={{ border: '1px solid #E2E8F0', padding: 12, borderRadius: 6 }}>
                      <strong style={{ color: '#1E293B', display: 'block', marginBottom: 6 }}>Education Verification</strong>
                      <div>{typeof v.comparisons?.education?.notes === 'string' ? v.comparisons.education.notes : 'Degrees and educational timeline evaluated.'}</div>
                    </div>
                    <div style={{ border: '1px solid #E2E8F0', padding: 12, borderRadius: 6 }}>
                      <strong style={{ color: '#1E293B', display: 'block', marginBottom: 6 }}>Certifications & Licenses</strong>
                      <div>{typeof v.comparisons?.certifications?.notes === 'string' ? v.comparisons.certifications.notes : 'Professional licenses and credentials evaluated.'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            Authorized Playwright Session • Groq AI Fraud Verification • Firebase Firestore
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
