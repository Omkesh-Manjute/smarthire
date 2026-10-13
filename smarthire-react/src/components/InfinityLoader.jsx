import React from 'react'

/**
 * InfinityLoader — Premium Enterprise Infinity Snake Animation Loader
 * 
 * Renders an animated infinity symbol (∞ lemniscate) where a glowing gradient
 * snake travels continuously along the track.
 * 
 * Supports:
 * - fullScreen: full viewport overlay with sleek backdrop blur
 * - minHeight: customizable container height (defaults to 75vh for route suspense)
 * - size: 'sm' (70px), 'md' (110px), 'lg' (150px)
 * - theme: 'light' | 'dark' | 'auto'
 * - text / subtext: customizable status messages
 */
export default function InfinityLoader({
  text = 'Loading SmartHire...',
  subtext = '',
  size = 'md',
  fullScreen = false,
  minHeight = '75vh',
  theme = 'light',
  showBrand = true,
  className = '',
  style = {}
}) {
  // Dimensions based on size
  const dimensions = {
    sm: { width: 72, height: 36, stroke: 4, headRadius: 3 },
    md: { width: 110, height: 55, stroke: 5, headRadius: 4 },
    lg: { width: 150, height: 75, stroke: 6, headRadius: 5 }
  }[size] || { width: 110, height: 55, stroke: 5, headRadius: 4 }

  const isDark = theme === 'dark'
  const trackColor = isDark ? '#334155' : '#E2E8F0'
  const textColor = isDark ? '#E2E8F0' : '#1E293B'
  const subtextColor = isDark ? '#94A3B8' : '#64748B'
  const bg = fullScreen
    ? (isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)')
    : 'transparent'

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    backgroundColor: bg,
    ...(fullScreen
      ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          minHeight: '100vh'
        }
      : {
          minHeight: minHeight,
          width: '100%'
        }),
    ...style
  }

  // Lemniscate SVG path centered at (60, 30) within a 120x60 viewBox
  const infinityPath = 'M 60,30 C 75,12 105,12 105,30 C 105,48 75,48 60,30 C 45,12 15,12 15,30 C 15,48 45,48 60,30 Z'

  return (
    <div className={`smarthire-infinity-loader ${className}`} style={containerStyle} role="status" aria-live="polite" aria-label={text}>
      <style>{`
        @keyframes infinitySnakeGlide {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -100;
          }
        }
        @keyframes infinityPulseGlow {
          0%, 100% {
            opacity: 0.95;
            filter: drop-shadow(0 0 6px rgba(37, 99, 235, 0.55)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.35));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.8)) drop-shadow(0 0 18px rgba(6, 182, 212, 0.6));
          }
        }
        @keyframes infinityTextDot {
          0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        .infinity-snake-path {
          animation: infinitySnakeGlide 1.5s linear infinite;
        }
        .infinity-glow-group {
          animation: infinityPulseGlow 2.4s ease-in-out infinite;
        }
        .infinity-loader-dot:nth-child(1) { animation-delay: 0s; }
        .infinity-loader-dot:nth-child(2) { animation-delay: 0.2s; }
        .infinity-loader-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* Brand Icon (Minimal Sleek ATS Glyph) */}
      {showBrand && (
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.9 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#2563EB" />
            <path d="M7 9V7C7 5.89543 7.89543 5 9 5H15C16.1046 5 17 5.89543 17 7V9" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
            <rect x="5" y="9" width="14" height="10" rx="2" stroke="#FFFFFF" strokeWidth="1.75" />
            <path d="M5 13H19" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: textColor, textTransform: 'uppercase' }}>
            Smart<span style={{ color: '#2563EB' }}>Hire</span>
          </span>
        </div>
      )}

      {/* Infinity Snake Loop SVG */}
      <div className="infinity-glow-group" style={{ position: 'relative', width: dimensions.width, height: dimensions.height }}>
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 120 60"
          style={{ overflow: 'visible', display: 'block' }}
        >
          <defs>
            {/* High-vibrancy Blue -> Indigo -> Cyan gradient for the moving snake */}
            <linearGradient id="smarthireSnakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>

            {/* Glowing drop-shadow for snake head/body */}
            <filter id="smarthireSnakeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#2563EB" floodOpacity="0.7" />
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#06B6D4" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background infinity track */}
          <path
            d={infinityPath}
            fill="none"
            stroke={trackColor}
            strokeWidth={dimensions.stroke}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s ease' }}
          />

          {/* Traveling Snake Stroke */}
          <path
            className="infinity-snake-path"
            d={infinityPath}
            fill="none"
            stroke="url(#smarthireSnakeGradient)"
            strokeWidth={dimensions.stroke + 0.6}
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="28 72"
            filter="url(#smarthireSnakeShadow)"
          />
        </svg>
      </div>

      {/* Typography Label */}
      {text && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{
            fontSize: size === 'sm' ? 12 : 13.5,
            fontWeight: 600,
            color: textColor,
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}>
            <span>{text.replace(/\.+$/, '')}</span>
            <span style={{ display: 'inline-flex', gap: 2 }}>
              <span className="infinity-loader-dot" style={{ animation: 'infinityTextDot 1.4s infinite ease-in-out', display: 'inline-block' }}>.</span>
              <span className="infinity-loader-dot" style={{ animation: 'infinityTextDot 1.4s infinite ease-in-out', display: 'inline-block' }}>.</span>
              <span className="infinity-loader-dot" style={{ animation: 'infinityTextDot 1.4s infinite ease-in-out', display: 'inline-block' }}>.</span>
            </span>
          </div>
          {subtext && (
            <div style={{
              fontSize: 12,
              fontWeight: 500,
              color: subtextColor,
              marginTop: 4
            }}>
              {subtext}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
