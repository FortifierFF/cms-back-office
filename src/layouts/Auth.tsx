// Auth layout - used for login and other public pages
// Simple layout without sidebar or navigation
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}


