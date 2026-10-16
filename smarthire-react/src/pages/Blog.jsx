import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import C2cW2Article from './blog-articles/C2cW2Article'
import UsItMarket2026Article from './blog-articles/UsItMarket2026Article'
import H1b2026Article from './blog-articles/H1b2026Article'
import IndiaVsUsaJobs2026Article from './blog-articles/IndiaVsUsaJobs2026Article'
import HighestPayingCertifications2026Article from './blog-articles/HighestPayingCertifications2026Article'
import AiEntryLevelJobs2026Article from './blog-articles/AiEntryLevelJobs2026Article'
import DataCenterStaffingBoomArticle from './blog-articles/DataCenterStaffingBoomArticle'
import ShareSheet from '../components/ui/ShareSheet'

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
    set('og:site_name', 'SmartHire Publication', true)
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
    slug: 'data-center-staffing-boom',
    aliases: ['data-center-jobs-2026', 'ai-data-center-staffing', 'data-center-staffing-boom-it-roles-us-companies-are-hiring-for'],
    title: "Data Center Staffing Boom: Which IT Roles US Companies Are Hiring For",
    metaTitle: "Data Center Staffing Boom: In-Demand IT Roles in 2026 | SmartHire",
    metaDescription: "Data center hiring is exploding across the US. See which roles are hardest to fill in 2026, what they pay, where the jobs are, and how to get hired.",
    excerpt: "The buildout behind AI and cloud is so massive that hiring human talent—not capital—has become the bottleneck. 81% of IT staffing leaders report surging data center demand. Here is the full guide to in-demand roles, pay signals, and hiring hotspots in 2026.",
    category: "IT Career Guide",
    readTime: "7 min read",
    date: "October 12, 2026",
    author: "Omkesh Singh Thakur",
    authorUrl: "https://omkeshsinghthakur.com",
    authorRole: "Talent Acquisition Strategist & Senior Technical Recruiter",
    authorBio: "Omkesh is a talent acquisition strategist, enterprise ATS architect, and technical recruiter specializing in US IT staffing, AI infrastructure sourcing, and contract compliance across Fortune 500 and government accounts.",
    caption: "Inside a modern US enterprise hyperscale data center facility. Certified critical facility engineers and high-voltage technicians manage 24/7 power distribution, liquid cooling loops, and high-density compute clusters.",
    tags: ["Data Center Jobs", "AI Infrastructure", "Critical Facility Technicians", "Liquid Cooling", "Electricians", "IT Staffing 2026"],
    image: "/images/blog/data-center-staffing-boom-hero.webp",
    component: DataCenterStaffingBoomArticle
  },
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
    authorRole: "Technical Recruiting Research Group",
    authorBio: "The SmartHire Editorial Research Group curates empirical hiring trends, compensation datasets, and talent benchmarks across direct-client US enterprise staffing.",
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
    authorRole: "Technical Recruiting Research Group",
    authorBio: "The SmartHire Editorial Research Group curates empirical hiring trends, compensation datasets, and talent benchmarks across direct-client US enterprise staffing.",
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
    authorRole: "Technical Recruiting Research Group",
    authorBio: "The SmartHire Editorial Research Group curates empirical hiring trends, compensation datasets, and talent benchmarks across direct-client US enterprise staffing.",
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
    authorRole: "Technical Recruiting Research Group",
    authorBio: "The SmartHire Editorial Research Group curates empirical hiring trends, compensation datasets, and talent benchmarks across direct-client US enterprise staffing.",
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
    authorRole: "Technical Recruiting Research Group",
    authorBio: "The SmartHire Editorial Research Group curates empirical hiring trends, compensation datasets, and talent benchmarks across direct-client US enterprise staffing.",
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
    category: "Contracting & Rates",
    readTime: "9 min read",
    date: "September 5, 2026",
    author: "SmartHire Editorial Team",
    authorRole: "Technical Recruiting Research Group",
    authorBio: "The SmartHire Editorial Research Group curates empirical hiring trends, compensation datasets, and talent benchmarks across direct-client US enterprise staffing.",
    tags: ["C2C", "W2", "1099", "IT Contracts", "IT Consulting", "Tax Strategy", "Hourly Rates"],
    image: "/career-hero-slide2.jpg",
    component: C2cW2Article
  }
]

