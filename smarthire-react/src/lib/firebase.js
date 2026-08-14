import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA2BwkaHIrKbgNO87CIQc7wSpO_ufdxPXQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-hire-54d38.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-hire-54d38",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-hire-54d38.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "464561704549",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:464561704549:web:2d104181a34a52ae47c08c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3GTS97S38S"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/**
 * Sign in using Google OAuth Popup
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase is not configured. Please add VITE_FIREBASE_API_KEY to your .env file.')
  }
  const result = await signInWithPopup(auth, googleProvider)
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
  const result = await signInWithEmailAndPassword(auth, email, password)
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
  const result = await createUserWithEmailAndPassword(auth, email, password)
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
 * Sign out from Firebase
 */
export async function logoutFirebase() {
  if (auth) {
    await signOut(auth)
  }
}
