import React from 'react'
import { Link } from 'react-router-dom'
import SocialFlipButton from './ui/SocialFlipButton'

function Footer() {
  return (
    <footer className="site-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff', padding: '32px 0 24px' }}>
      <div className="container footer-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        {/* VengeanceUI Social Flip Button (C - O - N - T - A - C - T) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
            Connect with SmartHire Enterprise
          </span>
          <SocialFlipButton />
        </div>

        <div className="footer-links" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/smartscreen" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>SmartScreen AI</Link>
          <Link to="/jobs" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Careers Portal</Link>
          <Link to="/blog" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Talent Insights Blog</Link>
          <Link to="/about#support" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Help & Support</Link>
          <Link to="/privacy" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link>
          <Link to="/about" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Contact Enterprise Sales</Link>
        </div>

        <p style={{ margin: 0, fontSize: 12.5, color: '#94a3b8' }}>&copy; 2026 SmartHire Enterprise ATS. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
