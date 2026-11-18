import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : {}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyA2BwkaHIrKbgNO87CIQc7wSpO_ufdxPXQ",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "smart-hire-54d38.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "smart-hire-54d38",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "smart-hire-54d38.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "464561704549",
  appId: env.VITE_FIREBASE_APP_ID || "1:464561704549:web:2d104181a34a52ae47c08c",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-3GTS97S38S"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Use localStorage/sessionStorage/memory persistence instead of IndexedDB.
// Firebase Auth v12.17's IndexedDB persistence closes on visibilitychange/popup focus
// transitions and throws "Database is closing/hidden" during Google sign-in popups.
let authInstance
try {
  authInstance = initializeAuth(app, {
    persistence: [
      browserLocalPersistence,
      browserSessionPersistence,
      inMemoryPersistence
    ],
    popupRedirectResolver: browserPopupRedirectResolver
  })
} catch (err) {
  authInstance = getAuth(app)
  setPersistence(authInstance, browserLocalPersistence).catch(() => {
    setPersistence(authInstance, inMemoryPersistence).catch(() => {})
  })
}

export const auth = authInstance
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function isTransientStorageAuthError(err) {
  const msg = String(err?.message || '').toLowerCase()
  const code = String(err?.code || '').toLowerCase()
  return (
    msg.includes('database is closing') ||
    msg.includes('closing/hidden') ||
    msg.includes('indexeddb') ||
    code === 'auth/web-storage-unsupported'
  )
}

async function withAuthPersistenceRetry(operation) {
  try {
    return await operation()
  } catch (err) {
    if (!isTransientStorageAuthError(err)) {
      throw err
    }
    console.warn('[Firebase Auth] Transient browser storage error detected, switching to safe persistence and retrying:', err?.message)
    try {
      await setPersistence(auth, browserLocalPersistence)
    } catch (_) {
      try {
        await setPersistence(auth, inMemoryPersistence)
      } catch (__) {}
    }
    await new Promise(resolve => setTimeout(resolve, 200))
    return await operation()
  }
}

export function formatAuthError(err, fallback = 'Sign-in failed. Please try again.') {
  if (!err) return fallback
  if (err.code === 'auth/popup-closed-by-user') return 'Google sign-in popup was closed before completing.'
  if (err.code === 'auth/cancelled-popup-request') return 'Another sign-in popup is already open. Please try again.'
  if (err.code === 'auth/popup-blocked') return 'Pop-up was blocked by your browser. Please allow pop-ups for this site or sign in with email.'
  if (err.code === 'auth/unauthorized-domain') return 'Domain sign-in is updating. Please sign in with your email below.'
  if (err.code === 'auth/network-request-failed') return 'Network connection interrupted. Please check your internet and try again.'
  if (isTransientStorageAuthError(err)) return 'Browser session storage temporarily reset. Please click sign in once more or use email sign-in below.'
  return err.message || fallback
}

/**
 * Sign in using Google OAuth Popup
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase is not configured. Please add VITE_FIREBASE_API_KEY to your .env file.')
  }
  const result = await withAuthPersistenceRetry(() =>
    signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
  )
  const user = result.user
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    idToken: await user.getIdToken()
  }
}

/**
 * Sign in using Email and Password
 */
export async function loginWithEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase is not configured. Please add VITE_FIREBASE_API_KEY to your .env file.')
  }
  const result = await withAuthPersistenceRetry(() =>
    signInWithEmailAndPassword(auth, email, password)
  )
  const user = result.user
  return {
    uid: user.uid,
    name: user.displayName || email.split('@')[0],
    email: user.email,
    photoURL: user.photoURL,
    idToken: await user.getIdToken()
  }
}

/**
 * Sign up using Email and Password
 */
export async function signupWithEmail(email, password) {
  if (!auth) {
    throw new Error('Firebase is not configured. Please add VITE_FIREBASE_API_KEY to your .env file.')
  }
  const result = await withAuthPersistenceRetry(() =>
    createUserWithEmailAndPassword(auth, email, password)
  )
  const user = result.user
  return {
    uid: user.uid,
    name: user.displayName || email.split('@')[0],
    email: user.email,
    photoURL: user.photoURL,
    idToken: await user.getIdToken()
  }
}

/**
 * Send Password Reset Email via Firebase
 */
export async function resetPasswordWithEmail(email) {
  if (!auth) {
    throw new Error('Firebase is not configured.')
  }
  const redirectUrl = typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}/login`
    : 'https://smarthireus.com/login'

  const actionCodeSettings = {
    url: redirectUrl,
    handleCodeInApp: false
  }

  try {
    await sendPasswordResetEmail(auth, email, actionCodeSettings)
  } catch (err) {
    if (err.code === 'auth/unauthorized-continue-uri') {
      console.warn('[Firebase] Continue URI unauthorized, falling back to standard reset link', err)
      await sendPasswordResetEmail(auth, email)
    } else {
      throw err
    }
  }
}

/**
 * Sign out from Firebase
 */
export async function logoutFirebase() {
  if (auth) {
    await signOut(auth)
  }
}

