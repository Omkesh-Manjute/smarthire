# Security Audit Report — SmartHire ATS
**Generated via Cloudflare Security Audit Skill (`security-audit-skill`)**  
**Date**: October 07, 2026 | **Target**: `smarthire-main` | **Status**: Verified

---

## Executive Summary

| Total Findings | Critical | High | Medium | Low / Info |
| :---: | :---: | :---: | :---: | :---: |
| **4** | **2** | **1** | **1** | **0** |

Cloudflare's `security-audit-skill` automated inspection and source reconnaissance was executed against the SmartHire ATS codebase. Four confirmed security vulnerabilities were identified across authentication, token handling, document rendering, and cross-origin resource sharing.

All findings have been validated against the official `report-schema.json` using `validate-findings.cjs` (`PASS: 4 findings valid`).

---

## Findings Detail

### 1. [AUTH-BYPASS-001] Unauthenticated Request Fallback Grants Superadmin Privilege
- **Severity**: **Critical** (Likelihood: Critical, Impact: Critical)
- **File**: `smarthire-react/server/index.js` (Lines 34–44)
- **Vulnerability Type**: Broken Authentication & Authorization / Insecure Defaults
- **Description**: In `server/index.js`, the `authenticateToken` middleware contains development fallback logic:
  ```javascript
  if (!token) {
    req.user = { id: 'admin-1', role: 'superadmin', name: 'Super Admin', email: 'omkesh@coolsofttech.com' };
    return next();
  }
  ```
- **Impact**: Any remote caller can send an HTTP request without an Authorization header and receive full `superadmin` privileges, allowing unauthorized viewing, modification, and deletion of candidates, requisitions, and recruiter accounts.
- **Defensive Fix**: Reject unauthenticated requests with HTTP 401:
  ```javascript
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Access token is required' });
  }
  ```

---

### 2. [JWT-HARDCODED-SECRET-001] Fallback Hardcoded JWT Secret Key in Server Runtime
- **Severity**: **Critical** (Likelihood: High, Impact: Critical)
- **File**: `smarthire-react/server/index.js` (Line 28)
- **Vulnerability Type**: Cryptographic Failures / Hardcoded Secret
- **Description**: 
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET || 'smarthire_secure_jwt_secret_key_2026';
  ```
- **Impact**: If the `JWT_SECRET` environment variable is omitted in deployment, any adversary who reads the repository source can forge a valid JWT token signed with this known string, assigning themselves any identity or role (`superadmin`).
- **Defensive Fix**: Enforce environment secret configuration and terminate on startup if missing:
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is missing.');
    process.exit(1);
  }
  ```

---

### 3. [XSS-REFLECTED-001] Reflected Cross-Site Scripting in Resume Document Viewer
- **Severity**: **High** (Likelihood: High, Impact: High)
- **File**: `smarthire-react/server/index.js` (Lines 2277, 2656)
- **Vulnerability Type**: Cross-Site Scripting (CWE-79)
- **Description**: In the `/api/candidates/view-resume` endpoint, the `req.query.name` parameter is interpolated directly into the HTML document string:
  ```javascript
  const candName = req.query.name || req.query.candidateName || 'Candidate Resume';
  // ...
  <div class="cand-name">${candName}</div>
  ```
- **Impact**: An attacker can provide a link such as `https://smarthireus.com/api/candidates/view-resume?file=sample.pdf&name=<script>...</script>`. When clicked by a recruiter, the script executes within the context of the recruiter's session.
- **Defensive Fix**: Sanitize all dynamic parameters before HTML interpolation:
  ```javascript
  const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeCandName = escapeHtml(candName);
  ```

---

### 4. [CORS-WILDCARD-001] Permissive Wildcard Cross-Origin Resource Sharing
- **Severity**: **Medium** (Likelihood: Medium, Impact: Medium)
- **File**: `smarthire-react/server/index.js` (Line 22)
- **Vulnerability Type**: Security Misconfiguration
- **Description**: `app.use(cors())` configures CORS with default wildcard (`*`) access without restricting origins.
- **Defensive Fix**: Restrict CORS to explicit trusted origins:
  ```javascript
  app.use(cors({
    origin: ['https://smarthireus.com', 'https://www.smarthireus.com'],
    credentials: true
  }));
  ```
