// EditCategoryModal - modal form for editing an existing category
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
import blogService, { type Category, type UpdateCategoryPayload } from '@/services/blog/blogService'

const editCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional().or(z.literal('')),
  parent_id: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

type EditCategoryFormData = z.infer<typeof editCategorySchema>

interface EditCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  companyId: string
  category: Category
  categories: Category[] // all categories for parent dropdown (excluding current category)
}

export function EditCategoryModal({
  open,
  onOpenChange,
  onSuccess,
  companyId,
  category,
  categories,
}: EditCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // filter out current category from parent options (can't be parent of itself)
  const availableParents = categories.filter((c) => c.id !== category.id)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditCategoryFormData>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id || '',
      description: category.description || '',
    },
  })

  // reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        parent_id: category.parent_id || '',
        description: category.description || '',
      })
    }
  }, [category, reset])

  const onSubmit = async (data: EditCategoryFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload: UpdateCategoryPayload = {
        name: data.name.trim(),
      }

      // only include optional fields if they have values
      if (data.slug && data.slug.trim()) {
        payload.slug = data.slug.trim()
      } else {
        payload.slug = ''
      }
      if (data.parent_id && data.parent_id.trim()) {
        payload.parent_id = data.parent_id.trim()
      } else {
        payload.parent_id = null
      }
      if (data.description && data.description.trim()) {
        payload.description = data.description.trim()
      } else {
        payload.description = ''
      }

      await blogService.updateCategory(companyId, category.id, payload)

      // close modal
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error('Failed to update category:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update category. Please try again.')
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details. Name is required.
          </DialogDescription>
        </DialogHeader>

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
              Slug (Optional)
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
              {availableParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

