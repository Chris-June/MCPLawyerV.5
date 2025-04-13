import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Download, Copy, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTemplate, generateDocument, DocumentGenerationRequest, GeneratedDocument } from '@/lib/api/documentTemplateApi';
import { Skeleton } from '../components/ui/skeleton';
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay';

// Markdown rendering
import ReactMarkdown from 'react-markdown';

export default function DocumentGenerationPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);

  // Fetch template details
  const { data: template, isLoading: templateLoading, error: templateError } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplate(templateId!),
    enabled: !!templateId,
  });

  // Initialize variable values when template loads
  useEffect(() => {
    if (template && template.variables) {
      const initialValues: Record<string, string> = {};
      template.variables.forEach((variable: string) => {
        initialValues[variable] = '';
      });
      setVariableValues(initialValues);
    }
  }, [template]);

  // Generate document mutation
  const generateDocumentMutation = useMutation({
    mutationFn: ({ templateId, request }: { templateId: string; request: DocumentGenerationRequest }) =>
      generateDocument(templateId, request),
    onSuccess: (data) => {
      setGeneratedDocument(data);
      toast({
        title: 'Document Generated',
        description: 'Your document has been generated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Handle variable input changes
  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  // Handle document generation
  const handleGenerateDocument = () => {
    if (!templateId) return;

    // Check if all variables have values
    const missingVariables = template?.variables.filter((v: string) => !variableValues[v]);
    if (missingVariables && missingVariables.length > 0) {
      toast({
        title: 'Missing Variables',
        description: `Please fill in all variables before generating: ${missingVariables.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    const request: DocumentGenerationRequest = {
      variables: variableValues,
    };

    generateDocumentMutation.mutate({ templateId, request });
  };

  // Copy generated document to clipboard
  const handleCopyToClipboard = () => {
    if (generatedDocument) {
      navigator.clipboard.writeText(generatedDocument.content);
      toast({
        title: 'Copied to Clipboard',
        description: 'Document content has been copied to clipboard',
      });
    }
  };

  // Download document as markdown file
  const handleDownload = () => {
    if (generatedDocument) {
      const blob = new Blob([generatedDocument.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedDocument.template_name.replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Handle errors
  if (templateError) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load template. The template may have been deleted or you may not have access.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 relative">
      <AIProcessingOverlay
        isProcessing={templateLoading || generateDocumentMutation.isPending}
        theme="document"
        title={generateDocumentMutation.isPending ? 'Generating Document' : 'Loading Template'}
        message={generateDocumentMutation.isPending ? 'Our AI is generating your document based on the provided variables...' : 'Loading template details...'}
        modelName="GPT-4o-mini"
      />
      
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate('/templates')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {templateLoading ? <Skeleton className="h-9 w-64" /> : `Generate: ${template?.name}`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {templateLoading ? (
              <Skeleton className="h-5 w-96" />
            ) : (
              template?.description || 'Fill in the variables to generate your document'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variables Form */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Document Variables
            </CardTitle>
            <CardDescription>
              Fill in the variables below to customize your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templateLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : template?.variables && template.variables.length > 0 ? (
              <div className="space-y-4">
                {template.variables.map((variable: string) => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={variable}>{variable.replace(/_/g, ' ').replace(/^\w|\s\w/g, (c: string) => c.toUpperCase())}</Label>
                    <Input
                      id={variable}
                      value={variableValues[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">This template has no variables to fill.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateDocument}
              disabled={templateLoading || generateDocumentMutation.isPending}
              className="w-full"
            >
              {generateDocumentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                'Generate Document'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Document Preview */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Document Preview</span>
              {generatedDocument && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyToClipboard}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              {generatedDocument
                ? `Generated on ${new Date(generatedDocument.generated_at).toLocaleString()}`
                : 'Your generated document will appear here'}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0">
            <Tabs defaultValue="preview" className="h-full flex flex-col">
              <TabsList className="mx-6 mt-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
              </TabsList>
              <div className="flex-1 p-6">
                <TabsContent value="preview" className="h-full mt-0 p-0">
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                    {!generatedDocument ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No Document Generated Yet</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                          Fill in the variables and click "Generate Document" to see the preview here.
                        </p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="prose dark:prose-invert max-w-none"
                      >
                        <ReactMarkdown>{generatedDocument.content}</ReactMarkdown>
                      </motion.div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="markdown" className="h-full mt-0 p-0">
                  <ScrollArea className="h-[500px] w-full rounded-md border">
                    {!generatedDocument ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No Document Generated Yet</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                          Fill in the variables and click "Generate Document" to see the markdown content here.
                        </p>
                      </div>
                    ) : (
                      <motion.pre
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="p-4 text-sm font-mono overflow-auto"
                      >
                        {generatedDocument.content}
                      </motion.pre>
                    )}
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
