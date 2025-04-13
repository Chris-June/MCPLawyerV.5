import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, AlertCircle, CheckCircle, Scale, BarChart } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Separator } from '../components/ui/separator'
import { Badge } from '../components/ui/badge'
import { useToast } from '../components/ui/use-toast'
import { AIProcessingOverlay } from '../components/ui/ai-processing-overlay'

// Import directly from the predictiveAnalysisApi file instead of the index
import { predictOutcome, PredictiveAnalysisFormData, PredictiveAnalysisRequest as ApiRequest } from '../lib/api/predictiveAnalysisApi'

// Form schema
const predictiveAnalysisSchema = z.object({
  case_type: z.string({
    required_error: 'Please select a case type',
  }),
  jurisdiction: z.string({
    required_error: 'Please select a jurisdiction',
  }),
  facts_summary: z.string().min(50, {
    message: 'Case facts must be at least 50 characters',
  }),
  legal_issues: z.string().min(20, {
    message: 'Legal issues must be at least 20 characters',
  }),
  client_position: z.string().min(20, {
    message: 'Client position must be at least 20 characters',
  }),
  opposing_position: z.string().optional(),
  relevant_precedents: z.string().optional(),
})

// Define our form data type using Zod inference
type FormData = z.infer<typeof predictiveAnalysisSchema>

type PredictiveAnalysisResult = {
  case_summary: string
  outcome_prediction: {
    prediction: string
    confidence: number
    prediction_rationale: string
  }
  key_factors: string[]
  strategy_recommendations: string[]
  risk_assessment: {
    level: 'low' | 'medium' | 'high'
    description: string
  }
}

const caseTypes = [
  { value: 'civil_litigation', label: 'Civil Litigation' },
  { value: 'family_law', label: 'Family Law' },
  { value: 'criminal_defense', label: 'Criminal Defense' },
  { value: 'corporate', label: 'Corporate Law' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'employment', label: 'Employment Law' },
  { value: 'immigration', label: 'Immigration Law' },
  { value: 'tax', label: 'Tax Law' },
  { value: 'administrative', label: 'Administrative Law' },
]

const jurisdictions = [
  { value: 'federal', label: 'Federal' },
  { value: 'ontario', label: 'Ontario' },
  { value: 'british_columbia', label: 'British Columbia' },
  { value: 'alberta', label: 'Alberta' },
  { value: 'quebec', label: 'Quebec' },
  { value: 'manitoba', label: 'Manitoba' },
  { value: 'saskatchewan', label: 'Saskatchewan' },
  { value: 'nova_scotia', label: 'Nova Scotia' },
  { value: 'new_brunswick', label: 'New Brunswick' },
  { value: 'newfoundland', label: 'Newfoundland and Labrador' },
  { value: 'pei', label: 'Prince Edward Island' },
  { value: 'yukon', label: 'Yukon' },
  { value: 'northwest_territories', label: 'Northwest Territories' },
  { value: 'nunavut', label: 'Nunavut' },
]

const PredictiveOutcomeAnalysis: React.FC = () => {
  const { toast } = useToast()
  const [analysisResult, setAnalysisResult] = useState<PredictiveAnalysisResult | null>(null)

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(predictiveAnalysisSchema),
    defaultValues: {
      case_type: '',
      jurisdiction: '',
      facts_summary: '',
      legal_issues: '',
      client_position: '',
      opposing_position: '',
      relevant_precedents: '',
    },
  })

  // Mutation for API call
  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      // Convert form data to API request format
      // This ensures all required fields are present with proper defaults for optional fields
      const apiRequest: ApiRequest = {
        case_type: data.case_type,
        jurisdiction: data.jurisdiction,
        facts_summary: data.facts_summary,
        legal_issues: data.legal_issues,
        client_position: data.client_position,
        opposing_position: data.opposing_position || '',
        relevant_precedents: data.relevant_precedents || ''
      }
      return predictOutcome(apiRequest)
    },
    onSuccess: (data: PredictiveAnalysisResult) => {
      setAnalysisResult(data)
      toast({
        title: 'Analysis Complete',
        description: 'Predictive outcome analysis has been generated successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: `There was an error generating the analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    },
  })

  // Form submission handler
  const onSubmit = (data: FormData) => {
    console.log('Form Data Submitted:', data)
    mutation.mutate(data)
  }

  // Reset form and results
  const handleReset = () => {
    form.reset()
    setAnalysisResult(null)
  }

  // Render analysis result
  const renderAnalysisResult = () => {
    if (!analysisResult) return null
    
    // Check if the result is an error response
    if (analysisResult.case_summary === 'Unable to generate case summary due to an error.') {
      return (
        <div className="text-red-500 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>
              {analysisResult.outcome_prediction.prediction_rationale}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Case Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{analysisResult.case_summary}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <CardTitle>Outcome Prediction</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {analysisResult.outcome_prediction.confidence}% Confidence
                </Badge>
                <span className="font-semibold text-lg">{analysisResult.outcome_prediction.prediction}</span>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Rationale:</h4>
                <p className="text-muted-foreground whitespace-pre-line">
                  {analysisResult.outcome_prediction.prediction_rationale}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle>Key Factors</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.key_factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Risk Assessment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge 
                    variant={analysisResult.risk_assessment.level === 'high' ? 'destructive' : 
                           analysisResult.risk_assessment.level === 'medium' ? 'default' : 'outline'}
                    className="mb-2"
                  >
                    {analysisResult.risk_assessment.level.toUpperCase()} RISK
                  </Badge>
                  <p className="text-muted-foreground">{analysisResult.risk_assessment.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle>Strategy Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisResult.strategy_recommendations.map((strategy, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={handleReset} className="w-full">
                Start New Analysis
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6 relative">
      <AIProcessingOverlay
        isProcessing={mutation.isPending}
        theme="legal"
        title="Analyzing Case Outcome"
        message="Our AI is analyzing your case details and predicting the potential outcome..."
        modelName="GPT-4o-mini"
      />
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Predictive Outcome Analysis</h1>
        <p className="text-muted-foreground">
          Analyze potential case outcomes based on facts, legal issues, and precedents.
        </p>
      </div>

      <Separator className="my-6" />

      {!analysisResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
            <CardDescription>
              Enter the details of your case to receive a predictive analysis of potential outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="case_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select case type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {caseTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jurisdiction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jurisdiction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select jurisdiction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jurisdictions.map((jurisdiction) => (
                              <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                                {jurisdiction.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="facts_summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Facts Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a summary of the key facts of the case"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include relevant dates, events, and circumstances.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legal_issues"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Issues</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the primary legal issues or questions"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="client_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Position</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your client's position or arguments"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="opposing_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opposing Position (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the opposing party's position or arguments"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="relevant_precedents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relevant Precedents (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any relevant case law or precedents"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include case names, citations, and brief descriptions of relevance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Analyzing...' : 'Analyze Case'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        renderAnalysisResult()
      )}
    </div>
  )
}

export default PredictiveOutcomeAnalysis
