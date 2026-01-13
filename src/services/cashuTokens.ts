import type { CashuProof } from '@/stores/ecash'

type ParsedTokenEntry = {
  mint: string
  proofs: CashuProof[]
  unit?: string
}

export type ParsedCashuToken = {
  entries: ParsedTokenEntry[]
  unit?: string
  memo?: string
  version: string
}

type CborEncodable = string | number | boolean | null | Uint8Array | CborArray | CborMap

interface CborArray extends Array<CborEncodable> {}

interface CborMap {
  [key: string]: CborEncodable
}

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null

type MaybeHexBuffer = { toString: (encoding?: string) => string }

function isNodeBuffer(value: unknown): value is MaybeHexBuffer {
  return typeof Buffer !== 'undefined' && Buffer.isBuffer(value)
}

function bufferToHex(value: ArrayBuffer | Uint8Array | number[] | MaybeHexBuffer | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Uint8Array) {
    return Array.from(value)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  if (Array.isArray(value)) {
    return bufferToHex(Uint8Array.from(value))
  }

  if (value instanceof ArrayBuffer) {
    return bufferToHex(new Uint8Array(value))
  }

  if (isNodeBuffer(value)) {
    return value.toString('hex')
  }

  if (typeof value === 'object' && value && 'type' in value && (value as any).type === 'Buffer') {
    const data = Array.isArray((value as any).data) ? (value as any).data : []
    return bufferToHex(Uint8Array.from(data))
  }

  return ''
}

function valueToString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }
  if (value instanceof Uint8Array || value instanceof ArrayBuffer || Array.isArray(value)) {
    return bufferToHex(value as any)
  }
  if (isNodeBuffer(value)) {
    return value.toString('hex')
  }
  if (typeof value === 'object' && value && 'type' in value && (value as any).type === 'Buffer') {
    const data = Array.isArray((value as any).data) ? (value as any).data : []
    return bufferToHex(Uint8Array.from(data))
  }
  return ''
}

function decodeBase64ToBytes(payload: string): Uint8Array {
  let normalized = (payload || '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4)
  normalized += '='.repeat(padding)

  if (typeof atob === 'function') {
    const binary = atob(normalized)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(normalized, 'base64')
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  }

  throw new Error('Base64 decoding is not supported in this environment')
}

function decodeBase64ToString(payload: string): string {
  const bytes = decodeBase64ToBytes(payload)
  if (textDecoder) {
    return textDecoder.decode(bytes)
  }
  let result = ''
  for (let i = 0; i < bytes.length; i += 1) {
    result += String.fromCharCode(bytes[i])
  }
  return result
}

function normalizeDleq(raw: any) {
  if (!raw || typeof raw !== 'object') {
    return undefined
  }
  const e = valueToString(raw.e)
  const s = valueToString(raw.s)
  const r = valueToString(raw.r)
  if (!e && !s && !r) {
    return undefined
  }
  return {
    ...(e ? { e } : {}),
    ...(s ? { s } : {}),
    ...(r ? { r } : {})
  }
}

function normalizeProof(raw: any, fallbackId?: string): CashuProof | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const amount = Number(raw.amount ?? raw.a ?? 0)
  const secret = valueToString(raw.secret ?? raw.s)
  if (!amount || amount <= 0 || !secret) {
    return null
  }

  const C = valueToString(raw.C ?? raw.c)
  const id = valueToString(raw.id ?? raw.keyset_id ?? raw.keysetId ?? raw.i ?? fallbackId)
  const dleq = normalizeDleq(raw.dleq ?? raw.d)

  const proof: CashuProof = {
    amount,
    secret,
    ...(C ? { C } : {}),
    ...(id ? { id } : {}),
    ...(dleq ? { dleq } : {})
  }

  return proof
}

function normalizeProofList(input: any, fallbackId?: string): CashuProof[] {
  if (!Array.isArray(input)) {
    return []
  }
  return input
    .map(item => normalizeProof(item, fallbackId))
    .filter((proof): proof is CashuProof => !!proof)
}

function parseJsonTokenObject(raw: any, version: string): ParsedCashuToken {
  const tokenEntries: ParsedTokenEntry[] = []
  const tokenArray = Array.isArray(raw?.token)
    ? raw.token
    : Array.isArray(raw?.tokens)
      ? raw.tokens
      : []

  tokenArray.forEach((entry: any) => {
    if (!entry || typeof entry !== 'object') return
    const mint = valueToString(entry.mint || entry.m)
    const proofs = normalizeProofList(entry.proofs || entry.p, entry.id)
    if (!mint || !proofs.length) {
      return
    }
    const normalized = proofs.map(proof => ({
      ...proof,
      mintUrl: mint
    }))
    tokenEntries.push({
      mint,
      proofs: normalized,
      unit: entry.unit || raw?.unit
    })
  })

  return {
    entries: tokenEntries,
    unit: raw?.unit,
    memo: raw?.memo,
    version
  }
}

function parseCashuJsonPayload(payload: string): ParsedCashuToken {
  const json = decodeBase64ToString(payload)
  const data = JSON.parse(json)
  return parseJsonTokenObject(data, 'A')
}

function parseLiteralJsonToken(raw: string): ParsedCashuToken {
  const data = JSON.parse(raw)
  return parseJsonTokenObject(data, 'JSON')
}

