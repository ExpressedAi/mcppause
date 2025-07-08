"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { RAGDocument } from "../types"
import { Plus, Search, Trash2, Database } from "lucide-react"

export function RAGManager() {
  const [documents, setDocuments] = useState<RAGDocument[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Load documents from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("rag-documents")
    if (saved) {
      try {
        setDocuments(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load RAG documents:", error)
      }
    }
  }, [])

  // Save documents to localStorage
  useEffect(() => {
    localStorage.setItem("rag-documents", JSON.stringify(documents))
  }, [documents])

  const addDocument = () => {
    if (!title.trim() || !content.trim()) return

    const newDoc: RAGDocument = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      metadata: {
        wordCount: content.trim().split(/\s+/).length,
      },
    }

    setDocuments((prev) => [newDoc, ...prev])
    setTitle("")
    setContent("")
    setShowAddForm(false)
  }

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const filteredDocuments = documents.filter(
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
              <Button onClick={addDocument} size="sm" className="flex-1">
                Add
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} size="sm">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Database className="h-3 w-3" />
          <span>{documents.length} documents</span>
          {searchQuery && <span>• {filteredDocuments.length} matches</span>}
        </div>

        <ScrollArea className="h-40">
          <div className="space-y-1">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-start justify-between p-2 bg-gray-50 rounded text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{doc.title}</div>
                  <div className="text-gray-500 line-clamp-2">{doc.content}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {doc.metadata?.wordCount} words
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)} className="h-6 w-6 p-0">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {filteredDocuments.length === 0 && documents.length > 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No matching documents</p>
            )}
            {documents.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No documents added yet</p>}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
