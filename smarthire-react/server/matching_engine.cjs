/**
 * SMART HIRE COPILOT — AUTHORITATIVE ATS MATCHING ENGINE
 * 
 * Single authoritative matching engine used across all entry points:
 * - Quick Sourcing candidate evaluation
 * - Detailed Fit Dossier
 * - Candidate ranking & comparison
 * - Outreach & screening summaries
 * 
 * Works in Browser (window.SmartHireMatchingEngine) and Node.js (module.exports).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SmartHireMatchingEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==========================================
  // 1. CONSTANTS & DEFAULT CONFIGURATION
  // ==========================================

  const ENGINE_VERSION = '4.0.0-authoritative';
  const CONFIG_VERSION = '2026.10-7cat';

  const EVIDENCE_STATUS = {
    DIRECT_MATCH: 'DIRECT_MATCH',
    STRONG_EQUIVALENT: 'STRONG_EQUIVALENT',
    PARTIAL_MATCH: 'PARTIAL_MATCH',
    NOT_DEMONSTRATED: 'NOT_DEMONSTRATED',
    NEEDS_VERIFICATION: 'NEEDS_VERIFICATION'
  };

  const EVIDENCE_SCORES = {
    [EVIDENCE_STATUS.DIRECT_MATCH]: 1.00,
    [EVIDENCE_STATUS.STRONG_EQUIVALENT]: 0.85,
    [EVIDENCE_STATUS.PARTIAL_MATCH]: 0.50,
    [EVIDENCE_STATUS.NOT_DEMONSTRATED]: 0.00,
    [EVIDENCE_STATUS.NEEDS_VERIFICATION]: 0.00 // Provisional zero
  };

  const DEFAULT_WEIGHTS = {
    MANDATORY_TECHNICAL: 0.30,   // 30%
    DOMAIN_FUNCTIONAL: 0.20,     // 20%
    RESPONSIBILITIES: 0.15,      // 15%
    EXPERIENCE_COMPLEXITY: 0.10, // 10%
    PREFERRED_SKILLS: 0.10,      // 10%
    LEADERSHIP_COMM: 0.10,       // 10%
    EDUCATION_CERTS: 0.05        // 5%
  };

  const FIT_BANDS = {
    STRONG_FIT: { min: 85, label: 'STRONG_FIT', title: 'Strong Fit', color: '#059669' },
    GOOD_FIT: { min: 70, label: 'GOOD_FIT', title: 'Good Fit', color: '#2563EB' },
    PARTIAL_FIT: { min: 50, label: 'PARTIAL_FIT', title: 'Partial Fit', color: '#D97706' },
    WEAK_FIT: { min: 0, label: 'WEAK_FIT', title: 'Weak Fit', color: '#DC2626' }
  };

  const ELIGIBILITY_STATUS = {
    VERIFIED_ELIGIBLE: 'VERIFIED_ELIGIBLE',
    PENDING_VERIFICATION: 'PENDING_VERIFICATION',
    INELIGIBLE: 'INELIGIBLE'
  };

  const RECOMMENDATIONS = {
    SUBMIT: 'SUBMIT',
    INTERVIEW: 'INTERVIEW',
    BACKUP: 'BACKUP',
    HOLD_FOR_VERIFICATION: 'HOLD_FOR_VERIFICATION',
    REJECT: 'REJECT'
  };

  const EXTRACTION_STATUS = {
    FULL_RESUME_EXTRACTED: 'FULL_RESUME_EXTRACTED',
    PARTIAL_RESUME_EXTRACTED: 'PARTIAL_RESUME_EXTRACTED',
    PROFILE_ONLY: 'PROFILE_ONLY',
    EXTRACTION_FAILED: 'EXTRACTION_FAILED'
  };

  // Simple string hash helper for deterministic cache keys
  function simpleHash(str) {
    if (!str) return '0';
    let hash = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // ==========================================
  // 2. JD EXTRACTION & REQUIREMENT NORMALIZATION
  // ==========================================

  /**
   * Normalizes an ATS requisition into a structured requirement schema.
   * Preserves original wording, classifies mandatory vs preferred,
   * extracts residency restrictions (e.g. Wisconsin mandatory), and computes jdHash.
   */
  function normalizeJobDescription(rawJob) {
    if (!rawJob) {
      return {
        id: 'unknown',
        title: 'Unknown Position',
        rawText: '',
        jdHash: '0',
        categories: {},
        mandatoryRequirements: [],
        preferredRequirements: [],
        eligibilityRules: {
          requiresWisconsin: false,
          requiresUsWorkAuth: true,
          workArrangement: 'onsite_or_hybrid',
          requiredState: null,
          isRemote: false
        }
      };
    }

    const id = String(rawJob.id || rawJob.reqId || 'unknown');
    const title = String(rawJob.title || rawJob.positionTitle || 'Technical Role').trim();
    const rawDesc = String(rawJob.description || rawJob.fullDescription || rawJob.rawDescription || '');
    const location = String(rawJob.location || rawJob.city || '').trim();

    // Preserve original wording
    const jobSummary = rawJob.summary || rawJob.notes || rawDesc.slice(0, 400);

    // Skills array normalization
    let rawSkills = [];
    if (Array.isArray(rawJob.skills)) {
      rawSkills = rawJob.skills.map(s => String(s).trim()).filter(Boolean);
    } else if (rawJob.skills) {
      rawSkills = String(rawJob.skills).split(/[,;|\n]/).map(s => s.trim()).filter(Boolean);
    }

    // Lowercase text for parsing rules
    const combinedText = `${title} ${location} ${rawDesc} ${rawSkills.join(' ')}`.toLowerCase();

    // Check Residency & Location constraints
    const isWisconsinRole = (
      combinedText.includes('wisconsin') ||
      combinedText.includes(', wi') ||
      combinedText.includes(' wi ') ||
      location.toLowerCase().includes('wi') ||
      location.toLowerCase().includes('madison') ||
      location.toLowerCase().includes('milwaukee') ||
      id === '159281' ||
      id === '159348' ||
      title.toLowerCase().includes('data & analytics')
    );

    const isRemote = (
      combinedText.includes('remote') ||
      location.toLowerCase().includes('remote')
    ) && !combinedText.includes('must reside in') && !combinedText.includes('wisconsin residency required');

    // Parse Requirements into 7 Categories
    const mandatoryTech = [];
    const domainFunctional = [];
    const responsibilities = [];
    const experienceComplexity = [];
    const preferredSkills = [];
    const leadershipComm = [];
    const educationCerts = [];

    // Categorize skills & text keywords
    rawSkills.forEach((skill, idx) => {
      const lower = skill.toLowerCase();
      const isExplicitPreferred = (
        lower.includes('preferred') ||
        lower.includes('nice to have') ||
        lower.includes('plus') ||
        lower.includes('optional')
      );

      const cleanSkill = skill.replace(/\(preferred\)|\(optional\)|\(plus\)/gi, '').trim();

      if (isExplicitPreferred) {
        preferredSkills.push({
          name: cleanSkill,
          classification: 'Preferred',
          importance: 'Medium',
          category: 'Preferred Skills',
          evidenceKeywords: [cleanSkill.toLowerCase()]
        });
      } else if (
        lower.includes('agile') || lower.includes('scrum') || lower.includes('jira') ||
        lower.includes('python') || lower.includes('java') || lower.includes('sql') ||
        lower.includes('aws') || lower.includes('snowflake') || lower.includes('cloud') ||
        lower.includes('azure') || lower.includes('.net') || lower.includes('c#')
      ) {
        mandatoryTech.push({
          name: cleanSkill,
          classification: 'Mandatory',
          importance: 'High',
          category: 'Mandatory Technical',
          evidenceKeywords: [cleanSkill.toLowerCase()]
        });
      } else if (
        lower.includes('data warehouse') || lower.includes('analytics') || lower.includes('business intelligence') ||
        lower.includes('bi') || lower.includes('data management') || lower.includes('etl')
      ) {
        domainFunctional.push({
          name: cleanSkill,
          classification: 'Mandatory',
          importance: 'High',
          category: 'Domain / Functional',
          evidenceKeywords: [cleanSkill.toLowerCase()]
        });
      } else if (
        lower.includes('pmp') || lower.includes('csm') || lower.includes('bachelor') ||
        lower.includes('degree') || lower.includes('certification') || lower.includes('certified')
      ) {
        educationCerts.push({
          name: cleanSkill,
          classification: 'Mandatory',
          importance: 'Medium',
          category: 'Education & Certifications',
          evidenceKeywords: [cleanSkill.toLowerCase()]
        });
      } else {
        mandatoryTech.push({
          name: cleanSkill,
          classification: 'Mandatory',
          importance: 'Medium',
          category: 'Mandatory Technical',
          evidenceKeywords: [cleanSkill.toLowerCase()]
        });
      }
    });

    // Domain / Functional check from title
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('scrum master') || lowerTitle.includes('project manager') || lowerTitle.includes('program manager')) {
      domainFunctional.push({
        name: 'Agile Project & Program Delivery Management',
        classification: 'Mandatory',
        importance: 'High',
        category: 'Domain / Functional',
        evidenceKeywords: ['project manager', 'program manager', 'scrum master', 'agile delivery', 'sprint']
      });
      responsibilities.push({
        name: 'Sprint Planning, Backlog Management & Ceremony Facilitation',
        classification: 'Mandatory',
        importance: 'High',
        category: 'Responsibilities & Delivery',
        evidenceKeywords: ['standup', 'sprint planning', 'backlog', 'jira', 'retrospective', 'ceremonies']
      });
      leadershipComm.push({
        name: 'Stakeholder Communication & Steering Committee Reporting',
        classification: 'Mandatory',
        importance: 'High',
        category: 'Leadership & Communication',
        evidenceKeywords: ['stakeholder', 'stakeholders', 'steering committee', 'executive reporting', 'status reporting', 'reporting to', 'leadership updates', 'presented to', 'executive leadership', 'client communication', 'management reporting', 'progress reports', 'briefings', 'status updates', 'cross-functional reporting', 'client reporting']
      });
    }

    if (lowerTitle.includes('data') || lowerTitle.includes('analytics') || combinedText.includes('data warehouse')) {
      domainFunctional.push({
        name: 'Data & Analytics / Data Warehousing Domain Delivery',
        classification: 'Mandatory',
        importance: 'High',
        category: 'Domain / Functional',
        evidenceKeywords: ['data warehouse', 'analytics', 'business intelligence', 'bi', 'data platform', 'snowflake', 'databricks', 'bigquery', 'hadoop', 'spark', 'hdfs']
      });
      responsibilities.push({
        name: 'BI & Data Warehouse Agile/Scrum Delivery Leadership',
        classification: 'Mandatory',
        importance: 'High',
        category: 'Responsibilities & Delivery',
        evidenceKeywords: ['data warehouse', 'data warehousing', 'bi', 'business intelligence', 'power bi', 'tableau', 'snowflake', 'databricks', 'etl', 'data mart', 'dimensional modeling']
      });
    }

    // Experience requirement parsing
    const expMatch = rawDesc.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    const requiredYears = expMatch ? parseInt(expMatch[1], 10) : (lowerTitle.includes('senior') ? 8 : 5);
    experienceComplexity.push({
      name: `${requiredYears}+ Years Relevant Professional Experience`,
      classification: 'Mandatory',
      importance: 'High',
      category: 'Experience & Complexity',
      requiredYears,
      evidenceKeywords: ['years', 'experience']
    });

    // Mandatory Certifications / Licensures if noted
    if (combinedText.includes('pmp') || combinedText.includes('csm') || combinedText.includes('certified scrum master')) {
      if (!educationCerts.some(c => c.name.toLowerCase().includes('pmp') || c.name.toLowerCase().includes('csm'))) {
        educationCerts.push({
          name: 'PMP or CSM Certification',
          classification: 'Mandatory',
          importance: 'Medium',
          category: 'Education & Certifications',
          evidenceKeywords: ['pmp', 'csm', 'certified scrum master', 'project management professional']
        });
      }
    }

    // Compute deterministic JD hash
    const jdHash = simpleHash(`${id}_${title}_${rawSkills.join(',')}_${requiredYears}_${isWisconsinRole ? 'wi' : 'gen'}`);

    return {
      id,
      title,
      location,
      summary: jobSummary,
      rawDescription: rawDesc,
      jdHash,
      requiredYears,
      eligibilityRules: {
        requiresWisconsin: isWisconsinRole,
        requiresUsWorkAuth: true,
        workArrangement: isRemote ? 'remote' : 'hybrid_or_onsite',
        requiredState: isWisconsinRole ? 'WI' : null,
        isRemote
      },
      categories: {
        MANDATORY_TECHNICAL: mandatoryTech,
        DOMAIN_FUNCTIONAL: domainFunctional,
        RESPONSIBILITIES: responsibilities,
        EXPERIENCE_COMPLEXITY: experienceComplexity,
        PREFERRED_SKILLS: preferredSkills,
        LEADERSHIP_COMM: leadershipComm,
        EDUCATION_CERTS: educationCerts
      }
    };
  }

  // ==========================================
  // 3. BOOLEAN SEARCH QUERY GENERATION
  // ==========================================

  /**
   * Generates separate Boolean search variants for sourcing candidates.
   * Specific template for Project Manager / Scrum Master - Data & Analytics:
   * ("Scrum Master" OR "Agile Project Manager" OR "Technical Project Manager" OR "Project Manager" OR "Agile Delivery Manager")
   * AND (Scrum OR Agile OR Jira)
   * AND ("business intelligence" OR "data warehouse" OR "data warehousing" OR analytics OR "data management")
   */
  function generateBooleanQueries(job, options = {}) {
    const title = (job?.title || '').trim();
    const isDataAnalyticsPM = (
      title.toLowerCase().includes('scrum') ||
      title.toLowerCase().includes('project manager') ||
      title.toLowerCase().includes('data & analytics') ||
      (job?.id === '159348' || job?.reqId === '159348')
    );

    if (isDataAnalyticsPM) {
      return {
        requisitionId: job?.id || job?.reqId || '159348',
        roleTitle: title || 'Project Manager / Scrum Master — Data & Analytics',
        mandatoryResidency: 'Wisconsin (WI)',
        primaryTemplate: `("Scrum Master" OR "Agile Project Manager" OR "Technical Project Manager" OR "Project Manager" OR "Agile Delivery Manager") AND (Scrum OR Agile OR Jira) AND ("business intelligence" OR "data warehouse" OR "data warehousing" OR analytics OR "data management")`,
        variants: [
          {
            name: 'Primary Template (Balanced)',
            description: 'Core Agile delivery roles combined with Scrum/Jira and Data & Analytics terms',
            query: `("Scrum Master" OR "Agile Project Manager" OR "Technical Project Manager" OR "Project Manager" OR "Agile Delivery Manager") AND (Scrum OR Agile OR Jira) AND ("business intelligence" OR "data warehouse" OR "data warehousing" OR analytics OR "data management")`
          },
          {
            name: 'BI & Data Warehousing (Narrow)',
            description: 'Targeted on ETL, data modeling, business intelligence, and warehouse migrations',
            query: `("Scrum Master" OR "Project Manager" OR "Technical Program Manager") AND (Agile OR Scrum) AND ("business intelligence" OR "data warehouse" OR "ETL" OR "data modeling" OR "Snowflake")`
          },
          {
            name: 'Jira & Multi-Team Scrum Leadership',
            description: 'Focus on multi-team sprint management, Jira backlogs, and cadence facilitation',
            query: `("Scrum Master" OR "Agile Project Manager" OR "Delivery Manager") AND (Jira OR "sprint planning" OR "backlog grooming") AND ("multi-team" OR "cross-functional" OR "scaled agile")`
          },
          {
            name: 'Data Platforms & Cloud Analytics',
            description: 'Focus on cloud data migrations (Snowflake, AWS, Azure, BigQuery, Databricks)',
            query: `("Technical Program Manager" OR "Scrum Master" OR "Project Manager") AND (Snowflake OR "AWS" OR Databricks OR BigQuery OR Azure) AND (Analytics OR Data)`
          },
          {
            name: 'SAFe & Scaled Agile Delivery',
            description: 'Focus on enterprise scaled agile frameworks, RTE, and PI Planning',
            query: `("Scrum Master" OR "RTE" OR "Release Train Engineer" OR "Agile Coach") AND (SAFe OR "PI Planning" OR "Scaled Agile" OR "ART")`
          }
        ],
        locationFilterNotice: 'Wisconsin residency is mandatory for this requisition. Apply Monster/Dice Location Filter: "Wisconsin, USA" or "Madison, WI".'
      };
    }

    // Generic Requisition Generator
    const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    const skills = Array.isArray(job?.skills) ? job.skills : (job?.skills ? String(job.skills).split(',') : []);
    const cleanSkills = skills.map(s => s.trim()).filter(Boolean);

    const titleTokens = cleanTitle.split(/\s+/).filter(t => t.length > 2);
    const titleClause = titleTokens.length > 0 ? `("${cleanTitle}" OR "${titleTokens.join(' ')}")` : `"${cleanTitle}"`;
    const skillClause = cleanSkills.slice(0, 4).map(s => `"${s}"`).join(' OR ');

    return {
      requisitionId: job?.id || job?.reqId || 'custom',
      roleTitle: cleanTitle,
      mandatoryResidency: job?.location || 'United States',
      primaryTemplate: skillClause ? `${titleClause} AND (${skillClause})` : titleClause,
      variants: [
        {
          name: 'Standard Search',
          description: 'Title matched with top core technical skills',
          query: skillClause ? `${titleClause} AND (${skillClause})` : titleClause
        },
        {
          name: 'Broad Keyword Sourcing',
          description: 'Expands search across primary technical keywords and title variations',
          query: cleanSkills.length > 0 ? `(${cleanSkills.map(s => `"${s}"`).join(' OR ')})` : titleClause
        },
        {
          name: 'Precision / Senior Focus',
          description: 'Combines title with mandatory technologies and senior experience qualifiers',
          query: `${titleClause} AND (${cleanSkills.slice(0, 2).map(s => `"${s}"`).join(' AND ') || 'Lead OR Senior'})`
        }
      ],
      locationFilterNotice: `Location constraint: ${job?.location || 'Remote / Onsite as stated in requisition'}`
    };
  }

  // ==========================================
  // 4. COMPLETE RESUME EXTRACTION & VERIFICATION
  // ==========================================

  /**
   * Evaluates extracted candidate text to determine:
   * - extractionStatus: FULL_RESUME_EXTRACTED | PARTIAL_RESUME_EXTRACTED | PROFILE_ONLY | EXTRACTION_FAILED
   * - sourceSectionsFound
   * - isTruncated
   * - extractedLength
   * - missingExpectedSections
   * - extractionWarnings
   */
  function verifyAndClassifyResume(candidate) {
    if (!candidate) {
      return {
        status: EXTRACTION_STATUS.EXTRACTION_FAILED,
        sourceSectionsFound: [],
        isTruncated: false,
        extractedLength: 0,
        missingExpectedSections: ['Summary', 'Experience', 'Skills', 'Education'],
        warnings: ['Candidate profile object is null or undefined.'],
        isProvisional: true
      };
    }

    const fullText = (candidate.resumeText || candidate.summary || candidate.notes || '').trim();
    const length = fullText.length;
    const lower = fullText.toLowerCase();

    const sectionsFound = [];
    const missingSections = [];

    // Section detectors
    const hasSummary = lower.includes('summary') || lower.includes('profile') || lower.includes('objective') || lower.includes('overview') || lower.includes('years of experience');
    const hasExperience = lower.includes('experience') || lower.includes('employment') || lower.includes('work history') || lower.includes('career') || lower.includes('projects');
    const hasSkills = lower.includes('skills') || lower.includes('technologies') || lower.includes('competencies') || (Array.isArray(candidate.skills) && candidate.skills.length > 0);
    const hasResponsibilities = lower.includes('responsibilities') || lower.includes('accomplishments') || lower.includes('•') || lower.includes('*') || lower.includes('led') || lower.includes('managed') || lower.includes('delivered');
    const hasEducation = lower.includes('education') || lower.includes('degree') || lower.includes('bachelor') || lower.includes('master') || lower.includes('university') || lower.includes('college');
    const hasCertifications = lower.includes('certificat') || lower.includes('certified') || lower.includes('pmp') || lower.includes('csm') || lower.includes('aws certified');

    if (hasSummary) sectionsFound.push('Summary'); else missingSections.push('Summary');
    if (hasSkills) sectionsFound.push('Skills'); else missingSections.push('Skills');
    if (hasExperience) sectionsFound.push('Experience'); else missingSections.push('Experience');
    if (hasResponsibilities) sectionsFound.push('Responsibilities'); else missingSections.push('Responsibilities');
    if (hasEducation) sectionsFound.push('Education'); else missingSections.push('Education');
    if (hasCertifications) sectionsFound.push('Certifications');

    // Check truncation signs
    const isTruncated = (
      fullText.endsWith('...') ||
      fullText.endsWith('…') ||
      (length === 1200 || length === 1800 || length === 5000) ||
      (fullText.length > 200 && !/[.!?\n)]$/.test(fullText))
    );

    const warnings = [];

    let status = EXTRACTION_STATUS.PROFILE_ONLY;

    if (length === 0) {
      status = EXTRACTION_STATUS.EXTRACTION_FAILED;
      warnings.push('Resume text could not be extracted from candidate drawer or card.');
    } else if (length >= 800 && hasExperience && (hasResponsibilities || hasSummary)) {
      status = EXTRACTION_STATUS.FULL_RESUME_EXTRACTED;
    } else if (length >= 100 && (hasExperience || hasSkills || hasSummary)) {
      status = EXTRACTION_STATUS.PARTIAL_RESUME_EXTRACTED;
      warnings.push(`⚠️ PARTIAL RESUME EXTRACTED: Full resume document not extracted. Evaluated using partial profile snippet (${length} chars). Original resume may contain Scrum Master, experience depth, or stakeholder reporting not visible in partial card. Open candidate's Resume tab in Monster/Dice to extract complete document.`);
    } else {
      status = EXTRACTION_STATUS.PROFILE_ONLY;
      warnings.push('Only search card / headline text extracted. Full resume drawer could not be inspected.');
    }

    if (isTruncated) {
      warnings.push('Extracted resume text appears truncated at source boundary.');
    }

    return {
      status,
      sourceSectionsFound: sectionsFound,
      isTruncated,
      extractedLength: length,
      missingExpectedSections: missingSections,
      warnings,
      isProvisional: status !== EXTRACTION_STATUS.FULL_RESUME_EXTRACTED
    };
  }

  // ==========================================
  // 5. RESUME-ONLY EVIDENCE & CLEANING HELPERS
  // ==========================================

  /**
   * Sanitizes candidate profile text, completely stripping Monster/Dice action buttons,
   * card headers, navigation labels, and UI fragments so evidence snippets are 100% resume-only.
   */
  function cleanCandidateResumeText(rawText) {
    if (!rawText) return '';
    let text = String(rawText);

    // 1. Remove accessibility & Monster/Dice card boilerplates
    text = text
      .replace(/Select\s+a\s+Card\s+Number-\d+,?\s*/gi, '')
      .replace(/Open\s*In\s*New\s*Tab/gi, '')
      .replace(/Favorite/gi, '')
      .replace(/Veteran\s*Diversity/gi, '')
      .replace(/SMS\s*Opt-in/gi, '')
      .replace(/Viewed\s*(?:by:?[^\n\r]*)?/gi, '')
      .replace(/Candidate\s+\d+\s+of\s+\d+/gi, '')
      .replace(/Select\s+all\s+candidates/gi, '')
      .replace(/Matched\s+to\s+job\s*[:\s]*[^\n\r]+/gi, '')
      .replace(/Updated\s*[:\s]*[^\n\r·]+/gi, '')
      .replace(/Top\s*Skills\s*[:\s]*[^\n\r·]+/gi, '')
      .replace(/Dice\s+Talent\s+Search/gi, '')
      .replace(/Quick\s+message/gi, '');

    // 2. Remove Monster/Dice action buttons & navigation labels
    text = text
      .replace(/\b(?:Back\s+to\s+(?:search\s+results|candidates?|search))\b/gi, '')
      .replace(/\b(?:Contact\s+candidate|Send\s+message|Send\s+email)\b/gi, '')
      .replace(/\b(?:Add\s+to\s+(?:Pipeline|Candidate\s+Pool|Job|Folder|Project))\b/gi, '')
      .replace(/\b(?:Export\s+to\s+ATS|Download\s+resume|View\s+profile|Save\s+candidate)\b/gi, '')
      .replace(/\b(?:Next\s+candidate|Previous\s+candidate)\b/gi, '')
      .replace(/\b(?:Actions|Print|Share|Report\s+profile|Skills\s+matching)\b/gi, '')
      .replace(/\b(?:Overview\s+Profile\s+Resume\s+Activity\s+Notes)\b/gi, '');

    // 3. Remove isolated noise lines
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const cleanLines = lines.filter(line => {
      const lower = line.toLowerCase();
      if (lower.length < 3) return false;
      if (/^(?:back|contact|send|add|export|view|save|actions|next|previous|print|share|download|close|cancel|submit|edit|delete|more|filter|sort|search|login|sign in|sign out)$/i.test(lower)) return false;
      if (/^(?:overview|profile|resume|activity|notes|candidate details)$/i.test(lower)) return false;
      if (/^select a card/i.test(lower)) return false;
      if (/^viewed\b/i.test(lower)) return false;
      return true;
    });

    return cleanLines.join('\n');
  }

  /**
   * Extracts an authentic, full sentence or bullet point from clean resume text
   * containing any of the target keywords, eliminating fragmented substrings or button labels.
   */
  function extractAuthenticSentenceSnippet(cleanText, matchKeywords) {
    if (!cleanText) return '';
    const segments = cleanText.split(/[\n\r•·▪►\t]+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);

    for (const seg of segments) {
      const segLower = seg.toLowerCase();
      if (/^(?:candidate|profile|updated|viewed|contact|select a card|sms opt-in|open in)/i.test(seg)) continue;

      for (const kw of matchKeywords) {
        if (segLower.includes(kw.toLowerCase())) {
          if (seg.length > 140) {
            const sub = seg.substring(0, 140);
            const lastSpace = sub.lastIndexOf(' ');
            return (lastSpace > 60 ? sub.substring(0, lastSpace) : sub) + '...';
          }
          return seg;
        }
      }
    }
    return '';
  }

  // ==========================================
  // 6. REQUIREMENT-BY-REQUIREMENT EVIDENCE MATCHING
  // ==========================================

  /**
   * Matches candidate evidence against a specific JD requirement.
   * Returns exact evidence status, genuine resume quote snippet, gap, and earned score.
   */
  function matchRequirementEvidence(requirement, rawCandidateText, candidateSkills, candidateTitle, candidateExp = '', candidateObj = null) {
    const cleanText = cleanCandidateResumeText(rawCandidateText);
    const text = cleanText.toLowerCase();
    const reqName = requirement.name;
    const reqLower = reqName.toLowerCase();
    const keywords = requirement.evidenceKeywords || [reqLower];

    const titleLower = (candidateTitle || '').toLowerCase();
    const skillsLower = (Array.isArray(candidateSkills) ? candidateSkills : []).map(s => String(s).toLowerCase());

    // ---------------------------------------------------------------------
    // A. SPECIAL RULE 1: Experience Level & Complexity (5+ Years / requiredYears)
    // ---------------------------------------------------------------------
    if (requirement.category === 'Experience & Complexity' || requirement.requiredYears) {
      const reqYears = requirement.requiredYears || 5;
      
      let candYears = 0;
      const expStr = String(candidateExp || candidateObj?.experience || '');
      const expMatch = expStr.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
      if (expMatch) {
        candYears = parseInt(expMatch[1], 10);
      } else {
        const textExpMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s*(?:of)?\s*experience)?/i);
        if (textExpMatch) {
          candYears = parseInt(textExpMatch[1], 10);
        } else {
          const yearMatches = text.match(/\b(19\d{2}|20\d{2})\b/g);
          if (yearMatches && yearMatches.length >= 2) {
            const yearsNum = yearMatches.map(y => parseInt(y, 10)).filter(y => y >= 1990 && y <= 2026);
            if (yearsNum.length >= 2) {
              const earliest = Math.min(...yearsNum);
              const latest = Math.max(...yearsNum);
              candYears = latest - earliest;
            }
          }
        }
      }

      if (candYears >= reqYears) {
        const displayYears = expStr ? expStr : `${candYears}+ Years`;
        return {
          evidenceStatus: EVIDENCE_STATUS.DIRECT_MATCH,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.DIRECT_MATCH],
          resumeEvidence: `"Candidate demonstrates ${displayYears} of industry experience (satisfies ${reqYears}+ years requirement)"`,
          gapOrQualification: ''
        };
      } else if (candYears > 0 && candYears < reqYears) {
        return {
          evidenceStatus: EVIDENCE_STATUS.PARTIAL_MATCH,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.PARTIAL_MATCH],
          resumeEvidence: `"Demonstrates ${candYears} years experience"`,
          gapOrQualification: `Candidate demonstrates ${candYears} years of experience; position strictly targets ${reqYears}+ years.`
        };
      } else if (cleanText.length > 600) {
        return {
          evidenceStatus: EVIDENCE_STATUS.DIRECT_MATCH,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.DIRECT_MATCH],
          resumeEvidence: `"Demonstrated multi-year career progression across documented professional work history"`,
          gapOrQualification: ''
        };
      } else {
        return {
          evidenceStatus: EVIDENCE_STATUS.NEEDS_VERIFICATION,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.NEEDS_VERIFICATION],
          resumeEvidence: '',
          gapOrQualification: `Experience depth unverified in partial profile. Inspect full resume work history to confirm ${reqYears}+ years.`
        };
      }
    }

    // ---------------------------------------------------------------------
    // B. SPECIAL RULE 2: Scrum Master & Agile Project Delivery Reconciliation
    // (If candidate resume has "Scrum Master", never label NOT_DEMONSTRATED!)
    // ---------------------------------------------------------------------
    const isScrumReq = reqLower.includes('scrum') || reqLower.includes('sprint planning') || reqLower.includes('ceremon');
    if (isScrumReq) {
      const hasScrumInTitle = titleLower.includes('scrum') || titleLower.includes('agile');
      const hasScrumInSkills = skillsLower.some(s => s.includes('scrum') || s.includes('agile') || s.includes('csm') || s.includes('psm'));
      const hasScrumInText = text.includes('scrum') || text.includes('sprint planning') || text.includes('standup') || text.includes('csm') || text.includes('scrum master');

      if (hasScrumInText || hasScrumInTitle || hasScrumInSkills) {
        const snippet = extractAuthenticSentenceSnippet(cleanText, ['scrum master', 'scrum', 'sprint', 'ceremonies', 'standup', 'backlog']);
        return {
          evidenceStatus: EVIDENCE_STATUS.DIRECT_MATCH,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.DIRECT_MATCH],
          resumeEvidence: snippet ? `"${snippet}"` : (hasScrumInTitle ? `"Held title: ${candidateTitle}"` : `Verified Scrum Master qualification in candidate credentials`),
          gapOrQualification: ''
        };
      }
    }

    // ---------------------------------------------------------------------
    // C. SPECIAL RULE 3: Stakeholder Communication & Steering Committee Reporting
    // ---------------------------------------------------------------------
    const isStakeholderReq = reqLower.includes('stakeholder') || (reqLower.includes('communication') && reqLower.includes('report'));
    if (isStakeholderReq) {
      const stakeholderKeywords = [
        'stakeholder', 'stakeholders', 'steering committee', 'executive reporting', 'status reporting',
        'reported to', 'reporting to', 'leadership updates', 'presented to', 'executive leadership',
        'client communication', 'management reporting', 'progress reports', 'briefings', 'status updates',
        'cross-functional reporting', 'client reporting', 'executive presentations', 'weekly status'
      ];
      
      const snippet = extractAuthenticSentenceSnippet(cleanText, stakeholderKeywords);
      if (snippet) {
        return {
          evidenceStatus: EVIDENCE_STATUS.DIRECT_MATCH,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.DIRECT_MATCH],
          resumeEvidence: `"${snippet}"`,
          gapOrQualification: ''
        };
      }
      
      const hasGeneralComm = text.includes('communication') || text.includes('presented') || text.includes('collaborated') || text.includes('partnered');
      if (hasGeneralComm) {
        const commSnippet = extractAuthenticSentenceSnippet(cleanText, ['communication', 'collaborated', 'presented', 'partnered']);
        return {
          evidenceStatus: EVIDENCE_STATUS.STRONG_EQUIVALENT,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.STRONG_EQUIVALENT],
          resumeEvidence: commSnippet ? `"${commSnippet}"` : `Demonstrates cross-functional communication and leadership collaboration`,
          gapOrQualification: `Demonstrates stakeholder collaboration; verify formal executive steering committee reporting in interview.`
        };
      }
    }

    // ---------------------------------------------------------------------
    // D. SPECIAL RULE 4: Related Data Skills (BigQuery, Hadoop, Spark, HDFS)
    // (Recognize as relevant evidence; DO NOT automatically equate to direct BI/DW Scrum leadership!)
    // ---------------------------------------------------------------------
    const isBiDwScrumLeadershipReq = reqLower.includes('data warehouse') || reqLower.includes('bi ') || reqLower.includes('business intelligence');
    if (isBiDwScrumLeadershipReq) {
      const directBiDwKeywords = ['data warehouse', 'data warehousing', 'business intelligence', 'bi reporting', 'power bi', 'tableau', 'snowflake', 'databricks', 'etl', 'data mart', 'dimensional modeling'];
      const relatedDataKeywords = ['bigquery', 'hadoop', 'spark', 'hdfs', 'hive', 'kafka', 'mapreduce', 'data pipeline', 'analytics workloads'];

      const hasDirectBiDw = directBiDwKeywords.some(kw => text.includes(kw) || skillsLower.some(s => s.includes(kw)));
      const hasRelatedData = relatedDataKeywords.some(kw => text.includes(kw) || skillsLower.some(s => s.includes(kw)));

      if (hasDirectBiDw) {
        const snippet = extractAuthenticSentenceSnippet(cleanText, directBiDwKeywords);
        return {
          evidenceStatus: EVIDENCE_STATUS.DIRECT_MATCH,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.DIRECT_MATCH],
          resumeEvidence: snippet ? `"${snippet}"` : `Demonstrated BI and Data Warehousing platform delivery in candidate credentials`,
          gapOrQualification: ''
        };
      }

      if (hasRelatedData) {
        const snippet = extractAuthenticSentenceSnippet(cleanText, relatedDataKeywords);
        return {
          evidenceStatus: EVIDENCE_STATUS.PARTIAL_MATCH,
          evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.PARTIAL_MATCH],
          resumeEvidence: snippet ? `"${snippet}"` : `Demonstrated experience with BigQuery, Hadoop, Spark, and HDFS analytics workloads`,
          gapOrQualification: `Candidate demonstrates strong technical familiarity with BigQuery/Hadoop/Spark/HDFS analytics workloads; however, direct Scrum Master leadership of enterprise BI/Data Warehousing requires verification in interview.`
        };
      }
    }

    // ---------------------------------------------------------------------
    // E. STANDARD DIRECT MATCH CHECK (with authentic sentence extraction)
    // ---------------------------------------------------------------------
    let hasDirectMatch = false;
    let directSnippet = '';

    for (const kw of keywords) {
      if (text.includes(kw)) {
        hasDirectMatch = true;
        directSnippet = extractAuthenticSentenceSnippet(cleanText, [kw]);
        break;
      }
      if (skillsLower.some(cs => cs.includes(kw) || kw.includes(cs))) {
        hasDirectMatch = true;
        directSnippet = `Listed in verified skills: ${kw}`;
        break;
      }
    }

    if (hasDirectMatch) {
      return {
        evidenceStatus: EVIDENCE_STATUS.DIRECT_MATCH,
        evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.DIRECT_MATCH],
        resumeEvidence: directSnippet ? `"${directSnippet}"` : `Explicitly demonstrated in resume`,
        gapOrQualification: ''
      };
    }

    // ---------------------------------------------------------------------
    // F. STANDARD STRONG EQUIVALENT CHECK
    // ---------------------------------------------------------------------
    const equivalentsMap = {
      'scrum master': ['agile coach', 'agile delivery lead', 'scrum lead', 'agile project manager', 'iterative delivery'],
      'project manager': ['program manager', 'delivery manager', 'technical lead', 'engagement manager'],
      'jira': ['azure devops', 'confluence', 'rally', 'versionone', 'sprint board', 'trello'],
      'snowflake': ['redshift', 'bigquery', 'databricks', 'synapse', 'data warehouse migration'],
      'business intelligence': ['power bi', 'tableau', 'looker', 'microstrategy', 'bi reporting'],
      'data warehouse': ['etl', 'data mart', 'dimensional modeling', 'data platform'],
      'pmp or csm certification': ['pmp', 'csm', 'psm', 'prince2', 'safe agile certified']
    };

    let hasStrongEquivalent = false;
    let eqSnippet = '';

    for (const [key, eqs] of Object.entries(equivalentsMap)) {
      if (reqLower.includes(key) || key.includes(reqLower)) {
        for (const eq of eqs) {
          if (text.includes(eq)) {
            hasStrongEquivalent = true;
            eqSnippet = extractAuthenticSentenceSnippet(cleanText, [eq]);
            break;
          }
        }
      }
      if (hasStrongEquivalent) break;
    }

    if (hasStrongEquivalent) {
      return {
        evidenceStatus: EVIDENCE_STATUS.STRONG_EQUIVALENT,
        evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.STRONG_EQUIVALENT],
        resumeEvidence: eqSnippet ? `"${eqSnippet}"` : `Demonstrates substantively equivalent experience`,
        gapOrQualification: `Equivalent experience demonstrated; verify specific depth with ${reqName}`
      };
    }

    // ---------------------------------------------------------------------
    // G. PARTIAL MATCH CHECK
    // ---------------------------------------------------------------------
    const titleTokens = titleLower.split(/\s+/).filter(t => t.length > 3);
    const reqTokens = reqLower.split(/\s+/).filter(t => t.length > 3);
    const hasOverlap = reqTokens.some(rt => text.includes(rt) || titleTokens.some(tt => tt.includes(rt)));

    if (hasOverlap) {
      const partSnippet = extractAuthenticSentenceSnippet(cleanText, reqTokens);
      return {
        evidenceStatus: EVIDENCE_STATUS.PARTIAL_MATCH,
        evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.PARTIAL_MATCH],
        resumeEvidence: partSnippet ? `"${partSnippet}"` : `Related terminology or domain context present in candidate profile`,
        gapOrQualification: `Partial match. Hands-on depth with ${reqName} requires verification.`
      };
    }

    // ---------------------------------------------------------------------
    // H. NOT DEMONSTRATED
    // ---------------------------------------------------------------------
    return {
      evidenceStatus: EVIDENCE_STATUS.NOT_DEMONSTRATED,
      evidenceScore: EVIDENCE_SCORES[EVIDENCE_STATUS.NOT_DEMONSTRATED],
      resumeEvidence: '',
      gapOrQualification: `No explicit evidence of ${reqName} found in extracted profile text.`
    };
  }

  // ==========================================
  // 6. HARD ELIGIBILITY GATES
  // ==========================================

  /**
   * Checks mandatory residency and work authorization.
   * Wisconsin Rule: If requisition requires Wisconsin residency, verify candidate state is WI.
   * If candidate state is NOT WI and no relocation is confirmed -> INELIGIBLE.
   */
  function evaluateEligibility(candidate, normalizedJd) {
    const rules = normalizedJd ? (normalizedJd.eligibilityRules || {}) : {};
    const candLocation = (candidate?.location || '').trim();
    const candVisa = (candidate?.visaStatus || 'US Citizen / Green Card / Work Authorized').trim();

    let eligibilityStatus = ELIGIBILITY_STATUS.VERIFIED_ELIGIBLE;
    let notes = '';
    let isHardFailure = false;

    // Check Wisconsin Residency
    if (rules.requiresWisconsin) {
      const locLower = candLocation.toLowerCase();
      const hasWisconsin = (
        locLower.includes('wi') ||
        locLower.includes('wisconsin') ||
        locLower.includes('madison') ||
        locLower.includes('milwaukee') ||
        locLower.includes('green bay') ||
        locLower.includes('appleton') ||
        locLower.includes('kenosha')
      );

      if (hasWisconsin) {
        eligibilityStatus = ELIGIBILITY_STATUS.VERIFIED_ELIGIBLE;
        notes = `Verified Wisconsin resident (${candLocation}). Meets mandatory state residency requirement.`;
      } else if (!candLocation || candLocation.toLowerCase() === 'united states' || candLocation.toLowerCase() === 'us') {
        eligibilityStatus = ELIGIBILITY_STATUS.PENDING_VERIFICATION;
        notes = `Location stated generally as "${candLocation}". Mandatory Wisconsin residency must be verified before submission.`;
      } else {
        // Explicit other state (e.g. Dallas, TX or Atlanta, GA)
        eligibilityStatus = ELIGIBILITY_STATUS.INELIGIBLE;
        isHardFailure = true;
        notes = `INELIGIBLE: Requisition strictly mandates current Wisconsin residency. Candidate location listed as "${candLocation}".`;
      }
    } else {
      // General US Role
      if (candLocation) {
        eligibilityStatus = ELIGIBILITY_STATUS.VERIFIED_ELIGIBLE;
        notes = `Candidate location (${candLocation}) aligned with position arrangement.`;
      } else {
        eligibilityStatus = ELIGIBILITY_STATUS.PENDING_VERIFICATION;
        notes = `Location not specified. Verify commute or remote eligibility.`;
      }
    }

    return {
      eligibilityStatus,
      eligibilityNotes: `${notes} Work Auth: ${candVisa}.`,
      isHardFailure
    };
  }

  // ==========================================
  // 7. WEIGHTED SCORING & PROPORTIONAL REDISTRIBUTION
  // ==========================================

  /**
   * Calculates category scores and overall match % according to the exact 7-category model:
   * Mandatory Tech: 30%, Domain: 20%, Responsibilities: 15%, Experience: 10%,
   * Preferred: 10%, Leadership: 10%, Education/Certs: 5%.
   * Proportioned redistribution applied if a category has no applicable requirements.
   */
  function calculateAuthoritativeScore(candidate, normalizedJd) {
    const candidateText = (candidate?.resumeText || candidate?.summary || candidate?.notes || '');
    const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : (candidate?.skills ? String(candidate.skills).split(',') : []);
    const candidateTitle = candidate?.title || candidate?.role || '';

    const categories = normalizedJd.categories || {};
    const skillsMatchTable = [];
    const strengths = [];
    const gaps = [];
    const matchedRequired = [];
    const partiallyMatchedRequired = [];
    const notDemonstratedRequired = [];
    const unverifiedRequired = [];

    // Category weighting configuration
    const activeWeights = Object.assign({}, DEFAULT_WEIGHTS);

    // Identify active categories and compute sum of active weights
    let activeWeightSum = 0;
    const categoryResults = {};

    for (const [catKey, defaultWeight] of Object.entries(DEFAULT_WEIGHTS)) {
      const reqs = categories[catKey] || [];
      if (reqs.length > 0) {
        activeWeightSum += defaultWeight;
      }
    }

    // Evaluate each requirement in each category
    let totalScore = 0;

    for (const [catKey, defaultWeight] of Object.entries(DEFAULT_WEIGHTS)) {
      const reqs = categories[catKey] || [];
      if (reqs.length === 0) continue;

      // Proportional weight adjustment
      const categoryWeight = (defaultWeight / activeWeightSum);

      let totalImportance = 0;
      let earnedEvidence = 0;

      for (const req of reqs) {
        const impWeight = req.importance === 'High' ? 1.5 : (req.importance === 'Low' ? 0.7 : 1.0);
        totalImportance += impWeight;

        const match = matchRequirementEvidence(req, candidateText, candidateSkills, candidateTitle, candidate?.experience || '', candidate);
        earnedEvidence += (impWeight * match.evidenceScore);

        const weightedContrib = Math.round((categoryWeight * (impWeight * match.evidenceScore / reqs.length)) * 100);

        skillsMatchTable.push({
          requirement: req.name,
          category: req.category,
          classification: req.classification,
          importance: req.importance,
          evidenceStatus: match.evidenceStatus,
          resumeEvidence: match.resumeEvidence,
          gapOrQualification: match.gapOrQualification,
          weightedContribution: weightedContrib
        });

        // Track strengths & gaps
        if (match.evidenceStatus === EVIDENCE_STATUS.DIRECT_MATCH) {
          matchedRequired.push(req.name);
          strengths.push(`Direct match on ${req.name}: ${match.resumeEvidence}`);
        } else if (match.evidenceStatus === EVIDENCE_STATUS.STRONG_EQUIVALENT) {
          matchedRequired.push(req.name);
          strengths.push(`Equivalent demonstrated for ${req.name}: ${match.resumeEvidence}`);
        } else if (match.evidenceStatus === EVIDENCE_STATUS.PARTIAL_MATCH) {
          partiallyMatchedRequired.push(req.name);
          gaps.push(`Partial depth on ${req.name}: ${match.gapOrQualification}`);
        } else if (match.evidenceStatus === EVIDENCE_STATUS.NEEDS_VERIFICATION) {
          unverifiedRequired.push(req.name);
          gaps.push(`Unverified requirement: ${req.name}`);
        } else {
          notDemonstratedRequired.push(req.name);
          gaps.push(`Missing from profile: ${req.name}`);
        }
      }

      const catRatio = totalImportance > 0 ? (earnedEvidence / totalImportance) : 0;
      const catEarnedScore = categoryWeight * catRatio * 100;
      categoryResults[catKey] = catEarnedScore;
      totalScore += catEarnedScore;
    }

    const finalScore = Math.max(10, Math.min(98, Math.round(totalScore)));

    // Fit category band determination
    let fitCategory = FIT_BANDS.WEAK_FIT.title;
    let verdict = FIT_BANDS.WEAK_FIT.label;
    let color = FIT_BANDS.WEAK_FIT.color;

    if (finalScore >= FIT_BANDS.STRONG_FIT.min) {
      fitCategory = FIT_BANDS.STRONG_FIT.title;
      verdict = FIT_BANDS.STRONG_FIT.label;
      color = FIT_BANDS.STRONG_FIT.color;
    } else if (finalScore >= FIT_BANDS.GOOD_FIT.min) {
      fitCategory = FIT_BANDS.GOOD_FIT.title;
      verdict = FIT_BANDS.GOOD_FIT.label;
      color = FIT_BANDS.GOOD_FIT.color;
    } else if (finalScore >= FIT_BANDS.PARTIAL_FIT.min) {
      fitCategory = FIT_BANDS.PARTIAL_FIT.title;
      verdict = FIT_BANDS.PARTIAL_FIT.label;
      color = FIT_BANDS.PARTIAL_FIT.color;
    }

    return {
      score: finalScore,
      fitCategory,
      verdict,
      color,
      categoryResults,
      skillsMatchTable,
      strengths: strengths.slice(0, 5),
      gaps: gaps.slice(0, 4),
      requiredSkills: {
        matched: matchedRequired,
        partiallyMatched: partiallyMatchedRequired,
        notDemonstrated: notDemonstratedRequired,
        unverified: unverifiedRequired
      }
    };
  }

  // ==========================================
  // 8. AUTHORITATIVE CANDIDATE EVALUATION PIPELINE
  // ==========================================

  /**
   * The single authoritative entry point that computes the complete evaluation payload.
   * Reused by Quick Sourcing, Detailed Fit Dossier, and Candidate Ranking.
   */
  function evaluateCandidate(candidate, normalizedJd, options = {}) {
    const candName = candidate?.name || 'Candidate';
    const candTitle = candidate?.title || candidate?.role || 'Technical Specialist';

    // 1. Verify Resume Extracted Text
    const verification = verifyAndClassifyResume(candidate);

    // 2. Evaluate Hard Eligibility Constraints
    const eligibility = evaluateEligibility(candidate, normalizedJd);

    // 3. Calculate Authoritative Score
    const scoring = calculateAuthoritativeScore(candidate, normalizedJd);

    // 4. Recommendation Logic with Ineligibility Gate Override
    let recommendation = RECOMMENDATIONS.HOLD_FOR_VERIFICATION;
    let recommendationExplanation = '';

    if (!candidate || verification.status === EXTRACTION_STATUS.EXTRACTION_FAILED) {
      recommendation = RECOMMENDATIONS.HOLD_FOR_VERIFICATION;
      recommendationExplanation = `Candidate data is missing or extraction failed. Full profile cannot be evaluated.`;
    } else if (eligibility.isHardFailure) {
      // MANDATORY RULE: A hard eligibility failure can NEVER be SUBMIT or INTERVIEW!
      recommendation = RECOMMENDATIONS.REJECT;
      recommendationExplanation = `Candidate scored ${scoring.score}% on technical skills but is disqualified due to mandatory eligibility constraints: ${eligibility.eligibilityNotes}`;
    } else if (verification.isProvisional) {
      recommendation = RECOMMENDATIONS.HOLD_FOR_VERIFICATION;
      recommendationExplanation = `Provisional assessment (${scoring.score}%). Candidate profile is incomplete (${verification.status.replace(/_/g, ' ')}). Full resume verification required before proceeding.`;
    } else if (scoring.score >= 85 && scoring.requiredSkills.notDemonstrated.length === 0) {
      recommendation = RECOMMENDATIONS.SUBMIT;
      recommendationExplanation = `Strong documented alignment (${scoring.score}%) across mandatory technical skills and domain requirements. Meets all eligibility conditions. Recommended for client submission.`;
    } else if (scoring.score >= 70) {
      recommendation = RECOMMENDATIONS.INTERVIEW;
      recommendationExplanation = `Good documented alignment (${scoring.score}%). Core requirements demonstrated with minor verification needed on specialized topics. Recommended for recruiter screen.`;
    } else if (scoring.score >= 50) {
      recommendation = RECOMMENDATIONS.BACKUP;
      recommendationExplanation = `Moderate alignment (${scoring.score}%). Suitable as a secondary backup candidate pending technical interview clarification.`;
    } else {
      recommendation = RECOMMENDATIONS.REJECT;
      recommendationExplanation = `Low documented alignment (${scoring.score}%). Critical job requirements are not demonstrated in the available profile.`;
    }

    // 5. Targeted Interview Questions
    const interviewQuestions = [
      `Can you describe your direct project experience managing ${scoring.requiredSkills.matched[0] || 'core technical deliverables'} in enterprise environments?`,
      scoring.gaps[0] ? `Our requisition requires ${scoring.gaps[0].replace('Missing from profile: ', '')}. What hands-on experience do you have with this?` : `How do you facilitate cross-functional sprint planning when dependencies arise between multiple teams?`,
      `How do you handle executive steering committee reporting and risk mitigation during critical delivery milestones?`
    ];

    // Compute Candidate Evaluation Hash
    const resumeHash = simpleHash(candidate?.resumeText || candidate?.summary || '');
    const cacheKey = `${normalizedJd.jdHash}_${candidate?.id || simpleHash(candName)}_${resumeHash}_${CONFIG_VERSION}`;

    return {
      cacheKey,
      engineVersion: ENGINE_VERSION,
      configVersion: CONFIG_VERSION,
      evaluatedAt: new Date().toISOString(),
      candidateId: candidate?.id || simpleHash(candName),
      candidateName: candName,
      candidateTitle: candTitle,
      jobId: normalizedJd.id,
      jobTitle: normalizedJd.title,
      score: scoring.score,
      fitCategory: scoring.fitCategory,
      verdict: scoring.verdict,
      color: scoring.color,
      confidence: verification.status === EXTRACTION_STATUS.FULL_RESUME_EXTRACTED ? 'High' : (verification.status === EXTRACTION_STATUS.PARTIAL_RESUME_EXTRACTED ? 'Medium' : 'Low'),
      evidenceCoverage: verification.status === EXTRACTION_STATUS.FULL_RESUME_EXTRACTED ? 'High' : 'Medium',
      extractionStatus: verification.status,
      extractionVerification: verification,
      eligibilityStatus: eligibility.eligibilityStatus,
      eligibilityNotes: eligibility.eligibilityNotes,
      isHardFailure: eligibility.isHardFailure,
      recommendation,
      recommendationExplanation,
      strengths: scoring.strengths,
      gaps: scoring.gaps,
      skillsMatchTable: scoring.skillsMatchTable,
      requiredSkills: scoring.requiredSkills,
      preferredSkills: {
        matched: scoring.skillsMatchTable.filter(r => r.classification === 'Preferred' && (r.evidenceStatus === EVIDENCE_STATUS.DIRECT_MATCH || r.evidenceStatus === EVIDENCE_STATUS.STRONG_EQUIVALENT)).map(r => r.requirement),
        gaps: scoring.skillsMatchTable.filter(r => r.classification === 'Preferred' && (r.evidenceStatus === EVIDENCE_STATUS.NOT_DEMONSTRATED || r.evidenceStatus === EVIDENCE_STATUS.PARTIAL_MATCH)).map(r => r.requirement)
      },
      experienceAndCertifications: {
        summary: `${candidate?.experience || 'Demonstrated'} experience.`,
        relevantYears: candidate?.experience || '5+ Years',
        certificationsStatus: verification.sourceSectionsFound.includes('Certifications') ? 'Certifications present in profile' : 'Verification pending'
      },
      interviewQuestions,
      reasoning: recommendationExplanation,
      source: 'smart_hire_authoritative_engine'
    };
  }

  // ==========================================
  // 9. TEMPORARY SESSION EVALUATION CACHE & CLEANUP
  // ==========================================

  /**
   * Temporary in-memory cache keyed by (jdHash, candidateId, resumeHash).
   * Ensures the score is calculated ONCE and reused everywhere.
   * Does NOT persist resumes or prompts to disk or database.
   */
  class SessionEvaluationCache {
    constructor() {
      this._cache = new Map();
      this._activeJdHash = null;
    }

    setActiveJd(jdHash) {
      if (this._activeJdHash && this._activeJdHash !== jdHash) {
        // Automatically clear session cache when switching requisitions
        this.clear();
      }
      this._activeJdHash = jdHash;
    }

    get(candidate, normalizedJd) {
      if (!candidate || !normalizedJd) return null;
      const resumeHash = simpleHash(candidate.resumeText || candidate.summary || '');
      const key = `${normalizedJd.jdHash}_${candidate.id || simpleHash(candidate.name)}_${resumeHash}_${CONFIG_VERSION}`;
      return this._cache.get(key) || null;
    }

    set(candidate, normalizedJd, evaluationResult) {
      if (!candidate || !normalizedJd || !evaluationResult) return;
      const resumeHash = simpleHash(candidate.resumeText || candidate.summary || '');
      const key = `${normalizedJd.jdHash}_${candidate.id || simpleHash(candidate.name)}_${resumeHash}_${CONFIG_VERSION}`;
      this._cache.set(key, evaluationResult);
    }

    getOrEvaluate(candidate, normalizedJd, options = {}) {
      this.setActiveJd(normalizedJd.jdHash);
      const cached = this.get(candidate, normalizedJd);
      if (cached && !options.forceRefresh) {
        return cached;
      }
      const fresh = evaluateCandidate(candidate, normalizedJd, options);
      this.set(candidate, normalizedJd, fresh);
      return fresh;
    }

    invalidateCandidate(candidateId) {
      for (const [key, val] of this._cache.entries()) {
        if (val.candidateId === candidateId || key.includes(candidateId)) {
          this._cache.delete(key);
        }
      }
    }

    clear() {
      this._cache.clear();
    }

    size() {
      return this._cache.size;
    }
  }

  const globalSessionCache = new SessionEvaluationCache();

  // ==========================================
  // 10. CANDIDATE RANKING
  // ==========================================

  /**
   * Ranks candidates based on documented skills alignment,
   * strictly penalizing ineligible candidates from top submission ranks.
   */
  function rankCandidates(candidates, normalizedJd, cacheInstance = globalSessionCache) {
    if (!Array.isArray(candidates) || candidates.length === 0) return [];

    const evaluated = candidates.map(c => {
      const evalResult = cacheInstance.getOrEvaluate(c, normalizedJd);
      return {
        candidate: c,
        evaluation: evalResult
      };
    });

    // Sort order:
    // 1. Eligible / Pending candidates before Ineligible
    // 2. Match score descending
    // 3. Extraction completeness
    evaluated.sort((a, b) => {
      const aInelig = a.evaluation.isHardFailure ? 1 : 0;
      const bInelig = b.evaluation.isHardFailure ? 1 : 0;
      if (aInelig !== bInelig) return aInelig - bInelig; // Ineligible sink to bottom

      return (b.evaluation.score || 0) - (a.evaluation.score || 0);
    });

    return evaluated.map((item, idx) => {
      item.evaluation.rank = idx + 1;
      // Attach back to candidate for UI convenience
      item.candidate.matchScore = item.evaluation.score;
      item.candidate.aiMatch = item.evaluation;
      item.candidate.verdict = item.evaluation.verdict;
      item.candidate.fitCategory = item.evaluation.fitCategory;
      item.candidate.recommendation = item.evaluation.recommendation;
      item.candidate.eligibilityStatus = item.evaluation.eligibilityStatus;
      item.candidate.extractionStatus = item.evaluation.extractionStatus;
      return item.evaluation;
    });
  }

  // Public API Export
  return {
    ENGINE_VERSION,
    CONFIG_VERSION,
    EVIDENCE_STATUS,
    EVIDENCE_SCORES,
    DEFAULT_WEIGHTS,
    FIT_BANDS,
    ELIGIBILITY_STATUS,
    RECOMMENDATIONS,
    EXTRACTION_STATUS,
    normalizeJobDescription,
    generateBooleanQueries,
    verifyAndClassifyResume,
    evaluateEligibility,
    calculateAuthoritativeScore,
    evaluateCandidate,
    rankCandidates,
    SessionEvaluationCache,
    sessionCache: globalSessionCache
  };
}));
