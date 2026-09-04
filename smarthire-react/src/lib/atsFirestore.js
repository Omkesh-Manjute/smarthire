/**
 * SmartHire ATS — Firebase Firestore & Storage Central Data Layer
 * 
 * Collections:
 * - atsCandidates/{canId}      : Full Candidate profiles & Legal Docs metadata
 * - atsJobs/{jobId}            : Jobs, Requirements, JDs, Skills & Recruiter Attribution
 * - atsApplications/{appId}    : Public Careers Portal job applications
 * 
 * Storage Buckets:
 * - ats-documents/{canId}/{docKey}/{fileName}
 * - ats-resumes/{jobId}/{candidateEmail}/{fileName}
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { db, storage } from './firebase'

export const CANDIDATES_COLLECTION = 'atsCandidates'
export const JOBS_COLLECTION = 'atsJobs'
export const APPLICATIONS_COLLECTION = 'atsApplications'
export const REQUISITIONS_COLLECTION = 'atsRequisitions'
export const USERS_COLLECTION = 'atsUsers'
export const MESSAGES_COLLECTION = 'atsMessages'

// ─────────────────────────────────────────
// 1. CANDIDATE & LEGAL DOCS (A to Z Structured)
// ─────────────────────────────────────────

/**
 * Save/upsert full candidate data to Firestore.
 * Strips large base64 fileData before saving (only metadata stored).
 */
export async function saveCandidate(canId, data) {
  if (!canId) throw new Error('canId is required')

  const cleanedLegalDocs = {}
  if (data.legalDocs) {
    for (const [key, docItem] of Object.entries(data.legalDocs)) {
      if (docItem && typeof docItem === 'object') {
        const { fileData, ...rest } = docItem
        cleanedLegalDocs[key] = {
          ...rest,
          hasFile: !!(fileData || docItem.fileData || docItem.storageUrl),
          savedAt: new Date().toISOString()
        }
      }
    }
  }

  const cleanReqId = data.reqId || (data.job_id ? String(data.job_id).replace('J-', '') : '') || (data.jobId ? String(data.jobId).replace('J-', '') : '')

  const payload = {
    canId: String(canId),
    id: String(canId),
    ...(data.name                && { name:                data.name }),
    ...(data.firstName           && { firstName:           data.firstName }),
    ...(data.lastName            && { lastName:            data.lastName }),
    ...(data.email               && { email:               data.email.toLowerCase().trim() }),
    ...(data.phone               && { phone:               data.phone }),
    ...(data.jobTitle            && { jobTitle:            data.jobTitle }),
    ...(data.role                && { role:                data.role }),
    ...(data.fullRole            && { fullRole:            data.fullRole }),
    ...(data.workAuth            && { workAuth:            data.workAuth }),
    ...(data.payRate             && { payRate:             data.payRate }),
    ...(data.payRateTo           && { payRateTo:           data.payRateTo }),
    ...(data.payRateType         && { payRateType:         data.payRateType }),
    ...(data.rateType            && { rateType:            data.rateType }),
    ...(data.location            && { location:            data.location }),
    ...(data.skills              && { skills:              data.skills }),
    ...(data.notes               && { notes:               data.notes }),
    ...(data.projects            && { projects:            data.projects }),
    ...(data.status              && { status:              data.status }),
    ...(data.statusComments      && { statusComments:      data.statusComments }),
    ...(data.interview           && { interview:           data.interview }),
    ...(data.rejectedReason      && { rejectedReason:      data.rejectedReason }),
    ...(data.exp                 && { exp:                 data.exp }),
    ...(data.experience          && { experience:          data.experience }),
    ...(data.city                && { city:                data.city }),
    ...(data.state               && { state:               data.state }),
    ...(data.zip                 && { zip:                 data.zip }),
    ...(data.subVendor           && { subVendor:           data.subVendor }),
    ...(data.source              && { source:              data.source }),
    ...(data.rating              && { rating:              data.rating }),
    ...(data.comments            && { comments:            data.comments }),
    ...(data.assignedBy          && { assignedBy:          data.assignedBy }),
    ...(data.assignedOn          && { assignedOn:          data.assignedOn }),
    ...(data.recruiter           && { recruiter:           data.recruiter }),
    ...(data.recruiterEmail      && { recruiterEmail:      data.recruiterEmail.toLowerCase().trim() }),
    ...(data.recruiterRefCode    && { recruiterRefCode:    data.recruiterRefCode }),
    ...(data.parentRecruiterName  && { parentRecruiterName:  data.parentRecruiterName }),
    ...(data.parentRecruiterEmail && { parentRecruiterEmail: data.parentRecruiterEmail.toLowerCase().trim() }),
    ...(data.parentRecruiterId    && { parentRecruiterId:    data.parentRecruiterId }),
    ...(data.addedByName          && { addedByName:          data.addedByName }),
    ...(data.addedByRole          && { addedByRole:          data.addedByRole }),
    ...(data.submittedBy         && { submittedBy:         data.submittedBy }),
    ...(data.createdBy           && { createdBy:           data.createdBy }),
    ...(data.lastChangedBy       && { lastChangedBy:       data.lastChangedBy }),
    ...(data.lastChangedRole     && { lastChangedRole:     data.lastChangedRole }),
    ...(cleanReqId               && { reqId:               cleanReqId, job_id: `J-${cleanReqId}`, jobId: cleanReqId }),
    ...(data.resumeName          && { resumeName:          data.resumeName }),
    ...(data.resumeText          && { resumeText:          data.resumeText }),
    ...(data.resumeUrl           && { resumeUrl:           data.resumeUrl }),
    legalDocs: cleanedLegalDocs,
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, CANDIDATES_COLLECTION, String(canId)), payload, { merge: true })
  return payload
}

