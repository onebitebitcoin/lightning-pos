export type Nut18Transport = {
  t: string
  a: string
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
