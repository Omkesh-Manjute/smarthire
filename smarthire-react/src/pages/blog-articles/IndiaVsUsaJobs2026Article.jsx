import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function IndiaVsUsaJobs2026Article() {
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
      <p style={{ fontSize: 18, lineHeight: 1.75, color: '#334155' }}>
        Every Indian IT professional eventually asks the same critical question: <strong>should I build my tech career in India or move to the USA?</strong> The headline salary gap looks massive, but taxes, healthcare, rent, visa constraints, and family priorities change the financial equation completely. This in-depth guide compares <strong>India vs USA IT jobs in 2026</strong> on the factors that truly matter, helping you decide with verifiable data instead of speculation.
      </p>

      {/* Table of Contents */}
      <nav aria-label="Table of Contents" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', margin: '32px 0' }}>
        <strong style={{ color: '#0F172A', fontSize: 15, display: 'block', marginBottom: 12, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          In this guide
        </strong>
        <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 2.1, color: '#2563EB', fontSize: 15 }}>
          <li><button onClick={() => scrollTo('verdict')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Quick Verdict: At a Glance</button></li>
          <li><button onClick={() => scrollTo('salary')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Salary: The Headline Gap</button></li>
          <li><button onClick={() => scrollTo('takehome')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Take-Home Reality & Living Costs</button></li>
          <li><button onClick={() => scrollTo('table')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Side-by-Side Comparison Matrix</button></li>
          <li><button onClick={() => scrollTo('india-edge')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Where India Wins</button></li>
          <li><button onClick={() => scrollTo('usa-edge')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Where the USA Wins</button></li>
          <li><button onClick={() => scrollTo('middle')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>The Middle Path: GCCs and Remote US Contracts</button></li>
          <li><button onClick={() => scrollTo('who')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Who Should Choose What</button></li>
          <li><button onClick={() => scrollTo('faq')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 15, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Frequently Asked Questions</button></li>
        </ol>
      </nav>

      {/* ── Section 1: Quick Verdict ── */}
      <h2 id="verdict" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        1. Quick Verdict: At a Glance
      </h2>
      <div style={{ background: '#FFF7ED', borderLeft: '4px solid #FF6B00', borderRadius: '0 10px 10px 0', padding: '18px 22px', margin: '24px 0' }}>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#7C2D12', fontSize: 15.5, lineHeight: 1.9 }}>
          <li><strong>Choose the USA</strong> if you aim for maximum absolute earnings, direct exposure to premier tier-1 tech products, and possess a solid pathway for work authorization (such as STEM OPT, L-1, or H-1B).</li>
          <li><strong>Choose India</strong> if you prioritize rapid tech wealth accumulation relative to living costs, family closeness, career stability, and high-growth leadership roles in Global Capability Centers (GCCs).</li>
          <li><strong>Choose Remote US Work from India</strong> if you want dollar-linked earnings and international technical projects while keeping local living expenses.</li>
        </ul>
      </div>

      {/* ── Section 2: Salary ── */}
      <h2 id="salary" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        2. Salary: The Headline Gap
      </h2>
      <p>
        Nominal US tech compensation is significantly higher than domestic Indian packages. Benchmarking data for 2026 places the <a href="https://salaryinfo.blog/software-engineer-salary-usa-vs-india-2026/" target="_blank" rel="noopener" style={{ color: '#2563EB', textDecoration: 'underline' }}>average US software engineer base salary around $138,000</a>, compared to approximately ₹14.5 Lakhs (roughly $16,500 USD) across all experience segments in India. As detailed by <a href="https://www.scaler.com/topics/software-engineer-salary-in-us/" target="_blank" rel="noopener" style={{ color: '#2563EB', textDecoration: 'underline' }}>Scaler salary research</a>, the headline multiple can range from 5x to 15x before tax and purchasing power adjustments.
      </p>

      {/* Interactive Crisp SVG Bar Chart */}
      <div style={{ margin: '28px 0', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '24px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <svg viewBox="0 0 700 270" role="img" aria-label="Bar chart comparing average software engineer base salary: about 138,000 USD in USA versus about 16,500 USD in India in 2026" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect width="700" height="270" rx="12" fill="#FFFFFF" />
          <text x="350" y="36" textAnchor="middle" fontSize="17" fontWeight="700" fill="#0F172A" fontFamily="Inter, sans-serif">
            Average Software Engineer Base Salary (2026 Baseline, USD)
          </text>
          {/* USA Bar */}
          <rect x="170" y="65" width="130" height="145" rx="6" fill="#2563EB" />
          <text x="235" y="55" textAnchor="middle" fontSize="20" fontWeight="800" fill="#2563EB" fontFamily="Inter, sans-serif">~$138,000</text>
          <text x="235" y="235" textAnchor="middle" fontSize="15" fontWeight="600" fill="#475569" fontFamily="Inter, sans-serif">USA</text>

          {/* India Bar */}
          <rect x="400" y="192" width="130" height="18" rx="6" fill="#FF6B00" />
          <text x="465" y="182" textAnchor="middle" fontSize="20" fontWeight="800" fill="#FF6B00" fontFamily="Inter, sans-serif">~$16,500</text>
          <text x="465" y="235" textAnchor="middle" fontSize="15" fontWeight="600" fill="#475569" fontFamily="Inter, sans-serif">India</text>

          <text x="350" y="258" textAnchor="middle" fontSize="12" fill="#64748B" fontFamily="Inter, sans-serif">
            Nominal averages based on secondary market data. Taxes, rent, and cost of living significantly narrow the disposable savings spread.
          </text>
        </svg>
        <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 10 }}>
          Source: salaryinfo.blog & industry salary benchmarks (converted at 1 USD ≈ 87.8 INR).
        </div>
      </div>

      <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginTop: 28, marginBottom: 12 }}>
        The India Spectrum: Services vs Product vs GCCs
      </h3>
      <p>
        Indian tech compensation is not uniform. According to <a href="https://peorient.com/blog/average-salary-india-vs-usa/" target="_blank" rel="noopener" style={{ color: '#2563EB', textDecoration: 'underline' }}>PEOrient market studies</a>, conventional IT services firms provide software engineers with ₹8 to ₹12 Lakhs, whereas senior technical architects in product companies command ₹25 to ₹45 Lakhs.
      </p>
      <p>
        Furthermore, <a href="https://www.kaam.work/blog/software-engineer-salary-india-vs-us-vs-uk-2026-benchmarks" target="_blank" rel="noopener" style={{ color: '#2563EB', textDecoration: 'underline' }}>Kaamwork 2026 benchmarks</a> highlight that Global Capability Centers (GCCs) and venture-funded product unicorns pay <strong>40% to 60% higher</strong> than standard services firms at identical years of experience. At top tiers, domestic compensation in Bengaluru or Hyderabad matches global purchasing parity.
      </p>

      <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginTop: 28, marginBottom: 12 }}>
        Total Compensation in the USA
      </h3>
      <p>
        In the United States, base salary is only one component of total compensation. Experienced engineers frequently receive substantial annual performance incentives, sign-on packages, and equity (RSUs or stock options). The US Bureau of Labor Statistics reports an overall IT median wage of $105,990, with specialized cloud architects and machine learning practitioners routinely clearing $180,000 to $240,000.
      </p>
      <p>
        To explore active open requirements, review our companion analysis on the <Link to="/blog/us-it-recruitment-market-2026" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>US IT Recruitment Market 2026</Link>.
      </p>

      {/* ── Section 3: Take-Home Reality ── */}
      <h2 id="takehome" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        3. Take-Home Reality & Living Costs
      </h2>
      <p>
        Gross figures capture headlines, but net take-home and purchasing power dictate your financial security. Below is a structured illustration comparing typical mid-career software engineers in Bengaluru and Austin, Texas:
      </p>

      <div style={{ overflowX: 'auto', margin: '24px 0', border: '1px solid #E2E8F0', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>Financial Metric</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>India (Mid-Level, Bengaluru)</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>USA (Mid-Level, Austin, TX)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Gross Annual Salary</td>
              <td style={{ padding: '14px 18px', color: '#0F172A' }}>₹25,00,000 (~$28,500 USD)</td>
              <td style={{ padding: '14px 18px', color: '#0F172A' }}>$130,000 USD (~₹1.14 Cr)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Effective Income Tax</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>~12% - 15% (New Tax Regime)</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>~24% - 30% (Federal + FICA; 0% state in TX)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Healthcare & Insurance</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Employer group policy; out-of-pocket visits are very affordable</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Monthly plan deductibles, co-pays, and out-of-pocket limits ($3k - $8k/yr)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Housing / Rental Cost</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>₹30k - ₹50k/mo ($350 - $570/mo)</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>$1,800 - $2,600/mo for modern 1-2 BHK</td>
            </tr>
            <tr>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>Effective Net Savings Potential</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#2563EB' }}>High savings rate (35% - 50% of net pay)</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#2563EB' }}>Higher absolute dollar savings, lower savings %</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ background: '#EFF6FF', borderLeft: '4px solid #2563EB', borderRadius: '0 10px 10px 0', padding: '14px 18px', margin: '20px 0', fontSize: 14.5 }}>
        <strong>Note:</strong> Tax brackets vary based on individual exemptions, state of residence, and filing status. Always consult official calculators on the <a href="https://www.incometax.gov.in/" target="_blank" rel="noopener" style={{ color: '#2563EB', textDecoration: 'underline' }}>Income Tax Department of India</a> and IRS platforms.
      </div>

      {/* ── Section 4: Side-by-Side Comparison ── */}
      <h2 id="table" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        4. Side-by-Side Comparison Matrix
      </h2>

      <div style={{ overflowX: 'auto', margin: '24px 0', border: '1px solid #E2E8F0', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>Evaluation Dimension</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>India (2026)</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>United States (2026)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>Absolute Earnings Ceiling</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>₹50L - ₹1Cr+ for Directors & Senior Architects</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>$250,000 - $450,000+ for Staff / Principal Engineers</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>Cost of Daily Living</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Significantly lower; domestic assistance & services are accessible</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>High; childcare, dining, services, and rents require strict budgeting</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>Work Authorization & Visas</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Zero visa hurdles; completely unrestricted for citizens</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Requires legal status: OPT, STEM OPT, H-1B, L-1, or EAD (see our <Link to="/blog/h1b-2026-update-it-work-visa-options" style={{ color: '#2563EB', textDecoration: 'underline' }}>H-1B 2026 Update</Link>)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>Contract & Hiring Models</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Traditional permanent employment with 30-90 day notice periods</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>At-will employment; highly flexible contract models (learn more in <Link to="/blog/c2c-vs-w2-vs-1099" style={{ color: '#2563EB', textDecoration: 'underline' }}>C2C vs W2 vs 1099 Guide</Link>)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>Family & Support Systems</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Strong proximity to parents, family network, and cultural ties</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Geographic distance; dependent visa work authorizations require careful planning</td>
            </tr>
            <tr>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>Global Market Currency</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>INR earnings; rising purchasing power locally</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>USD earnings; world reserve currency with global investment flexibility</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Visual Infographic */}
      <div style={{ margin: '32px 0' }}>
        <img 
          src="/images/blog/india-vs-usa-it-jobs-comparison-chart.webp" 
          alt="Infographic matrix comparing IT software engineering careers in India vs USA in 2026 across salaries, taxes, and career growth"
          onError={(e) => {
            const currentSrc = e.currentTarget.src || ''
            if (currentSrc.endsWith('.webp')) {
              e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
            } else if (currentSrc.endsWith('.jpg')) {
              e.currentTarget.src = currentSrc.replace(/\.jpg$/, '.webp')
            }
          }}
          style={{ width: '100%', height: 'auto', borderRadius: 14, border: '1px solid #E2E8F0', display: 'block', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          loading="lazy"
        />
        <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 10 }}>
          India vs USA IT Careers Matrix 2026. Data synthesis by SmartHire Research.
        </div>
      </div>

      {/* ── Section 5: Where India Wins ── */}
      <h2 id="india-edge" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        5. Where India Wins
      </h2>
      <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li><strong>High Savings Rate:</strong> Due to affordable housing ratios and lower recurring service costs, engineers in Bengaluru, Hyderabad, and Pune can often save 35% to 50% of their net take-home salary.</li>
        <li><strong>Zero Immigration Anxiety:</strong> No lottery renewals, H-1B grace periods, or 60-day layoff departure clocks. You own your career progression on your own terms.</li>
        <li><strong>Family Proximity and Childcare:</strong> Close personal ties, grandparent support, and accessible domestic assistance create exceptional work-life sustainability for young families.</li>
        <li><strong>Rise of Deep-Tech Centers:</strong> Over 1,600 Global Capability Centers operate in India, designing core enterprise architecture rather than routine support tasks.</li>
      </ul>

      {/* ── Section 6: Where USA Wins ── */}
      <h2 id="usa-edge" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        6. Where the USA Wins
      </h2>
      <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li><strong>Uncapped Earnings Ceiling:</strong> Staff engineers, principal cloud architects, and engineering managers can accumulate life-changing wealth via base salaries, performance bonuses, and equity grants.</li>
        <li><strong>Global Career Capital:</strong> Direct operational experience inside Fortune 500 enterprises and Silicon Valley product teams carries universal credibility across all global markets.</li>
        <li><strong>Market Depth in Cutting-Edge Tech:</strong> Massive enterprise budgets for generative AI, defense tech, cybersecurity, and cloud migration create robust demand for certified specialists.</li>
        <li><strong>Contracting Flexibility:</strong> For professionals with authorized status (GC, EAD, Citizens), Corp-to-Corp (C2C) hourly contracting rates ($75/hr to $120/hr+) offer immense financial acceleration.</li>
      </ul>

      <div style={{ background: '#FFF7ED', borderLeft: '4px solid #FF6B00', borderRadius: '0 10px 10px 0', padding: '16px 20px', margin: '28px 0' }}>
        <strong style={{ color: '#9A3412', display: 'block', marginBottom: 4, fontSize: 15 }}>Compliance Reminder</strong>
        <span style={{ color: '#7C2D12', fontSize: 15.5 }}>
          Work authorization is the primary gatekeeper for US employment. Familiarize yourself with prevailing wage levels, specialty occupation standards, and legal filing frameworks before initiating relocation plans.
        </span>
      </div>

      {/* ── Section 7: Middle Path ── */}
      <h2 id="middle" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        7. The Middle Path: GCCs and Remote US Contracts
      </h2>
      <p>
        The career decision is no longer a binary choice between relocating to the US or staying in local IT services. Two compelling middle paths have emerged in 2026:
      </p>
      <ol style={{ paddingLeft: 22, lineHeight: 1.95 }}>
        <li>
          <strong>Global Capability Centers (GCCs):</strong> Global leaders like Goldman Sachs, Microsoft, Google, Target, and Walmart maintain flagship technology campuses in India. Engineers work on mission-critical products with global compensation tiers and clear international mobility pathways.
        </li>
        <li>
          <strong>Direct Remote US Contracts:</strong> Many US software firms and consulting agencies hire top-tier developers in India as cross-border contractors. As highlighted by <a href="https://abhs.in/blog/software-engineer-salary-2026-by-country-us-uk-india-europe-remote" target="_blank" rel="noopener" style={{ color: '#2563EB', textDecoration: 'underline' }}>Abhishek Gautam's global compensation research</a>, remote US roles frequently pay in USD at 60% to 80% of US onshore rates — translating to ₹40L to ₹80L annually inside India.
        </li>
      </ol>
      <p>
        According to <a href="https://sylphcorpsmedia.com/blog/finance/highest-paying-countries-software-engineers-2025-2026-real-salary" target="_blank" rel="noopener" style={{ color: '#2563EB', textDecoration: 'underline' }}>Sylph Corps Media analysis</a>, earning in USD while living in an INR cost base often yields the highest real savings rate achievable in modern tech.
      </p>

      {/* ── Section 8: Who Should Choose What ── */}
      <h2 id="who" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        8. Who Should Choose What: Career Personas
      </h2>

      <div style={{ overflowX: 'auto', margin: '24px 0', border: '1px solid #E2E8F0', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>Professional Profile</th>
              <th style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>Recommended 2026 Strategy</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Graduating Master's Student in the US</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Leverage 3-year STEM OPT fully. Focus on Level 2/3 wage tier roles to optimize selection odds in the wage-weighted H-1B lottery.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Mid-Career Engineer in IT Services (3-7 Years)</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Transition internally to a GCC or funded product company in India to multiply your baseline compensation before evaluating US relocation.</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Specialized Lead (Cloud, Security, AI, Data)</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Exceptional options in both geographies. Target premium direct-client US roles or negotiate dollar-denominated remote contracts.</td>
            </tr>
            <tr>
              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#334155' }}>Family-Centric / Long-Term Wealth Accumulator</td>
              <td style={{ padding: '14px 18px', color: '#475569' }}>Anchor in India with a high-paying product role or remote US contract. Enjoy local community support while compounding investments in domestic markets.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* CTA Box */}
      <div style={{ background: '#0F172A', color: '#FFFFFF', borderRadius: 14, padding: '36px 32px', margin: '44px 0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF' }}>
          Ready to Explore Direct-Client US IT Roles?
        </h3>
        <p style={{ color: '#94A3B8', fontSize: 16, maxWidth: 580, margin: '0 auto 24px' }}>
          SmartHire connects experienced IT engineers directly with verified State, Healthcare, and Enterprise requisitions. C2C, W2, and 1099 contracts supported.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/jobs" 
            style={{ display: 'inline-block', background: '#FF6B00', color: '#FFFFFF', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.2s' }}
          >
            Browse Open IT Requisitions
          </Link>
          <Link 
            to="/pricing" 
            style={{ display: 'inline-block', background: 'transparent', color: '#FFFFFF', fontWeight: 600, fontSize: 15, padding: '12px 24px', borderRadius: 10, textDecoration: 'none', border: '1px solid #334155' }}
          >
            Explore Employer Plans
          </Link>
        </div>
      </div>

      {/* ── Section 9: FAQ ── */}
      <h2 id="faq" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '40px 0 16px', letterSpacing: '-0.02em' }}>
        9. Frequently Asked Questions
      </h2>

      {[
        {
          q: "How much more do US software engineers earn compared to Indian engineers?",
          a: "On paper, US base salaries are often 5x to 15x higher at equivalent experience levels ($138,000 USD vs ₹14.5 Lakhs). However, after accounting for federal and state income taxes, healthcare premiums, and higher rent, the practical take-home multiple narrows to approximately 3x to 4x."
        },
        {
          q: "Is it better to build an IT career in India or the USA?",
          a: "The choice depends on individual priorities. The USA offers unmatched absolute earnings and global prestige but carries visa dependencies and high living expenses. India offers lower living costs, family proximity, and rapid career acceleration within Global Capability Centers (GCCs)."
        },
        {
          q: "Can Indian software engineers work remotely for US companies?",
          a: "Yes. Many US tech companies hire remote engineers in India as independent contractors or through Employer of Record (EOR) models. Pay is typically 60% to 80% of US domestic rates, which represents very high compensation within India."
        },
        {
          q: "Do Global Capability Centers (GCCs) in India pay more than IT services firms?",
          a: "Yes. Industry benchmarks show that GCCs, funded product startups, and tier-1 product firms in Bengaluru and Hyderabad routinely pay 40% to 60% higher than traditional IT services companies for the same experience level."
        },
        {
          q: "How does the H-1B visa selection process affect Indian engineers moving to the US?",
          a: "The US immigration system is transitioning toward wage-weighted selection criteria, which prioritizes Level 3 and Level 4 wage filings. Prospective candidates should carefully plan their education, STEM OPT tenure, and visa sponsorship strategy in advance."
        }
      ].map((item, idx) => {
        const isOpen = !!openFaq[idx]
        return (
          <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
            <button
              onClick={() => toggleFaq(idx)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: 16,
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              <span>{item.q}</span>
              <span style={{ fontSize: 18, color: '#64748B', marginLeft: 12 }}>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 20px 18px', color: '#475569', fontSize: 15, lineHeight: 1.8, borderTop: '1px solid #F1F5F9' }}>
                {item.a}
              </div>
            )}
          </div>
        )
      })}

      {/* Sources & Editorial Disclaimer */}
      <div style={{ marginTop: 44, paddingTop: 24, borderTop: '1px solid #E2E8F0', fontSize: 13.5, color: '#64748B', lineHeight: 1.8 }}>
        <strong style={{ color: '#475569' }}>Editorial Sources & Research:</strong> Data compiled from salaryinfo.blog, Scaler Academy, Kaamwork 2026 Salary Benchmarks, PEOrient Research, Abhishek Gautam (abhs.in), Sylph Corps Media, TechTarget (BLS Industry Reports), and the Income Tax Department of India. Compensation figures are market estimates subject to regional variance and currency exchange fluctuations. This article is published for informational purposes and does not constitute formal legal, tax, or financial counsel.
      </div>
    </div>
  )
}
