import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { animate } from 'framer-motion'
import { cn } from '../../lib/utils'
import './spotlight-navbar.css'

export function SpotlightNavbar({
  items,
  className,
  onItemClick,
  defaultActiveIndex = 0,
  children
}) {
  const location = useLocation()
  const navRef = useRef(null)

  // Default demo items if none provided
  const navItems = items || [
    { label: 'Core Features', href: '/#features' },
    { label: 'SmartScreen AI', to: '/smartscreen', badge: 'VIDEO' },
    { label: 'Careers Portal', to: '/jobs' },
    { label: 'Enterprise Pricing', href: '/#pricing' },
    { label: 'About & AI', to: '/about' },
    { label: 'Support & Inquiries', to: '/about#support' },
  ]

  // Detect active index based on current path and hash
  const getActiveIndexFromRoute = () => {
    const currentPath = location.pathname
    const currentHash = location.hash

    const foundIdx = navItems.findIndex((item) => {
      if (item.href && item.href.startsWith('/#')) {
        const hash = item.href.replace('/#', '#')
        return currentPath === '/' && currentHash === hash
      }
      if (item.href && item.href.startsWith('#')) {
        return currentHash === item.href
      }
      if (item.to) {
        if (item.to.includes('#')) {
          const [path, hash] = item.to.split('#')
          return currentPath === path && currentHash === `#${hash}`
        }
        if (item.to === '/') return currentPath === '/'
        return currentPath.startsWith(item.to)
      }
      return false
    })

    return foundIdx !== -1 ? foundIdx : defaultActiveIndex
  }

  const [activeIndex, setActiveIndex] = useState(getActiveIndexFromRoute)
  const [hoverX, setHoverX] = useState(null)

  // Update active index on route change
  useEffect(() => {
    const newIdx = getActiveIndexFromRoute()
    if (newIdx !== -1) {
      setActiveIndex(newIdx)
    }
  }, [location.pathname, location.hash])

  // Refs for the light positions for imperative spring animation
  const spotlightX = useRef(0)
  const ambienceX = useRef(0)

  // Mouse move and leave listener for the spotlight beam
  useEffect(() => {
    if (!navRef.current) return
    const nav = navRef.current

    const handleMouseMove = (e) => {
      const rect = nav.getBoundingClientRect()
      const x = e.clientX - rect.left
      setHoverX(x)
      spotlightX.current = x
      nav.style.setProperty('--spotlight-x', `${x}px`)
    }

    const handleMouseLeave = () => {
      setHoverX(null)
      // When mouse leaves, spring the spotlight back to the active item
      const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`)
      if (activeItem) {
        const navRect = nav.getBoundingClientRect()
        const itemRect = activeItem.getBoundingClientRect()
        const targetX = itemRect.left - navRect.left + itemRect.width / 2

        animate(spotlightX.current, targetX, {
          type: 'spring',
          stiffness: 220,
          damping: 22,
          onUpdate: (v) => {
            spotlightX.current = v
            nav.style.setProperty('--spotlight-x', `${v}px`)
          }
        })
      }
    }

    nav.addEventListener('mousemove', handleMouseMove)
    nav.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      nav.removeEventListener('mousemove', handleMouseMove)
      nav.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [activeIndex])

  // Ambience movement tracking active item
  useEffect(() => {
    if (!navRef.current) return
    const nav = navRef.current
    const activeItem = nav.querySelector(`[data-index="${activeIndex}"]`)

    if (activeItem) {
      const navRect = nav.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()
      const targetX = itemRect.left - navRect.left + itemRect.width / 2

      animate(ambienceX.current, targetX, {
        type: 'spring',
        stiffness: 220,
        damping: 22,
        onUpdate: (v) => {
          ambienceX.current = v
          nav.style.setProperty('--ambience-x', `${v}px`)
        }
      })
    }
  }, [activeIndex])

  const handleItemClick = (item, index, e) => {
    setActiveIndex(index)
    if (onItemClick) {
      onItemClick(item, index)
    }
  }

  return (
    <div className={cn('spotlight-nav-container', className)}>
      <nav
        ref={navRef}
        className="spotlight-nav spotlight-nav-bg glass-border spotlight-nav-shadow"
      >
        {children ? (
          <div className="spotlight-nav-list">{children}</div>
        ) : (
          <ul className="spotlight-nav-list">
            {navItems.map((item, idx) => {
              const isActive = activeIndex === idx

              // Custom render if provided
              if (item.render) {
                return (
                  <li key={idx} className="spotlight-nav-item">
                    {item.render({
                      item,
                      idx,
                      isActive,
                      onClick: (e) => handleItemClick(item, idx, e)
                    })}
                  </li>
                )
              }

              return (
                <li key={idx} className="spotlight-nav-item">
                  {item.to ? (
                    <Link
                      to={item.to}
                      data-index={idx}
                      onClick={(e) => handleItemClick(item, idx, e)}
                      className={cn(
                        'spotlight-nav-link',
                        isActive && 'active'
                      )}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="spotlight-badge">{item.badge}</span>
                      )}
                    </Link>
                  ) : (
                    <a
                      href={item.href || '#'}
                      data-index={idx}
                      onClick={(e) => handleItemClick(item, idx, e)}
                      className={cn(
                        'spotlight-nav-link',
                        isActive && 'active'
                      )}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="spotlight-badge">{item.badge}</span>
                      )}
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* 1. The Moving Spotlight (Follows Mouse) */}
        <div
          className="spotlight-layer-beam"
          style={{ opacity: hoverX !== null ? 1 : 0 }}
        />

        {/* 2. The Active State Ambience (Tracks Active Item) */}
        <div className="spotlight-layer-ambience" />
      </nav>
    </div>
  )
}

export default SpotlightNavbar
