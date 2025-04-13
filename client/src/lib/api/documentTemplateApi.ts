import { apiRequest } from '../api';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreateRequest {
  name: string;
  description: string;
  category: string;
  content: string;
  variables?: string[];
}

export interface TemplateUpdateRequest {
  name?: string;
  description?: string;
  category?: string;
  content?: string;
  variables?: string[];
}

export interface DocumentGenerationRequest {
  variables: Record<string, string>;
}

export interface GeneratedDocument {
  template_id: string;
  template_name: string;
  content: string;
  variables_used: Record<string, string>;
  generated_at: string;
}

export interface TemplateAnalysis {
  template_id: string;
  template_name: string;
  word_count: number;
  section_count: number;
  variable_count: number;
  variables: string[];
  ai_analysis?: string;
}

// Get all templates or filter by category
export const getTemplates = async (category?: string) => {
  const endpoint = category 
    ? `/document-templates/templates?category=${encodeURIComponent(category)}`
    : '/document-templates/templates';
  return apiRequest<Template[]>(endpoint, { method: 'GET' });
};

// Get a specific template by ID
export const getTemplate = async (templateId: string) => {
  return apiRequest<Template>(`/document-templates/templates/${templateId}`, { method: 'GET' });
};

// Create a new template
export const createTemplate = async (template: TemplateCreateRequest) => {
  return apiRequest<Template>('/document-templates/templates', {
    method: 'POST',
    data: template,
  });
};

// Update an existing template
export const updateTemplate = async (templateId: string, update: TemplateUpdateRequest) => {
  return apiRequest<Template>(`/document-templates/templates/${templateId}`, {
    method: 'PUT',
    data: update,
  });
};

// Delete a template
export const deleteTemplate = async (templateId: string) => {
  return apiRequest<{ success: boolean; deleted_template: Template }>(`/document-templates/templates/${templateId}`, {
    method: 'DELETE',
  });
};

// Get all template categories
export const getTemplateCategories = async () => {
  return apiRequest<string[]>('/document-templates/template-categories', { method: 'GET' });
};

// Generate a document from a template with provided variables
export const generateDocument = async (templateId: string, request: DocumentGenerationRequest) => {
  return apiRequest<GeneratedDocument>(`/document-templates/templates/${templateId}/generate`, {
    method: 'POST',
    data: request,
  });
};

// Analyze a template for structure, variables, and suggestions
export const analyzeTemplate = async (templateId: string) => {
  return apiRequest<TemplateAnalysis>(`/document-templates/templates/${templateId}/analyze`, {
    method: 'GET',
  });
};
