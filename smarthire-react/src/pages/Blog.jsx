import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import C2cW2Article from './blog-articles/C2cW2Article'
import UsItMarket2026Article from './blog-articles/UsItMarket2026Article'
import H1b2026Article from './blog-articles/H1b2026Article'
import IndiaVsUsaJobs2026Article from './blog-articles/IndiaVsUsaJobs2026Article'
import HighestPayingCertifications2026Article from './blog-articles/HighestPayingCertifications2026Article'
import AiEntryLevelJobs2026Article from './blog-articles/AiEntryLevelJobs2026Article'

/* ─── SEO Helper Hook ─────────────────────────────────────────────── */
function useSEO({ title, description, url, image, ldJson }) {
  useEffect(() => {
    document.title = title
    const set = (name, content, prop = false) => {
      const attr = prop ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    set('description', description)
    set('robots', 'index, follow')
    set('og:type', 'article', true)
    set('og:title', title, true)
    set('og:description', description, true)
    set('og:url', url, true)
    set('og:image', image, true)
    set('og:site_name', 'SmartHire Blog', true)
    set('twitter:card', 'summary_large_image')
    set('twitter:title', title)
    set('twitter:description', description)
    set('twitter:image', image)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)

    const existing = document.getElementById('smarthire-blog-jsonld')
    if (existing) existing.remove()

    if (ldJson) {
      const sc = document.createElement('script')
      sc.id = 'smarthire-blog-jsonld'
      sc.type = 'application/ld+json'
      sc.textContent = JSON.stringify(ldJson)
      document.head.appendChild(sc)
    }

    return () => {
      const s = document.getElementById('smarthire-blog-jsonld')
      if (s) s.remove()
    }
  }, [title, description, url, image, ldJson])
}

