import React from 'react'
import { Link } from 'react-router-dom'

export default function C2cW2Article() {
  return (
    <div style={{ fontSize: 16.5, lineHeight: 1.8, color: '#1E293B' }}>
      <p style={{ fontSize: 18, lineHeight: 1.75, color: '#334155' }}>
        If you're an IT professional exploring contract work — whether as a software developer, data engineer, DevOps specialist, business analyst, or any other tech role — you've likely encountered three confusing acronyms: <strong>C2C</strong>, <strong>W2</strong>, and <strong>1099</strong>. Understanding the difference between these contract structures is critical because it directly impacts your <strong>take-home pay, tax liability, benefits, and career flexibility</strong>.
      </p>

      <p>
        This guide breaks down all three contract types in plain language, with real-world examples tailored to the US IT staffing market in 2026.
      </p>

      {/* TOC */}
      <nav aria-label="Table of Contents" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 22px', margin: '32px 0', fontSize: 14 }}>
        <strong style={{ color: '#0F172A', fontSize: 15, display: 'block', marginBottom: 10 }}>Table of Contents</strong>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2, color: '#2563EB' }}>
          <li><a href="#what-is-w2" style={{ color: '#2563EB', textDecoration: 'none' }}>What Is W2 Employment?</a></li>
          <li><a href="#what-is-1099" style={{ color: '#2563EB', textDecoration: 'none' }}>What Is 1099 Independent Contracting?</a></li>
          <li><a href="#what-is-c2c" style={{ color: '#2563EB', textDecoration: 'none' }}>What Is Corp-to-Corp (C2C)?</a></li>
          <li><a href="#comparison" style={{ color: '#2563EB', textDecoration: 'none' }}>Side-by-Side Comparison Table</a></li>
          <li><a href="#tax-implications" style={{ color: '#2563EB', textDecoration: 'none' }}>Tax Implications Explained</a></li>
          <li><a href="#rates" style={{ color: '#2563EB', textDecoration: 'none' }}>Typical Rate Differences</a></li>
          <li><a href="#which-to-choose" style={{ color: '#2563EB', textDecoration: 'none' }}>Which Contract Type Should You Choose?</a></li>
          <li><a href="#faq" style={{ color: '#2563EB', textDecoration: 'none' }}>Frequently Asked Questions</a></li>
        </ol>
      </nav>

      {/* ── Section 1 ── */}
      <h2 id="what-is-w2" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>1. What Is W2 Employment?</h2>
      <p>A <strong>W2 worker</strong> is classified as an employee of the staffing agency or the client company. The name comes from the IRS Form W-2, which employers send to employees each year summarizing wages and taxes withheld.</p>
      <p>With W2 status, the employer (the staffing agency) handles your tax withholdings — including federal income tax, Social Security (6.2%), and Medicare (1.45%). The agency also pays the <strong>employer's matching share</strong> of FICA taxes on top of your gross pay.</p>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '24px 0 10px' }}>Benefits of W2 IT Contracts:</h3>
      <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li>Simple tax filing — just one W-2 at year end</li>
        <li>Some agencies offer health insurance, 401(k), and paid time off</li>
        <li>No need to set up a business entity</li>
        <li>Workers' compensation and unemployment coverage included</li>
        <li>Lower professional liability vs. C2C</li>
      </ul>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '24px 0 10px' }}>Drawbacks of W2:</h3>
      <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li>Lower hourly rates vs. C2C or 1099 (employers factor in overhead)</li>
        <li>Less flexibility — treated more like a traditional employee</li>
        <li>Benefits quality varies widely between agencies</li>
      </ul>

      {/* ── Section 2 ── */}
      <h2 id="what-is-1099" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>2. What Is 1099 Independent Contracting?</h2>
      <p>A <strong>1099 contractor</strong> is a self-employed individual who provides services to a company or agency. The name comes from IRS Form 1099-NEC (Non-Employee Compensation). Under this arrangement, <strong>no taxes are withheld</strong> from your payments — you're responsible for paying all taxes yourself, including self-employment tax.</p>
      <p>Unlike C2C, you don't need a registered business entity. You operate as an individual (sole proprietor). However, many agencies and large enterprises have moved away from 1099 arrangements due to IRS misclassification risks — which means 1099 opportunities can be harder to find than W2 or C2C roles.</p>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '24px 0 10px' }}>Key 1099 Tax Responsibilities:</h3>
      <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li>Self-employment tax: <strong>15.3%</strong> (Social Security + Medicare, both halves)</li>
        <li>Quarterly estimated tax payments to the IRS</li>
        <li>Can deduct business expenses (home office, equipment, internet, etc.)</li>
        <li>No employer benefits — you fund your own health insurance and retirement</li>
      </ul>

      {/* ── Section 3 ── */}
      <h2 id="what-is-c2c" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>3. What Is Corp-to-Corp (C2C)?</h2>
      <p><strong>Corp-to-Corp (C2C)</strong> is a business-to-business arrangement where your registered company (LLC, S-Corp, or C-Corp) enters into a contract with the staffing agency or client company. Instead of being paid as an individual, your company invoices and receives payment.</p>
      <p>This is the preferred model for experienced IT consultants because it typically offers the <strong>highest hourly rates</strong>, maximum tax efficiency through an S-Corp election, and maximum professional independence.</p>

      <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)', border: '1px solid #FED7AA', borderRadius: 10, padding: '18px 22px', margin: '20px 0', display: 'flex', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path></svg>
        </span>
        <div>
          <strong style={{ color: '#92400E', display: 'block', marginBottom: 4 }}>Pro Tip: S-Corp Election</strong>
          <p style={{ margin: 0, color: '#78350F', fontSize: 14.5, lineHeight: 1.7 }}>Most experienced IT contractors structure their C2C as an LLC that has elected S-Corp tax treatment. This allows you to split your income into a "reasonable salary" and "distributions," potentially saving thousands in self-employment taxes annually. Consult a CPA who specializes in contractor taxes.</p>
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '24px 0 10px' }}>C2C Requirements:</h3>
      <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
        <li>Registered LLC, S-Corp, or C-Corp (varies by state — avg. cost $50–$500)</li>
        <li>Employer Identification Number (EIN) from the IRS (free)</li>
        <li>Business bank account</li>
        <li>Professional liability / errors & omissions (E&O) insurance (often required)</li>
        <li>Workers' compensation insurance (required in some states)</li>
      </ul>

      {/* ── Comparison Table ── */}
      <h2 id="comparison" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>4. Side-by-Side Comparison</h2>
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#0F172A', color: '#FFFFFF' }}>
              {['Feature', 'W2', '1099', 'Corp-to-Corp (C2C)'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13, letterSpacing: '0.03em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Business entity needed', 'No', 'No', 'Yes (LLC/Corp)'],
              ['Tax withholding', 'Employer handles', 'You pay quarterly', 'You pay quarterly'],
              ['Self-employment tax', 'Employer pays half', '15.3% (full)', 'Can optimize via S-Corp'],
              ['Typical hourly rate', 'Lower', 'Medium', 'Highest'],
              ['Benefits available', 'Sometimes', 'No', 'No (self-funded)'],
              ['Tax filing complexity', 'Simple', 'Moderate', 'Complex (CPA advised)'],
              ['Employer liability risk', 'Low', 'Medium (misclassification)', 'Low (you\'re a vendor)'],
              ['Flexibility', 'Low', 'High', 'Highest'],
              ['Best for', 'Beginners / risk-averse', 'Short-term projects', 'Experienced consultants'],
            ].map(([feat, w2, ind, c2c], i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '11px 16px', fontWeight: 600, color: '#334155' }}>{feat}</td>
                <td style={{ padding: '11px 16px', color: '#475569' }}>{w2}</td>
                <td style={{ padding: '11px 16px', color: '#475569' }}>{ind}</td>
                <td style={{ padding: '11px 16px', color: '#475569' }}>{c2c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Tax section ── */}
      <h2 id="tax-implications" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>5. Tax Implications Explained</h2>
      <p>Understanding your tax obligations is the most important factor in choosing a contract type. Here's a breakdown for a hypothetical IT contractor earning <strong>$100,000/year</strong>:</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0 28px' }}>
        {[
          { label: 'W2 Employee', amount: '~$72,500', note: 'After federal/state tax + FICA. Benefits sometimes included.', color: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
          { label: '1099 Contractor', amount: '~$68,000', note: 'After self-employment tax (15.3%) + income tax. Can deduct expenses.', color: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
          { label: 'C2C / S-Corp', amount: '~$76,000+', note: 'Optimized salary split, retirement deductions, home office write-offs.', color: '#F0FDF4', border: '#BBF7D0', text: '#14532D' },
        ].map(t => (
          <div key={t.label} style={{ background: t.color, border: `1px solid ${t.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: t.text, marginBottom: 6 }}>{t.amount}</div>
            <div style={{ fontSize: 13, color: t.text, lineHeight: 1.5, opacity: 0.85 }}>{t.note}</div>
          </div>
        ))}
      </div>

      <p><em>Note: These are illustrative estimates. Actual take-home varies by state tax rates, deductions, and filing status. Always consult a CPA.</em></p>

      {/* ── Rates section ── */}
      <h2 id="rates" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>6. Typical Rate Differences (2026)</h2>
      <p>Recruiters and staffing agencies adjust hourly bill rates based on contract type because different structures have different overhead costs. Here's a <strong>real-world example for a Senior Java Developer</strong> in the mid-Atlantic US market:</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14.5, marginBottom: 20, borderRadius: 10, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#1E293B', color: '#F1F5F9' }}>
              {['Contract Type', 'Bill Rate (Client)', 'Your Pay Rate', 'Annualized Estimate'].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['W2 Hourly (no benefits)', '$110/hr', '$65/hr', '$130,000/yr'],
              ['W2 with Benefits', '$110/hr', '$58/hr', '$116,000/yr'],
              ['1099 Independent', '$110/hr', '$72/hr', '$144,000/yr'],
              ['C2C (LLC/S-Corp)', '$110/hr', '$78/hr', '$156,000/yr'],
            ].map(([type, bill, pay, ann], i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F8FAFC' : '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0F172A' }}>{type}</td>
                <td style={{ padding: '11px 16px', color: '#475569' }}>{bill}</td>
                <td style={{ padding: '11px 16px', fontWeight: 700, color: '#059669' }}>{pay}</td>
                <td style={{ padding: '11px 16px', color: '#475569' }}>{ann}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Which to choose ── */}
      <h2 id="which-to-choose" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>7. Which Contract Type Should You Choose?</h2>

      {[
        { title: 'Choose W2 if…', color: '#EFF6FF', border: '#BFDBFE', items: ['You\'re new to IT contracting and want simplicity', 'You need employer-sponsored health insurance', 'You\'re risk-averse and don\'t want to manage business finances', 'Your contract is short-term (< 3 months)'] },
        { title: 'Choose 1099 if…', color: '#FFFBEB', border: '#FDE68A', items: ['You have multiple short-term clients simultaneously', 'You\'re transitioning to consulting and testing the waters', 'The client explicitly requires 1099', 'You already have business expenses to write off'] },
        { title: 'Choose C2C if…', color: '#F0FDF4', border: '#BBF7D0', items: ['You\'re an experienced IT professional (3+ years)', 'You want maximum income and tax optimization', 'You plan to contract long-term (6+ months projects)', 'You\'re comfortable working with a CPA and handling business admin', 'You want the credibility of a business entity for enterprise clients'] },
      ].map(box => (
        <div key={box.title} style={{ background: box.color, border: `1px solid ${box.border}`, borderRadius: 10, padding: '18px 22px', marginBottom: 14 }}>
          <strong style={{ display: 'block', fontSize: 16, marginBottom: 10, color: '#0F172A' }}>{box.title}</strong>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.85, fontSize: 14.5, color: '#334155' }}>
            {box.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      ))}

      {/* ── CTA ── */}
      <div style={{ background: 'linear-gradient(135deg, #0B0F19, #161E31)', borderRadius: 14, padding: '28px 32px', margin: '36px 0', textAlign: 'center' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px' }}>Ready to Find Your Next IT Contract?</h3>
        <p style={{ color: '#94A3B8', margin: '0 0 20px', fontSize: 15, lineHeight: 1.6 }}>Browse 60+ active direct-client IT requisitions — State, Healthcare & Enterprise. C2C, W2, and 1099 roles available. No intermediary layers.</p>
        <Link to="/jobs" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FF6B00, #FFA040)', color: '#FFFFFF', fontWeight: 800, fontSize: 15, padding: '12px 30px', borderRadius: 8, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          Browse Open IT Roles →
        </Link>
      </div>

      {/* ── FAQ ── */}
      <h2 id="faq" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>8. Frequently Asked Questions</h2>

      {[
        { q: 'What is Corp-to-Corp (C2C) in IT staffing?', a: 'Corp-to-Corp (C2C) is a business arrangement where your LLC or S-Corp invoices the staffing agency or client company directly. You operate as a business entity, manage your own taxes, and typically earn 10–20% higher hourly rates than equivalent W2 roles.' },
        { q: 'Is W2 or 1099 better for IT contractors?', a: 'It depends on your goals. W2 provides employer tax coverage and sometimes benefits like health insurance — ideal for beginners. 1099 offers higher gross pay and flexibility but requires quarterly tax payments and full self-employment tax (15.3%). C2C (via LLC/S-Corp) offers the best net income for experienced consultants who can optimize taxes.' },
        { q: 'What is the typical rate difference between W2 and C2C?', a: 'C2C rates typically run 10–20% higher than W2 rates. For example, a role paying $65/hr W2 might offer $75–80/hr C2C. This premium compensates for self-employment taxes, insurance, and business overhead.' },
        { q: 'Do I need an LLC for C2C IT contracts?', a: 'Yes. For Corp-to-Corp contracts, you must have a registered business entity — typically an LLC, S-Corp, or C-Corp — and a business EIN from the IRS. The agency contracts with your company, not you personally. Most IT contractors use an LLC with S-Corp tax election.' },
        { q: 'Can I switch from W2 to C2C mid-career?', a: 'Absolutely. Many IT professionals start on W2 to learn the contracting landscape, then set up their LLC and transition to C2C once they have stable client relationships and income to justify the administrative overhead. The setup cost is typically $200–$800 depending on your state.' },
      ].map((faq, i) => (
        <details key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
          <summary style={{ padding: '14px 18px', fontWeight: 700, fontSize: 15, color: '#0F172A', cursor: 'pointer', backgroundColor: '#F8FAFC', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {faq.q}
            <span style={{ color: '#2563EB', fontSize: 18, lineHeight: 1 }}>+</span>
          </summary>
          <p style={{ padding: '14px 18px', margin: 0, color: '#334155', fontSize: 15, lineHeight: 1.75, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>{faq.a}</p>
        </details>
      ))}
    </div>
  )
}
