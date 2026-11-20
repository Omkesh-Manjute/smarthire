import React, { useState, useMemo } from 'react';
import {
  parseJobDescriptionToAST,
  formatJobDescriptionText,
  copyJobDescriptionToClipboard
} from '../utils/formatJobDescription';

/**
 * Reusable Institutional Job Description Display Component (Milestone M1)
 * Renders structured AST with IBM Plex Sans typography, crisp hierarchy, and dual-MIME clipboard copy.
 * Strictly free of decorative emojis and unicode symbols per Rule 1 & Rule 8.
 */
export default function JobDescriptionView({
  job,
  rawDescription,
  showActions = true,
  showOverviewGrid = true,
  showSkillsCloud = true,
  onEdit,
  className = ''
}) {
  const [copyStatus, setCopyStatus] = useState(null); // 'formatted' | 'plain' | 'link' | null

  const ast = useMemo(() => {
    const raw = rawDescription || job?.description || job?.rawDescription || job?.fullDescription || '';
    return parseJobDescriptionToAST(raw, job || {});
  }, [job, rawDescription]);

  const handleCopyFormatted = async () => {
    try {
      const res = await copyJobDescriptionToClipboard(ast, job);
      if (res.success) {
        setCopyStatus('formatted');
        setTimeout(() => setCopyStatus(null), 2200);
      }
    } catch (err) {
      console.error('Failed to copy formatted JD:', err);
    }
  };

  const handleCopyPlain = async () => {
    try {
      const text = formatJobDescriptionText(ast, job);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopyStatus('plain');
        setTimeout(() => setCopyStatus(null), 2200);
      }
    } catch (err) {
      console.error('Failed to copy plain text JD:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      const jobId = job?.id || job?.reqId || ast?.meta?.reqId || '';
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://smarthireus.com';
      const link = `${origin}/jobs?jobId=${jobId}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setCopyStatus('link');
        setTimeout(() => setCopyStatus(null), 2200);
      }
    } catch (err) {
      console.error('Failed to copy candidate link:', err);
    }
  };

  return (
    <div
      className={`job-description-view ${className}`}
      style={{
        fontFamily: 'var(--font-sans)',
        fontStyle: 'normal',
        color: '#1e293b',
        lineHeight: 1.6
      }}
    >
      {/* Top Action Bar */}
      {showActions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            padding: '12px 16px',
            marginBottom: 20,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Copy Formatted JD Button */}
            <button
              type="button"
              onClick={handleCopyFormatted}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                fontStyle: 'normal',
                color: copyStatus === 'formatted' ? '#15803d' : '#1d4ed8',
                background: copyStatus === 'formatted' ? '#f0fdf4' : '#eff6ff',
                border: `1px solid ${copyStatus === 'formatted' ? '#86efac' : '#bfdbfe'}`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copyStatus === 'formatted' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied Formatted!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Copy Formatted JD</span>
                </>
              )}
            </button>

            {/* Copy Plain Text Button */}
            <button
              type="button"
              onClick={handleCopyPlain}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                fontStyle: 'normal',
                color: copyStatus === 'plain' ? '#15803d' : '#475569',
                background: copyStatus === 'plain' ? '#f0fdf4' : '#ffffff',
                border: `1px solid ${copyStatus === 'plain' ? '#86efac' : '#cbd5e1'}`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copyStatus === 'plain' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied Plain Text!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Copy Plain Text</span>
                </>
              )}
            </button>

            {/* Copy Candidate Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                fontStyle: 'normal',
                color: copyStatus === 'link' ? '#15803d' : '#047857',
                background: copyStatus === 'link' ? '#f0fdf4' : '#ecfdf5',
                border: `1px solid ${copyStatus === 'link' ? '#86efac' : '#a7f3d0'}`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copyStatus === 'link' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Copy Candidate Link</span>
                </>
              )}
            </button>
          </div>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                fontStyle: 'normal',
                color: '#1d4ed8',
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Edit Job</span>
            </button>
          )}
        </div>
      )}

      {/* Specifications / Position Overview Grid */}
      {showOverviewGrid && ast.specifications && ast.specifications.length > 0 && (
        <div
          style={{
            marginBottom: 22,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '16px 20px'
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontStyle: 'normal',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 12
            }}
          >
            Position Overview &amp; Specifications
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '12px 18px'
            }}
          >
            {ast.specifications.map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, marginTop: 2 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Badges Cloud */}
      {showSkillsCloud && (
        (ast.requiredSkills.length > 0 || (ast.preferredSkills && ast.preferredSkills.length > 0)) && (
          <div style={{ display: 'flex', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
            {ast.requiredSkills.length > 0 && (
              <div style={{ flex: '1 1 240px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, fontStyle: 'normal', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Required Skills &amp; Competencies
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ast.requiredSkills.map(s => (
                    <span
                      key={s}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        fontSize: 12,
                        fontWeight: 500,
                        fontStyle: 'normal'
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ast.preferredSkills && ast.preferredSkills.length > 0 && (
              <div style={{ flex: '1 1 240px' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, fontStyle: 'normal', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Preferred Qualifications
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ast.preferredSkills.map(s => (
                    <span
                      key={s}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: '#faf5ff',
                        color: '#7e22ce',
                        border: '1px solid #e9d5ff',
                        fontSize: 12,
                        fontWeight: 500,
                        fontStyle: 'normal'
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Main Structured Body */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '22px 24px'
        }}
      >
        {/* About the Role / Summary */}
        <section style={{ marginBottom: 24 }}>
          <h3
            style={{
              margin: '0 0 10px',
              fontSize: 15,
              fontWeight: 700,
              fontStyle: 'normal',
              color: '#0f172a',
              letterSpacing: '-0.01em'
            }}
          >
            About the Role &amp; Project Summary
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              fontWeight: 400,
              fontStyle: 'normal',
              color: '#334155',
              lineHeight: 1.7
            }}
          >
            {ast.summary}
          </p>
        </section>

        {/* Key Roles & Responsibilities */}
        {ast.responsibilities && ast.responsibilities.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: 15,
                fontWeight: 700,
                fontStyle: 'normal',
                color: '#0f172a',
                letterSpacing: '-0.01em'
              }}
            >
              Key Roles &amp; Responsibilities
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13.5,
                fontWeight: 400,
                fontStyle: 'normal',
                color: '#334155',
                lineHeight: 1.7
              }}
            >
              {ast.responsibilities.map((resp, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  {resp}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Required Technical Proficiencies */}
        {ast.requiredSkills && ast.requiredSkills.length > 0 && (
          <section style={{ marginBottom: (ast.preferredSkills && ast.preferredSkills.length > 0) ? 24 : 0 }}>
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: 15,
                fontWeight: 700,
                fontStyle: 'normal',
                color: '#0f172a',
                letterSpacing: '-0.01em'
              }}
            >
              Required Technical Proficiencies &amp; Qualifications
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13.5,
                fontWeight: 400,
                fontStyle: 'normal',
                color: '#334155',
                lineHeight: 1.7
              }}
            >
              {ast.requiredSkills.map((req, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  {req}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Preferred Qualifications */}
        {ast.preferredSkills && ast.preferredSkills.length > 0 && (
          <section>
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: 15,
                fontWeight: 700,
                fontStyle: 'normal',
                color: '#0f172a',
                letterSpacing: '-0.01em'
              }}
            >
              Preferred Qualifications &amp; Domain Expertise
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13.5,
                fontWeight: 400,
                fontStyle: 'normal',
                color: '#334155',
                lineHeight: 1.7
              }}
            >
              {ast.preferredSkills.map((pref, idx) => (
                <li key={idx} style={{ marginBottom: 8 }}>
                  {pref}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
