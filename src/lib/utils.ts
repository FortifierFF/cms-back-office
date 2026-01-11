// Utility function for merging Tailwind CSS classes
// This is used by shadcn/ui components to combine class names safely
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names using clsx and tailwind-merge
 * This ensures Tailwind classes are properly merged and conflicts are resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

