'use client'

import * as React from 'react'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
  icon?: React.ReactNode
}

function InputField({ 
  className, 
  containerClassName,
  label, 
  error, 
  helperText, 
  icon,
  id,
  ...props 
}: InputFieldProps) {
  const inputId = id || `input-${React.useId()}`
  
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <label 
          htmlFor={inputId}
          className="text-sm font-semibold text-black uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-black placeholder:text-black/50 shadow-xs transition-all outline-none file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "border-black focus:border-black focus:ring-2 focus:ring-black",
            "aria-invalid:ring-black/20 aria-invalid:border-black",
            error && "border-black focus:border-black focus:ring-black/20",
            icon && "pl-12",
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-black font-medium">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-black/70">{helperText}</p>
      )}
    </div>
  )
}

function TextareaField({ 
  className, 
  containerClassName,
  label, 
  error, 
  helperText, 
  id,
  rows = 3,
  ...props 
}: InputFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaId = id || `textarea-${React.useId()}`
  
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <label 
          htmlFor={textareaId}
          className="text-sm font-semibold text-black uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-black placeholder:text-black/50 shadow-xs transition-all outline-none resize-none file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "border-black focus:border-black focus:ring-2 focus:ring-black/20",
          "aria-invalid:ring-black/20 aria-invalid:border-black",
          error && "border-black focus:border-black focus:ring-black/20",
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-black font-medium">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-black/70">{helperText}</p>
      )}
    </div>
  )
}

export { InputField, TextareaField }
