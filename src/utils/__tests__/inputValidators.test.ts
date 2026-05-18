import { describe, it, expect } from 'vitest'
import {
  isBolt11Invoice,
  isLightningAddress,
  isEcashRequest,
  isCashuToken,
  normalizeBolt11,
  normalizeLightningAddress,
  detectInputType,
  validateInput,
} from '../inputValidators'

describe('isBolt11Invoice', () => {
  it('detects mainnet invoice (lnbc)', () => {
    expect(isBolt11Invoice('lnbc1234567890abcdef')).toBe(true)
  })

  it('detects testnet invoice (lntb)', () => {
    expect(isBolt11Invoice('lntb1234567890abcdef')).toBe(true)
  })

  it('detects regtest invoice (lnbcrt)', () => {
    expect(isBolt11Invoice('lnbcrt1234567890abcdef')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isBolt11Invoice('LNBC1234567890')).toBe(true)
    expect(isBolt11Invoice('LnBc1234567890')).toBe(true)
  })

  it('trims whitespace before checking', () => {
    expect(isBolt11Invoice('  lnbc1234  ')).toBe(true)
  })

  it('returns false for lightning address', () => {
    expect(isBolt11Invoice('user@domain.com')).toBe(false)
  })

  it('returns false for cashu token', () => {
    expect(isBolt11Invoice('cashuAabc123')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isBolt11Invoice('')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isBolt11Invoice(null as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isBolt11Invoice(undefined as any)).toBe(false)
  })

  it('returns false for plain text', () => {
    expect(isBolt11Invoice('random text')).toBe(false)
  })
})

describe('isLightningAddress', () => {
  it('detects valid email-style address', () => {
    expect(isLightningAddress('user@getalby.com')).toBe(true)
    expect(isLightningAddress('test@walletofsatoshi.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isLightningAddress('USER@DOMAIN.COM')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isLightningAddress('  user@domain.com  ')).toBe(true)
  })

  it('detects LNURL prefix', () => {
    expect(isLightningAddress('lnurl1abc123def456')).toBe(true)
    expect(isLightningAddress('LNURL1ABC')).toBe(true)
  })

  it('returns false for BOLT11 invoice', () => {
    expect(isLightningAddress('lnbc1234567890')).toBe(false)
  })

  it('returns false for address without TLD', () => {
    expect(isLightningAddress('user@domain')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isLightningAddress('')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isLightningAddress(null as any)).toBe(false)
  })

  it('returns false for plain text', () => {
    expect(isLightningAddress('plaintext')).toBe(false)
  })
})

describe('isEcashRequest', () => {
  it('detects creqa prefix', () => {
    expect(isEcashRequest('creqaABC123XYZ')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isEcashRequest('CREQAABC123')).toBe(true)
    expect(isEcashRequest('CreqaAbc')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isEcashRequest('  creqaABC  ')).toBe(true)
  })

  it('returns false for cashu token', () => {
    expect(isEcashRequest('cashuAabc123')).toBe(false)
  })

  it('returns false for bolt11 invoice', () => {
    expect(isEcashRequest('lnbc1234')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isEcashRequest('')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isEcashRequest(null as any)).toBe(false)
  })
})

describe('isCashuToken', () => {
  it('detects cashuA prefix', () => {
    expect(isCashuToken('cashuAeyJrZXlzIjp')).toBe(true)
  })

  it('detects cashuB prefix', () => {
    expect(isCashuToken('cashuBeyJrZXlzIjp')).toBe(true)
  })

  it('is case-insensitive for cashu prefix', () => {
    expect(isCashuToken('CashuAtest')).toBe(true)
    expect(isCashuToken('CASHUATEST')).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isCashuToken('  cashuAtest  ')).toBe(true)
  })

  it('returns false for ecash request', () => {
    expect(isCashuToken('creqaABC123')).toBe(false)
  })

  it('returns false for bolt11 invoice', () => {
    expect(isCashuToken('lnbc1234')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isCashuToken('')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isCashuToken(null as any)).toBe(false)
  })
})

describe('normalizeBolt11', () => {
  it('removes lightning: prefix', () => {
    expect(normalizeBolt11('lightning:lnbc1234')).toBe('lnbc1234')
  })

  it('removes bitcoin: prefix', () => {
    expect(normalizeBolt11('bitcoin:lnbc1234')).toBe('lnbc1234')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeBolt11('  lnbc1234  ')).toBe('lnbc1234')
  })

  it('is case-insensitive for prefix removal', () => {
    expect(normalizeBolt11('LIGHTNING:lnbc1234')).toBe('lnbc1234')
    expect(normalizeBolt11('Bitcoin:lnbc1234')).toBe('lnbc1234')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeBolt11('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(normalizeBolt11(null as any)).toBe('')
  })

  it('leaves already clean invoice unchanged', () => {
    expect(normalizeBolt11('lnbc1234567890')).toBe('lnbc1234567890')
  })
})

describe('normalizeLightningAddress', () => {
  it('converts to lowercase', () => {
    expect(normalizeLightningAddress('User@Domain.COM')).toBe('user@domain.com')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeLightningAddress('  user@domain.com  ')).toBe('user@domain.com')
  })

  it('keeps already lowercase address unchanged', () => {
    expect(normalizeLightningAddress('user@domain.com')).toBe('user@domain.com')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeLightningAddress('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(normalizeLightningAddress(null as any)).toBe('')
  })
})

describe('detectInputType', () => {
  it('detects bolt11 mainnet', () => {
    expect(detectInputType('lnbc1234567890')).toBe('bolt11')
  })

  it('detects bolt11 testnet', () => {
    expect(detectInputType('lntb1234567890')).toBe('bolt11')
  })

  it('detects ecash_request', () => {
    expect(detectInputType('creqaABC123XYZ')).toBe('ecash_request')
  })

  it('detects cashu_token', () => {
    expect(detectInputType('cashuAeyJrZXlz')).toBe('cashu_token')
  })

  it('detects lightning_address', () => {
    expect(detectInputType('user@getalby.com')).toBe('lightning_address')
  })

  it('detects lnurl as lightning_address', () => {
    expect(detectInputType('lnurl1abc123def')).toBe('lightning_address')
  })

  it('returns unknown for random text', () => {
    expect(detectInputType('random text')).toBe('unknown')
  })

  it('returns unknown for empty string', () => {
    expect(detectInputType('')).toBe('unknown')
  })

  it('returns unknown for whitespace only', () => {
    expect(detectInputType('   ')).toBe('unknown')
  })

  it('returns unknown for null', () => {
    expect(detectInputType(null as any)).toBe('unknown')
  })

  it('bolt11 takes priority over other types', () => {
    expect(detectInputType('lnbcrt1234567890')).toBe('bolt11')
  })
})

describe('validateInput', () => {
  it('detects and returns bolt11 type for plain invoice', () => {
    const result = validateInput('lnbc1234567890')
    expect(result.type).toBe('bolt11')
    expect(result.normalized).toBe('lnbc1234567890')
  })

  it('normalizes lightning address to lowercase', () => {
    const result = validateInput('  User@Domain.COM  ')
    expect(result.type).toBe('lightning_address')
    expect(result.normalized).toBe('user@domain.com')
  })

  it('identifies ecash request without extra normalization', () => {
    const result = validateInput('creqaABC123XYZ')
    expect(result.type).toBe('ecash_request')
    expect(result.normalized).toBe('creqaABC123XYZ')
  })

  it('identifies cashu token without extra normalization', () => {
    const result = validateInput('cashuAeyJrZXlz')
    expect(result.type).toBe('cashu_token')
    expect(result.normalized).toBe('cashuAeyJrZXlz')
  })

  it('returns unknown for unrecognized input', () => {
    const result = validateInput('not-a-valid-input')
    expect(result.type).toBe('unknown')
    expect(result.normalized).toBe('not-a-valid-input')
  })

  it('returns empty normalized for null', () => {
    const result = validateInput(null as any)
    expect(result.type).toBe('unknown')
    expect(result.normalized).toBe('')
  })

  it('returns empty normalized for empty string', () => {
    const result = validateInput('')
    expect(result.type).toBe('unknown')
    expect(result.normalized).toBe('')
  })
})
