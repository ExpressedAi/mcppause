"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wand2, Copy, Check, Loader2, Sparkles, ArrowRight } from "lucide-react"

interface PromptEnhancerProps {
  userInput: string
  onEnhancedPrompt: (enhancedPrompt: string) => void
  enhancementPrompt?: string
}

export function PromptEnhancer({ userInput, onEnhancedPrompt, enhancementPrompt }: PromptEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [copied, setCopied] = useState(false)

  const enhancePrompt = async () => {
    if (!userInput.trim()) return

    setIsEnhancing(true)
    setShowResult(false)

    try {
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: userInput.trim(),
          enhancementPrompt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to enhance prompt")
      }

      setEnhancedPrompt(data.enhancedPrompt)
      setShowResult(true)
    } catch (error) {
      console.error("Error enhancing prompt:", error)
      // You could add error state here if needed
    } finally {
      setIsEnhancing(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(enhancedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const useEnhancedPrompt = () => {
    onEnhancedPrompt(enhancedPrompt)
    setShowResult(false)
    setEnhancedPrompt("")
  }

  if (!userInput.trim()) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Enhancement Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={enhancePrompt}
          disabled={isEnhancing}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:text-purple-800"
        >
          {isEnhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          {isEnhancing ? "Enhancing..." : "Enhance Prompt"}
        </Button>
        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
          gpt-4.1-nano
        </Badge>
      </div>

      {/* Enhancement Result */}
      {showResult && enhancedPrompt && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
              <Sparkles className="h-4 w-4" />
              Enhanced Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-purple-200 bg-white/50">
              <ArrowRight className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                <strong>Original:</strong> {userInput.substring(0, 100)}
                {userInput.length > 100 && "..."}
              </AlertDescription>
            </Alert>

            <div className="bg-white/70 rounded-lg p-3 border border-purple-200">
              <Textarea
                value={enhancedPrompt}
                readOnly
                className="min-h-[100px] resize-none border-0 bg-transparent focus:ring-0 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={useEnhancedPrompt} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                Use Enhanced Prompt
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-1">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
