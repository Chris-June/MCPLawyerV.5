import axios from 'axios';
import { Clause, ClauseCategory, ClauseCreateRequest, ClauseUpdateRequest, ClauseGenerateRequest, GeneratedClause } from '../../types/clauseLibrary';
import { API_BASE } from '../apiConfig';

// Use the standardized API configuration for consistency

export const clauseLibraryApi = {
  // Get all clauses with optional filters
  getClauses: async ({
    practiceArea,
    jurisdiction,
    tags,
    searchTerm
  }: {
    practiceArea?: string;
    jurisdiction?: string;
    tags?: string[];
    searchTerm?: string;
  } = {}) => {
    const params = new URLSearchParams();
    // Only add practice_area param if it's not 'all'
    if (practiceArea && practiceArea !== 'all') params.append('practice_area', practiceArea);
    // Only add jurisdiction param if it's not 'all'
    if (jurisdiction && jurisdiction !== 'all') params.append('jurisdiction', jurisdiction);
    if (tags) tags.forEach(tag => params.append('tags', tag));
    if (searchTerm) params.append('search_term', searchTerm);

    console.log('Fetching clauses from:', `${API_BASE}/clauses`);
    try {
      const response = await axios.get<Clause[]>(`${API_BASE}/clauses`, { params });
      console.log('Clauses response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching clauses:', error);
      return [];
    }
  },

  // Get a specific clause by ID
  getClause: async (clauseId: string) => {
    const response = await axios.get<Clause>(`${API_BASE}/clauses/${clauseId}`);
    return response.data;
  },

  // Create a new clause
  createClause: async (clauseData: ClauseCreateRequest) => {
    const response = await axios.post<Clause>(`${API_BASE}/clauses`, clauseData);
    return response.data;
  },

  // Update an existing clause
  updateClause: async (clauseId: string, clauseData: ClauseUpdateRequest) => {
    const response = await axios.put<Clause>(`${API_BASE}/clauses/${clauseId}`, clauseData);
    return response.data;
  },

  // Delete a clause
  deleteClause: async (clauseId: string) => {
    const response = await axios.delete<{ message: string }>(`${API_BASE}/clauses/${clauseId}`);
    return response.data;
  },

  // Get all clause categories
  getClauseCategories: async () => {
    const response = await axios.get<ClauseCategory[]>(`${API_BASE}/clause-categories`);
    return response.data;
  },

  // Get all clause tags
  getClauseTags: async () => {
    const response = await axios.get<string[]>(`${API_BASE}/clause-tags`);
    return response.data;
  },

  // Generate a custom clause using AI
  generateClause: async (requestData: ClauseGenerateRequest) => {
    const response = await axios.post<GeneratedClause>(`${API_BASE}/generate-clause`, requestData);
    return response.data;
  }
};
