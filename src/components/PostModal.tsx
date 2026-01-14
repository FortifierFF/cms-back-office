// PostModal - unified modal for creating and editing posts
// Handles both create and edit modes based on whether 'post' prop is provided
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
import blogService, {
  type CreateBlogPostPayload,
  type UpdateBlogPostPayload,
  type BlogPost,
  type Category,
  type Tag,
} from '@/services/blog/blogService'
import { MediaSelectorModal } from '@/components/MediaSelectorModal'
import type { MediaItem } from '@/services/media/mediaService'
import mediaService from '@/services/media/mediaService'
import { Image as ImageIcon, X } from 'lucide-react'

// unified schema for both create and edit
const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  slug: z.string().optional(), // optional slug (backend may auto-generate if not provided)
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published'], { message: 'Status must be draft or published' }),
  allow_comments: z.boolean(), // required boolean
  breaking: z.boolean(), // required boolean
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface PostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  companyId: string
  post?: BlogPost | null // if provided, edit mode; if null/undefined, create mode
}

export function PostModal({
  open,
  onOpenChange,
  onSuccess,
  companyId,
  post,
}: PostModalProps) {
  const isEditMode = !!post

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  // media selector state
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false)
  const [featuredImage, setFeaturedImage] = useState<MediaItem | null>(null)
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [isLoadingFeaturedImage, setIsLoadingFeaturedImage] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      content: post?.content || '',
      status: post?.status || 'draft',
      allow_comments: post?.allow_comments ?? false, // default to false if not set
      breaking: post?.breaking ?? false, // default to false if not set
      categoryIds: post?.categories ? post.categories.map((c) => c.id) : [],
      tagIds: post?.tags ? post.tags.map((t) => t.id) : [],
    },
  })

  // watch selected categories and tags
  const selectedCategoryIds = watch('categoryIds') || []
  const selectedTagIds = watch('tagIds') || []

  // reset form when post changes (for edit mode)
  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug || '',
        content: post.content,
        status: post.status,
        allow_comments: post.allow_comments ?? false,
        breaking: post.breaking ?? false,
        categoryIds: (post.categories || []).map((c) => c.id),
        tagIds: (post.tags || []).map((t) => t.id),
      })

      // load featured image if exists
      if (post.featured_image_url) {
        loadFeaturedImageFromUrl(post.featured_image_url)
      } else {
        setFeaturedImage(null)
        setFeaturedImageUrl(null)
      }
    } else {
      // reset to defaults for create mode
      reset({
        title: '',
        slug: '',
        content: '',
        status: 'draft',
        allow_comments: false,
        breaking: false,
        categoryIds: [],
        tagIds: [],
      })
      setFeaturedImage(null)
      setFeaturedImageUrl(null)
    }
  }, [post, reset])

  // fetch categories and tags when modal opens
  useEffect(() => {
    if (open && companyId) {
      fetchCategories()
      fetchTags()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyId])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    try {
      const categoriesData = await blogService.getCategories(companyId)
      setCategories(categoriesData)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const fetchTags = async () => {
    setIsLoadingTags(true)
    try {
      const tagsData = await blogService.getTags(companyId)
      setTags(tagsData)
    } catch (err) {
      console.error('Failed to fetch tags:', err)
    } finally {
      setIsLoadingTags(false)
    }
  }

  // load featured image metadata from URL (for edit mode)
  const loadFeaturedImageFromUrl = async (imageUrl: string) => {
    if (!companyId) return

    setIsLoadingFeaturedImage(true)
    try {
      // try to find the media item by URL
      // note: this is a simplified approach - in production, you might want
      // to store media ID in the post instead of just URL
      const response = await mediaService.listMedia(companyId, {
        limit: 100, // get more items to search through
      })

      // backend returns data in 'data' field
      const mediaArray = response.data || []
      const foundMedia = mediaArray.find((m: MediaItem) => m.file_url === imageUrl)
      if (foundMedia) {
        setFeaturedImage(foundMedia)
        // fetch presigned URL for preview
        if (foundMedia.file_type === 'image' && companyId) {
          try {
            const urlResponse = await mediaService.getDownloadUrl(companyId, foundMedia.file_key, 3600)
            setFeaturedImageUrl(urlResponse.downloadUrl)
          } catch (err) {
            console.error('Failed to get preview URL:', err)
            setFeaturedImageUrl(foundMedia.file_url) // fallback
          }
        } else {
          setFeaturedImageUrl(foundMedia.file_url)
        }
      } else {
        // if not found in media library, create a minimal MediaItem object
        // this handles cases where the image was uploaded before media library existed
        const fallbackMedia: MediaItem = {
          id: '',
          company_id: companyId,
          file_key: '',
          file_name: 'Featured Image',
          file_url: imageUrl,
          file_type: 'image',
          mime_type: 'image/*',
          file_size: 0,
          width: null,
          height: null,
          duration: null,
          uploaded_by: '',
          alt_text: null,
          created_at: '',
          updated_at: '',
        }
        setFeaturedImage(fallbackMedia)
        setFeaturedImageUrl(imageUrl) // use direct URL for fallback
      }
    } catch (err) {
      console.error('Failed to load featured image:', err)
      // still set a minimal object so the UI can display it
      setFeaturedImage({
        id: '',
        company_id: companyId,
        file_key: '',
        file_name: 'Featured Image',
        file_url: imageUrl,
        file_type: 'image',
        mime_type: 'image/*',
        file_size: 0,
        width: null,
        height: null,
        duration: null,
        uploaded_by: '',
        alt_text: null,
        created_at: '',
        updated_at: '',
      })
      setFeaturedImageUrl(imageUrl)
    } finally {
      setIsLoadingFeaturedImage(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const current = selectedCategoryIds
    if (current.includes(categoryId)) {
      setValue('categoryIds', current.filter((id) => id !== categoryId))
    } else {
      setValue('categoryIds', [...current, categoryId])
    }
  }

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds
    if (current.includes(tagId)) {
      setValue('tagIds', current.filter((id) => id !== tagId))
    } else {
      setValue('tagIds', [...current, tagId])
    }
  }

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditMode && post) {
        // edit mode - update existing post
        const payload: UpdateBlogPostPayload = {
          title: data.title.trim(),
          content: data.content.trim(),
          status: data.status,
        }

        // include slug if provided
        if (data.slug && data.slug.trim()) {
          payload.slug = data.slug.trim()
        }

        // include allow_comments and breaking flags
        payload.allow_comments = data.allow_comments ?? false
        payload.breaking = data.breaking ?? false

        // only include categoryIds if there are selected categories
        if (data.categoryIds && data.categoryIds.length > 0) {
          payload.categoryIds = data.categoryIds
        } else {
          payload.categoryIds = []
        }

        // only include tagIds if there are selected tags
        if (data.tagIds && data.tagIds.length > 0) {
          payload.tagIds = data.tagIds
        } else {
          payload.tagIds = []
        }

        // include featured image URL if selected (use snake_case for backend)
        if (featuredImage) {
          payload.featured_image_url = featuredImage.file_url
        } else {
          payload.featured_image_url = null
        }

        await blogService.update(companyId, post.id, payload)
      } else {
        // create mode - create new post
        const payload: CreateBlogPostPayload = {
          title: data.title.trim(),
          content: data.content.trim(),
          status: data.status,
        }

        // include slug if provided
        if (data.slug && data.slug.trim()) {
          payload.slug = data.slug.trim()
        }

        // include allow_comments and breaking flags
        payload.allow_comments = data.allow_comments ?? false
        payload.breaking = data.breaking ?? false

        // only include categoryIds if there are selected categories
        if (data.categoryIds && data.categoryIds.length > 0) {
          payload.categoryIds = data.categoryIds
        }

        // only include tagIds if there are selected tags
        if (data.tagIds && data.tagIds.length > 0) {
          payload.tagIds = data.tagIds
        }

        // include featured image URL if selected (use snake_case for backend)
        if (featuredImage) {
          payload.featured_image_url = featuredImage.file_url
        }

        await blogService.create(companyId, payload)
      }

      // reset form and close modal
      reset()
      setFeaturedImage(null)
      setFeaturedImageUrl(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} post:`, err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(`Failed to ${isEditMode ? 'update' : 'create'} post. Please try again.`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      setError(null)
      setFeaturedImage(null)
      setFeaturedImageUrl(null)
      onOpenChange(false)
    }
  }

  // handle media selection from media selector
  const handleMediaSelect = async (media: MediaItem) => {
    setFeaturedImage(media)
    // fetch presigned URL for preview
    if (media.file_type === 'image' && companyId) {
      try {
        const urlResponse = await mediaService.getDownloadUrl(companyId, media.file_key, 3600)
        setFeaturedImageUrl(urlResponse.downloadUrl)
      } catch (err) {
        console.error('Failed to get preview URL:', err)
        setFeaturedImageUrl(media.file_url) // fallback to direct URL
      }
    } else {
      setFeaturedImageUrl(media.file_url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the post details. Title and content are required.'
              : 'Create a new blog post. Title and content are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left Side: Title and Content (75%) */}
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter post title"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2 flex-1 flex flex-col">
                <label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  placeholder="Enter post content..."
                  {...register('content')}
                  className={`flex-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content.message}</p>
                )}
              </div>
            </div>

            {/* Right Side: Featured Image, Categories, Tags, Status (25%) */}
            <div className="w-1/4 min-w-[250px] border-l border-gray-200 pl-6 flex flex-col overflow-y-auto">
              {/* Featured Image */}
              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-gray-700">
                  Featured Image (Optional)
                </label>
                {isLoadingFeaturedImage ? (
                  <p className="text-sm text-gray-500">Loading featured image...</p>
                ) : featuredImage ? (
                  <div className="relative border border-gray-300 rounded-md p-3">
                    <div className="flex flex-col gap-3">
                      {featuredImage.file_type === 'image' ? (
                        <img
                          src={featuredImageUrl || featuredImage.file_url}
                          alt={featuredImage.alt_text || featuredImage.file_name}
                          className="w-full aspect-square object-cover rounded"
                          onError={(e) => {
                            // fallback to file_url if presigned URL fails
                            const target = e.target as HTMLImageElement
                            if (target.src !== featuredImage.file_url) {
                              target.src = featuredImage.file_url
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {featuredImage.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {featuredImage.width && featuredImage.height
                            ? `${featuredImage.width}×${featuredImage.height}`
                            : 'Media file'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFeaturedImage(null)
                          setFeaturedImageUrl(null)
                        }}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsMediaSelectorOpen(true)}
                    className="w-full"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Select Featured Image
                  </Button>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-2 mb-6">
                <label htmlFor="slug" className="text-sm font-medium text-gray-700">
                  Slug (Optional)
                </label>
                <Input
                  id="slug"
                  type="text"
                  placeholder="post-url-slug"
                  {...register('slug')}
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Leave empty to auto-generate from title
                </p>
              </div>

              {/* Categories */}
              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-gray-700">
                  Categories (Optional)
                </label>
                {isLoadingCategories ? (
                  <p className="text-sm text-gray-500">Loading categories...</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-gray-500">No categories available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-md">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-gray-700">
                  Tags (Optional)
                </label>
                {isLoadingTags ? (
                  <p className="text-sm text-gray-500">Loading tags...</p>
                ) : tags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-md">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Allow Comments */}
              <div className="space-y-2 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('allow_comments')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Allow Comments
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Allow users to comment on this post
                </p>
              </div>

              {/* Breaking News */}
              <div className="space-y-2 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('breaking')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Breaking News
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6">
                  Mark this post as breaking news
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Post'
                  : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>

        {/* Media Selector Modal */}
        <MediaSelectorModal
          open={isMediaSelectorOpen}
          onClose={() => setIsMediaSelectorOpen(false)}
          onSelect={handleMediaSelect}
          allowedTypes={['image']}
          title="Select Featured Image"
        />
      </DialogContent>
    </Dialog>
  )
}
