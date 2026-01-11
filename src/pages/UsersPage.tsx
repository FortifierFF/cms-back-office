// UsersPage - displays all users in the database (for owner accounts)
// Shows users in a table format with sortable columns
import { useState, useEffect, useMemo } from 'react'
import userService, { type UserData } from '@/services/user/userService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { CreateMasterModal } from '@/components/CreateMasterModal'
import { useAuth } from '@/contexts/AuthContext'
import { formatPermissionLabel } from '@/services/permissions/permissionsService'
import { Users, Mail, Shield, CheckCircle, XCircle, ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react'

// sort order type
type SortOrder = 'asc' | 'desc' | null
// sortable column type
type SortableColumn = 'name' | 'email' | 'role' | 'status' | 'master_name' | 'company_names' | null

export function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  // track which user rows have expanded permissions
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set())

  // check if current user is owner (only owners can create master accounts)
  const isOwner = user?.role === 'owner'

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // fetch all users from database (owner endpoint)
      const usersData = await userService.listAll()
      setUsers(usersData)
    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError('Failed to load users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    fetchUsers() // refresh the users list
  }

  // toggle permissions expansion for a specific user
  const togglePermissionsExpansion = (userId: string) => {
    setExpandedPermissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // calculate how many permissions to show initially (approximately 2 rows)
  // assuming ~3-4 permissions per row, so ~6 permissions for 2 rows
  const getInitialPermissionCount = (permissions: string[]) => {
    // show approximately 6 permissions for 2 rows (to ensure "Show more" appears at end of 2nd row)
    return Math.min(6, permissions.length)
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
      owner: 'bg-purple-100 text-purple-800',
      master: 'bg-blue-100 text-blue-800',
      team_member: 'bg-gray-100 text-gray-800',
    }

    const colorClass = roleColors[role] || 'bg-gray-100 text-gray-800'

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
      >
        <Shield className="w-3 h-3" />
        {role}
      </span>
    )
  }

  // handle column header click for sorting
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // toggle sort order: null -> asc -> desc -> null
      if (sortOrder === null) {
        setSortOrder('asc')
      } else if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else {
        setSortColumn(null)
        setSortOrder(null)
      }
    } else {
      // new column, start with ascending
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  // get sort icon for column header
  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1 text-gray-600" />
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="w-3 h-3 ml-1 text-gray-600" />
    }
    return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />
  }

  // sorted users based on current sort column and order
  const sortedUsers = useMemo(() => {
    if (!sortColumn || !sortOrder) {
      return users
    }

    const sorted = [...users].sort((a, b) => {
      let aValue: string | number | null | undefined
      let bValue: string | number | null | undefined

      switch (sortColumn) {
        case 'name':
          aValue = a.name?.toLowerCase() || ''
          bValue = b.name?.toLowerCase() || ''
          break
        case 'email':
          aValue = a.email?.toLowerCase() || ''
          bValue = b.email?.toLowerCase() || ''
          break
        case 'role':
          aValue = a.role?.toLowerCase() || ''
          bValue = b.role?.toLowerCase() || ''
          break
        case 'status':
          aValue = a.status?.toLowerCase() || ''
          bValue = b.status?.toLowerCase() || ''
          break
        case 'master_name':
          aValue = a.master_name?.toLowerCase() || ''
          bValue = b.master_name?.toLowerCase() || ''
          break
        case 'company_names':
          // sort by first company name, or empty string if no companies
          aValue = a.company_names && a.company_names.length > 0 ? a.company_names[0].toLowerCase() : ''
          bValue = b.company_names && b.company_names.length > 0 ? b.company_names[0].toLowerCase() : ''
          break
        default:
          return 0
      }

      // handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''

      // compare values
      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [users, sortColumn, sortOrder])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="mx-auto mb-4" />
              <p className="text-gray-600">Loading users...</p>
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

  return (
    <div className="p-8">
      <div className="">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Users</h1>
            <p className="text-gray-600">
              View and manage all users in the system.
            </p>
          </div>
          {isOwner && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Master Account
            </Button>
          )}
        </div>

        {/* Total Users Count */}
        {users.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="font-medium text-lg">
              Total Users: {users.length}
            </span>
          </div>
        )}

        {/* Users Table */}
        {users.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Users</CardTitle>
              <CardDescription>
                No users found in the system.
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
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email
                          {getSortIcon('email')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Role
                          {getSortIcon('role')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('master_name')}
                      >
                        <div className="flex items-center">
                          Master Name
                          {getSortIcon('master_name')}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort('company_names')}
                      >
                        <div className="flex items-center">
                          Companies
                          {getSortIcon('company_names')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.master_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {user.company_names && user.company_names.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.company_names.map((companyName, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                  >
                                    {companyName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">No companies</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {user.permissions && user.permissions.length > 0 ? (
                              <div className="flex flex-wrap gap-1 items-center">
                                {expandedPermissions.has(user.id)
                                  ? // show all permissions when expanded
                                    user.permissions.map((permission, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                        title={permission}
                                      >
                                        {formatPermissionLabel(permission)}
                                      </span>
                                    ))
                                  : // show limited permissions when collapsed (approximately 2 rows)
                                    user.permissions
                                      .slice(0, getInitialPermissionCount(user.permissions))
                                      .map((permission, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                          title={permission}
                                        >
                                          {formatPermissionLabel(permission)}
                                        </span>
                                      ))}
                                {user.permissions.length >
                                  getInitialPermissionCount(user.permissions) && (
                                  <button
                                    type="button"
                                    onClick={() => togglePermissionsExpansion(user.id)}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline focus:outline-none font-medium"
                                  >
                                    {expandedPermissions.has(user.id)
                                      ? 'Show less'
                                      : 'Show more'}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No permissions</span>
                            )}
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

        {/* Create Master Modal */}
        {isOwner && (
          <CreateMasterModal
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  )
}

