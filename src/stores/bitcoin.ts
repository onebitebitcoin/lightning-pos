import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bitcoinService, type BitcoinPriceData } from '@/services/bitcoin'

export const useBitcoinStore = defineStore('bitcoin', () => {
  const priceData = ref<BitcoinPriceData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // Computed properties
  const btcPriceKrw = computed(() => priceData.value?.krw || 0)
  const btcPriceUsd = computed(() => priceData.value?.usd || 0)
  
  const isDataStale = computed(() => {
    if (!lastUpdated.value) return true
    const now = new Date()
    const timeDiff = now.getTime() - lastUpdated.value.getTime()
    return timeDiff > 5 * 60 * 1000 // 5 minutes
  })

  const priceStatus = computed(() => {
    if (isLoading.value) return 'loading'
    if (error.value) return 'error'
    if (isDataStale.value) return 'stale'
    return 'fresh'
  })

  // Actions
  async function fetchBitcoinPrice(): Promise<void> {
    if (isLoading.value) return // Prevent multiple simultaneous requests

    isLoading.value = true
    error.value = null

    try {
      const data = await bitcoinService.getCurrentPrice()
      priceData.value = data
      lastUpdated.value = new Date()
    } catch (err: any) {
      error.value = err.message || '비트코인 가격을 가져오는데 실패했습니다'
      console.error('비트코인 가격 조회 오류:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Initialize price data on first load
  async function initialize(): Promise<void> {
    if (!priceData.value) {
      await fetchBitcoinPrice()
    }
  }

  // Convert KRW to satoshis
  function krwToSats(krwAmount: number): number {
    if (!btcPriceKrw.value) return 0
    return bitcoinService.krwToSats(krwAmount, btcPriceKrw.value)
  }

  // Convert satoshis to KRW
  function satsToKrw(sats: number): number {
    if (!btcPriceKrw.value) return 0
    return bitcoinService.satsToKrw(sats, btcPriceKrw.value)
  }

  // Format satoshis for display
  function formatSats(sats: number): string {
    return bitcoinService.formatSats(sats)
  }

  // Format Bitcoin price for display
  function formatBtcPrice(): string {
    if (!btcPriceKrw.value) return '₿ --'
    return `₿ ₩${Math.round(btcPriceKrw.value).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`
  }

  // Manual refresh
  async function refresh(): Promise<void> {
    bitcoinService.clearCache()
    await fetchBitcoinPrice()
  }

  // Clear error state
  function clearError(): void {
    error.value = null
  }

  // Auto-refresh price data every 5 minutes
  function startAutoRefresh(): () => void {
    const interval = setInterval(async () => {
      if (isDataStale.value) {
        await fetchBitcoinPrice()
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Return cleanup function
    return () => clearInterval(interval)
  }

  return {
    // State
    priceData,
    isLoading,
    error,
    lastUpdated,

    // Computed
    btcPriceKrw,
    btcPriceUsd,
    isDataStale,
    priceStatus,

    // Actions
    initialize,
    fetchBitcoinPrice,
    refresh,
    clearError,
    startAutoRefresh,
    krwToSats,
    satsToKrw,
    formatSats,
    formatBtcPrice
  }
})
