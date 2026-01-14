// Types and context for CompanyContext
// Separated to fix Fast Refresh warning
import { createContext } from 'react'
import type { Company } from '@/services/company/companyService'

export interface CompanyContextType {
  // currently selected company (null if no company available)
  selectedCompany: Company | null
  // all available companies for current user
  companies: Company[]
  // check if we're currently loading companies
  isLoading: boolean
  // set the selected company manually
  setSelectedCompany: (company: Company | null) => void
  // refresh companies list (useful after creating/deleting companies)
  refreshCompanies: () => Promise<void>
}

// create the context with undefined as default
export const CompanyContext = createContext<CompanyContextType | undefined>(undefined)
