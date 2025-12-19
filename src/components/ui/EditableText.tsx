'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Input } from './Input'
import { Textarea } from './textarea'
import { Button } from './Button'
import { cn } from '../../lib/utils'

interface EditableTextProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  label?: string
  multiline?: boolean
  className?: string
  textClassName?: string
  placeholder?: string
}

export function EditableText({
  value: initialValue,
  onSave,
  label,
  multiline = false,
  className,
  textClassName,
  placeholder = 'Click to edit...'
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  
  // Separate refs to avoid type conflicts
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus()
      } else if (!multiline && inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [isEditing, multiline])

  const isValid = value.trim().length > 0

  const handleSave = async () => {
    if (!isValid) return
    if (value === initialValue) {
      setIsEditing(false)
      return
    }

    try {
      setSaving(true)
      await onSave(value)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(initialValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className={cn("w-full space-y-2", className)}>
        {label && <div className="text-sm font-semibold text-black uppercase tracking-wider">{label}</div>}
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            {multiline ? (
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={saving}
                className="min-h-[100px]"
                placeholder={placeholder}
              />
            ) : (
              <Input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={saving}
                placeholder={placeholder}
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              size="icon" 
              onClick={handleSave} 
              disabled={saving || !isValid} 
              className="h-10 w-10 shrink-0" 
              title="Save"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="h-10 w-10 shrink-0"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("group relative border-2 border-transparent rounded-xl p-2 -ml-2 transition-all hover:border-black/10 hover:bg-black/5 cursor-pointer", className)} onClick={() => setIsEditing(true)}>
      {label && <div className="text-sm font-semibold text-black uppercase tracking-wider mb-1">{label}</div>}
      <div className="flex justify-between items-start gap-4">
        <div className={cn("flex-1 text-black whitespace-pre-wrap break-all", textClassName)}>
          {value || <span className="text-black/40 italic">{placeholder}</span>}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-black/50 hover:text-black">
          <Pencil className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
