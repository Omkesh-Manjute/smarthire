import React, { useState, useEffect, useRef } from 'react'
import { subscribeAtsJobs } from '../lib/atsFirestore'

// ─── Web Audio API Notification Engine (Singleton with Autoplay Unlock) ──────────
let sharedAudioCtx = null
let lastSoundTimestamp = 0

export function getSharedAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    try {
      sharedAudioCtx = new AudioContextClass()
    } catch (_) {}
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {})
  }
  return sharedAudioCtx
}

// Global user-gesture warm-up to pre-unlock AudioContext across Chrome, Safari, Edge, Firefox
if (typeof window !== 'undefined') {
  const warmUpAudio = () => {
    try {
      const ctx = getSharedAudioContext()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
    } catch (_) {}
  }
  ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(ev => {
    window.addEventListener(ev, warmUpAudio, { passive: true })
  })
}

/**
 * Dedicated Requisition / New JD Audio Chime (4-Tone Ascending Major Arpeggio Chord)
 * C5 (523.25Hz) → E5 (659.25Hz) → G5 (783.99Hz) → C6 (1046.50Hz) + High Shimmer
 */
export function playRequisitionSound() {
  try {
    const soundEnabled = typeof window !== 'undefined' && localStorage.getItem('smarthire_notification_sound_enabled') !== 'false'
    if (!soundEnabled) return

    const ctx = getSharedAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const t = ctx.currentTime

    // Tone 1: Warm Foundation (C5 = 523.25 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, t)
    gain1.gain.setValueAtTime(0.28, t)
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(t)
    osc1.stop(t + 0.45)

    // Tone 2: Major Third (E5 = 659.25 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(659.25, t + 0.08)
    gain2.gain.setValueAtTime(0.32, t + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t + 0.08)
    osc2.stop(t + 0.55)

    // Tone 3: Perfect Fifth (G5 = 783.99 Hz)
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(783.99, t + 0.16)
    gain3.gain.setValueAtTime(0.35, t + 0.16)
    gain3.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.start(t + 0.16)
    osc3.stop(t + 0.7)

    // Tone 4: Octave Crown (C6 = 1046.50 Hz) + Subtle Harmonic Shimmer (E6 = 1318.51 Hz)
    const osc4 = ctx.createOscillator()
    const gain4 = ctx.createGain()
    osc4.type = 'sine'
    osc4.frequency.setValueAtTime(1046.50, t + 0.25)
    gain4.gain.setValueAtTime(0.38, t + 0.25)
    gain4.gain.exponentialRampToValueAtTime(0.0001, t + 0.95)
    osc4.connect(gain4)
    gain4.connect(ctx.destination)
    osc4.start(t + 0.25)
    osc4.stop(t + 0.95)

    const oscSparkle = ctx.createOscillator()
    const gainSparkle = ctx.createGain()
    oscSparkle.type = 'triangle'
    oscSparkle.frequency.setValueAtTime(1318.51, t + 0.27)
    gainSparkle.gain.setValueAtTime(0.16, t + 0.27)
    gainSparkle.gain.exponentialRampToValueAtTime(0.0001, t + 0.85)
    oscSparkle.connect(gainSparkle)
    gainSparkle.connect(ctx.destination)
    oscSparkle.start(t + 0.27)
    oscSparkle.stop(t + 0.85)
  } catch (err) {
    console.warn('Requisition notification sound error:', err)
  }
}

/**
 * Standard Notification Chime (D5 → A5 → D6 Harmonic)
 */
export function playStandardNotificationSound() {
  try {
    const soundEnabled = typeof window !== 'undefined' && localStorage.getItem('smarthire_notification_sound_enabled') !== 'false'
    if (!soundEnabled) return

    const ctx = getSharedAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const t = ctx.currentTime

    // Note 1: High crisp chime (D5 = 587.33 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, t)
    gain1.gain.setValueAtTime(0.25, t)
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(t)
    osc1.stop(t + 0.35)

    // Note 2: Resolution chime (A5 = 880 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, t + 0.1)
    gain2.gain.setValueAtTime(0.3, t + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(t + 0.1)
    osc2.stop(t + 0.6)

    // Note 3: Harmonic sparkle (D6 = 1174.66 Hz)
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.type = 'triangle'
    osc3.frequency.setValueAtTime(1174.66, t + 0.2)
    gain3.gain.setValueAtTime(0.18, t + 0.2)
    gain3.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.start(t + 0.2)
    osc3.stop(t + 0.8)
  } catch (err) {
    console.warn('Standard notification sound error:', err)
  }
}

/**
 * Universal Sound Trigger with Debounce and Requisition Routing
 */
export function playNotificationSound(soundType = 'default', force = false) {
  const now = Date.now()
  if (!force && now - lastSoundTimestamp < 220) {
    return
  }
  lastSoundTimestamp = now

  if (soundType === 'requisition' || soundType === 'job') {
    playRequisitionSound()
  } else {
    playStandardNotificationSound()
  }
}

// ─── Native Desktop Push Notifications ────────────────────────────────────────
export function requestPushNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('unsupported')
  }
  return Notification.requestPermission()
}

