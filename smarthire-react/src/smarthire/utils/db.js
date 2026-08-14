import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";

const DB_KEY = "ats_candidates_meta";
const LEGACY_DB_KEY = "ats_candidates";

function toMeta(c) {
  return {
    id: c.id, name: c.name, title: c.title, email: c.email, phone: c.phone,
    skills: c.skills, experience: c.experience, location: c.location,
    matchScore: c.matchScore, matchedSkills: c.matchedSkills, missingSkills: c.missingSkills,
    matchedPreferred: c.matchedPreferred, missingPreferred: c.missingPreferred,
    aiScore: c.aiScore, aiReasoning: c.aiReasoning, aiStrengths: c.aiStrengths,
    aiGaps: c.aiGaps, aiRecommendation: c.aiRecommendation,
  };
}

function metaToCandidate(m, content = "") {
  return { ...m, content };
}

function getLocalMeta() {
  const data = localStorage.getItem(DB_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}

function dedupeById(metas) {
  const seen = new Set();
  const deduped = [];
  for (let i = metas.length - 1; i >= 0; i--) {
    const item = metas[i];
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }
  return deduped.reverse();
}

try { localStorage.removeItem(LEGACY_DB_KEY); } catch {}

function saveLocalMeta(metas) {
  const deduped = dedupeById(metas);
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(deduped));
  } catch (e) {
    console.warn("[Local] Storage full, clearing old data...", e);
    try {
      const trimmed = deduped.slice(-100);
      localStorage.setItem(DB_KEY, JSON.stringify(trimmed));
    } catch {
      console.error("[Local] Cannot save even trimmed data");
    }
  }
}

function getLocalContent(id) {
  try { return localStorage.getItem(`ats_content_${id}`) || ""; } catch { return ""; }
}

function saveLocalContent(id, content) {
  if (!content) return;
  try { localStorage.setItem(`ats_content_${id}`, content); } catch (e) { console.warn(`[Local] Content storage full for ${id}`, e); }
}

function deleteLocalContent(id) {
  try { localStorage.removeItem(`ats_content_${id}`); } catch {}
}

export function getAllCandidates() {
  const metas = getLocalMeta();
  return metas.map((m) => metaToCandidate(m, getLocalContent(m.id)));
}

export async function saveCandidateAsync(candidate) {
  if (candidate.content) saveLocalContent(candidate.id, candidate.content);
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient();
    const row = toRow(candidate);
    const { error } = await sb.from("candidates").upsert([row], { onConflict: "id" });
    if (error) {
      console.error("[Cloud] Save error:", error.message);
      saveLocalOnly(candidate);
      return { success: false, error: error.message };
    }
  }
  const metas = getLocalMeta();
  metas.push(toMeta(candidate));
  saveLocalMeta(metas);
  return { success: true };
}

export function saveCandidate(candidate) {
  if (candidate.content) saveLocalContent(candidate.id, candidate.content);
  const metas = getLocalMeta();
  metas.push(toMeta(candidate));
  saveLocalMeta(metas);
  cloudUpsert([candidate]);
}

function saveLocalOnly(candidate) {
  if (candidate.content) saveLocalContent(candidate.id, candidate.content);
  const metas = getLocalMeta();
  metas.push(toMeta(candidate));
  saveLocalMeta(metas);
}

export function saveAllCandidates(candidates) {
  candidates.forEach((c) => { if (c.content) saveLocalContent(c.id, c.content); });
  const metas = candidates.map(toMeta);
  saveLocalMeta(metas);
  cloudUpsert(candidates);
}

export function deleteCandidate(id) {
  const metas = getLocalMeta().filter((m) => m.id !== id);
  saveLocalMeta(metas);
  deleteLocalContent(id);
  cloudDelete(id);
}

export function clearAllCandidates() {
  const metas = getLocalMeta();
  metas.forEach((m) => deleteLocalContent(m.id));
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(LEGACY_DB_KEY);
  cloudClearAll();
}

export async function loadCandidateContent(id, fallback) {
  const localContent = getLocalContent(id);
  if (localContent) return localContent;
  if (!isSupabaseConfigured()) return "";
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb.from("candidates").select("content").eq("id", id).order("created_at", { ascending: false }).limit(1);
    if (error) { console.error("[Cloud] Content load error:", error.message); return ""; }
    const directContent = ((data?.[0]?.content) || "").trim();
    if (directContent) return directContent;
    const fallbackEmail = fallback?.email?.trim();
    if (fallbackEmail) {
      const { data: emailMatch, error: emailError } = await sb.from("candidates").select("content").eq("email", fallbackEmail).not("content", "is", null).neq("content", "").order("created_at", { ascending: false }).limit(1);
      if (!emailError) { const emailContent = ((emailMatch?.[0]?.content) || "").trim(); if (emailContent) return emailContent; }
    }
    const fallbackName = fallback?.name?.trim();
    if (fallbackName) {
      const { data: nameMatch, error: nameError } = await sb.from("candidates").select("content").eq("name", fallbackName).not("content", "is", null).neq("content", "").order("created_at", { ascending: false }).limit(1);
      if (!nameError) { const nameContent = ((nameMatch?.[0]?.content) || "").trim(); if (nameContent) return nameContent; }
    }
    return "";
  } catch {
    return "";
  }
}

