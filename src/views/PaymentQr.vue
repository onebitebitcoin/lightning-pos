<template>
  <div class="payment-qr-root min-h-screen bg-bg-secondary transition-colors duration-300">
    <!-- Header -->
    <header class="glass-header transition-all duration-300 sticky top-0 z-20">
      <div class="container mx-auto px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
        <div class="flex items-center space-x-4 flex-1 min-w-0">
          <button
            @click="goBack"
            class="flex items-center space-x-2 px-3 py-2 hover:bg-bg-tertiary rounded-xl transition-colors text-text-secondary hover:text-text-primary"
          >
            <UiIcon name="arrowLeft" class="h-4 w-4" />
            <span>{{ t('payment.back', '뒤로가기') }}</span>
          </button>
          <h1 class="text-2xl font-bold text-text-primary">
            {{ getPaymentModalTitle() }}
          </h1>
        </div>
      </div>
    </header>

    <div class="payment-qr-content max-w-lg mx-auto px-4">
      <!-- QR Code Container -->
      <div class="mb-3">
        <div class="qr-shell relative mx-auto bg-white dark:bg-gray-900 rounded-lg p-3">
          <!-- Loading State -->
          <div
            v-show="isGeneratingInvoice"
            class="flex flex-col items-center justify-center space-y-4 py-20"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
            <div class="text-sm text-gray-600 dark:text-gray-300 text-center px-6">
              {{ getLoadingMessage() }}
            </div>
          </div>

          <!-- QR Code -->
          <div v-show="!isGeneratingInvoice" class="flex justify-center items-center aspect-square">
            <canvas
              ref="qrCanvas"
              class="block w-full h-auto rounded"
              style="image-rendering: crisp-edges;"
            ></canvas>
          </div>
        </div>
        <div
          v-if="paymentMethod === 'ecash' && !isGeneratingInvoice && ecashRequestText"
          class="mt-3 rounded-xl border border-dashed border-border-primary/60 bg-gray-50 p-3 text-xs font-mono text-text-secondary dark:bg-gray-900/40 dark:text-gray-200 break-all text-center"
        >
          {{ ecashRequestText }}
        </div>
      </div>

      <!-- Instructions -->
      <div class="qr-instructions text-center mb-6">
        <p v-if="isGeneratingInvoice" class="text-sm text-gray-600 dark:text-gray-300">
          {{ getLoadingMessage() }}
        </p>
        <p v-else-if="paymentMethod === 'ecash' && isWaitingForEcashPayment" class="text-sm text-gray-600 dark:text-gray-300">
          {{ t('payment.status.ecashWaiting', 'e-cash 결제를 확인 중입니다. 결제가 완료되면 자동으로 주문이 확정됩니다.') }}
        </p>
        <p v-else-if="paymentMethod === 'lightning' && activeLightningAddress" class="text-sm font-mono text-gray-600 dark:text-gray-400 break-all flex items-center justify-center gap-1">
          <UiIcon name="lightning" class="h-4 w-4 flex-shrink-0" />
          <span>{{ activeLightningAddress }}</span>
        </p>
      </div>

      <!-- E-cash Copy Button -->
      <div
        v-if="paymentMethod === 'ecash' && !isGeneratingInvoice && ecashRequestText"
        class="mb-6 space-y-2"
      >
        <button
          type="button"
          class="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="copyEcashRequestText"
        >
          <UiIcon name="copy" class="h-4 w-4" />
          <span>{{ t('payment.actions.copyRequest', '결제 텍스트 복사') }}</span>
        </button>
        <p
          v-if="ecashCopyFeedback"
          :class="[
            'text-sm text-center',
            ecashCopyFeedback.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          ]"
        >
          {{ ecashCopyFeedback.message }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="qr-actions flex gap-3">
        <button
          @click="goBack"
          class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
        >
          {{ t('payment.actions.cancel', '취소') }}
        </button>
        <button
          @click="completePayment"
          class="btn btn-primary flex-1 px-4 py-3 rounded-lg font-medium"
        >
          {{ t('payment.actions.complete', '결제 완료') }}
        </button>
      </div>
    </div>
    
    <!-- Success Modal (Optional, but good for feedback) -->
     <div
        v-if="showSuccess"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center transition-colors duration-200">
        <div class="text-6xl mb-4 text-success-500 flex justify-center">
          <UiIcon name="checkCircle" class="h-12 w-12" />
        </div>
          <h3 class="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            {{ t('payment.success.title', '결제 성공!') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            {{ t('payment.success.message', '구매해 주셔서 감사합니다') }}
          </p>
          <button
            @click="returnToShop"
            class="btn btn-primary w-full py-3 px-4 font-medium"
          >
            {{ t('payment.success.continue', '쇼핑 계속하기') }}
          </button>
        </div>
      </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useBitcoinStore } from '@/stores/bitcoin'
