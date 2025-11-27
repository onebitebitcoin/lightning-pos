const CASHU_ESM_URL = 'https://esm.sh/@cashu/cashu-ts@2.7.1'

type CashuModule = {
  OutputData: any
}

let cashuModulePromise: Promise<CashuModule> | null = null

async function loadCashuModule(): Promise<CashuModule> {
  if (!cashuModulePromise) {
    // eslint-disable-next-line no-new-func
    const dynamicImport = new Function('u', 'return import(u)')
    cashuModulePromise = dynamicImport(CASHU_ESM_URL)
  }
  return cashuModulePromise!
}

export interface SerializedOutputData {
  blindedMessage: string
  blindingFactor: string
  secret: number[] | string | Uint8Array
  amount?: number
  keysetId?: string
}

export interface CashuSwapOutput {
  amount: number
  B_: string
  id: string
}

function normalizeKeyset(mintKeys: any) {
  const pickFromArray = (arr: any[]) => {
    if (!arr.length) return null
    const byCurrent = mintKeys?.current_keyset
      ? arr.find(key => key?.id === mintKeys.current_keyset || key?.keyset_id === mintKeys.current_keyset)
      : null
    const active = arr.find(
      key => key?.active === true || key?.state === 'active' || key?.current === true || key?.is_active === true
    )
    return byCurrent || active || arr[0]
  }

  if (Array.isArray(mintKeys?.keysets)) {
    const picked = pickFromArray(mintKeys.keysets)
    if (picked) return picked
  }
  if (Array.isArray(mintKeys)) {
    const picked = pickFromArray(mintKeys)
    if (picked) return picked
  }
  if (mintKeys) {
    return mintKeys
  }
  throw new Error('Mint keys are missing')
}

function resolveKeysetId(keyset: any) {
  const id = keyset?.id || keyset?.keyset_id || keyset?.keysetId
  if (!id) {
    throw new Error('Mint keyset id is missing')
  }
  return String(id)
}

function splitAmountIntoDenominations(amount: number) {
  const denominations: number[] = []
  let remaining = Math.floor(amount)
  while (remaining > 0) {
    const power = Math.floor(Math.log2(remaining))
    const value = 2 ** power
    denominations.push(value)
    remaining -= value
  }
  return denominations
}

function ensureOutputAmounts(outputDatas: any[], amount: number) {
  const extracted = outputDatas
    .map(data => Number(data?.amount ?? data?.value ?? 0))
    .filter(value => Number.isFinite(value) && value > 0)

  if (extracted.length === outputDatas.length && extracted.every(value => value > 0)) {
    return extracted
  }

  return splitAmountIntoDenominations(amount)
}

function stringifyBlindedMessage(data: any) {
  if (!data) return ''

  const toHex = (value: any) => {
    if (!value) return ''
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return value.toString('hex')
    if (value instanceof Uint8Array || Array.isArray(value)) {
      return Array.from(value)
        .map((byte: number) => byte.toString(16).padStart(2, '0'))
        .join('')
    }
    return ''
  }

  // Try direct string access
  if (typeof data === 'string') return data
  if (typeof data?.B_ === 'string') return data.B_
  if (typeof data?.blindedMessage === 'string') return data.blindedMessage

  // Check if blindedMessage is an object with B_ property (Cashu v2.7.1 format)
  if (data?.blindedMessage && typeof data.blindedMessage === 'object') {
    if (typeof data.blindedMessage.B_ === 'string') {
      return data.blindedMessage.B_
    }
  }

  // Try toHex() method (for Point objects)
  if (data?.blindedMessage?.toHex && typeof data.blindedMessage.toHex === 'function') {
    try {
      const result = data.blindedMessage.toHex()
      if (result && typeof result === 'string') return result
    } catch (e) {
      // Ignore errors
    }
  }

  if (data?.B_?.toHex && typeof data.B_.toHex === 'function') {
    try {
      const result = data.B_.toHex()
      if (result && typeof result === 'string') return result
    } catch (e) {
      // Ignore errors
    }
  }

  // Try toHex property (might be a getter)
  if (typeof data?.blindedMessage?.toHex === 'string') return data.blindedMessage.toHex
  if (typeof data?.B_?.toHex === 'string') return data.B_.toHex

  // Try hex property
  if (typeof data?.blindedMessage?.hex === 'string') return data.blindedMessage.hex
  if (typeof data?.B_?.hex === 'string') return data.B_.hex

  // Try toString() but validate the result
  if (data?.blindedMessage?.toString && typeof data.blindedMessage.toString === 'function') {
    try {
      const result = data.blindedMessage.toString()
      if (result && typeof result === 'string' && !result.startsWith('[object') && result.length > 10) {
        return result
      }
    } catch (e) {
      // Ignore errors
    }
  }

  if (data?.B_?.toString && typeof data.B_.toString === 'function') {
    try {
      const result = data.B_.toString()
      if (result && typeof result === 'string' && !result.startsWith('[object') && result.length > 10) {
        return result
      }
    } catch (e) {
      // Ignore errors
    }
  }

  // Try array/buffer conversion
  const hexFromArray = toHex(data?.blindedMessage || data?.B_)
  if (hexFromArray) return hexFromArray

  return ''
}

