import React from 'react'

// ─── PARTNER BRANDS ──────────────────────────────────────────────────────────
export function AirbnbLogo({ style = {}, className = '' }) {
  return (
    <svg viewBox="0 0 118 32" height="24" fill="currentColor" style={style} className={className}>
      <path d="M14.5 1.5C12.8 1.5 11.2 2.8 10 4.8 8.8 2.8 7.2 1.5 5.5 1.5 2.5 1.5 0 4.1 0 7.8c0 5.4 6.8 11.2 10 13.8 3.2-2.6 10-8.4 10-13.8 0-3.7-2.5-6.3-5.5-6.3zm-4.5 16.5c-2.3-2-6.5-6.1-6.5-10.2 0-2.1 1.3-3.6 3-3.6 1.4 0 2.8 1.3 3.5 3.3.7-2 2.1-3.3 3.5-3.3 1.7 0 3 1.5 3 3.6 0 4.1-4.2 8.2-6.5 10.2z" />
      <text x="26" y="16" fontFamily="'Barlow', 'DM Sans', sans-serif" fontSize="18" fontWeight="800" letterSpacing="-0.5px">airbnb</text>
    </svg>
  )
}

export function DropboxLogo({ style = {}, className = '' }) {
  return (
    <svg viewBox="0 0 120 30" height="22" fill="currentColor" style={style} className={className}>
      <path d="M5.5 0L0 3.7l5.5 3.7 5.5-3.7L5.5 0zm11 0l-5.5 3.7 5.5 3.7 5.5-3.7L16.5 0zM0 11.1l5.5 3.7 5.5-3.7-5.5-3.7L0 11.1zm16.5-3.7l-5.5 3.7 5.5 3.7 5.5-3.7-5.5-3.7zM5.5 16.3l5.5 3.7 5.5-3.7-5.5-3.7-5.5 3.7z" />
      <text x="28" y="15" fontFamily="'Barlow', 'DM Sans', sans-serif" fontSize="17" fontWeight="800" letterSpacing="-0.5px">Dropbox</text>
    </svg>
  )
}

export function FacebookLogo({ style = {}, className = '' }) {
  return (
    <svg viewBox="0 0 120 30" height="22" fill="currentColor" style={style} className={className}>
      <path d="M19 0H3C1.3 0 0 1.3 0 3v16c0 1.7 1.3 3 3 3h8v-8.5H8.5V10H11V7.3C11 4.8 12.5 3.4 14.8 3.4c1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V10h2.8l-.4 3.5h-2.4V22H19c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3z" />
      <text x="28" y="16" fontFamily="'Barlow', 'DM Sans', sans-serif" fontSize="18" fontWeight="800" letterSpacing="-0.5px">facebook</text>
    </svg>
  )
}

export function GoogleLogo({ style = {}, className = '' }) {
  return (
    <svg viewBox="0 0 110 30" height="22" fill="currentColor" style={style} className={className}>
      <path d="M10.8 13.2v-3.7h9.5c.1.6.2 1.3.2 2.1 0 2.5-.7 4.6-2.1 6-1.5 1.5-3.5 2.4-6.1 2.4-4.8 0-8.7-3.9-8.7-8.7S7.5 2.6 12.3 2.6c2.4 0 4.2.9 5.5 2.1l-2.6 2.6c-.8-.8-1.8-1.3-2.9-1.3-2.7 0-4.9 2.2-4.9 4.9s2.2 4.9 4.9 4.9c2 0 3.3-.9 3.8-2.6h-5.3z" />
      <text x="26" y="16" fontFamily="'Barlow', 'DM Sans', sans-serif" fontSize="18" fontWeight="800" letterSpacing="-0.5px">Google</text>
    </svg>
  )
}

// ─── CANDIDATE 3-STEP ICONS (SCREENSHOT 2) ──────────────────────────────────
export function Step1SignUpIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <rect x="6" y="10" width="56" height="30" rx="15" stroke="#FA541C" strokeWidth="2.5" />
      <text x="34" y="29" textAnchor="middle" fill="#FA541C" fontFamily="'Barlow', sans-serif" fontSize="11" fontWeight="800" letterSpacing="0.8px">SIGN UP</text>
      <path d="M34 32v18a4 4 0 0 0 8 0v-4" stroke="#FA541C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 42a4 4 0 0 0 6-3.5v-7a3.5 3.5 0 0 0-7 0" stroke="#FA541C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 44v-4a4 4 0 0 1 8-2" stroke="#FA541C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 44a8 8 0 0 0 16 0" stroke="#FA541C" strokeWidth="2.5" />
    </svg>
  )
}

