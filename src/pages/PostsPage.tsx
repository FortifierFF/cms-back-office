// PostsPage - displays all posts for a company
// Shows posts in a table format with filters, sorting, and actions
import { useState, useEffect, useMemo } from 'react'
import blogService, { type BlogPost } from '@/services/blog/blogService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { PostModal } from '@/components/PostModal'
import { useAuth } from '@/contexts/AuthContext'
import { useCompany } from '@/contexts/CompanyContext'
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, User } from 'lucide-react'

// filter type
type FilterType = 'all' | 'published' | 'draft'

// sort order type
type SortOrder = 'asc' | 'desc' | null

// sortable column type
type SortableColumn = 'title' | 'date' | null

export function PostsPage() {
  const { user } = useAuth()
  const { selectedCompany, isLoading: isLoadingCompany } = useCompany()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortColumn, setSortColumn] = useState<SortableColumn>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  // track which post rows have expanded categories/tags
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set())

  // Check if user has permission to create posts
  const canCreate = user?.permissions?.includes('blog.create') ?? false
  // Check if user has permission to edit posts
  const canEdit = user?.permissions?.includes('blog.update') ?? false
  // Check if user has permission to delete posts
  const canDelete = user?.permissions?.includes('blog.delete') ?? false

  // fetch posts when selected company changes
  useEffect(() => {
    // wait for company context to finish loading
    if (isLoadingCompany) {
      return
    }

    // if no company selected, show error
    if (!selectedCompany) {
      setError('No company selected. Please select a company first.')
      setIsLoading(false)
      return
    }

    // ensure company has valid ID before fetching
    if (!selectedCompany.id) {
      setError('Selected company has no ID.')
      setIsLoading(false)
      return
    }

    // fetch posts for the selected company
    fetchPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isLoadingCompany])

  const fetchPosts = async () => {
    if (!selectedCompany) {
      setError('No company selected.')
      setIsLoading(false)
      return
    }

    // ensure company has a valid ID
    if (!selectedCompany.id) {
      setError('Selected company has no ID.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      // Fetch posts for the selected company
      // Endpoint: GET /companies/:companyId/posts
      const companyId = selectedCompany.id
      const postsData = await blogService.list(companyId)
      setPosts(postsData)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
      setError('Failed to load posts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    fetchPosts() // refresh the posts list
  }

  const handleEditClick = (post: BlogPost) => {
    setEditingPost(post)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    fetchPosts() // refresh the posts list
  }

  const handleEditClose = () => {
    setIsEditModalOpen(false)
    setEditingPost(null)
  }

  const handleDeleteClick = async (post: BlogPost) => {
    if (!selectedCompany) return

    // confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return
    }

    try {
      await blogService.delete(selectedCompany.id, post.id)
      fetchPosts() // refresh the posts list
    } catch (err) {
      console.error('Failed to delete post:', err)
      alert('Failed to delete post. Please try again.')
    }
  }

  // toggle categories expansion for a specific post
  const toggleCategoriesExpansion = (postId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  // toggle tags expansion for a specific post
  const toggleTagsExpansion = (postId: string) => {
    setExpandedTags((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  // calculate how many categories to show initially (approximately 2 rows)
  const getInitialCategoryCount = (categories: BlogPost['categories']) => {
    // show approximately 6 categories for 2 rows (to ensure "Show more" appears at end of 2nd row)
    if (!categories || categories.length === 0) return 0
    return Math.min(6, categories.length)
  }

  // calculate how many tags to show initially (approximately 2 rows)
  const getInitialTagCount = (tags: BlogPost['tags']) => {
    // show approximately 6 tags for 2 rows
    if (!tags || tags.length === 0) return 0
    return Math.min(6, tags.length)
  }

  // format date for display: 15/01/2025 at 16:24h
  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} at ${hours}:${minutes}h`
  }

  // get status badge
  const getStatusBadge = (status: string | undefined, publishedAt?: string) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit bg-gray-100 text-gray-800">
          Unknown
        </span>
      )
    }
    const isPublished = status.toLowerCase() === 'published'
    return (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
            isPublished
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
        {isPublished && publishedAt && (
          <span className="text-xs text-gray-500">
            {formatPublishedDate(publishedAt)}
          </span>
        )}
      </div>
    )
  }

  // filter posts by status
  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts
    return posts.filter((post) => post.status.toLowerCase() === filter)
  }, [posts, filter])

  // sort posts
  const sortedPosts = useMemo(() => {
    if (!sortColumn || !sortOrder) return filteredPosts

    const sorted = [...filteredPosts].sort((a, b) => {
      if (sortColumn === 'title') {
        const comparison = a.title.localeCompare(b.title)
        return sortOrder === 'asc' ? comparison : -comparison
      } else if (sortColumn === 'date') {
        // sort by published_at if available, otherwise by created_at
        const dateA = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime()
        const dateB = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }
      return 0
    })

    return sorted
  }, [filteredPosts, sortColumn, sortOrder])

  // calculate filter counts
  const filterCounts = useMemo(() => {
    const all = posts.length
    const published = posts.filter((p) => p.status?.toLowerCase() === 'published').length
    const draft = posts.filter((p) => p.status?.toLowerCase() === 'draft').length
    return { all, published, draft }
  }, [posts])

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

  if (isLoadingCompany || isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="mx-auto mb-4" />
              <p className="text-gray-600">Loading posts...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  if (!selectedCompany) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>No Company Selected</CardTitle>
              <CardDescription>
                Please select a company from the navigation bar to view posts.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="">
        {/* Header with Add Post button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Post
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-gray-900 font-bold'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            All ({filterCounts.all})
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => setFilter('published')}
            className={`text-sm font-medium transition-colors ${
              filter === 'published'
                ? 'text-gray-900 font-bold'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            Published ({filterCounts.published})
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => setFilter('draft')}
            className={`text-sm font-medium transition-colors ${
              filter === 'draft'
                ? 'text-gray-900 font-bold'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            Draft ({filterCounts.draft})
          </button>
        </div>

        {/* Posts Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSortClick('title')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Title
                        {getSortIcon('title')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSortClick('date')}
                        className="flex items-center gap-2 hover:text-gray-700"
                      >
                        Status
                        {getSortIcon('date')}
                      </button>
                    </th>
                    {canEdit && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPosts.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                        No posts found.
                      </td>
                    </tr>
                  ) : (
                    sortedPosts.map((post) => {
                      const isCategoriesExpanded = expandedCategories.has(post.id)
                      const isTagsExpanded = expandedTags.has(post.id)
                      // safely handle null/undefined categories and tags
                      const categories = post.categories || []
                      const tags = post.tags || []
                      const initialCategoryCount = getInitialCategoryCount(categories)
                      const initialTagCount = getInitialTagCount(tags)
                      const showCategoriesMore = categories.length > initialCategoryCount
                      const showTagsMore = tags.length > initialTagCount

                      return (
                        <tr key={post.id} className="hover:bg-gray-50">
                          {/* Title */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          </td>

                          {/* Author */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {post.author_name || 'Unknown'}
                              </span>
                            </div>
                          </td>

                          {/* Categories */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(isCategoriesExpanded
                                ? categories
                                : categories.slice(0, initialCategoryCount)
                              ).map((category) => (
                                <span
                                  key={category.id}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {category.name}
                                </span>
                              ))}
                              {showCategoriesMore && (
                                <button
                                  onClick={() => toggleCategoriesExpansion(post.id)}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  {isCategoriesExpanded ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Tags */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(isTagsExpanded ? tags : tags.slice(0, initialTagCount)).map(
                                (tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                  >
                                    {tag.name}
                                  </span>
                                )
                              )}
                              {showTagsMore && (
                                <button
                                  onClick={() => toggleTagsExpansion(post.id)}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  {isTagsExpanded ? 'Show less' : 'Show more'}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(post.status, post.published_at || undefined)}
                          </td>

                          {/* Actions */}
                          {canEdit && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleEditClick(post)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit post"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteClick(post)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete post"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Post Modal - unified for both create and edit */}
        <PostModal
          open={isCreateModalOpen || isEditModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateModalOpen(false)
              handleEditClose()
            }
          }}
          onSuccess={() => {
            if (isCreateModalOpen) {
              handleCreateSuccess()
            } else {
              handleEditSuccess()
            }
          }}
          companyId={selectedCompany.id}
          post={editingPost || null}
        />
      </div>
    </div>
  )
}

