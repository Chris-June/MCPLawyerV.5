import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, Edit, Trash2, Search, Filter, Lightbulb, FileOutput } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { AIProcessingOverlay } from '@/components/ui/ai-processing-overlay';
import { getTemplateCategories, getTemplates, createTemplate, deleteTemplate, TemplateCreateRequest, Template } from '@/lib/api/documentTemplateApi';

export default function DocumentTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<TemplateCreateRequest>({
    name: '',
    description: '',
    category: '',
    content: '',
    variables: [],
  });

  // Fetch template categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['templateCategories'],
    queryFn: () => getTemplateCategories(),
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', categoryFilter],
    queryFn: () => getTemplates(categoryFilter || undefined),
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsCreateDialogOpen(false);
      setNewTemplate({
        name: '',
        description: '',
        category: '',
        content: '',
        variables: [],
      });
      toast({
        title: 'Template Created',
        description: 'Your document template has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: 'Template Deleted',
        description: 'The document template has been deleted',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Filter templates based on search term
  const filteredTemplates = templates.filter((template) => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle template form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTemplate({ ...newTemplate, [name]: value });
  };

  // Handle template category selection
  const handleCategorySelect = (value: string) => {
    setNewTemplate({ ...newTemplate, category: value });
  };

  // Handle variables input (comma-separated list)
  const handleVariablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const variablesString = e.target.value;
    const variablesArray = variablesString.split(',').map(v => v.trim()).filter(v => v !== '');
    setNewTemplate({ ...newTemplate, variables: variablesArray });
  };

  // Handle template creation
  const handleCreateTemplate = () => {
    createTemplateMutation.mutate(newTemplate);
  };

  return (
    <div className="container py-8 relative">
      <AIProcessingOverlay
        isProcessing={templatesLoading || categoriesLoading || createTemplateMutation.isPending || deleteTemplateMutation.isPending}
        theme="document"
        title={createTemplateMutation.isPending ? 'Creating Template' : deleteTemplateMutation.isPending ? 'Deleting Template' : 'Loading Templates'}
        message={createTemplateMutation.isPending ? 'Creating your new document template...' : deleteTemplateMutation.isPending ? 'Removing the selected template...' : 'Loading document templates...'}
        modelName="GPT-4o-mini"
      />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and generate documents from customizable templates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex gap-2">
              <PlusCircle className="h-4 w-4" /> Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Create New Document Template</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new document template.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newTemplate.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Retainer Agreement"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select onValueChange={handleCategorySelect} value={newTemplate.category}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading">
                        Loading categories...
                      </SelectItem>
                    ) : (
                      categories.map((category: string) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={newTemplate.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Standard client retainer agreement for litigation matters"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="variables" className="text-right">
                  Variables
                </Label>
                <Input
                  id="variables"
                  name="variables"
                  value={newTemplate.variables?.join(', ') || ''}
                  onChange={handleVariablesChange}
                  className="col-span-3"
                  placeholder="client_name, matter_type, hourly_rate"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2">
                  Content
                </Label>
                <Textarea
                  id="content"
                  name="content"
                  value={newTemplate.content}
                  onChange={handleInputChange}
                  className="col-span-3 min-h-[200px]"
                  placeholder="# Document Title\n\nThis agreement is made between {{client_name}} and our law firm..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-6">
        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category: string) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex justify-end mb-4">
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="w-full">
            {templatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Card key={n} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3" />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">No templates found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {searchTerm || categoryFilter
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating your first document template'}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Create Template
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template: Template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate">{template.name}</span>
                          <Badge variant="outline">{template.category}</Badge>
                        </CardTitle>
                        <CardDescription className="truncate">{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="text-sm text-muted-foreground mb-3">
                          <span className="font-medium">Variables:</span>{' '}
                          {template.variables.length > 0 ? (
                            <span>{template.variables.join(', ')}</span>
                          ) : (
                            <span className="italic">None</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Last updated:</span>{' '}
                          {new Date(template.updated_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/templates/${template.id}/analyze`)}
                          >
                            <Lightbulb className="h-4 w-4 mr-1" /> Analyze
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/templates/${template.id}/generate`)}
                          >
                            <FileOutput className="h-4 w-4 mr-1" /> Generate
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="w-full">
            {templatesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <Card key={n}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-[100px]" />
                        <Skeleton className="h-9 w-[100px]" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">No templates found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  {searchTerm || categoryFilter
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by creating your first document template'}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Create Template
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTemplates.map((template: Template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold truncate">{template.name}</h3>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{template.description}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">Variables:</span>{' '}
                            {template.variables.length > 0 ? (
                              <span>{template.variables.join(', ')}</span>
                            ) : (
                              <span className="italic">None</span>
                            )}
                            <span className="mx-2">•</span>
                            <span className="font-medium">Last updated:</span>{' '}
                            {new Date(template.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/templates/${template.id}/analyze`)}
                          >
                            <Lightbulb className="h-4 w-4 mr-1" /> Analyze
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/templates/${template.id}/generate`)}
                          >
                            <FileOutput className="h-4 w-4 mr-1" /> Generate
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
