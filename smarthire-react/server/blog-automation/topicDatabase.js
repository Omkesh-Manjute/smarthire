// ─────────────────────────────────────────────────────────────────────────────
// TOPIC DATABASE & TREND DISCOVERY ENGINE FOR SMARTHIRE BLOG AUTOMATION
// ─────────────────────────────────────────────────────────────────────────────

export const TOPIC_CATEGORIES = [
  {
    id: 'ai-tech',
    name: 'AI & Emerging Tech',
    color: '#0284c7',
    topics: [
      {
        title: 'The Rise of AI Agent Engineers: The High-Paying IT Role US Companies Are Rushing to Fill',
        seedAngle: 'Explain what an AI Agent Engineer does vs traditional full-stack developers. Why US enterprises (startups to Fortune 500) are paying $160K-$230K or $95-$140/hr C2C for engineers who can build multi-agent autonomous workflows using LangGraph, CrewAI, AutoGen, and tool calling.',
        category: 'AI & Emerging Tech',
        tags: ['AI Agent Engineer', 'LangGraph', 'Enterprise AI', 'GenAI Jobs 2026', 'LLM Orchestration', 'Tech Salaries']
      },
      {
        title: 'GenAI Developer vs Traditional Full-Stack: 2026 Salary, Skill Gaps & Hiring Demand',
        seedAngle: 'Compare the compensation, daily responsibilities, and interview expectations between classic MERN/Java full-stack developers and GenAI engineers with RAG, vector databases (Pinecone/Milvus), and LLM fine-tuning experience.',
        category: 'AI & Emerging Tech',
        tags: ['GenAI Developer', 'Full Stack Developer', 'RAG Architecture', 'Vector Databases', 'Tech Hiring 2026', 'C2C Rates']
      },
      {
        title: 'LLMOps & MLOps in Production: The $190K+ Enterprise Role with Severe Talent Shortage',
        seedAngle: 'Break down why deploying LLMs into production (evaluations, latency optimization, quantization, guardrails, cost management) is where enterprises are struggling most, and the exact skills required to land top MLOps contracts.',
        category: 'AI & Emerging Tech',
        tags: ['LLMOps', 'MLOps', 'Model Deployment', 'AI Infrastructure', 'Kubernetes AI', 'Cloud AI']
      },
      {
        title: 'Will AI Replace Software Engineers? The Actual 2026 Enterprise Hiring Data',
        seedAngle: 'Examine empirical recruitment datasets from US staffing firms, BLS labor statistics, and enterprise tech layoffs. Contrast doom-mongering headlines with the reality that senior architecture, integration, and security roles are growing while rote code-writing transforms.',
        category: 'AI & Emerging Tech',
        tags: ['AI Job Displacement', 'Software Engineering Future', 'Tech Employment 2026', 'Staffing Insights', 'Developer Demand']
      }
    ]
  },
  {
    id: 'company-staffing',
    name: 'Company & Enterprise Staffing',
    color: '#0D6B5F',
    topics: [
      {
        title: 'How US Fortune 500 Companies Hire IT Contractors: Direct Client vs MSP/VMS Explained',
        seedAngle: 'De-mystify the corporate technical hiring supply chain. Contrast Direct-Client engagements with MSP/VMS programs (Beeline, Fieldglass, Coupa). Explain vendor markups, rate haircuts across subcontracting tiers, and why direct client requisitions pay significantly higher.',
        category: 'Company & Enterprise Staffing',
        tags: ['Direct Client IT', 'MSP Staffing', 'VMS Portals', 'Subcontracting Layers', 'US Enterprise IT', 'Contractor Rates']
      },
      {
        title: 'State Government IT Contracting: How Tech Professionals Land Lucrative Public Sector Requisitions',
        seedAngle: 'Provide a complete insider guide to state and municipal IT contracts (e.g. Wisconsin, Texas, California, Tennessee). Discuss contract stability (1-3 year extensions), hybrid policies, residency clauses, and how implementation partners bid on state RFPs.',
        category: 'Company & Enterprise Staffing',
        tags: ['State Government IT', 'Public Sector Contracts', 'State IT Staffing', 'State RFPs', 'Contract Security', 'US Public IT']
      },
      {
        title: 'Vendor Layer Consolidation: Why US Enterprises Are Slashing Multi-Tier Staffing Agencies',
        seedAngle: 'Analyze why Chief Information Officers and procurement teams are cutting 3rd-party subcontractor chains in favor of direct vetting, verified right-to-represent (RTR) agreements, and transparent talent clouds like SmartHire.',
        category: 'Company & Enterprise Staffing',
        tags: ['Vendor Consolidation', 'Right To Represent', 'IT Procurement', 'Tier 1 Vendors', 'B2B Recruiting', 'Staffing Compliance']
      },
      {
        title: 'How Enterprise Companies Screen Tech Contractors with Asynchronous Video & Skill Dossiers',
        seedAngle: 'Explain the modern enterprise screening funnel: automated resume keyword scoring, asynchronous 1-way video screening, background and legal compliance checks, and final manager panels.',
        category: 'Company & Enterprise Staffing',
        tags: ['Asynchronous Video Screening', 'Technical Screening', 'Client Interviews', 'Hiring Process', 'Contractor Onboarding']
      }
    ]
  },
  {
    id: 'visas-compliance',
    name: 'Visas & Immigration',
    color: '#854d0e',
    topics: [
      {
        title: 'H-1B 2026 Prevailing Wage Rules: Level 1 to Level 4 Wage Realities for IT Contractors',
        seedAngle: 'Explain how the Department of Labor Prevailing Wage Determinations (OES wage levels 1 through 4) work for software engineers, systems analysts, and cloud architects, and how wage weighted lottery proposals impact C2C consultants.',
        category: 'Immigration & Compliance',
        tags: ['H-1B Prevailing Wage', 'OES Wage Levels', 'DOL Regulations', 'H-1B 2026', 'IT Work Visas', 'Labor Compliance']
      },
      {
        title: 'STEM OPT 24-Month Extension Guide: How International IT Graduates Can Secure Enterprise Contracts',
        seedAngle: 'Actionable blueprint for F-1 STEM OPT tech graduates: E-Verify employer requirements, training plan (Form I-983) compliance, contract-to-hire paths, and transition into H-1B or EB-2 green cards.',
        category: 'Immigration & Compliance',
        tags: ['STEM OPT', 'F-1 Visa', 'E-Verify Employers', 'I-983 Training Plan', 'Tech Graduates', 'US Work Authorization']
      },
      {
        title: 'Day 1 CPT in 2026: Employer Policies, Legal Compliance & H-1B Transition Realities',
        seedAngle: 'Provide an honest, legal-compliance-first examination of Day 1 CPT programs for IT professionals. What direct clients look for, USCIS scrutiny on change of status, and how to stay 100% compliant.',
        category: 'Immigration & Compliance',
        tags: ['Day 1 CPT', 'CPT Work Authorization', 'USCIS Compliance', 'Contracting on CPT', 'IT Employment Law']
      },
      {
        title: 'TN Visa vs H-1B: Why US Tech Companies Are Hiring Record Canadian & Mexican Engineers',
        seedAngle: 'Explore the USMCA (TN status) boom for Computer Systems Analysts, Software Engineers, and Database Architects. Contrast instant border approval with the H-1B lottery, and explain how US employers leverage TN talent.',
        category: 'Immigration & Compliance',
        tags: ['TN Visa', 'USMCA Status', 'Canadian Tech In US', 'Mexican Engineers', 'H-1B Alternatives', 'IT Relocation']
      }
    ]
  },
  {
    id: 'contracting-rates',
    name: 'Contracting & Rates',
    color: '#15803d',
    topics: [
      {
        title: 'C2C vs W2 vs 1099: Net Take-Home Calculation for an $85/hr IT Contract (With Real Tax Math)',
        seedAngle: 'Detailed mathematical breakdown of an $85/hr contract across Corp-to-Corp (S-Corp structure), W2 employee (recruiting agency payroll), and 1099 sole proprietor. Real numbers for federal tax, state tax, FICA, healthcare, and deductions.',
        category: 'Contracting & Rates',
        tags: ['C2C vs W2', '1099 Contract', 'Take Home Pay Calculator', 'S-Corp Math', 'IT Hourly Rates', 'Contractor Taxes']
      },
      {
        title: 'S-Corp Tax Optimization for IT Contractors: How to Save $10,000+ Annually in Self-Employment Tax',
        seedAngle: 'Step-by-step corporate finance guide for experienced US IT consultants: Reasonable salary calculation, pass-through distributions, QBI deduction (Section 199A), SEP IRA contributions, and home office business write-offs.',
        category: 'Contracting & Rates',
        tags: ['S-Corp Tax Savings', 'Self-Employment Tax', 'QBI Deduction', 'IT Business Expenses', 'Corp-to-Corp Consulting']
      },
      {
        title: 'Invoicing, NET-30 Terms, and Avoiding Vendor Non-Payment: The C2C Contractor Survival Guide',
        seedAngle: 'How independent IT consultants and consulting agencies can safeguard their cash flow. Master services agreements (MSAs), prompt payment clauses, weekly timesheet approvals, and red flags in vendor contracts.',
        category: 'Contracting & Rates',
        tags: ['C2C Invoicing', 'NET-30 Terms', 'MSA Contract Clauses', 'Timesheet Approval', 'Vendor Disputes', 'Cash Flow Management']
      },
      {
        title: 'Top-Paying IT Contract Roles in 2026: Verified Hourly Rate Benchmarks Across 50 US Markets',
        seedAngle: 'Empirical hourly rate compensation report: Cloud Architects ($110-$150/hr), Snowflake/Databricks Engineers ($90-$130/hr), Cyber Defense Specialists ($100-$140/hr), Java/Spring Microservices ($75-$105/hr).',
        category: 'Contracting & Rates',
        tags: ['IT Hourly Rates 2026', 'Salary Benchmarks', 'Contract Compensation', 'Cloud Architect Rate', 'Data Engineer Pay']
      }
    ]
  },
  {
    id: 'cloud-data',
    name: 'Cloud, Data & Infrastructure',
    color: '#4f46e5',
    topics: [
      {
        title: 'Snowflake vs Databricks: Why Data Engineers Skilled in Both Command $120/hr+ in 2026',
        seedAngle: 'Compare the architecture, SQL/PySpark requirements, and enterprise adoption of Snowflake Data Cloud and Databricks Lakehouse. Explain why hybrid data engineering skills are commanding record contract premiums.',
        category: 'Cloud & Data Infrastructure',
        tags: ['Snowflake', 'Databricks', 'Data Engineering', 'PySpark', 'Lakehouse Architecture', 'High Hourly Rates']
      },
      {
        title: 'Kubernetes & Platform Engineering: The Most Resilient IT Career in Enterprise Tech',
        seedAngle: 'Analyze why Platform Engineering and internal developer platforms (IDPs) using Kubernetes, Terraform, ArgoCD, and Helm remain almost immune to tech budget cuts as enterprises standardize their hybrid cloud operations.',
        category: 'Cloud & Data Infrastructure',
        tags: ['Platform Engineering', 'Kubernetes', 'DevOps 2026', 'Terraform', 'ArgoCD', 'Cloud Infrastructure']
      },
      {
        title: 'Zero-Trust Architecture & CISSP: Why Enterprise Security Engineers Never Face a Downturn',
        seedAngle: 'Explore the surging demand for identity governance (Okta, CyberArk), cloud posture management, and compliance across federal, state, and banking direct clients.',
        category: 'Cloud & Data Infrastructure',
        tags: ['Zero Trust', 'CISSP Certification', 'Cybersecurity Jobs', 'Identity Governance', 'Cloud Security', 'Defense Contracting']
      }
    ]
  },
  {
    id: 'ats-interviewing',
    name: 'ATS & Technical Interviewing',
    color: '#0e7490',
    topics: [
      {
        title: 'How Enterprise ATS Algorithms Rank Resumes: The 2026 Technical Recruiter Playbook',
        seedAngle: 'Pull back the curtain on how modern ATS engines (like SmartHire, Workday, Taleo, Greenhouse) parse candidate resumes, calculate weighted skills matching, score job experience, and filter out unqualified applicants.',
        category: 'ATS & Technical Interviewing',
        tags: ['ATS Algorithms', 'Resume Optimization', 'Technical Recruiter Tips', 'Keyword Matching', 'Job Applications', 'Hiring Secrets']
      },
      {
        title: 'How to Format IT Resumes for Direct-Client Submittals: Bullets, Tech Stacks & Impact Metrics',
        seedAngle: 'A practical, actionable formatting guide for senior developers and consultants. How to structure project summaries with action verbs, exact technical stacks, bullet point accomplishments, and measurable business impact.',
        category: 'ATS & Technical Interviewing',
        tags: ['Resume Formatting', 'Direct Client Submittals', 'Project Accomplishments', 'Technical Resume Guide', 'Contractor Profile']
      }
    ]
  }
];

