export interface Clause {
  id: string;
  name: string;
  description: string;
  content: string;
  practice_areas: string[];
  jurisdictions: string[];
  tags: string[];
  version: string;
  last_updated: string;
  author: string;
}

export interface ClauseCategory {
  id: string;
  name: string;
  description: string;
}

export interface ClauseCreateRequest {
  name: string;
  description: string;
  content: string;
  practice_areas: string[];
  jurisdictions: string[];
  tags: string[];
}

export interface ClauseUpdateRequest {
  name?: string;
  description?: string;
  content?: string;
  practice_areas?: string[];
  jurisdictions?: string[];
  tags?: string[];
}

export interface ClauseGenerateRequest {
  clause_type: string;
  jurisdiction: string;
  parameters: Record<string, any>;
}

export interface GeneratedClause {
  name: string;
  content: string;
  explanation: string;
}
