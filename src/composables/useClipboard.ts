import { ref } from 'vue'

/**
 * Composable for clipboard operations
 *
 * @example
 * ```ts
 * const { copyToClipboard, pasteFromClipboard, error } = useClipboard()
 *
 * // Copy text
 * const success = await copyToClipboard('Hello World')
 *
 * // Paste text
 * const text = await pasteFromClipboard()
 * if (text) {
 *   console.log('Pasted:', text)
 * }
 * ```
 */
export function useClipboard() {
  const error = ref<string | null>(null)
  const lastCopied = ref<string | null>(null)

  /**
   * Copy text to clipboard
   * @param text - Text to copy
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  async function copyToClipboard(text: string): Promise<boolean> {
    if (!text) {
      error.value = 'No text provided'
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      lastCopied.value = text
      error.value = null
      return true
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      error.value = err instanceof Error ? err.message : 'Failed to copy to clipboard'
      return false
    }
  }

  /**
   * Read text from clipboard
   * @returns Promise<string | null> - Clipboard text or null if failed
   */
  async function pasteFromClipboard(): Promise<string | null> {
    try {
      const text = await navigator.clipboard.readText()
      error.value = null
      return text.trim() || null
    } catch (err) {
      console.error('Failed to read from clipboard:', err)
      error.value = err instanceof Error ? err.message : 'Failed to read from clipboard'
      return null
    }
  }

  /**
   * Clear error state
   */
  function clearError() {
    error.value = null
  }

  return {
    error,
    lastCopied,
    copyToClipboard,
    pasteFromClipboard,
    clearError
  }
}
