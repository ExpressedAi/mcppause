"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { SubAgent } from "../types"
import { Bot, Zap, MessageSquare, X, Send } from "lucide-react"

interface ActiveAgentsPanelProps {
  agents: SubAgent[]
  onToggleAgent: (agentId: string) => void
  onSendToAgent: (agentId: string, message: string) => void
  isVisible: boolean
  onClose: () => void
}

export function ActiveAgentsPanel({
  agents,
  onToggleAgent,
  onSendToAgent,
  isVisible,
  onClose,
}: ActiveAgentsPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [directMessage, setDirectMessage] = useState("")

  if (!isVisible) return null

  const activeAgents = agents.filter((agent) => agent.isActive)

  const sendDirectMessage = (agentId: string) => {
    if (!directMessage.trim()) return

    onSendToAgent(agentId, directMessage.trim())
    setDirectMessage("")
    setSelectedAgent(null)
  }

  return (
    <div className="fixed right-4 top-4 bottom-4 w-80 z-40 animate-fade-in">
      <Card className="h-full shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Active Sub-Agents
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg border transition-all ${
                    agent.isActive
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className={`h-4 w-4 ${agent.isActive ? "text-green-600" : "text-gray-400"}`} />
                      <span className={`font-medium ${agent.isActive ? "text-green-900" : "text-gray-600"}`}>
                        {agent.name}
                      </span>
                    </div>
                    <Button
                      variant={agent.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onToggleAgent(agent.id)}
                      className={agent.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {agent.isActive ? "Active" : "Activate"}
                    </Button>
                  </div>

                  <div className="text-xs text-gray-600 mb-2">{agent.role}</div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {agent.model.split("/")[1] || agent.model}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {agent.mcpServers.length} tools
                    </Badge>
                  </div>

                  {agent.isActive && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs mb-2"
                        onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Direct Message
                      </Button>

                      {selectedAgent === agent.id && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder={`Send message to ${agent.name}...`}
                            value={directMessage}
                            onChange={(e) => setDirectMessage(e.target.value)}
                            className="text-xs resize-none h-16"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                sendDirectMessage(agent.id)
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => sendDirectMessage(agent.id)}
                              disabled={!directMessage.trim()}
                              className="flex-1 h-7 text-xs"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAgent(null)
                                setDirectMessage("")
                              }}
                              className="h-7 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            💡 Tip: Press Enter to send, Shift+Enter for new line
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {agents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sub-agents configured</p>
                  <p className="text-xs">Create agents in the sidebar</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
