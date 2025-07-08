"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { MCPServerConfig } from "../types"
import { X, Plus, Trash2, AlertTriangle, Info } from "lucide-react"
import { MCPConfigManager } from "./mcp-config-manager"

interface MCPServerManagerProps {
  onAddServer: (server: MCPServerConfig) => void
  onAddMultipleServers: (servers: MCPServerConfig[]) => void
  currentServers: MCPServerConfig[]
  onClose: () => void
}

interface EnvVar {
  name: string
  value: string
}

export function MCPServerManager({
  onAddServer,
  onAddMultipleServers,
  currentServers,
  onClose,
}: MCPServerManagerProps) {
  const [serverType, setServerType] = useState<"stdio" | "sse">("stdio")
  const [name, setName] = useState("")
  const [command, setCommand] = useState("")
  const [args, setArgs] = useState("")
  const [envVars, setEnvVars] = useState<EnvVar[]>([{ name: "", value: "" }])
  const [url, setUrl] = useState("")
  const [headers, setHeaders] = useState("")
  const [timeout, setTimeout] = useState("300")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    const server: MCPServerConfig = {
      name: name.trim(),
      type: serverType,
      timeout: Number.parseInt(timeout) || 300,
    }

    if (serverType === "stdio") {
      if (!command.trim()) return
      server.command = command.trim()
      if (args.trim()) {
        server.args = args
          .split(",")
          .map((arg) => arg.trim())
          .filter(Boolean)
      }

      // Add environment variables
      const validEnvVars = envVars.filter((env) => env.name.trim() && env.value.trim())
      if (validEnvVars.length > 0) {
        server.env = validEnvVars.reduce(
          (acc, env) => {
            acc[env.name.trim()] = env.value.trim()
            return acc
          },
          {} as Record<string, string>,
        )
      }
    } else {
      if (!url.trim()) return
      server.url = url.trim()
      if (headers.trim()) {
        try {
          server.headers = JSON.parse(headers)
        } catch (e) {
          alert("Invalid JSON format for headers")
          return
        }
      }
    }

    onAddServer(server)

    // Reset form
    setName("")
    setCommand("")
    setArgs("")
    setEnvVars([{ name: "", value: "" }])
    setUrl("")
    setHeaders("")
    setTimeout("300")
  }

  const loadPreset = (preset: string) => {
    switch (preset) {
      case "filesystem":
        setName("File System")
        setServerType("stdio")
        setCommand("npx")
        setArgs("-y, @modelcontextprotocol/server-filesystem, .")
        setEnvVars([{ name: "", value: "" }])
        break
      case "memory":
        setName("Memory")
        setServerType("stdio")
        setCommand("npx")
        setArgs("-y, @modelcontextprotocol/server-memory")
        setEnvVars([{ name: "", value: "" }])
        break
      case "brave-search":
        setName("Brave Search")
        setServerType("stdio")
        setCommand("npx")
        setArgs("-y, @modelcontextprotocol/server-brave-search")
        setEnvVars([{ name: "BRAVE_API_KEY", value: "" }])
        break
      case "github":
        setName("GitHub")
        setServerType("stdio")
        setCommand("npx")
        setArgs("-y, @modelcontextprotocol/server-github")
        setEnvVars([{ name: "GITHUB_PERSONAL_ACCESS_TOKEN", value: "" }])
        break
      case "close":
        setName("Close CRM")
        setServerType("stdio")
        setCommand("npx")
        setArgs("@shiftengineering/mcp-close-server")
        setEnvVars([{ name: "CLOSE_API_KEY", value: "" }])
        break
    }
  }

  const addEnvVar = () => {
    setEnvVars([...envVars, { name: "", value: "" }])
  }

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: "name" | "value", value: string) => {
    const updated = [...envVars]
    updated[index][field] = value
    setEnvVars(updated)
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">MCP Server Configuration</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Common Connection Issues:</strong>
            <ul className="mt-2 text-sm space-y-1">
              <li>• MCP server package not installed globally</li>
              <li>• Missing or incorrect API keys in environment variables</li>
              <li>• Node.js/npm not available in the runtime environment</li>
              <li>• Firewall blocking connections</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Setup</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => loadPreset("filesystem")}>
                📁 File System
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadPreset("memory")}>
                🧠 Memory
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadPreset("brave-search")}>
                🔍 Brave Search
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadPreset("github")}>
                🐙 GitHub
              </Button>
              <Button variant="outline" size="sm" onClick={() => loadPreset("close")}>
                💼 Close CRM
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Testing Tip:</strong> Start with File System or Memory servers - they don't require API keys and
                are easier to debug. Check the browser console (F12) for detailed connection logs.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My MCP Server"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Connection Type</Label>
                <Select value={serverType} onValueChange={(value: "stdio" | "sse") => setServerType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stdio">STDIO (Local)</SelectItem>
                    <SelectItem value="sse">SSE (Remote)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(e.target.value)}
                  placeholder="300"
                  min="1"
                  max="3600"
                />
              </div>

              {serverType === "stdio" ? (
                <>
                  <div>
                    <Label htmlFor="command">Command</Label>
                    <Input
                      id="command"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="npx"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usually "npx" for Node.js MCP servers. Make sure Node.js is installed.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="args">Arguments (comma-separated)</Label>
                    <Input
                      id="args"
                      value={args}
                      onChange={(e) => setArgs(e.target.value)}
                      placeholder="-y, @modelcontextprotocol/server-filesystem, ."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "-y, @modelcontextprotocol/server-filesystem, ." for file system access
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Environment Variables</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addEnvVar}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {envVars.map((envVar, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="Variable name (e.g., API_KEY)"
                            value={envVar.name}
                            onChange={(e) => updateEnvVar(index, "name", e.target.value)}
                          />
                          <Input
                            placeholder="Variable value"
                            type="password"
                            value={envVar.value}
                            onChange={(e) => updateEnvVar(index, "value", e.target.value)}
                          />
                          {envVars.length > 1 && (
                            <Button type="button" variant="outline" size="sm" onClick={() => removeEnvVar(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Add API keys and other environment variables required by the MCP server
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="url">Server URL</Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="http://localhost:3000/sse"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="headers">Headers (JSON)</Label>
                    <Textarea
                      id="headers"
                      value={headers}
                      onChange={(e) => setHeaders(e.target.value)}
                      placeholder='{"Authorization": "Bearer token"}'
                      className="h-20"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                Add Server
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="import">
            <MCPConfigManager
              onImportServers={onAddMultipleServers}
              currentServers={currentServers}
              onClose={() => {}}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
