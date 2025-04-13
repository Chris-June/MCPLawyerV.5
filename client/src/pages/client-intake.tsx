import React, { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchClientIntakeForm, 
  submitClientIntakeForm, 
  fetchPracticeAreas, 
  analyzeClientIntakeForm
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ClipboardList, AlertCircle, CheckCircle, Loader2, Info, HelpCircle, BarChart } from 'lucide-react'
import { ClientIntakeForm, PracticeArea } from '@/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import IntakeFormAnalytics from '@/components/IntakeFormAnalytics'
import { motion } from 'framer-motion'
import { debounce } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AIInterview from '@/components/AIInterview'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function ClientIntakePage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // State for intake method tabs
  const [activeTab, setActiveTab] = useState<string>('form')
  
  // Traditional form state
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('')
  const [formValues, setFormValues] = useState<Record<string, string>>({}) 
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}) 
  const [formProgress, setFormProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSaved, setFormSaved] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // AI Interview state
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [interviewResult, setInterviewResult] = useState<any>(null)

  // Fetch available practice areas for the dropdown
  const { data: practiceAreas, isLoading: isLoadingPracticeAreas } = useQuery<PracticeArea[]>({
    queryKey: ['practiceAreas'],
    queryFn: fetchPracticeAreas, 
  })

  // Fetch client intake form based on selected practice area
  const { data: intakeForm, isLoading: isLoadingIntakeForm, error: intakeFormError } = useQuery<ClientIntakeForm>({
    queryKey: ['clientIntakeForm', selectedPracticeArea],
    queryFn: () => fetchClientIntakeForm(selectedPracticeArea),
    enabled: !!selectedPracticeArea, // Only fetch when a practice area is selected
    retry: false, // Don't retry if form for area not found
  })

  // Mutation for submitting the form
  const mutation = useMutation({
    mutationFn: (formData: Record<string, string>) => submitClientIntakeForm(selectedPracticeArea, formData),
    onSuccess: (data) => {
      setFormSaved(true)
      toast({ title: "Success", description: "Intake form submitted successfully." })
      // Request AI analysis after successful submission
      requestAnalysis(formValues)
    },
    onError: (error) => {
      setFormErrors({ form: error.message || 'Failed to submit form.' })
      toast({ variant: "destructive", title: "Error", description: error.message || 'Failed to submit form.' })
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })
  
  // Mutation for analyzing the form
  const analysisMutation = useMutation({
    mutationFn: (formData: Record<string, string>) => analyzeClientIntakeForm(selectedPracticeArea, formData),
    onSuccess: (data) => {
      setAnalysis(data)
      toast({ title: "Analysis Complete", description: "AI analysis of your intake form is ready." })
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Analysis Error", description: error.message || 'Failed to analyze form.' })
    },
    onSettled: () => {
      setIsAnalyzing(false)
    },
  })
  
  // Function to request AI analysis with debounce for real-time analysis
  const debouncedAnalyze = useCallback(
    debounce((formData: Record<string, string>) => {
      // Only analyze if we have enough data (at least 3 fields filled)
      const filledFields = Object.values(formData).filter(value => value.trim() !== '').length
      if (filledFields >= 3) {
        setIsAnalyzing(true)
        analysisMutation.mutate(formData)
      }
    }, 2000), // 2 second debounce
    [analysisMutation]
  )

  // Function to request AI analysis immediately
  const requestAnalysis = (formData: Record<string, string>) => {
    setIsAnalyzing(true)
    analysisMutation.mutate(formData)
  }

  // Calculate form progress
  useEffect(() => {
    if (intakeForm?.fields) {
      const totalFields = intakeForm.fields.length
      const filledFields = Object.values(formValues).filter(value => value.trim() !== '').length
      setFormProgress(totalFields > 0 ? (filledFields / totalFields) * 100 : 0)
    }
  }, [formValues, intakeForm])

  const handlePracticeAreaChange = (value: string) => {
    setSelectedPracticeArea(value)
    setFormValues({}) // Reset form values when practice area changes
    setFormErrors({}) // Reset errors
    setFormProgress(0) // Reset progress
    setFormSaved(false) // Reset saved state
  }

  const handleFieldChange = (field: string, value: string) => {
    const updatedValues = { ...formValues, [field]: value }
    setFormValues(updatedValues)
    
    // Clear error for this field when user starts typing/changing
    if (formErrors[field]) {
      setFormErrors(prev => { 
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Trigger real-time analysis if form is sufficiently complete
    if (selectedPracticeArea && intakeForm?.fields) {
      debouncedAnalyze(updatedValues)
    }
  }
  
  // Basic validation (can be expanded)
  const validateForm = (): boolean => {
    if (!intakeForm) return false
    const errors: Record<string, string> = {}
    let isValid = true

    intakeForm.fields.forEach(field => {
      // Simple required field check (can add more specific checks)
      // Skip validation for conditionally hidden fields
      if (field === 'existing_will_location' && formValues['has_existing_will'] !== 'yes') {
         return; // Skip validation if parent condition not met
      }
      
      if (!formValues[field] || formValues[field].trim() === '') {
        errors[field] = `${field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} is required.`
        isValid = false
      }
      
      // Example: Validate claim_amount is a number if it exists
      if (field === 'claim_amount' && formValues[field] && isNaN(Number(formValues[field]))) {
          errors[field] = 'Claim amount must be a valid number.'
          isValid = false
      }
      
      // Example: Email validation (basic)
      if (field.includes('email') && formValues[field] && !/\S+@\S+\.\S+/.test(formValues[field])) {
          errors[field] = 'Please enter a valid email address.'
          isValid = false
      }
    })

    setFormErrors(errors)
    return isValid
  }

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({}) // Clear previous general errors
    if (validateForm()) {
      setIsSubmitting(true)
      mutation.mutate(formValues)
    }
  }

  // Helper to render different input types
  const renderField = (field: string) => {
    const label = field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const isRequired = !['existing_will_location'].includes(field); // Assume required unless specifically optional or conditional

    // --- Conditional Field Logic Start ---
    if (field === 'existing_will_location' && formValues['has_existing_will'] !== 'yes') {
      return null; // Don't render if 'Has Existing Will?' is not 'yes'
    }
    // --- Conditional Field Logic End ---

    // Special handling for specific field types based on name
    if (field.includes('description') || field.includes('details') || field.includes('summary') || field.includes('scope') || field.includes('needs')) {
      return (
        <div key={field} className="space-y-2 col-span-full">
          <Label htmlFor={field} className="flex justify-between">
            <span>{label}</span>
            {isRequired && <span className="text-xs text-muted-foreground">Required</span>}
          </Label>
          <Textarea
            id={field}
            value={formValues[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={`Enter ${label}...`}
            className={formErrors[field] ? 'border-destructive focus-visible:ring-destructive' : ''}
            rows={4}
          />
          {formErrors[field] && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {formErrors[field]}
            </p>
          )}
        </div>
      );
    } else if (field === 'has_existing_will' || field === 'power_of_attorney_exists') {
      // Example: Render Yes/No Select for boolean-like questions
      return (
        <div key={field} className="space-y-2">
           <Label htmlFor={field} className="flex justify-between">
            <span>{label}?</span>
            {isRequired && <span className="text-xs text-muted-foreground">Required</span>}
          </Label>
          <Select
            value={formValues[field] || ''}
            onValueChange={(value) => handleFieldChange(field, value)}
          >
            <SelectTrigger id={field} className={formErrors[field] ? 'border-destructive focus-visible:ring-destructive' : ''}>
              <SelectValue placeholder="Select Yes or No" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {formErrors[field] && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {formErrors[field]}
            </p>
          )}
        </div>
      );
    } else {
      // Default to text input
      return (
        <div key={field} className="space-y-2">
          <Label htmlFor={field} className="flex justify-between">
            <span>{label}</span>
            {isRequired && <span className="text-xs text-muted-foreground">Required</span>}
          </Label>
          <Input
            id={field}
            type={field.includes('email') ? 'email' : field.includes('phone') ? 'tel' : field.includes('date') ? 'date' : 'text'}
            value={formValues[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={`Enter ${label}`}
            className={formErrors[field] ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {formErrors[field] && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {formErrors[field]}
            </p>
          )}
        </div>
      );
    }
  };

  // Handle completed AI interview
  const handleInterviewComplete = (result: any) => {
    setInterviewCompleted(true)
    setInterviewResult(result)
    
    // Show success message
    toast({
      title: "Interview Completed",
      description: "AI interview has been completed and case assessment generated."
    })
  }
  
  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto mb-6">
          <h1 className="text-3xl font-bold mb-2">Client Intake System</h1>
          <p className="text-muted-foreground">Choose your preferred intake method below.</p>
        </div>
        
        <Tabs defaultValue="form" onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="form" className="flex items-center justify-center">
              <ClipboardList className="h-4 w-4 mr-2" />
              <span>Traditional Form</span>
            </TabsTrigger>
            <TabsTrigger value="ai-interview" className="flex items-center justify-center">
              <Badge variant="outline" className="mr-2">AI</Badge>
              <span>Interactive Interview</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="form">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <ClipboardList className="h-6 w-6" />
                  Client Intake Form
                </CardTitle>
                <CardDescription>Please select a practice area and fill out the required information.</CardDescription>
              </CardHeader>
        <CardContent>
          {/* Practice Area Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="practiceArea" className="block font-medium">Select Practice Area</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose the legal practice area that best matches your needs</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select 
              onValueChange={handlePracticeAreaChange} 
              value={selectedPracticeArea}
              disabled={isLoadingPracticeAreas}
            >
              <SelectTrigger id="practiceArea">
                <SelectValue placeholder={isLoadingPracticeAreas ? "Loading areas..." : "Select a practice area..."} />
              </SelectTrigger>
              <SelectContent>
                {practiceAreas?.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading/Error/Form Display */}
          {selectedPracticeArea && (
            <>
              {isLoadingIntakeForm && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading intake form...</span>
                </div>
              )}

              {intakeFormError && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Form</AlertTitle>
                    <AlertDescription>
                      Could not load the intake form for "{selectedPracticeArea}". It might not be available yet. Please select another area.
                    </AlertDescription>
                  </Alert>
              )}

              {intakeForm && !formSaved && (
                <form onSubmit={handleSubmitForm} className="space-y-6">
                  <div className="flex items-center gap-2 border-b pb-4 mb-6">
                    <h3 className="text-lg font-semibold">{intakeForm.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground -mt-4 mb-4">{intakeForm.description}</p>
                  
                  {/* Real-time analysis indicator */}
                  {formProgress > 30 && !analysis && !isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Alert className="bg-muted/50 border-dashed">
                        <BarChart className="h-4 w-4" />
                        <AlertTitle>Real-time analysis available</AlertTitle>
                        <AlertDescription className="flex justify-between items-center">
                          <span>Continue filling the form to receive AI-powered insights</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => requestAnalysis(formValues)}
                            disabled={isSubmitting}
                          >
                            Analyze Now
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {intakeForm.fields.map(field => renderField(field))}
                  </div>

                  {/* Progress Bar */}
                  <div className="pt-4">
                    <Label className="mb-2 block text-sm font-medium text-gray-700">Form Progress</Label>
                    <Progress value={formProgress} className="w-full" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(formProgress)}% complete</p>
                  </div>
                  
                  {formErrors.form && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Submission Error</AlertTitle>
                      <AlertDescription>{formErrors.form}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4 flex-wrap">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || formProgress < 100} 
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : 'Submit Intake Form'}
                    </Button>
                    
                    {formProgress >= 30 && !analysis && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => requestAnalysis(formValues)}
                        disabled={isAnalyzing}
                        className="md:flex-none flex-1"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <BarChart className="mr-2 h-4 w-4" />
                            Get AI Analysis
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              )}

              {formSaved && (
                <div className="space-y-6">
                  <Alert variant="default" className="border-green-500 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Form Submitted Successfully!</AlertTitle>
                    <AlertDescription>
                      Thank you for completing the intake form. We will review your information and be in touch.
                      {!analysis && !isAnalyzing && (
                        <Button variant="link" onClick={() => handlePracticeAreaChange('')} className="p-0 h-auto ml-2">Start New Intake</Button>
                      )}
                    </AlertDescription>
                  </Alert>
                  
                  {/* AI-powered intake form analytics */}
                  <IntakeFormAnalytics 
                    analysis={analysis}
                    isAnalyzing={isAnalyzing}
                    practiceArea={selectedPracticeArea}
                    formProgress={formProgress}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-interview" className="space-y-6">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Badge variant="outline" className="mr-2">AI</Badge>
                  Interactive Client Interview
                </CardTitle>
                <CardDescription>
                  Our AI assistant will conduct an interactive interview to gather information about your case 
                  and generate a preliminary assessment. This approach can uncover important details that 
                  might be missed in traditional forms.
                </CardDescription>
                <Separator className="my-2" />
              </CardHeader>
              <CardContent>
                <AIInterview onComplete={handleInterviewComplete} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
