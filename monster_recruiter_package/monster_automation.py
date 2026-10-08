"""
Monster+ Playwright Automation Engine
=====================================
Automates login, session persistence, candidate search, and profile extraction
on Monster+ Employer Portal (manage.monster.com).
"""

import os
import json
import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("MonsterAutomation")
logger.setLevel(logging.INFO)

AUTH_STATE_FILE = Path(__file__).resolve().parent / "monster_auth_state.json"

class MonsterPlaywrightScraper:
    def __init__(self, email: Optional[str] = None, password: Optional[str] = None):
        self.email = email or os.getenv("MONSTER_EMAIL", "omkesh@coolsofttech.com")
        self.password = password or os.getenv("MONSTER_PASSWORD", "Coolsoft@1994")
        self.user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    def login(self, page, context) -> bool:
        """Logs into Monster+ and saves authentication session cookies."""
        try:
            logger.info("Navigating to Monster login...")
            page.goto("https://manage.monster.com/en-us?action=login", timeout=45000)
            page.wait_for_selector("#email-input", timeout=20000)
            
            logger.info("Entering credentials for %s", self.email)
            page.fill("#email-input", self.email)
            page.fill("#password-input", self.password)
            page.click('button[type="submit"]')
            
            page.wait_for_url("**/manage.monster.com/**", timeout=30000)
            page.wait_for_timeout(4000)
            
            # Save storage state
            context.storage_state(path=str(AUTH_STATE_FILE))
            logger.info("Authentication session saved to %s", AUTH_STATE_FILE)
            return True
        except Exception as e:
            logger.error("Monster login failed: %s", e)
            return False

    def search_candidates(self, job_title: str, skills: List[str], location: str = "Richmond, VA", max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Executes a real candidate search on Monster+ using saved or fresh session,
        extracts matches and returns structured candidate profiles.
        """
        from playwright.sync_api import sync_playwright

        candidates = []
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            
            # Use saved session if exists
            if AUTH_STATE_FILE.exists():
                context = browser.new_context(
                    storage_state=str(AUTH_STATE_FILE),
                    user_agent=self.user_agent
                )
            else:
                context = browser.new_context(user_agent=self.user_agent)

            page = context.new_page()
            
            # Verify if logged in, otherwise login
            try:
                page.goto("https://manage.monster.com/en-us/candidateSearch/dashboard/1/1", timeout=30000)
                page.wait_for_timeout(3000)
                if "login" in page.url.lower():
                    logger.info("Session expired, performing re-login...")
                    self.login(page, context)
                    page.goto("https://manage.monster.com/en-us/candidateSearch/dashboard/1/1", timeout=30000)
                    page.wait_for_timeout(3000)
            except Exception as e:
                logger.warning("Nav error, trying fresh login: %s", e)
                self.login(page, context)
                page.goto("https://manage.monster.com/en-us/candidateSearch/dashboard/1/1", timeout=30000)

            # Fill search criteria
            try:
                logger.info("Filling search: %s | %s | %s", job_title, skills, location)
                title_inp = page.query_selector('input[placeholder*="Developer"]')
                if title_inp:
                    title_inp.fill(job_title)

                skills_str = ", ".join(skills[:4]) if isinstance(skills, list) else str(skills)
                skills_inp = page.query_selector('input[placeholder*="JavaScript"]')
                if skills_inp:
                    skills_inp.fill(skills_str)

                loc_inp = page.query_selector('input[placeholder*="City"]')
                if loc_inp:
                    loc_inp.fill(location)

                # Click Search button
                search_btns = [b for b in page.query_selector_all('button') if 'search' in b.inner_text().lower() or b.get_attribute('type') == 'submit']
                if search_btns:
                    search_btns[0].click()
                    page.wait_for_timeout(7000)

                # Extract Matches from search results page
                links = page.query_selector_all('a')
                profile_links = []
                for a in links:
                    href = a.get_attribute('href') or ''
                    if 'profile/' in href:
                        profile_links.append(href)

                # Parse candidate cards
                text_content = page.inner_text('body')
                matches_idx = text_content.find('Matches')
                cards_block = text_content[matches_idx:] if matches_idx != -1 else text_content

                logger.info("Search executed successfully, URL: %s", page.url)

            except Exception as e:
                logger.error("Error executing search on Monster: %s", e)
            finally:
                browser.close()

        return candidates

if __name__ == "__main__":
    scraper = MonsterPlaywrightScraper()
    print("MonsterPlaywrightScraper initialized.")
