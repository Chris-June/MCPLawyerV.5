import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Info, BarChart, Lightbulb, FileCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTemplate, analyzeTemplate } from '@/lib/api/documentTemplateApi';
import { Skeleton } from '../components/ui/skeleton';

// Markdown rendering
import ReactMarkdown from 'react-markdown';

export default function TemplateAnalysisPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  // Fetch template details
  const { data: template, isLoading: templateLoading, error: templateError } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => getTemplate(templateId!),
    enabled: !!templateId,
  });

  // Fetch template analysis
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = useQuery({
    queryKey: ['templateAnalysis', templateId],
    queryFn: () => analyzeTemplate(templateId!),
    enabled: !!templateId,
  });

  // Handle errors
  if (templateError || analysisError) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load template or analysis. The template may have been deleted or you may not have access.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate('/templates')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {templateLoading ? <Skeleton className="h-9 w-64" /> : `Template Analysis: ${template?.name}`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {templateLoading ? (
              <Skeleton className="h-5 w-96" />
            ) : (
              template?.description || 'AI-powered analysis of your document template'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" /> Template Information
            </CardTitle>
            <CardDescription>Details about this document template</CardDescription>
          </CardHeader>
          <CardContent>
            {templateLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n}>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            ) : template ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-muted-foreground">{template.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-muted-foreground">{template.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-muted-foreground">{template.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-muted-foreground">{new Date(template.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-muted-foreground">{new Date(template.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Variables</p>
                  {template.variables && template.variables.length > 0 ? (
                    <ul className="text-muted-foreground pl-5 list-disc">
                      {template.variables.map((variable: string) => (
                        <li key={variable}>{variable}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No variables defined</p>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" /> Analysis Results
            </CardTitle>
            <CardDescription>AI-powered insights for document improvement</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {analysisLoading ? (
              <div className="space-y-6">
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="border rounded-lg p-4">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Skeleton className="h-5 w-40 mb-4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ) : analysis ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                      icon={<FileText className="h-5 w-5" />}
                      title="Word Count" 
                      value={analysis.word_count.toString()} 
                    />
                    <StatCard 
                      icon={<FileCode className="h-5 w-5" />}
                      title="Variables" 
                      value={analysis.variable_count.toString()} 
                    />
                    <StatCard 
                      icon={<FileText className="h-5 w-5" />}
                      title="Sections" 
                      value={analysis.section_count.toString()} 
                    />
                  </div>
                </div>

                {analysis.ai_analysis && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-medium">AI Analysis</h3>
                      <Badge variant="secondary" className="ml-2">
                        <Lightbulb className="h-3 w-3 mr-1" /> GPT 4o-mini
                      </Badge>
                    </div>
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{analysis.ai_analysis}</ReactMarkdown>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => navigate('/templates')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Templates
        </Button>
        {template && (
          <Button onClick={() => navigate(`/templates/${templateId}/generate`)}>
            <FileText className="h-4 w-4 mr-2" /> Generate Document
          </Button>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => (
  <div className="border rounded-lg p-4">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      {icon}
      <span className="text-sm font-medium">{title}</span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);
