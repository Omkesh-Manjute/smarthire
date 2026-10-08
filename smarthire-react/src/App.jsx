import React, { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Login from './pages/Login'

const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'))
const CandidateVerification = lazy(() => import('./pages/CandidateVerification'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Terms = lazy(() => import('./pages/Terms'))
const Support = lazy(() => import('./pages/Support'))
const AtsPlatform = lazy(() => import('./pages/AtsPlatform'))
const Reports = lazy(() => import('./pages/Reports'))
const BrandingCenter = lazy(() => import('./pages/BrandingCenter'))
const LinkedInPosts = lazy(() => import('./pages/LinkedInPosts'))
const CandidateChat = lazy(() => import('./pages/CandidateChat'))
const Pricing = lazy(() => import('./pages/Pricing'))
const PublicCareers = lazy(() => import('./pages/PublicCareers'))
const RecruiterInbox = lazy(() => import('./pages/RecruiterInbox'))
const Blog = lazy(() => import('./pages/Blog'))
const SmartSignRtrPage = lazy(() => import('./pages/SmartSignRtrPage'))
const SubmittalPackPage = lazy(() => import('./pages/SubmittalPackPage'))

const PageFallback = () => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
    Loading...
  </div>
)

function ProtectedRoute({ children }) {
  const isAuth = localStorage.getItem('verifyhire_authenticated') === 'true' || localStorage.getItem('smarthire_authenticated') === 'true'
  if (!isAuth) {
    return <Navigate to="/" replace />
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
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
          <Route path="/branding" element={<ProtectedRoute><BrandingCenter /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><RecruiterInbox /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><RecruiterInbox defaultViewMode="chat" /></ProtectedRoute>} />
          <Route path="/linkedin-posts" element={<SuperAdminRoute><LinkedInPosts /></SuperAdminRoute>} />
          <Route path="/submittal-pack" element={<ProtectedRoute><SubmittalPackPage /></ProtectedRoute>} />
          <Route path="/sign-rtr/:token" element={<SmartSignRtrPage />} />
          <Route path="/sign-rtr" element={<SmartSignRtrPage />} />
          <Route path="/candidate-chat/:sessionId" element={<CandidateChat />} />
          <Route path="/candidate-chat/job/:jobId" element={<CandidateChat />} />
          <Route path="/screening" element={<CandidateChat />} />
          <Route path="/screening/:sessionId" element={<CandidateChat />} />
          <Route path="/candidate/screen/:sessionId" element={<CandidateChat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
