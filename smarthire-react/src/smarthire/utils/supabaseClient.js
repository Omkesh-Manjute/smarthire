import { createClient } from "@supabase/supabase-js";

const STORAGE_KEY = "ats_supabase_config";
const LEGACY_URL_KEY = "supabaseUrl";
const LEGACY_ANON_KEY = "supabaseAnonKey";
const LEGACY_ANON_KEY_ALT = "supabaseKey";

const DEFAULT_SUPABASE_URL = "";
const DEFAULT_SUPABASE_ANON_KEY = "";

let client = null;
let runtimeConfig = null;

function isQuotaExceeded(error) {
  return error instanceof DOMException && error.name === "QuotaExceededError";
}

function cleanInput(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim().replace(/^['"]+|['"]+$/g, "");
}

function normalizeSupabaseUrl(value) {
  let normalized = cleanInput(value);
  if (!normalized) return "";
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
  try {
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return normalized.replace(/\/+$/, "");
  }
}

function normalizeAnonKey(value) {
  return cleanInput(value).replace(/\s+/g, "");
}

function getProjectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0]?.toLowerCase() || "";
  } catch {
    return "";
  }
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    return atob(padded);
  } catch {
    return "";
  }
}

function getProjectRefFromAnonKey(anonKey) {
  if (!anonKey.includes(".")) return "";
  const parts = anonKey.split(".");
  if (parts.length < 2) return "";
  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) return "";
  try {
    const payload = JSON.parse(payloadRaw);
    return typeof payload.ref === "string" ? payload.ref.toLowerCase() : "";
  } catch {
    return "";
  }
}

function validateConfig(config) {
  if (!config.url || !config.anonKey) return "Supabase URL and Anon Key are required. Please configure them in Cloud Database Settings.";
  const refFromUrl = getProjectRefFromUrl(config.url);
  const refFromKey = getProjectRefFromAnonKey(config.anonKey);
  if (refFromUrl && refFromKey && refFromUrl !== refFromKey) return `URL and key are from different Supabase projects (url: ${refFromUrl}, key: ${refFromKey}).`;
  return null;
}

function normalizeConfig(config) {
  if (!config) return { url: "", anonKey: "" };
  const url = normalizeSupabaseUrl(config.url) || normalizeSupabaseUrl(config.supabaseUrl);
  const anonKey = normalizeAnonKey(config.anonKey) || normalizeAnonKey(config.supabaseAnonKey) || normalizeAnonKey(config.supabaseKey);
  return { url, anonKey };
}

function getEnvConfig() {
  const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = normalizeAnonKey(import.meta.env.VITE_SUPABASE_ANON_KEY);
  return { url, anonKey };
}

function getStoredConfig() {
  const readNormalized = (raw) => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeConfig(parsed);
      return normalized.url && normalized.anonKey ? normalized : null;
    } catch {
      return null;
    }
  };
  try {
    const storedLocal = readNormalized(localStorage.getItem(STORAGE_KEY));
    if (storedLocal) return storedLocal;
  } catch (e) {
    console.warn("Failed to read Supabase config from localStorage:", e);
  }
  try {
    const storedSession = readNormalized(sessionStorage.getItem(STORAGE_KEY));
    if (storedSession) return storedSession;
  } catch (e) {
    console.warn("Failed to read Supabase config from sessionStorage:", e);
  }
  try {
    const legacyUrl = normalizeSupabaseUrl(localStorage.getItem(LEGACY_URL_KEY));
    const legacyAnonKey = normalizeAnonKey(localStorage.getItem(LEGACY_ANON_KEY)) || normalizeAnonKey(localStorage.getItem(LEGACY_ANON_KEY_ALT));
    if (legacyUrl && legacyAnonKey) return { url: legacyUrl, anonKey: legacyAnonKey };
  } catch (e) {
    console.warn("Failed to read legacy Supabase config from localStorage:", e);
  }
  return { url: "", anonKey: "" };
}

function getDefaultConfig() {
  return { url: normalizeSupabaseUrl(DEFAULT_SUPABASE_URL), anonKey: normalizeAnonKey(DEFAULT_SUPABASE_ANON_KEY) };
}

