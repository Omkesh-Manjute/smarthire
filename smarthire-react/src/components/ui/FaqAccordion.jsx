import React, { useState } from "react";
import { cn } from "../../lib/utils";
import "./faq-accordion.css";

const DEFAULT_ITEMS = [
  {
    question: "What is SmartHire ATS & AI Screening?",
    answer: "SmartHire is an enterprise-grade applicant tracking system and autonomous AI screening platform purpose-built for high-volume staffing agencies, recruiters, and corporate hiring teams. It combines resume parsing, private candidate vaults, right-to-represent (RTR) digital workflows, and sub-second requisition matching."
  },
  {
    question: "How does the AI candidate matching engine work?",
    answer: "Unlike simplistic keyword search tools, SmartHire uses deep semantic matching benchmarked against verified technical placements. It evaluates skills clusters, experience depth, client bill rates, and work authorizations to compute precise placement probability scores."
  },
  {
    question: "How are private candidate vaults kept secure and isolated?",
    answer: "SmartHire enforces strict role-based access control (RBAC). Sourcing specialists, recruiters, and managers operate with isolated vaults ensuring candidates cannot be poached, viewed, or reassigned without explicit organizational delegation."
  },
  {
    question: "Do candidates need to install any software for video screening or RTR signing?",
    answer: "Zero app installs or account signups are needed. Candidates open a secure link directly on Chrome, Safari, Edge, or mobile browsers to complete interactive video screening or sign Florida Exhibit E / RTR agreements."
  },
  {
    question: "Can I export candidate pools, submission histories, and client coversheets?",
    answer: "Yes. SmartHire supports 1-click standardized Excel exports, branded PDF submittal packages with client-ready coversheets, and full certified audit trail generation."
  }
];

export function FaqAccordion({
  items = DEFAULT_ITEMS,
  title = "Frequently Asked Questions",
  subtitle,
  className = "",
  allowMultiple = false,
  ...props
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeIndices, setActiveIndices] = useState([]);

  const toggleItem = (index) => {
    if (allowMultiple) {
      setActiveIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setActiveIndex((prev) => (prev === index ? null : index));
    }
  };

  const isItemActive = (index) => {
    return allowMultiple ? activeIndices.includes(index) : activeIndex === index;
  };

  return (
    <div className={cn("v-faq-container", className)} {...props}>
      {title && <h2 className="v-faq-title">{title}</h2>}
      {subtitle && <p className="v-faq-subtitle">{subtitle}</p>}

      <ul className="v-faq-list">
        {items.map((item, index) => {
          const isActive = isItemActive(index);
          const questionText = item.question || item.q;
          const answerContent = item.answer || item.a;

          return (
            <li
              key={index}
              className={cn("v-faq-item", isActive && "v-faq-item--active")}
            >
              <button
                type="button"
                className={cn("v-faq-trigger", isActive && "v-faq-trigger--active")}
                onClick={() => toggleItem(index)}
                aria-expanded={isActive}
              >
                {/* Plus / Minus Indicator Icon */}
                <span
                  className={cn("v-faq-icon", isActive && "v-faq-icon--active")}
                  aria-hidden="true"
                >
                  {isActive ? "−" : "+"}
                </span>

                {/* Question */}
                <span className="v-faq-question">{questionText}</span>

                {/* Rotating Chevron Arrow */}
                <span
                  className={cn("v-faq-chevron", isActive && "v-faq-chevron--active")}
                  aria-hidden="true"
                />
              </button>

              {/* Collapsible Answer Content via Grid Rows */}
              <div
                className={cn(
                  "v-faq-content-grid",
                  isActive && "v-faq-content-grid--active"
                )}
              >
                <div className="v-faq-content-inner">
                  <div className="v-faq-answer">
                    {answerContent}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default FaqAccordion;
