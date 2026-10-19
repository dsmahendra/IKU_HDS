import axios from 'axios'

// Determine backend URL based on environment
const BACKEND_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3001'
    : 'https://hds-delivery-admin-backend-production.up.railway.app')

console.log('📡 API Backend URL:', BACKEND_URL)

// Create axios instance with backend URL (include /api in baseURL)
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })
    return Promise.reject(error)
  }
)

export default api
