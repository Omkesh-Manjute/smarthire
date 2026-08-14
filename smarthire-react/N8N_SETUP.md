# VerifyHire n8n Automation (Vercel Node.js API)

This project now uses **Vercel Node.js API routes** for resume intake.

## API Endpoints

- `GET /api/health`
- `POST /api/resume/email-upload`

## n8n ? ATS Payload Requirements

Use `multipart/form-data` with these fields:

Required:
- `resume_file` (binary, PDF/DOCX/DOC)
- `email_subject` (text)
- `sender_email` (text)
- `job_id` (text)

Optional:
- `email_body` (text)
- `source` (text, e.g. `yahoo_n8n`)

## n8n HTTP Request Node Config

Method: `POST`

URL (production):
- `https://<your-vercel-domain>/api/resume/email-upload`

URL (local with vercel dev):
- `http://127.0.0.1:3000/api/resume/email-upload`

Body Content Type:
- `Form-Data`

Suggested mappings:
- `resume_file` ? binary attachment from email node
- `email_subject` ? `{{$json.subject}}`
- `sender_email` ? `{{$json.from}}`
- `email_body` ? `{{$json.text || $json.html || ''}}`
- `job_id` ? static or mapped JD id (example: `J-102`)
- `source` ? `yahoo_n8n`

## Response (current no-DB mode)

API returns:
- `candidate_id`
- `file` metadata
- `extracted_profile` (mock)
- `jd_match.match_score` (mock)
- `next_action`

## Important for no-DB mode

- Candidate is processed in mock mode only.
- You can still automate intake and recruiter review workflow.
- Later, add Prisma/PostgreSQL + Gemini extraction in this same route.