import { bitcoinService } from '@/services/bitcoin'
import QRCode from 'qrcode'
import UiIcon from '@/components/ui/Icon.vue'
import { useLocaleStore } from '@/stores/locale'
import { useEcashStore } from '@/stores/ecash'
import { API_BASE_URL } from '@/services/api'
import { createHttpPostTransport, createPaymentRequest } from '@/services/nut18'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const bitcoinStore = useBitcoinStore()
const localeStore = useLocaleStore()
const ecashStore = useEcashStore()
const t = localeStore.t

const ecashTransportBaseUrl = (
  import.meta.env.VITE_ECASH_TRANSPORT_BASE_URL || 'https://pos.onebitebitcoin.com'
).replace(/\/+$/, '')

const paymentMethod = ref((route.query.method as string) || 'lightning')
const qrCanvas = ref<HTMLCanvasElement>()
const isGeneratingInvoice = ref(true) // Start generating immediately
const activeLightningAddress = ref<string>('')
const isWaitingForEcashPayment = ref(false)
const ecashRequestText = ref('')
const ecashCopyFeedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const showSuccess = ref(false)

let ecashPollingTimer: number | null = null
let ecashCopyFeedbackTimer: ReturnType<typeof setTimeout> | null = null

// Constants
const DEFAULT_LIGHTNING_DOMAIN = 'walletofsatoshi.com'
const FALLBACK_LIGHTNING_ADDRESS = 'nsw@getalby.com'
const DEFAULT_MEMO = 'Shop Payment'

// Helpers
function getUserLightningAddress(): string {
  if (authStore.user?.lightning_address) return authStore.user.lightning_address
  if (authStore.username) return `${authStore.username}@${DEFAULT_LIGHTNING_DOMAIN}`
  return FALLBACK_LIGHTNING_ADDRESS
}

function getUserUsdtAddress(): string {
  if (authStore.user?.usdt_address) return authStore.user.usdt_address
  return ''
}

function getFallbackLightningAddresses(): string[] {
  const fallbacks = []
  if (authStore.username && !authStore.user?.lightning_address) {
    fallbacks.push(`${authStore.username}@getalby.com`)
    fallbacks.push(`${authStore.username}@strike.army`)
  }
  fallbacks.push(FALLBACK_LIGHTNING_ADDRESS)
  return fallbacks
}

function getPaymentTypeLabel(): string {
  switch (paymentMethod.value) {
    case 'lightning':
      return t('payment.modal.memo.lightning', 'Lightning Payment')
    case 'ecash':
      return t('payment.modal.memo.ecash', 'e-cash Payment')
    case 'usdt':
      return t('payment.modal.memo.usdt', 'USDT Payment')
    default:
      return DEFAULT_MEMO
  }
}

function getPaymentModalTitle(): string {
  switch (paymentMethod.value) {
    case 'lightning':
      return t('payment.modal.lightningTitle', '라이트닝 인보이스')
    case 'ecash':
      return t('payment.modal.ecashTitle', 'e-cash 결제')
    case 'usdt':
      return t('payment.modal.usdtTitle', 'USDT 결제')
    default:
      return t('payment.modal.defaultTitle', '결제 QR 코드')
  }
}

function getLoadingMessage(): string {
  switch (paymentMethod.value) {
    case 'lightning':
      return t('payment.status.lightning', '잠시만 기다려주세요. 라이트닝 인보이스를 생성하고 있습니다...')
    case 'ecash':
      return t('payment.status.ecash', '잠시만 기다려주세요. e-cash 인보이스를 생성하고 있습니다...')
    case 'usdt':
      return t('payment.status.usdt', '잠시만 기다려주세요. USDT 인보이스를 생성하고 있습니다...')
    default:
      return t('payment.status.generic', 'QR 코드를 생성하고 있습니다...')
  }
}

