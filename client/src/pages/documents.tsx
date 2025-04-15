import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Filter, Loader2, Download, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { fetchDocumentTemplates, generateDocument } from '@/lib/api'
import { DocumentTemplate } from '@/types'
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay'

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
  { value: 'quebec', label: 'Quebec' },
  { value: 'nova_scotia', label: 'Nova Scotia' },
  { value: 'new_brunswick', label: 'New Brunswick' },
  { value: 'manitoba', label: 'Manitoba' },
  { value: 'british_columbia', label: 'British Columbia' },
  { value: 'prince_edward_island', label: 'Prince Edward Island' },
  { value: 'saskatchewan', label: 'Saskatchewan' },
  { value: 'alberta', label: 'Alberta' },
  { value: 'newfoundland_and_labrador', label: 'Newfoundland and Labrador' },
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
  { value: 'corporate-commercial', label: 'Corporate & Commercial Law' },
  { value: 'ip-tech', label: 'Intellectual Property & Technology Law' },
  { value: 'real-estate-construction', label: 'Real Estate & Construction Law' },
  { value: 'employment-labor', label: 'Employment & Labor Law' },
  { value: 'estate-probate', label: 'Estate Planning & Probate Law' },
  { value: 'alternative-dispute-resolution', label: 'Alternative Dispute Resolution (ADR)' },
  
]

export default function DocumentsPage() {
  const { toast } = useToast()
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('')
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})  
  const [generatedDocument, setGeneratedDocument] = useState<string>('')
  const [activeTab, setActiveTab] = useState('templates')
  const [copied, setCopied] = useState(false)
  
  // Fetch document templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['documentTemplates', selectedPracticeArea, selectedJurisdiction],
    queryFn: () => fetchDocumentTemplates(selectedPracticeArea, selectedJurisdiction),
  })
  
  // Generate document mutation
  const generateDocumentMutation = useMutation({
    mutationFn: generateDocument,
    onSuccess: (data) => {
      setGeneratedDocument(data.content)
      toast({
        title: 'Document Generated',
        description: 'Your document has been successfully generated.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate document: ${error.message}`,
        variant: 'destructive',
      })
    },
  })
  
  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    // Initialize field values
    const initialValues: Record<string, string> = {}
    template.template_fields.forEach(field => {
      initialValues[field] = ''
    })
    setFieldValues(initialValues)
    setGeneratedDocument('')
  }
  
  const handleFieldChange = (field: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleGenerateDocument = () => {
    if (!selectedTemplate) return
    
    generateDocumentMutation.mutate({
      template_id: selectedTemplate.id,
      field_values: fieldValues,
    })
    
    // Switch to preview tab when document is generated
    setActiveTab('preview')
  }
  
  const handleCopyToClipboard = () => {
    if (generatedDocument) {
      navigator.clipboard.writeText(generatedDocument)
      setCopied(true)
      toast({
        title: 'Copied to clipboard',
        description: 'Document content has been copied to your clipboard',
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  const handleDownloadDocument = () => {
    if (!generatedDocument || !selectedTemplate) return
    
    // Create a blob with the document content
    const blob = new Blob([generatedDocument], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    
    // Create a download link and trigger it
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    
    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Document Downloaded',
      description: 'Your document has been downloaded successfully.',
    })
  }
  
  return (
    <div className="space-y-6 relative">
      <AIProcessingOverlay
        isProcessing={isLoading || generateDocumentMutation.isPending}
        theme="document"
        title={generateDocumentMutation.isPending ? 'Generating Document' : 'Loading Templates'}
        message={generateDocumentMutation.isPending ? 'Our AI is generating your document based on the provided information...' : 'Loading document templates...'}
        modelName="gpt-4.1-nano"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Legal Document Management</h1>
        <p className="text-muted-foreground mb-6">
          Generate and manage legal documents for Pathways Law practice
        </p>
      </motion.div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <Card className="md:w-1/4">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter document templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Select
                value={selectedJurisdiction}
                onValueChange={setSelectedJurisdiction}
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
            
            <div className="space-y-2">
              <Label htmlFor="practiceArea">Practice Area</Label>
              <Select
                value={selectedPracticeArea}
                onValueChange={setSelectedPracticeArea}
              >
                <SelectTrigger id="practiceArea">
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
        </Card>
        
        {/* Main content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="generator" disabled={!selectedTemplate}>Document Generator</TabsTrigger>
              <TabsTrigger value="preview" disabled={!generatedDocument}>Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <div className="col-span-full flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : templates && templates.length > 0 ? (
                  templates.map(template => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? 'border-primary' : ''}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          {template.name}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-2">
                          {template.practice_areas.map(area => (
                            <span key={area} className="bg-muted text-xs px-2 py-1 rounded-full">
                              {area.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="text-xs text-muted-foreground">
                        {template.jurisdictions.map(j => j.replace('_', ' ')).join(', ')}
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No document templates found. Try adjusting your filters.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="generator">
              {selectedTemplate && (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTemplate.template_fields.map(field => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={field}>
                          {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Label>
                        {field.includes('description') || field.includes('content') || field.includes('details') ? (
                          <Textarea
                            id={field}
                            value={fieldValues[field] || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange(field, e.target.value)}
                            placeholder={`Enter ${field.replace('_', ' ')}`}
                            rows={4}
                          />
                        ) : (
                          <Input
                            id={field}
                            value={fieldValues[field] || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field, e.target.value)}
                            placeholder={`Enter ${field.replace('_', ' ')}`}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleGenerateDocument}
                      disabled={generateDocumentMutation.isPending}
                    >
                      {generateDocumentMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Generate Document
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="preview">
              {generatedDocument ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Document</CardTitle>
                    <CardDescription>
                      {selectedTemplate?.name} - Generated on {new Date().toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert border rounded-md p-4 bg-muted/20">
                      <ReactMarkdown>
                        {generatedDocument}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      onClick={handleDownloadDocument}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Document
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
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No document has been generated yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
