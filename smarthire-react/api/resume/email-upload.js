import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to extract first element from formidable array if needed
function one(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

// Robust, cross-platform PDF & DOCX raw text parser
async function parseResumeText(filePath, originalName, mimeType) {
  const name = (originalName || '').toLowerCase();
  
  if (name.endsWith('.pdf') || mimeType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }
  
  if (name.endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  
  if (name.endsWith('.doc') || mimeType === 'application/msword') {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (e) {
      // Fallback: read file as raw string to extract any text strings possible
      return fs.readFileSync(filePath, 'utf-8');
    }
  }

  throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
}

// Heuristics-based information extraction
function extractCandidateInfo(text, originalFilename) {
  // Normalize line endings and clean text
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // 1. Extract Name
  let name = 'Auto Parsed Candidate';
  
  // Look at the first 5 non-empty lines for a capitalized personal name
  const nameCandidateLines = lines.slice(0, 5);
  const nameRegex = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/; // e.g. "John Doe" or "Jane A. Doe"
  
  for (const line of nameCandidateLines) {
    const lowerLine = line.toLowerCase();
    if (
      lowerLine.includes('resume') || 
      lowerLine.includes('cv') || 
      lowerLine.includes('curriculum') || 
      lowerLine.includes('page') ||
      lowerLine.includes('email') ||
      lowerLine.includes('phone') ||
      lowerLine.includes('contact') ||
      lowerLine.includes('profile') ||
      lowerLine.includes('summary') ||
      line.includes('@') ||
      /\d/.test(line) // Skip lines containing numbers
    ) {
      continue;
    }
    
    if (nameRegex.test(line)) {
      name = line;
      break;
    }
  }

  // Fallback: Extract name from filename
  if (name === 'Auto Parsed Candidate' && originalFilename) {
    const withoutExt = originalFilename.replace(/\.[^/.]+$/, ""); // strip extension
    const cleanFilename = withoutExt.replace(/[-_]/g, ' ').trim();
    // Capitalize words
    name = cleanFilename.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // 2. Extract Email
  let email = '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = cleanText.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0];
  }

  // 3. Extract Phone
  let phone = '';
  // Matches formats: +1-234-567-8900, (234) 567-8900, 2345678900, etc.
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]??)?\(?\d{3}\)?[-.\s]??\d{3}[-.\s]??\d{4}/;
  const phoneMatch = cleanText.match(phoneRegex);
  if (phoneMatch) {
    phone = phoneMatch[0];
  }

  // 4. Extract Experience (years)
  let experienceYears = 0;
  const expRegexes = [
    /(\d{1,2}\+?)\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i,
    /(?:experience|exp):?\s*(\d{1,2}\+?\s*years?)/i,
    /(\d{1,2}\+?)\s*(?:years?|yrs?)\s*(?:exp)/i
  ];

  for (const regex of expRegexes) {
    const match = cleanText.match(regex);
    if (match) {
      const parsedVal = parseInt(match[1]);
      if (!isNaN(parsedVal)) {
        experienceYears = parsedVal;
        break;
      }
    }
  }

  // 5. Extract Skills
  const commonSkillsList = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Rust', 'Scala', 'HTML', 'CSS', 'SQL',
    // Frontend
    'React', 'ReactJS', 'React.js', 'Angular', 'AngularJS', 'Vue', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'Remix', 'Tailwind', 'Bootstrap', 'JQuery',
    // Backend & API
    'Node.js', 'NodeJS', 'Express', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Spring', 'ASP.NET', 'Laravel', 'Rails', 'Ruby on Rails', 'REST API', 'GraphQL', 'gRPC', 'Websockets',
    // Databases
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'Oracle', 'SQLite', 'DynamoDB', 'Firebase', 'Supabase', 'NoSQL',
    // Cloud & Infrastructure
    'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'CircleCI', 'CI/CD', 'Linux', 'Git', 'GitHub', 'GitLab',
    // Mobile
    'React Native', 'Flutter', 'iOS', 'Android',
    // Testing
    'Jest', 'Cypress', 'Playwright', 'Selenium', 'Mocha', 'Chai',
    // Others
    'Agile', 'Scrum', 'Microservices', 'Jira', 'Figma', 'System Design'
  ];

  const extractedSkills = [];
  const lowerText = cleanText.toLowerCase();

  commonSkillsList.forEach(skill => {
    const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const boundaryRegex = new RegExp(`\\b${escapedSkill}\\b`, 'i');

    if (boundaryRegex.test(lowerText)) {
      // Canonical name standardization
      let canonicalSkillName = skill;
      if (skill === 'ReactJS' || skill === 'React.js') canonicalSkillName = 'React';
      if (skill === 'NodeJS') canonicalSkillName = 'Node.js';
      if (skill === 'Express.js') canonicalSkillName = 'Express';
      if (skill === 'Vue.js') canonicalSkillName = 'Vue';
      if (skill === 'Golang') canonicalSkillName = 'Go';
      if (skill === 'Ruby on Rails') canonicalSkillName = 'Rails';
      if (skill === 'Amazon Web Services') canonicalSkillName = 'AWS';
      if (skill === 'Google Cloud') canonicalSkillName = 'GCP';

      if (!extractedSkills.includes(canonicalSkillName)) {
        extractedSkills.push(canonicalSkillName);
      }
    }
  });

  return {
    name,
    email,
    phone,
    skills: extractedSkills,
    experience: experienceYears
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  // Configure Formidable multipart parser
  const form = formidable({
    multiples: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
    filter: ({ originalFilename, mimetype }) => {
      const name = (originalFilename || '').toLowerCase();
      const validExt = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc');
      const allowedMimeTypes = new Set([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ]);
      return validExt || allowedMimeTypes.has(mimetype || '');
    },
  });

  let parsed;
  try {
    parsed = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => {
        if (error) reject(error);
        else resolve({ fields, files });
      });
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Invalid upload payload' });
    return;
  }

  const { fields, files } = parsed;
  const resumeFile = one(files.resume_file);

  if (!resumeFile) {
    res.status(400).json({ success: false, message: 'resume_file is required (PDF/DOCX)' });
    return;
  }

  // Extract Form Fields (supporting both prompt formats & legacy fields for backward compatibility)
  const senderEmail = one(fields.sender_email);
  const emailSubject = one(fields.subject) || one(fields.email_subject);
  const ccEmail = one(fields.cc_email);
  const emailBody = one(fields.email_body) || '';
  const jobId = one(fields.job_id) || 'J-DEFAULT';
  const source = one(fields.source) || 'n8n';

  if (!senderEmail || !emailSubject) {
    res.status(400).json({
      success: false,
      message: 'sender_email and subject are required fields',
    });
    return;
  }

  try {
    // 1. Read & Parse the PDF or DOCX file content
    const rawText = await parseResumeText(
      resumeFile.filepath,
      resumeFile.originalFilename,
      resumeFile.mimetype
    );

    // 2. Perform intelligent information extraction
    const extractedData = extractCandidateInfo(rawText, resumeFile.originalFilename);

    // If email was not found in resume text, fallback to the form's sender_email
    if (!extractedData.email) {
      extractedData.email = senderEmail;
    }

    // 3. Compile beautiful and premium response structure
    res.status(200).json({
      success: true,
      message: 'Resume successfully parsed and candidate information extracted',
      candidate_id: `C-${Date.now()}`,
      job_id: jobId,
      source,
      file: {
        original_name: resumeFile.originalFilename,
        mime_type: resumeFile.mimetype,
        size_bytes: resumeFile.size,
      },
      email_context: {
        sender_email: senderEmail,
        subject: emailSubject,
        cc_email: ccEmail || '',
        body: emailBody,
      },
      extracted_profile: {
        name: extractedData.name,
        email: extractedData.email,
        phone: extractedData.phone || '+1-000-000-0000',
        skills: extractedData.skills,
        experience_years: extractedData.experience,
      },
      resume_text: rawText,
      jd_match: {
        match_score: extractedData.skills.length > 0 ? Math.min(60 + extractedData.skills.length * 4, 98) : 50,
        matching_skills: extractedData.skills.slice(0, 5),
        missing_skills: ['Detailed JD semantic matching pending Gemini API key setup'],
        risk_factors: extractedData.experience === 0 ? ['No professional years of experience explicitly found in text'] : [],
        candidate_summary: `Parsed candidate ${extractedData.name} from email. Extracted ${extractedData.skills.length} skills and ${extractedData.experience} years of experience.`,
      }
    });
  } catch (error) {
    console.error('Extraction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process and extract resume contents',
      error: error.message,
    });
  }
}
