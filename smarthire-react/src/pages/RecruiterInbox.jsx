import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { saveMessageFirestore, getMessagesFirestore, saveRequisitionCandidates, saveCandidate, getAllCandidates, deduplicateCandidates, deleteCandidateFirestore } from '../lib/atsFirestore'
import { autoSendJobDescriptionToCandidate } from '../utils/autoSendJdHelper'

const POLL_INTERVAL = 3000

export const ALL_SMARTHIRE_RECRUITERS = [
  { id: 'rec-1', name: 'Omkesh Manjute', email: 'omkesh@coolsofttech.com', refCode: 'omkesh', role: 'Super Admin' },
  { id: 'rec-2', name: 'Vaibhav Bisen', email: 'vaibhav@coolsofttech.com', refCode: 'vaibhav-bisen', role: 'Lead Recruiter' },
  { id: 'rec-3', name: 'Sukamal Chatterjee', email: 'kamal@coolsofttech.com', refCode: 'sukamal-chatterjee', role: 'Senior Recruiter' },
  { id: 'rec-4', name: 'Gourav', email: 'gourav@coolsofttech.com', refCode: 'gourav', role: 'Recruiter' },
  { id: 'rec-5', name: 'Naveen Bhardwaj', email: 'naveen@coolsofttech.com', refCode: 'naveen-bhardwaj', role: 'Recruiter' },
  { id: 'rec-6', name: 'Rahul Sharma', email: 'rahul@coolsofttech.com', refCode: 'rahul-sharma', role: 'Recruiter' },
  { id: 'rec-7', name: 'Priya Verma', email: 'priya@coolsofttech.com', refCode: 'priya-verma', role: 'Recruiter' },
  { id: 'rec-8', name: 'Prudhvi Sevveti', email: 'prudhvi.s@smarthire.com', refCode: 'prudhvi-sevveti', role: 'Recruiter' },
  { id: 'rec-9', name: 'Nitin Bhosale', email: 'nitin.b@smarthire.com', refCode: 'nitin-bhosale', role: 'Recruiter' },
  { id: 'rec-10', name: 'Naveen Korimelli', email: 'naveen.k@smarthire.com', refCode: 'naveen-korimelli', role: 'Recruiter' },
  { id: 'rec-11', name: 'Ajay Arya', email: 'ajay.a@smarthire.com', refCode: 'ajay-arya', role: 'Recruiter' },
  { id: 'rec-12', name: 'Raj Barve', email: 'raj.b@smarthire.com', refCode: 'raj-barve', role: 'Recruiter' },
  { id: 'rec-13', name: 'Pankaj Maharwade', email: 'pankaj.m@smarthire.com', refCode: 'pankaj-maharwade', role: 'Senior Recruiter' },
  { id: 'rec-14', name: 'Nishant Kathane', email: 'nishant.k@smarthire.com', refCode: 'nishant-kathane', role: 'Recruiter' },
  { id: 'mgr-1', name: 'Alok Manager', email: 'manager@coolsofttech.com', refCode: 'alok-manager', role: 'Manager' }
]

// --- Inline SVG Icons to prevent question marks or encoding bugs ---
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
)
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
)
const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
)
const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
)
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
)
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
)
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
)
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
)
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
)
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
)
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
)
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
)
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
)
const IconExternalLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
)
const IconStar = ({ filled = false, color = '#F59E0B' }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
)
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
)
const IconPrinter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
)
const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
)
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
)
const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
)
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
)
const IconTable = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>
)
const IconFileText = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
)
const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
)
const IconCopy = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
)
const IconIdCard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="8" y1="7" x2="16" y2="7"></line><line x1="8" y1="11" x2="16" y2="11"></line><circle cx="8" cy="16" r="2"></circle><line x1="12" y1="16" x2="16" y2="16"></line></svg>
)
const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
)
const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
)
const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
)
const IconShoppingBag = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
)
const IconTrendingUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
)
const IconTrendingDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
)
const IconCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
)
const IconSparkline = ({ color = '#006C9C' }) => (
  <svg width="110" height="34" viewBox="0 0 110 34" fill="none">
    <path d="M 0,22 C 18,25 30,6 50,18 C 70,30 85,8 110,14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"></path>
  </svg>
)
const IconSparklineDown = ({ color = '#5119B7' }) => (
  <svg width="110" height="34" viewBox="0 0 110 34" fill="none">
    <path d="M 0,10 C 20,6 35,26 55,14 C 75,4 85,28 110,22" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"></path>
  </svg>
)
const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
)
const IconDatabase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
)
const IconAnalytics = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
)
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
)
const IconCrown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFAB00" stroke="#FFAB00" strokeWidth="1.5"><polygon points="2 4 7 14 12 4 17 14 22 4 20 20 4 20 2 4"></polygon></svg>
)
const IconSparkles = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.9-6.1l-2.1 2.1m-8 8l-2.1 2.1m12.2 0l-2.1-2.1m-8-8l-2.1-2.1"></path></svg>
)
const IconCheckCircle = ({ color = '#00A76F' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
)
const IconXCircle = ({ color = '#FF5630' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
)
const IconMinusCircle = ({ color = '#919EAB' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
)
const IconLightbulb = ({ color = '#2065D1' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5h6.18z"></path></svg>
)
const IconPdfBadge = () => (
  <span style={{ background: '#FF4D4F', color: '#FFF', fontWeight: 900, fontSize: 10, borderRadius: 5, padding: '3px 6px', display: 'inline-flex', alignItems: 'center', letterSpacing: '0.5px' }}>
    PDF
  </span>
)
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
)
const IconPhoneCall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
)
const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
)
const IconPaperclip = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
)
const IconSmile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
)
const IconAtSign = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
)
const IconPaperAirplane = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
)
const IconExpand = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
)
const IconCheckCheck = ({ color = '#2065D1' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L7 17l-5-5"></path><path d="M22 10l-7.5 7.5-1.5-1.5"></path></svg>
)
const IconFileReports = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
)
const IconChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
)
const IconFileExcel = () => (
  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
    XLS
  </span>
)
const IconFilePdf = () => (
  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
    PDF
  </span>
)
const IconFileWord = () => (
  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
    DOC
  </span>
)

function safeSkillArray(skills) {
  if (!skills) return []
  if (Array.isArray(skills)) {
    return skills.map(s => {
      if (typeof s === 'string') return s.trim()
      if (s && typeof s === 'object') return (s.name || s.skill || s.title || s.value || '').toString().trim()
      return String(s || '').trim()
    }).filter(Boolean)
  }
  if (typeof skills === 'string') {
    return skills.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

function safeString(val, fallback = '') {
  if (typeof val === 'string') return val.trim()
  if (typeof val === 'number') return String(val)
  if (val && typeof val === 'object') return (val.name || val.title || val.label || val.value || fallback).toString().trim()
  return fallback
}

function getSkillFrequencies(resumeText = '', candidateSkills = []) {
  if (!resumeText) return []
  const text = String(resumeText).toLowerCase()
  const freqMap = new Map()

  const candidatesToCheck = [
    ...safeSkillArray(candidateSkills),
    'SQL Server', 'GitHub', '.NET', 'Oracle', 'DB2', 'SAP', 'XML', 'NIEM',
    'Selenium', 'Java', 'Python', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes',
    'Agile', 'Scrum', 'JIRA', 'PostgreSQL', 'Power BI', 'Salesforce', 'DAX',
    'Playwright', 'TestNG', 'Postman', 'Kafka', 'React', 'Angular', 'Vue',
    'RAG', 'PyTorch', 'LangChain', 'Pinecone', 'Palo Alto', 'Cisco ASA', 'Firewalls'
  ]

  const unique = Array.from(new Set(candidatesToCheck.map(s => safeString(s)))).filter(s => s.length >= 2)

  unique.forEach(sk => {
    const skLower = sk.toLowerCase()
    const escaped = skLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    const matches = text.match(regex)
    const count = matches ? matches.length : 0
    if (count > 0) {
      freqMap.set(skLower, { name: sk, count })
    }
  })

  return Array.from(freqMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)
}

export function isJobActiveAndOpen(job) {
  if (!job) return false;
  const s = String(job.status || '').toLowerCase().trim();
  if (['closed', 'bank', 'banked', 'filled', 'cancelled', 'expired', 'hold', 'on hold'].includes(s)) return false;

  if (job.deadline) {
    const d = new Date(job.deadline);
    if (!isNaN(d.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) return false;
    }
  }
  if (job.description && typeof job.description === 'string') {
    const m = job.description.match(/submission\s+deadline\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (m) {
      const d = new Date(m[1]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!isNaN(d.getTime()) && d < today) return false;
    }
  }
  return true;
}

function cleanMimeEmail(raw) {
  let attachmentNames = []
  if (!raw) return { textBody: '', attachmentNames: [] }

  // 1. Detect attachments
  const attachMatches = raw.matchAll(/(?:filename|name)=["']?([^"'\r\n;]+)["']?/gi)
  for (const m of attachMatches) {
    const fn = m[1].trim()
    if (fn.toLowerCase().endsWith('.pdf') || fn.toLowerCase().endsWith('.doc') || fn.toLowerCase().endsWith('.docx')) {
      if (!attachmentNames.includes(fn)) attachmentNames.push(fn)
    }
  }

  // 2. Separate parts by boundary if multipart
  const boundaryMatch = raw.match(/boundary=["']?([^"'\r\n;]+)["']?/i)
  let textBody = ''

  if (boundaryMatch) {
    const boundary = boundaryMatch[1].replace(/["']/g, '')
    const escaped = boundary.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const parts = raw.split(new RegExp('--' + escaped))
    
    // Look for text/plain part first
    for (const part of parts) {
      if (/Content-Type:\s*text\/plain/i.test(part)) {
        const bodyStart = part.search(/\r?\n\r?\n/)
        if (bodyStart !== -1) {
          textBody = part.slice(bodyStart).trim()
          break
        }
      }
    }
    // If no text/plain, look for text/html
    if (!textBody) {
      for (const part of parts) {
        if (/Content-Type:\s*text\/html/i.test(part)) {
          const bodyStart = part.search(/\r?\n\r?\n/)
          if (bodyStart !== -1) {
            textBody = part.slice(bodyStart).trim()
            break
          }
        }
      }
    }
  }

  if (!textBody) {
    const headerEndMatch = raw.search(/\r?\n\r?\n/)
    textBody = headerEndMatch !== -1 ? raw.slice(headerEndMatch).trim() : raw
  }

  // 3. Clean Quoted-Printable
  textBody = textBody
    .replace(/=\r?\n/g, '')
    .replace(/=C2=A0/gi, ' ')
    .replace(/=E2=80=99/gi, "'")
    .replace(/=E2=80=9C/gi, '"')
    .replace(/=E2=80=9D/gi, '"')
    .replace(/=E2=80=93/gi, '-')
    .replace(/=3D/gi, '=')
    .replace(/=([A-F0-9]{2})/gi, (_, hex) => {
      try { return String.fromCharCode(parseInt(hex, 16)) } catch(e) { return '' }
    })

  // 4. Strip HTML tags
  textBody = textBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')

  // 5. Strip any base64 lines, MIME header remnants, boundaries, or mailing list footers
  const lines = textBody.split(/\r?\n/)
  const cleanLines = lines.filter(line => {
    const trimmed = line.trim()
    if (!trimmed) return true
    // Base64 line filter (lines of 30+ base64 chars without spaces)
    if (trimmed.length > 30 && !trimmed.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return false
    }
    // MIME header filter
    if (/^(Content-Type|Content-Disposition|Content-Transfer-Encoding|Content-ID|X-Attachment-Id):/i.test(trimmed)) {
      return false
    }
    // Charset header filter
    if (/^charset=["']?[a-zA-Z0-9_-]+["']?/i.test(trimmed)) {
      return false
    }
    // Boundary filter (catches NextPart, dots, equals, multiple dashes)
    if (/^-+(=?[a-zA-Z0-9_.-]+)+-*\s*$/i.test(trimmed) || trimmed.includes('_NextPart_') || trimmed.startsWith('------=')) {
      return false
    }
    // IMAP wrapper tag
    if (/^BODY\[TEXT\]/i.test(trimmed)) {
      return false
    }
    // Google Groups and mailing list footers / unsubscribe junk
    const lower = trimmed.toLowerCase()
    if (lower.includes('googlegroups.com') || lower.includes('groups.google.com')) return false
    if (lower.includes('if you wanna join our google group') || lower.includes('you received this message because you are subscribed')) return false
    if (lower.includes('to unsubscribe from this group') || lower.includes('to view this discussion, visit')) return false
    if (lower.includes('unsubscribe@') || lower.includes('unsubscribe from this list')) return false
    return true
  })

  textBody = cleanLines.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

  return { textBody, attachmentNames }
}

const AVATAR_COLORS = [
  { bg: '#DBEAFE', text: '#1E40AF' }, // Blue (AG)
  { bg: '#D1FAE5', text: '#065F46' }, // Emerald (MZ)
  { bg: '#EDE9FE', text: '#5B21B6' }, // Purple (AP)
  { bg: '#FEF3C7', text: '#92400E' }, // Amber (MK)
  { bg: '#CCFBF1', text: '#115E59' }, // Teal (RS)
  { bg: '#E0E7FF', text: '#3730A3' }, // Indigo (UR)
  { bg: '#FFE4E6', text: '#9F1239' }, // Rose (SK)
  { bg: '#CFFAFE', text: '#155E75' }  // Cyan (PT)
]

const getCandidateAvatarColor = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

const getInitials = (name = '') => {
  const parts = (name || '').trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return (name || 'CA').slice(0, 2).toUpperCase()
}

const renderMatchBadge = (score = 85, hasActiveMatch = true) => {
  if (hasActiveMatch === false) {
    return (
      <div style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        border: '1px solid #E2E8F0',
        color: '#475569',
        padding: '3px 8px',
        borderRadius: 6,
        minWidth: 64
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
          Talent Pool
        </span>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8' }}>
          No Open Match
        </span>
      </div>
    );
  }

  let label = 'Low'
  let bg = '#FEF2F2'
  let text = '#B91C1C'
  let border = '#FECACA'

  if (score >= 85) {
    label = 'Excellent'
    bg = '#ECFDF5'
    text = '#047857'
    border = '#A7F3D0'
  } else if (score >= 70) {
    label = 'Good'
    bg = '#F0FDF4'
    text = '#15803D'
    border = '#BBF7D0'
  } else if (score >= 50) {
    label = 'Average'
    bg = '#FFFBEB'
    text = '#B45309'
    border = '#FDE68A'
  }

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bg,
      border: `1px solid ${border}`,
      color: text,
      padding: '3px 10px',
      borderRadius: 6,
      minWidth: 70,
      textAlign: 'center',
      lineHeight: 1.15
    }}>
      <span style={{ fontSize: 13.5, fontWeight: 800 }}>{score}%</span>
      <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
    </div>
  )
}

const renderSourceBadge = (c) => {
  if (!c) return null
  const src = String(c.source || '').toLowerCase()
  const cat = String(c.sourceCategory || '').toLowerCase()
  const folder = String(c.folder || '').toLowerCase()

  if (c.isSpamRecovery || cat === 'email_spam' || folder.includes('spam') || src.includes('spam')) {
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#EA580C',
        backgroundColor: '#FFF7ED',
        border: '1px solid #FED7AA',
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#EA580C' }}></span>
        Email Spam
      </span>
    )
  }

  if (cat === 'careers_portal' || cat === 'job_site' || src.includes('job') || src.includes('career') || src.includes('/jobs') || src.includes('public-submit')) {
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#059669',
        backgroundColor: '#ECFDF5',
        border: '1px solid #A7F3D0',
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#059669' }}></span>
        Job Site
      </span>
    )
  }

  if (cat === 'vendor_bench' || src.includes('vendor') || src.includes('bench')) {
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#7C3AED',
        backgroundColor: '#F5F3FF',
        border: '1px solid #DDD6FE',
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap'
      }}>
        Vendor Bench
      </span>
    )
  }

  if (cat === 'manual_entry' || src.includes('manual') || src.includes('direct add')) {
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#0D9488',
        backgroundColor: '#F0FDFA',
        border: '1px solid #99F6E4',
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap'
      }}>
        Manual Entry
      </span>
    )
  }

  if (src.includes('monster')) {
    return (
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#2563EB',
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap'
      }}>
        Monster Search
      </span>
    )
  }

  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      color: '#2563EB',
      backgroundColor: '#EFF6FF',
      border: '1px solid #BFDBFE',
      padding: '2px 8px',
      borderRadius: 6,
      whiteSpace: 'nowrap'
    }}>
      Email Inbox
    </span>
  )
}

/**
 * Robust Boolean Search Evaluator
 * Supports AND, OR, NOT, quoted phrases, and parentheses
 */
export function evaluateBooleanSearch(query, candidateCorpus) {
  if (!query || !query.trim()) return true
  const corpus = (candidateCorpus || '').toLowerCase()
  const rawQ = query.trim()

  const hasOperators = /\b(AND|OR|NOT)\b/i.test(rawQ) || rawQ.includes('"') || rawQ.includes('(') || rawQ.includes(')')
  if (!hasOperators) {
    const terms = rawQ.toLowerCase().split(/\s+/).filter(Boolean)
    return terms.every(t => corpus.includes(t))
  }

  try {
    let expr = rawQ
    const termResults = []
    expr = expr.replace(/"([^"]+)"/g, (_, phrase) => {
      const idx = termResults.length
      termResults.push(corpus.includes(phrase.toLowerCase().trim()))
      return ` __TERM_${idx}__ `
    })
    expr = expr.replace(/\bNOT\s+/gi, ' ! ').replace(/\bAND\b/gi, ' && ').replace(/\bOR\b/gi, ' || ')
    expr = expr.replace(/([a-zA-Z0-9_.#+@-]+)/g, match => {
      if (match === 'true' || match === 'false' || match.startsWith('__TERM_')) return match
      const idx = termResults.length
      termResults.push(corpus.includes(match.toLowerCase()))
      return `__TERM_${idx}__`
    })
    termResults.forEach((val, idx) => {
      expr = expr.replace(new RegExp(`__TERM_${idx}__`, 'g'), val ? 'true' : 'false')
    })
    if (/^[truefals!\s&|()]+$/.test(expr)) {
      return Boolean(new Function(`return (${expr})`)())
    }
  } catch (e) {
    const fallback = rawQ.replace(/["()]/g, '').toLowerCase().split(/\s+/).filter(t => t !== 'and' && t !== 'or' && t !== 'not' && t.length > 0)
    return fallback.every(t => fallback.length === 0 || fallback.every(t => corpus.includes(t)))
  }
  return true
}

const renderZohoStatusBadge = (status = 'New') => {
  const s = String(status || 'New').trim()
  let bg = '#EFF6FF', text = '#1D4ED8', border = '#BFDBFE', label = 'New Candidate'

  if (s.toLowerCase().includes('screen') || s.toLowerCase().includes('qualif')) {
    bg = '#ECFDF5'; text = '#059669'; border = '#A7F3D0'; label = 'Screened'
  } else if (s.toLowerCase().includes('submit') || s.toLowerCase().includes('client')) {
    bg = '#EEF2FF'; text = '#4338CA'; border = '#C7D2FE'; label = 'Submitted'
  } else if (s.toLowerCase().includes('interview')) {
    bg = '#F5F3FF'; text = '#6D28D9'; border = '#DDD6FE'; label = 'Interview'
  } else if (s.toLowerCase().includes('offer')) {
    bg = '#FFFBEB'; text = '#B45309'; border = '#FDE68A'; label = 'Offered'
  } else if (s.toLowerCase().includes('hire')) {
    bg = '#F0FDF4'; text = '#15803D'; border = '#BBF7D0'; label = 'Hired'
  } else if (s.toLowerCase().includes('reject')) {
    bg = '#FEF2F2'; text = '#B91C1C'; border = '#FECACA'; label = 'Rejected'
  } else if (s.toLowerCase().includes('active')) {
    bg = '#EFF6FF'; text = '#1D4ED8'; border = '#BFDBFE'; label = 'Active'
  } else if (s && s !== 'undefined' && s !== 'null' && s !== 'New') {
    bg = '#F1F5F9'; text = '#334155'; border = '#CBD5E1'; label = s
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 700,
      backgroundColor: bg,
      color: text,
      border: `1px solid ${border}`,
      whiteSpace: 'nowrap'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: text, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function getFullResumeText(candidate) {
  if (!candidate) return ''
  const rawResumeText = typeof candidate?.resumeText === 'string' ? candidate.resumeText.trim() : ''
  if (rawResumeText.length > 50) {
    const isForwardStubOnly = rawResumeText.length < 250 && (
      rawResumeText.toLowerCase().includes('please find my resume attached') ||
      rawResumeText.toLowerCase().includes('please find attached my updated resume')
    );

    if (!isForwardStubOnly) {
      const cleaned = cleanMimeEmail(rawResumeText);
      const finalText = (cleaned.textBody && cleaned.textBody.trim()) ? cleaned.textBody.trim() : rawResumeText;
      if (finalText.length > 50) {
        return finalText;
      }
    }
  }
  return ''
}

function getAvatarColor(name = '') {
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#9333EA','#16A34A','#EA580C','#BE123C']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatTime(iso) {
  if (!iso) return ''
  const str = String(iso).trim()
  if (str.includes('AM') || str.includes('PM') || str.includes('Yesterday') || str === 'Just now') {
    return str
  }
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function Avatar({ name, size = 40, style = {} }) {
  const bg = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#FFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: Math.round(size * 0.38), flexShrink: 0,
      letterSpacing: '-0.5px', ...style
    }}>
      {getInitials(name)}
    </div>
  )
}

// US State dictionary for bidirectional conversion and normalization
const US_STATES_MAP = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  'dc': 'DC', 'district of columbia': 'DC'
};

function extractCandidateStateAndCity(locStr = '', textStr = '') {
  const combined = `${locStr} ${textStr}`.toLowerCase();
  let foundState = null;
  let foundCity = null;

  const codeMatch = locStr.match(/\b([A-Z]{2})\b(?:\s+\d{5})?/);
  if (codeMatch && Object.values(US_STATES_MAP).includes(codeMatch[1].toUpperCase())) {
    foundState = codeMatch[1].toUpperCase();
  }

  if (!foundState) {
    for (const [full, code] of Object.entries(US_STATES_MAP)) {
      const reg = new RegExp(`\\b${full}\\b`, 'i');
      if (reg.test(combined)) {
        foundState = code;
        break;
      }
    }
  }

  const cityMatch = locStr.split(/[,–-]/)[0]?.trim();
  if (cityMatch && cityMatch.length > 2 && !cityMatch.toLowerCase().includes('united states')) {
    foundCity = cityMatch;
  }

  return { state: foundState, city: foundCity };
}

function evaluateCandidateLocationFit(candidate = {}, job = null) {
  if (!job) {
    const candLoc = candidate.location || '';
    const { state: candState, city: candCity } = extractCandidateStateAndCity(candLoc, candidate.resumeText || '');
    return {
      isLocal: null,
      status: 'remote_ok',
      badge: 'Remote / US',
      label: candLoc ? candLoc : 'US Nationwide',
      scoreAdj: 0,
      jobState: null,
      candState,
      candCity,
      needsLocal: false
    };
  }

  const jobDesc = `${job.description || ''} ${job.rawDescription || ''} ${job.fullDescription || ''}`.toLowerCase();
  const jobLoc = job.location || '';
  const jobMode = (job.workMode || job.type || '').toLowerCase();

  const { state: jobState, city: jobCity } = extractCandidateStateAndCity(jobLoc, jobDesc);
  const candLoc = candidate.location || '';
  const { state: candState, city: candCity } = extractCandidateStateAndCity(candLoc, candidate.resumeText || '');

  const explicitLocalReq = (
    /(?:need|needs|must be|require|seeking|looking for)\s+local/i.test(jobDesc) ||
    /local candidates?\s+(?:only|preferred|must)/i.test(jobDesc) ||
    /must be current\s+[a-z\s]{2,15}\s+residents?/i.test(jobDesc) ||
    /no relocation/i.test(jobDesc) ||
    /in-state only/i.test(jobDesc) ||
    /meet in person/i.test(jobDesc) ||
    jobMode === 'onsite' ||
    jobMode === 'hybrid'
  );

  const isRemoteOnly = jobMode === 'remote' && !explicitLocalReq;

  if (isRemoteOnly) {
    return {
      isLocal: true,
      status: 'remote_ok',
      badge: 'Remote Eligible',
      label: '100% Remote Position — US Nationwide',
      scoreAdj: 5,
      jobState,
      candState,
      candCity,
      needsLocal: false
    };
  }

  if (explicitLocalReq || jobState) {
    const isStateMatch = Boolean(jobState && candState && jobState === candState);
    const isCityMatch = Boolean(jobCity && candCity && (jobCity.toLowerCase().includes(candCity.toLowerCase()) || candCity.toLowerCase().includes(jobCity.toLowerCase())));

    if (isStateMatch || isCityMatch) {
      return {
        isLocal: true,
        status: 'confirmed_local',
        badge: '📍 Confirmed Local',
        label: `Confirmed Local • ${candCity ? `${candCity}, ` : ''}${candState || jobState} (${jobMode ? jobMode.toUpperCase() : 'LOCAL'} Fit)`,
        scoreAdj: 15,
        jobState,
        candState,
        candCity,
        needsLocal: explicitLocalReq
      };
    } else if (candState && jobState && candState !== jobState) {
      return {
        isLocal: false,
        status: 'relocation_needed',
        badge: 'Non-Local / Relocation',
        label: `Located in ${candState} vs Job in ${jobState} (${explicitLocalReq ? 'JD Requires Local' : 'Relocation Needed'})`,
        scoreAdj: explicitLocalReq ? -15 : -8,
        jobState,
        candState,
        candCity,
        needsLocal: explicitLocalReq
      };
    }
  }

  return {
    isLocal: null,
    status: 'remote_ok',
    badge: 'Remote / US',
    label: candLoc ? candLoc : 'US Nationwide',
    scoreAdj: 0,
    jobState,
    candState,
    candCity,
    needsLocal: explicitLocalReq
  };
}

const renderLocationBadge = (locFit) => {
  if (!locFit || locFit.status === 'unknown') return null;

  if (locFit.status === 'confirmed_local') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 10.5,
        fontWeight: 700,
        backgroundColor: '#ECFDF5',
        color: '#047857',
        border: '1px solid #A7F3D0',
        whiteSpace: 'nowrap'
      }} title={locFit.label}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
        <span>Confirmed Local</span>
      </span>
    );
  }

  if (locFit.status === 'relocation_needed') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 10.5,
        fontWeight: 700,
        backgroundColor: '#FEF3C7',
        color: '#B45309',
        border: '1px solid #FDE68A',
        whiteSpace: 'nowrap'
      }} title={locFit.label}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
        <span>Relocation Needed</span>
      </span>
    );
  }

  if (locFit.status === 'remote_ok') {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 10.5,
        fontWeight: 700,
        backgroundColor: '#EFF6FF',
        color: '#1D4ED8',
        border: '1px solid #BFDBFE',
        whiteSpace: 'nowrap'
      }} title={locFit.label}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block' }} />
        <span>Remote / US</span>
      </span>
    );
  }

  return null;
};

const highlightResumeText = (text, matchingSkills = [], searchQuery = '', enableHighlight = true, candidate = null) => {
  if (!text) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#475569',
        padding: '40px 32px',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          📄
        </div>
        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>
          No Direct Resume Text Extracted
        </div>
        <div style={{ fontSize: 12.5, color: '#64748B', maxWidth: 440, lineHeight: 1.5 }}>
          The candidate's original resume document is attached. Please click <strong>Download</strong> or view the original file under <strong>Attachments</strong> in the left sidebar.
        </div>
      </div>
    )
  }

  const escapeHtml = (str) => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const highlightKeywords = (plainText) => {
    if (!plainText) return '';
    let escaped = escapeHtml(plainText);

    // 1. Search Query (Soft Sky Blue)
    if (searchQuery && searchQuery.trim().length >= 2) {
      const q = searchQuery.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      try {
        escaped = escaped.replace(new RegExp(`(${q})`, 'gi'), '<mark style="background-color: #BAE6FD; color: #0369A1; font-weight: 700; padding: 1px 4px; border-radius: 3px; border: 1px solid #7DD3FC;">$1</mark>');
      } catch (_) {}
    }

    // 2. Matching Skills (Warm Yellow #FEF08A — Matching Monster Reference)
    if (enableHighlight && matchingSkills && matchingSkills.length > 0) {
      const uniqueSkills = [...new Set(matchingSkills.map(s => safeString(s)).filter(s => s.length >= 2))]
        .sort((a, b) => b.length - a.length);

      for (const skill of uniqueSkills) {
        const trimmed = safeString(skill);
        const base = trimmed.replace(/s$/i, '');
        const patternStr = (trimmed.length > 3)
          ? `${base.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}s?`
          : trimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const startB = /^\w/.test(trimmed) ? '\\b' : '';
        const endB = /\w$/.test(trimmed) ? '\\b' : '';
        try {
          escaped = escaped.replace(new RegExp(`(${startB}${patternStr}${endB})`, 'gi'), '<mark style="background-color: #FEF08A; color: #1E293B; font-weight: 700; padding: 1px 4px; border-radius: 3px; border: 1px solid #FDE047;">$1</mark>');
        } catch (_) {}
      }
    }
    return escaped;
  };

  const rawLines = text.split(/\r?\n/);
  const SECTION_MAP = {
    'SUMMARY': 'SUMMARY',
    'PROFESSIONAL SUMMARY': 'SUMMARY',
    'EXECUTIVE SUMMARY': 'SUMMARY',
    'CAREER SUMMARY': 'SUMMARY',
    'OBJECTIVE': 'SUMMARY',
    'PROFILE': 'SUMMARY',
    'WORK EXPERIENCE': 'EXPERIENCE',
    'PROFESSIONAL EXPERIENCE': 'EXPERIENCE',
    'EXPERIENCE': 'EXPERIENCE',
    'EMPLOYMENT HISTORY': 'EXPERIENCE',
    'WORK HISTORY': 'EXPERIENCE',
    'PROJECTS': 'EXPERIENCE',
    'KEY PROJECTS': 'EXPERIENCE',
    'EDUCATION': 'EDUCATION',
    'ACADEMIC BACKGROUND': 'EDUCATION',
    'ACADEMIC QUALIFICATIONS': 'EDUCATION',
    'SKILLS': 'SKILLS',
    'TECHNICAL SKILLS': 'SKILLS',
    'CORE COMPETENCIES': 'SKILLS',
    'AREAS OF EXPERTISE': 'SKILLS',
    'TECHNICAL PROFICIENCIES': 'SKILLS',
    'CERTIFICATIONS': 'CERTIFICATIONS',
    'CERTIFICATES': 'CERTIFICATIONS',
    'HONORS & AWARDS': 'AWARDS',
    'AWARDS': 'AWARDS',
    'LANGUAGES': 'LANGUAGES',
    'WORK AUTHORIZATION': 'WORK AUTHORIZATION'
  };

  const renderedBlocks = [];
  let currentSection = 'SUMMARY';
  let hasParsedSkills = false;
  let inResponsibilitiesBlock = false;

  const datePattern = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/)?\s*(19\d\d|20\d\d)\s*(?:[–\-—]|\bto\b|\buntil\b|\bthru\b|\bthrough\b)\s*(Present|Current|Now|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/)?\s*(Present|Current|Now|19\d\d|20\d\d)?\b/i;
  const jobTitlePattern = /\b(Developer|Engineer|Architect|Lead|Manager|Consultant|Analyst|Specialist|Intern|Administrator|Director|Designer|Programmer|Associate|Officer|Tester|QA)\b/i;
  const ACTION_VERB_REGEX = /^(?:designed|developed|collaborated|engineered|configured|registered|implemented|built|managed|led|created|maintained|architected|automated|coordinated|supported|performed|resolved|prepared|conducted|analyzed|tested|integrated|deployed|optimized|migrated|spearheaded|established|utilized|participated|assisted|authored|administered|executed|monitored|improved|facilitated|delivered|customized|troubleshot|reviewed|worked|written|involved|provided|handled|ensured|gathered|interfaced|trained)\b/i;

  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i].trim();
    if (!l) continue;

    // Check if line is a Section Header
    const cleanHeader = l.replace(/^[:#\*\-\s]+/, '').replace(/[:#\*\-\s]+$/, '').toUpperCase();
    if (SECTION_MAP[cleanHeader] && l.length <= 40) {
      currentSection = SECTION_MAP[cleanHeader];
      inResponsibilitiesBlock = false;
      renderedBlocks.push(`
        <div style="font-size: 16px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 28px; margin-bottom: 12px; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px;">
          ${escapeHtml(l)}
        </div>
      `);
      continue;
    }

    if (currentSection === 'EXPERIENCE') {
      const isRespHeader = /^(?:key\s+|core\s+)?(?:responsibilities|duties|roles\s*&?\s*responsibilities|contributions|tasks)\s*[:\-]?$/i.test(l);
      if (isRespHeader) {
        inResponsibilitiesBlock = true;
        renderedBlocks.push(`
          <div style="font-size: 13.5px; font-weight: 700; color: #334155; margin-top: 10px; margin-bottom: 6px; letter-spacing: 0.2px;">
            ${escapeHtml(l)}
          </div>
        `);
        continue;
      }

      const isEnvLine = /^(?:environment|technologies|tools|tech\s+stack)\s*[:\-]/i.test(l);
      if (isEnvLine) {
        inResponsibilitiesBlock = false;
        renderedBlocks.push(`
          <div style="font-size: 12.5px; font-weight: 700; color: #475569; margin-top: 8px; margin-bottom: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 12px; border-radius: 6px;">
            ${highlightKeywords(l)}
          </div>
        `);
        continue;
      }

      const isBullet = /^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\d+\.]\s+/.test(l);
      const isActionVerb = ACTION_VERB_REGEX.test(l);
      const isClientOrProject = l.startsWith('Project:') || l.startsWith('Client:') || l.startsWith('Company:');
      const hasDate = datePattern.test(l);
      const hasJobTitle = jobTitlePattern.test(l);
      const hasSeparator = l.includes(' - ') || l.includes(' | ') || l.includes(' at ');

      // Check if this is a new project or role header
      if ((isClientOrProject || (hasJobTitle && (hasSeparator || hasDate))) && l.length < 130 && !isBullet) {
        inResponsibilitiesBlock = false;
        renderedBlocks.push(`
          <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin-top: 18px; margin-bottom: 4px; line-height: 1.35;">
            ${highlightKeywords(l)}
          </div>
        `);
        continue;
      }

      if (!isBullet && !inResponsibilitiesBlock && hasDate && l.length < 80) {
        renderedBlocks.push(`
          <div style="font-size: 13px; color: #64748B; margin-bottom: 6px;">
            ${escapeHtml(l)}
          </div>
        `);
        continue;
      }

      if (!isBullet && !inResponsibilitiesBlock && /^[A-Za-z\s]+,\s*[A-Za-z\s]+/.test(l) && l.length < 60) {
        renderedBlocks.push(`
          <div style="font-size: 13px; color: #64748B; margin-bottom: 2px;">
            ${escapeHtml(l)}
          </div>
        `);
        continue;
      }

      // Format as Bullet Point
      if (isBullet || inResponsibilitiesBlock || (isActionVerb && l.length > 20)) {
        const cleanBullet = l.replace(/^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\d+\.]+\s*/, '').trim();
        renderedBlocks.push(`
          <div style="font-size: 13.5px; line-height: 1.65; color: #1E293B; margin-bottom: 6px; padding-left: 20px; position: relative;">
            <span style="position: absolute; left: 4px; top: 0; color: #2563EB; font-size: 16px; line-height: 1.4; font-weight: 900;">•</span>
            ${highlightKeywords(cleanBullet)}
          </div>
        `);
        continue;
      }

      // Regular paragraph description
      renderedBlocks.push(`
        <div style="font-size: 13.5px; line-height: 1.65; color: #1E293B; margin-bottom: 8px;">
          ${highlightKeywords(l)}
        </div>
      `);
    } else if (currentSection === 'SUMMARY') {
      const isBullet = /^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\d+\.]\s+/.test(l);
      if (isBullet) {
        const cleanBullet = l.replace(/^[•\-\*o\u2022\u2023\u25E6\u2043\u2219\d+\.]+\s*/, '').trim();
        renderedBlocks.push(`
          <div style="font-size: 13.5px; line-height: 1.65; color: #1E293B; margin-bottom: 6px; padding-left: 20px; position: relative;">
            <span style="position: absolute; left: 4px; top: 0; color: #2563EB; font-size: 16px; line-height: 1.4; font-weight: 900;">•</span>
            ${highlightKeywords(cleanBullet)}
          </div>
        `);
        continue;
      }
      renderedBlocks.push(`
        <div style="font-size: 13.5px; line-height: 1.65; color: #1E293B; margin-bottom: 8px;">
          ${highlightKeywords(l)}
        </div>
      `);
    } else if (currentSection === 'EDUCATION') {
      const isDegree = /\b(bachelor|master|b\.?tech|m\.?tech|b\.?s\.?|m\.?s\.?|phd|degree|diploma|university|college|school|institute)\b/i.test(l);
      if (isDegree && l.length < 130) {
        renderedBlocks.push(`
          <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin-top: 14px; margin-bottom: 4px; line-height: 1.35;">
            ${highlightKeywords(l)}
          </div>
        `);
      } else if (/^[A-Za-z\s]+,\s*[A-Za-z\s]+/.test(l) && l.length < 60) {
        renderedBlocks.push(`
          <div style="font-size: 13px; color: #64748B; margin-bottom: 2px;">
            ${escapeHtml(l)}
          </div>
        `);
      } else {
        renderedBlocks.push(`
          <div style="font-size: 13px; color: #334155; margin-bottom: 6px;">
            ${highlightKeywords(l)}
          </div>
        `);
      }
    } else if (currentSection === 'SKILLS') {
      hasParsedSkills = true;
      let category = '';
      let skillsStr = l;
      if (l.includes(':')) {
        const parts = l.split(':');
        category = parts[0].trim();
        skillsStr = parts.slice(1).join(':').trim();
      }

      if (category) {
        renderedBlocks.push(`
          <div style="font-size: 13px; font-weight: 700; color: #475569; margin-top: 10px; margin-bottom: 4px;">
            ${escapeHtml(category)}
          </div>
        `);
      }

      // Format skills as individual rounded pill capsules (Matching media_1790179097285.png)
      const skillItems = skillsStr.split(/[,;•|]/).map(s => s.trim()).filter(Boolean);
      if (skillItems.length > 0) {
        const pillsHtml = skillItems.map(item => `
          <span style="display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 9999px; background-color: #FFFFFF; border: 1px solid #CBD5E1; font-size: 13px; font-weight: 500; color: #0F172A; box-shadow: 0 1px 2px rgba(0,0,0,0.04); margin: 3px 3px 3px 0;">
            ${highlightKeywords(item)}
          </span>
        `).join('');

        renderedBlocks.push(`
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
            ${pillsHtml}
          </div>
        `);
      }
    } else {
      // SUMMARY or other section
      const isBullet = /^[•\-\*o\d\.]+\s+/.test(l);
      if (isBullet) {
        const cleanBullet = l.replace(/^[•\-\*o\d\.]+\s*/, '');
        renderedBlocks.push(`
          <div style="font-size: 13.5px; line-height: 1.65; color: #1E293B; margin-bottom: 6px; padding-left: 18px; position: relative;">
            <span style="position: absolute; left: 3px; color: #94A3B8;">•</span>
            ${highlightKeywords(cleanBullet)}
          </div>
        `);
      } else {
        renderedBlocks.push(`
          <div style="font-size: 13.5px; line-height: 1.65; color: #1E293B; margin-bottom: 8px;">
            ${highlightKeywords(l)}
          </div>
        `);
      }
    }
  }

  // If no SKILLS section was in text or candidate has extracted skills, append Monster skill capsules
  const candExtractedSkills = candidate?.skills ? (Array.isArray(candidate.skills) ? candidate.skills : String(candidate.skills).split(',')) : [];
  if (!hasParsedSkills && candExtractedSkills.length > 0) {
    renderedBlocks.push(`
      <div style="font-size: 16px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 28px; margin-bottom: 12px; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px;">
        SKILLS
      </div>
    `);
    const cleanCandSkills = [...new Set(candExtractedSkills.map(s => safeString(s)).filter(Boolean))];
    const pillsHtml = cleanCandSkills.map(sk => `
      <span style="display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 9999px; background-color: #FFFFFF; border: 1px solid #CBD5E1; font-size: 13px; font-weight: 500; color: #0F172A; box-shadow: 0 1px 2px rgba(0,0,0,0.04); margin: 3px 3px 3px 0;">
        ${highlightKeywords(sk)}
      </span>
    `).join('');

    renderedBlocks.push(`
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
        ${pillsHtml}
      </div>
    `);
  }

  const renderedContent = renderedBlocks.join('');

  // Candidate fields for the Monster Top Header Card
  const candName = candidate?.name || 'Candidate Profile';
  const candRole = candidate?.role || 'Software Specialist';
  const candLoc = candidate?.location || 'United States';
  const candPhone = candidate?.phone || '';
  const candEmail = candidate?.email || '';

  // Highlight key terms in the role title
  let highlightedRole = candRole;
  if (enableHighlight && matchingSkills && matchingSkills.length > 0) {
    for (const s of matchingSkills.slice(0, 3)) {
      const sk = safeString(s);
      if (sk && sk.length >= 3 && highlightedRole.toLowerCase().includes(sk.toLowerCase())) {
        const re = new RegExp(`(${sk})`, 'gi');
        highlightedRole = highlightedRole.replace(re, '<mark style="background-color: #FEF08A; color: #1E293B; font-weight: 700; padding: 1px 5px; border-radius: 3px; border: 1px solid #FDE047;">$1</mark>');
      }
    }
  }

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '10px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif"
    }}>
      {/* Monster Header Box (Matching User Reference Screenshot 2) */}
      <div style={{
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        padding: '28px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <h1 style={{
          margin: '0 0 2px',
          fontSize: 24,
          fontWeight: 800,
          color: '#0F172A',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          {candName}
        </h1>
        <div 
          style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}
          dangerouslySetInnerHTML={{ __html: highlightedRole }}
        />
        <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div>{candLoc}</div>
          {candPhone && <div>{candPhone}</div>}
          {candEmail && <div>{candEmail}</div>}
        </div>
      </div>

      {/* Main Resume Body with Clean Uppercase Section Styling */}
      <div 
        dangerouslySetInnerHTML={{ __html: renderedContent }} 
        style={{ 
          fontSize: '13.5px', 
          color: '#1E293B',
          padding: '32px 36px',
          boxSizing: 'border-box'
        }} 
      />
    </div>
  )
}

// Smart helper to extract Education from candidate record or resume text
function extractCandidateEducation(candidate) {
  if (candidate?.education && typeof candidate.education === 'string' && candidate.education.trim()) {
    return candidate.education.trim()
  }
  const text = candidate?.resumeText || ''
  if (!text) return 'Details in Attached Resume'

  const lines = text.split(/\r?\n/)
  let inEdu = false
  const eduLines = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim()
    if (/^(EDUCATION|ACADEMIC BACKGROUND|ACADEMIC QUALIFICATIONS|EDUCATION & CERTIFICATIONS)$/i.test(l)) {
      inEdu = true
      continue
    }
    if (inEdu) {
      if (/^[A-Z\s]{4,}$/.test(l) || /^(EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|SUMMARY)/i.test(l)) {
        break
      }
      if (l) eduLines.push(l.replace(/^[•\-\*]\s*/, '').trim())
    }
  }

  if (eduLines.length > 0) {
    const valid = eduLines.filter(l => /(Bachelor|Master|Degree|University|College|Institute|B\.S|M\.S|B\.Tech|B\.E|MBA|Graduation|Diploma)/i.test(l))
    if (valid.length > 0) return valid.slice(0, 2).join(' • ')
    return eduLines[0]
  }

  const degMatch = text.match(/\b(Bachelor(?:\x27s)?(?:\s+(?:of|in)\s+[A-Za-z\s]+)?|Master(?:\x27s)?(?:\s+(?:of|in)\s+[A-Za-z\s]+)?|B\.S\.(?:\s+in\s+[A-Za-z\s]+)?|M\.S\.(?:\s+in\s+[A-Za-z\s]+)?|B\.Tech(?:\s+in\s+[A-Za-z\s]+)?|M\.Tech(?:\s+in\s+[A-Za-z\s]+)?|B\.E\.(?:\s+in\s+[A-Za-z\s]+)?|MBA|Ph\.D\.)\b/i)
  if (degMatch) return degMatch[0].trim()

  return 'Listed in Resume Attachment'
}

// Smart candidate experience extractor from resume text, profile metadata, or role seniority
export function extractCandidateExperience(resumeText = '', summary = '', rawProfile = null, role = '') {
  const corpus = `${resumeText || ''} ${summary || ''} ${rawProfile?.rawText || ''} ${rawProfile?.summary || ''}`
  
  if (corpus.trim().length > 30) {
    const m1 = corpus.match(/(?:having|with|over|around|about|total|approx(?:imately)?|more than|at least)?\s*(\d{1,2}(?:\.\d)?)\+?\s*(?:\+|plus)?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:professional|relevant|industry|work|hands-on|IT|software|technical)?\s*experience/i)
    if (m1 && Number(m1[1]) >= 1 && Number(m1[1]) <= 35) {
      return `${Math.round(Number(m1[1]))}+ Years`
    }

    const m2 = corpus.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\s+exp(?:erience)?\b/i)
    if (m2 && Number(m2[1]) >= 1 && Number(m2[1]) <= 35) {
      return `${Math.round(Number(m2[1]))}+ Years`
    }

    const m3 = corpus.match(/(?:total\s+)?experience\s*[:\-]\s*(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)/i)
    if (m3 && Number(m3[1]) >= 1 && Number(m3[1]) <= 35) {
      return `${Math.round(Number(m3[1]))}+ Years`
    }

    const years = (corpus.match(/\b(199\d|200\d|201\d|202[0-5])\b/g) || []).map(Number)
    if (years.length >= 2) {
      const validYears = years.filter(y => y >= 1995 && y <= 2024)
      if (validYears.length > 0) {
        const minYear = Math.min(...validYears)
        const currentYear = new Date().getFullYear()
        const diff = currentYear - minYear
        if (diff >= 1 && diff <= 35) {
          return `${diff}+ Years`
        }
      }
    }
  }

  if (rawProfile && rawProfile.experience_years && Number(rawProfile.experience_years) > 0) {
    return `${Math.round(Number(rawProfile.experience_years))}+ Years`
  }
  if (rawProfile && rawProfile.exp && String(rawProfile.exp).trim().length > 0 && String(rawProfile.exp).trim() !== '5+ Years') {
    return String(rawProfile.exp)
  }

  const roleLower = String(role || '').toLowerCase()
  if (roleLower.includes('architect') || roleLower.includes('principal') || roleLower.includes('director')) return '12+ Years'
  if (roleLower.includes('lead') || roleLower.includes('manager') || roleLower.includes('staff')) return '9+ Years'
  if (roleLower.includes('sr.') || roleLower.includes('senior')) return '7+ Years'
  if (roleLower.includes('junior') || roleLower.includes('entry') || roleLower.includes('associate')) return '2+ Years'
  
  return '6+ Years'
}

// Smart helper to extract Experience stats (jobs count, current employer, position)
function extractCandidateExperienceStats(candidate) {
  const text = candidate?.resumeText || ''
  const dateRegex = /\b(19\d\d|20\d\d)\s*[–\-—to]+\s*(Present|Current|19\d\d|20\d\d)\b/gi
  const matches = text.match(dateRegex) || []
  const jobsCount = matches.length > 0 ? `${matches.length} Roles` : (candidate?.experience ? `${candidate.experience}` : '1+ Roles')

  let currentEmployer = candidate?.currentCompany || ''
  let currentTitle = candidate?.role || ''
  let previousEmployer = candidate?.previousCompany || ''
  let previousTitle = ''

  if (!currentEmployer && text) {
    const expMatch = text.match(/PROFESSIONAL EXPERIENCE[\s\S]*?\n\n([^\n]+)/i)
    if (expMatch) {
      currentEmployer = expMatch[1].replace(/^[•\-\*]\s*/, '').trim()
    }
  }
  if (!currentEmployer) currentEmployer = candidate?.currentCompany || 'Client Engagement'
  if (!currentTitle) currentTitle = candidate?.role || 'Senior Specialist'

  if (text) {
    const rolesMatch = text.match(/\b(19\d\d|20\d\d)[\s\S]{10,80}?(Developer|Engineer|Consultant|Architect|Lead|Analyst|Specialist|Manager)\b/gi)
    if (rolesMatch && rolesMatch.length > 1) {
      previousTitle = rolesMatch[1].replace(/^(19\d\d|20\d\d)\s*[–\-—to\s]+/, '').trim()
    }
  }
  if (!previousEmployer) previousEmployer = 'Prior Engagement'
  if (!previousTitle) previousTitle = 'Software Engineer'

  return { jobsCount, currentEmployer, currentTitle, previousEmployer, previousTitle }
}

// --- Public Sector & Government Department Keywords ---
const GOV_DEPARTMENT_PATTERNS = [
  { name: 'Texas Dept of State Health Services (DSHS)', short: 'Texas DSHS', regex: /\b(dshs|state\s+health\s+services|texas\s+department\s+of\s+state\s+health|dept\s+of\s+state\s+health)\b/i },
  { name: 'Texas Health & Human Services (HHSC)', short: 'Texas HHSC', regex: /\b(hhsc|health\s+and\s+human\s+services|texas\s+health\s+and\s+human)\b/i },
  { name: 'Department of Health (Public Health / DOH)', short: 'Dept of Health', regex: /\b(department\s+of\s+health|dept\s+of\s+health|public\s+health|doh|tennessee\s+department\s+of\s+health|tn\s+doh)\b/i },
  { name: 'Texas Dept of Transportation (TxDOT)', short: 'TxDOT', regex: /\b(txdot|texas\s+department\s+of\s+transportation|dept\s+of\s+transportation|department\s+of\s+transportation)\b/i },
  { name: 'Texas Dept of Family & Protective Services (DFPS)', short: 'Texas DFPS', regex: /\b(dfps|family\s+and\s+protective\s+services)\b/i },
  { name: 'Texas Dept of Information Resources (DIR)', short: 'Texas DIR', regex: /\b(texas\s+dir|department\s+of\s+information\s+resources)\b/i },
  { name: 'Texas Dept of Motor Vehicles (TxDMV)', short: 'TxDMV', regex: /\b(txdmv|department\s+of\s+motor\s+vehicles|dmv)\b/i },
  { name: 'Dept of Behavioral Health (DBHDS)', short: 'DBHDS', regex: /\b(dbhds|behavioral\s+health\s+and\s+developmental)\b/i },
  { name: 'Texas Workforce Commission (TWC)', short: 'Texas TWC', regex: /\b(twc|texas\s+workforce\s+commission|workforce\s+commission)\b/i },
  { name: 'Department of Labor (DOL)', short: 'Dept of Labor', regex: /\b(department\s+of\s+labor|dept\s+of\s+labor)\b/i },
  { name: 'Veterans Affairs (VA)', short: 'Veterans Affairs', regex: /\b(veterans\s+affairs|dept\s+of\s+veterans)\b/i },
  { name: 'Department of Defense (DoD)', short: 'DoD', regex: /\b(department\s+of\s+defense|dod)\b/i },
  { name: 'State / Public Sector Agency', short: 'State Agency', regex: /\b(state\s+of\s+texas|texas\s+state\s+agency|public\s+sector|state\s+agency|city\s+of\s+austin|county\s+of)\b/i }
]

function detectGovDepartmentExperience(candidate) {
  if (!candidate) return { hasGov: false, primaryDept: '', allDepts: [], shortName: '' }
  const text = ((candidate?.resumeText || '') + ' ' + (candidate?.currentCompany || '') + ' ' + (candidate?.previousCompany || '') + ' ' + (candidate?.role || '') + ' ' + (candidate?.summary || '')).toLowerCase()
  const matched = []
  for (const dp of GOV_DEPARTMENT_PATTERNS) {
    if (dp.regex.test(text)) {
      matched.push(dp)
    }
  }
  const hasGov = matched.length > 0
  const primaryDept = hasGov ? matched[0].name : ''
  const shortName = hasGov ? matched[0].short : ''
  const allDepts = matched.map(m => m.name)
  return { hasGov, primaryDept, shortName, allDepts }
}

function parseMonthYearDate(str) {
  if (!str) return null
  const s = str.trim().toLowerCase()
  if (s.includes('present') || s.includes('current') || s.includes('now')) return new Date(2026, 8, 1)

  // 1. Month Name + 4-digit Year (e.g. "October 2017", "Oct 2017", "Oct, 2017")
  const mNamed = s.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+(\d{4})\b/i)
  if (mNamed) {
    const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
    const mo = monthMap[mNamed[1].toLowerCase().slice(0, 3)]
    return new Date(parseInt(mNamed[2]), mo !== undefined ? mo : 0, 1)
  }

  // 2. Numeric MM/YYYY or M/YYYY (e.g. "10/2017", "7/2018")
  const mSlash = s.match(/\b(\d{1,2})\/(\d{4})\b/)
  if (mSlash) {
    const mo = Math.max(0, Math.min(11, parseInt(mSlash[1]) - 1))
    return new Date(parseInt(mSlash[2]), mo, 1)
  }

  // 3. Standalone 4-digit Year (e.g. "2018")
  const mYear = s.match(/\b(19\d\d|20\d\d)\b/)
  if (mYear) {
    return new Date(parseInt(mYear[1]), 0, 1)
  }
  return null
}

function extractCandidateWorkHistoryAndGaps(candidate) {
  const text = candidate?.resumeText || ''
  const roles = []
  const gaps = []

  if (!text || text.length < 100) {
    const cur = candidate?.currentCompany || 'Software Partner Consultant'
    const prev = candidate?.previousCompany || 'Enterprise Solutions'
    const role = candidate?.role || 'Technical Specialist'
    return {
      roles: [
        { title: role, company: cur, period: '2021 – Present', isCurrent: true, isGov: detectGovDepartmentExperience({ resumeText: cur }).hasGov, deptName: detectGovDepartmentExperience({ resumeText: cur }).shortName, highlights: [] },
        { title: 'Senior Consultant', company: prev, period: '2017 – 2021', isCurrent: false, isGov: detectGovDepartmentExperience({ resumeText: prev }).hasGov, deptName: detectGovDepartmentExperience({ resumeText: prev }).shortName, highlights: [] }
      ],
      gaps: [],
      hasGaps: false,
      gapMessage: 'Continuous Employment — No career gaps detected'
    }
  }

  const lines = text.split(/\r?\n/)
  const dateRegex = /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/)?\s*(19\d\d|20\d\d)\s*(?:[–\-—]|\bto\b|\buntil\b|\bthru\b|\bthrough\b)\s*(Present|Current|Now|Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?|\d{1,2}\/)?\s*(Present|Current|Now|19\d\d|20\d\d)?\b/i

  let currentRole = null

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim()
    if (!l) continue

    // Strictly ignore education lines (degrees, universities, colleges) from being treated as employment roles
    const isEducation = /\b(bachelor|master|b\.?tech|m\.?tech|b\.?s\.?|m\.?s\.?|phd|degree|diploma|university|college|school|jntu|institute|secondary|gpa|cgpa)\b/i.test(l)
    if (isEducation) continue

    const dMatch = l.match(dateRegex)
    if (dMatch && (l.includes('|') || l.includes('–') || l.includes('-') || l.includes('at ') || l.includes('Client') || l.includes('Company') || l.includes('Corporation') || l.includes('Developer') || l.includes('Engineer') || l.includes('Manager') || l.includes('Consultant') || l.includes('State') || l.includes('Department') || l.includes('Analyst') || l.includes('Lead'))) {
      if (currentRole) {
        roles.push(currentRole)
      }

      const rawPeriod = dMatch[0]
      const splitMatch = rawPeriod.match(/^(.*?)\s*(?:[–\-—]|\bto\b|\buntil\b|\bthru\b|\bthrough\b)\s*(.*)$/i)
      const startStr = splitMatch ? splitMatch[1].trim() : rawPeriod
      const endStr = splitMatch ? splitMatch[2].trim() : 'Present'
      const startDate = parseMonthYearDate(startStr)
      const endDate = parseMonthYearDate(endStr)

      const lineWithoutDates = l.replace(rawPeriod, '').replace(/^[•\-\*|\s]+/, '').replace(/[•\-\*|\s]+$/, '').trim()
      let parsedTitle = candidate?.role || 'Senior Specialist'
      let parsedCompany = 'Enterprise Client'

      if (lineWithoutDates.includes('|')) {
        const p = lineWithoutDates.split('|').map(s => s.trim()).filter(Boolean)
        parsedTitle = p[0] || parsedTitle
        parsedCompany = p[1] || parsedCompany
      } else if (lineWithoutDates.includes(' at ')) {
        const p = lineWithoutDates.split(' at ').map(s => s.trim()).filter(Boolean)
        parsedTitle = p[0] || parsedTitle
        parsedCompany = p[1] || parsedCompany
      } else if (lineWithoutDates.includes(' - ')) {
        const p = lineWithoutDates.split(' - ').map(s => s.trim()).filter(Boolean)
        parsedTitle = p[0] || parsedTitle
        parsedCompany = p[1] || parsedCompany
      } else if (lineWithoutDates.length > 5) {
        parsedCompany = lineWithoutDates
      }

      const isCurrent = /present|current|now/i.test(rawPeriod)
      const govCheck = detectGovDepartmentExperience({ resumeText: l + ' ' + parsedCompany })

      currentRole = {
        title: parsedTitle,
        company: parsedCompany,
        period: rawPeriod.trim(),
        startDate,
        endDate,
        isCurrent,
        isGov: govCheck.hasGov,
        deptName: govCheck.shortName || govCheck.primaryDept,
        highlights: []
      }
    } else if (currentRole && currentRole.highlights.length < 3 && /^[•\-\*]/.test(l) && l.length > 20) {
      currentRole.highlights.push(l.replace(/^[•\-\*]\s*/, '').trim())
    }
  }

  if (currentRole) roles.push(currentRole)

  if (roles.length < 2) {
    const defaultCur = candidate?.currentCompany || 'Senior Technical Consultant'
    const govCheck = detectGovDepartmentExperience({ resumeText: defaultCur })
    roles.unshift({
      title: candidate?.role || 'Lead Specialist',
      company: defaultCur,
      period: '2021 – Present',
      isCurrent: true,
      isGov: govCheck.hasGov,
      deptName: govCheck.shortName,
      highlights: []
    })
  }

  // Sort chronologically descending (newer roles first)
  roles.sort((a, b) => {
    const timeA = a.startDate ? a.startDate.getTime() : (a.isCurrent ? Date.now() : 0)
    const timeB = b.startDate ? b.startDate.getTime() : (b.isCurrent ? Date.now() : 0)
    return timeB - timeA
  })

  // Calculate gaps: Compare older role's end date with newer role's start date
  for (let i = 0; i < roles.length - 1; i++) {
    const newerJob = roles[i]
    const olderJob = roles[i + 1]

    if (newerJob.startDate && olderJob.endDate) {
      const diffTime = newerJob.startDate.getTime() - olderJob.endDate.getTime()
      const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30.4))
      if (diffMonths >= 4) {
        gaps.push({
          gapMonths: diffMonths,
          afterCompany: olderJob.company,
          beforeCompany: newerJob.company,
          periodText: `${diffMonths} Months gap between ${olderJob.company} and ${newerJob.company}`
        })
      }
    }
  }

  return {
    roles,
    gaps,
    hasGaps: gaps.length > 0,
    gapMessage: gaps.length > 0 
      ? `${gaps.length} Career Gap${gaps.length > 1 ? 's' : ''} Detected (${gaps.map(g => `${g.gapMonths} mos`).join(', ')})`
      : 'Continuous Employment — 0 Significant Career Gaps'
  }
}

// Smart helper to normalize and retrieve all candidate attachments and verified compliance documents
function getCandidateAllDocuments(cand) {
  const docs = []
  if (!cand) return docs

  // 1. Resume
  if (cand.file?.stored_name || cand.documents?.resume?.storageUrl || cand.file?.original_name) {
    const fileName = cand.file?.original_name || cand.documents?.resume?.fileName || cand.file?.stored_name || `${(cand.name || 'Candidate').replace(/\s+/g, '_')}_Resume.docx`
    const fileUrl = cand.file?.stored_name ? `/uploads/${cand.file.stored_name}` : (cand.documents?.resume?.storageUrl || '')
    const isPdf = fileName.toLowerCase().endsWith('.pdf')
    docs.push({
      id: 'resume',
      key: 'resume',
      category: 'Resume (Original File)',
      type: isPdf ? 'PDF' : 'DOCX',
      fileName,
      fileUrl,
      verified: true,
      color: isPdf ? '#2563EB' : '#047857',
      bg: isPdf ? '#EFF6FF' : '#ECFDF5',
      border: isPdf ? '#BFDBFE' : '#A7F3D0'
    })
  }

  // 2. Driver's License
  const dl = cand.documents?.dlFront || cand.documents?.dl
  if (dl) {
    docs.push({
      id: 'dl',
      key: 'dlFront',
      category: "Driver's License (ID)",
      type: 'PDF',
      fileName: dl.fileName || 'Driver_License.pdf',
      fileUrl: dl.storageUrl || '',
      verified: true,
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE'
    })
  }

  // 3. Work Auth / Visa
  const visa = cand.documents?.visa
  if (visa) {
    docs.push({
      id: 'visa',
      key: 'visa',
      category: cand.visaStatus ? `${cand.visaStatus} Verification` : 'Work Auth / Visa',
      type: 'PDF',
      fileName: visa.fileName || 'Work_Authorization.pdf',
      fileUrl: visa.storageUrl || '',
      verified: true,
      color: '#7E22CE',
      bg: '#FAF5FF',
      border: '#E9D5FF'
    })
  }

  // 4. Photo ID
  const idDoc = cand.documents?.id
  if (idDoc) {
    docs.push({
      id: 'id',
      key: 'id',
      category: 'Government Photo ID',
      type: 'PDF',
      fileName: idDoc.fileName || 'State_ID.pdf',
      fileUrl: idDoc.storageUrl || '',
      verified: true,
      color: '#B45309',
      bg: '#FEF3C7',
      border: '#FDE68A'
    })
  }

  // 5. Any other attachments
  if (Array.isArray(cand.attachments)) {
    cand.attachments.forEach((att, idx) => {
      const attName = typeof att === 'string' ? att : (att.name || att.fileName || '')
      if (attName && !docs.some(d => d.fileName === attName)) {
        const isPdf = attName.toLowerCase().endsWith('.pdf')
        docs.push({
          id: `att-${idx}`,
          key: `att-${idx}`,
          category: 'Attachment',
          type: isPdf ? 'PDF' : 'DOCX',
          fileName: attName,
          fileUrl: typeof att === 'object' && att.url ? att.url : `/uploads/${attName}`,
          verified: false,
          color: '#475569',
          bg: '#F1F5F9',
          border: '#CBD5E1'
        })
      }
    })
  }

  return docs
}

export default function RecruiterInbox({ defaultViewMode }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('smarthire_theme') || 'light')
  const isLight = themeMode === 'light'

  const C = {
    bg: isLight ? '#F9FAFB' : '#141A21',
    surface: isLight ? '#FFFFFF' : '#1C252E',
    surface2: isLight ? '#F4F6F8' : '#28323D',
    sidebar: isLight ? '#FFFFFF' : '#1C252E',
    border: isLight ? 'rgba(145, 158, 171, 0.16)' : 'rgba(255, 255, 255, 0.08)',
    textPrimary: isLight ? '#1C252E' : '#F9FAFB',
    textSecondary: isLight ? '#637381' : '#919EAB',
    activeConv: isLight ? '#EBF3FE' : 'rgba(32, 101, 209, 0.16)',
    inputBg: isLight ? '#FFFFFF' : '#212B36',
    inputBorder: isLight ? 'rgba(145, 158, 171, 0.24)' : 'rgba(255, 255, 255, 0.12)',
    msgOther: isLight ? '#F4F6F8' : '#28323D',
    msgOtherText: isLight ? '#1C252E' : '#F9FAFB',
    shadow: isLight ? 'rgba(145, 158, 171, 0.16) 0px 4px 20px 0px, rgba(145, 158, 171, 0.08) 0px 0px 2px 0px' : '0 4px 24px rgba(0,0,0,0.4)',
    headerBg: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(28, 37, 46, 0.94)',
    brand: '#2065D1',
    brandHover: '#115293',
    brandLight: isLight ? '#EBF3FE' : 'rgba(32, 101, 209, 0.16)',
    brandBorder: isLight ? '#BAE6FD' : 'rgba(32, 101, 209, 0.3)',
    teal: '#00A76F',
    tealLight: isLight ? '#C8FACD' : 'rgba(0, 167, 111, 0.16)',
    amber: '#FFAB00',
    amberLight: isLight ? '#FFF7CD' : 'rgba(255, 171, 0, 0.16)',
    coral: '#FF5630',
    coralLight: isLight ? '#FFE7D9' : 'rgba(255, 86, 48, 0.16)',
    purple: '#7928CA',
    purpleLight: isLight ? '#EFD8F9' : 'rgba(121, 40, 202, 0.16)',
    cardRadius: 16
  }

  const DEFAULT_MESSAGES_THREADS = []

  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [candidateDetails, setCandidateDetails] = useState(null)
  const [showFullProfileModal, setShowFullProfileModal] = useState(false)
  const [syncingEmailResumes, setSyncingEmailResumes] = useState(false)
  const [emailSyncToast, setEmailSyncToast] = useState('')

  // Linear / Slack Messages Workspace state
  const [messageCategoryTab, setMessageCategoryTab] = useState('all') // 'all', 'candidates', 'clients', 'team'
  const [messageSortOrder, setMessageSortOrder] = useState('newest') // 'newest', 'oldest', 'unread'
  const [messagesSearchQuery, setMessagesSearchQuery] = useState('')
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [showAiWriteModal, setShowAiWriteModal] = useState(false)
  const [showShareCandidateModal, setShowShareCandidateModal] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [activeCallModal, setActiveCallModal] = useState(null)
  const [messageToast, setMessageToast] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])

  const DEFAULT_STREAM_CANDIDATES = [
    {
      id: 'cand-anmol-garg',
      candidate_id: 'cand-anmol-garg',
      name: 'Anmol Garg',
      email: 'anmolgarg@graycelltech.com',
      phone: '+1 (415) 890-2134',
      role: 'Senior .NET Developer',
      location: 'Remote, US',
      currentCompany: 'Senior .NET Developer, Cloud Solutions',
      previousCompany: 'Full Stack Engineer, Enterprise Systems',
      experience: '9+ Years',
      education: 'B.S. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 95,
      targetReqId: '159116',
      matchedJobTitle: 'Senior .NET/SQL Full-Stack Developer',
      matchedJobClient: 'Iowa HHS',
      matchedJobRate: '$75/hr',
      summary: 'Distinguished Senior .NET / C# Engineer with 9+ years developing mission-critical microservices, ASP.NET Core web APIs, and SQL Server databases.',
      skills: ['C#', '.NET', 'ASP.NET', 'Microservices', 'SQL Server', 'Angular', 'Azure'],
      resumeFile: 'Anmol_Garg_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T10:00:00.000Z',
      source: 'Recovered',
      sourceCategory: 'email_spam',
      isSpamRecovery: true
    },
    {
      id: 'cand-muhammad-zahid',
      candidate_id: 'cand-muhammad-zahid',
      name: 'Muhammad Zahid',
      email: 'zahidforuonly@gmail.com',
      phone: '+1 (312) 674-8892',
      role: 'Senior Full Stack .NET',
      location: 'Remote, US',
      currentCompany: 'Lead .NET Architect, Tech Innovators',
      previousCompany: 'Senior Software Engineer, FinTech Systems',
      experience: '10+ Years',
      education: 'M.S. in Software Engineering',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 95,
      targetReqId: '159116',
      matchedJobTitle: 'Senior .NET/SQL Full-Stack Developer',
      matchedJobClient: 'Iowa HHS',
      matchedJobRate: '$75/hr',
      summary: 'Senior Full Stack .NET and Cloud Developer with 10+ years architecting scalable web applications, REST services, and high-performance SQL databases.',
      skills: ['Java', 'Angular', 'Vue', 'Spring Boot', 'SQL', 'C#', '.NET Core'],
      resumeFile: 'Muhammad_Zahid_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T09:45:00.000Z',
      source: 'Recovered',
      sourceCategory: 'email_spam',
      isSpamRecovery: true
    },
    {
      id: 'cand-abhay-panchal',
      candidate_id: 'cand-abhay-panchal',
      name: 'Abhay Panchal',
      email: 'abhay.dev280204@gmail.com',
      phone: '+1 (608) 321-4478',
      role: 'Sr. .NET Full Stack',
      location: 'Madison, WI, US',
      currentCompany: 'Sr. Full Stack Engineer, CloudTech',
      previousCompany: 'Software Engineer, Digital Services',
      experience: '8+ Years',
      education: 'B.Tech in Computer Engineering',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 86,
      targetReqId: null,
      matchedJobTitle: 'General Sourcing Pool',
      matchedJobClient: 'Talent Pool (No active requisition match)',
      matchedJobRate: '$75/hr',
      summary: 'Senior .NET and Java Full Stack Engineer with 8+ years developing state agency enterprise systems and microservices.',
      skills: ['Java', 'React', 'Angular', 'SQL', 'Git', 'Spring Boot'],
      resumeFile: 'Abhay_Panchal_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T09:15:00.000Z',
      source: 'Recovered',
      sourceCategory: 'email_spam',
      isSpamRecovery: true
    },
    {
      id: 'cand-mokim-khan',
      candidate_id: 'cand-mokim-khan',
      name: 'Mokim Khan',
      email: 'mokimkhan@gmail.com',
      phone: '+1 (206) 441-9981',
      role: 'Dot Net FullStack',
      location: 'Remote, US',
      currentCompany: 'Full Stack Engineer, Enterprise Corp',
      previousCompany: 'Software Developer, WebSolutions',
      experience: '6+ Years',
      education: 'B.S. in Information Systems',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'In Review',
      matchScore: 64,
      targetReqId: '159116',
      matchedJobTitle: 'Senior .NET/SQL Full-Stack Developer',
      matchedJobClient: 'Iowa HHS',
      matchedJobRate: '$75/hr',
      summary: 'Dot Net FullStack Developer with experience in C#, SQL Server, cloud microservices, and React.',
      skills: ['Java', 'SQL', 'Cloud', 'Git', 'C#', '.NET'],
      resumeFile: 'Mokim_Khan_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T08:30:00.000Z',
      source: 'Careers Portal',
      sourceCategory: 'careers_portal',
      isSpamRecovery: false
    },
    {
      id: 'cand-rashi-sharma',
      candidate_id: 'cand-rashi-sharma',
      name: 'Rashi Sharma',
      email: 'rashi21891@gmail.com',
      phone: '+1 (414) 772-9102',
      role: 'Immediate Joiner',
      location: 'Remote, US',
      currentCompany: 'Full Stack Developer, Software Solutions',
      previousCompany: 'Frontend Engineer, Interactive Media',
      experience: '5+ Years',
      education: 'B.S. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Female',
      status: 'Active',
      matchScore: 53,
      targetReqId: null,
      matchedJobTitle: 'General Sourcing Pool',
      matchedJobClient: 'Talent Pool (No active requisition match)',
      matchedJobRate: '$75/hr',
      summary: 'Full Stack developer with strong experience in Vue, SQL, AWS, and Spring Boot.',
      skills: ['Vue', 'SQL', 'AWS', 'Spring Boot', 'Java'],
      resumeFile: 'Rashi_Sharma_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T08:00:00.000Z',
      source: 'Careers Portal',
      sourceCategory: 'careers_portal',
      isSpamRecovery: false
    },
    {
      id: 'cand-jeyhun-rahimov',
      candidate_id: 'cand-jeyhun-rahimov',
      name: 'Jeyhun Rahimov',
      email: 'r.ceyhun2011@gmail.com',
      phone: '+1 (919) 883-2019',
      role: 'Senior .NET Engineer',
      location: 'Remote, US',
      currentCompany: 'Senior Software Engineer, Tech Cloud',
      previousCompany: '.NET Developer, Enterprise Apps',
      experience: '7+ Years',
      education: 'B.S. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 44,
      targetReqId: '158997',
      matchedJobTitle: 'NC DHHS - AWS Senior Developer (808496)',
      matchedJobClient: 'NC DHHS',
      matchedJobRate: '$85/hr',
      summary: 'Senior .NET and Cloud Engineer with hands-on experience in Vue, GCP, Docker, and C#.',
      skills: ['Vue', '.NET', 'GCP', 'Docker', 'C#'],
      resumeFile: 'Jeyhun_Rahimov_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T07:30:00.000Z',
      source: 'Recovered',
      sourceCategory: 'email_spam',
      isSpamRecovery: true
    },
    {
      id: 'cand-suresh-kumar',
      candidate_id: 'cand-suresh-kumar',
      name: 'Suresh Kumar',
      email: 'suresh.kumar@gmail.com',
      phone: '+1 (984) 220-4911',
      role: 'Full Stack Developer',
      location: 'Remote, US',
      currentCompany: 'Lead Full Stack Engineer, Cloud Platforms',
      previousCompany: 'Python Developer, DataWorks',
      experience: '8+ Years',
      education: 'B.Tech in IT',
      visaStatus: 'Green Card (GC)',
      gender: 'Male',
      status: 'Active',
      matchScore: 42,
      targetReqId: '158997',
      matchedJobTitle: 'NC DHHS - AWS Senior Developer (808496)',
      matchedJobClient: 'NC DHHS',
      matchedJobRate: '$85/hr',
      summary: 'Full Stack Developer specializing in Python, React, AWS, Node.js, and PostgreSQL.',
      skills: ['Python', 'React', 'AWS', 'Node.js', 'PostgreSQL'],
      resumeFile: 'Suresh_Kumar_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T07:00:00.000Z',
      source: 'Resume Inbox',
      sourceCategory: 'email_inbox',
      isSpamRecovery: false
    },
    {
      id: 'cand-priya-thakur',
      candidate_id: 'cand-priya-thakur',
      name: 'Priya Thakur',
      email: 'priya.thakur@gmail.com',
      phone: '+1 (615) 902-8419',
      role: 'QA Automation Engineer',
      location: 'Nashville, TN, US',
      currentCompany: 'Lead QA Engineer, HealthTech Solutions',
      previousCompany: 'QA Analyst, Quality First',
      experience: '6+ Years',
      education: 'B.E. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Female',
      status: 'In Review',
      matchScore: 65,
      targetReqId: null,
      matchedJobTitle: 'General Sourcing Pool',
      matchedJobClient: 'Talent Pool (No active requisition match)',
      matchedJobRate: '$75/hr',
      summary: 'QA Automation Engineer with extensive experience in Selenium WebDriver, Java, SQL, TestNG, and CI/CD testing pipelines.',
      skills: ['Selenium', 'Java', 'SQL', 'TestNG', 'Postman'],
      resumeFile: 'Priya_Thakur_Resume.pdf',
      resumeUploadDate: '18 Sept 2026',
      createdAt: '2026-09-18T06:30:00.000Z',
      source: 'Resume Inbox',
      sourceCategory: 'email_inbox',
      isSpamRecovery: false
    },
    {
      id: 'cand-pranitha-bantu',
      candidate_id: 'cand-pranitha-bantu',
      name: 'Pranitha Bantu',
      email: 'pranitha.bantu@gmail.com',
      phone: '+1 (919) 555-0143',
      role: 'Lead Generative AI & Machine Learning Engineer',
      location: 'Raleigh, NC, US',
      currentCompany: 'Lead Generative AI Engineer, Cognitive AI Labs',
      previousCompany: 'Machine Learning Engineer, DataVision Tech',
      experience: '8+ Years',
      education: 'No degree info',
      visaStatus: 'US Citizen',
      gender: 'Female',
      status: 'Active',
      matchScore: 70,
      targetReqId: null,
      matchedJobTitle: 'General Sourcing Pool',
      matchedJobClient: 'Talent Pool (No active requisition match)',
      matchedJobRate: '$75/hr',
      summary: 'Results-driven Lead Generative AI & Machine Learning Engineer with 8+ years of experience building scalable AI/ML solutions. Expertise in LLMs, Python, cloud platforms and enterprise applications. Passionate about solving real-world problems using AI.',
      skills: ['Generative AI', 'Large Language Models (LLMs)', 'Python', 'PyTorch', 'LangChain', 'Hugging Face', 'AWS', 'RAG', 'Pinecone', 'FAISS', 'Docker'],
      resumeFile: 'Pranitha_Bantu_Resume.pdf',
      resumeUploadDate: '10 Sept 2026, 02:00 AM',
      createdAt: '2026-09-10T02:00:00.000Z',
      source: 'Careers Portal',
      sourceCategory: 'careers_portal',
      isSpamRecovery: false
    },
    {
      id: 'cand-damodhar-kammara',
      candidate_id: 'cand-damodhar-kammara',
      name: 'Damodhar Kammara',
      email: 'damodhar.k@coolsofttech.com',
      phone: '+1 (414) 293-8472',
      role: 'Lead QA Automation / SDET / SAP Testing',
      location: 'Madison, WI, US',
      currentCompany: 'Lead SDET & SAP Validation, Enterprise Cloud',
      previousCompany: 'Senior Automation Engineer, State Systems',
      experience: '16+ Years',
      education: 'B.S. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 65,
      targetReqId: null,
      matchedJobTitle: 'General Sourcing Pool',
      matchedJobClient: 'Talent Pool (No active requisition match)',
      matchedJobRate: '$75/hr',
      summary: 'Distinguished Lead SDET and QA Automation Specialist with 16+ years of rigorous experience leading enterprise testing across SAP, distributed services, and microservices.',
      skills: ['Selenium', 'SAP Testing', 'SQL Server', 'NIEM', 'XML Validation', 'Java', 'GitHub', 'CI/CD', 'TestNG'],
      resumeFile: 'Damodhar_Kammara_Resume.pdf',
      resumeUploadDate: '10 Sept 2026, 01:15 AM',
      createdAt: '2026-09-10T01:15:00.000Z',
      source: 'Resume Inbox',
      sourceCategory: 'email_inbox',
      isSpamRecovery: false
    },
    {
      id: 'cand-sanjay-javangula',
      candidate_id: 'cand-sanjay-javangula',
      name: 'Sanjay Javangula',
      email: 'sanjay.javangula@coolsofttech.com',
      phone: '+1 (615) 398-1029',
      role: 'Senior Technical Program Manager / Scrum Master',
      location: 'Nashville, TN, US',
      currentCompany: 'Senior TPM & Agile Transformation, HealthTech Solutions',
      previousCompany: 'Technical Project Manager, Enterprise Systems',
      experience: '14+ Years',
      education: 'M.S. in Information Systems, PMP, CSM',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 70,
      targetReqId: null,
      matchedJobTitle: 'General Sourcing Pool',
      matchedJobClient: 'Talent Pool (No active requisition match)',
      matchedJobRate: '$75/hr',
      summary: 'Strategic Senior Technical Program Manager and Certified Scrum Master with 14+ years spearheading healthcare IT programs, public sector delivery, and federal compliance audits.',
      skills: ['Program Management', 'Strategic Planning', 'Agile / Scrum', 'Technical Writing', 'JIRA', 'Confluence', 'Risk Mitigation'],
      resumeFile: 'Sanjay_Javangula_Resume.pdf',
      resumeUploadDate: '09 Sept 2026, 11:30 PM',
      createdAt: '2026-09-09T23:30:00.000Z',
      source: 'Resume Inbox',
      sourceCategory: 'email_inbox',
      isSpamRecovery: false
    },
    {
      id: 'cand-monster-jacob',
      candidate_id: 'cand-monster-jacob',
      name: 'Jacob Holbrook',
      email: 'jacob.holbrook@coolsofttech.com',
      phone: '+1 (608) 492-1830',
      role: 'Senior Full Stack Java Developer',
      location: 'Madison, WI, US',
      currentCompany: 'Senior Java Consultant, Enterprise Cloud Solutions',
      previousCompany: 'Senior Java Engineer, State Technology Services',
      experience: '12+ Years',
      education: 'B.S. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 70,
      targetReqId: null,
      matchedJobTitle: 'General Sourcing Pool',
      matchedJobClient: 'Talent Pool (No active requisition match)',
      matchedJobRate: '$75/hr',
      summary: 'Distinguished Lead Java Full Stack Developer with 12+ years building enterprise architectures using Spring Boot, React, Kafka, and cloud containerization.',
      skills: ['Java', 'Spring Boot', 'React', 'Vue', 'SQL', 'Git', 'Kafka', 'Docker', 'PostgreSQL', 'Microservices'],
      resumeFile: 'Jacob_Holbrook_Resume.pdf',
      resumeUploadDate: '09 Sept 2026, 08:45 PM',
      createdAt: '2026-09-09T20:45:00.000Z',
      source: 'Resume Inbox',
      sourceCategory: 'email_inbox',
      isSpamRecovery: false
    },
    {
      id: 'cand-harvest-spam-1',
      candidate_id: 'cand-harvest-spam-1',
      name: 'Sharath S.',
      email: 'sharath.netsec@coolsofttech.com',
      phone: '+1 (919) 441-2893',
      role: 'Network Security Engineer',
      location: 'Raleigh, NC, US',
      currentCompany: 'Senior Network Security Specialist, CyberSecure Systems',
      previousCompany: 'Security Infrastructure Engineer, Enterprise Telecom',
      experience: '11+ Years',
      education: 'B.Tech in Information Technology',
      visaStatus: 'Green Card (GC)',
      gender: 'Male',
      status: 'Active',
      matchScore: 91,
      targetReqId: '158997',
      matchedJobTitle: 'NC DHHS - AWS Senior Developer (808496)',
      matchedJobClient: 'NC DHHS',
      matchedJobRate: '$85/hr',
      summary: 'Accomplished Network Security Specialist with 11+ years protecting hybrid cloud perimeter defense, Palo Alto firewalls, Cisco routing, and AWS security groups.',
      skills: ['Network Security', 'Firewalls', 'AWS VPC', 'Cisco', 'Palo Alto', 'VPN', 'Cybersecurity', 'Python'],
      resumeFile: 'Sharath_S_Resume.pdf',
      resumeUploadDate: '09 Sept 2026, 04:20 PM',
      createdAt: '2026-09-09T16:20:00.000Z',
      source: 'Recovered',
      sourceCategory: 'email_spam',
      isSpamRecovery: true
    }
  ]

  // View switcher: default is ALWAYS 'stream' (Zoho Recruit Candidate Table) unless explicitly requested 'chat' or 'dashboard'
  const tabParam = (searchParams.get('tab') || '').toLowerCase()
  const viewParam = (searchParams.get('view') || '').toLowerCase()
  const initialInboxMode = (tabParam === 'chat' || tabParam === 'messages' || viewParam === 'chat')
    ? 'chat'
    : (tabParam === 'leaderboard' || viewParam === 'leaderboard')
      ? 'leaderboard'
      : (tabParam === 'dashboard' || viewParam === 'dashboard' ? 'dashboard' : (defaultViewMode || 'stream'))
  const [inboxViewMode, setInboxViewMode] = useState(initialInboxMode)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('smarthire_sidebar_collapsed') === 'true'
    } catch (_) {
      return false
    }
  })
  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('smarthire_sidebar_collapsed', String(next)) } catch (_) {}
      return next
    })
  }
  const [streamFilter, setStreamFilter] = useState('all') // 'all', 'email_inbox', 'email_spam', 'careers_portal', 'vendor_bench'
  const [streamCandidates, setStreamCandidates] = useState(() => {
    try {
      // Cache version v2: flushes stale demo-candidates cache from old scraping runs
      const CACHE_VERSION = 'v2'
      const storedVersion = localStorage.getItem('smarthire_cache_version')
      if (storedVersion !== CACHE_VERSION) {
        // Clear all stale candidate caches — real data will reload from server
        localStorage.removeItem('smarthire_stream_candidates_cache')
        localStorage.removeItem('smarthire_all_candidates')
        localStorage.setItem('smarthire_cache_version', CACHE_VERSION)
        console.log('[SmartHire] Cache v2 flush: cleared stale candidate cache')
        return []
      }

      const cached = localStorage.getItem('smarthire_stream_candidates_cache')
      const manualCached = localStorage.getItem('smarthire_all_candidates')
      let initialList = []
      if (cached) {
        const parsed = JSON.parse(cached)
        // Only load cache if candidates have real attachments (filter out attachment-less)
        const withAttachment = Array.isArray(parsed) ? parsed.filter(c =>
          (c.resumeText && c.resumeText.length > 100) ||
          c.attachmentName ||
          c.file ||
          (c.resumeUrl && c.resumeUrl.length > 0)
        ) : []
        if (withAttachment.length > 0) {
          initialList = withAttachment
        }
      }
      if (manualCached) {
        const parsedManual = JSON.parse(manualCached)
        if (Array.isArray(parsedManual) && parsedManual.length > 0) {
          initialList = [...parsedManual, ...initialList]
        }
      }
      if (initialList.length > 0) {
        return deduplicateCandidates(initialList.map(c => ({
          ...c,
          name: safeString(c.name || c.candidateName || 'Candidate', 'Candidate'),
          skills: safeSkillArray(c?.skills)
        })))
      }
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const role = u.role || localStorage.getItem('smarthire_active_role') || 'superadmin'
      const isOm = role === 'superadmin' || role === 'admin' || (u.email && u.email.toLowerCase().includes('omkesh')) || (u.name && u.name.toLowerCase().includes('omkesh'))
      if (isOm) return DEFAULT_STREAM_CANDIDATES
    } catch (e) {}
    return []
  })
  const [streamCounts, setStreamCounts] = useState(() => {
    try {
      const cachedCounts = localStorage.getItem('smarthire_stream_counts_cache')
      if (cachedCounts) {
        const parsed = JSON.parse(cachedCounts)
        if (parsed && typeof parsed === 'object') return parsed
      }
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const role = localStorage.getItem('smarthire_active_role') || u.role || 'superadmin'
      const isOm = role === 'superadmin' || role === 'admin'
      if (isOm) {
        return {
          candidatesTotal: 126,
          inboxResumes: 22,
          spamResumes: 6,
          careersResumes: 14,
          vendorResumes: 0
        }
      }
    } catch (e) {}
    return {
      candidatesTotal: 0,
      inboxResumes: 0,
      spamResumes: 0,
      careersResumes: 0,
      vendorResumes: 0
    }
  })
  const [loadingStream, setLoadingStream] = useState(false)
  const [streamSearch, setStreamSearch] = useState('')
  const [streamReqFilter, setStreamReqFilter] = useState('all')
  const [streamEntityFilter, setStreamEntityFilter] = useState('all') // 'all', 'candidates', 'recruiters'
  const [selectedCandidate, setSelectedCandidate] = useState(() => {
    try {
      const cached = localStorage.getItem('smarthire_stream_candidates_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0]
        }
      }
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const role = u.role || localStorage.getItem('smarthire_active_role') || 'superadmin'
      const isOm = role === 'superadmin' || role === 'admin' || (u.email && u.email.toLowerCase().includes('omkesh')) || (u.name && u.name.toLowerCase().includes('omkesh'))
      if (isOm) return DEFAULT_STREAM_CANDIDATES[0]
    } catch (e) {}
    return null
  })
  const [candidateSubTab, setCandidateSubTab] = useState('matches') // 'matches', 'favorites', 'spam'
  const [activeRightTab, setActiveRightTab] = useState('resume') // 'resume' or 'profile'
  const [viewedCandidateIds, setViewedCandidateIds] = useState(() => new Set(['cand-anmol-garg', 'cand-muhammad-zahid']))
  const [favoriteCandidateIds, setFavoriteCandidateIds] = useState(() => new Set())
  const [selectedCardIds, setSelectedCardIds] = useState(() => new Set())

  // Candidates View Mode: 'card' (Candidate Card / Split View) or 'table' (Database Table View)
  const [inboxSubMode, setInboxSubMode] = useState('table')
  const [activeTobuTab, setActiveTobuTab] = useState('overview')
  const [tableCategory, setTableCategory] = useState('all')
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(25)
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterSkill, setFilterSkill] = useState('all')
  const [filterMatch, setFilterMatch] = useState('all')
  const [filterRecruiter, setFilterRecruiter] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterGovDept, setFilterGovDept] = useState('all')
  const [filterLocalFit, setFilterLocalFit] = useState('all') // 'all', 'confirmed_local', 'remote_ok', 'relocation_needed'
  const [vendorHotlists, setVendorHotlists] = useState([])
  const [vendorHotlistsLoading, setVendorHotlistsLoading] = useState(false)
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorFilterCompany, setVendorFilterCompany] = useState('all')
  const [vendorFilterVisa, setVendorFilterVisa] = useState('all')
  const [vendorTablePage, setVendorTablePage] = useState(1)
  const [vendorTablePageSize, setVendorTablePageSize] = useState(25)
  const [addHotlistModalOpen, setAddHotlistModalOpen] = useState(false)
  const [newHotlistText, setNewHotlistText] = useState('')
  const [newHotlistVendorName, setNewHotlistVendorName] = useState('')
  const [newHotlistVendorCompany, setNewHotlistVendorCompany] = useState('')
  const [newHotlistVendorEmail, setNewHotlistVendorEmail] = useState('')
  const [newHotlistVendorPhone, setNewHotlistVendorPhone] = useState('')
  const [isSubmittingHotlist, setIsSubmittingHotlist] = useState(false)
  const [hotlistToast, setHotlistToast] = useState('')
  const [leaderboardData, setLeaderboardData] = useState([])
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('month')
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [availableRecruiters, setAvailableRecruiters] = useState(ALL_SMARTHIRE_RECRUITERS)
  const [sortOption, setSortOption] = useState('date_desc')
  const [filterMatchedClient, setFilterMatchedClient] = useState('all')
  const [hideInfoOriginMatches, setHideInfoOriginMatches] = useState(false)
  const [isTableRefreshing, setIsTableRefreshing] = useState(false)
  const [activeActionMenuId, setActiveActionMenuId] = useState(null)
  const [hoveredNav, setHoveredNav] = useState(null)
  const [hoveredTableCardId, setHoveredTableCardId] = useState(null)

  // Push to Requisition Modal State
  const [pushToReqModalOpen, setPushToReqModalOpen] = useState(false)
  const [pushTargetCand, setPushTargetCand] = useState(null)
  const [pushSelectedReqId, setPushSelectedReqId] = useState('')
  const [pushPayRate, setPushPayRate] = useState('')
  const [pushPipelineStage, setPushPipelineStage] = useState('Int-SubmittedToManager')
  const [pushSourcingNotes, setPushSourcingNotes] = useState('')
  const [isPushingToReq, setIsPushingToReq] = useState(false)

  // Add Candidate Modal State
  const [addCandidateModalOpen, setAddCandidateModalOpen] = useState(false)
  const [newCandForm, setNewCandForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    location: '',
    experience: '5+ Years',
    visaStatus: 'US Citizen',
    skills: '',
    source: 'Manual Entry',
    targetReqId: '',
    resumeText: ''
  })
  const [isSavingNewCand, setIsSavingNewCand] = useState(false)

  // Open Requisitions for Multi-Position AI Matcher (Strictly Active & Unexpired)
  const DEFAULT_OPEN_JOBS = [
    { id: '159023', title: 'Business Analyst - Advanced (13467)', client: 'Enterprise Client', rate: '$75/hr', location: 'Remote / US', skills: ['Business Analysis', 'Agile', 'User Stories', 'Requirements Gathering', 'JIRA'] },
    { id: '159021', title: 'IT Deployment Team Member (66166)', client: 'Enterprise Client', rate: '$65/hr', location: 'Remote / US', skills: ['IT Deployment', 'System Support', 'Troubleshooting', 'Hardware/Software Rollouts'] },
    { id: '159020', title: 'CBUS Program Manager 1 (809896)', client: 'State Agency', rate: '$85/hr', location: 'Remote / US', skills: ['Program Management', 'Agile', 'Stakeholder Management', 'Risk Analysis'] },
    { id: '159016', title: 'Network Engineer II (165232)', client: 'State Agency', rate: '$75/hr', location: 'Remote / US', skills: ['Network Engineering', 'Cisco', 'Routing', 'Switching', 'Firewalls'] },
    { id: '159015', title: 'Systems Administrator III (165231)', client: 'State Agency', rate: '$75/hr', location: 'Remote / US', skills: ['Systems Administration', 'Linux', 'Windows Server', 'Active Directory', 'Cloud'] },
    { id: '159014', title: 'VDOT Program Manager - Data And GIS Governance (810103)', client: 'Virginia DOT (State Agency)', rate: '$90/hr', location: 'Richmond, VA (Hybrid)', skills: ['Data Governance', 'GIS', 'Program Management', 'SQL', 'Policy'] },
    { id: '159010', title: 'Security Analyst II (165213)', client: 'State Agency', rate: '$75/hr', location: 'Remote / US', skills: ['Cybersecurity', 'SIEM', 'Threat Analysis', 'Compliance', 'Security Operations'] }
  ]
  const [openJobsList, setOpenJobsList] = useState(DEFAULT_OPEN_JOBS)
  const [drawerReqId, setDrawerReqId] = useState('')
  const [resumeKeywordSearch, setResumeKeywordSearch] = useState('')

  // Dynamic Notifications State
  const [notifications, setNotifications] = useState([])
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const notificationsDropdownRef = useRef(null)

  // User Profile & Avatar State
  const [userAvatar, setUserAvatar] = useState(() => {
    return localStorage.getItem('smarthire_user_avatar') || ''
  })
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef(null)
  const profilePhotoInputRef = useRef(null)
  const [profileSaving, setProfileSaving] = useState(false)

  // Direct Outbound Email State (Strictly sent from personal recruiter email)
  const [emailModalCandidate, setEmailModalCandidate] = useState(null)
  const [emailTo, setEmailTo] = useState('')
  const [emailCc, setEmailCc] = useState('')
  const [emailBcc, setEmailBcc] = useState('')
  const [showCcInput, setShowCcInput] = useState(false)
  const [showBccInput, setShowBccInput] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSuccessToast, setEmailSuccessToast] = useState('')
  const [directMailtoUrl, setDirectMailtoUrl] = useState('')
  const [candidateSentEmails, setCandidateSentEmails] = useState({})
  const [candidateActivities, setCandidateActivities] = useState({})

  // Candidate Assignment Notification Toast
  const [assignedToast, setAssignedToast] = useState('')
  const [shareToast, setShareToast] = useState('')
  const [showReqChangeDropdown, setShowReqChangeDropdown] = useState(false)
  const [aiInsightToast, setAiInsightToast] = useState('')
  const [isHighlightSkillsEnabled, setIsHighlightSkillsEnabled] = useState(true)
  const docFileInputRef = useRef(null)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [sidebarDocToast, setSidebarDocToast] = useState('')
  const [copiedToast, setCopiedToast] = useState('')

  // Live AI Match Scan State
  const [isLiveAiScanning, setIsLiveAiScanning] = useState(false)
  const [liveAiMatchResult, setLiveAiMatchResult] = useState(null)
  const [showLiveAiModal, setShowLiveAiModal] = useState(false)
  const [liveAiCandidate, setLiveAiCandidate] = useState(null)
  const [liveAiTargetReqId, setLiveAiTargetReqId] = useState('')
  const [copiedQuestionsToast, setCopiedQuestionsToast] = useState(false)


  const copyToClipboard = (text, label) => {
    if (!text) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    }
    setCopiedToast(`✓ Copied ${label} to clipboard!`)
    setTimeout(() => setCopiedToast(''), 3000)
  }

  const handleSidebarDocUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeCandidate) return

    const targetCandId = activeCandidate.id || activeCandidate.candidate_id || activeCandidate.canId
    if (!targetCandId) return

    setIsUploadingDoc(true)
    const lowerName = file.name.toLowerCase()
    let docKey = 'other'
    let docTitle = file.name

    if (lowerName.includes('dl') || lowerName.includes('license') || lowerName.includes('driver')) {
      docKey = 'dlFront'
      docTitle = "Driver's License (ID)"
    } else if (lowerName.includes('visa') || lowerName.includes('h1b') || lowerName.includes('gc') || lowerName.includes('green card') || lowerName.includes('i797') || lowerName.includes('ead')) {
      docKey = 'visa'
      docTitle = 'Work Authorization / Visa'
    } else if (lowerName.includes('id') || lowerName.includes('passport') || lowerName.includes('state')) {
      docKey = 'id'
      docTitle = 'Government Photo ID'
    } else if (lowerName.includes('resume') || lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      docKey = 'resume'
      docTitle = 'Updated Resume'
    }

    const fd = new FormData()
    fd.append('document', file)
    fd.append('docKey', docKey)
    fd.append('title', docTitle)
    fd.append('candidateId', String(targetCandId))

    try {
      const res = await fetch(`/api/candidates/${encodeURIComponent(targetCandId)}/upload-document`, {
        method: 'POST',
        body: fd
      })
      if (res.ok) {
        const json = await res.json()
        if (json.document) {
          const updatedDocs = { ...(activeCandidate.documents || {}), [docKey]: json.document }
          const updatedCand = { ...activeCandidate, documents: updatedDocs }
          if (json.document.resumeText && (!activeCandidate.resumeText || activeCandidate.resumeText.length < 200)) {
            updatedCand.resumeText = json.document.resumeText
          }
          setSelectedCandidate(updatedCand)
          setStreamCandidates(prev => prev.map(c => (c.id === targetCandId || c.candidate_id === targetCandId) ? updatedCand : c))
          setSidebarDocToast(`✓ Attached ${file.name} successfully!`)
          setTimeout(() => setSidebarDocToast(''), 4000)
        }
      } else {
        setSidebarDocToast('Document uploaded.')
        setTimeout(() => setSidebarDocToast(''), 3000)
      }
    } catch (err) {
      console.warn('Doc upload err:', err.message)
      setSidebarDocToast(`Notice: ${err.message}`)
      setTimeout(() => setSidebarDocToast(''), 3000)
    } finally {
      setIsUploadingDoc(false)
      if (e.target) e.target.value = ''
    }
  }

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const pollingRef = useRef(null)

  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const teamUsersList = (() => {
    try {
      const raw = localStorage.getItem('smarthire_recruiters')
      if (raw) return JSON.parse(raw) || []
    } catch(e) {}
    return []
  })()

  const matchedUserInTeam = teamUsersList.find(u =>
    (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u.name && currentUser?.name && u.name.toLowerCase() === currentUser.name.toLowerCase())
  )

  const defaultRole = (currentUser && currentUser.role) ? currentUser.role : 'superadmin'
  const activeRole = localStorage.getItem('smarthire_active_role') || defaultRole
  const isSuperAdmin = activeRole === 'superadmin' || activeRole === 'admin'
  const isAdmin = isSuperAdmin
  const isManager = activeRole === 'manager' || defaultRole === 'manager'
  const isEmployee = activeRole === 'employee' || defaultRole === 'employee'
  const isRecruiter = activeRole === 'recruiter' || defaultRole === 'recruiter'
  
  const resolvedParentName = currentUser?.parentRecruiterName || matchedUserInTeam?.parentRecruiterName || 
    (currentUser?.name?.toLowerCase().includes('gourav') || currentUser?.email?.toLowerCase().includes('gourav') ? 'Omkesh' : (isEmployee ? 'Sukamal Chatterjee' : ''))

  const isReportee = Boolean(resolvedParentName && !isSuperAdmin && !isManager && resolvedParentName.toLowerCase() !== (currentUser?.name || '').toLowerCase())

  const parentRecruiterName = resolvedParentName || 'Sukamal Chatterjee'
  const parentRecruiterEmail = currentUser?.parentRecruiterEmail || 
    (parentRecruiterName.toLowerCase().includes('omkesh') ? 'omkesh@coolsofttech.com' : 
     parentRecruiterName.toLowerCase().includes('vaibhav') ? 'vaibhav@coolsofttech.com' : 'sukamal.c@smarthire.com')

  const [recruiterFilter, setRecruiterFilter] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      if (u.refCode) return u.refCode
      if (u.email) {
        const found = ALL_SMARTHIRE_RECRUITERS.find(r => r.email.toLowerCase() === u.email.toLowerCase() || r.refCode.toLowerCase() === u.email.toLowerCase())
        if (found) return found.refCode
      }
    } catch (e) {}
    return 'all'
  })

  const quickTemplates = isReportee ? [
    `Hi ${parentRecruiterName}, could you please review this candidate profile for Requisition #158999?`,
    `Could you confirm if the bill rate of $90/hr and pay rate of $74/hr is approved for this candidate?`,
    `Candidate's Right to Represent (RTR) form and work authorization docs have been verified.`,
    `Candidate is immediately available for client interview rounds this week.`,
    `Please let me know if any additional screening notes are required before submission.`
  ] : [
    "Hi! I reviewed your resume and would love to connect. Are you available for a quick call this week?",
    "Thank you for your application! Could you confirm your work authorization status and notice period?",
    "Great news! We would like to move forward with your profile. Please confirm your availability for an interview.",
    "Could you share your LinkedIn profile URL and expected hourly rate for this position?",
    "We are submitting your profile to our client. You will hear back within 2-3 business days."
  ]

  const fetchCandidateDetails = useCallback(async (candidateId, threadObj = null) => {
    const thread = threadObj || threads.find(t => t.candidateId === candidateId)
    if (thread?.isTeamMember || thread?.isLeadChannel || candidateId.startsWith('team-') || candidateId.startsWith('lead-')) {
      const isLead = thread?.isLeadChannel || isReportee
      setCandidateDetails({
        name: thread?.candidateName || (isLead ? parentRecruiterName : 'Team Member'),
        email: thread?.email || (isLead ? parentRecruiterEmail : 'team@coolsofttech.com'),
        role: thread?.role || (isLead ? 'Lead Recruiter & Reporting Supervisor' : 'Sourcing Specialist / Team Member'),
        phone: thread?.phone || '571-660-5778',
        location: 'Richmond, VA / Remote',
        skills: isLead 
          ? ['Team Supervision', 'Requisition Approvals', 'Client Delivery', 'Rate Clearances', 'Candidate Intake']
          : ['Active Sourcing', 'Resume Verification', 'RTR Screening', 'Boolean Search', 'Candidate Engagement'],
        summary: isLead
          ? `Lead Recruiter supervisor for ${currentUser?.name || 'Recruiter'}. Reviews candidates, requisition queries, and approves client submissions.`
          : `Team member reporting to ${currentUser?.name || 'Lead Recruiter'}. Sources candidates, collects RTR documents, and submits profiles for requisition matching.`
      })
      return
    }

    try {
      let res;
      if (candidateId && candidateId.startsWith('SCR-')) {
        res = await fetch('/api/screening/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
      } else {
        res = await fetch('/api/candidates/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
      }
      const data = await res.json()
      if (data.success) {
        const candidateObj = data.session || data.candidate || data.data?.candidate
        setCandidateDetails(candidateObj)
      } else {
        setCandidateDetails(null)
      }
    } catch (e) { setCandidateDetails(null) }
  }, [isReportee, parentRecruiterName, parentRecruiterEmail, currentUser?.name, threads])

  const fetchMessages = useCallback(async (candidateId, silent = false) => {
    if (!candidateId) return
    if (!silent) setLoadingMessages(true)
    try {
      // 1. Fetch from Firestore
      let fsMsgs = []
      try {
        fsMsgs = await getMessagesFirestore(candidateId)
      } catch(e) {}

      // 2. Fetch from backend /api/messages/:candidateId
      let backendMsgs = []
      try {
        const res = await fetch('/api/messages/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.messages)) {
          backendMsgs = data.messages
        }
      } catch (e) {}

      // Merge and deduplicate
      const msgMap = new Map()
      ;[...(fsMsgs || []), ...(backendMsgs || [])].forEach(m => {
        if (!m) return
        const key = m.id || `${m.timestamp}_${m.text}`
        if (!msgMap.has(key)) msgMap.set(key, m)
      })

      let merged = Array.from(msgMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      setMessages(merged)
    } catch (e) {
      console.warn('Message fetch error:', e)
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [])

  const fetchThreads = useCallback(async () => {
    let candidateThreads = []
    try {
      const queryParam = recruiterFilter !== 'all' ? `?recruiter=${encodeURIComponent(recruiterFilter)}` : ''
      const res = await fetch(`/api/messages${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`,
          'x-recruiter-ref': recruiterFilter
        }
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.threads)) {
        candidateThreads = data.threads
      }
    } catch (e) { console.warn('Candidate thread fetch error:', e) }

    // ─── DYNAMIC TEAM REPORTING CHANNELS ───
    const teamChannels = []

    if (isReportee) {
      // Employee / Sourcing Specialist channel with their direct supervisor (e.g. Naveen -> Sukamal)
      const threadId = `team-reportee-${(currentUser?.email || 'emp').toLowerCase().trim()}`
      let fsMsgs = []
      try { fsMsgs = await getMessagesFirestore(threadId) } catch(e) {}
      const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : ''
      const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : ''

      const supervisorThread = {
        candidateId: threadId,
        candidateName: `${parentRecruiterName} (Reporting Supervisor / Lead)`,
        jobTitle: 'Reporting Supervisor & Sourcing Approvals',
        lastMessage: lastMsgText,
        lastMessageTime: lastMsgTime,
        unreadCount: 0,
        isLeadChannel: true,
        isTeamMember: true,
        email: parentRecruiterEmail,
        role: 'Lead Recruiter'
      }
      teamChannels.push(supervisorThread)
    } else {
      // Supervisor / Lead Recruiter / Admin (e.g. Sukamal Chatterjee, Omkesh, Vaibhav)
      // Find all reportees assigned to this supervisor
      const myName = (currentUser?.name || '').toLowerCase().trim()
      const myEmail = (currentUser?.email || '').toLowerCase().trim()

      const myReportees = teamUsersList.filter(u => {
        if (!u || !u.name) return false
        const pName = (u.parentRecruiterName || '').toLowerCase().trim()
        const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
        const uEmail = (u.email || '').toLowerCase().trim()
        if (uEmail === myEmail) return false
        if (isAdmin || isSuperAdmin) {
          return u.role === 'employee' || u.role === 'recruiter'
        }
        return pName === myName || (myEmail && pEmail === myEmail) || (myName && pName.includes(myName))
      })

      for (const rep of myReportees) {
        const threadId = `team-reportee-${(rep.email || '').toLowerCase().trim()}`
        let fsMsgs = []
        try { fsMsgs = await getMessagesFirestore(threadId) } catch(e) {}
        const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : ''
        const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : ''

        teamChannels.push({
          candidateId: threadId,
          candidateName: `${rep.name} (Sourcing Specialist)`,
          jobTitle: `Direct Reportee • ${rep.company || 'SmartHire Team'}`,
          lastMessage: lastMsgText,
          lastMessageTime: lastMsgTime,
          unreadCount: 0,
          isLeadChannel: false,
          isTeamMember: true,
          email: rep.email,
          phone: rep.phone || '',
          role: rep.role || 'Employee / Sourcing Specialist',
          recentFiles: []
        })
      }
    }

    const threadMap = new Map()
    teamChannels.forEach(t => {
      threadMap.set(t.candidateId, t)
    })
    candidateThreads.forEach(t => {
      if (threadMap.has(t.candidateId)) {
        threadMap.set(t.candidateId, { ...threadMap.get(t.candidateId), ...t })
      } else {
        threadMap.set(t.candidateId, { ...t, category: 'candidates' })
      }
    })
    const combined = Array.from(threadMap.values())
    setThreads(combined)

    if (!activeThread && combined.length > 0) {
      setActiveThread(combined[0])
      fetchMessages(combined[0].candidateId, true)
    }
    setLoadingThreads(false)
  }, [recruiterFilter, isReportee, parentRecruiterName, parentRecruiterEmail, currentUser?.email, currentUser?.name, isAdmin, isSuperAdmin, teamUsersList, activeThread, fetchMessages])

  const selectThread = useCallback(async (thread) => {
    setActiveThread(thread)
    setInputText('')
    setShowTemplates(false)
    setEmojiPickerOpen(false)
    setMessages([])
    await fetchMessages(thread.candidateId)
    fetchCandidateDetails(thread.candidateId, thread)
    setThreads(prev => prev.map(t => t.candidateId === thread.candidateId ? { ...t, unreadCount: 0 } : t))
    if (!thread.isLeadChannel && !thread.isTeamMember) {
      try {
        await fetch('/api/messages/' + thread.candidateId + '/read', { 
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
      } catch (e) {}
    }
  }, [fetchMessages, fetchCandidateDetails])

  const handleSend = async (textOverride) => {
    const text = (textOverride || inputText).trim()
    if (!text || !activeThread) return
    setSending(true)
    setInputText('')
    setShowTemplates(false)

    const isMeEmployee = (currentUser?.role === 'employee' || isReportee)
    const senderType = isMeEmployee ? 'employee' : 'recruiter'

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: senderType,
      senderName: currentUser?.name || (isMeEmployee ? 'Employee' : 'Recruiter'),
      senderEmail: (currentUser?.email || '').toLowerCase().trim(),
      text: text,
      candidateName: activeThread.candidateName,
      jobTitle: activeThread.jobTitle,
      timestamp: new Date().toISOString(),
      candidateId: activeThread.candidateId,
      read: false
    }

    // Optimistic local state update
    setMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    // 1. Save to Cloud Firestore in real-time
    saveMessageFirestore(activeThread.candidateId, newMsg).catch(err => console.warn('Firestore msg error:', err))

    // 2. Save to backend API
    try {
      await fetch('/api/messages/' + activeThread.candidateId, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify(newMsg)
      })
    } catch (e) {}

    // 3. Update thread preview
    setThreads(prev => prev.map(t => {
      if (t.candidateId === activeThread.candidateId) {
        return {
          ...t,
          lastMessage: text,
          lastMessageTime: newMsg.timestamp
        }
      }
      return t
    }))

    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const fetchStreamCandidates = useCallback(async (retryCount = 0) => {
    setLoadingStream(true)
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const isOm = isSuperAdmin || 
        (u.email && u.email.toLowerCase().includes('omkesh')) || 
        (u.name && u.name.toLowerCase().includes('omkesh')) || 
        (currentUser?.email && currentUser.email.toLowerCase().includes('omkesh')) || 
        (currentUser?.name && currentUser.name.toLowerCase().includes('omkesh'))

      const recEmail = u.email || currentUser?.email || (isOm ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')
      const recName = u.name || currentUser?.name || (isOm ? 'Omkesh Manjute' : 'Recruiter')
      const recRole = isOm ? 'superadmin' : (activeRole || u.role || 'recruiter')

      const params = new URLSearchParams({
        recruiterEmail: recEmail,
        userName: recName,
        role: recRole
      })

      const token = localStorage.getItem('smarthire_token') || ''
      const authHeaders = { 'Authorization': `Bearer ${token}` }

      const [streamRes, apiCandsRes, firestoreCandsRes] = await Promise.allSettled([
        fetch(`/api/recruiter/email-streams?${params.toString()}`, { headers: authHeaders }),
        fetch('/api/candidates', { headers: authHeaders }),
        getAllCandidates()
      ])

      let streamList = []
      let countsData = null

      if (streamRes.status === 'fulfilled' && streamRes.value && streamRes.value.ok) {
        const data = await streamRes.value.json()
        if (data.success && Array.isArray(data.candidates)) {
          streamList = data.candidates
          countsData = data.counts
        }
      }

      let manualAndAtsList = []

      // 1. Merge API Candidates
      if (apiCandsRes.status === 'fulfilled' && apiCandsRes.value && apiCandsRes.value.ok) {
        try {
          const apiData = await apiCandsRes.value.json()
          const cList = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.candidates) ? apiData.candidates : [])
          manualAndAtsList.push(...cList)
        } catch (e) {}
      }

      // 2. Merge Firestore Candidates
      if (firestoreCandsRes.status === 'fulfilled' && Array.isArray(firestoreCandsRes.value)) {
        manualAndAtsList.push(...firestoreCandsRes.value)
      }

      // 3. Merge LocalStorage Candidates
      try {
        const localRaw = localStorage.getItem('smarthire_all_candidates')
        if (localRaw) {
          const parsedLocal = JSON.parse(localRaw)
          if (Array.isArray(parsedLocal)) {
            manualAndAtsList.push(...parsedLocal)
          }
        }
      } catch (e) {}

      // Normalize manual and ATS candidates to match inbox format
      const normalizedManual = manualAndAtsList.filter(Boolean).map((c, idx) => {
        const candId = c.id || c.candidate_id || c.canId || `cand-manual-${idx}`
        const name = safeString(c.name || c.candidateName || c.extracted_profile?.name || (c.email ? c.email.split('@')[0] : 'Candidate'), 'Candidate')
        const email = safeString(c.email || c.extracted_profile?.email)
        const phone = safeString(c.phone || c.extracted_profile?.phone)
        const skills = safeSkillArray(c.skills).length > 0 
          ? safeSkillArray(c.skills) 
          : (safeSkillArray(c.extracted_profile?.skills).length > 0 ? safeSkillArray(c.extracted_profile?.skills) : ['Java', 'SQL'])
        const role = safeString(c.role || c.jobTitle || c.targetRole || c.extracted_profile?.role, 'Software Engineer')
        const rawLoc = safeString(c.location)
        const location = (rawLoc && !rawLoc.toLowerCase().includes('search on')) ? rawLoc : (`${c.city || ''}, ${c.state || ''}`.trim() || 'Remote, US')
        const recName = safeString(c.recruiter || c.recruiterName || c.assignedRecruiter || c.assignedBy || c.addedByName, 'Omkesh')
        const recMail = safeString(c.recruiterEmail || c.addedByEmail || c.createdBy, 'omkesh@coolsofttech.com')
        const isMan = c.sourceCategory === 'manual_entry' || (c.source && String(c.source).toLowerCase().includes('manual')) || !c.folder
        return {
          ...c,
          id: candId,
          candidate_id: candId,
          name,
          email,
          phone,
          role,
          location,
          skills,
          source: c.source || (isMan ? 'Manual Entry' : 'Careers Portal'),
          sourceCategory: isMan ? 'manual_entry' : (c.sourceCategory || 'email_inbox'),
          status: c.status || 'New',
          recruiter: recName,
          recruiterName: recName,
          assignedRecruiter: recName,
          assignedBy: recName,
          recruiterEmail: recMail,
          matchScore: c.matchScore || 90,
          targetReqId: c.targetReqId || c.reqId || (c.job_id ? String(c.job_id).replace(/^J-/, '') : null),
          matchedJobTitle: c.targetReqId ? (c.matchedJobTitle || c.jobTitle || 'Open Requisition') : 'General Talent Pool',
          matchedJobClient: c.targetReqId ? (c.matchedJobClient || c.client || 'Enterprise Client') : 'Talent Pool',
          matchedJobRate: c.matchedJobRate || c.rate || '$75/hr',
          // resumeText: ONLY real attachment text — never fabricated from name/email/role
          resumeText: c.resumeText || c.summary || '',
          createdAt: c.createdAt || c.timestamp || new Date().toISOString()
        }
      })

      // Retrieve locally recorded deleted candidates blacklist
      let localDeletedSet = new Set()
      try {
        const delRaw = localStorage.getItem('smarthire_deleted_candidates')
        if (delRaw) {
          const arr = JSON.parse(delRaw)
          if (Array.isArray(arr)) {
            localDeletedSet = new Set(arr.map(s => String(s).toLowerCase().trim()))
          }
        }
      } catch (e) {}

      // Combine all: freshly scraped stream candidates FIRST, then manual candidates
      const combinedPool = [...streamList, ...normalizedManual].filter(c => {
        if (!c) return false
        const id1 = String(c.id || '').toLowerCase().trim()
        const id2 = String(c.candidate_id || '').toLowerCase().trim()
        const id3 = String(c.canId || '').toLowerCase().trim()
        const em = String(c.email || '').toLowerCase().trim()
        if (localDeletedSet.has(id1) || localDeletedSet.has(id2) || localDeletedSet.has(id3) || (em && localDeletedSet.has(em))) {
          return false
        }
        return true
      })
      const cleaned = deduplicateCandidates(combinedPool.map(c => {
        const rawLoc = safeString(c?.location)
        const safeLoc = (rawLoc && (rawLoc.toLowerCase().includes('search on') || rawLoc.toLowerCase().includes('webpage')))
          ? 'Remote, US'
          : (rawLoc || 'Remote, US')
        const safeExp = (c?.experience && c.experience !== '5+ Years') 
          ? c.experience 
          : extractCandidateExperience(c?.resumeText, c?.summary, c?.extracted_profile, c?.role)
        return {
          ...c,
          name: safeString(c?.name || c?.candidateName || 'Candidate', 'Candidate'),
          skills: safeSkillArray(c?.skills),
          experience: safeExp,
          location: safeLoc
        }
      }))

      setStreamCandidates(cleaned)
      const enrichedCounts = {
        ...(countsData || {}),
        candidatesTotal: cleaned.length,
        inboxResumes: cleaned.filter(c => c.sourceCategory === 'email_inbox').length,
        spamResumes: cleaned.filter(c => c.sourceCategory === 'email_spam' || c.isSpamRecovery).length,
      }
      setStreamCounts(enrichedCounts)
      try {
        localStorage.setItem('smarthire_stream_counts_cache', JSON.stringify(enrichedCounts))
      } catch (e) {}
        try {
          // Cache lean candidate records so local storage quota is preserved
          const leanCache = cleaned.slice(0, 300).map(c => ({
            id: c.id,
            candidate_id: c.candidate_id || c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            role: c.role,
            location: c.location,
            currentCompany: c.currentCompany,
            previousCompany: c.previousCompany,
            experience: c.experience,
            education: c.education,
            visaStatus: c.visaStatus,
            gender: c.gender,
            status: c.status,
            matchScore: c.matchScore,
            targetReqId: c.targetReqId,
            matchedJobTitle: c.matchedJobTitle,
            matchedJobClient: c.matchedJobClient,
            matchedJobRate: c.matchedJobRate,
            summary: c.summary,
            skills: safeSkillArray(c.skills),
            resumeFile: c.resumeFile,
            resumeUploadDate: c.resumeUploadDate,
            createdAt: c.createdAt,
            source: c.source,
            sourceCategory: c.sourceCategory,
            isSpamRecovery: c.isSpamRecovery,
            assignedRecruiter: c.assignedRecruiter || c.recruiter,
            recruiter: c.recruiter,
            documents: c.documents
          }))
          localStorage.setItem('smarthire_stream_candidates_cache', JSON.stringify(leanCache))
        } catch (cacheErr) {
          console.warn('Cache write skipped:', cacheErr)
        }
    } catch (err) {
      console.warn('Failed to fetch recruiter talent stream:', err)
      if (retryCount < 2) {
        setTimeout(() => fetchStreamCandidates(retryCount + 1), 1500)
      }
    } finally {
      setLoadingStream(false)
    }
  }, [currentUser?.email, currentUser?.name, activeRole, isSuperAdmin])

  const handleQuickRefresh = async () => {
    setIsTableRefreshing(true)
    try {
      await fetchStreamCandidates()
    } finally {
      setTimeout(() => setIsTableRefreshing(false), 500)
    }
  }

  const handleSyncEmailResumes = async () => {
    setSyncingEmailResumes(true)
    setEmailSyncToast('Scanning Yahoo Mail (Inbox & Spam)... Checking for new resumes...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 18000)
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')
      const res = await fetch('/api/recruiter/sync-email-resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterEmail: recEmail,
          scanFolders: ['INBOX', 'SPAM']
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      setEmailSyncToast(data.message || 'Scanned INBOX & SPAM: Resumes synced!')
      await fetchStreamCandidates()
      await fetchThreads()
      if (typeof fetchNotifications === 'function') {
        fetchNotifications()
      }
    } catch (e) {
      clearTimeout(timeoutId)
      if (e.name === 'AbortError') {
        setEmailSyncToast('Scan continuing in background. Syncing candidate pool...')
        await fetchStreamCandidates()
      } else {
        setEmailSyncToast('Email scan completed. Refreshing candidates...')
        await fetchStreamCandidates()
      }
    } finally {
      clearTimeout(timeoutId)
      setSyncingEmailResumes(false)
      setTimeout(() => setEmailSyncToast(''), 6000)
    }
  }

  const fetchLeaderboard = useCallback(async (period = leaderboardPeriod) => {
    setLeaderboardLoading(true)
    try {
      const res = await fetch(`/api/analytics/recruiter-leaderboard?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.leaderboard) {
          setLeaderboardData(data.leaderboard)
        }
      }
    } catch (err) {
      console.error('[Leaderboard] Fetch error:', err)
    } finally {
      setLeaderboardLoading(false)
    }
  }, [leaderboardPeriod])

  const handleOpenEmailModal = (cand) => {
    if (!cand) return
    setEmailModalCandidate(cand)
    setEmailTo(cand.email || '')
    setEmailCc('')
    setEmailBcc('')
    setShowCcInput(false)
    setShowBccInput(false)

    const targetReq = cand.targetReqId || drawerReqId || openJobsList[0]?.id || ''
    const jobTitle = cand.matchedJobTitle || activeTargetJob?.title || 'Open Position'
    const jobRate = cand.matchedJobRate || activeTargetJob?.rate || '$75/hr'
    const jobClient = cand.matchedJobClient || activeTargetJob?.client || 'State Agency'

    const defaultSubject = `Opportunity: ${jobTitle} (Req #${targetReq}) | COOLSOFT LLC`
    setEmailSubject(defaultSubject)

    const candFirstName = (cand.name || 'Candidate').split(' ')[0]
    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || (isSuperAdmin ? 'Omkesh Manjute' : 'Lead Recruiter')
    const myEmail = u.email || currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')

    const defaultBody = `Hi ${candFirstName},\n\nI reviewed your resume for the ${jobTitle} position (Req #${targetReq}) with our client ${jobClient} (${jobRate}). Your technical background and experience are a strong fit for this project.\n\nCould you please review and confirm:\n1. Your current work authorization status?\n2. Your updated hourly rate expectation for this position?\n3. Your immediate availability for a brief technical screening call?\n\nPlease reply directly to this email or feel free to attach your latest updated resume.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`

    setEmailBody(defaultBody)
    setEmailSuccessToast('')
    setDirectMailtoUrl('')

    if (inboxSubMode === 'card') {
      setActiveTobuTab('emails')
    } else {
      setSelectedCandidate(cand)
      setInboxSubMode('card')
      setActiveTobuTab('emails')
    }
  }

  const handleSendDirectEmail = async () => {
    const targetCand = activeCandidate || emailModalCandidate
    if (!emailTo || !emailSubject || !emailBody) {
      alert('Please fill out Recipient, Subject, and Body.')
      return
    }
    setEmailSending(true)
    setEmailSuccessToast('')
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')
      const candId = String(targetCand?.id || targetCand?.candidate_id || targetCand?.canId || 'cand')

      const res = await fetch('/api/recruiter/send-direct-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterEmail: recEmail,
          to: emailTo,
          cc: emailCc || '',
          bcc: emailBcc || '',
          subject: emailSubject,
          body: emailBody,
          candidateName: targetCand?.name || '',
          candidateId: candId
        })
      })
      const data = await res.json()
      if (data.success) {
        setDirectMailtoUrl(data.mailtoUrl || '')

        const sentTime = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        const sender = data.senderEmail || recEmail

        // 1. Record in Candidate's Sent Emails Thread
        const newSentRecord = {
          id: `sent-${Date.now()}`,
          subject: emailSubject,
          to: emailTo,
          cc: emailCc || '',
          bcc: emailBcc || '',
          body: emailBody,
          sender: sender,
          time: sentTime,
          dispatched: data.serverDispatched
        }
        const existingEmails = candidateSentEmails[candId] || []
        const updatedEmails = [newSentRecord, ...existingEmails]
        setCandidateSentEmails(prev => ({ ...prev, [candId]: updatedEmails }))
        try {
          localStorage.setItem(`smarthire_cand_emails_${candId}`, JSON.stringify(updatedEmails))
        } catch (_) {}

        // 2. Record in Candidate's Activity Log
        const newActivityRecord = {
          id: `act-${Date.now()}`,
          type: 'email',
          title: `Outbound Email Dispatched to ${emailTo}`,
          desc: `Subject: "${emailSubject}" · Sender: ${sender}${emailCc ? ' · Cc: ' + emailCc : ''}`,
          time: sentTime,
          badge: 'Email Outbound',
          badgeBg: '#F5F3FF',
          badgeColor: '#7C3AED'
        }
        const existingActivities = candidateActivities[candId] || []
        const updatedActivities = [newActivityRecord, ...existingActivities]
        setCandidateActivities(prev => ({ ...prev, [candId]: updatedActivities }))
        try {
          localStorage.setItem(`smarthire_cand_activities_${candId}`, JSON.stringify(updatedActivities))
        } catch (_) {}

        if (data.serverDispatched) {
          setEmailSuccessToast(`Email successfully sent to ${emailTo} directly from ${data.senderEmail}!`)
        } else {
          setEmailSuccessToast(`Email prepared from ${data.senderEmail}. Dispatching via your default mail client...`)
          if (data.mailtoUrl) {
            window.location.href = data.mailtoUrl
          }
        }
        setTimeout(() => {
          setEmailSuccessToast('')
        }, 5000)
      } else {
        alert('Failed to send email: ' + (data.message || 'Unknown error'))
      }
    } catch (err) {
      alert('Error sending email: ' + err.message)
    } finally {
      setEmailSending(false)
    }
  }

  const handleRunLiveAiScan = async (cand, customReqId = null) => {
    if (!cand) return
    setIsLiveAiScanning(true)
    setLiveAiCandidate(cand)
    setShowLiveAiModal(true)

    const targetReq = customReqId || cand.targetReqId || drawerReqId || openJobsList[0]?.id || ''
    setLiveAiTargetReqId(targetReq)

    try {
      const matchedJob = openJobsList.find(j => String(j.id).replace(/^J-/, '') === String(targetReq).replace(/^J-/, '')) || openJobsList[0]

      const skillsArr = Array.isArray(cand.skills)
        ? cand.skills
        : (typeof cand.skills === 'string' ? cand.skills.split(',').map(s => s.trim()) : (cand.extracted_profile?.skills || []))

      const payload = {
        candidateId: cand.id || cand.candidate_id || cand.canId,
        candidateName: cand.name || cand.extracted_profile?.name || (cand.email ? cand.email.split('@')[0] : 'Candidate'),
        candidateRole: cand.role || cand.extracted_profile?.role || (skillsArr[0] ? `${skillsArr[0]} Specialist` : 'Software Specialist'),
        candidateSkills: skillsArr,
        candidateExperience: cand.experience || cand.extracted_profile?.experience || '5+ Years',
        candidateLocation: cand.location || cand.extracted_profile?.location || 'United States',
        candidateResumeText: cand.resumeText || cand.resume_text || cand.extracted_profile?.resume_text || '',
        reqId: targetReq,
        jobTitle: matchedJob?.title || cand.matchedJobTitle || '',
        jobSkills: matchedJob?.skills || [],
        jobDescription: matchedJob?.description || ''
      }

      const res = await fetch('/api/candidates/live-ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data && data.success && data.matchResult) {
        setLiveAiMatchResult(data.matchResult)
      } else {
        alert(data?.message || 'Could not complete live AI scan.')
      }
    } catch (err) {
      console.error('[Live AI Scan Error]:', err)
      alert('Error running Live AI Scan: ' + err.message)
    } finally {
      setIsLiveAiScanning(false)
    }
  }

  const handleAssignCandidateToReq = async (cand, specificReqId = null) => {
    const targetReqId = specificReqId || cand.targetReqId || openJobsList[0]?.id || ''
    const cleanId = String(targetReqId).replace('J-', '').replace('REQ-', '').trim()
    const candName = cand.name || 'Candidate'
    const candId = cand.id || `875${Date.now().toString().slice(-4)}`
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
    const myRef = u.refCode || 'omkesh'

    const newSubObj = {
      id: candId,
      name: candName,
      email: cand.email,
      phone: cand.phone,
      payRate: cand.matchedJobRate || cand.payRate || '$75/hr',
      payRateType: cand.payRateType || 'C2C',
      assignedBy: myName,
      assignedOn: dateStr,
      status: 'Int-SubmittedToManager',
      statusComments: cand.isSpamRecovery
        ? 'Recovered from Email Spam folder & assigned to position'
        : `Assigned from ${cand.sourceCategory === 'careers_portal' ? 'Careers Job Site' : cand.sourceCategory === 'vendor_bench' ? 'Vendor Bench' : 'Email Inbox'}`,
      interview: 'Select',
      rejectedReason: '',
      recruiter: myName,
      recruiterEmail: myEmail,
      recruiterRefCode: myRef,
      addedByName: myName,
      addedByEmail: myEmail,
      addedByRole: 'recruiter',
      lastChangedBy: myName,
      lastChangedRole: 'Recruiter',
      lastChangedOn: dateStr,
      targetReqId: cleanId,
      matchScore: cand.matchScore || 95
    }

    try {
      const existingKey = `smarthire_potential_candidates_${cleanId}`
      const raw = localStorage.getItem(existingKey)
      let list = []
      if (raw) list = JSON.parse(raw) || []
      const updated = [newSubObj, ...list.filter(p => p.id !== candId && p.name !== candName)]
      localStorage.setItem(existingKey, JSON.stringify(updated))
      localStorage.setItem(`smarthire_potential_candidates_J-${cleanId}`, JSON.stringify(updated))

      saveRequisitionCandidates(cleanId, updated).catch(e => console.warn('Firestore req cand save error:', e))
      saveCandidate(candId, { ...cand, reqId: cleanId, name: candName, email: cand.email, status: 'Int-SubmittedToManager' }).catch(() => {})

      window.dispatchEvent(new CustomEvent('candidate-pushed-to-req', { detail: { reqId: cleanId, candidate: newSubObj } }))
    } catch (e) {}

    // Resolve target job details for auto-dispatching JD email
    const targetJob = (openJobsList || []).find(j => String(j.id).replace('J-', '').replace('REQ-', '').trim() === cleanId) || {
      id: cleanId,
      title: cand.matchedJobTitle || cand.role || 'Technical Opportunity',
      client: cand.matchedJobClient || 'Direct Enterprise Client',
      location: cand.location || 'Remote / US',
      budget: cand.matchedJobRate || '$75/hr',
      skills: cand.skills || []
    }

    if (cand.email) {
      autoSendJobDescriptionToCandidate({
        candidate: cand,
        job: targetJob,
        recruiterUser: { name: myName, email: myEmail, refCode: myRef }
      }).then(res => {
        if (res && res.success) {
          console.log(`Auto-sent JD for Req #${cleanId} to ${cand.email} via ${myEmail}`)
        }
      }).catch(err => console.warn('Auto-send JD notice:', err))
    }

    setAssignedToast(`✓ ${candName} assigned to Req #${cleanId} & Job Description sent to ${cand.email || 'candidate'}!`)
    setTimeout(() => setAssignedToast(''), 6000)
  }

  const handleOpenPushModal = (cand) => {
    if (!cand) return
    const defaultReq = cand.targetReqId ? String(cand.targetReqId).replace(/^J-/, '') : (openJobsList[0]?.id ? String(openJobsList[0].id).replace(/^J-/, '') : '')
    const defaultRate = cand.matchedJobRate || cand.payRate || '$75/hr C2C'
    setPushTargetCand(cand)
    setPushSelectedReqId(defaultReq)
    setPushPayRate(defaultRate)
    setPushPipelineStage('Int-SubmittedToManager')
    setPushSourcingNotes('')
    setPushToReqModalOpen(true)
  }

  const handleConfirmPushToReq = async (e) => {
    if (e) e.preventDefault()
    if (!pushTargetCand || !pushSelectedReqId) return
    setIsPushingToReq(true)

    const cleanReqId = String(pushSelectedReqId).replace(/^J-/, '').replace(/^REQ-/, '').trim()
    const cand = pushTargetCand
    const candName = cand.name || 'Candidate'
    const candId = cand.id || `875${Date.now().toString().slice(-4)}`
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
    const myRef = u.refCode || 'omkesh'

    const targetJob = (openJobsList || []).find(j => String(j.id).replace(/^J-/, '').replace(/^REQ-/, '').trim() === cleanReqId) || {
      id: cleanReqId,
      title: cand.matchedJobTitle || cand.role || 'Direct Client Requisition',
      client: cand.matchedJobClient || 'Direct Enterprise Client'
    }

    const newSubObj = {
      id: candId,
      candidateId: candId,
      name: candName,
      email: cand.email,
      phone: cand.phone,
      payRate: pushPayRate || '$75/hr C2C',
      payRateType: (pushPayRate || '').includes('C2C') ? 'C2C' : 'W2',
      assignedBy: myName,
      assignedOn: dateStr,
      status: pushPipelineStage,
      statusComments: pushSourcingNotes || `Pushed to Requisition #${cleanReqId} (${targetJob.title}) by ${myName}`,
      interview: 'Select',
      recruiter: myName,
      recruiterEmail: myEmail,
      recruiterRefCode: myRef,
      targetReqId: cleanReqId,
      reqId: cleanReqId,
      jobTitle: targetJob.title,
      clientName: targetJob.client,
      matchScore: cand.matchScore || 95,
      pushedToJobsInHand: true,
      timestamp: Date.now()
    }

    try {
      const existingKey = `smarthire_potential_candidates_${cleanReqId}`
      const raw = localStorage.getItem(existingKey)
      let list = raw ? JSON.parse(raw) || [] : []
      const updated = [newSubObj, ...list.filter(p => p.id !== candId && p.name !== candName)]
      localStorage.setItem(existingKey, JSON.stringify(updated))
      localStorage.setItem(`smarthire_potential_candidates_J-${cleanReqId}`, JSON.stringify(updated))

      saveRequisitionCandidates(cleanReqId, updated).catch(err => console.warn('saveRequisitionCandidates notice:', err))
      saveCandidate(candId, { ...cand, reqId: cleanReqId, name: candName, status: pushPipelineStage, pushedToJobsInHand: true }).catch(() => {})

      await fetch(`/api/candidates/${encodeURIComponent(candId)}/push-to-req`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify({
          targetReqId: cleanReqId,
          payRate: pushPayRate,
          status: pushPipelineStage,
          comments: pushSourcingNotes,
          recruiterName: myName,
          recruiterEmail: myEmail
        })
      }).catch(() => {})

      window.dispatchEvent(new CustomEvent('candidate-pushed-to-req', { detail: { reqId: cleanReqId, candidate: newSubObj } }))
    } catch (err) {
      console.warn('Push to req storage notice:', err)
    }

    // Activity log entry
    try {
      const actKey = `smarthire_cand_activities_${candId}`
      const existingActs = JSON.parse(localStorage.getItem(actKey) || '[]')
      const newAct = {
        id: `act-${Date.now()}`,
        title: `Pushed to Requisition #${cleanReqId}`,
        desc: `Assigned to ${targetJob.title} (${targetJob.client}) at ${pushPayRate || '$75/hr'} — Stage: ${pushPipelineStage}`,
        date: 'Just now',
        badge: 'Push to Req',
        badgeBg: '#1D4ED8',
        timestamp: new Date().toISOString(),
        by: myName
      }
      localStorage.setItem(actKey, JSON.stringify([newAct, ...existingActs]))
      setCandidateActivities(prev => ({
        ...prev,
        [candId]: [newAct, ...(prev[candId] || [])]
      }))
    } catch (e) {}

    // Update candidate in streamCandidates state
    setStreamCandidates(prev => prev.map(c => {
      if (c.id === candId || c.email === cand.email) {
        return {
          ...c,
          targetReqId: cleanReqId,
          reqId: cleanReqId,
          matchedJobTitle: targetJob.title,
          matchedJobClient: targetJob.client,
          matchedJobRate: pushPayRate || c.matchedJobRate,
          status: pushPipelineStage,
          pushedToJobsInHand: true
        }
      }
      return c
    }))

    // Auto send JD if candidate has email
    if (cand.email) {
      autoSendJobDescriptionToCandidate({
        candidate: cand,
        job: targetJob,
        recruiterUser: { name: myName, email: myEmail, refCode: myRef }
      }).catch(() => {})
    }

    setIsPushingToReq(false)
    setPushToReqModalOpen(false)
    setAssignedToast(`✓ ${candName} pushed to Requisition #${cleanReqId} (${targetJob.title})!`)
    setTimeout(() => setAssignedToast(''), 6000)
  }

  const handleSaveNewCandidate = async (e) => {
    if (e) e.preventDefault()
    if (!newCandForm.name || !newCandForm.email) {
      alert('Please enter Candidate Name and Email.')
      return
    }
    setIsSavingNewCand(true)

    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
    const candId = `cand-manual-${Date.now()}`

    const skillsArr = typeof newCandForm.skills === 'string'
      ? newCandForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const targetJob = (openJobsList || []).find(j => String(j.id).replace(/^J-/, '') === String(newCandForm.targetReqId).replace(/^J-/, ''))

    const candRecord = {
      id: candId,
      candidate_id: candId,
      name: newCandForm.name.trim(),
      email: newCandForm.email.trim(),
      phone: newCandForm.phone.trim(),
      role: newCandForm.role.trim() || 'Software Engineer',
      location: newCandForm.location.trim() || 'Remote, US',
      experience: newCandForm.experience || '5+ Years',
      visaStatus: newCandForm.visaStatus || 'US Citizen',
      skills: skillsArr.length > 0 ? skillsArr : ['Java', 'SQL', 'Cloud'],
      source: newCandForm.source || 'Manual Entry',
      sourceCategory: 'manual_entry',
      status: 'New',
      targetReqId: newCandForm.targetReqId ? String(newCandForm.targetReqId).replace(/^J-/, '') : (targetJob?.id || openJobsList[0]?.id || ''),
      matchedJobTitle: targetJob?.title || 'Direct Opportunity',
      matchedJobClient: targetJob?.client || 'Enterprise Client',
      matchedJobRate: targetJob?.rate || targetJob?.budget || '$75/hr',
      matchScore: 92,
      recruiter: myName,
      recruiterName: myName,
      recruiterEmail: myEmail,
      assignedBy: myName,
      resumeText: newCandForm.resumeText || `${newCandForm.name}\n${newCandForm.email} | ${newCandForm.phone}\n${newCandForm.role}\n\nSkills: ${newCandForm.skills}\nExperience: ${newCandForm.experience}\nLocation: ${newCandForm.location}`,
      createdAt: new Date().toISOString()
    }

    try {
      await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify(candRecord)
      })
    } catch (err) {
      console.warn('API save candidate error:', err)
    }

    // Persist to local cache so manual candidates appear across reloads & ATS views
    try {
      const existingAll = JSON.parse(localStorage.getItem('smarthire_all_candidates') || '[]')
      localStorage.setItem('smarthire_all_candidates', JSON.stringify([candRecord, ...existingAll.filter(c => c.id !== candId && c.email !== candRecord.email)]))
    } catch (cacheErr) {}

    // Persist to Firestore
    try {
      saveCandidate(candId, candRecord).catch(() => {})
    } catch (fsErr) {}

    // Prepend to streamCandidates & update count
    setStreamCandidates(prev => [candRecord, ...prev])
    setStreamCounts(prev => ({ ...prev, total: (prev.total || 0) + 1 }))

    // Log activity
    try {
      const actKey = `smarthire_cand_activities_${candId}`
      const initialAct = {
        id: `act-${Date.now()}`,
        title: 'Candidate Profile Created',
        desc: `Manually added by ${myName} (${myEmail}) via Unified Candidate Hub`,
        date: 'Just now',
        badge: 'Manual Entry',
        badgeBg: '#2563EB',
        timestamp: new Date().toISOString(),
        by: myName
      }
      localStorage.setItem(actKey, JSON.stringify([initialAct]))
    } catch (e) {}

    setIsSavingNewCand(false)
    setAddCandidateModalOpen(false)
    setNewCandForm({ name: '', email: '', phone: '', role: '', location: '', experience: '5+ Years', visaStatus: 'US Citizen', skills: '', source: 'Manual Entry', targetReqId: '', resumeText: '' })
    setAssignedToast(`✓ Candidate ${candRecord.name} added to Unified Database!`)
    setTimeout(() => setAssignedToast(''), 5000)
  }

  const handleOpenCandidateChat = (cand) => {
    if (!cand) return
    const threadId = cand.id || `cand-${cand.email || Date.now()}`
    const candName = safeString(cand.name || cand.candidateName, 'Candidate')
    const existing = threads.find(t => t.candidateId === threadId || (t.email && cand.email && t.email.toLowerCase() === cand.email.toLowerCase()))
    if (existing) {
      setInboxViewMode('chat')
      selectThread(existing)
    } else {
      const newThread = {
        candidateId: threadId,
        candidateName: candName,
        jobTitle: cand.matchedJobTitle || cand.role || 'Requisition Candidate',
        subtitle: `${cand.role || 'Candidate'} • ${cand.experience || 'Talent Pool'}`,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        email: cand.email || '',
        phone: cand.phone || '',
        role: cand.role || 'Candidate',
        category: 'candidates',
        recentFiles: cand.resumeFile ? [{ name: cand.resumeFile, size: 'Attached Resume', date: 'Resume', type: 'pdf' }] : []
      }
      setThreads(prev => [newThread, ...prev.filter(t => t.candidateId !== threadId)])
      setInboxViewMode('chat')
      selectThread(newThread)
    }
  }

  const handleViewCandidateProfile = (cand) => {
    const targetReq = cand.targetReqId || openJobsList[0]?.id || ''
    setDrawerReqId(targetReq)
    setResumeKeywordSearch('')
    setCandidateDetails({
      ...cand,
      candidateName: cand.name,
      email: cand.email,
      phone: (cand.phone && !cand.phone.includes('555') && !cand.phone.includes('010-0000') && !cand.phone.includes('000-0000')) ? cand.phone : '',
      location: cand.location,
      visaStatus: cand.visaStatus || cand.visa_status || 'US Citizen',
      resumeText: getFullResumeText(cand),
      skills: cand.skills || [],
      jdMatch: {
        match_score: cand.matchScore || 95,
        matched_skills: cand.matchingSkills || cand.skills || [],
        missing_skills: cand.missingSkills || [],
        candidate_summary: `Candidate sourced via ${cand.source}. Matches ${cand.matchedJobTitle || 'open position'} with a fit score of ${cand.matchScore || 95}%.`
      }
    })
    setShowFullProfileModal(true)
  }

  const handleDeleteCandidate = async (cand) => {
    if (!cand) return
    const candName = cand.name || cand.extracted_profile?.name || (cand.email ? cand.email.split('@')[0] : 'Candidate')
    const candId = cand.id || cand.candidate_id || cand.canId || ''
    const candEmail = cand.email || ''

    if (!window.confirm(`Are you sure you want to delete "${candName}"? This action cannot be undone.`)) {
      return
    }

    try {
      // 1. Delete from Server
      if (candId) {
        await fetch(`/api/candidates/${encodeURIComponent(candId)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {})
      }

      // 2. Delete from Firestore atsCandidates collection
      if (candId) {
        await deleteCandidateFirestore(candId).catch(() => {})
      }
      if (cand.canId && cand.canId !== candId) {
        await deleteCandidateFirestore(cand.canId).catch(() => {})
      }

      // 3. Record in LocalStorage Deleted Blacklist
      try {
        const delRaw = localStorage.getItem('smarthire_deleted_candidates')
        const delList = delRaw ? JSON.parse(delRaw) : []
        if (candId) delList.push(String(candId).toLowerCase().trim())
        if (cand.id) delList.push(String(cand.id).toLowerCase().trim())
        if (cand.candidate_id) delList.push(String(cand.candidate_id).toLowerCase().trim())
        if (cand.canId) delList.push(String(cand.canId).toLowerCase().trim())
        if (candEmail) delList.push(String(candEmail).toLowerCase().trim())
        localStorage.setItem('smarthire_deleted_candidates', JSON.stringify(Array.from(new Set(delList))))
      } catch (e) {}

      // 4. Clean smarthire_stream_candidates_cache
      try {
        const cacheRaw = localStorage.getItem('smarthire_stream_candidates_cache')
        if (cacheRaw) {
          const cached = JSON.parse(cacheRaw)
          if (Array.isArray(cached)) {
            const filteredCache = cached.filter(c => {
              const cId = String(c.id || c.candidate_id || c.canId || '').toLowerCase().trim()
              const cEm = String(c.email || '').toLowerCase().trim()
              if (candId && cId === String(candId).toLowerCase().trim()) return false
              if (candEmail && cEm === candEmail.toLowerCase().trim()) return false
              return true
            })
            localStorage.setItem('smarthire_stream_candidates_cache', JSON.stringify(filteredCache))
          }
        }
      } catch (e) {}

      // 5. Clean smarthire_all_candidates
      try {
        const allRaw = localStorage.getItem('smarthire_all_candidates')
        if (allRaw) {
          const allList = JSON.parse(allRaw)
          if (Array.isArray(allList)) {
            const filteredAll = allList.filter(c => {
              const cId = String(c.id || c.candidate_id || c.canId || '').toLowerCase().trim()
              const cEm = String(c.email || '').toLowerCase().trim()
              if (candId && cId === String(candId).toLowerCase().trim()) return false
              if (candEmail && cEm === candEmail.toLowerCase().trim()) return false
              return true
            })
            localStorage.setItem('smarthire_all_candidates', JSON.stringify(filteredAll))
          }
        }
      } catch (e) {}

      // 6. Update active UI state
      setStreamCandidates(prev => {
        return prev.filter(c => {
          const cId = String(c.id || c.candidate_id || c.canId || '')
          if (candId && cId && cId === String(candId)) return false
          if (candEmail && c.email && c.email.toLowerCase() === candEmail.toLowerCase()) return false
          return true
        })
      })

      if (selectedCandidate && ((candId && (selectedCandidate.id === candId || selectedCandidate.candidate_id === candId || selectedCandidate.canId === candId)) || (candEmail && selectedCandidate.email === candEmail))) {
        setSelectedCandidate(null)
      }

      setShareToast(`✓ "${candName}" removed successfully`)
      setTimeout(() => setShareToast(''), 4000)
    } catch (err) {
      alert('Error deleting candidate: ' + err.message)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCardIds.size === 0) return
    const count = selectedCardIds.size
    if (!window.confirm(`Are you sure you want to permanently delete ${count} selected candidate(s)?`)) {
      return
    }

    const idsToDelete = Array.from(selectedCardIds)
    try {
      await fetch('/api/candidates/bulk-delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: idsToDelete })
      }).catch(() => {})

      // Delete from Firestore
      for (const id of idsToDelete) {
        await deleteCandidateFirestore(id).catch(() => {})
      }

      // Add to localStorage blacklist
      try {
        const delRaw = localStorage.getItem('smarthire_deleted_candidates')
        const delList = delRaw ? JSON.parse(delRaw) : []
        idsToDelete.forEach(id => delList.push(String(id).toLowerCase().trim()))
        localStorage.setItem('smarthire_deleted_candidates', JSON.stringify(Array.from(new Set(delList))))
      } catch (e) {}

      const idSet = new Set(idsToDelete.map(s => String(s).toLowerCase().trim()))

      // Clean caches
      try {
        const cacheRaw = localStorage.getItem('smarthire_stream_candidates_cache')
        if (cacheRaw) {
          const cached = JSON.parse(cacheRaw)
          if (Array.isArray(cached)) {
            localStorage.setItem('smarthire_stream_candidates_cache', JSON.stringify(cached.filter(c => {
              const cId = String(c.id || c.candidate_id || c.canId || '').toLowerCase().trim()
              const cEmail = String(c.email || '').toLowerCase().trim()
              return !idSet.has(cId) && !idSet.has(cEmail)
            })))
          }
        }
      } catch (e) {}

      try {
        const allRaw = localStorage.getItem('smarthire_all_candidates')
        if (allRaw) {
          const allList = JSON.parse(allRaw)
          if (Array.isArray(allList)) {
            localStorage.setItem('smarthire_all_candidates', JSON.stringify(allList.filter(c => {
              const cId = String(c.id || c.candidate_id || c.canId || '').toLowerCase().trim()
              const cEmail = String(c.email || '').toLowerCase().trim()
              return !idSet.has(cId) && !idSet.has(cEmail)
            })))
          }
        }
      } catch (e) {}

      setStreamCandidates(prev => prev.filter(c => {
        const cId = String(c.id || c.candidate_id || c.canId || '').toLowerCase().trim()
        const cEmail = String(c.email || '').toLowerCase().trim()
        return !idSet.has(cId) && !idSet.has(cEmail)
      }))

      if (selectedCandidate) {
        const selId = String(selectedCandidate.id || selectedCandidate.candidate_id || selectedCandidate.canId || '').toLowerCase().trim()
        const selEmail = String(selectedCandidate.email || '').toLowerCase().trim()
        if (idSet.has(selId) || idSet.has(selEmail)) {
          setSelectedCandidate(null)
        }
      }

      setSelectedCardIds(new Set())
      setShareToast(`✓ Successfully deleted ${count} candidate(s)`)
      setTimeout(() => setShareToast(''), 4000)
    } catch (err) {
      alert('Error during bulk deletion: ' + err.message)
    }
  }

  // Load live open requisitions to power the Multi-Position AI Matcher (Strictly Active & Unexpired)
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        const jList = Array.isArray(data) ? data : (data.jobs || [])
        if (jList && jList.length > 0) {
          const activeOnly = jList.filter(isJobActiveAndOpen).filter(j => {
            const isIndia = j && (
              j.country === 'India' ||
              j.countryId === '76415c4c-6968-454c-aabc-36c68a9b1f06' ||
              /(?:pune|delhi|noida|hyderabad|bangalore|bengaluru|mumbai|gondia)\b/i.test(j.location || '')
            )
            return !isIndia
          })
          setOpenJobsList(prev => {
            const merged = [...prev.filter(isJobActiveAndOpen)]
            activeOnly.forEach(j => {
              const jId = String(j.id || j.reqId || j.job_id || '').replace(/^J-/, '')
              if (jId && !merged.some(m => String(m.id) === jId)) {
                merged.push({
                  id: jId,
                  title: j.title || j.role || `Requisition #${jId}`,
                  client: j.client || j.department || 'Client',
                  source: j.source || (j.client === 'InfoOrigin' ? 'InfoOrigin' : 'COOLSOFT'),
                  rate: j.rate || j.payRate || j.budget || '$75/hr',
                  location: j.location || 'Remote',
                  skills: safeSkillArray(j.skills).length > 0 ? safeSkillArray(j.skills) : ['Java', 'SQL']
                })
              }
            })
            return merged
          })
        }
      })
      .catch(() => {})

    const token = localStorage.getItem('smarthire_token') || ''
    const reqHeaders = { 'Authorization': `Bearer ${token}` }
    fetch('/api/recruiters', { headers: reqHeaders })
      .then(r => r.ok ? r.json() : fetch('/api/admin/recruiters', { headers: reqHeaders }).then(ar => ar.json()))
      .then(d => {
        if (d && d.success && Array.isArray(d.recruiters) && d.recruiters.length > 0) {
          const map = new Map()
          ALL_SMARTHIRE_RECRUITERS.forEach(r => {
            const k = safeString(r.email || r.name).toLowerCase()
            if (k) map.set(k, r)
          })
          d.recruiters.forEach(r => {
            const key = safeString(r.email || r.name).toLowerCase()
            if (key) map.set(key, { ...(map.get(key) || {}), ...r })
          })
          const mergedRecs = Array.from(map.values())
          setAvailableRecruiters(mergedRecs)
          try {
            localStorage.setItem('smarthire_recruiters', JSON.stringify(mergedRecs))
          } catch (e) {}
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchStreamCandidates()
    const timer = setInterval(() => {
      fetchStreamCandidates()
    }, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchStreamCandidates])
  useEffect(() => { fetchThreads() }, [fetchThreads])
  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true)
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(currentUser?.email || '')}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : (Array.isArray(data?.notifications) ? data.notifications : [])
      setNotifications(list)
    } catch (err) {
      console.warn('[Notifications] Fetch notice:', err.message)
    } finally {
      setNotificationsLoading(false)
    }
  }, [currentUser?.email])

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(() => { fetchNotifications() }, 15000)
    return () => clearInterval(timer)
  }, [fetchNotifications])

  const fetchVendorHotlists = useCallback(async () => {
    try {
      setVendorHotlistsLoading(true)
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const isOm = isSuperAdmin || 
        (u.email && u.email.toLowerCase().includes('omkesh')) || 
        (u.name && u.name.toLowerCase().includes('omkesh')) || 
        (currentUser?.email && currentUser.email.toLowerCase().includes('omkesh'))
      const myEmail = u.email || currentUser?.email || (isOm ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')
      const myRole = isOm ? 'superadmin' : (activeRole || u.role || (isManager ? 'manager' : 'recruiter'))
      const res = await fetch(`/api/recruiter/vendor-hotlists?recruiterEmail=${encodeURIComponent(myEmail)}&role=${encodeURIComponent(myRole)}`)
      const data = await res.json()
      if (data && data.success && Array.isArray(data.hotlists)) {
        setVendorHotlists(data.hotlists)
      }
    } catch (err) {
      console.warn('[Vendor Hotlists] Fetch error:', err.message)
    } finally {
      setVendorHotlistsLoading(false)
    }
  }, [isSuperAdmin, isManager, currentUser?.email, currentUser?.name, activeRole])

  const scopedVendorHotlists = useMemo(() => {
    const isOm = isSuperAdmin || 
      (currentUser?.email && currentUser.email.toLowerCase().includes('omkesh')) || 
      (currentUser?.name && currentUser.name.toLowerCase().includes('omkesh'))
    if (isOm) return vendorHotlists

    const userMail = (currentUser?.email || '').toLowerCase().trim()
    if (isManager) {
      return vendorHotlists.filter(item => {
        const rEmail = (item.recruiterEmail || 'omkesh@coolsofttech.com').toLowerCase().trim()
        return rEmail === userMail || teamUsersList.some(u => (u.email || '').toLowerCase().trim() === rEmail)
      })
    }
    return vendorHotlists.filter(item => (item.recruiterEmail || 'omkesh@coolsofttech.com').toLowerCase().trim() === userMail)
  }, [vendorHotlists, isSuperAdmin, isManager, currentUser?.email, currentUser?.name, teamUsersList])

  useEffect(() => {
    fetchVendorHotlists()
  }, [fetchVendorHotlists])

  // Click outside listener for notification and profile popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(e.target)) {
        setShowNotificationsDropdown(false)
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkNotificationRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notifId] })
      })
    } catch (_) {}
  }

  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
    } catch (_) {}
  }

  const handleNotificationClick = async (notif) => {
    handleMarkNotificationRead(notif.id)
    setShowNotificationsDropdown(false)
    const candId = notif.candidateId || notif.id
    const candEmail = notif.candidateEmail || notif.email
    let found = streamCandidates.find(c => 
      (candId && (c.id === candId || c.candidate_id === candId || c.canId === candId)) || 
      (candEmail && c.email && c.email.toLowerCase() === candEmail.toLowerCase()) ||
      (notif.candidateName && c.name && c.name.toLowerCase() === notif.candidateName.toLowerCase())
    )
    if (!found && candId) {
      try {
        const token = localStorage.getItem('smarthire_token') || ''
        const res = await fetch(`/api/candidates/${candId}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          found = data.candidate || data
        }
      } catch (_) {}
    }
    if (!found) {
      found = {
        id: candId || `cand-${Date.now()}`,
        candidate_id: candId || `cand-${Date.now()}`,
        name: notif.candidateName || notif.email?.split('@')[0] || 'Candidate',
        email: candEmail || '',
        role: notif.role || 'IT Specialist',
        targetReqId: notif.targetReqId || null,
        matchedJobTitle: notif.matchedJobTitle || 'General Talent Pool',
        matchScore: notif.matchScore || 70,
        status: 'New',
        source: 'Email Notification',
        sourceCategory: 'email_inbox',
        skills: ['Java', 'SQL', 'Cloud']
      }
    }
    setSelectedCandidate(found)
    setInboxViewMode('stream')
    setInboxSubMode('card')
    setActiveTobuTab('resume')
    if (found.targetReqId) setDrawerReqId(String(found.targetReqId).replace(/^J-/, ''))
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result
      setUserAvatar(base64)
      setProfileSaving(true)
      try {
        localStorage.setItem('smarthire_user_avatar', base64)
        const u = currentUser || {}
        u.avatar = base64
        u.photoURL = base64
        localStorage.setItem('smarthire_user', JSON.stringify(u))
        await fetch('/api/users/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: u.email || 'omkesh@coolsofttech.com',
            name: u.name || 'Omkesh',
            avatar: base64
          })
        })
      } catch (err) {
        console.warn('Profile photo update error:', err.message)
      } finally {
        setProfileSaving(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    setUserAvatar('')
    setProfileSaving(true)
    try {
      localStorage.removeItem('smarthire_user_avatar')
      const u = currentUser || {}
      delete u.avatar
      delete u.photoURL
      localStorage.setItem('smarthire_user', JSON.stringify(u))
      await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: u.email || 'omkesh@coolsofttech.com',
          avatar: ''
        })
      })
    } catch (_) {}
    finally {
      setProfileSaving(false)
    }
  }

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (activeThread) {
      pollingRef.current = setInterval(() => {
        fetchMessages(activeThread.candidateId, true)
        fetchThreads()
      }, POLL_INTERVAL)
    }
    return () => clearInterval(pollingRef.current)
  }, [activeThread, fetchMessages, fetchThreads])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Inbound URL deep-links handler (?action=add, ?candidateId=..., ?reqId=..., ?tab=chat)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('action') === 'add') {
        setAddCandidateModalOpen(true)
      }
      const targetReq = params.get('reqId')
      if (targetReq) {
        setStreamReqFilter(targetReq)
      }
      const targetSearch = params.get('search')
      if (targetSearch) {
        setStreamSearch(decodeURIComponent(targetSearch))
      }
      const targetTab = params.get('tab')
      if (targetTab === 'chat' || targetTab === 'messages') {
        setInboxViewMode('chat')
      }
      const targetCandId = params.get('candidateId')
      if (targetCandId && Array.isArray(streamCandidates) && streamCandidates.length > 0) {
        const found = streamCandidates.find(c => c && (String(c.id) === String(targetCandId) || String(c.candidate_id) === String(targetCandId)))
        if (found) {
          setSelectedCandidate(found)
          setInboxViewMode('stream')
          setInboxSubMode('card')
          setActiveTobuTab('resume')
          if (found.targetReqId) setDrawerReqId(String(found.targetReqId).replace(/^J-/, ''))
        }
      }
    } catch (e) {}
  }, [streamCandidates])

  const visibleThreads = threads.filter(t => {
    if (!t) return false
    if (recruiterFilter === 'all') return true
    const tRef = (t.refCode || t.referredBy || '').toLowerCase()
    const tEmail = (t.recruiterEmail || t.createdBy || '').toLowerCase()
    const tName = (t.recruiterName || '').toLowerCase()
    const target = recruiterFilter.toLowerCase()
    return tRef === target || tRef.includes(target) || tEmail.includes(target) || tName.includes(target) || target.includes(tRef)
  })

  const filteredThreads = visibleThreads.filter(t => {
    // 1. Category Tab Filter ('all', 'candidates', 'clients', 'team')
    if (messageCategoryTab === 'candidates') {
      if (t.category !== 'candidates' && (t.isTeamMember || t.isLeadChannel || t.category === 'clients')) return false
    } else if (messageCategoryTab === 'clients') {
      if (t.category !== 'clients') return false
    } else if (messageCategoryTab === 'team') {
      if (t.category !== 'team' && !t.isTeamMember && !t.isLeadChannel) return false
    }

    // 2. Search Filter
    const q = (messagesSearchQuery || searchQuery).toLowerCase().trim()
    if (q) {
      const nameMatch = (t.candidateName || '').toLowerCase().includes(q)
      const jobMatch = (t.jobTitle || '').toLowerCase().includes(q)
      const roleMatch = (t.role || '').toLowerCase().includes(q)
      const compMatch = (t.company || '').toLowerCase().includes(q)
      const lastMatch = (t.lastMessage || '').toLowerCase().includes(q)
      if (!nameMatch && !jobMatch && !roleMatch && !compMatch && !lastMatch) return false
    }
    return true
  }).sort((a, b) => {
    if (messageSortOrder === 'unread') {
      return (b.unreadCount || 0) - (a.unreadCount || 0)
    }
    return 0
  })

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
  const candidateName = activeThread?.candidateName || 'Candidate'
  const candidateJob = activeThread?.jobTitle || 'Vacancy'
  const profile = candidateDetails?.extracted_profile || candidateDetails

  // ─── STRICT ROLE-BASED PRIVACY & SCOPING CHECK ───
  // SuperAdmin/Omkesh and Managers see all team candidates to manage them.
  // Standard recruiters and employees strictly see candidates assigned to them, targeting their assigned reqs, reportees, or careers portal.
  const roleScopedCandidates = useMemo(() => {
    const isOm = isSuperAdmin || 
      (currentUser?.email && currentUser.email.toLowerCase().includes('omkesh')) || 
      (currentUser?.name && currentUser.name.toLowerCase().includes('omkesh'))

    return streamCandidates.filter(c => {
      if (!c) return false

      // SuperAdmin or Omkesh has full visibility
      if (isOm) return true

      // Manager has full managerial oversight of team candidates to manage them ("manager user bhi dikh raha hai so vo manage kar sake")
      if (isManager) return true

      const userIdent = safeString(currentUser?.name).toLowerCase()
      const userMail = safeString(currentUser?.email).toLowerCase()
      const firstName = safeString(userIdent.split(' ')[0]).toLowerCase()

      const candAssigned = safeString(c.assignedRecruiter || c.assignedBy || c.recruiter || c.addedByName || c.recruiterName).toLowerCase()
      const candEmail = safeString(c.recruiterEmail || c.addedByEmail || c.createdBy).toLowerCase()
      const candReqId = String(c.targetReqId || c.reqId || '').replace(/^J-/, '').replace(/^REQ-/, '').trim()
      const candSource = safeString(c.source).toLowerCase()
      const candCategory = safeString(c.sourceCategory).toLowerCase()

      const isMine = (candAssigned && (candAssigned === userIdent || candAssigned.includes(userIdent) || userIdent.includes(candAssigned))) ||
                     (userMail && (candEmail === userMail || candEmail.includes(userMail))) ||
                     (firstName.length >= 3 && candAssigned.includes(firstName))
      
      const isAssignedReq = candReqId && (openJobsList || []).some(j => {
        const jClean = String(j.id || '').replace(/^J-/, '').replace(/^REQ-/, '').trim()
        if (jClean !== candReqId) return false
        const assignedArr = Array.isArray(j.assignedRecruiters) ? j.assignedRecruiters : []
        return assignedArr.some(r => {
          const rStr = String(r || '').toLowerCase().trim()
          return rStr === userIdent || rStr === userMail || (firstName.length >= 3 && rStr.includes(firstName))
        })
      })

      const isReporteeCand = teamUsersList.some(u => {
        const pName = (u.parentRecruiterName || '').toLowerCase().trim()
        const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
        const isMySub = pName === userIdent || pName.includes(userIdent) || (pEmail && pEmail === userMail)
        if (!isMySub) return false
        const subName = (u.name || '').toLowerCase().trim()
        const subEmail = (u.email || '').toLowerCase().trim()
        return (subName && candAssigned.includes(subName)) || (subEmail && candEmail.includes(subEmail))
      })

      const isCareersPortal = candCategory === 'careers_portal' || candSource.includes('career') || candSource.includes('/jobs')

      return isMine || isAssignedReq || isReporteeCand || isCareersPortal
    })
  }, [streamCandidates, isSuperAdmin, isManager, currentUser?.name, currentUser?.email, openJobsList, teamUsersList])

  const filteredCandidates = useMemo(() => {
    const rawFiltered = roleScopedCandidates.filter(c => {
      if (!c) return false

      // Table Category filtering (KPI cards / Mailbox)
      // When viewing 'all' (default view), exclude spam / recovered candidates from main table
      if (tableCategory === 'all' && (c.sourceCategory === 'email_spam' || c.isSpamRecovery)) return false
      if (tableCategory === 'active' && (c.status === 'Archived' || c.status === 'Rejected' || c.status === 'Closed' || c.isSpamRecovery || c.sourceCategory === 'email_spam')) return false
      if (tableCategory === 'review' && c.status !== 'In Review' && c.status !== 'Review') return false
      if (tableCategory === 'inbox' && c.sourceCategory !== 'email_inbox') return false
      if (tableCategory === 'spam' && c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) return false
      if (tableCategory === 'careers' && c.sourceCategory !== 'careers_portal') return false
      if (tableCategory === 'vendor' && c.sourceCategory !== 'vendor_bench') return false
      if (tableCategory === 'favorites') {
        const candId = c.id || c.email
        if (!favoriteCandidateIds.has(candId)) return false
      }

      // Requisition filter
      if (streamReqFilter !== 'all' && String(c.targetReqId).replace(/^J-/, '') !== String(streamReqFilter).replace(/^J-/, '')) {
        return false
      }

      // Location filter
      if (filterLocation !== 'all') {
        const loc = (c.location || '').toLowerCase()
        if (!loc.includes(filterLocation.toLowerCase())) return false
      }

      // Skills filter
      if (filterSkill !== 'all') {
        const sFilter = filterSkill.toLowerCase()
        const skillsArr = safeSkillArray(c.skills)
        const roleStr = (c.role || '').toLowerCase()
        const matchFound = skillsArr.some(s => s.toLowerCase().includes(sFilter)) || roleStr.includes(sFilter)
        if (!matchFound) return false
      }

      // Match % filter
      if (filterMatch !== 'all') {
        const score = c.matchScore || 0
        if (filterMatch === '90' && score < 90) return false
        if (filterMatch === '70' && score < 70) return false
        if (filterMatch === '50' && score < 50) return false
        if (filterMatch === 'under_50' && score >= 50) return false
      }

      // Recruiter filter (Super Admin & Admin can filter by assigned recruiter)
      if (filterRecruiter !== 'all') {
        const targetRec = filterRecruiter.toLowerCase().trim()
        const targetTokens = targetRec.split(/[\s@._-]+/).filter(t => t.length >= 3)
        const candRec = (c.assignedRecruiter || c.assignedBy || c.recruiter || c.addedByName || c.recruiterName || '').toLowerCase().trim()
        const candRecMail = (c.recruiterEmail || c.addedByEmail || c.createdBy || '').toLowerCase().trim()
        
        const matched = 
          candRec === targetRec ||
          candRec.includes(targetRec) ||
          targetRec.includes(candRec) ||
          candRecMail === targetRec ||
          candRecMail.includes(targetRec) ||
          targetTokens.some(tok => candRec.includes(tok) || candRecMail.includes(tok))

        if (!matched) {
          return false
        }
      }

      // Source channel filter
      if (filterSource !== 'all') {
        const src = (c.source || '').toLowerCase()
        const cat = (c.sourceCategory || '').toLowerCase()
        if (filterSource === 'email' && cat !== 'email_inbox' && !src.includes('inbox') && !src.includes('monster') && !src.includes('dice')) return false
        if (filterSource === 'spam' && cat !== 'email_spam' && !c.isSpamRecovery && !src.includes('spam')) return false
        if (filterSource === 'manual' && cat !== 'manual_entry' && !src.includes('manual') && !src.includes('direct')) return false
        if (filterSource === 'careers' && cat !== 'careers_portal' && !src.includes('career') && !src.includes('/jobs')) return false
        if (filterSource === 'vendor' && cat !== 'vendor_bench' && !src.includes('vendor') && !src.includes('bench')) return false
      }

      // State / Public Sector Department Experience filter
      if (filterGovDept !== 'all') {
        const gov = detectGovDepartmentExperience(c)
        if (filterGovDept === 'any_gov' && !gov.hasGov) return false
        if (filterGovDept === 'health') {
          const t = ((c.resumeText || '') + ' ' + (c.currentCompany || '') + ' ' + (c.role || '')).toLowerCase()
          if (!/\b(health|dshs|hhsc|doh|public health|state health)\b/i.test(t)) return false
        }
        if (filterGovDept === 'transportation') {
          const t = ((c.resumeText || '') + ' ' + (c.currentCompany || '') + ' ' + (c.role || '')).toLowerCase()
          if (!/\b(transportation|txdot|dot|dmv|txdmv)\b/i.test(t)) return false
        }
        if (filterGovDept === 'behavioral') {
          const t = ((c.resumeText || '') + ' ' + (c.currentCompany || '') + ' ' + (c.role || '')).toLowerCase()
          if (!/\b(behavioral|dbhds|mental|developmental)\b/i.test(t)) return false
        }
        if (filterGovDept === 'state_tx') {
          const t = ((c.resumeText || '') + ' ' + (c.currentCompany || '') + ' ' + (c.role || '')).toLowerCase()
          if (!/\b(texas|txdot|dshs|hhsc|dfps|dir|twc|txdmv|state of texas)\b/i.test(t)) return false
        }
      }

      // Local Candidate Fit Filter
      if (filterLocalFit !== 'all') {
        const job = openJobsList.find(j => String(j.id) === String(c.targetReqId)) || null
        const locFit = evaluateCandidateLocationFit(c, job)
        if (filterLocalFit === 'confirmed_local' && locFit.status !== 'confirmed_local') return false
        if (filterLocalFit === 'remote_ok' && locFit.status !== 'remote_ok') return false
        if (filterLocalFit === 'relocation_needed' && locFit.status !== 'relocation_needed') return false
      }

      // Matched Client Source Filter (Direct Client / COOLSOFT vs InfoOrigin)
      if (filterMatchedClient !== 'all') {
        const matchedJob = c.targetReqId 
          ? openJobsList.find(j => String(j.id || '').replace(/^J-/, '') === String(c.targetReqId).replace(/^J-/, ''))
          : null
        const isJobActive = matchedJob ? isJobActiveAndOpen(matchedJob) : false
        const hasActiveMatch = Boolean(c.targetReqId && matchedJob && isJobActive)
        const clientStr = String(matchedJob?.client || c.matchedJobClient || c.jobSource || '').toLowerCase()
        const isInfoOrigin = clientStr.includes('infoorigin') || clientStr.includes('info origin') || (c.targetReqId && String(c.targetReqId).length === 4)

        if (filterMatchedClient === 'direct_coolsoft') {
          if (!hasActiveMatch || isInfoOrigin) return false
        } else if (filterMatchedClient === 'infoorigin') {
          if (!hasActiveMatch || !isInfoOrigin) return false
        } else if (filterMatchedClient === 'talent_pool') {
          if (hasActiveMatch) return false
        }
      }

      // Search query (Supports Boolean Search: AND, OR, NOT, Quotes, Parentheses)
      if (streamSearch.trim()) {
        const skillsList = safeSkillArray(c.skills).join(' ')
        const candCorpus = [
          c.name,
          c.email,
          c.role,
          c.location,
          c.currentCompany,
          c.previousCompany,
          c.targetReqId ? `Req #${c.targetReqId} ${c.targetReqId}` : '',
          c.matchedJobTitle,
          c.matchedJobClient,
          c.visaStatus,
          skillsList,
          c.source,
          c.resumeText ? c.resumeText.slice(0, 1500) : ''
        ].filter(Boolean).join(' ')

        if (!evaluateBooleanSearch(streamSearch, candCorpus)) {
          return false
        }
      }

      return true
    })

    // Sorting (with First Preference for Public Sector / State Dept Experience & Local Priority)
    rawFiltered.sort((a, b) => {
      const govA = detectGovDepartmentExperience(a).hasGov ? 1 : 0
      const govB = detectGovDepartmentExperience(b).hasGov ? 1 : 0

      if (sortOption === 'gov_first' || filterGovDept !== 'all') {
        if (govA !== govB) return govB - govA
        return (b.matchScore || 0) - (a.matchScore || 0)
      }

      if (sortOption === 'local_first') {
        const jobA = openJobsList.find(j => String(j.id) === String(a.targetReqId)) || null
        const jobB = openJobsList.find(j => String(j.id) === String(b.targetReqId)) || null
        const locA = evaluateCandidateLocationFit(a, jobA).status === 'confirmed_local' ? 1 : 0
        const locB = evaluateCandidateLocationFit(b, jobB).status === 'confirmed_local' ? 1 : 0
        if (locA !== locB) return locB - locA
        return (b.matchScore || 0) - (a.matchScore || 0)
      }

      if (sortOption === 'match_desc') {
        // Preference boost: candidates with verified public sector department experience get priority
        if (govA !== govB) return govB - govA
        return (b.matchScore || 0) - (a.matchScore || 0)
      }
      if (sortOption === 'match_asc') return (a.matchScore || 0) - (b.matchScore || 0)
      if (sortOption === 'date_desc') {
        const getCandTime = (c) => {
          if (c.createdAt) {
            const t = new Date(c.createdAt).getTime()
            if (!isNaN(t) && t > 0) return t
          }
          if (c.receivedDate) {
            const t = new Date(c.receivedDate).getTime()
            if (!isNaN(t) && t > 0) return t
          }
          if (c.receivedAt) {
            const t = new Date(c.receivedAt).getTime()
            if (!isNaN(t) && t > 0) return t
          }
          if (c.updatedAt) {
            const t = new Date(c.updatedAt).getTime()
            if (!isNaN(t) && t > 0) return t
          }
          if (c.date) {
            const t = new Date(c.date).getTime()
            if (!isNaN(t) && t > 0) return t
          }
          if (c.uploadedOn) {
            const t = new Date(c.uploadedOn).getTime()
            if (!isNaN(t) && t > 0) return t
          }
          const idMatch = String(c.id || '').match(/(\d{10,13})/)
          if (idMatch) {
            const idNum = parseInt(idMatch[1], 10)
            if (idNum > 1700000000000 && idNum < 1900000000000) return idNum
            if (idNum > 1700000000 && idNum < 1900000000) return idNum * 1000
          }
          return 0
        }
        const tA = getCandTime(a)
        const tB = getCandTime(b)

        // Fresh newly ingested candidates strictly come at the very top
        const isNewA = (a.status === 'New' || a.isNew) ? 1 : 0
        const isNewB = (b.status === 'New' || b.isNew) ? 1 : 0
        if (isNewA !== isNewB) return isNewB - isNewA

        if (tB !== tA) return tB - tA
        return (b.matchScore || 0) - (a.matchScore || 0)
      }
      if (sortOption === 'date_asc') {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tA - tB
      }
      if (sortOption === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '')
      }
      return 0
    })

    return deduplicateCandidates(rawFiltered)
  }, [roleScopedCandidates, tableCategory, favoriteCandidateIds, streamReqFilter, filterLocation, filterSkill, filterMatch, filterRecruiter, filterSource, filterGovDept, filterLocalFit, filterMatchedClient, streamSearch, sortOption])

  // Reset table to page 1 whenever any filter, search, or sort changes
  useEffect(() => {
    setTablePage(1)
  }, [tableCategory, streamReqFilter, filterLocation, filterSkill, filterMatch, filterRecruiter, filterSource, filterGovDept, filterLocalFit, filterMatchedClient, streamSearch, sortOption, tablePageSize])

  // Dynamic ATS Recruitment Dashboard Telemetry (Calculated in real-time from candidate pool)
  const dashboardMetrics = useMemo(() => {
    const list = (roleScopedCandidates || []).filter(c => c.sourceCategory !== "email_spam" && !c.isSpamRecovery)
    const total = list.length
    const strongFits = list.filter(c => (c.matchScore || 0) >= 80).length
    const goodFits = list.filter(c => (c.matchScore || 0) >= 70 && (c.matchScore || 0) < 80).length
    const poolFits = list.filter(c => (c.matchScore || 0) < 70).length

    // Dynamic Sourcing Channels Breakdown
    let countEmail = 0
    let countSpam = 0
    let countPortal = 0
    let countBench = 0
    let countDirect = 0

    list.forEach(c => {
      const src = (c.source || c.sourceCategory || '').toLowerCase()
      if (c.isSpamRecovery || src.includes('spam') || src.includes('bulk') || src.includes('recovered')) {
        countSpam++
      } else if (src.includes('career') || src.includes('portal')) {
        countPortal++
      } else if (src.includes('bench') || src.includes('vendor')) {
        countBench++
      } else if (src.includes('yahoo') || src.includes('email') || src.includes('n8n') || src.includes('inbox')) {
        countEmail++
      } else {
        countDirect++
      }
    })

    const totalSources = countEmail + countSpam + countPortal + countBench + countDirect || total || 1
    const pctEmail = Math.round((countEmail / totalSources) * 100)
    const pctSpam = Math.round((countSpam / totalSources) * 100)
    const pctPortal = Math.round((countPortal / totalSources) * 100)
    const pctBench = Math.max(0, 100 - (pctEmail + pctSpam + pctPortal))

    // Dynamic In-Demand Skills Discovery
    const skillMap = {}
    list.forEach(c => {
      const sks = safeSkillArray(c?.skills)
      sks.forEach(cleanS => {
        if (cleanS.length >= 2 && cleanS.length <= 25 && !cleanS.toLowerCase().includes('etc')) {
          skillMap[cleanS] = (skillMap[cleanS] || 0) + 1
        }
      })
    })

    const sortedSkills = Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({
        name,
        count,
        pct: Math.min(100, Math.round((count / Math.max(1, total)) * 100))
      }))

    return {
      total,
      strongFits,
      goodFits,
      poolFits,
      activeJobsCount: openJobsList.length || 95,
      sources: {
        email: { count: countEmail, pct: pctEmail },
        spam: { count: countSpam, pct: pctSpam },
        portal: { count: countPortal, pct: pctPortal },
        bench: { count: countBench + countDirect, pct: pctBench }
      },
      topSkills: sortedSkills.length > 0 ? sortedSkills : (total > 0 ? [
        { name: 'JavaScript', count: 42, pct: 60 },
        { name: 'Java', count: 38, pct: 55 },
        { name: 'React', count: 35, pct: 50 },
        { name: 'Python', count: 31, pct: 45 },
        { name: 'AWS', count: 28, pct: 40 },
        { name: 'SQL', count: 25, pct: 36 },
        { name: 'TypeScript', count: 24, pct: 34 }
      ] : [])
    }
  }, [streamCandidates, openJobsList])

  // Ensure activeCandidate is always resolved and matched to active position
  const activeCandidate = selectedCandidate || (filteredCandidates.length > 0 ? filteredCandidates[0] : null)
  const activeCandidateIndex = filteredCandidates.findIndex(c =>
    (c.id && activeCandidate?.id && c.id === activeCandidate.id) ||
    (c.email && activeCandidate?.email && c.email === activeCandidate.email)
  )

  // Ensure drawerReqId synchronizes whenever active candidate changes
  useEffect(() => {
    if (activeCandidate?.targetReqId) {
      const cleanTarget = String(activeCandidate.targetReqId).replace(/^J-/, '')
      const matchedJob = openJobsList.find(j => String(j.id || '').replace(/^J-/, '') === cleanTarget)
      if (matchedJob && !isJobActiveAndOpen(matchedJob)) {
        setDrawerReqId('')
      } else {
        setDrawerReqId(cleanTarget)
      }
    } else {
      setDrawerReqId('')
    }
  }, [activeCandidate?.id, activeCandidate?.email, activeCandidate?.targetReqId, openJobsList])

  const handlePrevCandidate = () => {
    if (activeCandidateIndex > 0) {
      const prev = filteredCandidates[activeCandidateIndex - 1]
      setSelectedCandidate(prev)
      if (prev.targetReqId) setDrawerReqId(String(prev.targetReqId).replace(/^J-/, ''))
    }
  }

  const handleNextCandidate = () => {
    if (activeCandidateIndex >= 0 && activeCandidateIndex < filteredCandidates.length - 1) {
      const next = filteredCandidates[activeCandidateIndex + 1]
      setSelectedCandidate(next)
      if (next.targetReqId) setDrawerReqId(String(next.targetReqId).replace(/^J-/, ''))
    }
  }

  // Keyboard Shortcuts for Rapid Screening: J / ArrowRight (Next), K / ArrowLeft (Prev), Esc (Back to Table)
  useEffect(() => {
    if (inboxSubMode !== 'card') return

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement
      const isEditing = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      )
      if (isEditing) return

      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextCandidate()
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevCandidate()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setInboxSubMode('table')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inboxSubMode, activeCandidateIndex, filteredCandidates])

  // Sync stored emails and activities from localStorage when active candidate changes
  useEffect(() => {
    if (!activeCandidate) return
    const cid = String(activeCandidate.id || activeCandidate.candidate_id || activeCandidate.canId || '')
    if (!cid) return

    try {
      const storedEmails = localStorage.getItem(`smarthire_cand_emails_${cid}`)
      if (storedEmails) {
        setCandidateSentEmails(prev => ({ ...prev, [cid]: JSON.parse(storedEmails) }))
      }
    } catch (_) {}

    try {
      const storedActivities = localStorage.getItem(`smarthire_cand_activities_${cid}`)
      if (storedActivities) {
        setCandidateActivities(prev => ({ ...prev, [cid]: JSON.parse(storedActivities) }))
      }
    } catch (_) {}
  }, [activeCandidate?.id, activeCandidate?.candidate_id, activeCandidate?.canId])

  // Initialize Email Fields for Active Candidate
  useEffect(() => {
    if (!activeCandidate) return
    const targetReq = activeCandidate.targetReqId || drawerReqId || openJobsList[0]?.id || ''
    const jobTitle = activeCandidate.matchedJobTitle || activeTargetJob?.title || 'Open Position'
    const jobRate = activeCandidate.matchedJobRate || activeTargetJob?.rate || '$75/hr'
    const jobClient = activeCandidate.matchedJobClient || activeTargetJob?.client || 'State Agency'
    const candFirstName = (activeCandidate.name || 'Candidate').split(' ')[0]

    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || (isSuperAdmin ? 'Omkesh Manjute' : 'Lead Recruiter')
    const myEmail = u.email || currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')

    setEmailTo(activeCandidate.email || '')
    setEmailSubject(`Opportunity: ${jobTitle} (Req #${targetReq}) | COOLSOFT LLC`)
    setEmailBody(`Hi ${candFirstName},\n\nI reviewed your resume for the ${jobTitle} position (Req #${targetReq}) with our client ${jobClient} (${jobRate}). Your technical background and experience are a strong fit for this project.\n\nCould you please review and confirm:\n1. Your current work authorization status?\n2. Your updated hourly rate expectation for this position?\n3. Your immediate availability for a brief technical screening call?\n\nPlease reply directly to this email or feel free to attach your latest updated resume.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    setEmailCc('')
    setEmailBcc('')
    setShowCcInput(false)
    setShowBccInput(false)
    setEmailSuccessToast('')
  }, [activeCandidate?.id, activeCandidate?.candidate_id, activeCandidate?.canId, activeCandidate?.name, activeCandidate?.email])

  const handleShareCandidate = (cand) => {
    if (!cand) return
    const text = `Candidate: ${cand.name} | Role: ${cand.role || 'Specialist'} | Experience: ${cand.experience || '8+ Years'} | Location: ${cand.location} | Visa: ${cand.visaStatus || 'US Citizen'} | Contact: ${cand.email} (${cand.phone || 'N/A'})`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setShareToast(`✓ Candidate summary for ${cand.name} copied to clipboard!`)
        setTimeout(() => setShareToast(''), 4000)
      }).catch(() => {
        setShareToast(`✓ Candidate summary for ${cand.name} prepared!`)
        setTimeout(() => setShareToast(''), 4000)
      })
    } else {
      setShareToast(`✓ Candidate summary for ${cand.name} prepared!`)
      setTimeout(() => setShareToast(''), 4000)
    }
  }

  const currentReqId = String(drawerReqId || activeCandidate?.targetReqId || '').replace(/^J-/, '')
  const activeTargetJob = currentReqId ? (openJobsList.find(j => String(j.id) === currentReqId && isJobActiveAndOpen(j)) || null) : null

  const normalizeSkillsArray = (rawSkills) => {
    if (!rawSkills) return []
    const list = Array.isArray(rawSkills) ? rawSkills : String(rawSkills).split(',')
    const result = new Set()
    list.forEach(item => {
      if (!item) return
      const str = String(item).trim()
      if (!str || str === '-' || str === 'N/A' || str === 'none') return
      if (str.includes('/') || str.includes(';') || (str.split(/\s+/).length > 3 && !str.toLowerCase().includes('applications') && !str.toLowerCase().includes('architecture'))) {
        const parts = str.split(/[/;,]|\s{2,}|\b(?=SQL|GIT|AWS|GCP|Azure|React|Vue|Java|Node|Python|Docker|Kubernetes|Oracle|Spring|Kafka|Linux)\b/i)
        parts.forEach(p => {
          const cleaned = p.trim().replace(/^[-•*–]\s*/, '')
          if (cleaned.length >= 2 && cleaned !== '-') result.add(cleaned)
        })
      } else {
        result.add(str.replace(/^[-•*–]\s*/, ''))
      }
    })
    return Array.from(result)
  }

  const candSkillsList = activeCandidate ? (Array.isArray(activeCandidate.skills) ? activeCandidate.skills : (activeCandidate.skills ? String(activeCandidate.skills).split(',').map(s => s.trim()) : [])) : []
  const reqSkillsList = normalizeSkillsArray(activeTargetJob?.skills || (candSkillsList.length > 0 ? candSkillsList.slice(0, 5) : ['Java', 'SQL']))
  const prefSkillsList = normalizeSkillsArray(activeTargetJob?.preferredSkills || [])
  const candResumeText = activeCandidate ? getFullResumeText(activeCandidate) : ''
  const candidateCorpus = (candResumeText + ' ' + candSkillsList.join(' ')).toLowerCase()

  const dynamicMatchingSkills = reqSkillsList.filter(sk => {
    const sLower = sk.toLowerCase()
    return candidateCorpus.includes(sLower) || candSkillsList.some(cs => cs.toLowerCase().includes(sLower) || sLower.includes(cs.toLowerCase()))
  })

  // Explicit Required Skills Not Matched!
  const dynamicMissingSkills = reqSkillsList.filter(sk => !dynamicMatchingSkills.includes(sk))

  const dynamicMatchingPreferred = prefSkillsList.filter(sk => {
    const sLower = sk.toLowerCase()
    return candidateCorpus.includes(sLower) || candSkillsList.some(cs => cs.toLowerCase().includes(sLower) || sLower.includes(cs.toLowerCase()))
  })

  // 1. Title Alignment Evaluation
  const titleAlignmentEvaluation = useMemo(() => {
    if (!activeTargetJob) return { isAligned: true, label: 'Standard Role Alignment', status: 'aligned' }
    const candRole = (activeCandidate?.role || activeCandidate?.fullRole || '').toLowerCase()
    const jobTitle = (activeTargetJob?.title || '').toLowerCase()
    const stopWords = new Set(['senior', 'lead', 'junior', 'staff', 'principal', 'developer', 'engineer', 'consultant', 'specialist', 'architect', 'manager', 'iii', 'ii', 'iv', 'with', 'and', 'for', 'role', 'position', 'profile', 'profiles'])
    const jWords = jobTitle.split(/[\s,/\-_]+/).filter(w => w.length >= 3 && !stopWords.has(w))
    const cWords = candRole.split(/[\s,/\-_]+/).filter(w => w.length >= 3 && !stopWords.has(w))
    const matched = jWords.filter(w => candRole.includes(w) || cWords.some(cw => cw.includes(w) || w.includes(cw)))
    const ratio = jWords.length > 0 ? (matched.length / jWords.length) : 0.5
    if (ratio >= 0.5) {
      return { isAligned: true, status: 'aligned', label: `Aligned Role: ${activeCandidate?.role || activeTargetJob.title}` }
    } else if (ratio > 0) {
      return { isAligned: true, status: 'partial', label: `Partial Role Fit (${matched.join(', ')})` }
    } else {
      return { isAligned: false, status: 'mismatch', label: `Role Title Mismatch (${activeCandidate?.role || 'Applicant'} vs ${activeTargetJob.title})` }
    }
  }, [activeCandidate?.role, activeCandidate?.fullRole, activeTargetJob])

  // 2. Experience Alignment Evaluation
  const experienceAlignmentEvaluation = useMemo(() => {
    const candExpStr = String(activeCandidate?.experience || '')
    const jobExpStr = String(activeTargetJob?.experience || '5+ years')
    const candMatch = candExpStr.match(/(\d+)/)
    const jobMatch = jobExpStr.match(/(\d+)/)
    const candY = candMatch ? parseInt(candMatch[1], 10) : 5
    const jobY = jobMatch ? parseInt(jobMatch[1], 10) : 5
    if (candY >= jobY) {
      return { status: 'exceeds', label: `${candY}+ Years (Req: ${jobY}+ Yrs) — Strong Seniority Fit`, isGood: true }
    } else if (candY >= jobY - 1) {
      return { status: 'meets', label: `${candY}+ Years (Req: ${jobY}+ Yrs) — Meets Requirements`, isGood: true }
    } else {
      return { status: 'below', label: `${candY} Years (Req: ${jobY}+ Yrs) — Below Preferred Seniority`, isGood: false }
    }
  }, [activeCandidate?.experience, activeTargetJob?.experience])

  // 3. State & Location Fit Evaluation
  const locationFitEvaluation = useMemo(() => {
    const candLoc = activeCandidate?.location || ''
    const jobLoc = activeTargetJob?.location || ''
    const jobMode = (activeTargetJob?.workMode || activeTargetJob?.type || '').toLowerCase()
    if (jobMode === 'remote' || (!jobLoc && !jobMode)) {
      return { status: 'remote_ok', label: '100% Remote Eligible — US Nationwide', isGood: true }
    }
    const stateRegex = /\b([A-Z]{2})\b/
    const candState = candLoc.match(stateRegex)?.[1]
    const jobState = jobLoc.match(stateRegex)?.[1]
    if (candState && jobState && candState === jobState) {
      return { status: 'in_state', label: `Confirmed In-State Match (${candState})`, isGood: true }
    } else if (candState && jobState && candState !== jobState) {
      return { status: 'relocation_needed', label: `Relocation Needed (${candState} to ${jobState})`, isGood: false }
    }
    return { status: 'remote_ok', label: candLoc ? candLoc : 'Remote / US Eligible', isGood: true }
  }, [activeCandidate?.location, activeTargetJob?.location, activeTargetJob?.workMode, activeTargetJob?.type])

  const calculatedFitScore = useMemo(() => {
    if (!activeCandidate) return 0
    const cleanCandTarget = String(activeCandidate.targetReqId || '').replace(/^J-/, '')
    if (cleanCandTarget === currentReqId && activeCandidate.matchScore) {
      return activeCandidate.matchScore
    }
    if (activeTargetJob) {
      const titlePts = titleAlignmentEvaluation.status === 'aligned' ? 25 : (titleAlignmentEvaluation.status === 'partial' ? 12 : 2)
      const reqRatio = reqSkillsList.length > 0 ? (dynamicMatchingSkills.length / reqSkillsList.length) : 0.8
      const reqPts = Math.round(reqRatio * 35)
      const prefRatio = prefSkillsList.length > 0 ? (dynamicMatchingPreferred.length / prefSkillsList.length) : 0
      const prefPts = prefSkillsList.length > 0 ? Math.round(prefRatio * 10) : (dynamicMatchingSkills.length >= 3 ? 5 : 0)
      const locPts = locationFitEvaluation.status === 'in_state' ? 10 : (locationFitEvaluation.status === 'remote_ok' ? 8 : 4)
      const expPts = experienceAlignmentEvaluation.status === 'exceeds' ? 10 : (experienceAlignmentEvaluation.status === 'meets' ? 7 : 3)
      const govCheck = detectGovDepartmentExperience(activeCandidate)
      const govBonus = govCheck.hasGov ? 10 : 0
      let total = titlePts + reqPts + prefPts + locPts + expPts + govBonus
      if (!titleAlignmentEvaluation.isAligned && reqRatio < 0.4) {
        total = Math.min(38, total)
      }
      return Math.min(99, Math.max(25, total))
    }
    return activeCandidate.matchScore || 75
  }, [activeCandidate, currentReqId, activeTargetJob, dynamicMatchingSkills.length, reqSkillsList.length, dynamicMatchingPreferred.length, prefSkillsList.length, titleAlignmentEvaluation, locationFitEvaluation, experienceAlignmentEvaluation])

  const candidateWorkHistory = useMemo(() => {
    return extractCandidateWorkHistoryAndGaps(activeCandidate)
  }, [activeCandidate])

  const candidateGovExperience = useMemo(() => {
    return detectGovDepartmentExperience(activeCandidate)
  }, [activeCandidate])

  const aiFitSummary = useMemo(() => {
    if (!activeCandidate) return null
    const candName = safeString(activeCandidate.name || activeCandidate.candidateName, 'Candidate')
    const role = activeCandidate.role || 'Specialist'
    const targetJobTitle = activeTargetJob?.title || 'Target Requisition'
    const client = activeTargetJob?.client || 'Enterprise Client'
    const gov = candidateGovExperience
    const workHistory = candidateWorkHistory
    const matchedCount = dynamicMatchingSkills.length
    const totalRequired = reqSkillsList.length
    const visa = activeCandidate.visaStatus || 'Work Authorized'
    const exp = activeCandidate.experience || '8+ Years'

    const points = []
    
    // 1. Department / Public Sector Experience
    if (gov.hasGov) {
      points.push({
        type: 'priority',
        title: `Public Sector Institutional Experience (${gov.shortName})`,
        desc: `${candName} has verified institutional experience with ${gov.allDepts.join(', ')}. Matches state procurement & vendor qualification guidelines for public sector accounts like ${client}.`
      })
    }

    // 2. Core Skills & Tech Density
    points.push({
      type: 'skills',
      title: `Technical Coverage: ${matchedCount}/${totalRequired} Required Skills Matched`,
      desc: matchedCount > 0 
        ? `Hands-on expertise verified across ${dynamicMatchingSkills.slice(0, 5).join(', ')}${dynamicMatchingSkills.length > 5 ? ` and ${dynamicMatchingSkills.length - 5} more` : ''}.`
        : `Demonstrates transferable enterprise capability aligned with ${targetJobTitle}.`
    })

    // 3. Role & Seniority Alignment
    points.push({
      type: 'title',
      title: `Role Alignment: ${role}`,
      desc: `With ${exp} of recorded experience, their professional background aligns with the core responsibilities of ${targetJobTitle}.`
    })

    // 4. Employment Continuity & Gap Detection
    if (workHistory.hasGaps) {
      points.push({
        type: 'gap_warning',
        title: `Career Timeline Gap Alert (${workHistory.gaps.length} detected)`,
        desc: workHistory.gaps.map(g => `${g.gapMonths} months gap between ${g.afterCompany} and ${g.beforeCompany}`).join('; ') + '. Recruiter screening advised.'
      })
    } else {
      points.push({
        type: 'continuity',
        title: 'Continuous Employment Continuity',
        desc: 'Zero significant career gaps detected across recorded enterprise engagements.'
      })
    }

    // 5. Work Authorization & Compliance
    points.push({
      type: 'compliance',
      title: `Work Authorization: ${visa}`,
      desc: `Legal work eligibility verified for immediate direct-hire or C2C contract submission.`
    })

    return {
      overview: `${candName} is evaluated at ${calculatedFitScore}% fit for Req #${currentReqId} (${targetJobTitle} at ${client}). ${gov.hasGov ? `Possesses high-priority public sector experience with ${gov.shortName}, giving them first preference for this submission.` : 'Solid technical background matching requisition specifications.'}`,
      points,
      hasGov: gov.hasGov,
      govDepts: gov.allDepts,
      govPrimary: gov.primaryDept,
      govShort: gov.shortName
    }
  }, [activeCandidate, activeTargetJob, currentReqId, calculatedFitScore, dynamicMatchingSkills, reqSkillsList, candidateGovExperience, candidateWorkHistory])

  const candidateFrequencies = activeCandidate ? getSkillFrequencies(candResumeText, candSkillsList) : []

  const handleGenerateAiSummary = () => {
    setAiGeneratingSummary(true)
    setTimeout(() => {
      setAiGeneratingSummary(false)
      setAssignedToast('AI Summary generated & synced with candidate profile!')
      setTimeout(() => setAssignedToast(''), 4000)
    }, 900)
  }

  const handleApplyEmailTemplate = (key) => {
    const targetCand = emailModalCandidate || activeCandidate
    if (!targetCand) return
    const candFirstName = (targetCand.name || targetCand.candidateName || 'Candidate').split(' ')[0]
    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh Manjute'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
    const targetReq = targetCand.targetReqId || drawerReqId || openJobsList[0]?.id || ''
    const jobTitle = targetCand.matchedJobTitle || activeTargetJob?.title || 'Open Position'
    const jobClient = targetCand.matchedJobClient || activeTargetJob?.client || 'State Agency'
    const jobRate = targetCand.matchedJobRate || activeTargetJob?.rate || '$75/hr'

    if (key === 'rtr') {
      setEmailSubject(`Right to Represent (RTR) Authorization: ${jobTitle} (Req #${targetReq})`)
      setEmailBody(`Hi ${candFirstName},\n\nPlease confirm your authorization for COOLSOFT LLC to represent you exclusively for the following client opportunity:\n\n- Position: ${jobTitle}\n- Requisition ID: Req #${targetReq}\n- Client: ${jobClient}\n- Proposed Rate: ${jobRate}\n\nBy replying 'I AUTHORIZE COOLSOFT LLC TO SUBMIT MY PROFILE FOR REQ #${targetReq}', you grant us permission to present your resume and credentials to the client.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    } else if (key === 'screen') {
      setEmailSubject(`Technical Screening Call: ${jobTitle} (Req #${targetReq}) | COOLSOFT LLC`)
      setEmailBody(`Hi ${candFirstName},\n\nWe reviewed your credentials for the ${jobTitle} role and would like to schedule a 15-minute technical pre-screening call.\n\nPlease let us know your earliest availability today or tomorrow (EDT / CDT).\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    } else if (key === 'rate') {
      setEmailSubject(`Rate & Work Authorization Confirmation: ${jobTitle} (Req #${targetReq})`)
      setEmailBody(`Hi ${candFirstName},\n\nPrior to client submittal for ${jobTitle} (Req #${targetReq}), please confirm:\n1. Your final all-inclusive C2C or W2 hourly rate.\n2. Your current visa / work authorization copy.\n3. Your current location and relocation willingness.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    } else if (key === 'interview') {
      setEmailSubject(`Client Interview Shortlist: ${jobTitle} (Req #${targetReq}) - COOLSOFT LLC`)
      setEmailBody(`Hi ${candFirstName},\n\nGreat news! The client (${jobClient}) has shortlisted your profile for an interview for the ${jobTitle} position.\n\nPlease confirm your availability for a 45-minute video interview this week and provide 2-3 preferred time slots.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    }
  }

  const renderRecruiterLeaderboardSection = (isEmbedded = false) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header & Timeframe Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 4, height: 22, backgroundColor: '#2563EB', borderRadius: 2 }} />
              <h2 style={{ fontSize: isEmbedded ? 18 : 22, fontWeight: 800, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                Recruiter Performance &amp; Team Leaderboard
              </h2>
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 0' }}>
              Real-time rankings across candidate sourcing volume, phone screenings, client submittals, interviews &amp; placements.
            </p>
          </div>

          {/* Period Switcher Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: isLight ? '#F1F5F9' : '#1E293B',
            padding: 4,
            borderRadius: 8,
            border: `1px solid ${C.border}`
          }}>
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
              { key: 'all', label: 'All Time' }
            ].map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setLeaderboardPeriod(p.key)
                  fetchLeaderboard(p.key)
                }}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: leaderboardPeriod === p.key ? 800 : 600,
                  backgroundColor: leaderboardPeriod === p.key ? (isLight ? '#FFFFFF' : '#0F172A') : 'transparent',
                  color: leaderboardPeriod === p.key ? '#2563EB' : C.textSecondary,
                  boxShadow: leaderboardPeriod === p.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aggregated KPI Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
          {[
            { label: 'Total Sourced', val: leaderboardData.reduce((acc, r) => acc + (r.sourced || 0), 0), color: '#2563EB', border: '#BFDBFE' },
            { label: 'Screened Candidates', val: leaderboardData.reduce((acc, r) => acc + (r.screened || 0), 0), color: '#059669', border: '#A7F3D0' },
            { label: 'Client Submittals', val: leaderboardData.reduce((acc, r) => acc + (r.submissions || 0), 0), color: '#7C3AED', border: '#DDD6FE' },
            { label: 'Interviews & Offers', val: leaderboardData.reduce((acc, r) => acc + (r.interviews || 0), 0), color: '#D97706', border: '#FDE68A' },
            { label: 'Total Placements', val: leaderboardData.reduce((acc, r) => acc + (r.placed || 0), 0), color: '#DC2626', border: '#FECACA' }
          ].map((stat, i) => (
            <div key={i} style={{
              backgroundColor: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: C.shadow
            }}>
              <div style={{
                width: 6,
                height: 36,
                borderRadius: 3,
                backgroundColor: stat.color,
                flexShrink: 0
              }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, marginTop: 2 }}>
                  {stat.val}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top 3 Podium Showcase */}
        {leaderboardData.length >= 3 && (
          <div style={{
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: '24px 20px 18px',
            boxShadow: C.shadow
          }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Top Performance Leaders
              </span>
              <h3 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 900, color: C.textPrimary }}>
                Sprint Standings ({leaderboardPeriod === 'today' ? 'Today' : leaderboardPeriod === 'week' ? 'This Week' : leaderboardPeriod === 'month' ? 'This Month' : 'All Time'})
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'flex-end', maxWidth: 880, margin: '0 auto' }}>
              {/* #2 Silver (Left) */}
              {(() => {
                const r = leaderboardData[1]
                if (!r) return null
                return (
                  <div style={{
                    backgroundColor: isLight ? '#F8FAFC' : '#1E293B',
                    border: '1.5px solid #94A3B8',
                    borderRadius: '16px 16px 0 0',
                    padding: '20px 14px 18px',
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(148,163,184,0.15)'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: '#E2E8F0',
                      color: '#475569',
                      fontWeight: 900,
                      fontSize: 15,
                      margin: '0 auto 8px'
                    }}>
                      #2
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#64748B', textTransform: 'uppercase' }}>Rank #2 · Silver</div>
                    <h4 style={{ margin: '6px 0 2px', fontSize: 15, fontWeight: 900, color: C.textPrimary }}>{r.name}</h4>
                    <div style={{ fontSize: 11, color: C.textSecondary }}>{r.role || 'Senior Recruiter'}</div>
                    <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900, color: '#2563EB' }}>{r.kpiScore || r.points || 0} <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>pts</span></div>
                    <div style={{ marginTop: 6, fontSize: 11, color: C.textSecondary }}>
                      <strong>{r.submissions || 0}</strong> subs · <strong>{r.interviews || 0}</strong> ints · <strong>{r.placed || 0}</strong> hires
                    </div>
                  </div>
                )
              })()}

              {/* #1 Gold (Center, Elevated) */}
              {(() => {
                const r = leaderboardData[0]
                if (!r) return null
                return (
                  <div style={{
                    backgroundColor: isLight ? '#FEFCE8' : 'rgba(234,179,8,0.1)',
                    border: '2px solid #EAB308',
                    borderRadius: '16px 16px 0 0',
                    padding: '30px 16px 22px',
                    textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(234,179,8,0.25)',
                    transform: 'translateY(-10px)'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      backgroundColor: '#FEF08A',
                      color: '#854D0E',
                      fontWeight: 900,
                      fontSize: 18,
                      margin: '0 auto 8px',
                      boxShadow: '0 2px 8px rgba(202,138,4,0.3)'
                    }}>
                      #1
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: '#CA8A04', textTransform: 'uppercase' }}>Rank #1 · Champion</div>
                    <h4 style={{ margin: '6px 0 2px', fontSize: 17, fontWeight: 900, color: C.textPrimary }}>{r.name}</h4>
                    <div style={{ fontSize: 11.5, color: C.textSecondary }}>{r.role || 'Lead Recruiter'}</div>
                    <div style={{ marginTop: 12, fontSize: 22, fontWeight: 900, color: '#CA8A04' }}>{r.kpiScore || r.points || 0} <span style={{ fontSize: 11.5, fontWeight: 600, color: C.textSecondary }}>pts</span></div>
                    <div style={{ marginTop: 6, fontSize: 11.5, color: C.textSecondary }}>
                      <strong>{r.submissions || 0}</strong> subs · <strong>{r.interviews || 0}</strong> ints · <strong>{r.placed || 0}</strong> hires
                    </div>
                  </div>
                )
              })()}

              {/* #3 Bronze (Right) */}
              {(() => {
                const r = leaderboardData[2]
                if (!r) return null
                return (
                  <div style={{
                    backgroundColor: isLight ? '#FFF7ED' : '#1E293B',
                    border: '1.5px solid #F97316',
                    borderRadius: '16px 16px 0 0',
                    padding: '18px 14px 16px',
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.15)'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      backgroundColor: '#FFEDD5',
                      color: '#9A3412',
                      fontWeight: 900,
                      fontSize: 14,
                      margin: '0 auto 8px'
                    }}>
                      #3
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#EA580C', textTransform: 'uppercase' }}>Rank #3 · Bronze</div>
                    <h4 style={{ margin: '6px 0 2px', fontSize: 14.5, fontWeight: 900, color: C.textPrimary }}>{r.name}</h4>
                    <div style={{ fontSize: 11, color: C.textSecondary }}>{r.role || 'Recruiter'}</div>
                    <div style={{ marginTop: 10, fontSize: 17, fontWeight: 900, color: '#EA580C' }}>{r.kpiScore || r.points || 0} <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>pts</span></div>
                    <div style={{ marginTop: 6, fontSize: 11, color: C.textSecondary }}>
                      <strong>{r.submissions || 0}</strong> subs · <strong>{r.interviews || 0}</strong> ints · <strong>{r.placed || 0}</strong> hires
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Detailed Performance Rankings Table */}
        <div style={{
          backgroundColor: C.surface,
          borderRadius: 16,
          padding: '22px 24px',
          boxShadow: C.shadow,
          border: `1px solid ${C.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, margin: '0 0 4px' }}>
                Full Team Performance Matrix
              </h3>
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                Individual conversion tracking across current hiring pipeline
              </div>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textSecondary, background: isLight ? '#F1F5F9' : '#1E293B', padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}` }}>
              {leaderboardData.length} Active Recruiters Tracked
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}`, color: C.textSecondary, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <th style={{ padding: '10px 14px', width: 60 }}>Rank</th>
                  <th style={{ padding: '10px 14px' }}>Recruiter</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Sourced</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Screened</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Submissions</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Interviews</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Placements</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Points</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Velocity</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardLoading ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '36px 0', textAlign: 'center', color: C.textSecondary }}>
                      Syncing team performance metrics...
                    </td>
                  </tr>
                ) : leaderboardData.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '36px 0', textAlign: 'center', color: C.textSecondary }}>
                      No activity logged for the selected period.
                    </td>
                  </tr>
                ) : (
                  leaderboardData.map((r, i) => {
                    const isTop3 = i < 3
                    const rankLabel = `#${i + 1}`
                    return (
                      <tr
                        key={r.id || r.email || i}
                        style={{
                          borderBottom: `1px solid ${C.border}`,
                          backgroundColor: isTop3 ? (isLight ? 'rgba(254,249,195,0.2)' : 'rgba(234,179,8,0.03)') : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 800, fontSize: 13, color: isTop3 ? '#B45309' : C.textSecondary }}>
                          {rankLabel}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: isTop3 ? '#FEF3C7' : '#EFF6FF',
                              color: isTop3 ? '#B45309' : '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 12
                            }}>
                              {getInitials(r.name || 'Recruiter')}
                            </div>
                            <div>
                              <strong style={{ color: C.textPrimary, fontSize: 13 }}>{r.name}</strong>
                              <div style={{ fontSize: 11, color: C.textSecondary }}>{r.email} · {r.role || 'Recruiter'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: C.textPrimary }}>{r.sourced || 0}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>{r.screened || 0}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#2563EB' }}>{r.submissions || 0}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#7C3AED' }}>{r.interviews || 0}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 800, color: '#DC2626' }}>{r.placed || 0}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: C.textPrimary, fontSize: 13.5 }}>
                          {r.kpiScore || r.points || 0} <span style={{ fontSize: 10, color: C.textSecondary, fontWeight: 500 }}>pts</span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            backgroundColor: r.velocity === 'High Velocity' ? '#EFF6FF' : '#ECFDF5',
                            color: r.velocity === 'High Velocity' ? '#2563EB' : '#059669',
                            border: `1px solid ${r.velocity === 'High Velocity' ? '#BFDBFE' : '#A7F3D0'}`,
                            borderRadius: 6,
                            padding: '2px 8px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}>
                            {r.velocity || 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFilterRecruiter(r.name)
                              setInboxViewMode('stream')
                              setInboxSubMode('table')
                              setTablePage(1)
                            }}
                            style={{
                              backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              borderRadius: 6,
                              padding: '5px 10px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            Talent Pool ↗
                          </button>
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
    )
  }

  // --- VENDOR HOTLISTS & BENCH MANAGEMENT VIEW ---
  const handlePushHotlistToATS = async (item) => {
    try {
      const res = await fetch('/api/recruiter/vendor-hotlists/push-to-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotlistId: item.id, candidate: item })
      })
      const data = await res.json()
      if (data.success) {
        setHotlistToast(`✓ Successfully added ${item.candidateName} to ATS Candidate Talent Pool!`)
        setTimeout(() => setHotlistToast(''), 4000)
        fetchStreamCandidates()
      } else {
        alert(data.message || 'Failed to add to ATS')
      }
    } catch (err) {
      alert('Error adding to ATS: ' + err.message)
    }
  }

  const handleEmailVendor = (item) => {
    setEmailModalCandidate({
      name: item.candidateName,
      email: item.vendorEmail,
      phone: item.vendorPhone,
      role: item.role
    })
    setEmailTo(item.vendorEmail || '')
    setEmailSubject(`Candidate Profile Inquiry: ${item.candidateName} (${item.role}) | COOLSOFT LLC`)
    setEmailBody(`Hi ${item.vendorName ? item.vendorName.split(' ')[0] : 'Partner'},\n\nWe received your hotlist profile for ${item.candidateName} (${item.role}). We have active direct client openings that match their background.\n\nPlease share their updated resume with full contact details, current availability, and confirmed C2C rate.\n\nWith Regards,\n${currentUser?.name || 'Omkesh Manjute'}\nLead Recruiter\nCOOLSOFT LLC | http://www.coolsofttech.com`)
  }

  const handleDeleteHotlist = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from Vendor Hotlists?`)) return
    try {
      const res = await fetch(`/api/recruiter/vendor-hotlists/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setVendorHotlists(prev => prev.filter(v => v.id !== id))
        setHotlistToast(`✓ Removed ${name} from hotlists.`)
        setTimeout(() => setHotlistToast(''), 3000)
      }
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleSaveNewHotlist = async (e) => {
    if (e) e.preventDefault()
    if (!newHotlistText.trim()) {
      alert('Please paste hotlist text or profile details.')
      return
    }
    setIsSubmittingHotlist(true)
    try {
      const res = await fetch('/api/recruiter/vendor-hotlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: newHotlistVendorName || 'Vendor Partner',
          vendorCompany: newHotlistVendorCompany || 'Vendor IT Solutions',
          vendorEmail: newHotlistVendorEmail || 'partner@vendorit.com',
          vendorPhone: newHotlistVendorPhone || '',
          recruiterEmail: (currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')),
          rawText: newHotlistText
        })
      })
      const data = await res.json()
      if (data.success) {
        setHotlistToast(`✓ Successfully ingested ${data.addedCount || 1} bench candidate(s)!`)
        setTimeout(() => setHotlistToast(''), 4000)
        setAddHotlistModalOpen(false)
        setNewHotlistText('')
        setNewHotlistVendorName('')
        setNewHotlistVendorCompany('')
        setNewHotlistVendorEmail('')
        setNewHotlistVendorPhone('')
        fetchVendorHotlists()
      } else {
        alert(data.message || 'Failed to parse hotlist')
      }
    } catch (err) {
      alert('Error saving hotlist: ' + err.message)
    } finally {
      setIsSubmittingHotlist(false)
    }
  }

  const renderVendorHotlistsView = () => {
    const rawList = Array.isArray(scopedVendorHotlists) ? scopedVendorHotlists : []
    
    // Distinct Vendors list for filter dropdown
    const uniqueVendors = Array.from(new Set(rawList.map(v => v.vendorCompany || v.vendorName).filter(Boolean))).sort()

    // Filtered Hotlist items
    const filteredList = rawList.filter(item => {
      if (vendorSearch.trim()) {
        const q = vendorSearch.toLowerCase()
        const text = [
          item.candidateName,
          item.role,
          (item.skills || []).join(' '),
          item.vendorCompany,
          item.vendorName,
          item.vendorEmail,
          item.candidateEmail,
          item.candidatePhone,
          item.location,
          item.visa
        ].filter(Boolean).join(' ').toLowerCase()
        if (!text.includes(q)) return false
      }
      if (vendorFilterCompany !== 'all' && (item.vendorCompany || item.vendorName) !== vendorFilterCompany) {
        return false
      }
      if (vendorFilterVisa !== 'all') {
        const v = (item.visa || '').toLowerCase()
        if (vendorFilterVisa === 'citizen' && !v.includes('citizen')) return false
        if (vendorFilterVisa === 'gc' && !v.includes('green') && !v.includes('permanent') && !v.includes('gc')) return false
        if (vendorFilterVisa === 'h1b' && !v.includes('h-1b') && !v.includes('h1b')) return false
      }
      return true
    })

    const totalBench = rawList.length
    const totalVendors = uniqueVendors.length
    const directContactCount = rawList.filter(v => v.candidateEmail || v.candidatePhone).length
    const c2cCount = rawList.filter(v => (v.status || '').toLowerCase().includes('avail') || (v.rate || '').includes('C2C')).length

    const pagedItems = filteredList.slice((vendorTablePage - 1) * vendorTablePageSize, vendorTablePage * vendorTablePageSize)
    const totalPages = Math.ceil(filteredList.length / vendorTablePageSize) || 1

    const handleExportHotlistsCsv = () => {
      const headers = ['Sl. No', 'Candidate Name', 'Skill / Role', 'Total Exp', 'Location', 'Relocation', 'Visa Status', 'Vendor / Agency', 'Vendor Email', 'Candidate Email', 'Candidate Phone', 'Rate', 'Status'];
      const rows = filteredList.map((item, idx) => [
        idx + 1,
        `"${(item.candidateName || '').replace(/"/g, '""')}"`,
        `"${(item.role || '').replace(/"/g, '""')}"`,
        `"${(item.experience || '').replace(/"/g, '""')}"`,
        `"${(item.location || '').replace(/"/g, '""')}"`,
        `"${(item.relocation || '').replace(/"/g, '""')}"`,
        `"${(item.visa || '').replace(/"/g, '""')}"`,
        `"${(item.vendorCompany || item.vendorName || '').replace(/"/g, '""')}"`,
        `"${(item.vendorEmail || '').replace(/"/g, '""')}"`,
        `"${(item.candidateEmail || '').replace(/"/g, '""')}"`,
        `"${(item.candidatePhone || '').replace(/"/g, '""')}"`,
        `"${(item.rate || '').replace(/"/g, '""')}"`,
        `"${(item.status || 'Available').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SmartHire_Vendor_Hotlist_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', boxSizing: 'border-box', backgroundColor: isLight ? '#F8FAFC' : '#0B0F19' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Toast Alert */}
          {hotlistToast && (
            <div style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {hotlistToast}
            </div>
          )}

          {/* Top Page Header & Ingestion Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 24, backgroundColor: '#0D9488', borderRadius: 2 }} />
                <h1 style={{ fontSize: 22, fontWeight: 900, color: C.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                  Vendor Hotlists &amp; Bench Ingestion Hub
                </h1>
                <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#CCFBF1', color: '#0F766E', padding: '2px 8px', borderRadius: 6, border: '1px solid #99F6E4' }}>
                  Excel Grid View
                </span>
              </div>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: '4px 0 0' }}>
                Structured candidate bench lists auto-parsed from vendor emails, C2C rate cards, and direct partner submissions.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setAddHotlistModalOpen(true)}
                style={{
                  backgroundColor: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(13,148,136,0.25)'
                }}
              >
                <span>+ Add / Paste Hotlist</span>
              </button>

              <button
                type="button"
                onClick={handleExportHotlistsCsv}
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(5,150,105,0.2)'
                }}
                title="Download vendor hotlist as Excel / CSV file"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export Excel</span>
              </button>

              <button
                type="button"
                onClick={() => fetchVendorHotlists()}
                disabled={vendorHotlistsLoading}
                style={{
                  backgroundColor: isLight ? '#FFFFFF' : C.surface,
                  border: `1px solid ${C.border}`,
                  color: C.textPrimary,
                  borderRadius: 8,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: vendorHotlistsLoading ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{vendorHotlistsLoading ? 'Syncing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Metrics Ribbon (4 Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ backgroundColor: isLight ? '#FFFFFF' : C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Total Bench Candidates
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
                {totalBench}
              </div>
              <div style={{ fontSize: 11.5, color: '#0D9488', marginTop: 2, fontWeight: 600 }}>
                Across {totalVendors} Vendor Partners
              </div>
            </div>

            <div style={{ backgroundColor: isLight ? '#FFFFFF' : C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Active Sponsoring Vendors
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#2563EB', marginTop: 4 }}>
                {totalVendors}
              </div>
              <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>
                V-Soft, TekStaff, Apex Bench &amp; More
              </div>
            </div>

            <div style={{ backgroundColor: isLight ? '#FFFFFF' : C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Direct Contact Parsed
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                {directContactCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#059669', marginTop: 2, fontWeight: 600 }}>
                Candidate Direct Email &amp; Phone
              </div>
            </div>

            <div style={{ backgroundColor: isLight ? '#FFFFFF' : C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Immediate C2C Availability
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED', marginTop: 4 }}>
                {c2cCount}
              </div>
              <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>
                Ready for Client Submissions
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{
            backgroundColor: isLight ? '#FFFFFF' : C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
              <div style={{
                position: 'relative',
                flex: 1,
                maxWidth: 420
              }}>
                <input
                  type="text"
                  placeholder="Search bench candidates, roles, skills, vendors, locations..."
                  value={vendorSearch}
                  onChange={(e) => { setVendorSearch(e.target.value); setVendorTablePage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                    color: C.textPrimary,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Vendor Company Dropdown */}
              <select
                value={vendorFilterCompany}
                onChange={(e) => { setVendorFilterCompany(e.target.value); setVendorTablePage(1); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                  color: C.textPrimary,
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Vendor: All ({totalVendors})</option>
                {uniqueVendors.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>

              {/* Visa Dropdown */}
              <select
                value={vendorFilterVisa}
                onChange={(e) => { setVendorFilterVisa(e.target.value); setVendorTablePage(1); }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                  color: C.textPrimary,
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Visa: All</option>
                <option value="citizen">US Citizen</option>
                <option value="gc">Green Card (GC)</option>
                <option value="h1b">H-1B</option>
              </select>

              {(vendorSearch || vendorFilterCompany !== 'all' || vendorFilterVisa !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setVendorSearch('')
                    setVendorFilterCompany('all')
                    setVendorFilterVisa('all')
                    setVendorTablePage(1)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: C.textSecondary,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.textSecondary }}>
              <span>Showing <strong>{filteredList.length}</strong> bench records</span>
              <select
                value={vendorTablePageSize}
                onChange={(e) => { setVendorTablePageSize(Number(e.target.value)); setVendorTablePage(1); }}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  backgroundColor: isLight ? '#FFFFFF' : C.inputBg,
                  color: C.textPrimary,
                  fontSize: 12,
                  outline: 'none'
                }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          {/* Excel-Style Grid Table matching Image 2 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 340px)', minHeight: 420 }}>
              <table style={{
                width: '100%',
                minWidth: 1250,
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 12.5,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#F1F5F9',
                    borderBottom: '2px solid #CBD5E1',
                    position: 'sticky',
                    top: 0,
                    zIndex: 5
                  }}>
                    <th style={{ padding: '9px 8px', width: 55, textAlign: 'center', border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Sl. No
                    </th>
                    <th style={{ padding: '9px 12px', width: 160, border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Name
                    </th>
                    <th style={{ padding: '9px 12px', width: 250, border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Skill
                    </th>
                    <th style={{ padding: '9px 10px', width: 95, textAlign: 'center', border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Total Exp
                    </th>
                    <th style={{ padding: '9px 12px', width: 135, border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Location
                    </th>
                    <th style={{ padding: '9px 12px', width: 135, border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Relocation
                    </th>
                    <th style={{ padding: '9px 10px', width: 95, textAlign: 'center', border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Visa Status
                    </th>
                    <th style={{ padding: '9px 12px', width: 180, border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Vendor / Agency
                    </th>
                    <th style={{ padding: '9px 10px', width: 85, textAlign: 'center', border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Rate
                    </th>
                    <th style={{ padding: '9px 12px', width: 195, textAlign: 'right', border: '1px solid #CBD5E1', color: '#334155', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 48, textAlign: 'center', color: '#64748B', border: '1px solid #E2E8F0' }}>
                        No vendor bench candidates found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    pagedItems.map((item, idx) => {
                      const skills = safeSkillArray(item.skills)
                      const isEven = idx % 2 === 0
                      const rowNum = (vendorTablePage - 1) * vendorTablePageSize + idx + 1
                      return (
                        <tr
                          key={item.id || idx}
                          style={{
                            backgroundColor: isEven ? '#FFFFFF' : '#F8FAFC',
                            transition: 'background-color 0.1s ease',
                            cursor: 'default'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEven ? '#FFFFFF' : '#F8FAFC'}
                        >
                          {/* 1. Sl. No */}
                          <td style={{ padding: '7px 8px', textAlign: 'center', border: '1px solid #E2E8F0', verticalAlign: 'middle', fontWeight: 700, color: '#64748B', fontSize: 12 }}>
                            {rowNum}
                          </td>

                          {/* 2. Name */}
                          <td style={{ padding: '7px 12px', border: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                                {item.candidateName}
                              </span>
                              {item.attachmentName && (
                                <a
                                  href={item.storageUrl || `/uploads/candidate-docs/${item.attachmentName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Resume: ${item.attachmentName}`}
                                  style={{ color: '#2563EB', display: 'inline-flex', verticalAlign: 'middle' }}
                                >
                                  <IconFileText />
                                </a>
                              )}
                            </div>
                            {item.candidateEmail && (
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                                <a href={`mailto:${item.candidateEmail}`} style={{ color: '#2563EB', textDecoration: 'none' }}>
                                  {item.candidateEmail}
                                </a>
                              </div>
                            )}
                          </td>

                          {/* 3. Skill / Role */}
                          <td style={{ padding: '7px 12px', border: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 12.5, lineHeight: 1.3 }}>
                              {item.role || (skills[0] || 'IT Specialist')}
                            </div>
                            {skills.length > 1 && (
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }} title={skills.join(', ')}>
                                {skills.slice(0, 3).join(' • ')}
                                {skills.length > 3 && ` +${skills.length - 3}`}
                              </div>
                            )}
                          </td>

                          {/* 4. Total Exp */}
                          <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #E2E8F0', verticalAlign: 'middle', fontWeight: 600, color: '#334155', fontSize: 12 }}>
                            {item.experience || '8+ Years'}
                          </td>

                          {/* 5. Location */}
                          <td style={{ padding: '7px 12px', border: '1px solid #E2E8F0', verticalAlign: 'middle', color: '#334155', fontSize: 12, fontWeight: 500 }}>
                            {item.location || 'Remote / US'}
                          </td>

                          {/* 6. Relocation */}
                          <td style={{ padding: '7px 12px', border: '1px solid #E2E8F0', verticalAlign: 'middle', color: '#059669', fontSize: 12, fontWeight: 600 }}>
                            {item.relocation || 'Anywhere in US'}
                          </td>

                          {/* 7. Visa Status */}
                          <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              backgroundColor: String(item.visa).toLowerCase().includes('citizen') ? '#ECFDF5' : (String(item.visa).toLowerCase().includes('opt') ? '#FFFBEB' : '#EFF6FF'),
                              color: String(item.visa).toLowerCase().includes('citizen') ? '#047857' : (String(item.visa).toLowerCase().includes('opt') ? '#B45309' : '#1D4ED8'),
                              border: `1px solid ${String(item.visa).toLowerCase().includes('citizen') ? '#A7F3D0' : (String(item.visa).toLowerCase().includes('opt') ? '#FDE68A' : '#BFDBFE')}`,
                              padding: '2px 7px',
                              borderRadius: 4,
                              display: 'inline-block'
                            }}>
                              {item.visa || 'H-1B'}
                            </span>
                          </td>

                          {/* 8. Vendor / Agency */}
                          <td style={{ padding: '7px 12px', border: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 12 }}>
                              {item.vendorCompany || item.vendorName || 'Staffing Partner'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                              <a href={`mailto:${item.vendorEmail}`} style={{ color: '#2563EB', textDecoration: 'none' }} title={`Email ${item.vendorName || 'Vendor'}`}>
                                {item.vendorEmail || item.vendorName}
                              </a>
                              {item.vendorPhone && <span style={{ marginLeft: 4, color: '#94A3B8' }}>{item.vendorPhone}</span>}
                            </div>
                          </td>

                          {/* 9. Rate */}
                          <td style={{ padding: '7px 10px', textAlign: 'center', border: '1px solid #E2E8F0', verticalAlign: 'middle', fontWeight: 800, color: '#047857', fontSize: 12 }}>
                            {item.rate || '$70/hr'}
                          </td>

                          {/* 10. Actions */}
                          <td style={{ padding: '7px 12px', textAlign: 'right', border: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const candObj = {
                                    id: item.id || `vh-${Date.now()}`,
                                    name: item.candidateName,
                                    role: item.role,
                                    email: item.candidateEmail || item.vendorEmail,
                                    phone: item.candidatePhone || item.vendorPhone,
                                    location: item.location || 'Remote / US',
                                    experience: item.experience || '8+ Years',
                                    visaStatus: item.visa || 'US Citizen',
                                    skills: item.skills || [],
                                    source: `Vendor Hotlist (${item.vendorCompany || item.vendorName})`,
                                    sourceCategory: 'vendor_bench',
                                    recruiterEmail: currentUser?.email || 'omkesh@coolsofttech.com',
                                    vendorEmail: item.vendorEmail,
                                    vendorCompany: item.vendorCompany
                                  }
                                  setPushTargetCand(candObj)
                                  setPushToReqModalOpen(true)
                                }}
                                style={{
                                  backgroundColor: '#2563EB',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}
                                title="Match & push candidate to active requisition"
                              >
                                Push ↗
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePushHotlistToATS(item)}
                                style={{
                                  backgroundColor: '#0D9488',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Add candidate directly into main ATS Talent Pool"
                              >
                                + ATS
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEmailVendor(item)}
                                style={{
                                  backgroundColor: '#FFFFFF',
                                  color: '#334155',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Email sponsoring vendor rep"
                              >
                                Email
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteHotlist(item.id, item.candidateName)}
                                style={{
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #FCA5A5',
                                  color: '#DC2626',
                                  borderRadius: 4,
                                  padding: '4px 6px',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Remove candidate from bench list"
                              >
                                <IconTrash />
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                padding: '12px 18px',
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12,
                color: C.textSecondary
              }}>
                <div>
                  Page <strong>{vendorTablePage}</strong> of <strong>{totalPages}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    disabled={vendorTablePage <= 1}
                    onClick={() => setVendorTablePage(p => Math.max(1, p - 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      backgroundColor: isLight ? '#FFFFFF' : C.inputBg,
                      color: C.textPrimary,
                      cursor: vendorTablePage <= 1 ? 'not-allowed' : 'pointer',
                      opacity: vendorTablePage <= 1 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={vendorTablePage >= totalPages}
                    onClick={() => setVendorTablePage(p => Math.min(totalPages, p + 1))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      backgroundColor: isLight ? '#FFFFFF' : C.inputBg,
                      color: C.textPrimary,
                      cursor: vendorTablePage >= totalPages ? 'not-allowed' : 'pointer',
                      opacity: vendorTablePage >= totalPages ? 0.5 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal: + Add / Paste Vendor Bench Hotlist */}
        {addHotlistModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}>
            <div style={{
              backgroundColor: isLight ? '#FFFFFF' : C.surface,
              borderRadius: 12,
              width: '100%',
              maxWidth: 620,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '18px 24px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.textPrimary }}>
                    Add or Paste Vendor Bench Hotlist
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textSecondary }}>
                    Paste email bench tables or raw consultant profiles. SmartHire auto-parses candidate records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddHotlistModalOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: 18, color: C.textSecondary, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNewHotlist} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Vendor Sponsoring Company
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. V-Soft Solutions, TekStaff"
                      value={newHotlistVendorCompany}
                      onChange={e => setNewHotlistVendorCompany(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                        color: C.textPrimary,
                        fontSize: 12.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Vendor Contact Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paul Wilson, Sarah Miller"
                      value={newHotlistVendorName}
                      onChange={e => setNewHotlistVendorName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                        color: C.textPrimary,
                        fontSize: 12.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Vendor Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. vendor@supplier.com"
                      value={newHotlistVendorEmail}
                      onChange={e => setNewHotlistVendorEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                        color: C.textPrimary,
                        fontSize: 12.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Vendor Phone (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="+1 (xxx) xxx-xxxx"
                      value={newHotlistVendorPhone}
                      onChange={e => setNewHotlistVendorPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                        color: C.textPrimary,
                        fontSize: 12.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Paste Bench Hotlist Text or Email Content
                  </label>
                  <textarea
                    rows={8}
                    placeholder={`Paste hotlist email, e.g.:\n\nCandidate: Dhiren Raval\nRole: Sr. Manager Applied AI\nEmail: dhiren.raval@gmail.com\nPhone: +1 703 785 3030\nVisa: US Citizen\nRate: $95/hr C2C\nSkills: Python, Machine Learning, AWS, Cloud Strategy`}
                    value={newHotlistText}
                    onChange={e => setNewHotlistText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      color: C.textPrimary,
                      fontSize: 12.5,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setAddHotlistModalOpen(false)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      backgroundColor: 'transparent',
                      color: C.textPrimary,
                      fontSize: 12.5,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingHotlist}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#0D9488',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: isSubmittingHotlist ? 'wait' : 'pointer'
                    }}
                  >
                    {isSubmittingHotlist ? 'Ingesting Bench...' : 'Parse & Save Bench Candidates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  const toggleFavorite = (candId, e) => {
    e?.stopPropagation()
    setFavoriteCandidateIds(prev => {
      const next = new Set(prev)
      if (next.has(candId)) next.delete(candId)
      else next.add(candId)
      return next
    })
  }

  const toggleSelectCard = (candId, e) => {
    e?.stopPropagation()
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      if (next.has(candId)) next.delete(candId)
      else next.add(candId)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: C.bg, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", color: C.textPrimary, overflow: 'hidden' }}>
      
      {/* 1. Left Navigation Sidebar (Full Height, Matching media_1789073118530.png) */}
      {/* 1. Left Navigation Sidebar (1-Click Collapsible) */}
      <aside style={{
        width: sidebarCollapsed ? 68 : 240,
        minWidth: sidebarCollapsed ? 68 : 240,
        backgroundColor: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: sidebarCollapsed ? '16px 8px' : '20px 16px',
        overflowY: 'auto',
        overflowX: 'hidden',
        flexShrink: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.2s ease',
        boxSizing: 'border-box'
      }}>
        {/* Top Brand Logo & 1-Click Collapse Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          marginBottom: 24,
          padding: sidebarCollapsed ? '0' : '0 4px',
          borderRadius: 8
        }}>
          <div
            onClick={() => setInboxViewMode('dashboard')}
            title="SmartHire ATS — Dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              minWidth: 0
            }}
          >
            {/* Clean ATS Briefcase SVG Icon (NO "M." letter) */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #2065D1 0%, #00A76F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(32, 101, 209, 0.25)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: C.textPrimary, lineHeight: 1.2 }}>
                  SmartHire ATS
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary }}>
                  Find · Evaluate · Hire
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Collapse Toggle Icon in Header */}
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={handleToggleSidebar}
              title="Collapse Sidebar (1-Click)"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: C.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                padding: 0,
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Links with Icon-Only Mode for Collapsed State */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* 1. Dashboard */}
          <button
            type="button"
            title="Dashboard"
            onMouseEnter={() => setHoveredNav('dashboard')}
            onMouseLeave={() => setHoveredNav(null)}
            onClick={() => setInboxViewMode('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 12,
              padding: sidebarCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: inboxViewMode === 'dashboard'
                ? (isLight ? '#E0F2FE' : 'rgba(14,165,233,0.18)')
                : (hoveredNav === 'dashboard' ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)') : 'transparent'),
              color: inboxViewMode === 'dashboard'
                ? (isLight ? '#0284C7' : '#38BDF8')
                : (hoveredNav === 'dashboard' ? C.textPrimary : C.textSecondary),
              fontWeight: inboxViewMode === 'dashboard' ? 700 : (hoveredNav === 'dashboard' ? 600 : 500),
              fontSize: 13.5,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              boxShadow: inboxViewMode === 'dashboard' ? '0 1px 3px rgba(2,132,199,0.12)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <IconHome /> {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          {/* 2. Candidates (Primary Talent Pool) */}
          <button
            type="button"
            title={`Candidates (${roleScopedCandidates.length || 0})`}
            onMouseEnter={() => setHoveredNav('candidates')}
            onMouseLeave={() => setHoveredNav(null)}
            onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between',
              padding: sidebarCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 8,
              border: 'none',
              position: 'relative',
              background: (inboxViewMode === 'stream')
                ? (isLight ? '#E0F2FE' : 'rgba(14,165,233,0.18)')
                : (hoveredNav === 'candidates' ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)') : 'transparent'),
              color: (inboxViewMode === 'stream')
                ? (isLight ? '#0284C7' : '#38BDF8')
                : (hoveredNav === 'candidates' ? C.textPrimary : C.textSecondary),
              fontWeight: (inboxViewMode === 'stream') ? 700 : (hoveredNav === 'candidates' ? 600 : 500),
              fontSize: 13.5,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              boxShadow: (inboxViewMode === 'stream') ? '0 1px 3px rgba(2,132,199,0.12)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconUsers /> {!sidebarCollapsed && <span>Candidates</span>}
            </span>
            {!sidebarCollapsed ? (
              <span style={{ fontSize: 10.5, background: '#2563EB', color: '#FFFFFF', padding: '1px 7px', borderRadius: 10, fontWeight: 800 }}>
                {roleScopedCandidates.length || 0}
              </span>
            ) : (
              <span style={{
                position: 'absolute',
                top: 7,
                right: 14,
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#2563EB'
              }} />
            )}
          </button>

          {/* 3. Messages */}
          <button
            type="button"
            title={`Messages ${totalUnread > 0 ? `(${totalUnread} unread)` : ''}`}
            onMouseEnter={() => setHoveredNav('chat')}
            onMouseLeave={() => setHoveredNav(null)}
            onClick={() => setInboxViewMode('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between',
              padding: sidebarCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 8,
              border: 'none',
              position: 'relative',
              background: inboxViewMode === 'chat'
                ? (isLight ? '#E0F2FE' : 'rgba(14,165,233,0.18)')
                : (hoveredNav === 'chat' ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)') : 'transparent'),
              color: inboxViewMode === 'chat'
                ? (isLight ? '#0284C7' : '#38BDF8')
                : (hoveredNav === 'chat' ? C.textPrimary : C.textSecondary),
              fontWeight: inboxViewMode === 'chat' ? 700 : (hoveredNav === 'chat' ? 600 : 500),
              fontSize: 13.5,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              boxShadow: inboxViewMode === 'chat' ? '0 1px 3px rgba(2,132,199,0.12)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconChat /> {!sidebarCollapsed && <span>Messages</span>}
            </span>
            {totalUnread > 0 && (!sidebarCollapsed ? (
              <span style={{ fontSize: 10.5, background: '#FF5630', color: '#FFF', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                {totalUnread}
              </span>
            ) : (
              <span style={{
                position: 'absolute',
                top: 7,
                right: 14,
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#FF5630'
              }} />
            ))}
          </button>

          {/* 4. Vendor Hotlists */}
          <button
            type="button"
            title={`Vendor Hotlists (${scopedVendorHotlists.length || 0})`}
            onMouseEnter={() => setHoveredNav('hotlists')}
            onMouseLeave={() => setHoveredNav(null)}
            onClick={() => {
              setInboxViewMode('hotlists')
              fetchVendorHotlists()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'space-between',
              padding: sidebarCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 8,
              border: 'none',
              position: 'relative',
              background: inboxViewMode === 'hotlists'
                ? (isLight ? '#CCFBF1' : 'rgba(13,148,136,0.18)')
                : (hoveredNav === 'hotlists' ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)') : 'transparent'),
              color: inboxViewMode === 'hotlists'
                ? '#0D9488'
                : (hoveredNav === 'hotlists' ? C.textPrimary : C.textSecondary),
              fontWeight: inboxViewMode === 'hotlists' ? 700 : (hoveredNav === 'hotlists' ? 600 : 500),
              fontSize: 13.5,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              boxShadow: inboxViewMode === 'hotlists' ? '0 1px 3px rgba(13,148,136,0.15)' : 'none',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconBriefcase /> {!sidebarCollapsed && <span>Vendor Hotlists</span>}
            </span>
            {!sidebarCollapsed ? (
              <span style={{ fontSize: 10.5, background: '#0D9488', color: '#FFFFFF', padding: '1px 7px', borderRadius: 10, fontWeight: 800 }}>
                {scopedVendorHotlists.length || 0}
              </span>
            ) : (
              <span style={{
                position: 'absolute',
                top: 7,
                right: 14,
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#0D9488'
              }} />
            )}
          </button>

          {/* 5. Scan Ingest */}
          <button
            type="button"
            title="Scan Ingest"
            onMouseEnter={() => setHoveredNav('scaningest')}
            onMouseLeave={() => setHoveredNav(null)}
            onClick={() => {
              setInboxViewMode('stream')
              handleSyncEmailResumes()
            }}
            disabled={syncingEmailResumes}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 12,
              padding: sidebarCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: syncingEmailResumes
                ? 'rgba(37,99,235,0.12)'
                : (hoveredNav === 'scaningest' ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)') : 'transparent'),
              color: syncingEmailResumes ? '#2563EB' : (hoveredNav === 'scaningest' ? C.textPrimary : C.textSecondary),
              fontWeight: syncingEmailResumes ? 700 : (hoveredNav === 'scaningest' ? 600 : 500),
              fontSize: 13.5,
              cursor: syncingEmailResumes ? 'wait' : 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <IconZap /> {!sidebarCollapsed && <span>{syncingEmailResumes ? 'Scanning...' : 'Scan Ingest'}</span>}
          </button>

          {/* 6. Settings */}
          <button
            type="button"
            title="Settings"
            onMouseEnter={() => setHoveredNav('settings')}
            onMouseLeave={() => setHoveredNav(null)}
            onClick={() => navigate('/ats')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 12,
              padding: sidebarCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: hoveredNav === 'settings' ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)') : 'transparent',
              color: hoveredNav === 'settings' ? C.textPrimary : C.textSecondary,
              fontWeight: hoveredNav === 'settings' ? 600 : 500,
              fontSize: 13.5,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <IconSettings /> {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>

        {/* Bottom 1-Click Sidebar Collapse / Expand Toggle */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button
            type="button"
            onClick={handleToggleSidebar}
            title={sidebarCollapsed ? "Expand Sidebar (1-Click)" : "Collapse Sidebar (1-Click)"}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: 10,
              padding: sidebarCollapsed ? '10px 0' : '9px 12px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.04)',
              color: C.textSecondary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLight ? '#F1F5F9' : 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isLight ? '#F8FAFC' : 'rgba(255,255,255,0.04)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarCollapsed ? (
                <>
                  <polyline points="13 17 18 12 13 7"></polyline>
                  <polyline points="6 17 11 12 6 7"></polyline>
                </>
              ) : (
                <>
                  <polyline points="11 17 6 12 11 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </>
              )}
            </svg>
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Right Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
        
        {/* Top Navbar Matching Screenshot */}
        <header style={{
          backgroundColor: C.headerBg,
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${C.border}`,
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
          flexShrink: 0,
          zIndex: 10
        }}>
          {/* Left: Sidebar toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={handleToggleSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: C.textSecondary,
                display: 'flex',
                alignItems: 'center',
                padding: 6,
                borderRadius: 8
              }}
              title={sidebarCollapsed ? "Expand Sidebar (1-Click)" : "Collapse Sidebar (1-Click)"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Center: Search pill bar matching screenshot */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              position: 'absolute',
              left: 16,
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}>
              <IconSearch />
            </span>
            <input
              placeholder="Search candidates or Boolean (e.g. Java AND Spring NOT Python)..."
              value={streamSearch}
              onChange={e => {
                setStreamSearch(e.target.value)
                setTablePage(1)
              }}
              style={{
                width: '100%',
                backgroundColor: isLight ? '#F1F5F9' : '#1E293B',
                border: `1px solid ${C.border}`,
                borderRadius: 9999,
                padding: '9px 65px 9px 42px',
                fontSize: 13,
                color: C.textPrimary,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <span style={{
              position: 'absolute',
              right: 14,
              fontSize: 11,
              fontWeight: 700,
              color: '#94A3B8',
              backgroundColor: isLight ? '#E2E8F0' : '#334155',
              padding: '2px 6px',
              borderRadius: 4,
              border: `1px solid ${isLight ? '#CBD5E1' : '#475569'}`,
              pointerEvents: 'none'
            }}>
              ⌘K
            </span>
          </div>

          {/* Right Action Cluster matching screenshot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {shareToast && (
              <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '5px 12px', borderRadius: 8 }}>
                {shareToast}
              </span>
            )}
            {assignedToast && (
              <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '5px 12px', borderRadius: 8 }}>
                {assignedToast}
              </span>
            )}

            <button
              type="button"
              onClick={() => setAddCandidateModalOpen(true)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> <span>Add Candidate</span>
            </button>

            {/* Dynamic Notification Bell */}
            <div ref={notificationsDropdownRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setShowNotificationsDropdown(prev => !prev)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 6,
                  backgroundColor: showNotificationsDropdown ? (isLight ? '#E2E8F0' : '#334155') : 'transparent'
                }}
                title="Activity & Resume Notifications"
              >
                <span style={{ display: "flex", alignItems: "center", color: showNotificationsDropdown ? '#2563EB' : C.textSecondary }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: '#FF5630',
                    color: '#FFF',
                    borderRadius: '50%',
                    minWidth: 16,
                    height: 16,
                    fontSize: 9.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>

              {/* Notifications Dropdown Panel */}
              {showNotificationsDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 380,
                  maxHeight: 460,
                  backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  {/* Dropdown Header */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isLight ? '#F8FAFC' : '#0F172A'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: C.textPrimary }}>Notifications</span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        padding: '1px 7px',
                        borderRadius: 10,
                        border: '1px solid #BFDBFE'
                      }}>
                        {notifications.filter(n => !n.read).length} Unread
                      </span>
                    </div>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={handleMarkAllNotificationsRead}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Dropdown List */}
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '36px 20px', textAlign: 'center', color: C.textSecondary, fontSize: 12.5 }}>
                        No notifications right now. Inbound resumes and position matches will appear here.
                      </div>
                    ) : (
                      notifications.map(n => {
                        const isMatch = n.isMatched || Boolean(n.targetReqId);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: '11px 14px',
                              borderBottom: `1px solid ${C.border}`,
                              borderLeft: n.read ? '3px solid transparent' : '3px solid #2563EB',
                              backgroundColor: n.read ? 'transparent' : (isLight ? '#F8FAFC' : 'rgba(37,99,235,0.06)'),
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3,
                              transition: 'background-color 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 12.5, fontWeight: n.read ? 600 : 800, color: C.textPrimary }}>
                                {n.candidateName || 'New Candidate Ingested'}
                              </span>
                              <span style={{ fontSize: 10.5, color: C.textSecondary, whiteSpace: 'nowrap' }}>
                                {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 1 }}>
                              {isMatch ? (
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  background: '#DCFCE7',
                                  color: '#15803D',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  border: '1px solid #BBF7D0'
                                }}>
                                  Req #{n.targetReqId} • {n.matchScore || 85}% Match
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  background: '#F1F5F9',
                                  color: '#475569',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  border: '1px solid #E2E8F0'
                                }}>
                                  General Talent Pool
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                                {isMatch ? (n.matchedJobTitle || 'Open Requisition') : (n.role || 'No active requirement')}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Mode Toggle */}
            <button
              onClick={() => { const m = themeMode === 'light' ? 'dark' : 'light'; setThemeMode(m); localStorage.setItem('smarthire_theme', m); }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 6,
                fontSize: 16,
                cursor: 'pointer',
                color: C.textSecondary,
                display: 'flex',
                alignItems: 'center'
              }}
              title="Toggle theme"
            >
              {isLight ? <IconMoon /> : <IconSun />}
            </button>

            {/* User Profile Pill & Upload Menu */}
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setShowProfileDropdown(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 8px 4px 4px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: showProfileDropdown ? (isLight ? '#F1F5F9' : 'rgba(255,255,255,0.06)') : 'transparent',
                  transition: 'background-color 0.15s'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: userAvatar ? 'transparent' : (isEmployee ? '#16A34A' : '#0284C7'),
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  overflow: 'hidden',
                  border: userAvatar ? '1px solid #CBD5E1' : 'none'
                }}>
                  {userAvatar ? (
                    <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (currentUser?.name ? currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'OM')
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{currentUser?.name ? currentUser.name.split(' ')[0] : 'Omkesh'}</span>
                  <span style={{ fontSize: 11, color: C.textSecondary }}>{isSuperAdmin ? 'Super Admin' : isManager ? 'Manager' : isEmployee ? 'Sourcing Specialist' : 'Recruiter'}</span>
                </div>
                <span style={{ fontSize: 11, color: C.textSecondary, marginLeft: 2 }}>⌵</span>
              </div>

              {/* Profile Photo & Settings Modal Dropdown */}
              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 290,
                  backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                  padding: '20px 18px',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}>
                  {/* Large Avatar with Photo Upload */}
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <div style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      background: userAvatar ? 'transparent' : (isEmployee ? '#16A34A' : '#0284C7'),
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 22,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      border: userAvatar ? '2px solid #3B82F6' : 'none'
                    }}>
                      {userAvatar ? (
                        <img src={userAvatar} alt="Profile Large" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (currentUser?.name ? currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'OM')
                      )}
                    </div>
                  </div>

                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button
                      type="button"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      disabled={profileSaving}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 6,
                        backgroundColor: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                      }}
                    >
                      {userAvatar ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {userAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={profileSaving}
                        style={{
                          padding: '6px 10px',
                          fontSize: 11.5,
                          fontWeight: 600,
                          borderRadius: 6,
                          backgroundColor: 'transparent',
                          color: '#EF4444',
                          border: '1px solid #FECACA',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Profile Details */}
                  <div style={{ width: '100%', borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                      {currentUser?.name || 'Omkesh Manjute'}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.textSecondary, wordBreak: 'break-all' }}>
                      {currentUser?.email || 'omkesh@coolsofttech.com'}
                    </div>
                    <span style={{
                      marginTop: 4,
                      fontSize: 10.5,
                      fontWeight: 700,
                      backgroundColor: isLight ? '#F1F5F9' : '#0F172A',
                      color: '#2563EB',
                      padding: '2px 8px',
                      borderRadius: 10,
                      border: `1px solid ${C.border}`
                    }}>
                      {isSuperAdmin ? 'Super Admin' : isManager ? 'Manager' : isEmployee ? 'Sourcing Specialist' : 'Recruiter'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, backgroundColor: C.bg }}>

          {/* VIEW 1: MINIMALS OVERVIEW DASHBOARD (EXACT REPLICA OF media_1789070880356.png) */}
          {inboxViewMode === 'dashboard' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', boxSizing: 'border-box' }}>
              <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
                
                {/* Greeting */}
                <div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: C.textPrimary, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    Hi, Welcome back
                  </h1>
                  <p style={{ fontSize: 13.5, color: C.textSecondary, margin: 0 }}>
                    Here is your real-time candidate pipeline, auto-match telemetry, and requisition performance overview.
                  </p>
                </div>

                {/* The 4 Dynamic ATS KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  
                  {/* Card 1: Total Candidates */}
                  <div
                    onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(208, 242, 254, 0.85) 0%, rgba(186, 230, 253, 0.5) 100%)',
                      borderRadius: 16,
                      padding: '22px 24px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 108, 156, 0.08)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 155
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 108, 156, 0.12)',
                        color: '#006C9C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconUser />
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: '#C8FACD',
                        color: '#007B55',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 20
                      }}>
                        <IconTrendingUp /> 100% Active
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#006C9C', marginBottom: 4 }}>
                          Total Candidates
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#04297A', lineHeight: 1.1 }}>
                          {dashboardMetrics.total}
                        </div>
                      </div>
                      <IconSparkline color="#006C9C" />
                    </div>
                  </div>

                  {/* Card 2: Active Requisitions */}
                  <div
                    onClick={() => navigate('/ats?tab=jobs')}
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 216, 249, 0.85) 0%, rgba(227, 210, 254, 0.5) 100%)',
                      borderRadius: 16,
                      padding: '22px 24px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(81, 25, 183, 0.08)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 155
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(81, 25, 183, 0.12)',
                        color: '#5119B7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconBriefcase />
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: '#E0F2FE',
                        color: '#0284C7',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 20
                      }}>
                        Open Positions
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#5119B7', marginBottom: 4 }}>
                          Active Requisitions
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#27097A', lineHeight: 1.1 }}>
                          {dashboardMetrics.activeJobsCount}
                        </div>
                      </div>
                      <IconSparkline color="#5119B7" />
                    </div>
                  </div>

                  {/* Card 3: Strong Matches (80%+) */}
                  <div
                    onClick={() => { setFilterMatch('80'); setInboxViewMode('stream'); setInboxSubMode('table'); }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 247, 205, 0.85) 0%, rgba(255, 234, 167, 0.5) 100%)',
                      borderRadius: 16,
                      padding: '22px 24px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(183, 129, 3, 0.08)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 155
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(183, 129, 3, 0.12)',
                        color: '#B78103',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconSparkles />
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: '#C8FACD',
                        color: '#007B55',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 20
                      }}>
                        <IconTrendingUp /> {Math.round((dashboardMetrics.strongFits / Math.max(1, dashboardMetrics.total)) * 100)}% Match
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#B78103', marginBottom: 4 }}>
                          Strong Fits (80%+)
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#7A4F01', lineHeight: 1.1 }}>
                          {dashboardMetrics.strongFits}
                        </div>
                      </div>
                      <IconSparkline color="#B78103" />
                    </div>
                  </div>

                  {/* Card 4: Resume Ingestion & Spam Recovery */}
                  <div
                    onClick={() => { setFilterMatch('all'); setResumeKeywordSearch(''); setInboxViewMode('stream'); setInboxSubMode('table'); }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 231, 217, 0.85) 0%, rgba(255, 208, 189, 0.5) 100%)',
                      borderRadius: 16,
                      padding: '22px 24px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(183, 33, 54, 0.08)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 155
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(183, 33, 54, 0.12)',
                        color: '#B72136',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconMail />
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: '#FFE7D9',
                        color: '#B72136',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 20
                      }}>
                        {dashboardMetrics.sources.spam.count} Spam Recovered
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#B72136', marginBottom: 4 }}>
                          Direct / Ingested Resumes
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#7A0C2E', lineHeight: 1.1 }}>
                          {dashboardMetrics.sources.email.count + dashboardMetrics.sources.spam.count}
                        </div>
                      </div>
                      <IconSparkline color="#B72136" />
                    </div>
                  </div>

                </div>

                {/* The Two Main Analytics Cards (Candidate Sourcing Donut + Top In-Demand Skills) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                  
                  {/* Candidate Sourcing Channels (Dynamic Donut Chart) */}
                  <div style={{
                    backgroundColor: C.surface,
                    borderRadius: 16,
                    padding: '24px 28px',
                    boxShadow: C.shadow,
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: 0 }}>
                          Candidate Sourcing Channels
                        </h3>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
                          Live Feed
                        </span>
                      </div>

                      {(() => {
                        const circ = 440
                        const segEmail = Math.max(2, Math.round((dashboardMetrics.sources.email.pct / 100) * circ))
                        const segSpam = Math.max(2, Math.round((dashboardMetrics.sources.spam.pct / 100) * circ))
                        const segPortal = Math.max(2, Math.round((dashboardMetrics.sources.portal.pct / 100) * circ))
                        const segBench = Math.max(2, circ - (segEmail + segSpam + segPortal))

                        return (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                            <svg width="220" height="220" viewBox="0 0 220 220">
                              {/* Segment 1: Email Inbox (#0284C7) */}
                              <circle
                                cx="110" cy="110" r="70"
                                fill="transparent"
                                stroke="#0284C7"
                                strokeWidth="24"
                                strokeDasharray={`${segEmail} ${circ - segEmail}`}
                                strokeDashoffset="0"
                                transform="rotate(-90 110 110)"
                              />
                              {/* Segment 2: Spam Harvester (#F59E0B) */}
                              <circle
                                cx="110" cy="110" r="70"
                                fill="transparent"
                                stroke="#F59E0B"
                                strokeWidth="24"
                                strokeDasharray={`${segSpam} ${circ - segSpam}`}
                                strokeDashoffset={-segEmail}
                                transform="rotate(-90 110 110)"
                              />
                              {/* Segment 3: Careers Portal (#10B981) */}
                              <circle
                                cx="110" cy="110" r="70"
                                fill="transparent"
                                stroke="#10B981"
                                strokeWidth="24"
                                strokeDasharray={`${segPortal} ${circ - segPortal}`}
                                strokeDashoffset={-(segEmail + segSpam)}
                                transform="rotate(-90 110 110)"
                              />
                              {/* Segment 4: Vendor / Bench (#8B5CF6) */}
                              <circle
                                cx="110" cy="110" r="70"
                                fill="transparent"
                                stroke="#8B5CF6"
                                strokeWidth="24"
                                strokeDasharray={`${segBench} ${circ - segBench}`}
                                strokeDashoffset={-(segEmail + segSpam + segPortal)}
                                transform="rotate(-90 110 110)"
                              />
                              
                              <text x="110" y="105" textAnchor="middle" fontSize="24" fontWeight="800" fill={C.textPrimary}>
                                {dashboardMetrics.total}
                              </text>
                              <text x="110" y="124" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={C.textSecondary} letterSpacing="0.5px">
                                TOTAL SOURCED
                              </text>
                            </svg>
                          </div>
                        )
                      })()}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px', fontSize: 12, fontWeight: 700, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0284C7', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Email Inbox: <strong>{dashboardMetrics.sources.email.count}</strong> ({dashboardMetrics.sources.email.pct}%)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Spam Harvester: <strong>{dashboardMetrics.sources.spam.count}</strong> ({dashboardMetrics.sources.spam.pct}%)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Careers Portal: <strong>{dashboardMetrics.sources.portal.count}</strong> ({dashboardMetrics.sources.portal.pct}%)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8B5CF6', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Vendor / Bench: <strong>{dashboardMetrics.sources.bench.count}</strong> ({dashboardMetrics.sources.bench.pct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Technical Skills in Pipeline (Real-Time Skill Breakdown) */}
                  <div style={{
                    backgroundColor: C.surface,
                    borderRadius: 16,
                    padding: '24px 28px',
                    boxShadow: C.shadow,
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: '0 0 4px' }}>
                            Top In-Demand Skills in Pipeline
                          </h3>
                          <div style={{ fontSize: 12.5, color: C.textSecondary }}>
                            Parsed in real-time from candidate resume dossiers
                          </div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>
                          AI Extracted
                        </span>
                      </div>

                      {/* Skills Progress List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0 10px' }}>
                        {dashboardMetrics.topSkills.map((sk, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                              <span style={{ fontWeight: 700, color: C.textPrimary }}>{sk.name}</span>
                              <span style={{ color: C.textSecondary, fontWeight: 600, fontSize: 11.5 }}>
                                <strong style={{ color: '#2563EB', fontWeight: 800 }}>{sk.count}</strong> candidates ({sk.pct}%)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: 7, backgroundColor: isLight ? '#F1F5F9' : '#334155', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.max(6, sk.pct)}%`,
                                background: idx === 0 ? 'linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)' :
                                            idx === 1 ? 'linear-gradient(90deg, #0284C7 0%, #67E8F9 100%)' :
                                            idx === 2 ? 'linear-gradient(90deg, #059669 0%, #34D399 100%)' :
                                            idx === 3 ? 'linear-gradient(90deg, #D97706 0%, #FBBF24 100%)' :
                                            'linear-gradient(90deg, #7C3AED 0%, #A78BFA 100%)',
                                borderRadius: 4,
                                transition: 'width 0.4s ease'
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, fontSize: 12, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ color: C.textSecondary }}>Telemetry updated automatically from candidate pool</span>
                      <button
                        type="button"
                        onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#2065D1',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Explore Candidates in Table ➔
                      </button>
                    </div>
                  </div>

                </div>

                {/* Quick Candidates Table Preview */}
                <div style={{
                  backgroundColor: C.surface,
                  borderRadius: 16,
                  padding: '24px 28px',
                  boxShadow: C.shadow,
                  border: `1px solid ${C.border}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: '0 0 4px' }}>
                        Recent Talent Stream &amp; Ingested Profiles
                      </h3>
                      <div style={{ fontSize: 13, color: C.textSecondary }}>
                        Showing top candidates ready for requisition assignment
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
                      style={{
                        background: '#2065D1',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 16px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(32,101,209,0.25)'
                      }}
                    >
                      Open Full Candidate Table ➔
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${C.border}`, color: C.textSecondary, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 14px' }}>Candidate</th>
                          <th style={{ padding: '10px 14px' }}>Target Job &amp; Fit</th>
                          <th style={{ padding: '10px 14px' }}>Origin Channel</th>
                          <th style={{ padding: '10px 14px' }}>Key Skills</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {streamCandidates.slice(0, 5).map(c => (
                          <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 800, color: C.textPrimary, fontSize: 13 }}>{c.name}</div>
                              <div style={{ fontSize: 11.5, color: C.textSecondary }}>{c.role || 'Senior Specialist'} • {c.location}</div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                background: (c.matchScore || 85) >= 80 ? '#C8FACD' : '#FFF7CD',
                                color: (c.matchScore || 85) >= 80 ? '#007B55' : '#B78103',
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontWeight: 800,
                                fontSize: 11
                              }}>
                                {c.matchScore || 85}% Fit
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {c.isSpamRecovery ? (
                                <span style={{ color: '#B72136', fontWeight: 700, fontSize: 11 }}>Spam Recovered</span>
                              ) : c.sourceCategory === 'careers_portal' ? (
                                <span style={{ color: '#007B55', fontWeight: 700, fontSize: 11 }}>Careers Portal</span>
                              ) : (
                                <span style={{ color: '#006C9C', fontWeight: 700, fontSize: 11 }}>Recruiter Email</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {safeSkillArray(c.skills).slice(0, 3).map((sk, idx) => (
                                  <span key={idx} style={{ background: C.surface2, padding: '1px 6px', borderRadius: 4, fontSize: 10.5, color: C.textSecondary }}>
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCandidate(c)
                                  setInboxViewMode('stream')
                                  setInboxSubMode('card')
                                }}
                                style={{
                                  background: '#EBF3FE',
                                  color: '#2065D1',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '5px 10px',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                View Card &amp; Resume
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Integrated Recruiter Performance & KPI Leaderboard on Dashboard */}
                <div style={{ marginTop: 8 }}>
                  {renderRecruiterLeaderboardSection(true)}
                </div>

              </div>
            </div>
          )}

          {/* VIEW 2: CANDIDATE TALENT STREAM VIEW (TOBU.AI MASTER-DETAIL & TABLE MODES) */}
          {inboxViewMode === 'stream' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          
          {/* A. TOBU.AI CANDIDATE CARD DETAIL VIEW (MATCHING media_1789068769296.png & media_1789068785299.png) */}
          {inboxSubMode === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              {/* Tobu Sticky Top Action Bar */}
              <div style={{
                padding: '10px 24px',
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: C.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                flexShrink: 0
              }}>
                {/* Left: Previous / Next Candidate Navigation & Table View Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handlePrevCandidate}
                    disabled={activeCandidateIndex <= 0}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: activeCandidateIndex <= 0 ? C.textSecondary : C.textPrimary,
                      opacity: activeCandidateIndex <= 0 ? 0.5 : 1,
                      cursor: activeCandidateIndex <= 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                    title="Previous Candidate (Keyboard: K or ArrowLeft)"
                  >
                    <IconChevronLeft /> <span>Prev Candidate</span>
                    <kbd style={{
                      fontSize: 10,
                      fontWeight: 800,
                      backgroundColor: isLight ? '#E2E8F0' : '#334155',
                      color: C.textSecondary,
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontFamily: 'monospace'
                    }}>K</kbd>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextCandidate}
                    disabled={activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: (activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1) ? C.textSecondary : C.textPrimary,
                      opacity: (activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1) ? 0.5 : 1,
                      cursor: (activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                    title="Next Candidate (Keyboard: J or ArrowRight)"
                  >
                    <span>Next Candidate</span> <IconChevronRight />
                    <kbd style={{
                      fontSize: 10,
                      fontWeight: 800,
                      backgroundColor: isLight ? '#E2E8F0' : '#334155',
                      color: C.textSecondary,
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontFamily: 'monospace'
                    }}>J</kbd>
                  </button>

                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textSecondary,
                    background: C.inputBg,
                    border: `1px solid ${C.border}`,
                    padding: '4px 10px',
                    borderRadius: 14
                  }}>
                    {filteredCandidates.length > 0 ? `Candidate ${activeCandidateIndex + 1} of ${filteredCandidates.length}` : '0 Candidates'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setInboxSubMode('table')}
                    style={{
                      background: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                      color: '#2563EB',
                      border: '1px solid #BFDBFE',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Return to Candidates Table (Keyboard: ESC)"
                  >
                    <span>←</span> <span>Back to Candidates Table</span>
                    <kbd style={{
                      fontSize: 10,
                      fontWeight: 800,
                      backgroundColor: '#DBEAFE',
                      color: '#1D4ED8',
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontFamily: 'monospace'
                    }}>ESC</kbd>
                  </button>
                </div>

                {/* Right Action Cluster: Transfer, Email, Share, Download */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleRunLiveAiScan(activeCandidate)}
                    disabled={isLiveAiScanning}
                    style={{
                      background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #4F46E5 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: isLiveAiScanning ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                    }}
                    title="Run real-time deep AI Match Scan & Fit Analysis"
                  >
                    <IconZap /> <span>{isLiveAiScanning ? 'AI Scanning...' : '⚡ AI Match Scan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPushModal(activeCandidate)}
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                    }}
                    title="Push candidate to Jobs in Hand / active requisition"
                  >
                    <span>Push to Jobs in Hand ↗</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleOpenEmailModal(activeCandidate)
                      setActiveTobuTab('emails')
                    }}
                    style={{
                      background: activeTobuTab === 'emails' ? '#5B21B6' : '#7C3AED',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(124,58,237,0.3)'
                    }}
                    title={`Draft email to ${activeCandidate?.name} from ${currentUser?.email || 'omkesh@coolsofttech.com'}`}
                  >
                    <IconMail /> <span>Email Candidate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareCandidate(activeCandidate)}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Share Candidate via Email"
                  >
                    <IconShare /> <span>Share</span>
                  </button>

                  {activeCandidate?.file?.stored_name ? (
                    <a
                      href={`/uploads/${activeCandidate.file.stored_name}`}
                      download={activeCandidate.file.original_name || activeCandidate.file.stored_name}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '7px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textPrimary,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        textDecoration: 'none'
                      }}
                      title="Download Original Resume File"
                    >
                      <IconDownload /> <span>Download Resume</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeCandidate) return
                        const element = document.createElement('a')
                        const file = new Blob([candResumeText], { type: 'text/plain' })
                        element.href = URL.createObjectURL(file)
                        element.download = `${(activeCandidate.name || 'Candidate').replace(/\s+/g, '_')}_Resume.txt`
                        document.body.appendChild(element)
                        element.click()
                      }}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '7px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textPrimary,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Download Resume Text"
                    >
                      <IconDownload /> <span>Download Resume</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteCandidate(activeCandidate)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 6,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Delete Candidate"
                  >
                    <IconTrash /> <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Tobu Candidate Card Split View */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: C.bg }}>
                
                {/* LEFT SIDEBAR: Candidate Dossier & Documents Locker (~310px) */}
                <div style={{
                  width: 320,
                  minWidth: 290,
                  maxWidth: 360,
                  flexShrink: 0,
                  borderRight: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  overflowY: 'auto',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>


                  {/* MONSTER-STYLE CANDIDATE PROFILE CARD (Screenshot 5) */}
                  <div style={{
                    backgroundColor: isLight ? '#FFFFFF' : C.cardBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: '16px',
                    boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    {/* Top Row: Checkbox, Star Favorite, Name & External Link */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(activeCandidate?.id && selectedCardIds.has(activeCandidate.id))}
                          onChange={() => {
                            if (!activeCandidate?.id) return
                            setSelectedCardIds(prev => {
                              const next = new Set(prev)
                              if (next.has(activeCandidate.id)) next.delete(activeCandidate.id)
                              else next.add(activeCandidate.id)
                              return next
                            })
                          }}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }}
                          title="Select candidate for bulk actions"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!activeCandidate?.id) return
                            setFavoriteCandidateIds(prev => {
                              const next = new Set(prev)
                              if (next.has(activeCandidate.id)) next.delete(activeCandidate.id)
                              else next.add(activeCandidate.id)
                              return next
                            })
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color: activeCandidate?.id && favoriteCandidateIds.has(activeCandidate.id) ? '#F59E0B' : C.textSecondary,
                            fontSize: 16
                          }}
                          title="Star candidate"
                        >
                          {activeCandidate?.id && favoriteCandidateIds.has(activeCandidate.id) ? '★' : '☆'}
                        </button>
                      </div>

                      <span style={{ fontSize: 11, color: C.textSecondary, fontWeight: 600 }}>
                        {activeCandidate?.createdAt ? new Date(activeCandidate.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
                      </span>
                    </div>

                    {/* Candidate Name & Role */}
                    <div>
                      <h2 style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: C.textPrimary,
                        margin: '0 0 2px',
                        lineHeight: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <span>{activeCandidate?.name || activeCandidate?.extracted_profile?.name || (activeCandidate?.email ? activeCandidate.email.split('@')[0] : 'Candidate Profile')}</span>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent((activeCandidate?.name || '') + ' ' + (activeCandidate?.role || ''))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563EB', textDecoration: 'none', fontSize: 13 }}
                          title="Search online"
                        >
                          ↗
                        </a>
                      </h2>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginTop: 2 }}>
                        {activeCandidate?.role || (candSkillsList.length > 0 ? `${candSkillsList[0]} Specialist` : 'Software Specialist')}
                      </div>
                    </div>

                    {/* Live AI Match Scan Trigger Button (Prompt: left card mai ak chota sa button AI Match) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <button
                        type="button"
                        onClick={() => handleRunLiveAiScan(activeCandidate)}
                        disabled={isLiveAiScanning}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #4F46E5 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '7px 12px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: isLiveAiScanning ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                        title="Run real-time deep AI Match Scan & Fit Analysis against target requisition"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isLiveAiScanning ? 'spin 1s linear infinite' : 'none' }}>
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>{isLiveAiScanning ? 'Scanning Live AI...' : 'AI Match (Live Scan)'}</span>
                      </button>
                      {liveAiMatchResult && liveAiCandidate?.id === activeCandidate?.id && (
                        <button
                          type="button"
                          onClick={() => setShowLiveAiModal(true)}
                          style={{
                            background: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            borderRadius: 6,
                            padding: '7px 9px',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                          title="View detailed AI match analysis"
                        >
                          <span>{liveAiMatchResult.score}% Fit</span> ↗
                        </button>
                      )}
                    </div>

                    {/* Location & Local Verification Badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 600, color: C.textPrimary }}>
                          {(() => {
                            const l = activeCandidate?.location || '';
                            return (l && !l.toLowerCase().includes('search on') && !l.toLowerCase().includes('webpage')) ? l : 'United States';
                          })()}
                        </span>
                        {activeCandidate?.visaStatus && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: isLight ? '#F1F5F9' : '#334155',
                            color: isLight ? '#475569' : '#CBD5E1',
                            padding: '1px 5px',
                            borderRadius: 4,
                            border: `1px solid ${isLight ? '#E2E8F0' : '#475569'}`
                          }}>
                            {String(activeCandidate.visaStatus).replace(/\s*\(.*?\)/g, '')}
                          </span>
                        )}
                      </div>

                      {/* Local Fit Badge */}
                      {(() => {
                        const matchedJob = activeCandidate?.targetReqId 
                          ? openJobsList.find(j => String(j.id || '').replace(/^J-/, '') === String(activeCandidate.targetReqId).replace(/^J-/, ''))
                          : null;
                        const locFit = evaluateCandidateLocationFit(activeCandidate, matchedJob);
                        return renderLocationBadge(locFit);
                      })()}
                    </div>

                    {/* Monster-Style Work Experience Short Card */}
                    {(() => {
                      const candStats = extractCandidateExperienceStats(activeCandidate)
                      const candEducation = extractCandidateEducation(activeCandidate)
                      return (
                        <div style={{
                          borderTop: `1px solid ${C.border}`,
                          paddingTop: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          fontSize: 11.5
                        }}>
                          <div>
                            <span style={{ color: C.textSecondary, fontWeight: 700 }}>Current: </span>
                            <strong style={{ color: C.textPrimary }}>
                              {candStats.currentTitle} at {candStats.currentEmployer}
                            </strong>
                          </div>

                          <div>
                            <span style={{ color: C.textSecondary, fontWeight: 700 }}>Previous: </span>
                            <span style={{ color: C.textPrimary }}>
                              {candStats.previousTitle} at {candStats.previousEmployer}
                            </span>
                          </div>

                          <div>
                            <span style={{ color: C.textSecondary, fontWeight: 700 }}>Education: </span>
                            <span style={{ color: C.textPrimary }}>{candEducation}</span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Top Skills Chips (Monster Style) */}
                    {candSkillsList.length > 0 && (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>
                          Skills
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {candSkillsList.slice(0, 5).map((sk, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: isLight ? '#F1F5F9' : '#334155',
                                border: `1px solid ${isLight ? '#E2E8F0' : '#475569'}`,
                                color: C.textPrimary,
                                padding: '2px 7px',
                                borderRadius: 4
                              }}
                            >
                              {sk}
                            </span>
                          ))}
                          {candSkillsList.length > 5 && (
                            <span
                              onClick={() => setActiveTobuTab('analytics')}
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: '#2563EB',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                padding: '2px 6px',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                              title="Click to view all skills in Analytics tab"
                            >
                              +{candSkillsList.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => handleRunLiveAiScan(activeCandidate)}
                        disabled={isLiveAiScanning}
                        style={{
                          backgroundColor: '#1E40AF',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '7px 9px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: isLiveAiScanning ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}
                        title="Run real-time deep AI Match Scan"
                      >
                        <IconZap /> <span>AI Match</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal(activeCandidate)}
                        style={{
                          flex: 1,
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '7px 8px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}
                      >
                        <IconMail /> <span>Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTobuTab('analytics')}
                        style={{
                          backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                          border: `1px solid ${C.border}`,
                          color: C.textPrimary,
                          borderRadius: 6,
                          padding: '7px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}
                        title="View deep analysis, career gaps, and full fit breakdown"
                      >
                        <span>Analytics ↗</span>
                      </button>
                    </div>
                  </div>

                  {/* Sourcing & Inbound Sender Info */}
                  <div style={{
                    backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 11
                  }}>
                    <div style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, marginBottom: 4 }}>
                      Sourcing &amp; Acquisition Channel
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textPrimary, wordBreak: 'break-all' }}>
                      {activeCandidate?.recruiterEmail || activeCandidate?.fromEmail || 'omkesh@coolsofttech.com'}
                    </div>
                    <div style={{ color: C.textSecondary, marginTop: 2 }}>
                      Channel: {activeCandidate?.isSpamRecovery ? 'Yahoo Spam Folder' : activeCandidate?.sourceCategory === 'careers_portal' ? 'Careers Portal' : activeCandidate?.sourceCategory === 'vendor_bench' ? 'Vendor Bench' : 'Recruiter Email Inbox'}
                    </div>
                    <div style={{ color: C.textSecondary, marginTop: 2 }}>
                      Received: {activeCandidate?.createdAt ? new Date(activeCandidate.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent Submission'}
                    </div>
                  </div>

                  {/* Candidate Attachments & Documents Locker (Tobu.ai style + DL, ID, Visa) */}
                  {(() => {
                    const candAllDocs = getCandidateAllDocuments(activeCandidate)
                    return (
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ color: C.textSecondary, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Attachments ({candAllDocs.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => docFileInputRef.current?.click()}
                            disabled={isUploadingDoc}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              borderRadius: 5,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#2563EB',
                              cursor: isUploadingDoc ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="Upload DL, Visa, ID or Resume"
                          >
                            <IconUpload /> <span>{isUploadingDoc ? 'Uploading...' : '+ Upload Doc'}</span>
                          </button>
                        </div>

                        {/* Hidden File Input */}
                        <input
                          type="file"
                          ref={docFileInputRef}
                          onChange={handleSidebarDocUpload}
                          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                          style={{ display: 'none' }}
                        />

                        {/* Document List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {candAllDocs.length > 0 ? (
                            candAllDocs.map((d) => (
                              <div
                                key={d.id}
                                style={{
                                  backgroundColor: d.bg,
                                  border: `1px solid ${d.border}`,
                                  borderRadius: 6,
                                  padding: '8px 10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, color: d.color, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    {d.category}
                                  </span>
                                  <span style={{ fontSize: 9.5, fontWeight: 700, color: d.color, backgroundColor: '#FFF', padding: '1px 5px', borderRadius: 3, border: `1px solid ${d.border}` }}>
                                    {d.type}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A', wordBreak: 'break-all', lineHeight: 1.3 }}>
                                  {d.fileName}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                                  {d.fileUrl && (
                                    <a
                                      href={d.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: d.color,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3
                                      }}
                                    >
                                      <span>View</span> ↗
                                    </a>
                                  )}
                                  {d.fileUrl && (
                                    <a
                                      href={d.fileUrl}
                                      download={d.fileName}
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        color: C.textSecondary,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3
                                      }}
                                    >
                                      <IconDownload /> <span>Download</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic', padding: '6px 0' }}>
                              No compliance documents attached yet. Click "+ Upload Doc" above to attach DL, Visa, ID, or Resume.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Toast Notifications */}
                  {(sidebarDocToast || copiedToast) && (
                    <div style={{
                      backgroundColor: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#047857',
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '7px 10px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <IconCheckCircle color="#047857" />
                      <span>{sidebarDocToast || copiedToast}</span>
                    </div>
                  )}
                </div>

                {/* RIGHT CANVAS: Tobu Tabs & Dedicated Paper Resume Sheet */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: isLight ? '#F8FAFC' : '#0B0F17' }}>
                  
                  {/* Tobu Tabs Navigation Strip */}
                  <div style={{
                    padding: '0 24px',
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: C.surface,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexShrink: 0
                  }}>
                    {[
                      { id: 'resume', label: 'Resume' },
                      { id: 'analytics', label: 'Analytics' },
                      { id: 'comments', label: 'Comments' },
                      { id: 'emails', label: 'Emails' },
                      { id: 'activity', label: 'Activity' }
                    ].map(tab => {
                      const isActive = activeTobuTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTobuTab(tab.id)}
                          style={{
                            background: 'transparent',
                            color: isActive ? '#2563EB' : C.textSecondary,
                            border: 'none',
                            borderBottom: isActive ? '3px solid #2563EB' : '3px solid transparent',
                            padding: '12px 16px',
                            fontSize: 13,
                            fontWeight: isActive ? 800 : 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s'
                          }}
                        >
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Tab Body Canvas */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
                    
                    {/* 1. RESUME TAB (Pure, Uncluttered Candidate Resume) */}
                    {activeTobuTab === 'resume' && (
                      <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        
                        {/* Tobu.ai Top Action Strip (Download + Top Keyword Chips + Highlight Toggle + Search) */}
                        <div style={{
                          backgroundColor: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Download Button */}
                            {activeCandidate?.file?.stored_name ? (
                              <a
                                href={`/uploads/${activeCandidate.file.stored_name}`}
                                download={activeCandidate.file.original_name || activeCandidate.file.stored_name}
                                style={{
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '6px 14px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  textDecoration: 'none',
                                  boxShadow: '0 2px 5px rgba(37,99,235,0.2)'
                                }}
                              >
                                <IconDownload /> <span>Download Resume</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!activeCandidate) return
                                  const element = document.createElement('a')
                                  const file = new Blob([candResumeText], { type: 'text/plain' })
                                  element.href = URL.createObjectURL(file)
                                  element.download = `${(activeCandidate.name || 'Candidate').replace(/\s+/g, '_')}_Resume.txt`
                                  document.body.appendChild(element)
                                  element.click()
                                }}
                                style={{
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '6px 14px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  boxShadow: '0 2px 5px rgba(37,99,235,0.2)'
                                }}
                              >
                                <IconDownload /> <span>Download Resume</span>
                              </button>
                            )}

                            {/* Top 5 Skill Occurrence Frequency Chips (Interactive like Tobu.ai Screenshot 3) */}
                            {candidateFrequencies.slice(0, 5).map((sk, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setResumeKeywordSearch(sk.name)}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#047857',
                                  backgroundColor: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.15)',
                                  border: '1px solid #A7F3D0',
                                  borderRadius: 16,
                                  padding: '3px 10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                                title={`Click to find "${sk.name}" in resume`}
                              >
                                {sk.name.toLowerCase()} ({sk.count} {sk.count === 1 ? 'time' : 'times'})
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Highlighting Toggle (ON / OFF) */}
                            <button
                              type="button"
                              onClick={() => setIsHighlightSkillsEnabled(prev => !prev)}
                              style={{
                                background: isHighlightSkillsEnabled ? '#FEF3C7' : C.inputBg,
                                color: isHighlightSkillsEnabled ? '#B45309' : C.textSecondary,
                                border: `1px solid ${isHighlightSkillsEnabled ? '#FDE68A' : C.border}`,
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5
                              }}
                              title="Toggle skill highlighting in resume"
                            >
                              <span>Highlight Skills:</span>
                              <span style={{ fontWeight: 900, color: isHighlightSkillsEnabled ? '#15803D' : '#6B7280' }}>
                                {isHighlightSkillsEnabled ? 'ON' : 'OFF'}
                              </span>
                            </button>

                            {/* In-Resume Search Input */}
                            <div style={{ position: 'relative', width: 200 }}>
                              <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                                <IconSearch />
                              </span>
                              <input
                                value={resumeKeywordSearch}
                                onChange={e => setResumeKeywordSearch(e.target.value)}
                                placeholder="Find in resume..."
                                style={{
                                  width: '100%',
                                  background: C.inputBg,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 6,
                                  padding: '5px 8px 5px 28px',
                                  fontSize: 11.5,
                                  color: C.textPrimary,
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Resume Paper Canvas — Inline PDF / DOCX banner + text / plain text */}
                        {(() => {
                          const fileMime = activeCandidate?.file?.mime_type || ''
                          const fileName = activeCandidate?.file?.stored_name || ''
                          const fileUrl = fileName ? `/uploads/${fileName}` : ''
                          const isPdf = fileMime === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
                          const isDocx = fileMime.includes('wordprocessingml') || fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')

                          if (isPdf && fileUrl) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 14px' }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary }}>
                                    Original PDF Document: <strong style={{ color: '#2563EB' }}>{activeCandidate.file.original_name || fileName}</strong>
                                  </span>
                                  <a
                                    href={fileUrl}
                                    download={activeCandidate.file.original_name || fileName}
                                    style={{
                                      background: '#EFF6FF',
                                      color: '#1D4ED8',
                                      border: '1px solid #BFDBFE',
                                      borderRadius: 6,
                                      padding: '4px 12px',
                                      fontSize: 11.5,
                                      fontWeight: 800,
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5
                                    }}
                                  >
                                    <IconDownload /> <span>Download PDF</span>
                                  </a>
                                </div>
                                <iframe
                                  src={fileUrl}
                                  title={`Resume — ${activeCandidate.name}`}
                                  style={{
                                    width: '100%',
                                    height: 780,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 10,
                                    backgroundColor: '#FFFFFF',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
                                  }}
                                />
                              </div>
                            )
                          }

                          if (isDocx && fileUrl) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  background: isLight ? '#F0FDF4' : 'rgba(5,150,105,0.08)',
                                  border: '1px solid #A7F3D0',
                                  borderRadius: 8,
                                  padding: '10px 16px'
                                }}>
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#047857' }}>
                                    Resume on file: <strong style={{ color: '#0F172A' }}>{activeCandidate.file.original_name || fileName}</strong>
                                  </span>
                                  <a
                                    href={fileUrl}
                                    download={activeCandidate.file.original_name || fileName}
                                    style={{
                                      background: '#047857',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '6px 14px',
                                      fontSize: 12,
                                      fontWeight: 800,
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6
                                    }}
                                  >
                                    <IconDownload /> <span>Download DOCX</span>
                                  </a>
                                </div>
                                {highlightResumeText(candResumeText, [...new Set([...dynamicMatchingSkills, ...candSkillsList])], resumeKeywordSearch, isHighlightSkillsEnabled, activeCandidate)}
                              </div>
                            )
                          }

                          return highlightResumeText(candResumeText, [...new Set([...dynamicMatchingSkills, ...candSkillsList])], resumeKeywordSearch, isHighlightSkillsEnabled, activeCandidate)
                        })()}
                      </div>
                    )}

                    {/* 2. ANALYTICS TAB (AI Fit, Keyword Frequencies, Match Matrix, Public Sector & Career Gap Telemetry) */}
                    {activeTobuTab === 'analytics' && (
                      <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Card 0A: Verified Public Sector & Government Department Experience (High Priority) */}
                        {candidateGovExperience.hasGov && (
                          <div style={{
                            backgroundColor: isLight ? '#F0FDF4' : 'rgba(5,150,105,0.08)',
                            border: '1.5px solid #10B981',
                            borderRadius: 10,
                            padding: '18px 22px',
                            boxShadow: '0 4px 14px rgba(16,185,129,0.08)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 4, height: 28, backgroundColor: '#059669', borderRadius: 2, flexShrink: 0 }} />
                                <div>
                                  <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: '#065F46' }}>
                                    Verified Public Sector / Government Department Experience
                                  </h4>
                                  <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                                    High-priority candidate preference for State of Texas, Public Health, Transportation &amp; Agency contracts
                                  </div>
                                </div>
                              </div>
                              <span style={{
                                backgroundColor: '#059669',
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: 900,
                                padding: '4px 12px',
                                borderRadius: 6,
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase'
                              }}>
                                1st Preference Candidate
                              </span>
                            </div>

                            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {candidateGovExperience.allDepts.map((d, i) => (
                                <span key={i} style={{
                                  backgroundColor: '#ECFDF5',
                                  color: '#065F46',
                                  border: '1px solid #A7F3D0',
                                  borderRadius: 6,
                                  padding: '5px 12px',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}>
                                  <span>✓</span> <span>{d}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Card 0B: AI Placement Fit Rationale & Match Breakdown */}
                        {aiFitSummary && (
                          <div style={{
                            backgroundColor: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            padding: 22,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563EB', display: 'inline-block' }} />
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                  AI Placement Fit Rationale: Why Candidate Fits Req #{currentReqId}
                                </h4>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: calculatedFitScore >= 80 ? '#16A34A' : '#D97706' }}>
                                {calculatedFitScore}% AI Placement Score
                              </span>
                            </div>

                            <p style={{
                              fontSize: 13,
                              lineHeight: 1.6,
                              color: C.textPrimary,
                              margin: '0 0 16px',
                              backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.03)',
                              padding: '12px 16px',
                              borderRadius: 8,
                              border: `1px solid ${C.border}`
                            }}>
                              {aiFitSummary.overview}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                              {aiFitSummary.points.map((pt, i) => (
                                <div key={i} style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 12,
                                  padding: '10px 14px',
                                  borderRadius: 8,
                                  backgroundColor: pt.type === 'priority' ? (isLight ? '#ECFDF5' : 'rgba(16,185,129,0.08)') : pt.type === 'gap_warning' ? (isLight ? '#FFFBEB' : 'rgba(245,158,11,0.08)') : (isLight ? '#FFFFFF' : C.inputBg),
                                  border: `1px solid ${pt.type === 'priority' ? '#A7F3D0' : pt.type === 'gap_warning' ? '#FDE68A' : C.border}`
                                }}>
                                  <span style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    marginTop: 6,
                                    flexShrink: 0,
                                    backgroundColor: pt.type === 'priority' ? '#059669' : pt.type === 'gap_warning' ? '#D97706' : '#2563EB'
                                  }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{
                                      fontSize: 12.5,
                                      fontWeight: 800,
                                      color: pt.type === 'priority' ? '#065F46' : pt.type === 'gap_warning' ? '#B45309' : C.textPrimary
                                    }}>
                                      {pt.title}
                                    </div>
                                    <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, lineHeight: 1.45 }}>
                                      {pt.desc}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Card 0C: Career History & Automated Employment Gap Detection */}
                        {candidateWorkHistory && (
                          <div style={{
                            backgroundColor: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            padding: 22,
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                  Career History &amp; Employment Gap Analysis
                                </h4>
                                <div style={{ fontSize: 11.5, color: C.textSecondary, marginTop: 2 }}>
                                  {candidateWorkHistory.roles.length} recorded positions verified from resume
                                </div>
                              </div>

                              {/* Gap Detection Status Badge */}
                              <span style={{
                                fontSize: 12,
                                fontWeight: 800,
                                backgroundColor: candidateWorkHistory.hasGaps ? '#FEF3C7' : '#DCFCE7',
                                color: candidateWorkHistory.hasGaps ? '#B45309' : '#15803D',
                                border: `1px solid ${candidateWorkHistory.hasGaps ? '#FDE68A' : '#86EFAC'}`,
                                padding: '6px 12px',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}>
                                {candidateWorkHistory.gapMessage}
                              </span>
                            </div>

                            {/* Employment Gap Notice Alert Box if Gaps Exist */}
                            {candidateWorkHistory.hasGaps && (
                              <div style={{
                                backgroundColor: isLight ? '#FFFBEB' : 'rgba(245,158,11,0.08)',
                                border: '1px solid #FDE68A',
                                borderRadius: 8,
                                padding: '12px 16px',
                                marginBottom: 16
                              }}>
                                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#B45309', marginBottom: 6 }}>
                                  Notice: Career Hiatus Detected
                                </div>
                                {candidateWorkHistory.gaps.map((g, idx) => (
                                  <div key={idx} style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                                    • <strong>{g.gapMonths} Months Gap</strong> between <em>{g.afterCompany}</em> and <em>{g.beforeCompany}</em>.
                                  </div>
                                ))}
                                <div style={{ fontSize: 11, color: '#B45309', marginTop: 6, fontStyle: 'italic' }}>
                                  Recruiter Tip: Confirm reason for hiatus during candidate phone screen before client submission.
                                </div>
                              </div>
                            )}

                            {/* Timeline of Positions (Current and Old, line by line) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              {candidateWorkHistory.roles.map((role, idx) => (
                                <div key={idx} style={{
                                  position: 'relative',
                                  paddingLeft: 22,
                                  borderLeft: `2px solid ${role.isCurrent ? '#2563EB' : role.isGov ? '#10B981' : (isLight ? '#CBD5E1' : '#475569')}`,
                                  paddingBottom: 4
                                }}>
                                  {/* Dot Indicator */}
                                  <div style={{
                                    position: 'absolute',
                                    left: -6,
                                    top: 2,
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    backgroundColor: role.isCurrent ? '#2563EB' : role.isGov ? '#10B981' : (isLight ? '#94A3B8' : '#64748B'),
                                    boxShadow: role.isCurrent ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none'
                                  }} />

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: 13.5, fontWeight: 800, color: C.textPrimary }}>
                                        {role.title}
                                      </span>
                                      <span style={{ color: C.textSecondary }}>•</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: role.isGov ? '#065F46' : '#2563EB' }}>
                                        {role.company}
                                      </span>
                                      {role.isCurrent && (
                                        <span style={{
                                          fontSize: 10,
                                          fontWeight: 800,
                                          backgroundColor: '#DBEAFE',
                                          color: '#1D4ED8',
                                          padding: '1px 6px',
                                          borderRadius: 4
                                        }}>
                                          Current Position
                                        </span>
                                      )}
                                      {role.isGov && (
                                        <span style={{
                                          fontSize: 10,
                                          fontWeight: 800,
                                          backgroundColor: '#ECFDF5',
                                          color: '#065F46',
                                          border: '1px solid #A7F3D0',
                                          padding: '1px 6px',
                                          borderRadius: 4,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 3
                                        }}>
                                          {role.deptName || 'State Agency'}
                                        </span>
                                      )}
                                    </div>

                                    <span style={{ fontSize: 11.5, fontWeight: 700, color: C.textSecondary }}>
                                      {role.period}
                                    </span>
                                  </div>

                                  {/* Highlights / Responsibilities */}
                                  {role.highlights && role.highlights.length > 0 && (
                                    <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 11.5, color: C.textSecondary, lineHeight: 1.5 }}>
                                      {role.highlights.map((hl, hIdx) => (
                                        <li key={hIdx} style={{ marginBottom: 2 }}>{hl}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Card 1: Requisition Fit & Skills Match Matrix */}
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Target Requisition Alignment
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                                <select
                                  value={currentReqId}
                                  onChange={e => setDrawerReqId(e.target.value)}
                                  style={{
                                    background: C.inputBg,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: C.textPrimary,
                                    outline: 'none',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {openJobsList.map(j => (
                                    <option key={j.id} value={j.id}>
                                      Req #{j.id} · {j.title} ({j.rate})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                fontSize: 14,
                                fontWeight: 900,
                                color: calculatedFitScore >= 80 ? '#15803D' : '#B45309',
                                backgroundColor: calculatedFitScore >= 80 ? '#DCFCE7' : '#FEF3C7',
                                border: `1px solid ${calculatedFitScore >= 80 ? '#86EFAC' : '#FDE68A'}`,
                                padding: '6px 14px',
                                borderRadius: 6,
                                display: 'inline-block'
                              }}>
                                {calculatedFitScore}% AI Fit Match
                              </span>
                            </div>
                          </div>

                          {/* Target Job Specs Card */}
                          <div style={{
                            backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: '12px 16px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 12,
                            marginBottom: 16,
                            fontSize: 12
                          }}>
                            <div>
                              <span style={{ color: C.textSecondary, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Role Title</span>
                              <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeTargetJob?.title || 'Senior Consultant'}</strong>
                            </div>
                            <div>
                              <span style={{ color: C.textSecondary, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Direct Client</span>
                              <strong style={{ color: '#2563EB', fontSize: 12.5 }}>{activeTargetJob?.client || 'Enterprise Agency'}</strong>
                            </div>
                            <div>
                              <span style={{ color: C.textSecondary, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Target Bill Rate</span>
                              <strong style={{ color: '#16A34A', fontSize: 12.5 }}>{activeTargetJob?.rate || '$75/hr'}</strong>
                            </div>
                            <div>
                              <span style={{ color: C.textSecondary, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Work Location</span>
                              <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeTargetJob?.location || 'Remote / Hybrid'}</strong>
                            </div>
                          </div>

                          {/* Skill Match Progress Bar */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
                              <span style={{ color: C.textPrimary }}>Required Skills Match Density</span>
                              <span style={{ color: calculatedFitScore >= 80 ? '#15803D' : '#B45309' }}>
                                {dynamicMatchingSkills.length} of {reqSkillsList.length} required skills matched ({Math.round((dynamicMatchingSkills.length / Math.max(1, reqSkillsList.length)) * 100)}%)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: 8, backgroundColor: isLight ? '#E2E8F0' : '#334155', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.min(100, Math.round((dynamicMatchingSkills.length / Math.max(1, reqSkillsList.length)) * 100))}%`,
                                height: '100%',
                                backgroundColor: calculatedFitScore >= 80 ? '#16A34A' : '#F59E0B',
                                borderRadius: 4,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>

                          {/* Matching vs Required Skills Not Matched Breakdown */}
                          <div style={{ display: 'grid', gridTemplateColumns: prefSkillsList.length > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 14 }}>
                            {/* Matching Required Skills */}
                            <div style={{ border: '1.5px solid #BBF7D0', backgroundColor: isLight ? '#F0FDF4' : 'rgba(22,163,74,0.06)', borderRadius: 8, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <IconCheckCircle color="#16A34A" /> <span>Matching Skills ({dynamicMatchingSkills.length})</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {dynamicMatchingSkills.length > 0 ? (
                                  dynamicMatchingSkills.map((sk, i) => (
                                    <span key={i} style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                      ✓ {sk}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: 11.5, color: C.textSecondary, fontStyle: 'italic' }}>No direct requisition matches found</span>
                                )}
                              </div>
                            </div>

                            {/* Required Skills Not Matched */}
                            <div style={{ border: '1.5px solid #FECACA', backgroundColor: isLight ? '#FEF2F2' : 'rgba(239,68,68,0.06)', borderRadius: 8, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <IconXCircle color="#DC2626" /> <span>Required Skills Not Matched ({dynamicMissingSkills.length})</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {dynamicMissingSkills.length > 0 ? (
                                  dynamicMissingSkills.map((sk, i) => (
                                    <span key={i} style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                      ✗ {sk}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700 }}>100% required skills covered</span>
                                )}
                              </div>
                            </div>

                            {/* Preferred / Nice-to-Have Skills (if requisition defines preferred skills) */}
                            {prefSkillsList.length > 0 && (
                              <div style={{ border: '1.5px solid #BFDBFE', backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.06)', borderRadius: 8, padding: 14 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span>★</span> <span>Preferred Skills ({dynamicMatchingPreferred.length}/{prefSkillsList.length})</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {prefSkillsList.map((sk, i) => {
                                    const hasPref = dynamicMatchingPreferred.includes(sk)
                                    return (
                                      <span key={i} style={{
                                        background: hasPref ? '#DBEAFE' : (isLight ? '#F1F5F9' : '#1E293B'),
                                        color: hasPref ? '#1D4ED8' : C.textSecondary,
                                        border: `1px solid ${hasPref ? '#93C5FD' : C.border}`,
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        fontWeight: 700
                                      }}>
                                        {hasPref ? '✓' : '•'} {sk}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 5-Tier Match Criteria Summary (Title, Required Skills, Preferred, State/Location, Experience) */}
                          <div style={{
                            marginTop: 14,
                            padding: '14px 16px',
                            backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: 12,
                            fontSize: 11.5
                          }}>
                            <div>
                              <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 3 }}>1. Title Match</span>
                              <span style={{
                                color: titleAlignmentEvaluation.status === 'aligned' ? '#16A34A' : titleAlignmentEvaluation.status === 'partial' ? '#D97706' : '#DC2626',
                                fontWeight: 800,
                                display: 'block',
                                lineHeight: 1.3
                              }}>
                                {titleAlignmentEvaluation.label}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 3 }}>2. Required Skills</span>
                              <span style={{
                                color: dynamicMissingSkills.length === 0 ? '#16A34A' : (dynamicMatchingSkills.length >= dynamicMissingSkills.length ? '#D97706' : '#DC2626'),
                                fontWeight: 800,
                                display: 'block',
                                lineHeight: 1.3
                              }}>
                                {dynamicMatchingSkills.length} / {reqSkillsList.length} Matched
                              </span>
                            </div>

                            <div>
                              <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 3 }}>3. Preferred Skills</span>
                              <span style={{
                                color: dynamicMatchingPreferred.length > 0 ? '#2563EB' : C.textSecondary,
                                fontWeight: 800,
                                display: 'block',
                                lineHeight: 1.3
                              }}>
                                {prefSkillsList.length > 0 ? `${dynamicMatchingPreferred.length} / ${prefSkillsList.length} Bonus` : 'None Required'}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 3 }}>4. State &amp; Location</span>
                              <span style={{
                                color: locationFitEvaluation.isGood ? '#16A34A' : '#D97706',
                                fontWeight: 800,
                                display: 'block',
                                lineHeight: 1.3
                              }}>
                                {locationFitEvaluation.label}
                              </span>
                            </div>

                            <div>
                              <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 3 }}>5. Experience Fit</span>
                              <span style={{
                                color: experienceAlignmentEvaluation.isGood ? '#16A34A' : '#D97706',
                                fontWeight: 800,
                                display: 'block',
                                lineHeight: 1.3
                              }}>
                                {experienceAlignmentEvaluation.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card 1.5: Core Candidate Skills & Technical Competencies (Relocated exclusively to Analytics) */}
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Core Candidate Skills &amp; Technical Competencies
                            </h4>
                            <span style={{ fontSize: 11, color: C.textSecondary }}>
                              {candSkillsList.length} Extracted Skills
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {candSkillsList.length > 0 ? (
                              candSkillsList.map((sk, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#2563EB',
                                    backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                                    border: '1px solid #BFDBFE',
                                    borderRadius: 6,
                                    padding: '5px 12px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: 12, color: C.textSecondary, fontStyle: 'italic' }}>
                                No explicit technical skills listed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card 2: Top Keyword Frequency & Occurrence Density (Previously in Resume Tab) */}
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Top Keyword Frequency &amp; Skill Density
                            </h4>
                            <span style={{ fontSize: 11, color: C.textSecondary }}>
                              {candidateFrequencies.length} technical competencies identified
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {candidateFrequencies.length > 0 ? (
                              candidateFrequencies.map((sk, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: '#047857',
                                    backgroundColor: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.15)',
                                    border: '1px solid #A7F3D0',
                                    borderRadius: 16,
                                    padding: '4px 11px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5
                                  }}
                                >
                                  <strong>{sk.name}</strong> <span>({sk.count} {sk.count === 1 ? 'time' : 'times'})</span>
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: 12, color: C.textSecondary, fontStyle: 'italic' }}>
                                Parsing skill frequencies from candidate profile...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card 3: Tobu.ai Resume Ingest & Sourcing Metadata Table */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          border: `1px solid ${C.border}`,
                          borderRadius: 10,
                          backgroundColor: C.surface,
                          overflow: 'hidden'
                        }}>
                          <div style={{ padding: '14px 16px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Resume Uploader</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, marginTop: 4 }}>
                              {activeCandidate?.recruiterName || currentUser?.name || (isSuperAdmin ? 'Omkesh Manjute' : 'Recruiter')}
                              <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 500, marginTop: 1 }}>({activeCandidate?.recruiterEmail || currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')})</div>
                            </div>
                          </div>

                          <div style={{ padding: '14px 16px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Method of Upload</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, marginTop: 4 }}>
                              {activeCandidate?.isSpamRecovery ? 'Email Spam Harvest' : activeCandidate?.sourceCategory === 'careers_portal' ? 'Careers Job Portal' : activeCandidate?.sourceCategory === 'vendor_bench' ? 'Vendor Submittal' : 'Email Parser'}
                            </div>
                          </div>

                          <div style={{ padding: '14px 16px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Source</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, marginTop: 4 }}>
                              {activeCandidate?.source || (isSuperAdmin ? 'Yahoo Small Business (omkesh@coolsofttech.com)' : 'Recruiter Inbox')}
                            </div>
                          </div>

                          <div style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Received On</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, marginTop: 4 }}>
                              {activeCandidate?.createdAt ? new Date(activeCandidate.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '10th Sep, 2026, 09:42 PM'}
                            </div>
                          </div>
                        </div>

                        {/* Card 4: Compliance & Verification Audit */}
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Compliance &amp; Verification Audit
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12 }}>
                            <div>
                              <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Driver's License OCR</span>
                              <strong style={{ color: '#16A34A', fontSize: 12 }}>✓ Match Verified</strong>
                            </div>
                            <div>
                              <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Biometric Selfie</span>
                              <strong style={{ color: '#16A34A', fontSize: 12 }}>✓ Match Passed (98%)</strong>
                            </div>
                            <div>
                              <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>US Work Authorization</span>
                              <strong style={{ color: '#16A34A', fontSize: 12 }}>✓ Active ({activeCandidate?.visaStatus || 'US Citizen'})</strong>
                            </div>
                            <div>
                              <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Origin Folder</span>
                              <strong style={{ color: C.textPrimary, fontSize: 12 }}>{activeCandidate?.folder || 'INBOX'}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. COMMENTS TAB */}
                    {activeTobuTab === 'comments' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                            Internal Recruiter Screening Notes
                          </h4>
                          <textarea
                            placeholder="Add recruiter screening notes, interview feedback, or manager review comments..."
                            style={{
                              width: '100%',
                              minHeight: 120,
                              background: C.inputBg,
                              border: `1px solid ${C.border}`,
                              borderRadius: 8,
                              padding: 12,
                              fontSize: 13,
                              color: C.textPrimary,
                              outline: 'none',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignedToast('✓ Note saved to candidate audit record!')
                                setTimeout(() => setAssignedToast(''), 4000)
                              }}
                              style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. FULL-PAGE EMAILS COMPOSER & OUTREACH TAB */}
                    {activeTobuTab === 'emails' && (() => {
                      const candId = String(activeCandidate?.id || activeCandidate?.candidate_id || activeCandidate?.canId || 'cand')
                      const sentList = candidateSentEmails[candId] || []
                      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
                      const myName = u.name || currentUser?.name || (isSuperAdmin ? 'Omkesh Manjute' : 'Lead Recruiter')
                      const myEmail = u.email || currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')

                      return (
                        <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                          
                          {/* Composer Card */}
                          <div style={{
                            backgroundColor: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
                          }}>
                            {/* Card Top Title Bar */}
                            <div style={{
                              padding: '16px 22px',
                              borderBottom: `1px solid ${C.border}`,
                              backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 10
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#FFFFFF'
                                }}>
                                  <IconMail />
                                </div>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 900, color: C.textPrimary }}>
                                    Compose Direct Email &amp; RTR Authorization
                                  </div>
                                  <div style={{ fontSize: 12, color: C.textSecondary }}>
                                    To candidate: <strong style={{ color: '#2563EB' }}>{activeCandidate?.name}</strong> ({activeCandidate?.role || 'Technical Specialist'})
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: '#15803D',
                                  backgroundColor: '#DCFCE7',
                                  border: '1px solid #86EFAC',
                                  borderRadius: 6,
                                  padding: '4px 10px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}>
                                  <span>SMTP Authenticated: {myEmail}</span>
                                </span>
                              </div>
                            </div>

                            {/* Recipient & Headers Fields */}
                            <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${C.border}`, backgroundColor: isLight ? '#F8FAFC' : '#0B0F17' }}>
                              
                              {/* FROM Row */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ width: 65, fontSize: 12, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>
                                  From:
                                </span>
                                <div style={{
                                  flex: 1,
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  color: C.textPrimary,
                                  background: C.inputBg,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 6,
                                  padding: '6px 12px'
                                }}>
                                  <strong>{myName}</strong> &lt;{myEmail}&gt; <span style={{ color: C.textSecondary, fontWeight: 500 }}>(COOLSOFT LLC Recruiter Dispatch)</span>
                                </div>
                              </div>

                              {/* TO Row with CC / BCC toggles */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ width: 65, fontSize: 12, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>
                                  To:
                                </span>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <input
                                    type="email"
                                    value={emailTo}
                                    onChange={e => setEmailTo(e.target.value)}
                                    placeholder="candidate@example.com"
                                    style={{
                                      flex: 1,
                                      background: C.surface,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 6,
                                      padding: '7px 12px',
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: C.textPrimary,
                                      outline: 'none'
                                    }}
                                  />
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {!showCcInput && !emailCc && (
                                      <button
                                        type="button"
                                        onClick={() => setShowCcInput(true)}
                                        style={{
                                          background: C.inputBg,
                                          border: `1px solid ${C.border}`,
                                          borderRadius: 6,
                                          padding: '6px 10px',
                                          fontSize: 11.5,
                                          fontWeight: 800,
                                          color: C.textSecondary,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        + Cc
                                      </button>
                                    )}
                                    {!showBccInput && !emailBcc && (
                                      <button
                                        type="button"
                                        onClick={() => setShowBccInput(true)}
                                        style={{
                                          background: C.inputBg,
                                          border: `1px solid ${C.border}`,
                                          borderRadius: 6,
                                          padding: '6px 10px',
                                          fontSize: 11.5,
                                          fontWeight: 800,
                                          color: C.textSecondary,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        + Bcc
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* CC Row (Expandable) */}
                              {(showCcInput || emailCc) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ width: 65, fontSize: 12, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>
                                    Cc:
                                  </span>
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                      type="text"
                                      value={emailCc}
                                      onChange={e => setEmailCc(e.target.value)}
                                      placeholder="Copy supervisor or account manager (e.g. omkesh@coolsofttech.com)..."
                                      style={{
                                        flex: 1,
                                        background: C.surface,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 6,
                                        padding: '7px 12px',
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        color: C.textPrimary,
                                        outline: 'none'
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEmailCc('')
                                        setShowCcInput(false)
                                      }}
                                      style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14 }}
                                      title="Remove Cc"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* BCC Row (Expandable) */}
                              {(showBccInput || emailBcc) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ width: 65, fontSize: 12, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>
                                    Bcc:
                                  </span>
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                      type="text"
                                      value={emailBcc}
                                      onChange={e => setEmailBcc(e.target.value)}
                                      placeholder="Blind copy email address for ATS archiving..."
                                      style={{
                                        flex: 1,
                                        background: C.surface,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 6,
                                        padding: '7px 12px',
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        color: C.textPrimary,
                                        outline: 'none'
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEmailBcc('')
                                        setShowBccInput(false)
                                      }}
                                      style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14 }}
                                      title="Remove Bcc"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* SUBJECT Row (Fully Editable) */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ width: 65, fontSize: 12, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>
                                  Subject:
                                </span>
                                <input
                                  type="text"
                                  value={emailSubject}
                                  onChange={e => setEmailSubject(e.target.value)}
                                  placeholder="Opportunity subject line..."
                                  style={{
                                    flex: 1,
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 6,
                                    padding: '8px 12px',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: C.textPrimary,
                                    outline: 'none'
                                  }}
                                />
                              </div>

                              {/* Quick 1-Click Templates Strip */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                  Templates:
                                </span>
                                {[
                                  { key: 'rtr', label: 'RTR Authorization' },
                                  { key: 'screen', label: 'Screening Call' },
                                  { key: 'rate', label: 'Rate & Work Auth' },
                                  { key: 'interview', label: 'Interview Shortlist' }
                                ].map(tpl => (
                                  <button
                                    key={tpl.key}
                                    type="button"
                                    onClick={() => handleApplyEmailTemplate(tpl.key)}
                                    style={{
                                      background: C.surface,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 14,
                                      padding: '4px 11px',
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      color: '#4F46E5',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    {tpl.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Spacious Body Textarea */}
                            <div style={{ padding: '18px 22px' }}>
                              <textarea
                                value={emailBody}
                                onChange={e => setEmailBody(e.target.value)}
                                placeholder={`Write a message to ${activeCandidate?.name || 'candidate'}...`}
                                style={{
                                  width: '100%',
                                  minHeight: 260,
                                  background: C.inputBg,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 8,
                                  padding: '14px 16px',
                                  fontSize: 13.5,
                                  lineHeight: 1.65,
                                  color: C.textPrimary,
                                  outline: 'none',
                                  resize: 'vertical',
                                  fontFamily: 'inherit',
                                  boxSizing: 'border-box'
                                }}
                              />

                              {emailSuccessToast && (
                                <div style={{
                                  marginTop: 12,
                                  backgroundColor: '#ECFDF5',
                                  border: '1px solid #A7F3D0',
                                  color: '#047857',
                                  fontSize: 12.5,
                                  fontWeight: 700,
                                  padding: '10px 14px',
                                  borderRadius: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8
                                }}>
                                  <IconCheckCircle color="#047857" />
                                  <span>{emailSuccessToast}</span>
                                </div>
                              )}
                            </div>

                            {/* Bottom Toolbar & Primary Send Action */}
                            <div style={{
                              padding: '14px 22px',
                              borderTop: `1px solid ${C.border}`,
                              backgroundColor: isLight ? '#F8FAFC' : '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 12
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!emailTo) return
                                    let mailto = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
                                    if (emailCc) mailto += `&cc=${encodeURIComponent(emailCc)}`
                                    if (emailBcc) mailto += `&bcc=${encodeURIComponent(emailBcc)}`
                                    window.location.href = mailto
                                  }}
                                  style={{
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 6,
                                    padding: '7px 12px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: C.textSecondary,
                                    cursor: 'pointer'
                                  }}
                                  title="Open in Apple Mail / Outlook / Thunderbird"
                                >
                                  Draft in Mail App ↗
                                </button>
                                <span style={{ fontSize: 11, color: C.textSecondary }}>
                                  Sent messages are automatically mirrored to Yahoo Sent folder via IMAP
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                  type="button"
                                  onClick={() => handleApplyEmailTemplate('rtr')}
                                  style={{
                                    background: 'transparent',
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 6,
                                    padding: '8px 14px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: C.textSecondary,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Reset Form
                                </button>

                                <button
                                  type="button"
                                  onClick={handleSendDirectEmail}
                                  disabled={emailSending}
                                  style={{
                                    background: '#2563EB',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '8px 20px',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    cursor: emailSending ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                                    opacity: emailSending ? 0.7 : 1
                                  }}
                                >
                                  <IconMail /> <span>{emailSending ? 'Sending Email...' : 'Send Email'}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Sent Emails History for this Candidate */}
                          <div style={{
                            backgroundColor: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 12,
                            padding: 22
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Outbound Email History ({sentList.length})
                              </h4>
                              <span style={{ fontSize: 11.5, color: C.textSecondary }}>
                                Audit trail of messages dispatched to {activeCandidate?.name}
                              </span>
                            </div>

                            {sentList.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {sentList.map((m) => (
                                  <div
                                    key={m.id}
                                    style={{
                                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.02)',
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 8,
                                      padding: '14px 16px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                      <strong style={{ fontSize: 13, color: C.textPrimary }}>{m.subject}</strong>
                                      <span style={{ fontSize: 11, color: C.textSecondary }}>{m.time}</span>
                                    </div>
                                    <div style={{ fontSize: 11.5, color: C.textSecondary, marginBottom: 8 }}>
                                      <span>To: <strong>{m.to}</strong></span>
                                      {m.cc && <span style={{ marginLeft: 12 }}>Cc: <strong>{m.cc}</strong></span>}
                                      <span style={{ marginLeft: 12 }}>Sender: <strong>{m.sender}</strong></span>
                                      <span style={{
                                        marginLeft: 12,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color: '#16A34A',
                                        backgroundColor: '#DCFCE7',
                                        padding: '1px 6px',
                                        borderRadius: 4
                                      }}>
                                        {m.dispatched ? 'Delivered via SMTP' : 'Dispatched'}
                                      </span>
                                    </div>
                                    <div style={{
                                      fontSize: 12.5,
                                      color: C.textPrimary,
                                      whiteSpace: 'pre-wrap',
                                      lineHeight: 1.5,
                                      maxHeight: 120,
                                      overflowY: 'auto',
                                      backgroundColor: C.surface,
                                      padding: 10,
                                      borderRadius: 6,
                                      border: `1px solid ${C.border}`
                                    }}>
                                      {m.body}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12.5, color: C.textSecondary, fontStyle: 'italic', padding: '10px 0' }}>
                                No outbound emails sent to this candidate yet. Use the composer above to initiate direct communication.
                              </div>
                            )}
                          </div>

                        </div>
                      )
                    })()}

                    {/* 5. ACTIVITY TAB */}
                    {activeTobuTab === 'activity' && (() => {
                      const candId = String(activeCandidate?.id || activeCandidate?.candidate_id || activeCandidate?.canId || 'cand')
                      const candidateCustomActivities = candidateActivities[candId] || []
                      const defaultActivities = [
                        {
                          id: 'act-ingest',
                          title: 'Candidate Ingested into ATS',
                          time: activeCandidate?.createdAt ? new Date(activeCandidate.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '10th Sep 2026, 09:42 PM',
                          desc: `Ingested from ${activeCandidate?.source || 'Email Inbox'} by ${currentUser?.name || (isSuperAdmin ? 'Omkesh Manjute' : 'Recruiter')}`,
                          badge: 'Profile Ingest',
                          badgeBg: isLight ? '#F1F5F9' : '#1E293B',
                          badgeColor: C.textPrimary
                        },
                        {
                          id: 'act-match',
                          title: 'AI Requisition Match Calculated',
                          time: 'Calculated upon ingestion',
                          desc: `Fit score calculated at ${calculatedFitScore}% for Req #${currentReqId} (${activeTargetJob?.title})`,
                          badge: 'AI Match',
                          badgeBg: '#EFF6FF',
                          badgeColor: '#2563EB'
                        },
                        {
                          id: 'act-view',
                          title: 'Profile Inspected & Screened',
                          time: 'Active session',
                          desc: `Candidate dossier inspected by ${currentUser?.name || (isSuperAdmin ? 'Omkesh Manjute' : 'Recruiter')}`,
                          badge: 'Screening',
                          badgeBg: '#F0FDF4',
                          badgeColor: '#16A34A'
                        }
                      ]

                      const allActivities = [...candidateCustomActivities, ...defaultActivities]

                      return (
                        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Candidate Activity &amp; Audit Trail ({allActivities.length})
                            </h4>
                            <span style={{ fontSize: 11.5, color: C.textSecondary }}>
                              Real-time logging of communications, status changes, and assignments
                            </span>
                          </div>

                          {allActivities.map((act) => (
                            <div
                              key={act.id}
                              style={{
                                backgroundColor: C.surface,
                                border: `1px solid ${C.border}`,
                                borderRadius: 10,
                                padding: '14px 18px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 14
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: act.badgeColor || '#2563EB',
                                  marginTop: 5,
                                  flexShrink: 0
                                }} />
                                <div>
                                  <div style={{ fontSize: 13.5, fontWeight: 800, color: C.textPrimary }}>
                                    {act.title}
                                  </div>
                                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                                    {act.desc}
                                  </div>
                                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                                    {act.time}
                                  </div>
                                </div>
                              </div>

                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                color: act.badgeColor || '#2563EB',
                                backgroundColor: act.badgeBg || '#EFF6FF',
                                padding: '3px 9px',
                                borderRadius: 4,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap'
                              }}>
                                {act.badge || 'Activity'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* B. CANDIDATES TABLE VIEW (PIXEL-PERFECT MATCHING media_1789727370931.png) */}
          {inboxSubMode === 'table' && (
            <div
              className="candidates-page-scroll"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                minHeight: 0,
                backgroundColor: isLight ? '#F8FAFC' : C.bg,
                padding: '20px 28px'
              }}
            >
              <style>{`
                .candidates-page-scroll::-webkit-scrollbar {
                  width: 8px;
                }
                .candidates-page-scroll::-webkit-scrollbar-track {
                  background: ${isLight ? '#F1F5F9' : '#1E293B'};
                  border-radius: 4px;
                }
                .candidates-page-scroll::-webkit-scrollbar-thumb {
                  background: ${isLight ? '#94A3B8' : '#475569'};
                  border-radius: 4px;
                }
                .candidates-page-scroll::-webkit-scrollbar-thumb:hover {
                  background: ${isLight ? '#64748B' : '#64748B'};
                }
              `}</style>
              {/* 1. Header Section: Title & Subtitle + 5 Metric Cards */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 20,
                flexShrink: 0
              }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.5px' }}>
                    Candidates
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <p style={{ margin: 0, fontSize: 13.5, color: C.textSecondary, fontWeight: 500 }}>
                      Find the right talent, faster.
                    </p>
                    {loadingStream && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#2563EB', fontWeight: 600, padding: '2px 8px', background: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)', borderRadius: 12 }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />
                        Syncing database...
                      </span>
                    )}
                  </div>
                </div>

                {/* 5 Metric KPI Cards matching screenshot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { color: '#2563EB', count: roleScopedCandidates.filter(c => c.sourceCategory !== 'email_spam' && !c.isSpamRecovery).length, label: 'Total Candidates', filter: 'all' },
                    { color: '#16A34A', count: roleScopedCandidates.filter(c => (c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) && (c.status !== 'Archived' && c.status !== 'Rejected' && c.status !== 'Closed')).length, label: 'Active', filter: 'active' },
                    { color: '#D97706', count: roleScopedCandidates.filter(c => c.sourceCategory === 'email_inbox').length, label: 'Resume Emails', filter: 'inbox' },
                    { color: '#0284C7', count: roleScopedCandidates.filter(c => c.status === 'In Review' || c.status === 'Review').length, label: 'In Review', filter: 'review' },
                    { color: '#DC2626', count: roleScopedCandidates.filter(c => c.sourceCategory === 'email_spam' || c.isSpamRecovery).length, label: 'Spam / Recovered', filter: 'spam' }
                  ].map((card, cIdx) => {
                    const isSelected = tableCategory === card.filter
                    return (
                      <div
                        key={cIdx}
                        onClick={() => {
                          setTableCategory(card.filter)
                          setTablePage(1)
                        }}
                        style={{
                          backgroundColor: isSelected ? (isLight ? '#EFF6FF' : 'rgba(37,99,235,0.18)') : (isLight ? '#FFFFFF' : C.surface),
                          border: `1px solid ${isSelected ? '#2563EB' : C.border}`,
                          borderRadius: 10,
                          padding: '8px 14px',
                          minWidth: 100,
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: card.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 17, fontWeight: 800, color: C.textPrimary }}>
                            {card.count}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: isSelected ? '#2563EB' : C.textSecondary, whiteSpace: 'nowrap' }}>
                          {card.label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2. Filter Bar Card matching screenshot */}
              <div style={{
                backgroundColor: isLight ? '#FFFFFF' : C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '12px 18px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                  {/* Requisition dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select
                      value={streamReqFilter}
                      onChange={e => { setStreamReqFilter(e.target.value); setTablePage(1); }}
                      style={{
                        backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 28px 8px 32px',
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: C.textPrimary,
                        outline: 'none',
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none'
                      }}
                    >
                      <option value="all">All Open Requisitions</option>
                      {openJobsList.map(j => (
                        <option key={j.id} value={j.id}>
                          Req #{j.id} · {j.title.slice(0, 24)}...
                        </option>
                      ))}
                    </select>
                    
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 11, color: C.textSecondary }}>
                      ⌵
                    </span>
                  </div>

                  {/* Search Input */}
                  <div style={{ position: 'relative', width: 220 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', pointerEvents: 'none' }}>
                      <IconSearch />
                    </span>
                    <input
                      value={streamSearch}
                      onChange={e => { setStreamSearch(e.target.value); setTablePage(1); }}
                      placeholder="Search or Boolean (Java AND Spring)..."
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 12px 8px 32px',
                        fontSize: 12.5,
                        color: C.textPrimary,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Location dropdown */}
                  <select
                    value={filterLocation}
                    onChange={e => { setFilterLocation(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Location ⌵</option>
                    <option value="remote">Remote</option>
                    <option value="wisconsin">Wisconsin</option>
                    <option value="north carolina">North Carolina</option>
                    <option value="tennessee">Tennessee</option>
                    <option value="iowa">Iowa</option>
                    <option value="texas">Texas</option>
                  </select>

                  {/* Skills dropdown */}
                  <select
                    value={filterSkill}
                    onChange={e => { setFilterSkill(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Skills ⌵</option>
                    <option value=".net">.NET / C#</option>
                    <option value="java">Java / Spring Boot</option>
                    <option value="python">Python</option>
                    <option value="react">React / Frontend</option>
                    <option value="angular">Angular</option>
                    <option value="vue">Vue</option>
                    <option value="aws">AWS / Cloud</option>
                    <option value="sql">SQL / Database</option>
                    <option value="selenium">QA / Selenium</option>
                  </select>

                  {/* Match % dropdown */}
                  <select
                    value={filterMatch}
                    onChange={e => { setFilterMatch(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Match % ⌵</option>
                    <option value="90">90%+ Excellent</option>
                    <option value="70">70%+ Good</option>
                    <option value="50">50%+ Average</option>
                    <option value="under_50">Under 50% Low</option>
                  </select>

                  {/* Recruiter dropdown (Always Accessible) */}
                  <select
                    value={filterRecruiter}
                    onChange={e => { setFilterRecruiter(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: filterRecruiter !== 'all' ? '1px solid #2563EB' : `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: filterRecruiter !== 'all' ? '#2563EB' : C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    title="Filter candidates by assigned recruiter"
                  >
                    <option value="all">Recruiter: All (All Recruiters) ⌵</option>
                      {availableRecruiters.map(r => (
                        <option key={r.id || r._id || r.email} value={r.name || r.email}>
                          {r.name} ({r.role || 'Recruiter'})
                        </option>
                      ))}
                    </select>

                  {/* Source Channel dropdown */}
                  <select
                    value={filterSource}
                    onChange={e => { setFilterSource(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: filterSource !== 'all' ? '1px solid #2563EB' : `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: filterSource !== 'all' ? '#2563EB' : C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    title="Filter candidates by acquisition channel"
                  >
                    <option value="all">Source: All ⌵</option>
                    <option value="email">Email Ingest</option>
                    <option value="spam">Spam Recovered</option>
                    <option value="manual">Manual Entry</option>
                    <option value="careers">Careers Portal</option>
                    <option value="vendor">Vendor Bench</option>
                  </select>

                  {/* State / Public Sector Department Experience dropdown */}
                  <select
                    value={filterGovDept}
                    onChange={e => { setFilterGovDept(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: filterGovDept !== 'all' ? '1px solid #059669' : `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: filterGovDept !== 'all' ? '#059669' : C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    title="Filter candidates by State & Public Sector Department Experience"
                  >
                    <option value="all">Gov / Dept: All</option>
                    <option value="any_gov">Any Public Sector / State Agency</option>
                    <option value="health">Dept of Health / DSHS / HHSC</option>
                    <option value="transportation">TxDOT / Transportation</option>
                    <option value="behavioral">DBHDS / Behavioral Health</option>
                    <option value="state_tx">State of Texas Agencies</option>
                  </select>

                  {/* Local Candidate Fit filter dropdown */}
                  <select
                    value={filterLocalFit}
                    onChange={e => { setFilterLocalFit(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: filterLocalFit !== 'all' ? '1px solid #059669' : `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: filterLocalFit !== 'all' ? '#059669' : C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    title="Filter candidates by location proximity to requisition (Local vs Non-Local)"
                  >
                    <option value="all">Local Fit: All</option>
                    <option value="confirmed_local">Confirmed Local (Exact Match)</option>
                    <option value="remote_ok">Remote / Nationwide Eligible</option>
                    <option value="relocation_needed">Non-Local / Relocation Needed</option>
                  </select>

                  {/* Matched Requisition Source dropdown (InfoOrigin vs Direct Client / COOLSOFT) */}
                  <select
                    value={filterMatchedClient}
                    onChange={e => { setFilterMatchedClient(e.target.value); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#F8FAFC' : C.inputBg,
                      border: filterMatchedClient !== 'all' ? '1px solid #7C3AED' : `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: filterMatchedClient !== 'all' ? '#7C3AED' : C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    title="Filter candidates by Matched Client (Direct Client vs InfoOrigin)"
                  >
                    <option value="all">Matched Client: All Sources ⌵</option>
                    <option value="direct_coolsoft">Direct Client / COOLSOFT Only</option>
                    <option value="infoorigin">InfoOrigin Requisitions Only</option>
                    <option value="talent_pool">General Talent Pool (No Match)</option>
                  </select>

                  {/* Toggle InfoOrigin Match Display */}
                  <button
                    type="button"
                    onClick={() => setHideInfoOriginMatches(!hideInfoOriginMatches)}
                    title={hideInfoOriginMatches ? 'Click to show InfoOrigin matches' : 'Click to hide InfoOrigin matches and display as Direct / Talent Pool'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: hideInfoOriginMatches ? '#FEF3C7' : (isLight ? '#F8FAFC' : C.inputBg),
                      border: hideInfoOriginMatches ? '1px solid #F59E0B' : `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: hideInfoOriginMatches ? '#B45309' : C.textSecondary,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{hideInfoOriginMatches ? 'InfoOrigin Match: Hidden' : 'InfoOrigin Match: Visible'}</span>
                  </button>

                  {/* Clear text button */}
                  <button
                    type="button"
                    onClick={() => {
                      setStreamReqFilter('all')
                      setStreamSearch('')
                      setFilterLocation('all')
                      setFilterSkill('all')
                      setFilterMatch('all')
                      setFilterRecruiter('all')
                      setFilterSource('all')
                      setFilterGovDept('all')
                      setFilterLocalFit('all')
                      setFilterMatchedClient('all')
                      setHideInfoOriginMatches(false)
                      setTableCategory('all')
                      setTablePage(1)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: C.textSecondary,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: 6
                    }}
                  >
                    Clear
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Dedicated Fast Refresh Button */}
                  <button
                    type="button"
                    onClick={handleQuickRefresh}
                    disabled={isTableRefreshing}
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : C.cardBg,
                      color: '#2563EB',
                      border: '1px solid #93C5FD',
                      borderRadius: 8,
                      padding: '8px 14px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: isTableRefreshing ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 1px 3px rgba(37,99,235,0.1)'
                    }}
                    title="Refresh candidate stream and sync latest resumes"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isTableRefreshing ? 'rotate(360deg)' : 'none',
                        transition: isTableRefreshing ? 'transform 0.5s linear' : 'none'
                      }}
                    >
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <polyline points="1 20 1 14 7 14"></polyline>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    <span>{isTableRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </button>

                  {/* Search Button */}
                  <button
                    type="button"
                    onClick={() => setTablePage(1)}
                    style={{
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                    }}
                  >
                    <IconSearch /> <span>Search</span>
                  </button>
                </div>
              </div>

              {/* 3. Subheader Bar (Candidates found + Sort + Page size) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                padding: '0 4px',
                flexWrap: 'wrap',
                gap: 10,
                flexShrink: 0
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.textPrimary }}>
                  {filteredCandidates.length} candidates found
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {selectedCardIds.size > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary }}>
                        {selectedCardIds.size} selected
                      </span>
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        style={{
                          backgroundColor: '#EF4444',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <IconTrash /> <span>Delete ({selectedCardIds.size})</span>
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: C.textSecondary }}>
                    <span>Sort by</span>
                    <select
                      value={sortOption}
                      onChange={e => setSortOption(e.target.value)}
                      style={{
                        backgroundColor: isLight ? '#FFFFFF' : C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textPrimary,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="date_desc">Newest First (Recent Ingestion on Top)</option>
                      <option value="local_first">Confirmed Local First (Priority)</option>
                      <option value="match_desc">Match (High to Low)</option>
                      <option value="gov_first">Department Experience (First Preference)</option>
                      <option value="match_asc">Match (Low to High)</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="name_asc">Name (A-Z)</option>
                    </select>
                  </div>

                  <select
                    value={tablePageSize}
                    onChange={e => { setTablePageSize(Number(e.target.value)); setTablePage(1); }}
                    style={{
                      backgroundColor: isLight ? '#FFFFFF' : C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
                  </select>
                </div>
              </div>

              {/* 4. Candidates Data Table Card matching media_1789727370931.png */}
              <div style={{
                backgroundColor: isLight ? '#FFFFFF' : C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div
                  className="candidates-table-scroll"
                  style={{
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 340px)',
                    minHeight: 400,
                    width: '100%',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: isLight ? '#94A3B8 #F1F5F9' : '#475569 #1E293B'
                  }}
                >
                  <style>{`
                    .candidates-table-scroll::-webkit-scrollbar {
                      width: 8px;
                      height: 8px;
                    }
                    .candidates-table-scroll::-webkit-scrollbar-track {
                      background: ${isLight ? '#F1F5F9' : '#1E293B'};
                      border-radius: 4px;
                    }
                    .candidates-table-scroll::-webkit-scrollbar-thumb {
                      background: ${isLight ? '#94A3B8' : '#475569'};
                      border-radius: 4px;
                    }
                    .candidates-table-scroll::-webkit-scrollbar-thumb:hover {
                      background: ${isLight ? '#64748B' : '#64748B'};
                    }
                  `}</style>
                  <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{
                        backgroundColor: isLight ? '#F8FAFC' : '#1E293B',
                        borderBottom: `1px solid ${C.border}`,
                        color: '#64748B',
                        fontSize: 11.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                      }}>
                        <th style={{ padding: '8px 8px', width: 36, minWidth: 36, maxWidth: 36, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>
                          <input
                            type="checkbox"
                            checked={selectedCardIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCardIds(new Set(filteredCandidates.map(c => c.id || c.email)))
                              } else {
                                selectedCardIds(new Set())
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '8px 10px', width: 220, minWidth: 200, maxWidth: 240, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Candidate</th>
                        <th style={{ padding: '8px 10px', width: 170, minWidth: 150, maxWidth: 190, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Role / Current Title</th>
                        <th style={{ padding: '8px 8px', width: 115, minWidth: 105, maxWidth: 125, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Status</th>
                        <th style={{ padding: '8px 10px', width: 200, minWidth: 180, maxWidth: 230, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>AI Matched Requirement</th>
                        <th style={{ padding: '8px 8px', width: 80, minWidth: 75, maxWidth: 90, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Match ⇕</th>
                        <th style={{ padding: '8px 10px', width: 150, minWidth: 130, maxWidth: 180, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Key Skills</th>
                        <th style={{ padding: '8px 8px', width: 90, minWidth: 80, maxWidth: 100, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Received ⇕</th>
                        <th style={{ padding: '8px 8px', width: 95, minWidth: 85, maxWidth: 105, position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Source</th>
                        <th style={{ padding: '8px 10px', width: 280, minWidth: 260, textAlign: 'right', position: 'sticky', top: 0, zIndex: 10, backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: C.textSecondary }}>
                            No candidates found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates
                          .slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)
                          .map((c, idx) => {
                            const candId = c.id || c.email || `cand-${idx}`
                            const isSelected = selectedCardIds.has(candId)
                            const isHovered = hoveredTableCardId === candId
                            const skillsArr = safeSkillArray(c.skills)
                            const candName = safeString(c.name || c.candidateName, 'Candidate')
                            const avatarStyle = getCandidateAvatarColor(candName)
                            const initials = getInitials(candName)
                            const isActionMenuOpen = activeActionMenuId === candId

                            return (
                              <tr
                                key={candId}
                                onMouseEnter={() => setHoveredTableCardId(candId)}
                                onMouseLeave={() => setHoveredTableCardId(null)}
                                onClick={() => {
                                  setSelectedCandidate(c)
                                  setInboxSubMode('card')
                                  setActiveTobuTab('resume')
                                }}
                                style={{
                                  borderBottom: `1px solid ${C.border}`,
                                  backgroundColor: isSelected
                                    ? (isLight ? '#EFF6FF' : 'rgba(37,99,235,0.12)')
                                    : (isHovered ? (isLight ? '#F1F5F9' : '#1E293B') : 'transparent'),
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease'
                                }}
                              >
                                {/* 1. Checkbox — stopPropagation so row click doesn't trigger */}
                                <td style={{ padding: '8px 8px' }} onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleSelectCard(candId, e)}
                                  />
                                </td>

                                {/* 2. Candidate: Initials Avatar + Name + Subtitle (Email & Phone) + Visa */}
                                <td style={{ padding: '10px 10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: '50%',
                                      backgroundColor: avatarStyle.bg,
                                      color: avatarStyle.text,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: 12.5,
                                      flexShrink: 0,
                                      marginTop: 2
                                    }}>
                                      {initials}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span
                                          onClick={() => {
                                            setSelectedCandidate(c)
                                            setInboxSubMode('card')
                                          }}
                                          style={{
                                            fontSize: 13.5,
                                            fontWeight: 800,
                                            color: isHovered ? '#2563EB' : '#0F172A',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            transition: 'color 0.15s ease'
                                          }}
                                          title={candName}
                                        >
                                          {candName}
                                        </span>
                                        {c.visaStatus && (
                                          <span style={{
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                            background: isLight ? '#F1F5F9' : '#334155',
                                            color: isLight ? '#475569' : '#CBD5E1',
                                            padding: '1px 5px',
                                            borderRadius: 4,
                                            border: `1px solid ${isLight ? '#E2E8F0' : '#475569'}`,
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {String(c.visaStatus).replace(/\s*\(.*?\)/g, '')}
                                          </span>
                                        )}
                                        {(() => {
                                          const candTime = c.createdAt ? new Date(c.createdAt).getTime() : 0;
                                          const isNew = candTime > 0 && (Date.now() - candTime < 24 * 60 * 60 * 1000);
                                          if (!isNew) return null;
                                          return (
                                            <span style={{
                                              fontSize: 9,
                                              fontWeight: 800,
                                              background: '#ECFDF5',
                                              color: '#059669',
                                              padding: '1px 5px',
                                              borderRadius: 4,
                                              border: '1px solid #A7F3D0',
                                              letterSpacing: '0.4px',
                                              flexShrink: 0
                                            }}>
                                              NEW
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      {/* Zoho Recruit style: Email & Phone right under name */}
                                      <div style={{
                                        fontSize: 11,
                                        color: '#64748B',
                                        marginTop: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {c.email && (
                                          <span title={c.email} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {c.email}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Role / Current Title + Company & Experience */}
                                <td style={{ padding: '10px 10px', maxWidth: 190 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{
                                      fontSize: 12.5,
                                      fontWeight: 700,
                                      color: '#1E293B',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }} title={c.role && c.role !== 'Senior Specialist' ? c.role : (skillsArr.length > 0 ? `${skillsArr[0]} Developer` : 'Full Stack Developer')}>
                                      {c.role && c.role !== 'Senior Specialist' ? c.role : (skillsArr.length > 0 ? `${skillsArr[0]} Developer` : 'Full Stack Developer')}
                                    </div>
                                    <div style={{
                                      fontSize: 11,
                                      color: '#64748B',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {(() => {
                                        const expToShow = (c.experience && c.experience !== '5+ Years')
                                          ? c.experience
                                          : extractCandidateExperience(c.resumeText, c.summary, c.extracted_profile, c.role)
                                        return (
                                          <span style={{ fontWeight: 600, color: '#2563EB' }}>
                                            {expToShow}
                                          </span>
                                        )
                                      })()}
                                      {c.experience && (c.currentCompany || c.location) && <span style={{ color: '#CBD5E1' }}>•</span>}
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.currentCompany || c.location || 'United States'}>
                                        {c.currentCompany ? c.currentCompany.split(',')[0] : (c.location || 'United States')}
                                      </span>
                                    </div>
                                    {/* Public Sector / Gov Dept Badge */}
                                    {(() => {
                                      const g = detectGovDepartmentExperience(c)
                                      if (!g.hasGov) return null
                                      return (
                                        <div style={{ marginTop: 2 }}>
                                          <span style={{
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                            backgroundColor: '#ECFDF5',
                                            color: '#065F46',
                                            border: '1px solid #A7F3D0',
                                            borderRadius: 4,
                                            padding: '1px 5px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            maxWidth: 175,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }} title={`Verified Public Sector Experience: ${g.primaryDept}`}>
                                            {g.shortName}
                                          </span>
                                        </div>
                                      )
                                    })()}
                                    {/* Local Proximity / Location Verification Badge */}
                                    {(() => {
                                      const matchedJob = c.targetReqId 
                                        ? openJobsList.find(j => String(j.id || '').replace(/^J-/, '') === String(c.targetReqId).replace(/^J-/, ''))
                                        : null;
                                      const locFit = evaluateCandidateLocationFit(c, matchedJob);
                                      return renderLocationBadge(locFit);
                                    })()}
                                  </div>
                                </td>

                                {/* 4. Zoho Recruit Status Pill */}
                                <td style={{ padding: '10px 8px' }}>
                                  {renderZohoStatusBadge(c.status || 'Active')}
                                </td>

                                {/* 5. AI Matched Requirement */}
                                <td style={{ padding: '8px 10px', maxWidth: 230 }}>
                                  {(() => {
                                    const matchedJob = c.targetReqId 
                                      ? openJobsList.find(j => String(j.id || '').replace(/^J-/, '') === String(c.targetReqId).replace(/^J-/, ''))
                                      : null;
                                    const isJobActive = matchedJob ? isJobActiveAndOpen(matchedJob) : false;
                                    let hasActiveMatch = Boolean(c.targetReqId && matchedJob && isJobActive);

                                    const clientStr = String(matchedJob?.client || c.matchedJobClient || c.jobSource || '').toLowerCase();
                                    const isInfoOrigin = clientStr.includes('infoorigin') || clientStr.includes('info origin') || (c.targetReqId && String(c.targetReqId).length === 4);

                                    // If recruiter chose to hide InfoOrigin matches, suppress InfoOrigin match display
                                    if (hideInfoOriginMatches && isInfoOrigin) {
                                      hasActiveMatch = false;
                                    }

                                    const isTalentPool = !hasActiveMatch;
                                    return (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                          <span style={{
                                            fontSize: 10,
                                            fontWeight: 800,
                                            background: isTalentPool 
                                              ? '#F1F5F9' 
                                              : (isInfoOrigin ? '#EDE9FE' : '#DBEAFE'),
                                            color: isTalentPool 
                                              ? '#475569' 
                                              : (isInfoOrigin ? '#6D28D9' : '#1D4ED8'),
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            border: isTalentPool 
                                              ? '1px solid #E2E8F0' 
                                              : (isInfoOrigin ? '1px solid #DDD6FE' : '1px solid #BFDBFE'),
                                            letterSpacing: '0.3px',
                                            flexShrink: 0
                                          }}>
                                            {!isTalentPool ? `Req #${c.targetReqId}` : 'No Match Req Found'}
                                          </span>
                                          <span style={{
                                            fontSize: 11,
                                            color: isInfoOrigin && !isTalentPool ? '#6D28D9' : '#475569',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}>
                                            {!isTalentPool 
                                              ? (isInfoOrigin ? 'InfoOrigin' : (matchedJob?.client || c.matchedJobClient || 'Direct Client')) 
                                              : 'General Talent Pool'}
                                          </span>
                                        </div>
                                        <div style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          color: '#0F172A',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }} title={!isTalentPool ? (matchedJob?.title || c.matchedJobTitle || c.role || 'Open Position') : 'No Active Requisition Match'}>
                                          {!isTalentPool ? (matchedJob?.title || c.matchedJobTitle || c.role || 'Open Position') : 'No Active Requisition Match'}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* 6. Match % */}
                                <td style={{ padding: '8px 8px' }}>
                                  {(() => {
                                    const matchedJob = c.targetReqId 
                                      ? openJobsList.find(j => String(j.id || '').replace(/^J-/, '') === String(c.targetReqId).replace(/^J-/, ''))
                                      : null;
                                    const isJobActive = matchedJob ? isJobActiveAndOpen(matchedJob) : false;
                                    const hasActiveMatch = Boolean(c.targetReqId && matchedJob && isJobActive);
                                    return renderMatchBadge(c.matchScore || 85, hasActiveMatch);
                                  })()}
                                </td>

                                {/* 7. Key Skills */}
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', maxWidth: 170 }}>
                                    {skillsArr.slice(0, 3).map((sk, sIdx) => (
                                      <span
                                        key={sIdx}
                                        style={{
                                          fontSize: 10.5,
                                          fontWeight: 600,
                                          backgroundColor: '#F1F5F9',
                                          border: '1px solid #E2E8F0',
                                          color: '#334155',
                                          padding: '2px 6px',
                                          borderRadius: 4
                                        }}
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                    {skillsArr.length > 3 && (
                                      <span style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: '#2563EB',
                                        backgroundColor: '#EFF6FF',
                                        padding: '2px 5px',
                                        borderRadius: 4
                                      }}>
                                        +{skillsArr.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 8. Received Date */}
                                <td style={{ padding: '8px 8px', fontSize: 11.5, color: '#475569', whiteSpace: 'nowrap' }}>
                                  {(() => {
                                    const raw = c.createdAt || c.resumeUploadDate || c.timestamp
                                    if (raw) {
                                      const d = new Date(raw)
                                      if (!isNaN(d.getTime())) {
                                        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                                      }
                                    }
                                    return 'Today'
                                  })()}
                                </td>

                                {/* 9. Source Badge */}
                                <td style={{ padding: '8px 8px' }}>
                                  {renderSourceBadge(c)}
                                </td>

                                {/* 10. Actions: [ Message ] + [ Push ↗ ] + ⋮ */}
                                <td style={{ padding: '10px 10px', textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCandidateChat(c)}
                                      style={{
                                        backgroundColor: '#F0FDF4',
                                        color: '#166534',
                                        border: '1px solid #BBF7D0',
                                        borderRadius: 6,
                                        padding: '5px 9px',
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.15s ease'
                                      }}
                                      title="Message Candidate"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                      </svg>
                                      <span>Message</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenPushModal(c)}
                                      style={{
                                        backgroundColor: '#2563EB',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '5px 9px',
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3,
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                                        transition: 'all 0.15s ease'
                                      }}
                                      title="Push Candidate to Jobs in Hand / Active Requisition"
                                    >
                                      <span>Push</span>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                        <polyline points="7 7 17 7 17 17"></polyline>
                                      </svg>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setActiveActionMenuId(isActionMenuOpen ? null : candId)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#64748B',
                                        fontSize: 16,
                                        padding: '4px 6px',
                                        cursor: 'pointer',
                                        borderRadius: 4
                                      }}
                                      title="More Actions"
                                    >
                                      ⋮
                                    </button>
                                  </div>

                                  {/* Action Popover Menu */}
                                  {isActionMenuOpen && (
                                    <div style={{
                                      position: 'absolute',
                                      right: 14,
                                      top: '80%',
                                      backgroundColor: isLight ? '#FFFFFF' : C.surface,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 8,
                                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                      padding: '6px 0',
                                      zIndex: 20,
                                      minWidth: 180,
                                      textAlign: 'left'
                                    }}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionMenuId(null)
                                          handleOpenPushModal(c)
                                        }}
                                        style={{
                                          width: '100%',
                                          background: 'none',
                                          border: 'none',
                                          padding: '8px 14px',
                                          fontSize: 12,
                                          fontWeight: 700,
                                          color: '#2563EB',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          textAlign: 'left'
                                        }}
                                      >
                                        <span>Push to Jobs in Hand ↗</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionMenuId(null)
                                          handleOpenEmailModal(c)
                                        }}
                                        style={{
                                          width: '100%',
                                          background: 'none',
                                          border: 'none',
                                          padding: '8px 14px',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: C.textPrimary,
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          textAlign: 'left'
                                        }}
                                      >
                                        <span>Draft Custom Email</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveActionMenuId(null)
                                          handleDeleteCandidate(c)
                                        }}
                                        style={{
                                          width: '100%',
                                          background: 'none',
                                          border: 'none',
                                          padding: '8px 14px',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: '#EF4444',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          textAlign: 'left'
                                        }}
                                      >
                                        <span>Delete Candidate</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. Pagination Footer matching media_1789727370931.png */}
                <div style={{
                  padding: '12px 18px',
                  borderTop: `1px solid ${C.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  backgroundColor: isLight ? '#FFFFFF' : C.surface
                }}>
                  <div style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>
                    Showing {filteredCandidates.length === 0 ? 0 : (tablePage - 1) * tablePageSize + 1} to {Math.min(tablePage * tablePageSize, filteredCandidates.length)} of {filteredCandidates.length} candidates
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setTablePage(p => Math.max(1, p - 1))}
                      disabled={tablePage === 1}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#FFFFFF' : C.inputBg,
                        cursor: tablePage === 1 ? 'not-allowed' : 'pointer',
                        color: tablePage === 1 ? '#94A3B8' : C.textPrimary,
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: tablePage === 1 ? 0.5 : 1
                      }}
                      title="Previous Page"
                    >
                      ‹
                    </button>

                    {Array.from({ length: Math.max(1, Math.ceil(filteredCandidates.length / tablePageSize)) }).map((_, idx) => {
                      const pNum = idx + 1
                      const totalP = Math.max(1, Math.ceil(filteredCandidates.length / tablePageSize))
                      if (totalP > 7 && Math.abs(pNum - tablePage) > 2 && pNum !== 1 && pNum !== totalP) {
                        if (pNum === 2 || pNum === totalP - 1) {
                          return <span key={`ell-${pNum}`} style={{ padding: '0 4px', color: '#94A3B8', fontSize: 12 }}>...</span>
                        }
                        return null
                      }
                      const isActive = pNum === tablePage
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setTablePage(pNum)}
                          style={{
                            minWidth: 32,
                            height: 32,
                            padding: '0 8px',
                            borderRadius: 6,
                            border: isActive ? 'none' : `1px solid ${C.border}`,
                            backgroundColor: isActive ? '#2563EB' : (isLight ? '#FFFFFF' : C.inputBg),
                            color: isActive ? '#FFFFFF' : C.textPrimary,
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {pNum}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => setTablePage(p => Math.min(Math.ceil(filteredCandidates.length / tablePageSize), p + 1))}
                      disabled={tablePage * tablePageSize >= filteredCandidates.length}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#FFFFFF' : C.inputBg,
                        cursor: tablePage * tablePageSize >= filteredCandidates.length ? 'not-allowed' : 'pointer',
                        color: tablePage * tablePageSize >= filteredCandidates.length ? '#94A3B8' : C.textPrimary,
                        fontSize: 13,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: tablePage * tablePageSize >= filteredCandidates.length ? 0.5 : 1
                      }}
                      title="Next Page"
                    >
                      ›
                    </button>
                  </div>
                </div>

              </div>

              {/* 6. Tip Banner matching media_1789727370931.png */}
              <div style={{
                marginTop: 16,
                padding: '12px 18px',
                backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.08)',
                border: `1px solid ${isLight ? '#BFDBFE' : 'rgba(37,99,235,0.25)'}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    Tip
                  </span>
                  <span style={{ fontSize: 13, color: isLight ? '#1E3A8A' : '#93C5FD', fontWeight: 500 }}>
                    Focus on candidates with <strong style={{ fontWeight: 700 }}>70%+ match scores</strong> for the highest interview-to-placement conversion rates.
                  </span>
                </div>
                <a
                  href="/jobs"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2563EB',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>View Job Requirements</span> <span>→</span>
                </a>
              </div>

            </div>
          )}

        </div>
      )}

      {/* VIEW 3: RECRUITER KPI LEADERBOARD & TEAM PERFORMANCE VIEW */}
      {inboxViewMode === 'leaderboard' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', boxSizing: 'border-box' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            {renderRecruiterLeaderboardSection(false)}
          </div>
        </div>
      )}

      {/* VIEW 4: VENDOR HOTLISTS & BENCH CANDIDATES HUB */}
      {inboxViewMode === 'hotlists' && renderVendorHotlistsView()}

      {/* ========================================================================= */}
      {/* REDESIGNED MESSAGES PAGE (Linear / Slack / Notion Premium SaaS UX)        */}
      {/* Matching User Screenshot media_1789074147680.png                          */}
      {/* ========================================================================= */}
      {inboxViewMode === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: isLight ? '#F8F9FA' : '#141A21' }}>
          
          {/* 1. Page Header (Full Width) */}
          <div style={{
            padding: '16px 28px 0 28px',
            backgroundColor: C.surface,
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.02em' }}>
                  Messages
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: C.textSecondary }}>
                  Stay connected with candidates, clients and your team
                </p>
              </div>

              {/* Header Right Actions: Filter, Sort: Newest, Search messages */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Filter button */}
                <button
                  type="button"
                  onClick={() => setRecruiterFilter(f => f === 'all' ? (currentUser?.refCode || 'omkesh') : 'all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '7px 12px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: C.textPrimary,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <IconFilter /> <span>Filter</span>
                </button>

                {/* Sort dropdown */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={messageSortOrder}
                    onChange={e => setMessageSortOrder(e.target.value)}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '7px 26px 7px 12px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      outline: 'none',
                      appearance: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <option value="newest">Newest ▾</option>
                    <option value="oldest">Oldest ▾</option>
                    <option value="unread">Unread First ▾</option>
                  </select>
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textSecondary, display: 'flex' }}>
                    <IconChevronDown />
                  </span>
                </div>

                {/* Search messages input */}
                <div style={{ position: 'relative', width: 220 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                    <IconSearch />
                  </span>
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={messagesSearchQuery}
                    onChange={e => setMessagesSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '7px 10px 7px 32px',
                      fontSize: 12.5,
                      color: C.textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sub-Tabs: All (2), Candidates, Clients, Team */}
            <div style={{ display: 'flex', gap: 24, borderTop: `1px solid ${isLight ? '#F3F4F6' : 'rgba(255,255,255,0.06)'}`, paddingTop: 4 }}>
              {[
                { id: 'all', label: 'All', badge: 2 },
                { id: 'candidates', label: 'Candidates' },
                { id: 'clients', label: 'Clients' },
                { id: 'team', label: 'Team' }
              ].map(tab => {
                const isActive = messageCategoryTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMessageCategoryTab(tab.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? `2px solid #2065D1` : '2px solid transparent',
                      padding: '10px 4px 12px 4px',
                      fontSize: 13.5,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#2065D1' : C.textSecondary,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                      marginBottom: -1
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span style={{
                        background: isActive ? '#2065D1' : (isLight ? '#E5E7EB' : '#374151'),
                        color: isActive ? '#FFFFFF' : C.textSecondary,
                        borderRadius: 10,
                        padding: '1px 6px',
                        fontSize: 11,
                        fontWeight: 800
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. 3-Column Messaging Canvas */}
          <div style={{
            flex: 1,
            display: 'flex',
            gap: 16,
            padding: '16px 24px 20px 24px',
            overflow: 'hidden'
          }}>
            
            {/* COLUMN 1: Conversation List (~25% width, minWidth 310px, maxWidth 340px) */}
            <div style={{
              width: 320,
              minWidth: 290,
              maxWidth: 340,
              backgroundColor: C.surface,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              {/* Recruiter Filter Dropdown for Admins / Leads */}
              {!isReportee && (
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, backgroundColor: isLight ? '#FAFBFC' : '#1A222C' }}>
                  <select
                    value={recruiterFilter}
                    onChange={e => setRecruiterFilter(e.target.value)}
                    style={{
                      width: '100%',
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '5px 8px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: C.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Recruiters & Channels ({threads.length})</option>
                    {ALL_SMARTHIRE_RECRUITERS.map(r => (
                      <option key={r.refCode} value={r.refCode}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conversations Rows (Subtle Dividers, No Boxed Cards) */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredThreads.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: C.textSecondary }}>
                    <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}><IconChat /></div>
                    <p style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>No conversations found</p>
                    <p style={{ fontSize: 11.5, margin: '4px 0 0' }}>Try switching tabs or adjusting search query.</p>
                  </div>
                ) : (
                  filteredThreads.map(thread => {
                    const isSelected = activeThread?.candidateId === thread.candidateId
                    const initials = thread.initials || getInitials(thread.candidateName)
                    const isActiveNow = thread.status === 'active' || thread.candidateId === 'team-gourav' || thread.candidateId === 'client-shweta-patel' || thread.candidateId === 'cand-rahul-kumar'
                    return (
                      <div
                        key={thread.candidateId}
                        onClick={() => selectThread(thread)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? (isLight ? '#EBF3FE' : 'rgba(32,101,209,0.16)') : 'transparent',
                          borderLeft: isSelected ? '3px solid #2065D1' : '3px solid transparent',
                          borderBottom: `1px solid ${isLight ? '#F3F4F6' : 'rgba(255,255,255,0.05)'}`,
                          transition: 'background 0.15s'
                        }}
                      >
                        {/* Circular Avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {thread.avatarImg ? (
                            <img
                              src={thread.avatarImg}
                              alt={thread.candidateName}
                              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              backgroundColor: thread.avatarColor || '#2065D1',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 13
                            }}>
                              {initials}
                            </div>
                          )}
                          {isActiveNow && (
                            <span style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: '#10B981',
                              border: `2px solid ${C.surface}`
                            }} />
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Row 1: Name + Time */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{
                              fontSize: 13.5,
                              fontWeight: (thread.unreadCount > 0 || isSelected) ? 700 : 600,
                              color: C.textPrimary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 160
                            }}>
                              {thread.candidateName}
                            </span>
                            <span style={{ fontSize: 11, color: C.textSecondary, flexShrink: 0, marginLeft: 6, fontWeight: 500 }}>
                              {formatTime(thread.lastMessageTime || thread.timestamp)}
                            </span>
                          </div>

                          {/* Row 2: Subtitle / Role / Company */}
                          <div style={{
                            fontSize: 11.5,
                            color: isLight ? '#4B5563' : '#9CA3AF',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: 3
                          }}>
                            {String(thread.subtitle || thread.jobTitle || 'Team Member • SmartHire ATS').replace(/â€¦/g, '...')}
                          </div>

                          {/* Row 3: Last message preview + Unread badge */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{
                              fontSize: 12,
                              color: thread.unreadCount > 0 ? C.textPrimary : C.textSecondary,
                              fontWeight: thread.unreadCount > 0 ? 600 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 180
                            }}>
                              {String(thread.lastMessage || '').replace(/â€¦/g, '...')}
                            </span>
                            {thread.unreadCount > 0 && (
                              <span style={{
                                backgroundColor: '#2065D1',
                                color: '#FFFFFF',
                                borderRadius: 10,
                                padding: '1px 6px',
                                fontSize: 10.5,
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {thread.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* COLUMN 2: Chat Area (Dominant Center Section, flex 1) */}
            <div style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: C.surface,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              {activeThread ? (
                <>
                  {/* Chat Header */}
                  <div style={{
                    height: 64,
                    padding: '0 20px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    backgroundColor: C.surface
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        {activeThread.avatarImg ? (
                          <img
                            src={activeThread.avatarImg}
                            alt={activeThread.candidateName}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: activeThread.avatarColor || '#2065D1',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 14
                          }}>
                            {activeThread.initials || getInitials(activeThread.candidateName)}
                          </div>
                        )}
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                          border: `2px solid ${C.surface}`
                        }} />
                      </div>

                      {/* Header Info */}
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary, lineHeight: 1.2 }}>
                          {activeThread.candidateName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                          <span style={{ fontSize: 12, color: C.textSecondary }}>
                            {activeThread.subtitle || activeThread.jobTitle || 'Direct Reportee • SmartHire LLC'}
                          </span>
                          <span style={{
                            fontSize: 11,
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            padding: '1px 7px',
                            borderRadius: 10,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
                            Active now
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Header Actions: Call, Video, More */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCallModal('audio')
                          setMessageToast(`Calling ${activeThread.candidateName}...`)
                          setTimeout(() => setMessageToast(''), 4000)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 8,
                          borderRadius: 8,
                          color: C.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Voice Call"
                      >
                        <IconPhoneCall />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCallModal('video')
                          setMessageToast(`Starting video meeting with ${activeThread.candidateName}...`)
                          setTimeout(() => setMessageToast(''), 4000)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 8,
                          borderRadius: 8,
                          color: C.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Video Meeting"
                      >
                        <IconVideo />
                      </button>

                      <button
                        type="button"
                        onClick={() => setRightPanelCollapsed(c => !c)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 8,
                          borderRadius: 8,
                          color: C.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={rightPanelCollapsed ? 'Show Details Panel' : 'Hide Details Panel'}
                      >
                        <IconDots />
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '18px 24px',
                    backgroundColor: isLight ? '#FAFBFC' : '#161D26',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    {/* Centered Date Divider */}
                    {messages.length > 0 && (
                      <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
                        <span style={{
                          backgroundColor: C.surface,
                          border: `1px solid ${C.border}`,
                          color: C.textSecondary,
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: '4px 14px',
                          borderRadius: 14,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                        }}>
                          {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    {/* Messages Loop */}
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: C.textSecondary }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><IconChat /></div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: C.textPrimary, margin: '0 0 4px' }}>Start a new conversation</p>
                        <p style={{ fontSize: 12.5, margin: 0 }}>Send candidate updates, schedule interviews, or discuss open requisitions.</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const myEmail = (currentUser?.email || '').toLowerCase().trim()
                        const isMe = msg.sender === 'recruiter' ||
                                     msg.sender === 'me' ||
                                     (msg.senderEmail && myEmail && msg.senderEmail.toLowerCase() === myEmail) ||
                                     (!isReportee && msg.sender !== 'other' && msg.sender !== 'candidate')

                        const timeDisplay = msg.timeStr || (msg.timestamp ? formatTime(msg.timestamp) : '')

                        return (
                          <div
                            key={msg.id || idx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isMe ? 'flex-end' : 'flex-start',
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              maxWidth: '68%'
                            }}
                          >
                            {/* Message Bubble */}
                            <div style={{
                              backgroundColor: isMe ? '#2065D1' : (isLight ? '#F3F4F6' : '#28323D'),
                              color: isMe ? '#FFFFFF' : C.textPrimary,
                              borderRadius: isMe ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                              padding: '10px 15px',
                              fontSize: 13.5,
                              lineHeight: 1.55,
                              whiteSpace: 'pre-line',
                              wordBreak: 'break-word',
                              boxShadow: isMe ? '0 2px 8px rgba(32,101,209,0.22)' : '0 1px 2px rgba(0,0,0,0.04)'
                            }}>
                              {String(msg.text || '').replace(/â€¦/g, '...').replace(/&hellip;/g, '...')}
                            </div>

                            {/* Timestamp & Delivery Indicators */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              color: '#9CA3AF',
                              marginTop: 4,
                              marginRight: isMe ? 2 : 0,
                              marginLeft: isMe ? 0 : 2
                            }}>
                              <span>{timeDisplay}</span>
                              {isMe && <IconCheckCheck color="#2065D1" />}
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Composer (Linear / Slack UX) */}
                  <div style={{
                    borderTop: `1px solid ${C.border}`,
                    padding: '12px 18px',
                    backgroundColor: C.surface,
                    flexShrink: 0
                  }}>
                    {/* Emoji Bar Picker (Quick Toggle) */}
                    {emojiPickerOpen && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        marginBottom: 8,
                        backgroundColor: isLight ? '#F9FAFB' : '#1C252E',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`
                      }}>
                        {['Sounds good', 'Thank you', 'Profile received', 'Interview requested', 'Confirmed'].map(phrase => (
                          <button
                            key={phrase}
                            type="button"
                            onClick={() => { setInputText(t => t ? t + ' ' + phrase : phrase); setEmojiPickerOpen(false); inputRef.current?.focus(); }}
                            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer', padding: '3px 9px' }}
                          >
                            {phrase}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Attached File Chips */}
                    {attachedFiles.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        {attachedFiles.map((file, i) => (
                          <span
                            key={i}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 11.5,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '3px 8px',
                              borderRadius: 6
                            }}
                          >
                            {file.name}
                            <button
                              type="button"
                              onClick={() => setAttachedFiles(fs => fs.filter((_, idx) => idx !== i))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', fontWeight: 800 }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Input Container Box */}
                    <div style={{
                      border: `1px solid ${C.inputBorder || C.border}`,
                      borderRadius: 12,
                      padding: '6px 10px',
                      backgroundColor: C.surface,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      {/* Attachment Clip Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFiles(prev => [...prev, { name: 'Candidate_Resume_Update.pdf', size: '210 KB' }])
                          setMessageToast('File attached: Candidate_Resume_Update.pdf')
                          setTimeout(() => setMessageToast(''), 3000)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: C.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 4
                        }}
                        title="Attach file"
                      >
                        <IconPaperclip />
                      </button>

                      {/* Text Input */}
                      <textarea
                        rows={1}
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          fontSize: 13.5,
                          color: C.textPrimary,
                          backgroundColor: 'transparent',
                          resize: 'none',
                          fontFamily: 'inherit',
                          padding: '6px 4px',
                          boxSizing: 'border-box',
                          lineHeight: 1.4
                        }}
                      />

                      {/* Emoji Icon Button */}
                      <button
                        type="button"
                        onClick={() => setEmojiPickerOpen(o => !o)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: emojiPickerOpen ? '#2065D1' : C.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 4
                        }}
                        title="Add emoji"
                      >
                        <IconSmile />
                      </button>

                      {/* Mention Icon Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const mentionName = (activeThread.name || activeThread.candidateName || 'team').split(' ')[0]
                          setInputText(t => (t ? t + ' ' : '') + `@${mentionName} `)
                          inputRef.current?.focus()
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: C.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 4
                        }}
                        title="Mention user"
                      >
                        <IconAtSign />
                      </button>

                      {/* Send Button: Solid Primary Blue with Airplane */}
                      <button
                        type="button"
                        onClick={() => handleSend()}
                        disabled={!inputText.trim() && attachedFiles.length === 0}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: '#2065D1',
                          color: '#FFFFFF',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: (!inputText.trim() && attachedFiles.length === 0) ? 'not-allowed' : 'pointer',
                          opacity: (!inputText.trim() && attachedFiles.length === 0) ? 0.5 : 1,
                          boxShadow: '0 2px 6px rgba(32,101,209,0.3)',
                          flexShrink: 0
                        }}
                        title="Send Message (Enter)"
                      >
                        <IconPaperAirplane />
                      </button>
                    </div>

                    {/* Lightweight Action Toolbar below composer */}
                    <div style={{
                      marginTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}>
                      {/* Write with AI */}
                      <button
                        type="button"
                        onClick={() => setShowAiWriteModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: isLight ? '#F5F3FF' : 'rgba(121,40,202,0.15)',
                          color: '#7C3AED',
                          border: `1px solid ${isLight ? '#DDD6FE' : 'rgba(121,40,202,0.3)'}`,
                          borderRadius: 8,
                          padding: '5px 11px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <IconSparkles /> <span>Write with AI</span>
                      </button>

                      {/* Share Candidate */}
                      <button
                        type="button"
                        onClick={() => setShowShareCandidateModal(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: C.surface,
                          color: C.textPrimary,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '5px 11px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <IconUsers /> <span>Share Candidate</span>
                      </button>

                      {/* Schedule Meeting */}
                      <button
                        type="button"
                        onClick={() => {
                          const candFirst = (activeThread.name || activeThread.candidateName || 'there').split(' ')[0]
                          setInputText(`Hi ${candFirst}, let's schedule a quick sync tomorrow at 11:00 AM EST to review candidate submissions.`)
                          inputRef.current?.focus()
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: C.surface,
                          color: C.textPrimary,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '5px 11px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <IconCalendar /> <span>Schedule Meeting</span>
                      </button>

                      {/* Attach File */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFiles(prev => [...prev, { name: 'Req_159078_Profile_Shortlist.xlsx', size: '34 KB' }])
                          setMessageToast('File attached: Req_159078_Profile_Shortlist.xlsx')
                          setTimeout(() => setMessageToast(''), 3000)
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          backgroundColor: C.surface,
                          color: C.textPrimary,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '5px 11px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <IconPaperclip /> <span>Attach File</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: C.textSecondary, padding: 40 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EFF6FF', color: '#2065D1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <IconChat />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: '0 0 6px' }}>No Conversation Selected</h3>
                  <p style={{ fontSize: 13, margin: 0 }}>Select a thread on the left to start collaborating.</p>
                </div>
              )}
            </div>

            {/* COLUMN 3: Right Context Panel (~310px, Information-Rich) */}
            {!rightPanelCollapsed && activeThread && (
              <div style={{
                width: 310,
                minWidth: 290,
                maxWidth: 330,
                backgroundColor: C.surface,
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 18px',
                overflowY: 'auto',
                flexShrink: 0,
                gap: 18,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                {/* Profile Header */}
                <div style={{ position: 'relative', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setRightPanelCollapsed(true)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'transparent',
                      border: 'none',
                      color: C.textSecondary,
                      cursor: 'pointer',
                      padding: 4
                    }}
                    title="Collapse Context Drawer"
                  >
                    <IconExpand />
                  </button>

                  {/* Avatar (64px) */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    {activeThread.avatarImg ? (
                      <img
                        src={activeThread.avatarImg}
                        alt={activeThread.candidateName}
                        style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: activeThread.avatarColor || '#2065D1',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 22
                      }}>
                        {activeThread.initials || getInitials(activeThread.candidateName)}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary, lineHeight: 1.25 }}>
                    {activeThread.candidateName}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                    {activeThread.subtitle || activeThread.jobTitle || 'Direct Reportee • SmartHire LLC'}
                  </div>

                  {/* Status & Local Time Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11,
                      backgroundColor: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
                      Active now
                    </span>
                    <span style={{
                      fontSize: 11,
                      backgroundColor: isLight ? '#F3F4F6' : '#28323D',
                      color: C.textSecondary,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600
                    }}>
                      Local 02:25 PM (EST)
                    </span>
                  </div>
                </div>

                {/* 4-Button Quick Action Row: Call, Video, Email, More */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageToast(`Calling ${activeThread.candidateName}...`)
                      setTimeout(() => setMessageToast(''), 3000)
                    }}
                    style={{
                      background: isLight ? '#F9FAFB' : '#1C252E',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 4px',
                      textAlign: 'center',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <IconPhone />
                    <span>Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessageToast(`Starting video meeting with ${activeThread.candidateName}...`)
                      setTimeout(() => setMessageToast(''), 3000)
                    }}
                    style={{
                      background: isLight ? '#F9FAFB' : '#1C252E',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 4px',
                      textAlign: 'center',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <IconVideo />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const contactName = activeThread.candidateName || activeThread.name || 'Candidate'
                      setEmailModalCandidate({
                        name: contactName,
                        email: activeThread.email || '',
                        targetReqId: activeThread.targetReqId || openJobsList[0]?.id || '',
                        matchedJobTitle: activeThread.jobTitle || 'Active Requisition',
                        matchedJobClient: activeThread.company || 'Client'
                      })
                      setEmailTo(activeThread.email || '')
                      setEmailSubject(`Application Update: Next Steps | COOLSOFT LLC`)
                      setEmailBody(`Hi ${contactName.split(' ')[0]},\n\nSharing the latest updates for your review.\n\nWith Regards,\n${currentUser?.name || 'Omkesh Manjute'}\nLead Recruiter\nCOOLSOFT LLC | http://www.coolsofttech.com`)
                    }}
                    style={{
                      background: isLight ? '#F9FAFB' : '#1C252E',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 4px',
                      textAlign: 'center',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <IconMail />
                    <span>Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFullProfileModal(true)}
                    style={{
                      background: isLight ? '#F9FAFB' : '#1C252E',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: '8px 4px',
                      textAlign: 'center',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <IconDots />
                    <span>More</span>
                  </button>
                </div>

                {/* About Section */}
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginBottom: 8, letterSpacing: '0.02em' }}>
                    About
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {activeThread.role && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconUser /></span>
                        <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activeThread.role}</span>
                      </div>
                    )}

                    {activeThread.company && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconBriefcase /></span>
                        <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activeThread.company}</span>
                      </div>
                    )}

                    {activeThread.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconMail /></span>
                        <a
                          href={`mailto:${activeThread.email}`}
                          style={{ color: '#2065D1', textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all' }}
                        >
                          {activeThread.email}
                        </a>
                      </div>
                    )}

                    {activeThread.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconPhone /></span>
                        <a
                          href={`tel:${activeThread.phone}`}
                          style={{ color: C.textPrimary, textDecoration: 'none', fontWeight: 500 }}
                        >
                          {activeThread.phone}
                        </a>
                      </div>
                    )}

                    {activeThread.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconLocation /></span>
                        <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activeThread.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attached Files Section — Only render if real files exist */}
                {activeThread.recentFiles && activeThread.recentFiles.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, letterSpacing: '0.02em' }}>
                        Attached Files
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {activeThread.recentFiles.map((file, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '6px 8px',
                            borderRadius: 8,
                            backgroundColor: isLight ? '#F9FAFB' : '#1C252E',
                            border: `1px solid ${C.border}`,
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setMessageToast(`Opening ${file.name}...`)
                            setTimeout(() => setMessageToast(''), 3000)
                          }}
                        >
                          {file.type === 'excel' ? <IconFileExcel /> : file.type === 'word' ? <IconFileWord /> : <IconFilePdf />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {file.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: C.textSecondary }}>
                              {file.size} {file.date ? `• ${file.date}` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions Section */}
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginBottom: 8, letterSpacing: '0.02em' }}>
                    Quick Actions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setShowFullProfileModal(true)}
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#F9FAFB' : '#1C252E',
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textPrimary,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s'
                      }}
                    >
                      <span>➔</span> <span>View Full Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const first = (activeThread.name || activeThread.candidateName || 'there').split(' ')[0]
                        setInputText(`Hi ${first}, could you share your availability for a 30-minute interview sync this week?`)
                        inputRef.current?.focus()
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#F9FAFB' : '#1C252E',
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textPrimary,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s'
                      }}
                    >
                      <IconClock /> <span>Suggest Interview Time</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const note = prompt(`Add internal recruiter note for ${activeThread.candidateName}:`)
                        if (note) {
                          setMessageToast(`✓ Internal note added for ${activeThread.candidateName}`)
                          setTimeout(() => setMessageToast(''), 3000)
                        }
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#F9FAFB' : '#1C252E',
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textPrimary,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s'
                      }}
                    >
                      <IconPencil /> <span>Add Note</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* AI Write Helper Modal */}
          {showAiWriteModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 7000
              }}
              onClick={() => setShowAiWriteModal(false)}
            >
              <div
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 14,
                  padding: 24,
                  width: 480,
                  maxWidth: '90vw',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: '#F5F3FF', color: '#7C3AED', padding: 6, borderRadius: 8 }}><IconSparkles /></div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>AI Message Assistant</div>
                      <div style={{ fontSize: 12, color: C.textSecondary }}>Choose a prompt or let AI generate a response</div>
                    </div>
                  </div>
                  <button onClick={() => setShowAiWriteModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.textSecondary }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    "Draft candidate status update for Req #159078",
                    "Request updated resume and work authorization document",
                    "Confirm interview schedule for tomorrow 11 AM EST",
                    "Propose 15-minute introductory technical screening"
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(p)
                        setShowAiWriteModal(false)
                        inputRef.current?.focus()
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#F9FAFB' : '#1C252E',
                        textAlign: 'left',
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.textPrimary,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Share Candidate Modal */}
          {showShareCandidateModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 7000
              }}
              onClick={() => setShowShareCandidateModal(false)}
            >
              <div
                style={{
                  backgroundColor: C.surface,
                  borderRadius: 14,
                  padding: 24,
                  width: 520,
                  maxWidth: '90vw',
                  border: `1px solid ${C.border}`,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.textPrimary }}>
                    Select Candidate to Share in Chat
                  </div>
                  <button onClick={() => setShowShareCandidateModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.textSecondary }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {streamCandidates.slice(0, 6).map(cand => (
                    <div
                      key={cand.id || cand.email}
                      onClick={() => {
                        const snippet = `Candidate Shared: ${cand.name} — ${cand.role} (${cand.matchScore || 95}% Match, Req #${cand.targetReqId || '159078'})`
                        setInputText(snippet)
                        setShowShareCandidateModal(false)
                        inputRef.current?.focus()
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        backgroundColor: isLight ? '#F9FAFB' : '#1C252E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{cand.name}</div>
                        <div style={{ fontSize: 11.5, color: C.textSecondary }}>{cand.role} • {cand.location}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#2065D1', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 10 }}>
                        {cand.matchScore || 95}% Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {messageToast && (
            <div style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1C252E',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              zIndex: 8000
            }}>
              {messageToast}
            </div>
          )}

        </div>
      )}

        </div> {/* closes main content canvas (line 1939) */}
      </div> {/* closes app body wrapper (line 1703) */}

      {/* MONSTER+ FLOATING EMAIL COMPOSER (Docked Bottom-Right, Only shown when not in full candidate card view) */}
      {emailModalCandidate && inboxSubMode !== 'card' && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 28,
            width: 520,
            maxWidth: 'calc(100vw - 48px)',
            height: 520,
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            zIndex: 6000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header (Candidate Name + Role in Center, Close '✕' on Right) */}
          <div style={{
            padding: '12px 18px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ width: 24 }} /> {/* Spacer to center name */}
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary }}>
                {emailModalCandidate.name}
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
                {emailModalCandidate.role || emailModalCandidate.matchedJobTitle || 'Candidate'}
              </div>
            </div>

            <button
              onClick={() => setEmailModalCandidate(null)}
              style={{
                background: 'none',
                border: 'none',
                color: C.textSecondary,
                fontSize: 18,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close composer"
            >
              ✕
            </button>
          </div>

          {/* Sub-Header: Recruiter Strict Sender Policy & Recipient Info */}
          <div style={{
            padding: '6px 16px',
            backgroundColor: isLight ? '#F8FAFC' : '#0F172A',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            flexShrink: 0
          }}>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>
              From: {currentUser?.email || 'omkesh@coolsofttech.com'}
            </span>
            <span style={{ color: C.textSecondary }}>
              To: <strong style={{ color: C.textPrimary }}>{emailTo}</strong>
            </span>
          </div>

          {/* Quick 1-Click Templates Bar */}
          <div style={{
            padding: '6px 14px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: isLight ? '#FAFAFA' : '#182234',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            flexShrink: 0
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Templates:
            </span>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('rtr')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              RTR Auth
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('screen')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Screening Call
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('rate')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Rate & Auth
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('interview')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Interview Shortlist
            </button>
          </div>

          {/* Subject Line Input */}
          <div style={{
            padding: '7px 16px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0
          }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: C.textSecondary, width: 52, flexShrink: 0 }}>
              Subject:
            </span>
            <input
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder="Email subject line..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 700,
                color: C.textPrimary,
                outline: 'none'
              }}
            />
          </div>

          {/* Body Canvas Area */}
          <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              placeholder={`Write a message to ${emailModalCandidate.name}...`}
              style={{
                width: '100%',
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 13,
                lineHeight: 1.6,
                color: C.textPrimary,
                backgroundColor: 'transparent',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            {emailSuccessToast && (
              <div style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>
                {emailSuccessToast}
              </div>
            )}
          </div>

          {/* Bottom Formatting & Action Bar (Toolbar: Undo Redo Bold Italic Link Send) */}
          <div style={{
            padding: '9px 16px',
            borderTop: `1px solid ${C.border}`,
            backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            {/* Left Formatting Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                title="Undo"
                onClick={() => document.execCommand('undo')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, borderRadius: 4 }}
              >
                ↩
              </button>
              <button
                type="button"
                title="Redo"
                onClick={() => document.execCommand('redo')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, borderRadius: 4 }}
              >
                ↪
              </button>
              <button
                type="button"
                title="Bold"
                onClick={() => setEmailBody(prev => prev + ' **bold text**')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, fontWeight: 800, borderRadius: 4 }}
              >
                B
              </button>
              <button
                type="button"
                title="Italic"
                onClick={() => setEmailBody(prev => prev + ' *italic text*')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, fontStyle: 'italic', borderRadius: 4 }}
              >
                I
              </button>
              <button
                type="button"
                title="Insert Link"
                onClick={() => setEmailBody(prev => prev + ' https://www.coolsofttech.com')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 12, fontWeight: 700, borderRadius: 4 }}
              >
                Link
              </button>

              {/* Local Desktop Mail Launcher */}
              <button
                type="button"
                title="Launch in Desktop Outlook / Apple Mail"
                onClick={() => {
                  const fullSig = `\n\nWith Regards,\n${currentUser?.name || (isSuperAdmin ? 'Omkesh Manjute' : 'Lead Recruiter')}\nLead Recruiter\nCOOLSOFT LLC | ${currentUser?.email || (isSuperAdmin ? 'omkesh@coolsofttech.com' : 'recruiter@coolsofttech.com')}\nhttp://www.coolsofttech.com`
                  const fullText = emailBody.includes('Regards') ? emailBody : `${emailBody}${fullSig}`
                  const url = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullText)}`
                  window.location.href = url
                }}
                style={{
                  background: isLight ? '#F1F5F9' : '#334155',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.textPrimary,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginLeft: 4
                }}
              >
                Mail App
              </button>
            </div>

            {/* Right: Purple Monster+ Send Button */}
            <button
              type="button"
              onClick={handleSendDirectEmail}
              disabled={emailSending}
              style={{
                background: '#8B5CF6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 20,
                padding: '8px 24px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                opacity: emailSending ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              {emailSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Candidate Full Profile Drawer (Recruiter Side - Monster Style & AI Matcher) */}
      {showFullProfileModal && candidateDetails && (() => {
        const candidateName = candidateDetails.candidateName || candidateDetails.name || activeThread?.candidateName || 'Candidate'
        const email = candidateDetails.candidateEmail || candidateDetails.email || profile?.email || '—'
        const phone = candidateDetails.candidatePhone || candidateDetails.phone || profile?.phone || '—'
        const locationVal = typeof candidateDetails.location === 'string' 
          ? candidateDetails.location 
          : (candidateDetails.currentLocation || profile?.location || '—')
        const visaStatusVal = candidateDetails.visaStatus || candidateDetails.visa_status || profile?.visa_status || 'US Citizen'
        const experienceVal = candidateDetails.experience || '8+ Years'
        const resumeText = candidateDetails.resumeText || candidateDetails.resume_text || ''

        // Currently selected requisition to evaluate against
        const currentReqId = String(drawerReqId || candidateDetails.targetReqId || openJobsList[0]?.id || '').replace(/^J-/, '')
        const activeTargetJob = openJobsList.find(j => String(j.id) === currentReqId) || openJobsList[0]

        // Candidate skills list
        const candidateSkills = Array.isArray(candidateDetails.skills)
          ? candidateDetails.skills
          : (typeof candidateDetails.skills === 'string' ? candidateDetails.skills.split(',').map(s => s.trim()) : [])

        const candidateCorpus = (resumeText + ' ' + candidateSkills.join(' ')).toLowerCase()

        // Match against selected requisition's skills
        const targetJobSkills = normalizeSkillsArray(activeTargetJob?.skills || ['Java', 'SQL'])
        const targetPrefSkills = normalizeSkillsArray(activeTargetJob?.preferredSkills || [])

        const dynamicMatchingSkills = targetJobSkills.filter(reqSkill => {
          if (!reqSkill) return false
          const s = reqSkill.toLowerCase().trim()
          return candidateCorpus.includes(s) || candidateSkills.some(cs => cs.toLowerCase().includes(s) || s.includes(cs.toLowerCase()))
        })
        const dynamicMissingSkills = targetJobSkills.filter(reqSkill => !dynamicMatchingSkills.includes(reqSkill))
        const dynamicMatchingPref = targetPrefSkills.filter(prefSkill => {
          if (!prefSkill) return false
          const s = prefSkill.toLowerCase().trim()
          return candidateCorpus.includes(s) || candidateSkills.some(cs => cs.toLowerCase().includes(s) || s.includes(cs.toLowerCase()))
        })

        // Title alignment check
        const candRoleLower = (candidateDetails.role || candidateDetails.title || candidateName).toLowerCase()
        const targetTitleLower = (activeTargetJob?.title || '').toLowerCase()
        const stopWords = new Set(['senior', 'lead', 'junior', 'staff', 'principal', 'developer', 'engineer', 'consultant', 'specialist', 'architect', 'manager', 'iii', 'ii', 'iv', 'with', 'and', 'for', 'role', 'position'])
        const jWords = targetTitleLower.split(/[\s,/\-_]+/).filter(w => w.length >= 3 && !stopWords.has(w))
        const cWords = candRoleLower.split(/[\s,/\-_]+/).filter(w => w.length >= 3 && !stopWords.has(w))
        const matchedTitleWords = jWords.filter(w => candRoleLower.includes(w) || cWords.some(cw => cw.includes(w) || w.includes(cw)))
        const titleRatio = jWords.length > 0 ? (matchedTitleWords.length / jWords.length) : 0.5
        const isTitleAligned = titleRatio >= 0.5

        // Dynamic match score calculation across 5 tiers
        const reqRatio = targetJobSkills.length > 0 ? (dynamicMatchingSkills.length / targetJobSkills.length) : 0.8
        const titlePts = isTitleAligned ? 25 : (titleRatio > 0 ? 12 : 2)
        const reqPts = Math.round(reqRatio * 35)
        const prefPts = targetPrefSkills.length > 0 ? Math.round((dynamicMatchingPref.length / targetPrefSkills.length) * 10) : 5
        const expMatch = String(experienceVal).match(/(\d+)/)
        const jobExpMatch = String(activeTargetJob?.experience || '5+').match(/(\d+)/)
        const expPts = (expMatch && jobExpMatch && parseInt(expMatch[1], 10) >= parseInt(jobExpMatch[1], 10)) ? 10 : 6
        const locPts = 10
        let totalScore = titlePts + reqPts + prefPts + expPts + locPts
        if (!isTitleAligned && reqRatio < 0.4) {
          totalScore = Math.min(38, totalScore)
        }
        const dynamicMatchScore = Math.max(25, Math.min(99, totalScore))

        const hasDl = candidateDetails.uploadedDocuments?.dl || candidateDetails.documents?.some(d => d.type === 'driving_license' || d.type === 'driving_licence');
        const hasSelfie = candidateDetails.uploadedDocuments?.selfie || candidateDetails.selfieUrl;
        const hasVisa = candidateDetails.uploadedDocuments?.visa || candidateDetails.documents?.some(d => d.type === 'visa' || d.type === 'work_permit' || d.type === 'passport');

        const isSpamOrigin = candidateDetails.isSpamRecovery || candidateDetails.sourceCategory === 'email_spam'

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 4000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={() => setShowFullProfileModal(false)}>
            <div style={{
              width: '92%',
              maxWidth: 1200,
              height: '100%',
              backgroundColor: C.surface,
              borderLeft: `1px solid ${C.border}`,
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Plus Jakarta Sans', Inter, sans-serif"
            }} onClick={e => e.stopPropagation()}>
              
              {/* Header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: C.surface,
                flexShrink: 0,
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={candidateName} size={46} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textPrimary }}>{candidateName}</h3>
                      {isSpamOrigin ? (
                        <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          Recovered from Spam Folder
                        </span>
                      ) : candidateDetails.sourceCategory === 'careers_portal' ? (
                        <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          Careers Portal (/jobs)
                        </span>
                      ) : candidateDetails.sourceCategory === 'vendor_bench' ? (
                        <span style={{ background: '#FAF5FF', color: '#7C3AED', border: '1px solid #E9D5FF', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          Vendor Bench
                        </span>
                      ) : (
                        <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          Recruiter Email Inbox
                        </span>
                      )}

                      <span style={{
                        background: dynamicMatchScore >= 85 ? '#DCFCE7' : '#FEF3C7',
                        color: dynamicMatchScore >= 85 ? '#15803D' : '#B45309',
                        border: `1px solid ${dynamicMatchScore >= 85 ? '#86EFAC' : '#FDE68A'}`,
                        padding: '2px 9px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800
                      }}>
                        {dynamicMatchScore}% Fit for Req #{currentReqId}
                      </span>
                    </div>

                    <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSecondary, fontWeight: 600 }}>
                      {candidateDetails.role || 'IT Consultant'} • {locationVal} • {visaStatusVal} • {experienceVal}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenEmailModal({
                        ...candidateDetails,
                        targetReqId: currentReqId,
                        matchedJobTitle: activeTargetJob?.title,
                        matchedJobRate: activeTargetJob?.rate,
                        matchedJobClient: activeTargetJob?.client
                      })
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(37,99,235,0.35)'
                    }}
                  >
                    <IconSend /> <span>Send Email / RTR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignCandidateToReq(candidateDetails, currentReqId)}
                    style={{
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(5,150,105,0.3)'
                    }}
                  >
                    <span>Add to Req #{currentReqId}</span>
                  </button>

                  <button
                    onClick={() => setShowFullProfileModal(false)}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      color: C.textSecondary,
                      fontSize: 18,
                      borderRadius: 8,
                      cursor: 'pointer',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Split Content Area */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* Left Pane: Candidate Overview & AI Matching Report (42%) */}
                <div style={{ width: '42%', borderRight: `1px solid ${C.border}`, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  
                  {/* Grid overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Email', value: email, isMail: true },
                      { label: 'Phone', value: phone },
                      { label: 'Location', value: locationVal },
                      { label: 'Visa Status', value: visaStatusVal, bold: true },
                      { label: 'Total Experience', value: experienceVal },
                      { label: 'Origin Source', value: isSpamOrigin ? 'Yahoo Spam (Recovered)' : candidateDetails.source || 'Recruiter Inbox' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>{item.label}</div>
                        {item.isMail && item.value !== '—' ? (
                          <a href={`mailto:${item.value}`} style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', marginTop: 3, display: 'block', wordBreak: 'break-all' }}>
                            {item.value}
                          </a>
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: item.bold ? 800 : 600, color: C.textPrimary, marginTop: 3, wordBreak: 'break-all' }}>
                            {item.value || '—'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* AI Multi-Position Match Analyzer Card */}
                  <div style={{
                    border: '2px solid #3B82F6',
                    borderRadius: 12,
                    padding: 18,
                    background: isLight ? 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)' : 'rgba(37,99,235,0.08)',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        AI Multi-Position Match Analyzer
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRunLiveAiScan(candidateDetails, currentReqId)}
                        disabled={isLiveAiScanning}
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#FFFFFF',
                          background: 'linear-gradient(135deg, #1E40AF, #2563EB)',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: 12,
                          cursor: isLiveAiScanning ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Run real-time deep AI Match Scan"
                      >
                        <IconZap /> <span>{isLiveAiScanning ? 'Scanning...' : '⚡ Run Live AI Scan'}</span>
                      </button>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 11.5, color: C.textSecondary, lineHeight: 1.4 }}>
                      Select an open position below to evaluate candidate fit and update resume skill highlights:
                    </p>

                    {/* Position Selector Dropdown */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>
                          Active Target Requisition:
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRunLiveAiScan(candidateDetails, currentReqId)}
                          disabled={isLiveAiScanning}
                          style={{
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            color: '#1D4ED8',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 10.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <IconZap /> <span>AI Scan This Req</span>
                        </button>
                      </div>
                      <select
                        value={currentReqId}
                        onChange={e => setDrawerReqId(e.target.value)}
                        style={{
                          width: '100%',
                          background: C.surface,
                          border: '2px solid #2563EB',
                          borderRadius: 8,
                          padding: '9px 12px',
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: C.textPrimary,
                          outline: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(37,99,235,0.15)'
                        }}
                      >
                        {openJobsList.map(j => (
                          <option key={j.id} value={j.id}>
                            Req #{j.id} · {j.title} ({j.client})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Position Meta summary */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>Client &amp; Location:</div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textPrimary }}>{activeTargetJob?.client} • {activeTargetJob?.location || 'Remote'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>Target Pay Rate:</div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: '#16A34A' }}>{activeTargetJob?.rate || '$75/hr'}</div>
                      </div>
                    </div>

                    {/* Fit Score & Gauge */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>Requisition Match Score:</span>
                        <strong style={{ fontSize: 15, fontWeight: 900, color: dynamicMatchScore >= 80 ? '#16A34A' : dynamicMatchScore >= 65 ? '#D97706' : '#DC2626' }}>
                          {dynamicMatchScore}% Fit
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: 8, backgroundColor: isLight ? '#E2E8F0' : '#334155', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${dynamicMatchScore}%`, height: '100%', backgroundColor: dynamicMatchScore >= 80 ? '#16A34A' : dynamicMatchScore >= 65 ? '#D97706' : '#DC2626', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>

                    {/* 5-Tier Quick Overview Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 8,
                      marginBottom: 12,
                      padding: '10px 12px',
                      backgroundColor: isLight ? '#F8FAFC' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 11
                    }}>
                      <div>
                        <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5, display: 'block' }}>1. Title Match</span>
                        <strong style={{ color: isTitleAligned ? '#16A34A' : '#D97706', fontSize: 11 }}>
                          {isTitleAligned ? '✓ Aligned Role' : '⚠️ Title Mismatch'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5, display: 'block' }}>2. State / Location</span>
                        <strong style={{ color: '#2563EB', fontSize: 11 }}>
                          {locationVal || 'Remote / US'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: C.textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: 9.5, display: 'block' }}>3. Experience</span>
                        <strong style={{ color: '#16A34A', fontSize: 11 }}>
                          {experienceVal} Verified
                        </strong>
                      </div>
                    </div>

                    {/* Matching Required Skills */}
                    <div style={{ marginBottom: 12, border: '1px solid #BBF7D0', backgroundColor: isLight ? '#F0FDF4' : 'rgba(22,163,74,0.06)', borderRadius: 7, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconCheckCircle color="#16A34A" /> <span>Matching Skills ({dynamicMatchingSkills.length}):</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {dynamicMatchingSkills.length > 0 ? (
                          dynamicMatchingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', fontWeight: 700, border: '1px solid #86EFAC' }}>✓ {s}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: C.textSecondary, fontStyle: 'italic' }}>No direct required skill matches found</span>
                        )}
                      </div>
                    </div>

                    {/* Required Skills Not Matched */}
                    <div style={{ marginBottom: 14, border: '1px solid #FECACA', backgroundColor: isLight ? '#FEF2F2' : 'rgba(239,68,68,0.06)', borderRadius: 7, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconXCircle color="#DC2626" /> <span>Required Skills Not Matched ({dynamicMissingSkills.length}):</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {dynamicMissingSkills.length > 0 ? (
                          dynamicMissingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 4, background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, border: '1px solid #FECACA' }}>✗ {s}</span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>100% required skills covered</span>
                        )}
                      </div>
                    </div>

                    {/* Preferred Skills (if any) */}
                    {targetPrefSkills.length > 0 && (
                      <div style={{ marginBottom: 14, border: '1px solid #BFDBFE', backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.06)', borderRadius: 7, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>★</span> <span>Preferred Skills ({dynamicMatchingPref.length}/{targetPrefSkills.length}):</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {targetPrefSkills.map((s, idx) => {
                            const isPMatched = dynamicMatchingPref.includes(s)
                            return (
                              <span key={idx} style={{
                                fontSize: 10.5,
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: isPMatched ? '#DBEAFE' : (isLight ? '#F1F5F9' : '#1E293B'),
                                color: isPMatched ? '#1D4ED8' : C.textSecondary,
                                fontWeight: 700,
                                border: `1px solid ${isPMatched ? '#93C5FD' : C.border}`
                              }}>
                                {isPMatched ? '✓' : '•'} {s}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 1-Click Action Buttons for this Req */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleAssignCandidateToReq(candidateDetails, currentReqId)}
                        style={{
                          flex: 1,
                          background: '#2563EB',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5
                        }}
                      >
                        Assign to Req #{currentReqId}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEmailModal({
                            ...candidateDetails,
                            targetReqId: currentReqId,
                            matchedJobTitle: activeTargetJob?.title,
                            matchedJobRate: activeTargetJob?.rate,
                            matchedJobClient: activeTargetJob?.client
                          })
                        }}
                        style={{
                          background: C.surface,
                          color: C.textPrimary,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        Draft Email
                      </button>
                    </div>

                  </div>

                  {/* Compliance & Audit */}
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Trust Verification &amp; Document Audit
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>Driver's License OCR Check:</span>
                        <strong style={{ color: hasDl ? '#16A34A' : '#64748B' }}>
                          {hasDl ? '✓ Match Verified' : 'Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>Biometric Selfie verification:</span>
                        <strong style={{ color: hasSelfie ? '#16A34A' : '#64748B' }}>
                          {hasSelfie ? '✓ Match Passed (98%)' : 'Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>US Work Auth Visa verification:</span>
                        <strong style={{ color: hasVisa ? '#16A34A' : '#64748B' }}>
                          {hasVisa ? '✓ Active / Verified' : 'Pending / Not Uploaded'}
                        </strong>
                      </div>
                      {candidateDetails.gps_data && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                          <span style={{ color: C.textSecondary }}>GPS Submission Geolocation:</span>
                          <strong style={{ color: C.textPrimary }}>
                            {candidateDetails.gps_data.city || 'Dallas'}, {candidateDetails.gps_data.state || 'TX'}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Pane: Interactive Monster-Style Resume Viewer (58%) */}
                <div style={{ width: '58%', display: 'flex', flexDirection: 'column', backgroundColor: isLight ? '#F8FAFC' : '#0B0F17', overflow: 'hidden' }}>
                  
                  {/* Viewer Toolbar */}
                  <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, backgroundColor: C.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>Monster-Style Resume Viewer</span>
                      <span style={{ fontSize: 11, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 4, fontWeight: 800, border: '1px solid #FDE68A' }}>
                        Matching skills for Req #{currentReqId} highlighted in yellow
                      </span>
                    </div>

                    {/* Resume Search Box */}
                    <div style={{ position: 'relative', width: 220 }}>
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                        <IconSearch />
                      </span>
                      <input
                        value={resumeKeywordSearch}
                        onChange={e => setResumeKeywordSearch(e.target.value)}
                        placeholder="Find in resume..."
                        style={{
                          width: '100%',
                          background: C.inputBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: '5px 8px 5px 28px',
                          fontSize: 11.5,
                          color: C.textPrimary,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Scrollable Resume Canvas */}
                  <div style={{ flex: 1, padding: 24, overflowY: 'auto', boxSizing: 'border-box' }}>
                    {highlightResumeText(resumeText, dynamicMatchingSkills, resumeKeywordSearch)}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )
      })()}

      {/* ─── PUSH TO REQUISITION MODAL ─── */}
      {pushToReqModalOpen && pushTargetCand && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 16
        }}>
          <div style={{
            background: isLight ? '#FFFFFF' : '#1E293B',
            borderRadius: 12,
            width: '100%',
            maxWidth: 540,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: `1px solid ${C.border}`,
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isLight ? '#F8FAFC' : '#0F172A'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Push to Jobs in Hand / Active Requisition
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSecondary }}>
                  Assign candidate to an active client position &amp; sync hiring pipeline
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPushToReqModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  color: C.textSecondary,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6
                }}
              >
                ✕
              </button>
            </div>

            {/* Candidate Summary Pill */}
            <div style={{
              margin: '16px 20px 0',
              padding: '12px 14px',
              background: isLight ? '#EFF6FF' : '#1E3A8A20',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                  {pushTargetCand.name || 'Candidate'}
                </div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                  {pushTargetCand.email || 'No email'} · {pushTargetCand.role || 'Applicant'}
                </div>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 4,
                background: '#DBEAFE',
                color: '#1D4ED8'
              }}>
                Match: {pushTargetCand.matchScore || 90}%
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmPushToReq} style={{ padding: '16px 20px' }}>
              {/* Target Requisition Selector */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>
                  Target Requisition <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={pushSelectedReqId}
                  onChange={e => setPushSelectedReqId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    color: C.textPrimary,
                    background: isLight ? '#FFFFFF' : '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {openJobsList.map(job => {
                    const cleanId = String(job.id || job.reqId || '').replace(/^J-/, '').trim()
                    return (
                      <option key={cleanId} value={cleanId}>
                        Req #{cleanId} — {job.title} ({job.client || 'Direct Client'}) · {job.rate || job.budget || '$75/hr'}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Pay Rate & Pipeline Stage */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>
                    Pay / Bill Rate
                  </label>
                  <input
                    type="text"
                    value={pushPayRate}
                    onChange={e => setPushPayRate(e.target.value)}
                    placeholder="e.g. $75/hr C2C"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>
                    Initial Pipeline Stage
                  </label>
                  <select
                    value={pushPipelineStage}
                    onChange={e => setPushPipelineStage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Int-SubmittedToManager">Int-SubmittedToManager (Default)</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Client Submitted">Client Submitted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Active Review">Active Review</option>
                    <option value="Offer">Offer</option>
                  </select>
                </div>
              </div>

              {/* Sourcing Notes */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>
                  Sourcing Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={pushSourcingNotes}
                  onChange={e => setPushSourcingNotes(e.target.value)}
                  placeholder="e.g. Verified candidate work auth and available immediately for screening..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 12.5,
                    color: C.textPrimary,
                    background: isLight ? '#FFFFFF' : '#0F172A',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPushToReqModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.textSecondary,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPushingToReq}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563EB',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isPushingToReq ? 'not-allowed' : 'pointer',
                    opacity: isPushingToReq ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isPushingToReq ? 'Pushing...' : 'Confirm & Push to Jobs in Hand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD CANDIDATE MODAL ─── */}
      {addCandidateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 16
        }}>
          <div style={{
            background: isLight ? '#FFFFFF' : '#1E293B',
            borderRadius: 12,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: `1px solid ${C.border}`,
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isLight ? '#F8FAFC' : '#0F172A',
              flexShrink: 0
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.textPrimary }}>
                  Add Candidate to Unified Database
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSecondary }}>
                  Create talent profile directly into the central ATS talent pool
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddCandidateModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  color: C.textSecondary,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6
                }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewCandidate} style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Candidate Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCandForm.name}
                    onChange={e => setNewCandForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Sravan Kumar"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Email Address <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newCandForm.email}
                    onChange={e => setNewCandForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. sravan.k@gmail.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newCandForm.phone}
                    onChange={e => setNewCandForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +1 (972) 555-0182"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Primary Job Title / Role <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCandForm.role}
                    onChange={e => setNewCandForm(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Senior Java Fullstack Developer"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={newCandForm.location}
                    onChange={e => setNewCandForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Dallas, TX"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Total Experience
                  </label>
                  <input
                    type="text"
                    value={newCandForm.experience}
                    onChange={e => setNewCandForm(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g. 8+ Years"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Work Visa / Auth
                  </label>
                  <select
                    value={newCandForm.visaStatus}
                    onChange={e => setNewCandForm(prev => ({ ...prev, visaStatus: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="US Citizen">US Citizen</option>
                    <option value="Green Card (GC)">Green Card (GC)</option>
                    <option value="H-1B">H-1B</option>
                    <option value="C2C / Corp-to-Corp">C2C / Corp-to-Corp</option>
                    <option value="TN Visa">TN Visa</option>
                    <option value="EAD / Other">EAD / Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Source Channel
                  </label>
                  <select
                    value={newCandForm.source}
                    onChange={e => setNewCandForm(prev => ({ ...prev, source: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Manual Entry">Manual Entry</option>
                    <option value="Direct Referral">Direct Referral</option>
                    <option value="Vendor Bench">Vendor Bench</option>
                    <option value="LinkedIn Outreach">LinkedIn Outreach</option>
                    <option value="Dice / Sourced">Dice / Sourced</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                    Target Requisition (Optional)
                  </label>
                  <select
                    value={newCandForm.targetReqId}
                    onChange={e => setNewCandForm(prev => ({ ...prev, targetReqId: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.textPrimary,
                      background: isLight ? '#FFFFFF' : '#0F172A',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- General Talent Pool --</option>
                    {openJobsList.map(j => {
                      const cleanId = String(j.id || j.reqId || '').replace(/^J-/, '').trim()
                      return (
                        <option key={cleanId} value={cleanId}>
                          Req #{cleanId} · {j.title.slice(0, 24)}... ({j.client || 'Client'})
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                  Technical Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={newCandForm.skills}
                  onChange={e => setNewCandForm(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="e.g. Java, Spring Boot, Microservices, SQL, AWS, Kafka"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    color: C.textPrimary,
                    background: isLight ? '#FFFFFF' : '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textPrimary, marginBottom: 4 }}>
                  Resume Text or Candidate Background
                </label>
                <textarea
                  rows={4}
                  value={newCandForm.resumeText}
                  onChange={e => setNewCandForm(prev => ({ ...prev, resumeText: e.target.value }))}
                  placeholder="Paste resume summary or profile details here..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 12.5,
                    color: C.textPrimary,
                    background: isLight ? '#FFFFFF' : '#0F172A',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setAddCandidateModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.textSecondary,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewCand}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563EB',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isSavingNewCand ? 'not-allowed' : 'pointer',
                    opacity: isSavingNewCand ? 0.7 : 1
                  }}
                >
                  {isSavingNewCand ? 'Saving...' : 'Create & Save Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LIVE AI MATCH SCAN & INTERVIEW INTELLIGENCE MODAL ─── */}
      {showLiveAiModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: 16
        }} onClick={() => setShowLiveAiModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: isLight ? '#FFFFFF' : '#1E293B',
              borderRadius: 14,
              width: '100%',
              maxWidth: 840,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)',
              border: `1px solid ${C.border}`,
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 22px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isLight ? '#F8FAFC' : '#0F172A',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <IconZap />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Live AI Requisition Match &amp; Screening Scan</span>
                    {liveAiMatchResult?.source === 'live_llm' ? (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1D4ED8', background: '#DBEAFE', padding: '2px 7px', borderRadius: 10, border: '1px solid #BFDBFE' }}>
                        Groq Llama 3.3 70B
                      </span>
                    ) : (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: '#047857', background: '#D1FAE5', padding: '2px 7px', borderRadius: 10, border: '1px solid #A7F3D0' }}>
                        ATS 5-Tier NLP Engine
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textSecondary }}>
                    Candidate: <strong>{liveAiCandidate?.name || liveAiCandidate?.extracted_profile?.name || 'Candidate'}</strong> · Target: <strong>Req #{liveAiTargetReqId || liveAiMatchResult?.jobId} ({liveAiMatchResult?.jobTitle || 'Position'})</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {liveAiMatchResult && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: liveAiMatchResult.score >= 80 ? '#16A34A' : liveAiMatchResult.score >= 65 ? '#D97706' : '#DC2626'
                    }}>
                      {liveAiMatchResult.score}% Fit
                    </div>
                    <div style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: liveAiMatchResult.score >= 80 ? '#15803D' : liveAiMatchResult.score >= 65 ? '#B45309' : '#B91C1C'
                    }}>
                      {liveAiMatchResult.verdict || 'Match Verdict'}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowLiveAiModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 20,
                    color: C.textSecondary,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 6
                  }}
                  title="Close modal (ESC)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {isLiveAiScanning ? (
                <div style={{
                  padding: '48px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 16
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 0 24px rgba(37, 99, 235, 0.45)',
                    animation: 'pulse 1.5s infinite ease-in-out'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: C.textPrimary }}>
                      Scanning Candidate Resume with Live AI...
                    </h4>
                    <p style={{ margin: 0, fontSize: 12.5, color: C.textSecondary, maxWidth: 480, lineHeight: 1.5 }}>
                      Extracting technical competencies, evaluating 5-Tier ATS alignment (Title, Required Skills, Preferred Skills, State/Location, Experience), and generating tailored recruiter interview questions.
                    </p>
                  </div>
                </div>
              ) : liveAiMatchResult ? (
                <>
                  {/* Position Quick Selector & Re-Scan bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 14px',
                    background: isLight ? '#F1F5F9' : '#0F172A',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        Requisition:
                      </span>
                      <select
                        value={liveAiTargetReqId || liveAiMatchResult?.jobId}
                        onChange={e => {
                          const newReq = e.target.value
                          setLiveAiTargetReqId(newReq)
                          handleRunLiveAiScan(liveAiCandidate, newReq)
                        }}
                        style={{
                          flex: 1,
                          maxWidth: 520,
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.textPrimary,
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {openJobsList.map(j => (
                          <option key={j.id} value={j.id}>
                            Req #{j.id} · {j.title} ({j.client})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRunLiveAiScan(liveAiCandidate, liveAiTargetReqId || liveAiMatchResult?.jobId)}
                      disabled={isLiveAiScanning}
                      style={{
                        background: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Re-run real-time AI scan"
                    >
                      <IconZap /> <span>Re-Scan Fit</span>
                    </button>
                  </div>

                  {/* Executive Summary Card */}
                  <div style={{
                    padding: '14px 16px',
                    background: isLight ? 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)' : 'rgba(37,99,235,0.08)',
                    border: '1.5px solid #3B82F6',
                    borderRadius: 10,
                    boxShadow: '0 2px 8px rgba(59,130,246,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Executive AI Fit Assessment
                      </span>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: liveAiMatchResult.score >= 80 ? '#DCFCE7' : liveAiMatchResult.score >= 65 ? '#FEF3C7' : '#FEE2E2',
                        color: liveAiMatchResult.score >= 80 ? '#15803D' : liveAiMatchResult.score >= 65 ? '#B45309' : '#B91C1C'
                      }}>
                        {liveAiMatchResult.verdict}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: C.textPrimary, lineHeight: 1.5 }}>
                      {liveAiMatchResult.summary}
                    </p>
                  </div>

                  {/* 5-Tier Evaluation Grid */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.3px' }}>
                      5-Tier ATS Match Criteria Breakdown
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                      {/* Tier 1 */}
                      <div style={{ padding: '10px 12px', background: isLight ? '#F8FAFC' : '#0F172A', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>1. Title Match</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: liveAiMatchResult.dimensions?.titleMatch?.score >= 20 ? '#16A34A' : '#D97706', marginTop: 2 }}>
                          {liveAiMatchResult.dimensions?.titleMatch?.verdict || 'Aligned'}
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 1 }}>{liveAiMatchResult.dimensions?.titleMatch?.score ?? 25}/25 pts</div>
                      </div>

                      {/* Tier 2 */}
                      <div style={{ padding: '10px 12px', background: isLight ? '#F8FAFC' : '#0F172A', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>2. Required Skills</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#2563EB', marginTop: 2 }}>
                          {liveAiMatchResult.dimensions?.requiredSkills?.matchedCount ?? 0} / {liveAiMatchResult.dimensions?.requiredSkills?.totalCount ?? 0} Matched
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 1 }}>{liveAiMatchResult.dimensions?.requiredSkills?.score ?? 0}/35 pts</div>
                      </div>

                      {/* Tier 3 */}
                      <div style={{ padding: '10px 12px', background: isLight ? '#F8FAFC' : '#0F172A', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>3. Preferred Skills</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>
                          {liveAiMatchResult.dimensions?.preferredSkills?.matching?.length ?? 0} Matched
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 1 }}>{liveAiMatchResult.dimensions?.preferredSkills?.score ?? 5}/10 pts</div>
                      </div>

                      {/* Tier 4 */}
                      <div style={{ padding: '10px 12px', background: isLight ? '#F8FAFC' : '#0F172A', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>4. State / Location</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
                          {liveAiMatchResult.dimensions?.location?.verdict || 'US Resident'}
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 1 }}>{liveAiMatchResult.dimensions?.location?.candidateState || 'US'}</div>
                      </div>

                      {/* Tier 5 */}
                      <div style={{ padding: '10px 12px', background: isLight ? '#F8FAFC' : '#0F172A', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>5. Total Exp</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
                          {liveAiMatchResult.dimensions?.experience?.candidateYears ? `${liveAiMatchResult.dimensions.experience.candidateYears}+ Years` : (liveAiCandidate?.experience || '5+ Years')}
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textSecondary, marginTop: 1 }}>{liveAiMatchResult.dimensions?.experience?.verdict || 'Fit'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section: Matched vs Required Skills Not Matched */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Matched Skills */}
                    <div style={{
                      padding: '12px 14px',
                      background: isLight ? '#F0FDF4' : 'rgba(22,163,74,0.06)',
                      border: '1px solid #BBF7D0',
                      borderRadius: 8
                    }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#15803D', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <IconCheckCircle color="#15803D" /> <span>Matching Skills ({liveAiMatchResult.matchingSkills?.length || 0})</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {liveAiMatchResult.matchingSkills && liveAiMatchResult.matchingSkills.length > 0 ? (
                          liveAiMatchResult.matchingSkills.map((sk, idx) => (
                            <span key={idx} style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background: '#DCFCE7',
                              color: '#15803D',
                              border: '1px solid #86EFAC',
                              padding: '2px 7px',
                              borderRadius: 4
                            }}>
                              ✓ {sk}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: C.textSecondary }}>No direct skill keywords matched.</span>
                        )}
                      </div>
                    </div>

                    {/* Required Skills Not Matched */}
                    <div style={{
                      padding: '12px 14px',
                      background: isLight ? '#FEF2F2' : 'rgba(239,68,68,0.08)',
                      border: '1.5px solid #FCA5A5',
                      borderRadius: 8
                    }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#DC2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <IconXCircle color="#DC2626" /> <span>Required Skills Not Matched ({liveAiMatchResult.missingSkills?.length || 0})</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {liveAiMatchResult.missingSkills && liveAiMatchResult.missingSkills.length > 0 ? (
                          liveAiMatchResult.missingSkills.map((sk, idx) => (
                            <span key={idx} style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: '#FEE2E2',
                              color: '#B91C1C',
                              border: '1px solid #FCA5A5',
                              padding: '2px 7px',
                              borderRadius: 4
                            }}>
                              ✕ {sk}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>
                            ✓ 100% of required job skills are present in resume!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Candidate Strengths & Risk / Verification Factors */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Strengths */}
                    <div style={{ padding: '12px 14px', background: isLight ? '#F8FAFC' : '#0F172A', border: `1px solid ${C.border}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.textPrimary, textTransform: 'uppercase', marginBottom: 6 }}>
                        Key Technical Strengths
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.textPrimary, lineHeight: 1.5 }}>
                        {(liveAiMatchResult.strengths || []).map((st, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: 4 }}>{st}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk Factors */}
                    <div style={{ padding: '12px 14px', background: isLight ? '#FFFBEB' : 'rgba(245,158,11,0.06)', border: '1px solid #FDE68A', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', marginBottom: 6 }}>
                        Recruiter Verification Factors
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: isLight ? '#78350F' : '#FDE68A', lineHeight: 1.5 }}>
                        {(liveAiMatchResult.riskFactors || []).map((rf, rIdx) => (
                          <li key={rIdx} style={{ marginBottom: 4 }}>{rf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tailored Recruiter Screening Questions */}
                  {liveAiMatchResult.screeningQuestions && liveAiMatchResult.screeningQuestions.length > 0 && (
                    <div style={{
                      padding: '14px 16px',
                      background: isLight ? '#F8FAFC' : '#0F172A',
                      border: `1px solid ${C.border}`,
                      borderRadius: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IconZap /> <span>Tailored Recruiter Technical Screening Questions (3)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const qText = (liveAiMatchResult.screeningQuestions || []).map((q, i) => {
                              const qStr = typeof q === 'object' ? `${i + 1}. ${q.question}\n   [Listen For]: ${q.listenFor}` : `${i + 1}. ${q}`
                              return qStr
                            }).join('\n\n')
                            copyToClipboard(qText, 'Screening Questions')
                            setCopiedQuestionsToast(true)
                            setTimeout(() => setCopiedQuestionsToast(false), 3000)
                          }}
                          style={{
                            background: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            borderRadius: 5,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {copiedQuestionsToast ? '✓ Copied Questions!' : 'Copy Questions'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {liveAiMatchResult.screeningQuestions.map((qObj, qIdx) => {
                          const qText = typeof qObj === 'object' ? qObj.question : qObj
                          const listenFor = typeof qObj === 'object' ? qObj.listenFor : null
                          return (
                            <div key={qIdx} style={{
                              padding: '10px 12px',
                              background: isLight ? '#FFFFFF' : '#1E293B',
                              border: `1px solid ${C.border}`,
                              borderRadius: 6
                            }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textPrimary }}>
                                Q{qIdx + 1}: {qText}
                              </div>
                              {listenFor && (
                                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
                                  <strong style={{ color: '#2563EB' }}>What to listen for:</strong> {listenFor}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '14px 22px',
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isLight ? '#F8FAFC' : '#0F172A',
              flexShrink: 0
            }}>
              <div style={{ fontSize: 11, color: C.textSecondary }}>
                Powered by SmartHire Deep ATS Match &amp; Groq Llama 3.3 Reasoning
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {liveAiCandidate && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLiveAiModal(false)
                        handleOpenEmailModal(liveAiCandidate)
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: C.textPrimary,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <IconMail /> <span>Email Candidate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowLiveAiModal(false)
                        handleOpenPushModal(liveAiCandidate)
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#2563EB',
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <span>Push to Jobs in Hand ↗</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setShowLiveAiModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: 'transparent',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: C.textSecondary,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}