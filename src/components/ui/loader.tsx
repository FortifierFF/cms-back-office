// Reusable Loader component with customizable size and styling
import { cn } from '@/lib/utils'

interface LoaderProps {
  /**
   * Size of the loader spinner
   * - 'sm': 8x8 (h-8 w-8)
   * - 'md': 12x12 (h-12 w-12) - default
   * - 'lg': 16x16 (h-16 w-16)
   * - 'xl': 20x20 (h-20 w-20)
   * - Or pass a custom size class like 'h-6 w-6'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | string
  /**
   * Color of the spinner border
   * Predefined options: 'blue', 'gray', 'green', 'red', 'yellow', 'purple'
   * Or pass a custom color class like 'border-blue-600'
   * Default: 'blue'
   */
  color?: 'blue' | 'gray' | 'green' | 'red' | 'yellow' | 'purple' | string
  /**
   * Additional CSS classes to apply
   */
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
}

const colorMap = {
  blue: 'border-blue-600',
  gray: 'border-gray-600',
  green: 'border-green-600',
  red: 'border-red-600',
  yellow: 'border-yellow-600',
  purple: 'border-purple-600',
}

export function Loader({ size = 'md', color = 'blue', className }: LoaderProps) {
  // Determine size class
  const sizeClass =
    size === 'sm' || size === 'md' || size === 'lg' || size === 'xl'
      ? sizeMap[size]
      : size // Use custom size if provided

  // Determine border color class
  // If color is a predefined option, use the map, otherwise use it as-is (for custom classes)
  const borderColorClass =
    color === 'blue' ||
    color === 'gray' ||
    color === 'green' ||
    color === 'red' ||
    color === 'yellow' ||
    color === 'purple'
      ? colorMap[color]
      : color.startsWith('border-')
      ? color
      : `border-${color}` // Fallback for custom colors

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2',
        sizeClass,
        borderColorClass,
        className
      )}
    />
  )
}

