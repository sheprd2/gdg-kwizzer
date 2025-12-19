'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  margin = 'md',
}: CardProps) {
  const variants = {
    default: 'bg-white border-2 border-black',
    glass: 'bg-white/90 backdrop-blur-xl border-2 border-black',
    bordered: 'bg-transparent border-2 border-black',
  }

  const paddings = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-10',
    '3xl': 'p-12',
    '4xl': 'p-16',
    '5xl': 'p-20',
    '6xl': 'p-24',
    '7xl': 'p-32',
  }

  const margins = {
    none: '',
    sm: 'mb-2',
    md: 'mb-4',
    lg: 'mb-6',
    xl: 'mb-8',
    '2xl': 'mb-10',
    '3xl': 'mb-12',
    '4xl': 'mb-16',
    '5xl': 'mb-20',
    '6xl': 'mb-24',
    '7xl': 'mb-32',
  }

  return (
    <div
      className={`
        rounded-2xl shadow-xl
        ${variants[variant]}
        ${paddings[padding]}
        ${margins[margin]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
