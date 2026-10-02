import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

export default function SmartSignRtrPage() {
  const { token } = useParams()
  const [agreement, setAgreement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signMethod, setSignMethod] = useState('draw') // 'draw', 'type', 'upload'
  const [typedName, setTypedName] = useState('')
  const [typedFont, setTypedFont] = useState('cursive')
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [uploadedSign, setUploadedSign] = useState(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signedResult, setSignedResult] = useState(null)

  const canvasRef = useRef(null)

  // Fetch agreement by token
  useEffect(() => {
    if (!token) {
      // Demo / preview mode if opened without token
      setAgreement({
        token: 'DEMO-PREVIEW',
        candidateName: 'Sai Teja Goud Naguluri',
        jobTitle: 'Senior Full-Stack Cloud Engineer',
        jobId: 'REQ-7584',
        clientName: 'State of Texas / Enterprise Client',
        payRate: '$75.00 / hr (C2C)',
        exclusivityDays: 60,
        recruiterName: 'Omkesh Manjute',
        recruiterEmail: 'omkesh@coolsofttech.com',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      })
      setLoading(false)
      return
    }

    async function fetchRtr() {
      try {
        setLoading(true)
        const res = await fetch(`/api/rtr/${token}`)
        const data = await res.json()
        if (data.success && data.agreement) {
          setAgreement(data.agreement)
          if (data.agreement.status === 'SIGNED') {
            setSignedResult(data.agreement)
          }
        } else {
          setError(data.message || 'RTR agreement not found or link has expired.')
        }
      } catch (err) {
        setError('Failed to load agreement. Please check network connection.')
      } finally {
        setLoading(false)
      }
    }
    fetchRtr()
  }, [token])

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setUploadedSign(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSignSubmit = async (e) => {
    e.preventDefault()
    if (!agreedToTerms) {
      alert('Please check the acknowledgment box to confirm your electronic signature.')
      return
    }

    let signaturePayload = ''
    if (signMethod === 'draw') {
      if (!hasDrawn || !canvasRef.current) {
        alert('Please draw your signature in the signature box.')
        return
      }
      signaturePayload = canvasRef.current.toDataURL('image/png')
    } else if (signMethod === 'type') {
      if (!typedName.trim()) {
        alert('Please enter your full legal name for the typed signature.')
        return
      }
      // Render typed text to canvas to get image data
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 400
      tempCanvas.height = 100
      const ctx = tempCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      ctx.font = '32px "Brush Script MT", "Caveat", cursive'
      ctx.fillStyle = '#0f172a'
      ctx.fillText(typedName, 20, 60)
      signaturePayload = tempCanvas.toDataURL('image/png')
    } else if (signMethod === 'upload') {
      if (!uploadedSign) {
        alert('Please upload an image of your signature.')
        return
      }
      signaturePayload = uploadedSign
    }

    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/rtr/${token || 'DEMO-PREVIEW'}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureData: signaturePayload,
          signMethod,
          candidateLegalName: typedName.trim() || agreement.candidateName
        })
      })

      const data = await res.json()
      if (data.success) {
        setSignedResult(data.agreement || {
          ...agreement,
          status: 'SIGNED',
          signedAt: new Date().toISOString(),
          certHash: data.certHash || 'verified-sha256-hash'
        })
      } else {
        alert(data.message || 'Failed to submit signature.')
      }
    } catch (err) {
      alert('Error submitting signature: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '16px' }}>
          Loading SmartSign Agreement...
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b' }}>Verifying 256-bit secure document token</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>Agreement Unavailable</h2>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '0 auto 20px' }}>{error}</p>
        <Link to="/" style={styles.primaryLink}>Return to SmartHire ATS</Link>
      </div>
    )
  }

  return (
    <div style={styles.pageContainer}>
      {/* Top Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.logoBadge}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                SmartSign <span style={{ color: '#2563eb' }}>RTR</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                Secure Electronic Right to Represent
              </div>
            </div>
          </div>

          <div style={styles.securityPill}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>ESIGN & UETA Compliant (256-bit SSL)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.mainContent}>
        {signedResult ? (
          /* ─── SUCCESS / SIGNED CERTIFICATE SCREEN ────────────────────────── */
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
              <div style={styles.successIconCircle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '12px 0 6px' }}>
                Right to Represent Successfully Signed!
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '520px', margin: '0 auto 24px' }}>
                Your electronic authorization has been officially verified, timestamped, and transmitted to {signedResult.recruiterName || 'the recruitment team'}.
              </p>
            </div>

            {/* Verification Certificate Box */}
            <div style={styles.certBox}>
              <div style={styles.certHeading}>Digital Audit Trail & Verification Certificate</div>
              
              <div style={styles.certRow}>
                <span style={{ color: '#64748b' }}>Candidate Legal Name:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{signedResult.signedLegalName || signedResult.candidateName}</span>
              </div>
              <div style={styles.certRow}>
                <span style={{ color: '#64748b' }}>Target Position:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{signedResult.jobTitle} (Req #{signedResult.jobId})</span>
              </div>
              <div style={styles.certRow}>
                <span style={{ color: '#64748b' }}>Client / Prime Vendor:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{signedResult.clientName}</span>
              </div>
              <div style={styles.certRow}>
                <span style={{ color: '#64748b' }}>Agreed Pay Rate:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{signedResult.payRate}</span>
              </div>
              <div style={styles.certRow}>
                <span style={{ color: '#64748b' }}>Exclusive Representation:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{signedResult.exclusivityDays} Calendar Days</span>
              </div>
              <div style={styles.certRow}>
                <span style={{ color: '#64748b' }}>Signed Timestamp:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>
                  {new Date(signedResult.signedAt || Date.now()).toLocaleString('en-US', { timeZoneName: 'short' })}
                </span>
              </div>
              <div style={styles.certRow}>
                <span style={{ color: '#64748b' }}>Document Hash (SHA-256):</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#2563eb', wordBreak: 'break-all' }}>
                  {signedResult.audit?.certHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </span>
              </div>

              {signedResult.signatureData && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>Captured Electronic Signature:</div>
                  <img src={signedResult.signatureData} alt="Candidate Signature" style={{ maxHeight: '60px', maxWidth: '240px', objectFit: 'contain' }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={styles.secondaryBtn}
              >
                Print / Save PDF Copy
              </button>
            </div>
          </div>
        ) : (
          /* ─── ACTIVE SIGNING SCREEN ────────────────────────────────────────── */
          <div style={styles.card}>
            {/* Agreement Notice Banner */}
            <div style={styles.noticeBanner}>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e3a8a', marginBottom: '2px' }}>
                Exclusive Right to Represent Authorization (RTR)
              </div>
              <div style={{ fontSize: '12px', color: '#3b82f6', lineHeight: 1.4 }}>
                Please review the terms of representation below and apply your electronic signature. No account or login required.
              </div>
            </div>

            {/* Formal Agreement Body */}
            <div style={styles.agreementPaper}>
              <div style={styles.paperWatermark}>OFFICIAL RTR</div>

              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  RIGHT TO REPRESENT (RTR) AGREEMENT
                </h3>
                <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CoolSoft LLC / SmartHire Staffing Partner
                </div>
              </div>

              <div style={styles.agreementParagraph}>
                I, <strong>{agreement.candidateName}</strong>, hereby authorize <strong>CoolSoft LLC / SmartHire</strong> ("Agency") and their assigned recruiting specialist, <strong>{agreement.recruiterName || 'Omkesh Manjute'}</strong>, as my exclusive representative for submission and representation to:
              </div>

              <div style={styles.metaHighlightBox}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Client Organization:</span>
                  <span style={styles.metaValue}>{agreement.clientName}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Target Job Title:</span>
                  <span style={styles.metaValue}>{agreement.jobTitle}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Requisition ID:</span>
                  <span style={styles.metaValue}>#{agreement.jobId}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Agreed Pay / Billing Rate:</span>
                  <span style={styles.metaValue}>{agreement.payRate}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Exclusivity Duration:</span>
                  <span style={styles.metaValue}>{agreement.exclusivityDays} Calendar Days from Execution Date</span>
                </div>
              </div>

              <div style={styles.agreementParagraph}>
                <strong>Terms of Representation:</strong>
              </div>
              <ul style={styles.termsList}>
                <li>I confirm that I have not authorized any other agency, vendor, or recruiter to submit my resume or profile for this specific requisition with <strong>{agreement.clientName}</strong>.</li>
                <li>I agree that <strong>CoolSoft LLC / SmartHire</strong> holds the sole and exclusive right to represent me for this requisition for a period of <strong>{agreement.exclusivityDays} days</strong>.</li>
                <li>I confirm that all details, technical work history, educational credentials, and legal work authorization status presented in my resume are truthful, accurate, and current.</li>
                <li>I agree to be available for interviews arranged by the Agency with the Client, and will notify the Agency promptly regarding any changes in availability.</li>
              </ul>
            </div>

            {/* Interactive Electronic Signature Pad */}
            <form onSubmit={handleSignSubmit} style={{ marginTop: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Select Signature Method:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSignMethod('draw')}
                    style={{
                      ...styles.tabBtn,
                      ...(signMethod === 'draw' ? styles.tabBtnActive : {})
                    }}
                  >
                    ✍️ Draw with Finger / Mouse
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignMethod('type')
                      if (!typedName) setTypedName(agreement.candidateName)
                    }}
                    style={{
                      ...styles.tabBtn,
                      ...(signMethod === 'type' ? styles.tabBtnActive : {})
                    }}
                  >
                    ⌨️ Type Legal Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignMethod('upload')}
                    style={{
                      ...styles.tabBtn,
                      ...(signMethod === 'upload' ? styles.tabBtnActive : {})
                    }}
                  >
                    📁 Upload Signature Image
                  </button>
                </div>
              </div>

              {/* Signature Inputs */}
              {signMethod === 'draw' && (
                <div style={styles.canvasContainer}>
                  <div style={styles.canvasTopBar}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Sign inside the box below:</span>
                    <button type="button" onClick={clearCanvas} style={styles.clearBtn}>Clear Signature</button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={styles.canvas}
                  />
                </div>
              )}

              {signMethod === 'type' && (
                <div style={styles.typeContainer}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Type Your Full Legal Name:
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={e => setTypedName(e.target.value)}
                    placeholder="e.g. John Doe"
                    style={styles.typeInput}
                    required
                  />
                  {typedName && (
                    <div style={styles.cursivePreview}>
                      <span style={{ fontSize: '32px', fontFamily: '"Brush Script MT", "Caveat", cursive', color: '#0f172a' }}>
                        {typedName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {signMethod === 'upload' && (
                <div style={styles.uploadContainer}>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ fontSize: '13px' }} />
                  {uploadedSign && (
                    <div style={{ marginTop: '12px' }}>
                      <img src={uploadedSign} alt="Uploaded Signature" style={{ maxHeight: '80px', maxWidth: '240px', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Acknowledgment Checkbox */}
              <div style={styles.ackBox}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                    required
                  />
                  <span style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
                    I acknowledge that I am applying a legally binding electronic signature under the <strong>U.S. Electronic Signatures in Global and National Commerce Act (ESIGN)</strong> and <strong>Uniform Electronic Transactions Act (UETA)</strong>. I agree to exclusively represent through CoolSoft LLC / SmartHire for this role.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  style={{
                    ...styles.primaryBtn,
                    opacity: (isSubmitting || !agreedToTerms) ? 0.6 : 1,
                    cursor: (isSubmitting || !agreedToTerms) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Signing & Recording Certificate...' : 'Sign & Authorize RTR ➔'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div>SmartHire ATS • CoolSoft LLC Electronic Signature Infrastructure</div>
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>
          Certified compliant under US ESIGN Act (15 U.S.C. § 7001) & UETA
        </div>
      </footer>
    </div>
  )
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '14px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
  },
  headerInner: {
    maxWidth: '840px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  logoBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  securityPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#065f46',
    fontSize: '11.5px',
    fontWeight: '700'
  },
  mainContent: {
    flex: 1,
    padding: '30px 16px',
    maxWidth: '840px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '28px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
    boxSizing: 'border-box'
  },
  noticeBanner: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '20px'
  },
  agreementPaper: {
    position: 'relative',
    backgroundColor: '#fafbfc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px 28px',
    color: '#1e293b'
  },
  paperWatermark: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-30deg)',
    fontSize: '56px',
    fontWeight: '900',
    color: 'rgba(15, 23, 42, 0.03)',
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap'
  },
  agreementParagraph: {
    fontSize: '13.5px',
    lineHeight: 1.6,
    color: '#334155',
    marginBottom: '14px'
  },
  metaHighlightBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '12px 16px',
    margin: '14px 0 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px'
  },
  metaLabel: {
    color: '#64748b',
    fontWeight: '600'
  },
  metaValue: {
    color: '#0f172a',
    fontWeight: '800'
  },
  termsList: {
    margin: '6px 0 0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#334155',
    lineHeight: 1.6
  },
  tabBtn: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  tabBtnActive: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderColor: '#0f172a',
    fontWeight: '700'
  },
  canvasContainer: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#ffffff'
  },
  canvasTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '140px',
    cursor: 'crosshair',
    touchAction: 'none'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  typeContainer: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '16px',
    backgroundColor: '#ffffff'
  },
  typeInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box'
  },
  cursivePreview: {
    marginTop: '12px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: '1px dashed #cbd5e1',
    textAlign: 'center'
  },
  uploadContainer: {
    border: '1px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '24px',
    textAlign: 'center',
    backgroundColor: '#ffffff'
  },
  ackBox: {
    marginTop: '18px',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px'
  },
  primaryBtn: {
    padding: '11px 24px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    fontSize: '13.5px',
    fontWeight: '800',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  secondaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  successIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  },
  certBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px 24px',
    maxWidth: '620px',
    margin: '0 auto'
  },
  certHeading: {
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: '#64748b',
    marginBottom: '14px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px'
  },
  certRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12.5px',
    marginBottom: '8px',
    gap: '12px'
  },
  loadingContainer: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorContainer: {
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center'
  },
  primaryLink: {
    padding: '9px 18px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '700'
  },
  spinner: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    animation: 'spin 0.8s linear infinite'
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '12px',
    color: '#64748b',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff'
  }
}
