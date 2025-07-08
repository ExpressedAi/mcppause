"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Bot, Wrench, CheckCircle, Clock, AlertCircle, Info, AlertTriangle, Lightbulb, Zap } from "lucide-react"
import type { Message } from "ai"
import ReactMarkdown from "react-markdown"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const getToolCallStatus = (toolCall: any) => {
    if (toolCall.state === "result") return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" }
    if (toolCall.state === "call") return { icon: Clock, color: "text-blue-600", bg: "bg-blue-50" }
    return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-gray-500 to-gray-600"
          } shadow-sm`}
        >
          {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
        </div>

        <Card
          className={`${isUser ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200" : "bg-white shadow-sm"}`}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Tool invocations - Show first if assistant message */}
              {isAssistant && message.toolInvocations && message.toolInvocations.length > 0 && (
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Tool Operations</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {message.toolInvocations.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {message.toolInvocations.map((tool, index) => {
                      const { icon: StatusIcon, color, bg } = getToolCallStatus(tool)

                      return (
                        <div key={index} className={`rounded-lg p-3 border ${bg} border-gray-200 shadow-sm`}>
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className={`h-4 w-4 ${color}`} />
                            <Badge variant="outline" className="font-mono text-xs bg-white">
                              {tool.toolName}
                            </Badge>
                            <span className={`text-xs font-medium ${color}`}>
                              {tool.state === "call" && "Executing..."}
                              {tool.state === "result" && "Completed"}
                              {tool.state === "error" && "Failed"}
                            </span>
                          </div>

                          {tool.args && (
                            <div className="mb-2">
                              <div className="text-xs font-medium text-gray-600 mb-1">Parameters:</div>
                              <div className="bg-slate-900 text-slate-100 rounded-lg border p-3 text-xs font-mono overflow-x-auto shadow-inner">
                                <pre>{JSON.stringify(tool.args, null, 2)}</pre>
                              </div>
                            </div>
                          )}

                          {tool.result && (
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">Result:</div>
                              <div className="bg-slate-900 text-slate-100 rounded-lg border p-3 text-xs font-mono overflow-x-auto shadow-inner">
                                {typeof tool.result === "string" ? (
                                  <pre className="whitespace-pre-wrap">{tool.result}</pre>
                                ) : (
                                  <pre>{JSON.stringify(tool.result, null, 2)}</pre>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Message content with enhanced markdown rendering */}
              <div className="prose prose-sm max-w-none">
                {isAssistant ? (
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "")
                        const language = match ? match[1] : ""

                        return !inline ? (
                          <div className="my-3 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            {language && (
                              <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-slate-200 px-4 py-2 text-xs font-mono border-b border-slate-700 flex items-center gap-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                </div>
                                <span className="ml-2">{language}</span>
                              </div>
                            )}
                            <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto font-mono text-sm m-0">
                              <code {...props}>{String(children).replace(/\n$/, "")}</code>
                            </pre>
                          </div>
                        ) : (
                          <code
                            className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-sm font-mono border border-blue-200"
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold mt-6 mb-3 text-gray-900 border-b border-gray-200 pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-semibold mt-5 mb-3 text-gray-800 flex items-center gap-2">
                          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-base font-medium mt-4 mb-2 text-gray-700 flex items-center gap-2">
                          <div className="w-1 h-4 bg-blue-400 rounded-full"></div>
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => <ul className="list-none space-y-2 my-3 pl-0">{children}</ul>,
                      ol: ({ children }) => (
                        <ol className="list-none space-y-2 my-3 pl-0 counter-reset-list">{children}</ol>
                      ),
                      li: ({ children, ...props }) => {
                        const isOrdered = props.node?.parent?.tagName === "ol"
                        return (
                          <li className={`flex items-start gap-3 ${isOrdered ? "counter-increment-list" : ""}`}>
                            {isOrdered ? (
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center mt-0.5 counter-content"></span>
                            ) : (
                              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            )}
                            <span className="flex-1">{children}</span>
                          </li>
                        )
                      },
                      p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-700">{children}</p>,
                      blockquote: ({ children }) => (
                        <div className="my-4 border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-blue-900 italic">{children}</div>
                          </div>
                        </div>
                      ),
                      // Custom admonition-style blocks
                      strong: ({ children }) => {
                        const text = String(children)

                        // Check for admonition patterns
                        if (text.startsWith("⚠️") || text.toLowerCase().includes("warning")) {
                          return (
                            <div className="my-4 border-l-4 border-amber-400 bg-amber-50 p-4 rounded-r-lg">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-amber-900 font-medium">{children}</div>
                              </div>
                            </div>
                          )
                        }

                        if (text.startsWith("💡") || text.toLowerCase().includes("tip")) {
                          return (
                            <div className="my-4 border-l-4 border-green-400 bg-green-50 p-4 rounded-r-lg">
                              <div className="flex items-start gap-3">
                                <Lightbulb className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="text-green-900 font-medium">{children}</div>
                              </div>
                            </div>
                          )
                        }

                        if (text.startsWith("🎉") || text.toLowerCase().includes("success")) {
                          return (
                            <div className="my-4 border-l-4 border-emerald-400 bg-emerald-50 p-4 rounded-r-lg">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div className="text-emerald-900 font-medium">{children}</div>
                              </div>
                            </div>
                          )
                        }

                        if (text.startsWith("🚀") || text.toLowerCase().includes("important")) {
                          return (
                            <div className="my-4 border-l-4 border-purple-400 bg-purple-50 p-4 rounded-r-lg">
                              <div className="flex items-start gap-3">
                                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div className="text-purple-900 font-medium">{children}</div>
                              </div>
                            </div>
                          )
                        }

                        return <strong className="font-semibold text-gray-900">{children}</strong>
                      },
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 shadow-sm">
                          <table className="min-w-full border-collapse bg-white">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">{children}</thead>
                      ),
                      tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>,
                      tr: ({ children }) => <tr className="hover:bg-gray-50 transition-colors">{children}</tr>,
                      th: ({ children }) => (
                        <th className="border-b border-gray-300 px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border-b border-gray-200 px-6 py-4 text-sm text-gray-700">{children}</td>
                      ),
                      hr: () => <hr className="my-6 border-t-2 border-gray-200" />,
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-700">{message.content}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
