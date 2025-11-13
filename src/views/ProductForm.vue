<template>
  <div class="min-h-screen bg-bg-secondary transition-colors duration-200">
    <header class="glass-header transition-colors duration-200 sticky top-0 z-20">
      <div class="mx-auto w-full max-w-5xl px-4 py-3 md:py-4 flex items-center justify-between">
        <button
          @click="router.push('/settings')"
          class="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <UiIcon name="arrowLeft" class="h-5 w-5" />
          <span class="hidden sm:inline">{{ t('settings.backToShop', '상점으로 돌아가기') }}</span>
          <span class="sm:hidden">{{ t('common.close', '닫기') }}</span>
        </button>
        <div class="flex items-center space-x-3">
          <span class="text-sm text-text-secondary hidden sm:inline">{{ authStore.username }}님</span>
          <button
            @click="themeStore.toggleTheme"
            class="p-2 rounded-xl hover:bg-bg-tertiary transition-colors"
            :title="themeStore.isDark ? t('settings.theme.switchLight', '라이트 모드로 전환') : t('settings.theme.switchDark', '다크 모드로 전환')"
          >
            <UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" class="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

    <div class="px-4 py-6 md:py-10 flex justify-center">
      <div class="w-full max-w-3xl">
        <div class="flex items-center justify-between mb-6">
          <div>
            <p class="text-sm text-text-secondary">{{ subLabel }}</p>
            <h1 class="text-2xl font-bold text-text-primary">{{ headerLabel }}</h1>
          </div>
        </div>

        <div
          v-if="loadError"
          class="mb-4 rounded-2xl border border-red-300/60 bg-red-50/80 dark:border-red-500/40 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200"
        >
          {{ loadError }}
        </div>

        <div
          v-else-if="isEditMode && isInitializing"
          class="bg-bg-primary/60 border border-border-secondary rounded-2xl p-8 shadow-soft text-center"
        >
          <div class="flex flex-col items-center space-y-4">
            <div class="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent"></div>
            <p class="text-text-secondary">{{ t('settings.products.loading', '상품 정보를 불러오는 중입니다...') }}</p>
          </div>
        </div>

        <form
          v-else
          @submit.prevent="saveProduct"
          class="space-y-5 bg-bg-primary/60 border border-border-secondary rounded-2xl p-4 md:p-6 shadow-soft"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('settings.product.title', '상품명') }}
            </label>
            <input
              v-model="productForm.name"
              type="text"
              required
              :class="inputClasses(formErrors.name)"
              :placeholder="t('settings.product.titlePlaceholder', '상품명을 입력하세요')"
            />
            <p v-if="formErrors.name" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.name }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                :class="inputClasses(formErrors.regularPrice)"
                :placeholder="t('settings.product.regularPrice', '정가')"
              />
              <p v-if="formErrors.regularPrice" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.regularPrice }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('settings.product.discountHint', '정가보다 낮은 판매 가격을 입력하면 자동으로 할인율이 계산됩니다.') }}
              </p>
            </div>

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
                :class="inputClasses(formErrors.price)"
                placeholder="0"
              />
              <p v-if="formErrors.price" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.price }}</p>
              <p v-if="formDiscountPercent > 0" class="text-xs text-success-600 dark:text-success-400 mt-1">
                {{ t('settings.product.discountPreview', '{percent}% 할인 적용 예정', { percent: formDiscountPercent }) }}
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('settings.product.description', '상품 설명') }}
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('settings.product.descriptionOptional', '선택 사항') }}</span>
            </label>
            <textarea
              v-model="productForm.description"
              rows="3"
              :placeholder="t('settings.product.descriptionPlaceholder', '상품에 대한 설명을 입력하세요 (선택)')"
              :class="textareaClasses(formErrors.description)"
              maxlength="500"
            ></textarea>
            <p v-if="formErrors.description" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.description }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('settings.product.category', '카테고리') }}
            </label>
            <input
              v-model="productForm.categoryName"
              type="text"
              :class="inputClasses(formErrors.category)"
              :placeholder="t('settings.product.categoryPlaceholder', '카테고리 이름을 입력하세요 (예: 음료수, 스낵, 과자 등)')"
              maxlength="50"
            />
            <p v-if="formErrors.category" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.category }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t('settings.product.categoryHint', '새로운 카테고리를 입력하거나 기존 카테고리 이름을 사용하세요') }}
            </p>

            <div v-if="allCategoryNames.length" class="mt-2">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('settings.product.categoryExisting', '기존 카테고리:') }}</p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="categoryName in allCategoryNames"
                  :key="categoryName"
                  type="button"
                  class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  @click="productForm.categoryName = categoryName"
                >
                  {{ categoryName }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('settings.product.image', '이미지 URL') }}
            </label>
            <input
              v-model="productForm.image"
              type="url"
              required
              :class="inputClasses(formErrors.image)"
              :placeholder="t('settings.product.imagePlaceholder', 'https://example.com/image.jpg')"
            />
            <p v-if="formErrors.image" class="text-red-500 dark:text-red-400 text-sm mt-1">{{ formErrors.image }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t('settings.product.imageHint', '이미지 URL을 입력하거나 아래에서 파일을 선택하세요') }}
            </p>
          </div>

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

          <div v-if="productForm.image" class="mt-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('settings.product.preview', '미리보기') }}
            </label>
            <img
              :src="productForm.image"
              :alt="productForm.name"
              class="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              @error="handleImageError"
            />
            <p v-if="imageError" class="text-xs text-red-500 dark:text-red-400 mt-1">
              {{ t('settings.product.imageError', '이미지를 불러올 수 없습니다. URL을 확인해주세요.') }}
            </p>
          </div>

          <div class="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0 pt-4">
            <button
              type="submit"
              :disabled="isSubmitting"
              :class="[
                'w-full sm:w-auto px-4 py-2 rounded-lg text-white flex items-center justify-center space-x-2',
                isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              ]"
            >
              <span v-if="isSubmitting" class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{{ t('settings.modal.processing', '처리 중...') }}</span>
              </span>
              <span v-else>{{ submitLabel }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="showSuccess"
        class="fixed bottom-6 right-6 bg-primary-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2"
      >
        <UiIcon name="checkCircle" class="h-5 w-5" />
        <span>{{ successMessage }}</span>
      </div>
    </transition>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useLocaleStore } from '@/stores/locale'
