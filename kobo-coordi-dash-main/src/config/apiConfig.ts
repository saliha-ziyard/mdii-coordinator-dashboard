// src/config/apiConfig.ts

// Use Vite proxy - requests to /api/kobo will be proxied to KoBoToolbox
// src/config/apiConfig.ts

// Use Vite proxy - requests to /api/kobo will be proxied to KoBoToolbox
export const API_CONFIG = {
  BASE_URL: "/api/kobo",
  AZURE_FUNCTION_KEY: import.meta.env.VITE_AZURE_FUNCTION_KEY || "",
  AZURE_FUNCTION_BASE: import.meta.env.VITE_AZURE_FUNCTION_BASE || "",
};

// Helper function to get the correct API URL
export const getApiUrl = (path: string, label: string) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_CONFIG.BASE_URL}/${cleanPath}`;
};