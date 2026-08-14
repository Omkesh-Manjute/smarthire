import React from 'react'
import Navigation from './Navigation'
import Footer from './Footer'

function SiteLayout({ children }) {
  return (
    <div className="app-shell">
      <Navigation />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

export default SiteLayout
