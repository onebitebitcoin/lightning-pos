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
              {{ t('settings.pageTitle', '설정') }}
            </h1>
          </div>
          <div class="flex items-center space-x-2">
            <!-- Mobile Bitcoin Price -->
            <div class="text-right text-xs">
              <div class="flex items-center space-x-1">
                <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                  <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                </span>
                <span v-else-if="bitcoinStore.error" class="text-red-500" :title="t('settings.priceUnavailable', '가격 정보를 불러올 수 없습니다')">
                  <UiIcon name="warning" class="h-4 w-4" />
                </span>
                <template v-else>
                  <UiIcon name="btc" class="h-4 w-4 text-orange-500" />
                  <span class="text-gray-900 dark:text-white">{{ formattedBtcPrice }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" :title="t('common.priceStale', '가격 정보가 오래되었습니다')">
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
              {{ t('settings.pageTitle', '설정') }}
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
                <span v-else-if="bitcoinStore.error" class="text-red-500" :title="t('settings.priceUnavailable', '가격 정보를 불러올 수 없습니다')">
                  <UiIcon name="warning" class="h-4 w-4" />
                </span>
                <template v-else>
                  <UiIcon name="btc" class="h-4 w-4 text-orange-500" />
                  <span class="text-gray-900 dark:text-white">{{ formattedBtcPrice }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" :title="t('common.priceStale', '가격 정보가 오래되었습니다')">
                    <UiIcon name="warning" class="h-4 w-4" />
                  </span>
                </template>
              </div>
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              :title="themeStore.isDark ? t('settings.theme.switchLight', '라이트 모드로 전환') : t('settings.theme.switchDark', '다크 모드로 전환')"
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
            class="text-indigo-500 dark:text-indigo-300 hover:text-indigo-400 dark:hover:text-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm"
          >
            {{ t('settings.userSection.edit', '편집') }}
          </button>
        </div>

        <!-- User Info Display -->
        <div v-if="!showUserSettings" class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">{{ t('settings.userSection.username', '사용자명:') }}</span>
            <span class="text-gray-900 dark:text-white">{{ authStore.username }}</span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">{{ t('settings.userSection.email', '이메일:') }}</span>
            <span class="text-gray-900 dark:text-white">{{ authStore.user?.email || t('settings.userSection.notSet', '설정되지 않음') }}</span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">{{ t('settings.userSection.lightningAddress', '라이트닝 지갑 주소:') }}</span>
            <span class="text-gray-900 dark:text-white font-mono text-sm">
              {{ authStore.user?.lightning_address || t('settings.userSection.notSet', '설정되지 않음') }}
            </span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">{{ t('settings.userSection.usdtAddress', 'USDT 지갑 주소:') }}</span>
            <span class="text-gray-900 dark:text-white font-mono text-sm">
              {{ authStore.user?.usdt_address || t('settings.userSection.notSet', '설정되지 않음') }}
            </span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-24">{{ t('settings.userSection.ecashEnabled', 'e-cash 결제 허용:') }}</span>
            <span :class="['font-medium', authStore.user?.ecash_enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400']">
              {{ authStore.user?.ecash_enabled ? t('settings.userSection.enabled', '활성화') : t('settings.userSection.disabled', '비활성화') }}
            </span>
          </div>
        </div>

        <!-- User Info Edit Form -->
        <div v-else>
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.userSection.usernameLabel', '사용자명') }}
              </label>
              <input
                v-model="userForm.username"
                type="text"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  userFormErrors.username ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.userSection.usernamePlaceholder', '사용자명을 입력하세요')"
              />
              <p v-if="userFormErrors.username" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ userFormErrors.username }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.userSection.emailLabel', '이메일') }}
              </label>
              <input
                v-model="userForm.email"
                type="email"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  userFormErrors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.userSection.emailPlaceholder', '이메일을 입력하세요')"
              />
              <p v-if="userFormErrors.email" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ userFormErrors.email }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.userSection.lightningLabel', '라이트닝 지갑 주소') }}
              </label>
              <input
                v-model="userForm.lightning_address"
                type="text"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 font-mono text-sm',
                  userFormErrors.lightning_address ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.userSection.lightningPlaceholder', '예: test@walletofsatoshi.com')"
              />
              <p v-if="userFormErrors.lightning_address" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ userFormErrors.lightning_address }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.userSection.lightningHint', '비트코인 라이트닝 결제를 받기 위한 주소입니다') }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.userSection.usdtLabel', 'USDT 지갑 주소') }}
              </label>
              <input
                v-model="userForm.usdt_address"
                type="text"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 font-mono text-sm',
                  userFormErrors.usdt_address ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.userSection.usdtPlaceholder', '예: username@speed.app')"
              />
              <p v-if="userFormErrors.usdt_address" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ userFormErrors.usdt_address }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.userSection.usdtHint', '라이트닝 기반 USDT 결제를 받으려면 speed.app 주소를 입력하세요') }}
              </p>
            </div>

            <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('settings.userSection.ecashEnabledLabel', 'e-cash 결제 허용') }}
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ t('settings.userSection.ecashEnabledHint', '활성화하면 결제 페이지에서 e-cash 결제 옵션이 표시됩니다') }}
                </p>
              </div>
              <button
                type="button"
                @click="userForm.ecash_enabled = !userForm.ecash_enabled"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  userForm.ecash_enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    userForm.ecash_enabled ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>

            <div class="flex space-x-3 pt-2">
              <button
                type="button"
                @click="cancelUserEdit"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {{ t('settings.userSection.cancel', '취소') }}
              </button>
              <button
                type="submit"
                :disabled="isUpdatingProfile"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors text-white',
                  isUpdatingProfile
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-indigo-800 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800'
                ]"
              >
                <span v-if="isUpdatingProfile">{{ t('settings.userSection.updating', '업데이트 중...') }}</span>
                <span v-else>{{ t('settings.userSection.save', '저장') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card mb-4 p-4 md:p-6" v-if="false">
        <div class="flex flex-col gap-1 mb-6">
          <h3 class="text-lg md:text-xl font-semibold text-text-primary">
            {{ t('settings.environment.title', '언어/통화 선택') }}
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
        <div class="flex items-center justify-between px-4 pt-4 md:px-6 md:pt-6 mb-4">
          <h2 class="text-lg md:text-xl font-semibold text-text-primary">
            {{ t('settings.products.title', '상품 관리') }}
          </h2>
        </div>
        <!-- Mobile Card View -->
        <div class="md:hidden space-y-4 p-4">
          <div
            v-for="(product, index) in productStore.products"
            :key="product.id"
            class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all duration-200"
          >
            <div class="flex items-start space-x-3">
              <!-- Reorder Buttons -->
              <div class="flex flex-col gap-1 pt-4">
                <button
                  type="button"
                  class="p-1 rounded-full border border-border-primary text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  :disabled="index === 0"
                  @click="moveProduct(index, 'up')"
                  :aria-label="t('settings.products.moveUp', '위로 이동')"
                >
                  <UiIcon name="chevronUp" class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="p-1 rounded-full border border-border-primary text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  :disabled="index === productStore.products.length - 1"
                  @click="moveProduct(index, 'down')"
                  :aria-label="t('settings.products.moveDown', '아래로 이동')"
                >
                  <UiIcon name="chevronDown" class="h-4 w-4" />
                </button>
              </div>

              <!-- Product Image -->
              <img
                :src="product.image || product.image_url"
                :alt="product.name"
                class="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 flex-shrink-0"
                @error="handleImageError"
              />
              
              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                  {{ product.name }}
                </h3>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {{ productDescriptionPreview(product, 60) }}
                </p>
                
                <!-- Prices -->
                <div class="space-y-1 mb-3">
                  <div class="flex items-center gap-2">
                    <div class="text-lg font-bold text-indigo-500 dark:text-indigo-300">
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
                    <div class="text-xs font-medium text-indigo-500 dark:text-indigo-300">
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
                  <RouterLink
                    :to="`/products/edit/${product.id}`"
                    class="flex-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 py-2 px-3 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-center"
                  >
                    {{ t('settings.action.edit', '수정') }}
                  </RouterLink>
                  <button
                    @click="openDeleteModal(product)"
                    class="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    {{ t('settings.action.delete', '삭제') }}
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
                <th class="w-10 px-2 py-3"></th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.image', '이미지') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.product', '상품명') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ selectedFiatCurrency }} {{ t('settings.table.price', '가격') }} / {{ t('settings.table.satsPrice', 'Sats 가격') }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.product.description', '상품 설명') }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{ t('settings.table.actions', '작업') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="(product, index) in productStore.products"
                :key="product.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td class="px-2 py-4 whitespace-nowrap text-center">
                  <div class="inline-flex flex-col gap-1">
                    <button
                      type="button"
                      class="p-1 rounded-full border border-border-primary text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      :disabled="index === 0"
                      @click="moveProduct(index, 'up')"
                      :aria-label="t('settings.products.moveUp', '위로 이동')"
                    >
                      <UiIcon name="chevronUp" class="h-4 w-4 mx-auto" />
                    </button>
                    <button
                      type="button"
                      class="p-1 rounded-full border border-border-primary text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      :disabled="index === productStore.products.length - 1"
                      @click="moveProduct(index, 'down')"
                      :aria-label="t('settings.products.moveDown', '아래로 이동')"
                    >
                      <UiIcon name="chevronDown" class="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </td>
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
                  <div class="flex flex-wrap items-center gap-3">
                    <div class="text-lg font-bold text-indigo-500 dark:text-indigo-300">
                      {{ formatFiatPrice(Number(product.price || 0)) }}
                    </div>
                    <div class="flex items-center space-x-2">
                      <div class="text-sm font-medium text-indigo-500 dark:text-indigo-300">
                        {{ bitcoinStore.formatSats(bitcoinStore.fiatToSats(Number(product.price || 0), selectedFiatCurrency)) }}
                      </div>
                      <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                        <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                      </span>
                      <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                        <UiIcon name="warning" class="h-4 w-4" />
                      </span>
                      <span
                        v-else-if="bitcoinStore.priceStatus === 'stale'"
                        class="text-xs text-gray-400"
                        title="비트코인 가격 정보가 오래되었습니다"
                      >
                        <UiIcon name="warning" class="h-4 w-4" />
                      </span>
                    </div>
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
                <td class="px-4 py-4">
                  <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {{ productDescriptionPreview(product, 110) }}
                  </p>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
                  <div class="flex justify-center space-x-2">
                    <RouterLink
                      :to="`/products/edit/${product.id}`"
                      class="text-indigo-500 dark:text-indigo-300 hover:text-indigo-400 dark:hover:text-indigo-200 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      :title="t('settings.action.editTitle', '수정')"
                    >
                      <UiIcon name="edit" class="h-5 w-5" />
                    </RouterLink>
                    <button
                      @click="openDeleteModal(product)"
                      class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      :title="t('settings.action.deleteTitle', '삭제')"
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
          <RouterLink
            to="/products/new"
            class="btn btn-primary inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium shadow-soft focus:ring-offset-2"
          >
            <UiIcon name="plus" class="h-4 w-4" />
            <span>{{ t('settings.newProduct', '새 상품 추가') }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- e-Cash Management -->
      <div class="card p-4 md:p-6 space-y-6 mt-6" v-if="authStore.user?.ecash_enabled">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-primary-600">{{ t('settings.ecash.badge', 'e-cash 관리') }}</p>
            <h2 class="text-lg md:text-xl font-semibold text-text-primary">
              {{ t('settings.ecash.title', 'Cashu e-cash') }}
            </h2>
            <p class="text-sm text-text-secondary mt-1">
              {{ t('settings.ecash.description', 'Cashu 기반 e-cash 토큰을 안전하게 관리하고 백업하거나 복원할 수 있습니다.') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <RouterLink
              to="/pay/send"
              class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-500 focus:ring-2 focus:ring-primary-200 focus:ring-offset-2"
            >
              <UiIcon name="send" class="h-4 w-4" />
              <span>{{ t('settings.ecash.actions.send', 'e-cash 보내기') }}</span>
            </RouterLink>
            <button
              type="button"
              @click="handleEcashBackup"
              class="p-2 rounded-lg border border-border-primary text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              :title="t('settings.ecash.actions.backup', '백업')"
            >
              <UiIcon name="download" class="h-5 w-5" />
            </button>
            <button
              type="button"
              @click="triggerEcashRestore"
              class="p-2 rounded-lg border border-border-primary text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              :title="t('settings.ecash.actions.restore', '복원')"
            >
              <UiIcon name="upload" class="h-5 w-5" />
            </button>
            <input
              ref="ecashFileInput"
              type="file"
              accept="application/json"
              class="hidden"
              @change="handleEcashFileChange"
            />
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-3">
            <label class="text-sm font-medium text-text-primary">
              {{ t('settings.ecash.mintLabel', 'Mint 서버 URL') }}
            </label>
            <input
              v-model="ecashMintForm.mintUrl"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              :placeholder="t('settings.ecash.mintPlaceholder', '예: mint.coinos.io')"
            />
            <p class="text-xs text-text-secondary">
              {{ t('settings.ecash.mintHelper', 'https:// 접두사가 없으면 자동으로 추가되며, 기본값은 mint.coinos.io 입니다.') }}
            </p>
            <div class="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                @click="saveEcashMintUrl"
              >
                {{ t('settings.ecash.actions.save', '저장') }}
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg border border-border-primary text-text-primary text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                @click="refreshEcashHoldings"
              >
                {{ t('settings.ecash.actions.refresh', '새로고침') }}
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-orange-500 dark:bg-orange-600 text-white text-sm font-medium hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="cleanupSpentTokens"
                :disabled="isCleaningTokens || !hasEcashHoldings"
              >
                <span v-if="isCleaningTokens">{{ t('settings.ecash.actions.cleaning', '정리 중...') }}</span>
                <span v-else>{{ t('settings.ecash.actions.cleanup', '사용된 토큰 정리') }}</span>
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-red-500 dark:bg-red-600 text-white text-sm font-medium hover:bg-red-600 dark:hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="deleteAllTokens"
                :disabled="!hasEcashHoldings"
              >
                {{ t('settings.ecash.actions.deleteAll', '모든 토큰 삭제') }}
              </button>
            </div>
          </div>
          <div class="rounded-2xl border border-border-primary/70 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-text-secondary">
                {{ t('settings.ecash.total', '총 보유량') }}
              </p>
              <span v-if="isAutoCheckingTokens" class="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1">
                <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                {{ t('settings.ecash.checking', '확인 중...') }}
              </span>
            </div>
            <p class="text-3xl font-bold text-text-primary">
              {{ ecashTotalSats ? bitcoinStore.formatSats(ecashTotalSats) : '0 sats' }}
            </p>
            <p class="text-xs text-text-secondary">
              {{ t('settings.ecash.holdingsDescription', 'mint 별 e-cash 잔액을 확인하세요.') }}
            </p>
          </div>
        </div>

        <div class="flex justify-end mb-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-blue-500 dark:bg-blue-600 text-white text-sm font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="checkAllMints"
            :disabled="!hasEcashHoldings"
          >
            {{ t('settings.ecash.actions.checkAll', '모든 Mint 확인') }}
          </button>
        </div>

        <div class="overflow-x-auto border border-border-primary/60 rounded-2xl">
          <table class="min-w-full divide-y divide-border-primary/40 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800/60 text-text-secondary uppercase tracking-wide text-xs">
              <tr>
                <th class="px-4 py-3 text-left font-semibold w-8"></th>
                <th class="px-4 py-3 text-left font-semibold">
                  {{ t('settings.ecash.table.mint', 'Mint') }}
                </th>
                <th class="px-4 py-3 text-left font-semibold">
                  {{ t('settings.ecash.table.status', '상태') }}
                </th>
                <th class="px-4 py-3 text-left font-semibold">
                  {{ t('settings.ecash.table.amount', '금액 (sats)') }}
                </th>
                <th class="px-4 py-3 text-left font-semibold">
                  {{ t('settings.ecash.table.count', '토큰 수') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900">
              <tr v-if="!hasEcashHoldings">
                <td colspan="5" class="px-4 py-6 text-center text-text-secondary">
                  {{ t('settings.ecash.empty', '보유 중인 e-cash 토큰이 없습니다.') }}
                </td>
              </tr>
              <template v-for="(holding, index) in ecashHoldings" :key="holding.mintUrl">
                <tr
                  class="border-b border-border-primary/30 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td class="px-4 py-3 cursor-pointer" @click="toggleMintExpand(holding.mintUrl)">
                    <UiIcon
                      :name="expandedMints.has(holding.mintUrl) ? 'chevronDown' : 'chevronRight'"
                      class="h-4 w-4 text-text-secondary transition-transform"
                    />
                  </td>
                  <td class="px-4 py-3 font-medium text-text-primary break-all cursor-pointer" @click="toggleMintExpand(holding.mintUrl)">
                    {{ holding.mintUrl }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button
                        @click.stop="checkMint(holding.mintUrl)"
                        class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        :disabled="checkingMint.has(holding.mintUrl)"
                        :title="t('settings.ecash.actions.checkMint', '이 Mint 확인')"
                      >
                        <UiIcon
                          v-if="checkingMint.has(holding.mintUrl)"
                          name="spinner"
                          class="h-4 w-4 animate-spin text-gray-400"
                        />
                        <UiIcon
                          v-else
                          name="refresh"
                          class="h-4 w-4 text-text-secondary"
                        />
                      </button>
                      <div class="flex items-center gap-1">
                        <UiIcon
                          :name="getMintStatus(holding.mintUrl).icon"
                          :class="['h-4 w-4', getMintStatus(holding.mintUrl).color]"
                        />
                        <span :class="['text-xs', getMintStatus(holding.mintUrl).color]">
                          {{ getMintStatus(holding.mintUrl).text }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-text-primary font-semibold cursor-pointer" @click="toggleMintExpand(holding.mintUrl)">
                    {{ bitcoinStore.formatSats(holding.amount) }}
                  </td>
                  <td class="px-4 py-3 text-text-secondary">
                    <div class="flex items-center justify-between">
                      <span class="cursor-pointer" @click="toggleMintExpand(holding.mintUrl)">{{ holding.count.toLocaleString() }}</span>
                      <button
                        @click.stop="deleteTokensByMint(holding.mintUrl)"
                        class="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors ml-2"
                        :title="t('settings.ecash.actions.deleteMint', '이 Mint의 모든 토큰 삭제')"
                      >
                        {{ t('settings.ecash.actions.delete', '삭제') }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="expandedMints.has(holding.mintUrl)" class="bg-gray-50/50 dark:bg-gray-800/20">
                  <td colspan="5" class="px-0 py-0">
                    <div class="px-8 py-4 space-y-2">
                      <div
                        v-for="(proof, proofIndex) in getProofsByMint(holding.mintUrl)"
                        :key="proof.secret || proofIndex"
                        class="bg-white dark:bg-gray-900 border border-border-primary/40 rounded-lg p-4 space-y-2 text-xs"
                      >
                        <div class="flex items-center justify-between mb-2">
                          <span class="font-semibold text-text-primary">
                            {{ t('settings.ecash.proof.title', '토큰 #{index}', { index: proofIndex + 1 }) }}
                          </span>
                          <div class="flex items-center gap-2">
                            <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                              {{ proof.amount }} sats
                            </span>
                            <button
                              @click.stop="deleteProof(proof)"
                              class="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                              :title="t('settings.ecash.proof.delete', '이 토큰 삭제')"
                            >
                              {{ t('settings.ecash.proof.deleteBtn', '삭제') }}
                            </button>
                          </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <span class="text-text-secondary">{{ t('settings.ecash.proof.secret', 'Secret:') }}</span>
                            <div class="font-mono text-text-primary break-all bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                              {{ proof.secret || 'N/A' }}
                            </div>
                          </div>
                          <div>
                            <span class="text-text-secondary">{{ t('settings.ecash.proof.id', 'Keyset ID:') }}</span>
                            <div class="font-mono text-text-primary break-all bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                              {{ proof.id || 'N/A' }}
                            </div>
                          </div>
                          <div>
                            <span class="text-text-secondary">{{ t('settings.ecash.proof.c', 'C (Signature):') }}</span>
                            <div class="font-mono text-text-primary break-all bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                              {{ proof.C || 'N/A' }}
                            </div>
                          </div>
                          <div>
                            <span class="text-text-secondary">{{ t('settings.ecash.proof.mint', 'Mint URL:') }}</span>
                            <div class="font-mono text-text-primary break-all bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                              {{ proof.mintUrl || 'N/A' }}
                            </div>
                          </div>
                        </div>
                        <div v-if="proof.dleq" class="mt-2 pt-2 border-t border-border-primary/30">
                          <span class="text-text-secondary font-semibold">{{ t('settings.ecash.proof.dleq', 'DLEQ Proof:') }}</span>
                          <div class="grid grid-cols-1 gap-1 mt-1">
                            <div class="flex items-start space-x-2">
                              <span class="text-text-secondary">e:</span>
                              <span class="font-mono text-text-primary break-all flex-1">{{ proof.dleq.e || 'N/A' }}</span>
                            </div>
                            <div class="flex items-start space-x-2">
                              <span class="text-text-secondary">s:</span>
                              <span class="font-mono text-text-primary break-all flex-1">{{ proof.dleq.s || 'N/A' }}</span>
                            </div>
                            <div v-if="proof.dleq.r" class="flex items-start space-x-2">
                              <span class="text-text-secondary">r:</span>
                              <span class="font-mono text-text-primary break-all flex-1">{{ proof.dleq.r }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Product Modal -->
      <div
        v-if="showProductModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto"
        @click="closeProductModal"
      >
        <div class="card p-4 md:p-8 max-w-md w-full mx-auto my-8 transition-colors duration-200 max-h-[90vh] overflow-y-auto" @click.stop>
          <h3 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-4 md:mb-6">
            {{ editingProduct ? t('settings.modal.editTitle', '상품 수정') : t('settings.modal.addTitle', '새 상품 추가') }}
          </h3>

          <form @submit.prevent="saveProduct" class="space-y-4">
            <!-- Product Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.product.title', '상품명') }}
              </label>
              <input
                v-model="productForm.name"
                type="text"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.product.titlePlaceholder', '상품명을 입력하세요')"
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
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
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
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.price ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                placeholder="0.00"
              />
              <p v-if="formErrors.price" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.price }}</p>
              <p v-if="formDiscountPercent > 0" class="text-xs text-success-600 dark:text-success-400 mt-1">
                {{ t('settings.product.discountPreview', '{percent}% 할인 적용 예정', { percent: formDiscountPercent }) }}
              </p>
            </div>

            <!-- Product Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.product.description', '상품 설명') }}
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('settings.product.descriptionOptional', '선택 사항') }}
                </span>
              </label>
              <textarea
                v-model="productForm.description"
                rows="3"
                :placeholder="t('settings.product.descriptionPlaceholder', '상품에 대한 설명을 입력하세요 (선택)')"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-none',
                  formErrors.description ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                maxlength="500"
              ></textarea>
              <p v-if="formErrors.description" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.description }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.product.descriptionHint', '주요 특징이나 사용법을 간단히 적어주세요') }}
              </p>
            </div>

            <!-- Product Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.product.category', '카테고리') }}
              </label>
              <input
                v-model="productForm.categoryName"
                type="text"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.category ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.product.categoryPlaceholder', '카테고리 이름을 입력하세요 (예: 음료수, 스낵, 과자 등)')"
                maxlength="50"
              />
              <p v-if="formErrors.category" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.category }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.product.categoryHint', '새로운 카테고리를 입력하거나 기존 카테고리 이름을 사용하세요') }}
              </p>

              <!-- Show existing categories as suggestions -->
              <div v-if="allCategoryNames.length > 0" class="mt-2">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('settings.product.categoryExisting', '기존 카테고리:') }}</p>
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
                {{ t('settings.product.image', '이미지 URL') }}
              </label>
              <input
                v-model="productForm.image"
                type="url"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.image ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
                :placeholder="t('settings.product.imagePlaceholder', 'https://example.com/image.jpg')"
              />
              <p v-if="formErrors.image" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.image }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.product.imageHint', '이미지 URL을 입력하거나 아래에서 파일을 선택하세요') }}
              </p>
            </div>

            <!-- Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.product.imageUpload', '또는 이미지 파일 업로드') }}
              </label>
              <input
                @change="handleImageUpload"
                type="file"
                accept="image/*"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>

            <!-- Image Preview -->
            <div v-if="productForm.image" class="mt-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('settings.product.preview', '미리보기') }}
              </label>
              <img
                :src="productForm.image"
                :alt="productForm.name"
                class="w-full h-32 object-cover rounded-lg border"
                @error="imageError = true"
              />
              <p v-if="imageError" class="text-red-500 dark:text-red-400 text-sm mt-1">
                {{ t('settings.product.imageError', '이미지를 불러올 수 없습니다. URL을 확인해주세요.') }}
              </p>
            </div>

            <!-- Form Actions -->
            <div class="flex space-x-3 pt-4">
              <button
                type="button"
                @click="closeProductModal"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {{ t('settings.modal.cancel', '취소') }}
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition-colors text-white',
                  isSubmitting
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-indigo-800 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800'
                ]"
              >
                <span v-if="isSubmitting">{{ t('settings.modal.processing', '처리 중...') }}</span>
                <span v-else>{{ editingProduct ? t('settings.modal.edit', '수정') : t('settings.modal.add', '추가') }}</span>
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
          <h3 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white mb-2">{{ t('settings.delete.title', '상품 삭제') }}</h3>
          <p class="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-6">
            {{ t('settings.delete.message', '"{name}"을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.', { name: productToDelete?.name ?? '' }) }}
          </p>
          <div class="flex space-x-3">
            <button
              @click="closeDeleteModal"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {{ t('settings.delete.cancel', '취소') }}
            </button>
            <button
              @click="deleteProduct"
              class="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200"
            >
              {{ t('settings.delete.confirm', '삭제') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Success Notification -->
      <div
        v-if="showSuccess"
        class="fixed top-4 right-4 bg-indigo-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all"
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
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import UiIcon from '@/components/ui/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/products'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useCategoryStore } from '@/stores/categories'
import { useEcashStore } from '@/stores/ecash'
import type { Product } from '@/services/api'
import { authAPI } from '@/services/api'
import { useLocaleStore } from '@/stores/locale'
import { useFiatCurrencyStore } from '@/stores/fiatCurrency'
import type { FiatCurrency } from '@/services/bitcoin'
import type { LanguageCode } from '@/locales/translations'
import { removeSpentProofs, checkMintAvailability, type MintAvailability } from '@/services/cashuCheck'

const authStore = useAuthStore()
const productStore = useProductStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const categoryStore = useCategoryStore()
const ecashStore = useEcashStore()
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

const ecashHoldings = computed(() => ecashStore.holdings)
const ecashTotalSats = computed(() => ecashStore.totalSats)
const hasEcashHoldings = computed(() => ecashStore.proofsCount > 0)

// E-cash proof expansion state
const expandedMints = ref<Set<string>>(new Set())
const isCleaningTokens = ref(false)
const isAutoCheckingTokens = ref(false)

// Mint availability state
const mintAvailability = ref<Map<string, MintAvailability>>(new Map())
const checkingMint = ref<Set<string>>(new Set())

function toggleMintExpand(mintUrl: string) {
  if (expandedMints.value.has(mintUrl)) {
    expandedMints.value.delete(mintUrl)
  } else {
    expandedMints.value.add(mintUrl)
  }
  // Trigger reactivity
  expandedMints.value = new Set(expandedMints.value)
}

function getProofsByMint(mintUrl: string) {
  return ecashStore.proofs.filter(proof => (proof.mintUrl || ecashStore.mintUrl) === mintUrl)
}

function deleteProof(proof: any) {
  if (!confirm(t('settings.ecash.proof.confirmDelete', '이 토큰을 삭제하시겠습니까? ({amount} sats)', { amount: proof.amount }))) {
    return
  }

  const result = ecashStore.removeProofs([proof])
  ecashStore.refreshHoldings()

  if (result.removed > 0) {
    showSuccessMessage(
      t('settings.ecash.proof.deleted', '토큰이 삭제되었습니다.')
    )
  }
}

function deleteTokensByMint(mintUrl: string) {
  const proofsToDelete = getProofsByMint(mintUrl)
  const totalAmount = proofsToDelete.reduce((sum, p) => sum + (p.amount || 0), 0)

  if (!confirm(
    t(
      'settings.ecash.mint.confirmDelete',
      '이 Mint의 모든 토큰을 삭제하시겠습니까?\n\nMint: {mint}\n토큰 수: {count}개\n총 금액: {amount} sats',
      { mint: mintUrl, count: proofsToDelete.length, amount: totalAmount }
    )
  )) {
    return
  }

  const result = ecashStore.removeProofs(proofsToDelete)
  ecashStore.refreshHoldings()

  if (result.removed > 0) {
    showSuccessMessage(
      t('settings.ecash.mint.deleted', '{count}개의 토큰이 삭제되었습니다.', { count: result.removed })
    )
  }
}

function deleteAllTokens() {
  const allProofs = ecashStore.getProofsSnapshot()
  const totalAmount = allProofs.reduce((sum, p) => sum + (p.amount || 0), 0)

  if (!confirm(
    t(
      'settings.ecash.all.confirmDelete',
      '모든 e-cash 토큰을 삭제하시겠습니까?\n\n총 토큰 수: {count}개\n총 금액: {amount} sats\n\n⚠️ 이 작업은 되돌릴 수 없습니다!',
      { count: allProofs.length, amount: totalAmount }
    )
  )) {
    return
  }

  // Double confirm for all deletion
  if (!confirm(
    t('settings.ecash.all.confirmDeleteAgain', '정말로 모든 토큰을 삭제하시겠습니까?')
  )) {
    return
  }

  ecashStore.setProofs([])
  ecashStore.refreshHoldings()

  showSuccessMessage(
    t('settings.ecash.all.deleted', '모든 토큰이 삭제되었습니다.')
  )
}

async function checkMint(mintUrl: string) {
  if (checkingMint.value.has(mintUrl)) {
    return
  }

  checkingMint.value.add(mintUrl)
  checkingMint.value = new Set(checkingMint.value)

  try {
    const result = await checkMintAvailability(mintUrl)
    mintAvailability.value.set(mintUrl, result)
    mintAvailability.value = new Map(mintAvailability.value)
  } catch (error) {
    console.error(`Failed to check mint ${mintUrl}:`, error)
    mintAvailability.value.set(mintUrl, {
      available: false,
      error: 'Check failed'
    })
    mintAvailability.value = new Map(mintAvailability.value)
  } finally {
    checkingMint.value.delete(mintUrl)
    checkingMint.value = new Set(checkingMint.value)
  }
}

async function checkAllMints() {
  const mints = ecashHoldings.value.map(h => h.mintUrl)
  await Promise.all(mints.map(mint => checkMint(mint)))
}

function getMintStatus(mintUrl: string): { icon: string; color: string; text: string } {
  if (checkingMint.value.has(mintUrl)) {
    return { icon: 'spinner', color: 'text-gray-400', text: t('settings.ecash.mint.checking', '확인 중...') }
  }

  const status = mintAvailability.value.get(mintUrl)
  if (!status) {
    return { icon: 'warning', color: 'text-gray-400', text: t('settings.ecash.mint.unknown', '미확인') }
  }

  if (status.available) {
    return { icon: 'checkCircle', color: 'text-green-500', text: t('settings.ecash.mint.available', '사용 가능') }
  }

  return { icon: 'warning', color: 'text-red-500', text: status.error || t('settings.ecash.mint.unavailable', '사용 불가') }
}

async function autoCheckAndCleanupTokens(showMessages = false) {
  if (isAutoCheckingTokens.value || isCleaningTokens.value) {
    return { totalSpent: 0, totalChecked: 0 }
  }

  const allProofs = ecashStore.getProofsSnapshot()
  if (allProofs.length === 0) {
    return { totalSpent: 0, totalChecked: 0 }
  }

  isAutoCheckingTokens.value = true
  try {
    // Group proofs by mint
    const proofsByMint = new Map<string, typeof allProofs>()
    allProofs.forEach(proof => {
      const mint = proof.mintUrl || ecashStore.mintUrl
      if (!proofsByMint.has(mint)) {
        proofsByMint.set(mint, [])
      }
      proofsByMint.get(mint)!.push(proof)
    })

    let totalSpent = 0
    let totalChecked = 0

    // Check each mint separately
    for (const [mint, proofs] of proofsByMint) {
      try {
        const { spent, checked } = await removeSpentProofs(mint, proofs)
        totalChecked += checked

        if (spent.length > 0) {
          ecashStore.removeProofs(spent)
          totalSpent += spent.length
        }
      } catch (error) {
        console.error(`Failed to check proofs for mint ${mint}:`, error)
      }
    }

    ecashStore.refreshHoldings()

    if (showMessages && totalSpent > 0) {
      showSuccessMessage(
        t(
          'settings.ecash.cleanup.autoSuccess',
          '{count}개의 사용된 토큰을 자동으로 제거했습니다.',
          { count: totalSpent }
        )
      )
    }

    return { totalSpent, totalChecked }
  } catch (error) {
    console.error('Failed to auto-cleanup spent tokens:', error)
    return { totalSpent: 0, totalChecked: 0 }
  } finally {
    isAutoCheckingTokens.value = false
  }
}

async function cleanupSpentTokens() {
  if (isCleaningTokens.value || !hasEcashHoldings.value) {
    return
  }

  isCleaningTokens.value = true
  try {
    const { totalSpent, totalChecked } = await autoCheckAndCleanupTokens(false)

    if (totalSpent > 0) {
      showSuccessMessage(
        t(
          'settings.ecash.cleanup.success',
          '{count}개의 사용된 토큰을 제거했습니다.',
          { count: totalSpent }
        )
      )
    } else if (totalChecked > 0) {
      showSuccessMessage(
        t('settings.ecash.cleanup.allValid', '모든 토큰이 유효합니다.')
      )
    } else {
      showSuccessMessage(
        t('settings.ecash.cleanup.checkFailed', '토큰 상태를 확인할 수 없습니다.')
      )
    }
  } catch (error) {
    console.error('Failed to cleanup spent tokens:', error)
    showSuccessMessage(
      t('settings.ecash.cleanup.error', '토큰 정리 중 오류가 발생했습니다.')
    )
  } finally {
    isCleaningTokens.value = false
  }
}

// Initialize products and Bitcoin price when component mounts
onMounted(async () => {
  try {
    await Promise.all([
      productStore.initializeForSettings(),
      bitcoinStore.initialize(),
      categoryStore.initialize(),
      ecashStore.initialize()
    ])
    ecashMintForm.mintUrl = ecashStore.mintUrl
    ecashStore.refreshHoldings()

    // Auto-check and remove spent tokens in background
    if (hasEcashHoldings.value) {
      // Run in background without blocking UI
      autoCheckAndCleanupTokens(true).catch(error => {
        console.error('Auto-cleanup failed:', error)
      })
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }
})

// Product ordering helpers

function reorderProductList(fromIndex: number, toIndex: number) {
  const currentProducts = [...productStore.products]
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= currentProducts.length ||
    toIndex >= currentProducts.length
  ) {
    return
  }

  const [removed] = currentProducts.splice(fromIndex, 1)
  currentProducts.splice(toIndex, 0, removed)
  productStore.reorderProducts(currentProducts)
}

function moveProduct(index: number, direction: 'up' | 'down') {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= productStore.products.length) {
    return
  }
  reorderProductList(index, targetIndex)
}

