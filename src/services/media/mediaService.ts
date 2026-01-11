// Media service - handles all media/file related API calls
// Reusable service for managing media files (images, videos, documents)
import { callDelete, callGet, callPatch, callPost } from '../http'
import urls from '../http/url'

// media item interface - matches API response structure
export interface MediaItem {
  id: string
  company_id: string
  file_key: string // R2 storage key
  file_name: string // original filename
  file_url: string // public R2 URL
  file_type: 'image' | 'video' | 'document' // media type category
  mime_type: string // full MIME type (e.g., "image/jpeg", "video/mp4")
  file_size: number // size in bytes
  width: number | null // image width in pixels (null for videos/documents)
  height: number | null // image height in pixels (null for videos/documents)
  duration: number | null // video duration in seconds (null for images/documents)
  uploaded_by: string // user ID who uploaded it
  uploaded_by_name?: string // user's name (from join, optional)
  alt_text: string | null // optional alt text for accessibility
  created_at: string // ISO date string
  updated_at: string // ISO date string
}

// upload URL request payload
export interface GetUploadUrlPayload {
  fileName: string
  contentType: string
  expiresIn?: number // optional, default 3600 seconds
}

// upload URL response
export interface UploadUrlResponse {
  uploadUrl: string // presigned URL for direct R2 upload
  fileKey: string // R2 storage key
  expiresIn: number
}

// create media record payload (after file is uploaded to R2)
export interface CreateMediaPayload {
  fileKey: string // from upload-url response
  fileName: string
  fileUrl: string // clean URL (uploadUrl without query params)
  fileType: 'image' | 'video' | 'document'
  mimeType: string
  fileSize: number
  width?: number | null
  height?: number | null
  duration?: number | null // for videos
  altText?: string | null
}

// update media payload
export interface UpdateMediaPayload {
  fileName?: string
  altText?: string | null
}

// media list query parameters
export interface MediaListParams {
  page?: number // default: 1
  limit?: number // default: 24
  type?: 'image' | 'video' | 'document' // optional filter
  search?: string // search in filename, optional
  sort?: 'created_at' | 'file_name' | 'file_size' // default: 'created_at'
  order?: 'asc' | 'desc' // default: 'desc'
}

// media list response - matches backend response structure
export interface MediaListResponse {
  data: MediaItem[] // backend returns 'data' instead of 'media'
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters?: {
    type: string | null
    search: string | null
  }
}

const mediaService = {
  // get presigned upload URL from backend
  getUploadUrl: (companyId: string, payload: GetUploadUrlPayload) =>
    callPost(urls.media.getUploadUrl(companyId), payload) as Promise<UploadUrlResponse>,

  // upload file directly to R2 using presigned URL
  // this is a direct fetch call, not through our API client
  uploadToR2: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
  },

  // save media metadata to backend after successful R2 upload
  createMedia: (companyId: string, payload: CreateMediaPayload) =>
    callPost(urls.media.create(companyId), payload) as Promise<MediaItem>,

  // list all media with filters, pagination, and sorting
  listMedia: (companyId: string, params?: MediaListParams) => {
    // build query string from params
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.type) queryParams.append('type', params.type)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.order) queryParams.append('order', params.order)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${urls.media.list(companyId)}?${queryString}`
      : urls.media.list(companyId)

    return callGet(url) as Promise<MediaListResponse>
  },

  // get single media item by id
  getMedia: (companyId: string, mediaId: string) =>
    callGet(urls.media.get(companyId, mediaId)) as Promise<MediaItem>,

  // get presigned download URL for viewing media in browser
  getDownloadUrl: (companyId: string, fileKey: string, expiresIn?: number) => {
    const queryParams = new URLSearchParams()
    queryParams.append('fileKey', fileKey)
    if (expiresIn) {
      queryParams.append('expiresIn', expiresIn.toString())
    }
    return callGet(`${urls.media.getDownloadUrl(companyId)}?${queryParams.toString()}`) as Promise<{ downloadUrl: string; expiresIn: number }>
  },

  // update media metadata (filename, alt text)
  updateMedia: (companyId: string, mediaId: string, payload: UpdateMediaPayload) =>
    callPatch(urls.media.update(companyId, mediaId), payload) as Promise<MediaItem>,

  // delete media (removes from database and optionally from R2)
  deleteMedia: (companyId: string, mediaId: string) =>
    callDelete(urls.media.delete(companyId, mediaId)),
}

export default mediaService
