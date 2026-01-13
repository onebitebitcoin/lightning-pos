/**
 * Input validation utilities for Lightning and e-cash
 */

export type InputType = 'bolt11' | 'lightning_address' | 'ecash_request' | 'cashu_token' | 'unknown'

/**
 * Check if input is a BOLT11 Lightning invoice
 * BOLT11 invoices start with ln followed by network prefix (bc, tb, bcrt)
 *
 * @param input - Input string to check
 * @returns true if input is a BOLT11 invoice
 *
 * @example
 * isBolt11Invoice('lnbc1234...') // true
 * isBolt11Invoice('user@domain.com') // false
 */
export function isBolt11Invoice(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  const normalized = input.trim().toLowerCase()

  // BOLT11 invoices start with ln + network prefix
  // lnbc = bitcoin mainnet
  // lntb = bitcoin testnet
  // lnbcrt = bitcoin regtest
  return normalized.startsWith('lnbc') ||
         normalized.startsWith('lntb') ||
         normalized.startsWith('lnbcrt')
}

/**
 * Check if input is a Lightning address or LNURL
 * Lightning addresses: user@domain.com
 * LNURL: lnurl1...
 *
 * @param input - Input string to check
 * @returns true if input is a Lightning address or LNURL
 *
 * @example
 * isLightningAddress('user@getalby.com') // true
 * isLightningAddress('lnurl1abc...') // true
 * isLightningAddress('lnbc1234...') // false
 */
export function isLightningAddress(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  const normalized = input.trim().toLowerCase()

  // Check for LNURL
  if (normalized.startsWith('lnurl')) {
    return true
  }

  // Check for Lightning address format: user@domain.com
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(normalized)
}

/**
 * Check if input is a Cashu e-cash request (NUT-18)
 * E-cash requests start with 'creqa' prefix
 *
 * @param input - Input string to check
 * @returns true if input is an e-cash request
 *
 * @example
 * isEcashRequest('creqaABC123...') // true
 * isEcashRequest('cashuAabc...') // false
 */
export function isEcashRequest(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  const normalized = input.trim().toLowerCase()

  // NUT-18 payment requests start with 'creqa'
  return normalized.startsWith('creqa')
}

/**
 * Check if input is a Cashu token
 * Cashu tokens start with 'cashuA', 'cashuB', etc.
 *
 * @param input - Input string to check
 * @returns true if input is a Cashu token
 *
 * @example
 * isCashuToken('cashuAeyJ0...') // true
 * isCashuToken('creqaABC123...') // false
 */
export function isCashuToken(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  const normalized = input.trim()

  // Cashu tokens start with 'cashuA', 'cashuB', etc.
  return /^cashu[A-Z]/i.test(normalized)
}

/**
 * Normalize BOLT11 invoice by removing common prefixes and whitespace
 * Removes 'lightning:' prefix and trims whitespace
 *
 * @param invoice - Invoice string to normalize
 * @returns Normalized invoice string
 *
 * @example
 * normalizeBolt11('lightning:lnbc123...') // 'lnbc123...'
 * normalizeBolt11('  lnbc123...  ') // 'lnbc123...'
 */
export function normalizeBolt11(invoice: string): string {
  if (!invoice || typeof invoice !== 'string') {
    return ''
  }

  let normalized = invoice.trim()

  // Remove 'lightning:' prefix if present
  if (normalized.toLowerCase().startsWith('lightning:')) {
    normalized = normalized.substring(10)
  }

  // Remove 'bitcoin:' prefix if present (some wallets use this)
  if (normalized.toLowerCase().startsWith('bitcoin:')) {
    normalized = normalized.substring(8)
  }

  return normalized.trim()
}

/**
 * Normalize Lightning address by removing whitespace and converting to lowercase
 *
 * @param address - Lightning address to normalize
 * @returns Normalized address string
 *
 * @example
 * normalizeLightningAddress('  User@Domain.COM  ') // 'user@domain.com'
 */
export function normalizeLightningAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return ''
  }

  return address.trim().toLowerCase()
}

/**
 * Detect the type of input (invoice, address, e-cash request, etc.)
 *
 * @param input - Input string to analyze
 * @returns The detected input type
 *
 * @example
 * detectInputType('lnbc123...') // 'bolt11'
 * detectInputType('user@getalby.com') // 'lightning_address'
 * detectInputType('creqaABC...') // 'ecash_request'
 * detectInputType('cashuAeyJ...') // 'cashu_token'
 * detectInputType('random text') // 'unknown'
 */
export function detectInputType(input: string): InputType {
  if (!input || typeof input !== 'string') {
    return 'unknown'
  }

  const trimmed = input.trim()

  if (!trimmed) {
    return 'unknown'
  }

  // Check in order of specificity
  if (isBolt11Invoice(trimmed)) {
    return 'bolt11'
  }

  if (isEcashRequest(trimmed)) {
    return 'ecash_request'
  }

  if (isCashuToken(trimmed)) {
    return 'cashu_token'
  }

  if (isLightningAddress(trimmed)) {
    return 'lightning_address'
  }

  return 'unknown'
}

/**
 * Validate and normalize any Lightning/e-cash input
 * Returns normalized string and detected type
 *
 * @param input - Input string to validate and normalize
 * @returns Object with normalized string and detected type
 *
 * @example
 * validateInput('lightning:lnbc123...')
 * // { normalized: 'lnbc123...', type: 'bolt11' }
 *
 * validateInput('  User@Domain.COM  ')
 * // { normalized: 'user@domain.com', type: 'lightning_address' }
 */
export function validateInput(input: string): {
  normalized: string
  type: InputType
} {
  if (!input || typeof input !== 'string') {
    return { normalized: '', type: 'unknown' }
  }

  const trimmed = input.trim()
  const type = detectInputType(trimmed)

  let normalized = trimmed

  // Apply type-specific normalization
  if (type === 'bolt11') {
    normalized = normalizeBolt11(trimmed)
  } else if (type === 'lightning_address') {
    normalized = normalizeLightningAddress(trimmed)
  }

  return { normalized, type }
}
