import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

/* ─── SEO helper ─────────────────────────────────────────────────── */
function useSEO({ title, description, url, image, ldJson }) {
  useEffect(() => {
    document.title = title
    const set = (name, content, prop = false) => {
      const attr = prop ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    set('description', description)
    set('robots', 'index, follow')
    set('og:type', 'blog', true)
    set('og:title', title, true)
    set('og:description', description, true)
    set('og:url', url, true)
    set('og:image', image, true)
    set('og:site_name', 'SmartHire Blog by PraxiMinds', true)
    set('twitter:card', 'summary_large_image')
    set('twitter:title', title)
    set('twitter:description', description)
    set('twitter:image', image)
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.setAttribute('rel', 'canonical'); document.head.appendChild(canonical) }
    canonical.setAttribute('href', url)
    const existing = document.getElementById('smarthire-blog-jsonld')
    if (existing) existing.remove()
    const sc = document.createElement('script')
    sc.id = 'smarthire-blog-jsonld'
    sc.type = 'application/ld+json'
    sc.textContent = JSON.stringify(ldJson)
    document.head.appendChild(sc)
    return () => { const s = document.getElementById('smarthire-blog-jsonld'); if (s) s.remove() }
  }, [title, description, url, image])
}

/* ─── Blog post data ─────────────────────────────────────────────── */
const BLOG_POSTS = [
  {
    slug: 'c2c-vs-w2-vs-1099-it-contracts-guide',
    title: 'C2C vs W2 vs 1099: Which IT Contract Type Is Best for You in 2025?',
    metaTitle: 'C2C vs W2 vs 1099: IT Contract Types Explained (2025 Guide) | SmartHire',
    metaDescription: 'Confused about C2C, W2, and 1099 for IT contracts? This comprehensive 2025 guide breaks down tax implications, benefits, rates, and which contract type maximizes your income as an IT consultant.',
    excerpt: 'Choosing between Corp-to-Corp (C2C), W2 employee, and 1099 independent contractor status can make or break your IT career earnings. Learn the key differences, tax implications, and which model fits your goals.',
    category: 'IT Career Guide',
    readTime: '9 min read',
    date: 'September 5, 2026',
    author: 'PraxiMinds Editorial Team',
    tags: ['C2C', 'W2', '1099', 'IT Contracts', 'IT Consulting', 'Tax', 'Staffing'],
    image: '/career-hero-slide2.jpg',
  }
]