function getQRScanMessage(): string {
  switch (paymentMethod.value) {
    case 'lightning':
      return t('payment.instructions.lightning', '라이트닝 지갑으로 QR 코드를 스캔하세요')
    case 'ecash':
      return t('payment.instructions.ecash', 'e-cash 지갑으로 QR 코드를 스캔하세요 (라이트닝 네트워크 기반)')
    case 'usdt':
      return t('payment.instructions.usdt', 'USDT 지갑으로 QR 코드를 스캔하세요 (라이트닝 네트워크 기반)')
    default:
      return t('payment.instructions.generic', '결제를 완료하려면 QR 코드를 스캔하세요')
  }
}

// Main Logic
async function generateInvoice() {
  isGeneratingInvoice.value = true
  let qrData = ''

  try {
    if (paymentMethod.value === 'lightning' || paymentMethod.value === 'usdt') {
      if (!bitcoinStore.btcPriceKrw) await bitcoinStore.fetchBitcoinPrice()

      const satsAmount = bitcoinStore.krwToSats(cartStore.total)
      const memo = `${getPaymentTypeLabel()} - ${cartStore.total.toLocaleString('ko-KR')}원`

      if (satsAmount <= 0) throw new Error('Invalid amount')

      const primaryAddress = paymentMethod.value === 'usdt' ? getUserUsdtAddress() : getUserLightningAddress()
      let result = await bitcoinService.getLnurl(primaryAddress, satsAmount, memo)
      let usedAddress = primaryAddress

      if (!result.success && result.errorType === 'WALLET_NOT_FOUND' && paymentMethod.value === 'lightning') {
        const fallbackAddresses = getFallbackLightningAddresses()
        for (const fallbackAddress of fallbackAddresses) {
          result = await bitcoinService.getLnurl(fallbackAddress, satsAmount, memo)
          if (result.success) {
            usedAddress = fallbackAddress
            break
          }
        }
      }

      if (result.success && result.invoice) {
        qrData = result.invoice
        activeLightningAddress.value = usedAddress
      } else {
        throw new Error(result.error || 'Invoice generation failed')
      }
    } else if (paymentMethod.value === 'ecash') {
      if (!bitcoinStore.btcPriceKrw) await bitcoinStore.fetchBitcoinPrice()
      const satsAmount = bitcoinStore.krwToSats(cartStore.total)
      const normalizedSats = Math.max(1, Math.round(satsAmount))
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const postUrl = `${ecashTransportBaseUrl}/api/products/payments/requests/${encodeURIComponent(requestId)}/`
      const mintList = ecashStore.mintUrl ? [ecashStore.mintUrl] : undefined

      const requestString = createPaymentRequest({
        id: requestId,
        amount: normalizedSats,
        unit: 'sat',
        single_use: true,
        mints: mintList,
        description: `${getPaymentTypeLabel()} · ${cartStore.total.toLocaleString('ko-KR')}원`,
        transports: [createHttpPostTransport(postUrl)]
      })

      qrData = requestString
      ecashRequestText.value = requestString
      startEcashPaymentPolling(requestId)
      isWaitingForEcashPayment.value = true
    }

    if (qrCanvas.value && qrData) {
      await QRCode.toCanvas(qrCanvas.value, qrData, {
        scale: 6,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
    }
  } catch (error) {
    console.error('Invoice generation error:', error)

    let errorMessage = t('payment.errors.qr', 'QR 코드 생성에 실패했습니다.')

    if (error instanceof Error) {
      // Extract the actual error message
      const message = error.message

      // Check for amount range error
      if (message.includes('outside allowed range')) {
        const rangeMatch = message.match(/\((\d+)\s*-\s*(\d+)\s*sats\)/)
        if (rangeMatch) {
          const minSats = parseInt(rangeMatch[1])
          const maxSats = parseInt(rangeMatch[2])
          const minKrw = bitcoinStore.satsToKrw(minSats)
          const maxKrw = bitcoinStore.satsToKrw(maxSats)

          errorMessage = `결제 금액이 허용 범위를 벗어났습니다.\n\n허용 범위: ${minKrw.toLocaleString('ko-KR')}원 - ${maxKrw.toLocaleString('ko-KR')}원\n(${minSats.toLocaleString()} - ${maxSats.toLocaleString()} sats)`
        }
      } else {
        // Show the actual error message
        errorMessage = `QR 코드 생성에 실패했습니다.\n\n오류: ${message}`
      }
    }

    alert(errorMessage)
    goBack()
  } finally {
    isGeneratingInvoice.value = false
  }
}

// Ecash polling logic
function startEcashPaymentPolling(requestId: string) {
  const checkUrl = `${ecashTransportBaseUrl}/api/products/payments/requests/${encodeURIComponent(requestId)}/`
  let attempts = 0
  const maxAttempts = 60

  const poll = async () => {
    try {
      const response = await fetch(checkUrl)
      if (response.ok) {
        const payload = await response.json()
        const hasProofs = payload?.paid && Array.isArray(payload?.proofs) && payload.proofs.length > 0
        if (hasProofs) {
          await handleEcashPaymentPayload(payload, requestId)
          return
        }
      }
    } catch (error) {
      console.error('Ecash poll error:', error)
    }
    attempts++
    if (attempts >= maxAttempts) stopEcashFlow()
  }
  
  poll()
  ecashPollingTimer = window.setInterval(poll, 3000)
}

function stopEcashFlow() {
  if (ecashPollingTimer) {
    clearInterval(ecashPollingTimer)
    ecashPollingTimer = null
  }
  isWaitingForEcashPayment.value = false
}

async function handleEcashPaymentPayload(payload: any, requestId: string) {
    const proofs = Array.isArray(payload?.proofs) ? payload.proofs : []
    const mintForProofs = payload?.mint || ecashStore.mintUrl
    ecashStore.addProofs(
      proofs.map((proof: Record<string, any>) => ({
        ...proof,
        mintUrl: proof?.mintUrl || mintForProofs
      })),
      mintForProofs
    )
    
    // Consume
    try {
        await fetch(`${ecashTransportBaseUrl}/api/products/payments/requests/${encodeURIComponent(requestId)}/?consume=true`)
    } catch(e) { console.error(e) }

    stopEcashFlow()
    await completePayment()
}

async function completePayment() {
  stopEcashFlow()
  try {
    const result = await cartStore.createOrder(paymentMethod.value)
    if (result.success) {
      showSuccess.value = true
    } else {
      alert(result.message || t('payment.errors.orderCreation', '주문 생성에 실패했습니다'))
    }
  } catch (error) {
    console.error('Payment completion error:', error)
    alert(t('payment.errors.completion', '결제 처리 중 오류가 발생했습니다'))
  }
}

function goBack() {
  router.back()
}

function returnToShop() {
  router.push('/shop')
}

// Clipboard helpers
function setEcashCopyFeedback(type: 'success' | 'error', message: string) {
  ecashCopyFeedback.value = { type, message }
  if (ecashCopyFeedbackTimer) clearTimeout(ecashCopyFeedbackTimer)
  ecashCopyFeedbackTimer = window.setTimeout(() => {
    ecashCopyFeedback.value = null
  }, 3500)
}

async function copyEcashRequestText() {
  if (!ecashRequestText.value) return
  try {
    await navigator.clipboard.writeText(ecashRequestText.value)
    setEcashCopyFeedback('success', t('ecashSend.copied', '요청 텍스트를 복사했습니다.'))
  } catch {
    setEcashCopyFeedback('error', t('ecashSend.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
  }
}

onMounted(() => {
  bitcoinStore.initialize()
  ecashStore.initialize()
  generateInvoice()
  // Pause Bitcoin price auto-refresh while on payment QR page
  bitcoinStore.pauseAutoRefresh()
})

onBeforeUnmount(() => {
  stopEcashFlow()
  // Resume Bitcoin price auto-refresh when leaving payment QR page
  bitcoinStore.resumeAutoRefresh()
})

</script>

<style scoped>
.payment-qr-content {
  padding: 2rem 0;
}

@media (max-height: 640px) {
  .payment-qr-content {
    padding: 1.25rem 0;
  }

  .qr-instructions {
    margin-bottom: 1.25rem;
  }
}

.qr-shell {
  width: min(92vw, 380px);
}

@media (min-width: 768px) {
  .qr-shell {
    width: min(85vw, 440px);
  }
}

@media (min-width: 1024px) {
  .qr-shell {
    width: 360px;
  }
}

@media (orientation: landscape) {
  .qr-shell {
    width: min(70vh, 80vw, 340px);
  }
}

@media (orientation: landscape) and (min-width: 768px) {
  .qr-shell {
    width: min(65vh, 70vw, 360px);
  }
}

.qr-shell canvas {
  width: 100% !important;
  height: auto !important;
}
</style>
