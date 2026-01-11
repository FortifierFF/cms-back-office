// TagsPage - displays and manages tags for a company
// Left side: Form for creating tags (35%)
// Right side: Table displaying tags (65%)
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import blogService, { type Tag, type CreateTagPayload } from '@/services/blog/blogService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { EditTagModal } from '@/components/EditTagModal'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

// form schema
const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

type CreateTagFormData = z.infer<typeof createTagSchema>

// sort order type
type SortOrder = 'asc' | 'desc' | null

// sortable column type
type SortableColumn = 'name' | 'description' | 'slug' | null

export function TagsPage() {
  const { user } = useAuth()
  const { selectedCompany, isLoading: isLoadingCompany } = useCompany()
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has permission to create tags
  const canCreate = user?.permissions?.includes('blog.create') ?? false
  // Check if user has permission to update tags
  const canUpdate = user?.permissions?.includes('blog.update') ?? false

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTagFormData>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  })

  // fetch tags when selected company changes
  useEffect(() => {
    if (selectedCompany && !isLoadingCompany) {
      fetchTags()
    } else if (!isLoadingCompany && !selectedCompany) {
      setError('No company selected. Please select a company first.')
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isLoadingCompany])

  const fetchTags = async () => {
    if (!selectedCompany) {
      setError('No company selected.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const tagsData = await blogService.getTags(selectedCompany.id)
      setTags(tagsData)
    } catch (err) {
      console.error('Failed to fetch tags:', err)
      setError('Failed to load tags. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CreateTagFormData) => {
    if (!selectedCompany) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: CreateTagPayload = {
        name: data.name.trim(),
      }

      // only include optional fields if they have values
      if (data.slug && data.slug.trim()) {
        payload.slug = data.slug.trim()
      }
      if (data.description && data.description.trim()) {
        payload.description = data.description.trim()
      }

      await blogService.createTag(selectedCompany.id, payload)

      // reset form and refresh list
      reset()
      fetchTags()
    } catch (err: unknown) {
      console.error('Failed to create tag:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create tag. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchTags()
  }

  const handleEditClose = () => {
    setIsEditModalOpen(false)
    setEditingTag(null)
  }

  const handleDeleteClick = async (tag: Tag) => {
    if (!selectedCompany) return

    // confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      return
    }

    try {
      await blogService.deleteTag(selectedCompany.id, tag.id)
      fetchTags() // refresh the tags list
    } catch (err) {
      console.error('Failed to delete tag:', err)
      alert('Failed to delete tag. Please try again.')
    }
  }

  // sort tags
  const sortedTags = useMemo(() => {
    if (!sortColumn || !sortOrder) return tags

    const sorted = [...tags].sort((a, b) => {
      if (sortColumn === 'name') {
        const comparison = a.name.localeCompare(b.name)
        return sortOrder === 'asc' ? comparison : -comparison
      } else if (sortColumn === 'description') {
        const descA = a.description || ''
        const descB = b.description || ''
        const comparison = descA.localeCompare(descB)
        return sortOrder === 'asc' ? comparison : -comparison
      } else if (sortColumn === 'slug') {
        const comparison = a.slug.localeCompare(b.slug)
        return sortOrder === 'asc' ? comparison : -comparison
      }
      return 0
    })

    return sorted
  }, [tags, sortColumn, sortOrder])

  // handle column sort click
  const handleSortClick = (column: SortableColumn) => {
    if (sortColumn === column) {
      // toggle sort order: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortOrder(null)
        setSortColumn(null)
      }
    } else {
      // set new column and start with asc
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  // get sort icon for column
  const getSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="w-4 h-4 text-blue-600" />
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="w-4 h-4 text-blue-600" />
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />
  }

  if (isLoadingCompany || isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="mx-auto mb-4" />
            <p className="text-gray-600">Loading tags...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !selectedCompany) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedCompany) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">No company selected. Please select a company first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex gap-6">
        {/* Left side: Create Form (30%) */}
        {canCreate && (
          <div className="w-[30%]">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create Tag</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tag name"
                      {...register('name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label htmlFor="slug" className="text-sm font-medium text-gray-700">
                      Slug (Optional)
                    </label>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="tag-slug"
                      {...register('slug')}
                      className={errors.slug ? 'border-red-500' : ''}
                    />
                    {errors.slug && (
                      <p className="text-sm text-red-500">{errors.slug.message}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      placeholder="Tag description..."
                      {...register('description')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Tag'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right side: Tags Table (70%) */}
        <div className={canCreate ? 'flex-1' : 'w-full'}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSortClick('name')}
                          className="flex items-center gap-2 hover:text-gray-700"
                        >
                          Name
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSortClick('description')}
                          className="flex items-center gap-2 hover:text-gray-700"
                        >
                          Description
                          {getSortIcon('description')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSortClick('slug')}
                          className="flex items-center gap-2 hover:text-gray-700"
                        >
                          Slug
                          {getSortIcon('slug')}
                        </button>
                      </th>
                      {canUpdate && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedTags.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canUpdate ? 4 : 3}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No tags found.
                        </td>
                      </tr>
                    ) : (
                      sortedTags.map((tag) => (
                        <tr key={tag.id} className="hover:bg-gray-50">
                          {/* Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                          </td>

                          {/* Description */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{tag.description || '-'}</div>
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{tag.slug}</div>
                          </td>

                          {/* Actions */}
                          {canUpdate && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleEditClick(tag)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit tag"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(tag)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete tag"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Tag Modal */}
      {canUpdate && editingTag && (
        <EditTagModal
          open={isEditModalOpen}
          onOpenChange={handleEditClose}
          onSuccess={handleEditSuccess}
          companyId={selectedCompany.id}
          tag={editingTag}
        />
      )}
    </div>
  )
}

