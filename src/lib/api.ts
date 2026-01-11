// Axios API client configuration
// Sets up a base axios instance with default config for all API calls
// Uses HTTP-only cookies for session management (backend provides 30-minute sessions)
import axios from 'axios'

// base URL for the API - update this to match your backend URL
// you can also use environment variables: import.meta.env.VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// create axios instance with default config
// withCredentials: true ensures cookies (including HTTP-only session cookies) are sent with requests
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: enables sending cookies (session cookies) with requests
})

// request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// response interceptor - handles common errors
apiClient.interceptors.response.use(
  (response) => {
    // return response as-is on success
    return response
  },
  (error) => {
    // if 401 unauthorized, session expired or invalid
    // backend will have cleared the session cookie automatically
    if (error.response?.status === 401) {
      // redirect to login will be handled by ProtectedRoute
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

