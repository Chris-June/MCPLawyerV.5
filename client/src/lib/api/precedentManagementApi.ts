import axios from 'axios';
import { Precedent, PrecedentCategory, PrecedentCreateRequest, PrecedentUpdateRequest, PrecedentAnalysisResult } from '../../types/precedentManagement';
import { API_BASE } from '../apiConfig';

// Use the standardized API configuration for consistency

export const precedentManagementApi = {
  // Get all precedents with optional filters
  getPrecedents: async ({
    practiceArea,
    jurisdiction,
    documentType,
    tags,
    searchTerm
  }: {
    practiceArea?: string;
    jurisdiction?: string;
    documentType?: string;
    tags?: string[];
    searchTerm?: string;
  } = {}) => {
    const params = new URLSearchParams();
    // Only add practice_area param if it's not 'all'
    if (practiceArea && practiceArea !== 'all') params.append('practice_area', practiceArea);
    // Only add jurisdiction param if it's not 'all'
    if (jurisdiction && jurisdiction !== 'all') params.append('jurisdiction', jurisdiction);
    // Only add document_type param if it's not 'all'
    if (documentType && documentType !== 'all') params.append('document_type', documentType);
    if (tags) tags.forEach(tag => params.append('tags', tag));
    if (searchTerm) params.append('search_term', searchTerm);

    console.log('Fetching precedents from:', `${API_BASE}/precedents`);
    try {
      const response = await axios.get<Precedent[]>(`${API_BASE}/precedents`, { params });
      console.log('Precedents response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching precedents:', error);
      return [];
    }
  },

  // Get a specific precedent by ID
  getPrecedent: async (precedentId: string) => {
    const response = await axios.get<Precedent>(`${API_BASE}/precedents/${precedentId}`);
    return response.data;
  },

  // Create a new precedent
  createPrecedent: async (precedentData: PrecedentCreateRequest) => {
    const response = await axios.post<Precedent>(`${API_BASE}/precedents`, precedentData);
    return response.data;
  },

  // Update an existing precedent
  updatePrecedent: async (precedentId: string, precedentData: PrecedentUpdateRequest) => {
    const response = await axios.put<Precedent>(`${API_BASE}/precedents/${precedentId}`, precedentData);
    return response.data;
  },

  // Delete a precedent
  deletePrecedent: async (precedentId: string) => {
    const response = await axios.delete<{ message: string }>(`${API_BASE}/precedents/${precedentId}`);
    return response.data;
  },

  // Get all precedent categories
  getPrecedentCategories: async () => {
    try {
      const response = await axios.get<PrecedentCategory[]>(`${API_BASE}/precedent-categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching precedent categories:', error);
      return [];
    }
  },

  // Get all precedent tags
  getPrecedentTags: async () => {
    try {
      const response = await axios.get<string[]>(`${API_BASE}/precedent-tags`);
      return response.data;
    } catch (error) {
      console.error('Error fetching precedent tags:', error);
      return [];
    }
  },

  // Analyze a precedent using AI
  analyzePrecedent: async (precedentId: string) => {
    const response = await axios.post<PrecedentAnalysisResult>(`${API_BASE}/precedents/${precedentId}/analyze`);
    return response.data;
  }
};
