// Sidebar navigation items configuration
// Defines menu structure with rules for visibility based on permissions/features
import { Home, FileText, Users, Settings, Building2, List } from 'lucide-react'
import paths from '@/routes/paths'
import { and, hasPermission, or, isAuthenticated, hasRole, type RuleContext } from './sidebarRules'

// sidebar item type definition
export interface SidebarItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  rule?: { evaluate: (context: RuleContext) => boolean }
  children?: SidebarItem[]
  badge?: string
  badgeColor?: string
}

// profile section
const profile: SidebarItem[] = [
  {
    href: paths.settings.profile,
    icon: Settings,
    title: 'Profile Settings',
    rule: isAuthenticated(), // everyone who is logged in can access their profile
  },
  // Owner-only pages
  {
    href: paths.users.list,
    icon: Users,
    title: 'Users',
    rule: hasRole('owner'), // only visible to owner accounts
  },
  {
    href: paths.companies.list,
    icon: Building2,
    title: 'Companies',
    rule: hasRole('owner'), // only visible to owner accounts
  },
]

// main features section
const features: SidebarItem[] = [
  {
    href: paths.dashboard.index,
    icon: Home,
    title: 'Dashboard',
    rule: hasPermission('company.view'), // requires company.view permission
  },
  {
    href: paths.posts.list,
    icon: FileText,
    title: 'Posts',
    rule: hasPermission('blog.view'),
    children: [
      {
        href: paths.posts.list,
        icon: FileText,
        title: 'All Posts',
        rule: hasPermission('blog.view'),
      },
      {
        href: paths.categories.list,
        icon: List,
        title: 'Categories',
        rule: hasPermission('blog.view'),
      },
      {
        href: paths.tags.list,
        icon: List,
        title: 'Tags',
        rule: hasPermission('blog.view'),
      },
    ],
  },
  {
    href: paths.users.list,
    icon: Users,
    title: 'Users',
    rule: and(hasPermission('user.read')),
    children: [
      {
        href: paths.users.list,
        icon: Users,
        title: 'All Users',
        rule: hasPermission('user.read'),
      },
      {
        href: paths.users.create,
        icon: Users,
        title: 'Create User',
        rule: hasPermission('user.create'),
      },
    ],
  },
]

// account section
const account: SidebarItem[] = [
  {
    href: paths.companies.overview,
    icon: Building2,
    title: 'Company',
    rule: hasPermission('company.view'), // requires company.view permission
    children: [
      {
        href: paths.companies.overview,
        icon: List,
        title: 'Overview',
        rule: hasPermission('company.view'),
      },
      {
        href: paths.companies.members,
        icon: Users,
        title: 'Members',
        rule: hasPermission('company.view'),
      },
    ],
  },
  {
    href: paths.settings.account,
    icon: Settings,
    title: 'Account Settings',
    rule: or(hasPermission('account.read'), hasPermission('account.write')),
  },
]

// export organized sidebar items
const navItems = [
  {
    title: 'Profile',
    pages: profile,
  },
  {
    title: 'Features',
    pages: features,
  },
  {
    title: 'Account',
    pages: account,
  },
]

export default navItems

