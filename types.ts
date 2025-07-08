export interface MCPServerConfig {
  id?: string
  name: string
  type: "stdio" | "sse"
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
  timeout?: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface RAGDocument {
  id: string
  title: string
  content: string
  embedding?: number[]
  metadata?: Record<string, any>
  createdAt: string
}

export interface SubAgent {
  id: string
  name: string
  role: string
  systemPrompt: string
  mcpServers: string[]
  apiKey?: string
  model: string
  isActive: boolean
  createdAt: string
}

export interface AppSettings {
  openRouterApiKey: string
  selectedModel: string
  mcpServers: MCPServerConfig[]
  subAgents: SubAgent[]
  enhancementPrompt?: string
}

export interface LayoutPreset {
  id: string
  name: string
  description?: string
  settings: AppSettings
  createdAt: string
  updatedAt: string
}

export const AVAILABLE_MODELS = [
  { id: "google/gemini-2.5-pro-preview", name: "Google Gemini 2.5 Pro Preview" },
  { id: "anthropic/claude-sonnet-4", name: "Anthropic Claude Sonnet 4" },
] as const
