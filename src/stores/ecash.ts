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

  const before = proofs.value.length
  const existing = uniqueProofs([...proofs.value, ...parsed])
  proofs.value = existing
  serializeProofs(existing)
  return { added: Math.max(existing.length - before, 0), total: existing.length }
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
    importProofs,
    DEFAULT_MINT_URL
  }
})
