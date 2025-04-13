/// <reference types="vite/client" />

// Extend the ImportMeta interface from Vite
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
