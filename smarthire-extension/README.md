# SmartHire Sourcing Copilot — Chrome Extension (Manifest V3)

Enterprise 1-Click Talent Sourcing Copilot for **Monster+** (`manage.monster.com`) and **Dice** (`dice.com`).

---

## ⚡ Key Capabilities

1. **Dynamic SmartHire ATS Requisition Synchronization**:
   - Fetches live requisitions directly from `https://smarthireus.com/api/jobs`.
   - Changing the requisition dropdown instantly recomputes the position requirements, locations, and key skills.

2. **AI Boolean Search Generator with 3 Variants**:
   - **Variant 1 (Targeted Exact Core)**: Precision query targeting exact job titles and non-negotiable required skills.
   - **Variant 2 (Broad / Agile / Synonyms)**: Expanded industry synonyms, frameworks, and methodologies.
   - **Variant 3 (Regional / Public Sector)**: Localized query targeting city/state government and enterprise domain experience.
   - 1-click **Copy Query** button for manual adjustments.

3. **1-Click Search Launchers**:
   - **1-Click Search Monster+**: Auto-populates keywords and location directly into Monster's search bar, or launches a pre-filled candidate search.
   - **1-Click Search Dice**: Auto-populates keywords and location into Dice Employer / Talent Search and triggers search.

4. **1-Click Candidate Scraper (Bulk Contact Extraction)**:
   - Traverses candidate cards, candidate rows, and open profile drawers.
   - Automatically extracts:
     - Candidate Full Name
     - Current Job Title / Role
     - Contact Email Address (via DOM and Regex extraction)
     - Contact Phone Number (via DOM and Regex extraction)
     - Location (City, State / Remote)
     - Years of Experience
     - Core Skill Badges & Keywords
     - Profile URL and Source Platform
     - Work Authorization (US Citizen, Green Card, H-1B, EAD)

5. **Authentic Excel-Style Spreadsheet View**:
   - Crisp Excel grid with checkable rows, `#CBD5E1` borders, and compact typography.
   - **📋 Copy to Excel**: Copies Tab-Separated Values (TSV) directly to clipboard. Paste with `Ctrl+V` (or `Cmd+V`) into Microsoft Excel or Google Sheets for instant formatted columns.
   - **📥 Download CSV**: Downloads clean, RFC 4180-compliant `.csv` candidate file.

6. **🚀 1-Click Direct ATS Ingestion**:
   - Ingests all or selected candidates directly into `https://smarthireus.com/api/recruiter/sourcing/bulk-import` under the chosen requisition.
   - Automatically deduplicates existing candidate profiles and updates contact numbers.

7. **Floating In-Page Side Dock**:
   - A convenient floating button `[SmartHire ATS]` appears seamlessly on the right edge of Monster+ and Dice pages, allowing recruiters to scrape and import without even opening the Chrome extension popup!

---

## 🚀 How to Install in Google Chrome (Takes 30 Seconds)

1. Open **Google Chrome** on your computer.
2. In the address bar, type `chrome://extensions` and press **Enter**.
3. In the top right corner of the Extensions page, turn **ON** the **Developer mode** toggle.
4. Click the **Load unpacked** button in the top left.
5. Browse and select the directory:
   ```text
   /Users/omkeshmanjute/Develop/Smart hire project/smarthire-extension
   ```
6. The extension **"SmartHire Sourcing Copilot — Monster+ & Dice"** will appear in your Chrome toolbar!
7. Click the Chrome Extensions puzzle icon in the top right of your browser, find **SmartHire Sourcing Copilot**, and click the **Pin** icon to keep it visible on your toolbar.

---

## 📖 How to Use

1. Log in to your **Monster+** (`manage.monster.com`) or **Dice** (`dice.com`) employer account.
2. Click the **SmartHire Sourcing Copilot** icon in your Chrome toolbar.
3. Select your desired ATS requisition from the dropdown (e.g. `#159287 · Microsoft .NET Developer`).
4. Click **"1-Click Search Monster+"** or **"1-Click Search Dice"** to run the Boolean query.
5. Once candidates are displayed on Monster or Dice, click **"1-Click Scrape Current Page"**.
6. View the candidates in the Excel-style grid:
   - Click **"📋 Copy to Excel"** to paste directly into an Excel sheet.
   - Click **"🚀 1-Click Bulk Import to SmartHire ATS"** to send them straight into your requisition pipeline on `smarthireus.com`!
