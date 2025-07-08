"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MCPServerConfig } from "../types"
import { X, Upload, Download, FileText, CheckCircle, AlertCircle } from "lucide-react"

interface MCPConfigManagerProps {
  onImportServers: (servers: MCPServerConfig[]) => void
  currentServers: MCPServerConfig[]
  onClose: () => void
}

interface ClaudeDesktopConfig {
  mcpServers: Record<
    string,
    {
      command: string
      args: string[]
      env?: Record<string, string>
    }
  >
}

export function MCPConfigManager({ onImportServers, currentServers, onClose }: MCPConfigManagerProps) {
  const [configText, setConfigText] = useState("")
  const [parseResult, setParseResult] = useState<{
    success: boolean
    servers?: MCPServerConfig[]
    error?: string
  } | null>(null)

  const parseClaudeConfig = (jsonText: string) => {
    try {
      const config: ClaudeDesktopConfig = JSON.parse(jsonText)

      if (!config.mcpServers) {
        throw new Error("Invalid format: missing 'mcpServers' property")
      }

      const servers: MCPServerConfig[] = Object.entries(config.mcpServers).map(([name, serverConfig]) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name,
        type: "stdio" as const,
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env || {},
        timeout: 300,
      }))

      setParseResult({ success: true, servers })
    } catch (error) {
      setParseResult({
        success: false,
        error: error instanceof Error ? error.message : "Invalid JSON format",
      })
    }
  }

  const handleConfigChange = (value: string) => {
    setConfigText(value)
    if (value.trim()) {
      parseClaudeConfig(value)
    } else {
      setParseResult(null)
    }
  }

  const handleImport = () => {
    if (parseResult?.success && parseResult.servers) {
      onImportServers(parseResult.servers)
      setConfigText("")
      setParseResult(null)
      onClose()
    }
  }

  const exportCurrentConfig = () => {
    const claudeConfig: ClaudeDesktopConfig = {
      mcpServers: {},
    }

    currentServers.forEach((server) => {
      if (server.type === "stdio" && server.command) {
        claudeConfig.mcpServers[server.name] = {
          command: server.command,
          args: server.args || [],
          env: server.env || {},
        }
      }
    })

    const configJson = JSON.stringify(claudeConfig, null, 2)

    // Download as file
    const blob = new Blob([configJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "claude_desktop_config.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadSampleConfig = () => {
    const sampleConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
        },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        "brave-search": {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-brave-search"],
          env: {
            BRAVE_API_KEY: "your-brave-api-key-here",
          },
        },
      },
    }

    setConfigText(JSON.stringify(sampleConfig, null, 2))
    parseClaudeConfig(JSON.stringify(sampleConfig, null, 2))
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Import/Export MCP Configuration</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={loadSampleConfig}>
            <FileText className="h-4 w-4 mr-2" />
            Load Sample
          </Button>
          <Button variant="outline" size="sm" onClick={exportCurrentConfig} disabled={currentServers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Current
          </Button>
        </div>

        <div>
          <Label htmlFor="config">Claude Desktop Configuration (JSON)</Label>
          <Textarea
            id="config"
            value={configText}
            onChange={(e) => handleConfigChange(e.target.value)}
            placeholder={`Paste your claude_desktop_config.json content here:

{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}`}
            className="h-40 font-mono text-sm"
          />
        </div>

        {parseResult && (
          <div
            className={`p-3 rounded-lg border ${
              parseResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {parseResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${parseResult.success ? "text-green-800" : "text-red-800"}`}>
                {parseResult.success ? "Configuration Valid" : "Configuration Error"}
              </span>
            </div>

            {parseResult.success && parseResult.servers ? (
              <div>
                <p className="text-sm text-green-700 mb-2">Found {parseResult.servers.length} MCP server(s):</p>
                <div className="space-y-1">
                  {parseResult.servers.map((server, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {server.name}
                      </Badge>
                      <span className="text-xs text-green-600 font-mono">
                        {server.command} {server.args?.join(" ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-700">{parseResult.error}</p>
            )}
          </div>
        )}

        {parseResult?.success && (
          <Button onClick={handleImport} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Import {parseResult.servers?.length} Server(s)
          </Button>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Tip:</strong> You can copy your existing claude_desktop_config.json content here
          </p>
          <p>
            <strong>Export:</strong> Download your current configuration to use with Claude Desktop
          </p>
          <p>
            <strong>Sample:</strong> Load a working configuration with popular MCP servers
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
