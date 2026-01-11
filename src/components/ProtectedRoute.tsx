// Protected route component
// Redirects to login page if user is not authenticated
// Shows loading state while verifying session
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader } from '@/components/ui/loader'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  // show loading state while verifying session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // if not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // if logged in, render the protected content
  return <>{children}</>
}