// Modal states
const showProductModal = ref(false)
const showDeleteModal = ref(false)
const editingProduct = ref<Product | null>(null)
const productToDelete = ref<Product | null>(null)
const imageError = ref(false)
const isSubmitting = ref(false)
const successMessage = ref('')
const showSuccess = ref(false)
const ecashMintForm = reactive({ mintUrl: '' })
const ecashFileInput = ref<HTMLInputElement | null>(null)

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

function productDescriptionPreview(product: Product, maxLength = 80): string {
  const description = (product.description || '').trim()
  if (!description) {
    return '--'
  }
  return description.length > maxLength
    ? `${description.slice(0, maxLength).trimEnd()}...`
    : description
}

const handleLanguageSelect = (event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  localeStore.setLanguage(target.value as LanguageCode)
}

function saveEcashMintUrl() {
  ecashStore.setMintUrl(ecashMintForm.mintUrl)
  showSuccessMessage(t('settings.ecash.saveMintSuccess', 'Mint 서버 URL이 저장되었습니다.'))
}

function refreshEcashHoldings() {
  ecashStore.refreshHoldings()
  showSuccessMessage(t('settings.ecash.refreshSuccess', 'e-cash 잔액을 새로고침했습니다.'))
}

function handleEcashBackup() {
  try {
    const data = ecashStore.exportProofs(true)
    const blob = new Blob([data], { type: 'application/json' })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cashu-backup-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showSuccessMessage(t('settings.ecash.backupSuccess', 'e-cash 백업 파일을 다운로드했습니다.'))
  } catch (error) {
    console.error('e-cash backup failed:', error)
    showSuccessMessage(t('settings.ecash.backupFailed', 'e-cash 백업 파일을 만드는 데 실패했습니다.'), true)
  }
}

