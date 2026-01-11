// Route configuration system
// Defines all routes with metadata: layout, authentication, permissions, features
import DashboardLayout from '@/layouts/Dashboard'
import AuthLayout from '@/layouts/Auth'
import paths from './paths'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { CompanyOverviewPage } from '@/pages/CompanyOverviewPage'
import { CompanyMembersPage } from '@/pages/CompanyMembersPage'
import { UsersPage } from '@/pages/UsersPage'
import { PostsPage } from '@/pages/PostsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { TagsPage } from '@/pages/TagsPage'

// login route - no authentication required
const loginRoute = {
  layout: AuthLayout,
  children: [
    {
      path: paths.login.index,
      element: LoginPage,
      authenticated: false,
      permissions: null,
      features: null,
    },
  ],
}

// dashboard route - requires authentication
const dashboardRoute = {
  layout: DashboardLayout,
  children: [
    {
      path: paths.dashboard.index,
      element: DashboardPage,
      authenticated: true,
      permissions: null,
      features: null,
    },
    {
      path: paths.dashboard.overview,
      element: DashboardPage,
      authenticated: true,
      permissions: null,
      features: null,
    },
  ],
}

// posts routes - require authentication and permissions
const postsRoutes = {
  layout: DashboardLayout,
  children: [
    {
      path: paths.posts.list,
      element: PostsPage, // All Posts page
      authenticated: true,
      permissions: ['blog.view'], // requires blog.view permission
      features: null,
    },
  ],
}

// users routes - require authentication and permissions
// Owner accounts can access /users/list to see all users
const usersRoutes = {
  layout: DashboardLayout,
  children: [
    {
      path: paths.users.list,
      element: UsersPage, // Shows all users for owner accounts
      authenticated: true,
      permissions: null, // No permission check - owner role is checked in sidebar
      features: null,
    },
    {
      path: paths.users.create,
      element: DashboardPage, // TODO: replace with CreateUserPage
      authenticated: true,
      permissions: ['user.create'],
      features: null,
    },
  ],
}

// settings routes
const settingsRoutes = {
  layout: DashboardLayout,
  children: [
    {
      path: paths.settings.profile,
      element: ProfilePage,
      authenticated: true,
      permissions: null, // no permissions needed - everyone can access their profile
      features: null,
    },
  ],
}

// companies routes - requires authentication and company.view permission
const companiesRoutes = {
  layout: DashboardLayout,
  children: [
    {
      path: paths.companies.overview,
      element: CompanyOverviewPage, // Overview page - form to update company
      authenticated: true,
      permissions: ['company.view'], // requires company.view permission
      features: null,
    },
    {
      path: paths.companies.members,
      element: CompanyMembersPage,
      authenticated: true,
      permissions: ['company.view'], // requires company.view permission
      features: null,
    },
    {
      path: paths.companies.list,
      element: CompaniesPage, // Shows all companies for owner, filtered for master
      authenticated: true,
      permissions: null, // No permission check - role-based access
      features: null,
    },
  ],
}

// categories routes - requires authentication and blog.view permission
const categoriesRoutes = {
  layout: DashboardLayout,
  children: [
    {
      path: paths.categories.list,
      element: CategoriesPage,
      authenticated: true,
      permissions: ['blog.view'], // requires blog.view permission
      features: null,
    },
  ],
}

// tags routes - requires authentication and blog.view permission
const tagsRoutes = {
  layout: DashboardLayout,
  children: [
    {
      path: paths.tags.list,
      element: TagsPage,
      authenticated: true,
      permissions: ['blog.view'], // requires blog.view permission
      features: null,
    },
  ],
}

// 404 route
const notFoundRoute = {
  layout: AuthLayout,
  children: [
    {
      path: '*',
      element: DashboardPage, // TODO: replace with NotFoundPage
      authenticated: false,
      permissions: null,
      features: null,
    },
  ],
}

// export all routes in order (more specific routes first)
const routes = [
  dashboardRoute,
  postsRoutes,
  categoriesRoutes,
  tagsRoutes,
  usersRoutes,
  companiesRoutes,
  settingsRoutes,
  loginRoute,
  notFoundRoute,
]

export default routes

