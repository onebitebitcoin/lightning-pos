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

  const keyset = Array.isArray(mintKeys?.keysets)
    ? mintKeys.keysets[0]
    : Array.isArray(mintKeys)
      ? mintKeys[0]
      : mintKeys

  const outputDatas = OutputData.createRandomData(Number(amount), keyset)
  const outputs = outputDatas.map((data: any) => data.blindedMessage)
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

  const keyset = Array.isArray(mintKeys?.keysets)
    ? mintKeys.keysets[0]
    : Array.isArray(mintKeys)
      ? mintKeys[0]
      : mintKeys

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

      return {
        blindedMessage: output.blindedMessage,
        blindingFactor,
        secret: secretArray
      }
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
        return new OutputData(item.blindedMessage, factor, secret)
      } catch (error) {
        console.warn('Failed to deserialize OutputData:', error)
        return null
      }
    })
    .filter(Boolean)
}
