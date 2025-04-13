/**
 * Centralized API configuration
 * This file provides a consistent way to access API endpoints across the application
 */

// Use environment variable with fallback to localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE = `${API_URL}/api/v1`;

// Helper function to build API URLs
export function buildUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${API_BASE}/${normalizedEndpoint}`;
}

// Function to convert search params to URLSearchParams
export function buildParams(params: Record<string, any> = {}): URLSearchParams {
  const urlParams = new URLSearchParams();
  
  // Add each parameter to URLSearchParams, handling arrays
  Object.entries(params).forEach(([key, value]) => {
    // Skip null, undefined, empty strings, and 'all' for filter params
    if (value === null || value === undefined || value === '' || value === 'all') {
      return;
    }
    
    // Handle array values (like tags)
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== null && item !== undefined && item !== '') {
          urlParams.append(key, item);
        }
      });
    } else {
      urlParams.append(key, String(value));
    }
  });
  
  return urlParams;
}
