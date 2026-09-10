import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveMessageFirestore, getMessagesFirestore, saveRequisitionCandidates, saveCandidate } from '../lib/atsFirestore'

const POLL_INTERVAL = 3000

// --- Inline SVG Icons to prevent question marks or encoding bugs ---
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
)
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
)
const IconZap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
)
const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
)
const IconLocation = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
)
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
)
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
)
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
)
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
)
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
)
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
)
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
)
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
)
const IconExternalLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
)
const IconStar = ({ filled = false, color = '#F59E0B' }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
)
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
)
const IconPrinter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
)
const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
)
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
)
const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
)
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
)
const IconTable = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>
)
const IconIdCard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="8" y1="7" x2="16" y2="7"></line><line x1="8" y1="11" x2="16" y2="11"></line><circle cx="8" cy="16" r="2"></circle><line x1="12" y1="16" x2="16" y2="16"></line></svg>
)
const IconPencil = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
)
const IconUsers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
)

function getSkillFrequencies(resumeText = '', candidateSkills = []) {
  if (!resumeText) return []
  const text = resumeText.toLowerCase()
  const freqMap = new Map()

  const candidatesToCheck = [
    ...(Array.isArray(candidateSkills) ? candidateSkills : (candidateSkills ? String(candidateSkills).split(',').map(s => s.trim()) : [])),
    'SQL Server', 'GitHub', '.NET', 'Oracle', 'DB2', 'SAP', 'XML', 'NIEM',
    'Selenium', 'Java', 'Python', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes',
    'Agile', 'Scrum', 'JIRA', 'PostgreSQL', 'Power BI', 'Salesforce', 'DAX',
    'Playwright', 'TestNG', 'Postman', 'Kafka', 'React', 'Angular', 'Vue',
    'RAG', 'PyTorch', 'LangChain', 'Pinecone', 'Palo Alto', 'Cisco ASA', 'Firewalls'
  ]

  const unique = Array.from(new Set(candidatesToCheck.map(s => s ? s.trim() : ''))).filter(s => s.length >= 2)

  unique.forEach(sk => {
    const skLower = sk.toLowerCase()
    const escaped = skLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    const matches = text.match(regex)
    const count = matches ? matches.length : 0
    if (count > 0) {
      freqMap.set(skLower, { name: sk, count })
    }
  })

  return Array.from(freqMap.values()).sort((a, b) => b.count - a.count).slice(0, 10)
}

