import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bitcoinService, type BitcoinPriceData, type FiatCurrency } from '@/services/bitcoin'

export const useBitcoinStore = defineStore('bitcoin', () => {
  const priceData = ref<BitcoinPriceData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)

  // Computed properties
  const btcPriceKrw = computed(() => priceData.value?.krw || 0)
  const btcPriceUsd = computed(() => priceData.value?.usd || 0)
  const btcPriceJpy = computed(() => priceData.value?.jpy || 0)
  
  const exchangeRateUsd = computed(() => priceData.value?.exchangeRates?.usd || 1350)
  const exchangeRateJpy = computed(() => priceData.value?.exchangeRates?.jpy || 9)

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

  // Manual refresh with 1-minute caching
  async function refresh(): Promise<void> {
    // Check if cache is still valid (within 1 minute)
    if (bitcoinService.isCacheValid()) {
      // Use cached data - just update from cache without new API call
      await fetchBitcoinPrice()
    } else {
      // Cache expired - clear and fetch new data
      bitcoinService.clearCache()
      await fetchBitcoinPrice()
    }
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

  function getBtcPriceByCurrency(currency: FiatCurrency): number {
    switch (currency) {
      case 'USD':
        return btcPriceUsd.value
      case 'JPY':
        return btcPriceJpy.value
      case 'KRW':
      default:
        return btcPriceKrw.value
    }
  }

  function fiatToSats(amount: number, currency: FiatCurrency = 'KRW'): number {
    const price = getBtcPriceByCurrency(currency) || btcPriceKrw.value
    return bitcoinService.convertToSats(amount, price)
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
    btcPriceJpy,
    exchangeRateUsd,
    exchangeRateJpy,
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
    formatBtcPrice,
    fiatToSats,
    getBtcPriceByCurrency
  }
})
