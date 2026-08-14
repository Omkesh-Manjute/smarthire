import React from 'react'
import SiteLayout from '../components/SiteLayout'

function About() {
  return (
    <SiteLayout>
      <section className="section">
        <div className="container narrow">
          <p className="eyebrow">About VerifyHire</p>
          <h1 className="page-title">Built to reduce candidate fraud noise.</h1>
          <p>
            VerifyHire is designed for recruiters who need a quick trust signal before submission. This version is
            intentionally frontend-only, so your team can validate UX and workflow decisions before backend rollout.
          </p>
          <div className="card-list">
            <div className="card"><h3>Clear scoring</h3><p>Every trust point is visible and explainable.</p></div>
            <div className="card"><h3>Modular architecture</h3><p>Shared layout and reusable styles simplify future updates.</p></div>
            <div className="card"><h3>Production-ready direction</h3><p>UI now follows a consistent structure for easier scaling.</p></div>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export default About
