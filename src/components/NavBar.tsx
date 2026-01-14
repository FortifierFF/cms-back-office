// NavBar component - top navigation bar with logo and company selector
// Shows company dropdown for master and owner roles
// Shows Create Company button for master accounts
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/hooks/useCompany'
import { CreateCompanyModal } from '@/components/CreateCompanyModal'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus } from 'lucide-react'

export function NavBar() {
  const { user } = useAuth()
  const { selectedCompany, companies, isLoading, setSelectedCompany, refreshCompanies } = useCompany()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleCompanySelect = (company: typeof selectedCompany) => {
    setSelectedCompany(company)
    setIsDropdownOpen(false)
  }

  // handle successful company creation
  const handleCreateSuccess = async () => {
    // refresh companies list and select the newly created company
    await refreshCompanies()
  }

  // determine if company selector should be shown
  // show for master and owner roles (they can have multiple companies)
  const shouldShowSelector = user && (user.role === 'master' || user.role === 'owner') && companies.length > 1
  // show create button for master accounts only
  const isMaster = user?.role === 'master'

  // if user is team_member or has only one company, show simple header
  if (!shouldShowSelector && !isMaster) {
    // get company name from user.companies or selectedCompany
    const companyName = user?.companies && user.companies.length > 0
      ? user.companies[0].name
      : selectedCompany?.name

    return (
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">CMS Admin</h1>
          {companyName && (
            <span className="text-sm text-gray-600 ml-4">({companyName})</span>
          )}
        </div>
      </header>
    )
  }

  // if master with only one company, show header with create button
  if (!shouldShowSelector && isMaster) {
    // get company name from user.companies or selectedCompany
    const companyName = user?.companies && user.companies.length > 0
      ? user.companies[0].name
      : selectedCompany?.name

    return (
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">CMS Admin</h1>
          {companyName && (
            <span className="text-sm text-gray-600 ml-4">({companyName})</span>
          )}
        </div>
        {/* Create Company Button */}
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Company
        </Button>
        <CreateCompanyModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      </header>
    )
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">CMS Admin</h1>
      </div>

      {/* Right side: Company Selector and Create Button */}
      <div className="flex items-center gap-3">
        {/* Company Selector */}
        <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={isLoading || companies.length === 0}
        >
          <span className="text-sm font-medium text-gray-700">
            {isLoading
              ? 'Loading...'
              : selectedCompany
              ? selectedCompany.name
              : companies.length === 0
              ? 'No Companies'
              : 'Select Company'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && companies.length > 0 && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
              <div className="p-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleCompanySelect(company)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCompany?.id === company.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {company.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        </div>

        {/* Create Company Button - only for master accounts */}
        {isMaster && (
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Company
          </Button>
        )}
      </div>

      {/* Create Company Modal */}
      {isMaster && (
        <CreateCompanyModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </header>
  )
}


