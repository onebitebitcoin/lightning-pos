import type { CashuProof } from '@/stores/ecash'

export type ProofState = 'SPENT' | 'UNSPENT' | 'PENDING' | 'UNKNOWN'

export interface CheckStateResult {
  Y: string  // The Y value derived from the proof's secret
  state: ProofState
  witness?: string
}

type MintStateResponse = {
  spendable?: any[]
  states?: any
}

function extractProofIdentifier(proof: CashuProof): string | null {
  if (!proof || typeof proof !== 'object') {
    return null
  }
  const yField = typeof (proof as any).Y === 'string' ? (proof as any).Y.trim() : ''
  if (yField) {
    return yField
  }
  const commitment = typeof (proof as any).C === 'string' ? (proof as any).C.trim() : ''
  if (commitment) {
    return commitment
  }
  return null
}

function normalizeState(value: any): ProofState {
  if (typeof value === 'boolean') {
    return value ? 'UNSPENT' : 'SPENT'
  }
  if (typeof value === 'string') {
    const upper = value.toUpperCase()
    if (upper === 'SPENT' || upper === 'UNSPENT' || upper === 'PENDING') {
      return upper as ProofState
    }
  }
  return 'UNKNOWN'
}

function mapSecretsByIdentifier(proofs: CashuProof[]) {
  const identifierToSecret = new Map<string, string>()
  const knownSecrets = new Set<string>()
  const identifiers: string[] = []
  let missingIdentifier = false

  proofs.forEach(proof => {
    if (proof?.secret) {
      knownSecrets.add(proof.secret)
    }
    const identifier = extractProofIdentifier(proof)
    if (!identifier) {
      missingIdentifier = true
      return
    }
    identifiers.push(identifier)
    if (proof?.secret) {
      identifierToSecret.set(identifier, proof.secret)
    }
  })

  return {
    identifiers,
    identifierToSecret,
    knownSecrets,
    hasCompleteIdentifiers: !missingIdentifier && identifiers.length === proofs.length
  }
}

export async function checkProofsState(
  mintUrl: string,
  proofs: CashuProof[]
): Promise<Map<string, ProofState>> {
  if (!proofs || proofs.length === 0) {
    return new Map()
  }

  try {
    const normalizedMintUrl = mintUrl.replace(/\/$/, '')

    const proofPayload = proofs.map(proof => ({
      amount: proof.amount,
      secret: proof.secret,
      C: (proof as any)?.C,
      id: (proof as any)?.id
    }))

    const { identifiers, identifierToSecret, knownSecrets, hasCompleteIdentifiers } = mapSecretsByIdentifier(proofs)

    const postJson = async (url: string, body: Record<string, unknown>): Promise<MintStateResponse | null> => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        if (!response.ok) {
          console.warn('[cashuCheck] Failed to check proof states:', url, response.status, response.statusText)
          return null
        }

        return await response.json()
      } catch (error) {
        console.warn('[cashuCheck] Error contacting mint:', url, error)
        return null
      }
    }

    let data: MintStateResponse | null = null

    if (hasCompleteIdentifiers && identifiers.length) {
      data = await postJson(`${normalizedMintUrl}/v1/checkstate`, { Ys: identifiers })
    }

    if (!data) {
      data = await postJson(`${normalizedMintUrl}/v1/check`, { proofs: proofPayload })
    }

    if (!data) {
      return new Map()
    }

    const states = new Map<string, ProofState>()

    const applyStateForSecret = (secret: string | undefined, value: any) => {
      if (!secret) return
      states.set(secret, normalizeState(value))
    }

    const applyStateForIndex = (index: number, value: any) => {
      const secret = proofs[index]?.secret
      applyStateForSecret(secret, value)
    }

    const applyStateForIdentifier = (identifier: string | undefined, value: any, index?: number) => {
      if (!identifier) {
        if (typeof index === 'number') {
          applyStateForIndex(index, value)
        }
        return
      }
      const mappedSecret = identifierToSecret.get(identifier) || (knownSecrets.has(identifier) ? identifier : undefined)
      if (mappedSecret) {
        applyStateForSecret(mappedSecret, value)
        return
      }
      if (typeof index === 'number') {
        applyStateForIndex(index, value)
      }
    }

    // The response format varies by mint, try to handle common formats
    if (Array.isArray(data.spendable)) {
      // Format: { spendable: [true, false, ...] }
      data.spendable.forEach((isSpendable: boolean, index: number) => {
        applyStateForIndex(index, isSpendable ? 'UNSPENT' : 'SPENT')
      })
    } else if (Array.isArray(data.states)) {
      // Format: { states: ['UNSPENT', 'SPENT', ...] } or array of objects
      data.states.forEach((state: any, index: number) => {
        if (state && typeof state === 'object' && !Array.isArray(state)) {
          applyStateForIdentifier(state.Y || state.y || state.identifier, state.state ?? state.status ?? state.value, index)
        } else {
          applyStateForIndex(index, state)
        }
      })
    } else if (data.states && typeof data.states === 'object') {
      // Format: { states: { 'secret1': 'SPENT', ... } }
      proofs.forEach(proof => {
        if (proof.secret && data.states[proof.secret]) {
          applyStateForSecret(proof.secret, data.states[proof.secret])
        }
      })
      Object.entries(data.states).forEach(([identifier, value]) => {
        applyStateForIdentifier(identifier, value)
      })
    }

    return states
  } catch (error) {
    console.error('[cashuCheck] Error checking proof states:', error)
    return new Map()
  }
}

