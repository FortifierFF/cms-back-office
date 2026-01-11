// Authentication context for managing user login state
// Handles login API calls, token storage, and user data management
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'
import { apiClient } from '@/lib/api'
import urls from '@/services/http/url'

// company interface from user response (minimal company info)
export interface UserCompany {
  id: string
  name: string
  logo_url?: string | null
}

// user interface matching the API response structure
// matches GET /auth/me response format
export interface User {
  id: string
  email: string
  name: string
  role: string
  status: string
  permissions: string[]
  masterId?: string // optional - may be present for team members
  companies: UserCompany[] // array of companies user has access to
}

// login API response structure
// POST /auth/sign-in response: { user: { id, email, name, role, status, permissions, masterId, companies } }
// Cookie is automatically set by backend (httpOnly, secure in production)
interface LoginResponse {
  user: User
}

interface AuthContextType {
  // current user data (null if not logged in)
  user: User | null
  // check if user is authenticated
  isAuthenticated: boolean
  // check if we're currently verifying the session
  isLoading: boolean
  // login function - calls API, backend sets session cookie
  login: (email: string, password: string) => Promise<boolean>
  // logout function - calls backend to clear session cookie
  logout: () => Promise<void>
  // verify session - checks if user is still authenticated (called on app load)
  verifySession: () => Promise<void>
  // refresh user data from API - fetches latest user data from backend
  refreshUser: () => Promise<void>
  // update user data in context - call this after updating profile
  updateUser: (userData: User) => void
}

// create the context with undefined as default (will be provided by AuthProvider)
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// hook to use auth context - throws error if used outside AuthProvider
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// provider component that wraps the app and manages auth state
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // user data stored only in React state (memory) - no localStorage
  // session is managed by backend via HTTP-only cookies
  const [user, setUser] = useState<User | null>(null)
  // start as true - we need to verify session on app load (except on login page)
  // this prevents Secured component from redirecting before verification completes
  const [isLoading, setIsLoading] = useState(true)

  // verify session on app load - check if user has valid session cookie
  // Skip verification ONLY if we're on the login page (user is actively logging in)
  // On all other pages (including after refresh), verify to restore session
  // Only called ONCE when AuthProvider mounts (empty dependency array ensures this)
  useEffect(() => {
    // check if we're on login page
    const isLoginPage = window.location.pathname === '/login'
    
    if (isLoginPage) {
      // on login page - skip verification, user will log in manually
      setIsLoading(false) // not loading, ready for login
    } else {
      // NOT on login page - verify session to restore user if cookie exists
      // This handles page refresh - if user has valid session, restore it
      // isLoading is already true (initial state), so Secured will wait
      verifySession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // empty array = only run once on mount (prevents multiple calls)

  // verify session - checks if user is still authenticated via session cookie
  // Called on app load (except on login page) to restore session after page refresh
  // GET /auth/me returns user directly: { id, email, name, role, status, permissions, masterId, companies }
  // Only calls /auth/me if we don't already have a user (prevents unnecessary calls)
  const verifySession = async () => {
    // don't verify if we already have a user (already logged in from previous action)
    if (user) {
      setIsLoading(false)
      return
    }

    try {
      // call backend to verify session and get current user
      // backend will check the session cookie and return user if valid
      // If no cookie exists, backend returns 401 (handled in catch)
      // Response format: { id, email, name, role, status, permissions, masterId, companies }
      const response = await apiClient.get<User>(urls.auth.me)
      
      // check if response has data
      if (response.data && response.data.id) {
        // valid user data received - we have an active session
        setUser(response.data)
      } else {
        // empty response or invalid data - no active session
        setUser(null)
      }
    } catch (error) {
      // session invalid, expired, or doesn't exist - user not authenticated
      // This is expected if user is not logged in - don't treat as error
      if (axios.isAxiosError(error)) {
        // only log if it's not a 401 (401 is expected when not logged in)
        if (error.response?.status !== 401) {
          console.error('Session verification failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          })
        }
      }
      // no session - user not authenticated (this is normal)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // login function - calls backend API to authenticate user
  // backend sets HTTP-only session cookie (30 minutes)
  // returns true on success, throws error message string on failure
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // make API call to login endpoint
      // backend will set HTTP-only session cookie automatically
      const response = await apiClient.post<LoginResponse>(urls.auth.signIn, {
        email,
        password,
      })

      // extract user from response (token is in HTTP-only cookie, not in response)
      const { user: userData } = response.data

      // store user data in state (memory only)
      setUser(userData)

      return true
    } catch (error: unknown) {
      // handle API errors and provide user-friendly messages
      console.error('Login error:', error)
      
      // check if it's an axios error with response
      if (axios.isAxiosError(error)) {
        // try to extract error message from backend response
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error ||
                            error.message
        
        // throw error with message so login page can display it
        throw new Error(errorMessage || 'Invalid email or password')
      }
      
      // generic error for non-axios errors
      throw new Error('An error occurred. Please try again.')
    }
  }

  // logout function - calls backend to clear session cookie
  const logout = async () => {
    try {
      // call backend logout endpoint to clear session cookie
      await apiClient.post(urls.auth.signOut)
    } catch (error) {
      // even if logout fails, clear user data locally
      console.error('Logout error:', error)
    } finally {
      // clear user data from memory
      setUser(null)
    }
  }

  // refresh user data from API - fetches latest user data from backend
  // useful when user data might have changed (e.g., after profile update)
  const refreshUser = async () => {
    if (!user?.id) {
      console.warn('Cannot refresh user: no user ID available')
      return
    }

    try {
      // fetch latest user data from API
      const response = await apiClient.get<User>(`/user/${user.id}`)
      const updatedUser = response.data

      // update state only (memory) - no localStorage
      setUser(updatedUser)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      // don't throw - just log the error, user can still use the app
    }
  }

  // update user data in context - call this after updating profile
  // this immediately updates the global state without needing an API call
  const updateUser = (userData: User) => {
    setUser(userData)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    verifySession,
    refreshUser,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

