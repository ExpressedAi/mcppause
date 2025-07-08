"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Settings, Trash2, Cog, AlertCircle, Bird, X, Bot, Users, Layers } from "lucide-react"
import { useChat } from "ai/react"
import type { MCPServerConfig, AppSettings, ChatSession, SubAgent } from "./types"
import { AVAILABLE_MODELS } from "./types"
import { MCPServerManager } from "./components/mcp-server-manager"
import { ChatMessage as ChatMessageComponent } from "./components/chat-message"
import { ImageUpload } from "./components/image-upload"
import { AppSettingsModal } from "./components/app-settings-modal"
import { EnhancedRAGManager } from "./components/enhanced-rag-manager"
import { PromptEnhancer } from "./components/prompt-enhancer"
import { EnhancedTextarea } from "./components/enhanced-textarea"
import { SubAgentConfig } from "./components/sub-agent-config"
import { ActiveAgentsPanel } from "./components/active-agents-panel"
import { LayoutManager } from "./components/layout-manager"

const DEFAULT_SETTINGS: AppSettings = {
  openRouterApiKey: "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",
  selectedModel: "google/gemini-2.5-pro-preview",
  mcpServers: [],
  subAgents: [],
  enhancementPrompt: `You are a prompt enhancement specialist. Your job is to take casual, natural language input and transform it into clear, effective prompts that will get better results from AI systems.

Guidelines:
- Make the intent crystal clear
- Add helpful context and structure
- Specify the desired output format when relevant
- Include any necessary constraints or requirements
- Keep the enhanced prompt concise but comprehensive
- Preserve the original meaning while making it more actionable

Transform this user input into an enhanced prompt:`,
}

