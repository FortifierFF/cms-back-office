// Main App component with routing and providers
// Sets up React Router, TanStack Query, Auth context, and Company context
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { CompanyProvider } from '@/contexts/CompanyContext'
import AppRoutes from '@/routes/Routes'

// create TanStack Query client for data fetching
// this will be used for API calls throughout the app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // refetch on window focus for fresh data
      refetchOnWindowFocus: false,
      // retry failed requests once
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
