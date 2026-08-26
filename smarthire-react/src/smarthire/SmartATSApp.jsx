import { useState, useCallback, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { extractText } from './utils/extractText';
import { parseResume, matchJD, parseJD } from './utils/parseResume';
import {
  getAllCandidates,
  deleteCandidate,
  saveAllCandidates,
  loadFromCloud,
  syncAllToCloud,
  saveBulkCandidates,
  loadCandidateContent,
  getCloudCount,
} from './utils/db';
import {
  aiMatchCandidate,
  aiRankCandidates,
  getGroqApiKey,
  isGroqApiConfigured,
  saveGroqApiKey,
  clearGroqApiKey,
} from './utils/geminiAI';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
  CREATE_TABLE_SQL,
  clearSupabaseConfig,
} from './utils/supabaseClient';
import { booleanSearch, calculateMatchScore } from './utils/booleanSearch';
import './smart-ats.css';
function formatResumeContent(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const sections = [];
  const headingKeywords = [
    'education',
    'experience',
    'work experience',
    'professional experience',
    'skills',
    'technical skills',
    'core competencies',
    'projects',
    'certifications',
    'certification',
    'summary',
    'objective',
    'profile',
    'professional profile',
    'about',
    'contact',
    'achievements',
    'awards',
    'publications',
    'references',
    'languages',
    'interests',
    'hobbies',
    'volunteer',
    'training',
    'courses',
    'professional summary',
    'work history',
    'employment',
    'employment history',
    'qualifications',
    'key skills',
    'areas of expertise',
    'technologies',
    'tools',
    'personal information',
    'personal details',
    'career objective',
    'career summary',
  ];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      sections.push({ type: 'empty', content: '' });
      continue;
    }
    const lower = trimmed
      .toLowerCase()
      .replace(/[:\-_|#*]/g, '')
      .trim();
    const isHeading = headingKeywords.some(
      (kw) => lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw),
    );
    const isAllCaps =
      trimmed.length > 3 && trimmed.length < 60 && trimmed === trimmed.toUpperCase() && /[A-Z]{3,}/.test(trimmed);
    if (isHeading || isAllCaps) {
      sections.push({ type: 'heading', content: trimmed });
    } else if (/^[\u2022\u2023\u25E6\u2043\u2219●○■□▪▸►•\-\*\>]\s/.test(trimmed) || /^\d+[.\\)]\s/.test(trimmed)) {
      const content = trimmed
        .replace(/^[\u2022\u2023\u25E6\u2043\u2219●○■□▪▸►•\-\*\>]\s*/, '')
        .replace(/^\d+[.\\)]\s*/, '');
      sections.push({ type: 'bullet', content });
    } else if (trimmed.length < 65 && !trimmed.includes('. ') && /^[A-Z]/.test(trimmed) && !/@/.test(trimmed)) {
      sections.push({ type: 'subheading', content: trimmed });
    } else {
      sections.push({ type: 'text', content: trimmed });
    }
  }
  return sections;
}
function buildResumeFallbackText(candidate) {
  const skills = candidate.skills
    ? candidate.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ')
    : 'Not provided';
  return [
    'Professional Summary',
    `${candidate.name || 'Candidate'}`,
    candidate.title || 'Role not provided',
    '',
    'Contact',
    `Email: ${candidate.email || 'N/A'}`,
    `Phone: ${candidate.phone || 'N/A'}`,
    `Location: ${candidate.location || 'N/A'}`,
    '',
    'Experience',
    candidate.experience || 'N/A',
    '',
    'Skills',
    skills,
    '',
    'Note',
    'Full resume text not available for this record. Upload/sync this profile again to restore complete preview.',
  ].join('\n');
}
function generateEmail(type, candidateName, candidateTitle, companyName, recruiterName, jdTitle, jdText) {
  const company = companyName || 'Our Company';
  const recruiter = recruiterName || 'Recruitment Team';
  const role = jdTitle || candidateTitle || 'the open position';
  if (type === 'shortlist') {
    const subject = `Exciting Opportunity - ${role} at ${company}`;
    let body = `Dear ${candidateName},\n\nI hope you're doing well!\n\nI came across your profile and found it very relevant to an exciting opportunity we have for ${role} at ${company}.\n\nIf this opportunity aligns with your expertise, please share your updated resume and feedback. If not, I'd appreciate it if you could refer someone in your network who might be a great fit.\n\nLooking forward to hearing from you!\n\nBest regards,\n\n${recruiter}\n${company}\n\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 JOB DESCRIPTION - ${role}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${jdText || 'Job description will be shared separately.'}`;
    return { subject, body };
  } else {
    const subject = `Update on Your Application - ${company}`;
    let body = `Dear ${candidateName},\n\nThank you for your interest in the ${role} position at ${company} and for taking the time to share your profile with us.\n\nAfter careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current requirements.\n\nWe truly appreciate your interest and encourage you to apply for future openings that align with your skills and experience.\n\nWe wish you all the best in your career journey.\n\nWarm regards,\n\n${recruiter}\n${company}`;
    return { subject, body };
  }
}
export function SmartATSApp() {
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [booleanQuery, setBooleanQuery] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [jdText, setJdText] = useState('');
  const [jdApplied, setJdApplied] = useState(false);
  const [activeTab, setActiveTab] = useState('candidates');
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractMinScore, setExtractMinScore] = useState(0);
  const [showRawResume, setShowRawResume] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const fileRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailType, setEmailType] = useState('shortlist');
  const [companyName, setCompanyName] = useState('SmartHire');
  const [recruiterName, setRecruiterName] = useState('Omkesh');
  const [emailMode, setEmailMode] = useState('single');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState(null);
  const [aiRankResult, setAiRankResult] = useState(null);
  const [showAiRankModal, setShowAiRankModal] = useState(false);
  const [aiRankLoading, setAiRankLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sbUrl, setSbUrl] = useState(getSupabaseConfig()?.url || '');
  const [sbKey, setSbKey] = useState(getSupabaseConfig()?.anonKey || '');
  const [groqKey, setGroqKey] = useState(getGroqApiKey());
  const [groqConfigured, setGroqConfigured] = useState(isGroqApiConfigured());
  const [dbStatus, setDbStatus] = useState(null);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbSyncing, setDbSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(isSupabaseConfigured());
  const [cloudCount, setCloudCount] = useState(0);
  const [loadingContent, setLoadingContent] = useState(false);
  const refreshCloudCount = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setCloudCount(0);
      return;
    }
    const count = await getCloudCount();
    setCloudCount(count);
  }, []);
  useEffect(() => {
    setCandidates(getAllCandidates());
    refreshCloudCount();
    if (isSupabaseConfigured()) {
      loadFromCloud()
        .then((cloudData) => {
          if (cloudData && cloudData.length > 0) {
            setCandidates(cloudData);
          }
        })
        .finally(() => {
          refreshCloudCount();
        });
    }
  }, [refreshCloudCount]);
  useEffect(() => {
    if (!selectedId) return;
    const candidate = candidates.find((c) => c.id === selectedId);
    if (candidate && !candidate.content?.trim() && isSupabaseConfigured()) {
      setLoadingContent(true);
      loadCandidateContent(selectedId, { email: candidate.email, name: candidate.name }).then((content) => {
        if (content) {
          setCandidates((prev) => prev.map((c) => (c.id === selectedId ? { ...c, content } : c)));
        }
        setLoadingContent(false);
      });
    }
  }, [selectedId, candidates]);
  useEffect(() => {
    const config = getSupabaseConfig();
    if (config.url && config.anonKey) {
      setSbUrl(config.url);
      setSbKey(config.anonKey);
      setCloudConnected(true);
      refreshCloudCount();
    }
  }, [refreshCloudCount]);
  useEffect(() => {
    const storedGroqKey = getGroqApiKey();
    setGroqKey(storedGroqKey);
    setGroqConfigured(isGroqApiConfigured());
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedFilteredRef.current.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedFilteredRef.current.map((c) => c.id)));
    }
  }, [selectedIds.size]);
  const sortedFilteredRef = useRef([]);
  const handleUpload = useCallback(
    async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadProgress({ current: 0, total: files.length });
      const parsed = [];
      let parseFailCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        try {
          const text = await extractText(file);
          if (!text.trim()) {
            parseFailCount++;
            continue;
          }
          const { name, title, email, phone, skills, experience, location } = parseResume(text);
          const candidate = {
            id: uuidv4(),
            name: name || file.name.replace(/\.[^.]+$/, ''),
            title,
            email,
            phone,
            skills,
            experience,
            location,
            content: text,
          };
          if (jdApplied && jdText.trim()) {
            const match = matchJD(text, skills, jdText);
            candidate.matchScore = match.score;
            candidate.matchedSkills = match.matchedSkills;
            candidate.missingSkills = match.missingSkills;
            candidate.matchedPreferred = match.matchedPreferred;
            candidate.missingPreferred = match.missingPreferred;
          }
          parsed.push(candidate);
        } catch (err) {
          console.error('Parse error:', file.name, err);
          parseFailCount++;
        }
      }
      if (parsed.length > 0) {
        setToast(`📤 Saving ${parsed.length} candidates to cloud...`);
        const result = await saveBulkCandidates(parsed, (done, total, errors) => {
          setUploadProgress({ current: done, total });
        });
        setCandidates(getAllCandidates());
        const cloudCountVal = await getCloudCount();
        setCloudCount(cloudCountVal);
        const msg = [];
        if (result.errors.length > 0) msg.push(`First error: ${result.errors[0]}`);
        if (result.success > 0) msg.push(`✅ ${result.success} uploaded`);
        if (result.failed > 0) msg.push(`⚠️ ${result.failed} cloud errors`);
        if (parseFailCount > 0) msg.push(`❌ ${parseFailCount} parse failed`);
        msg.push(`☁️ ${cloudCountVal} total in cloud`);
        setToast(msg.join(' | '));
      } else {
        setToast('❌ No resumes could be parsed');
      }
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileRef.current) fileRef.current.value = '';
    },
    [jdApplied, jdText],
  );
  const handleDelete = useCallback((id) => {
    deleteCandidate(id);
    setCandidates(getAllCandidates());
    setSelectedId((prev) => (prev === id ? null : prev));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setToast('🗑️ Candidate deleted');
  }, []);
  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    selectedIds.forEach((id) => deleteCandidate(id));
    setCandidates(getAllCandidates());
    setSelectedIds(new Set());
    setSelectedId(null);
    setToast(`🗑️ ${count} candidates deleted`);
  }, [selectedIds]);
  const applyJDMatching = useCallback(() => {
    if (!jdText.trim()) {
      setToast('⚠️ Paste a JD first');
      return;
    }
    const allCandidates = getAllCandidates();
    const updated = allCandidates.map((c) => {
      const match = matchJD(c.content, c.skills, jdText);
      return {
        ...c,
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        matchedPreferred: match.matchedPreferred,
        missingPreferred: match.missingPreferred,
      };
    });
    updated.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    saveAllCandidates(updated);
    setCandidates(updated);
    setJdApplied(true);
    setActiveTab('candidates');
    setToast(`🎯 JD matching applied! ${updated.length} candidates ranked`);
  }, [jdText]);
  const clearJD = useCallback(() => {
    const allCandidates = getAllCandidates().map((c) => ({
      ...c,
      matchScore: undefined,
      matchedSkills: undefined,
      missingSkills: undefined,
      matchedPreferred: undefined,
      missingPreferred: undefined,
      aiScore: undefined,
      aiReasoning: undefined,
      aiStrengths: undefined,
      aiGaps: undefined,
      aiRecommendation: undefined,
    }));
    saveAllCandidates(allCandidates);
    setCandidates(allCandidates);
    setJdText('');
    setJdApplied(false);
    setAiRankResult(null);
    setToast('🧹 JD matching cleared');
  }, []);
  const handleAiMatch = useCallback(
    async (candidate) => {
      if (!isGroqApiConfigured()) {
        setToast('⚠️ Add Groq API key in Settings > AI Configuration');
        setShowSettings(true);
        return;
      }
      if (!jdText.trim()) {
        setToast('⚠️ Paste a JD first in Job Description tab');
        return;
      }
      setAiLoading(true);
      setAiLoadingId(candidate.id);
      try {
        const resumeText = candidate.content?.trim() ? candidate.content : buildResumeFallbackText(candidate);
        const result = await aiMatchCandidate(candidate.name, candidate.title, candidate.skills, resumeText, jdText);
        const updated = getAllCandidates().map((c) =>
          c.id === candidate.id
            ? {
                ...c,
                aiScore: result.score,
                aiReasoning: result.reasoning,
                aiStrengths: result.strengths,
                aiGaps: result.gaps,
                aiRecommendation: result.recommendation,
              }
            : c,
        );
        saveAllCandidates(updated);
        setCandidates(updated);
        setToast(`🤖 AI analyzed ${candidate.name}: ${result.score}% match`);
      } catch (err) {
        console.error('AI Match Error:', err);
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setToast(`❌ ${msg.split('\n')[0]}`);
      }
      setAiLoading(false);
      setAiLoadingId(null);
    },
    [jdText],
  );
  const handleAiRankAll = useCallback(async () => {
    if (!isGroqApiConfigured()) {
      setToast('⚠️ Add Groq API key in Settings > AI Configuration');
      setShowSettings(true);
      return;
    }
    if (!jdText.trim()) {
      setToast('⚠️ Paste a JD first');
      return;
    }
    if (candidates.length === 0) {
      setToast('⚠️ Upload candidates first');
      return;
    }
    setAiRankLoading(true);
    try {
      const candidateData = candidates.map((c) => ({
        name: c.name,
        title: c.title,
        skills: c.skills,
        experience: c.experience,
      }));
      const result = await aiRankCandidates(candidateData, jdText);
      setAiRankResult(result);
      const allCandidates = getAllCandidates();
      const updated = allCandidates.map((c) => {
        const ranking = result.rankings.find((r) => r.name.toLowerCase().trim() === c.name.toLowerCase().trim());
        if (ranking)
          return {
            ...c,
            aiScore: ranking.score,
            aiReasoning: ranking.reason,
            aiRecommendation:
              ranking.score >= 70
                ? 'STRONG MATCH'
                : ranking.score >= 50
                  ? 'GOOD MATCH'
                  : ranking.score >= 30
                    ? 'PARTIAL MATCH'
                    : 'WEAK MATCH',
          };
        return c;
      });
      saveAllCandidates(updated);
      setCandidates(updated);
      setShowAiRankModal(true);
      setToast(`🏆 AI ranked ${result.rankings.length} candidates!`);
    } catch (err) {
      console.error('AI Rank Error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setToast(`❌ ${msg.split('\n')[0]}`);
    }
    setAiRankLoading(false);
  }, [jdText, candidates]);
  const getEmailCandidates = useCallback(() => {
    if (emailMode === 'single') {
      const c = candidates.find((c) => c.id === selectedId);
      return c ? [c] : [];
    } else {
      return candidates.filter((c) => selectedIds.has(c.id));
    }
  }, [emailMode, candidates, selectedId, selectedIds]);
  const openSingleEmail = useCallback((candidate) => {
    setEmailMode('single');
    setSelectedId(candidate.id);
    setShowEmailModal(true);
  }, []);
  const openBulkEmail = useCallback(() => {
    if (selectedIds.size === 0) {
      setToast('⚠️ Select candidates first');
      return;
    }
    setEmailMode('bulk');
    setShowEmailModal(true);
  }, [selectedIds]);
  const deferredBooleanQuery = useDeferredValue(booleanQuery.trim());
  const deferredJdText = useDeferredValue(jdText);
  const normalizedNameFilter = nameFilter.trim().toLowerCase();
  const normalizedEmailFilter = emailFilter.trim().toLowerCase();
  const normalizedSkillFilter = skillFilter.trim().toLowerCase();
  const normalizedLocationFilter = locationFilter.trim().toLowerCase();
  const normalizedTitleFilter = titleFilter.trim().toLowerCase();
  const skillTerms = useMemo(
    () =>
      normalizedSkillFilter
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [normalizedSkillFilter],
  );
  const filtered = useMemo(() => {
    const base = deferredBooleanQuery ? booleanSearch(candidates, deferredBooleanQuery) : candidates;
    return base.filter((c) => {
      if (normalizedNameFilter && !c.name.toLowerCase().includes(normalizedNameFilter)) return false;
      if (normalizedEmailFilter && !c.email.toLowerCase().includes(normalizedEmailFilter)) return false;
      if (normalizedSkillFilter && !c.skills.toLowerCase().includes(normalizedSkillFilter)) return false;
      if (normalizedLocationFilter && !(c.location || '').toLowerCase().includes(normalizedLocationFilter))
        return false;
      if (normalizedTitleFilter && !(c.title || '').toLowerCase().includes(normalizedTitleFilter)) return false;
      return true;
    });
  }, [
    candidates,
    deferredBooleanQuery,
    normalizedNameFilter,
    normalizedEmailFilter,
    normalizedSkillFilter,
    normalizedLocationFilter,
    normalizedTitleFilter,
  ]);
  const shouldComputeEnhancedScores =
    !jdApplied && (deferredBooleanQuery.length > 0 || skillTerms.length > 0 || normalizedLocationFilter.length > 0);
  const filteredWithScores = useMemo(() => {
    if (!shouldComputeEnhancedScores) return filtered;
    return filtered.map((c) => {
      const enhancedScore = calculateMatchScore(c, {
        skills: skillTerms,
        experience: { min: 0, max: 20 },
        location: normalizedLocationFilter,
        education: '',
        booleanQuery: deferredBooleanQuery,
      });
      return { ...c, enhancedMatchScore: enhancedScore.overall, matchBreakdown: enhancedScore.breakdown };
    });
  }, [filtered, shouldComputeEnhancedScores, skillTerms, normalizedLocationFilter, deferredBooleanQuery]);
  const sortedFiltered = useMemo(() => {
    if (jdApplied) return [...filteredWithScores].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    if (deferredBooleanQuery)
      return [...filteredWithScores].sort((a, b) => (b.enhancedMatchScore || 0) - (a.enhancedMatchScore || 0));
    return filteredWithScores;
  }, [filteredWithScores, jdApplied, deferredBooleanQuery]);
  useEffect(() => {
    sortedFilteredRef.current = sortedFiltered;
  }, [sortedFiltered]);
  const selected = useMemo(() => candidates.find((c) => c.id === selectedId) || null, [candidates, selectedId]);
  const getExtractCandidates = useCallback(() => {
    if (!jdApplied) return sortedFiltered;
    return sortedFiltered.filter((c) => (c.matchScore || 0) >= extractMinScore);
  }, [jdApplied, sortedFiltered, extractMinScore]);
  const copyEmailsOnly = useCallback(() => {
    const ext = getExtractCandidates();
    const emails = ext
      .filter((c) => c.email)
      .map((c) => c.email)
      .join(', ');
    if (!emails) {
      setToast('⚠️ No emails found');
      return;
    }
    navigator.clipboard.writeText(emails).then(() => {
      setToast(`📧 ${ext.filter((c) => c.email).length} emails copied!`);
      setShowExtractModal(false);
    });
  }, [getExtractCandidates]);
  const copyPhonesOnly = useCallback(() => {
    const ext = getExtractCandidates();
    const phones = ext
      .filter((c) => c.phone)
      .map((c) => c.phone)
      .join(', ');
    if (!phones) {
      setToast('⚠️ No phones found');
      return;
    }
    navigator.clipboard.writeText(phones).then(() => {
      setToast(`📱 ${ext.filter((c) => c.phone).length} phones copied!`);
      setShowExtractModal(false);
    });
  }, [getExtractCandidates]);
  const copyExtractedToClipboard = useCallback(() => {
    const ext = getExtractCandidates();
    if (ext.length === 0) {
      setToast('⚠️ No candidates');
      return;
    }
    let text = 'Name\tTitle\tEmail\tPhone\tLocation\tExperience\tSkills';
    if (jdApplied) text += '\tMatch %';
    text += '\n';
    ext.forEach((c) => {
      text += `${c.name}\t${c.title || 'N/A'}\t${c.email || 'N/A'}\t${c.phone || 'N/A'}\t${c.location || 'N/A'}\t${c.experience || 'N/A'}\t${c.skills || 'N/A'}`;
      if (jdApplied) text += `\t${c.matchScore || 0}%`;
      text += '\n';
    });
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setToast(`📋 ${ext.length} candidates copied!`);
        setShowExtractModal(false);
      })
      .catch(() => downloadExtracted());
  }, [getExtractCandidates, jdApplied]);
  const downloadExtracted = useCallback(() => {
    const ext = getExtractCandidates();
    if (ext.length === 0) {
      setToast('⚠️ No candidates');
      return;
    }
    let csv = 'Name,Title,Email,Phone,Location,Experience,Skills';
    if (jdApplied) csv += ',Match %';
    csv += '\n';
    ext.forEach((c) => {
      csv += `"${c.name}","${c.title || ''}","${c.email || ''}","${c.phone || ''}","${c.location || ''}","${c.experience || ''}","${c.skills || ''}"`;
      if (jdApplied) csv += `,"${c.matchScore || 0}%"`;
      csv += '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('📥 CSV downloaded!');
    setShowExtractModal(false);
  }, [getExtractCandidates, jdApplied]);
  const getScoreColor = (score) => {
    if (score >= 75) return 'score-green';
    if (score >= 50) return 'score-yellow';
    if (score >= 25) return 'score-orange';
    return 'score-red';
  };
  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent Match 🔥';
    if (score >= 70) return 'Strong Match 💪';
    if (score >= 50) return 'Good Match 👍';
    if (score >= 30) return 'Partial Match 🤔';
    return 'Low Match ❌';
  };
  const getAiRecColor = (rec) => {
    if (rec.includes('STRONG')) return 'airec-green';
    if (rec.includes('GOOD')) return 'airec-yellow';
    if (rec.includes('PARTIAL')) return 'airec-orange';
    return 'airec-red';
  };
  const extractCandidatesCount = getExtractCandidates().length;
  const selectedResumeText = selected
    ? selected.content?.trim()
      ? selected.content
      : buildResumeFallbackText(selected)
    : '';
  const deferredResumeText = useDeferredValue(selectedResumeText);
  const isPreviewRendering = !showRawResume && selectedResumeText !== deferredResumeText;
  const hasFullResumeText = !!selected?.content?.trim();
  const resumeSections = useMemo(() => {
    if (!selected || showRawResume || isPreviewRendering) return [];
    return formatResumeContent(deferredResumeText);
  }, [selected, showRawResume, isPreviewRendering, deferredResumeText]);
  const jdAnalysis = useMemo(() => (deferredJdText.trim() ? parseJD(deferredJdText) : null), [deferredJdText]);
  const jdTitle = jdAnalysis?.jdTitle || '';
  return (
    <div className="smart-ats-app">
      {' '}
      <div className="flex flex-1 min-h-0 bg-gray-950 text-white overflow-hidden" style={{ fontFamily: 'var(--smart-font)' }}>
        {' '}
        {/* Toast */}{' '}
        {toast && (
          <div className="fixed top-4 right-4 z-[100] bg-gray-800 border border-gray-700 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slideIn">
            {' '}
            {toast}{' '}
          </div>
        )}{' '}
        {/* Guide Modal */}{' '}
        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowGuide(false)}
          >
            {' '}
            <div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl animate-slideIn max-h-90vh overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {' '}
              <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
                {' '}
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📖</span> SmartHire AI - User Guide
                </h3>{' '}
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-2 hover-bg-gray-800 rounded-lg transition text-gray-400 hover-text-white font-bold"
                >
                  ✕
                </button>{' '}
              </div>{' '}
              <div className="space-y-6">
                {' '}
                {[
                  {
                    num: '1',
                    color: 'orange',
                    title: '📤 Upload Candidates',
                    desc: 'Click the <strong>Upload</strong> button in the top-right corner to upload resumes. We support <strong>.pdf</strong>, <strong>.docx</strong>, and <strong>.txt</strong> formats.',
                  },
                  {
                    num: '2',
                    color: 'blue',
                    title: '🔍 Advanced Search & Boolean Logic',
                    desc: 'Use the sidebar filters. For complex queries, use <strong>Boolean Search</strong> (e.g., <code style={{background:"rgba(0,0,0,0.2)",padding:"2px 4px",borderRadius:4,fontFamily:"monospace"}}>(React OR Vue) AND Node.js NOT Java</code>).',
                  },
                  {
                    num: '3',
                    color: 'purple',
                    title: '🎯 Job Description Matching',
                    desc: 'Go to the <strong>JD Tab</strong> and paste a Job Description. Click <strong>Skills Match</strong> to perform skill ranking.',
                  },
                  {
                    num: '4',
                    color: 'cyan',
                    title: '🤖 AI Match Analysis',
                    desc: 'Select a candidate and click <strong>AI Match</strong> for in-depth profile analysis with match score and hiring recommendation.',
                  },
                  {
                    num: '5',
                    color: 'green',
                    title: '☁️ Database Sync & Bulk Actions',
                    desc: 'Connect <strong>Supabase</strong> in settings. Select candidates for bulk email or delete.',
                  },
                ].map((step) => (
                  <div key={step.num} className="flex gap-4">
                    {' '}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `rgba(var(--${step.color}-rgb, 249,115,22),0.1)`,
                        border: `1px solid rgba(var(--${step.color}-rgb, 249,115,22),0.2)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: `var(--${step.color === 'orange' ? 'orange' : step.color === 'blue' ? 'blue' : step.color === 'purple' ? 'purple' : step.color === 'cyan' ? 'cyan' : 'green'}-400)`,
                        fontWeight: 700,
                        flexShrink: 0,
                        fontSize: 18,
                      }}
                    >
                      {step.num}
                    </div>{' '}
                    <div>
                      {' '}
                      <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>{' '}
                      <p
                        className="text-xs text-gray-400 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: step.desc }}
                      />{' '}
                    </div>{' '}
                  </div>
                ))}{' '}
              </div>{' '}
              <div className="mt-8 border-t border-gray-800 pt-4 flex justify-end">
                {' '}
                <button
                  onClick={() => setShowGuide(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(to right, var(--orange-500), #dc2626)',
                    color: '#fff',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: 0,
                    cursor: 'pointer',
                  }}
                >
                  Got it, Let's Start!
                </button>{' '}
              </div>{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Extract Modal */}{' '}
        {showExtractModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowExtractModal(false)}
          >
            {' '}
            <div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-slideIn"
              onClick={(e) => e.stopPropagation()}
            >
              {' '}
              <div className="flex items-center justify-between mb-5">
                {' '}
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📤</span> Extract Data
                </h3>{' '}
                <button
                  onClick={() => setShowExtractModal(false)}
                  className="p-2 hover-bg-gray-800 rounded-lg transition"
                  style={{ color: '#9ca3af' }}
                >
                  ✕
                </button>{' '}
              </div>{' '}
              {jdApplied && (
                <div className="mb-5 bg-gray-800 rounded-xl p-4 border border-gray-700">
                  {' '}
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Min Score: <span className="text-orange-400">{extractMinScore}%</span>
                  </label>{' '}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={extractMinScore}
                    onChange={(e) => setExtractMinScore(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />{' '}
                  <p className="text-xs text-gray-400 mt-2">
                    🎯 <span className="text-white font-medium">{extractCandidatesCount}</span> candidates (≥
                    {extractMinScore}%)
                  </p>{' '}
                </div>
              )}{' '}
              <div className="grid grid-cols-2 gap-3">
                {' '}
                <button
                  onClick={copyEmailsOnly}
                  className="extract-btn"
                  style={{ background: 'var(--blue-600)', color: '#fff' }}
                >
                  📧 Copy Emails
                </button>{' '}
                <button
                  onClick={copyPhonesOnly}
                  className="extract-btn"
                  style={{ background: 'var(--purple-600)', color: '#fff' }}
                >
                  📱 Copy Phones
                </button>{' '}
                <button
                  onClick={copyExtractedToClipboard}
                  className="extract-btn"
                  style={{ background: 'var(--green-600)', color: '#fff' }}
                >
                  📋 Copy All
                </button>{' '}
                <button
                  onClick={downloadExtracted}
                  className="extract-btn"
                  style={{ background: 'var(--orange-600)', color: '#fff' }}
                >
                  📥 Download CSV
                </button>{' '}
              </div>{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Email Modal */}{' '}
        {showEmailModal &&
          (() => {
            const emailCandidates = getEmailCandidates();
            const previewCandidate = emailCandidates[0];
            const previewEmail = previewCandidate
              ? generateEmail(
                  emailType,
                  previewCandidate.name,
                  previewCandidate.title || '',
                  companyName,
                  recruiterName,
                  jdTitle,
                  jdText,
                )
              : null;
            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={() => setShowEmailModal(false)}
              >
                {' '}
                <div
                  className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl animate-slideIn max-h-90vh overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {' '}
                  <div className="flex items-center justify-between mb-5">
                    {' '}
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      ✉️{' '}
                      {emailMode === 'bulk' ? `Bulk Email (${emailCandidates.length} candidates)` : 'Email Candidate'}
                    </h3>{' '}
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className="p-2 hover-bg-gray-800 rounded-lg transition"
                      style={{ color: '#9ca3af' }}
                    >
                      ✕
                    </button>{' '}
                  </div>{' '}
                  {emailMode === 'bulk' && (
                    <div className="mb-4 p-3 bg-gray-800 rounded-xl border border-gray-700">
                      {' '}
                      <p className="text-xs text-gray-400 font-medium uppercase mb-2">
                        Recipients ({emailCandidates.length})
                      </p>{' '}
                      <div className="flex flex-wrap max-h-20 overflow-y-auto">
                        {' '}
                        {emailCandidates.map((c) => (
                          <span
                            key={c.id}
                            className="text-xs"
                            style={{
                              background: 'rgba(59,130,246,0.15)',
                              color: '#93c5fd',
                              padding: '4px 8px',
                              borderRadius: 8,
                              border: '1px solid rgba(59,130,246,0.2)',
                            }}
                          >
                            {' '}
                            {c.name} {c.email ? `(${c.email})` : ''}{' '}
                          </span>
                        ))}{' '}
                      </div>{' '}
                    </div>
                  )}{' '}
                  {emailMode === 'single' && previewCandidate && (
                    <div className="mb-4 p-3 bg-gray-800 rounded-xl border border-gray-700">
                      {' '}
                      <p className="text-sm text-gray-300">
                        📧 Email for: <strong className="text-white">{previewCandidate.name}</strong>
                      </p>{' '}
                      <p className="text-xs text-gray-500 mt-1">
                        {previewCandidate.email || 'No email'} • {previewCandidate.title || 'No title'}
                      </p>{' '}
                    </div>
                  )}{' '}
                  <div className="grid grid-cols-1 sm-grid-cols-2 gap-3 mb-4">
                    {' '}
                    <div>
                      {' '}
                      <label className="block text-xs text-gray-400 mb-1 font-medium">Company Name</label>{' '}
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your Company"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-outline-none focus-outline-none focus-ring-orange"
                      />{' '}
                    </div>{' '}
                    <div>
                      {' '}
                      <label className="block text-xs text-gray-400 mb-1 font-medium">Your Name</label>{' '}
                      <input
                        type="text"
                        value={recruiterName}
                        onChange={(e) => setRecruiterName(e.target.value)}
                        placeholder="Recruiter Name"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus-outline-none focus-outline-none focus-ring-orange"
                      />{' '}
                    </div>{' '}
                  </div>{' '}
                  <div className="flex gap-3 mb-5">
                    {' '}
                    <button
                      onClick={() => setEmailType('shortlist')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        border: '1px solid',
                        background: emailType === 'shortlist' ? 'var(--green-600)' : 'var(--bg-800)',
                        borderColor: emailType === 'shortlist' ? 'var(--green-500)' : 'var(--bg-700)',
                        color: emailType === 'shortlist' ? '#fff' : 'var(--gray-400)',
                        cursor: 'pointer',
                      }}
                    >
                      ✅ Shortlist Email
                    </button>{' '}
                    <button
                      onClick={() => setEmailType('reject')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 700,
                        border: '1px solid',
                        background: emailType === 'reject' ? 'var(--red-600)' : 'var(--bg-800)',
                        borderColor: emailType === 'reject' ? 'var(--red-500)' : 'var(--bg-700)',
                        color: emailType === 'reject' ? '#fff' : 'var(--gray-400)',
                        cursor: 'pointer',
                      }}
                    >
                      ❌ Rejection Email
                    </button>{' '}
                  </div>{' '}
                  {previewEmail && (
                    <div className="space-y-3">
                      {' '}
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        {' '}
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Subject</p>{' '}
                        <p className="text-sm text-white font-semibold">{previewEmail.subject}</p>{' '}
                      </div>{' '}
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 max-h-64 overflow-y-auto">
                        {' '}
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                          {' '}
                          Email Body{' '}
                          {emailMode === 'bulk' && (
                            <span className="text-orange-400">(Preview for {previewCandidate?.name})</span>
                          )}{' '}
                        </p>{' '}
                        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {previewEmail.body}
                        </div>{' '}
                      </div>{' '}
                      <div className="grid grid-cols-2 gap-3">
                        {' '}
                        <button
                          onClick={() => {
                            const allEmails = emailCandidates
                              .map((c) => {
                                const em = generateEmail(
                                  emailType,
                                  c.name,
                                  c.title || '',
                                  companyName,
                                  recruiterName,
                                  jdTitle,
                                  jdText,
                                );
                                return `To: ${c.email || 'N/A'}\nSubject: ${em.subject}\n\n${em.body}`;
                              })
                              .join('\n\n' + '═'.repeat(50) + '\n\n');
                            navigator.clipboard
                              .writeText(allEmails)
                              .then(() => setToast(`📋 ${emailCandidates.length} email(s) copied!`));
                          }}
                          className="email-action-btn"
                          style={{ background: 'var(--blue-600)' }}
                        >
                          📋 Copy {emailMode === 'bulk' ? 'All Emails' : 'Email'}
                        </button>{' '}
                        {emailMode === 'single' && previewCandidate?.email ? (
                          <a
                            href={`mailto:${previewCandidate.email}?subject=${encodeURIComponent(previewEmail.subject)}&body=${encodeURIComponent(previewEmail.body)}`}
                            className="email-action-btn"
                            style={{ background: 'var(--green-600)', textDecoration: 'none', textAlign: 'center' }}
                          >
                            ✉️ Open in Mail
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              emailCandidates.forEach((c, i) => {
                                if (!c.email) return;
                                const em = generateEmail(
                                  emailType,
                                  c.name,
                                  c.title || '',
                                  companyName,
                                  recruiterName,
                                  jdTitle,
                                  jdText,
                                );
                                setTimeout(() => {
                                  window.open(
                                    `mailto:${c.email}?subject=${encodeURIComponent(em.subject)}&body=${encodeURIComponent(em.body)}`,
                                    '_blank',
                                  );
                                }, i * 500);
                              });
                              setToast(`✉️ Opening ${emailCandidates.filter((c) => c.email).length} emails...`);
                            }}
                            className="email-action-btn"
                            style={{ background: 'var(--green-600)' }}
                          >
                            ✉️ Open All in Mail
                          </button>
                        )}{' '}
                      </div>{' '}
                      {emailMode === 'bulk' && (
                        <button
                          onClick={() => {
                            const emails = emailCandidates
                              .filter((c) => c.email)
                              .map((c) => c.email)
                              .join(', ');
                            navigator.clipboard
                              .writeText(emails)
                              .then(() =>
                                setToast(
                                  `📧 ${emailCandidates.filter((c) => c.email).length} email addresses copied (for BCC)!`,
                                ),
                              );
                          }}
                          className="w-full rounded-xl text-sm font-bold bg-purple-600 hover-bg-purple-700 text-white transition flex items-center justify-center gap-2"
                        >
                          📧 Copy Email Addresses (for BCC)
                        </button>
                      )}{' '}
                    </div>
                  )}{' '}
                  {emailCandidates.length === 0 && (
                    <p className="text-center text-gray-500 py-6">⚠️ No candidates selected</p>
                  )}{' '}
                </div>{' '}
              </div>
            );
          })()}{' '}
        {/* AI Rank Modal */}{' '}
        {showAiRankModal && aiRankResult && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAiRankModal(false)}
          >
            {' '}
            <div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl animate-slideIn max-h-90vh overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {' '}
              <div className="flex items-center justify-between mb-5">
                {' '}
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🏆</span> AI Ranking Results
                </h3>{' '}
                <button
                  onClick={() => setShowAiRankModal(false)}
                  className="p-2 hover-bg-gray-800 rounded-lg transition"
                  style={{ color: '#9ca3af' }}
                >
                  ✕
                </button>{' '}
              </div>{' '}
              <div
                className="mb-5 p-4"
                style={{
                  background: 'linear-gradient(to right, rgba(168,85,247,0.1), rgba(236,72,153,0.1))',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: 12,
                }}
              >
                {' '}
                <p className="text-xs text-purple-400 font-bold uppercase tracking-wide mb-1">
                  🤖 AI Analysis Summary
                </p>{' '}
                <p className="text-sm text-gray-300 leading-relaxed">{aiRankResult.summary}</p>{' '}
              </div>{' '}
              <div className="space-y-2">
                {' '}
                {aiRankResult.rankings.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gray-800-50 border border-gray-800 rounded-xl p-4 hover-border-gray-700 transition cursor-pointer"
                    onClick={() => {
                      const c = candidates.find((c) => c.name.toLowerCase().trim() === r.name.toLowerCase().trim());
                      if (c) {
                        setSelectedId(c.id);
                        setActiveTab('candidates');
                        setShowAiRankModal(false);
                      }
                    }}
                  >
                    {' '}
                    <div className="text-xl font-bold text-gray-600 w-8 text-center">
                      {' '}
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}{' '}
                    </div>{' '}
                    <div className="flex-1 min-w-0">
                      {' '}
                      <p className="text-sm font-semibold text-white">{r.name}</p>{' '}
                      <p className="text-xs text-gray-400">{r.reason}</p>{' '}
                    </div>{' '}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {' '}
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        {' '}
                        <div
                          style={{
                            height: '100%',
                            width: `${r.score}%`,
                            borderRadius: 9999,
                            background:
                              r.score >= 75
                                ? 'linear-gradient(to right, var(--green-500), var(--emerald-400))'
                                : r.score >= 50
                                  ? 'linear-gradient(to right, var(--yellow-500), var(--amber-400))'
                                  : 'linear-gradient(to right, var(--red-500), var(--rose-400))',
                          }}
                        />{' '}
                      </div>{' '}
                      <span className={`text-sm font-bold py-1 rounded-lg border ${getScoreColor(r.score)}-badge`}>
                        {r.score}%
                      </span>{' '}
                    </div>{' '}
                  </div>
                ))}{' '}
              </div>{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Settings Modal */}{' '}
        {showSettings && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            {' '}
            <div
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl animate-slideIn max-h-90vh overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {' '}
              <div className="flex items-center justify-between mb-5">
                {' '}
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>☁️</span> Cloud Database Settings
                </h3>{' '}
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover-bg-gray-800 rounded-lg transition"
                  style={{ color: '#9ca3af' }}
                >
                  ✕
                </button>{' '}
              </div>{' '}
              <div
                className={`mb-5 p-4 rounded-xl border ${cloudConnected ? 'bg-green-500-10 border-green-500-20' : 'bg-yellow-500-10 border-yellow-500/20'}`}
              >
                {' '}
                <div className="flex items-center gap-2">
                  {' '}
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: cloudConnected ? 'var(--green-400)' : 'var(--yellow-400)',
                    }}
                  />{' '}
                  <span className={`text-sm font-semibold ${cloudConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                    {' '}
                    {cloudConnected ? '☁️ Cloud Connected' : '💾 Local Storage Only (5MB limit)'}{' '}
                  </span>{' '}
                </div>{' '}
                <p className="text-xs text-gray-400 mt-1">
                  {cloudConnected
                    ? 'Data is syncing to Supabase cloud (500MB free)'
                    : 'Connect Supabase for 500MB free cloud storage'}
                </p>{' '}
              </div>{' '}
              <div className="mb-5 bg-gray-800-50 rounded-xl p-4 border border-gray-700">
                {' '}
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span>🆓</span> Free Database Options
                </h4>{' '}
                <div className="grid grid-cols-1 sm-grid-cols-2 gap-2">
                  {' '}
                  <div
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    {' '}
                    <p className="text-sm font-bold text-green-400">Supabase ⭐ Recommended</p>{' '}
                    <p className="text-xs text-gray-400 mt-1">500MB free • PostgreSQL • Real-time</p>{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 underline mt-1 inline-block"
                    >
                      supabase.com →
                    </a>{' '}
                  </div>{' '}
                  <div
                    style={{
                      background: 'rgba(55,65,81,0.3)',
                      border: '1px solid var(--bg-700)',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    {' '}
                    <p className="text-sm font-bold" style={{ color: 'var(--blue-400)' }}>
                      Neon DB
                    </p>{' '}
                    <p className="text-xs text-gray-400 mt-1">512MB free • PostgreSQL • Serverless</p>{' '}
                    <a
                      href="https://neon.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline mt-1 inline-block"
                      style={{ color: 'var(--blue-400)' }}
                    >
                      neon.tech →
                    </a>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-5">
                {' '}
                <h4 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <span>🤖</span> AI Configuration
                </h4>{' '}
                <div className="space-y-3">
                  {' '}
                  <div>
                    {' '}
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Groq API Key</label>{' '}
                    <input
                      type="password"
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 text-sm text-white focus-outline-none focus-outline-none focus-ring-purple font-mono"
                    />{' '}
                  </div>{' '}
                </div>{' '}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {' '}
                  <button
                    onClick={() => {
                      saveGroqApiKey(groqKey);
                      const configured = isGroqApiConfigured();
                      setGroqConfigured(configured);
                      if (configured) {
                        setGroqKey(getGroqApiKey());
                        setToast('✅ Groq API key saved');
                      } else {
                        setToast('⚠️ Enter valid Groq API key');
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover-bg-purple-700 rounded-lg text-xs font-bold text-white transition"
                  >
                    💾 Save AI Key
                  </button>{' '}
                  {groqConfigured && (
                    <button
                      onClick={() => {
                        clearGroqApiKey();
                        setGroqKey('');
                        setGroqConfigured(false);
                        setToast('🔌 Groq key cleared');
                      }}
                      className="px-4 py-2"
                      style={{
                        background: 'rgba(220,38,38,0.2)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--red-400)',
                      }}
                    >
                      ❌ Clear Key
                    </button>
                  )}{' '}
                </div>{' '}
                <p className={`mt-3 text-xs ${groqConfigured ? 'text-green-400' : 'text-yellow-400'}`}>
                  {groqConfigured
                    ? 'AI key configured. AI Match/Rank enabled.'
                    : 'AI key missing. Add Groq key to enable AI Match/Rank.'}
                </p>{' '}
              </div>{' '}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-5">
                {' '}
                <h4 className="text-sm font-bold text-orange-400 mb-4 flex items-center gap-2">
                  <span>🔧</span> Supabase Configuration
                </h4>{' '}
                <div className="space-y-3">
                  {' '}
                  <div>
                    {' '}
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Supabase Project URL</label>{' '}
                    <input
                      type="text"
                      value={sbUrl}
                      onChange={(e) => setSbUrl(e.target.value)}
                      placeholder="https://xxxxx.supabase.co"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 text-sm text-white focus-outline-none focus-outline-none focus-ring-orange font-mono"
                    />{' '}
                  </div>{' '}
                  <div>
                    {' '}
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Supabase Anon Key</label>{' '}
                    <input
                      type="password"
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 text-sm text-white focus-outline-none focus-outline-none focus-ring-orange font-mono"
                    />{' '}
                  </div>{' '}
                </div>{' '}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {' '}
                  <button
                    onClick={async () => {
                      const url = sbUrl.trim();
                      const anonKey = sbKey.trim();
                      if (!url || !anonKey) {
                        setToast('Enter URL and Key');
                        return;
                      }
                      saveSupabaseConfig({ url, anonKey });
                      setDbTesting(true);
                      const result = await testSupabaseConnection();
                      setDbStatus({ connected: result.success, message: result.message });
                      setDbTesting(false);
                      if (result.success) {
                        setCloudConnected(true);
                        setToast('Connected to Supabase!');
                        const cloudData = await loadFromCloud();
                        if (cloudData) setCandidates(cloudData);
                        await refreshCloudCount();
                      } else {
                        setCloudConnected(false);
                        setCloudCount(0);
                        setToast('Connection failed');
                      }
                    }}
                    disabled={dbTesting}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-xs font-bold text-white transition disabled-opacity-50"
                  >
                    {dbTesting ? 'Testing...' : '💾 Save & Connect'}
                  </button>{' '}
                  <button
                    onClick={async () => {
                      const url = sbUrl.trim();
                      const anonKey = sbKey.trim();
                      if (url && anonKey) saveSupabaseConfig({ url, anonKey });
                      setDbTesting(true);
                      const result = await testSupabaseConnection();
                      setDbStatus({ connected: result.success, message: result.message });
                      setDbTesting(false);
                      if (result.success) {
                        setCloudConnected(true);
                        await refreshCloudCount();
                      } else {
                        setCloudConnected(false);
                        setCloudCount(0);
                      }
                    }}
                    disabled={dbTesting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition disabled-opacity-50"
                  >
                    {dbTesting ? '⏳ Testing...' : '🔌 Test Connection'}
                  </button>{' '}
                  <button
                    onClick={async () => {
                      if (!cloudConnected) {
                        setToast('⚠️ Connect first');
                        return;
                      }
                      setDbSyncing(true);
                      const result = await syncAllToCloud();
                      setDbSyncing(false);
                      if (result.success) {
                        await refreshCloudCount();
                        setToast(`☁️ Synced ${result.count} candidates to cloud!`);
                      } else setToast('❌ Sync failed');
                    }}
                    disabled={dbSyncing || !cloudConnected}
                    className="px-4 py-2 bg-purple-600 hover-bg-purple-700 rounded-lg text-xs font-bold text-white transition disabled-opacity-50"
                  >
                    {dbSyncing ? '⏳ Syncing...' : '🔄 Sync All to Cloud'}
                  </button>{' '}
                  {cloudConnected && (
                    <button
                      onClick={() => {
                        clearSupabaseConfig();
                        setCloudConnected(false);
                        setCloudCount(0);
                        setSbUrl('');
                        setSbKey('');
                        setDbStatus(null);
                        setToast('🔌 Disconnected from cloud');
                      }}
                      className="px-4 py-2"
                      style={{
                        background: 'rgba(220,38,38,0.2)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--red-400)',
                      }}
                    >
                      ❌ Disconnect
                    </button>
                  )}{' '}
                </div>{' '}
                {dbStatus && (
                  <div
                    className={`mt-4 p-3 rounded-lg border ${dbStatus.connected ? 'bg-green-500-10 border-green-500-20' : 'bg-red-500-10 border-red-500/20'}`}
                  >
                    {' '}
                    <p className={`text-sm font-medium ${dbStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {' '}
                      {dbStatus.connected ? '✅' : '❌'} {dbStatus.message}{' '}
                    </p>{' '}
                  </div>
                )}{' '}
              </div>{' '}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-5">
                {' '}
                <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                  <span>📋</span> Setup Instructions
                </h4>{' '}
                <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
                  {' '}
                  <li>
                    Go to{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 underline"
                    >
                      supabase.com
                    </a>{' '}
                    → Create free account
                  </li>{' '}
                  <li>
                    Click <strong className="text-white">"New Project"</strong> → Set name & password
                  </li>{' '}
                  <li>
                    Go to <strong className="text-white">SQL Editor</strong> → Run the SQL below ↓
                  </li>{' '}
                  <li>
                    Go to <strong className="text-white">Settings → API</strong> → Copy{' '}
                    <strong className="text-white">URL</strong> and <strong className="text-white">anon key</strong>
                  </li>{' '}
                  <li>
                    Paste them above and click <strong className="text-green-400">Save & Connect</strong>
                  </li>{' '}
                </ol>{' '}
              </div>{' '}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                {' '}
                <div className="flex items-center justify-between mb-3">
                  {' '}
                  <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                    <span>🗄️</span> Create Table SQL
                  </h4>{' '}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(CREATE_TABLE_SQL).then(() => setToast('📋 SQL copied!'));
                    }}
                    className="px-3 bg-orange-500 hover-bg-orange-600 rounded-lg text-xs font-bold text-white transition"
                  >
                    📋 Copy SQL
                  </button>{' '}
                </div>{' '}
                <pre className="text-xs text-green-400 bg-gray-900 rounded-lg p-4 overflow-x-auto font-mono whitespace-pre max-h-48 overflow-y-auto border border-gray-700">
                  {CREATE_TABLE_SQL}
                </pre>{' '}
              </div>{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Sidebar */}{' '}
        <div
          className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-hidden`}
        >
          {' '}
          <div className="w-80 p-5 h-full flex flex-col">
            {' '}
            <h2
              className="text-lg font-bold text-orange-400 mb-5 flex items-center gap-2"
              style={{ fontFamily: 'var(--smart-font)' }}
            >
              {' '}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>{' '}
              Advanced Filters{' '}
            </h2>{' '}
            <div className="space-y-4 flex-1 overflow-y-auto">
              {' '}
              <div className="bg-gray-800-50 rounded-xl p-4 border border-gray-700">
                {' '}
                <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide flex items-center gap-2">
                  {' '}
                  🔍 Boolean Search <span className=" bg-orange-500-20 text-orange-400 rounded">Advanced</span>{' '}
                </label>{' '}
                <input
                  type="text"
                  value={booleanQuery}
                  onChange={(e) => setBooleanQuery(e.target.value)}
                  placeholder="(React OR Vue) AND Node.js NOT Java"
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 text-sm text-white focus-outline-none focus-outline-none focus-ring-orange transition"
                />{' '}
                <p className=" text-gray-500 mt-2">Use AND, OR, NOT operators. Quotes for exact phrases.</p>{' '}
                <div className="mt-3 space-y-1">
                  {' '}
                  <p className=" text-gray-500 font-medium">Quick Examples:</p>{' '}
                  {[
                    '(React OR Vue) AND Node.js',
                    'Python NOT Java',
                    '"Machine Learning" AND Python',
                    'AWS OR Azure OR GCP',
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBooleanQuery(example)}
                      className="block w-full text-left text-gray-500 hover-text-orange-400 transition"
                    >
                      → {example}
                    </button>
                  ))}{' '}
                </div>{' '}
              </div>{' '}
              {[
                { label: 'Candidate Name', value: nameFilter, set: setNameFilter, placeholder: 'Search by name...' },
                { label: 'Email', value: emailFilter, set: setEmailFilter, placeholder: 'Search by email...' },
                { label: 'Skills', value: skillFilter, set: setSkillFilter, placeholder: 'e.g. python, react...' },
                {
                  label: '📍 Location',
                  value: locationFilter,
                  set: setLocationFilter,
                  placeholder: 'e.g. San Francisco...',
                },
                {
                  label: '💼 Job Title',
                  value: titleFilter,
                  set: setTitleFilter,
                  placeholder: 'e.g. Data Engineer...',
                },
              ].map((f) => (
                <div key={f.label}>
                  {' '}
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
                    {f.label}
                  </label>{' '}
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm text-white focus-outline-none focus-outline-none focus-ring-orange focus-border-transparent transition"
                  />{' '}
                </div>
              ))}{' '}
              <div className="pt-2">
                {' '}
                <label className="flex items-center gap-3 cursor-pointer group">
                  {' '}
                  <div className="relative">
                    {' '}
                    <input
                      type="checkbox"
                      checked={deleteMode}
                      onChange={(e) => setDeleteMode(e.target.checked)}
                      className="sr-only peer"
                    />{' '}
                    <div
                      className="w-10 h-5 bg-gray-700 rounded-full"
                      style={{
                        transition: 'background 0.2s',
                        background: deleteMode ? 'var(--red-600)' : 'var(--bg-700)',
                      }}
                    />{' '}
                    <div
                      className="absolute left-0.5 w-4 h-4 bg-white rounded-full"
                      style={{
                        transition: 'transform 0.2s',
                        transform: deleteMode ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />{' '}
                  </div>{' '}
                  <span className="text-sm text-gray-400">Delete Mode</span>{' '}
                </label>{' '}
              </div>{' '}
              {jdApplied && (
                <div className="mt-4 p-3 bg-green-500-10 border border-green-500-20 rounded-lg">
                  {' '}
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <span>🎯</span> JD Matching Active
                  </div>{' '}
                  <button onClick={clearJD} className="mt-2 text-xs text-red-400 hover-text-red-300 underline">
                    Clear JD
                  </button>{' '}
                </div>
              )}{' '}
            </div>{' '}
            <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-1">
              {' '}
              <p className="text-xs text-gray-500">
                {sortedFiltered.length} of {candidates.length} candidates
              </p>{' '}
              <p className=" text-gray-500">
                Built by <span className="text-orange-400 font-semibold">Omkesh</span>
              </p>{' '}
            </div>{' '}
          </div>{' '}
        </div>{' '}
        {/* Main Content */}{' '}
        <div className="flex-1 flex flex-col min-w-0">
          {' '}
          <header className="bg-gray-900-80 backdrop-blur-sm border-b border-gray-800 px-4 sm-px-6 py-3 flex items-center gap-3 flex-shrink-0 flex-wrap">
            {' '}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover-bg-gray-800 rounded-lg transition"
            >
              {' '}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>{' '}
            </button>{' '}
            <div className="flex items-center gap-2">
              {' '}
              <span className="text-2xl">🚀</span>{' '}
              <h1 className="text-lg sm-text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                SmartHire AI
              </h1>{' '}
              <span className=" bg-purple-500-20 text-purple-400 rounded font-bold border border-purple-500-30">
                AI
              </span>{' '}
            </div>{' '}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {' '}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  {' '}
                  <span className="text-xs bg-orange-500-20 text-orange-400 rounded-lg font-bold border border-orange-500-30">
                    ☑️ {selectedIds.size} Selected
                  </span>{' '}
                  <button
                    onClick={openBulkEmail}
                    className="flex items-center px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-xs font-bold text-white transition shadow-lg"
                  >
                    📧 Bulk Email ({selectedIds.size})
                  </button>{' '}
                  {deleteMode && (
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center px-3 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white transition"
                    >
                      🗑️ Delete ({selectedIds.size})
                    </button>
                  )}{' '}
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="px-2 bg-gray-800 hover-bg-gray-700 rounded-lg text-xs text-gray-400 hover-text-white transition border border-gray-700"
                  >
                    ✕ Clear
                  </button>{' '}
                </div>
              )}{' '}
              <div className="flex bg-gray-800 rounded-lg p-1">
                {' '}
                <button
                  onClick={() => {
                    setActiveTab('candidates');
                    setMobileShowDetail(false);
                  }}
                  className={`px-3 rounded-md text-xs font-medium transition ${activeTab === 'candidates' ? 'bg-orange-500 text-white' : 'text-gray-400 hover-text-white'}`}
                >
                  👥 Candidates
                </button>{' '}
                <button
                  onClick={() => setActiveTab('jd')}
                  className={`px-3 rounded-md text-xs font-medium transition ${activeTab === 'jd' ? 'bg-orange-500 text-white' : 'text-gray-400 hover-text-white'}`}
                >
                  📋 JD
                </button>{' '}
              </div>{' '}
              {sortedFiltered.length > 0 && (
                <button
                  onClick={() => setShowExtractModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition-all"
                >
                  <span>📤</span> Extract
                </button>
              )}{' '}
              <label
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs cursor-pointer transition-all ${uploading ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg'}`}
              >
                {' '}
                {uploading ? (
                  <>
                    {uploadProgress.current}/{uploadProgress.total}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>{' '}
                    Upload
                  </>
                )}{' '}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />{' '}
              </label>{' '}
              <button
                onClick={() => setShowSettings(true)}
                className={`relative inline-flex items-center px-3 py-2 rounded-xl font-semibold text-xs transition-all border ${cloudConnected ? 'bg-green-500-10 border-green-500-30 text-green-400 hover-bg-green-500-20' : 'bg-gray-800 border-gray-700 text-gray-400 hover-text-white hover-bg-gray-700'}`}
              >
                {' '}
                <span>{cloudConnected ? '☁️' : '⚙️'}</span> {cloudConnected ? `Cloud (${cloudCount})` : 'Settings'}{' '}
                {cloudConnected && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}{' '}
              </button>{' '}
              <button
                onClick={() => setShowGuide(true)}
                className="inline-flex items-center px-3 py-2 rounded-xl font-semibold text-xs transition-all border bg-gray-800 border-gray-700 text-gray-400 hover-text-white hover-bg-gray-700"
                title="How to Use Guide"
              >
                <span>📖</span>
                <span>How to Use</span>
              </button>{' '}
            </div>{' '}
          </header>{' '}
          {uploading && uploadProgress.total > 0 && (
            <div className="px-6 py-2 bg-gray-900 border-b border-gray-800">
              {' '}
              <div className="flex items-center gap-3">
                {' '}
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  {' '}
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />{' '}
                </div>{' '}
                <span className="text-xs text-gray-400 font-medium">
                  {uploadProgress.current}/{uploadProgress.total}
                </span>{' '}
              </div>{' '}
            </div>
          )}{' '}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {' '}
            {activeTab === 'jd' ? (
              <div className="flex-1 overflow-y-auto p-6">
                {' '}
                <div className="max-w-3xl mx-auto">
                  {' '}
                  <div className="mb-6">
                    {' '}
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                      <span>📋</span> Job Description
                    </h2>{' '}
                    <p className="text-gray-400 text-sm mt-2">
                      Paste your JD below. We'll match & rank candidates using AI + skills analysis.
                    </p>{' '}
                    <div className="w-20 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mt-3" />{' '}
                  </div>{' '}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
                    {' '}
                    <textarea
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder={
                        'Paste your JD here...\n\nExample:\nJob Title: Senior Data Engineer\n\nRequired Skills:\n- Python, SQL, Azure Data Factory\n- Spark, Databricks\n\nPreferred Skills:\n- Kafka, Airflow'
                      }
                      rows={12}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white focus-outline-none focus-outline-none focus-ring-orange transition resize-none font-mono"
                    />{' '}
                  </div>{' '}
                  {jdAnalysis && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-5">
                      {' '}
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <span>🔍</span> JD Analysis
                      </h3>{' '}
                      {jdAnalysis.jdTitle && (
                        <div className="mb-3">
                          {' '}
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
                            Detected Title
                          </p>{' '}
                          <p className="text-sm font-bold text-orange-400">{jdAnalysis.jdTitle}</p>{' '}
                        </div>
                      )}{' '}
                      {jdAnalysis.requiredSkills.length > 0 && (
                        <div className="mb-3">
                          {' '}
                          <p className="text-xs text-gray-500 font-medium uppercase mb-2">
                            📋 Required ({jdAnalysis.requiredSkills.length})
                          </p>{' '}
                          <div className="flex flex-wrap">
                            {jdAnalysis.requiredSkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-1"
                                style={{
                                  background: 'rgba(239,68,68,0.15)',
                                  color: '#fca5a5',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  border: '1px solid rgba(239,68,68,0.2)',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>{' '}
                        </div>
                      )}{' '}
                      {jdAnalysis.preferredSkills.length > 0 && (
                        <div className="mb-3">
                          {' '}
                          <p className="text-xs text-gray-500 font-medium uppercase mb-2">
                            ⭐ Preferred ({jdAnalysis.preferredSkills.length})
                          </p>{' '}
                          <div className="flex flex-wrap">
                            {jdAnalysis.preferredSkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2 py-1"
                                style={{
                                  background: 'rgba(59,130,246,0.15)',
                                  color: '#93c5fd',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  border: '1px solid rgba(59,130,246,0.2)',
                                }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>{' '}
                        </div>
                      )}{' '}
                    </div>
                  )}{' '}
                  <div className="flex items-center gap-3 flex-wrap">
                    {' '}
                    <button
                      onClick={applyJDMatching}
                      disabled={!jdText.trim() || candidates.length === 0}
                      style={{
                        padding: '12px 20px',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 14,
                        border: 0,
                        cursor: !jdText.trim() || candidates.length === 0 ? 'not-allowed' : 'pointer',
                        background:
                          !jdText.trim() || candidates.length === 0
                            ? 'var(--bg-700)'
                            : 'linear-gradient(to right, var(--green-500), var(--emerald-600))',
                        color: !jdText.trim() || candidates.length === 0 ? 'var(--gray-500)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: !jdText.trim() || candidates.length === 0 ? 0.5 : 1,
                      }}
                    >
                      🎯 Skills Match ({candidates.length})
                    </button>{' '}
                    <button
                      onClick={handleAiRankAll}
                      disabled={!jdText.trim() || candidates.length === 0 || aiRankLoading}
                      style={{
                        padding: '12px 20px',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 14,
                        border: 0,
                        cursor: !jdText.trim() || candidates.length === 0 || aiRankLoading ? 'not-allowed' : 'pointer',
                        background:
                          !jdText.trim() || candidates.length === 0 || aiRankLoading
                            ? 'var(--bg-700)'
                            : 'linear-gradient(to right, var(--purple-500), var(--pink-600))',
                        color: !jdText.trim() || candidates.length === 0 || aiRankLoading ? 'var(--gray-500)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: !jdText.trim() || candidates.length === 0 || aiRankLoading ? 0.5 : 1,
                      }}
                    >
                      {' '}
                      {aiRankLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>{' '}
                          AI Ranking...
                        </>
                      ) : (
                        <>🤖 AI Rank All</>
                      )}{' '}
                    </button>{' '}
                    {jdApplied && (
                      <button
                        onClick={clearJD}
                        className="px-5 py-3 rounded-xl font-bold text-sm bg-gray-800 hover-bg-gray-700 text-gray-300 border border-gray-700 transition flex items-center gap-2"
                      >
                        🧹 Clear
                      </button>
                    )}{' '}
                  </div>{' '}
                  {candidates.length === 0 && (
                    <p className="text-yellow-500-70 text-sm mt-4">⚠️ Upload resumes first</p>
                  )}{' '}
                  {jdApplied && (
                    <div className="mt-8">
                      {' '}
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <span>🏆</span> Top Ranked
                      </h3>{' '}
                      <div className="space-y-2">
                        {' '}
                        {[...candidates]
                          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
                          .slice(0, 10)
                          .map((c, idx) => (
                            <div
                              key={c.id}
                              className="flex items-center gap-3 bg-gray-800-50 border border-gray-800 rounded-xl p-3 hover-border-gray-700 transition cursor-pointer"
                              onClick={() => {
                                setSelectedId(c.id);
                                setActiveTab('candidates');
                              }}
                            >
                              {' '}
                              <div className="text-lg font-bold text-gray-600 w-8 text-center">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                              </div>{' '}
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>{' '}
                              <div className="flex-1 min-w-0">
                                {' '}
                                <p className="text-sm font-semibold text-white truncate">{c.name}</p>{' '}
                                <p className="text-xs text-orange-400 truncate">{c.title || 'No title'}</p>{' '}
                              </div>{' '}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {' '}
                                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  {' '}
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${c.matchScore || 0}%`,
                                      borderRadius: 9999,
                                      background:
                                        (c.matchScore || 0) >= 75
                                          ? 'linear-gradient(to right, var(--green-500), var(--emerald-400))'
                                          : (c.matchScore || 0) >= 50
                                            ? 'linear-gradient(to right, var(--yellow-500), var(--amber-400))'
                                            : 'linear-gradient(to right, var(--red-500), var(--rose-400))',
                                    }}
                                  />{' '}
                                </div>{' '}
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded-lg border ${getScoreColor(c.matchScore || 0)}-badge`}
                                >
                                  {c.matchScore || 0}%
                                </span>{' '}
                              </div>{' '}
                            </div>
                          ))}{' '}
                      </div>{' '}
                    </div>
                  )}{' '}
                </div>{' '}
              </div>
            ) : (
              <>
                {' '}
                <div
                  className={`${mobileShowDetail ? 'hidden sm-d-flex' : 'flex'} w-full sm-w-400px flex-shrink-0 border-r border-gray-800 flex-col overflow-hidden`}
                >
                  {' '}
                  <div className="px-4 py-3 border-b border-gray-800 bg-gray-900-50 flex items-center justify-between flex-shrink-0">
                    {' '}
                    <div className="flex items-center gap-3">
                      {' '}
                      <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        {' '}
                        <input
                          type="checkbox"
                          checked={sortedFiltered.length > 0 && selectedIds.size === sortedFiltered.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                        />{' '}
                      </label>{' '}
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                        Candidates ({sortedFiltered.length})
                      </h2>{' '}
                    </div>{' '}
                    <div className="flex items-center gap-2">
                      {' '}
                      {jdApplied && <span className="text-xs text-green-400 font-medium">🎯 Ranked</span>}{' '}
                      {booleanQuery && <span className="text-xs text-blue-400 font-medium">🔍 Boolean</span>}{' '}
                    </div>{' '}
                  </div>{' '}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {' '}
                    {sortedFiltered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6">
                        {' '}
                        <div className="text-5xl mb-4" style={{ opacity: 0.3 }}>
                          📂
                        </div>{' '}
                        <p className="text-sm text-center">
                          No candidates found.
                          <br />
                          Upload resumes to get started.
                        </p>{' '}
                      </div>
                    ) : (
                      sortedFiltered.map((c, idx) => (
                        <div
                          key={c.id}
                          className={`flex items-center gap-2 px-3 py-3 border-b border-gray-800-50 cursor-pointer transition-all hover-bg-gray-800-70 ${selectedId === c.id ? 'bg-gray-800 border-l-2 border-l-orange-500' : ''} ${selectedIds.has(c.id) ? 'bg-orange-500-5' : ''}`}
                        >
                          {' '}
                          <label
                            className="flex items-center flex-shrink-0 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {' '}
                            <input
                              type="checkbox"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500"
                            />{' '}
                          </label>{' '}
                          {(jdApplied || booleanQuery) && (
                            <div className="text-xs font-bold text-gray-600 w-5 text-center flex-shrink-0">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                            </div>
                          )}{' '}
                          <div
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            onClick={() => {
                              setSelectedId(c.id);
                              setMobileShowDetail(true);
                            }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>{' '}
                          <div
                            className="flex-1 min-w-0"
                            onClick={() => {
                              setSelectedId(c.id);
                              setMobileShowDetail(true);
                            }}
                          >
                            {' '}
                            <p className="text-sm font-semibold text-white truncate">{c.name}</p>{' '}
                            {c.title && <p className="text-xs text-orange-400 font-medium truncate">{c.title}</p>}{' '}
                            <p className="text-xs text-gray-500 truncate">{c.email || 'No email'}</p>{' '}
                            <div className="flex items-center mt-1 flex-wrap">
                              {' '}
                              {c.experience && (
                                <span className=" bg-orange-500-20 text-orange-400 rounded-full font-medium">
                                  {c.experience}
                                </span>
                              )}{' '}
                              {c.location && (
                                <span className=" bg-blue-500-20 text-blue-400 rounded-full font-medium">
                                  📍{c.location}
                                </span>
                              )}{' '}
                            </div>{' '}
                          </div>{' '}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {' '}
                            {jdApplied && c.matchScore !== undefined && (
                              <span
                                className={`text-xs font-bold px-2 rounded-lg border ${getScoreColor(c.matchScore)}-badge`}
                              >
                                {c.matchScore}%
                              </span>
                            )}{' '}
                            {c.aiScore !== undefined && (
                              <span className=" bg-purple-500-20 text-purple-400 rounded border border-purple-500-30 font-bold">
                                🤖{c.aiScore}%
                              </span>
                            )}{' '}
                            {booleanQuery && c.enhancedMatchScore !== undefined && (
                              <span className=" bg-blue-500-20 text-blue-400 rounded border border-blue-500-30 font-bold">
                                🔍{c.enhancedMatchScore}%
                              </span>
                            )}{' '}
                          </div>{' '}
                          {deleteMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(c.id);
                              }}
                              className=" hover-bg-red-600-20 rounded-lg text-red-400 hover-text-red-300 transition flex-shrink-0"
                            >
                              🗑️
                            </button>
                          )}{' '}
                        </div>
                      ))
                    )}{' '}
                  </div>{' '}
                </div>{' '}
                <div className={`${mobileShowDetail ? 'flex' : 'hidden sm-d-flex'} flex-1 flex-col min-w-0 min-h-0`}>
                  {' '}
                  {selected ? (
                    <div className="flex-1 overflow-y-auto">
                      {' '}
                      <div className="p-6 pb-16">
                        {' '}
                        <button
                          onClick={() => setMobileShowDetail(false)}
                          className="sm-d-none mb-4 flex items-center gap-2 text-gray-400 hover-text-white text-sm"
                        >
                          ← Back
                        </button>{' '}
                        <div className="flex items-start justify-between mb-6 gap-4">
                          {' '}
                          <div>
                            {' '}
                            <h2 className="text-2xl font-bold text-white mb-1">Candidate Details</h2>{' '}
                            <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-full" />{' '}
                          </div>{' '}
                          <div className="flex gap-2 flex-shrink-0 flex-wrap">
                            {' '}
                            <button
                              onClick={() => openSingleEmail(selected)}
                              className="flex items-center px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl text-xs font-bold transition text-white shadow-lg"
                            >
                              ✉️ Email
                            </button>{' '}
                            {jdText.trim() && (
                              <button
                                onClick={() => handleAiMatch(selected)}
                                disabled={aiLoading && aiLoadingId === selected.id}
                                className={`flex items-center px-3 py-2 rounded-xl text-xs font-bold transition ${aiLoading && aiLoadingId === selected.id ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg'}`}
                              >
                                {' '}
                                {aiLoading && aiLoadingId === selected.id ? (
                                  <>
                                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                      />
                                    </svg>{' '}
                                    Analyzing...
                                  </>
                                ) : (
                                  <>🤖 AI Match</>
                                )}{' '}
                              </button>
                            )}{' '}
                            <button
                              onClick={() => {
                                const data = `Name: ${selected.name}\nTitle: ${selected.title || 'N/A'}\nEmail: ${selected.email || 'N/A'}\nPhone: ${selected.phone || 'N/A'}\nLocation: ${selected.location || 'N/A'}\nExperience: ${selected.experience || 'N/A'}\nSkills: ${selected.skills || 'N/A'}`;
                                navigator.clipboard.writeText(data).then(() => setToast('📋 Copied!'));
                              }}
                              className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition"
                            >
                              📋 Copy
                            </button>{' '}
                          </div>{' '}
                        </div>{' '}
                        {selected.aiScore !== undefined && selected.aiReasoning && (
                          <div
                            className="mb-6"
                            style={{
                              background: 'linear-gradient(to right, rgba(168,85,247,0.05), rgba(236,72,153,0.05))',
                              border: '1px solid rgba(168,85,247,0.2)',
                              borderRadius: 12,
                              padding: 20,
                            }}
                          >
                            {' '}
                            <div className="flex items-center justify-between mb-3">
                              {' '}
                              <div className="flex items-center gap-2">
                                {' '}
                                <span className="text-lg">🤖</span>{' '}
                                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide">
                                  AI Analysis
                                </h3>{' '}
                              </div>{' '}
                              <div className="flex items-center gap-2">
                                {' '}
                                {selected.aiRecommendation && (
                                  <span
                                    className={`text-xs font-bold px-3 py-1 rounded-lg border ${getAiRecColor(selected.aiRecommendation)}-badge`}
                                  >
                                    {selected.aiRecommendation}
                                  </span>
                                )}{' '}
                                <span
                                  style={{
                                    fontSize: 24,
                                    fontWeight: 900,
                                    color:
                                      selected.aiScore >= 70
                                        ? 'var(--green-400)'
                                        : selected.aiScore >= 40
                                          ? 'var(--yellow-400)'
                                          : 'var(--red-400)',
                                  }}
                                >
                                  {selected.aiScore}%
                                </span>{' '}
                              </div>{' '}
                            </div>{' '}
                            <p className="text-sm text-gray-300 leading-relaxed mb-4">{selected.aiReasoning}</p>{' '}
                            <div className="grid grid-cols-1 sm-grid-cols-2 gap-3">
                              {' '}
                              {selected.aiStrengths && selected.aiStrengths.length > 0 && (
                                <div
                                  style={{
                                    background: 'rgba(34,197,94,0.05)',
                                    border: '1px solid rgba(34,197,94,0.15)',
                                    borderRadius: 8,
                                    padding: 12,
                                  }}
                                >
                                  {' '}
                                  <p className=" font-bold uppercase tracking-wide mb-2 text-green-400">
                                    💪 Strengths
                                  </p>{' '}
                                  {selected.aiStrengths.map((s, i) => (
                                    <p
                                      key={i}
                                      className="text-xs"
                                      style={{
                                        color: 'rgba(134,239,172,0.8)',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 6,
                                        padding: '2px 0',
                                      }}
                                    >
                                      <span className="text-green-400" style={{ marginTop: 2 }}>
                                        ▸
                                      </span>
                                      {s}
                                    </p>
                                  ))}{' '}
                                </div>
                              )}{' '}
                              {selected.aiGaps && selected.aiGaps.length > 0 && (
                                <div
                                  style={{
                                    background: 'rgba(239,68,68,0.05)',
                                    border: '1px solid rgba(239,68,68,0.15)',
                                    borderRadius: 8,
                                    padding: 12,
                                  }}
                                >
                                  {' '}
                                  <p className=" font-bold uppercase tracking-wide mb-2 text-red-400">⚠️ Gaps</p>{' '}
                                  {selected.aiGaps.map((g, i) => (
                                    <p
                                      key={i}
                                      className="text-xs"
                                      style={{
                                        color: 'rgba(252,165,165,0.8)',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 6,
                                        padding: '2px 0',
                                      }}
                                    >
                                      <span className="text-red-400" style={{ marginTop: 2 }}>
                                        ▸
                                      </span>
                                      {g}
                                    </p>
                                  ))}{' '}
                                </div>
                              )}{' '}
                            </div>{' '}
                          </div>
                        )}{' '}
                        {jdApplied && selected.matchScore !== undefined && (
                          <div className={`mb-6 p-5 rounded-xl border ${getScoreColor(selected.matchScore)}-bg`}>
                            {' '}
                            <div className="flex items-center justify-between mb-3">
                              {' '}
                              <div>
                                {' '}
                                <h3 className="text-lg font-bold">Skills Match Score</h3>{' '}
                                <p className="text-sm" style={{ opacity: 0.8 }}>
                                  {getScoreLabel(selected.matchScore)}
                                </p>{' '}
                              </div>{' '}
                              <div style={{ fontSize: 36, fontWeight: 900 }}>{selected.matchScore}%</div>{' '}
                            </div>{' '}
                            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden mb-4">
                              {' '}
                              <div
                                style={{
                                  height: '100%',
                                  width: `${selected.matchScore}%`,
                                  borderRadius: 9999,
                                  transition: 'width 0.5s',
                                  background:
                                    selected.matchScore >= 75
                                      ? 'linear-gradient(to right, var(--green-500), var(--emerald-400))'
                                      : selected.matchScore >= 50
                                        ? 'linear-gradient(to right, var(--yellow-500), var(--amber-400))'
                                        : 'linear-gradient(to right, var(--red-500), var(--rose-400))',
                                }}
                              />{' '}
                            </div>{' '}
                            <div className="mb-3">
                              {' '}
                              <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-300">
                                📋 Required Skills
                              </p>{' '}
                              <div className="grid grid-cols-1 sm-grid-cols-2 gap-3">
                                {' '}
                                {selected.matchedSkills && selected.matchedSkills.length > 0 && (
                                  <div
                                    style={{
                                      background: 'rgba(34,197,94,0.05)',
                                      border: '1px solid rgba(34,197,94,0.15)',
                                      borderRadius: 8,
                                      padding: 12,
                                    }}
                                  >
                                    {' '}
                                    <p className=" font-bold uppercase mb-2 text-green-400">
                                      ✅ Matched ({selected.matchedSkills.length})
                                    </p>{' '}
                                    <div className="flex flex-wrap gap-1">
                                      {selected.matchedSkills.map((s, i) => (
                                        <span
                                          key={i}
                                          className="px-2"
                                          style={{
                                            background: 'rgba(34,197,94,0.2)',
                                            color: '#86efac',
                                            borderRadius: 6,
                                            fontSize: 12,
                                            border: '1px solid rgba(34,197,94,0.2)',
                                          }}
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>{' '}
                                  </div>
                                )}{' '}
                                {selected.missingSkills && selected.missingSkills.length > 0 && (
                                  <div
                                    style={{
                                      background: 'rgba(239,68,68,0.05)',
                                      border: '1px solid rgba(239,68,68,0.15)',
                                      borderRadius: 8,
                                      padding: 12,
                                    }}
                                  >
                                    {' '}
                                    <p className=" font-bold uppercase mb-2 text-red-400">
                                      ❌ Missing ({selected.missingSkills.length})
                                    </p>{' '}
                                    <div className="flex flex-wrap gap-1">
                                      {selected.missingSkills.map((s, i) => (
                                        <span
                                          key={i}
                                          className="px-2"
                                          style={{
                                            background: 'rgba(239,68,68,0.2)',
                                            color: '#fca5a5',
                                            borderRadius: 6,
                                            fontSize: 12,
                                            border: '1px solid rgba(239,68,68,0.2)',
                                          }}
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>{' '}
                                  </div>
                                )}{' '}
                              </div>{' '}
                            </div>{' '}
                            {((selected.matchedPreferred && selected.matchedPreferred.length > 0) ||
                              (selected.missingPreferred && selected.missingPreferred.length > 0)) && (
                              <div className="mb-3">
                                {' '}
                                <p className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-300">
                                  ⭐ Preferred Skills
                                </p>{' '}
                                <div className="grid grid-cols-1 sm-grid-cols-2 gap-3">
                                  {' '}
                                  {selected.matchedPreferred && selected.matchedPreferred.length > 0 && (
                                    <div
                                      style={{
                                        background: 'rgba(59,130,246,0.05)',
                                        border: '1px solid rgba(59,130,246,0.15)',
                                        borderRadius: 8,
                                        padding: 12,
                                      }}
                                    >
                                      {' '}
                                      <p className=" font-bold uppercase mb-2 text-blue-400">
                                        ✅ Has ({selected.matchedPreferred.length})
                                      </p>{' '}
                                      <div className="flex flex-wrap gap-1">
                                        {selected.matchedPreferred.map((s, i) => (
                                          <span
                                            key={i}
                                            className="px-2"
                                            style={{
                                              background: 'rgba(59,130,246,0.2)',
                                              color: '#93c5fd',
                                              borderRadius: 6,
                                              fontSize: 12,
                                              border: '1px solid rgba(59,130,246,0.2)',
                                            }}
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>{' '}
                                    </div>
                                  )}{' '}
                                  {selected.missingPreferred && selected.missingPreferred.length > 0 && (
                                    <div
                                      style={{
                                        background: 'rgba(234,179,8,0.05)',
                                        border: '1px solid rgba(234,179,8,0.15)',
                                        borderRadius: 8,
                                        padding: 12,
                                      }}
                                    >
                                      {' '}
                                      <p className=" font-bold uppercase mb-2 text-yellow-400">
                                        ⚠️ Missing ({selected.missingPreferred.length})
                                      </p>{' '}
                                      <div className="flex flex-wrap gap-1">
                                        {selected.missingPreferred.map((s, i) => (
                                          <span
                                            key={i}
                                            className="px-2"
                                            style={{
                                              background: 'rgba(234,179,8,0.2)',
                                              color: '#fcd34d',
                                              borderRadius: 6,
                                              fontSize: 12,
                                              border: '1px solid rgba(234,179,8,0.2)',
                                            }}
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>{' '}
                                    </div>
                                  )}{' '}
                                </div>{' '}
                              </div>
                            )}{' '}
                            <div className="mt-4 pt-3 border-t border-white-10">
                              {' '}
                              <div className="grid grid-cols-1 sm-grid-cols-3 gap-2">
                                {' '}
                                {selected.email && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(selected.email);
                                      setToast('📧 Email copied!');
                                    }}
                                    className="flex items-center gap-2 px-3 py-2"
                                    style={{
                                      background: 'rgba(37,99,235,0.3)',
                                      border: '1px solid rgba(59,130,246,0.3)',
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span>📧</span>
                                    <span className="truncate">{selected.email}</span>
                                  </button>
                                )}{' '}
                                {selected.phone && (
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(selected.phone);
                                      setToast('📱 Phone copied!');
                                    }}
                                    className="flex items-center gap-2 px-3 py-2"
                                    style={{
                                      background: 'rgba(147,51,234,0.3)',
                                      border: '1px solid rgba(168,85,247,0.3)',
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span>📱</span>
                                    <span className="truncate">{selected.phone}</span>
                                  </button>
                                )}{' '}
                                {selected.email && (
                                  <a
                                    href={`mailto:${selected.email}?subject=Job Opportunity&body=Hi ${selected.name},`}
                                    className="flex items-center justify-center gap-2 px-3 py-2"
                                    style={{
                                      background: 'rgba(22,163,74,0.3)',
                                      border: '1px solid rgba(34,197,94,0.3)',
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 500,
                                      textDecoration: 'none',
                                    }}
                                  >
                                    ✉️ Send Email
                                  </a>
                                )}{' '}
                              </div>{' '}
                            </div>{' '}
                          </div>
                        )}{' '}
                        <div className="grid grid-cols-1 sm-grid-cols-2 gap-4 mb-6">
                          {' '}
                          {[
                            { icon: '👤', label: 'Name', value: selected.name },
                            { icon: '💼', label: 'Job Title', value: selected.title || 'Not detected' },
                            {
                              icon: '📧',
                              label: 'Email',
                              value: selected.email || 'N/A',
                              copyable: !!selected.email,
                              onCopy: () => {
                                navigator.clipboard.writeText(selected.email);
                                setToast('📧 Copied!');
                              },
                            },
                            {
                              icon: '📱',
                              label: 'Phone',
                              value: selected.phone || 'N/A',
                              copyable: !!selected.phone,
                              onCopy: () => {
                                navigator.clipboard.writeText(selected.phone);
                                setToast('📱 Copied!');
                              },
                            },
                            { icon: '🏢', label: 'Experience', value: selected.experience || 'N/A' },
                            { icon: '📍', label: 'Location', value: selected.location || 'N/A' },
                          ].map((card) => (
                            <div
                              key={card.label}
                              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover-border-gray-700 transition group relative"
                            >
                              {' '}
                              <div className="flex items-center gap-2 mb-1">
                                {' '}
                                <span className="text-sm">{card.icon}</span>{' '}
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                  {card.label}
                                </span>{' '}
                              </div>{' '}
                              <div className="flex items-center gap-2">
                                {' '}
                                <p className="text-white font-semibold text-sm truncate flex-1" title={card.value}>
                                  {card.value}
                                </p>{' '}
                                {card.copyable && card.onCopy && (
                                  <button
                                    onClick={card.onCopy}
                                    className="opacity-0 group-hover-opacity-100 transition p-1 hover-bg-gray-800 rounded text-gray-400 hover-text-white"
                                    title="Copy"
                                  >
                                    {' '}
                                    <svg
                                      className=" h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                      viewBox="0 0 24 24"
                                    >
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                    </svg>{' '}
                                  </button>
                                )}{' '}
                              </div>{' '}
                            </div>
                          ))}{' '}
                        </div>{' '}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
                          {' '}
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <span>🛠️</span> Skills
                          </h3>{' '}
                          {selected.skills ? (
                            <div className="flex flex-wrap gap-2">
                              {' '}
                              {selected.skills.split(',').map((s, i) => {
                                const trimSkill = s.trim().toLowerCase();
                                const isMatched = jdApplied && selected.matchedSkills?.includes(trimSkill);
                                return (
                                  <span
                                    key={i}
                                    className={`px-3 rounded-lg text-sm font-medium border ${isMatched ? 'matched-skill' : 'unmatched-skill'}`}
                                  >
                                    {isMatched && '✅ '}
                                    {s.trim()}
                                  </span>
                                );
                              })}{' '}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No skills detected</p>
                          )}{' '}
                        </div>{' '}
                        <div className="border-t border-gray-800 my-6" />{' '}
                        <div className="mb-6">
                          {' '}
                          <div className="flex items-center justify-between mb-4">
                            {' '}
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              {' '}
                              <span>📄</span> Resume Preview{' '}
                              {loadingContent && (
                                <span className="text-xs text-orange-400 animate-pulse ml-2">
                                  Loading from cloud...
                                </span>
                              )}{' '}
                              {isPreviewRendering && (
                                <span className="text-xs text-sky-400 animate-pulse ml-2">Rendering preview...</span>
                              )}{' '}
                            </h3>{' '}
                            <div className="flex items-center gap-2">
                              {' '}
                              <button
                                onClick={() => setShowRawResume(!showRawResume)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  border: '1px solid',
                                  background: showRawResume ? 'var(--orange-400)' : '#fff',
                                  color: showRawResume ? '#fff' : 'var(--slate-600)',
                                  borderColor: showRawResume ? 'var(--orange-500)' : 'var(--slate-300)',
                                  cursor: 'pointer',
                                }}
                              >
                                {showRawResume ? '📝 Formatted' : '📃 Raw'}
                              </button>{' '}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedResumeText);
                                  setToast('📄 Copied!');
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 500,
                                  border: '1px solid var(--slate-300)',
                                  background: '#fff',
                                  color: 'var(--slate-600)',
                                  cursor: 'pointer',
                                }}
                              >
                                📋 Copy
                              </button>{' '}
                            </div>{' '}
                          </div>{' '}
                          {showRawResume ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                              {' '}
                              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed break-words">
                                {selectedResumeText}
                              </pre>{' '}
                            </div>
                          ) : isPreviewRendering ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                              {' '}
                              <div className="h-4 w-40 rounded bg-slate-200 animate-pulse mb-4" />{' '}
                              <div className="space-y-2">
                                {' '}
                                <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />{' '}
                                <div className="h-3 w-[92%] rounded bg-slate-100 animate-pulse" />{' '}
                                <div className="h-3 w-[84%] rounded bg-slate-100 animate-pulse" />{' '}
                              </div>{' '}
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              {' '}
                              <div className="resume-header-gradient p-6 border-b border-slate-200">
                                {' '}
                                <div className="flex items-center gap-5">
                                  {' '}
                                  <div
                                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-lg"
                                    style={{ boxShadow: '0 10px 15px -3px rgba(249,115,22,0.25)' }}
                                  >
                                    {' '}
                                    {selected.name.charAt(0).toUpperCase()}{' '}
                                  </div>{' '}
                                  <div className="min-w-0">
                                    {' '}
                                    <h4 className="text-xl font-bold text-slate-900">{selected.name}</h4>{' '}
                                    {selected.title && (
                                      <p className="text-sm text-orange-700 font-semibold">{selected.title}</p>
                                    )}{' '}
                                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                                      {' '}
                                      {selected.email && (
                                        <span className="text-xs text-sky-700 flex items-center gap-1">
                                          <span
                                            style={{
                                              width: 6,
                                              height: 6,
                                              borderRadius: '50%',
                                              background: '#0284c7',
                                              display: 'inline-block',
                                            }}
                                          />
                                          {selected.email}
                                        </span>
                                      )}{' '}
                                      {selected.phone && (
                                        <span className="text-xs text-violet-700 flex items-center gap-1">
                                          <span
                                            style={{
                                              width: 6,
                                              height: 6,
                                              borderRadius: '50%',
                                              background: 'var(--violet-600)',
                                              display: 'inline-block',
                                            }}
                                          />
                                          {selected.phone}
                                        </span>
                                      )}{' '}
                                      {selected.location && (
                                        <span className="text-xs text-emerald-700 flex items-center gap-1">
                                          <span
                                            style={{
                                              width: 6,
                                              height: 6,
                                              borderRadius: '50%',
                                              background: '#047857',
                                              display: 'inline-block',
                                            }}
                                          />
                                          📍 {selected.location}
                                        </span>
                                      )}{' '}
                                    </div>{' '}
                                  </div>{' '}
                                </div>{' '}
                              </div>{' '}
                              {!hasFullResumeText && (
                                <div
                                  className="mx-6 mt-5 rounded-lg"
                                  style={{
                                    border: '1px solid #d97706',
                                    background: '#fffbeb',
                                    padding: '8px 16px',
                                    fontSize: 12,
                                    color: '#92400e',
                                  }}
                                >
                                  {' '}
                                  Full resume text missing. Showing structured profile summary instead.{' '}
                                </div>
                              )}{' '}
                              <div className="p-6">
                                {' '}
                                {resumeSections.map((section, i) => {
                                  if (section.type === 'empty') return <div key={i} className="h-4" />;
                                  if (section.type === 'heading')
                                    return (
                                      <div key={i} className="mt-6 mb-3 first-mt-0">
                                        {' '}
                                        <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                          <h4 className="text-sm font-bold text-orange-700 uppercase tracking-widest">
                                            {section.content.replace(/[:\-_|#*]/g, '').trim()}
                                          </h4>
                                        </div>{' '}
                                        <div
                                          className="ml-5 mt-1 h-px"
                                          style={{
                                            background: 'linear-gradient(to right, rgba(249,115,22,0.5), transparent)',
                                          }}
                                        />{' '}
                                      </div>
                                    );
                                  if (section.type === 'subheading')
                                    return (
                                      <div key={i} className="mt-3 mb-1 ml-5">
                                        <h5 className="text-sm font-semibold text-slate-800">{section.content}</h5>
                                      </div>
                                    );
                                  if (section.type === 'bullet')
                                    return (
                                      <div key={i} className="flex items-start gap-3 ml-5 py-1">
                                        <span className="text-orange-600 mt-1 text-xs flex-shrink-0">▸</span>
                                        <p className="text-sm text-slate-700 leading-relaxed">{section.content}</p>
                                      </div>
                                    );
                                  return (
                                    <p key={i} className="text-sm text-slate-600 leading-relaxed ml-5">
                                      {section.content}
                                    </p>
                                  );
                                })}{' '}
                              </div>{' '}
                            </div>
                          )}{' '}
                        </div>{' '}
                      </div>{' '}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      {' '}
                      <div className="text-6xl mb-4" style={{ opacity: 0.3 }}>
                        📋
                      </div>{' '}
                      <p className="text-lg font-medium">Select a candidate</p>{' '}
                      <p className="text-sm mt-1">Click on a candidate to view details</p>{' '}
                    </div>
                  )}{' '}
                </div>{' '}
              </>
            )}{' '}
          </div>{' '}
        </div>{' '}
        {/* Score badges CSS injected via inline style */}{' '}
        <style>{` .smart-ats-app .score-green-badge { color: var(--green-400); background: rgba(34,197,94,0.2); border-color: rgba(34,197,94,0.3); } .smart-ats-app .score-yellow-badge { color: var(--yellow-400); background: rgba(234,179,8,0.2); border-color: rgba(234,179,8,0.3); } .smart-ats-app .score-orange-badge { color: var(--orange-400); background: rgba(249,115,22,0.2); border-color: rgba(249,115,22,0.3); } .smart-ats-app .score-red-badge { color: var(--red-400); background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.3); } .smart-ats-app .airec-green-badge { color: var(--green-400); background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); } .smart-ats-app .airec-yellow-badge { color: var(--yellow-400); background: rgba(234,179,8,0.15); border-color: rgba(234,179,8,0.3); } .smart-ats-app .airec-orange-badge { color: var(--orange-400); background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); } .smart-ats-app .airec-red-badge { color: var(--red-400); background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); } .smart-ats-app .score-green-bg { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.2); color: var(--green-400); } .smart-ats-app .score-yellow-bg { border-color: rgba(234,179,8,0.3); background: rgba(234,179,8,0.2); color: var(--yellow-400); } .smart-ats-app .score-orange-bg { border-color: rgba(249,115,22,0.3); background: rgba(249,115,22,0.2); color: var(--orange-400); } .smart-ats-app .score-red-bg { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.2); color: var(--red-400); } .smart-ats-app .extract-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 700; border: 0; cursor: pointer; transition: opacity 0.15s; } .smart-ats-app .extract-btn:hover { opacity: 0.9; } .smart-ats-app .email-action-btn { padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 700; color: #fff; border: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; } .smart-ats-app .email-action-btn:hover { opacity: 0.9; } .smart-ats-app .matched-skill { background: rgba(34,197,94,0.15); color: var(--green-400); border-color: rgba(34,197,94,0.2); } .smart-ats-app .unmatched-skill { background: rgba(249,115,22,0.15); color: var(--orange-400); border-color: rgba(249,115,22,0.2); } .smart-ats-app .bg-gray-900\\/80 { background-color: rgba(17,24,39,0.8); } .smart-ats-app .bg-gray-800\\/50 { background-color: rgba(31,41,55,0.5); } .smart-ats-app .bg-gray-900\\/50 { background-color: rgba(17,24,39,0.5); } .smart-ats-app .bg-orange-500\\/5 { background-color: rgba(249,115,22,0.05); } .smart-ats-app .bg-gray-800\\/70 { background-color: rgba(31,41,55,0.7); } .smart-ats-app .border-gray-800\\/50 { border-color: rgba(31,41,55,0.5); } .smart-ats-app .border-purple-500\\/30 { border-color: rgba(168,85,247,0.3); } .smart-ats-app .border-orange-500\\/30 { border-color: rgba(249,115,22,0.3); } .smart-ats-app .border-green-500\\/20 { border-color: rgba(34,197,94,0.2); } .smart-ats-app .border-green-500\\/30 { border-color: rgba(34,197,94,0.3); } .smart-ats-app .border-blue-500\\/30 { border-color: rgba(59,130,246,0.3); } .smart-ats-app .text-green-500\\/10 { color: rgba(34,197,94,0.1); } .smart-ats-app .bg-green-500\\/10 { background-color: rgba(34,197,94,0.1); } .smart-ats-app .bg-yellow-500\\/10 { background-color: rgba(234,179,8,0.1); } .smart-ats-app .bg-red-500\\/10 { background-color: rgba(239,68,68,0.1); } .smart-ats-app .bg-purple-500\\/20 { background-color: rgba(168,85,247,0.2); } .smart-ats-app .bg-orange-500\\/20 { background-color: rgba(249,115,22,0.2); } .smart-ats-app .bg-blue-500\\/20 { background-color: rgba(59,130,246,0.2); } .smart-ats-app .bg-gray-950 { background-color: #030712; } `}</style>{' '}
      </div>{' '}
    </div>
  );
}