function getFullResumeText(candidate) {
  if (candidate?.resumeText && candidate.resumeText.length > 220) {
    return candidate.resumeText
  }
  const name = candidate?.name || 'CANDIDATE'
  const role = candidate?.role || 'Senior Technical Specialist'
  const email = candidate?.email || 'candidate@domain.com'
  const phone = candidate?.phone || '+1 (555) 019-2831'
  const loc = candidate?.location || 'Madison, WI'
  const exp = candidate?.experience || '8+ Years'
  const visa = candidate?.visaStatus || candidate?.visa_status || 'US Citizen'
  const skills = Array.isArray(candidate?.skills) ? candidate.skills : (candidate?.skills ? String(candidate.skills).split(',').map(s => s.trim()) : ['Java', 'SQL', 'Git'])
  const currentCo = candidate?.currentCompany || (candidate?.role ? `${candidate.role}, Enterprise Solutions` : 'Enterprise Partner Consultant')
  const prevCo = candidate?.previousCompany || 'Software Consultant, Tech Solutions'

  const roleLower = (role + ' ' + name + ' ' + skills.join(' ')).toLowerCase()

  // 1. QA Automation / SDET / SAP / NIEM
  if (roleLower.includes('qa') || roleLower.includes('sdet') || roleLower.includes('test') || roleLower.includes('selenium') || roleLower.includes('sap')) {
    return `${name.toUpperCase()}
Location: ${loc} | Contact: ${phone} | E-mail: ${email} | ${visa}

PROFESSIONAL SUMMARY
Results-driven Lead QA Automation Engineer / SDET with over ${exp} of extensive experience in design, development, and execution of automated regression test suites, enterprise web service validations, and end-to-end software quality assurance. Demonstrated expertise in SAP application testing, complex XML/NIEM payload compliance, SQL Server database reconciliation, and CI/CD automated test pipelines.

CORE TECHNICAL SKILLS
- Automation Tools: Selenium WebDriver, Playwright, TestNG, Cucumber BDD, SoapUI, Postman, REST Assured, JUnit
- Enterprise & Public-Sector Standards: SAP ECC & S/4HANA Testing, XML Validation, NIEM Schemas, WSDL, JSON Payloads
- Programming & Scripting: Java, Python, SQL, JavaScript, Groovy
- Databases: Microsoft SQL Server, Oracle 12c, PostgreSQL, MySQL
- DevOps & Management: Jenkins CI/CD, Git, GitHub, JIRA, HP ALM / Quality Center, Azure DevOps
- Testing Methodologies: Agile / Scrum, Functional Testing, Regression, System Integration (SIT), UAT

PROFESSIONAL EXPERIENCE

${currentCo} (2020 – Present)
- Spearheaded development and maintenance of scalable test automation frameworks using Selenium Java and TestNG, increasing automated regression test coverage to 86%.
- Performed end-to-end functional and regression testing across SAP modules and high-volume transaction processing systems.
- Validated complex XML payloads against NIEM compliance standards, catching 140+ schema divergence defects prior to user acceptance testing.
- Formulated complex SQL verification scripts on Microsoft SQL Server to audit relational database states, reconciliation ledgers, and downstream API payloads.
- Integrated automated test runs with Jenkins CI/CD pipelines, sending instant alerts and HTML test execution reports to engineering leads.

${prevCo} (2016 – 2020)
- Designed and executed 800+ automated test scenarios for enterprise web applications using Selenium and Cucumber BDD.
- Conducted RESTful API verification using Postman and SoapUI, verifying HTTP response codes, headers, and payload structures.
- Partnered closely with Scrum team members during sprint planning, backlog refinement, and three-amigos user story acceptance sessions.
- Managed bug lifecycle in JIRA, participating in daily triage meetings with developers and product managers.

EDUCATION
Bachelor of Science in Computer Science & Engineering
Accredited University

CERTIFICATIONS
- ISTQB Certified Software Tester (CTFL / CTAL)
- Certified ScrumMaster (CSM)®`
  }

  // 2. Technical Program Manager / Project Manager / Scrum
  if (roleLower.includes('tpm') || roleLower.includes('program manager') || roleLower.includes('project manager') || roleLower.includes('scrum master') || roleLower.includes('pmo')) {
    return `${name.toUpperCase()}, PMP, CSM
${loc} | ${email} | ${phone} | ${visa}

EXECUTIVE PROFILE
Distinguished Senior Technical Program Manager (TPM) with ${exp} of leadership directing multi-million dollar cloud transformations, enterprise digital roadmaps, and cross-functional engineering delivery squads. Expert in strategic roadmap planning, stakeholder alignment, executive technical communications, Agile/Scrum delivery governance, risk management, and vendor contract negotiations.

CORE LEADERSHIP COMPETENCIES
- Program & Project Governance: Strategic Roadmap Execution, SDLC Governance, Scope Baseline Management, Risk Mitigation
- Delivery Methodologies: Agile, Scrum, Kanban, SAFe (Scaled Agile), Hybrid Waterfall, Sprint Planning, OKR Alignment
- Technical Domain Knowledge: Cloud Infrastructure (AWS / Azure), Microservices Architecture, CI/CD Continuous Delivery
- Tools & Software: JIRA, Confluence, Microsoft Project, Smartsheet, AWS CloudWatch, Power BI, Slack
- Vendor & Budget Management: Multi-Million Dollar Program Budgeting ($10M+), Vendor Management, SOW Negotiation, SLA Tracking

PROFESSIONAL EXPERIENCE

${currentCo} (2020 – Present)
- Directed the end-to-end execution of enterprise multi-cloud transformation programs managing 5 distributed squads and 35+ software engineers.
- Accelerated sprint velocity by 32% by instituting automated JIRA burndown analytics, continuous backlog grooming, and transparent impediment clearing sessions.
- Partnered closely with VP of Engineering and Lead Cloud Architects to establish phased rollout roadmaps, minimizing system downtime during cutover.
- Led weekly executive progress reviews and quarterly OKR retrospectives, maintaining high alignment across engineering, product management, and compliance teams.

${prevCo} (2015 – 2020)
- Managed complex enterprise IT modernization projects from project charter through operational handover.
- Authored comprehensive project charters, technical risk registers, communications plans, and executive status dashboards.
- Facilitated daily standups, sprint reviews, and retrospective meetings as certified Scrum Master for two high-performing Agile squads.
- Enforced strict budget tracking and burn-rate modeling across an $8M annual technical project portfolio.

EDUCATION & CERTIFICATIONS
- Master of Science in Engineering / Business Administration
- Project Management Professional (PMP)® — PMI
- Certified ScrumMaster (CSM)® — Scrum Alliance`
  }

  // 3. Generative AI / LLM / Machine Learning
  if (roleLower.includes('generative ai') || roleLower.includes('llm') || roleLower.includes('machine learning') || roleLower.includes('rag') || roleLower.includes('pytorch')) {
    return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

PROFESSIONAL SUMMARY
Lead Generative AI and Machine Learning Engineer with ${exp} of hands-on expertise building production-grade Generative AI applications, Retrieval-Augmented Generation (RAG) architectures, and fine-tuning Large Language Models (LLMs). Extensive experience utilizing PyTorch, LangChain, HuggingFace, Vector Databases (Pinecone, FAISS, Weaviate), and deploying scalable microservices on AWS GPU infrastructure.

CORE TECHNICAL EXPERTISE
- Generative AI & LLMs: RAG Architectures, Fine-Tuning (LoRA, QLoRA), Prompt Engineering, Semantic Search, Agentic Workflows
- Frameworks & Libraries: LangChain, LlamaIndex, PyTorch, HuggingFace Transformers, vLLM, DeepSpeed, Ollama, TensorFlow
- Vector DBs & Search: Pinecone, FAISS, Milvus, Weaviate, Qdrant, ChromaDB, Elasticsearch
- Languages & Tools: Python 3.10+, SQL, Docker, Kubernetes, Git, Linux, FastAPIs, Celery, Redis
- Cloud & MLOps: AWS (SageMaker, Bedrock, EC2 GPU instances, S3, ECS), MLflow, Weights & Biases, Triton Inference Server

PROFESSIONAL EXPERIENCE

${currentCo} (2021 – Present)
- Architected enterprise-grade RAG knowledge retrieval systems indexing over 15M multi-modal documents with sub-200ms query latency.
- Fine-tuned open-source LLMs (Llama 3 70B, Mistral, Gemma) using LoRA on multi-GPU AWS clusters, reducing task-specific hallucination by 46%.
- Built agentic tool-use pipelines using LangChain and FastAPI, allowing models to dynamically query SQL databases and external REST endpoints.
- Containerized model inference containers with Docker and orchestrated GPU autoscaling nodes on Kubernetes (EKS).

${prevCo} (2017 – 2021)
- Developed NLP classification and entity extraction models using PyTorch, HuggingFace, and spaCy, achieving 94% F1-score on customer support datasets.
- Created automated feature engineering and data preprocessing pipelines in Python, processing 5TB+ of text data.
- Collaborated with software engineering teams to deploy RESTful model inference endpoints with 99.9% service uptime.

EDUCATION & CERTIFICATIONS
- Master of Science in Computer Science (Artificial Intelligence Focus)
- AWS Certified Machine Learning – Specialty
- DeepLearning.AI Generative AI with Large Language Models Certification`
  }

  // 4. Data Analyst / Power BI / Data Governance
  if (roleLower.includes('data') || roleLower.includes('power bi') || roleLower.includes('bi') || roleLower.includes('governance') || roleLower.includes('warehouse')) {
    return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

EXECUTIVE SUMMARY
Senior Power BI Data Analyst and Data Governance Specialist with ${exp} of expertise in enterprise data warehouse design, advanced SQL analytics, data governance frameworks, DAX calculations, and automated ETL data pipelines. Proven record translating complex data into actionable executive dashboards and compliant state reporting systems.

CORE TECHNICAL SKILLS
- BI & Analytics: Power BI Desktop & Service, DAX, Power Query (M), Tableau, Excel (VBA, Power Pivot)
- Database & Warehousing: SQL, Snowflake, SQL Server, Oracle, Data Modeling (Star/Snowflake Schema), Data Governance, Collibra
- CRM & Development: Salesforce (Admin & Dev), Apex, SOQL, Python (Pandas, NumPy)
- ETL & Pipelines: SSIS, Azure Data Factory, Alteryx, CDC (Change Data Capture)
- Compliance & Methodologies: Data Governance, HIPAA, Data Lineage, Agile / Scrum

EXPERIENCE

${currentCo} (2021 – Present)
- Architected enterprise executive dashboards in Power BI connected to Snowflake data warehouse, automating weekly reporting for 500+ stakeholders.
- Enforced data governance standards, data dictionary definitions, and row-level security (RLS) policies for state agency reporting.
- Developed complex DAX measures, time-intelligence calculations, and optimized Power Query transformations, improving report refresh times by 55%.
- Integrated corporate data warehouse using REST APIs and automated ETL pipelines.

${prevCo} (2017 – 2021)
- Designed and maintained dimensional star-schema data models and stored procedures on SQL Server and Oracle databases.
- Built automated ETL data ingestion pipelines handling 10M+ daily healthcare transaction records.
- Facilitated user training workshops and created comprehensive dashboard documentation and data governance operating procedures.

EDUCATION & CREDENTIALS
- Master / Bachelor of Science in Data Analytics / Computer Science
- Microsoft Certified: Power BI Data Analyst Associate (PL-300)`
  }

  // 5. Network Security / Firewall / Cloud Security
  if (roleLower.includes('security') || roleLower.includes('network') || roleLower.includes('firewall') || roleLower.includes('cisco')) {
    return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

PROFESSIONAL SUMMARY
Accomplished Senior Network Security Engineer with ${exp} of extensive experience in enterprise firewall engineering, perimeter defense, Cisco routing & switching, Palo Alto Panorama, site-to-site VPN tunnels, and AWS cloud security architectures. Deep expertise in incident response, IDS/IPS tuning, and regulatory compliance (PCI-DSS, HIPAA, NIST).

CORE COMPETENCIES & SKILLS
- Firewalls & Security: Palo Alto (PA-3200, PA-5200, Panorama), Cisco ASA, Check Point, Fortinet FortiGate, Zscaler ZIA/ZPA
- Routing & Switching: BGP, OSPF, EIGRP, Cisco Catalyst 9000, Nexus 7K/9K, VLANs, VXLAN, MPLS
- VPN & Remote Access: IPsec VPN, SSL VPN, Cisco AnyConnect, GlobalProtect
- Cloud Networking: AWS VPC, Transit Gateway, Direct Connect, Security Groups, Network ACLs, Route 53
- Monitoring & Tools: Wireshark, SolarWinds, Splunk, Cisco Prime, Python Network Automation

PROFESSIONAL EXPERIENCE

${currentCo} (2020 – Present)
- Led design and migration of multi-vendor firewall environments, replacing legacy Cisco ASA with next-gen Palo Alto clusters managed via Panorama.
- Designed and provisioned secure AWS VPC infrastructure, Direct Connect circuits, and Transit Gateway routing for corporate branch offices.
- Configured and audited BGP and OSPF routing protocols across redundant data centers with 99.999% network uptime.
- Deployed Zscaler Internet Access (ZIA) and GlobalProtect VPN for 5,000+ remote employees during enterprise zero-trust transition.

${prevCo} (2016 – 2020)
- Administered Check Point and Cisco ASA firewalls, maintaining access control lists (ACLs) and NAT translation policies.
- Conducted regular vulnerability assessments, IDS/IPS rule tuning, and firewall firmware upgrades without service disruption.
- Automated routine firewall rule validation and configuration backups using Python scripts and Git versioning.

EDUCATION & CERTIFICATIONS
- Bachelor of Science in Electrical & Computer Engineering
- Palo Alto Networks Certified Network Security Engineer (PCNSE)
- Cisco Certified Network Professional (CCNP Security)`
  }

  // 6. Java Full Stack / Cloud / Enterprise Default
  return `${name.toUpperCase()}
${loc} | ${email} | ${phone} | ${visa}

EXECUTIVE SUMMARY
Accomplished ${role} with over ${exp} of experience in design, development, and implementation of high-throughput enterprise web applications, microservices, and distributed cloud solutions. Strong proficiency in ${skills.slice(0, 5).join(', ')}, SQL, Git, and RESTful API architecture. Proven success delivering mission-critical applications and collaborating across cross-functional Agile engineering teams.

CORE TECHNICAL SKILLS
- Languages & Core: Java (8/11/17), Python, SQL, JavaScript, HTML5/CSS3
- Frameworks & Backend: Spring Boot, Spring MVC, Spring Data JPA, Hibernate, Microservices, RESTful APIs, Kafka
- Frontend & UI: React, Angular, Vue.js, Redux, Tailwind CSS, TypeScript
- Cloud & DevOps: AWS (EC2, S3, RDS, CloudWatch), Docker, Kubernetes, Git, Jenkins CI/CD, Maven
- Databases: PostgreSQL, Oracle 12c, MySQL, MongoDB, SQL Server
- Testing & Methodologies: JUnit 5, Mockito, TestNG, SonarQube, Postman, Agile / Scrum, TDD

PROFESSIONAL EXPERIENCE

${currentCo} (2021 – Present)
- Architected and delivered resilient enterprise microservices utilizing ${skills.slice(0, 3).join(', ')}, reducing API p99 latency by 38%.
- Integrated relational database schemas and optimized SQL queries, ensuring data consistency and sub-second response times.
- Implemented Git version control branching workflows, automated peer code reviews, and containerized microservice deployments via Docker and Kubernetes on AWS.
- Designed secure OAuth2/JWT authentication filters and API Gateway routing for multi-tenant state agency and vendor integrations.

${prevCo} (2017 – 2021)
- Developed and maintained critical backend business logic and client integration endpoints.
- Designed comprehensive automated unit and integration tests using JUnit and Mockito, raising test coverage above 90%.
- Resolved complex production defect tickets and provided reliable escalation support for production releases.

EDUCATION
Bachelor of Science in Computer Science / Information Technology
Accredited University (Graduated with Honors)

CERTIFICATIONS
- Industry Certified Professional in ${skills[0] || 'Software Engineering'}
- Certified Scrum Developer (CSD) / AWS Certified Associate`
}

function getInitials(name = '') {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name[0] || '?').toUpperCase()
}

function getAvatarColor(name = '') {
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#9333EA','#16A34A','#EA580C','#BE123C']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function Avatar({ name, size = 40, style = {} }) {
  const bg = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#FFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: Math.round(size * 0.38), flexShrink: 0,
      letterSpacing: '-0.5px', ...style
    }}>
      {getInitials(name)}
    </div>
  )
}

const highlightResumeText = (text, matchingSkills = [], searchQuery = '') => {
  if (!text) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        color: '#64748B',
        fontStyle: 'italic',
        padding: '36px 44px',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
      }}>
        No resume text available for this profile.
      </div>
    )
  }

  let highlighted = text;

  // 1. Highlight matching position skills in bright luminous yellow
  if (matchingSkills && matchingSkills.length > 0) {
    const sortedSkills = [...matchingSkills].sort((a, b) => b.length - a.length);
    sortedSkills.forEach(skill => {
      if (!skill || skill.length < 2) return;
      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const startBoundary = /^[a-zA-Z0-9]/.test(skill.trim()) ? '\\b' : '';
      const endBoundary = /[a-zA-Z0-9]$/.test(skill.trim()) ? '\\b' : '';
      const regex = new RegExp(`${startBoundary}(${escaped})${endBoundary}`, 'gi');
      highlighted = highlighted.replace(regex, `<mark style="background-color: #FEF08A; color: #854D0E; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #FDE047;">$1</mark>`);
    });
  }

  // 2. Highlight manual search keywords in soft sky blue
  if (searchQuery && searchQuery.trim().length >= 2) {
    const escapedQ = searchQuery.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const qRegex = new RegExp(`(${escapedQ})`, 'gi');
    highlighted = highlighted.replace(qRegex, `<mark style="background-color: #BAE6FD; color: #0369A1; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #7DD3FC;">$1</mark>`);
  }

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: highlighted }} 
      style={{ 
        whiteSpace: 'pre-wrap', 
        lineHeight: '1.85', 
        fontSize: '14px', 
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, sans-serif",
        color: '#1E293B',
        backgroundColor: '#FFFFFF',
        padding: '40px 48px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02)',
        boxSizing: 'border-box'
      }} 
    />
  )
}

export default function RecruiterInbox() {
  const navigate = useNavigate()
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('smarthire_theme') || 'light')
  const isLight = themeMode === 'light'

  const C = {
    bg: isLight ? '#F8FAFC' : '#0B0F17',
    surface: isLight ? '#FFFFFF' : '#1E293B',
    sidebar: isLight ? '#FFFFFF' : '#0F172A',
    border: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.08)',
    textPrimary: isLight ? '#0F172A' : '#F1F5F9',
    textSecondary: isLight ? '#64748B' : '#94A3B8',
    activeConv: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.14)',
    inputBg: isLight ? '#F1F5F9' : '#0F172A',
    inputBorder: isLight ? '#CBD5E1' : 'rgba(255,255,255,0.12)',
    msgOther: isLight ? '#F1F5F9' : '#334155',
    msgOtherText: isLight ? '#1E293B' : '#F1F5F9',
    shadow: isLight ? '0 4px 24px rgba(0,0,0,0.06)' : '0 4px 24px rgba(0,0,0,0.3)',
    headerBg: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
  }

  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [candidateDetails, setCandidateDetails] = useState(null)
  const [showFullProfileModal, setShowFullProfileModal] = useState(false)
  const [syncingEmailResumes, setSyncingEmailResumes] = useState(false)
  const [emailSyncToast, setEmailSyncToast] = useState('')

  // View switcher: 'stream' (Indeed-style candidate talent stream) or 'chat' (live direct messages)
  const [inboxViewMode, setInboxViewMode] = useState('stream')
  const [streamFilter, setStreamFilter] = useState('all') // 'all', 'email_inbox', 'email_spam', 'careers_portal', 'vendor_bench'
  const [streamCandidates, setStreamCandidates] = useState([])
  const [streamCounts, setStreamCounts] = useState({
    candidatesTotal: 0,
    inboxResumes: 0,
    spamResumes: 0,
    careersResumes: 0,
    vendorResumes: 0
  })
  const [loadingStream, setLoadingStream] = useState(true)
  const [streamSearch, setStreamSearch] = useState('')
  const [streamReqFilter, setStreamReqFilter] = useState('all')
  const [streamEntityFilter, setStreamEntityFilter] = useState('all') // 'all', 'candidates', 'recruiters'
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [candidateSubTab, setCandidateSubTab] = useState('matches') // 'matches', 'favorites', 'spam'
  const [activeRightTab, setActiveRightTab] = useState('resume') // 'resume' or 'profile'
  const [viewedCandidateIds, setViewedCandidateIds] = useState(() => new Set(['cand-monster-jacob', 'cand-harvest-spam-6']))
  const [favoriteCandidateIds, setFavoriteCandidateIds] = useState(() => new Set())
  const [selectedCardIds, setSelectedCardIds] = useState(() => new Set())

  // Open Requisitions for Multi-Position AI Matcher
  const DEFAULT_OPEN_JOBS = [
    { id: '159079', title: 'Java Developer III - 165504', client: 'State of Wisconsin (ETF)', rate: '$75/hr', location: 'Madison, WI (Remote)', skills: ['Java', 'Spring Boot', 'React', 'Vue', 'SQL', 'Git', 'AWS'] },
    { id: '159078', title: 'Public Health Program Director 1 (66312)', client: 'Tennessee Department of Health (TN DOH)', rate: '$75/hr', location: 'Nashville, TN (Hybrid)', skills: ['Strategic Planning', 'Technical Writing', 'Program Management', 'Healthcare', 'Project Management', 'Agile'] },
    { id: '159077', title: 'Java Developer III - 165503', client: 'State of Wisconsin (ETF)', rate: '$75/hr', location: 'Madison, WI (Remote)', skills: ['Java', 'Angular', 'Vue', 'SQL', 'Git', 'Spring Boot'] },
    { id: '159074', title: 'Attorney - 66316', client: 'Tennessee Department of Health (TN DOH)', rate: '$75/hr', location: 'Nashville, TN (Hybrid)', skills: ['Legal Writing', 'Regulatory Compliance', 'Health Policy', 'Communications'] },
    { id: '159073', title: 'DBHDS - Data Governance Analyst (CDC Funded) (807900)', client: 'Virginia DBHDS', rate: '$75/hr', location: 'Richmond, VA (Hybrid)', skills: ['Data Governance', 'SQL', 'Data Warehouse', 'Python', 'Tableau', 'CDC', 'Power BI'] },
    { id: '158997', title: 'NC DHHS - AWS Senior Developer (808496)', client: 'NC DHHS', rate: '$85/hr', location: 'Raleigh, NC (Hybrid)', skills: ['AWS', 'Cloud Architecture', 'Python', 'Lambda', 'Docker', 'Kubernetes'] }
  ]
  const [openJobsList, setOpenJobsList] = useState(DEFAULT_OPEN_JOBS)
  const [drawerReqId, setDrawerReqId] = useState('159079')
  const [resumeKeywordSearch, setResumeKeywordSearch] = useState('')

  // Direct Outbound Email Modal State (Strictly sent from personal recruiter email)
  const [emailModalCandidate, setEmailModalCandidate] = useState(null)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSuccessToast, setEmailSuccessToast] = useState('')
  const [directMailtoUrl, setDirectMailtoUrl] = useState('')

  // Candidate Assignment Notification Toast
  const [assignedToast, setAssignedToast] = useState('')
  const [shareToast, setShareToast] = useState('')

  // Tobu.ai Mode & Tabs: 'card' (Candidate Card / Split View) or 'table' (Database Table View)
  const [inboxSubMode, setInboxSubMode] = useState('card')
  const [activeTobuTab, setActiveTobuTab] = useState('resume')
  const [tableCategory, setTableCategory] = useState('all')
  const [tablePage, setTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(25)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const pollingRef = useRef(null)

  const ALL_SMARTHIRE_RECRUITERS = [
    { name: 'Omkesh Manjute', email: 'omkesh.manjute@smarthire.com', refCode: 'omkesh', role: 'Super Admin' },
    { name: 'Vaibhav Bisen', email: 'vaibhav.bisen@smarthire.com', refCode: 'vaibhav-bisen', role: 'Lead Recruiter' },
    { name: 'Sukamal Chatterjee', email: 'sukamal.c@smarthire.com', refCode: 'sukamal-chatterjee', role: 'Senior Recruiter' },
    { name: 'Prudhvi Sevveti', email: 'prudhvi.s@smarthire.com', refCode: 'prudhvi-sevveti', role: 'Recruiter' },
    { name: 'Nitin Bhosale', email: 'nitin.b@smarthire.com', refCode: 'nitin-bhosale', role: 'Recruiter' },
    { name: 'Naveen Korimelli', email: 'naveen.k@smarthire.com', refCode: 'naveen-korimelli', role: 'Recruiter' },
    { name: 'Ajay Arya', email: 'ajay.a@smarthire.com', refCode: 'ajay-arya', role: 'Recruiter' },
    { name: 'Raj Barve', email: 'raj.b@smarthire.com', refCode: 'raj-barve', role: 'Recruiter' },
    { name: 'Pankaj Maharwade', email: 'pankaj.m@smarthire.com', refCode: 'pankaj-maharwade', role: 'Senior Recruiter' },
    { name: 'Nishant Kathane', email: 'nishant.k@smarthire.com', refCode: 'nishant-kathane', role: 'Recruiter' }
  ]

  const userStr = localStorage.getItem('smarthire_user') || localStorage.getItem('verifyhire_user')
  let currentUser = null
  try {
    if (userStr) currentUser = JSON.parse(userStr)
  } catch (e) {}

  const teamUsersList = (() => {
    try {
      const raw = localStorage.getItem('smarthire_recruiters')
      if (raw) return JSON.parse(raw) || []
    } catch(e) {}
    return []
  })()

  const matchedUserInTeam = teamUsersList.find(u =>
    (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u.name && currentUser?.name && u.name.toLowerCase() === currentUser.name.toLowerCase())
  )

  const defaultRole = (currentUser && currentUser.role) ? currentUser.role : 'superadmin'
  const activeRole = localStorage.getItem('smarthire_active_role') || defaultRole
  const isSuperAdmin = activeRole === 'superadmin' || activeRole === 'admin'
  const isAdmin = isSuperAdmin
  const isManager = activeRole === 'manager' || defaultRole === 'manager'
  const isEmployee = activeRole === 'employee' || defaultRole === 'employee'
  const isRecruiter = activeRole === 'recruiter' || defaultRole === 'recruiter'
  
  const resolvedParentName = currentUser?.parentRecruiterName || matchedUserInTeam?.parentRecruiterName || 
    (currentUser?.name?.toLowerCase().includes('gourav') || currentUser?.email?.toLowerCase().includes('gourav') ? 'Omkesh' : (isEmployee ? 'Sukamal Chatterjee' : ''))

  const isReportee = Boolean(resolvedParentName && !isSuperAdmin && !isManager && resolvedParentName.toLowerCase() !== (currentUser?.name || '').toLowerCase())

  const parentRecruiterName = resolvedParentName || 'Sukamal Chatterjee'
  const parentRecruiterEmail = currentUser?.parentRecruiterEmail || 
    (parentRecruiterName.toLowerCase().includes('omkesh') ? 'omkesh@coolsofttech.com' : 
     parentRecruiterName.toLowerCase().includes('vaibhav') ? 'vaibhav@coolsofttech.com' : 'sukamal.c@smarthire.com')

  const [recruiterFilter, setRecruiterFilter] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      if (u.refCode) return u.refCode
      if (u.email) {
        const found = ALL_SMARTHIRE_RECRUITERS.find(r => r.email.toLowerCase() === u.email.toLowerCase() || r.refCode.toLowerCase() === u.email.toLowerCase())
        if (found) return found.refCode
      }
    } catch (e) {}
    return 'all'
  })

  const quickTemplates = isReportee ? [
    `Hi ${parentRecruiterName}, could you please review this candidate profile for Requisition #158999?`,
    `Could you confirm if the bill rate of $90/hr and pay rate of $74/hr is approved for this candidate?`,
    `Candidate's Right to Represent (RTR) form and work authorization docs have been verified.`,
    `Candidate is immediately available for client interview rounds this week.`,
    `Please let me know if any additional screening notes are required before submission.`
  ] : [
    "Hi! I reviewed your resume and would love to connect. Are you available for a quick call this week?",
    "Thank you for your application! Could you confirm your work authorization status and notice period?",
    "Great news! We would like to move forward with your profile. Please confirm your availability for an interview.",
    "Could you share your LinkedIn profile URL and expected hourly rate for this position?",
    "We are submitting your profile to our client. You will hear back within 2-3 business days."
  ]

  const fetchThreads = useCallback(async () => {
    let candidateThreads = []
    try {
      const queryParam = recruiterFilter !== 'all' ? `?recruiter=${encodeURIComponent(recruiterFilter)}` : ''
      const res = await fetch(`/api/messages${queryParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`,
          'x-recruiter-ref': recruiterFilter
        }
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.threads)) {
        candidateThreads = data.threads
      }
    } catch (e) { console.warn('Candidate thread fetch error:', e) }

    // ─── DYNAMIC TEAM REPORTING CHANNELS ───
    const teamChannels = []

    if (isReportee) {
      // Employee / Sourcing Specialist channel with their direct supervisor (e.g. Naveen -> Sukamal)
      const threadId = `team-reportee-${(currentUser?.email || 'emp').toLowerCase().trim()}`
      let fsMsgs = []
      try { fsMsgs = await getMessagesFirestore(threadId) } catch(e) {}
      const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : 'Direct reporting & candidate approval channel'
      const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : new Date().toISOString()

      const supervisorThread = {
        candidateId: threadId,
        candidateName: `${parentRecruiterName} (Reporting Supervisor / Lead)`,
        jobTitle: 'Reporting Supervisor & Sourcing Approvals',
        lastMessage: lastMsgText,
        lastMessageTime: lastMsgTime,
        unreadCount: 0,
        isLeadChannel: true,
        isTeamMember: true,
        email: parentRecruiterEmail,
        role: 'Lead Recruiter'
      }
      teamChannels.push(supervisorThread)
    } else {
      // Supervisor / Lead Recruiter / Admin (e.g. Sukamal Chatterjee, Omkesh, Vaibhav)
      // Find all reportees assigned to this supervisor
      const myName = (currentUser?.name || '').toLowerCase().trim()
      const myEmail = (currentUser?.email || '').toLowerCase().trim()

      const myReportees = teamUsersList.filter(u => {
        if (!u || !u.name) return false
        const pName = (u.parentRecruiterName || '').toLowerCase().trim()
        const pEmail = (u.parentRecruiterEmail || '').toLowerCase().trim()
        const uEmail = (u.email || '').toLowerCase().trim()
        if (uEmail === myEmail) return false
        if (isAdmin || isSuperAdmin) {
          return u.role === 'employee' || u.role === 'recruiter'
        }
        return pName === myName || (myEmail && pEmail === myEmail) || (myName && pName.includes(myName))
      })

      for (const rep of myReportees) {
        const threadId = `team-reportee-${(rep.email || '').toLowerCase().trim()}`
        let fsMsgs = []
        try { fsMsgs = await getMessagesFirestore(threadId) } catch(e) {}
        const lastMsgText = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].text : 'Team reporting & candidate review channel'
        const lastMsgTime = (fsMsgs && fsMsgs.length > 0) ? fsMsgs[fsMsgs.length - 1].timestamp : new Date().toISOString()

        teamChannels.push({
          candidateId: threadId,
          candidateName: `${rep.name} (Sourcing Specialist)`,
          jobTitle: `Direct Reportee • ${rep.company || 'SmartHire Team'}`,
          lastMessage: lastMsgText,
          lastMessageTime: lastMsgTime,
          unreadCount: 0,
          isLeadChannel: false,
          isTeamMember: true,
          email: rep.email,
          phone: rep.phone || '571-660-5778',
          role: rep.role || 'Employee / Sourcing Specialist'
        })
      }
    }

    const combined = isReportee ? teamChannels : [...teamChannels, ...candidateThreads]
    setThreads(combined)

    if (!activeThread && combined.length > 0) {
      setActiveThread(combined[0])
    }
    setLoadingThreads(false)
  }, [recruiterFilter, isReportee, parentRecruiterName, parentRecruiterEmail, currentUser?.email, currentUser?.name, isAdmin, isSuperAdmin, teamUsersList, activeThread])

  const fetchCandidateDetails = useCallback(async (candidateId, threadObj = null) => {
    const thread = threadObj || threads.find(t => t.candidateId === candidateId)
    if (thread?.isTeamMember || thread?.isLeadChannel || candidateId.startsWith('team-') || candidateId.startsWith('lead-')) {
      const isLead = thread?.isLeadChannel || isReportee
      setCandidateDetails({
        name: thread?.candidateName || (isLead ? parentRecruiterName : 'Team Member'),
        email: thread?.email || (isLead ? parentRecruiterEmail : 'team@coolsofttech.com'),
        role: thread?.role || (isLead ? 'Lead Recruiter & Reporting Supervisor' : 'Sourcing Specialist / Team Member'),
        phone: thread?.phone || '571-660-5778',
        location: 'Richmond, VA / Remote',
        skills: isLead 
          ? ['Team Supervision', 'Requisition Approvals', 'Client Delivery', 'Rate Clearances', 'Candidate Intake']
          : ['Active Sourcing', 'Resume Verification', 'RTR Screening', 'Boolean Search', 'Candidate Engagement'],
        summary: isLead
          ? `Lead Recruiter supervisor for ${currentUser?.name || 'Recruiter'}. Reviews candidates, requisition queries, and approves client submissions.`
          : `Team member reporting to ${currentUser?.name || 'Lead Recruiter'}. Sources candidates, collects RTR documents, and submits profiles for requisition matching.`
      })
      return
    }

    try {
      let res;
      if (candidateId && candidateId.startsWith('SCR-')) {
        res = await fetch('/api/screening/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
      } else {
        res = await fetch('/api/candidates/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
      }
      const data = await res.json()
      if (data.success) {
        const candidateObj = data.session || data.candidate || data.data?.candidate
        setCandidateDetails(candidateObj)
      } else {
        setCandidateDetails(null)
      }
    } catch (e) { setCandidateDetails(null) }
  }, [isReportee, parentRecruiterName, parentRecruiterEmail, currentUser?.name, threads])

  const fetchMessages = useCallback(async (candidateId, silent = false) => {
    if (!candidateId) return
    if (!silent) setLoadingMessages(true)
    try {
      // 1. Fetch from Firestore
      let fsMsgs = []
      try {
        fsMsgs = await getMessagesFirestore(candidateId)
      } catch(e) {}

      // 2. Fetch from backend /api/messages/:candidateId
      let backendMsgs = []
      try {
        const res = await fetch('/api/messages/' + candidateId, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
        const data = await res.json()
        if (data.success && Array.isArray(data.messages)) {
          backendMsgs = data.messages
        }
      } catch (e) {}

      // Merge and deduplicate
      const msgMap = new Map()
      ;[...(fsMsgs || []), ...(backendMsgs || [])].forEach(m => {
        if (!m) return
        const key = m.id || `${m.timestamp}_${m.text}`
        if (!msgMap.has(key)) msgMap.set(key, m)
      })

      let merged = Array.from(msgMap.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

      if (merged.length === 0 && candidateId.startsWith('team-reportee-')) {
        const initial = [
          {
            id: 'lead-init-1',
            sender: 'lead',
            senderName: parentRecruiterName,
            senderEmail: parentRecruiterEmail,
            text: `Hi! Welcome to your direct reporting channel. Feel free to send candidate profiles for review, ask requisition questions, or request rate clearances here.`,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            candidateId: candidateId
          }
        ]
        merged = initial
      }

      setMessages(merged)
    } catch (e) {
      console.warn('Message fetch error:', e)
    } finally {
      if (!silent) setLoadingMessages(false)
    }
  }, [parentRecruiterName, parentRecruiterEmail])

  const selectThread = useCallback(async (thread) => {
    setActiveThread(thread)
    setInputText('')
    setShowTemplates(false)
    await fetchMessages(thread.candidateId)
    fetchCandidateDetails(thread.candidateId, thread)
    if (!thread.isLeadChannel && !thread.isTeamMember) {
      try {
        await fetch('/api/messages/' + thread.candidateId + '/read', { 
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
          }
        })
        setThreads(prev => prev.map(t => t.candidateId === thread.candidateId ? { ...t, unreadCount: 0 } : t))
      } catch (e) {}
    }
  }, [fetchMessages, fetchCandidateDetails])

  const handleSend = async (textOverride) => {
    const text = (textOverride || inputText).trim()
    if (!text || !activeThread) return
    setSending(true)
    setInputText('')
    setShowTemplates(false)

    const isMeEmployee = (currentUser?.role === 'employee' || isReportee)
    const senderType = isMeEmployee ? 'employee' : 'recruiter'

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: senderType,
      senderName: currentUser?.name || (isMeEmployee ? 'Employee' : 'Recruiter'),
      senderEmail: (currentUser?.email || '').toLowerCase().trim(),
      text: text,
      candidateName: activeThread.candidateName,
      jobTitle: activeThread.jobTitle,
      timestamp: new Date().toISOString(),
      candidateId: activeThread.candidateId,
      read: false
    }

    // Optimistic local state update
    setMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    // 1. Save to Cloud Firestore in real-time
    saveMessageFirestore(activeThread.candidateId, newMsg).catch(err => console.warn('Firestore msg error:', err))

    // 2. Save to backend API
    try {
      await fetch('/api/messages/' + activeThread.candidateId, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        },
        body: JSON.stringify(newMsg)
      })
    } catch (e) {}

    // 3. Update thread preview
    setThreads(prev => prev.map(t => {
      if (t.candidateId === activeThread.candidateId) {
        return {
          ...t,
          lastMessage: text,
          lastMessageTime: newMsg.timestamp
        }
      }
      return t
    }))

    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const fetchStreamCandidates = useCallback(async () => {
    setLoadingStream(true)
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
      const recName = u.name || currentUser?.name || 'Omkesh Manjute'
      const recRole = u.role || activeRole || 'superadmin'

      const params = new URLSearchParams({
        recruiterEmail: recEmail,
        userName: recName,
        role: recRole
      })

      const res = await fetch(`/api/recruiter/email-streams?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('smarthire_token') || ''}`
        }
      })
      const data = await res.json()
      if (data.success) {
        setStreamCandidates(data.candidates || [])
        if (data.counts) {
          setStreamCounts(data.counts)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch recruiter talent stream:', err)
    } finally {
      setLoadingStream(false)
    }
  }, [currentUser?.email, currentUser?.name, activeRole])

  const handleSyncEmailResumes = async () => {
    setSyncingEmailResumes(true)
    setEmailSyncToast('')
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
      const res = await fetch('/api/recruiter/sync-email-resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterEmail: recEmail,
          scanFolders: ['INBOX', 'SPAM']
        })
      })
      const data = await res.json()
      setEmailSyncToast(data.message || 'Scanned INBOX & SPAM: Resumes synced!')
      await fetchStreamCandidates()
      await fetchThreads()
    } catch (e) {
      setEmailSyncToast('Failed to sync resumes: ' + e.message)
    } finally {
      setSyncingEmailResumes(false)
      setTimeout(() => setEmailSyncToast(''), 8000)
    }
  }

  const handleOpenEmailModal = (cand) => {
    setEmailModalCandidate(cand)
    setEmailTo(cand.email || '')
    const targetReq = cand.targetReqId || '159079'
    const jobTitle = cand.matchedJobTitle || 'Open Position'
    const jobRate = cand.matchedJobRate || '$75/hr'
    const jobClient = cand.matchedJobClient || 'State Agency'

    const defaultSubject = `Opportunity: ${jobTitle} (Req #${targetReq}) | COOLSOFT LLC`
    setEmailSubject(defaultSubject)

    const candFirstName = (cand.name || 'Candidate').split(' ')[0]
    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh Manjute'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'

    const defaultBody = `Hi ${candFirstName},\n\nI reviewed your resume for the ${jobTitle} position (Req #${targetReq}) with our client ${jobClient} (${jobRate}). Your technical background and experience are a strong fit for this project.\n\nCould you please review and confirm:\n1. Your current work authorization status?\n2. Your updated hourly rate expectation for this position?\n3. Your immediate availability for a brief technical screening call?\n\nPlease reply directly to this email or feel free to attach your latest updated resume.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`

    setEmailBody(defaultBody)
    setEmailSuccessToast('')
    setDirectMailtoUrl('')
  }

  const handleSendDirectEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      alert('Please fill out Recipient, Subject, and Body.')
      return
    }
    setEmailSending(true)
    setEmailSuccessToast('')
    try {
      const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
      const recEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
      const candId = emailModalCandidate?.id || emailModalCandidate?.candidate_id || ''

      const res = await fetch('/api/recruiter/send-direct-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterEmail: recEmail,
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
          candidateName: emailModalCandidate?.name || '',
          candidateId: candId
        })
      })
      const data = await res.json()
      if (data.success) {
        setDirectMailtoUrl(data.mailtoUrl || '')
        if (data.serverDispatched) {
          setEmailSuccessToast(`✅ Email successfully sent to ${emailTo} directly from ${data.senderEmail}!`)
        } else {
          setEmailSuccessToast(`✅ Email prepared from ${data.senderEmail}. Dispatching via your default mail client...`)
          if (data.mailtoUrl) {
            window.location.href = data.mailtoUrl
          }
        }
        setTimeout(() => {
          setEmailModalCandidate(null)
          setEmailSuccessToast('')
        }, 3500)
      } else {
        alert('Failed to send email: ' + (data.message || 'Unknown error'))
      }
    } catch (err) {
      alert('Error sending email: ' + err.message)
    } finally {
      setEmailSending(false)
    }
  }

  const handleAssignCandidateToReq = async (cand, specificReqId = null) => {
    const targetReqId = specificReqId || cand.targetReqId || '159079'
    const cleanId = String(targetReqId).replace('J-', '').replace('REQ-', '').trim()
    const candName = cand.name || 'Candidate'
    const candId = cand.id || `875${Date.now().toString().slice(-4)}`
    const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
    const myRef = u.refCode || 'omkesh'

    const newSubObj = {
      id: candId,
      name: candName,
      email: cand.email,
      phone: cand.phone,
      payRate: cand.matchedJobRate || cand.payRate || '$75/hr',
      payRateType: cand.payRateType || 'C2C',
      assignedBy: myName,
      assignedOn: dateStr,
      status: 'Int-SubmittedToManager',
      statusComments: cand.isSpamRecovery
        ? 'Recovered from Email Spam folder & assigned to position'
        : `Assigned from ${cand.sourceCategory === 'careers_portal' ? 'Careers Job Site' : cand.sourceCategory === 'vendor_bench' ? 'Vendor Bench' : 'Email Inbox'}`,
      interview: 'Select',
      rejectedReason: '',
      recruiter: myName,
      recruiterEmail: myEmail,
      recruiterRefCode: myRef,
      addedByName: myName,
      addedByEmail: myEmail,
      addedByRole: 'recruiter',
      lastChangedBy: myName,
      lastChangedRole: 'Recruiter',
      lastChangedOn: dateStr,
      targetReqId: cleanId,
      matchScore: cand.matchScore || 95
    }

    try {
      const existingKey = `smarthire_potential_candidates_${cleanId}`
      const raw = localStorage.getItem(existingKey)
      let list = []
      if (raw) list = JSON.parse(raw) || []
      const updated = [newSubObj, ...list.filter(p => p.id !== candId && p.name !== candName)]
      localStorage.setItem(existingKey, JSON.stringify(updated))
      localStorage.setItem(`smarthire_potential_candidates_J-${cleanId}`, JSON.stringify(updated))

      saveRequisitionCandidates(cleanId, updated).catch(e => console.warn('Firestore req cand save error:', e))
      saveCandidate(candId, { ...cand, reqId: cleanId, name: candName, email: cand.email, status: 'Int-SubmittedToManager' }).catch(() => {})

      window.dispatchEvent(new CustomEvent('candidate-pushed-to-req', { detail: { reqId: cleanId, candidate: newSubObj } }))
    } catch (e) {}

    setAssignedToast(`✓ ${candName} successfully added to Requisition #${cleanId}!`)
    setTimeout(() => setAssignedToast(''), 5000)
  }

  const handleOpenCandidateChat = (cand) => {
    const threadId = cand.id || `cand-${cand.email}`
    const existing = threads.find(t => t.candidateId === threadId || (t.email && t.email.toLowerCase() === cand.email.toLowerCase()))
    if (existing) {
      setInboxViewMode('chat')
      selectThread(existing)
    } else {
      const newThread = {
        candidateId: threadId,
        candidateName: cand.name,
        jobTitle: cand.matchedJobTitle || cand.role || 'Requisition Candidate',
        lastMessage: cand.isSpamRecovery ? 'Recovered candidate from email spam folder' : 'Candidate received via email inbox',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        email: cand.email,
        phone: cand.phone,
        role: cand.role
      }
      setThreads(prev => [newThread, ...prev])
      setInboxViewMode('chat')
      selectThread(newThread)
    }
  }

  const handleViewCandidateProfile = (cand) => {
    const targetReq = cand.targetReqId || '159079'
    setDrawerReqId(targetReq)
    setResumeKeywordSearch('')
    setCandidateDetails({
      ...cand,
      candidateName: cand.name,
      email: cand.email,
      phone: cand.phone,
      location: cand.location,
      visaStatus: cand.visaStatus || cand.visa_status || 'US Citizen',
      resumeText: cand.resumeText || `RESUME: ${cand.name}\n${cand.role}\nLocation: ${cand.location}\nSkills: ${(cand.skills || []).join(', ')}\nExperience: ${cand.experience || '8+ Years'}\nContact: ${cand.email} | ${cand.phone}`,
      skills: cand.skills || [],
      jdMatch: {
        match_score: cand.matchScore || 95,
        matched_skills: cand.matchingSkills || cand.skills || [],
        missing_skills: cand.missingSkills || [],
        candidate_summary: `Candidate sourced via ${cand.source}. Matches ${cand.matchedJobTitle || 'open position'} with a fit score of ${cand.matchScore || 95}%.`
      }
    })
    setShowFullProfileModal(true)
  }

  // Load live open requisitions to power the Multi-Position AI Matcher
  useEffect(() => {
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        const jList = Array.isArray(data) ? data : (data.jobs || [])
        if (jList && jList.length > 0) {
          setOpenJobsList(prev => {
            const merged = [...prev]
            jList.forEach(j => {
              const jId = String(j.id || j.reqId || j.job_id || '').replace(/^J-/, '')
              if (jId && !merged.some(m => String(m.id) === jId)) {
                merged.push({
                  id: jId,
                  title: j.title || j.role || `Requisition #${jId}`,
                  client: j.client || j.department || 'Client',
                  rate: j.rate || j.payRate || j.budget || '$75/hr',
                  location: j.location || 'Remote',
                  skills: Array.isArray(j.skills) ? j.skills : (typeof j.skills === 'string' ? j.skills.split(',').map(s => s.trim()) : ['Java', 'SQL'])
                })
              }
            })
            return merged
          })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchStreamCandidates() }, [fetchStreamCandidates])
  useEffect(() => { fetchThreads() }, [fetchThreads])

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (activeThread) {
      pollingRef.current = setInterval(() => {
        fetchMessages(activeThread.candidateId, true)
        fetchThreads()
      }, POLL_INTERVAL)
    }
    return () => clearInterval(pollingRef.current)
  }, [activeThread, fetchMessages, fetchThreads])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const visibleThreads = threads.filter(t => {
    if (!t) return false
    if (recruiterFilter === 'all') return true
    const tRef = (t.refCode || t.referredBy || '').toLowerCase()
    const tEmail = (t.recruiterEmail || t.createdBy || '').toLowerCase()
    const tName = (t.recruiterName || '').toLowerCase()
    const target = recruiterFilter.toLowerCase()
    return tRef === target || tRef.includes(target) || tEmail.includes(target) || tName.includes(target) || target.includes(tRef)
  })

  const filteredThreads = visibleThreads.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (t.candidateName || '').toLowerCase().includes(q) ||
      (t.jobTitle || '').toLowerCase().includes(q) ||
      (t.lastMessage || '').toLowerCase().includes(q)
  })

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)
  const candidateName = activeThread?.candidateName || 'Candidate'
  const candidateJob = activeThread?.jobTitle || 'Vacancy'
  const profile = candidateDetails?.extracted_profile || candidateDetails

  const filteredCandidates = streamCandidates.filter(c => {
    if (!c) return false

    // Table Category filtering
    if (inboxSubMode === 'table') {
      if (tableCategory === 'inbox' && c.sourceCategory !== 'email_inbox') return false
      if (tableCategory === 'spam' && c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) return false
      if (tableCategory === 'careers' && c.sourceCategory !== 'careers_portal') return false
      if (tableCategory === 'vendor' && c.sourceCategory !== 'vendor_bench') return false
      if (tableCategory === 'favorites') {
        const candId = c.id || c.email
        if (!favoriteCandidateIds.has(candId)) return false
      }
    } else {
      // Monster+ Sub-Tabs (Matches / Favorites / Spam)
      if (candidateSubTab === 'favorites') {
        const candId = c.id || c.email
        if (!favoriteCandidateIds.has(candId)) return false
      } else if (candidateSubTab === 'spam') {
        if (c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) return false
      }

      // 1. Source filter
      if (streamFilter === 'email_inbox' && c.sourceCategory !== 'email_inbox') return false
      if (streamFilter === 'email_spam' && c.sourceCategory !== 'email_spam' && !c.isSpamRecovery) return false
      if (streamFilter === 'careers_portal' && c.sourceCategory !== 'careers_portal') return false
      if (streamFilter === 'vendor_bench' && c.sourceCategory !== 'vendor_bench') return false
    }

    // 2. Requisition filter
    if (streamReqFilter !== 'all' && String(c.targetReqId) !== String(streamReqFilter)) return false

    // 3. Search query
    if (streamSearch.trim()) {
      const q = streamSearch.toLowerCase()
      const n = (c.name || '').toLowerCase()
      const e = (c.email || '').toLowerCase()
      const r = (c.role || '').toLowerCase()
      const loc = (c.location || '').toLowerCase()
      const req = String(c.targetReqId || '').toLowerCase()
      const jTitle = (c.matchedJobTitle || '').toLowerCase()
      const sMatch = Array.isArray(c.skills) ? c.skills.some(s => String(s).toLowerCase().includes(q)) : String(c.skills || '').toLowerCase().includes(q)
      return n.includes(q) || e.includes(q) || r.includes(q) || loc.includes(q) || req.includes(q) || jTitle.includes(q) || sMatch
    }

    return true
  })

  // Ensure activeCandidate is always resolved and matched to active position
  const activeCandidate = selectedCandidate || (filteredCandidates.length > 0 ? filteredCandidates[0] : null)
  const activeCandidateIndex = filteredCandidates.findIndex(c =>
    (c.id && activeCandidate?.id && c.id === activeCandidate.id) ||
    (c.email && activeCandidate?.email && c.email === activeCandidate.email)
  )

  const handlePrevCandidate = () => {
    if (activeCandidateIndex > 0) {
      const prev = filteredCandidates[activeCandidateIndex - 1]
      setSelectedCandidate(prev)
      if (prev.targetReqId) setDrawerReqId(String(prev.targetReqId).replace(/^J-/, ''))
    }
  }

  const handleNextCandidate = () => {
    if (activeCandidateIndex >= 0 && activeCandidateIndex < filteredCandidates.length - 1) {
      const next = filteredCandidates[activeCandidateIndex + 1]
      setSelectedCandidate(next)
      if (next.targetReqId) setDrawerReqId(String(next.targetReqId).replace(/^J-/, ''))
    }
  }

  const handleShareCandidate = (cand) => {
    if (!cand) return
    const text = `Candidate: ${cand.name} | Role: ${cand.role || 'Specialist'} | Experience: ${cand.experience || '8+ Years'} | Location: ${cand.location} | Visa: ${cand.visaStatus || 'US Citizen'} | Contact: ${cand.email} (${cand.phone || 'N/A'})`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setShareToast(`✓ Candidate summary for ${cand.name} copied to clipboard!`)
        setTimeout(() => setShareToast(''), 4000)
      }).catch(() => {
        setShareToast(`✓ Candidate summary for ${cand.name} prepared!`)
        setTimeout(() => setShareToast(''), 4000)
      })
    } else {
      setShareToast(`✓ Candidate summary for ${cand.name} prepared!`)
      setTimeout(() => setShareToast(''), 4000)
    }
  }

  const currentReqId = String(drawerReqId || activeCandidate?.targetReqId || '159079').replace(/^J-/, '')
  const activeTargetJob = openJobsList.find(j => String(j.id) === currentReqId) || openJobsList[0]

  const candSkillsList = activeCandidate ? (Array.isArray(activeCandidate.skills) ? activeCandidate.skills : (activeCandidate.skills ? String(activeCandidate.skills).split(',').map(s => s.trim()) : [])) : []
  const reqSkillsList = activeTargetJob?.skills || ['Java', 'SQL']
  const candResumeText = activeCandidate ? getFullResumeText(activeCandidate) : ''
  const candidateCorpus = (candResumeText + ' ' + candSkillsList.join(' ')).toLowerCase()

  const dynamicMatchingSkills = reqSkillsList.filter(sk => {
    const sLower = sk.toLowerCase()
    return candidateCorpus.includes(sLower) || candSkillsList.some(cs => cs.toLowerCase().includes(sLower) || sLower.includes(cs.toLowerCase()))
  })

  const dynamicMissingSkills = reqSkillsList.filter(sk => !dynamicMatchingSkills.includes(sk))
  const calculatedFitScore = activeTargetJob && reqSkillsList.length > 0
    ? Math.min(99, Math.max(65, Math.round((dynamicMatchingSkills.length / reqSkillsList.length) * 100)))
    : (activeCandidate?.matchScore || 92)

  const candidateFrequencies = activeCandidate ? getSkillFrequencies(candResumeText, candSkillsList) : []

  const handleApplyEmailTemplate = (key) => {
    if (!emailModalCandidate) return
    const candFirstName = (emailModalCandidate.name || emailModalCandidate.candidateName || 'Candidate').split(' ')[0]
    const u = JSON.parse(localStorage.getItem('smarthire_user') || '{}')
    const myName = u.name || currentUser?.name || 'Omkesh Manjute'
    const myEmail = u.email || currentUser?.email || 'omkesh@coolsofttech.com'
    const targetReq = emailModalCandidate.targetReqId || drawerReqId || '159079'
    const jobTitle = emailModalCandidate.matchedJobTitle || activeTargetJob?.title || 'Open Position'
    const jobClient = emailModalCandidate.matchedJobClient || activeTargetJob?.client || 'State Agency'
    const jobRate = emailModalCandidate.matchedJobRate || activeTargetJob?.rate || '$75/hr'

    if (key === 'rtr') {
      setEmailSubject(`Right to Represent (RTR) Authorization: ${jobTitle} (Req #${targetReq})`)
      setEmailBody(`Hi ${candFirstName},\n\nPlease confirm your authorization for COOLSOFT LLC to represent you exclusively for the following client opportunity:\n\n- Position: ${jobTitle}\n- Requisition ID: Req #${targetReq}\n- Client: ${jobClient}\n- Proposed Rate: ${jobRate}\n\nBy replying 'I AUTHORIZE COOLSOFT LLC TO SUBMIT MY PROFILE FOR REQ #${targetReq}', you grant us permission to present your resume and credentials to the client.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    } else if (key === 'screen') {
      setEmailSubject(`Technical Screening Call: ${jobTitle} (Req #${targetReq}) | COOLSOFT LLC`)
      setEmailBody(`Hi ${candFirstName},\n\nWe reviewed your credentials for the ${jobTitle} role and would like to schedule a 15-minute technical pre-screening call.\n\nPlease let us know your earliest availability today or tomorrow (EDT / CDT).\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    } else if (key === 'rate') {
      setEmailSubject(`Rate & Work Authorization Confirmation: ${jobTitle} (Req #${targetReq})`)
      setEmailBody(`Hi ${candFirstName},\n\nPrior to client submittal for ${jobTitle} (Req #${targetReq}), please confirm:\n1. Your final all-inclusive C2C or W2 hourly rate.\n2. Your current visa / work authorization copy.\n3. Your current location and relocation willingness.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    } else if (key === 'interview') {
      setEmailSubject(`Client Interview Shortlist: ${jobTitle} (Req #${targetReq}) - COOLSOFT LLC`)
      setEmailBody(`Hi ${candFirstName},\n\nGreat news! The client (${jobClient}) has shortlisted your profile for an interview for the ${jobTitle} position.\n\nPlease confirm your availability for a 45-minute video interview this week and provide 2-3 preferred time slots.\n\nWith Regards,\n${myName}\nLead Recruiter\nCOOLSOFT LLC | ${myEmail}\nhttp://www.coolsofttech.com`)
    }
  }

  const toggleFavorite = (candId, e) => {
    e?.stopPropagation()
    setFavoriteCandidateIds(prev => {
      const next = new Set(prev)
      if (next.has(candId)) next.delete(candId)
      else next.add(candId)
      return next
    })
  }

  const toggleSelectCard = (candId, e) => {
    e?.stopPropagation()
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      if (next.has(candId)) next.delete(candId)
      else next.add(candId)
      return next
    })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', backgroundColor:C.bg, fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", color:C.textPrimary, overflow:'hidden' }}>
      {/* Top Navbar */}
      <header style={{ backgroundColor:C.headerBg, backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.border}`, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64, flexShrink:0, boxShadow:C.shadow, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/ats')} style={{ background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 12px', cursor:'pointer', color:C.textSecondary, fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }} title="Back to ATS">
            <IconArrowLeft /> Back to ATS
          </button>
          <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#2563EB,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <IconChat />
          </div>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:C.textPrimary, lineHeight:1.2 }}>
              Talent Stream & Recruiter Inbox
            </div>
            <div style={{ fontSize:11, color:C.textSecondary }}>
              Auto-matched resumes & candidate communications
            </div>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 24, padding: 3, gap: 4 }}>
          <button
            onClick={() => { setInboxViewMode('stream'); setInboxSubMode('card'); }}
            style={{
              background: (inboxViewMode === 'stream' && inboxSubMode === 'card') ? '#2563EB' : 'transparent',
              color: (inboxViewMode === 'stream' && inboxSubMode === 'card') ? '#FFF' : C.textSecondary,
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: (inboxViewMode === 'stream' && inboxSubMode === 'card') ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <IconIdCard /> <span>Candidate Card</span>
          </button>

          <button
            onClick={() => { setInboxViewMode('stream'); setInboxSubMode('table'); }}
            style={{
              background: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? '#2563EB' : 'transparent',
              color: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? '#FFF' : C.textSecondary,
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <IconTable /> <span>Database Table</span>
            <span style={{
              fontSize: 11,
              background: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? 'rgba(255,255,255,0.25)' : isLight ? '#E2E8F0' : '#334155',
              color: (inboxViewMode === 'stream' && inboxSubMode === 'table') ? '#FFF' : C.textPrimary,
              padding: '1px 7px',
              borderRadius: 10,
              fontWeight: 800
            }}>
              {streamCandidates.length}
            </span>
          </button>

          <button
            onClick={() => setInboxViewMode('chat')}
            style={{
              background: inboxViewMode === 'chat' ? '#2563EB' : 'transparent',
              color: inboxViewMode === 'chat' ? '#FFF' : C.textSecondary,
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: inboxViewMode === 'chat' ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <IconChat /> <span>Live Messages</span>
            {totalUnread > 0 ? (
              <span style={{ fontSize: 11, background: '#EF4444', color: '#FFF', padding: '1px 7px', borderRadius: 10, fontWeight: 800 }}>
                {totalUnread}
              </span>
            ) : (
              <span style={{
                fontSize: 11,
                background: inboxViewMode === 'chat' ? 'rgba(255,255,255,0.25)' : isLight ? '#E2E8F0' : '#334155',
                color: inboxViewMode === 'chat' ? '#FFF' : C.textPrimary,
                padding: '1px 7px',
                borderRadius: 10,
                fontWeight: 800
              }}>
                {visibleThreads.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Action Cluster */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {shareToast && (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '5px 12px', borderRadius: 8, animation: 'fadeIn 0.2s ease-in-out' }}>
              {shareToast}
            </span>
          )}
          {assignedToast && (
            <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '5px 12px', borderRadius: 8, animation: 'fadeIn 0.2s ease-in-out' }}>
              {assignedToast}
            </span>
          )}
          {emailSyncToast && (
            <span style={{ fontSize: 12, fontWeight: 700, color: emailSyncToast.includes('Failed') ? '#dc2626' : '#16a34a', background: emailSyncToast.includes('Failed') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${emailSyncToast.includes('Failed') ? '#fca5a5' : '#bbf7d0'}`, padding: '5px 12px', borderRadius: 8 }}>
              {emailSyncToast}
            </span>
          )}

          {/* Scoping Telemetry Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isLight ? '#F0FDF4' : 'rgba(34,197,94,0.1)', border: '1px solid #BBF7D0', padding: '5px 12px', borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#15803D' }}>
              🔒 Private Workspace: {currentUser?.name || 'Omkesh Manjute'}
            </span>
          </div>

          <button
            onClick={handleSyncEmailResumes}
            disabled={syncingEmailResumes}
            style={{
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(22,163,74,0.25)'
            }}
            title="Scan recruiter email inbox & spam folder for candidate resumes and auto-match to active requisitions"
          >
            <span>⚡</span> {syncingEmailResumes ? 'Scanning Inbox & Spam...' : 'Scan Inbox & Spam'}
          </button>

          <button onClick={() => { const m = themeMode==='light'?'dark':'light'; setThemeMode(m); localStorage.setItem('smarthire_theme',m) }} style={{ background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color:C.textPrimary, display:'inline-flex', alignItems:'center', gap:6 }}>
            {isLight ? <><IconMoon /> Dark</> : <><IconSun /> Light</>}
          </button>
        </div>
      </header>

      {/* CANDIDATE TALENT STREAM VIEW (TOBU.AI MASTER-DETAIL & TABLE MODES) */}
      {inboxViewMode === 'stream' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* A. TOBU.AI CANDIDATE CARD DETAIL VIEW (MATCHING media_1789068769296.png & media_1789068785299.png) */}
          {inboxSubMode === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              {/* Tobu Sticky Top Action Bar */}
              <div style={{
                padding: '10px 24px',
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: C.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                flexShrink: 0
              }}>
                {/* Left: Previous / Next Candidate Navigation & Table View Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handlePrevCandidate}
                    disabled={activeCandidateIndex <= 0}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: activeCandidateIndex <= 0 ? C.textSecondary : C.textPrimary,
                      opacity: activeCandidateIndex <= 0 ? 0.5 : 1,
                      cursor: activeCandidateIndex <= 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Previous Candidate"
                  >
                    <IconChevronLeft /> <span>Prev Candidate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextCandidate}
                    disabled={activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: (activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1) ? C.textSecondary : C.textPrimary,
                      opacity: (activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1) ? 0.5 : 1,
                      cursor: (activeCandidateIndex < 0 || activeCandidateIndex >= filteredCandidates.length - 1) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Next Candidate"
                  >
                    <span>Next Candidate</span> <IconChevronRight />
                  </button>

                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textSecondary,
                    background: C.inputBg,
                    border: `1px solid ${C.border}`,
                    padding: '4px 10px',
                    borderRadius: 14
                  }}>
                    {filteredCandidates.length > 0 ? `Candidate ${activeCandidateIndex + 1} of ${filteredCandidates.length}` : '0 Candidates'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setInboxSubMode('table')}
                    style={{
                      background: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                      color: '#2563EB',
                      border: '1px solid #BFDBFE',
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Switch to Database Table View"
                  >
                    <IconTable /> <span>View Database Table</span>
                  </button>
                </div>

                {/* Right Action Cluster: Transfer, Email, Share, Download */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleAssignCandidateToReq(activeCandidate, currentReqId)}
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                    }}
                    title={`Assign to Requisition #${currentReqId}`}
                  >
                    <span>💼</span> <span>Transfer to Job (Req #{currentReqId})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(activeCandidate)}
                    style={{
                      background: '#7C3AED',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(124,58,237,0.3)'
                    }}
                    title={`Draft email to ${activeCandidate?.name} from ${currentUser?.email || 'omkesh@coolsofttech.com'}`}
                  >
                    <IconMail /> <span>✉️ Email Candidate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareCandidate(activeCandidate)}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Share Candidate via Email"
                  >
                    <IconShare /> <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!activeCandidate) return
                      const element = document.createElement('a')
                      const file = new Blob([candResumeText], { type: 'text/plain' })
                      element.href = URL.createObjectURL(file)
                      element.download = `${(activeCandidate.name || 'Candidate').replace(/\s+/g, '_')}_Resume.txt`
                      document.body.appendChild(element)
                      element.click()
                    }}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '7px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.textPrimary,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Download Full Resume"
                  >
                    <IconDownload /> <span>Download Resume</span>
                  </button>
                </div>
              </div>

              {/* Tobu Candidate Card Split View */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: C.bg }}>
                
                {/* LEFT SIDEBAR: Candidate Dossier (~290px) */}
                <div style={{
                  width: 300,
                  minWidth: 280,
                  maxWidth: 340,
                  flexShrink: 0,
                  borderRight: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  overflowY: 'auto',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  {/* Skill tags with '+' */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {candSkillsList.slice(0, 5).map((sk, idx) => (
                      <span key={idx} style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#2563EB',
                        backgroundColor: isLight ? '#EFF6FF' : 'rgba(37,99,235,0.15)',
                        border: '1px solid #BFDBFE',
                        borderRadius: 14,
                        padding: '2px 9px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}>
                        {sk.toLowerCase()} +
                      </span>
                    ))}
                  </div>

                  {/* Action Icons Row: Edit, Team, Chat */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
                    <button
                      type="button"
                      onClick={() => handleAssignCandidateToReq(activeCandidate, currentReqId)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: C.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Quick Edit / Re-assign"
                    >
                      <IconPencil />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAssignCandidateToReq(activeCandidate, currentReqId)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: C.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Assign Candidate to Team / Requisition"
                    >
                      <IconUsers />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenCandidateChat(activeCandidate)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Open Candidate Conversation"
                    >
                      <IconChat />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(activeCandidate?.id || activeCandidate?.email, e)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Toggle Favorite"
                    >
                      <IconStar filled={favoriteCandidateIds.has(activeCandidate?.id || activeCandidate?.email)} />
                    </button>
                  </div>

                  {/* Candidate Name & Contact Details */}
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: C.textPrimary, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                      {activeCandidate?.name || 'Candidate Profile'}
                    </h2>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 10 }}>
                      {activeCandidate?.role || 'Senior Specialist'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {activeCandidate?.email && (
                        <a
                          href={`mailto:${activeCandidate.email}`}
                          style={{ fontSize: 12.5, fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}
                        >
                          <IconMail /> <span>{activeCandidate.email}</span>
                        </a>
                      )}

                      {activeCandidate?.phone && (
                        <a
                          href={`tel:${activeCandidate.phone}`}
                          style={{ fontSize: 12, color: C.textSecondary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <IconPhone /> <span>{activeCandidate.phone}</span>
                        </a>
                      )}

                      <a
                        href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(activeCandidate?.name || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#0A66C2',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 4
                        }}
                      >
                        <span>🔍</span> <span>Search on LinkedIn ↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Tobu Detailed Candidate Information Table */}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Gender</span>
                      <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeCandidate?.gender || 'Male (mostly)'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Total work experience</span>
                      <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeCandidate?.experience || '10+ Years'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Current location</span>
                      <strong style={{ color: C.textPrimary, fontSize: 12.5 }}>{activeCandidate?.location || 'United States'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Work Permit / Visa Status</span>
                      <strong style={{ color: '#16A34A', fontSize: 12.5 }}>{activeCandidate?.visaStatus || 'US Citizen'}</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Target Requisition</span>
                      <strong style={{ color: '#2563EB', fontSize: 12.5 }}>Req #{currentReqId} · {activeTargetJob?.title?.slice(0, 24)}...</strong>
                    </div>

                    <div>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>AI Fit Match</span>
                      <strong style={{ color: '#D97706', fontSize: 12.5 }}>🔥 {calculatedFitScore}% Fit</strong>
                    </div>

                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: C.textSecondary, display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Source Channel</span>
                      {activeCandidate?.isSpamRecovery ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          🛡️ Recovered from Spam Folder
                        </span>
                      ) : activeCandidate?.sourceCategory === 'careers_portal' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          🌐 Careers Portal (/jobs)
                        </span>
                      ) : activeCandidate?.sourceCategory === 'vendor_bench' ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#7E22CE', background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          🏢 Vendor Bench Partner
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                          📧 Recruiter Email Inbox
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* RIGHT CANVAS: Tobu Tabs & Dedicated Paper Resume Sheet */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: isLight ? '#F8FAFC' : '#0B0F17' }}>
                  
                  {/* Tobu Tabs Navigation Strip */}
                  <div style={{
                    padding: '0 24px',
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: C.surface,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexShrink: 0
                  }}>
                    {[
                      { id: 'analytics', label: 'Analytics', icon: '📊' },
                      { id: 'resume', label: 'Resume', icon: '📄' },
                      { id: 'comments', label: 'Comments', icon: '💬' },
                      { id: 'emails', label: 'Emails', icon: '✉️' },
                      { id: 'activity', label: 'Activity', icon: '⏱️' }
                    ].map(tab => {
                      const isActive = activeTobuTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTobuTab(tab.id)}
                          style={{
                            background: 'transparent',
                            color: isActive ? '#2563EB' : C.textSecondary,
                            border: 'none',
                            borderBottom: isActive ? '3px solid #2563EB' : '3px solid transparent',
                            padding: '12px 16px',
                            fontSize: 13,
                            fontWeight: isActive ? 800 : 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s'
                          }}
                        >
                          <span>{tab.icon}</span> <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Tab Body Canvas */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
                    
                    {/* 1. RESUME TAB */}
                    {activeTobuTab === 'resume' && (
                      <div style={{ maxWidth: 940, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        
                        {/* Top Skill Occurrence Frequency Bar (Matching Tobu.ai Screenshot) */}
                        <div style={{
                          backgroundColor: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '12px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              Top Keyword Frequency:
                            </span>
                            {candidateFrequencies.length > 0 ? (
                              candidateFrequencies.map((sk, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#047857',
                                    backgroundColor: isLight ? '#ECFDF5' : 'rgba(5,150,105,0.15)',
                                    border: '1px solid #A7F3D0',
                                    borderRadius: 16,
                                    padding: '2px 9px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  {sk.name.toLowerCase()} ({sk.count} {sk.count === 1 ? 'time' : 'times'})
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: 11.5, color: C.textSecondary, fontStyle: 'italic' }}>
                                Parsing skill frequencies from candidate resume...
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const element = document.createElement('a')
                              const file = new Blob([candResumeText], { type: 'text/plain' })
                              element.href = URL.createObjectURL(file)
                              element.download = `${(activeCandidate?.name || 'Candidate').replace(/\s+/g, '_')}_Resume.txt`
                              document.body.appendChild(element)
                              element.click()
                            }}
                            style={{
                              background: 'transparent',
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              padding: '5px 12px',
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: C.textPrimary,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <IconDownload /> <span>Download Resume</span>
                          </button>
                        </div>

                        {/* Tobu.ai Metadata Table (Resume Uploader | Method | Source | Received On) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          backgroundColor: C.surface,
                          overflow: 'hidden'
                        }}>
                          <div style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Resume Uploader</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.recruiterName || currentUser?.name || 'Omkesh Manjute'}
                              <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 500 }}>({activeCandidate?.recruiterEmail || currentUser?.email || 'omkesh@coolsofttech.com'})</div>
                            </div>
                          </div>

                          <div style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Method of Upload</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.isSpamRecovery ? 'Email Spam Harvest' : activeCandidate?.sourceCategory === 'careers_portal' ? 'Careers Job Portal' : activeCandidate?.sourceCategory === 'vendor_bench' ? 'Vendor Submittal' : 'Email Parser'}
                            </div>
                          </div>

                          <div style={{ padding: '10px 14px', borderRight: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Source</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.source || 'Yahoo Small Business (omkesh@coolsofttech.com)'}
                            </div>
                          </div>

                          <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Received On</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.textPrimary, marginTop: 3 }}>
                              {activeCandidate?.createdAt ? new Date(activeCandidate.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '10th Sep, 2026, 09:42 PM'}
                            </div>
                          </div>
                        </div>

                        {/* AI Requisition Match & Highlight Toolbar */}
                        <div style={{
                          backgroundColor: C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '10px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>
                              🎯 Target Requisition:
                            </span>
                            <select
                              value={currentReqId}
                              onChange={e => setDrawerReqId(e.target.value)}
                              style={{
                                background: C.inputBg,
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: C.textPrimary,
                                outline: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              {openJobsList.map(j => (
                                <option key={j.id} value={j.id}>
                                  Req #{j.id} · {j.title.slice(0, 36)}... ({j.rate})
                                </option>
                              ))}
                            </select>

                            <span style={{
                              fontSize: 11.5,
                              fontWeight: 900,
                              color: calculatedFitScore >= 85 ? '#15803D' : '#B45309',
                              backgroundColor: calculatedFitScore >= 85 ? '#DCFCE7' : '#FEF3C7',
                              border: `1px solid ${calculatedFitScore >= 85 ? '#86EFAC' : '#FDE68A'}`,
                              padding: '2px 8px',
                              borderRadius: 4
                            }}>
                              🔥 {calculatedFitScore}% Match Fit
                            </span>

                            <span style={{ fontSize: 11, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 4, fontWeight: 800, border: '1px solid #FDE68A' }}>
                              💡 Matching skills highlighted in yellow
                            </span>
                          </div>

                          {/* In-Resume Search Input */}
                          <div style={{ position: 'relative', width: 220 }}>
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                              <IconSearch />
                            </span>
                            <input
                              value={resumeKeywordSearch}
                              onChange={e => setResumeKeywordSearch(e.target.value)}
                              placeholder="Find in resume..."
                              style={{
                                width: '100%',
                                background: C.inputBg,
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                padding: '5px 8px 5px 28px',
                                fontSize: 11.5,
                                color: C.textPrimary,
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>

                        {/* Matching Skills Chips */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
                          <span style={{ fontWeight: 800, color: '#15803D' }}>Matching Skills:</span>
                          {dynamicMatchingSkills.length > 0 ? (
                            dynamicMatchingSkills.map((sk, i) => (
                              <span key={i} style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '1px 7px', borderRadius: 3, fontWeight: 700 }}>
                                ✓ {sk}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: C.textSecondary, fontStyle: 'italic' }}>None matched</span>
                          )}

                          {dynamicMissingSkills.length > 0 && (
                            <>
                              <span style={{ fontWeight: 800, color: '#DC2626', marginLeft: 8 }}>Missing Skills:</span>
                              {dynamicMissingSkills.map((sk, i) => (
                                <span key={i} style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '1px 7px', borderRadius: 3, fontWeight: 700 }}>
                                  ✗ {sk}
                                </span>
                              ))}
                            </>
                          )}
                        </div>

                        {/* Full Paper Resume Sheet */}
                        {highlightResumeText(candResumeText, dynamicMatchingSkills, resumeKeywordSearch)}
                      </div>
                    )}

                    {/* 2. ANALYTICS TAB */}
                    {activeTobuTab === 'analytics' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                            📊 AI Fit & Competency Analytics
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>Position Alignment</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB', marginTop: 2 }}>{activeTargetJob?.title}</div>
                              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>Pay Rate: {activeTargetJob?.rate} • Client: {activeTargetJob?.client}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, textTransform: 'uppercase' }}>Overall Requisition Match</div>
                              <div style={{ fontSize: 24, fontWeight: 900, color: calculatedFitScore >= 80 ? '#16A34A' : '#D97706', marginTop: 2 }}>{calculatedFitScore}%</div>
                              <div style={{ fontSize: 11.5, color: C.textSecondary }}>{dynamicMatchingSkills.length} of {reqSkillsList.length} required skills matched</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                            🛡️ Compliance &amp; Verification Audit
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                            <div><strong>Driver's License OCR:</strong> <span style={{ color: '#16A34A' }}>✓ Match Verified</span></div>
                            <div><strong>Biometric Selfie:</strong> <span style={{ color: '#16A34A' }}>✓ Match Passed (98%)</span></div>
                            <div><strong>US Work Authorization:</strong> <span style={{ color: '#16A34A' }}>✓ Active ({activeCandidate?.visaStatus || 'US Citizen'})</span></div>
                            <div><strong>Origin Folder:</strong> <span>{activeCandidate?.folder || 'INBOX'}</span></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. COMMENTS TAB */}
                    {activeTobuTab === 'comments' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                            💬 Internal Recruiter Screening Notes
                          </h4>
                          <textarea
                            placeholder="Add recruiter screening notes, interview feedback, or manager review comments..."
                            style={{
                              width: '100%',
                              minHeight: 120,
                              background: C.inputBg,
                              border: `1px solid ${C.border}`,
                              borderRadius: 8,
                              padding: 12,
                              fontSize: 13,
                              color: C.textPrimary,
                              outline: 'none',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignedToast('✓ Note saved to candidate audit record!')
                                setTimeout(() => setAssignedToast(''), 4000)
                              }}
                              style={{ background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. EMAILS TAB */}
                    {activeTobuTab === 'emails' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.textPrimary }}>
                              ✉️ Email Activity &amp; RTR Communications
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleOpenEmailModal(activeCandidate)}
                              style={{ background: '#7C3AED', color: '#FFF', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
                            >
                              + New Email
                            </button>
                          </div>
                          <div style={{ fontSize: 12.5, color: C.textSecondary, lineHeight: 1.6 }}>
                            <div><strong>Recipient:</strong> {activeCandidate?.email}</div>
                            <div><strong>Sender:</strong> {currentUser?.email || 'omkesh@coolsofttech.com'} (COOLSOFT LLC)</div>
                            <div><strong>Status:</strong> Ready for client submittal / RTR authorization</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. ACTIVITY TAB */}
                    {activeTobuTab === 'activity' && (
                      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                          { title: 'Candidate Ingested into ATS', time: '10th Sep 2026, 09:42 PM', desc: `Ingested from ${activeCandidate?.source || 'Email Inbox'} by ${currentUser?.name || 'Omkesh Manjute'}` },
                          { title: 'AI Match Calculated', time: '10th Sep 2026, 09:43 PM', desc: `Fit score calculated at ${calculatedFitScore}% for Req #${currentReqId} (${activeTargetJob?.title})` },
                          { title: 'Profile Viewed', time: 'Just now', desc: `Profile inspected by ${currentUser?.name || 'Omkesh Manjute'}` }
                        ].map((act, i) => (
                          <div key={i} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', marginTop: 5 }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>{act.title}</div>
                              <div style={{ fontSize: 11, color: C.textSecondary }}>{act.time}</div>
                              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 3 }}>{act.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* B. TOBU.AI DATABASE TABLE VIEW (MATCHING media_1789068954400.png) */}
          {inboxSubMode === 'table' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: C.bg }}>
              
              {/* Left Mailbox / Origin Sidebar (~240px) */}
              <div style={{
                width: 240,
                minWidth: 220,
                flexShrink: 0,
                borderRight: `1px solid ${C.border}`,
                backgroundColor: C.surface,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                      <IconSearch />
                    </span>
                    <input
                      placeholder="Search mailboxes..."
                      style={{
                        width: '100%',
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 8px 6px 28px',
                        fontSize: 11.5,
                        color: C.textPrimary,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Mailboxes list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[
                    { id: 'all', label: 'Entire Database', icon: '📁', count: streamCandidates.length },
                    { id: 'inbox', label: 'Resume Emails', icon: '📥', count: streamCandidates.filter(c => c.sourceCategory === 'email_inbox').length },
                    { id: 'spam', label: 'Spam / Recovered', icon: '🛡️', count: streamCandidates.filter(c => c.sourceCategory === 'email_spam' || c.isSpamRecovery).length },
                    { id: 'careers', label: 'Careers Portal', icon: '🌐', count: streamCandidates.filter(c => c.sourceCategory === 'careers_portal').length },
                    { id: 'vendor', label: 'Vendor Bench', icon: '🏢', count: streamCandidates.filter(c => c.sourceCategory === 'vendor_bench').length },
                    { id: 'favorites', label: 'Starred Favorites', icon: '⭐', count: favoriteCandidateIds.size }
                  ].map(cat => {
                    const isSelected = tableCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setTableCategory(cat.id); setTablePage(1); }}
                        style={{
                          background: isSelected ? (isLight ? '#EFF6FF' : 'rgba(37,99,235,0.18)') : 'transparent',
                          color: isSelected ? '#2563EB' : C.textPrimary,
                          border: `1px solid ${isSelected ? '#BFDBFE' : 'transparent'}`,
                          borderRadius: 6,
                          padding: '8px 12px',
                          fontSize: 12.5,
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{cat.icon}</span> <span>{cat.label}</span>
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: isSelected ? '#2563EB' : C.textSecondary,
                          background: isSelected ? (isLight ? '#DBEAFE' : 'rgba(37,99,235,0.25)') : C.inputBg,
                          padding: '1px 6px',
                          borderRadius: 10
                        }}>
                          {cat.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Table Canvas */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Table Top Toolbar */}
                <div style={{
                  padding: '12px 24px',
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  flexShrink: 0
                }}>
                  {/* Left: Bulk Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary }}>
                      {selectedCardIds.size} candidates selected
                    </span>

                    {selectedCardIds.size > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          selectedCardIds.forEach(id => {
                            const c = streamCandidates.find(item => item.id === id || item.email === id)
                            if (c) handleAssignCandidateToReq(c, currentReqId)
                          })
                        }}
                        style={{
                          background: '#2563EB',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        💼 Transfer Selected to Req #{currentReqId}
                      </button>
                    )}
                  </div>

                  {/* Right: Filters & View Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <select
                      value={streamReqFilter}
                      onChange={e => setStreamReqFilter(e.target.value)}
                      style={{
                        background: C.inputBg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textPrimary,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">🎯 All Open Requisitions</option>
                      {openJobsList.map(j => (
                        <option key={j.id} value={j.id}>
                          Req #{j.id} · {j.title.slice(0, 28)}...
                        </option>
                      ))}
                    </select>

                    <div style={{ position: 'relative', width: 260 }}>
                      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                        <IconSearch />
                      </span>
                      <input
                        value={streamSearch}
                        onChange={e => setStreamSearch(e.target.value)}
                        placeholder="Search candidate name, role, skills, location..."
                        style={{
                          width: '100%',
                          background: C.inputBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: '6px 8px 6px 28px',
                          fontSize: 12,
                          color: C.textPrimary,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setInboxSubMode('card')}
                      style={{
                        background: '#2563EB',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                      title="Switch to Candidate Card View"
                    >
                      <IconIdCard /> <span>Candidate Card View</span>
                    </button>
                  </div>
                </div>

                {/* Table Area */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ backgroundColor: isLight ? '#F8FAFC' : '#1E293B', borderBottom: `1px solid ${C.border}`, color: C.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        <th style={{ padding: '10px 14px', width: 36 }}>
                          <input
                            type="checkbox"
                            checked={selectedCardIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCardIds(new Set(filteredCandidates.map(c => c.id || c.email)))
                              } else {
                                setSelectedCardIds(new Set())
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '10px 14px' }}>Candidate Name & Role</th>
                        <th style={{ padding: '10px 14px' }}>Source / Mailbox</th>
                        <th style={{ padding: '10px 14px' }}>Target Job & Fit</th>
                        <th style={{ padding: '10px 14px' }}>Top Skills</th>
                        <th style={{ padding: '10px 14px' }}>Location & Visa</th>
                        <th style={{ padding: '10px 14px' }}>Received Date</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: C.textSecondary }}>
                            No candidates found in this database mailbox.
                          </td>
                        </tr>
                      ) : (
                        filteredCandidates
                          .slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)
                          .map((c, idx) => {
                            const candId = c.id || c.email || `cand-${idx}`
                            const isSelected = selectedCardIds.has(candId)
                            const skillsArr = Array.isArray(c.skills) ? c.skills : (c.skills ? String(c.skills).split(',').map(s => s.trim()) : [])
                            
                            return (
                              <tr
                                key={candId}
                                style={{
                                  borderBottom: `1px solid ${C.border}`,
                                  backgroundColor: isSelected ? (isLight ? '#EFF6FF' : 'rgba(37,99,235,0.12)') : 'transparent',
                                  transition: 'background 0.15s'
                                }}
                              >
                                <td style={{ padding: '12px 14px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleSelectCard(candId, e)}
                                  />
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div
                                    onClick={() => {
                                      setSelectedCandidate(c)
                                      setInboxSubMode('card')
                                    }}
                                    style={{ fontSize: 13.5, fontWeight: 800, color: '#2563EB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                    title="Open Candidate Card"
                                  >
                                    <span>{c.name}</span> <IconExternalLink />
                                  </div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, marginTop: 2 }}>
                                    {c.role || 'Senior Specialist'}
                                  </div>
                                  <div style={{ fontSize: 11, color: C.textSecondary }}>
                                    {c.email} {c.phone ? `• ${c.phone}` : ''}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  {c.isSpamRecovery ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '2px 7px', borderRadius: 4 }}>
                                      🛡️ Spam Recovered
                                    </span>
                                  ) : c.sourceCategory === 'careers_portal' ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 7px', borderRadius: 4 }}>
                                      🌐 Careers Portal
                                    </span>
                                  ) : c.sourceCategory === 'vendor_bench' ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7E22CE', background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '2px 7px', borderRadius: 4 }}>
                                      🏢 Vendor Bench
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 7px', borderRadius: 4 }}>
                                      📧 Email Inbox
                                    </span>
                                  )}
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>
                                    Req #{c.targetReqId || '159079'}
                                  </div>
                                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>
                                    🔥 {c.matchScore || 95}% Fit
                                  </span>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                                    {skillsArr.slice(0, 3).map((sk, sIdx) => (
                                      <span key={sIdx} style={{ fontSize: 10.5, background: C.inputBg, border: `1px solid ${C.border}`, padding: '1px 6px', borderRadius: 3, color: C.textSecondary }}>
                                        {sk}
                                      </span>
                                    ))}
                                    {skillsArr.length > 3 && (
                                      <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700 }}>
                                        +{skillsArr.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontSize: 12, color: C.textPrimary }}>{c.location || 'United States'}</div>
                                  <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>{c.visaStatus || 'US Citizen'}</div>
                                </td>

                                <td style={{ padding: '12px 14px', fontSize: 11.5, color: C.textSecondary }}>
                                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 10, 2026'}
                                </td>

                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCandidate(c)
                                        setInboxSubMode('card')
                                      }}
                                      style={{
                                        background: C.inputBg,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        color: C.textPrimary
                                      }}
                                      title="View Candidate Card & Resume"
                                    >
                                      👁️ Card
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEmailModal(c)}
                                      style={{
                                        background: '#7C3AED',
                                        color: '#FFF',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                      title="Draft Email"
                                    >
                                      ✉️
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleAssignCandidateToReq(c, currentReqId)}
                                      style={{
                                        background: '#16A34A',
                                        color: '#FFF',
                                        border: 'none',
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                      title={`Add to Req #${currentReqId}`}
                                    >
                                      ➕
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Footer */}
                <div style={{
                  padding: '10px 24px',
                  borderTop: `1px solid ${C.border}`,
                  backgroundColor: C.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: C.textSecondary,
                  flexShrink: 0
                }}>
                  <div>
                    Showing {filteredCandidates.length === 0 ? 0 : (tablePage - 1) * tablePageSize + 1} to {Math.min(tablePage * tablePageSize, filteredCandidates.length)} of {filteredCandidates.length} candidates
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>Results per page: <strong>{tablePageSize}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setTablePage(p => Math.max(1, p - 1))}
                        disabled={tablePage === 1}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: `1px solid ${C.border}`,
                          backgroundColor: tablePage === 1 ? C.inputBg : C.surface,
                          cursor: tablePage === 1 ? 'not-allowed' : 'pointer',
                          color: tablePage === 1 ? C.textSecondary : C.textPrimary,
                          fontSize: 12
                        }}
                      >
                        Prev
                      </button>
                      <span style={{ fontWeight: 600 }}>Page {tablePage} of {Math.max(1, Math.ceil(filteredCandidates.length / tablePageSize))}</span>
                      <button
                        type="button"
                        onClick={() => setTablePage(p => (p * tablePageSize < filteredCandidates.length ? p + 1 : p))}
                        disabled={tablePage * tablePageSize >= filteredCandidates.length}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          border: `1px solid ${C.border}`,
                          backgroundColor: tablePage * tablePageSize >= filteredCandidates.length ? C.inputBg : C.surface,
                          cursor: tablePage * tablePageSize >= filteredCandidates.length ? 'not-allowed' : 'pointer',
                          color: tablePage * tablePageSize >= filteredCandidates.length ? C.textSecondary : C.textPrimary,
                          fontSize: 12
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* 3-Panel Chat Layout (Live 1-on-1 Messages) */}
      {inboxViewMode === 'chat' && (
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* LEFT SIDEBAR */}
        <div style={{ width:330, flexShrink:0, backgroundColor:C.sidebar, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'14px 14px 10px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            {/* Recruiter Filter Dropdown - Only for Admins / Recruiters without reporting lead */}
            {!isReportee && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    👤 Recruiter Filter
                  </label>
                  {recruiterFilter !== 'all' && (
                    <button onClick={() => setRecruiterFilter('all')} style={{ fontSize: 11, background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontWeight: 700 }}>
                      Show All
                    </button>
                  )}
                </div>
                <select
                  value={recruiterFilter}
                  onChange={e => setRecruiterFilter(e.target.value)}
                  style={{
                    width: '100%',
                    background: isLight ? '#F1F5F9' : '#1E293B',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: '7px 10px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: C.textPrimary,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">🌐 All Recruiters ({threads.length})</option>
                  {ALL_SMARTHIRE_RECRUITERS.map(r => (
                    <option key={r.refCode} value={r.refCode}>
                      👤 {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:C.textSecondary, display:'flex', alignItems:'center', pointerEvents:'none' }}>
                <IconSearch />
              </span>
              <input style={{ width:'100%', background:isLight?'#F1F5F9':'#1E293B', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px 9px 36px', fontSize:13, color:C.textPrimary, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} placeholder="Search candidate or job..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {loadingThreads ? (
              <div style={{ padding:'50px 20px', textAlign:'center', color:C.textSecondary }}>
                <p style={{ fontSize:13 }}>Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding:'50px 20px', textAlign:'center', color:C.textSecondary }}>
                <div style={{ color:C.textSecondary, marginBottom:10, display:'flex', justifyContent:'center' }}><IconChat /></div>
                <p style={{ fontSize:13, lineHeight:1.6 }}>{searchQuery ? 'No conversations match your search.' : 'No candidate messages for this recruiter yet.\nIncoming messages will appear here.'}</p>
              </div>
            ) : filteredThreads.map(thread => (
              <div key={thread.candidateId} style={{ cursor:'pointer', padding:'14px 16px', transition:'background 0.15s', borderLeft: activeThread?.candidateId===thread.candidateId ? '3px solid #2563EB' : '3px solid transparent', background: activeThread?.candidateId===thread.candidateId ? C.activeConv : 'transparent', borderBottom:`1px solid ${C.border}` }} onClick={() => selectThread(thread)}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <Avatar name={thread.candidateName} size={42} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontWeight:thread.unreadCount>0?800:600, fontSize:13.5, color:C.textPrimary, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:140 }}>{thread.candidateName}</span>
                      <span style={{ fontSize:11, color:C.textSecondary, flexShrink:0, marginLeft:4 }}>{formatTime(thread.lastMessageTime)}</span>
                    </div>
                    <div style={{ fontSize:11.5, color:'#2563EB', fontWeight:600, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'flex', alignItems:'center', gap:4 }}>
                      <IconBriefcase /> {thread.jobTitle || 'General Applicant'}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, color:thread.unreadCount>0?C.textPrimary:C.textSecondary, fontWeight:thread.unreadCount>0?600:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:140 }}>{thread.lastMessage}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {thread.recruiterName && (
                          <span style={{ fontSize: 10, background: isLight ? '#EFF6FF' : '#1E3A8A', color: isLight ? '#1D4ED8' : '#93C5FD', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                            {thread.recruiterName.split(' ')[0]}
                          </span>
                        )}
                        {thread.unreadCount>0 && <span style={{ background:'#2563EB', color:'#FFF', fontSize:10, fontWeight:800, borderRadius:10, padding:'2px 7px', flexShrink:0 }}>{thread.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER CHAT */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          {activeThread ? <>
            {/* Thread header */}
            <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.border}`, backgroundColor:C.surface, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, boxShadow:C.shadow }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Avatar name={candidateName} size={42} />
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:C.textPrimary }}>{candidateName}</div>
                  <div style={{ fontSize:12.5, color:'#2563EB', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                    <IconBriefcase /> {candidateJob}
                  </div>
                </div>
              </div>
              <span style={{ fontSize:11, background:'#DCFCE7', color:'#15803D', border:'1px solid rgba(22,163,74,0.2)', padding:'4px 12px', borderRadius:20, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} /> Active Session
              </span>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'22px 26px', display:'flex', flexDirection:'column', gap:16, backgroundColor:C.bg }}>
              {loadingMessages ? (
                <div style={{ textAlign:'center', color:C.textSecondary, paddingTop:60 }}><p>Loading message thread...</p></div>
              ) : messages.length===0 ? (
                <div style={{ textAlign:'center', color:C.textSecondary, paddingTop:80 }}>
                  <div style={{ display:'flex', justifyContent:'center', color:C.textSecondary, marginBottom:12 }}><IconChat /></div>
                  <p style={{ fontSize:14, fontWeight:700, color:C.textPrimary, margin:'0 0 6px' }}>Start the conversation!</p>
                  <p style={{ fontSize:12.5 }}>Send your message to {candidateName}.</p>
                </div>
              ) : messages.map((msg, idx) => {
                const myEmail = (currentUser?.email || '').toLowerCase().trim()
                const myName = (currentUser?.name || '').toLowerCase().trim()
                const isMe = (msg.senderEmail && myEmail && msg.senderEmail.toLowerCase() === myEmail) ||
                             (msg.senderName && myName && msg.senderName.toLowerCase() === myName) ||
                             (isReportee && msg.sender === 'employee') ||
                             (!isReportee && msg.sender === 'recruiter')
                const showDate = idx===0 || new Date(msg.timestamp).toDateString()!==new Date(messages[idx-1]?.timestamp).toDateString()
                return (
                  <div key={msg.id||idx}>
                    {showDate && (
                      <div style={{ textAlign:'center', marginBottom:12 }}>
                        <span style={{ fontSize:11, color:C.textSecondary, background:C.surface, border:`1px solid ${C.border}`, padding:'4px 14px', borderRadius:12, fontWeight:600 }}>
                          {new Date(msg.timestamp).toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}
                        </span>
                      </div>
                    )}
                    <div style={{ display:'flex', flexDirection:isMe?'row-reverse':'row', alignItems:'flex-end', gap:8 }}>
                      {!isMe && <Avatar name={msg.senderName || candidateName} size={32} />}
                      <div style={{ maxWidth:'64%' }}>
                        <div style={{
                          backgroundColor: isMe ? '#2563EB' : C.msgOther,
                          color: isMe ? '#FFF' : C.msgOtherText,
                          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          padding:'12px 16px', fontSize:13.5, lineHeight:1.56,
                          boxShadow: isMe ? '0 4px 14px rgba(37,99,235,0.22)' : '0 2px 6px rgba(0,0,0,0.06)',
                          wordBreak:'break-word'
                        }}>
                          {!isMe && msg.senderName && (
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', marginBottom: 4 }}>
                              {msg.senderName}
                            </div>
                          )}
                          {msg.text}
                        </div>
                        <div style={{ fontSize:11, color:C.textSecondary, marginTop:4, textAlign:isMe?'right':'left', paddingLeft:isMe?0:4, paddingRight:isMe?4:0 }}>
                          {formatTime(msg.timestamp)}{isMe && ' • Delivered'}
                        </div>
                      </div>
                      {isMe && (
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', color:'#FFF', fontSize:12, fontWeight:800, flexShrink:0 }}>
                          {getInitials(currentUser?.name || 'Me')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`, backgroundColor:C.surface, flexShrink:0 }}>
              {showTemplates && (
                <div style={{ marginBottom:12, maxHeight:220, overflowY:'auto', padding:'2px 0' }}>
                  {quickTemplates.map((t,i) => (
                    <button key={i} style={{ width:'100%', textAlign:'left', background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 13px', fontSize:12.5, color:C.textPrimary, cursor:'pointer', marginBottom:6, transition:'all 0.15s', lineHeight:1.5, fontFamily:'inherit', display:'flex', alignItems:'flex-start', gap:8 }} onClick={() => handleSend(t)}>
                      <IconZap /> <span>{t}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                <button title="Quick reply templates" onClick={() => setShowTemplates(p=>!p)} style={{ background:showTemplates?'#EFF6FF':C.inputBg, border:`1px solid ${showTemplates?'#2563EB':C.inputBorder}`, borderRadius:10, padding:'11px 13px', cursor:'pointer', color:showTemplates?'#2563EB':C.textSecondary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  <IconZap />
                </button>
                <textarea style={{ width:'100%', background:C.inputBg, border:`1px solid ${C.inputBorder}`, borderRadius:10, padding:'12px 14px', fontSize:14, color:C.textPrimary, outline:'none', resize:'none', fontFamily:'inherit', transition:'border-color 0.2s', boxSizing:'border-box' }} rows={2} placeholder={`Message ${candidateName}... (Press Enter to send)`} value={inputText} onChange={e=>setInputText(e.target.value)} onKeyDown={handleKeyDown} ref={inputRef} />
                <button style={{ background:'linear-gradient(135deg,#2563EB,#3B82F6)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6, opacity: !inputText.trim()||sending ? 0.55 : 1 }} onClick={() => handleSend()} disabled={!inputText.trim()||sending}>
                  <IconSend /> {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              <p style={{ fontSize:11, color:C.textSecondary, margin:'6px 0 0', textAlign:'center' }}>
                Press Enter to send · Shift+Enter for line break
              </p>
            </div>
          </> : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:18, color:C.textSecondary, textAlign:'center', padding:40 }}>
              <div style={{ width:84, height:84, borderRadius:'50%', background:isLight?'#EFF6FF':'rgba(37,99,235,0.12)', color:'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:C.shadow }}>
                <IconChat />
              </div>
              <div>
                <h3 style={{ fontSize:22, fontWeight:800, color:C.textPrimary, margin:'0 0 8px' }}>Recruiter Messaging Inbox</h3>
                <p style={{ fontSize:14, maxWidth:380, lineHeight:1.7 }}>Select a candidate conversation from the left to read messages and reply in real-time.</p>
              </div>
              {threads.length===0 && !loadingThreads && (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 28px', fontSize:13, lineHeight:1.7, maxWidth:420 }}>
                  <strong style={{ color:C.textPrimary, fontSize:14 }}>No candidate messages yet</strong><br />
                  Candidate messages sent via the careers portal will appear here automatically.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Candidate Profile */}
        {activeThread && (
          <div style={{ width:300, flexShrink:0, backgroundColor:C.surface, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflowY:'auto', padding:'24px 20px' }}>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <Avatar name={candidateName} size={74} style={{ margin:'0 auto 14px' }} />
              <div style={{ fontWeight:800, fontSize:17, color:C.textPrimary }}>{candidateName}</div>
              <div style={{ fontSize:12.5, color:'#2563EB', fontWeight:700, marginTop:4, display:'inline-flex', alignItems:'center', gap:5 }}>
                <IconBriefcase /> {candidateJob}
              </div>
              {profile?.location && (
                <div style={{ fontSize:12, color:C.textSecondary, marginTop:6, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <IconLocation /> {profile.location}
                </div>
              )}
            </div>

            {profile && <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Candidate Details</div>
                {profile.email && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconMail /></span>
                    <span style={{ wordBreak:'break-all' }}>{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconPhone /></span>
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.visa_status && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconShield /></span>
                    <span>{profile.visa_status}</span>
                  </div>
                )}
                {profile.experience_years && (
                  <div style={{ fontSize:12.5, color:C.textPrimary, marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.textSecondary, flexShrink:0 }}><IconClock /></span>
                    <span>{profile.experience_years} yrs experience</span>
                  </div>
                )}
              </div>

              {Array.isArray(profile.skills) && profile.skills.length>0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Technical Skills</div>
                  <div style={{ display:'flex', flexWrap:'wrap' }}>
                    {profile.skills.slice(0,10).map((s,i) => <span key={i} style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:600, background:isLight?'#EFF6FF':'rgba(37,99,235,0.15)', color:isLight?'#1D4ED8':'#93C5FD', border:`1px solid ${isLight?'rgba(37,99,235,0.2)':'rgba(147,197,253,0.2)'}`, padding:'3px 9px', borderRadius:6, margin:'3px 4px 3px 0' }}>{s}</span>)}
                  </div>
                </div>
              )}
            </>}

            <div style={{ marginTop:'auto', paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.textSecondary, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Actions</div>
              <button style={{ width:'100%', background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', fontSize:12.5, fontWeight:700, color:C.textPrimary, cursor:'pointer', marginBottom:8, textAlign:'left', transition:'all 0.15s', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }} onClick={() => setShowFullProfileModal(true)}>
                <IconUser /> View Full Profile 📄
              </button>
              <button
                style={{ width:'100%', background:'linear-gradient(135deg,#2563EB,#3B82F6)', border:'none', borderRadius:8, padding:'10px 12px', fontSize:12.5, fontWeight:700, color:'#FFF', cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all 0.2s', display:'flex', alignItems:'center', gap:8 }}
                onClick={() => { setInputText(`Hi ${candidateName}, let's schedule a technical call for the ${candidateJob} position. What's your availability this week?`); inputRef.current?.focus() }}
              >
                <IconCalendar /> Suggest Interview Time
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* MONSTER+ FLOATING EMAIL COMPOSER (Docked Bottom-Right, Matching media_1789066806510.png) */}
      {emailModalCandidate && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 28,
            width: 520,
            maxWidth: 'calc(100vw - 48px)',
            height: 520,
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            zIndex: 6000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header (Candidate Name + Role in Center, Close '✕' on Right) */}
          <div style={{
            padding: '12px 18px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ width: 24 }} /> {/* Spacer to center name */}
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary }}>
                {emailModalCandidate.name}
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>
                {emailModalCandidate.role || emailModalCandidate.matchedJobTitle || 'Candidate'}
              </div>
            </div>

            <button
              onClick={() => setEmailModalCandidate(null)}
              style={{
                background: 'none',
                border: 'none',
                color: C.textSecondary,
                fontSize: 18,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close composer"
            >
              ✕
            </button>
          </div>

          {/* Sub-Header: Recruiter Strict Sender Policy & Recipient Info */}
          <div style={{
            padding: '6px 16px',
            backgroundColor: isLight ? '#F8FAFC' : '#0F172A',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11.5,
            flexShrink: 0
          }}>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>
              🔒 From: {currentUser?.email || 'omkesh@coolsofttech.com'}
            </span>
            <span style={{ color: C.textSecondary }}>
              To: <strong style={{ color: C.textPrimary }}>{emailTo}</strong>
            </span>
          </div>

          {/* Quick 1-Click Templates Bar */}
          <div style={{
            padding: '6px 14px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: isLight ? '#FAFAFA' : '#182234',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            overflowX: 'auto',
            flexShrink: 0
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              ⚡ Templates:
            </span>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('rtr')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📋 RTR Auth
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('screen')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📞 Screening Call
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('rate')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              💵 Rate & Auth
            </button>
            <button
              type="button"
              onClick={() => handleApplyEmailTemplate('interview')}
              style={{ background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: C.textPrimary, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              📅 Interview Shortlist
            </button>
          </div>

          {/* Subject Line Input */}
          <div style={{
            padding: '7px 16px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0
          }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: C.textSecondary, width: 52, flexShrink: 0 }}>
              Subject:
            </span>
            <input
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder="Email subject line..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 700,
                color: C.textPrimary,
                outline: 'none'
              }}
            />
          </div>

          {/* Body Canvas Area */}
          <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              placeholder={`Write a message to ${emailModalCandidate.name}...`}
              style={{
                width: '100%',
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 13,
                lineHeight: 1.6,
                color: C.textPrimary,
                backgroundColor: 'transparent',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />

            {emailSuccessToast && (
              <div style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '6px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, marginTop: 4 }}>
                {emailSuccessToast}
              </div>
            )}
          </div>

          {/* Bottom Formatting & Action Bar (Matching Monster+ Toolbar: ↩ ↪ B I 🔗 ... Send) */}
          <div style={{
            padding: '9px 16px',
            borderTop: `1px solid ${C.border}`,
            backgroundColor: isLight ? '#FFFFFF' : '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            {/* Left Formatting Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                title="Undo"
                onClick={() => document.execCommand('undo')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, borderRadius: 4 }}
              >
                ↩
              </button>
              <button
                type="button"
                title="Redo"
                onClick={() => document.execCommand('redo')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, borderRadius: 4 }}
              >
                ↪
              </button>
              <button
                type="button"
                title="Bold"
                onClick={() => setEmailBody(prev => prev + ' **bold text**')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, fontWeight: 800, borderRadius: 4 }}
              >
                B
              </button>
              <button
                type="button"
                title="Italic"
                onClick={() => setEmailBody(prev => prev + ' *italic text*')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, fontStyle: 'italic', borderRadius: 4 }}
              >
                I
              </button>
              <button
                type="button"
                title="Insert Link"
                onClick={() => setEmailBody(prev => prev + ' https://www.coolsofttech.com')}
                style={{ background: 'none', border: 'none', color: C.textSecondary, cursor: 'pointer', padding: '4px 6px', fontSize: 14, borderRadius: 4 }}
              >
                🔗
              </button>

              {/* Local Desktop Mail Launcher */}
              <button
                type="button"
                title="Launch in Desktop Outlook / Apple Mail"
                onClick={() => {
                  const fullSig = `\n\nWith Regards,\n${currentUser?.name || 'Omkesh Manjute'}\nLead Recruiter\nCOOLSOFT LLC | ${currentUser?.email || 'omkesh@coolsofttech.com'}\nhttp://www.coolsofttech.com`
                  const fullText = emailBody.includes('Regards') ? emailBody : `${emailBody}${fullSig}`
                  const url = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullText)}`
                  window.location.href = url
                }}
                style={{
                  background: isLight ? '#F1F5F9' : '#334155',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.textPrimary,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginLeft: 4
                }}
              >
                📨 Mail App
              </button>
            </div>

            {/* Right: Purple Monster+ Send Button */}
            <button
              type="button"
              onClick={handleSendDirectEmail}
              disabled={emailSending}
              style={{
                background: '#8B5CF6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 20,
                padding: '8px 24px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                opacity: emailSending ? 0.7 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              {emailSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Candidate Full Profile Drawer (Recruiter Side - Monster Style & AI Matcher) */}
      {showFullProfileModal && candidateDetails && (() => {
        const candidateName = candidateDetails.candidateName || candidateDetails.name || activeThread?.candidateName || 'Candidate'
        const email = candidateDetails.candidateEmail || candidateDetails.email || profile?.email || '—'
        const phone = candidateDetails.candidatePhone || candidateDetails.phone || profile?.phone || '—'
        const locationVal = typeof candidateDetails.location === 'string' 
          ? candidateDetails.location 
          : (candidateDetails.currentLocation || profile?.location || '—')
        const visaStatusVal = candidateDetails.visaStatus || candidateDetails.visa_status || profile?.visa_status || 'US Citizen'
        const experienceVal = candidateDetails.experience || '8+ Years'
        const resumeText = candidateDetails.resumeText || candidateDetails.resume_text || ''

        // Currently selected requisition to evaluate against
        const currentReqId = String(drawerReqId || candidateDetails.targetReqId || '159079').replace(/^J-/, '')
        const activeTargetJob = openJobsList.find(j => String(j.id) === currentReqId) || openJobsList[0]

        // Candidate skills list
        const candidateSkills = Array.isArray(candidateDetails.skills)
          ? candidateDetails.skills
          : (typeof candidateDetails.skills === 'string' ? candidateDetails.skills.split(',').map(s => s.trim()) : [])

        const candidateCorpus = (resumeText + ' ' + candidateSkills.join(' ')).toLowerCase()

        // Match against selected requisition's skills
        const targetJobSkills = activeTargetJob?.skills || ['Java', 'SQL']
        const dynamicMatchingSkills = targetJobSkills.filter(reqSkill => {
          if (!reqSkill) return false
          const s = reqSkill.toLowerCase().trim()
          return candidateCorpus.includes(s) || candidateSkills.some(cs => cs.toLowerCase().includes(s) || s.includes(cs.toLowerCase()))
        })
        const dynamicMissingSkills = targetJobSkills.filter(reqSkill => !dynamicMatchingSkills.includes(reqSkill))

        // Dynamic match score calculation
        const matchRatio = targetJobSkills.length > 0 ? (dynamicMatchingSkills.length / targetJobSkills.length) : 0.8
        const dynamicMatchScore = Math.max(65, Math.min(99, Math.round(matchRatio * 100)))

        // Title alignment check
        const candRoleLower = (candidateDetails.role || candidateDetails.title || candidateName).toLowerCase()
        const targetTitleLower = (activeTargetJob?.title || '').toLowerCase()
        const isTitleAligned = candRoleLower.split(' ').some(w => w.length > 3 && targetTitleLower.includes(w))

        const hasDl = candidateDetails.uploadedDocuments?.dl || candidateDetails.documents?.some(d => d.type === 'driving_license' || d.type === 'driving_licence');
        const hasSelfie = candidateDetails.uploadedDocuments?.selfie || candidateDetails.selfieUrl;
        const hasVisa = candidateDetails.uploadedDocuments?.visa || candidateDetails.documents?.some(d => d.type === 'visa' || d.type === 'work_permit' || d.type === 'passport');

        const isSpamOrigin = candidateDetails.isSpamRecovery || candidateDetails.sourceCategory === 'email_spam'

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 4000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={() => setShowFullProfileModal(false)}>
            <div style={{
              width: '92%',
              maxWidth: 1200,
              height: '100%',
              backgroundColor: C.surface,
              borderLeft: `1px solid ${C.border}`,
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Plus Jakarta Sans', Inter, sans-serif"
            }} onClick={e => e.stopPropagation()}>
              
              {/* Header */}
              <div style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: C.surface,
                flexShrink: 0,
                gap: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={candidateName} size={46} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textPrimary }}>{candidateName}</h3>
                      {isSpamOrigin ? (
                        <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          🛡️ Recovered from Spam Folder
                        </span>
                      ) : candidateDetails.sourceCategory === 'careers_portal' ? (
                        <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          🌐 Careers Portal (/jobs)
                        </span>
                      ) : candidateDetails.sourceCategory === 'vendor_bench' ? (
                        <span style={{ background: '#FAF5FF', color: '#7C3AED', border: '1px solid #E9D5FF', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          🏢 Vendor Bench
                        </span>
                      ) : (
                        <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                          📧 Recruiter Email Inbox
                        </span>
                      )}

                      <span style={{
                        background: dynamicMatchScore >= 85 ? '#DCFCE7' : '#FEF3C7',
                        color: dynamicMatchScore >= 85 ? '#15803D' : '#B45309',
                        border: `1px solid ${dynamicMatchScore >= 85 ? '#86EFAC' : '#FDE68A'}`,
                        padding: '2px 9px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800
                      }}>
                        ⚡ {dynamicMatchScore}% Fit for Req #{currentReqId}
                      </span>
                    </div>

                    <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSecondary, fontWeight: 600 }}>
                      {candidateDetails.role || 'IT Consultant'} • {locationVal} • {visaStatusVal} • {experienceVal}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenEmailModal({
                        ...candidateDetails,
                        targetReqId: currentReqId,
                        matchedJobTitle: activeTargetJob?.title,
                        matchedJobRate: activeTargetJob?.rate,
                        matchedJobClient: activeTargetJob?.client
                      })
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(37,99,235,0.35)'
                    }}
                  >
                    <IconSend /> ✉️ Send Email / RTR
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignCandidateToReq(candidateDetails, currentReqId)}
                    style={{
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(5,150,105,0.3)'
                    }}
                  >
                    <span>➕</span> Add to Req #{currentReqId}
                  </button>

                  <button
                    onClick={() => setShowFullProfileModal(false)}
                    style={{
                      background: C.inputBg,
                      border: `1px solid ${C.border}`,
                      color: C.textSecondary,
                      fontSize: 18,
                      borderRadius: 8,
                      cursor: 'pointer',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Split Content Area */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* Left Pane: Candidate Overview & AI Matching Report (42%) */}
                <div style={{ width: '42%', borderRight: `1px solid ${C.border}`, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  
                  {/* Grid overview */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Email', value: email, isMail: true },
                      { label: 'Phone', value: phone },
                      { label: 'Location', value: locationVal },
                      { label: 'Visa Status', value: visaStatusVal, bold: true },
                      { label: 'Total Experience', value: experienceVal },
                      { label: 'Origin Source', value: isSpamOrigin ? 'Yahoo Spam (Recovered)' : candidateDetails.source || 'Recruiter Inbox' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>{item.label}</div>
                        {item.isMail && item.value !== '—' ? (
                          <a href={`mailto:${item.value}`} style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', textDecoration: 'none', marginTop: 3, display: 'block', wordBreak: 'break-all' }}>
                            {item.value}
                          </a>
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: item.bold ? 800 : 600, color: C.textPrimary, marginTop: 3, wordBreak: 'break-all' }}>
                            {item.value || '—'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* AI Multi-Position Match Analyzer Card */}
                  <div style={{
                    border: '2px solid #3B82F6',
                    borderRadius: 12,
                    padding: 18,
                    background: isLight ? 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)' : 'rgba(37,99,235,0.08)',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.08)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🎯 AI Multi-Position Match Analyzer
                      </h4>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: 12 }}>
                        ● Live Evaluator
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 11.5, color: C.textSecondary, lineHeight: 1.4 }}>
                      Select an open position below to evaluate candidate fit and update resume skill highlights:
                    </p>

                    {/* Position Selector Dropdown */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 10.5, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>
                        Active Target Requisition:
                      </label>
                      <select
                        value={currentReqId}
                        onChange={e => setDrawerReqId(e.target.value)}
                        style={{
                          width: '100%',
                          background: C.surface,
                          border: '2px solid #2563EB',
                          borderRadius: 8,
                          padding: '9px 12px',
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: C.textPrimary,
                          outline: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(37,99,235,0.15)'
                        }}
                      >
                        {openJobsList.map(j => (
                          <option key={j.id} value={j.id}>
                            Req #{j.id} · {j.title} ({j.client})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Position Meta summary */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>Client &amp; Location:</div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.textPrimary }}>{activeTargetJob?.client} • {activeTargetJob?.location || 'Remote'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: C.textSecondary, textTransform: 'uppercase' }}>Target Pay Rate:</div>
                        <div style={{ fontSize: 12, fontWeight: 900, color: '#16A34A' }}>{activeTargetJob?.rate || '$75/hr'}</div>
                      </div>
                    </div>

                    {/* Fit Score & Gauge */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>Requisition Match Score:</span>
                        <strong style={{ fontSize: 15, fontWeight: 900, color: dynamicMatchScore >= 80 ? '#16A34A' : dynamicMatchScore >= 65 ? '#D97706' : '#DC2626' }}>
                          {dynamicMatchScore}% Fit
                        </strong>
                      </div>
                      <div style={{ width: '100%', height: 8, backgroundColor: isLight ? '#E2E8F0' : '#334155', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${dynamicMatchScore}%`, height: '100%', backgroundColor: dynamicMatchScore >= 80 ? '#16A34A' : dynamicMatchScore >= 65 ? '#D97706' : '#DC2626', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>

                    {/* Title Alignment */}
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: isTitleAligned ? '#15803D' : C.textSecondary, background: isTitleAligned ? '#DCFCE7' : C.inputBg, border: `1px solid ${isTitleAligned ? '#86EFAC' : C.border}`, padding: '6px 10px', borderRadius: 6, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{isTitleAligned ? '✓' : 'ℹ️'}</span>
                      <span>{isTitleAligned ? `Strong Role Fit: Candidate matches ${activeTargetJob?.title}` : `Transferable Profile: Candidate background aligns with ${activeTargetJob?.title}`}</span>
                    </div>

                    {/* Matching Skills */}
                    {dynamicMatchingSkills && dynamicMatchingSkills.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>✓</span> Matching Technical Skills (Highlighted Yellow in Resume):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {dynamicMatchingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 5, background: '#DCFCE7', color: '#15803D', fontWeight: 700, border: '1px solid #86EFAC' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {dynamicMissingSkills && dynamicMissingSkills.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>✗</span> Missing / Gap Skills:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {dynamicMissingSkills.map((s, idx) => (
                            <span key={idx} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 5, background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, border: '1px solid #FECACA' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 1-Click Action Buttons for this Req */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => handleAssignCandidateToReq(candidateDetails, currentReqId)}
                        style={{
                          flex: 1,
                          background: '#2563EB',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5
                        }}
                      >
                        ➕ Assign to Req #{currentReqId}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEmailModal({
                            ...candidateDetails,
                            targetReqId: currentReqId,
                            matchedJobTitle: activeTargetJob?.title,
                            matchedJobRate: activeTargetJob?.rate,
                            matchedJobClient: activeTargetJob?.client
                          })
                        }}
                        style={{
                          background: C.surface,
                          color: C.textPrimary,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        ✉️ Draft Email
                      </button>
                    </div>

                  </div>

                  {/* Compliance & Audit */}
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🛡️ Trust Verification &amp; Document Audit
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>Driver's License OCR Check:</span>
                        <strong style={{ color: hasDl ? '#16A34A' : '#64748B' }}>
                          {hasDl ? '✓ Match Verified' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>Biometric Selfie verification:</span>
                        <strong style={{ color: hasSelfie ? '#16A34A' : '#64748B' }}>
                          {hasSelfie ? '✓ Match Passed (98%)' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: C.textSecondary }}>US Work Auth Visa verification:</span>
                        <strong style={{ color: hasVisa ? '#16A34A' : '#64748B' }}>
                          {hasVisa ? '✓ Active / Verified' : '⏳ Pending / Not Uploaded'}
                        </strong>
                      </div>
                      {candidateDetails.gps_data && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                          <span style={{ color: C.textSecondary }}>GPS Submission Geolocation:</span>
                          <strong style={{ color: C.textPrimary }}>
                            📍 {candidateDetails.gps_data.city || 'Dallas'}, {candidateDetails.gps_data.state || 'TX'}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Pane: Interactive Monster-Style Resume Viewer (58%) */}
                <div style={{ width: '58%', display: 'flex', flexDirection: 'column', backgroundColor: isLight ? '#F8FAFC' : '#0B0F17', overflow: 'hidden' }}>
                  
                  {/* Viewer Toolbar */}
                  <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, backgroundColor: C.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.textPrimary }}>📄 Monster-Style Resume Viewer</span>
                      <span style={{ fontSize: 11, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: 4, fontWeight: 800, border: '1px solid #FDE68A' }}>
                        💡 Matching skills for Req #{currentReqId} highlighted in yellow
                      </span>
                    </div>

                    {/* Resume Search Box */}
                    <div style={{ position: 'relative', width: 220 }}>
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.textSecondary, display: 'flex', pointerEvents: 'none' }}>
                        <IconSearch />
                      </span>
                      <input
                        value={resumeKeywordSearch}
                        onChange={e => setResumeKeywordSearch(e.target.value)}
                        placeholder="Find in resume..."
                        style={{
                          width: '100%',
                          background: C.inputBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: '5px 8px 5px 28px',
                          fontSize: 11.5,
                          color: C.textPrimary,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Scrollable Resume Canvas */}
                  <div style={{ flex: 1, padding: 24, overflowY: 'auto', boxSizing: 'border-box' }}>
                    {highlightResumeText(resumeText, dynamicMatchingSkills, resumeKeywordSearch)}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}