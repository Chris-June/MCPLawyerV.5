import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, HelpCircle } from 'lucide-react';
import { Clause } from '@/types/clauseLibrary';
import { clauseLibraryApi } from '@/lib/api/clauseLibraryApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ClauseLibraryPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Wrap the entire component with TooltipProvider
  
  // State for filters
  const [practiceArea, setPracticeArea] = useState<string>('');
  const [jurisdiction, setJurisdiction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // State for clause creation/editing
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentClause, setCurrentClause] = useState<Clause | null>(null);
  const [newClause, setNewClause] = useState({
    name: '',
    description: '',
    content: '',
    practice_areas: [] as string[],
    jurisdictions: [] as string[],
    tags: [] as string[],
  });
  
  // Queries
  const { data: clauses, isLoading: isLoadingClauses } = useQuery({
    queryKey: ['clauses', practiceArea, jurisdiction, searchTerm, selectedTags],
    queryFn: () => clauseLibraryApi.getClauses({
      practiceArea: practiceArea || undefined,
      jurisdiction: jurisdiction || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      searchTerm: searchTerm || undefined,
    }),
  });
  
  const { data: categories } = useQuery({
    queryKey: ['clauseCategories'],
    queryFn: clauseLibraryApi.getClauseCategories,
  });
  
  const { data: tags } = useQuery({
    queryKey: ['clauseTags'],
    queryFn: clauseLibraryApi.getClauseTags,
  });
  
  // Mutations
  const createClauseMutation = useMutation({
    mutationFn: clauseLibraryApi.createClause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] });
      setIsCreateDialogOpen(false);
      resetNewClause();
      toast({
        title: 'Success',
        description: 'Clause created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create clause: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  const deleteClauseMutation = useMutation({
    mutationFn: clauseLibraryApi.deleteClause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauses'] });
      toast({
        title: 'Success',
        description: 'Clause deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete clause: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Helper functions
  const resetNewClause = () => {
    setNewClause({
      name: '',
      description: '',
      content: '',
      practice_areas: [],
      jurisdictions: [],
      tags: [],
    });
  };
  
  const handleCreateClause = () => {
    createClauseMutation.mutate(newClause);
  };
  
  const handleDeleteClause = (clauseId: string) => {
    if (confirm('Are you sure you want to delete this clause?')) {
      deleteClauseMutation.mutate(clauseId);
    }
  };
  
  const handleViewClause = (clause: Clause) => {
    setCurrentClause(clause);
    setIsViewDialogOpen(true);
  };
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Clause copied to clipboard',
    });
  };
  
  return (
    <TooltipProvider>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clause Library</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Add New Clause</Button>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find clauses by practice area, jurisdiction, or keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="search">Search</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search for clauses by name, content, or description</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="E.g., confidentiality, termination, indemnity..."
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
                      <p>Filter clauses by legal practice area</p>
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
                  <SelectItem value="privacy">Privacy</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="wills_estates">Wills & Estates</SelectItem>
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
                      <p>Filter clauses by applicable legal jurisdiction in Canada</p>
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
              
              <div>
                <div className="flex items-center gap-2">
                  <Label>Tags</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter clauses by specific tags or categories</p>
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
        
        {/* Clauses List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoadingClauses ? (
            <p>Loading clauses...</p>
          ) : clauses?.length === 0 ? (
            <p>No clauses found. Try adjusting your filters or create a new clause.</p>
          ) : (
            clauses?.map((clause) => (
              <Card key={clause.id} className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>{clause.name}</CardTitle>
                  <CardDescription>{clause.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-2">
                    <p className="text-sm font-medium">Practice Areas:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clause.practice_areas.map((area) => (
                        <Badge key={area} variant="secondary">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium">Jurisdictions:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clause.jurisdictions.map((j) => (
                        <Badge key={j} variant="secondary">{j}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tags:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clause.tags.slice(0, 5).map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                      {clause.tags.length > 5 && (
                        <Badge variant="outline">+{clause.tags.length - 5} more</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    v{clause.version} • {clause.last_updated}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewClause(clause)}>View</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClause(clause.id)}>Delete</Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
        
        {/* Create Clause Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Clause</DialogTitle>
              <DialogDescription>
                Add a new clause to the library. Fill in all required fields.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="clause-name">Name</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter a descriptive name for the clause</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="clause-name"
                    value={newClause.name}
                    onChange={(e) => setNewClause({...newClause, name: e.target.value})}
                    placeholder="e.g., Standard Confidentiality Clause for NDAs"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="clause-description">Description</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Provide a short summary of the clause's purpose and usage</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="clause-description"
                    value={newClause.description}
                    onChange={(e) => setNewClause({...newClause, description: e.target.value})}
                    placeholder="e.g., Protects confidential information shared between parties"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Practice Areas</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select all legal practice areas where this clause applies</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['banking', 'commercial', 'corporate', 'criminal', 'employment', 'environmental', 'family', 'general', 'immigration', 'intellectual_property', 'litigation', 'privacy', 'real_estate', 'tax', 'technology', 'wills_estates'].map((area: string) => (
                      <div key={area} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`practice-${area}`}
                          checked={newClause.practice_areas.includes(area)}
                          onCheckedChange={(checked: boolean | 'indeterminate') => {
                            if (checked === true) {
                              setNewClause({...newClause, practice_areas: [...newClause.practice_areas, area]});
                            } else {
                              setNewClause({...newClause, practice_areas: newClause.practice_areas.filter(a => a !== area)});
                            }
                          }}
                        />
                        <Label htmlFor={`practice-${area}`}>{area.replace('_', ' ')}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Jurisdictions</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select all Canadian jurisdictions where this clause is applicable</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    'alberta',
                    'british_columbia',
                    'manitoba',
                    'new_brunswick',
                    'newfoundland_and_labrador',
                    'nova_scotia',
                    'ontario',
                    'prince_edward_island',
                    'quebec',
                    'saskatchewan',
                    'northwest_territories',
                    'nunavut',
                    'yukon',
                    'federal'
                  ].map((j: string) => (
                      <div key={j} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`jurisdiction-${j}`}
                          checked={newClause.jurisdictions.includes(j)}
                          onCheckedChange={(checked: boolean | 'indeterminate') => {
                            if (checked === true) {
                              setNewClause({...newClause, jurisdictions: [...newClause.jurisdictions, j]});
                            } else {
                              setNewClause({...newClause, jurisdictions: newClause.jurisdictions.filter(jur => jur !== j)});
                            }
                          }}
                        />
                        <Label htmlFor={`jurisdiction-${j}`}>{j.replace('_', ' ')}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <Label>Tags</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select relevant tags to categorize and make the clause easier to find</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {tags?.map((tag: string, index: number) => (
                      <Badge 
                        key={`${tag}-${index}`} 
                        variant={newClause.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (newClause.tags.includes(tag)) {
                            setNewClause({...newClause, tags: newClause.tags.filter(t => t !== tag)});
                          } else {
                            setNewClause({...newClause, tags: [...newClause.tags, tag]});
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="clause-content">Content</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the complete legal text of the clause</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="clause-content"
                  value={newClause.content}
                  onChange={(e) => setNewClause({...newClause, content: e.target.value})}
                  placeholder="e.g., The parties agree that all information disclosed during the term of this Agreement shall be kept confidential and shall not be disclosed to any third party without prior written consent..."
                  className="min-h-[300px]"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                resetNewClause();
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateClause} disabled={!newClause.name || !newClause.content}>
                Create Clause
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* View Clause Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            {currentClause && (
              <>
                <DialogHeader>
                  <DialogTitle>{currentClause.name}</DialogTitle>
                  <DialogDescription>{currentClause.description}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Clause Content:</h3>
                    <div className="mt-2 p-4 bg-muted rounded-md">
                      <ScrollArea className="h-[200px]">
                        <pre className="text-sm whitespace-pre-wrap">{currentClause.content}</pre>
                      </ScrollArea>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Practice Areas:</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentClause.practice_areas.map((area) => (
                          <Badge key={area} variant="secondary">{area}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Jurisdictions:</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentClause.jurisdictions.map((j) => (
                          <Badge key={j} variant="secondary">{j}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Tags:</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentClause.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Version: {currentClause.version}</span>
                    <span>Last Updated: {currentClause.last_updated}</span>
                    <span>Author: {currentClause.author}</span>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => copyToClipboard(currentClause.content)}>
                    Copy to Clipboard
                  </Button>
                  <Button onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ClauseLibraryPage;
