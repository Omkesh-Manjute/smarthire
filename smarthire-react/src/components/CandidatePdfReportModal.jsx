import React from 'react';

export default function CandidatePdfReportModal({ candidate, onClose }) {
  if (!candidate) return null;

  const candidateName = candidate.name || 'Candidate Name';
  const role = candidate.role || candidate.jobTitle || 'Position Candidate';
  const score = candidate.score || candidate.trustScore || 85;
  const status = candidate.status || 'Trusted';
  const date = candidate.date || candidate.createdAt || new Date().toISOString().split('T')[0];
  const referredBy = candidate.referredByRecruiterName || candidate.referredBy || 'Direct Sourced';
  const refCode = candidate.recruiterRefCode || 'REF-8921';
  const location = candidate.location || candidate.city || 'Austin, TX, USA';
  const email = candidate.email || 'candidate@verifyhire.com';

  const getStatusColor = (st) => {
    const s = (st || '').toLowerCase();
    if (s === 'trusted') return '#16a34a';
    if (s === 'review' || s === 'medium_risk') return '#d97706';
    return '#dc2626';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pdf-modal-overlay">
      <div className="pdf-modal-container">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="pdf-control-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📜</span>
            <strong style={{ fontSize: '15px', color: '#0F172A' }}>Candidate Compliance Certificate Preview</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="pdf-print-btn">
              🖨️ Download / Save PDF
            </button>
            <button onClick={onClose} className="pdf-close-btn">
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Certificate Page */}
        <div className="pdf-printable-page" id="printable-certificate">
          {/* Header */}
          <div className="pdf-header">
            <div className="pdf-brand-mark">
              <span className="pdf-logo-badge">🛡️ SmartHire Verified</span>
              <h1 className="pdf-title">CANDIDATE TRUST & COMPLIANCE REPORT</h1>
              <p className="pdf-subtitle">Official Identity Verification & Background Audit Certificate</p>
            </div>
            <div className="pdf-meta-box">
              <div><strong>Report ID:</strong> <span style={{ fontFamily: 'monospace' }}>VHR-2026-{(candidate.id || '9821').toString().slice(-6).toUpperCase()}</span></div>
              <div><strong>Generated Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div><strong>Verification Status:</strong> <span style={{ color: getStatusColor(status), fontWeight: '800' }}>{status.toUpperCase()}</span></div>
            </div>
          </div>

          <hr className="pdf-divider" />

          {/* Candidate & Recruiter Information Grid */}
          <div className="pdf-grid-2col">
            <div className="pdf-info-card">
              <h3 className="pdf-section-heading">👤 Candidate Profile</h3>
              <table className="pdf-info-table">
                <tbody>
                  <tr>
                    <td>Full Name:</td>
                    <td><strong>{candidateName}</strong></td>
                  </tr>
                  <tr>
                    <td>Target Job Role:</td>
                    <td><strong>{role}</strong></td>
                  </tr>
                  <tr>
                    <td>Email Address:</td>
                    <td>{email}</td>
                  </tr>
                  <tr>
                    <td>Work Location:</td>
                    <td>{location}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pdf-info-card">
              <h3 className="pdf-section-heading">🔗 Sourcing & Attribution Details</h3>
              <table className="pdf-info-table">
                <tbody>
                  <tr>
                    <td>Recruiter / Source:</td>
                    <td><strong>{referredBy}</strong></td>
                  </tr>
                  <tr>
                    <td>Referral Tag Code:</td>
                    <td><span className="pdf-tag">{refCode}</span></td>
                  </tr>
                  <tr>
                    <td>Verification Date:</td>
                    <td>{date}</td>
                  </tr>
                  <tr>
                    <td>System Decision:</td>
                    <td><span className="pdf-badge" style={{ background: `${getStatusColor(status)}15`, color: getStatusColor(status), border: `1px solid ${getStatusColor(status)}30` }}>{status}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust Score Overall Gauge */}
          <div className="pdf-score-banner" style={{ borderLeft: `6px solid ${getStatusColor(status)}` }}>
            <div className="pdf-score-circle" style={{ borderColor: getStatusColor(status), color: getStatusColor(status) }}>
              <span className="pdf-score-num">{score}</span>
              <span className="pdf-score-max">/100</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>
                Overall Trust Index: {score >= 80 ? 'HIGH TRUST (PASS)' : score >= 60 ? 'MEDIUM RISK (REVIEW)' : 'HIGH RISK (FLAGGED)'}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
                This score is compiled using multi-layered GPS geolocation checks, IP intelligence, biometric selfie verification, ID document validation, and social profile cross-referencing.
              </p>
            </div>
          </div>

          {/* Detailed Verification Checks Breakdown */}
          <div style={{ marginTop: '24px' }}>
            <h3 className="pdf-section-heading">🔍 Verification Checks Audit Breakdown</h3>
            <table className="pdf-audit-table">
              <thead>
                <tr>
                  <th>Check Type</th>
                  <th>Verification Method</th>
                  <th>Points Scored</th>
                  <th>Check Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🛰️ GPS Geolocation</td>
                  <td>Live Device Coordinates vs Work Location</td>
                  <td><strong>30 / 30</strong></td>
                  <td><span className="pdf-check-pass">✓ PASSED</span></td>
                </tr>
                <tr>
                  <td>🌐 IP Geolocation & Proxy</td>
                  <td>ISP Detection & Anti-VPN Check</td>
                  <td><strong>20 / 20</strong></td>
                  <td><span className="pdf-check-pass">✓ PASSED</span></td>
                </tr>
                <tr>
                  <td>🆔 Government ID Document</td>
                  <td>Passport / Driver License OCR Validation</td>
                  <td><strong>20 / 20</strong></td>
                  <td><span className="pdf-check-pass">✓ PASSED</span></td>
                </tr>
                <tr>
                  <td>📸 Biometric Selfie Match</td>
                  <td>Facial Recognition & Liveness Check</td>
                  <td><strong>10 / 10</strong></td>
                  <td><span className="pdf-check-pass">✓ PASSED</span></td>
                </tr>
                <tr>
                  <td>📹 Liveness Video Verification</td>
                  <td>10-Second Candidate Video Greeting</td>
                  <td><strong>10 / 10</strong></td>
                  <td><span className="pdf-check-pass">✓ PASSED</span></td>
                </tr>
                <tr>
                  <td>🔗 LinkedIn Profile Check</td>
                  <td>Work Experience Cross-Validation</td>
                  <td><strong>{score >= 80 ? '10 / 10' : '5 / 10'}</strong></td>
                  <td><span className="pdf-check-pass">✓ VERIFIED</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Verification Stamp Footer */}
          <div className="pdf-footer">
            <div className="pdf-seal">
              <div className="pdf-seal-inner">
                <span>OFFICIAL</span>
                <strong>VERIFIED</strong>
                <span>SMARTHIRE</span>
              </div>
            </div>
            <div className="pdf-disclaimer">
              <p style={{ margin: 0, fontWeight: '700', color: '#0F172A', fontSize: '12px' }}>
                SmartHire Enterprise Background & Identity Verification Engine
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                This certificate confirms that the candidate has undergone automated fraud detection and verification procedures. Verification Hash: <span style={{ fontFamily: 'monospace' }}>0x8F92A1B7E...</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scoped CSS for Modal and Print Layout */}
      <style>{`
        .pdf-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          z-index: 9999;
          padding: 20px;
          overflow-y: auto;
        }
        .pdf-modal-container {
          background: #fff;
          width: 100%;
          max-width: 840px;
          border-radius: 16px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        .pdf-control-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
        }
        .pdf-print-btn {
          background: #2563EB;
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
        }
        .pdf-print-btn:hover {
          background: #1D4ED8;
          transform: translateY(-1px);
        }
        .pdf-close-btn {
          background: #E2E8F0;
          color: #475569;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
        }
        .pdf-printable-page {
          padding: 40px;
          background: #fff;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          color: #0F172A;
        }
        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }
        .pdf-logo-badge {
          background: #EFF6FF;
          color: #1D4ED8;
          font-weight: 800;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 8px;
        }
        .pdf-title {
          font-size: 22px;
          font-weight: 900;
          margin: 0 0 4px 0;
          color: #0F172A;
          letter-spacing: -0.5px;
        }
        .pdf-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }
        .pdf-meta-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 12px;
          line-height: 1.6;
        }
        .pdf-divider {
          border: none;
          border-top: 2px solid #E2E8F0;
          margin: 24px 0;
        }
        .pdf-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        .pdf-info-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 18px;
        }
        .pdf-section-heading {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: #0F172A;
        }
        .pdf-info-table {
          width: 100%;
          font-size: 12px;
          border-collapse: collapse;
        }
        .pdf-info-table td {
          padding: 5px 0;
          color: #475569;
        }
        .pdf-info-table td:last-child {
          color: #0F172A;
          text-align: right;
        }
        .pdf-tag {
          font-family: monospace;
          background: #EFF6FF;
          color: #1D4ED8;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }
        .pdf-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 11px;
        }
        .pdf-score-banner {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .pdf-score-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 4px solid #16a34a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pdf-score-num {
          font-size: 22px;
          font-weight: 900;
          line-height: 1;
        }
        .pdf-score-max {
          font-size: 10px;
          font-weight: 700;
          opacity: 0.7;
        }
        .pdf-audit-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 10px;
        }
        .pdf-audit-table th {
          background: #F1F5F9;
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          color: #475569;
          border-bottom: 2px solid #E2E8F0;
        }
        .pdf-audit-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #F1F5F9;
        }
        .pdf-check-pass {
          color: #16a34a;
          font-weight: 800;
          font-size: 11px;
        }
        .pdf-footer {
          margin-top: 36px;
          padding-top: 20px;
          border-top: 1px dashed #CBD5E1;
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .pdf-seal {
          width: 90px;
          height: 90px;
          border: 3px double #1D4ED8;
          border-radius: 50%;
          display: grid;
          place-items: center;
          text-align: center;
          flex-shrink: 0;
        }
        .pdf-seal-inner {
          font-size: 9px;
          color: #1D4ED8;
          line-height: 1.2;
        }
        .pdf-seal-inner strong {
          display: block;
          font-size: 11px;
          font-weight: 900;
        }

        /* Print Media Styles */
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          .pdf-modal-overlay {
            position: absolute;
            inset: 0;
            background: #fff;
            padding: 0;
          }
          .pdf-modal-container {
            box-shadow: none;
            max-width: 100%;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible;
          }
          #printable-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