/**
 * Save legal document metadata for a candidate to Firestore.
 */
export async function saveLegalDocs(canId, legalDocs, opts = {}) {
  if (!canId) throw new Error('canId is required')

  const cleanedDocs = {}
  for (const [key, docItem] of Object.entries(legalDocs)) {
    if (docItem && typeof docItem === 'object') {
      const { fileData, resumeText, ...rest } = docItem
      cleanedDocs[key] = {
        ...rest,
        hasFile: !!(fileData || docItem.fileData || docItem.storageUrl),
        savedAt: new Date().toISOString()
      }
    }
  }

  await setDoc(
    doc(db, CANDIDATES_COLLECTION, String(canId)),
    {
      canId: String(canId),
      legalDocs: cleanedDocs,
      ...(opts.email         && { email: opts.email.toLowerCase().trim() }),
      ...(opts.candidateName && { name:  opts.candidateName }),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )
}

/**
 * Upload a document file (Visa, DL, RTR, SSN, Resume) to Firebase Storage.
 * Clean, deterministic storage path overwrites previous file on re-upload.
 */
export async function uploadDocFile(canId, docKey, dataUrl, fileName, mimeType) {
  if (!canId || !docKey || !dataUrl) throw new Error('canId, docKey, dataUrl are required')

  const ext = fileName?.split('.').pop()?.toLowerCase() || 'jpg'
  // Clean deterministic path: ats-documents/8756383/visa/visa.jpg (avoids duplicates)
  const storagePath = `ats-documents/${String(canId)}/${docKey}/${docKey}.${ext}`
  const storageRef = ref(storage, storagePath)

  const format = dataUrl.startsWith('data:') ? 'data_url' : 'base64'
  await uploadString(storageRef, dataUrl, format, {
    contentType: mimeType || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg')
  })

  const downloadUrl = await getDownloadURL(storageRef)
  return { downloadUrl, storagePath }
}

export async function getCandidate(canId) {
  if (!canId) return null
  const snap = await getDoc(doc(db, CANDIDATES_COLLECTION, String(canId)))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ─────────────────────────────────────────
// 2. JOBS & JOB DESCRIPTIONS (JD A-Z Storage)
// ─────────────────────────────────────────

/**
 * Save/upsert a Job Posting with Full JD and Structured Specifications
 */
export async function saveAtsJob(jobId, jobData) {
  const cleanId = String(jobId || jobData.id || `J-${Date.now()}`).trim()
  const payload = {
    id: cleanId,
    title: jobData.title || jobData.jobTitle || 'Untitled Position',
    client: jobData.client || jobData.customer || 'Enterprise Client',
    location: jobData.location || 'Remote, US',
    workMode: jobData.work_mode || jobData.workMode || 'Onsite',
    employmentType: jobData.employment_type || jobData.employmentType || 'Contract',
    experience: jobData.experience || '3+ years',
    skills: Array.isArray(jobData.skills) ? jobData.skills : (jobData.skills ? String(jobData.skills).split(',').map(s => s.trim()) : []),
    description: jobData.description || jobData.rawJd || jobData.rawDescription || '',
    billRate: jobData.billRate || '',
    payRate: jobData.payRate || '',
    status: jobData.status || 'Active',
    postedBy: jobData.postedBy || 'recruiter',
    postedByName: jobData.postedByName || 'SmartHire Recruiter',
    refCode: jobData.refCode || 'omkesh',
    createdAt: jobData.createdAt || new Date().toISOString(),
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, JOBS_COLLECTION, cleanId), payload, { merge: true })
  return payload
}

/**
 * Fetch all Jobs from Firestore
 */
export async function getAtsJobs() {
  try {
    const snap = await getDocs(collection(db, JOBS_COLLECTION))
    const jobs = []
    snap.forEach(docSnap => {
      jobs.push({ id: docSnap.id, ...docSnap.data() })
    })
    return jobs
  } catch (err) {
    console.warn('Failed to fetch jobs from Firestore:', err)
    return []
  }
}

/**
 * Real-time listener for ATS Job Requisitions in Firestore
 * Enables sub-second audio & toast notifications whenever a job is created
 */
export function subscribeAtsJobs(callback, onError) {
  try {
    const q = collection(db, JOBS_COLLECTION)
    return onSnapshot(q, (snapshot) => {
      const jobs = []
      const changes = []
      snapshot.docChanges().forEach((change) => {
        changes.push({
          type: change.type, // 'added', 'modified', 'removed'
          doc: { id: change.doc.id, ...change.doc.data() }
        })
      })
      snapshot.forEach(docSnap => {
        jobs.push({ id: docSnap.id, ...docSnap.data() })
      })
      if (typeof callback === 'function') {
        callback({ jobs, changes })
      }
    }, (err) => {
      if (typeof onError === 'function') onError(err)
      else console.warn('subscribeAtsJobs error:', err)
    })
  } catch (err) {
    if (typeof onError === 'function') onError(err)
    return () => {}
  }
}

// ─────────────────────────────────────────
// 3. PUBLIC CAREERS & CANDIDATE APPLICATIONS
// ─────────────────────────────────────────

/**
 * Save a candidate's job application from the Public Careers portal
 */
export async function saveCareerApplication(appData, resumeFileOrDataUrl = null) {
  const appId = appData.sessionId || appData.candidateId || `SCR-${Date.now()}`
  let resumeUrl = appData.resumeUrl || ''

  // If a resume file was provided, upload to Firebase Storage
  if (resumeFileOrDataUrl) {
    try {
      const ext = appData.resumeFileName?.split('.').pop() || 'pdf'
      const cleanEmail = (appData.email || 'applicant').replace(/[^a-zA-Z0-9]/g, '_')
      const storagePath = `ats-resumes/${appData.jobId || 'general'}/${cleanEmail}/${Date.now()}_Resume.${ext}`
      const storageRef = ref(storage, storagePath)

      if (typeof resumeFileOrDataUrl === 'string') {
        const format = resumeFileOrDataUrl.startsWith('data:') ? 'data_url' : 'base64'
        await uploadString(storageRef, resumeFileOrDataUrl, format)
      } else if (resumeFileOrDataUrl instanceof File || resumeFileOrDataUrl instanceof Blob) {
        await uploadBytes(storageRef, resumeFileOrDataUrl)
      }
      resumeUrl = await getDownloadURL(storageRef)
    } catch (uploadErr) {
      console.warn('Resume storage upload failed in saveCareerApplication:', uploadErr)
    }
  }

  const payload = {
    appId,
    sessionId: appId,
    canId: String(appData.canId || Math.floor(10000 + Math.random() * 89999)),
    name: appData.name || `${appData.fName || ''} ${appData.lName || ''}`.trim(),
    email: (appData.email || '').toLowerCase().trim(),
    phone: appData.phone || '',
    currentLocation: appData.currentLocation || '',
    jobId: appData.jobId || '',
    jobTitle: appData.jobTitle || '',
    relocatePref: appData.relocatePref || 'Yes',
    contractType: appData.contractType || 'C2C',
    visaStatus: appData.visaStatus || 'US Citizen',
    expectedRate: appData.expectedRate || '',
    recruiter: appData.recruiter || '',
    recruiterEmail: appData.recruiterEmail || '',
    recruiterRef: appData.recruiterRef || '',
    resumeUrl,
    resumeText: appData.resumeText || '',
    status: appData.status || 'Int-SubmittedToManager',
    comments: appData.comments || 'Submitted from SmartHire Careers',
    appliedDate: appData.appliedDate || new Date().toISOString(),
    createdAt: serverTimestamp()
  }

  await setDoc(doc(db, APPLICATIONS_COLLECTION, appId), payload, { merge: true })
  
  // Also register candidate in atsCandidates collection
  if (payload.canId) {
    try {
      await saveCandidate(payload.canId, {
        canId: payload.canId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        jobTitle: payload.jobTitle,
        workAuth: payload.visaStatus,
        location: payload.currentLocation,
        status: payload.status,
        notes: payload.comments,
        legalDocs: {
          resume: {
            title: appData.resumeFileName || 'Resume.pdf',
            fileName: appData.resumeFileName || 'Resume.pdf',
            uploadedOn: new Date().toLocaleDateString(),
            status: 'Uploaded',
            storageUrl: resumeUrl,
            resumeText: appData.resumeText || ''
          }
        }
      })
    } catch(e) {}
  }

  return payload
}

/**
 * Fetch all Applications from Firestore
 */
export async function getCareerApplications() {
  try {
    const snap = await getDocs(collection(db, APPLICATIONS_COLLECTION))
    const apps = []
    snap.forEach(docSnap => {
      apps.push({ id: docSnap.id, ...docSnap.data() })
    })
    return apps
  } catch (err) {
    console.warn('Failed to fetch applications from Firestore:', err)
    return []
  }
}

// ─────────────────────────────────────────
// 4. CANDIDATE DIRECTORY & REQUISITION SYNC
// ─────────────────────────────────────────

/**
 * Fetch all Candidates from Firestore atsCandidates collection
 */
export async function getAllCandidates() {
  try {
    const snap = await getDocs(collection(db, CANDIDATES_COLLECTION))
    const candidates = []
    snap.forEach(docSnap => {
      candidates.push({ id: docSnap.id, canId: docSnap.id, ...docSnap.data() })
    })
    return candidates
  } catch (err) {
    console.warn('Failed to fetch all candidates from Firestore:', err)
    return []
  }
}

/**
 * Save candidate list specifically for a Requisition
 */
export async function saveRequisitionCandidates(reqId, candidatesList) {
  if (!reqId) return
  const cleanId = String(reqId).replace('J-', '').replace('REQ-', '').trim()
  try {
    const payload = {
      reqId: cleanId,
      candidates: Array.isArray(candidatesList) ? candidatesList : [],
      updatedAt: serverTimestamp()
    }
    await setDoc(doc(db, REQUISITIONS_COLLECTION, cleanId), payload, { merge: true })
    return payload
  } catch (err) {
    console.warn('Failed to save requisition candidates to Firestore:', err)
  }
}

/**
 * Get candidate list attached to a Requisition from Firestore
 */
export async function getRequisitionCandidates(reqId) {
  if (!reqId) return []
  const cleanId = String(reqId).replace('J-', '').replace('REQ-', '').trim()
  try {
    const snap = await getDoc(doc(db, REQUISITIONS_COLLECTION, cleanId))
    if (snap.exists()) {
      const data = snap.data()
      if (Array.isArray(data.candidates)) {
        return data.candidates
      }
    }
    return []
  } catch (err) {
    console.warn('Failed to fetch requisition candidates from Firestore:', err)
    return []
  }
}

/**
 * Sync team users to Firestore
 */
export async function saveTeamUsersFirestore(usersList) {
  try {
    if (!Array.isArray(usersList)) return
    for (const u of usersList) {
      const uid = String(u.id || u._id || u.email || '').replace(/[^a-zA-Z0-9]/g, '_')
      if (uid) {
        // Explicitly strip password so sensitive credentials are never written to Firestore
        const { password: _p, ...cleanUser } = u
        await setDoc(doc(db, USERS_COLLECTION, uid), {
          ...cleanUser,
          updatedAt: serverTimestamp()
        }, { merge: true })
      }
    }
  } catch (err) {
    console.warn('Failed to save team users to Firestore:', err)
  }
}

/**
 * Fetch team users from Firestore
 */
export async function getTeamUsersFirestore() {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION))
    const users = []
    snap.forEach(docSnap => {
      const data = docSnap.data() || {}
      delete data.password // Defensive: never expose password
      users.push({ id: docSnap.id, ...data })
    })
    return users
  } catch (err) {
    console.warn('Failed to fetch team users from Firestore:', err)
    return []
  }
}

