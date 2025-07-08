import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface ConversationEntry {
  id?: string
  session_id: string
  agent_id?: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, any>
  created_at?: string
}

export class ContextManager {
  // Store conversation in Supabase for cross-agent context
  static async storeConversation(entry: ConversationEntry) {
    try {
      const { data, error } = await supabase.from("conversations").insert([entry]).select()

      if (error) throw error
      return data?.[0]
    } catch (error) {
      console.error("Error storing conversation:", error)
      return null
    }
  }

  // Get recent context for agents
  static async getRecentContext(sessionId?: string, agentId?: string, limit = 50) {
    try {
      let query = supabase.from("conversations").select("*").order("created_at", { ascending: false }).limit(limit)

      if (sessionId) {
        query = query.eq("session_id", sessionId)
      }

      if (agentId) {
        query = query.eq("agent_id", agentId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting recent context:", error)
      return []
    }
  }

  // Get relevant documents for context
  static async getRelevantDocuments(searchQuery?: string, limit = 10) {
    try {
      let query = supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(limit)

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting relevant documents:", error)
      return []
    }
  }

  // Build comprehensive context for agents
  static async buildAgentContext(sessionId: string, agentId?: string, userQuery?: string) {
    const [conversations, documents] = await Promise.all([
      this.getRecentContext(sessionId, agentId, 20),
      this.getRelevantDocuments(userQuery, 5),
    ])

    return {
      recentConversations: conversations,
      relevantDocuments: documents,
      sessionId,
      agentId,
      timestamp: new Date().toISOString(),
    }
  }

  // Store agent response with context
  static async storeAgentResponse(sessionId: string, agentId: string, content: string, metadata?: Record<string, any>) {
    return this.storeConversation({
      session_id: sessionId,
      agent_id: agentId,
      role: "assistant",
      content,
      metadata: {
        ...metadata,
        agent_type: "sub_agent",
      },
    })
  }

  // Store user message with context
  static async storeUserMessage(sessionId: string, content: string, metadata?: Record<string, any>) {
    return this.storeConversation({
      session_id: sessionId,
      role: "user",
      content,
      metadata: {
        ...metadata,
        message_type: "user_input",
      },
    })
  }
}
