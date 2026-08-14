const GROQ_STORAGE_KEY = "ats_groq_api_key";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODELS = ["llama-3.3-70b-versatile", "gpt-oss-20b", "llama3-8b-8192", "gemma2-9b-it"];

function cleanKey(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^['"`]+|['"`]+$/g, "");
}

export function getGroqApiKey() {
  const envKey = cleanKey(import.meta.env.VITE_GROQ_API_KEY);
  if (envKey) return envKey;
  if (typeof window === "undefined") return "";
  try {
    return cleanKey(localStorage.getItem(GROQ_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function isGroqApiConfigured() {
  return getGroqApiKey().length > 0;
}

export function saveGroqApiKey(key) {
  if (typeof window === "undefined") return;
  const cleaned = cleanKey(key);
  try {
    if (cleaned) localStorage.setItem(GROQ_STORAGE_KEY, cleaned);
    else localStorage.removeItem(GROQ_STORAGE_KEY);
  } catch {}
}

export function clearGroqApiKey() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GROQ_STORAGE_KEY);
  } catch {}
}

async function callAI(prompt, maxTokens = 1024) {
  const groqApiKey = getGroqApiKey();
  if (!groqApiKey) {
    throw new Error("⚠️ GROQ_API_KEY not configured!\n\nSetup:\n1. Get key from https://console.groq.com\n2. Add VITE_GROQ_API_KEY to .env\n3. Restart dev server");
  }
  let lastError = "";
  for (const model of MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are an expert technical recruiter AI. Always respond in valid JSON only. No markdown, no code blocks, no extra text." },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: maxTokens,
        }),
      });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
        lastError = `${model}: Empty response`;
        continue;
      }
      const status = response.status;
      let errBody = "";
      try { errBody = await response.text(); } catch {}
      if (status === 401 || status === 403) throw new Error("Groq API Key invalid hai!\n\nFix:\n1. https://console.groq.com jao\n2. Naya API key banao\n3. Code mein update karo");
      if (status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        lastError = `${model}: Rate limited`;
        continue;
      }
      if (status === 400 || status === 404) { lastError = `${model}: Not available (${status})`; continue; }
      lastError = `${model}: HTTP ${status} - ${errBody.substring(0, 200)}`;
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("API Key") || err.message.includes("Rate limit")) throw err;
        if (err.name === "AbortError") { lastError = `${model}: Timeout (30s)`; continue; }
        lastError = `${model}: ${err.message}`;
      } else {
        lastError = `${model}: Unknown error`;
      }
      continue;
    }
  }
  throw new Error(`AI connect nahi ho raha!\n\nLast error: ${lastError}\n\nFixes:\n1. API key check karo - https://console.groq.com\n2. Internet check karo\n3. 1 min baad try karo`);
}

export async function aiMatchCandidate(candidateName, candidateTitle, candidateSkills, resumeText, jdText) {
  const prompt = `Analyze how well this candidate matches the job description.

JOB DESCRIPTION:
${jdText.substring(0, 2000)}

CANDIDATE:
Name: ${candidateName}
Title: ${candidateTitle}
Skills: ${candidateSkills}
Resume: ${resumeText.substring(0, 1500)}

Respond ONLY in JSON:
{"score": 75, "reasoning": "2 sentence explanation", "strengths": ["strength1", "strength2"], "gaps": ["gap1", "gap2"], "recommendation": "STRONG MATCH"}

recommendation must be: STRONG MATCH, GOOD MATCH, PARTIAL MATCH, WEAK MATCH, or NOT A FIT.
Be strict: wrong role type = low score under 30. Focus on title match (30%), required skills (40%), experience (20%), domain (10%).`;
  const response = await callAI(prompt);
  try {
    const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      reasoning: parsed.reasoning || "No reasoning provided",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
      recommendation: parsed.recommendation || "N/A",
    };
  } catch {
    const scoreMatch = response.match(/"score"\s*:\s*(\d+)/);
    return {
      score: scoreMatch ? Number(scoreMatch[1]) : 0,
      reasoning: response.substring(0, 300),
      strengths: [],
      gaps: [],
      recommendation: "Parse Error",
    };
  }
}

