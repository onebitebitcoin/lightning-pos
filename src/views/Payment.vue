<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
    <!-- Header -->
    <header class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <button
            @click="$router.push('/shop')"
            class="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <span>←</span>
            <span>상점으로 돌아가기</span>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">결제</h1>
        </div>
        <span class="text-gray-600 dark:text-gray-400">{{ authStore.username }}</span>
      </div>
    </header>

    <div class="container mx-auto px-3 xs:px-4 py-4 xs:py-6 tablet:py-8 max-w-4xl">
      <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4 xs:gap-6 tablet:gap-8">
        <!-- Order Summary -->
        <div class="card p-4 xs:p-6 animate-fade-in">
          <h2 class="text-lg xs:text-xl font-semibold text-gray-900 dark:text-white mb-3 xs:mb-4">주문 내역</h2>
          
          <div class="space-y-3 mb-6">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
            >
              <div>
                <p class="font-medium text-gray-800 dark:text-white">{{ item.product_name }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-300">{{ item.quantity }} × ₩{{ Number(item.product_price || 0).toLocaleString('ko-KR') }}</p>
              </div>
              <p class="font-medium text-gray-800 dark:text-white">₩{{ Number(item.total_price || 0).toLocaleString('ko-KR') }}</p>
            </div>
          </div>

          <!-- Discount Section -->
          <div class="mb-4 xs:mb-6">
            <h3 class="text-base xs:text-lg font-medium text-gray-800 dark:text-white mb-2 xs:mb-3">할인 적용</h3>
            <div class="grid grid-cols-2 gap-2 xs:gap-3 mb-2 xs:mb-3">
              <button
                v-for="discountOption in discountOptions"
                :key="discountOption"
                @click="selectPresetDiscount(discountOption)"
                :class="[
                  'px-2 xs:px-4 py-1.5 xs:py-2 rounded-lg border transition-colors text-xs xs:text-sm',
                  cartStore.discount === discountOption && !isCustomDiscount
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-200'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                ]"
              >
                {{ discountOption }}% 할인
              </button>
              <button
                @click="selectPresetDiscount(0)"
                :class="[
                  'px-2 xs:px-4 py-1.5 xs:py-2 rounded-lg border transition-colors text-xs xs:text-sm',
                  cartStore.discount === 0 && !isCustomDiscount
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-200'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                ]"
              >
                할인 없음
              </button>
            </div>
            
            <!-- Custom Discount Input -->
            <div class="mt-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                커스텀 할인율 (%)
              </label>
              <div class="flex space-x-2">
                <input
                  v-model.number="customDiscountValue"
                  @input="handleCustomDiscountInput"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="할인율 입력"
                  :class="[
                    'flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    isCustomDiscount ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-300 dark:border-gray-600'
                  ]"
                />
                <button
                  @click="applyCustomDiscount"
                  :disabled="!customDiscountValue || customDiscountValue < 0 || customDiscountValue > 100"
                  class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  적용
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">0-100% 사이의 값을 입력하세요</p>
            </div>
          </div>

          <!-- Price Breakdown -->
          <div class="space-y-2 pt-4 border-t">
            <div class="flex justify-between text-gray-600 dark:text-gray-300">
              <span>소계:</span>
              <div class="text-right">
                <div>₩{{ cartStore.subtotal.toLocaleString('ko-KR') }}</div>
                <div class="text-xs text-warning-600 dark:text-warning-400">
                  {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.subtotal)) }}
                </div>
              </div>
            </div>
            <div v-if="cartStore.discount > 0" class="flex justify-between text-green-600 dark:text-green-400">
              <span>할인 ({{ cartStore.discount }}%):</span>
              <div class="text-right">
                <div>-₩{{ (cartStore.subtotal * cartStore.discount / 100).toLocaleString('ko-KR') }}</div>
                <div class="text-xs">
                  -{{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.subtotal * cartStore.discount / 100)) }}
                </div>
              </div>
            </div>
            <div class="flex justify-between text-xl font-bold text-gray-800 dark:text-white pt-2 border-t dark:border-gray-600">
              <span>총액:</span>
              <div class="text-right">
                <div>₩{{ cartStore.total.toLocaleString('ko-KR') }}</div>
                <div class="text-sm text-warning-600 dark:text-warning-400 font-medium">
                  {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.total)) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="card p-4 xs:p-6 animate-fade-in">
          <h2 class="text-lg xs:text-xl font-semibold text-gray-900 dark:text-white mb-3 xs:mb-4">결제 방법</h2>
          
          <div class="space-y-3 xs:space-y-4 mb-4 xs:mb-6">
            <label class="flex items-center space-x-2 xs:space-x-3 p-3 xs:p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <input
                v-model="paymentMethod"
                type="radio"
                value="lightning"
                class="w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <div class="flex-1">
                <p class="text-sm xs:text-base font-medium text-gray-800 dark:text-white">라이트닝 네트워크</p>
                <p class="text-xs xs:text-sm text-gray-600 dark:text-gray-300">빠른 비트코인 결제</p>
              </div>
              <span class="text-xl xs:text-2xl">⚡</span>
            </label>


            <label class="flex items-center space-x-2 xs:space-x-3 p-3 xs:p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <input
                v-model="paymentMethod"
                type="radio"
                value="cash"
                class="w-4 h-4 text-blue-600 dark:text-blue-400"
              />
              <div class="flex-1">
                <p class="text-sm xs:text-base font-medium text-gray-800 dark:text-white">현금</p>
                <p class="text-xs xs:text-sm text-gray-600 dark:text-gray-300">카운터에서 결제</p>
              </div>
              <span class="text-xl xs:text-2xl">💵</span>
            </label>
          </div>

          <button
            @click="handlePayment"
            :disabled="!paymentMethod"
            class="btn btn-success w-full py-3 px-3 xs:px-4 text-sm xs:text-base tablet:text-lg"
          >
            <div class="text-center">
              <div>₩{{ cartStore.total.toLocaleString('ko-KR') }} 결제하기</div>
              <div class="text-xs opacity-90">
                {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.total)) }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- QR Code Modal -->
      <div
        v-if="showQRCode"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click="closeQRCode"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 transition-colors duration-200" @click.stop>
          <div class="text-center">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {{ paymentMethod === 'lightning' ? '라이트닝 인보이스' : '결제 QR 코드' }}
            </h3>
            
            <div class="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4 inline-block">
              <canvas ref="qrCanvas" class="block"></canvas>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {{ paymentMethod === 'lightning' 
                ? '라이트닝 지갑으로 QR 코드를 스캔하세요' 
                : '결제를 완료하려면 QR 코드를 스캔하세요' }}
            </p>
            
            <div class="flex space-x-3">
              <button
                @click="closeQRCode"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                취소
              </button>
              <button
                @click="completePayment"
                class="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200"
              >
                결제 완료
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
          <div class="text-6xl mb-4">✅</div>
          <h3 class="text-2xl font-semibold text-gray-800 dark:text-white mb-2">결제 성공!</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">구매해 주셔서 감사합니다</p>
          <button
            @click="returnToShop"
            class="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors duration-200"
          >
            쇼핑 계속하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import QRCode from 'qrcode'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()

