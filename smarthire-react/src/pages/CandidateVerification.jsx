import React, { useMemo, useState } from 'react'
import SiteLayout from '../components/SiteLayout'

const steps = ['Location', 'Biometrics', 'Documents', 'Review']

function CandidateVerification() {
  const [stepIndex, setStepIndex] = useState(0)
  const [cityClaimed, setCityClaimed] = useState('Austin, TX')
  const [gpsState, setGpsState] = useState('idle') // 'idle' | 'loading' | 'success'
  const [gpsData, setGpsData] = useState(null)
  
  const [livenessState, setLivenessState] = useState('idle') // 'idle' | 'scanning' | 'success'
  
  const [docType, setDocType] = useState('Passport')
  const [docState, setDocState] = useState('idle') // 'idle' | 'uploading' | 'success'
  const [fileName, setFileName] = useState('')
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [mode, setMode] = useState('simulation') // 'simulation' | 'manual'
  const [dlFile, setDlFile] = useState(null)
  const [visaFile, setVisaFile] = useState(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyError, setVerifyError] = useState(null)

  const handleVisaChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setVisaFile(file)
    }
  }

  const handleDlChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setDlFile(file)
    }
  }

  const handleRunVerification = async () => {
    if (!dlFile && !visaFile) {
      setVerifyError("Please upload at least one document (Driver's License or Work Visa).");
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);
    setLoadingStep(0);

    // Start progress step timer
    const stepsInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 1000);

    try {
      const formData = new FormData();
      if (dlFile) formData.append('dl_file', dlFile);
      if (visaFile) formData.append('visa_file', visaFile);

      const res = await fetch('/api/verify/manual-document', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      clearInterval(stepsInterval);

      if (data.success) {
        setLoadingStep(6);
        setTimeout(() => {
          setVerifyResult(data.analysis);
          setVerifyLoading(false);
        }, 800);
      } else {
        throw new Error(data.message || "Failed to verify documents.");
      }
    } catch (err) {
      clearInterval(stepsInterval);
      setVerifyError(err.message);
      setVerifyLoading(false);
    }
  };

  const score = useMemo(() => {
    let base = 50
    if (gpsState === 'success') base += 15
    if (livenessState === 'success') base += 20
    if (docState === 'success') base += 15
    return Math.min(base, 100)
  }, [gpsState, livenessState, docState])

  const handleSimulateGps = () => {
    setGpsState('loading')
    setTimeout(() => {
      setGpsState('success')
      setGpsData({
        lat: (30.2672 + (Math.random() - 0.5) * 0.02).toFixed(4),
        lng: (-97.7431 + (Math.random() - 0.5) * 0.02).toFixed(4),
        accuracy: '4.8 meters',
        ip: '72.182.91.204'
      })
    }, 1200)
  }

  const handleSimulateScan = () => {
    setLivenessState('scanning')
    setTimeout(() => {
      setLivenessState('success')
    }, 2500)
  }

  const handleSimulateUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDocState('uploading')
    setTimeout(() => {
      setDocState('success')
    }, 1800)
  }

  const handleFinalSubmit = () => {
    setIsSubmitted(true)
  }

  const resetFlow = () => {
    setStepIndex(0)
    setGpsState('idle')
    setGpsData(null)
    setLivenessState('idle')
    setDocState('idle')
    setFileName('')
    setIsSubmitted(false)
  }

  return (
    <SiteLayout>
      <section className="section">
        <div className="container narrow">
          <p className="eyebrow">VERIFYHIRE TALENT INTAKE</p>
          <h1 className="page-title">Candidate Verification</h1>
          <p className="lead" style={{ marginBottom: 20 }}>
            Simulate the applicant credential intake flow: secure geolocation pins, face-match liveness checking, and official document OCR.
          </p>

          {isSubmitted ? (
            <div className="card success-card-verif">
              <div className="success-icon-wrap">🎉</div>
              <h2>Verification Dossier Submitted</h2>
              <p className="success-text">
                Your geolocation profile, biometric matching records, and uploaded ID document have been compiled and sent to the recruitment dashboard.
              </p>
              
              <div className="verif-summary-dossier">
                <div className="dossier-item">
                  <span>Location Pin:</span>
                  <span className="bold-status text-green">PASS ({cityClaimed})</span>
                </div>
                <div className="dossier-item">
                  <span>Biometric Liveness:</span>
                  <span className="bold-status text-green">PASS (99.2% Conf)</span>
                </div>
                <div className="dossier-item">
                  <span>Document OCR ID Check:</span>
                  <span className="bold-status text-green">VALIDATED ({docType})</span>
                </div>
                <div className="dossier-item total-score-item">
                  <span>Final Trust Rating:</span>
                  <span className="bold-status text-brand" style={{ fontSize: 18 }}>{score}/100</span>
                </div>
              </div>

              <div className="actions" style={{ justifyContent: 'center', marginTop: 24 }}>
                <button className="btn" onClick={resetFlow}>Start Another Simulation</button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Toggle Tabs */}
              <div className="mode-toggle-container">
                <button 
                  className={`mode-btn ${mode === 'simulation' ? 'active' : ''}`}
                  type="button"
                  onClick={() => { setMode('simulation'); setVerifyResult(null); }}
                >
                  ⚙️ Simulation Flow
                </button>
                <button 
                  className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setMode('manual')}
                >
                  🛡️ Manual AI Verification (Pro)
                </button>
              </div>

              {mode === 'simulation' ? (
                <>
                  {/* Horizontal Stepper */}
                  <div className="stepper-premium">
                {steps.map((step, index) => (
                  <div 
                    key={step} 
                    className={`step-item ${index === stepIndex ? 'active' : ''} ${index < stepIndex ? 'completed' : ''}`}
                    onClick={() => {
                      // Allow clicking back to already visited steps
                      if (index < stepIndex || (index > stepIndex && index <= 3)) {
                        setStepIndex(index)
                      }
                    }}
                  >
                    <div className="step-circle">
                      {index < stepIndex ? '✓' : index + 1}
                    </div>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>

              <article className="card verify-main-card">
                {/* Geolocation Step */}
                {stepIndex === 0 && (
                  <div className="verification-step-layout">
                    <div className="step-headline">
                      <h2>📍 Step 1: Geolocation Verification</h2>
                      <p>Claimed Work City: <strong>{cityClaimed}</strong></p>
                    </div>

                    <div className="form-group-verif">
                      <label>Confirm Your Current City</label>
                      <input 
                        type="text" 
                        value={cityClaimed} 
                        onChange={(e) => setCityClaimed(e.target.value)} 
                        placeholder="e.g. Austin, TX"
                        disabled={gpsState === 'loading'}
                      />
                    </div>

                    <div className="simulated-device-pane">
                      {gpsState === 'idle' && (
                        <div className="gps-prompt-view">
                          <span className="view-icon">📍</span>
                          <p>To verify compliance, we must match your claimed city against device GPS telemetry.</p>
                          <button className="btn" onClick={handleSimulateGps}>Simulate Device GPS Check</button>
                        </div>
                      )}

                      {gpsState === 'loading' && (
                        <div className="gps-loading-view">
                          <div className="sonar-ring-animation" />
                          <p>Acquiring satellite lock & resolving IP address...</p>
                        </div>
                      )}

                      {gpsState === 'success' && gpsData && (
                        <div className="gps-success-view">
                          <span className="status-badge-ok">✓ Geolocation Verified</span>
                          <div className="gps-readings">
                            <div><strong>Latitude:</strong> <code>{gpsData.lat}</code></div>
                            <div><strong>Longitude:</strong> <code>{gpsData.lng}</code></div>
                            <div><strong>Precision:</strong> <code>{gpsData.accuracy}</code></div>
                            <div><strong>Resolving IP:</strong> <code>{gpsData.ip}</code></div>
                          </div>
                          <p className="gps-match-hint">Matches claimed workspace coordinates for {cityClaimed}.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Biometric Liveness Step */}
                {stepIndex === 1 && (
                  <div className="verification-step-layout">
                    <div className="step-headline">
                      <h2>👤 Step 2: Biometric Liveness Scan</h2>
                      <p>Perform face-fit scanning to prevent deepfake spoofing.</p>
                    </div>

                    <div className="camera-sim-viewport">
                      <div className="camera-frame">
                        <div className="camera-overlay-oval" />
                        
                        {livenessState === 'scanning' && (
                          <div className="scan-line-laser" />
                        )}

                        <div className="camera-gridlines" />
                        
                        {livenessState === 'idle' && (
                          <div className="camera-placeholder">
                            <span className="cam-icon">📷</span>
                            <p>Fit your face within the guide oval to start screen liveness detection.</p>
                          </div>
                        )}

                        {livenessState === 'scanning' && (
                          <div className="camera-placeholder processing-alert">
                            <p className="pulsing-text">HOLD STILL. SCANNING...</p>
                          </div>
                        )}

                        {livenessState === 'success' && (
                          <div className="camera-placeholder success-alert">
                            <span className="success-checkmark">🛡️</span>
                            <p>BIOMETRICS VALIDATED</p>
                            <small>Liveness Confidence: 99.2%</small>
                          </div>
                        )}
                      </div>

                      <div className="camera-controls">
                        {livenessState === 'idle' && (
                          <button className="btn" onClick={handleSimulateScan}>Start Biometric Check</button>
                        )}
                        {livenessState === 'scanning' && (
                          <button className="btn btn-ghost" disabled>Screen scanning in progress...</button>
                        )}
                        {livenessState === 'success' && (
                          <button className="btn btn-ghost" onClick={() => setLivenessState('idle')}>Retake Scan</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Step */}
                {stepIndex === 2 && (
                  <div className="verification-step-layout">
                    <div className="step-headline">
                      <h2>📄 Step 3: Identity Document Upload</h2>
                      <p>Upload a matching government-issued photo identity document.</p>
                    </div>

                    <div className="document-form-group">
                      <label>Select Document Category</label>
                      <div className="doc-type-toggles">
                        {['Passport', 'Drivers License', 'Work Visa'].map(type => (
                          <button 
                            key={type} 
                            type="button" 
                            className={`doc-toggle-btn ${docType === type ? 'active' : ''}`}
                            onClick={() => setDocType(type)}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="simulated-upload-zone">
                      {docState === 'idle' && (
                        <div className="upload-prompt">
                          <span className="upload-icon">📤</span>
                          <p>Drag & Drop your document image or PDF here</p>
                          <label className="btn btn-ghost upload-file-trigger">
                            Select File
                            <input type="file" accept="image/*,.pdf" onChange={handleSimulateUpload} style={{ display: 'none' }} />
                          </label>
                        </div>
                      )}

                      {docState === 'uploading' && (
                        <div className="upload-progress-box">
                          <div className="loader-spinner" />
                          <p>Parsing file <strong>{fileName}</strong> via OCR Engine...</p>
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill-verif" />
                          </div>
                        </div>
                      )}

                      {docState === 'success' && (
                        <div className="upload-success-box">
                          <span className="status-badge-ok">✓ Document Validated</span>
                          <p>Successfully processed file: <strong>{fileName}</strong></p>
                          <div className="ocr-extracted-metadata">
                            <strong>OCR Extraction Results:</strong>
                            <div className="metadata-row">
                              <span>Document Type:</span> <code>{docType.toUpperCase()}</code>
                            </div>
                            <div className="metadata-row">
                              <span>OCR Security Match:</span> <code>PASSED (Watermarks Valid)</code>
                            </div>
                          </div>
                          <button className="btn btn-sm btn-ghost" onClick={() => setDocState('idle')} style={{ marginTop: 12 }}>Remove File</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Step */}
                {stepIndex === 3 && (
                  <div className="verification-step-layout">
                    <div className="step-headline">
                      <h2>🔍 Step 4: Verification Review</h2>
                      <p>Confirm the credentials package details before publishing.</p>
                    </div>

                    <div className="review-package-checklist">
                      <div className="checklist-row">
                        <span className="label">GPS Telemetry Pin</span>
                        <span className={`status-pill ${gpsState === 'success' ? 'pill-ok' : 'pill-warn'}`}>
                          {gpsState === 'success' ? '✓ VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                      <div className="checklist-row">
                        <span className="label">Biometric Liveness Scan</span>
                        <span className={`status-pill ${livenessState === 'success' ? 'pill-ok' : 'pill-warn'}`}>
                          {livenessState === 'success' ? '✓ PASSED (99.2%)' : 'PENDING'}
                        </span>
                      </div>
                      <div className="checklist-row">
                        <span className="label">Identity Document OCR</span>
                        <span className={`status-pill ${docState === 'success' ? 'pill-ok' : 'pill-warn'}`}>
                          {docState === 'success' ? `✓ VALIDATED (${docType})` : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    <div className="dossier-trust-score-panel">
                      <div className="trust-meter-layout">
                        <h3>Simulated Trust Score</h3>
                        <div className="trust-score-badge-glowing">
                          <strong>{score}</strong>
                          <span>/ 100</span>
                        </div>
                      </div>
                      <p className="trust-rating-description">
                        {score >= 80 
                          ? '🛡️ TRUSTED RATING: Complete compliance data acquired. Ready to shortlist.' 
                          : '⚠️ CONDITIONAL RATING: Complete missing verification checks to maximize score.'}
                      </p>
                    </div>

                    <div className="dossier-notice">
                      <strong>Note:</strong> In production, candidates complete this flow on their mobile web browsers.
                    </div>
                  </div>
                )}

                <div className="verify-footer-actions">
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setStepIndex((v) => Math.max(v - 1, 0))}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </button>
                  
                  {stepIndex < 3 ? (
                    <button 
                      className="btn" 
                      onClick={() => setStepIndex((v) => Math.min(v + 1, steps.length - 1))}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button 
                      className="btn btn-submit-dossier" 
                      onClick={handleFinalSubmit}
                      disabled={gpsState !== 'success' && livenessState !== 'success' && docState !== 'success'}
                    >
                      Publish Dossier & Submit
                    </button>
                  )}
                </div>
              </article>
            </>
          ) : (
            <article className="card verify-main-card manual-verif-card no-print">
              <div className="verification-step-layout">
                <div className="step-headline">
                  <h2>🛡️ Pro AI Document & Fraud Verification</h2>
                  <p>Upload a candidate US Driver's License and Work Visa copy. The vision model will perform high-IQ checks on layouts, state rules, and immigration rules.</p>
                </div>

                {/* Setup Form */}
                <div className="manual-grid-layout">
                  {/* Upload Zones */}
                  <div className="upload-slots-container">
                    <div className="document-slot">
                      <span className="slot-badge">Driver's License Upload</span>
                      <div className="slot-upload-area">
                        {dlFile ? (
                          <div className="uploaded-file-preview">
                            <span className="file-icon">🪪</span>
                            <div className="file-meta">
                              <strong>{dlFile.name}</strong>
                              <span>{(dlFile.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button className="remove-btn" type="button" onClick={() => setDlFile(null)}>✕</button>
                          </div>
                        ) : (
                          <label className="upload-dropzone">
                            <span className="cloud-icon">📤</span>
                            <strong>Upload US Driver's License</strong>
                            <span className="subtext">PNG, JPG, WEBP, or PDF</span>
                            <input type="file" accept="image/*,.pdf" onChange={handleDlChange} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="document-slot">
                      <span className="slot-badge">Work Visa / Approval Notice</span>
                      <div className="slot-upload-area">
                        {visaFile ? (
                          <div className="uploaded-file-preview">
                            <span className="file-icon">📄</span>
                            <div className="file-meta">
                              <strong>{visaFile.name}</strong>
                              <span>{(visaFile.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button className="remove-btn" type="button" onClick={() => setVisaFile(null)}>✕</button>
                          </div>
                        ) : (
                          <label className="upload-dropzone">
                            <span className="cloud-icon">📤</span>
                            <strong>Upload Visa Document</strong>
                            <span className="subtext">PNG, JPG, WEBP, or PDF</span>
                            <input type="file" accept="image/*,.pdf" onChange={handleVisaChange} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="manual-verify-actions" style={{ marginTop: 24 }}>
                  <button 
                    type="button"
                    className="btn run-verify-btn"
                    onClick={handleRunVerification}
                    disabled={verifyLoading || (!dlFile && !visaFile)}
                  >
                    {verifyLoading ? 'Running AI Scan...' : '🛡️ Run AI Verification Scan'}
                  </button>
                </div>

                {/* Loading State Overlay */}
                {verifyLoading && (
                  <div className="verify-loading-overlay">
                    <div className="loader-box">
                      <div className="loader-ring-glowing"></div>
                      <h3>Verification Scan In Progress</h3>
                      <div className="loading-steps-list">
                        {[
                          "Uploading documents to secure verification vault...",
                          "Analyzing document layouts and extracting text via Vision OCR...",
                          "Determining jurisdiction and visa category...",
                          "Cross-checking State DMV database standards...",
                          "Analyzing Visa petition alignment and immigration dates...",
                          "Evaluating image anomalies, pixel variance, and font uniformities..."
                        ].map((text, idx) => (
                          <div 
                            key={idx} 
                            className={`loading-step-item ${idx === loadingStep ? 'current' : idx < loadingStep ? 'done' : 'pending'}`}
                          >
                            <span className="step-bullet">{idx < loadingStep ? '✓' : idx === loadingStep ? '●' : '○'}</span>
                            <span>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {verifyError && (
                  <div className="error-alert-banner">
                    <strong>⚠️ Verification Failed</strong>
                    <p>{verifyError}</p>
                    <button className="btn btn-sm btn-ghost" type="button" onClick={() => setVerifyError(null)}>Dismiss</button>
                  </div>
                )}

                {/* Results Dashboard */}
                {verifyResult && (
                  <div className="verification-results-dashboard">
                    <div className="results-actions-bar no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                      <button className="btn" style={{ background: 'var(--brand)', color: 'white', fontWeight: 'bold' }} onClick={() => window.print()}>
                        📋 Download / Print PDF Report
                      </button>
                    </div>

                    {/* Overall Verdict Banner */}
                    <div className={`verdict-banner-premium ${
                      verifyResult.verdict === 'LEGITIMATE' ? 'verdict-pass' : 
                      verifyResult.verdict === 'SUSPICIOUS' ? 'verdict-warn' : 'verdict-fail'
                    }`}>
                      <div className="verdict-header-row">
                        <div className="verdict-title-group">
                          <span className="verdict-label">AI VERIFICATION STATUS</span>
                          <h3>{
                            verifyResult.verdict === 'LEGITIMATE' ? '🛡️ LEGITIMATE - PASS' : 
                            verifyResult.verdict === 'SUSPICIOUS' ? '⚠️ SUSPICIOUS - ACTION REQUIRED' : '🚨 SUSPECTED FRAUD - FAIL'
                          }</h3>
                        </div>
                        <div className="verdict-score-gauge">
                          <strong>{verifyResult.confidence_score}</strong>
                          <span>Score</span>
                        </div>
                      </div>
                      <p className="verdict-summary-text">{verifyResult.summary}</p>
                    </div>

                    {/* Compliance Checks Cards Grid */}
                    <div className="compliance-cards-grid">
                      {/* Driver's License Card */}
                      <div className="compliance-card">
                        <div className="card-header-icon">🪪 Driver's License Audit</div>
                        <div className="card-checks-list">
                          <div className="extracted-header">Detected State: {verifyResult.state_rules_validation.detected_state || 'Not Found'}</div>
                          <div className="applied-rules-text">{verifyResult.state_rules_validation.state_rules_applied}</div>
                          {verifyResult.state_rules_validation.checks.map((chk, idx) => (
                            <div key={idx} className="check-item-row">
                              <span className={`status-icon ${chk.status === 'PASS' ? 'pass' : chk.status === 'WARN' ? 'warn' : 'fail'}`}>
                                {chk.status === 'PASS' ? '✓' : chk.status === 'WARN' ? '⚠' : '✗'}
                              </span>
                              <div className="check-item-desc">
                                <strong>{chk.name}</strong>
                                <span>{chk.details}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Visa Card */}
                      <div className="compliance-card">
                        <div className="card-header-icon">📄 Immigration Visa Audit</div>
                        <div className="card-checks-list">
                          <div className="extracted-header">Detected Visa Type: {verifyResult.visa_validation.detected_visa_type || 'Not Found'}</div>
                          <div className="applied-rules-text">Federal Visa compliance checks: cross-references date sequences, beneficiary names, and employer petition sponsors.</div>
                          {verifyResult.visa_validation.checks.map((chk, idx) => (
                            <div key={idx} className="check-item-row">
                              <span className={`status-icon ${chk.status === 'PASS' ? 'pass' : chk.status === 'WARN' ? 'warn' : 'fail'}`}>
                                {chk.status === 'PASS' ? '✓' : chk.status === 'WARN' ? '⚠' : '✗'}
                              </span>
                              <div className="check-item-desc">
                                <strong>{chk.name}</strong>
                                <span>{chk.details}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Extracted Metadata Comparison Table */}
                    <div className="extracted-metadata-table-card">
                      <h4>📋 Extracted Document Metadata Comparison</h4>
                      <div className="table-wrapper">
                        <table className="comparison-table">
                          <thead>
                            <tr>
                              <th>Verification Field</th>
                              <th>Driver's License Data</th>
                              <th>Visa Document Data</th>
                              <th>Cross-Match Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Candidate Name</strong></td>
                              <td>{verifyResult.extracted_data.dl_details.candidate_name || verifyResult.extracted_data.candidate_name || 'N/A'}</td>
                              <td>{verifyResult.extracted_data.visa_details.beneficiary_name || verifyResult.extracted_data.candidate_name || 'N/A'}</td>
                              <td>
                                <span className={`status-pill ${
                                  (verifyResult.extracted_data.dl_details.candidate_name && verifyResult.extracted_data.visa_details.beneficiary_name && 
                                  verifyResult.extracted_data.dl_details.candidate_name.toLowerCase().includes(verifyResult.extracted_data.visa_details.beneficiary_name.split(' ')[0].toLowerCase())) 
                                  ? 'pill-ok' : 'pill-warn'
                                }`}>
                                  {(verifyResult.extracted_data.dl_details.candidate_name && verifyResult.extracted_data.visa_details.beneficiary_name && 
                                  verifyResult.extracted_data.dl_details.candidate_name.toLowerCase().includes(verifyResult.extracted_data.visa_details.beneficiary_name.split(' ')[0].toLowerCase())) 
                                  ? 'MATCH' : 'DISCREPANCY'}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>ID Number</strong></td>
                              <td><code>{verifyResult.extracted_data.dl_details.number || 'N/A'}</code></td>
                              <td><code>{verifyResult.extracted_data.visa_details.number || 'N/A'}</code></td>
                              <td><span className="status-pill pill-neutral">N/A</span></td>
                            </tr>
                            <tr>
                              <td><strong>Date of Birth</strong></td>
                              <td>{verifyResult.extracted_data.dl_details.dob || 'N/A'}</td>
                              <td>{verifyResult.extracted_data.visa_details.dob || 'N/A'}</td>
                              <td>
                                <span className={`status-pill ${
                                  (verifyResult.extracted_data.dl_details.dob && verifyResult.extracted_data.visa_details.dob &&
                                  verifyResult.extracted_data.dl_details.dob === verifyResult.extracted_data.visa_details.dob)
                                  ? 'pill-ok' : 'pill-warn'
                                }`}>
                                  {verifyResult.extracted_data.dl_details.dob === verifyResult.extracted_data.visa_details.dob ? 'MATCH' : 'MISMATCH'}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Issue Date</strong></td>
                              <td>{verifyResult.extracted_data.dl_details.issue_date || 'N/A'}</td>
                              <td>{verifyResult.extracted_data.visa_details.issue_date || 'N/A'}</td>
                              <td><span className="status-pill pill-neutral">N/A</span></td>
                            </tr>
                            <tr>
                              <td><strong>Expiration Date</strong></td>
                              <td>{verifyResult.extracted_data.dl_details.expiration_date || 'N/A'}</td>
                              <td>{verifyResult.extracted_data.visa_details.expiration_date || 'N/A'}</td>
                              <td>
                                <span className={`status-pill ${
                                  (verifyResult.extracted_data.dl_details.expiration_date && verifyResult.extracted_data.visa_details.expiration_date)
                                  ? 'pill-ok' : 'pill-warn'
                                }`}>
                                  ACTIVE
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fraud Risk Assessment Indicators */}
                    <div className="fraud-indicators-card">
                      <h4>🛡️ Forensic Integrity Indicators</h4>
                      <div className="indicators-list">
                        {verifyResult.fraud_indicators.map((ind, idx) => (
                          <div key={idx} className="indicator-row">
                            <div className="ind-header">
                              <span className={`risk-badge ${ind.risk_level === 'HIGH' ? 'high' : ind.risk_level === 'MEDIUM' ? 'medium' : 'low'}`}>
                                {ind.risk_level} RISK
                              </span>
                              <strong>{ind.indicator}</strong>
                            </div>
                            <p className="ind-details">{ind.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}
            </>
          )}
        </div>
      </section>

      {/* Scoped Premium Styles */}
      <style>{`
        /* Mode Toggle Tabs */
        .mode-toggle-container {
          display: flex;
          gap: 8px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          padding: 6px;
          border-radius: 10px;
          margin-bottom: 24px;
          width: fit-content;
        }
        .mode-btn {
          background: transparent;
          border: none;
          padding: 8px 16px;
          font-weight: 700;
          font-size: 13px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--ink-soft);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mode-btn.active {
          background: var(--brand);
          color: white;
          box-shadow: 0 4px 10px rgba(18, 106, 90, 0.15);
        }

        /* Manual Verification Grid */
        .manual-grid-layout {
          display: block;
          margin-top: 10px;
        }

        .upload-slots-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
        }
        @media (max-width: 600px) {
          .upload-slots-container {
            grid-template-columns: 1fr;
          }
        }

        .document-slot {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .slot-badge {
          font-size: 11px;
          font-weight: 800;
          color: var(--brand);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .slot-upload-area {
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 120px;
          border: 2px dashed var(--line);
          border-radius: 10px;
          cursor: pointer;
          padding: 16px;
          background: var(--surface-2);
          transition: all 0.2s ease;
        }
        .upload-dropzone:hover {
          border-color: var(--brand);
          background: rgba(18, 106, 90, 0.02);
        }
        .cloud-icon {
          font-size: 26px;
          margin-bottom: 6px;
        }
        .upload-dropzone strong {
          font-size: 13px;
          color: var(--ink);
        }
        .upload-dropzone .subtext {
          font-size: 11px;
          color: var(--ink-soft);
          margin-top: 4px;
        }

        .uploaded-file-preview {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 16px;
          background: rgba(18, 106, 90, 0.04);
          border: 1px solid var(--brand);
          border-radius: 8px;
          gap: 12px;
          position: relative;
        }
        .file-icon {
          font-size: 24px;
        }
        .file-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .file-meta strong {
          font-size: 13px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .file-meta span {
          font-size: 11px;
          color: var(--ink-soft);
        }
        .remove-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--ink-soft);
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
        }
        .remove-btn:hover {
          color: #b91c1c;
        }

        /* Demo Document Card Previews */
        .demo-doc-preview {
          display: flex;
          flex-direction: column;
          width: 100%;
          border-radius: 8px;
          padding: 12px 16px;
          color: white;
          font-family: monospace;
          font-size: 11.5px;
          position: relative;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .dl-demo-card {
          background: linear-gradient(135deg, #1d4ed8, #3b82f6);
          border: 1px solid #1e40af;
        }
        .visa-demo-card {
          background: linear-gradient(135deg, #0f766e, #14b8a6);
          border: 1px solid #0d9488;
        }
        .demo-card-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 12px;
          font-size: 11px;
          letter-spacing: 0.1em;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding-bottom: 4px;
        }
        .demo-realid {
          color: #facc15;
          font-size: 14px;
          text-shadow: 0 0 4px rgba(250, 204, 21, 0.5);
        }
        .demo-card-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .demo-card-body strong {
          font-size: 13px;
          letter-spacing: 0.05em;
        }
        .demo-card-body code {
          background: rgba(0,0,0,0.2);
          padding: 2px 4px;
          border-radius: 4px;
          width: fit-content;
          color: #f3f4f6;
        }

        /* Right Column Form Inputs */
        .verif-select, .verif-input {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 14px;
          background: var(--surface);
          color: var(--ink);
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none;
        }
        .verif-select:focus, .verif-input:focus {
          border-color: var(--brand);
        }

        /* Demo Profiles Section */
        .demo-profiles-section {
          margin-top: 20px;
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
        }
        .demo-profiles-section h4 {
          margin: 0 0 4px 0;
          font-size: 13px;
          font-weight: 800;
        }
        .demo-subtitle {
          font-size: 11.5px;
          color: var(--ink-soft);
          margin: 0 0 12px 0;
        }
        .demo-buttons-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .demo-select-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--surface);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }
        .demo-select-btn:hover {
          border-color: var(--brand);
          transform: translateY(-1px);
        }
        .demo-select-btn.active-pass {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.04);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.1);
        }
        .demo-select-btn.active-warn {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.04);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.1);
        }
        .demo-select-btn.active-fail {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.04);
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.1);
        }
        .btn-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pass-dot { background: #22c55e; }
        .warn-dot { background: #f59e0b; }
        .fail-dot { background: #ef4444; }

        .btn-text {
          display: flex;
          flex-direction: column;
        }
        .btn-text strong {
          font-size: 12.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--ink);
        }
        .btn-text span {
          font-size: 11px;
          color: var(--ink-soft);
        }

        /* Action footer and buttons */
        .manual-verify-actions {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: flex-end;
        }
        .run-verify-btn {
          background: var(--brand);
          color: white;
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          border: none;
          box-shadow: 0 4px 12px rgba(18, 106, 90, 0.2);
        }
        .run-verify-btn:hover:not(:disabled) {
          background: #125447;
          transform: translateY(-1px);
        }
        .run-verify-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Loading Overlay screen */
        .verify-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          padding: 24px;
          animation: fadeIn 0.3s ease;
        }
        .loader-box {
          text-align: center;
          max-width: 440px;
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(18, 39, 35, 0.05);
        }
        .loader-ring-glowing {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(18, 106, 90, 0.1);
          border-top-color: var(--brand);
          border-radius: 50%;
          margin: 0 auto 16px auto;
          animation: spin 0.8s infinite linear;
          box-shadow: 0 0 15px rgba(18, 106, 90, 0.15);
        }
        .loader-box h3 {
          margin: 0 0 16px 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 16px;
        }
        .loading-steps-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }
        .loading-step-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          transition: all 0.3s ease;
        }
        .loading-step-item.pending {
          color: var(--ink-soft);
          opacity: 0.4;
        }
        .loading-step-item.current {
          color: var(--brand);
          font-weight: 700;
          opacity: 1;
        }
        .loading-step-item.current .step-bullet {
          animation: scalePulse 1s infinite alternate;
          color: var(--brand);
        }
        .loading-step-item.done {
          color: #22c55e;
          opacity: 0.9;
        }
        .step-bullet {
          font-weight: bold;
          font-size: 14px;
          width: 16px;
          display: inline-block;
          text-align: center;
        }

        /* Error Alert banner */
        .error-alert-banner {
          margin-top: 20px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .error-alert-banner p {
          margin: 0;
          font-size: 12.5px;
          flex-grow: 1;
        }

        /* Results dashboard styles */
        .verification-results-dashboard {
          margin-top: 28px;
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
          border-top: 2px solid var(--line);
          padding-top: 28px;
        }

        .verdict-banner-premium {
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          border-left: 6px solid;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }
        .verdict-pass {
          background: linear-gradient(to right, rgba(34, 197, 94, 0.05), transparent);
          border-color: #22c55e;
          border-top: 1px solid rgba(34, 197, 94, 0.1);
          border-right: 1px solid rgba(34, 197, 94, 0.1);
          border-bottom: 1px solid rgba(34, 197, 94, 0.1);
        }
        .verdict-warn {
          background: linear-gradient(to right, rgba(245, 158, 11, 0.05), transparent);
          border-color: #f59e0b;
          border-top: 1px solid rgba(245, 158, 11, 0.1);
          border-right: 1px solid rgba(245, 158, 11, 0.1);
          border-bottom: 1px solid rgba(245, 158, 11, 0.1);
        }
        .verdict-fail {
          background: linear-gradient(to right, rgba(239, 68, 68, 0.05), transparent);
          border-color: #ef4444;
          border-top: 1px solid rgba(239, 68, 68, 0.1);
          border-right: 1px solid rgba(239, 68, 68, 0.1);
          border-bottom: 1px solid rgba(239, 68, 68, 0.1);
        }

        .verdict-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 16px;
        }
        .verdict-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .verdict-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--ink-soft);
        }
        .verdict-title-group h3 {
          margin: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          font-weight: 900;
        }
        .verdict-score-gauge {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: var(--surface);
          border: 3.5px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .verdict-pass .verdict-score-gauge { border-color: #22c55e; color: #15803d; }
        .verdict-warn .verdict-score-gauge { border-color: #f59e0b; color: #b45309; }
        .verdict-fail .verdict-score-gauge { border-color: #ef4444; color: #b91c1c; }

        .verdict-score-gauge strong {
          font-size: 16px;
          font-weight: 800;
          line-height: 1;
        }
        .verdict-score-gauge span {
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          opacity: 0.8;
        }
        .verdict-summary-text {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--ink);
        }

        /* Compliance Check cards */
        .compliance-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .compliance-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .compliance-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
        }
        .card-header-icon {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 10px;
        }
        .card-checks-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .extracted-header {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--brand);
        }
        .applied-rules-text {
          font-size: 11.5px;
          color: var(--ink-soft);
          background: var(--surface-2);
          padding: 8px 12px;
          border-radius: 6px;
          line-height: 1.4;
        }
        .check-item-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .status-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .status-icon.pass { background: #dcfce7; color: #15803d; }
        .status-icon.warn { background: #fef3c7; color: #d97706; }
        .status-icon.fail { background: #fee2e2; color: #b91c1c; }

        .check-item-desc {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .check-item-desc strong {
          font-size: 12.5px;
          color: var(--ink);
        }
        .check-item-desc span {
          font-size: 11.5px;
          color: var(--ink-soft);
          line-height: 1.4;
        }

        /* Metadata comparison table */
        .extracted-metadata-table-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .extracted-metadata-table-card h4 {
          margin: 0 0 16px 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 800;
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .comparison-table th, .comparison-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--line);
        }
        .comparison-table th {
          background: var(--surface-2);
          font-weight: 700;
          color: var(--ink-soft);
          font-size: 11.5px;
          text-transform: uppercase;
        }
        .comparison-table code {
          background: var(--surface-2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        .comparison-table td .status-pill {
          font-size: 10px;
          padding: 2px 6px;
        }
        .pill-neutral {
          background: var(--surface-2);
          color: var(--ink-soft);
        }

        /* Forensic Indicators Section */
        .fraud-indicators-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
        }
        .fraud-indicators-card h4 {
          margin: 0 0 16px 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 800;
        }
        .indicators-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .indicator-row {
          border-bottom: 1px solid var(--line);
          padding-bottom: 14px;
        }
        .indicator-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .ind-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .ind-header strong {
          font-size: 13.5px;
          color: var(--ink);
        }
        .risk-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .risk-badge.high { background: #fee2e2; color: #b91c1c; }
        .risk-badge.medium { background: #fef3c7; color: #d97706; }
        .risk-badge.low { background: #dcfce7; color: #15803d; }
        
        .ind-details {
          margin: 0;
          font-size: 12.5px;
          color: var(--ink-soft);
          line-height: 1.4;
        }

        .stepper-premium {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px 24px;
          margin-bottom: 24px;
          position: relative;
          box-shadow: 0 4px 10px rgba(18, 39, 35, 0.02);
        }
        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          opacity: 0.6;
          transition: all 0.2s ease;
        }
        .step-item.active {
          opacity: 1;
          color: var(--brand);
        }
        .step-item.completed {
          opacity: 0.8;
          color: var(--brand);
        }
        .step-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--surface-2);
          border: 1.5px solid var(--line);
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-soft);
          transition: all 0.2s ease;
        }
        .step-item.active .step-circle {
          background: var(--brand);
          color: white;
          border-color: var(--brand);
          box-shadow: 0 0 10px rgba(18, 106, 90, 0.25);
        }
        .step-item.completed .step-circle {
          background: rgba(18, 106, 90, 0.1);
          color: var(--brand);
          border-color: var(--brand);
        }
        .step-item strong {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
        }
        @media (max-width: 600px) {
          .stepper-premium {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }

        .verify-main-card {
          padding: 30px;
          background: var(--surface);
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .verification-step-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .step-headline h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          margin: 0 0 4px 0;
          font-weight: 800;
        }
        .step-headline p {
          margin: 0;
          font-size: 13px;
          color: var(--ink-soft);
        }

        .form-group-verif {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group-verif label {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-group-verif input {
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 10px 14px;
          background: var(--surface);
          color: var(--ink);
          font-size: 14px;
        }

        .simulated-device-pane {
          background: var(--surface-2);
          border: 1px dashed var(--line);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          min-height: 180px;
          display: grid;
          place-items: center;
        }
        .gps-prompt-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          max-width: 320px;
        }
        .view-icon {
          font-size: 32px;
        }
        .gps-prompt-view p {
          font-size: 13px;
          color: var(--ink-soft);
          margin: 0 0 10px 0;
          line-height: 1.4;
        }
        .gps-loading-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .sonar-ring-animation {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid var(--brand);
          animation: sonarPulse 1.2s infinite ease-out;
        }
        .gps-loading-view p {
          font-size: 13px;
          font-weight: 600;
        }

        .gps-success-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .status-badge-ok {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .gps-readings {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 24px;
          text-align: left;
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 12px 18px;
          border-radius: 8px;
          font-size: 12.5px;
          width: 100%;
          max-width: 400px;
        }
        .gps-match-hint {
          font-size: 12px;
          color: var(--ink-soft);
          margin: 0;
        }

        /* Biometrics Step viewport */
        .camera-sim-viewport {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .camera-frame {
          width: 320px;
          height: 240px;
          background: #0b0f0e;
          border-radius: 16px;
          border: 2px solid #283331;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        .camera-overlay-oval {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 180px;
          border: 2px dashed rgba(16, 185, 129, 0.4);
          border-radius: 50%;
          z-index: 2;
        }
        .camera-gridlines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 30px 30px;
          z-index: 1;
        }
        .scan-line-laser {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(180deg, transparent, rgba(16, 185, 129, 0.8));
          box-shadow: 0 0 10px #10b981;
          z-index: 3;
          animation: laserScan 2s infinite linear;
        }
        .camera-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 4;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
          color: #a4b3b0;
        }
        .camera-placeholder.processing-alert {
          background: rgba(11, 15, 14, 0.8);
          color: #10b981;
        }
        .camera-placeholder.success-alert {
          background: rgba(18, 106, 90, 0.9);
          color: white;
        }
        .pulsing-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.1em;
          animation: textPulse 1s infinite alternate;
        }
        .success-checkmark {
          font-size: 36px;
          margin-bottom: 8px;
        }
        .cam-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .camera-placeholder p {
          font-size: 12px;
          margin: 0;
          max-width: 220px;
          line-height: 1.4;
        }
        .camera-controls {
          display: flex;
          justify-content: center;
        }

        /* Documents Step */
        .document-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .document-form-group label {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink-soft);
          text-transform: uppercase;
        }
        .doc-type-toggles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .doc-toggle-btn {
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 10px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--ink-soft);
          transition: all 0.2s ease;
        }
        .doc-toggle-btn.active {
          background: var(--brand);
          color: white;
          border-color: var(--brand);
        }

        .simulated-upload-zone {
          background: var(--surface-2);
          border: 2px dashed var(--line);
          border-radius: 12px;
          padding: 30px 20px;
          text-align: center;
          display: grid;
          place-items: center;
          min-height: 180px;
        }
        .upload-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .upload-icon {
          font-size: 32px;
        }
        .upload-prompt p {
          font-size: 13px;
          color: var(--ink-soft);
          margin: 0 0 10px 0;
        }
        .upload-file-trigger {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .upload-progress-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 320px;
        }
        .loader-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(18, 106, 90, 0.1);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 0.8s infinite linear;
        }
        .progress-bar-container {
          width: 100%;
          height: 6px;
          background: var(--surface);
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--line);
        }
        .progress-bar-fill-verif {
          height: 100%;
          background: var(--brand);
          width: 0%;
          border-radius: 10px;
          animation: fillBar 1.8s forwards linear;
        }
        .upload-success-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .ocr-extracted-metadata {
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 12px 16px;
          border-radius: 8px;
          text-align: left;
          font-size: 12.5px;
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 6px;
        }
        .metadata-row {
          display: flex;
          justify-content: space-between;
        }

        /* Review Step */
        .review-package-checklist {
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .checklist-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(216, 205, 183, 0.5);
        }
        .checklist-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .checklist-row .label {
          font-weight: 600;
          font-size: 13.5px;
        }
        .status-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .status-pill.pill-ok {
          background: #dcfce7;
          color: #15803d;
        }
        .status-pill.pill-warn {
          background: #fee2e2;
          color: #b91c1c;
        }

        .dossier-trust-score-panel {
          background: var(--surface);
          border: 1px solid var(--line);
          padding: 18px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .trust-meter-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .trust-meter-layout h3 {
          font-size: 11px;
          margin: 0;
          text-transform: uppercase;
          color: var(--ink-soft);
          letter-spacing: 0.05em;
        }
        .trust-score-badge-glowing {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--brand);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 0 15px rgba(18, 106, 90, 0.4);
        }
        .trust-score-badge-glowing strong {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          line-height: 1;
        }
        .trust-score-badge-glowing span {
          font-size: 8px;
          font-weight: 600;
          opacity: 0.8;
        }
        .trust-rating-description {
          font-size: 13px;
          color: var(--ink);
          margin: 0;
          line-height: 1.4;
          font-weight: 600;
        }
        .dossier-notice {
          font-size: 12px;
          color: var(--ink-soft);
          text-align: center;
        }

        .verify-footer-actions {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid var(--line);
          padding-top: 20px;
          margin-top: 10px;
        }

        /* Success screen verif */
        .success-card-verif {
          padding: 40px 30px;
          text-align: center;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .success-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #dcfce7;
          font-size: 30px;
          display: grid;
          place-items: center;
          margin: 0 auto 16px auto;
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.15);
        }
        .success-card-verif h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 800;
        }
        .success-text {
          font-size: 14px;
          color: var(--ink-soft);
          max-width: 440px;
          margin: 0 auto 24px auto;
          line-height: 1.5;
        }
        .verif-summary-dossier {
          background: var(--surface-2);
          border: 1px solid var(--line);
          border-radius: 10px;
          max-width: 400px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }
        .dossier-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        .dossier-item .bold-status {
          font-weight: 700;
        }
        .text-green { color: #15803d; }
        .text-brand { color: var(--brand); }
        .total-score-item {
          border-top: 1px solid var(--line);
          padding-top: 8px;
          font-weight: 700;
        }

        /* Animations */
        @keyframes sonarPulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes laserScan {
          0% { top: 0; }
          50% { top: calc(100% - 4px); }
          100% { top: 0; }
        }
        @keyframes textPulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to { width: 100%; }
        }

        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden;
          }
          .verification-results-dashboard, .verification-results-dashboard * {
            visibility: visible;
          }
          .verification-results-dashboard {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .verdict-banner-premium {
            box-shadow: none !important;
            border: 2px solid #ccc !important;
          }
          .compliance-card, .extracted-metadata-table-card, .fraud-indicators-card {
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            margin-bottom: 20px !important;
          }
        }
      `}</style>
    </SiteLayout>
  )
}

export default CandidateVerification

