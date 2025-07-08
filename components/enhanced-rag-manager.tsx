"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { RAGDocument } from "../types"
import { Plus, Search, Trash2, Database, Cloud, HardDrive, Zap, Info } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface EnhancedRAGManagerProps {
  onContextUpdate?: (context: string) => void
}

export function EnhancedRAGManager({ onContextUpdate }: EnhancedRAGManagerProps) {
  // Local storage state
  const [localDocuments, setLocalDocuments] = useState<RAGDocument[]>([])

  // Supabase storage state
  const [supabaseDocuments, setSupabaseDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("local")

  // Load local documents from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("rag-documents")
    if (saved) {
      try {
        setLocalDocuments(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load local RAG documents:", error)
      }
    }
  }, [])

  // Load Supabase documents
  useEffect(() => {
    loadSupabaseDocuments()
  }, [])

  // Save local documents to localStorage
  useEffect(() => {
    localStorage.setItem("rag-documents", JSON.stringify(localDocuments))
  }, [localDocuments])

  const loadSupabaseDocuments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setSupabaseDocuments(data || [])
    } catch (error) {
      console.error("Error loading Supabase documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addLocalDocument = () => {
    if (!title.trim() || !content.trim()) return

    const newDoc: RAGDocument = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      metadata: {
        wordCount: content.trim().split(/\s+/).length,
        source: "local",
      },
    }

    setLocalDocuments((prev) => [newDoc, ...prev])
    setTitle("")
    setContent("")
    setShowAddForm(false)
  }

  const addSupabaseDocument = async () => {
    if (!title.trim() || !content.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            metadata: {
              wordCount: content.trim().split(/\s+/).length,
              source: "supabase",
            },
          },
        ])
        .select()

      if (error) throw error

      if (data) {
        setSupabaseDocuments((prev) => [data[0], ...prev])
      }

      setTitle("")
      setContent("")
      setShowAddForm(false)
    } catch (error) {
      console.error("Error adding Supabase document:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeLocalDocument = (id: string) => {
    setLocalDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const removeSupabaseDocument = async (id: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id)

      if (error) throw error

      setSupabaseDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (error) {
      console.error("Error removing Supabase document:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchDocuments = async (query: string) => {
    if (!query.trim()) return []

    // Search local documents
    const localResults = localDocuments.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()),
    )

    // Search Supabase documents
    let supabaseResults = []
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(20)

      if (!error && data) {
        supabaseResults = data
      }
    } catch (error) {
      console.error("Error searching Supabase documents:", error)
    }

    return { local: localResults, supabase: supabaseResults }
  }

  const getContextForAgents = async () => {
    // Get recent conversations for context
    try {
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      // Combine with documents for rich context
      const allDocuments = [...localDocuments, ...supabaseDocuments]
      const context = {
        recentConversations: conversations || [],
        availableDocuments: allDocuments.slice(0, 10), // Top 10 most recent
        totalDocuments: allDocuments.length,
      }

      if (onContextUpdate) {
        onContextUpdate(JSON.stringify(context))
      }

      return context
    } catch (error) {
      console.error("Error getting context for agents:", error)
      return null
    }
  }

  const filteredLocalDocuments = localDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredSupabaseDocuments = supabaseDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-700">Knowledge Base</h2>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>🧠 Contextual Coherence:</strong> All conversations and documents are shared across agents for
          intelligent context awareness.
        </AlertDescription>
      </Alert>

      {showAddForm && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
              />
            </div>
            <div>
              <Label htmlFor="doc-content">Content</Label>
              <Textarea
                id="doc-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Document content..."
                className="h-20"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addLocalDocument} size="sm" variant="outline" className="flex-1">
                <HardDrive className="h-3 w-3 mr-1" />
                Add Local
              </Button>
              <Button onClick={addSupabaseDocument} size="sm" className="flex-1" disabled={isLoading}>
                <Cloud className="h-3 w-3 mr-1" />
                Add Cloud
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setShowAddForm(false)} size="sm" className="w-full">
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="local" className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            Local ({localDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="cloud" className="flex items-center gap-1">
            <Cloud className="h-3 w-3" />
            Cloud ({supabaseDocuments.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={getContextForAgents} className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Sync Context
            </Button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Database className="h-3 w-3" />
              <span>Total: {localDocuments.length + supabaseDocuments.length} docs</span>
            </div>
          </div>
        </div>

        <TabsContent value="local" className="mt-3">
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {filteredLocalDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start justify-between p-2 bg-blue-50 rounded text-xs border border-blue-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-blue-600" />
                      {doc.title}
                    </div>
                    <div className="text-gray-500 line-clamp-2">{doc.content}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        {doc.metadata?.wordCount} words
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeLocalDocument(doc.id)} className="h-6 w-6 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {filteredLocalDocuments.length === 0 && localDocuments.length > 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No matching local documents</p>
              )}
              {localDocuments.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No local documents added yet</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="cloud" className="mt-3">
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-xs text-gray-500 mt-2">Loading...</p>
                </div>
              ) : (
                filteredSupabaseDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-2 bg-green-50 rounded text-xs border border-green-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-1">
                        <Cloud className="h-3 w-3 text-green-600" />
                        {doc.title}
                      </div>
                      <div className="text-gray-500 line-clamp-2">{doc.content}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {doc.metadata?.wordCount || 0} words
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSupabaseDocument(doc.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
              {filteredSupabaseDocuments.length === 0 && supabaseDocuments.length > 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No matching cloud documents</p>
              )}
              {supabaseDocuments.length === 0 && !isLoading && (
                <p className="text-xs text-gray-500 text-center py-4">No cloud documents added yet</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
