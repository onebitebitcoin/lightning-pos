<template>
  <div
    class="min-h-screen flex items-center justify-center bg-bg-secondary px-4"
  >
    <div class="bg-bg-primary rounded-2xl shadow-soft p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-text-primary">회원가입</h1>
        <p class="text-text-secondary">새로운 계정을 생성합니다.</p>
      </div>
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label
            for="username"
            class="block text-sm font-medium text-text-secondary mb-1"
            >사용자명</label
          >
          <input
            id="username"
            v-model="formData.username"
            type="text"
            required
            class="form-input"
          />
          <p v-if="formErrors.username" class="text-error text-sm mt-1">
            {{ formErrors.username }}
          </p>
        </div>
        <div>
          <label
            for="email"
            class="block text-sm font-medium text-text-secondary mb-1"
            >이메일</label
          >
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            class="form-input"
          />
          <p v-if="formErrors.email" class="text-error text-sm mt-1">
            {{ formErrors.email }}
          </p>
        </div>
        <div>
          <label
            for="password"
            class="block text-sm font-medium text-text-secondary mb-1"
            >비밀번호</label
          >
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            class="form-input"
          />
          <p v-if="formErrors.password" class="text-error text-sm mt-1">
            {{ formErrors.password }}
          </p>
        </div>
        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-medium text-text-secondary mb-1"
            >비밀번호 확인</label
          >
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            required
            class="form-input"
          />
          <p v-if="formErrors.confirmPassword" class="text-error text-sm mt-1">
            {{ formErrors.confirmPassword }}
          </p>
        </div>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="btn btn-primary w-full"
        >
          <span v-if="isSubmitting">가입하는 중...</span>
          <span v-else>회원가입</span>
        </button>
      </form>
      <div class="mt-6 text-center">
        <p class="text-sm text-text-secondary">
          이미 계정이 있으신가요?
          <router-link to="/login" class="text-primary hover:underline"
            >로그인</router-link
          >
        </p>
      </div>
    </div>

    <!-- Success Modal -->
    <div
      v-if="showSuccess"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
    >
      <div class="card p-8 max-w-sm w-full m-4 text-center" @click.stop>
        <div class="text-6xl mb-4 text-primary-500 flex justify-center">
          <UiIcon name="celebration" class="h-12 w-12" />
        </div>
        <h3 class="text-2xl font-semibold text-text-primary mb-2">
          회원가입 완료!
        </h3>
        <p class="text-text-secondary mb-6">{{ successMessage }}</p>
        <button @click="goToLogin" class="btn btn-primary w-full">
          로그인 페이지로 이동
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import UiIcon from "@/components/ui/Icon.vue";

const router = useRouter();
const authStore = useAuthStore();

const isSubmitting = ref(false);
const showSuccess = ref(false);
const successMessage = ref("");

// Form data
const formData = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
});

// Form errors
const formErrors = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeTerms: "",
});

// Clear form errors
function clearErrors() {
  formErrors.username = "";
  formErrors.email = "";
  formErrors.password = "";
  formErrors.confirmPassword = "";
  formErrors.agreeTerms = "";
}

// Validate form
function validateForm(): boolean {
  clearErrors();
  let isValid = true;

  // Validate username
  if (!formData.username.trim()) {
    formErrors.username = "사용자명을 입력해주세요";
    isValid = false;
  } else if (formData.username.trim().length < 3) {
    formErrors.username = "사용자명은 3글자 이상이어야 합니다";
    isValid = false;
  } else if (!/^[a-zA-Z0-9가-힣_]+$/.test(formData.username.trim())) {
    formErrors.username =
      "사용자명은 영문, 한글, 숫자, 언더스코어만 사용 가능합니다";
    isValid = false;
  }

  // Validate email
  if (!formData.email.trim()) {
    formErrors.email = "이메일을 입력해주세요";
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    formErrors.email = "올바른 이메일 형식이 아닙니다";
    isValid = false;
  }

  // Validate password
  if (!formData.password) {
    formErrors.password = "비밀번호를 입력해주세요";
    isValid = false;
  } else if (formData.password.length < 6) {
    formErrors.password = "비밀번호는 6글자 이상이어야 합니다";
    isValid = false;
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
    formErrors.password = "비밀번호는 영문과 숫자를 포함해야 합니다";
    isValid = false;
  }

  // Validate confirm password
  if (!formData.confirmPassword) {
    formErrors.confirmPassword = "비밀번호 확인을 입력해주세요";
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    formErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    isValid = false;
  }

  // Validate terms agreement
  if (!formData.agreeTerms) {
    formErrors.agreeTerms = "이용약관과 개인정보 처리방침에 동의해주세요";
    isValid = false;
  }

  return isValid;
}

// Handle registration
async function handleRegister() {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    const result = await authStore.register({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      password_confirm: formData.confirmPassword,
    });

    if (result.success) {
      successMessage.value = result.message;
      showSuccess.value = true;
    } else {
      // Handle validation errors
      if (result.errors) {
        const firstError = Object.values(result.errors)[0];
        if (Array.isArray(firstError)) {
          alert(firstError[0]);
        } else {
          alert(result.message);
        }
      } else {
        alert(result.message);
      }
    }
  } catch (error) {
    console.error("회원가입 오류:", error);
    alert("계정 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
  } finally {
    isSubmitting.value = false;
  }
}

// Go to login page
function goToLogin() {
  showSuccess.value = false;
  router.push("/login");
}
</script>
