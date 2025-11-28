// config.js
const isDevelopment = process.env.NODE_ENV === 'development';
const useHTTPS = process.env.REACT_APP_USE_HTTPS === 'true';

export const API_CONFIG = {
  baseURL: isDevelopment 
    ? (useHTTPS ? 'https://localhost:3001' : 'http://localhost:3001')
    : 'https://your-production-domain.com',
  
  timeout: 10000,
  
  // Helper pentru construirea URL-urilor
  getApiUrl: (endpoint) => `${API_CONFIG.baseURL}/api${endpoint}`
};

console.log('🔧 API Config:', API_CONFIG);