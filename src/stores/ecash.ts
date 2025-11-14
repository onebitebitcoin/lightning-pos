import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type CashuProof = {
  amount: number
  secret?: string
  mintUrl?: string
  [key: string]: any
}

const PROOFS_KEY = 'cashu_proofs_v2'
const MINT_URL_KEY = 'cashu_mint_url'
export const DEFAULT_MINT_URL = 'https://mint.coinos.io'

function parseProofs(raw: string | null): CashuProof[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (Array.isArray(data)) {
      return data as CashuProof[]
    }
    if (Array.isArray(data?.proofs)) {
      return data.proofs as CashuProof[]
    }
    return []
  } catch (error) {
    console.error('Failed to parse Cashu proofs from storage:', error)
    return []
  }
}

function serializeProofs(proofs: CashuProof[]) {
  try {
    localStorage.setItem(PROOFS_KEY, JSON.stringify(proofs))
  } catch (error) {
    console.error('Failed to save Cashu proofs:', error)
  }
}

function normalizeMintUrl(url: string): string {
  const trimmed = (url || '').trim()
  if (!trimmed) return DEFAULT_MINT_URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

function uniqueProofs(proofs: CashuProof[]): CashuProof[] {
  const map = new Map<string, CashuProof>()
  for (const proof of proofs || []) {
    const key = proof?.secret || JSON.stringify(proof)
    if (!map.has(key)) {
      map.set(key, proof)
    }
  }
  return Array.from(map.values())
}

export const useEcashStore = defineStore('ecash', () => {
  const mintUrl = ref<string>(normalizeMintUrl(localStorage.getItem(MINT_URL_KEY) || DEFAULT_MINT_URL))
  const proofs = ref<CashuProof[]>([])

  function loadProofs() {
    proofs.value = uniqueProofs(parseProofs(localStorage.getItem(PROOFS_KEY))).map(proof => ({
      ...proof,
      mintUrl: proof.mintUrl || mintUrl.value || DEFAULT_MINT_URL
    }))
  }

  function initialize() {
    mintUrl.value = normalizeMintUrl(localStorage.getItem(MINT_URL_KEY) || DEFAULT_MINT_URL)
    loadProofs()
  }

  function setMintUrl(value: string) {
    mintUrl.value = normalizeMintUrl(value)
    localStorage.setItem(MINT_URL_KEY, mintUrl.value)
  }

  function refreshHoldings() {
    loadProofs()
  }

  const holdings = computed(() => {
    const byMint = new Map<string, { mintUrl: string; amount: number; count: number }>()
    for (const proof of proofs.value) {
      const key = proof.mintUrl || mintUrl.value || DEFAULT_MINT_URL
      const entry = byMint.get(key) || { mintUrl: key, amount: 0, count: 0 }
      entry.amount += Number(proof.amount || 0)
      entry.count += 1
      byMint.set(key, entry)
    }
    return Array.from(byMint.values()).sort((a, b) => b.amount - a.amount)
  })

  const totalSats = computed(() => holdings.value.reduce((sum, entry) => sum + entry.amount, 0))
  const proofsCount = computed(() => proofs.value.length)

  function exportProofs(pretty = true) {
    try {
      return JSON.stringify(proofs.value, null, pretty ? 2 : 0)
    } catch (error) {
      console.error('Failed to export proofs:', error)
      return '[]'
    }
  }

  function addProofs(newProofs: CashuProof[] = [], mintOverride?: string) {
    if (!Array.isArray(newProofs) || newProofs.length === 0) {
      return { added: 0, total: proofs.value.length }
    }

    const normalizedMint = mintOverride || mintUrl.value || DEFAULT_MINT_URL
    const normalized = newProofs
      .filter(proof => proof && typeof proof === 'object')
      .map(proof => ({
        ...proof,
        mintUrl: proof.mintUrl || normalizedMint
      }))

    if (!normalized.length) {
      return { added: 0, total: proofs.value.length }
    }

    const before = proofs.value.length
    const merged = uniqueProofs([...proofs.value, ...normalized])
    proofs.value = merged
    serializeProofs(merged)
    return { added: Math.max(merged.length - before, 0), total: merged.length }
  }

  function setProofs(next: CashuProof[]) {
    const normalized = uniqueProofs(next || [])
    proofs.value = normalized
    serializeProofs(normalized)
  }

  function removeProofs(toRemove: CashuProof[] = []) {
    if (!Array.isArray(toRemove) || toRemove.length === 0) {
      return { removed: 0, total: proofs.value.length }
    }
    const removeKeys = new Set(toRemove.map(proof => proof?.secret || JSON.stringify(proof)))
    const remaining = proofs.value.filter(proof => !removeKeys.has(proof?.secret || JSON.stringify(proof)))
    const removed = Math.max(proofs.value.length - remaining.length, 0)
    setProofs(remaining)
    return { removed, total: remaining.length }
  }

  function selectProofsForAmount(target: number) {
    const normalizedTarget = Math.max(Number(target) || 0, 0)
    if (!normalizedTarget) {
      return { ok: false, picked: [], total: 0 }
    }

    const availableProofs = uniqueProofs(proofs.value)
      .slice()
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))

    const picked: CashuProof[] = []
    let total = 0

    for (const proof of availableProofs) {
      picked.push(proof)
      total += Number(proof.amount || 0)
      if (total >= normalizedTarget) {
        break
      }
    }

    if (total < normalizedTarget) {
      return { ok: false, picked: [], total: 0 }
    }

    const uniquePicked = uniqueProofs(picked)
    const uniqueTotal = uniquePicked.reduce((sum, proof) => sum + Number(proof?.amount || 0), 0)
    return { ok: true, picked: uniquePicked, total: uniqueTotal }
  }

  function getProofsSnapshot() {
    return uniqueProofs(proofs.value)
  }

  function importProofs(input: string | CashuProof[]) {
    let parsed: CashuProof[] = []
    try {
      if (typeof input === 'string') {
        parsed = JSON.parse(input)
      } else {
        parsed = input
      }
    } catch (error) {
      console.error('Failed to import proofs:', error)
      parsed = []
    }
    if (!Array.isArray(parsed)) {
      return { added: 0, total: proofs.value.length }
    }

    return addProofs(parsed)
  }

  return {
    mintUrl,
    proofs,
    holdings,
    totalSats,
    proofsCount,
    initialize,
    setMintUrl,
    refreshHoldings,
    exportProofs,
    addProofs,
    removeProofs,
    selectProofsForAmount,
    getProofsSnapshot,
    importProofs,
    DEFAULT_MINT_URL
  }
})
