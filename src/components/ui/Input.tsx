'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'default' | 'large'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = 'default', className = '', ...props }, ref) => {
    const variants = {
      default: 'px-4 py-3 text-base',
      large: 'px-4 py-4 text-xl font-bold text-center tracking-widest uppercase',
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-black uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-white border-2 border-black rounded-xl
            text-black placeholder:text-black/50
            focus:outline-none focus:ring-2 focus:ring-black
            transition-all duration-200
            ${variants[variant]}
            ${error ? 'border-black ring-2 ring-black' : ''}
            ${className}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm font-medium text-black">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
