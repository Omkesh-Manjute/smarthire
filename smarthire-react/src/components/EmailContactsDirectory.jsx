import React, { useState, useEffect, useMemo } from 'react';

export default function EmailContactsDirectory() {
  const [contacts, setContacts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [corporateCount, setCorporateCount] = useState(0);
  const [personalCount, setPersonalCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [accountEmail, setAccountEmail] = useState('omkesh@coolsofttech.com');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('corporate'); // 'corporate' | 'all' | 'personal'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState(new Set());

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

  // Fetch contacts on mount
  useEffect(() => {
    fetchContacts();
    fetchJobs();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contacts/extracted');
      const data = await res.json();
      if (data && data.success) {
        setContacts(data.contacts || []);
        setTotalCount(data.total || 0);
        setCorporateCount(data.corporateCount || 0);
        setPersonalCount(data.personalCount || 0);
        setUpdatedAt(data.updatedAt);
        if (data.account) setAccountEmail(data.account);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
      showToast('Could not load contacts. Please verify server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const jobList = Array.isArray(data) ? data : (data.jobs || []);
      setAvailableJobs(jobList.slice(0, 30));
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
        setContacts(data.contacts || []);
        setTotalCount(data.total || 0);
        setCorporateCount(data.corporateCount || 0);
        setPersonalCount(data.personalCount || 0);
        setUpdatedAt(data.updatedAt);
        showToast(`Sync complete! ${data.total} contacts loaded (${data.corporateCount} corporate).`);
      } else {
        showToast(`Sync failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (err) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (activeFilter === 'corporate') {
      list = list.filter(c => c.type === 'Corporate');
    } else if (activeFilter === 'personal') {
      list = list.filter(c => c.type !== 'Corporate');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.domain && c.domain.toLowerCase().includes(q))
      );
    }
    return list;
  }, [contacts, activeFilter, searchQuery]);

  // Pagination calculations
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredContacts.length / Number(pageSize)) || 1;
  const paginatedContacts = useMemo(() => {
    if (pageSize === 'all') return filteredContacts;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredContacts.slice(start, start + size);
  }, [filteredContacts, currentPage, pageSize]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, pageSize]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allEmails = new Set(paginatedContacts.map(c => c.email));
      setSelectedEmails(allEmails);
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleToggleSelect = (email) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  // 1-Click Copy All Emails
  const handleCopyAllEmails = () => {
    const targetList = selectedEmails.size > 0
      ? filteredContacts.filter(c => selectedEmails.has(c.email))
      : filteredContacts;

    if (targetList.length === 0) {
      showToast('No emails available to copy.');
      return;
    }

    const emailStrings = targetList.map(c => c.email).join(', ');
    navigator.clipboard.writeText(emailStrings).then(() => {
      showToast(`Copied ${targetList.length} emails to clipboard (comma-separated)!`);
    }).catch(() => {
      showToast('Could not copy to clipboard. Permission denied.');
    });
  };

  // 1-Click Copy for Excel (TSV)
  const handleCopyForExcel = () => {
    const targetList = selectedEmails.size > 0
      ? filteredContacts.filter(c => selectedEmails.has(c.email))
      : filteredContacts;

    if (targetList.length === 0) {
      showToast('No data available to copy.');
      return;
    }

    const header = ['Sl. No', 'Company Name', 'Contact Name', 'Email Address', 'Domain', 'Type', 'Emails Exchanged', 'Last Interaction Date'].join('\t');
    const rows = targetList.map((c, idx) => [
      idx + 1,
      c.company || 'Direct',
      c.name || '',
      c.email,
      c.domain || '',
      c.type || 'Corporate',
      c.interactionCount || 1,
      c.lastDate ? new Date(c.lastDate).toLocaleDateString() : ''
    ].join('\t'));

    const tsvData = [header, ...rows].join('\n');
    navigator.clipboard.writeText(tsvData).then(() => {
      showToast(`Copied ${targetList.length} rows for Excel/Sheets with columns!`);
    }).catch(() => {
      showToast('Clipboard access denied.');
    });
  };

  // Export CSV
  const handleExportCsv = () => {
    const targetList = selectedEmails.size > 0
      ? filteredContacts.filter(c => selectedEmails.has(c.email))
      : filteredContacts;

    if (targetList.length === 0) {
      showToast('No data to export.');
      return;
    }

    const header = 'Sl. No,Company Name,Contact Name,Email Address,Domain,Type,Emails Exchanged,Last Interaction Date\n';
    const rows = targetList.map((c, idx) => {
      const comp = `"${(c.company || '').replace(/"/g, '""')}"`;
      const name = `"${(c.name || '').replace(/"/g, '""')}"`;
      const email = `"${c.email}"`;
      const dom = `"${c.domain || ''}"`;
      const typ = `"${c.type || ''}"`;
      const count = c.interactionCount || 1;
      const date = `"${c.lastDate ? new Date(c.lastDate).toLocaleDateString() : ''}"`;
      return `${idx + 1},${comp},${name},${email},${dom},${typ},${count},${date}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `company_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded CSV with ${targetList.length} contacts!`);
  };

  // Copy single email
  const handleCopySingleEmail = (email) => {
    navigator.clipboard.writeText(email);
    showToast(`Copied ${email}`);
  };

  // Open Send JD Modal
  const handleOpenSendJd = (singleContact = null) => {
    let recipients = [];
    if (singleContact) {
      recipients = [singleContact];
    } else if (selectedEmails.size > 0) {
      recipients = filteredContacts.filter(c => selectedEmails.has(c.email));
    } else {
      recipients = filteredContacts.slice(0, 100); // Default to first 100 to avoid accidental blast
    }

    setTargetRecipients(recipients);
    setSendResult(null);

    // Default template
    const defaultJob = availableJobs[0];
    if (defaultJob) {
      setSelectedJobId(defaultJob.id || defaultJob._id || '');
      setJdSubject(`Immediate Requirement: ${defaultJob.title || 'Senior Software Engineer'} - Looking for Candidates`);
      setJdBody(`Hi {{contact_name}},\n\nHope you are doing well.\n\nWe have an urgent client opening for ${defaultJob.title || 'Senior IT Consultant'}.\n\nLocation: ${defaultJob.location || 'Remote / US'}\nRate/Salary: ${defaultJob.rate || defaultJob.salary || 'Competitive / Open'}\nKey Skills: ${defaultJob.skills || 'Relevant experience'}\n\nPlease let us know if you or your firm ({{company_name}}) have qualified profiles ready for submittal.\n\nLooking forward to working together.`);
    } else {
      setJdSubject('Immediate Requirement - Looking for Qualified Candidates');
      setJdBody('Hi {{contact_name}},\n\nWe have an immediate client requirement open for submittals.\n\nPlease share updated resumes and available candidate details at your earliest convenience.\n\nThank you.');
    }

    setIsJdModalOpen(true);
  };

  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
    const job = availableJobs.find(j => (j.id || j._id) === jobId);
    if (job) {
      setJdSubject(`Immediate Requirement: ${job.title} - Looking for Candidates`);
      setJdBody(`Hi {{contact_name}},\n\nHope you are doing well.\n\nWe have an urgent opening for ${job.title}.\n\nLocation: ${job.location || 'Remote / US'}\nDuration / Type: ${job.type || 'Full-time / Contract'}\nKey Skills: ${job.skills || 'Technical Expertise'}\n\nPlease share candidate profiles with rate and contact details.\n\nLooking forward to your response.`);
    }
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

    const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user');
    let userObj = null;
    try { userObj = JSON.parse(userStr); } catch (_) {}
    const recruiterEmail = userObj?.email || accountEmail || 'omkesh@coolsofttech.com';
    const recruiterName = userObj?.name || 'Omkesh Manjute';

    try {
      const res = await fetch('/api/contacts/batch-send-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: targetRecipients.map(r => ({
            email: r.email,
            name: r.name,
            company: r.company
          })),
          subject: jdSubject,
          body: jdBody,
          recruiterEmail,
          recruiterName,
          jobId: selectedJobId,
          jobTitle: availableJobs.find(j => (j.id || j._id) === selectedJobId)?.title || ''
        })
      });

      const data = await res.json();
      if (data && data.success) {
        setSendResult({
          success: true,
          sentCount: data.sentCount,
          failedCount: data.failedCount,
          total: data.total
        });
        showToast(`Sent Job Description to ${data.sentCount} recipients!`);
      } else {
        setSendResult({
          success: false,
          message: data?.message || 'Failed to dispatch emails'
        });
      }
    } catch (err) {
      setSendResult({ success: false, message: err.message });
    } finally {
      setIsSendingJd(false);
    }
  };

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
            Deduplicated corporate vendor, client, and recruiter contacts harvested from {accountEmail}
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
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Corporate Companies & Vendors</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0284C7', marginTop: '6px' }}>
            {corporateCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Direct enterprise & agency domains</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Unique Contacts</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
            {totalCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Zero duplicates across 10,000+ emails</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Direct Candidates & Individuals</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#475569', marginTop: '6px' }}>
            {personalCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>Individual applicants & consultant inboxes</div>
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
        {/* Left: Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveFilter('corporate')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: activeFilter === 'corporate' ? '1px solid #0284C7' : '1px solid #CBD5E1',
              backgroundColor: activeFilter === 'corporate' ? '#EFF6FF' : '#FFFFFF',
              color: activeFilter === 'corporate' ? '#0284C7' : '#475569',
              cursor: 'pointer'
            }}
          >
            Corporate Vendors ({corporateCount})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: activeFilter === 'all' ? '1px solid #0284C7' : '1px solid #CBD5E1',
              backgroundColor: activeFilter === 'all' ? '#EFF6FF' : '#FFFFFF',
              color: activeFilter === 'all' ? '#0284C7' : '#475569',
              cursor: 'pointer'
            }}
          >
            All Contacts ({totalCount})
          </button>
          <button
            onClick={() => setActiveFilter('personal')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              border: activeFilter === 'personal' ? '1px solid #0284C7' : '1px solid #CBD5E1',
              backgroundColor: activeFilter === 'personal' ? '#EFF6FF' : '#FFFFFF',
              color: activeFilter === 'personal' ? '#0284C7' : '#475569',
              cursor: 'pointer'
            }}
          >
            Direct / Personal ({personalCount})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '240px', maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Search by company, name, email, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
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
          {selectedEmails.size > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284C7', marginRight: '4px' }}>
              {selectedEmails.size} Selected
            </span>
          )}

          {/* 1-Click Copy All Emails */}
          <button
            onClick={handleCopyAllEmails}
            title="Copy all recipient email addresses (comma-separated)"
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
            title="Send Job Description to selected contacts"
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
            Send JD {selectedEmails.size > 0 ? `(${selectedEmails.size})` : ''}
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
            Loading extracted contacts...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
            No matching contacts found.
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
                      checked={paginatedContacts.length > 0 && paginatedContacts.every(c => selectedEmails.has(c.email))}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ width: '60px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    #
                  </th>
                  <th style={{ padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    COMPANY / VENDOR
                  </th>
                  <th style={{ padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    CONTACT / RECRUITER NAME
                  </th>
                  <th style={{ padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    EMAIL ADDRESS
                  </th>
                  <th style={{ width: '110px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    TYPE
                  </th>
                  <th style={{ width: '130px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    EMAILS SEEN
                  </th>
                  <th style={{ width: '130px', padding: '10px 14px', color: '#334155', fontWeight: 700, borderRight: '1px solid #CBD5E1' }}>
                    LAST CONTACT
                  </th>
                  <th style={{ width: '110px', padding: '10px 14px', color: '#334155', fontWeight: 700, textAlign: 'center' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedContacts.map((c, idx) => {
                  const absoluteIndex = pageSize === 'all' ? idx + 1 : (currentPage - 1) * Number(pageSize) + idx + 1;
                  const isSelected = selectedEmails.has(c.email);
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={c.email}
                      style={{
                        backgroundColor: isSelected ? '#EFF6FF' : (isEven ? '#FFFFFF' : '#F8FAFC'),
                        borderBottom: '1px solid #CBD5E1',
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
                          onChange={() => handleToggleSelect(c.email)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '8px 14px', color: '#64748B', fontWeight: 500, borderRight: '1px solid #CBD5E1' }}>
                        {absoluteIndex}
                      </td>
                      <td style={{ padding: '8px 14px', fontWeight: 600, color: '#0F172A', borderRight: '1px solid #CBD5E1' }}>
                        {c.company || 'Direct'}
                        {c.domain && c.type === 'Corporate' && (
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400, marginLeft: '6px' }}>
                            ({c.domain})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 14px', color: '#334155', fontWeight: 500, borderRight: '1px solid #CBD5E1' }}>
                        {c.name || '—'}
                      </td>
                      <td style={{ padding: '8px 14px', borderRight: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ color: '#0284C7', fontWeight: 500 }}>
                            {c.email}
                          </span>
                          <button
                            onClick={() => handleCopySingleEmail(c.email)}
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
                      <td style={{ padding: '8px 14px', borderRight: '1px solid #CBD5E1' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: c.type === 'Corporate' ? '#E0F2FE' : '#F1F5F9',
                          color: c.type === 'Corporate' ? '#0369A1' : '#475569'
                        }}>
                          {c.type === 'Corporate' ? 'Corporate' : 'Direct'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 14px', color: '#475569', borderRight: '1px solid #CBD5E1' }}>
                        {c.interactionCount || 1} emails
                      </td>
                      <td style={{ padding: '8px 14px', color: '#64748B', fontSize: '12px', borderRight: '1px solid #CBD5E1' }}>
                        {c.lastDate ? new Date(c.lastDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenSendJd(c)}
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
            Showing {filteredContacts.length > 0 ? (currentPage - 1) * (pageSize === 'all' ? filteredContacts.length : Number(pageSize)) + 1 : 0} to {pageSize === 'all' ? filteredContacts.length : Math.min(currentPage * Number(pageSize), filteredContacts.length)} of {filteredContacts.length} contacts
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
            maxWidth: '680px',
            maxHeight: '90vh',
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
                  Sending to {targetRecipients.length} vendor/recruiter contacts from {accountEmail}
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
                  <option value="">-- Choose active job to auto-fill details --</option>
                  {availableJobs.map(j => (
                    <option key={j.id || j._id} value={j.id || j._id}>
                      {j.title} ({j.location || 'Remote'}) - {j.client || 'Client Req'}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Email Message Body:
                </label>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Tokens: {"{{contact_name}}"}, {"{{company_name}}"}, {"{{job_title}}"}
                </span>
              </div>
              <textarea
                rows={8}
                value={jdBody}
                onChange={(e) => setJdBody(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Send Result Banner */}
            {sendResult && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                backgroundColor: sendResult.success ? '#F0FDF4' : '#FEF2F2',
                color: sendResult.success ? '#166534' : '#991B1B',
                border: `1px solid ${sendResult.success ? '#BBF7D0' : '#FECACA'}`
              }}>
                {sendResult.success ? (
                  <span>
                    Successfully dispatched Job Description to {sendResult.sentCount} out of {sendResult.total} contacts!
                  </span>
                ) : (
                  <span>Dispatch error: {sendResult.message}</span>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setIsJdModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
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
                {isSendingJd ? 'Dispatching Emails...' : `Send to ${targetRecipients.length} Recipient${targetRecipients.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
