import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function H1b2026Article() {
  const [openFaq, setOpenFaq] = useState({})

  const toggleFaq = (index) => {
    setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ fontSize: 16.5, lineHeight: 1.8, color: '#1E293B' }}>
      {/* Legal Advisory Warning */}
      <div style={{ background: '#FEF2F2', borderLeft: '4px solid #DC2626', borderRadius: '0 10px 10px 0', padding: '16px 20px', margin: '0 0 28px' }}>
        <strong style={{ color: '#991B1B', display: 'block', marginBottom: 4, fontSize: 15 }}>
          Legal Disclaimer: Not Legal Advice
        </strong>
        <span style={{ color: '#7F1D1D', fontSize: 14.5 }}>
          US immigration policies, federal regulations, and judicial rulings evolve rapidly. This guide provides an industry staffing overview based on public reporting as of September 2026. Always confirm your specific visa case with a qualified immigration attorney and consult <a href="https://www.uscis.gov" target="_blank" rel="noopener noreferrer" style={{ color: '#DC2626', fontWeight: 600 }}>USCIS.gov</a>.
        </span>
      </div>

      <p style={{ fontSize: 18, lineHeight: 1.75, color: '#334155' }}>
        If you are an IT professional targeting the US technology market, the <strong>H-1B 2026 updates</strong> impact your career trajectory more than any individual skill set. With the transition to wage-weighted selection, legal battles surrounding proposed six-figure sponsorship fees, and shifting employer preferences, understanding your work authorization options is essential to securing high-paying direct-client contracts.
      </p>

      {/* Table of Contents */}
      <nav aria-label="Table of Contents" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
        <strong style={{ color: '#0F172A', fontSize: 15, display: 'block', marginBottom: 12, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          In this guide
        </strong>
        <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 2.1, color: '#2563EB', fontSize: 15 }}>
          <li><button onClick={() => scrollTo('quick-answer')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Quick Answer: 2026 Core Takeaways</button></li>
          <li><button onClick={() => scrollTo('timeline')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>2026 Timeline: Key Events & Milestones</button></li>
          <li><button onClick={() => scrollTo('weighted-lottery')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>The Wage-Weighted Selection System</button></li>
          <li><button onClick={() => scrollTo('fees')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>The H-1B Fee Situation: Court Rulings & Proposals</button></li>
          <li><button onClick={() => scrollTo('options-compared')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Work Authorization Options Compared (OPT, STEM, TN, L-1, EAD)</button></li>
          <li><button onClick={() => scrollTo('recruiters-check')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>What IT Recruiters Screen First</button></li>
          <li><button onClick={() => scrollTo('candidate-plan')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Strategic Action Plan for Candidates</button></li>
          <li><button onClick={() => scrollTo('employer-note')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Strategic Note for Employers</button></li>
          <li><button onClick={() => scrollTo('faq')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Frequently Asked Questions</button></li>
        </ol>
      </nav>

      {/* ── Section 1: Quick Answer ── */}
      <h2 id="quick-answer" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        1. Quick Answer: 2026 Core Takeaways
      </h2>
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '20px 24px', margin: '20px 0' }}>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: '#92400E' }}>
          <li><strong>Wage-Weighted Selection:</strong> Effective February 27, 2026, USCIS transitioned from random lottery drawings to a system that prioritizes Department of Labor (DOL) Wage Levels III and IV, significantly impacting entry-level filings.</li>
          <li><strong>$100,000 Fee Injunction:</strong> The proposed $100,000 fee on overseas petitions was vacated by a federal district court on June 8, 2026, and remains subject to ongoing federal appellate review.</li>
          <li><strong>Proposed $103,265 DHS Fee:</strong> On August 25, 2026, DHS introduced a proposed rule on cap-subject filings; public notice-and-comment periods closed late September 2026.</li>
          <li><strong>Onshore Advantage:</strong> Candidates already residing in the US under <strong>F-1 OPT or STEM OPT</strong> maintain a decisive hiring advantage because domestic Change of Status (COS) filings bypass international consular fee hurdles.</li>
        </ul>
      </div>

      {/* ── Section 2: Timeline ── */}
      <h2 id="timeline" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        2. 2026 Timeline: Key Events & Milestones
      </h2>
      <p>
        The regulatory landscape for specialized work visas shifted rapidly throughout 2026. Here is the chronological progression:
      </p>

      {/* Interactive Timeline SVG */}
      <div style={{ margin: '28px 0', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <svg viewBox="0 0 700 250" role="img" aria-label="Timeline of 2026 H-1B events: February 27, June 8, July 24, August 25, September 21, September 24" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect width="700" height="250" rx="12" fill="#FFFFFF" />
          <text x="350" y="32" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="700" fill="#0F172A">
            H-1B Regulatory Timeline — 2026
          </text>
          {/* Main timeline axis */}
          <line x1="40" y1="125" x2="660" y2="125" stroke="#2563EB" strokeWidth="3" />
          <g fontFamily="Inter, sans-serif" textAnchor="middle">
            {/* Feb 27 */}
            <circle cx="70" cy="125" r="8" fill="#2563EB" />
            <text x="70" y="98" fontSize="13" fontWeight="700" fill="#0F172A">Feb 27</text>
            <text x="70" y="156" fontSize="11.5" fontWeight="600" fill="#475569">Weighted</text>
            <text x="70" y="171" fontSize="11.5" fill="#64748B">Selection</text>

            {/* Jun 8 */}
            <circle cx="190" cy="125" r="8" fill="#2563EB" />
            <text x="190" y="98" fontSize="13" fontWeight="700" fill="#0F172A">Jun 8</text>
            <text x="190" y="156" fontSize="11.5" fontWeight="600" fill="#475569">$100K Fee</text>
            <text x="190" y="171" fontSize="11.5" fill="#64748B">Vacated</text>

            {/* Jul 24 */}
            <circle cx="310" cy="125" r="8" fill="#2563EB" />
            <text x="310" y="98" fontSize="13" fontWeight="700" fill="#0F172A">Jul 24</text>
            <text x="310" y="156" fontSize="11.5" fontWeight="600" fill="#475569">Appeals Court</text>
            <text x="310" y="171" fontSize="11.5" fill="#64748B">Denies Stay</text>

            {/* Aug 25 */}
            <circle cx="430" cy="125" r="8" fill="#FF6B00" />
            <text x="430" y="98" fontSize="13" fontWeight="700" fill="#0F172A">Aug 25</text>
            <text x="430" y="156" fontSize="11.5" fontWeight="600" fill="#475569">$103,265 Fee</text>
            <text x="430" y="171" fontSize="11.5" fill="#64748B">Proposed</text>

            {/* Sep 21 */}
            <circle cx="550" cy="125" r="8" fill="#FF6B00" />
            <text x="550" y="98" fontSize="13" fontWeight="700" fill="#0F172A">Sep 21</text>
            <text x="550" y="156" fontSize="11.5" fontWeight="600" fill="#475569">Proclamation</text>
            <text x="550" y="171" fontSize="11.5" fill="#64748B">Review</text>

            {/* Sep 24 */}
            <circle cx="640" cy="125" r="8" fill="#FF6B00" />
            <text x="640" y="98" fontSize="13" fontWeight="700" fill="#0F172A">Sep 24</text>
            <text x="640" y="156" fontSize="11.5" fontWeight="600" fill="#475569">Comments</text>
            <text x="640" y="171" fontSize="11.5" fill="#64748B">Closed</text>
          </g>
          <text x="350" y="232" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="12" fill="#64748B">
            Blue = Finalized Actions | Orange = Regulatory & Rulemaking Milestones
          </text>
        </svg>
      </div>

      {/* ── Section 3: Wage-Weighted Lottery ── */}
      <h2 id="weighted-lottery" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        3. The Wage-Weighted Selection System
      </h2>
      <p>
        For decades, the H-1B lottery operated under a random randomized selection algorithm. Under the revised framework, registrations corresponding to higher Department of Labor prevailing wage tiers (Level IV and Level III) receive preferential weighting in the cap selection pool. The standard statutory cap remains capped at <strong>85,000 visas annually</strong> (65,000 standard + 20,000 US Master's cap).
      </p>
      <p>
        <strong>Practical Impact:</strong> Senior engineers, cloud architects, and seasoned technical leads occupying Level III or IV wage levels enjoy significantly improved odds. Conversely, entry-level candidates at Level I face repeated lottery misses, making multi-year STEM OPT extensions and alternative visa pathways indispensable.
      </p>

      {/* ── Section 4: Fees ── */}
      <h2 id="fees" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        4. The H-1B Fee Situation: Court Rulings & Proposals
      </h2>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '20px 0 8px' }}>The Vacated $100,000 Proclamation Fee</h3>
      <p>
        Originally intended to deter low-cost offshore IT contracting, the $100,000 entry fee faced immediate legal challenges from industry coalitions. On June 8, 2026, a federal district court vacated the fee, and the First Circuit Court of Appeals subsequently declined to stay the vacatur. The fee is not currently collected.
      </p>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '20px 0 8px' }}>Proposed $103,265 Cap-Subject Fee</h3>
      <p>
        In late August 2026, DHS published a proposed rulemaking targeting cap-subject petitions. While subject to public commentary and potential court injunctions, employers are closely consulting immigration counsel before finalizing sponsorship budgets for upcoming lottery cycles.
      </p>

      {/* ── Section 5: Work Authorization Options Compared ── */}
      <h2 id="options-compared" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        5. Work Authorization Options Compared
      </h2>
      <p>
        Because H-1B selection is no longer guaranteed even with an employer sponsor, IT professionals rely on multiple legal frameworks:
      </p>

      {/* Comprehensive Visa Comparison Table */}
      <div style={{ overflowX: 'auto', margin: '24px 0', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, background: '#FFFFFF' }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>Status / Category</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>Target Profile</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>Primary Advantage</th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>Key Limitation</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563EB' }}>OPT (12 Months)</td>
              <td style={{ padding: '12px 14px' }}>Recent US F-1 University Graduates</td>
              <td style={{ padding: '12px 14px' }}>Immediate work authorization without employer visa sponsorship</td>
              <td style={{ padding: '12px 14px' }}>1-year duration; role must strictly relate to field of study</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563EB' }}>STEM OPT (+24 Mo.)</td>
              <td style={{ padding: '12px 14px' }}>Graduates with Qualifying STEM Degrees</td>
              <td style={{ padding: '12px 14px' }}>Provides 3 full years of total runway; enables 3 lottery cycles</td>
              <td style={{ padding: '12px 14px' }}>Requires E-Verify employer and formal Form I-983 training plan (W2)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>H-1B Specialty</td>
              <td style={{ padding: '12px 14px' }}>Specialty IT Occupation Professionals</td>
              <td style={{ padding: '12px 14px' }}>6-year renewable status with dual intent (clear Green Card path)</td>
              <td style={{ padding: '12px 14px' }}>Statutory annual cap, wage-weighted lottery, employer dependency</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>L-1A / L-1B Transfer</td>
              <td style={{ padding: '12px 14px' }}>Multinational Intracompany Transferees</td>
              <td style={{ padding: '12px 14px' }}>No lottery requirement; expedited green card route for L-1A managers</td>
              <td style={{ padding: '12px 14px' }}>Must have worked 1 full continuous year abroad with the enterprise</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>TN Status (USMCA)</td>
              <td style={{ padding: '12px 14px' }}>Citizens of Canada and Mexico</td>
              <td style={{ padding: '12px 14px' }}>Fast border processing; no annual quota or lottery</td>
              <td style={{ padding: '12px 14px' }}>Non-immigrant intent; restricted to designated professions (e.g. CSA)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#15803D' }}>EAD (H-4 / GC EAD)</td>
              <td style={{ padding: '12px 14px' }}>Eligible Spouses & I-485 Applicants</td>
              <td style={{ padding: '12px 14px' }}>Unrestricted open work permit; eligible for W2, C2C, and 1099 contracts</td>
              <td style={{ padding: '12px 14px' }}>Dependent on primary applicant's underlying status and USCIS processing</td>
            </tr>
            <tr style={{ background: '#FFFFFF' }}>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>Cap-Exempt H-1B</td>
              <td style={{ padding: '12px 14px' }}>Universities, Research Labs & Nonprofits</td>
              <td style={{ padding: '12px 14px' }}>Exempt from the 85,000 annual lottery cap; year-round filings</td>
              <td style={{ padding: '12px 14px' }}>Limited to qualifying academic, governmental, or non-profit entities</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual Infographic Banner */}
      <figure style={{ margin: '32px 0' }}>
        <img
          src="/images/blog/it-work-visa-options-usa-2026.webp"
          alt="Visual comparison chart of US IT work visa options for 2026"
          loading="lazy"
          onError={(e) => {
            const currentSrc = e.currentTarget.src || ''
            if (currentSrc.endsWith('.webp')) {
              e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
            } else if (currentSrc.endsWith('.jpg')) {
              e.currentTarget.src = currentSrc.replace(/\.jpg$/, '.webp')
            }
          }}
          style={{ width: '100%', height: 'auto', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        />
        <figcaption style={{ fontSize: 13.5, color: '#64748B', textAlign: 'center', marginTop: 10 }}>
          Overview of work authorization paths for IT professionals. Reference: DHS Study in the States.
        </figcaption>
      </figure>

      {/* ── Section 6: What Recruiters Check ── */}
      <h2 id="recruiters-check" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        6. What IT Recruiters Screen First
      </h2>
      <p>
        In the US direct-client staffing sector, recruiters verify work authorization on the very first screening conversation to determine requisition compatibility. Key screening criteria include:
      </p>
      <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li><strong>Current Visa Class & Expiration Date:</strong> Exact date remaining on your active EAD or I-94.</li>
        <li><strong>Sponsorship Expectations:</strong> Whether you require immediate petition filing or transfer (H-1B transfer) vs. future sponsorship.</li>
        <li><strong>Contract Classification:</strong> Openness to W2 vs. Corp-to-Corp (C2C). Note: F-1 STEM OPT requires W2 employment under an E-Verify employer.</li>
        <li><strong>Client Compliance Constraints:</strong> State government or healthcare contracts that restrict specific visas or require US Citizenship / Green Card status.</li>
        <li><strong>Work Modality & Location:</strong> Onsite, Hybrid, or Remote readiness.</li>
      </ul>

      <div style={{ background: '#EFF6FF', borderLeft: '4px solid #2563EB', borderRadius: '0 10px 10px 0', padding: '16px 20px', margin: '24px 0' }}>
        <strong style={{ color: '#1E40AF', display: 'block', marginBottom: 4, fontSize: 15 }}>Candidate Pro Tip</strong>
        <span style={{ color: '#1E3A8A', fontSize: 15 }}>
          Stating your exact work authorization and remaining runway (e.g. <em>"STEM OPT valid through August 2028, no sponsorship required for 2+ years"</em>) at the top of your resume eliminates recruiter friction and accelerates your interview pipeline.
        </span>
      </div>

      {/* ── Section 7: Action Plan ── */}
      <h2 id="candidate-plan" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        7. Strategic Action Plan for Candidates
      </h2>
      <ol style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li><strong>Audit Your Runway:</strong> Calculate precisely how many lottery cycles remain under your current OPT, STEM OPT, or L-1 status.</li>
        <li><strong>Target Higher Wage-Level Roles:</strong> Transition into specialized cloud architecture, AI engineering, or DevSecOps where prevailing wages naturally align with Levels III and IV.</li>
        <li><strong>Ensure Employer E-Verify Compliance:</strong> Confirm that your staffing agency or prime vendor is active in E-Verify before accepting contract offers.</li>
        <li><strong>Prepare Contingency Options:</strong> Explore cap-exempt institutions, L-1 lateral internal transfers, or Canadian Express Entry as strategic backups.</li>
        <li><strong>Maintain Meticulous Documentation:</strong> Keep all Form I-20s, I-94 records, EAD cards, W-2s, and client endorsement letters organized in digital form.</li>
      </ol>

      {/* ── Section 8: Note for Employers ── */}
      <h2 id="employer-note" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        8. Strategic Note for Employers
      </h2>
      <p>
        Engaging talent already authorized within the US — particularly candidates on STEM OPT or independent EADs — remains the most reliable and cost-effective strategy in 2026. Structuring roles around prevailing wage tiers ensures predictable immigration compliance and minimizes disruptions to key delivery timelines.
      </p>

      {/* Call to Action Card */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', borderRadius: 14, padding: '32px 28px', margin: '40px 0', textAlign: 'center', color: '#FFFFFF' }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#FFFFFF' }}>
          Find Roles Matching Your Work Authorization
        </h3>
        <p style={{ color: '#94A3B8', fontSize: 15.5, margin: '0 0 20px', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
          Explore direct-client IT contracts welcoming OPT, STEM OPT, H-1B transfers, GC EAD, and Citizens. State, Healthcare & Enterprise accounts.
        </p>
        <Link
          to="/jobs"
          style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FF6B00, #FFA040)', color: '#FFFFFF', fontWeight: 800, padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 15 }}
        >
          View Verified IT Openings
        </Link>
      </div>

      {/* ── Section 9: FAQ ── */}
      <h2 id="faq" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        9. Frequently Asked Questions
      </h2>

      {[
        {
          q: "Is the H-1B lottery random in 2026?",
          a: "No. Since February 27, 2026, USCIS prioritizes registrations at higher prevailing wage levels (Wage Levels III and IV), giving experienced professionals and higher-compensated roles significantly greater weight than entry-level Level I positions."
        },
        {
          q: "Do F-1 OPT / STEM OPT students have to pay the $100,000 fee?",
          a: "No. The proposed $100,000 fee was specifically targeted at offshore visa petitions rather than domestic Change of Status filings. Furthermore, a federal court vacated the fee on June 8, 2026, and it is not currently collected."
        },
        {
          q: "How long can STEM graduates work on OPT?",
          a: "Eligible STEM degree holders receive 12 months of initial post-completion OPT plus a 24-month STEM extension, providing a total of 36 months (3 years) of US work authorization."
        },
        {
          q: "Can I do Corp-to-Corp (C2C) contracting on STEM OPT?",
          a: "Generally no. STEM OPT regulations require a formal Form I-983 training plan and direct bona fide employer-employee supervision, which necessitates W2 employment under an E-Verify compliant employer."
        },
        {
          q: "What are the best alternatives if not selected in the H-1B lottery?",
          a: "Leading alternatives include continuing on STEM OPT (up to 3 lottery attempts), transferring through a multinational entity via L-1, utilizing TN status for Canadian or Mexican citizens, or securing roles with cap-exempt research universities or medical centers."
        }
      ].map((item, idx) => (
        <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, margin: '12px 0', overflow: 'hidden' }}>
          <button
            onClick={() => toggleFaq(idx)}
            style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
          >
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{item.q}</span>
            <span style={{ fontSize: 18, color: '#64748B', marginLeft: 12 }}>{openFaq[idx] ? '−' : '+'}</span>
          </button>
          {openFaq[idx] && (
            <div style={{ padding: '0 20px 18px', fontSize: 15, color: '#475569', lineHeight: 1.7, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              {item.a}
            </div>
          )}
        </div>
      ))}

      {/* Sources note */}
      <div style={{ marginTop: 36, padding: '16px 20px', background: '#F8FAFC', borderRadius: 8, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
        <strong>Sources:</strong> USCIS Policy Manual & Specialty Occupations Guidelines; US Department of Homeland Security (DHS) Study in the States; Federal District Court of Massachusetts Vacatur Order; Department of Labor Prevailing Wage Determinations. Status reflect published legal notices as of September 2026.
      </div>
    </div>
  )
}
