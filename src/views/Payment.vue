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

            <label class="flex items-center space-x-2 xs:space-x-3 p-3 xs:p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed opacity-60 transition-colors duration-200">
              <input
                v-model="paymentMethod"
                type="radio"
                value="ecash"
                class="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                disabled
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import UiIcon from '@/components/ui/Icon.vue'
import { useLocaleStore } from '@/stores/locale'
import { useEcashStore } from '@/stores/ecash'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const localeStore = useLocaleStore()
const ecashStore = useEcashStore()
const t = localeStore.t

const paymentMethod = ref('lightning')
const customDiscountValue = ref<number | null>(null)
const isCustomDiscount = ref(false)

// Check if user has configured wallet addresses
const hasLightningAddress = computed(() => {
  return !!(authStore.user?.lightning_address && authStore.user.lightning_address.trim())
})

const hasUsdtAddress = computed(() => {
  return !!(authStore.user?.usdt_address && authStore.user.usdt_address.trim())
})

const discountOptions = [5, 10, 15, 20, 25]
const hasCartItems = computed(() => cartStore.itemCount > 0)
const formattedTotal = computed(() => formatPrice(cartStore.total))
const satsTotal = computed(() => {
  const total = Number(cartStore.total || 0)
  if (total <= 0) return ''
  const sats = bitcoinStore.krwToSats(total)
  if (!sats) return ''
  return bitcoinStore.formatSats(sats)
})
const mobilePaySummaryVisible = computed(() => hasCartItems.value)

const formatPrice = (value: number | string): string => {
  const numeric = Number(value || 0)
  if (Number.isNaN(numeric)) {
    return '₩0'
  }
  return `₩${numeric.toLocaleString('ko-KR')}`
}

// Initialize Bitcoin store
bitcoinStore.initialize()
ecashStore.initialize()

// Set default payment method based on available wallet addresses
// If lightning address is not set, try to switch to usdt
if (!hasLightningAddress.value && hasUsdtAddress.value) {
  paymentMethod.value = 'usdt'
}

async function handlePayment() {
  if (!paymentMethod.value) return
  
  router.push({
    name: 'payment-qr',
    query: { method: paymentMethod.value }
  })
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
</script>
