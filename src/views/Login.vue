<template>
  <div class="min-h-screen flex items-center justify-center gradient-primary px-4 py-8">
    <div class="card p-6 xs:p-8 w-full max-w-md mx-4 tablet:max-w-lg tablet:p-10 animate-fade-in">
      <div class="text-center mb-6 tablet:mb-8">
        <h1 class="text-2xl xs:text-3xl tablet:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">한입 POS</h1>
        <p class="text-sm xs:text-base text-gray-600 dark:text-gray-400">환영합니다! 계속하려면 로그인해주세요</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-4 tablet:space-y-6">
        <div>
          <label for="username" class="block text-sm tablet:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
            사용자명
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="input text-sm xs:text-base"
            placeholder="사용자명을 입력하세요"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm tablet:text-base font-medium text-gray-700 dark:text-gray-200 mb-2">
            비밀번호
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="input text-sm xs:text-base"
            placeholder="비밀번호를 입력하세요"
          />
        </div>
        
        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-xl">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn btn-primary w-full py-2 xs:py-3 tablet:py-4 text-base xs:text-lg tablet:text-xl"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>로그인 중...</span>
          </span>
          <span v-else>로그인</span>
        </button>
      </form>
      
      <div class="mt-4 xs:mt-6 text-center space-y-2">
        <p class="text-xs xs:text-sm text-gray-500 dark:text-gray-400">
          데모 계정: admin / password
        </p>
        <p class="text-xs xs:text-sm text-gray-600 dark:text-gray-300">
          계정이 없으신가요? 
          <button
            @click="$router.push('/register')"
            class="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline font-medium transition-colors"
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleLogin() {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = '사용자명과 비밀번호를 모두 입력해주세요'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.login(username.value.trim(), password.value)
    
    if (result.success) {
      // Initialize cart after successful login
      const cartStore = useCartStore()
      await cartStore.initialize()
      
      // Small delay to ensure token is fully set in axios instance
      await new Promise(resolve => setTimeout(resolve, 100))
      
      router.push('/shop')
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>