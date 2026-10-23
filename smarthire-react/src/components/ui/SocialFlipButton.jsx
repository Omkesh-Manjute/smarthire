import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import {
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaEnvelope,
  FaDiscord
} from 'react-icons/fa'
import './social-flip-button.css'

const defaultItems = [
  { letter: 'C', icon: <FaGithub />, label: 'GitHub', href: 'https://github.com', variant: 'github' },
  { letter: 'O', icon: <FaTwitter />, label: 'X (Twitter)', href: 'https://twitter.com', variant: 'twitter' },
  { letter: 'N', icon: <FaLinkedin />, label: 'LinkedIn', href: 'https://linkedin.com', variant: 'linkedin' },
  { letter: 'T', icon: <FaInstagram />, label: 'Instagram', href: 'https://instagram.com', variant: 'instagram' },
  { letter: 'A', icon: <FaFacebook />, label: 'Facebook', href: 'https://facebook.com', variant: 'facebook' },
  { letter: 'C', icon: <FaEnvelope />, label: 'Email Support', href: 'mailto:support@praximinds.com', variant: 'email' },
  { letter: 'T', icon: <FaDiscord />, label: 'Community Discord', href: 'https://discord.com', variant: 'discord' },
]

function SocialFlipNode({
  item,
  index,
  isHovered,
  setTooltipIndex,
  tooltipIndex,
  itemClassName,
  frontClassName,
  backClassName,
}) {
  const isSelfHovered = tooltipIndex === index
  const Tag = item.href ? 'a' : 'button'
  const tagProps = item.href
    ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
    : { onClick: item.onClick, type: 'button' }

  return (
    <Tag
      {...tagProps}
      className={cn('social-flip-node', itemClassName)}
      onMouseEnter={() => setTooltipIndex(index)}
      onMouseLeave={() => setTooltipIndex(null)}
      aria-label={item.label}
    >
      <AnimatePresence>
        {isHovered && isSelfHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 8, scale: 0.8, x: '-50%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="social-flip-tooltip"
          >
            {item.label}
            <div className="social-flip-tooltip-arrow" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="social-flip-flipper"
        initial={false}
        animate={{ rotateY: isHovered ? 180 : 0 }}
        transition={{
          duration: 0.7,
          type: 'spring',
          stiffness: 140,
          damping: 14,
          delay: index * 0.07,
        }}
      >
        {/* Front - Letter */}
        <div className={cn('social-flip-front', frontClassName)}>
          {item.letter}
        </div>

        {/* Back - Social Icon */}
        <div
          className={cn(
            'social-flip-back',
            item.variant && `social-back-${item.variant}`,
            backClassName
          )}
        >
          {item.icon}
        </div>
      </motion.div>
    </Tag>
  )
}

export function SocialFlipButton({
  items = defaultItems,
  className,
  itemClassName,
  frontClassName,
  backClassName,
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipIndex, setTooltipIndex] = useState(null)

  return (
    <div className={cn('social-flip-container', className)}>
      <div
        className="social-flip-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setTooltipIndex(null)
        }}
      >
        {/* Animated Laser Border Lines */}
        <div className="social-flip-laser-wrap">
          <motion.div
            className="social-flip-laser-top"
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.div
            className="social-flip-laser-bottom"
            animate={{ x: ['100%', '-100%'] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {items.map((item, index) => (
          <SocialFlipNode
            key={index}
            item={item}
            index={index}
            isHovered={isHovered}
            setTooltipIndex={setTooltipIndex}
            tooltipIndex={tooltipIndex}
            itemClassName={itemClassName}
            frontClassName={frontClassName}
            backClassName={backClassName}
          />
        ))}
      </div>
    </div>
  )
}

export default SocialFlipButton