/* ─── Blog Post Catalog ───────────────────────────────────────────── */
export const BLOG_POSTS = [
  {
    slug: 'highest-paying-it-certifications-2026',
    aliases: ['highest-paying-it-certifications-2026-real-salary-data', 'it-certifications-2026'],
    title: "10 Highest-Paying IT Certifications in 2026 (Ranked by Real Salary Data)",
    metaTitle: "10 Highest-Paying IT Certifications in 2026 (Real Salary Data) | SmartHire",
    metaDescription: "The 10 highest-paying IT certifications in 2026, ranked by real salary data: cloud architect, CISSP, AWS Security, AI security and more, with cost and ROI.",
    excerpt: "Certifications will not replace experience, but the right one can unlock a senior salary band or clear ATS filters. Discover the top 10 highest-paying IT certifications in 2026 ranked by verified compensation data.",
    category: "IT Career Guide",
    readTime: "10 min read",
    date: "September 19, 2026",
    author: "SmartHire Editorial Team",
    tags: ["IT Certifications", "Cloud Architect", "AWS", "GCP", "CISSP", "Cybersecurity", "IT Salaries 2026", "Tech Careers"],
    image: "/images/blog/highest-paying-it-certifications-2026-hero.webp",
    component: HighestPayingCertifications2026Article
  },
  {
    slug: 'ai-entry-level-it-jobs-2026',
    aliases: ['ai-entry-level-it-jobs', 'is-ai-killing-entry-level-it-jobs-2026'],
    title: "Is AI Killing Entry-Level IT Jobs in 2026? Here Is What the Data Actually Shows",
    metaTitle: "Is AI Killing Entry-Level IT Jobs in 2026? The Real Data | SmartHire",
    metaDescription: "Is AI really taking entry-level IT jobs in 2026? Stanford, BLS and Indeed data show what is actually happening to junior developers, and how freshers can still break in.",
    excerpt: "Stanford ADP payroll research reveals a 19% hiring gap for developers aged 22-25. Here is the factual breakdown of AI's real impact on junior tech hiring and how freshers can still break in.",
    category: "Market Trends",
    readTime: "9 min read",
    date: "September 19, 2026",
    author: "SmartHire Editorial Team",
    tags: ["AI IT Jobs", "Junior Developers", "Entry-Level Tech", "Stanford Research", "BLS Projections", "AI Displacement", "Freshers Guide"],
    image: "/images/blog/ai-entry-level-it-jobs-2026-hero.webp",
    component: AiEntryLevelJobs2026Article
  },
  {
    slug: 'india-vs-usa-it-jobs-2026',
    aliases: ['india-vs-usa-it-jobs', 'software-engineer-salary-india-vs-usa-2026'],
    title: "India vs USA IT Jobs 2026: Salary, Taxes, Lifestyle & Career Growth",
    metaTitle: "India vs USA IT Jobs 2026: Salary, Taxes & Career Growth | SmartHire",
    metaDescription: "India vs USA IT jobs in 2026 compared: real salary gap, taxes, cost of living, visas, job security and career growth. Find out where to build your tech career.",
    excerpt: "The nominal salary gap is huge. The real gap is smaller. Here is the honest comparison for IT professionals deciding between India, the USA, GCCs, and remote dollar-denominated contracts in 2026.",
    category: "IT Career Guide",
    readTime: "9 min read",
    date: "September 19, 2026",
    author: "SmartHire Editorial Team",
    tags: ["India vs USA IT Jobs", "Tech Salaries 2026", "GCCs", "H-1B vs India", "Remote US Jobs", "C2C", "Tax Comparison"],
    image: "/images/blog/india-vs-usa-it-jobs-2026-hero.webp",
    component: IndiaVsUsaJobs2026Article
  },
  {
    slug: 'us-it-recruitment-market-2026',
    aliases: ['us-it-recruitment-market-2026-trends-skills-salaries'],
    title: "US IT Recruitment Market 2026: What's Changing and How to Win",
    metaTitle: "US IT Recruitment Market 2026: Trends, Skills & Salaries | SmartHire",
    metaDescription: "US IT recruitment market 2026 explained: tech unemployment near 2.9%, AI and cybersecurity demand, salary trends, and how employers and candidates can win.",
    excerpt: "The US IT recruitment market in 2026 is a story of two speeds. Tech unemployment fell to ~2.9%, AI and cybersecurity talent are scarce, and hiring speed decides who wins. Full 2026 breakdown for employers and IT candidates.",
    category: "Market Trends",
    readTime: "8 min read",
    date: "September 19, 2026",
    author: "SmartHire Editorial Team",
    tags: ["US IT Market", "Tech Hiring 2026", "AI & ML", "Cybersecurity", "IT Salaries", "Direct Client", "Staffing Trends"],
    image: "/images/blog/us-it-recruitment-market-2026-hero.webp",
    component: UsItMarket2026Article
  },
  {
    slug: 'h1b-2026-update-it-work-visa-options',
    aliases: ['h1b-2026-update', 'it-work-visa-options-2026'],
    title: "H-1B 2026 Update: Lottery, Fees and the Best Work Visa Options for IT Jobs",
    metaTitle: "H-1B 2026 Update: Lottery, Fees & Best IT Visa Options | SmartHire",
    metaDescription: "H-1B 2026 update for IT professionals: wage-weighted lottery, $100K fee court ruling, $103,265 DHS proposal, and the best visa options (OPT, STEM OPT, EAD, TN, L-1) compared.",
    excerpt: "Wage-weighted lottery, $100K fee litigation, and the new $103,265 DHS proposal. Learn how 2026 H-1B changes impact IT professionals, and compare the best work authorization paths (OPT, STEM OPT, EAD, TN, L-1).",
    category: "Immigration & Compliance",
    readTime: "9 min read",
    date: "September 19, 2026",
    author: "SmartHire Editorial Team",
    tags: ["H-1B 2026", "STEM OPT", "OPT", "Work Visa", "GC EAD", "TN Status", "L-1 Transfer", "IT Compliance"],
    image: "/images/blog/h1b-2026-update-hero.webp",
    component: H1b2026Article
  },
  {
    slug: 'c2c-vs-w2-vs-1099-it-contracts-guide',
    aliases: ['c2c-vs-w2-vs-1099'],
    title: "C2C vs W2 vs 1099: Which IT Contract Type Is Best for You in 2026?",
    metaTitle: "C2C vs W2 vs 1099: IT Contract Types Explained (2026 Guide) | SmartHire",
    metaDescription: "Confused about C2C, W2, and 1099 for IT contracts? This comprehensive guide breaks down tax implications, benefits, rates, and which contract type maximizes your income as an IT consultant.",
    excerpt: "Choosing between Corp-to-Corp (C2C), W2 employee, and 1099 independent contractor status can make or break your IT career earnings. Learn the key differences, tax implications, and which model fits your goals.",
    category: "IT Career Guide",
    readTime: "9 min read",
    date: "September 5, 2026",
    author: "SmartHire Editorial Team",
    tags: ["C2C", "W2", "1099", "IT Contracts", "IT Consulting", "Tax Strategy", "Hourly Rates"],
    image: "/career-hero-slide2.jpg",
    component: C2cW2Article
  }
]

