// Centralized route paths configuration
// All application routes are defined here with helper functions for dynamic paths

const login = {
  index: '/login',
}

const dashboard = {
  index: '/',
  overview: '/dashboard',
}

const posts = {
  index: '/posts',
  list: '/posts/list',
  create: '/posts/create',
  edit: {
    path: '/posts/:id/edit',
    build: (id: string) => `/posts/${id}/edit`,
  },
  view: {
    path: '/posts/:id',
    build: (id: string) => `/posts/${id}`,
  },
}

const users = {
  index: '/users',
  list: '/users/list',
  create: '/users/create',
  edit: {
    path: '/users/:id/edit',
    build: (id: string) => `/users/${id}/edit`,
  },
  view: {
    path: '/users/:id',
    build: (id: string) => `/users/${id}`,
  },
}

const settings = {
  index: '/settings',
  profile: '/settings/profile',
  account: '/settings/account',
}

const companies = {
  index: '/companies',
  list: '/companies',
  overview: '/companies/overview',
  members: '/companies/members',
}

const categories = {
  index: '/categories',
  list: '/categories',
}

const tags = {
  index: '/tags',
  list: '/tags',
}

const paths = {
  login,
  dashboard,
  posts,
  users,
  settings,
  companies,
  categories,
  tags,
}

export default paths