/**
 * Selects the next unique trending topic that hasn't been published yet.
 * Automatically cycles across different pillars (AI, Company, Visas, Contracting, Cloud, ATS).
 */
export function selectNextTopic(existingSlugs = new Set(), existingTitles = new Set()) {
  const allAvailable = [];

  for (const cat of TOPIC_CATEGORIES) {
    for (const t of cat.topics) {
      const cleanSlug = t.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 75);

      const isSlugTaken = existingSlugs.has(cleanSlug);
      const isTitleTaken = existingTitles.has(t.title.toLowerCase());

      if (!isSlugTaken && !isTitleTaken) {
        allAvailable.push({
          ...t,
          suggestedSlug: cleanSlug,
          categoryName: cat.name,
          categoryColor: cat.color
        });
      }
    }
  }

  // If all preset topics have been published, pick the one least recently touched or synthesize a dynamic variant
  if (allAvailable.length === 0) {
    const currentYear = new Date().getFullYear();
    const dynamicTopics = [
      {
        title: `AI-Driven Cloud Optimization: How FinOps Engineers Are Saving Millions for US Enterprises in ${currentYear}`,
        seedAngle: `Explore the explosion of FinOps (Financial Operations) across AWS, Azure, and GCP. How cloud architects use GenAI to automate cost anomaly detection, right-sizing, and Kubernetes resource allocation.`,
        category: 'AI & Emerging Tech',
        tags: ['FinOps', 'Cloud Optimization', 'AWS Cost Savings', 'AI Infrastructure', 'Kubernetes FinOps', 'Tech Careers']
      },
      {
        title: `The 2026 Direct-Client IT Rate Report: Top 10 In-Demand Tech Stacks and Their C2C Rates`,
        seedAngle: `Comprehensive breakdown of verified direct client contract rates across Software Engineering, Cloud Architecture, Data Platform Engineering, and AI Development.`,
        category: 'Contracting & Rates',
        tags: ['Direct Client Rates', 'C2C Hourly Rates', 'IT Salary Guide', 'Tech Compensation', 'Contractor Benchmarks']
      }
    ];

    const pick = dynamicTopics[Math.floor(Math.random() * dynamicTopics.length)];
    const cleanSlug = pick.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 75);
    return { ...pick, suggestedSlug: cleanSlug };
  }

  // Pick randomly from the un-published available topics to ensure diversity
  const selected = allAvailable[Math.floor(Math.random() * allAvailable.length)];
  return selected;
}
