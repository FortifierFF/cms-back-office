// Secured component - handles authentication and permission checking
// Wraps routes to ensure user has required auth/permissions/features
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import paths from '@/routes/paths'
import { Loader } from '@/components/ui/loader'

interface SecuredProps {
  children: React.ReactNode
  authenticated: boolean | null
  permissions: string[] | null
  features: string[] | null
  path: string
}

export default function Secured({
  children,
  authenticated,
  permissions,
  features,
}: SecuredProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  // wait for session verification to complete before making redirect decisions
  // this prevents infinite redirect loops during app initialization
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

  // check authentication requirement (only after loading is complete)
  if (authenticated === true && !isAuthenticated) {
    return <Navigate to={paths.login.index} replace />
  }

  // if route requires no auth but user is logged in, redirect to dashboard
  // but only if we're not still loading
  if (authenticated === false && isAuthenticated && !isLoading) {
    return <Navigate to={paths.dashboard.index} replace />
  }

  // check permissions if required
  if (permissions && permissions.length > 0 && user) {
    const hasPermission = permissions.some((permission) =>
      user.permissions.includes(permission)
    )
    if (!hasPermission) {
      // TODO: replace with proper unauthorized page
      return <div className="text-red-500 font-bold p-5">You don't have permission to access this page.</div>
    }
  }

  // check features if required
  // Note: features checking would require feature data from user/account
  // For now, we'll skip this but leave the structure
  if (features && features.length > 0) {
    // TODO: implement feature checking when feature system is ready
    // const hasFeature = features.some(feature => user.features?.includes(feature))
    // if (!hasFeature) {
    //   return <div>This feature is not available.</div>
    // }
  }

  // all checks passed, render the protected content
  return <>{children}</>
}

