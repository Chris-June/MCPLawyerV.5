import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, User, Bot, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay'

import { fetchRoles, processQuery } from '@/lib/api'
import type { Role } from '@/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const initialRoleId = searchParams.get('role')
  const { toast } = useToast()
  
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(initialRoleId)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles
  })
  
  const queryMutation = useMutation({
    mutationFn: processQuery,
    onSuccess: (data) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to process query: ${error.message}`,
        variant: 'destructive',
      })
    },
  })
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedRoleId) return
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, newMessage])
    setInput('')
    
    queryMutation.mutate({
      role_id: selectedRoleId,
      query: input,
    })
  }
  
  const selectedRole = roles?.find(role => role.id === selectedRoleId)
  
  return (
    <div className="flex flex-col w-full overflow-y-auto relative">
      <AIProcessingOverlay
        isProcessing={queryMutation.isPending}
        theme="legal"
        title="Processing Your Request"
        message="Our AI is analyzing your query and preparing a response..."
        modelName="GPT-4o-mini"
      />
      
      {!selectedRoleId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Select a Role to Chat With</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Choose an AI role to start a conversation. Each role has different expertise and personality.
          </p>
          
          {rolesLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
              {roles?.map((role) => (
                <motion.button
                  key={role.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 border rounded-lg bg-card text-left hover:border-primary transition-colors"
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 p-4 border rounded-lg bg-card">
            <div>
              <h2 className="font-semibold">{selectedRole?.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedRole?.description}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedRoleId(null)}>
              Change Role
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto border rounded-lg mb-4 p-4 bg-muted/10 max-h-[60vh]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Send a message to start chatting with {selectedRole?.name}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.role === 'user' ? (
                            <>
                              <span className="font-medium">You</span>
                              <User className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <Bot className="h-4 w-4" />
                              <span className="font-medium">{selectedRole?.name}</span>
                            </>
                          )}
                        </div>
                        
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                        
                        <div className="mt-2 text-xs opacity-70 text-right">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${selectedRole?.name}...`}
              className="flex-1 p-3 rounded-lg border bg-background"
              disabled={queryMutation.isPending}
            />
            <Button type="submit" disabled={!input.trim() || queryMutation.isPending}>
              {queryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2 sr-only md:not-sr-only">Send</span>
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
