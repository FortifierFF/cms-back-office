// EditMemberModal - modal form for editing a company member
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import companyService, { type CompanyMember, type UpdateMemberPayload } from '@/services/company/companyService'
import permissionsService, { type PermissionOption } from '@/services/permissions/permissionsService'

const editMemberSchema = z.object({
  name: z.string().max(100, 'Name must be 100 characters or less').optional().or(z.literal('')),
  role: z.enum(['viewer', 'editor', 'manager']).optional(),
  permissions: z.array(z.string()).optional(),
})

type EditMemberFormData = z.infer<typeof editMemberSchema>

interface EditMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  companyId: string
  member: CompanyMember | null
}

export function EditMemberModal({
  open,
  onOpenChange,
  onSuccess,
  companyId,
  member,
}: EditMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      name: '',
      role: 'viewer',
      permissions: [],
    },
  })

  const selectedPermissions = watch('permissions') || []

  // Load permissions when modal opens
  useEffect(() => {
    if (open) {
      loadPermissions()
    }
  }, [open])

  // Load member data when member changes
  useEffect(() => {
    if (member && open) {
      reset({
        name: member.name || '',
        role: (member.role as 'viewer' | 'editor' | 'manager') || 'viewer',
        permissions: member.permissions || [],
      })
    }
  }, [member, open, reset])

  const loadPermissions = async () => {
    setIsLoadingPermissions(true)
    try {
      const options = await permissionsService.getPermissionOptions()
      setPermissionOptions(options)
    } catch (err) {
      console.error('Failed to load permissions:', err)
      setError('Failed to load permissions. Please try again.')
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  const onSubmit = async (data: EditMemberFormData) => {
    if (!member) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: UpdateMemberPayload = {}

      // only include fields that have values
      if (data.name && data.name.trim()) {
        payload.name = data.name.trim()
      }
      if (data.role) {
        payload.role = data.role
      }
      if (data.permissions) {
        payload.permissions = data.permissions
      }

      await companyService.updateMember(companyId, member.id, payload)

      // reset form and close modal
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error('Failed to update member:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update member. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      setError(null)
      onOpenChange(false)
    }
  }

  const togglePermission = (permissionValue: string) => {
    const current = selectedPermissions
    if (current.includes(permissionValue)) {
      setValue('permissions', current.filter((p) => p !== permissionValue))
    } else {
      setValue('permissions', [...current, permissionValue])
    }
  }

  // Group permissions by category for display
  const permissionsByCategory = permissionOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = []
    }
    acc[option.category].push(option)
    return acc
  }, {} as Record<string, PermissionOption[]>)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update member information and permissions for {member?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name (Optional)
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter member name"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium text-gray-700">
              Role (Optional)
            </label>
            <select
              id="role"
              {...register('role')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="manager">Manager</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Permissions
            </label>
            {isLoadingPermissions ? (
              <div className="text-sm text-gray-500">Loading permissions...</div>
            ) : (
              <div className="space-y-4 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {Object.entries(permissionsByCategory).map(([category, options]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                      {options.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(option.value)}
                            onChange={() => togglePermission(option.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Select the permissions this member should have.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingPermissions}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

