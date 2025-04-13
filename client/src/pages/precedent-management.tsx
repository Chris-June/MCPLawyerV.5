import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, HelpCircle, BookOpen, FileText, Tag, Calendar, Bookmark, ExternalLink, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Precedent, PrecedentCreateRequest, PrecedentUpdateRequest } from '@/types';
import { precedentManagementApi } from '@/lib/api/precedentManagementApi';
import { CreatePrecedentDialog, ViewPrecedentDialog, AnalysisPrecedentDialog } from './precedent-management-dialogs';

const PrecedentManagementPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filters
  const [practiceArea, setPracticeArea] = useState<string>('');
  const [jurisdiction, setJurisdiction] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // State for precedent creation/editing
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [currentPrecedent, setCurrentPrecedent] = useState<Precedent | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newPrecedent, setNewPrecedent] = useState<PrecedentCreateRequest>({
    title: '',
    citation: '',
    court: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    key_points: [],
    practice_areas: [],
    jurisdictions: [],
    tags: [],
    url: '',
    document_type: 'case',
  });
  const [newKeyPoint, setNewKeyPoint] = useState<string>('');
  
  // Queries
  const { data: precedents, isLoading: isLoadingPrecedents } = useQuery({
    queryKey: ['precedents', practiceArea, jurisdiction, documentType, searchTerm, selectedTags],
    queryFn: () => precedentManagementApi.getPrecedents({
      practiceArea: practiceArea || undefined,
      jurisdiction: jurisdiction || undefined,
      documentType: documentType || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      searchTerm: searchTerm || undefined,
    }),
  });
  
  const { data: tags } = useQuery({
    queryKey: ['precedentTags'],
    queryFn: precedentManagementApi.getPrecedentTags,
  });
  
  const { data: categories } = useQuery({
    queryKey: ['precedentCategories'],
    queryFn: precedentManagementApi.getPrecedentCategories,
  });
  
  // Mutations
  const createPrecedentMutation = useMutation({
    mutationFn: precedentManagementApi.createPrecedent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precedents'] });
      toast({
        title: 'Success',
        description: 'Precedent created successfully',
      });
      setIsCreateDialogOpen(false);
      resetNewPrecedent();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create precedent: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  const deletePrecedentMutation = useMutation({
    mutationFn: precedentManagementApi.deletePrecedent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precedents'] });
      toast({
        title: 'Success',
        description: 'Precedent deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete precedent: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  const analyzePrecedentMutation = useMutation({
    mutationFn: precedentManagementApi.analyzePrecedent,
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      setIsAnalyzing(false);
      setIsAnalysisDialogOpen(true);
      toast({
        title: 'Analysis Complete',
        description: 'AI analysis of the precedent is ready',
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: 'Error',
        description: `Failed to analyze precedent: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Helper functions
  const resetNewPrecedent = () => {
    setNewPrecedent({
      title: '',
      citation: '',
      court: '',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      key_points: [],
      practice_areas: [],
      jurisdictions: [],
      tags: [],
      url: '',
      document_type: 'case',
    });
    setNewKeyPoint('');
  };
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const handleAddKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setNewPrecedent({
        ...newPrecedent,
        key_points: [...newPrecedent.key_points, newKeyPoint.trim()],
      });
      setNewKeyPoint('');
    }
  };
  
  const handleRemoveKeyPoint = (index: number) => {
    setNewPrecedent({
      ...newPrecedent,
      key_points: newPrecedent.key_points.filter((_, i) => i !== index),
    });
  };
  
  const handleCreatePrecedent = () => {
    createPrecedentMutation.mutate(newPrecedent);
  };
  
  const handleViewPrecedent = (precedent: Precedent) => {
    setCurrentPrecedent(precedent);
    setIsViewDialogOpen(true);
  };
  
  const handleDeletePrecedent = (precedentId: string) => {
    if (confirm('Are you sure you want to delete this precedent?')) {
      deletePrecedentMutation.mutate(precedentId);
    }
  };
  
  const handleAnalyzePrecedent = (precedentId: string) => {
    setIsAnalyzing(true);
    analyzePrecedentMutation.mutate(precedentId);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Precedent Management</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Add New Precedent</Button>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find legal precedents by practice area, jurisdiction, type, or keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="search">Search</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search for precedents by title, citation, or content</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="E.g., Smith v. Jones, confidentiality..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="practice-area">Practice Area</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter precedents by legal practice area</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={practiceArea}
                  onValueChange={setPracticeArea}
                >
                  <SelectTrigger id="practice-area">
                    <SelectValue placeholder="All Practice Areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Practice Areas</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="litigation">Litigation</SelectItem>
                    <SelectItem value="employment">Employment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter precedents by applicable legal jurisdiction in Canada</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={jurisdiction}
                  onValueChange={setJurisdiction}
                >
                  <SelectTrigger id="jurisdiction">
                    <SelectValue placeholder="All Jurisdictions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jurisdictions</SelectItem>
                    <SelectItem value="ontario">Ontario</SelectItem>
                    <SelectItem value="british_columbia">British Columbia</SelectItem>
                    <SelectItem value="alberta">Alberta</SelectItem>
                    <SelectItem value="quebec">Quebec</SelectItem>
                    <SelectItem value="federal">Federal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="document-type">Document Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter precedents by document type</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={documentType}
                  onValueChange={setDocumentType}
                >
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="All Document Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Document Types</SelectItem>
                    <SelectItem value="case">Case Law</SelectItem>
                    <SelectItem value="statute">Statutes</SelectItem>
                    <SelectItem value="template">Templates</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="policy">Policies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label>Tags</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter precedents by specific tags or categories</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-y-auto">
                  {tags?.slice(0, 10).map((tag, index) => (
                    <Badge 
                      key={`${tag}-${index}`} 
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {tags && tags.length > 10 && (
                    <Badge variant="secondary">+{tags.length - 10} more</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Precedents List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoadingPrecedents ? (
            <div className="col-span-3 flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading precedents...</span>
            </div>
          ) : precedents?.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p>No precedents found. Try adjusting your filters or create a new precedent.</p>
            </div>
          ) : (
            precedents?.map((precedent) => (
              <Card key={precedent.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {precedent.document_type === 'case' && <BookOpen className="h-4 w-4 text-primary" />}
                        {precedent.document_type === 'statute' && <FileText className="h-4 w-4 text-primary" />}
                        {precedent.document_type === 'template' && <Bookmark className="h-4 w-4 text-primary" />}
                        {precedent.title}
                      </CardTitle>
                      <CardDescription>{precedent.citation}</CardDescription>
                    </div>
                    {precedent.url && (
                      <a href={precedent.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-2">
                    <p className="text-sm line-clamp-3">{precedent.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>{precedent.date}</span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium">Practice Areas:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {precedent.practice_areas.map((area) => (
                        <Badge key={area} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tags:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {precedent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                      {precedent.tags.length > 3 && (
                        <Badge variant="outline">+{precedent.tags.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Added: {precedent.added_date}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewPrecedent(precedent)}>View</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAnalyzePrecedent(precedent.id)}>Analyze</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePrecedent(precedent.id)}>Delete</Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Dialogs */}
      <CreatePrecedentDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        newPrecedent={newPrecedent}
        setNewPrecedent={setNewPrecedent}
        newKeyPoint={newKeyPoint}
        setNewKeyPoint={setNewKeyPoint}
        handleAddKeyPoint={handleAddKeyPoint}
        handleRemoveKeyPoint={handleRemoveKeyPoint}
        handleCreatePrecedent={handleCreatePrecedent}
        resetNewPrecedent={resetNewPrecedent}
        tags={tags}
      />
      
      <ViewPrecedentDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        currentPrecedent={currentPrecedent}
        handleAnalyzePrecedent={handleAnalyzePrecedent}
      />
      
      <AnalysisPrecedentDialog
        isOpen={isAnalysisDialogOpen}
        onOpenChange={setIsAnalysisDialogOpen}
        currentPrecedent={currentPrecedent}
        isAnalyzing={isAnalyzing}
        analysisResult={analysisResult}
      />
    </TooltipProvider>
  );
};

export default PrecedentManagementPage;
