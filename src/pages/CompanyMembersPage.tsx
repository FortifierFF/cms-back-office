// CompanyMembersPage - displays all members of a company
// Uses selected company from CompanyContext
import { useState, useEffect } from 'react'
import companyService, { type CompanyMember } from '@/services/company/companyService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { CreateMemberModal } from '@/components/CreateMemberModal'
import { EditMemberModal } from '@/components/EditMemberModal'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { formatPermissionLabel } from '@/services/permissions/permissionsService'
import { Users, Mail, Shield, CheckCircle, XCircle, Plus, Edit } from 'lucide-react'

export function CompanyMembersPage() {
  const { user } = useAuth()
  const { selectedCompany, isLoading: isLoadingCompany } = useCompany()
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null)

  // Check if user has permission to assign members
  const canAssignMember = user?.permissions?.includes('company.assign_member') ?? false
  // Check if user has permission to update members
  const canUpdateMember = user?.permissions?.includes('company.update_member') ?? false

  // fetch members when selected company changes
  useEffect(() => {
    if (selectedCompany && !isLoadingCompany) {
      fetchMembers()
    } else if (!isLoadingCompany && !selectedCompany) {
      setError('No company selected. Please select a company first.')
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isLoadingCompany])

  const fetchMembers = async () => {
    if (!selectedCompany) {
      setError('No company selected.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      // Fetch members for the selected company
      const membersData = await companyService.getMembers(selectedCompany.id)
      setMembers(membersData)
    } catch (err) {
      console.error('Failed to fetch company members:', err)
      setError('Failed to load company members. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    fetchMembers() // refresh the members list
  }

  const handleEditClick = (member: CompanyMember) => {
    setEditingMember(member)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchMembers() // refresh the members list
  }

  const handleEditClose = () => {
    setIsEditModalOpen(false)
    setEditingMember(null)
  }

  const getStatusBadge = (status: string) => {
    const isActive = status.toLowerCase() === 'active'
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {isActive ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {status}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      master: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          roleColors[role.toLowerCase()] || roleColors.user
        }`}
      >
        <Shield className="w-3 h-3" />
        {role}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="mx-auto mb-4" />
              <p className="text-gray-600">Loading members...</p>
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

  if (!selectedCompany) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Company Found</CardTitle>
              <CardDescription>
                Please select a company first before viewing members.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Members</h1>
            <p className="text-gray-600">
                View and manage members of <span className="font-semibold">{selectedCompany.name}</span>
            </p>
          </div>
          {canAssignMember && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>

        {/* Total Members Count */}
        {members.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="font-medium text-lg">
              Total Members: {members.length}
            </span>
          </div>
        )}

        {/* Members Table */}
        {members.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Members</CardTitle>
              <CardDescription>
                This company doesn't have any members yet.
                {canAssignMember && ' Click "Add Member" to invite someone.'}
              </CardDescription>
            </CardHeader>
            {canAssignMember && (
              <CardContent>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              </CardContent>
            )}
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
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      {canUpdateMember && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{member.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(member.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(member.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {member.permissions && member.permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {member.permissions.map((permission, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                    title={permission}
                                  >
                                    {formatPermissionLabel(permission)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No permissions</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.assigned_at
                            ? new Date(member.assigned_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        {canUpdateMember && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              type="button"
                              onClick={() => handleEditClick(member)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit member"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Member Modal */}
        {selectedCompany && (
          <>
            <CreateMemberModal
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              onSuccess={handleCreateSuccess}
              companyId={selectedCompany.id}
            />
            <EditMemberModal
              open={isEditModalOpen}
              onOpenChange={handleEditClose}
              onSuccess={handleEditSuccess}
              companyId={selectedCompany.id}
              member={editingMember}
            />
          </>
        )}
      </div>
    </div>
  )
}

