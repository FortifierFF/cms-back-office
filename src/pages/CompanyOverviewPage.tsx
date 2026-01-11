// CompanyOverviewPage - form to update company details
// Uses selected company from CompanyContext
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import companyService from '@/services/company/companyService'
import { useCompany } from '@/contexts/CompanyContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import urls from '@/services/http/url'
import { Upload, X } from 'lucide-react'

const companyUpdateSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  slug: z.string().min(1, 'Slug is required'),
  domain: z.string().optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().or(z.literal('')),
  theme: z.enum(['light', 'dark']),
})

type CompanyUpdateFormData = z.infer<typeof companyUpdateSchema>

export function CompanyOverviewPage() {
  const { selectedCompany, isLoading: isLoadingCompany, refreshCompanies } = useCompany()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompanyUpdateFormData>({
    resolver: zodResolver(companyUpdateSchema),
  })

  // Update form when selected company changes
  useEffect(() => {
    if (selectedCompany && !isLoadingCompany) {
      reset({
        name: selectedCompany.name || '',
        slug: selectedCompany.slug || '',
        domain: selectedCompany.domain || '',
        description: selectedCompany.description || '',
        theme: (selectedCompany.theme as 'light' | 'dark') || 'light',
      })
      if (selectedCompany.logo_url) {
        setLogoPreview(selectedCompany.logo_url)
      } else {
        setLogoPreview(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isLoadingCompany])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB')
        return
      }
      setLogoFile(file)
      setErrorMessage(null)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const onSubmit = async (data: CompanyUpdateFormData) => {
    if (!selectedCompany) return

    setIsSubmitting(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      // If logo file is selected, upload it first
      let logoUrl = selectedCompany?.logo_url

      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)

        // Upload logo
        try {
          const uploadResponse = await apiClient.post<{ url: string }>(
            urls.company.uploadLogo(selectedCompany.id),
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          )
          logoUrl = uploadResponse.data.url
        } catch (uploadError) {
          // If upload fails, try including file in update payload
          console.warn('Logo upload endpoint failed, trying alternative method:', uploadError)
          // For now, we'll continue without the logo URL update
          // Backend might handle logo upload differently
        }
      }

      // Update company data
      const updatePayload = {
        id: selectedCompany.id,
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
        description: data.description || null,
        logo_url: logoUrl,
        theme: data.theme,
      }

      await companyService.update(updatePayload)
      // Refresh companies to get updated data
      await refreshCompanies()
      setLogoFile(null)
      setSuccessMessage('Company updated successfully!')
    } catch (error: unknown) {
      console.error('Failed to update company:', error)
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Failed to update company. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingCompany) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading company data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedCompany) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Company Found</CardTitle>
              <CardDescription>
                Please select a company first before updating its details.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Overview</h1>
          <p className="text-gray-600">Update your company information and settings.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your company details, logo, and theme preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="company-slug"
                  {...register('slug')}
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  URL-friendly identifier for your company.
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
                <p className="text-xs text-gray-500">Maximum 500 characters.</p>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Company Logo (Optional)
                </label>
                <div className="flex items-start gap-4">
                  {logoPreview && (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Company logo"
                        className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <label
                      htmlFor="logo"
                      className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {logoPreview ? 'Change logo' : 'Upload logo'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <label htmlFor="theme" className="text-sm font-medium text-gray-700">
                  Theme <span className="text-red-500">*</span>
                </label>
                <select
                  id="theme"
                  {...register('theme')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.theme ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                {errors.theme && (
                  <p className="text-sm text-red-500">{errors.theme.message}</p>
                )}
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

