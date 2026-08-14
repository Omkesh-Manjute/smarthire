import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CandidateVerification from './pages/CandidateVerification'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import AtsPlatform from './pages/AtsPlatform'
import Reports from './pages/Reports'
import BrandingCenter from './pages/BrandingCenter'
import LinkedInPosts from './pages/LinkedInPosts'
import CandidateChat from './pages/CandidateChat'
import Pricing from './pages/Pricing'
import PublicCareers from './pages/PublicCareers'
import RecruiterInbox from './pages/RecruiterInbox'

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/jobs" element={<PublicCareers />} />
      <Route path="/careers" element={<PublicCareers />} />
      <Route path="/dashboard" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/verify" element={<Navigate to="/ats" replace />} />
      <Route path="/ats" element={<ProtectedRoute><AtsPlatform /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
      <Route path="/branding" element={<ProtectedRoute><BrandingCenter /></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><RecruiterInbox /></ProtectedRoute>} />
      <Route path="/linkedin-posts" element={<SuperAdminRoute><LinkedInPosts /></SuperAdminRoute>} />
      <Route path="/candidate-chat/:sessionId" element={<CandidateChat />} />
      <Route path="/candidate-chat/job/:jobId" element={<CandidateChat />} />
      <Route path="/login" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