function triggerEcashRestore() {
  ecashFileInput.value?.click()
}

async function handleEcashFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const result = ecashStore.importProofs(text)
    ecashStore.refreshHoldings()
    showSuccessMessage(
      t('settings.ecash.restoreSuccess', '{count}개의 토큰을 불러왔습니다.', { count: result.added })
    )
  } catch (error) {
    console.error('e-cash restore failed:', error)
    showSuccessMessage(t('settings.ecash.restoreFailed', 'e-cash 복원에 실패했습니다. JSON 파일을 확인해주세요.'), true)
  } finally {
    if (target) {
      target.value = ''
    }
  }
}

// Product form
const productForm = reactive({
  name: '',
  price: 0,
  regularPrice: 0,
  description: '',
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
  description: '',
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
  lightning_address: '',
  usdt_address: '',
  ecash_enabled: false
})

// User form errors
const userFormErrors = reactive({
  username: '',
  email: '',
  lightning_address: '',
  usdt_address: ''
})

watch(
  () => ecashStore.mintUrl,
  value => {
    ecashMintForm.mintUrl = value
  },
  { immediate: true }
)

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
  productForm.description = ''
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
  formErrors.description = ''
  formErrors.category = ''
  formErrors.image = ''
}

// Validate form
function validateForm(): boolean {
  clearErrors()
  let isValid = true

  // Validate name
  if (!productForm.name.trim()) {
    formErrors.name = t('settings.error.nameRequired', '상품명을 입력해주세요')
    isValid = false
  } else if (productForm.name.trim().length < 2) {
    formErrors.name = t('settings.error.nameTooShort', '상품명은 2글자 이상이어야 합니다')
    isValid = false
  }

  // Validate price
  if (productForm.price <= 0) {
    formErrors.price = t('settings.error.priceInvalid', '가격은 0보다 커야 합니다')
    isValid = false
  } else if (productForm.price > 999999) {
    formErrors.price = t('settings.error.priceExceeded', '가격은 ₩999,999를 초과할 수 없습니다')
    isValid = false
  }
  if (productForm.regularPrice && productForm.regularPrice < productForm.price) {
    formErrors.regularPrice = t('settings.product.error.regularLessThanSale', '정가는 판매 가격보다 크거나 같아야 합니다.')
    isValid = false
  }

  // Validate image
  if (!productForm.image.trim()) {
    formErrors.image = t('settings.error.imageRequired', '이미지 URL을 입력하거나 파일을 업로드해주세요')
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

function openEditModal(product: any) {
  editingProduct.value = product
  productForm.name = product.name
  productForm.price = product.price
  productForm.regularPrice = product.regular_price || product.price || 0
  productForm.description = product.description || ''
  // Set the category name based on the category ID
  productForm.categoryName = product.category_name || ''
  productForm.image = product.image || product.image_url || ''
  selectedFile.value = null
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
    const descriptionValue = productForm.description.trim()
    
    let result
    if (editingProduct.value) {
      // Update existing product
      result = await productStore.updateProduct(editingProduct.value.id, {
        name: productForm.name.trim(),
        price: productForm.price,
        regular_price: regularPriceValue,
        description: descriptionValue,
        category: categoryId ?? undefined,
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
          description: descriptionValue || undefined,
          category: categoryId ?? undefined,
          stock_quantity: 100, // Default stock
          is_available: true
        }, selectedFile.value)
      } else {
        // Use regular JSON API for URL-based images
        result = await productStore.addProduct({
          name: productForm.name.trim(),
          price: productForm.price,
          regular_price: regularPriceValue,
          description: descriptionValue || undefined,
          category: categoryId ?? undefined,
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
  userForm.usdt_address = authStore.user?.usdt_address || ''
  userForm.ecash_enabled = authStore.user?.ecash_enabled || false
  clearUserErrors()
}

function clearUserErrors() {
  userFormErrors.username = ''
  userFormErrors.email = ''
  userFormErrors.lightning_address = ''
  userFormErrors.usdt_address = ''
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
      lightning_address: userForm.lightning_address.trim() || undefined,
      usdt_address: userForm.usdt_address.trim() || undefined,
      ecash_enabled: userForm.ecash_enabled
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