/* ─── Single Blog Post View ───────────────────────────────────────── */
function BlogPostContent({ post }) {
  const navigate = useNavigate()
  const siteUrl = 'https://smarthireus.com'
  const postUrl = `${siteUrl}/blog/${post.slug}`
  const imageUrl = post.image.startsWith('http') ? post.image : `${siteUrl}${post.image}`

  useSEO({
    title: post.metaTitle,
    description: post.metaDescription,
    url: postUrl,
    image: imageUrl,
    ldJson: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.metaDescription,
      "image": imageUrl,
      "datePublished": "2026-09-19T00:00:00+05:30",
      "dateModified": "2026-09-19T00:00:00+05:30",
      "author": {
        "@type": "Organization",
        "name": post.author,
        "url": siteUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": "SmartHire",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/favicon.svg`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": postUrl
      },
      "keywords": post.tags.join(', '),
      "articleSection": post.category,
      "inLanguage": "en-US",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${siteUrl}/blog` },
          { "@type": "ListItem", "position": 3, "name": post.title, "item": postUrl }
        ]
      }
    }
  })

  // Find related articles (excluding the active one)
  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== post.slug)
  const ArticleComponent = post.component || C2cW2Article

  return (
    <article style={{ maxWidth: 840, margin: '0 auto', padding: '0 24px 80px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: '#64748B', padding: '24px 0 0', flexWrap: 'wrap' }}>
        <a href="/" style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>Home</a>
        <span>›</span>
        <button
          onClick={() => navigate('/blog')}
          style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}
        >
          Blog
        </button>
        <span>›</span>
        <span style={{ color: '#94A3B8', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.title}
        </span>
      </nav>

      {/* Category, Read time & Date */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '24px 0 16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {post.category}
        </span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>·</span>
        <span style={{ fontSize: 13, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          {post.readTime}
        </span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>·</span>
        <span style={{ fontSize: 13, color: '#64748B' }}>{post.date}</span>
      </div>

      {/* H1 Heading */}
      <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: '#0F172A', lineHeight: 1.22, margin: '0 0 18px', letterSpacing: '-0.025em' }}>
        {post.title}
      </h1>

      {/* Excerpt Lead */}
      <p style={{ fontSize: 17.5, color: '#334155', lineHeight: 1.7, margin: '0 0 28px', fontWeight: 400, borderLeft: '3px solid #FF6B00', paddingLeft: 16 }}>
        {post.excerpt}
      </p>

      {/* Author Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 32 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B00, #FFA040)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
          S
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0F172A' }}>{post.author}</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>SmartHire Editorial · US IT Staffing & Direct-Client Placement</div>
        </div>
      </div>

      {/* Hero Image */}
      <div style={{ marginBottom: 36, position: 'relative' }}>
        <img
          src={post.image}
          alt={`${post.title} — SmartHire Editorial`}
          loading="eager"
          onError={(e) => {
            const currentSrc = e.currentTarget.src || ''
            if (currentSrc.endsWith('.webp')) {
              e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
            } else if (currentSrc.endsWith('.jpg')) {
              e.currentTarget.src = currentSrc.replace(/\.jpg$/, '.webp')
            }
          }}
          style={{ width: '100%', maxHeight: 440, objectFit: 'cover', borderRadius: 14, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'block' }}
        />
      </div>

      {/* ─── Modular Article Content ─── */}
      <ArticleComponent />

      {/* Article Tags */}
      <div style={{ marginTop: 44, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 10 }}>
          Topics:
        </span>
        {post.tags.map(tag => (
          <span
            key={tag}
            style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 600, color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', padding: '3px 10px', borderRadius: 20, marginRight: 6, marginBottom: 6 }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* ─── Related Articles Section ─── */}
      <section style={{ marginTop: 56, paddingTop: 32, borderTop: '2px solid #E2E8F0' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
          Related Industry Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {relatedPosts.map(rel => (
            <div
              key={rel.slug}
              onClick={() => {
                navigate(`/blog/${rel.slug}`)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <img
                src={rel.image}
                alt={rel.title}
                loading="lazy"
                onError={(e) => {
                  const currentSrc = e.currentTarget.src || ''
                  if (currentSrc.endsWith('.webp')) {
                    e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
                  } else if (currentSrc.endsWith('.jpg')) {
                    e.currentTarget.src = currentSrc.replace(/\.jpg$/, '.webp')
                  }
                }}
                style={{ width: '100%', height: 160, objectFit: 'cover' }}
              />
              <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: 6 }}>
                  {rel.category} · {rel.readTime}
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', lineHeight: 1.35 }}>
                  {rel.title}
                </h4>
                <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.55, margin: '0 0 14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {rel.excerpt}
                </p>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Read Article →
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}

/* ─── Blog Catalog / Index View ───────────────────────────────────── */
function BlogIndex() {
  const navigate = useNavigate()
  const siteUrl = 'https://smarthireus.com'

  useSEO({
    title: 'IT Career & Staffing Blog | SmartHire',
    description: 'Expert guides on US IT recruitment trends, H-1B visa options, C2C vs W2 vs 1099 contracts, and direct-client tech hiring. Updated regularly by SmartHire.',
    url: `${siteUrl}/blog`,
    image: `${siteUrl}/images/blog/us-it-recruitment-market-2026-hero.webp`,
    ldJson: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "SmartHire IT Career & Staffing Blog",
      "description": "Expert articles on IT recruitment, work visas, and contracting by SmartHire",
      "url": `${siteUrl}/blog`,
      "publisher": {
        "@type": "Organization",
        "name": "SmartHire",
        "url": siteUrl
      },
      "blogPost": BLOG_POSTS.map(p => ({
        "@type": "BlogPosting",
        "headline": p.title,
        "url": `${siteUrl}/blog/${p.slug}`,
        "datePublished": "2026-09-19",
        "author": { "@type": "Organization", "name": p.author }
      }))
    }
  })

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px 80px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Hero Header */}
      <header style={{ textAlign: 'center', padding: '56px 0 44px' }}>
        <span style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: '#FF6B00', backgroundColor: 'rgba(255, 107, 0, 0.08)', border: '1px solid rgba(255, 107, 0, 0.25)', padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
          SmartHire Insights
        </span>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 900, color: '#0F172A', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          US IT Recruitment & Career Insights
        </h1>
        <p style={{ fontSize: 17, color: '#64748B', lineHeight: 1.65, maxWidth: 660, margin: '0 auto', fontWeight: 400 }}>
          Authoritative intelligence on tech hiring markets, work authorization compliance, and direct-client contracting — curated by SmartHire talent specialists.
        </p>
      </header>

      {/* Articles Grid */}
      <section aria-label="Blog Posts">
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
          Featured Articles (2026 Edition)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
          {BLOG_POSTS.map(post => (
            <article
              key={post.slug}
              onClick={() => navigate(`/blog/${post.slug}`)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.10)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: 210, overflow: 'hidden', background: '#0F172A' }}>
                <img
                  src={post.image}
                  alt={`${post.title} — SmartHire`}
                  loading="lazy"
                  onError={(e) => {
                    const currentSrc = e.currentTarget.src || ''
                    if (currentSrc.endsWith('.webp')) {
                      e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
                    } else if (currentSrc.endsWith('.jpg')) {
                      e.currentTarget.src = currentSrc.replace(/\.jpg$/, '.webp')
                    }
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s ease' }}
                />
                <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {post.category}
                </div>
              </div>

              <div style={{ padding: '22px 24px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, fontSize: 12.5, color: '#94A3B8' }}>
                  <span>⏱ {post.readTime}</span>
                  <span>·</span>
                  <span>{post.date}</span>
                </div>

                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: '0 0 12px', lineHeight: 1.35, letterSpacing: '-0.015em' }}>
                  {post.title}
                </h3>

                <p style={{ fontSize: 14.5, color: '#475569', lineHeight: 1.65, margin: '0 0 20px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.excerpt}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>SmartHire Editorial</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Read Article →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Call to Action Bar */}
      <section style={{ background: 'linear-gradient(135deg, #0B0F19, #161E31)', borderRadius: 16, padding: '36px 40px', marginTop: 52, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
            Explore Verified Direct-Client Requisitions
          </h2>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: 15, lineHeight: 1.6 }}>
            60+ active direct-client requisitions · C2C, W2, and 1099 accepted · State & Enterprise accounts
          </p>
        </div>
        <Link
          to="/jobs"
          style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FF6B00, #FFA040)', color: '#FFFFFF', fontWeight: 800, fontSize: 15, padding: '13px 28px', borderRadius: 10, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          View Open Jobs →
        </Link>
      </section>
    </div>
  )
}

/* ─── Main Blog Router & Layout Component ─────────────────────────── */
export default function Blog() {
  const { slug } = useParams()

  // Match slug or alias
  const post = slug
    ? BLOG_POSTS.find(p => p.slug === slug || (p.aliases && p.aliases.includes(slug)))
    : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFBFD', background: 'radial-gradient(ellipse at 30% 0%, rgba(255, 107, 0, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(37, 99, 235, 0.04) 0%, transparent 60%), #FAFBFD' }}>
      {/* Top Header Navigation */}
      <header role="banner" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Smart<span style={{ color: '#FF6B00' }}>Hire</span>
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: '1px solid #E2E8F0', paddingLeft: 8 }}>Blog</span>
          </Link>

          <nav aria-label="Main navigation" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Link to="/jobs" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', padding: '6px 12px', borderRadius: 7, transition: 'background 0.15s' }}>
              Jobs
            </Link>
            <Link to="/blog" style={{ fontSize: 13.5, fontWeight: 600, color: '#2563EB', textDecoration: 'none', padding: '6px 12px', borderRadius: 7, backgroundColor: '#EFF6FF' }}>
              Blog
            </Link>
            <Link to="/about" style={{ fontSize: 13.5, fontWeight: 600, color: '#475569', textDecoration: 'none', padding: '6px 12px', borderRadius: 7 }}>
              About
            </Link>
            <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#FFFFFF', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', marginLeft: 4 }}>
              Apply Now
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" role="main">
        {post ? <BlogPostContent post={post} /> : <BlogIndex />}
      </main>

      {/* Footer */}
      <footer role="contentinfo" style={{ backgroundColor: '#0B0F19', color: '#94A3B8', padding: '36px 24px', textAlign: 'center', fontSize: 13.5 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#CBD5E1', fontSize: 15 }}>
            Smart<span style={{ color: '#FF6B00' }}>Hire</span>
          </p>
          <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>
            Direct-client IT staffing | State, Healthcare & Enterprise Contracts | Remote · Hybrid · Onsite
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            {[['Jobs', '/jobs'], ['Blog', '/blog'], ['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy']].map(([label, href]) => (
              <Link key={label} to={href} style={{ color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>{label}</Link>
            ))}
          </div>
          <p style={{ margin: 0, color: '#334155', fontSize: 12 }}>© 2026 SmartHire. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
