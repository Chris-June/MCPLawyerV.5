import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, HelpCircle } from 'lucide-react';
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay';
import { clauseLibraryApi } from '@/lib/api/clauseLibraryApi';
import { ClauseGenerateRequest, GeneratedClause } from '@/types/clauseLibrary';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClauseGeneratorProps {
  onSaveClause?: (clause: {
    name: string;
    description: string;
    content: string;
    practice_areas: string[];
    jurisdictions: string[];
    tags: string[];
  }) => void;
}

const ClauseGenerator: React.FC<ClauseGeneratorProps> = ({ onSaveClause }) => {
  const { toast } = useToast();
  
  const [clauseType, setClauseType] = useState<string>('');
  const [jurisdiction, setJurisdiction] = useState<string>('ontario');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [parameterKey, setParameterKey] = useState<string>('');
  const [parameterValue, setParameterValue] = useState<string>('');
  const [generatedClause, setGeneratedClause] = useState<GeneratedClause | null>(null);
  const [activeTab, setActiveTab] = useState<string>('generate');
  
  // Custom clause types
  const clauseTypes = [
    { id: 'confidentiality', name: 'Confidentiality' },
    { id: 'dispute_resolution', name: 'Dispute Resolution' },
    { id: 'force_majeure', name: 'Force Majeure' },
    { id: 'governing_law', name: 'Governing Law' },
    { id: 'indemnification', name: 'Indemnification' },
    { id: 'intellectual_property', name: 'Intellectual Property' },
    { id: 'non_compete', name: 'Non-Compete' },
    { id: 'non_solicitation', name: 'Non-Solicitation' },
    { id: 'payment_terms', name: 'Payment Terms' },
    { id: 'severability', name: 'Severability' },
    { id: 'termination', name: 'Termination' },
    { id: 'warranties', name: 'Warranties' },
  ];
  
  // Canadian jurisdictions
  const jurisdictions = [
    { id: 'alberta', name: 'Alberta' },
    { id: 'british_columbia', name: 'British Columbia' },
    { id: 'manitoba', name: 'Manitoba' },
    { id: 'new_brunswick', name: 'New Brunswick' },
    { id: 'newfoundland_and_labrador', name: 'Newfoundland and Labrador' },
    { id: 'nova_scotia', name: 'Nova Scotia' },
    { id: 'ontario', name: 'Ontario' },
    { id: 'prince_edward_island', name: 'Prince Edward Island' },
    { id: 'quebec', name: 'Quebec' },
    { id: 'saskatchewan', name: 'Saskatchewan' },
    { id: 'northwest_territories', name: 'Northwest Territories' },
    { id: 'nunavut', name: 'Nunavut' },
    { id: 'yukon', name: 'Yukon' },
    { id: 'federal', name: 'Federal' },
  ];
  
  // Generate clause mutation
  const generateClauseMutation = useMutation({
    mutationFn: clauseLibraryApi.generateClause,
    onSuccess: (data) => {
      setGeneratedClause(data);
      setActiveTab('result'); // Switch to result tab when clause is generated
      toast({
        title: 'Clause Generated',
        description: 'AI has generated a new clause based on your parameters',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate clause: ${error}`,
        variant: 'destructive',
      });
    },
  });
  
  // Effect to log the generated clause for debugging
  useEffect(() => {
    if (generatedClause) {
      console.log('Generated clause:', generatedClause);
    }
  }, [generatedClause]);
  
  const handleAddParameter = () => {
    if (parameterKey.trim() && parameterValue.trim()) {
      setParameters(prev => ({
        ...prev,
        [parameterKey.trim()]: parameterValue.trim(),
      }));
      setParameterKey('');
      setParameterValue('');
    }
  };
  
  const handleRemoveParameter = (key: string) => {
    const newParameters = { ...parameters };
    delete newParameters[key];
    setParameters(newParameters);
  };
  
  const handleGenerateClause = () => {
    if (!clauseType) {
      toast({
        title: 'Missing Information',
        description: 'Please select a clause type',
        variant: 'destructive',
      });
      return;
    }
    
    const request: ClauseGenerateRequest = {
      clause_type: clauseType,
      jurisdiction,
      parameters,
    };
    
    generateClauseMutation.mutate(request);
  };
  
  const handleSaveToLibrary = () => {
    if (!generatedClause) return;
    
    // Determine practice areas based on clause type
    let practiceAreas: string[] = [];
    
    switch (clauseType) {
      case 'confidentiality':
      case 'intellectual_property':
        practiceAreas = ['corporate', 'commercial', 'technology'];
        break;
      case 'indemnification':
      case 'limitation_of_liability':
        practiceAreas = ['corporate', 'commercial', 'litigation'];
        break;
      case 'termination':
      case 'payment_terms':
        practiceAreas = ['corporate', 'commercial', 'employment'];
        break;
      case 'governing_law':
        practiceAreas = ['corporate', 'commercial', 'litigation', 'general'];
        break;
      case 'non_compete':
      case 'non_solicitation':
        practiceAreas = ['employment', 'corporate', 'technology'];
        break;
      case 'force_majeure':
        practiceAreas = ['commercial', 'real_estate', 'environmental'];
        break;
      case 'dispute_resolution':
        practiceAreas = ['litigation', 'commercial', 'employment'];
        break;
      case 'warranties':
        practiceAreas = ['corporate', 'commercial', 'technology'];
        break;
      default:
        practiceAreas = ['general'];
    }
    
   // Determine tags based on clause type
const tags = [clauseType.replace('_', ' ')];

switch (clauseType) {
  case 'confidentiality':
    tags.push('privacy', 'nda');
    break;
  case 'dispute_resolution':
    tags.push('arbitration', 'mediation', 'litigation');
    break;
  case 'force_majeure':
    tags.push('unforeseen events', 'contract suspension');
    break;
  case 'governing_law':
    tags.push('jurisdiction', 'choice of law');
    break;
  case 'indemnification':
    tags.push('liability', 'compensation');
    break;
  case 'intellectual_property':
    tags.push('copyright', 'trademark', 'ownership');
    break;
  case 'non_compete':
    tags.push('employment', 'restraint of trade');
    break;
  case 'non_solicitation':
    tags.push('client protection', 'employment');
    break;
  case 'payment_terms':
    tags.push('invoicing', 'due dates', 'billing');
    break;
  case 'severability':
    tags.push('contract enforcement', 'clause independence');
    break;
  case 'termination':
    tags.push('ending agreement', 'notice period');
    break;
  case 'warranties':
    tags.push('guarantees', 'product assurance');
    break;
  default:
    tags.push('general');
}
    
    const newClause = {
      name: generatedClause.name,
      description: `AI-generated ${clauseType.replace('_', ' ')} clause for ${jurisdiction}`,
      content: generatedClause.content,
      practice_areas: practiceAreas,
      jurisdictions: [jurisdiction],
      tags,
    };
    
    if (onSaveClause) {
      onSaveClause(newClause);
    } else {
      // If no save handler is provided, copy to clipboard
      navigator.clipboard.writeText(generatedClause.content);
      toast({
        title: 'Copied to Clipboard',
        description: 'The generated clause has been copied to your clipboard',
      });
    }
  };
  
  return (
    <TooltipProvider>
    <Card className="w-full relative">
      <AIProcessingOverlay
        isProcessing={generateClauseMutation.isPending}
        theme="legal"
        title="Generating Legal Clause"
        message="Our AI is generating a custom legal clause based on your specifications..."
        modelName="gpt-4.1-nano"
      />
      <CardHeader>
        <CardTitle>AI Clause Generator</CardTitle>
        <CardDescription>
          Generate custom legal clauses tailored to your specific requirements and jurisdiction
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Clause</TabsTrigger>
            <TabsTrigger value="result" disabled={!generatedClause}>Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="clause-type">Clause Type</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the type of legal clause you want to generate</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={clauseType}
                  onValueChange={setClauseType}
                >
                  <SelectTrigger id="clause-type">
                    <SelectValue placeholder="Select clause type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clauseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
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
                      <p>Select the Canadian jurisdiction where this clause will be applied</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={jurisdiction}
                  onValueChange={setJurisdiction}
                >
                  <SelectTrigger id="jurisdiction">
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map((j) => (
                      <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label>Custom Parameters</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add specific variables to tailor the clause to your needs</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Add specific details to customize your clause (e.g., party names, specific terms)
                </p>
                
                <div className="flex space-x-2 mb-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Parameter name"
                      value={parameterKey}
                      onChange={(e) => setParameterKey(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Parameter value"
                      value={parameterValue}
                      onChange={(e) => setParameterValue(e.target.value)}
                    />
                  </div>
                  <Button type="button" onClick={handleAddParameter} variant="secondary">
                    Add
                  </Button>
                </div>
                
                {Object.keys(parameters).length > 0 && (
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm font-medium mb-2">Added Parameters:</h4>
                    <div className="space-y-2">
                      {Object.entries(parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center bg-muted p-2 rounded-md">
                          <div>
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveParameter(key)}
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
          </TabsContent>
          
          <TabsContent value="result" className="space-y-4">
            {generatedClause && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Generated Clause: {generatedClause.name}</Label>
                  <div className="mt-2 p-4 bg-muted rounded-md">
                    <ScrollArea className="h-[300px]">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h3>Parameters Used:</h3>
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md mb-4">
                          {Object.keys(parameters).length > 0 ? (
                            <ul className="list-disc pl-5">
                              {Object.entries(parameters).map(([key, value]) => (
                                <li key={key} className="text-sm">
                                  <span className="font-semibold">{key}:</span> {value}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">No custom parameters were specified.</p>
                          )}
                        </div>
                        
                        <h3>Content:</h3>
                        <pre className="text-sm whitespace-pre-wrap bg-slate-800 text-slate-100 p-4 rounded-md overflow-auto">{generatedClause.content}</pre>
                        
                        <h3 className="mt-4">Explanation:</h3>
                        <p>{generatedClause.explanation}</p>
                        
                        <h3 className="mt-4">Raw JSON:</h3>
                        <pre className="text-sm whitespace-pre-wrap bg-slate-800 text-slate-100 p-4 rounded-md overflow-auto">
{JSON.stringify({
  name: generatedClause.name,
  content: generatedClause.content,
  explanation: generatedClause.explanation
}, null, 2)}
                        </pre>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setClauseType('');
            setParameters({});
            setGeneratedClause(null);
            setActiveTab('generate');
          }}
        >
          Reset
        </Button>
        
        {generatedClause ? (
          <Button onClick={handleSaveToLibrary}>
            Save to Library
          </Button>
        ) : (
          <Button 
            onClick={handleGenerateClause} 
            disabled={!clauseType || generateClauseMutation.isPending}
          >
            {generateClauseMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Clause'
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
    </TooltipProvider>
  );
};

export default ClauseGenerator;