/* ─── Full Blog Post Content ─────────────────────────────────────── */
function BlogPostContent({ post }) {
  const navigate = useNavigate()
  useSEO({
    title: post.metaTitle,
    description: post.metaDescription,
    url: `https://smarthire-4zqf.onrender.com/blog/${post.slug}`,
    image: `https://smarthire-4zqf.onrender.com${post.image}`,
    ldJson: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.metaDescription,
      "image": `https://smarthire-4zqf.onrender.com${post.image}`,
      "datePublished": "2026-09-05T00:00:00+05:30",
      "dateModified": "2026-09-05T00:00:00+05:30",
      "author": { "@type": "Organization", "name": "PraxiMinds Editorial Team", "url": "https://smarthire-4zqf.onrender.com" },
      "publisher": { "@type": "Organization", "name": "PraxiMinds SmartHire", "logo": { "@type": "ImageObject", "url": "https://smarthire-4zqf.onrender.com/favicon.svg" } },
      "mainEntityOfPage": { "@type": "WebPage", "@id": `https://smarthire-4zqf.onrender.com/blog/${post.slug}` },
      "keywords": post.tags.join(', '),
      "articleSection": post.category,
      "wordCount": 1800,
      "inLanguage": "en-US",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://smarthire-4zqf.onrender.com" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://smarthire-4zqf.onrender.com/blog" },
          { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://smarthire-4zqf.onrender.com/blog/${post.slug}` }
        ]
      },
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is Corp-to-Corp (C2C) in IT staffing?", "acceptedAnswer": { "@type": "Answer", "text": "Corp-to-Corp (C2C) is a business arrangement where your LLC or S-Corp invoices the staffing agency or client company. You operate as a business entity, handle your own taxes, and typically earn higher hourly rates than W2 employees." } },
          { "@type": "Question", "name": "Is W2 or 1099 better for IT contractors?", "acceptedAnswer": { "@type": "Answer", "text": "It depends on your situation. W2 provides employer tax coverage and benefits like health insurance. 1099 offers more flexibility and higher gross pay, but you pay self-employment tax (15.3%). C2C often offers the best net income for experienced consultants." } },
          { "@type": "Question", "name": "What is the typical C2C rate for IT consultants?", "acceptedAnswer": { "@type": "Answer", "text": "C2C rates for IT consultants typically run 10–20% higher than W2 rates to compensate for self-employment taxes and benefits. For example, a role paying $65/hr W2 might offer $75–80/hr C2C." } },
          { "@type": "Question", "name": "Do I need an LLC for C2C contracts?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. For Corp-to-Corp contracts, you must have a registered business entity — typically an LLC, S-Corp, or C-Corp — and a business EIN. The agency invoices your company, not you personally." } }
        ]
      }
    }
  })

  return (
    <article style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 80px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, color: '#64748B', padding: '20px 0 0', flexWrap: 'wrap' }}>
        <a href="/" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>Home</a>
        <span>›</span>
        <button onClick={() => navigate('/blog')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Blog</button>
        <span>›</span>
        <span style={{ color: '#94A3B8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</span>
      </nav>

      {/* Category + reading time */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '22px 0 16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{post.category}</span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>·</span>
        <span style={{ fontSize: 12.5, color: '#64748B' }}>⏱ {post.readTime}</span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>·</span>
        <span style={{ fontSize: 12.5, color: '#64748B' }}>{post.date}</span>
      </div>

      {/* H1 */}
      <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#0F172A', lineHeight: 1.22, margin: '0 0 18px', letterSpacing: '-0.025em' }}>
        {post.title}
      </h1>

      {/* Excerpt / lead */}
      <p style={{ fontSize: 17, color: '#334155', lineHeight: 1.7, margin: '0 0 28px', fontWeight: 400, borderLeft: '3px solid #FF6B00', paddingLeft: 16 }}>
        {post.excerpt}
      </p>

      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 32 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B00, #FFA040)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>P</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{post.author}</div>
          <div style={{ fontSize: 12.5, color: '#64748B' }}>IT Staffing & Career Experts · PraxiMinds SmartHire</div>
        </div>
      </div>

      {/* Hero image */}
      <img src={post.image} alt="IT professionals working in a modern office — C2C W2 1099 contract types guide" loading="lazy"
        style={{ width: '100%', height: 340, objectFit: 'cover', borderRadius: 12, marginBottom: 36, border: '1px solid #E2E8F0' }} />

      {/* ─── Article Body ─────────────────────────────── */}
      <div style={{ fontSize: 16, lineHeight: 1.8, color: '#1E293B' }}>

        <p>If you're an IT professional exploring contract work — whether as a software developer, data engineer, DevOps specialist, business analyst, or any other tech role — you've likely encountered three confusing acronyms: <strong>C2C</strong>, <strong>W2</strong>, and <strong>1099</strong>. Understanding the difference between these contract structures is critical because it directly impacts your <strong>take-home pay, tax liability, benefits, and career flexibility</strong>.</p>

        <p>This guide breaks down all three contract types in plain language, with real-world examples tailored to the US IT staffing market in 2025.</p>

        {/* TOC */}
        <nav aria-label="Table of Contents" style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 22px', margin: '32px 0', fontSize: 14 }}>
          <strong style={{ color: '#0F172A', fontSize: 15, display: 'block', marginBottom: 10 }}>📋 Table of Contents</strong>
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
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <strong style={{ color: '#92400E', display: 'block', marginBottom: 4 }}>Pro Tip: S-Corp Election</strong>
            <p style={{ margin: 0, color: '#78350F', fontSize: 14.5, lineHeight: 1.7 }}>Most experienced IT contractors structure their C2C as an LLC that has elected S-Corp tax treatment. This allows you to split your income into a "reasonable salary" and "distributions," potentially saving thousands in self-employment taxes annually. Consult a CPA who specializes in contractor taxes.</p>
          </div>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: '24px 0 10px' }}>C2C Requirements:</h3>
        <ul style={{ paddingLeft: 22, lineHeight: 1.9 }}>
          <li>Registered LLC, S-Corp, or C-Corp (varies by state — avg. cost \$50–\$500)</li>
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
                ['Business entity needed', '❌ No', '❌ No', '✅ Yes (LLC/Corp)'],
                ['Tax withholding', '✅ Employer handles', '❌ You pay quarterly', '❌ You pay quarterly'],
                ['Self-employment tax', '❌ Employer pays half', '✅ 15.3% (full)', '✅ Can optimize via S-Corp'],
                ['Typical hourly rate', 'Lower', 'Medium', 'Highest'],
                ['Benefits available', 'Sometimes', '❌ No', '❌ No (buy own)'],
                ['Tax filing complexity', '🟢 Simple', '🟡 Moderate', '🔴 Complex (need CPA)'],
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
        <p>Understanding your tax obligations is the most important factor in choosing a contract type. Here's a breakdown for a hypothetical IT contractor earning <strong>\$100,000/year</strong>:</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, margin: '20px 0 28px' }}>
          {[
            { label: 'W2 Employee', amount: '~\$72,500', note: 'After federal/state tax + FICA. Benefits sometimes included.', color: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
            { label: '1099 Contractor', amount: '~\$68,000', note: 'After self-employment tax (15.3%) + income tax. Can deduct expenses.', color: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
            { label: 'C2C / S-Corp', amount: '~\$76,000+', note: 'Optimized salary split, retirement deductions, home office write-offs.', color: '#F0FDF4', border: '#BBF7D0', text: '#14532D' },
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
        <h2 id="rates" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>6. Typical Rate Differences (2025)</h2>
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
                ['W2 Hourly (no benefits)', '\$110/hr', '\$65/hr', '\$130,000/yr'],
                ['W2 with Benefits', '\$110/hr', '\$58/hr', '\$116,000/yr'],
                ['1099 Independent', '\$110/hr', '\$72/hr', '\$144,000/yr'],
                ['C2C (LLC/S-Corp)', '\$110/hr', '\$78/hr', '\$156,000/yr'],
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
          { emoji: '👋', title: 'Choose W2 if…', color: '#EFF6FF', border: '#BFDBFE', items: ['You\'re new to IT contracting and want simplicity', 'You need employer-sponsored health insurance', 'You\'re risk-averse and don\'t want to manage business finances', 'Your contract is short-term (< 3 months)'] },
          { emoji: '🧾', title: 'Choose 1099 if…', color: '#FFFBEB', border: '#FDE68A', items: ['You have multiple short-term clients simultaneously', 'You\'re transitioning to consulting and testing the waters', 'The client explicitly requires 1099', 'You already have business expenses to write off'] },
          { emoji: '🏢', title: 'Choose C2C if…', color: '#F0FDF4', border: '#BBF7D0', items: ['You\'re an experienced IT professional (3+ years)', 'You want maximum income and tax optimization', 'You plan to contract long-term (6+ months projects)', 'You\'re comfortable working with a CPA and handling business admin', 'You want the credibility of a business entity for enterprise clients'] },
        ].map(box => (
          <div key={box.title} style={{ background: box.color, border: `1px solid ${box.border}`, borderRadius: 10, padding: '18px 22px', marginBottom: 14 }}>
            <strong style={{ display: 'block', fontSize: 16, marginBottom: 10, color: '#0F172A' }}>{box.emoji} {box.title}</strong>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.85, fontSize: 14.5, color: '#334155' }}>
              {box.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        ))}

        {/* ── CTA ── */}
        <div style={{ background: 'linear-gradient(135deg, #0B0F19, #161E31)', borderRadius: 14, padding: '28px 32px', margin: '36px 0', textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '0 0 10px' }}>🚀 Ready to Find Your Next IT Contract?</h3>
          <p style={{ color: '#94A3B8', margin: '0 0 20px', fontSize: 15, lineHeight: 1.6 }}>Browse 60+ active direct-client IT requisitions — State, Healthcare & Enterprise. C2C, W2, and 1099 roles available. No intermediary layers.</p>
          <a href="/jobs" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FF6B00, #FFA040)', color: '#FFFFFF', fontWeight: 800, fontSize: 15, padding: '12px 30px', borderRadius: 8, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            ⚡ Browse Open IT Roles →
          </a>
        </div>

        {/* ── FAQ ── */}
        <h2 id="faq" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '36px 0 14px', letterSpacing: '-0.02em' }}>8. Frequently Asked Questions</h2>

        {[
          { q: 'What is Corp-to-Corp (C2C) in IT staffing?', a: 'Corp-to-Corp (C2C) is a business arrangement where your LLC or S-Corp invoices the staffing agency or client company directly. You operate as a business entity, manage your own taxes, and typically earn 10–20% higher hourly rates than equivalent W2 roles.' },
          { q: 'Is W2 or 1099 better for IT contractors?', a: 'It depends on your goals. W2 provides employer tax coverage and sometimes benefits like health insurance — ideal for beginners. 1099 offers higher gross pay and flexibility but requires quarterly tax payments and full self-employment tax (15.3%). C2C (via LLC/S-Corp) offers the best net income for experienced consultants who can optimize taxes.' },
          { q: 'What is the typical rate difference between W2 and C2C?', a: 'C2C rates typically run 10–20% higher than W2 rates. For example, a role paying \$65/hr W2 might offer \$75–80/hr C2C. This premium compensates for self-employment taxes, insurance, and business overhead.' },
          { q: 'Do I need an LLC for C2C IT contracts?', a: 'Yes. For Corp-to-Corp contracts, you must have a registered business entity — typically an LLC, S-Corp, or C-Corp — and a business EIN from the IRS. The agency contracts with your company, not you personally. Most IT contractors use an LLC with S-Corp tax election.' },
          { q: 'Can I switch from W2 to C2C mid-career?', a: 'Absolutely. Many IT professionals start on W2 to learn the contracting landscape, then set up their LLC and transition to C2C once they have stable client relationships and income to justify the administrative overhead. The setup cost is typically \$200–800 depending on your state.' },
        ].map((faq, i) => (
          <details key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
            <summary style={{ padding: '14px 18px', fontWeight: 700, fontSize: 15, color: '#0F172A', cursor: 'pointer', backgroundColor: '#F8FAFC', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {faq.q}
              <span style={{ color: '#2563EB', fontSize: 18, lineHeight: 1 }}>+</span>
            </summary>
            <p style={{ padding: '14px 18px', margin: 0, color: '#334155', fontSize: 15, lineHeight: 1.75, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>{faq.a}</p>
          </details>
        ))}

        {/* Tags */}
        <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 10 }}>Tags:</span>
          {post.tags.map(tag => (
            <span key={tag} style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 600, color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', padding: '3px 10px', borderRadius: 20, marginRight: 6, marginBottom: 6 }}>#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

/* ─── Blog Index ─────────────────────────────────────────────────── */
function BlogIndex() {
  const navigate = useNavigate()
  useSEO({
    title: 'IT Career & Staffing Blog | SmartHire by PraxiMinds',
    description: 'Expert guides on IT contracting, C2C vs W2 vs 1099, direct-client staffing, government IT contracts, and career tips for IT consultants in the US. Updated regularly by PraxiMinds.',
    url: 'https://smarthire-4zqf.onrender.com/blog',
    image: 'https://smarthire-4zqf.onrender.com/career-hero-slide1.jpg',
    ldJson: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "SmartHire IT Career Blog",
      "description": "Expert articles on IT contracting, staffing, and career development by PraxiMinds SmartHire",
      "url": "https://smarthire-4zqf.onrender.com/blog",
      "publisher": { "@type": "Organization", "name": "PraxiMinds SmartHire", "url": "https://smarthire-4zqf.onrender.com" },
      "blogPost": BLOG_POSTS.map(p => ({
        "@type": "BlogPosting",
        "headline": p.title,
        "url": `https://smarthire-4zqf.onrender.com/blog/${p.slug}`,
        "datePublished": "2026-09-05",
        "author": { "@type": "Organization", "name": p.author }
      }))
    }
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Hero header */}
      <header style={{ textAlign: 'center', padding: '60px 0 48px' }}>
        <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: '#FF6B00', backgroundColor: 'rgba(255, 107, 0, 0.08)', border: '1px solid rgba(255, 107, 0, 0.25)', padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
          ✦ SmartHire Blog
        </span>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 900, color: '#0F172A', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          IT Career & Staffing Insights
        </h1>
        <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.65, maxWidth: 640, margin: '0 auto', fontWeight: 400 }}>
          Expert guides on IT contracting, direct-client opportunities, tax strategies, and career growth — written by the PraxiMinds staffing team.
        </p>
      </header>

      {/* Posts grid */}
      <section aria-label="Blog Posts">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
          Latest Articles
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {BLOG_POSTS.map(post => (
            <article key={post.slug}
              onClick={() => navigate(`/blog/${post.slug}`)}
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <img src={post.image} alt={`${post.title} — SmartHire Blog`} loading="lazy"
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '20px 22px 24px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', padding: '2px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{post.category}</span>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>· {post.readTime}</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 10px', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{post.title}</h2>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, color: '#94A3B8' }}>{post.date}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}>Read More →</span>
                </div>
              </div>
            </article>
          ))}
          {/* Coming soon placeholder */}
          <div style={{ background: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: 14, padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 280 }}>
            <span style={{ fontSize: 32, marginBottom: 14 }}>✍️</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#475569', margin: '0 0 8px' }}>More Articles Coming Soon</h3>
            <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.6, maxWidth: 220, margin: 0 }}>We publish expert IT staffing guides weekly. Bookmark this page!</p>
          </div>
        </div>
      </section>

      {/* Subscribe / CTA */}
      <section style={{ background: 'linear-gradient(135deg, #0B0F19, #161E31)', borderRadius: 16, padding: '36px 40px', marginTop: 52, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>Browse Open IT Roles Now</h2>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: 15, lineHeight: 1.6 }}>60+ active direct-client requisitions · C2C, W2, 1099 accepted</p>
        </div>
        <a href="/jobs" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FF6B00, #FFA040)', color: '#FFFFFF', fontWeight: 800, fontSize: 15, padding: '13px 28px', borderRadius: 10, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
          ⚡ View Open Jobs →
        </a>
      </section>
    </div>
  )
}

