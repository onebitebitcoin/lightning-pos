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

        <!-- Lightning Address Field (required) -->
        <div>
          <label for="lightning_address" class="block text-sm font-medium text-text-secondary mb-2">
            라이트닝 지갑 주소 *
          </label>
          <input
            id="lightning_address"
            v-model="formData.lightning_address"
            type="text"
            required
            :class="[
              'form-input',
              formErrors.lightning_address ? 'ring-2 ring-error-500 border-transparent' : ''
            ]"
            placeholder="예: name@walletofsatoshi.com"
          />
          <p v-if="formErrors.lightning_address" class="text-error-600 text-sm mt-1">{{ formErrors.lightning_address }}</p>
          <p class="text-xs text-text-secondary mt-1">라이트닝 주소는 이메일과 같은 형식입니다.</p>
          <button type="button" @click="showWalletGuide = true" class="text-xs underline font-medium mt-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            지원 지갑 가이드 보기
          </button>
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
            <router-link to="/terms" class="underline text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">이용약관</router-link>
            과
            <router-link to="/privacy" class="underline text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">개인정보 처리방침</router-link>
            에 동의합니다
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

      <!-- Wallet Guide Modal -->
      <div
        v-if="showWalletGuide"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="rounded-xl p-6 md:p-8 max-w-2xl w-full mx-4 bg-bg-primary text-text-primary border border-border-primary">
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-xl md:text-2xl font-semibold text-text-primary">라이트닝 지갑 설정 가이드</h3>
            <button @click="showWalletGuide = false" aria-label="닫기" class="text-text-secondary hover:text-text-primary">✕</button>
          </div>

          <!-- Tabs -->
          <div class="flex gap-2 mb-4">
            <button
              class="px-3 py-1.5 rounded-md text-sm border"
              :class="activeWallet === 'wos' ? 'bg-primary-600 text-white border-primary-600' : 'bg-bg-primary text-text-secondary border-border-secondary'"
              @click="activeWallet = 'wos'"
            >Wallet of Satoshi</button>
            <button
              class="px-3 py-1.5 rounded-md text-sm border"
              :class="activeWallet === 'strike' ? 'bg-primary-600 text-white border-primary-600' : 'bg-bg-primary text-text-secondary border-border-secondary'"
              @click="activeWallet = 'strike'"
            >Strike</button>
            <button
              class="px-3 py-1.5 rounded-md text-sm border"
              :class="activeWallet === 'coinos' ? 'bg-primary-600 text-white border-primary-600' : 'bg-bg-primary text-text-secondary border-border-secondary'"
              @click="activeWallet = 'coinos'"
            >Coinos</button>
          </div>

          <!-- Content -->
          <div v-if="activeWallet === 'wos'" class="space-y-2 text-sm md:text-base text-text-secondary">
            <p class="font-medium text-text-primary">Wallet of Satoshi (walletofsatoshi.com)</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>
                앱 설치하기
                <a href="https://walletofsatoshi.com/#download" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-500 underline dark:text-blue-400 dark:hover:text-blue-300">walletofsatoshi.com</a>
              </li>
              <li>받기 (Receive)를 누르고 Lightning Address를 확인합니다.</li>
              <li>주소 형식: <code class="font-mono">name@walletofsatoshi.com</code></li>
            </ol>
       
          </div>

          <div v-else-if="activeWallet === 'strike'" class="space-y-2 text-sm md:text-base text-text-secondary">
            <p class="font-medium text-text-primary">Strike (strike.me)</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>
                앱 설치하기
                <a href="https://strike.me" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-500 underline dark:text-blue-400 dark:hover:text-blue-300">strike.me</a>
              </li>
              <li>프로필에서 사용자명을 확인합니다.</li>
              <li>주소 형식: <code class="font-mono">username@strike.me</code></li>
            </ol>

          </div>

          <div v-else class="space-y-2 text-sm md:text-base text-text-secondary">
            <p class="font-medium text-text-primary">Coinos (coinos.io)</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>
                사이트 방문 후 가입: 
                <a href="https://coinos.io" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-500 underline dark:text-blue-400 dark:hover:text-blue-300">coinos.io</a>
              </li>
              <li>받기 (Receive)를 누르고 Lightning Address를 확인합니다.</li>
              <li>주소 형식: <code class="font-mono">you@coinos.io</code></li>
            </ol>
          </div>
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
  const showWalletGuide = ref(false)
  const activeWallet = ref<'wos' | 'strike' | 'coinos'>('wos')

// Form data
const formData = reactive({
  username: '',
  email: '',
  lightning_address: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// Form errors
const formErrors = reactive({
  username: '',
  email: '',
  lightning_address: '',
  password: '',
  confirmPassword: '',
  agreeTerms: ''
})

// Clear form errors
function clearErrors() {
  formErrors.username = ''
  formErrors.email = ''
  formErrors.lightning_address = ''
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

  // Validate lightning address (required)
  if (!formData.lightning_address.trim()) {
    formErrors.lightning_address = '라이트닝 주소를 입력해주세요'
    isValid = false
  } else {
    const la = formData.lightning_address.trim()
    // Basic validation: email-like lightning address or lnurl format
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(la)
    const isLnurl = /^lnurl[a-z0-9]+$/i.test(la)
    if (!emailLike && !isLnurl) {
      formErrors.lightning_address = '올바른 라이트닝 주소 형식이 아닙니다'
      isValid = false
    }
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
      lightning_address: formData.lightning_address.trim(),
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