export async function saveBulkCandidates(candidates, onProgress) {
  let success = 0, failed = 0, errors = [];
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient();
    const chunkSize = 25;
    const rows = candidates.map(toRow);
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const chunkCandidates = candidates.slice(i, i + chunkSize);
      try {
        const { error } = await sb.from("candidates").upsert(chunk, { onConflict: "id" });
        if (error) {
          console.error(`[Cloud] Chunk ${i / chunkSize + 1} error:`, error.message);
          errors.push(`Batch ${i / chunkSize + 1}: ${error.message}`);
          failed += chunk.length;
          chunkCandidates.forEach((c) => {
            if (c.content) saveLocalContent(c.id, c.content);
            const metas = getLocalMeta();
            metas.push(toMeta(c));
            saveLocalMeta(metas);
          });
        } else {
          success += chunk.length;
          const metas = getLocalMeta();
          chunkCandidates.forEach((c) => {
            if (c.content) saveLocalContent(c.id, c.content);
            metas.push(toMeta(c));
          });
          saveLocalMeta(metas);
        }
      } catch (err) {
        console.error(`[Cloud] Chunk error:`, err);
        errors.push(`Batch ${i / chunkSize + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
        failed += chunk.length;
      }
      onProgress?.(success + failed, candidates.length, failed);
      if (i + chunkSize < rows.length) await new Promise((r) => setTimeout(r, 200));
    }
  } else {
    candidates.forEach((c) => {
      try { saveLocalOnly(c); success++; } catch { failed++; errors.push(`${c.name}: Local storage full`); }
      onProgress?.(success + failed, candidates.length, failed);
    });
  }
  return { success, failed, errors };
}

function toRow(c) {
  const row = {
    id: c.id, name: c.name || "", title: c.title || "", email: c.email || "", phone: c.phone || "",
    skills: c.skills || "", experience: c.experience || "", location: c.location || "",
    match_score: c.matchScore ?? null, matched_skills: c.matchedSkills ?? null, missing_skills: c.missingSkills ?? null,
    matched_preferred: c.matchedPreferred ?? null, missing_preferred: c.missingPreferred ?? null,
    ai_score: c.aiScore ?? null, ai_reasoning: c.aiReasoning ?? null, ai_strengths: c.aiStrengths ?? null,
    ai_gaps: c.aiGaps ?? null, ai_recommendation: c.aiRecommendation ?? null,
  };
  if (c.content && c.content.trim()) row.content = c.content;
  return row;
}

function fromRow(row) {
  return {
    id: row.id || "", name: row.name || "", title: row.title || "", email: row.email || "",
    phone: row.phone || "", skills: row.skills || "", experience: row.experience || "",
    location: row.location || "", content: row.content || "",
    matchScore: row.match_score ?? undefined, matchedSkills: row.matched_skills ?? undefined,
    missingSkills: row.missing_skills ?? undefined, matchedPreferred: row.matched_preferred ?? undefined,
    missingPreferred: row.missing_preferred ?? undefined, aiScore: row.ai_score ?? undefined,
    aiReasoning: row.ai_reasoning ?? undefined, aiStrengths: row.ai_strengths ?? undefined,
    aiGaps: row.ai_gaps ?? undefined, aiRecommendation: row.ai_recommendation ?? undefined,
  };
}

function cloudUpsert(candidates) {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  const rows = candidates.map(toRow);
  const chunkSize = 25;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    sb.from("candidates").upsert(chunk, { onConflict: "id" }).then(({ error }) => {
      if (error) console.error("[Cloud] Upsert error:", error.message);
    });
  }
}

function cloudDelete(id) {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  sb.from("candidates").delete().eq("id", id).then(({ error }) => {
    if (error) console.error("[Cloud] Delete error:", error.message);
  });
}

function cloudClearAll() {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseClient();
  if (!sb) return;
  sb.from("candidates").delete().neq("id", "").then(({ error }) => {
    if (error) console.error("[Cloud] Clear error:", error.message);
  });
}

export async function loadFromCloud() {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    let allData = [];
    let page = 0;
    const pageSize = 500;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await sb.from("candidates").select("*").order("created_at", { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) { console.error("[Cloud] Fetch error:", error.message); break; }
      if (data && data.length > 0) { allData = [...allData, ...data]; page++; hasMore = data.length === pageSize; } else { hasMore = false; }
    }
    const cloudCandidates = allData.map(fromRow);
    const metas = cloudCandidates.map(toMeta);
    const localMetas = getLocalMeta();
    const mergedMetas = dedupeById([...localMetas, ...metas]);
    saveLocalMeta(mergedMetas);
    cloudCandidates.forEach((c) => { if (c.content) saveLocalContent(c.id, c.content); });
    return cloudCandidates;
  } catch (err) {
    console.error("[Cloud] Init error:", err);
    return null;
  }
}

export async function syncAllToCloud() {
  if (!isSupabaseConfigured()) return { success: false, count: 0 };
  const sb = getSupabaseClient();
  if (!sb) return { success: false, count: 0 };
  const candidates = getAllCandidates();
  if (candidates.length === 0) return { success: true, count: 0 };
  const rows = candidates.map(toRow);
  const chunkSize = 25;
  let totalSynced = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await sb.from("candidates").upsert(chunk, { onConflict: "id" });
    if (error) { console.error("[Cloud] Sync chunk error:", error.message); return { success: false, count: totalSynced }; }
    totalSynced += chunk.length;
  }
  return { success: true, count: totalSynced };
}

export async function getCloudCount() {
  if (!isSupabaseConfigured()) return 0;
  const sb = getSupabaseClient();
  if (!sb) return 0;
  try {
    const { count, error } = await sb.from("candidates").select("id", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch { return 0; }
}
