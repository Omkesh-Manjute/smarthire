import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './footer.css'

function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterJoined, setNewsletterJoined] = useState(false)

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) return
    setNewsletterJoined(true)
    setTimeout(() => {
      setNewsletterEmail('')
      setNewsletterJoined(false)
    }, 4000)
  }

  return (
    <footer className="praximind-footer">
      <div className="praximind-footer-container">
        {/* Main 4-Column Layout */}
        <div className="praximind-footer-grid">
          
          {/* Column 1: Brand & Parent Company */}
          <div className="praximind-footer-brand-col">
            <Link to="/" className="praximind-footer-logo-link">
              <div className="smarthire-footer-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div className="praximind-footer-logo-text">
                <span className="pm-brand-name">SmartHire ATS</span>
                <span className="pm-parent-badge">A Product of Praximind Pvt. Ltd.</span>
              </div>
            </Link>

            <p className="praximind-footer-desc">
              Enterprise applicant tracking, autonomous proctored video screening, and semantic talent intelligence for high-velocity recruiting teams.
            </p>

            {/* Social / Direct Support Buttons */}
            <div className="praximind-footer-socials">
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pm-social-btn"
                title="SmartHire on LinkedIn"
                aria-label="LinkedIn"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </a>

              <a
                href="mailto:support@praximinds.com"
                className="pm-social-btn"
                title="Direct Support Desk (support@praximinds.com)"
                aria-label="Email Support"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: PLATFORM (Actual ATS Features) */}
          <div className="praximind-footer-col">
            <h4 className="pm-col-title">PLATFORM</h4>
            <ul className="pm-links-list">
              <li><Link to="/smartscreen">SmartScreen AI</Link></li>
              <li><Link to="/jobs">Careers &amp; Jobs</Link></li>
              <li><Link to="/sign-rtr">SmartSign RTR</Link></li>
              <li><Link to="/about">About Platform</Link></li>
            </ul>
          </div>

          {/* Column 3: RESOURCES (Real ATS Pages) */}
          <div className="praximind-footer-col">
            <h4 className="pm-col-title">RESOURCES</h4>
            <ul className="pm-links-list">
              <li><Link to="/blog">Talent Insights Blog</Link></li>
              <li><Link to="/about#support">Help &amp; Support</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: STAY CONNECTED */}
          <div className="praximind-footer-col praximind-footer-connect-col">
            <h4 className="pm-col-title">STAY CONNECTED</h4>
            <p className="pm-connect-text">
              Join our talent network to receive the latest hiring intelligence &amp; ATS feature updates.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="pm-newsletter-form">
              <input
                type="email"
                required
                placeholder="Email Address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="pm-newsletter-input"
              />
              <button type="submit" className="pm-newsletter-btn">
                {newsletterJoined ? '✓' : 'JOIN'}
              </button>
            </form>

            <div className="pm-direct-support-text">
              Direct Support:{' '}
              <a href="mailto:support@praximinds.com" className="pm-support-email-link">
                support@praximinds.com
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="praximind-footer-bottom">
          <div className="pm-bottom-copy">
            &copy; {new Date().getFullYear()} Praximind Pvt. Ltd. All rights reserved. &bull; SmartHire ATS
          </div>
          <div className="pm-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/about#support">Support Desk</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
