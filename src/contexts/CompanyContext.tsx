// Company context - manages selected company globally across the app
// Handles default company selection based on user role
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import companyService, { type Company } from '@/services/company/companyService'

interface CompanyContextType {
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
const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

// hook to use company context
export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

// provider component that manages company state
interface CompanyProviderProps {
  children: ReactNode
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // fetch companies and determine default company based on user role
  const fetchCompanies = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // get default company ID from user.companies array (first company)
      const defaultCompanyId = user.companies && user.companies.length > 0 ? user.companies[0].id : null

      if (!defaultCompanyId) {
        // no companies in user response
        setCompanies([])
        setSelectedCompanyState(null)
        setIsLoading(false)
        return
      }

      // for team_member: fetch only their assigned company (they don't have permission to GET /companies)
      if (user.role === 'team_member') {
        try {
          // fetch full company details for the team member's assigned company
          const companyDetails = await companyService.get(defaultCompanyId)
          setCompanies([companyDetails])
          setSelectedCompanyState(companyDetails)
        } catch (error) {
          console.error('Failed to fetch company details:', error)
          // fallback: create minimal company object from user.companies[0]
          const userCompany = user.companies[0]
          const fallbackCompany: Company = {
            id: userCompany.id,
            name: userCompany.name,
            logo_url: userCompany.logo_url || null,
            master_id: user.masterId || '',
            slug: '', // not available in user response
            description: null,
            theme: undefined,
            status: undefined,
            settings: undefined,
            created_at: '', // not available in user response
            updated_at: '', // not available in user response
          }
          setCompanies([fallbackCompany])
          setSelectedCompanyState(fallbackCompany)
        }
      } else {
        // for master and owner: fetch full companies list for dropdown
        // they have permission to GET /companies
        const fetchedCompanies = await companyService.list()
        setCompanies(fetchedCompanies)

        // if we already have a selected company and it's still in the list, keep it
        if (selectedCompany) {
          const stillExists = fetchedCompanies.find((c) => c.id === selectedCompany.id)
          if (stillExists) {
            return // keep current selection
          }
        }

        // use default company from user.companies[0] or first from fetched list
        let defaultCompany: Company | null = null

        if (defaultCompanyId) {
          // find the default company in the fetched list
          defaultCompany = fetchedCompanies.find((c) => c.id === defaultCompanyId) || null
        }

        // if not found, use first company (sorted by created_at)
        if (!defaultCompany && fetchedCompanies.length > 0) {
          const sorted = [...fetchedCompanies].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          defaultCompany = sorted[0]
        }

        setSelectedCompanyState(defaultCompany)
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
      // fallback: use company from user.companies if available
      if (user.companies && user.companies.length > 0) {
        const userCompany = user.companies[0]
        const fallbackCompany: Company = {
          id: userCompany.id,
          name: userCompany.name,
          logo_url: userCompany.logo_url || null,
          master_id: user.masterId || '',
          slug: '',
          description: null,
          theme: undefined,
          status: undefined,
          settings: undefined,
          created_at: '',
          updated_at: '',
        }
        setCompanies([fallbackCompany])
        setSelectedCompanyState(fallbackCompany)
      } else {
        setCompanies([])
        setSelectedCompanyState(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // fetch companies when user changes
  useEffect(() => {
    fetchCompanies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // set selected company manually (used when user selects from dropdown)
  const setSelectedCompany = (company: Company | null) => {
    setSelectedCompanyState(company)
  }

  // refresh companies list (useful after creating/deleting companies)
  const refreshCompanies = async () => {
    await fetchCompanies()
  }

  const value: CompanyContextType = {
    selectedCompany,
    companies,
    isLoading,
    setSelectedCompany,
    refreshCompanies,
  }

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