export async function removeSpentProofs(
  mintUrl: string,
  proofs: CashuProof[]
): Promise<{ spent: CashuProof[]; unspent: CashuProof[]; checked: number }> {
  const states = await checkProofsState(mintUrl, proofs)

  const spent: CashuProof[] = []
  const unspent: CashuProof[] = []

  proofs.forEach(proof => {
    const state = states.get(proof.secret || '')
    if (state === 'SPENT') {
      spent.push(proof)
    } else if (state === 'UNSPENT') {
      unspent.push(proof)
    } else {
      // If unknown, keep it (better safe than sorry)
      unspent.push(proof)
    }
  })

  return { spent, unspent, checked: states.size }
}

export interface MintAvailability {
  available: boolean
  name?: string
  description?: string
  version?: string
  error?: string
}

export async function checkMintAvailability(mintUrl: string): Promise<MintAvailability> {
  try {
    const normalizedMintUrl = mintUrl.replace(/\/$/, '')

    // Try to get mint info from /v1/info endpoint
    const infoUrl = `${normalizedMintUrl}/v1/info`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(infoUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // If /v1/info fails, try /v1/keys as fallback
        return await checkMintKeys(normalizedMintUrl)
      }

      const data = await response.json()

      return {
        available: true,
        name: data.name || 'Unknown',
        description: data.description,
        version: data.version
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      // If info endpoint fails, try keys endpoint as fallback
      if (fetchError.name === 'AbortError') {
        return {
          available: false,
          error: 'Request timeout'
        }
      }

      return await checkMintKeys(normalizedMintUrl)
    }
  } catch (error: any) {
    console.error('[cashuCheck] Error checking mint availability:', error)
    return {
      available: false,
      error: error.message || 'Unknown error'
    }
  }
}

async function checkMintKeys(mintUrl: string): Promise<MintAvailability> {
  try {
    const keysUrl = `${mintUrl}/v1/keys`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(keysUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        available: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()

    // If we got valid keys data, the mint is available
    if (data && (data.keysets || data.keys)) {
      return {
        available: true,
        name: 'Available'
      }
    }

    return {
      available: false,
      error: 'Invalid response from mint'
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        available: false,
        error: 'Request timeout'
      }
    }

    return {
      available: false,
      error: error.message || 'Connection failed'
    }
  }
}
