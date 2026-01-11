// Profile page component
// Allows users to view and update their profile information
// Email is read-only, name and password can be updated
// Uses global user state from AuthContext - no need to fetch separately
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import userService from '@/services/user/userService'

// form validation schema using Zod
// password fields are optional - only required if user wants to change password
// currentPassword is required if newPassword is provided
const profileSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
    email: z.string().email(), // email is read-only, but we validate it
    currentPassword: z.string().optional().or(z.literal('')),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
  })
  .refine((data) => {
    // if newPassword is provided, currentPassword must also be provided
    if (data.newPassword && data.newPassword.length > 0) {
      return data.currentPassword && data.currentPassword.length > 0
    }
    return true
  }, {
    message: 'Current password is required when changing password',
    path: ['currentPassword'],
  })
  .refine((data) => {
    // if newPassword is provided, confirmPassword must match
    if (data.newPassword && data.newPassword.length > 0) {
      return data.newPassword === data.confirmPassword
    }
    return true
  }, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // react-hook-form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // sync form with user data when it changes
  // this ensures form always shows current user data from global state
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    }
  }, [user, reset])

  // handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      console.error('Cannot update profile: user not found')
      return
    }

    setIsLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      // build payload - only include fields that have values
      const payload: {
        name?: string
        currentPassword?: string
        newPassword?: string
      } = {}

      // name is optional, but include it if provided
      if (data.name && data.name.trim()) {
        payload.name = data.name.trim()
      }

      // password fields - only include if newPassword is provided
      if (data.newPassword && data.newPassword.length > 0) {
        payload.currentPassword = data.currentPassword
        payload.newPassword = data.newPassword
      }

      // call API to update profile
      const updatedUserData = await userService.updateProfile(payload)

      // after successful update, update global user state
      // this ensures the updated data is available everywhere in the app
      const updatedUser = {
        ...user,
        name: updatedUserData.name || user.name,
        // email stays the same (read-only)
        // other fields come from API response
      }
      updateUser(updatedUser)

      // show success message
      setSuccessMessage('Profile updated successfully!')

      // reset password fields after successful update
      reset({
        name: updatedUserData.name || user.name,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: unknown) {
      console.error('Failed to update profile:', error)
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Failed to update profile. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and password.</p>
        </div>

        {/* profile form card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your name and password. Email cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* email field - read-only */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  {...register('email')}
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  Your email address cannot be changed.
                </p>
              </div>

              {/* name field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name (Optional)
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  1-100 characters. Leave blank to keep current name.
                </p>
              </div>

              {/* current password field */}
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Required only if changing password"
                    {...register('currentPassword')}
                    className={errors.currentPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-500">{errors.currentPassword.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Required only if you want to change your password.
                </p>
              </div>

              {/* new password field */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    {...register('newPassword')}
                    className={errors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-500">{errors.newPassword.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Leave blank if you don't want to change your password. Minimum 8 characters.
                </p>
              </div>

              {/* confirm password field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* success message */}
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              {/* error message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              {/* submit button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

