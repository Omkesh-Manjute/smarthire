/**
 * SmartHire ATS — Firebase Firestore & Storage Helpers
 * 
 * Collection: atsCandidates/{canId}
 * Storage:    ats-documents/{canId}/{docKey}/{fileName}
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { db, storage } from './firebase'

const COLLECTION = 'atsCandidates'

// ─────────────────────────────────────────
// CANDIDATE DOCUMENT — Save full ATS data
// ─────────────────────────────────────────

/**
 * Save/upsert full candidate data to Firestore.
 * Strips large base64 fileData before saving (only metadata stored).
 * @param {string} canId  Local candidate ID e.g. "8756383"
 * @param {object} data   Candidate data object
 */
export async function saveCandidate(canId, data) {
  if (!canId) throw new Error('canId is required')

  // Strip heavy base64 fileData from legalDocs before storing in Firestore
  const cleanedLegalDocs = {}
  if (data.legalDocs) {
    for (const [key, docItem] of Object.entries(data.legalDocs)) {
      if (docItem && typeof docItem === 'object') {
        const { fileData, ...rest } = docItem
        cleanedLegalDocs[key] = {
          ...rest,
          hasFile: !!(fileData || docItem.fileData),
          savedAt: new Date().toISOString()
        }
      }
    }
  }

  const payload = {
    canId,
    ...(data.name       && { name:       data.name }),
    ...(data.email      && { email:       data.email }),
    ...(data.phone      && { phone:       data.phone }),
    ...(data.jobTitle   && { jobTitle:    data.jobTitle }),
    ...(data.workAuth   && { workAuth:    data.workAuth }),
    ...(data.payRate    && { payRate:     data.payRate }),
    ...(data.payRateTo  && { payRateTo:   data.payRateTo }),
    ...(data.rateType   && { rateType:    data.rateType }),
    ...(data.location   && { location:    data.location }),
    ...(data.skills     && { skills:      data.skills }),
    ...(data.notes      && { notes:       data.notes }),
    ...(data.projects   && { projects:    data.projects }),
    ...(data.references && { references:  data.references }),
    legalDocs: cleanedLegalDocs,
    updatedAt: serverTimestamp()
  }

  await setDoc(doc(db, COLLECTION, canId), payload, { merge: true })
}

// ─────────────────────────────────────────
// LEGAL DOCS — Save document metadata only
// ─────────────────────────────────────────

/**
 * Save legal document metadata for a candidate to Firestore.
 * Does NOT store the actual file (use uploadDocFile for that).
 * @param {string} canId    Local candidate ID
 * @param {object} legalDocs  The full documents state object
 * @param {object} opts     Optional { email, candidateName }
 */
export async function saveLegalDocs(canId, legalDocs, opts = {}) {
  if (!canId) throw new Error('canId is required')

  // Strip base64 fileData — keep metadata only
  const cleanedDocs = {}
  for (const [key, docItem] of Object.entries(legalDocs)) {
    if (docItem && typeof docItem === 'object') {
      const { fileData, resumeText, ...rest } = docItem
      cleanedDocs[key] = {
        ...rest,
        hasFile: !!(fileData || docItem.fileData),
        savedAt: new Date().toISOString()
      }
    }
  }

  await setDoc(
    doc(db, COLLECTION, canId),
    {
      canId,
      legalDocs: cleanedDocs,
      ...(opts.email         && { email:         opts.email }),
      ...(opts.candidateName && { name:           opts.candidateName }),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )
}

// ─────────────────────────────────────────
// FILE UPLOAD — Upload file to Firebase Storage
// ─────────────────────────────────────────

/**
 * Upload a document file (as base64 data URL) to Firebase Storage.
 * Returns the public download URL.
 * @param {string} canId    Local candidate ID
 * @param {string} docKey   e.g. 'visa', 'dl', 'rtr', 'ssn', 'resume', 'coversheet'
 * @param {string} dataUrl  base64 data URL (from FileReader)
 * @param {string} fileName Original file name
 * @param {string} mimeType e.g. 'image/jpeg', 'application/pdf'
 * @returns {Promise<string>} Download URL
 */
export async function uploadDocFile(canId, docKey, dataUrl, fileName, mimeType) {
  if (!canId || !docKey || !dataUrl) throw new Error('canId, docKey, dataUrl are required')

  const ext = fileName?.split('.').pop() || 'bin'
  const storagePath = `ats-documents/${canId}/${docKey}/${docKey}_${Date.now()}.${ext}`
  const storageRef = ref(storage, storagePath)

  // Upload as base64 data URL
  const format = dataUrl.startsWith('data:') ? 'data_url' : 'base64'
  await uploadString(storageRef, dataUrl, format, {
    contentType: mimeType || 'application/octet-stream'
  })

  const downloadUrl = await getDownloadURL(storageRef)
  return { downloadUrl, storagePath }
}

// ─────────────────────────────────────────
// READ — Fetch candidate data from Firestore
// ─────────────────────────────────────────

/**
 * Fetch a candidate's data from Firestore by canId.
 * Returns null if not found.
 * @param {string} canId
 * @returns {Promise<object|null>}
 */
export async function getCandidate(canId) {
  if (!canId) return null
  const snap = await getDoc(doc(db, COLLECTION, canId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}
