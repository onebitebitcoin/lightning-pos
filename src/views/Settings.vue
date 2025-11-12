<template>
  <div class="min-h-screen bg-bg-secondary transition-colors duration-200">
    <!-- Header -->
    <header class="glass-header transition-colors duration-200">
      <div class="container mx-auto px-4 py-3 md:py-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center md:hidden">
          <div class="flex items-center space-x-2">
            <button
              @click="$router.push('/shop')"
              class="text-text-secondary hover:text-text-primary p-1 transition-colors duration-200"
            >
              <UiIcon name="arrowLeft" class="h-5 w-5" />
            </button>
            <h1 class="text-lg font-bold text-text-primary">
              {{ t('settings.pageTitle', '상품 관리') }}
            </h1>
          </div>
          <div class="flex items-center space-x-2">
            <!-- Mobile Bitcoin Price -->
            <div class="text-right text-xs">
              <div class="flex items-center space-x-1">
                <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                  <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                </span>
                <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                  <UiIcon name="warning" class="h-4 w-4" />
                </span>
                <template v-else>
                  <UiIcon name="btc" class="h-4 w-4 text-orange-500" />
                  <span class="text-gray-900 dark:text-white">{{ formattedBtcPrice }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" title="가격 정보가 오래되었습니다">
                    <UiIcon name="warning" class="h-4 w-4" />
                  </span>
                </template>
              </div>
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" class="h-5 w-5" />
            </button>
            <span class="text-sm text-text-secondary hidden sm:inline">{{ authStore.username }}님</span>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/shop')"
              class="text-text-secondary hover:text-text-primary flex items-center space-x-1 transition-colors duration-200"
            >
              <UiIcon name="arrowLeft" class="h-4 w-4" />
              <span>{{ t('settings.backToShop', '상점으로 돌아가기') }}</span>
            </button>
            <h1 class="text-2xl font-bold text-text-primary">
              {{ t('settings.pageTitle', '상품 관리') }}
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Bitcoin Price -->
            <div class="text-right">
              <div class="text-sm text-text-secondary">
                {{ t('header.btcPrice', 'BTC 가격') }}
              </div>
              <div class="flex items-center space-x-1 text-sm font-medium">
                <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                  <div class="animate-spin rounded-full h-3 w-3 border-b border-gray-400 inline-block"></div>
                </span>
                <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                  <UiIcon name="warning" class="h-4 w-4" />
                </span>
                <template v-else>
                  <UiIcon name="btc" class="h-4 w-4 text-orange-500" />
                  <span class="text-gray-900 dark:text-white">{{ formattedBtcPrice }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" title="가격 정보가 오래되었습니다">
                    <UiIcon name="warning" class="h-4 w-4" />
                  </span>
                </template>
              </div>
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              :title="themeStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
            >
              <UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" class="h-5 w-5" />
            </button>
            <span class="text-gray-600 dark:text-gray-300">{{ authStore.username }}님</span>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
      <!-- User Profile Settings -->
      <div class="card p-4 md:p-6 mb-6 transition-colors duration-200">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
            {{ t('settings.userSection.title', '사용자 설정') }}
          </h2>
          <button
            v-if="!showUserSettings"
            @click="showUserSettings = true"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
          >
            편집
          </button>
        </div>

        <!-- User Info Display -->
        <div v-if="!showUserSettings" class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">사용자명:</span>
            <span class="text-gray-900 dark:text-white">{{ authStore.username }}</span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">이메일:</span>
            <span class="text-gray-900 dark:text-white">{{ authStore.user?.email || '설정되지 않음' }}</span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">라이트닝 주소:</span>
            <span class="text-gray-900 dark:text-white font-mono text-sm">
              {{ authStore.user?.lightning_address || '설정되지 않음' }}
            </span>
          </div>
        </div>

        <!-- User Info Edit Form -->
        <div v-else>
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                사용자명
              </label>
              <input
                v-model="userForm.username"
                type="text"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  userFormErrors.username ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="사용자명을 입력하세요"
              />
              <p v-if="userFormErrors.username" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ userFormErrors.username }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이메일
              </label>
              <input
                v-model="userForm.email"
                type="email"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  userFormErrors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="이메일을 입력하세요"
              />
              <p v-if="userFormErrors.email" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ userFormErrors.email }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                라이트닝 지갑 주소
              </label>
              <input
                v-model="userForm.lightning_address"
                type="text"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 font-mono text-sm',
                  userFormErrors.lightning_address ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="예: test@walletofsatoshi.com"
              />
              <p v-if="userFormErrors.lightning_address" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ userFormErrors.lightning_address }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                비트코인 라이트닝 결제를 받기 위한 주소입니다
              </p>
            </div>

            <div class="flex space-x-3 pt-2">
              <button
                type="button"
                @click="cancelUserEdit"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="isUpdatingProfile"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors text-white',
                  isUpdatingProfile
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
                ]"
              >
                <span v-if="isUpdatingProfile">업데이트 중...</span>
                <span v-else>저장</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card mb-4 p-4 md:p-6">
        <div class="flex flex-col gap-1 mb-6">
          <h3 class="text-base font-semibold text-text-primary">
            {{ t('settings.environment.title', '환경 설정') }}
          </h3>
          <p class="text-sm text-text-secondary">
            {{ t('settings.environment.helper', '결제에 사용할 법정통화와 화면 표시 언어를 선택하세요.') }}
          </p>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <label for="fiatCurrencySelect" class="text-sm font-medium text-text-primary">
              {{ t('settings.currency.label', '법정통화 선택') }}
            </label>
            <p class="text-xs text-text-secondary">
              {{ t('settings.currency.description', '상품의 기본 가격과 환산 정보를 표시할 통화를 고릅니다.') }}
            </p>
            <div class="relative">
              <select
                id="fiatCurrencySelect"
                v-model="selectedFiatCurrency"
                class="w-full rounded-xl border border-border-primary bg-white/90 dark:bg-gray-800/70 px-3 py-2.5 text-sm font-medium text-text-primary appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option
                  v-for="currency in fiatCurrencies"
                  :key="currency"
                  :value="currency"
                >
                  {{ t(currencyTranslationKeys[currency], currencyDisplayNames[currency]) }}
                </option>
              </select>
              <UiIcon name="chevronDown" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            </div>
            <div class="text-xs text-text-secondary flex items-center gap-2">
              <span>1 BTC ≈ {{ formattedBtcPrice }}</span>
              <span v-if="bitcoinStore.priceStatus === 'stale' || bitcoinStore.error">
                <UiIcon name="warning" class="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
          <div class="space-y-2">
            <label for="languageSelect" class="text-sm font-medium text-text-primary">
              {{ t('settings.language.label', '표시 언어') }}
            </label>
            <p class="text-xs text-text-secondary">
              {{ t('settings.language.description', '홈페이지에 표시되는 언어를 변경합니다.') }}
            </p>
            <div class="relative">
              <select
                id="languageSelect"
                :value="localeStore.language"
                @change="handleLanguageSelect"
                class="w-full rounded-xl border border-border-primary bg-white/90 dark:bg-gray-800/70 px-3 py-2.5 text-sm font-medium text-text-primary appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option
                  v-for="option in localeStore.availableLanguages"
                  :key="option.code"
                  :value="option.code"
                >
                  {{ option.label }}
                </option>
              </select>
              <UiIcon name="chevronDown" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            </div>
          </div>
        </div>
      </div>

      <!-- Products Section -->
      <div class="card overflow-hidden">
        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4 p-4">
          <div
            v-for="product in productStore.products"
            :key="product.id"
            class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors"
          >
            <div class="flex items-start space-x-3">
              <!-- Product Image -->
              <img
                :src="product.image || product.image_url"
                :alt="product.name"
                class="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
                @error="handleImageError"
              />
              
              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
                  {{ product.name }}
                </h3>
                
                <!-- Prices -->
                <div class="space-y-1 mb-3">
                  <div class="flex items-center gap-2">
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {{ formatFiatPrice(Number(product.price || 0)) }}
                    </div>
                    <span
                      v-if="productHasDiscount(product)"
                      class="inline-flex items-center rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 px-2 py-0.5 text-xs font-semibold"
                    >
                      {{ t('shop.product.discountBadge', '{percent}% 할인', { percent: productDiscountPercent(product) }) }}
                    </span>
                  </div>
                  <div
                    v-if="productHasDiscount(product)"
                    class="text-xs text-gray-500 dark:text-gray-400 line-through"
                  >
                    {{ formatFiatPrice(Number(product.regular_price || 0)) }}
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="text-xs font-medium text-warning-600 dark:text-warning-400">
                      {{ bitcoinStore.formatSats(bitcoinStore.fiatToSats(Number(product.price || 0), selectedFiatCurrency)) }}
                    </div>
                    <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                      <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                    </span>
                    <span
                      v-else-if="bitcoinStore.error"
                      class="text-red-500"
                      :title="t('common.priceUnavailable', '가격 정보를 불러올 수 없습니다')"
                    >
                      <UiIcon name="warning" class="h-4 w-4" />
                    </span>
                    <span
                      v-else-if="bitcoinStore.priceStatus === 'stale'"
                      class="text-xs text-gray-400"
                      :title="t('common.priceStale', '비트코인 가격 정보가 오래되었습니다')"
                    >
                      <UiIcon name="warning" class="h-4 w-4" />
                    </span>
                  </div>
                </div>
                
                <!-- Action buttons -->
                <div class="flex space-x-2">
                  <button
                    @click="openEditModal(product)"
                    class="flex-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    @click="openDeleteModal(product)"
                    class="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.image', '이미지') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.product', '상품명') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ selectedFiatCurrency }} {{ t('settings.table.price', '가격') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.discount', '할인') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.satsPrice', 'Sats 가격') }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.actions', '작업') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="product in productStore.products"
                :key="product.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td class="px-4 py-4 whitespace-nowrap">
                  <img
                    :src="product.image || product.image_url"
                    :alt="product.name"
                    class="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    @error="handleImageError"
                  />
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ product.name }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {{ formatFiatPrice(Number(product.price || 0)) }}
                  </div>
                  <div
                    v-if="productHasDiscount(product)"
                    class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    <span class="line-through">
                      {{ formatFiatPrice(Number(product.regular_price || 0)) }}
                    </span>
                    <span class="inline-flex items-center rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 px-2 py-0.5">
                      {{ t('shop.product.discountBadge', '{percent}% 할인', { percent: productDiscountPercent(product) }) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span v-if="productHasDiscount(product)" class="text-sm font-semibold text-success-600 dark:text-success-400">
                    -{{ productDiscountPercent(product) }}%
                  </span>
                  <span v-else class="text-sm text-gray-500 dark:text-gray-400">--</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <div class="text-sm font-medium text-warning-600 dark:text-warning-400">
                      {{ bitcoinStore.formatSats(bitcoinStore.fiatToSats(Number(product.price || 0), selectedFiatCurrency)) }}
                    </div>
                    <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                      <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                    </span>
                    <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                      <UiIcon name="warning" class="h-4 w-4" />
                    </span>
                    <span v-else-if="bitcoinStore.priceStatus === 'stale'" class="text-xs text-gray-400" title="비트코인 가격 정보가 오래되었습니다">
                      <UiIcon name="warning" class="h-4 w-4" />
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
                  <div class="flex justify-center space-x-2">
                    <button
                      @click="openEditModal(product)"
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="수정"
                    >
                      <UiIcon name="edit" class="h-5 w-5" />
                    </button>
                    <button
                      @click="openDeleteModal(product)"
                      class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="삭제"
                    >
                      <UiIcon name="trash" class="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end border-t border-border-secondary/60 bg-white/80 dark:bg-gray-900/40 px-4 py-4">
          <button
            @click="openAddModal"
            class="inline-flex items-center space-x-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow-soft transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400 dark:focus:ring-blue-400"
          >
            <UiIcon name="plus" class="h-4 w-4" />
            <span>{{ t('settings.newProduct', '새 상품 추가') }}</span>
          </button>
        </div>
      </div>

      <!-- Add/Edit Product Modal -->
      <div
        v-if="showProductModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="closeProductModal"
      >
        <div class="card p-4 md:p-8 max-w-md w-full mx-4 transition-colors duration-200" @click.stop>
          <h3 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4 md:mb-6">
            {{ editingProduct ? '상품 수정' : '새 상품 추가' }}
          </h3>
          
          <form @submit.prevent="saveProduct" class="space-y-4">
            <!-- Product Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상품명
              </label>
              <input
                v-model="productForm.name"
                type="text"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="상품명을 입력하세요"
              />
              <p v-if="formErrors.name" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.name }}</p>
            </div>

            <!-- Regular Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.product.regularPrice', '정가') }} ({{ currencySymbols[selectedFiatCurrency] }})
              </label>
              <input
                v-model.number="productForm.regularPrice"
                type="number"
                step="1"
                min="0"
                max="999999"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.regularPrice ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.product.regularPrice', '정가')"
              />
              <p v-if="formErrors.regularPrice" class="text-red-500 dark:text-red-400 text-sm mt-1">
                {{ formErrors.regularPrice }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.product.discountHint', '정가보다 낮은 판매 가격을 입력하면 자동으로 할인율이 계산됩니다.') }}
              </p>
            </div>

            <!-- Product Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.product.salePrice', '판매 가격') }} ({{ currencySymbols[selectedFiatCurrency] }})
              </label>
              <input
                v-model.number="productForm.price"
                type="number"
                step="1"
                min="0"
                max="999999"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.price ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="0.00"
              />
              <p v-if="formErrors.price" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.price }}</p>
              <p v-if="formDiscountPercent > 0" class="text-xs text-success-600 dark:text-success-400 mt-1">
                {{ t('settings.product.discountPreview', '{percent}% 할인 적용 예정', { percent: formDiscountPercent }) }}
              </p>
            </div>

            <!-- Product Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                카테고리
              </label>
              <input
                v-model="productForm.categoryName"
                type="text"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.category ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="카테고리 이름을 입력하세요 (예: 음료수, 스낵, 과자 등)"
                maxlength="50"
              />
              <p v-if="formErrors.category" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.category }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                새로운 카테고리를 입력하거나 기존 카테고리 이름을 사용하세요
              </p>
              
              <!-- Show existing categories as suggestions -->
              <div v-if="allCategoryNames.length > 0" class="mt-2">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">기존 카테고리:</p>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="categoryName in allCategoryNames"
                    :key="categoryName"
                    @click="productForm.categoryName = categoryName"
                    type="button"
                    class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {{ categoryName }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Product Image -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이미지 URL
              </label>
              <input
                v-model="productForm.image"
                type="url"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.image ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="https://example.com/image.jpg"
              />
              <p v-if="formErrors.image" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.image }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                이미지 URL을 입력하거나 아래에서 파일을 선택하세요
              </p>
            </div>

            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                또는 이미지 파일 업로드
              </label>
              <input
                @change="handleImageUpload"
                type="file"
                accept="image/*"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <!-- Image Preview -->
            <div v-if="productForm.image" class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                미리보기
              </label>
              <img
                :src="productForm.image"
                :alt="productForm.name"
                class="w-full h-32 object-cover rounded-lg border"
                @error="imageError = true"
              />
              <p v-if="imageError" class="text-red-500 dark:text-red-400 text-sm mt-1">
                이미지를 불러올 수 없습니다. URL을 확인해주세요.
              </p>
            </div>

            <!-- Form Actions -->
            <div class="flex space-x-3 pt-4">
              <button
                type="button"
                @click="closeProductModal"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors text-white',
                  isSubmitting
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
                ]"
              >
                <span v-if="isSubmitting">처리 중...</span>
                <span v-else>{{ editingProduct ? '수정' : '추가' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="closeDeleteModal"
      >
        <div class="card p-4 md:p-8 max-w-md w-full mx-4 text-center transition-colors duration-200" @click.stop>
          <div class="text-4xl md:text-6xl mb-3 md:mb-4 text-warning-500 flex justify-center">
            <UiIcon name="warning" class="h-12 w-12" />
          </div>
          <h3 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-2">상품 삭제</h3>
          <p class="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-6">
            "{{ productToDelete?.name }}"을(를) 삭제하시겠습니까?<br>
            이 작업은 되돌릴 수 없습니다.
          </p>
          <div class="flex space-x-3">
            <button
              @click="closeDeleteModal"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              취소
            </button>
            <button
              @click="deleteProduct"
              class="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      <!-- Success Notification -->
      <div
        v-if="showSuccess"
        class="fixed top-4 right-4 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all"
      >
        <div class="flex items-center space-x-2">
          <UiIcon name="checkCircle" class="h-5 w-5" />
          <span>{{ successMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import UiIcon from '@/components/ui/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/products'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useCategoryStore } from '@/stores/categories'
import type { Product } from '@/services/api'
import { authAPI } from '@/services/api'
import { useLocaleStore } from '@/stores/locale'
import { useFiatCurrencyStore } from '@/stores/fiatCurrency'
import type { FiatCurrency } from '@/services/bitcoin'
import type { LanguageCode } from '@/locales/translations'

const authStore = useAuthStore()
const productStore = useProductStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const categoryStore = useCategoryStore()
const localeStore = useLocaleStore()
const t = localeStore.t
const fiatCurrencyStore = useFiatCurrencyStore()
const { selectedCurrency, formatter } = storeToRefs(fiatCurrencyStore)

const selectedFiatCurrency = computed<FiatCurrency>({
  get: () => selectedCurrency.value,
  set: value => fiatCurrencyStore.setCurrency(value)
})

const fiatCurrencies = fiatCurrencyStore.availableCurrencies
const currencySymbols = fiatCurrencyStore.currencySymbols
const currencyDisplayNames = fiatCurrencyStore.currencyDisplayNames
const currencyTranslationKeys: Record<FiatCurrency, string> = {
  KRW: 'settings.currency.option.krw',
  USD: 'settings.currency.option.usd',
  JPY: 'settings.currency.option.jpy'
}

// Initialize products and Bitcoin price when component mounts
onMounted(async () => {
  try {
    await Promise.all([
      productStore.initializeForSettings(),
      bitcoinStore.initialize(),
      categoryStore.initialize()
    ])
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }
})

// Modal states
const showProductModal = ref(false)
const showDeleteModal = ref(false)
const editingProduct = ref<Product | null>(null)
const productToDelete = ref<Product | null>(null)
const imageError = ref(false)
const isSubmitting = ref(false)
const successMessage = ref('')
const showSuccess = ref(false)

// User settings states
const showUserSettings = ref(false)
const isUpdatingProfile = ref(false)

const formatFiatPrice = (value: number): string => formatter.value.format(Number(value) || 0)

const currentBtcPrice = computed(() => bitcoinStore.getBtcPriceByCurrency(selectedFiatCurrency.value))
const formattedBtcPrice = computed(() => {
  const price = currentBtcPrice.value
  if (!price) return '--'
  return formatter.value.format(price)
})

function productHasDiscount(product: Product): boolean {
  const regular = Number(product.regular_price)
  const sale = Number(product.price)
  if (!regular || !sale) return false
  return regular > sale
}

function productDiscountPercent(product: Product): number {
  if (!productHasDiscount(product)) {
    return 0
  }
  const regular = Number(product.regular_price)
  const sale = Number(product.price)
  return Math.round(((regular - sale) / regular) * 100)
}

const handleLanguageSelect = (event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  localeStore.setLanguage(target.value as LanguageCode)
}

// Product form
const productForm = reactive({
  name: '',
  price: 0,
  regularPrice: 0,
  category: '',
  categoryName: '',
  image: ''
})

// File upload
const selectedFile = ref<File | null>(null)

// Form errors
const formErrors = reactive({
  name: '',
  price: '',
  regularPrice: '',
  category: '',
  image: ''
})

const formDiscountPercent = computed(() => {
  const regular = Number(productForm.regularPrice)
  const sale = Number(productForm.price)
  if (!regular || regular <= 0 || sale <= 0 || regular <= sale) {
    return 0
  }
  return Math.round(((regular - sale) / regular) * 100)
})

// User form
const userForm = reactive({
  username: '',
  email: '',
  lightning_address: ''
})

// User form errors
const userFormErrors = reactive({
  username: '',
  email: '',
  lightning_address: ''
})

// Computed property to get all category names for suggestions
const allCategoryNames = computed(() => {
  const globalNames = categoryStore.globalCategories.map(cat => cat.name)
  const userNames = categoryStore.userCategories.map(cat => cat.name)
  return [...new Set([...globalNames, ...userNames])].sort()
})

// Helper function to find or create category by name
async function findOrCreateCategory(categoryName: string): Promise<number | null> {
  if (!categoryName.trim()) {
    return null
  }

  const trimmedName = categoryName.trim()
  
  // First, try to find existing category by name
  const existingCategory = categoryStore.categories.find(cat => 
    cat.name.toLowerCase() === trimmedName.toLowerCase()
  )
  
  if (existingCategory) {
    return existingCategory.id
  }
  
  // If not found, create a new category
  try {
    const result = await categoryStore.addCategory({
      name: trimmedName
    })
    
    if (result.success && result.category) {
      return result.category.id
    }
  } catch (error) {
    console.error('카테고리 생성 오류:', error)
  }
  
  return null
}

// Reset form
function resetForm() {
  productForm.name = ''
  productForm.price = 0
  productForm.regularPrice = 0
  productForm.category = ''
  productForm.categoryName = ''
  productForm.image = ''
  selectedFile.value = null
  imageError.value = false
  clearErrors()
}

// Clear form errors
function clearErrors() {
  formErrors.name = ''
  formErrors.price = ''
  formErrors.regularPrice = ''
  formErrors.category = ''
  formErrors.image = ''
}

// Validate form
function validateForm(): boolean {
  clearErrors()
  let isValid = true

  // Validate name
  if (!productForm.name.trim()) {
    formErrors.name = '상품명을 입력해주세요'
    isValid = false
  } else if (productForm.name.trim().length < 2) {
    formErrors.name = '상품명은 2글자 이상이어야 합니다'
    isValid = false
  }

  // Validate price
  if (productForm.price <= 0) {
    formErrors.price = '가격은 0보다 커야 합니다'
    isValid = false
  } else if (productForm.price > 999999) {
    formErrors.price = '가격은 ₩999,999를 초과할 수 없습니다'
    isValid = false
  }
  if (productForm.regularPrice && productForm.regularPrice < productForm.price) {
    formErrors.regularPrice = t('settings.product.error.regularLessThanSale', '정가는 판매 가격보다 크거나 같아야 합니다.')
    isValid = false
  }

  // Validate image
  if (!productForm.image.trim()) {
    formErrors.image = '이미지 URL을 입력하거나 파일을 업로드해주세요'
    isValid = false
  }

  return isValid
}

// Watch for image URL changes to reset error state
watch(() => productForm.image, () => {
  imageError.value = false
})

watch(() => productForm.price, value => {
  if (!productForm.regularPrice) {
    productForm.regularPrice = value
  }
})

// Open modals
function openAddModal() {
  editingProduct.value = null
  resetForm()
  showProductModal.value = true
}

function openEditModal(product: any) {
  editingProduct.value = product
  productForm.name = product.name
  productForm.price = product.price
  productForm.regularPrice = product.regular_price || product.price || 0
  productForm.category = product.category || ''
  // Set the category name based on the category ID
  productForm.categoryName = product.category_name || ''
  productForm.image = product.image || product.image_url || ''
  showProductModal.value = true
}

function openDeleteModal(product: any) {
  productToDelete.value = product
  showDeleteModal.value = true
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
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ci8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+Cjwvc3ZnPgo='
}

// Close modals
function closeProductModal() {
  showProductModal.value = false
  resetForm()
  editingProduct.value = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  productToDelete.value = null
}

// Handle image upload
function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      formErrors.image = '이미지 파일이 너무 큽니다. 최대 10MB까지 업로드 가능합니다.'
      return
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      formErrors.image = '지원되지 않는 이미지 형식입니다. JPEG, PNG, GIF, WebP만 지원합니다.'
      return
    }

    // Store the file and create a preview URL
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      productForm.image = e.target?.result as string
      // Clear any previous error
      formErrors.image = ''
      imageError.value = false
    }
    reader.onerror = () => {
      formErrors.image = '이미지 파일을 읽는 중 오류가 발생했습니다.'
    }
    reader.readAsDataURL(file)
  }
}

