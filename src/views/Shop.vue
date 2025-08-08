<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
    <!-- Header -->
    <header class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-3 md:py-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center md:hidden">
          <h1 
            @touchstart="startLongPress"
            @touchend="endLongPress"
            @touchcancel="endLongPress"
            @mousedown="startLongPress"
            @mouseup="endLongPress"
            @mouseleave="endLongPress"
            class="text-lg font-bold text-gray-900 dark:text-white select-none"
          >
            한입 POS
          </h1>
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="btn btn-secondary p-2 rounded-xl"
          >
            <span class="text-lg">{{ showMobileMenu ? '✕' : '☰' }}</span>
          </button>
        </div>

        <!-- Mobile Menu -->
        <div v-if="showMobileMenu" class="md:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 animate-slide-up">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">환영합니다, {{ authStore.username }}님!</div>
          
          <!-- Mobile Bitcoin Price -->
          <div class="p-2 mb-2">
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">BTC 가격</div> 
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-1 text-sm">
                <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                  <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                </span>
                <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                  ⚠️
                </span>
                <template v-else>
                  <span class="text-orange-500">₿</span>
                  <span class="text-gray-900 dark:text-white font-medium">₩{{ Math.round(bitcoinStore.btcPriceKrw).toLocaleString('ko-KR', { maximumFractionDigits: 0 }) }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" title="가격 정보가 오래되었습니다">
                    ⚠️
                  </span>
                </template>
              </div>
              <button
                @click="bitcoinStore.refresh()"
                :disabled="bitcoinStore.isLoading"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                title="가격 새로고침"
              >
                ↻
              </button>
            </div>
          </div>
          
          <div class="flex flex-col space-y-2">
            <button
              @click="themeStore.toggleTheme"
              class="btn btn-outline flex items-center justify-between w-full p-3 text-sm"
            >
              <span>{{ themeStore.isDark ? '라이트 모드' : '다크 모드' }}</span>
              <span class="text-lg">{{ themeStore.isDark ? '☀️' : '🌙' }}</span>
            </button>
            <button
              v-show="showAdminControls && authStore.isAdmin"
              @click="$router.push('/admin'); showMobileMenu = false"
              class="btn w-full p-3 text-sm text-left bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white"
            >
              관리자 패널
            </button>
            <button
              v-show="showAdminControls"
              @click="$router.push('/settings'); showMobileMenu = false"
              class="btn btn-secondary w-full p-3 text-sm text-left"
            >
              설정
            </button>
            <button
              v-show="showAdminControls"
              @click="handleLogout"
              class="btn w-full p-3 text-sm text-left bg-error-600 hover:bg-error-700 focus:ring-error-500 text-white"
            >
              로그아웃
            </button>
            <div v-if="!showAdminControls" class="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              로고를 길게 눌러 관리자 메뉴 표시
            </div>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center">
          <div class="flex items-center space-x-6">
            <h1 
              @mousedown="startLongPress"
              @mouseup="endLongPress"
              @mouseleave="endLongPress"
              class="text-2xl font-bold text-gray-900 dark:text-white select-none cursor-default"
            >
              한입 POS
            </h1>
            <!-- Bitcoin Price Indicator -->
            <div class="flex items-center space-x-3">
              <div class="text-right">
                <div class="text-sm text-gray-500 dark:text-gray-400">BTC 가격</div>
                <div class="flex items-center space-x-1 text-sm font-medium">
                  <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                    <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400 inline-block"></div>
                  </span>
                  <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                    ⚠️
                  </span>
                  <template v-else>
                    <span class="text-orange-500">₿</span>
                    <span class="text-gray-900 dark:text-white">₩{{ Math.round(bitcoinStore.btcPriceKrw).toLocaleString('ko-KR', { maximumFractionDigits: 0 }) }}</span>
                    <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" title="가격 정보가 오래되었습니다">
                      ⚠️
                    </span>
                  </template>
                </div>
              </div>
              <button
                @click="bitcoinStore.refresh()"
                :disabled="bitcoinStore.isLoading"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                title="가격 새로고침"
              >
                ↻
              </button>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-gray-600 dark:text-gray-400">환영합니다, {{ authStore.username }}님!</span>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              :title="themeStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
            >
              <span class="text-xl">{{ themeStore.isDark ? '☀️' : '🌙' }}</span>
            </button>
            <button
              v-show="showAdminControls && authStore.isAdmin"
              @click="$router.push('/admin')"
              class="btn px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white"
            >
              관리자 패널
            </button>
            <button
              v-show="showAdminControls"
              @click="$router.push('/settings')"
              class="btn btn-secondary px-4 py-2 text-sm"
            >
              설정
            </button>
            <button
              v-show="showAdminControls"
              @click="handleLogout"
              class="btn px-4 py-2 text-sm bg-error-600 hover:bg-error-700 focus:ring-error-500 text-white"
            >
              로그아웃
            </button>
            <div v-if="!showAdminControls" class="text-xs text-gray-500 dark:text-gray-400">
              로고 길게 누르기
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-3 xs:px-4 py-3 xs:py-4 tablet:py-6 lg:py-8 flex flex-col lg:flex-row gap-3 xs:gap-4 tablet:gap-6 lg:gap-8">
      <!-- Mobile Cart Toggle -->
      <div class="lg:hidden mb-3 xs:mb-4">
        <button
          @click="showMobileCart = !showMobileCart"
          class="btn btn-primary w-full py-2 xs:py-3 px-3 xs:px-4 flex items-center justify-between text-sm xs:text-base"
        >
          <span>장바구니 ({{ cartStore.itemCount }}개)</span>
          <span class="text-base xs:text-lg">{{ showMobileCart ? '▲' : '▼' }}</span>
        </button>
      </div>

      <!-- Mobile Cart -->
      <div v-if="showMobileCart" class="lg:hidden mb-4 xs:mb-6 card p-3 xs:p-4 tablet:p-6 animate-slide-up">
        <div class="flex items-center justify-between mb-3 xs:mb-4">
          <h3 class="text-base xs:text-lg tablet:text-xl font-semibold text-gray-900 dark:text-white">장바구니</h3>
          <div class="flex items-center space-x-2">
            <button
              v-if="cartStore.items.length > 0"
              @click="cartStore.clearCart"
              class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="장바구니 비우기"
            >
              🗑️
            </button>
            <span class="badge badge-primary text-xs xs:text-sm">
              {{ cartStore.itemCount }}개 상품
            </span>
          </div>
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
        <!-- Category Filter Breadcrumb -->
        <div class="mb-4 md:mb-6">
          <h2 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-3">상품</h2>
          <div class="flex flex-wrap items-center gap-2">
            <!-- All Products Button -->
            <button
              @click="selectCategory('')"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200',
                selectedCategory === '' 
                  ? 'bg-blue-600 text-white dark:bg-blue-500' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              전체
            </button>
            
            <!-- Categories used in user's products -->
            <template v-if="categoryStore.categories.length > 0">
              <button
                v-for="category in categoryStore.categories"
                :key="category.id"
                @click="selectCategory(category.id)"
                :class="[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200',
                  selectedCategory === category.id 
                    ? 'bg-blue-600 text-white dark:bg-blue-500' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                {{ category.name }}
              </button>
            </template>
          </div>
        </div>
        
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
            @click="productStore.fetchAvailableProducts()"
            class="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            다시 시도
          </button>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-cols-1 xs:grid-cols-2 tablet:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 xs:gap-4 tablet:gap-6">
          <div
            v-for="product in productStore.availableProducts"
            :key="product.id"
            class="card card-hover overflow-hidden group flex flex-col"
          >
            <div class="relative overflow-hidden">
              <img
                :src="product.image || product.image_url"
                :alt="product.name"
                class="w-full h-32 xs:h-40 tablet:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                @error="handleImageError"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-3 xs:p-4 tablet:p-5 flex flex-col flex-1">
              <!-- Fixed height for product name (2 lines) -->
              <div class="h-10 xs:h-12 tablet:h-14 mb-2 xs:mb-3">
                <h3 class="font-bold text-gray-900 dark:text-white text-sm xs:text-base tablet:text-lg line-clamp-2 leading-tight">{{ product.name }}</h3>
              </div>
              
              <!-- Price display with KRW and Sats -->
              <div class="mb-3 xs:mb-4">
                <p class="text-lg xs:text-xl tablet:text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                  ₩{{ Number(product.price || 0).toLocaleString('ko-KR') }}
                </p>
                <div class="flex items-center space-x-2">
                  <p class="text-xs xs:text-sm text-warning-600 dark:text-warning-400 font-medium">
                    {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(Number(product.price || 0))) }}
                  </p>
                  <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                    <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400 inline-block"></div>
                  </span>
                  <span v-else-if="bitcoinStore.priceStatus === 'stale'" class="text-xs text-gray-400" title="Price data is stale">
                    ⚠️
                  </span>
                </div>
              </div>
              
              <!-- Action buttons -->
              <div class="mt-auto space-y-2">
                <div class="flex space-x-2">
                  <button
                    @click="openProductModal(product)"
                    class="btn btn-outline px-3 py-2 xs:py-2.5 tablet:py-3 text-xs xs:text-sm tablet:text-base"
                  >
                    자세히
                  </button>
                  <button
                    @click="handleAddToCart(product)"
                    :disabled="cartStore.isAddingToCart(product.id)"
                    class="btn btn-primary flex-1 py-2 xs:py-2.5 tablet:py-3 text-xs xs:text-sm tablet:text-base"
                  >
                    <span v-if="cartStore.isAddingToCart(product.id)" class="flex items-center space-x-2">
                      <div class="animate-spin rounded-full h-3 w-3 xs:h-4 xs:w-4 border-b-2 border-white"></div>
                      <span>추가 중...</span>
                    </span>
                    <span v-else>추가</span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Cart Sidebar -->
      <div class="hidden lg:block lg:order-2 w-72 xl:w-80 card p-4 xl:p-6 h-fit sticky top-24">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">장바구니</h3>
          <div class="flex items-center space-x-2">
            <button
              v-if="cartStore.items.length > 0"
              @click="cartStore.clearCart"
              class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="장바구니 비우기"
            >
              🗑️
            </button>
            <span class="badge badge-primary text-sm">
              {{ cartStore.itemCount }}개 상품
            </span>
          </div>
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

        <div v-if="cartStore.items.length > 0" class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="mb-4">
            <div class="flex justify-between text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-1">
              <span>총계:</span>
              <span>₩{{ cartStore.subtotal.toLocaleString('ko-KR') }}</span>
            </div>
            <div class="flex justify-between text-sm text-warning-600 dark:text-warning-400">
              <span>Bitcoin:</span>
              <span>{{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.subtotal)) }}</span>
            </div>
          </div>
          <button
            @click="$router.push('/payment')"
            class="btn btn-success w-full py-3 px-4 text-lg"
          >
            결제하기
          </button>
        </div>
      </div>
    </div>

    <!-- Product Details Modal -->
    <div
      v-if="showProductModal && selectedProduct"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="closeProductModal"
    >
      <div 
        class="card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in"
        @click.stop
      >
        <div class="relative">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-4 xs:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl xs:text-2xl font-bold text-gray-900 dark:text-white">상품 상세정보</h2>
            <button
              @click="closeProductModal"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <span class="text-xl text-gray-500 dark:text-gray-400">✕</span>
            </button>
          </div>

          <!-- Modal Content -->
          <div class="p-4 xs:p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Product Image -->
              <div class="relative">
                <img
                  :src="selectedProduct.image || selectedProduct.image_url"
                  :alt="selectedProduct.name"
                  class="w-full h-64 xs:h-80 object-cover rounded-xl"
                  @error="handleImageError"
                />
              </div>

              <!-- Product Details -->
              <div class="space-y-4">
                <div>
                  <h3 class="text-2xl xs:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {{ selectedProduct.name }}
                  </h3>
                  <p v-if="selectedProduct.description" class="text-gray-600 dark:text-gray-400 text-sm xs:text-base leading-relaxed">
                    {{ selectedProduct.description }}
                  </p>
                </div>

                <!-- Price Information -->
                <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600 dark:text-gray-400">가격:</span>
                      <span class="text-2xl xs:text-3xl font-bold text-primary-600 dark:text-primary-400">
                        ₩{{ Number(selectedProduct.price || 0).toLocaleString('ko-KR') }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600 dark:text-gray-400">Bitcoin 가격:</span>
                      <span class="text-lg font-semibold text-warning-600 dark:text-warning-400">
                        {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(Number(selectedProduct.price || 0))) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex space-x-3 pt-2">
                  <button
                    @click="handleAddToCart(selectedProduct); closeProductModal()"
                    :disabled="cartStore.isAddingToCart(selectedProduct.id)"
                    class="btn btn-primary flex-1 py-3 text-base xs:text-lg"
                  >
                    <span v-if="cartStore.isAddingToCart(selectedProduct.id)" class="flex items-center space-x-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>추가 중...</span>
                    </span>
                    <span v-else>장바구니 담기</span>
                  </button>
                  <button
                    @click="closeProductModal"
                    class="btn btn-secondary px-6 py-3 text-base xs:text-lg"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/products'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useCategoryStore } from '@/stores/categories'
import type { Product } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productStore = useProductStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const categoryStore = useCategoryStore()

// Mobile UI state
const showMobileCart = ref(false)
const showMobileMenu = ref(false)

// Product modal state
const showProductModal = ref(false)
const selectedProduct = ref<Product | null>(null)

// Category filtering
const selectedCategory = ref('')

// Admin mode toggle for showing/hiding settings
const showAdminControls = ref(false)

// Long press functionality
const longPressTimer = ref<number | null>(null)
const longPressDuration = 1000 // 1 second

// Initialize data when component mounts
onMounted(async () => {
  // Initialize cart if user is logged in
  if (authStore.isLoggedIn) {
    await cartStore.initialize()
  }
  
  // Initialize Bitcoin price data
  await bitcoinStore.initialize()
  
  // Initialize categories (only those used in user's products)
  await categoryStore.fetchUserProductCategories()
  
  // Initialize products store for shopping (load all available products)
  await productStore.initialize()
  
  // Start auto-refresh for Bitcoin price
  bitcoinStore.startAutoRefresh()
  
})

// Long press handlers for admin controls
function startLongPress(event: Event) {
  event.preventDefault()
  longPressTimer.value = window.setTimeout(() => {
    showAdminControls.value = !showAdminControls.value
  }, longPressDuration)
}

function endLongPress() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

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

// Handle product details modal
function openProductModal(product: Product) {
  selectedProduct.value = product
  showProductModal.value = true
  
  // Add escape key listener
  document.addEventListener('keydown', handleEscapeKey)
}

function closeProductModal() {
  showProductModal.value = false
  selectedProduct.value = null
  
  // Remove escape key listener
  document.removeEventListener('keydown', handleEscapeKey)
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeProductModal()
  }
}

// Handle category selection
async function selectCategory(categoryId: string | number) {
  try {
    selectedCategory.value = categoryId
    // Re-fetch available products with the selected category
    const filterCategoryId = categoryId || undefined
    await productStore.fetchAvailableProducts(filterCategoryId)
  } catch (error) {
    console.error('Error filtering products by category:', error)
  }
}
</script>