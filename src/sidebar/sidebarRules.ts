// Sidebar rules system - composable rules for showing/hiding menu items
// Rules are evaluated against user context (permissions, features, etc.)

// helper function to check if permission matches
// supports wildcards like "blog.*" matching "blog.read", "blog.create", etc.
function matchPermission(userPermissions: string[], requiredPermission: string): boolean {
  // exact match
  if (userPermissions.includes(requiredPermission)) {
    return true
  }

  // wildcard match (e.g., "blog.*" matches "blog.read", "blog.create")
  if (requiredPermission.endsWith('.*')) {
    const prefix = requiredPermission.slice(0, -2)
    return userPermissions.some((perm) => perm.startsWith(prefix))
  }

  return false
}

// rule context type - what rules evaluate against
export interface RuleContext {
  user: { id: string; permissions: string[]; role?: string } | null
  permissions: string[]
  features?: string[]
}

// rule type definition
type Rule = {
  evaluate: (context: RuleContext) => boolean
}

// AND rule - all rules must pass
export function and(...rules: Rule[]): Rule {
  return {
    evaluate: (context: RuleContext) => {
      if (Array.isArray(rules)) {
        return rules.every((rule) => rule.evaluate(context))
      }
      return false
    },
  }
}

// OR rule - any rule must pass
export function or(...rules: Rule[]): Rule {
  return {
    evaluate: (context: RuleContext) => {
      if (Array.isArray(rules)) {
        return rules.some((rule) => rule.evaluate(context))
      }
      return false
    },
  }
}

// hasPermission rule - checks if user has required permission
export function hasPermission(permission: string): Rule {
  return {
    evaluate: ({ permissions }: { permissions: string[] }) => {
      return matchPermission(permissions, permission)
    },
  }
}

// hasFeature rule - checks if feature is enabled
// Note: This requires features data from user/account context
export function hasFeature(feature: string): Rule {
  return {
    evaluate: ({ features }: { features?: string[] }) => {
      if (!features) return false
      return features.includes(feature)
    },
  }
}

// isAuthenticated rule - checks if user is logged in (no permission needed)
// Use this for items that should be visible to all authenticated users
export function isAuthenticated(): Rule {
  return {
    evaluate: ({ user }: RuleContext) => {
      // if user exists, they are authenticated
      return user !== null && user !== undefined
    },
  }
}

// hasRole rule - checks if user has a specific role
// Use this to show items only for specific roles (e.g., owner, master, team_member)
export function hasRole(role: string): Rule {
  return {
    evaluate: ({ user }: RuleContext) => {
      if (!user) return false
      // check if user has the role property and it matches
      return (user as { role?: string }).role === role
    },
  }
}
