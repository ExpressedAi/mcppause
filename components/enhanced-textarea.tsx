"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AgentMarkdownToolbar } from "./agent-markdown-toolbar"
import { Sparkles } from "lucide-react"

interface EnhancedTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export function EnhancedTextarea({ value, onChange, placeholder, className, onKeyDown }: EnhancedTextareaProps) {
  const [selectedText, setSelectedText] = useState("")
  const [showToolbar, setShowToolbar] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)

  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selected = value.substring(start, end)

    if (selected.length > 0) {
      setSelectedText(selected)
      setSelectionStart(start)
      setSelectionEnd(end)
    } else {
      setSelectedText("")
    }
  }, [value])

  const handleApplyFormat = (formattedText: string) => {
    if (!textareaRef.current) return

    // Simple client-side text replacement - NO AUTO-SUBMIT
    const beforeSelection = value.substring(0, selectionStart)
    const afterSelection = value.substring(selectionEnd)
    const newValue = beforeSelection + formattedText + afterSelection

    // Update the textarea value directly
    onChange(newValue)
    setShowToolbar(false)
    setSelectedText("")

    // Focus back to textarea and position cursor after the formatted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newCursorPosition = selectionStart + formattedText.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 100)
  }

  const openToolbar = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent any form submission
    e.stopPropagation() // Stop event bubbling
    if (selectedText.length > 0) {
      setShowToolbar(true)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`${className} pr-12`}
        />

        {/* Format Button - Only show when text is selected */}
        {selectedText.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openToolbar}
            className="absolute top-2 right-2 h-8 px-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 text-blue-700 hover:text-blue-800 shadow-sm"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Format
          </Button>
        )}
      </div>

      {/* Agent Markdown Toolbar - Pure client-side formatting */}
      <AgentMarkdownToolbar
        selectedText={selectedText}
        isVisible={showToolbar}
        onApplyFormat={handleApplyFormat}
        onClose={() => {
          setShowToolbar(false)
          setSelectedText("")
        }}
      />
    </div>
  )
}
