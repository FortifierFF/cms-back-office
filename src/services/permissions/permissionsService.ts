// Permissions service - handles permission-related API calls
import { callGet } from '../http'
import urls from '../http/url'

// permission categories structure
export interface PermissionCategories {
  [category: string]: {
    [action: string]: string // action name -> permission value
  }
}

// permissions response structure
export interface PermissionsResponse {
  categories: PermissionCategories
  all: string[]
  metadata: {
    total: number
    categories: string[]
  }
}

// permission option for display (label-value pair)
export interface PermissionOption {
  label: string
  value: string
  category: string
}

// helper function to format permission value to readable label
// e.g., "company.view" -> "Company - View", "blog.create" -> "Blog - Create"
export function formatPermissionLabel(permissionValue: string): string {
  const parts = permissionValue.split('.')
  if (parts.length !== 2) {
    // if format is unexpected, return as-is but formatted
    return permissionValue
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' - ')
  }

  const [category, action] = parts
  const formatText = (text: string): string => {
    return text
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return `${formatText(category)} - ${formatText(action)}`
}

const permissionsService = {
  // get all available permissions
  list: () => callGet(urls.permissions.list) as Promise<PermissionsResponse>,

  // transform permissions response into display-friendly options
  // groups permissions by category with readable labels
  getPermissionOptions: async (): Promise<PermissionOption[]> => {
    const response = await permissionsService.list()
    const options: PermissionOption[] = []

    // helper function to format text: "COMPANY" -> "Company", "CREATE" -> "Create"
    const formatLabel = (text: string): string => {
      return text
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }

    // iterate through categories
    Object.entries(response.categories).forEach(([category, actions]) => {
      const formattedCategory = formatLabel(category)
      
      // iterate through actions in each category
      Object.entries(actions).forEach(([action, permissionValue]) => {
        const formattedAction = formatLabel(action)
        // create readable label: "Category - Action" (e.g., "Company - Create")
        const label = `${formattedCategory} - ${formattedAction}`
        options.push({
          label,
          value: permissionValue,
          category: formattedCategory,
        })
      })
    })

    // sort by category, then by action
    return options.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.label.localeCompare(b.label)
    })
  },
}

export default permissionsService

