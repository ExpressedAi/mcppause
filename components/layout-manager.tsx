"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { LayoutPreset, AppSettings } from "../types"
import { Save, Download, Upload, Trash2, Settings, X, Layers, Info } from "lucide-react"

interface LayoutManagerProps {
  currentSettings: AppSettings
  onLoadLayout: (settings: AppSettings) => void
  onClose: () => void
}

export function LayoutManager({ currentSettings, onLoadLayout, onClose }: LayoutManagerProps) {
  const [layouts, setLayouts] = useState<LayoutPreset[]>([])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [layoutName, setLayoutName] = useState("")
  const [layoutDescription, setLayoutDescription] = useState("")

  // Load layouts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mcp-layout-presets")
    if (saved) {
      try {
        setLayouts(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load layout presets:", error)
      }
    }
  }, [])

  // Save layouts to localStorage
  useEffect(() => {
    localStorage.setItem("mcp-layout-presets", JSON.stringify(layouts))
  }, [layouts])

  const saveCurrentLayout = () => {
    if (!layoutName.trim()) return

    const newLayout: LayoutPreset = {
      id: Date.now().toString(),
      name: layoutName.trim(),
      description: layoutDescription.trim() || undefined,
      settings: { ...currentSettings },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setLayouts((prev) => [newLayout, ...prev])
    setLayoutName("")
    setLayoutDescription("")
    setShowSaveForm(false)
  }

  const loadLayout = (layout: LayoutPreset) => {
    onLoadLayout(layout.settings)
    onClose()
  }

  const deleteLayout = (id: string) => {
    setLayouts((prev) => prev.filter((layout) => layout.id !== id))
  }

  const exportLayout = (layout: LayoutPreset) => {
    const dataStr = JSON.stringify(layout, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${layout.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_layout.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as LayoutPreset
        imported.id = Date.now().toString() // Generate new ID
        imported.updatedAt = new Date().toISOString()
        setLayouts((prev) => [imported, ...prev])
      } catch (error) {
        console.error("Failed to import layout:", error)
        alert("Failed to import layout. Please check the file format.")
      }
    }
    reader.readAsText(file)
    event.target.value = "" // Reset input
  }

  const createQuickPresets = () => {
    const presets: LayoutPreset[] = [
      {
        id: "research-preset",
        name: "Research Assistant Setup",
        description: "Configured for research with web search, memory, and file system access",
        settings: {
          ...currentSettings,
          mcpServers: [
            {
              id: "brave-search",
              name: "Brave Search",
              type: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-brave-search"],
              env: { BRAVE_API_KEY: "" },
            },
            {
              id: "memory",
              name: "Memory",
              type: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-memory"],
            },
            {
              id: "filesystem",
              name: "File System",
              type: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
            },
          ],
          subAgents: [
            {
              id: "researcher",
              name: "Research Assistant",
              role: "Research and Analysis",
              systemPrompt:
                "You are a specialized research assistant. Focus on gathering information, analyzing data, and providing comprehensive research summaries. Use web search and document analysis tools when available.",
              mcpServers: ["brave-search", "memory", "filesystem"],
              model: "google/gemini-2.5-pro-preview",
              isActive: true,
              createdAt: new Date().toISOString(),
            },
          ],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "development-preset",
        name: "Development Environment",
        description: "Configured for software development with file system and GitHub access",
        settings: {
          ...currentSettings,
          mcpServers: [
            {
              id: "filesystem",
              name: "File System",
              type: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
            },
            {
              id: "github",
              name: "GitHub",
              type: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" },
            },
          ],
          subAgents: [
            {
              id: "coder",
              name: "Code Assistant",
              role: "Software Development",
              systemPrompt:
                "You are a specialized coding assistant. Focus on writing, reviewing, and debugging code. Use file system tools to read/write code files and help with development tasks.",
              mcpServers: ["filesystem", "github"],
              model: "google/gemini-2.5-pro-preview",
              isActive: true,
              createdAt: new Date().toISOString(),
            },
          ],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    setLayouts((prev) => [...presets, ...prev])
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Layout Manager
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>💾 Save Complete Setups:</strong> Save your entire configuration including MCP servers, sub-agents,
            API keys, and prompts as reusable layouts.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowSaveForm(!showSaveForm)}>
            <Save className="h-4 w-4 mr-2" />
            Save Current Layout
          </Button>
          <Button variant="outline" size="sm" onClick={createQuickPresets}>
            <Settings className="h-4 w-4 mr-2" />
            Add Quick Presets
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import Layout
              </span>
            </Button>
            <input type="file" accept=".json" onChange={importLayout} className="hidden" />
          </label>
        </div>

        {/* Save Form */}
        {showSaveForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 space-y-3">
              <div>
                <Label htmlFor="layout-name">Layout Name</Label>
                <Input
                  id="layout-name"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="My Research Setup"
                />
              </div>
              <div>
                <Label htmlFor="layout-description">Description (Optional)</Label>
                <Textarea
                  id="layout-description"
                  value={layoutDescription}
                  onChange={(e) => setLayoutDescription(e.target.value)}
                  placeholder="Configured for research with web search and file access..."
                  className="h-16"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveCurrentLayout} size="sm" className="flex-1">
                  Save Layout
                </Button>
                <Button variant="outline" onClick={() => setShowSaveForm(false)} size="sm">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Configuration Summary */}
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm font-medium text-gray-700 mb-2">Current Configuration:</div>
          <div className="flex gap-2 flex-wrap text-xs">
            <Badge variant="secondary">{currentSettings.mcpServers.length} MCP Servers</Badge>
            <Badge variant="secondary">{currentSettings.subAgents.length} Sub-Agents</Badge>
            <Badge variant="secondary">
              {currentSettings.subAgents.filter((a) => a.isActive).length} Active Agents
            </Badge>
            <Badge variant="secondary">{currentSettings.selectedModel}</Badge>
          </div>
        </div>

        {/* Saved Layouts */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Saved Layouts ({layouts.length})</h3>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {layouts.map((layout) => (
                <div
                  key={layout.id}
                  className="flex items-start justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-blue-900">{layout.name}</div>
                    {layout.description && <div className="text-xs text-blue-700 mt-1">{layout.description}</div>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-white">
                        {layout.settings.mcpServers.length} MCP
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {layout.settings.subAgents.length} Agents
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-white">
                        {layout.settings.selectedModel.split("/")[1] || layout.settings.selectedModel}
                      </Badge>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Created: {new Date(layout.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="outline" size="sm" onClick={() => loadLayout(layout)} className="h-8 px-2">
                      Load
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportLayout(layout)} className="h-8 px-2">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteLayout(layout.id)}
                      className="h-8 px-2 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {layouts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved layouts yet</p>
                  <p className="text-xs">Save your current setup to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
