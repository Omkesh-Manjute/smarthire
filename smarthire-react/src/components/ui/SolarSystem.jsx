import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import './solar-system.css'

const DefaultIcons = {
  react: (
    <svg viewBox="-11.5 -10.23174 23 20.46348" width="18" height="18" fill="none">
      <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="1">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),
  nextjs: (
    <svg viewBox="0 0 180 180" width="18" height="18" fill="none">
      <circle cx="90" cy="90" r="90" fill="#000" stroke="#fff" strokeWidth="6" />
      <path
        d="M149.508 157.52L69.142 54H54v72h14.4V69.412l67.24 87.054a89.4 89.4 0 0013.868-1.046zM111.6 54h14.4v72h-14.4z"
        fill="#fff"
      />
    </svg>
  ),
  flutter: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="M14.314 0L2.3 12l6 6 6-6-6-6 2.985-2.985L14.314 0zm0 6l-6 6 6 6 5.7-5.7-2.985-3L20.014 6H14.314z" fill="#54C5F8" />
      <path d="M14.314 12L8.3 18l6 6h5.7l-6-6 6-6h-5.7z" fill="#01579B" />
    </svg>
  ),
  vue: (
    <svg viewBox="0 0 256 221" width="18" height="18" fill="none">
      <path d="M204.8 0H256L128 220.8 0 0h51.2L128 132.48 204.8 0z" fill="#41B883" />
      <path d="M0 0l128 220.8L256 0h-51.2L128 132.48 51.2 0H0z" fill="#35495E" />
    </svg>
  ),
  typescript: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <rect width="24" height="24" rx="3" fill="#3178C6" />
      <path d="M5.5 12v-1.5h4.5V21h-2V12H5.5zm5.5-1.5h4.5v1.5h-3v2h3v1.5h-3v2h3V21h-4.5v-1.5h3v-2h-3v-1.5h3v-2h-3V10.5z" fill="#fff" />
    </svg>
  ),
  python: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M12.043 1.017c-2.157 0-2.078.918-2.078.918l.003 2.126h2.32v.639H7.768S5.449 4.487 5.449 6.72c0 2.233 0 2.767 0 2.767h1.568V8.282c0-.725.68-1.324 1.582-1.324h3.722c1.383 0 2.234-.84 2.234-2.234V3.11c0-1.156-.99-2.093-2.234-2.093h-2.32V1.017zm-1.09.934a.6.6 0 1 1 .002 1.2.6.6 0 0 1-.002-1.2z"
        fill="#387EB8"
      />
      <path
        d="M12.043 22.983c2.157 0 2.078-.918 2.078-.918l-.003-2.126h-2.32v-.639h4.518s2.32.217 2.32-2.017c0-2.233 0-2.767 0-2.767h-1.568v1.201c0 .725-.68 1.324-1.582 1.324h-3.722c-1.383 0-2.234.84-2.234 2.234v1.867c0 1.156.99 2.093 2.234 2.093h2.32v-.252h-.041z"
        fill="#FFD43B"
      />
    </svg>
  ),
  rust: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#ff6f30" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fill="#ff6f30" />
      <circle cx="12" cy="12" r="1.5" fill="#fff" />
    </svg>
  ),
  golang: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M3.8 8.15a.36.36 0 0 0-.36.41.36.36 0 0 0 .36.33h4.69a.36.36 0 0 0 .36-.33.36.36 0 0 0-.36-.41H3.8zm-2.56 1.8a.36.36 0 0 0-.36.45.36.36 0 0 0 .36.33h4.69a.36.36 0 0 0 .36-.33.36.36 0 0 0-.36-.45H1.24zm13.8 0a.36.36 0 0 0-.36.45.36.36 0 0 0 .36.33h4.69a.36.36 0 0 0 .36-.33.36.36 0 0 0-.36-.45h-4.69zm-2.56-1.8a.36.36 0 0 0-.36.41.36.36 0 0 0 .36.33h4.69a.36.36 0 0 0 .36-.33.36.36 0 0 0-.36-.41h-4.69z"
        fill="#00ADD8"
      />
    </svg>
  ),
}

const DEFAULT_ORBITS = [
  {
    id: 'inner',
    name: 'Frontend Core',
    radiusClass: 'var(--radius-inner)',
    radiusPx: 175,
    speed: 22,
    items: [
      { id: 'react', label: 'React', color: '#61DAFB', svg: DefaultIcons.react },
      { id: 'nextjs', label: 'Next.js', color: '#ffffff', svg: DefaultIcons.nextjs },
      { id: 'flutter', label: 'Flutter', color: '#54C5F8', svg: DefaultIcons.flutter },
      { id: 'vue', label: 'Vue.js', color: '#42B883', svg: DefaultIcons.vue },
    ],
  },
  {
    id: 'mid',
    name: 'Backend & Data',
    radiusClass: 'var(--radius-mid)',
    radiusPx: 285,
    speed: 34,
    items: [
      { id: 'typescript', label: 'TypeScript', color: '#3178C6', svg: DefaultIcons.typescript },
      { id: 'python', label: 'Python AI', color: '#FFD43B', svg: DefaultIcons.python },
    ],
  },
  {
    id: 'outer',
    name: 'Cloud & Systems',
    radiusClass: 'var(--radius-outer)',
    radiusPx: 395,
    speed: 50,
    items: [
      { id: 'rust', label: 'Rust', color: '#FF6F30', svg: DefaultIcons.rust },
      { id: 'golang', label: 'Go Cloud', color: '#00ADD8', svg: DefaultIcons.golang },
    ],
  },
]

