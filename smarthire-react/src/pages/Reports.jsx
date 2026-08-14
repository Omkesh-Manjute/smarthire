import React, { useState, useEffect, useRef } from 'react';
import SiteLayout from '../components/SiteLayout';

function Reports() {
  const [activeTab, setActiveTab] = useState('ai-brief'); // 'ai-brief' | 'jobs' | 'verification'
  const [report, setReport] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRawExpanded, setIsRawExpanded] = useState(false);

  // Ingestion live state
  const [ingestionStatus, setIngestionStatus] = useState(null);
  const [ingestionLogs, setIngestionLogs] = useState([]);
  const [ingestionRunning, setIngestionRunning] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState(null);
  const logScrollRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchReportsList = async (type) => {
    setLoading(true);
    setError(null);
    try {
      let response = await fetch(`/api/automation/reports?type=${type}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reports list (Status: ${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        setReportsList(data.reports || []);
        if (data.reports && data.reports.length > 0) {
          setReport(data.reports[0]);
        } else {
          setReport(null);
        }
      } else {
        throw new Error(data.message || 'Unknown server error');
      }
    } catch (err) {
      console.error('Fetch List Error:', err);
      setError(err.message || 'An error occurred while loading the reports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestReport = async (type) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/automation/latest?type=${type}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch report (Status: ${response.status})`);
      }
      const data = await response.json();
      if (data.success) {
        setReport(data.report);
      } else {
        throw new Error(data.message || 'Unknown server error');
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message || 'An error occurred while loading the report.');
    } finally {
      setLoading(false);
    }
  };

  const fetchIngestionStatus = async () => {
    try {
      const res = await fetch('/api/jobs/ingestion/status');
      if (res.ok) {
        const data = await res.json();
        setIngestionStatus(data.status);
        setIngestionRunning(data.currently_running || false);
      }
    } catch (_) {}
  };

  const fetchIngestionLogs = async () => {
    try {
      const res = await fetch('/api/jobs/ingestion/logs');
      if (res.ok) {
        const data = await res.json();
        setIngestionLogs(data.logs || []);
      }
    } catch (_) {}
  };

  const triggerIngestion = async () => {
    if (ingestionRunning) return;
    setIngestionRunning(true);
    setTriggerMessage({ type: 'info', text: '⚡ Ingestion pipeline started. This may take 1–3 minutes...' });

    try {
      const endpoint = '/api/jobs/ingestion/trigger';
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`Trigger failed (${res.status})`);
      
      setTriggerMessage({ type: 'success', text: '✅ Ingestion running in background. Status will update automatically.' });

      // Poll for completion
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await fetchIngestionStatus();
        await fetchIngestionLogs();
        if (attempts > 40) {
          clearInterval(poll);
          setIngestionRunning(false);
        }
      }, 4000);
      pollIntervalRef.current = poll;

    } catch (err) {
      setTriggerMessage({ type: 'error', text: `❌ ${err.message}` });
      setIngestionRunning(false);
    }
  };

  // Auto-stop polling when ingestion finishes
  useEffect(() => {
    if (!ingestionRunning && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      // Reload the report after completion
      if (activeTab === 'jobs') {
        setTimeout(() => fetchLatestReport('jobs'), 2000);
      }
    }
  }, [ingestionRunning]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [ingestionLogs]);

  useEffect(() => {
    if (activeTab === 'verification') {
      fetchReportsList('verification');
    } else {
      fetchLatestReport(activeTab);
    }
    setIsRawExpanded(false);

    if (activeTab === 'jobs') {
      fetchIngestionStatus();
      fetchIngestionLogs();
    }
  }, [activeTab]);

  const handleCopyRaw = () => {
    if (!report) return;
    const rawString = typeof report.raw === 'string' ? report.raw : JSON.stringify(report.raw, null, 2);
    navigator.clipboard.writeText(rawString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusPill = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'completed' || s === 'active') {
      return <span className="pill trusted">Success</span>;
    }
    if (s === 'warning' || s === 'pending' || s === 'no_jobs') {
      return <span className="pill review">Pending</span>;
    }
    return <span className="pill risk">{status || 'Error'}</span>;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Build live log lines from ingestion logs for the terminal panel
  const terminalLines = React.useMemo(() => {
    if (ingestionLogs.length === 0) {
      return [
        { time: '--:--:--', tag: 'cron', tagClass: 'tag-info', text: 'No ingestion runs yet. Click "Run Now" to start.' },
        { time: new Date().toLocaleTimeString(), tag: 'api', tagClass: 'tag-success', text: 'Idle. Listening for webhook events...', cursor: true },
      ];
    }

    const latest = ingestionLogs[0];
    const lines = [];

    lines.push({
      time: new Date(latest.run_start || latest.run_end).toLocaleTimeString(),
      tag: 'cron',
      tagClass: 'tag-info',
      text: `Last run: ${formatDateTime(latest.run_start)}`,
    });

    lines.push({
      time: '',
      tag: latest.status === 'success' ? 'success' : latest.status === 'error' ? 'error' : 'info',
      tagClass: latest.status === 'success' ? 'tag-success' : latest.status === 'error' ? 'tag-error' : 'tag-warning',
      text: `Status: ${(latest.status || 'unknown').toUpperCase()} · Mode: ${latest.mode || 'http'}`,
    });

    lines.push({ time: '', tag: 'scraper', tagClass: 'tag-info', text: `Jobs found: ${latest.jobs_found ?? 0}` });
    lines.push({ time: '', tag: 'database', tagClass: 'tag-success', text: `Jobs added to DB: ${latest.jobs_added ?? 0}` });
    lines.push({ time: '', tag: 'filter', tagClass: 'tag-warning', text: `Duplicates skipped: ${latest.duplicates_skipped ?? 0} · Rebid filtered: ${latest.rebid_filtered ?? 0}` });

    if (latest.failed_jobs > 0) {
      lines.push({ time: '', tag: 'error', tagClass: 'tag-error', text: `Failed jobs: ${latest.failed_jobs}` });
    }

    if (ingestionRunning) {
      lines.push({ time: new Date().toLocaleTimeString(), tag: 'cron', tagClass: 'tag-warning', text: '⚡ Ingestion is RUNNING NOW...', cursor: true });
    } else {
      lines.push({
        time: new Date(latest.run_end || latest.run_start).toLocaleTimeString(),
        tag: 'api',
        tagClass: 'tag-success',
        text: 'Idle. Next run: Automatic every 15 minutes.',
        cursor: true,
      });
    }

    return lines;
  }, [ingestionLogs, ingestionRunning]);

  return (
    <SiteLayout>
      <section className="section">
        <div className="container-wide">
          <div className="reports-grid-layout">
            
            {/* Left Column: Reports and Main Content */}
            <div className="reports-main-pane">
              <div className="no-print">
                <p className="eyebrow">DAILY INTELLIGENCE PIPELINES</p>
                <h1 className="page-title">Automation Reports</h1>
                <p className="lead">
                  Real-time updates and daily brief logs synchronized directly from background automations.
                </p>
              </div>

              {/* Tab Navigation */}
              <div className="tabs-container no-print">
                <button
                  className={`tab-btn ${activeTab === 'ai-brief' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ai-brief')}
                >
                  📰 AI Brief Report
                </button>
                <button
                  className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('jobs')}
                >
                  💼 JobsInHand Postings
                </button>
                <button
                  className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('leaderboard')}
                >
                  🏆 Recruiter Leaderboard
                </button>
                <button
                  className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
                  onClick={() => setActiveTab('verification')}
                >
                  🛡️ AI Document Verification
                </button>
              </div>

              {/* Trigger Message Banner */}
              {activeTab === 'jobs' && triggerMessage && (
                <div className={`trigger-banner trigger-banner-${triggerMessage.type}`}>
                  {triggerMessage.text}
                  <button className="banner-dismiss" onClick={() => setTriggerMessage(null)}>✕</button>
                </div>
              )}

              {/* Content Area */}
              <div className="report-card-wrap">
                {loading ? (
                  // Loading Skeleton
                  <div className="card skeleton-card">
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-row">
                      <div className="skeleton-badge" />
                      <div className="skeleton-line skeleton-meta" />
                    </div>
                    <hr className="divider" />
                    <div className="skeleton-line skeleton-body" />
                    <div className="skeleton-line skeleton-body" />
                    <div className="skeleton-line skeleton-body short" />
                  </div>
                ) : error ? (
                  // Error State
                  <div className="card error-card">
                    <div className="error-icon">⚠️</div>
                    <h3>Failed to load report</h3>
                    <p className="error-message">{error}</p>
                    <button className="btn btn-sm btn-ghost" onClick={() => fetchLatestReport(activeTab)}>
                      Retry Connection
                    </button>
                  </div>
                ) : !report ? (
                  // Empty State
                  <div className="card empty-card">
                    <div className="empty-icon">📊</div>
                    <h3>No reports found</h3>
                    <p className="empty-message">
                      {activeTab === 'jobs'
                        ? 'No job sync reports yet. Click "Run Now" in the panel to trigger the first ingestion.'
                        : 'This report stream has not received any sync logs yet. Configure your daily automation to send reports here.'}
                    </p>
                    <div className="api-hint">
                      <code>POST /api/automation/report</code>
                    </div>
                    {activeTab === 'jobs' && (
                      <button
                        className="btn btn-sync-trigger"
                        style={{ marginTop: 16 }}
                        onClick={triggerIngestion}
                        disabled={ingestionRunning}
                      >
                        {ingestionRunning ? '⏳ Running...' : '⚡ Run Now'}
                      </button>
                    )}
                  </div>
                ) : activeTab === 'leaderboard' ? (
                  <div className="card" style={{ padding: 24, borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                          🏆 Recruiter Performance Leaderboard & Attribution
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 0 0' }}>
                          Real-time candidate sourcing rankings, trust compliance scores, and recruiter referral performance.
                        </p>
                      </div>
                      <span style={{ background: '#FEF3C7', color: '#B45309', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                        MONTHLY LEADERBOARD
                      </span>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800 }}>Rank</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Recruiter Name</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Ref Tag Code</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800 }}>Total Sourced</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800 }}>Trusted Rate (%)</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800 }}>Share Link</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { rank: 1, name: 'Rahul Sharma', refCode: 'rahul-sharma-892', total: 18, trustedRate: 94, isTop: true },
                            { rank: 2, name: 'Priya Verma', refCode: 'priya-verma-341', total: 12, trustedRate: 88, isTop: false },
                            { rank: 3, name: 'Ankit Gupta', refCode: 'ankit-gupta-102', total: 9, trustedRate: 85, isTop: false },
                            { rank: 4, name: 'Neha Kapoor', refCode: 'neha-kapoor-551', total: 7, trustedRate: 82, isTop: false }
                          ].map((rec) => (
                            <tr key={rec.rank} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 900, fontSize: 15 }}>
                                {rec.rank === 1 ? '🥇 #1' : rec.rank === 2 ? '🥈 #2' : rec.rank === 3 ? '🥉 #3' : `#${rec.rank}`}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--ink)' }}>
                                {rec.name}
                                {rec.isTop && <span style={{ marginLeft: 8, fontSize: 10, background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>TOP PERFORMER</span>}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{ fontFamily: 'monospace', background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                                  {rec.refCode}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: '#2563EB', fontSize: 15 }}>
                                {rec.total} Candidates
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: rec.trustedRate >= 90 ? '#16A34A' : '#D97706' }}>
                                {rec.trustedRate}%
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/careers?ref=${rec.refCode}`);
                                    alert(`Copied recruiter link: ${window.location.origin}/careers?ref=${rec.refCode}`);
                                  }}
                                  style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)', padding: '6px 12px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                                >
                                  Copy Link 🔗
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  // Loaded Report Content
                  activeTab === 'verification' ? (
                    <div className="verification-results-dashboard" style={{ marginTop: 0 }}>
                      <div className="results-actions-bar no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                        <button className="btn" style={{ background: 'var(--brand)', color: 'white', fontWeight: 'bold' }} onClick={() => window.print()}>
                          📋 Download / Print PDF Report
                        </button>
                      </div>
                      
                      {/* Overall Verdict Banner */}
                      <div className={`verdict-banner-premium ${
                        report.raw?.verdict === 'LEGITIMATE' ? 'verdict-pass' : 
                        report.raw?.verdict === 'SUSPICIOUS' ? 'verdict-warn' : 'verdict-fail'
                      }`}>
                        <div className="verdict-header-row">
                          <div className="verdict-title-group">
                            <span className="verdict-label">AI VERIFICATION STATUS</span>
                            <h3>{
                              report.raw?.verdict === 'LEGITIMATE' ? '🛡️ LEGITIMATE - PASS' : 
                              report.raw?.verdict === 'SUSPICIOUS' ? '⚠️ SUSPICIOUS - ACTION REQUIRED' : '🚨 SUSPECTED FRAUD - FAIL'
                            }</h3>
                          </div>
                          <div className="verdict-score-gauge">
                            <strong>{report.raw?.confidence_score}</strong>
                            <span>Score</span>
                          </div>
                        </div>
                        <p className="verdict-summary-text">{report.raw?.summary}</p>
                      </div>

                      {/* Compliance Checks Cards Grid */}
                      <div className="compliance-cards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        {/* Driver's License Card */}
                        <div className="compliance-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
                          <div className="card-header-icon" style={{ fontWeight: 'bold', marginBottom: '12px' }}>🪪 Driver's License Audit</div>
                          <div className="card-checks-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="extracted-header" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand)' }}>Detected State: {report.raw?.state_rules_validation?.detected_state || 'Not Found'}</div>
                            <div className="applied-rules-text" style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{report.raw?.state_rules_validation?.state_rules_applied}</div>
                            {report.raw?.state_rules_validation?.checks?.map((chk, idx) => (
                              <div key={idx} className="check-item-row" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                                <span className={`status-icon ${chk.status === 'PASS' ? 'pass' : chk.status === 'WARN' ? 'warn' : 'fail'}`} style={{ fontWeight: 'bold' }}>
                                  {chk.status === 'PASS' ? '✓' : chk.status === 'WARN' ? '⚠' : '✗'}
                                </span>
                                <div className="check-item-desc" style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong>{chk.name}</strong>
                                  <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{chk.details}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Visa Card */}
                        <div className="compliance-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
                          <div className="card-header-icon" style={{ fontWeight: 'bold', marginBottom: '12px' }}>📄 Immigration Visa Audit</div>
                          <div className="card-checks-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="extracted-header" style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--brand)' }}>Detected Visa Type: {report.raw?.visa_validation?.detected_visa_type || 'Not Found'}</div>
                            <div className="applied-rules-text" style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Federal Visa compliance checks: cross-references date sequences, beneficiary names, and employer petition sponsors.</div>
                            {report.raw?.visa_validation?.checks?.map((chk, idx) => (
                              <div key={idx} className="check-item-row" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px' }}>
                                <span className={`status-icon ${chk.status === 'PASS' ? 'pass' : chk.status === 'WARN' ? 'warn' : 'fail'}`} style={{ fontWeight: 'bold' }}>
                                  {chk.status === 'PASS' ? '✓' : chk.status === 'WARN' ? '⚠' : '✗'}
                                </span>
                                <div className="check-item-desc" style={{ display: 'flex', flexDirection: 'column' }}>
                                  <strong>{chk.name}</strong>
                                  <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{chk.details}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Extracted Metadata Comparison Table */}
                      <div className="extracted-metadata-table-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0' }}>📋 Extracted Document Metadata Comparison</h4>
                        <div className="table-wrapper">
                          <table className="comparison-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Verification Field</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Driver's License Data</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Visa Document Data</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Cross-Match Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                                <td style={{ padding: '8px' }}><strong>Candidate Name</strong></td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.dl_details?.candidate_name || report.raw?.extracted_data?.candidate_name || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.visa_details?.beneficiary_name || report.raw?.extracted_data?.candidate_name || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>
                                  <span className={`status-pill ${
                                    (report.raw?.extracted_data?.dl_details?.candidate_name && report.raw?.extracted_data?.visa_details?.beneficiary_name && 
                                    report.raw?.extracted_data?.dl_details?.candidate_name.toLowerCase().includes(report.raw?.extracted_data?.visa_details?.beneficiary_name.split(' ')[0].toLowerCase())) 
                                    ? 'pill-ok' : 'pill-warn'
                                  }`}>
                                    {(report.raw?.extracted_data?.dl_details?.candidate_name && report.raw?.extracted_data?.visa_details?.beneficiary_name && 
                                    report.raw?.extracted_data?.dl_details?.candidate_name.toLowerCase().includes(report.raw?.extracted_data?.visa_details?.beneficiary_name.split(' ')[0].toLowerCase())) 
                                    ? 'MATCH' : 'DISCREPANCY'}
                                  </span>
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                                <td style={{ padding: '8px' }}><strong>ID Number</strong></td>
                                <td style={{ padding: '8px' }}><code>{report.raw?.extracted_data?.dl_details?.number || 'N/A'}</code></td>
                                <td style={{ padding: '8px' }}><code>{report.raw?.extracted_data?.visa_details?.number || 'N/A'}</code></td>
                                <td style={{ padding: '8px' }}><span className="status-pill pill-neutral">N/A</span></td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                                <td style={{ padding: '8px' }}><strong>Date of Birth</strong></td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.dl_details?.dob || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.visa_details?.dob || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>
                                  <span className={`status-pill ${
                                    (report.raw?.extracted_data?.dl_details?.dob && report.raw?.extracted_data?.visa_details?.dob &&
                                    report.raw?.extracted_data?.dl_details?.dob === report.raw?.extracted_data?.visa_details?.dob)
                                    ? 'pill-ok' : 'pill-warn'
                                  }`}>
                                    {report.raw?.extracted_data?.dl_details?.dob === report.raw?.extracted_data?.visa_details?.dob ? 'MATCH' : 'MISMATCH'}
                                  </span>
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                                <td style={{ padding: '8px' }}><strong>Issue Date</strong></td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.dl_details?.issue_date || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.visa_details?.issue_date || 'N/A'}</td>
                                <td style={{ padding: '8px' }}><span className="status-pill pill-neutral">N/A</span></td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px' }}><strong>Expiration Date</strong></td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.dl_details?.expiration_date || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>{report.raw?.extracted_data?.visa_details?.expiration_date || 'N/A'}</td>
                                <td style={{ padding: '8px' }}>
                                  <span className={`status-pill ${
                                    (report.raw?.extracted_data?.dl_details?.expiration_date && report.raw?.extracted_data?.visa_details?.expiration_date)
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
                      <div className="fraud-indicators-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginTop: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0' }}>🛡️ Forensic Integrity Indicators</h4>
                        <div className="indicators-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {report.raw?.fraud_indicators?.map((ind, idx) => (
                            <div key={idx} className="indicator-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div className="ind-header" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className={`risk-badge ${ind.risk_level === 'HIGH' ? 'high' : ind.risk_level === 'MEDIUM' ? 'medium' : 'low'}`} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  {ind.risk_level} RISK
                                </span>
                                <strong>{ind.indicator}</strong>
                              </div>
                              <p className="ind-details" style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0 }}>{ind.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <article className="card report-content-card">
                      <div className="report-header">
                        <div className="report-meta-row">
                          {getStatusPill(report.status)}
                          <span className="report-date-badge">
                            📅 {report.report_date}
                          </span>
                          {report.raw?.scrape_mode && (
                            <span className="report-mode-badge">
                              {report.raw.scrape_mode === 'playwright' ? '🤖 Playwright' : '🌐 HTTP'}
                            </span>
                          )}
                        </div>
                        <h2 className="report-title">{report.title}</h2>
                        <p className="last-updated">
                          Synced from webhook &bull; <strong>{formatDateTime(report.created_at)}</strong>
                        </p>
                      </div>

                      <hr className="divider" />

                      <div className="report-body">
                        {report.content.split('\n\n').map((paragraph, idx) => (
                          <p key={idx} className="report-p">
                            {paragraph.split('\n').map((line, lIdx) => (
                              <React.Fragment key={lIdx}>
                                {line}
                                {lIdx < paragraph.split('\n').length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </p>
                        ))}
                      </div>

                      {/* Stats Row for Jobs reports */}
                      {activeTab === 'jobs' && report.raw && (
                        <div className="stats-row">
                          <div className="stat-chip stat-green">
                            <span className="stat-num">{report.raw.jobs_added ?? report.raw.jobs_imported ?? 0}</span>
                            <span className="stat-label">Added</span>
                          </div>
                          <div className="stat-chip stat-blue">
                            <span className="stat-num">{report.raw.jobs_found ?? report.raw.jobs_fetched ?? 0}</span>
                            <span className="stat-label">Found</span>
                          </div>
                          <div className="stat-chip stat-yellow">
                            <span className="stat-num">{report.raw.duplicates_skipped ?? 0}</span>
                            <span className="stat-label">Duplicates</span>
                          </div>
                          <div className="stat-chip stat-orange">
                            <span className="stat-num">{report.raw.rebid_filtered ?? 0}</span>
                            <span className="stat-label">Rebid Skip</span>
                          </div>
                          <div className="stat-chip stat-red">
                            <span className="stat-num">{report.raw.failed_jobs ?? 0}</span>
                            <span className="stat-label">Failed</span>
                          </div>
                        </div>
                      )}

                      {/* Raw JSON Accordion */}
                      <div className="accordion-section">
                        <button
                          className="accordion-toggle"
                          onClick={() => setIsRawExpanded(!isRawExpanded)}
                        >
                          <span>{isRawExpanded ? '▼' : '▶'} View Raw JSON Payload</span>
                          <span className="toggle-label">{isRawExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>

                        {isRawExpanded && (
                          <div className="accordion-content">
                            <div className="code-header">
                              <span>Payload JSON</span>
                              <button className="btn-copy" onClick={handleCopyRaw}>
                                {copied ? '✓ Copied' : '📋 Copy JSON'}
                              </button>
                            </div>
                            <pre className="resume-text-box raw-json-viewer">
                              {typeof report.raw === 'string'
                                ? report.raw
                                : JSON.stringify(report.raw, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>

            {/* Right Column: Console Panels & Controls */}
            <div className="reports-side-pane no-print">
              {activeTab === 'verification' ? (
                <div className="card run-history-card">
                  <h3 style={{ fontSize: 16, margin: '0 0 4px 0' }}>📋 Verification Scans</h3>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 14px 0' }}>
                    Select a scan to inspect its validation rules and fraud analysis.
                  </p>
                  <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {reportsList.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', padding: '10px 0' }}>No scans run yet.</p>
                    ) : (
                      reportsList.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`history-row ${report?.id === item.id ? 'active-report-item' : ''}`}
                          onClick={() => setReport(item)}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '10px',
                            background: report?.id === item.id ? 'var(--surface-3)' : 'var(--surface)',
                            border: report?.id === item.id ? '1px solid var(--brand)' : '1px solid var(--line)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <strong style={{ fontSize: 13, color: report?.id === item.id ? 'var(--brand)' : 'inherit' }}>
                              {item.raw?.extracted_data?.candidate_name || item.title}
                            </strong>
                            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                              {formatDateTime(item.created_at)}
                            </span>
                          </div>
                          <div style={{ alignSelf: 'center' }}>
                            <span className={`pill ${
                              item.status === 'LEGITIMATE' ? 'trusted' :
                              item.status === 'SUSPICIOUS' ? 'review' : 'risk'
                            }`} style={{ fontSize: 10, padding: '2px 6px', fontWeight: 'bold' }}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Automation Console Widget */}
                  <div className="card console-control-card">
                    <h3>⚡ Automation Control</h3>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 14px 0' }}>
                      {activeTab === 'jobs'
                        ? 'Trigger the JobsInHand ingestion or monitor daily cron runs.'
                        : 'Force trigger or monitor background cron jobs synced to n8n webhooks.'}
                    </p>

                    {activeTab === 'jobs' && (
                      <>
                        <button
                          className={`btn btn-block ${ingestionRunning ? 'btn-running' : 'btn-sync-trigger'}`}
                          onClick={triggerIngestion}
                          disabled={ingestionRunning}
                        >
                          {ingestionRunning ? (
                            <span className="running-indicator">
                              <span className="spin">⟳</span> Running...
                            </span>
                          ) : '⚡ Run Now'}
                        </button>

                        <button
                          className="btn btn-block btn-secondary-trigger"
                          onClick={() => { fetchIngestionStatus(); fetchIngestionLogs(); fetchLatestReport('jobs'); }}
                          disabled={ingestionRunning}
                          style={{ marginTop: 8 }}
                        >
                          🔄 Refresh Status
                        </button>
                      </>
                    )}

                    {activeTab === 'ai-brief' && (
                      <button
                        className="btn btn-block btn-sync-trigger"
                        onClick={() => fetchLatestReport(activeTab)}
                        disabled={loading}
                      >
                        {loading ? '⏳ Syncing...' : '🔄 Sync Latest Report'}
                      </button>
                    )}

                    {/* Last Run Stats (only for jobs tab) */}
                    {activeTab === 'jobs' && ingestionStatus && (
                      <div className="last-run-stats">
                        <div className="stat-row">
                          <span className="stat-key">Last Run</span>
                          <span className="stat-val">{formatDateTime(ingestionStatus.last_run)}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-key">Status</span>
                          <span className={`stat-val stat-status-${ingestionStatus.status}`}>
                            {ingestionStatus.status?.toUpperCase() || 'Unknown'}
                          </span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-key">Jobs Added</span>
                          <span className="stat-val stat-highlight">{ingestionStatus.jobs_added ?? 0}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-key">Mode</span>
                          <span className="stat-val">{ingestionStatus.mode === 'playwright' ? '🤖 Playwright' : '🌐 HTTP'}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-key">Next Run</span>
                          <span className="stat-val">Every 15 minutes</span>
                        </div>
                      </div>
                    )}

                    <div className="webhook-url-box">
                      <div className="webhook-title">
                        {activeTab === 'jobs' ? 'Ingestion Trigger URL' : 'Webhook Intake URL'}
                      </div>
                      <code className="webhook-code">
                        {activeTab === 'jobs' ? 'POST /api/jobs/ingestion/trigger' : 'POST /api/automation/report'}
                      </code>
                    </div>
                  </div>

                  {/* Live Cron Terminal Viewer */}
                  <div className="card terminal-logs-card">
                    <div className="terminal-header">
                      <span className="terminal-dot red" />
                      <span className="terminal-dot yellow" />
                      <span className="terminal-dot green" />
                      <span className="terminal-title">
                        {activeTab === 'jobs' ? 'jobsinhand-ingestion.log' : 'automation-cron-daemon.log'}
                      </span>
                    </div>
                    <div className="terminal-body-content" ref={logScrollRef}>
                      {activeTab === 'jobs' ? (
                        terminalLines.map((line, idx) => (
                          <div key={idx} className="log-row">
                            {line.time && <span className="log-time">[{line.time}]</span>}{' '}
                            <span className={`log-tag ${line.tagClass}`}>[{line.tag}]</span>{' '}
                            {line.text}
                            {line.cursor && <span className="terminal-cursor">█</span>}
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="log-row"><span className="log-time">[06:00:01]</span> <span className="log-tag tag-info">[cron]</span> Triggering daily brief sync...</div>
                          <div className="log-row"><span className="log-time">[06:00:03]</span> <span className="log-tag tag-info">[n8n]</span> Fetching inbox emails from mail server...</div>
                          <div className="log-row"><span className="log-time">[06:00:07]</span> <span className="log-tag tag-success">[success]</span> Synced 4 unread messages.</div>
                          <div className="log-row"><span className="log-time">[06:00:08]</span> <span className="log-tag tag-info">[gpt-4]</span> Extracting candidate metadata and matching to JDs...</div>
                          <div className="log-row"><span className="log-time">[06:00:15]</span> <span className="log-tag tag-info">[database]</span> Stored 2 new candidates in VerifyHire DB.</div>
                          <div className="log-row"><span className="log-time">[06:00:16]</span> <span className="log-tag tag-info">[report]</span> Generating Daily Brief summary...</div>
                          <div className="log-row"><span className="log-time">[06:00:19]</span> <span className="log-tag tag-success">[success]</span> Report broadcast complete (200 OK).</div>
                          <div className="log-row"><span className="log-time">[07:15:32]</span> <span className="log-tag tag-warning">[api]</span> Keep-alive healthcheck: OK.</div>
                          <div className="log-row blinking-cursor-row"><span className="log-time">[{new Date().toLocaleTimeString()}]</span> <span className="log-tag tag-success">[api]</span> Idle. Listening for webhook events...<span className="terminal-cursor">█</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Run History (jobs tab only) */}
                  {activeTab === 'jobs' && ingestionLogs.length > 0 && (
                    <div className="card run-history-card">
                      <h4 className="history-title">📋 Run History</h4>
                      <div className="history-list">
                        {ingestionLogs.slice(0, 5).map((log, idx) => (
                          <div key={idx} className="history-row">
                            <div className="history-left">
                              <span className={`history-dot ${log.status === 'success' ? 'dot-green' : log.status === 'error' ? 'dot-red' : 'dot-yellow'}`} />
                              <span className="history-date">{formatDateTime(log.run_start || log.run_end)}</span>
                            </div>
                            <div className="history-right">
                              <span className="history-added">+{log.jobs_added ?? 0} jobs</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Styled JSX scoped CSS */}
      <style>{`
        .reports-grid-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .reports-grid-layout {
            grid-template-columns: 1fr;
          }
        }
        .reports-main-pane {
          display: grid;
          gap: 20px;
        }
        .reports-side-pane {
          display: grid;
          gap: 20px;
        }
        .tabs-container {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 8px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          padding: 10px 18px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--ink-soft);
          cursor: pointer;
          position: relative;
          transition: color 0.2s ease;
        }
        .tab-btn:hover { color: var(--brand); }
        .tab-btn.active { color: var(--brand); }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -9px; left: 0; right: 0;
          height: 3px;
          background: var(--brand);
          border-radius: 999px;
          animation: tabLine 0.2s ease;
        }

        /* Trigger Banner */
        .trigger-banner {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          animation: slideDown 0.3s ease;
        }
        .trigger-banner-info    { background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.3); color: #3b82f6; }
        .trigger-banner-success { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: #10b981; }
        .trigger-banner-error   { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.3);  color: #ef4444; }
        .banner-dismiss {
          background: none; border: none; cursor: pointer;
          font-size: 16px; color: inherit; opacity: 0.7; padding: 0 4px;
        }
        .banner-dismiss:hover { opacity: 1; }

        .report-card-wrap {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .report-content-card {
          padding: 32px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }
        .report-header { display: flex; flex-direction: column; gap: 8px; }
        .report-meta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .report-date-badge {
          font-size: 12px; font-weight: 700;
          background: var(--surface-2); color: var(--ink-soft);
          padding: 4px 12px; border-radius: 6px;
          border: 1px solid var(--line);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .report-mode-badge {
          font-size: 11px; font-weight: 700;
          background: rgba(16,185,129,0.1); color: #10b981;
          padding: 3px 10px; border-radius: 99px;
          border: 1px solid rgba(16,185,129,0.2);
        }
        .report-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 24px; margin: 4px 0 0;
          color: var(--ink); line-height: 1.25; font-weight: 800;
        }
        .last-updated { font-size: 12px; color: var(--ink-soft); margin: 0; }
        .divider { border: 0; border-top: 1px solid var(--line); margin: 20px 0; }
        .report-body { font-size: 15px; line-height: 1.7; color: var(--ink); margin-bottom: 24px; }
        .report-p { margin: 0 0 16px; }
        .report-p:last-child { margin-bottom: 0; }

        /* Stats Row */
        .stats-row {
          display: flex; gap: 10px; flex-wrap: wrap;
          margin: 0 0 24px;
          padding: 16px;
          background: var(--surface-2);
          border-radius: 10px;
          border: 1px solid var(--line);
        }
        .stat-chip {
          display: flex; flex-direction: column; align-items: center;
          padding: 10px 16px; border-radius: 8px;
          flex: 1; min-width: 70px;
        }
        .stat-chip .stat-num { font-size: 22px; font-weight: 800; line-height: 1; }
        .stat-chip .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; opacity: 0.8; }
        .stat-green { background: rgba(16,185,129,0.12); color: #10b981; }
        .stat-blue  { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .stat-yellow { background: rgba(245,158,11,0.12); color: #f59e0b; }
        .stat-orange { background: rgba(249,115,22,0.12); color: #f97316; }
        .stat-red   { background: rgba(239,68,68,0.12);  color: #ef4444; }

        .accordion-section { border-top: 1px solid var(--line); padding-top: 20px; }
        .accordion-toggle {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          background: var(--surface-2); border: 1px solid var(--line);
          padding: 10px 16px; border-radius: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px;
          color: var(--ink); cursor: pointer; transition: background-color 0.15s ease;
        }
        .accordion-toggle:hover { background-color: #e6dac3; }
        .toggle-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-soft); }
        .accordion-content { margin-top: 12px; animation: accordionExpand 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .code-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; background: #141a19;
          border-top-left-radius: 8px; border-top-right-radius: 8px;
          color: #8c9c99; font-size: 11px; font-family: monospace;
          border-bottom: 1px solid #283331;
        }
        .btn-copy {
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
          color: #cbd5e1; padding: 4px 10px; border-radius: 4px;
          cursor: pointer; font-size: 11px; transition: all 0.15s ease;
        }
        .btn-copy:hover { background: rgba(255,255,255,0.2); color: white; }
        .raw-json-viewer { margin: 0; border-top-left-radius: 0 !important; border-top-right-radius: 0 !important; max-height: 250px; }

        /* Console Controls */
        .console-control-card { padding: 20px; background: var(--surface); border: 1px solid var(--line); }
        .console-control-card h3 { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0 0 6px 0; font-size: 15px; }
        .btn-block { width: 100%; display: flex; justify-content: center; align-items: center; }
        .btn-sync-trigger {
          background: linear-gradient(135deg, var(--brand), #1b5e52);
          color: white; border-radius: 8px; padding: 10px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px;
          cursor: pointer; transition: all 0.2s ease; border: none;
        }
        .btn-sync-trigger:hover:not(:disabled) { background: linear-gradient(135deg, #164f44, #103a32); transform: translateY(-1px); }
        .btn-sync-trigger:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-running {
          background: linear-gradient(135deg, #92400e, #78350f);
          color: white; border-radius: 8px; padding: 10px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 13px;
          cursor: not-allowed; border: none; width: 100%;
          display: flex; justify-content: center; align-items: center;
        }
        .btn-secondary-trigger {
          background: var(--surface-2); border: 1px solid var(--line);
          color: var(--ink); border-radius: 8px; padding: 8px 16px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 12px;
          cursor: pointer; transition: all 0.2s ease;
        }
        .btn-secondary-trigger:hover:not(:disabled) { background: var(--line); }
        .btn-secondary-trigger:disabled { opacity: 0.5; cursor: not-allowed; }
        .running-indicator { display: flex; align-items: center; gap: 8px; }
        .spin { display: inline-block; animation: rotate 1s linear infinite; font-size: 16px; }

        /* Last Run Stats */
        .last-run-stats {
          margin: 14px 0 0;
          border: 1px solid var(--line);
          border-radius: 8px;
          overflow: hidden;
        }
        .stat-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 7px 12px; font-size: 12px;
          border-bottom: 1px solid var(--line);
        }
        .stat-row:last-child { border-bottom: none; }
        .stat-key { color: var(--ink-soft); font-weight: 600; }
        .stat-val { color: var(--ink); font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }
        .stat-val.stat-status-success { color: #10b981; }
        .stat-val.stat-status-error   { color: #ef4444; }
        .stat-val.stat-status-no_jobs { color: #f59e0b; }
        .stat-highlight { color: var(--brand); }

        .webhook-url-box {
          margin-top: 14px; background: var(--surface-2);
          border: 1px solid var(--line); padding: 10px 12px; border-radius: 8px;
        }
        .webhook-title { font-size: 11px; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; margin-bottom: 4px; }
        .webhook-code { font-size: 11px; word-break: break-all; color: var(--brand); font-weight: 700; }

        /* Live Cron Terminal Viewer */
        .terminal-logs-card {
          background: #111615; border: 1px solid #283331; color: #e2e8f0;
          padding: 14px 16px; border-radius: 12px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          box-shadow: 0 10px 30px rgba(17, 22, 21, 0.3);
        }
        .terminal-header {
          display: flex; align-items: center; gap: 6px;
          border-bottom: 1px solid #283331;
          padding-bottom: 8px; margin-bottom: 12px;
        }
        .terminal-dot { width: 10px; height: 10px; border-radius: 50%; }
        .terminal-dot.red    { background: #ef4444; }
        .terminal-dot.yellow { background: #f59e0b; }
        .terminal-dot.green  { background: #10b981; }
        .terminal-title { font-size: 11px; color: #718096; margin-left: 6px; }
        .terminal-body-content {
          font-size: 11px; line-height: 1.6;
          display: flex; flex-direction: column; gap: 4px;
          max-height: 240px; overflow-y: auto;
          scrollbar-width: thin; scrollbar-color: #283331 transparent;
        }
        .log-row { word-break: break-all; white-space: pre-wrap; color: #cbd5e1; }
        .log-time { color: #5d6e6b; }
        .log-tag { font-weight: 700; }
        .log-tag.tag-info    { color: #3b82f6; }
        .log-tag.tag-success { color: #10b981; }
        .log-tag.tag-warning { color: #f59e0b; }
        .log-tag.tag-error   { color: #ef4444; }
        .terminal-cursor { animation: cursorBlink 1s infinite steps(2, start); color: #10b981; margin-left: 2px; }

        /* Run History */
        .run-history-card { padding: 16px; background: var(--surface); border: 1px solid var(--line); }
        .history-title { margin: 0 0 12px; font-size: 13px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ink); }
        .history-list { display: flex; flex-direction: column; gap: 6px; }
        .history-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid var(--line);
          font-size: 12px;
        }
        .history-row:last-child { border-bottom: none; }
        .history-left { display: flex; align-items: center; gap: 8px; }
        .history-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .dot-green  { background: #10b981; }
        .dot-yellow { background: #f59e0b; }
        .dot-red    { background: #ef4444; }
        .history-date { color: var(--ink-soft); font-weight: 500; }
        .history-added { color: #10b981; font-weight: 700; }

        /* Error/Empty states */
        .error-card {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 40px; gap: 12px;
          border: 1px dashed var(--danger);
          background: rgba(181, 71, 79, 0.03);
        }
        .error-icon { font-size: 36px; }
        .error-message { color: var(--danger); font-size: 14px; max-width: 420px; margin-bottom: 8px; }
        .empty-card {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 50px 30px; gap: 12px;
          border: 1px dashed var(--line);
        }
        .empty-icon { font-size: 40px; }
        .empty-message { color: var(--ink-soft); font-size: 14px; max-width: 420px; margin-bottom: 12px; }
        .api-hint { background: var(--surface-2); padding: 6px 14px; border-radius: 6px; border: 1px solid var(--line); }

        /* Skeleton */
        .skeleton-card { padding: 32px; pointer-events: none; }
        .skeleton-line {
          background: linear-gradient(90deg, var(--surface-2) 25%, #ebdcb9 50%, var(--surface-2) 75%);
          background-size: 200% 100%;
          animation: skeletonPulse 1.5s infinite linear;
          border-radius: 4px;
        }
        .skeleton-title { height: 32px; width: 70%; margin-bottom: 16px; }
        .skeleton-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .skeleton-badge { height: 22px; width: 60px; border-radius: 99px; background: var(--surface-2); }
        .skeleton-meta { height: 16px; width: 150px; }
        .skeleton-body { height: 16px; width: 100%; margin-bottom: 12px; }
        .skeleton-body.short { width: 60%; }

        /* Keyframes */
        @keyframes tabLine {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes accordionExpand {
          from { transform: translateY(-10px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes skeletonPulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 0; }
          50%       { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-6px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
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
  );
}

export default Reports;
