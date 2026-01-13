import { ref, computed } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

const DEFAULT_DURATION = 4000

/**
 * Composable for toast notifications
 *
 * @example
 * ```ts
 * const { toasts, showToast, showSuccess, showError } = useToast()
 *
 * // Show toast with custom duration
 * showToast('info', 'Processing...', 2000)
 *
 * // Show success toast (default 4s)
 * showSuccess('Operation completed!')
 *
 * // Show error toast
 * showError('Something went wrong')
 * ```
 */
export function useToast() {
  const toasts = ref<Toast[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * Generate unique ID for toast
   */
  function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Show a toast notification
   * @param type - Toast type (success, error, info, warning)
   * @param message - Message to display
   * @param duration - Duration in milliseconds (default: 4000)
   * @returns Toast ID
   */
  function showToast(type: ToastType, message: string, duration: number = DEFAULT_DURATION): string {
    const id = generateId()
    const toast: Toast = {
      id,
      type,
      message,
      duration
    }

    toasts.value.push(toast)

    // Auto-remove toast after duration
    const timer = setTimeout(() => {
      removeToast(id)
    }, duration)

    timers.set(id, timer)

    return id
  }

  /**
   * Show success toast
   * @param message - Success message
   * @param duration - Duration in milliseconds
   * @returns Toast ID
   */
  function showSuccess(message: string, duration?: number): string {
    return showToast('success', message, duration)
  }

  /**
   * Show error toast
   * @param message - Error message
   * @param duration - Duration in milliseconds
   * @returns Toast ID
   */
  function showError(message: string, duration?: number): string {
    return showToast('error', message, duration)
  }

  /**
   * Show info toast
   * @param message - Info message
   * @param duration - Duration in milliseconds
   * @returns Toast ID
   */
  function showInfo(message: string, duration?: number): string {
    return showToast('info', message, duration)
  }

  /**
   * Show warning toast
   * @param message - Warning message
   * @param duration - Duration in milliseconds
   * @returns Toast ID
   */
  function showWarning(message: string, duration?: number): string {
    return showToast('warning', message, duration)
  }

  /**
   * Remove a specific toast
   * @param id - Toast ID
   */
  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }

    // Clear timer
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  /**
   * Remove all toasts
   */
  function clearAllToasts() {
    // Clear all timers
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()

    // Clear toasts
    toasts.value = []
  }

  /**
   * Get toast CSS class based on type
   */
  function getToastClass(type: ToastType): string {
    const classes: Record<ToastType, string> = {
      success: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-200',
      error: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200',
      info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200',
      warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-200'
    }
    return classes[type] || classes.info
  }

  const hasToasts = computed(() => toasts.value.length > 0)
  const toastCount = computed(() => toasts.value.length)

  return {
    toasts,
    hasToasts,
    toastCount,
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast,
    clearAllToasts,
    getToastClass
  }
}