// Save product
async function saveProduct() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // Handle category: find existing or create new
    const categoryId = await findOrCreateCategory(productForm.categoryName)
    const regularPriceValue =
      productForm.regularPrice && productForm.regularPrice > 0
        ? productForm.regularPrice
        : null
    
    let result
    if (editingProduct.value) {
      // Update existing product
      result = await productStore.updateProduct(editingProduct.value.id, {
        name: productForm.name.trim(),
        price: productForm.price,
        regular_price: regularPriceValue,
        category: categoryId,
        image_url: productForm.image.trim()
      })
    } else {
      // Add new product
      if (selectedFile.value) {
        // Use FormData API for file upload
        result = await productStore.addProductWithFile({
          name: productForm.name.trim(),
          price: productForm.price,
          regular_price: regularPriceValue,
          category: categoryId,
          stock_quantity: 100, // Default stock
          is_available: true
        }, selectedFile.value)
      } else {
        // Use regular JSON API for URL-based images
        result = await productStore.addProduct({
          name: productForm.name.trim(),
          price: productForm.price,
          regular_price: regularPriceValue,
          category: categoryId,
          image_url: productForm.image.trim()
        })
      }
    }

    if (result.success) {
      showSuccessMessage(editingProduct.value ? '상품이 성공적으로 수정되었습니다' : '새 상품이 성공적으로 추가되었습니다')
      closeProductModal()
    } else {
      // Handle specific validation errors
      if (result.message && result.message.includes('이미지')) {
        formErrors.image = result.message
      } else {
        showSuccessMessage(result.message || '오류가 발생했습니다. 다시 시도해주세요')
      }
    }
  } catch (error: any) {
    console.error('상품 저장 중 오류가 발생했습니다:', error)
    
    // Handle different types of errors
    if (error.response?.data?.image_url) {
      formErrors.image = Array.isArray(error.response.data.image_url) 
        ? error.response.data.image_url[0] 
        : error.response.data.image_url
    } else if (error.response?.data?.message) {
      showSuccessMessage(error.response.data.message)
    } else {
      showSuccessMessage('오류가 발생했습니다. 다시 시도해주세요')
    }
  } finally {
    isSubmitting.value = false
  }
}

