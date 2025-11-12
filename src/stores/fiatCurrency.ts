import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FiatCurrency } from '@/services/bitcoin'

const fiatCurrencies = ['KRW', 'USD', 'JPY'] as const

const currencySymbols: Record<FiatCurrency, string> = {
  KRW: '₩',
  USD: '$',
  JPY: '¥'
}

const currencyLocales: Record<FiatCurrency, string> = {
  KRW: 'ko-KR',
  USD: 'en-US',
  JPY: 'ja-JP'
}

const currencyDisplayNames: Record<FiatCurrency, string> = {
  KRW: '대한민국 원 (KRW)',
  USD: '미국 달러 (USD)',
  JPY: '일본 엔 (JPY)'
}

export const useFiatCurrencyStore = defineStore('fiatCurrency', () => {
  const savedCurrency = localStorage.getItem('settings_fiat_currency') as FiatCurrency | null
  const selectedCurrency = ref<FiatCurrency>(
    savedCurrency && (fiatCurrencies as readonly string[]).includes(savedCurrency)
      ? savedCurrency
      : 'KRW'
  )

  function setCurrency(next: FiatCurrency) {
    selectedCurrency.value = next
    localStorage.setItem('settings_fiat_currency', next)
  }

  const formatter = computed(() => new Intl.NumberFormat(
    currencyLocales[selectedCurrency.value],
    {
      style: 'currency',
      currency: selectedCurrency.value,
      maximumFractionDigits: selectedCurrency.value === 'JPY' ? 0 : 2
    }
  ))

  const displayLabel = computed(() => currencyDisplayNames[selectedCurrency.value])

  const formatAmount = (value: number): string => formatter.value.format(Number(value) || 0)

  return {
    availableCurrencies: fiatCurrencies,
    currencySymbols,
    currencyLocales,
    currencyDisplayNames,
    selectedCurrency,
    setCurrency,
    formatter,
    formatAmount,
    displayLabel
  }
})
