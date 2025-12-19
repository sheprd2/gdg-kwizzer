"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "w-full bg-white border-2 border-black rounded-xl",
          "text-black placeholder:text-black/50",
          "focus:outline-none focus:ring-2 focus:ring-black",
          "transition-all duration-200",
          "px-4 py-3 text-base",
          "min-h-24",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