/* ─── Main Blog Component (Router) ─────────────────────────────── */
export default function Blog() {
  const { slug } = useParams()
  const post = slug ? BLOG_POSTS.find(p => p.slug === slug) : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFBFD', background: 'radial-gradient(ellipse at 30% 0%, rgba(255, 107, 0, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(37, 99, 235, 0.04) 0%, transparent 60%), #FAFBFD' }}>
      {/* Top Nav */}
      <header role="banner" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Smart<span style={{ color: '#FF6B00' }}>Hire</span>
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '1px solid #E2E8F0', paddingLeft: 8 }}>Blog</span>
          </a>
          <nav aria-label="Main navigation" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <a href="/jobs" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', padding: '6px 12px', borderRadius: 7, transition: 'background 0.15s' }}>Jobs</a>
            <a href="/blog" style={{ fontSize: 13.5, fontWeight: 600, color: '#2563EB', textDecoration: 'none', padding: '6px 12px', borderRadius: 7, backgroundColor: '#EFF6FF' }}>Blog</a>
            <a href="/about" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', padding: '6px 12px', borderRadius: 7 }}>About</a>
            <a href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#FFFFFF', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', marginLeft: 4 }}>
              ⚡ Apply Now
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" role="main">
        {post ? <BlogPostContent post={post} /> : <BlogIndex />}
      </main>

      {/* Footer */}
      <footer role="contentinfo" style={{ backgroundColor: '#0B0F19', color: '#94A3B8', padding: '32px 24px', textAlign: 'center', fontSize: 13.5 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#CBD5E1', fontSize: 15 }}>
            Smart<span style={{ color: '#FF6B00' }}>Hire</span> by PraxiMinds
          </p>
          <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
            Direct-client IT staffing | State, Healthcare & Enterprise Contracts | Remote · Hybrid · Onsite
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            {[['Jobs', '/jobs'], ['Blog', '/blog'], ['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy']].map(([label, href]) => (
              <a key={label} href={href} style={{ color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>{label}</a>
            ))}
          </div>
          <p style={{ margin: 0, color: '#334155', fontSize: 12 }}>© 2026 PraxiMinds. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
