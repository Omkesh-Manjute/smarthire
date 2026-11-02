import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatJobDescription } from '../utils/formatJobDescription';

export default function EmailContactsDirectory() {
  const [companies, setCompanies] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalRecruiters, setTotalRecruiters] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [accountEmail, setAccountEmail] = useState('omkesh@coolsofttech.com');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Search & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
  const [expandedCompanyIds, setExpandedCompanyIds] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState(null);

  // Send JD Modal State
  const [isJdModalOpen, setIsJdModalOpen] = useState(false);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jdSubject, setJdSubject] = useState('');
  const [jdBody, setJdBody] = useState('');
  const [isSendingJd, setIsSendingJd] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [targetRecipients, setTargetRecipients] = useState([]);
  const [sendProgress, setSendProgress] = useState({
    current: 0,
    total: 0,
    sentCount: 0,
    failedCount: 0,
    activeEmail: '',
    activeName: '',
    activeCompany: '',
    errors: []
  });
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const cancelSendingRef = useRef(false);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
    fetchJobs();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contacts/extracted');
      const data = await res.json();
      if (data && data.success) {
        setCompanies(data.companies || []);
        setTotalCompanies(data.totalCompanies || 0);
        setTotalRecruiters(data.totalRecruiters || 0);
        setUpdatedAt(data.updatedAt);
        if (data.account) setAccountEmail(data.account);
      }
    } catch (err) {
      console.error('Failed to load company directory:', err);
      showToast('Could not load company directory. Please verify server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const jobList = Array.isArray(data) ? data : (data.jobs || []);
      const validJobs = jobList.filter(j => j && j.title && (!j.status || j.status.toLowerCase() === 'active' || j.status.toLowerCase() === 'open'));
      setAvailableJobs(validJobs.length > 0 ? validJobs : jobList);
    } catch (err) {
      console.warn('Failed to load jobs for JD modal:', err);
    }
  };

  const handleSyncEmails = async () => {
    setIsSyncing(true);
    showToast('Scanning Yahoo IMAP for latest emails. This takes about 30 seconds...');
    try {
      const res = await fetch('/api/contacts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail })
      });
      const data = await res.json();
      if (data && data.success) {
        await fetchCompanies();
        showToast('Sync complete! Updated company directory loaded.');
      } else {
        showToast(`Sync failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (err) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase().trim();
    return companies.filter(c =>
      c.company.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q) ||
      c.recruiters.some(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
      )
    );
  }, [companies, searchQuery]);

  // Companies with multiple recruiters
  const multiRecruiterCount = useMemo(() => {
    return companies.filter(c => c.recruiters.length > 1).length;
  }, [companies]);

  // Pagination calculations
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredCompanies.length / Number(pageSize)) || 1;
  const paginatedCompanies = useMemo(() => {
    if (pageSize === 'all') return filteredCompanies;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredCompanies.slice(start, start + size);
  }, [filteredCompanies, currentPage, pageSize]);

  // Reset page when search or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Toggle company accordion dropdown
  const handleToggleExpand = (companyId) => {
    setExpandedCompanyIds(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedCompanies.map(c => c.id));
      setSelectedCompanyIds(allIds);
    } else {
      setSelectedCompanyIds(new Set());
    }
  };

  const handleToggleSelectCompany = (companyId) => {
    setSelectedCompanyIds(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  // 1-Click Copy All Emails
  const handleCopyAllEmails = () => {
    const targetCompanies = selectedCompanyIds.size > 0
      ? filteredCompanies.filter(c => selectedCompanyIds.has(c.id))
      : filteredCompanies;

    if (targetCompanies.length === 0) {
      showToast('No company contacts available to copy.');
      return;
    }

    const emailSet = new Set();
    targetCompanies.forEach(c => {
      c.recruiters.forEach(r => {
        if (r.email) emailSet.add(r.email.toLowerCase().trim());
      });
    });

    const emailStrings = Array.from(emailSet).join(', ');
    navigator.clipboard.writeText(emailStrings).then(() => {
      showToast(`Copied ${emailSet.size} unique recruiter emails to clipboard!`);
    }).catch(() => {
      showToast('Could not copy to clipboard. Permission denied.');
    });
  };

  // 1-Click Copy for Excel (TSV)
  const handleCopyForExcel = () => {
    const targetCompanies = selectedCompanyIds.size > 0
      ? filteredCompanies.filter(c => selectedCompanyIds.has(c.id))
      : filteredCompanies;

    if (targetCompanies.length === 0) {
      showToast('No data available to copy.');
      return;
    }

    const header = ['Sl. No', 'Company Name', 'Domain', 'Recruiters Count', 'Recruiter Name', 'Email Address', 'Emails Seen', 'Last Contact Date'].join('\t');
    const rows = [];
    let counter = 1;

    targetCompanies.forEach(c => {
      c.recruiters.forEach(r => {
        rows.push([
          counter++,
          c.company,
          c.domain,
          c.recruiters.length,
          r.name || '',
          r.email,
          r.emailsSeen || 1,
          r.lastDate ? new Date(r.lastDate).toLocaleDateString() : ''
        ].join('\t'));
      });
    });

    const tsvData = [header, ...rows].join('\n');
    navigator.clipboard.writeText(tsvData).then(() => {
      showToast(`Copied ${rows.length} recruiter records for Excel & Sheets with columns!`);
    }).catch(() => {
      showToast('Clipboard access denied.');
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    const targetCompanies = selectedCompanyIds.size > 0
      ? filteredCompanies.filter(c => selectedCompanyIds.has(c.id))
      : filteredCompanies;

    if (targetCompanies.length === 0) {
      showToast('No data to export.');
      return;
    }

    const header = 'Sl. No,Company Name,Domain,Recruiters Count,Recruiter Name,Email Address,Emails Seen,Last Contact Date\n';
    let counter = 1;
    const rows = [];

    targetCompanies.forEach(c => {
      c.recruiters.forEach(r => {
        const comp = `"${(c.company || '').replace(/"/g, '""')}"`;
        const dom = `"${c.domain || ''}"`;
        const count = c.recruiters.length;
        const name = `"${(r.name || '').replace(/"/g, '""')}"`;
        const email = `"${r.email}"`;
        const seen = r.emailsSeen || 1;
        const date = `"${r.lastDate ? new Date(r.lastDate).toLocaleDateString() : ''}"`;
        rows.push(`${counter++},${comp},${dom},${count},${name},${email},${seen},${date}`);
      });
    });

    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `company_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded CSV with ${rows.length} recruiter records!`);
  };

  // Copy single email
  const handleCopySingleEmail = (email) => {
    navigator.clipboard.writeText(email);
    showToast(`Copied ${email}`);
  };

  // Open Send JD Modal
  const handleOpenSendJd = (singleRecruiter = null, companyName = '') => {
    let recipients = [];
    if (singleRecruiter) {
      recipients = [{
        email: singleRecruiter.email,
        name: singleRecruiter.name,
        company: companyName
      }];
    } else {
      const targetCompanies = selectedCompanyIds.size > 0
        ? filteredCompanies.filter(c => selectedCompanyIds.has(c.id))
        : filteredCompanies.slice(0, 50); // Default to first 50 companies

      const seen = new Set();
      targetCompanies.forEach(c => {
        c.recruiters.forEach(r => {
          if (!seen.has(r.email.toLowerCase())) {
            seen.add(r.email.toLowerCase());
            recipients.push({
              email: r.email,
              name: r.name,
              company: c.company
            });
          }
        });
      });
    }

    setTargetRecipients(recipients);
    setSendResult(null);

    // Generate full, authentic Job Description outreach template
    const defaultJob = availableJobs[0];
    if (defaultJob) {
      setSelectedJobId(defaultJob.id || defaultJob._id || '');
      const content = generateCompleteJdOutreach(defaultJob);
      setJdSubject(content.subject);
      setJdBody(content.body);
    } else {
      const content = generateCompleteJdOutreach(null);
      setJdSubject(content.subject);
      setJdBody(content.body);
    }

    setIsJdModalOpen(true);
  };

  const generateCompleteJdOutreach = (job) => {
    if (!job) {
      return {
        subject: 'Immediate Client Requirement - Looking for Qualified Candidates',
        body: `Hi {{contact_name}},\n\nHope you are doing well.\n\nWe have an immediate client requirement open for submittals.\n\nPlease share updated resumes and available candidate details with rate expectation and contact details at your earliest convenience.\n\nLooking forward to working together.`
      };
    }

    const jobTitle = job.title || 'Technical Specialist';
    const cleanReqId = String(job.reqId || job.id || '').replace(/^J-/, '').replace(/^REQ-/, '');
    const subject = `Immediate Requirement: ${jobTitle}${cleanReqId ? ` (Req #${cleanReqId})` : ''} - Looking for Candidates`;

    const rawDesc = job.description || job.fullDescription || job.rawDescription || '';
    const formattedDesc = formatJobDescription(rawDesc, job);

    const body = `Hi {{contact_name}},

Hope you are doing well.

We have an urgent opening for ${jobTitle} with our direct client. Please review the complete position details below and let us know if you or your firm ({{company_name}}) have matching candidate profiles ready for submittal:

${formattedDesc || rawDesc || 'Key Details: ' + (job.skills || 'Technical Expertise')}

===============================================================
CANDIDATE SUBMISSION DETAILS
===============================================================
If you have available candidates ready for interview & submittal, please reply directly with:
1. Updated Resume (Word / PDF format)
2. Candidate Full Legal Name & Contact Details
3. Current Location & Work Authorization / Visa Status
4. Target Hourly Bill / Pay Rate
5. Earliest Availability to Join

Looking forward to your prompt response.`;

    return { subject, body };
  };

  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
    const job = availableJobs.find(j => (j.id || j._id) === jobId);
    const content = generateCompleteJdOutreach(job);
    setJdSubject(content.subject);
    setJdBody(content.body);
  };

  const handleDispatchBatchJd = async () => {
    if (targetRecipients.length === 0) {
      showToast('No recipients selected');
      return;
    }
    if (!jdSubject.trim() || !jdBody.trim()) {
      showToast('Please enter both subject and email body');
      return;
    }

    setIsSendingJd(true);
    setSendResult(null);
    setShowErrorDetails(false);
    cancelSendingRef.current = false;

    const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user');
    let userObj = null;
    try { userObj = JSON.parse(userStr); } catch (_) {}
    const recruiterEmail = userObj?.email || accountEmail || 'omkesh@coolsofttech.com';
    const recruiterName = userObj?.name || 'Omkesh';
    const activeJobTitle = availableJobs.find(j => (j.id || j._id) === selectedJobId)?.title || '';

    const total = targetRecipients.length;
    let sentCount = 0;
    let failedCount = 0;
    const accumulatedErrors = [];

    setSendProgress({
      current: 0,
      total,
      sentCount: 0,
      failedCount: 0,
      activeEmail: '',
      activeName: '',
      activeCompany: '',
      errors: []
    });

    try {
      for (let i = 0; i < total; i++) {
        if (cancelSendingRef.current) {
          showToast(`Sending stopped at ${i} of ${total}`);
          break;
        }

        const r = targetRecipients[i];
        const toEmail = typeof r === 'string' ? r : (r.email || '');
        const toName = typeof r === 'string' ? '' : (r.name || '');
        const toCompany = typeof r === 'string' ? '' : (r.company || '');

        setSendProgress({
          current: i + 1,
          total,
          sentCount,
          failedCount,
          activeEmail: toEmail,
          activeName: toName,
          activeCompany: toCompany,
          errors: accumulatedErrors
        });

        try {
          const res = await fetch('/api/contacts/batch-send-jd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipients: [r],
              subject: jdSubject,
              body: jdBody,
              recruiterEmail,
              recruiterName,
              jobId: selectedJobId,
              jobTitle: activeJobTitle
            })
          });

          const data = await res.json();
          if (data && data.success && data.sentCount > 0) {
            sentCount++;
          } else {
            failedCount++;
            const errMsg = data?.errors?.[0]?.error || data?.message || 'Delivery failed';
            accumulatedErrors.push({ email: toEmail, name: toName, company: toCompany, error: errMsg });
          }
        } catch (itemErr) {
          failedCount++;
          accumulatedErrors.push({ email: toEmail, name: toName, company: toCompany, error: itemErr.message });
        }

        setSendProgress({
          current: i + 1,
          total,
          sentCount,
          failedCount,
          activeEmail: toEmail,
          activeName: toName,
          activeCompany: toCompany,
          errors: accumulatedErrors
        });

        // Small delay between emails (200ms) to ensure smooth UI updates and safe throttling
        if (i < total - 1 && !cancelSendingRef.current) {
          await new Promise(res => setTimeout(res, 200));
        }
      }

      const finalSuccess = sentCount > 0;
      setSendResult({
        success: finalSuccess,
        sentCount,
        failedCount,
        total,
        errors: accumulatedErrors,
        isCanceled: cancelSendingRef.current
      });

      if (sentCount === total) {
        showToast(`Sent Job Description to all ${total} recruiters!`);
      } else {
        showToast(`Dispatched to ${sentCount} of ${total} recruiters`);
      }
    } catch (err) {
      setSendResult({ success: false, message: err.message, errors: accumulatedErrors, sentCount, failedCount, total });
    } finally {
      setIsSendingJd(false);
    }
  };

  const handleCancelSending = () => {
    cancelSendingRef.current = true;
    showToast('Stopping email dispatch...');
  };

  // Role-based visibility check: Only Omkesh / SuperAdmin can access
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user');
  let userObj = null;
  try { userObj = JSON.parse(userStr); } catch (_) {}
  const isSuperAdmin = !userObj || userObj.role === 'superadmin' || userObj.role === 'admin' || userObj.email === 'omkeshmanjute@gmail.com' || userObj.email === 'omkesh@coolsofttech.com' || (userObj.email && userObj.email.includes('omkesh'));

  if (!isSuperAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A' }}>Access Restricted</div>
        <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '360px', lineHeight: 1.5 }}>
          The Company & Recruiter Directory is restricted to Super Admin only.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Company & Recruiter Directory
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
            Unique corporate companies, staffing vendors, and recruiters grouped from {accountEmail}
          </p>
        </div>

        {/* Sync Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {updatedAt && (
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Last Synced: {new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleSyncEmails}
            disabled={isSyncing}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync with Email'}
          </button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Unique Companies & Vendors
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284C7', marginTop: '6px' }}>
            {totalCompanies.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Single consolidated row per company
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Corporate Recruiters & Contacts
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
            {totalRecruiters.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Authentic enterprise & agency emails
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Multi-Recruiter Companies
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569', marginTop: '6px' }}>
            {multiRecruiterCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Expandable with 1-click recruiter dropdown
          </div>
        </div>
      </div>

      {/* Controls & Action Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '16px 20px',
        borderRadius: '8px',
        border: '1px solid #CBD5E1',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '420px' }}>
          <input
            type="text"
            placeholder="Search by company, recruiter name, email, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px',
              fontSize: '13px',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedCompanyIds.size > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284C7', marginRight: '4px' }}>
              {selectedCompanyIds.size} Companies Selected
            </span>
          )}

          {/* 1-Click Copy All Emails */}
          <button
            onClick={handleCopyAllEmails}
            title="Copy all recruiter emails (comma-separated)"
            style={{
              padding: '8px 14px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Copy All Emails
          </button>

          {/* 1-Click Copy for Excel */}
          <button
            onClick={handleCopyForExcel}
            title="Copy full table formatted for Excel & Google Sheets"
            style={{
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Copy for Excel
          </button>

          {/* Send JD Outreach */}
          <button
            onClick={() => handleOpenSendJd()}
            title="Send Job Description to selected companies"
            style={{
              padding: '8px 14px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Send JD {selectedCompanyIds.size > 0 ? `(${selectedCompanyIds.size} Co)` : ''}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            title="Download CSV spreadsheet"
            style={{
              padding: '8px 12px',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Excel-Style Tabular Grid */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #CBD5E1',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
            Loading company directory...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
            No matching companies found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                  <th style={{ width: '40px', padding: '10px 14px', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedCompanies.length > 0 && paginatedCompanies.every(c => selectedCompanyIds.has(c.id))}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ width: '50px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    #
                  </th>
                  <th style={{ minWidth: '220px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    COMPANY / VENDOR
                  </th>
                  <th style={{ width: '130px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1', textAlign: 'center' }}>
                    RECRUITERS
                  </th>
                  <th style={{ minWidth: '200px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    PRIMARY CONTACT
                  </th>
                  <th style={{ minWidth: '220px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    EMAIL ADDRESS
                  </th>
                  <th style={{ width: '110px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1', textAlign: 'center' }}>
                    EMAILS SEEN
                  </th>
                  <th style={{ width: '120px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    LAST CONTACT
                  </th>
                  <th style={{ width: '110px', padding: '10px 14px', color: '#334155', fontWeight: 700, textAlign: 'center' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((c, idx) => {
                  const absoluteIndex = pageSize === 'all' ? idx + 1 : (currentPage - 1) * Number(pageSize) + idx + 1;
                  const isSelected = selectedCompanyIds.has(c.id);
                  const isExpanded = expandedCompanyIds.has(c.id);
                  const isEven = idx % 2 === 0;
                  const primaryRecruiter = c.recruiters[0] || {};
                  const hasMultiple = c.recruiters.length > 1;

                  return (
                    <React.Fragment key={c.id}>
                      {/* Main Company Row */}
                      <tr
                        style={{
                          backgroundColor: isSelected ? '#EFF6FF' : (isEven ? '#FFFFFF' : '#F8FAFC'),
                          borderBottom: isExpanded ? '1px dashed #CBD5E1' : '1px solid #CBD5E1',
                          height: '38px',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#EFF6FF';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = isEven ? '#FFFFFF' : '#F8FAFC';
                        }}
                      >
                        <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectCompany(c.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '8px 14px', color: '#64748B', fontWeight: 500, borderRight: '1px solid #CBD5E1' }}>
                          {absoluteIndex}
                        </td>
                        <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0F172A', borderRight: '1px solid #CBD5E1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{c.company}</span>
                            {c.domain && (
                              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>
                                ({c.domain})
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Recruiters Count / Dropdown Toggle Button */}
                        <td style={{ padding: '8px 14px', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>
                          {hasMultiple ? (
                            <button
                              onClick={() => handleToggleExpand(c.id)}
                              title="Click to view all recruiters in this company"
                              style={{
                                padding: '3px 10px',
                                backgroundColor: isExpanded ? '#0284C7' : '#E0F2FE',
                                color: isExpanded ? '#FFFFFF' : '#0369A1',
                                border: '1px solid #BAE6FD',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>{c.recruiters.length} Recruiters</span>
                              <span style={{ fontSize: '10px' }}>{isExpanded ? '▲' : '▼'}</span>
                            </button>
                          ) : (
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: '#F1F5F9',
                              color: '#64748B',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              1 Recruiter
                            </span>
                          )}
                        </td>
                        {/* Primary Contact Name */}
                        <td
                          style={{
                            padding: '8px 14px',
                            color: '#334155',
                            fontWeight: 600,
                            borderRight: '1px solid #CBD5E1',
                            cursor: hasMultiple ? 'pointer' : 'default'
                          }}
                          onClick={() => { if (hasMultiple) handleToggleExpand(c.id); }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{primaryRecruiter.name || '—'}</span>
                            {hasMultiple && (
                              <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: 500 }}>
                                {isExpanded ? '(collapse)' : `(+${c.recruiters.length - 1} more)`}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Primary Contact Email */}
                        <td style={{ padding: '8px 14px', borderRight: '1px solid #CBD5E1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ color: '#0284C7', fontWeight: 500 }}>
                              {primaryRecruiter.email}
                            </span>
                            <button
                              onClick={() => handleCopySingleEmail(primaryRecruiter.email)}
                              title="Copy Email"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94A3B8',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                fontSize: '11px',
                                borderRadius: '4px'
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                        {/* Emails Seen - Strictly Number */}
                        <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: '#334155', borderRight: '1px solid #CBD5E1' }}>
                          {c.totalEmailsSeen}
                        </td>
                        {/* Last Contact Date */}
                        <td style={{ padding: '8px 14px', color: '#64748B', fontSize: '12px', borderRight: '1px solid #CBD5E1' }}>
                          {c.lastDate ? new Date(c.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        {/* Action */}
                        <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleOpenSendJd(primaryRecruiter, c.company)}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#0284C7',
                              cursor: 'pointer'
                            }}
                          >
                            Send JD
                          </button>
                        </td>
                      </tr>

                      {/* Dropdown Accordion: All Recruiters of this Company */}
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                          <td colSpan={9} style={{ padding: '12px 24px 16px 56px' }}>
                            <div style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #BAE6FD',
                              borderRadius: '6px',
                              padding: '12px 16px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                            }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#0369A1',
                                marginBottom: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                All Recruiters & Contacts at {c.company} ({c.recruiters.length}):
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                                    <th style={{ padding: '6px 10px', fontWeight: 600 }}>Recruiter Name</th>
                                    <th style={{ padding: '6px 10px', fontWeight: 600 }}>Email Address</th>
                                    <th style={{ padding: '6px 10px', fontWeight: 600, textAlign: 'center' }}>Emails Seen</th>
                                    <th style={{ padding: '6px 10px', fontWeight: 600 }}>Last Contact</th>
                                    <th style={{ padding: '6px 10px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.recruiters.map((r, rIdx) => (
                                    <tr
                                      key={r.email}
                                      style={{
                                        borderBottom: rIdx === c.recruiters.length - 1 ? 'none' : '1px solid #F1F5F9'
                                      }}
                                    >
                                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1E293B' }}>
                                        {r.name || '—'}
                                      </td>
                                      <td style={{ padding: '8px 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ color: '#0284C7', fontWeight: 500 }}>{r.email}</span>
                                          <button
                                            onClick={() => handleCopySingleEmail(r.email)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: '#94A3B8',
                                              cursor: 'pointer',
                                              fontSize: '11px',
                                              padding: '1px 4px'
                                            }}
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </td>
                                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                                        {r.emailsSeen}
                                      </td>
                                      <td style={{ padding: '8px 10px', color: '#64748B' }}>
                                        {r.lastDate ? new Date(r.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                      </td>
                                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                        <button
                                          onClick={() => handleOpenSendJd(r, c.company)}
                                          style={{
                                            padding: '3px 8px',
                                            backgroundColor: '#F0F9FF',
                                            border: '1px solid #BAE6FD',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#0284C7',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Send JD
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #CBD5E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#64748B'
        }}>
          <div>
            Showing {filteredCompanies.length > 0 ? (currentPage - 1) * (pageSize === 'all' ? filteredCompanies.length : Number(pageSize)) + 1 : 0} to {pageSize === 'all' ? filteredCompanies.length : Math.min(currentPage * Number(pageSize), filteredCompanies.length)} of {filteredCompanies.length} companies
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#334155'
                }}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="all">All</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || pageSize === 'all'}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  color: currentPage <= 1 ? '#94A3B8' : '#334155',
                  fontWeight: 600
                }}
              >
                Previous
              </button>
              <span style={{ fontWeight: 600, color: '#334155' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || pageSize === 'all'}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage >= totalPages ? '#94A3B8' : '#334155',
                  fontWeight: 600
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Send JD Modal */}
      {isJdModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '860px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Send Job Description Outreach
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', marginBottom: 0 }}>
                  Sending complete position specifications to {targetRecipients.length} corporate recruiters from {accountEmail}
                </p>
              </div>
              <button
                onClick={() => setIsJdModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#94A3B8',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            {/* Requisition Picker */}
            {availableJobs.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Select ATS Requisition / Opening (Optional):
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  <option value="">-- Choose active job to auto-fill complete details --</option>
                  {availableJobs.map(j => (
                    <option key={j.id || j._id} value={j.id || j._id}>
                      {j.title} {j.location ? `(${j.location})` : ''} {j.client ? `- ${j.client}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subject */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email Subject:
              </label>
              <input
                type="text"
                value={jdSubject}
                onChange={(e) => setJdSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Email Body */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    Complete Job Description & Message Body:
                  </label>
                  <span style={{
                    fontSize: '11px',
                    color: '#0284C7',
                    fontWeight: 600,
                    backgroundColor: '#EFF6FF',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {jdBody.length} characters (Full JD Loaded)
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Tokens: {"{{contact_name}}"}, {"{{company_name}}"}
                </span>
              </div>
              <textarea
                rows={16}
                value={jdBody}
                onChange={(e) => setJdBody(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '12.5px',
                  fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  lineHeight: '1.55',
                  boxSizing: 'border-box',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#FAFAFA',
                  color: '#1E293B'
                }}
              />
            </div>

            {/* Live Real-Time Sending Progress */}
            {isSendingJd && (
              <div style={{
                padding: '14px 16px',
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid #0284C7',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0369A1' }}>
                      Sending email {sendProgress.current} of {sendProgress.total}...
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#15803D',
                      backgroundColor: '#DCFCE7',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      Sent: {sendProgress.sentCount}
                    </span>
                    {sendProgress.failedCount > 0 && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#B91C1C',
                        backgroundColor: '#FEE2E2',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        Failed: {sendProgress.failedCount}
                      </span>
                    )}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#475569',
                      backgroundColor: '#E2E8F0',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      Remaining: {Math.max(0, sendProgress.total - sendProgress.current)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#E0F2FE',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.round(((sendProgress.current) / (sendProgress.total || 1)) * 100))}%`,
                    backgroundColor: '#0284C7',
                    borderRadius: '4px',
                    transition: 'width 0.25s ease-out'
                  }} />
                </div>

                {/* Current Recruiter Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#0C4A6E' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    <span>Currently sending to: </span>
                    <strong style={{ color: '#0369A1' }}>
                      {sendProgress.activeName ? `${sendProgress.activeName} ` : ''}
                      {sendProgress.activeCompany ? `(${sendProgress.activeCompany}) ` : ''}
                    </strong>
                    <span style={{ color: '#0284C7', textDecoration: 'underline' }}>{sendProgress.activeEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelSending}
                    style={{
                      padding: '3px 10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#DC2626',
                      cursor: 'pointer'
                    }}
                  >
                    Stop Sending
                  </button>
                </div>
              </div>
            )}

            {/* Send Result Banner */}
            {sendResult && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: sendResult.failedCount === 0 ? '#F0FDF4' : (sendResult.sentCount > 0 ? '#FFFBEB' : '#FEF2F2'),
                color: sendResult.failedCount === 0 ? '#166534' : (sendResult.sentCount > 0 ? '#B45309' : '#991B1B'),
                border: `1px solid ${sendResult.failedCount === 0 ? '#BBF7D0' : (sendResult.sentCount > 0 ? '#FDE68A' : '#FECACA')}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>
                      {sendResult.failedCount === 0
                        ? `Successfully dispatched Job Description to all ${sendResult.sentCount} recruiters!`
                        : `Dispatched Job Description to ${sendResult.sentCount} out of ${sendResult.total} recruiters (${sendResult.failedCount} failed).`}
                    </strong>
                    {sendResult.isCanceled && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#64748B' }}>(Stopped by user)</span>}
                  </div>
                  {sendResult.errors && sendResult.errors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowErrorDetails(prev => !prev)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0284C7',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'underline'
                      }}
                    >
                      {showErrorDetails ? 'Hide Error Details' : `View ${sendResult.errors.length} Failure Details`}
                    </button>
                  )}
                </div>

                {/* Expandable Failure Details List */}
                {showErrorDetails && sendResult.errors && sendResult.errors.length > 0 && (
                  <div style={{
                    marginTop: '10px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    fontSize: '12px'
                  }}>
                    {sendResult.errors.map((errItem, idx) => (
                      <div key={idx} style={{
                        padding: '4px 0',
                        borderBottom: idx < sendResult.errors.length - 1 ? '1px solid #F1F5F9' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        color: '#334155'
                      }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>{errItem.email}</span>
                        <span style={{ color: '#DC2626', fontSize: '11px' }}>{errItem.error || 'Delivery failed'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setIsJdModalOpen(false)}
                disabled={isSendingJd}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: isSendingJd ? 'not-allowed' : 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={handleDispatchBatchJd}
                disabled={isSendingJd || targetRecipients.length === 0}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#0284C7',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: isSendingJd ? 'not-allowed' : 'pointer'
                }}
              >
                {isSendingJd
                  ? `Sending (${sendProgress.current}/${sendProgress.total})...`
                  : `Send to ${targetRecipients.length} Recruiter${targetRecipients.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
