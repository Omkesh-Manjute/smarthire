"""
Monster Recruiter Standalone API Server
======================================
FastAPI server exposing endpoints for:
1. POST /api/recruiter/parse-jd
2. POST /api/recruiter/find-candidates
3. POST /api/recruiter/live-monster-search
4. GET / (Frontend Studio UI)
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from monster_engine import MonsterRecruiterEngine
from monster_automation import MonsterPlaywrightScraper

load_dotenv()

app = FastAPI(title="Monster+ AI Recruiter API", version="1.0.0")
engine = MonsterRecruiterEngine()

STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

class JDRequest(BaseModel):
    jd_text: str

class FindCandidatesRequest(BaseModel):
    jd_text: str
    location: Optional[str] = "Richmond, VA"
    max_results: Optional[int] = 5

class LiveSearchRequest(BaseModel):
    job_title: str
    skills: list[str]
    location: Optional[str] = "Richmond, VA"

@app.get("/")
def serve_dashboard():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Monster+ Recruiter API is running. Mount dashboard in static/index.html"}

@app.post("/api/recruiter/parse-jd")
def parse_jd_endpoint(req: JDRequest):
    result = engine.parse_job_description(req.jd_text)
    return JSONResponse(content=result)

@app.post("/api/recruiter/find-candidates")
def find_candidates_endpoint(req: FindCandidatesRequest):
    jd_parsed = engine.parse_job_description(req.jd_text)
    if not jd_parsed.get("success"):
        raise HTTPException(status_code=400, detail="Invalid job description")
    
    candidates = engine.search_candidates_pool(jd_parsed, location=req.location, max_results=req.max_results)
    return JSONResponse(content={
        "success": True,
        "jd_parsed": jd_parsed,
        "candidates": candidates,
        "count": len(candidates)
    })

@app.post("/api/recruiter/live-monster-search")
def live_monster_search_endpoint(req: LiveSearchRequest):
    scraper = MonsterPlaywrightScraper()
    candidates = scraper.search_candidates(
        job_title=req.job_title,
        skills=req.skills,
        location=req.location
    )
    return JSONResponse(content={
        "success": True,
        "candidates": candidates,
        "count": len(candidates)
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=True)
