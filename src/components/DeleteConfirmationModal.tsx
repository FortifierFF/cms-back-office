// Reusable delete confirmation modal component
// Provides a consistent UI for confirming destructive actions across the app
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteConfirmationModalProps {
  // whether the modal is open
  open: boolean
  // callback when modal open state changes
  onOpenChange: (open: boolean) => void
  // title of the item being deleted (e.g., "My Post Title")
  itemName: string
  // type of item being deleted (e.g., "post", "category", "tag", "media")
  itemType?: string
  // callback when user confirms deletion
  onConfirm: () => void | Promise<void>
  // whether the delete action is in progress (for loading state)
  isDeleting?: boolean
  // optional custom description text
  description?: string
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  itemName,
  itemType = 'item',
  onConfirm,
  isDeleting = false,
  description,
}: DeleteConfirmationModalProps) {
  // handle confirm button click
  const handleConfirm = async () => {
    try {
      await onConfirm()
      // close modal after successful deletion
      onOpenChange(false)
    } catch (error) {
      // error handling is done in the parent component via toast
      // we don't close the modal on error so user can retry
    }
  }

  // default description text
  const defaultDescription = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
  const finalDescription = description || defaultDescription

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Icon and title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Delete {itemType}?</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-base">
            {finalDescription}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-3">
          {/* Cancel button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          {/* Delete button */}
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