/**
 * Look up user profile by email in Firestore
 */
export async function getUserProfileByEmailFirestore(email) {
  try {
    if (!email) return null
    const clean = String(email).toLowerCase().trim()
    const snap = await getDocs(collection(db, USERS_COLLECTION))
    let found = null
    snap.forEach(docSnap => {
      const data = docSnap.data() || {}
      if ((data.email || '').toLowerCase().trim() === clean) {
        delete data.password
        found = { id: docSnap.id, ...data }
      }
    })
    return found
  } catch (err) {
    console.warn('Firestore user lookup error:', err)
    return null
  }
}

/**
 * Universal Candidate Deduplication Utility
 * Deduplicates by Email, Name + Phone, Name, or ID.
 */
export function deduplicateCandidates(list) {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  const result = []

  for (const c of list) {
    if (!c) continue
    const email = (c.email || c.extracted_profile?.email || '').toLowerCase().trim()
    const name = (c.name || c.extracted_profile?.name || '').toLowerCase().trim().replace(/\s+/g, ' ')
    const phone = String(c.phone || c.phoneCell || c.extracted_profile?.phone || '').replace(/\D/g, '')
    const id = String(c.id || c.canId || c._id || '').trim()

    const emailKey = email ? `email:${email}` : null
    const namePhoneKey = (name && phone.length >= 7) ? `np:${name}_${phone}` : null
    const nameKey = name ? `name:${name}` : null
    const idKey = id ? `id:${id}` : null

    if (emailKey && seen.has(emailKey)) continue
    if (namePhoneKey && seen.has(namePhoneKey)) continue
    if (!emailKey && !namePhoneKey && nameKey && seen.has(nameKey)) continue
    if (!emailKey && !nameKey && idKey && seen.has(idKey)) continue

    if (emailKey) seen.add(emailKey)
    if (namePhoneKey) seen.add(namePhoneKey)
    if (nameKey) seen.add(nameKey)
    if (idKey) seen.add(idKey)

    result.push(c)
  }

  return result
}

