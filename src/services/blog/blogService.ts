// Blog service - handles all blog/post related API calls
// Organized by feature for better maintainability
import { callDelete, callGet, callPatch, callPost } from '../http'
import urls from '../http/url'

// category interface - matches API response structure
export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  parent_id?: string | null
  created_at: string
  updated_at: string
}

// tag interface - matches API response structure
export interface Tag {
  id: string
  name: string
  slug: string
  description?: string | null
  created_at: string
  updated_at: string
}

// create category payload
export interface CreateCategoryPayload {
  name: string
  slug?: string
  parent_id?: string | null
  description?: string
}

// update category payload
export interface UpdateCategoryPayload {
  name?: string
  slug?: string
  parent_id?: string | null
  description?: string
}

// create tag payload
export interface CreateTagPayload {
  name: string
  slug?: string
  description?: string
}

// update tag payload
export interface UpdateTagPayload {
  name?: string
  slug?: string
  description?: string
}

// blog post interface - matches API response structure
export interface BlogPost {
  id: string
  company_id: string
  author_id: string
  author_name: string
  title: string
  slug: string
  content: string
  excerpt?: string | null
  status: 'draft' | 'published'
  published_at?: string | null // date when post was published
  allow_comments: boolean
  allow_pings: boolean
  comment_count: number
  views: number
  featured_image_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  breaking: boolean // flag for breaking news
  created_at: string
  updated_at: string
  categories: Category[] // array of categories (can be empty)
  tags: Tag[] // array of tags (can be empty)
}

// create blog post payload
export interface CreateBlogPostPayload {
  title: string
  content: string
  slug?: string // optional slug (if not provided, backend may auto-generate from title)
  status?: 'draft' | 'published'
  allow_comments?: boolean // whether comments are allowed (default: true)
  breaking?: boolean // flag for breaking news (default: false)
  categoryIds?: string[] // array of category IDs
  tagIds?: string[] // array of tag IDs
  featured_image_url?: string | null // URL of featured image (snake_case for backend)
}

// update blog post payload
export interface UpdateBlogPostPayload {
  title?: string
  content?: string
  slug?: string // optional slug
  status?: 'draft' | 'published'
  allow_comments?: boolean // whether comments are allowed
  breaking?: boolean // flag for breaking news
  categoryIds?: string[]
  tagIds?: string[]
  featured_image_url?: string | null // URL of featured image (snake_case for backend)
}

const blogService = {
  // get list of all blog posts for a company
  list: (companyId: string) => callGet(urls.blog.list(companyId)) as Promise<BlogPost[]>,

  // get single blog post by id
  get: (companyId: string, postId: string) => callGet(urls.blog.get(companyId, postId)) as Promise<BlogPost>,

  // create new blog post
  create: (companyId: string, payload: CreateBlogPostPayload) =>
    (callPost(urls.blog.create(companyId), payload) as unknown) as Promise<BlogPost>,

  // update existing blog post
  update: (companyId: string, postId: string, payload: UpdateBlogPostPayload) =>
    (callPatch(urls.blog.update(companyId, postId), payload) as unknown) as Promise<BlogPost>,

  // delete blog post
  delete: (companyId: string, postId: string) => callDelete(urls.blog.delete(companyId, postId)),

  // get all categories for a company
  getCategories: (companyId: string) => callGet(urls.blog.categories.list(companyId)) as Promise<Category[]>,

  // get single category by id
  getCategory: (companyId: string, categoryId: string) =>
    callGet(urls.blog.categories.get(companyId, categoryId)) as Promise<Category>,

  // create new category
  createCategory: (companyId: string, payload: CreateCategoryPayload) =>
    (callPost(urls.blog.categories.create(companyId), payload) as unknown) as Promise<Category>,

  // update existing category
  updateCategory: (companyId: string, categoryId: string, payload: UpdateCategoryPayload) =>
    (callPatch(urls.blog.categories.update(companyId, categoryId), payload) as unknown) as Promise<Category>,

  // delete category
  deleteCategory: (companyId: string, categoryId: string) =>
    callDelete(urls.blog.categories.delete(companyId, categoryId)),

  // get all tags for a company
  getTags: (companyId: string) => callGet(urls.blog.tags.list(companyId)) as Promise<Tag[]>,

  // get single tag by id
  getTag: (companyId: string, tagId: string) =>
    callGet(urls.blog.tags.get(companyId, tagId)) as Promise<Tag>,

  // create new tag
  createTag: (companyId: string, payload: CreateTagPayload) =>
    (callPost(urls.blog.tags.create(companyId), payload) as unknown) as Promise<Tag>,

  // update existing tag
  updateTag: (companyId: string, tagId: string, payload: UpdateTagPayload) =>
    (callPatch(urls.blog.tags.update(companyId, tagId), payload) as unknown) as Promise<Tag>,

  // delete tag
  deleteTag: (companyId: string, tagId: string) =>
    callDelete(urls.blog.tags.delete(companyId, tagId)),
}

export default blogService

