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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
}

const app = !getApps().length && firebaseConfig.apiKey ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null)
export const auth = app ? getAuth(app) : null
export const googleProvider = new GoogleAuthProvider()

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
