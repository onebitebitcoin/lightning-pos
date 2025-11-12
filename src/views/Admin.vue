<template>
  <div class="min-h-screen bg-bg-secondary transition-colors duration-200">
    <!-- Header -->
    <header class="glass-header transition-colors duration-200">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <!-- Left side -->
          <div class="flex items-center space-x-2 sm:space-x-4">
            <button
              @click="$router.push('/shop')"
              class="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors duration-200"
              title="상점으로 돌아가기"
            >
              <UiIcon name="arrowLeft" class="h-5 w-5" />
            </button>
            <div class="flex items-center space-x-2">
              <h1 class="text-lg sm:text-2xl font-bold text-text-primary">
                <span class="hidden sm:inline">관리자 패널</span>
                <span class="sm:hidden">관리자</span>
              </h1>
            </div>
          </div>
          
          <!-- Right side -->
          <div class="flex items-center space-x-2">
            <button
              @click="themeStore.toggleTheme"
              class="p-2 rounded-lg hover:bg-bg-tertiary transition-colors duration-200"
              :title="themeStore.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
            >
              <UiIcon :name="themeStore.isDark ? 'sun' : 'moon'" class="h-5 w-5" />
            </button>
            
            <!-- User info - responsive -->
            <div class="flex items-center space-x-1 sm:space-x-2">
              <span class="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                <span class="hidden sm:inline">관리자: {{ authStore.username }}님</span>
                <span class="sm:hidden">{{ authStore.username }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
      <!-- User Detail Modal -->
      <div
        v-if="showUserDetail && selectedUser"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="closeUserDetail"
      >
        <div 
          class="card max-w-4xl w-full max-h-[90vh] overflow-hidden transition-colors duration-200"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {{ selectedUser.username }} 사용자 상세 정보
            </h2>
            <button
              @click="closeUserDetail"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <UiIcon name="close" class="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div class="overflow-y-auto max-h-[calc(90vh-120px)]">
            <!-- User Info -->
            <div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">사용자 정보</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-3">
                  <div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">사용자명:</span>
                    <div class="text-gray-900 dark:text-white">{{ selectedUser.username }}</div>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">이메일:</span>
                    <div class="text-gray-900 dark:text-white">{{ selectedUser.email }}</div>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">라이트닝 주소:</span>
                    <div class="text-gray-900 dark:text-white font-mono text-sm">
                      {{ selectedUser.lightning_address || '설정되지 않음' }}
                    </div>
                  </div>
                </div>
                <div class="space-y-3">
                  <div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">가입일:</span>
                    <div class="text-gray-900 dark:text-white">{{ formatDate(selectedUser.created_at) }}</div>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">관리자 권한:</span>
                    <div class="text-gray-900 dark:text-white">
                      {{ selectedUser.is_kiosk_admin ? '예' : '아니오' }}
                    </div>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400">상품 수:</span>
                    <div class="text-gray-900 dark:text-white">{{ userProducts.length }}개</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- User Products -->
            <div class="p-4 md:p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">상품 목록</h3>
              
              <div v-if="isLoadingUserDetail" class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
                <p class="text-gray-500 dark:text-gray-400 text-sm">상품 목록 로딩 중...</p>
              </div>

              <div v-else-if="userProducts.length === 0" class="text-center py-8">
                <div class="text-gray-400 dark:text-gray-500 text-4xl mb-2 flex justify-center">
                  <UiIcon name="box" class="h-10 w-10" />
                </div>
                <p class="text-gray-500 dark:text-gray-400">등록된 상품이 없습니다</p>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="product in userProducts"
                  :key="product.id"
                  class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors duration-200"
                >
                  <div class="flex items-start space-x-3">
                    <img
                      :src="product.image_url"
                      :alt="product.name"
                      class="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      @error="handleImageError"
                    />
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {{ product.name }}
                      </h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">
                        ₩{{ Number(product.price).toLocaleString('ko-KR') }}
                      </p>
                      <p v-if="product.category_name" class="text-xs text-blue-600 dark:text-blue-400">
                        {{ product.category_name }}
                      </p>
                      <div class="flex items-center space-x-2 mt-1">
                        <span :class="[
                          'text-xs px-2 py-1 rounded-full',
                          product.is_available 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        ]">
                          {{ product.is_available ? '판매중' : '품절' }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                          재고: {{ product.stock_quantity }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Users List -->
      <div class="card overflow-hidden transition-colors duration-200">
        <div class="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">
              사용자 목록
            </h2>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                총 {{ users.length }}명
              </span>
              <button
                @click="fetchUsers"
                :disabled="isLoading"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="새로고침"
              >
                <UiIcon name="refresh" class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
          <p class="text-gray-500 dark:text-gray-400">사용자 목록을 불러오는 중...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-8 text-center">
          <div class="text-red-500 dark:text-red-400 mb-4 flex justify-center">
            <UiIcon name="warning" class="h-8 w-8" />
          </div>
          <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
          <button
            @click="fetchUsers"
            class="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            다시 시도
          </button>
        </div>

        <!-- Users Cards -->
        <div v-else class="space-y-4">
          <div
            v-for="user in users"
            :key="user.id"
            class="glass-panel rounded-2xl p-4 hover:shadow-medium transition-all duration-200"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <!-- User Info -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ user.username }}
                  </h3>
                  <span v-if="user.is_kiosk_admin" class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                    관리자
                  </span>
                </div>
                
                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <div class="flex items-start gap-2">
                    <span class="font-medium min-w-0 flex-shrink-0">이메일:</span>
                    <span class="break-all">{{ user.email }}</span>
                  </div>
                  
                  <div class="flex items-start gap-2">
                    <span class="font-medium min-w-0 flex-shrink-0">라이트닝:</span>
                    <span class="font-mono text-xs break-all">{{ user.lightning_address || '설정되지 않음' }}</span>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">상품:</span>
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {{ user.product_count }}개
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">가입:</span>
                      <span>{{ formatDate(user.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 sm:flex-col sm:gap-1">
                <button
                  @click="viewUserDetail(user)"
                  class="flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                  title="상세 보기"
                >
                  <UiIcon name="eye" class="h-5 w-5 mr-1" />
                  <span class="hidden sm:inline">상세</span>
                </button>
                <button
                  @click="deleteUser(user)"
                  :disabled="user.id === authStore.user?.id || isDeletingUser"
                  class="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="사용자 삭제"
                >
                  <UiIcon name="trash" class="h-5 w-5 mr-1" />
                  <span class="hidden sm:inline">삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { adminAPI, type User } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// Check if user is admin
if (!authStore.isAdmin) {
  router.push('/shop')
}

// State
const users = ref<(User & { product_count: number })[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// User detail modal
const showUserDetail = ref(false)
const selectedUser = ref<User | null>(null)
const userProducts = ref<any[]>([])
const isLoadingUserDetail = ref(false)

// Delete user state
const isDeletingUser = ref(false)

// Initialize
onMounted(async () => {
  await fetchUsers()
})

// Fetch users list
async function fetchUsers() {
  isLoading.value = true
  error.value = null

  try {
    const result = await adminAPI.getUsersList()
    if (result.success) {
      users.value = result.users
    } else {
      error.value = result.message || '사용자 목록을 불러오는데 실패했습니다'
    }
  } catch (err: any) {
    error.value = err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다'
    console.error('사용자 목록 가져오기 오류:', err)
  } finally {
    isLoading.value = false
  }
}

// View user detail
async function viewUserDetail(user: User & { product_count: number }) {
  selectedUser.value = user
  showUserDetail.value = true
  isLoadingUserDetail.value = true

  try {
    const result = await adminAPI.getUserDetail(user.id)
    if (result.success) {
      userProducts.value = result.products || []
    } else {
      console.error('사용자 상세 로드 실패:', result.message)
      userProducts.value = []
    }
  } catch (error) {
    console.error('사용자 상세 불러오기 오류:', error)
    userProducts.value = []
  } finally {
    isLoadingUserDetail.value = false
  }
}

// Close user detail modal
function closeUserDetail() {
  showUserDetail.value = false
  selectedUser.value = null
  userProducts.value = []
}

// Delete user
async function deleteUser(user: User & { product_count: number }) {
  // Prevent self-deletion
  if (user.id === authStore.user?.id) {
    alert('자기 자신을 삭제할 수 없습니다')
    return
  }

  // Confirmation dialog
  const confirmMessage = `"${user.username}" 사용자를 정말로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 해당 사용자의 모든 상품과 데이터가 함께 삭제됩니다.`
  if (!confirm(confirmMessage)) {
    return
  }

  isDeletingUser.value = true

  try {
    const result = await adminAPI.deleteUser(user.id)
    if (result.success) {
      alert(result.message)
      // Remove user from local list
      users.value = users.value.filter(u => u.id !== user.id)
      // Close detail modal if it's open for this user
      if (selectedUser.value?.id === user.id) {
        closeUserDetail()
      }
    } else {
      alert(result.message || '사용자 삭제에 실패했습니다')
    }
  } catch (error) {
    console.error('사용자 삭제 오류:', error)
    alert('사용자 삭제 중 오류가 발생했습니다')
  } finally {
    isDeletingUser.value = false
  }
}

// Handle image loading error
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  
  // Prevent infinite error loops
  if (img.dataset.errorHandled === 'true') {
    return
  }
  
  img.dataset.errorHandled = 'true'
  img.onerror = null
  
  // Use fallback image
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2YjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7snbTrr7jsp4A8L3RleHQ+Cjwvc3ZnPgo='
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
