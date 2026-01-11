// EditTagModal - modal form for editing an existing tag
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
import blogService, { type Tag, type UpdateTagPayload } from '@/services/blog/blogService'

const editTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

type EditTagFormData = z.infer<typeof editTagSchema>

interface EditTagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  companyId: string
  tag: Tag
}

export function EditTagModal({
  open,
  onOpenChange,
  onSuccess,
  companyId,
  tag,
}: EditTagModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditTagFormData>({
    resolver: zodResolver(editTagSchema),
    defaultValues: {
      name: tag.name,
      slug: tag.slug,
      description: tag.description || '',
    },
  })

  // reset form when tag changes
  useEffect(() => {
    if (tag) {
      reset({
        name: tag.name,
        slug: tag.slug,
        description: tag.description || '',
      })
    }
  }, [tag, reset])

  const onSubmit = async (data: EditTagFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload: UpdateTagPayload = {
        name: data.name.trim(),
      }

      // only include optional fields if they have values
      if (data.slug && data.slug.trim()) {
        payload.slug = data.slug.trim()
      } else {
        payload.slug = ''
      }
      if (data.description && data.description.trim()) {
        payload.description = data.description.trim()
      } else {
        payload.description = ''
      }

      await blogService.updateTag(companyId, tag.id, payload)

      // close modal
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error('Failed to update tag:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update tag. Please try again.')
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
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>
            Update the tag details. Name is required.
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
              {isSubmitting ? 'Updating...' : 'Update Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