export function SolarSystem({
  centerLogo,
  centerLogoAlt = 'SmartHire Neural Engine',
  orbits = DEFAULT_ORBITS,
  isPaused = false,
  speedMultiplier = 1,
  className,
  ...props
}) {
  const [hoveredId, setHoveredId] = useState(null)

  const dustItems = [
    { delay: '-4s', radius: '165px', color: '#00f5d4' },
    { delay: '-11s', radius: '260px', color: '#3b82f6' },
    { delay: '-19s', radius: '340px', color: '#2563eb' },
    { delay: '-28s', radius: '395px', color: '#60a5fa' },
    { delay: '-7s', radius: '200px', color: '#93c5fa' },
    { delay: '-15s', radius: '365px', color: '#06b6d4' },
  ]

  return (
    <div
      className={cn('solar-system-root', className)}
      {...props}
    >
      {/* 3D Tilted Orbit Container */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          maxWidth: '940px',
          height: '100%',
          maxHeight: '940px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'rotateX(65deg) rotateY(-10deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Central Glowing Core (SmartHire Engine) */}
        <div
          style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            pointerEvents: 'none',
            transform: 'rotateY(10deg) rotateX(-65deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Glowing Aura */}
          <div
            className="animate-custom-sun-pulse"
            style={{
              position: 'absolute',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              filter: 'blur(14px)',
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, rgba(6, 182, 212, 0.25) 70%, transparent 100%)',
              zIndex: 10,
            }}
          />

          {/* Central Logo Core */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              border: '2px solid rgba(59, 130, 246, 0.6)',
              boxShadow: '0 0 35px rgba(37, 99, 235, 0.4), inset 0 0 15px rgba(37, 99, 235, 0.3)',
              background: '#090d16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              position: 'relative',
            }}
          >
            {centerLogo || (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" fill="#2563eb" />
                <circle cx="12" cy="12" r="9" stroke="#60a5fa" strokeWidth="1.8" strokeDasharray="3 3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" stroke="#93c5fa" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>

          {/* Core Dash Rings */}
          <div
            className="animate-custom-spin-cw"
            style={{
              position: 'absolute',
              width: '135px',
              height: '135px',
              borderRadius: '50%',
              border: '1px dashed rgba(37, 99, 235, 0.35)',
              pointerEvents: 'none',
            }}
          />
          <div
            className="animate-custom-spin-ccw"
            style={{
              position: 'absolute',
              width: '175px',
              height: '175px',
              borderRadius: '50%',
              border: '1px dashed rgba(6, 182, 212, 0.22)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Cosmic Dust Particles */}
        {dustItems.map((dust, idx) => (
          <div
            key={idx}
            className="animate-custom-orbit"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              opacity: 0.5,
              pointerEvents: 'none',
              background: dust.color,
              boxShadow: `0 0 6px ${dust.color}`,
              animationDelay: dust.delay,
              animationPlayState: isPaused ? 'paused' : 'running',
              animationDuration: `${26 / speedMultiplier}s`,
              '--orbit-radius': dust.radius,
              '--orbit-duration': `${26 / speedMultiplier}s`,
              '--orbit-play-state': isPaused ? 'paused' : 'running',
            }}
          />
        ))}

        {/* Orbit Rings & Planet Nodes */}
        {orbits.map((orbit) => (
          <React.Fragment key={orbit.id}>
            {/* Visual Dashed Ring Line */}
            <div
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: '1px dashed rgba(203, 213, 225, 0.45)',
                pointerEvents: 'none',
                width: `calc(2 * ${orbit.radiusClass})`,
                height: `calc(2 * ${orbit.radiusClass})`,
                boxShadow: 'inset 0 0 25px rgba(255, 255, 255, 0.02), 0 0 25px rgba(255, 255, 255, 0.02)',
                '--orbit-radius': orbit.radiusClass,
              }}
            />

            {/* Orbit Items / Planet Cards */}
            {orbit.items.map((item, idx, arr) => {
              const delayValue = -(orbit.speed / arr.length) * idx
              const durationValue = orbit.speed / speedMultiplier
              const isHovered = hoveredId === item.id

              return (
                <div
                  key={item.id}
                  className="animate-custom-orbit"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                    animationDelay: `${delayValue}s`,
                    animationDuration: `${durationValue}s`,
                    animationPlayState: isPaused ? 'paused' : 'running',
                    '--orbit-radius': orbit.radiusClass,
                    '--orbit-duration': `${durationValue}s`,
                    '--orbit-play-state': isPaused ? 'paused' : 'running',
                    zIndex: isHovered ? 30 : 10,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Laser Beam connecting Sun Center to Planet on hover */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      height: '1.5px',
                      transformOrigin: 'right',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      transition: 'opacity 0.3s ease',
                      width: orbit.radiusClass,
                      opacity: isHovered ? 1 : 0,
                      background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 20%, ${item.color} 80%, ${item.color} 100%)`,
                      boxShadow: `0 0 8px ${item.color}, 0 0 16px ${item.color}40`,
                    }}
                  />

                  {/* Billboarded Planet Logo Card */}
                  <div
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="orbit-logo-card animate-custom-billboard"
                    style={{
                      animationDelay: `${delayValue}s`,
                      animationDuration: `${durationValue}s`,
                      animationPlayState: isPaused ? 'paused' : 'running',
                      borderColor: isHovered ? item.color : undefined,
                      boxShadow: isHovered
                        ? `0 0 22px rgba(0, 0, 0, 0.6), 0 0 16px ${item.color}50`
                        : undefined,
                      transform: isHovered ? 'scale(1.08)' : undefined,
                      '--orbit-duration': `${durationValue}s`,
                      '--orbit-play-state': isPaused ? 'paused' : 'running',
                    }}
                  >
                    <div
                      style={{
                        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.25s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.svg}
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {item.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default SolarSystem
