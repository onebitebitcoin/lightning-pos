import type { CashuProof } from '@/stores/ecash'

export type ProofState = 'SPENT' | 'UNSPENT' | 'PENDING' | 'UNKNOWN'

export interface CheckStateResult {
  Y: string  // The Y value derived from the proof's secret
  state: ProofState
  witness?: string
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

    // Use /v1/check endpoint which accepts proofs directly
    const checkUrl = `${normalizedMintUrl}/v1/check`

    // Format proofs for check endpoint (only need { Ys: [...] })
    // Y is the public key derived from secret, but we'll send the full proof
    const proofsToCheck = proofs.map(proof => ({
      amount: proof.amount,
      secret: proof.secret,
      C: proof.C,
      id: proof.id
    }))

    const response = await fetch(checkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ proofs: proofsToCheck })
    })

    if (!response.ok) {
      console.warn('[cashuCheck] Failed to check proof states:', response.status, response.statusText)
      return new Map()
    }

    const data = await response.json()
    const states = new Map<string, ProofState>()

    // The response format varies by mint, try to handle common formats
    if (Array.isArray(data.spendable)) {
      // Format: { spendable: [true, false, ...] }
      data.spendable.forEach((isSpendable: boolean, index: number) => {
        const secret = proofs[index]?.secret
        if (secret) {
          states.set(secret, isSpendable ? 'UNSPENT' : 'SPENT')
        }
      })
    } else if (Array.isArray(data.states)) {
      // Format: { states: ['UNSPENT', 'SPENT', ...] }
      data.states.forEach((state: string, index: number) => {
        const secret = proofs[index]?.secret
        if (secret) {
          states.set(secret, state as ProofState)
        }
      })
    } else if (data.states && typeof data.states === 'object') {
      // Format: { states: { 'secret1': 'SPENT', ... } }
      proofs.forEach(proof => {
        if (proof.secret && data.states[proof.secret]) {
          states.set(proof.secret, data.states[proof.secret] as ProofState)
        }
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
