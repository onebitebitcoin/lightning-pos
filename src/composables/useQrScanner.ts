import { ref, readonly } from 'vue'

export interface QrScannerOptions {
  /**
   * Callback when QR code is scanned
   */
  onScan?: (value: string) => void

  /**
   * Callback when scanner error occurs
   */
  onError?: (error: string) => void

  /**
   * Auto-close scanner after successful scan
   * @default true
   */
  autoClose?: boolean
}

/**
 * Composable for QR scanner state management
 *
 * @example
 * ```ts
 * const scanner = useQrScanner({
 *   onScan: (value) => {
 *     inputField.value = value
 *   },
 *   onError: (error) => {
 *     showError(error)
 *   }
 * })
 *
 * // Toggle scanner
 * scanner.toggleScanner()
 *
 * // Or manually control
 * scanner.openScanner()
 * scanner.closeScanner()
 * ```
 */
export function useQrScanner(options: QrScannerOptions = {}) {
  const {
    onScan,
    onError,
    autoClose = true
  } = options

  const showScanner = ref(false)
  const scannerError = ref<string>('')
  const lastScannedValue = ref<string>('')

  /**
   * Toggle scanner visibility
   */
  function toggleScanner() {
    showScanner.value = !showScanner.value
    if (!showScanner.value) {
      scannerError.value = ''
    }
  }

  /**
   * Open scanner
   */
  function openScanner() {
    showScanner.value = true
    scannerError.value = ''
  }

  /**
   * Close scanner
   */
  function closeScanner() {
    showScanner.value = false
    scannerError.value = ''
  }

  /**
   * Handle successful QR scan
   * @param value - Scanned value
   */
  function handleScanResult(value: string) {
    if (!value || !value.trim()) {
      handleScanError('Empty QR code value')
      return
    }

    lastScannedValue.value = value

    // Clear error
    scannerError.value = ''

    // Call callback if provided
    if (onScan) {
      onScan(value)
    }

    // Auto-close if enabled
    if (autoClose) {
      showScanner.value = false
    }
  }

  /**
   * Handle scanner error
   * @param message - Error message
   */
  function handleScanError(message: string) {
    scannerError.value = message

    // Call error callback if provided
    if (onError) {
      onError(message)
    }
  }

  /**
   * Clear error state
   */
  function clearError() {
    scannerError.value = ''
  }

  /**
   * Reset scanner state
   */
  function reset() {
    showScanner.value = false
    scannerError.value = ''
    lastScannedValue.value = ''
  }

  return {
    // State (readonly for external consumers)
    showScanner: readonly(showScanner),
    scannerError: readonly(scannerError),
    lastScannedValue: readonly(lastScannedValue),

    // Actions
    toggleScanner,
    openScanner,
    closeScanner,
    handleScanResult,
    handleScanError,
    clearError,
    reset
  }
}
