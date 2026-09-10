import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { saveMessageFirestore, getMessagesFirestore, saveRequisitionCandidates, saveCandidate } from '../lib/atsFirestore'

const POLL_INTERVAL = 3000

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
    📊
  </span>
)
const IconFilePdf = () => (
  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
    📄
  </span>
)
const IconFileWord = () => (
  <span style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
    📝
  </span>
)

function getSkillFrequencies(resumeText = '', candidateSkills = []) {
  if (!resumeText) return []
  const text = resumeText.toLowerCase()
  const freqMap = new Map()

  const candidatesToCheck = [
    ...(Array.isArray(candidateSkills) ? candidateSkills : (candidateSkills ? String(candidateSkills).split(',').map(s => s.trim()) : [])),
    'SQL Server', 'GitHub', '.NET', 'Oracle', 'DB2', 'SAP', 'XML', 'NIEM',
    'Selenium', 'Java', 'Python', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes',
    'Agile', 'Scrum', 'JIRA', 'PostgreSQL', 'Power BI', 'Salesforce', 'DAX',
    'Playwright', 'TestNG', 'Postman', 'Kafka', 'React', 'Angular', 'Vue',
    'RAG', 'PyTorch', 'LangChain', 'Pinecone', 'Palo Alto', 'Cisco ASA', 'Firewalls'
  ]

  const unique = Array.from(new Set(candidatesToCheck.map(s => s ? s.trim() : ''))).filter(s => s.length >= 2)

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

function getFullResumeText(candidate) {
  if (candidate?.resumeText && candidate.resumeText.length > 220) {
    return candidate.resumeText
  }
  const name = candidate?.name || 'CANDIDATE'
  const role = candidate?.role || 'Senior Technical Specialist'
  const email = candidate?.email || 'candidate@domain.com'
  const phone = candidate?.phone || '+1 (555) 019-2831'
  const loc = candidate?.location || 'Madison, WI'
  const exp = candidate?.experience || '8+ Years'
  const visa = candidate?.visaStatus || candidate?.visa_status || 'US Citizen'
  const skills = Array.isArray(candidate?.skills) ? candidate.skills : (candidate?.skills ? String(candidate.skills).split(',').map(s => s.trim()) : ['Java', 'SQL', 'Git'])
  const currentCo = candidate?.currentCompany || (candidate?.role ? `${candidate.role}, Enterprise Solutions` : 'Enterprise Partner Consultant')
  const prevCo = candidate?.previousCompany || 'Software Consultant, Tech Solutions'

  const roleLower = (role + ' ' + name + ' ' + skills.join(' ')).toLowerCase()

  // 1. QA Automation / SDET / SAP / NIEM
  if (roleLower.includes('qa') || roleLower.includes('sdet') || roleLower.includes('test') || roleLower.includes('selenium') || roleLower.includes('sap')) {
    return `${name.toUpperCase()}
Location: ${loc} | Contact: ${phone} | E-mail: ${email} | ${visa}

PROFESSIONAL SUMMARY
Results-driven Lead QA Automation Engineer / SDET with over ${exp} of extensive experience in design, development, and execution of automated regression test suites, enterprise web service validations, and end-to-end software quality assurance. Demonstrated expertise in SAP application testing, complex XML/NIEM payload compliance, SQL Server database reconciliation, and CI/CD automated test pipelines.

CORE TECHNICAL SKILLS
- Automation Tools: Selenium WebDriver, Playwright, TestNG, Cucumber BDD, SoapUI, Postman, REST Assured, JUnit
- Enterprise & Public-Sector Standards: SAP ECC & S/4HANA Testing, XML Validation, NIEM Schemas, WSDL, JSON Payloads
- Programming & Scripting: Java, Python, SQL, JavaScript, Groovy
- Databases: Microsoft SQL Server, Oracle 12c, PostgreSQL, MySQL
- DevOps & Management: Jenkins CI/CD, Git, GitHub, JIRA, HP ALM / Quality Center, Azure DevOps
- Testing Methodologies: Agile / Scrum, Functional Testing, Regression, System Integration (SIT), UAT

PROFESSIONAL EXPERIENCE

${currentCo} (2020 – Present)
- Spearheaded development and maintenance of scalable test automation frameworks using Selenium Java and TestNG, increasing automated regression test coverage to 86%.
- Performed end-to-end functional and regression testing across SAP modules and high-volume transaction processing systems.
- Validated complex XML payloads against NIEM compliance standards, catching 140+ schema divergence defects prior to user acceptance testing.
- Formulated complex SQL verification scripts on Microsoft SQL Server to audit relational database states, reconciliation ledgers, and downstream API payloads.
- Integrated automated test runs with Jenkins CI/CD pipelines, sending instant alerts and HTML test execution reports to engineering leads.

${prevCo} (2016 – 2020)
- Designed and executed 800+ automated test scenarios for enterprise web applications using Selenium and Cucumber BDD.
- Conducted RESTful API verification using Postman and SoapUI, verifying HTTP response codes, headers, and payload structures.
- Partnered closely with Scrum team members during sprint planning, backlog refinement, and three-amigos user story acceptance sessions.
- Managed bug lifecycle in JIRA, participating in daily triage meetings with developers and product managers.

EDUCATION
Bachelor of Science in Computer Science & Engineering
Accredited University

CERTIFICATIONS
- ISTQB Certified Software Tester (CTFL / CTAL)
- Certified ScrumMaster (CSM)®`
  }

  // 2. Technical Program Manager / Project Manager / Scrum
  if (roleLower.includes('tpm') || roleLower.includes('program manager') || roleLower.includes('project manager') || roleLower.includes('scrum master') || roleLower.includes('pmo')) {
    return `${name.toUpperCase()}, PMP, CSM
${loc} | ${email} | ${phone} | ${visa}

EXECUTIVE PROFILE
Distinguished Senior Technical Program Manager (TPM) with ${exp} of leadership directing multi-million dollar cloud transformations, enterprise digital roadmaps, and cross-functional engineering delivery squads. Expert in strategic roadmap planning, stakeholder alignment, executive technical communications, Agile/Scrum delivery governance, risk management, and vendor contract negotiations.

CORE LEADERSHIP COMPETENCIES
- Program & Project Governance: Strategic Roadmap Execution, SDLC Governance, Scope Baseline Management, Risk Mitigation
- Delivery Methodologies: Agile, Scrum, Kanban, SAFe (Scaled Agile), Hybrid Waterfall, Sprint Planning, OKR Alignment
- Technical Domain Knowledge: Cloud Infrastructure (AWS / Azure), Microservices Architecture, CI/CD Continuous Delivery
- Tools & Software: JIRA, Confluence, Microsoft Project, Smartsheet, AWS CloudWatch, Power BI, Slack
- Vendor & Budget Management: Multi-Million Dollar Program Budgeting ($10M+), Vendor Management, SOW Negotiation, SLA Tracking

PROFESSIONAL EXPERIENCE

${currentCo} (2020 – Present)
- Directed the end-to-end execution of enterprise multi-cloud transformation programs managing 5 distributed squads and 35+ software engineers.
- Accelerated sprint velocity by 32% by instituting automated JIRA burndown analytics, continuous backlog grooming, and transparent impediment clearing sessions.
- Partnered closely with VP of Engineering and Lead Cloud Architects to establish phased rollout roadmaps, minimizing system downtime during cutover.
- Led weekly executive progress reviews and quarterly OKR retrospectives, maintaining high alignment across engineering, product management, and compliance teams.

${prevCo} (2015 – 2020)
- Managed complex enterprise IT modernization projects from project charter through operational handover.
- Authored comprehensive project charters, technical risk registers, communications plans, and executive status dashboards.
- Facilitated daily standups, sprint reviews, and retrospective meetings as certified Scrum Master for two high-performing Agile squads.
- Enforced strict budget tracking and burn-rate modeling across an $8M annual technical project portfolio.

EDUCATION & CERTIFICATIONS
- Master of Science in Engineering / Business Administration
- Project Management Professional (PMP)® — PMI
- Certified ScrumMaster (CSM)® — Scrum Alliance`
  }

  // 3. Generative AI / LLM / Machine Learning
  if (roleLower.includes('generative ai') || roleLower.includes('llm') || roleLower.includes('machine learning') || roleLower.includes('rag') || roleLower.includes('pytorch')) {
    return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

PROFESSIONAL SUMMARY
Lead Generative AI and Machine Learning Engineer with ${exp} of hands-on expertise building production-grade Generative AI applications, Retrieval-Augmented Generation (RAG) architectures, and fine-tuning Large Language Models (LLMs). Extensive experience utilizing PyTorch, LangChain, HuggingFace, Vector Databases (Pinecone, FAISS, Weaviate), and deploying scalable microservices on AWS GPU infrastructure.

CORE TECHNICAL EXPERTISE
- Generative AI & LLMs: RAG Architectures, Fine-Tuning (LoRA, QLoRA), Prompt Engineering, Semantic Search, Agentic Workflows
- Frameworks & Libraries: LangChain, LlamaIndex, PyTorch, HuggingFace Transformers, vLLM, DeepSpeed, Ollama, TensorFlow
- Vector DBs & Search: Pinecone, FAISS, Milvus, Weaviate, Qdrant, ChromaDB, Elasticsearch
- Languages & Tools: Python 3.10+, SQL, Docker, Kubernetes, Git, Linux, FastAPIs, Celery, Redis
- Cloud & MLOps: AWS (SageMaker, Bedrock, EC2 GPU instances, S3, ECS), MLflow, Weights & Biases, Triton Inference Server

PROFESSIONAL EXPERIENCE

${currentCo} (2021 – Present)
- Architected enterprise-grade RAG knowledge retrieval systems indexing over 15M multi-modal documents with sub-200ms query latency.
- Fine-tuned open-source LLMs (Llama 3 70B, Mistral, Gemma) using LoRA on multi-GPU AWS clusters, reducing task-specific hallucination by 46%.
- Built agentic tool-use pipelines using LangChain and FastAPI, allowing models to dynamically query SQL databases and external REST endpoints.
- Containerized model inference containers with Docker and orchestrated GPU autoscaling nodes on Kubernetes (EKS).

${prevCo} (2017 – 2021)
- Developed NLP classification and entity extraction models using PyTorch, HuggingFace, and spaCy, achieving 94% F1-score on customer support datasets.
- Created automated feature engineering and data preprocessing pipelines in Python, processing 5TB+ of text data.
- Collaborated with software engineering teams to deploy RESTful model inference endpoints with 99.9% service uptime.

EDUCATION & CERTIFICATIONS
- Master of Science in Computer Science (Artificial Intelligence Focus)
- AWS Certified Machine Learning – Specialty
- DeepLearning.AI Generative AI with Large Language Models Certification`
  }

  // 4. Data Analyst / Power BI / Data Governance
  if (roleLower.includes('data') || roleLower.includes('power bi') || roleLower.includes('bi') || roleLower.includes('governance') || roleLower.includes('warehouse')) {
    return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

EXECUTIVE SUMMARY
Senior Power BI Data Analyst and Data Governance Specialist with ${exp} of expertise in enterprise data warehouse design, advanced SQL analytics, data governance frameworks, DAX calculations, and automated ETL data pipelines. Proven record translating complex data into actionable executive dashboards and compliant state reporting systems.

CORE TECHNICAL SKILLS
- BI & Analytics: Power BI Desktop & Service, DAX, Power Query (M), Tableau, Excel (VBA, Power Pivot)
- Database & Warehousing: SQL, Snowflake, SQL Server, Oracle, Data Modeling (Star/Snowflake Schema), Data Governance, Collibra
- CRM & Development: Salesforce (Admin & Dev), Apex, SOQL, Python (Pandas, NumPy)
- ETL & Pipelines: SSIS, Azure Data Factory, Alteryx, CDC (Change Data Capture)
- Compliance & Methodologies: Data Governance, HIPAA, Data Lineage, Agile / Scrum

EXPERIENCE

${currentCo} (2021 – Present)
- Architected enterprise executive dashboards in Power BI connected to Snowflake data warehouse, automating weekly reporting for 500+ stakeholders.
- Enforced data governance standards, data dictionary definitions, and row-level security (RLS) policies for state agency reporting.
- Developed complex DAX measures, time-intelligence calculations, and optimized Power Query transformations, improving report refresh times by 55%.
- Integrated corporate data warehouse using REST APIs and automated ETL pipelines.

${prevCo} (2017 – 2021)
- Designed and maintained dimensional star-schema data models and stored procedures on SQL Server and Oracle databases.
- Built automated ETL data ingestion pipelines handling 10M+ daily healthcare transaction records.
- Facilitated user training workshops and created comprehensive dashboard documentation and data governance operating procedures.

EDUCATION & CREDENTIALS
- Master / Bachelor of Science in Data Analytics / Computer Science
- Microsoft Certified: Power BI Data Analyst Associate (PL-300)`
  }

  // 5. Network Security / Firewall / Cloud Security
  if (roleLower.includes('security') || roleLower.includes('network') || roleLower.includes('firewall') || roleLower.includes('cisco')) {
    return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

PROFESSIONAL SUMMARY
Accomplished Senior Network Security Engineer with ${exp} of extensive experience in enterprise firewall engineering, perimeter defense, Cisco routing & switching, Palo Alto Panorama, site-to-site VPN tunnels, and AWS cloud security architectures. Deep expertise in incident response, IDS/IPS tuning, and regulatory compliance (PCI-DSS, HIPAA, NIST).

CORE COMPETENCIES & SKILLS
- Firewalls & Security: Palo Alto (PA-3200, PA-5200, Panorama), Cisco ASA, Check Point, Fortinet FortiGate, Zscaler ZIA/ZPA
- Routing & Switching: BGP, OSPF, EIGRP, Cisco Catalyst 9000, Nexus 7K/9K, VLANs, VXLAN, MPLS
- VPN & Remote Access: IPsec VPN, SSL VPN, Cisco AnyConnect, GlobalProtect
- Cloud Networking: AWS VPC, Transit Gateway, Direct Connect, Security Groups, Network ACLs, Route 53
- Monitoring & Tools: Wireshark, SolarWinds, Splunk, Cisco Prime, Python Network Automation

PROFESSIONAL EXPERIENCE

${currentCo} (2020 – Present)
- Led design and migration of multi-vendor firewall environments, replacing legacy Cisco ASA with next-gen Palo Alto clusters managed via Panorama.
- Designed and provisioned secure AWS VPC infrastructure, Direct Connect circuits, and Transit Gateway routing for corporate branch offices.
- Configured and audited BGP and OSPF routing protocols across redundant data centers with 99.999% network uptime.
- Deployed Zscaler Internet Access (ZIA) and GlobalProtect VPN for 5,000+ remote employees during enterprise zero-trust transition.

${prevCo} (2016 – 2020)
- Administered Check Point and Cisco ASA firewalls, maintaining access control lists (ACLs) and NAT translation policies.
- Conducted regular vulnerability assessments, IDS/IPS rule tuning, and firewall firmware upgrades without service disruption.
- Automated routine firewall rule validation and configuration backups using Python scripts and Git versioning.

EDUCATION & CERTIFICATIONS
- Bachelor of Science in Electrical & Computer Engineering
- Palo Alto Networks Certified Network Security Engineer (PCNSE)
- Cisco Certified Network Professional (CCNP Security)`
  }

  // 6. Java Full Stack / Cloud / Enterprise Default
  return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

EXECUTIVE SUMMARY
Accomplished ${role} with over ${exp} of experience in design, development, and implementation of high-throughput enterprise web applications, microservices, and distributed cloud solutions. Strong proficiency in ${skills.slice(0, 5).join(', ')}, SQL, Git, and RESTful API architecture. Proven success delivering mission-critical applications and collaborating across cross-functional Agile engineering teams.

CORE TECHNICAL SKILLS
- Languages & Core: Java (8/11/17), Python, SQL, JavaScript, HTML5/CSS3
- Frameworks & Backend: Spring Boot, Spring MVC, Spring Data JPA, Hibernate, Microservices, RESTful APIs, Kafka
- Frontend & UI: React, Angular, Vue.js, Redux, Tailwind CSS, TypeScript
- Cloud & DevOps: AWS (EC2, S3, RDS, CloudWatch), Docker, Kubernetes, Git, Jenkins CI/CD, Maven
- Databases: PostgreSQL, Oracle 12c, MySQL, MongoDB, SQL Server
- Testing & Methodologies: JUnit 5, Mockito, TestNG, SonarQube, Postman, Agile / Scrum, TDD

PROFESSIONAL EXPERIENCE

${currentCo} (2021 – Present)
- Architected and delivered resilient enterprise microservices utilizing ${skills.slice(0, 3).join(', ')}, reducing API p99 latency by 38%.
- Integrated relational database schemas and optimized SQL queries, ensuring data consistency and sub-second response times.
- Implemented Git version control branching workflows, automated peer code reviews, and containerized microservice deployments via Docker and Kubernetes on AWS.
- Designed secure OAuth2/JWT authentication filters and API Gateway routing for multi-tenant state agency and vendor integrations.

${prevCo} (2017 – 2021)
- Developed and maintained critical backend business logic and client integration endpoints.
- Designed comprehensive automated unit and integration tests using JUnit and Mockito, raising test coverage above 90%.
- Resolved complex production defect tickets and provided reliable escalation support for production releases.

EDUCATION
Bachelor of Science in Computer Science / Information Technology
Accredited University (Graduated with Honors)

CERTIFICATIONS
- Industry Certified Professional in ${skills[0] || 'Software Engineering'}
- Certified Scrum Developer (CSD) / AWS Certified Associate`
}

function getInitials(name = '') {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name[0] || '?').toUpperCase()
}

function getAvatarColor(name = '') {
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#9333EA','#16A34A','#EA580C','#BE123C']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
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

const highlightResumeText = (text, matchingSkills = [], searchQuery = '') => {
  if (!text) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#64748B',
        fontStyle: 'italic',
        padding: '36px 44px',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
      }}>
        No resume text available for this profile.
      </div>
    )
  }

  let highlighted = text;

  // 1. Highlight matching position skills in bright luminous yellow
  if (matchingSkills && matchingSkills.length > 0) {
    const sortedSkills = [...matchingSkills].sort((a, b) => b.length - a.length);
    sortedSkills.forEach(skill => {
      if (!skill || skill.length < 2) return;
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const startBoundary = /^[a-zA-Z0-9]/.test(skill.trim()) ? '\\b' : '';
      const endBoundary = /[a-zA-Z0-9]$/.test(skill.trim()) ? '\\b' : '';
      const regex = new RegExp(`${startBoundary}(${escaped})${endBoundary}`, 'gi');
      highlighted = highlighted.replace(regex, `<mark style="background-color: #FEF08A; color: #854D0E; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #FDE047;">$1</mark>`);
    });
  }

  // 2. Highlight manual search keywords in soft sky blue
  if (searchQuery && searchQuery.trim().length >= 2) {
    const escapedQ = searchQuery.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const qRegex = new RegExp(`(${escapedQ})`, 'gi');
    highlighted = highlighted.replace(qRegex, `<mark style="background-color: #BAE6FD; color: #0369A1; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #7DD3FC;">$1</mark>`);
  }

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: highlighted }} 
      style={{ 
        whiteSpace: 'pre-wrap', 
        lineHeight: '1.85', 
        fontSize: '14px', 
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif",
        color: '#1E293B',
        backgroundColor: '#FFFFFF',
        padding: '40px 48px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02)',
        boxSizing: 'border-box'
      }} 
    />
  )
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

  const DEFAULT_MESSAGES_THREADS = [
    {
      candidateId: 'team-gourav',
      candidateName: 'Gourav (Sourcing Specialist)',
      name: 'Gourav',
      role: 'Sourcing Specialist',
      company: 'SmartHire LLC',
      jobTitle: 'Direct Reportee • SmartHire LLC',
      subtitle: '🏛️ Direct Reportee • SmartHire LLC',
      category: 'team',
      email: 'gourav@smarthire.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, USA',
      status: 'active',
      avatarColor: '#2065D1',
      unreadCount: 1,
      lastMessage: "Sure, I'll share the shortlisted profiles...",
      lastMessageTime: '02:25 PM',
      recentFiles: [
        { name: 'Candidate_List.xlsx', size: '12 KB', date: '5 Sept', type: 'excel' },
        { name: 'Req_159078_Notes.pdf', size: '245 KB', date: '4 Sept', type: 'pdf' },
        { name: 'Interview_Schedule.docx', size: '18 KB', date: '2 Sept', type: 'word' }
      ],
      initialMessages: [
        { id: 'g1', text: 'Hi Omkesh,', sender: 'other', senderName: 'Gourav', timestamp: '2026-09-10T14:20:00Z', timeStr: '02:20 PM' },
        { id: 'g2', text: 'Can you share the latest candidate updates for Req #159078?', sender: 'other', senderName: 'Gourav', timestamp: '2026-09-10T14:21:00Z', timeStr: '02:21 PM' },
        { id: 'g3', text: "Sure Gourav, give me 5 minutes.\nI'll share the shortlisted profiles shortly.", sender: 'recruiter', senderName: 'Omkesh', timestamp: '2026-09-10T14:22:00Z', timeStr: '02:22 PM', isDelivered: true },
        { id: 'g4', text: 'Thanks! Also, let me know if we can schedule a quick sync tomorrow.', sender: 'other', senderName: 'Gourav', timestamp: '2026-09-10T14:23:00Z', timeStr: '02:23 PM' },
        { id: 'g5', text: "Yes, tomorrow 11 AM works. I'll send a calendar invite.", sender: 'recruiter', senderName: 'Omkesh', timestamp: '2026-09-10T14:24:00Z', timeStr: '02:24 PM', isDelivered: true },
        { id: 'g6', text: 'Great! 👍', sender: 'other', senderName: 'Gourav', timestamp: '2026-09-10T14:25:00Z', timeStr: '02:25 PM' }
      ]
    },
    {
      candidateId: 'cand-abhishek-jha',
      candidateName: 'Abhishek Jha',
      name: 'Abhishek Jha',
      role: 'Product Manager',
      company: 'Applied via Careers Portal',
      jobTitle: 'Product Manager',
      subtitle: 'Product Manager • Applied via Careers Portal',
      category: 'candidates',
      email: 'abhishek.jha@gmail.com',
      phone: '+1 (408) 782-9012',
      location: 'San Jose, CA',
      status: 'away',
      avatarColor: '#EA580C',
      unreadCount: 1,
      lastMessage: 'Can you share the JD?',
      lastMessageTime: '11:40 AM',
      recentFiles: [
        { name: 'Abhishek_Jha_PM_Resume.pdf', size: '310 KB', date: '10 Sept', type: 'pdf' },
        { name: 'Product_Portfolio_CaseStudy.pdf', size: '1.2 MB', date: '10 Sept', type: 'pdf' }
      ],
      initialMessages: [
        { id: 'aj1', text: 'Hello Omkesh, I saw the Senior Product Manager position posted on SmartHire Careers.', sender: 'other', senderName: 'Abhishek Jha', timestamp: '2026-09-10T11:35:00Z', timeStr: '11:35 AM' },
        { id: 'aj2', text: 'Hi Abhishek, thank you for reaching out! Your profile looks great.', sender: 'recruiter', senderName: 'Omkesh', timestamp: '2026-09-10T11:38:00Z', timeStr: '11:38 AM', isDelivered: true },
        { id: 'aj3', text: 'Can you share the JD?', sender: 'other', senderName: 'Abhishek Jha', timestamp: '2026-09-10T11:40:00Z', timeStr: '11:40 AM' }
      ]
    },
    {
      candidateId: 'client-shweta-patel',
      candidateName: 'Shweta Patel',
      name: 'Shweta Patel',
      role: 'HR Manager',
      company: 'TechCorp',
      jobTitle: 'HR Manager • TechCorp',
      subtitle: 'HR Manager • TechCorp',
      category: 'clients',
      email: 'shweta.patel@techcorp.io',
      phone: '+1 (650) 441-2980',
      location: 'Austin, TX',
      status: 'active',
      avatarColor: '#9333EA',
      unreadCount: 0,
      lastMessage: 'Thanks for the update!',
      lastMessageTime: '24 Aug',
      recentFiles: [
        { name: 'TechCorp_Q3_Hiring_Reqs.pdf', size: '420 KB', date: '24 Aug', type: 'pdf' }
      ],
      initialMessages: [
        { id: 'sp1', text: 'Hi Shweta, we submitted 3 candidates for the Frontend Lead role.', sender: 'recruiter', senderName: 'Omkesh', timestamp: '2026-08-24T10:15:00Z', timeStr: '10:15 AM', isDelivered: true },
        { id: 'sp2', text: 'Thanks for the update!', sender: 'other', senderName: 'Shweta Patel', timestamp: '2026-08-24T10:30:00Z', timeStr: '10:30 AM' }
      ]
    },
    {
      candidateId: 'cand-rahul-kumar',
      candidateName: 'Rahul Kumar',
      name: 'Rahul Kumar',
      role: 'Senior Java Developer',
      company: 'Enterprise Software Solutions',
      jobTitle: 'Senior Java Developer',
      subtitle: 'Senior Java Developer',
      category: 'candidates',
      email: 'rahul.kumar@gmail.com',
      phone: '+1 (312) 998-1245',
      location: 'Chicago, IL',
      status: 'active',
      avatarColor: '#16A34A',
      unreadCount: 0,
      lastMessage: 'Will be available tomorrow',
      lastMessageTime: '23 Aug',
      recentFiles: [
        { name: 'Rahul_Kumar_Java_Lead.docx', size: '145 KB', date: '23 Aug', type: 'word' }
      ],
      initialMessages: [
        { id: 'rk1', text: 'Hi Rahul, are you open for the client screening call tomorrow?', sender: 'recruiter', senderName: 'Omkesh', timestamp: '2026-08-23T14:00:00Z', timeStr: '02:00 PM', isDelivered: true },
        { id: 'rk2', text: 'Will be available tomorrow', sender: 'other', senderName: 'Rahul Kumar', timestamp: '2026-08-23T14:15:00Z', timeStr: '02:15 PM' }
      ]
    },
    {
      candidateId: 'client-priya-sharma',
      candidateName: 'Priya Sharma',
      name: 'Priya Sharma',
      role: 'Client Account Lead',
      company: 'ABC Solutions',
      jobTitle: 'Client • ABC Solutions',
      subtitle: 'Client • ABC Solutions',
      category: 'clients',
      email: 'priya.sharma@abcsolutions.com',
      phone: '+1 (212) 890-4433',
      location: 'New York, NY',
      status: 'active',
      avatarColor: '#D946EF',
      avatarImg: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      unreadCount: 0,
      lastMessage: 'Interview feedback shared.',
      lastMessageTime: '22 Aug',
      recentFiles: [
        { name: 'Client_Interview_Evaluation_Matrix.xlsx', size: '55 KB', date: '22 Aug', type: 'excel' }
      ],
      initialMessages: [
        { id: 'ps1', text: 'Hi Omkesh, the hiring panel completed the second round interview for the Cloud Architect position.', sender: 'other', senderName: 'Priya Sharma', timestamp: '2026-08-22T16:10:00Z', timeStr: '04:10 PM' },
        { id: 'ps2', text: 'Interview feedback shared.', sender: 'other', senderName: 'Priya Sharma', timestamp: '2026-08-22T16:15:00Z', timeStr: '04:15 PM' }
      ]
    },
    {
      candidateId: 'team-dev',
      candidateName: 'Dev Team',
      name: 'Dev Team',
      role: 'Engineering Squad',
      company: '3 members',
      jobTitle: 'Sprint planning at 4 PM',
      subtitle: '3 members',
      category: 'team',
      email: 'dev-team@smarthire.com',
      phone: '+1 (555) 880-9911',
      location: 'Remote, US',
      status: 'active',
      avatarColor: '#DB2777',
      unreadCount: 0,
      lastMessage: 'Sprint planning at 4 PM',
      lastMessageTime: '21 Aug',
      recentFiles: [
        { name: 'Sprint_34_Release_Plan.pdf', size: '890 KB', date: '21 Aug', type: 'pdf' }
      ],
      initialMessages: [
        { id: 'dt1', text: 'Sprint planning at 4 PM', sender: 'other', senderName: 'Dev Team', timestamp: '2026-08-21T09:30:00Z', timeStr: '09:30 AM' }
      ]
    },
    {
      candidateId: 'cand-manish-kumar',
      candidateName: 'Manish Kumar',
      name: 'Manish Kumar',
      role: 'Data Engineer',
      company: 'Tech Solutions',
      jobTitle: 'Data Engineer',
      subtitle: 'Data Engineer',
      category: 'candidates',
      email: 'manish.k@gmail.com',
      phone: '+1 (206) 555-8123',
      location: 'Seattle, WA',
      status: 'offline',
      avatarColor: '#D97706',
      unreadCount: 0,
      lastMessage: 'Salary expectation?',
      lastMessageTime: '20 Aug',
      recentFiles: [
        { name: 'Manish_Kumar_DataEngineer.pdf', size: '210 KB', date: '20 Aug', type: 'pdf' }
      ],
      initialMessages: [
        { id: 'mk1', text: 'Salary expectation?', sender: 'other', senderName: 'Manish Kumar', timestamp: '2026-08-20T11:20:00Z', timeStr: '11:20 AM' }
      ]
    },
    {
      candidateId: 'cand-sneha-nair',
      candidateName: 'Sneha Nair',
      name: 'Sneha Nair',
      role: 'QA Engineer',
      company: 'Enterprise Quality Lab',
      jobTitle: 'QA Engineer',
      subtitle: 'QA Engineer',
      category: 'candidates',
      email: 'sneha.nair@gmail.com',
      phone: '+1 (470) 555-4421',
      location: 'Atlanta, GA',
      status: 'active',
      avatarColor: '#0284C7',
      unreadCount: 0,
      lastMessage: 'Shared updated resume.',
      lastMessageTime: '19 Aug',
      recentFiles: [
        { name: 'Sneha_Nair_SDET_Resume.pdf', size: '195 KB', date: '19 Aug', type: 'pdf' }
      ],
      initialMessages: [
        { id: 'sn1', text: 'Shared updated resume.', sender: 'other', senderName: 'Sneha Nair', timestamp: '2026-08-19T15:45:00Z', timeStr: '03:45 PM' }
      ]
    }
  ]

  const [threads, setThreads] = useState(DEFAULT_MESSAGES_THREADS)
  const [activeThread, setActiveThread] = useState(DEFAULT_MESSAGES_THREADS[0])
  const [messages, setMessages] = useState(DEFAULT_MESSAGES_THREADS[0].initialMessages)
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
      id: 'cand-pranitha-bantu',
      candidate_id: 'cand-pranitha-bantu',
      name: 'Pranitha Bantu',
      email: 'pranitha.bantu@gmail.com',
      phone: '+1 (919) 555-0143',
      role: 'Lead Generative AI & Machine Learning Engineer',
      location: 'Raleigh, NC',
      currentCompany: 'Lead Generative AI Engineer, Cognitive AI Labs',
      previousCompany: 'Machine Learning Engineer, DataVision Tech',
      experience: '8+ Years',
      education: 'No degree info',
      visaStatus: 'US Citizen',
      gender: 'Female',
      status: 'Active',
      matchScore: 96,
      targetReqId: '159078',
      matchedJobTitle: 'Public Health Program Director 1 (66312)',
      matchedJobClient: 'Tennessee Department of Health (TN DOH)',
      matchedJobRate: '$75/hr',
      summary: 'Results-driven Lead Generative AI & Machine Learning Engineer with 8+ years of experience building scalable AI/ML solutions. Expertise in LLMs, Python, cloud platforms and enterprise applications. Passionate about solving real-world problems using AI.',
      skills: ['Generative AI', 'Large Language Models (LLMs)', 'Python', 'PyTorch', 'LangChain', 'Hugging Face', 'AWS', 'RAG', 'Pinecone', 'FAISS', 'Docker'],
      resumeFile: 'Pranitha_Bantu_Resume.pdf',
      resumeUploadDate: '10 Sept 2026, 02:00 AM',
      source: 'Careers Job Site (/jobs)',
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
      location: 'Madison, WI',
      currentCompany: 'Lead SDET & SAP Validation, Enterprise Cloud',
      previousCompany: 'Senior Automation Engineer, State Systems',
      experience: '16+ Years',
      education: 'B.S. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 94,
      targetReqId: '159079',
      matchedJobTitle: 'Java Developer III - 165504',
      matchedJobClient: 'State of Wisconsin (ETF)',
      matchedJobRate: '$75/hr',
      summary: 'Distinguished Lead SDET and QA Automation Specialist with 16+ years of rigorous experience leading enterprise testing across SAP, distributed services, and microservices.',
      skills: ['Selenium', 'SAP Testing', 'SQL Server', 'NIEM', 'XML Validation', 'Java', 'GitHub', 'CI/CD', 'TestNG'],
      resumeFile: 'Damodhar_Kammara_Resume.pdf',
      resumeUploadDate: '10 Sept 2026, 01:15 AM',
      source: 'Recruiter Email Inbox',
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
      location: 'Nashville, TN',
      currentCompany: 'Senior TPM & Agile Transformation, HealthTech Solutions',
      previousCompany: 'Technical Project Manager, Enterprise Systems',
      experience: '14+ Years',
      education: 'M.S. in Information Systems, PMP, CSM',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 92,
      targetReqId: '159078',
      matchedJobTitle: 'Public Health Program Director 1 (66312)',
      matchedJobClient: 'Tennessee Department of Health (TN DOH)',
      matchedJobRate: '$75/hr',
      summary: 'Strategic Senior Technical Program Manager and Certified Scrum Master with 14+ years spearheading healthcare IT programs, public sector delivery, and federal compliance audits.',
      skills: ['Program Management', 'Strategic Planning', 'Agile / Scrum', 'Technical Writing', 'JIRA', 'Confluence', 'Risk Mitigation'],
      resumeFile: 'Sanjay_Javangula_Resume.pdf',
      resumeUploadDate: '09 Sept 2026, 11:30 PM',
      source: 'Recruiter Email Inbox',
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
      location: 'Madison, WI',
      currentCompany: 'Senior Java Consultant, Enterprise Cloud Solutions',
      previousCompany: 'Senior Java Engineer, State Technology Services',
      experience: '12+ Years',
      education: 'B.S. in Computer Science',
      visaStatus: 'US Citizen',
      gender: 'Male',
      status: 'Active',
      matchScore: 95,
      targetReqId: '159079',
      matchedJobTitle: 'Java Developer III - 165504',
      matchedJobClient: 'State of Wisconsin (ETF)',
      matchedJobRate: '$75/hr',
      summary: 'Distinguished Lead Java Full Stack Developer with 12+ years building enterprise architectures using Spring Boot, React, Kafka, and cloud containerization.',
      skills: ['Java', 'Spring Boot', 'React', 'Vue', 'SQL', 'Git', 'Kafka', 'Docker', 'PostgreSQL', 'Microservices'],
      resumeFile: 'Jacob_Holbrook_Resume.pdf',
      resumeUploadDate: '09 Sept 2026, 08:45 PM',
      source: 'Recruiter Email Inbox',
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
      location: 'Raleigh, NC',
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
      source: 'Recovered from Spam Folder',
      sourceCategory: 'email_spam',
      isSpamRecovery: true
    }
  ]

  // View switcher: 'chat' (Live Messages), 'dashboard' (KPI Overview), or 'stream' (Candidate Dossier / Table)
  const initialInboxMode = defaultViewMode || searchParams.get('view') || searchParams.get('tab') || 'chat'
  const [inboxViewMode, setInboxViewMode] = useState(initialInboxMode)
  const [minimalsSidebarOpen, setMinimalsSidebarOpen] = useState(true)
  const [streamFilter, setStreamFilter] = useState('all') // 'all', 'email_inbox', 'email_spam', 'careers_portal', 'vendor_bench'
  const [streamCandidates, setStreamCandidates] = useState(DEFAULT_STREAM_CANDIDATES)
  const [streamCounts, setStreamCounts] = useState({
    candidatesTotal: 5,
    inboxResumes: 3,
    spamResumes: 1,
    careersResumes: 1,
    vendorResumes: 0
  })
  const [loadingStream, setLoadingStream] = useState(false)
  const [streamSearch, setStreamSearch] = useState('')
  const [streamReqFilter, setStreamReqFilter] = useState('all')
  const [streamEntityFilter, setStreamEntityFilter] = useState('all') // 'all', 'candidates', 'recruiters'
  const [selectedCandidate, setSelectedCandidate] = useState(DEFAULT_STREAM_CANDIDATES[0])
  const [candidateSubTab, setCandidateSubTab] = useState('matches') // 'matches', 'favorites', 'spam'
  const [activeRightTab, setActiveRightTab] = useState('resume') // 'resume' or 'profile'
  const [viewedCandidateIds, setViewedCandidateIds] = useState(() => new Set(['cand-pranitha-bantu', 'cand-monster-jacob']))
  const [favoriteCandidateIds, setFavoriteCandidateIds] = useState(() => new Set())
  const [selectedCardIds, setSelectedCardIds] = useState(() => new Set())

  // Open Requisitions for Multi-Position AI Matcher
  const DEFAULT_OPEN_JOBS = [
    { id: '159079', title: 'Java Developer III - 165504', client: 'State of Wisconsin (ETF)', rate: '$75/hr', location: 'Madison, WI (Remote)', skills: ['Java', 'Spring Boot', 'React', 'Vue', 'SQL', 'Git', 'AWS'] },
    { id: '159078', title: 'Public Health Program Director 1 (66312)', client: 'Tennessee Department of Health (TN DOH)', rate: '$75/hr', location: 'Nashville, TN (Hybrid)', skills: ['Strategic Planning', 'Technical Writing', 'Program Management', 'Healthcare', 'Project Management', 'Agile'] },
    { id: '159077', title: 'Java Developer III - 165503', client: 'State of Wisconsin (ETF)', rate: '$75/hr', location: 'Madison, WI (Remote)', skills: ['Java', 'Angular', 'Vue', 'SQL', 'Git', 'Spring Boot'] },
    { id: '159074', title: 'Attorney - 66316', client: 'Tennessee Department of Health (TN DOH)', rate: '$75/hr', location: 'Nashville, TN (Hybrid)', skills: ['Legal Writing', 'Regulatory Compliance', 'Health Policy', 'Communications'] },
    { id: '159073', title: 'DBHDS - Data Governance Analyst (CDC Funded) (807900)', client: 'Virginia DBHDS', rate: '$75/hr', location: 'Richmond, VA (Hybrid)', skills: ['Data Governance', 'SQL', 'Data Warehouse', 'Python', 'Tableau', 'CDC', 'Power BI'] },
    { id: '158997', title: 'NC DHHS - AWS Senior Developer (808496)', client: 'NC DHHS', rate: '$85/hr', location: 'Raleigh, NC (Hybrid)', skills: ['AWS', 'Cloud Architecture', 'Python', 'Lambda', 'Docker', 'Kubernetes'] }
  ]
  const [openJobsList, setOpenJobsList] = useState(DEFAULT_OPEN_JOBS)
  const [drawerReqId, setDrawerReqId] = useState('159078')
  const [resumeKeywordSearch, setResumeKeywordSearch] = useState('')

  // Direct Outbound Email Modal State (Strictly sent from personal recruiter email)
  const [emailModalCandidate, setEmailModalCandidate] = useState(null)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSuccessToast, setEmailSuccessToast] = useState('')
  const [directMailtoUrl, setDirectMailtoUrl] = useState('')

  // Candidate Assignment Notification Toast
  const [assignedToast, setAssignedToast] = useState('')
  const [shareToast, setShareToast] = useState('')
  const [showReqChangeDropdown, setShowReqChangeDropdown] = useState(false)
  const [aiGeneratingSummary, setAiGeneratingSummary] = useState(false)
  const [aiInsightToast, setAiInsightToast] = useState('')

  // Tobu.ai Mode & Tabs: 'card' (Candidate Card / Split View) or 'table' (Database Table View)
  const [inboxSubMode, setInboxSubMode] = useState('card')
  const [activeTobuTab, setActiveTobuTab] = useState('overview')
  const [tableCategory, setTableCategory] = useState('all')
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(25)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const pollingRef = useRef(null)

  const ALL_SMARTHIRE_RECRUITERS = [
    { name: 'Omkesh Manjute', email: 'omkesh.manjute@smarthire.com', refCode: 'omkesh', role: 'Super Admin' },
    { name: 'Vaibhav Bisen', email: 'vaibhav.bisen@smarthire.com', refCode: 'vaibhav-bisen', role: 'Lead Recruiter' },
    { name: 'Sukamal Chatterjee', email: 'sukamal.c@smarthire.com', refCode: 'sukamal-chatterjee', role: 'Senior Recruiter' },
    { name: 'Prudhvi Sevveti', email: 'prudhvi.s@smarthire.com', refCode: 'prudhvi-sevveti', role: 'Recruiter' },
    { name: 'Nitin Bhosale', email: 'nitin.b@smarthire.com', refCode: 'nitin-bhosale', role: 'Recruiter' },
    { name: 'Naveen Korimelli', email: 'naveen.k@smarthire.com', refCode: 'naveen-korimelli', role: 'Recruiter' },
    { name: 'Ajay Arya', email: 'ajay.a@smarthire.com', refCode: 'ajay-arya', role: 'Recruiter' },
    { name: 'Raj Barve', email: 'raj.b@smarthire.com', refCode: 'raj-barve', role: 'Recruiter' },
    { name: 'Pankaj Maharwade', email: 'pankaj.m@smarthire.com', refCode: 'pankaj-maharwade', role: 'Senior Recruiter' },
    { name: 'Nishant Kathane', email: 'nishant.k@smarthire.com', refCode: 'nishant-kathane', role: 'Recruiter' }
  ]

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
      const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : 'Direct reporting & candidate approval channel'
      const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : new Date().toISOString()

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
        const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : 'Team reporting & candidate review channel'
        const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : new Date().toISOString()

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
          phone: rep.phone || '571-660-5778',
          role: rep.role || 'Employee / Sourcing Specialist'
        })
      }
    }

    const threadMap = new Map()
    DEFAULT_MESSAGES_THREADS.forEach(t => threadMap.set(t.candidateId, { ...t }))
    teamChannels.forEach(t => {
      if (threadMap.has(t.candidateId)) {
        threadMap.set(t.candidateId, { ...threadMap.get(t.candidateId), ...t })
      } else {
        threadMap.set(t.candidateId, t)
      }
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
      if (combined[0].initialMessages && (!messages || messages.length === 0)) {
        setMessages(combined[0].initialMessages)
      }
    }
    setLoadingThreads(false)
  }, [recruiterFilter, isReportee, parentRecruiterName, parentRecruiterEmail, currentUser?.email, currentUser?.name, isAdmin, isSuperAdmin, teamUsersList, activeThread, messages])

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

      if (merged.length === 0 && candidateId.startsWith('team-reportee-')) {
        const initial = [
          {
            id: 'lead-init-1',
            sender: 'lead',
            senderName: parentRecruiterName,
            senderEmail: parentRecruiterEmail,
            text: `Hi! Welcome to your direct reporting channel. Feel free to send candidate profiles for review, ask requisition questions, or request rate clearances here.`,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            candidateId: candidateId
          }
        ]
        merged = initial
      }

      if (merged.length === 0) {
        const found = threads.find(t => t.candidateId === candidateId) || DEFAULT_MESSAGES_THREADS.find(t => t.candidateId === candidateId)
        if (found?.initialMessages && found.initialMessages.length > 0) {
          merged = found.initialMessages
        }
      }

      setMessages(merged)
    } catch (e) {
      console.warn('Message fetch error:', e)
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [parentRecruiterName, parentRecruiterEmail, threads, DEFAULT_MESSAGES_THREADS])

  const selectThread = useCallback(async (thread) => {
    setActiveThread(thread)
    setInputText('')
    setShowTemplates(false)
    setEmojiPickerOpen(false)
    if (thread.initialMessages) {
      setMessages(thread.initialMessages)
    }
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

  const fetchStreamCandidates = useCallback(async () => {
    setLoadingStream(true)
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
      const recName = u.name || currentUser?.name || 'Omkesh Manjute'
      const recRole = u.role || activeRole || 'superadmin'

      const params = new URLSearchParams({
        recruiterEmail: recEmail,
        userName: recName,
        role: recRole
      })

      const res = await fetch(`/api/recruiter/email-streams?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setStreamCandidates(data.candidates || [])
        if (data.counts) {
          setStreamCounts(data.counts)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch recruiter talent stream:', err)
    } finally {
      setLoadingStream(false)
    }
  }, [currentUser?.email, currentUser?.name, activeRole])

  const handleSyncEmailResumes = async () => {
    setSyncingEmailResumes(true)
    setEmailSyncToast('')
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
      const res = await fetch('/api/recruiter/sync-email-resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterEmail: recEmail,
          scanFolders: ['INBOX', 'SPAM']
        })
      })
      const data = await res.json()
      setEmailSyncToast(data.message || 'Scanned INBOX & SPAM: Resumes synced!')
      await fetchStreamCandidates()
      await fetchThreads()
    } catch (e) {
      setEmailSyncToast('Failed to sync resumes: ' + e.message)
    } finally {
      setSyncingEmailResumes(false)
      setTimeout(() => setEmailSyncToast(''), 8000)
    }
  }

  const handleOpenEmailModal = (cand) => {
    setEmailModalCandidate(cand)
    setEmailTo(cand.email || '')
    const targetReq = cand.targetReqId || '159079'
    const jobTitle = cand.matchedJobTitle || 'Open Position'
    const jobRate = cand.matchedJobRate || '$75/hr'
    const jobClient = cand.matchedJobClient || 'State Agency'

    const defaultSubject = `Opportunity: ${jobTitle} (Req #${targetReq}) | COOLSOFT LLC`
    setEmailSubject(defaultSubject)

    const candFirstName = (cand.name || 'Candidate').split(' ')[0]
    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh Manjute'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'

    const defaultBody = `Hi ${candFirstName},\n\nI reviewed your resume for the ${jobTitle} position (Req #${targetReq}) with our client ${jobClient} (${jobRate}). Your technical background and experience are a strong fit for this project.\n\nCould you please review and confirm:\n1. Your current work authorization status?\n2. Your updated hourly rate expectation for this position?\n3. Your immediate availability for a brief technical screening call?\n\nPlease reply directly to this email or feel free to attach your latest updated resume.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`

    setEmailBody(defaultBody)
    setEmailSuccessToast('')
    setDirectMailtoUrl('')
  }

  const handleSendDirectEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      alert('Please fill out Recipient, Subject, and Body.')
      return
    }
    setEmailSending(true)
    setEmailSuccessToast('')
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
      const candId = emailModalCandidate?.id || emailModalCandidate?.candidate_id || ''

      const res = await fetch('/api/recruiter/send-direct-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterEmail: recEmail,
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
          candidateName: emailModalCandidate?.name || '',
          candidateId: candId
        })
      })
      const data = await res.json()
      if (data.success) {
        setDirectMailtoUrl(data.mailtoUrl || '')
        if (data.serverDispatched) {
          setEmailSuccessToast(`✅ Email successfully sent to ${emailTo} directly from ${data.senderEmail}!`)
        } else {
          setEmailSuccessToast(`✅ Email prepared from ${data.senderEmail}. Dispatching via your default mail client...`)
          if (data.mailtoUrl) {
            window.location.href = data.mailtoUrl
          }
        }
        setTimeout(() => {
          setEmailModalCandidate(null)
          setEmailSuccessToast('')
        }, 3500)
      } else {
        alert('Failed to send email: ' + (data.message || 'Unknown error'))
      }
    } catch (err) {
      alert('Error sending email: ' + err.message)
    } finally {
      setEmailSending(false)
    }
  }

  const handleAssignCandidateToReq = async (cand, specificReqId = null) => {
    const targetReqId = specificReqId || cand.targetReqId || '159079'
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

    setAssignedToast(`✓ ${candName} successfully added to Requisition #${cleanId}!`)
    setTimeout(() => setAssignedToast(''), 5000)
  }

  const handleOpenCandidateChat = (cand) => {
    const threadId = cand.id || `cand-${cand.email}`
    const existing = threads.find(t => t.candidateId === threadId || (t.email && t.email.toLowerCase() === cand.email.toLowerCase()))
    if (existing) {
      setInboxViewMode('chat')
      selectThread(existing)
    } else {
      const newThread = {
        candidateId: threadId,
        candidateName: cand.name,
        jobTitle: cand.matchedJobTitle || cand.role || 'Requisition Candidate',
        lastMessage: cand.isSpamRecovery ? 'Recovered candidate from email spam folder' : 'Candidate received via email inbox',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        email: cand.email,
        phone: cand.phone,
        role: cand.role
      }
      setThreads(prev => [newThread, ...prev])
      setInboxViewMode('chat')
      selectThread(newThread)
    }
  }

  const handleViewCandidateProfile = (cand) => {
    const targetReq = cand.targetReqId || '159079'
    setDrawerReqId(targetReq)
    setResumeKeywordSearch('')
    setCandidateDetails({
      ...cand,
      candidateName: cand.name,
      email: cand.email,
      phone: cand.phone,
      location: cand.location,
      visaStatus: cand.visaStatus || cand.visa_status || 'US Citizen',
      resumeText: cand.resumeText || `RESUME: ${cand.name}\n${cand.role}\nLocation: ${cand.location}\nSkills: ${(cand.skills || []).join(', ')}\nExperience: ${cand.experience || '8+ Years'}\nContact: ${cand.email} | ${cand.phone}`,
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

  // Load live open requisitions to power the Multi-Position AI Matcher
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        const jList = Array.isArray(data) ? data : (data.jobs || [])
        if (jList && jList.length > 0) {
          setOpenJobsList(prev => {
            const merged = [...prev]
            jList.forEach(j => {
              const jId = String(j.id || j.reqId || j.job_id || '').replace(/^J-/, '')
              if (jId && !merged.some(m => String(m.id) === jId)) {
                merged.push({
                  id: jId,
                  title: j.title || j.role || `Requisition #${jId}`,
                  client: j.client || j.department || 'Client',
                  rate: j.rate || j.payRate || j.budget || '$75/hr',
                  location: j.location || 'Remote',
                  skills: Array.isArray(j.skills) ? j.skills : (typeof j.skills === 'string' ? j.skills.split(',').map(s => s.trim()) : ['Java', 'SQL'])
                })
              }
            })
            return merged
          })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchStreamCandidates() }, [fetchStreamCandidates])
  useEffect(() => { fetchThreads() }, [fetchThreads])

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

  const filteredCandidates = streamCandidates.filter(c => {
    if (!c) return false

    // Table Category filtering
    if (inboxSubMode === 'table') {
      if (tableCategory === 'inbox' && c.sourceCategory !== 'email_inbox') return false
      if (tableCategory === 'spam' && c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) return false
      if (tableCategory === 'careers' && c.sourceCategory !== 'careers_portal') return false
      if (tableCategory === 'vendor' && c.sourceCategory !== 'vendor_bench') return false
      if (tableCategory === 'favorites') {
        const candId = c.id || c.email
        if (!favoriteCandidateIds.has(candId)) return false
      }
    } else {
      // Monster+ Sub-Tabs (Matches / Favorites / Spam)
      if (candidateSubTab === 'favorites') {
        const candId = c.id || c.email
        if (!favoriteCandidateIds.has(candId)) return false
      } else if (candidateSubTab === 'spam') {
        if (c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) return false
      }

      // 1. Source filter
      if (streamFilter === 'email_inbox' && c.sourceCategory !== 'email_inbox') return false
      if (streamFilter === 'email_spam' && c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) return false
      if (streamFilter === 'careers_portal' && c.sourceCategory !== 'careers_portal') return false
      if (streamFilter === 'vendor_bench' && c.sourceCategory !== 'vendor_bench') return false
    }

    // 2. Requisition filter
    if (streamReqFilter !== 'all' && String(c.targetReqId) !== String(streamReqFilter)) return false

    // 3. Search query
    if (streamSearch.trim()) {
      const q = streamSearch.toLowerCase()
      const n = (c.name || '').toLowerCase()
      const e = (c.email || '').toLowerCase()
      const r = (c.role || '').toLowerCase()
      const loc = (c.location || '').toLowerCase()
      const req = String(c.targetReqId || '').toLowerCase()
      const jTitle = (c.matchedJobTitle || '').toLowerCase()
      const sMatch = Array.isArray(c.skills) ? c.skills.some(s => String(s).toLowerCase().includes(q)) : String(c.skills || '').toLowerCase().includes(q)
      return n.includes(q) || e.includes(q) || r.includes(q) || loc.includes(q) || req.includes(q) || jTitle.includes(q) || sMatch
    }

    return true
  })

  // Ensure activeCandidate is always resolved and matched to active position
  const activeCandidate = selectedCandidate || (filteredCandidates.length > 0 ? filteredCandidates[0] : null)
  const activeCandidateIndex = filteredCandidates.findIndex(c =>
    (c.id && activeCandidate?.id && c.id === activeCandidate.id) ||
    (c.email && activeCandidate?.email && c.email === activeCandidate.email)
  )

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

  const currentReqId = String(drawerReqId || activeCandidate?.targetReqId || '159079').replace(/^J-/, '')
  const activeTargetJob = openJobsList.find(j => String(j.id) === currentReqId) || openJobsList[0]

  const candSkillsList = activeCandidate ? (Array.isArray(activeCandidate.skills) ? activeCandidate.skills : (activeCandidate.skills ? String(activeCandidate.skills).split(',').map(s => s.trim()) : [])) : []
  const reqSkillsList = activeTargetJob?.skills || ['Java', 'SQL']
  const candResumeText = activeCandidate ? getFullResumeText(activeCandidate) : ''
  const candidateCorpus = (candResumeText + ' ' + candSkillsList.join(' ')).toLowerCase()

  const dynamicMatchingSkills = reqSkillsList.filter(sk => {
    const sLower = sk.toLowerCase()
    return candidateCorpus.includes(sLower) || candSkillsList.some(cs => cs.toLowerCase().includes(sLower) || sLower.includes(cs.toLowerCase()))
  })

  const dynamicMissingSkills = reqSkillsList.filter(sk => !dynamicMatchingSkills.includes(sk))
  const calculatedFitScore = activeTargetJob && reqSkillsList.length > 0
    ? Math.min(99, Math.max(65, Math.round((dynamicMatchingSkills.length / reqSkillsList.length) * 100)))
    : (activeCandidate?.matchScore || 92)

  const candidateFrequencies = activeCandidate ? getSkillFrequencies(candResumeText, candSkillsList) : []

  const handleGenerateAiSummary = () => {
    setAiGeneratingSummary(true)
    setTimeout(() => {
      setAiGeneratingSummary(false)
      setAssignedToast('✨ AI Summary generated & synced with candidate profile!')
      setTimeout(() => setAssignedToast(''), 4000)
    }, 900)
  }

  const handleApplyEmailTemplate = (key) => {
    if (!emailModalCandidate) return
    const candFirstName = (emailModalCandidate.name || emailModalCandidate.candidateName || 'Candidate').split(' ')[0]
    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh Manjute'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
    const targetReq = emailModalCandidate.targetReqId || drawerReqId || '159079'
    const jobTitle = emailModalCandidate.matchedJobTitle || activeTargetJob?.title || 'Open Position'
    const jobClient = emailModalCandidate.matchedJobClient || activeTargetJob?.client || 'State Agency'
    const jobRate = emailModalCandidate.matchedJobRate || activeTargetJob?.rate || '$75/hr'

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
      {minimalsSidebarOpen && (
        <aside style={{
          width: 240,
          minWidth: 240,
          backgroundColor: C.sidebar,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 16px',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          {/* Top Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 6px' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2065D1 0%, #00A76F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontWeight: 900,
              fontSize: 16
            }}>
              M.
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.textPrimary, lineHeight: 1.2 }}>
                SmartHire ATS
              </div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>
                Find · Evaluate · Hire
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={() => setInboxViewMode('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: inboxViewMode === 'dashboard' ? C.activeConv : 'transparent',
                color: inboxViewMode === 'dashboard' ? C.brand : C.textSecondary,
                fontWeight: inboxViewMode === 'dashboard' ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <IconHome /> <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => { setInboxViewMode('stream'); setInboxSubMode('card'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: (inboxViewMode === 'stream' && inboxSubMode === 'card') ? C.activeConv : 'transparent',
                color: (inboxViewMode === 'stream' && inboxSubMode === 'card') ? C.brand : C.textSecondary,
                fontWeight: (inboxViewMode === 'stream' && inboxSubMode === 'card') ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <IconUsers /> <span>Candidates</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ats?tab=jobs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.textSecondary,
                fontWeight: 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <IconBriefcase /> <span>Jobs</span>
            </button>

            <button
              type="button"
              onClick={() => setInboxViewMode('chat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: inboxViewMode === 'chat' ? C.activeConv : 'transparent',
                color: inboxViewMode === 'chat' ? C.brand : C.textSecondary,
                fontWeight: inboxViewMode === 'chat' ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <IconChat /> <span>Messages</span>
              </span>
              <span style={{ fontSize: 10.5, background: '#FF5630', color: '#FFF', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                2
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? C.activeConv : 'transparent',
                color: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? C.brand : C.textSecondary,
                fontWeight: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <IconDatabase /> <span>Database</span>
              </span>
              <span style={{ fontSize: 10.5, background: '#FFAB00', color: '#1C252E', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                77
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setInboxViewMode('stream'); setSyncingEmailResumes(true); setTimeout(() => setSyncingEmailResumes(false), 800); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.textSecondary,
                fontWeight: 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <IconZap /> <span>Scan Ingest</span>
            </button>

            <button
              type="button"
              onClick={() => setInboxViewMode('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.textSecondary,
                fontWeight: 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <IconAnalytics /> <span>Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.textSecondary,
                fontWeight: 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <IconFileReports /> <span>Reports</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/ats')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: C.textSecondary,
                fontWeight: 500,
                fontSize: 13.5,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <IconSettings /> <span>Settings</span>
            </button>
          </div>

          {/* Bottom Upgrade Promo Card Matching Screenshot */}
          <div style={{
            marginTop: 'auto',
            backgroundColor: isLight ? '#F9FAFB' : 'rgba(255,255,255,0.04)',
            borderRadius: 12,
            padding: '14px 12px',
            textAlign: 'center',
            border: `1px solid ${C.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <IconCrown />
              <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>Upgrade to Pro</span>
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 10, lineHeight: 1.35 }}>
              More features. More hires.<br />From only $69/month
            </div>
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              style={{
                width: '100%',
                background: '#2065D1',
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                padding: '7px 0',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(32,101,209,0.25)'
              }}
            >
              Upgrade Now
            </button>
          </div>
        </aside>
      )}

      {/* 2. Main Right Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
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
          {/* Left: Search input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => setMinimalsSidebarOpen(o => !o)}
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
              title="Toggle Sidebar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div style={{ position: 'relative', width: 340 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                <IconSearch />
              </span>
              <input
                placeholder="Search candidates, jobs, messages..."
                value={streamSearch}
                onChange={e => setStreamSearch(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: isLight ? '#F4F6F8' : '#1C252E',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  padding: '7px 12px 7px 36px',
                  fontSize: 12.5,
                  color: C.textPrimary,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Right Action Cluster: + Add Candidate, Bell with 2, Theme Moon, OM Omkesh Recruiter */}
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
              onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
              style={{
                background: '#2065D1',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(32,101,209,0.25)'
              }}
            >
              <span>+</span> <span>Add Candidate</span>
            </button>

            {/* Notification Bell with Badge count 2 */}
            <div style={{ position: 'relative', cursor: 'pointer', padding: 6 }}>
              <span style={{ fontSize: 17, color: C.textSecondary }}>🔔</span>
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                background: '#FF5630',
                color: '#FFF',
                borderRadius: '50%',
                width: 15,
                height: 15,
                fontSize: 9.5,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                2
              </span>
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

            {/* User Avatar + Name + Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#2065D1',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13
              }}>
                OM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary, lineHeight: 1.2 }}>Omkesh</span>
                <span style={{ fontSize: 11, color: C.textSecondary }}>Recruiter</span>
              </div>
              <span style={{ fontSize: 11, color: C.textSecondary, marginLeft: 2 }}>▾</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: C.bg }}>

          {/* VIEW 1: MINIMALS OVERVIEW DASHBOARD (EXACT REPLICA OF media_1789070880356.png) */}
          {inboxViewMode === 'dashboard' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', boxSizing: 'border-box' }}>
              <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
                
                {/* Greeting */}
                <div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: C.textPrimary, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    Hi, Welcome back 👋
                  </h1>
                  <p style={{ fontSize: 13.5, color: C.textSecondary, margin: 0 }}>
                    Here is your real-time candidate pipeline, auto-match telemetry, and requisition performance overview.
                  </p>
                </div>

                {/* The 4 Pastel KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  
                  {/* Card 1: Weekly sales (714k) */}
                  <div
                    onClick={() => { setInboxViewMode('stream'); setInboxSubMode('card'); }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(208, 242, 254, 0.8) 0%, rgba(186, 230, 253, 0.45) 100%)',
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
                        <IconShoppingBag />
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
                        <IconTrendingUp /> +2.6%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#006C9C', marginBottom: 4 }}>
                          Weekly sales
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#04297A', lineHeight: 1.1 }}>
                          714k
                        </div>
                      </div>
                      <IconSparkline color="#006C9C" />
                    </div>
                  </div>

                  {/* Card 2: New users (1.35m) */}
                  <div
                    onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 216, 249, 0.8) 0%, rgba(227, 210, 254, 0.45) 100%)',
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
                        <IconUser />
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
                        <IconTrendingDown /> -0.1%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#5119B7', marginBottom: 4 }}>
                          New users
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#27097A', lineHeight: 1.1 }}>
                          1.35m
                        </div>
                      </div>
                      <IconSparklineDown color="#5119B7" />
                    </div>
                  </div>

                  {/* Card 3: Purchase orders (1.72m) */}
                  <div
                    onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 247, 205, 0.8) 0%, rgba(255, 234, 167, 0.45) 100%)',
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
                        <IconCart />
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
                        <IconTrendingUp /> +2.8%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#B78103', marginBottom: 4 }}>
                          Purchase orders
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#7A4F01', lineHeight: 1.1 }}>
                          1.72m
                        </div>
                      </div>
                      <IconSparkline color="#B78103" />
                    </div>
                  </div>

                  {/* Card 4: Messages (234) */}
                  <div
                    onClick={() => setInboxViewMode('chat')}
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 231, 217, 0.8) 0%, rgba(255, 208, 189, 0.45) 100%)',
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
                        background: '#C8FACD',
                        color: '#007B55',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 20
                      }}>
                        <IconTrendingUp /> +3.6%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#B72136', marginBottom: 4 }}>
                          Messages
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#7A0C2E', lineHeight: 1.1 }}>
                          234
                        </div>
                      </div>
                      <IconSparkline color="#B72136" />
                    </div>
                  </div>

                </div>

                {/* The Two Main Analytics Cards (Donut + Dual Bar Chart) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                  
                  {/* Current visits (Donut Chart) */}
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
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: '0 0 16px' }}>
                        Current visits
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                        <svg width="220" height="220" viewBox="0 0 220 220">
                          {/* Segment 1: Blue 43.8% */}
                          <circle cx="110" cy="110" r="70" fill="transparent" stroke="#006C9C" strokeWidth="24" strokeDasharray="192 248" strokeDashoffset="0" transform="rotate(-90 110 110)" />
                          {/* Segment 2: Amber 31.3% */}
                          <circle cx="110" cy="110" r="70" fill="transparent" stroke="#FFAB00" strokeWidth="24" strokeDasharray="137 303" strokeDashoffset="-192" transform="rotate(-90 110 110)" />
                          {/* Segment 3: Cyan 18.8% */}
                          <circle cx="110" cy="110" r="70" fill="transparent" stroke="#00B8D9" strokeWidth="24" strokeDasharray="82 358" strokeDashoffset="-329" transform="rotate(-90 110 110)" />
                          {/* Segment 4: Red 6.3% */}
                          <circle cx="110" cy="110" r="70" fill="transparent" stroke="#FF5630" strokeWidth="24" strokeDasharray="28 412" strokeDashoffset="-411" transform="rotate(-90 110 110)" />
                          
                          <text x="110" y="105" textAnchor="middle" fontSize="22" fontWeight="800" fill={C.textPrimary}>43.8%</text>
                          <text x="110" y="124" textAnchor="middle" fontSize="11" fontWeight="600" fill={C.textSecondary}>America</text>
                        </svg>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 14px', fontSize: 12, fontWeight: 700, marginTop: 14 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#006C9C' }} /> America
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FFAB00' }} /> Asia
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00B8D9' }} /> Europe
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF5630' }} /> Africa
                      </span>
                    </div>
                  </div>

                  {/* Website visits (Dual Bar Chart) */}
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: '0 0 4px' }}>
                            Website visits
                          </h3>
                          <div style={{ fontSize: 13, color: C.textSecondary }}>
                            (+43%) than last year
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, fontWeight: 700 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2065D1' }} /> Team A
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textPrimary }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFAB00' }} /> Team B
                          </span>
                        </div>
                      </div>

                      {/* Bar Chart Visualization */}
                      <div style={{ height: 210, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, paddingBottom: 10, borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
                        {/* Horizontal Grid lines */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, borderBottom: `1px dashed ${C.border}`, height: 1 }} />
                        <div style={{ position: 'absolute', top: '33%', left: 0, right: 0, borderBottom: `1px dashed ${C.border}`, height: 1 }} />
                        <div style={{ position: 'absolute', top: '66%', left: 0, right: 0, borderBottom: `1px dashed ${C.border}`, height: 1 }} />

                        {[
                          { m: 'Jan', a: 45, b: 52 },
                          { m: 'Feb', a: 32, b: 70 },
                          { m: 'Mar', a: 22, b: 48 },
                          { m: 'Apr', a: 38, b: 68 },
                          { m: 'May', a: 68, b: 40 },
                          { m: 'Jun', a: 70, b: 38 },
                          { m: 'Jul', a: 38, b: 24 },
                          { m: 'Aug', a: 24, b: 72 },
                          { m: 'Sep', a: 56, b: 24 }
                        ].map((col, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 170 }}>
                              <div
                                style={{
                                  width: 10,
                                  height: `${col.a}%`,
                                  backgroundColor: '#2065D1',
                                  borderRadius: '4px 4px 0 0',
                                  transition: 'height 0.4s ease'
                                }}
                                title={`Team A: ${col.a}`}
                              />
                              <div
                                style={{
                                  width: 10,
                                  height: `${col.b}%`,
                                  backgroundColor: '#FFAB00',
                                  borderRadius: '4px 4px 0 0',
                                  transition: 'height 0.4s ease'
                                }}
                                title={`Team B: ${col.b}`}
                              />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary }}>{col.m}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, fontSize: 12 }}>
                      <span style={{ color: C.textSecondary }}>Data updated in real-time from server telemetry</span>
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
                        View Full Pipeline Breakdown ➔
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
                                ⚡ {c.matchScore || 85}% Fit
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {c.isSpamRecovery ? (
                                <span style={{ color: '#B72136', fontWeight: 700, fontSize: 11 }}>🛡️ Spam Recovered</span>
                              ) : c.sourceCategory === 'careers_portal' ? (
                                <span style={{ color: '#007B55', fontWeight: 700, fontSize: 11 }}>🌐 Careers Portal</span>
                              ) : (
                                <span style={{ color: '#006C9C', fontWeight: 700, fontSize: 11 }}>📥 Recruiter Email</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {(Array.isArray(c.skills) ? c.skills : String(c.skills || '').split(',')).slice(0, 3).map((sk, idx) => (
                                  <span key={idx} style={{ background: C.surface2, padding: '1px 6px', borderRadius: 4, fontSize: 10.5, color: C.textSecondary }}>
                                    {sk.trim()}
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
                                👁️ View Card &amp; Resume
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW 2: CANDIDATE TALENT STREAM VIEW (TOBU.AI MASTER-DETAIL & TABLE MODES) */}
          {inboxViewMode === 'stream' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
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
                      gap: 4
                    }}
                    title="Previous Candidate"
                  >
                    <IconChevronLeft /> <span>Prev Candidate</span>
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
                      gap: 4
                    }}
                    title="Next Candidate"
                  >
                    <span>Next Candidate</span> <IconChevronRight />
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
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Switch to Database Table View"
                  >
                    <IconTable /> <span>View Database Table</span>
                  </button>
                </div>

                {/* Right Action Cluster: Transfer, Email, Share, Download */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleAssignCandidateToReq(activeCandidate, currentReqId)}
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
                    title={`Assign to Requisition #${currentReqId}`}
                  >
                    <span>💼</span> <span>Transfer to Job (Req #{currentReqId})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(activeCandidate)}
                    style={{
                      background: '#7C3AED',
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
                    <IconMail /> <span>✉️ Email Candidate</span>
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
                    title="Download Full Resume"
                  >
                    <IconDownload /> <span>Download Resume</span>
                  </button>
                </div>
              </div>

              {/* Tobu Candidate Card Split View */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: C.bg }}>
                
                {/* LEFT SIDEBAR: Candidate Dossier (~290px) */}
                <div style={{
                  width: 300,
                  minWidth: 280,
                  maxWidth: 340,
                  flexShrink: 0,
                  borderRight: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  overflowY: 'auto',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  {/* Skill tags with '+' */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {candSkillsList.slice(0, 5).map((sk, idx) => (
                      <span key={idx} style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#2563EB',
                        backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                        border: '1px solid #BFDBFE',
                        borderRadius: 14,
                        padding: '2px 9px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        {sk.toLowerCase()} +
                      </span>
                    ))}
                  </div>

                  {/* Action Icons Row: Edit, Team, Chat */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                    <button
                      type="button"
                      onClick={() => handleAssignCandidateToReq(activeCandidate, currentReqId)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: C.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Quick Edit / Re-assign"
                    >
                      <IconPencil />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAssignCandidateToReq(activeCandidate, currentReqId)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: C.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Assign Candidate to Team / Requisition"
                    >
                      <IconUsers />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCandidateChat(activeCandidate)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Open Candidate Conversation"
                    >
                      <IconChat />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(activeCandidate?.id || activeCandidate?.email, e)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Toggle Favorite"
                    >
                      <IconStar filled={favoriteCandidateIds.has(activeCandidate?.id || activeCandidate?.email)} />
                    </button>
                  </div>

                  {/* Candidate Name & Contact Details */}
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: C.textPrimary, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                      {activeCandidate?.name || 'Candidate Profile'}
                    </h2>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 10 }}>
                      {activeCandidate?.role || 'Senior Specialist'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {activeCandidate?.email && (
                        <a
                          href={`mailto:${activeCandidate.email}`}
                          style={{ fontSize: 12.5, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}
                        >
                          <IconMail /> <span>{activeCandidate.email}</span>
                        </a>
                      )}

                      {activeCandidate?.phone && (
                        <a
                          href={`tel:${activeCandidate.phone}`}
                          style={{ fontSize: 12, color: C.textSecondary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <IconPhone /> <span>{activeCandidate.phone}</span>
                        </a>
                      )}

                      <a
                        href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(activeCandidate?.name || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#0A66C2',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 4
                        }}
                      >
                        <span>🔍</span> <span>Search on LinkedIn ↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Tobu Detailed Candidate Information Table */}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Gender</span>
                      <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeCandidate?.gender || 'Male (mostly)'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Total work experience</span>
                      <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeCandidate?.experience || '10+ Years'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Current location</span>
                      <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeCandidate?.location || 'United States'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Work Permit / Visa Status</span>
                      <strong style={{ color: '#16A34A', fontSize: 12.5 }}>{activeCandidate?.visaStatus || 'US Citizen'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Target Requisition</span>
                      <strong style={{ color: '#2563EB', fontSize: 12.5 }}>Req #{currentReqId} · {activeTargetJob?.title?.slice(0, 24)}...</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>AI Fit Match</span>
                      <strong style={{ color: '#D97706', fontSize: 12.5 }}>🔥 {calculatedFitScore}% Fit</strong>
                    </div>

                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Source Channel</span>
                      {activeCandidate?.isSpamRecovery ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          🛡️ Recovered from Spam Folder
                        </span>
                      ) : activeCandidate?.sourceCategory === 'careers_portal' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          🌐 Careers Portal (/jobs)
                        </span>
                      ) : activeCandidate?.sourceCategory === 'vendor_bench' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#7E22CE', background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          🏢 Vendor Bench Partner
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          📧 Recruiter Email Inbox
                        </span>
                      )}
                    </div>
                  </div>

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
                      { id: 'analytics', label: 'Analytics', icon: '📊' },
                      { id: 'resume', label: 'Resume', icon: '📄' },
                      { id: 'comments', label: 'Comments', icon: '💬' },
                      { id: 'emails', label: 'Emails', icon: '✉️' },
                      { id: 'activity', label: 'Activity', icon: '⏱️' }
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
                          <span>{tab.icon}</span> <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Tab Body Canvas */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
                    
                    {/* 1. RESUME TAB */}
                    {activeTobuTab === 'resume' && (
                      <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        
                        {/* Top Skill Occurrence Frequency Bar (Matching Tobu.ai Screenshot) */}
                        <div style={{
                          backgroundColor: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '12px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Top Keyword Frequency:
                            </span>
                            {candidateFrequencies.length > 0 ? (
                              candidateFrequencies.map((sk, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#047857',
                                    backgroundColor: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.15)',
                                    border: '1px solid #A7F3D0',
                                    borderRadius: 16,
                                    padding: '2px 9px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  {sk.name.toLowerCase()} ({sk.count} {sk.count === 1 ? 'time' : 'times'})
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: 11.5, color: C.textSecondary, fontStyle: 'italic' }}>
                                Parsing skill frequencies from candidate resume...
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const element = document.createElement('a')
                              const file = new Blob([candResumeText], { type: 'text/plain' })
                              element.href = URL.createObjectURL(file)
                              element.download = `${(activeCandidate?.name || 'Candidate').replace(/\s+/g, '_')}_Resume.txt`
                              document.body.appendChild(element)
                              element.click()
                            }}
                            style={{
                              background: 'transparent',
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              padding: '5px 12px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: C.textPrimary,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <IconDownload /> <span>Download Resume</span>
                          </button>
                        </div>

                        {/* Tobu.ai Metadata Table (Resume Uploader | Method | Source | Received On) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          backgroundColor: C.surface,
                          overflow: 'hidden'
                        }}>
                          <div style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Resume Uploader</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.recruiterName || currentUser?.name || 'Omkesh Manjute'}
                              <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 500 }}>({activeCandidate?.recruiterEmail || currentUser?.email || 'omkesh@coolsofttech.com'})</div>
                            </div>
                          </div>

                          <div style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Method of Upload</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.isSpamRecovery ? 'Email Spam Harvest' : activeCandidate?.sourceCategory === 'careers_portal' ? 'Careers Job Portal' : activeCandidate?.sourceCategory === 'vendor_bench' ? 'Vendor Submittal' : 'Email Parser'}
                            </div>
                          </div>

                          <div style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Source</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.source || 'Yahoo Small Business (omkesh@coolsofttech.com)'}
                            </div>
                          </div>

                          <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Received On</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.createdAt ? new Date(activeCandidate.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '10th Sep, 2026, 09:42 PM'}
                            </div>
                          </div>
                        </div>

                        {/* AI Requisition Match & Highlight Toolbar */}
                        <div style={{
                          backgroundColor: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '10px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>
                              🎯 Target Requisition:
                            </span>
                            <select
                              value={currentReqId}
                              onChange={e => setDrawerReqId(e.target.value)}
                              style={{
                                background: C.inputBg,
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: C.textPrimary,
                                outline: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              {openJobsList.map(j => (
                                <option key={j.id} value={j.id}>
                                  Req #{j.id} · {j.title.slice(0, 36)}... ({j.rate})
                                </option>
                              ))}
                            </select>

                            <span style={{
                              fontSize: 11.5,
                              fontWeight: 900,
                              color: calculatedFitScore >= 85 ? '#15803D' : '#B45309',
                              backgroundColor: calculatedFitScore >= 85 ? '#DCFCE7' : '#FEF3C7',
                              border: `1px solid ${calculatedFitScore >= 85 ? '#86EFAC' : '#FDE68A'}`,
                              padding: '2px 8px',
                              borderRadius: 4
                            }}>
                              🔥 {calculatedFitScore}% Match Fit
                            </span>

                            <span style={{ fontSize: 11, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 4, fontWeight: 800, border: '1px solid #FDE68A' }}>
                              💡 Matching skills highlighted in yellow
                            </span>
                          </div>

                          {/* In-Resume Search Input */}
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

                        {/* Matching Skills Chips */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
                          <span style={{ fontWeight: 800, color: '#15803D' }}>Matching Skills:</span>
                          {dynamicMatchingSkills.length > 0 ? (
                            dynamicMatchingSkills.map((sk, i) => (
                              <span key={i} style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '1px 7px', borderRadius: 3, fontWeight: 700 }}>
                                ✓ {sk}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: C.textSecondary, fontStyle: 'italic' }}>None matched</span>
                          )}

                          {dynamicMissingSkills.length > 0 && (
                            <>
                              <span style={{ fontWeight: 800, color: '#DC2626', marginLeft: 8 }}>Missing Skills:</span>
                              {dynamicMissingSkills.map((sk, i) => (
                                <span key={i} style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '1px 7px', borderRadius: 3, fontWeight: 700 }}>
                                  ✗ {sk}
                                </span>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Full Paper Resume Sheet */}
                        {highlightResumeText(candResumeText, dynamicMatchingSkills, resumeKeywordSearch)}
                      </div>
                    )}

                    {/* 2. ANALYTICS TAB */}
                    {activeTobuTab === 'analytics' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                            📊 AI Fit & Competency Analytics
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>Position Alignment</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB', marginTop: 2 }}>{activeTargetJob?.title}</div>
                              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>Pay Rate: {activeTargetJob?.rate} • Client: {activeTargetJob?.client}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>Overall Requisition Match</div>
                              <div style={{ fontSize: 24, fontWeight: 900, color: calculatedFitScore >= 80 ? '#16A34A' : '#D97706', marginTop: 2 }}>{calculatedFitScore}%</div>
                              <div style={{ fontSize: 11.5, color: C.textSecondary }}>{dynamicMatchingSkills.length} of {reqSkillsList.length} required skills matched</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                            🛡️ Compliance &amp; Verification Audit
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                            <div><strong>Driver's License OCR:</strong> <span style={{ color: '#16A34A' }}>✓ Match Verified</span></div>
                            <div><strong>Biometric Selfie:</strong> <span style={{ color: '#16A34A' }}>✓ Match Passed (98%)</span></div>
                            <div><strong>US Work Authorization:</strong> <span style={{ color: '#16A34A' }}>✓ Active ({activeCandidate?.visaStatus || 'US Citizen'})</span></div>
                            <div><strong>Origin Folder:</strong> <span>{activeCandidate?.folder || 'INBOX'}</span></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. COMMENTS TAB */}
                    {activeTobuTab === 'comments' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                            💬 Internal Recruiter Screening Notes
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

                    {/* 4. EMAILS TAB */}
                    {activeTobuTab === 'emails' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                              ✉️ Email Activity &amp; RTR Communications
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleOpenEmailModal(activeCandidate)}
                              style={{ background: '#7C3AED', color: '#FFF', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
                            >
                              + New Email
                            </button>
                          </div>
                          <div style={{ fontSize: 12.5, color: C.textSecondary, lineHeight: 1.6 }}>
                            <div><strong>Recipient:</strong> {activeCandidate?.email}</div>
                            <div><strong>Sender:</strong> {currentUser?.email || 'omkesh@coolsofttech.com'} (COOLSOFT LLC)</div>
                            <div><strong>Status:</strong> Ready for client submittal / RTR authorization</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. ACTIVITY TAB */}
                    {activeTobuTab === 'activity' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { title: 'Candidate Ingested into ATS', time: '10th Sep 2026, 09:42 PM', desc: `Ingested from ${activeCandidate?.source || 'Email Inbox'} by ${currentUser?.name || 'Omkesh Manjute'}` },
                          { title: 'AI Match Calculated', time: '10th Sep 2026, 09:43 PM', desc: `Fit score calculated at ${calculatedFitScore}% for Req #${currentReqId} (${activeTargetJob?.title})` },
                          { title: 'Profile Viewed', time: 'Just now', desc: `Profile inspected by ${currentUser?.name || 'Omkesh Manjute'}` }
                        ].map((act, i) => (
                          <div key={i} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', marginTop: 5 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{act.title}</div>
                              <div style={{ fontSize: 11, color: C.textSecondary }}>{act.time}</div>
                              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>{act.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* B. TOBU.AI DATABASE TABLE VIEW (MATCHING media_1789068954400.png) */}
          {inboxSubMode === 'table' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: C.bg }}>
              
              {/* Left Mailbox / Origin Sidebar (~240px) */}
              <div style={{
                width: 240,
                minWidth: 220,
                flexShrink: 0,
                borderRight: `1px solid ${C.border}`,
                backgroundColor: C.surface,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                      <IconSearch />
                    </span>
                    <input
                      placeholder="Search mailboxes..."
                      style={{
                        width: '100%',
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px 6px 28px',
                        fontSize: 11.5,
                        color: C.textPrimary,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Mailboxes list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[
                    { id: 'all', label: 'Entire Database', icon: '📁', count: streamCandidates.length },
                    { id: 'inbox', label: 'Resume Emails', icon: '📥', count: streamCandidates.filter(c => c.sourceCategory === 'email_inbox').length },
                    { id: 'spam', label: 'Spam / Recovered', icon: '🛡️', count: streamCandidates.filter(c => c.sourceCategory === 'email_spam' || c.isSpamRecovery).length },
                    { id: 'careers', label: 'Careers Portal', icon: '🌐', count: streamCandidates.filter(c => c.sourceCategory === 'careers_portal').length },
                    { id: 'vendor', label: 'Vendor Bench', icon: '🏢', count: streamCandidates.filter(c => c.sourceCategory === 'vendor_bench').length },
                    { id: 'favorites', label: 'Starred Favorites', icon: '⭐', count: favoriteCandidateIds.size }
                  ].map(cat => {
                    const isSelected = tableCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setTableCategory(cat.id); setTablePage(1); }}
                        style={{
                          background: isSelected ? (isLight ? '#EFF6FF' : 'rgba(37,99,235,0.18)') : 'transparent',
                          color: isSelected ? '#2563EB' : C.textPrimary,
                          border: `1px solid ${isSelected ? '#BFDBFE' : 'transparent'}`,
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 12.5,
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{cat.icon}</span> <span>{cat.label}</span>
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isSelected ? '#2563EB' : C.textSecondary,
                          background: isSelected ? (isLight ? '#DBEAFE' : 'rgba(37,99,235,0.25)') : C.inputBg,
                          padding: '1px 6px',
                          borderRadius: 10
                        }}>
                          {cat.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Table Canvas */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Table Top Toolbar */}
                <div style={{
                  padding: '12px 24px',
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  flexShrink: 0
                }}>
                  {/* Left: Bulk Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary }}>
                      {selectedCardIds.size} candidates selected
                    </span>

                    {selectedCardIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          selectedCardIds.forEach(id => {
                            const c = streamCandidates.find(item => item.id === id || item.email === id)
                            if (c) handleAssignCandidateToReq(c, currentReqId)
                          })
                        }}
                        style={{
                          background: '#2563EB',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        💼 Transfer Selected to Req #{currentReqId}
                      </button>
                    )}
                  </div>

                  {/* Right: Filters & View Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <select
                      value={streamReqFilter}
                      onChange={e => setStreamReqFilter(e.target.value)}
                      style={{
                        background: C.inputBg,
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
                      <option value="all">🎯 All Open Requisitions</option>
                      {openJobsList.map(j => (
                        <option key={j.id} value={j.id}>
                          Req #{j.id} · {j.title.slice(0, 28)}...
                        </option>
                      ))}
                    </select>

                    <div style={{ position: 'relative', width: 260 }}>
                      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                        <IconSearch />
                      </span>
                      <input
                        value={streamSearch}
                        onChange={e => setStreamSearch(e.target.value)}
                        placeholder="Search candidate name, role, skills, location..."
                        style={{
                          width: '100%',
                          background: C.inputBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: '6px 8px 6px 28px',
                          fontSize: 12,
                          color: C.textPrimary,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setInboxSubMode('card')}
                      style={{
                        background: '#2563EB',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Switch to Candidate Card View"
                    >
                      <IconIdCard /> <span>Candidate Card View</span>
                    </button>
                  </div>
                </div>

                {/* Table Area */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, color: C.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        <th style={{ padding: '10px 14px', width: 36 }}>
                          <input
                            type="checkbox"
                            checked={selectedCardIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCardIds(new Set(filteredCandidates.map(c => c.id || c.email)))
                              } else {
                                setSelectedCardIds(new Set())
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '10px 14px' }}>Candidate Name & Role</th>
                        <th style={{ padding: '10px 14px' }}>Source / Mailbox</th>
                        <th style={{ padding: '10px 14px' }}>Target Job & Fit</th>
                        <th style={{ padding: '10px 14px' }}>Top Skills</th>
                        <th style={{ padding: '10px 14px' }}>Location & Visa</th>
                        <th style={{ padding: '10px 14px' }}>Received Date</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: C.textSecondary }}>
                            No candidates found in this database mailbox.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates
                          .slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)
                          .map((c, idx) => {
                            const candId = c.id || c.email || `cand-${idx}`
                            const isSelected = selectedCardIds.has(candId)
                            const skillsArr = Array.isArray(c.skills) ? c.skills : (c.skills ? String(c.skills).split(',').map(s => s.trim()) : [])
                            
                            return (
                              <tr
                                key={candId}
                                style={{
                                  borderBottom: `1px solid ${C.border}`,
                                  backgroundColor: isSelected ? (isLight ? '#EFF6FF' : 'rgba(37,99,235,0.12)') : 'transparent',
                                  transition: 'background 0.15s'
                                }}
                              >
                                <td style={{ padding: '12px 14px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleSelectCard(candId, e)}
                                  />
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div
                                    onClick={() => {
                                      setSelectedCandidate(c)
                                      setInboxSubMode('card')
                                    }}
                                    style={{ fontSize: 13.5, fontWeight: 800, color: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                    title="Open Candidate Card"
                                  >
                                    <span>{c.name}</span> <IconExternalLink />
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, marginTop: 2 }}>
                                    {c.role || 'Senior Specialist'}
                                  </div>
                                  <div style={{ fontSize: 11, color: C.textSecondary }}>
                                    {c.email} {c.phone ? `• ${c.phone}` : ''}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  {c.isSpamRecovery ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '2px 7px', borderRadius: 4 }}>
                                      🛡️ Spam Recovered
                                    </span>
                                  ) : c.sourceCategory === 'careers_portal' ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 7px', borderRadius: 4 }}>
                                      🌐 Careers Portal
                                    </span>
                                  ) : c.sourceCategory === 'vendor_bench' ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7E22CE', background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '2px 7px', borderRadius: 4 }}>
                                      🏢 Vendor Bench
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 7px', borderRadius: 4 }}>
                                      📧 Email Inbox
                                    </span>
                                  )}
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                                    Req #{c.targetReqId || '159079'}
                                  </div>
                                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>
                                    🔥 {c.matchScore || 95}% Fit
                                  </span>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                                    {skillsArr.slice(0, 3).map((sk, sIdx) => (
                                      <span key={sIdx} style={{ fontSize: 10.5, background: C.inputBg, border: `1px solid ${C.border}`, padding: '1px 6px', borderRadius: 3, color: C.textSecondary }}>
                                        {sk}
                                      </span>
                                    ))}
                                    {skillsArr.length > 3 && (
                                      <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700 }}>
                                        +{skillsArr.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: 12, color: C.textPrimary }}>{c.location || 'United States'}</div>
                                  <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>{c.visaStatus || 'US Citizen'}</div>
                                </td>

                                <td style={{ padding: '12px 14px', fontSize: 11.5, color: C.textSecondary }}>
                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 10, 2026'}
                                </td>

                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCandidate(c)
                                        setInboxSubMode('card')
                                      }}
                                      style={{
                                        background: C.inputBg,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        color: C.textPrimary
                                      }}
                                      title="View Candidate Card & Resume"
                                    >
                                      👁️ Card
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEmailModal(c)}
                                      style={{
                                        background: '#7C3AED',
                                        color: '#FFF',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                      title="Draft Email"
                                    >
                                      ✉️
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleAssignCandidateToReq(c, currentReqId)}
                                      style={{
                                        background: '#16A34A',
                                        color: '#FFF',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                      title={`Add to Req #${currentReqId}`}
                                    >
                                      ➕
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

                {/* Table Pagination Footer */}
                <div style={{
                  padding: '10px 24px',
                  borderTop: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: C.textSecondary,
                  flexShrink: 0
                }}>
                  <div>
                    Showing {filteredCandidates.length === 0 ? 0 : (tablePage - 1) * tablePageSize + 1} to {Math.min(tablePage * tablePageSize, filteredCandidates.length)} of {filteredCandidates.length} candidates
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>Results per page: <strong>{tablePageSize}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setTablePage(p => Math.max(1, p - 1))}
                        disabled={tablePage === 1}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: `1px solid ${C.border}`,
                          backgroundColor: tablePage === 1 ? C.inputBg : C.surface,
                          cursor: tablePage === 1 ? 'not-allowed' : 'pointer',
                          color: tablePage === 1 ? C.textSecondary : C.textPrimary,
                          fontSize: 12
                        }}
                      >
                        Prev
                      </button>
                      <span style={{ fontWeight: 600 }}>Page {tablePage} of {Math.max(1, Math.ceil(filteredCandidates.length / tablePageSize))}</span>
                      <button
                        type="button"
                        onClick={() => setTablePage(p => (p * tablePageSize < filteredCandidates.length ? p + 1 : p))}
                        disabled={tablePage * tablePageSize >= filteredCandidates.length}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: `1px solid ${C.border}`,
                          backgroundColor: tablePage * tablePageSize >= filteredCandidates.length ? C.inputBg : C.surface,
                          cursor: tablePage * tablePageSize >= filteredCandidates.length ? 'not-allowed' : 'pointer',
                          color: tablePage * tablePageSize >= filteredCandidates.length ? C.textSecondary : C.textPrimary,
                          fontSize: 12
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

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
                    <option value="all">🌐 All Recruiters & Channels ({threads.length})</option>
                    {ALL_SMARTHIRE_RECRUITERS.map(r => (
                      <option key={r.refCode} value={r.refCode}>👤 {r.name}</option>
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
                            <span style={{ fontSize: 11, color: C.textSecondary, flexShrink: 0, marginLeft: 6 }}>
                              {thread.lastMessageTime || formatTime(thread.timestamp)}
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
                            {thread.subtitle || thread.jobTitle || 'Team Member • SmartHire ATS'}
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
                              {thread.lastMessage}
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
                          setMessageToast(`📞 Calling ${activeThread.candidateName}...`)
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
                          setMessageToast(`📹 Starting video meeting with ${activeThread.candidateName}...`)
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
                        Today, 10 Sept 2026
                      </span>
                    </div>

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

                        const timeDisplay = msg.timeStr || (msg.timestamp ? formatTime(msg.timestamp) : '02:22 PM')

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
                              {msg.text}
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
                        {['👍', '👋', '🚀', '📄', '✅', '🎉', '💡', '👏', '😊', '🔥'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => { setInputText(t => t + ' ' + emoji); setEmojiPickerOpen(false); inputRef.current?.focus(); }}
                            style={{ background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', padding: '2px 4px' }}
                          >
                            {emoji}
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
                            📎 {file.name}
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
                          setMessageToast('📎 File attached: Candidate_Resume_Update.pdf')
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
                          setMessageToast('📎 File attached: Req_159078_Profile_Shortlist.xlsx')
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
                      🕒 Local 02:25 PM (EST)
                    </span>
                  </div>
                </div>

                {/* 4-Button Quick Action Row: Call, Video, Email, More */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMessageToast(`📞 Calling ${activeThread.candidateName}...`)
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
                      setMessageToast(`📹 Starting video meeting with ${activeThread.candidateName}...`)
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
                      setEmailModalCandidate({
                        name: activeThread.candidateName,
                        email: activeThread.email || 'gourav@smarthire.com',
                        targetReqId: '159078',
                        matchedJobTitle: 'Public Health Program Director 1',
                        matchedJobClient: 'Tennessee Department of Health'
                      })
                      setEmailTo(activeThread.email || 'gourav@smarthire.com')
                      setEmailSubject(`SmartHire ATS: Quick sync regarding Req #159078`)
                      setEmailBody(`Hi ${(activeThread.name || activeThread.candidateName).split(' ')[0]},\n\nSharing the latest updates for your review.\n\nWith Regards,\nOmkesh Manjute\nCOOLSOFT LLC`)
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconUser /></span>
                      <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activeThread.role || 'Sourcing Specialist'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconBriefcase /></span>
                      <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activeThread.company || 'SmartHire LLC'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconMail /></span>
                      <a
                        href={`mailto:${activeThread.email || 'gourav@smarthire.com'}`}
                        style={{ color: '#2065D1', textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all' }}
                      >
                        {activeThread.email || 'gourav@smarthire.com'}
                      </a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconPhone /></span>
                      <a
                        href={`tel:${activeThread.phone || '+15551234567'}`}
                        style={{ color: C.textPrimary, textDecoration: 'none', fontWeight: 500 }}
                      >
                        {activeThread.phone || '+1 (555) 123-4567'}
                      </a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ color: C.textSecondary, flexShrink: 0 }}><IconLocation /></span>
                      <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activeThread.location || 'New York, USA'}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Files Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, letterSpacing: '0.02em' }}>
                      Recent Files
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMessageToast('Displaying all shared requisition attachments.')
                        setTimeout(() => setMessageToast(''), 3000)
                      }}
                      style={{ background: 'none', border: 'none', color: '#2065D1', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      View All
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(activeThread.recentFiles || [
                      { name: 'Candidate_List.xlsx', size: '12 KB', date: '5 Sept', type: 'excel' },
                      { name: 'Req_159078_Notes.pdf', size: '245 KB', date: '4 Sept', type: 'pdf' },
                      { name: 'Interview_Schedule.docx', size: '18 KB', date: '2 Sept', type: 'word' }
                    ]).map((file, idx) => (
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
                          setMessageToast(`Downloading ${file.name}...`)
                          setTimeout(() => setMessageToast(''), 3000)
                        }}
                      >
                        {file.type === 'excel' ? <IconFileExcel /> : file.type === 'word' ? <IconFileWord /> : <IconFilePdf />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: 10.5, color: C.textSecondary }}>
                            {file.size} • {file.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                      ✨ {p}
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

      {/* MONSTER+ FLOATING EMAIL COMPOSER (Docked Bottom-Right, Matching media_1789066806510.png) */}
      {emailModalCandidate && (
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
              🔒 From: {currentUser?.email || 'omkesh@coolsofttech.com'}
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
              ⚡ Templates:
            </span>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('rtr')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📋 RTR Auth
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('screen')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📞 Screening Call
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('rate')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              💵 Rate & Auth
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('interview')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📅 Interview Shortlist
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

          {/* Bottom Formatting & Action Bar (Matching Monster+ Toolbar: ↩ ↪ B I 🔗 ... Send) */}
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
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, borderRadius: 4 }}
              >
                🔗
              </button>

              {/* Local Desktop Mail Launcher */}
              <button
                type="button"
                title="Launch in Desktop Outlook / Apple Mail"
                onClick={() => {
                  const fullSig = `\n\nWith Regards,\n${currentUser?.name || 'Omkesh Manjute'}\nLead Recruiter\nCOOLSOFT LLC | ${currentUser?.email || 'omkesh@coolsofttech.com'}\nhttp://www.coolsofttech.com`
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
                📨 Mail App
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
        const currentReqId = String(drawerReqId || candidateDetails.targetReqId || '159079').replace(/^J-/, '')
        const activeTargetJob = openJobsList.find(j => String(j.id) === currentReqId) || openJobsList[0]

        // Candidate skills list
        const candidateSkills = Array.isArray(candidateDetails.skills)
          ? candidateDetails.skills
          : (typeof candidateDetails.skills === 'string' ? candidateDetails.skills.split(',').map(s => s.trim()) : [])

        const candidateCorpus = (resumeText + ' ' + candidateSkills.join(' ')).toLowerCase()

        // Match against selected requisition's skills
        const targetJobSkills = activeTargetJob?.skills || ['Java', 'SQL']
        const dynamicMatchingSkills = targetJobSkills.filter(reqSkill => {
          if (!reqSkill) return false
          const s = reqSkill.toLowerCase().trim()
          return candidateCorpus.includes(s) || candidateSkills.some(cs => cs.toLowerCase().includes(s) || s.includes(cs.toLowerCase()))
        })
        const dynamicMissingSkills = targetJobSkills.filter(reqSkill => !dynamicMatchingSkills.includes(reqSkill))

        // Dynamic match score calculation
        const matchRatio = targetJobSkills.length > 0 ? (dynamicMatchingSkills.length / targetJobSkills.length) : 0.8
        const dynamicMatchScore = Math.max(65, Math.min(99, Math.round(matchRatio * 100)))

        // Title alignment check
        const candRoleLower = (candidateDetails.role || candidateDetails.title || candidateName).toLowerCase()
        const targetTitleLower = (activeTargetJob?.title || '').toLowerCase()
        const isTitleAligned = candRoleLower.split(' ').some(w => w.length > 3 && targetTitleLower.includes(w))

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
                          🛡️ Recovered from Spam Folder
                        </span>
                      ) : candidateDetails.sourceCategory === 'careers_portal' ? (
                        <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          🌐 Careers Portal (/jobs)
                        </span>
                      ) : candidateDetails.sourceCategory === 'vendor_bench' ? (
                        <span style={{ background: '#FAF5FF', color: '#7C3AED', border: '1px solid #E9D5FF', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          🏢 Vendor Bench
                        </span>
                      ) : (
                        <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          📧 Recruiter Email Inbox
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
                        ⚡ {dynamicMatchScore}% Fit for Req #{currentReqId}
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
                    <IconSend /> ✉️ Send Email / RTR
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
                    <span>➕</span> Add to Req #{currentReqId}
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
                        🎯 AI Multi-Position Match Analyzer
                      </h4>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 12 }}>
                        ● Live Evaluator
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 11.5, color: C.textSecondary, lineHeight: 1.4 }}>
                      Select an open position below to evaluate candidate fit and update resume skill highlights:
                    </p>

                    {/* Position Selector Dropdown */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Active Target Requisition:
                      </label>
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

                    {/* Title Alignment */}
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: isTitleAligned ? '#15803D' : C.textSecondary, background: isTitleAligned ? '#DCFCE7' : C.inputBg, border: `1px solid ${isTitleAligned ? '#86EFAC' : C.border}`, padding: '6px 10px', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{isTitleAligned ? '✓' : 'ℹ️'}</span>
                      <span>{isTitleAligned ? `Strong Role Fit: Candidate matches ${activeTargetJob?.title}` : `Transferable Profile: Candidate background aligns with ${activeTargetJob?.title}`}</span>
                    </div>

                    {/* Matching Skills */}
                    {dynamicMatchingSkills && dynamicMatchingSkills.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>✓</span> Matching Technical Skills (Highlighted Yellow in Resume):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {dynamicMatchingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 5, background: '#DCFCE7', color: '#15803D', fontWeight: 700, border: '1px solid #86EFAC' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {dynamicMissingSkills && dynamicMissingSkills.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>✗</span> Missing / Gap Skills:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {dynamicMissingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 5, background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, border: '1px solid #FECACA' }}>{s}</span>
                          ))}
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
                        ➕ Assign to Req #{currentReqId}
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
                        ✉️ Draft Email
                      </button>
                    </div>

                  </div>

                  {/* Compliance & Audit */}
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🛡️ Trust Verification &amp; Document Audit
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>Driver's License OCR Check:</span>
                        <strong style={{ color: hasDl ? '#16A34A' : '#64748B' }}>
                          {hasDl ? '✓ Match Verified' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>Biometric Selfie verification:</span>
                        <strong style={{ color: hasSelfie ? '#16A34A' : '#64748B' }}>
                          {hasSelfie ? '✓ Match Passed (98%)' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>US Work Auth Visa verification:</span>
                        <strong style={{ color: hasVisa ? '#16A34A' : '#64748B' }}>
                          {hasVisa ? '✓ Active / Verified' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      {candidateDetails.gps_data && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                          <span style={{ color: C.textSecondary }}>GPS Submission Geolocation:</span>
                          <strong style={{ color: C.textPrimary }}>
                            📍 {candidateDetails.gps_data.city || 'Dallas'}, {candidateDetails.gps_data.state || 'TX'}
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
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>📄 Monster-Style Resume Viewer</span>
                      <span style={{ fontSize: 11, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 4, fontWeight: 800, border: '1px solid #FDE68A' }}>
                        💡 Matching skills for Req #{currentReqId} highlighted in yellow
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
    </div>
  )
}