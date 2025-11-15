<template>
  <div class="min-h-screen bg-bg-secondary transition-colors duration-300">
    <header class="glass-header sticky top-0 z-20 border-b border-border-secondary/40">
      <div class="container mx-auto flex items-center justify-between px-4 py-4">
        <div class="flex items-center space-x-3">
          <button
            class="rounded-xl px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            @click="router.push('/settings')"
          >
            <span class="flex items-center space-x-2">
              <UiIcon name="arrowLeft" class="h-4 w-4" />
              <span>{{ t('ecashSend.backToSettings', '설정으로 돌아가기') }}</span>
            </span>
          </button>
          <h1 class="text-lg font-semibold text-text-primary sm:text-xl">
            {{ t('ecashSend.title', 'e-cash 보내기') }}
          </h1>
        </div>
        <div class="hidden text-sm text-text-secondary sm:flex sm:items-center sm:space-x-2">
          <UiIcon name="user" class="h-4 w-4" />
          <span>{{ authStore.username }}</span>
        </div>
      </div>
    </header>

    <main class="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div class="card space-y-6 p-4 sm:p-6">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-primary-600">
              {{ t('ecashSend.sectionLabel', '보유 e-cash 전송') }}
            </p>
            <p class="text-base font-medium text-text-primary sm:text-lg">
              {{ t('ecashSend.subtitle', '라이트닝 또는 e-cash 요청으로 보낼 수 있습니다') }}
            </p>
          </div>
          <div class="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-text-secondary dark:bg-gray-800">
            <span class="font-medium text-text-primary">{{ formattedBalance }}</span>
            <span class="ml-1 text-xs">{{ t('ecashSend.availableLabel', '보유 잔액') }}</span>
          </div>
        </div>

        <div v-if="toast" :class="toastClass" class="rounded-2xl px-4 py-3 text-sm">
          {{ toast.message }}
        </div>

        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="toggleScanner"
            >
              <UiIcon name="camera" class="h-4 w-4" />
              <span>
                {{ showScanner ? t('ecashSend.closeScanner', '스캐너 닫기') : t('ecashSend.scanQr', 'QR 스캔하기') }}
              </span>
            </button>
            <button
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="pasteFromClipboard"
            >
              <UiIcon name="clipboard" class="h-4 w-4" />
              <span>{{ t('ecashSend.paste', '붙여넣기') }}</span>
            </button>
            <button
              v-if="sendInput"
              type="button"
              class="inline-flex items-center space-x-2 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="copyRequestText"
            >
              <UiIcon name="copy" class="h-4 w-4" />
              <span>{{ t('ecashSend.copy', '텍스트 복사') }}</span>
            </button>
          </div>

          <div v-if="showScanner" class="space-y-3">
            <QrScanner @scan="handleScannerResult" @error="handleScannerError" />
            <p v-if="scannerError" class="text-sm text-warning-600 dark:text-warning-400">
              {{ scannerError }}
            </p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-text-primary">
              {{ t('ecashSend.inputLabel', '인보이스 · 라이트닝 주소 · e-cash 요청') }}
            </label>
            <textarea
              v-model="sendInput"
              :placeholder="t('ecashSend.inputPlaceholder', 'QR을 스캔하거나 요청 텍스트를 붙여넣으세요')"
              class="min-h-[96px] w-full rounded-2xl border border-border-primary/70 bg-white/90 px-4 py-3 text-sm text-text-primary shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-gray-900/70"
            />
            <p class="text-xs text-text-secondary">{{ detectionMessage }}</p>
          </div>

          <div v-if="showAmountField" class="space-y-2">
            <label class="text-sm font-medium text-text-primary">
              {{ t('ecashSend.amountLabel', '보낼 금액 (sats)') }}
            </label>
            <input
              v-model="sendAmount"
              type="number"
              min="1"
              :max="ecashBalance"
              class="w-full rounded-2xl border border-border-primary/70 bg-white/90 px-4 py-3 text-sm text-text-primary shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:bg-gray-900/70"
              :placeholder="t('ecashSend.amountPlaceholder', '예: 2500')"
            />
            <div class="flex flex-wrap items-center text-xs text-text-secondary">
              <span>{{ t('ecashSend.availableBalance', '사용 가능') }}: {{ formattedBalance }}</span>
              <span v-if="fiatHint" class="ml-2 text-[11px] text-text-secondary/80">({{ fiatHint }})</span>
            </div>
          </div>

          <div v-if="requestPayload" class="rounded-2xl border border-dashed border-border-primary/60 bg-gray-50 p-4 text-sm dark:bg-gray-900/40">
            <p class="text-sm font-medium text-text-primary">
              {{ t('ecashSend.requestSummary', '요청 정보 요약') }}
            </p>
            <div class="mt-3 space-y-2 text-xs text-text-secondary">
              <div class="flex items-center justify-between gap-4">
                <span>{{ t('ecashSend.requestAmount', '요청 금액') }}</span>
                <span class="font-semibold text-text-primary">{{ formatSats(requestPayload.amount || 0) }}</span>
              </div>
              <div v-if="requestMintLabel" class="flex items-center justify-between gap-4">
                <span>{{ t('ecashSend.requestMint', '요청 Mint') }}</span>
                <span class="font-semibold text-text-primary">{{ requestMintLabel }}</span>
              </div>
              <div v-if="requestTransportLabel" class="flex items-center justify-between gap-4">
                <span>{{ t('ecashSend.requestTransport', '전송 방식') }}</span>
                <span class="font-semibold text-text-primary">{{ requestTransportLabel }}</span>
              </div>
              <div v-if="requestMemo" class="flex items-center justify-between gap-4">
                <span>{{ t('ecashSend.requestMemo', '메모') }}</span>
                <span class="text-right font-medium text-text-primary">{{ requestMemo }}</span>
              </div>
            </div>
          </div>

          <div v-if="invoiceQuote" class="rounded-2xl border border-border-primary/70 bg-gray-50 p-4 text-sm text-text-secondary dark:bg-gray-900/30">
            <p class="text-sm font-medium text-text-primary">
              {{ t('ecashSend.invoiceSummary', '인보이스 요약') }}
            </p>
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span>{{ t('ecashSend.invoiceAmount', '결제 금액') }}</span>
                <span class="font-semibold text-text-primary">{{ formatSats(invoiceQuote.invoiceAmount) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>{{ t('ecashSend.invoiceFee', '수수료 예약') }}</span>
                <span class="font-semibold text-text-primary">{{ formatSats(invoiceQuote.feeReserve) }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>{{ t('ecashSend.remainingAfter', '결제 후 잔액') }}</span>
                <span class="font-semibold text-text-primary">
                  {{ formatSats(Math.max(invoiceQuote.available - invoiceQuote.need, 0)) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="invoiceError" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {{ invoiceError }}
          </div>
        </div>

        <div class="pt-2">
          <button
            type="button"
            class="btn btn-primary inline-flex w-full items-center justify-center space-x-2 rounded-2xl px-4 py-3 text-base font-semibold shadow-soft"
            :disabled="sendDisabled"
            @click="prepareSend"
          >
            <UiIcon name="send" class="h-5 w-5" />
            <span>
              {{ loading ? t('ecashSend.sending', '보내는 중...') : t('ecashSend.sendAction', 'e-cash 보내기') }}
            </span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { AxiosError } from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import QrScanner from '@/components/ui/QrScanner.vue'
import { useEcashStore, type CashuProof } from '@/stores/ecash'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useBitcoinStore } from '@/stores/bitcoin'
import apiClient from '@/services/api'
import {
  createBlindedOutputs,
  deserializeOutputDatas,
  signaturesToProofs,
  buildSwapOutputsFromOutputDatas
} from '@/services/cashuProtocol'
import type { CashuSwapOutput } from '@/services/cashuProtocol'
import { createPaymentPayload, parsePaymentRequest, sendPaymentViaPost, type Nut18PaymentRequest } from '@/services/nut18'
import { sendPaymentViaNostr } from '@/services/nostrTransport'

interface InvoiceQuote {
  quoteData: any
  bolt11: string
  invoiceAmount: number
  feeReserve: number
  need: number
  available: number
}

interface LegacyEcashRequest {
  protocol: 'legacy'
  mint: string
  amount: number
  outputs: any[]
  requestId?: string
  description?: string
}

type ParsedRequest = (Nut18PaymentRequest & { protocol: 'nut18' }) | LegacyEcashRequest

const router = useRouter()
const authStore = useAuthStore()
const ecashStore = useEcashStore()
const localeStore = useLocaleStore()
const bitcoinStore = useBitcoinStore()
const t = localeStore.t

const sendInput = ref('')
const sendAmount = ref('')
const showScanner = ref(false)
const scannerError = ref('')
const fetchingQuote = ref(false)
const invoiceQuote = ref<InvoiceQuote | null>(null)
const invoiceError = ref('')
const loading = ref(false)
const toast = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

const ecashBalance = computed(() => Number(ecashStore.totalSats || 0))
const formattedBalance = computed(() => bitcoinStore.formatSats(ecashBalance.value))

const fiatHint = computed(() => {
  const sats = Number(showAmountField.value ? sendAmount.value : invoiceQuote.value?.invoiceAmount)
  if (!sats || !bitcoinStore.btcPriceKrw) return ''
  const krw = bitcoinStore.satsToKrw(sats)
  if (!krw) return ''
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(krw)
})

const requestPayload = computed<ParsedRequest | null>(() => {
  if (!isEcashRequest(sendInput.value)) {
    return null
  }
  try {
    return parseEcashRequest(sendInput.value)
  } catch (error) {
    console.error('Failed to parse e-cash request:', error)
    invoiceError.value = t('ecashSend.errors.invalidRequest', '유효하지 않은 e-cash 요청입니다.')
    return null
  }
})

const requestMintLabel = computed(() => {
  const payload = requestPayload.value
  if (!payload) return ''
  if (payload.protocol === 'legacy' && payload.mint) {
    return formatMintLabel(payload.mint)
  }
  const mints = payload.protocol === 'nut18' && Array.isArray(payload.mints) ? payload.mints : []
  return mints.length ? formatMintLabel(mints[0]) : ''
})

const requestTransportLabel = computed(() => {
  const payload = requestPayload.value
  if (!payload || payload.protocol !== 'nut18') return ''
  const transports = payload.transports || []
  const postTransport = transports.find(transport => (transport?.t || (transport as any)?.type) === 'post')
  const postAddress = postTransport?.a || (postTransport as any)?.address || (postTransport as any)?.url
  if (postAddress) {
    return `${t('ecashSend.transportHttp', 'HTTP POST')} · ${postAddress}`
  }
  const nostrTransport = transports.find(transport => (transport?.t || (transport as any)?.type) === 'nostr')
  const nostrAddress = nostrTransport?.a || (nostrTransport as any)?.address || (nostrTransport as any)?.url
  if (nostrAddress) {
    return `${t('ecashSend.transportNostr', 'Nostr')} · ${nostrAddress}`
  }
  return ''
})

const requestMemo = computed(() => {
  const payload = requestPayload.value
  if (!payload) return ''
  if (payload.protocol === 'nut18') {
    return payload.description || ''
  }
  return payload.description || ''
})

const detectionMessage = computed(() => {
  if (!sendInput.value) {
    return t('ecashSend.detectionPlaceholder', 'QR 스캔 또는 텍스트 입력을 기다리는 중입니다.')
  }
  if (isBolt11Invoice(sendInput.value)) {
    return t('ecashSend.detectedInvoice', '라이트닝 인보이스를 감지했습니다.')
  }
  if (isEcashRequest(sendInput.value)) {
    return t('ecashSend.detectedEcash', 'e-cash 요청을 감지했습니다.')
  }
  if (isLightningAddress(sendInput.value)) {
    return t('ecashSend.detectedAddress', '라이트닝 주소를 감지했습니다. 전송 금액을 입력하세요.')
  }
  return t('ecashSend.unknownInput', '형식을 인식할 수 없습니다. 다시 확인해주세요.')
})

const showAmountField = computed(() => {
  return !!sendInput.value && isLightningAddress(sendInput.value) && !isBolt11Invoice(sendInput.value) && !isEcashRequest(sendInput.value)
})

const sendDisabled = computed(() => {
  if (loading.value || fetchingQuote.value) {
    return true
  }
  if (!sendInput.value.trim()) {
    return true
  }
  if (isEcashRequest(sendInput.value)) {
    return !requestPayload.value
  }
  if (isBolt11Invoice(sendInput.value)) {
    return !invoiceQuote.value
  }
  if (isLightningAddress(sendInput.value)) {
    return !(Number(sendAmount.value) > 0)
  }
  return true
})

const toastClass = computed(() => {
  if (!toast.value) return ''
  if (toast.value.type === 'error') {
    return 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200'
  }
  if (toast.value.type === 'success') {
    return 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-200'
  }
  return 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'
})

let quoteTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => sendInput.value,
  value => {
    invoiceError.value = ''
    invoiceQuote.value = null
    if (quoteTimer) {
      clearTimeout(quoteTimer)
      quoteTimer = null
    }
    if (!isBolt11Invoice(value)) {
      fetchingQuote.value = false
      return
    }
    quoteTimer = setTimeout(() => {
      fetchInvoiceQuote(value)
    }, 350)
  }
)

onMounted(async () => {
  await Promise.allSettled([ecashStore.initialize(), bitcoinStore.initialize()])
})

function toggleScanner() {
  showScanner.value = !showScanner.value
  scannerError.value = ''
}

function handleScannerResult(value: string) {
  sendInput.value = value
  showScanner.value = false
  scannerError.value = ''
  showToast('info', t('ecashSend.scanned', 'QR 코드에서 값을 불러왔습니다.'))
}

function handleScannerError(message: string) {
  scannerError.value = message
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      sendInput.value = text.trim()
      showToast('info', t('ecashSend.pasted', '클립보드 내용을 불러왔습니다.'))
    }
  } catch (error) {
    console.error('Clipboard paste failed:', error)
    showToast('error', t('ecashSend.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
  }
}

async function copyRequestText() {
  try {
    await navigator.clipboard.writeText(sendInput.value.trim())
    showToast('success', t('ecashSend.copied', '요청 텍스트를 복사했습니다.'))
  } catch (error) {
    console.error('Copy failed:', error)
    showToast('error', t('ecashSend.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
  }
}

function showToast(type: 'success' | 'error' | 'info', message: string) {
  toast.value = { type, message }
  setTimeout(() => {
    if (toast.value?.message === message) {
      toast.value = null
    }
  }, 4000)
}

function normalizeBolt11(value: string) {
  return value.trim().replace(/\s+/g, '').toLowerCase().replace(/^lightning:/, '')
}

function isBolt11Invoice(value: string | null | undefined) {
  if (!value) return false
  const normalized = normalizeBolt11(value)
  return normalized.startsWith('lnbc') || normalized.startsWith('lntb') || normalized.startsWith('lnb') || normalized.startsWith('lno')
}

function isLightningAddress(value: string | null | undefined) {
  if (!value) return false
  const trimmed = value.trim()
  return trimmed.includes('@') || trimmed.toLowerCase().startsWith('lnurl')
}

function isEcashRequest(value: string | null | undefined) {
  if (!value) return false
  const trimmed = value.trim().toLowerCase()
  return trimmed.startsWith('cashu:request:') || trimmed.startsWith('creqa')
}

function parseEcashRequest(value: string): ParsedRequest {
  const trimmed = value.trim()
  if (/^cashu:request:/i.test(trimmed)) {
    const payload = trimmed.replace(/^cashu:request:/i, '')
    const decoded = atob(payload)
    const request = JSON.parse(decoded)
    return {
      protocol: 'legacy',
      mint: request.mint,
      amount: request.amount,
      outputs: request.outputs || [],
      requestId: request.requestId,
      description: request.memo || request.description || ''
    }
  }
  const parsed = parsePaymentRequest(trimmed)
  return {
    ...parsed,
    protocol: 'nut18'
  }
}

async function fetchInvoiceQuote(invoice: string) {
  if (!isBolt11Invoice(invoice)) return
  fetchingQuote.value = true
  invoiceError.value = ''
  try {
    const bolt11 = normalizeBolt11(invoice)
    const response = await apiClient.post('/cashu/melt/quote/', {
      request: bolt11,
      invoice: bolt11,
      mintUrl: ecashStore.mintUrl
    })
    const data = response.data
    const invoiceAmount = Number(data?.amount || 0)
    const feeReserve = Number(data?.fee_reserve || data?.fee || 0)
    const need = invoiceAmount + feeReserve
    const available = ecashBalance.value
    if (available < need) {
      invoiceError.value = t('ecashSend.errors.insufficient', '잔액이 부족합니다.')
    }
    invoiceQuote.value = {
      quoteData: data,
      bolt11,
      invoiceAmount,
      feeReserve,
      need,
      available
    }
  } catch (error) {
    console.error('Invoice quote failed:', error)
    invoiceError.value = translateErrorMessage(error) || t('ecashSend.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.')
  } finally {
    fetchingQuote.value = false
  }
}

function translateErrorMessage(error: unknown) {
  if (typeof error === 'string') return error
  if ((error as AxiosError)?.isAxiosError) {
    const axiosError = error as AxiosError<any>
    const detail = axiosError.response?.data?.detail || axiosError.response?.data?.error || axiosError.message
    if (typeof detail === 'string') return detail
  }
  if (error instanceof Error) {
    return error.message
  }
  return ''
}

function normalizeMintForCompare(url?: string) {
  return (url || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase()
}

function formatMintLabel(url?: string) {
  if (!url) {
    return t('ecashSend.mintUnknown', '알 수 없음')
  }
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

function getMintMismatchMessage(proofs: CashuProof[], targetMint?: string) {
  if (!targetMint) return ''
  const normalizedTarget = normalizeMintForCompare(targetMint)
  const mismatch = proofs.find(proof => {
    const proofMint = normalizeMintForCompare(proof?.mintUrl || ecashStore.mintUrl)
    return proofMint && normalizedTarget && proofMint !== normalizedTarget
  })
  if (!mismatch) return ''
  return t(
    'ecashSend.errors.mintMismatch',
    '{proof} mint 토큰과 {target} mint 설정이 일치하지 않습니다.',
    {
      target: formatMintLabel(targetMint),
      proof: formatMintLabel(mismatch?.mintUrl)
    }
  )
}

async function fetchMintKeys(targetMint: string) {
  const response = await apiClient.get('/cashu/keys/', {
    params: { mintUrl: targetMint }
  })
  return response.data
}

async function handleNut18Send(request: Nut18PaymentRequest & { protocol: 'nut18' }) {
  const amount = Number(request.amount || 0)
  if (!amount || amount <= 0) {
    throw new Error(t('ecashSend.errors.invalidAmount', '금액이 올바르지 않습니다.'))
  }

  const allowedMints = Array.isArray(request.mints) ? request.mints : []
  if (allowedMints.length > 0) {
    const currentMint = normalizeMintForCompare(ecashStore.mintUrl)
    const allowed = allowedMints.some(mint => normalizeMintForCompare(mint) === currentMint)
    if (!allowed) {
      throw new Error(
        t(
          'ecashSend.errors.requestMintMismatch',
          '요청된 mint({request})와 현재 mint({current})가 일치하지 않습니다.',
          {
            request: formatMintLabel(allowedMints[0]),
            current: formatMintLabel(ecashStore.mintUrl)
          }
        )
      )
    }
  }

  const available = ecashBalance.value
  if (available < amount) {
    throw new Error(t('ecashSend.errors.insufficient', '잔액이 부족합니다.'))
  }

  const { ok, picked, total } = ecashStore.selectProofsForAmount(amount)
  if (!ok) {
    throw new Error(t('ecashSend.errors.insufficient', '잔액이 부족합니다.'))
  }

  const mismatch = getMintMismatchMessage(picked, ecashStore.mintUrl)
  if (mismatch) {
    throw new Error(mismatch)
  }

  const mintKeys = await fetchMintKeys(ecashStore.mintUrl)
  const paymentOutputs = await createBlindedOutputs(amount, mintKeys)
  const change = Math.max(0, Number(total) - Number(amount))
  const changeOutputs = change > 0 ? await createBlindedOutputs(change, mintKeys) : { outputs: [], outputDatas: [] }
  const combinedOutputs = [...paymentOutputs.outputs, ...changeOutputs.outputs]
  const combinedOutputDatas = [...paymentOutputs.outputDatas, ...changeOutputs.outputDatas]

  const response = await apiClient.post('/cashu/swap/', {
    inputs: picked,
    outputs: combinedOutputs,
    mintUrl: ecashStore.mintUrl,
    requestId: request.id
  })
  const swapData = response.data
  const signatures = swapData?.signatures || swapData?.promises || []
  const allProofs = await signaturesToProofs(signatures, mintKeys, combinedOutputDatas)
  const paymentProofCount = paymentOutputs.outputDatas.length
  const paymentProofs = allProofs.slice(0, paymentProofCount)
  const changeProofs = allProofs.slice(paymentProofCount)

  const payload = createPaymentPayload({
    id: request.id,
    memo: request.description || '',
    mint: ecashStore.mintUrl,
    unit: request.unit || 'sat',
    proofs: paymentProofs
  })

  try {
    const transports = Array.isArray(request.transports) ? request.transports : []
    const postTransport = transports.find(transport => (transport?.t || transport?.type) === 'post')
    const nostrTransport = transports.find(transport => (transport?.t || transport?.type) === 'nostr')

    if (postTransport?.a) {
      await sendPaymentViaPost(postTransport.a, payload)
    } else if (nostrTransport?.a) {
      await sendPaymentViaNostr({ nprofile: nostrTransport.a, payload })
    } else {
      throw new Error(t('ecashSend.errors.transportMissing', '전송 가능한 경로가 없습니다.'))
    }
    ecashStore.removeProofs(picked)
    if (changeProofs.length) {
      ecashStore.addProofs(changeProofs, ecashStore.mintUrl)
    }
  } catch (error) {
    console.error('Nut18 transport failed:', error)
    const fallbackProofs = [...paymentProofs, ...changeProofs]
    if (fallbackProofs.length) {
      ecashStore.addProofs(fallbackProofs, ecashStore.mintUrl)
    }
    throw error
  }
}

async function handleLegacyEcashSend(request: LegacyEcashRequest) {
  const amount = Number(request.amount || 0)
  if (!amount || amount <= 0) {
    throw new Error(t('ecashSend.errors.invalidAmount', '금액이 올바르지 않습니다.'))
  }

  const requestMint = normalizeMintForCompare(request.mint)
  const currentMint = normalizeMintForCompare(ecashStore.mintUrl)
  if (requestMint !== currentMint) {
    throw new Error(
      t(
        'ecashSend.errors.requestMintMismatch',
        '요청된 mint({request})와 현재 mint({current})가 일치하지 않습니다.',
        {
          request: formatMintLabel(request.mint),
          current: formatMintLabel(ecashStore.mintUrl)
        }
      )
    )
  }

  const { ok, picked, total } = ecashStore.selectProofsForAmount(amount)
  if (!ok) {
    throw new Error(t('ecashSend.errors.insufficient', '잔액이 부족합니다.'))
  }

  const mismatch = getMintMismatchMessage(picked, request.mint)
  if (mismatch) {
    throw new Error(mismatch)
  }

  const mintKeys = await fetchMintKeys(request.mint)
  const receiverOutputDatas = await deserializeOutputDatas(request.outputs || [])
  if (!receiverOutputDatas.length) {
    throw new Error(t('ecashSend.errors.invalidRequest', '수신자 출력 정보를 불러오지 못했습니다.'))
  }
  const receiverOutputs = buildSwapOutputsFromOutputDatas(receiverOutputDatas, amount, mintKeys)
  if (!receiverOutputs.length) {
    throw new Error(t('ecashSend.errors.invalidRequest', '수신자 출력 정보를 불러오지 못했습니다.'))
  }

  const change = Math.max(0, Number(total) - Number(amount))
  let changeOutputs: CashuSwapOutput[] = []
  let changeOutputDatas: any[] | undefined
  if (change > 0) {
    const built = await createBlindedOutputs(change, mintKeys)
    changeOutputs = built.outputs
    changeOutputDatas = built.outputDatas
  }

  const response = await apiClient.post('/cashu/swap/', {
    inputs: picked,
    outputs: [...receiverOutputs, ...changeOutputs],
    mintUrl: request.mint,
    requestId: request.requestId
  })
  const data = response.data
  const signatures = data?.signatures || []
  let changeProofs: CashuProof[] = []

  if (change > 0 && changeOutputDatas?.length) {
    const mintKeys = await fetchMintKeys(request.mint)
    changeProofs = await signaturesToProofs(signatures.slice(receiverOutputs.length), mintKeys, changeOutputDatas)
  }

  ecashStore.removeProofs(picked)
  if (changeProofs.length) {
    ecashStore.addProofs(changeProofs, request.mint)
  }
}

async function handleEcashRequestSend() {
  const payload = requestPayload.value
  if (!payload) {
    throw new Error(t('ecashSend.errors.invalidRequest', '유효하지 않은 e-cash 요청입니다.'))
  }

  if (payload.protocol === 'nut18') {
    await handleNut18Send(payload)
  } else {
    await handleLegacyEcashSend(payload)
  }
}

async function handleInvoiceSend() {
  if (!invoiceQuote.value) {
    throw new Error(t('ecashSend.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.'))
  }

  const { quoteData, need } = invoiceQuote.value
  const { ok, picked, total } = ecashStore.selectProofsForAmount(need)
  if (!ok) {
    throw new Error(t('ecashSend.errors.insufficient', '잔액이 부족합니다.'))
  }

  const mismatch = getMintMismatchMessage(picked, ecashStore.mintUrl)
  if (mismatch) {
    throw new Error(mismatch)
  }

  const change = Math.max(0, Number(total) - Number(need))
  let changeOutputs: CashuSwapOutput[] | undefined
  let changeOutputDatas: any[] | undefined
  if (change > 0) {
    const mintKeys = await fetchMintKeys(ecashStore.mintUrl)
    const built = await createBlindedOutputs(change, mintKeys)
    changeOutputs = built.outputs
    changeOutputDatas = built.outputDatas
  }

  const meltPayload: any = {
    quote: quoteData?.quote || quoteData?.quote_id,
    inputs: picked,
    mintUrl: ecashStore.mintUrl
  }

  // Only include outputs if we have change
  if (changeOutputs && changeOutputs.length > 0) {
    meltPayload.outputs = changeOutputs
  }

  const response = await apiClient.post('/cashu/melt/', meltPayload)
  const data = response.data
  const signatures = data?.change || data?.signatures || data?.promises || []
  let changeProofs: CashuProof[] = []

  if (Array.isArray(signatures) && signatures.length && changeOutputDatas?.length) {
    const mintKeys = await fetchMintKeys(ecashStore.mintUrl)
    changeProofs = await signaturesToProofs(signatures, mintKeys, changeOutputDatas)
  }

  ecashStore.removeProofs(picked)
  if (changeProofs.length) {
    ecashStore.addProofs(changeProofs, ecashStore.mintUrl)
  }
}

async function handleLightningAddressSend() {
  const amount = Number(sendAmount.value)
  if (!amount || amount <= 0) {
    throw new Error(t('ecashSend.errors.amountRequired', '보낼 금액을 입력하세요.'))
  }

  const quoteResponse = await apiClient.post('/lightningaddr/quote/', {
    address: sendInput.value.trim(),
    amount
  })
  const invoice = quoteResponse.data?.request
  if (!invoice) {
    throw new Error(t('ecashSend.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.'))
  }

  sendInput.value = invoice
  await fetchInvoiceQuote(invoice)
  if (!invoiceQuote.value) {
    throw new Error(t('ecashSend.errors.invoiceQuote', '인보이스 정보를 불러오지 못했습니다.'))
  }
  await handleInvoiceSend()
}

async function prepareSend() {
  if (loading.value) return
  invoiceError.value = ''
  try {
    loading.value = true
    if (isEcashRequest(sendInput.value)) {
      await handleEcashRequestSend()
    } else if (isBolt11Invoice(sendInput.value)) {
      await handleInvoiceSend()
    } else if (isLightningAddress(sendInput.value)) {
      await handleLightningAddressSend()
    } else {
      throw new Error(t('ecashSend.errors.unsupportedInput', '지원하지 않는 형식입니다.'))
    }

    await ecashStore.refreshHoldings()
    sendInput.value = ''
    sendAmount.value = ''
    invoiceQuote.value = null
    invoiceError.value = ''
    showToast('success', t('ecashSend.success', '전송이 완료되었습니다.'))
  } catch (error) {
    console.error('Send failed:', error)
    const message = translateErrorMessage(error) || t('ecashSend.errors.generic', '전송에 실패했습니다.')
    invoiceError.value = message
    showToast('error', message)
  } finally {
    loading.value = false
  }
}

function formatSats(value: number) {
  return bitcoinStore.formatSats(Math.max(0, Number(value) || 0))
}
</script>
