import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageCircle, ChevronRight, AlertCircle, CheckCircle, BarChart, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createInterviewSession, processInterviewResponse, completeInterviewSession, fetchPracticeAreas } from '@/lib/api'
import { AIInterviewQuestion, AIInterviewResponse, AIInterviewSession, CaseAssessment } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

type AIInterviewProps = {
  onComplete?: (session: AIInterviewSession) => void
}

export default function AIInterview({ onComplete }: AIInterviewProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State
  const [practiceArea, setPracticeArea] = useState<string>('')
  const [caseType, setCaseType] = useState<string>('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [interviewSession, setInterviewSession] = useState<AIInterviewSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<AIInterviewQuestion | null>(null)
  const [response, setResponse] = useState('')
  const [conversation, setConversation] = useState<{question: AIInterviewQuestion, response: string}[]>([])
  const [interviewComplete, setInterviewComplete] = useState(false)
  const [caseSummary, setCaseSummary] = useState<string | null>(null)
  const [caseAssessment, setCaseAssessment] = useState<CaseAssessment | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  
  // Fetch practice areas for dropdown
  const { data: practiceAreas, isLoading: isLoadingPracticeAreas } = useQuery({
    queryKey: ['practiceAreas'],
    queryFn: fetchPracticeAreas,
  })
  
  // Mutation to create interview session
  const createSessionMutation = useMutation({
    mutationFn: (params: { practiceArea: string, caseType?: string }) => 
      createInterviewSession(params.practiceArea),
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setInterviewSession(data)
      if (data.questions?.length > 0) {
        setCurrentQuestion(data.questions[0])
      }
      toast({ title: "Interview started", description: "AI interview session has been created." })
    },
    onError: (error: any) => {
      toast({ 
        title: "Interview Creation Failed", 
        description: error.message || "Unable to start AI interview session.",
        variant: "destructive"
      })
    }
  })
  
  // Mutation to process response
  const processResponseMutation = useMutation({
    mutationFn: ({ sessionId, questionId, responseText }: 
      { sessionId: string, questionId: string, responseText: string }) => 
      processInterviewResponse(sessionId, questionId, responseText),
    onSuccess: (data) => {
      // Add the current Q&A to the conversation
      if (currentQuestion) {
        setConversation(prev => [...prev, {question: currentQuestion, response}])
      }
      
      // Clear response input
      setResponse('')

      // Update with new questions if available
      if (data.nextQuestions && data.nextQuestions.length > 0) {
        setCurrentQuestion(data.nextQuestions[0])
      } else {
        // No more questions, show completion option
        setCurrentQuestion(null)
      }
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to process your response." 
      })
    }
  })
  
  // Mutation to complete interview
  const completeInterviewMutation = useMutation({
    mutationFn: (sessionId: string) => completeInterviewSession(sessionId),
    onSuccess: (data) => {
      setInterviewComplete(true)
      setCaseSummary(data.summary)
      setCaseAssessment(data)
      
      if (interviewSession) {
        const updatedSession = {
          ...interviewSession,
          isComplete: true,
          summary: data.summary,
          caseAssessment: data
        }
        setInterviewSession(updatedSession)
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete(updatedSession)
        }
      }
      
      toast({ title: "Interview complete", description: "Case assessment has been generated." })
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "Failed to complete the interview." 
      })
    }
  })
  
  // Handle starting the interview
  const handleStartInterview = () => {
    if (!practiceArea) {
      toast({ variant: "destructive", title: "Error", description: "Please select a practice area." })
      return
    }
    
    createSessionMutation.mutate({ practiceArea, caseType: caseType || undefined })
  }
  
  // Handle submitting a response
  const handleSubmitResponse = () => {
    if (!sessionId || !currentQuestion || !response.trim()) return;
    
    processResponseMutation.mutate({
      sessionId,
      questionId: currentQuestion.id,
      responseText: response.trim()
    })
  }
  
  // Handle completing the interview
  const handleCompleteInterview = () => {
    if (!sessionId) return;
    
    completeInterviewMutation.mutate(sessionId)
  }
  
  // Listen for Enter key in the response input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitResponse()
    }
  }
  
  // Handle reviewing the interview
  const toggleReview = () => {
    setIsReviewing(prev => !prev)
  }
  
  // Render the interview setup form
  const renderSetupForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Client Interview</CardTitle>
        <CardDescription>
          Let AI conduct an interactive interview to gather case information and generate a preliminary assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="practiceArea" className="text-sm font-medium">Practice Area</label>
          <Select value={practiceArea} onValueChange={setPracticeArea}>
            <SelectTrigger id="practiceArea">
              <SelectValue placeholder="Select practice area" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingPracticeAreas ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading...</span>
                </div>
              ) : (
                practiceAreas?.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="caseType" className="text-sm font-medium">Case Type (Optional)</label>
          <Input 
            id="caseType" 
            value={caseType} 
            onChange={(e) => setCaseType(e.target.value)} 
            placeholder="E.g., Divorce, Contract Dispute, Personal Injury" 
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleStartInterview}
          disabled={!practiceArea || createSessionMutation.isPending}
        >
          {createSessionMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              Begin Interview
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
  
  // Render the active interview
  const renderActiveInterview = () => (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle>Client Interview</CardTitle>
              <Badge variant={isReviewing ? "outline" : "secondary"}>
                {isReviewing ? "Review Mode" : "Active Interview"}
              </Badge>
            </div>
            <CardDescription>
              {practiceArea && <span>Practice Area: {practiceAreas?.find(a => a.id === practiceArea)?.name}</span>}
              {caseType && <span className="ml-2">| Case Type: {caseType}</span>}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-2">
            {isReviewing ? (
              // Review conversation history
              <div className="space-y-4 max-h-[450px] overflow-y-auto p-2">
                {conversation.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="font-semibold text-sm text-muted-foreground">Question:</p>
                      <p>{item.question.question}</p>
                      {item.question.intent && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Intent: {item.question.intent}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-accent p-3 rounded-lg ml-4">
                      <p className="font-semibold text-sm text-muted-foreground">Your Response:</p>
                      <p>{item.response}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Active interview question
              <div className="space-y-4">
                {currentQuestion ? (
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentQuestion.intent}
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Interview Complete</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      All questions have been answered. You can now complete the interview to generate a case assessment.
                    </p>
                  </div>
                )}
                
                {currentQuestion && (
                  <div className="space-y-2">
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your response here..."
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSubmitResponse}
                        disabled={!response.trim() || processResponseMutation.isPending}
                      >
                        {processResponseMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Submit Response
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-2 flex justify-between">
            <Button variant="outline" onClick={toggleReview}>
              {isReviewing ? "Continue Interview" : "Review Conversation"}
            </Button>
            
            {!currentQuestion && !interviewComplete && (
              <Button 
                onClick={handleCompleteInterview}
                disabled={completeInterviewMutation.isPending}
                variant="default"
              >
                {completeInterviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Assessment...
                  </>
                ) : (
                  <>
                    Complete & Generate Assessment
                    <FileText className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
  
  // Render the case assessment
  const renderCaseAssessment = () => {
    if (!caseAssessment) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Preliminary Case Assessment
              </CardTitle>
              {caseSummary && (
                <CardDescription className="text-base">
                  {caseSummary}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="strengths" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="strengths">Strengths</TabsTrigger>
                  <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
                  <TabsTrigger value="issues">Legal Issues</TabsTrigger>
                  <TabsTrigger value="actions">Recommended Actions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="strengths" className="space-y-4">
                  <h3 className="text-lg font-medium">Case Strengths</h3>
                  <ul className="space-y-2">
                    {caseAssessment.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="weaknesses" className="space-y-4">
                  <h3 className="text-lg font-medium">Case Weaknesses</h3>
                  <ul className="space-y-2">
                    {caseAssessment.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 text-red-500 shrink-0 mt-0.5" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="issues" className="space-y-4">
                  <h3 className="text-lg font-medium">Key Legal Issues</h3>
                  <ul className="space-y-2">
                    {caseAssessment.legalIssues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="font-semibold mr-2">{index + 1}.</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4">
                  <h3 className="text-lg font-medium">Recommended Actions</h3>
                  <ul className="space-y-2">
                    {caseAssessment.recommendedActions.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="font-semibold mr-2">{index + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 pt-4 border-t space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Risk Assessment</h3>
                  <p className="mt-1">{caseAssessment.riskAssessment}</p>
                </div>
                
                {caseAssessment.estimatedTimeframe && (
                  <div>
                    <h3 className="text-lg font-medium">Estimated Timeframe</h3>
                    <p className="mt-1">{caseAssessment.estimatedTimeframe}</p>
                  </div>
                )}
                
                {caseAssessment.estimatedCosts && (
                  <div>
                    <h3 className="text-lg font-medium">Estimated Costs</h3>
                    <div className="mt-1">
                      {caseAssessment.estimatedCosts.range && (
                        <p><strong>Range:</strong> ${caseAssessment.estimatedCosts.range.min} - ${caseAssessment.estimatedCosts.range.max}</p>
                      )}
                      {caseAssessment.estimatedCosts.factors && (
                        <div className="mt-2">
                          <p><strong>Factors affecting cost:</strong></p>
                          <ul className="list-disc pl-5 mt-1">
                            {caseAssessment.estimatedCosts.factors.map((factor, index) => (
                              <li key={index}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {caseAssessment.additionalNotes && (
                  <div>
                    <h3 className="text-lg font-medium">Additional Notes</h3>
                    <p className="mt-1">{caseAssessment.additionalNotes}</p>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={() => {
                setInterviewComplete(false)
                setPracticeArea('')
                setCaseType('')
                setSessionId(null)
                setInterviewSession(null)
                setCurrentQuestion(null)
                setResponse('')
                setConversation([])
                setCaseSummary(null)
                setCaseAssessment(null)
              }}>
                Start New Interview
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }
  
  return (
    <div className="space-y-6">
      {!sessionId && !interviewComplete && renderSetupForm()}
      {sessionId && !interviewComplete && renderActiveInterview()}
      {interviewComplete && renderCaseAssessment()}
    </div>
  )
}
