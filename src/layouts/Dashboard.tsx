// Dashboard layout - used for authenticated pages
// Includes NavBar at top, sidebar on left, and main content area on right
// Company selection is managed by CompanyContext
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { NavBar } from '@/components/NavBar'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* NavBar at top - company selection handled by CompanyContext */}
      <NavBar />

      {/* Main layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* sidebar navigation */}
        <Sidebar user={user} onLogout={logout} />

        {/* main content area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


