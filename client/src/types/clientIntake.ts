import { z } from 'zod';
import { type } from 'os';

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  NUMBER = 'number',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file'
}

export interface ValidationRule {
  type: string;
  value?: any;
  message: string;
}

export interface ConditionalLogic {
  field: string;
  operator: string;
  value: any;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: Array<{ label: string; value: string }>;
  validationRules?: ValidationRule[];
  conditionalLogic?: ConditionalLogic;
  defaultValue?: any;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  conditionalLogic?: ConditionalLogic;
}

export interface IntakeForm {
  id: string;
  practiceArea: string;
  title: string;
  description?: string;
  sections: FormSection[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeFormSubmission {
  formId: string;
  clientId?: string;
  data: Record<string, any>;
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CaseAssessment {
  strengths: string[];
  weaknesses: string[];
  legalIssues: string[];
  recommendedActions: string[];
  riskAssessment: string;
  estimatedTimeframe?: string;
  estimatedCosts?: Record<string, any>;
  additionalNotes?: string;
}

export interface AIInterviewQuestion {
  id: string;
  question: string;
  intent: string;
  followUpQuestions?: string[];
  relatedTopics?: string[];
}

export interface AIInterviewResponse {
  questionId: string;
  response: string;
  sentimentAnalysis?: Record<string, any>;
  extractedEntities?: Record<string, any>;
  nextQuestions?: AIInterviewQuestion[];
}

export interface AIInterviewSession {
  sessionId: string;
  clientId?: string;
  practiceArea: string;
  caseType?: string;
  questions: AIInterviewQuestion[];
  responses: AIInterviewResponse[];
  summary?: string;
  startedAt: string;
  lastUpdatedAt: string;
  isComplete: boolean;
  caseAssessment?: CaseAssessment;
}

// Zod schemas for validation
export const ValidationRuleSchema = z.object({
  type: z.string(),
  value: z.any().optional(),
  message: z.string()
});

export const ConditionalLogicSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.any()
});

export const FormFieldSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(FieldType),
  label: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  validationRules: z.array(ValidationRuleSchema).optional(),
  conditionalLogic: ConditionalLogicSchema.optional(),
  defaultValue: z.any().optional()
});

export const FormSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
  conditionalLogic: ConditionalLogicSchema.optional()
});

export const IntakeFormSchema = z.object({
  id: z.string(),
  practiceArea: z.string(),
  title: z.string(),
  description: z.string().optional(),
  sections: z.array(FormSectionSchema),
  version: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
