import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { experimental_createMCPClient, streamText } from "ai"
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio"
import type { MCPServerConfig } from "../../types"
import { ContextManager } from "../../lib/context-manager"

// Store active MCP clients with connection status
const mcpClients = new Map<string, { client: any; status: string; error?: string; tools?: string[] }>()

async function createMCPClient(config: MCPServerConfig) {
  const clientKey = `${config.type}-${config.name}`

  if (mcpClients.has(clientKey)) {
    const existing = mcpClients.get(clientKey)
    console.log(`Reusing existing MCP client for ${config.name}, status: ${existing?.status}`)
    return existing?.client
  }

  console.log(`Creating new MCP client for ${config.name}:`, {
    command: config.command,
    args: config.args,
    env: Object.keys(config.env || {}),
    type: config.type,
  })

  try {
    let client
    let transport

    if (config.type === "stdio" && config.command) {
      console.log(`Creating stdio transport with command: ${config.command}`, config.args)

      // Enhanced environment setup
      const environment = {
        ...process.env,
        NODE_ENV: "production",
        PATH: process.env.PATH,
        ...(config.env || {}),
      }

      console.log(`Environment variables for ${config.name}:`, Object.keys(environment))

      transport = new Experimental_StdioMCPTransport({
        command: config.command,
        args: config.args || [],
        env: environment,
      })

      console.log(`Transport created, initializing MCP client for ${config.name}`)

      // Add timeout to client creation
      const clientPromise = experimental_createMCPClient({
        transport,
      })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Client creation timeout")), 30000),
      )

      client = await Promise.race([clientPromise, timeoutPromise])

      console.log(`MCP client created successfully for ${config.name}`)

      // Test the connection by trying to get tools
      console.log(`Testing connection for ${config.name} by fetching tools...`)
      const tools = await client.tools()
      const toolNames = Object.keys(tools)
      console.log(`Successfully connected to ${config.name}, got ${toolNames.length} tools:`, toolNames)

      // Store successful connection
      mcpClients.set(clientKey, {
        client,
        status: "connected",
        tools: toolNames,
      })

      return client
    } else if (config.type === "sse" && config.url) {
      console.log(`Creating SSE transport with URL: ${config.url}`)

      client = await experimental_createMCPClient({
        transport: {
          type: "sse",
          url: config.url,
          headers: config.headers || {},
        },
      })

      console.log(`SSE MCP client created successfully for ${config.name}`)

      // Test SSE connection
      const tools = await client.tools()
      const toolNames = Object.keys(tools)
      console.log(`Successfully connected to SSE ${config.name}, got ${toolNames.length} tools:`, toolNames)

      mcpClients.set(clientKey, {
        client,
        status: "connected",
        tools: toolNames,
      })

      return client
    }

    console.error(`Invalid configuration for ${config.name}: missing command or URL`)
    mcpClients.set(clientKey, {
      client: null,
      status: "failed",
      error: "Invalid configuration: missing command or URL",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Failed to create MCP client for ${config.name}:`, errorMessage)
    console.error("Full error:", error)

    // Store failed connection with detailed error
    mcpClients.set(clientKey, {
      client: null,
      status: "failed",
      error: errorMessage,
    })

    // Common error diagnostics
    if (errorMessage.includes("ENOENT")) {
      console.error(`❌ Command not found for ${config.name}. Make sure ${config.command} is installed.`)
    } else if (errorMessage.includes("EACCES")) {
      console.error(`❌ Permission denied for ${config.name}. Check file permissions.`)
    } else if (errorMessage.includes("timeout")) {
      console.error(`❌ Connection timeout for ${config.name}. Server may be slow to start.`)
    } else if (errorMessage.includes("spawn")) {
      console.error(`❌ Failed to spawn process for ${config.name}. Check command and arguments.`)
    }
  }

  return null
}

export async function POST(req: Request) {
  try {
    const { messages, mcpServers, images, apiKey, model, selectedMCPServer, sessionId } = await req.json()

    console.log(`🚀 Starting chat request with ${mcpServers?.length || 0} MCP servers`)
    if (selectedMCPServer) {
      console.log(`🎯 User selected MCP server: ${selectedMCPServer}`)
    }

    // Store user message in context
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === "user" && sessionId) {
      await ContextManager.storeUserMessage(sessionId, lastMessage.content, {
        selectedMCPServer,
        hasImages: images?.length > 0,
      })
    }

    // Get contextual information for the agent
    const agentContext = sessionId
      ? await ContextManager.buildAgentContext(sessionId, "main", lastMessage?.content)
      : null

    // Use provided API key or fallback to default
    const openRouterApiKey = apiKey || "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"
    const selectedModel = model || "google/gemini-2.5-pro-preview"

    const openrouter = createOpenRouter({
      apiKey: openRouterApiKey,
    })

    // Collect tools from all MCP servers with detailed status tracking
    let allTools = {}
    const serverStatuses: Array<{
      name: string
      status: "connected" | "failed" | "pending"
      error?: string
      tools?: string[]
    }> = []

    for (const serverConfig of mcpServers || []) {
      console.log(`🔄 Processing MCP server: ${serverConfig.name}`)

      const client = await createMCPClient(serverConfig)
      const clientKey = `${serverConfig.type}-${serverConfig.name}`
      const clientInfo = mcpClients.get(clientKey)

      if (client && clientInfo?.status === "connected") {
        try {
          console.log(`✅ Getting tools from connected server: ${serverConfig.name}`)
          const tools = await client.tools()
          const toolNames = Object.keys(tools)
          console.log(`📦 Got ${toolNames.length} tools from ${serverConfig.name}:`, toolNames)

          allTools = { ...allTools, ...tools }
          serverStatuses.push({
            name: serverConfig.name,
            status: "connected",
            tools: toolNames,
          })
        } catch (error) {
          console.error(`❌ Failed to get tools from ${serverConfig.name}:`, error)
          serverStatuses.push({
            name: serverConfig.name,
            status: "failed",
            error: `Tool fetch failed: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
      } else {
        console.error(`❌ No client or failed connection for ${serverConfig.name}`)
        serverStatuses.push({
          name: serverConfig.name,
          status: "failed",
          error: clientInfo?.error || "Failed to create client",
        })
      }
    }

    console.log(`📊 Final status - Total tools: ${Object.keys(allTools).length}`)
    console.log(`📊 Server statuses:`, serverStatuses)

    // Process images in the last message if any
    if (images && images.length > 0 && lastMessage?.role === "user") {
      const content = [{ type: "text", text: lastMessage.content }]

      for (const image of images) {
        content.push({
          type: "image_url",
          image_url: { url: image },
        })
      }

      lastMessage.content = content
    }

    // Create enhanced system prompt with context
    const systemPrompt = `You are Openera Agentic, an intelligent AI assistant with access to MCP (Model Context Protocol) tools and shared context across conversations.

**🧠 Contextual Awareness:**
${
  agentContext
    ? `
- Recent conversations: ${agentContext.recentConversations.length} messages
- Available documents: ${agentContext.relevantDocuments.length} documents
- Session ID: ${agentContext.sessionId}

**Recent Context:**
${agentContext.recentConversations
  .slice(0, 5)
  .map((conv) => `${conv.role}: ${conv.content.substring(0, 100)}...`)
  .join("\n")}

**Relevant Documents:**
${agentContext.relevantDocuments.map((doc) => `- ${doc.title}: ${doc.content.substring(0, 100)}...`).join("\n")}
`
    : "No contextual information available for this session."
}

**🔧 MCP Connection Status:**
${serverStatuses
  .map((server) => {
    if (server.status === "connected") {
      return `✅ **${server.name}**: Connected (${server.tools?.length || 0} tools: ${server.tools?.join(", ") || "none"})`
    } else {
      return `❌ **${server.name}**: Failed - ${server.error}`
    }
  })
  .join("\n")}

**📦 Available Tools (${Object.keys(allTools).length} total):**
${
  Object.keys(allTools).length > 0
    ? Object.keys(allTools)
        .map((toolName) => `- **${toolName}**: ${allTools[toolName].description || "No description"}`)
        .join("\n")
    : "❌ No tools available - all server connections failed"
}

${selectedMCPServer ? `**🎯 User Selected Server:** ${selectedMCPServer} - Focus on using tools from this server when possible.` : ""}

**Instructions:**
1. Use the contextual information to provide coherent, informed responses
2. When you use tools, ALWAYS explain what you're doing before and after using them
3. Format your responses using proper markdown for better readability
4. Use headers, lists, code blocks, and tables to structure your responses
5. When presenting results from tools, organize them clearly with appropriate formatting
6. If you perform multiple operations, create a summary report at the end
7. Reference previous conversations and documents when relevant

**Tool Usage Guidelines:**
- Announce when you're about to use a tool: "I'll now use the [tool_name] tool to..."
- Explain the results: "The tool returned the following information..."
- Provide context and interpretation of the results

${
  Object.keys(allTools).length === 0
    ? `
⚠️ **No MCP tools are currently available.** This means the MCP server connections failed. 
Please check the troubleshooting tips and ensure your MCP servers are properly configured and running.
`
    : `
🎉 **MCP tools are available!** You can now use the connected tools for various tasks.
`
}

If images are provided, analyze them thoroughly and incorporate the analysis into your response using proper markdown formatting.`

    const result = streamText({
      model: openrouter.chat(selectedModel),
      messages,
      tools: Object.keys(allTools).length > 0 ? allTools : undefined,
      system: systemPrompt,
      onFinish: async (result) => {
        // Store assistant response in context
        if (sessionId && result.text) {
          await ContextManager.storeConversation({
            session_id: sessionId,
            agent_id: "main",
            role: "assistant",
            content: result.text,
            metadata: {
              model: selectedModel,
              toolsUsed: result.toolCalls?.length || 0,
              selectedMCPServer,
            },
          })
        }
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("💥 Chat API error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
