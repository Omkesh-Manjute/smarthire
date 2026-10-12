import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function DataCenterStaffingBoomArticle() {
  const [openFaq, setOpenFaq] = useState({})
  const [feedbackGiven, setFeedbackGiven] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const faqs = [
    {
      q: "Which data center jobs are in highest demand in the US?",
      a: "Electricians, critical facility technicians, HVAC and liquid cooling engineers, low-voltage and fiber specialists, and commissioning engineers are the most constrained roles in 2026."
    },
    {
      q: "Do you need a computer science degree for data center jobs?",
      a: "Often no. Leading operators like Digital Realty, Equinix, and Vantage actively hire licensed electricians, industrial HVAC techs, and career changers with mechanical aptitude, then train them on-site for data center facility engineer roles."
    },
    {
      q: "How much do data center technicians earn?",
      a: "Reported compensation ranges run from about $45,000 to $145,000 a year depending on experience and certifications. Experienced crew leads and licensed master electricians in primary hubs like Northern Virginia routinely clear $200,000+ annually."
    },
    {
      q: "Where are most US data center jobs located?",
      a: "Northern Virginia (Data Center Alley), Texas (Dallas-Fort Worth and Austin), Ohio (Columbus), and Iowa are the highest-density hiring hotspots for infrastructure construction and 24/7 site operations."
    },
    {
      q: "What engagement model is common for data center buildouts (W2 vs C2C)?",
      a: "Many initial buildouts, fiber splicing runs, and commissioning phases rely heavily on Corp-to-Corp (C2C) and 1099 contractors for project-based speed, while ongoing 24/7 site operations favor permanent W-2 and contract-to-hire arrangements."
    }
  ]

  return (
    <div style={{ fontSize: 18, lineHeight: 1.85, color: '#1E293B', fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif" }}>
      {/* Editorial Lead Paragraph */}
      <p style={{ fontSize: 20, lineHeight: 1.8, color: '#1E293B', margin: '0 0 22px' }}>
        Ask most people which tech jobs are hot in 2026 and they will tell you AI prompt engineers or machine learning researchers. Ask anyone trying to commission or run a data center and you will hear something completely different: <strong>electricians, liquid cooling engineers, and critical facility technicians</strong>. The physical buildout behind AI clusters and hyperscale cloud is so massive that hiring human talent—not capital—has become the single biggest bottleneck.
      </p>

      <p style={{ margin: '0 0 22px' }}>
        The staffing industry is feeling the pressure directly. In Staffing Industry Analysts' (SIA) latest pulse survey, <a href="https://www.staffingindustry.com/editorial/it-staffing-report/momentum-builds-in-it-staffing" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F', textDecoration: 'underline' }}>81% of IT staffing executives confirmed that data centers will create moderate to surge-level demand</a> for technical staffing through 2027. Below is a plain-English, recruiter's breakdown of where that demand lands, what these roles pay, and how to position yourself—whether you are an engineer looking to break in, or the hiring manager trying to staff a team.
      </p>

      {/* WordPress Editorial Callout: Quick Takeaways */}
      <div style={{
        background: '#F0FDF4',
        borderLeft: '4px solid #16A34A',
        borderRadius: '0 8px 8px 0',
        padding: '20px 24px',
        margin: '32px 0',
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ color: '#166534', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Quick Takeaways
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#15803D', fontSize: 16, lineHeight: 1.75 }}>
          <li>The hardest roles to fill are hands-on and mission-critical: high-voltage electricians, facility technicians, immersion cooling specialists, and low-voltage fiber techs.</li>
          <li>Operators are dropping rigid degree filters and investing heavily in sponsored trade cross-training programs.</li>
          <li>With 25% of personnel recruited away annually by competitors, rapid hiring timelines (under 5 days) decide who wins talent.</li>
        </ul>
      </div>

      {/* Table of Contents - WordPress Gutenberg Style */}
      <nav aria-label="Table of Contents" style={{
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: '20px 24px',
        margin: '32px 0',
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          In This Guide
        </div>
        <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 2.1, color: '#0D6B5F', fontSize: 15.5 }}>
          <li><button onClick={() => scrollTo('why')} style={{ background: 'none', border: 'none', color: '#0D6B5F', fontSize: 15.5, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Why Data Center Hiring Is Spiking Right Now</button></li>
          <li><button onClick={() => scrollTo('roles')} style={{ background: 'none', border: 'none', color: '#0D6B5F', fontSize: 15.5, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>The Roles US Companies Are Hiring For</button></li>
          <li><button onClick={() => scrollTo('pay')} style={{ background: 'none', border: 'none', color: '#0D6B5F', fontSize: 15.5, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Pay Signals and Where the Jobs Are</button></li>
          <li><button onClick={() => scrollTo('candidates')} style={{ background: 'none', border: 'none', color: '#0D6B5F', fontSize: 15.5, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>If You Want In: What to Do</button></li>
          <li><button onClick={() => scrollTo('employers')} style={{ background: 'none', border: 'none', color: '#0D6B5F', fontSize: 15.5, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>If You Are Hiring: What Actually Works</button></li>
          <li><button onClick={() => scrollTo('faq')} style={{ background: 'none', border: 'none', color: '#0D6B5F', fontSize: 15.5, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline' }}>Frequently Asked Questions</button></li>
        </ol>
      </nav>

      {/* ── Section 1 ── */}
      <h2 id="why" style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '48px 0 16px', letterSpacing: '-0.02em', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        Why Data Center Hiring Is Spiking Right Now
      </h2>
      <p style={{ margin: '0 0 20px' }}>
        North America already has more than <strong>66 gigawatts (GW) of data center capacity</strong> according to JLL’s midyear 2026 intelligence report as cited by Fierce Network. The overall infrastructure build-out is estimated near <strong>$700 billion</strong>, as Fortune reported. Every single one of those facilities needs human beings to wire, cool, commission, and run it around the clock.
      </p>
      <p style={{ margin: '0 0 20px' }}>
        The skilled workforce simply hasn’t kept up. One industry panel reported that the trades shortage is stretching project backlogs to nearly a year, and Fierce puts US electrician openings alone at roughly 81,000.
      </p>

      {/* WordPress Editorial Blockquote */}
      <blockquote style={{
        borderLeft: '4px solid #0D6B5F',
        margin: '32px 0',
        padding: '16px 24px',
        backgroundColor: '#F8FAF9',
        fontStyle: 'italic',
        fontSize: 19,
        lineHeight: 1.7,
        color: '#134E48'
      }}>
        "We don't have data center engineers coming out the door. We have to build the training pipelines and recruit skilled craftspeople from other trades ourselves."
        <footer style={{ marginTop: 8, fontStyle: 'normal', fontSize: 14, fontWeight: 700, color: '#0D6B5F' }}>
          — Learning & Workforce Development Leader, Digital Realty
        </footer>
      </blockquote>

      {/* ── Section 2 ── */}
      <h2 id="roles" style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '48px 0 16px', letterSpacing: '-0.02em', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        The Roles US Companies Are Hiring For
      </h2>
      <p style={{ margin: '0 0 20px' }}>
        The demand breaks down across both physical facilities engineering and the IT networking layers running on top of them. Here is how the most constrained positions compare:
      </p>

      {/* WordPress Gutenberg Styled Table */}
      <div style={{ overflowX: 'auto', margin: '28px 0', border: '1px solid #E5E7EB', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, fontFamily: "system-ui, -apple-system, sans-serif", minWidth: 640 }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
              <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#374151', textTransform: 'uppercase', fontSize: 12 }}>Role</th>
              <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#374151', textTransform: 'uppercase', fontSize: 12 }}>What They Do</th>
              <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#374151', textTransform: 'uppercase', fontSize: 12 }}>Why It Is Hard to Fill</th>
              <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#374151', textTransform: 'uppercase', fontSize: 12 }}>Salary Band</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFFFF' }}>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#111827' }}>Electricians / High-Voltage Techs</td>
              <td style={{ padding: '14px 18px', color: '#374151' }}>Install and maintain power distribution, switchgear, UPS battery banks</td>
              <td style={{ padding: '14px 18px', color: '#6B7280' }}>Aging workforce (~30% near retirement); most constrained trade</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0D6B5F' }}>$85K – $210K</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#F9FAFB' }}>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#111827' }}>Critical Facility Technicians (CFT)</td>
              <td style={{ padding: '14px 18px', color: '#374151' }}>Keep site running 24/7/365; BMS monitoring and incident response</td>
              <td style={{ padding: '14px 18px', color: '#6B7280' }}>No standard university degree exists; requires 24/7 shift readiness</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0D6B5F' }}>$70K – $145K</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFFFF' }}>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#111827' }}>HVAC & Liquid Cooling Engineers</td>
              <td style={{ padding: '14px 18px', color: '#374151' }}>Design and maintain direct-to-chip and immersion liquid cooling</td>
              <td style={{ padding: '14px 18px', color: '#6B7280' }}>Shift to high-density AI chips requires plumbing + HVAC hybrid skills</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0D6B5F' }}>$95K – $185K</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#F9FAFB' }}>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#111827' }}>Low-Voltage & Fiber Specialists</td>
              <td style={{ padding: '14px 18px', color: '#374151' }}>High-density optical fiber splicing, MTP/MPO trunk routing</td>
              <td style={{ padding: '14px 18px', color: '#6B7280' }}>800G and 1.6T transceiver speeds require micron-level cleanliness</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0D6B5F' }}>$65K – $130K</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFFFF' }}>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#111827' }}>Commissioning (Cx) Engineers</td>
              <td style={{ padding: '14px 18px', color: '#374151' }}>Integrated systems testing (IST) and failure simulation before go-live</td>
              <td style={{ padding: '14px 18px', color: '#6B7280' }}>Rare mix of electrical engineering, mechanical HVAC, and safety codes</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0D6B5F' }}>$115K – $225K</td>
            </tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#111827' }}>Network, Cloud & Security Engineers</td>
              <td style={{ padding: '14px 18px', color: '#374151' }}>Run spine-leaf network fabrics, interconnects, and cyber defenses</td>
              <td style={{ padding: '14px 18px', color: '#6B7280' }}>Same high-caliber talent pool every other Fortune 500 employer targets</td>
              <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0D6B5F' }}>$125K – $210K</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 21, fontWeight: 700, color: '#111827', margin: '32px 0 12px', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        Electricians Come First
      </h3>
      <p style={{ margin: '0 0 20px' }}>
        An AI data center is fundamentally a massive power distribution hub. Without stable, uninterruptible power, billions of dollars of GPUs cannot boot. Master and journeyman electricians sit squarely in the center of every phase—from substation tie-ins to secondary switchgear. According to industry panel research from <a href="https://perscholas.org" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F', textDecoration: 'underline' }}>Per Scholas</a>, roughly 30% of US electricians are nearing retirement age, intensifying the labor crunch every quarter.
      </p>

      <h3 style={{ fontSize: 21, fontWeight: 700, color: '#111827', margin: '32px 0 12px', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        Cooling Is the Fastest-Growing Headache
      </h3>
      <p style={{ margin: '0 0 20px' }}>
        Randstad’s analysis of more than 50 million job postings, as summarized by ZeroG Talent, found that demand for <strong>HVAC and cooling engineers is up 67%</strong> since late 2022, while robotics and diagnostics technicians rose 107%. Liquid cooling is the reason: modern AI rack densities exceed 80 to 120 kilowatts per cabinet. Air conditioning alone cannot dissipate that heat. Cooling loops now demand closed-loop piping, glycol treatment, and precision plumbing skills that older air-cooled computer rooms never required.
      </p>

      <h3 style={{ fontSize: 21, fontWeight: 700, color: '#111827', margin: '32px 0 12px', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        Don't Forget the IT Side
      </h3>
      <p style={{ margin: '0 0 20px' }}>
        Not everything is hard hats and switchgear. Cloud architecture, fiber networking, cybersecurity, and monitoring integration are named by SIA as core drivers of ongoing technical staffing. If you are an experienced network engineer or cybersecurity specialist, hyperscale data center operators and their prime contractors represent one of the fastest-growing hiring channels in the country.
      </p>

      {/* ── Section 3 ── */}
      <h2 id="pay" style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '48px 0 16px', letterSpacing: '-0.02em', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        Pay and Where the Jobs Are
      </h2>
      <p style={{ margin: '0 0 20px' }}>
        Fierce reports that data center technician pay ranges from <strong>$45,000 to $145,000 a year</strong>, depending on experience, location, and certifications. Experienced electricians leading multi-site crews in Northern Virginia now routinely clear <strong>$200,000</strong>. Specialized contractors with liquid cooling or advanced fiber certifications can reach roughly $300,000 annually. Data from Kelly Services shows an average <strong>25% to 30% compensation premium</strong> for workers transitioning from commercial trades into mission-critical facilities.
      </p>
      <p style={{ margin: '0 0 20px' }}>
        Geographically, <strong>Virginia, Texas, Ohio, and Iowa</strong> come up most often as hiring hotspots:
      </p>
      <ul style={{ margin: '0 0 20px', paddingLeft: 24 }}>
        <li><strong>Northern Virginia (Loudoun & Prince William Counties):</strong> Still the undisputed epicenter of global internet traffic ("Data Center Alley").</li>
        <li><strong>Texas (Dallas-Fort Worth, Austin & San Antonio):</strong> Driven by independent ERCOT power and vast land availability.</li>
        <li><strong>Ohio (Columbus & New Albany):</strong> Accelerated by massive cloud hyperscale campuses and semiconductor investments.</li>
        <li><strong>Iowa & Nebraska:</strong> Plentiful wind energy attracts major campuses from Microsoft, Meta, and Google.</li>
      </ul>
      <p style={{ margin: '0 0 20px' }}>
        Because all operators pull from one constrained pool, poaching is rampant: Kelly's survey, as cited by Classet, found that <strong>roughly 25% of data center personnel are hired away by competing facilities every year</strong>.
      </p>

      {/* ── Section 4 ── */}
      <h2 id="candidates" style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '48px 0 16px', letterSpacing: '-0.02em', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        If You Want In: What to Do
      </h2>
      <p style={{ margin: '0 0 20px' }}>
        You may need less of a conventional "tech degree" than you think. Operators like Digital Realty, Vantage, and QTS are actively recruiting master electricians, commercial HVAC techs, and people with mechanical backgrounds, then training them on site. If you are looking to position yourself:
      </p>
      <ul style={{ margin: '0 0 20px', paddingLeft: 24 }}>
        <li><strong>Highlight transferable trade experience:</strong> Focus your resume on power distribution, HVAC controls, structured cabling, PLC sensors, and safety protocols.</li>
        <li><strong>Add recognized credentials:</strong> Prioritize <strong>OSHA 10/30</strong>, <strong>NFPA 70E</strong> (electrical safety standards), and entry data center certifications like <strong>CDCP</strong> or <strong>BICSI Installer</strong>. For IT credentials, compare market ROI in our guide to <Link to="/blog/highest-paying-it-certifications-2026" style={{ color: '#0D6B5F', textDecoration: 'underline', fontWeight: 600 }}>the 10 highest-paying IT certifications in 2026</Link>.</li>
        <li><strong>Be open to travel and project contracting:</strong> Many facility buildouts are project-based and pay premium hourly rates through go-live.</li>
        <li><strong>Rewrite your resume around uptime and equipment:</strong> Detail generator capacities, UPS systems, BMS controls, and tier levels rather than generic job duties.</li>
      </ul>

      {/* ── Section 5 ── */}
      <h2 id="employers" style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '48px 0 16px', letterSpacing: '-0.02em', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        If You Are Hiring: What Actually Works
      </h2>
      <p style={{ margin: '0 0 20px' }}>
        When one quarter of your workforce can be lured away by competing campuses, hiring speed matters as much as compensation. In our direct experience as technical recruiters, traditional four-week interview loops lose top technicians every time. What works:
      </p>
      <ul style={{ margin: '0 0 20px', paddingLeft: 24 }}>
        <li><strong>Skills-based screening and short loops:</strong> Reduce the evaluation process to 3–5 business days. Test practical troubleshooting rather than textbook theory.</li>
        <li><strong>Drop rigid four-year degree requirements:</strong> Demanding a Bachelor's for facility techs or cabling leads eliminates 75% of top field practitioners.</li>
        <li><strong>Offer contract-to-hire options:</strong> Fast contract onboarding lets you staff immediate commissioning deadlines while evaluating cultural fit. For contract structures, explore our guide on <Link to="/blog/c2c-vs-w2-vs-1099-it-contracts-guide" style={{ color: '#0D6B5F', textDecoration: 'underline', fontWeight: 600 }}>C2C vs W2 vs 1099 for IT contractors</Link>.</li>
        <li><strong>Partner with specialized sourcing benches:</strong> Staffing firms that maintain a warm, pre-vetted bench of licensed electricians and facility techs dramatically cut time-to-start.</li>
      </ul>

      {/* WordPress CTA Box */}
      <div style={{
        background: '#FAFBFB',
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        padding: '28px 32px',
        margin: '40px 0',
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Hiring for Data Center or Mission-Critical IT Infrastructure?
        </div>
        <p style={{ margin: '0 0 18px', color: '#4B5563', fontSize: 15.5, lineHeight: 1.6 }}>
          SmartHire connects enterprise operators, general contractors, and IT teams with verified critical facility technicians, electricians, and infrastructure engineers nationwide.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/jobs"
            style={{
              display: 'inline-block',
              backgroundColor: '#0D6B5F',
              color: '#FFFFFF',
              padding: '11px 22px',
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 14.5,
              textDecoration: 'none'
            }}
          >
            Explore Open Infrastructure Jobs →
          </Link>
          <a
            href="https://smarthireus.com"
            style={{
              display: 'inline-block',
              backgroundColor: '#FFFFFF',
              color: '#374151',
              border: '1px solid #D1D5DB',
              padding: '11px 22px',
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 14.5,
              textDecoration: 'none'
            }}
          >
            Partner with SmartHire ATS
          </a>
        </div>
      </div>

      {/* ── Section 6: FAQ ── */}
      <h2 id="faq" style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '48px 0 16px', letterSpacing: '-0.02em', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        Frequently Asked Questions
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '24px 0', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {faqs.map((faq, idx) => {
          const isOpen = openFaq[idx]
          return (
            <div
              key={idx}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px 20px',
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#111827',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <span>{faq.q}</span>
                <span style={{ fontSize: 18, color: '#0D6B5F', fontWeight: 600 }}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 20px 18px', fontSize: 15.5, color: '#4B5563', lineHeight: 1.75, borderTop: '1px solid #F3F4F6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Interactive Helpful Feedback Widget (WordPress Style) */}
      <div style={{
        margin: '40px 0',
        padding: '20px 24px',
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        textAlign: 'center',
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        {feedbackGiven ? (
          <div style={{ color: '#0D6B5F', fontWeight: 700, fontSize: 15 }}>
            Thank you for your feedback! Glad you found this market report helpful.
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
              Did you find this data center hiring guide useful?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setFeedbackGiven('yes')}
                style={{ padding: '6px 16px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#111827', cursor: 'pointer' }}
              >
                Yes, helpful
              </button>
              <button
                onClick={() => setFeedbackGiven('no')}
                style={{ padding: '6px 16px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}
              >
                Could be better
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verified Sources List */}
      <div style={{ marginTop: 44, paddingTop: 24, borderTop: '1px solid #E5E7EB', fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 12 }}>
          Sources & Citations
        </h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: '#6B7280', lineHeight: 1.8 }}>
          <li><a href="https://www.staffingindustry.com/editorial/it-staffing-report/momentum-builds-in-it-staffing" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F' }}>Staffing Industry Analysts: Momentum Builds in IT Staffing</a></li>
          <li><a href="https://www.fierce-network.com/cloud/data-center-labor-shortage-pushes-operators-train-poach-and-automate" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F' }}>Fierce Network: Data Center Labor Shortage Pushes Operators to Train, Poach and Automate</a></li>
          <li><a href="https://dc.fortune.com/2026/04/20/talent-ceo-tech-workers-white-collar-trade-job-layoffs/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F' }}>Fortune: Data Center Build-Out Minting Six-Figure Technician Roles</a></li>
          <li><a href="https://enterprise.perscholas.org/the-skilled-trades-shortage-slowing-the-data-center-buildout/" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F' }}>Per Scholas: The Skilled Trades Shortage Slowing the Data Center Buildout</a></li>
          <li><a href="https://www.classet.ai/blog/data-center-labor-shortage-2026" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F' }}>Classet: The Data Center Labor Shortage in 2026</a></li>
          <li><a href="https://zerogtalent.com/blog/ai-data-center-buildout-is-creating-a-skilled-trades-hiring-boom-and-companies-like-meta-are-paying-to-train-workers-themselves" target="_blank" rel="noopener noreferrer" style={{ color: '#0D6B5F' }}>ZeroG Talent: Skilled Trades Hiring Boom in AI Infrastructure</a></li>
        </ul>
      </div>
    </div>
  )
}