import { useProductStore } from '@/stores/products'
import { useCategoryStore } from '@/stores/categories'
import { useFiatCurrencyStore } from '@/stores/fiatCurrency'
import type { FiatCurrency } from '@/services/bitcoin'
import type { Product } from '@/services/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()
const productStore = useProductStore()
const categoryStore = useCategoryStore()
const fiatCurrencyStore = useFiatCurrencyStore()
const t = localeStore.t

const { selectedCurrency } = storeToRefs(fiatCurrencyStore)
const selectedFiatCurrency = computed<FiatCurrency>({
  get: () => selectedCurrency.value,
  set: value => fiatCurrencyStore.setCurrency(value)
})

const currencySymbols = fiatCurrencyStore.currencySymbols

const isEditMode = computed(() => route.name === 'product-edit')
const productId = computed(() => {
  const rawId = route.params.id
  const normalized = Array.isArray(rawId) ? rawId[0] : rawId
  const parsed = normalized ? Number(normalized) : null
  return Number.isFinite(parsed) ? parsed : null
})

const productForm = reactive({
  name: '',
  price: 0,
  regularPrice: 0,
  description: '',
  categoryName: '',
  image: ''
})

const formErrors = reactive({
  name: '',
  price: '',
  regularPrice: '',
  description: '',
  category: '',
  image: ''
})

const selectedFile = ref<File | null>(null)
const imageError = ref(false)
const isSubmitting = ref(false)
const isInitializing = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')
const loadError = ref<string | null>(null)

const formDiscountPercent = computed(() => {
  const regular = Number(productForm.regularPrice)
  const sale = Number(productForm.price)
  if (!regular || regular <= 0 || sale <= 0 || regular <= sale) {
    return 0
  }
  return Math.round(((regular - sale) / regular) * 100)
})

const headerLabel = computed(() =>
  isEditMode.value ? t('settings.modal.editTitle', '상품 수정') : t('settings.modal.addTitle', '새 상품 추가')
)
const subLabel = computed(() =>
  isEditMode.value ? t('settings.modal.editTitle', '상품 수정') : t('settings.newProduct', '새 상품 추가')
)
const submitLabel = computed(() =>
  isEditMode.value ? t('settings.modal.save', '저장') : t('settings.modal.add', '추가')
)

const allCategoryNames = computed(() => {
  const globalNames = categoryStore.globalCategories.map(cat => cat.name)
  const userNames = categoryStore.userCategories.map(cat => cat.name)
  return [...new Set([...globalNames, ...userNames])].sort()
})

onMounted(async () => {
  try {
    await Promise.all([categoryStore.initialize(), productStore.initializeForSettings()])
    if (isEditMode.value) {
      await loadProductForEdit()
    } else {
      resetForm()
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }
})

watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    if (newPath === oldPath) return
    loadError.value = null
    resetForm()
    if (isEditMode.value) {
      await loadProductForEdit()
    }
  }
)

watch(() => productForm.image, () => {
  imageError.value = false
})

watch(() => productForm.price, value => {
  if (!productForm.regularPrice) {
    productForm.regularPrice = value
  }
})

function inputClasses(error?: string) {
  return [
    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200',
    error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
  ]
}

function textareaClasses(error?: string) {
  return [
    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 resize-none',
    error ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
  ]
}

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

function clearErrors() {
  formErrors.name = ''
  formErrors.price = ''
  formErrors.regularPrice = ''
  formErrors.description = ''
  formErrors.category = ''
  formErrors.image = ''
}

