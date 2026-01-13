/**
 * Number and price formatting utilities
 */

/**
 * Safely convert value to number, returning default value if conversion fails
 * Prevents NaN and handles edge cases
 *
 * @param value - Value to convert to number
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns Converted number or default value
 *
 * @example
 * safeNumber('123') // 123
 * safeNumber('abc') // 0
 * safeNumber('abc', 100) // 100
 * safeNumber(null) // 0
 * safeNumber(undefined) // 0
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return defaultValue
  }

  // Already a number
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value
  }

  // Convert string to number
  if (typeof value === 'string') {
    // Remove whitespace and common separators
    const cleaned = value.trim().replace(/,/g, '')
    const parsed = Number(cleaned)
    return isNaN(parsed) ? defaultValue : parsed
  }

  // Try to convert other types
  const parsed = Number(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Format positive number, converting negative values to zero
 * Useful for quantities, amounts that can't be negative
 *
 * @param value - Value to format
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns Positive number or zero
 *
 * @example
 * formatPositive(10) // 10
 * formatPositive(-5) // 0
 * formatPositive('abc') // 0
 * formatPositive(-5, 1) // 1
 */
export function formatPositive(value: any, defaultValue: number = 0): number {
  const num = safeNumber(value, defaultValue)
  return num > 0 ? num : (defaultValue >= 0 ? defaultValue : 0)
}

/**
 * Format number as price with thousand separators
 * Uses locale-specific formatting
 *
 * @param value - Value to format
 * @param options - Formatting options
 * @returns Formatted price string
 *
 * @example
 * formatPrice(1234) // '1,234'
 * formatPrice(1234.5) // '1,234.5'
 * formatPrice(1234, { decimals: 2 }) // '1,234.00'
 * formatPrice(1234, { currency: 'KRW' }) // '₩1,234'
 * formatPrice(1234, { currency: 'USD', decimals: 2 }) // '$1,234.00'
 */
export function formatPrice(
  value: any,
  options: {
    decimals?: number
    currency?: string
    locale?: string
  } = {}
): string {
  const {
    decimals,
    currency,
    locale = 'ko-KR'
  } = options

  const num = safeNumber(value, 0)

  // Use Intl.NumberFormat for locale-aware formatting
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals ?? (num % 1 === 0 ? 0 : 2),
    ...(currency && {
      style: 'currency',
      currency: currency
    })
  })

  return formatter.format(num)
}

/**
 * Format number as Korean currency (won)
 * Shorthand for formatPrice with KRW currency
 *
 * @param value - Value to format
 * @param decimals - Number of decimal places
 * @returns Formatted price string in KRW
 *
 * @example
 * formatKRW(1234) // '₩1,234'
 * formatKRW(1234.5) // '₩1,235' (rounded)
 */
export function formatKRW(value: any, decimals: number = 0): string {
  return formatPrice(value, { currency: 'KRW', decimals })
}

/**
 * Format number as sats (satoshis) with thousand separators
 * Bitcoin amounts are typically shown without decimals
 *
 * @param value - Value to format
 * @returns Formatted sats string
 *
 * @example
 * formatSats(1234) // '1,234 sats'
 * formatSats(1000000) // '1,000,000 sats'
 */
export function formatSats(value: any): string {
  const num = safeNumber(value, 0)
  return `${formatPrice(num, { decimals: 0 })} sats`
}

/**
 * Truncate string to max length with ellipsis
 * Useful for displaying long addresses or IDs
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length (default: 20)
 * @param ellipsis - Ellipsis character (default: '...')
 * @returns Truncated string
 *
 * @example
 * truncate('lnbc1234567890abcdef', 10) // 'lnbc123...'
 * truncate('short', 10) // 'short'
 */
export function truncate(str: string, maxLength: number = 20, ellipsis: string = '...'): string {
  if (!str || typeof str !== 'string') {
    return ''
  }

  if (str.length <= maxLength) {
    return str
  }

  return str.substring(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Truncate string from middle with ellipsis
 * Shows start and end of string, useful for addresses
 *
 * @param str - String to truncate
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 6)
 * @param ellipsis - Ellipsis character (default: '...')
 * @returns Truncated string
 *
 * @example
 * truncateMiddle('lnbc1234567890abcdef1234567890', 6, 6)
 * // 'lnbc12...567890'
 */
export function truncateMiddle(
  str: string,
  startChars: number = 6,
  endChars: number = 6,
  ellipsis: string = '...'
): string {
  if (!str || typeof str !== 'string') {
    return ''
  }

  if (str.length <= startChars + endChars) {
    return str
  }

  const start = str.substring(0, startChars)
  const end = str.substring(str.length - endChars)

  return `${start}${ellipsis}${end}`
}
