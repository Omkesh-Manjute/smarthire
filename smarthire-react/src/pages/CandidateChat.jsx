import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

const API = '/api/screening'

export default function CandidateChat() {
  const { sessionId: routeSessionId, jobId } = useParams()
  const navigate = useNavigate()

  // Session & Loading States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [session, setSession] = useState(null)
  const [sessionId, setSessionId] = useState(routeSessionId || '')

  // Security & Single-Use State
  const [isDuplicateTab, setIsDuplicateTab] = useState(false)
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false)
  const [submittedAtDate, setSubmittedAtDate] = useState(null)

  // Step flow: 
  // 1: Candidate Verification & Role Overview
  // 2: Security, Proctoring & Media Permissions Setup (Camera, Mic, Screen Share, GPS)
  // 3: Continuous Proctored Interview Studio (Single Take Recording)
  // 4: Review Proctored Recording & Integrity Report
  // 5: Submitted Confirmation
  const [step, setStep] = useState(1)

  // Step 1: Candidate Basic Info
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [candidatePhone, setCandidatePhone] = useState('')
  const [candidateLinkedin, setCandidateLinkedin] = useState('')
  const [candidateLocation, setCandidateLocation] = useState('')
  const [expectedRate, setExpectedRate] = useState('')
  const [visaStatus, setVisaStatus] = useState('US Citizen')

  // Questions from session
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Proctoring & Media Device Permissions
  const [hasCameraPermission, setHasCameraPermission] = useState(false)
  const [hasMicPermission, setHasMicPermission] = useState(false)
  const [hasScreenSharePermission, setHasScreenSharePermission] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [candidateGeo, setCandidateGeo] = useState(null)
  const [deviceCheckError, setDeviceCheckError] = useState(null)
  const [screenCheckError, setScreenCheckError] = useState(null)
  const [micVolume, setMicVolume] = useState(0)

  // Anti-Cheat Proctoring States
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tabViolationsCount, setTabViolationsCount] = useState(0)
  const [showTabWarningModal, setShowTabWarningModal] = useState(false)
  const [proctoringViolationsLog, setProctoringViolationsLog] = useState([])
  const [isCheatingLocked, setIsCheatingLocked] = useState(false)

  // Continuous Single-Take Recording
  const [isRecording, setIsRecording] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [masterVideoBlob, setMasterVideoBlob] = useState(null)
  const [masterVideoUrl, setMasterVideoUrl] = useState(null)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('')

  // Question Markers within continuous recording:
  // Array of { questionId, questionIndex, questionText, startTime, endTime, duration, transcript }
  const [questionMarkers, setQuestionMarkers] = useState([])
  const currentQStartTimeRef = useRef(0)
  const markersRef = useRef([])

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [submissionResult, setSubmissionResult] = useState(null)

  // Media Refs
  const previewVideoRef = useRef(null)
  const deviceCheckVideoRef = useRef(null)
  const screenPreviewVideoRef = useRef(null)
  const streamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const recordedChunksRef = useRef([])
  const masterVideoPlayerRef = useRef(null)

  // ─── 1. MULTI-TAB DETECTION (SINGLE INSTANCE LOCK) ─────────────────────────
  useEffect(() => {
    if (!sessionId || typeof window === 'undefined') return

    const currentTabId = 'tab_' + Math.random().toString(36).substring(2, 9)
    const storageKey = `smarthire_active_session_${sessionId}`

    // Check if another window or tab is currently holding the session
    try {
      const existing = localStorage.getItem(storageKey)
      if (existing) {
        const parsed = JSON.parse(existing)
        if (parsed.tabId !== currentTabId && Date.now() - parsed.lastSeen < 6000) {
          setIsDuplicateTab(true)
        }
      }
    } catch (e) {}

    // Register our tab heartbeat
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tabId: currentTabId, lastSeen: Date.now() }))
    } catch (e) {}

    const heartbeatInterval = setInterval(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ tabId: currentTabId, lastSeen: Date.now() }))
      } catch (e) {}
    }, 2500)

    const handleStorage = (e) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.tabId !== currentTabId && Date.now() - parsed.lastSeen < 6000) {
            setIsDuplicateTab(true)
          }
        } catch (err) {}
      }
    }
    window.addEventListener('storage', handleStorage)

    let bc = null
    try {
      if (window.BroadcastChannel) {
        bc = new BroadcastChannel(`smarthire_screen_lock_${sessionId}`)
        bc.postMessage({ type: 'CHECK_ACTIVE_WINDOW', tabId: currentTabId })

        bc.onmessage = (event) => {
          if (event.data?.type === 'CHECK_ACTIVE_WINDOW' && event.data.tabId !== currentTabId) {
            bc.postMessage({ type: 'ACTIVE_WINDOW_EXISTS', tabId: currentTabId })
          } else if (event.data?.type === 'ACTIVE_WINDOW_EXISTS' && event.data.tabId !== currentTabId) {
            setIsDuplicateTab(true)
          }
        }
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e)
    }

    return () => {
      clearInterval(heartbeatInterval)
      window.removeEventListener('storage', handleStorage)
      if (bc) {
        try { bc.close() } catch (e) {}
      }
      try {
        const cur = localStorage.getItem(storageKey)
        if (cur && JSON.parse(cur).tabId === currentTabId) {
          localStorage.removeItem(storageKey)
        }
      } catch (e) {}
    }
  }, [sessionId])

  // ─── 2. GEOLOCATION PROCTORING CAPTURE ─────────────────────────────────────
  const captureCandidateLocation = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const geoData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            capturedAt: new Date().toISOString()
          }
          setCandidateGeo(geoData)
          setHasLocationPermission(true)
          if (!candidateLocation) {
            setCandidateLocation(`GPS ${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°`)
          }
        },
        (err) => {
          console.warn('Geolocation capture notice:', err.message)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [candidateLocation])

  useEffect(() => {
    captureCandidateLocation()
  }, [captureCandidateLocation])

  // ─── 3. FETCH OR CREATE SCREENING SESSION ──────────────────────────────────
  useEffect(() => {
    let isMounted = true

    async function loadScreeningData() {
      setLoading(true)
      setError(null)
      try {
        let activeId = routeSessionId
        if (!activeId && jobId) {
          const res = await fetch(`${API}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId })
          })
          const data = await res.json()
          if (data.success) {
            activeId = data.sessionId
            setSessionId(activeId)
          } else {
            throw new Error(data.message || 'Failed to initialize screening session')
          }
        }

        if (!activeId) {
          activeId = 'SCR-DEMO-' + Date.now().toString().slice(-4)
          setSessionId(activeId)
        }

        let sessionData = null
        try {
          const res = await fetch(`${API}/${activeId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.session) {
              sessionData = data.session
            }
          }
        } catch (fetchErr) {
          console.warn('Backend screening session not found, using demo session:', fetchErr)
        }

        if (!sessionData) {
          sessionData = {
            id: activeId,
            jobTitle: 'Cloud Platform Specialist',
            jobClient: 'Enterprise Cloud Systems',
            jobReqId: '74921',
            recruiterName: 'Omkesh Manjute',
            recruiterEmail: 'omkesh@coolsofttech.com',
            questions: [
              {
                id: 'q1',
                text: 'Give a 60-90 second introduction of your professional background, core technical skills, and recent work relevant to Cloud Platform Engineering.',
                description: 'Highlight your strongest languages, cloud architectures, and recent achievements.',
                maxDuration: 120
              },
              {
                id: 'q2',
                text: 'Describe an instance where you debugged an unexpected microservice latency spike under strict production SLA deadlines. What was your root-cause analysis process?',
                description: 'Explain the architecture, your diagnostics approach, and the final latency resolution.',
                maxDuration: 120
              },
              {
                id: 'q3',
                text: 'What is your current work authorization, earliest availability or notice period, and desired hourly rate?',
                description: 'Confirm your current location, relocation/remote preference, and visa status.',
                maxDuration: 90
              }
            ]
          }
        }

        if (isMounted) {
          setSession(sessionData)
          const qList = sessionData.questions || []
          setQuestions(qList)

          if (sessionData.candidateName) setCandidateName(sessionData.candidateName)
          if (sessionData.candidateEmail) setCandidateEmail(sessionData.candidateEmail)
          if (sessionData.candidatePhone) setCandidatePhone(sessionData.candidatePhone)
          if (sessionData.candidateLocation) setCandidateLocation(sessionData.candidateLocation)
          if (sessionData.expectedRate) setExpectedRate(sessionData.expectedRate)

          // Single-use link: if already submitted, lock screen permanently
          if (sessionData.status === 'submitted' || sessionData.screeningComplete) {
            setIsAlreadySubmitted(true)
            setSubmittedAtDate(sessionData.submittedAt || new Date().toISOString())
            setSubmissionResult({
              aiScore: sessionData.aiScore || 85,
              aiSummary: sessionData.aiSummary || [],
              recommendation: sessionData.recommendation || 'Recommended'
            })
            setStep(5)
          }
        }
      } catch (err) {
        console.error('Screening load error:', err)
        if (isMounted) setError(err.message || 'Unable to load screening session.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadScreeningData()

    return () => {
      isMounted = false
      stopAllMediaStreams()
    }
  }, [routeSessionId, jobId])

  // Stop camera, mic, and screen share
  const stopAllMediaStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close()
      } catch (e) {}
      audioContextRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch (e) {}
    }
  }

  // ─── 4. PROCTORING INFRACTION MONITORING (TAB SWITCH & BLUR) ───────────────
  const triggerSecurityInfraction = useCallback((reason) => {
    if (step !== 3 || isCheatingLocked) return

    setTabViolationsCount(prev => {
      const nextCount = prev + 1
      const logEntry = {
        infractionNumber: nextCount,
        reason,
        timestamp: new Date().toLocaleTimeString(),
        questionNumber: currentQuestionIndex + 1,
        recordingSeconds: sessionSeconds
      }
      setProctoringViolationsLog(p => [...p, logEntry])
      setShowTabWarningModal(true)

      if (nextCount >= 3) {
        setIsCheatingLocked(true)
      }
      return nextCount
    })
  }, [step, isCheatingLocked, currentQuestionIndex, sessionSeconds])

  useEffect(() => {
    if (step !== 3) return

    const handleVisibility = () => {
      if (document.hidden) {
        triggerSecurityInfraction('Candidate switched browser tab or minimized window')
      }
    }

    const handleBlur = () => {
      triggerSecurityInfraction('Candidate left browser focus (multitasking attempted)')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
    }
  }, [step, triggerSecurityInfraction])

  // ─── 5. FULLSCREEN PROCTORING ENFORCEMENT ──────────────────────────────────
  useEffect(() => {
    if (step !== 3) return

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(isFull)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [step])

  const requestFullscreenMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen()
      }
      setIsFullscreen(true)
    } catch (e) {
      console.warn('Fullscreen request:', e)
    }
  }

  // Prevent right-click and inspection keys during Step 3
  useEffect(() => {
    if (step !== 3) return

    const preventKeys = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault()
        triggerSecurityInfraction('Unauthorized keyboard shortcut / developer inspection attempted')
      }
    }

    const preventContext = (e) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', preventKeys)
    window.addEventListener('contextmenu', preventContext)

    return () => {
      window.removeEventListener('keydown', preventKeys)
      window.removeEventListener('contextmenu', preventContext)
    }
  }, [step, triggerSecurityInfraction])

  // ─── 6. STEP 2: SETUP DEVICE & SCREEN SHARE PERMISSIONS ───────────────────
  const initDeviceCheck = async () => {
    setDeviceCheckError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      })
      streamRef.current = stream
      setHasCameraPermission(true)
      setHasMicPermission(true)

      if (deviceCheckVideoRef.current) {
        deviceCheckVideoRef.current.srcObject = stream
        deviceCheckVideoRef.current.play().catch(() => {})
      }

      // Audio volume visualizer
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        const ctx = new AudioContext()
        audioContextRef.current = ctx
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 64
        analyserRef.current = analyser

        const micSource = ctx.createMediaStreamSource(stream)
        micSource.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          const normalized = Math.min(100, Math.floor((avg / 128) * 100))
          setMicVolume(normalized)
          animationFrameRef.current = requestAnimationFrame(checkVolume)
        }
        checkVolume()
      } catch (audioErr) {
        console.warn('Audio meter initialization notice:', audioErr)
      }
    } catch (err) {
      console.warn('Device permission error:', err)
      setDeviceCheckError('Could not access camera or microphone. Please allow permissions in your browser address bar.')
      setHasCameraPermission(false)
      setHasMicPermission(false)
    }
  }

  // Request Screen Share for proctoring
  const initScreenShare = async () => {
    setScreenCheckError(null)
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setScreenCheckError('Screen sharing API is not supported in this browser. Please use Chrome, Safari, or Edge.')
        return
      }
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false
      })
      screenStreamRef.current = screenStream
      setHasScreenSharePermission(true)

      if (screenPreviewVideoRef.current) {
        screenPreviewVideoRef.current.srcObject = screenStream
        screenPreviewVideoRef.current.play().catch(() => {})
      }

      screenStream.getVideoTracks()[0].onended = () => {
        setHasScreenSharePermission(false)
        if (step === 3) {
          triggerSecurityInfraction('Desktop screen share was stopped by candidate')
        }
      }
    } catch (err) {
      console.warn('Screen share permission error:', err)
      setScreenCheckError('Screen share was cancelled. You must share your entire desktop screen to complete proctoring.')
      setHasScreenSharePermission(false)
    }
  }

  useEffect(() => {
    if (step === 2) {
      initDeviceCheck()
    }
  }, [step])

  // ─── 7. STEP 3: CONTINUOUS SINGLE-TAKE RECORDING ENGINE ────────────────────
  const handleBeginInterviewStudio = async () => {
    if (!hasCameraPermission || !hasMicPermission) {
      alert('Camera and microphone permissions are required to start the proctored interview.')
      return
    }

    if (!hasScreenSharePermission) {
      alert('Desktop screen share is required for anti-cheat proctoring compliance. Please click "Click to Share Entire Screen" before starting.')
      return
    }

    // Single-use link lock API
    fetch(`${API}/${sessionId}/lock-start`, { method: 'POST' }).catch(() => {})

    // Enforce full-screen mode
    await requestFullscreenMode()

    // Move to step 3
    setStep(3)
    setCurrentQuestionIndex(0)
    setQuestionMarkers([])
    markersRef.current = []
    currentQStartTimeRef.current = 0
    setSessionSeconds(0)

    // Trigger 3-second countdown before recording starts
    setCountdown(3)
    let c = 3
    const countInterval = setInterval(() => {
      c -= 1
      if (c <= 0) {
        clearInterval(countInterval)
        setCountdown(null)
        startContinuousRecording()
      } else {
        setCountdown(c)
      }
    }, 1000)
  }

  // Start continuous recording that stays active across all questions
  const startContinuousRecording = async () => {
    try {
      const stream = streamRef.current || await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      })
      streamRef.current = stream

      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        previewVideoRef.current.play().catch(() => {})
      }

      recordedChunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : (MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4')

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunksRef.current, { type: mimeType })
        setMasterVideoBlob(finalBlob)
        const url = URL.createObjectURL(finalBlob)
        setMasterVideoUrl(url)
      }

      mediaRecorder.start(500)
      setIsRecording(true)
      setSessionSeconds(0)
      currentQStartTimeRef.current = 0

      // Speech-to-Text transcription stream
      try {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRec) {
          const rec = new SpeechRec()
          rec.continuous = true
          rec.interimResults = true
          rec.lang = 'en-US'
          let accumulated = ''
          rec.onresult = (e) => {
            let interim = ''
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) {
                accumulated += e.results[i][0].transcript + ' '
              } else {
                interim += e.results[i][0].transcript
              }
            }
            setLiveTranscript((accumulated + interim).trim())
          }
          rec.start()
          speechRecognitionRef.current = rec
        }
      } catch (srErr) {
        console.warn('SpeechRecognition notice:', srErr)
      }

      // Continuous Master Session Timer
      timerIntervalRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Continuous recording error:', err)
      alert('Unable to access recording devices: ' + err.message)
    }
  }

  // Advance Question WITHOUT stopping the video recording!
  const handleNextQuestionContinuous = () => {
    const currentQ = questions[currentQuestionIndex]
    if (!currentQ) return

    const nowSeconds = sessionSeconds
    const marker = {
      questionId: currentQ.id,
      questionIndex: currentQuestionIndex,
      questionText: currentQ.text,
      startTime: currentQStartTimeRef.current,
      endTime: nowSeconds,
      duration: Math.max(1, nowSeconds - currentQStartTimeRef.current),
      transcript: liveTranscript.trim() || 'Spoken answer captured during continuous interview.'
    }

    markersRef.current.push(marker)
    setQuestionMarkers(prev => [...prev, marker])
    currentQStartTimeRef.current = nowSeconds
    setLiveTranscript('')

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Finished all questions -> Stop continuous recording and proceed to review
      finishContinuousInterview(marker)
    }
  }

  // Complete continuous interview session
  const finishContinuousInterview = (finalMarker) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop() } catch (e) {}
    }

    // Exit full screen
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      }
    } catch (e) {}

    setStep(4)
  }

  // ─── 8. FINAL PROCTORED SUBMISSION ─────────────────────────────────────────
  const handleSubmitFinalApplication = async () => {
    setIsSubmitting(true)
    setSubmitProgress('Uploading single continuous interview recording (Full Session)...')

    try {
      let uploadedMediaUrl = null

      // Upload single master continuous video file
      if (masterVideoBlob) {
        const formData = new FormData()
        formData.append('media', masterVideoBlob, `session_${sessionId}_full_interview.webm`)
        formData.append('sessionId', sessionId)
        formData.append('format', 'video')

        const upRes = await fetch(`${API}/${sessionId}/upload-media`, {
          method: 'POST',
          body: formData
        })
        const upData = await upRes.json()
        if (upData.success) {
          uploadedMediaUrl = upData.mediaUrl
        }
      }

      setSubmitProgress('Running AI Whisper transcription & proctoring evaluation...')

      // Format responses referencing the single master continuous video
      const allMarkers = questionMarkers.length >= questions.length ? questionMarkers : (markersRef.current.length > 0 ? markersRef.current : questionMarkers)
      const formattedResponses = allMarkers.map(m => ({
        questionId: m.questionId,
        questionText: m.questionText,
        format: 'video',
        mediaUrl: uploadedMediaUrl || masterVideoUrl,
        startTime: m.startTime,
        endTime: m.endTime,
        duration: m.duration,
        transcript: m.transcript
      }))

      const payload = {
        candidateInfo: {
          name: candidateName.trim(),
          email: candidateEmail.trim(),
          phone: candidatePhone.trim(),
          location: candidateLocation.trim(),
          linkedin: candidateLinkedin.trim(),
          expectedRate: expectedRate.trim(),
          visaStatus
        },
        masterMediaUrl: uploadedMediaUrl || masterVideoUrl,
        candidateGeo,
        proctoring: {
          screenShared: hasScreenSharePermission,
          fullscreenEnforced: true,
          tabViolationsCount,
          violationsLog: proctoringViolationsLog,
          totalDurationSeconds: sessionSeconds,
          integrityScore: Math.max(20, 100 - (tabViolationsCount * 25))
        },
        responses: formattedResponses
      }

      const res = await fetch(`${API}/${sessionId}/submit-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (data.success) {
        setSubmissionResult({
          aiScore: data.aiScore || 85,
          aiSummary: data.aiSummary || [],
          recommendation: data.recommendation || 'Recommended'
        })
        setSubmittedAtDate(new Date().toISOString())
        setStep(5)
      } else {
        throw new Error(data.message || 'Failed to submit responses')
      }
    } catch (err) {
      console.error('Final submission error:', err)
      alert('Error submitting responses: ' + err.message)
    } finally {
      setIsSubmitting(false)
      setSubmitProgress('')
    }
  }

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ─── LOCK SCREEN: DUPLICATE TAB DETECTED ────────────────────────────────────
  if (isDuplicateTab) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.lockIconBox}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '16px 0 8px' }}>
          Assessment Active in Another Window
        </h2>
        <p style={{ fontSize: '14.5px', color: '#475569', maxWidth: '480px', lineHeight: 1.6 }}>
          To ensure assessment integrity and prevent tampering, this screening session cannot be opened in multiple tabs or devices simultaneously. Please return to your original active window to continue.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ ...styles.primaryButton, marginTop: '20px' }}
        >
          Check Active Tab
        </button>
      </div>
    )
  }

  // ─── LOCK SCREEN: SINGLE-USE LINK ALREADY COMPLETED ─────────────────────────
  if (isAlreadySubmitted && step !== 5) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ ...styles.lockIconBox, borderColor: '#10b981', background: '#ecfdf5' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '16px 0 8px' }}>
          Interview Link Already Used & Submitted
        </h2>
        <p style={{ fontSize: '14.5px', color: '#475569', maxWidth: '480px', lineHeight: 1.6 }}>
          This single-use screening assessment link has already been completed and submitted on {new Date(submittedAtDate).toLocaleDateString()}. Each assessment link is strictly single-use to maintain evaluation fairness and security.
        </p>
        <Link to="/jobs" style={{ ...styles.primaryButton, marginTop: '20px' }}>
          Browse Open Requisitions
        </Link>
      </div>
    )
  }

  // Render Loading State
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginTop: '16px' }}>
          Loading SmartHire Screening Experience...
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Initializing proctoring security & role assessment questions
        </p>
      </div>
    )
  }

  // Render Error State
  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginBottom: '12px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Unable to Open Screening Link</h3>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', marginTop: '8px', lineHeight: 1.5 }}>
          {error}
        </p>
        <Link to="/jobs" style={styles.primaryButton}>
          Browse Open Positions
        </Link>
      </div>
    )
  }

  const jobTitle = session?.jobTitle || 'Lead Software Engineer'
  const jobClient = session?.jobClient || 'Enterprise Client'
  const currentQ = questions[currentQuestionIndex] || {}
  const maxDuration = currentQ.maxDuration || 120

  return (
    <div style={styles.pageWrapper}>
      {/* ── ANTI-CHEAT FULLSCREEN REQUIRED OVERLAY ── */}
      {step === 3 && !isFullscreen && (
        <div style={styles.proctorLockOverlay}>
          <div style={styles.proctorLockCard}>
            <div style={{ color: '#ef4444', marginBottom: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
              Full-Screen Mode Required
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
              You cannot resize, minimize, or exit full-screen mode during this proctored assessment. Click below to re-enter full-screen and resume your recorded session.
            </p>
            <button
              type="button"
              onClick={requestFullscreenMode}
              style={styles.primaryButtonLarge}
            >
              Re-enter Full-Screen Mode
            </button>
          </div>
        </div>
      )}

      {/* ── ANTI-CHEAT TAB SWITCHING VIOLATION WARNING MODAL ── */}
      {showTabWarningModal && (
        <div style={styles.proctorLockOverlay}>
          <div style={{ ...styles.proctorLockCard, borderColor: '#ef4444', borderWidth: 2 }}>
            <div style={{ color: '#ef4444', marginBottom: '10px' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#991b1b', margin: '0 0 8px' }}>
              Security Infraction Alert
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 14px' }}>
              Tab switching, minimizing, or accessing external applications during this interview is strictly prohibited. This violation has been recorded with a timestamp in your candidate integrity audit report.
            </p>
            <div style={{ padding: '8px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '13px', fontWeight: 700, color: '#b91c1c', marginBottom: '18px' }}>
              Infraction {tabViolationsCount} of 3 • 3 Infractions will auto-lock your assessment!
            </div>
            <button
              type="button"
              onClick={() => setShowTabWarningModal(false)}
              style={styles.primaryButton}
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}
      {/* ── ANTI-CHEAT TERMINATED / LOCKED OVERLAY ── */}
      {isCheatingLocked && (
        <div style={styles.proctorLockOverlay}>
          <div style={{ ...styles.proctorLockCard, borderColor: '#ef4444', borderWidth: 2 }}>
            <div style={{ color: '#ef4444', marginBottom: '12px' }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#991b1b', margin: '0 0 10px' }}>
              Assessment Locked for Integrity Violations
            </h2>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
              You exceeded the maximum allowed proctoring violations (3 infractions for window switching, multitasking, or inspection). To maintain assessment fairness for all candidates, this session has been locked and flagged for recruiter review.
            </p>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', marginBottom: '6px' }}>
                Recorded Violations:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#b91c1c', lineHeight: 1.6 }}>
                {proctoringViolationsLog.map((v, idx) => (
                  <li key={idx}>
                    {v.timestamp} — {v.reason} (Q{v.questionNumber})
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/jobs" style={styles.primaryButton}>
              Exit to Careers Portal
            </Link>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoSection}>
            <div style={styles.logoBadge}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <div>
              <div style={styles.brandTitle}>SmartHire <span style={{ color: '#2563eb' }}>Screen</span></div>
              <div style={styles.brandSubtitle}>Asynchronous Proctored Screening</div>
            </div>
          </div>

          <div style={styles.jobInfoBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <span style={{ fontWeight: '700', color: '#0f172a' }}>{jobTitle}</span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#64748b' }}>{jobClient}</span>
          </div>

          <div style={styles.headerRight}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 6,
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Anti-Cheat Active
            </span>
            <span style={styles.timeTag}>Single-Take Recording</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={styles.mainContent}>

        {/* STEP 1: WELCOME & CANDIDATE FORM */}
        {step === 1 && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={styles.pillLabel}>Candidate Screening Portal</div>
              <h1 style={styles.heroTitle}>Proctored Video & Voice Assessment</h1>
              <p style={styles.heroSubtitle}>
                Answer {questions.length} screening questions in a single continuous recording session.
                Full-screen mode, desktop screen sharing, and GPS location are monitored to ensure fairness.
              </p>

              <div style={styles.highlightsRow}>
                <div style={styles.highlightPill}>One Continuous Recording</div>
                <div style={styles.highlightPill}>Screen Share Required</div>
                <div style={styles.highlightPill}>Tab Switch Monitored</div>
              </div>
            </div>

            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Pranitha Bantu"
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  placeholder="e.g. pranitha.bantu@gmail.com"
                  value={candidateEmail}
                  onChange={e => setCandidateEmail(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (919) 555-0143"
                  value={candidatePhone}
                  onChange={e => setCandidatePhone(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Current City, State / GPS Location</label>
                <input
                  type="text"
                  placeholder="e.g. Raleigh, NC"
                  value={candidateLocation}
                  onChange={e => setCandidateLocation(e.target.value)}
                  style={styles.input}
                />
                {candidateGeo && (
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: 4, display: 'block' }}>
                    ✓ Verified GPS Location: {candidateGeo.latitude.toFixed(4)}°, {candidateGeo.longitude.toFixed(4)}° (±{candidateGeo.accuracy}m)
                  </span>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Hourly Pay Rate ($/hr)</label>
                <input
                  type="text"
                  placeholder="e.g. $75/hr C2C"
                  value={expectedRate}
                  onChange={e => setExpectedRate(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Work Authorization / Visa</label>
                <select
                  value={visaStatus}
                  onChange={e => setVisaStatus(e.target.value)}
                  style={styles.select}
                >
                  <option value="US Citizen">US Citizen</option>
                  <option value="Green Card">Green Card</option>
                  <option value="H-1B">H-1B</option>
                  <option value="C2C">C2C</option>
                  <option value="EAD">EAD</option>
                  <option value="Canadian / TN">Canadian / TN</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '28px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  if (!candidateName.trim() || !candidateEmail.trim()) {
                    alert('Please enter your Name and Email Address to proceed.')
                    return
                  }
                  setStep(2)
                }}
                style={styles.primaryButtonLarge}
              >
                Proceed to Security & Device Check ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SECURITY & PROCTORING CHECK (CAMERA, MIC, SCREEN SHARE, GPS) */}
        {step === 2 && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={styles.pillLabel}>Security & Proctoring Setup</div>
              <h2 style={styles.cardTitle}>Verify Camera, Microphone & Screen Share</h2>
              <p style={styles.cardSubtitle}>
                This assessment requires Camera, Microphone, and Desktop Screen Share permissions to ensure anti-cheating compliance.
              </p>
            </div>

            {deviceCheckError && (
              <div style={styles.errorBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{deviceCheckError}</span>
              </div>
            )}

            {screenCheckError && (
              <div style={styles.errorBanner}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{screenCheckError}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Camera Preview */}
              <div style={styles.deviceBox}>
                <div style={styles.deviceHeader}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    Webcam Video
                  </span>
                  <span style={{ fontSize: '11px', color: hasCameraPermission ? '#16a34a' : '#ef4444', fontWeight: '700' }}>
                    {hasCameraPermission ? '✓ Camera Active' : 'Camera Required'}
                  </span>
                </div>

                <div style={styles.videoStagePreview}>
                  <video
                    ref={deviceCheckVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {!hasCameraPermission && (
                    <div style={styles.videoOverlayText}>
                      Please grant camera permission in your browser address bar.
                    </div>
                  )}
                </div>

                {/* Mic Visualizer */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Microphone Level:</span>
                    <span style={{ fontWeight: 700, color: micVolume > 5 ? '#16a34a' : '#94a3b8' }}>
                      {micVolume > 5 ? '✓ Audio Detected' : 'Speak to test'}
                    </span>
                  </div>
                  <div style={styles.meterTrack}>
                    <div style={{ ...styles.meterFill, width: `${Math.min(100, micVolume * 2)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Screen Share & Anti-Cheat Rules */}
              <div style={styles.deviceBox}>
                <div style={styles.deviceHeader}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    Desktop Screen Share
                  </span>
                  <span style={{ fontSize: '11px', color: hasScreenSharePermission ? '#16a34a' : '#2563eb', fontWeight: '700' }}>
                    {hasScreenSharePermission ? '✓ Screen Shared' : 'Action Required'}
                  </span>
                </div>

                <div style={{ ...styles.videoStagePreview, background: '#0f172a' }}>
                  <video
                    ref={screenPreviewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  {!hasScreenSharePermission && (
                    <div style={{ ...styles.videoOverlayText, background: 'rgba(15,23,42,0.85)' }}>
                      <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#e2e8f0' }}>
                        Share your <strong>Entire Screen</strong> to confirm no external AI tools or unauthorized tabs are used.
                      </p>
                      <button
                        type="button"
                        onClick={initScreenShare}
                        style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      >
                        Click to Share Entire Screen
                      </button>
                    </div>
                  )}
                </div>

                {/* Proctoring Rules Summary */}
                <div style={{ marginTop: '12px', background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 4 }}>
                    Anti-Cheating Rules:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                    <li><strong>Single Continuous Take:</strong> Recording runs without stopping across all questions.</li>
                    <li><strong>Full Screen Enforced:</strong> Minimizing or resizing the window is prohibited.</li>
                    <li><strong>Zero Tab Switching:</strong> Leaving this browser tab is logged and flagged.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={styles.secondaryButton}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleBeginInterviewStudio}
                disabled={!hasCameraPermission || !hasMicPermission || !hasScreenSharePermission}
                style={{
                  ...styles.primaryButtonLarge,
                  opacity: (!hasCameraPermission || !hasMicPermission || !hasScreenSharePermission) ? 0.6 : 1
                }}
              >
                Begin Proctored Assessment (Question 1) ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONTINUOUS PROCTORED INTERVIEW STUDIO */}
        {step === 3 && currentQ && (
          <div style={styles.card}>
            {/* Countdown Overlay */}
            {countdown !== null && (
              <div style={styles.countdownOverlay}>
                <div style={styles.countdownNumber}>{countdown}</div>
                <div style={styles.countdownText}>Starting Continuous Proctored Recording...</div>
              </div>
            )}

            {/* Sticky Live Proctor Bar */}
            <div style={styles.liveProctorBar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={styles.recBlinkDot} />
                <strong style={{ fontSize: '14px', color: '#dc2626' }}>
                  LIVE RECORDING • {formatTime(sessionSeconds)}
                </strong>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: tabViolationsCount > 0 ? '#fef2f2' : '#f0fdf4',
                  color: tabViolationsCount > 0 ? '#dc2626' : '#16a34a',
                  border: `1px solid ${tabViolationsCount > 0 ? '#fecaca' : '#bbf7d0'}`
                }}>
                  {tabViolationsCount > 0 ? `${tabViolationsCount}/3 Infractions` : 'Tab Lock Active'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Max ~{maxDuration}s recommended
                </span>
              </div>
            </div>

            {/* Question Card Box */}
            <div style={styles.questionBox}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: 4 }}>
                Question {currentQuestionIndex + 1}
              </div>
              <h2 style={styles.questionTitle}>{currentQ.text}</h2>
              {currentQ.description && (
                <p style={styles.questionDesc}>{currentQ.description}</p>
              )}
            </div>

            {/* Live Video Stage & Speech Transcript */}
            <div style={styles.studioCanvas}>
              <div style={styles.recorderContainer}>
                <div style={styles.videoStage}>
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={styles.videoFeed}
                  />

                  {/* Corner indicator */}
                  <div style={styles.recordingCornerBadge}>
                    <span style={styles.recDot} /> Continuous Take Active
                  </div>
                </div>

                {/* Real-time speech transcript */}
                <div style={styles.transcriptCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#4338ca' }}>
                    <span>Live Spoken Transcript:</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#334155', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{liveTranscript || 'Start speaking your answer clearly into the microphone...'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Studio Navigation: Continuous Next Button */}
            <div style={styles.studioNavFooter}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Note: Recording will continue seamlessly without stopping as you advance through all questions.
              </div>

              <button
                type="button"
                onClick={handleNextQuestionContinuous}
                style={styles.primaryButtonLarge}
              >
                {currentQuestionIndex < questions.length - 1
                  ? `Save & Go to Question ${currentQuestionIndex + 2} ➔`
                  : 'Finish & Review Entire Interview ➔'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW ENTIRE PROCTORED RECORDING */}
        {step === 4 && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={styles.pillLabel}>Review & Finalize</div>
              <h2 style={styles.cardTitle}>Review your complete proctored interview</h2>
              <p style={styles.cardSubtitle}>
                Your entire assessment was captured in one continuous recording. Click below to review and seek to any question.
              </p>
            </div>

            {/* Candidate Header Summary */}
            <div style={styles.candidateReviewHeader}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{candidateName}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{candidateEmail} • {candidatePhone || 'No phone'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.rateTag}>{expectedRate || 'Rate open'}</span>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {candidateLocation || 'Remote'} {candidateGeo ? `(GPS Verified)` : ''}
                </div>
              </div>
            </div>

            {/* Single Master Video Player */}
            <div style={{ marginTop: '20px', background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
              {masterVideoUrl && (
                <video
                  ref={masterVideoPlayerRef}
                  src={masterVideoUrl}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: '440px', display: 'block' }}
                />
              )}
            </div>

            {/* Question Jump Timeline Markers */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                Jump to Question in Video:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {questionMarkers.map((m, idx) => (
                  <button
                    key={m.questionId || idx}
                    type="button"
                    onClick={() => {
                      if (masterVideoPlayerRef.current) {
                        masterVideoPlayerRef.current.currentTime = m.startTime
                        masterVideoPlayerRef.current.play().catch(() => {})
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>▶ Question {idx + 1}</span>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>
                      ({formatTime(m.startTime)} - {formatTime(m.endTime)})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Proctoring Integrity Summary */}
            <div style={{ marginTop: '24px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px', textTransform: 'uppercase' }}>
                Proctoring & Anti-Cheating Compliance Audit:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Total Session Length:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatTime(sessionSeconds)}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Screen Sharing:</span>
                  <div style={{ fontWeight: 800, color: hasScreenSharePermission ? '#16a34a' : '#f59e0b' }}>
                    {hasScreenSharePermission ? '✓ Full Desktop Verified' : 'Standard'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Tab Switching Infractions:</span>
                  <div style={{ fontWeight: 800, color: tabViolationsCount === 0 ? '#16a34a' : '#dc2626' }}>
                    {tabViolationsCount === 0 ? '✓ 0 Infractions (Clean)' : `${tabViolationsCount} Infractions Logged`}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>GPS Geolocation:</span>
                  <div style={{ fontWeight: 800, color: candidateGeo ? '#16a34a' : '#64748b' }}>
                    {candidateGeo ? `✓ Verified (${candidateGeo.latitude.toFixed(2)}°, ${candidateGeo.longitude.toFixed(2)}°)` : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>

            {isSubmitting && (
              <div style={styles.submittingBox}>
                <div style={styles.loadingSpinnerSmall}></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                  {submitProgress}
                </span>
              </div>
            )}

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleSubmitFinalApplication}
                disabled={isSubmitting || !masterVideoBlob}
                style={{
                  ...styles.primaryButtonLarge,
                  opacity: (isSubmitting || !masterVideoBlob) ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Submitting...' : !masterVideoBlob ? 'Processing Video Recording...' : 'Confirm & Submit Final Application ➔'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUBMITTED CONFIRMATION */}
        {step === 5 && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={styles.successCircle}>
                <span style={{ fontSize: '38px' }}>✓</span>
              </div>

              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '16px' }}>
                Application Submitted Successfully!
              </h1>
              <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '520px', margin: '8px auto 0', lineHeight: 1.6 }}>
                Thank you, <strong>{candidateName}</strong>. Your single continuous proctored video interview has been securely transmitted to the recruitment desk for <strong>{jobTitle}</strong>.
              </p>

              {/* Submission Receipt Card */}
              <div style={styles.receiptCard}>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Session ID:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{sessionId}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Submitted At:</span>
                  <span>{new Date(submittedAtDate || Date.now()).toLocaleDateString()} {new Date(submittedAtDate || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Role:</span>
                  <strong>{jobTitle}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Recording Mode:</span>
                  <span style={styles.submittedPill}>✓ Continuous Proctored Take</span>
                </div>
              </div>

              {/* What happens next */}
              <div style={styles.nextStepsCard}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                  What happens next?
                </h4>
                <div style={styles.timelineList}>
                  <div style={styles.timelineStep}>
                    <span style={styles.stepNum}>1</span>
                    <span style={{ fontSize: '13px', color: '#334155' }}>
                      Our talent specialists review your full continuous recording and AI transcript.
                    </span>
                  </div>
                  <div style={styles.timelineStep}>
                    <span style={styles.stepNum}>2</span>
                    <span style={{ fontSize: '13px', color: '#334155' }}>
                      Shortlisted candidates will receive a direct invitation for client submission.
                    </span>
                  </div>
                  <div style={styles.timelineStep}>
                    <span style={styles.stepNum}>3</span>
                    <span style={{ fontSize: '13px', color: '#334155' }}>
                      Check your email ({candidateEmail}) for updates from our recruitment desk.
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '28px' }}>
                <Link to="/jobs" style={styles.primaryButton}>
                  Browse More Open Positions
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>SmartHire ATS • Powered by SmartHire Asynchronous Video Intelligence</div>
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>
          Secure end-to-end encryption • WebRTC Continuous Proctored Recording • GDPR & Privacy Compliant
        </div>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SMARTHIRE INLINE STYLES ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    color: '#0f172a'
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  headerInner: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.02em',
    lineHeight: '1.2'
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600'
  },
  jobInfoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#F1F5F9',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  timeTag: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#2563eb',
    background: '#EFF6FF',
    padding: '4px 10px',
    borderRadius: '6px'
  },
  mainContent: {
    maxWidth: '960px',
    width: '100%',
    margin: '32px auto',
    padding: '0 20px',
    flex: '1'
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #E5E7EB'
  },
  pillLabel: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: '#2563eb',
    background: '#EFF6FF',
    marginBottom: '12px'
  },
  heroTitle: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: '#0f172a',
    margin: '0 0 10px',
    lineHeight: '1.3'
  },
  heroSubtitle: {
    fontSize: '15px',
    color: '#64748b',
    maxWidth: '620px',
    margin: '0 auto 20px',
    lineHeight: '1.6'
  },
  highlightsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  highlightPill: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#475569',
    background: '#F1F5F9',
    border: '1px solid #E2E8F0'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
    marginTop: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #CBD5E1',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    color: '#0f172a'
  },
  select: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #CBD5E1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a'
  },
  primaryButtonLarge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '13px 32px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.15s ease'
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 22px',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none'
  },
  secondaryButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: '#F1F5F9',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid #CBD5E1',
    cursor: 'pointer'
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px'
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  deviceBox: {
    background: '#ffffff',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '16px'
  },
  deviceHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#0f172a'
  },
  videoStagePreview: {
    position: 'relative',
    height: '200px',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  videoOverlayText: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8'
  },
  meterTrack: {
    height: '8px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.1s ease'
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '20px'
  },
  liveProctorBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  recBlinkDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#dc2626',
    boxShadow: '0 0 8px rgba(220, 38, 38, 0.8)'
  },
  questionBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px'
  },
  questionTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px',
    lineHeight: '1.4'
  },
  questionDesc: {
    fontSize: '13.5px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5'
  },
  studioCanvas: {
    marginTop: '16px'
  },
  recorderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  videoStage: {
    position: 'relative',
    height: '360px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#0f172a'
  },
  videoFeed: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  recordingCornerBadge: {
    position: 'absolute',
    top: '14px',
    left: '14px',
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  recDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444'
  },
  transcriptCard: {
    background: '#EEF2FF',
    border: '1px solid #C7D2FE',
    borderRadius: '10px',
    padding: '12px 16px'
  },
  studioNavFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #E2E8F0',
    flexWrap: 'wrap',
    gap: '12px'
  },
  candidateReviewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    background: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0'
  },
  rateTag: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#16a34a',
    background: '#DCFCE7',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  submittingBox: {
    marginTop: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px',
    background: '#EFF6FF',
    borderRadius: '8px'
  },
  loadingSpinnerSmall: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2.5px solid #2563eb',
    borderTopColor: 'transparent',
    animation: 'spin 0.8s linear infinite'
  },
  loadingContainer: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center'
  },
  lockIconBox: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: '#fef2f2',
    border: '1.5px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3.5px solid #E2E8F0',
    borderTopColor: '#2563eb',
    animation: 'spin 0.8s linear infinite'
  },
  proctorLockOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    backdropFilter: 'blur(8px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  proctorLockCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '520px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
    border: '1px solid #e2e8f0'
  },
  countdownOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(6px)',
    zIndex: 100,
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownNumber: {
    fontSize: '84px',
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 1
  },
  countdownText: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#93c5fd',
    marginTop: '16px'
  },
  successCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#DCFCE7',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    fontWeight: 'bold'
  },
  receiptCard: {
    maxWidth: '460px',
    margin: '24px auto',
    padding: '16px 20px',
    background: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13.5px'
  },
  submittedPill: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#16a34a',
    background: '#DCFCE7',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  nextStepsCard: {
    maxWidth: '460px',
    margin: '20px auto 0',
    textAlign: 'left'
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  timelineStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  stepNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#EFF6FF',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  footer: {
    padding: '24px 20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#64748b',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#ffffff'
  }
}
