<template>
  <div class="min-h-screen bg-bg-secondary transition-colors duration-300">
    <!-- Header -->
    <header class="glass-header transition-all duration-300 sticky top-0 z-20">
      <div class="container mx-auto px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
        <div class="flex items-center space-x-4 flex-1 min-w-0">
          <button
            @click="$router.push('/shop')"
            class="flex items-center space-x-2 px-3 py-2 hover:bg-bg-tertiary rounded-xl transition-colors text-text-secondary hover:text-text-primary"
          >
            <UiIcon name="arrowLeft" class="h-4 w-4" />
            <span>{{ t('payment.backToShop', '상점으로 돌아가기') }}</span>
          </button>
          <h1 class="text-2xl font-bold text-text-primary">
            {{ t('payment.title', '결제') }}
          </h1>
        </div>
        <div class="flex items-center gap-2 text-sm text-text-secondary">
          <UiIcon name="user" class="h-4 w-4" />
          <span class="truncate max-w-[160px] sm:max-w-none">{{ authStore.username }}</span>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-3 xs:px-4 pt-4 xs:pt-6 tablet:pt-8 pb-32 sm:pb-12 max-w-4xl safe-area-bottom">
      <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4 xs:gap-6 tablet:gap-8">
        <!-- Order Summary -->
        <div class="card p-4 xs:p-6 animate-fade-in">
          <h2 class="text-lg xs:text-xl font-semibold text-gray-900 dark:text-white mb-3 xs:mb-4">
            {{ t('payment.orderSummary', '주문 내역') }}
          </h2>
          
          <div class="space-y-3 mb-6">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
            >
              <div>
                <p class="font-medium text-gray-800 dark:text-white">{{ item.product_name }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ item.quantity }} × {{ formatPrice(Number(item.product_price || 0)) }}
                </p>
              </div>
              <p class="font-medium text-gray-800 dark:text-white">
                {{ formatPrice(Number(item.total_price || 0)) }}
              </p>
            </div>
          </div>

          <!-- Discount Section -->
          <div class="mb-4 xs:mb-6">
            <h3 class="text-base xs:text-lg font-medium text-gray-800 dark:text-white mb-2 xs:mb-3">
              {{ t('payment.discounts.title', '할인 적용') }}
            </h3>
            <div class="grid grid-cols-2 gap-2 xs:gap-3 mb-2 xs:mb-3">
              <button
                v-for="discountOption in discountOptions"
                :key="discountOption"
                @click="selectPresetDiscount(discountOption)"
                :class="[
                  'px-2 xs:px-4 py-1.5 xs:py-2 rounded-lg border transition-colors text-xs xs:text-sm',
                  cartStore.discount === discountOption && !isCustomDiscount
                    ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 text-indigo-700 dark:text-indigo-200'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                ]"
              >
                {{ t('payment.discounts.optionPercent', '{percent}% 할인', { percent: discountOption }) }}
              </button>
              <button
                @click="selectPresetDiscount(0)"
                :class="[
                  'px-2 xs:px-4 py-1.5 xs:py-2 rounded-lg border transition-colors text-xs xs:text-sm',
                  cartStore.discount === 0 && !isCustomDiscount
                    ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-500 text-indigo-700 dark:text-indigo-200'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                ]"
              >
                {{ t('payment.discounts.none', '할인 없음') }}
              </button>
            </div>
            
            <!-- Custom Discount Input -->
            <div class="mt-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('payment.discounts.customLabel', '커스텀 할인율 (%)') }}
              </label>
              <div class="flex space-x-2">
                <input
                  v-model.number="customDiscountValue"
                  @input="handleCustomDiscountInput"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :placeholder="t('payment.discounts.customPlaceholder', '할인율 입력')"
                  :class="[
                    'flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    isCustomDiscount ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-300 dark:border-gray-600'
                  ]"
                />
                <button
                  @click="applyCustomDiscount"
                  :disabled="!customDiscountValue || customDiscountValue < 0 || customDiscountValue > 100"
                  class="btn btn-primary px-4 py-2 rounded-lg"
                >
                {{ t('common.apply', '적용') }}
              </button>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ t('payment.discounts.hint', '0-100% 사이의 값을 입력하세요') }}
            </p>
          </div>
        </div>

          <!-- Price Breakdown -->
          <div class="space-y-2 pt-4 border-t">
            <div class="flex justify-between text-gray-600 dark:text-gray-300">
              <span>{{ t('payment.summary.subtotal', '소계') }}:</span>
              <div class="text-right">
                <div>{{ formatPrice(cartStore.subtotal) }}</div>
                <div class="text-xs text-warning-600 dark:text-warning-400">
                  {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.subtotal)) }}
                </div>
              </div>
            </div>
            <div v-if="cartStore.discount > 0" class="flex justify-between text-green-600 dark:text-green-400">
              <span>{{ t('payment.summary.discount', '할인 ({percent}%)', { percent: cartStore.discount }) }}:</span>
              <div class="text-right">
                <div>-{{ formatPrice(cartStore.subtotal * cartStore.discount / 100) }}</div>
                <div class="text-xs">
                  -{{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.subtotal * cartStore.discount / 100)) }}
                </div>
              </div>
            </div>
            <div class="flex justify-between text-xl font-bold text-gray-800 dark:text-white pt-2 border-t dark:border-gray-600">
              <span>{{ t('payment.summary.total', '총액') }}:</span>
              <div class="text-right">
                <div>{{ formatPrice(cartStore.total) }}</div>
                <div class="text-sm text-warning-600 dark:text-warning-400 font-medium">
                  {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.total)) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="card p-4 xs:p-6 animate-fade-in">
          <h2 class="text-lg xs:text-xl font-semibold text-gray-900 dark:text-white mb-3 xs:mb-4">
            {{ t('payment.methods.title', '결제 방법') }}
          </h2>
          
          <div class="space-y-3 xs:space-y-4 mb-4 xs:mb-6">
            <label
              :class="[
                'flex items-center space-x-2 xs:space-x-3 p-3 xs:p-4 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200',
                hasLightningAddress ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'cursor-not-allowed opacity-60'
              ]"
            >
              <input
                v-model="paymentMethod"
                type="radio"
                value="lightning"
                class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                :disabled="!hasLightningAddress"
              />
              <div class="flex-1">
                <p class="text-sm xs:text-base font-medium text-gray-800 dark:text-white">
                  {{ t('payment.methods.lightning.title', '라이트닝 네트워크') }}
                </p>
                <p v-if="hasLightningAddress" class="text-xs xs:text-sm text-gray-600 dark:text-gray-300">
                  {{ t('payment.methods.lightning.subtitle', 'Wallet of Satoshi, Strike, Coinos') }}
                </p>
                <p v-else class="text-xs text-warning-600 dark:text-warning-400 mt-1">
                  {{ t('payment.methods.lightning.disabledHint', '사용자 설정에서 라이트닝 주소를 입력하면 사용할 수 있습니다') }}
                </p>
              </div>
              <UiIcon
                name="lightning"
                :class="['h-6 w-6', hasLightningAddress ? 'text-primary-500' : 'opacity-50']"
              />
            </label>
            
            <label class="flex items-center space-x-2 xs:space-x-3 p-3 xs:p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <input
                v-model="paymentMethod"
                type="radio"
                value="ecash"
                class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
              />
              <div class="flex-1">
                <p class="text-sm xs:text-base font-medium text-gray-800 dark:text-white">
                  {{ t('payment.methods.ecash.title', 'e-cash 결제') }}
                </p>
                <p class="text-xs xs:text-sm text-gray-600 dark:text-gray-300">
                  {{ t('payment.methods.ecash.subtitle', '라이트닝 네트워크 기반 익명 결제 (Cashu)') }}
                </p>
              </div>
              <UiIcon name="coin" class="h-6 w-6 text-primary-500" />
            </label>
            
            <label
              :class="[
                'flex items-center space-x-2 xs:space-x-3 p-3 xs:p-4 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors duration-200',
                hasUsdtAddress ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'cursor-not-allowed opacity-60'
              ]"
            >
              <input
                v-model="paymentMethod"
                type="radio"
                value="usdt"
                class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                :disabled="!hasUsdtAddress"
              />
              <div class="flex-1">
                <p class="text-sm xs:text-base font-medium text-gray-800 dark:text-white">
                  {{ t('payment.methods.usdt.title', 'USDT 테더 결제') }}
                </p>
                <p v-if="hasUsdtAddress" class="text-xs xs:text-sm text-gray-600 dark:text-gray-300">
                  {{ t('payment.methods.usdt.subtitle', '라이트닝 네트워크 기반 스테이블코인 결제') }}
                </p>
                <p v-else class="text-xs text-warning-600 dark:text-warning-400 mt-1">
                  {{ t('payment.methods.usdt.disabledHint', '사용자 설정에서 speed.app 주소를 입력하면 사용할 수 있습니다') }}
                </p>
              </div>
              <UiIcon
                name="banknote"
                :class="['h-6 w-6', hasUsdtAddress ? 'text-primary-500' : 'opacity-50']"
              />
            </label>
          </div>

          <button
            @click="handlePayment"
            :disabled="!paymentMethod || isGeneratingInvoice"
            class="btn btn-primary w-full py-3 px-3 xs:px-4 text-sm xs:text-base tablet:text-lg hidden sm:inline-flex sm:justify-center"
          >
            <div class="text-center">
              <div v-if="isGeneratingInvoice" class="flex items-center justify-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{{ t('payment.purchase.generating', '인보이스 생성 중...') }}</span>
              </div>
              <div v-else>
                <div>{{ t('payment.purchase.payAmount', '{amount} 결제하기', { amount: formatPrice(cartStore.total) }) }}</div>
                <div class="text-xs opacity-90">
                  {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.total)) }}
                </div>
              </div>
            </div>
          </button>
        </div>
    </div>

    <Teleport to="body">
      <Transition name="mobile-sheet">
        <div
          v-if="mobilePaySummaryVisible"
          class="sm:hidden fixed inset-x-0 bottom-0 z-30 px-3 xs:px-4 pb-3 safe-area-bottom pointer-events-none"
        >
          <div class="pointer-events-auto card rounded-3xl shadow-large border border-border-primary bg-white/95 dark:bg-gray-950/90">
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {{ t('payment.summary.total', '총액') }}
                  </p>
                  <p class="text-2xl font-bold text-text-primary">
                    {{ formattedTotal }}
                  </p>
                  <p
                    v-if="satsTotal"
                    class="text-xs text-warning-600 dark:text-warning-400 font-medium"
                  >
                    {{ satsTotal }}
                  </p>
                  <p
                    v-if="cartStore.discount > 0"
                    class="text-[11px] font-medium text-success-600 dark:text-success-400"
                  >
                    {{ t('payment.discounts.applied', '{percent}% 할인 적용', { percent: cartStore.discount }) }}
                  </p>
                </div>
                <button
                  @click="handlePayment"
                  :disabled="!paymentMethod || isGeneratingInvoice"
                  class="btn btn-primary flex-1 py-3 px-4 text-sm font-semibold"
                >
                  <span v-if="isGeneratingInvoice" class="flex items-center justify-center gap-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{{ t('payment.purchase.generating', '인보이스 생성 중...') }}</span>
                  </span>
                  <span v-else>{{ t('payment.purchase.payAmount', '{amount} 결제하기', { amount: formattedTotal }) }}</span>
                </button>
              </div>
              <button
                type="button"
                @click="$router.push('/shop')"
                class="w-full flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <UiIcon name="arrowLeft" class="h-4 w-4" />
                <span>{{ t('payment.actions.editCart', '상품 수정하기') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

      <!-- QR Code Modal -->
      <div
        v-if="showQRCode"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click="closeQRCode"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 transition-colors duration-200" @click.stop>
          <div class="text-center">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {{ getPaymentModalTitle() }}
            </h3>
            
            <!-- Lightning Address Display -->
            <div v-if="paymentMethod === 'lightning' && activeLightningAddress" class="mb-4">
              <div class="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3">
            <div class="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
              {{ t('payment.wallet.target', '결제 대상 지갑') }}
            </div>
                <div class="text-sm font-mono text-indigo-800 dark:text-indigo-200 break-all flex items-center gap-1">
                  <UiIcon name="lightning" class="h-4 w-4" />
                  <span>{{ activeLightningAddress }}</span>
                </div>
              </div>
            </div>
            
            <!-- QR Code Container -->
            <div class="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 inline-block">
              <!-- Loading State -->
              <div v-show="isGeneratingInvoice" class="flex flex-col items-center space-y-4 p-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
                <div class="text-sm text-gray-600">
                  {{ getLoadingMessage() }}
                </div>
              </div>
              
              <!-- QR Code -->
              <canvas ref="qrCanvas" v-show="!isGeneratingInvoice" class="block"></canvas>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <span v-if="isGeneratingInvoice">
                {{ getLoadingMessage() }}
              </span>
              <span
                v-else-if="paymentMethod === 'ecash' && isWaitingForEcashPayment"
              >
                {{ t('payment.status.ecashWaiting', 'e-cash 결제를 확인 중입니다. 결제가 완료되면 자동으로 주문이 확정됩니다.') }}
              </span>
              <span v-else>
                {{ getQRScanMessage() }}
              </span>
            </p>
            <div
              v-if="paymentMethod === 'ecash' && !isGeneratingInvoice && ecashRequestText"
              class="mb-4 space-y-2"
            >
              <button
                type="button"
                class="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                @click="copyEcashRequestText"
              >
                <UiIcon name="copy" class="h-4 w-4" />
                <span>{{ t('payment.actions.copyRequest', '결제 텍스트 복사') }}</span>
              </button>
              <p
                v-if="ecashCopyFeedback"
                :class="[
                  'text-sm',
                  ecashCopyFeedback.type === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                ]"
              >
                {{ ecashCopyFeedback.message }}
              </p>
            </div>
            
            <div class="flex space-x-3">
              <button
                @click="closeQRCode"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {{ t('payment.actions.cancel', '취소') }}
              </button>
              <button
                @click="completePayment"
                class="btn btn-primary flex-1 px-4 py-2 rounded-lg"
              >
                {{ t('payment.actions.complete', '결제 완료') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Modal -->
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import { bitcoinService } from '@/services/bitcoin'
import QRCode from 'qrcode'
import UiIcon from '@/components/ui/Icon.vue'
import { useLocaleStore } from '@/stores/locale'
import { useEcashStore } from '@/stores/ecash'
import { createPaymentRequest, createHttpPostTransport } from '@/services/nut18'
import { API_BASE_URL } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const localeStore = useLocaleStore()
const ecashStore = useEcashStore()
const t = localeStore.t
const apiBaseUrl = API_BASE_URL.replace(/\/+$/, '')
const ecashTransportBaseUrl = (
  import.meta.env.VITE_ECASH_TRANSPORT_BASE_URL || 'https://pos.onebitebitcoin.com'
).replace(/\/+$/, '')

const paymentMethod = ref('lightning')
const showQRCode = ref(false)
const showSuccess = ref(false)
const qrCanvas = ref<HTMLCanvasElement>()
const isGeneratingInvoice = ref(false)
const activeLightningAddress = ref<string>('')
const isWaitingForEcashPayment = ref(false)
const ecashRequestText = ref('')
const ecashCopyFeedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let ecashPollingTimer: number | null = null
let ecashCopyFeedbackTimer: ReturnType<typeof setTimeout> | null = null

// Check if user has configured wallet addresses
const hasLightningAddress = computed(() => {
  return !!(authStore.user?.lightning_address && authStore.user.lightning_address.trim())
})

const hasUsdtAddress = computed(() => {
  return !!(authStore.user?.usdt_address && authStore.user.usdt_address.trim())
})

const discountOptions = [5, 10, 15, 20, 25]
const customDiscountValue = ref<number | null>(null)
const isCustomDiscount = ref(false)
const hasCartItems = computed(() => cartStore.itemCount > 0)
const formattedTotal = computed(() => formatPrice(cartStore.total))
const satsTotal = computed(() => {
  const total = Number(cartStore.total || 0)
  if (total <= 0) return ''
  const sats = bitcoinStore.krwToSats(total)
  if (!sats) return ''
  return bitcoinStore.formatSats(sats)
})
const mobilePaySummaryVisible = computed(() => hasCartItems.value && !showQRCode.value && !showSuccess.value)

const formatPrice = (value: number | string): string => {
  const numeric = Number(value || 0)
  if (Number.isNaN(numeric)) {
    return '₩0'
  }
  return `₩${numeric.toLocaleString('ko-KR')}`
}

// Lightning Network configuration
const DEFAULT_LIGHTNING_DOMAIN = 'walletofsatoshi.com' // Default Lightning domain
const FALLBACK_LIGHTNING_ADDRESS = 'nsw@getalby.com' // Fallback if user has no Lightning address
const DEFAULT_MEMO = 'Shop Payment'

// Get user's Lightning address or construct it from username
function getUserLightningAddress(): string {
  // First check if user has a custom Lightning address in their profile
  if (authStore.user?.lightning_address) {
    return authStore.user.lightning_address
  }

  // If not, construct one using their username and default domain
  if (authStore.username) {
    return `${authStore.username}@${DEFAULT_LIGHTNING_DOMAIN}`
  }

  // Fallback to default Lightning address
  return FALLBACK_LIGHTNING_ADDRESS
}

// Get user's USDT address
function getUserUsdtAddress(): string {
  // Return user's USDT address from profile
  if (authStore.user?.usdt_address) {
    return authStore.user.usdt_address
  }

  // No fallback for USDT - must be configured
  return ''
}

// Get fallback Lightning addresses to try if primary fails
function getFallbackLightningAddresses(): string[] {
  const fallbacks = []
  
  // If using constructed address, try with different domains
  if (authStore.username && !authStore.user?.lightning_address) {
    fallbacks.push(`${authStore.username}@getalby.com`)
    fallbacks.push(`${authStore.username}@strike.army`)
  }
  
  // Always include the main fallback
  fallbacks.push(FALLBACK_LIGHTNING_ADDRESS)
  
  return fallbacks
}

// Initialize Bitcoin store
bitcoinStore.initialize()
ecashStore.initialize()

// Set default payment method based on available wallet addresses
// If lightning address is not set, switch to ecash
if (!hasLightningAddress.value) {
  paymentMethod.value = 'ecash'
}

async function handlePayment() {
  if (!paymentMethod.value) return

  stopEcashFlow()

  if (paymentMethod.value === 'cash') {
    await completePayment()
    return
  }

  // Show QR modal and start loading state
  showQRCode.value = true
  isGeneratingInvoice.value = true

  await nextTick() // 모달 렌더링

  if (qrCanvas.value) {
    // QR 코드 생성
    let qrData = ''

    // Lightning and USDT both use Lightning Network invoice generation
    if (paymentMethod.value === 'lightning' || paymentMethod.value === 'usdt') {
      // Generate real Lightning invoice using LNURL with fallback support
      try {
        // Ensure bitcoin price is loaded
        if (!bitcoinStore.btcPriceKrw) {
          console.log('💰 비트코인 가격 데이터가 없습니다. 로딩 중...')
          await bitcoinStore.fetchBitcoinPrice()
        }

        const satsAmount = bitcoinStore.krwToSats(cartStore.total)
        const paymentTypeLabel = getPaymentTypeLabel()
        const memo = `${paymentTypeLabel} - ${cartStore.total.toLocaleString('ko-KR')}원`

        console.log(`🚀 ${paymentMethod.value === 'usdt' ? 'USDT' : '라이트닝'} 인보이스 생성 시작`)
        console.log('💰 KRW 금액:', cartStore.total)
        console.log('💰 BTC 가격:', bitcoinStore.btcPriceKrw)
        console.log('💰 변환된 사츠:', satsAmount, '사츠')
        console.log('📝 메모:', memo)

        if (satsAmount <= 0) {
          throw new Error('사츠 변환 실패: 비트코인 가격 데이터를 가져올 수 없습니다')
        }

        // Get address based on payment method
        const primaryAddress = paymentMethod.value === 'usdt'
          ? getUserUsdtAddress()
          : getUserLightningAddress()

        console.log(`⚡ 기본 ${paymentMethod.value === 'usdt' ? 'USDT' : '라이트닝'} 주소 시도:`, primaryAddress)

        let result = await bitcoinService.getLnurl(primaryAddress, satsAmount, memo)
        let usedAddress = primaryAddress

        // If primary address fails with wallet not found and it's Lightning, try fallbacks
        if (!result.success && result.errorType === 'WALLET_NOT_FOUND' && paymentMethod.value === 'lightning') {
          const fallbackAddresses = getFallbackLightningAddresses()
          console.log('❌ 기본 주소 실패, 대체 주소 시도:', fallbackAddresses)

          for (const fallbackAddress of fallbackAddresses) {
            console.log('🔄 대체 주소 시도:', fallbackAddress)
            result = await bitcoinService.getLnurl(fallbackAddress, satsAmount, memo)

            if (result.success) {
              console.log('✅ 대체 주소로 인보이스 생성 성공:', fallbackAddress)
              usedAddress = fallbackAddress
              break
            }

            console.log('❌ 대체 주소 실패:', fallbackAddress, result.error)

            // If this fallback also fails with wallet not found, try next one
            if (result.errorType !== 'WALLET_NOT_FOUND') {
              break // Don't try more fallbacks for other types of errors
            }
          }
        }

        if (result.success && result.invoice) {
          console.log(`🎉 ${paymentMethod.value === 'usdt' ? 'USDT' : '라이트닝'} 인보이스 생성 성공!`)
          console.log('📄 인보이스:', result.invoice.substring(0, 50) + '...')
          console.log('📍 사용한 주소:', usedAddress)

          qrData = result.invoice
          activeLightningAddress.value = usedAddress

          // Generate QR code immediately after getting invoice
          try {
            console.log('🔲 QR 코드 생성 중...')
            console.log('📱 QR 데이터 길이:', qrData.length)
            console.log('🎯 QR 데이터 미리보기:', qrData.substring(0, 100) + '...')

            await QRCode.toCanvas(qrCanvas.value, qrData, {
              width: 300,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })

            console.log('✅ QR 코드 생성 성공!')
            // Stop loading state after successful QR generation
            isGeneratingInvoice.value = false
          } catch (qrError) {
            console.error('💥 QR 코드 생성 오류:', qrError)
            isGeneratingInvoice.value = false
            alert(t('payment.errors.qr', 'QR 코드 생성에 실패했습니다.'))
            showQRCode.value = false
            return
          }
        } else {
          console.log(`💥 모든 ${paymentMethod.value === 'usdt' ? 'USDT' : '라이트닝'} 주소 시도 실패!`)
          console.log('🔍 최종 오류 유형:', result.errorType)
          console.log('❌ 최종 오류 메시지:', result.error)

          // Stop loading state on error
          isGeneratingInvoice.value = false
          activeLightningAddress.value = ''

          // Show user-friendly error message based on error type
          let errorMessage = t('payment.errors.invoice', 'Lightning 인보이스 생성에 실패했습니다.')

          switch (result.errorType) {
            case 'WALLET_NOT_FOUND':
              errorMessage = t('payment.errors.invoiceWallet', 'Lightning 지갑을 찾을 수 없습니다.\n주소: {address}\n\n설정에서 올바른 Lightning 주소를 설정하거나\n다른 결제 방법을 선택해주세요.', {
                address: primaryAddress,
              })
              break
            case 'INVALID_AMOUNT':
              errorMessage = t('payment.errors.invoiceLimit', '결제 금액이 Lightning 지갑 한도를 벗어납니다.\n{detail}\n\n다른 결제 방법을 선택해주세요.', {
                detail: result.error ?? '',
              })
              break
            case 'NETWORK_ERROR':
              errorMessage = t('payment.errors.invoiceNetwork', '네트워크 오류가 발생했습니다.\n{detail}\n\n잠시 후 다시 시도하거나 다른 결제 방법을 선택해주세요.', {
                detail: result.error ?? '',
              })
              break
            default:
              errorMessage = t('payment.errors.invoiceGeneric', '{detail}\n\n다른 결제 방법을 선택해주세요.', {
                detail: result.error ?? '',
              })
          }

          alert(errorMessage)
          showQRCode.value = false
          return
        }
      } catch (error) {
        console.error(`💥 ${paymentMethod.value === 'usdt' ? 'USDT' : '라이트닝'} 인보이스 생성 중 예상치 못한 오류:`, error)
        // Stop loading state on unexpected error
        isGeneratingInvoice.value = false
        activeLightningAddress.value = ''
        alert(t('payment.errors.unexpected', '예상치 못한 오류가 발생했습니다.\n다른 결제 방법을 선택해주세요.'))
        showQRCode.value = false
        return
      }
    } else if (paymentMethod.value === 'ecash') {
      try {
        if (!bitcoinStore.btcPriceKrw) {
          await bitcoinStore.fetchBitcoinPrice()
        }

        const satsAmount = bitcoinStore.krwToSats(cartStore.total)
        if (!satsAmount || satsAmount <= 0) {
          throw new Error('사츠 변환에 실패했습니다')
        }

        const normalizedSats = Math.max(1, Math.round(satsAmount))
        const requestId = `creq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        const transportUrl = buildEcashTransportUrl(requestId)
        const memo = getPaymentTypeLabel()
        const description = `${memo} - ${cartStore.total.toLocaleString('ko-KR')} KRW`

        const requestString = createPaymentRequest({
          id: requestId,
          amount: normalizedSats,
          unit: 'sat',
          single_use: true,
          mints: [ecashStore.mintUrl],
          description,
          transports: [createHttpPostTransport(transportUrl)]
        })

        console.log('💳 e-cash payment request generated:', requestId)
        qrData = requestString
        ecashRequestText.value = requestString
        startEcashPaymentPolling(requestId)
        isWaitingForEcashPayment.value = true

        await QRCode.toCanvas(qrCanvas.value, qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })

        isGeneratingInvoice.value = false
      } catch (error) {
        console.error('💥 e-cash 요청 생성 오류:', error)
        isGeneratingInvoice.value = false
        isWaitingForEcashPayment.value = false
        alert(t('payment.errors.qr', 'QR 코드 생성에 실패했습니다.'))
        showQRCode.value = false
      }
    }
  }
}

function buildEcashTransportUrl(requestId: string) {
  return `${ecashTransportBaseUrl}/api/products/payments/requests/${encodeURIComponent(requestId)}/`
}

function stopEcashFlow() {
  if (ecashPollingTimer !== null) {
    clearInterval(ecashPollingTimer)
    ecashPollingTimer = null
  }
  isWaitingForEcashPayment.value = false
  resetEcashRequestState()
}

function startEcashPaymentPolling(requestId: string) {
  const checkUrl = buildEcashTransportUrl(requestId)
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
      } else if (response.status !== 404) {
        console.error('e-cash 결제 상태 확인에 실패했습니다:', response.statusText)
      }
    } catch (error) {
      console.error('e-cash 결제 폴링 중 오류:', error)
    }

    attempts += 1
    if (attempts >= maxAttempts) {
      console.warn('e-cash 결제 확인 제한 시간 초과')
      stopEcashFlow()
    }
  }

  poll()
  ecashPollingTimer = window.setInterval(poll, 3000)
}

function resetEcashRequestState() {
  ecashRequestText.value = ''
  if (ecashCopyFeedbackTimer) {
    clearTimeout(ecashCopyFeedbackTimer)
    ecashCopyFeedbackTimer = null
  }
  ecashCopyFeedback.value = null
}

function setEcashCopyFeedback(type: 'success' | 'error', message: string) {
  ecashCopyFeedback.value = { type, message }
  if (ecashCopyFeedbackTimer) {
    clearTimeout(ecashCopyFeedbackTimer)
  }
  ecashCopyFeedbackTimer = window.setTimeout(() => {
    ecashCopyFeedback.value = null
    ecashCopyFeedbackTimer = null
  }, 3500)
}

async function copyEcashRequestText() {
  if (!ecashRequestText.value) return
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    setEcashCopyFeedback('error', t('ecashSend.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
    return
  }
  try {
    await navigator.clipboard.writeText(ecashRequestText.value)
    setEcashCopyFeedback('success', t('ecashSend.copied', '요청 텍스트를 복사했습니다.'))
  } catch (error) {
    console.error('Failed to copy e-cash request text:', error)
    setEcashCopyFeedback('error', t('ecashSend.errors.clipboard', '클립보드 접근이 거부되었습니다.'))
  }
}

async function handleEcashPaymentPayload(payload: any, requestId: string) {
  try {
    const proofs = Array.isArray(payload?.proofs) ? payload.proofs : []
    if (!proofs.length) {
      console.warn('수신된 e-cash 결제에 proof 데이터가 없습니다.')
      return
    }

    const mintForProofs = payload?.mint || ecashStore.mintUrl
    ecashStore.addProofs(
      proofs.map((proof: Record<string, any>) => ({
        ...proof,
        mintUrl: proof?.mintUrl || mintForProofs
      })),
      mintForProofs
    )

    await consumeEcashRequest(requestId)
    stopEcashFlow()
    await completePayment()
  } catch (error) {
    console.error('e-cash 결제 처리 중 오류:', error)
  }
}

async function consumeEcashRequest(requestId: string) {
  try {
    const consumeUrl = `${buildEcashTransportUrl(requestId)}?consume=true`
    await fetch(consumeUrl)
  } catch (error) {
    console.error('e-cash 결제 요청 정리 중 오류:', error)
  }
}

function closeQRCode() {
  showQRCode.value = false
  isGeneratingInvoice.value = false
  activeLightningAddress.value = ''
  stopEcashFlow()
}

async function completePayment() {
  stopEcashFlow()
  showQRCode.value = false
  isGeneratingInvoice.value = false
  activeLightningAddress.value = ''
  
  try {
    const result = await cartStore.createOrder(paymentMethod.value)
    if (result.success) {
      showSuccess.value = true
    } else {
      alert(result.message || t('payment.errors.orderCreation', '주문 생성에 실패했습니다'))
    }
  } catch (error) {
    console.error('결제 완료 처리 오류:', error)
    alert(t('payment.errors.completion', '결제 처리 중 오류가 발생했습니다'))
  }
}

function returnToShop() {
  showSuccess.value = false
  router.push('/shop')
}

// Discount handling functions
function selectPresetDiscount(percentage: number) {
  cartStore.setDiscount(percentage)
  isCustomDiscount.value = false
  customDiscountValue.value = null
}

function handleCustomDiscountInput() {
  // Update the custom discount flag when user starts typing
  if (customDiscountValue.value !== null) {
    isCustomDiscount.value = true
  }
}

function applyCustomDiscount() {
  if (customDiscountValue.value !== null && customDiscountValue.value >= 0 && customDiscountValue.value <= 100) {
    cartStore.setDiscount(customDiscountValue.value)
    isCustomDiscount.value = true
  }
}

// Payment method helper functions
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

onBeforeUnmount(() => {
  stopEcashFlow()
})
</script>