function decodeCborItem(data: Uint8Array, startOffset = 0): { value: CborEncodable; offset: number } {
  if (startOffset >= data.length) {
    throw new Error('CBOR decode error: unexpected end')
  }

  const initialByte = data[startOffset]
  const majorType = initialByte >> 5
  const additionalInfo = initialByte & 0x1f
  let offset = startOffset + 1

  const readUint = (): { value: number | bigint; offset: number } => {
    if (additionalInfo < 24) {
      return { value: additionalInfo, offset }
    }
    if (additionalInfo === 24) {
      return { value: data[offset], offset: offset + 1 }
    }
    if (additionalInfo === 25) {
      const value = (data[offset] << 8) | data[offset + 1]
      return { value, offset: offset + 2 }
    }
    if (additionalInfo === 26) {
      const value =
        (data[offset] << 24) |
        (data[offset + 1] << 16) |
        (data[offset + 2] << 8) |
        data[offset + 3]
      return { value: value >>> 0, offset: offset + 4 }
    }
    if (additionalInfo === 27) {
      let value = 0n
      for (let i = 0; i < 8; i += 1) {
        value = (value << 8n) | BigInt(data[offset + i])
      }
      return { value, offset: offset + 8 }
    }
    if (additionalInfo === 31) {
      throw new Error('Indefinite lengths are not supported')
    }
    throw new Error('Unsupported CBOR integer encoding')
  }

  const readLength = (): number => {
    const { value, offset: nextOffset } = readUint()
    offset = nextOffset
    return Number(value)
  }

  switch (majorType) {
    case 0: {
      const { value, offset: nextOffset } = readUint()
      return { value: Number(value), offset: nextOffset }
    }
    case 1: {
      const { value, offset: nextOffset } = readUint()
      return { value: -1 - Number(value), offset: nextOffset }
    }
    case 2: {
      const length = readLength()
      const end = offset + length
      const slice = data.subarray(offset, end)
      offset = end
      return { value: slice, offset }
    }
    case 3: {
      const length = readLength()
      const end = offset + length
      const slice = data.subarray(offset, end)
      offset = end
      if (textDecoder) {
        return { value: textDecoder.decode(slice), offset }
      }
      let str = ''
      for (let i = 0; i < slice.length; i += 1) {
        str += String.fromCharCode(slice[i])
      }
      return { value: str, offset }
    }
    case 4: {
      const length = readLength()
      const arr: CborEncodable[] = []
      for (let i = 0; i < length; i += 1) {
        const result = decodeCborItem(data, offset)
        arr.push(result.value)
        offset = result.offset
      }
      return { value: arr, offset }
    }
    case 5: {
      const length = readLength()
      const map: Record<string, CborEncodable> = {}
      for (let i = 0; i < length; i += 1) {
        const keyResult = decodeCborItem(data, offset)
        offset = keyResult.offset
        const valueResult = decodeCborItem(data, offset)
        offset = valueResult.offset
        map[String(keyResult.value)] = valueResult.value
      }
      return { value: map, offset }
    }
    case 7: {
      if (additionalInfo === 20) return { value: false, offset }
      if (additionalInfo === 21) return { value: true, offset }
      if (additionalInfo === 22) return { value: null, offset }
      throw new Error(`Unsupported CBOR simple value: ${additionalInfo}`)
    }
    default:
      throw new Error(`Unsupported CBOR major type: ${majorType}`)
  }
}

function decodeCborValue(data: Uint8Array): CborEncodable {
  const { value } = decodeCborItem(data, 0)
  return value
}

function parseCashuCborPayload(payload: string): ParsedCashuToken {
  const bytes = decodeBase64ToBytes(payload)
  const decoded = decodeCborValue(bytes)
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
    throw new Error('Invalid CBOR token payload')
  }

  const mintFallback = valueToString((decoded as any).m || (decoded as any).mint)
  const tokens = Array.isArray((decoded as any).t) ? ((decoded as any).t as any[]) : []
  const entries: ParsedTokenEntry[] = []

  tokens.forEach(entry => {
    if (!entry || typeof entry !== 'object') return
    const mint = valueToString(entry.m || mintFallback)
    const keysetId = valueToString(entry.i)
    const proofs = normalizeProofList(entry.p, keysetId).map(proof => ({
      ...proof,
      mintUrl: mint
    }))
    if (mint && proofs.length) {
      entries.push({
        mint,
        proofs,
        unit: entry.u || (decoded as any).u
      })
    }
  })

  if (!entries.length && mintFallback) {
    const proofs = normalizeProofList((decoded as any).p, (decoded as any).i).map(proof => ({
      ...proof,
      mintUrl: mintFallback
    }))
    if (proofs.length) {
      entries.push({
        mint: mintFallback,
        proofs,
        unit: (decoded as any).u
      })
    }
  }

  return {
    entries,
    unit: (decoded as any).u,
    memo: (decoded as any).memo,
    version: 'B'
  }
}

export function parseCashuTokenString(value: string): ParsedCashuToken {
  if (!value) {
    throw new Error('Token string is empty')
  }

  const trimmed = value.trim()
  const withoutPrefix = trimmed.toLowerCase().startsWith('cashu:') ? trimmed.slice(6) : trimmed

  if (withoutPrefix.toLowerCase().startsWith('cashu')) {
    const sanitized = withoutPrefix.replace(/\s+/g, '')
    if (sanitized.length <= 6) {
      throw new Error('Token payload is missing')
    }
    const version = sanitized.charAt(5)
    const payload = sanitized.slice(6)
    if (!payload) {
      throw new Error('Token payload is missing')
    }
    if (version === 'A' || version === 'a') {
      return parseCashuJsonPayload(payload)
    }
    if (version === 'B' || version === 'b') {
      return parseCashuCborPayload(payload)
    }
    throw new Error(`Unsupported token version: ${version}`)
  }

  if (withoutPrefix.startsWith('{') || withoutPrefix.startsWith('[')) {
    return parseLiteralJsonToken(withoutPrefix)
  }

  throw new Error('Invalid e-cash token format')
}