/**
 * ─────────────────────────────────────────
 * 6. REAL-TIME TEAM & CANDIDATE MESSAGING
 * ─────────────────────────────────────────
 */

/**
 * Save / sync message to Firestore
 */
export async function saveMessageFirestore(threadId, msgObj) {
  try {
    if (!threadId || !msgObj) return
    const cleanThreadId = String(threadId).replace(/[^a-zA-Z0-9_-]/g, '_')
    const threadDocRef = doc(db, MESSAGES_COLLECTION, cleanThreadId)
    
    // Get existing thread doc to append message
    const snap = await getDoc(threadDocRef)
    let existingMsgs = []
    if (snap.exists()) {
      const data = snap.data()
      existingMsgs = Array.isArray(data.messages) ? data.messages : []
    }

    const newMsg = {
      id: msgObj.id || `msg-${Date.now()}`,
      sender: msgObj.sender || 'recruiter',
      senderName: msgObj.senderName || 'Team Member',
      senderEmail: msgObj.senderEmail || '',
      text: msgObj.text || '',
      timestamp: msgObj.timestamp || new Date().toISOString(),
      candidateId: threadId
    }

    const updatedMsgs = [...existingMsgs.filter(m => m.id !== newMsg.id), newMsg]

    await setDoc(threadDocRef, {
      threadId: cleanThreadId,
      rawThreadId: threadId,
      lastMessage: newMsg.text,
      lastMessageTime: newMsg.timestamp,
      lastSenderName: newMsg.senderName,
      messages: updatedMsgs,
      updatedAt: serverTimestamp()
    }, { merge: true })

    return updatedMsgs
  } catch (err) {
    console.warn('saveMessageFirestore warning:', err)
    return null
  }
}

/**
 * Fetch messages for a thread from Firestore
 */
export async function getMessagesFirestore(threadId) {
  try {
    if (!threadId) return []
    const cleanThreadId = String(threadId).replace(/[^a-zA-Z0-9_-]/g, '_')
    const snap = await getDoc(doc(db, MESSAGES_COLLECTION, cleanThreadId))
    if (snap.exists()) {
      const data = snap.data()
      return Array.isArray(data.messages) ? data.messages : []
    }
    return []
  } catch (err) {
    console.warn('getMessagesFirestore warning:', err)
    return []
  }
}

/**
 * Fetch all threads from Firestore
 */
export async function getAllThreadsFirestore() {
  try {
    const snap = await getDocs(collection(db, MESSAGES_COLLECTION))
    const threads = []
    snap.forEach(d => {
      threads.push({ id: d.id, ...d.data() })
    })
    return threads
  } catch (err) {
    console.warn('getAllThreadsFirestore warning:', err)
    return []
  }
}