const paymentMethod = ref('')
const showQRCode = ref(false)
const showSuccess = ref(false)
const qrCanvas = ref<HTMLCanvasElement>()

const discountOptions = [5, 10, 15, 20, 25]
const customDiscountValue = ref<number | null>(null)
const isCustomDiscount = ref(false)

// Initialize Bitcoin store
bitcoinStore.initialize()

async function handlePayment() {
  if (!paymentMethod.value) return

  if (paymentMethod.value === 'cash') {
    await completePayment()
    return
  }

  showQRCode.value = true
  await nextTick()
  
  if (qrCanvas.value) {
    const qrData = paymentMethod.value === 'lightning' 
      ? `lnbc${Math.floor(cartStore.total * 100000)}u1p...` // Mock lightning invoice
      : `payment:${Date.now()}:${cartStore.total.toFixed(2)}` // Mock payment data
    
    try {
      await QRCode.toCanvas(qrCanvas.value, qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }
}

function closeQRCode() {
  showQRCode.value = false
}

async function completePayment() {
  showQRCode.value = false
  
  try {
    const result = await cartStore.createOrder(paymentMethod.value)
    if (result.success) {
      showSuccess.value = true
    } else {
      alert(result.message || '주문 생성에 실패했습니다')
    }
  } catch (error) {
    console.error('Payment completion error:', error)
    alert('결제 처리 중 오류가 발생했습니다')
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
</script>