export function buildSwapOutputsFromOutputDatas(outputDatas: any[], amountHint: number, mintKeys: any): CashuSwapOutput[] {
  if (!Array.isArray(outputDatas) || outputDatas.length === 0) {
    return []
  }

  const keyset = normalizeKeyset(mintKeys)
  const keysetId = resolveKeysetId(keyset)
  const outputAmounts = ensureOutputAmounts(outputDatas, Number(amountHint))

  if (outputAmounts.length !== outputDatas.length) {
    throw new Error('Failed to build blinded outputs for requested amount')
  }

  return outputDatas.map((data: any, index: number) => {
    const blindedMessage = stringifyBlindedMessage(data)
    if (!blindedMessage) {
      throw new Error('Missing blinded message in output data')
    }
    const resolvedId = data?.id || data?.keyset_id || data?.keysetId || keysetId
    return {
      amount: Number(outputAmounts[index]),
      B_: String(blindedMessage),
      id: String(resolvedId)
    }
  })
}

export async function createBlindedOutputs(amount: number, mintKeys: any) {
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  const module = await loadCashuModule()
  const { OutputData } = module
  if (!OutputData) {
    throw new Error('Cashu module not available')
  }

  const keyset = normalizeKeyset(mintKeys)

  if (typeof OutputData.createRandomData !== 'function') {
    throw new Error('OutputData.createRandomData is not a function. Cashu library version mismatch?')
  }

  const outputDatas = OutputData.createRandomData(Number(amount), keyset)

  if (!Array.isArray(outputDatas) || outputDatas.length === 0) {
    throw new Error('OutputData.createRandomData returned invalid data')
  }

  const outputs = buildSwapOutputsFromOutputDatas(outputDatas, Number(amount), mintKeys)

  return { outputDatas, outputs }
}

export async function signaturesToProofs(signatures: any[], mintKeys: any, outputDatas: any[]) {
  if (!Array.isArray(signatures) || signatures.length === 0) {
    return []
  }

  const module = await loadCashuModule()
  const { OutputData } = module
  if (!OutputData) {
    throw new Error('Cashu module not available')
  }

  const keyset = normalizeKeyset(mintKeys)

  return signatures.map((signature, index) => outputDatas[index].toProof(signature, keyset))
}

export function serializeOutputDatas(outputDatas: any[]): SerializedOutputData[] {
  if (!Array.isArray(outputDatas)) {
    return []
  }

  return outputDatas
    .map(output => {
      if (!output) return null
      const secretArray =
        output.secret instanceof Uint8Array ? Array.from(output.secret) : Array.isArray(output.secret) ? output.secret : []
      const blindingFactor =
        typeof output.blindingFactor === 'bigint'
          ? output.blindingFactor.toString()
          : (output.blindingFactor ?? '').toString()

      const serialized: SerializedOutputData = {
        blindedMessage: output.blindedMessage,
        blindingFactor,
        secret: secretArray
      }
      if (output?.amount) {
        serialized.amount = Number(output.amount)
      }
      if (output?.id || output?.keyset_id || output?.keysetId) {
        serialized.keysetId = String(output.id || output.keyset_id || output.keysetId)
      }
      return serialized
    })
    .filter(Boolean) as SerializedOutputData[]
}

function decodeSecret(value: SerializedOutputData['secret']): Uint8Array {
  if (value instanceof Uint8Array) {
    return value
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value)
  }
  if (typeof value === 'string') {
    try {
      const binary = atob(value)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    } catch {
      return new Uint8Array()
    }
  }
  return new Uint8Array()
}

function ensureBigInt(value: string | number | bigint) {
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value === 'number') {
    return BigInt(Math.floor(value))
  }
  return BigInt(value)
}

export async function deserializeOutputDatas(serialized: SerializedOutputData[]) {
  if (!Array.isArray(serialized) || serialized.length === 0) {
    return []
  }

  const module = await loadCashuModule()
  const { OutputData } = module
  if (!OutputData) {
    throw new Error('Cashu module not available')
  }

  return serialized
    .map(item => {
      try {
        if (!item?.blindedMessage || item?.blindingFactor === undefined || item?.secret === undefined) {
          return null
        }
        const factor = ensureBigInt(item.blindingFactor)
        const secret = decodeSecret(item.secret)
        const output = new OutputData(item.blindedMessage, factor, secret)
        if (item.amount && output) {
          output.amount = Number(item.amount)
        }
        if (item.keysetId && output) {
          output.id = item.keysetId
          output.keysetId = item.keysetId
        }
        return output
      } catch (error) {
        console.warn('Failed to deserialize OutputData:', error)
        return null
      }
    })
    .filter(Boolean)
}
