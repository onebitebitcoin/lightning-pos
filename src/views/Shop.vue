<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200">
      <div class="container mx-auto px-4 py-3 md:py-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center md:hidden">
          <h1 class="text-lg font-bold text-gray-800 dark:text-white">한입 POS</h1>
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <span class="text-lg">{{ showMobileMenu ? '✕' : '☰' }}</span>
          </button>
        </div>

        <!-- Mobile Menu -->
        <div v-if="showMobileMenu" class="md:hidden mt-3 pt-3 border-t dark:border-gray-600 space-y-2">
          <div class="text-sm text-gray-600 dark:text-gray-300 mb-3">환영합니다, {{ authStore.username }}님!</div>
          <div class="flex flex-col space-y-2">
            <button
              @click="themeStore.toggleTheme"
              class="flex items-center justify-between w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <span class="text-sm">{{ themeStore.isDark ? '라이트 모드' : '다크 모드' }}</span>
              <span class="text-lg">{{ themeStore.isDark ? '☀️' : '🌙' }}</span>
            </button>
            <button
              @click="$router.push('/settings'); showMobileMenu = false"
              class="w-full p-2 text-sm bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
            >
              설정
            </button>
            <button
              @click="handleLogout"
              class="w-full p-2 text-sm bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200 text-left"
            >
              로그아웃
            </button>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">한입 POS</h1>
          <div class="flex items-center space-x-4">
            <span class="text-gray-600 dark:text-gray-300">환영합니다, {{ authStore.username }}님!</span>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              :title="themeStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
            >
              <span class="text-xl">{{ themeStore.isDark ? '☀️' : '🌙' }}</span>
            </button>
            <button
              @click="$router.push('/settings')"
              class="px-4 py-2 text-sm bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              설정
            </button>
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-4 md:py-8 flex flex-col lg:flex-row gap-4 lg:gap-8">
      <!-- Mobile Cart Toggle -->
      <div class="lg:hidden mb-4">
        <button
          @click="showMobileCart = !showMobileCart"
          class="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center justify-between"
        >
          <span>장바구니 ({{ cartStore.itemCount }}개)</span>
          <span class="text-lg">{{ showMobileCart ? '▲' : '▼' }}</span>
        </button>
      </div>

      <!-- Mobile Cart -->
      <div v-if="showMobileCart" class="lg:hidden mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 transition-colors duration-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">장바구니</h3>
          <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-2 py-1 rounded-full">
            {{ cartStore.itemCount }}개 상품
          </span>
        </div>

        <!-- Mobile Cart Loading -->
        <div v-if="cartStore.isLoading" class="text-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">장바구니 로딩 중...</p>
        </div>

        <!-- Mobile Empty Cart -->
        <div v-else-if="cartStore.items.length === 0" class="text-center py-4">
          <div class="text-gray-400 dark:text-gray-500 text-2xl mb-2">🛒</div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">장바구니가 비어있습니다</p>
        </div>

        <!-- Mobile Cart Items -->
        <div v-else class="space-y-2 mb-4">
          <div
            v-for="item in cartStore.items"
            :key="item.id"
            class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-800 dark:text-white text-sm truncate">{{ item.product_name }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-300">개당 ₩{{ Number(item.product_price || 0).toLocaleString('ko-KR') }}</p>
            </div>
            <div class="flex items-center space-x-1 ml-2">
              <button
                @click="handleUpdateQuantity(item.id, item.quantity - 1)"
                :disabled="cartStore.isLoading"
                class="w-6 h-6 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center justify-center disabled:bg-gray-200 text-sm"
              >
                -
              </button>
              <span class="w-6 text-center font-medium text-gray-800 dark:text-white text-sm">{{ item.quantity }}</span>
              <button
                @click="handleUpdateQuantity(item.id, item.quantity + 1)"
                :disabled="cartStore.isLoading"
                class="w-6 h-6 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors flex items-center justify-center disabled:bg-gray-200 text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div v-if="cartStore.items.length > 0" class="border-t dark:border-gray-600 pt-3">
          <div class="flex justify-between text-base font-semibold text-gray-800 dark:text-white mb-3">
            <span>총계:</span>
            <span>₩{{ cartStore.subtotal.toLocaleString('ko-KR') }}</span>
          </div>
          <button
            @click="$router.push('/payment')"
            class="w-full bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
          >
            결제하기
          </button>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="flex-1 lg:order-1">
        <h2 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4 md:mb-6">상품</h2>
        <!-- Loading State -->
        <div v-if="productStore.isLoading" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-300">상품을 불러오는 중...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="productStore.error" class="text-center py-12">
          <div class="text-red-500 dark:text-red-400 mb-4">⚠️</div>
          <p class="text-red-600 dark:text-red-400 mb-4">{{ productStore.error }}</p>
          <button
            @click="productStore.fetchProducts()"
            class="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            다시 시도
          </button>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          <div
            v-for="product in productStore.availableProducts"
            :key="product.id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              :src="product.image || product.image_url"
              :alt="product.name"
              class="w-full h-48 object-cover"
              @error="handleImageError"
            />
            <div class="p-3 md:p-4">
              <h3 class="font-semibold text-gray-800 dark:text-white mb-2 text-sm md:text-base line-clamp-2">{{ product.name }}</h3>
              <p v-if="product.description" class="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{{ product.description }}</p>
              <p class="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3">₩{{ Number(product.price || 0).toLocaleString('ko-KR') }}</p>
              <button
                @click="handleAddToCart(product)"
                :disabled="cartStore.isLoading"
                class="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-3 md:px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400 dark:disabled:bg-gray-600 text-sm md:text-base"
              >
                <span v-if="cartStore.isLoading">추가 중...</span>
                <span v-else>장바구니 담기</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Cart Sidebar -->
      <div class="hidden lg:block lg:order-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-fit sticky top-8 transition-colors duration-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white">장바구니</h3>
          <span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-2 py-1 rounded-full">
            {{ cartStore.itemCount }}개 상품
          </span>
        </div>

        <!-- Cart Loading -->
        <div v-if="cartStore.isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">장바구니 로딩 중...</p>
        </div>

        <!-- Empty Cart -->
        <div v-else-if="cartStore.items.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 text-4xl mb-2">🛒</div>
          <p class="text-gray-500 dark:text-gray-400">장바구니가 비어있습니다</p>
        </div>

        <!-- Cart Items -->
        <div v-else class="space-y-3 mb-6">
          <div
            v-for="item in cartStore.items"
            :key="item.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <div class="flex-1">
              <p class="font-medium text-gray-800 dark:text-white">{{ item.product_name }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-300">개당 ₩{{ Number(item.product_price || 0).toLocaleString('ko-KR') }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="handleUpdateQuantity(item.id, item.quantity - 1)"
                :disabled="cartStore.isLoading"
                class="w-8 h-8 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors flex items-center justify-center disabled:bg-gray-200"
              >
                -
              </button>
              <span class="w-8 text-center font-medium text-gray-800 dark:text-white">{{ item.quantity }}</span>
              <button
                @click="handleUpdateQuantity(item.id, item.quantity + 1)"
                :disabled="cartStore.isLoading"
                class="w-8 h-8 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors flex items-center justify-center disabled:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div v-if="cartStore.items.length > 0" class="border-t dark:border-gray-600 pt-4">
          <div class="flex justify-between text-base lg:text-lg font-semibold text-gray-800 dark:text-white mb-4">
            <span>총계:</span>
            <span>₩{{ cartStore.subtotal.toLocaleString('ko-KR') }}</span>
          </div>
          <button
            @click="$router.push('/payment')"
            class="w-full bg-green-600 dark:bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium text-lg"
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/products'
import { useThemeStore } from '@/stores/theme'
import type { Product } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productStore = useProductStore()
const themeStore = useThemeStore()

// Mobile UI state
const showMobileCart = ref(false)
const showMobileMenu = ref(false)

// Initialize data when component mounts
onMounted(async () => {
  // Initialize cart if user is logged in
  if (authStore.isLoggedIn) {
    await cartStore.initialize()
  }
})

// Handle adding product to cart
async function handleAddToCart(product: Product) {
  if (!authStore.isLoggedIn) {
    alert('로그인이 필요합니다')
    return
  }

  try {
    const result = await cartStore.addItem(product)
    if (!result.success) {
      alert(result.message || '장바구니 추가에 실패했습니다')
    }
  } catch (error) {
    console.error('Error adding to cart:', error)
    alert('장바구니 추가 중 오류가 발생했습니다')
  }
}

// Handle updating cart item quantity
async function handleUpdateQuantity(itemId: number, newQuantity: number) {
  if (newQuantity <= 0) {
    // Remove item if quantity is 0 or less
    const result = await cartStore.removeItem(itemId)
    if (!result.success) {
      alert(result.message || '아이템 제거에 실패했습니다')
    }
  } else {
    // Update quantity
    const result = await cartStore.updateItem(itemId, newQuantity)
    if (!result.success) {
      alert(result.message || '수량 변경에 실패했습니다')
    }
  }
}

// Handle image loading error
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  
  // Log the failed URL for debugging
  console.warn('Image failed to load:', img.src)
  
  // Prevent infinite error loops by checking if we've already handled this error
  if (img.dataset.errorHandled === 'true') {
    return
  }
  
  // Mark as handled to prevent infinite loops
  img.dataset.errorHandled = 'true'
  
  // Remove the error handler to prevent further errors
  img.onerror = null
  
  // Use a data URL as fallback to avoid network requests
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+Cjwvc3ZnPgo='
}

// Handle logout
async function handleLogout() {
  try {
    await authStore.logout()
    await router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Even if logout fails, redirect to login
    await router.push('/login')
  }
}
</script>