// Show success message
function showSuccessMessage(message: string, isError = false) {
  successMessage.value = message
  showSuccess.value = true
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

// Delete product
async function deleteProduct() {
  if (productToDelete.value) {
    try {
      const result = await productStore.deleteProduct(productToDelete.value.id)
      if (result.success) {
        showSuccessMessage('상품이 성공적으로 삭제되었습니다')
      } else {
        showSuccessMessage(result.message || '상품 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('상품 삭제 중 오류:', error)
      showSuccessMessage('상품 삭제 중 오류가 발생했습니다')
    }
    closeDeleteModal()
  }
}

// User profile functions
function resetUserForm() {
  userForm.username = authStore.username || ''
  userForm.email = authStore.user?.email || ''
  userForm.lightning_address = authStore.user?.lightning_address || ''
  clearUserErrors()
}

function clearUserErrors() {
  userFormErrors.username = ''
  userFormErrors.email = ''
  userFormErrors.lightning_address = ''
}

function cancelUserEdit() {
  showUserSettings.value = false
  resetUserForm()
}

// Initialize user form when user data changes
watch(() => authStore.user, () => {
  resetUserForm()
}, { immediate: true })

// Update user profile
async function updateProfile() {
  clearUserErrors()
  isUpdatingProfile.value = true

  try {
    const result = await authAPI.updateProfile({
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      lightning_address: userForm.lightning_address.trim() || undefined
    })

    if (result.success && result.user) {
      // Update auth store with new user data
      authStore.updateUser(result.user)
      showSuccessMessage('프로필이 성공적으로 업데이트되었습니다')
      showUserSettings.value = false
    } else {
      // Handle specific validation errors
      if (result.errors) {
        Object.keys(result.errors).forEach(field => {
          if (field in userFormErrors) {
            const errors = result.errors[field]
            userFormErrors[field as keyof typeof userFormErrors] = Array.isArray(errors) ? errors[0] : errors
          }
        })
      }
      
      if (!result.errors || Object.keys(result.errors).length === 0) {
        showSuccessMessage(result.message || '프로필 업데이트에 실패했습니다')
      }
    }
  } catch (error: any) {
    console.error('프로필 업데이트 중 오류:', error)
    showSuccessMessage('프로필 업데이트 중 오류가 발생했습니다')
  } finally {
    isUpdatingProfile.value = false
  }
}
</script>
