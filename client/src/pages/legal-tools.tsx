import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Calculator, FileQuestion, Loader2, Calendar, Copy, Check, Download,
  Search, BookOpen, Quote, FileDiff, DollarSign, FileText
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { calculateDeadline, analyzeLegalIssue } from '@/lib/api'
import { CalculateDeadlineRequest, AnalyzeLegalIssueRequest } from '@/types'

// Import new legal tools API functions
import {
  searchCaseLaw,
  searchLegislation,
  getCaseBrief,
  formatCaseCitation,
  formatLegislationCitation,
  parseCitation,
  getCitationStyles,
  compareDocuments,
  summarizeChanges,
  extractClauses,
  calculateHourlyFeeEstimate,
  calculateFixedFeeEstimate,
  calculateContingencyFeeEstimate,
  recommendFeeStructure,
  getCourtRules,
  getFilingRequirements,
  getCourtForms,
  generateFilingChecklist,
  validateCourtDocument,
  generateFilingInstructions
} from '@/lib/legalToolsApi'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const jurisdictions = [
  { value: 'ontario', label: 'Ontario' },
  { value: 'british_columbia', label: 'British Columbia' },
  { value: 'alberta', label: 'Alberta' },
  { value: 'quebec', label: 'Quebec' },
  { value: 'federal', label: 'Federal' },
]

const practiceAreas = [
  { value: 'general', label: 'General' },
  { value: 'family', label: 'Family Law' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'litigation', label: 'Litigation' },
  { value: 'estates', label: 'Wills & Estates' },
  { value: 'civil', label: 'Civil Law' },
]

const deadlineTypes = [
  { value: 'statement_of_defence', label: 'Statement of Defence' },
  { value: 'appeal_period', label: 'Appeal Period' },
]

