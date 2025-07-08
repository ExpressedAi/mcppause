"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SubAgent, MCPServerConfig } from "../types"
import { X, Plus, Trash2, Bot } from "lucide-react"

interface SubAgentConfigProps {
  onAddAgent: (agent: SubAgent) => void
  currentAgents: SubAgent[]
  onRemoveAgent: (id: string) => void
  mcpServers: MCPServerConfig[]
  onClose: () => void
}

export function SubAgentConfig({ onAddAgent, currentAgents, onRemoveAgent, mcpServers, onClose }: SubAgentConfigProps) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [selectedMCPServers, setSelectedMCPServers] = useState<string[]>([])
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("google/gemini-2.5-pro-preview")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !role.trim()) return

    const newAgent: SubAgent = {
      id: Date.now().toString(),
      name: name.trim(),
      role: role.trim(),
      systemPrompt: systemPrompt.trim() || `You are ${name}, a specialized AI agent focused on ${role}.`,
      mcpServers: selectedMCPServers,
      apiKey: apiKey.trim() || undefined,
      model: model,
      isActive: false,
      createdAt: new Date().toISOString(),
    }

    onAddAgent(newAgent)

    // Reset form
    setName("")
    setRole("")
    setSystemPrompt("")
    setSelectedMCPServers([])
    setApiKey("")
    setModel("google/gemini-2.5-pro-preview")
  }

  const toggleMCPServer = (serverId: string) => {
    setSelectedMCPServers((prev) =>
      prev.includes(serverId) ? prev.filter((id) => id !== serverId) : [...prev, serverId],
    )
  }

  const loadPreset = (preset: string) => {
    switch (preset) {
      case "researcher":
        setName("Research Assistant")
        setRole("Research and Analysis")
        setSystemPrompt(
          "You are a specialized research assistant. Focus on gathering information, analyzing data, and providing comprehensive research summaries. Use web search and document analysis tools when available.",
        )
        break
      case "coder":
        setName("Code Assistant")
        setRole("Software Development")
        setSystemPrompt(
          "You are a specialized coding assistant. Focus on writing, reviewing, and debugging code. Use file system tools to read/write code files and help with development tasks.",
        )
        break
      case "writer":
        setName("Content Writer")
        setRole("Content Creation")
        setSystemPrompt(
          "You are a specialized content writer. Focus on creating engaging, well-structured content. Help with writing, editing, and content strategy.",
        )
        break
      case "analyst":
        setName("Data Analyst")
        setRole("Data Analysis")
        setSystemPrompt(
          "You are a specialized data analyst. Focus on analyzing data, creating insights, and generating reports. Use available tools to process and visualize data.",
        )
        break
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Sub-Agent Configuration
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => loadPreset("researcher")}>
            🔍 Researcher
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadPreset("coder")}>
            💻 Coder
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadPreset("writer")}>
            ✍️ Writer
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadPreset("analyst")}>
            📊 Analyst
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Research Assistant"
                required
              />
            </div>
            <div>
              <Label htmlFor="agent-role">Specialization</Label>
              <Input
                id="agent-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Research and Analysis"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a specialized AI agent focused on..."
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-pro-preview">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="anthropic/claude-sonnet-4">Claude Sonnet 4</SelectItem>
                  <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="agent-api-key">API Key (Optional)</Label>
              <Input
                id="agent-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Use default if empty"
              />
            </div>
          </div>

          {/* MCP Server Assignment */}
          {mcpServers.length > 0 && (
            <div>
              <Label>Assigned MCP Servers</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {mcpServers.map((server) => (
                  <Button
                    key={server.id}
                    type="button"
                    variant={selectedMCPServers.includes(server.id!) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMCPServer(server.id!)}
                    className="justify-start"
                  >
                    {server.name}
                    {selectedMCPServers.includes(server.id!) && <span className="ml-1">✓</span>}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Sub-Agent
          </Button>
        </form>

        {/* Current Agents */}
        {currentAgents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Sub-Agents</h3>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {currentAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{agent.name}</span>
                        {agent.isActive && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-blue-700">{agent.role}</div>
                      <div className="text-xs text-blue-600">
                        {agent.mcpServers.length} MCP servers • {agent.model}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveAgent(agent.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
