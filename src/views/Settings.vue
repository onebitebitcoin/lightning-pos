<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200">
      <div class="container mx-auto px-4 py-3 md:py-4">
        <!-- Mobile Header -->
        <div class="flex justify-between items-center md:hidden">
          <div class="flex items-center space-x-2">
            <button
              @click="$router.push('/shop')"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 transition-colors duration-200"
            >
              <span class="text-lg">←</span>
            </button>
            <h1 class="text-lg font-bold text-gray-800 dark:text-white">상품 관리</h1>
          </div>
          <div class="flex items-center space-x-2">
            <!-- Mobile Bitcoin Price -->
            <div class="text-right text-xs">
              <div class="flex items-center space-x-1">
                <span v-if="bitcoinStore.isLoading" class="text-gray-400">
                  <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                </span>
                <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                  ⚠️
                </span>
                <template v-else>
                  <span class="text-orange-500">₿</span>
                  <span class="text-gray-900 dark:text-white">₩{{ (bitcoinStore.btcPriceKrw / 1000).toFixed(0) }}K</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" title="가격 정보가 오래되었습니다">
                    ⚠️
                  </span>
                </template>
              </div>
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <span class="text-lg">{{ themeStore.isDark ? '☀️' : '🌙' }}</span>
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">{{ authStore.username }}님</span>
          </div>
        </div>

        <!-- Desktop Header -->
        <div class="hidden md:flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.push('/shop')"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1 transition-colors duration-200"
            >
              <span>←</span>
              <span>상점으로 돌아가기</span>
            </button>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">상품 관리</h1>
          </div>
          <div class="flex items-center space-x-4">
            <!-- Bitcoin Price -->
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
                  <span class="text-gray-900 dark:text-white">₩{{ bitcoinStore.btcPriceKrw.toLocaleString('ko-KR') }}</span>
                  <span v-if="bitcoinStore.priceStatus === 'stale'" class="text-gray-400" title="가격 정보가 오래되었습니다">
                    ⚠️
                  </span>
                </template>
              </div>
            </div>
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              :title="themeStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
            >
              <span class="text-xl">{{ themeStore.isDark ? '☀️' : '🌙' }}</span>
            </button>
            <span class="text-gray-600 dark:text-gray-300">{{ authStore.username }}님</span>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
      <!-- User Profile Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6 mb-6 transition-colors duration-200">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">사용자 설정</h2>
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

      <!-- Add Product Button -->
      <div class="mb-4 md:mb-6">
        <button
          @click="openAddModal"
          class="w-full sm:w-auto bg-blue-600 dark:bg-blue-500 text-white px-4 md:px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center justify-center sm:justify-start space-x-2"
        >
          <span>+</span>
          <span>새 상품 추가</span>
        </button>
      </div>

      <!-- Products Section -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
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
                  <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ₩{{ Number(product.price || 0).toLocaleString('ko-KR') }}
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="text-xs font-medium text-warning-600 dark:text-warning-400">
                      {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(Number(product.price || 0))) }}
                    </div>
                    <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                      <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                    </span>
                    <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                      ⚠️
                    </span>
                    <span v-else-if="bitcoinStore.priceStatus === 'stale'" class="text-xs text-gray-400" title="비트코인 가격 정보가 오래되었습니다">
                      ⚠️
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
                  이미지
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  상품명
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  KRW 가격
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sats 가격
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  작업
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
                    ₩{{ Number(product.price || 0).toLocaleString('ko-KR') }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <div class="text-sm font-medium text-warning-600 dark:text-warning-400">
                      {{ bitcoinStore.formatSats(bitcoinStore.krwToSats(Number(product.price || 0))) }}
                    </div>
                    <span v-if="bitcoinStore.isLoading" class="text-xs text-gray-400">
                      <div class="animate-spin rounded-full h-2 w-2 border-b border-gray-400 inline-block"></div>
                    </span>
                    <span v-else-if="bitcoinStore.error" class="text-red-500" title="가격 정보를 불러올 수 없습니다">
                      ⚠️
                    </span>
                    <span v-else-if="bitcoinStore.priceStatus === 'stale'" class="text-xs text-gray-400" title="비트코인 가격 정보가 오래되었습니다">
                      ⚠️
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
                      ✏️
                    </button>
                    <button
                      @click="openDeleteModal(product)"
                      class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Product Modal -->
      <div
        v-if="showProductModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="closeProductModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-8 max-w-md w-full mx-4 transition-colors duration-200" @click.stop>
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

            <!-- Product Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                가격 (₩)
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
            </div>

            <!-- Product Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                카테고리
              </label>
              <select
                v-model="productForm.category"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
                  formErrors.category ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                ]"
              >
                <option value="">카테고리를 선택하세요</option>
                <optgroup label="기본 카테고리" v-if="categoryStore.globalCategories.length > 0">
                  <option 
                    v-for="category in categoryStore.globalCategories" 
                    :key="category.id" 
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </optgroup>
                <optgroup label="내 카테고리" v-if="categoryStore.userCategories.length > 0">
                  <option 
                    v-for="category in categoryStore.userCategories" 
                    :key="category.id" 
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </optgroup>
              </select>
              <p v-if="formErrors.category" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.category }}</p>
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
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-8 max-w-md w-full mx-4 text-center transition-colors duration-200" @click.stop>
          <div class="text-4xl md:text-6xl mb-3 md:mb-4">⚠️</div>
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
        class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all"
      >
        <div class="flex items-center space-x-2">
          <span>✅</span>
          <span>{{ successMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/products'
import { useThemeStore } from '@/stores/theme'
import { useBitcoinStore } from '@/stores/bitcoin'
import { useCategoryStore } from '@/stores/categories'
import type { Product } from '@/services/api'
import { authAPI } from '@/services/api'

const authStore = useAuthStore()
const productStore = useProductStore()
const themeStore = useThemeStore()
const bitcoinStore = useBitcoinStore()
const categoryStore = useCategoryStore()

// Initialize products and Bitcoin price when component mounts
onMounted(async () => {
  try {
    await Promise.all([
      productStore.initializeForSettings(),
      bitcoinStore.initialize(),
      categoryStore.initialize()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
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

// Product form
const productForm = reactive({
  name: '',
  price: 0,
  category: '',
  image: ''
})

// Form errors
const formErrors = reactive({
  name: '',
  price: '',
  category: '',
  image: ''
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

// Reset form
function resetForm() {
  productForm.name = ''
  productForm.price = 0
  productForm.category = ''
  productForm.image = ''
  imageError.value = false
  clearErrors()
}

// Clear form errors
function clearErrors() {
  formErrors.name = ''
  formErrors.price = ''
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
  productForm.category = product.category || ''
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
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      formErrors.image = '이미지 파일이 너무 큽니다. 최대 5MB까지 업로드 가능합니다.'
      return
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      formErrors.image = '지원되지 않는 이미지 형식입니다. JPEG, PNG, GIF, WebP만 지원합니다.'
      return
    }

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
    let result
    if (editingProduct.value) {
      // Update existing product
      result = await productStore.updateProduct(editingProduct.value.id, {
        name: productForm.name.trim(),
        price: productForm.price,
        category: productForm.category || null,
        image_url: productForm.image.trim()
      })
    } else {
      // Add new product
      result = await productStore.addProduct({
        name: productForm.name.trim(),
        price: productForm.price,
        category: productForm.category || null,
        image_url: productForm.image.trim()
      })
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