import { describe, it, expect } from 'vitest'
import {
  safeNumber,
  formatPositive,
  formatPrice,
  formatKRW,
  formatSats,
  truncate,
  truncateMiddle,
} from '../formatters'

describe('safeNumber', () => {
  it('returns 0 for null', () => {
    expect(safeNumber(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(safeNumber(undefined)).toBe(0)
  })

  it('returns custom defaultValue for null', () => {
    expect(safeNumber(null, 100)).toBe(100)
  })

  it('returns number as-is for valid integers', () => {
    expect(safeNumber(42)).toBe(42)
    expect(safeNumber(0)).toBe(0)
    expect(safeNumber(-10)).toBe(-10)
  })

  it('returns number as-is for floats', () => {
    expect(safeNumber(3.14)).toBe(3.14)
  })

  it('returns defaultValue for NaN', () => {
    expect(safeNumber(NaN)).toBe(0)
    expect(safeNumber(NaN, 99)).toBe(99)
  })

  it('parses valid numeric strings', () => {
    expect(safeNumber('123')).toBe(123)
    expect(safeNumber('3.14')).toBe(3.14)
    expect(safeNumber('  42  ')).toBe(42)
  })

  it('strips commas from numeric strings', () => {
    expect(safeNumber('1,234')).toBe(1234)
    expect(safeNumber('1,234,567')).toBe(1234567)
  })

  it('returns defaultValue for non-numeric strings', () => {
    expect(safeNumber('abc')).toBe(0)
    expect(safeNumber('abc', 50)).toBe(50)
    expect(safeNumber('')).toBe(0)
  })

  it('converts boolean via Number()', () => {
    expect(safeNumber(true)).toBe(1)
    expect(safeNumber(false)).toBe(0)
  })
})

describe('formatPositive', () => {
  it('returns positive numbers unchanged', () => {
    expect(formatPositive(10)).toBe(10)
    expect(formatPositive(0.5)).toBe(0.5)
  })

  it('returns 0 for negative numbers', () => {
    expect(formatPositive(-5)).toBe(0)
    expect(formatPositive(-0.001)).toBe(0)
  })

  it('returns 0 for zero', () => {
    expect(formatPositive(0)).toBe(0)
  })

  it('returns positive defaultValue for invalid string input', () => {
    expect(formatPositive('abc', 1)).toBe(1)
  })

  it('returns 0 for null', () => {
    expect(formatPositive(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(formatPositive(undefined)).toBe(0)
  })

  it('parses positive string numbers', () => {
    expect(formatPositive('5')).toBe(5)
  })

  it('returns 0 for negative string numbers', () => {
    expect(formatPositive('-3')).toBe(0)
  })
})

describe('formatPrice', () => {
  it('formats integer with Korean locale thousand separators', () => {
    const result = formatPrice(1234)
    expect(result).toMatch(/1[,.]?234/)
  })

  it('formats zero as "0"', () => {
    expect(formatPrice(0)).toBe('0')
  })

  it('includes decimal places when specified', () => {
    const result = formatPrice(1234, { decimals: 2 })
    expect(result).toContain('.')
  })

  it('formats with KRW currency symbol', () => {
    const result = formatPrice(1000, { currency: 'KRW' })
    expect(result).toContain('₩')
  })

  it('formats with USD currency symbol', () => {
    const result = formatPrice(1000, { currency: 'USD', decimals: 2 })
    expect(result).toContain('$')
  })

  it('returns "0" for invalid string input', () => {
    expect(formatPrice('invalid')).toBe('0')
  })

  it('returns "0" for null', () => {
    expect(formatPrice(null)).toBe('0')
  })

  it('returns "0" for undefined', () => {
    expect(formatPrice(undefined)).toBe('0')
  })
})

describe('formatKRW', () => {
  it('includes Korean Won symbol', () => {
    expect(formatKRW(1000)).toContain('₩')
  })

  it('rounds to 0 decimals by default', () => {
    expect(formatKRW(1234.5)).not.toContain('.')
  })

  it('handles zero', () => {
    expect(formatKRW(0)).toContain('₩')
  })

  it('handles large amounts', () => {
    const result = formatKRW(100000)
    expect(result).toContain('₩')
  })
})

describe('formatSats', () => {
  it('formats with "sats" suffix', () => {
    expect(formatSats(1000)).toBe('1,000 sats')
  })

  it('formats large numbers with separators', () => {
    expect(formatSats(1000000)).toBe('1,000,000 sats')
  })

  it('formats zero', () => {
    expect(formatSats(0)).toBe('0 sats')
  })

  it('returns "0 sats" for invalid string input', () => {
    expect(formatSats('invalid')).toBe('0 sats')
  })

  it('returns "0 sats" for null', () => {
    expect(formatSats(null)).toBe('0 sats')
  })

  it('formats single digit', () => {
    expect(formatSats(1)).toBe('1 sats')
  })
})

describe('truncate', () => {
  it('returns string unchanged when shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns string unchanged when equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and appends ellipsis when too long', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })

  it('result length equals maxLength', () => {
    const result = truncate('hello world', 8)
    expect(result.length).toBe(8)
  })

  it('uses default maxLength of 20', () => {
    const result = truncate('a'.repeat(25))
    expect(result.length).toBe(20)
  })

  it('returns empty string for empty input', () => {
    expect(truncate('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(truncate(null as any)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(truncate(undefined as any)).toBe('')
  })

  it('supports custom ellipsis character', () => {
    expect(truncate('hello world', 6, '…')).toBe('hello…')
  })
})

describe('truncateMiddle', () => {
  it('returns string unchanged when shorter than combined chars', () => {
    expect(truncateMiddle('hello', 4, 4)).toBe('hello')
  })

  it('shows start and end of long string with ellipsis', () => {
    const result = truncateMiddle('lnbc1234567890abcdef1234567890', 6, 6)
    expect(result.startsWith('lnbc12')).toBe(true)
    expect(result.endsWith('567890')).toBe(true)
    expect(result).toContain('...')
  })

  it('returns empty string for empty input', () => {
    expect(truncateMiddle('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(truncateMiddle(null as any)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(truncateMiddle(undefined as any)).toBe('')
  })

  it('uses defaults of 6 start and 6 end chars', () => {
    const result = truncateMiddle('a'.repeat(20))
    expect(result).toBe('aaaaaa...aaaaaa')
  })
})
