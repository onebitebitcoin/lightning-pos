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
  if (Array.isArray(mintKeys?.keysets) && mintKeys.keysets.length) {
    return mintKeys.keysets[0]
  }
  if (Array.isArray(mintKeys) && mintKeys.length) {
    return mintKeys[0]
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
    const blindedMessage = data?.B_ || data?.blindedMessage
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
  const outputDatas = OutputData.createRandomData(Number(amount), keyset)
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
