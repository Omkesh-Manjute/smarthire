import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-wrap">
        <p>&copy; 2026 SmartHire Enterprise. All rights reserved.</p>
        <div className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/contact">Support Contact</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
