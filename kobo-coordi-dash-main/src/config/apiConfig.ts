// src/config/apiConfig.ts

// Use Vite proxy - requests to /api/kobo will be proxied to KoBoToolbox
export const API_CONFIG = {
  // In development, Vite proxy handles this
  // In production, you'll need to set up a real backend or use environment variables
  BASE_URL: "/api/kobo",
};

// Helper function to get the correct API URL
export const getApiUrl = (path: string, label: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_CONFIG.BASE_URL}/${cleanPath}`;
};