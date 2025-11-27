export type Nut18Transport = {
  t?: string
  type?: string
  a?: string
  address?: string
  url?: string
  g?: string[]
}

export type Nut18PaymentRequestParams = {
  id: string
  amount: number
  unit?: string
  single_use?: boolean
  mints?: string[]
  description?: string
  transports?: Nut18Transport[]
}

type CborEncodable = string | number | boolean | null | CborArray | CborMap

interface CborArray extends Array<CborEncodable> {}

interface CborMap {
  [key: string]: CborEncodable
}

const textEncoder = new TextEncoder()
const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null

/**
 * Create a Cashu NUT-18 payment request string (creqA...)
 */
export function createPaymentRequest({
  id,
  amount,
  unit = 'sat',
  single_use = true,
  mints,
  description,
  transports = [],
}: Nut18PaymentRequestParams): string {
  if (!id) {
    throw new Error('Payment ID is required')
  }
  const normalizedAmount = Math.max(0, Math.round(amount || 0))
  if (!normalizedAmount) {
    throw new Error('Amount must be greater than zero')
  }

  const payload: Record<string, CborEncodable> = {
    i: id,
    a: normalizedAmount,
  }

  if (unit) payload.u = unit
  if (typeof single_use === 'boolean') payload.s = single_use

  const normalizedMints = (mints || [])
    .map(mint => mint?.trim())
    .filter((mint): mint is string => !!mint)
  if (normalizedMints.length) {
    payload.m = normalizedMints
  }

  if (description) {
    payload.d = description
  }

  const normalizedTransports = (transports || []).filter(Boolean)
  if (normalizedTransports.length) {
    payload.t = normalizedTransports as unknown as CborEncodable
  }

  const cborEncoded = encodeCbor(payload)
  const base64 = arrayBufferToBase64(cborEncoded.buffer)
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `creqA${base64url}`
}

/**
 * Helper to define a HTTP POST transport for NUT-18
 */
export function createHttpPostTransport(url: string): Nut18Transport {
  return {
    t: 'post',
    a: url,
    g: [],
  }
}

function encodeCbor(value: CborEncodable): Uint8Array {
  const bytes: number[] = []
  encodeItem(value, bytes)
  return Uint8Array.from(bytes)
}

function encodeItem(value: CborEncodable, bytes: number[]) {
  if (value === null) {
    bytes.push(0xf6)
    return
  }

  switch (typeof value) {
    case 'number':
      if (!Number.isFinite(value) || value < 0) {
        throw new Error('CBOR encoder only supports finite positive integers')
      }
      encodeUnsigned(BigInt(Math.round(value)), bytes)
      return
    case 'string':
      encodeString(value, bytes)
      return
    case 'boolean':
      bytes.push(value ? 0xf5 : 0xf4)
      return
    case 'object':
      if (Array.isArray(value)) {
        encodeArray(value, bytes)
      } else {
        encodeMap(value as Record<string, CborEncodable>, bytes)
      }
      return
    default:
      throw new Error(`CBOR encoder cannot serialize value of type ${typeof value}`)
  }
}

function encodeUnsigned(value: bigint, bytes: number[], majorType = 0) {
  if (value < 0n) {
    throw new Error('CBOR encoder only supports unsigned integers')
  }

  if (value < 24n) {
    bytes.push((majorType << 5) | Number(value))
    return
  }

  if (value <= 0xffn) {
    bytes.push((majorType << 5) | 24, Number(value))
    return
  }

  if (value <= 0xffffn) {
    bytes.push((majorType << 5) | 25, Number(value >> 8n), Number(value & 0xffn))
    return
  }

  if (value <= 0xffffffffn) {
    bytes.push((majorType << 5) | 26)
    pushBytes(value, bytes, 4)
    return
  }

  if (value <= 0xffffffffffffffffn) {
    bytes.push((majorType << 5) | 27)
    pushBytes(value, bytes, 8)
    return
  }

  throw new Error('CBOR encoder does not support integers larger than 64 bits')
}

function pushBytes(value: bigint, bytes: number[], count: number) {
  for (let shift = (count - 1) * 8; shift >= 0; shift -= 8) {
    bytes.push(Number((value >> BigInt(shift)) & 0xffn))
  }
}