export default function MCPChatAgent() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [showMCPSettings, setShowMCPSettings] = useState(false)
  const [showSubAgentSettings, setShowSubAgentSettings] = useState(false)
  const [showActiveAgents, setShowActiveAgents] = useState(false)
  const [showAppSettings, setShowAppSettings] = useState(false)
  const [showLayoutManager, setShowLayoutManager] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [selectedMCPServer, setSelectedMCPServer] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [sharedContext, setSharedContext] = useState<string>("")

  // Load settings and sessions from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("mcp-chat-settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
      }
    }

    const savedSessions = localStorage.getItem("mcp-chat-sessions")
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions)
        setChatSessions(parsed)
      } catch (error) {
        console.error("Failed to parse saved sessions:", error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mcp-chat-settings", JSON.stringify(settings))
  }, [settings])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mcp-chat-sessions", JSON.stringify(chatSessions))
  }, [chatSessions])

  const {
    messages,
    input,
    handleInputChange: handleChatInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    body: {
      mcpServers: settings.mcpServers,
      images,
      apiKey: settings.openRouterApiKey,
      model: settings.selectedModel,
      selectedMCPServer,
      sessionId: currentSessionId,
    },
    onFinish: () => {
      setImages([]) // Clear images after sending
      setSelectedMCPServer(null) // Clear selected server after sending

      // Save current session
      if (currentSessionId) {
        const updatedSessions = chatSessions.map((session) =>
          session.id === currentSessionId ? { ...session, messages, updatedAt: new Date().toISOString() } : session,
        )
        setChatSessions(updatedSessions)
      }
    },
  })

  const addMCPServer = (server: MCPServerConfig) => {
    const newServer = { ...server, id: Date.now().toString() }
    setSettings((prev) => ({
      ...prev,
      mcpServers: [...prev.mcpServers, newServer],
    }))
    console.log("Added MCP server:", newServer)
  }

  const addMultipleMCPServers = (servers: MCPServerConfig[]) => {
    const newServers = servers.map((server) => ({
      ...server,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }))
    setSettings((prev) => ({
      ...prev,
      mcpServers: [...prev.mcpServers, ...newServers],
    }))
    console.log("Added multiple MCP servers:", newServers)
  }

  const removeMCPServer = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      mcpServers: prev.mcpServers.filter((server) => server.id !== id),
    }))
  }

  const addSubAgent = (agent: SubAgent) => {
    setSettings((prev) => ({
      ...prev,
      subAgents: [...prev.subAgents, agent],
    }))
    console.log("Added sub-agent:", agent)
  }

  const removeSubAgent = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      subAgents: prev.subAgents.filter((agent) => agent.id !== id),
    }))
  }

  const toggleSubAgent = (agentId: string) => {
    setSettings((prev) => ({
      ...prev,
      subAgents: prev.subAgents.map((agent) =>
        agent.id === agentId ? { ...agent, isActive: !agent.isActive } : agent,
      ),
    }))
  }

  const sendToSubAgent = async (agentId: string, message: string) => {
    const agent = settings.subAgents.find((a) => a.id === agentId)
    if (!agent) return

    // Add the direct message to the chat with special formatting
    const directMessageContent = `🤖 **Direct message to ${agent.name}:**\n\n${message}\n\n---\n\n*Routing to specialized agent for ${agent.role.toLowerCase()}...*`

    // Set the input and trigger submission
    setInput(directMessageContent)
    setSelectedMCPServer(agent.name) // Target the agent's tools

    // Trigger the form submission after a brief delay to ensure state updates
    setTimeout(() => {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }

  const loadLayout = (layoutSettings: AppSettings) => {
    setSettings(layoutSettings)
    console.log("Loaded layout:", layoutSettings)
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setChatSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages([])
  }

  const loadSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
    }
  }

  const clearChat = () => {
    setMessages([])
    setCurrentSessionId(null)
  }

  const addImage = (imageUrl: string) => {
    setImages((prev) => [...prev, imageUrl])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEnhancedPrompt = (enhancedPrompt: string) => {
    setInput(enhancedPrompt)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const newWidth = Math.max(280, Math.min(600, e.clientX))
    setSidebarWidth(newWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing])

  const selectedModelName =
    AVAILABLE_MODELS.find((m) => m.id === settings.selectedModel)?.name || settings.selectedModel

  const handleInputChange = (value: string) => {
    setInput(value)
  }

  const activeAgentsCount = settings.subAgents.filter((agent) => agent.isActive).length

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      {/* Resizable Sidebar */}
      <div
        className="bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col relative shadow-lg"
        style={{ width: sidebarWidth }}
      >
        <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Bird className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Openera Agentic</h1>
            </div>
            <div className="flex gap-1">
              {activeAgentsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActiveAgents(!showActiveAgents)}
                  className="shadow-sm"
                >
                  <Users className="h-4 w-4" />
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800">
                    {activeAgentsCount}
                  </Badge>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLayoutManager(!showLayoutManager)}
                className="shadow-sm"
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAppSettings(true)} className="shadow-sm">
                <Cog className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">Contextual AI Platform</p>
          <div className="mt-2 flex gap-2">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
              {selectedModelName}
            </Badge>
            {currentSessionId && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Session Active
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Layout Manager */}
            {showLayoutManager && (
              <div className="mb-4">
                <LayoutManager
                  currentSettings={settings}
                  onLoadLayout={loadLayout}
                  onClose={() => setShowLayoutManager(false)}
                />
              </div>
            )}

            {/* Chat Sessions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-700">Chat Sessions</h2>
                <Button variant="outline" size="sm" onClick={createNewSession} className="shadow-sm">
                  New
                </Button>
              </div>
              <div className="space-y-1">
                {chatSessions.slice(0, 5).map((session) => (
                  <Button
                    key={session.id}
                    variant={currentSessionId === session.id ? "secondary" : "ghost"}
                    size="sm"
                    className={`w-full justify-start text-left transition-all ${
                      currentSessionId === session.id
                        ? "bg-blue-100 text-blue-900 border-blue-200 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => loadSession(session.id)}
                  >
                    <div className="truncate">{session.title}</div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Sub-Agents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-700">Sub-Agents</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSubAgentSettings(!showSubAgentSettings)}
                  className="shadow-sm"
                >
                  <Bot className="h-4 w-4" />
                </Button>
              </div>

              {showSubAgentSettings && (
                <div className="mb-4">
                  <SubAgentConfig
                    onAddAgent={addSubAgent}
                    currentAgents={settings.subAgents}
                    onRemoveAgent={removeSubAgent}
                    mcpServers={settings.mcpServers}
                    onClose={() => setShowSubAgentSettings(false)}
                  />
                </div>
              )}

              <div className="space-y-2">
                {settings.subAgents.slice(0, 3).map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between p-3 rounded-lg border shadow-sm ${
                      agent.isActive
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Bot className={`h-4 w-4 ${agent.isActive ? "text-green-600" : "text-gray-400"}`} />
                        <div className={`text-sm font-medium ${agent.isActive ? "text-green-900" : "text-gray-900"}`}>
                          {agent.name}
                        </div>
                        {agent.isActive && (
                          <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm" title="Agent active"></div>
                        )}
                      </div>
                      <div className={`text-xs ${agent.isActive ? "text-green-700" : "text-gray-500"}`}>
                        {agent.role}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSubAgent(agent.id)}
                      className={agent.isActive ? "hover:bg-green-100" : "hover:bg-gray-100"}
                    >
                      {agent.isActive ? "Active" : "Activate"}
                    </Button>
                  </div>
                ))}
                {settings.subAgents.length === 0 && (
                  <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                    <Bot className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No sub-agents configured</p>
                    <p className="text-xs text-gray-400 mt-1">Click the bot icon to add agents</p>
                  </div>
                )}
              </div>
            </div>

            {/* MCP Servers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-700">MCP Servers</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMCPSettings(!showMCPSettings)}
                  className="shadow-sm"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {showMCPSettings && (
                <div className="mb-4">
                  <MCPServerManager
                    onAddServer={addMCPServer}
                    onAddMultipleServers={addMultipleMCPServers}
                    currentServers={settings.mcpServers}
                    onClose={() => setShowMCPSettings(false)}
                  />
                </div>
              )}

              <div className="space-y-2">
                {settings.mcpServers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{server.name}</div>
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm" title="Server configured"></div>
                      </div>
                      <div className="text-xs text-gray-500">{server.type}</div>
                      {server.command && (
                        <div className="text-xs text-gray-400 font-mono truncate">{server.command}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMCPServer(server.id!)}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {settings.mcpServers.length === 0 && (
                  <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No MCP servers configured</p>
                    <p className="text-xs text-gray-400 mt-1">Click the settings icon to add servers</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced RAG Manager */}
            <EnhancedRAGManager onContextUpdate={setSharedContext} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
          <Button variant="outline" className="w-full shadow-sm" onClick={clearChat}>
            Clear Chat
          </Button>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full bg-blue-300/50 hover:bg-blue-400 cursor-col-resize transition-colors"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bird className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Openera Agentic</h2>
                <p className="text-gray-600 mb-4">Multi-agent AI platform with intelligent communication</p>
                <div className="flex gap-2 justify-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    {selectedModelName}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Agent Markdown
                  </Badge>
                  {activeAgentsCount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {activeAgentsCount} Active Agents
                    </Badge>
                  )}
                </div>

                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">🤖 Multi-Agent Intelligence</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Create specialized sub-agents, use agent communication markdown, and enhance prompts automatically.
                  </p>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>• Specialized sub-agents with individual tools</div>
                    <div>• Agent communication protocol with markdown</div>
                    <div>• Intelligent prompt enhancement</div>
                    <div>• Cross-agent context sharing</div>
                    <div>• Save and load complete layouts</div>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="animate-fade-in">
                <ChatMessageComponent message={message} />
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Thinking with context...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* MCP Server Selection Bubbles */}
        {settings.mcpServers.length > 0 && (
          <div className="border-t border-gray-200/50 p-3 bg-white/50 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">Quick MCP Server Selection:</span>
                {selectedMCPServer && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMCPServer(null)} className="h-6 px-2">
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {settings.mcpServers.map((server) => (
                  <Button
                    key={server.id}
                    variant={selectedMCPServer === server.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMCPServer(selectedMCPServer === server.name ? null : server.name)}
                    className={`h-8 px-3 text-xs transition-all shadow-sm ${
                      selectedMCPServer === server.name
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    }`}
                  >
                    {server.name}
                    {selectedMCPServer === server.name && <span className="ml-1">✓</span>}
                  </Button>
                ))}
              </div>
              {selectedMCPServer && (
                <p className="text-xs text-blue-600 mt-1">
                  🎯 Targeting <strong>{selectedMCPServer}</strong> server for your next message
                </p>
              )}
            </div>
          </div>
        )}

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="border-t border-gray-200/50 p-4 bg-white/50 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Images to send:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {images.length}
                </Badge>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Upload ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-sm"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area - HARD CUTOFF AT BOTTOM */}
        <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto p-4">
            {/* Prompt Enhancer - Floating popup */}
            <PromptEnhancer
              userInput={input}
              onEnhancedPrompt={handleEnhancedPrompt}
              enhancementPrompt={settings.enhancementPrompt}
            />

            {/* Main Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1">
                <EnhancedTextarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={
                    selectedMCPServer
                      ? `Message for ${selectedMCPServer} server...`
                      : "Type your message naturally - select text for agent markdown formatting..."
                  }
                  className="min-h-[60px] resize-none border-gray-200 shadow-sm focus:border-blue-300 focus:ring-blue-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <ImageUpload onImageUpload={addImage} />
                <Button
                  type="submit"
                  disabled={isLoading || (!input.trim() && images.length === 0)}
                  className="h-[60px] px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Active Agents Panel */}
      <ActiveAgentsPanel
        agents={settings.subAgents}
        onToggleAgent={toggleSubAgent}
        onSendToAgent={sendToSubAgent}
        isVisible={showActiveAgents}
        onClose={() => setShowActiveAgents(false)}
      />

      {/* Settings Modal */}
      {showAppSettings && (
        <AppSettingsModal
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setShowAppSettings(false)}
        />
      )}
    </div>
  )
}
