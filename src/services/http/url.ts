// Centralized API URL definitions
// Organized by feature/module for easy maintenance

const auth = {
  signIn: '/auth/sign-in',
  signOut: '/auth/sign-out',
  refreshToken: '/auth/refresh',
  changePassword: '/auth/change-password',
  verify: '/auth/verify', // verify if session is still valid
  me: '/auth/me', // get current user from session
}

const user = {
  list: '/user/list',
  listAll: '/users', // get all users (for owner accounts)
  create: '/user/create',
  createMaster: '/users/masters', // create master account (owner only)
  update: '/user/update',
  get: (id: string) => `/user/${id}`,
  getSelf: '/user/self', // get current logged-in user's data
  updateMe: '/users/me', 
  updateById: (id: string) => `/users/${id}`,
  delete: (id: string) => `/user/${id}`,
  disable: (id: string) => `/user/${id}/disable`,
  enable: (id: string) => `/user/${id}/enable`,
}

const blog = {
  list: (companyId: string) => `/companies/${companyId}/posts`,
  get: (companyId: string, postId: string) => `/companies/${companyId}/posts/${postId}`,
  create: (companyId: string) => `/companies/${companyId}/posts`,
  update: (companyId: string, postId: string) => `/companies/${companyId}/posts/${postId}`,
  delete: (companyId: string, postId: string) => `/companies/${companyId}/posts/${postId}`,

  categories: {
    list: (companyId: string) => `/companies/${companyId}/categories`,
    get: (companyId: string, categoryId: string) => `/companies/${companyId}/categories/${categoryId}`,
    create: (companyId: string) => `/companies/${companyId}/categories`,
    update: (companyId: string, categoryId: string) => `/companies/${companyId}/categories/${categoryId}`,
    delete: (companyId: string, categoryId: string) => `/companies/${companyId}/categories/${categoryId}`,
  },
  
  tags: {
    list: (companyId: string) => `/companies/${companyId}/tags`,
    get: (companyId: string, tagId: string) => `/companies/${companyId}/tags/${tagId}`,
    create: (companyId: string) => `/companies/${companyId}/tags`,
    update: (companyId: string, tagId: string) => `/companies/${companyId}/tags/${tagId}`,
    delete: (companyId: string, tagId: string) => `/companies/${companyId}/tags/${tagId}`,
  },
}

const company = {
  list: '/companies',
  create: '/companies',
  get: (id: string) => `/companies/${id}`,
  update: (id: string) => `/companies/${id}`,
  delete: (id: string) => `/companies/${id}`,
  uploadLogo: (id: string) => `/companies/${id}/logo`,
  members: (id: string) => `/companies/${id}/members`,
  createMember: (id: string) => `/companies/${id}/members`,
}

const permissions = {
  list: '/permissions',
}

const account = {
  get: '/account',
  update: '/account/update',
  settings: {
    get: '/account/settings',
    update: '/account/settings',
  },
}

const media = {
  // get presigned upload URL for R2
  getUploadUrl: (companyId: string) => `/companies/${companyId}/r2/upload-url`,
  // get presigned download URL for R2
  getDownloadUrl: (companyId: string) => `/companies/${companyId}/r2/download-url`,
  // create media record after upload
  create: (companyId: string) => `/companies/${companyId}/media`,
  // list all media with filters
  list: (companyId: string) => `/companies/${companyId}/media`,
  // get single media item
  get: (companyId: string, mediaId: string) => `/companies/${companyId}/media/${mediaId}`,
  // update media metadata
  update: (companyId: string, mediaId: string) => `/companies/${companyId}/media/${mediaId}`,
  // delete media
  delete: (companyId: string, mediaId: string) => `/companies/${companyId}/media/${mediaId}`,
}

const urls = {
  auth,
  user,
  blog,
  company,
  permissions,
  account,
  media,
}

export default urls
