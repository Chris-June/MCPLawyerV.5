export interface Precedent {
  id: string;
  title: string;
  citation: string;
  court: string;
  date: string;
  summary: string;
  key_points: string[];
  practice_areas: string[];
  jurisdictions: string[];
  tags: string[];
  url: string;
  document_type: string;
  added_date: string;
  added_by: string;
}

export interface PrecedentCategory {
  id: string;
  name: string;
  description: string;
}

export interface PrecedentCreateRequest {
  title: string;
  citation: string;
  court?: string;
  date: string;
  summary: string;
  key_points: string[];
  practice_areas: string[];
  jurisdictions: string[];
  tags: string[];
  url?: string;
  document_type: string;
}

export interface PrecedentUpdateRequest {
  title?: string;
  citation?: string;
  court?: string;
  date?: string;
  summary?: string;
  key_points?: string[];
  practice_areas?: string[];
  jurisdictions?: string[];
  tags?: string[];
  url?: string;
  document_type?: string;
}

export interface PrecedentAnalysisResult {
  precedent_id: string;
  precedent_title: string;
  analysis: string;
  timestamp: string;
}
