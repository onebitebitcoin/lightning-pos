import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FiatCurrency } from '@/services/bitcoin'
import { useBitcoinStore } from './bitcoin'

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
  const bitcoinStore = useBitcoinStore()
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

  // Formats a value that is ALREADY in the selected currency
  const formatAmount = (value: number): string => formatter.value.format(Number(value) || 0)

  // Converts a KRW amount to the selected currency
  function convertKrw(amountInKrw: number): number {
    const amount = Number(amountInKrw) || 0
    if (selectedCurrency.value === 'KRW') return amount

    if (selectedCurrency.value === 'USD') {
      const rate = bitcoinStore.exchangeRateUsd
      return rate ? amount / rate : amount
    }

    if (selectedCurrency.value === 'JPY') {
      const rate = bitcoinStore.exchangeRateJpy
      return rate ? amount / rate : amount
    }

    return amount
  }

  // Converts an amount in the selected currency to KRW
  function convertSelectedToKrw(amountInSelected: number): number {
    const amount = Number(amountInSelected) || 0
    if (selectedCurrency.value === 'KRW') return amount

    if (selectedCurrency.value === 'USD') {
      const rate = bitcoinStore.exchangeRateUsd
      return rate ? amount * rate : amount
    }

    if (selectedCurrency.value === 'JPY') {
      const rate = bitcoinStore.exchangeRateJpy
      return rate ? amount * rate : amount
    }

    return amount
  }

  // Converts and formats a KRW amount
  function formatKrw(amountInKrw: number): string {
    return formatAmount(convertKrw(amountInKrw))
  }

  return {
    availableCurrencies: fiatCurrencies,
    currencySymbols,
    currencyLocales,
    currencyDisplayNames,
    selectedCurrency,
    setCurrency,
    formatter,
    formatAmount,
    convertKrw,
    convertSelectedToKrw,
    formatKrw,
    displayLabel
  }
})