export function triggerNativePushNotification(notif) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const title = notif.title || 'SmartHire ATS Notification'
    const body = notif.message || 'New activity in SmartHire ATS'
    const nativeNotif = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: notif.id || `notif-${Date.now()}`
    })

    nativeNotif.onclick = () => {
      window.focus()
      nativeNotif.close()
    }
  } catch (e) {
    console.warn('Native notification error:', e)
  }
}

// Helper function to calculate relative time ago dynamically
export const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now'
  const diff = Date.now() - new Date(timestamp).getTime()
  if (isNaN(diff) || diff < 0) return 'Just now'
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Persistent Known Job Keys helper
const loadSavedKnownJobKeys = () => {
  try {
    const raw = localStorage.getItem('smarthire_known_job_keys')
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return new Set(arr)
    }
  } catch (_) {}
  return new Set()
}

const persistKnownJobKeys = (set) => {
  try {
    const arr = Array.from(set).slice(-3000)
    localStorage.setItem('smarthire_known_job_keys', JSON.stringify(arr))
  } catch (_) {}
}

// Clean old bulk spam and deduplicate notifications
const sanitizeNotifications = (rawList) => {
  if (!Array.isArray(rawList)) return []
  const seen = new Set()
  return rawList.filter(n => {
    if (!n || !n.title) return false
    // Purge old repeated bulk sync messages
    if (n.title.includes('276 New Requisitions') || (n.message && n.message.includes('275 more jobs'))) {
      return false
    }
    // Purge duplicate entries
    const key = `${n.title}|${n.reqId || ''}|${n.message || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Helper function to push real-time notifications anywhere in the app
export const pushActivityNotification = (notif) => {
  if (!notif || !notif.title) return
  const reqClean = notif.reqId ? String(notif.reqId).replace(/^J-/, '').trim() : null

  let currentList = []
  try {
    const raw = localStorage.getItem('smarthire_activity_notifications')
    if (raw) {
      currentList = JSON.parse(raw)
      if (!Array.isArray(currentList)) currentList = []
    }
  } catch (e) {}

  // 1. Strict duplicate suppression: if an identical notification with same reqId exists, ignore
  if (reqClean) {
    const isDupReq = currentList.some(n => {
      const nReqClean = n.reqId ? String(n.reqId).replace(/^J-/, '').trim() : null
      return nReqClean === reqClean && n.title === notif.title
    })
    if (isDupReq) return
  }

  // 2. Strict content duplicate check: identical title + message
  const isDupContent = currentList.some(n => n.title === notif.title && n.message === notif.message)
  if (isDupContent) return

  // 3. Debounce identical title within 60 seconds
  const isRecentSameTitle = currentList.some(n => {
    if (n.title !== notif.title) return false
    const timeDiff = Date.now() - new Date(n.timestamp || Date.now()).getTime()
    return timeDiff < 60000
  })
  if (isRecentSameTitle) return

  const newEntry = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: notif.title || 'New Activity Update',
    message: notif.message || '',
    type: notif.type || 'info', // 'approval', 'assignment', 'status', 'ai', 'requisition', 'info'
    category: notif.category || (notif.type === 'requisition' ? 'team' : 'status'),
    timestamp: notif.timestamp || new Date().toISOString(),
    timeAgo: 'Just now',
    isRead: false,
    actor: notif.actor || 'System',
    actorRole: notif.actorRole || 'Recruiter',
    reqId: reqClean || notif.reqId || null,
    candidateName: notif.candidateName || null,
    candidateId: notif.candidateId || null,
    statusText: notif.statusText || null,
    inquiryData: notif.inquiryData || null,
    inquiryId: notif.inquiryId || null,
    email: notif.email || null,
    company: notif.company || null,
    subject: notif.subject || null
  }

  try {
    const updated = [newEntry, ...currentList].slice(0, 50) // Keep latest 50
    localStorage.setItem('smarthire_activity_notifications', JSON.stringify(updated))
  } catch (e) {}

  // 1. Play audio chime sound (requisitions get dedicated 4-tone arpeggio)
  playNotificationSound(newEntry.type)

  // 2. Trigger native OS / desktop push notification
  triggerNativePushNotification(newEntry)

  // 3. Dispatch in-app notification event
  window.dispatchEvent(new CustomEvent('smarthire_new_activity_notification', { detail: newEntry }))
}

// Initial real-time activity notifications list
const DEFAULT_NOTIFICATIONS = []

export default function ActivityNotificationBell({ theme = 'default', onSelectNotification }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('smarthire_activity_notifications')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const cleaned = sanitizeNotifications(parsed)
          localStorage.setItem('smarthire_activity_notifications', JSON.stringify(cleaned))
          return cleaned
        }
      }
    } catch (e) {}
    return DEFAULT_NOTIFICATIONS
  })

  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'status', 'team', 'ai'
  const [liveToast, setLiveToast] = useState(null)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('smarthire_notification_sound_enabled') !== 'false'
    } catch (_) {
      return true
    }
  })
  const [permissionStatus, setPermissionStatus] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'unsupported'
  })
  const dropdownRef = useRef(null)

  // Sync to local storage
  const saveNotifications = (newList) => {
    setNotifications(newList)
    try {
      localStorage.setItem('smarthire_activity_notifications', JSON.stringify(newList))
    } catch (e) {}
  }

  const toggleSound = () => {
    const next = !isSoundEnabled
    setIsSoundEnabled(next)
    try {
      localStorage.setItem('smarthire_notification_sound_enabled', String(next))
    } catch (_) {}
    if (next) {
      playNotificationSound()
    }
  }

  const handleEnablePushNotifications = async () => {
    try {
      const res = await requestPushNotificationPermission()
      setPermissionStatus(res)
      if (res === 'granted') {
        pushActivityNotification({
          title: '🎉 Push Notifications Enabled!',
          message: 'You will receive desktop push alerts and sound when candidates or jobs update.',
          type: 'info',
          category: 'system',
          actor: 'SmartHire System'
        })
      }
    } catch (e) {
      console.warn('Error enabling notifications:', e)
    }
  }

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length

  // ─── GLOBAL REAL-TIME NEW REQUISITIONS LISTENER (FIRESTORE & BACKGROUND ENGINE) ───
  const knownJobKeysRef = useRef(loadSavedKnownJobKeys())
  const firestoreBaselinedRef = useRef(false)
  const backendJobsBaselinedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    // 1. Real-time Firebase Firestore listener (sub-second notification when any job is created)
    let unsubFirestoreJobs = () => {}
    try {
      unsubFirestoreJobs = subscribeAtsJobs(({ jobs: fsJobs, changes }) => {
        if (!isMounted) return

        // On first snapshot, baseline existing jobs so previous database records don't false-alarm
        if (!firestoreBaselinedRef.current) {
          firestoreBaselinedRef.current = true
          fsJobs.forEach(j => {
            const k1 = String(j.id || '').trim()
            const k2 = String(j.reqId || '').trim()
            const k3 = k1.replace(/^J-/, '')
            if (k1) knownJobKeysRef.current.add(k1)
            if (k2) knownJobKeysRef.current.add(k2)
            if (k3) knownJobKeysRef.current.add(k3)
          })
          persistKnownJobKeys(knownJobKeysRef.current)
          return
        }

        // Subsequent changes: detect genuine newly added requisitions
        const addedChanges = changes.filter(c => c.type === 'added').map(c => c.doc)
        addedChanges.forEach(j => {
          const k1 = String(j.id || '').trim()
          const k2 = String(j.reqId || '').trim()
          const k3 = k1.replace(/^J-/, '')
          const isKnown = (k1 && knownJobKeysRef.current.has(k1)) ||
                          (k2 && knownJobKeysRef.current.has(k2)) ||
                          (k3 && knownJobKeysRef.current.has(k3))

          if (!isKnown) {
            if (k1) knownJobKeysRef.current.add(k1)
            if (k2) knownJobKeysRef.current.add(k2)
            if (k3) knownJobKeysRef.current.add(k3)
            persistKnownJobKeys(knownJobKeysRef.current)

            const cleanId = k2 || k3 || k1
            const clientName = j.client || j.customer || 'Enterprise Client'
            const locStr = j.location || 'Remote'
            const rateStr = j.budget || j.payRate ? `· ${j.budget || j.payRate}` : ''

            pushActivityNotification({
              title: `💼 New Requisition: ${j.title || 'New Position'}`,
              message: `Req #${cleanId} · ${clientName} (${locStr}) ${rateStr} is now open for candidate submissions.`,
              type: 'requisition',
              category: 'team',
              actor: j.postedByName || 'SmartHire ATS',
              actorRole: 'Recruiter',
              reqId: cleanId
            })
          }
        })
      })
    } catch (err) {
      console.warn('Firestore global job subscription notice:', err)
    }

    // 2. Periodic background poll of /api/jobs (every 25s) to detect scraper / backend jobs
    const pollBackendJobs = async () => {
      try {
        const token = localStorage.getItem('smarthire_token') || ''
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/jobs', { headers })
        if (!res.ok) return
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.jobs || data.data || []
        if (!Array.isArray(list) || list.length === 0) return

        // On first run, baseline all existing backend database records silently
        if (!backendJobsBaselinedRef.current) {
          backendJobsBaselinedRef.current = true
          list.forEach(j => {
            const k1 = String(j.id || '').trim()
            const k2 = String(j.reqId || '').trim()
            const k3 = k1.replace(/^J-/, '')
            if (k1) knownJobKeysRef.current.add(k1)
            if (k2) knownJobKeysRef.current.add(k2)
            if (k3) knownJobKeysRef.current.add(k3)
          })
          persistKnownJobKeys(knownJobKeysRef.current)
          return
        }

        const newlyIngested = []
        list.forEach(j => {
          const k1 = String(j.id || '').trim()
          const k2 = String(j.reqId || '').trim()
          const k3 = k1.replace(/^J-/, '')
          const isKnown = (k1 && knownJobKeysRef.current.has(k1)) ||
                          (k2 && knownJobKeysRef.current.has(k2)) ||
                          (k3 && knownJobKeysRef.current.has(k3))
          if (!isKnown) {
            if (k1) knownJobKeysRef.current.add(k1)
            if (k2) knownJobKeysRef.current.add(k2)
            if (k3) knownJobKeysRef.current.add(k3)
            newlyIngested.push(j)
          }
        })

        if (newlyIngested.length > 0) {
          persistKnownJobKeys(knownJobKeysRef.current)

          if (newlyIngested.length <= 3) {
            newlyIngested.forEach(nj => {
              const cleanId = String(nj.reqId || nj.id || '').replace(/^J-/, '')
              const clientName = nj.client || nj.customer || 'Enterprise Client'
              const locStr = nj.location || 'Remote'
              const rateStr = nj.budget || nj.payRate ? `· ${nj.budget || nj.payRate}` : ''

              pushActivityNotification({
                title: `💼 New Requisition: ${nj.title || 'New Position'}`,
                message: `Req #${cleanId} · ${clientName} (${locStr}) ${rateStr} is now live in portal.`,
                type: 'requisition',
                category: 'team',
                actor: nj.postedByName || 'SmartHire Ingestion',
                actorRole: 'Automation Scraper',
                reqId: cleanId
              })
            })
          } else {
            const sampleTitles = newlyIngested.slice(0, 2).map(j => j.title).join(', ')
            const firstId = String(newlyIngested[0].reqId || newlyIngested[0].id || '').replace(/^J-/, '')
            pushActivityNotification({
              title: `💼 ${newlyIngested.length} New Requisitions Ingested!`,
              message: `${sampleTitles} and ${newlyIngested.length - 2} more positions now open for candidate submissions.`,
              type: 'requisition',
              category: 'team',
              actor: 'Ingestion Engine',
              actorRole: 'Automation Scraper',
              reqId: firstId
            })
          }
        }
      } catch (_) {}
    }

    const intervalId = setInterval(pollBackendJobs, 25000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
      if (typeof unsubFirestoreJobs === 'function') unsubFirestoreJobs()
    }
  }, [])

  // Listen for live new notifications emitted across tabs or components
  useEffect(() => {
    let toastTimeout = null
    const handleNewNotif = (e) => {
      const newNotif = e.detail
      if (!newNotif) return

      setNotifications(prev => {
        const exists = prev.some(n => n.id === newNotif.id)
        if (exists) return prev
        const updated = [newNotif, ...prev].slice(0, 50)
        try {
          localStorage.setItem('smarthire_activity_notifications', JSON.stringify(updated))
        } catch (err) {}
        return updated
      })

      // Ensure sound is triggered (debounced to avoid duplicate play)
      playNotificationSound(newNotif.type)

      // Trigger live popup banner for 5 seconds
      setLiveToast(newNotif)
      if (toastTimeout) clearTimeout(toastTimeout)
      toastTimeout = setTimeout(() => {
        setLiveToast(null)
      }, 5000)
    }

    window.addEventListener('smarthire_new_activity_notification', handleNewNotif)
    return () => {
      window.removeEventListener('smarthire_new_activity_notification', handleNewNotif)
      if (toastTimeout) clearTimeout(toastTimeout)
    }
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Mark all as read
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }))
    saveNotifications(updated)
  }

  // Clear all
  const handleClearAll = () => {
    saveNotifications([])
  }

  // Click individual notification
  const handleNotificationClick = (notif) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
    saveNotifications(updated)
    setIsOpen(false)
    if (notif.type === 'inquiry' || notif.inquiryData || notif.title?.toLowerCase().includes('inquiry')) {
      setSelectedInquiry(notif.inquiryData || {
        id: notif.inquiryId || notif.id,
        name: notif.actor || 'Prospect',
        email: notif.email || '',
        company: notif.company || '',
        subject: notif.subject || notif.title,
        message: notif.message,
        timestamp: notif.timestamp,
        priority: notif.inquiryData?.priority || 'Normal'
      })
      return
    }
    if (onSelectNotification) {
      onSelectNotification(notif)
    }
  }

  // Filtered notifications
  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'requisitions') {
      return n.type === 'requisition' || n.category === 'requisition' || n.title?.toLowerCase().includes('requisition') || n.title?.toLowerCase().includes('job')
    }
    if (activeFilter === 'status') return n.category === 'status' || n.type === 'approval' || n.type === 'interview'
    if (activeFilter === 'team') return n.category === 'team' || n.type === 'assignment' || n.type === 'requisition' || n.type === 'inquiry'
    if (activeFilter === 'ai') return n.category === 'ai' || n.type === 'ai'
    return true
  })

  // Get icon and color badge for notification type
  const getTypeBadge = (type) => {
    switch (type) {
      case 'approval':
        return { icon: '✅', label: 'Approved', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' }
      case 'assignment':
        return { icon: '📋', label: 'Assigned', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' }
      case 'interview':
        return { icon: '📅', label: 'Interview', bg: '#fef3c7', color: '#92400e', border: '#fde68a' }
      case 'ai':
      case 'ai_match':
        return { icon: '🎯', label: 'AI Match', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' }
      case 'requisition':
        return { icon: '💼', label: 'Requisition', bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' }
      case 'inquiry':
        return { icon: '📩', label: 'Inquiry', bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' }
      default:
        return { icon: '🔔', label: 'Update', bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' }
    }
  }

  const isOrangeTheme = theme === 'orange'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      
      {/* ─── NOTIFICATION BELL BUTTON ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Live Activity Alerts & Notifications"
        style={{
          position: 'relative',
          background: isOrangeTheme ? '#c2410c' : '#ffffff',
          border: isOrangeTheme ? '1px solid #9a3412' : '1px solid #cbd5e1',
          color: isOrangeTheme ? '#ffffff' : '#1e293b',
          borderRadius: '4px',
          width: '32px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ fontSize: '15px', lineHeight: 1 }}>🔔</span>

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-6px',
            background: '#dc2626',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '17px',
            height: '17px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            boxShadow: '0 2px 4px rgba(220,38,38,0.4)',
            border: '2px solid #ffffff'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ─── LIVE POPUP TOAST BANNER (AUTO-DISMISS) ─── */}
      {liveToast && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          zIndex: 99999,
          background: '#0f172a',
          color: '#ffffff',
          border: liveToast.type === 'requisition' ? '1px solid #f97316' : '1px solid #38bdf8',
          borderRadius: '6px',
          padding: '10px 14px',
          boxShadow: liveToast.type === 'requisition' ? '0 10px 25px rgba(249, 115, 22, 0.35)' : '0 10px 25px rgba(0,0,0,0.3)',
          maxWidth: '360px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          animation: 'slideIn 0.3s ease-out',
          fontFamily: 'Arial, sans-serif'
        }}>
          <span style={{ fontSize: '18px' }}>
            {liveToast.type === 'requisition' ? '💼' : '🔔'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '11.5px',
              fontWeight: 'bold',
              color: liveToast.type === 'requisition' ? '#fb923c' : '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>{liveToast.title}</span>
              {liveToast.type === 'requisition' && (
                <span style={{
                  fontSize: '9px',
                  background: '#ea580c',
                  color: '#ffffff',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: '700',
                  letterSpacing: '0.4px'
                }}>
                  LIVE REQ
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#f1f5f9', marginTop: '2px', lineHeight: '1.3' }}>
              {liveToast.message}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
              Just now • {liveToast.actor}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── NOTIFICATION DROPDOWN POPOVER ─── */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '38px',
          right: 0,
          zIndex: 9999,
          width: '380px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'Arial, sans-serif'
        }}>
          
          {/* Header */}
          <div style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>🔔</span>
              <span style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#0f172a' }}>
                Activity & Alerts
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={toggleSound}
                title={isSoundEnabled ? "Notification sound is ON (click to mute)" : "Notification sound is MUTED (click to enable)"}
                style={{
                  background: isSoundEnabled ? '#ecfdf5' : '#fef2f2',
                  border: isSoundEnabled ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  color: isSoundEnabled ? '#047857' : '#b91c1c',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <span>{isSoundEnabled ? '🔊' : '🔇'}</span>
                <span>{isSoundEnabled ? 'Sound ON' : 'Muted'}</span>
              </button>

              {/* Test Standard Sound Button */}
              <button
                type="button"
                onClick={() => playNotificationSound('default', true)}
                title="Test standard notification sound chime"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🔔 Test
              </button>

              {/* Test JD Requisition Sound Button */}
              <button
                type="button"
                onClick={() => playNotificationSound('requisition', true)}
                title="Test new job requisition audio chime (4-tone arpeggio)"
                style={{
                  background: '#ffedd5',
                  border: '1px solid #fed7aa',
                  color: '#9a3412',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span>💼</span>
                <span>JD Sound</span>
              </button>

              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
              >
                Mark read
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <button
                type="button"
                onClick={handleClearAll}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Desktop Push Notification Prompt Banner */}
          {permissionStatus !== 'granted' && (
            <div style={{
              background: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px' }}>📢</span>
                <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: '500' }}>
                  Enable desktop pop-up alerts with sound?
                </span>
              </div>
              <button
                type="button"
                onClick={handleEnablePushNotifications}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Turn On
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            padding: '4px 10px 0',
            gap: '4px'
          }}>
            {[
              { id: 'all', label: `All (${notifications.length})` },
              { id: 'requisitions', label: `Jobs (${notifications.filter(n => n.type === 'requisition' || n.category === 'requisition' || n.title?.toLowerCase().includes('requisition') || n.title?.toLowerCase().includes('job')).length})` },
              { id: 'status', label: 'Approvals' },
              { id: 'team', label: 'Team Activity' },
              { id: 'ai', label: 'AI Alerts' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  background: activeFilter === tab.id ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  borderBottom: activeFilter === tab.id ? '2px solid #ea580c' : '2px solid transparent',
                  color: activeFilter === tab.id ? '#ea580c' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: activeFilter === tab.id ? 'bold' : 'normal',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  borderRadius: '3px 3px 0 0'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications Scrollable List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', background: '#ffffff' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '11.5px' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🔕</span>
                No notifications in this category
              </div>
            ) : (
              filteredNotifs.map((item) => {
                const badge = getTypeBadge(item.type)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      background: item.isRead ? '#ffffff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = item.isRead ? '#ffffff' : '#f8fafc'}
                  >
                    {/* Icon Box */}
                    <div style={{
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {badge.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: item.isRead ? 'normal' : 'bold',
                          color: '#0f172a'
                        }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#94a3b8', marginLeft: '6px' }}>
                          {getTimeAgo(item.timestamp) || item.timeAgo}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '11px',
                        color: '#475569',
                        marginTop: '2px',
                        lineHeight: '1.3'
                      }}>
                        {item.message}
                      </div>

                      {/* Metadata Chips */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '5px' }}>
                        {item.actor && (
                          <span style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            👤 {item.actor} ({item.actorRole || 'Recruiter'})
                          </span>
                        )}
                        {item.reqId && (
                          <span style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                          }}>
                            Req #{String(item.reqId).replace(/^J-/, '')}
                          </span>
                        )}
                        {!item.isRead && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            marginLeft: 'auto'
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '8px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10.5px'
          }}>
            <span style={{ color: '#0284c7', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>
              ⚡ Live Team Activity
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
              <span>{isSoundEnabled ? '🔊 Sound ON' : '🔇 Muted'}</span>
              <span>•</span>
              <span style={{ color: permissionStatus === 'granted' ? '#16a34a' : '#ea580c', fontWeight: '500' }}>
                {permissionStatus === 'granted' ? '🟢 Push Active' : '🟡 In-App'}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ─── ENTERPRISE INQUIRY DETAILS MODAL ─── */}
      {selectedInquiry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setSelectedInquiry(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #cbd5e1',
              overflow: 'hidden',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              animation: 'slideIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📩</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '-0.01em' }}>
                    Enterprise Client Inquiry
                  </div>
                  <div style={{ fontSize: '11px', color: '#93c5fd', marginTop: '1px' }}>
                    Ticket: {selectedInquiry.id || 'INQ-ACTIVE'} • {selectedInquiry.timestamp ? new Date(selectedInquiry.timestamp).toLocaleString() : 'Recent'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Top Meta Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: '12px'
                }}>
                  🏷️ {selectedInquiry.category || selectedInquiry.inquiryType || 'General Inquiry'}
                </span>

                <span style={{
                  background: (selectedInquiry.priority?.toLowerCase() === 'urgent') ? '#fee2e2' : (selectedInquiry.priority?.toLowerCase() === 'high') ? '#fef3c7' : '#f1f5f9',
                  color: (selectedInquiry.priority?.toLowerCase() === 'urgent') ? '#b91c1c' : (selectedInquiry.priority?.toLowerCase() === 'high') ? '#b45309' : '#334155',
                  border: '1px solid rgba(0,0,0,0.08)',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: '12px'
                }}>
                  ⚡ Priority: {selectedInquiry.priority || 'Normal'}
                </span>

                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: '12px'
                }}>
                  ● Status: {selectedInquiry.status || 'New'}
                </span>
              </div>

              {/* Prospect Information Card */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>
                    Prospect Name
                  </div>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13.5px' }}>
                    {selectedInquiry.name || 'Not specified'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>
                    Company / Organization
                  </div>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '13.5px' }}>
                    🏢 {selectedInquiry.company || 'Enterprise Partner'}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>
                    Corporate Email Address
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={`mailto:${selectedInquiry.email}`}
                      style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
                    >
                      ✉️ {selectedInquiry.email || 'No email provided'}
                    </a>
                    {selectedInquiry.email && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedInquiry.email)
                          setCopiedEmail(true)
                          setTimeout(() => setCopiedEmail(false), 2000)
                        }}
                        style={{
                          background: copiedEmail ? '#dcfce7' : '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '2px 7px',
                          fontSize: '10.5px',
                          fontWeight: '600',
                          color: copiedEmail ? '#15803d' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedEmail ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                {selectedInquiry.phone && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>
                      Phone
                    </div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>
                      📞 {selectedInquiry.phone}
                    </div>
                  </div>
                )}
              </div>

              {/* Subject */}
              {selectedInquiry.subject && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Subject
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>
                    {selectedInquiry.subject}
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Inquiry Message
                </div>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}>
                  {selectedInquiry.message || 'No additional message text provided.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem('smarthire_inquiries')
                    if (raw) {
                      const list = JSON.parse(raw)
                      const updated = list.map(inq => inq.id === selectedInquiry.id ? { ...inq, status: 'contacted' } : inq)
                      localStorage.setItem('smarthire_inquiries', JSON.stringify(updated))
                    }
                  } catch (e) {}
                  setSelectedInquiry(prev => ({ ...prev, status: 'Contacted' }))
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                ✓ Mark as Contacted
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>

                <a
                  href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(`Re: [SmartHire ATS] ${selectedInquiry.subject || selectedInquiry.category || 'Enterprise Inquiry'}`)}&body=${encodeURIComponent(`Hi ${selectedInquiry.name || 'there'},\n\nThank you for reaching out to SmartHire ATS regarding ${selectedInquiry.company || 'your team'}.\n\n`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✉️</span>
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
