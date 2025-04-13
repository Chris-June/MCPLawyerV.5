/**
 * Application configuration settings
 */

// API base URL - automatically detects environment
export const API_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://api.mcplawyer.com' // Production URL
    : 'http://localhost:8000';     // Development URL - Reverted to port 8000

// Default timeout for API requests in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// Feature flags
export const FEATURES = {
  PREDICTIVE_ANALYSIS: true,
  DOCUMENT_GENERATION: true,
  LEGAL_RESEARCH: true,
  CONTRACT_ANALYSIS: true,
  CHAT_INTERFACE: true,
};
