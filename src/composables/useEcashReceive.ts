/**
 * Composable for e-cash receiving functionality
 * Handles cashu token parsing and validation
 */

import { ref } from 'vue'
import { useEcashStore, type CashuProof } from '@/stores/ecash'
import { useLocaleStore } from '@/stores/locale'
import { parseCashuTokenString } from '@/services/cashuTokens'

export interface EcashReceiveOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function useEcashReceive(options: EcashReceiveOptions = {}) {
  const { onSuccess, onError } = options

  const ecashStore = useEcashStore()
  const localeStore = useLocaleStore()
  const t = localeStore.t

  // State
  const receiveInput = ref('')
  const receiveError = ref('')
  const receivingEcash = ref(false)
  const showReceiveScanner = ref(false)
  const receiveScannerError = ref('')

  async function handleReceiveSubmit() {
    if (receivingEcash.value) {
      return
    }
    const rawInput = receiveInput.value.trim()
    if (!rawInput) {
      receiveError.value = t('ecash.receive.validation.required', 'e-cash 문자열을 입력하세요.')
      return
    }

    try {
      receivingEcash.value = true
      receiveError.value = ''

      let parsed
      try {
        parsed = parseCashuTokenString(rawInput)
      } catch (error) {
        console.error('Invalid e-cash token:', error)
        throw new Error(t('ecash.receive.validation.invalid', '유효한 e-cash 문자열이 아닙니다.'))
      }

      const allProofs: CashuProof[] = []
      let mintUrl = ecashStore.mintUrl

      // Extract proofs from all entries
      for (const entry of parsed.entries) {
        if (entry && entry.proofs && Array.isArray(entry.proofs)) {
          mintUrl = entry.mint || mintUrl
          for (const proof of entry.proofs) {
            if (proof && typeof proof === 'object') {
              allProofs.push({
                ...proof,
                mintUrl: proof.mintUrl || mintUrl
              })
            }
          }
        }
      }

      if (!allProofs.length) {
        throw new Error(t('ecash.receive.validation.noProofs', '추가할 토큰을 찾을 수 없습니다.'))
      }

      const freshProofs = allProofs

      if (!freshProofs.length) {
        throw new Error(t('ecash.receive.validation.noProofs', '추가할 토큰을 찾을 수 없습니다.'))
      }

      ecashStore.addProofs(freshProofs, mintUrl)
      ecashStore.refreshHoldings()

      const totalAmount = freshProofs.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const successMsg = t('ecash.receive.success', '새 e-cash 토큰 {count}개를 추가했습니다. (총 {amount} sats)', {
        count: freshProofs.length,
        amount: totalAmount
      })

      if (onSuccess) onSuccess(successMsg)

      receiveInput.value = ''
      receiveError.value = ''
    } catch (error) {
      console.error('Failed to receive e-cash:', error)
      const fallback = t('ecash.receive.errors.generic', 'e-cash 토큰을 추가하지 못했습니다. 다시 시도해주세요.')
      const errorMsg = (error as any)?.message ? String((error as any).message) : fallback
      receiveError.value = errorMsg
      if (onError) onError(errorMsg)
    } finally {
      receivingEcash.value = false
    }
  }

  function toggleReceiveScanner() {
    showReceiveScanner.value = !showReceiveScanner.value
    receiveScannerError.value = ''
  }

  function handleReceiveScannerResult(value: string) {
    receiveInput.value = value
    showReceiveScanner.value = false
    receiveScannerError.value = ''
  }

  function handleReceiveScannerError(message: string) {
    receiveScannerError.value = message
  }

  function resetReceive() {
    receiveInput.value = ''
    receiveError.value = ''
    receivingEcash.value = false
    showReceiveScanner.value = false
    receiveScannerError.value = ''
  }

  return {
    // State
    receiveInput,
    receiveError,
    receivingEcash,
    showReceiveScanner,
    receiveScannerError,

    // Methods
    handleReceiveSubmit,
    toggleReceiveScanner,
    handleReceiveScannerResult,
    handleReceiveScannerError,
    resetReceive
  }
}
