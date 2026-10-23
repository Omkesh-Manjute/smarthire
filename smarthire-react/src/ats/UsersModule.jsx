import React, { useState, useEffect } from 'react'
import AuditActivityLogModule from './AuditActivityLogModule'
import { saveTeamUsersFirestore, getTeamUsersFirestore, deleteTeamUserFirestore, getCareerApplications } from '../lib/atsFirestore'
import InfinityLoader from '../components/InfinityLoader'

const DEFAULT_RECRUITERS = [
  {
    id: 'rec-1',
    name: 'Omkesh',
    email: 'omkesh@coolsofttech.com',
    role: 'superadmin',
    refCode: 'omkesh',
    company: 'SmartHire LLC',
    isActive: true,
    lastLogin: '2026-08-27T18:45:00.000Z',
    createdAt: '2026-01-10T10:00:00.000Z'
  }
]

export default function UsersModule({ allCandidates, permissions, setPermissions }) {
  const [subTab, setSubTab] = useState('recruiters')
  const [recruiters, setRecruiters] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthire_recruiters')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(u => u && u.role !== 'client' && (u.email || '').toLowerCase().trim() !== 'omkeshmanjute1@gmail.com')
        }
      }
    } catch (e) {}
    return DEFAULT_RECRUITERS
  })
  const [loading, setLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const [expandedRecruiters, setExpandedRecruiters] = useState({})

  const [showAddModal, setShowAddModal] = useState(false)
  const [newRecName, setNewRecName] = useState('')
  const [newRecEmail, setNewRecEmail] = useState('')
  const [newRecCompany, setNewRecCompany] = useState('SmartHire LLC')
  const [newRecRef, setNewRecRef] = useState('')
  const [newRecRole, setNewRecRole] = useState('recruiter')
  const [newRecParent, setNewRecParent] = useState('')

  const [editRecruiter, setEditRecruiter] = useState(null)
  const [editRecName, setEditRecName] = useState('')
  const [editRecEmail, setEditRecEmail] = useState('')
  const [editRecCompany, setEditRecCompany] = useState('')
  const [editRecRef, setEditRecRef] = useState('')
  const [editRecRole, setEditRecRole] = useState('recruiter')
  const [editRecParent, setEditRecParent] = useState('')

  const [newRecCredits, setNewRecCredits] = useState('100')
  const [refillModalRecruiter, setRefillModalRecruiter] = useState(null)
  const [refillAmount, setRefillAmount] = useState(100)
  const [isRefilling, setIsRefilling] = useState(false)

  // ─── B2B Client Portals State ───────────────────────────────────────────
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [clientStats, setClientStats] = useState({
    totalClients: 0,
    totalScreeningCreditsAllocated: 0,
    totalScreeningCompleted: 0,
    totalAiCreditsAllocated: 0
  })
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientCompany, setNewClientCompany] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [newClientScreeningCredits, setNewClientScreeningCredits] = useState(50)
  const [newClientAiCredits, setNewClientAiCredits] = useState(300)
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  const [refillModalClient, setRefillModalClient] = useState(null)
  const [refillScreeningAmount, setRefillScreeningAmount] = useState(25)
  const [refillAiAmount, setRefillAiAmount] = useState(100)
  const [refillClientMode, setRefillClientMode] = useState('add') // 'add' or 'set'
  const [customSetScreening, setCustomSetScreening] = useState(50)
  const [customSetAi, setCustomSetAi] = useState(300)
  const [isRefillingClient, setIsRefillingClient] = useState(false)

  // ─── Candidate Users State (Genuine Job Site Applicants) ───────────────────
  const [portalCandidates, setPortalCandidates] = useState([])
  const [loadingPortalCandidates, setLoadingPortalCandidates] = useState(false)

  const [toastMessage, setToastMessage] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const saveRecruiters = (newList, notifyMsg = null) => {
    setRecruiters(newList)
    try {
      // Strip heavy base64 avatars and passwords before saving to localStorage
      const sanitized = newList.map(u => {
        const copy = { ...u }
        delete copy.avatar
        delete copy.password
        return copy
      })
      localStorage.setItem('smarthire_recruiters', JSON.stringify(sanitized))
    } catch (e) {}
    // Sync to Firestore
    saveTeamUsersFirestore(newList).catch(() => {})
    if (notifyMsg) showToast(notifyMsg)
  }

  const fetchRecruiters = async () => {
    // Only show full-screen spinner if we do not already have cached recruiters in state
    if (!recruiters || recruiters.length === 0) {
      setLoading(true)
    }
    try {
      // Concurrently fetch from Firestore and Backend server
      const [firestoreRes, backendRes] = await Promise.allSettled([
        getTeamUsersFirestore(),
        fetch('/api/admin/recruiters').then(r => r.json())
      ])

      const hasAuthoritative = (backendRes.status === 'fulfilled' && backendRes.value?.success && Array.isArray(backendRes.value.recruiters)) ||
                               (firestoreRes.status === 'fulfilled' && Array.isArray(firestoreRes.value))

      if (hasAuthoritative) {
        setRecruiters(prev => {
          const map = new Map()

          // 1. Authoritative Backend recruiters
          const backendSuccess = backendRes.status === 'fulfilled' && backendRes.value?.success && Array.isArray(backendRes.value.recruiters)
          if (backendSuccess) {
            backendRes.value.recruiters.forEach(u => {
              const emailKey = (u?.email || '').toLowerCase().trim()
              if (emailKey && u.role !== 'client' && emailKey !== 'omkeshmanjute1@gmail.com') {
                map.set(emailKey, u)
              }
            })
          }

          // 2. Authoritative Firestore recruiters (Enrich only if backend was successful, fallback if backend offline)
          if (firestoreRes.status === 'fulfilled' && Array.isArray(firestoreRes.value)) {
            firestoreRes.value.forEach(u => {
              const emailKey = (u?.email || '').toLowerCase().trim()
              if (emailKey && u.role !== 'client' && emailKey !== 'omkeshmanjute1@gmail.com') {
                if (backendSuccess) {
                  // Only enrich active backend roster — never resurrect deleted users!
                  if (map.has(emailKey)) {
                    const existing = map.get(emailKey) || {}
                    map.set(emailKey, { ...u, ...existing })
                  }
                } else {
                  map.set(emailKey, u)
                }
              }
            })
          }

          const merged = Array.from(map.values())
          try {
            const sanitized = merged.map(u => {
              const copy = { ...u }
              delete copy.avatar
              delete copy.password
              return copy
            })
            localStorage.setItem('smarthire_recruiters', JSON.stringify(sanitized))
          } catch (e) {}
          return merged
        })
      }
    } catch (err) {
      console.warn('Recruiter sync notice:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPortalCandidates = async () => {
    setLoadingPortalCandidates(true)
    try {
      // 1. Fetch career applications from Firestore
      const apps = await getCareerApplications({ forceRefresh: true })

      // 2. Also check if any candidate in allCandidates was genuinely sourced via Job Site
      const jobSiteCandidates = Array.isArray(allCandidates)
        ? allCandidates.filter(c => {
            if (!c) return false
            const src = String(c.source || c.sourceCategory || c.sourceLabel || c.appliedFrom || '').toLowerCase()
            return src.includes('job site') || src.includes('careers_portal') || src.includes('career')
          })
        : []

      // 3. Deduplicate and merge by email / id
      const candMap = new Map()
      if (Array.isArray(apps)) {
        apps.forEach(a => {
          const key = (a.email || a.id || '').toLowerCase().trim()
          if (key) {
            candMap.set(key, {
              id: a.id || a.appId,
              name: a.name || a.candidateName || 'Portal Applicant',
              email: a.email,
              phone: a.phone || '—',
              jobTitle: a.jobTitle || a.role || 'Job Site Applicant',
              status: a.status || 'Applied',
              source: 'Job Site Portal',
              appliedDate: a.appliedDate || a.createdAt,
              resumeUrl: a.resumeUrl || a.resumeStorageUrl,
              comments: a.comments || a.notes || 'Applied via Careers Job Site'
            })
          }
        })
      }

      jobSiteCandidates.forEach(c => {
        const key = (c.email || c.id || '').toLowerCase().trim()
        if (key && !candMap.has(key)) {
          candMap.set(key, {
            id: c.id || c._id,
            name: c.name,
            email: c.email,
            phone: c.phone || '—',
            jobTitle: c.jobTitle || c.role || 'Job Site Applicant',
            status: c.status || 'Applied',
            source: 'Job Site Portal',
            appliedDate: c.appliedDate || c.assignedOn || c.createdAt,
            resumeUrl: c.resumeUrl || c.legalDocs?.resume?.storageUrl,
            comments: c.statusComments || c.notes || 'Applied via Careers Job Site'
          })
        }
      })

      setPortalCandidates(Array.from(candMap.values()))
    } catch (err) {
      console.warn('Failed to fetch portal candidates:', err)
    } finally {
      setLoadingPortalCandidates(false)
    }
  }

  const handleRefillCredits = async (email, amount, isUnlimited = false, mode = 'add') => {
    if (!email) return
    setIsRefilling(true)
    try {
      const res = await fetch('/api/admin/credits/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          addCredits: isUnlimited ? undefined : amount,
          isUnlimited,
          mode: isUnlimited ? 'unlimited' : mode,
          setQuota: mode === 'set' ? amount : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Credits updated for ${email}!`)
        setRecruiters(prev => prev.map(r => {
          if ((r.email || '').toLowerCase().trim() === email.toLowerCase().trim()) {
            return {
              ...r,
              credits: data.credits || {
                ...r.credits,
                remainingCredits: isUnlimited ? 999999 : ((r.credits?.remainingCredits || 0) + (amount || 0)),
                dailyQuota: isUnlimited ? 999999 : (mode === 'set' ? amount : (r.credits?.dailyQuota || 100)),
                isUnlimited
              }
            }
          }
          return r
        }))
        setRefillModalRecruiter(null)
      } else {
        alert(data.message || 'Failed to refill credits.')
      }
    } catch (err) {
      alert('Error updating credits: ' + err.message)
    } finally {
      setIsRefilling(false)
    }
  }

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const res = await fetch('/api/admin/client-credits/all')
      const data = await res.json()
      if (data.success && Array.isArray(data.clients)) {
        setClients(data.clients)
        setClientStats({
          totalClients: data.totalClients || data.clients.length,
          totalScreeningCreditsAllocated: data.totalScreeningCreditsAllocated || 0,
          totalScreeningCompleted: data.totalScreeningCompleted || 0,
          totalAiCreditsAllocated: data.totalAiCreditsAllocated || 0
        })
      }
    } catch (err) {
      console.warn('Failed to fetch client portals:', err)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    if (!newClientName.trim() || !newClientEmail.trim()) {
      showToast('Client name and email are required.')
      return
    }
    setIsCreatingClient(true)
    try {
      const payload = {
        name: newClientName.trim(),
        company: newClientCompany.trim() || 'Partner Enterprise',
        email: newClientEmail.trim().toLowerCase(),
        screeningCredits: parseInt(newClientScreeningCredits, 10) || 50,
        aiCredits: parseInt(newClientAiCredits, 10) || 300
      }
      const res = await fetch('/api/admin/client-credits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message || 'B2B Client account created!')
        setShowAddClientModal(false)
        setNewClientName('')
        setNewClientCompany('')
        setNewClientEmail('')
        setNewClientScreeningCredits(50)
        setNewClientAiCredits(300)
        fetchClients()
      } else {
        showToast(`Failed: ${data.message || 'Error creating client'}`)
      }
    } catch (err) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsCreatingClient(false)
    }
  }

  const handleRefillClientCredits = async () => {
    if (!refillModalClient) return
    setIsRefillingClient(true)
    try {
      const body = { email: refillModalClient.email }
      if (refillClientMode === 'add') {
        body.addScreeningCredits = parseInt(refillScreeningAmount, 10) || 0
        body.addAiCredits = parseInt(refillAiAmount, 10) || 0
      } else {
        body.setScreeningCredits = parseInt(customSetScreening, 10) || 0
        body.setAiCredits = parseInt(customSetAi, 10) || 0
      }

      const res = await fetch('/api/admin/client-credits/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message || 'Client credits updated!')
        setRefillModalClient(null)
        fetchClients()
      } else {
        showToast(`Refill failed: ${data.message}`)
      }
    } catch (err) {
      showToast(`Refill failed: ${err.message}`)
    } finally {
      setIsRefillingClient(false)
    }
  }

  const handleDeleteClient = async (email, name) => {
    if (!window.confirm(`Are you sure you want to remove client portal access for ${name} (${email})?`)) return
    try {
      const cleanEmail = (email || '').toLowerCase().trim()
      setClients(prev => prev.filter(c => (c.email || '').toLowerCase().trim() !== cleanEmail))

      const res = await fetch('/api/admin/client-credits/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      })
      const data = await res.json()
      if (data.success) {
        showToast(`Client ${name} removed.`)
        fetchClients()
        fetchRecruiters()
      } else {
        showToast(`Failed: ${data.message || 'Error removing client'}`)
        fetchClients()
      }
    } catch (err) {
      showToast(`Failed: ${err.message}`)
      fetchClients()
    }
  }

  useEffect(() => {
    fetchRecruiters()
    fetchClients()
    fetchPortalCandidates()
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const toggleExpandRecruiter = (recId) => {
    setExpandedRecruiters(prev => ({
      ...prev,
      [recId]: !prev[recId]
    }))
  }

  const getSubordinateEmployees = (rec) => {
    if (!rec || !rec.name) return []
    const targetName = (rec.name || '').toLowerCase().trim()
    const targetEmail = (rec.email || '').toLowerCase().trim()
    const targetId = String(rec.id || rec._id || '').toLowerCase().trim()
    return recruiters.filter(u => {
      if (u.role !== 'employee') return false
      const parent = (u.parentRecruiterName || '').toLowerCase().trim()
      const pId = String(u.parentRecruiterId || '').toLowerCase().trim()
      const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
      return (parent && (parent === targetName || parent.includes(targetName) || targetName.includes(parent))) ||
             (pId && pId === targetId) ||
             (pEmail && pEmail === targetEmail)
    })
  }

  const getSourcedCount = (rec) => {
    if (!rec || !allCandidates || !Array.isArray(allCandidates)) return 0
    const recRef = (rec.refCode || '').toLowerCase().trim()
    const recName = (rec.name || '').toLowerCase().trim()
    const recEmail = (rec.email || '').toLowerCase().trim()
    const recId = String(rec.id || rec._id || '').toLowerCase().trim()

    // If rec is a Lead Recruiter, get their subordinates to calculate total team count
    const subordinates = rec.role === 'recruiter' ? getSubordinateEmployees(rec) : []
    const subNames = subordinates.map(s => (s.name || '').toLowerCase().trim()).filter(Boolean)
    const subEmails = subordinates.map(s => (s.email || '').toLowerCase().trim()).filter(Boolean)
    const subRefs = subordinates.map(s => (s.refCode || '').toLowerCase().trim()).filter(Boolean)

    return allCandidates.filter(c => {
      if (!c) return false
      const candRecruiter = (c.recruiter || c.assignedTo || c.assignedBy || c.addedByName || c.submittedBy || c.referredByRecruiterName || '').toLowerCase().trim()
      const candEmail = (c.recruiterEmail || '').toLowerCase().trim()
      const candRef = (c.recruiterRefCode || c.recruiterRef || '').toLowerCase().trim()
      const candCreator = String(c.createdBy || '').toLowerCase().trim()
      const candParent = (c.parentRecruiterName || '').toLowerCase().trim()

      const isDirectMatch = (recRef && (candRef === recRef || candRef.includes(recRef))) ||
                            (recName && (candRecruiter === recName || candRecruiter.includes(recName) || recName.includes(candRecruiter))) ||
                            (recEmail && (candEmail === recEmail || candRecruiter.includes(recEmail))) ||
                            (recId && candCreator === recId) ||
                            (rec.id && c.referredByRecruiter === rec.id)

      if (isDirectMatch) return true

      // If lead recruiter, also include candidates sourced by their subordinate employees
      if (rec.role === 'recruiter') {
        if (candParent && (candParent === recName || candParent.includes(recName))) return true
        const isSubSourced = subNames.some(sn => sn && (candRecruiter === sn || candRecruiter.includes(sn) || sn.includes(candRecruiter))) ||
                             subEmails.some(se => se && (candEmail === se || candRecruiter.includes(se))) ||
                             subRefs.some(sr => sr && (candRef === sr || candRef.includes(sr)))
        if (isSubSourced) return true
      }

      return false
    }).length
  }

  const handleToggleStatus = async (id, currentName) => {
    const updated = recruiters.map(r => {
      if (r.id === id || r._id === id) {
        const nextState = r.isActive === false ? true : false
        return { ...r, isActive: nextState }
      }
      return r
    })
    saveRecruiters(updated, `User "${currentName}" status changed.`)

    try {
      await fetch(`/api/admin/recruiters/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {}
  }

  const openAddModal = (presetParent = '') => {
    setNewRecName('')
    setNewRecEmail('')
    setNewRecCompany('SmartHire')
    setNewRecRef('')
    setNewRecRole(presetParent ? 'employee' : 'recruiter')
    setNewRecParent(presetParent || '')
    setNewRecCredits('100')
    setShowAddModal(true)
  }

  const handleAddRecruiter = async (e) => {
    e.preventDefault()
    if (!newRecName.trim() || !newRecEmail.trim()) {
      alert('Name and Email are required fields.')
      return
    }

    const newRefCode = newRecRef.trim() 
      ? newRecRef.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
      : newRecName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')

    const newId = `rec-${Date.now().toString().slice(-4)}`
    const isUnlim = newRecCredits === 'unlimited' || newRecRole === 'superadmin'
    const credNum = isUnlim ? 999999 : parseInt(newRecCredits, 10) || 100

    const payload = {
      id: newId,
      name: newRecName.trim(),
      email: newRecEmail.trim().toLowerCase(),
      role: newRecRole,
      refCode: newRefCode,
      company: newRecCompany.trim() || 'SmartHire',
      parentRecruiterName: newRecRole === 'employee' ? newRecParent : '',
      isActive: true,
      initialCredits: credNum,
      isUnlimited: isUnlim,
      credits: {
        remainingCredits: credNum,
        dailyQuota: credNum,
        isUnlimited: isUnlim
      },
      createdAt: new Date().toISOString()
    }

    const updated = [payload, ...recruiters]
    saveRecruiters(updated, `User account created for "${payload.name}" (${payload.role}) with ${isUnlim ? 'Unlimited' : credNum} credits!`)
    setShowAddModal(false)

    try {
      fetch('/api/admin/recruiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {})
    } catch (err) {}
  }

  const openEditModal = (rec) => {
    setEditRecruiter(rec)
    setEditRecName(rec.name || '')
    setEditRecEmail(rec.email || '')
    setEditRecCompany(rec.company || 'SmartHire')
    setEditRecRef(rec.refCode || '')
    setEditRecRole(rec.role || 'recruiter')
    setEditRecParent(rec.parentRecruiterName || '')
  }

  const handleUpdateRecruiter = async (e) => {
    e.preventDefault()
    if (!editRecName.trim() || !editRecEmail.trim()) {
      alert('Name and Email are required fields.')
      return
    }

    const finalRefCode = editRecRef.trim() 
      ? editRecRef.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
      : editRecName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')

    const updated = recruiters.map(r => {
      if (r.id === editRecruiter.id || r._id === editRecruiter.id) {
        const copy = {
          ...r,
          name: editRecName.trim(),
          email: editRecEmail.trim().toLowerCase(),
          role: editRecRole,
          refCode: finalRefCode,
          company: editRecCompany.trim() || 'SmartHire',
          parentRecruiterName: editRecRole === 'employee' ? editRecParent : ''
        }
        delete copy.password
        return copy
      }
      return r
    })

    saveRecruiters(updated, `User "${editRecName}" updated successfully!`)
    setEditRecruiter(null)

    try {
      fetch(`/api/admin/recruiters/${editRecruiter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editRecName.trim(),
          email: editRecEmail.trim().toLowerCase(),
          role: editRecRole,
          refCode: finalRefCode,
          company: editRecCompany.trim() || 'SmartHire',
          parentRecruiterName: editRecRole === 'employee' ? editRecParent : ''
        })
      }).catch(() => {})
    } catch (err) {}
  }

  const handleDeleteRecruiter = async (id, name, email = '') => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      const targetName = (name || '').toLowerCase().trim()
      const targetId = String(id || '')
      const targetEmail = (email || '').toLowerCase().trim()
      const updated = recruiters.filter(r => {
        const thisId = String(r.id || r._id || '')
        const thisName = (r.name || '').toLowerCase().trim()
        const thisEmail = (r.email || '').toLowerCase().trim()
        if (targetEmail && thisEmail === targetEmail) return false
        if (targetId && thisId === targetId) return false
        if (targetName && thisName === targetName) return false
        return true
      })
      saveRecruiters(updated, `User "${name}" account deleted.`)
      window.dispatchEvent(new CustomEvent('smarthire_recruiters_updated', { detail: updated }))

      // 1. Delete permanently from Firestore
      try {
        await deleteTeamUserFirestore(targetId, targetEmail)
      } catch (e) {
        console.warn('Firestore delete note:', e)
      }

      // 2. Delete permanently from backend server (MongoDB, disk, credits store)
      try {
        await fetch('/api/admin/recruiters/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetId, email: targetEmail, name: targetName })
        })
        await fetch(`/api/admin/recruiters/${encodeURIComponent(targetId || targetEmail || targetName)}?email=${encodeURIComponent(targetEmail)}`, { method: 'DELETE' })
        await fetch('/api/admin/recruiters/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recruiters: updated })
        })
      } catch (err) {
        console.warn('Backend delete sync note:', err)
      }
    }
  }

  const handleTogglePermission = (role, pageId) => {
    const updated = {
      ...permissions,
      [role]: {
        ...permissions[role],
        [pageId]: !permissions[role]?.[pageId]
      }
    }
    setPermissions(updated)
    try {
      localStorage.setItem('smarthire_role_permissions', JSON.stringify(updated))
    } catch(e) {}
    window.dispatchEvent(new CustomEvent('smarthire_permissions_updated', { detail: updated }))
    showToast(`Permissions updated for ${role} role.`)
  }

  const formatDate = (isoString) => {
    if (!isoString) return 'Never'
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredRecruiters = recruiters.filter(rec => {
    if (roleFilter !== 'All' && rec.role !== roleFilter) return false
    if (statusFilter === 'Active' && rec.isActive === false) return false
    if (statusFilter === 'Inactive' && rec.isActive !== false) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = (rec.name || '').toLowerCase().includes(q)
      const matchEmail = (rec.email || '').toLowerCase().includes(q)
      const matchRef = (rec.refCode || '').toLowerCase().includes(q)
      const matchCompany = (rec.company || '').toLowerCase().includes(q)
      const matchParent = (rec.parentRecruiterName || '').toLowerCase().includes(q)
      if (!matchName && !matchEmail && !matchRef && !matchCompany && !matchParent) return false
    }

    return true
  })

  const totalUsersCount = recruiters.length
  const adminCount = recruiters.filter(r => r.role === 'superadmin' || r.role === 'admin').length
  const managerCount = recruiters.filter(r => r.role === 'manager').length
  const leadRecruiterCount = recruiters.filter(r => r.role === 'recruiter').length
  const employeeCount = recruiters.filter(r => r.role === 'employee').length

  return (
    <div className="users-module-container">
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="users-header">
        <div>
          <h2 className="users-title">Master User & Access Control Hub</h2>
          <p className="users-subtitle">
            Admin console to manage organizational hierarchy, assign managers and recruiter teams, and audit permissions.
          </p>
        </div>
        
        {subTab === 'recruiters' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn" onClick={() => openAddModal('')} style={{ background: '#4f46e5', color: '#ffffff', fontWeight: 'bold' }}>
              + Add Team Member
            </button>
          </div>
        )}

        {subTab === 'clients' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn" 
              onClick={() => setShowAddClientModal(true)} 
              style={{ background: '#0284c7', color: '#ffffff', fontWeight: 'bold' }}
            >
              + Add B2B Client
            </button>
          </div>
        )}
      </div>

      <div className="subtabs-bar">
        <button 
          className={`subtab-btn ${subTab === 'recruiters' ? 'active' : ''}`}
          onClick={() => setSubTab('recruiters')}
        >
          Team & Hierarchy ({recruiters.length})
        </button>
        <button 
          className={`subtab-btn ${subTab === 'clients' ? 'active' : ''}`}
          onClick={() => { setSubTab('clients'); fetchClients(); }}
        >
          B2B Client Portals ({clients.length})
        </button>
        <button 
          className={`subtab-btn ${subTab === 'candidates' ? 'active' : ''}`}
          onClick={() => { setSubTab('candidates'); fetchPortalCandidates(); }}
        >
          Candidate Users ({portalCandidates.length})
        </button>
        <button 
          className={`subtab-btn ${subTab === 'audit' ? 'active' : ''}`}
          onClick={() => setSubTab('audit')}
        >
          Audit & Activity Log
        </button>
        <button 
          className={`subtab-btn ${subTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setSubTab('permissions')}
        >
          Access Control (Pages ON/OFF)
        </button>
      </div>

      <div className="subtab-content-panel">
        
        {subTab === 'recruiters' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL TEAM USERS</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{totalUsersCount}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Entire Organization</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SUPER ADMINS</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{adminCount}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Full Platform Control</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MANAGERS & LEADS</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{managerCount}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Candidate Review & AI</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LEAD RECRUITERS</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{leadRecruiterCount}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Managing Requisitions</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SOURCING EMPLOYEES</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{employeeCount}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Assigned Sub-Recruiters</div>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search name, email, ref code..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ padding: '7px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '230px', outline: 'none', background: '#f8fafc' }}
                  />
                  {searchQuery && (
                    <span onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: 7, cursor: 'pointer', color: '#94a3b8', fontSize: '12px' }}>✕</span>
                  )}
                </div>

                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#334155', fontWeight: '600', outline: 'none' }}
                >
                  <option value="All">All Roles ({recruiters.length})</option>
                  <option value="superadmin">Super Admins ({adminCount})</option>
                  <option value="manager">Managers & Leads ({managerCount})</option>
                  <option value="recruiter">Lead Recruiters ({leadRecruiterCount})</option>
                  <option value="employee">Sourcing Employees ({employeeCount})</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#334155', outline: 'none' }}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active Accounts</option>
                  <option value="Inactive">Inactive Accounts</option>
                </select>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Showing <strong style={{ color: '#2563eb' }}>{filteredRecruiters.length}</strong> of <strong>{recruiters.length}</strong> team members
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                <div style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: '1.4' }}>
                  <strong>Team Credits Policy:</strong> Recruiters use Extension Credits for Candidate Ingestion (1 credit) and Email Outreach (2 credits). Admins can refill credits instantly or set Unlimited quota using the <strong>+ Refill</strong> button in any row below.
                </div>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <InfinityLoader size="sm" text="Loading team members..." minHeight="120px" showBrand={false} />
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', color: '#334155', borderBottom: '1px solid #CBD5E1' }}>
                        <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textAlign: 'center', width: '42px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>#</th>
                        <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TEAM MEMBER</th>
                        <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '135px' }}>SYSTEM ROLE</th>
                        <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TEAM HIERARCHY / REPORTING</th>
                        <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '120px' }}>COMPANY & REF</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textAlign: 'center', width: '75px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SOURCED</th>
                        <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textAlign: 'center', width: '190px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EXTENSION CREDITS</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textAlign: 'center', width: '105px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ACCOUNT STATUS</th>
                        <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', width: '110px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>LAST ACTIVE</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '11px', textAlign: 'center', width: '195px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecruiters.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b', border: '1px solid #CBD5E1' }}>
                            No team members found matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRecruiters.map((rec, index) => {
                          const count = getSourcedCount(rec)
                          const isMaster = rec.email === 'omkeshmanjute@coolsofttech.com'
                          const subordinates = getSubordinateEmployees(rec)
                          const isExpanded = Boolean(expandedRecruiters[rec.id || rec._id])

                          let roleBadgeBg = '#eff6ff'
                          let roleBadgeColor = '#1d4ed8'
                          let roleBadgeBorder = '#bfdbfe'
                          let roleLabel = 'Lead Recruiter'

                          if (rec.role === 'superadmin' || rec.role === 'admin') {
                            roleBadgeBg = '#eff6ff'
                            roleBadgeColor = '#1d4ed8'
                            roleBadgeBorder = '#bfdbfe'
                            roleLabel = 'Super Admin'
                          } else if (rec.role === 'manager') {
                            roleBadgeBg = '#fef3c7'
                            roleBadgeColor = '#b45309'
                            roleBadgeBorder = '#fde68a'
                            roleLabel = 'Manager / Lead'
                          } else if (rec.role === 'employee') {
                            roleBadgeBg = '#ecfdf5'
                            roleBadgeColor = '#047857'
                            roleBadgeBorder = '#a7f3d0'
                            roleLabel = 'Employee (Sourcer)'
                          }

                          const zebraBg = index % 2 === 0 ? '#ffffff' : '#f8fafc'

                          return (
                            <React.Fragment key={rec.id || rec._id}>
                              <tr 
                                style={{
                                  opacity: rec.isActive !== false ? 1 : 0.65,
                                  background: isExpanded ? '#f1f5f9' : zebraBg,
                                  transition: 'background-color 0.12s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#eff6ff' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isExpanded ? '#f1f5f9' : zebraBg }}
                              >
                                {/* Sl. No */}
                                <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center', color: '#475569', fontWeight: '600', fontSize: '11.5px' }}>
                                  {index + 1}
                                </td>

                                {/* Team Member */}
                                <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '12.5px' }}>
                                      {rec.name} {isMaster ? '(Primary Owner)' : ''}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                                      {rec.email}
                                    </span>
                                  </div>
                                </td>

                                {/* System Role */}
                                <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>
                                  <span style={{
                                    background: roleBadgeBg, color: roleBadgeColor,
                                    border: `1px solid ${roleBadgeBorder}`,
                                    borderRadius: '4px', padding: '2px 7px', fontSize: '11px', fontWeight: '600',
                                    display: 'inline-block'
                                  }}>
                                    {roleLabel}
                                  </span>
                                </td>

                                {/* Team Hierarchy / Reporting */}
                                <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>
                                  {rec.role === 'employee' ? (
                                    <span style={{ color: '#0369a1', fontWeight: '600', fontSize: '11px', background: '#f0f9ff', padding: '2px 7px', borderRadius: '4px', border: '1px solid #bae6fd', display: 'inline-block' }}>
                                      ↳ Reports to: {rec.parentRecruiterName || 'Lead Recruiter'}
                                    </span>
                                  ) : subordinates.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandRecruiter(rec.id || rec._id)}
                                      style={{
                                        background: isExpanded ? '#ecfdf5' : '#ffffff',
                                        color: isExpanded ? '#047857' : '#334155',
                                        border: `1px solid ${isExpanded ? '#a7f3d0' : '#cbd5e1'}`,
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                      }}
                                      title="Click to view employees reporting under this recruiter"
                                    >
                                      <span>{subordinates.length} Subordinate{subordinates.length === 1 ? '' : 's'}</span>
                                      <span style={{ fontSize: '9px' }}>{isExpanded ? '▲' : '▼'}</span>
                                    </button>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '11px', color: '#64748b' }}>Independent Lead</span>
                                      {(rec.role === 'recruiter' || rec.role === 'manager' || rec.role === 'superadmin') && (
                                        <button
                                          type="button"
                                          onClick={() => openAddModal(rec.name)}
                                          style={{
                                            background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '600', cursor: 'pointer'
                                          }}
                                          title={`Add an employee under ${rec.name}`}
                                        >
                                          + Assign Employee
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Company & Ref */}
                                <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>
                                  <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>{rec.company || 'SmartHire'}</div>
                                  {rec.refCode && (
                                    <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '3px', padding: '1px 5px', fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>
                                      {rec.refCode}
                                    </span>
                                  )}
                                </td>

                                {/* Sourced */}
                                <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                  <span style={{ fontWeight: '700', color: count > 0 ? '#0f172a' : '#94a3b8', fontSize: '12px' }}>{count}</span>
                                </td>

                                {/* Extension Credits */}
                                <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    {rec.role === 'superadmin' || rec.credits?.isUnlimited ? (
                                      <span 
                                        onClick={() => setRefillModalRecruiter(rec)}
                                        style={{
                                          background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                                          borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '700',
                                          cursor: 'pointer'
                                        }}
                                        title="Unlimited credits — Click to adjust quota"
                                      >
                                        Unlimited
                                      </span>
                                    ) : (
                                      <span 
                                        onClick={() => setRefillModalRecruiter(rec)}
                                        style={{
                                          background: (rec.credits?.remainingCredits ?? 100) > 20 ? '#eff6ff' : '#fef2f2',
                                          color: (rec.credits?.remainingCredits ?? 100) > 20 ? '#1d4ed8' : '#dc2626',
                                          border: `1px solid ${(rec.credits?.remainingCredits ?? 100) > 20 ? '#bfdbfe' : '#fecaca'}`,
                                          borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '700',
                                          cursor: 'pointer'
                                        }}
                                        title="Click to refill or modify sourcing extension credits"
                                      >
                                        {rec.credits?.remainingCredits ?? 100} / {rec.credits?.dailyQuota ?? 100}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setRefillModalRecruiter(rec)}
                                      style={{
                                        background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1',
                                        borderRadius: '4px', padding: '2px 7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                      }}
                                      title="Refill or modify sourcing extension credits"
                                    >
                                      + Refill
                                    </button>
                                  </div>
                                </td>

                                {/* Account Status */}
                                <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '28px', height: '16px', margin: 0, cursor: isMaster ? 'not-allowed' : 'pointer' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={rec.isActive !== false} 
                                        disabled={isMaster}
                                        onChange={() => handleToggleStatus(rec.id || rec._id, rec.name)} 
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                      />
                                      <span style={{
                                        position: 'absolute', cursor: isMaster ? 'not-allowed' : 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: rec.isActive !== false ? '#2563eb' : '#cbd5e1',
                                        transition: '.2s', borderRadius: '16px'
                                      }}>
                                        <span style={{
                                          position: 'absolute', content: '""', height: '12px', width: '12px', left: rec.isActive !== false ? '14px' : '2px', bottom: '2px',
                                          backgroundColor: 'white', transition: '.2s', borderRadius: '50%'
                                        }}></span>
                                      </span>
                                    </label>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: rec.isActive !== false ? '#16a34a' : '#dc2626' }}>
                                      {rec.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </td>

                                {/* Last Active */}
                                <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontSize: '11.5px', color: '#64748b' }}>
                                  {formatDate(rec.lastLogin)}
                                </td>

                                {/* Action Buttons (Strict Fixed-Slot Straight-Line Alignment) */}
                                <td style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                    {/* Slot 1: Sub-User Button (72px fixed) or blank placeholder */}
                                    {(rec.role === 'recruiter' || rec.role === 'manager' || rec.role === 'superadmin') ? (
                                      <button 
                                        type="button"
                                        style={{
                                          width: '72px', height: '26px', boxSizing: 'border-box',
                                          background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                                          padding: 0, fontSize: '11px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer',
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        onClick={() => openAddModal(rec.name)}
                                        title={`Add new employee under ${rec.name}`}
                                      >
                                        + Sub-User
                                      </button>
                                    ) : (
                                      <div style={{ width: '72px', height: '26px' }} />
                                    )}

                                    {/* Slot 2: Edit Button (46px fixed) */}
                                    <button 
                                      type="button"
                                      style={{
                                        width: '46px', height: '26px', boxSizing: 'border-box',
                                        background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1',
                                        padding: 0, fontSize: '11.5px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                      }}
                                      onClick={() => openEditModal(rec)}
                                      title="Edit user details"
                                    >
                                      Edit
                                    </button>

                                    {/* Slot 3: Delete Button (52px fixed) or blank placeholder for primary owner */}
                                    {!isMaster ? (
                                      <button 
                                        type="button"
                                        style={{
                                          width: '52px', height: '26px', boxSizing: 'border-box',
                                          background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
                                          padding: 0, fontSize: '11.5px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer',
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        onClick={() => handleDeleteRecruiter(rec.id || rec._id, rec.name, rec.email)}
                                        title="Permanently delete user"
                                      >
                                        Delete
                                      </button>
                                    ) : (
                                      <div style={{ width: '52px', height: '26px' }} />
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* Hierarchical Subordinate Rows (Excel Grid Aligned) */}
                              {isExpanded && subordinates.length > 0 && subordinates.map((subEmp, subIdx) => {
                                const subSourced = getSourcedCount(subEmp)
                                return (
                                  <tr 
                                    key={subEmp.id || subEmp._id || subIdx}
                                    style={{
                                      background: '#f8fafc',
                                      borderLeft: '3px solid #2563eb',
                                      transition: 'background-color 0.12s ease'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#eff6ff' }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8fafc' }}
                                  >
                                    {/* Sl. No */}
                                    <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center', color: '#64748b', fontSize: '11px', fontWeight: '600' }}>
                                      {index + 1}.{subIdx + 1}
                                    </td>

                                    {/* Team Member */}
                                    <td style={{ padding: '8px 12px 8px 24px', border: '1px solid #CBD5E1' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ color: '#2563eb', fontSize: '12px' }}>↳</span>
                                          <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '12px' }}>{subEmp.name}</span>
                                        </div>
                                        <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: '16px' }}>{subEmp.email}</span>
                                      </div>
                                    </td>

                                    {/* System Role */}
                                    <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>
                                      <span style={{
                                        background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                                        borderRadius: '4px', padding: '2px 7px', fontSize: '10.5px', fontWeight: '600',
                                        display: 'inline-block'
                                      }}>
                                        Employee (Sourcer)
                                      </span>
                                    </td>

                                    {/* Team Hierarchy / Reporting */}
                                    <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>
                                      <span style={{ color: '#0369a1', fontWeight: '600', fontSize: '11px', background: '#f0f9ff', padding: '2px 7px', borderRadius: '4px', border: '1px solid #bae6fd', display: 'inline-block' }}>
                                        ↳ Reports to: {rec.name}
                                      </span>
                                    </td>

                                    {/* Company & Ref */}
                                    <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>
                                      <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>{subEmp.company || rec.company || 'SmartHire'}</div>
                                    </td>

                                    {/* Sourced */}
                                    <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                      <span style={{ fontWeight: '700', color: subSourced > 0 ? '#0f172a' : '#94a3b8', fontSize: '12px' }}>{subSourced}</span>
                                    </td>

                                    {/* Extension Credits */}
                                    <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        {subEmp.credits?.isUnlimited ? (
                                          <span 
                                            onClick={() => setRefillModalRecruiter(subEmp)}
                                            style={{
                                              background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
                                              borderRadius: '12px', padding: '2px 8px', fontSize: '10.5px', fontWeight: '700',
                                              cursor: 'pointer'
                                            }}
                                            title="Unlimited credits — Click to adjust quota"
                                          >
                                            Unlimited
                                          </span>
                                        ) : (
                                          <span 
                                            onClick={() => setRefillModalRecruiter(subEmp)}
                                            style={{
                                              background: (subEmp.credits?.remainingCredits ?? 100) > 20 ? '#eff6ff' : '#fef2f2',
                                              color: (subEmp.credits?.remainingCredits ?? 100) > 20 ? '#1d4ed8' : '#dc2626',
                                              border: `1px solid ${(subEmp.credits?.remainingCredits ?? 100) > 20 ? '#bfdbfe' : '#fecaca'}`,
                                              borderRadius: '12px', padding: '2px 8px', fontSize: '10.5px', fontWeight: '700',
                                              cursor: 'pointer'
                                            }}
                                            title="Click to refill or modify sourcing extension credits"
                                          >
                                            {subEmp.credits?.remainingCredits ?? 100} / {subEmp.credits?.dailyQuota ?? 100}
                                          </span>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => setRefillModalRecruiter(subEmp)}
                                          style={{
                                            background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1',
                                            borderRadius: '4px', padding: '2px 6px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                          }}
                                          title="Refill subordinate sourcing credits"
                                        >
                                          + Refill
                                        </button>
                                      </div>
                                    </td>

                                    {/* Account Status */}
                                    <td style={{ padding: '8px 10px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '28px', height: '16px', margin: 0, cursor: 'pointer' }}>
                                          <input 
                                            type="checkbox" 
                                            checked={subEmp.isActive !== false} 
                                            onChange={() => handleToggleStatus(subEmp.id || subEmp._id, subEmp.name)} 
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                          />
                                          <span style={{
                                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: subEmp.isActive !== false ? '#2563eb' : '#cbd5e1',
                                            transition: '.2s', borderRadius: '16px'
                                          }}>
                                            <span style={{
                                              position: 'absolute', content: '""', height: '12px', width: '12px', left: subEmp.isActive !== false ? '14px' : '2px', bottom: '2px',
                                              backgroundColor: 'white', transition: '.2s', borderRadius: '50%'
                                            }}></span>
                                          </span>
                                        </label>
                                        <span style={{ fontSize: '11px', fontWeight: '600', color: subEmp.isActive !== false ? '#16a34a' : '#dc2626' }}>
                                          {subEmp.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                      </div>
                                    </td>

                                    {/* Last Active */}
                                    <td style={{ padding: '8px 12px', border: '1px solid #CBD5E1', fontSize: '11.5px', color: '#64748b' }}>
                                      {formatDate(subEmp.lastLogin)}
                                    </td>

                                    {/* Action Buttons (Strict 3-Slot Alignment Matching Parent) */}
                                    <td style={{ padding: '6px 8px', border: '1px solid #CBD5E1', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                        {/* Slot 1: 72px blank placeholder because employees cannot have subordinates */}
                                        <div style={{ width: '72px', height: '26px' }} />

                                        {/* Slot 2: Edit Button (46px fixed) */}
                                        <button 
                                          type="button"
                                          style={{
                                            width: '46px', height: '26px', boxSizing: 'border-box',
                                            background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1',
                                            padding: 0, fontSize: '11.5px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                          }}
                                          onClick={() => openEditModal(subEmp)}
                                          title="Edit employee details"
                                        >
                                          Edit
                                        </button>

                                        {/* Slot 3: Delete Button (52px fixed) */}
                                        <button 
                                          type="button"
                                          style={{
                                            width: '52px', height: '26px', boxSizing: 'border-box',
                                            background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
                                            padding: 0, fontSize: '11.5px', fontWeight: '600', borderRadius: '4px', cursor: 'pointer',
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                          }}
                                          onClick={() => handleDeleteRecruiter(subEmp.id || subEmp._id, subEmp.name, subEmp.email)}
                                          title="Permanently delete employee"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </React.Fragment>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {subTab === 'clients' && (
          <div>
            {/* KPI Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL CLIENT PORTALS</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{clientStats.totalClients || clients.length}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Enterprise Client Workspaces</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>INTERVIEWS COMPLETED</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>{clientStats.totalScreeningCompleted || 0}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>AI Video Interviews Submitted</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SCREENING CREDITS POOL</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0284c7', marginTop: '4px' }}>
                  {clients.reduce((a, c) => a + (c.screeningCredits || 0), 0)}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Available Across All Clients</div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI QUESTION CREDITS</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#6366f1', marginTop: '4px' }}>
                  {clients.reduce((a, c) => a + (c.aiCredits || 0), 0)}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>JD Question Runs Available</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                <input 
                  type="text"
                  placeholder="Search by company name, contact, or email..."
                  value={clientSearchQuery}
                  onChange={e => setClientSearchQuery(e.target.value)}
                  style={{ width: '100%', maxWidth: '360px', padding: '7px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={fetchClients}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '7px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {loadingClients ? 'Loading...' : 'Refresh List'}
                </button>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Showing <strong>{clients.filter(c => !clientSearchQuery.trim() || (c.name || '').toLowerCase().includes(clientSearchQuery.toLowerCase()) || (c.company || '').toLowerCase().includes(clientSearchQuery.toLowerCase()) || (c.email || '').toLowerCase().includes(clientSearchQuery.toLowerCase())).length}</strong> of <strong>{clients.length}</strong> B2B Clients
              </div>
            </div>

            {/* Excel-Style Table (Rule 9) */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'left', background: '#ffffff' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', width: '50px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>COMPANY & CONTACT</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>LOGIN EMAIL</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', textAlign: 'center' }}>SCREENING CREDITS</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', textAlign: 'center' }}>AI QUESTION CREDITS</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>SENDER EMAIL</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155' }}>LAST ACTIVE</th>
                      <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#334155', textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>No External B2B Clients Found</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Click "+ Add B2B Client" to provision the first dedicated client video screening workspace.</div>
                          <button 
                            type="button" 
                            onClick={() => setShowAddClientModal(true)} 
                            style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            + Add B2B Client
                          </button>
                        </td>
                      </tr>
                    ) : (
                      clients
                        .filter(c => {
                          if (!clientSearchQuery.trim()) return true
                          const q = clientSearchQuery.toLowerCase().trim()
                          return (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
                        })
                        .map((c, idx) => {
                          const scrLeft = c.screeningCredits ?? 0
                          const scrUsed = c.usedScreeningCredits ?? 0
                          const aiLeft = c.aiCredits ?? 300
                          const aiUsed = c.usedAiCredits ?? 0

                          let scrBadgeBg = '#ecfdf5'
                          let scrBadgeColor = '#059669'
                          let scrBadgeBorder = '#a7f3d0'
                          if (scrLeft <= 0) {
                            scrBadgeBg = '#fef2f2'
                            scrBadgeColor = '#dc2626'
                            scrBadgeBorder = '#fecaca'
                          } else if (scrLeft <= 10) {
                            scrBadgeBg = '#fffbeb'
                            scrBadgeColor = '#b45309'
                            scrBadgeBorder = '#fde68a'
                          }

                          return (
                            <tr 
                              key={c.email || idx}
                              style={{ 
                                background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                borderBottom: '1px solid #cbd5e1',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                            >
                              <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                                {idx + 1}
                              </td>

                              <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1' }}>
                                <div style={{ fontWeight: '700', color: '#0f172a' }}>{c.company || 'Enterprise Partner'}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{c.name || 'Client Lead'}</div>
                              </td>

                              <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1', fontFamily: 'monospace', color: '#334155' }}>
                                {c.email}
                              </td>

                              <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ background: scrBadgeBg, color: scrBadgeColor, border: `1px solid ${scrBadgeBorder}`, borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                                    {scrLeft} Available
                                  </span>
                                  <span style={{ fontSize: '10px', color: '#64748b' }}>{scrUsed} Completed</span>
                                </div>
                              </td>

                              <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                                    {aiLeft} Available
                                  </span>
                                  <span style={{ fontSize: '10px', color: '#64748b' }}>{aiUsed} Used</span>
                                </div>
                              </td>

                              <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1', fontSize: '11px' }}>
                                {c.emailConfig?.smtpHost ? (
                                  <div>
                                    <span style={{ color: '#059669', fontWeight: '700' }}>Custom SMTP</span>
                                    <div style={{ color: '#64748b', fontSize: '10.5px' }}>{c.emailConfig.fromEmail || c.email}</div>
                                  </div>
                                ) : (
                                  <span style={{ color: '#64748b' }}>Default SmartHire</span>
                                )}
                              </td>

                              <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1', fontSize: '11px', color: '#64748b' }}>
                                {c.lastActive ? new Date(c.lastActive).toLocaleDateString() : (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Active')}
                              </td>

                              <td style={{ padding: '8px 14px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRefillModalClient(c)
                                      setRefillScreeningAmount(25)
                                      setRefillAiAmount(100)
                                      setCustomSetScreening(c.screeningCredits ?? 50)
                                      setCustomSetAi(c.aiCredits ?? 300)
                                      setRefillClientMode('add')
                                    }}
                                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                    title="Refill screening or AI credits"
                                  >
                                    + Refill
                                  </button>

                                  <a
                                    href={`/client/screening?clientEmail=${encodeURIComponent(c.email)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '4px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}
                                    title="Open client video screening workspace as admin"
                                  >
                                    View Portal
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteClient(c.email, c.name)}
                                    style={{ background: 'transparent', color: '#94a3b8', border: 'none', padding: '4px 6px', fontSize: '11px', cursor: 'pointer' }}
                                    title="Remove client"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {subTab === 'candidates' && (
          <div style={{ background: '#ffffff', border: '1px solid #CBD5E1', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                    <th style={{ padding: '8px 10px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1', width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px 12px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1' }}>CANDIDATE NAME</th>
                    <th style={{ padding: '8px 12px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1' }}>EMAIL ADDRESS</th>
                    <th style={{ padding: '8px 12px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1' }}>PHONE</th>
                    <th style={{ padding: '8px 12px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1' }}>APPLIED ROLE / JOB TITLE</th>
                    <th style={{ padding: '8px 12px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1' }}>SOURCE</th>
                    <th style={{ padding: '8px 12px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1' }}>APPLIED DATE</th>
                    <th style={{ padding: '8px 12px', fontWeight: '700', fontSize: '11px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #CBD5E1' }}>APPLICATION STATUS</th>
                    <th style={{ padding: '8px 10px', fontWeight: '700', fontSize: '11px', color: '#334155', textAlign: 'center', width: '90px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPortalCandidates ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
                        Loading job site applicants...
                      </td>
                    </tr>
                  ) : portalCandidates && portalCandidates.length > 0 ? (
                    portalCandidates.map((cand, idx) => (
                      <tr
                        key={cand.id || cand._id || idx}
                        style={{
                          background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0',
                          height: '38px',
                          transition: 'background-color 0.1s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC')}
                      >
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: '11px', color: '#64748B', borderRight: '1px solid #E2E8F0', fontWeight: '600' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '6px 12px', borderRight: '1px solid #E2E8F0' }}>
                          <strong style={{ color: '#0F172A', fontSize: '12px', fontWeight: '600' }}>{cand.name}</strong>
                        </td>
                        <td style={{ padding: '6px 12px', color: '#475569', fontSize: '11.5px', borderRight: '1px solid #E2E8F0' }}>
                          {cand.email}
                        </td>
                        <td style={{ padding: '6px 12px', color: '#64748B', fontSize: '11.5px', borderRight: '1px solid #E2E8F0' }}>
                          {cand.phone || '—'}
                        </td>
                        <td style={{ padding: '6px 12px', color: '#334155', fontSize: '12px', fontWeight: '500', borderRight: '1px solid #E2E8F0' }}>
                          {cand.jobTitle || cand.role || 'Job Site Applicant'}
                        </td>
                        <td style={{ padding: '6px 12px', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{ background: '#F1F5F9', color: '#334155', padding: '2px 7px', borderRadius: '3px', fontSize: '10.5px', fontWeight: '600', border: '1px solid #CBD5E1' }}>
                            Job Site Portal
                          </span>
                        </td>
                        <td style={{ padding: '6px 12px', color: '#64748B', fontSize: '11px', borderRight: '1px solid #E2E8F0' }}>
                          {formatDate(cand.appliedDate)}
                        </td>
                        <td style={{ padding: '6px 12px', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '10.5px', padding: '2px 7px', borderRadius: '3px', fontWeight: '600' }}>
                            {cand.status || 'Applied'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(cand)}
                            style={{ background: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', padding: '3px 8px', fontSize: '11px', fontWeight: '600', borderRadius: '3px', cursor: 'pointer' }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B', fontSize: '13px' }}>
                        <div style={{ fontWeight: '600', color: '#334155', marginBottom: '4px' }}>No Job Site Applicants Registered Yet</div>
                        <div>Candidates who register or apply directly from the Careers Job Site (/jobs) will appear here.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDIT & ACTIVITY LOG SUB-TAB */}
        {subTab === 'audit' && (
          <div className="card shadow-sm" style={{ padding: 20 }}>
            <AuditActivityLogModule />
          </div>
        )}

        {/* ROLE PERMISSIONS SUB-TAB */}
        {subTab === 'permissions' && (
          <div className="card shadow-sm" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800 }}>Role-Based Workspace Access (Pages ON/OFF)</h4>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-soft)' }}>
              Configure which workspaces, portals, and ATS modules are accessible to Managers and Recruiters. Any change takes effect in real-time.
            </p>
            <div className="permission-grid-wrap">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Page / Module / Workspace</th>
                    <th style={{ textAlign: 'center' }}>Super Admin Access</th>
                    <th style={{ textAlign: 'center' }}>Manager Access</th>
                    <th style={{ textAlign: 'center' }}>Recruiter Access</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'ats', label: 'ATS Workspace Platform (/ats)', desc: 'Core ATS Talent portal with candidate database, screening, and jobs.' },
                    { id: 'dashboard', label: 'Executive Dashboard (/dashboard)', desc: 'Requisition allocation, candidate submissions, and VMS metrics.' },
                    { id: 'audit', label: 'Audit & Activity Log (/ats?tab=audit)', desc: 'Chronological timeline of candidate status changes & reviews.' },
                    { id: 'linkedin', label: 'LinkedIn Automation (/linkedin-posts)', desc: 'Auto-post vacancies and social outreach studio.' },
                    { id: 'branding', label: 'AI Branding Studio (/branding)', desc: 'Marketing flyers, promotional banners, and social creatives.' },
                    { id: 'jobs', label: 'Jobs Hub (ATS Module)', desc: 'Post new positions, scrape JDs, and link openings.' },
                    { id: 'candidates', label: 'Candidate List (ATS Module)', desc: 'Review, search, filter, and modify candidate talent profiles.' },
                    { id: 'pipeline', label: 'Visual Pipeline (ATS Module)', desc: 'Kanban board of candidates across hiring stages.' },
                    { id: 'screening', label: 'Video & Audio Screening (ATS Module)', desc: 'SmartHire asynchronous 1-way video, audio, and text candidate screening.' },
                    { id: 'submissions', label: 'Client Submissions & RTR (ATS Module)', desc: 'Package and submit shortlisted candidate profiles to clients.' },
                    { id: 'automation', label: 'Automation Rules (ATS Module)', desc: 'Configure background jobs, webhooks, and automation triggers.' },
                    { id: 'inbox', label: 'Real-time Inbox (ATS Module)', desc: '1-on-1 direct candidate messaging platform.' }
                  ].map(page => {
                    return (
                      <tr key={page.id}>
                        <td>
                          <div>
                            <strong style={{ display: 'block', color: 'var(--ink)' }}>{page.label}</strong>
                            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{page.desc}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={!!permissions['superadmin']?.[page.id]} 
                            onChange={() => handleTogglePermission('superadmin', page.id)}
                            style={{ width: 18, height: 18, accentColor: 'var(--brand)', cursor: 'pointer' }}
                            disabled={page.id === 'users' || page.id === 'settings'}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={permissions['manager']?.[page.id] !== false} 
                            onChange={() => handleTogglePermission('manager', page.id)}
                            style={{ width: 18, height: 18, accentColor: '#d97706', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={!!permissions['recruiter']?.[page.id]} 
                            onChange={() => handleTogglePermission('recruiter', page.id)}
                            style={{ width: 18, height: 18, accentColor: 'var(--brand)', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add New Team Member</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddRecruiter}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Alok Sharma" 
                  value={newRecName}
                  onChange={e => setNewRecName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="alok@coolsofttech.com" 
                  value={newRecEmail}
                  onChange={e => setNewRecEmail(e.target.value)}
                />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#475569' }}>
                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>Authentication & Password Setup</div>
                Passwordless setup. The user sets their own secure password via "Forgot Password" on the login screen, or signs in using Google OAuth.
              </div>

              <div className="form-group">
                <label>Company</label>
                <input 
                  type="text" 
                  placeholder="e.g. SmartHire" 
                  value={newRecCompany}
                  onChange={e => setNewRecCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Referral Tracking Code (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. alok-s (Leave blank to auto-generate)" 
                  value={newRecRef}
                  onChange={e => setNewRecRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>User System Role *</label>
                <select value={newRecRole} onChange={e => setNewRecRole(e.target.value)} style={{ fontWeight: 'bold' }}>
                  <option value="superadmin">Super Admin (Full Control)</option>
                  <option value="manager">Manager / Account Lead (Candidate & AI Reviewer)</option>
                  <option value="recruiter">Lead Recruiter (Client Submissions & Sourcing)</option>
                  <option value="employee">Employee / Sub-Recruiter (Reporting to Recruiter)</option>
                </select>
              </div>

              {newRecRole === 'employee' && (
                <div className="form-group" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 12px' }}>
                  <label style={{ fontWeight: 'bold', color: '#166534' }}>Reporting Lead Recruiter / Manager *</label>
                  <select 
                    value={newRecParent} 
                    onChange={e => setNewRecParent(e.target.value)}
                    style={{ background: '#ffffff', fontWeight: 'bold', marginTop: '4px' }}
                    required
                  >
                    <option value="">-- Select Reporting Lead Recruiter --</option>
                    {recruiters
                      .filter(r => r.role === 'recruiter' || r.role === 'manager' || r.role === 'superadmin')
                      .map(r => (
                        <option key={r.id || r._id} value={r.name}>
                          {r.name} ({r.role}) — {r.email}
                        </option>
                      ))}
                  </select>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    Requisitions assigned to this employee will automatically be accessible to this reporting recruiter.
                  </div>
                </div>
              )}

              <div className="form-group" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px' }}>
                <label style={{ fontWeight: 'bold', color: '#1e293b' }}>Extension Sourcing & Email Credits</label>
                <select 
                  value={newRecCredits} 
                  onChange={e => setNewRecCredits(e.target.value)}
                  style={{ background: '#ffffff', fontWeight: 'bold', marginTop: '4px' }}
                >
                  <option value="100">100 Credits (Standard Starter)</option>
                  <option value="250">250 Credits (Active Recruiter)</option>
                  <option value="500">500 Credits (High Volume)</option>
                  <option value="1000">1,000 Credits (Power Sourcing)</option>
                  <option value="unlimited">Unlimited Credits (Super Admin / No Quota)</option>
                </select>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Used by Chrome Extension: 1 credit per candidate scrape, 2 credits per candidate email outreach.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ background: '#4f46e5', color: '#ffffff' }}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editRecruiter && (
        <div className="modal-overlay" onClick={() => setEditRecruiter(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Edit Team Member Details</h3>
              <button 
                onClick={() => setEditRecruiter(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdateRecruiter}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={editRecName}
                  onChange={e => setEditRecName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  required 
                  value={editRecEmail}
                  onChange={e => setEditRecEmail(e.target.value)}
                  disabled={editRecruiter.email === 'omkesh@coolsofttech.com'} 
                />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#475569' }}>
                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>Password Security</div>
                Passwords are encrypted and never shown. The user can reset or update their password anytime using "Forgot Password" on the login portal.
              </div>

              <div className="form-group">
                <label>Company</label>
                <input 
                  type="text" 
                  value={editRecCompany}
                  onChange={e => setEditRecCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Referral Tracking Code</label>
                <input 
                  type="text" 
                  value={editRecRef}
                  onChange={e => setEditRecRef(e.target.value)}
                  disabled={editRecruiter.email === 'omkesh@coolsofttech.com'}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>User System Role *</label>
                <select 
                  value={editRecRole} 
                  onChange={e => setEditRecRole(e.target.value)} 
                  disabled={editRecruiter.email === 'omkesh@coolsofttech.com'}
                  style={{ fontWeight: 'bold' }}
                >
                  <option value="superadmin">Super Admin (Full Control)</option>
                  <option value="manager">Manager / Account Lead (Candidate & AI Reviewer)</option>
                  <option value="recruiter">Lead Recruiter (Client Submissions & Sourcing)</option>
                  <option value="employee">Employee / Sub-Recruiter (Reporting to Recruiter)</option>
                </select>
              </div>

              {editRecRole === 'employee' && (
                <div className="form-group" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 12px' }}>
                  <label style={{ fontWeight: 'bold', color: '#166534' }}>Reporting Lead Recruiter / Manager *</label>
                  <select 
                    value={editRecParent} 
                    onChange={e => setEditRecParent(e.target.value)}
                    style={{ background: '#ffffff', fontWeight: 'bold', marginTop: '4px' }}
                  >
                    <option value="">-- Select Reporting Lead Recruiter --</option>
                    {recruiters
                      .filter(r => (r.role === 'recruiter' || r.role === 'manager' || r.role === 'superadmin') && r.id !== editRecruiter.id)
                      .map(r => (
                        <option key={r.id || r._id} value={r.name}>
                          {r.name} ({r.role}) — {r.email}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontWeight: 'bold', color: '#1e293b' }}>Extension Sourcing Credits</label>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Balance: <strong>{editRecruiter?.credits?.isUnlimited ? 'Unlimited' : `${editRecruiter?.credits?.remainingCredits ?? 100} / ${editRecruiter?.credits?.dailyQuota ?? 100}`}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const recToRefill = editRecruiter;
                      setEditRecruiter(null);
                      setRefillModalRecruiter(recToRefill);
                    }}
                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 10px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Refill Credits
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditRecruiter(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Update Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS MODAL */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-card" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Job Site Applicant Profile</h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>Verified candidate application from Careers Job Site</p>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-soft)' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Personal Information</div>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Name:</strong> {selectedCandidate.name}</p>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Email:</strong> {selectedCandidate.email}</p>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Phone:</strong> {selectedCandidate.phone || '—'}</p>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Location:</strong> {selectedCandidate.location || '—'}</p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>Application Record</div>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Applied Role:</strong> {selectedCandidate.jobTitle || selectedCandidate.role || 'Job Site Applicant'}</p>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Source:</strong> Job Site Portal</p>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Status:</strong> <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>{selectedCandidate.status || 'Applied'}</span></p>
                <p style={{ margin: '4px 0', fontSize: '12.5px' }}><strong>Applied Date:</strong> {formatDate(selectedCandidate.appliedDate)}</p>
              </div>
            </div>

            {selectedCandidate.comments && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Candidate Notes / Comments</div>
                <div style={{ fontSize: '12px', color: '#334155' }}>{selectedCandidate.comments}</div>
              </div>
            )}

            {selectedCandidate.resumeUrl && (
              <div style={{ marginBottom: '16px' }}>
                <a
                  href={selectedCandidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2563EB', color: '#FFFFFF', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}
                >
                  Download Submitted Resume
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn" onClick={() => setSelectedCandidate(null)} style={{ background: '#334155', color: '#FFFFFF', fontSize: '12px', padding: '6px 14px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {refillModalRecruiter && (
        <div className="modal-overlay" onClick={() => setRefillModalRecruiter(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Refill Sourcing Credits
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                  User: <strong>{refillModalRecruiter.name}</strong> ({refillModalRecruiter.email})
                </p>
              </div>
              <button 
                onClick={() => setRefillModalRecruiter(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Current Balance:</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: refillModalRecruiter.credits?.isUnlimited ? '#059669' : '#1d4ed8' }}>
                  {refillModalRecruiter.credits?.isUnlimited ? 'Unlimited Credits' : `${refillModalRecruiter.credits?.remainingCredits ?? 100} / ${refillModalRecruiter.credits?.dailyQuota ?? 100} credits`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Select Refill Action:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  disabled={isRefilling}
                  onClick={() => handleRefillCredits(refillModalRecruiter.email, 50, false, 'add')}
                  style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12.5px', fontWeight: '700', color: '#0f172a', cursor: 'pointer' }}
                >
                  {isRefilling ? 'Updating...' : '+50 Credits'}
                </button>
                <button
                  type="button"
                  disabled={isRefilling}
                  onClick={() => handleRefillCredits(refillModalRecruiter.email, 100, false, 'add')}
                  style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #2563eb', background: '#eff6ff', fontSize: '12.5px', fontWeight: '700', color: '#1d4ed8', cursor: 'pointer' }}
                >
                  {isRefilling ? 'Updating...' : '+100 Credits'}
                </button>
                <button
                  type="button"
                  disabled={isRefilling}
                  onClick={() => handleRefillCredits(refillModalRecruiter.email, 250, false, 'add')}
                  style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12.5px', fontWeight: '700', color: '#0f172a', cursor: 'pointer' }}
                >
                  {isRefilling ? 'Updating...' : '+250 Credits'}
                </button>
                <button
                  type="button"
                  disabled={isRefilling}
                  onClick={() => handleRefillCredits(refillModalRecruiter.email, 999999, true, 'unlimited')}
                  style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #059669', background: '#ecfdf5', fontSize: '12.5px', fontWeight: '700', color: '#047857', cursor: 'pointer' }}
                >
                  {isRefilling ? 'Updating...' : 'Make Unlimited'}
                </button>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  placeholder="Custom amount (e.g. 500)" 
                  id="customCreditInput"
                  min="1"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                />
                <button
                  type="button"
                  disabled={isRefilling}
                  onClick={() => {
                    const el = document.getElementById('customCreditInput')
                    const val = parseInt(el?.value, 10)
                    if (val && val > 0) {
                      handleRefillCredits(refillModalRecruiter.email, val, false, 'add')
                    }
                  }}
                  style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {isRefilling ? 'Saving...' : '+ Add Custom'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRefillModalRecruiter(null)}
                style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD B2B CLIENT MODAL ─────────────────────────────────────── */}
      {showAddClientModal && (
        <div className="modal-overlay" onClick={() => setShowAddClientModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Provision B2B Client Portal
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Set up a dedicated video screening workspace with login access and credit quota.
                </p>
              </div>
              <button 
                onClick={() => setShowAddClientModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Client Contact / Hiring Lead Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Company / Organization Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Apex Global Tech"
                    value={newClientCompany}
                    onChange={e => setNewClientCompany(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Login Corporate Email *
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="e.g. sarah@apextech.com"
                    value={newClientEmail}
                    onChange={e => setNewClientEmail(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#0369a1' }}>
                  <div style={{ fontWeight: '700', color: '#0c4a6e', marginBottom: '2px' }}>Client Access & Sign-In</div>
                  Clients sign in securely with their corporate email using Google OAuth, or set their initial password via "Forgot Password" on the login screen.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Screening Credits (Interviews)
                    </label>
                    <select
                      value={newClientScreeningCredits}
                      onChange={e => setNewClientScreeningCredits(parseInt(e.target.value, 10))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', boxSizing: 'border-box' }}
                    >
                      <option value="10">10 Interviews (Trial)</option>
                      <option value="25">25 Interviews (Starter)</option>
                      <option value="50">50 Interviews (Default)</option>
                      <option value="100">100 Interviews (Growth)</option>
                      <option value="250">250 Interviews (Enterprise)</option>
                      <option value="500">500 Interviews (Custom Max)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      AI Question Credits
                    </label>
                    <select
                      value={newClientAiCredits}
                      onChange={e => setNewClientAiCredits(parseInt(e.target.value, 10))}
                      style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', boxSizing: 'border-box' }}
                    >
                      <option value="50">50 AI Runs</option>
                      <option value="100">100 AI Runs</option>
                      <option value="300">300 AI Runs (Default)</option>
                      <option value="500">500 AI Runs</option>
                      <option value="1000">1,000 AI Runs</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                  <strong>Client Security Scoping:</strong> This client will only have access to their isolated Video Screening Portal at <code>/client/screening</code>. They will have zero access to your internal ATS requisitions, candidates, or recruiter team data.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12.5px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#0284c7', fontSize: '12.5px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                >
                  {isCreatingClient ? 'Provisioning...' : 'Provision Client Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REFILL B2B CLIENT CREDITS MODAL ─────────────────────────── */}
      {refillModalClient && (
        <div className="modal-overlay" onClick={() => setRefillModalClient(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Refill B2B Client Credits
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Client: <strong>{refillModalClient.name}</strong> ({refillModalClient.company || ''} &bull; {refillModalClient.email})
                </p>
              </div>
              <button 
                onClick={() => setRefillModalClient(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            {/* Current Balance Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#065f46', textTransform: 'uppercase' }}>Current Screenings</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669', marginTop: '2px' }}>
                  {refillModalClient.screeningCredits ?? 0} Available
                </div>
                <div style={{ fontSize: '10.5px', color: '#047857' }}>{refillModalClient.usedScreeningCredits ?? 0} Completed</div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase' }}>Current AI Credits</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1d4ed8', marginTop: '2px' }}>
                  {refillModalClient.aiCredits ?? 300} Available
                </div>
                <div style={{ fontSize: '10.5px', color: '#2563eb' }}>{refillModalClient.usedAiCredits ?? 0} Used</div>
              </div>
            </div>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '6px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setRefillClientMode('add')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: refillClientMode === 'add' ? '#ffffff' : 'transparent',
                  color: refillClientMode === 'add' ? '#0f172a' : '#64748b',
                  boxShadow: refillClientMode === 'add' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                + Add Additional Credits
              </button>
              <button
                type="button"
                onClick={() => setRefillClientMode('set')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: refillClientMode === 'set' ? '#ffffff' : 'transparent',
                  color: refillClientMode === 'set' ? '#0f172a' : '#64748b',
                  boxShadow: refillClientMode === 'set' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Set Exact Balance (=)
              </button>
            </div>

            {refillClientMode === 'add' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Add Video Screening Credits (Interviews):
                  </label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    {[10, 25, 50, 100].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRefillScreeningAmount(amt)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          borderRadius: '5px',
                          border: refillScreeningAmount === amt ? '1px solid #059669' : '1px solid #cbd5e1',
                          background: refillScreeningAmount === amt ? '#ecfdf5' : '#ffffff',
                          color: refillScreeningAmount === amt ? '#047857' : '#334155',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number"
                    min="0"
                    value={refillScreeningAmount}
                    onChange={e => setRefillScreeningAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Add AI Question Credits (JD Generator):
                  </label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    {[50, 100, 300, 500].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRefillAiAmount(amt)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          borderRadius: '5px',
                          border: refillAiAmount === amt ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: refillAiAmount === amt ? '#eff6ff' : '#ffffff',
                          color: refillAiAmount === amt ? '#1d4ed8' : '#334155',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number"
                    min="0"
                    value={refillAiAmount}
                    onChange={e => setRefillAiAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Set Exact Screening Credits Balance:
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={customSetScreening}
                    onChange={e => setCustomSetScreening(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Set Exact AI Question Credits Balance:
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={customSetAi}
                    onChange={e => setCustomSetAi(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRefillModalClient(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12.5px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRefillingClient}
                onClick={handleRefillClientCredits}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#0284c7', fontSize: '12.5px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
              >
                {isRefillingClient ? 'Updating...' : 'Save Credit Allocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled block scoped for Users tab */}
      <style>{`
        .users-module-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }
        .users-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 4px;
          color: var(--ink);
        }
        .users-subtitle {
          font-size: 13.5px;
          color: var(--ink-soft);
          margin: 0;
        }
        
        .subtabs-bar {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--line);
          padding-bottom: 2px;
        }
        .subtab-btn {
          background: none;
          border: none;
          padding: 10px 16px;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink-soft);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -4px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .subtab-btn:hover {
          color: var(--ink);
        }
        .subtab-btn.active {
          color: var(--brand);
          border-bottom-color: var(--brand);
        }
        
        .subtab-content-panel {
          min-height: 350px;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13.5px;
        }
        .users-table th {
          background: var(--bg);
          padding: 14px 16px;
          font-weight: 700;
          color: var(--ink);
          border-bottom: 1px solid var(--line);
        }
        .users-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }
        .users-table tr:hover {
          background: rgba(0,0,0,0.01);
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e0f2fe;
          color: #0369a1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
        }

        .ref-code-badge {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 12px;
          font-family: monospace;
          color: var(--ink);
        }

        .role-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-block;
        }
        .role-pill.superadmin {
          background: #fef3c7;
          color: #92400e;
        }
        .role-pill.recruiter {
          background: #dbeafe;
          color: #1e40af;
        }

        .pill-status {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: capitalize;
          display: inline-block;
        }
        .pill-status.status-new { background: #e0f2fe; color: #0369a1; }
        .pill-status.status-reviewed { background: #f3e8ff; color: #6b21a8; }
        .pill-status.status-shortlisted { background: #dcfce7; color: #166534; }
        .pill-status.status-placed { background: #dcfce7; color: #166534; }
        .pill-status.status-rejected { background: #fee2e2; color: #991b1b; }

        /* Access control tables */
        .permissions-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13.5px;
          margin-bottom: 20px;
        }
        .permissions-table th {
          background: var(--bg);
          padding: 12px 16px;
          font-weight: 700;
          color: var(--ink);
          border-bottom: 2px solid var(--line);
        }
        .permissions-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
        }
        
        .permissions-notice-box {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 16px;
          color: #78350f;
          font-size: 13.5px;
        }

        /* Toggle switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: var(--brand);
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(16px);
          -ms-transform: translateX(16px);
          transform: translateX(16px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 5000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .form-group label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--ink);
        }
        .form-group input, .form-group select {
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--surface);
          color: var(--ink);
          font-family: inherit;
          font-size: 13.5px;
          outline: none;
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--brand);
        }

        .cand-audit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .cand-audit-section {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 14px;
          font-size: 13px;
        }
        .cand-audit-section strong {
          display: block;
          margin-bottom: 8px;
          color: var(--ink);
          border-bottom: 1px solid var(--line);
          padding-bottom: 4px;
        }
        .cand-audit-section p {
          margin: 4px 0;
          color: var(--ink-soft);
        }

        /* Loading spinner */
        .loader-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid var(--line);
          border-radius: 50%;
          border-top-color: var(--brand);
          animation: spin 0.8s linear infinite;
          margin-right: 6px;
          vertical-align: middle;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Toast message styling */
        .toast-notification {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: var(--ink);
          color: var(--surface);
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          animation: slideUp 0.3s ease;
          z-index: 9999;
          display: flex;
          align-items: center;
        }
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
