// Company context - manages selected company globally across the app
// Handles default company selection based on user role
// Persists selected company in localStorage to remember selection across page refreshes
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import companyService, { type Company } from '@/services/company/companyService'
import { CompanyContext, type CompanyContextType } from './CompanyContext.types'

// localStorage key for storing selected company ID
const SELECTED_COMPANY_STORAGE_KEY = 'csid'

// provider component that manages company state
interface CompanyProviderProps {
  children: ReactNode
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const { user, isLoading: authLoading } = useAuth()
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
          // save to localStorage
          localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyDetails.id)
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
          // save to localStorage
          localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, fallbackCompany.id)
        }
      } else {
        // for master and owner: fetch full companies list for dropdown
        // they have permission to GET /companies
        const fetchedCompanies = await companyService.list()
        setCompanies(fetchedCompanies)

        // check localStorage for previously selected company (for page refresh persistence)
        // this takes priority over default company from user.companies[0]
        const savedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY)
        
        // if we already have a selected company in state and it's still in the list, keep it
        // (this handles cases where companies list is refreshed but we want to keep current selection)
        if (selectedCompany) {
          const stillExists = fetchedCompanies.find((c) => c.id === selectedCompany.id)
          if (stillExists) {
            // make sure it's saved to localStorage
            localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, selectedCompany.id)
            setIsLoading(false)
            return // keep current selection
          }
        }

        // try to restore from localStorage first (for page refresh - selectedCompany will be null)
        // prioritize localStorage over defaultCompanyId from user.companies[0]
        let defaultCompany: Company | null = null
        
        // check localStorage first - this takes highest priority for page refresh
        if (savedCompanyId && savedCompanyId.trim() !== '') {
          // check if saved company still exists in the fetched list
          const trimmedSavedId = savedCompanyId.trim()
          const savedCompany = fetchedCompanies.find((c) => c.id === trimmedSavedId)
          
          if (savedCompany) {
            // found saved company - use it (this handles page refresh)
            // set it and save to localStorage, then return early to avoid any fallback logic
            setSelectedCompanyState(savedCompany)
            localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, savedCompany.id)
            setIsLoading(false)
            return // exit early - don't run fallback logic below
          } else {
            // saved company no longer exists or user doesn't have access
            // this can happen if company was deleted or user lost access
            // remove invalid entry from localStorage so fallback logic can run
            localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY)
          }
        }

        // if no saved company or it doesn't exist, use default from user.companies[0]
        // (this is for fresh login/new tab where localStorage is empty)
        if (!defaultCompany && defaultCompanyId) {
          defaultCompany = fetchedCompanies.find((c) => c.id === defaultCompanyId) || null
        }

        // if still no company, use first company (sorted by created_at)
        // (fallback if user.companies[0] doesn't exist in fetched list)
        if (!defaultCompany && fetchedCompanies.length > 0) {
          const sorted = [...fetchedCompanies].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          defaultCompany = sorted[0]
        }

        if (defaultCompany) {
          setSelectedCompanyState(defaultCompany)
          // save to localStorage (ensures it's always saved, even if it was the default)
          localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, defaultCompany.id)
        }
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
    // if auth is still loading, don't do anything yet (wait for session verification)
    // this prevents clearing localStorage during page refresh when user is temporarily null
    if (authLoading) {
      return // wait for auth to finish loading
    }

    if (!user) {
      // user is actually logged out (not just loading) - clear localStorage
      // this only happens on actual logout, not during page refresh
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY)
      setCompanies([])
      setSelectedCompanyState(null)
      setIsLoading(false)
    } else {
      // user is logged in - fetch companies (will restore from localStorage if available)
      fetchCompanies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  // set selected company manually (used when user selects from dropdown)
  // also saves to localStorage to persist across page refreshes
  const setSelectedCompany = (company: Company | null) => {
    setSelectedCompanyState(company)
    // save to localStorage for persistence
    if (company) {
      localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, company.id)
    } else {
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY)
    }
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

