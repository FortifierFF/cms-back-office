// Sidebar component - renders navigation menu with permission-based visibility
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import navItems from '@/sidebar/items'
import { Button } from '@/components/ui/button'
import type { User } from '@/contexts/AuthContext'

interface SidebarProps {
  user: User | null
  onLogout: () => void
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  // evaluate if sidebar item should be visible
  const isVisible = (item: typeof navItems[0]['pages'][0]) => {
    if (!item.rule) return true // no rule means always visible
    if (!user) return false // no user means not visible

    // evaluate rule against user context
    const context = {
      user, // pass user for isAuthenticated rule
      permissions: user.permissions || [],
      features: [], // TODO: add features when available
    }

    return item.rule.evaluate(context)
  }

  // check if route is active
  // For leaf items (no children), only exact match
  // For parent items (with children), match if any child path starts with the href
  const isActive = (href: string, hasChildren: boolean = false) => {
    if (hasChildren) {
      // For parent items, check if current path starts with href + '/'
      // This allows /companies to match /companies/overview, /companies/members, etc.
      return location.pathname.startsWith(href + '/')
    } else {
      // For leaf items, only exact match to prevent false positives
      // e.g., /companies should NOT match /companies/overview
      return location.pathname === href
    }
  }

  // toggle open/closed state for items with children
  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // render sidebar item (recursive for children)
  const renderItem = (item: typeof navItems[0]['pages'][0], level = 0) => {
    if (!isVisible(item)) return null

    const Icon = item.icon
    const hasChildren = !!item.children && item.children.length > 0

    // check if this specific item's route is active
    // For parent groups (with children), we NEVER treat the group as the active leaf,
    // even if it shares the same href as the first child (e.g. Posts + All Posts).
    // Only children should get the full active highlight.
    const selfActive = hasChildren ? false : isActive(item.href, false)
    // check if any child route is active (only for parent groups)
    const childActive =
      hasChildren && item.children!.some((child) => isActive(child.href, false))

    const paddingLeft = level > 0 ? 'ml-6' : ''

    // Items with children behave like collapsible groups (Projects -> Overview, Details)
    if (hasChildren) {
      const isOpen =
        openItems[item.href] !== undefined ? openItems[item.href] : childActive

      // For parent groups: if any child is active, use subtle style (bold + white text)
      // Parent itself is never treated as the active leaf (see selfActive above)
      const parentStyle = childActive
        ? 'text-white font-semibold' // child is active, subtle highlight for parent
        : 'text-gray-300 hover:bg-slate-800 hover:text-white' // inactive

      return (
        <div key={item.href}>
          <button
            type="button"
            onClick={() => toggleItem(item.href)}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors ${paddingLeft} ${parentStyle}`}
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
            {item.badge && (
              <span
                className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  item.badgeColor === 'primary'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
          {isOpen && (
            <div className="mt-1 space-y-1">
              {item.children!.map((child) => renderItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    // Leaf items are regular links - only highlight if THIS item is active
    return (
      <div key={item.href}>
        <Link
          to={item.href}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${paddingLeft} ${
            selfActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{item.title}</span>
          {item.badge && (
            <span
              className={`ml-auto px-2 py-1 text-xs rounded-full ${
                item.badgeColor === 'primary'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              {item.badge}
            </span>
          )}
        </Link>
      </div>
    )
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* sidebar header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">CMS Admin</h1>
        </div>
      </div>

      {/* navigation menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="px-4 mb-2 text-m font-semibold text-gray-400 uppercase tracking-wider">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.pages.map((item) => renderItem(item))}
            </div>
          </div>
        ))}
      </nav>

      {/* user info and logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-400">{user?.email || ''}</p>
        </div>
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  )
}