export async function aiRankCandidates(candidates, jdText) {
  const candidateList = candidates.slice(0, 15).map((c, i) => `${i + 1}. ${c.name} | Title: ${c.title || "N/A"} | Skills: ${c.skills || "N/A"} | Exp: ${c.experience || "N/A"}`).join("\n");
  const prompt = `Rank these candidates against the Job Description.

JOB DESCRIPTION:
${jdText.substring(0, 1500)}

CANDIDATES:
${candidateList}

Respond ONLY in JSON:
{"rankings": [{"name": "candidate name", "score": 85, "reason": "1 sentence"}], "summary": "2 sentence summary"}

Rules: Rank highest to lowest. Wrong role = under 30. Focus on skills match. Include ALL candidates.`;
  const response = await callAI(prompt);
  try {
    const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    return {
      rankings: Array.isArray(parsed.rankings) ? parsed.rankings.map((r) => ({ name: r.name || "Unknown", score: Math.min(100, Math.max(0, Number(r.score) || 0)), reason: r.reason || "" })) : [],
      summary: parsed.summary || "No summary available",
    };
  } catch {
    return { rankings: [], summary: "Failed to parse AI response. Please try again." };
  }
}

export async function aiDraftEmail(candidateName, candidateEmail, candidateTitle, jdTitle, emailType, companyName, recruiterName, jdFullText) {
  const company = companyName || "[Company Name]";
  const recruiter = recruiterName || "[Your Name]";
  let typeText = "";
  if (emailType === "shortlist") {
    typeText = `Write a PROFESSIONAL OUTREACH email to the candidate.

CRITICAL RULES - FOLLOW STRICTLY:
1. DO NOT mention interview, scheduling, or next round
2. DO NOT say "you are shortlisted" or "congratulations"
3. DO NOT invite them for any interview or call
4. Instead, tell them that based on their profile and experience, their skills align well with this ${jdTitle || "role"}
5. Clearly ask: "Please let me know if you are interested in exploring this opportunity" or "Would you be open to discussing this role?"
6. Mention 1-2 specific things from their profile that match the role (makes it personal)
7. Keep tone warm, professional, and conversational - like a real recruiter reaching out
8. Sign off with recruiter name and company

The email should feel like: "Hey, I found your profile, it matches our requirement, are you interested?"

DO NOT include the job description in the JSON body - I will append it separately.`;
  } else {
    typeText = `Write a polite REJECTION email. Thank them for their time and interest. Be respectful and encourage them to apply for future openings. Keep it short (5-6 lines max).`;
  }
  const prompt = `Draft a recruiter email.

Candidate Name: ${candidateName}
Candidate Email: ${candidateEmail}
Candidate Current Title: ${candidateTitle || "Professional"}
Role/Position: ${jdTitle || "Open Position"}
Company: ${company}
Recruiter Name: ${recruiter}

${typeText}

Respond ONLY in JSON format:
{"subject": "email subject line", "body": "email body text with newlines as \\n"}

Use actual values provided - do not use placeholder brackets like [Name]. Keep main email under 120 words. Professional human tone.`;
  const response = await callAI(prompt, 1500);
  try {
    const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    let emailBody = parsed.body || "Email generation failed. Please try again.";
    if (emailType === "shortlist" && jdFullText) {
      emailBody = emailBody.replace(/\n*---\s*Job Description\s*---[\s\S]*/gi, "");
      emailBody = emailBody.replace(/\n*Please find the job description[\s\S]*/gi, "");
      emailBody = emailBody.replace(/\n*Below is the job description[\s\S]*/gi, "");
      emailBody += `\n\n────────────────────────────────\n📋 Job Description - ${jdTitle || "Open Position"}\n────────────────────────────────\n\n${jdFullText.trim()}`;
    }
    return { subject: parsed.subject || `${jdTitle || "Job"} Opportunity at ${company}`, body: emailBody };
  } catch {
    let fallbackBody = `Hi ${candidateName},\n\nI came across your profile and I believe your experience as ${candidateTitle || "a professional"} aligns well with our ${jdTitle || "open"} role at ${company}.\n\nPlease let me know if you would be interested in exploring this opportunity.\n\nBest regards,\n${recruiter}\n${company}`;
    if (emailType === "shortlist" && jdFullText) {
      fallbackBody += `\n\n────────────────────────────────\n📋 Job Description - ${jdTitle || "Open Position"}\n────────────────────────────────\n\n${jdFullText.trim()}`;
    }
    return { subject: `${jdTitle || "Job"} Opportunity at ${company}`, body: fallbackBody };
  }
}