function encodeLength(majorType: number, length: number, bytes: number[]) {
  encodeUnsigned(BigInt(length), bytes, majorType)
}

function encodeString(value: string, bytes: number[]) {
  const encoded = textEncoder.encode(value)
  encodeLength(3, encoded.length, bytes)
  for (const byte of encoded) {
    bytes.push(byte)
  }
}

function encodeArray(values: CborEncodable[], bytes: number[]) {
  encodeLength(4, values.length, bytes)
  for (const entry of values) {
    encodeItem(entry, bytes)
  }
}

function encodeMap(record: Record<string, CborEncodable>, bytes: number[]) {
  const entries = Object.entries(record).filter(([, value]) => value !== undefined)
  encodeLength(5, entries.length, bytes)
  for (const [key, value] of entries) {
    encodeString(key, bytes)
    encodeItem(value as CborEncodable, bytes)
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export type Nut18PaymentRequest = {
  id: string
  amount: number
  unit?: string
  single_use?: boolean
  mints?: string[]
  description?: string
  transports?: Nut18Transport[]
}

export function parsePaymentRequest(encoded: string): Nut18PaymentRequest {
  if (!encoded || !encoded.toLowerCase().startsWith('creqa')) {
    throw new Error('Invalid payment request format')
  }

  const payload = encoded.slice(5)
  const bytes = base64UrlToUint8Array(payload)
  const decoded = decodeCborValue(bytes)
  return {
    id: (decoded as any).i,
    amount: (decoded as any).a,
    unit: (decoded as any).u,
    single_use: (decoded as any).s,
    mints: (decoded as any).m,
    description: (decoded as any).d,
    transports: (decoded as any).t
  }
}

function decodeCborValue(data: Uint8Array) {
  const { value } = decodeCborItem(data, 0)
  return value
}

function decodeCborItem(data: Uint8Array, startOffset = 0): { value: CborEncodable; offset: number } {
  if (startOffset >= data.length) {
    throw new Error('CBOR decode error: unexpected end of data')
  }

  const initialByte = data[startOffset]
  const majorType = initialByte >> 5
  const additionalInfo = initialByte & 0x1f
  let offset = startOffset + 1

  const readUintValue = (): { value: number; offset: number } => {
    if (additionalInfo < 24) {
      return { value: additionalInfo, offset }
    }
    if (additionalInfo === 24) {
      const value = data[offset]
      return { value, offset: offset + 1 }
    }
    if (additionalInfo === 25) {
      const value = (data[offset] << 8) | data[offset + 1]
      return { value, offset: offset + 2 }
    }
    if (additionalInfo === 26) {
      const value =
        (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
      return { value: value >>> 0, offset: offset + 4 }
    }
    if (additionalInfo === 27) {
      let value = 0n
      for (let i = 0; i < 8; i += 1) {
        value = (value << 8n) | BigInt(data[offset + i])
      }
      return { value: Number(value), offset: offset + 8 }
    }
    throw new Error('Unsupported CBOR integer encoding')
  }

  const readLength = (): number => {
    const { value, offset: nextOffset } = readUintValue()
    offset = nextOffset
    return value
  }

  switch (majorType) {
    case 0: {
      const { value, offset: nextOffset } = readUintValue()
      return { value, offset: nextOffset }
    }
    case 1: {
      const { value, offset: nextOffset } = readUintValue()
      return { value: -1 - Number(value), offset: nextOffset }
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
      return { value: decodeURIComponent(escape(str)), offset }
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

export type Nut18PaymentPayload = {
  id: string
  amount: number
  memo?: string
  mint: string
  unit?: string
  proofs: any[]
}

export function createPaymentPayload({ id, amount, memo = '', mint, unit = 'sat', proofs }: Nut18PaymentPayload) {
  return {
    id,
    amount,
    memo,
    mint,
    unit,
    proofs
  }
}

export async function sendPaymentViaPost(url: string, payload: Record<string, unknown>) {
  // Use backend proxy to avoid CORS issues
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'
  const proxyUrl = `${apiBaseUrl}/payment-request-proxy/`

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      payload
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Payment failed: ${response.statusText}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Payment failed')
  }

  return response
}
