// MediaSelectorModal - reusable component for selecting/uploading media files
// Can be used in Blog Posts, Products, or any other feature that needs media
import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import mediaService, {
  type MediaItem,
  type MediaListParams,
  type CreateMediaPayload,
} from '@/services/media/mediaService'
import { useCompany } from '@/hooks/useCompany'
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal'
import { toast } from '@/lib/toast'
import { Upload, Image as ImageIcon, Video, File, Search, Loader2, Trash2 } from 'lucide-react'

// props for the media selector modal
export interface MediaSelectorModalProps {
  // whether the modal is open
  open: boolean
  // callback when modal should close
  onClose: () => void
  // callback when user selects a media item
  onSelect: (media: MediaItem) => void
  // optional: filter allowed media types
  allowedTypes?: ('image' | 'video' | 'document')[]
  // optional: allow multiple selection (future feature)
  multiple?: boolean
  // optional: title override
  title?: string
}

// upload progress state
interface UploadProgress {
  file: File
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  mediaId?: string
}

type TabType = 'upload' | 'select'

export function MediaSelectorModal({
  open,
  onClose,
  onSelect,
  allowedTypes = ['image', 'video'],
  title = 'Select Media',
}: MediaSelectorModalProps) {
  const { selectedCompany } = useCompany()
  const companyId = selectedCompany?.id

  // active tab state
  const [activeTab, setActiveTab] = useState<TabType>('select')
  // media list state
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  // selected media item
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  // presigned URLs cache for image previews (key: file_key, value: presigned URL)
  const [imageUrlCache, setImageUrlCache] = useState<Map<string, string>>(new Map())
  // loading state
  const [isLoading, setIsLoading] = useState(false)
  // error state
  const [error, setError] = useState<string | null>(null)
  // upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  // filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'document'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'file_name' | 'file_size'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  // delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 24

  // file input ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  // drag and drop ref
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // fetch presigned download URLs for images
  const fetchImageUrls = async (imageMedia: MediaItem[]) => {
    if (!companyId || imageMedia.length === 0) return

    const newCache = new Map(imageUrlCache)

    // fetch URLs for images that aren't already cached
    const uncachedImages = imageMedia.filter((media) => !newCache.has(media.file_key))

    if (uncachedImages.length === 0) return

    // fetch presigned URLs for uncached images
    const urlPromises = uncachedImages.map(async (media) => {
      try {
        const urlResponse = await mediaService.getDownloadUrl(companyId, media.file_key, 3600)
        return { fileKey: media.file_key, url: urlResponse.downloadUrl }
      } catch (err) {
        console.error(`Failed to get download URL for ${media.file_name}:`, err)
        return null
      }
    })

    const urlResults = await Promise.all(urlPromises)

    // update cache with new URLs
    urlResults.forEach((result) => {
      if (result) {
        newCache.set(result.fileKey, result.url)
      }
    })

    setImageUrlCache(newCache)
  }

  // get image URL (presigned if available, fallback to file_url)
  const getImageUrl = (media: MediaItem): string => {
    if (media.file_type !== 'image') return media.file_url
    return imageUrlCache.get(media.file_key) || media.file_url
  }

  // fetch media list from API
  const fetchMediaList = async () => {
    if (!companyId) return

    setIsLoading(true)
    setError(null)

    try {
      const params: MediaListParams = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
        order: sortOrder,
      }

      // apply type filter if not 'all'
      if (typeFilter !== 'all') {
        params.type = typeFilter
      }

      // apply search query if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const response = await mediaService.listMedia(companyId, params)
      // backend returns data in 'data' field and pagination in 'pagination' object
      // handle both possible response structures for safety
      let fetchedMedia: MediaItem[] = []
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray(response.data)) {
          fetchedMedia = response.data
        } else if ('media' in response && Array.isArray(response.media)) {
          // fallback for old structure
          fetchedMedia = response.media
        }

        if ('pagination' in response && response.pagination && typeof response.pagination === 'object') {
          setTotalPages(response.pagination.totalPages || 0)
        } else if ('totalPages' in response && typeof response.totalPages === 'number') {
          // fallback for old structure
          setTotalPages(response.totalPages)
        } else {
          setTotalPages(0)
        }
      }

      setMediaList(fetchedMedia)

      // fetch presigned URLs for images to enable preview
      if (fetchedMedia.length > 0 && companyId) {
        fetchImageUrls(fetchedMedia.filter(m => m.file_type === 'image'))
      }
    } catch (err) {
      console.error('Failed to fetch media:', err)
      setError(err instanceof Error ? err.message : 'Failed to load media')
      // set empty arrays on error to prevent rendering issues
      setMediaList([])
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }

  // fetch media list when modal opens or filters change
  useEffect(() => {
    if (open && companyId) {
      fetchMediaList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyId, currentPage, typeFilter, searchQuery, sortBy, sortOrder])

  // handle file selection (from input or drag & drop)
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !companyId) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter((file) => {
      // validate file type based on allowedTypes
      if (allowedTypes.includes('image') && file.type.startsWith('image/')) return true
      if (allowedTypes.includes('video') && file.type.startsWith('video/')) return true
      if (allowedTypes.includes('document') && !file.type.startsWith('image/') && !file.type.startsWith('video/'))
        return true
      return false
    })

    if (validFiles.length === 0) {
      setError(`Please select ${allowedTypes.join(' or ')} files only.`)
      return
    }

    // initialize upload progress for each file
    const newProgress: UploadProgress[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }))
    setUploadProgress(newProgress)
    setError(null)

    // switch to upload tab
    setActiveTab('upload')

    // upload each file
    for (let i = 0; i < validFiles.length; i++) {
      await uploadFile(validFiles[i], i)
    }
  }

  // upload a single file
  const uploadFile = async (file: File, index: number) => {
    if (!companyId) return

    try {
      // update status to uploading
      setUploadProgress((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], status: 'uploading', progress: 10 }
        return updated
      })

      // step 1: get presigned upload URL
      const uploadUrlResponse = await mediaService.getUploadUrl(companyId, {
        fileName: file.name,
        contentType: file.type,
        expiresIn: 3600,
      })

      setUploadProgress((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], progress: 30 }
        return updated
      })

      // step 2: upload file directly to R2
      await mediaService.uploadToR2(uploadUrlResponse.uploadUrl, file)

      setUploadProgress((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], progress: 60, status: 'processing' }
        return updated
      })

      // step 3: extract image dimensions if it's an image
      let width: number | null = null
      let height: number | null = null

      if (file.type.startsWith('image/')) {
        const dimensions = await getImageDimensions(file)
        width = dimensions.width
        height = dimensions.height
      }

      // step 4: determine file type
      let fileType: 'image' | 'video' | 'document' = 'document'
      if (file.type.startsWith('image/')) fileType = 'image'
      else if (file.type.startsWith('video/')) fileType = 'video'

      // step 5: save metadata to backend
      const cleanUrl = uploadUrlResponse.uploadUrl.split('?')[0] // remove query params
      const payload: CreateMediaPayload = {
        fileKey: uploadUrlResponse.fileKey,
        fileName: file.name,
        fileUrl: cleanUrl,
        fileType,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
      }

      const createdMedia = await mediaService.createMedia(companyId, payload)

      // update progress to complete
      setUploadProgress((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          progress: 100,
          status: 'complete',
          mediaId: createdMedia.id,
        }
        return updated
      })

      // refresh media list and switch to select tab
      await fetchMediaList()
      setActiveTab('select')
      setSelectedMedia(createdMedia)
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadProgress((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        }
        return updated
      })
    }
  }

  // get image dimensions from file
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e.dataTransfer.files)
  }

  // handle media selection
  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia(media)
  }

  // handle insert button click
  const handleInsert = () => {
    if (selectedMedia) {
      onSelect(selectedMedia)
      onClose()
    }
  }

  // open delete confirmation modal
  const handleDeleteClick = () => {
    if (!selectedMedia) return
    setIsDeleteModalOpen(true)
  }

  // handle confirmed deletion
  const handleDeleteConfirm = async () => {
    if (!selectedMedia || !companyId) return

    setIsDeleting(true)
    try {
      await mediaService.deleteMedia(companyId, selectedMedia.id)
      toast.success('Media deleted', `"${selectedMedia.file_name}" has been deleted successfully.`)
      // remove from list
      setMediaList((prev) => prev.filter((m) => m.id !== selectedMedia.id))
      // clear selection
      setSelectedMedia(null)
      // remove from cache
      setImageUrlCache((prev) => {
        const newCache = new Map(prev)
        newCache.delete(selectedMedia.file_key)
        return newCache
      })
    } catch (err) {
      console.error('Failed to delete media:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete media'
      setError(errorMessage)
      toast.error('Delete failed', errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  // close delete modal
  const handleDeleteModalClose = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false)
    }
  }

  // format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // get file type icon
  const getFileTypeIcon = (fileType: string) => {
    if (fileType === 'image') return <ImageIcon className="w-5 h-5" />
    if (fileType === 'video') return <Video className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  if (!companyId) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Upload new media files or select from existing ones.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('select')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'select'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Select
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'upload'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="flex-1 overflow-y-auto">
            {/* Drag and Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Accepted types: {allowedTypes.join(', ')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={allowedTypes
                  .map((type) => {
                    if (type === 'image') return 'image/*'
                    if (type === 'video') return 'video/*'
                    return '*/*'
                  })
                  .join(',')}
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Upload Progress List */}
            {uploadProgress.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadProgress.map((progress, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {progress.file.name}
                      </span>
                      {progress.status === 'error' && (
                        <span className="text-sm text-red-600">{progress.error}</span>
                      )}
                      {progress.status === 'complete' && (
                        <span className="text-sm text-green-600">Uploaded</span>
                      )}
                    </div>
                    {progress.status === 'uploading' || progress.status === 'processing' ? (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Select Tab */}
        {activeTab === 'select' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar: Search, Filters, Sort */}
            <div className="mb-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by filename..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1) // reset to first page on search
                  }}
                  className="pl-10"
                />
              </div>

              {/* Filters and Sort */}
              <div className="flex gap-2 flex-wrap">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as typeof typeFilter)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {allowedTypes.includes('image') && <option value="image">Images</option>}
                  {allowedTypes.includes('video') && <option value="video">Videos</option>}
                  {allowedTypes.includes('document') && <option value="document">Documents</option>}
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at">Date</option>
                  <option value="file_name">Name</option>
                  <option value="file_size">Size</option>
                </select>

                {/* Sort Order */}
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Main Content: Grid on left, Details on right */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* Left Side: Media Grid (80% width) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : mediaList.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>No media files found.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {/* Grid with 5 columns (20% smaller cards) */}
                    <div className="grid grid-cols-5 gap-3">
                      {mediaList.map((media) => (
                        <div
                          key={media.id}
                          onClick={() => handleMediaSelect(media)}
                          className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                            selectedMedia?.id === media.id
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Thumbnail/Preview */}
                          <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                            {media.file_type === 'image' ? (
                              <img
                                src={getImageUrl(media)}
                                alt={media.alt_text || media.file_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // fallback to file_url if presigned URL fails
                                  const target = e.target as HTMLImageElement
                                  if (target.src !== media.file_url) {
                                    target.src = media.file_url
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-gray-400">
                                {getFileTypeIcon(media.file_type)}
                              </div>
                            )}
                            {selectedMedia?.id === media.id && (
                              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* File Info - minimal, just filename */}
                          <div className="p-1.5">
                            <p className="text-xs font-medium text-gray-900 truncate" title={media.file_name}>
                              {media.file_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Selected Media Details (20% width) */}
              <div className="w-1/5 min-w-[200px] border-l border-gray-200 flex flex-col h-full">
                {selectedMedia ? (
                  <div className="flex flex-col h-full">
                    {/* Preview Image */}
                    <div className="p-4 border-b border-gray-200">
                      {selectedMedia.file_type === 'image' ? (
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(selectedMedia)}
                            alt={selectedMedia.alt_text || selectedMedia.file_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (target.src !== selectedMedia.file_url) {
                                target.src = selectedMedia.file_url
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-gray-400">
                            {getFileTypeIcon(selectedMedia.file_type)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">File Details</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Filename</p>
                            <p className="text-gray-900 font-medium truncate" title={selectedMedia.file_name}>
                              {selectedMedia.file_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Size</p>
                            <p className="text-gray-900">{formatFileSize(selectedMedia.file_size)}</p>
                          </div>
                          {selectedMedia.width && selectedMedia.height && (
                            <div>
                              <p className="text-xs text-gray-500">Dimensions</p>
                              <p className="text-gray-900">
                                {selectedMedia.width} × {selectedMedia.height}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Type</p>
                            <p className="text-gray-900 capitalize">{selectedMedia.file_type}</p>
                          </div>
                          {selectedMedia.uploaded_by_name && (
                            <div>
                              <p className="text-xs text-gray-500">Uploaded by</p>
                              <p className="text-gray-900">{selectedMedia.uploaded_by_name}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">URL</h3>
                        <p className="text-xs text-gray-400 break-all font-mono bg-gray-50 p-2 rounded">
                          {selectedMedia.file_url}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-gray-200 space-y-2">
                      <Button
                        type="button"
                        onClick={handleInsert}
                        className="w-full"
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeleteClick}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-4 h-full">
                    <p className="text-sm text-gray-500 text-center">
                      Select a media file to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Delete Confirmation Modal */}
      {selectedMedia && (
        <DeleteConfirmationModal
          open={isDeleteModalOpen}
          onOpenChange={handleDeleteModalClose}
          itemName={selectedMedia.file_name}
          itemType="media file"
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
          description={`Are you sure you want to delete "${selectedMedia.file_name}"? This action cannot be undone.`}
        />
      )}
    </Dialog>
  )
}
