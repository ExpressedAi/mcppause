"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AppSettings } from "../types"
import { AVAILABLE_MODELS } from "../types"
import { X, Eye, EyeOff, Wand2 } from "lucide-react"

interface AppSettingsModalProps {
  settings: AppSettings
  onUpdateSettings: (settings: Partial<AppSettings>) => void
  onClose: () => void
}

export function AppSettingsModal({ settings, onUpdateSettings, onClose }: AppSettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.openRouterApiKey)
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel)
  const [enhancementPrompt, setEnhancementPrompt] = useState(
    settings.enhancementPrompt ||
      `You are a prompt enhancement specialist. Your job is to take casual, natural language input and transform it into clear, effective prompts that will get better results from AI systems.

Guidelines:
- Make the intent crystal clear
- Add helpful context and structure
- Specify the desired output format when relevant
- Include any necessary constraints or requirements
- Keep the enhanced prompt concise but comprehensive
- Preserve the original meaning while making it more actionable

Transform this user input into an enhanced prompt:`,
  )
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateSettings({
      openRouterApiKey: apiKey,
      selectedModel: selectedModel,
      enhancementPrompt: enhancementPrompt,
    })
    onClose()
  }

  const handleReset = () => {
    setApiKey("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")
    setSelectedModel("google/gemini-2.5-pro-preview")
    setEnhancementPrompt(`You are a prompt enhancement specialist. Your job is to take casual, natural language input and transform it into clear, effective prompts that will get better results from AI systems.

Guidelines:
- Make the intent crystal clear
- Add helpful context and structure
- Specify the desired output format when relevant
- Include any necessary constraints or requirements
- Keep the enhanced prompt concise but comprehensive
- Preserve the original meaning while making it more actionable

Transform this user input into an enhanced prompt:`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Application Settings</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="enhancement" className="flex items-center gap-1">
                <Wand2 className="h-3 w-3" />
                Prompt Enhancement
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">OpenRouter API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your API key is stored locally in your browser</p>
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="enhancement" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wand2 className="h-4 w-4 text-purple-600" />
                    <h3 className="text-sm font-medium text-purple-800">Prompt Enhancement</h3>
                  </div>
                  <p className="text-xs text-purple-700">
                    Customize how your natural language input gets transformed into effective AI prompts using{" "}
                    <code className="bg-purple-100 px-1 rounded">gpt-4.1-nano</code>
                  </p>
                </div>

                <div>
                  <Label htmlFor="enhancementPrompt">Enhancement System Prompt</Label>
                  <Textarea
                    id="enhancementPrompt"
                    value={enhancementPrompt}
                    onChange={(e) => setEnhancementPrompt(e.target.value)}
                    placeholder="Enter your custom enhancement prompt..."
                    className="h-40 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This prompt tells the enhancement model how to transform your input
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-blue-800 mb-2">💡 Enhancement Tips:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Be specific about the transformation style you want</li>
                    <li>• Include examples of good vs. bad prompts</li>
                    <li>• Specify output format requirements</li>
                    <li>• Add domain-specific guidelines for your use case</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-6 border-t border-gray-200 mt-6">
            <Button onClick={handleSubmit} className="flex-1">
              Save Settings
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Storage Info</h3>
            <p className="text-xs text-gray-500">
              All settings are stored locally in your browser's localStorage. The prompt enhancement feature uses a
              dedicated API key for the fast gpt-4.1-nano model.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