function validateForm() {
  clearErrors()
  let isValid = true

  if (!productForm.name.trim()) {
    formErrors.name = t('settings.error.nameRequired', '상품명을 입력해주세요')
    isValid = false
  } else if (productForm.name.trim().length < 2) {
    formErrors.name = t('settings.error.nameTooShort', '상품명은 2글자 이상이어야 합니다')
    isValid = false
  }

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

  if (!productForm.image.trim()) {
    formErrors.image = t('settings.error.imageRequired', '이미지 URL을 입력하거나 파일을 업로드해주세요')
    isValid = false
  }

  return isValid
}

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    formErrors.image = '이미지 파일이 너무 큽니다. 최대 10MB까지 업로드 가능합니다.'
    return
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    formErrors.image = '지원되지 않는 이미지 형식입니다. JPEG, PNG, GIF, WebP만 지원합니다.'
    return
  }

  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = e => {
    productForm.image = (e.target?.result as string) || ''
    formErrors.image = ''
    imageError.value = false
  }
  reader.onerror = () => {
    formErrors.image = '이미지 파일을 읽는 중 오류가 발생했습니다.'
  }
  reader.readAsDataURL(file)
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.dataset.errorHandled === 'true') return
  img.dataset.errorHandled = 'true'
  imageError.value = true
  img.src =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+PC9zdmc+'
}

function showSuccessToast(message: string) {
  successMessage.value = message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
    successMessage.value = ''
  }, 2500)
}

async function findOrCreateCategory(categoryName: string) {
  if (!categoryName.trim()) {
    return null
  }

  const trimmedName = categoryName.trim()
  const existingCategory = categoryStore.categories.find(
    cat => cat.name.toLowerCase() === trimmedName.toLowerCase()
  )
  if (existingCategory) {
    return existingCategory.id
  }

  try {
    const result = await categoryStore.addCategory({ name: trimmedName })
    if (result.success && result.category) {
      return result.category.id
    }
  } catch (error) {
    console.error('카테고리 생성 오류:', error)
  }

  return null
}

async function loadProductForEdit() {
  if (!productId.value) {
    loadError.value = t('settings.error.productLoadFailed', '상품 정보를 불러올 수 없습니다.')
    router.push('/settings')
    return
  }

  isInitializing.value = true
  try {
    let product: Product | null = productStore.getProduct(productId.value) ?? null
    if (!product) {
      product = await productStore.fetchProduct(productId.value)
    }

    if (!product) {
      loadError.value = t('settings.error.productLoadFailed', '상품 정보를 불러올 수 없습니다.')
      setTimeout(() => router.push('/settings'), 1200)
      return
    }

    fillForm(product)
  } catch (error) {
    console.error('상품 로드 실패:', error)
    loadError.value = t('settings.error.productLoadFailed', '상품 정보를 불러올 수 없습니다.')
    setTimeout(() => router.push('/settings'), 1200)
  } finally {
    isInitializing.value = false
  }
}

function fillForm(product: Product) {
  productForm.name = product.name
  productForm.price = Number(product.price) || 0
  productForm.regularPrice = Number(product.regular_price ?? product.price ?? 0)
  productForm.description = product.description || ''
  productForm.categoryName = product.category_name || ''
  productForm.image = product.image || product.image_url || ''
}

async function saveProduct() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const categoryId = await findOrCreateCategory(productForm.categoryName)
    const regularPriceValue =
      productForm.regularPrice && productForm.regularPrice > 0 ? productForm.regularPrice : null
    const descriptionValue = productForm.description.trim() || undefined

    let result
    if (isEditMode.value && productId.value) {
      result = await productStore.updateProduct(productId.value, {
        name: productForm.name.trim(),
        price: productForm.price,
        regular_price: regularPriceValue,
        description: descriptionValue,
        category: categoryId ?? undefined,
        image_url: productForm.image.trim()
      })
    } else if (selectedFile.value) {
      result = await productStore.addProductWithFile(
        {
          name: productForm.name.trim(),
          price: productForm.price,
          regular_price: regularPriceValue,
          description: descriptionValue,
          category: categoryId ?? undefined,
          stock_quantity: 100,
          is_available: true
        },
        selectedFile.value
      )
    } else {
      result = await productStore.addProduct({
        name: productForm.name.trim(),
        price: productForm.price,
        regular_price: regularPriceValue,
        description: descriptionValue,
        category: categoryId ?? undefined,
        image_url: productForm.image.trim()
      })
    }

    if (result.success) {
      const successKey = isEditMode.value
        ? 'settings.success.productUpdated'
        : 'settings.success.productAdded'
      showSuccessToast(t(successKey, isEditMode.value ? '상품이 성공적으로 수정되었습니다' : '새 상품이 성공적으로 추가되었습니다'))
      setTimeout(() => {
        router.push('/settings')
      }, 1200)
    } else if (result.message) {
      showSuccessToast(result.message)
    }
  } catch (error) {
    console.error('상품 저장 실패:', error)
    const errorKey = isEditMode.value ? 'settings.error.productUpdateFailed' : 'settings.error.productAddFailed'
    showSuccessToast(t(errorKey, '오류가 발생했습니다. 다시 시도해주세요'))
  } finally {
    isSubmitting.value = false
  }
}
</script>
