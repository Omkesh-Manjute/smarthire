import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const staggeredContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggeredItemVariants = {
  hidden: { opacity: 0, y: 35, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function StaggeredGrid({
  children,
  items,
  renderItem,
  className = "",
  itemClassName = "",
  staggerDelay = 0.08,
  viewportAmount = 0.15,
  once = true,
  ...props
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = staggeredItemVariants;

  if (items && Array.isArray(items)) {
    return (
      <motion.div
        className={cn("staggered-grid-container", className)}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: viewportAmount }}
        {...props}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            className={cn("staggered-grid-item", itemClassName)}
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
          >
            {renderItem ? renderItem(item, index) : item}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("staggered-grid-container", className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: viewportAmount }}
      {...props}
    >
      {React.Children.map(children, (child, idx) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div
            key={child.key || idx}
            className={cn("staggered-grid-item", itemClassName)}
            variants={itemVariants}
            whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default StaggeredGrid;
