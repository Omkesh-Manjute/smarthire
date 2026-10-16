import React from "react";
import { cn } from "../../lib/utils";
import "./pop-button.css";

export function PopButton({
  className = "",
  variant = "primary", // "primary" | "retro"
  children = "Learn More",
  style,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "v-pop-btn",
        variant === "retro" ? "v-pop-btn--retro" : "v-pop-btn--primary",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}

export default PopButton;
