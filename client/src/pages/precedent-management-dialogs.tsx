import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, BookOpen, FileText, Bookmark, ExternalLink, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Precedent, PrecedentCreateRequest } from '@/types';

interface CreatePrecedentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newPrecedent: PrecedentCreateRequest;
  setNewPrecedent: React.Dispatch<React.SetStateAction<PrecedentCreateRequest>>;
  newKeyPoint: string;
  setNewKeyPoint: React.Dispatch<React.SetStateAction<string>>;
  handleAddKeyPoint: () => void;
  handleRemoveKeyPoint: (index: number) => void;
  handleCreatePrecedent: () => void;
  resetNewPrecedent: () => void;
  tags: string[] | undefined;
}

export const CreatePrecedentDialog: React.FC<CreatePrecedentDialogProps> = ({
  isOpen,
  onOpenChange,
  newPrecedent,
  setNewPrecedent,
  newKeyPoint,
  setNewKeyPoint,
  handleAddKeyPoint,
  handleRemoveKeyPoint,
  handleCreatePrecedent,
  resetNewPrecedent,
  tags
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Precedent</DialogTitle>
          <DialogDescription>
            Add a new legal precedent to the library. Fill in all required fields.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="precedent-title">Title</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter a descriptive title for the precedent</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="precedent-title"
                value={newPrecedent.title}
                onChange={(e) => setNewPrecedent({...newPrecedent, title: e.target.value})}
                placeholder="e.g., Smith v. Jones (2023)"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="precedent-citation">Citation</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the legal citation for the precedent</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="precedent-citation"
                  value={newPrecedent.citation}
                  onChange={(e) => setNewPrecedent({...newPrecedent, citation: e.target.value})}
                  placeholder="e.g., 2023 ONSC 123"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="precedent-date">Date</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the date of the precedent</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="precedent-date"
                  type="date"
                  value={newPrecedent.date}
                  onChange={(e) => setNewPrecedent({...newPrecedent, date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="precedent-court">Court</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the court that issued the precedent</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="precedent-court"
                value={newPrecedent.court || ''}
                onChange={(e) => setNewPrecedent({...newPrecedent, court: e.target.value})}
                placeholder="e.g., Ontario Superior Court of Justice"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="precedent-url">URL</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter a URL to the full text of the precedent (optional)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="precedent-url"
                value={newPrecedent.url || ''}
                onChange={(e) => setNewPrecedent({...newPrecedent, url: e.target.value})}
                placeholder="e.g., https://canlii.ca/example"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="precedent-document-type">Document Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the type of legal document</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={newPrecedent.document_type}
                onValueChange={(value) => setNewPrecedent({...newPrecedent, document_type: value})}
              >
                <SelectTrigger id="precedent-document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="case">Case Law</SelectItem>
                  <SelectItem value="statute">Statute</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Label>Practice Areas</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select all legal practice areas where this precedent applies</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['general', 'corporate', 'commercial', 'real_estate', 'litigation', 'employment'].map((area: string) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`practice-${area}`}
                      checked={newPrecedent.practice_areas.includes(area)}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        if (checked === true) {
                          setNewPrecedent({...newPrecedent, practice_areas: [...newPrecedent.practice_areas, area]});
                        } else {
                          setNewPrecedent({...newPrecedent, practice_areas: newPrecedent.practice_areas.filter(a => a !== area)});
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
                    <p>Select all Canadian jurisdictions where this precedent is applicable</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['ontario', 'british_columbia', 'alberta', 'quebec', 'federal'].map((j: string) => (
                  <div key={j} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`jurisdiction-${j}`}
                      checked={newPrecedent.jurisdictions.includes(j)}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        if (checked === true) {
                          setNewPrecedent({...newPrecedent, jurisdictions: [...newPrecedent.jurisdictions, j]});
                        } else {
                          setNewPrecedent({...newPrecedent, jurisdictions: newPrecedent.jurisdictions.filter(jur => jur !== j)});
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
                    <p>Select relevant tags to categorize and make the precedent easier to find</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                {tags?.map((tag: string, index: number) => (
                  <Badge 
                    key={`${tag}-${index}`} 
                    variant={newPrecedent.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (newPrecedent.tags.includes(tag)) {
                        setNewPrecedent({...newPrecedent, tags: newPrecedent.tags.filter(t => t !== tag)});
                      } else {
                        setNewPrecedent({...newPrecedent, tags: [...newPrecedent.tags, tag]});
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="precedent-summary">Summary</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Provide a concise summary of the precedent</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="precedent-summary"
                value={newPrecedent.summary}
                onChange={(e) => setNewPrecedent({...newPrecedent, summary: e.target.value})}
                placeholder="e.g., The court held that the confidentiality clause in the employment contract was enforceable..."
                className="min-h-[100px]"
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Label>Key Points</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add the main legal principles or findings from this precedent</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newKeyPoint}
                  onChange={(e) => setNewKeyPoint(e.target.value)}
                  placeholder="Add a key point..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newKeyPoint.trim()) {
                      e.preventDefault();
                      handleAddKeyPoint();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddKeyPoint} disabled={!newKeyPoint.trim()}>
                  Add
                </Button>
              </div>
              
              {newPrecedent.key_points.length > 0 && (
                <div className="border rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">Added Key Points:</h4>
                  <div className="space-y-2">
                    {newPrecedent.key_points.map((point, index) => (
                      <div key={index} className="flex justify-between items-center bg-muted p-2 rounded-md">
                        <div className="text-sm">{point}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveKeyPoint(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            resetNewPrecedent();
          }}>
            Cancel
          </Button>
          <Button onClick={handleCreatePrecedent} disabled={!newPrecedent.title || !newPrecedent.summary || newPrecedent.key_points.length === 0}>
            Create Precedent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ViewPrecedentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrecedent: Precedent | null;
  handleAnalyzePrecedent: (precedentId: string) => void;
}

export const ViewPrecedentDialog: React.FC<ViewPrecedentDialogProps> = ({
  isOpen,
  onOpenChange,
  currentPrecedent,
  handleAnalyzePrecedent
}) => {
  if (!currentPrecedent) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {currentPrecedent.document_type === 'case' && <BookOpen className="h-5 w-5 text-primary" />}
            {currentPrecedent.document_type === 'statute' && <FileText className="h-5 w-5 text-primary" />}
            {currentPrecedent.document_type === 'template' && <Bookmark className="h-5 w-5 text-primary" />}
            <DialogTitle>{currentPrecedent.title}</DialogTitle>
          </div>
          <DialogDescription>{currentPrecedent.citation}</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Summary:</h3>
              <p className="mt-1 text-sm">{currentPrecedent.summary}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Key Points:</h3>
              <ul className="mt-1 space-y-1">
                {currentPrecedent.key_points.map((point, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {currentPrecedent.court && (
              <div>
                <h3 className="text-sm font-medium">Court:</h3>
                <p className="mt-1 text-sm">{currentPrecedent.court}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium">Date:</h3>
              <p className="mt-1 text-sm">{currentPrecedent.date}</p>
            </div>
            
            {currentPrecedent.url && (
              <div>
                <h3 className="text-sm font-medium">Source:</h3>
                <a 
                  href={currentPrecedent.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View original document <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Practice Areas:</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentPrecedent.practice_areas.map((area) => (
                  <Badge key={area} variant="secondary">{area}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Jurisdictions:</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentPrecedent.jurisdictions.map((j) => (
                  <Badge key={j} variant="secondary">{j}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Tags:</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentPrecedent.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Document Type:</h3>
              <p className="mt-1 text-sm capitalize">{currentPrecedent.document_type}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Added:</h3>
              <p className="mt-1 text-sm">{currentPrecedent.added_date} by {currentPrecedent.added_by}</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => {
            onOpenChange(false);
            handleAnalyzePrecedent(currentPrecedent.id);
          }}>
            Analyze with AI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface AnalysisPrecedentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrecedent: Precedent | null;
  isAnalyzing: boolean;
  analysisResult: string;
}

export const AnalysisPrecedentDialog: React.FC<AnalysisPrecedentDialogProps> = ({
  isOpen,
  onOpenChange,
  currentPrecedent,
  isAnalyzing,
  analysisResult
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Analysis</DialogTitle>
          <DialogDescription>
            {currentPrecedent ? currentPrecedent.title : 'Precedent'} Analysis
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing precedent...</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="p-6 bg-muted rounded-md">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {analysisResult ? (
                    <div dangerouslySetInnerHTML={{ 
                      __html: analysisResult
                        .replace(/\n/g, '<br>')
                        .replace(/## (.+)/g, '<h2>$1</h2>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  ) : (
                    <p className="text-muted-foreground">No analysis available</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
