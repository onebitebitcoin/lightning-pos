<template>
  <div class="min-h-screen bg-bg-secondary transition-colors duration-300">
    <!-- Header -->
    <header class="glass-header transition-all duration-300 sticky top-0 z-20">
      <div class="container mx-auto px-2 py-3 md:py-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center md:hidden">
          <div class="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" class="h-10 w-10 object-contain" />
            <h1 class="text-lg font-bold text-text-primary select-none">
              {{ t('brand.name', '한입 POS') }}
            </h1>
          </div>
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="btn btn-secondary p-2 rounded-xl"
            :aria-expanded="showMobileMenu"
            :aria-label="t('header.toggleMenu', '모바일 메뉴 토글')"
          >
            <UiIcon
              :name="showMobileMenu ? 'close' : 'menu'"
              class="h-5 w-5"
            />
          </button>
        </div>

        <!-- Mobile Menu -->
        <div v-if="showMobileMenu" class="md:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 animate-slide-up">
          <div class="text-sm text-text-primary dark:text-white mb-3">
            {{ t('header.welcome', '환영합니다, {name}님!', { name: authStore.username }) }}
          </div>
          
          <!-- Mobile Bitcoin Price -->
          <div class="p-2 mb-2">
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  {{ t('header.btcPrice', 'BTC 가격') }}
                  <span v-if="lastUpdatedTime" class="text-gray-400 font-normal">({{ lastUpdatedTime }})</span>
                </div>
                <button
                  @click="bitcoinStore.refresh()"
                  :disabled="bitcoinStore.isLoading"
                  class="text-text-secondary hover:text-text-primary transition-colors p-1"
                  :title="t('header.refreshPrice', '가격 새로고침')"
                >
                  <UiIcon name="refreshCw" class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div class="flex items-center space-x-1 text-sm">
              <span v-if="bitcoinStore.isLoading" class="text-text-secondary">
                <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
              </span>
              <template v-else>
                <span v-if="btcPriceDisplay" class="text-text-primary font-medium">{{ btcPriceDisplay }}</span>
                <span v-else class="text-red-500 font-medium text-xs">{{ t('common.priceUnavailable', '가격 정보 없음') }}</span>

                <span
                  v-if="bitcoinStore.priceStatus === 'stale' && btcPriceDisplay"
                  class="text-text-secondary"
                  :title="t('common.priceStale', '가격 정보가 오래되었습니다')"
                >
                  <UiIcon name="warning" class="h-4 w-4" />
                </span>
              </template>
            </div>
          </div>
          
          <div class="flex flex-col space-y-2">
            <button
              @click="themeStore.toggleTheme"
              class="btn btn-outline flex items-center justify-between w-full p-3 text-sm"
            >
              <span>{{ themeStore.isDark ? t('header.theme.light', '라이트 모드') : t('header.theme.dark', '다크 모드') }}</span>
              <UiIcon
                :name="themeStore.isDark ? 'sun' : 'moon'"
                class="h-5 w-5"
              />
            </button>
            <RouterLink
              to="/guide"
              class="btn btn-secondary w-full p-3 text-sm flex items-center justify-between"
              @click="showMobileMenu = false"
            >
              <span>{{ t('header.openGuide', '사용 가이드') }}</span>
              <UiIcon name="chevronRight" class="h-4 w-4" />
            </RouterLink>
            <button
              v-if="authStore.isAdmin"
              @click="$router.push('/admin'); showMobileMenu = false"
              class="btn w-full p-3 text-sm text-left bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white"
            >
              {{ t('header.adminPanel', '관리자 패널') }}
            </button>
            <button
              v-if="authStore.isLoggedIn"
              @click="$router.push('/settings'); showMobileMenu = false"
              class="btn btn-secondary w-full p-3 text-sm text-left"
            >
              {{ t('header.openSettings', '설정') }}
            </button>
            <button
              v-if="authStore.isLoggedIn"
              @click="handleLogout"
              class="btn w-full p-3 text-sm flex items-center justify-between bg-error-600 hover:bg-error-700 focus:ring-error-500 text-white"
            >
              <span>{{ t('header.logoutButton', '로그아웃') }}</span>
              <UiIcon name="logout" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center">
          <div class="flex items-center space-x-6">
            <div class="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" class="h-12 w-12 object-contain" />
              <h1 class="text-2xl font-bold text-text-primary select-none cursor-default">
                {{ t('brand.name', '한입 POS') }}
              </h1>
            </div>
            <!-- Bitcoin Price Indicator -->
            <div class="flex items-center space-x-3">
              <div>
                <div class="text-sm text-text-secondary flex items-center gap-1 mb-1">
                  {{ t('header.btcPrice', 'BTC 가격') }}
                  <span v-if="lastUpdatedTime" class="text-xs text-gray-400">({{ lastUpdatedTime }})</span>
                  <button
                    @click="bitcoinStore.refresh()"
                    :disabled="bitcoinStore.isLoading"
                    class="text-text-secondary hover:text-text-primary transition-colors p-0.5 ml-1"
                    :title="t('header.refreshPrice', '가격 새로고침')"
                  >
                    <UiIcon name="refreshCw" class="h-3.5 w-3.5" />
                  </button>
                </div>
                <div class="flex items-center space-x-1 text-sm font-medium">
                  <span v-if="bitcoinStore.isLoading" class="text-text-secondary">
                    <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400 inline-block"></div>
                  </span>
                  <template v-else>
                    <span v-if="btcPriceDisplay" class="text-text-primary">{{ btcPriceDisplay }}</span>
                    <span v-else class="text-red-500 text-xs">{{ t('common.priceUnavailable', '가격 정보 없음') }}</span>

                    <span
                      v-if="bitcoinStore.priceStatus === 'stale' && btcPriceDisplay"
                      class="text-text-secondary"
                      :title="t('common.priceStale', '가격 정보가 오래되었습니다')"
                    >
                      <UiIcon name="warning" class="h-4 w-4" />
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-text-primary dark:text-white">
              {{ t('header.welcome', '환영합니다, {name}님!', { name: authStore.username }) }}
            </span>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 hover:bg-bg-tertiary rounded-xl transition-colors"
              :title="themeStore.isDark ? t('header.theme.light', '라이트 모드') : t('header.theme.dark', '다크 모드')"
            >
              <UiIcon
                :name="themeStore.isDark ? 'sun' : 'moon'"
                class="h-5 w-5"
              />
            </button>
            <RouterLink
              to="/guide"
              class="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              :title="t('header.openGuide', '사용 가이드')"
            >
              <UiIcon name="bookOpen" class="h-5 w-5" />
            </RouterLink>
            <button
              v-if="authStore.isAdmin"
              @click="$router.push('/admin')"
              class="btn px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white"
            >
              {{ t('header.adminPanel', '관리자 패널') }}
            </button>
            <button
              v-if="authStore.isLoggedIn"
              @click="$router.push('/settings')"
              class="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              :title="t('header.openSettings', '설정')"
            >
              <UiIcon name="settings" class="h-5 w-5" />
            </button>
            <button
              v-if="authStore.isLoggedIn"
              @click="handleLogout"
              class="p-2 rounded-xl text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
              :title="t('header.logout', '로그아웃')"
            >
              <UiIcon name="logout" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-2 pt-3 xs:pt-4 tablet:pt-6 lg:pt-8 pb-32 lg:pb-10 flex flex-col xl:flex-row gap-3 xs:gap-4 tablet:gap-6 lg:gap-8 safe-area-bottom">

      <!-- Products Grid -->
      <div class="flex-1 xl:order-1">
        <!-- Category Filter Breadcrumb -->
        <div class="mb-4 md:mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
              {{ t('shop.products.title', '상품') }}
            </h2>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <!-- All Products Button -->
            <button
              @click="selectCategory('')"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200',
                selectedCategory === '' 
                  ? 'bg-indigo-800 text-white dark:bg-indigo-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              {{ t('shop.products.filterAll', '전체') }}
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
                    ? 'bg-indigo-800 text-white dark:bg-indigo-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                {{ category.name }}
              </button>
            </template>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="productStore.isLoading || bitcoinStore.isLoading || !bitcoinStore.btcPriceKrw" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700 dark:border-indigo-400 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-300">
              {{ t('shop.products.loading', '상품을 불러오는 중...') }}
            </p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="productStore.error" class="text-center py-12">
          <div class="text-red-500 dark:text-red-400 mb-4">⚠️</div>
          <p class="text-red-600 dark:text-red-400 mb-4">{{ productStore.error }}</p>
          <button
            @click="productStore.fetchAvailableProducts()"
            class="btn btn-primary px-4 py-2 rounded-lg"
          >
            {{ t('shop.products.retry', '다시 시도') }}
          </button>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-cols-1 xs:grid-cols-2 tablet:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 xs:gap-4 tablet:gap-6">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="card card-hover overflow-hidden group flex flex-col"
          >
            <div class="relative overflow-hidden">
              <img
                :src="product.image || product.image_url"
                :alt="product.name"
                class="w-full h-40 xs:h-52 tablet:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                @error="handleImageError"
              />
              <div
                v-if="productHasDiscount(product)"
                class="absolute top-2 left-2 z-10"
              >
                <span class="rounded-full bg-success-600 text-white text-xs font-semibold px-2 py-0.5 shadow-soft">
                  {{ t('shop.product.discountBadge', '{percent}% 할인', { percent: productDiscountPercent(product) }) }}
                </span>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-3 xs:p-4 tablet:p-5 flex flex-col flex-1">
              <!-- Fixed height for product name (2 lines) -->
              <div class="h-10 xs:h-12 tablet:h-14 mb-2 xs:mb-3">
                <h3 class="font-bold text-gray-900 dark:text-white text-sm xs:text-base tablet:text-lg line-clamp-2 leading-tight">{{ product.name }}</h3>
              </div>
              
              <!-- Price display with KRW and Sats -->
              <div class="mb-3 xs:mb-4 space-y-1">
                <!-- Bitcoin Price (Large) -->
                <div class="flex items-center space-x-2">
                  <p class="text-lg xs:text-xl font-semibold text-primary-600 dark:text-primary-400">
                    {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(Number(product.price || 0))) }}
                  </p>
                  <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                    <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400 inline-block"></div>
                  </span>
                  <span
                    v-else-if="bitcoinStore.priceStatus === 'stale'"
                    class="text-xs text-gray-400"
                    :title="t('common.priceStale', '가격 정보가 오래되었습니다')"
                  >
                    ⚠️
                  </span>
                </div>

                <!-- KRW Price (Small) -->
                <div class="flex items-baseline gap-2">
                  <p class="text-sm xs:text-base text-text-secondary">
                    {{ formatPrice(Number(product.price || 0)) }}
                    <span
                      v-if="productHasDiscount(product)"
                      class="ml-2 text-xs xs:text-sm font-semibold text-success-600 dark:text-success-400"
                    >
                      {{ t('shop.product.discountInline', '-{percent}%', { percent: productDiscountPercent(product) }) }}
                    </span>
                  </p>
                </div>
                <div
                  v-if="productHasDiscount(product)"
                  class="text-xs text-gray-500 dark:text-gray-400 line-through"
                >
                  {{ formatPrice(Number(product.regular_price || 0)) }}
                </div>
              </div>
              
              <!-- Action buttons -->
              <div class="mt-auto space-y-2">
                <div class="flex space-x-2">
                  <button
                    @click="openProductModal(product)"
                    class="btn btn-outline px-3 py-2 xs:py-2.5 tablet:py-3 text-xs xs:text-sm tablet:text-base"
                  >
                    {{ t('shop.products.details', '자세히') }}
                  </button>
                  <button
                    @click="handleAddToCart(product)"
                    :disabled="cartStore.isAddingToCart(product.id) || !!bitcoinStore.error"
                    class="btn btn-primary flex-1 py-2 xs:py-2.5 tablet:py-3 text-xs xs:text-sm tablet:text-base"
                  >
                    <span v-if="cartStore.isAddingToCart(product.id)" class="flex items-center space-x-2">
                      <div class="animate-spin rounded-full h-3 w-3 xs:h-4 xs:w-4 border-b-2 border-white"></div>
                      <span>{{ t('shop.products.adding', '추가 중...') }}</span>
                    </span>
                    <span v-else>{{ t('shop.products.add', '추가') }}</span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Cart Sidebar -->
        <div class="hidden xl:block xl:order-2 w-72 xl:w-80 card p-4 xl:p-6 h-fit sticky top-24">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ t('shop.cart.title', '장바구니') }}
            </h3>
          <div class="flex items-center space-x-2">
            <button
              v-if="cartStore.items.length > 0"
              @click="cartStore.clearCart"
              class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              :title="t('shop.cart.clear', '장바구니 비우기')"
            >
              <UiIcon name="trash" class="h-5 w-5" />
            </button>
            <span class="badge badge-primary text-sm">
              {{ t('shop.cart.itemsCount', '{count}개 상품', { count: cartStore.itemCount }) }}
            </span>
          </div>
        </div>

        <div class="mb-4">
          <button
            @click="openDirectInputModal"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-lg bg-primary-50/70 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
          >
            <UiIcon name="plus" class="h-4 w-4" />
            <span>{{ t('shop.cart.directInput', '직접 입력하기') }}</span>
          </button>
        </div>

        <!-- Cart Loading -->
        <div v-if="cartStore.isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700 dark:border-indigo-400 mx-auto mb-2"></div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('shop.cart.loading', '장바구니 로딩 중...') }}</p>
        </div>

        <!-- Empty Cart -->
        <div v-else-if="cartStore.items.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 text-4xl mb-2">
            <UiIcon name="cart" class="h-10 w-10 mx-auto" />
          </div>
          <p class="text-gray-500 dark:text-gray-400">{{ t('shop.cart.empty', '장바구니가 비어있습니다') }}</p>
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
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ t('shop.cart.priceEach', '개당 {price}', { price: formatPrice(Number(item.product_price || 0)) }) }}
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="handleUpdateQuantity(item.id, item.quantity - 1)"
                :disabled="cartStore.isUpdatingItem(item.id)"
                class="w-8 h-8 rounded-full bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:opacity-50"
              >
                -
              </button>
              <span class="w-8 text-center font-medium text-gray-800 dark:text-white">{{ item.quantity }}</span>
              <button
                @click="handleUpdateQuantity(item.id, item.quantity + 1)"
                :disabled="cartStore.isUpdatingItem(item.id)"
                class="w-8 h-8 rounded-full bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div v-if="cartStore.items.length > 0" class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="mb-4">
            <div class="flex justify-between text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-1">
              <span>{{ t('shop.cart.bitcoinLabel', 'Bitcoin') }}:</span>
              <span>{{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.subtotal)) }}</span>
            </div>
            <div class="flex justify-between text-sm text-text-secondary">
              <span>{{ t('shop.cart.total', '총계') }}:</span>
              <span>{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
          </div>
          <button
            @click="$router.push('/payment')"
            class="btn btn-primary w-full py-3 px-4 text-lg"
          >
            {{ t('shop.cart.checkout', '결제하기') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Product Details Modal -->
    <div
      v-if="showProductModal && selectedProduct"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-8"
      @click="closeProductModal"
    >
      <div 
        class="card w-full max-w-4xl md:max-w-5xl max-h-[90vh] overflow-y-auto animate-fade-in"
        @click.stop
      >
        <div class="relative">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-4 xs:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl xs:text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('shop.product.detailsTitle', '상품 상세정보') }}
            </h2>
            <button
              @click="closeProductModal"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <span class="text-xl text-gray-500 dark:text-gray-400">✕</span>
            </button>
          </div>

          <!-- Modal Content -->
          <div class="p-4 xs:p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Product Image -->
              <div class="relative">
                <img
                  :src="selectedProduct.image || selectedProduct.image_url"
                  :alt="selectedProduct.name"
                  class="w-full h-64 xs:h-80 md:h-[28rem] object-cover rounded-2xl"
                  @error="handleImageError"
                />
              </div>

              <!-- Product Details -->
              <div class="space-y-4">
                <div>
                  <h3 class="text-2xl xs:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {{ selectedProduct.name }}
                  </h3>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {{ t('shop.product.descriptionLabel', '상품 설명') }}
                    </p>
                    <p class="mt-2 text-gray-600 dark:text-gray-300 text-sm xs:text-base leading-relaxed whitespace-pre-line">
                      {{ (selectedProduct.description || '').trim() || t('shop.product.descriptionFallback', '등록된 설명이 없습니다.') }}
                    </p>
                  </div>
                </div>

                <!-- Price Information -->
                <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <div class="space-y-2">
                    <div class="flex justify-between items-center gap-3">
                      <span class="text-gray-600 dark:text-gray-400">
                        {{ t('shop.product.priceLabel', '가격') }}:
                      </span>
                      <div class="flex items-baseline justify-end">
                        <span class="text-2xl xs:text-3xl font-bold text-primary-600 dark:text-primary-400">
                          {{ formatPrice(Number(selectedProduct.price || 0)) }}
                        </span>
                        <span
                          v-if="productHasDiscount(selectedProduct as Product)"
                          class="ml-2 text-sm font-semibold text-success-600 dark:text-success-400"
                        >
                          {{ t('shop.product.discountInline', '-{percent}%', { percent: productDiscountPercent(selectedProduct as Product) }) }}
                        </span>
                      </div>
                    </div>
                    <div
                      v-if="productHasDiscount(selectedProduct as Product)"
                      class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 line-through"
                    >
                      <span>{{ t('shop.product.regularLabel', '정가') }}:</span>
                      <span>{{ formatPrice(Number((selectedProduct as Product).regular_price || 0)) }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600 dark:text-gray-400">
                        {{ t('shop.product.bitcoinPriceLabel', 'Bitcoin 가격') }}:
                      </span>
                      <span class="text-lg font-semibold text-primary-600 dark:text-primary-400">
                        {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(Number(selectedProduct.price || 0))) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex space-x-3 pt-2">
                  <button
                    @click="handleAddToCart(selectedProduct); closeProductModal()"
                    :disabled="cartStore.isAddingToCart(selectedProduct.id) || !!bitcoinStore.error"
                    class="btn btn-primary flex-1 py-3 text-base xs:text-lg"
                  >
                    <span v-if="cartStore.isAddingToCart(selectedProduct.id)" class="flex items-center space-x-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{{ t('shop.products.adding', '추가 중...') }}</span>
                    </span>
                    <span v-else>{{ t('shop.product.addToCart', '장바구니 담기') }}</span>
                  </button>
                  <button
                    @click="closeProductModal"
                    class="btn btn-secondary px-6 py-3 text-base xs:text-lg"
                  >
                    {{ t('shop.product.close', '닫기') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Direct Input Modal -->
    <div
      v-if="showDirectInputModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 xs:p-4"
      @click="closeDirectInputModal"
    >
      <div
        class="card max-w-md w-full animate-fade-in max-h-[95vh] overflow-y-auto"
        @click.stop
      >
        <div class="relative">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-3 xs:p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg xs:text-xl font-bold text-gray-900 dark:text-white">
              {{ t('shop.directInput.title', '직접 입력하기') }}
            </h2>
            <button
              @click="closeDirectInputModal"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <span class="text-xl text-gray-500 dark:text-gray-400">✕</span>
            </button>
          </div>

          <!-- Modal Content -->
          <div class="p-3 xs:p-4">
            <form @submit.prevent="handleDirectInput" class="space-y-3">
            <div>
              <label for="directAmount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {{ t('shop.directInput.amount', '금액 ({currency})', { currency: currencySymbols[selectedCurrency] }) }}
              </label>
              <input
                id="directAmount"
                v-model="directInputAmount"
                type="text"
                readonly
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors text-xl text-center font-semibold cursor-default"
                :placeholder="t('shop.directInput.placeholderAmount', '0')"
              />

              <!-- Number Pad -->
              <div class="grid grid-cols-3 gap-1.5 xs:gap-2 mt-3">
                <button
                  v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                  :key="num"
                  type="button"
                  @click="appendNumber(num)"
                  class="h-14 xs:h-16 flex items-center justify-center text-xl xs:text-2xl font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors active:scale-95"
                >
                  {{ num }}
                </button>
                <button
                  type="button"
                  @click="clearAmount"
                  class="h-14 xs:h-16 flex items-center justify-center text-lg xs:text-xl font-semibold bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors active:scale-95"
                >
                  C
                </button>
                <button
                  type="button"
                  @click="appendNumber(0)"
                  class="h-14 xs:h-16 flex items-center justify-center text-xl xs:text-2xl font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  @click="backspace"
                  class="h-14 xs:h-16 flex items-center justify-center text-lg xs:text-xl font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors active:scale-95"
                >
                  ⌫
                </button>
              </div>
            </div>

            <div>
              <label for="directDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {{ t('shop.directInput.description', '설명 (선택사항)') }}
              </label>
              <input
                id="directDescription"
                v-model="directInputDescription"
                type="text"
                maxlength="100"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                :placeholder="t('shop.directInput.placeholderDescription', '예: 추가 결제, 팁 등')"
              />
            </div>

              <!-- Bitcoin Price Display -->
              <div v-if="directInputAmount && parseInt(directInputAmount) > 0" class="bg-gray-50 dark:bg-gray-700/50 p-2.5 rounded-lg">
                <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {{ t('shop.directInput.bitcoinLabel', 'Bitcoin 금액') }}:
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-base font-semibold text-primary-600 dark:text-primary-400">
                    {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(parseInt(directInputAmount))) }}
                  </span>
                  <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                    <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400 inline-block"></div>
                  </span>
                  <span
                    v-else-if="bitcoinStore.priceStatus === 'stale'"
                    class="text-xs text-gray-400"
                    :title="t('common.priceStale', '가격 정보가 오래되었습니다')"
                  >
                    ⚠️
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex space-x-2 xs:space-x-3 pt-1">
                <button
                  type="button"
                  @click="closeDirectInputModal"
                  class="flex-1 px-3 xs:px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm xs:text-base"
                >
                  {{ t('shop.directInput.cancel', '취소') }}
                </button>
                <button
                  type="submit"
                  :disabled="!directInputAmount || parseInt(directInputAmount) <= 0 || isAddingDirectInput || !!bitcoinStore.error"
                  class="btn btn-primary flex-1 px-3 xs:px-4 py-2.5 rounded-lg text-sm xs:text-base"
                >
                  <span v-if="isAddingDirectInput" class="flex items-center space-x-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{{ t('shop.directInput.adding', '추가 중...') }}</span>
                  </span>
                  <span v-else>{{ t('shop.directInput.add', '장바구니 추가') }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Modal (Mobile/Tablet) -->
    <div
      v-if="showCartModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      @click="closeCartModal"
    >
      <div 
        class="card w-full sm:max-w-md animate-slide-in-right max-h-full flex flex-col rounded-none"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ t('shop.cart.title', '장바구니') }}
            </h2>
            <span class="badge badge-primary text-sm">
              {{ t('shop.cart.itemsCount', '{count}개', { count: cartStore.itemCount }) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="cartStore.items.length > 0"
              @click="cartStore.clearCart"
              class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              :title="t('shop.cart.clear', '장바구니 비우기')"
            >
              <UiIcon name="trash" class="h-5 w-5" />
            </button>
            <button
              @click="closeCartModal"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <span class="text-xl text-gray-500 dark:text-gray-400">✕</span>
            </button>
          </div>
        </div>

        <!-- Modal Content (Scrollable) -->
        <div class="p-4 overflow-y-auto flex-1">
          <div class="mb-4">
            <button
              @click="closeCartModal(); openDirectInputModal()"
              class="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-lg bg-primary-50/70 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
            >
              <UiIcon name="plus" class="h-4 w-4" />
              <span>{{ t('shop.cart.directInput', '직접 입력하기') }}</span>
            </button>
          </div>

          <!-- Cart Loading -->
          <div v-if="cartStore.isLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700 dark:border-indigo-400 mx-auto mb-2"></div>
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('shop.cart.loading', '장바구니 로딩 중...') }}</p>
          </div>

          <!-- Empty Cart -->
          <div v-else-if="cartStore.items.length === 0" class="text-center py-8">
            <div class="text-gray-400 dark:text-gray-500 text-4xl mb-2">
              <UiIcon name="cart" class="h-10 w-10 mx-auto" />
            </div>
            <p class="text-gray-500 dark:text-gray-400">{{ t('shop.cart.empty', '장바구니가 비어있습니다') }}</p>
          </div>

          <!-- Cart Items -->
          <div v-else class="space-y-3">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0 mr-3">
                <img
                  :src="item.product_image"
                  :alt="item.product_name"
                  class="w-12 h-12 object-cover rounded-md flex-shrink-0"
                  @error="handleImageError"
                />
                <div>
                  <p class="font-medium text-gray-800 dark:text-white truncate">{{ item.product_name }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    {{ t('shop.cart.priceEach', '개당 {price}', { price: formatPrice(Number(item.product_price || 0)) }) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2 shrink-0">
                <button
                  @click="handleUpdateQuantity(item.id, item.quantity - 1)"
                  :disabled="cartStore.isUpdatingItem(item.id)"
                  class="w-8 h-8 rounded-full bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:opacity-50"
                >
                  -
                </button>
                <span class="w-8 text-center font-medium text-gray-800 dark:text-white">{{ item.quantity }}</span>
                <button
                  @click="handleUpdateQuantity(item.id, item.quantity + 1)"
                  :disabled="cartStore.isUpdatingItem(item.id)"
                  class="w-8 h-8 rounded-full bg-bg-secondary text-text-primary hover:bg-bg-tertiary transition-colors flex items-center justify-center disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer (Total & Checkout) -->
        <div v-if="cartStore.items.length > 0" class="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 rounded-b-2xl">
          <div class="mb-4">
            <div class="flex justify-between text-lg font-semibold text-gray-900 dark:text-white mb-1">
              <span>{{ t('shop.cart.bitcoinLabel', 'Bitcoin') }}:</span>
              <span>{{ bitcoinStore.formatSats(bitcoinStore.krwToSats(cartStore.subtotal)) }}</span>
            </div>
            <div class="flex justify-between text-sm text-text-secondary">
              <span>{{ t('shop.cart.total', '총계') }}:</span>
              <span>{{ formatPrice(cartStore.subtotal) }}</span>
            </div>
          </div>
          <button
            @click="$router.push('/payment')"
            class="btn btn-primary w-full py-3 px-4 text-lg font-semibold shadow-lg shadow-primary-500/20"
          >
            {{ t('shop.cart.checkout', '결제하기') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Cart Button (FAB) -->
    <button
      @click="openCartModal"
      class="xl:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-indigo-800 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-800/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      :class="{ 'animate-bump': isCartAnimating }"
      :aria-label="t('shop.cart.open', '장바구니 열기')"
    >
      <div class="relative">
        <UiIcon name="cart" class="h-7 w-7" />
        <span
          v-if="cartStore.itemCount > 0"
          class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center border-2 border-white dark:border-gray-800"
        >
          {{ cartStore.itemCount }}
        </span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/products'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useCategoryStore } from '@/stores/categories'
import type { Product } from '@/services/api'
import { useLocaleStore } from '@/stores/locale'
import { useFiatCurrencyStore } from '@/stores/fiatCurrency'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const productStore = useProductStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const categoryStore = useCategoryStore()
const localeStore = useLocaleStore()
const fiatCurrencyStore = useFiatCurrencyStore()
const { selectedCurrency, formatter } = storeToRefs(fiatCurrencyStore)
const currencySymbols = fiatCurrencyStore.currencySymbols
const t = localeStore.t
let stopBitcoinAutoRefresh: (() => void) | null = null

// Mobile UI state
const showMobileMenu = ref(false)

// Cart modal state
const showCartModal = ref(false)
const isCartAnimating = ref(false)

// Product modal state
const showProductModal = ref(false)
const selectedProduct = ref<Product | null>(null)

// Direct input modal state
const showDirectInputModal = ref(false)
const directInputAmount = ref<string>('')
const directInputDescription = ref('')
const isAddingDirectInput = ref(false)

// Category filtering
const selectedCategory = ref<string | number>('')

// Filter products by selected category (client-side filtering)
const filteredProducts = computed(() => {
  if (!selectedCategory.value || selectedCategory.value === '') {
    return productStore.availableProducts
  }
  return productStore.availableProducts.filter(
    product => product.category === selectedCategory.value
  )
})

const btcPriceDisplay = computed(() => {
  const price = bitcoinStore.getBtcPriceByCurrency(selectedCurrency.value)
  if (!price) return null
  return formatter.value.format(price)
})

const lastUpdatedTime = computed(() => {
  if (!bitcoinStore.lastUpdated) return null
  return bitcoinStore.lastUpdated.toLocaleTimeString(localeStore.language, {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formatPrice = (value: number | string): string => {
  const numeric = Number(value || 0)
  if (Number.isNaN(numeric)) {
    return fiatCurrencyStore.formatKrw(0)
  }
  return fiatCurrencyStore.formatKrw(numeric)
}

const productHasDiscount = (product: Product): boolean => {
  const regular = Number(product.regular_price)
  const sale = Number(product.price)
  return !!regular && regular > sale
}

const productDiscountPercent = (product: Product): number => {
  if (!productHasDiscount(product)) return 0
  const regular = Number(product.regular_price)
  const sale = Number(product.price)
  return Math.round(((regular - sale) / regular) * 100)
}

// Initialize data when component mounts
onMounted(async () => {
  // Initialize Bitcoin price data FIRST (required for price display)
  await bitcoinStore.initialize()

  // Start auto-refresh for Bitcoin price (every 1 minute)
  stopBitcoinAutoRefresh = bitcoinStore.startAutoRefresh()

  // Initialize other data in parallel after bitcoin price is ready
  await Promise.all([
    // Initialize cart if user is logged in
    authStore.isLoggedIn ? cartStore.initialize() : Promise.resolve(),
    // Initialize categories (only those used in user's products)
    categoryStore.fetchUserProductCategories(),
    // Initialize products store for shopping (load all available products)
    productStore.initialize()
  ])
})

onUnmounted(() => {
  if (stopBitcoinAutoRefresh) {
    stopBitcoinAutoRefresh()
    stopBitcoinAutoRefresh = null
  }

  document.removeEventListener('keydown', handleEscapeKey)
  document.removeEventListener('keydown', handleDirectInputEscape)
  document.removeEventListener('keydown', handleCartModalEscape)
})

onBeforeRouteLeave((to) => {
  if (to?.name === 'payment') {
    return true
  }
  if (!cartStore.itemCount) {
    return true
  }

  cartStore
    .clearCart()
    .then(result => {
      if (!result?.success) {
        cartStore.resetLocal()
      }
    })
    .catch(() => {
      cartStore.resetLocal()
    })
})

// Cart Modal functions
function openCartModal() {
  showCartModal.value = true
  document.addEventListener('keydown', handleCartModalEscape)
}

function closeCartModal() {
  showCartModal.value = false
  document.removeEventListener('keydown', handleCartModalEscape)
}

function handleCartModalEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeCartModal()
  }
}

function triggerCartAnimation() {
  isCartAnimating.value = true
  setTimeout(() => {
    isCartAnimating.value = false
  }, 300)
}

// Handle adding product to cart
async function handleAddToCart(product: Product) {
  if (!authStore.isLoggedIn) {
    alert(t('shop.errors.loginRequired', '로그인이 필요합니다'))
    return
  }

  try {
    const result = await cartStore.addItem(product)
    if (!result.success) {
      alert(result.message || t('shop.errors.addFailed', '장바구니 추가에 실패했습니다'))
    } else {
      triggerCartAnimation()
    }
  } catch (error) {
    console.error('장바구니 추가 오류:', error)
    alert(t('shop.errors.generic', '알 수 없는 오류가 발생했습니다'))
  }
}

// Handle updating cart item quantity
async function handleUpdateQuantity(itemId: number, newQuantity: number) {
  if (newQuantity <= 0) {
    // Remove item if quantity is 0 or less
    const result = await cartStore.removeItem(itemId)
    if (!result.success) {
      alert(result.message || t('shop.errors.removeFailed', '아이템 제거에 실패했습니다'))
    }
  } else {
    // Update quantity
    const result = await cartStore.updateItem(itemId, newQuantity)
    if (!result.success) {
      alert(result.message || t('shop.errors.quantityUpdateFailed', '수량 변경에 실패했습니다'))
    }
  }
}

// Handle image loading error
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  
  // Log the failed URL for debugging
  console.warn('이미지 로드 실패:', img.src)
  
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
    console.error('로그아웃 오류:', error)
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

// Handle category selection (client-side filtering, no API call)
function selectCategory(categoryId: string | number) {
  selectedCategory.value = categoryId
}

// Handle direct input modal
function openDirectInputModal() {
  showDirectInputModal.value = true
  directInputAmount.value = ''
  directInputDescription.value = ''

  // Add escape key listener
  document.addEventListener('keydown', handleDirectInputEscape)
}

function closeDirectInputModal() {
  showDirectInputModal.value = false
  directInputAmount.value = ''
  directInputDescription.value = ''
  isAddingDirectInput.value = false

  // Remove escape key listener
  document.removeEventListener('keydown', handleDirectInputEscape)
}

function handleDirectInputEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDirectInputModal()
  }
}

// Number pad functions
function appendNumber(num: number) {
  const currentValue = directInputAmount.value
  // Limit to 6 digits (max 999999)
  if (currentValue.length < 6) {
    directInputAmount.value = currentValue + num.toString()
  }
}

function clearAmount() {
  directInputAmount.value = ''
}

function backspace() {
  const currentValue = directInputAmount.value
  if (currentValue.length > 0) {
    directInputAmount.value = currentValue.slice(0, -1)
  }
}

// Handle direct input submission
async function handleDirectInput() {
  const amount = parseInt(directInputAmount.value, 10)
  if (!directInputAmount.value || isNaN(amount) || amount <= 0) {
    alert(t('shop.errors.invalidAmount', '올바른 금액을 입력해주세요'))
    return
  }

  isAddingDirectInput.value = true

  try {
    // Create a custom item name
    const itemName =
      directInputDescription.value.trim() ||
      t('shop.directInput.fallbackName', '직접 입력 항목')

    // Create a custom item object for the cart
    // If not in KRW mode, convert the input amount to KRW
    const priceInKrw = fiatCurrencyStore.convertSelectedToKrw(amount)
    
    const customItem = {
      name: itemName,
      price: Math.round(priceInKrw),
      description: directInputDescription.value.trim()
    }

    const result = await cartStore.addCustomItem(customItem)
    if (result.success) {
      closeDirectInputModal()
      triggerCartAnimation()
    } else {
      alert(result.message || t('shop.errors.customAddFailed', '장바구니 추가에 실패했습니다'))
    }
  } catch (error) {
    console.error('직접 입력 장바구니 추가 오류:', error)
    alert(t('shop.errors.generic', '알 수 없는 오류가 발생했습니다'))
  } finally {
    isAddingDirectInput.value = false
  }
}

</script>

<style scoped>
@keyframes bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.animate-bump {
  animation: bump 0.3s ease-in-out;
}
</style>