export default function LegalToolsPage() {
  const { toast } = useToast()
  
  // Deadline Calculator State
  const [deadlineRequest, setDeadlineRequest] = useState<CalculateDeadlineRequest>({
    start_date: new Date().toISOString().split('T')[0], // Today in YYYY-MM-DD format
    deadline_type: '',
    jurisdiction: '',
  })
  const [deadlineResult, setDeadlineResult] = useState<any>(null)
  
  // Legal Issue Analysis State
  const [analysisRequest, setAnalysisRequest] = useState<AnalyzeLegalIssueRequest>({
    issue_description: '',
    jurisdiction: '',
    practice_area: '',
  })
  const [analysisResult, setAnalysisResult] = useState<string>('')
  const [activeTab, setActiveTab] = useState('deadline-calculator')
  
  // New state variables for our new tools
  // Legal Research
  const [legalResearchQuery, setLegalResearchQuery] = useState('')
  const [legalResearchJurisdiction, setLegalResearchJurisdiction] = useState('')
  const [legalResearchResults, setLegalResearchResults] = useState<any>(null)
  
  // Citation Formatter
  const [citationText, setCitationText] = useState('')
  const [parsedCitation, setParsedCitation] = useState<any>(null)
  const [caseTitle, setCaseTitle] = useState('')
  const [caseYear, setCaseYear] = useState('')
  const [caseVolume, setCaseVolume] = useState('')
  const [caseReporter, setCaseReporter] = useState('')
  const [casePage, setCasePage] = useState('')
  const [citationStyle, setCitationStyle] = useState('mcgill')
  const [formattedCitation, setFormattedCitation] = useState<any>(null)
  
  // Document Comparison
  const [originalText, setOriginalText] = useState('')
  const [revisedText, setRevisedText] = useState('')
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  
  // Legal Fee Calculator
  const [matterType, setMatterType] = useState('')
  const [complexity, setComplexity] = useState('medium')
  const [feeEstimate, setFeeEstimate] = useState<any>(null)
  
  // Court Filing
  const [documentType, setDocumentType] = useState('')
  const [filingJurisdiction, setFilingJurisdiction] = useState('')
  const [filingChecklist, setFilingChecklist] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  
  // Calculate Deadline Mutation
  const calculateDeadlineMutation = useMutation({
    mutationFn: calculateDeadline,
    onSuccess: (data) => {
      setDeadlineResult(data)
      toast({
        title: 'Deadline Calculated',
        description: 'Your legal deadline has been calculated successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to calculate deadline: ${error.message}`,
        variant: 'destructive',
      })
    },
  })
  
  // Analyze Legal Issue Mutation
  const analyzeLegalIssueMutation = useMutation({
    mutationFn: analyzeLegalIssue,
    onSuccess: (data) => {
      setAnalysisResult(data.analysis)
      toast({
        title: 'Analysis Complete',
        description: 'Your legal issue has been analyzed successfully.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to analyze legal issue: ${error.message}`,
        variant: 'destructive',
      })
    },
  })
  
  const handleDeadlineInputChange = (field: keyof CalculateDeadlineRequest, value: string) => {
    setDeadlineRequest(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleAnalysisInputChange = (field: keyof AnalyzeLegalIssueRequest, value: string) => {
    setAnalysisRequest(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleCalculateDeadline = () => {
    calculateDeadlineMutation.mutate(deadlineRequest)
  }
  
  const handleAnalyzeLegalIssue = () => {
    analyzeLegalIssueMutation.mutate(analysisRequest)
  }
  
  const handleCopyToClipboard = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult)
      setCopied(true)
      toast({
        title: 'Copied to clipboard',
        description: 'Analysis has been copied to your clipboard',
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleAddToCalendar = () => {
    if (!deadlineResult) return
    
    // Format deadline for calendar event
    const deadlineDate = new Date(deadlineResult.deadline_date)
    const deadlineType = deadlineTypes.find(t => t.value === deadlineResult.deadline_type)?.label || deadlineResult.deadline_type
    const jurisdiction = jurisdictions.find(j => j.value === deadlineResult.jurisdiction)?.label || deadlineResult.jurisdiction
    
    // Create calendar event data
    const title = `Legal Deadline: ${deadlineType}`
    const description = `${deadlineResult.deadline_description}
Jurisdiction: ${jurisdiction}`
    const startDate = deadlineDate.toISOString().split('T')[0]
    
    // Create .ics file content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `DTSTART:${startDate.replace(/-/g, '')}`,
      `DTEND:${startDate.replace(/-/g, '')}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n')
    
    // Create and download the .ics file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `legal-deadline-${deadlineType.toLowerCase().replace(/\s+/g, '-')}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Calendar Event Created',
      description: 'The deadline has been added to your calendar.',
    })
  }
  
  const handleDownloadAnalysis = () => {
    if (!analysisResult) return
    
    // Create a blob with the analysis content
    const blob = new Blob([analysisResult], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    
    // Create a download link and trigger it
    const a = document.createElement('a')
    a.href = url
    a.download = `legal-analysis-${analysisRequest.practice_area}-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    
    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Analysis Downloaded',
      description: 'Your legal analysis has been downloaded successfully.',
    })
  }
  
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Canadian Legal Tools</h1>
        <p className="text-muted-foreground mb-6">
          Essential tools for Canadian legal practice at Pathways Law
        </p>
      </motion.div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="deadline-calculator">Deadline Calculator</TabsTrigger>
          <TabsTrigger value="legal-analysis">Legal Issue Analysis</TabsTrigger>
          <TabsTrigger value="legal-research">Legal Research</TabsTrigger>
          <TabsTrigger value="citation-formatter">Citation Formatter</TabsTrigger>
          <TabsTrigger value="document-comparison">Document Comparison</TabsTrigger>
          <TabsTrigger value="fee-calculator">Fee Calculator</TabsTrigger>
          <TabsTrigger value="court-filing">Court Filing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deadline-calculator">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Deadline Calculator
                </CardTitle>
                <CardDescription>
                  Calculate legal deadlines based on Canadian court rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={deadlineRequest.start_date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDeadlineInputChange('start_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadline-type">Deadline Type</Label>
                  <Select
                    value={deadlineRequest.deadline_type}
                    onValueChange={(value: string) => handleDeadlineInputChange('deadline_type', value)}
                  >
                    <SelectTrigger id="deadline-type">
                      <SelectValue placeholder="Select deadline type" />
                    </SelectTrigger>
                    <SelectContent>
                      {deadlineTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Select
                    value={deadlineRequest.jurisdiction}
                    onValueChange={(value: string) => handleDeadlineInputChange('jurisdiction', value)}
                  >
                    <SelectTrigger id="jurisdiction">
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map(jurisdiction => (
                        <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                          {jurisdiction.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCalculateDeadline}
                  disabled={calculateDeadlineMutation.isPending || !deadlineRequest.deadline_type || !deadlineRequest.jurisdiction}
                >
                  {calculateDeadlineMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Calculate Deadline
                </Button>
              </CardFooter>
            </Card>
            
            {deadlineResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Deadline Results</CardTitle>
                  <CardDescription>
                    Based on {jurisdictions.find(j => j.value === deadlineResult.jurisdiction)?.label} rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Start Date:</p>
                    <p className="text-sm">{new Date(deadlineResult.start_date).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Deadline Type:</p>
                    <p className="text-sm">{deadlineTypes.find(t => t.value === deadlineResult.deadline_type)?.label}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Rule:</p>
                    <p className="text-sm">{deadlineResult.deadline_description}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Deadline Date:</p>
                    <p className="text-xl font-bold text-primary">{new Date(deadlineResult.deadline_date).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Days Remaining:</p>
                    <p className={`text-lg font-semibold ${deadlineResult.days_remaining < 7 ? 'text-destructive' : 'text-green-500'}`}>
                      {deadlineResult.days_remaining} days
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    onClick={handleAddToCalendar}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Add to Calendar
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="legal-analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-primary" />
                  Legal Issue Analysis
                </CardTitle>
                <CardDescription>
                  Get AI-powered analysis of Canadian legal issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issue-description">Issue Description</Label>
                  <Textarea
                    id="issue-description"
                    placeholder="Describe the legal issue in detail..."
                    value={analysisRequest.issue_description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnalysisInputChange('issue_description', e.target.value)}
                    rows={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="analysis-jurisdiction">Jurisdiction</Label>
                  <Select
                    value={analysisRequest.jurisdiction}
                    onValueChange={(value: string) => handleAnalysisInputChange('jurisdiction', value)}
                  >
                    <SelectTrigger id="analysis-jurisdiction">
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map(jurisdiction => (
                        <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                          {jurisdiction.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="practice-area">Practice Area</Label>
                  <Select
                    value={analysisRequest.practice_area}
                    onValueChange={(value: string) => handleAnalysisInputChange('practice_area', value)}
                  >
                    <SelectTrigger id="practice-area">
                      <SelectValue placeholder="Select practice area" />
                    </SelectTrigger>
                    <SelectContent>
                      {practiceAreas.map(area => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAnalyzeLegalIssue}
                  disabled={
                    analyzeLegalIssueMutation.isPending || 
                    !analysisRequest.issue_description || 
                    !analysisRequest.jurisdiction || 
                    !analysisRequest.practice_area
                  }
                >
                  {analyzeLegalIssueMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Analyze Issue
                </Button>
              </CardFooter>
            </Card>
            
            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Legal Analysis</CardTitle>
                  <CardDescription>
                    Analysis for {practiceAreas.find(p => p.value === analysisRequest.practice_area)?.label} issue 
                    in {jurisdictions.find(j => j.value === analysisRequest.jurisdiction)?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-4 bg-muted/20">
                    <ReactMarkdown>
                      {analysisResult}
                    </ReactMarkdown>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadAnalysis}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Analysis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="legal-research">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Legal Research
                </CardTitle>
                <CardDescription>
                  Search Canadian case law and legislation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="research-query">Search Query</Label>
                  <Textarea
                    id="research-query"
                    placeholder="Enter your legal research query..."
                    value={legalResearchQuery}
                    onChange={(e) => setLegalResearchQuery(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="research-jurisdiction">Jurisdiction</Label>
                  <Select
                    value={legalResearchJurisdiction}
                    onValueChange={setLegalResearchJurisdiction}
                  >
                    <SelectTrigger id="research-jurisdiction">
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurisdictions.map(jurisdiction => (
                        <SelectItem key={jurisdiction.value} value={jurisdiction.value}>
                          {jurisdiction.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  onClick={() => {
                    const request = {
                      query: legalResearchQuery,
                      jurisdiction: legalResearchJurisdiction || undefined
                    };
                    searchCaseLaw(request)
                      .then(data => {
                        setLegalResearchResults(data);
                        toast({
                          title: 'Research Complete',
                          description: 'Case law search results are ready.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to search case law: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!legalResearchQuery}
                >
                  Search Case Law
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const request = {
                      query: legalResearchQuery,
                      jurisdiction: legalResearchJurisdiction || undefined
                    };
                    searchLegislation(request)
                      .then(data => {
                        setLegalResearchResults(data);
                        toast({
                          title: 'Research Complete',
                          description: 'Legislation search results are ready.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to search legislation: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!legalResearchQuery}
                >
                  Search Legislation
                </Button>
              </CardFooter>
            </Card>
            
            {legalResearchResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Research Results</CardTitle>
                  <CardDescription>
                    {legalResearchResults.database?.name} - {legalResearchResults.query}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-4 bg-muted/20">
                    <ReactMarkdown>
                      {legalResearchResults.results}
                    </ReactMarkdown>
                  </div>
                  
                  {legalResearchResults.disclaimer && (
                    <div className="mt-4 text-xs text-muted-foreground italic">
                      {legalResearchResults.disclaimer}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (legalResearchResults.database?.search_url) {
                        window.open(legalResearchResults.database.search_url, '_blank');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    View in {legalResearchResults.database?.name}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (legalResearchResults.results) {
                        navigator.clipboard.writeText(legalResearchResults.results);
                        toast({
                          title: 'Copied to clipboard',
                          description: 'Research results have been copied to your clipboard',
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Results
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="citation-formatter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="h-5 w-5 text-primary" />
                  Citation Formatter
                </CardTitle>
                <CardDescription>
                  Format and parse Canadian legal citations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="citation-text">Citation Text</Label>
                  <Textarea
                    id="citation-text"
                    placeholder="Enter a citation to parse or format..."
                    value={citationText}
                    onChange={(e) => setCitationText(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-2">Format a New Case Citation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="case-title">Case Title</Label>
                      <Input
                        id="case-title"
                        placeholder="e.g., Smith v. Jones"
                        value={caseTitle}
                        onChange={(e) => setCaseTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="case-year">Year</Label>
                      <Input
                        id="case-year"
                        placeholder="e.g., 2023"
                        value={caseYear}
                        onChange={(e) => setCaseYear(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="case-volume">Volume</Label>
                      <Input
                        id="case-volume"
                        placeholder="e.g., 2"
                        value={caseVolume}
                        onChange={(e) => setCaseVolume(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="case-reporter">Reporter</Label>
                      <Input
                        id="case-reporter"
                        placeholder="e.g., SCR"
                        value={caseReporter}
                        onChange={(e) => setCaseReporter(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="case-page">Page</Label>
                      <Input
                        id="case-page"
                        placeholder="e.g., 123"
                        value={casePage}
                        onChange={(e) => setCasePage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="citation-style">Citation Style</Label>
                      <Select
                        value={citationStyle}
                        onValueChange={setCitationStyle}
                      >
                        <SelectTrigger id="citation-style">
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcgill">McGill Guide</SelectItem>
                          <SelectItem value="bluebook">Bluebook</SelectItem>
                          <SelectItem value="apa">APA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => {
                    parseCitation(citationText)
                      .then(data => {
                        setParsedCitation(data);
                        toast({
                          title: 'Citation Parsed',
                          description: 'Citation has been parsed successfully.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to parse citation: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!citationText}
                >
                  Parse Citation
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Get citation styles
                    getCitationStyles()
                      .then(styles => {
                        toast({
                          title: 'Citation Styles Retrieved',
                          description: `${styles.length} citation styles available.`,
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to retrieve citation styles: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                >
                  Get Citation Styles
                </Button>
                
                <Button 
                  onClick={() => {
                    if (!caseTitle || !caseYear || !caseVolume || !caseReporter || !casePage) {
                      toast({
                        title: 'Missing Information',
                        description: 'Please fill out all case citation fields',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    const request = {
                      case_info: {
                        case_name: caseTitle,
                        year: caseYear,
                        volume: caseVolume,
                        reporter: caseReporter,
                        page: casePage
                      },
                      style: citationStyle || undefined
                    };
                    
                    formatCaseCitation(request)
                      .then(data => {
                        setFormattedCitation(data);
                        toast({
                          title: 'Citation Formatted',
                          description: 'Case citation has been formatted successfully.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to format citation: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!caseTitle || !caseYear || !caseReporter || !casePage}
                >
                  Format Case Citation
                </Button>
              </CardFooter>
            </Card>
            
            {(parsedCitation || formattedCitation) && (
              <Card>
                <CardHeader>
                  <CardTitle>{formattedCitation ? 'Formatted Citation' : 'Parsed Citation'}</CardTitle>
                  <CardDescription>
                    {formattedCitation ? 
                      `${formattedCitation.style?.name || 'Standard'} citation format` : 
                      'Analysis of the provided citation'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-4 bg-muted/20">
                    {formattedCitation ? (
                      <div className="font-medium p-2 bg-muted rounded">
                        {formattedCitation.formatted_citation}
                      </div>
                    ) : (
                      <ReactMarkdown>
                        {parsedCitation.parsed_result}
                      </ReactMarkdown>
                    )}
                  </div>
                  
                  {formattedCitation && formattedCitation.case_info && (
                    <div className="mt-4 border rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">Citation Components</h3>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        {(Object.entries(formattedCitation.case_info) as [string, string][]).map(([key, value]) => (
                          <React.Fragment key={key}>
                            <dt className="font-medium text-muted-foreground">{key.replace('_', ' ')}</dt>
                            <dd>{value}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const content = formattedCitation ? 
                        formattedCitation.formatted_citation : 
                        parsedCitation.parsed_result;
                        
                      if (content) {
                        navigator.clipboard.writeText(content);
                        toast({
                          title: 'Copied to clipboard',
                          description: 'Citation has been copied to your clipboard',
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Results
                  </Button>
                  
                  {formattedCitation && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Format legislation citation
                        const legislationRequest = {
                          legislation_info: {
                            title: 'Criminal Code',
                            jurisdiction: 'Canada',
                            year: '1985',
                            chapter: 'C-46',
                            sections: '718-718.2'
                          },
                          style: citationStyle || undefined
                        };
                        
                        formatLegislationCitation(legislationRequest)
                          .then(data => {
                            setFormattedCitation(data);
                            toast({
                              title: 'Legislation Citation Formatted',
                              description: 'Sample legislation citation has been formatted.',
                            });
                          })
                          .catch(error => {
                            toast({
                              title: 'Error',
                              description: `Failed to format legislation citation: ${error.message}`,
                              variant: 'destructive',
                            });
                          });
                      }}
                    >
                      Try Legislation Citation
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="document-comparison">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDiff className="h-5 w-5 text-primary" />
                  Document Comparison
                </CardTitle>
                <CardDescription>
                  Compare different versions of legal documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="original-text">Original Document</Label>
                  <Textarea
                    id="original-text"
                    placeholder="Enter the original document text..."
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    rows={5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="revised-text">Revised Document</Label>
                  <Textarea
                    id="revised-text"
                    placeholder="Enter the revised document text..."
                    value={revisedText}
                    onChange={(e) => setRevisedText(e.target.value)}
                    rows={5}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => {
                    const request = {
                      original_text: originalText,
                      revised_text: revisedText,
                      format: 'markdown' as const
                    };
                    compareDocuments(request)
                      .then(data => {
                        setComparisonResult(data);
                        toast({
                          title: 'Comparison Complete',
                          description: 'Document comparison results are ready.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to compare documents: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!originalText || !revisedText}
                >
                  Compare Documents
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const request = {
                      original_text: originalText,
                      revised_text: revisedText
                    };
                    summarizeChanges(request)
                      .then(data => {
                        setComparisonResult({
                          format: 'markdown',
                          comparison_result: data.summary,
                          stats: data.stats
                        });
                        toast({
                          title: 'Summary Complete',
                          description: 'Document changes have been summarized.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to summarize changes: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!originalText || !revisedText}
                >
                  Summarize Changes
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Only use the original document for clause extraction
                    if (!originalText) {
                      toast({
                        title: 'Missing Document',
                        description: 'Please enter text in the Original Document field',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    extractClauses(originalText)
                      .then(data => {
                        // Store the result in the comparison result state
                        setComparisonResult({
                          format: 'markdown',
                          comparison_result: data.extracted_clauses,
                          stats: {
                            original_length: data.document_length,
                            revised_length: 0,
                            original_lines: 0,
                            revised_lines: 0
                          }
                        });
                        
                        toast({
                          title: 'Clauses Extracted',
                          description: 'Document clauses have been extracted successfully.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to extract clauses: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!originalText}
                >
                  Extract Clauses
                </Button>
              </CardFooter>
            </Card>
            
            {comparisonResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Results</CardTitle>
                  <CardDescription>
                    {comparisonResult.stats && `${comparisonResult.stats.original_lines} lines → ${comparisonResult.stats.revised_lines} lines`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-4 bg-muted/20">
                    <ReactMarkdown>
                      {comparisonResult.comparison_result}
                    </ReactMarkdown>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (comparisonResult.comparison_result) {
                        navigator.clipboard.writeText(comparisonResult.comparison_result);
                        toast({
                          title: 'Copied to clipboard',
                          description: 'Comparison results have been copied to your clipboard',
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Results
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (comparisonResult.comparison_result) {
                        const blob = new Blob([comparisonResult.comparison_result], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `document-comparison-${new Date().toISOString().split('T')[0]}.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast({
                          title: 'Downloaded',
                          description: 'Comparison results have been downloaded',
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Results
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="fee-calculator">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Legal Fee Calculator
                </CardTitle>
                <CardDescription>
                  Estimate legal fees based on matter type and complexity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="matter-type">Matter Type</Label>
                  <Select
                    value={matterType}
                    onValueChange={setMatterType}
                  >
                    <SelectTrigger id="matter-type">
                      <SelectValue placeholder="Select matter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="litigation">Litigation</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="family">Family Law</SelectItem>
                      <SelectItem value="estate">Wills & Estates</SelectItem>
                      <SelectItem value="personal_injury">Personal Injury</SelectItem>
                      <SelectItem value="employment">Employment Law</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select
                    value={complexity}
                    onValueChange={setComplexity}
                  >
                    <SelectTrigger id="complexity">
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Complexity</SelectItem>
                      <SelectItem value="medium">Medium Complexity</SelectItem>
                      <SelectItem value="high">High Complexity</SelectItem>
                      <SelectItem value="very_high">Very High Complexity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Estimated Recovery (for Contingency Fee)</Label>
                  <Input
                    type="number"
                    placeholder="Enter estimated recovery amount"
                    min="0"
                    id="estimated-recovery"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  onClick={() => {
                    // For demo purposes, we'll use fixed values for hourly estimates
                    const request = {
                      matter_type: matterType,
                      complexity: complexity,
                      estimated_hours: {
                        partner: 5,
                        associate: 15,
                        paralegal: 10
                      }
                    };
                    calculateHourlyFeeEstimate(request)
                      .then(data => {
                        setFeeEstimate(data);
                        toast({
                          title: 'Fee Estimate Complete',
                          description: 'Hourly fee estimate is ready.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to calculate fee estimate: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!matterType || !complexity}
                >
                  Calculate Hourly Estimate
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const recoveryInput = document.getElementById('estimated-recovery') as HTMLInputElement;
                    const estimatedRecovery = parseFloat(recoveryInput.value);
                    
                    if (!estimatedRecovery || isNaN(estimatedRecovery)) {
                      toast({
                        title: 'Error',
                        description: 'Please enter a valid estimated recovery amount',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    const request = {
                      matter_type: matterType,
                      estimated_recovery: estimatedRecovery
                    };
                    
                    calculateContingencyFeeEstimate(request)
                      .then(data => {
                        setFeeEstimate(data);
                        toast({
                          title: 'Fee Estimate Complete',
                          description: 'Contingency fee estimate is ready.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to calculate contingency fee: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!matterType}
                >
                  Calculate Contingency Fee
                </Button>
              </CardFooter>
            </Card>
            
            {feeEstimate && (
              <Card>
                <CardHeader>
                  <CardTitle>Fee Estimate</CardTitle>
                  <CardDescription>
                    {feeEstimate.matter_type} - {feeEstimate.fee_structure} structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feeEstimate.fee_structure === 'hourly' ? (
                    <div className="space-y-4">
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Fee Breakdown</h3>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Role</th>
                              <th className="text-right py-2">Hours</th>
                              <th className="text-right py-2">Rate</th>
                              <th className="text-right py-2">Fee</th>
                            </tr>
                          </thead>
                          <tbody>
                            {feeEstimate.line_items.map((item: {role_name: string, hours: number, rate: number, fee: number}, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2">{item.role_name}</td>
                                <td className="text-right py-2">{item.hours}</td>
                                <td className="text-right py-2">${item.rate.toFixed(2)}</td>
                                <td className="text-right py-2">${item.fee.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Professional Fees:</span>
                            <span>${feeEstimate.summary.total_fees.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Disbursements:</span>
                            <span>${feeEstimate.summary.disbursements.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxes:</span>
                            <span>${feeEstimate.summary.taxes.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t pt-2">
                            <span>Total:</span>
                            <span>${feeEstimate.summary.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : feeEstimate.fee_structure === 'contingency' ? (
                    <div className="space-y-4">
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Contingency Fee Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Estimated Recovery:</span>
                            <span>${feeEstimate.estimated_recovery.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Contingency Percentage:</span>
                            <span>{feeEstimate.contingency_percentage}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h3 className="font-medium mb-2">Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Contingency Fee:</span>
                            <span>${feeEstimate.summary.contingency_fee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Disbursements:</span>
                            <span>${feeEstimate.summary.disbursements.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Taxes:</span>
                            <span>${feeEstimate.summary.taxes.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t pt-2">
                            <span>Total Costs:</span>
                            <span>${feeEstimate.summary.total_costs.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-green-600 font-bold">
                            <span>Net Recovery:</span>
                            <span>${feeEstimate.summary.net_recovery.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-4 bg-muted/20">
                      <ReactMarkdown>
                        {feeEstimate.fee_estimate}
                      </ReactMarkdown>
                    </div>
                  )}
                  
                  {feeEstimate.disclaimer && (
                    <div className="mt-4 text-xs text-muted-foreground italic">
                      {feeEstimate.disclaimer}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="court-filing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Court Filing Assistant
                </CardTitle>
                <CardDescription>
                  Generate checklists and instructions for court filings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select
                    value={documentType}
                    onValueChange={setDocumentType}
                  >
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ontario_statement_of_claim">Statement of Claim (Ontario)</SelectItem>
                      <SelectItem value="ontario_statement_of_defence">Statement of Defence (Ontario)</SelectItem>
                      <SelectItem value="federal_notice_of_application">Notice of Application (Federal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filing-jurisdiction">Jurisdiction</Label>
                  <Select
                    value={filingJurisdiction}
                    onValueChange={setFilingJurisdiction}
                  >
                    <SelectTrigger id="filing-jurisdiction">
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ontario_superior">Ontario Superior Court</SelectItem>
                      <SelectItem value="ontario_court">Ontario Court of Justice</SelectItem>
                      <SelectItem value="federal_court">Federal Court</SelectItem>
                      <SelectItem value="bc_supreme">BC Supreme Court</SelectItem>
                      <SelectItem value="alberta_court_kings_bench">Alberta Court of King's Bench</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => {
                    const request = {
                      document_type: documentType,
                      jurisdiction: filingJurisdiction
                    };
                    generateFilingChecklist(request)
                      .then(data => {
                        setFilingChecklist(data);
                        toast({
                          title: 'Checklist Generated',
                          description: 'Filing checklist is ready.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to generate filing checklist: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!documentType || !filingJurisdiction}
                >
                  Generate Filing Checklist
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const request = {
                      document_type: documentType,
                      jurisdiction: filingJurisdiction
                    };
                    generateFilingInstructions(request)
                      .then(data => {
                        setFilingChecklist(data);
                        toast({
                          title: 'Instructions Generated',
                          description: 'Filing instructions are ready.',
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to generate filing instructions: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!documentType || !filingJurisdiction}
                >
                  Generate Filing Instructions
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (!filingJurisdiction) {
                      toast({
                        title: 'Missing Jurisdiction',
                        description: 'Please select a jurisdiction',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    getCourtRules(filingJurisdiction)
                      .then(data => {
                        // Store the result in the filing checklist state
                        setFilingChecklist({
                          jurisdiction: data.jurisdiction,
                          document_type: '',
                          checklist: `# Court Rules for ${data.name}

## Rules Information
- Court: ${data.name}
- Rules Name: ${data.rules_name}
- Rules URL: ${data.rules_url}
- Practice Directions: ${data.practice_directions_url}

Please visit the official court website for complete and up-to-date rules.`,
                          generated_date: new Date().toISOString(),
                          disclaimer: 'This information is provided for reference only. Always verify with the official court website.'
                        });
                        
                        toast({
                          title: 'Court Rules Retrieved',
                          description: `Rules for ${data.name} are ready.`,
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to retrieve court rules: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!filingJurisdiction}
                >
                  Get Court Rules
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (!documentType) {
                      toast({
                        title: 'Missing Document Type',
                        description: 'Please select a document type',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    getFilingRequirements(documentType)
                      .then(data => {
                        // Store the result in the filing checklist state
                        setFilingChecklist({
                          document_type: data.document_type,
                          jurisdiction: data.court,
                          checklist: `# Filing Requirements for ${data.document_type}

## Court Information
- Court: ${data.court}
- Rule Reference: ${data.rule_reference}

## Filing Details
- Filing Fee: $${data.filing_fee.toFixed(2)}
- Required Copies: ${data.required_copies}

## Format Requirements
${data.format_requirements.map(req => `- ${req}`).join('\n')}

## Content Requirements
${data.content_requirements.map(req => `- ${req}`).join('\n')}

## Time Limits
${Object.entries(data.time_limits).map(([key, value]) => `- ${key}: ${value}`).join('\n')}`,
                          generated_date: new Date().toISOString(),
                          disclaimer: 'This information is provided for reference only. Always verify with the official court website.'
                        });
                        
                        toast({
                          title: 'Filing Requirements Retrieved',
                          description: `Requirements for ${data.document_type} are ready.`,
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to retrieve filing requirements: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!documentType}
                >
                  Get Filing Requirements
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (!filingJurisdiction) {
                      toast({
                        title: 'Missing Jurisdiction',
                        description: 'Please select a jurisdiction',
                        variant: 'destructive',
                      });
                      return;
                    }
                    
                    getCourtForms(filingJurisdiction)
                      .then(data => {
                        // Store the result in the filing checklist state
                        setFilingChecklist({
                          jurisdiction: data.jurisdiction,
                          document_type: '',
                          checklist: `# Court Forms for ${data.name}

## Available Forms
${data.forms.map(form => `- [${form.name}](${form.url}) (Form Code: ${form.code})`).join('\n')}

Please visit the official court website for complete and up-to-date forms.`,
                          generated_date: new Date().toISOString(),
                          disclaimer: 'This information is provided for reference only. Always verify with the official court website.'
                        });
                        
                        toast({
                          title: 'Court Forms Retrieved',
                          description: `Forms for ${data.name} are ready.`,
                        });
                      })
                      .catch(error => {
                        toast({
                          title: 'Error',
                          description: `Failed to retrieve court forms: ${error.message}`,
                          variant: 'destructive',
                        });
                      });
                  }}
                  disabled={!filingJurisdiction}
                >
                  Get Court Forms
                </Button>
              </CardFooter>
            </Card>
            
            {filingChecklist && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {filingChecklist.document_type ? 'Filing Checklist' : 'Filing Instructions'}
                  </CardTitle>
                  <CardDescription>
                    For {documentType} in {filingJurisdiction}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-4 bg-muted/20">
                    <ReactMarkdown>
                      {filingChecklist.checklist || filingChecklist.instructions}
                    </ReactMarkdown>
                  </div>
                  
                  {filingChecklist.disclaimer && (
                    <div className="mt-4 text-xs text-muted-foreground italic">
                      {filingChecklist.disclaimer}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const content = filingChecklist.checklist || filingChecklist.instructions;
                      if (content) {
                        navigator.clipboard.writeText(content);
                        toast({
                          title: 'Copied to clipboard',
                          description: 'Filing information has been copied to your clipboard',
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const content = filingChecklist.checklist || filingChecklist.instructions;
                      if (content) {
                        const blob = new Blob([content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `court-filing-${documentType}-${new Date().toISOString().split('T')[0]}.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast({
                          title: 'Downloaded',
                          description: 'Filing information has been downloaded',
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