export function Step2ProfileIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <rect x="14" y="8" width="38" height="50" rx="6" stroke="#FA541C" strokeWidth="2.5" />
      <circle cx="28" cy="22" r="5" stroke="#FA541C" strokeWidth="2.2" />
      <path d="M22 34c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#FA541C" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="20" y1="40" x2="36" y2="40" stroke="#FA541C" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="20" y1="46" x2="32" y2="46" stroke="#FA541C" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42 46l10-18 4 2-10 18-4 1 0-3z" stroke="#FA541C" strokeWidth="2.2" strokeLinejoin="round" fill="rgba(250, 84, 28, 0.12)" />
    </svg>
  )
}

export function Step3SearchJobIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <circle cx="30" cy="30" r="18" stroke="#FA541C" strokeWidth="2.5" />
      <line x1="43" y1="43" x2="58" y2="58" stroke="#FA541C" strokeWidth="3.5" strokeLinecap="round" />
      <text x="30" y="34" textAnchor="middle" fill="#FA541C" fontFamily="'Barlow', sans-serif" fontSize="13" fontWeight="900" letterSpacing="0.8px">JOB</text>
    </svg>
  )
}

// ─── 8 HOT CATEGORIES ICONS (SCREENSHOT 3) ──────────────────────────────────
export function CategoryFinanceIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}

export function CategoryMarketingIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}

export function CategoryDesignIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 11 3-3-3-3-3 3 3 3z" />
      <path d="m14 13-9 9H2v-3l9-9" />
      <circle cx="14" cy="6" r="2" />
    </svg>
  )
}

export function CategoryDevIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="3" />
      <path d="m8 10-3 2 3 2" />
      <path d="m16 10 3 2-3 2" />
      <path d="m13 9-2 6" />
    </svg>
  )
}

export function CategoryHardwareIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="5" y="5" rx="2" />
      <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function CategoryCustomerServiceIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
      <path d="M19 19a3 3 0 0 1-3 3h-2" />
    </svg>
  )
}

export function CategoryHealthcareIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  )
}

export function CategoryBankingIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 10-5 10 5v2H2zM4 10v9M9 10v9M15 10v9M20 10v9M2 20h20" />
    </svg>
  )
}

// ─── JOB CARD META ICONS (SCREENSHOT 4) ──────────────────────────────────────
export function BarChartExpIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function ClockContractIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function CashSalaryIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

