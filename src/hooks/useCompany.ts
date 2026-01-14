// Hook to use company context
// Separated from CompanyContext.tsx to fix Fast Refresh warning
import { useContext } from 'react'
import { CompanyContext } from '@/contexts/CompanyContext.types'

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
