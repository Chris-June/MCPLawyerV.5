import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Save, Copy, Download, HelpCircle } from 'lucide-react';
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay';
import ClauseGenerator from '@/components/ClauseGenerator';
import { clauseLibraryApi } from '@/lib/api/clauseLibraryApi';
import { Clause } from '@/types/clauseLibrary';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DocumentAutomationPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for document assembly
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [selectedClauses, setSelectedClauses] = useState<Clause[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // State for filtering clauses
  const [practiceArea, setPracticeArea] = useState<string>('');
  const [jurisdiction, setJurisdiction] = useState<string>('');
  
  // Queries
  const { data: clauses, isLoading: isLoadingClauses } = useQuery({
    queryKey: ['clauses', practiceArea, jurisdiction],
    queryFn: () => clauseLibraryApi.getClauses({
      practiceArea: practiceArea || undefined,
      jurisdiction: jurisdiction || undefined,
    }),
  });
  
  // Mutations
  const createClauseMutation = useMutation({
    mutationFn: clauseLibraryApi.createClause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] });
      toast({
        title: 'Success',
        description: 'Clause added to library',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add clause to library: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Document types
  const documentTypes = [
    { id: 'affidavit', name: 'Affidavit' },
    { id: 'agreement', name: 'Agreement' },
    { id: 'board resolution', name: 'Board Resolution' },
    { id: 'compliance', name: 'Compliance Certificate' },
    { id: 'consulting', name: 'Consulting Agreement' },
    { id: 'contract', name: 'Contract' },
    { id: 'disclaimer', name: 'Disclaimer' },
    { id: 'eula', name: 'End User License Agreement' },
    { id: 'employment', name: 'Employment Agreement' },
    { id: 'letter', name: 'Letter' },
    { id: 'loa', name: 'Letter of Agreement' },
    { id: 'memo', name: 'Memorandum' },
    { id: 'nda', name: 'Non-Disclosure Agreement' },
    { id: 'notice', name: 'Notice Letter' },
    { id: 'partnership', name: 'Partnership Agreement' },
    { id: 'policy', name: 'Policy' },
    { id: 'privacy', name: 'Privacy Policy' },
    { id: 'release', name: 'Release Form' },
    { id: 'terms', name: 'Terms and Conditions' },
    { id: 'termination', name: 'Termination Notice' },
  ];
  
  // Handle adding a clause to the document
  const handleAddClause = (clause: Clause) => {
    setSelectedClauses(prev => [...prev, clause]);
    setDocumentContent(prev => {
      // Add a heading for the clause if document already has content
      const heading = prev ? `\n\n## ${clause.name}\n` : `## ${clause.name}\n`;
      return prev + heading + clause.content;
    });
    
    toast({
      title: 'Clause Added',
      description: `"${clause.name}" has been added to your document`,
    });
  };
  
  // Handle removing a clause from the document
  const handleRemoveClause = (clause: Clause) => {
    setSelectedClauses(prev => prev.filter(c => c.id !== clause.id));
    
    // Remove the clause and its heading from the document content
    const headingPattern = new RegExp(`\\n*## ${clause.name}\\n${clause.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    setDocumentContent(prev => prev.replace(headingPattern, ''));
    
    toast({
      title: 'Clause Removed',
      description: `"${clause.name}" has been removed from your document`,
    });
  };
  
  // Handle saving a generated clause to the library
  const handleSaveGeneratedClause = (clauseData: any) => {
    createClauseMutation.mutate(clauseData);
  };
  
  // Handle copying document to clipboard
  const handleCopyDocument = () => {
    navigator.clipboard.writeText(documentContent);
    toast({
      title: 'Copied',
      description: 'Document copied to clipboard',
    });
  };
  
  // Handle downloading document as markdown
  const handleDownloadDocument = () => {
    const blob = new Blob([documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle || 'document'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 relative">
        <AIProcessingOverlay
          isProcessing={isLoadingClauses || createClauseMutation.isPending}
          theme="document"
          title={createClauseMutation.isPending ? 'Processing Document' : 'Loading Clauses'}
          message={createClauseMutation.isPending ? 'Our AI is processing your document request...' : 'Loading clause library...'}
          modelName="gpt-4.1-nano"
        />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Document Automation</h1>
            <p className="text-muted-foreground">Create customized legal documents using our clause library and AI generation</p>
          </div>
        </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Assembly */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Assembly</CardTitle>
              <CardDescription>Create your document by adding clauses and custom content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="document-title">Document Title</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter a descriptive title for your legal document</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="document-title"
                    placeholder="E.g., Confidentiality Agreement - ABC Corp"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the type of legal document you're creating</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={documentType}
                    onValueChange={setDocumentType}
                  >
                    <SelectTrigger id="document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="document-content">Document Content</Label>
                <Textarea
                  id="document-content"
                  placeholder="Start typing or add clauses from the library..."
                  className="min-h-[400px] font-mono"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                />
              </div>
              
              {selectedClauses.length > 0 && (
                <div>
                  <Label>Added Clauses</Label>
                  <div className="border rounded-md p-3 mt-1">
                    <div className="space-y-2">
                      {selectedClauses.map((clause) => (
                        <div key={clause.id} className="flex justify-between items-center bg-muted p-2 rounded-md">
                          <div className="text-sm">{clause.name}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveClause(clause)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                  Preview
                </Button>
                <Button variant="outline" onClick={handleCopyDocument}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" onClick={handleDownloadDocument}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <ClauseGenerator onSaveClause={handleSaveGeneratedClause} />
        </div>
        
        {/* Right Column - Clause Library */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Clause Library</CardTitle>
              <CardDescription>Browse and add clauses to your document</CardDescription>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filter-practice">Practice Area</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter clauses by legal practice area</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={practiceArea}
                    onValueChange={setPracticeArea}
                  >
                    <SelectTrigger id="filter-practice">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="banking">Banking</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="criminal">Criminal</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="immigration">Immigration</SelectItem>
                      <SelectItem value="intellectual_property">Intellectual Property</SelectItem>
                      <SelectItem value="litigation">Litigation</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="wills_estates">Wills & Estates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filter-jurisdiction">Jurisdiction</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter clauses by applicable legal jurisdiction in Canada</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={jurisdiction}
                    onValueChange={setJurisdiction}
                  >
                  <SelectTrigger id="filter-jurisdiction">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="alberta">Alberta</SelectItem>
                    <SelectItem value="british_columbia">British Columbia</SelectItem>
                    <SelectItem value="manitoba">Manitoba</SelectItem>
                    <SelectItem value="new_brunswick">New Brunswick</SelectItem>
                    <SelectItem value="newfoundland_and_labrador">Newfoundland and Labrador</SelectItem>
                    <SelectItem value="nova_scotia">Nova Scotia</SelectItem>
                    <SelectItem value="ontario">Ontario</SelectItem>
                    <SelectItem value="prince_edward_island">Prince Edward Island</SelectItem>
                    <SelectItem value="quebec">Quebec</SelectItem>
                    <SelectItem value="saskatchewan">Saskatchewan</SelectItem>
                    <SelectItem value="northwest_territories">Northwest Territories</SelectItem>
                    <SelectItem value="nunavut">Nunavut</SelectItem>
                    <SelectItem value="yukon">Yukon</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                  </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {isLoadingClauses ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : clauses?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No clauses found. Try adjusting your filters or add new clauses.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {clauses?.map((clause: Clause) => (
                      <Card key={clause.id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">{clause.name}</CardTitle>
                          <CardDescription className="text-xs">{clause.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-xs text-muted-foreground mb-2">
                            Jurisdictions: {clause.jurisdictions.join(', ')}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleAddClause(clause)}
                          >
                            Add to Document
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Document Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{documentTitle || 'Untitled Document'}</DialogTitle>
            <DialogDescription>
              {documentType ? `${documentType.charAt(0).toUpperCase() + documentType.slice(1)}` : 'Document'} Preview
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <div className="p-6 bg-muted rounded-md">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {documentContent ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: documentContent
                        .replace(/\n/g, '<br>')
                        .replace(/## (.+)/g, '<h2>$1</h2>')
                    }} />
                  ) : (
                    <p className="text-muted-foreground">No content to preview</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={handleCopyDocument}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button onClick={handleDownloadDocument}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default DocumentAutomationPage;
