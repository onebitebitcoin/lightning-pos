import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, csrfAPI, TokenManager, type User } from '@/services/api'
import { useCartStore } from '@/stores/cart'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Session storage key for user data
  const USER_STORAGE_KEY = 'auth_user'

  // Computed properties
  const isLoggedIn = computed(() => !!user.value && TokenManager.hasToken())
  const username = computed(() => user.value?.username || '')
  const isAdmin = computed(() => user.value?.is_kiosk_admin || false)

  // Save user to localStorage
  function saveUserToStorage(userData: User) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
  }

  // Load user from localStorage
  function loadUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('저장소에서 사용자 로드 오류:', error)
      return null
    }
  }

  // Clear user from localStorage
  function clearUserFromStorage() {
    localStorage.removeItem(USER_STORAGE_KEY)
  }

  // Initialize auth state
  async function initialize() {
    // Always fetch CSRF token on app start
    try {
      await csrfAPI.getCSRFToken()
    } catch (error) {
      console.error('CSRF 토큰 가져오기 실패:', error)
    }

    if (TokenManager.hasToken()) {
      // First try to load user from localStorage for instant login
      const storedUser = loadUserFromStorage()
      if (storedUser) {
        user.value = storedUser
      }

      try {
        // Then verify with server and update if needed
        await getProfile()
      } catch (error) {
        console.error('인증 초기화 실패:', error)
        logout()
      }
    }
  }

  // Register new user
  async function register(userData: {
    username: string
    email: string
    password: string
    password_confirm: string
    lightning_address: string
  }): Promise<{ success: boolean; message: string; errors?: any }> {
    isLoading.value = true
    error.value = null

    try {
      const result = await authAPI.register(userData)
      
      if (result.success && result.user) {
        user.value = result.user
        saveUserToStorage(result.user)
      }
      
      return result
    } catch (err: any) {
      error.value = err.message || '회원가입 중 오류가 발생했습니다'
      return { success: false, message: error.value || '회원가입 중 오류가 발생했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Login function
  async function login(userInput: string, password: string): Promise<{ success: boolean; message: string }> {
    isLoading.value = true
    error.value = null

    try {
      // Try demo login first for admin/password
      let result
      result = await authAPI.login({ username: userInput, password })

      if (result.success && result.user) {
        user.value = result.user
        saveUserToStorage(result.user)
      } else {
        error.value = result.message
      }

      return result
    } catch (err: any) {
      error.value = err.message || '로그인 중 오류가 발생했습니다'
      return { success: false, message: error.value || '로그인 중 오류가 발생했습니다' }
    } finally {
      isLoading.value = false
    }
  }

  // Logout function
  async function logout() {
    isLoading.value = true
    
    try {
      // Clear cart before invalidating the auth token
      try {
        const cartStore = useCartStore()
        await cartStore.clearCart()
      } catch (e) {
        console.warn('장바구니 비우기 실패(무시):', e)
      }
      await authAPI.logout()
    } catch (error) {
      console.error('로그아웃 오류:', error)
    } finally {
      // Ensure cart is cleared locally regardless of API result
      try {
        const cartStore = useCartStore()
        cartStore.resetLocal()
      } catch {}
      user.value = null
      error.value = null
      isLoading.value = false
      clearUserFromStorage()
    }
  }

  // Get user profile
  async function getProfile(): Promise<void> {
    if (!TokenManager.hasToken()) {
      return
    }

    try {
      const result = await authAPI.getProfile()
      if (result.success && result.user) {
        user.value = result.user
        saveUserToStorage(result.user)
      } else {
        throw new Error(result.message || '프로필을 가져오지 못했습니다')
      }
    } catch (err: any) {
      console.error('프로필 가져오기 오류:', err)
      throw err
    }
  }

  // Update user data
  function updateUser(userData: User) {
    user.value = userData
    saveUserToStorage(userData)
  }

  // Clear error
  function clearError() {
    error.value = null
  }

  return { 
    // State
    user,
    isLoading,
    error,
    
    // Computed
    isLoggedIn, 
    username,
    isAdmin,
    
    // Actions
    initialize,
    login, 
    logout, 
    register,
    getProfile,
    updateUser,
    clearError
  }
})
