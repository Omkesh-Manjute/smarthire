import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const DEFAULT_ITEMS = [
  {
    title: "Talent Hub (/inbox)",
    description: "Real-time candidate pipeline, direct messaging, and review center.",
  },
  {
    title: "Universal Search",
    description: "Deep semantic resume lookup across private recruiter vaults and portals.",
  },
  {
    title: "Vendor Hotlists",
    description: "Fast bench candidate imports and prime vendor matching grid.",
  },
];

export function Skiper103({
  items = DEFAULT_ITEMS,
  className = "",
  initialActiveIndex = null,
  onItemSelect,
  ...props
}) {
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  return (
    <div className={cn("select-none w-full", className)} {...props}>
      <ul className="list-none p-0 m-0 flex flex-col gap-1 w-full">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <motion.li
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newIndex = isActive ? null : index;
                setActiveIndex(newIndex);
                if (onItemSelect) onItemSelect(item, index);
                if (item.onClick) item.onClick(e);
              }}
              animate={{
                marginBlock: isActive ? "8px" : "0px",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                borderBottomRightRadius: "8px",
                borderBottomLeftRadius: "8px",
              }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 22,
              }}
              style={{
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
                background: isActive ? "rgba(255, 255, 255, 0.12)" : "transparent",
                border: isActive ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "background 0.15s ease",
              }}
              whileHover={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                x: 3,
                transition: { type: "spring", stiffness: 400, damping: 25 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {item.icon && <span style={{ opacity: 0.85 }}>{item.icon}</span>}
                  <span style={{ fontSize: "13px", fontWeight: isActive ? "600" : "500", color: "#ffffff" }}>
                    {item.title}
                  </span>
                </div>
                <motion.svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ rotate: isActive ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ color: "rgba(255, 255, 255, 0.6)" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </motion.svg>
              </div>

              <AnimatePresence>
                {isActive && item.description && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, filter: "blur(2px)" }}
                    animate={{ opacity: 0.75, height: "auto", filter: "blur(0px)" }}
                    exit={{ opacity: 0, height: 0, filter: "blur(2px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                      margin: "6px 0 0",
                      fontSize: "11.5px",
                      lineHeight: "1.4",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {item.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export default Skiper103;
