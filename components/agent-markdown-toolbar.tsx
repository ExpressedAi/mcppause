"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Italic,
  Bold,
  Music,
  Clock,
  MapPin,
  Zap,
  Brain,
  Eye,
  Users,
  List,
  X,
  Hash,
  Strikethrough,
  Sparkles,
  Info,
} from "lucide-react"

interface MarkdownStyle {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  example: string
  format: (text: string) => string
  category: "action" | "thought" | "emphasis" | "reference" | "structure"
  color: string
}

const MARKDOWN_STYLES: MarkdownStyle[] = [
  {
    id: "stage-directions",
    name: "Stage Directions",
    icon: <Italic className="h-3 w-3" />,
    description: "Actions, gestures, and movement",
    example: "*leans against the table, arms crossed*",
    format: (text) => `*${text}*`,
    category: "action",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "inner-monologue",
    name: "Inner Monologue",
    icon: <Brain className="h-3 w-3" />,
    description: "Internal reasoning, doubts, reflections",
    example: "***Should I tell them the truth?***",
    format: (text) => `***${text}***`,
    category: "thought",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "musical-expression",
    name: "Musical Expression",
    icon: <Music className="h-3 w-3" />,
    description: "Background music, emotional tone",
    example: "🎵a slow violin builds tension🎵",
    format: (text) => `🎵${text}🎵`,
    category: "action",
    color: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    id: "temporal-cues",
    name: "Temporal Cues",
    icon: <Clock className="h-3 w-3" />,
    description: "Time shifts, beats, and pacing",
    example: "*a moment of silence hangs in the air*",
    format: (text) => `*${text}*`,
    category: "action",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "spatial-awareness",
    name: "Spatial Awareness",
    icon: <MapPin className="h-3 w-3" />,
    description: "Setting details and atmosphere",
    example: "*the cold wind rushes through the open doorway*",
    format: (text) => `*${text}*`,
    category: "action",
    color: "bg-green-50 text-green-700 border-green-200",
  },
  {
    id: "emphasis",
    name: "Emphasis & Importance",
    icon: <Bold className="h-3 w-3" />,
    description: "Key words, strong statements",
    example: "**This moment changes everything.**",
    format: (text) => `**${text}**`,
    category: "emphasis",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    id: "memory-recall",
    name: "Memory Recall",
    icon: <Brain className="h-3 w-3" />,
    description: "AI referencing past interactions",
    example: "((You mentioned this topic last week.))",
    format: (text) => `((${text}))`,
    category: "reference",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "subtext",
    name: "Subtext / Hidden Meaning",
    icon: <Eye className="h-3 w-3" />,
    description: "Layered meaning, sarcasm, implications",
    example: "[[Oh, I'm sure that will end well.]]",
    format: (text) => `[[${text}]]`,
    category: "reference",
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    id: "persona-shift",
    name: "Persona / Role Shifts",
    icon: <Users className="h-3 w-3" />,
    description: "Mode switching, role shifts",
    example: "{Persona: Cold strategist. No emotions.}",
    format: (text) => `{${text}}`,
    category: "structure",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    id: "logical-steps",
    name: "Logical Steps / Plans",
    icon: <List className="h-3 w-3" />,
    description: "Structured planning, tactical breakdowns",
    example: "**Step 1:** ((Gather intelligence.))",
    format: (text) => `**${text}**`,
    category: "structure",
    color: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    id: "contradictions",
    name: "Contradictions / Reversals",
    icon: <Strikethrough className="h-3 w-3" />,
    description: "Mistakes, sarcasm, things that changed",
    example: "~~That was a brilliant move.~~ It was a disaster.",
    format: (text) => `~~${text}~~`,
    category: "emphasis",
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
  {
    id: "emphasized-recall",
    name: "Emphasized Memory Recall",
    icon: <Zap className="h-3 w-3" />,
    description: "AI doubling down on past interactions",
    example: "**[[You swore you'd never do that again.]]**",
    format: (text) => `**[[${text}]]**`,
    category: "reference",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  {
    id: "logical-corrections",
    name: "Logical Corrections",
    icon: <X className="h-3 w-3" />,
    description: "AI adjusting reasoning or correcting itself",
    example: "[[I originally thought this was true, but I was wrong.]] ~~That idea was perfect.~~",
    format: (text) => `[[${text}]]`,
    category: "reference",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "emotional-realization",
    name: "Emotional Realization",
    icon: <Sparkles className="h-3 w-3" />,
    description: "Strong emotional realization with memory",
    example: "***((I told myself I wouldn't fall for this again.))***",
    format: (text) => `***((${text}))***`,
    category: "thought",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "foreshadowing",
    name: "Heavy Emphasis / Foreshadowing",
    icon: <Hash className="h-3 w-3" />,
    description: "Major revelations or dramatic tension",
    example: "# This was the moment everything changed.",
    format: (text) => `# ${text}`,
    category: "structure",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
]

interface AgentMarkdownToolbarProps {
  onApplyFormat: (formattedText: string) => void
  selectedText: string
  isVisible: boolean
  onClose: () => void
}

export function AgentMarkdownToolbar({ onApplyFormat, selectedText, isVisible, onClose }: AgentMarkdownToolbarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showExamples, setShowExamples] = useState(false)

  const categories = [
    { id: "all", name: "All", color: "bg-gray-100 text-gray-700" },
    { id: "action", name: "Actions", color: "bg-blue-100 text-blue-700" },
    { id: "thought", name: "Thoughts", color: "bg-purple-100 text-purple-700" },
    { id: "emphasis", name: "Emphasis", color: "bg-red-100 text-red-700" },
    { id: "reference", name: "References", color: "bg-indigo-100 text-indigo-700" },
    { id: "structure", name: "Structure", color: "bg-teal-100 text-teal-700" },
  ]

  const filteredStyles =
    selectedCategory === "all"
      ? MARKDOWN_STYLES
      : MARKDOWN_STYLES.filter((style) => style.category === selectedCategory)

  const applyFormat = (style: MarkdownStyle) => {
    const formattedText = style.format(selectedText)
    onApplyFormat(formattedText)
    onClose()
  }

  if (!isVisible) return null

  return (
    <Card className="mb-3 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-purple-800">Agent Communication Protocol</h3>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {selectedText.length} chars selected
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1 h-6 px-2"
            >
              <Info className="h-3 w-3" />
              {showExamples ? "Hide" : "Show"} Examples
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`h-6 px-2 text-xs ${selectedCategory === category.id ? "bg-purple-500 text-white" : category.color}`}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Selected Text Preview */}
        {selectedText && (
          <div className="mb-3 p-2 bg-white/70 rounded-lg border border-purple-200">
            <div className="text-xs text-purple-600 mb-1">Selected Text:</div>
            <div className="text-xs font-mono bg-white p-2 rounded border">"{selectedText}"</div>
          </div>
        )}

        {/* Formatting Options */}
        <ScrollArea className="h-48">
          <div className="grid grid-cols-4 gap-2">
            {filteredStyles.map((style) => (
              <Button
                key={style.id}
                variant="outline"
                className={`h-auto p-2 flex flex-col items-start gap-1 hover:scale-105 transition-transform text-xs ${style.color}`}
                onClick={() => applyFormat(style)}
              >
                <div className="flex items-center gap-1 w-full">
                  {style.icon}
                  <span className="text-xs font-medium truncate">{style.name}</span>
                </div>
                <div className="text-xs text-left opacity-75 line-clamp-1">{style.description}</div>
                {showExamples && (
                  <div className="text-xs font-mono bg-white/50 p-1 rounded w-full text-left truncate">
                    {style.example}
                  </div>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Reference */}
        <div className="mt-3 p-2 bg-white/50 rounded-lg border border-purple-200">
          <div className="text-xs font-medium text-purple-800 mb-1">💡 Quick Reference:</div>
          <div className="text-xs text-purple-700 space-y-1">
            <div>• **Bold** for emphasis • *Italics* for actions • ***Bold Italics*** for thoughts</div>
            <div>• ((Double Parens)) for memory • [[Double Brackets]] for subtext • &#123;Curly&#125; for persona</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
