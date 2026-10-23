import React, { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Login from './pages/Login'
import InfinityLoader from './components/InfinityLoader'

function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = window.sessionStorage.getItem('smarthire_page_reloaded') === 'true'
    for (let i = 0; i < 2; i++) {
      try {
        const component = await componentImport()
        window.sessionStorage.removeItem('smarthire_page_reloaded')
        return component
      } catch (err) {
        if (i < 1) {
          await new Promise(r => setTimeout(r, 600))
        }
      }
    }

    try {
      const component = await componentImport()
      window.sessionStorage.removeItem('smarthire_page_reloaded')
      return component
    } catch (error) {
      console.warn('[SmartHire] Chunk fetch failed after retries, auto-refreshing...', error)
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('smarthire_page_reloaded', 'true')
        window.location.reload()
        return new Promise(() => {})
      }
      throw error
    }
  })
}

const RecruiterDashboard = lazyWithRetry(() => import('./pages/RecruiterDashboard'))
const About = lazyWithRetry(() => import('./pages/About'))
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'))
const Terms = lazyWithRetry(() => import('./pages/Terms'))
const AtsPlatform = lazyWithRetry(() => import('./pages/AtsPlatform'))
const BrandingCenter = lazyWithRetry(() => import('./pages/BrandingCenter'))
const LinkedInPosts = lazyWithRetry(() => import('./pages/LinkedInPosts'))
const CandidateChat = lazyWithRetry(() => import('./pages/CandidateChat'))
const Pricing = lazyWithRetry(() => import('./pages/Pricing'))
const PublicCareers = lazyWithRetry(() => import('./pages/PublicCareers'))
const RecruiterInbox = lazyWithRetry(() => import('./pages/RecruiterInbox'))
const Blog = lazyWithRetry(() => import('./pages/Blog'))
const SmartSignRtrPage = lazyWithRetry(() => import('./pages/SmartSignRtrPage'))
const SubmittalPackPage = lazyWithRetry(() => import('./pages/SubmittalPackPage'))
const SmartScreenProduct = lazyWithRetry(() => import('./pages/SmartScreenProduct'))
const ClientScreeningPortal = lazyWithRetry(() => import('./pages/ClientScreeningPortal'))

const PageFallback = () => (
  <InfinityLoader text="" showBrand={false} minHeight="85vh" />
)

function ProtectedRoute({ children }) {
  const isAuth = localStorage.getItem('verifyhire_authenticated') === 'true' || localStorage.getItem('smarthire_authenticated') === 'true'
  if (!isAuth) {
    return <Navigate to="/" replace />
  }
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  if (userStr) {
    try {
      const u = JSON.parse(userStr)
      if (u.role === 'client') {
        return <Navigate to="/client/screening" replace />
      }
    } catch (_) {}
  }
  return children
}

function ClientRoute({ children }) {
  const isAuth = localStorage.getItem('verifyhire_authenticated') === 'true' || localStorage.getItem('smarthire_authenticated') === 'true'
  if (!isAuth) {
    return <Navigate to="/login" replace />
  }
  return children
}

function SuperAdminRoute({ children }) {
  const isAuth = localStorage.getItem('verifyhire_authenticated') === 'true' || localStorage.getItem('smarthire_authenticated') === 'true'
  if (!isAuth) {
    return <Navigate to="/" replace />
  }
  
  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let isSuperAdmin = false
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.role === 'superadmin' || user.role === 'admin') {
        isSuperAdmin = true
      }
    } catch (e) {}
  } else {
    // Default to true for initial admin fallback if user object is not present yet
    isSuperAdmin = true
  }

  if (!isSuperAdmin) {
    return <Navigate to="/ats" replace />
  }

  return children
}

import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/jobs" element={<PublicCareers />} />
          <Route path="/careers" element={<Navigate to="/jobs" replace />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Blog />} />
          <Route path="/dashboard" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/verify" element={<Navigate to="/ats" replace />} />
          <Route path="/ats" element={<ProtectedRoute><AtsPlatform /></ProtectedRoute>} />
          <Route path="/reports" element={<Navigate to="/ats" replace />} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/branding" element={<ProtectedRoute><BrandingCenter /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><RecruiterInbox /></ProtectedRoute>} />
          <Route path="/sourcing" element={<ProtectedRoute><RecruiterInbox defaultTableCategory="extension_sourced" /></ProtectedRoute>} />
          <Route path="/extension-sourced" element={<ProtectedRoute><RecruiterInbox defaultTableCategory="extension_sourced" /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><RecruiterInbox defaultViewMode="chat" /></ProtectedRoute>} />
          <Route path="/linkedin-posts" element={<SuperAdminRoute><LinkedInPosts /></SuperAdminRoute>} />
          <Route path="/submittal-pack" element={<ProtectedRoute><SubmittalPackPage /></ProtectedRoute>} />
          <Route path="/sign-rtr/:token" element={<SmartSignRtrPage />} />
          <Route path="/sign-rtr" element={<SmartSignRtrPage />} />
          <Route path="/client/screening" element={<ClientRoute><ClientScreeningPortal /></ClientRoute>} />
          <Route path="/client" element={<Navigate to="/client/screening" replace />} />
          <Route path="/client-portal" element={<Navigate to="/client/screening" replace />} />
          <Route path="/smartscreen" element={<SmartScreenProduct />} />
          <Route path="/video-screening" element={<Navigate to="/smartscreen" replace />} />
          <Route path="/video-interview" element={<Navigate to="/smartscreen" replace />} />
          <Route path="/candidate-chat/:sessionId" element={<CandidateChat />} />
          <Route path="/candidate-chat/job/:jobId" element={<CandidateChat />} />
          <Route path="/screening" element={<CandidateChat />} />
          <Route path="/screening/:sessionId" element={<CandidateChat />} />
          <Route path="/candidate/screen/:sessionId" element={<CandidateChat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Navigate to="/about?section=inquiry#inquiry" replace />} />
          <Route path="/support" element={<Navigate to="/about?section=support#support" replace />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
