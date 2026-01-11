// CompaniesPage - displays list of companies
// For master accounts: shows their companies in grid view with create button
// For owner accounts: shows all companies in table view
import { useState, useEffect } from 'react'
import companyService, { type Company } from '@/services/company/companyService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCompanyModal } from '@/components/CreateCompanyModal'
import { Loader } from '@/components/ui/loader'
import { useAuth } from '@/contexts/AuthContext'
import { Building2, Calendar, Plus } from 'lucide-react'

export function CompaniesPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // check if user is owner (shows table view) or master (shows grid view)
  const isOwner = user?.role === 'owner'
  const isMaster = user?.role === 'master'

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // GET /companies returns all companies for owner, filtered for master
      const data = await companyService.list()
      setCompanies(data)
    } catch (err) {
      console.error('Failed to fetch companies:', err)
      setError('Failed to load companies. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    fetchCompanies() // refresh the list
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="mx-auto mb-4" />
              <p className="text-gray-600">Loading companies...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  // Owner view: table format showing all companies
  if (isOwner) {
    return (
      <div className="p-8">
        <div className="">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Companies</h1>
            <p className="text-gray-600">
              View and manage all companies in the system.
            </p>
          </div>

          {/* Total Companies Count */}
          {companies.length > 0 && (
            <div className="mb-4 flex items-center gap-2 text-gray-600">
              <Building2 className="w-5 h-5" />
              <span className="font-medium text-lg">
                Total Companies: {companies.length}
              </span>
            </div>
          )}

          {/* Companies Table */}
          {companies.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Companies</CardTitle>
                <CardDescription>
                  No companies found in the system.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companies.map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {company.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {company.slug || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {company.domain || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-md truncate">
                              {company.description || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(company.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Master view: grid format with create button
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Companies</h1>
            <p className="text-gray-600">
              Manage your companies. You can create and switch between multiple companies.
            </p>
          </div>
          {isMaster && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Company
            </Button>
          )}
        </div>

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Companies Yet</CardTitle>
              <CardDescription>
                You haven't created any companies yet. Create your first company to get started.
              </CardDescription>
            </CardHeader>
            {isMaster && (
              <CardContent>
                <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Company
                </Button>
              </CardContent>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{company.name}</CardTitle>
                  {company.description && (
                    <CardDescription>{company.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {company.slug && (
                      <div>
                        <span className="font-medium">Slug:</span> {company.slug}
                      </div>
                    )}
                    {company.domain && (
                      <div>
                        <span className="font-medium">Domain:</span> {company.domain}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 pt-2">
                      Created: {new Date(company.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {isMaster && (
        <CreateCompanyModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}