export function WorkModeUserIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function HeartBookmarkIcon({ saved = false, size = 20, color = '#FA541C', onClick, title = 'Save Job' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: saved ? color : '#919EAB',
        transition: 'all 0.15s ease'
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={saved ? color : 'none'} stroke={saved ? color : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  )
}

export function LocationPinIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

// ─── HERO ORBITAL ILLUSTRATION (SCREENSHOT 1) ───────────────────────────────
export function ZoneHeroOrbitalIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 540, height: 500, margin: '0 auto' }}>
      {/* Background Orbit Track */}
      <svg
        viewBox="0 0 540 500"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
        <defs>
          <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FA541C" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#8E33FF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#141A21" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx="270" cy="250" r="210" fill="url(#orbitGlow)" />

        {/* Outer Orbit Line with subtle dashes */}
        <circle
          cx="270"
          cy="250"
          r="190"
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Orbit Node Dots */}
        <circle cx="80" cy="250" r="5" fill="#00B8D9" />
        <circle cx="460" cy="250" r="5" fill="#22C55E" />
        <circle cx="270" cy="60" r="5" fill="#FFAB00" />
        <circle cx="395" cy="120" r="7" fill="#FA541C" />
        <circle cx="140" cy="380" r="6" fill="#8E33FF" />
      </svg>

      {/* Center Character Vector Graphic */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -46%)',
        zIndex: 5,
        width: 260,
        height: 380,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg viewBox="0 0 260 380" width="100%" height="100%">
          <defs>
            <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8E33FF" />
              <stop offset="100%" stopColor="#5119B7" />
            </linearGradient>
            <linearGradient id="pantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FA541C" />
              <stop offset="100%" stopColor="#B3200E" />
            </linearGradient>
          </defs>

          {/* Shadow */}
          <ellipse cx="130" cy="365" rx="70" ry="12" fill="rgba(0,0,0,0.35)" />

          {/* Legs & Shoes */}
          <path d="M110 240 L85 340 L105 346 L130 260 Z" fill="url(#pantsGrad)" />
          <path d="M140 240 L175 320 L210 326 L160 250 Z" fill="url(#pantsGrad)" />
          {/* Shoes */}
          <path d="M72 342 Q85 338 105 346 Q90 354 72 348 Z" fill="#B3200E" />
          <path d="M200 322 Q215 320 225 330 Q205 338 195 326 Z" fill="#B3200E" />

          {/* Torso */}
          <path d="M100 130 C100 130 160 120 170 170 C175 195 160 250 140 250 C120 250 100 230 100 180 Z" fill="url(#shirtGrad)" />

          {/* Arms holding the portfolio */}
          <path d="M110 140 L70 180 L90 195 L125 165 Z" fill="url(#shirtGrad)" />
          <path d="M155 145 L180 185 L165 200 L140 170 Z" fill="url(#shirtGrad)" />

          {/* Head & Neck */}
          <path d="M130 115 L130 135 L145 135 L145 115 Z" fill="#FDAB76" />
          <circle cx="140" cy="95" r="22" fill="#FDAB76" />
          {/* Hair & Beard */}
          <path d="M122 92 C120 70 155 70 160 85 C162 95 155 105 145 105 C140 105 135 118 128 116 C124 114 122 105 122 92 Z" fill="#1C252E" />
          <circle cx="148" cy="93" r="2.5" fill="#1C252E" />
        </svg>
      </div>

      {/* Floating Category Badges on the Orbit matching Screenshot 1 */}

      {/* Badge 1: Accounting (Top Left) */}
      <div style={{
        position: 'absolute',
        top: '13%',
        left: '2%',
        background: '#FFFFFF',
        color: '#1C252E',
        borderRadius: 16,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.45)',
        zIndex: 10,
        animation: 'floatSlow 4s ease-in-out infinite'
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #FFD666, #FFAB00)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>
          🧮
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Barlow', sans-serif" }}>
          Accounting
        </div>
      </div>

      {/* Badge 2: Health care (Right Top) */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '2%',
        background: '#FFFFFF',
        color: '#1C252E',
        borderRadius: 16,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.45)',
        zIndex: 10,
        animation: 'floatSlow 5s ease-in-out infinite 0.5s'
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #FFAC82, #FF5630)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>
          ❤️
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Barlow', sans-serif" }}>
          Health care
        </div>
      </div>

      {/* Badge 3: Software (Middle Left) */}
      <div style={{
        position: 'absolute',
        top: '48%',
        left: '12%',
        background: '#FFFFFF',
        color: '#1C252E',
        borderRadius: 16,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.45)',
        zIndex: 10,
        animation: 'floatSlow 4.5s ease-in-out infinite 1s'
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #FDAB76, #FA541C)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>
          ⚙️
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Barlow', sans-serif" }}>
          Software
        </div>
      </div>

      {/* Badge 4: Banking (Bottom Right) */}
      <div style={{
        position: 'absolute',
        bottom: '22%',
        right: '6%',
        background: '#FFFFFF',
        color: '#1C252E',
        borderRadius: 16,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.45)',
        zIndex: 10,
        animation: 'floatSlow 4.2s ease-in-out infinite 1.5s'
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #CAFDF5, #00B8D9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18
        }}>
          🏛️
        </div>
        <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Barlow', sans-serif" }}>
          Banking
        </div>
      </div>

      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

// ─── RECRUITER SECTION ILLUSTRATION (SCREENSHOT 5) ──────────────────────────
export function ZoneRecruiterMeetingIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 460, height: 380, margin: '0 auto' }}>
      <svg viewBox="0 0 460 380" width="100%" height="100%">
        <defs>
          <linearGradient id="boardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF2D6" />
            <stop offset="100%" stopColor="#FED8A6" />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FA541C" />
            <stop offset="100%" stopColor="#B3200E" />
          </linearGradient>
        </defs>

        {/* Big Clipboard in background */}
        <rect x="220" y="30" width="210" height="300" rx="16" fill="#B3200E" />
        <rect x="230" y="45" width="190" height="270" rx="12" fill="url(#boardGrad)" />
        {/* Clip at top */}
        <rect x="290" y="20" width="70" height="26" rx="6" fill="#770508" />
        <circle cx="325" cy="33" r="5" fill="#FFFFFF" />

        {/* Candidate Resume content inside board */}
        <circle cx="360" cy="95" r="22" fill="#FA541C" />
        <rect x="250" y="80" width="80" height="12" rx="3" fill="#B3200E" opacity="0.3" />
        <rect x="250" y="100" width="60" height="8" rx="2" fill="#B3200E" opacity="0.2" />

        <line x1="250" y1="140" x2="400" y2="140" stroke="#B3200E" strokeWidth="6" strokeLinecap="round" opacity="0.25" />
        <line x1="250" y1="165" x2="380" y2="165" stroke="#B3200E" strokeWidth="6" strokeLinecap="round" opacity="0.25" />
        <line x1="250" y1="190" x2="400" y2="190" stroke="#B3200E" strokeWidth="6" strokeLinecap="round" opacity="0.25" />
        <line x1="250" y1="215" x2="340" y2="215" stroke="#B3200E" strokeWidth="6" strokeLinecap="round" opacity="0.25" />
        <line x1="250" y1="240" x2="390" y2="240" stroke="#B3200E" strokeWidth="6" strokeLinecap="round" opacity="0.25" />

        {/* Speech Bubble */}
        <path d="M140 120 C140 100 180 100 190 120 C195 135 180 150 160 150 L150 165 L152 150 C144 148 140 135 140 120 Z" fill="#651FFF" />
        <line x1="152" y1="122" x2="178" y2="122" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="152" y1="132" x2="172" y2="132" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

        {/* Desk Table */}
        <rect x="110" y="270" width="220" height="12" rx="4" fill="#5C6BC0" />
        {/* Table legs */}
        <line x1="130" y1="282" x2="120" y2="355" stroke="#5C6BC0" strokeWidth="5" strokeLinecap="round" />
        <line x1="180" y1="282" x2="190" y2="355" stroke="#5C6BC0" strokeWidth="5" strokeLinecap="round" />
        <line x1="280" y1="282" x2="270" y2="355" stroke="#5C6BC0" strokeWidth="5" strokeLinecap="round" />
        <line x1="310" y1="282" x2="320" y2="355" stroke="#5C6BC0" strokeWidth="5" strokeLinecap="round" />

        {/* Laptop on desk */}
        <path d="M210 245 L225 270 L195 270 Z" fill="#3D5AFE" />

        {/* Recruiter on Left (Purple shirt) */}
        <circle cx="120" cy="180" r="14" fill="#FDAB76" />
        <path d="M106 178 C106 165 130 165 134 178 C134 185 130 192 122 192 C118 192 116 200 110 198 Z" fill="#1C252E" />
        <path d="M100 205 C100 205 135 198 145 225 C148 245 135 275 120 275 C105 275 95 255 100 205 Z" fill="#4527A0" />
        <line x1="100" y1="275" x2="90" y2="350" stroke="#311B92" strokeWidth="8" strokeLinecap="round" />
        <line x1="120" y1="275" x2="140" y2="340" stroke="#311B92" strokeWidth="8" strokeLinecap="round" />

        {/* Candidate on Right (Orange dress) */}
        <circle cx="280" cy="190" r="13" fill="#FDAB76" />
        <path d="M285 180 C295 180 305 195 295 205 C288 200 280 200 275 190 Z" fill="#770508" />
        <path d="M260 215 C260 215 300 205 295 240 L280 275 L255 265 Z" fill="url(#orangeGrad)" />
        <line x1="260" y1="275" x2="245" y2="345" stroke="#B3200E" strokeWidth="6" strokeLinecap="round" />
        <line x1="275" y1="275" x2="285" y2="345" stroke="#B3200E" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  )
}
