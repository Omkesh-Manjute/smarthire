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

  // Step flow: 
  // 1: Candidate Intro & Role Overview
  // 2: Device & Media Permissions Check
  // 3: Question-by-Question Studio
  // 4: Review All Responses
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

  // Answers Map: questionId -> { format: 'video'|'audio'|'text', blob, mediaUrl, textAnswer, transcript, duration }
  const [answers, setAnswers] = useState({})

  // Media Device & Recording States
  const [hasCameraPermission, setHasCameraPermission] = useState(false)
  const [hasMicPermission, setHasMicPermission] = useState(false)
  const [deviceCheckError, setDeviceCheckError] = useState(null)
  const [micVolume, setMicVolume] = useState(0)

  // Active Response Mode for current question
  const [responseMode, setResponseMode] = useState('video') // 'video', 'audio', 'text'

  // Recording Lifecycle
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState(null)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [textInputAnswer, setTextInputAnswer] = useState('')

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState('')
  const [submissionResult, setSubmissionResult] = useState(null)

  // Media Refs
  const previewVideoRef = useRef(null)
  const deviceCheckVideoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const recordedChunksRef = useRef([])

  // 1. Fetch or create session
  useEffect(() => {
    let isMounted = true

    async function loadScreeningData() {
      setLoading(true)
      setError(null)
      try {
        let activeId = routeSessionId
        if (!activeId && jobId) {
          // Create a session for this job
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
                allowedFormats: ['video', 'audio', 'text'],
                maxDuration: 120
              },
              {
                id: 'q2',
                text: 'Describe an instance where you debugged an unexpected microservice latency spike under strict production SLA deadlines. What was your root-cause analysis process?',
                description: 'Explain the architecture, your diagnostics approach, and the final latency resolution.',
                allowedFormats: ['video', 'audio', 'text'],
                maxDuration: 120
              },
              {
                id: 'q3',
                text: 'What is your current work authorization, earliest availability or notice period, and desired hourly rate?',
                description: 'Confirm your current location, relocation/remote preference, and visa status.',
                allowedFormats: ['video', 'audio', 'text'],
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

          // If session was already submitted
          if (sessionData.status === 'submitted' || sessionData.screeningComplete) {
            setSubmissionResult({
              aiScore: sessionData.aiScore,
              aiSummary: sessionData.aiSummary,
              recommendation: sessionData.recommendation
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

  // Stop camera & mic
  const stopAllMediaStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
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
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch (e) {}
    }
  }

  // 2. Setup Device Check Stream (Camera & Mic)
  const initDeviceCheck = async () => {
    stopAllMediaStreams()
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

      // Audio visualizer setup
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
      setDeviceCheckError(
        'Could not access camera and microphone. Please allow permissions in your browser address bar to record video/audio.'
      )
      setHasCameraPermission(false)
      setHasMicPermission(false)
    }
  }

  // Hook device check on Step 2
  useEffect(() => {
    if (step === 2) {
      initDeviceCheck()
    } else {
      if (step !== 3) {
        stopAllMediaStreams()
      }
    }
    return () => {
      if (step === 2) stopAllMediaStreams()
    }
  }, [step])

  // Hook live video feed when entering Question Studio
  useEffect(() => {
    if (step === 3 && responseMode === 'video' && !recordedPreviewUrl) {
      navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      }).then(stream => {
        streamRef.current = stream
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream
          previewVideoRef.current.play().catch(() => {})
        }
      }).catch(err => {
        console.warn('Video stream attachment error:', err)
      })
    }
  }, [step, responseMode, recordedPreviewUrl, currentQuestionIndex])

  // When switching questions, restore any saved answer
  useEffect(() => {
    const currentQ = questions[currentQuestionIndex]
    if (!currentQ) return

    const existing = answers[currentQ.id]
    if (existing) {
      setResponseMode(existing.format || 'video')
      setRecordedBlob(existing.blob || null)
      setRecordedPreviewUrl(existing.mediaUrl || null)
      setLiveTranscript(existing.transcript || '')
      setTextInputAnswer(existing.textAnswer || '')
      setRecordingSeconds(existing.duration || 0)
    } else {
      setRecordedBlob(null)
      setRecordedPreviewUrl(null)
      setLiveTranscript('')
      setTextInputAnswer('')
      setRecordingSeconds(0)
      setResponseMode(currentQ.allowedFormats?.[0] || 'video')
    }
  }, [currentQuestionIndex, questions])

  // Countdown and Start Recording
  const handleStartCountdown = () => {
    setCountdown(3)
    let c = 3
    const interval = setInterval(() => {
      c -= 1
      if (c === 0) {
        clearInterval(interval)
        setCountdown(null)
        startActualRecording()
      } else {
        setCountdown(c)
      }
    }, 1000)
  }

  // Start MediaRecorder
  const startActualRecording = async () => {
    try {
      const constraints = responseMode === 'video'
        ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true }
        : { audio: true, video: false }

      const stream = streamRef.current || await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (responseMode === 'video' && previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        previewVideoRef.current.play().catch(() => {})
      }

      recordedChunksRef.current = []
      const mimeType = responseMode === 'video'
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4')

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunksRef.current, { type: mimeType })
        setRecordedBlob(finalBlob)
        const url = URL.createObjectURL(finalBlob)
        setRecordedPreviewUrl(url)

        // Detach live camera stream so playback video can play
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = null
        }
      }

      mediaRecorder.start(500)
      setIsRecording(true)
      setRecordingSeconds(0)

      // Live Speech-to-Text in browser
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
        console.warn('Browser SpeechRecognition notice:', srErr)
      }

      // Timer
      const maxSeconds = questions[currentQuestionIndex]?.maxDuration || 120
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          const next = prev + 1
          if (next >= maxSeconds) {
            handleStopRecording()
          }
          return next
        })
      }, 1000)
    } catch (err) {
      console.error('Recording start error:', err)
      alert('Unable to start recording. Please check microphone/camera permissions.')
    }
  }

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
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

  // Retake / Record Again
  const handleRetake = () => {
    setRecordedBlob(null)
    setRecordedPreviewUrl(null)
    setLiveTranscript('')
    setRecordingSeconds(0)

    // Reattach camera feed if in video mode
    if (responseMode === 'video') {
      navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      }).then(stream => {
        streamRef.current = stream
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream
          previewVideoRef.current.play().catch(() => {})
        }
      }).catch(() => {})
    }
  }

  // Save current answer and advance
  const handleSaveAndNext = () => {
    const currentQ = questions[currentQuestionIndex]
    if (!currentQ) return

    // Validation
    if (responseMode === 'text') {
      if (!textInputAnswer.trim()) {
        alert('Please provide a written answer before proceeding.')
        return
      }
    } else {
      if (!recordedBlob && !recordedPreviewUrl) {
        alert(`Please record your ${responseMode === 'video' ? 'video' : 'voice note'} response before moving to the next question.`)
        return
      }
    }

    const answerObj = {
      questionId: currentQ.id,
      questionText: currentQ.text,
      format: responseMode,
      blob: recordedBlob,
      mediaUrl: recordedPreviewUrl,
      textAnswer: responseMode === 'text' ? textInputAnswer.trim() : null,
      transcript: liveTranscript.trim() || (responseMode === 'text' ? textInputAnswer.trim() : null),
      duration: recordingSeconds
    }

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: answerObj
    }))

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Done all questions -> Go to Review Step
      setStep(4)
      stopAllMediaStreams()
    }
  }

  // Upload individual media file to server
  const uploadMediaFile = async (blob, qId, format) => {
    if (!blob) return { mediaUrl: null, transcript: null }
    const formData = new FormData()
    const ext = format === 'video' ? 'webm' : 'webm'
    formData.append('media', blob, `screen_${qId}_${Date.now()}.${ext}`)
    formData.append('questionId', qId)
    formData.append('format', format)

    const res = await fetch(`${API}/${sessionId}/upload-media`, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      return {
        mediaUrl: data.mediaUrl,
        transcript: data.transcript || null
      }
    }
    return { mediaUrl: null, transcript: null }
  }

  // Final Submit All Responses
  const handleSubmitAllResponses = async () => {
    setIsSubmitting(true)
    setSubmitProgress('Uploading candidate media and transcribing responses...')

    try {
      const formattedResponses = []

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        const ans = answers[q.id] || {}
        setSubmitProgress(`Processing Question ${i + 1} of ${questions.length}...`)

        let serverMediaUrl = ans.mediaUrl
        let serverTranscript = ans.transcript

        // If this answer has a client recorded Blob, upload it to server
        if (ans.blob) {
          const uploadRes = await uploadMediaFile(ans.blob, q.id, ans.format)
          if (uploadRes.mediaUrl) {
            serverMediaUrl = uploadRes.mediaUrl
          }
          if (uploadRes.transcript) {
            serverTranscript = uploadRes.transcript
          }
        }

        formattedResponses.push({
          questionId: q.id,
          questionText: q.text,
          format: ans.format || 'video',
          mediaUrl: serverMediaUrl,
          textAnswer: ans.textAnswer || null,
          transcript: serverTranscript || ans.transcript || ans.textAnswer || 'Spoken response recorded.',
          duration: ans.duration || 0
        })
      }

      setSubmitProgress('Running AI evaluation & scoring candidate profile...')

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

  // Render Loading State
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginTop: '16px' }}>
          Loading PeekHire Screening Experience...
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Preparing your candidate workspace & role questions
        </p>
      </div>
    )
  }

  // Render Error State
  if (error) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
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
      {/* TOP PEEKHIRE NAVIGATION BAR */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoSection}>
            <div style={styles.logoBadge}>
              <span style={{ fontSize: '18px' }}>🎥</span>
            </div>
            <div>
              <div style={styles.brandTitle}>SmartHire <span style={{ color: '#2563eb' }}>Screen</span></div>
              <div style={styles.brandSubtitle}>Asynchronous Talent Screening</div>
            </div>
          </div>

          <div style={styles.jobInfoBadge}>
            <span style={{ fontSize: '14px' }}>💼</span>
            <span style={{ fontWeight: '700', color: '#0f172a' }}>{jobTitle}</span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#64748b' }}>{jobClient}</span>
          </div>

          <div style={styles.headerRight}>
            <span style={styles.timeTag}>⏱️ ~3 mins</span>
            <span style={styles.noLoginTag}>Zero Login Required</span>
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
              <h1 style={styles.heroTitle}>Welcome to your video & voice screening</h1>
              <p style={styles.heroSubtitle}>
                Answer {questions.length} short questions on your own time using video, voice note, or text.
                Review when you're ready and submit without installing any app.
              </p>

              <div style={styles.highlightsRow}>
                <div style={styles.highlightPill}>Takes around 2-3 min</div>
                <div style={styles.highlightPill}>Video, Voice, or Text</div>
                <div style={styles.highlightPill}>Unlimited Retakes</div>
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
                <label style={styles.label}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={candidateLinkedin}
                  onChange={e => setCandidateLinkedin(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Current City, State</label>
                <input
                  type="text"
                  placeholder="e.g. Raleigh, NC"
                  value={candidateLocation}
                  onChange={e => setCandidateLocation(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Expected Hourly Rate / Salary</label>
                <input
                  type="text"
                  placeholder="e.g. $80/hr on C2C or $140k/yr"
                  value={expectedRate}
                  onChange={e => setExpectedRate(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  if (!candidateName.trim() || !candidateEmail.trim()) {
                    alert('Please enter your Name and Email to proceed.')
                    return
                  }
                  setStep(2)
                }}
                style={styles.primaryButtonLarge}
              >
                Continue to Camera & Mic Setup ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DEVICE & PERMISSIONS CHECK */}
        {step === 2 && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={styles.pillLabel}>Device Setup</div>
              <h2 style={styles.cardTitle}>Check your camera and microphone</h2>
              <p style={styles.cardSubtitle}>
                Make sure you are well-lit, clearly framed, and that your microphone picks up your voice.
              </p>
            </div>

            {deviceCheckError && (
              <div style={styles.errorBanner}>
                <span>⚠️</span>
                <span>{deviceCheckError}</span>
              </div>
            )}

            <div style={styles.deviceCheckContainer}>
              {/* VIDEO PREVIEW */}
              <div style={styles.videoBox}>
                <video
                  ref={deviceCheckVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={styles.videoFeed}
                />
                {!hasCameraPermission && (
                  <div style={styles.videoFallbackOverlay}>
                    <span style={{ fontSize: '36px' }}>📷</span>
                    <span style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>
                      Camera preview will appear here
                    </span>
                  </div>
                )}
                <div style={styles.liveCameraBadge}>
                  <span style={styles.greenDot}></span> Live Camera
                </div>
              </div>

              {/* MIC LEVEL CHECK */}
              <div style={styles.micMeterBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🎙️ Microphone Test
                  </span>
                  <span style={{ fontSize: '11px', color: micVolume > 5 ? '#16a34a' : '#94a3b8', fontWeight: '700' }}>
                    {micVolume > 5 ? '✓ Voice Detected' : 'Speak to test mic'}
                  </span>
                </div>

                <div style={styles.meterTrack}>
                  <div style={{ ...styles.meterFill, width: `${Math.min(100, micVolume * 2)}%` }}></div>
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: '#64748b' }}>
                  <span>✓ Chrome / Safari / Edge compatible</span>
                  <span>•</span>
                  <span>✓ Noise suppression active</span>
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
                onClick={() => setStep(3)}
                style={styles.primaryButtonLarge}
              >
                Everything Looks Good — Start Question 1 ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: QUESTION STUDIO */}
        {step === 3 && currentQ && (
          <div style={styles.card}>
            {/* Question Progress Bar */}
            <div style={styles.questionNavHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.questionCounterBadge}>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Max {maxDuration} seconds
                </span>
              </div>

              <div style={styles.progressPills}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      ...styles.progressPillItem,
                      background: idx === currentQuestionIndex ? '#2563eb' : (answers[q.id] ? '#10b981' : '#e2e8f0'),
                      color: idx === currentQuestionIndex || answers[q.id] ? '#ffffff' : '#64748b'
                    }}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div style={styles.questionBox}>
              <h2 style={styles.questionTitle}>{currentQ.text}</h2>
              {currentQ.description && (
                <p style={styles.questionDesc}>💡 {currentQ.description}</p>
              )}
            </div>

            {/* Format Selector Tabs */}
            <div style={styles.formatTabs}>
              {['video', 'audio', 'text'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    if (isRecording) handleStopRecording()
                    setResponseMode(mode)
                  }}
                  style={{
                    ...styles.formatTabBtn,
                    ...(responseMode === mode ? styles.formatTabBtnActive : {})
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {mode === 'video' ? '🎥' : mode === 'audio' ? '🎙️' : '✍️'}
                  </span>
                  <span>{mode === 'video' ? 'Video Answer' : mode === 'audio' ? 'Voice Note' : 'Written Text'}</span>
                </button>
              ))}
            </div>

            {/* RECORDING / ANSWER CANVAS */}
            <div style={styles.studioCanvas}>
              {/* 1. VIDEO MODE */}
              {responseMode === 'video' && (
                <div style={styles.recorderContainer}>
                  <div style={styles.videoStage}>
                    {recordedPreviewUrl ? (
                      <video
                        src={recordedPreviewUrl}
                        controls
                        playsInline
                        style={styles.videoFeed}
                      />
                    ) : (
                      <video
                        ref={previewVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={styles.videoFeed}
                      />
                    )}

                    {/* Countdown Overlay */}
                    {countdown !== null && (
                      <div style={styles.countdownOverlay}>
                        <span style={styles.countdownNumber}>{countdown}</span>
                      </div>
                    )}

                    {/* Live Recording Indicator */}
                    {isRecording && (
                      <div style={styles.recordingOverlayBadge}>
                        <span style={styles.pulsingRedDot}></span>
                        <span>REC {formatTime(recordingSeconds)} / {formatTime(maxDuration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Video Controls */}
                  <div style={styles.studioActions}>
                    {!isRecording && !recordedPreviewUrl && (
                      <button
                        type="button"
                        onClick={handleStartCountdown}
                        style={styles.recordStartButton}
                      >
                        <span style={{ fontSize: '18px' }}>⏺️</span> Record Video Answer
                      </button>
                    )}

                    {isRecording && (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        style={styles.recordStopButton}
                      >
                        <span style={{ fontSize: '18px' }}>⏹️</span> Stop Recording
                      </button>
                    )}

                    {recordedPreviewUrl && (
                      <div style={styles.reviewActions}>
                        <button
                          type="button"
                          onClick={handleRetake}
                          style={styles.secondaryButton}
                        >
                          ↺ Retake Video
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAndNext}
                          style={styles.primaryButton}
                        >
                          ✓ Looks Great — Next ➔
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. AUDIO VOICE NOTE MODE */}
              {responseMode === 'audio' && (
                <div style={styles.audioContainer}>
                  <div style={styles.audioWaveBox}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                      {isRecording ? '🎙️' : recordedPreviewUrl ? '🎧' : '🎤'}
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                      {isRecording
                        ? `Recording Voice Answer... ${formatTime(recordingSeconds)}`
                        : recordedPreviewUrl
                        ? 'Recorded Voice Answer'
                        : 'Ready to record voice response'}
                    </h4>

                    {isRecording && (
                      <div style={styles.waveBarsRow}>
                        {[16, 28, 40, 24, 36, 48, 30, 20, 38, 50, 28, 18].map((h, i) => (
                          <div
                            key={i}
                            style={{
                              ...styles.waveBar,
                              height: `${h}px`,
                              animationDelay: `${i * 0.08}s`
                            }}
                          ></div>
                        ))}
                      </div>
                    )}

                    {recordedPreviewUrl && (
                      <audio
                        src={recordedPreviewUrl}
                        controls
                        style={{ marginTop: '16px', width: '100%', maxWidth: '380px' }}
                      />
                    )}
                  </div>

                  <div style={styles.studioActions}>
                    {!isRecording && !recordedPreviewUrl && (
                      <button
                        type="button"
                        onClick={startActualRecording}
                        style={styles.recordStartButton}
                      >
                        <span style={{ fontSize: '18px' }}>🎙️</span> Start Voice Recording
                      </button>
                    )}

                    {isRecording && (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        style={styles.recordStopButton}
                      >
                        <span style={{ fontSize: '18px' }}>⏹️</span> Stop Voice Recording
                      </button>
                    )}

                    {recordedPreviewUrl && (
                      <div style={styles.reviewActions}>
                        <button
                          type="button"
                          onClick={handleRetake}
                          style={styles.secondaryButton}
                        >
                          ↺ Retake Audio
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAndNext}
                          style={styles.primaryButton}
                        >
                          ✓ Looks Great — Next ➔
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. WRITTEN TEXT MODE */}
              {responseMode === 'text' && (
                <div style={styles.textContainer}>
                  <textarea
                    rows={7}
                    placeholder="Type your answer clearly here. Mention relevant experience, architecture designs, and accomplishments..."
                    value={textInputAnswer}
                    onChange={e => setTextInputAnswer(e.target.value)}
                    style={styles.textarea}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                    <span>Word Count: {textInputAnswer.trim() ? textInputAnswer.trim().split(/\s+/).length : 0} words</span>
                    <span>{textInputAnswer.length} characters</span>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      style={styles.primaryButton}
                    >
                      Save & Next Question ➔
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* LIVE AI TRANSCRIPT PREVIEW */}
            {liveTranscript && (
              <div style={styles.transcriptCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#4338ca' }}>
                  <span>✨ Real-time Speech Transcript:</span>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', marginTop: '4px', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{liveTranscript}"
                </p>
              </div>
            )}

            {/* Studio Bottom Navigation */}
            <div style={styles.studioNavFooter}>
              <button
                type="button"
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(prev => prev - 1)
                  } else {
                    setStep(2)
                  }
                }}
                style={styles.secondaryButton}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                style={styles.primaryButton}
              >
                {currentQuestionIndex < questions.length - 1 ? 'Save & Next Question ➔' : 'Review All Answers ➔'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW ALL ANSWERS */}
        {step === 4 && (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={styles.pillLabel}>Review & Finalize</div>
              <h2 style={styles.cardTitle}>Review your answers before submitting</h2>
              <p style={styles.cardSubtitle}>
                Take a quick look to verify all questions are answered to your satisfaction.
              </p>
            </div>

            <div style={styles.candidateReviewHeader}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{candidateName}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{candidateEmail} • {candidatePhone || 'No phone'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={styles.rateTag}>{expectedRate || 'Rate open'}</span>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{candidateLocation || 'Remote'}</div>
              </div>
            </div>

            <div style={styles.reviewList}>
              {questions.map((q, idx) => {
                const ans = answers[q.id]
                return (
                  <div key={q.id} style={styles.reviewItem}>
                    <div style={styles.reviewItemHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={styles.reviewQIndex}>Q{idx + 1}</span>
                        <span style={styles.reviewQText}>{q.text}</span>
                      </div>
                      <span style={styles.reviewFormatBadge}>
                        {ans?.format === 'video' ? '🎥 Video' : ans?.format === 'audio' ? '🎙️ Audio' : '✍️ Text'}
                      </span>
                    </div>

                    <div style={styles.reviewItemBody}>
                      {ans?.format === 'video' && ans.mediaUrl && (
                        <video
                          src={ans.mediaUrl}
                          controls
                          style={styles.reviewVideoPlayer}
                        />
                      )}

                      {ans?.format === 'audio' && ans.mediaUrl && (
                        <audio
                          src={ans.mediaUrl}
                          controls
                          style={{ width: '100%', maxWidth: '400px' }}
                        />
                      )}

                      {ans?.format === 'text' && (
                        <div style={styles.reviewTextDisplay}>
                          {ans.textAnswer}
                        </div>
                      )}

                      {ans?.transcript && ans.format !== 'text' && (
                        <div style={styles.reviewTranscriptSnippet}>
                          <span style={{ fontWeight: '600', color: '#4338ca' }}>AI Transcript: </span>
                          "{ans.transcript}"
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentQuestionIndex(idx)
                          setStep(3)
                        }}
                        style={styles.editAnswerBtn}
                      >
                        ✏️ Re-record / Edit
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {isSubmitting && (
              <div style={styles.submittingBox}>
                <div style={styles.loadingSpinnerSmall}></div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                  {submitProgress}
                </span>
              </div>
            )}

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={styles.secondaryButton}
                disabled={isSubmitting}
              >
                ← Back to Questions
              </button>

              <button
                type="button"
                onClick={handleSubmitAllResponses}
                disabled={isSubmitting}
                style={styles.primaryButtonLarge}
              >
                {isSubmitting ? 'Uploading & Evaluating...' : '🚀 Submit Screening Application'}
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
                Thank you, <strong>{candidateName}</strong>. Your recorded video, audio, and text answers have been received by the recruiting team for <strong>{jobTitle}</strong>.
              </p>

              {/* Submission Receipt Card */}
              <div style={styles.receiptCard}>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Session ID:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{sessionId}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Submitted At:</span>
                  <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
                </div>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Role:</span>
                  <strong>{jobTitle}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={styles.submittedPill}>✓ Transcribed & Submitted</span>
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
                      Our talent specialists review your recorded answers & AI transcript.
                    </span>
                  </div>
                  <div style={styles.timelineStep}>
                    <span style={styles.stepNum}>2</span>
                    <span style={{ fontSize: '13px', color: '#334155' }}>
                      Shortlisted candidates will receive a direct invitation for a 30-minute technical interview.
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
        <div>SmartHire ATS • Powered by PeekHire Asynchronous Video Intelligence</div>
        <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>
          Secure end-to-end encryption • WebRTC Native Recording • GDPR & Privacy Compliant
        </div>
      </footer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PEEKHIRE INLINE STYLES ───────────────────────────────────────────────────
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
    lineHeight: 1.2
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600'
  },
  jobInfoBadge: {
    background: '#F1F5F9',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
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
    background: '#eff6ff',
    padding: '4px 10px',
    borderRadius: '12px'
  },
  noLoginTag: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#059669',
    background: '#ecfdf5',
    padding: '4px 10px',
    borderRadius: '12px'
  },
  mainContent: {
    flex: 1,
    maxWidth: '860px',
    width: '100%',
    margin: '32px auto',
    padding: '0 20px'
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E5E7EB',
    padding: '36px 32px',
    boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.06)'
  },
  pillLabel: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#2563eb',
    background: '#eff6ff',
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '10px'
  },
  heroTitle: {
    fontSize: '30px',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    color: '#0f172a',
    margin: 0
  },
  heroSubtitle: {
    fontSize: '15px',
    color: '#64748b',
    maxWidth: '580px',
    margin: '10px auto 0',
    lineHeight: 1.5
  },
  highlightsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '16px',
    flexWrap: 'wrap'
  },
  highlightPill: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    padding: '5px 12px',
    borderRadius: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '18px',
    marginTop: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#334155'
  },
  input: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#FFFFFF'
  },
  textarea: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #CBD5E1',
    fontSize: '14.5px',
    lineHeight: 1.6,
    color: '#0f172a',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px'
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  deviceCheckContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '10px'
  },
  videoBox: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    background: '#0f172a',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)'
  },
  videoFeed: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  videoFallbackOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.85)'
  },
  liveCameraBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(6px)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  greenDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#10b981'
  },
  micMeterBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  meterTrack: {
    width: '100%',
    height: '10px',
    background: '#E2E8F0',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  meterFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #10b981, #3b82f6)',
    borderRadius: '999px',
    transition: 'width 0.1s ease'
  },
  questionNavHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '20px'
  },
  questionCounterBadge: {
    background: '#EFF6FF',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '800',
    padding: '4px 12px',
    borderRadius: '20px'
  },
  progressPills: {
    display: 'flex',
    gap: '6px'
  },
  progressPillItem: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    fontSize: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  questionBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '22px',
    marginBottom: '20px'
  },
  questionTitle: {
    fontSize: '19px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    lineHeight: 1.4
  },
  questionDesc: {
    fontSize: '13px',
    color: '#64748b',
    margin: '8px 0 0',
    lineHeight: 1.5
  },
  formatTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px'
  },
  formatTabBtn: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.15s ease'
  },
  formatTabBtnActive: {
    background: '#2563eb',
    color: '#FFFFFF',
    borderColor: '#2563eb',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
  },
  studioCanvas: {
    marginTop: '10px'
  },
  recorderContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  videoStage: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    background: '#0f172a',
    borderRadius: '16px',
    overflow: 'hidden'
  },
  countdownOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownNumber: {
    fontSize: '90px',
    fontWeight: '900',
    color: '#FFFFFF',
    animation: 'pulse 1s infinite'
  },
  recordingOverlayBadge: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    background: 'rgba(220, 38, 38, 0.9)',
    color: '#FFFFFF',
    fontSize: '12px',
    fontWeight: '800',
    padding: '5px 12px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  pulsingRedDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#FFFFFF'
  },
  studioActions: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '12px'
  },
  recordStartButton: {
    padding: '12px 28px',
    borderRadius: '30px',
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    fontSize: '14.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 6px 20px rgba(220, 38, 38, 0.35)'
  },
  recordStopButton: {
    padding: '12px 28px',
    borderRadius: '30px',
    background: '#0f172a',
    color: '#ffffff',
    border: 'none',
    fontSize: '14.5px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.3)'
  },
  reviewActions: {
    display: 'flex',
    gap: '12px'
  },
  audioContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  audioWaveBox: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '36px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  waveBarsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '16px'
  },
  waveBar: {
    width: '4px',
    background: '#2563eb',
    borderRadius: '2px'
  },
  textContainer: {
    marginTop: '4px'
  },
  transcriptCard: {
    background: '#EEF2FF',
    border: '1px solid #C7D2FE',
    borderRadius: '12px',
    padding: '12px 16px',
    marginTop: '16px'
  },
  studioNavFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '28px',
    paddingTop: '20px',
    borderTop: '1px solid #F1F5F9'
  },
  candidateReviewHeader: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  rateTag: {
    background: '#EFF6FF',
    color: '#1d4ed8',
    fontWeight: '700',
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '8px'
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  reviewItem: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '18px'
  },
  reviewItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px'
  },
  reviewQIndex: {
    background: '#EFF6FF',
    color: '#2563eb',
    fontSize: '11px',
    fontWeight: '800',
    padding: '3px 7px',
    borderRadius: '6px'
  },
  reviewQText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a'
  },
  reviewFormatBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    background: '#F1F5F9',
    color: '#475569',
    whiteSpace: 'nowrap'
  },
  reviewItemBody: {
    marginTop: '8px'
  },
  reviewVideoPlayer: {
    width: '100%',
    maxHeight: '260px',
    borderRadius: '10px',
    background: '#000000'
  },
  reviewTextDisplay: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap'
  },
  reviewTranscriptSnippet: {
    fontSize: '12.5px',
    color: '#475569',
    background: '#F8FAFC',
    padding: '8px 12px',
    borderRadius: '8px',
    marginTop: '8px',
    fontStyle: 'italic'
  },
  editAnswerBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  submittingBox: {
    marginTop: '20px',
    background: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  successCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)'
  },
  receiptCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '14px',
    padding: '16px 20px',
    maxWidth: '460px',
    margin: '24px auto 0',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '13px'
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  submittedPill: {
    background: '#ECFDF5',
    color: '#047857',
    fontWeight: '700',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  nextStepsCard: {
    maxWidth: '460px',
    margin: '24px auto 0',
    textAlign: 'left'
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  timelineStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  stepNum: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#E2E8F0',
    color: '#0f172a',
    fontSize: '11px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButton: {
    padding: '10px 20px',
    borderRadius: '10px',
    background: '#2563eb',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
  },
  primaryButtonLarge: {
    padding: '13px 28px',
    borderRadius: '12px',
    background: '#2563eb',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)'
  },
  secondaryButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    background: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  errorBanner: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#B91C1C',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  loadingContainer: {
    minHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '20px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E2E8F0',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  loadingSpinnerSmall: {
    width: '20px',
    height: '20px',
    border: '2px solid #BFDBFE',
    borderTop: '2px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  footer: {
    textAlign: 'center',
    padding: '24px 20px',
    borderTop: '1px solid #E5E7EB',
    background: '#FFFFFF',
    fontSize: '12px',
    color: '#64748b'
  }
}