function persistConfig(config) {
  const payload = { url: config.url, anonKey: config.anonKey, supabaseUrl: config.url, supabaseAnonKey: config.anonKey };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(LEGACY_URL_KEY, config.url);
    localStorage.setItem(LEGACY_ANON_KEY, config.anonKey);
    localStorage.setItem(LEGACY_ANON_KEY_ALT, config.anonKey);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    return;
  } catch (e) {
    if (!isQuotaExceeded(e)) throw e;
    console.warn("LocalStorage quota exceeded while saving Supabase config. Falling back to sessionStorage.");
  }
  const minimal = JSON.stringify({ url: config.url, anonKey: config.anonKey });
  sessionStorage.setItem(STORAGE_KEY, minimal);
}

export function getSupabaseConfig() {
  if (runtimeConfig?.url && runtimeConfig.anonKey) return runtimeConfig;
  const stored = getStoredConfig();
  if (stored.url && stored.anonKey) { runtimeConfig = stored; return stored; }
  const envConfig = getEnvConfig();
  if (envConfig.url && envConfig.anonKey) { runtimeConfig = envConfig; return envConfig; }
  const defaultConfig = getDefaultConfig();
  runtimeConfig = defaultConfig;
  return defaultConfig;
}

export function saveSupabaseConfig(config) {
  const normalized = normalizeConfig(config);
  runtimeConfig = normalized;
  try {
    if (normalized.url && normalized.anonKey) persistConfig(normalized);
  } catch (e) {
    console.warn("Failed to save Supabase config to localStorage:", e);
  }
  client = null;
}

export function clearSupabaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_URL_KEY);
    localStorage.removeItem(LEGACY_ANON_KEY);
    localStorage.removeItem(LEGACY_ANON_KEY_ALT);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear Supabase config:", e);
  }
  runtimeConfig = null;
  client = null;
}

export function getSupabaseClient() {
  if (client) return client;
  const config = getSupabaseConfig();
  const validationError = validateConfig(config);
  if (validationError) throw new Error(validationError);
  try {
    client = createClient(config.url, config.anonKey);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Invalid Supabase configuration";
    throw new Error(`Unable to initialize Supabase client: ${reason}`);
  }
  return client;
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return !!(config.url && config.anonKey);
}

export async function testSupabaseConnection() {
  const config = getSupabaseConfig();
  const validationError = validateConfig(config);
  if (validationError) return { success: false, message: validationError };
  try {
    const sb = getSupabaseClient();
    const { error, count } = await sb.from("candidates").select("id", { count: "exact", head: true });
    if (error) {
      if (error.message.includes("relation") && error.message.includes("does not exist")) return { success: false, message: 'Table "candidates" not found! Run the CREATE TABLE SQL in Supabase SQL Editor.' };
      if (error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("row-level security") || error.message.toLowerCase().includes("insufficient privileges")) {
        return { success: false, message: "Supabase permissions issue. Run the SQL setup block again to grant anon/authenticated access." };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: `Connected! ${count ?? 0} candidates in cloud.`, count: count ?? 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    const lower = message.toLowerCase();
    if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("connection timed out") || lower.includes("load failed")) {
      return { success: false, message: "Network error reaching Supabase. Check internet/VPN/proxy/ad-block, verify supabase.co is reachable from this network, and confirm project URL is correct." };
    }
    return { success: false, message };
  }
}

export const CREATE_TABLE_SQL = `-- Run this in Supabase SQL Editor
-- Go to supabase.com -> Your Project -> SQL Editor -> New Query -> Paste & Run

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  title TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  location TEXT DEFAULT '',
  content TEXT DEFAULT '',
  match_score INTEGER,
  matched_skills JSONB,
  missing_skills JSONB,
  matched_preferred JSONB,
  missing_preferred JSONB,
  ai_score INTEGER,
  ai_reasoning TEXT,
  ai_strengths JSONB,
  ai_gaps JSONB,
  ai_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous access (required for browser)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidates TO anon, authenticated;

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON candidates;

CREATE POLICY "Allow all operations" ON candidates
  FOR ALL USING (true) WITH CHECK (true);`;
