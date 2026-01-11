// CreateCompanyModal - modal form for creating a new company
import { useState } from 'react'
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
import companyService, { type CreateCompanyPayload } from '@/services/company/companyService'

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  slug: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

type CreateCompanyFormData = z.infer<typeof createCompanySchema>

interface CreateCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateCompanyModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCompanyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      description: '',
    },
  })

  const onSubmit = async (data: CreateCompanyFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const payload: CreateCompanyPayload = {
        name: data.name,
      }

      // only include optional fields if they have values
      if (data.slug && data.slug.trim()) {
        payload.slug = data.slug.trim()
      }
      if (data.domain && data.domain.trim()) {
        payload.domain = data.domain.trim()
      }
      if (data.description && data.description.trim()) {
        payload.description = data.description.trim()
      }

      await companyService.create(payload)
      
      // reset form and close modal
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error('Failed to create company:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create company. Please try again.')
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
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Create Company</DialogTitle>
          <DialogDescription>
            Create a new company for your account. Only the name is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter company name"
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
              placeholder="Auto-generated from name if not provided"
              {...register('slug')}
              className={errors.slug ? 'border-red-500' : ''}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Custom URL-friendly identifier. Leave blank to auto-generate.
            </p>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm font-medium text-gray-700">
              Domain (Optional)
            </label>
            <Input
              id="domain"
              type="text"
              placeholder="example.com"
              {...register('domain')}
              className={errors.domain ? 'border-red-500' : ''}
            />
            {errors.domain && (
              <p className="text-sm text-red-500">{errors.domain.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Custom domain for this company.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Enter company description (max 500 characters)"
              {...register('description')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Maximum 500 characters.
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



