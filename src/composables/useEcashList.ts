/**
 * Composable for e-cash list and management functionality
 * Handles mint management, backup, restore, and deletion
 */

import { ref, computed, watch, onMounted, type Ref } from 'vue'
import { useEcashStore } from '@/stores/ecash'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useLocaleStore } from '@/stores/locale'

export interface EcashListOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function useEcashList(options: EcashListOptions = {}) {
  const { onSuccess, onError } = options

  const ecashStore = useEcashStore()
  const bitcoinStore = useBitcoinStore()
  const localeStore = useLocaleStore()
  const t = localeStore.t

  // State
  const mintUrlInput = ref('')
  const fileInput = ref<HTMLInputElement | null>(null)

  // Computed
  const ecashHoldings = computed(() => ecashStore.holdings)
  const hasEcashHoldings = computed(() => ecashStore.proofsCount > 0)
  const ecashBalance = computed(() => Number(ecashStore.totalSats || 0))
  const formattedBalance = computed(() => bitcoinStore.formatSats(ecashBalance.value))

  // Watch mint URL from store
  watch(
    () => ecashStore.mintUrl,
    value => {
      mintUrlInput.value = value
    }
  )

  // Initialize
  onMounted(async () => {
    await Promise.allSettled([ecashStore.initialize(), bitcoinStore.initialize()])
    mintUrlInput.value = ecashStore.mintUrl
  })

  function refreshHoldings() {
    ecashStore.refreshHoldings()
    const successMsg = t('ecash.list.refreshed', '잔액을 새로고침했습니다.')
    if (onSuccess) onSuccess(successMsg)
  }

  function saveMintUrl() {
    ecashStore.setMintUrl(mintUrlInput.value)
    const successMsg = t('ecash.list.mintSaved', 'Mint 서버 URL이 저장되었습니다.')
    if (onSuccess) onSuccess(successMsg)
  }

  function handleBackup() {
    try {
      const data = ecashStore.exportProofs(true)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.href = url
      link.download = `cashu-backup-${timestamp}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      const successMsg = t('ecash.list.backupSuccess', 'e-cash 백업 파일을 다운로드했습니다.')
      if (onSuccess) onSuccess(successMsg)
    } catch (error) {
      console.error('e-cash backup failed:', error)
      const errorMsg = t('ecash.list.backupFailed', 'e-cash 백업 파일을 만드는 데 실패했습니다.')
      if (onError) onError(errorMsg)
    }
  }

  function triggerRestore() {
    fileInput.value?.click()
  }

  async function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = ecashStore.importProofs(text)
      ecashStore.refreshHoldings()
      const successMsg = t('ecash.list.restoreSuccess', '{count}개의 토큰을 불러왔습니다.', { count: result.added })
      if (onSuccess) onSuccess(successMsg)
    } catch (error) {
      console.error('e-cash restore failed:', error)
      const errorMsg = t('ecash.list.restoreFailed', 'e-cash 복원에 실패했습니다. JSON 파일을 확인해주세요.')
      if (onError) onError(errorMsg)
    }

    input.value = ''
  }

  function deleteAllTokens() {
    const allProofs = ecashStore.getProofsSnapshot()

    if (
      !confirm(
        t(
          'ecash.list.confirmDelete',
          '모든 e-cash 토큰을 삭제하시겠습니까?\n\n총 토큰 수: {count}개\n총 금액: {amount} sats\n\n⚠️ 이 작업은 되돌릴 수 없습니다!',
          {
            count: allProofs.length,
            amount: allProofs.reduce((sum, p) => sum + Number(p.amount || 0), 0)
          }
        )
      )
    ) {
      return
    }

    if (!confirm(t('ecash.list.confirmDeleteAgain', '정말로 모든 토큰을 삭제하시겠습니까?'))) {
      return
    }

    ;(ecashStore as any).setProofs([])
    ecashStore.refreshHoldings()
    const successMsg = t('ecash.list.deleted', '모든 토큰이 삭제되었습니다.')
    if (onSuccess) onSuccess(successMsg)
  }

  return {
    // State
    mintUrlInput,
    fileInput,

    // Computed
    ecashHoldings,
    hasEcashHoldings,
    ecashBalance,
    formattedBalance,

    // Methods
    refreshHoldings,
    saveMintUrl,
    handleBackup,
    triggerRestore,
    handleFileChange,
    deleteAllTokens
  }
}