/* ─── Single Blog Post View (WordPress Editorial Style) ────────────── */
function BlogPostContent({ post }) {
  const navigate = useNavigate()
  const siteUrl = 'https://smarthireus.com'
  const postUrl = `${siteUrl}/blog/${post.slug}`
  const imageUrl = post.image.startsWith('http') ? post.image : `${siteUrl}${post.image}`

  // Reading progress tracker (classic WordPress plugin behavior)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      if (docHeight > 0) {
        const scrolled = (window.scrollY / docHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, scrolled)))
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2200)
    }
  }

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
      "datePublished": post.date.includes('October') ? "2026-10-12T00:00:00+05:30" : "2026-09-19T00:00:00+05:30",
      "dateModified": "2026-10-12T00:00:00+05:30",
      "author": {
        "@type": post.authorUrl ? "Person" : "Organization",
        "name": post.author,
        "url": post.authorUrl || siteUrl
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

  // Previous and next post calculation
  const currentIndex = BLOG_POSTS.findIndex(p => p.slug === post.slug)
  const prevPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null
  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3)
  const ArticleComponent = post.component || C2cW2Article

  const isOmkesh = post.author.includes('Omkesh')

  return (
    <>
      {/* WordPress Reading Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
        style={{
          position: 'fixed',
          top: 58,
          left: 0,
          height: 3,
          width: `${scrollProgress}%`,
          backgroundColor: '#0D6B5F',
          zIndex: 999,
          transition: 'width 0.1s ease-out'
        }}
      />

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '0 22px 80px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {/* WordPress Editorial Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: '#64748B', padding: '28px 0 16px', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#0D6B5F', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
          <span>/</span>
          <Link to="/blog" style={{ color: '#0D6B5F', textDecoration: 'none', fontWeight: 500 }}>Blog</Link>
          <span>/</span>
          <span style={{ color: '#94A3B8', textTransform: 'capitalize' }}>{post.category}</span>
        </nav>

        {/* Category Badge & Meta */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0D6B5F', backgroundColor: '#E6F4F1', padding: '4px 12px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {post.category}
          </span>
          <span style={{ fontSize: 13, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {post.readTime}
          </span>
          <span style={{ fontSize: 12, color: '#CBD5E1' }}>•</span>
          <span style={{ fontSize: 13, color: '#64748B' }}>{post.date}</span>
        </div>

        {/* H1 Headline */}
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, color: '#111827', lineHeight: 1.25, margin: '0 0 20px', letterSpacing: '-0.025em', fontFamily: "Georgia, Cambria, 'Times New Roman', serif" }}>
          {post.title}
        </h1>

        {/* Editorial Subtitle / Excerpt Lead */}
        <p style={{ fontSize: 18, color: '#374151', lineHeight: 1.7, margin: '0 0 28px', fontStyle: 'normal', borderLeft: '3px solid #0D6B5F', paddingLeft: 18 }}>
          {post.excerpt}
        </p>

        {/* WordPress Author Byline Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: isOmkesh ? '#0D6B5F' : '#1E293B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
              {isOmkesh ? 'O' : 'S'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
                {post.authorUrl ? (
                  <a href={post.authorUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#111827', textDecoration: 'none' }}>
                    {post.author} &nearr;
                  </a>
                ) : (
                  post.author
                )}
              </div>
              <div style={{ fontSize: 12.5, color: '#6B7280' }}>
                {post.authorRole || 'SmartHire Editorial · US IT Staffing'}
              </div>
            </div>
          </div>

          {/* Social Share & Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShareSheet
              url={postUrl}
              title={post.title}
              trigger={
                <button
                  type="button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12.5,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share Article
                </button>
              }
            />
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on LinkedIn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 12.5, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
              LinkedIn
            </a>
            <button
              onClick={handleCopyLink}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', background: copiedLink ? '#0D6B5F' : '#FFFFFF', border: `1px solid ${copiedLink ? '#0D6B5F' : '#D1D5DB'}`, color: copiedLink ? '#FFFFFF' : '#374151', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Featured Hero Image (WordPress Gutenberg Block with Caption) */}
        <figure style={{ margin: '0 0 36px' }}>
          <img
            src={post.image}
            alt={`${post.title} — SmartHire Publication`}
            loading="eager"
            onError={(e) => {
              const currentSrc = e.currentTarget.src || ''
              if (currentSrc.endsWith('.webp')) {
                e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
              } else if (currentSrc.endsWith('.jpg')) {
                e.currentTarget.src = currentSrc.replace(/\.jpg$/, '.webp')
              }
            }}
            style={{ width: '100%', maxHeight: 460, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB', display: 'block' }}
          />
          {post.caption && (
            <figcaption style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              {post.caption}
            </figcaption>
          )}
        </figure>

        {/* ─── Modular Article Content ─── */}
        <ArticleComponent />

        {/* Article Tags */}
        <div style={{ marginTop: 44, paddingTop: 20, borderTop: '1px solid #E5E7EB' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 10 }}>
            Categorized Under:
          </span>
          {post.tags.map(tag => (
            <span
              key={tag}
              style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#0D6B5F', backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7', padding: '3px 10px', borderRadius: 4, marginRight: 6, marginBottom: 6 }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* WordPress "About the Author" Box */}
        <div style={{ marginTop: 36, padding: '24px 28px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: isOmkesh ? '#0D6B5F' : '#1E293B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
            {isOmkesh ? 'O' : 'S'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', fontWeight: 700, marginBottom: 4 }}>
              About the Author
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
              {post.author}
            </div>
            <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, margin: '0 0 10px' }}>
              {post.authorBio || 'Senior talent acquisition strategist and enterprise technical recruiter at SmartHire.'}
            </p>
            {post.authorUrl && (
              <a href={post.authorUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#0D6B5F', fontWeight: 700, textDecoration: 'none' }}>
                Visit Author Website &rarr;
              </a>
            )}
          </div>
        </div>

        {/* WordPress Post Navigation (Previous / Next Article) */}
        {(prevPost || nextPost) && (
          <nav aria-label="Post navigation" style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: prevPost && nextPost ? '1fr 1fr' : '1fr', gap: 16 }}>
            {prevPost && (
              <div
                onClick={() => {
                  navigate(`/blog/${prevPost.slug}`)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{ padding: '16px 20px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', backgroundColor: '#FFFFFF', transition: 'border-color 0.15s ease' }}
              >
                <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
                  &larr; Previous Article
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                  {prevPost.title}
                </div>
              </div>
            )}
            {nextPost && (
              <div
                onClick={() => {
                  navigate(`/blog/${nextPost.slug}`)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{ padding: '16px 20px', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', backgroundColor: '#FFFFFF', textAlign: 'right', transition: 'border-color 0.15s ease' }}
              >
                <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 }}>
                  Next Article &rarr;
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                  {nextPost.title}
                </div>
              </div>
            )}
          </nav>
        )}

        {/* Related Articles Section */}
        <section style={{ marginTop: 52, paddingTop: 32, borderTop: '2px solid #E5E7EB' }}>
          <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 800, marginBottom: 20 }}>
            More from SmartHire Publication
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {relatedPosts.map(rel => (
              <div
                key={rel.slug}
                onClick={() => {
                  navigate(`/blog/${rel.slug}`)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.18s ease'
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
                  style={{ width: '100%', height: 140, objectFit: 'cover' }}
                />
                <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0D6B5F', textTransform: 'uppercase', marginBottom: 4 }}>
                    {rel.category} · {rel.readTime}
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 8px', lineHeight: 1.35 }}>
                    {rel.title}
                  </h4>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0D6B5F', marginTop: 'auto' }}>
                    Read Guide &rarr;
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </article>
    </>
  )
}

/* ─── Blog Catalog / Index View (WordPress Magazine Style) ────────── */
function BlogIndex() {
  const navigate = useNavigate()
  const siteUrl = 'https://smarthireus.com'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useSEO({
    title: 'IT Career & Staffing Publication | SmartHire',
    description: 'Expert editorial guides on US IT recruitment trends, data center hiring, H-1B visas, C2C contracts, and engineering salary data.',
    url: `${siteUrl}/blog`,
    image: `${siteUrl}/images/blog/data-center-staffing-boom-hero.webp`,
    ldJson: {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "SmartHire Publication",
      "description": "Editorial research and intelligence on US technical staffing, data centers, and work visas",
      "url": `${siteUrl}/blog`,
      "publisher": {
        "@type": "Organization",
        "name": "SmartHire",
        "url": siteUrl
      }
    }
  })

  // Categories
  const categories = ['All', 'IT Career Guide', 'Market Trends', 'Immigration & Compliance', 'Contracting & Rates']

  // Filtered posts
  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesCat = selectedCategory === 'All' || post.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery = !q || post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q) || (post.tags && post.tags.some(t => t.toLowerCase().includes(q)))
    return matchesCat && matchesQuery
  })

  // Lead featured story (newest post)
  const leadPost = BLOG_POSTS[0]
  const isDefaultView = selectedCategory === 'All' && !searchQuery

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px 80px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* WordPress Publication Masthead */}
      <header style={{ textAlign: 'center', padding: '52px 0 36px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#0D6B5F', backgroundColor: '#E6F4F1', padding: '4px 14px', borderRadius: 4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
          Editorial Intelligence
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#111827', margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.15, fontFamily: "Georgia, Cambria, serif" }}>
          SmartHire IT Staffing & Career Publication
        </h1>
        <p style={{ fontSize: 17, color: '#4B5563', lineHeight: 1.65, maxWidth: 680, margin: '0 auto', fontWeight: 400 }}>
          Practical, fact-checked intelligence on US engineering hiring, data center infrastructure, work authorization pathways, and direct-client contracting.
        </p>

        {/* Search Bar & Category Filter Strip */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by title, role, skill, or visa..."
              style={{
                width: '100%',
                padding: '11px 16px 11px 40px',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                boxSizing: 'border-box'
              }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#0D6B5F' : '#E5E7EB',
                  backgroundColor: selectedCategory === cat ? '#0D6B5F' : '#FFFFFF',
                  color: selectedCategory === cat ? '#FFFFFF' : '#4B5563',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Featured Lead Story (WordPress Magazine Hero) */}
      {isDefaultView && (
        <section aria-label="Featured Story" style={{ margin: '40px 0 48px' }}>
          <div
            onClick={() => navigate(`/blog/${leadPost.slug}`)}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              overflow: 'hidden',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.08)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.04)'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{ position: 'relative', minHeight: 280, maxHeight: 400 }}>
              <img
                src={leadPost.image}
                alt={leadPost.title}
                loading="eager"
                onError={(e) => {
                  const currentSrc = e.currentTarget.src || ''
                  if (currentSrc.endsWith('.webp')) {
                    e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <span style={{ position: 'absolute', top: 16, left: 16, backgroundColor: '#0D6B5F', color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Featured Lead Story
              </span>
            </div>

            <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0D6B5F', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                {leadPost.category} · {leadPost.readTime}
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#111827', margin: '0 0 14px', lineHeight: 1.3, letterSpacing: '-0.02em', fontFamily: "Georgia, Cambria, serif" }}>
                {leadPost.title}
              </h2>
              <p style={{ fontSize: 15.5, color: '#4B5563', lineHeight: 1.65, margin: '0 0 22px' }}>
                {leadPost.excerpt}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#0D6B5F', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>
                    O
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{leadPost.author}</div>
                    <div style={{ fontSize: 11.5, color: '#6B7280' }}>{leadPost.date}</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0D6B5F' }}>
                  Read Full Story &rarr;
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid of Articles */}
      <section aria-label="Article Grid">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            {isDefaultView ? 'All Publications & Reports' : `Articles in ${selectedCategory} (${filteredPosts.length})`}
          </h2>
        </div>

        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: 16, color: '#6B7280', margin: '0 0 12px' }}>
              No guides found matching "{searchQuery}".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              style={{ background: 'none', border: 'none', color: '#0D6B5F', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
            >
              Clear filters and view all
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
            {filteredPosts
              .filter(post => !isDefaultView || post.slug !== leadPost.slug)
              .map(post => (
                <article
                  key={post.slug}
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.18s ease, transform 0.18s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,0,0,0.06)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: 180, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
                    <img
                      src={post.image}
                      alt={`${post.title} — SmartHire`}
                      loading="lazy"
                      onError={(e) => {
                        const currentSrc = e.currentTarget.src || ''
                        if (currentSrc.endsWith('.webp')) {
                          e.currentTarget.src = currentSrc.replace(/\.webp$/, '.jpg')
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(17, 24, 39, 0.85)', color: '#FFFFFF', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {post.category}
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, fontSize: 12, color: '#6B7280' }}>
                      <span>{post.readTime}</span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 10px', lineHeight: 1.35, letterSpacing: '-0.015em', fontFamily: "Georgia, Cambria, serif" }}>
                      {post.title}
                    </h3>

                    <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, margin: '0 0 18px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.excerpt}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{post.author}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0D6B5F' }}>
                        Read Guide &rarr;
                      </span>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>

      {/* WordPress Newsletter / Direct Client Staffing Banner */}
      <section style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '36px 40px', marginTop: 56, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 6px', fontFamily: "Georgia, Cambria, serif" }}>
            Explore Verified US Direct-Client Requisitions
          </h2>
          <p style={{ color: '#4B5563', margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>
            Browse active direct-client IT roles across State, Healthcare, and Enterprise accounts. C2C, W2, and 1099 accepted.
          </p>
        </div>
        <Link
          to="/jobs"
          style={{ display: 'inline-block', backgroundColor: '#0D6B5F', color: '#FFFFFF', fontWeight: 700, fontSize: 14, padding: '11px 24px', borderRadius: 6, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          View Open Jobs &rarr;
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
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', color: '#111827' }}>
      {/* Top Header Navigation (WordPress Magazine Style) */}
      <header role="banner" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em' }}>
              Smart<span style={{ color: '#0D6B5F' }}>Hire</span>
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', borderLeft: '1px solid #E5E7EB', paddingLeft: 10 }}>Publication</span>
          </Link>

          <nav aria-label="Main navigation" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Link to="/jobs" style={{ fontSize: 13.5, fontWeight: 600, color: '#4B5563', textDecoration: 'none', padding: '6px 12px', borderRadius: 6 }}>
              Careers
            </Link>
            <Link to="/blog" style={{ fontSize: 13.5, fontWeight: 600, color: '#0D6B5F', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, backgroundColor: '#E6F4F1' }}>
              Publication
            </Link>
            <Link to="/about" style={{ fontSize: 13.5, fontWeight: 600, color: '#4B5563', textDecoration: 'none', padding: '6px 12px', borderRadius: 6 }}>
              About
            </Link>
            <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#FFFFFF', backgroundColor: '#0D6B5F', padding: '7px 16px', borderRadius: 6, textDecoration: 'none', marginLeft: 4 }}>
              Apply for Jobs
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" role="main">
        {post ? <BlogPostContent post={post} /> : <BlogIndex />}
      </main>

      {/* WordPress Publication Footer */}
      <footer role="contentinfo" style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', color: '#6B7280', padding: '40px 24px 32px', textAlign: 'center', fontSize: 13.5 }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <p style={{ margin: '0 0 6px', fontWeight: 800, color: '#111827', fontSize: 16 }}>
            Smart<span style={{ color: '#0D6B5F' }}>Hire</span> Publication
          </p>
          <p style={{ margin: '0 0 16px', color: '#6B7280', fontSize: 13.5, lineHeight: 1.6 }}>
            Direct-client IT recruitment intelligence | US Enterprise & Public Sector IT Staffing | C2C · W2 · 1099
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            {[['Careers', '/jobs'], ['Publication', '/blog'], ['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy']].map(([label, href]) => (
              <Link key={label} to={href} style={{ color: '#4B5563', textDecoration: 'none', fontWeight: 500 }}>{label}</Link>
            ))}
          </div>
          <p style={{ margin: 0, color: '#9CA3AF', fontSize: 12 }}>© 2026 SmartHire / COOLSOFT LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
