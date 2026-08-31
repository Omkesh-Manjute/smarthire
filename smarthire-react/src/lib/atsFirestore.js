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

  const payload = {
    canId: String(canId),
    ...(data.name       && { name:       data.name }),
    ...(data.firstName  && { firstName:  data.firstName }),
    ...(data.lastName   && { lastName:   data.lastName }),
    ...(data.email      && { email:      data.email.toLowerCase().trim() }),
    ...(data.phone      && { phone:      data.phone }),
    ...(data.jobTitle   && { jobTitle:   data.jobTitle }),
    ...(data.workAuth   && { workAuth:   data.workAuth }),
    ...(data.payRate    && { payRate:    data.payRate }),
    ...(data.payRateTo  && { payRateTo:  data.payRateTo }),
    ...(data.rateType   && { rateType:   data.rateType }),
    ...(data.location   && { location:   data.location }),
    ...(data.skills     && { skills:     data.skills }),
    ...(data.notes      && { notes:      data.notes }),
    ...(data.projects   && { projects:   data.projects }),
    ...(data.references && { references: data.references }),
    ...(data.status     && { status:     data.status }),
    legalDocs: cleanedLegalDocs,
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, CANDIDATES_COLLECTION, String(canId)), payload, { merge: true })
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
 */
export async function uploadDocFile(canId, docKey, dataUrl, fileName, mimeType) {
  if (!canId || !docKey || !dataUrl) throw new Error('canId, docKey, dataUrl are required')

  const ext = fileName?.split('.').pop() || 'bin'
  const storagePath = `ats-documents/${canId}/${docKey}/${docKey}_${Date.now()}.${ext}`
  const storageRef = ref(storage, storagePath)

  const format = dataUrl.startsWith('data:') ? 'data_url' : 'base64'
  await uploadString(storageRef, dataUrl, format, {
    contentType: mimeType || 'application/octet-stream'
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
