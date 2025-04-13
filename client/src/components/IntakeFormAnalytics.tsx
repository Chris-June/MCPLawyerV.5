import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, CheckCircle, AlertCircle, BarChart, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'

interface IntakeFormAnalyticsProps {
  analysis: any
  isAnalyzing: boolean
  practiceArea: string
  formProgress: number
}

const IntakeFormAnalytics: React.FC<IntakeFormAnalyticsProps> = ({
  analysis,
  isAnalyzing,
  practiceArea,
  formProgress
}) => {
  // If no analysis and not analyzing, don't render anything
  if (!analysis && !isAnalyzing) return null

  // Function to extract key issues from analysis
  const extractKeyIssues = (analysisText: string): string[] => {
    // Simple extraction - in a real app, this would be more sophisticated
    // or the backend would provide structured data
    const issueSection = analysisText.split('Key legal issues:')[1]?.split('##')[0] || ''
    return issueSection
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.trim().replace(/^[-*]\s*/, ''))
      .filter(issue => issue.length > 0)
  }

  // Function to extract recommended next steps
  const extractNextSteps = (analysisText: string): string[] => {
    const stepsSection = analysisText.split('Recommended next steps:')[1]?.split('##')[0] || 
                        analysisText.split('Next steps:')[1]?.split('##')[0] || ''
    return stepsSection
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().match(/^\d+\./))
      .map(line => line.trim().replace(/^[-*]\s*|^\d+\.\s*/, ''))
      .filter(step => step.length > 0)
  }

  // Function to extract complexity assessment
  const extractComplexity = (analysisText: string): { level: string, reason: string } => {
    const complexitySection = analysisText.toLowerCase().includes('complexity')
      ? analysisText.split(/complexity[^\n]*:/i)[1]?.split('##')[0] || ''
      : ''
    
    let level = 'Medium'
    if (complexitySection.toLowerCase().includes('high')) level = 'High'
    if (complexitySection.toLowerCase().includes('low')) level = 'Low'
    
    return {
      level,
      reason: complexitySection.split('\n')[0]?.trim() || 'Based on the information provided'
    }
  }

  // Render loading state
  if (isAnalyzing) {
    return (
      <Card className="mt-6 border-dashed border-muted-foreground/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            <span>Analyzing your intake form</span>
          </CardTitle>
          <CardDescription>
            AI is processing your information to provide insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={45} className="h-2" />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Processing</AlertTitle>
              <AlertDescription>
                Our AI is analyzing your intake form to identify key legal issues, complexity, and recommended next steps.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If we have analysis data, render it
  if (analysis) {
    const keyIssues = extractKeyIssues(analysis.analysis)
    const nextSteps = extractNextSteps(analysis.analysis)
    const complexity = extractComplexity(analysis.analysis)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>AI Intake Analysis</span>
              </CardTitle>
              <Badge variant={complexity.level === 'High' ? 'destructive' : 
                            complexity.level === 'Medium' ? 'default' : 'outline'}>
                {complexity.level} Complexity
              </Badge>
            </div>
            <CardDescription>
              Analysis for {practiceArea.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} matter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="issues">Key Issues</TabsTrigger>
                <TabsTrigger value="steps">Next Steps</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4 pt-4">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ 
                    __html: analysis.analysis
                      .split('##')[0] // Get the first section (summary)
                      .replace(/\n/g, '<br />')
                  }} />
                </div>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Form Completion: {formProgress.toFixed(0)}%</AlertTitle>
                  <AlertDescription>
                    {formProgress < 70 ? 
                      "Providing more information may improve the quality of this analysis." :
                      "You've provided comprehensive information for a thorough analysis."}
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="issues" className="pt-4">
                <div className="space-y-2">
                  {keyIssues.length > 0 ? (
                    keyIssues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>{issue}</div>
                      </div>
                    ))
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No specific issues identified</AlertTitle>
                      <AlertDescription>
                        Based on the information provided, no critical legal issues were identified.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="steps" className="pt-4">
                <div className="space-y-2">
                  {nextSteps.length > 0 ? (
                    nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>{step}</div>
                      </div>
                    ))
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Recommendations pending</AlertTitle>
                      <AlertDescription>
                        Complete more of the form to receive tailored next steps.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                Print Analysis
              </Button>
              <Button size="sm" onClick={() => window.location.reload()}>
                Start New Intake
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return null
}

export default IntakeFormAnalytics
