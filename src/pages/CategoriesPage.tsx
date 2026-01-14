// CategoriesPage - displays and manages categories for a company
// Left side: Form for creating categories (35%)
// Right side: Table displaying categories (65%)
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import blogService, { type Category, type CreateCategoryPayload } from '@/services/blog/blogService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader } from '@/components/ui/loader'
import { EditCategoryModal } from '@/components/EditCategoryModal'
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/hooks/useCompany'
import { toast } from '@/lib/toast'
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

// form schema
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional().or(z.literal('')),
  parent_id: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

type CreateCategoryFormData = z.infer<typeof createCategorySchema>

// sort order type
type SortOrder = 'asc' | 'desc' | null

// sortable column type
type SortableColumn = 'name' | 'description' | 'slug' | null

export function CategoriesPage() {
  const { user } = useAuth()
  const { selectedCompany, isLoading: isLoadingCompany } = useCompany()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if user has permission to create categories
  const canCreate = user?.permissions?.includes('blog.create') ?? false
  // Check if user has permission to update categories
  const canUpdate = user?.permissions?.includes('blog.update') ?? false

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      slug: '',
      parent_id: '',
      description: '',
    },
  })

  // fetch categories when selected company changes
  useEffect(() => {
    if (selectedCompany && !isLoadingCompany) {
      fetchCategories()
    } else if (!isLoadingCompany && !selectedCompany) {
      setError('No company selected. Please select a company first.')
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isLoadingCompany])

  const fetchCategories = async () => {
    if (!selectedCompany) {
      setError('No company selected.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const categoriesData = await blogService.getCategories(selectedCompany.id)
      setCategories(categoriesData)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError('Failed to load categories. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CreateCategoryFormData) => {
    if (!selectedCompany) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: CreateCategoryPayload = {
        name: data.name.trim(),
      }

      // only include optional fields if they have values
      if (data.slug && data.slug.trim()) {
        payload.slug = data.slug.trim()
      }
      if (data.parent_id && data.parent_id.trim()) {
        payload.parent_id = data.parent_id.trim()
      } else {
        payload.parent_id = null
      }
      if (data.description && data.description.trim()) {
        payload.description = data.description.trim()
      }

      await blogService.createCategory(selectedCompany.id, payload)

      // reset form and refresh list
      reset()
      fetchCategories()
    } catch (err: unknown) {
      console.error('Failed to create category:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create category. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchCategories()
  }

  const handleEditClose = () => {
    setIsEditModalOpen(false)
    setEditingCategory(null)
  }

  // open delete confirmation modal
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteModalOpen(true)
  }

  // handle confirmed deletion
  const handleDeleteConfirm = async () => {
    if (!selectedCompany || !categoryToDelete) return

    setIsDeleting(true)
    try {
      await blogService.deleteCategory(selectedCompany.id, categoryToDelete.id)
      toast.success('Category deleted', `"${categoryToDelete.name}" has been deleted successfully.`)
      fetchCategories() // refresh the categories list
      setCategoryToDelete(null)
    } catch (err) {
      console.error('Failed to delete category:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category. Please try again.'
      toast.error('Delete failed', errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  // close delete modal
  const handleDeleteModalClose = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false)
      setCategoryToDelete(null)
    }
  }

  // sort categories
  const sortedCategories = useMemo(() => {
    if (!sortColumn || !sortOrder) return categories

    const sorted = [...categories].sort((a, b) => {
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
  }, [categories, sortColumn, sortOrder])

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

  // get parent category name by id
  const getParentCategoryName = (parentId: string | null | undefined) => {
    if (!parentId) return null
    const parent = categories.find((c) => c.id === parentId)
    return parent?.name || null
  }

  if (isLoadingCompany || isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="mx-auto mb-4" />
            <p className="text-gray-600">Loading categories...</p>
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
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create Category</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Category name"
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
                      Slug
                    </label>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="category-slug"
                      {...register('slug')}
                      className={errors.slug ? 'border-red-500' : ''}
                    />
                    {errors.slug && (
                      <p className="text-sm text-red-500">{errors.slug.message}</p>
                    )}
                  </div>

                  {/* Parent Category */}
                  <div className="space-y-2">
                    <label htmlFor="parent_id" className="text-sm font-medium text-gray-700">
                      Parent Category (Optional)
                    </label>
                    <select
                      id="parent_id"
                      {...register('parent_id')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.parent_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">None</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.parent_id && (
                      <p className="text-sm text-red-500">{errors.parent_id.message}</p>
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
                      placeholder="Category description..."
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
                    {isSubmitting ? 'Adding...' : 'Add Category'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right side: Categories Table (70%) */}
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
                    {sortedCategories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canUpdate ? 4 : 3}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No categories found.
                        </td>
                      </tr>
                    ) : (
                      sortedCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          {/* Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                            {category.parent_id && (
                              <div className="text-xs text-gray-500">
                                Parent: {getParentCategoryName(category.parent_id)}
                              </div>
                            )}
                          </td>

                          {/* Description */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {category.description || '-'}
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{category.slug}</div>
                          </td>

                          {/* Actions */}
                          {canUpdate && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleEditClick(category)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit category"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(category)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete category"
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

      {/* Edit Category Modal */}
      {canUpdate && editingCategory && (
        <EditCategoryModal
          open={isEditModalOpen}
          onOpenChange={handleEditClose}
          onSuccess={handleEditSuccess}
          companyId={selectedCompany.id}
          category={editingCategory}
          categories={categories}
        />
      )}

      {/* Delete Confirmation Modal */}
      {canUpdate && categoryToDelete && (
        <DeleteConfirmationModal
          open={isDeleteModalOpen}
          onOpenChange={handleDeleteModalClose}
          itemName={categoryToDelete.name}
          itemType="category"
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}

