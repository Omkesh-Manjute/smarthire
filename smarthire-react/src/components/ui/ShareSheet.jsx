import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import qrcode from 'qrcode-generator'
import './share-sheet.css'

function safeUrl(value) {
  try {
    const u = new URL(value)
    return /^https?:$/.test(u.protocol) ? u.href : ''
  } catch {
    return ''
  }
}

function Icon({ name, size = 18 }) {
  const paths = {
    share: (
      <>
        <path d="M12 16V3m0 0L8 7m4-4 4 4" />
        <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
      </>
    ),
    link: (
      <>
        <path d="m10 13 4-4" />
        <path d="M8.5 16.3 6.6 18A3.2 3.2 0 0 1 2 13.4l4.4-4.5A3.2 3.2 0 0 1 11 9" />
        <path d="M15.5 7.7 17.4 6A3.2 3.2 0 0 1 22 10.6l-4.4 4.5A3.2 3.2 0 0 1 13 15" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    check: <path d="m5 12 4.5 4.5L19 7" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    message: <path d="M20 11.4A8 8 0 0 1 7.2 17.8L3 19l1.3-4.2A8 8 0 1 1 20 11.4Z" />,
    download: (
      <>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3" />
      </>
    ),
    qr: (
      <>
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h2m3 0h2m-7 3h4m3 0v4m-7 0h4" />
        <path d="M5.5 5.5h2M16.5 5.5h2M5.5 16.5h2" />
      </>
    ),
    back: <path d="m14 5-7 7 7 7" />,
    arrow: <path d="m9 5 7 7-7 7" />,
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Brand({ name }) {
  if (name === 'whatsapp') {
    return (
      <svg viewBox="0 0 32 32" width="22" height="22" fill="none" aria-hidden="true">
        <path
          d="M7.4 24.5 4 28l1.2-5A12.1 12.1 0 1 1 10 27a12 12 0 0 1-2.6-2.5Z"
          stroke="white"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M12.1 10.5c-.7-1.4-1.6-.7-2 .1-1.2 2.2 1.5 5.6 3.4 7.4 2.3 2.2 5.8 4.5 7.5 2.7 1 .1 1.6-1.2 1.5-2.3l-2.8-1.3c-.7-.3-1.2 1.2-2 1-2.1-.6-4.2-2.6-4.6-3.5-.5-.9.9-1.3.7-2l-1.1-2.5Z"
          fill="white"
        />
      </svg>
    )
  }
  if (name === 'telegram') {
    return (
      <svg viewBox="0 0 32 32" width="22" height="22" fill="none" aria-hidden="true">
        <path
          fill="white"
          d="M27.6 6.2 4.9 15.1c-1.1.5-1 1.1-.1 1.4l5.8 1.8 2.2 6.7c.3.8.6 1 1.1.4l3.4-3.4 5.6 4c1 .6 1.8.3 2-1l3.7-17c.3-1.4-.2-2-1-1.8ZM11.7 17.8 24.6 9c.5-.3 1-.2.5.3L14.5 19.5l-.5 3.2-2.3-4.9Z"
        />
      </svg>
    )
  }
  if (name === 'x') {
    return (
      <svg viewBox="0 0 32 32" width="20" height="20" fill="none" aria-hidden="true">
        <path d="M5.5 5.5h4.7l16.3 21h-4.8L5.5 5.5ZM26 5.5 6 26.5" stroke="white" strokeWidth="2.2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 32 32" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="22" height="22" rx="7" stroke="white" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="5.1" stroke="white" strokeWidth="2.2" />
      <circle cx="23" cy="9.2" r="1.4" fill="white" />
    </svg>
  )
}

function QrArt({ url, size = 170, onReady }) {
  const svg = useMemo(() => {
    try {
      if (!url) return ''
      const qr = qrcode(0, 'M')
      qr.addData(url)
      qr.make()
      const cells = qr.getModuleCount()
      const margin = 4
      const n = cells + margin * 2
      let rects = ''
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          if (qr.isDark(y, x)) {
            rects += `<rect x="${x + margin}" y="${y + margin}" width="1" height="1"/>`
          }
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${n * 10}" height="${n * 10}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path fill="#fff" d="M0 0h${n}v${n}H0z"/><g fill="#111116">${rects}</g></svg>`
    } catch {
      return ''
    }
  }, [url])

  useEffect(() => {
    onReady?.(svg)
  }, [svg, onReady])

  return svg ? (
    <img
      width={size}
      height={size}
      alt="Scannable QR code"
      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
    />
  ) : (
    <p role="alert" style={{ fontSize: 12 }}>This link is too long for a QR code.</p>
  )
}

export function ShareSheet({
  url,
  title = 'Share this page',
  text = '',
  isOpen,
  onClose,
  trigger,
  theme = 'auto',
  label = 'Share',
  variant = 'default',
  onShare
}) {
  const isControlled = typeof isOpen === 'boolean'
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? isOpen : internalOpen

  const [view, setView] = useState('share') // 'share' | 'more' | 'qr' | 'copied'
  const [message, setMessage] = useState(text || '')
  const [feedback, setFeedback] = useState('')
  const [qrSvg, setQrSvg] = useState('')
  const titleId = useId()

  const activeUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const link = safeUrl(activeUrl) || activeUrl
  const canShare = Boolean(link)

  const handleClose = () => {
    if (isControlled) {
      onClose?.()
    } else {
      setInternalOpen(false)
    }
    setView('share')
    setFeedback('')
  }

  const copy = async () => {
    if (!canShare) return false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const el = document.createElement('textarea')
        el.value = link
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.append(el)
        el.select()
        document.execCommand('copy')
        el.remove()
      }
      onShare?.({ channel: 'copy', url: link })
      setView('copied')
      return true
    } catch {
      setFeedback('Could not copy link to clipboard.')
      return false
    }
  }

  const launch = (channel) => {
    if (!canShare) return
    const msg = message.trim() || title
    const q = encodeURIComponent
    const targets = {
      whatsapp: `https://api.whatsapp.com/send?text=${q(`${msg} ${link}`)}`,
      telegram: `https://t.me/share/url?url=${q(link)}&text=${q(msg)}`,
      x: `https://twitter.com/intent/tweet?url=${q(link)}&text=${q(msg)}`,
      mail: `mailto:?subject=${q(title)}&body=${q(`${msg ? `${msg}\n\n` : ''}${link}`)}`,
      sms: `sms:?body=${q(`${msg ? `${msg} ` : ''}${link}`)}`,
    }

    if (channel === 'instagram') {
      if (navigator.share) {
        navigator.share({ title, text: msg || undefined, url: link }).catch(() => {})
      } else {
        copy().then((ok) => {
          if (ok) {
            setView('share')
            setFeedback('Link copied! You can now paste it in Instagram.')
          }
        })
      }
      return
    }

    const target = targets[channel]
    if (!target) return
    if (channel === 'mail' || channel === 'sms') {
      window.location.assign(target)
    } else {
      window.open(target, '_blank', 'noopener,noreferrer')
    }
    onShare?.({ channel, url: link })
  }

  const downloadQr = () => {
    if (!qrSvg) return
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = 'share-qr.svg'
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  const channels = [
    { id: 'link', label: 'Copy Link', icon: <Icon name="link" size={18} /> },
    { id: 'whatsapp', label: 'WhatsApp', brand: 'whatsapp' },
    { id: 'telegram', label: 'Telegram', brand: 'telegram' },
    { id: 'x', label: 'X', brand: 'x' },
    { id: 'instagram', label: 'Instagram', brand: 'instagram' },
    { id: 'more', label: 'More', icon: <Icon name="more" size={18} /> },
  ]

  const handleChannelClick = (ch) => {
    setFeedback('')
    if (ch.id === 'link') return copy()
    if (ch.id === 'more') return setView('more')
    launch(ch.id)
  }

  const moreActions = [
    { icon: 'mail', label: 'Email', fn: () => launch('mail') },
    { icon: 'message', label: 'Messages / SMS', fn: () => launch('sms') },
    { icon: 'qr', label: 'Show QR Code', fn: () => setView('qr') },
  ]

  return (
    <>
      {!isControlled && (
        trigger ? (
          React.cloneElement(trigger, {
            onClick: (e) => {
              trigger.props.onClick?.(e)
              setInternalOpen(true)
            }
          })
        ) : (
          <button
            type="button"
            className={`kss-trigger ${variant === 'outline' ? 'kss-trigger-outline' : ''}`}
            onClick={() => setInternalOpen(true)}
          >
            <Icon name="share" size={16} />
            <span>{label}</span>
          </button>
        )
      )}

      {open && typeof document !== 'undefined' && createPortal(
        <div className={`kss-root ${theme === 'dark' ? 'kss-dark' : ''}`}>
          <div className="kss-backdrop" onClick={handleClose} />

          <motion.div
            className="kss-sheet"
            initial={{ opacity: 0, scale: 0.94, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.94, x: '-50%', y: '-45%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            style={{ position: 'fixed', left: '50%', top: '50%' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="kss-handle" />

            {view === 'copied' ? (
              <div className="kss-success">
                <span className="kss-check">
                  <Icon name="check" size={24} />
                </span>
                <h2 id={titleId}>Link copied!</h2>
                <p>You can now paste it anywhere to share.</p>
                <button type="button" className="kss-done" onClick={handleClose}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="kss-heading">
                  <div>
                    {view !== 'share' && (
                      <button
                        type="button"
                        className="kss-back"
                        onClick={() => {
                          setView('share')
                          setFeedback('')
                        }}
                        aria-label="Back to sharing"
                      >
                        <Icon name="back" size={16} />
                      </button>
                    )}
                    <h2 id={titleId}>
                      {view === 'more' ? 'More Options' : view === 'qr' ? 'Share via QR Code' : 'Share'}
                    </h2>
                    <p>
                      {view === 'more'
                        ? 'Additional ways to share'
                        : view === 'qr'
                        ? 'Scan this QR code from any mobile device'
                        : 'Choose where to share'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="kss-close"
                    aria-label="Close share sheet"
                  >
                    <Icon name="close" size={15} />
                  </button>
                </div>

                {view === 'share' && (
                  <div className="kss-grid">
                    {channels.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        className="kss-dest"
                        onClick={() => handleChannelClick(ch)}
                      >
                        <span className={`kss-icon ${ch.brand ? `kss-${ch.brand}` : ''}`}>
                          {ch.brand ? <Brand name={ch.brand} /> : ch.icon}
                        </span>
                        <span className="kss-label">{ch.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {view === 'more' && (
                  <div className="kss-list">
                    {moreActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.fn}
                      >
                        <Icon name={action.icon} size={18} />
                        <span>{action.label}</span>
                        <Icon name="arrow" size={14} />
                      </button>
                    ))}
                  </div>
                )}

                {view === 'qr' && (
                  <div className="kss-qr-wrap">
                    <QrArt url={link} onReady={setQrSvg} />
                    <button
                      type="button"
                      disabled={!qrSvg}
                      className="kss-download"
                      onClick={downloadQr}
                    >
                      <Icon name="download" size={16} />
                      <span>Download QR Code</span>
                    </button>
                  </div>
                )}

                {feedback && <p className="kss-feedback">{feedback}</p>}
              </>
            )}
          </motion.div>
        </div>,
        document.body
      )}
    </>
  )
}

export default ShareSheet
