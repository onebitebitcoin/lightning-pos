<template>
  <div class="min-h-screen flex items-center justify-center bg-bg-secondary px-4 py-8">
    <div class="card p-6 xs:p-8 w-full max-w-md mx-4 tablet:max-w-lg tablet:p-10 animate-fade-in">
      <div class="text-center mb-6 tablet:mb-8">
        <h1 class="text-2xl xs:text-3xl tablet:text-4xl font-bold text-text-primary mb-2">계정 생성</h1>
        <p class="text-sm xs:text-base text-text-secondary">한입 POS에 오신 것을 환영합니다</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="space-y-4 tablet:space-y-6">
        <!-- Username Field -->
        <div>
          <label for="username" class="block text-sm font-medium text-text-secondary mb-2">
            사용자명 *
          </label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            required
            :class="[
              'form-input',
              formErrors.username ? 'ring-2 ring-error-500 border-transparent' : ''
            ]"
            placeholder="사용자명을 입력하세요"
          />
          <p v-if="formErrors.username" class="text-red-500 text-sm mt-1">{{ formErrors.username }}</p>
        </div>

        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-text-secondary mb-2">
            이메일 *
          </label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            :class="[
              'form-input',
              formErrors.email ? 'ring-2 ring-error-500 border-transparent' : ''
            ]"
            placeholder="이메일을 입력하세요"
          />
          <p v-if="formErrors.email" class="text-error-600 text-sm mt-1">{{ formErrors.email }}</p>
        </div>
        
        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-text-secondary mb-2">
            비밀번호 *
          </label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            :class="[
              'form-input',
              formErrors.password ? 'ring-2 ring-error-500 border-transparent' : ''
            ]"
            placeholder="비밀번호를 입력하세요"
          />
          <p v-if="formErrors.password" class="text-error-600 text-sm mt-1">{{ formErrors.password }}</p>
          <p class="text-xs text-text-secondary mt-1">최소 6자 이상, 영문과 숫자를 포함해주세요</p>
        </div>

        <!-- Confirm Password Field -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-text-secondary mb-2">
            비밀번호 확인 *
          </label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            required
            :class="[
              'form-input',
              formErrors.confirmPassword ? 'ring-2 ring-error-500 border-transparent' : ''
            ]"
            placeholder="비밀번호를 다시 입력하세요"
          />
          <p v-if="formErrors.confirmPassword" class="text-error-600 text-sm mt-1">{{ formErrors.confirmPassword }}</p>
        </div>

        <!-- Terms and Conditions -->
        <div class="flex items-start space-x-2">
          <input
            id="agreeTerms"
            v-model="formData.agreeTerms"
            type="checkbox"
            required
            class="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label for="agreeTerms" class="text-sm text-text-secondary">
            <span class="text-error-400">*</span> 
            <span class="underline cursor-pointer hover:text-primary-500">이용약관</span>과 
            <span class="underline cursor-pointer hover:text-primary-500">개인정보 처리방침</span>에 동의합니다
          </label>
        </div>
        <p v-if="formErrors.agreeTerms" class="text-error-600 text-sm">{{ formErrors.agreeTerms }}</p>
        
        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn btn-primary w-full py-3 px-4 focus:ring-offset-2 text-lg"
        >
          <span v-if="isSubmitting">계정 생성 중...</span>
          <span v-else>계정 생성</span>
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-text-secondary">
          이미 계정이 있으신가요? 
          <button
            @click="$router.push('/login')"
            class="text-primary-600 hover:text-primary-700 underline font-medium"
          >
            로그인
          </button>
        </p>
      </div>

      <!-- Success Modal -->
      <div
        v-if="showSuccess"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div class="text-6xl mb-4">🎉</div>
          <h3 class="text-2xl font-semibold text-gray-800 mb-2">계정 생성 완료!</h3>
          <p class="text-gray-600 mb-6">{{ successMessage }}</p>
          <button
            @click="goToLogin"
            class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isSubmitting = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')

// Form data
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// Form errors
const formErrors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: ''
})

// Clear form errors
function clearErrors() {
  formErrors.username = ''
  formErrors.email = ''
  formErrors.password = ''
  formErrors.confirmPassword = ''
  formErrors.agreeTerms = ''
}

// Validate form
function validateForm(): boolean {
  clearErrors()
  let isValid = true

  // Validate username
  if (!formData.username.trim()) {
    formErrors.username = '사용자명을 입력해주세요'
    isValid = false
  } else if (formData.username.trim().length < 3) {
    formErrors.username = '사용자명은 3글자 이상이어야 합니다'
    isValid = false
  } else if (!/^[a-zA-Z0-9가-힣_]+$/.test(formData.username.trim())) {
    formErrors.username = '사용자명은 영문, 한글, 숫자, 언더스코어만 사용 가능합니다'
    isValid = false
  }

  // Validate email
  if (!formData.email.trim()) {
    formErrors.email = '이메일을 입력해주세요'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    formErrors.email = '올바른 이메일 형식이 아닙니다'
    isValid = false
  }

  // Validate password
  if (!formData.password) {
    formErrors.password = '비밀번호를 입력해주세요'
    isValid = false
  } else if (formData.password.length < 6) {
    formErrors.password = '비밀번호는 6글자 이상이어야 합니다'
    isValid = false
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
    formErrors.password = '비밀번호는 영문과 숫자를 포함해야 합니다'
    isValid = false
  }

  // Validate confirm password
  if (!formData.confirmPassword) {
    formErrors.confirmPassword = '비밀번호 확인을 입력해주세요'
    isValid = false
  } else if (formData.password !== formData.confirmPassword) {
    formErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    isValid = false
  }

  // Validate terms agreement
  if (!formData.agreeTerms) {
    formErrors.agreeTerms = '이용약관과 개인정보 처리방침에 동의해주세요'
    isValid = false
  }

  return isValid
}

// Handle registration
async function handleRegister() {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const result = await authStore.register({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      password_confirm: formData.confirmPassword
    })

    if (result.success) {
      successMessage.value = result.message
      showSuccess.value = true
    } else {
      // Handle validation errors
      if (result.errors) {
        const firstError = Object.values(result.errors)[0]
        if (Array.isArray(firstError)) {
          alert(firstError[0])
        } else {
          alert(result.message)
        }
      } else {
        alert(result.message)
      }
    }
  } catch (error) {
    console.error('회원가입 오류:', error)
    alert('계정 생성 중 오류가 발생했습니다. 다시 시도해주세요.')
  } finally {
    isSubmitting.value = false
  }
}

// Go to login page
function goToLogin() {
  showSuccess.value = false
  router.push('/login')
}
</script>
