'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg' | 'icon'
  variant?: 'primary' | 'outline' | 'ghost'
  children: ReactNode
  isLoading?: boolean
  fullWidth?: boolean
}

export function Button({
  size = 'md',
  variant = 'outline',
  children,
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-1 font-semibold rounded-sm my-1 mx-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeVariants = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    icon: 'p-2',
  }

  const styleVariants = {
    primary: 'bg-black text-white border-2 border-black hover:bg-black/80 focus:ring-black/20',
    outline: 'bg-white text-black border-2 border-black hover:bg-black/10 focus:ring-black/20',
    ghost: 'bg-transparent text-black border-2 border-transparent hover:bg-black/10 focus:ring-black/20',
  }

  const spinnerClassName = variant === 'primary' ? 'border-white border-t-transparent' : 'border-black border-t-transparent'

  return (
    <button
      className={`
        ${baseStyles}
        ${styleVariants[variant]}
        ${sizeVariants[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className={`w-4 h-4 border-2 ${spinnerClassName} rounded-full animate-spin`} />
      )}
      {children}
    </button>
  )
}
