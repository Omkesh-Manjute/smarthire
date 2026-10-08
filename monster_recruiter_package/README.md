# 🎯 Monster+ AI Candidate Sourcing & Automation Package

Standalone, production-ready module to integrate **Monster+ (manage.monster.com)** automated candidate sourcing, AI JD parsing, Good Match ranking (0-100%), and 1-click personalized outreach emails into any web application.

---

## 📁 Package Contents

```
monster_recruiter_package/
├── monster_automation.py       # Playwright scraper (login, session persistence, live search)
├── monster_engine.py           # AI JD Parser, Monster Boolean generator, AI Match Scorer
├── monster_auth_state.json     # Saved Monster employer authenticated session
├── api.py                      # Standalone FastAPI server with all endpoints
├── static/
│   └── index.html              # Modern glassmorphism UI Dashboard
├── requirements.txt            # Python dependencies
├── .env                        # Pre-configured credentials
└── README.md                   # Integration guide
```

---

## ⚡ Quick Start (Run Standalone in 1 Minute)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

2. **Run the server:**
   ```bash
   python api.py
   # Or using uvicorn:
   uvicorn api:app --host 0.0.0.0 --port 8001 --reload
   ```

3. **Open Dashboard:**
   Visit: `http://localhost:8001`

---

## 🔌 How to Integrate into Another Live Project

### Option A: If your live website uses FastAPI
Copy `monster_engine.py`, `monster_automation.py`, and `monster_auth_state.json` into your project directory.
In your `main.py`:
```python
from monster_engine import MonsterRecruiterEngine
from monster_automation import MonsterPlaywrightScraper

engine = MonsterRecruiterEngine()

@app.post("/api/recruiter/parse-jd")
def parse_jd(payload: dict):
    return engine.parse_job_description(payload.get("jd_text", ""))

@app.post("/api/recruiter/find-candidates")
def find_candidates(payload: dict):
    jd_parsed = engine.parse_job_description(payload.get("jd_text", ""))
    candidates = engine.search_candidates_pool(
        jd_parsed, 
        location=payload.get("location", "Richmond, VA"), 
        max_results=payload.get("max_results", 5)
    )
    return {"success": True, "jd_parsed": jd_parsed, "candidates": candidates}
```

### Option B: If your live website uses Flask / Django
Simply import `MonsterRecruiterEngine` in your view/route:
```python
from monster_engine import MonsterRecruiterEngine

engine = MonsterRecruiterEngine()
# In your Flask route:
@app.route("/api/find-candidates", methods=["POST"])
def find_candidates():
    data = request.json
    jd_parsed = engine.parse_job_description(data["jd_text"])
    candidates = engine.search_candidates_pool(jd_parsed, location=data.get("location"))
    return jsonify({"success": True, "candidates": candidates})
```

### Option C: If your live website is Next.js / React / Node.js
1. Keep this Python service running on a microservice port (e.g. `http://localhost:8001` or your cloud server `https://recruiter-api.yourdomain.com`).
2. In your React / Next.js API route (`/api/candidates`), make a standard fetch request:
```javascript
const res = await fetch("http://localhost:8001/api/recruiter/find-candidates", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ jd_text: yourJD, location: "Richmond, VA" })
});
const data = await res.json();
```

---

## 🔑 Configuration (.env)
```env
MONSTER_EMAIL=omkesh@coolsofttech.com
MONSTER_PASSWORD=your_monster_password
GROQ_API_KEY=your_groq_api_key_here
PORT=8001
```
