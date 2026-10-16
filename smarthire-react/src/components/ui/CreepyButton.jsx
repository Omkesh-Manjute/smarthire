import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import "./creepy-button.css";

export const CreepyButton = ({
  children,
  className = "",
  coverClassName = "",
  variant = "primary", // "primary" | "outline" | "secondary"
  onClick,
  href,
  to,
  type = "button",
  style,
  coverStyle,
  ...props
}) => {
  const eyesRef = useRef(null);
  const [eyeCoords, setEyeCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const updateEyes = (e) => {
    const userEvent =
      "touches" in e && e.touches && e.touches.length > 0
        ? e.touches[0]
        : e;

    if (!eyesRef.current) return;

    // get the center of the eyes container
    const eyesRect = eyesRef.current.getBoundingClientRect();
    const eyesCenter = {
      x: eyesRect.left + eyesRect.width / 2,
      y: eyesRect.top + eyesRect.height / 2,
    };

    // cursor position
    const cursor = {
      x: userEvent.clientX,
      y: userEvent.clientY,
    };

    // calculate the eye angle
    const dx = cursor.x - eyesCenter.x;
    const dy = cursor.y - eyesCenter.y;
    const angle = Math.atan2(-dy, dx) + Math.PI / 2;

    // pupil distance from the eye center
    const visionRangeX = 180; // Max distance to look horizontally
    const visionRangeY = 75; // Max distance to look vertically
    const distance = Math.hypot(dx, dy);

    // Limit the movement so pupils don't go too far
    const x = (Math.sin(angle) * Math.min(distance, visionRangeX)) / visionRangeX;
    const y = (Math.cos(angle) * Math.min(distance, visionRangeY)) / visionRangeY;

    setEyeCoords({ x, y });
  };

  // Reset eyes when mouse leaves
  const resetEyes = () => {
    setEyeCoords({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const pupilStyle = {
    transform: `translate(calc(-50% + ${eyeCoords.x * 50}%), calc(-50% + ${eyeCoords.y * 50}%))`,
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (e && e.defaultPrevented) return;

    if (to) {
      if (e) e.preventDefault();
      navigate(to);
    } else if (href && href.startsWith("#")) {
      if (e) e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const isExternalOrAnchor = href && !href.startsWith("#");
  const Component = isExternalOrAnchor ? "a" : "button";
  const elementProps = isExternalOrAnchor
    ? { href, ...props }
    : { type: href ? undefined : type, ...props };

  return (
    <Component
      className={cn("creepy-btn-root", className)}
      style={style}
      onClick={handleClick}
      onMouseMove={(e) => {
        updateEyes(e);
        setIsHovered(true);
      }}
      onTouchMove={(e) => {
        updateEyes(e);
        setIsHovered(true);
      }}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={resetEyes}
      onMouseLeave={resetEyes}
      onFocus={() => setIsHovered(true)}
      onBlur={() => {
        resetEyes();
        setIsHovered(false);
      }}
      {...elementProps}
    >
      {/* Eyes Container */}
      <span
        ref={eyesRef}
        className="creepy-eyes-container"
        aria-hidden="true"
      >
        {/* Left Eye */}
        <motion.span
          className="creepy-eye"
          animate={{ height: ["0.85em", "0.85em", "0em", "0.85em"] }}
          transition={{
            duration: 3,
            times: [0, 0.92, 0.96, 1],
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span
            className="creepy-pupil"
            style={pupilStyle}
          />
        </motion.span>
        {/* Right Eye */}
        <motion.span
          className="creepy-eye"
          animate={{ height: ["0.85em", "0.85em", "0em", "0.85em"] }}
          transition={{
            duration: 3,
            times: [0, 0.92, 0.96, 1],
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span
            className="creepy-pupil"
            style={pupilStyle}
          />
        </motion.span>
      </span>

      {/* Button Cover */}
      <motion.span
        className={cn(
          "creepy-cover",
          variant === "outline" || variant === "secondary"
            ? "creepy-cover--outline"
            : "creepy-cover--primary",
          coverClassName
        )}
        style={coverStyle}
        animate={{
          rotate: isHovered ? -12 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.8,
        }}
      >
        {children}
      </motion.span>

      {/* Invisible placeholder to maintain size since cover is absolute */}
      <span className="creepy-placeholder" aria-hidden="true">
        {children}
      </span>
    </Component>
  );
};

export default CreepyButton;
